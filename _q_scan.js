const fs = require('fs'), path = require('path');
const {scan, FA} = require('./_jstok');
const walk = d => fs.readdirSync(d, {withFileTypes:true}).flatMap(f => f.isDirectory() ? walk(path.join(d, f.name)) : [path.join(d, f.name)]);
console.log('--- _i18n_work / _i18n_bak');
['_i18n_work', '_i18n_bak'].forEach(d => { if(fs.existsSync(d)) console.log(d + ': ' + fs.readdirSync(d).map(f => f + '(' + fs.statSync(path.join(d, f)).size + ')').join(', ')); });
console.log('--- en.js head');
console.log(fs.readFileSync('js/i18n/locales/en.js', 'utf8').split('\n').slice(0, 6).map(l => l.slice(0, 160)).join('\n'));
console.log('--- per-file: Persian string literals in code (tokenized, comments excluded) | of which already inside __()/__f()/t()');
const rows = [];
walk('js').filter(f => /\.js$/.test(f) && !/archive|blockly|[\\/]i18n[\\/]|vendor/.test(f)).forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  let toks; try{ toks = scan(src).filter(t => t.kind !== 're' && t.kind !== 'comment' && FA.test(t.raw)); }catch(e){ rows.push([f, 'scan error ' + e.message]); return; }
  if(!toks.length) return;
  let wrapped = 0;
  toks.forEach(t => { const before = src.slice(Math.max(0, t.start !== undefined ? t.start - 12 : 0), t.start); if(/(__f?|\bt)\(\s*$/.test(before)) wrapped++; });
  rows.push([f, toks.length, wrapped, src.length]);
});
rows.sort((a, b) => (b[1] - b[2]) - (a[1] - a[2])).forEach(r => console.log(r.join(' | ')));
console.log('--- html files with Persian');
walk('.').filter(f => /\.html$/.test(f) && !/node_modules|archive|_i18n_bak/.test(f)).forEach(f => { const n = (fs.readFileSync(f, 'utf8').match(/[\u0600-\u06FF]+/g) || []).length; if(n) console.log(f, n, 'persian words,', (fs.readFileSync(f, 'utf8').match(/data-i18n/g) || []).length, 'data-i18n attrs'); });
