/* HOW IT WORKS: three line-art vignettes, scrubbed by scroll on desktop (pinned track),
   auto-played once per panel when stacked (mobile / touch / reduced motion). */
(function () {
  'use strict';
  const root = document.getElementById('how');
  if (!root) return;
  const S = window.SWIFT || {};
  const $ = (s, r) => (r || root).querySelector(s);
  const $$ = (s, r) => Array.from((r || root).querySelectorAll(s));

  /* ---------- maths ---------- */
  const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (u, a, b) => cl((u - a) / (b - a));
  const sm = (t) => t * t * (3 - 2 * t);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const eio = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fx = (n) => Math.round(n * 100) / 100;

  /* ---------- drawing helpers (all deterministic: state = f(progress)) ---------- */
  const lens = new WeakMap();
  const len = (el) => { let l = lens.get(el); if (l == null) { try { l = el.getTotalLength(); } catch (e) { l = 0; } lens.set(el, l); } return l; };
  function draw(el, p) {
    if (p <= 0.0005) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = '';
    if (p >= 0.9995) { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; return; }
    const l = len(el);
    el.style.strokeDasharray = l + ' ' + (l + 4);
    el.style.strokeDashoffset = l * (1 - p);
  }
  function seq(els, p, w) {
    const n = els.length; w = w || .42;
    for (let i = 0; i < n; i++) { const a = i * (1 - w) / n; draw(els[i], seg(p, a, a + w)); }
  }
  function op(el, v) { el.style.opacity = v >= .999 ? '1' : fx(v); el.style.visibility = v <= .002 ? 'hidden' : ''; }
  function tf(el, x, y, s, cx, cy, rot) {
    s = s == null ? 1 : s; cx = cx || 0; cy = cy || 0;
    el.setAttribute('transform', `translate(${fx(x + cx * (1 - s))} ${fx(y + cy * (1 - s))})` + (s !== 1 ? ` scale(${fx(s * 1000) / 1000})` : '') + (rot ? ` rotate(${fx(rot)} ${cx} ${cy})` : ''));
  }

  const fitters = [];
  /* =====================================================================
     VIGNETTE 1: the phone. Viewfinder locks on the pile, shutter, thread.
     ===================================================================== */
  function makeV1(svg) {
    const q = (s) => svg.querySelector(s), qa = (s) => Array.from(svg.querySelectorAll(s));
    const phone = q('.k-phone'), scr = q('.k-scr'), spk = qa('.k-spk');
    const cam = q('.k-cam'), ticks = q('.k-ticks'), pileD = qa('.k-pile .d'), br = q('.k-br');
    const ring = q('.k-ring'), shut = q('.k-shut'), shutC = q('.k-shut circle'), shin = q('.k-shin'), flash = q('.k-flash');
    const thr = q('.k-thr'), hl = q('.k-hl'), pbPath = q('.k-pb > path'), pbp = q('.k-pbp'), dots = q('.k-dots'), dotsPath = q('.k-dots path'), dotC = qa('.k-dots circle');
    const tbPath = q('.k-tb > path'), tbT = qa('.k-tb text'), sent = q('.k-sent'), tick = q('.k-tick'), sentT = q('.k-sent text');
    const bar = q('.k-bar'), send = q('.k-send'), co1 = q('.k-co1'), co2 = q('.k-co2'), co3 = q('.k-co3');
    const CX = 400, CY = 341, scan = q('.k-scan');
    return function render(u) {
      draw(phone, eo(seg(u, 0, .2))); draw(scr, eo(seg(u, .05, .22)));
      spk.forEach((e) => draw(e, seg(u, .15, .24)));
      draw(ticks, seg(u, .14, .3));
      seq(pileD, seg(u, .1, .4), .34);
      op(co1, seg(u, .3, .4) * (1 - seg(u, .64, .7)));
      // a scan line sweeps the frame (echoes the hero)
      const sc = seg(u, .26, .5); scan.setAttribute('transform', `translate(0 ${fx(lerp(236, 446, eio(sc)))})`); op(scan, Math.sin(Math.PI * sc) * .9);
      // viewfinder closes in
      const b = eo(seg(u, .28, .5));
      tf(br, 0, 0, 1 + .3 * (1 - b), CX, CY); op(br, seg(u, .28, .36));
      const r = eo(seg(u, .34, .54));
      tf(ring, 0, 0, 1 + 2.1 * (1 - r), CX, CY, (1 - r) * 90); op(ring, seg(u, .34, .42));
      // shutter + flash
      draw(shutC, seg(u, .2, .3)); op(shut, seg(u, .2, .28));
      const press = Math.sin(Math.PI * seg(u, .56, .66));
      tf(shin, 0, 0, 1 - .24 * press, 400, 540);
      shin.style.fill = press > .05 ? 'var(--copper)' : 'var(--bone)';
      const f1 = seg(u, .585, .612), f2 = seg(u, .612, .72);
      flash.style.opacity = fx(.9 * Math.min(f1, 1 - f2));
      // camera out, thread in
      const co = eo(seg(u, .66, .75));
      op(cam, 1 - co); tf(cam, 0, -16 * co, 1, 0, 0);
      op(thr, seg(u, .67, .72));
      draw(hl, seg(u, .68, .77)); draw(bar, seg(u, .72, .8)); draw(send, seg(u, .76, .8));
      draw(pbPath, eo(seg(u, .7, .78)));
      const ph = eo(seg(u, .76, .83)); op(pbp, ph); pbp.setAttribute('transform', `translate(388 ${fx(128 + 8 * (1 - ph))}) scale(.46)`);
      const dv = seg(u, .8, .83) * (1 - seg(u, .86, .885));
      op(dots, dv); if (dv > .002) { dotsPath.style.visibility = ''; dotC.forEach((c, i) => { c.style.opacity = fx(.3 + .7 * (.5 + .5 * Math.sin(u * 110 - i * 1.5))); }); }
      draw(tbPath, eo(seg(u, .85, .915)));
      tbT.forEach((t, i) => op(t, seg(u, .89 + i * .012, .93 + i * .012)));
      op(sent, seg(u, .935, .96)); draw(tick, seg(u, .945, .985)); op(sentT, seg(u, .95, .985));
      op(co2, seg(u, .8, .88)); op(co3, seg(u, .95, 1));
    };
  }

  /* =====================================================================
     VIGNETTE 2: the price card. Items check in, Approve is pressed.
     ===================================================================== */
  function makeV2(svg) {
    const q = (s) => svg.querySelector(s), qa = (s) => Array.from(svg.querySelectorAll(s));
    const b1p = q('.k-b1p'), b1t = q('.k-b1t'), card = q('.k-card'), lab = q('.k-lab'), div = q('.k-div');
    const hclip = q('.k-hclip'), head = q('.k-head'), rows = qa('.k-rows > g');
    const ab = q('.k-ab'), aclip = q('.k-aclip'), t1 = q('.k-t1'), t2 = q('.k-t2'), tick2 = q('.k-tick2'), ask = q('.k-ask'), askt = q('.k-askt'), tap = q('.k-tap');
    const b2p = q('.k-b2p'), b2t = q('.k-b2t');
    head.fit = () => { head.style.fontSize = '100px'; const w = head.getComputedTextLength(); if (w > 0) head.style.fontSize = (100 * 444 / w).toFixed(1) + 'px'; };
    fitters.push(head.fit);
    return function render(u) {
      draw(b1p, eo(seg(u, 0, .1))); op(b1t, seg(u, .06, .12));
      draw(card, eo(seg(u, .08, .3)));
      op(lab, seg(u, .22, .3)); draw(div, seg(u, .24, .32));
      const h = eo(seg(u, .28, .42));
      hclip.setAttribute('y', fx(250 - 80 * h)); hclip.setAttribute('height', fx(80 * h + .01));
      head.setAttribute('transform', `translate(0 ${fx(22 * (1 - h))})`);
      rows.forEach((g, i) => {
        const a = .4 + i * .075;
        qa('.k-r' + i + ' .k-rl').forEach((l) => draw(l, seg(u, a, a + .05)));
        draw(g.querySelector('.k-cb'), seg(u, a, a + .05));
        draw(g.querySelector('.k-ck'), eo(seg(u, a + .05, a + .1)));
        op(g.querySelector('.k-rt'), seg(u, a + .02, a + .08));
      });
      draw(ab, eo(seg(u, .62, .7))); draw(ask, eo(seg(u, .64, .72))); op(askt, seg(u, .68, .74));
      const pr = eo(seg(u, .8, .86));
      aclip.setAttribute('width', fx(234 * pr + .01));
      const ap = seg(u, .66, .72), fl = eo(seg(u, .84, .9));
      op(t1, ap * (1 - fl)); t1.style.fill = pr > .3 ? 'var(--ink)' : ''; t1.setAttribute('transform', `translate(0 ${fx(-12 * fl)})`);
      op(t2, fl); t2.setAttribute('transform', `translate(0 ${fx(12 * (1 - fl))})`);
      draw(tick2, eo(seg(u, .88, .94)));
      // the press: a ring contracts onto the button
      const tp = seg(u, .74, .8);
      tap.setAttribute('r', fx(lerp(36, 14, eo(tp))));
      op(tap, seg(u, .74, .77) * (1 - seg(u, .83, .88)));
      draw(b2p, eo(seg(u, .9, .96))); op(b2t, seg(u, .94, 1));
    };
  }

  /* =====================================================================
     VIGNETTE 3: pickup + trailer, two figures load a couch and a box, it leaves.
     ===================================================================== */
  function makeV3(svg) {
    const q = (s) => svg.querySelector(s), qa = (s) => Array.from(svg.querySelectorAll(s));
    const ground = q('.k-ground'), lane = q('.k-lane'), truck = q('.k-truck'), sky = q('.k-sky'), r1 = q('.k-r1'), r2 = q('.k-r2'), ticks = q('.k-ticks');
    const skyD = qa('.k-sky path.sk'), skyW = qa('.k-skw');
    const trailerD = qa('.k-trailer .d'), pickD = qa('.k-pick .d');
    const wheels = qa('.k-w').map((g) => { const c = g.querySelector('circle'); return { spoke: g.querySelector('.k-spoke'), cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), r: +c.getAttribute('r') }; });
    const couch = q('.k-couch'), box = q('.k-box'), straps = qa('.k-straps path'), done = q('.k-done'), dtick = q('.k-dtick'), dcirc = q('.k-done circle');
    const A = { g: q('.k-figA'), t: q('.k-figA .k-ft'), b: q('.k-figA .k-fb'), h: q('.k-figA .k-fh') }, B = { g: q('.k-figB'), t: q('.k-figB .k-ft'), b: q('.k-figB .k-fb'), h: q('.k-figB .k-fh') };
    // a minimal geometric figure: dot head, outlined torso, bent legs, arms to the hands
    function pose(F, x, ph, o) {
      o = o || {};
      const crouch = o.crouch || 0, lean = o.lean || 0, walk = o.walk ? 15 : 0;
      const hy = 456 + crouch, sy = 416 + crouch * .9, sx = x + lean;
      const s1 = Math.sin(ph) * walk;
      const leg = (hx, s, lift) => {
        const fxx = x + s, fy = 500 - lift, kx = (hx + fxx) / 2 + 4 + crouch * .7, ky = (hy + fy) / 2;
        return `M${fx(hx)} ${fx(hy)}L${fx(kx)} ${fx(ky)}L${fx(fxx)} ${fx(fy)}`;
      };
      const arm = (hx, hyy) => {
        const shx = sx, shy = sy + 3, mx = (shx + hx) / 2, my = (shy + hyy) / 2 + 6;
        return `M${fx(shx)} ${fx(shy)}L${fx(mx)} ${fx(my)}L${fx(hx)} ${fx(hyy)}`;
      };
      let a1, a2;
      if (o.hands) { a1 = arm(o.hands[0][0], o.hands[0][1]); a2 = arm(o.hands[1][0], o.hands[1][1]); }
      else { a1 = arm(sx - s1 * .35, sy + 44); a2 = arm(sx + s1 * .35, sy + 44); }
      F.t.setAttribute('d', `M${fx(sx - 8)} ${fx(sy)}H${fx(sx + 8)}L${fx(x + 6)} ${fx(hy)}H${fx(x - 6)}Z`);
      F.b.setAttribute('d', leg(x - 5, s1, Math.max(0, Math.cos(ph)) * (walk ? 5 : 0)) + leg(x + 5, -s1, Math.max(0, -Math.cos(ph)) * (walk ? 5 : 0)) + a1 + a2);
      F.h.setAttribute('cx', fx(sx + lean * .3)); F.h.setAttribute('cy', fx(sy - 18));
    }
    const COUCH_Y0 = 462, DECK = 454, CX0 = 94, CX1 = 150, CX2 = 340, BOX_X = 128;
    return function render(u) {
      draw(ground, eo(seg(u, 0, .12))); op(r1, seg(u, .04, .14)); op(r2, seg(u, .06, .16)); op(lane, seg(u, .06, .16) * .8); op(ticks, seg(u, .02, .12));
      seq(skyD, seg(u, 0, .2), .3); skyW.forEach((p) => op(p, seg(u, .12, .24)));
      seq(trailerD, seg(u, .04, .2), .4); seq(pickD, seg(u, .08, .26), .36);
      // --- choreography ---
      const fin = seg(u, .22, .28);
      let cx = CX0 + 50 * seg(u, .28, .4), by = COUCH_Y0;
      if (u >= .4) { cx = CX1; by = COUCH_Y0 - (COUCH_Y0 - DECK) * eio(seg(u, .4, .46)); }
      if (u >= .46) cx = CX1 + (CX2 - CX1) * eo(seg(u, .46, .58));
      // A carries, then pushes the couch in from behind
      let ax = cx - 58, bx = cx + 58;
      if (u >= .4) ax = Math.min(cx - 58, 198);
      if (u >= .58) ax = lerp(198, 92, eio(seg(u, .58, .66)));
      const aWalk = u > .28 && u < .66;
      // B lets go, walks (in the foreground) to the box, picks it up and carries it back
      let bLean = 4, bWalk = u > .28 && u < .4;
      if (u >= .4) bx = 208;
      if (u >= .46) bx = lerp(208, 150, eio(seg(u, .46, .54)));
      if (u >= .63) bx = lerp(150, 222, eio(seg(u, .63, .75)));
      if (u >= .46 && u < .54) { bWalk = true; bLean = -4; }
      if (u >= .63 && u < .75) bWalk = true;
      const dB = sm(seg(u, .46, .52));
      const crouch = 16 * sm(seg(u, .54, .58)) * (1 - sm(seg(u, .61, .65)));
      // the box: on the ground -> swung round into B's arms -> up onto the trailer
      let boxX = BOX_X, boxY = 500;
      if (u >= .58 && u < .75) { const sw = eio(seg(u, .58, .64)); boxX = lerp(BOX_X, bx + 22, sw); boxY = lerp(500, 484, sw) - 12 * Math.sin(Math.PI * seg(u, .58, .64)); }
      if (u >= .75) { const lf = eio(seg(u, .75, .81)); boxX = lerp(bx + 22, 258, lf); boxY = lerp(484, DECK, lf) - 20 * Math.sin(Math.PI * seg(u, .75, .81)); }
      // the load settles
      const st = seg(u, .81, .87), bob = 3.2 * Math.sin(st * Math.PI * 3) * (1 - st);
      // hands
      let handsA = null, handsB = null;
      if (u < .6) { const lx = Math.min(cx - 50, ax + 28); handsA = [[lx, by - 18], [lx + 2, by - 16]]; }
      if (u < .46) handsB = [[bx + 8, by - 18], [bx + 10, by - 16]];
      else if (u >= .58 && u < .81) handsB = [[boxX - 14, boxY - 14], [boxX + 14, boxY - 14]];
      else if (u >= .54 && u < .58) handsB = [[bx - 24, 490], [bx - 20, 494]];
      pose(A, ax, ax / 9, { walk: aWalk, lean: aWalk ? 4 : 0, hands: handsA });
      pose(B, bx, bx / 9 + 1, { walk: bWalk, lean: bLean, crouch, hands: handsB });
      tf(B.g, 0, 9 * dB, 1 + .06 * dB, bx, 500);
      op(A.g, fin); op(B.g, fin);
      tf(couch, cx, by + bob); op(couch, fin);
      tf(box, boxX, boxY + (u >= .8 ? bob : 0)); op(box, fin);
      straps.forEach((s, i) => draw(s, eo(seg(u, .85 + i * .025, .9 + i * .025))));
      // departure (the skyline drifts the other way: a tracking camera)
      const dx = 1150 * Math.pow(seg(u, .89, 1), 2.1);
      truck.setAttribute('transform', `translate(${fx(dx)} 0)`);
      sky.setAttribute('transform', `translate(${fx(-dx * .045)} 0)`);
      wheels.forEach((w) => { w.spoke.setAttribute('transform', `rotate(${fx(dx / w.r * 57.3)} ${w.cx} ${w.cy})`); });
      // done mark once the road is clear
      draw(dcirc, eo(seg(u, .955, .99))); draw(dtick, eo(seg(u, .975, 1))); op(done, seg(u, .955, .97));
    };
  }

  const vig = [makeV1($('#hw-v1')), makeV2($('#hw-v2')), makeV3($('#hw-v3'))];
  const FLAT_END = [1, 1, .88];
  const FLAT_MS = [6200, 6400, 7600];

  /* ---------- elements ---------- */
  const track = $('#howTrack');
  const steps = $$('.how-step');
  const arts = steps.map((li) => $('.how-art', li));
  const ins = arts.map((a) => $('.how-in', a));
  const edges = arts.map((a) => $('.how-edge', a));
  const copies = steps.map((li) => $('.how-copy', li));
  const rns = $$('.how-rn');
  const rnSpans = rns.map((r) => r.firstElementChild);
  const spine = $('.how-spine');
  const svgs = [$('#hw-v1'), $('#hw-v2'), $('#hw-v3')];

  /* ---------- mode + geometry ---------- */
  let pinned = null, K = 50, artW = 800, lastS = -1;
  const wantPin = () => innerWidth > 980 && innerHeight >= 600 && !S.coarse && !S.reduce;

  function fitSvgs() {
    svgs.forEach((svg) => {
      const vb = pinned ? (svg.dataset.vb || '0 0 800 640') : (svg.dataset.vbm || '0 0 800 640');
      svg.setAttribute('viewBox', vb);
      const r = svg.getBoundingClientRect(), p = vb.split(' ').map(Number);
      const sc = Math.min(r.width / p[2], r.height / p[3]) || 1;
      svg.style.setProperty('--sw', cl(1.45 / sc, 1.2, 3.4).toFixed(2) + 'px');
    });
  }
  function reset() {
    steps.forEach((li) => li.classList.remove('seen'));
    ins.forEach((el) => { el.style.clipPath = ''; });
    arts.forEach((el) => { el.style.visibility = ''; });
    edges.forEach((el) => { el.style.transform = ''; el.style.removeProperty('--eo'); });
    steps.forEach((el, i) => { el.style.removeProperty('--co'); el.style.removeProperty('--cy'); copies[i].style.pointerEvents = ''; });
    rnSpans.forEach((el) => el.style.removeProperty('--o'));
    if (spine) spine.style.removeProperty('--p');
    lastS = -1;
  }

  /* ---------- pinned render ---------- */
  const U_WIN = [[.02, .88], [1.16, 1.88], [2.16, 3]];
  function renderPin(s) {
    const w = [1, seg(s, .9, 1.14), seg(s, 1.9, 2.14)];
    for (let i = 0; i < 3; i++) {
      const covered = i < 2 && w[i + 1] >= 1;
      const vis = w[i] > 0 && !covered;
      arts[i].style.visibility = vis ? '' : 'hidden';
      if (!vis) continue;
      const u = seg(s, U_WIN[i][0], U_WIN[i][1]);
      arts[i].style.setProperty('--u', fx(u));
      vig[i](u);
      if (i > 0) { // slanted wipe along the chevron angle
        const wp = eio(w[i]), xt = wp * (100 + K) - K;
        ins[i].style.clipPath = w[i] >= 1 ? 'none' : `polygon(0 0, ${fx(xt)}% 0, ${fx(xt + K)}% 100%, 0 100%)`;
        edges[i].style.transform = `translate3d(${fx(xt / 100 * artW)}px,0,0) rotate(-30deg)`;
        edges[i].style.setProperty('--eo', w[i] > 0 && w[i] < 1 ? 1 : 0);
      }
    }
    for (let i = 0; i < 3; i++) {
      const inn = i === 0 ? 1 : sm(seg(s, i - .04, i + .14));
      const out = i === 2 ? 0 : sm(seg(s, i + .88, i + 1.02));
      const co = inn * (1 - out), c = steps[i];
      c.style.setProperty('--co', fx(co)); c.style.setProperty('--cy', fx((1 - inn) * 26 - out * 26) + 'px');
      copies[i].style.pointerEvents = co > .5 ? 'auto' : '';
      rnSpans[i].style.setProperty('--o', fx(.09 + .91 * inn - .58 * out));
      rns[i].classList.toggle('on', inn >= .5 && out < .5);
      rns[i].classList.toggle('past', out >= .5);
    }
    spine.style.setProperty('--p', fx(.5 * sm(seg(s, .7, 1.1)) + .5 * sm(seg(s, 1.7, 2.1))));
  }
  if (S.raf) S.raf(() => {
    if (!pinned || !track) return;
    const r = track.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) return;
    const s = 3 * (S.track ? S.track(track) : cl(-r.top / Math.max(1, r.height - innerHeight)));
    if (Math.abs(s - lastS) < 1e-4) return;
    lastS = s; renderPin(s);
  });

  /* ---------- stacked: each panel plays once as it enters ---------- */
  const flat = (function () {
    let io = null; const st = [{}, {}, {}];
    function show(i, u) { arts[i].style.setProperty('--u', fx(u)); vig[i](u); }
    function init() {
      if (io) io.disconnect();
      steps.forEach((li) => li.classList.remove('seen'));
      if (S.reduce || !('IntersectionObserver' in window)) {
        st.forEach((o, i) => { o.state = 'done'; show(i, FLAT_END[i]); });
        steps.forEach((li) => li.classList.add('seen')); return;
      }
      st.forEach((o, i) => { o.state = 'idle'; show(i, 0); });
      io = new IntersectionObserver((en) => en.forEach((e) => {
        const i = arts.indexOf(e.target);
        if (e.isIntersecting && st[i].state === 'idle') { st[i].state = 'run'; st[i].t0 = performance.now(); steps[i].classList.add('seen'); }
      }), { threshold: .4 });
      arts.forEach((a) => io.observe(a));
    }
    function refresh() { st.forEach((o, i) => { if (o.state === 'done') show(i, FLAT_END[i]); }); }
    function tick() {
      if (pinned) return;
      const now = performance.now();
      st.forEach((o, i) => {
        if (o.state !== 'run') return;
        const p = cl((now - o.t0) / FLAT_MS[i]);
        show(i, p * FLAT_END[i]);
        if (p >= 1) o.state = 'done';
      });
    }
    if (S.raf) S.raf(tick);
    return { init, refresh };
  })();

  function layout() {
    const want = wantPin();
    if (want !== pinned) {
      pinned = want; root.classList.toggle('is-pin', pinned); reset();
      if (!pinned) flat.init();
    }
    fitSvgs();
    const r = arts[1].getBoundingClientRect(); artW = r.width;
    K = r.height * .5774 / Math.max(1, r.width) * 100;
    lastS = -1;
    if (!pinned) flat.refresh();
  }

  /* focusing a hidden step's link jumps the track to that step (keyboard access) */
  copies.forEach((c, i) => c.addEventListener('focusin', () => {
    if (!pinned) return;
    const r = track.getBoundingClientRect(), range = r.height - innerHeight;
    const cur = 3 * cl(-r.top / range);
    if (Math.abs(cur - (i + .4)) > .45) {
      const target = r.top + scrollY + range * ((i + .4) / 3);
      if (S.lenis) S.lenis.scrollTo(target, { immediate: true }); else scrollTo(0, target);
    }
  }));

  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
  fitters.forEach((f) => f()); layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitters.forEach((f) => f()); lastS = -1; layout(); });
})();
