// Fast dev screenshots for sections: skips the hero WebGL payload.
//   node _dev/qshoot.cjs <size> <name> "#quote|#promise|#faq" [--pre "js"] [--clip]
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const fs = require('fs');
const SIZES = {
  desktop: { width: 1512, height: 900, deviceScaleFactor: 1 }, laptop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  tablet: { width: 820, height: 1100, deviceScaleFactor: 1 }, phone: { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const a = process.argv.slice(2);
const size = a[0] || 'desktop', name = a[1] || 'q', sels = (a[2] || '#quote').split('|');
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport(Object.assign({}, SIZES[size], opt('h') ? { height: +opt('h') } : {}, opt('dpr') ? { deviceScaleFactor: +opt('dpr') } : {}));
  await page.setRequestInterception(true);
  page.on('request', (r) => { const u = r.url(); if (/cloud-data\.js|hero-gl\.js/.test(u)) r.abort(); else if (/formsubmit\.co/.test(u)) r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"success":"true"}' }); else r.continue(); });
  page.on('pageerror', (e) => console.log('PAGEERROR:', String(e.stack).split('\n').slice(0, 4).join(' | ')));
  page.on('console', (m) => { const t = m.text(); if (/error|fail/i.test(t) && !/ERR_FAILED|cloud-data|hero-gl|net::/i.test(t)) console.log('CON:', t.slice(0, 300)); });
  if (a.includes('--reduce')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => Promise.race([Promise.all([document.fonts.load('900 100px Archivo'), document.fonts.load('400 16px Geist'), document.fonts.load('500 12px "Geist Mono"')]).then(() => document.fonts.ready), new Promise((r) => setTimeout(r, 8000))]));
  if (opt('pre')) { await page.evaluate(opt('pre')); await wait(1200); }
  const off = +opt('off', 0);
  for (const s of sels) {
    await page.evaluate((s, off) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + off); }, s, off);
    await wait(+opt('wait', 1700));
    if (opt('hover')) { await page.hover(opt('hover')); await wait(1300); }
    const f = path.join(OUT, `${name}_${s.replace(/[^a-z0-9]/gi, '')}${off ? '_' + off : ''}.png`);
    await page.screenshot({ path: f }); console.log('shot', f);
  }
  console.log(JSON.stringify(await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))));
  await browser.close();
})();
