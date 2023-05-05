import asyncio
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

agent_configs = [
    {
        "name": "Penny",
        "age": 22,
        "personality": "Outgoing, friendly, compassionate, assertive, and determined.",
        "memories": ["I'm happy"],
        "current_status": "Penny is at the Cheesecake Factory"
    },
    {
        "name": "Leonard",
        "age": 27,
        "personality": "Intelligent, neurotic, kind, analytical, loyal.",
        "memories": ["I'm unhappy"],
        "current_status": "Leonard is at the Cheesecake Factory"
    },
    {
        "name": "Sheldon",
        "age": 27,
        "personality": "Intelligent, rigid, socially challenged, quirky, and arrogant.",
        "memories": ["N/A"],
        "current_status": "Sheldon is at the Cheesecake Factory"
        }
]


async def client(url: str, name: str, envs: Dict = {}):
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(f'{url}/{name}') as ws:
            print(f'Connected to {url}/{name}.')

            await ws.send_json(
                {
                    "agent_configs": agent_configs,
                    "openai_key": os.environ['OPENAI_API_KEY'],
                    "envs": envs if envs else {},
                }
            )

            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    if msg.data == 'close cmd':
                        await ws.close()
                        break
                    else:
                        try:
                            response = Response.parse_raw(msg.data)
                            print(response.result, end='')
                        except ValidationError:
                            try:
                                prompt = HumanPrompt.parse_raw(msg.data)
                                answer = input(prompt.prompt + '\n')
                                await ws.send_str(answer)
                            except ValidationError:
                                print(f'Unknown message: {msg.data}')

                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print('ws connection closed with exception %s' % ws.exception())
                else:
                    print(msg)


asyncio.run(
    client(
        url='ws://localhost:8080',
        name='runskyagi',
        envs={
            'OPENAI_API_KEY': os.environ['OPENAI_API_KEY'],
        },
    )
)
