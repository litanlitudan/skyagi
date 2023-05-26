import os
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Type, Mapping

from pydantic import BaseModel, BaseSettings, Extra, Field, create_model
from pydantic.env_settings import EnvSettingsSource
from skyagi.constants import ModelProvider


def json_config_settings_source(settings: BaseSettings) -> Dict[str, Any]:
    from skyagi.util import load_json

    # Load settings from JSON config file
    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        return {}
    config_file = Path(config_dir, "config.json")
    return load_json(config_file)


class LLMSettings(BaseModel):
    """
    LLM/ChatModel related settings
    """

    type: str
    provider: str
    name: str
    args: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        extra = Extra.allow


class EmbeddingSettings(BaseModel):
    """
    Embedding related settings
    """

    type: str
    provider: str
    name: str
    args: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        extra = Extra.allow


class ModelSettings(BaseModel):
    """
    Model related settings
    """

    llm: LLMSettings
    embedding: EmbeddingSettings

    class Config:
        extra = Extra.allow
        
# class CredentialsSettings(BaseSettings):
#     ModelProvider.OpenAI = 

class OpenAICredentials(BaseSettings):
    openai_api_key: Optional[str] = Field(default=None, env='OPENAI_API_KEY')
    openai_api_base: Optional[str]= Field(default=None, env='OPENAI_API_BASE')
    openai_organization: Optional[str] = Field(default=None, env='OPENAI_ORGANIZATION')
    
    # TODO: (kejiez) maybe not needed
    @classmethod
    def get_env_keys(cls) -> list[str]:
        return ["OPENAI_API_KEY", "OPENAI_API_BASE", "OPENAI_ORGANIZATION"]
    
provider_to_crendentials_type: dict[ModelProvider, Type[BaseModel]] = {
    ModelProvider.OpenAI: OpenAICredentials
}

CredentialsSettings = create_model('CredentialsSettings', **{key.value: value() for key, value in provider_to_crendentials_type.items() })
        
class CustomEnvSettingsSource(EnvSettingsSource):
    def __call__(self, settings: BaseSettings) -> Dict[str, Any]:
        env_settings = super().__call__(settings=settings)
        
        # put provider credentials to settings "credentials" field
        for provider, creds_type in provider_to_crendentials_type:
            if not settings.get("credentials", None):
                settings["credentials"] = dict()
            settings["credentials"][provider] = provider_to_crendentials_type.get(provider)()
        
        return env_settings

class Settings(BaseSettings):
    """
    Root settings
    """
    model: Optional[ModelSettings] = None
    credentials = CredentialsSettings()

    class Config:
        env_file_encoding = "utf-8"
        extra = Extra.allow

        @classmethod
        def customise_sources(
            cls,
            init_settings,
            env_settings,
            file_secret_settings,
        ):
            return (
                init_settings,
                env_settings,
                json_config_settings_source,
                file_secret_settings,
            )

# ---------------------------------------------------------------------------- #
#                             Preset configurations                            #
# ---------------------------------------------------------------------------- #
# class OpenAIGPT4Settings(ModelSettings):
#     # NOTE: GPT4 is in waitlist
#     type = "openai-gpt-4"
#     llm = LLMSettings(type=LLMType.ChatOpenAI, provider=ModelProvider.OpenAI, model="gpt-4", max_tokens=1500)
#     embedding = EmbeddingSettings(type=EmbeddingType.OpenAIEmbeddings)


# class OpenAIGPT3_5TurboSettings(ModelSettings):
#     type = "openai-gpt-3.5-turbo"
#     llm = LLMSettings(type=LLMType.ChatOpenAI, provider=ModelProvider.OpenAI, model="gpt-3.5-turbo", max_tokens=1500)
#     embedding = EmbeddingSettings(type=EmbeddingType.OpenAIEmbeddings)


# class OpenAIGPT3_5TextDavinci003Settings(ModelSettings):
#     type = "openai-gpt-3.5-text-davinci-003"
#     llm = LLMSettings(LLMType.OpenAI, provider=ModelProvider.OpenAI, model_name="text-davinci-003", max_tokens=1500)
#     embedding = EmbeddingSettings(type=EmbeddingType.OpenAIEmbeddings)


# # ------------------------- Model settings registry ------------------------ #
# model_setting_type_to_cls_dict: Dict[str, Type[ModelSettings]] = {
#     "openai-gpt-3.5-turbo": OpenAIGPT3_5TurboSettings,
#     "openai-gpt-3.5-text-davinci-003": OpenAIGPT3_5TextDavinci003Settings,
# }


# def load_model_setting(type: str) -> ModelSettings:
#     if type not in model_setting_type_to_cls_dict:
#         raise ValueError(f"Loading {type} setting not supported")

#     cls = model_setting_type_to_cls_dict[type]
#     return cls()


# def get_all_model_settings() -> List[str]:
#     """Get all supported Embeddings"""
#     return list(model_setting_type_to_cls_dict.keys())
        
    #     {
    #     "crendentials": {
    #         "openai_api_key": "",
    #     },
    #     "models": {
    #         "llms": [
    #             {
    #                 "type": LLMType.ChatOpenAI,
    #                 "name": "gpt-3.5-turbo",
    #                 "args": {
    #                     "model_name": "gpt-3.5-turbo",
    #                     "max_tokens": 1500   
    #                 }
    #             },
    #             {
    #                 "type": LLMType.ChatOpenAI,
    #                 "name": "gpt-3.5-turbo",
    #                 "args": {
    #                     "model_name": "gpt-4",
    #                     "max_tokens": 1500   
    #                 }
    #             }
    #         ]
    #     }
    # }
