export interface AgentDataType {
    id: string;
    name: string;
    age: string;
    personalities: string;
    socialStatus: string;
    memories: string[];
    avatarPath: string;
    archived?: boolean;
}

export enum TransactionStatus {
    SUCCESS = 'SUCCESS',
    PENDING = 'PENDING'
};
export interface MessageDataType {
    initiateAgentId: string;
    recipientAgentId: string;
    createTime: string;
    content: string;
}

export interface ConversationDataType {
    id: string;
    name: string;
    agents: AgentDataType[];
    userAgents: AgentDataType[];
    messages: MessageDataType[];
}

export enum StoreMessageRole {
    SYSTEM = "system",
    USER_AGENT = "user_agent",
    AGENT = "agent",
};

export interface StoreMessageType {
    // Both role and name are for the side who delivers this message
    role: StoreMessageRole;
    name: string;
    content: any; // could be error type so not set as just string 
}
