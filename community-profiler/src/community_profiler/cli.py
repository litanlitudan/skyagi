import typer

cli = typer.Typer()


@cli.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    """
    Default behavior
    """
    # only run without a command specified
    if ctx.invoked_subcommand is not None:
        return

    print("Hello from community profiler!")
