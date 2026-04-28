import React, { useState } from 'react'
import Chat from './components/Chat'
import Upload from './components/Upload'
import Analysis from './components/Analysis'
import Interview from './components/Interview'

const VIEWS = [
  { id: 'chat',      label: 'AI Copilot',  icon: '🤖', badge: 'RAG' },
  { id: 'upload',    label: 'Resume',       icon: '📄', badge: null  },
  { id: 'analysis',  label: 'Skill Gap',   icon: '📊', badge: null  },
  { id: 'interview', label: 'Interview',   icon: '🎯', badge: null  },
]

const VIEW_META = {
  chat:      { title: 'AI Career Copilot',   sub: 'Context-aware chat powered by RAG + GPT' },
  upload:    { title: 'Resume Upload',        sub: 'Upload your PDF resume to get started' },
  analysis:  { title: 'Skill Gap Analysis',  sub: 'Compare your resume against job descriptions' },
  interview: { title: 'Interview Simulator', sub: 'AI-generated questions tailored to your resume' },
}

export default function App() {
  const [view, setView]           = useState('chat')
  const [resumeReady, setResumeReady] = useState(false)

  return (
    <>
      <div className="app-bg" />
      <div className="app-shell">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">✦</div>
            <div>
              <h1>AI Career Copilot</h1>
              <p>GenAI · RAG · FastAPI</p>
            </div>
          </div>

          {VIEWS.map(v => (
            <button
              key={v.id}
              className={`nav-btn ${view === v.id ? 'active' : ''}`}
              onClick={() => setView(v.id)}
            >
              <span className="nav-icon">{v.icon}</span>
              <span className="nav-label">{v.label}</span>
              {v.badge && <span className="nav-badge">{v.badge}</span>}
            </button>
          ))}

          <div className="sidebar-footer">
            <div className="status-dot">
              <span />
              {resumeReady ? 'Resume loaded' : 'No resume loaded'}
            </div>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────────── */}
        <main className="main-content">
          <div className="top-bar">
            <div>
              <div className="top-bar-title">{VIEW_META[view].title}</div>
              <div className="top-bar-sub">{VIEW_META[view].sub}</div>
            </div>
            <div className="top-bar-pill">
              <span>🟢</span> GPT-3.5 · FAISS
            </div>
          </div>

          {view === 'chat'      && <Chat resumeReady={resumeReady} />}
          {view === 'upload'    && <Upload onResumeLoaded={() => setResumeReady(true)} />}
          {view === 'analysis'  && <Analysis resumeReady={resumeReady} />}
          {view === 'interview' && <Interview resumeReady={resumeReady} />}
        </main>

      </div>
    </>
  )
}
