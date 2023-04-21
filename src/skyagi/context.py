from typing import List
from rich.console import Console

from skyagi.simulation.agent import GenerativeAgent

class Context:
    def __init__(self, console: Console, openai_key: str) -> None:
        self.clock: int = 0
        self.console: Console = console
        self.openai_key: str = openai_key
        self.agents: List[GenerativeAgent] = []
        self.user_agent: GenerativeAgent = None
        self.robot_agents: List[GenerativeAgent] = []
        self.observations = ["Beginning of the day, people are living their lives."]
        self.timewindow_size = 3
        self.observations_size_history = []
