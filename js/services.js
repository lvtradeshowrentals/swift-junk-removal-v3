/* SERVICES — pinned, scroll-scrubbed index with a chevron-wipe photo window.
   Wide + fine pointer + motion OK  -> pinned stage (this file drives it).
   Anything else / no JS            -> stacked cards (pure CSS; we only add the colour reveal on view). */
(function () {
  'use strict';
  const S = window.SWIFT, root = document.getElementById('services');
  if (!root || !S) return;
  const $ = (s, r) => (r || root).querySelector(s), $$ = (s, r) => Array.from((r || root).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const TAN = 0.5774;

  const track = $('#svcTrack'), stage = $('.sx-stage'), view = $('#svcView'), win = $('.sx-win', view);
  const items = $$('.sx-item'), layers = $$('.sx-layer', view), N = items.length;
  const hits = items.map((it) => $('.sx-hit', it));
  const frame = $('#svcFrame polyline'), rail = $('#svcRail'), ticks = $$('u', rail);
  const noEl = $('#svcNo'), capNo = $('#svcCapNo'), colEl = $('#svcCol');
  const mqWide = matchMedia('(min-width: 861px)'), mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- stacked mode: colour reveal when a card scrolls into view ---------- */
  const seenIO = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); seenIO.unobserve(e.target); } }), { threshold: .35 });
  items.forEach((it) => seenIO.observe(it));

  /* ---------- pinned mode ---------- */
  let pinned = false, vis = false, act = -1;
  let pos = 0, jump = null, jumpY = 0, jumpT = 0, lastScroll = 0, hoverT = 0;
  const lw = new Array(N).fill(-1), ls = new Array(N).fill(-1), lcv = new Array(N).fill(-1), sc = new Array(N).fill(0);
  let lastFw = -1, lastFo = -1, lastRp = -1, lastCol = -1;
  const pad2 = (n) => String(n).padStart(2, '0');
  const wantPin = () => mqWide.matches && !S.coarse && !mqReduce.matches;

  function mapP(p) {              // scroll progress 0..1 -> index position 0..N-1 with a dwell on every item
    const x = p * (N - 1), i = Math.min(N - 2, Math.floor(x)), f = x - i;
    const g = clamp((f - .28) / .44, 0, 1);
    return i + g * g * (3 - 2 * g);
  }
  function slotY(i) { const r = track.getBoundingClientRect(); return r.top + window.scrollY + (i / (N - 1)) * (track.offsetHeight - innerHeight); }

  function measure() {
    if (!pinned) return;
    const w = win.clientWidth, h = win.clientHeight, k = h / 2 * TAN;
    stage.style.setProperty('--k', k.toFixed(1) + 'px');
    frame.setAttribute('points', `${w},0 0,0 ${k.toFixed(1)},${(h / 2).toFixed(1)} 0,${h} ${w},${h}`);
  }

  function setActive(i) {
    if (i === act) return; act = i;
    items.forEach((it, j) => {
      const on = j === i; it.classList.toggle('on', on);
      const dt = it.querySelector('.sx-detail'); if (dt) dt.inert = !on;
      hits[j].setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    const t = pad2(i + 1); noEl.textContent = t; capNo.textContent = t;
  }

  function goTo(i) {
    if (!pinned) return;
    i = clamp(i, 0, N - 1);
    const y = slotY(i);
    jump = i; jumpY = y; jumpT = performance.now();
    if (S.lenis) S.lenis.scrollTo(y, { duration: 1.25, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function frameStep(t, dt) {
    if (!pinned || !vis) return;
    const p = S.track(track);
    const now = performance.now();
    if (jump !== null && (Math.abs(window.scrollY - jumpY) < 4 || now - jumpT > 2800)) jump = null;
    const tgt = jump !== null ? jump : mapP(p);
    pos += (tgt - pos) * (1 - Math.exp(-dt * (jump !== null ? 6 : 11)));
    if (Math.abs(tgt - pos) < .0006) pos = tgt;
    setActive(Math.round(clamp(tgt, 0, N - 1)));

    // wipes: layer i is revealed by pos crossing (i-1 .. i); the layer beneath dims as it is covered
    let fw = 0, fo = 0;
    for (let i = 0; i < N; i++) {
      if (i > 0) {
        const w = clamp(pos - (i - 1), 0, 1);
        if (Math.abs(w - lw[i]) > .0004) { layers[i].style.setProperty('--w', w.toFixed(4)); lw[i] = w; }
        if (w > .002 && w < .998) { fw = w; fo = Math.min(1, w * 14, (1 - w) * 14); }
      }
      const nx = i < N - 1 ? clamp(pos - i, 0, 1) : 0;
      if (Math.abs(nx - lcv[i]) > .0004) { layers[i].style.setProperty('--cv', nx.toFixed(4)); lcv[i] = nx; }
    }
    if (fw !== lastFw) { win.style.setProperty('--fw', fw.toFixed(4)); lastFw = fw; }
    if (Math.abs(fo - lastFo) > .002) { win.style.setProperty('--fo', fo.toFixed(3)); lastFo = fo; }

    // colour scan: the settled layer is revealed top-to-bottom; any other layer returns to monochrome
    const near = Math.round(pos), settled = Math.abs(pos - near) < .02 ? near : -1;
    for (let i = 0; i < N; i++) {
      const target = i === settled ? 1 : 0;
      if (target > sc[i]) sc[i] = Math.min(1, sc[i] + dt / 1.7); else if (target < sc[i]) sc[i] = Math.max(0, sc[i] - dt / .35);
      const s = Math.round(sc[i] * 1000) / 1000;
      if (s !== ls[i]) { layers[i].style.setProperty('--s', s); ls[i] = s; }
    }
    const col = Math.round((sc[Math.min(N - 1, Math.max(0, near))] || 0) * 100);
    if (col !== lastCol) { colEl.textContent = String(col).padStart(3, '0'); lastCol = col; }
    const rp = pos / (N - 1);
    if (Math.abs(rp - lastRp) > .0005) {
      rail.style.setProperty('--rp', rp.toFixed(4)); lastRp = rp;
      ticks.forEach((u, i) => u.classList.toggle('on', i <= pos + .02));
    }
  }
  S.raf(frameStep);

  /* ---------- interaction (pinned) ---------- */
  hits.forEach((h, i) => {
    h.addEventListener('click', () => goTo(i));
    h.addEventListener('keydown', (e) => {
      if (!pinned) return;
      const k = e.key;
      if (k === 'Enter' || k === ' ') { e.preventDefault(); goTo(i); }
      else if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); hits[Math.min(N - 1, i + 1)].focus(); }
      else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); hits[Math.max(0, i - 1)].focus(); }
      else if (k === 'Home') { e.preventDefault(); hits[0].focus(); }
      else if (k === 'End') { e.preventDefault(); hits[N - 1].focus(); }
    });
    // hover intent: only a real pointer move (not layout shifting under a still pointer), never while the page is scrolling
    items[i].addEventListener('pointermove', (e) => {
      if (!pinned || e.pointerType !== 'mouse' || (!e.movementX && !e.movementY)) return;
      if (i === act || performance.now() - lastScroll < 380) return;
      clearTimeout(hoverT); hoverT = setTimeout(() => { if (i !== act) goTo(i); }, 140);
    });
    items[i].addEventListener('pointerleave', () => clearTimeout(hoverT));
    // the active state follows focus (tab to an item or any control inside it)
    items[i].addEventListener('focusin', () => { if (pinned && i !== act) goTo(i); });
  });
  addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, () => { jump = null; }, { passive: true }));

  /* ---------- mode switch ---------- */
  function setPinned(on) {
    if (on === pinned) return; pinned = on;
    root.classList.toggle('sx--pin', on);
    if (on) {
      layers.forEach((l) => { $$('img', l).forEach((im) => { if (!im.getAttribute('src')) im.src = l.dataset.src; }); });
      hits.forEach((h, i) => {
        h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0');
        h.setAttribute('aria-controls', 'sx-d' + (i + 1));
      });
      act = -1; pos = mapP(S.track(track)); lw.fill(-1); ls.fill(-1); lcv.fill(-1);
      requestAnimationFrame(() => { measure(); setActive(Math.round(clamp(pos, 0, N - 1))); });
    } else {
      hits.forEach((h) => { ['role', 'tabindex', 'aria-expanded', 'aria-controls', 'aria-label'].forEach((a) => h.removeAttribute(a)); });
      items.forEach((it) => { it.classList.remove('on'); const dt = it.querySelector('.sx-detail'); if (dt) dt.inert = false; });
      jump = null;
    }
  }
  function evaluate() { setPinned(wantPin()); }
  evaluate();
  mqWide.addEventListener('change', evaluate); mqReduce.addEventListener('change', evaluate);
  addEventListener('resize', () => { measure(); });
  document.fonts && document.fonts.ready.then(measure);

  new IntersectionObserver((en) => { vis = en[0].isIntersecting; if (vis) measure(); }, { rootMargin: '200px 0px 200px 0px' }).observe(track);
})();
