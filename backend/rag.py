import os
import json
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai
from langchain_core.embeddings import Embeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS


class GeminiEmbeddings(Embeddings):
    """Direct google-generativeai embeddings — uses v1 API, avoids v1beta issues."""
    def __init__(self, api_key: str, model: str = "models/text-embedding-004"):
        genai.configure(api_key=api_key)
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [
            genai.embed_content(model=self.model, content=t)["embedding"]
            for t in texts
        ]

    def embed_query(self, text: str) -> List[float]:
        return genai.embed_content(model=self.model, content=text)["embedding"]

# Use GOOGLE_API_KEY from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class RAGSystem:
    def __init__(self):
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        # Use Gemini 1.5 Flash (Fast and Free Tier)
        self._llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.4
        )
        # Use direct google-generativeai embeddings (v1 API — no v1beta issues)
        self._embeddings = GeminiEmbeddings(api_key=GOOGLE_API_KEY)
        self._vector_store = None
        self.doc_metadata = {}

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

        # Retrieve relevant chunks
        docs = self._vector_store.similarity_search(question, k=4)
        context = "\n\n".join(d.page_content for d in docs)

        prompt = f"""You are an AI Career Copilot assistant. Use ONLY the resume context below
to answer the user's question. Be specific and helpful.

Resume Context:
{context}

Question: {question}

Answer (be concise and professional):"""

        response = self._llm.invoke(prompt)
        sources = list({d.metadata.get("source", "resume") for d in docs})
        return {"answer": response.content, "sources": sources}

    def analyze(self, job_description: str = "") -> dict:
        """Analyze resume against job description."""
        if not self._vector_store:
            return {"error": "No resume loaded"}

        # Get summary of resume
        resume_context = self._vector_store.similarity_search("skills projects experience", k=8)
        context_text = "\n".join([d.page_content for d in resume_context])

        prompt = f"""Analyze the following resume against this job description.
        
JD: {job_description if job_description else 'General Software Engineering Role'}
Resume: {context_text}

Return a JSON object with:
match_score (0-100), summary (2 sentences), strong_skills (list), skill_gaps (list), recommendations (list).
JSON ONLY."""

        response = self._llm.invoke(prompt)
        try:
            # Handle potential markdown in LLM output
            clean_content = response.content.strip().replace('```json', '').replace('```', '')
            return json.loads(clean_content)
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

        response = self._llm.invoke(prompt)
        try:
            clean_content = response.content.strip().replace('```json', '').replace('```', '')
            return {"questions": json.loads(clean_content)}
        except:
            return {"questions": []}
