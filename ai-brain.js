/* ============================================================
   TECHNO — Central AI Brain
   ============================================================
   Single module shared by all three agents:
   • WhatsApp Agent  (/whatsapp)
   • Email Agent     (/api/chat)
   • Voice Agent     (/voice)

   Supports OpenAI GPT-4o (primary) and Gemini (fallback).
   Maintains per-user conversation memory in brain-memory.json.
   ============================================================ */
const fs   = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, 'brain-memory.json');

// ── TECHNO STUDIO KNOWLEDGE BASE ────────────────────────────────
const SYSTEM_PROMPT = `You are ARIA, the AI assistant for TECHNO Studio — a premium digital design and technology studio founded in 2026 by Adrian Vale, based in Lisbon, Portugal.

== STUDIO PROFILE ==
CEO: Adrian Vale — 15 years experience, 120+ products shipped, 9 industry awards
Team: Lena Ortiz (Design Lead) · Marcus Reed (Principal Engineer) · Sofia Nakamura (Motion Director) · David Chen (Strategy Lead) · Amara Okafor (3D Artist) · Tom Bergmann (Product Designer)

== SERVICES ==
1. Product Design — full lifecycle, UX research, design systems
2. 3D & WebGL — real-time 3D, shaders, GPU-accelerated browser experiences
3. Motion Design — transitions, micro-interactions, brand films
4. Brand Systems — identity, typography, visual language at scale
5. Engineering — pixel-perfect React/Next.js, accessible, performant

== PORTFOLIO ==
• Nebula OS (2026) — spatial interface, 2.4M users, D&AD Wood Pencil
• Pulse Lab (2025) — WebGL genomics data visualisation
• Vector Finance (2025) — fintech product design, 240+ components
• Helio Brand (2024) — full brand system, 180-page guidelines
• Orbit Health (2024) — WCAG 2.2 AAA patient platform
• Mono Studio (2023) — zero-dependency WebGL scroll engine

== PRICING ==
Sprint: from $15,000 (2–4 weeks)
Project: from $45,000 (6–16 weeks)
Retainer: from $8,000/month

== PROCESS ==
Discover → Define → Design → Deliver (6–16 weeks typical)

== CONTACT ==
studio@techno.dev | careers@techno.dev
Unit 4, Frame Building, Lisbon, Portugal

== YOUR BEHAVIOUR ==
• Be warm, concise and professional
• Phone/WhatsApp: max 2 sentences per reply
• Email: 2–4 short paragraphs
• If asked about booking → collect name, email, project brief
• If caller seems upset or asks for human → offer to transfer/escalate
• Never make up prices or promises not listed above
• Detect the user's language and reply in the same language`;

// ── Memory Store ─────────────────────────────────────────────────
function readMemory() {
  try { return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')); }
  catch (e) { return {}; }
}
function writeMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

function getSession(userId) {
  const mem = readMemory();
  if (!mem[userId]) {
    mem[userId] = {
      userId,
      messages:    [],
      profile:     { name: null, email: null, language: 'en', channel: 'unknown' },
      leadScore:   0,
      lastSeen:    new Date().toISOString(),
      totalTurns:  0,
    };
    writeMemory(mem);
  }
  return mem[userId];
}

function saveSession(session) {
  const mem = readMemory();
  session.lastSeen   = new Date().toISOString();
  session.totalTurns = (session.messages.filter(m => m.role === 'user').length);
  mem[session.userId] = session;
  // Keep max 200 messages per user to avoid bloat
  if (session.messages.length > 200) session.messages = session.messages.slice(-200);
  writeMemory(mem);
}

function clearSession(userId) {
  const mem = readMemory();
  if (mem[userId]) { mem[userId].messages = []; mem[userId].leadScore = 0; }
  writeMemory(mem);
}

// ── Lead scoring ─────────────────────────────────────────────────
function scoreLeadIntent(text) {
  const t = text.toLowerCase();
  let score = 0;
  if (/price|cost|budget|quote|how much/.test(t))         score += 10;
  if (/book|schedule|call|meeting|appointment/.test(t))   score += 15;
  if (/project|build|design|develop|create/.test(t))      score += 10;
  if (/ready|soon|asap|urgently|this month/.test(t))      score += 20;
  if (/email|@/.test(t))                                  score += 25;
  if (/name is|i am|i'm|my company/.test(t))              score += 10;
  return score;
}

// ── Language detection ────────────────────────────────────────────
function detectLanguage(text) {
  if (/bonjour|merci|comment|est-ce|nous|votre/i.test(text))  return 'fr';
  if (/hola|gracias|cómo|está|hablar|quiero/i.test(text))     return 'es';
  if (/hallo|danke|bitte|guten|sprechen/i.test(text))         return 'de';
  if (/ciao|grazie|come|stai|buon/i.test(text))               return 'it';
  if (/مرحبا|شكرا|كيف|أريد/i.test(text))                     return 'ar';
  return 'en';
}

// ── Sentiment ─────────────────────────────────────────────────────
function detectSentiment(text) {
  const t = text.toLowerCase();
  const neg = (t.match(/angry|upset|frustrated|terrible|awful|hate|disappointed|useless|scam|worst/g)||[]).length;
  const pos = (t.match(/great|love|perfect|amazing|excellent|wonderful|helpful|impressed|happy/g)||[]).length;
  if (neg > pos) return 'negative';
  if (pos > neg) return 'positive';
  return 'neutral';
}

// ── Email extraction ──────────────────────────────────────────────
function extractEmail(text) {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0] : null;
}

// ── 1. OpenAI GPT ────────────────────────────────────────────────
async function callOpenAI(messages, maxTokens = 200) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your_openai_key_here') throw new Error('no-openai-key');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: maxTokens, temperature: 0.7,
    })
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`openai-${res.status}: ${e.error?.message||'unknown'}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ── 2. Groq — FREE, no credit card (console.groq.com) ────────────
async function callGroq(messages, maxTokens = 200) {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your_groq_key_here') throw new Error('no-groq-key');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama3-8b-8192',   // free model on Groq
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: maxTokens, temperature: 0.7,
    })
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`groq-${res.status}: ${e.error?.message||'unknown'}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ── 3. Gemini — FREE (aistudio.google.com) ───────────────────────
async function callGemini(messages, maxTokens = 200) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_free_gemini_key_here') throw new Error('no-gemini-key');
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
      })
    }
  );
  if (!res.ok) throw new Error('gemini-' + res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!text) throw new Error('gemini-empty');
  return text.trim();
}

// ── MAIN: think() — call this from any agent ─────────────────────
async function think({ userId, userMessage, channel = 'unknown', maxTokens = 200 }) {
  const session = getSession(userId);
  session.profile.channel = channel;

  // Detect language on first few messages
  if (session.messages.length < 4) {
    const lang = detectLanguage(userMessage);
    if (lang !== 'en') session.profile.language = lang;
  }

  // Extract email if mentioned
  const foundEmail = extractEmail(userMessage);
  if (foundEmail && !session.profile.email) session.profile.email = foundEmail;

  // Score lead intent
  session.leadScore = (session.leadScore || 0) + scoreLeadIntent(userMessage);

  // Add to history
  session.messages.push({ role: 'user', content: userMessage, time: new Date().toISOString() });

  // Build messages array (last 10 turns for context window efficiency)
  const recentMessages = session.messages
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content }));

  let reply = '';
  // Try all AI providers in order: OpenAI → Groq (free) → Gemini (free) → smart fallback
  try {
    reply = await callOpenAI(recentMessages, maxTokens);
    console.log('[brain] ✓ OpenAI');
  } catch (e1) {
    console.warn('[brain] OpenAI:', e1.message);
    try {
      reply = await callGroq(recentMessages, maxTokens);
      console.log('[brain] ✓ Groq (free)');
    } catch (e2) {
      console.warn('[brain] Groq:', e2.message);
      try {
        reply = await callGemini(recentMessages, maxTokens);
        console.log('[brain] ✓ Gemini (free)');
      } catch (e3) {
        console.warn('[brain] Gemini:', e3.message, '— using smart fallback');
        reply = getFallbackReply(userMessage);
      }
    }
  }

  // Log assistant reply
  session.messages.push({ role: 'assistant', content: reply, time: new Date().toISOString() });
  saveSession(session);

  return {
    reply,
    session,
    sentiment:   detectSentiment(userMessage),
    language:    session.profile.language,
    leadScore:   session.leadScore,
    foundEmail,
  };
}

// ── Smart fallback (works with ZERO API key) ──────────────────────
const SMART_RULES = [
  { keys: ['hello','hi','hey','howdy','good morning','good afternoon','good evening','salaam','salam'],
    reply: "Hello! I'm ARIA, the AI assistant for TECHNO Studio. I can answer questions about our services, pricing, team, and portfolio — or help you book a discovery call. What can I help you with?" },
  { keys: ['who are you','what are you','your name','introduce'],
    reply: "I'm ARIA, TECHNO Studio's AI assistant. I handle enquiries, answer questions about our work, and help connect you with our team. How can I help?" },
  { keys: ['service','offer','what do you do','capability','speciali','help with'],
    reply: "TECHNO Studio offers 5 core services:\n\n1️⃣ Product Design — UX research to shipped design systems\n2️⃣ 3D & WebGL — real-time GPU-accelerated browser experiences\n3️⃣ Motion Design — transitions, micro-interactions & brand films\n4️⃣ Brand Systems — identity, typography & visual language\n5️⃣ Engineering — pixel-perfect React/Next.js builds\n\nWhich area are you most interested in?" },
  { keys: ['price','cost','budget','how much','rate','fee','charge','quote','afford','pricing','expensive'],
    reply: "Our pricing:\n\n💰 Sprint — from $15,000 (2–4 weeks)\n💰 Project — from $45,000 (6–16 weeks)\n💰 Retainer — from $8,000/month\n\nThe right fit depends on your scope. Email studio@techno.dev for a tailored quote — we respond within 24 hours." },
  { keys: ['ceo','founder','adrian','adrian vale','who started','who founded','who runs','who is the boss'],
    reply: "Our CEO is Adrian Vale — Founder & Creative Director. He has 15 years of experience leading design and technology teams, has shipped 120+ digital products, and won 9 industry awards. His philosophy: \"Great design isn't about adding more — it's about giving every element a reason to exist.\"" },
  { keys: ['team','staff','people','members','who work','employees','designers','engineers'],
    reply: "The TECHNO team is small, senior, and fully hands-on:\n\n👩‍💼 Lena Ortiz — Design Lead\n👨‍💻 Marcus Reed — Principal Engineer\n🎬 Sofia Nakamura — Motion Director\n📊 David Chen — Strategy Lead\n🎨 Amara Okafor — 3D Artist\n📱 Tom Bergmann — Product Designer\n\nNo juniors, no account managers — just makers." },
  { keys: ['portfolio','work','project','case stud','example','past work','client'],
    reply: "Selected portfolio:\n\n🚀 Nebula OS (2026) — spatial interface, 2.4M users, D&AD Pencil\n🔬 Pulse Lab (2025) — WebGL genomics visualisation\n💳 Vector Finance (2025) — fintech product design\n🎨 Helio Brand (2024) — full brand system\n🏥 Orbit Health (2024) — WCAG 2.2 AAA platform\n🖥️ Mono Studio (2023) — WebGL scroll engine\n\nVisit the Our Work page for full details." },
  { keys: ['nebula','nebula os'],
    reply: "Nebula OS (2026) is our most ambitious project — a full spatial operating system interface rebuilt with real-time 3D that responds to touch, light and motion. Shipped to 2.4M users on day one and won a D&AD Wood Pencil." },
  { keys: ['pulse lab','pulse'],
    reply: "Pulse Lab (2025) is a WebGL-powered science platform we built — capable of visualising 10M+ genomic data points at 60fps, entirely in the browser. One of our most technically demanding builds." },
  { keys: ['vector finance','vector'],
    reply: "Vector Finance (2025) — a full fintech product design project. We built a 240+ component design system covering 8 user roles and 14 dashboard views from scratch." },
  { keys: ['helio brand','helio'],
    reply: "Helio Brand (2024) — a complete brand system including wordmark, variable type system, motion language, illustration style, and 180-page brand guidelines for a Web3 infrastructure company." },
  { keys: ['orbit health','orbit'],
    reply: "Orbit Health (2024) — a patient-facing health platform redesigned around accessibility first. WCAG 2.2 AAA throughout, with an adaptive interface that adjusts to patient preferences." },
  { keys: ['mono studio','mono'],
    reply: "Mono Studio (2023) — a portfolio website for an architecture firm featuring a custom WebGL canvas that renders building models in real-time as you scroll, using a zero-dependency scroll engine." },
  { keys: ['process','how does it work','how do you work','approach','methodology','steps','phases'],
    reply: "Our process:\n\n1️⃣ Discover — stakeholder interviews, user research, audit (1–2 weeks)\n2️⃣ Define — strategy, information architecture, creative direction (1 week)\n3️⃣ Design — iterative design in weekly cycles (4–12 weeks)\n4️⃣ Deliver — handoff specs, design system docs, engineering support (1–2 weeks)\n\nTotal: typically 6–16 weeks." },
  { keys: ['timeline','how long','duration','weeks','months','turnaround','deadline'],
    reply: "Most projects run 6–12 weeks from kickoff to delivery. Larger builds can extend to 16 weeks. We set clear milestones so there are no surprises — and we'll give you an accurate estimate in our first call." },
  { keys: ['book','call','meeting','schedule','discovery','appointment','consult'],
    reply: "To book a discovery call, email studio@techno.dev with:\n• A brief description of your project\n• Your budget range\n• Your preferred timing\n\nWe confirm within 48 hours and take on 3–4 new projects per year." },
  { keys: ['contact','email','reach','get in touch','talk','message','studio@'],
    reply: "Best ways to reach us:\n📧 Projects: studio@techno.dev\n💼 Careers: careers@techno.dev\n📍 Location: Unit 4, Frame Building, Lisbon, Portugal\n\nWe respond within one business day." },
  { keys: ['career','job','hire','hiring','role','join','apply','opening','work for'],
    reply: "Interested in joining the studio? Send your portfolio and a short note to careers@techno.dev — we're always open to hearing from great designers, engineers, and motion artists." },
  { keys: ['3d','webgl','three.js','spatial','immersive','shader','gpu','real-time'],
    reply: "3D & WebGL is a signature TECHNO capability. We build real-time 3D environments, custom shaders, and GPU-accelerated scenes that run at 60fps in the browser — no plugins. See Nebula OS and Pulse Lab as examples." },
  { keys: ['product design','ux','ui','interface','dashboard','figma','wireframe','prototype'],
    reply: "Our Product Design service covers everything from user research and information architecture through high-fidelity Figma files and complete design systems — ready for engineering handoff." },
  { keys: ['brand','identity','logo','visual','typography','colour','color','rebrand'],
    reply: "Our Brand Systems service builds identities from the ground up — wordmark, type systems, colour palettes, motion language, and documentation your whole team can use. Built to outlast the next rebrand cycle." },
  { keys: ['motion','animation','transition','micro','gsap','film','video','kinetic'],
    reply: "Motion Design at TECHNO means signature transitions, micro-interactions, and brand films — motion that gives your product personality. From a 12ms hover state to a two-minute launch film." },
  { keys: ['engineering','code','develop','front-end','frontend','react','next.js','build'],
    reply: "Our Engineering service delivers front-end builds that match the design pixel-for-pixel — built in React, Next.js, or vanilla JS. Production-ready, accessible, and maintainable." },
  { keys: ['location','where','lisbon','portugal','office','address'],
    reply: "TECHNO Studio is based in Lisbon, Portugal — Unit 4, Frame Building. The team is distributed across Lisbon, Berlin, and Tokyo, and we work with clients worldwide." },
  { keys: ['about','techno','studio','company','founded','history','est','2026'],
    reply: "TECHNO is a digital design & technology studio founded in 2026 by Adrian Vale in Lisbon. A small, entirely senior team building 3D interfaces, motion systems, brand identities, and engineered digital products for ambitious teams worldwide." },
  { keys: ['thanks','thank you','cheers','great','awesome','perfect','helpful','appreciate'],
    reply: "Happy to help! Is there anything else you'd like to know about the studio, our work, or how to get started?" },
  { keys: ['bye','goodbye','see you','later','farewell','take care'],
    reply: "Take care! Whenever you're ready to build something exceptional, studio@techno.dev is the place to start. 👋" },
];

function getFallbackReply(text) {
  const t = text.toLowerCase();
  for (const rule of SMART_RULES) {
    if (rule.keys.some(k => t.includes(k))) return rule.reply;
  }
  // Default
  return "Thanks for your message! For project enquiries, email studio@techno.dev and we'll respond within one business day. I can also answer questions about our services, team, portfolio, and pricing — just ask!";
}

// ── Exports ───────────────────────────────────────────────────────
module.exports = {
  think,
  getSession,
  saveSession,
  clearSession,
  readMemory,
  detectSentiment,
  detectLanguage,
  scoreLeadIntent,
  SYSTEM_PROMPT,
};
