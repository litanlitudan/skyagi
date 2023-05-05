import json
import os
from pathlib import Path
from typing import Any, Dict

import yaml
from langchain import chat_models
from langchain.llms import type_to_cls_dict as langchain_llms
from langchain.llms.base import BaseLLM


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


def load_yaml(filepath: Path) -> dict:
    if not Path(filepath).exists():
        return {}
    with open(filepath, "r") as file:
        return yaml.safe_load(file)


class ModelFactory:
    """LLM factory based on configuration"""

    class LUT(dict):
        def __setitem__(self, __key: Any, __value: Any) -> None:
            try:
                self.__getitem__(__key)
                raise ValueError(f"Duplicate LLM type {__key} is not allowed")
            except KeyError:
                return super().__setitem__(__key, __value)

    _LUT = LUT()
    # langchain supported models
    _LUT.update(langchain_llms)
    # langchain chat_models
    _LUT.update(
        {
            chat_model_type.lower(): getattr(chat_models, chat_model_type)
            for chat_model_type in chat_models.__all__
        }
    )
    # skyagi builtin models
    _LUT.update({})

    @staticmethod
    def create(config: dict) -> BaseLLM:
        if "vendor" not in config:
            raise ValueError("Must specify the LLM `vendor` in config")

        vendor = config["vendor"]
        if vendor not in ModelFactory._LUT:
            raise ValueError(f"LLM {vendor} is not supported yet")

        if vendor not in config:
            raise ValueError(
                f"Must specify the LLM specific config for vendor {vendor}"
            )

        vendor_config = config[vendor]
        return ModelFactory._LUT[vendor](**vendor_config)

    @classmethod
    def get_all_models(cls) -> list[str]:
        return list(cls._LUT.keys())
