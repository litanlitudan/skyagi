import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { GenerativeAgent } from '$lib/agent';

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

	// get initiate agent name
	const { data: initiate_agent_name } = await locals.supabase
		.from('agent')
		.select('name')
		.eq('id', initiate_agent_id);

	// create recipient agent
	const agent = new GenerativeAgent(locals.supabase, conversation_id, recipient_agent_id, recipient_agent_model);

	// get reaction
	const new_message = `${initiate_agent_name} says ${message}`;
	const call_to_action_template =
		`What would ${agent.name} say? To end the conversation, ` +
		`write: GOODBYE: "what to say". Otherwise to continue the conversation, write: SAY: "what to say next"\n\n`;

	const full_result = agent.generateRspn(new_message, call_to_action_template);
	const result = full_result.trim().split('\n')[0];

	var resp_msg: string = "";
	var if_continue: boolean = false;
	if (result.includes('GOODBYE:')) {
		resp_msg = result.split('GOODBYE:').pop()!.trim();
		if_continue = false;
	} else if (result.includes('SAY:')) {
		resp_msg = result.split('SAY:').pop()!.trim();
		if_continue = true;
	}

	// update recipient agent memory
	agent.addMemory(`${agent.name} observed ${new_message} and said ${resp_msg}`);

	// return
	const resp = {
		'success': 1,
		'resp_msg': {
			'if_continue': if_continue,
			'message': resp_msg
		}
	}
	return new Response(JSON.stringify(resp), { status: 200 });
}) satisfies RequestHandler;
