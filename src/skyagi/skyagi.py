class Memory:
    def __init__(self):
        pass


class Record:
    def __init__(self):
        pass


class Agent:
    def __init__(self, prompt: str):
        self.prompt = prompt


class Recency:
    def __init__(self):
        pass


class Importance:
    def __init__(self, prompt: str):
        self.prompt = prompt

    def get_importance(self):
        return 0


class Relevance:
    def __init__(self):
        pass


class Reflection:
    def __init__(self):
        pass


class Plan:
    def __init__(self):
        pass


def retrieve_records(memory, context):
    return []


def reflect(records):
    return ""

def plan(records):
    return ""
