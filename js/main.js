/* Boot + page-wide systems: smooth scroll, hero scrub, clock, cursor, reveals. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qs = new URLSearchParams(location.search);
  const S = (window.SWIFT = { y: 0, lenis: null });

  /* ---------- smooth scroll (Lenis, local copy) ---------- */
  if (!reduce && !qs.has('nosmooth') && window.Lenis) {
    const l = new Lenis({ lerp: .1, wheelMultiplier: .9, smoothWheel: true });
    S.lenis = l;
    const raf = (t) => { l.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = document.getElementById(id.slice(1)); if (!t) return;
    e.preventDefault();
    if (S.lenis) S.lenis.scrollTo(t, { offset: 0, duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    /* keyboard and screen-reader users land where the page lands */
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
    try { history.replaceState(null, '', id); } catch (err) { /* file:// */ }
  });


  /* ---------- shared kit (other section scripts use these) ---------- */
  const frames = [];
  S.raf = (fn) => { frames.push(fn); return fn; };
  let last = performance.now();
  (function loop(t) { const dt = Math.max(0, Math.min(.1, (t - last) / 1000)); last = t; S.y = window.scrollY; for (let i = 0; i < frames.length; i++) frames[i](t / 1000, dt); requestAnimationFrame(loop); })(last);
  /* progress of a tall track: 0 when its top meets the top of the viewport, 1 when its bottom meets the bottom */
  S.track = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); };
  /* progress of an element crossing the viewport: 0 when it enters at the bottom, 1 when it leaves at the top */
  S.cross = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1); };
  S.reduce = reduce;
  S.coarse = matchMedia('(pointer: coarse)').matches;

  /* split headings into masked words: <h2 class="split">Tell us what needs to go.</h2> */
  function splitEl(el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    const label = el.textContent.trim().replace(/\s+/g, ' ');
    const walk = (node, out) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { out.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = tok; w.appendChild(wi); out.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === 'BR') { out.appendChild(n.cloneNode()); return; }
          const c = n.cloneNode(false); walk(n, c); out.appendChild(c);
        }
      });
    };
    const frag = document.createElement('div'); walk(el, frag);
    el.innerHTML = ''; while (frag.firstChild) el.appendChild(frag.firstChild);
    el.setAttribute('aria-label', label);
    el.querySelectorAll('.wi').forEach((w, i) => w.style.setProperty('--i', i));
  }
  S.split = splitEl;
  const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  S.observe = (el) => io.observe(el);
  S.scan = (root) => { $$('.split', root).forEach((el) => { splitEl(el); io.observe(el); }); $$('[data-r]', root).forEach((el) => io.observe(el)); };
  document.fonts && document.fonts.ready.then(() => S.scan(document));
  S.scan(document);

  /* cursor: dot + ring; ring grows over links and shows data-cur text */
  const cur = $('#cur');
  if (cur && !S.coarse && matchMedia('(hover: hover)').matches && !reduce) {
    document.documentElement.classList.add('has-cur');
    let x = -100, y = -100, cx = x, cy = y; const ring = cur.querySelector('b');
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    S.raf(() => { cx += (x - cx) * .22; cy += (y - cy) * .22; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest && e.target.closest('a,button,[data-cur],label,input,textarea,summary');
      cur.classList.toggle('big', !!t);
      const lab = t && t.getAttribute && t.getAttribute('data-cur');
      cur.classList.toggle('has-label', !!lab); ring.textContent = lab || '';
    });
  }
  /* magnetic buttons */
  if (!S.coarse && !reduce) {
    document.addEventListener('pointermove', (e) => {
      $$('.btn:hover, .mag:hover').forEach((b) => {
        const r = b.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.transform = `translate(${dx * 8}px,${dy * 8}px)`;
      });
    }, { passive: true });
    document.addEventListener('pointerout', (e) => { const b = e.target.closest && e.target.closest('.btn, .mag'); if (b) b.style.transform = ''; });
  }

  /* ---------- nav tone: each nav part samples what is under it and picks ink or bone ---------- */
  const navParts = $$('.nav-p');
  const lumOf = (rgb) => { const m = rgb.match(/[\d.]+/g); if (!m) return 0; const c = m.slice(0, 3).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const bgCache = new WeakMap();
  function bgOf(el) {
    for (let n = el, i = 0; n && n !== document.documentElement && i < 8; n = n.parentElement, i++) {
      let v = bgCache.get(n);
      if (!v) { v = getComputedStyle(n).backgroundColor; bgCache.set(n, v); }
      const m = v.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > .6)) return v;
    }
    return 'rgb(6,7,8)';
  }
  let navY = -1;
  const navEl = $('.nav');
  function navTone() {
    const y = Math.round(scrollY); if (y === navY) return; navY = y;
    const hr = $('#hero'), stuck = !!hr && hr.getBoundingClientRect().bottom < innerHeight * .62;
    navEl.classList.toggle('stuck', stuck);
    navParts.forEach((p) => {
      const r = p.getBoundingClientRect(); if (!r.width) return;
      const el = document.elementsFromPoint(r.left + r.width / 2, p.dataset.y === 'b' ? innerHeight - 28 : 38).find((n) => !n.closest('.nav, .cur, .grain, .pre'));
      if (!el) return;
      const l = lumOf(bgOf(el)) > .22 ? 'l' : 'd';
      if (p.dataset.t !== l) p.dataset.t = l;
    });
    /* once the bar is solid, every part follows the bar's tone */
    if (stuck) { const t = navParts[0].dataset.t; navEl.dataset.t = t; navParts.forEach((p) => { p.dataset.t = t; }); }
  }
  S.raf(navTone);

  /* the diagonals open as they cross the screen: shallow when they appear, full chevron slant once centred */
  const joints = $$('.joint');
  if (!reduce) S.raf(() => {
    for (let i = 0; i < joints.length; i++) {
      const j = joints[i], r = j.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) continue;
      const k = clamp((innerHeight - r.top) / (innerHeight * .75), 0, 1), e = 1 - Math.pow(1 - k, 3);
      j.style.setProperty('--jy', ((1 - e) * 78).toFixed(1) + '%');
    }
  });

  /* progress hairline */
  const progBar = $('#progBar');
  S.raf(() => { const max = document.documentElement.scrollHeight - innerHeight; progBar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`; });

  /* ---------- clock ---------- */
  const clk = $('#clock');
  if (clk) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tick = () => { clk.textContent = f.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- hero ---------- */
  const hero = $('#hero'), cv = $('#heroGl'), stTxt = $('#stTxt'), stBar = $('#stBar');
  let H = null;
  try { if (window.SWIFT_CLOUD && cv) H = new SwiftHero(cv, window.SWIFT_CLOUD); } catch (e) { console.warn('hero gl failed', e); H = null; }
  if (!H || !H.gl) document.documentElement.classList.add('no-gl');
  S.hero = H;

  const STATES = [[0, 'Scanning <b>/</b> site'], [.07, 'Junk <b>/</b> flagged'], [.16, 'Clearing <b>/</b> in progress'], [.58, 'Site <b>/</b> cleared'], [.72, 'Ready <b>/</b> for you']];
  let lastSt = -1;
  function heroProgress() {
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
  }
  const tgt = $('#tgt');
  function placeTgt() {
    if (!H || !H.map || !tgt) return;
    const a = H.map(.64, .5), b = H.map(.995, .97);
    const x0 = Math.max(12, a[0]), x1 = Math.min(innerWidth - 12, b[0]);
    tgt.style.transform = `translate(${x0}px,${a[1]}px)`;
    tgt.style.width = (x1 - x0) + 'px'; tgt.style.height = (b[1] - a[1]) + 'px';
  }
  if (H) H.onResize = placeTgt;
  function onScroll() {
    const p = qs.has('p') ? +qs.get('p') : reduce ? 1 : heroProgress();
    if (H) H.setProgress(p);
    let s = 0; STATES.forEach((x, i) => { if (p >= x[0]) s = i; });
    if (s !== lastSt) { lastSt = s; stTxt.innerHTML = STATES[s][1]; }
    stBar.style.setProperty('--p', p.toFixed(3));
    hero.style.setProperty('--ex', clamp((innerHeight - hero.getBoundingClientRect().bottom) / (innerHeight * .4), 0, 1).toFixed(3));
    if (tgt) tgt.classList.toggle('on', p > .005 || (H && H.intro > .55) ? (p < .13) : false);
  }
  addEventListener('scroll', onScroll, { passive: true });
  if (H) {
    new IntersectionObserver((en) => H.setVisible(en[0].isIntersecting), { threshold: 0 }).observe(hero);
    addEventListener('pointermove', (e) => H.setMouse((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2), { passive: true });
  }
  function start() {
    if (qs.has('nointro') || reduce) { if (H) { H.intro = 1; } hero.classList.add('go'); }
    else { if (H) H.playIntro(); setTimeout(() => hero.classList.add('go'), 500); setTimeout(onScroll, 1500); }
    onScroll();
  }

  /* ---------- preloader: chevrons draw, counter runs, a 30deg wipe lifts off the hero ---------- */
  const pre = $('#pre'), preN = $('#preN');
  const skipPre = !pre || reduce || qs.has('nointro') || scrollY > 200;
  const glReady = new Promise((res) => { if (!H || H.ready) res(); else { const f = H.onReady; H.onReady = () => { if (f) f(); res(); }; setTimeout(res, 2500); } });
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  if (skipPre) { if (pre) pre.remove(); glReady.then(start); }
  else {
    document.documentElement.classList.add('pre-on');
    if (S.lenis) S.lenis.stop();
    setTimeout(() => { document.documentElement.classList.remove('pre-on'); if (S.lenis) S.lenis.start(); if (hero) hero.classList.add('go'); }, 7200);
    const t0 = performance.now(), DUR = 1250;
    let ready = false; Promise.all([glReady, fontsReady]).then(() => { ready = true; });
    const slant = () => innerHeight * Math.tan(Math.PI / 6);
    (function tick(now) {
      const k = clamp((now - t0) / DUR, 0, 1), e = 1 - Math.pow(1 - k, 3);
      preN.textContent = String(Math.round(e * 100)).padStart(3, '0');
      pre.style.setProperty('--k', e.toFixed(3));
      if (k < 1 || !ready) { requestAnimationFrame(tick); return; }
      /* exit: a slanted edge travels left to right, uncovering the hero */
      start();
      const t1 = performance.now(), D2 = 900;
      (function wipe(n2) {
        const q = clamp((n2 - t1) / D2, 0, 1), eq = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        const sl = slant(), x = eq * (innerWidth + sl);
        pre.style.clipPath = `polygon(${x}px 0, 100% 0, 100% 100%, ${x - sl}px 100%)`;
        if (q < 1) requestAnimationFrame(wipe);
        else { pre.remove(); document.documentElement.classList.remove('pre-on'); if (S.lenis) S.lenis.start(); }
      })(t1);
    })(t0);
  }
  document.fonts && document.fonts.ready.then(onScroll);
  if (reduce && H) H.setProgress(1, true);
})();
