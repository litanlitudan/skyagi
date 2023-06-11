from enum import Enum


class ModelProvider(str, Enum):
    OpenAI = "OpenAI"


class LLMType(str, Enum):
    ChatOpenAI = "openai-chat"
    OpenAI = "openai"


class EmbeddingType(str, Enum):
    OpenAIEmbeddings = "openai-embeddings"
