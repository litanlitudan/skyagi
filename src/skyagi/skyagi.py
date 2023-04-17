class Agent:
    def __init__(self, prompt: str):
        self.prompt = prompt
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
