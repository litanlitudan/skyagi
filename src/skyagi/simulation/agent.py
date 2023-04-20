# Reference: https://python.langchain.com/en/latest/use_cases/agent_simulations

import re
from typing import List, Optional, Tuple
from termcolor import colored

from datetime import datetime

from pydantic import BaseModel, Field

from langchain import LLMChain
from langchain.retrievers import TimeWeightedVectorStoreRetriever
from langchain.schema import BaseLanguageModel, Document
from langchain.prompts import PromptTemplate


class GenerativeAgent(BaseModel):
    """A character with memory and innate characteristics."""

    name: str
    age: int
    traits: str
    """The traits of the character you wish not to change."""
    status: str
    """Current activities of the character."""
    llm: BaseLanguageModel
    memory_retriever: TimeWeightedVectorStoreRetriever
    """The retriever to fetch related memories."""
    verbose: bool = False

    reflection_threshold: Optional[float] = None
    """When the total 'importance' of memories exceeds the above threshold, stop to reflect."""

    current_plan: List[str] = []
    """The current plan of the agent."""

    summary: str = ""  #: :meta private:
    summary_refresh_seconds: int = 3600  #: :meta private:
    last_refreshed: datetime = Field(default_factory=datetime.now)  #: :meta private:
    daily_summaries: List[str]  #: :meta private:
    memory_importance: float = 0.0  #: :meta private:
    max_tokens_limit: int = 1200  #: :meta private:

    class Config:
        """Configuration for this pydantic object."""

        arbitrary_types_allowed = True

    @staticmethod
    def _parse_list(text: str) -> List[str]:
        """Parse a newline-separated string into a list of strings."""
        lines = re.split(r"\n", text.strip())
        return [re.sub(r"^\s*\d+\.\s*", "", line).strip() for line in lines]

    def _compute_agent_summary(self):
        """"""
        prompt = PromptTemplate.from_template(
            "How would you summarize {name}'s core characteristics given the"
            + " following statements:\n"
            + "{related_memories}"
            + "Do not embellish."
            + "\n\nSummary: "
        )
        # The agent seeks to think about their core characteristics.
        relevant_memories = self.fetch_memories(f"{self.name}'s core characteristics")
        relevant_memories_str = "\n".join(
            [f"{mem.page_content}" for mem in relevant_memories]
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        return chain.run(name=self.name, related_memories=relevant_memories_str).strip()

    def _get_topics_of_reflection(self, last_k: int = 50) -> Tuple[str, str, str]:
        """Return the 3 most salient high-level questions about recent observations."""
        prompt = PromptTemplate.from_template(
            "{observations}\n\n"
            + "Given only the information above, what are the 3 most salient"
            + " high-level questions we can answer about the subjects in the statements?"
            + " Provide each question on a new line.\n\n"
        )
        reflection_chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        observations = self.memory_retriever.memory_stream[-last_k:]
        observation_str = "\n".join([o.page_content for o in observations])
        result = reflection_chain.run(observations=observation_str)
        return self._parse_list(result)

    def _get_insights_on_topic(self, topic: str) -> List[str]:
        """Generate 'insights' on a topic of reflection, based on pertinent memories."""
        prompt = PromptTemplate.from_template(
            "Statements about {topic}\n"
            + "{related_statements}\n\n"
            + "What 5 high-level insights can you infer from the above statements?"
            + " (example format: insight (because of 1, 5, 3))"
        )
        related_memories = self.fetch_memories(topic)
        related_statements = "\n".join(
            [
                f"{i+1}. {memory.page_content}"
                for i, memory in enumerate(related_memories)
            ]
        )
        reflection_chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        result = reflection_chain.run(
            topic=topic, related_statements=related_statements
        )
        # TODO: Parse the connections between memories and insights
        return self._parse_list(result)

    def pause_to_reflect(self) -> List[str]:
        """Reflect on recent observations and generate 'insights'."""
        print(colored(f"Character {self.name} is reflecting", "blue"))
        new_insights = []
        topics = self._get_topics_of_reflection()
        for topic in topics:
            insights = self._get_insights_on_topic(topic)
            for insight in insights:
                self.add_memory(insight)
            new_insights.extend(insights)
        return new_insights

    def _score_memory_importance(
        self, memory_content: str, weight: float = 0.15
    ) -> float:
        """Score the absolute importance of the given memory."""
        # A weight of 0.25 makes this less important than it
        # would be otherwise, relative to salience and time
        prompt = PromptTemplate.from_template(
            "On the scale of 1 to 10, where 1 is purely mundane"
            + " (e.g., brushing teeth, making bed) and 10 is"
            + " extremely poignant (e.g., a break up, college"
            + " acceptance), rate the likely poignancy of the"
            + " following piece of memory. Respond with a single integer."
            + "\nMemory: {memory_content}"
            + "\nRating: "
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        score = chain.run(memory_content=memory_content).strip()
        match = re.search(r"^\D*(\d+)", score)
        if match:
            return (float(score[0]) / 10) * weight
        else:
            return 0.0

    def add_memory(self, memory_content: str) -> List[str]:
        """Add an observation or memory to the agent's memory."""
        importance_score = self._score_memory_importance(memory_content)
        self.memory_importance += importance_score
        document = Document(
            page_content=memory_content, metadata={"importance": importance_score}
        )
        result = self.memory_retriever.add_documents([document])

        # After an agent has processed a certain amount of memories (as measured by
        # aggregate importance), it is time to reflect on recent events to add
        # more synthesized memories to the agent's memory stream.
        if (
            self.reflection_threshold is not None
            and self.memory_importance > self.reflection_threshold
            and self.status != "Reflecting"
        ):
            old_status = self.status
            self.status = "Reflecting"
            self.pause_to_reflect()
            # Hack to clear the importance from reflection
            self.memory_importance = 0.0
            self.status = old_status
        return result

    def fetch_memories(self, observation: str) -> List[Document]:
        """Fetch related memories."""
        return self.memory_retriever.get_relevant_documents(observation)

    def get_summary(self, force_refresh: bool = False) -> str:
        """Return a descriptive summary of the agent."""
        current_time = datetime.now()
        since_refresh = (current_time - self.last_refreshed).seconds
        if (
            not self.summary
            or since_refresh >= self.summary_refresh_seconds
            or force_refresh
        ):
            self.summary = self._compute_agent_summary()
            self.last_refreshed = current_time
        return (
            f"Name: {self.name} (age: {self.age})"
            + f"\nInnate traits: {self.traits}"
            + f"\n{self.summary}"
        )

    def get_full_header(self, force_refresh: bool = False) -> str:
        """Return a full header of the agent's status, summary, and current time."""
        summary = self.get_summary(force_refresh=force_refresh)
        current_time_str = datetime.now().strftime("%B %d, %Y, %I:%M %p")
        return (
            f"{summary}\nIt is {current_time_str}.\n{self.name}'s status: {self.status}"
        )

    def _get_entity_from_observation(self, observation: str) -> str:
        prompt = PromptTemplate.from_template(
            "What is the observed entity in the following observation? {observation}"
            + "\nEntity="
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        return chain.run(observation=observation).strip()

    def _get_entity_action(self, observation: str, entity_name: str) -> str:
        prompt = PromptTemplate.from_template(
            "What is the {entity} doing in the following observation? {observation}"
            + "\nThe {entity} is"
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        return chain.run(entity=entity_name, observation=observation).strip()

    def _format_memories_to_summarize(self, relevant_memories: List[Document]) -> str:
        content_strs = set()
        content = []
        for mem in relevant_memories:
            if mem.page_content in content_strs:
                continue
            content_strs.add(mem.page_content)
            created_time = mem.metadata["created_at"].strftime("%B %d, %Y, %I:%M %p")
            content.append(f"- {created_time}: {mem.page_content.strip()}")
        return "\n".join([f"{mem}" for mem in content])

    def summarize_related_memories(self, observation: str) -> str:
        """Summarize memories that are most relevant to an observation."""
        entity_name = self._get_entity_from_observation(observation)
        entity_action = self._get_entity_action(observation, entity_name)
        q1 = f"What is the relationship between {self.name} and {entity_name}"
        relevant_memories = self.fetch_memories(
            q1
        )  # Fetch memories related to the agent's relationship with the entity
        q2 = f"{entity_name} is {entity_action}"
        relevant_memories += self.fetch_memories(
            q2
        )  # Fetch things related to the entity-action pair
        context_str = self._format_memories_to_summarize(relevant_memories)
        prompt = PromptTemplate.from_template(
            "{q1}?\nContext from memory:\n{context_str}\nRelevant context: "
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, verbose=self.verbose)
        return chain.run(q1=q1, context_str=context_str.strip()).strip()

    def _get_memories_until_limit(self, consumed_tokens: int) -> str:
        """Reduce the number of tokens in the documents."""
        result = []
        for doc in self.memory_retriever.memory_stream[::-1]:
            if consumed_tokens >= self.max_tokens_limit:
                break
            consumed_tokens += self.llm.get_num_tokens(doc.page_content)
            if consumed_tokens < self.max_tokens_limit:
                result.append(doc.page_content)
        return "; ".join(result[::-1])

    def _generate_reaction(self, observation: str, suffix: str) -> str:
        """React to a given observation."""
        prompt = PromptTemplate.from_template(
            "{agent_summary_description}"
            + "\nIt is {current_time}."
            + "\n{agent_name}'s status: {agent_status}"
            + "\nSummary of relevant context from {agent_name}'s memory:"
            + "\n{relevant_memories}"
            + "\nMost recent observations: {recent_observations}"
            + "\nObservation: {observation}"
            + "\n\n"
            + suffix
        )
        agent_summary_description = self.get_summary()
        relevant_memories_str = self.summarize_related_memories(observation)
        current_time_str = datetime.now().strftime("%B %d, %Y, %I:%M %p")
        kwargs = dict(
            agent_summary_description=agent_summary_description,
            current_time=current_time_str,
            relevant_memories=relevant_memories_str,
            agent_name=self.name,
            observation=observation,
            agent_status=self.status,
        )
        consumed_tokens = self.llm.get_num_tokens(
            prompt.format(recent_observations="", **kwargs)
        )
        kwargs["recent_observations"] = self._get_memories_until_limit(consumed_tokens)
        action_prediction_chain = LLMChain(llm=self.llm, prompt=prompt)
        result = action_prediction_chain.run(**kwargs)
        return result.strip()

    def generate_reaction(self, observation: str) -> Tuple[bool, str]:
        """React to a given observation."""
        call_to_action_template = (
            "Should {agent_name} react to the observation, and if so,"
            + " what would be an appropriate reaction? Respond in one line."
            + ' If the action is to engage in dialogue, write:\nSAY: "what to say"'
            + "\notherwise, write:\nREACT: {agent_name}'s reaction (if anything)."
            + "\nEither do nothing, react, or say something but not both.\n\n"
        )
        full_result = self._generate_reaction(observation, call_to_action_template)
        result = full_result.strip().split("\n")[0]
        self.add_memory(f"{self.name} observed {observation} and reacted by {result}")
        if "REACT:" in result:
            reaction = result.split("REACT:")[-1].strip()
            return False, f"{self.name} {reaction}"
        if "SAY:" in result:
            said_value = result.split("SAY:")[-1].strip()
            return True, f"{self.name} said {said_value}"
        else:
            return False, result

    def generate_dialogue_response(self, observation: str) -> Tuple[bool, str]:
        """React to a given observation."""
        call_to_action_template = 'What would {agent_name} say? To end the conversation, write: GOODBYE: "what to say". Otherwise to continue the conversation, write: SAY: "what to say next"\n\n'
        full_result = self._generate_reaction(observation, call_to_action_template)
        result = full_result.strip().split("\n")[0]
        if "GOODBYE:" in result:
            farewell = result.split("GOODBYE:")[-1].strip()
            self.add_memory(f"{self.name} observed {observation} and said {farewell}")
            return False, f"{self.name} said {farewell}"
        if "SAY:" in result:
            response_text = result.split("SAY:")[-1].strip()
            self.add_memory(
                f"{self.name} observed {observation} and said {response_text}"
            )
            return True, f"{self.name} said {response_text}"
        else:
            return False, result
