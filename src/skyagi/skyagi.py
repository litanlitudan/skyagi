import os
import openai
from typing import List
from rich.console import Console
from rich.prompt import Prompt

from langchain.chat_models import ChatOpenAI

from skyagi.context import Context
from skyagi.simulation.agent import GenerativeAgent
from skyagi.simulation.simulation import (
    create_new_memory_retriever,
    run_conversation,
    interview_agent,
)


# whether amy wants to talk to bob based on the observations
def talks_to(
    amy: GenerativeAgent, bob: GenerativeAgent, observations: List[str]
) -> str:
    instruct = "Here are the timeline of events happend for these NPC characters:\n"
    instruct += "\n".join(observations)
    instruct += "\n"
    instruct += (
        f"I want to you to behave as {amy.name} and talk to me as I am {bob.name}.\n"
    )
    instruct += (
        f"If you do not want to or can not talk to {bob.name}, just output NOTHING"
    )

    prompts = [
        {
            "role": "system",
            "content": f"You are the AI behind a NPC character called {amy.name}",
        },
        {"role": "user", "content": instruct},
    ]
    resp = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=prompts)
    message = resp["choices"][0]["message"]["content"]
    if "NOTHING" in message:
        return ""

    prompts.append(resp["choices"][0]["message"])
    prompts.append(
        {
            "role": "user",
            "content": f"Did {amy.name} talk to {bob.name}, please answer yes or no",
        }
    )
    resp = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=prompts)
    if "no" in resp["choices"][0]["message"]["content"]:
        return ""
    return message


def user_robot_conversation(agent_to_interview: GenerativeAgent, ctx: Context):
    ctx.console.print(
        f"Interview with {agent_to_interview.name} start, input empty line to exit",
        style="yellow",
    )
    ctx.observations.append(
        f"{ctx.user_agent.name} now is having a conversation with {agent_to_interview.name}"
    )
    while True:
        user_message = Prompt.ask()
        if user_message == "":
            ctx.console.print(f"Interview with {agent_to_interview.name} finished")
            break
        ctx.observations.append(f"{ctx.user_agent.name} said: {user_message}")
        response = interview_agent(
            agent_to_interview, user_message, ctx.user_agent.name
        )
        ctx.console.print(response)
        ctx.observations.append(response)
    ctx.observations.append(
        f"The conversation between {ctx.user_agent.name} and {agent_to_interview.name} is ended."
    )


def agi_step(ctx: Context, instruction: dict) -> None:
    ctx.clock += 1
    if instruction["command"] == "interview":
        user_robot_conversation(instruction["agent_to_interview"], ctx)

    if instruction["command"] == "continue":
        someone_asked = False
        for robot_agent in ctx.robot_agents:
            message = talks_to(robot_agent, ctx.user_agent, ctx.observations)
            if message:
                if someone_asked:
                    ctx.console.print(
                        f"{robot_agent.name} also whispered to you({ctx.user_agent.name}): {message}",
                        style="yellow",
                    )
                else:
                    ctx.console.print(
                        f"{robot_agent.name} whispered to you ({ctx.user_agent.name}): {message}",
                        style="yellow",
                    )
                someone_asked = True
                respond = Prompt.ask(
                    f"Do you want to respond to {robot_agent.name}?",
                    choices=["yes", "no"],
                    default="yes",
                )
                if respond == "yes":
                    user_robot_conversation(robot_agent, ctx)

    # let the activities of non user robots happen
    for idx in range(len(ctx.robot_agents) - 1):
        amy = ctx.robot_agents[idx]
        for bob in ctx.robot_agents[idx + 1 :]:
            message = talks_to(amy, bob, ctx.observations)
            if message:
                ctx.console.print(
                    f"{amy.name} just whispered to {bob.name}...", style="yellow"
                )
                run_conversation([amy, bob], f"{amy.name} said: {message}", ctx)
                ctx.console.print(
                    f"{amy.name} and {bob.name} finished their private conversation...",
                    style="yellow",
                )
                continue
            message = talks_to(bob, amy, ctx.observations)
            if message:
                ctx.console.print(
                    f"{bob.name} just whispered to {amy.name}...", style="yellow"
                )
                run_conversation([bob, amy], f"{bob.name} said: {message}", ctx)
                ctx.console.print(
                    f"{bob.name} and {amy.name} finished their private conversation...",
                    style="yellow",
                )
                continue

    # clean up context's observations based on the time window
    ctx.observations_size_history.append(len(ctx.observations))
    if len(ctx.observations_size_history) > ctx.timewindow_size:
        remove_count = ctx.observations_size_history[0]
        ctx.observations = ctx.observations[remove_count:]
        ctx.observations_size_history = ctx.observations_size_history[1:]
        for idx in range(len(ctx.observations_size_history)):
            ctx.observations_size_history[idx] = (
                ctx.observations_size_history[idx] - remove_count
            )


def agi_init(
    agent_configs: List[dict], console: Console, openai_key: str, user_idx: int = 0
) -> Context:
    ctx = Context(console, openai_key)
    os.environ["OPENAI_API_KEY"] = openai_key
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
            daily_summaries=[(agent_config["current_status"])],
            reflection_threshold=8,
        )
        for memory in agent_config["memories"]:
            agent.add_memory(memory)
        if idx == user_idx:
            ctx.user_agent = agent
        else:
            ctx.robot_agents.append(agent)
        ctx.agents.append(agent)
        ctx.observations.append(agent_config["current_status"])
        console.print(f"Agent {agent_name} successfully created", style="green")

    console.print("SkyAGI started...")
    console.print(f"You are going to behave as {ctx.user_agent.name}", style="yellow")
    return ctx
