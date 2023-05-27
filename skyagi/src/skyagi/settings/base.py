from pathlib import Path
from typing import Any, Dict, Optional, Type

from pydantic import BaseModel, BaseSettings, Extra, Field, create_model

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


# ---------------------------------------------------------------------------- #
#                                  Credentials                                 #
# ---------------------------------------------------------------------------- #
class OpenAICredentials(BaseSettings):
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")


provider_to_crendentials_type: dict[ModelProvider, Type[BaseModel]] = {
    ModelProvider.OpenAI: OpenAICredentials
}

CredentialsSettings = create_model(
    "CredentialsSettings",
    **{key.value: value() for key, value in provider_to_crendentials_type.items()}
)


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
