import { OPENAI_KEY } from '$env/static/private';
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';
import type { RequestHandler } from './$types';
import { getTokens } from '../../../lib/utils/tokenizer';
import { json } from '@sveltejs/kit';
import type { Config } from '@sveltejs/adapter-vercel';

export const config: Config = {
    runtime: 'edge'
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        if (!OPENAI_KEY) {
            throw new Error('OPENAI_KEY env variable not set');
        }

        const requestData = await request.json();

        if (!requestData) {
            throw new Error('No request data');
        }

        const reqMessages: ChatCompletionRequestMessage[] = requestData.messages;

        if (!reqMessages) {
            throw new Error('no messages provided');
        }

        let tokenCount = 0;

        reqMessages.forEach((msg) => {
            const tokens = getTokens(msg.content);
            tokenCount += tokens;
        });

        const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_KEY}`
            },
            method: 'POST',
            body: JSON.stringify({
                input: reqMessages[reqMessages.length - 1].content
            })
        });

        const moderationData = await moderationRes.json();
        const [results] = moderationData.results;

        if (results.flagged) {
            throw new Error('Query flagged by openai');
        }

        const prompt =
            'You are a virtual assistant for a company called Huntabyte. Your name is Axel Smith';
        tokenCount += getTokens(prompt);

        if (tokenCount >= 4000) {
            throw new Error('Query too large');
        }

        const messages: ChatCompletionRequestMessage[] = [
            { role: 'system', content: prompt },
            ...reqMessages
        ];

        const chatRequestOpts: CreateChatCompletionRequest = {
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.9,
            stream: true
        };

        const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            headers: {
                Authorization: `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(chatRequestOpts)
        });

        if (!chatResponse.ok) {
            const err = await chatResponse.json();
            throw new Error(err);
        }

        return new Response(chatResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream'
            }
        });
    } catch (err) {
        console.error(err);
        return json({ error: 'There was an error processing your request' }, { status: 500 });
    }
};
