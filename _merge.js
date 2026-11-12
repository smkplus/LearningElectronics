// usage: node _merge.js <group> [localeName]   -> js/i18n/locales/en.<localeName>.js from _i18n_work/<group>.cat.json + <group>.en.*.json
const fs = require('fs');
const [group, name = group] = process.argv.slice(2);
const cat = JSON.parse(fs.readFileSync('_i18n_work/' + group + '.cat.json', 'utf8'));
const en = {};
fs.readdirSync('_i18n_work').filter(f => f.startsWith(group + '.en.') && f.endsWith('.json')).sort().forEach(f => Object.assign(en, JSON.parse(fs.readFileSync('_i18n_work/' + f, 'utf8'))));
const ids = Object.keys(cat), problems = [];
const ph = s => (String(s).match(/\{\d+\}|\$\{[^}]*\}/g) || []).sort().join(',');
const tags = s => (String(s).match(/<\/?[a-zA-Z][^>]*>/g) || []).map(t => t.replace(/\s+/g, ' ')).sort().join('');
const out = {};
ids.forEach(id => {
  const fa = cat[id].fa, e = en[id];
  if(e === undefined){ problems.push(id + ' MISSING english'); return; }
  if(/[\u0600-\u06FF]/.test(e)) problems.push(id + ' still has Persian: ' + e.slice(0, 60));
  if(ph(fa) !== ph(e)) problems.push(id + ' placeholders differ: [' + ph(fa) + '] vs [' + ph(e) + ']  ' + e.slice(0, 50));
  if(tags(fa) !== tags(e)) problems.push(id + ' html tags differ: ' + e.slice(0, 60));
  out[fa] = e;
});
Object.keys(en).filter(k => !cat[k]).forEach(k => problems.push(k + ' not in catalog'));
console.log('group', group, '| catalog', ids.length, '| english', Object.keys(en).length, '| merged', Object.keys(out).length, '| problems', problems.length);
problems.slice(0, 40).forEach(p => console.log('  ' + p));
if(!problems.length || process.argv.includes('--force')){
  const body = Object.keys(out).map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(out[k])).join(',\n');
  fs.writeFileSync('js/i18n/locales/en.' + name + '.js', "// generated from _i18n_work/" + group + ".*.json — Persian source text is the key (see __() / __f())\nI18n.register({ code: 'en', strings: {\n" + body + "\n} });\n");
  console.log('wrote js/i18n/locales/en.' + name + '.js');
}
