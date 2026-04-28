# 🚀 AI Career Copilot

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=flat-square)](https://www.langchain.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?style=flat-square&logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

> **A full-stack AI-powered career assistant** that analyzes resumes, identifies skill gaps, and provides personalized interview preparation using Retrieval-Augmented Generation (RAG).

---

## 🌍 Live Demo

| Service  | URL |
|----------|-----|
| 🌐 Frontend | [https://your-project.vercel.app](https://your-project.vercel.app) *(update after deploy)* |
| ⚙️ Backend  | [https://your-backend.onrender.com](https://your-backend.onrender.com) *(update after deploy)* |

---

## 🔥 Features

| Feature | Description |
|---------|-------------|
| 📄 **Resume Upload** | Drag & drop PDF parsing with FAISS indexing |
| 🤖 **RAG Chatbot** | Context-aware AI chat powered by your resume |
| 📊 **Skill Gap Analysis** | Match score + gap detection vs. job description |
| 🎯 **Interview Simulator** | AI-generated, resume-tailored interview questions |
| 🌐 **Full-stack Deployed** | Vercel (frontend) + Render (backend) |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + Vite
- Glassmorphism UI with custom CSS design system
- Axios for API calls

### Backend
- **FastAPI** — async Python API
- **LangChain** — RAG orchestration
- **FAISS** — vector similarity search
- **OpenAI** — GPT-3.5 + text embeddings
- **pypdf** — PDF text extraction

---

## ⚡ RAG Architecture

```
PDF Resume Upload
      │
      ▼
Text Extraction (pypdf)
      │
      ▼
Text Chunking (RecursiveCharacterTextSplitter)
      │
      ▼
OpenAI Embeddings → FAISS Vector Store
      │
User Query ──► Semantic Retrieval (top-k chunks)
                       │
                       ▼
              GPT-3.5 + Context Prompt
                       │
                       ▼
              Personalized AI Response
```

---

## 🚀 Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env

uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🌐 Deployment

### Backend → Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo
4. Settings:
   - **Runtime:** Python 3
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `bash start.sh`
   - **Root directory:** `backend/`
5. Add env var: `OPENAI_API_KEY = your_key`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import project
2. Set **Root Directory** to `frontend/`
3. Add env var: `VITE_API_URL = https://your-backend.onrender.com`
4. Click Deploy

---

## 📸 Screenshots

*(Add screenshots after deployment)*

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/`       | Health check |
| `POST` | `/upload` | Upload PDF resume |
| `POST` | `/ask`    | RAG chat query |
| `POST` | `/analyze`| Skill gap analysis |
| `POST` | `/interview` | Generate interview questions |

---

## 📌 Future Improvements

- [ ] User authentication (JWT)
- [ ] Chat history persistence (Redis/PostgreSQL)
- [ ] LLM streaming responses (SSE)
- [ ] Multi-resume comparison
- [ ] Pinecone cloud vector DB integration
- [ ] LinkedIn profile import

---

## 👩‍💻 Author

**Kshitija Singh**  
AI Engineer · Machine Learning · GenAI

> *Built and deployed a full-stack AI Career Copilot using React, FastAPI, and RAG architecture with real-time GenAI chat, resume analysis, and interview simulation.*

---

## 📄 License

MIT © Kshitija Singh
