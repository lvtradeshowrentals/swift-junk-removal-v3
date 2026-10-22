// Real-GPU frame-rate probe (headed Chrome). node perf.cjs [scale]
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: false, args: ['--window-size=1500,950', '--window-position=0,0'], defaultViewport: { width: 1440, height: 800 } });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
  await page.goto('http://localhost:8766/?nointro', { waitUntil: 'networkidle2', timeout: 60000 });
  await wait(1500);
  const gl = await page.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; });
  console.log('renderer:', gl);
  const measure = (label, fn) => page.evaluate(async (fnSrc) => {
    const f = new Function('return ' + fnSrc)();
    const times = []; let last = performance.now(); const t0 = last;
    await new Promise((res) => { (function loop(t) { times.push(t - last); last = t; f((t - t0) / 1000); if (t - t0 < 3500) requestAnimationFrame(loop); else res(); })(performance.now()); });
    times.shift(); times.sort((a, b) => a - b);
    return { fps: Math.round(1000 / (times.reduce((a, b) => a + b, 0) / times.length)), p95ms: Math.round(times[Math.floor(times.length * .95)]), max: Math.round(times[times.length - 1]), n: times.length };
  }, fn).then((r) => console.log(label, JSON.stringify(r)));
  await measure('hero idle      ', '(t) => {}');
  await measure('hero scrolling ', '(t) => { const h = document.querySelector("#hero"); window.scrollTo(0, (0.5 + 0.5 * Math.sin(t * 1.2)) * (h.offsetHeight - innerHeight)); }');
  await measure('whole page     ', '(t) => { window.scrollTo(0, ((t * 700) % (document.documentElement.scrollHeight - innerHeight))); }');
  await browser.close();
})();
