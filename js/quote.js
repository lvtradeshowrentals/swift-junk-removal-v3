/* QUOTE: a three-step console + a wireframe truck bed that loads whatever you pick.
   Steps validate one at a time; nothing is sent until step 3. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('quoteForm');
  if (!form) return;
  const SW = window.SWIFT || {};
  const reduce = !!SW.reduce;

  const SERVICES = { garage: 'Home, garage or estate', furniture: 'Furniture and appliances', construction: 'Construction debris', commercial: 'Office or property', yard: 'Yard or outdoor', general: 'Not sure yet' };
  const SHORT = { garage: 'Home or garage', furniture: 'Furniture', construction: 'Construction', commercial: 'Commercial', yard: 'Yard', general: 'To be confirmed' };
  const WHEN = { today: 'Today', tomorrow: 'Tomorrow', week: 'This week', flexible: "I'm flexible" };
  const NEXT = ['Next: where and when', 'Next: your details', 'Send my request'];
  const FINE = ['Takes about a minute. Nothing is sent until the last step.', 'We use the ZIP to pick the nearest crew.', "We'll only use your number to text or call about this job."];
  const IDLE = "Pick what's going and we'll load the truck.";

  /* ---------- ZIP -> part of the valley (ported from the original site) ---------- */
  const HENDERSON = ['89002', '89011', '89012', '89014', '89015', '89044', '89052', '89053', '89074'];
  const NORTH_LV = ['89030', '89031', '89032', '89081', '89084', '89085', '89086', '89087'];
  function zone(raw) {
    const zip = String(raw || '').trim().slice(0, 5);
    if (!/^\d{5}$/.test(zip)) return null;
    if (HENDERSON.indexOf(zip) > -1) return { zip, city: 'Henderson', level: 'ok' };
    if (NORTH_LV.indexOf(zip) > -1) return { zip, city: 'North Las Vegas', level: 'near' };
    const n = +zip;
    if (n >= 89101 && n <= 89199) return { zip, city: 'Las Vegas', level: 'ok' };
    return { zip, city: '', level: 'out' };
  }

  /* ---------- the load-volume truck: an oblique, parallel-projection line drawing ---------- */
  const U = 100, KX = .55, KY = .32;               /* units -> px, depth recedes up and to the right */
  const P = (x, y, z) => [(x + KX * y) * U, -(z + KY * y) * U];
  const pts = (a) => a.map((p) => P(p[0], p[1], p[2]).map((n) => Math.round(n * 10) / 10).join(',')).join(' ');
  const poly = (a, c) => '<polygon class="' + c + '" points="' + pts(a) + '"/>';
  const ln = (a, b, c) => { const p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); return '<line class="' + c + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>'; };
  const BL = 6, BW = 3, FZ = .7, WH = 1.9;          /* bed length, width, floor height, wall height */

  /* what sits in the bed for each service: [x, y, z (above the floor), dx, dy, dz] */
  const LOAD = {
    garage: [[.1, .15, 0, .95, 1.25, .75], [.1, 1.6, 0, .95, 1.25, .75], [.15, .2, .75, .85, 1.15, .6]],
    furniture: [[1.3, .15, 0, 1.1, 1.9, .6], [1.3, .15, .6, .35, 1.9, .65], [1.35, 2.15, 0, .95, .8, 1.7]],
    construction: [[2.6, .15, 0, 1, 2.7, .28], [2.55, .2, .28, 1.05, 2.6, .28], [2.7, .15, .56, .85, 2.7, .28]],
    commercial: [[3.8, .15, 0, 1.1, 1.2, .75], [3.75, .1, .75, 1.2, 1.3, .1], [3.9, 1.5, 0, .6, .6, .5], [3.9, 1.5, .5, .14, .6, .5], [3.85, 2.2, 0, .8, .7, 1.3]],
    yard: [[5, .15, 0, .95, 1.3, .7], [5.05, .2, .7, .85, 1.2, .35], [5, 1.6, 0, .45, .55, .55], [5.5, 1.6, 0, .45, .55, .55], [5, 2.25, 0, .55, .6, .5], [5.55, 2.25, 0, .4, .6, .7]],
    general: [[2.2, .7, 0, 1.7, 1.5, 1.2]],
  };
  const VOL = {}; let VOL_ALL = 0;
  Object.keys(LOAD).forEach((k) => { VOL[k] = LOAD[k].reduce((s, b) => s + b[3] * b[4] * b[5], 0); if (k !== 'general') VOL_ALL += VOL[k]; });

  function box(b, i, dash) {
    const x = b[0], y = b[1], z = b[2] + FZ, x1 = x + b[3], y1 = y + b[4], z1 = z + b[5];
    return '<g class="bx' + (dash ? ' bx--q' : '') + '" style="--i:' + i + '">' +
      poly([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], 'r') +
      poly([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], 't') +
      poly([[x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1]], 'f') + '</g>';
  }
  function wheel(x) {
    const c = P(x, 0, .5);
    return '<g class="whl"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="50"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="21"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="4" class="hub"/></g>';
  }
  let svc = {};   /* service key -> its <g> */
  function buildTruck() {
    const svg = $('ldSvg'); if (!svg) return;
    svg.setAttribute('viewBox', '-250 -392 1040 420');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    let h = '';
    /* ground + tick scale */
    h += '<g class="gnd">' + ln([-2.5, 0, 0], [6.9, 0, 0], 'g-l');
    for (let i = -2; i <= 6; i++) h += ln([i, 0, 0], [i, 0, -.09], 'g-t');
    h += '</g>';
    /* cab: rear face (it doubles as the headboard), roof, side */
    const CZ = 2.8;
    h += poly([[-.3, 0, FZ], [-.3, BW, FZ], [-.3, BW, CZ], [-.3, 0, CZ]], 'cab-r');
    h += poly([[-.3, 0, CZ], [-1.4, 0, CZ], [-1.4, BW, CZ], [-.3, BW, CZ]], 'cab-t');
    h += poly([[-.3, 0, FZ], [-.3, 0, CZ], [-1.4, 0, CZ], [-2.3, 0, 1.6], [-2.3, 0, FZ]], 'cab-f');
    h += poly([[-.55, 0, 1.85], [-1.95, 0, 1.85], [-1.4, 0, 2.6], [-.55, 0, 2.6]], 'cab-w');
    h += ln([-.55, 0, 1.4], [-.55, 0, 1.0], 'cab-h');
    /* bed: back wall, floor with grid */
    h += poly([[0, BW, FZ], [BL, BW, FZ], [BL, BW, WH], [0, BW, WH]], 'wall');
    h += poly([[0, 0, FZ], [BL, 0, FZ], [BL, BW, FZ], [0, BW, FZ]], 'floor');
    for (let i = 1; i < BL; i++) h += ln([i, 0, FZ], [i, BW, FZ], 'grid');
    for (let j = 1; j < BW; j++) h += ln([0, j, FZ], [BL, j, FZ], 'grid');
    /* faint floor footprints: where each service will land */
    Object.keys(LOAD).forEach((k) => {
      if (k === 'general') return;
      let x0 = 9, x1 = 0, y0 = 9, y1 = 0;
      LOAD[k].forEach((b) => { x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[0] + b[3]); y0 = Math.min(y0, b[1]); y1 = Math.max(y1, b[1] + b[4]); });
      h += '<polygon class="slot" data-slot="' + k + '" points="' + pts([[x0 - .05, y0 - .05, FZ], [x1 + .05, y0 - .05, FZ], [x1 + .05, y1 + .05, FZ], [x0 - .05, y1 + .05, FZ]]) + '"/>';
    });
    /* the load: every service owns a group; boxes are painted far to near */
    h += '<g class="load">';
    Object.keys(LOAD).forEach((k) => {
      const list = LOAD[k].map((b) => ({ b, d: (b[1] + b[4] / 2) - KX * (b[0] + b[3] / 2) - KY * (b[2] + b[5] / 2) })).sort((p, q) => q.d - p.d);
      h += '<g class="ld-svc" data-svc="' + k + '">' + list.map((o, i) => box(o.b, i, k === 'general')).join('');
      if (k === 'general') { const c = P(3.05, .7, FZ + .55); h += '<text class="qm" x="' + c[0] + '" y="' + (c[1] + 22) + '" text-anchor="middle">?</text>'; }
      h += '</g>';
    });
    h += '</g>';
    /* near rail, tail edge, wheels */
    h += poly([[0, 0, FZ], [BL, 0, FZ], [BL, 0, WH], [0, 0, WH]], 'rail');
    h += ln([BL, 0, FZ], [BL, BW, FZ], 'tail') + ln([BL, BW, FZ], [BL, BW, WH], 'tail') + ln([BL, BW, WH], [BL, 0, WH], 'tail');
    h += ln([-2.3, 0, FZ], [BL, 0, FZ], 'chassis');
    h += poly([[0, 0, FZ], [0, BW, FZ], [0, BW, WH], [0, 0, WH]], 'scan');
    h += wheel(4.7) + wheel(-1.6);
    svg.innerHTML = h;
    svg.querySelectorAll('.ld-svc').forEach((g) => { svc[g.getAttribute('data-svc')] = g; });
  }

  /* ---------- state ---------- */
  const st = { step: 1, sel: new Set(), files: [], no: '' };
  const qc = $('qc'), panesEl = $('qPanes'), nextBtn = $('qNext'), backBtn = $('qBack'), fine = $('qFine'), done = $('qDone');
  const panes = Array.from(form.querySelectorAll('.pane'));
  const stepLis = Array.from(form.querySelectorAll('#qSteps li'));
  const ld = $('ld'), ldCap = $('ldCap');

  const pad2 = (n) => String(n).padStart(2, '0');
  function orderNo() {
    const d = new Date();
    return 'SW-' + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + String(Math.floor(1000 + Math.random() * 9000));
  }
  const names = () => Array.from(st.sel).map((k) => SHORT[k]);

  let lastKey = '';
  function updateLoad() {
    const key = Array.from(st.sel).sort().join(',');
    if (ld && key !== lastKey && !reduce) { ld.classList.remove('scanning'); void ld.offsetWidth; if (key) ld.classList.add('scanning'); }
    lastKey = key;
    Object.keys(svc).forEach((k) => svc[k].classList.toggle('on', st.sel.has(k)));
    document.querySelectorAll('#ldSvg .slot').forEach((el) => el.classList.toggle('on', st.sel.has(el.getAttribute('data-slot'))));
    const n = names();
    if (ld) ld.classList.toggle('has', n.length > 0);
    if (ldCap) ldCap.textContent = n.length ? 'Loading: ' + n.join(', ') : IDLE;
    const cnt = $('ldCount'); if (cnt) cnt.textContent = pad2(n.length) + ' / 06';
    let v = 0; st.sel.forEach((k) => { if (k !== 'general') v += VOL[k]; });
    const bar = $('ldBar'); if (bar) bar.style.transform = 'scaleX(' + (VOL_ALL ? (v / VOL_ALL).toFixed(3) : 0) + ')';
  }

  function setDd(el, text, empty) { el.textContent = text; el.classList.toggle('empty', !!empty); }
  function updateSummary() {
    const n = names();
    setDd($('sumSvc'), n.length ? n.join(', ') : 'Not picked yet', !n.length);
    const z = zone($('f-zip').value);
    setDd($('sumZip'), z ? z.zip + (z.city ? ' · ' + z.city : '') : 'ZIP needed', !z);
    const w = form.querySelector('input[name="when"]:checked');
    setDd($('sumWhen'), w ? WHEN[w.value] : "I'm flexible", false);
  }

  /* ---------- steps ---------- */
  function fit() { const p = panes[st.step - 1]; panesEl.style.height = p.offsetHeight + 'px'; }
  function bring(el) {
    const r = el.getBoundingClientRect();
    if (r.top < 84) {
      const y = r.top + window.scrollY - 96;
      if (SW.lenis) SW.lenis.scrollTo(y, { duration: .9 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function setStep(n, focus) {
    const prev = st.step;
    st.step = n;
    panes.forEach((p, i) => {
      const on = i === n - 1;
      p.classList.toggle('on', on); p.classList.toggle('before', i < n - 1);
      if (on) { p.inert = false; p.removeAttribute('inert'); } else { p.inert = true; p.setAttribute('inert', ''); }
    });
    stepLis.forEach((li, i) => {
      li.classList.toggle('on', i === n - 1); li.classList.toggle('done', i < n - 1);
      const b = li.querySelector('button'); b.disabled = i >= n;
      if (i === n - 1) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    backBtn.hidden = n === 1;
    $('qNextT').textContent = NEXT[n - 1];
    fine.textContent = FINE[n - 1];
    fit();
    if (n !== prev && focus !== false) { const h = panes[n - 1].querySelector('h3'); if (h) h.focus({ preventScroll: true }); bring(qc); }
  }

  const err = (field, errId, msg) => {
    const f = typeof field === 'string' ? $(field) : field, e = $(errId);
    if (f) { if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); }
    e.textContent = msg || '';
    if (errId === 'e-service' && !msg) form.querySelectorAll('input[name="service"]').forEach((i) => { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
    return !msg;
  };
  function validate(n) {
    if (n === 1) {
      const first = form.querySelector('input[name="service"]');
      if (first) { if (st.sel.size) first.removeAttribute('aria-describedby'); else first.setAttribute('aria-describedby', 'e-service'); }
      return err(first, 'e-service', st.sel.size ? '' : 'Pick at least one, or choose Not sure yet.');
    }
    if (n === 2) {
      const v = $('f-zip').value.trim();
      return err('f-zip', 'e-zip', !v ? 'Enter your ZIP so we know where to send the crew.' : /^\d{5}(-\d{4})?$/.test(v) ? '' : 'Use a 5-digit ZIP code, like 89101.');
    }
    const name = $('f-name').value.trim(), phone = $('f-phone').value.replace(/\D/g, '');
    const a = err('f-name', 'e-name', name ? '' : 'Enter your name so we know who to ask for.');
    const b = err('f-phone', 'e-phone', phone.length >= 10 ? '' : 'Enter a number with area code so we can text you.');
    return a && b;
  }
  function advance() {
    if (!validate(st.step)) {
      const bad = panes[st.step - 1].querySelector('[aria-invalid="true"]');
      if (bad) bad.focus(); else { const e = panes[st.step - 1].querySelector('.err:not(:empty)'); if (e) e.scrollIntoView({ block: 'nearest' }); }
      fit(); return;
    }
    if (st.step < 3) setStep(st.step + 1); else send();
  }

  /* ---------- photos ---------- */
  function renderThumbs() {
    const ul = $('thumbs'); ul.innerHTML = '';
    st.files.forEach((f, i) => {
      const li = document.createElement('li'), img = document.createElement('img'), b = document.createElement('button');
      img.alt = ''; img.src = f._url; b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Remove photo ' + (i + 1));
      b.addEventListener('click', () => { URL.revokeObjectURL(f._url); st.files.splice(i, 1); syncFiles(); renderThumbs(); });
      li.appendChild(img); li.appendChild(b); ul.appendChild(li);
    });
    $('dropLabel').innerHTML = st.files.length ? '<b>' + st.files.length + (st.files.length === 1 ? ' photo' : ' photos') + ' added</b>. Add more' : '<b>Add photos</b> or drop them here';
    fit();
  }
  function syncFiles() {
    try { const dt = new DataTransfer(); st.files.forEach((f) => dt.items.add(f)); $('f-photos').files = dt.files; } catch (e) { /* older browsers keep the picker's own list */ }
  }
  function addFiles(list) {
    Array.from(list || []).forEach((f) => {
      if (!/^image\//.test(f.type) || f.size > 15 * 1024 * 1024 || st.files.length >= 6) return;
      f._url = URL.createObjectURL(f); st.files.push(f);
    });
    syncFiles(); renderThumbs();
  }

  /* ---------- send ---------- */
  function send() {
    const endpoint = form.getAttribute('data-endpoint'), fail = $('sendFail');
    const ok = () => {
      nextBtn.disabled = false; nextBtn.classList.remove('busy'); fail.hidden = true;
      $('doneNo').textContent = st.no;
      qc.classList.add('sent'); ld.classList.add('sent'); ldCap.textContent = "Loaded. We'll text you the price."; $('ldBar').style.transform = 'scaleX(1)';
      form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
      bring(qc);
    };
    const bad = () => { nextBtn.disabled = false; nextBtn.classList.remove('busy'); fail.hidden = false; fit(); fail.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); nextBtn.focus({ preventScroll: true }); };
    const fd = new FormData(form);
    fd.append('reference', st.no);
    fd.append('_subject', 'New quote request ' + st.no + ' (Swift Junk Removal)');
    fd.append('_template', 'table'); fd.append('_captcha', 'false');
    fd.append('services', Array.from(st.sel).map((k) => SERVICES[k]).join(', '));
    nextBtn.disabled = true; nextBtn.classList.add('busy'); fail.hidden = true;
    /* a request only counts as sent when the inbox service says so; anything else tells the visitor and offers the phone */
    fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      .then((r) => r.json().catch(() => ({})).then((j) => { if (r.ok && j.success !== 'false' && j.success !== false) ok(); else bad(); }))
      .catch(bad);
  }

  function reset() {
    form.reset(); st.sel.clear(); st.files.forEach((f) => URL.revokeObjectURL(f._url)); st.files = []; renderThumbs();
    form.querySelectorAll('.svc').forEach((t) => t.classList.remove('is-on'));
    form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    form.querySelectorAll('.err').forEach((e) => { e.textContent = ''; });
    $('zipNote').textContent = ''; $('zipNote').className = 'zip-note';
    st.no = orderNo(); $('qNo').textContent = st.no;
    qc.classList.remove('sent'); ld.classList.remove('sent'); $('sendFail').hidden = true;
    done.hidden = true; form.hidden = false;
    setStep(1, false); updateSummary(); updateLoad();
    const first = form.querySelector('.svc input'); if (first) first.focus({ preventScroll: true });
  }

  function setServices(list) {
    st.sel.clear(); list.forEach((k) => st.sel.add(k));
    form.querySelectorAll('input[name="service"]').forEach((i) => { i.checked = st.sel.has(i.value); i.closest('.svc').classList.toggle('is-on', i.checked); });
    updateLoad(); updateSummary();
  }

  /* ---------- wiring ---------- */
  buildTruck();
  st.no = orderNo(); $('qNo').textContent = st.no;
  $('qDate').textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  form.querySelectorAll('input[name="service"]').forEach((i) => i.addEventListener('change', () => {
    let list = Array.from(st.sel);
    if (i.checked) { list = i.value === 'general' ? ['general'] : list.filter((k) => k !== 'general').concat(i.value); }
    else list = list.filter((k) => k !== i.value);
    setServices(list); err(null, 'e-service', ''); fit();
  }));
  form.querySelectorAll('input[name="when"]').forEach((i) => i.addEventListener('change', updateSummary));
  $('f-zip').addEventListener('input', () => {
    const z = zone($('f-zip').value), n = $('zipNote');
    n.className = 'zip-note';
    if (z && z.level === 'ok') { n.textContent = 'Yes, we cover ' + z.city + '.'; n.classList.add('ok'); }
    else if (z && z.level === 'near') { n.textContent = z.city + ' is just outside our usual area. Send it and we will confirm.'; n.classList.add('warn'); }
    else if (z) { n.textContent = "That's outside our usual area. Send it anyway and we'll tell you."; n.classList.add('warn'); }
    else n.textContent = '';
    if ($('f-zip').getAttribute('aria-invalid')) validate(2);
    updateSummary(); fit();
  });
  ['f-name', 'f-phone'].forEach((id) => $(id).addEventListener('input', () => { if ($(id).getAttribute('aria-invalid')) { validate(3); fit(); } }));

  nextBtn.addEventListener('click', advance);
  backBtn.addEventListener('click', () => setStep(st.step - 1));
  stepLis.forEach((li, i) => li.querySelector('button').addEventListener('click', () => { if (i + 1 < st.step) setStep(i + 1); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); advance(); });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'LABEL') { e.preventDefault(); advance(); }
  });

  const drop = $('drop');
  $('f-photos').addEventListener('change', (e) => { const picked = Array.from(e.target.files); st.files.forEach((f) => URL.revokeObjectURL(f._url)); st.files = []; addFiles(picked); });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer && e.dataTransfer.files));
  $('qAgain').addEventListener('click', reset);

  /* "Get a quote" links elsewhere choose their service before the page scrolls here */
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-service]');
    if (!a) return;
    const k = a.getAttribute('data-service');
    if (qc.classList.contains('sent')) reset();
    if (k && k !== 'general' && SERVICES[k]) { const list = Array.from(st.sel).filter((x) => x !== 'general'); if (list.indexOf(k) < 0) list.push(k); setServices(list); err(null, 'e-service', ''); }
    if (st.step !== 1) setStep(1, false);
  });

  /* keep the pane stack the height of whichever pane is showing */
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => fit()); panes.forEach((p) => ro.observe(p)); }
  panesEl.classList.add('ready');
  setStep(1, false); updateLoad(); updateSummary();
  requestAnimationFrame(() => requestAnimationFrame(() => panesEl.classList.add('anim')));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('resize', fit);
})();
