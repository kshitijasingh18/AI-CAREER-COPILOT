import React, { useState } from 'react'
import axios from 'axios'
import API_BASE from '../api'

const RADIUS = 54
const CIRC   = 2 * Math.PI * RADIUS

export default function Analysis({ resumeReady }) {
  const [jd, setJd]         = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  async function runAnalysis() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await axios.post(`${API_BASE}/analyze`, { job_description: jd })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const score     = result?.match_score ?? 0
  const dashOffset = CIRC - (score / 100) * CIRC

  return (
    <div className="analysis-wrap">
      {!resumeReady && (
        <div className="error-banner">
          ⚠️ Please upload your resume in the <strong>Resume</strong> tab first.
        </div>
      )}

      {/* Job Description Input */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Job Description (optional)</div>
        <div className="section-sub" style={{ marginBottom: 12 }}>
          Paste a job description to get a targeted match score and skill gap analysis
        </div>
        <textarea
          className="input-field"
          placeholder="Paste the job description here…"
          value={jd}
          onChange={e => setJd(e.target.value)}
          rows={5}
          style={{ resize: 'vertical' }}
        />
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            onClick={runAnalysis}
            disabled={loading || !resumeReady}
          >
            {loading ? <><div className="spinner" /> Analyzing…</> : '📊 Run Analysis'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner fade-in">⚠️ {error}</div>}

      {/* Results */}
      {result && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score Ring */}
          <div className="glass-card score-ring-wrap">
            <div className="score-ring">
              <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Track */}
                <circle
                  cx="70" cy="70" r={RADIUS}
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
                />
                {/* Fill */}
                <circle
                  cx="70" cy="70" r={RADIUS}
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="score-text">
                <div className="score-num">{score}%</div>
                <div className="score-label">Match</div>
              </div>
            </div>

            <div style={{ maxWidth: 300 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Overall Match Score</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {result.summary}
              </p>
              <div style={{ marginTop: 12 }}>
                <span className={`tag ${score >= 70 ? 'tag-green' : score >= 40 ? 'tag-blue' : 'tag-red'}`}>
                  {score >= 70 ? '✓ Strong Match' : score >= 40 ? '~ Moderate Match' : '✗ Needs Improvement'}
                </span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="skills-section">
            {/* Strong Skills */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div className="section-title" style={{ marginBottom: 14 }}>✅ Strong Skills</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.strong_skills?.map((s, i) => (
                  <div key={i} className="skill-chip">
                    <span className="tag tag-green">✓</span>
                    <span style={{ fontSize: 13 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div className="section-title" style={{ marginBottom: 14 }}>⚠️ Skill Gaps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.skill_gaps?.map((s, i) => (
                  <div key={i} className="skill-chip">
                    <span className="tag tag-red">✗</span>
                    <span style={{ fontSize: 13 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div className="section-title" style={{ marginBottom: 14 }}>🚀 Recommendations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.recommendations?.map((r, i) => (
                <div key={i} className="rec-item">
                  <div className="rec-num">{i + 1}</div>
                  <span style={{ color: 'var(--text-secondary)' }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
