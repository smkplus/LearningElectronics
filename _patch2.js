const fs = require('fs');
const f = __dirname + '/js/circuit/circuit-editor.js';
let s = fs.readFileSync(f, 'utf8');
const R = [
  ["[n, -100, -140 + 20 * i]).concat(NANO_R.map((n, i) => [n, 100, -140 + 20 * i]))", "[n, -60, -140 + 20 * i]).concat(NANO_R.map((n, i) => [n, 60, -140 + 20 * i]))"],
  ['<rect class="b" x="-60" y="-170" width="120" height="340" rx="8"/>', '<rect class="b" x="-40" y="-170" width="80" height="340" rx="8"/>'],
  ['h += `<path class="b" d="M${rt ? 60 : -60} ${y}H${x}"/>` + svgTx(rt ? 52 : -52, y + 3.5, NANO_SHOW[n] || n, 10,', 'h += `<path class="b" d="M${rt ? 40 : -40} ${y}H${x}"/>` + svgTx(rt ? 32 : -32, y + 3.5, NANO_SHOW[n] || n, 10,'],
  ['<circle cx="${rt ? 80 : -80}" cy="${y}" r="3.5" fill="#ff6a55"/>`;\n  });\n  return h;\n};\n/* ESP32', '<circle cx="${rt ? 50 : -50}" cy="${y}" r="3.5" fill="#ff6a55"/>`;\n  });\n  return h;\n};\n/* ESP32'],
  ["[n, -100, -190 + 20 * i]).concat(BP_R.map((n, i) => [n, 100, -190 + 20 * i]))", "[n, -80, -190 + 20 * i]).concat(BP_R.map((n, i) => [n, 80, -190 + 20 * i]))"],
  ['<rect class="b" x="-70" y="-202" width="140" height="404" rx="8"/>', '<rect class="b" x="-55" y="-202" width="110" height="404" rx="8"/>'],
  ['<rect class="b t" x="-30" y="-10" width="60" height="60" rx="3"/>', '<rect class="b t" x="-18" y="-10" width="36" height="60" rx="3"/>'],
  ['translate(-6 100) rotate(-90)', 'translate(-8 100) rotate(-90)'],
  ['translate(22 100) rotate(-90)', 'translate(12 100) rotate(-90)'],
  ['d="M${rt ? 70 : -70} ${y}H${x}"/>` + svgTx(rt ? 62 : -62, y + 3.5, BP_SHOW[n]', 'd="M${rt ? 55 : -55} ${y}H${x}"/>` + svgTx(rt ? 47 : -47, y + 3.5, BP_SHOW[n]'],
  ['box:[-104,-192,104,174],draw:nanoDraw', 'box:[-64,-192,64,174],draw:nanoDraw'],
  ['box:[-104,-222,104,206]', 'box:[-84,-222,84,206]'],
  ['boxReal:[-112, -220, 112, 200]', 'boxReal:[-76, -220, 76, 200]'],
  ['boxReal:[-114, -254, 114, 214]', 'boxReal:[-96, -254, 96, 214]'],
  ['<rect x="-112" y="-165" width="224" height="354" rx="9" fill="#2450b8"', '<rect x="-71" y="-165" width="142" height="354" rx="9" fill="#2450b8"'],
  ['<rect x="-27" y="-27" width="54" height="54" rx="3" fill="#17181c"/><circle cx="19" cy="19" r="3" fill="#b9bbc2"/>', '<rect x="-22" y="-22" width="44" height="44" rx="3" fill="#17181c"/><circle cx="15" cy="15" r="3" fill="#b9bbc2"/>'],
  ["[[30.7, '#d9a400'], [11, '#d9a400'], [-8.7, '#2fd36f'], [-28.3, '#e08a2a']]", "[[27, '#d9a400'], [9.5, '#d9a400'], [-8, '#2fd36f'], [-25.5, '#e08a2a']]"],
  ['<rect x="-112" y="-209.8" width="224" height="419.6" rx="8"', '<rect x="-93" y="-209.8" width="186" height="419.6" rx="8"'],
  ['JSON.stringify({v:1, comps:S.comps, wires:S.wires, seq:S.seq})', 'JSON.stringify({v:2, comps:S.comps, wires:S.wires, seq:S.seq})'],
  ['JSON.stringify({v:1, comps:S.comps, wires:S.wires}, null, 1)', 'JSON.stringify({v:2, comps:S.comps, wires:S.wires}, null, 1)'],
];
const crlf = s.includes('\r\n');
if (crlf) s = s.replace(/\r\n/g, '\n');
let bad = 0;
R.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) { console.log('replace #' + i + ' matched ' + n + ': ' + a.slice(0, 60)); bad++; } else s = s.replace(a, () => b); });
const mig = `    if(d.v !== 2){      // طرح‌های قدیمی: Nano و Blue Pill پایه‌ها را روی x = ±100 داشتند؛ سیم‌ها را به جای جدید ببر
      const mv = new Map();
      out.comps.forEach(c => { if(c.t !== 'NANO' && c.t !== 'BLUEPILL') return; DEFS[c.t].pins.forEach(p => { const o = rot(Math.sign(p[0]) * 100, p[1], c.r), n = rot(p[0], p[1], c.r); mv.set(key(c.x + o[0], c.y + o[1]), [c.x + n[0], c.y + n[1]]); }); });
      if(mv.size) out.wires.forEach(w => { const a = mv.get(key(w.x1, w.y1)), b = mv.get(key(w.x2, w.y2)); if(a){ w.x1 = a[0]; w.y1 = a[1]; } if(b){ w.x2 = b[0]; w.y2 = b[1]; } });
    }
`;
const anchor = '    return out;\n  }\n  function build(spec){';
if (s.split(anchor).length !== 2) { console.log('sanitize anchor not found'); bad++; } else s = s.replace(anchor, () => mig + anchor);
if (bad) { console.log('ABORT, nothing written'); process.exit(1); }
if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(f, s);
console.log('patched');
