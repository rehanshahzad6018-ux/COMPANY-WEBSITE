/* ============================================================
   TECHNO — Phase 3: AI Voice Call Agent
   ============================================================
   Handles Twilio Voice webhooks, real-time STT/TTS, Gemini AI
   conversation, call recording, sentiment analysis, transfers,
   appointment booking, and CRM call logging.

   Mounted in server.js: app.use('/voice', voiceRouter)
   ============================================================ */
const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');

// ── Config from .env ───────────────────────────────────────────
const GEMINI_KEY      = process.env.GEMINI_API_KEY      || '';
const TRANSFER_NUMBER = process.env.TRANSFER_NUMBER      || '';
const TWILIO_SID      = process.env.TWILIO_ACCOUNT_SID   || '';
const CALLS_FILE      = path.join(__dirname, 'calls.json');

// ── Helpers ────────────────────────────────────────────────────
function readCalls() {
  try { return JSON.parse(fs.readFileSync(CALLS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeCalls(list) {
  fs.writeFileSync(CALLS_FILE, JSON.stringify(list, null, 2));
}
function saveCall(session) {
  const list = readCalls();
  // Overwrite existing or prepend
  const idx = list.findIndex(c => c.callSid === session.callSid);
  if (idx >= 0) list[idx] = session; else list.unshift(session);
  if (list.length > 500) list.length = 500;
  writeCalls(list);
}

// ── Active call sessions (in-memory during call) ───────────────
const sessions = new Map();

function getOrCreate(callSid, from) {
  if (!sessions.has(callSid)) {
    sessions.set(callSid, {
      callSid,
      from:        from || 'Unknown',
      startTime:   new Date().toISOString(),
      endTime:     null,
      duration:    0,
      status:      'in-progress',
      language:    'en-US',
      sentiment:   'neutral',
      sentimentScore: 0,
      outcome:     'answered',
      messages:    [],
      booking:     null,
      recordingUrl: null,
      transferredTo: null,
    });
  }
  return sessions.get(callSid);
}

// ── AI conversation via Gemini ─────────────────────────────────
const STUDIO_BRAIN = `You are ARIA, the AI voice agent for TECHNO Studio — a premium product design and technology studio based in Lisbon, Portugal.

== STUDIO INFO ==
- Services: Product Design, 3D & WebGL, Motion Design, Brand Systems, Frontend Engineering
- CEO: Adrian Vale — 15 years experience, 120+ products shipped, 9 industry awards
- Team: Lena Ortiz (Design Lead), Marcus Reed (Engineer), Sofia Nakamura (Motion), David Chen (Strategy), Amara Okafor (3D/WebGL), Tom Bergmann (Product)
- Portfolio: Nebula OS, Pulse Lab, Vector Finance, Helio Brand, Orbit Health, Mono Studio
- Pricing: Sprints from $15k, Projects from $45k, Retainer from $8k/month
- Process: Discover → Define → Design → Deliver (6–16 weeks typical)
- Email: studio@techno.dev | Location: Unit 4, Frame Building, Lisbon, Portugal

== YOUR RULES ==
1. KEEP RESPONSES SHORT — maximum 2 sentences. This is a phone call.
2. Sound warm, natural and professional — not robotic.
3. If asked about pricing, give ballpark ranges and offer a discovery call.
4. If caller wants to BOOK a call, collect: full name, email, and brief project description. Then confirm.
5. If caller sounds UPSET or specifically asks for a human, say you will transfer them.
6. If caller asks about AVAILABILITY, say Adrian or the team will confirm within 48 hours.
7. Do NOT make up specific dates, promises or numbers not listed above.
8. End naturally — do not say "Is there anything else I can help you with?" repeatedly.`;

async function askGemini(session, userText) {
  if (!GEMINI_KEY) return getDefaultResponse(userText);

  const history = session.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: STUDIO_BRAIN }] },
        contents: [...history, { role: 'user', parts: [{ text: userText }] }],
        generationConfig: { maxOutputTokens: 120, temperature: 0.65, stopSequences: ['\n\n'] }
      })
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim()
      || getDefaultResponse(userText);
  } catch (e) {
    console.error('[voice] Gemini error:', e.message);
    return getDefaultResponse(userText);
  }
}

function getDefaultResponse(text) {
  const t = text.toLowerCase();
  if (/price|cost|budget|how much/.test(t))
    return 'Projects typically start at $15,000 for focused sprints and $45,000 for full engagements. Shall I have someone reach out with a detailed quote?';
  if (/service|what do you do|help/.test(t))
    return "We specialise in product design, 3D and WebGL, motion, brand systems and frontend engineering. Which area is most relevant to your project?";
  if (/book|schedule|appointment|call|meeting/.test(t))
    return "I'd love to arrange a discovery call. Could you share your name and email and I'll get that booked right away?";
  if (/ceo|founder|adrian/.test(t))
    return "Adrian Vale founded TECHNO Studio with 15 years of experience and has shipped over 120 digital products. He leads every project personally.";
  return "That's a great question. Could you tell me a bit more so I can give you the most helpful answer?";
}

// ── Sentiment analysis ─────────────────────────────────────────
function analyseSentiment(text) {
  const t = text.toLowerCase();
  const neg = (t.match(/angry|frustrated|terrible|awful|hate|disappointed|upset|useless|ridiculous|worst|scam|stupid/g) || []).length;
  const pos = (t.match(/great|excellent|wonderful|amazing|love|perfect|helpful|fantastic|brilliant|impressed|happy/g) || []).length;
  const score = pos - neg;
  return { sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral', score };
}

// ── Intent detection ───────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/transfer|human|agent|real person|speak to someone|live agent|person please/.test(t)) return 'transfer';
  if (/bye|goodbye|that's all|no thanks|nothing else|hang up|end call/.test(t))             return 'end';
  if (/book|schedule|appointment|set up a call|meeting|discovery/.test(t))                  return 'book';
  if (/hello|hi|hey|good morning|good afternoon/.test(t) && text.split(' ').length < 4)     return 'greeting';
  return 'conversation';
}

// ── Language detection (basic) ─────────────────────────────────
function detectLanguage(text) {
  const map = [
    { re: /bonjour|merci|comment|bien|est-ce|voulez/i,      lang: 'fr-FR' },
    { re: /hola|gracias|cómo|está|hablar|español/i,          lang: 'es-ES' },
    { re: /hallo|danke|wie|guten|sprechen|deutsch/i,          lang: 'de-DE' },
    { re: /ciao|grazie|come|stai|parla|italiano/i,            lang: 'it-IT' },
    { re: /مرحبا|شكرا|كيف|عربي/,                             lang: 'ar-XA' },
  ];
  for (const { re, lang } of map) if (re.test(text)) return lang;
  return 'en-US';
}

// ── TwiML helpers ──────────────────────────────────────────────
function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function voiceFor(lang) {
  const voices = {
    'en-US': 'Polly.Joanna-Neural',
    'fr-FR': 'Polly.Lea-Neural',
    'es-ES': 'Polly.Lucia-Neural',
    'de-DE': 'Polly.Vicki-Neural',
    'it-IT': 'Polly.Bianca-Neural',
    'ar-XA': 'Polly.Zeina',
  };
  return voices[lang] || 'Polly.Joanna-Neural';
}

function buildTwiML(say, gatherAction, lang = 'en-US', redirectPath = '/voice/incoming') {
  const voice = voiceFor(lang);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${xmlEscape(say)}</Say>
  <Gather input="speech" action="${gatherAction}" method="POST"
          timeout="6" speechTimeout="auto" language="${lang}">
  </Gather>
  <Redirect>${redirectPath}</Redirect>
</Response>`;
}

function buildTransferTwiML(say, number, lang = 'en-US') {
  const voice = voiceFor(lang);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${xmlEscape(say)}</Say>
  <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || ''}" timeout="30" record="record-from-answer">
    <Number>${xmlEscape(number)}</Number>
  </Dial>
  <Say voice="${voice}">The team member is unavailable right now. Please email us at studio at techno dot dev and we will respond within 48 hours. Goodbye!</Say>
  <Hangup/>
</Response>`;
}

function buildEndTwiML(say, lang = 'en-US') {
  const voice = voiceFor(lang);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${xmlEscape(say)}</Say>
  <Hangup/>
</Response>`;
}

// ══════════════════════════════════════════════════════════════
//   ROUTES
// ══════════════════════════════════════════════════════════════

// Use urlencoded body for Twilio webhooks
router.use(express.urlencoded({ extended: false }));

// ── GET /voice/health ──────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    activeCalls: sessions.size,
    twilioConfigured: !!(TWILIO_SID && process.env.TWILIO_AUTH_TOKEN),
    geminiConfigured: !!GEMINI_KEY,
    transferNumber: TRANSFER_NUMBER ? '✓ configured' : '✗ not set',
  });
});

// ── POST /voice/incoming ── First contact ──────────────────────
router.post('/incoming', (req, res) => {
  const callSid = req.body.CallSid || 'test-' + Date.now();
  const from    = req.body.From    || 'Unknown';

  const session = getOrCreate(callSid, from);
  console.log(`[voice] Incoming call ${callSid} from ${from}`);

  const greeting = "Hello! Thank you for calling TECHNO Studio. I'm ARIA, your AI assistant. How can I help you today?";
  session.messages.push({ role: 'assistant', content: greeting, time: new Date().toISOString() });

  res.type('text/xml').send(buildTwiML(greeting, '/voice/process', 'en-US', '/voice/incoming'));
});

// ── POST /voice/process ── Main conversation loop ──────────────
router.post('/process', async (req, res) => {
  const callSid     = req.body.CallSid       || '';
  const speechResult= req.body.SpeechResult  || '';
  const confidence  = parseFloat(req.body.Confidence || '0');

  const session = sessions.get(callSid);
  if (!session) {
    // Lost session — restart gracefully
    return res.type('text/xml').send(buildTwiML(
      "I'm sorry, I lost our connection context. How can I help you?",
      '/voice/process', 'en-US', '/voice/incoming'
    ));
  }

  // Low confidence / empty — ask to repeat
  if (!speechResult || confidence < 0.3) {
    return res.type('text/xml').send(buildTwiML(
      "I didn't quite catch that. Could you say that again?",
      '/voice/process', session.language, '/voice/incoming'
    ));
  }

  console.log(`[voice] ${callSid} | "${speechResult}" (conf: ${confidence})`);

  // Detect language on first user turn
  if (session.messages.filter(m => m.role === 'user').length === 0) {
    session.language = detectLanguage(speechResult);
  }

  // Log user message
  session.messages.push({ role: 'user', content: speechResult, time: new Date().toISOString(), confidence });

  // Analyse sentiment
  const { sentiment, score } = analyseSentiment(speechResult);
  session.sentiment = sentiment;
  session.sentimentScore = (session.sentimentScore || 0) + score;

  // Detect intent
  const intent = detectIntent(speechResult);

  // ── Transfer ───────────────────────────────────────────────
  if (intent === 'transfer') {
    const goodbye = session.language === 'fr-FR'
      ? 'Bien sûr. Je vous transfère maintenant à un membre de notre équipe. Veuillez patienter.'
      : 'Of course. Let me transfer you to one of our team members right away. Please hold.';
    session.outcome = 'transferred';
    session.transferredTo = TRANSFER_NUMBER || 'no-number-configured';
    session.messages.push({ role: 'assistant', content: goodbye, time: new Date().toISOString() });
    saveCall(session);

    if (!TRANSFER_NUMBER) {
      return res.type('text/xml').send(buildEndTwiML(
        "I'm sorry, our transfer line isn't configured yet. Please email us at studio at techno dot dev and we'll get back to you within 48 hours. Thank you!",
        session.language
      ));
    }
    return res.type('text/xml').send(buildTransferTwiML(goodbye, TRANSFER_NUMBER, session.language));
  }

  // ── End call ───────────────────────────────────────────────
  if (intent === 'end') {
    const farewell = 'Thank you for calling TECHNO Studio. Have a wonderful day. Goodbye!';
    session.outcome = 'completed';
    session.messages.push({ role: 'assistant', content: farewell, time: new Date().toISOString() });
    saveCall(session);
    sessions.delete(callSid);
    return res.type('text/xml').send(buildEndTwiML(farewell, session.language));
  }

  // ── AI Response ────────────────────────────────────────────
  try {
    const aiReply = await askGemini(session, speechResult);
    session.messages.push({ role: 'assistant', content: aiReply, time: new Date().toISOString() });

    // Check if AI is asking for booking info — track progress
    if (intent === 'book' && !session.booking) {
      session.booking = { stage: 'name', data: {} };
    }

    // Auto-save session state
    saveCall(session);

    return res.type('text/xml').send(buildTwiML(aiReply, '/voice/process', session.language, '/voice/incoming'));
  } catch (err) {
    console.error('[voice] AI error:', err);
    const fallback = 'I apologise for the technical difficulty. Let me transfer you to our team.';
    if (TRANSFER_NUMBER) {
      return res.type('text/xml').send(buildTransferTwiML(fallback, TRANSFER_NUMBER, session.language));
    }
    return res.type('text/xml').send(buildEndTwiML(
      'I apologise for the difficulty. Please email studio at techno dot dev and we will respond promptly. Goodbye!',
      session.language
    ));
  }
});

// ── POST /voice/status ── Call lifecycle events ────────────────
router.post('/status', (req, res) => {
  const callSid    = req.body.CallSid     || '';
  const status     = req.body.CallStatus  || '';
  const duration   = parseInt(req.body.CallDuration || '0', 10);
  const recordUrl  = req.body.RecordingUrl || null;

  console.log(`[voice] Status: ${callSid} → ${status} (${duration}s)`);

  const session = sessions.get(callSid) || readCalls().find(c => c.callSid === callSid);
  if (session) {
    session.endTime      = new Date().toISOString();
    session.duration     = duration;
    session.status       = status;
    if (recordUrl) session.recordingUrl = recordUrl + '.mp3';
    if (status === 'completed' && !session.outcome) session.outcome = 'completed';
    if (status === 'no-answer')  session.outcome = 'missed';
    if (status === 'busy')       session.outcome = 'busy';
    if (status === 'failed')     session.outcome = 'failed';
    saveCall(session);
    sessions.delete(callSid);
  }

  res.sendStatus(200);
});

// ── POST /voice/recording ── Recording ready ───────────────────
router.post('/recording', (req, res) => {
  const callSid = req.body.CallSid || '';
  const url     = req.body.RecordingUrl || '';
  const calls   = readCalls();
  const call    = calls.find(c => c.callSid === callSid);
  if (call && url) { call.recordingUrl = url + '.mp3'; writeCalls(calls); }
  res.sendStatus(200);
});

// ── GET /voice/calls ── Call logs for admin panel ──────────────
router.get('/calls', (req, res) => {
  const calls = readCalls();
  res.json(calls.slice(0, 100));
});

// ── GET /voice/active ── Live active calls ─────────────────────
router.get('/active', (req, res) => {
  const active = [];
  sessions.forEach(s => active.push({
    callSid:   s.callSid,
    from:      s.from,
    startTime: s.startTime,
    language:  s.language,
    sentiment: s.sentiment,
    turns:     s.messages.length,
  }));
  res.json(active);
});

// ── DELETE /voice/calls ── Clear logs ─────────────────────────
router.delete('/calls', (req, res) => {
  writeCalls([]);
  res.json({ ok: true });
});

// ── POST /voice/test ── Simulate a call (dev/demo) ─────────────
router.post('/test', async (req, res) => {
  const { message = 'Tell me about your services' } = req.body;
  const fakeSid = 'TEST-' + Date.now().toString(36);
  const session = getOrCreate(fakeSid, '+00000000000');
  const reply   = await askGemini(session, message);
  session.messages.push({ role: 'user',      content: message, time: new Date().toISOString() });
  session.messages.push({ role: 'assistant', content: reply,   time: new Date().toISOString() });
  session.status  = 'completed';
  session.outcome = 'test';
  session.endTime = new Date().toISOString();
  session.duration = 30;
  saveCall(session);
  sessions.delete(fakeSid);
  res.json({ callSid: fakeSid, message, reply });
});

module.exports = router;
