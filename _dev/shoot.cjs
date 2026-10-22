// Dev-only screenshots.
//   node shoot.cjs <size> <name> [--hero 0,.3,.6] [--y 0,1200] [--sel "#quote"] [--q "extra=query"] [--wait ms] [--full]
// size: desktop | laptop | wide | tablet | phone
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SIZES = {
  desktop: { width: 1512, height: 900, deviceScaleFactor: 1 },
  laptop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  tablet: { width: 820, height: 1100, deviceScaleFactor: 1 },
  phone: { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const a = process.argv.slice(2);
const size = a[0] || 'desktop', name = a[1] || 'shot';
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro' + (opt('q') ? '&' + opt('q') : '');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// headless only ticks rAF while frames are being produced, so spin it to let scroll-driven state and CSS transitions settle
const settle = (page, n = 50) => page.evaluate((n) => new Promise((r) => { let i = 0; (function f() { if (++i > n) setTimeout(r, 450); else requestAnimationFrame(f); })(); }), n);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new',
    args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  await page.setViewport(SIZES[size]);
  page.on('pageerror', (e) => console.log('PAGEERROR:', String(e.stack).split('\n').slice(0, 4).join(' | ')));
  page.on('console', (m) => { const t = m.text(); if (/error|warn|fail/i.test(t)) console.log('CON:', t.slice(0, 300)); });
  if (a.includes('--reduce')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(URL, { waitUntil: 'load', timeout: 90000 }).catch((e) => console.log('goto:', e.message));
  await page.evaluate(() => Promise.race([Promise.all([document.fonts.load('900 100px Archivo'), document.fonts.load('400 16px Geist'), document.fonts.load('500 12px "Geist Mono"')]).then(() => document.fonts.ready), new Promise((r) => setTimeout(r, 12000))]));
  await wait(+(opt('wait', 1600)));
  const shots = [];
  if (opt('intro')) {
    for (const v of opt('intro').split(',')) {
      await page.evaluate((v) => { SWIFT.hero.intro = +v; SWIFT.hero.setProgress(0, true); SWIFT.hero.draw(); document.querySelector('#tgt').classList.toggle('on', +v > .55); }, v);
      await wait(400);
      const f = path.join(OUT, `${name}_intro${v}.png`); await page.screenshot({ path: f }); shots.push(f);
    }
  } else if (opt('hero')) {
    for (const p of opt('hero').split(',')) {
      await page.evaluate((p) => { const h = document.querySelector('#hero'); const top = h.getBoundingClientRect().top + scrollY; window.scrollTo(0, top + (+p) * (h.offsetHeight - innerHeight)); }, p);
      await wait(500);
      await page.evaluate((p) => { if (SWIFT.hero) { SWIFT.hero.setProgress(+p, true); SWIFT.hero.draw(); } }, p);
      await settle(page, 20);
      const f = path.join(OUT, `${name}_hero${p}.png`); await page.screenshot({ path: f }); shots.push(f);
    }
  } else if (opt('sel')) {
    for (const s of opt('sel').split('|')) {
      await page.evaluate((s) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 0); }, s);
      await settle(page);
      const f = path.join(OUT, `${name}_${s.replace(/[^a-z0-9]/gi, '')}.png`); await page.screenshot({ path: f }); shots.push(f);
    }
  } else {
    for (const y of (opt('y', '0')).split(',')) {
      await page.evaluate((y) => window.scrollTo(0, +y), y);
      await settle(page);
      const f = path.join(OUT, `${name}_y${y}.png`); await page.screenshot({ path: f, fullPage: a.includes('--full') }); shots.push(f);
    }
  }
  shots.forEach((f) => console.log('shot', f));
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, gl: !document.documentElement.classList.contains('no-gl') }));
  console.log(JSON.stringify(ov));
  await browser.close();
})();
