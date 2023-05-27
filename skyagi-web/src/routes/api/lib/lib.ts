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
}
