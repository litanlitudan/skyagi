import openai
from typing import List
from rich.console import Console

from langchain.chat_models import ChatOpenAI

from skyagi.simulation.agent import GenerativeAgent
from skyagi.simulation.simulation import create_new_memory_retriever, run_conversation, interview_agent

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


def agi_step(agents: List[Agent], ctx: Context, instruction: str) -> None:
    ctx.clock += 1
    for agent in agents:
        agent.step(instruction, ctx)


def agi_init(agent_configs: List[dict], console: Console, openai_key: str, user_idx: int = 0) -> Context:
    ctx = Context(console, openai_key)
    user_agent_name = agent_configs[user_idx]["name"]
    agents = []
    for agent_config in agent_configs:
        agent_name = agent_config["name"]
        console.print(f"Creating agent {agent_name}", style="yellow")
        agent = GenerativeAgent(
            name=agent_config["name"],
            age=agent_config["age"],
            traits=agent_config["personality"],
            status="N/A",  # When connected to a virtual world, we can have the characters update their status
            memory_retriever=create_new_memory_retriever(),
            llm=ChatOpenAI(max_tokens=1500),
            daily_summaries=[
                (
                    agent_config["current_status"]
                )
            ],
            reflection_threshold=8,
        )
        for memory in agent_config["memories"]:
            agent.add_memory(memory)
        agents.append(agent)
        console.print(f"Agent {agent_name} successfully created", style="green")

    console.print("SkyAGI started...")
    console.print(f"You are going to behave as {user_agent_name}", style="yellow")
    return ctx
