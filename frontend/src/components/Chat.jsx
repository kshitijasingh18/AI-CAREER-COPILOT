import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import API_BASE from '../api'

const SUGGESTIONS = [
  'What skills do I have?',
  'What are my strongest projects?',
  'What tech stack am I proficient in?',
  'How many years of experience do I have?',
]

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chat({ resumeReady }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef               = useRef(null)
  const textareaRef             = useRef(null)

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: msg, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await axios.post(`${API_BASE}/ask`, { message: msg })
      const aiMsg = {
        role: 'ai',
        content: data.response,
        sources: data.sources || [],
        time: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Something went wrong. Please try again.'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  return (
    <div className="chat-wrap">
      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat fade-in">
            <div className="icon">🤖</div>
            <h2>AI Career Copilot</h2>
            <p>
              Upload your resume first, then ask anything about your experience,
              skills, or career goals. Powered by RAG + GPT.
            </p>
            {resumeReady && (
              <div className="suggestion-grid">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {!resumeReady && (
              <p style={{ fontSize: '12px', color: 'var(--warning)', marginTop: 8 }}>
                ⚠️ Please upload your resume in the <strong>Resume</strong> tab first.
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`message-row ${m.role} fade-up`}>
                <div className={`avatar ${m.role}`}>
                  {m.role === 'ai' ? '✦' : '👤'}
                </div>
                <div>
                  <div className={`bubble ${m.role}`}>{m.content}</div>
                  <div className="bubble-time">{formatTime(m.time)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row ai fade-in">
                <div className="avatar ai">✦</div>
                <div>
                  <div className="bubble ai">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="error-banner fade-in">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={resumeReady ? 'Ask anything about your resume…' : 'Upload a resume first to chat…'}
              value={input}
              disabled={!resumeReady || loading}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!resumeReady || loading || !input.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <span className="chat-hint">⏎ Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  )
}
