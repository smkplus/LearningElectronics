// minimal JS tokenizer: finds string / template literals (outside comments & regex) that contain Persian
const fs = require('fs');
const FA = /[\u0600-\u06FF]/;
function scan(src){
  const out = [], n = src.length;
  let i = 0, lastSig = '';           // last significant (non-space, non-comment) char, to tell regex from division
  const regexOk = () => lastSig === '' || /[(,=:\[!&|?{};+\-*%<>~^]/.test(lastSig) || /(return|typeof|case|of|in)$/.test(src.slice(Math.max(0, i - 8), i).trim());
  while(i < n){
    const c = src[i], d = src[i + 1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ i += 2; while(i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if(c === '"' || c === "'"){
      const s = i; i++;
      while(i < n && src[i] !== c){ if(src[i] === '\\') i++; i++; }
      i++; out.push({s, e: i, kind: c, raw: src.slice(s, i)}); lastSig = c; continue;
    }
    if(c === '`'){
      const s = i; i++; let depth = 0;
      while(i < n){
        if(src[i] === '\\'){ i += 2; continue; }
        if(depth === 0 && src[i] === '`') break;
        if(src[i] === '$' && src[i + 1] === '{'){ depth++; i += 2; continue; }
        if(depth > 0 && src[i] === '{') depth++;
        else if(depth > 0 && src[i] === '}') depth--;
        else if(depth > 0 && (src[i] === '"' || src[i] === "'")){ const q = src[i]; i++; while(i < n && src[i] !== q){ if(src[i] === '\\') i++; i++; } }
        i++;
      }
      i++; out.push({s, e: i, kind: '`', raw: src.slice(s, i)}); lastSig = '`'; continue;
    }
    if(c === '/' && regexOk()){
      const s = i; i++; let cls = false;
      while(i < n && (src[i] !== '/' || cls) && src[i] !== '\n'){ if(src[i] === '\\') i++; else if(src[i] === '[') cls = true; else if(src[i] === ']') cls = false; i++; }
      i++; while(/[a-z]/.test(src[i] || '')) i++;
      out.push({s, e: i, kind: 're', raw: src.slice(s, i)}); lastSig = ')'; continue;
    }
    if(!/\s/.test(c)) lastSig = c;
    i++;
  }
  return out;
}
module.exports = {scan, FA};
if(require.main === module){
  const files = process.argv.slice(2);
  let totalLits = 0, totalWords = 0;
  files.forEach(f => {
    const src = fs.readFileSync(f, 'utf8');
    const lits = scan(src).filter(l => FA.test(l.raw) && l.kind !== 're');
    const tpl = lits.filter(l => l.kind === '`'), hasExpr = tpl.filter(l => /\$\{/.test(l.raw));
    const words = lits.reduce((s, l) => s + (l.raw.match(/[\u0600-\u06FF]+/g) || []).length, 0);
    const re = scan(src).filter(l => l.kind === 're' && FA.test(l.raw)).length;
    console.log(f.padEnd(40), 'persian literals:', String(lits.length).padStart(4), ' words:', String(words).padStart(5), ' template:', tpl.length, '(with ${}:', hasExpr.length + ')', ' persian-in-regex:', re);
    totalLits += lits.length; totalWords += words;
  });
  console.log('TOTAL literals', totalLits, 'words', totalWords);
}
