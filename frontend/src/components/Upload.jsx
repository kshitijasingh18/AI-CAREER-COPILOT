import React, { useState, useRef } from 'react'
import axios from 'axios'
import API_BASE from '../api'

export default function Upload({ onResumeLoaded }) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const inputRef                  = useRef(null)

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }

    setError('')
    setUploading(true)
    setProgress(0)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Animate progress bar while uploading
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 8, 85))
      }, 150)

      const { data } = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      clearInterval(interval)
      setProgress(100)
      setResult({ ...data, filename: file.name })
      onResumeLoaded()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Make sure the backend is running.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="upload-wrap">
      {/* Dropzone */}
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="dropzone-icon">{dragging ? '📂' : '📄'}</div>
        <h3>{dragging ? 'Drop it!' : 'Upload Your Resume'}</h3>
        <p>Drag & drop your PDF here, or click to browse</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          PDF · Max 10 MB
        </p>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="glass-card fade-in" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>Processing resume…</span>
            <span style={{ fontSize: 13, color: 'var(--accent-primary)' }}>{progress}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Parsing PDF → Chunking text → Building FAISS index…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-banner fade-in">⚠️ {error}</div>
      )}

      {/* Success */}
      {result && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="upload-success">
            <span className="icon">✅</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Resume indexed successfully!</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {result.filename} — FAISS vector store built
              </div>
            </div>
          </div>

          <div className="upload-stats">
            <div className="glass-card stat-card">
              <div className="num">{result.chunks}</div>
              <div className="label">Text Chunks</div>
            </div>
            <div className="glass-card stat-card">
              <div className="num">{result.word_count?.toLocaleString()}</div>
              <div className="label">Words Indexed</div>
            </div>
            <div className="glass-card stat-card">
              <div className="num">✓</div>
              <div className="label">FAISS Ready</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 <strong>Next steps:</strong> Go to <em>AI Copilot</em> to chat with your resume,
              or <em>Skill Gap</em> to analyze against a job description.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
