// Form-flow test: node _dev/qflow.cjs [size] [--fail]   (FormSubmit is intercepted; --fail makes it error)
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const path = require('path'), fs = require('fs');
const size = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'desktop';
const FAIL = process.argv.includes('--fail');
const SIZES = { desktop: { width: 1512, height: 1500, deviceScaleFactor: 1 }, phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, tablet: { width: 820, height: 1100, deviceScaleFactor: 1 } };
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--hide-scrollbars'] });
  const p = await b.newPage(); await p.setViewport(SIZES[size]);
  await p.setRequestInterception(true);
  let posted = null;
  p.on('request', (r) => {
    const u = r.url();
    if (/cloud-data|hero-gl/.test(u)) return r.abort();
    if (/formsubmit\.co/.test(u)) { posted = r.postData() ? r.postData().length : 0; return FAIL ? r.respond({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"success":"false"}' }) : r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"success":"true"}' }); }
    r.continue();
  });
  p.on('pageerror', (e) => console.log('PAGEERROR:', String(e.stack).split('\n').slice(0, 4).join(' | ')));
  p.on('console', (m) => { const t = m.text(); if (/error/i.test(t) && !/ERR_FAILED|net::/i.test(t)) console.log('CON:', t.slice(0, 300)); });
  await p.goto('file:///' + path.join(__dirname, '..', 'index.html').split(path.sep).join('/') + '?nosmooth&nointro', { waitUntil: 'load', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready); await wait(800);
  const go = async (sel) => { await p.evaluate((s) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70); }, sel); await wait(900); };
  const shot = async (n) => { const f = path.join(OUT, `qf_${size}_${n}.png`); await p.screenshot({ path: f }); console.log('shot', n); };
  const text = (s) => p.$eval(s, (e) => e.textContent.trim());
  await go('#quote');
  // 1. try to continue with nothing picked
  await p.click('#qNext'); await wait(500);
  console.log('err step1:', await text('#e-service'));
  await shot('1_error');
  // 2. pick via real clicks
  const rows = await p.$$('.svc');
  await rows[1].click(); await wait(300); await rows[4].click(); await wait(1500);
  console.log('caption:', await text('#ldCap'), '| count:', await text('#ldCount'));
  await shot('2_picked');
  await rows[0].click(); await rows[2].click(); await rows[3].click(); await wait(1800);
  console.log('caption (all):', await text('#ldCap'));
  await shot('3_all');
  // not sure alone
  await rows[5].click(); await wait(1200);
  console.log('caption (general):', await text('#ldCap'), 'checked count:', await p.$$eval('input[name=service]:checked', (e) => e.length));
  await shot('3b_general');
  await rows[1].click(); await rows[3].click(); await wait(1200);
  // 3. next -> step 2, empty zip error
  await p.click('#qNext'); await wait(1000);
  console.log('step2 pane on:', await p.$eval('.pane.on', (e) => e.dataset.step), 'inert on others:', await p.$$eval('.pane:not(.on)', (e) => e.every((x) => x.inert)));
  await p.click('#qNext'); await wait(500);
  console.log('err zip:', await text('#e-zip'), '| focus id:', await p.evaluate(() => document.activeElement.id));
  await shot('4_zip_error');
  await p.type('#f-zip', '89052'); await wait(300);
  console.log('zip note:', await text('#zipNote'), '| sum:', await text('#sumZip'));
  await p.$$eval('input[name=when]', (e) => e[1].click());
  await p.click('#f-details'); await p.type('#f-details', 'Couch and two mattresses.'); await wait(500);
  await shot('5_step2');
  await p.click('#qNext'); await wait(1000);
  // 4. step 3 errors
  await p.click('#qNext'); await wait(500);
  console.log('err name:', await text('#e-name'), '| err phone:', await text('#e-phone'));
  await shot('6_step3_error');
  await p.type('#f-name', 'Test Person'); await p.type('#f-phone', '7025550123');
  // photo upload
  const png = path.join(OUT, 'qf_test.png');
  if (fs.existsSync(path.join(__dirname, '..', 'img', 'garage.jpg'))) {
    const inp = await p.$('#f-photos'); await inp.uploadFile(path.join(__dirname, '..', 'img', 'garage.jpg'), path.join(__dirname, '..', 'img', 'yard.jpg')); await wait(800);
    console.log('thumbs:', await p.$$eval('#thumbs li', (e) => e.length), '| drop label:', await text('#dropLabel'));
  }
  await shot('7_step3_filled');
  // back works
  await p.click('#qBack'); await wait(900); console.log('back -> step', await p.$eval('.pane.on', (e) => e.dataset.step));
  await p.click('#qNext'); await wait(900);
  await p.click('#qNext'); await wait(1600);
  console.log('posted bytes:', posted, '| form hidden:', await p.$eval('#quoteForm', (e) => e.hidden), '| done hidden:', await p.$eval('#qDone', (e) => e.hidden));
  console.log('fail shown:', await p.$eval('#sendFail', (e) => !e.hidden));
  await shot('8_result');
  if (!FAIL) {
    console.log('ref:', await text('#doneNo'), '| active is done:', await p.evaluate(() => document.activeElement.id));
    await p.click('#qAgain'); await wait(1200);
    console.log('after again: step', await p.$eval('.pane.on', (e) => e.dataset.step), '| checked:', await p.$$eval('input[name=service]:checked', (e) => e.length), '| caption:', await text('#ldCap'));
    await shot('9_again');
    // data-service preselect from an outside link
    await p.evaluate(() => { const a = document.createElement('a'); a.href = '#quote'; a.dataset.service = 'yard'; a.id = 'testlink'; a.textContent = 'x'; document.body.appendChild(a); });
    await p.evaluate(() => document.getElementById('testlink').click()); await wait(1200);
    console.log('preselect yard ->', await p.$$eval('input[name=service]:checked', (e) => e.map((x) => x.value).join(',')), '| caption:', await text('#ldCap'));
  }
  await b.close();
})();
