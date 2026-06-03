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
