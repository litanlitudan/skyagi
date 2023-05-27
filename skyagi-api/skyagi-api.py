import asyncio
from typing import Any, Dict, List

from lcserve import serving
from rich.console import Console
from rich.prompt import Prompt
from skyagi.settings import (
    ModelSettings,
    Settings,
    load_credentials_into_embedding_settings,
    load_credentials_into_llm_settings,
    load_embedding_settings_template_from_name,
    load_llm_settings_template_from_name,
)
from skyagi.skyagi import agi_init, agi_step
from skyagi.util import verify_embedding_initialization, verify_llm_initialization

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
def runskyagi(agent_configs: List[dict], model: Dict[str, Any], **kwargs):
    """
    Run SkyAGI
    """
    websocket = kwargs.get("websocket")
    wc = WebContext(websocket)

    settings = Settings()

    if model["llm_model"] == "openai-gpt-4":
        wc.send_response(
            "OpenAI GPT4 API is in waitlist, makes sure you are granted access."
            " Check: https://openai.com/waitlist/gpt-4-api"
        )

    llm_settings = load_llm_settings_template_from_name(model["llm_model"])

    # Load Provider Credentials into LLM args
    llm_settings = load_credentials_into_llm_settings(
        settings=settings, llm_settings=llm_settings
    )

    # Verify LLM initialization
    res = verify_llm_initialization(llm_settings=llm_settings)
    if res != "OK":
        return f"[error] {res}"

    embedding_settings = load_embedding_settings_template_from_name(
        model["embedding_model"]
    )

    # Load Provider Credentials into Embedding args
    embedding_settings = load_credentials_into_embedding_settings(
        settings=settings, embedding_settings=embedding_settings
    )

    # Verify Embedding initialization
    res = verify_embedding_initialization(embedding_settings=embedding_settings)
    if res != "OK":
        return f"[error] {res}"

    settings.model = ModelSettings(llm=llm_settings, embedding=embedding_settings)

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
    ctx = agi_init(agent_configs, console, settings, user_index, wc)

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
