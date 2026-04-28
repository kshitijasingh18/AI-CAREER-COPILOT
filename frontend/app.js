// 🔧 Change this to your Render URL after deployment
const API_BASE = 'http://localhost:8000';

let resumeReady = false;

const VIEW_META = {
  chat:      { title: 'AI Career Copilot',   sub: 'Context-aware chat powered by RAG + GPT' },
  upload:    { title: 'Resume Upload',        sub: 'Upload your PDF resume to get started' },
  analysis:  { title: 'Skill Gap Analysis',  sub: 'Compare your resume against a job description' },
  interview: { title: 'Interview Simulator', sub: 'AI-generated questions tailored to your resume' },
};

// ── Navigation ────────────────────────────────────────────────────────────────
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  document.getElementById('view-title').textContent = VIEW_META[view].title;
  document.getElementById('view-sub').textContent   = VIEW_META[view].sub;
  // Show resume warnings on gated views
  ['analysis','interview'].forEach(v => {
    const el = document.getElementById(v + '-no-resume');
    if (el) el.style.display = (!resumeReady && view === v) ? 'flex' : 'none';
  });
}

function setResumeReady() {
  resumeReady = true;
  const dot  = document.querySelector('.status-dot');
  const text = document.getElementById('status-text');
  dot.classList.add('ready');
  text.textContent = 'Resume loaded ✓';
  // Enable chat
  const input = document.getElementById('chat-input');
  const btn   = document.getElementById('send-btn');
  input.disabled = false;
  input.placeholder = 'Ask anything about your resume…';
  btn.disabled = false;
  // Show suggestions
  document.getElementById('suggestion-grid').style.display = 'grid';
  document.getElementById('no-resume-hint').style.display  = 'none';
}

// ── Chat ──────────────────────────────────────────────────────────────────────
let chatLoading = false;

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function sendSuggestion(btn) { sendMessage(btn.textContent); }

async function sendMessage(text) {
  const input = document.getElementById('chat-input');
  const msg   = text || input.value.trim();
  if (!msg || chatLoading || !resumeReady) return;
  input.value = ''; input.style.height = 'auto';

  // Hide empty state
  const emptyChat = document.getElementById('empty-chat');
  if (emptyChat) emptyChat.style.display = 'none';

  appendBubble('user', msg);
  const typingId = appendTyping();
  chatLoading = true;
  document.getElementById('send-btn').disabled = true;

  try {
    const res  = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    removeTyping(typingId);
    if (!res.ok) {
      const err = await res.json();
      appendBubble('ai', '⚠️ ' + (err.detail || 'Something went wrong.'));
    } else {
      const data = await res.json();
      appendBubble('ai', data.response);
    }
  } catch (e) {
    removeTyping(typingId);
    appendBubble('ai', '⚠️ Cannot reach the backend. Make sure it is running on port 8000.');
  } finally {
    chatLoading = false;
    document.getElementById('send-btn').disabled = false;
  }
}

function appendBubble(role, text) {
  const container = document.getElementById('chat-messages');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const row  = document.createElement('div');
  row.className = `message-row ${role}`;
  row.innerHTML = `
    <div class="avatar ${role}">${role === 'ai' ? '✦' : '👤'}</div>
    <div>
      <div class="bubble ${role}">${escapeHtml(text)}</div>
      <div class="bubble-time">${time}</div>
    </div>`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function appendTyping() {
  const container = document.getElementById('chat-messages');
  const id = 'typing-' + Date.now();
  const row = document.createElement('div');
  row.className = 'message-row ai'; row.id = id;
  row.innerHTML = `
    <div class="avatar ai">✦</div>
    <div><div class="bubble ai"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

// ── Upload ────────────────────────────────────────────────────────────────────
function onDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('dragging');
  document.getElementById('drop-icon').textContent = '📂';
}
function onDragLeave() {
  document.getElementById('dropzone').classList.remove('dragging');
  document.getElementById('drop-icon').textContent = '📄';
}
function onDrop(e) {
  e.preventDefault(); onDragLeave();
  const file = e.dataTransfer.files[0];
  if (file) uploadFile(file);
}
function handleFileSelect(e) { if (e.target.files[0]) uploadFile(e.target.files[0]); }

async function uploadFile(file) {
  if (!file.name.endsWith('.pdf')) {
    showUploadError('Only PDF files are supported.');
    return;
  }
  showUploadError('');
  document.getElementById('upload-success').style.display = 'none';
  document.getElementById('upload-progress').style.display = 'block';

  let pct = 0;
  const interval = setInterval(() => {
    pct = Math.min(pct + 7, 85);
    setProgress(pct);
  }, 150);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res  = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    clearInterval(interval); setProgress(100);
    if (!res.ok) {
      const err = await res.json();
      showUploadError(err.detail || 'Upload failed.');
    } else {
      const data = await res.json();
      document.getElementById('upload-progress').style.display = 'none';
      document.getElementById('upload-filename').textContent = file.name + ' — FAISS vector store built';
      document.getElementById('stat-chunks').textContent = data.chunks;
      document.getElementById('stat-words').textContent  = (data.word_count || 0).toLocaleString();
      document.getElementById('upload-success').style.display = 'block';
      setResumeReady();
    }
  } catch (e) {
    clearInterval(interval);
    document.getElementById('upload-progress').style.display = 'none';
    showUploadError('⚠️ Upload failed. Make sure the backend is running on port 8000.');
  }
}

function setProgress(pct) {
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent  = pct + '%';
}
function showUploadError(msg) {
  const el = document.getElementById('upload-error');
  el.textContent = msg; el.style.display = msg ? 'flex' : 'none';
}

// ── Analysis ──────────────────────────────────────────────────────────────────
async function runAnalysis() {
  if (!resumeReady) return;
  const jd  = document.getElementById('jd-input').value;
  const btn = document.getElementById('analyze-btn');
  const err = document.getElementById('analysis-error');
  const res = document.getElementById('analysis-results');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analyzing…';
  err.style.display = 'none'; res.style.display = 'none';

  try {
    const r    = await fetch(`${API_BASE}/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: jd })
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail); }
    const data = await r.json();
    res.innerHTML = buildAnalysisHTML(data);
    res.style.display = 'flex';
    res.style.flexDirection = 'column';
    res.style.gap = '20px';
  } catch (e) {
    err.textContent = '⚠️ ' + (e.message || 'Analysis failed.'); err.style.display = 'flex';
  } finally {
    btn.disabled = false; btn.innerHTML = '📊 Run Analysis';
  }
}

function buildAnalysisHTML(d) {
  const score  = d.match_score || 0;
  const circ   = 2 * Math.PI * 54;
  const offset = circ - (score / 100) * circ;
  const cls    = score >= 70 ? 'tag-green' : score >= 40 ? 'tag-blue' : 'tag-red';
  const label  = score >= 70 ? '✓ Strong Match' : score >= 40 ? '~ Moderate Match' : '✗ Needs Work';

  const strongSkills = (d.strong_skills || []).map(s =>
    `<div class="skill-chip"><span class="tag tag-green">✓</span><span>${s}</span></div>`).join('');
  const gaps = (d.skill_gaps || []).map(s =>
    `<div class="skill-chip"><span class="tag tag-red">✗</span><span>${s}</span></div>`).join('');
  const recs = (d.recommendations || []).map((r, i) =>
    `<div class="rec-item"><div class="rec-num">${i+1}</div><span style="color:var(--text-secondary)">${r}</span></div>`).join('');

  return `
    <div class="glass-card score-ring-wrap">
      <div class="score-ring">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
          <circle cx="70" cy="70" r="54" fill="none" stroke="url(#sg)" stroke-width="10"
            stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset 1s ease"/>
          <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#0ea5e9"/>
          </linearGradient></defs>
        </svg>
        <div class="score-text"><div class="score-num">${score}%</div><div class="score-label">Match</div></div>
      </div>
      <div style="max-width:280px">
        <div class="section-title" style="margin-bottom:8px">Match Score</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.7">${d.summary || ''}</p>
        <div style="margin-top:12px"><span class="tag ${cls}">${label}</span></div>
      </div>
    </div>
    <div class="skills-section">
      <div class="glass-card" style="padding:20px 24px">
        <div class="section-title" style="margin-bottom:14px">✅ Strong Skills</div>
        <div style="display:flex;flex-direction:column;gap:8px">${strongSkills}</div>
      </div>
      <div class="glass-card" style="padding:20px 24px">
        <div class="section-title" style="margin-bottom:14px">⚠️ Skill Gaps</div>
        <div style="display:flex;flex-direction:column;gap:8px">${gaps}</div>
      </div>
    </div>
    <div class="glass-card" style="padding:20px 24px">
      <div class="section-title" style="margin-bottom:14px">🚀 Recommendations</div>
      <div style="display:flex;flex-direction:column;gap:10px">${recs}</div>
    </div>`;
}

// ── Interview ─────────────────────────────────────────────────────────────────
async function generateInterview() {
  if (!resumeReady) return;
  const topic = document.getElementById('topic-select').value;
  const numQ  = document.getElementById('num-select').value;
  const btn   = document.getElementById('interview-btn');
  const err   = document.getElementById('interview-error');
  const res   = document.getElementById('interview-results');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating…';
  err.style.display = 'none'; res.innerHTML = '';

  try {
    const r    = await fetch(`${API_BASE}/interview`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, num_questions: parseInt(numQ) })
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail); }
    const data = await r.json();
    res.innerHTML = (data.questions || []).map((q, i) => buildQuestionCard(q, i)).join('');
    res.innerHTML += `<div class="glass-card" style="padding:14px 20px;margin-top:4px">
      <p style="font-size:13px;color:var(--text-muted)">💡 <strong>Pro tip:</strong> Practice with STAR format — Situation, Task, Action, Result.</p></div>`;
  } catch (e) {
    err.textContent = '⚠️ ' + (e.message || 'Generation failed.'); err.style.display = 'flex';
  } finally {
    btn.disabled = false; btn.innerHTML = '🎯 Generate Questions';
  }
}

function buildQuestionCard(q, i) {
  const typeCls = q.type === 'behavioral' ? 'tag-green' : q.type === 'situational' ? 'tag-purple' : 'tag-blue';
  return `
    <div class="question-card" style="animation-delay:${i*0.07}s">
      <div class="question-header">
        <div class="q-num">${i+1}</div>
        <div>
          <div class="q-text">${escapeHtml(q.question)}</div>
          <span class="tag ${typeCls}" style="margin-top:8px;display:inline-flex">${q.type || 'general'}</span>
        </div>
      </div>
      <div class="answer-reveal">
        <button class="answer-toggle" onclick="toggleAnswer(this)">▼ Show Answer Guide</button>
        <div class="answer-content" style="display:none">💡 ${escapeHtml(q.ideal_answer || '')}</div>
      </div>
    </div>`;
}

function toggleAnswer(btn) {
  const content = btn.nextElementSibling;
  const open = content.style.display === 'none';
  content.style.display = open ? 'block' : 'none';
  btn.textContent = open ? '▲ Hide Answer Guide' : '▼ Show Answer Guide';
}
