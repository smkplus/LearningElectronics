const vm = require('vm'), fs = require('fs');
const noop = () => {};
const el = new Proxy(function(){}, {get: (t, k) => k === Symbol.toPrimitive ? () => '' : el, apply: () => el, construct: () => el, set: () => true});
const ctx = vm.createContext({console, window: {}, document: el, localStorage: {getItem: () => null, setItem: noop}, navigator: {}, location: {}, setTimeout: noop, setInterval: noop, requestAnimationFrame: noop});
ctx.window = ctx;
const files = ['js/arduino/arduino-mission-blocks.js', 'js/quest/quest-circuit.js', 'js/quest/quest-electronics.js', 'js/quest/quest-arduino.js', 'js/quest/quest-esp32.js', 'js/quest/quest-stm32.js', 'js/quest/quest-robotics.js'];
files.forEach(f => { try{ new vm.Script(fs.readFileSync(f, 'utf8'), {filename: f}).runInContext(ctx); }catch(e){ console.log('LOAD ERROR', f, e.message); } });
const FA = /[\u0600-\u06FF]/;
const out = {}, funcs = [];
const groups = {circuit: 'QUESTS_CIRCUIT', electronics: 'QUESTS_ELECTRONICS', arduino: 'QUESTS_ARDUINO', esp32: 'QUESTS_ESP32', stm32: 'QUESTS_STM32', robotics: 'QUESTS_ROBOTICS'};
Object.keys(groups).forEach(g => {
  let arr; try{ arr = vm.runInContext(groups[g], ctx); }catch(e){ console.log('MISSING', groups[g], e.message); return; }
  out[g] = {};
  const seen = new WeakSet();
  const walk = (n, key) => {
    if(typeof n === 'string'){ if(FA.test(n)) out[g][key] = n; return; }
    if(typeof n === 'function'){ if(FA.test(n.toString())) funcs.push(g + ' :: ' + key); return; }
    if(!n || typeof n !== 'object' || seen.has(n)) return;
    seen.add(n);
    Object.keys(n).forEach(k => walk(n[k], key + '.' + k));
  };
  arr.forEach(q => walk(q, 'quest.' + q.id));
});
fs.writeFileSync('_quest_strings.json', JSON.stringify(out, null, 1));
Object.keys(out).forEach(g => {
  const v = Object.values(out[g]);
  console.log(g, 'strings:', v.length, 'words:', v.join(' ').split(/\s+/).length, 'chars:', v.join('').length);
});
console.log('functions containing Persian (not overlay-able):', funcs.length);
fs.writeFileSync('_quest_funcs.txt', funcs.join('\n'));
