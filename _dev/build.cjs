// Assemble index.html from src/index.html + src/sections/*.html. Run:  node _dev/build.cjs
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const out = src.replace(/<!--@include ([\w./-]+)-->/g, (_, f) => fs.readFileSync(path.join(root, 'src', f), 'utf8'));
fs.writeFileSync(path.join(root, 'index.html'), out);
console.log('built index.html', out.length, 'bytes');
