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
