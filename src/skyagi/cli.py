import os
import json
import typer
import time
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt, IntPrompt

from skyagi import config, util
from skyagi.skyagi import Agent, Context, agi_step, agi_init

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


@config_cli.callback(invoke_without_command=True)
def config_main(ctx: typer.Context):
    """
    Configure SkyAGI
    """
    # only run without a command specified
    if ctx.invoked_subcommand is not None:
        return

    console.print("SkyAGI's Configuration")

    if (config.load_openai_token()):
        console.print("OpenAI Token is configured, good job!", style="green")
    else:
        console.print("OpenAI Token not configured yet! This is necessary to use SkyAGI", style="red")
        console.print("To config OpenAI token: [yellow]skyagi config openai[/yellow]")

    if (config.load_pinecone_token()):
        console.print("Pinecone Token is configured, good job!", style="green")
    else:
        console.print("Pinecone Token not configured yet! This is necessary to use SkyAGI", style="red")
        console.print("To config Pinecone token: [yellow]skyagi config pinecone[/yellow]")

cli.add_typer(config_cli, name="config")

#######################################################################################
# Main CLI

@cli.command("status")
def status():
    """
    Status of the SkyAGI
    """
    console.print("SkyAGI status")


@cli.command("run")
def run():
    """
    Run SkyAGI
    """
    # Verify the OpenAI token before anything else
    verify_openai = util.verify_openai_token(config.load_openai_token())
    if verify_openai != "OK":
        console.print("Please config your OpenAI token before using this app", style="red")
        console.print("Config by running: skyagi run openai", style="yellow")
        console.print(verify_openai)
        return
    # Get inputs from the user
    agent_count = IntPrompt.ask("Number of agents to create?", default=1)
    agent_configs = []
    agent_names = []
    for idx in range(agent_count):
        console.print(f"Creating agent number {idx+1}")
        agent_config = {}
        while True:
            agent_file = Prompt.ask("Enter the path to the agent configuration file", default="./agent.json")
            if not os.path.isfile(agent_file):
                console.print(f"Invalid file path: {agent_file}", style='red')
                continue
            try:
                agent_config = util.load_json(Path(agent_file))
                if agent_config == {}:
                    console.print(f"Empty configuration, please provide a valid one", style='red')
                    continue
                break
            except json.JSONDecodeError as e:
                console.print(f"Invalid configuration, please provide a valid one", style='red')
                continue
        agent_configs.append(agent_config)
        agent_names.append(agent_config["name"])

    user_role = Prompt.ask("Pick which role you want to perform?", choices=agent_names, default=agent_names[0])
    user_index = agent_names.index(user_role)
    ctx = agi_init(agent_configs, console, config.load_openai_token(), user_index)

    #     name = Prompt.ask("What is the character's name?").strip()
    #     personality = Prompt.ask("Please use 3~5 words describe the character's personality, [yellow]e.g. confident, creative...[/yellow]")
    #     intro = Prompt.ask(f"A brief intro, [yellow]e.g. {name} is a famous singer...[/yellow]")
    #     agent = Agent(name, personality, intro, idx==0)
    #     agents.append(agent)
    #     console.print(f"Successfully created character {name}", style="green")
    #     time.sleep(0.5)
    # console.print("SkyAGI starting...")
    # console.print(f"Now, you are going to behave as {agents[0].name}", style="yellow")
    # ctx = Context(console, config.load_openai_token())
    # instruction = ""
    # while True:
    #     step(agents, ctx, instruction)
    #     console.print("What's your action? Q for quit, Enter for continue", style="yellow")
    #     instruction = Prompt.ask().strip()
    #     if (instruction == "Q" or instruction == "q"):
    #         console.print("Quitting SkyAGI...")
    #         break


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

    console.print("Hello SkyAGI")
