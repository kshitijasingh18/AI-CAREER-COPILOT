import os
import json
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from google import genai as google_genai
from langchain_core.embeddings import Embeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS


class GeminiEmbeddings(Embeddings):
    """Embeddings via google-genai SDK (v1 API) — no v1beta issues."""
    def __init__(self, client, model: str = "text-embedding-004"):
        self.client = client
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [
            list(self.client.models.embed_content(model=self.model, contents=t).embeddings[0].values)
            for t in texts
        ]

    def embed_query(self, text: str) -> List[float]:
        return list(self.client.models.embed_content(model=self.model, contents=text).embeddings[0].values)


# Use GOOGLE_API_KEY from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


class RAGSystem:
    def __init__(self):
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")

        # Single client for both LLM and embeddings — pure google-genai (v1 API)
        self._client = google_genai.Client(api_key=GOOGLE_API_KEY)
        self._embeddings = GeminiEmbeddings(client=self._client)
        self._vector_store = None
        self.doc_metadata = {}

    def is_ready(self) -> bool:
        return self._vector_store is not None

    def _generate(self, prompt: str) -> str:
        """Call Gemini 1.5 Flash directly via new SDK."""
        response = self._client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return response.text

    def load_resume(self, file_path: str):
        """Parse PDF and build FAISS vector store."""
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = text_splitter.split_documents(docs)

        self._vector_store = FAISS.from_documents(chunks, self._embeddings)

        self.doc_metadata = {
            "chunks": len(chunks),
            "word_count": sum(len(d.page_content.split()) for d in docs),
            "pages": len(docs)
        }
        return self.doc_metadata

    def query(self, question: str) -> dict:
        """Answer a question using RAG over the resume."""
        if not self._vector_store:
            return {"answer": "Please upload a resume first.", "sources": []}

        docs = self._vector_store.similarity_search(question, k=4)
        context = "\n\n".join(d.page_content for d in docs)

        prompt = f"""You are an AI Career Copilot assistant. Use ONLY the resume context below
to answer the user's question. Be specific and helpful.

Resume Context:
{context}

Question: {question}

Answer (be concise and professional):"""

        answer = self._generate(prompt)
        sources = list({d.metadata.get("source", "resume") for d in docs})
        return {"answer": answer, "sources": sources}

    def analyze(self, job_description: str = "") -> dict:
        """Analyze resume against job description."""
        if not self._vector_store:
            return {"error": "No resume loaded"}

        resume_context = self._vector_store.similarity_search("skills projects experience", k=8)
        context_text = "\n".join([d.page_content for d in resume_context])

        prompt = f"""Analyze the following resume against this job description.

JD: {job_description if job_description else 'General Software Engineering Role'}
Resume: {context_text}

Return a JSON object with:
match_score (0-100), summary (2 sentences), strong_skills (list), skill_gaps (list), recommendations (list).
JSON ONLY."""

        response_text = self._generate(prompt)
        try:
            clean = response_text.strip().replace('```json', '').replace('```', '')
            return json.loads(clean)
        except:
            return {"match_score": 0, "summary": "Error parsing response"}

    def generate_interview_questions(self, topic: str = "technical", count: int = 5) -> dict:
        """Generate tailored interview questions."""
        if not self._vector_store:
            return {"error": "No resume loaded"}

        resume_context = self._vector_store.similarity_search(topic, k=5)
        context_text = "\n".join([d.page_content for d in resume_context])

        prompt = f"""Generate {count} {topic} interview questions based on this resume:
{context_text}

For each question, provide an 'ideal_answer' based on the resume.
Return JSON list: [{{"question": "...", "type": "...", "ideal_answer": "..."}}]
JSON ONLY."""

        response_text = self._generate(prompt)
        try:
            clean = response_text.strip().replace('```json', '').replace('```', '')
            return {"questions": json.loads(clean)}
        except:
            return {"questions": []}
