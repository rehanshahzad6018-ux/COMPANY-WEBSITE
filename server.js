/* ============================================================
   CGW — Backend Server
   Run:  npm install && npm start
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

// ── CORS — allow localhost origins (dev) ───────────────────────
const ALLOWED_ORIGINS = [
  `http://localhost:${process.env.PORT || 3000}`,
  `http://127.0.0.1:${process.env.PORT || 3000}`,
];
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Security headers ───────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    // 'unsafe-eval' is required by the Spline 3D viewer runtime (hero robot).
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://prod.spline.design https://*.spline.design; " +
    "media-src 'self' data: blob: https://prod.spline.design https://*.spline.design; " +
    "connect-src 'self' http://localhost:* http://127.0.0.1:* https://prod.spline.design https://*.spline.design https://unpkg.com; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'none';"
  );
  res.removeHeader('X-Powered-By');
  next();
});

// ── Block sensitive files from being served statically ─────────
const BLOCKED_FILES = [
  'leads.json','applications.json','brain-memory.json',
  'pricing.json','jobs.json','.env','.env.example','store.json','messages.json',
  // logs & server-side source must never be downloadable
  'server.log','server.js','ai-brain.js','package.json','package-lock.json','calls.json'
];
app.use((req, res, next) => {
  const reqPath = decodeURIComponent(req.path).toLowerCase();
  const base = path.basename(reqPath);
  // uploaded resumes are only accessible through the admin-authed download route
  if (reqPath.startsWith('/uploads')) return res.status(403).end();
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
const crypto = require('crypto');
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET || ADMIN_SECRET.length < 16) {
  console.error('\n  ✖ FATAL: ADMIN_SECRET is not set (or too short).');
  console.error('    Add a strong ADMIN_SECRET to your .env file, e.g.:');
  console.error('      ADMIN_SECRET=' + crypto.randomBytes(24).toString('base64url') + '\n');
  process.exit(1);
}
// Constant-time comparison to avoid timing attacks
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query._token || '';
  if (!safeEqual(token, ADMIN_SECRET)) return res.status(401).json({ error: 'Unauthorised' });
  next();
}

// ── Admin login (verifies username + password server-side; secret never shipped to browser) ──
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
app.post('/api/admin/login', rateLimit(60000, 8), express.json({ limit: '4kb' }), (req, res) => {
  const username = (req.body && req.body.username) || '';
  const password = (req.body && req.body.password) || '';
  if (!safeEqual(username, ADMIN_USER) || !safeEqual(password, ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  res.json({ ok: true });
});

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Static site ────────────────────────────────────────────────
const STATIC_DIR = path.join(__dirname, '..', 'public_html');
app.use(express.static(STATIC_DIR, { extensions: ['html'] }));
app.get('/', (req, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));

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
      web: users.filter(u => u.startsWith('web:')).length,
    },
    geminiConfigured:  !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_free_gemini_key_here'),
    model:             'gemini-1.5-flash',
  });
});

app.delete('/api/brain/memory', requireAdmin, (req, res) => {
  const MEMORY_FILE = path.join(__dirname, 'brain-memory.json');
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2));
  res.json({ ok: true });
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
      channel: 'web',
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
  const geminiReady  = !!(process.env.GEMINI_API_KEY  && process.env.GEMINI_API_KEY  !== 'your_free_gemini_key_here');

  console.log('\n ╔══════════════════════════════════════════════╗');
  console.log(` ║  CGW AI Platform  →  http://localhost:${PORT}  ║`);
  console.log(' ╠══════════════════════════════════════════════╣');
  console.log(` ║  ARIA Brain     →  /api/brain/status`);
  console.log(` ║  AI Model       →  ${geminiReady ? 'Gemini ready' : 'No AI key configured'}`);
  console.log(' ╠══════════════════════════════════════════════╣');
  console.log(` ║  Website Chat   →  /api/website-chat`);
  console.log(' ╚══════════════════════════════════════════════╝\n');

  if (!geminiReady) {
    console.log('  No AI key found. Add GEMINI_API_KEY to .env\n');
  }
});
