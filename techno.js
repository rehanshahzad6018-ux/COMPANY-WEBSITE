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
