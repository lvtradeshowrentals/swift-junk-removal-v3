/* Finale: the big chevron slides in from the left as the section arrives, and settles. */
(function () {
  'use strict';
  const S = window.SWIFT, sec = document.getElementById('finale'), mk = document.getElementById('finMk');
  if (!S || !sec || !mk || S.reduce) return;
  let vis = false;
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; }).observe(sec);
  S.raf(() => {
    if (!vis) return;
    const p = S.cross(sec);                  /* 0 as it enters, 1 as it leaves */
    const x = (1 - Math.min(1, p * 1.7)) * -34 * innerWidth / 100;
    mk.style.setProperty('--mx', x.toFixed(1) + 'px');
  });
})();
