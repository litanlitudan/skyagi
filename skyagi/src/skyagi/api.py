from pathlib import Path

from rich.console import Console

from skyagi.skyagi import agi_init, agi_step

import asyncio
from lcserve import serving
from typing import List

console = Console()


async def send_ws_message(websocket, message: str):
    if websocket is not None:
        await websocket.send_json(
            {'result': message, 'error': '', 'stdout': ''}
        )
    print(message)


def report_error(websocket, err_msg: str):
    asyncio.run(send_ws_message(websocket, err_msg))

# TODO: wrapper for Prompt.ask
def ask_human(websocket, message: str, choices: List[str]):
    choice_prompt = f"{message} ({'/'.join(choices)}): "
    asyncio.run(send_ws_message(websocket, choice_prompt))
    res = input()
    print(res)
    return res


#@serving(websocket=True)
#def runskyagi(question: str, **kwargs):
@serving(websocket=True)
def runskyagi(agent_configs: List[dict], **kwargs):
    """
    Run SkyAGI
    """
    websocket = kwargs.get('websocket')
    openai_token = kwargs.get('openai_token') #TODO: make this more general

    if len(agent_configs) <= 2:
        # TODO: return error
        return "[error] Please config at least 2 agents, exiting"
    
    agent_names = []
    for agent_config in agent_configs:
        agent_names.append(agent_config["name"])

    # ask for the user's role
    user_role = ask_human(websocket, "Pick which role you want to perform? (input the exact name, case sensitive)", choices=agent_names).strip()
    print("user_role:", user_role)
    if user_role not in agent_names:
        return "[error] Please pick a valid agent, exiting" 
    user_index = agent_names.index(user_role)
    return "close cmd"

    # set up the agents
    ctx = agi_init(agent_configs, console, openai_token, user_index)
    return "close cmd"

    # main loop
    actions = ["continue", "interview", "exit"]
    while True:
        instruction = {"command": "continue"}
        action = ask_human(
            websocket,
            "Pick an action to perform?", choices=actions
        )
        if action == "interview":
            robot_agent_names = list(map(lambda agent: agent.name, ctx.robot_agents))
            robot_agent_name = ask_human(
                websocket,
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