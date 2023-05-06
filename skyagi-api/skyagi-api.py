import asyncio
from typing import List

from lcserve import serving
from rich.console import Console
from rich.prompt import Prompt
from skyagi.skyagi import agi_init, agi_step

console = Console()


class WebContext:
    def __init__(self, websocket):
        self.websocket = websocket

    def send_response(self, response):
        asyncio.run(self.send_ws_message(response + "\n"))

    async def send_ws_message(self, message: str):
        if self.websocket is not None:
            await self.websocket.send_json(
                {"result": message, "error": "", "stdout": ""}
            )

    def ask_human(self, message: str, choices: List[str]):
        if choices:
            ask_human_prompt = f"{message} ({'/'.join(choices)}): "
        else:
            ask_human_prompt = f"{message}: "
        asyncio.run(self.send_ws_message(ask_human_prompt))
        return Prompt.ask(message)


@serving(websocket=True)
def runskyagi(agent_configs: List[dict], **kwargs):
    """
    Run SkyAGI
    """
    websocket = kwargs.get("websocket")
    wc = WebContext(websocket)

    if len(agent_configs) <= 2:
        return "[error] Please config at least 2 agents, exiting"

    agent_names = []
    for agent_config in agent_configs:
        agent_names.append(agent_config["name"])

    # ask for the user's role
    user_role = wc.ask_human(
        "Pick which role you want to perform? (input the exact name, case sensitive)",
        choices=agent_names,
    ).strip()
    if user_role not in agent_names:
        return "[error] Please pick a valid agent, exiting"
    user_index = agent_names.index(user_role)

    # set up the agents
    ctx = agi_init(agent_configs, console, None, user_index, wc)

    # main loop
    actions = ["continue", "interview", "exit"]
    while True:
        instruction = {"command": "continue"}
        action = wc.ask_human("Pick an action to perform?", choices=actions)
        if action == "interview":
            robot_agent_names = list(map(lambda agent: agent.name, ctx.robot_agents))
            robot_agent_name = wc.ask_human(
                f"As {ctx.user_agent.name}, which agent do you want to talk to?",
                choices=robot_agent_names,
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
    return "existing"
