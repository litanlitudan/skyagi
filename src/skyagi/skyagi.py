import openai
from typing import List
from rich.console import Console

class Context:
    def __init__(self, console: Console, openai_key: str) -> None:
        self.clock = 0
        self.console = console
        self.openai_key = openai_key


class Agent:
    def __init__(self, name: str, personality: str, intro: str, is_human: bool = False) -> None:
        self.name = name
        self.personality = personality
        self.intro = intro
        self.is_human = is_human
        self.memory = []
        # prompt related
        prompt_instruct = f"""{name} has a personality of {personality} and here is an intro:
{intro}

At each time I ender the command "New_TIME_STEP" I want you to list the time of day and the action Yuan Yu is taking. If he is in a conversation with some please show that conversation.

Examples:

NEW_TIME_STEP
06:00am {name} is asleep

NEW_TIME_STEP

It is currently 9:00 am
"""
        self.prompt = [
            {"role": "system", "content": f"You are the AI behind a NPC character called {name}"},
            {"role": "user", "content": prompt_instruct},
        ]

    def step(self, instruction: str, ctx: Context) -> None:
        self.prompt.append({
            "role": "user",
            "content": "NEW_TIME_STEP"
        })
        openai.api_key = ctx.openai_key
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=self.prompt,

        )
        message = resp["choices"][0]["message"]
        self.prompt.append(message)
        ctx.console.print(message["content"])

class Record:
    def __init__(self) -> None:
        pass


class Oberservation(Record):
    def __init__(self) -> None:
        super().__init__()


class Plan(Record):
    def __init__(self) -> None:
        super().__init__()


class Reflection(Record):
    def __init__(self) -> None:
        super().__init__()


def step(agents: List[Agent], ctx: Context, instruction: str) -> None:
    ctx.clock += 1
    for agent in agents:
        agent.step(instruction, ctx)
