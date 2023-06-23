export interface CharacterType {
    image: string;
    name: string;
    title: string;
    description: string;
}

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
