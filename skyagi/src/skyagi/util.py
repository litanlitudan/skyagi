import json
import os
from pathlib import Path
from typing import Any, Dict, List

from langchain.prompts.chat import ChatPromptTemplate, HumanMessagePromptTemplate
from openai.error import AuthenticationError

from skyagi.constants import ModelProvider
from skyagi.model import (
    get_all_llm_settings_by_provider,
    load_embedding_from_config,
    load_llm_from_config,
)
from skyagi.settings import EmbeddingSettings, LLMSettings, Settings


def verify_openai_token(token: str) -> str:
    import openai

    openai.api_key = token
    try:
        openai.Completion.create(
            model="text-ada-001",
            prompt="Hello",
            temperature=0,
            max_tokens=10,
            top_p=1,
            frequency_penalty=0.5,
            presence_penalty=0,
        )
        return "OK"
    except Exception as e:
        return str(e)


def verify_model_initialization(settings: Settings) -> str:
    try:
        load_llm_from_config(settings.model.llm)
    except Exception as e:
        return f"LLM initialization check failed: {e}"

    try:
        load_embedding_from_config(settings.model.embedding)
    except Exception as e:
        return f"Embedding initialization check failed: {e}"

    return "OK"


def verify_llm_initialization(llm_settings: LLMSettings) -> str:
    try:
        llm = load_llm_from_config(llm_settings)
        llm.generate_prompt(
            prompts=[
                ChatPromptTemplate.from_messages(
                    [HumanMessagePromptTemplate.from_template("{text}")]
                ).format_prompt(text="ping")
            ]
        )
    except AuthenticationError:
        return (
            f"This can happen if provider {llm_settings.provider}'s credentials are invalid,"
            f"set the valid ones by running `skyagi config credentials set`"
        )
    except Exception as e:
        return f"LLM initialization check failed: {repr(e)}."

    return "OK"


def verify_embedding_initialization(embedding_settings: EmbeddingSettings) -> str:
    try:
        load_embedding_from_config(embedding_settings)
    except Exception as e:
        return f"Embedding initialization check failed: {e}"

    return "OK"


def verify_provider_credentials(
    provider: ModelProvider, credentials: Dict[str, Any]
) -> str:
    llms_settings = get_all_llm_settings_by_provider(provider=provider)
    if len(llms_settings) == 0:
        return f"Empty LLM settings for provider: {provider}"
    llm_settings = llms_settings[0]
    # merge credentials into LLM settings args field
    llm_settings.args.update(credentials)
    return verify_llm_initialization(llm_settings=llm_settings)


def verify_pinecone_token(token: str) -> str:
    return "OK"


def verify_discord_token(token: str) -> str:
    return "OK"


def load_json_value(filepath: Path, key: str, default_value: Any) -> Any:
    if not Path(filepath).exists():
        return default_value
    json_obj = load_json(filepath)
    if key not in json_obj:
        return default_value
    return json_obj[key]


def load_nested_json_value(filepath: Path, keys: List[str], default_value: Any) -> Any:
    if not Path(filepath).exists():
        return default_value
    json_obj = load_json(filepath)
    current = json_obj
    for key in keys:
        if key not in current:
            return default_value
        current = current[key]
    return current


def set_json_value(filepath: Path, key: str, value: Any) -> None:
    # key needs to follow python naming convention, such as trial_id
    json_obj = load_json(filepath)
    json_obj[key] = value
    with open(filepath, "w+") as json_file:
        json.dump(json_obj, json_file, sort_keys=True)
        json_file.flush()


def set_nested_json_value(filepath: Path, keys: List[str], value: Any) -> None:
    json_obj = load_json(filepath)
    current = json_obj
    for key in keys[:-1]:
        current = current.setdefault(key, {})
    current[keys[-1]] = value
    with open(filepath, "w+") as json_file:
        json.dump(json_obj, json_file, sort_keys=True)
        json_file.flush()


def load_json(filepath: Path) -> Dict:
    if not Path(filepath).exists():
        return {}
    with open(filepath, "r") as file:
        try:
            json_obj = json.load(file)
            return json_obj
        except json.JSONDecodeError as e:
            if os.stat(filepath).st_size == 0:
                # Empty file
                return {}
            else:
                raise e
