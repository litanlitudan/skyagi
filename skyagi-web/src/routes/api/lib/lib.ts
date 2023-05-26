function interview_agent(agent: GenerativeAgent, message: string, username: string): string {
	const new_message: string = `${username} says ${message}`;
	return agent.generate_dialogue_response(new_message)[1];
}

function talks_to(
	initiator: GenerativeAgent,
	recipient: GenerativeAgent,
	observations: string[]
): string {
	let instruct =
		'Here are the timeline of events happened for these NPC characters:\n{observation}\n';
	instruct += 'I want you to behave as {initiator_name} and talk to me as I am {recipient_name}.\n';
	instruct += 'If you do not want to or can not talk to {recipient_name}, just output NOTHING';

	const messages = [
		SystemMessagePromptTemplate.from_template(
			'You are the AI behind a NPC character called {initiator_name}'
		),
		HumanMessagePromptTemplate.from_template(instruct)
	];

	const observation = observations.join('\n');

	const message = LLMChain(
		(llm = initiator.llm),
		(prompt = ChatPromptTemplate.from_messages(messages))
	)
		.run({
			observation: observation,
			initiator_name: initiator.name,
			recipient_name: recipient.name
		})
		.strip();

	if (message.includes('NOTHING')) {
		return '';
	}

	messages.push(AIMessagePromptTemplate.from_template(message));
	messages.push(
		HumanMessagePromptTemplate.from_template(
			'Did {initiator_name} talk to {recipient_name}, please answer yes or no'
		)
	);

	const resp = LLMChain(
		(llm = initiator.llm),
		(prompt = ChatPromptTemplate.from_messages(messages))
	)
		.run({
			observation: observation,
			initiator_name: initiator.name,
			recipient_name: recipient.name
		})
		.strip();

	if (resp.includes('no')) {
		return '';
	}

	return message;
}

import { BaseModel } from 'path/to/BaseModel';
import { Optional, Field } from 'path/to/pydantic';

class GenerativeAgent extends BaseModel {
	name: string;
	age: number;
	traits: string;
	status: string;
	llm: BaseLanguageModel;
	memory_retriever: TimeWeightedVectorStoreRetriever;
	verbose: boolean = false;

	reflection_threshold?: number;
	summary: string = '';
	summary_refresh_seconds: number = 3600;
	last_refreshed: Date = new Date();
	daily_summaries: string[] = [];
	memory_importance: number = 0.0;
	max_tokens_limit: number = 1200;

	static Config = {
		arbitrary_types_allowed: true
	};

	static _parse_list(text: string): string[] {
		const lines = text.trim().split('\n');
		return lines.map(line => line.replace(/^\s*\d+\.\s*/, '').trim());
	}

	_compute_agent_summary(): string {
		const prompt = PromptTemplate.from_template(
			`How would you summarize ${this.name}'s core characteristics given the` +
				` following statements:\n` +
				`${related_memories}` +
				`Do not embellish.` +
				`\n\nSummary: `
		);
		const relevant_memories = this.fetch_memories(`${this.name}'s core characteristics`);
		const relevant_memories_str = relevant_memories.map(mem => mem.page_content).join('\n');
		const chain = LLMChain(this.llm, prompt, this.verbose);
		return chain.run({ name: this.name, related_memories: relevant_memories_str }).trim();
	}

	_get_topics_of_reflection(last_k: number = 50): [string, string, string] {
		const prompt = PromptTemplate.from_template(
			`{observations}\n\n` +
				`Given only the information above, what are the 3 most salient` +
				` high-level questions we can answer about the subjects in the statements?` +
				` Provide each question on a new line.\n\n`
		);
		const reflection_chain = LLMChain(
			(llm = this.llm),
			(prompt = prompt),
			(verbose = this.verbose)
		);
		const observations = this.memory_retriever.memory_stream.slice(-last_k);
		const observation_str = observations.map(o => o.page_content).join('\n');
		const result = reflection_chain.run({ observations: observation_str });
		return this._parse_list(result);
	}

	_get_insights_on_topic(topic: string): string[] {
		const prompt = PromptTemplate.from_template(
			`Statements about ${topic}\n` +
				`{related_statements}\n\n` +
				`What 5 high-level insights can you infer from the above statements?` +
				` (example format: insight (because of 1, 5, 3))`
		);
		const related_memories = this.fetch_memories(topic);
		const related_statements = related_memories
			.map((memory, i) => `${i + 1}. ${memory.page_content}`)
			.join('\n');
		const reflection_chain = LLMChain(
			(llm = this.llm),
			(prompt = prompt),
			(verbose = this.verbose)
		);
		const result = reflection_chain.run({ topic: topic, related_statements: related_statements });
		// TODO: Parse the connections between memories and insights
		return this._parse_list(result);
	}

	pause_to_reflect(): string[] {
		console.log(colored(`Character ${this.name} is reflecting`, 'blue'));
		const new_insights: string[] = [];
		const topics = this._get_topics_of_reflection();
		for (const topic of topics) {
			const insights = this._get_insights_on_topic(topic);
			for (const insight of insights) {
				this.add_memory(insight);
			}
			new_insights.push(...insights);
		}
		return new_insights;
	}

	_score_memory_importance(memory_content: string, weight: number = 0.15): number {
		const prompt = PromptTemplate.from_template(
			`On the scale of 1 to 10, where 1 is purely mundane` +
				` (e.g., brushing teeth, making bed) and 10 is` +
				` extremely poignant (e.g., a break up, college` +
				` acceptance), rate the likely poignancy of the` +
				` following piece of memory. Respond with a single integer.` +
				`\nMemory: {memory_content}` +
				`\nRating: `
		);
		const chain = LLMChain((llm = this.llm), (prompt = prompt), (verbose = this.verbose));
		const score = chain.run({ memory_content: memory_content }).trim();
		const match = score.match(/^\D*(\d+)/);
		if (match) {
			return (parseFloat(match[1]) / 10) * weight;
		} else {
			return 0.0;
		}
	}

	add_memory(memory_content: string): string[] {
		const importance_score = this._score_memory_importance(memory_content);
		this.memory_importance += importance_score;
		const document = new Document({
			page_content: memory_content,
			metadata: { importance: importance_score }
		});
		const result = this.memory_retriever.add_documents([document]);

		if (
			this.reflection_threshold !== null &&
			this.memory_importance > this.reflection_threshold &&
			this.status !== 'Reflecting'
		) {
			const old_status = this.status;
			this.status = 'Reflecting';
			this.pause_to_reflect();
			this.memory_importance = 0.0;
			this.status = old_status;
		}

		return result;
	}

	fetch_memories(observation: string): Document[] {
		return this.memory_retriever.get_relevant_documents(observation);
	}

	get_summary(force_refresh: boolean = false): string {
		const current_time = new Date();
		const since_refresh = (current_time - this.last_refreshed) / 1000;

		if (!this.summary || since_refresh >= this.summary_refresh_seconds || force_refresh) {
			this.summary = this._compute_agent_summary();
			this.last_refreshed = current_time;
		}

		return (
			`Name: ${this.name} (age: ${this.age})` +
			`\nInnate traits: ${this.traits}` +
			`\n${this.summary}`
		);
	}

	get_full_header(force_refresh: boolean = false): string {
		const summary = this.get_summary({ force_refresh: force_refresh });
		const current_time_str = new Date().toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});
		return `${summary}\nIt is ${current_time_str}.\n${this.name}'s status: ${this.status}`;
	}

	_get_entity_from_observation(observation: string): string {
		const prompt = PromptTemplate.from_template(
			`What is the observed entity in the following observation? ${observation}` + `\nEntity=`
		);
		const chain = LLMChain((llm = this.llm), (prompt = prompt), (verbose = this.verbose));
		return chain.run({ observation: observation }).trim();
	}

	_get_entity_action(observation: string, entity_name: string): string {
		const prompt = PromptTemplate.from_template(
			`What is the {entity} doing in the following observation? ${observation}` +
				`\nThe {entity} is`
		);
		const chain = LLMChain((llm = this.llm), (prompt = prompt), (verbose = this.verbose));
		return chain.run({ entity: entity_name, observation: observation }).trim();
	}

	_format_memories_to_summarize(relevant_memories: Document[]): string {
		const content_strs = new Set<string>();
		const content: string[] = [];

		for (const mem of relevant_memories) {
			if (content_strs.has(mem.page_content)) {
				continue;
			}

			content_strs.add(mem.page_content);
			const created_time = mem.metadata.created_at.toLocaleString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: true
			});

			content.push(`- ${created_time}: ${mem.page_content.trim()}`);
		}

		return content.join('\n');
	}

	summarize_related_memories(observation: string): string {
		const entity_name = this._get_entity_from_observation(observation);
		const entity_action = this._get_entity_action(observation, entity_name);
		const q1 = `What is the relationship between ${this.name} and ${entity_name}`;
		let relevant_memories = this.fetch_memories(q1);
		const q2 = `${entity_name} is ${entity_action}`;
		relevant_memories += this.fetch_memories(q2);

		const context_str = this._format_memories_to_summarize(relevant_memories);
		const prompt = PromptTemplate.from_template(
			`${q1}?\nContext from memory:\n${context_str}\nRelevant context: `
		);

		const chain = LLMChain((llm = this.llm), (prompt = prompt), (verbose = this.verbose));
		return chain.run({ q1: q1, context_str: context_str.trim() }).trim();
	}

	_get_memories_until_limit(consumed_tokens: number): string {
		const result: string[] = [];

		for (const doc of this.memory_retriever.memory_stream.slice().reverse()) {
			if (consumed_tokens >= this.max_tokens_limit) {
				break;
			}

			consumed_tokens += this.llm.get_num_tokens(doc.page_content);

			if (consumed_tokens < this.max_tokens_limit) {
				result.push(doc.page_content);
			}
		}

		return result.reverse().join('; ');
	}

	_generate_reaction(observation: string, suffix: string): string {
		const prompt = PromptTemplate.from_template(
			'{agent_summary_description}' +
				'\nIt is {current_time}.' +
				"\n{agent_name}'s status: {agent_status}" +
				"\nSummary of relevant context from {agent_name}'s memory:" +
				'\n{relevant_memories}' +
				'\nMost recent observations: {recent_observations}' +
				'\nObservation: {observation}' +
				'\n\n' +
				suffix
		);

		const agent_summary_description = this.get_summary();
		const relevant_memories_str = this.summarize_related_memories(observation);
		const current_time_str = new Date().toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});

		const kwargs = {
			agent_summary_description,
			current_time: current_time_str,
			relevant_memories: relevant_memories_str,
			agent_name: this.name,
			observation,
			agent_status: this.status
		};

		const consumed_tokens = this.llm.get_num_tokens(
			prompt.format({ recent_observations: '', ...kwargs })
		);
		kwargs.recent_observations = this._get_memories_until_limit(consumed_tokens);

		const action_prediction_chain = LLMChain((llm = this.llm), (prompt = prompt));
		const result = action_prediction_chain.run(kwargs);
		return result.trim();
	}
	generate_reaction(observation: string): [boolean, string] {
		const call_to_action_template =
			`Should ${this.name} react to the observation, and if so, ` +
			`what would be an appropriate reaction? Respond in one line. ` +
			`If the action is to engage in dialogue, write:\nSAY: "what to say"` +
			`\notherwise, write:\nREACT: ${this.name}'s reaction (if anything).` +
			`\nEither do nothing, react, or say something but not both.\n\n`;

		const full_result = this._generate_reaction(observation, call_to_action_template);
		const result = full_result.trim().split('\n')[0];
		this.add_memory(`${this.name} observed ${observation} and reacted by ${result}`);

		if (result.includes('REACT:')) {
			const reaction = result.split('REACT:').pop()!.trim();
			return [false, `${this.name} ${reaction}`];
		} else if (result.includes('SAY:')) {
			const said_value = result.split('SAY:').pop()!.trim();
			return [true, `${this.name} said ${said_value}`];
		} else {
			return [false, result];
		}
	}

	generate_dialogue_response(observation: string): [boolean, string] {
		const call_to_action_template =
			`What would ${this.name} say? To end the conversation, ` +
			`write: GOODBYE: "what to say". Otherwise to continue the conversation, write: SAY: "what to say next"\n\n`;

		const full_result = this._generate_reaction(observation, call_to_action_template);
		const result = full_result.trim().split('\n')[0];

		if (result.includes('GOODBYE:')) {
			const farewell = result.split('GOODBYE:').pop()!.trim();
			this.add_memory(`${this.name} observed ${observation} and said ${farewell}`);
			return [false, `${this.name} said ${farewell}`];
		} else if (result.includes('SAY:')) {
			const response_text = result.split('SAY:').pop()!.trim();
			this.add_memory(`${this.name} observed ${observation} and said ${response_text}`);
			return [true, `${this.name} said ${response_text}`];
		} else {
			return [false, result];
		}
	}
}
