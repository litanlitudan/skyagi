from typing import Dict, List, Type

from langchain import chat_models, embeddings, llms
from langchain.embeddings.base import Embeddings
from langchain.llms.base import BaseLanguageModel
from pydantic import BaseModel, Field

from skyagi.constants import EmbeddingType, LLMType, ModelProvider
from skyagi.settings import EmbeddingSettings, LLMSettings


class ModelTemplate(BaseModel):
    llms: List[LLMSettings] = Field(default_factory=list)
    embeddings: List[EmbeddingSettings] = Field(default_factory=list)


class ProviderTemplate(BaseModel):
    provider: ModelProvider
    models: ModelTemplate


provider_templates: Dict[ModelProvider, ProviderTemplate] = {
    ModelProvider.OpenAI: ProviderTemplate(
        provider=ModelProvider.OpenAI,
        models=ModelTemplate(
            llms=[
                LLMSettings(
                    type=LLMType.ChatOpenAI,
                    provider=ModelProvider.OpenAI,
                    name="openai-gpt-3.5-turbo",
                    args={"model_name": "gpt-3.5-turbo", "max_tokens": 1500},
                ),
                # NOTE: GPT4 is in waitlist
                LLMSettings(
                    type=LLMType.ChatOpenAI,
                    provider=ModelProvider.OpenAI,
                    name="openai-gpt-4",
                    args={"model_name": "gpt-4", "max_tokens": 1500},
                ),
                LLMSettings(
                    type=LLMType.OpenAI,
                    provider=ModelProvider.OpenAI,
                    name="openai-text-davinci-003",
                    args={"model_name": "text-davinci-003", "max_tokens": 1500},
                ),
            ],
            embeddings=[
                EmbeddingSettings(
                    type=EmbeddingType.OpenAIEmbeddings,
                    provider=ModelProvider.OpenAI,
                    name="openai-text-embedding-ada-002",
                    args={"model": "text-embedding-ada-002"},
                )
            ],
        ),
    )
}


def get_all_providers() -> List[str]:
    """Get all providers"""
    all_providers = []
    for provider, template in provider_templates.items():
        all_providers.append(provider)
    return all_providers


# ------------------------- LLM/Chat models registry ------------------------- #
llm_type_to_cls_dict: Dict[str, Type[BaseLanguageModel]] = {
    LLMType.ChatOpenAI: chat_models.ChatOpenAI,
    LLMType.OpenAI: llms.OpenAI,
}

# ------------------------- Embedding models registry ------------------------ #
embedding_type_to_cls_dict: Dict[str, Type[Embeddings]] = {
    EmbeddingType.OpenAIEmbeddings: embeddings.OpenAIEmbeddings
}


# ---------------------------------------------------------------------------- #
#                                LLM/Chat models                               #
# ---------------------------------------------------------------------------- #
def load_llm_from_config(config: LLMSettings) -> BaseLanguageModel:
    """Load LLM from Config."""
    config_dict = config.dict()
    config_type = config_dict.get("type")

    if config_type not in llm_type_to_cls_dict:
        raise ValueError(f"Loading {config_type} type LLM not supported")

    cls = llm_type_to_cls_dict[config_type]
    return cls(**config_dict["args"])


def load_llm_from_name(name: str):
    for provider, template in provider_templates.items():
        for llm in template.models.llms:
            if llm.name == name:
                config_type = llm.type
                if config_type not in llm_type_to_cls_dict:
                    raise ValueError(f"Loading {config_type} type LLM not supported")

                cls = llm_type_to_cls_dict[config_type]
                return cls(**llm.args)

    raise ValueError(f'Fail to find the {name} LLM from "provider_templates"')


def get_all_llm_settings_by_provider(provider: ModelProvider):
    if provider not in provider_templates:
        raise ValueError(f"Not registered {provider}")
    return list(provider_templates[provider].models.llms)


def get_all_llms() -> List[str]:
    """Get all supported LLMs"""
    all_llms = []
    for provider, template in provider_templates.items():
        for llm in template.models.llms:
            all_llms.append(llm.name)
    return all_llms


# ---------------------------------------------------------------------------- #
#                               Embeddings models                              #
# ---------------------------------------------------------------------------- #
def load_embedding_from_config(config: EmbeddingSettings) -> Embeddings:
    """Load Embedding from Config."""
    config_dict = config.dict()
    config_type = config_dict.get("type")

    if config_type not in embedding_type_to_cls_dict:
        raise ValueError(f"Loading {config_type} type Embedding not supported")

    cls = embedding_type_to_cls_dict[config_type]
    return cls(**config_dict["args"])


def load_embedding_from_name(name: str):
    for provider, template in provider_templates.items():
        for embedding in template.models.embeddings:
            if embedding.name == name:
                config_type = embedding.type
                if config_type not in embedding_type_to_cls_dict:
                    raise ValueError(
                        f"Loading {config_type} type Embedding not supported"
                    )

                cls = embedding_type_to_cls_dict[config_type]
                return cls(**embedding.args)

    raise ValueError(f'Fail to find the {name} Embedding from "provider_templates"')


def get_all_embeddings() -> List[str]:
    """Get all supported Embeddings"""
    all_embeddings = []
    for provider, template in provider_templates.items():
        for embedding in template.models.embeddings:
            all_embeddings.append(embedding.name)
    return all_embeddings
