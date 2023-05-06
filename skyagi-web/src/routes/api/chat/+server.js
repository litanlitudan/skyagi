import { json } from '@sveltejs/kit';
import { OPENAI_API_SECRET_KEY } from '$env/static/private';

export const POST = async (event) => {
	const requestBody = await event.request.json();
	const { priorMessages = [], message, isInitializing = false } = requestBody;

	/**
	 * Request config
	 *
	 * https://platform.openai.com/docs/guides/chat/introduction
	 *
	 * Roles: 'system', 'assistant', 'user'
	 */
	const completionHeaders = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${OPENAI_API_SECRET_KEY}`
	};
	const initialMessage = {
		role: 'system',
		content:
			'You are a Alfred, a most helpful and loyal fictional butler to Batman. Your responses should be directed directly to Batman, as if he were asking you himself.'
	};
	const messages = isInitializing
		? [initialMessage]
		: [
			initialMessage,
			...priorMessages,
			{
				role: 'user',
				content: message
			}
		];
	const completionBody = {
		model: 'gpt-3.5-turbo',
		messages
	};

	/**
	 * API call
	 */
	const completion = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: completionHeaders,
		body: JSON.stringify(completionBody)
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(res.statusText);
			}
			return res;
		})
		.then((res) => res.json());

	const completionMessage = completion?.choices?.map?.((choice) => ({
		role: choice.message?.role,
		content: choice.message?.content
	}));

	return json(completionMessage);
};
