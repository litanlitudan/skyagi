from typing import Any, Dict

from skyagi.constants import ModelProvider

from .base import (
    EmbeddingSettings,
    LLMSettings,
    Settings,
    provider_to_crendentials_type,
)


def load_llm_settings_template_from_name(name: str) -> LLMSettings:
    from skyagi.model import provider_templates

    for provider, template in provider_templates.items():
        for llm in template.models.llms:
            if llm.name == name:
                return llm
    raise ValueError(f'Fail to find the {name} LLMSettings from "provider_templates"')


def load_embedding_settings_template_from_name(name: str) -> EmbeddingSettings:
    from skyagi.model import provider_templates

    for provider, template in provider_templates.items():
        for embedding in template.models.embeddings:
            if embedding.name == name:
                return embedding
    raise ValueError(
        f'Fail to find the {name} EmbeddingSettings from "provider_templates"'
    )


def load_credentials_into_llm_settings(
    settings: Settings, llm_settings: LLMSettings
) -> LLMSettings:
    new_llm_settings = llm_settings
    provider = llm_settings.provider
    all_credentials_dict = settings.credentials.dict()
    if provider not in all_credentials_dict or not all_credentials_dict[provider]:
        raise ValueError(
            (
                f"Did not find {provider} credentials in settings, "
                f"please set them as environment variables, or run 'skyagi config credentials set' to config."
            )
        )

    # merge credentials into LLM settings args field
    new_llm_settings.args.update(**all_credentials_dict[provider])
    return new_llm_settings


def load_credentials_into_embedding_settings(
    settings: Settings, embedding_settings: EmbeddingSettings
) -> EmbeddingSettings:
    new_embedding_settings = embedding_settings
    provider = embedding_settings.provider
    all_credentials_dict = settings.credentials.dict()
    if provider not in all_credentials_dict or not all_credentials_dict[provider]:
        raise ValueError(
            (
                f"Did not find {provider} credentials in settings, "
                f"please set them as environment variables, or run 'skyagi config credentials set' to config."
            )
        )

    # merge credentials into LLM settings args field
    new_embedding_settings.args.update(**all_credentials_dict[provider])
    return new_embedding_settings


def get_provider_credentials_fields(provider: ModelProvider) -> list[str]:
    if provider not in provider_to_crendentials_type:
        raise ValueError(f"Not registered {provider}")
    return list(provider_to_crendentials_type.get(provider).__fields__.keys())


def get_provider_credentials(settings: Settings, provider: ModelProvider):
    all_credentials_dict = get_all_credentials(settings)
    if provider not in all_credentials_dict or not all_credentials_dict[provider]:
        raise ValueError(
            (
                f"Did not find {provider} credentials in settings, "
                f"please set them as environment variables, or run 'skyagi config credentials set' to config."
            )
        )
    return all_credentials_dict[provider]


def get_all_credentials(settings: Settings) -> Dict[str, Any]:
    return settings.credentials.dict()
