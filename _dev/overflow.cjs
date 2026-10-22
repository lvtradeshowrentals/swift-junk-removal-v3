// node _dev/overflow.cjs <width> [selector]  -> lists elements that stick out horizontally
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const W = +process.argv[2] || 390;
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: W, height: 800, isMobile: W < 500, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/cloud-data|hero-gl/.test(r.url()) ? r.abort() : r.continue()));
  await p.goto('file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro', { waitUntil: 'load', timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  console.log(JSON.stringify(await p.evaluate((sel) => {
    const cw = document.documentElement.clientWidth; const out = [];
    document.querySelectorAll(sel).forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > cw + 1) out.push(e.tagName + '.' + (typeof e.className === 'string' ? e.className : '') + '#' + e.id + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); });
    return { cw, sw: document.documentElement.scrollWidth, n: out.length, sample: out.slice(0, 14) };
  }, process.argv[3] || '#quote *, #promise *, #faq *')));
  await b.close();
})();
