const fs = require('fs');
const F = 'js/stm32/clock-timer-sim.js';
let s = fs.readFileSync(F, 'utf8');
const rep = (a, b) => { if(!s.includes(a)) throw new Error('missing: ' + a.slice(0, 50)); s = s.replace(a, () => b); };

rep('function ctScene(svg, specs, marks){', 'function ctScene(svg, specs, marks, W = 300){');
rep('const p = Math.min(14, 300 * 6.2832 / (2 * sumT));', 'const p = Math.min(14, W * 6.2832 / (2 * sumT));');
rep('let x = (320 - specs.reduce(', 'let x = (W + 20 - specs.reduce(');
rep("svg.setAttribute('viewBox', `0 0 320 ${Math.round(cy + maxRp + 8)}`);", "svg.setAttribute('viewBox', `0 0 ${W + 20} ${Math.round(cy + maxRp + 8)}`);");
rep('const th = [0, 0, 0, 0];', 'const th = [0, 0, 0, 0, 0];');
rep('buildScenes(); const fin = checkDone();', "qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; }); buildScenes(); const fin = checkDone();");

const html = "      <div class=\"ct-sc\">\n"
  + "        <div class=\"ct-sc-h\"><b>🧩 همه‌ی چرخ‌دنده‌ها کنار هم</b></div>\n"
  + "        <div class=\"ct-sc-h\"><label class=\"ct-ctl\">PLL ${sel('pll', CT_PLL_OPTS, '×')}</label><label class=\"ct-ctl\">APB1 ${sel('a1', CT_DIV_OPTS, '÷')}</label><label class=\"ct-ctl\">PSC ${sel('psc', Array.from({ length: 12 }, (_, i) => i), '=')}</label></div>\n"
  + "        <div class=\"hs-p ct-cap\">هر چرخ‌دنده با بعدی درگیر است و سرعتش = سرعتِ قبلی × (دنده‌های قبلی ÷ دنده‌های خودش). منوها را عوض کن و ببین کل قطار چه می‌شود. برای دیدنِ همه‌ی چرخ‌دنده‌ها صفحه را به چپ و راست بکش.</div>\n"
  + "        <div class=\"ct-scroll\"><svg class=\"ct-svg ct-wide\" id=\"ctGA\" viewBox=\"0 0 720 300\"></svg></div>\n"
  + "        <div class=\"ct-leg\" id=\"ctGAL\"></div>\n"
  + "        <div class=\"ct-rel\" id=\"ctGAR\"></div>\n"
  + "      </div>\n";
rep("      ${block('ctG1',", html + "      ${block('ctG1',");

const js = "const aa = st.a1, tT = aa === 1 ? 8 : 4 * aa;\n"
  + "    const sa = [\n"
  + "      { T: 8 * st.pll, cls: 'hse', key: 'hse', name: 'HSE (کریستال)', mhz: CT_HSE },\n"
  + "      { T: 8, cls: 'sys', key: 'sys', name: 'SYSCLK (چیپ)', mhz: c.sys },\n"
  + "      { T: 8 * aa, cls: 'pclk', key: 'pclk1', name: 'PCLK1 (باس)', mhz: c.p1, bad: c.p1 > 36, lim: 'سقف ۳۶' },\n"
  + "      { T: tT, cls: 'tim', key: 't1', name: 'کلاکِ تایمر', mhz: c.t1 },\n"
  + "      { T: tT * (st.psc + 1), cls: 'psc', key: 'psc', name: 'بعد از Prescaler', mhz: c.t1 / (st.psc + 1) }\n"
  + "    ];\n"
  + "    scenes.push({ s: ctScene(q('#ctGA'), sa, ['×' + ctFa(st.pll), '÷' + ctFa(aa), aa === 1 ? '×۱' : '×۲', '÷' + ctFa(st.psc + 1)], 700), w: CT_W });\n"
  + "    legend('#ctGA', sa);\n"
  + "    q('#ctGAR').innerHTML = `<div>${ctHz(CT_HSE * 1e6)} ⇐ ×${ctFa(st.pll)} ⇐ ${ctHz(c.sys * 1e6)} ⇐ ÷${ctFa(aa)} ⇐ ${ctHz(c.p1 * 1e6)} ⇐ ${aa === 1 ? '×۱' : '×۲'} ⇐ ${ctHz(c.t1 * 1e6)} ⇐ ÷${ctFa(st.psc + 1)} ⇐ ${ctHz(c.t1 / (st.psc + 1) * 1e6)}</div><div>(مسیرِ APB1 و تایمرهای TIM2/3/4؛ برای TIM1 همین است با APB2.)</div>`;\n"
  + "    ";
rep('revT = steps <= 64 ?', js + 'revT = steps <= 64 ?');
fs.writeFileSync(F, s);

const C = 'css/quest.css';
fs.appendFileSync(C, '.ct-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:8px; }\n.ct-wide{ min-width:720px; }\n');

const H = 'index.html';
let h = fs.readFileSync(H, 'utf8');
h = h.replace('clock-timer-sim.js?v=3', 'clock-timer-sim.js?v=4').replace('css/quest.css?v=17', 'css/quest.css?v=18');
fs.writeFileSync(H, h);

fs.writeFileSync('_t.html', '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet"><link rel="stylesheet" href="css/common.css"><link rel="stylesheet" href="css/quest.css"><style>body{margin:0;background:#0b0e14;padding:10px;font-family:Vazirmatn,sans-serif} #m{max-width:380px;margin:auto}</style></head><body><div id="m"></div><script src="js/stm32/clock-timer-sim.js"></script><script>const m=document.getElementById("m");mountClockTimerSim(m);const set=(a,v)=>{const e=m.querySelector(a);e.value=v;e.dispatchEvent(new Event("change",{bubbles:true}))};set(\'select[data-k="pll"]\',9);set(\'select[data-k="a1"]\',2);set(\'select[data-k="psc"]\',8);m.querySelectorAll("details").forEach(d=>d.open=false);const sc=m.querySelector(".ct-scroll");</script></body></html>');
console.log('patched');
