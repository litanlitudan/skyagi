import json
import os
from pathlib import Path

import inquirer
import typer
from rich.console import Console
from rich.prompt import IntPrompt, Prompt

from skyagi import config, util
from skyagi.discord import client
from skyagi.model import get_all_embeddings, get_all_llms
from skyagi.settings import Settings, get_all_model_settings, load_model_setting
from skyagi.skyagi import agi_init, agi_step

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
# Model CLI

model_cli = typer.Typer(help="Models Management")


@model_cli.command("list")
def model_list():
    """
    List all supported models
    """
    console.print("\n[green]Supported LLM/ChatModel:\n")
    console.print(", ".join(get_all_llms()))
    console.print("\n[green]Supported Embedding:\n")
    console.print(", ".join(get_all_embeddings()))


@model_cli.callback(invoke_without_command=True)
def model_main(ctx: typer.Context):
    """
    Models
    """
    # only run without a command specified
    if ctx.invoked_subcommand is not None:
        return

    # by default just print all supported models
    model_list()


cli.add_typer(model_cli, name="model")

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


@cli.command("run")
def run():
    """
    Run SkyAGI
    """
    settings = Settings()

    # Ask Model settings
    questions = [
        inquirer.List(
            "llm-model",
            message="What LLM model you want to use?",
            choices=get_all_model_settings(),
        )
    ]
    answers = inquirer.prompt(questions=questions)
    settings.model = load_model_setting(answers["llm-model"])

    openai_key = config.load_openai_token()
    if os.getenv("OPENAI_API_KEY") is None:
        os.environ["OPENAI_API_KEY"] = openai_key

    # Model initialization verification
    res = util.verify_model_initialization(settings)
    if res != "OK":
        console.print(res, style="red")
        return
    # Get inputs from the user
    agent_count = IntPrompt.ask(
        "Number of agents to create (at least 2 agents)?", default=3
    )
    if agent_count < 2:
        console.print("Please config at least 2 agents, exiting", style="red")
        return
    agent_configs = []
    agent_names = []
    for idx in range(agent_count):
        console.print(f"Specify agent number {idx+1}")
        agent_config = {}
        while True:
            agent_file = Prompt.ask(
                "Enter the path to the agent configuration file", default="./agent.json"
            )
            if not os.path.isfile(agent_file):
                console.print(f"Invalid file path: {agent_file}", style="red")
                continue
            try:
                agent_config = util.load_json(Path(agent_file))
                if agent_config == {}:
                    console.print(
                        "Empty configuration, please provide a valid one", style="red"
                    )
                    continue
                break
            except json.JSONDecodeError:
                console.print(
                    "Invalid configuration, please provide a valid one", style="red"
                )
                continue
        agent_configs.append(agent_config)
        agent_names.append(agent_config["name"])

    user_role = Prompt.ask(
        "Pick which role you want to perform? (input the exact name, case sensitive)",
        choices=agent_names,
        default=agent_names[0],
    )
    user_index = agent_names.index(user_role)
    ctx = agi_init(agent_configs, console, settings, user_index)

    actions = ["continue", "interview", "exit"]
    while True:
        instruction = {"command": "continue"}
        action = Prompt.ask(
            "Pick an action to perform?", choices=actions, default=actions[0]
        )
        if action == "interview":
            robot_agent_names = list(map(lambda agent: agent.name, ctx.robot_agents))
            robot_agent_name = Prompt.ask(
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


@cli.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
):
    """
    Default behavior
    """
    # only run without a command specified
    if ctx.invoked_subcommand is not None:
        return

    run()
