import React, { useState } from 'react'
import axios from 'axios'
import API_BASE from '../api'

const TOPICS = [
  { value: 'technical',  label: '⚙️ Technical' },
  { value: 'behavioral', label: '🤝 Behavioral' },
  { value: 'system design', label: '🏗️ System Design' },
  { value: 'AI/ML',     label: '🧠 AI / ML' },
  { value: 'general',   label: '💼 General HR' },
]

export default function Interview({ resumeReady }) {
  const [topic, setTopic]         = useState('technical')
  const [numQ, setNumQ]           = useState(5)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [revealed, setRevealed]   = useState({})

  async function generate() {
    setLoading(true)
    setError('')
    setResult(null)
    setRevealed({})
    try {
      const { data } = await axios.post(`${API_BASE}/interview`, {
        topic,
        num_questions: numQ,
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  function toggleReveal(i) {
    setRevealed(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="interview-wrap">
      {!resumeReady && (
        <div className="error-banner">
          ⚠️ Please upload your resume in the <strong>Resume</strong> tab first.
        </div>
      )}

      {/* Controls */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div className="section-title" style={{ marginBottom: 4 }}>Interview Simulator</div>
        <div className="section-sub" style={{ marginBottom: 16 }}>
          Generate tailored interview questions based on your resume
        </div>
        <div className="interview-controls">
          <select
            className="select-field"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          >
            {TOPICS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            className="select-field"
            value={numQ}
            onChange={e => setNumQ(Number(e.target.value))}
          >
            {[3, 5, 7, 10].map(n => (
              <option key={n} value={n}>{n} Questions</option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={generate}
            disabled={loading || !resumeReady}
            style={{ marginLeft: 'auto' }}
          >
            {loading
              ? <><div className="spinner" /> Generating…</>
              : '🎯 Generate Questions'
            }
          </button>
        </div>
      </div>

      {error && <div className="error-banner fade-in">⚠️ {error}</div>}

      {/* Questions */}
      {result?.questions?.map((q, i) => (
        <div key={i} className="question-card fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="question-header">
            <div className="q-num">{i + 1}</div>
            <div>
              <div className="q-text">{q.question}</div>
              <span className={`tag ${
                q.type === 'technical'   ? 'tag-blue'   :
                q.type === 'behavioral'  ? 'tag-green'  :
                q.type === 'situational' ? 'tag-purple' : 'tag-blue'
              }`} style={{ marginTop: 8, display: 'inline-flex' }}>
                {q.type}
              </span>
            </div>
          </div>

          <div className="answer-reveal">
            <button className="answer-toggle" onClick={() => toggleReveal(i)}>
              {revealed[i] ? '▲ Hide Answer Guide' : '▼ Show Answer Guide'}
            </button>
            {revealed[i] && (
              <div className="answer-content fade-in">
                💡 {q.ideal_answer}
              </div>
            )}
          </div>
        </div>
      ))}

      {result && (
        <div className="glass-card fade-up" style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            💡 <strong>Pro tip:</strong> Practice answering each question out loud for 2 minutes.
            Focus on STAR format (Situation, Task, Action, Result) for behavioral questions.
          </p>
        </div>
      )}
    </div>
  )
}
