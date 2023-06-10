export enum ModelProvider {
    OpenAI = 'OpenAI'
}

export enum LLMType {
    ChatOpenAI = 'ChatOpenAI'
}

export enum EmbeddingType {
    OpenAIEmbeddings = 'OpenAIEmbeddings'
}

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
                        model_name: 'gpt-3.5-turbo',
                        max_tokens: 1500
                    }
                },
                {
                    // NOTE: GPT4 is in waitlist
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-gpt-4',
                    args: {
                        model_name: 'gpt-4',
                        max_tokens: 1500
                    }
                },
                {
                    type: LLMType.ChatOpenAI,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-text-davinci-003',
                    args: {
                        model_name: 'text-davinci-003',
                        max_tokens: 1500
                    }
                }
            ],
            embeddings: [
                {
                    type: EmbeddingType.OpenAIEmbeddings,
                    provider: ModelProvider.OpenAI,
                    name: 'openai-text-embedding-ada-002',
                    args: {
                        model: 'text-embedding-ada-002'
                    },
                    embedding_size: 1536
                }
            ]
        }
    }
}
