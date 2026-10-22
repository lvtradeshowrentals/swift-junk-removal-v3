// Tiny local web server for previewing the Swift v3 site. No dependencies.
//   node serve.cjs            serve this folder and open the browser
//   node serve.cjs --no-open  serve only
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = 8766;
const URL = 'http://localhost:' + PORT + '/';
const OPEN = process.argv.indexOf('--no-open') < 0;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found: ' + p); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

function openBrowser() {
  if (!OPEN) return;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const exe = candidates.find((c) => fs.existsSync(c));
  exec(exe ? 'start "" "' + exe + '" --new-window "' + URL + '"' : 'start "" "' + URL + '"');
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { console.log('Already running on port ' + PORT + '. Opening the page.'); openBrowser(); setTimeout(() => process.exit(0), 600); return; }
  console.error('Could not start the preview server:', e.message); process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  Swift Junk Removal (v3) preview is running at ' + URL);
  console.log('  Keep this window open while you look around. Close it to stop.');
  console.log('');
  openBrowser();
});
