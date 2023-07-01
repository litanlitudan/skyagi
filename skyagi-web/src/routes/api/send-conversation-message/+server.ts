import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { GenerativeAgent } from '$lib/agent';
import { getResponseStream } from '$lib/utils';
import { OPENAI_API_KEY } from '$env/static/private';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const POST = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	console.log('inside of send-conversation-message');
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

	recipient_agent_model_settings.llm.args.openAIApiKey = OPENAI_API_KEY;
	recipient_agent_model_settings.embedding.args.openAIApiKey = OPENAI_API_KEY;
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

	// return
	const respMetaData = {
		'success': 1,
		'if_continue': ifContinue
	}

	const stream = await getResponseStream(respMetaData, respMsg);
	console.log('look!!!!', new Response(stream));
	return new Response(stream);
}) satisfies RequestHandler;
