from datetime import datetime, timedelta

from termcolor import colored

from langchain.chat_models import ChatOpenAI

from skyagi.simulation.agent import GenerativeAgent
from skyagi.simulation.simulation import create_new_memory_retriever, run_conversation, interview_agent

LLM = ChatOpenAI(max_tokens=1500)  # Can be any LLM you want.

tommie = GenerativeAgent(
    name="Tommie",
    age=25,
    traits="anxious, likes design",  # You can add more persistent traits here
    status="looking for a job",  # When connected to a virtual world, we can have the characters update their status
    memory_retriever=create_new_memory_retriever(),
    llm=LLM,
    daily_summaries=[
        "Drove across state to move to a new town but doesn't have a job yet."
    ],
    reflection_threshold=8,  # we will give this a relatively low number to show how reflection works
)

print(tommie.get_summary())

tommie_memories = [
    "Tommie remembers his dog, Bruno, from when he was a kid",
    "Tommie feels tired from driving so far",
    "Tommie sees the new home",
    "The new neighbors have a cat",
    "The road is noisy at night",
    "Tommie is hungry",
    "Tommie tries to get some rest.",
]

for memory in tommie_memories:
    tommie.add_memory(memory)

print(tommie.get_summary(force_refresh=True))

# Let's have Tommie start going through a day in the life.
observations = [
    "Tommie wakes up to the sound of a noisy construction site outside his window.",
    "Tommie gets out of bed and heads to the kitchen to make himself some coffee.",
    "Tommie realizes he forgot to buy coffee filters and starts rummaging through his moving boxes to find some.",
    "Tommie finally finds the filters and makes himself a cup of coffee.",
    "The coffee tastes bitter, and Tommie regrets not buying a better brand.",
    "Tommie checks his email and sees that he has no job offers yet.",
    "Tommie spends some time updating his resume and cover letter.",
    "Tommie heads out to explore the city and look for job openings.",
    "Tommie sees a sign for a job fair and decides to attend.",
    "The line to get in is long, and Tommie has to wait for an hour.",
    "Tommie meets several potential employers at the job fair but doesn't receive any offers.",
    "Tommie leaves the job fair feeling disappointed.",
    "Tommie stops by a local diner to grab some lunch.",
    "The service is slow, and Tommie has to wait for 30 minutes to get his food.",
    "Tommie overhears a conversation at the next table about a job opening.",
    "Tommie asks the diners about the job opening and gets some information about the company.",
    "Tommie decides to apply for the job and sends his resume and cover letter.",
    "Tommie continues his search for job openings and drops off his resume at several local businesses.",
    "Tommie takes a break from his job search to go for a walk in a nearby park.",
    "A dog approaches and licks Tommie's feet, and he pets it for a few minutes.",
    "Tommie sees a group of people playing frisbee and decides to join in.",
    "Tommie has fun playing frisbee but gets hit in the face with the frisbee and hurts his nose.",
    "Tommie goes back to his apartment to rest for a bit.",
    "A raccoon tore open the trash bag outside his apartment, and the garbage is all over the floor.",
    "Tommie starts to feel frustrated with his job search.",
    "Tommie calls his best friend to vent about his struggles.",
    "Tommie's friend offers some words of encouragement and tells him to keep trying.",
    "Tommie feels slightly better after talking to his friend.",
]

# Let's send Tommie on their way. We'll check in on their summary every few observations to watch it evolve
for i, observation in enumerate(observations):
    _, reaction = tommie.generate_reaction(observation)
    print(colored(observation, "green"), reaction)
    if ((i + 1) % 20) == 0:
        print("*" * 40)
        print(
            colored(
                f"After {i+1} observations, Tommie's summary is:\n{tommie.get_summary(force_refresh=True)}",
                "blue",
            )
        )
        print("*" * 40)

eve = GenerativeAgent(
    name="Eve",
    age=34,
    traits="curious, helpful",  # You can add more persistent traits here
    status="N/A",  # When connected to a virtual world, we can have the characters update their status
    memory_retriever=create_new_memory_retriever(),
    llm=LLM,
    daily_summaries=[
        (
            "Eve started her new job as a career counselor last week and received her first assignment, a client named Tommie."
        )
    ],
    reflection_threshold=5,
)

yesterday = (datetime.now() - timedelta(days=1)).strftime("%A %B %d")
eve_memories = [
    "Eve overhears her colleague say something about a new client being hard to work with",
    "Eve wakes up and hear's the alarm",
    "Eve eats a boal of porridge",
    "Eve helps a coworker on a task",
    "Eve plays tennis with her friend Xu before going to work",
    "Eve overhears her colleague say something about Tommie being hard to work with",
]
for memory in eve_memories:
    eve.add_memory(memory)


agents = [tommie, eve]
run_conversation(
    agents,
    "Tommie said: Hi, Eve. Thanks for agreeing to share your story with me and give me advice. I have a bunch of questions.",
)

print(tommie.get_summary(force_refresh=True))
print(eve.get_summary(force_refresh=True))
