import typer
import time
from rich.console import Console
from rich.prompt import Prompt, Confirm, IntPrompt

from skyagi import config, tui, util
from skyagi.skyagi import Agent, Context, step

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
    agent_count = IntPrompt.ask("Number of characters to create?", default=3)
    agents = []
    for idx in range(agent_count):
        console.print(f"Creating character {idx+1}")
        name = Prompt.ask("What's the character's name?").strip()
        personality = Prompt.ask("Please use 3~5 words describe character's personality, [yellow]e.g. confident, creative...[/yellow]")
        intro = Prompt.ask(f"A brief third-person intro, [yellow]e.g. {name} is a famous singer...[/yellow]")
        relation = Prompt.ask(f"Some background on social relationships, [yellow]e.g. John Miller growed up with {name} since childhood...[/yellow]")
        agent = Agent(name, personality, intro, relation)
        agents.append(agent)
        console.print(f"Successfully created character {name}", style="green")
        time.sleep(0.5)
    console.print("SkyAGI starting...")
    console.print(f"Now, you are going to behave as {agents[0].name}")
    ctx = Context()
    instruction = ""
    while True:
        step(agents, ctx, instruction)
        instruction = Prompt.ask("What's your action? Q for quit, Enter for continue").strip()
        if (instruction == "Q" or instruction == "q"):
            console.print("Quitting SkyAGI...")
            break


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
