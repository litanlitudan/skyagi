import os
from pathlib import Path
from typing import Any, Dict, Type

from pydantic import BaseModel, BaseSettings, Extra


def set_openai_token(token: str):
    from skyagi.util import set_json_value

    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        config_dir.mkdir(parents=True)
    config_file = Path(config_dir, "config.json")
    set_json_value(config_file, "openai_token", token)


def set_pinecone_token(token: str):
    from skyagi.util import set_json_value

    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        config_dir.mkdir(parents=True)
    config_file = Path(config_dir, "config.json")
    set_json_value(config_file, "openai_token", token)


def set_discord_token(token: str):
    from skyagi.util import set_json_value

    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        config_dir.mkdir(parents=True)
    config_file = Path(config_dir, "config.json")
    set_json_value(config_file, "discord_token", token)


def load_pinecone_token() -> str:
    from skyagi.util import load_json_value

    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        return ""
    config_file = Path(config_dir, "config.json")
    return load_json_value(config_file, "pinecone_token", "")


def load_openai_token() -> str:
    from skyagi.util import load_json_value

    if "OPENAI_API_KEY" in os.environ:
        return os.environ["OPENAI_API_KEY"]
    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        return ""
    config_file = Path(config_dir, "config.json")
    return load_json_value(config_file, "openai_token", "")


def load_discord_token() -> str:
    from skyagi.util import load_json_value

    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        return ""
    config_file = Path(config_dir, "config.json")
    return load_json_value(config_file, "discord_token", "")


def json_config_settings_source(settings: BaseSettings) -> dict[str, Any]:
    from skyagi.util import load_json

    # Load settings from JSON config file
    config_dir = Path(Path.home(), ".skyagi")
    if not config_dir.exists():
        return ""
    config_file = Path(config_dir, "config.json")
    return load_json(config_file)


class LLMSettings(BaseModel):
    """
    LLM/ChatModel related settings
    """

    type: str = "chatopenai"

    class Config:
        extra = Extra.allow


class EmbeddingSettings(BaseModel):
    """
    Embedding related settings
    """

    type: str = "openaiembeddings"

    class Config:
        extra = Extra.allow


class ModelSettings(BaseModel):
    """
    Model related settings
    """

    type: str = ""
    llm: LLMSettings = LLMSettings()
    embedding: EmbeddingSettings = EmbeddingSettings()

    class Config:
        extra = Extra.allow


class Settings(BaseSettings):
    """
    Root settings
    """

    name: str = "default"
    model: ModelSettings = ModelSettings()

    class Config:
        env_prefix = "skyagi_"
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
                json_config_settings_source,
                env_settings,
                file_secret_settings,
            )


# ---------------------------------------------------------------------------- #
#                             Preset configurations                            #
# ---------------------------------------------------------------------------- #
class OpenAIGPT4Settings(ModelSettings):
    # NOTE: GPT4 is in waitlist
    type = "openai-gpt-4"
    llm = LLMSettings(type="chatopenai", model="gpt-4", max_tokens=1500)
    embedding = EmbeddingSettings(type="openaiembeddings")


class OpenAIGPT3_5TurboSettings(ModelSettings):
    type = "openai-gpt-3.5-turbo"
    llm = LLMSettings(type="chatopenai", model="gpt-3.5-turbo", max_tokens=1500)
    embedding = EmbeddingSettings(type="openaiembeddings")


class OpenAIGPT3_5TextDavinci003Settings(ModelSettings):
    type = "openai-gpt-3.5-text-davinci-003"
    llm = LLMSettings(type="openai", model_name="text-davinci-003", max_tokens=1500)
    embedding = EmbeddingSettings(type="openaiembeddings")


# ------------------------- Embedding models registry ------------------------ #
model_setting_type_to_cls_dict: Dict[str, Type[ModelSettings]] = {
    "openai-gpt-3.5-turbo": OpenAIGPT3_5TurboSettings,
    "openai-gpt-3.5-text-davinci-003": OpenAIGPT3_5TextDavinci003Settings,
}


def load_model_setting(type: str) -> ModelSettings:
    if type not in model_setting_type_to_cls_dict:
        raise ValueError(f"Loading {type} setting not supported")

    cls = model_setting_type_to_cls_dict[type]
    return cls()


def get_all_model_settings() -> list[str]:
    """Get all supported Embeddings"""
    return list(model_setting_type_to_cls_dict.keys())
