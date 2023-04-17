import typer
from rich.console import Console

cli = typer.Typer()
console = Console()

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
