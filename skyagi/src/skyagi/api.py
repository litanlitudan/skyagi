import json
import os
from pathlib import Path

import typer
from rich.console import Console
from rich.prompt import IntPrompt, Prompt

from skyagi import config, util
from skyagi.discord import client
from skyagi.skyagi import agi_init, agi_step

import asyncio
from lcserve import serving
from typing import List

cli = typer.Typer()
console = Console()

#######################################################################################
# Config CLI

config_cli = typer.Typer()


@config_cli.command("openai")
def config_openai():
    """
    Configure OpenAI API token
    """
    token = Prompt.ask("Enter your OpenAI API token").strip()
    verify_resp = util.verify_openai_token(token)
    if verify_resp != "OK":
        console.print("[Error] OpenAI Token is invalid", style="red")
        console.print(verify_resp)
        return
    config.set_openai_token(token)
    console.print("OpenAI Key is Configured Successfully!", style="green")


@config_cli.command("pinecone")
def config_pinecone():
    """
    Configure Pinecone API token
    """
    token = Prompt.ask("Enter your Pinecone API token").strip()
    verify_resp = util.verify_pinecone_token(token)
    if verify_resp != "OK":
        console.print("[Error] Pinecone Token is invalid", style="red")
        console.print(verify_resp)
        return
    config.set_pinecone_token(token)
    console.print("Pinecone Key is Configured Successfully!", style="green")


@config_cli.command("discord")
def config_discord():
    """
    Configure discord API token
    """
    token = Prompt.ask("Enter your Discord API token").strip()
    verify_resp = util.verify_discord_token(token)
    if verify_resp != "OK":
        console.print("[Error] Discord Token is invalid", style="red")
        console.print(verify_resp)
        return
    config.set_discord_token(token)
    console.print("Discord Key is Configured Successfully!", style="green")


@config_cli.callback(invoke_without_command=True)
def config_main(ctx: typer.Context):
    """
    Configure SkyAGI
    """
    # only run without a command specified
    if ctx.invoked_subcommand is not None:
        return

    console.print("SkyAGI's Configuration")

    if config.load_openai_token():
        console.print("OpenAI Token is configured, good job!", style="green")
    else:
        console.print(
            "OpenAI Token not configured yet! This is necessary to use SkyAGI",
            style="red",
        )
        console.print("To config OpenAI token: [yellow]skyagi config openai[/yellow]")

    if config.load_pinecone_token():
        console.print("Pinecone Token is configured, good job!", style="green")
    else:
        console.print(
            "Pinecone Token not configured yet! This is necessary to use SkyAGI",
            style="red",
        )
        console.print(
            "To config Pinecone token: [yellow]skyagi config pinecone[/yellow]"
        )

    if config.load_discord_token():
        console.print("Discord Token is configured, good job!", style="green")
    else:
        console.print("Discord Token not configured yet!", style="red")
        console.print("To config Discord token: [yellow]skyagi config discord[/yellow]")


cli.add_typer(config_cli, name="config")

#######################################################################################
# Main CLI


@cli.command("discord")
def status():
    """
    Run the Discord client
    """
    # Verify the Discord token before anything else
    discord_token = config.load_discord_token()
    verify_discord = util.verify_discord_token(discord_token)
    if verify_discord != "OK":
        console.print("Please config your Discord token", style="red")
        console.print(verify_discord)
        return
    console.print("Discord client starting...", style="yellow")
    client.run(discord_token)

async def send_ws_message(websocket, message: str):
    if websocket is not None:
        await websocket.send_json(
            {'result': message, 'error': '', 'stdout': ''}
        )
    print(message)


def report_error(websocket, err_msg: str):
    asyncio.run(send_ws_message(websocket, err_msg))

# TODO: wrapper for Prompt.ask
def ask_human(websocket, message: str):
    asyncio.run(send_ws_message(websocket, message))
    return input()

@serving(websocket=True)
def runskyagi(agent_configs: List[dict], **kwargs):
    """
    Run SkyAGI
    """
    websocket = kwargs.get('websocket')
    openai_token = kwargs.get('openai_token') #TODO: make this more general

    if len(agent_configs) <= 2:
        # TODO: return error
        report_error(websocket, "Please config at least 2 agents, exiting")
        return
    
    agent_names = []
    for agent_config in agent_configs:
        agent_names.append(agent_config["name"])

    # ask for the user's role
    user_role = ask_human("Pick which role you want to perform? (input the exact name, case sensitive)", choices=agent_names, default=agent_names[0])
    if user_role not in agent_names:
        return 
    user_index = agent_names.index(user_role)

    # set up the agents
    # TODO: define our own "console" 
    ctx = agi_init(agent_configs, console, openai_token, user_index)

    # main loop
    actions = ["continue", "interview", "exit"]
    while True:
        instruction = {"command": "continue"}
        action = ask_human(
            "Pick an action to perform?", choices=actions, default=actions[0]
        )
        if action == "interview":
            robot_agent_names = list(map(lambda agent: agent.name, ctx.robot_agents))
            robot_agent_name = ask_human(
                f"As {ctx.user_agent.name}, which agent do you want to talk to?",
                choices=robot_agent_names,
                default=robot_agent_names[0],
            )
            instruction = {
                "command": "interview",
                "agent_to_interview": ctx.robot_agents[
                    robot_agent_names.index(robot_agent_name)
                ],
            }
        elif action == "exit":
            console.print("SkyAGI exiting...", style="yellow")
            break
        agi_step(ctx, instruction)