// node _dev/how/shot.cjs <size> <name> <s-values e.g. 0,.5,1.2> [--head] [--reduce] [--q k=v] [--clip]
// Fast shooter for the how section: blocks hero WebGL, scrolls to scrub position s (0..3) of the pinned track
// (or, for stacked layouts, to the panel fractions) and shoots.
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path'), fs = require('fs');
const SIZES = {
  desktop: { width: 1512, height: 900, deviceScaleFactor: 1 },
  laptop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  tablet: { width: 820, height: 1100, deviceScaleFactor: 1 },
  small: { width: 1024, height: 768, deviceScaleFactor: 1 },
  phone: { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const a = process.argv.slice(2);
const size = a[0] || 'desktop', name = a[1] || 'how', list = (a[2] || '0').split(',');
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const OUT = path.join(__dirname, '..', 'shots'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'file:///' + path.join(__dirname, '..', '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport(Object.assign({}, SIZES[size], a.includes('--dpr') ? { deviceScaleFactor: +opt('dpr') } : {}));
  await page.setRequestInterception(true);
  page.on('request', (r) => { const u = r.url(); if (/cloud-data\.js|hero-gl\.js/.test(u)) r.respond({ status: 200, contentType: 'text/javascript', body: '' }); else r.continue(); });
  page.on('pageerror', (e) => console.log('PAGEERROR:', String(e.stack).split('\n').slice(0, 4).join(' | ')));
  page.on('console', (m) => { const t = m.text(); if (/error|warn|fail|ARTS/i.test(t)) console.log('CON:', t.slice(0, 300)); });
  if (a.includes('--reduce')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => Promise.all([document.fonts.load('900 100px Archivo'), document.fonts.load('400 16px Geist'), document.fonts.load('500 12px "Geist Mono"')]).then(() => document.fonts.ready));
  await wait(900);
  const info = await page.evaluate(() => { const r = document.querySelector('#howTrack').getBoundingClientRect(); return { pin: document.querySelector('#how').classList.contains('is-pin'), top: r.top + scrollY, h: r.height, vh: innerHeight, secTop: document.querySelector('#how').getBoundingClientRect().top + scrollY }; });
  console.log(JSON.stringify(info));
  for (const v of list) {
    let y;
    if (a.includes('--head')) y = info.secTop + (+v);
    else if (a.includes('--abs')) y = +v;
    else if (info.pin) y = info.top + (info.h - info.vh) * (+v / 3);
    else { const t = await page.evaluate((v) => { const els = [...document.querySelectorAll('.how-art')]; const i = Math.floor(+v); const el = els[i]; const r = el.getBoundingClientRect(); return r.top + scrollY - (innerHeight - r.height) / 2; }, v); y = t; }
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await wait(a.includes('--flat-wait') ? +opt('flat-wait') : 450);
    if (!info.pin && !a.includes('--head') && !a.includes('--abs')) await wait(+opt('play', 7800) * (+v % 1 || 1));
    const f = path.join(OUT, `${name}_${v}.png`);
    if (a.includes('--crop')) {
      const [cx, cy, cw, ch] = opt('crop').split(',').map(Number); const dpr = +opt('dpr', 1);
      const buf = await page.screenshot({ encoding: 'base64' });
      const p2 = await browser.newPage();
      const out = await p2.evaluate(async (b64, cx, cy, cw, ch, dpr) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = cw * dpr; c.height = ch * dpr; c.getContext('2d').drawImage(img, cx * dpr, cy * dpr, cw * dpr, ch * dpr, 0, 0, cw * dpr, ch * dpr); return c.toDataURL('image/png').split(',')[1]; }, buf, cx, cy, cw, ch, dpr);
      fs.writeFileSync(f, Buffer.from(out, 'base64')); await p2.close();
    } else await page.screenshot({ path: f });
    console.log('shot', f);
  }
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(JSON.stringify(ov));
  await browser.close();
})();
