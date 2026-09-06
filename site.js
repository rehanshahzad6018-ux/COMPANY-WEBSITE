/* ============================================================
   TECHNO - shared site interactions (all pages)
   ============================================================ */

/* ---------- Scroll reveal ---------- */
// Signal JS is available - reveal CSS only hides elements when this class is present
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

/* ---------- Contact form - sends to the server, which emails us ---------- */
(function () {
  const form = document.querySelector('.form');
  if (!form) return;

  const msgEl     = form.querySelector('.form-msg');
  const submitBtn = form.querySelector('button[type="submit"]');
  const labelEl   = submitBtn ? submitBtn.querySelector('.neon-btn__label') : null;
  // wireTypingButton() rebuilds the label as [text span][caret span]
  const textSpan  = labelEl ? (labelEl.firstElementChild || labelEl) : null;
  const idleText  = textSpan ? textSpan.textContent : '';
  const openedAt  = Date.now();
  let sending = false;

  const SUCCESS  = 'Message sent successfully. We\u2019ll get back to you shortly.';
  const FAILURE  = 'Something went wrong. Please try again or email us directly.';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function say(text, tone) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = tone === 'ok' ? '#1a7f37' : tone === 'error' ? '#c62828' : '';
  }

  function setSending(on) {
    sending = on;
    if (submitBtn) {
      // stop the neon typing animation so it cannot overwrite the label
      submitBtn.dispatchEvent(new MouseEvent('mouseleave'));
      submitBtn.disabled = on;
      submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
      submitBtn.style.opacity = on ? '0.6' : '';
      submitBtn.style.cursor  = on ? 'progress' : '';
    }
    if (textSpan) textSpan.textContent = on ? 'Sending\u2026' : idleText;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;

    const field = (sel) => form.querySelector(sel);
    const data = {
      name:    field('#name')?.value.trim()    || '',
      email:   field('#email')?.value.trim()   || '',
      budget:  field('#budget')?.value.trim()  || '',
      message: field('#message')?.value.trim() || '',
      company: field('#company')?.value.trim() || '',   // honeypot - must stay empty
      elapsed: Date.now() - openedAt,
    };

    // Validation
    if (data.name.length < 2) {
      say('Please enter your name.', 'error'); field('#name')?.focus(); return;
    }
    if (!EMAIL_RE.test(data.email)) {
      say('Please enter a valid email address.', 'error'); field('#email')?.focus(); return;
    }
    if (data.message.length < 5) {
      say('Please tell us a little about the project.', 'error'); field('#message')?.focus(); return;
    }

    setSending(true);
    say('Sending your message\u2026');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || ('http-' + res.status));
      say(SUCCESS, 'ok');
      form.reset();
    } catch (err) {
      console.error('[contact]', err.message);
      say(FAILURE, 'error');
    } finally {
      setSending(false);
    }
  });
})();
