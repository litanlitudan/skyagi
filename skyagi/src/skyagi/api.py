from pathlib import Path

from rich.console import Console
from rich.prompt import Prompt

from skyagi.skyagi import agi_init, agi_step

import asyncio
from lcserve import serving
from typing import List

console = Console()

class WebContext:
    def __init__(self, websocket):
        self.websocket = websocket
        self.accumulated_responses = ""
    
    def add_response(self, response):
        self.accumulated_responses += (response + "\n")

    async def send_ws_message(self, message: str):
        if self.websocket is not None:
            await self.websocket.send_json(
                {'result': message, 'error': '', 'stdout': ''}
            )
        #print(message)


    def ask_human(self, message: str, choices: List[str]):
        if choices:
            ask_human_prompt = f"{message} ({'/'.join(choices)}): "
        else:
            ask_human_prompt = f"{message}: "
        self.add_response(ask_human_prompt)
        asyncio.run(self.send_ws_message(self.accumulated_responses))
        self.accumulated_responses = ""
        
        if choices:
            return Prompt.ask(message, choices=choices, default=choices[0])
        else:
            return Prompt.ask(message)


@serving(websocket=True)
def runskyagi(agent_configs: List[dict], **kwargs):
    """
    Run SkyAGI
    """
    websocket = kwargs.get('websocket')
    wc = WebContext(websocket)

    if len(agent_configs) <= 2:
        # TODO: return error
        return "[error] Please config at least 2 agents, exiting"
    
    agent_names = []
    for agent_config in agent_configs:
        agent_names.append(agent_config["name"])

    # ask for the user's role
    user_role = wc.ask_human("Pick which role you want to perform? (input the exact name, case sensitive)", choices=agent_names).strip()
    if user_role not in agent_names:
        # TODO: return error code
        return "[error] Please pick a valid agent, exiting" 
    user_index = agent_names.index(user_role)

    # set up the agents
    ctx = agi_init(agent_configs, console, None, user_index, wc)

    # main loop
    actions = ["continue", "interview", "exit"]
    while True:
        instruction = {"command": "continue"}
        action = wc.ask_human(
            "Pick an action to perform?", choices=actions
        )
        if action == "interview":
            robot_agent_names = list(map(lambda agent: agent.name, ctx.robot_agents))
            robot_agent_name = wc.ask_human(
                f"As {ctx.user_agent.name}, which agent do you want to talk to?",
                choices=robot_agent_names
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
        #agi_step(ctx, instruction)
        break
    return "close cmd"