import { OpenAI } from "langchain";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

export enum ModelProvider {
    OpenAI = 'OpenAI'
}

export enum LLMType {
    ChatOpenAI = 'ChatOpenAI',
    OpenAI = 'OpenAI'
}

export enum EmbeddingType {
    OpenAIEmbeddings = 'OpenAIEmbeddings'
}

export interface LLMSettings {
    type: LLMType,
    provider: ModelProvider,
    name: string,
    args: { [k: string]: unknown }
}

export interface EmbeddingSettings {
    type: EmbeddingType,
    provider: ModelProvider,
    name: string,
    args: { [k: string]: unknown },
    embeddingSize: number
}

// LLM/Chat models registry
export const llm_type_to_cls_dict = {
    [LLMType.ChatOpenAI]: ChatOpenAI,
    [LLMType.OpenAI]: OpenAI,
};

// Embedding models registry
export const embedding_type_to_cls_dict = {
    [EmbeddingType.OpenAIEmbeddings]: OpenAIEmbeddings,
};


export const providerTemplates = {
    [ModelProvider.OpenAI]: {
        provider: ModelProvider.OpenAI,
        models: {
            llms: [
                {
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-gpt-3.5-turbo',
                    args: {
                        modelName: 'gpt-3.5-turbo',
                        maxTokens: 1500
                    }
                },
                {
                    // NOTE: GPT4 is in waitlist
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-gpt-4',
                    args: {
                        modelName: 'gpt-4',
                        maxTokens: 1500
                    }
                },
                {
                    type: LLMType.OpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-text-davinci-003',
                    args: {
                        modelName: 'text-davinci-003',
                        maxTokens: 1500
                    }
                }
            ],
            embeddings: [
                {
                    type: EmbeddingType.OpenAIEmbeddings,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-text-embedding-ada-002',
                    args: {
                        modelName: 'text-embedding-ada-002'
                    },
                    embeddingSize: 1536
                }
            ]
        }
    }
}

export function load_llm_from_config(config: LLMSettings) {
    const config_type = config.type;
    if (!(config_type in llm_type_to_cls_dict)) {
        throw new Error(`Loading ${config_type} type LLM not supported`);
    }

    const cls = llm_type_to_cls_dict[config_type];
    return new cls(config.args);
}

export function load_embedding_from_config(config: EmbeddingSettings) {
    const config_type = config.type;
    if (!(config_type in embedding_type_to_cls_dict)) {
        throw new Error(`Loading ${config_type} type Embedding not supported`);
    }

    const cls = embedding_type_to_cls_dict[config_type];
    return new cls(config.args);
}
