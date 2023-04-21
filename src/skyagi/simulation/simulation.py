from typing import List

import math

import faiss

from langchain.docstore import InMemoryDocstore
from langchain.embeddings import OpenAIEmbeddings
from langchain.retrievers import TimeWeightedVectorStoreRetriever
from langchain.vectorstores import FAISS

from skyagi.context import Context
from skyagi.simulation.agent import GenerativeAgent


# reference: https://python.langchain.com/en/latest/use_cases/agent_simulations/characters.html#create-a-generative-character
def relevance_score_fn(score: float) -> float:
    """Return a similarity score on a scale [0, 1]."""
    # This will differ depending on a few things:
    # - the distance / similarity metric used by the VectorStore
    # - the scale of your embeddings (OpenAI's are unit norm. Many others are not!)
    # This function converts the euclidean norm of normalized embeddings
    # (0 is most similar, sqrt(2) most dissimilar)
    # to a similarity function (0 to 1)
    return 1.0 - score / math.sqrt(2)


# reference: https://python.langchain.com/en/latest/use_cases/agent_simulations/characters.html#create-a-generative-character
def create_new_memory_retriever():
    """Create a new vector store retriever unique to the agent."""
    # Define your embedding model
    embeddings_model = OpenAIEmbeddings()
    # Initialize the vectorstore as empty
    embedding_size = 1536
    index = faiss.IndexFlatL2(embedding_size)
    vectorstore = FAISS(
        embeddings_model.embed_query,
        index,
        InMemoryDocstore({}),
        {},
        relevance_score_fn=relevance_score_fn,
    )
    return TimeWeightedVectorStoreRetriever(
        vectorstore=vectorstore, other_score_keys=["importance"], k=15
    )


def run_conversation(agents: List[GenerativeAgent], initial_observation: str, ctx: Context) -> None:
    """Runs a conversation between agents."""
    ctx.observations.append("A conversation happened among " + ",".join(list(map(lambda agent: agent.name, agents))))
    ctx.observations.append(initial_observation)

    _, observation = agents[1].generate_reaction(initial_observation)
    ctx.observations.append(observation)

    turns = 0
    while True:
        break_dialogue = False
        for agent in agents:
            stay_in_dialogue, observation = agent.generate_dialogue_response(
                observation
            )
            ctx.observations.append(observation)
            if not stay_in_dialogue:
                break_dialogue = True
        if break_dialogue:
            break
        turns += 1


def interview_agent(agent: GenerativeAgent, message: str, username: str) -> str:
    """Help the notebook user interact with the agent."""
    new_message = f"{username} says {message}"
    return agent.generate_dialogue_response(new_message)[1]
