/* ============================================================
   TECHNO — Phase 1: WhatsApp AI Agent
   ============================================================
   Handles Twilio WhatsApp webhooks.
   Uses Central AI Brain (ai-brain.js) for all responses.

   Mounted in server.js: app.use('/whatsapp', whatsappRouter)

   Twilio WhatsApp Sandbox / Production webhook:
     POST https://your-domain.com/whatsapp/incoming
   ============================================================ */
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const brain   = require('./ai-brain');

const LOGS_FILE = path.join(__dirname, 'whatsapp-logs.json');

// ── Helpers ────────────────────────────────────────────────────
function readLogs()       { try { return JSON.parse(fs.readFileSync(LOGS_FILE,'utf8')); } catch(e) { return []; } }
function writeLogs(list)  { fs.writeFileSync(LOGS_FILE, JSON.stringify(list, null, 2)); }

function saveLog(entry) {
  const list = readLogs();
  const idx  = list.findIndex(c => c.from === entry.from);
  if (idx >= 0) {
    list[idx].messages.push(...entry.messages);
    list[idx].lastSeen  = entry.lastSeen;
    list[idx].sentiment = entry.sentiment;
    list[idx].leadScore = entry.leadScore;
  } else {
    list.unshift(entry);
  }
  if (list.length > 300) list.length = 300;
  writeLogs(list);
}

// ── TwiML response builder ─────────────────────────────────────
function twimlReply(text) {
  // Escape XML special characters
  const safe = String(text)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

// ── Parse Twilio body ──────────────────────────────────────────
router.use(express.urlencoded({ extended: false }));

// ── POST /whatsapp/incoming ── Main webhook ────────────────────
router.post('/incoming', async (req, res) => {
  const from      = req.body.From    || '';   // whatsapp:+14155551234
  const body      = req.body.Body    || '';
  const mediaUrl  = req.body.MediaUrl0 || null;
  const mediaType = req.body.MediaContentType0 || '';
  const profileName = req.body.ProfileName || '';

  // Sanitise phone: strip "whatsapp:" prefix
  const phone = from.replace('whatsapp:', '').trim();
  if (!phone) return res.type('text/xml').send(twimlReply('Sorry, could not identify your number.'));

  console.log(`[whatsapp] ${phone} (${profileName}): "${body}" ${mediaUrl ? '[media]' : ''}`);

  // Update profile name if we have it
  const session = brain.getSession('wa:' + phone);
  if (profileName && !session.profile.name) {
    session.profile.name = profileName;
    brain.saveSession(session);
  }

  // Handle empty body (sticker / reaction / unsupported)
  const text = body.trim();
  if (!text && !mediaUrl) {
    return res.type('text/xml').send(twimlReply(
      "Hi! I received your message but couldn't read it. Please send text and I'll be happy to help."
    ));
  }

  // Handle media (image, audio etc.)
  if (mediaUrl && !text) {
    const reply = mediaType.startsWith('audio')
      ? "I received your voice note! I'm not able to process audio yet, but please type your message and I'll reply right away."
      : "Thanks for the image! To discuss a project, please describe what you're looking for in text.";
    return res.type('text/xml').send(twimlReply(reply));
  }

  // Check for human handoff request
  if (/human|agent|real person|speak to someone|live agent|person please/i.test(text)) {
    const transferNote = `I'll connect you with a member of our team right away. Please email us at *studio@techno.dev* and someone will respond within a few hours. You can also call us directly if it's urgent.`;
    return res.type('text/xml').send(twimlReply(transferNote));
  }

  // Check for opt-out
  if (/stop|unsubscribe|quit|cancel/i.test(text)) {
    brain.clearSession('wa:' + phone);
    return res.type('text/xml').send(twimlReply(
      "You've been unsubscribed. Email studio@techno.dev anytime if you'd like to reconnect. Take care!"
    ));
  }

  try {
    const result = await brain.think({
      userId:      'wa:' + phone,
      userMessage: text,
      channel:     'whatsapp',
      maxTokens:   160,  // Keep replies short for WhatsApp
    });

    // Save to WhatsApp-specific log
    saveLog({
      from:      phone,
      name:      profileName || session.profile.name || phone,
      lastSeen:  new Date().toISOString(),
      sentiment: result.sentiment,
      leadScore: result.leadScore,
      messages: [
        { role: 'user',      content: text,           time: new Date().toISOString() },
        { role: 'assistant', content: result.reply,   time: new Date().toISOString() },
      ],
    });

    return res.type('text/xml').send(twimlReply(result.reply));

  } catch (err) {
    console.error('[whatsapp] Error:', err.message);
    return res.type('text/xml').send(twimlReply(
      "Sorry, I'm having a brief technical issue. Please email studio@techno.dev and we'll get back to you promptly!"
    ));
  }
});

// ── POST /whatsapp/status ── Message delivery status ──────────
router.post('/status', (req, res) => {
  const sid    = req.body.MessageSid || '';
  const status = req.body.MessageStatus || '';
  console.log(`[whatsapp] Status ${sid}: ${status}`);
  res.sendStatus(200);
});

// ── GET /whatsapp/logs ── Admin panel data ─────────────────────
router.get('/logs', (req, res) => {
  res.json(readLogs().slice(0, 100));
});

// ── GET /whatsapp/conversations/:phone ── Full thread ──────────
router.get('/conversations/:phone', (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const session = brain.getSession('wa:' + phone);
  res.json({ session, logs: readLogs().find(l => l.from === phone) || null });
});

// ── DELETE /whatsapp/logs ── Clear all ─────────────────────────
router.delete('/logs', (req, res) => {
  writeLogs([]);
  res.json({ ok: true });
});

// ── GET /whatsapp/health ── Status check ──────────────────────
router.get('/health', (req, res) => {
  const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const openaiConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here');
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_free_gemini_key_here');
  res.json({
    status:            'online',
    twilioConfigured,
    openaiConfigured,
    geminiConfigured,
    aiReady:           openaiConfigured || geminiConfigured,
    totalConversations: readLogs().length,
  });
});

// ── POST /whatsapp/test ── Send a test message (simulate) ──────
router.post('/test', async (req, res) => {
  const { message = 'Hello, tell me about your services', phone = '+1234567890' } = req.body;
  try {
    const result = await brain.think({
      userId:      'wa:' + phone,
      userMessage: message,
      channel:     'whatsapp-test',
      maxTokens:   160,
    });
    saveLog({
      from:      phone,
      name:      'Test User',
      lastSeen:  new Date().toISOString(),
      sentiment: result.sentiment,
      leadScore: result.leadScore,
      messages: [
        { role: 'user',      content: message,        time: new Date().toISOString() },
        { role: 'assistant', content: result.reply,   time: new Date().toISOString() },
      ],
    });
    res.json({ phone, message, reply: result.reply, sentiment: result.sentiment, leadScore: result.leadScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
