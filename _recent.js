const fs = require('fs'), path = require('path');
const rows = [];
(function walk(d){
  for(const f of fs.readdirSync(d, {withFileTypes:true})){
    const p = path.join(d, f.name);
    if(/node_modules|[\\/]\.git/.test(p)) continue;
    if(f.isDirectory()) walk(p); else { const s = fs.statSync(p); rows.push([s.mtimeMs, p, s.size]); }
  }
})('.');
rows.sort((a, b) => b[0] - a[0]);
const now = Date.now();
console.log('now', new Date(now).toLocaleString());
rows.slice(0, 32).forEach(r => console.log(((now - r[0]) / 3600000).toFixed(1) + 'h ago | ' + Math.round(r[2] / 1024) + 'KB | ' + r[1]));
