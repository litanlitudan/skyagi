import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { GenerativeAgent } from '$lib/agent';
import { getResponseStream } from '$lib/utils';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const POST = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		conversation_id,
		initiate_agent_id,
		initiate_agent_model,
		recipient_agent_id,
		recipient_agent_model_settings,
		message
	} = await request.json();

	// get initiate agent name
	const { data: initiateAgentName } = await locals.supabase
		.from('agent')
		.select('name')
		.eq('id', initiate_agent_id);

	// create recipient agent
	const agent = new GenerativeAgent();

	await agent.setup(locals.supabase, conversation_id, recipient_agent_id, recipient_agent_model_settings, initiate_agent_id);

	// get reaction
	const newMessage = `${initiateAgentName[0].name} says ${message}`;
	const callToActionTemplate =
		`What would ${agent.name} say? To end the conversation, ` +
		`write: GOODBYE: "what to say". Otherwise to continue the conversation, write: SAY: "what to say next"\n\n`;

	const fullResult = await agent.generateRspn(newMessage, callToActionTemplate);
	const result = fullResult.trim().split('\n')[0];

	var respMsg: string = "";
	var ifContinue: boolean = false;
	if (result.includes('GOODBYE:')) {
		respMsg = result.split('GOODBYE:').pop()!.trim();
		ifContinue = false;
	} else if (result.includes('SAY:')) {
		respMsg = result.split('SAY:').pop()!.trim();
		ifContinue = true;
	}

	respMsg = respMsg.slice(respMsg.startsWith('"') ? 1 : 0, respMsg.endsWith('"') ? -1 : undefined);

	// update the message history
	await agent.addMessage(message, respMsg);

	// update recipient agent memory
	await agent.addMemory(`${agent.name} observed ${newMessage} and said ${respMsg}`);

	// return
	const respMetaData = {
		'success': 1,
		'if_continue': ifContinue
	}

	const headers = {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	};
	const stream = await getResponseStream(respMetaData, respMsg);
	return new Response(stream, { headers });
}) satisfies RequestHandler;
