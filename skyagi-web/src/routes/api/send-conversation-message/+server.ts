import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

const getresponse = (

) => {
	const new_message: string = `${username} says ${message}`;
	const call_to_action_template =
		`What would ${this.name} say? To end the conversation, ` +
		`write: GOODBYE: "what to say". Otherwise to continue the conversation, write: SAY: "what to say next"\n\n`;

	const full_result = this._generate_reaction(observation, call_to_action_template);
	const result = full_result.trim().split('\n')[0];

	if (result.includes('GOODBYE:')) {
		const farewell = result.split('GOODBYE:').pop()!.trim();
		this.add_memory(`${this.name} observed ${observation} and said ${farewell}`);
		return [false, `${this.name} said ${farewell}`];
	} else if (result.includes('SAY:')) {
		const response_text = result.split('SAY:').pop()!.trim();
		this.add_memory(`${this.name} observed ${observation} and said ${response_text}`);
		return [true, `${this.name} said ${response_text}`];
	} else {
		return [false, result];
	}
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
		.eq('id', recipient_agent_id);

	// create recipient agent

	// get reaction
	
	// update recipient agent memory

	// return

	return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
}) satisfies RequestHandler;
