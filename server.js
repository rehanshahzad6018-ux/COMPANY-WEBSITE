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
const multer  = require('multer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Resume uploads (job applications) ──────────────────────────
const RESUME_DIR = path.join(__dirname, 'uploads', 'resumes');
fs.mkdirSync(RESUME_DIR, { recursive: true });
const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, RESUME_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, 'R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /\.(pdf|docx?|rtf)$/i.test(file.originalname));
  }
});

const LEADS_FILE   = path.join(__dirname, 'leads.json');
const PRICING_FILE = path.join(__dirname, 'pricing.json');

// ── Security headers ───────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  res.removeHeader('X-Powered-By');
  next();
});

// ── Block sensitive files from being served statically ─────────
const BLOCKED_FILES = [
  'leads.json','applications.json','brain-memory.json',
  'pricing.json','jobs.json','.env','store.json','messages.json'
];
app.use((req, res, next) => {
  const base = path.basename(req.path).toLowerCase();
  if (BLOCKED_FILES.includes(base)) return res.status(403).end();
  next();
});

// ── Rate limiter (in-memory) ───────────────────────────────────
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const entry = rateLimitMap.get(key) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    rateLimitMap.set(key, entry);
    if (entry.count > max) return res.status(429).json({ error: 'Too many requests. Please wait.' });
    next();
  };
}
// Clean up old rate limit entries every 5 min
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [k, v] of rateLimitMap) { if (v.start < cutoff) rateLimitMap.delete(k); }
}, 300000);

// ── Input sanitiser ────────────────────────────────────────────
function sanitize(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

// ── Admin token auth (for destructive/write API routes) ────────
const ADMIN_SECRET = process.env.ADMIN_SECRET || '6K68M4Jq6-8wa29QflP0cWpFAFoQuXwe';
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query._token;
  if (token !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorised' });
  next();
}

// ── Mount agents BEFORE json body parser (Twilio uses urlencoded) ──
const voiceAgent     = require('./voice-agent');
const whatsappAgent  = require('./whatsapp-agent');

app.use('/voice',     voiceAgent);
app.use('/whatsapp',  whatsappAgent);

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Static site ────────────────────────────────────────────────
app.use(express.static(__dirname, { extensions: ['html'] }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'Techno.html')));

// ── Leads DB ───────────────────────────────────────────────────
function readLeads()      { try { return JSON.parse(fs.readFileSync(LEADS_FILE,'utf8')); } catch(e) { return []; } }
function writeLeads(list) { fs.writeFileSync(LEADS_FILE, JSON.stringify(list, null, 2)); }

app.get('/api/leads', requireAdmin, (req, res) => res.json(readLeads()));

app.post('/api/leads', rateLimit(60000, 10), (req, res) => {
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

app.delete('/api/leads', requireAdmin, (req, res) => { writeLeads([]); res.json({ ok: true }); });

// ── Pricing ────────────────────────────────────────────────────
app.get('/api/pricing', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(PRICING_FILE, 'utf8'))); }
  catch (e) { res.status(500).json({ error: 'Could not read pricing data' }); }
});

app.put('/api/pricing', requireAdmin, (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected array' });
  fs.writeFileSync(PRICING_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// ── AI Brain status ────────────────────────────────────────────
app.get('/api/brain/status', requireAdmin, (req, res) => {
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

app.delete('/api/brain/memory', requireAdmin, (req, res) => {
  const MEMORY_FILE = path.join(__dirname, 'brain-memory.json');
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2));
  res.json({ ok: true });
});

// ── Email AI (Gemini / OpenAI proxy) ──────────────────────────
app.post('/api/chat', rateLimit(60000, 20), async (req, res) => {
  const brain = require('./ai-brain');
  const messages = (req.body && req.body.messages) || [];
  const userId   = sanitize(req.body.userId || 'email:anonymous', 64);

  const userMsg = sanitize(messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '', 1000);
  if (!userMsg) return res.status(400).json({ error: 'no message' });

  try {
    const result = await brain.think({ userId, userMessage: userMsg, channel: 'email', maxTokens: 400 });
    res.json({ reply: result.reply });
  } catch (e) {
    console.error('[chat]', e.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Website Chat Widget ────────────────────────────────────────
app.post('/api/website-chat', rateLimit(60000, 30), async (req, res) => {
  const brain   = require('./ai-brain');
  const { message, sessionId } = req.body || {};
  const cleanMsg = sanitize(message || '', 1000);
  if (!cleanMsg) return res.status(400).json({ error: 'message required' });

  const userId = 'web:' + sanitize(sessionId || 'anon', 64);

  try {
    const result = await brain.think({
      userId,
      userMessage: cleanMsg,
      channel: 'email',
      maxTokens: 350
    });
    res.json({ reply: result.reply });
  } catch (e) {
    console.error('[website-chat]', e.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Messages (contact form + chat emails) ─────────────────────
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
function readMessages()      { try { return JSON.parse(fs.readFileSync(MESSAGES_FILE,'utf8')); } catch(e) { return []; } }
function writeMessages(list) { fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2)); }

app.get('/api/messages', requireAdmin, (req, res) => res.json(readMessages()));

app.post('/api/messages', rateLimit(60000, 10), (req, res) => {
  const { name, email, budget, message, source } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  const entry = {
    id: 'M' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
    name:    sanitize(name, 100),
    email:   sanitize(email, 200),
    budget:  sanitize(budget || '', 100),
    message: sanitize(message, 3000),
    source:  sanitize(source || 'contact', 50),
    sentAt:  new Date().toISOString(),
    read:    false,
    replies: []
  };
  const list = readMessages(); list.unshift(entry); writeMessages(list);
  console.log(`[message] ${entry.name} <${entry.email}>`);
  res.json({ ok: true, id: entry.id });
});

app.post('/api/messages/:id/reply', requireAdmin, (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  const list = readMessages();
  const msg = list.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'not found' });
  if (!msg.replies) msg.replies = [];
  msg.replies.push({ text: sanitize(text, 5000), sentAt: new Date().toISOString() });
  writeMessages(list);
  res.json({ ok: true });
});

app.patch('/api/messages/:id/read', requireAdmin, (req, res) => {
  const list = readMessages().map(m => m.id === req.params.id ? { ...m, read: true } : m);
  writeMessages(list);
  res.json({ ok: true });
});

app.delete('/api/messages/:id', requireAdmin, (req, res) => {
  const list = readMessages().filter(m => m.id !== req.params.id);
  writeMessages(list);
  res.json({ ok: true });
});

// ── Jobs & Applications ────────────────────────────────────────
const JOBS_FILE = path.join(__dirname, 'jobs.json');
const APPS_FILE = path.join(__dirname, 'applications.json');

function readJobs()      { try { return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')); } catch(e) { return []; } }
function writeJobs(list) { fs.writeFileSync(JOBS_FILE, JSON.stringify(list, null, 2)); }
function readApps()      { try { return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8')); } catch(e) { return []; } }
function writeApps(list) { fs.writeFileSync(APPS_FILE, JSON.stringify(list, null, 2)); }

app.get('/api/jobs', (req, res) => res.json(readJobs()));

app.post('/api/jobs', requireAdmin, (req, res) => {
  const { title, department, type, location, description, requirements } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const job = {
    id: 'J' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    title:        sanitize(title, 200),
    department:   sanitize(department || 'General', 100),
    type:         sanitize(type || 'full-time', 50),
    location:     sanitize(location || 'Remote', 100),
    description:  sanitize(description || '', 5000),
    requirements: sanitize(requirements || '', 5000),
    createdAt: new Date().toISOString()
  };
  const list = readJobs(); list.unshift(job); writeJobs(list);
  console.log(`[jobs] added: ${job.title}`);
  res.json(job);
});

app.delete('/api/jobs/:id', requireAdmin, (req, res) => {
  const list = readJobs().filter(j => j.id !== req.params.id);
  writeJobs(list);
  res.json({ ok: true });
});

app.get('/api/applications', requireAdmin, (req, res) => res.json(readApps()));

app.post('/api/applications', rateLimit(60000, 5), (req, res) => {
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Resume must be a PDF or Word document under 5MB' });

    const { name, email, phone, position, message, portfolio } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });

    const entry = {
      id: 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name:      sanitize(name, 100),
      email:     sanitize(email, 200),
      phone:     sanitize(phone || '', 30),
      position:  sanitize(position || 'General Application', 200),
      message:   sanitize(message || '', 3000),
      portfolio: sanitize(portfolio || '', 300),
      resume:    req.file ? { filename: req.file.filename, originalName: sanitize(req.file.originalname, 200) } : null,
      appliedAt: new Date().toISOString(),
      read: false
    };
    const list = readApps(); list.unshift(entry); writeApps(list);
    console.log(`[application] ${entry.name} <${entry.email}> applied for: ${entry.position}${entry.resume ? ' (resume attached)' : ''}`);
    res.json({ ok: true, id: entry.id });
  });
});

app.get('/api/applications/:id/resume', requireAdmin, (req, res) => {
  const entry = readApps().find(a => a.id === req.params.id);
  if (!entry || !entry.resume) return res.status(404).json({ error: 'No resume on file' });
  const filePath = path.join(RESUME_DIR, entry.resume.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath, entry.resume.originalName || entry.resume.filename);
});

app.delete('/api/applications/:id', requireAdmin, (req, res) => {
  const list = readApps();
  const entry = list.find(a => a.id === req.params.id);
  if (entry?.resume?.filename) {
    try { fs.unlinkSync(path.join(RESUME_DIR, entry.resume.filename)); } catch (_) {}
  }
  writeApps(list.filter(a => a.id !== req.params.id));
  res.json({ ok: true });
});

app.patch('/api/applications/:id/read', requireAdmin, (req, res) => {
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
  console.log(` ║  CGW AI Platform  →  http://localhost:${PORT}  ║`);
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
