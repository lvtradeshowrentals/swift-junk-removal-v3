// Generic debug: node dbg.cjs "<selector to scroll to>" "<js expression evaluated in page>" [phone]
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const sel = process.argv[2] || '#finale';
const expr = process.argv[3] || '1';
const phone = process.argv[4] === 'phone';
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport(phone ? { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1512, height: 900 });
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
  page.on('console', (m) => console.log('CON:', m.text().slice(0, 300)));
  await page.goto('file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro', { waitUntil: 'networkidle2' });
  await page.evaluate((s) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY); }, sel);
  await new Promise((r) => setTimeout(r, 1500));
  console.log(JSON.stringify(await page.evaluate(expr), null, 1));
  await browser.close();
})();
