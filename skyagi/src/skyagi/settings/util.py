from .base import LLMSettings, EmbeddingSettings, Settings

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
    raise ValueError(f'Fail to find the {name} EmbeddingSettings from "provider_templates"')
        
def load_credentials_into_llm_settings(settings: Settings, llm_settings: LLMSettings) -> LLMSettings:
    new_llm_settings = llm_settings
    provider = llm_settings.provider
    all_credentials = settings.credentials
    if provider not in all_credentials or not all_credentials[provider]:
        raise ValueError(f"Did not find {provider} credentials in settings, please set them as environment variables, or run 'skyagi config credentials' to config.")
    
    # merge credentials into LLM settings args field
    new_llm_settings.args.update(**all_credentials[provider])
    return new_llm_settings

def load_credentials_into_embedding_settings(settings: Settings, embedding_settings: EmbeddingSettings) -> EmbeddingSettings:
    new_embedding_settings = embedding_settings
    provider = embedding_settings.provider
    all_credentials = settings.credentials
    if provider not in all_credentials or not all_credentials[provider]:
        raise ValueError(f"Did not find {provider} credentials in settings, please set them as environment variables, or run 'skyagi config credentials' to config.")
    
    # merge credentials into LLM settings args field
    new_embedding_settings.args.update(**all_credentials[provider])
    return new_embedding_settings
