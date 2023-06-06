import os
import pickle
from langchain import FAISS
from langchain.retrievers import TimeWeightedVectorStoreRetriever
from langchain.embeddings.base import Embeddings


class Retriever(TimeWeightedVectorStoreRetriever):
    embedding_model: Embeddings

    def faiss_path(self, path) -> str:
        return path + "/faiss"

    def mem_path(self, path) -> str:
        return path + "/memory.pickle"

    def try_load_memory(self, path: str) -> bool:
        if not os.path.isdir(path):
            return False

        faiss_path = self.faiss_path(path)
        faiss: FAISS = self.vectorstore
        faiss.load_local(faiss_path, self.embedding_model)

        mem_path = self.mem_path(path)
        with open(mem_path, "rb") as mem_file:
            self.memory_stream = pickle.load(mem_file)

        return True

    def dump_memory(self, path: str) -> bool:
        faiss: FAISS = self.vectorstore
        faiss.save_local(self.faiss_path(path))
        with open(self.mem_path(path), "wb") as mem_file:
            pickle.dump(self.memory_stream, mem_file)
