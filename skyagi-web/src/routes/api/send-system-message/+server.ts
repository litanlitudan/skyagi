import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';
import { AIMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts"
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";

// TODO
// create LLM based on the parameters from the API call


// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		conversation_id,
		initiate_agent_id,
		initiate_agent_model,
		recipient_agent_id,
		recipient_agent_model,
		start_time,
		message
	} = await request.json();

	// get agent names
	const { data: initiator } = await locals.supabase
	    .from('agent')
		.select('name')
		.eq('id', initiate_agent_id);

	if (checkValidity(initiator) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'initiator not found' }), { status: 200 });
	}
	const initiator_name = initiator[0].name;

	const { data: recipient } = await locals.supabase
	    .from('agent')
		.select('name')
		.eq('id', recipient_agent_id);

	if (checkValidity(recipient) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'recipient not found' }), { status: 200 });
	}
	const recipient_name = recipient[0].name;

	// get time-windowed message/observation history
	const { data: message_history } = await locals.supabase
		.from('message')
		.select('agent_id, recipient_agent_id, create_time, content')
		.eq('conversation_id', conversation_id)
		.gte('create_time', start_time)
        .order('create_time', { ascending: true });

	if (checkValidity(message_history) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'messages not found' }), { status: 200 });
	}

	let observation = "";
	for (const m of message_history) {
		observation += (m + "\n");
	}

	/*
	let instruct = 'Here are the timeline of events happened for these NPC characters:\n{observation}\n';
	instruct += 'I want you to behave as {initiator_name} and talk to me as I am {recipient_name}.\n';
	instruct += 'If you do not want to or can not talk to {recipient_name}, just output NOTHING';
	*/
	let instruct = message;

	const chatMessages = [
		SystemMessagePromptTemplate.fromTemplate(
			'You are the AI behind a NPC character called {initiator_name}'
		),
		HumanMessagePromptTemplate.fromTemplate(instruct)
	];

	let llm = new ChatOpenAI();

	const respChain = new LLMChain({llm : llm, prompt: ChatPromptTemplate.fromPromptMessages(chatMessages)});
	const res = await respChain.call({
			observation: observation,
			initiator_name: initiator_name,
			recipient_name: recipient_name
		});
	const msgResp = res.trim();

	if (msgResp.includes('NOTHING')) {
		return new Response(JSON.stringify({ 'success': 1, 'resp_msg': {'is_valid': false, 'message':''} }), { status: 200 });
	}

	chatMessages.push(AIMessagePromptTemplate.fromTemplate(msgResp));
	chatMessages.push(
		HumanMessagePromptTemplate.fromTemplate(
			'Did {initiator_name} talk to {recipient_name}, please answer yes or no'
		)
	);

	const validationChain = new LLMChain({llm : llm,
		prompt : ChatPromptTemplate.fromPromptMessages(chatMessages)});
	const res2 = await validationChain.call({
			observation: observation,
			initiator_name: initiator_name,
			recipient_name: recipient_name
	});
	const validationResp = res2.trim();

	if (validationResp.includes('no')) {
		return new Response(JSON.stringify({ 'success': 1, 'resp_msg': {'is_valid': false, 'message':''} }), { status: 200 });
	}

	return new Response(JSON.stringify({ 'success': 1, 'resp_msg': {'is_valid': true, 'message': msgResp} }), { status: 200 });
}) satisfies RequestHandler;
