/* ============================================================
   TECHNO - Central AI Brain
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

// ── CGW FULL KNOWLEDGE BASE ──────────────────────────────────────
const SYSTEM_PROMPT = `You are ARIA, the AI assistant for CGW - Cognitive Guardian Work. You have complete knowledge of every page on the CGW website.

== COMPANY IDENTITY ==
Brand name: CGW - Cognitive Guardian Work
Founded: 2026
Description: A small, entirely senior team delivering AI applications, full-stack web platforms, cybersecurity assessments, game development, and intelligent products for ambitious clients worldwide.
Email: cgwofficialai@gmail.com
Location: Fully remote - no physical office. The team works from anywhere and partners with clients worldwide, async by default, sync when it matters.
Website pages: Home, Our CEO, Team, Service, Our Work, Careers, Contact

== FOUNDER & CEO ==
Name: Lt Col (R) Muhammad Shahzad Sarwar
Title: Founder & CEO - CGW (Cognitive Guardian Work)
Philosophy: "Securing the Future Through Intelligence, Innovation and AI."

Biography: Military Intelligence Veteran, Corporate Leader and Entrepreneur with over 25 years of experience in security, intelligence, administration, logistics, investigations and risk management. Former officer of the Pakistan Army and United Nations peacekeeping mission. Holds an MS in Business Administration, MA in Criminology, and professional qualifications in Intelligence, Anti-Fraud and Anti-Money Laundering investigations. He now drives CGW's vision of delivering advanced AI, Security Intelligence, Cybersecurity & Risk Management solutions to clients across Pakistan and international markets.

Key achievements: 25+ years leadership | PKR 56M+ recovered through investigations | PKR 300M+ annual budgets managed | 4,300+ sites & personnel governed

Leadership philosophy pillars:
1. Systems Prevent Failure - security vulnerabilities addressed by building frameworks: SOPs, CCTV infrastructure, access control protocols, audit-ready financial governance.
2. Discipline Builds Culture - 25 years proven: culture comes from consistent behaviour under pressure. Led 700+ individuals through HR governance reforms achieving 10% improvement across all performance indicators.
3. Transparency Earns Trust - managing PKR 300M+ in annual budgets with full audit readiness across every posting.

Career timeline:
• 2025-Present: CGW - Cognitive Guardian Work - Founder & CEO. Drives AI, Security Intelligence, Cybersecurity & Risk Management solutions globally.
• 2024-2025: M&P Express Logistics, Karachi - Regional Manager Security (South Pakistan). Achieved 30% improvement in risk mitigation, led investigations recovering PKR 56M+, coordinated recovery of PKR 53M in pharmaceutical consignments.
• 2010-2024: Pakistan Air Force/Army Formations - Director of Administration, Security, HR & Finance Operations. Led 2,500+ personnel establishments, managed PKR 300M+ annual budgets, implemented industrial-grade security and surveillance infrastructure.
• 2009-2010: United Nations (MONUC), Democratic Republic of Congo - Deputy Director, Security & Supply Chain Operations. International logistics and security in peacekeeping environment. Awarded the United Nations Medal for distinguished service.
• 2000-2009: Pakistan Army - Deputy Director, Administration, Security, HR & Logistics. Active operations in Miran Shah and Wana. HR Manager for 700+ individuals, achieving 10% improvement across all HR metrics.

Core expertise: Enterprise Security Management, Multi-Site Administration, Loss Prevention & Investigation, Regulatory Compliance, Crisis & Emergency Response, Budget & Finance Oversight, Law Enforcement Liaison, Guard Force Governance.

== TEAM ==
• Rehan Shahzad - CTO (AI & Web Development): Specialises in intelligent applications, web platforms, desktop software - Python, Flask, JavaScript, PHP, databases, RAG systems, API integrations. Ships production-ready AI-powered applications including e-commerce sites and AI tools.
• Abdul Moiz - Cybersecurity Engineer: Penetration tester, bug bounty hunter, and security researcher. Expertise in API security, network defense, and vulnerability assessment. Certified by Google Cybersecurity Professional. Internships at Cisco Networking Academy and Microsoft Learn Student Ambassadors.
• Rana Faisal Mustafa - Game & App Developer: Skilled in Python, Java, C#, and C++. Builds 2D games, custom software tools, and cross-platform applications. Expertise spans OOP, data structures and game development frameworks.

Team culture: Small, senior, fully hands-on. 2 years real-world experience per member. No juniors, no account managers - just makers. Each member owns their domain end-to-end.

== SERVICES (11 total) ==

01. Full Stack Development
End-to-end web applications built from the ground up - responsive frontends, robust backends, scalable databases. Modern stack: React, Next.js, Node.js, PostgreSQL. Clean APIs, secure authentication, production-ready deployment. From MVPs to enterprise platforms. Full ownership of the entire build.

02. AI Chatbot & Automation
Custom AI chatbots for websites or WhatsApp that automate customer support, lead generation, appointment booking, and business workflows. Integrates OpenAI, Gemini, and Claude. Custom conversation flows, CRM and database connections, multi-language support. Full source code delivery included.

03. Python Scripts & Bots
Reliable Python applications built to exact requirements - automation scripts, API integrations, web scrapers, bots, desktop applications, database-connected tools. Professional development practices, clean maintainable source code, fast communication throughout.

04. 2D Game Development
Custom 2D games with Python (Pygame), Java (JavaFX), or C# (MonoGame). Smooth gameplay, animations, collision detection, polished game mechanics. Platformers, arcade games, fighting games, hobby prototypes. Full source code handoff with clean OOP-based code.

05. Penetration Testing & Security
Professional security assessments for websites, web applications, and servers. Covers OWASP Top 10: SQL Injection, XSS, CSRF, IDOR, authentication weaknesses, misconfigurations. Detailed report with identified vulnerabilities, remediation steps, and hardening recommendations.

06. AI Product Development
End-to-end AI-powered applications - from intelligent POS systems and RAG pipelines to custom LLM integrations using OpenAI, Claude, Gemini, and Groq. Products that process real data, serve real users, and demonstrate measurable ROI.

07. AI-SOC Platform
CGW's flagship enterprise security operations platform - integrating AI-powered CCTV surveillance, incident management, visitor control, guard force management, and real-time threat alerting into one intelligent command interface.

08. Security Intelligence Consulting
Enterprise security strategy, SOP development, risk management frameworks, and guard force governance - drawing on 25+ years of Pakistan Army, military intelligence, and UN peacekeeping operational experience.

09. Predictive Analytics & Intelligence
Business intelligence platforms and predictive modelling for enterprise clients - turning operational data into actionable forecasts via BI dashboards, forecasting, and ERP integration. Built for decision-makers who need intelligence, not just dashboards.

10. POS Systems
Point-of-sale systems for retail and hospitality, built on the AI POS App platform: role-based access for Admin, Manager, Cashier and Inventory Staff, live sales and inventory tracking, and AI-driven business insights on top.

11. SaaS Products
Subscription-based software products built and operated end-to-end - multi-tenant architecture, billing and role management, dashboards and analytics, deployed and maintained for ongoing use.

== PORTFOLIO (13 projects) ==

1. AI POS App (2026) - Full-Stack SaaS / AI
Intelligent retail management ecosystem combining secure RBAC with AI-driven business intelligence. Features Admin/Manager/Cashier/Inventory Staff role gatekeeper, executive analytics command centre with 20+ AI insight modules, real-time financial metrics (automated basket sizes, inventory forecasting, cash flow engines, credit risk analysis), high-fidelity dark-mode UI. Tags: Full-Stack, AI-Powered, RBAC, Claude AI, SaaS.

2. Mama's Cookies (2026) - E-Commerce / Brand Storefront
Direct-to-consumer storefront for a premium small-batch cookie brand serving Rawalpindi and Islamabad. Filterable catalogue (Originals, Specials, Premium) with search and sort, live cart and checkout in PKR, same-day delivery and pickup with a daily cut-off across DHA Phase 2, nationwide courier shipping, corporate gifting, events and catering enquiries, and direct WhatsApp ordering. Mobile-first and fast. Tags: E-Commerce, Storefront, Cart & Checkout, Responsive, Brand Design, Food & Beverage.

3. API Response Monitor (2026) - C# / .NET 8 / DevOps
.NET 8 console application monitoring API endpoint health. Reads endpoints.json, sends parallel async HTTP GET requests, classifies each as UP/DOWN/SLOW (threshold 1000ms). Logs to CSV with timestamps, colour-coded live console table, GitHub Actions scheduled runs with CSV artifact export. Tags: C#, .NET 8, GitHub Actions, DevOps, Async.

4. POS Point of Sale (2026) - Desktop App / Retail SaaS
Counter point-of-sale for a phone and accessories shop. Instant product search by name, code or barcode with a live Current Bill panel; dashboard with today's sales, invoice count, low-stock alerts, hourly sales curve, category split and top products; invoice history with customer totals, six-month volume chart and custom date-range statements; catalogue with codes, barcodes, prices and stock top-ups; reports by day, week, month or year exportable to Excel. Tags: Desktop App, Point of Sale, Inventory, Invoicing, Reporting.

5. CGW Enterprise Suite (2026) - Desktop ERP / HRMS
Enterprise resource planning suite covering 66 modules across an entire organisation, each department behind its own sign-in. HR runs the full employee lifecycle with an executive dashboard, headcount and attrition analytics, hiring funnel and an AI flight-risk watchlist, plus ATS, interviews, onboarding, attendance, leave, payroll and benefits. Sales covers master data, planning, leads, quotations, orders, approvals, fulfilment and delivery with a revenue dashboard. Finance carries double-entry GL, trial balance, P&L, AR/AP, fixed assets and GST/WHT tax; supply chain tracks POs, LCs and containers through Karachi Port. Tags: Desktop App, ERP, HRMS, CRM, Finance.

6. PaperHug (2026) - E-Commerce / Handmade Brand
Boutique storefront for a maker selling handmade pieces in small batches. Full-bleed brand hero, shop listing, product pages with photography and PKR pricing, a working cart with quantity steppers, order summary and checkout, a gallery of finished work, a story page and a contact route for custom orders. Static, fast and styled in soft pinks and greens. Tags: E-Commerce, Storefront, Cart & Checkout, Brand Design, Responsive.

7. Unity Drift Racer (2026) - Unity / 3D Game Development
3D drift racing game built in Unity 6 around a custom CarController over Unity's wheel collider system: four wheel colliders bound to visual meshes, a 1200 kg rigidbody with interpolated motion and tuned centre of mass. Handling exposed as dials - motor torque, brake torque, max steer angle, top speed, steer smoothing - plus a separate drift model with grip assist, drift stability and max drift yaw rate, and a DriftEffects script for tyre marks, particle spray and audio. Gameplay video on the Our Work page. Tags: Unity, C#, 3D Game, Vehicle Physics, Drift Model.

8. Wave Shooter (2026) - Python / Pygame
Wave-based arcade space shooter written from scratch in Python with Pygame. Escalating enemy waves announced on screen, live score, persistent high score, remaining lives as ship icons, and a recharging dash meter the player spends to escape a crowded screen. Hand-drawn pixel art enemies and projectiles over a parallax starfield, with collision detection, spawn timing and wave pacing written against the Pygame game loop. Gameplay video on the Our Work page. Tags: Python, Pygame, 2D Game, Arcade, Pixel Art.

9. C++ Text Editor (2026) - Systems Programming / C++
Memory-efficient text editor built from scratch without STL containers. Custom gap buffer for O(1) insert/delete, manual linked-list stack for unlimited undo/redo, dynamic arrays with auto-resizing, Vim-inspired modal editing (Normal/Insert modes). Showcase of low-level systems programming. Tags: C++, Gap Buffer, Data Structures, Modal Editing.

10. Java Fighting Game (2026) - Java / Game Development (gameplay video on the Our Work page)
2D fighting game inspired by Street Fighter and Tekken, built with Java and Swing. Two human-controlled characters, pixel-art samurai sprites, hand-painted open-field battlefield background, attack animations, pause screen. Custom game loop. Work in progress with solid fighting system foundation. Tags: Java, Swing, 2D Game, Pixel Art.

11. Nmap Network Mapping (2026) - Cybersecurity / Network Reconnaissance
Full-range (0-65535) stealth SYN port scan via Nmap 7.98. Catalogued 53,398 closed and 12,115 filtered TCP ports, revealed 20+ active services: FTP (21), SSH (22), Telnet (23), SMTP (25), HTTP (80), MySQL (3306), PostgreSQL (5432), VNC (5900), X11 (6000), IRC (6667). Legacy vulnerability vectors mapped. 2,511-second automated scanning cycle. Tags: Nmap, Port Scanning, SYN Stealth, Network Recon.

12. OpenVAS Vulnerability Dashboard (2026) - Cybersecurity / Vulnerability Management
Greenbone OS 24.10.9 deployment. Tracks 170,109 continuous Network Vulnerability Tests. Findings: 33,127 Critical, 66,602 High, 61,219 Medium. CVE timeline charts (1990-2025), task-based scanning workflows, real-time status tracking. Tags: OpenVAS, Greenbone, CVE, Risk Management.

13. Sn1per Footprinting (2026) - Cybersecurity / Automated Reconnaissance
Automated reconnaissance pipeline via Sn1per v9.2. Host pinging, DNS information gathering, subdomain hijacking checks. Integrated Nmap TCP scan revealed 20+ open services including critical admin remote shell ports: exec (512), login (513), shell (514), plus FTP, SSH, Telnet, MySQL, PostgreSQL, VNC. Reconnaissance loot saved to structured workspace. Tags: Sn1per, Automated Recon, DNS Enumeration, Subdomain Hijacking, Pentest.

== PRICING / ENGAGEMENT MODELS ==
Sprint: from $15,000 (2-4 weeks) - focused time-boxed engagement for a specific problem: new feature, design audit, landing page.
Project: from $45,000 (4-6 weeks) - full product design engagement from discovery through delivery. Most popular option.
Retainer: from $8,000/month (ongoing) - monthly senior team time allocation for teams needing a senior design partner on-call: ongoing feature work, design reviews, system evolution.

== PROCESS (4 phases) ==
01. Discover (1 week) - stakeholder interviews, competitive audit, user research. Build shared understanding before touching any tool.
02. Define (1 week) - strategy brief, information architecture, creative direction. Align on north star, explicit agreement before design begins.
03. Design (3 weeks) - iterative design and prototyping in weekly cycles. Live Figma, recorded reviews, async feedback loops.
04. Deliver (1 week) - handoff-ready specs, design system documentation, engineering support, QA review at launch.
Total: 6 weeks. Never disappear for weeks with a big reveal - work shared continuously.

== CAREERS ==
CGW is hiring people obsessed with craft - designers, engineers, thinkers who push every pixel and line of code until exactly right.

Why join CGW:
• Ship Fast - no six-month projects that go nowhere. Move quickly, iterate, launch.
• Real Ownership - interns and juniors own actual features. No busywork.
• Learn by Doing - pair with senior engineers and designers on client work from day one.
• Remote-First - work from anywhere, async by default, sync when it matters.
• Craft Culture - quality matters deeply, details are taken seriously.
• Grow Fast - strong performers move up, internships often lead to full-time offers.

How to apply: Fill the application form on the Careers page or email cgwofficialai@gmail.com with: which role you're applying for, a short note about why CGW, your portfolio or GitHub (optional). CGW replies to every application within 5 business days.

== CONTACT ==
Email: cgwofficialai@gmail.com
Location: Fully remote - no physical office, team works from anywhere with clients worldwide
Response time: every serious enquiry within 48 hours
Project intake: 3-4 new projects per year
To start a project: email with project description, budget range, and preferred timing.

== WEBSITE NAVIGATION ==
Home page - main landing page, hero "Build The Future", services overview, stats
Our CEO page - full bio, career timeline, philosophy pillars, KPI stats
Team page - the team members, culture & values section
Service page - all 11 services with descriptions, the 4-phase process, and pricing/engagement models
Our Work page - all 13 portfolio projects, each opening a detail view with images you can step through
Careers page - open positions, why join CGW values, application form
Contact page - contact form, company details, email

== YOUR BEHAVIOUR ==
• You are ARIA - warm, concise, knowledgeable, and professional
• Answer any question about CGW, the team, services, projects, CEO, pricing, process, careers, or contact using the knowledge above
• If asked what page to visit → direct them to the correct page name above
• If asked about starting a project → collect name, email, project brief; point them to the Contact page or cgwofficialai@gmail.com
• If asked about jobs → point them to the Careers page or cgwofficialai@gmail.com
• Never invent prices, timelines, or promises beyond what is listed above
• Keep replies concise - 2-4 sentences for simple questions, structured lists for comparisons
• Detect the user's language and reply in the same language
• Never use emoji or decorative symbols - plain text only
• Never use em dashes or en dashes. Use a comma, a full stop, or a plain hyphen instead
• Never write file names, URLs or links of any kind - no "service.html", no "(our-work.html)", no "visit https://…". Refer to pages by name only: the Home page, the Our CEO page, the Team page, the Service page, the Our Work page, the Careers page, the Contact page. The visitor navigates with the menu, not with file names.`;

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
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'your_openrouter_key_here') throw new Error('no-openrouter-key');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://cgw-ai.com',
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

// ── 2. Groq - FREE, no credit card (console.groq.com) ────────────
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

// ── 3. Gemini - FREE (aistudio.google.com) ───────────────────────
// Google retires model names regularly (gemini-1.5-flash now 404s), so the
// model is configurable and we walk a fallback list when one is gone or busy.
// Note: the "thinking" models spend most of a small token budget on thoughts
// and return an empty answer - the -lite models below do not think, so they
// answer directly.
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
].filter(Boolean);

async function callGemini(messages, maxTokens = 200) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_free_gemini_key_here') throw new Error('no-gemini-key');
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: Math.max(maxTokens, 600), temperature: 0.7 }
  });

  let lastErr = 'gemini-unavailable';
  for (const model of GEMINI_MODELS) {
    let res;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
    } catch (e) {
      lastErr = 'gemini-network: ' + e.message;
      continue;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      lastErr = `gemini-${res.status} (${model}): ${(err.error && err.error.message) || ''}`.slice(0, 140);
      // a bad key or malformed request will fail on every model - stop early
      if (res.status === 400 || res.status === 401 || res.status === 403) break;
      continue;   // 404 retired / 429 quota / 5xx busy → try the next model
    }
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text).join('').trim();
    if (text) return text;
    lastErr = 'gemini-empty (' + model + ')';
  }
  throw new Error(lastErr);
}

// ── MAIN: think() - call this from any agent ─────────────────────
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
  // Try all AI providers in order: OpenRouter → OpenAI → Groq → Gemini → smart fallback
  try {
    reply = await callOpenRouter(recentMessages, maxTokens);
    console.log('[brain] ✓ OpenRouter');
  } catch (e0) {
    console.warn('[brain] OpenRouter:', e0.message);
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
          console.warn('[brain] Gemini:', e3.message, ' - using smart fallback');
          reply = getFallbackReply(userMessage);
        }
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
  { keys: ['hello','hi','hey','howdy','good morning','good afternoon','good evening','salaam','salam','assalam'],
    reply: "Hello! I'm ARIA, CGW's AI assistant. I can answer questions about our services, portfolio, team, CEO, pricing, careers, or how to get in touch. What can I help you with?" },

  { keys: ['who are you','what are you','your name','introduce yourself','aria'],
    reply: "I'm ARIA, the AI assistant for CGW - Cognitive Guardian Work. I have full knowledge of the website, team, services, and portfolio. How can I help?" },

  { keys: ['what is cgw','what is techno','about cgw','about techno','about the company','who are cgw','cognitive guardian'],
    reply: "CGW - Cognitive Guardian Work is a senior technology studio founded in 2026. A small, entirely senior team delivering AI applications, full-stack web platforms, cybersecurity assessments, game development and intelligent digital products for clients worldwide.\n\nFully remote, no juniors, no account managers - just makers. Email: cgwofficialai@gmail.com" },

  { keys: ['service','offer','what do you do','capability','speciali','help with','build'],
    reply: "CGW offers 11 services:\n\n1. Full Stack Development - React, Next.js, Node.js, PostgreSQL - complete web apps\n2. AI Chatbot & Automation - custom AI chatbots for websites & WhatsApp\n3. Python Scripts & Bots - automation, scrapers, desktop apps, API integrations\n4. 2D Game Development - Pygame, JavaFX, MonoGame - full source code\n5. Penetration Testing & Security - OWASP Top 10 assessments with full reports\n6. AI Product Development - RAG pipelines and custom LLM integrations\n7. AI-SOC Platform - AI CCTV, incident management, guard force, live alerting\n8. Security Intelligence Consulting - strategy, SOPs, risk frameworks\n9. Predictive Analytics & Intelligence - BI dashboards, forecasting, ERP integration\n10. POS Systems - role-based retail POS with AI business insights\n11. SaaS Products - multi-tenant subscription products, built and operated\n\nVisit the Service page for full details. Which area interests you?" },

  { keys: ['price','cost','budget','how much','rate','fee','charge','quote','afford','pricing','expensive','package'],
    reply: "CGW engagement models:\n\n• Sprint - from $15,000 (2-4 weeks) - focused single-problem engagement\n• Project - from $45,000 (4-6 weeks) - full engagement from discovery to delivery. Most popular\n• Retainer - from $8,000/month - ongoing studio time for teams needing a senior partner on-call\n\nEvery project is scoped individually. Email cgwofficialai@gmail.com with your brief and budget range." },

  { keys: ['ceo','founder','shahzad','sarwar','lt col','who started','who founded','who runs','who is the boss','leadership','muhammad shahzad'],
    reply: "CGW was founded by Lt Col (R) Muhammad Shahzad Sarwar - a Military Intelligence Veteran and Corporate Leader with 25+ years in security, intelligence, administration, logistics, investigations and risk management.\n\nFormer Pakistan Army officer and United Nations peacekeeper (awarded the UN Medal). Holds an MS in Business Administration and an MA in Criminology.\n\nTrack record: PKR 56M+ recovered through investigations, PKR 300M+ annual budgets managed, 4,300+ sites and personnel governed.\n\nFull bio on the Our CEO page." },

  { keys: ['team','staff','people','members','who work','employees','engineers','rehan','usman','moiz','faisal','cto'],
    reply: "The CGW team - small, senior, fully hands-on:\n\n• Rehan Shahzad - CTO: Python, Flask, JavaScript, RAG systems, AI-powered apps\n• Abdul Moiz - Cybersecurity Engineer: penetration testing, bug bounty, API and network security\n• Rana Faisal Mustafa - Game & App Developer: Python, Java, C#, C++, 2D games and cross-platform apps\n\nNo juniors, no account managers - each member owns their domain end to end. See the Team page for full profiles." },

  { keys: ['portfolio','work','project','case stud','example','past work','what have you built','our work'],
    reply: "CGW's portfolio (13 projects - the Our Work page has them all):\n\n• AI POS App - Full-Stack SaaS with RBAC & 20+ AI modules\n• CGW Enterprise Suite - desktop ERP/HRMS spanning 66 modules\n• POS Point of Sale - counter POS with billing, stock and reports\n• Mama's Cookies - cookie brand storefront with cart and delivery\n• PaperHug - handmade brand storefront with cart and checkout\n• Unity Drift Racer - Unity 6 drift racing with a tuned car model\n• Wave Shooter - Pygame arcade shooter with waves and a dash meter\n• Java Fighting Game - 2D samurai fighter with a custom game loop\n• API Response Monitor - .NET 8 health monitoring with GitHub Actions\n• C++ Text Editor - gap buffer editor built without STL\n• Nmap Network Mapping - full-range stealth SYN scan\n• OpenVAS Dashboard - 170,109 vulnerability tests tracked\n• Sn1per Footprinting - automated reconnaissance pipeline\n\nThe three game projects have gameplay videos you can play on the Our Work page.\n\nWhich project would you like to hear about?" },

  { keys: ['ai pos','pos app','point of sale','retail'],
    reply: "AI POS App (2026) - our flagship SaaS project. Intelligent retail management with RBAC (Admin, Manager, Cashier, Inventory Staff roles), executive AI analytics dashboard with 20+ modules (basket sizes, inventory forecasting, cash flow, credit risk), real-time financial metrics, and dark-mode UI built for fast-paced retail. Uses Claude AI." },

  { keys: ['api monitor','api response','net 8','dotnet'],
    reply: "API Response Monitor (2026) - C# .NET 8 console app. Reads endpoints.json, fires parallel async GET requests, classifies each as UP/DOWN/SLOW (1000ms threshold), logs all results to CSV with timestamps, colour-coded live console display, GitHub Actions scheduled runs with CSV artifact export." },

  { keys: ['text editor','c++ editor','gap buffer'],
    reply: "C++ Text Editor (2026) - built from scratch without any STL containers. Custom gap buffer for O(1) insert/delete (vs O(n) naive), manual linked-list stack for unlimited undo/redo, dynamic arrays with auto-resizing, Vim-inspired Normal/Insert modal interface. A systems programming showcase." },

  { keys: ['fighting game','java game','street fighter','tekken'],
    reply: "Java Fighting Game (2026) - 2D fighter inspired by Street Fighter and Tekken, built with Java and Swing. Two local human-controlled characters, pixel-art samurai sprites, hand-painted battlefield background, attack animations, pause screen, custom game loop." },

  { keys: ['nmap','network mapping','port scan','port scanning'],
    reply: "Nmap Network Mapping (2026) - full-range (0-65535) stealth SYN scan via Nmap 7.98. Found 53,398 closed and 12,115 filtered TCP ports, revealed 20+ active services: FTP(21), SSH(22), Telnet(23), SMTP(25), HTTP(80), MySQL(3306), PostgreSQL(5432), VNC(5900), X11(6000), IRC(6667). 2,511-second automated cycle, results exported to structured report." },

  { keys: ['openvas','vulnerability scan','greenbone','cve'],
    reply: "OpenVAS Dashboard (2026) - Greenbone OS 24.10.9. Tracks 170,109 continuous Network Vulnerability Tests. Results: 33,127 Critical · 66,602 High · 61,219 Medium. CVE timeline charts (1990-2025), task-based scanning workflows, real-time status tracking." },

  { keys: ['sn1per','footprint','recon','subdomain'],
    reply: "Sn1per Footprinting (2026) - automated recon via Sn1per v9.2. Combined host pinging, DNS gathering, subdomain hijacking checks. Integrated Nmap revealed 20+ services including critical admin shell ports: exec(512), login(513), shell(514), plus FTP, SSH, Telnet, MySQL, PostgreSQL, VNC. All loot saved to structured workspace." },

  { keys: ['process','how does it work','how do you work','approach','methodology','steps','phases','workflow'],
    reply: "CGW's 4-phase process:\n\n1. Discover (1 wk) - stakeholder interviews, competitive audit, user research\n2. Define (1 wk) - strategy brief, information architecture, creative direction\n3. Design (3 wks) - iterative cycles, live Figma, async feedback, recorded reviews\n4. Deliver (1 wk) - handoff specs, design system docs, engineering support & QA\n\nTotal: 6 weeks. Work shared continuously - no big-reveal surprises." },

  { keys: ['timeline','how long','duration','weeks','months','turnaround','deadline','delivery'],
    reply: "Most projects: 6 weeks from kickoff to delivery - Discover (1), Define (1), Design (3), Deliver (1). Sprint engagements: 2-4 weeks. Clear milestones set throughout - no disappearing acts." },

  { keys: ['book','call','meeting','schedule','discovery','appointment','consult','start a project','get started'],
    reply: "To start a project with CGW, email cgwofficialai@gmail.com with:\n• Brief description of your project\n• Your budget range\n• Preferred timing\n\nWe reply within 48 hours. We take on 3-4 new projects per year - or use the form on the Contact page." },

  { keys: ['contact','email','reach','get in touch','talk','message','enquiry'],
    reply: "Email: cgwofficialai@gmail.com\nFully remote - we partner with clients worldwide\n\nWe reply to every serious enquiry within 48 hours. Or use the form on the Contact page to send a message directly." },

  { keys: ['career','job','hire','hiring','role','join','apply','opening','work for','internship','vacancy'],
    reply: "CGW is hiring people obsessed with craft! Visit the Careers page to see open positions and apply.\n\nWhy join us: Ship Fast · Real Ownership · Learn by Doing · Remote-First · Craft Culture · Grow Fast\n\nTo apply: email cgwofficialai@gmail.com with your role interest, a short note about why CGW, and your portfolio/GitHub. We reply within 5 business days." },

  { keys: ['chatbot','whatsapp','ai agent','openai','gemini','claude','automation','bot'],
    reply: "CGW builds custom AI chatbots for websites and WhatsApp - automating customer support, lead generation, appointment booking, and business workflows. We integrate OpenAI, Gemini, and Claude, build custom conversation flows, connect CRMs and databases, support multiple languages, and deliver full source code. Like this chatbot you're talking to right now!" },

  { keys: ['python','script','scraper','flask','automation','desktop app'],
    reply: "CGW's Python Scripts & Bots service: automation scripts, API integrations, web scrapers, bots, desktop applications, and database-connected tools. Professional development practices, clean maintainable source code, fast communication throughout the project." },

  { keys: ['game','pygame','unity','javafx','monogame','2d game','game dev'],
    reply: "CGW builds custom 2D games with Python (Pygame), Java (JavaFX), or C# (MonoGame). Smooth gameplay, animations, collision detection, polished mechanics. From platformers and arcade games to fighting games. Full clean OOP source code handoff on every project." },

  { keys: ['security','pentest','penetration','owasp','sql injection','xss','bug bounty','hacking','cyber'],
    reply: "CGW's Penetration Testing & Security service: professional assessments for websites, web apps, and servers. OWASP Top 10 coverage - SQL Injection, XSS, CSRF, IDOR, authentication flaws, misconfigurations. You get a detailed report: vulnerabilities found, remediation steps, hardening recommendations. Our cybersecurity engineer Abdul Moiz leads all security work." },

  { keys: ['full stack','fullstack','react','next.js','node','postgresql','web app','web application','web dev'],
    reply: "CGW's Full Stack Development: complete web applications with responsive frontends, robust backends, and scalable databases. Stack: React, Next.js, Node.js, PostgreSQL. Clean APIs, secure authentication, production deployment. From MVPs to enterprise platforms - we own the entire build." },

  { keys: ['location','where','office','address','based'],
    reply: "CGW is fully remote - no physical office. The team works from anywhere and partners with clients worldwide, async by default, sync when it matters." },

  { keys: ['page','website','navigate','where can i find','which page'],
    reply: "CGW website pages:\n• Home - hero, services overview, our work\n• Our CEO - founder bio, career timeline, philosophy\n• Team - the people and how we work\n• Service - all services, process, engagement models\n• Our Work - the full portfolio\n• Careers - open roles and the application form\n• Contact - the enquiry form and email\n\nWhich page can I help you with?" },

  { keys: ['thanks','thank you','cheers','great','awesome','perfect','helpful','appreciate','shukria','shukriya'],
    reply: "Happy to help! Is there anything else you'd like to know about CGW, our services, team, or how to get started?" },

  { keys: ['bye','goodbye','see you','later','farewell','take care','khuda hafiz'],
    reply: "Take care! Whenever you're ready to build something exceptional, cgwofficialai@gmail.com is the place to start." },
];

function getFallbackReply(text) {
  const t = text.toLowerCase();
  for (const rule of SMART_RULES) {
    if (rule.keys.some(k => t.includes(k))) return rule.reply;
  }
  // Default
  return "Thanks for your message! For project enquiries, email cgwofficialai@gmail.com and we'll respond within one business day. I can also answer questions about our services, team, portfolio, and pricing - just ask!";
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
