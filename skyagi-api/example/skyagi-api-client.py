import argparse
import asyncio
import json
import os
from typing import Dict

import aiohttp
from pydantic import BaseModel, ValidationError


class Response(BaseModel):
    result: str
    error: str
    stdout: str


class HumanPrompt(BaseModel):
    prompt: str


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", "-f", type=str, help="the folder of agent configs")
    parser.add_argument(
        "--llm-model",
        "-m",
        choices=["openai-gpt-3.5-turbo", "openai-gpt-3.5-text-davinci-003"],
        help="select the LLM model",
    )
    args = parser.parse_args()
    return args


def get_agent_configs(folder: str):
    if not os.path.isdir(folder):
        raise Exception(f"{folder} is not a directory")

    agent_configs = []
    for root, dirs, files in os.walk(folder):
        for filename in files:
            if filename.endswith(".json"):
                json_file = os.path.join(root, filename)
                with open(json_file, "r") as f:
                    config = json.load(f)
                    agent_configs.append(config)

    return agent_configs


async def client(url: str, name: str, envs: Dict = {}):
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(f"{url}/{name}") as ws:
            print(f"Connected to {url}/{name}.")

            args = parse_args()

            await ws.send_json(
                {
                    "agent_configs": get_agent_configs(args.folder),
                    "llm_model": args.llm_model,
                    "envs": envs if envs else {},
                }
            )

            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    if "exiting" in msg.data:
                        await ws.close()
                        break
                    else:
                        try:
                            response = Response.parse_raw(msg.data)
                            print(response.result, end="")
                        except ValidationError:
                            try:
                                prompt = HumanPrompt.parse_raw(msg.data)
                                answer = input(prompt.prompt + "\n")
                                await ws.send_str(answer)
                            except ValidationError:
                                print(f"Unknown message: {msg.data}")

                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print("ws connection closed with exception %s" % ws.exception())
                else:
                    print(msg)


asyncio.run(
    client(
        url="ws://localhost:8080",  # use local deployment
        # url="wss://langchain-558b0f2c14.wolf.jina.ai", # use cloud deployment
        name="runskyagi",
        envs={
            "OPENAI_API_KEY": os.environ["OPENAI_API_KEY"],
        },
    )
)
