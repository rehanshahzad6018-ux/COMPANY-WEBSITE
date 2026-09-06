/* ============================================================
   TECHNO - home page: 3D CardSwap (requires GSAP + site.js)
   ============================================================ */

/* ============================================================
   CARDSWAP - vanilla GSAP port
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
