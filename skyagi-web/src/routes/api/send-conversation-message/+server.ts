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
        recipient_agent_model_settings,
        message
    } = await request.json();

    /*************************** */
    const { data: allMemories } = await locals.supabase
        .from('memory')
		.select('id, content, embedding, metadata')
		.contains('metadata',{"conversation_id": conversation_id})
		.contains('metadata',{"agent_id": recipient_agent_id})
        .order('metadata->create_time', { ascending: true });
    return new Response(JSON.stringify({"cid": conversation_id, "aid": recipient_agent_id}), { status: 200 });
    /*************************** */


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
    return new Response(JSON.stringify(result), { status: 200 });

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
    const resp = {
        'success': 1,
        'resp_msg': {
            'if_continue': ifContinue,
            'message': respMsg
        }
    }
    return new Response(JSON.stringify(resp), { status: 200 });
}) satisfies RequestHandler;
