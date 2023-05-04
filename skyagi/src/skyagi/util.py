import json
import os
from pathlib import Path
from typing import Any, Dict

import yaml
from langchain.llms import type_to_cls_dict as langchain_models
from langchain.llms.base import BaseLLM
from pydantic import BaseModel


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


class LLMFactory:
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
    _LUT.update(langchain_models)
    # TODO: (kejiez) load langchain chat_models
    
    # skyagi builtin models
    _LUT.update({})

    @staticmethod
    def create(config: dict) -> BaseLLM:
        if "vendor" not in config:
            raise ValueError("Must specify the LLM `vendor` in config")

        vendor = config["vendor"]
        if vendor not in LLMFactory._LUT:
            raise ValueError(f"LLM {vendor} is not supported yet")

        if vendor not in config:
            raise ValueError(
                f"Must specify the LLM specific config for vendor {vendor}"
            )

        vendor_config = config[vendor]
        return LLMFactory._LUT[vendor](**vendor_config)
