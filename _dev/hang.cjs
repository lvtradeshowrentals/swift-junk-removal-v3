// Why does the page not reach 'load'? Logs requests still pending and main-thread liveness.
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 900 });
  const pending = new Map();
  page.on('request', (r) => pending.set(r.url(), Date.now()));
  page.on('requestfinished', (r) => pending.delete(r.url()));
  page.on('requestfailed', (r) => { console.log('FAILED', r.url().slice(0, 100), r.failure() && r.failure().errorText); pending.delete(r.url()); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => console.log('CON', m.text().slice(0, 200)));
  const t0 = Date.now();
  page.goto('file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro', { waitUntil: 'domcontentloaded', timeout: 60000 }).then(() => console.log('DCL at', Date.now() - t0)).catch((e) => console.log('goto err', e.message));
  for (let i = 0; i < 6; i++) {
    await wait(3000);
    const alive = await Promise.race([page.evaluate(() => performance.now()).then(() => 'alive'), wait(2500).then(() => 'BLOCKED')]).catch((e) => 'err ' + e.message);
    console.log(`t=${Date.now() - t0}ms main thread: ${alive}; pending: ${Array.from(pending.keys()).map((u) => u.slice(-60)).join(' | ')}`);
  }
  await browser.close();
})();
