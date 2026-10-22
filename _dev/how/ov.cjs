// node _dev/how/ov.cjs <size>  -> lists elements wider than the viewport
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const SIZES0 = { desktop: [1512, 900], tablet: [820, 1100], phone: [390, 780], laptop: [1280, 720] };
(async () => {
  const [w, h] = SIZES[process.argv[2] || 'phone'];
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await page.setRequestInterception(true);
  page.on('request', (r) => { if (/cloud-data|hero-gl/.test(r.url())) r.respond({ status: 200, contentType: 'text/javascript', body: '' }); else r.continue(); });
  await page.goto('file:///C:/Users/Cleo/Desktop/swift-junk-removal-v3/index.html?nosmooth&nointro', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const out = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth, res = [];
    document.querySelectorAll('body *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > cw + 1 && r.width > 0) res.push((e.id || e.className.baseVal || e.className || e.tagName).toString().slice(0, 40) + ' ' + e.tagName + ' right=' + Math.round(r.right) + ' in ' + (e.closest('section') ? e.closest('section').id : '-')); });
    return { sw: document.documentElement.scrollWidth, cw, res: res.filter((x) => / in how$/.test(x)).slice(0, 25) };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
