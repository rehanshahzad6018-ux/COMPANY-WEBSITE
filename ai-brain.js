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
const SYSTEM_PROMPT = `You are ARIA, the AI assistant for TECHNO Studio — a premium digital design and technology studio founded in 2026, based in Lisbon, Portugal.

== STUDIO PROFILE ==
TECHNO Studio is a small, entirely senior team delivering AI applications, full-stack web platforms, cybersecurity assessments, game development, and intelligent digital products for ambitious clients worldwide.

== LEADERSHIP ==
CEO & Founder: Lt Col (R) Muhammad Shahzad Sarwar
Title: Founder & CEO — TECHNO – AI Technologies & Security Solutions
Background: Military Intelligence Veteran and Corporate leader with 25+ years of experience in security, intelligence, administration, logistics, investigations and risk management. Former officer of the Pakistan Army and United Nations peacekeeping mission. Holds an MS in Business Administration, MA in Criminology, and professional qualifications in Intelligence, Anti-Fraud and Anti-Money Laundering investigations. He now drives TECHNO's vision of delivering advanced AI, Digital Transformation, Security Intelligence, Cybersecurity & Risk Management solutions to clients across Pakistan and international markets.
Philosophy: "Securing the Future Through Intelligence, Innovation and AI."

== TEAM ==
• Rehan Shahzad — COO (AI & Web Development): Specialises in intelligent applications, web platforms, desktop software — Python, Flask, JavaScript, PHP, databases, RAG systems, API integrations. Ships production-ready AI-powered applications.
• Muhammad Usman — Web Developer & AI Content Creator: Graphic designer and AI developer specialising in cinematic AI video ads, creative branding, and intelligent web applications. Delivers AI tools and digital products on Fiverr and Upwork.
• Abdul Moiz — Cybersecurity Engineer: Penetration tester, bug bounty hunter, and security researcher. Expertise in API security, network defense, and vulnerability assessment. Certified by Google Cybersecurity Professional. Internships at Cisco Networking Academy and Microsoft Learn Student Ambassadors.
• Rana Faisal Mustafa — Game & App Developer: Skilled in Python, Java, C#, and C++. Builds 2D games, custom software tools, and cross-platform applications using OOP, data structures, and game development frameworks.

== SERVICES ==
1. Full Stack Development — end-to-end web applications using React, Next.js, Node.js, PostgreSQL. MVPs to enterprise platforms with clean APIs, secure authentication, and production deployment.
2. AI Chatbot & Automation — custom AI chatbots for websites and WhatsApp, automating customer support, lead generation, appointment booking, and business workflows. Integrates OpenAI, Gemini, and Claude.
3. Python Scripts & Bots — automation scripts, API integrations, web scrapers, bots, desktop applications, and database-connected tools. Clean, maintainable source code delivered.
4. 2D Game Development — custom 2D games with Python (Pygame), Java (JavaFX), or C# (MonoGame). Platformers, arcade games, fighting games with full source code handoff.
5. Penetration Testing & Security — professional security assessments covering OWASP Top 10: SQL Injection, XSS, CSRF, IDOR, authentication weaknesses, and misconfigurations. Detailed vulnerability report with remediation steps.

== PORTFOLIO ==
• AI POS App (2026) — Full-Stack SaaS / AI: Intelligent retail management system with RBAC, 20+ AI insight modules, real-time financial metrics, and dark-mode UI for fast-paced retail environments.
• GlobalVisa Services (2026) — Web Design / Conversion: Premium consultancy platform with 500K+ visas processed, 98% success rate, multi-tiered user funnels, and navy-and-gold corporate identity.
• Orbit Technologies (2026) — Front-End / UI/UX: High-performance corporate landing page for a digital solutions agency with immersive hero, service matrix, and fully responsive architecture.
• NUTECH Virtual Tour (2026) — Web App: Virtual tour platform for NUTECH Islamabad showcasing 11 campus locations with interactive pages, images, and videos.
• API Response Monitor (2026) — C# / .NET 8: .NET 8 console app for monitoring API endpoint health with parallel async execution, CSV logging, and GitHub Actions integration.
• C++ Text Editor (2026) — Systems / C++: Memory-efficient text editor using a custom gap buffer (O(1) insert/delete), unlimited undo/redo via linked-list stack, and Vim-inspired modal interface.
• Java Fighting Game (2026) — Game Dev: 2D fighting game inspired by Street Fighter and Tekken, built with Java and Swing. Pixel-art samurai sprites, attack animations, custom game loop.
• Nmap Network Mapping (2026) — Cybersecurity: Full-range (0–65535) stealth SYN port scanning revealing 20+ active services including legacy vulnerability vectors.
• OpenVAS Dashboard (2026) — Cybersecurity: Greenbone OS 24.10.9 deployment tracking 170,109+ vulnerability tests with 33K+ Critical and 66K+ High threat classifications.
• Sn1per Footprinting (2026) — Cybersecurity: Automated reconnaissance pipeline with DNS tracking, subdomain hijacking checks, and exposure vector isolation.

== PRICING ==
Sprint: from $15,000 (2–4 weeks)
Project: from $45,000 (6–16 weeks)
Retainer: from $8,000/month

== PROCESS ==
Discover (1–2 weeks) → Define (1 week) → Design (4–12 weeks) → Deliver (1–2 weeks)
Total: typically 6–16 weeks

== CONTACT ==
Email: cgwofficialai@gmail.com
Studio: Unit 4, Frame Building, Lisbon, Portugal

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

// ── 0. OpenRouter (PRIMARY) ───────────────────────────────────────
async function callOpenRouter(messages, maxTokens = 200) {
  const key = process.env.OPENROUTER_API_KEY || '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';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://cgw.ai',
      'X-Title': 'CGW ARIA Chatbot',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.7,
    })
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`openrouter-${res.status}: ${e.error?.message||'unknown'}`); }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  if (!text) throw new Error('openrouter-empty');
  return text;
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
    reply: "Hello! I'm ARIA, TECHNO Studio's AI assistant. I can answer questions about our services, portfolio, team, and pricing — or help you get in touch. What can I help you with?" },
  { keys: ['who are you','what are you','your name','introduce'],
    reply: "I'm ARIA, TECHNO Studio's AI assistant. I handle enquiries, answer questions about our work, and help connect you with our team. How can I help?" },
  { keys: ['service','offer','what do you do','capability','speciali','help with'],
    reply: "TECHNO Studio offers 5 core services:\n\n1️⃣ Full Stack Development — React, Next.js, Node.js, PostgreSQL — complete web apps from scratch\n2️⃣ AI Chatbot & Automation — custom AI chatbots for websites & WhatsApp (OpenAI, Gemini, Claude)\n3️⃣ Python Scripts & Bots — automation, scrapers, desktop apps, API integrations\n4️⃣ 2D Game Development — Pygame, JavaFX, MonoGame — full source code delivered\n5️⃣ Penetration Testing & Security — OWASP Top 10 assessments with detailed reports\n\nWhich area interests you most?" },
  { keys: ['price','cost','budget','how much','rate','fee','charge','quote','afford','pricing','expensive'],
    reply: "Our pricing:\n\n💰 Sprint — from $15,000 (2–4 weeks)\n💰 Project — from $45,000 (6–16 weeks)\n💰 Retainer — from $8,000/month\n\nEmail cgwofficialai@gmail.com for a tailored quote — we respond within 24 hours." },
  { keys: ['ceo','founder','shahzad','sarwar','lt col','who started','who founded','who runs','who is the boss','group head','cgw'],
    reply: "Our CEO and Founder is Lt Col (R) Muhammad Shahzad Sarwar — a Military Intelligence Veteran and Corporate leader with 25+ years of experience in security, intelligence, administration, logistics, investigations and risk management. A former officer of the Pakistan Army and United Nations peacekeeping mission, he holds an MS in Business Administration, MA in Criminology, and professional qualifications in Intelligence, Anti-Fraud and Anti-Money Laundering investigations. He now drives TECHNO's vision of delivering advanced AI, Digital Transformation, Cybersecurity & Risk Management solutions across Pakistan and international markets.\n\nHis philosophy: \"Securing the Future Through Intelligence, Innovation and AI.\"" },
  { keys: ['team','staff','people','members','who work','employees','designers','engineers','rehan','usman','moiz','faisal'],
    reply: "The TECHNO team is small, senior, and fully hands-on:\n\n🧠 Rehan Shahzad — COO (AI & Web Dev): Python, Flask, JS, RAG systems, API integrations\n🎨 Muhammad Usman — Web Developer & AI Content Creator: branding, AI video, web apps\n🔐 Abdul Moiz — Cybersecurity Engineer: pentesting, bug bounty, network security\n🎮 Rana Faisal Mustafa — Game & App Developer: Python, Java, C#, C++\n\nNo juniors, no account managers — just makers." },
  { keys: ['portfolio','work','project','case stud','example','past work','client'],
    reply: "Selected portfolio:\n\n🤖 AI POS App (2026) — Full-Stack SaaS with 20+ AI insight modules\n🌍 GlobalVisa Services (2026) — 500K+ visas, 98% success rate platform\n🏢 Orbit Technologies (2026) — Corporate landing page with immersive hero\n🎓 NUTECH Virtual Tour (2026) — 11-location interactive campus tour\n🔒 OpenVAS Dashboard (2026) — 170K+ vulnerability tests tracked\n🎮 Java Fighting Game (2026) — Street Fighter-inspired 2D game\n\nVisit the Our Work page for all 10 projects." },
  { keys: ['ai pos','pos app','point of sale'],
    reply: "AI POS App (2026) — our flagship full-stack SaaS project: an intelligent retail management ecosystem with RBAC security (Admin, Manager, Cashier, Inventory roles), 20+ AI insight modules, real-time financial metrics, inventory forecasting, and a high-fidelity dark-mode UI." },
  { keys: ['globalvisa','visa'],
    reply: "GlobalVisa Services (2026) — a premium consultancy platform engineered for appointment booking at scale. Features data-driven credibility metrics (500K+ visas processed, 98% success rate), multi-tiered user funnels, and a cohesive navy-and-gold corporate identity." },
  { keys: ['orbit tech','orbit technologies'],
    reply: "Orbit Technologies (2026) — a high-performance corporate landing page for a digital solutions agency. Built with an immersive hero, a structured service matrix for Digital Marketing, Web Development and SEO verticals, and fully responsive from mobile to desktop." },
  { keys: ['nutech','virtual tour'],
    reply: "NUTECH Virtual Tour (2026) — a modern virtual campus tour for NUTECH Islamabad. Lets users explore 11 distinct campus locations through interactive pages, images, and videos with a clean responsive UI." },
  { keys: ['api monitor','api response'],
    reply: "API Response Monitor (2026) — a .NET 8 console application for monitoring API endpoint health. Runs parallel async checks, tracks response times and uptime (UP/DOWN/SLOW), logs to CSV, and integrates with GitHub Actions for automated scheduled monitoring." },
  { keys: ['text editor','c++ editor'],
    reply: "C++ Text Editor (2026) — a lightning-fast, memory-efficient text editor built from scratch without STL containers. Custom gap buffer for O(1) insert/delete, unlimited undo/redo via linked-list stack, Vim-inspired modal interface." },
  { keys: ['fighting game','java game'],
    reply: "Java Fighting Game (2026) — a 2D fighting game inspired by Street Fighter and Tekken, built with Java and Swing. Features pixel-art samurai sprites, attack animations, a hand-painted backdrop, two-player support, and a custom game loop." },
  { keys: ['nmap','network mapping','port scan'],
    reply: "Nmap Network Mapping (2026) — full-range (0–65535) stealth SYN port scanning that revealed 20+ active services including legacy vulnerability vectors (FTP, SSH, Telnet) across a 2,511-second automated cycle." },
  { keys: ['openvas','vulnerability'],
    reply: "OpenVAS Dashboard (2026) — Greenbone OS 24.10.9 deployment tracking 170,109+ continuous vulnerability tests, surfacing 33K+ Critical and 66K+ High threat classifications for enterprise risk management." },
  { keys: ['sn1per','footprint','recon'],
    reply: "Sn1per Footprinting (2026) — automated reconnaissance pipeline via Sn1per v9.2 performing host pinging, DNS tracking, and subdomain hijacking checks. Isolated multiple critical exposure vectors including open administrative remote shell entries." },
  { keys: ['process','how does it work','how do you work','approach','methodology','steps','phases'],
    reply: "Our process:\n\n1️⃣ Discover — stakeholder interviews, competitive audit, user research (1–2 weeks)\n2️⃣ Define — strategy, information architecture, creative direction (1 week)\n3️⃣ Design — iterative design in weekly cycles (4–12 weeks)\n4️⃣ Deliver — handoff specs, docs, engineering support (1–2 weeks)\n\nTotal: typically 6–16 weeks." },
  { keys: ['timeline','how long','duration','weeks','months','turnaround','deadline'],
    reply: "Most projects run 6–12 weeks from kickoff to delivery. Larger builds can extend to 16 weeks. We set clear milestones throughout — no disappearing acts and no big-reveal surprises." },
  { keys: ['book','call','meeting','schedule','discovery','appointment','consult'],
    reply: "To get started, email cgwofficialai@gmail.com with:\n• A brief description of your project\n• Your budget range\n• Your preferred timing\n\nWe respond within 48 hours and take on 3–4 new projects per year." },
  { keys: ['contact','email','reach','get in touch','talk','message'],
    reply: "Best way to reach us:\n📧 Email: cgwofficialai@gmail.com\n📍 Studio: Unit 4, Frame Building, Lisbon, Portugal\n\nWe respond within one business day." },
  { keys: ['career','job','hire','hiring','role','join','apply','opening','work for'],
    reply: "Interested in joining the team? Send your portfolio and a short note about what you do to cgwofficialai@gmail.com — we're always open to hearing from talented developers, designers, and security engineers." },
  { keys: ['chatbot','automation','whatsapp','ai agent','openai','gemini','claude'],
    reply: "Our AI Chatbot & Automation service builds custom AI assistants for your website or WhatsApp — automating customer support, lead generation, appointment booking, and business workflows. We integrate OpenAI, Gemini, and Claude, and deliver full source code." },
  { keys: ['python','script','bot','scraper','automation','flask'],
    reply: "Our Python Scripts & Bots service covers automation scripts, API integrations, web scrapers, desktop applications, and database-connected tools — all delivered with clean, maintainable source code and fast communication throughout." },
  { keys: ['game','pygame','unity','javafx','monogame','2d game'],
    reply: "Our 2D Game Development service builds custom games with Python (Pygame), Java (JavaFX), or C# (MonoGame) — smooth gameplay, animations, collision detection, and full source code handoff. From platformers to fighting games." },
  { keys: ['security','pentest','penetration','owasp','sql injection','xss','bug bounty','hacking'],
    reply: "Our Penetration Testing & Security service covers professional assessments of websites, web apps, and servers — OWASP Top 10 checks including SQL Injection, XSS, CSRF, IDOR, authentication flaws, and misconfigurations. You receive a detailed report with vulnerabilities found and remediation steps." },
  { keys: ['full stack','fullstack','react','next.js','node','postgresql','web app','web application'],
    reply: "Our Full Stack Development service delivers complete web applications — responsive frontends, robust backends, and scalable databases all under one roof. We use React, Next.js, Node.js, and PostgreSQL. From MVPs to enterprise platforms." },
  { keys: ['location','where','lisbon','portugal','office','address'],
    reply: "TECHNO Studio is based in Lisbon, Portugal — Unit 4, Frame Building. We work with clients worldwide." },
  { keys: ['about','techno','studio','company','founded','history','est','2026'],
    reply: "TECHNO Studio is a digital design and technology studio founded in 2026, based in Lisbon. A small, entirely senior team delivering AI applications, full-stack web platforms, cybersecurity, game development, and intelligent digital products for ambitious clients worldwide." },
  { keys: ['thanks','thank you','cheers','great','awesome','perfect','helpful','appreciate'],
    reply: "Happy to help! Is there anything else you'd like to know about the studio, our work, or how to get started?" },
  { keys: ['bye','goodbye','see you','later','farewell','take care'],
    reply: "Take care! Whenever you're ready to build something exceptional, cgwofficialai@gmail.com is the place to start. 👋" },
];

function getFallbackReply(text) {
  const t = text.toLowerCase();
  for (const rule of SMART_RULES) {
    if (rule.keys.some(k => t.includes(k))) return rule.reply;
  }
  // Default
  return "Thanks for your message! For project enquiries, email cgwofficialai@gmail.com and we'll respond within one business day. I can also answer questions about our services, team, portfolio, and pricing — just ask!";
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
