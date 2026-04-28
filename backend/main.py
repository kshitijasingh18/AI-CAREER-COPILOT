import os
import json
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from rag import RAGSystem

app = FastAPI(title="AI Career Copilot API", version="1.0.0")

# CORS — allow Vercel frontend + localhost for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this to your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGSystem()


# ─── Request/Response Models ───────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []


class AnalysisRequest(BaseModel):
    job_description: str = ""


class InterviewRequest(BaseModel):
    topic: str = "general"
    num_questions: int = 5


# ─── Health Check ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "AI Career Copilot API is running 🚀",
        "endpoints": ["/upload", "/ask", "/analyze", "/interview"]
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "resume_loaded": rag.is_ready()}


# ─── Resume Upload ─────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload a PDF resume and build the RAG vector store."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # Save uploaded file to a temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        # Build RAG index from the PDF
        result = rag.load_resume(tmp_path)
        os.unlink(tmp_path)  # clean up temp file

        return {
            "status": "success",
            "message": f"Resume '{file.filename}' uploaded and indexed successfully.",
            "chunks": result["chunks"],
            "word_count": result["word_count"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


# ─── RAG Chat ─────────────────────────────────────────────────────────────────

@app.post("/ask", response_model=ChatResponse)
async def ask(request: ChatRequest):
    """Ask the AI a question about the uploaded resume."""
    if not rag.is_ready():
        raise HTTPException(
            status_code=400,
            detail="No resume loaded. Please upload a resume first."
        )

    try:
        result = rag.query(request.message)
        return ChatResponse(
            response=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


# ─── Resume Analysis ──────────────────────────────────────────────────────────

@app.post("/analyze")
async def analyze_resume(request: AnalysisRequest):
    """Analyze the resume against a job description and return skill gaps + match score."""
    if not rag.is_ready():
        raise HTTPException(
            status_code=400,
            detail="No resume loaded. Please upload a resume first."
        )

    try:
        result = rag.analyze(request.job_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ─── Interview Simulator ──────────────────────────────────────────────────────

@app.post("/interview")
async def generate_interview_questions(request: InterviewRequest):
    """Generate tailored interview questions based on the resume."""
    if not rag.is_ready():
        raise HTTPException(
            status_code=400,
            detail="No resume loaded. Please upload a resume first."
        )

    try:
        result = rag.generate_interview_questions(request.topic, request.num_questions)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview generation failed: {str(e)}")
