/* FAQ: accessible accordion (one open at a time), category filter with a sliding indicator, arrow-key navigation. */
(function () {
  'use strict';
  const root = document.getElementById('faq');
  if (!root) return;
  const items = Array.from(root.querySelectorAll('.qa'));
  const btns = items.map((li) => li.querySelector('button'));
  const filter = document.getElementById('faqFilter');
  const tabs = filter ? Array.from(filter.querySelectorAll('button')) : [];
  const ind = filter && filter.querySelector('.faq-ind');
  const shown = document.getElementById('faqShown');
  const pad2 = (n) => String(n).padStart(2, '0');
  const reduce = !!(window.SWIFT && window.SWIFT.reduce);

  function setOpen(li, open) {
    li.classList.toggle('on', open);
    const b = li.querySelector('button'); b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btns.forEach((b) => b.addEventListener('click', () => {
    const li = b.closest('.qa'), willOpen = !li.classList.contains('on');
    items.forEach((o) => { if (o !== li) setOpen(o, false); });
    setOpen(li, willOpen);
  }));

  /* arrow keys move between visible questions */
  root.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('.qa button'); if (!b) return;
    const vis = btns.filter((x) => !x.closest('.qa').classList.contains('off'));
    const i = vis.indexOf(b); let n = -1;
    if (e.key === 'ArrowDown') n = Math.min(vis.length - 1, i + 1);
    else if (e.key === 'ArrowUp') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = vis.length - 1;
    if (n > -1) { e.preventDefault(); vis[n].focus(); }
  });

  /* filter */
  function moveInd(btn) {
    if (!ind || !btn) return;
    const w = btn.offsetWidth;
    ind.style.setProperty('--x', btn.offsetLeft + 'px');
    ind.style.setProperty('--w', (w / 40).toFixed(3));
  }
  function apply(f) {
    let n = 0, openVisible = null;
    items.forEach((li) => {
      const off = f !== 'all' && li.getAttribute('data-c') !== f;
      li.classList.toggle('off', off);
      if (off) { li.setAttribute('inert', ''); li.inert = true; if (li.classList.contains('on')) setOpen(li, false); }
      else { li.removeAttribute('inert'); li.inert = false; n++; li.querySelector('.qn').textContent = pad2(n); if (li.classList.contains('on')) openVisible = li; }
    });
    if (!openVisible) { const first = items.find((li) => !li.classList.contains('off')); if (first) setOpen(first, true); }
    if (shown) shown.textContent = pad2(n);
  }
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => { const on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    moveInd(t); apply(t.getAttribute('data-f'));
  }));
  const place = () => moveInd(tabs.find((t) => t.classList.contains('on')));
  place();
  addEventListener('resize', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ind) { ind.style.transition = 'none'; place(); void ind.offsetWidth; ind.style.transition = ''; } });
})();
