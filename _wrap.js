// usage: node _wrap.js <group> <file...>   -> wraps Persian literals in __()/__f(), writes catalog to _i18n_work/
// Always starts from the pristine backup in _i18n_bak/, so it is safe to re-run.
const fs = require('fs'), path = require('path');
const {scan, FA} = require('./_jstok');
const [group, ...files] = process.argv.slice(2);
fs.mkdirSync('_i18n_work', {recursive: true}); fs.mkdirSync('_i18n_bak', {recursive: true});
const catalog = {}, byKey = {}, risky = [];
let nextId = 1;
const idFor = (pattern, file) => { if(byKey[pattern] === undefined){ const id = group[0] + nextId++; byKey[pattern] = id; catalog[id] = {fa: pattern, files: [file]}; } else if(!catalog[byKey[pattern]].files.includes(file)) catalog[byKey[pattern]].files.push(file); return byKey[pattern]; };
const lineOf = (src, i) => src.slice(0, i).split('\n').length;
const FAS = '\\u0600-\\u06FF';

function skipExpr(src, i){
  let depth = 1;
  while(i < src.length && depth){
    const c = src[i];
    if(c === '\\'){ i += 2; continue; }
    if(c === '"' || c === "'"){ i++; while(i < src.length && src[i] !== c){ if(src[i] === '\\') i++; i++; } }
    else if(c === '`'){ i++; while(i < src.length && src[i] !== '`'){ if(src[i] === '\\'){ i += 2; continue; } if(src[i] === '$' && src[i + 1] === '{'){ i = skipExpr(src, i + 2); continue; } i++; } }
    else if(c === '{') depth++;
    else if(c === '}') depth--;
    i++;
  }
  return i;
}
function splitTemplate(raw){
  const body = raw.slice(1, -1), quasis = [], exprs = [];
  let cur = '', i = 0;
  while(i < body.length){
    if(body[i] === '\\'){ cur += body.slice(i, i + 2); i += 2; continue; }
    if(body[i] === '$' && body[i + 1] === '{'){ const end = skipExpr(body, i + 2); quasis.push(cur); cur = ''; exprs.push(body.slice(i + 2, end - 1)); i = end; continue; }
    cur += body[i++];
  }
  quasis.push(cur);
  return {quasis, exprs};
}
const cook = q => new Function('return `' + q + '`')();

// markup / CSS template: translate only the Persian text nodes and quoted values, keep everything else byte for byte
function fragQuasi(raw, file){
  const masked = raw.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
  const spots = [];
  for(const m of masked.matchAll(/(["'])((?:(?!\1)[^\\\n])*)\1/g)) if(FA.test(m[2])) spots.push([m.index + 1, m.index + 1 + m[2].length]);
  for(const m of masked.matchAll(new RegExp('(?:^|>)([^<>"\']*[' + FAS + '][^<>"\']*)(?=<|$)', 'g'))){ const st = m.index + (m[0].length - m[1].length); spots.push([st, st + m[1].length]); }
  spots.sort((a, b) => a[0] - b[0]);
  let out = '', pos = 0;
  for(const [s, e] of spots){
    if(s < pos) continue;
    const frag = raw.slice(s, e), lead = frag.match(/^\s*/)[0], trail = frag.match(/\s*$/)[0], core = frag.slice(lead.length, frag.length - trail.length);
    if(!FA.test(core)) continue;
    let cooked; try{ cooked = cook(core); }catch(e){ continue; }
    idFor(cooked, file);
    out += raw.slice(pos, s) + lead + '${__(' + JSON.stringify(cooked) + ')}' + trail;
    pos = e;
  }
  return out + raw.slice(pos);
}

function transform(src, file){
  const toks = scan(src).filter(t => t.kind !== 're' && FA.test(t.raw));
  let out = '', pos = 0;
  for(const t of toks){
    if(t.s < pos) continue;
    out += src.slice(pos, t.s);
    pos = t.e;
    let p = t.s - 1; while(p >= 0 && /\s/.test(src[p])) p--;
    let q = t.e; while(q < src.length && /\s/.test(src[q])) q++;
    const before = src.slice(Math.max(0, p - 40), p + 1), prevCh = src[p], nextCh = src[q];
    const lineTxt = src.slice(src.lastIndexOf('\n', t.s) + 1, src.indexOf('\n', t.e)).trim().slice(0, 140);
    let why = null;
    if(/console\.\w+\s*\($/.test(before)) why = 'console';
    else if(/(===|!==|==|!=)$/.test(before) || /\bcase$/.test(before)) why = 'comparison';
    else if(/\.(includes|indexOf|lastIndexOf|startsWith|endsWith|split|test|match|search|has|get|hasOwnProperty)\s*\($/.test(before)) why = 'matched-against-data';
    else if(prevCh === '[' && /[\w\])$]/.test(src[p - 1] || '')) why = 'member-key';
    else if(nextCh === ':' && /[{,]/.test(prevCh || '')) why = 'object-key';
    if(why === 'console'){ out += t.raw; continue; }
    if(why){ risky.push(file + ':' + lineOf(src, t.s) + ' [' + why + '] ' + lineTxt); out += t.raw; continue; }
    if(t.kind === '`'){
      const {quasis, exprs} = splitTemplate(t.raw);
      const markupLike = t.raw.length > 400 || /<[a-zA-Z\/!]/.test(t.raw) || /\/\*/.test(t.raw);
      if(markupLike){
        out += '`' + quasis.map((qq, i) => fragQuasi(qq, file) + (i < exprs.length ? '${' + transform(exprs[i], file) + '}' : '')).join('') + '`';
        continue;
      }
      if(!exprs.length){ const key = cook(quasis[0]); idFor(key, file); out += '__(' + JSON.stringify(key) + ')'; continue; }
      const cooked = quasis.map(cook);
      if(!cooked.some(c => FA.test(c))){ out += '`' + quasis.map((qq, i) => qq + (i < exprs.length ? '${' + transform(exprs[i], file) + '}' : '')).join('') + '`'; continue; }
      const key = cooked.map((c, i) => c + (i < exprs.length ? '{' + i + '}' : '')).join('');
      idFor(key, file);
      out += '__f(' + JSON.stringify(key) + ', ' + exprs.map(e => transform(e, file)).join(', ') + ')';
    } else {
      let key; try{ key = new Function('return ' + t.raw)(); }catch(e){ risky.push(file + ':' + lineOf(src, t.s) + ' [uncookable] ' + lineTxt); out += t.raw; continue; }
      idFor(key, file);
      out += '__(' + t.raw + ')';
    }
  }
  return out + src.slice(pos);
}

files.forEach(file => {
  const bak = path.join('_i18n_bak', file.replace(/[\\/]/g, '__'));
  if(!fs.existsSync(bak)) fs.writeFileSync(bak, fs.readFileSync(file, 'utf8'));
  const src = fs.readFileSync(bak, 'utf8');
  fs.writeFileSync(file, transform(src, file));
  console.log(file, 'rewritten');
});
fs.writeFileSync('_i18n_work/' + group + '.cat.json', JSON.stringify(catalog, null, 1));
fs.writeFileSync('_i18n_work/' + group + '.cat.txt', Object.keys(catalog).map(id => id + ' ## ' + catalog[id].fa.replace(/\n/g, '\\n')).join('\n'));
fs.writeFileSync('_i18n_work/' + group + '.risky.txt', risky.join('\n'));
console.log('catalog entries:', Object.keys(catalog).length, ' risky/skipped:', risky.length);
