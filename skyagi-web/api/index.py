from fastapi import FastAPI
from rich.console import Console
from skyagi.settings import Settings, load_model_setting
from skyagi.simulation.simulation import interview_agent
from skyagi.skyagi import agi_init

app = FastAPI()


@app.get("/api/hello")
async def hello():
    return {"message": "Hello world!"}


@app.get("/api/send-conversation-message")
def send_conversation_message():
    # TODO: (kejiez) get from supabase
    agent_configs = [
        {
            "name": "Bucky Barnes",
            "age": 106,
            "personality": "resilient, loyal, introspective",
            "memories": [
                "Growing up with Steve Rogers as his best friend and confidant.",
                "Being drafted into the army during World War II and fighting alongside Steve.",
                "Falling from a train and being captured by Hydra, leading to his transformation into the Winter Soldier.",
                "Carrying out numerous assassinations as the Winter Soldier under Hydra's control.",
                "Reuniting with Steve in the present day, initially unable to remember their shared past.",
                "Gradually regaining his memories with Steve's help and support.",
            ],
            "current_status": "Bucky Barnes, now free from his past as the Winter Soldier, seeks to make amends and find his place in the world, while continuing to strengthen his relationships with Steve Rogers and Tony Stark, as well as his fellow Avengers.",
        },
        {
            "name": "Steve Rogers",
            "age": 108,
            "personality": "loyal, brave, selfless",
            "memories": [
                "Growing up with Bucky Barnes as his best friend and confidant.",
                "Reuniting with Bucky as the Winter Soldier and the struggle to help him remember his past.",
                "Being at odds with Tony Stark during their first meeting as Avengers.",
                "Developing a strong friendship with Tony despite their differing opinions and personalities.",
                "Working together with Tony and the Avengers to save New York from Loki's invasion.",
                "The shock and disbelief of learning about Bucky's involvement in Tony's parents' deaths.",
            ],
            "current_status": "Steve Rogers, now focused on enjoying a well-deserved retirement and offering guidance to the new generation of heroes.",
        },
    ]

    # TODO: (kejiez) get from supabase
    settings = Settings()
    settings.model = load_model_setting("openai-gpt-3.5-turbo")
    console = Console()
    user_index = 0

    ctx = agi_init(agent_configs, console, settings, user_index)

    # get response from recipient agent
    recipient_agent = ctx.robot_agents[0]
    initiator_message = "Hi, how is it going? What are you doing right now?"
    response = interview_agent(
        agent=recipient_agent, message=initiator_message, username=ctx.user_agent.name
    )

    return response
