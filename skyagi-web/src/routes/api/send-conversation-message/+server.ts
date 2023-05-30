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

	// get initiate agent name
	const { data: initiateAgentName } = await locals.supabase
		.from('agent')
		.select('name')
		.eq('id', initiate_agent_id);

    const { data: allMemories } = await locals.supabase
        .from('memory')
		.select('id, content, metadata')
		.contains('metadata', {"cur_status": "home"});
		//.eq('metadata->conversation_id', conversation_id);
		//.eq('metadata:agent_id', recipient_agent_id)
        //.order('metadata:create_time', { ascending: true });
	return new Response(JSON.stringify({"success": 1, "memory": allMemories}), { status: 200 });


	// create recipient agent
	const agent = new GenerativeAgent();
	await agent.setup(locals.supabase, conversation_id, recipient_agent_id, recipient_agent_model);
	//return new Response(JSON.stringify({"success": 1, "InitAgentName": initiateAgentName, "RecAgentName": agent.name}), { status: 200 });
	return new Response(JSON.stringify({"success": 1, "InitAgentName": initiateAgentName, "RecAgentName": agent.name, "RecAgentStatus": agent.status, "RecAgentMemLen": agent.memories.length}), { status: 200 });


	// get reaction
	const newMessage = `${initiateAgentName} says ${message}`;
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

	// update recipient agent memory
	agent.addMemory(`${agent.name} observed ${newMessage} and said ${respMsg}`);

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
