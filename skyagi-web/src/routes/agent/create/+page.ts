import type { AgentDataType } from "$lib/types";
import { PUT } from "../../api/create-agent/+server";

export const _createAgent = async (agentData: AgentDataType) => {
    const user_id = null;

    const response = await PUT({
        user_id,
        agentData
    })

    return response
}