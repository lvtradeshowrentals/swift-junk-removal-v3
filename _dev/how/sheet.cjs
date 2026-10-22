// node _dev/how/sheet.cjs out.png cols cellW file1 file2 ...   (contact sheet of screenshots)
const { createRequire } = require('module');
const req = createRequire('C:/Users/Cleo/Desktop/world2/');
const puppeteer = req('puppeteer-core');
const fs = require('fs'), path = require('path');
const [out, cols, cellW, ...files] = process.argv.slice(2);
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  const data = files.map((f) => fs.readFileSync(path.resolve(f)).toString('base64'));
  const res = await page.evaluate(async (data, cols, cellW) => {
    const imgs = await Promise.all(data.map(async (b) => { const i = new Image(); i.src = 'data:image/png;base64,' + b; await i.decode(); return i; }));
    const w = +cellW, h = Math.round(w * imgs[0].height / imgs[0].width), c = +cols, rows = Math.ceil(imgs.length / c);
    const cv = document.createElement('canvas'); cv.width = w * c; cv.height = h * rows; const x = cv.getContext('2d');
    x.fillStyle = '#888'; x.fillRect(0, 0, cv.width, cv.height);
    imgs.forEach((im, n) => x.drawImage(im, (n % c) * w + 1, Math.floor(n / c) * h + 1, w - 2, h - 2));
    return cv.toDataURL('image/png').split(',')[1];
  }, data, cols, cellW);
  fs.writeFileSync(out, Buffer.from(res, 'base64'));
  await browser.close();
})();
