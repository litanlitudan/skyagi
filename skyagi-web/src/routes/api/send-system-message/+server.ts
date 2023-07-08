import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity, getResponseStream } from '$lib/utils';
import { AIMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts"
import { LLMChain } from "langchain/chains";
import { load_llm_from_config } from '$lib/model/model';

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
        start_time
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
        const { data: initiate_agent_name } = await locals.supabase
            .from('agent')
            .select('name')
            .eq('id', m.agent_id);
        const { data: recipient_agent_name } = await locals.supabase
            .from('agent')
            .select('name')
            .eq('id', m.recipient_agent_id);

        observation += (initiate_agent_name[0].name + " told " + recipient_agent_name[0].name + ": " + m.content + "\n")
    }

    let instruct = 'Here are the timeline of events happened for these NPC characters:\n{observation}\n';
    instruct += 'I want you to behave as {initiator_name} and talk to me as I am {recipient_name}.\n';
    instruct += 'If you do not want to or can not talk to {recipient_name}, just output NOTHING';

    const chatMessages = [
        SystemMessagePromptTemplate.fromTemplate(
            'You are the AI behind a NPC character called {initiator_name}'
        ),
        HumanMessagePromptTemplate.fromTemplate(instruct)
    ];

    const llm = load_llm_from_config(recipient_agent_model_settings.llm);

    const respChain = new LLMChain({ llm: llm, prompt: ChatPromptTemplate.fromPromptMessages(chatMessages) });
    const respChainRes = await respChain.call({
        observation: observation,
        initiator_name: initiator_name,
        recipient_name: recipient_name
    });
    let msgResp = respChainRes.text.trim();

    if (msgResp.includes('NOTHING')) {
        return new Response(JSON.stringify({ 'success': 1, 'is_valid': false, 'message': '' }), { status: 200 });
    }

    chatMessages.push(AIMessagePromptTemplate.fromTemplate(msgResp));
    chatMessages.push(
        HumanMessagePromptTemplate.fromTemplate(
            'Did {initiator_name} talk to {recipient_name}, please answer yes or no'
        )
    );

    const validationChain = new LLMChain({
        llm: llm,
        prompt: ChatPromptTemplate.fromPromptMessages(chatMessages)
    });
    const validationChainRes = await validationChain.call({
        observation: observation,
        initiator_name: initiator_name,
        recipient_name: recipient_name
    });
    const validationResp = validationChainRes.text.trim();

    if (validationResp.includes('no')) {
        return new Response(JSON.stringify({ 'success': 1, 'is_valid': false, 'message': '' }), { status: 200 });
    }

    msgResp = msgResp.slice(msgResp.startsWith('"') ? 1 : 0, msgResp.endsWith('"') ? -1 : undefined);

    const respMetaData = {
        'success': 1,
        'is_valid': true 
    }

    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    };
    const stream = await getResponseStream(respMetaData, msgResp);
    return new Response(stream, {headers});

}) satisfies RequestHandler;
