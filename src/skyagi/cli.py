import typer
from rich.console import Console
from rich.prompt import Prompt, Confirm, IntPrompt

from skyagi import config, tui, util

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


@config_cli.callback(invoke_without_command=True)
def config_main(ctx: typer.Context):
    """
    Configure SkyAGI
    """
    # only run without a command specified
    if ctx.invoked_subcommand is not None:
        return

    skyagi_config = config.load_config()

    console.print("SkyAGI's Configuration")

    if (skyagi_config.get("openai", None)):
        console.print("OpenAI Token is configured, good job!", style="green")
    else:
        console.print("OpenAI Token not configured yet! This is necessary to use SkyAGI", style="red")
        console.print("To config OpenAI token: [yellow]skyagi config openai[/yellow]")

    if (skyagi_config.get("pinecone", None)):
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
