from typing import List

from rich.console import Console
from rich.prompt import Prompt

from skyagi.simulation.agent import GenerativeAgent


class Context:
    def __init__(self, console: Console, openai_key: str, webcontext=None) -> None:
        self.clock: int = 0
        self.console: Console = console
        self.openai_key: str = openai_key
        self.agents: List[GenerativeAgent] = []
        self.user_agent: GenerativeAgent = None
        self.robot_agents: List[GenerativeAgent] = []
        self.observations = ["Beginning of the day, people are living their lives."]
        self.timewindow_size = 3
        self.observations_size_history = []
        self.webcontext = webcontext

    def print(self, message: str, style: str = None):
        if style:
            self.console.print(message, style=style)
        else:
            self.console.print(message)

        if self.webcontext:
            self.webcontext.send_response(message)

    def ask(self, message: str = "", choices: List[str] = None) -> str:
        if self.webcontext:
            return self.webcontext.ask_human(message, choices)
        else:
            if choices:
                return Prompt.ask(message, choices=choices, default=choices[0])
            else:
                return Prompt.ask(message)
