/* ============================================================
   TECHNO — data layer
   ------------------------------------------------------------
   Talks to the backend API (/api/leads) when a server is
   running, and transparently falls back to localStorage when
   it isn't (e.g. opened as a plain file, or the design preview).
   All methods are async.
   ============================================================ */
window.TechnoStore = (function () {
  const KEY = 'techno_leads';
  const API = '/api/leads';
  // In the design preview the built-in assistant exists — stay on
  // localStorage there so we don't fire requests at a non-existent API.
  const PREVIEW = !!(window.claude && window.claude.complete);

  function lread() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function lwrite(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function mkLead(type, data) {
    return {
      id: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type, data: data || {}, createdAt: new Date().toISOString()
    };
  }
  function isJson(res) {
    return res && res.ok && (res.headers.get('content-type') || '').includes('application/json');
  }

  return {
    async saveLead(type, data) {
      if (!PREVIEW) {
        try {
          const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data })
          });
          if (isJson(res)) return await res.json();
        } catch (e) { /* fall through to localStorage */ }
      }
      const lead = mkLead(type, data);
      const list = lread(); list.unshift(lead); lwrite(list);
      return lead;
    },

    async getLeads() {
      if (!PREVIEW) {
        try {
          const res = await fetch(API);
          if (isJson(res)) return await res.json();
        } catch (e) { /* fall through */ }
      }
      return lread();
    },

    async clearLeads() {
      if (!PREVIEW) {
        try {
          const res = await fetch(API, { method: 'DELETE' });
          if (res && res.ok) return true;
        } catch (e) { /* fall through */ }
      }
      lwrite([]);
      return true;
    },

    async countLeads() { return (await this.getLeads()).length; }
  };
})();
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

/* ---------- Contact form — save enquiry to server ---------- */
(function () {
  const form = document.querySelector('.form');
  if (!form) return;
  const msgEl = form.querySelector('.form-msg');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name:    form.querySelector('#name')?.value.trim()    || '',
      email:   form.querySelector('#email')?.value.trim()   || '',
      budget:  form.querySelector('#budget')?.value.trim()  || '',
      message: form.querySelector('#message')?.value.trim() || '',
    };
    if (!data.name || !data.email || !data.message) return;

    // UI: loading state
    if (submitBtn) submitBtn.disabled = true;
    if (msgEl) { msgEl.textContent = 'Sending…'; msgEl.style.color = ''; }

    // Save to server messages store
    let ok = false;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, budget: data.budget, message: data.message, source: 'contact' })
      });
      ok = res.ok;
    } catch (_) {}

    if (msgEl) {
      if (ok) {
        msgEl.style.color = '#4ade80';
        msgEl.textContent = '✓ Message received — we\'ll be in touch within 48 hours.';
      } else {
        msgEl.style.color = '';
        msgEl.textContent = 'Could not send right now. Please email cgwofficialai@gmail.com.';
      }
    }

    if (ok) form.reset();
    if (submitBtn) submitBtn.disabled = false;
  });
})();
/* ============================================================
   TECHNO — home page: 3D CardSwap (requires GSAP + site.js)
   ============================================================ */

/* ============================================================
   CARDSWAP — vanilla GSAP port
   ============================================================ */
function initCardSwap(stage, opts) {
  const cards = Array.from(stage.querySelectorAll('.swap-card'));
  if (!cards.length || typeof gsap === 'undefined') return;

  const {
    cardDistance = 50,
    verticalDistance = 50,
    delay = 4000,
    skewAmount = 4,
    pauseOnHover = true
  } = opts || {};

  const cfg = {
    ease: 'elastic.out(0.6,0.9)',
    durDrop: 2, durMove: 2, durReturn: 2,
    promoteOverlap: 0.9, returnDelay: 0.05
  };

  const total = cards.length;
  const makeSlot = (i) => ({
    x: i * cardDistance,
    y: -i * verticalDistance,
    z: -i * cardDistance * 1.5,
    zIndex: total - i
  });
  const placeNow = (el, slot) => gsap.set(el, {
    x: slot.x, y: slot.y, z: slot.z,
    xPercent: -50, yPercent: -50,
    skewY: skewAmount, transformOrigin: 'center center',
    zIndex: slot.zIndex, force3D: true
  });

  let order = cards.map((_, i) => i);
  cards.forEach((el, i) => placeNow(el, makeSlot(i)));

  let tl = null;
  let interval = null;
  let busy = false;

  function swap() {
    if (order.length < 2 || busy) return;
    busy = true;
    const [front, ...rest] = order;
    const elFront = cards[front];
    tl = gsap.timeline();

    tl.to(elFront, { y: '+=500', duration: cfg.durDrop, ease: cfg.ease });
    tl.addLabel('promote', `-=${cfg.durDrop * cfg.promoteOverlap}`);

    rest.forEach((idx, i) => {
      const el = cards[idx];
      const slot = makeSlot(i);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: cfg.durMove, ease: cfg.ease },
        `promote+=${i * 0.15}`);
    });

    const backSlot = makeSlot(total - 1);
    tl.addLabel('return', `promote+=${cfg.durMove * cfg.returnDelay}`);
    tl.call(() => gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, 'return');
    tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: cfg.durReturn, ease: cfg.ease }, 'return');
    tl.call(() => { order = [...rest, front]; busy = false; });
  }

  function start() { stop(); interval = window.setInterval(swap, delay); }
  function stop() { clearInterval(interval); }
  start();

  // Click any card to advance now, then restart the auto-timer
  cards.forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { swap(); start(); });
  });

  if (pauseOnHover) {
    stage.addEventListener('mouseenter', () => { stop(); });
    stage.addEventListener('mouseleave', () => { start(); });
  }
}

window.addEventListener('load', () => {
  const stage = document.querySelector('.swap-stage__inner');
  if (stage) initCardSwap(stage, { cardDistance: 44, verticalDistance: 44, delay: 3000, skewAmount: 4 });
});

/* ============================================================
   CEO PAGE — Animation 3 scroll sequence
   ============================================================ */
(function ceoScrollAnimation() {
  const TOTAL = 120;
  const PATH  = '/images/ceo-sequence/';

  const canvas = document.getElementById('ceo-canvas');
  const loader = document.getElementById('ceo-loader');
  const fill   = document.getElementById('ceo-loader__fill');
  const pct    = document.getElementById('ceo-loader__pct');
  const wrap   = document.getElementById('ceo-scroll-wrap');

  if (!canvas || !wrap) return;

  const ctx    = canvas.getContext('2d');
  const images = new Array(TOTAL);
  let loaded   = 0;
  let current  = -1;

  function drawFrame(idx) {
    const img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width, ch = rect.height;
    const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* object-fit: cover — fill entire viewport, crop to center */
    const ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
    let sx, sy, sw, sh;
    if (ir > cr) {
      sh = img.naturalHeight; sw = sh * cr;
      sx = (img.naturalWidth - sw) / 2; sy = 0;
    } else {
      sw = img.naturalWidth; sh = sw / cr;
      sx = 0; sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  function onScroll() {
    if (loaded < TOTAL) return;
    const scrolled  = -wrap.getBoundingClientRect().top;
    const maxScroll = wrap.offsetHeight - window.innerHeight;
    const progress  = Math.max(0, Math.min(1, scrolled / maxScroll));
    const idx       = Math.round(progress * (TOTAL - 1));
    if (idx !== current) { current = idx; drawFrame(idx); }
  }

  for (let i = 0; i < TOTAL; i++) {
    const img = new Image();
    img.src   = PATH + (i + 1) + '.jpg';
    const cap = i;
    img.onload = img.onerror = function () {
      loaded++;
      const p = Math.round((loaded / TOTAL) * 100);
      if (fill) fill.style.width = p + '%';
      if (pct)  pct.textContent  = p + '%';
      if (loaded === TOTAL) {
        if (loader) loader.style.display = 'none';
        drawFrame(0); current = 0;
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => drawFrame(current < 0 ? 0 : current));
        onScroll();
      }
    };
    images[cap] = img;
  }
})();

/* ============================================================
   SPLINE HERO — lazy, non-blocking load + pause when off-screen
   ============================================================ */
(function splineHero() {
  const stage = document.getElementById('splineStage');
  if (!stage) return;
  const url = stage.dataset.splineUrl;
  if (!url) return;

  const RUNTIME = 'https://unpkg.com/@splinetool/viewer@1.9.28/build/spline-viewer.js';
  let viewer = null;
  let mounted = false;

  function loadRuntime() {
    if (window.customElements && customElements.get('spline-viewer')) return Promise.resolve();
    if (!window.__splineRuntimePromise) {
      window.__splineRuntimePromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.type = 'module';
        s.src = RUNTIME;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return window.__splineRuntimePromise;
  }

  function hideLogo() {
    const r = viewer && viewer.shadowRoot;
    if (!r) return;
    r.querySelectorAll('#logo,a[href*="spline"],[class*="logo"],[id*="logo"]')
      .forEach((el) => { el.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;'; });
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    loadRuntime().then(() => {
      viewer = document.createElement('spline-viewer');
      viewer.setAttribute('url', url);
      viewer.setAttribute('loading-anim-type', 'spinner-small-dark');
      stage.appendChild(viewer);
      viewer.addEventListener('load', () => { hideLogo(); setTimeout(hideLogo, 500); });
      [400, 1200, 2500].forEach((t) => setTimeout(hideLogo, t));
    }).catch(() => { mounted = false; });
  }

  function setPaused(paused) {
    stage.classList.toggle('is-paused', paused);
    if (!viewer) return;
    try { paused ? (viewer.pause && viewer.pause()) : (viewer.play && viewer.play()); } catch (e) {}
  }

  const mountIO = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { mount(); mountIO.disconnect(); }
  }, { rootMargin: '300px' });
  mountIO.observe(stage);

  const pauseIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => setPaused(!e.isIntersecting));
  }, { threshold: 0.01 });
  pauseIO.observe(stage);

  document.addEventListener('visibilitychange', () => setPaused(document.hidden));
})();

/* ============================================================
   USA LAUNCH TOAST
   ============================================================ */
(function usaLaunchToast() {
  if (sessionStorage.getItem('cgw_usa_seen')) return;

  const toast = document.createElement('div');
  toast.className = 'usa-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML =
    '<span class="usa-toast__flag">🇺🇸</span>' +
    '<div class="usa-toast__body">' +
      '<div class="usa-toast__label">Now Live &nbsp;·&nbsp; North America</div>' +
      '<div class="usa-toast__msg">CGW is officially live in the United States</div>' +
    '</div>' +
    '<button class="usa-toast__close" aria-label="Dismiss">✕</button>';

  document.body.appendChild(toast);

  let timer = setTimeout(dismiss, 8000);
  setTimeout(() => toast.classList.add('is-visible'), 700);

  function dismiss() {
    clearTimeout(timer);
    toast.classList.remove('is-visible');
    toast.classList.add('is-out');
    sessionStorage.setItem('cgw_usa_seen', '1');
    setTimeout(() => toast.remove(), 650);
  }

  toast.querySelector('.usa-toast__close').addEventListener('click', dismiss);
})();
