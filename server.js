/* ============================================================
   TECHNO — Backend Server
   ============================================================
   Phase 1: WhatsApp AI Agent  → /whatsapp
   Phase 2: Email AI Agent     → /api/chat (Gemini fallback)
   Phase 3: Voice Call Agent   → /voice
   Central AI Brain            → ai-brain.js (shared)

   Run:  npm install && npm start
   Expose locally: npx ngrok http 3000
   ============================================================ */
const express = require('express');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

const LEADS_FILE   = path.join(__dirname, 'leads.json');
const PRICING_FILE = path.join(__dirname, 'pricing.json');

// ── Mount agents BEFORE json body parser (Twilio uses urlencoded) ──
const voiceAgent     = require('./voice-agent');
const whatsappAgent  = require('./whatsapp-agent');

app.use('/voice',     voiceAgent);
app.use('/whatsapp',  whatsappAgent);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static site ────────────────────────────────────────────────
app.use(express.static(__dirname, { extensions: ['html'] }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'Techno.html')));

// ── Leads DB ───────────────────────────────────────────────────
function readLeads()      { try { return JSON.parse(fs.readFileSync(LEADS_FILE,'utf8')); } catch(e) { return []; } }
function writeLeads(list) { fs.writeFileSync(LEADS_FILE, JSON.stringify(list, null, 2)); }

app.get('/api/leads', (req, res) => res.json(readLeads()));

app.post('/api/leads', (req, res) => {
  const { type, data } = req.body || {};
  if (!type) return res.status(400).json({ error: 'type required' });
  const lead = {
    id: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    type, data: data || {}, createdAt: new Date().toISOString()
  };
  const list = readLeads(); list.unshift(lead); writeLeads(list);
  console.log(`[lead] ${type} saved — ${list.length} total`);
  res.json(lead);
});

app.delete('/api/leads', (req, res) => { writeLeads([]); res.json({ ok: true }); });

// ── Pricing ────────────────────────────────────────────────────
app.get('/api/pricing', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(PRICING_FILE, 'utf8'))); }
  catch (e) { res.status(500).json({ error: 'Could not read pricing data' }); }
});

app.put('/api/pricing', (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected array' });
  fs.writeFileSync(PRICING_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// ── AI Brain status ────────────────────────────────────────────
app.get('/api/brain/status', (req, res) => {
  const brain = require('./ai-brain');
  const memory = brain.readMemory();
  const users  = Object.keys(memory);
  res.json({
    totalSessions:    users.length,
    channels: {
      whatsapp: users.filter(u => u.startsWith('wa:')).length,
      voice:    users.filter(u => u.startsWith('call:')).length,
      email:    users.filter(u => u.startsWith('email:')).length,
    },
    openaiConfigured:  !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here'),
    geminiConfigured:  !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_free_gemini_key_here'),
    model:             process.env.OPENAI_MODEL || 'gpt-4o-mini',
  });
});

app.delete('/api/brain/memory', (req, res) => {
  const MEMORY_FILE = path.join(__dirname, 'brain-memory.json');
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2));
  res.json({ ok: true });
});

// ── Email AI (Gemini / OpenAI proxy) ──────────────────────────
app.post('/api/chat', async (req, res) => {
  const brain = require('./ai-brain');
  const messages = (req.body && req.body.messages) || [];
  const userId   = req.body.userId || 'email:anonymous';

  const userMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  if (!userMsg) return res.status(400).json({ error: 'no message' });

  try {
    const result = await brain.think({ userId, userMessage: userMsg, channel: 'email', maxTokens: 400 });
    res.json({ reply: result.reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ── Website Chat Widget ────────────────────────────────────────
app.post('/api/website-chat', async (req, res) => {
  const brain   = require('./ai-brain');
  const { message, sessionId, history } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const userId = 'web:' + (sessionId || 'anon');

  try {
    const result = await brain.think({
      userId,
      userMessage: message,
      channel: 'email',
      maxTokens: 350
    });
    res.json({ reply: result.reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ── Jobs & Applications ────────────────────────────────────────
const JOBS_FILE = path.join(__dirname, 'jobs.json');
const APPS_FILE = path.join(__dirname, 'applications.json');

function readJobs()      { try { return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')); } catch(e) { return []; } }
function writeJobs(list) { fs.writeFileSync(JOBS_FILE, JSON.stringify(list, null, 2)); }
function readApps()      { try { return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8')); } catch(e) { return []; } }
function writeApps(list) { fs.writeFileSync(APPS_FILE, JSON.stringify(list, null, 2)); }

app.get('/api/jobs', (req, res) => res.json(readJobs()));

app.post('/api/jobs', (req, res) => {
  const { title, department, type, location, description, requirements } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const job = {
    id: 'J' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    title,
    department: department || 'General',
    type: type || 'full-time',
    location: location || 'Remote',
    description: description || '',
    requirements: requirements || '',
    createdAt: new Date().toISOString()
  };
  const list = readJobs(); list.unshift(job); writeJobs(list);
  console.log(`[jobs] added: ${title}`);
  res.json(job);
});

app.delete('/api/jobs/:id', (req, res) => {
  const list = readJobs().filter(j => j.id !== req.params.id);
  writeJobs(list);
  res.json({ ok: true });
});

app.get('/api/applications', (req, res) => res.json(readApps()));

app.post('/api/applications', (req, res) => {
  const { name, email, phone, position, message, portfolio } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const entry = {
    id: 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name, email,
    phone: phone || '',
    position: position || 'General Application',
    message: message || '',
    portfolio: portfolio || '',
    appliedAt: new Date().toISOString(),
    read: false
  };
  const list = readApps(); list.unshift(entry); writeApps(list);
  console.log(`[application] ${name} <${email}> applied for: ${entry.position}`);
  res.json(entry);
});

app.delete('/api/applications/:id', (req, res) => {
  const list = readApps().filter(a => a.id !== req.params.id);
  writeApps(list);
  res.json({ ok: true });
});

app.patch('/api/applications/:id/read', (req, res) => {
  const list = readApps().map(a => a.id === req.params.id ? { ...a, read: true } : a);
  writeApps(list);
  res.json({ ok: true });
});

// ── Startup log ────────────────────────────────────────────────
app.listen(PORT, () => {
  const openaiReady  = !!(process.env.OPENAI_API_KEY  && process.env.OPENAI_API_KEY  !== 'your_openai_key_here');
  const geminiReady  = !!(process.env.GEMINI_API_KEY  && process.env.GEMINI_API_KEY  !== 'your_free_gemini_key_here');
  const twilioReady  = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  console.log('\n ╔══════════════════════════════════════════════╗');
  console.log(` ║  TECHNO AI Platform  →  http://localhost:${PORT}  ║`);
  console.log(' ╠══════════════════════════════════════════════╣');
  console.log(` ║  Central Brain  →  /api/brain/status`);
  console.log(` ║  AI Model       →  ${openaiReady ? 'OpenAI ' + (process.env.OPENAI_MODEL||'gpt-4o-mini') + ' ✓' : geminiReady ? 'Gemini ✓ (fallback)' : '⚠ No AI key configured'}`);
  console.log(' ╠══════════════════════════════════════════════╣');
  console.log(` ║  📱 WhatsApp    →  /whatsapp/incoming  ${twilioReady ? '✓' : '⚠ needs Twilio'}`);
  console.log(` ║  ✉️  Email       →  /api/chat`);
  console.log(` ║  📞 Voice       →  /voice/incoming     ${twilioReady ? '✓' : '⚠ needs Twilio'}`);
  console.log(' ╠══════════════════════════════════════════════╣');
  console.log(' ╚══════════════════════════════════════════════╝\n');

  if (!openaiReady && !geminiReady) {
    console.log('  ⚠  No AI key found. Add OPENAI_API_KEY or GEMINI_API_KEY to .env\n');
  }
});
