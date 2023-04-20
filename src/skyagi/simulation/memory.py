from langchain.chat_models import ChatOpenAI
from skyagi.simulation.agent import GenerativeAgent

USER_NAME = "Person A" # The name you want to use when interviewing the agent.
LLM = ChatOpenAI(max_tokens=1500) # Can be any LLM you want.

