import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { GenerativeAgent } from '$lib/agent';
import { select_multiple_value } from 'svelte/internal';

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
		message
	} = await request.json();
	 
	const res = await locals.supabase.from('message').insert({
		conversation_id:   '6f74a64d-22a2-4472-a969-2b6851c6d4e1',
        agent_id: '24c15c9a-5c13-4ebf-b312-fcbc33cb6eab',
		recipient_agent_id:'e8b2985d-f291-4e00-be44-b19ff92ef290',
        creat_time: '2023-05-31T21:20:37.977Z',
		content:'C observed A says how is the hospital?'
	})
	return new Response(JSON.stringify(res), { status: 200 });

	// get initiate agent name
	const { data: initiateAgentName } = await locals.supabase
		.from('agent')
		.select('name')
		.eq('id', initiate_agent_id);

	// create recipient agent
	const agent = new GenerativeAgent();
	await agent.setup(locals.supabase, conversation_id, recipient_agent_id, recipient_agent_model, initiate_agent_id);

	// get reaction
	const newMessage = `${initiateAgentName[0].name} says ${message}`;
	const callToActionTemplate =
		`What would ${agent.name} say? To end the conversation, ` +
		`write: GOODBYE: "what to say". Otherwise to continue the conversation, write: SAY: "what to say next"\n\n`;

	const fullResult = await agent.generateRspn(locals.supabase, newMessage, callToActionTemplate);
	return new Response(JSON.stringify(fullResult), { status: 200 });
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

	// update recipient agent memory
	await agent.addMemory(`${agent.name} observed ${newMessage} and said ${respMsg}`);

	// return
	const resp = {
		'success': 1,
		'resp_msg': {
			'if_continue': ifContinue,
			'message': respMsg
		}
	}
	return new Response(JSON.stringify(resp), { status: 200 });
}) satisfies RequestHandler;
