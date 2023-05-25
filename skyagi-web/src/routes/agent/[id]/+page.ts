import type { AgentDataType } from '$lib/types';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
    const { id } = params;

    const agentData = await fetchAgentData(id);

    return {
        body: agentData
    }

}) satisfies PageLoad;

async function fetchAgentData(id: string) {
    const agentData: AgentDataType = {
        name: 'Sheldon',
        age: '27',
        personalities: 'fun',
        socialStatus: 'single',
        memories: ['His best friend is Leonard.', 'He knows penny.']
    };

    return agentData
}
