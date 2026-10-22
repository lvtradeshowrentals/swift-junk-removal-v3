/* PROMISES: stagger the line-draw of each icon; on touch screens (no hover) the row nearest the middle of the viewport lights up its numeral. */
(function () {
  'use strict';
  const rows = Array.from(document.querySelectorAll('#promise .pr'));
  if (!rows.length) return;
  rows.forEach((r) => r.querySelectorAll('.pr-ico > *').forEach((el, i) => el.style.setProperty('--k', i)));
  if (!('IntersectionObserver' in window)) { rows.forEach((r) => r.classList.add('in')); return; }
  /* touch / no-hover: mark the row crossing the viewport's middle band so the numeral can respond */
  if (!matchMedia('(hover: hover)').matches) {
    const mid = new IntersectionObserver((en) => en.forEach((e) => e.target.classList.toggle('hot', e.isIntersecting)), { rootMargin: '-42% 0px -42% 0px' });
    rows.forEach((r) => mid.observe(r));
  }
})();
