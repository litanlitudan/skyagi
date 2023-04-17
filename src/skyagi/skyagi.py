class Agent:
    def __init__(self, name: str, personality: str, intro: str, relation: str):
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
    def __init__(self):
        pass


class Oberservation(Record):
    def __init__(self):
        super().__init__()


class Plan(Record):
    def __init__(self):
        super().__init__()


class Reflection(Record):
    def __init__(self):
        super().__init__()


def run_agi(num_iterations, agents):
    timer = 0
    for iter in range(num_iterations):
        pass
    pass


if __name__ == "__main__":
    run_agi(3, [])
