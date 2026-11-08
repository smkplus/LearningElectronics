/* تست کاربرمحور: آردوینو Nano + LED روی هر پایه، کد را اجرا می‌کند و وضعیت LED را می‌خواند.
   اجرا:  node test-circuit-pins.js   (jsdom از node_modules) */
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

process.on('unhandledRejection', () => {});   // Blockly prefetch روی file:// در jsdom شکست می‌خورد؛ به تست ربطی ندارد
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String(e.message || e).split('\n')[0]));
vc.on('error', (...a) => errs.push(a.join(' ').slice(0, 200)));

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const fs = require('fs'), http = require('http');
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const f = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); res.end(b); } });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + srv.address().port + '/', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const { window } = dom, { document } = window;
  await new Promise(r => window.addEventListener('load', r));
  await sleep(800);
  window.confirm = () => true;
  const tab = document.getElementById('circuitTab'); if (tab) tab.remove();   // شناسه‌های تکراری با #cvPalette… در jsdom (nwsapi) querySelector را خراب می‌کنند
  if (!window.CircuitEditor) { console.log('CircuitEditor missing', errs.slice(0, 8)); process.exit(1); }
  console.log('ArduinoSim:', typeof window.ArduinoSim, '| load errors:', errs.length, errs.slice(0, 4));

  const ptr = (el, type, x, y, extra) => el.dispatchEvent(new window.PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, button: 0 }, extra || {})));
  const click = (svg, x, y) => { ptr(svg, 'pointerdown', x, y); ptr(svg, 'pointerup', x, y); };
  const key = code => document.dispatchEvent(new window.KeyboardEvent('keydown', { code, bubbles: true }));

  const NL = ['D13', '3V3', 'REF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RST', 'GND', 'VIN'];
  const NR = ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND', 'RST', 'D0', 'D1'];
  const CX = 400, CY = 300;
  const pinXY = n => {
    let i = NL.indexOf(n); if (i >= 0) return [CX - 100, CY - 140 + 20 * i, -1];
    i = NR.indexOf(n); return [CX + 100, CY - 140 + 20 * i, 1];
  };
  let seq = 0;

  async function scenario(pin, { resistor = true, gndTo = 'symbol', codePin = pin } = {}) {
    const root = document.createElement('div'); root.className = 'active'; document.body.appendChild(root);
    const skey = 't' + (++seq);
    window.localStorage.setItem(skey, JSON.stringify({ v: 1, comps: [], wires: [], seq: 1 }));
    const ed = window.CircuitEditor.create(root, { storageKey: skey });
    ed.onShow();
    const svg = root.querySelector('#cvSvg');
    const pal = t => root.querySelector(`.cv-pal-item[data-type="${t}"]`).click();
    const place = (t, x, y, rotations = 0) => { pal(t); for (let i = 0; i < rotations; i++) key('KeyR'); click(svg, x, y); };
    const wire = pts => { root.querySelector('[data-tool="wire"]').click(); for (const p of pts) click(svg, p[0], p[1]); key('Escape'); };

    const [px, py, dir] = pinXY(pin);
    place('NANO', CX, CY);
    const ledX = px + dir * (resistor ? 220 : 120);
    place('LEDG', ledX, py, dir < 0 ? 2 : 0);
    const A = [ledX - dir * 40, py], K = [ledX + dir * 40, py];
    if (resistor) {
      place('R', px + dir * 100, py);
      wire([[px, py], [px + dir * 60, py]]);
      wire([[px + dir * 140, py], A]);
    } else wire([[px, py], A]);
    if (gndTo === 'symbol') {
      place('GND', K[0], K[1] + 40);
      wire([K, [K[0], K[1] + 40]]);
    } else {
      const g = pinXY('GND');   // پایهٔ GND اولِ ستون راست
      wire([K, [K[0], K[1] + 60], [g[0] + 60, K[1] + 60], [g[0] + 60, g[1]], [g[0], g[1]]]);
    }
    root.querySelector('[data-tool="select"]').click();
    click(svg, CX, CY - 157);                      // نشان «</> code» روی Nano
    const dock = root.querySelector('.cv-uno-dock');
    if (!dock || dock.hidden) return { pin, err: 'ادیتور کد باز نشد' };
    const ta = dock.querySelector('textarea.sim-editor');
    const nm = /^A\d$/.test(codePin) ? codePin : codePin.replace('D', '');
    ta.value = `void setup(){ pinMode(${nm}, OUTPUT); }\nvoid loop(){ digitalWrite(${nm}, HIGH); delay(300); digitalWrite(${nm}, LOW); delay(300); }\n`;
    ta.dispatchEvent(new window.Event('input', { bubbles: true }));
    dock.querySelector('[data-act="run"]').click();
    const seen = new Set();
    let msg = '';
    for (let t = 0; t < 14; t++) {
      await sleep(100);
      root.querySelectorAll('#cvWorld g[class*="LED"], #cvWorld g.on, #cvWorld g.burnt').forEach(g => { const c = g.getAttribute('class') || ''; if (/\bburnt\b/.test(c)) seen.add('burnt'); else if (/\bon\b/.test(c)) seen.add('on'); });
      msg = (root.querySelector('#cvMsg').textContent || '').trim() || msg;
    }
    const status = root.querySelector('.sim-status'), st = status ? status.textContent.trim() : '';
    dock.querySelector('[data-act="stop"]').click();
    const boom = /💥/.test(root.querySelector('#cvWorld').innerHTML + msg);
    root.remove();
    return { pin, seen: [...seen].join('+') || 'off', msg, boom, sim: st.slice(0, 60) };
  }

  const only = process.argv[2];
  const pins = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D0', 'D1', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];
  const rows = [];
  if (only && only !== 'probe') { console.log(JSON.stringify(await scenario(only, { resistor: process.argv[3] !== 'nores' }))); process.exit(0); }
  const first = await scenario('D13');
  console.log('probe D13:', JSON.stringify(first));
  if (only === 'probe') { process.exit(0); }
  for (const p of pins) rows.push(Object.assign({ case: 'LED+330Ω' }, await scenario(p)));
  for (const p of ['D13', 'D2', 'A0', 'D7']) rows.push(Object.assign({ case: 'LED بدون مقاومت' }, await scenario(p, { resistor: false })));
  rows.push(Object.assign({ case: 'GND=پایهٔ Nano' }, await scenario('D13', { gndTo: 'pin' })));
  rows.push(Object.assign({ case: 'کنترل: کد D5، LED روی D6' }, await scenario('D6', { codePin: 'D5' })));
  rows.forEach(r => console.log(`${r.case.padEnd(26)} ${String(r.pin).padEnd(4)} → ${r.err || r.seen}${r.boom ? '  💥' : ''}${r.msg ? '  | ' + r.msg : ''}`));
  process.exit(0);
})().catch(e => { console.error('TEST CRASH', e && (e.name + ': ' + e.message + '\n' + e.stack)); process.exit(2); });
