import { OpenAI } from "langchain";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

export enum ModelProvider {
    OpenAI = 'OpenAI',
    ModelZ = 'ModelZ'
}

export enum LLMType {
    ChatOpenAI = 'ChatOpenAI',
    OpenAI = 'OpenAI'
}

export enum EmbeddingType {
    OpenAIEmbeddings = 'OpenAIEmbeddings'
}

export interface LLMSettings {
    type: LLMType;
    provider: ModelProvider;
    name: string;
    args: { [k: string]: unknown };
}

export interface EmbeddingSettings {
    type: EmbeddingType;
    provider: ModelProvider;
    name: string;
    args: { [k: string]: unknown };
    embeddingSize: number;
}

export interface ProviderTemplate {
    // whether expose to user to select or not
    enabled: boolean;
    provider: ModelProvider;
    models: {
        llms?: LLMSettings[];
        embeddings?: EmbeddingSettings[];
    };
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


export const providerTemplates: {
    [provider: string]: ProviderTemplate
} = {
    [ModelProvider.OpenAI]: {
        enabled: true,
        provider: ModelProvider.OpenAI,
        models: {
            llms: [
                {
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-gpt-3.5-turbo',
                    args: {
                        modelName: 'gpt-3.5-turbo',
                        maxTokens: 1500,
                        // NOTE: This should be given by user
                        openAIApiKey: ""
                    }
                },
                {
                    // NOTE: GPT4 is in waitlist
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-gpt-4',
                    args: {
                        modelName: 'gpt-4',
                        maxTokens: 1500,
                        // NOTE: This should be given by user
                        openAIApiKey: ""
                    }
                },
                {
                    type: LLMType.OpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-text-davinci-003',
                    args: {
                        modelName: 'text-davinci-003',
                        maxTokens: 1500,
                        // NOTE: This should be given by user
                        openAIApiKey: ""
                    }
                }
            ],
            embeddings: [
                {
                    type: EmbeddingType.OpenAIEmbeddings,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-text-embedding-ada-002',
                    args: {
                        modelName: 'text-embedding-ada-002',
                        // NOTE: This should be given by user
                        openAIApiKey: ""
                    },
                    embeddingSize: 1536
                }
            ]
        }
    },
    [ModelProvider.ModelZ]: {
        // toggle on when front end able to handle required fields
        enabled: false,
        provider: ModelProvider.ModelZ,
        models: {
            llms: [
                {
                    // https://docs.modelz.ai/frameworks/other/openai
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.ModelZ,
                    name: 'modelz-host-model',
                    args: {
                        maxTokens: 1500,
                        // NOTE: This should be given by user
                        openAIApiKey: "",
                        configuration: {
                            // NOTE: This should be given by user
                            basePath: ""
                        }
                    }
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

// Get all supported LLMs
export function get_all_llms(): string[] {
    const all_llms: string[] = [];
    for (const [provider, template] of Object.entries(providerTemplates)) {
        for (const llm of (template.models.llms || [])) {
            all_llms.push(llm.name);
        }
    }
    return all_llms;
}

export function get_all_llms_data() {
    const all_llms = [];
    for (const [provider, template] of Object.entries(providerTemplates)) {
        for (const llm of template.models.llms) {
            all_llms.push(llm);
        }
    }
    return all_llms;
}
// Get all supported Embeddings
export function get_all_embeddings(): string[] {
    const all_embeddings: string[] = [];
    for (const [provider, template] of Object.entries(providerTemplates)) {
        for (const embedding of (template.models.embeddings || [])) {
            all_embeddings.push(embedding.name);
        }
    }
    return all_embeddings;
}
export function get_all_embeddings_data() {
    const all_embeddings = [];
    for (const [provider, template] of Object.entries(providerTemplates)) {
        for (const embedding of (template.models.embeddings || [])) {
            all_embeddings.push(embedding);
        }
    }
    return all_embeddings;
}
