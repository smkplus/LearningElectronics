const {JSDOM, VirtualConsole} = require('./node_modules/jsdom');
const fs = require('fs');
const vc = new VirtualConsole();
vc.on('jsdomError', e => console.log('JSDOM ERROR:', e.message));
const dom = new JSDOM('<!doctype html><html dir="rtl"><body><div id="circuitTab" class="circuit-tab active"></div></body></html>', {runScripts:'outside-only', pretendToBeVisual:true, url:'http://localhost/', virtualConsole:vc});
const w = dom.window;
w.eval(fs.readFileSync('js/circuit/circuit-editor.js', 'utf8'));
try{ w.eval(fs.readFileSync('js/circuit/circuit-missions.js', 'utf8')); }catch(e){ console.log('missions load note:', e.message); }
const d = w.document;
const before = JSON.stringify(w.CircuitEditor._state());
console.log('presets defined:', w.eval('typeof CIRCUIT_PRESETS !== "undefined" ? CIRCUIT_PRESETS.length : -1'));
d.querySelector('[data-act="presets"]').click();
const cards = d.querySelectorAll('.cv-pre-card'), thumbs = d.querySelectorAll('.cv-pre-thumb');
console.log('cards:', cards.length, 'thumbs:', thumbs.length);
thumbs.forEach((t, i) => { const s = t.querySelector('svg'); console.log(i, 'viewBox', s.getAttribute('viewBox'), 'groups', s.querySelectorAll('g.cv-comp').length, 'lines', s.querySelectorAll('line').length, 'len', t.innerHTML.length); });
console.log('first card order (info first, thumb last):', cards[0] && [...cards[0].children].map(c => c.className).join(' , '));
console.log('state restored:', JSON.stringify(w.CircuitEditor._state()) === before);
process.exit(0);
