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
   HOME PAGE — Scroll animation sequence (240 frames)

   Zones (progress 0 → 1 across 600 vh tunnel):
     0.00 – 0.88  frame scrub
     0.55 – 0.82  title fade + parallax
     0.72 – 1.00  exit transition (veil + canvas recession)
     0.96 – ∞     idle loop on global canvas behind sections
   ============================================================ */
(function homeScrollAnimation() {
  const TOTAL            = 240;
  const EXIT_START       = 0.72;
  const TITLE_FADE_START = 0.55;
  const TITLE_FADE_END   = 0.82;

  function framePath(i) {
    return 'animation/ezgif-frame-' + String(i + 1).padStart(3, '0') + '.jpg';
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ---- DOM ---- */
  const canvas       = document.getElementById('car-canvas');
  const loader       = document.getElementById('car-loader');
  const loaderFill   = document.getElementById('car-loader__fill');
  const loaderPct    = document.getElementById('car-loader__pct');
  const hintEl       = document.getElementById('car-scroll-hint');
  const progressBar  = document.getElementById('car-progress');
  const exitVeil     = document.getElementById('hero-exit-veil');
  const heroInner    = document.querySelector('.car-scroll-wrap .hero__inner');
  const wrap         = document.querySelector('.car-scroll-wrap');
  const globalCanvas = document.getElementById('global-canvas');
  const globalCtx    = globalCanvas ? globalCanvas.getContext('2d') : null;

  if (!canvas || !wrap) return;

  const ctx    = canvas.getContext('2d');
  const images = new Array(TOTAL);
  let loaded     = 0;
  let current    = -1;
  let hintHidden = false;
  let rafId      = null;
  let lastProg   = -1;

  /* ---- object-fit:cover draw — reusable for both canvases ---- */
  function drawTo(ctx2d, canvasEl, img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvasEl.getBoundingClientRect();
    const cw   = rect.width, ch = rect.height;
    const pw   = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    if (canvasEl.width !== pw || canvasEl.height !== ph) {
      canvasEl.width = pw; canvasEl.height = ph;
    }
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let sx, sy, sw, sh;
    if (ir > cr) {
      sh = img.naturalHeight; sw = sh * cr;
      sx = (img.naturalWidth - sw) / 2; sy = 0;
    } else {
      sw = img.naturalWidth; sh = sw / cr;
      sx = 0; sy = (img.naturalHeight - sh) / 2;
    }
    ctx2d.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  const drawFrame       = (idx) => drawTo(ctx, canvas, images[idx]);
  const drawFrameGlobal = (idx) => { if (globalCtx && globalCanvas) drawTo(globalCtx, globalCanvas, images[idx]); };

  /* ---- idle loop: ping-pongs last 20 frames at ~8 fps ---- */
  const IDLE_START = TOTAL - 20;
  let idleRaf      = null;
  let idleFrame    = TOTAL - 1;
  let idleDir      = -1;
  let lastIdleTime = 0;

  function runIdleLoop(ts) {
    idleRaf = requestAnimationFrame(runIdleLoop);
    if (ts - lastIdleTime < 125) return;
    lastIdleTime = ts;
    idleFrame += idleDir;
    if (idleFrame >= TOTAL - 1)  { idleFrame = TOTAL - 1;  idleDir = -1; }
    if (idleFrame <= IDLE_START) { idleFrame = IDLE_START; idleDir =  1; }
    drawFrameGlobal(idleFrame);
  }

  /* ---- all visual updates in one rAF write ---- */
  function applyVisuals(progress) {
    /* 1 — frame scrub capped at 88% so last frame holds during exit */
    const frameP = clamp01(progress / 0.88);
    const idx    = Math.round(frameP * (TOTAL - 1));
    if (idx !== current) { current = idx; drawFrame(idx); }

    /* 2 — neon progress bar */
    if (progressBar) progressBar.style.width = (progress * 100) + '%';

    /* 3 — scroll hint hides after 3% scroll */
    if (!hintHidden && progress > 0.03) {
      hintHidden = true;
      if (hintEl) hintEl.classList.add('hidden');
    }

    /* 4 — hero title: parallax rise + opacity fade */
    if (heroInner) {
      const fadeFrac = clamp01((progress - TITLE_FADE_START) / (TITLE_FADE_END - TITLE_FADE_START));
      heroInner.style.opacity   = (1 - easeInOutCubic(fadeFrac)).toFixed(3);
      heroInner.style.transform = `translateY(${-(progress * 60).toFixed(1)}px) translateZ(0)`;
    }

    /* 5 — exit: navy veil + canvas recession */
    const exitE = easeInOutCubic(clamp01((progress - EXIT_START) / (1 - EXIT_START)));
    if (exitVeil) exitVeil.style.opacity = (exitE * 0.88).toFixed(3);
    canvas.style.transform = `scale(${(1 - exitE * 0.06).toFixed(4)}) translateZ(0)`;
    canvas.style.opacity   = (1 - exitE * 0.25).toFixed(3);

    /* 6 — global canvas: mirror frame + fade in sync with exit veil */
    if (globalCanvas) {
      const gOpacity = clamp01((progress - EXIT_START) / (1 - EXIT_START));
      globalCanvas.style.opacity = gOpacity.toFixed(3);
      if (gOpacity > 0) drawFrameGlobal(idx);

      if (progress >= 0.96 && !idleRaf && loaded === TOTAL) {
        idleFrame = TOTAL - 1;
        idleRaf = requestAnimationFrame(runIdleLoop);
      }
      if (progress < 0.96 && idleRaf) {
        cancelAnimationFrame(idleRaf);
        idleRaf = null;
      }
    }
  }

  /* ---- scroll handler — dirty-checked, rAF-throttled ---- */
  function onScroll() {
    if (loaded < TOTAL || !wrap) return;
    const scrolled  = -wrap.getBoundingClientRect().top;
    const maxScroll = wrap.offsetHeight - window.innerHeight;
    const progress  = clamp01(scrolled / maxScroll);
    if (progress === lastProg) return;
    lastProg = progress;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => { applyVisuals(progress); rafId = null; });
  }

  /* ---- preload all 240 frames ---- */
  for (let i = 0; i < TOTAL; i++) {
    const img = new Image();
    img.src   = framePath(i);
    const cap = i;
    img.onload = img.onerror = function () {
      loaded++;
      const pct = Math.round((loaded / TOTAL) * 100);
      if (loaderFill) loaderFill.style.width = pct + '%';
      if (loaderPct)  loaderPct.textContent  = pct + '%';
      if (loaded === TOTAL) {
        if (loader) loader.style.display = 'none';
        drawFrame(0); current = 0;
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => {
          if (current >= 0) { drawFrame(current); drawFrameGlobal(current); }
        }, { passive: true });
        onScroll();
      }
    };
    images[cap] = img;
  }
})();

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
