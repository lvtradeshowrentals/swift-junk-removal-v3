// Render the social-share card (1200x630) from the hero mid-sweep.   node og.cjs [progress]
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const p = +(process.argv[2] || 0.42);
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto('file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro', { waitUntil: 'networkidle2' });
  await page.evaluate(() => Promise.all([document.fonts.load('900 100px Archivo'), document.fonts.load('400 16px Geist')]));
  await page.addStyleTag({ content: '.nav,.hero-top,.hero-foot,.hero-side,.idx,.prog,.cur,.grain,.tgt{display:none!important}.hero-copy{bottom:0!important}.hero-h{font-size:21vw!important}' });
  await page.evaluate((p) => { const h = document.querySelector('#hero'); window.scrollTo(0, p * (h.offsetHeight - innerHeight)); SWIFT.hero.intro = 1; SWIFT.hero.setProgress(p, true); document.querySelector('#hero').classList.add('go'); }, p);
  await page.evaluate(() => new Promise((r) => { let i = 0; (function f() { if (++i > 40) setTimeout(r, 600); else requestAnimationFrame(f); })(); }));
  await page.screenshot({ path: path.join(__dirname, '..', 'img', 'og.jpg'), type: 'jpeg', quality: 86 });
  console.log('og.jpg written');
  await browser.close();
})();
