import json
import os
from pathlib import Path
from typing import Any, Dict

from langchain import chat_models, embeddings
from langchain.embeddings.base import Embeddings
from langchain.llms import type_to_cls_dict as langchain_llms
from langchain.llms.base import BaseLLM

from skyagi.config import EmbeddingSettings, LLMSettings, Settings


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


def verify_model_initialization(settings: Settings):
    try:
        ModelFactory.create_llm_from_config(settings.llm)
        ModelFactory.create_embedding_from_config(settings.embedding)
        return "OK"
    except Exception as e:
        return str(e)


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


class ModelFactory:
    """Model factory based on configuration"""

    class LUT(dict):
        def __setitem__(self, __key: Any, __value: Any) -> None:
            try:
                self.__getitem__(__key)
                raise ValueError(f"Duplicate LLM type {__key} is not allowed")
            except KeyError:
                return super().__setitem__(__key, __value)

    # ------------------------- LLM/Chat models registry ------------------------- #
    _LLM_LUT = LUT()
    # langchain supported LLM models
    _LLM_LUT.update(langchain_llms)
    # langchain supported Chat models
    _LLM_LUT.update(
        {type_.lower(): getattr(chat_models, type_) for type_ in chat_models.__all__}
    )
    # skyagi builtin LLM/Chat models
    _LLM_LUT.update({})

    # ------------------------- Embedding models registry ------------------------ #
    _EMBEDDING_LUT = LUT()
    # langchain supported Embedding models
    _EMBEDDING_LUT.update(
        {type_.lower(): getattr(embeddings, type_) for type_ in embeddings.__all__}
    )
    # skyagi builtin Embedding models
    _EMBEDDING_LUT.update({})

    # ---------------------------------------------------------------------------- #
    #                                LLM/Chat models                               #
    # ---------------------------------------------------------------------------- #
    @staticmethod
    def create_llm_from_config(settings: LLMSettings) -> BaseLLM:
        settings_dict = settings.dict()
        type_ = settings_dict.pop("type")
        return ModelFactory.create_llm(type_, **settings_dict)

    @staticmethod
    def create_llm(type_: str, **kwargs) -> BaseLLM:
        if type_ not in ModelFactory._LLM_LUT:
            raise ValueError(f"LLM {type_} is not supported yet")
        return ModelFactory._LLM_LUT[type_](**kwargs)

    @classmethod
    def get_all_llms(cls) -> list[str]:
        return list(cls._LLM_LUT.keys())

    # ---------------------------------------------------------------------------- #
    #                               Embeddings models                              #
    # ---------------------------------------------------------------------------- #
    @staticmethod
    def create_embedding_from_config(settings: EmbeddingSettings) -> Embeddings:
        settings_dict = settings.dict()
        type_ = settings_dict.pop("type")
        return ModelFactory.create_embedding(type_, **settings_dict)

    @staticmethod
    def create_embedding(type_: str, **kwargs) -> Embeddings:
        if type_ not in ModelFactory._EMBEDDING_LUT:
            raise ValueError(f"Embedding {type_} is not supported yet")
        return ModelFactory._EMBEDDING_LUT[type_](**kwargs)

    @classmethod
    def get_all_embeddings(cls) -> list[str]:
        return list(cls._EMBEDDING_LUT.keys())
