import os
import openai
from typing import List
from rich.console import Console

from langchain.chat_models import ChatOpenAI

from skyagi.simulation.agent import GenerativeAgent
from skyagi.simulation.simulation import create_new_memory_retriever, run_conversation, interview_agent

class Context:
    def __init__(self, console: Console, openai_key: str) -> None:
        self.clock: int = 0
        self.console: Console = console
        self.openai_key: str = openai_key
        self.agents: List[GenerativeAgent] = []
        self.user_agent: GenerativeAgent = None
        self.robot_agents: List[GenerativeAgent] = []


def agi_step(ctx: Context, instruction: dict) -> None:
    ctx.clock += 1
    if instruction["command"] == "continue":
        pass
    elif instruction["command"] == "interview":
        pass


def agi_init(agent_configs: List[dict], console: Console, openai_key: str, user_idx: int = 0) -> Context:
    ctx = Context(console, openai_key)
    os.environ['OPENAI_API_KEY'] = openai_key
    for idx, agent_config in enumerate(agent_configs):
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
        if idx == user_idx:
            ctx.user_agent = agent
        else:
            ctx.robot_agents.append(agent)
        ctx.agents.append(agent)
        console.print(f"Agent {agent_name} successfully created", style="green")

    console.print("SkyAGI started...")
    console.print(f"You are going to behave as {ctx.user_agent.name}", style="yellow")
    return ctx
