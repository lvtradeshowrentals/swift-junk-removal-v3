// Capture the preloader + hero intro as a timed sequence (no ?nointro).  node pre.cjs [desktop|phone] [times ms,..]
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const size = process.argv[2] || 'desktop';
const times = (process.argv[3] || '300,800,1500,1900,2300,3200').split(',').map(Number);
const V = size === 'phone' ? { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1512, height: 900, deviceScaleFactor: 1 };
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  await page.setViewport(V);
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
  const url = 'file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth';
  const t0 = Date.now();
  page.goto(url, { waitUntil: 'domcontentloaded' });
  for (const t of times) {
    const wait = t - (Date.now() - t0); if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const f = path.join(__dirname, 'shots', `pre_${size}_${t}.png`);
    await page.screenshot({ path: f }); console.log('shot', f, Date.now() - t0);
  }
  await browser.close();
})();
