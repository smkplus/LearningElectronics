const fs = require('fs'), path = require('path');
const walk = d => fs.readdirSync(d, {withFileTypes:true}).flatMap(f => f.isDirectory() ? walk(path.join(d, f.name)) : [path.join(d, f.name)]);
console.log('file | __( calls | t( calls | I18n.localizeTree');
walk('js').filter(f => /\.js$/.test(f) && !/archive|blockly|[\\/]i18n[\\/]|vendor/.test(f)).forEach(f => {
  const s = fs.readFileSync(f, 'utf8');
  const a = (s.match(/\b__f?\(/g) || []).length, b = (s.match(/[^.\w]t\(['"`]/g) || []).length, c = (s.match(/localizeTree/g) || []).length;
  if(a || b || c) console.log(f, '|', a, '|', b, '|', c);
});
const en = fs.readFileSync('js/i18n/locales/en.js', 'utf8');
const keys = [...en.matchAll(/^\s*(['"`])((?:\\.|(?!\1).)*)\1\s*:/gm)].map(m => m[2]);
const fa = keys.filter(k => /[\u0600-\u06FF]/.test(k)), dotted = keys.filter(k => !/[\u0600-\u06FF]/.test(k));
console.log('en.js keys:', keys.length, '| Persian-text keys (gettext):', fa.length, '| dotted keys:', dotted.length);
console.log('sample gettext keys:', fa.slice(0, 4).map(k => k.slice(0, 50)).join(' || '));
console.log('index.html locale scripts:', (fs.readFileSync('index.html', 'utf8').match(/locales\/[\w.]+\.js/g) || []).join(', '));
console.log('script tags for quest/arduino/lab:', (fs.readFileSync('index.html', 'utf8').match(/src="js\/[^"]+"/g) || []).length);
['_i18n_work/arduino.en.1.json'].forEach(f => { const j = fs.readFileSync(f, 'utf8'); console.log(f, j.slice(0, 300).replace(/\n/g, ' ')); });
