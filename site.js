/* ============================================================
   TECHNO — shared site interactions (all pages)
   ============================================================ */

/* ---------- Scroll reveal ---------- */
// Signal JS is available — reveal CSS only hides elements when this class is present
document.documentElement.classList.add('js');

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- Neon typing button ---------- */
function wireTypingButton(btn) {
  const label = btn.querySelector('.neon-btn__label');
  const full = (btn.dataset.text || label.textContent).trim();
  let timer = null;

  const textNode = document.createElement('span');
  textNode.textContent = full;
  const caret = document.createElement('span');
  caret.className = 'neon-btn__caret';
  label.textContent = '';
  label.append(textNode, caret);

  btn.addEventListener('mouseenter', () => {
    btn.classList.add('is-typing');
    let i = 0;
    textNode.textContent = '';
    clearInterval(timer);
    timer = setInterval(() => {
      i++;
      textNode.textContent = full.slice(0, i);
      if (i >= full.length) clearInterval(timer);
    }, 55);
  });
  btn.addEventListener('mouseleave', () => {
    clearInterval(timer);
    btn.classList.remove('is-typing');
    textNode.textContent = full;
  });
}
document.querySelectorAll('.neon-btn').forEach(wireTypingButton);

/* ---------- Mobile nav drawer ---------- */
(function () {
  const burger = document.querySelector('.nav__burger');
  const drawer = document.querySelector('.mnav');
  if (!burger || !drawer) return;
  function toggle(open) {
    drawer.classList.toggle('open', open);
    burger.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => toggle(!drawer.classList.contains('open')));
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));
})();

/* ---------- Contact form — AI auto-reply + real email ---------- */
(function () {
  const form = document.querySelector(‘.form’);
  if (!form) return;
  const msgEl = form.querySelector(‘.form-msg’);
  const submitBtn = form.querySelector(‘button[type="submit"]’);

  // ── Read credentials saved from admin Settings panel ──────────
  function getCfg() {
    return {
      geminiKey:  localStorage.getItem(‘autoreply_gemini_key’)  || ‘’,
      ejsPubKey:  localStorage.getItem(‘autoreply_ejs_pub’)     || ‘’,
      ejsService: localStorage.getItem(‘autoreply_ejs_service’) || ‘’,
      tplNotify:  localStorage.getItem(‘autoreply_tpl_notify’)  || ‘’,
      tplReply:   localStorage.getItem(‘autoreply_tpl_reply’)   || ‘’,
    };
  }

  // ── Gemini: generate AI reply text ────────────────────────────
  async function geminiReply(name, message, budget, geminiKey) {
    const prompt =
      `You are the professional assistant at TECHNO Studio, a premium product design agency in Lisbon, Portugal.\n` +
      `Write a warm, professional email reply to this website enquiry.\n\n` +
      `Sender: ${name}\nBudget: ${budget || ‘not specified’}\nMessage: ${message}\n\n` +
      `Instructions:\n` +
      `- Thank them by first name\n` +
      `- Show genuine interest in their project\n` +
      `- Say the team will follow up within 48 hours with next steps\n` +
      `- Keep it concise (3 short paragraphs)\n` +
      `- Sign off as "The TECHNO Studio Team"\n\n` +
      `Write only the email body — no subject line, no extra commentary.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: ‘POST’,
        headers: { ‘Content-Type’: ‘application/json’ },
        body: JSON.stringify({
          contents: [{ role: ‘user’, parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      }
    );
    if (!res.ok) throw new Error(‘gemini-’ + res.status);
    const d = await res.json();
    return d.candidates?.[0]?.content?.parts?.map(p => p.text).join(‘’) || ‘’;
  }

  // ── Fallback reply if Gemini/EmailJS not configured ───────────
  function fallbackReply(name) {
    return `Hi ${name},\n\nThank you for reaching out to TECHNO Studio! We have received your message and really appreciate your interest in working with us.\n\nOur team will review your enquiry and get back to you within 48 hours with more details on how we can bring your project to life.\n\nWarm regards,\nThe TECHNO Studio Team\nstudio@techno.dev`;
  }

  form.addEventListener(‘submit’, async (e) => {
    e.preventDefault();
    const data = {
      name:    form.querySelector(‘#name’)?.value.trim()    || ‘’,
      email:   form.querySelector(‘#email’)?.value.trim()   || ‘’,
      budget:  form.querySelector(‘#budget’)?.value.trim()  || ‘’,
      message: form.querySelector(‘#message’)?.value.trim() || ‘’,
    };
    if (!data.name || !data.email || !data.message) return;

    // UI: loading state
    if (submitBtn) submitBtn.disabled = true;
    if (msgEl) { msgEl.textContent = ‘Sending…’; msgEl.style.color = ‘’; }

    // Save to admin messages store
    try {
      const MSG_KEY = ‘techno_messages’;
      const entry = {
        id: ‘M’ + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        ...data, sentAt: new Date().toISOString(), read: false,
      };
      const list = JSON.parse(localStorage.getItem(MSG_KEY) || ‘[]’);
      list.unshift(entry);
      localStorage.setItem(MSG_KEY, JSON.stringify(list));
    } catch (_) {}

    // Save lead
    if (window.TechnoStore) { try { await window.TechnoStore.saveLead(‘contact’, data); } catch (_) {} }

    const cfg = getCfg();
    const hasEmailJS = cfg.ejsPubKey && cfg.ejsService && cfg.tplNotify && cfg.tplReply;
    const hasGemini  = !!cfg.geminiKey;

    let replyText = fallbackReply(data.name);
    let aiUsed = false;

    // Step 1: generate AI reply
    if (hasGemini) {
      try {
        const generated = await geminiReply(data.name, data.message, data.budget, cfg.geminiKey);
        if (generated) { replyText = generated; aiUsed = true; }
      } catch (_) {}
    }

    // Step 2: send emails via EmailJS
    if (hasEmailJS && window.emailjs) {
      try {
        emailjs.init({ publicKey: cfg.ejsPubKey });

        // a) Notify rehan
        await emailjs.send(cfg.ejsService, cfg.tplNotify, {
          from_name:  data.name,
          from_email: data.email,
          budget:     data.budget || ‘Not specified’,
          message:    data.message,
          to_email:   ‘rehanshahzad6018@gmail.com’,
        });

        // b) AI reply to visitor
        await emailjs.send(cfg.ejsService, cfg.tplReply, {
          to_name:    data.name,
          to_email:   data.email,
          reply_body: replyText,
        });

        if (msgEl) {
          msgEl.style.color = ‘#4ade80’;
          msgEl.textContent = aiUsed
            ? ‘✓ Message sent! We just emailed you an AI-generated reply — check your inbox.’
            : ‘✓ Message sent! We\’ll be in touch within 48 hours.’;
        }
      } catch (err) {
        if (msgEl) { msgEl.style.color = ‘’; msgEl.textContent = ‘✓ Message received — we\’ll be in touch within 48 hours.’; }
      }
    } else {
      // EmailJS not set up yet — just confirm
      if (msgEl) { msgEl.style.color = ‘’; msgEl.textContent = ‘✓ Message received — we\’ll be in touch within 48 hours.’; }
    }

    form.reset();
    if (submitBtn) submitBtn.disabled = false;
  });
})();
