// determinism check: state after scrolling forward then back must equal state reached directly
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => { if (/cloud-data|hero-gl/.test(r.url())) r.respond({ status: 200, contentType: 'text/javascript', body: '' }); else r.continue(); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('file:///C:/Users/Cleo/Desktop/swift-junk-removal-v3/index.html?nosmooth&nointro', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  const snap = (s) => page.evaluate(async (s) => {
    const t = document.querySelector('#howTrack'); const top = t.getBoundingClientRect().top + scrollY; scrollTo(0, top + (t.offsetHeight - innerHeight) * s / 3);
    await new Promise((r) => setTimeout(r, 400));
    return document.querySelector('#how .how-steps').outerHTML + document.querySelector('.how-rail').outerHTML;
  }, s);
  const seq = [0.45, 1.5, 2.6, 0.45, 2.9, 1.5, 2.6];
  const res = {};
  for (const s of seq) { const h = await snap(s); (res[s] = res[s] || []).push(h); }
  for (const k of Object.keys(res)) { const same = res[k].every((x) => x === res[k][0]); console.log(k, res[k].length, 'runs', same ? 'IDENTICAL' : 'DIFFERENT');
    if (!same) { const a = res[k][0].split('>'), b = res[k][1].split('>'); let n = 0; for (let i = 0; i < a.length && n < 6; i++) if (a[i] !== b[i]) { console.log('  A:', a[i].slice(0, 220)); console.log('  B:', b[i].slice(0, 220)); n++; } } }
  await browser.close();
})();
