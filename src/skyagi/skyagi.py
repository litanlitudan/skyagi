class Memory:
    def __init__(self):
        pass

class Event:
    def __init__(self, prompt: str):
        self.prompt = prompt

class Agent:
    def __init__(self, prompt: str):
        self.prompt = prompt

class Recency:
    def __init__(self):
        pass

class Importance:
    def __init__(self, prompt: str):
        self.prompt = prompt

    def get_importance(self, event: Event):
        return 0

class Relevance:
    def __init__(self):
        pass
