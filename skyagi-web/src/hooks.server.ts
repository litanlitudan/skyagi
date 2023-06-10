// src/hooks.server.ts
import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createSupabaseServerClient({
        supabaseUrl: PUBLIC_SUPABASE_URL,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
        event
    });

    /**
     * A convenience helper so we can just call await getSession() instead const { data: { session } } = await supabase.auth.getSession()
     */
    event.locals.getSession = async () => {
        const {
            data: { session }
        } = await event.locals.supabase.auth.getSession();
        return session;
    };

    // TODO: (kejiez) fix this redirection
    // // Get the cookies from the request
    // const { cookies } = event;

    // // Get the user token from the cookie
    // const authToken = cookies.get('sb-auth-token');

    // // Redirect to homepage if authToken not found
    // // Caveat: Probably need a safer auth mechanism, e.g. using getSession()
    // if (!authToken && event.url.pathname !== '/') {
    //     // the user is not signed in
    //     throw redirect(303, '/')
    // }

    return resolve(event, {
        /**
         * There´s an issue with `filterSerializedResponseHeaders` not working when using `sequence`
         *
         * https://github.com/sveltejs/kit/issues/8061
         */
        filterSerializedResponseHeaders(name) {
            return name === 'content-range';
        }
    });
};
