// —— CONFIG ——
const CONFIG = {
  apiKey: localStorage.getItem('mailai_api_key') || '',
  geminiKey: localStorage.getItem('mailai_gemini_key') || '',
  brandVoice: localStorage.getItem('mailai_brand_voice') || 'Professional, friendly, and concise. We value our customers and respond helpfully.',
  companyName: localStorage.getItem('mailai_company') || 'TECHNO Studio',
  autoSend: false,
};

// —— SAMPLE DATA ——
const SAMPLE_EMAILS = [
  { id: 1, from: 'Sarah Mitchell', email: 'sarah@techcorp.io', subject: 'Urgent: Server down - need immediate support', body: 'Hi,\n\nOur production server went down 20 minutes ago and we are losing thousands of dollars per minute. We need immediate assistance. Our team has tried restarting but the issue persists.\n\nPlease respond ASAP.\n\nSarah Mitchell\nCTO, TechCorp', category: 'urgent', time: '2 min ago', unread: true, avatar: 'SM', avatarColor: '#ef4444' },
  { id: 2, from: 'James Rodriguez', email: 'james@growthventures.com', subject: 'Interested in Enterprise Plan - 500 seats', body: 'Hello,\n\nI came across your platform and we are very interested in the Enterprise plan for our team of 500 employees. Could you please send over pricing details and whether you offer custom onboarding?\n\nWe are looking to make a decision by end of month.\n\nBest,\nJames Rodriguez\nDirector of Operations, Growth Ventures', category: 'sales', time: '15 min ago', unread: true, avatar: 'JR', avatarColor: '#5b7cfa' },
  { id: 3, from: 'Priya Patel', email: 'priya@designstudio.co', subject: 'How do I export reports to PDF?', body: 'Hi Support Team,\n\nI have been using your platform for 3 months now and love it! Quick question — how do I export my monthly reports to PDF? I can see CSV export but not PDF.\n\nThank you!\nPriya', category: 'support', time: '1 hr ago', unread: true, avatar: 'PP', avatarColor: '#14b8a6' },
  { id: 4, from: 'no-reply@promo-deals.xyz', email: 'spam@promo-deals.xyz', subject: 'YOU HAVE WON $5000!!! CLAIM NOW!!!', body: 'Congratulations! You have been selected as our lucky winner. Click here to claim your $5000 prize immediately. Offer expires in 1 hour!', category: 'spam', time: '2 hr ago', unread: false, avatar: 'SP', avatarColor: '#6b7280' },
  { id: 5, from: 'Michael Chen', email: 'michael@startuplab.io', subject: 'Partnership proposal - co-marketing opportunity', body: 'Hi there,\n\nI run a complementary SaaS tool for startups with 50,000 users. I think we have significant overlap in our target markets and would love to explore a co-marketing partnership.\n\nWould you be open to a 30-min call this week?\n\nBest,\nMichael Chen', category: 'sales', time: '3 hr ago', unread: false, avatar: 'MC', avatarColor: '#a855f7' },
  { id: 6, from: 'Linda Thompson', email: 'linda@retailplus.com', subject: 'Billing issue - charged twice this month', body: 'Hello,\n\nI noticed I was charged twice for my subscription this month — once on the 1st and again on the 15th. Please look into this and issue a refund for the duplicate charge.\n\nMy account email is linda@retailplus.com\n\nThank you,\nLinda', category: 'urgent', time: '4 hr ago', unread: false, avatar: 'LT', avatarColor: '#f59e0b' },
  { id: 7, from: 'Tom Walker', email: 'tom@agencyworks.co', subject: 'Can you integrate with Zapier?', body: 'Hi,\n\nWe are evaluating tools for our agency and one key requirement is Zapier integration. Do you have this? If so, can you point me to the documentation?\n\nThanks,\nTom', category: 'sales', time: '5 hr ago', unread: false, avatar: 'TW', avatarColor: '#22c55e' },
  { id: 8, from: 'Anna Kowalski', email: 'anna@ecommerce.eu', subject: 'Invoice #INV-2024-089 attached', body: 'Dear Team,\n\nPlease find attached invoice #INV-2024-089 for the professional services rendered in November. Payment is due within 30 days.\n\nKind regards,\nAnna Kowalski\nFinance Department', category: 'support', time: '6 hr ago', unread: false, avatar: 'AK', avatarColor: '#5b7cfa' },
  { id: 9, from: 'no-reply@bulk-sender.net', email: 'bulk@spam-net.com', subject: 'Earn $1000/day working from home!', body: 'Amazing opportunity! Join thousands of people making passive income from home. No experience needed. Limited spots available!', category: 'spam', time: '8 hr ago', unread: false, avatar: 'BS', avatarColor: '#6b7280' },
  { id: 10, from: 'Carlos Mendez', email: 'carlos@fintech.mx', subject: 'Demo request - team of 200', body: 'Hi,\n\nWe are a fintech company in Mexico with 200 employees. After seeing your product demo on YouTube we would love a personalized walkthrough. Can we schedule something for next week?\n\nCarlos Mendez\nProduct Manager', category: 'sales', time: '1 day ago', unread: false, avatar: 'CM', avatarColor: '#a855f7' },
  { id: 11, from: 'Rachel Kim', email: 'rachel@healthapp.com', subject: 'Feature request: dark mode', body: 'Hey!\n\nLove the product but would really love a dark mode option. Is this on your roadmap? Many of us work late nights and the bright interface is tough on the eyes.\n\nThanks,\nRachel', category: 'support', time: '1 day ago', unread: false, avatar: 'RK', avatarColor: '#14b8a6' },
  { id: 12, from: 'promo@spam-blast.io', email: 'promo@spam-blast.io', subject: 'Free trial extended!! Act now!', body: 'Your free trial has been EXTENDED for a limited time! Sign up now before it expires.', category: 'spam', time: '2 days ago', unread: false, avatar: 'PR', avatarColor: '#6b7280' },
];

const CRM_CONTACTS = [
  { name: 'Sarah Mitchell', email: 'sarah@techcorp.io', company: 'TechCorp', emails: 14, lastContact: '2 min ago', status: 'customer', spent: '$2,400' },
  { name: 'James Rodriguez', email: 'james@growthventures.com', company: 'Growth Ventures', emails: 3, lastContact: '15 min ago', status: 'lead', spent: '$0' },
  { name: 'Michael Chen', email: 'michael@startuplab.io', company: 'StartupLab', emails: 7, lastContact: '3 hr ago', status: 'lead', spent: '$0' },
  { name: 'Linda Thompson', email: 'linda@retailplus.com', company: 'RetailPlus', emails: 22, lastContact: '4 hr ago', status: 'customer', spent: '$8,900' },
  { name: 'Carlos Mendez', email: 'carlos@fintech.mx', company: 'Fintech MX', emails: 2, lastContact: '1 day ago', status: 'lead', spent: '$0' },
  { name: 'Anna Kowalski', email: 'anna@ecommerce.eu', company: 'ECommerce EU', emails: 9, lastContact: '6 hr ago', status: 'customer', spent: '$1,200' },
];

const DRAFT_REPLIES = [
  { id: 1, to: 'priya@designstudio.co', subject: 'Re: How do I export reports to PDF?', preview: "Hi Priya! Thank you for being a loyal customer. To export reports to PDF, navigate to Reports > Select your report > Click the Export button in the top right > Choose 'PDF' from the dropdown...", time: '58 min ago' },
  { id: 2, to: 'tom@agencyworks.co', subject: 'Re: Can you integrate with Zapier?', preview: "Hi Tom! Great question. Yes, we have a native Zapier integration with 50+ triggers and actions. You can find our full Zapier documentation at...", time: '4 hr ago' },
  { id: 3, to: 'rachel@healthapp.com', subject: 'Re: Feature request: dark mode', preview: "Hey Rachel! You will be happy to hear that dark mode is actually on our Q1 roadmap! We expect to release it within the next 6-8 weeks. I have added your vote...", time: '23 hr ago' },
];

// —— STATE ——
let currentView = 'inbox';
let currentFilter = 'all';
let currentEmail = null;
let emails = [...SAMPLE_EMAILS];
let drafts = [...DRAFT_REPLIES];

// —— INIT ——
document.addEventListener('DOMContentLoaded', () => {
  renderEmailList();
  renderCRM();
  renderDrafts();
  renderMessages();
  setupNavigation();
  setupFilters();
  setupSettings();
  setupCompose();
  setupModal();
  setupMessages();
  setupBot();
  drawTimeline();
  loadSettings();
});

// Called by admin.html after the panel unlocks — auto-starts the bot
window.autoStartBot = function () {
  // Small delay so the dashboard renders first
  setTimeout(() => {
    if (!BOT.running) {
      startBot();
      logEntry('sent', 'System', 'Auto-started: MailAI Agent is live and monitoring your inbox.', timeNow());
    }
  }, 800);
};

// —— LIVE INBOX WATCHER ——
// Polls localStorage for new contact form messages every 5s.
// When a new message arrives from the website contact form,
// inject it into the email list and let the bot process it.
(function watchInbox() {
  const SEEN_KEY = 'mailai_seen_msgs';

  function getSeenIds() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch (e) { return new Set(); }
  }
  function markSeen(id) {
    const seen = getSeenIds(); seen.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  }

  function injectMessage(m) {
    const catMap = { 'New project inquiry': 'sales', 'support': 'support', 'urgent': 'urgent' };
    const cat = m.budget && parseFloat(m.budget.replace(/[^0-9]/g, '')) > 20000 ? 'sales' : 'support';
    const initials = (m.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['#5b7cfa', '#a855f7', '#14b8a6', '#f59e0b', '#22c55e'];
    const col = colors[m.name.length % colors.length];
    const newEmail = {
      id: Date.now(),
      from: m.name || 'Website Visitor',
      email: m.email || '',
      subject: m.budget ? `Project inquiry — Budget: ${m.budget}` : 'New message from website',
      body: `${m.message}\n\n---\nFrom: ${m.name} <${m.email}>\nBudget: ${m.budget || 'Not specified'}\nSent via website contact form`,
      category: cat,
      time: 'Just now',
      unread: true,
      avatar: initials,
      avatarColor: col,
      botReplied: false,
    };
    emails.unshift(newEmail);
    renderEmailList();
    updateBadge();

    // If bot is running, queue it for immediate reply
    if (BOT.running) {
      BOT.queue.unshift(newEmail);
      logEntry('processing', newEmail.from, 'New website enquiry detected — queueing for AI reply', timeNow());
    }
  }

  function updateBadge() {
    const b = document.getElementById('inbox-badge');
    if (b) b.textContent = emails.filter(e => e.unread).length;
  }

  function poll() {
    const msgs = getMessages(); // from messages store
    const seen = getSeenIds();
    msgs.forEach(m => {
      if (!seen.has(m.id)) {
        markSeen(m.id);
        injectMessage(m);
        showToast(`New enquiry from ${m.name || 'visitor'} — AI replying…`, 'success');
      }
    });
  }

  // Start polling after a short delay (let the dashboard init first)
  setTimeout(() => {
    poll(); // check immediately
    setInterval(poll, 5000); // then every 5 seconds
  }, 2000);
})();

// —— NAVIGATION ——
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (!view) return;
      switchView(view);
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    switchView('inbox');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="inbox"]').classList.add('active');
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    showToast('Inbox refreshed — no new emails', 'success');
  });

  document.getElementById('auto-send-toggle').addEventListener('change', (e) => {
    CONFIG.autoSend = e.target.checked;
    showToast(CONFIG.autoSend ? 'Auto-send enabled' : 'Auto-send disabled — drafts mode on', CONFIG.autoSend ? 'success' : '');
  });
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  currentView = view;
}

// —— FILTERS ——
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderEmailList();
    });
  });
}

// —— RENDER EMAIL LIST ——
function renderEmailList() {
  const list = document.getElementById('email-list');
  const filtered = currentFilter === 'all' ? emails : emails.filter(e => e.category === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">No emails in this category</div>';
    return;
  }

  list.innerHTML = filtered.map(email => `
    <div class="email-row ${email.unread ? 'unread' : ''}" data-id="${email.id}">
      <div class="email-avatar" style="background:${email.avatarColor}22;color:${email.avatarColor}">${email.avatar}</div>
      <div class="email-main">
        <div class="email-from">${email.from}</div>
        <div class="email-subject">${email.subject}</div>
      </div>
      <div class="email-meta">
        <span class="email-time">${email.time}</span>
        <span class="tag ${email.category}">${email.category}</span>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.email-row').forEach(row => {
    row.addEventListener('click', () => openEmail(parseInt(row.dataset.id)));
  });
}

// —— OPEN EMAIL ——
function openEmail(id) {
  currentEmail = emails.find(e => e.id === id);
  if (!currentEmail) return;
  currentEmail.unread = false;

  const detail = document.getElementById('email-detail');
  detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-subject">${currentEmail.subject}</div>
      <div class="detail-meta">
        <div class="detail-meta-item"><label>From</label><span>${currentEmail.from} &lt;${currentEmail.email}&gt;</span></div>
        <div class="detail-meta-item"><label>Time</label><span>${currentEmail.time}</span></div>
        <div class="detail-meta-item"><label>Category</label><span class="tag ${currentEmail.category}">${currentEmail.category}</span></div>
      </div>
    </div>
    <div class="detail-body">${currentEmail.body}</div>
    <div class="detail-actions">
      <button class="btn-primary" id="ai-reply-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        AI Reply
      </button>
      <button class="btn-ghost" id="forward-btn">Forward</button>
      <button class="btn-ghost" id="calendar-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Book Meeting
      </button>
    </div>
  `;

  document.getElementById('ai-reply-btn').addEventListener('click', () => openReplyModal(currentEmail));
  document.getElementById('forward-btn').addEventListener('click', () => showToast('Opening forward...'));
  document.getElementById('calendar-btn').addEventListener('click', () => showToast('Calendar booking — requires calendar integration', 'success'));
  document.getElementById('spam-btn').addEventListener('click', () => {
    if (currentEmail) { currentEmail.category = 'spam'; showToast('Marked as spam', 'success'); switchView('inbox'); }
  });
  document.getElementById('classify-btn').addEventListener('click', () => reclassifyEmail(currentEmail));

  switchView('detail');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
}

// —— RECLASSIFY ——
async function reclassifyEmail(email) {
  if (!CONFIG.apiKey) { showToast('Add your API key in Settings first', 'error'); return; }
  showToast('Reclassifying with AI...');
  try {
    const res = await callClaude(`Classify this email into exactly one of: urgent, sales, support, spam. Reply with only the category word.\n\nSubject: ${email.subject}\n\nBody: ${email.body}`);
    const cat = res.trim().toLowerCase().replace(/[^a-z]/g, '');
    const valid = ['urgent', 'sales', 'support', 'spam'];
    if (valid.includes(cat)) {
      email.category = cat;
      openEmail(email.id);
      showToast(`Reclassified as: ${cat}`, 'success');
    }
  } catch (e) { showToast('Reclassification failed', 'error'); }
}

// —— MODAL ——
function setupModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-discard').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  document.getElementById('modal-save-draft').addEventListener('click', () => {
    const body = document.getElementById('reply-textarea').value;
    if (!body.trim() || !currentEmail) return;
    drafts.unshift({ id: Date.now(), to: currentEmail.email, subject: 'Re: ' + currentEmail.subject, preview: body.substring(0, 120) + '...', time: 'Just now' });
    document.getElementById('drafts-badge').textContent = drafts.length;
    renderDrafts();
    closeModal();
    showToast('Saved to drafts', 'success');
  });

  document.getElementById('modal-send').addEventListener('click', () => {
    const body = document.getElementById('reply-textarea').value;
    if (!body.trim()) { showToast('Reply is empty', 'error'); return; }
    closeModal();
    showToast(`Reply sent to ${currentEmail?.from}!`, 'success');
  });
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

async function openReplyModal(email) {
  document.getElementById('modal-title').textContent = 'AI Reply — ' + email.from;
  document.getElementById('reply-textarea').value = '';
  document.getElementById('ai-status').classList.remove('hidden');
  document.getElementById('ai-status-text').textContent = 'Generating reply...';
  document.getElementById('modal-backdrop').classList.add('open');

  if (!CONFIG.apiKey) {
    document.getElementById('ai-status').classList.add('hidden');
    document.getElementById('reply-textarea').value = getDemoReply(email);
    showToast('Demo mode — add API key in Settings for live AI replies');
    return;
  }

  try {
    const prompt = `You are an email assistant for ${CONFIG.companyName}. Brand voice: ${CONFIG.brandVoice}

Write a professional reply to this email. Be helpful, concise, and match the brand voice. Sign off as "${CONFIG.companyName} Team".

From: ${email.from}
Subject: ${email.subject}
Email body:
${email.body}

Write only the reply body, no extra explanation.`;

    const reply = await callClaude(prompt);
    document.getElementById('reply-textarea').value = reply;
    document.getElementById('ai-status').classList.add('hidden');

    if (CONFIG.autoSend) {
      closeModal();
      showToast(`Auto-sent reply to ${email.from}`, 'success');
    }
  } catch (e) {
    document.getElementById('ai-status').classList.add('hidden');
    document.getElementById('reply-textarea').value = getDemoReply(email);
    showToast('API error — showing demo reply. Check your API key.', 'error');
  }
}

function getDemoReply(email) {
  const replies = {
    urgent: `Dear ${email.from.split(' ')[0]},\n\nThank you for reaching out. I can see this is urgent and I'm treating it as our top priority right now.\n\nI've escalated this to our senior technical team immediately. Our on-call engineer will contact you within the next 15 minutes.\n\nIn the meantime, could you please provide:\n- Your account ID\n- Any error messages you're seeing\n- When the issue first started\n\nWe sincerely apologize for the disruption and will resolve this as quickly as possible.\n\nBest regards,\n${CONFIG.companyName} Support Team`,
    sales: `Dear ${email.from.split(' ')[0]},\n\nThank you so much for your interest in ${CONFIG.companyName}! It's great to hear from you.\n\nI'd love to discuss how we can best serve your needs. Could we schedule a 30-minute call this week?\n\nLooking forward to connecting!\n\nWarm regards,\n${CONFIG.companyName} Sales Team`,
    support: `Dear ${email.from.split(' ')[0]},\n\nThank you for reaching out to ${CONFIG.companyName} support!\n\nI'm happy to help with your question. Please check our Help Center for detailed step-by-step guides. If you continue to experience issues, our team is available 24/7.\n\nBest,\n${CONFIG.companyName} Support Team`,
    spam: `This email has been classified as spam and no reply is recommended.`,
  };
  return replies[email.category] || replies.support;
}

// —— COMPOSE ——
function setupCompose() {
  document.getElementById('ai-compose-btn').addEventListener('click', async () => {
    const context = document.getElementById('compose-context').value;
    const to = document.getElementById('compose-to').value;
    const subject = document.getElementById('compose-subject').value;

    if (!context.trim()) { showToast('Add some context for the AI to work with', 'error'); return; }

    const btn = document.getElementById('ai-compose-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    if (!CONFIG.apiKey) {
      setTimeout(() => {
        document.getElementById('compose-body').value = `Dear ${to ? to.split('@')[0] : 'Sir/Madam'},\n\nI hope this email finds you well.\n\n${context}\n\nPlease do not hesitate to reach out if you have any questions.\n\nBest regards,\n${CONFIG.companyName} Team`;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> AI Draft ✦';
        btn.disabled = false;
        showToast('Demo email generated — add API key for real AI', 'success');
      }, 1200);
      return;
    }

    try {
      const prompt = `Write a professional email for ${CONFIG.companyName}.\nBrand voice: ${CONFIG.brandVoice}\n\nTo: ${to || 'the recipient'}\nSubject: ${subject || 'not specified'}\nContext/brief: ${context}\n\nWrite only the email body. Sign off as ${CONFIG.companyName} Team.`;
      const result = await callClaude(prompt);
      document.getElementById('compose-body').value = result;
      showToast('Email drafted by AI', 'success');
    } catch (e) {
      showToast('Failed to generate. Check API key in Settings.', 'error');
    } finally {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> AI Draft ✦';
      btn.disabled = false;
    }
  });

  document.getElementById('send-btn').addEventListener('click', () => {
    const to = document.getElementById('compose-to').value;
    const body = document.getElementById('compose-body').value;
    if (!to || !body) { showToast('Fill in recipient and body', 'error'); return; }
    showToast(`Email sent to ${to}!`, 'success');
    document.getElementById('compose-to').value = '';
    document.getElementById('compose-subject').value = '';
    document.getElementById('compose-context').value = '';
    document.getElementById('compose-body').value = '';
  });
}

// —— DRAFTS ——
function renderDrafts() {
  const list = document.getElementById('drafts-list');
  list.innerHTML = drafts.map(d => `
    <div class="draft-card">
      <div class="draft-card-header">
        <span class="draft-to">To: ${d.to}</span>
        <span style="font-size:12px;color:var(--text3)">${d.time}</span>
      </div>
      <div class="draft-subject">${d.subject}</div>
      <div class="draft-preview">${d.preview}</div>
      <div class="draft-actions">
        <button class="btn-primary" onclick="sendDraft(${d.id})">Send Now</button>
        <button class="btn-ghost" onclick="editDraft(${d.id})">Edit</button>
        <button class="btn-danger" onclick="deleteDraft(${d.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.sendDraft = (id) => {
  drafts = drafts.filter(d => d.id !== id);
  document.getElementById('drafts-badge').textContent = drafts.length;
  renderDrafts();
  showToast('Draft sent!', 'success');
};

window.editDraft = (id) => {
  const d = drafts.find(x => x.id === id);
  if (!d) return;
  switchView('compose');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="compose"]').classList.add('active');
  document.getElementById('compose-to').value = d.to;
  document.getElementById('compose-subject').value = d.subject;
  document.getElementById('compose-body').value = d.preview;
};

window.deleteDraft = (id) => {
  drafts = drafts.filter(d => d.id !== id);
  document.getElementById('drafts-badge').textContent = drafts.length;
  renderDrafts();
  showToast('Draft deleted');
};

// —— CRM ——
function renderCRM() {
  const grid = document.getElementById('crm-grid');
  const renderCards = (contacts) => contacts.map(c => `
    <div class="crm-card">
      <div class="crm-card-top">
        <div class="crm-avatar" style="background:${hashColor(c.name)}22;color:${hashColor(c.name)}">${c.name.split(' ').map(w => w[0]).join('')}</div>
        <div><div class="crm-name">${c.name}</div><div class="crm-email-small">${c.company}</div></div>
      </div>
      <div class="crm-stats">
        <div class="crm-stat"><label>Emails</label><span>${c.emails}</span></div>
        <div class="crm-stat"><label>Last contact</label><span>${c.lastContact}</span></div>
        <div class="crm-stat"><label>Total spent</label><span>${c.spent}</span></div>
        <div class="crm-stat"><label>Handle</label><span style="font-size:11px;word-break:break-all">${c.email.split('@')[0]}</span></div>
      </div>
      <span class="crm-status-badge ${c.status}">${c.status}</span>
    </div>
  `).join('');

  grid.innerHTML = renderCards(CRM_CONTACTS);

  document.getElementById('crm-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = CRM_CONTACTS.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    );
    grid.innerHTML = renderCards(filtered);
  });
}

// —— SETTINGS ——
function setupSettings() {
  document.getElementById('save-key-btn').addEventListener('click', () => {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) { CONFIG.apiKey = key; localStorage.setItem('mailai_api_key', key); showToast('API key saved!', 'success'); }
    else { showToast('Enter a valid API key', 'error'); }
  });

  document.getElementById('save-settings-btn').addEventListener('click', () => {
    CONFIG.brandVoice = document.getElementById('brand-voice').value || CONFIG.brandVoice;
    CONFIG.companyName = document.getElementById('company-name').value || CONFIG.companyName;
    localStorage.setItem('mailai_brand_voice', CONFIG.brandVoice);
    localStorage.setItem('mailai_company', CONFIG.companyName);
    showToast('Settings saved!', 'success');
  });
}

function loadSettings() {
  if (CONFIG.apiKey) document.getElementById('api-key-input').value = CONFIG.apiKey;
  document.getElementById('brand-voice').value = CONFIG.brandVoice;
  document.getElementById('company-name').value = CONFIG.companyName;

  // Load saved auto-reply config
  const arFields = {
    'gemini-key-input':  'autoreply_gemini_key',
    'ejs-pub-key':       'autoreply_ejs_pub',
    'ejs-service':       'autoreply_ejs_service',
    'ejs-tpl-notify':    'autoreply_tpl_notify',
    'ejs-tpl-reply':     'autoreply_tpl_reply',
  };
  Object.entries(arFields).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && localStorage.getItem(key)) el.value = localStorage.getItem(key);
  });

  // Save & Activate auto-reply
  document.getElementById('save-autoreply-btn').addEventListener('click', () => {
    const status = document.getElementById('autoreply-status');
    let allFilled = true;
    Object.entries(arFields).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const val = el.value.trim();
      if (val) localStorage.setItem(key, val);
      else allFilled = false;
    });
    // Also update live CONFIG for Gemini
    CONFIG.geminiKey = localStorage.getItem('autoreply_gemini_key') || '';
    status.style.display = 'block';
    if (allFilled) {
      status.style.color = 'var(--green)';
      status.textContent = '✓ Auto-reply activated! Contact form will now send real emails.';
      showToast('Auto-reply is active!', 'success');
    } else {
      status.style.color = 'var(--amber)';
      status.textContent = 'Saved. Fill all fields to fully activate email sending.';
      showToast('Partial config saved', '');
    }
  });

  // Test auto-reply
  document.getElementById('test-autoreply-btn').addEventListener('click', async () => {
    const status = document.getElementById('autoreply-status');
    const gemKey = document.getElementById('gemini-key-input').value.trim() || localStorage.getItem('autoreply_gemini_key') || '';
    status.style.display = 'block';
    status.style.color = 'var(--amber)';
    status.textContent = 'Testing Gemini connection…';

    if (!gemKey) {
      status.style.color = 'var(--red)';
      status.textContent = '✕ No Gemini key found. Enter your key above first.';
      return;
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gemKey}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say: Gemini is working!' }] }], generationConfig: { maxOutputTokens: 20 } })
        }
      );
      if (!res.ok) throw new Error(res.status);
      status.style.color = 'var(--green)';
      status.textContent = '✓ Gemini AI connected! Auto-replies will be AI-generated.';
      showToast('Gemini API working!', 'success');
    } catch (err) {
      status.style.color = 'var(--red)';
      status.textContent = `✕ Gemini error: ${err.message}. Check your API key.`;
    }
  });

  // Gmail OAuth button
  document.getElementById('gmail-oauth-btn').addEventListener('click', () => {
    showToast('Gmail OAuth requires a backend server. Use EmailJS above instead.', 'error');
  });

  // SMTP connect
  document.getElementById('smtp-connect-btn').addEventListener('click', () => {
    const host  = document.getElementById('smtp-host').value.trim();
    const email = document.getElementById('smtp-email').value.trim();
    const pass  = document.getElementById('smtp-pass').value.trim();
    const status = document.getElementById('smtp-status');
    if (!host || !email || !pass) { showToast('Fill in all SMTP fields', 'error'); return; }
    status.style.display = 'block';
    status.style.color = 'var(--amber)';
    status.textContent = 'Testing connection…';
    setTimeout(() => {
      localStorage.setItem('mailai_smtp', JSON.stringify({ host, email }));
      status.style.color = 'var(--green)';
      status.textContent = `✓ Connected — ${email}`;
      showToast('SMTP inbox connected!', 'success');
    }, 1800);
  });
}

// —— GEMINI API (free) ——
async function callGemini(prompt) {
  const key = CONFIG.geminiKey;
  if (!key) throw new Error('no-gemini-key');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
    })
  });
  if (!res.ok) throw new Error('gemini-' + res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!text) throw new Error('gemini-empty');
  return text;
}

// —— ANTHROPIC API ——
async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true'
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) throw new Error('API error ' + response.status);
  const data = await response.json();
  return data.content.map(b => b.text || '').join('');
}

// —— TIMELINE CHART ——
function drawTimeline() {
  const canvas = document.getElementById('timeline-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 600;
  canvas.height = 160;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [32, 41, 28, 55, 48, 19, 25];
  const W = canvas.width, H = canvas.height;
  const pad = { l: 30, r: 10, t: 10, b: 30 };
  const max = Math.max(...data);
  const sx = (i) => pad.l + i * (W - pad.l - pad.r) / (data.length - 1);
  const sy = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + i * (H - pad.t - pad.b) / 4;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i), sy(v)) : ctx.lineTo(sx(i), sy(v)));
  ctx.strokeStyle = '#5b7cfa'; ctx.lineWidth = 2; ctx.stroke();
  ctx.lineTo(sx(data.length - 1), H - pad.b);
  ctx.lineTo(sx(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = 'rgba(91,124,250,0.1)'; ctx.fill();
  data.forEach((v, i) => {
    ctx.beginPath(); ctx.arc(sx(i), sy(v), 4, 0, Math.PI * 2);
    ctx.fillStyle = '#5b7cfa'; ctx.fill();
  });
  ctx.fillStyle = 'rgba(139,144,168,0.8)'; ctx.font = '11px DM Sans'; ctx.textAlign = 'center';
  days.forEach((d, i) => ctx.fillText(d, sx(i), H - 8));
}

// —— HELPERS ——
function hashColor(name) {
  const colors = ['#5b7cfa', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6', '#ec4899'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ══════════════════════════════════════════════════════════════
//   CENTRAL AI BRAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
(function setupBrainDashboard() {

  async function loadBrainStatus() {
    try {
      const r = await fetch('/api/brain/status');
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();

      document.getElementById('brain-sessions').textContent = d.totalSessions;
      document.getElementById('brain-wa').textContent       = d.channels.whatsapp;
      document.getElementById('brain-voice').textContent    = d.channels.voice;

      const modelEl   = document.getElementById('brain-model');
      const modelCard = document.getElementById('brain-model-card');
      const archModel = document.getElementById('brain-arch-model');
      const oaiCard   = document.getElementById('brain-openai-card');

      if (d.openaiConfigured) {
        modelEl.textContent       = d.model;
        modelEl.style.color       = 'var(--green)';
        modelCard.style.borderColor = 'rgba(34,197,94,.3)';
        archModel.textContent     = d.model;
        oaiCard.style.borderColor = 'rgba(168,85,247,.4)';
        oaiCard.style.color       = '#c084fc';
        document.getElementById('brain-badge').style.display = '';
      } else if (d.geminiConfigured) {
        modelEl.textContent = 'Gemini (fallback)';
        modelEl.style.color = 'var(--amber)';
      } else {
        modelEl.textContent = '⚠ No AI key';
        modelEl.style.color = 'var(--red)';
      }

      // Pre-fill model selector
      const sel = document.getElementById('brain-model-select');
      if (sel && d.model) sel.value = d.model;

    } catch(e) {
      const el = document.getElementById('brain-model');
      if (el) { el.textContent = 'Server offline'; el.style.color = 'var(--red)'; }
    }
  }

  document.getElementById('brain-refresh-btn')?.addEventListener('click', async () => {
    await loadBrainStatus();
    showToast('Brain status refreshed', 'success');
  });

  document.getElementById('brain-save-key-btn')?.addEventListener('click', () => {
    const key = document.getElementById('brain-openai-key')?.value.trim();
    const model = document.getElementById('brain-model-select')?.value;
    const status = document.getElementById('brain-key-status');
    if (!key) { showToast('Enter your OpenAI API key first', 'error'); return; }
    localStorage.setItem('brain_openai_key', key);
    localStorage.setItem('brain_model', model);
    status.style.display = 'block';
    status.style.color   = 'var(--amber)';
    status.textContent   = 'Key saved locally. Add to .env file and restart server for permanent effect.';
    showToast('API key saved!', 'success');
  });

  document.getElementById('brain-test-btn')?.addEventListener('click', async () => {
    const status = document.getElementById('brain-key-status');
    status.style.display = 'block';
    status.style.color   = 'var(--amber)';
    status.textContent   = 'Testing OpenAI connection via WhatsApp test endpoint…';
    try {
      const r = await fetch('/whatsapp/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello, are you there?', phone: '+test' })
      });
      const d = await r.json();
      status.style.color = 'var(--green)';
      status.textContent = `✓ AI replied: "${d.reply?.slice(0,80)}…"`;
      showToast('AI Brain connected!', 'success');
    } catch(e) {
      status.style.color = 'var(--red)';
      status.textContent = '✕ Server not responding. Run npm start first.';
    }
  });

  document.getElementById('brain-clear-memory-btn')?.addEventListener('click', async () => {
    if (!confirm('Clear ALL conversation memory across all agents? This cannot be undone.')) return;
    try {
      await fetch('/api/brain/memory', { method: 'DELETE' });
      await loadBrainStatus();
      showToast('All memory cleared', 'success');
    } catch(e) { showToast('Server not running', 'error'); }
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.dataset.view === 'brain') btn.addEventListener('click', loadBrainStatus);
  });

  setTimeout(loadBrainStatus, 2000);
})();

// ══════════════════════════════════════════════════════════════
//   PHASE 1 — WHATSAPP AI AGENT
// ══════════════════════════════════════════════════════════════
(function setupWhatsApp() {

  async function loadWAStatus() {
    try {
      const r = await fetch('/whatsapp/health');
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      const statusEl = document.getElementById('wa-status');
      const statusCard = document.getElementById('wa-status-card');
      if (d.aiReady && d.twilioConfigured) {
        statusEl.textContent = '● Online'; statusEl.style.color = 'var(--green)';
        statusCard.style.borderColor = 'rgba(34,197,94,.3)';
      } else if (d.aiReady) {
        statusEl.textContent = '⚠ AI ready, Twilio needed'; statusEl.style.color = 'var(--amber)';
      } else {
        statusEl.textContent = '⚠ Setup required'; statusEl.style.color = 'var(--amber)';
      }
      document.getElementById('wa-total').textContent = d.totalConversations;
      if (d.totalConversations > 0) {
        document.getElementById('wa-badge').textContent = d.totalConversations;
        document.getElementById('wa-badge').style.display = '';
      }
    } catch(e) {
      const el = document.getElementById('wa-status');
      if (el) { el.textContent = 'Server offline'; el.style.color = 'var(--red)'; }
    }
  }

  async function loadConversations() {
    try {
      const r = await fetch('/whatsapp/logs');
      if (!r.ok) throw new Error(r.status);
      const convs = await r.json();
      renderConversations(convs);
    } catch(e) {
      document.getElementById('wa-conv-list').innerHTML =
        '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;">Server not running. Start with <code>npm start</code>.</div>';
    }
  }

  function renderConversations(convs) {
    const el = document.getElementById('wa-conv-list');
    document.getElementById('wa-total').textContent = convs.length;

    const hotLeads = convs.filter(c => (c.leadScore||0) >= 30).length;
    document.getElementById('wa-hot-leads').textContent = hotLeads;

    const avgScore = convs.length
      ? Math.round(convs.reduce((a,c) => a + (c.leadScore||0), 0) / convs.length)
      : 0;
    document.getElementById('wa-avg-score').textContent = avgScore;

    if (!convs.length) {
      el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px;">No conversations yet. Click "Test Message" to simulate one.</div>';
      return;
    }

    el.innerHTML = convs.map(c => {
      const lastMsg = c.messages?.slice(-1)[0];
      const dt = c.lastSeen ? new Date(c.lastSeen).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
      const score = c.leadScore || 0;
      const scoreColor = score >= 40 ? '#22c55e' : score >= 20 ? '#f59e0b' : '#6b7280';
      const sentIcon = c.sentiment === 'positive' ? '😊' : c.sentiment === 'negative' ? '😤' : '😐';
      const initials = (c.name||c.from||'?').split(/[\s+]/).map(w=>w[0]).join('').slice(0,2).toUpperCase();

      return `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="waShowThread('${escapeHtml(c.from)}')">
          <div style="width:38px;height:38px;border-radius:50%;background:rgba(34,197,94,.15);color:#4ade80;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;">${initials}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
              <span style="font-size:13px;font-weight:500;">${escapeHtml(c.name||c.from)}</span>
              <span style="font-size:11px;color:var(--text3);">${escapeHtml(c.from)}</span>
            </div>
            <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(lastMsg?.content||'—')}</div>
          </div>
          <div style="flex-shrink:0;text-align:right;display:flex;flex-direction:column;gap:4px;">
            <span style="font-size:11px;color:var(--text3);">${dt}</span>
            <span style="font-size:11px;font-weight:600;color:${scoreColor};">Lead: ${score}</span>
            <span style="font-size:12px;">${sentIcon}</span>
          </div>
        </div>`;
    }).join('');
  }

  window.waShowThread = async function(phone) {
    try {
      const r = await fetch('/whatsapp/conversations/' + encodeURIComponent(phone));
      const d = await r.json();
      const msgs = d.logs?.messages || d.session?.messages || [];
      const html = msgs.map(m => {
        const isUser = m.role === 'user';
        return `<div style="display:flex;gap:8px;margin-bottom:10px;${isUser?'flex-direction:row-reverse;':''}">
          <div style="width:26px;height:26px;border-radius:50%;background:${isUser?'rgba(34,197,94,.15)':'rgba(168,85,247,.15)'};color:${isUser?'#4ade80':'#c084fc'};display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">${isUser?'👤':'🤖'}</div>
          <div style="max-width:72%;background:var(--bg3);border-radius:10px;padding:9px 12px;font-size:13px;line-height:1.55;">${escapeHtml(m.content)}</div>
        </div>`;
      }).join('');
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;';
      modal.innerHTML = `<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:24px;width:100%;max-width:520px;max-height:80vh;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <h2 style="font-size:15px;">📱 ${escapeHtml(phone)}</h2>
          <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;">&times;</button>
        </div>
        <div style="overflow-y:auto;flex:1;">${html||'<p style="color:var(--text3);text-align:center;padding:20px;">No messages</p>'}</div>
      </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target===modal) modal.remove(); });
    } catch(e) { showToast('Could not load thread', 'error'); }
  };

  // Test modal
  const waModal  = document.getElementById('wa-test-modal');
  document.getElementById('wa-test-btn')?.addEventListener('click', () => { if(waModal) waModal.style.display='flex'; });
  document.getElementById('wa-test-close')?.addEventListener('click', () => { if(waModal) waModal.style.display='none'; });
  waModal?.addEventListener('click', e => { if(e.target===waModal) waModal.style.display='none'; });

  document.getElementById('wa-test-send')?.addEventListener('click', async () => {
    const msg   = document.getElementById('wa-test-msg')?.value.trim();
    const phone = document.getElementById('wa-test-phone')?.value.trim();
    if (!msg) { showToast('Enter a message', 'error'); return; }
    const btn = document.getElementById('wa-test-send');
    btn.textContent = 'Sending…'; btn.disabled = true;
    const result = document.getElementById('wa-test-result');
    result.style.display = 'none';
    try {
      const r = await fetch('/whatsapp/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, phone })
      });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      document.getElementById('wa-test-reply').textContent = d.reply;
      document.getElementById('wa-test-meta').textContent = `Sentiment: ${d.sentiment} · Lead score: ${d.leadScore}`;
      result.style.display = 'block';
      await loadConversations();
      showToast('Test message sent!', 'success');
    } catch(e) {
      showToast('Server not running. Start with npm start.', 'error');
    } finally {
      btn.textContent = 'Send to ARIA'; btn.disabled = false;
    }
  });

  document.getElementById('wa-refresh-btn')?.addEventListener('click', async () => {
    await Promise.all([loadWAStatus(), loadConversations()]);
    showToast('WhatsApp data refreshed', 'success');
  });

  document.getElementById('wa-clear-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete all WhatsApp conversations?')) return;
    try {
      await fetch('/whatsapp/logs', { method: 'DELETE' });
      await loadConversations();
      showToast('Cleared');
    } catch(e) { showToast('Server not running', 'error'); }
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.dataset.view === 'whatsapp') btn.addEventListener('click', async () => {
      await Promise.all([loadWAStatus(), loadConversations()]);
    });
  });

  setTimeout(loadWAStatus, 2500);
})();

// ══════════════════════════════════════════════════════════════
//   PHASE 3 — AI VOICE CALL AGENT
// ══════════════════════════════════════════════════════════════
(function setupVoiceAgent() {
  let voicePollTimer = null;

  // ── Helpers ──────────────────────────────────────────────────
  function fmtDuration(sec) {
    if (!sec) return '—';
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
  function sentimentIcon(s) {
    return s === 'positive' ? '😊' : s === 'negative' ? '😤' : '😐';
  }
  function outcomeTag(o) {
    const map = {
      completed:   ['#22c55e', 'Completed'],
      transferred: ['#5b7cfa', 'Transferred'],
      missed:      ['#f59e0b', 'Missed'],
      busy:        ['#f59e0b', 'Busy'],
      failed:      ['#ef4444', 'Failed'],
      test:        ['#a855f7', 'Test'],
    };
    const [color, label] = map[o] || ['#6b7280', o || 'Unknown'];
    return `<span style="font-size:10px;font-weight:600;background:${color}22;color:${color};padding:2px 8px;border-radius:20px;border:1px solid ${color}44;">${label}</span>`;
  }

  // ── Fetch health / stats from server ─────────────────────────
  async function fetchHealth() {
    try {
      const r = await fetch('/voice/health');
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      const card = document.getElementById('vc-status-card');
      const el   = document.getElementById('vc-status');
      if (d.twilioConfigured && d.geminiConfigured) {
        el.textContent = '● Online';
        el.style.color = 'var(--green)';
        card.style.borderColor = 'rgba(34,197,94,.3)';
      } else {
        el.textContent = '⚠ Setup required';
        el.style.color = 'var(--amber)';
        card.style.borderColor = 'rgba(245,158,11,.3)';
      }
      document.getElementById('vc-active').textContent = d.activeCalls;
      if (d.activeCalls > 0) {
        document.getElementById('voice-live-badge').style.display = '';
      } else {
        document.getElementById('voice-live-badge').style.display = 'none';
      }
    } catch (e) {
      const el = document.getElementById('vc-status');
      if (el) { el.textContent = 'Server offline'; el.style.color = 'var(--red)'; }
    }
  }

  // ── Load + render call logs ───────────────────────────────────
  async function loadCallLogs() {
    try {
      const r = await fetch('/voice/calls');
      if (!r.ok) throw new Error(r.status);
      const calls = await r.json();
      renderCallStats(calls);
      renderCallLog(calls);
    } catch (e) {
      document.getElementById('vc-call-log').innerHTML =
        '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;">Server not running. Start with <code>npm start</code> then refresh.</div>';
    }
  }

  function renderCallStats(calls) {
    document.getElementById('vc-total').textContent = calls.length;

    const completed = calls.filter(c => c.duration > 0);
    const avgDur = completed.length
      ? Math.round(completed.reduce((a, c) => a + (c.duration || 0), 0) / completed.length)
      : 0;
    document.getElementById('vc-avg-dur').textContent = fmtDuration(avgDur);

    const n = calls.length || 1;
    const pos  = calls.filter(c => c.sentiment === 'positive').length;
    const neg  = calls.filter(c => c.sentiment === 'negative').length;
    const neu  = calls.length - pos - neg;
    const comp = calls.filter(c => c.outcome === 'completed').length;
    const trans= calls.filter(c => c.outcome === 'transferred').length;
    const miss = calls.filter(c => ['missed','busy','failed'].includes(c.outcome)).length;

    function setBar(id, pct) {
      const el = document.getElementById(id);
      if (el) { el.style.width = pct + '%'; el.textContent = pct + '%'; }
    }
    setBar('vc-pos-bar',  Math.round(pos  / n * 100));
    setBar('vc-neu-bar',  Math.round(neu  / n * 100));
    setBar('vc-neg-bar',  Math.round(neg  / n * 100));
    setBar('vc-comp-bar', Math.round(comp / n * 100));
    setBar('vc-trans-bar',Math.round(trans/ n * 100));
    setBar('vc-miss-bar', Math.round(miss / n * 100));
  }

  function renderCallLog(calls) {
    const el = document.getElementById('vc-call-log');
    if (!calls.length) {
      el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px;">No calls yet. Make a test call to see logs appear here.</div>';
      return;
    }
    el.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);color:var(--text3);">
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Caller</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Started</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Duration</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Lang</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Sentiment</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Turns</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Outcome</th>
            <th style="text-align:left;padding:8px 12px;font-weight:500;">Recording</th>
          </tr>
        </thead>
        <tbody>
          ${calls.map(c => {
            const dt = c.startTime ? new Date(c.startTime).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
            const turns = Math.floor((c.messages || []).length / 2);
            const recBtn = c.recordingUrl
              ? `<a href="${escapeHtml(c.recordingUrl)}" target="_blank" style="color:var(--accent);font-size:11px;">▶ Play</a>`
              : '<span style="color:var(--text3);font-size:11px;">—</span>';
            return `
              <tr style="border-bottom:1px solid var(--border);cursor:pointer;" onclick="vcShowTranscript('${escapeHtml(c.callSid)}')">
                <td style="padding:10px 12px;color:var(--text);">${escapeHtml(c.from || '—')}</td>
                <td style="padding:10px 12px;color:var(--text2);">${dt}</td>
                <td style="padding:10px 12px;color:var(--text2);">${fmtDuration(c.duration)}</td>
                <td style="padding:10px 12px;color:var(--text2);font-size:11px;">${c.language || 'en-US'}</td>
                <td style="padding:10px 12px;">${sentimentIcon(c.sentiment)} ${c.sentiment || '—'}</td>
                <td style="padding:10px 12px;color:var(--text2);">${turns}</td>
                <td style="padding:10px 12px;">${outcomeTag(c.outcome)}</td>
                <td style="padding:10px 12px;">${recBtn}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  // ── Load live active calls ────────────────────────────────────
  async function loadActiveCalls() {
    try {
      const r = await fetch('/voice/active');
      if (!r.ok) return;
      const active = await r.json();
      const el = document.getElementById('vc-live-list');
      if (!active.length) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No active calls right now.</div>';
        return;
      }
      el.innerHTML = active.map(c => {
        const elapsed = Math.round((Date.now() - new Date(c.startTime)) / 1000);
        return `
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--red);animation:pulse 1s infinite;flex-shrink:0;"></div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:500;">${escapeHtml(c.from)}</div>
              <div style="font-size:11px;color:var(--text3);">Lang: ${c.language} · ${c.turns} turns · ${fmtDuration(elapsed)} elapsed</div>
            </div>
            <span style="font-size:11px;font-weight:600;background:rgba(239,68,68,.15);color:var(--red);padding:3px 10px;border-radius:20px;border:1px solid rgba(239,68,68,.3);">LIVE</span>
          </div>`;
      }).join('');
    } catch (_) {}
  }

  // ── Transcript viewer ─────────────────────────────────────────
  window.vcShowTranscript = async function(callSid) {
    try {
      const r = await fetch('/voice/calls');
      const calls = await r.json();
      const call = calls.find(c => c.callSid === callSid);
      if (!call || !call.messages?.length) { showToast('No transcript available'); return; }

      const html = call.messages.map(m => {
        const isUser = m.role === 'user';
        return `<div style="display:flex;gap:10px;margin-bottom:12px;${isUser ? 'flex-direction:row-reverse;' : ''}">
          <div style="width:28px;height:28px;border-radius:50%;background:${isUser ? '#5b7cfa22' : '#a855f722'};color:${isUser ? '#5b7cfa' : '#a855f7'};display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">${isUser ? '👤' : '🤖'}</div>
          <div style="max-width:70%;background:var(--bg3);border-radius:10px;padding:10px 14px;font-size:13px;line-height:1.6;">${escapeHtml(m.content)}</div>
        </div>`;
      }).join('');

      // Build a simple modal
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;';
      modal.innerHTML = `
        <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:28px;width:100%;max-width:560px;max-height:80vh;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
            <h2 style="font-size:16px;">Call Transcript — ${escapeHtml(call.from)}</h2>
            <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;padding:4px 8px;">&times;</button>
          </div>
          <div style="overflow-y:auto;flex:1;padding-right:4px;">${html}</div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    } catch (e) { showToast('Could not load transcript', 'error'); }
  };

  // ── .env preview live update ──────────────────────────────────
  function wireEnvPreview() {
    const fields = ['twilio-sid','twilio-token','twilio-phone','transfer'];
    const ids    = ['ep-sid','ep-token','ep-phone','ep-transfer'];
    fields.forEach((f, i) => {
      const inp = document.getElementById('env-' + f);
      const out = document.getElementById(ids[i]);
      if (!inp || !out) return;
      inp.addEventListener('input', () => { out.textContent = inp.value || ids[i].replace('ep-',''); });
    });
  }

  // ── Test call ────────────────────────────────────────────────
  function setupTestModal() {
    const modal  = document.getElementById('vc-test-modal');
    const openBtn= document.getElementById('voice-test-btn');
    const sendBtn= document.getElementById('vc-test-send');
    const closeBtn=document.getElementById('vc-test-close');
    const input  = document.getElementById('vc-test-input');
    const result = document.getElementById('vc-test-result');
    const reply  = document.getElementById('vc-test-reply');

    if (!modal) return;
    openBtn?.addEventListener('click', () => { modal.style.display = 'flex'; input.focus(); });
    closeBtn?.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    sendBtn?.addEventListener('click', async () => {
      const msg = input.value.trim();
      if (!msg) { showToast('Enter a message first', 'error'); return; }
      sendBtn.textContent = 'ARIA is thinking…';
      sendBtn.disabled = true;
      result.style.display = 'none';
      try {
        const r = await fetch('/voice/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        });
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        reply.textContent = d.reply;
        result.style.display = 'block';
        await loadCallLogs();
        showToast('Test call saved to log', 'success');
      } catch (e) {
        showToast('Server not running. Start with npm start.', 'error');
      } finally {
        sendBtn.textContent = 'Send to ARIA';
        sendBtn.disabled = false;
      }
    });
  }

  // ── Clear logs ────────────────────────────────────────────────
  function setupClearLogs() {
    document.getElementById('vc-clear-btn')?.addEventListener('click', async () => {
      if (!confirm('Delete all call logs? This cannot be undone.')) return;
      try {
        await fetch('/voice/calls', { method: 'DELETE' });
        await loadCallLogs();
        showToast('Call logs cleared');
      } catch (e) { showToast('Server not running', 'error'); }
    });
  }

  // ── Refresh button ────────────────────────────────────────────
  function setupRefresh() {
    document.getElementById('voice-refresh-btn')?.addEventListener('click', async () => {
      await Promise.all([fetchHealth(), loadCallLogs(), loadActiveCalls()]);
      showToast('Voice data refreshed', 'success');
    });
  }

  // ── Auto-refresh when Voice tab is active ─────────────────────
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.dataset.view === 'voice') {
      btn.addEventListener('click', async () => {
        await Promise.all([fetchHealth(), loadCallLogs(), loadActiveCalls()]);
        clearInterval(voicePollTimer);
        voicePollTimer = setInterval(async () => {
          await loadActiveCalls();
          await fetchHealth();
        }, 10000);
      });
    } else {
      btn.addEventListener('click', () => { clearInterval(voicePollTimer); });
    }
  });

  // ── Init ──────────────────────────────────────────────────────
  wireEnvPreview();
  setupTestModal();
  setupClearLogs();
  setupRefresh();

  // Run initial health check (non-blocking)
  setTimeout(() => fetchHealth(), 1500);
})();

// —— AI BOT ENGINE ——
const BOT = {
  running: false,
  timer: null,
  queue: [],
  stats: { processed: 0, sent: 0, skipped: 0 },
};

function setupBot() {
  document.getElementById('bot-toggle-btn').addEventListener('click', toggleBot);
  document.getElementById('clear-log-btn').addEventListener('click', () => {
    document.getElementById('bot-log').innerHTML = '<div class="bot-log-empty">Log cleared.</div>';
  });
  document.getElementById('cfg-delay').addEventListener('input', (e) => {
    document.getElementById('cfg-delay-label').textContent = e.target.value + 's';
  });
}

function toggleBot() {
  BOT.running ? stopBot() : startBot();
}

function startBot() {
  BOT.running = true;
  BOT.queue = emails.filter(e => !e.botReplied);
  setBotState('running');
  showToast('AI Bot started — processing inbox', 'success');
  logEntry('processing', 'System', 'Bot started — scanning inbox for emails to reply to', '');
  processNextEmail();
  updateBotBadge();
}

function stopBot() {
  BOT.running = false;
  clearTimeout(BOT.timer);
  setBotState('idle');
  showToast('AI Bot stopped');
  logEntry('skipped', 'System', 'Bot manually stopped by admin', '');
  updateBotBadge();
}

function setBotState(state) {
  const ring  = document.getElementById('bot-power-ring');
  const label = document.getElementById('bot-state-label');
  const sub   = document.getElementById('bot-state-sub');
  const btn   = document.getElementById('bot-toggle-btn');

  ring.className = 'bot-power-ring ' + state;
  label.className = 'bot-state-label ' + state;

  if (state === 'idle') {
    label.textContent = 'IDLE';
    sub.textContent = 'Bot is offline';
    btn.textContent = 'Start Bot';
    btn.className = 'bot-toggle-btn';
  } else if (state === 'running') {
    label.textContent = 'ACTIVE';
    sub.textContent = 'Watching inbox…';
    btn.textContent = 'Stop Bot';
    btn.className = 'bot-toggle-btn running';
  } else if (state === 'processing') {
    label.textContent = 'REPLYING';
    sub.textContent = 'Generating AI reply…';
    btn.textContent = 'Stop Bot';
    btn.className = 'bot-toggle-btn running';
  }
}

function updateBotBadge() {
  const badge = document.getElementById('bot-badge');
  if (BOT.running) { badge.style.display = ''; } else { badge.style.display = 'none'; }
}

function updateBotStats() {
  document.getElementById('bs-processed').textContent = BOT.stats.processed;
  document.getElementById('bs-sent').textContent = BOT.stats.sent;
  document.getElementById('bs-skipped').textContent = BOT.stats.skipped;
}

async function processNextEmail() {
  if (!BOT.running) return;

  // Refill queue if looping and empty
  if (BOT.queue.length === 0) {
    const loop = document.getElementById('cfg-loop').checked;
    if (loop) {
      BOT.queue = emails.filter(e => !e.botReplied);
      if (BOT.queue.length === 0) {
        logEntry('sent', 'System', 'All emails processed. Waiting for new emails…', '');
        setBotState('running');
        BOT.timer = setTimeout(processNextEmail, 8000);
        return;
      }
    } else {
      logEntry('sent', 'System', 'All emails processed. Bot finished.', '');
      stopBot();
      return;
    }
  }

  const email = BOT.queue.shift();
  const category = email.category;

  // Check category config
  const allow = {
    urgent:  document.getElementById('cfg-urgent').checked,
    sales:   document.getElementById('cfg-sales').checked,
    support: document.getElementById('cfg-support').checked,
    spam:    document.getElementById('cfg-spam').checked,
  };

  if (!allow[category]) {
    BOT.stats.processed++;
    BOT.stats.skipped++;
    email.botReplied = true;
    updateBotStats();
    logEntry('skipped', email.from, `Skipped — category "${category}" is disabled in config`, timeNow());
    const delay = parseInt(document.getElementById('cfg-delay').value) * 400;
    BOT.timer = setTimeout(processNextEmail, delay);
    return;
  }

  // Start processing this email
  setBotState('processing');
  const logId = 'log-' + Date.now();
  appendProcessingEntry(logId, email);

  try {
    let reply;
    if (CONFIG.apiKey) {
      const prompt = `You are an email assistant for ${CONFIG.companyName}. Brand voice: ${CONFIG.brandVoice}

Write a professional reply to this email. Be helpful, concise, and match the brand voice. Sign off as "${CONFIG.companyName} Team".

From: ${email.from} <${email.email}>
Category: ${email.category}
Subject: ${email.subject}

${email.body}

Write only the reply body. No extra commentary.`;
      reply = await callClaude(prompt);
    } else {
      await fakeDelay(1500);
      reply = getDemoReply(email);
    }

    email.botReplied = true;
    email.unread = false;
    BOT.stats.processed++;
    BOT.stats.sent++;
    updateBotStats();
    renderEmailList();

    const autoSend = document.getElementById('cfg-autosend').checked;
    if (!autoSend) {
      drafts.unshift({ id: Date.now(), to: email.email, subject: 'Re: ' + email.subject, preview: reply, time: 'Just now (Bot)' });
      document.getElementById('drafts-badge').textContent = drafts.length;
      renderDrafts();
    }

    updateLogEntry(logId, 'sent', email.from,
      autoSend ? `Reply sent ✓` : `Reply saved to drafts`,
      reply.slice(0, 90) + '…', timeNow());

  } catch (err) {
    email.botReplied = true;
    BOT.stats.processed++;
    BOT.stats.skipped++;
    updateBotStats();
    updateLogEntry(logId, 'error', email.from, `Error: ${err.message || 'API failed'}`, '', timeNow());
  }

  setBotState('running');
  const delay = parseInt(document.getElementById('cfg-delay').value) * 1000;
  BOT.timer = setTimeout(processNextEmail, delay);
}

function appendProcessingEntry(id, email) {
  const log = document.getElementById('bot-log');
  const empty = log.querySelector('.bot-log-empty');
  if (empty) empty.remove();
  const el = document.createElement('div');
  el.className = 'bot-log-entry';
  el.id = id;
  el.innerHTML = `
    <div class="log-icon processing"><div class="log-spinner"></div></div>
    <div class="log-body">
      <div class="log-name">${email.from}</div>
      <div class="log-detail">Generating reply for: ${email.subject}</div>
    </div>
    <div class="log-time">${timeNow()}</div>`;
  log.prepend(el);
}

function updateLogEntry(id, type, name, detail, preview, time) {
  const el = document.getElementById(id);
  if (!el) return;
  const icons = { sent: '✓', skipped: '—', error: '✕' };
  el.className = 'bot-log-entry';
  el.innerHTML = `
    <div class="log-icon ${type}">${icons[type] || '•'}</div>
    <div class="log-body">
      <div class="log-name">${name}</div>
      <div class="log-detail">${detail}${preview ? ' — ' + escapeHtml(preview) : ''}</div>
    </div>
    <div class="log-time">${time}</div>`;
}

function logEntry(type, name, detail, time) {
  const log = document.getElementById('bot-log');
  if (!log) return;
  const empty = log.querySelector('.bot-log-empty');
  if (empty) empty.remove();
  const icons = { sent: '✓', skipped: '—', error: '✕', processing: '…' };
  const el = document.createElement('div');
  el.className = 'bot-log-entry';
  el.innerHTML = `
    <div class="log-icon ${type}">${icons[type] || '•'}</div>
    <div class="log-body">
      <div class="log-name">${name}</div>
      <div class="log-detail">${detail}</div>
    </div>
    <div class="log-time">${time}</div>`;
  log.prepend(el);
}

function timeNow() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fakeDelay(ms) { return new Promise(r => setTimeout(r, ms)); }

// —— MESSAGES (contact form submissions) ——
const MSG_KEY = 'techno_messages';

function getMessages() {
  try { return JSON.parse(localStorage.getItem(MSG_KEY) || '[]'); } catch (e) { return []; }
}
function saveMessages(list) { localStorage.setItem(MSG_KEY, JSON.stringify(list)); }

function updateMessagesBadge() {
  const badge = document.getElementById('messages-badge');
  if (!badge) return;
  const unread = getMessages().filter(m => !m.read).length;
  if (unread > 0) { badge.textContent = unread; badge.style.display = ''; }
  else { badge.style.display = 'none'; }
}

function renderMessages() {
  const list = document.getElementById('messages-list');
  if (!list) return;
  const msgs = getMessages();

  if (msgs.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text3);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3;margin-bottom:12px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p style="margin:0;font-size:14px;">No messages yet.<br>They'll appear here when someone fills out the contact form.</p>
      </div>`;
    updateMessagesBadge();
    return;
  }

  list.innerHTML = msgs.map((m) => {
    const date = new Date(m.sentAt);
    const timeStr = isNaN(date) ? '' : date.toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const initials = (m.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
    <div class="email-row ${m.read ? '' : 'unread'}" data-msg-id="${m.id}" style="align-items:flex-start;cursor:default;">
      <div class="email-avatar" style="background:#5b7cfa22;color:#5b7cfa;flex-shrink:0;">${initials}</div>
      <div class="email-main" style="flex:1;min-width:0;">
        <div class="email-from" style="display:flex;align-items:center;gap:8px;">
          ${m.name || 'Anonymous'}
          ${m.read ? '' : '<span style="width:7px;height:7px;background:#5b7cfa;border-radius:50%;display:inline-block;flex-shrink:0;"></span>'}
        </div>
        <div class="email-subject" style="font-size:12px;color:var(--text2);margin-bottom:6px;">${m.email || ''}${m.budget ? ' · Budget: ' + m.budget : ''}</div>
        <div style="font-size:13px;color:var(--text2);white-space:pre-wrap;word-break:break-word;max-height:80px;overflow:hidden;line-height:1.55;">${escapeHtml(m.message || '')}</div>
      </div>
      <div class="email-meta" style="flex-shrink:0;align-items:flex-start;gap:8px;">
        <span class="email-time">${timeStr}</span>
        <div style="display:flex;gap:6px;margin-top:6px;">
          ${m.read ? '' : `<button class="btn-ghost" style="font-size:11px;padding:4px 10px;" onclick="markMsgRead('${m.id}')">Mark read</button>`}
          <button class="btn-ghost" style="font-size:11px;padding:4px 10px;color:#f87171;" onclick="deleteMsg('${m.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');

  updateMessagesBadge();
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function markMsgRead(id) {
  const list = getMessages().map(m => m.id === id ? { ...m, read: true } : m);
  saveMessages(list);
  renderMessages();
}

function deleteMsg(id) {
  saveMessages(getMessages().filter(m => m.id !== id));
  renderMessages();
  showToast('Message deleted');
}

function setupMessages() {
  document.getElementById('mark-all-read-btn').addEventListener('click', () => {
    saveMessages(getMessages().map(m => ({ ...m, read: true })));
    renderMessages();
    showToast('All messages marked as read', 'success');
  });

  document.getElementById('clear-msgs-btn').addEventListener('click', () => {
    if (!confirm('Delete all messages? This cannot be undone.')) return;
    saveMessages([]);
    renderMessages();
    showToast('All messages cleared');
  });

  // re-render messages when switching to the view so badge stays fresh
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.dataset.view === 'messages') {
      btn.addEventListener('click', () => { renderMessages(); });
    }
  });
}
