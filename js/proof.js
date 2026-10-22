/* PROOF — chevron before/after compare. Pointer + touch + keyboard (role=slider on the grip).
   The "Items" readout and the line "erase" are derived from the drawing's own .junk groups. */
(function () {
  'use strict';
  const S = window.SWIFT, root = document.getElementById('proof');
  if (!root) return;
  const $ = (s, r) => (r || root).querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const TAN = 0.5774, NS = 'http://www.w3.org/2000/svg';
  const reduce = S ? S.reduce : matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ba = $('#pfBa'), before = $('#pfBefore'), grip = $('#pfGrip'), edge = $('.pf-edge', ba);
  const countEl = $('#pfCount'), ticksEl = $('#pfTicks'), nowEl = $('#pfNow'), allEl = $('#pfAll');
  const junk = Array.from(before.querySelectorAll('.junk'));
  const N = junk.length;
  const lines = ['e1', 'e2', 'e3'].map((c) => $('.' + c, edge));
  const OFFS = [0, 14, 28];

  let W = 0, H = 0, k = 0, v = 60, band = 120, cent = [], lastE = [], lastCount = -1, ticks = [];
  const pad2 = (n) => String(n).padStart(2, '0');

  if (N) {
    countEl.hidden = false; allEl.textContent = pad2(N);
    for (let i = 0; i < N; i++) { const t = document.createElement('i'); ticksEl.appendChild(t); ticks.push(t); }
  }

  /* label backgrounds: a small ink plate behind every drawing label so dimension lines break cleanly around the text */
  function plates(svg) {
    svg.querySelectorAll('rect[data-plate]').forEach((r) => r.remove());
    svg.querySelectorAll('text.g-lb').forEach((t) => {
      let b; try { b = t.getBBox(); } catch (e) { return; }
      const p = (parseFloat(svg.style.getPropertyValue('--fs')) || 12) * .32;
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('data-plate', ''); r.setAttribute('class', 'g-lbbg');
      r.setAttribute('x', b.x - p); r.setAttribute('y', b.y - p * .6); r.setAttribute('width', b.width + p * 2); r.setAttribute('height', b.height + p * 1.2);
      const tr = t.getAttribute('transform'); if (tr) r.setAttribute('transform', tr);
      t.parentNode.insertBefore(r, t);
    });
  }

  function measure() {
    const r = ba.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !H) return;
    k = H / 2 * TAN; band = Math.max(60, W * .095);
    ba.style.setProperty('--k', k.toFixed(1) + 'px');
    const svgs = Array.from(ba.querySelectorAll('.pf-svg'));
    let sc = 1, ox = 0, oy = 0;
    svgs.forEach((svg) => {
      const vb = svg.viewBox.baseVal; if (!vb || !vb.width) return;
      sc = Math.max(W / vb.width, H / vb.height); ox = (W - vb.width * sc) / 2; oy = (H - vb.height * sc) / 2;
      svg.style.setProperty('--sw', (1.15 / sc).toFixed(3));
      svg.style.setProperty('--fs', ((W < 700 ? 10 : 11.5) / sc).toFixed(2));
    });
    svgs.forEach(plates);
    cent = junk.map((g) => { let b; try { b = g.getBBox(); } catch (e) { return [0, 0]; } return [ox + (b.x + b.width / 2) * sc, oy + (b.y + b.height / 2) * sc]; });
    lastE = []; lastCount = -1;
    render();
  }

  function render() {
    if (!W) return;
    const X = v / 100 * (W + k);
    ba.style.setProperty('--x', X.toFixed(1) + 'px');
    lines.forEach((l, i) => { const o = OFFS[i]; l.setAttribute('points', `${(X - k - o).toFixed(1)},0 ${(X - o).toFixed(1)},${(H / 2).toFixed(1)} ${(X - k - o).toFixed(1)},${H.toFixed(1)}`); });
    // items: left of the chevron edge they are still "in the room"; just before it their lines retract
    let count = 0;
    for (let i = 0; i < N; i++) {
      const cx = cent[i][0], cy = cent[i][1];
      const ex = X - k * Math.abs(2 * cy / H - 1);
      const d = ex - cx;
      if (d > band * .5) count++;
      const e = reduce ? 0 : clamp(1 - d / band, 0, 1);
      const q = Math.round(e * 50) / 50;
      if (q !== lastE[i]) { junk[i].style.setProperty('--e', q); lastE[i] = q; }
    }
    if (count !== lastCount) {
      lastCount = count; nowEl.textContent = pad2(count);
      ticks.forEach((t, i) => t.classList.toggle('off', i >= count));
    }
    const rv = Math.round(v);
    grip.setAttribute('aria-valuenow', rv);
    grip.setAttribute('aria-valuetext', `${rv}% before, ${100 - rv}% after`);
  }
  function setV(n) { v = clamp(n, 0, 100); render(); }

  /* ---------- interaction ---------- */
  let dragging = false, sv = 0, spx = 0, introId = 0;
  const used = () => ba.classList.add('used');
  const stopIntro = () => { introId++; };
  ba.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    stopIntro(); used();
    const r = ba.getBoundingClientRect(), px = e.clientX - r.left;
    dragging = true; try { ba.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
    if (!grip.contains(e.target)) setV(px / W * 100);
    sv = v; spx = px; ba.classList.add('is-drag');
  });
  ba.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const px = e.clientX - ba.getBoundingClientRect().left;
    setV(sv + (px - spx) / W * 100);
  });
  const end = () => { dragging = false; ba.classList.remove('is-drag'); };
  ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end); ba.addEventListener('lostpointercapture', end);

  grip.addEventListener('keydown', (e) => {
    const big = e.shiftKey ? 10 : 2; let n = null;
    switch (e.key) {
      case 'ArrowLeft': case 'ArrowDown': n = v - big; break;
      case 'ArrowRight': case 'ArrowUp': n = v + big; break;
      case 'PageDown': n = v - 10; break;
      case 'PageUp': n = v + 10; break;
      case 'Home': n = 0; break;
      case 'End': n = 100; break;
      default: return;
    }
    e.preventDefault(); stopIntro(); used(); setV(n);
  });

  /* ---------- a single slow invitation sweep when it first scrolls into view ---------- */
  function intro() {
    if (reduce) { setV(50); return; }
    const id = ++introId, t0 = performance.now(), from = 96, to = 52, dur = 2600;
    (function step(t) {
      if (id !== introId) return;
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      setV(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { io.disconnect(); setTimeout(intro, 350); } }, { threshold: .5 }).observe(ba);

  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(ba); else addEventListener('resize', measure);
  document.fonts && document.fonts.ready.then(measure);
  measure();
})();
