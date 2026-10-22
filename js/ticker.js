/* Marquee that drifts left; scrolling pushes it faster in the direction you scroll. */
(function () {
  'use strict';
  const S = window.SWIFT, track = document.getElementById('tkTrack');
  if (!S || !track || S.reduce) return;
  const set = track.firstElementChild;
  let x = 0, w = 0, boost = 0, lastY = window.scrollY, vis = true;
  const measure = () => { w = set.getBoundingClientRect().width; };
  measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure);
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; }).observe(track.parentNode);
  S.raf((t, dt) => {
    const y = window.scrollY, dy = y - lastY; lastY = y;
    boost += (Math.max(-60, Math.min(60, dy)) - boost) * Math.min(1, dt * 6);
    if (!vis || !w) return;
    x -= (56 + boost * 14) * dt;
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
})();
