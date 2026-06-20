/* ============================================================
   TECHNO — Floating Chat Widget
   Supports: Live AI Chat  +  Email enquiry mode
   Drop this script on any page — it self-injects CSS + HTML.
   ============================================================ */
(function () {
  'use strict';

  /* ── Skip on admin page ── */
  if (location.pathname.includes('admin')) return;

  /* ── Session ID (persisted per browser) ── */
  const SESSION_KEY = 'tchat_session';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'web_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  /* ── Inject CSS ── */
  const css = `
  #tchat-btn {
    position: fixed; bottom: 28px; right: 28px; z-index: 9000;
    width: 58px; height: 58px; border-radius: 50%;
    background: #171e19;
    border: 1.5px solid rgba(168,85,247,0.5);
    box-shadow: 0 0 22px rgba(168,85,247,0.35), 0 4px 20px rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: box-shadow 0.35s, transform 0.25s;
  }
  #tchat-btn:hover {
    box-shadow: 0 0 38px rgba(168,85,247,0.6), 0 4px 24px rgba(0,0,0,0.6);
    transform: scale(1.07);
  }
  #tchat-btn svg { transition: opacity 0.2s; }
  #tchat-btn .tchat-notif {
    position: absolute; top: 5px; right: 5px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #a855f7; border: 2px solid #171e19;
    animation: tchat-pulse 2s infinite;
    display: none;
  }
  @keyframes tchat-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.6); }
    50%       { box-shadow: 0 0 0 6px rgba(168,85,247,0); }
  }

  #tchat-panel {
    position: fixed; bottom: 100px; right: 28px; z-index: 9001;
    width: 360px; max-height: 560px;
    background: #171e19;
    border: 1px solid rgba(168,85,247,0.3);
    border-radius: 18px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(168,85,247,0.12);
    display: flex; flex-direction: column;
    overflow: hidden;
    transform: scale(0.92) translateY(16px); opacity: 0; pointer-events: none;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s;
  }
  #tchat-panel.open {
    transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
  }
  @media (max-width: 420px) {
    #tchat-panel { width: calc(100vw - 16px); right: 8px; bottom: 90px; }
    #tchat-btn   { bottom: 18px; right: 18px; }
  }

  /* Header */
  .tchat-header {
    padding: 16px 18px 14px;
    border-bottom: 1px solid rgba(183,198,194,0.1);
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.02);
  }
  .tchat-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #7e22ce, #a855f7);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
    box-shadow: 0 0 14px rgba(168,85,247,0.45);
  }
  .tchat-header-info { flex: 1; }
  .tchat-header-name {
    font-family: Arial, sans-serif;
    text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 15px; color: #fff; line-height: 1;
  }
  .tchat-header-sub {
    font-size: 11px; color: rgba(183,198,194,0.55);
    letter-spacing: 0.04em; margin-top: 3px; display: flex; align-items: center; gap: 5px;
  }
  .tchat-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80; box-shadow: 0 0 8px #4ade80;
    display: inline-block; flex-shrink: 0;
  }
  .tchat-close {
    background: none; border: none; color: rgba(183,198,194,0.45);
    cursor: pointer; padding: 4px; border-radius: 6px;
    line-height: 0; transition: color 0.2s;
  }
  .tchat-close:hover { color: #fff; }

  /* Tabs */
  .tchat-tabs {
    display: flex; padding: 10px 14px 0;
    border-bottom: 1px solid rgba(183,198,194,0.08);
    gap: 4px;
  }
  .tchat-tab {
    flex: 1; padding: 8px 0; font-size: 12px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    border: none; background: none; cursor: pointer;
    color: rgba(183,198,194,0.45);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.25s, border-color 0.25s;
    font-family: inherit;
  }
  .tchat-tab.active { color: #c084fc; border-bottom-color: #a855f7; }

  /* Messages */
  .tchat-messages {
    flex: 1; min-height: 0; overflow-y: auto; padding: 16px 14px;
    display: flex; flex-direction: column; gap: 10px;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  }
  .tchat-messages::-webkit-scrollbar { width: 8px; }
  .tchat-messages::-webkit-scrollbar-track { background: transparent; }
  .tchat-messages::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 4px; }
  .tchat-messages::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.65); }

  .tchat-msg { display: flex; flex-direction: column; max-width: 82%; }
  .tchat-msg.user { align-self: flex-end; align-items: flex-end; }
  .tchat-msg.ai   { align-self: flex-start; align-items: flex-start; }

  .tchat-bubble {
    padding: 10px 14px; border-radius: 14px;
    font-size: 13.5px; line-height: 1.55; font-family: inherit;
  }
  .tchat-msg.user .tchat-bubble {
    background: rgba(168,85,247,0.22); color: #e8d5ff;
    border: 1px solid rgba(168,85,247,0.35);
    border-bottom-right-radius: 4px;
  }
  .tchat-msg.ai .tchat-bubble {
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.88);
    border: 1px solid rgba(183,198,194,0.12);
    border-bottom-left-radius: 4px;
  }
  .tchat-time {
    font-size: 10px; color: rgba(183,198,194,0.35);
    margin-top: 4px; letter-spacing: 0.04em;
  }

  /* Typing indicator */
  .tchat-typing .tchat-bubble {
    padding: 12px 16px;
    display: flex; gap: 4px; align-items: center;
  }
  .tchat-typing .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(168,85,247,0.6);
    animation: tchat-bounce 1.2s infinite;
  }
  .tchat-typing .dot:nth-child(2) { animation-delay: 0.2s; }
  .tchat-typing .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes tchat-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30%            { transform: translateY(-5px); opacity: 1; }
  }

  /* Input row */
  .tchat-input-row {
    padding: 12px 14px;
    border-top: 1px solid rgba(183,198,194,0.08);
    display: flex; gap: 8px; align-items: flex-end;
    background: rgba(255,255,255,0.02);
  }
  .tchat-input {
    flex: 1; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(183,198,194,0.15); border-radius: 10px;
    color: #fff; font-family: inherit; font-size: 13.5px;
    padding: 9px 12px; resize: none; min-height: 38px; max-height: 100px;
    line-height: 1.45; outline: none;
    transition: border-color 0.25s;
  }
  .tchat-input::placeholder { color: rgba(183,198,194,0.35); }
  .tchat-input:focus { border-color: rgba(168,85,247,0.5); }
  .tchat-send {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: rgba(168,85,247,0.2); border: 1px solid rgba(168,85,247,0.4);
    color: #c084fc; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.25s, box-shadow 0.25s; line-height: 0;
  }
  .tchat-send:hover { background: rgba(168,85,247,0.35); box-shadow: 0 0 14px rgba(168,85,247,0.4); }
  .tchat-send:disabled { opacity: 0.4; cursor: default; }

  /* Email tab */
  .tchat-email-form { padding: 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; }
  .tchat-field { display: flex; flex-direction: column; gap: 5px; }
  .tchat-field label { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(183,198,194,0.5); }
  .tchat-field input, .tchat-field textarea, .tchat-field select {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(183,198,194,0.15);
    border-radius: 8px; color: #fff; font-family: inherit;
    font-size: 13px; padding: 9px 11px; outline: none;
    transition: border-color 0.25s;
  }
  .tchat-field input:focus, .tchat-field textarea:focus { border-color: rgba(168,85,247,0.5); }
  .tchat-field textarea { resize: vertical; min-height: 80px; }
  .tchat-field input::placeholder, .tchat-field textarea::placeholder { color: rgba(183,198,194,0.3); }
  .tchat-submit {
    padding: 11px; border-radius: 10px;
    background: rgba(168,85,247,0.18); border: 1px solid rgba(168,85,247,0.4);
    color: #c084fc; font-family: inherit; font-size: 12px;
    font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    cursor: pointer; transition: background 0.3s, box-shadow 0.3s;
    margin-top: 4px;
  }
  .tchat-submit:hover { background: rgba(168,85,247,0.3); box-shadow: 0 0 20px rgba(168,85,247,0.35); }
  .tchat-submit:disabled { opacity: 0.5; cursor: default; }
  .tchat-form-msg { font-size: 12px; text-align: center; min-height: 16px; }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── HTML ── */
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <button id="tchat-btn" aria-label="Open chat">
    <div class="tchat-notif" id="tchat-notif"></div>
    <svg id="tchat-icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg id="tchat-icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" style="display:none;">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>

  <div id="tchat-panel" role="dialog" aria-label="CGW Chat">

    <div class="tchat-header">
      <div class="tchat-avatar">✦</div>
      <div class="tchat-header-info">
        <div class="tchat-header-name">ARIA</div>
        <div class="tchat-header-sub">
          <span class="tchat-status-dot"></span>
          CGW Studio AI
        </div>
      </div>
      <button class="tchat-close" id="tchat-close-btn" aria-label="Close chat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="tchat-tabs">
      <button class="tchat-tab active" data-tab="chat">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;vertical-align:-1px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Chat
      </button>
      <button class="tchat-tab" data-tab="email">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;vertical-align:-1px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Email
      </button>
    </div>

    <!-- CHAT TAB -->
    <div id="tchat-tab-chat" style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;">
      <div class="tchat-messages" id="tchat-messages"></div>
      <div class="tchat-input-row">
        <textarea class="tchat-input" id="tchat-input" placeholder="Ask ARIA anything…" rows="1"></textarea>
        <button class="tchat-send" id="tchat-send" aria-label="Send">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- EMAIL TAB -->
    <div id="tchat-tab-email" style="display:none;flex-direction:column;flex:1;overflow:hidden;">
      <div class="tchat-email-form">
        <p style="font-size:13px;color:rgba(183,198,194,0.6);line-height:1.6;margin:0 0 4px;">
          Prefer email? Send us a message and we'll reply within 48 hours.
        </p>
        <div class="tchat-field">
          <label>Your Name</label>
          <input type="text" id="em-name" placeholder="Jane Doe" />
        </div>
        <div class="tchat-field">
          <label>Email Address</label>
          <input type="email" id="em-email" placeholder="jane@company.com" />
        </div>
        <div class="tchat-field">
          <label>Subject</label>
          <select id="em-subject" style="background:rgba(255,255,255,0.06);border:1px solid rgba(183,198,194,0.15);border-radius:8px;color:#fff;font-family:inherit;font-size:13px;padding:9px 11px;outline:none;cursor:pointer;">
            <option value="General Enquiry" style="background:#171e19;">General Enquiry</option>
            <option value="Project Proposal" style="background:#171e19;">Project Proposal</option>
            <option value="Careers / Jobs" style="background:#171e19;">Careers / Jobs</option>
            <option value="Support" style="background:#171e19;">Support</option>
            <option value="Pricing" style="background:#171e19;">Pricing</option>
          </select>
        </div>
        <div class="tchat-field">
          <label>Message</label>
          <textarea id="em-message" placeholder="Tell us about your project or enquiry…"></textarea>
        </div>
        <div class="tchat-form-msg" id="em-msg"></div>
        <button class="tchat-submit" id="em-submit">Send Email</button>
      </div>
    </div>

  </div>
  `;
  document.body.appendChild(wrap);

  /* ── References ── */
  const btn       = document.getElementById('tchat-btn');
  const panel     = document.getElementById('tchat-panel');
  const closeBtn  = document.getElementById('tchat-close-btn');
  const messages  = document.getElementById('tchat-messages');
  const input     = document.getElementById('tchat-input');
  const sendBtn   = document.getElementById('tchat-send');
  const notif     = document.getElementById('tchat-notif');
  const iconOpen  = document.getElementById('tchat-icon-open');
  const iconClose = document.getElementById('tchat-icon-close');
  const tabs      = document.querySelectorAll('.tchat-tab');

  let isOpen   = false;
  let isWaiting = false;
  let history  = [];          /* [{role, content}] for context */
  let hasGreeted = false;

  /* ── Open / Close ── */
  function open() {
    isOpen = true;
    panel.classList.add('open');
    iconOpen.style.display  = 'none';
    iconClose.style.display = 'block';
    notif.style.display     = 'none';
    if (!hasGreeted) greet();
    setTimeout(() => input.focus(), 320);
  }
  function close() {
    isOpen = false;
    panel.classList.remove('open');
    iconOpen.style.display  = 'block';
    iconClose.style.display = 'none';
  }

  btn.addEventListener('click', () => isOpen ? close() : open());
  closeBtn.addEventListener('click', close);

  /* ── Tabs ── */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      document.getElementById('tchat-tab-chat').style.display  = name === 'chat'  ? 'flex' : 'none';
      document.getElementById('tchat-tab-email').style.display = name === 'email' ? 'flex' : 'none';
      if (name === 'chat') setTimeout(() => input.focus(), 50);
    });
  });

  /* ── Time helper ── */
  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Add message bubble ── */
  function addMsg(role, text) {
    const div = document.createElement('div');
    div.className = 'tchat-msg ' + role;
    div.innerHTML =
      '<div class="tchat-bubble">' + escHtml(text) + '</div>' +
      '<div class="tchat-time">' + nowTime() + '</div>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
  }

  /* ── Typing indicator ── */
  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'tchat-msg ai tchat-typing';
    typingEl.innerHTML = '<div class="tchat-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  /* ── Greeting ── */
  function greet() {
    hasGreeted = true;
    const greeting = 'Hi! I\'m ARIA, CGW\'s AI assistant. I can answer questions about our services, portfolio, pricing, and team.\n\nHow can I help you today?';
    addMsg('ai', greeting);
    history.push({ role: 'assistant', content: greeting });
  }

  /* ── Send message to AI ── */
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isWaiting) return;

    isWaiting = true;
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    addMsg('user', text);
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch('/api/website-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, history: history.slice(-10) })
      });

      hideTyping();

      if (!res.ok) throw new Error('server error');
      const data = await res.json();
      const reply = data.reply || 'Sorry, I had trouble with that. Try again or switch to the Email tab.';
      addMsg('ai', reply);
      history.push({ role: 'assistant', content: reply });

      /* Show notif dot if panel is closed */
      if (!isOpen) notif.style.display = 'block';

    } catch (e) {
      hideTyping();
      addMsg('ai', 'I\'m having trouble connecting right now. Please use the Email tab or contact us at cgwofficialai@gmail.com.');
    }

    isWaiting = false;
    sendBtn.disabled = false;
    setTimeout(() => input.focus(), 50);
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* Auto-grow textarea */
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  /* ── Email form submit ── */
  document.getElementById('em-submit').addEventListener('click', async function() {
    const name    = document.getElementById('em-name').value.trim();
    const email   = document.getElementById('em-email').value.trim();
    const subject = document.getElementById('em-subject').value;
    const message = document.getElementById('em-message').value.trim();
    const msgEl   = document.getElementById('em-msg');

    if (!name || !email || !message) {
      msgEl.style.color = '#f87171';
      msgEl.textContent = 'Please fill in name, email and message.';
      return;
    }

    this.disabled = true;
    msgEl.style.color = 'rgba(183,198,194,0.6)';
    msgEl.textContent = 'Sending…';

    try {
      /* Save to messages inbox */
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, budget: subject, message, source: 'chat' })
      });
      /* Also save as lead for backwards compat */
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat-email', data: { name, email, subject, message } })
      });

      /* Try EmailJS if configured */
      const ejsPub     = localStorage.getItem('autoreply_ejs_pub') || '';
      const ejsService = localStorage.getItem('autoreply_ejs_service') || '';
      const ejsNotify  = localStorage.getItem('autoreply_tpl_notify') || '';
      if (ejsPub && ejsService && ejsNotify && window.emailjs) {
        try {
          emailjs.init({ publicKey: ejsPub });
          await emailjs.send(ejsService, ejsNotify, {
            from_name: name, from_email: email,
            budget: subject, message, to_email: 'cgwofficialai@gmail.com'
          });
        } catch (_) {}
      }

      msgEl.style.color = '#4ade80';
      msgEl.textContent = 'Sent! We\'ll reply within 48 hours.';
      ['em-name','em-email','em-message'].forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('em-subject').selectedIndex = 0;

    } catch (err) {
      msgEl.style.color = '#f87171';
      msgEl.textContent = 'Failed. Email us directly at cgwofficialai@gmail.com';
    }

    this.disabled = false;
  });

})();

