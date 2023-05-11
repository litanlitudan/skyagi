import json
import os
from pathlib import Path
from typing import Any, Dict, Type

from langchain import chat_models, embeddings, llms
from langchain.embeddings.base import Embeddings
from langchain.llms.base import BaseLanguageModel

from skyagi.config import EmbeddingSettings, LLMSettings, Settings

# ------------------------- LLM/Chat models registry ------------------------- #
llm_type_to_cls_dict: Dict[str, Type[BaseLanguageModel]] = {
    "chatopenai": chat_models.ChatOpenAI,
    "openai": llms.OpenAI,
}

# ------------------------- Embedding models registry ------------------------ #
embedding_type_to_cls_dict: Dict[str, Type[Embeddings]] = {
    "openaiembeddings": embeddings.OpenAIEmbeddings
}


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


def set_json_value(filepath: Path, key: str, value: Any) -> None:
    # key needs to follow python naming convention, such as trial_id
    json_obj = load_json(filepath)
    json_obj[key] = value
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


# ---------------------------------------------------------------------------- #
#                                LLM/Chat models                               #
# ---------------------------------------------------------------------------- #
def load_llm_from_config(config: LLMSettings) -> BaseLanguageModel:
    """Load LLM from Config."""
    config_dict = config.dict()
    config_type = config_dict.pop("type")

    if config_type not in llm_type_to_cls_dict:
        raise ValueError(f"Loading {config_type} LLM not supported")

    cls = llm_type_to_cls_dict[config_type]
    return cls(**config_dict)


def get_all_llms() -> list[str]:
    """Get all supported LLMs"""
    return list(llm_type_to_cls_dict.keys())


# ---------------------------------------------------------------------------- #
#                               Embeddings models                              #
# ---------------------------------------------------------------------------- #
def load_embedding_from_config(config: EmbeddingSettings) -> Embeddings:
    """Load Embedding from Config."""
    config_dict = config.dict()
    config_type = config_dict.pop("type")

    if config_type not in embedding_type_to_cls_dict:
        raise ValueError(f"Loading {config_type} Embedding not supported")

    cls = embedding_type_to_cls_dict[config_type]
    return cls(**config_dict)


def get_all_embeddings() -> list[str]:
    """Get all supported Embeddings"""
    return list(embedding_type_to_cls_dict.keys())
