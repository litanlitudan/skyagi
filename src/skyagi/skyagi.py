from typing import List

class Context:
    def __init__(self) -> None:
        self.clock = 0


class Agent:
    def __init__(self, name: str, personality: str, intro: str, relation: str) -> None:
        self.name = name
        self.personality = personality
        self.intro = intro
        self.relation = relation
        self.prompt = name, f"""You are the AI behind a NPC character called {name}
Here are some details about {name}:
{name} is {personality}
{intro}
{relation}"""
        self.memory = []


class Record:
    def __init__(self) -> None:
        pass


class Oberservation(Record):
    def __init__(self) -> None:
        super().__init__()


class Plan(Record):
    def __init__(self) -> None:
        super().__init__()


class Reflection(Record):
    def __init__(self) -> None:
        super().__init__()


def step(agents: List[Agent], ctx: Context) -> None:
    ctx.clock += 1
