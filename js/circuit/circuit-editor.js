/* طراحی مدار — ادیتور شماتیک ساده شبیه KiCad (هم تب مستقل، هم داخل مأموریت‌ها) */
(function(){
'use strict';

const G = 20;
const MAIN_KEY = 'circuit-design-v1';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = (x,y) => x + ',' + y;
const snap = v => Math.round(v / G) * G;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
let uidSeq = 0;

function arrow(x,y,dx,dy,len,w){
  len = len || 8; w = w || 3.5;
  const l = Math.hypot(dx,dy); dx /= l; dy /= l;
  const bx = x - dx*len, by = y - dy*len, nx = -dy*w, ny = dx*w;
  return `<polygon class="f" points="${x},${y} ${(bx+nx).toFixed(1)},${(by+ny).toFixed(1)} ${(bx-nx).toFixed(1)},${(by-ny).toFixed(1)}"/>`;
}

const bjt = pnp => '<circle class="b t" cx="4" cy="0" r="30"/>' +
  '<path class="b" d="M-40 0H-8M-8 -16V16M-8 -8L20 -24V-40M-8 8L20 24V40"/>' +
  (pnp ? arrow(-4.6,9.9,-28,-16) : arrow(17.2,22.4,28,16));

const LED_DRAW = '<path class="b" d="M-40 0H-10M10 0H40M10 -12V12"/><path class="b" d="M-10 -12L10 0L-10 12Z"/>' +
  '<path class="b t" d="M-4 -16L6 -28M4 -12L14 -24"/>' + arrow(6,-28,10,-12,6,3) + arrow(14,-24,10,-12,6,3) +
  '<text x="-27" y="-6" text-anchor="middle" font-size="13" font-weight="700" font-family="monospace" fill="#ff8a80" stroke="#0b1426" stroke-width="2.6" paint-order="stroke">+</text><text x="27" y="-6" text-anchor="middle" font-size="13" font-weight="700" font-family="monospace" fill="#8ec5ff" stroke="#0b1426" stroke-width="2.6" paint-order="stroke">&#8722;</text>';
const LED_LIT = col => `<path d="M-10 -12L10 0L-10 12Z" fill="${col}" opacity=".95"/>`;
const ledDef = (fa,val,col) => ({fa,pre:'D',val,lab:'two',pins:[[-40,0,'A'],[40,0,'K']],box:[-40,-32,40,14],
  draw:LED_DRAW, lit:LED_LIT(col), glow:col, pv:LED_LIT(col), edge:'led'});

/* آردوینو Uno: برنامهٔ چراغ راهنما — سبز D10 (۳ ثانیه) ← زرد D11 (۱ ثانیه) ← قرمز D12 (۳ ثانیه) */
const UNO_PROG = [{hi:['D10'], ms:3000}, {hi:['D11'], ms:1000}, {hi:['D12'], ms:3000}];
const UNO_TOTAL = UNO_PROG.reduce((a, p) => a + p.ms, 0);
const unoPhase = () => { let t = Date.now() % UNO_TOTAL; for(let i = 0; i < UNO_PROG.length; i++){ if(t < UNO_PROG[i].ms) return i; t -= UNO_PROG[i].ms; } return 0; };
/* همهٔ پایه‌های Uno (USB بالا): ستون راست = هدر دیجیتال، ستون چپ = هدر برق + آنالوگ؛ فاصلهٔ پایه‌ها ۲۰ و روی شبکه */
const UNO_LAYOUT = [['SCL',100,-160],['SDA',100,-140],['AREF',100,-120],['GND',100,-100],['D13',100,-80],['D12',100,-60],['D11',100,-40],['D10',100,-20],['D9',100,0],['D8',100,20],
  ['D7',100,60],['D6',100,80],['D5',100,100],['D4',100,120],['D3',100,140],['D2',100,160],['D1',100,180],['D0',100,200],
  ['NC',-200,-120],['IOREF',-200,-100],['RESET',-200,-80],['3V3',-200,-60],['5V',-200,-40],['GND',-200,-20],['GND',-200,0],['VIN',-200,20],
  ['A0',-200,60],['A1',-200,80],['A2',-200,100],['A3',-200,120],['A4',-200,140],['A5',-200,160]];
const UNO_PINS = UNO_LAYOUT.map(p => p[0]), UNO_XY = UNO_LAYOUT.map(p => [p[1], p[2]]);
const UNO_OUT = (n, hi) => /^(D\d+|A\d)$/.test(n) ? ((hi && hi.has(n)) ? 5 : 0) : n === '5V' ? 5 : n === '3V3' ? 3.3 : null;   // خروجی‌ها: پایه‌های دیجیتال/آنالوگ، 5V و 3.3V؛ بقیه آزاد
const svgTx = (x, y, s, sz, anchor, bold) => `<text x="${x}" y="${y}" fill="#e8e2d0" font-family="monospace" font-size="${sz}" text-anchor="${anchor}"${bold ? ' font-weight="700"' : ''}>${s}</text>`;
let unoHiBy = null, unoChipBy = null;   // حالت «هر آردوینو کد خودش را دارد»: Map(شناسهٔ قطعه ← پایه‌های HIGH / وضعیت نشان کد)
const unoHiFor = c => !(c && c.t) ? [] : unoHiBy ? (unoHiBy.get(c.id) || []) : (c.id === undefined ? [] : (unoHiNow || UNO_PROG[unoPhase()].hi));
let unoHiNow = null;   // پایه‌های HIGH در آخرین رندر (وقتی کدِ دانش‌آموز آردوینو را می‌راند)
let unoChipNow = null; // null = بدون ادیتور کد؛ 'idle' / 'run' = نشان «</> code» روی آردوینو
const UNO_CHIP = [-79, -168, -13, -150];   // جعبهٔ نشان روی آردوینو (مختصات محلی قطعه)
const UNO_CHIP_REAL = [-118, -222, -52, -204];   // همان نشان در نمای واقعی (کنارِ بردِ آبی)
const chipSvg = (b, c) => {
  const cs = unoChipBy ? (c && unoChipBy.get(c.id)) : unoChipNow;
  if(!cs) return '';
  const run = cs === 'run', col = run ? '#3ddc84' : '#e79a54';
  return `<g style="cursor:pointer"><rect x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}" rx="4" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-width="1.4"/>` +
    `<text x="${(b[0] + b[2]) / 2}" y="${b[3] - 5.5}" fill="${col}" font-family="monospace" font-size="9.5" font-weight="700" text-anchor="middle">${run ? '&#9654; running' : '&lt;/&gt; code'}</text></g>`;
};
const unoDraw = c => {
  const hi = new Set(unoHiFor(c));
  let h = '<rect class="b" x="-160" y="-180" width="220" height="400" rx="8"/><rect class="b t" x="-86" y="-196" width="80" height="16" rx="2"/>' +
    svgTx(-46, -184, 'USB', 8, 'middle') + svgTx(-46, 40, 'ARDUINO', 16, 'middle', true) + svgTx(-46, 74, 'UNO', 34, 'middle', true);
  if(c && c.t) h += chipSvg(UNO_CHIP, c);
  UNO_PINS.forEach((n, i) => {
    const [x, y] = UNO_XY[i], rt = x > 0;
    h += `<path class="b" d="M${rt ? 60 : -160} ${y}H${x}"/>` + svgTx(rt ? 52 : -152, y + 3.5, n, 10, rt ? 'end' : 'start');
    if(hi.has(n)) h += `<circle cx="${rt ? 80 : -180}" cy="${y}" r="3.5" fill="#ff6a55"/>`;
  });
  return h;
};
/* آردوینو Nano (ATmega328P): USB بالا؛ ستون چپ = ردیف برق/آنالوگ (D13، 3V3، AREF، A0–A7، 5V، RST، GND، VIN)،
   ستون راست = ردیف دیجیتال (D12 … D2، GND، RST، RX0، TX1). فاصلهٔ پایه‌ها ۲۰ و روی شبکه؛ نام پایه‌ها همان نام‌های Uno (D0 = RX0، D1 = TX1) */
const NANO_L = ['D13','3V3','REF','A0','A1','A2','A3','A4','A5','A6','A7','5V','RST','GND','VIN'];
const NANO_R = ['D12','D11','D10','D9','D8','D7','D6','D5','D4','D3','D2','GND','RST','D0','D1'];
const NANO_LAYOUT = NANO_L.map((n, i) => [n, -60, -140 + 20 * i]).concat(NANO_R.map((n, i) => [n, 60, -140 + 20 * i]));
const NANO_PINS = NANO_LAYOUT.map(p => p[0]), NANO_XY = NANO_LAYOUT.map(p => [p[1], p[2]]);
const NANO_SHOW = {D0:'RX0', D1:'TX1', REF:'AREF'};   // نام نمایشی روی نقاشی
const NANO_OUT = (n, hi) => (n === 'A6' || n === 'A7') ? null : UNO_OUT(n, hi);   // A6/A7 فقط ورودی‌اند
const NANO_CHIP = [-27, -166, 27, -148];          // نشان «</> code» روی شماتیک
const NANO_CHIP_REAL = [-27, -212, 27, -194];     // همان نشان در نمای واقعی (بالای USB)
const nanoDraw = c => {
  const hi = new Set(unoHiFor(c));
  let h = '<rect class="b" x="-40" y="-170" width="80" height="340" rx="8"/><rect class="b t" x="-20" y="-186" width="40" height="16" rx="2"/>' +
    svgTx(0, -174, 'USB', 8, 'middle') +
    '<text transform="translate(5 30) rotate(-90)" fill="#e8e2d0" font-family="monospace" font-size="17" font-weight="700" text-anchor="middle">ARDUINO NANO</text>';
  if(c && c.t) h += chipSvg(NANO_CHIP, c);
  NANO_PINS.forEach((n, i) => {
    const [x, y] = NANO_XY[i], rt = x > 0;
    h += `<path class="b" d="M${rt ? 40 : -40} ${y}H${x}"/>` + svgTx(rt ? 32 : -32, y + 3.5, NANO_SHOW[n] || n, 10, rt ? 'end' : 'start');
    if(hi.has(n)) h += `<circle cx="${rt ? 50 : -50}" cy="${y}" r="3.5" fill="#ff6a55"/>`;
  });
  return h;
};
/* ESP32-WROOM-32 (برد ۳۸پین): USB بالا، آنتن پایین؛ ۱۹ پایه در هر ستون با فاصلهٔ ۲۰. نام پایه‌ها = شمارهٔ GPIO (D13 = GPIO13) تا کد آردوینو مستقیم کار کند.
   ستون چپ = ردیف GPIO23 (از USB تا آنتن: CLK … D23، GND)، ستون راست = ردیف EN (5V … 3V3). ولتاژ پایه‌های خروجی ۳٫۳ ولت است. */
const ESP_L = ['D6','D7','D8','D15','D2','D0','D4','D16','D17','D5','D18','D19','GND','D21','D3','D1','D22','D23','GND'];
const ESP_R = ['5V','D11','D10','D9','D13','GND','D12','D14','D27','D26','D25','D33','D32','D35','D34','D39','D36','EN','3V3'];
const ESP_LAYOUT = ESP_L.map((n, i) => [n, -100, -180 + 20 * i]).concat(ESP_R.map((n, i) => [n, 100, -180 + 20 * i]));
const ESP_PINS = ESP_LAYOUT.map(p => p[0]), ESP_XY = ESP_LAYOUT.map(p => [p[1], p[2]]);
const ESP_SHOW = {D6:'CLK', D7:'SD0', D8:'SD1', D9:'SD2', D10:'SD3', D11:'CMD', D16:'RX2', D17:'TX2', D3:'RX0', D1:'TX0', D36:'VP', D39:'VN'};   // نام نمایشی روی نقاشی
const ESP_NOOUT = new Set(['D6','D7','D8','D9','D10','D11','D34','D35','D36','D39']);   // فقط ورودی یا رزرو فلش
const ESP_OUT = (n, hi) => n === '3V3' ? 3.3 : n === '5V' ? 5 : (/^D\d+$/.test(n) && !ESP_NOOUT.has(n)) ? ((hi && hi.has(n)) ? 3.3 : 0) : null;
const ESP_CHIP = [-27, -186, 27, -168];          // نشان «</> code» روی شماتیک
const ESP_CHIP_REAL = [-27, -240, 27, -222];     // همان نشان در نمای واقعی (بالای USB)
const esp32Draw = c => {
  const hi = new Set(unoHiFor(c));
  let h = '<rect class="b" x="-70" y="-192" width="140" height="384" rx="8"/><rect class="b t" x="-22" y="-208" width="44" height="16" rx="2"/>' +
    svgTx(0, -196, 'USB', 8, 'middle') +
    '<rect class="b t" x="-40" y="-20" width="80" height="140" rx="3"/>' +
    '<text transform="translate(-4 50) rotate(-90)" fill="#e8e2d0" font-family="monospace" font-size="28" font-weight="700" text-anchor="middle">ESP32</text>' +
    '<text transform="translate(22 50) rotate(-90)" fill="#e8e2d0" font-family="monospace" font-size="11" text-anchor="middle">WROOM-32</text>';
  if(c && c.t) h += chipSvg(ESP_CHIP, c);
  ESP_PINS.forEach((n, i) => {
    const [x, y] = ESP_XY[i], rt = x > 0;
    h += `<path class="b" d="M${rt ? 70 : -70} ${y}H${x}"/>` + svgTx(rt ? 62 : -62, y + 3.5, ESP_SHOW[n] || n, 10, rt ? 'end' : 'start');
    if(hi.has(n)) h += `<circle cx="${rt ? 85 : -85}" cy="${y}" r="3.5" fill="#ff6a55"/>`;
  });
  return h;
};
/* STM32F103C8T6 Blue Pill: USB بالا؛ ۲۰ پایه در هر ستون با فاصلهٔ ۲۰. ستون چپ = ردیف VBAT (VBAT، PC13 … PB11، RST، 3V3، GND، GND)،
   ستون راست = ردیف 3V3 (3V3، GND، 5V، PB9 … PB12). ولتاژ منطقی ۳٫۳ ولت؛ پایه‌های تغذیه (3V3، 5V) همیشه منبع‌اند و پایه‌های GPIO وقتی در CubeMX «GPIO_Output» شوند با کدِ HAL روشن/خاموش می‌شوند. */
const BP_L = ['VBAT','PC13','PC14','PC15','PA0','PA1','PA2','PA3','PA4','PA5','PA6','PA7','PB0','PB1','PB10','PB11','RST','3V3_','GND','GND'];
const BP_R = ['3V3','GND','5V','PB9','PB8','PB7','PB6','PB5','PB4','PB3','PA15','PA12','PA11','PA10','PA9','PA8','PB15','PB14','PB13','PB12'];
const BP_LAYOUT = BP_L.map((n, i) => [n, -80, -190 + 20 * i]).concat(BP_R.map((n, i) => [n, 80, -190 + 20 * i]));
const BP_PINS = BP_LAYOUT.map(p => p[0]), BP_XY = BP_LAYOUT.map(p => [p[1], p[2]]);
const BP_SHOW = {'3V3_':'3V3'};   // پایهٔ ۳٫۳ ولت دوم (با اولی یک نت است)
const BP_CHIP = [-26, -122, 26, -104];            // نشان «</> code» روی شماتیک
const BP_CHIP_REAL = [-27, -246, 27, -228];       // همان نشان در نمای واقعی (بالای USB)
const BP_OUT = (n, hi) => n === '3V3' ? 3.3 : n === '5V' ? 5 : (/^P[A-D]\d+$/.test(n) && typeof CUBE !== 'undefined' && CUBE.cfg[n] === 'GPIO_Output') ? ((hi && hi.has(n)) ? 3.3 : 0) : null;
const bluePillDraw = c => {
  const hi = new Set(unoHiFor(c));
  let h = '<rect class="b" x="-55" y="-202" width="110" height="404" rx="8"/><rect class="b t" x="-22" y="-218" width="44" height="16" rx="2"/>' +
    svgTx(0, -206, 'USB', 8, 'middle') +
    '<rect class="b t" x="-18" y="-10" width="36" height="60" rx="3"/>' +
    '<text transform="translate(-8 100) rotate(-90)" fill="#e8e2d0" font-family="monospace" font-size="24" font-weight="700" text-anchor="middle">BLUE PILL</text>' +
    '<text transform="translate(12 100) rotate(-90)" fill="#e8e2d0" font-family="monospace" font-size="11" text-anchor="middle">STM32F103C8T6</text>';
  if(c && c.t) h += chipSvg(BP_CHIP, c);
  BP_PINS.forEach((n, i) => {
    const [x, y] = BP_XY[i], rt = x > 0;
    h += `<path class="b" d="M${rt ? 55 : -55} ${y}H${x}"/>` + svgTx(rt ? 47 : -47, y + 3.5, BP_SHOW[n] || n, 9.5, rt ? 'end' : 'start');
    if(hi.has(n)) h += `<circle cx="${rt ? 67.5 : -67.5}" cy="${y}" r="3.5" fill="#ff6a55"/>`;
  });
  return h;
};
/* جدول یکپارچهٔ آردوینوها: هر نوع پایه‌ها، خروجی‌ها، نشان کد و جعبهٔ نمای واقعی خودش را دارد */
const MCU = {
  UNO:{pins:UNO_PINS, out:UNO_OUT, chip:UNO_CHIP, chipReal:UNO_CHIP_REAL, boxReal:[-224, -356, 124, 224], name:'Uno'},
  NANO:{pins:NANO_PINS, out:NANO_OUT, chip:NANO_CHIP, chipReal:NANO_CHIP_REAL, boxReal:[-76, -220, 76, 200], name:'Nano'},
  ESP32:{pins:ESP_PINS, out:ESP_OUT, chip:ESP_CHIP, chipReal:ESP_CHIP_REAL, boxReal:[-114, -246, 114, 208], name:'ESP32'},
  BLUEPILL:{pins:BP_PINS, out:BP_OUT, chip:BP_CHIP, chipReal:BP_CHIP_REAL, boxReal:[-96, -254, 96, 214], name:'Blue Pill'}
};
const isMcu = t => t === 'UNO' || t === 'NANO' || t === 'ESP32' || t === 'BLUEPILL';   // بردهایی که ادیتور کد دارند (Blue Pill: CubeMX + HAL)
const isBoard = t => Object.prototype.hasOwnProperty.call(MCU, t);   // همهٔ بردها
const HDR_NAMES = ['GND','D12','D11','D10'];
const HDR_DRAW = '<path class="b" d="' + HDR_NAMES.map((n, i) => `M-40 ${-40 + 20 * i}H-14M14 ${-40 + 20 * i}H40`).join('') + '"/>' +
  '<rect class="b" x="-14" y="-54" width="28" height="86" rx="4"/>' + HDR_NAMES.map((n, i) => svgTx(0, -36 + 20 * i, n, 9, 'middle')).join('');

const DEFS = {
  R:{fa:'مقاومت',pre:'R',val:'1kΩ',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-10,40,10],edge:'load',
    draw:'<path class="b" d="M-40 0H-20M20 0H40"/><rect class="b" x="-20" y="-8" width="40" height="16"/>'},
  C:{fa:'خازن',pre:'C',val:'100nF',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-16,40,16],
    draw:'<path class="b" d="M-40 0H-4M4 0H40M-4 -14V14M4 -14V14"/>'},
  CP:{fa:'خازن الکترولیتی',pre:'C',val:'100µF',lab:'two',pins:[[-40,0,'+'],[40,0,'−']],box:[-40,-16,40,16],
    draw:'<path class="b" d="M-40 0H-4M7 0H40M-4 -14V14"/><path class="b" d="M11 -14Q4 0 11 14"/><path class="b t" d="M-20 -10h8M-16 -14v8"/>'},
  D:{fa:'دیود',pre:'D',val:'1N4148',lab:'two',pins:[[-40,0,'A'],[40,0,'K']],box:[-40,-14,40,14],edge:'diode',
    draw:'<path class="b" d="M-40 0H-10M10 0H40M10 -12V12"/><path class="b" d="M-10 -12L10 0L-10 12Z"/>'},
  LED:ledDef('LED قرمز','RED','#ff5b5b'),
  LEDY:ledDef('LED زرد','YELLOW','#ffd23f'),
  LEDG:ledDef('LED سبز','GREEN','#3ddc84'),
  NPN:{fa:'ترانزیستور NPN',pre:'Q',val:'2N3904',lab:'two',side:true,pins:[[-40,0,'B'],[20,-40,'C'],[20,40,'E']],box:[-40,-40,34,40],draw:bjt(false)},
  PNP:{fa:'ترانزیستور PNP',pre:'Q',val:'2N3906',lab:'two',side:true,pins:[[-40,0,'B'],[20,-40,'C'],[20,40,'E']],box:[-40,-40,34,40],draw:bjt(true)},
  BC:{fa:'کانکتور باتری ۹ ولت',pre:'J',val:'9V',lab:'two',side:true,link:[[0,2],[1,3]],
    pins:[[-40,-20,'باتری +'],[-40,20,'باتری −'],[40,-20,'سیم قرمز +'],[40,20,'سیم مشکی −']],box:[-40,-34,40,34],
    draw:'<path class="b" d="M-40 -20H-14M-40 20H-14"/><path class="b red" d="M14 -20H40"/><path class="b gry" d="M14 20H40"/>' +
      '<rect class="b" x="-14" y="-32" width="28" height="64" rx="4"/><path class="b t" d="M-14 -20H14M-14 20H14"/>' +
      '<circle class="f" cx="-8" cy="-20" r="2.5"/><circle class="f" cx="-8" cy="20" r="2.5"/><path class="b t" d="M-34 -28h6M-31 -31v6M-34 28h6"/>'},
  SW:{fa:'کلید',pre:'SW',val:'SW',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-18,40,6],edge:'wire',sw:true,
    draw:c => '<path class="b" d="M-40 0H-20M20 0H40"/>' + (c && c.on ? '<path class="b" d="M-20 0H20"/>' : '<path class="b" d="M-20 0L18 -14"/>') +
      '<circle class="b" cx="-20" cy="0" r="2.5"/><circle class="b" cx="20" cy="0" r="2.5"/>'},
  PB:{fa:'کلید فشاری ۶mm',pre:'SW',val:'SW_Push',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-30,40,8],edge:'wire',sw:true,push:true,
    draw:c => { const y = c && c.on ? -6 : -14; return '<path class="b" d="M-40 0H-24M24 0H40"/><circle class="b" cx="-20" cy="0" r="4"/><circle class="b" cx="20" cy="0" r="4"/>' + `<path class="b" d="M-24 ${y}H24M0 ${y}V-28"/>`; }},
  LAMP:{fa:'لامپ',pre:'LA',val:'6V',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-16,40,16],edge:'load',
    draw:'<path class="b" d="M-40 0H-16M16 0H40"/><circle class="b" r="16"/><path class="b" d="M-11.3 -11.3L11.3 11.3M-11.3 11.3L11.3 -11.3"/>',
    lit:'<circle r="15" fill="#ffd95a" opacity=".92"/>', glow:'#ffd95a'},
  VCC:{fa:'تغذیه (VCC)',pre:'',val:'VCC',lab:'top',power:true,pins:[[0,0,'VCC']],box:[-10,-30,10,0],
    draw:'<path class="b" d="M0 0V-28M-9 -14L0 -28L9 -14"/>'},

  GND:{fa:'زمین (GND)',pre:'',val:'GND',lab:'top',power:true,pins:[[0,0,'GND']],box:[-14,-30,14,0],
    draw:'<path class="b" d="M0 0V-14M-12 -14H12L0 -28Z"/>'},
  UNO:{fa:'آردوینو Uno',pre:'U',val:'Uno',lab:'none',offboard:true,pins:UNO_PINS.map((n,i) => [UNO_XY[i][0],UNO_XY[i][1],n]),box:[-204,-200,102,222],draw:unoDraw,
    pal:'<g transform="scale(.16) translate(51 -11)">' + unoDraw(null) + '</g>'},
  NANO:{fa:'آردوینو Nano',pre:'U',val:'Nano',lab:'none',pins:NANO_PINS.map((n,i) => [NANO_XY[i][0],NANO_XY[i][1],n]),box:[-64,-192,64,174],draw:nanoDraw,
    pal:'<g transform="scale(.16) translate(0 8)">' + nanoDraw(null) + '</g>'},
  ESP32:{fa:'ESP32 (WROOM-32، ۳۸ پین)',pre:'U',val:'ESP32',lab:'none',pins:ESP_PINS.map((n,i) => [ESP_XY[i][0],ESP_XY[i][1],n]),box:[-104,-214,104,196],draw:esp32Draw,
    pal:'<g transform="scale(.14) translate(0 8)">' + esp32Draw(null) + '</g>'},
  BLUEPILL:{fa:'STM32 Blue Pill (F103C8T6)',pre:'U',val:'BluePill',lab:'none',pins:BP_PINS.map((n,i) => [BP_XY[i][0],BP_XY[i][1],n]),box:[-84,-222,84,206],draw:bluePillDraw,
    pal:'<g transform="scale(.13) translate(0 8)">' + bluePillDraw(null) + '</g>'},
  HDR4:{fa:'هدر ۴پین (برد LED)',pre:'J',val:'1×4',lab:'two',link:[[0,4],[1,5],[2,6],[3,7]],
    pins:HDR_NAMES.map((n,i) => [-40,-40+20*i,n]).concat(HDR_NAMES.map((n,i) => [40,-40+20*i,n])),box:[-40,-54,40,34],draw:HDR_DRAW,
    pal:'<g transform="scale(.8) translate(0 10)">' + HDR_DRAW + '</g>'}
};
const drawOf = (c,d) => typeof d.draw === 'function' ? d.draw(c) : d.draw;
const GROUPS = [
  ['قطعات پایه', ['R','C','CP']],
  ['نیمه‌هادی', ['D','LED','LEDY','LEDG','NPN','PNP']],
  ['منبع و کلید', ['BC','SW','PB','VCC','GND']],
  ['آردوینو و برد', ['UNO','NANO','ESP32','BLUEPILL','HDR4']]
];
const HINTS = {
  select:'انتخاب: روی قطعه یا سیم بزن، بکشش تا جابه‌جا شود. روی کلید دوبار بزن تا باز/بسته شود. روی فضای خالی بکش تا چند مورد را با هم انتخاب کنی.',
  wire:'سیم‌کشی: یک نقطه را بزن تا سیم شروع شود، نقطهٔ بعدی را بزن. روی پایهٔ قطعه یا سیم دیگر که بزنی، سیم تمام می‌شود. Esc = پایان.',
  place:'قرار دادن: روی صفحه بزن تا قطعه گذاشته شود. R = چرخش، Esc = پایان.',
  pan:'جابه‌جایی صفحه: بکش. با چرخ ماوس یا دو انگشت زوم کن.'
};
const EXPORT_CSS = '.b{fill:none;stroke:#e79a54;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.b.red{stroke:#ff6b6b}.b.gry{stroke:#9aa3b2}.t{stroke-width:1.4}.f{fill:#e79a54;stroke:#e79a54;stroke-width:1}' +
  '.w{stroke:#57d8a3;stroke-width:2.2;stroke-linecap:round}.j{fill:#57d8a3}' +
  '.r{fill:#d4af37;font:600 12px monospace}.v{fill:#e8e2d0;font:12px monospace}';
const GLOWS = {'#ffd95a':'L','#ff5b5b':'R','#ffd23f':'Y','#3ddc84':'G'};

const BETA = 100, GB = 1/20, GSAT = 1/10, VBE = 0.7, VSAT = 0.2, GS = 1e3, GMIN = 1e-9;

function dcSolve(els, ref, mem){
  const idx = new Map();
  let n = 0;
  const ix = k => k === ref ? -1 : (idx.has(k) ? idx.get(k) : (idx.set(k, n), n++));
  els.forEach(e => {
    if(e.k === 'Q'){ e.ib = ix(e.b); e.ic = ix(e.c); e.ie = ix(e.e); }
    else if(e.k === 'V'){ e.ia = ix(e.p); e.ik = ix(e.n); }
    else { e.ia = ix(e.a); e.ik = ix(e.b); }
  });
  const volt = new Array(n).fill(0);
  const V = i => i < 0 ? 0 : volt[i];
  const gG = (A, a, b, g) => { if(a >= 0) A[a][a] += g; if(b >= 0) A[b][b] += g; if(a >= 0 && b >= 0){ A[a][b] -= g; A[b][a] -= g; } };
  const gOff = (A, z, a, b, g, vf) => { gG(A, a, b, g); if(a >= 0) z[a] += g * vf; if(b >= 0) z[b] -= g * vf; };
  const qNodes = e => e.pnp ? {a:e.ie, k:e.ib, m1:e.ie, m2:e.ic} : {a:e.ib, k:e.ie, m1:e.ic, m2:e.ie};

  function solve(){
    const A = Array.from({length:n}, () => new Array(n).fill(0)), z = new Array(n).fill(0);
    for(let i = 0; i < n; i++) A[i][i] += GMIN;
    els.forEach(e => {
      if(e.k === 'R') gG(A, e.ia, e.ik, e.g);
      else if(e.k === 'V'){ gG(A, e.ia, e.ik, GS); if(e.ia >= 0) z[e.ia] += GS * e.v; if(e.ik >= 0) z[e.ik] -= GS * e.v; }
      else if(e.k === 'D'){ if(mem.get(e.id)) gOff(A, z, e.ia, e.ik, e.g, e.vf); }
      else if(e.k === 'Q'){
        const s = mem.get(e.id) || 0;
        if(!s) return;
        const q = qNodes(e), k = BETA * GB, i0 = -k * VBE;
        gOff(A, z, q.a, q.k, GB, VBE);
        if(s === 1){
          if(q.m1 >= 0){ if(q.a >= 0) A[q.m1][q.a] += k; if(q.k >= 0) A[q.m1][q.k] -= k; z[q.m1] -= i0; }
          if(q.m2 >= 0){ if(q.a >= 0) A[q.m2][q.a] -= k; if(q.k >= 0) A[q.m2][q.k] += k; z[q.m2] += i0; }
        } else gOff(A, z, q.m1, q.m2, GSAT, VSAT);
      }
    });
    for(let c = 0; c < n; c++){
      let p = c;
      for(let r = c + 1; r < n; r++) if(Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [z[c], z[p]] = [z[p], z[c]];
      for(let r = c + 1; r < n; r++){
        const f = A[r][c] / A[c][c];
        if(!f) continue;
        for(let k = c; k < n; k++) A[r][k] -= f * A[c][k];
        z[r] -= f * z[c];
      }
    }
    for(let r = n - 1; r >= 0; r--){
      let s = z[r];
      for(let k = r + 1; k < n; k++) s -= A[r][k] * volt[k];
      volt[r] = s / A[r][r];
    }
  }

  function settle(){
    for(let it = 0; it < 120; it++){
      solve();
      let changed = false;
      for(const e of els){
        if(e.k === 'D'){
          const on = mem.get(e.id) || 0, vd = V(e.ia) - V(e.ik);
          if(!on && vd > e.vf){ mem.set(e.id, 1); changed = true; break; }
          if(on && vd < e.vf){ mem.set(e.id, 0); changed = true; break; }
        }
      }
      if(changed) continue;
      for(const e of els){
        if(e.k !== 'Q') continue;
        const s = mem.get(e.id) || 0, q = qNodes(e);
        const ib = GB * (V(q.a) - V(q.k) - VBE), vce = V(q.m1) - V(q.m2);
        let ns = s;
        if(s === 0){ if(ib > 0) ns = 1; }
        else if(ib < 0) ns = 0;
        else if(s === 1){ if(vce < VSAT) ns = 2; }
        else if(GSAT * (vce - VSAT) > BETA * ib) ns = 1;
        if(ns !== s){ mem.set(e.id, ns); changed = true; break; }
      }
      if(!changed) break;
    }
    solve();
  }
  settle();

  const cur = {};
  let maxSrc = 0;
  els.forEach(e => {
    if(e.k === 'R') cur[e.id] = e.g * (V(e.ia) - V(e.ik));
    else if(e.k === 'D') cur[e.id] = mem.get(e.id) ? e.g * (V(e.ia) - V(e.ik) - e.vf) : 0;
    else if(e.k === 'V'){ cur[e.id] = GS * (e.v - (V(e.ia) - V(e.ik))); maxSrc = Math.max(maxSrc, Math.abs(cur[e.id])); }
    else if(e.k === 'Q') cur[e.id] = mem.get(e.id) || 0;
  });
  return {cur, maxSrc};
}

/* ====================================================================
   ادیتور کد روی آردوینو Uno — همان ادیتورِ ArduinoSim (متنی/بلوکی، ⛶، ↺، ■، ▶) که با کلیک روی خودِ
   آردوینوی داخل مدار زیرِ مدار باز می‌شود. این فایل فقط «جا» را می‌دهد؛ خودِ ادیتور را میزبان می‌سازد:
   cfg.mount(el, host) → { stop(), destroy() }   (host = onPin / onPinsReset / onRunState / onSuccess)
   ==================================================================== */
let dockCssDone = false;
function injectDockCss(){
  if(dockCssDone || document.getElementById('cvDockCss')) { dockCssDone = true; return; }
  dockCssDone = true;
  const s = document.createElement('style');
  s.id = 'cvDockCss';
  s.textContent = `
.cv-uno-dock{margin-top:12px;border:1px solid #2ea09d;border-radius:12px;overflow:hidden;background:var(--card,rgba(255,255,255,.03));box-sizing:border-box}
.cv-uno-dock[hidden]{display:none}
.cv-uno-bar{display:flex;align-items:center;gap:6px 12px;flex-wrap:wrap;padding:8px 12px;background:rgba(46,160,157,.14);border-bottom:1px solid rgba(46,160,157,.35);color:var(--fg,#e8eaf0);font-size:13px}
.cv-uno-bar b{font-size:14px;white-space:nowrap}
.cv-uno-bar b span{direction:ltr;unicode-bidi:isolate;display:inline-block;color:#6fd6d2;font-family:ui-monospace,Consolas,monospace;margin-inline-start:4px}
.cv-uno-sub{opacity:.75;font-size:12.5px;margin-inline-end:auto}
.cv-uno-bar button{font:inherit;font-size:12.5px;color:inherit;background:transparent;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:5px 10px;cursor:pointer}
.cv-uno-bar button:hover{border-color:#2ea09d}
.cv-uno-bar button:focus-visible{outline:2px solid #2ea09d;outline-offset:2px}
.cv-uno-body{padding:12px}
.cv-uno-body .sim-wrap{margin:0}
.cv-uno-switch{display:inline-flex;border:1px solid rgba(255,255,255,.25);border-radius:9px;overflow:hidden}
.cv-uno-switch button{border:0;border-radius:0;padding:7px 16px;font:inherit;font-size:13px;font-weight:700;color:inherit;background:transparent;cursor:pointer}
.cv-uno-switch button:hover:not(.on){background:rgba(255,255,255,.08)}
.cv-uno-switch button.on{color:#08150f;background:linear-gradient(90deg,#3fbf8f,#57d8a3);cursor:default}
.cv-uno-switch-props{display:flex;margin-bottom:10px}
.cv-uno-switch-props button{flex:1}
.cv-uno-dock.in-side .cv-uno-sub{display:none}
.cv-wrap.code-on .cv-side > :not(.cv-uno-dock){display:none}
.cv-wrap.code-on .cv-side .cv-uno-dock{margin-top:0;flex:1 1 auto;min-height:0;overflow:auto}
.cv-wrap.code-on .cv-side .cv-uno-dock[hidden]{display:none}
@media (min-width:761px){.cv-wrap.code-on:not(.narrow) .cv-side{width:min(640px,50vw);flex:0 0 min(640px,50vw)}}`;
  document.head.appendChild(s);
}

function createUnoDock(wrap, cfg, host, ref, comp, parent){
  injectDockCss();
  const el = document.createElement('section');
  el.className = 'cv-uno-dock'; el.hidden = true;
  el.setAttribute('aria-label', 'ویرایشگر کد آردوینو');
  el.innerHTML = '<div class="cv-uno-bar"><b>&lt;/&gt; ' + (comp && comp.t === 'BLUEPILL' ? 'کد STM32 ' : 'کد آردوینو ') + (comp && MCU[comp.t] ? MCU[comp.t].name : 'Uno') + '<span>' + String(ref || 'U1').replace(/[<>&"']/g, '') + '</span></b>' +
    '<span class="cv-uno-sub">برنامه را اینجا بنویس؛ چراغ‌های مدار با آن روشن و خاموش می‌شوند.</span>' +
    (parent ? '<span class="cv-uno-switch"><button type="button" data-close>⚡ مدار</button><button type="button" class="on" tabindex="-1">&lt;/&gt; کد</button></span>'
            : '<button type="button" data-close>✕ بستن</button>') + '</div><div class="cv-uno-body"></div>';
  if(parent){ el.classList.add('in-side'); parent.appendChild(el); }      // داخل ستون سمت راست (به‌جای زیرِ مدار)
  else wrap.insertBefore(el, wrap.querySelector('.cv-status'));
  const body = el.querySelector('.cv-uno-body');
  let handle = null, mounted = false;
  el.querySelector('[data-close]').addEventListener('click', () => { el.hidden = true; if(host.closed) host.closed(); });
  return {
    open(){
      el.hidden = false;
      if(!mounted){ mounted = true; try{ handle = cfg.mount(body, host, comp) || null; }catch(e){ body.textContent = 'ادیتور کد بارگذاری نشد: ' + e.message; } }   // تنبل: فقط بار اول
      if(el.scrollIntoView) try{ el.scrollIntoView({block:'nearest', behavior:'smooth'}); }catch(_){}
    },
    close(){ el.hidden = true; },
    isOpen: () => !el.hidden,
    destroy(){
      if(handle){ try{ if(handle.stop) handle.stop(); if(handle.destroy) handle.destroy(); }catch(_){} handle = null; }
      el.remove();
    }
  };
}


/* ====================================================================
   نمای «واقعی»: همان مدار و همان سیم‌ها، ولی قطعه‌ها مثل خودشان کشیده می‌شوند — مقاومت با نوارهای رنگیِ مقدارش،
   باتری ۹ولت سبز، LED گنبدی، آردوینو Uno آبی… مختصات همان مختصات محلیِ شماتیک است تا پایه‌ها و سیم‌ها سر جایشان بمانند.
   ==================================================================== */
const R_COL = ['#15171b','#7a4a1e','#d92b2b','#f08a24','#f2d02f','#2f9e44','#2b6fd6','#8e44ad','#8a8f98','#f4f4f4'];
const R_GOLD = '#d4af37', R_SILVER = '#c0c0c0';
function ohmsOf(v){
  const m = String(v == null ? '' : v).replace(/Ω|ω|ohms?/gi, '').replace(/٫/g, '.').replace(/\s+/g, '').match(/^(\d+(?:\.\d+)?)([kKmMgG]?)/);
  if(!m) return 0;
  return parseFloat(m[1]) * ({'':1, k:1e3, K:1e3, m:1e6, M:1e6, g:1e9, G:1e9}[m[2]]);
}
function resBands(v){          // 330Ω → نارنجی، نارنجی، قهوه‌ای (رمز رنگی استاندارد، ۲ رقم + ضریب)
  const o = ohmsOf(v);
  if(!(o >= 1)) return null;
  let e = Math.floor(Math.log10(o)), mant = Math.round(o / Math.pow(10, e - 1));
  if(mant >= 100){ mant = Math.round(mant / 10); e++; }
  const mult = e - 1;
  if(mult < -2 || mult > 9) return null;
  return [R_COL[Math.floor(mant / 10)], R_COL[mant % 10], mult >= 0 ? R_COL[mult] : (mult === -1 ? R_GOLD : R_SILVER)];
}
const LED_REAL = {
  LED: {off:['#e8b9b3','#a65a53','#63302b'], on:['#fff3ef','#ff5a4a','#b3261e']},
  LEDY:{off:['#efe2ac','#b89a2c','#6b5a14'], on:['#fffbe0','#ffd23f','#c79a00']},
  LEDG:{off:['#bfe6cb','#4f9a66','#2a5a3a'], on:['#eafff1','#3ddc84','#1a8f4a']}
};
const realDefs = u => Object.keys(LED_REAL).map(t => ['off','on'].map(k => {
  const c = LED_REAL[t][k];
  return `<radialGradient id="${u}-${t}${k}" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
}).join('')).join('') +
  `<linearGradient id="${u}-bat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46d68c"/><stop offset=".55" stop-color="#27a560"/><stop offset="1" stop-color="#17703f"/></linearGradient>` +
  `<linearGradient id="${u}-batS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d4ffe6"/><stop offset="1" stop-color="#8be8b4"/></linearGradient>`;
const mLead = (x1, x2, y, gold) => { y = y || 0; return `<path d="M${x1} ${y}H${x2}" stroke="${gold ? '#8a6a12' : '#555b66'}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M${x1} ${y}H${x2}" stroke="${gold ? '#e2b84a' : '#d3d8e0'}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`; };
const wireTube = (d, col, dark) => `<path d="${d}" stroke="${dark}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${col}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const shine = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" opacity=".28"/>`;

/* ظاهر مشترک همهٔ بردها (مثل Uno): USB فلزی از بالا + سوکت سیاه با سوراخ‌های خاکستری روی نقطه‌های اتصال */
const usbTop = (topY, p) => {
  const y = topY - p, h = p + 8;
  return `<rect x="-30" y="${y}" width="60" height="${h}" rx="4" fill="#c9d0d7" stroke="#8b949e" stroke-width="3"/>` +
    `<rect x="-24" y="${y + 5}" width="48" height="${h - 16}" rx="2" fill="#b4bbc4"/><rect x="-24" y="${y + 5}" width="48" height="3" fill="#fff" opacity=".55"/>` +
    `<path d="M-30 ${topY + 1}H30" stroke="#8b949e" stroke-width="2"/>`;
};
const sockets = xy => {
  const cols = new Map();
  xy.forEach(q => { const c = cols.get(q[0]) || [Infinity, -Infinity]; c[0] = Math.min(c[0], q[1]); c[1] = Math.max(c[1], q[1]); cols.set(q[0], c); });
  let s = '';
  cols.forEach((c, x) => { s += `<rect x="${x - 9.5}" y="${c[0] - 10}" width="19" height="${c[1] - c[0] + 20}" rx="2" fill="#171a1f" stroke="#000" stroke-width="2"/>`; });
  return s + xy.map(q => `<rect x="${q[0] - 5.2}" y="${q[1] - 5.2}" width="10.4" height="10.4" fill="#4b525c"/>`).join('');
};

function unoBoardReal(hi){      // Uno واقعی: USB بالا، هدر دیجیتال راست، هدر برق/آنالوگ چپ؛ سوکت‌ها دقیقاً روی پایه‌های اتصال
  const sock = (x0, n, y) => `<rect x="${x0 - 50}" y="${y - 65}" width="${n * 100}" height="130" rx="12" fill="#171a1f" stroke="#000" stroke-width="10"/>` +
    Array.from({length:n}, (_, k) => `<rect x="${x0 + 100 * k - 26}" y="${y - 26}" width="52" height="52" fill="#4b525c"/>`).join('');
  const logo = (cx, cy) => `<g fill="none" stroke="#f4fbfb" stroke-linecap="round"><circle cx="${cx - 105}" cy="${cy}" r="92" stroke-width="30"/><circle cx="${cx + 105}" cy="${cy}" r="92" stroke-width="30"/><path d="M${cx - 150} ${cy}h90M${cx + 60} ${cy}h90M${cx + 105} ${cy - 45}v90" stroke-width="22"/></g>`;
  let h = `<g transform="translate(120 -320) rotate(90) scale(.2)">
    <rect x="450" y="0" width="2250" height="1700" rx="70" fill="#1a6fb5" stroke="#0e4a7d" stroke-width="30"/>
    <g fill="#b9c0c8">${Array.from({length:14}, (_, k) => `<rect x="${1069 + 93 * k}" y="810" width="42" height="80"/><rect x="${1069 + 93 * k}" y="1190" width="42" height="80"/>`).join('')}</g>
    <rect x="1050" y="880" width="1350" height="320" rx="24" fill="#16181d"/>
    <path d="M1050 985a55 55 0 0 1 0 110z" fill="#2c3037"/>
    <rect x="640" y="520" width="220" height="220" rx="24" fill="#b7bec6" stroke="#6d757e" stroke-width="18"/>
    <circle cx="750" cy="630" r="72" fill="#c93030"/>
    ${sock(1900, 8, 100)}${sock(800, 10, 100)}${sock(1000, 8, 1600)}${sock(1900, 6, 1600)}
    <rect x="-170" y="180" width="690" height="480" rx="30" fill="#c9d0d7" stroke="#8b949e" stroke-width="22"/>
    <rect x="20" y="1260" width="640" height="440" rx="36" fill="#1b1d22"/>
    ${logo(1700, 620)}
    <text x="2300" y="690" font-size="190" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="#f4fbfb">UNO</text>
  </g>`;
  UNO_PINS.forEach((n, i) => {
    const [x, y] = UNO_XY[i], rt = x > 0;
    if(hi.has(n)) h += `<circle cx="${x}" cy="${y}" r="9" fill="#ff6a55" opacity=".6"/>`;
    h += svgTx(rt ? x - 18 : x + 18, y + 3.5, n, 9.5, rt ? 'end' : 'start');
  });
  return h;
}

function nanoBoardReal(hi){      // Nano واقعی: USB از بالا؛ سوکت‌های سیاه (مثل Uno) دقیقاً روی نقطه‌های اتصال
  let h = '<rect x="-71" y="-165" width="142" height="354" rx="9" fill="#2450b8" stroke="#16337c" stroke-width="3"/>' + usbTop(-165, 27) +
    '<g transform="translate(0 -41.6) rotate(45)"><rect x="-22" y="-22" width="44" height="44" rx="3" fill="#17181c"/><circle cx="15" cy="15" r="3" fill="#b9bbc2"/></g>' +
    '<rect x="19" y="-2" width="12" height="20" rx="2" fill="#4c5059"/>' +
    '<rect x="-17" y="24" width="42" height="31" rx="3" fill="#cfcdc6" stroke="#6d757e" stroke-width="2"/><circle cx="4" cy="39.5" r="8.5" fill="#d1242a"/>';
  [[27, '#d9a400'], [9.5, '#d9a400'], [-8, '#2fd36f'], [-25.5, '#e08a2a']].forEach(a => {
    h += `<rect x="${a[0] - 3.5}" y="66" width="7" height="9" rx="1" fill="#15161a"/><rect x="${a[0] - 3.5}" y="89" width="7" height="9" rx="1" fill="${a[1]}"/>`;
  });
  h += sockets(NANO_XY) + svgTx(0, 154, 'NANO', 18, 'middle', true);
  NANO_PINS.forEach((n, i) => {
    const [x, y] = NANO_XY[i], rt = x > 0;
    if(hi.has(n)) h += `<circle cx="${x}" cy="${y}" r="9" fill="#ff6a55" opacity=".6"/>`;
    h += svgTx(rt ? x - 11 : x + 11, y + 3.5, NANO_SHOW[n] || n, 9.5, rt ? 'end' : 'start');
  });
  return h;
}

function esp32BoardReal(hi){      // ESP32 واقعی: USB از بالا، آنتن پایین؛ سوکت‌های سیاه روی x = ±100
  let h = '<rect x="-110.5" y="-204.5" width="221" height="409" rx="9" fill="#15161a" stroke="#0a0a0c" stroke-width="3"/>' + usbTop(-204.5, 14) +
    '<rect x="-20" y="-120.5" width="39" height="39" rx="3" fill="#17181c"/><circle cx="-14" cy="-114.5" r="2.5" fill="#b9bbc2"/>' +
    '<rect x="21.7" y="-76.8" width="51" height="27.5" rx="2" fill="#1a1b1f"/>' +
    '<rect x="-71" y="-2" width="142" height="201" rx="2" fill="#121317" stroke="#2a2c31" stroke-width="1.5"/>' +
    '<path d="M0.0 152.4 L0.0 157.9 L-45.7 157.9 L-45.7 165.0 L48.8 165.0 L48.8 172.0 L-45.7 172.0 L-45.7 179.1 L48.8 179.1 L48.8 186.2 L-26.8 186.2 L-26.8 193.3 L-58.3 193.3" fill="none" stroke="#d3ad4f" stroke-width="2.7"/><path d="M61.4 152.4L61.4 194.9L36.2 194.9" fill="none" stroke="#d3ad4f" stroke-width="2.7"/>' +
    '<rect x="-67.7" y="1.2" width="135.4" height="151.2" rx="2" fill="#c9ccd0" stroke="#8d9198" stroke-width="2"/>' +
    '<text transform="translate(0 77) rotate(-90)" fill="#31343a" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">ESP32-WROOM-32</text>';
  [-1, 1].forEach(s => {
    const cx = s * 56.7;
    h += `<rect x="${cx - 13.5}" y="-161.3" width="27" height="47" rx="3" fill="#1d1d21" stroke="#8a8f98" stroke-width="1.5"/><circle cx="${cx}" cy="-137.8" r="8" fill="#7f8188"/>`;
  });
  h += `<rect x="-56.7" y="-51" width="6.3" height="7.9" fill="#d98a84"/><rect x="-39.3" y="-51" width="6.3" height="7.9" fill="${hi.has('D2') ? '#3aa0ff' : '#9fb7cf'}"/>` + sockets(ESP_XY);
  ESP_PINS.forEach((n, i) => {
    const [x, y] = ESP_XY[i], rt = x > 0;
    if(hi.has(n)) h += `<circle cx="${x}" cy="${y}" r="9" fill="#ff6a55" opacity=".6"/>`;
    h += svgTx(rt ? x - 11 : x + 11, y + 3.5, ESP_SHOW[n] || n, 9.5, rt ? 'end' : 'start');
  });
  h += svgTx(0, -137, 'ESP32', 16, 'middle', true) + svgTx(-33.9, -132, 'EN', 7, 'middle') + svgTx(33.9, -132, 'BOOT', 7, 'middle');
  return h;
}

function bluePillBoardReal(hi){      // Blue Pill واقعی: USB از بالا، SWD پایین؛ سوکت‌های سیاه (مثل Uno) روی x = ±100
  let h = '<rect x="-93" y="-209.8" width="186" height="419.6" rx="8" fill="#1a3f9e" stroke="#123a5a" stroke-width="3"/>' + usbTop(-209.8, 14) +
    '<rect x="-27.5" y="-3.9" width="55" height="55" rx="3" fill="#17181c"/><circle cx="-20" cy="3.5" r="2.5" fill="#46495a"/>' +
    '<text transform="translate(-4 23.6) rotate(-90)" fill="#cdd0d8" font-family="monospace" font-size="8" font-weight="700" text-anchor="middle">STM32</text>' +
    '<text transform="translate(6 23.6) rotate(-90)" fill="#cdd0d8" font-family="monospace" font-size="8" font-weight="700" text-anchor="middle">F103C8T6</text>' +
    '<rect x="-17.3" y="69.3" width="34.6" height="85" rx="3" fill="#c9ccd0" stroke="#8d9198" stroke-width="2"/>' +
    '<text transform="translate(0 111.8) rotate(-90)" fill="#2d3036" font-family="monospace" font-size="9" font-weight="700" text-anchor="middle">8.000</text>' +
    '<rect x="24.8" y="77.3" width="11.8" height="25" rx="2" fill="#cfd1d5" stroke="#8d9198" stroke-width="1.2"/>' +
    '<rect x="14.2" y="-67" width="18.9" height="31.5" rx="2" fill="#1a1b1f"/>' +
    '<rect x="14.9" y="-157.4" width="26.8" height="47" rx="3" fill="#1d1d21" stroke="#8a8f98" stroke-width="1.5"/><circle cx="28.3" cy="-133.9" r="8" fill="#7f8188"/>' +
    '<rect x="-40.9" y="-33" width="9.4" height="9.4" fill="#d98a84"/><rect x="-18.9" y="-33" width="9.4" height="9.4" fill="#8fc79a"/>' +
    '<rect x="-40" y="183" width="80" height="20" rx="2" fill="#17171b"/>';
  [-30, -10, 10, 30].forEach(x => { h += `<rect x="${x - 3}" y="190" width="6" height="6" fill="#e2b84a" stroke="#8a6a12" stroke-width=".8"/>`; });
  [-23.6, -3.6].forEach(cx => {
    h += `<rect x="${cx - 10}" y="-136" width="20" height="60" rx="2" fill="#17171b"/><rect x="${cx - 9}" y="-136" width="18" height="39" rx="2" fill="#e8b81c"/>`;
    [-126, -106, -86].forEach(y => { h += `<rect x="${cx - 3}" y="${y - 3}" width="6" height="6" fill="#e2b84a" stroke="#8a6a12" stroke-width=".8"/>`; });
  });
  h += sockets(BP_XY);
  BP_PINS.forEach((n, i) => {
    const [x, y] = BP_XY[i], rt = x > 0;
    if(hi.has(n)) h += `<circle cx="${x}" cy="${y}" r="9" fill="#ff6a55" opacity=".6"/>`;
    h += svgTx(rt ? x - 11 : x + 11, y + 3.5, BP_SHOW[n] || n, 8.5, rt ? 'end' : 'start');
  });
  h += svgTx(0, -172, 'BLUE PILL', 14, 'middle', true) + svgTx(28.3, -161, 'RESET', 6.5, 'middle') + svgTx(-23.6, -70, 'BOOT0', 6.5, 'middle') + svgTx(-3.6, -70, 'BOOT1', 6.5, 'middle');
  [['3V3', -30], ['DIO', -10], ['CLK', 10], ['GND', 30]].forEach(a => { h += svgTx(a[1], 180, a[0], 6, 'middle'); });
  return h;
}

const REAL = {
  R(c){
    const b = resBands(c.val) || [R_COL[1], R_COL[0], R_COL[2]], bd = (x, col) => `<rect x="${x}" y="-8.5" width="4" height="17" fill="${col}"/>`;
    return mLead(-40, -20) + mLead(20, 40) +
      '<rect x="-23" y="-8.5" width="46" height="17" rx="8" fill="#e3c690" stroke="#a88a52" stroke-width="1"/>' +
      bd(-14, b[0]) + bd(-7, b[1]) + bd(0, b[2]) + bd(11, R_GOLD) + shine(-19, -6.5, 38, 3, 1.5);
  },
  C(){
    return mLead(-40, -4) + mLead(4, 40) +
      '<circle r="13" fill="#e0a23c" stroke="#9a6a14" stroke-width="1.2"/><circle cx="-4" cy="-4" r="5" fill="#fff" opacity=".22"/>';
  },
  CP(){
    return mLead(-40, -18) + mLead(18, 40) +
      '<rect x="-20" y="-12" width="3" height="24" rx="1" fill="#c7ccd4"/><rect x="17" y="-12" width="3" height="24" rx="1" fill="#c7ccd4"/>' +
      '<rect x="-17" y="-14" width="34" height="28" rx="3" fill="#1f3a78" stroke="#10224b" stroke-width="1"/>' +
      '<rect x="8" y="-14" width="9" height="28" fill="#e9edf5"/><path d="M11 -6h3M11 0h3M11 6h3" stroke="#1f3a78" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M-12 0h6M-9 -3v6" stroke="#e9edf5" stroke-width="1.6" stroke-linecap="round"/>' + shine(-14, -12, 22, 3, 1.5);
  },
  D(){
    return mLead(-40, -16) + mLead(16, 40) +
      '<rect x="-16" y="-7" width="32" height="14" rx="5" fill="#d48a35" stroke="#7a4a14" stroke-width="1"/>' +
      '<rect x="6" y="-7" width="6" height="14" fill="#15171b"/>' + shine(-13, -5.5, 18, 2.6, 1.3);
  },
  LED(c, st, u){
    const burnt = st === 'burnt', on = st === 'on', t = LED_REAL[c.t] ? c.t : 'LED';
    const fill = burnt ? '#2a2a2a' : `url(#${u}-${t}${on ? 'on' : 'off'})`;
    return mLead(-40, -2) + mLead(40, 18) + '<g transform="translate(8 0)"><path d="M-10 0V-7M10 0V-7" stroke="#cfd4dc" stroke-width="2.4" stroke-linecap="round"/>' +
      '<rect x="-21" y="-7" width="42" height="5" rx="1.5" fill="#bfc4cc" stroke="#8a929e" stroke-width=".8"/>' +
      `<path d="M-18 -7V-19A18 18 0 0 1 18 -19V-7Z" fill="${fill}" stroke="${burnt ? '#111' : '#00000055'}" stroke-width="1"/>` +
      (burnt ? '' : '<path d="M-8 -7V-23M8 -7V-17" stroke="#9aa1ad" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M-10 -22Q0 -29 10 -17" fill="none" stroke="#d9b94a" stroke-width="1" opacity=".8"/>') +
      '<path d="M-13 -17A14 14 0 0 1 -6 -29" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>' +
      '<text x="-27" y="-6" text-anchor="middle" font-size="13" font-weight="700" font-family="monospace" fill="#ff8a80" stroke="#0b1426" stroke-width="2.6" paint-order="stroke">+</text><text x="27" y="-6" text-anchor="middle" font-size="13" font-weight="700" font-family="monospace" fill="#8ec5ff" stroke="#0b1426" stroke-width="2.6" paint-order="stroke">&#8722;</text>' +
      (on ? `<circle cy="-18" r="18" fill="${LED_REAL[t].on[1]}" opacity=".28"/>` : '') + '</g>';
  },
  NPN(){
    return mLead(-40, -14) + `<path d="M20 -40L9 -14M20 40L9 14" stroke="#555b66" stroke-width="4" stroke-linecap="round"/><path d="M20 -40L9 -14M20 40L9 14" stroke="#d3d8e0" stroke-width="2.2" stroke-linecap="round"/>` +
      '<path d="M-14 -17H4A17 17 0 0 1 4 17H-14Z" fill="#1d1f24" stroke="#000" stroke-width="1"/><path d="M-9 -12H4A12 12 0 0 1 12 -6" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>';
  },
  BC(c, st, u){          // باتری ۹ولت + سیم قرمز (+) و مشکی (−) که به پایه‌های راست می‌روند
    return '<path d="M-40 -20H-31M-40 20H-31" stroke="#e5484d" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M-40 20H-31" stroke="#2b2f36" stroke-width="3" stroke-linecap="round"/>' +
      wireTube('M13 -20H40', '#e5484d', '#7a1d20') + wireTube('M13 20H40', '#3a3f48', '#101216') +
      `<rect x="-32" y="-31" width="40" height="62" rx="5" fill="url(#${u}-bat)" stroke="#0b4a28" stroke-width="1.2"/>` +
      `<rect x="-15" y="-30" width="18" height="60" fill="url(#${u}-batS)"/>` +
      '<path d="M-3 -9L-9 2H-5L-7 11L0 0H-4Z" fill="#052e18"/>' + shine(-29, -27, 2.5, 54, 1.2) +
      '<rect x="8" y="-24" width="6" height="8" fill="#aab2be"/><rect x="8" y="16" width="6" height="8" fill="#aab2be"/>' +
      '<circle cx="14" cy="-20" r="5.2" fill="#f2c94c" stroke="#8a6a12"/><path d="M11.5 -20h5M14 -22.5v5" stroke="#5a4200" stroke-width="1.3" stroke-linecap="round"/>' +
      '<circle cx="14" cy="20" r="5.2" fill="#cfd5de" stroke="#6d757e"/><path d="M11.5 20h5" stroke="#3a4250" stroke-width="1.3" stroke-linecap="round"/>';
  },
  SW(c){
    return mLead(-40, -20) + mLead(20, 40) +
      '<rect x="-22" y="-12" width="44" height="16" rx="3" fill="#2a2d34" stroke="#111" stroke-width="1"/><rect x="-13" y="-8" width="26" height="6" rx="2" fill="#0b0c0f"/>' +
      `<rect x="${c && c.on ? 3 : -13}" y="-17" width="10" height="14" rx="2" fill="#d0d4db" stroke="#8a929e" stroke-width="1"/>`;
  },
  PB(c){
    const dn = c && c.on;
    return mLead(-40, -12) + mLead(12, 40) +
      '<rect x="-15" y="-27" width="30" height="29" rx="4" fill="#d2d1c7" stroke="#7c7b72" stroke-width="1"/>' +
      '<g fill="#252525"><circle cx="-10" cy="-22" r="1.8"/><circle cx="10" cy="-22" r="1.8"/><circle cx="-10" cy="-3" r="1.8"/><circle cx="10" cy="-3" r="1.8"/></g>' +
      `<circle cy="${dn ? -12 : -13.5}" r="9" fill="${dn ? '#101010' : '#252525'}" stroke="#000" stroke-width="1"/>` + (dn ? '' : '<circle cx="-3" cy="-17" r="3" fill="#fff" opacity=".18"/>');
  },
  LAMP(c, st){
    const lit = st === 'on';
    return mLead(-40, -9) + mLead(9, 40) +
      `<circle r="14" fill="${lit ? '#ffe27a' : '#cfe6ff'}" fill-opacity="${lit ? .9 : .22}" stroke="#9fb6cc" stroke-width="1.2"/>` +
      `<path d="M-7 6L-4 -3L0 5L4 -3L7 6" fill="none" stroke="${lit ? '#b45309' : '#f59e0b'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      '<path d="M-9 -9A13 13 0 0 1 -2 -13" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>';
  },
  HDR4(){
    let h = '';
    for(let i = 0; i < 4; i++) h += mLead(-40, 40, -40 + 20 * i, true);
    h += '<rect x="-9" y="-52" width="18" height="84" rx="2" fill="#26282d" stroke="#000" stroke-width="1"/>';
    for(let i = 0; i < 4; i++) h += `<rect x="-3.5" y="${-43.5 + 20 * i}" width="7" height="7" fill="#e2b84a" stroke="#8a6a12" stroke-width=".8"/>`;
    return h;
  },
  UNO(c){
    const hi = new Set(unoHiFor(c));
    return unoBoardReal(hi) + chipSvg(UNO_CHIP_REAL, c);
  },
  NANO(c){
    const hi = new Set(unoHiFor(c));
    return nanoBoardReal(hi) + chipSvg(NANO_CHIP_REAL, c);
  },
  ESP32(c){
    const hi = new Set(unoHiFor(c));
    return esp32BoardReal(hi) + chipSvg(ESP_CHIP_REAL, c);
  },
  BLUEPILL(c){
    const hi = new Set(unoHiFor(c));
    return bluePillBoardReal(hi) + chipSvg(BP_CHIP_REAL, c);
  }
};
REAL.PNP = REAL.NPN;
REAL.LEDY = REAL.LED; REAL.LEDG = REAL.LED;
let realCssDone = false;
function injectRealCss(){
  if(realCssDone || document.getElementById('cvRealCss')) { realCssDone = true; return; }
  realCssDone = true;
  const s = document.createElement('style');
  s.id = 'cvRealCss';
  s.textContent = '.cv-wrap.real-on .cv-stage{background:radial-gradient(circle at 50% 35%,#202a3a,#0d121b)}.cv-wrap.real-on .cv-dot{opacity:.35}';
  document.head.appendChild(s);
}

/* ادیتورِ طراحی آزاد: هر آردوینو Uno کدِ مخصوصِ خودش را دارد (کلید ذخیره = شناسهٔ یکتای همان قطعه، c.cid) */
const unoCodeEach = {
  mount:(el, host, c) => ArduinoSim.mount(el, Object.assign({missionId:'circuit-uno-' + c.cid, task:'freeUno'}, host))
};
const newCid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function create(root, opts){
  opts = opts || {};
  const uid = 'cv' + (++uidSeq);
  injectRealCss();
  const allowed = opts.palette ? new Set(opts.palette) : null;
  const mission = !!opts.tasks;
  let ext = (opts.unoExternal || opts.unoCode) ? {} : null;   // null = برنامهٔ داخلی؛ شیء = پایه‌ها را کدِ بیرونی می‌راند ({D12:1,…})
  const eachCfg = (!mission && !opts.unoCode && opts.unoCodeEach !== false && typeof ArduinoSim !== 'undefined') ? unoCodeEach : null;   // طراحی آزاد: کد جدا برای هر Uno
  const docks = new Map(), pinsBy = new Map(), runBy = new Map();
  if(eachCfg) injectDockCss();
  if(eachCfg) ext = {};     // طراحی آزاد: تا کد ننوشته‌ای هیچ پایه‌ای HIGH نمی‌شود (برنامهٔ چراغ راهنمای داخلی اجرا نشود)
  let eachRaf = 0;
  const codeCfg = opts.unoCode || null;      // ادیتور کدِ روی آردوینو: {mount(el, host)} (فقط مأموریت‌هایی که بخواهند)
  let codePanel = null, codeOk = !!opts.alreadyDone, codeRunning = false, pinsState = {}, pinsRaf = 0, realOn = false;
  const isActive = opts.isActive || (() => root.classList.contains('active'));

  let S = {comps:[], wires:[], seq:1};
  let sel = new Set();
  let tool = 'pan', placeType = null, placeRot = 0;
  let view = {x:0, y:0, z:1};
  let cursor = {x:0, y:0};
  let wireStart = null, drag = null, spaceDown = false, pinch = null, fitted = false, focusIn = false, succeeded = !!opts.alreadyDone;
  let undoStack = [], redoStack = [], lastTaskSig = '', saveTimer = null, stopped = false;
  const pointers = new Map(), bjtMem = new Map(), burntSet = new Set();   // LEDِ منفجرشده تا اولین ویرایش مدار خراب می‌ماند
  const cleanup = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanup.push(() => t.removeEventListener(ev, fn, o)); };

  const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const glowDefs = Object.keys(GLOWS).map(c => `<radialGradient id="${uid}-gl${GLOWS[c]}"><stop offset="0" stop-color="${c}" stop-opacity=".65"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
  const menu = mission
    ? '<button data-act="solution">نمایش پاسخ</button><button data-act="clear" class="danger">پاک‌کردن همه</button>'
    : '<button data-act="example">مدار نمونه (LED)</button><button data-act="json">ذخیره به‌صورت JSON</button><button data-act="import">بارگذاری JSON</button><button data-act="svg">خروجی SVG</button><button data-act="png">خروجی PNG</button><button data-act="clear" class="danger">پاک‌کردن همه</button>';

  root.innerHTML = `
<div class="cv-wrap${mission ? ' cv-mission' : ''}">
  ${opts.note ? `<div class="sim-hw-note">${opts.note}</div>` : ''}
  <div class="cv-toolbar">
    <div class="cv-group cv-seg"><button class="cv-btn on" data-vw="sch">${ico('<path d="M2 12h4l2-5 4 10 4-10 2 5h4"/>')}شماتیک</button><button class="cv-btn" data-vw="real" title="نمای واقعی: مقاومت، باتری، LED و آردوینو مثل خودشان">${ico('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')}واقعی</button><button class="cv-btn" data-vw="pcb">${ico('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>')}PCB / فوت‌پرینت</button></div>
    <div class="cv-group cv-sch-only">
      <button class="cv-btn" data-tool="select" title="انتخاب (V)">${ico('<path d="m5 3 14 8-6 2-3 6z"/>')}انتخاب</button>
      <button class="cv-btn" data-tool="wire" title="سیم‌کشی (X)">${ico('<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2"/>')}سیم‌کشی</button>
      <button class="cv-btn" data-tool="pan" title="جابه‌جایی صفحه (H)">${ico('<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>')}دست</button>
    </div>
    <div class="cv-group cv-sch-only">
      <button class="cv-btn" id="cvRotate" title="چرخش (R)">${ico('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>')}چرخش</button>
      <button class="cv-btn" id="cvDelete" title="حذف (Delete)">${ico('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>')}حذف</button>
      <button class="cv-btn cv-ico" id="cvUndo" title="واگرد (Ctrl+Z)" aria-label="واگرد"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5 4 9l4 4"/><path d="M4 9h10a6 6 0 0 1 0 12h-4"/></svg></button>
      <button class="cv-btn cv-ico" id="cvRedo" title="ازنو (Ctrl+Y)" aria-label="ازنو"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 5 4 4-4 4"/><path d="M20 9H10a6 6 0 0 0 0 12h4"/></svg></button>
    </div>
    <div class="cv-group">
      <button class="cv-btn cv-3d" id="cv3d" title="نمای ۳بعدی مدار (مثل KiCad)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg><span>سه بعدی</span></button>
    </div>
    <div class="cv-group cv-menu-wrap">
      <button class="cv-btn" id="cvMenuBtn">${ico('<path d="M4 7h16M4 12h16M4 17h16"/>')}${mission ? 'گزینه‌ها ▾' : 'فایل ▾'}</button>
      <div class="cv-menu" id="cvMenu">${menu}</div>
      <input type="file" id="cvFile" accept=".json,application/json" hidden>
    </div>
  </div>
  <div class="cv-msgbar" id="cvMsg"></div>
  <div class="cv-main">
    <aside class="cv-side">
      ${mission ? '<div class="cv-tasks" id="cvTasks"></div>' : ''}
      <div class="cv-props" id="cvProps"></div>
      <div class="cv-palette" id="cvPalette"></div>
    </aside>
    <div class="cv-stage" id="cvStage">
      <svg id="cvSvg" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
        <defs><pattern id="${uid}-grid" patternUnits="userSpaceOnUse" width="20" height="20"><circle cx="0" cy="0" r="1" class="cv-dot"/></pattern>${glowDefs}${realDefs(uid)}</defs>
        <rect id="cvBg" width="100%" height="100%" fill="url(#${uid}-grid)"/>
        <g id="cvWorld"></g>
      </svg>
      <div class="cv-fab">
        <button class="cv-btn" id="cvZoomIn" title="بزرگ‌نمایی">+</button>
        <button class="cv-btn" id="cvZoomOut" title="کوچک‌نمایی">−</button>
        <button class="cv-btn" id="cvFit" title="نمایش همه">⤢</button>
      </div>
    </div>
  </div>
  <div class="cv-status">
    <span class="cv-hint" id="cvHint"></span>
    <span class="cv-info"><span id="cvCoord">X 0  Y 0</span><span id="cvZoomTxt">100%</span><span id="cvSaved"></span></span>
  </div>
</div>`;

  const $ = id => root.querySelector('#' + id);
  $('cvPalette').before(root.querySelector('.cv-toolbar'));
  const wrap = root.querySelector('.cv-wrap');
  const svg = $('cvSvg'), world = $('cvWorld'), stage = $('cvStage'), gridPat = root.querySelector(`#${uid}-grid`), bg = $('cvBg');
  const propsEl = $('cvProps'), hintEl = $('cvHint'), coordEl = $('cvCoord'), zoomEl = $('cvZoomTxt'), savedEl = $('cvSaved');
  const msgEl = $('cvMsg'), tasksEl = $('cvTasks'), undoBtn = $('cvUndo'), redoBtn = $('cvRedo');

  function rot(x,y,r){ for(let i=0;i<(r&3);i++){ const t = x; x = -y; y = t; } return [x,y]; }
  function pinsOf(c){
    return DEFS[c.t].pins.map(p => { const q = rot(p[0],p[1],c.r); return {x:c.x+q[0], y:c.y+q[1], name:p[2]}; });
  }
  function bboxOf(c, box){
    const b = box || (realOn && isBoard(c.t) ? MCU[c.t].boxReal : DEFS[c.t].box), xs = [], ys = [];
    [[b[0],b[1]],[b[2],b[1]],[b[0],b[3]],[b[2],b[3]]].forEach(p => { const q = rot(p[0],p[1],c.r); xs.push(c.x+q[0]); ys.push(c.y+q[1]); });
    return {x0:Math.min(...xs), y0:Math.min(...ys), x1:Math.max(...xs), y1:Math.max(...ys)};
  }
  function onSeg(px,py,w){
    const cr = (w.x2-w.x1)*(py-w.y1) - (w.y2-w.y1)*(px-w.x1);
    return cr === 0 && px >= Math.min(w.x1,w.x2) && px <= Math.max(w.x1,w.x2) && py >= Math.min(w.y1,w.y2) && py <= Math.max(w.y1,w.y2);
  }
  const isEnd = (px,py,w) => (px===w.x1 && py===w.y1) || (px===w.x2 && py===w.y2);
  function segDist(px,py,w){
    const dx = w.x2-w.x1, dy = w.y2-w.y1, l2 = dx*dx + dy*dy;
    let t = l2 ? ((px-w.x1)*dx + (py-w.y1)*dy) / l2 : 0;
    t = clamp(t,0,1);
    return Math.hypot(px - (w.x1+t*dx), py - (w.y1+t*dy));
  }
  function nextRef(pre){
    const used = new Set(S.comps.map(c => c.ref));
    let n = 1; while(used.has(pre + n)) n++;
    return pre + n;
  }
  function newComp(t,x,y,r){
    const d = DEFS[t];
    const o = {id:S.seq++, t, x, y, r:r&3, ref:d.pre ? nextRef(d.pre) : '', val:d.val, on:false};
    if(isMcu(t)) o.cid = newCid();
    return o;
  }

  function toLocal(e){ const r = svg.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; }
  function toWorld(e){ const p = toLocal(e); return {x:(p.x - view.x) / view.z, y:(p.y - view.y) / view.z}; }

  function pushUndo(prev){
    burntSet.clear();
    undoStack.push(prev || JSON.stringify(S));
    if(undoStack.length > 100) undoStack.shift();
    redoStack = [];
  }
  function restore(str){
    S = JSON.parse(str);
    const ids = new Set(S.comps.map(c => 'c'+c.id).concat(S.wires.map(w => 'w'+w.id)));
    sel = new Set([...sel].filter(k => ids.has(k)));
    save(); sync();
  }
  function undo(){ if(!undoStack.length) return; redoStack.push(JSON.stringify(S)); restore(undoStack.pop()); }
  function redo(){ if(!redoStack.length) return; undoStack.push(JSON.stringify(S)); restore(redoStack.pop()); }

  function save(){
    if(!opts.storageKey) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  function saveNow(){
    clearTimeout(saveTimer); saveTimer = null;
    if(!opts.storageKey) return;
    try{
      localStorage.setItem(opts.storageKey, JSON.stringify({v:2, comps:S.comps, wires:S.wires, seq:S.seq}));
      savedEl.textContent = 'ذخیره شد ✓';
      setTimeout(() => { savedEl.textContent = ''; }, 1500);
    }catch(e){}
  }
  on(window, 'pagehide', () => { if(saveTimer) saveNow(); });

  function sanitize(d){
    if(!d || typeof d !== 'object' || !Array.isArray(d.comps) || !Array.isArray(d.wires)) return null;
    const num = v => Number.isFinite(v) ? snap(v) : null;
    const out = {comps:[], wires:[], seq:1};
    d.comps.slice(0,2000).forEach(c => {
      if(!c || !Object.prototype.hasOwnProperty.call(DEFS, c.t)) return;
      const x = num(c.x), y = num(c.y);
      if(x === null || y === null) return;
      const nc = {id:out.seq++, t:c.t, x, y, r:(Number(c.r)|0)&3, ref:String(c.ref||'').slice(0,12), val:String(c.val||'').slice(0,24), on:!!c.on && c.t !== 'PB'};
      if(isMcu(c.t)) nc.cid = String(c.cid || '').replace(/[^\w-]/g, '').slice(0, 24) || newCid();
      out.comps.push(nc);
    });
    d.wires.slice(0,5000).forEach(w => {
      if(!w) return;
      const a = [num(w.x1),num(w.y1),num(w.x2),num(w.y2)];
      if(a.some(v => v === null) || (a[0]===a[2] && a[1]===a[3])) return;
      out.wires.push({id:out.seq++, x1:a[0], y1:a[1], x2:a[2], y2:a[3]});
    });
    if(d.v !== 2){      // طرح‌های قدیمی: Nano و Blue Pill پایه‌ها را روی x = ±100 داشتند؛ سیم‌ها را به جای جدید ببر
      const mv = new Map();
      out.comps.forEach(c => { if(c.t !== 'NANO' && c.t !== 'BLUEPILL') return; DEFS[c.t].pins.forEach(p => { const o = rot(Math.sign(p[0]) * 100, p[1], c.r), n = rot(p[0], p[1], c.r); mv.set(key(c.x + o[0], c.y + o[1]), [c.x + n[0], c.y + n[1]]); }); });
      if(mv.size) out.wires.forEach(w => { const a = mv.get(key(w.x1, w.y1)), b = mv.get(key(w.x2, w.y2)); if(a){ w.x1 = a[0]; w.y1 = a[1]; } if(b){ w.x2 = b[0]; w.y2 = b[1]; } });
    }
    return out;
  }
  function build(spec){
    S = {comps:[], wires:[], seq:1};
    spec.comps.forEach(a => {
      const c = newComp(a.t, a.x, a.y, a.r || 0);
      if(a.ref) c.ref = a.ref; if(a.val) c.val = a.val; if(a.on) c.on = true;
      S.comps.push(c);
    });
    spec.wires.forEach(a => S.wires.push({id:S.seq++, x1:a[0], y1:a[1], x2:a[2], y2:a[3]}));
  }
  const EXAMPLE = {
    comps:[{t:'BC',x:-100,y:0,ref:'J1'},{t:'R',x:20,y:-60,ref:'R1',val:'330Ω'},{t:'LED',x:140,y:0,r:1,ref:'D1'}],
    wires:[[-60,-20,-60,-60],[-60,-60,-20,-60],[60,-60,140,-60],[140,-60,140,-40],[140,40,140,60],[140,60,-60,60],[-60,60,-60,20]]
  };
  function load(){
    try{
      const raw = opts.storageKey && localStorage.getItem(opts.storageKey);
      if(raw){ const d = sanitize(JSON.parse(raw)); if(d){ S = d; return; } }
    }catch(e){}
    if(mission) S = {comps:[], wires:[], seq:1}; else build(EXAMPLE);
  }

  function addWire(x1,y1,x2,y2){
    if(x1===x2 && y1===y2) return;
    const nw = {x1,y1,x2,y2};
    splitAt(x1,y1); splitAt(x2,y2);
    const pts = [];
    S.wires.forEach(w => [[w.x1,w.y1],[w.x2,w.y2]].forEach(q => {
      if(onSeg(q[0],q[1],nw) && !isEnd(q[0],q[1],nw)) pts.push(q);
    }));
    let segs = [nw];
    if(pts.length){
      pts.sort((a,b) => Math.hypot(a[0]-x1,a[1]-y1) - Math.hypot(b[0]-x1,b[1]-y1));
      segs = []; let px = x1, py = y1;
      pts.forEach(q => { if(q[0]!==px || q[1]!==py){ segs.push({x1:px,y1:py,x2:q[0],y2:q[1]}); px = q[0]; py = q[1]; } });
      segs.push({x1:px,y1:py,x2,y2});
    }
    segs.forEach(s => {
      const dup = S.wires.some(w => isEnd(s.x1,s.y1,w) && isEnd(s.x2,s.y2,w));
      if(!dup) S.wires.push({id:S.seq++, x1:s.x1, y1:s.y1, x2:s.x2, y2:s.y2});
    });
  }
  function splitAt(x,y){
    S.wires.slice().forEach(w => {
      if(onSeg(x,y,w) && !isEnd(x,y,w)){
        const i = S.wires.indexOf(w);
        S.wires.splice(i,1,
          {id:S.seq++, x1:w.x1, y1:w.y1, x2:x, y2:y},
          {id:S.seq++, x1:x, y1:y, x2:w.x2, y2:w.y2});
      }
    });
  }
  function isConn(p){
    return S.comps.some(c => pinsOf(c).some(q => q.x===p.x && q.y===p.y)) || S.wires.some(w => onSeg(p.x,p.y,w));
  }
  function wirePath(a,b){
    if(a.x===b.x || a.y===b.y) return [a,b];
    const dx = Math.abs(b.x-a.x), dy = Math.abs(b.y-a.y);
    const m = dx >= dy ? {x:b.x, y:a.y} : {x:a.x, y:b.y};
    return [a,m,b];
  }
  function commitWire(sp, forceFinish){
    if(sp.x===wireStart.x && sp.y===wireStart.y){ wireStart = null; render(); return; }
    const path = wirePath(wireStart, sp);
    const finish = forceFinish || isConn(sp);
    pushUndo();
    for(let i=0;i<path.length-1;i++) addWire(path[i].x,path[i].y,path[i+1].x,path[i+1].y);
    wireStart = finish ? null : {x:sp.x, y:sp.y};
    save(); sync();
  }

  function hitTest(w){
    for(let i=S.comps.length-1;i>=0;i--){
      const b = bboxOf(S.comps[i]);
      if(w.x >= b.x0+4 && w.x <= b.x1-4 && w.y >= b.y0 && w.y <= b.y1) return {k:'c', id:S.comps[i].id};
    }
    const tol = 8 / view.z;
    for(let i=S.wires.length-1;i>=0;i--) if(segDist(w.x,w.y,S.wires[i]) <= tol) return {k:'w', id:S.wires[i].id};
    return null;
  }

  function dsu(){
    const par = new Map();
    const find = k => { if(!par.has(k)) par.set(k,k); while(par.get(k) !== k){ par.set(k, par.get(par.get(k))); k = par.get(k); } return k; };
    const uni = (a,b) => par.set(find(a), find(b));
    return {find, uni};
  }

  function netHighlight(){
    const hot = {wires:new Set(), keys:new Set()};
    if(sel.size !== 1) return hot;
    const only = [...sel][0];
    if(only[0] !== 'w') return hot;
    const {find, uni} = dsu();
    S.wires.forEach(w => uni(key(w.x1,w.y1), key(w.x2,w.y2)));
    const w0 = S.wires.find(w => 'w'+w.id === only);
    if(!w0) return hot;
    const r = find(key(w0.x1,w0.y1));
    S.wires.forEach(w => { if(find(key(w.x1,w.y1)) === r){ hot.wires.add(w.id); hot.keys.add(key(w.x1,w.y1)); hot.keys.add(key(w.x2,w.y2)); } });
    return hot;
  }

  function analyze(){
    const {find, uni} = dsu();
    S.wires.forEach(w => uni(key(w.x1,w.y1), key(w.x2,w.y2)));
    const P = new Map(S.comps.map(c => [c.id, pinsOf(c)]));
    const node = (c,i) => { const p = P.get(c.id)[i]; return find(key(p.x,p.y)); };
    const gnd = S.comps.filter(c => c.t === 'GND');
    gnd.forEach(c => uni(key(P.get(c.id)[0].x, P.get(c.id)[0].y), key(P.get(gnd[0].id)[0].x, P.get(gnd[0].id)[0].y)));
    const unos = S.comps.filter(c => isBoard(c.t));
    const hiNow = new Set(ext ? Object.keys(ext).filter(k => ext[k]) : unos.length ? UNO_PROG[unoPhase()].hi : []);
    const hiOf = eachCfg ? (u => new Set(hiList(u))) : (() => hiNow);     // طراحی آزاد: هر Uno پایه‌های HIGHِ خودش را دارد
    const unoGndKey = u => { const q = P.get(u.id)[MCU[u.t].pins.indexOf('GND')]; return key(q.x, q.y); };
    unos.forEach(u => { if(gnd.length) uni(unoGndKey(u), key(P.get(gnd[0].id)[0].x, P.get(gnd[0].id)[0].y)); else if(u !== unos[0]) uni(unoGndKey(u), unoGndKey(unos[0])); });
    unos.forEach(u => MCU[u.t].pins.forEach((n, i) => { if(n === 'GND'){ const q = P.get(u.id)[i]; uni(key(q.x, q.y), unoGndKey(u)); } else if(n === '3V3_'){ const q = P.get(u.id)[i], f = P.get(u.id)[MCU[u.t].pins.indexOf('3V3')]; uni(key(q.x, q.y), key(f.x, f.y)); } else if(n === 'RST'){ const q = P.get(u.id)[i], f = P.get(u.id)[MCU[u.t].pins.indexOf('RST')]; uni(key(q.x, q.y), key(f.x, f.y)); } }));   // همهٔ پایه‌های GND یکی‌اند
    S.comps.forEach(c => { if(c.t === 'HDR4') DEFS.HDR4.link.forEach(l => { const a = P.get(c.id)[l[0]], b = P.get(c.id)[l[1]]; uni(key(a.x, a.y), key(b.x, b.y)); }); });   // هدر: پایهٔ بیرونی = پایهٔ برد
    const vcc = {};
    S.comps.filter(c => c.t === 'VCC').forEach(c => {
      const k = key(P.get(c.id)[0].x, P.get(c.id)[0].y);
      if(vcc[c.val]) uni(k, vcc[c.val]); else vcc[c.val] = k;
    });
    const adj = new Map();
    const addE = (a,b,c,kind,both) => {
      if(!adj.has(a)) adj.set(a,[]); adj.get(a).push({to:b, comp:c, kind});
      if(both){ if(!adj.has(b)) adj.set(b,[]); adj.get(b).push({to:a, comp:c, kind}); }
    };
    const sources = [];
    S.comps.forEach(c => {
      const d = DEFS[c.t];
      if(c.t === 'BC') sources.push({comp:c, pos:node(c,2), neg:node(c,3), v:parseFloat(c.val) || 9});   // کانکتور باتری منبع است (سیم قرمز +، مشکی −)
      else if(d.link) d.link.forEach(l => addE(node(c,l[0]), node(c,l[1]), c, 'wire', true));
      else if(d.edge === 'led' || d.edge === 'diode') addE(node(c,0), node(c,1), c, d.edge, false);
      else if(d.edge === 'load' || d.edge === 'wire'){
        if(d.sw && !c.on) return;
        addE(node(c,0), node(c,1), c, d.edge === 'load' ? 'load' : 'wire', true);
      }
    });
    if(gnd.length) Object.keys(vcc).forEach(v => sources.push({comp:null, v:parseFloat(v) || 5, pos:find(vcc[v]), neg:find(key(P.get(gnd[0].id)[0].x, P.get(gnd[0].id)[0].y))}));
    const rank = {on:1, burnt:2, short:3};
    let status = new Map();
    const mark = (c,s) => { if(!c) return; if(!status.get(c.id) || rank[s] > rank[status.get(c.id)]) status.set(c.id, s); };
    let shorted = false;
    function solveBJT(hiFn){
      const ohm = s => { const m = /^([\d.]+)\s*([kKM]?)/.exec(String(s)); return (m && parseFloat(m[1]) * ({k:1e3, K:1e3, M:1e6}[m[2]] || 1)) || 1000; };
      const els = [];
      S.comps.forEach(c => {
        const d = DEFS[c.t];
        if(c.t === 'NPN' || c.t === 'PNP') els.push({k:'Q', id:c.id, comp:c, pnp:c.t === 'PNP', b:node(c,0), c:node(c,1), e:node(c,2)});
        else if(d.edge === 'led') els.push({k:'D', id:c.id, comp:c, led:true, a:node(c,0), b:node(c,1), vf:{LED:1.9, LEDY:2, LEDG:2.1}[c.t] || 2, g:1/20});
        else if(d.edge === 'diode') els.push({k:'D', id:c.id, comp:c, a:node(c,0), b:node(c,1), vf:0.65, g:1/5});
        else if(d.edge === 'load' || d.edge === 'wire'){
          if(d.sw && !c.on) return;
          els.push({k:'R', id:c.id, comp:c, a:node(c,0), b:node(c,1), g:d.sw ? 1e3 : 1 / (c.t === 'R' ? ohm(c.val) : 20)});
        }
      });
      sources.forEach((s,i) => els.push({k:'V', id:'V' + i, comp:s.comp, p:s.pos, n:s.neg, v:s.v}));
      unos.forEach(u => MCU[u.t].pins.forEach((n,i) => { const v = MCU[u.t].out(n, hiFn(u)); if(v !== null) els.push({k:'V', id:'U' + u.id + n + i, comp:u, p:node(u,i), n:find(unoGndKey(u)), v}); }));   // پایهٔ خروجی آردوینو = منبع ۵ولت (HIGH) یا ۰ولت (LOW)
      const ref = unos.length ? find(unoGndKey(unos[0])) : gnd.length ? find(key(P.get(gnd[0].id)[0].x, P.get(gnd[0].id)[0].y)) : sources[0].neg;
      const r = dcSolve(els, ref, bjtMem);
      els.forEach(e => {
        const i = r.cur[e.id];
        if(e.k === 'R'){ if(Math.abs(i) > 1) mark(e.comp, 'short'); else if(Math.abs(i) > 1e-4) mark(e.comp, 'on'); }
        else if(e.k === 'D'){ if(e.led && i > 0.035) mark(e.comp, 'burnt'); else if(i > (e.led ? 1e-3 : 1e-4)) mark(e.comp, 'on'); }
        else if(e.k === 'Q'){ if(i) mark(e.comp, 'on'); }
        else if(e.k === 'V'){ if(Math.abs(i) > 1) mark(e.comp, 'short'); else if(Math.abs(i) > 1e-4) mark(e.comp, 'on'); }
      });
      return r.maxSrc > 1;
    }
    const useSolver = S.comps.some(c => c.t === 'NPN' || c.t === 'PNP') || unos.length > 0;
    let phases = null;
    if(useSolver && (sources.length || unos.length)){
      shorted = solveBJT(hiOf);
      if(unos.length && !eachCfg){      // همهٔ مرحله‌های برنامه را هم بررسی کن: هر مرحله چه LEDهایی روشن‌اند / می‌سوزند
        const keep = status, burntAll = new Set();
        let anyShort = false;
        phases = UNO_PROG.map(ph => {
          status = new Map();
          if(solveBJT(() => new Set(ph.hi))) anyShort = true;
          const lit = new Set();
          S.comps.forEach(c => { if(DEFS[c.t].edge !== 'led') return; const st = status.get(c.id); if(st === 'on') lit.add(c.t); else if(st === 'burnt') burntAll.add(c.id); });
          return {lit};
        });
        status = keep;
        burntAll.forEach(id => status.set(id, 'burnt'));
        if(anyShort){ shorted = true; unos.forEach(u => status.set(u.id, 'short')); }
      }
    }
    if(!useSolver) sources.forEach(src => {
      if(src.pos === src.neg){ shorted = true; mark(src.comp,'short'); return; }
      let count = 0;
      const seen = new Set([src.pos]), stack = [];
      (function dfs(n){
        if(count > 300) return;
        if(n === src.neg){
          count++;
          const limited = stack.some(e => e.kind === 'load'), leds = stack.filter(e => e.kind === 'led');
          if(!limited && !leds.length){ shorted = true; stack.forEach(e => mark(e.comp,'short')); mark(src.comp,'short'); }
          else if(!limited){ leds.forEach(e => mark(e.comp,'burnt')); stack.forEach(e => { if(e.kind !== 'led') mark(e.comp,'on'); }); }
          else { stack.forEach(e => mark(e.comp,'on')); mark(src.comp,'on'); }
          return;
        }
        for(const e of (adj.get(n) || [])){
          if(seen.has(e.to)) continue;
          seen.add(e.to); stack.push(e); dfs(e.to); stack.pop(); seen.delete(e.to);
        }
      })(src.pos);
    });
    status.forEach((s, id) => { if(s === 'burnt') burntSet.add(id); });
    burntSet.forEach(id => { if(S.comps.some(c => c.id === id)) status.set(id, 'burnt'); else burntSet.delete(id); });
    const ofT = t => S.comps.filter(c => c.t === t);
    const A = {
      status, shorted, phases, hasUno:unos.length > 0, hi:[...hiNow], codeOk,
      burnt:[...status.values()].filter(s => s === 'burnt').length,
      count:t => ofT(t).length,
      lit:t => ofT(t).filter(c => status.get(c.id) === 'on').length,
      wired:(a,b,rev) => ofT(a).some(c1 => ofT(b).some(c2 => rev
        ? node(c1,0) === node(c2,1) && node(c1,1) === node(c2,0)
        : node(c1,0) === node(c2,0) && node(c1,1) === node(c2,1)))
    };
    return A;
  }

  function get3DData(){
    let A = null;
    try{ A = analyze(); }catch(_){}
    return {
      comps: S.comps.map(c => {
        const d = DEFS[c.t], b = bboxOf(c);
        return {t:c.t, x:c.x, y:c.y, r:c.r, ref:c.ref || '', val:c.val || '', on:!!c.on, st:(A && A.status.get(c.id)) || '', power:!!(d.power || d.offboard),
          box:{x0:b.x0, y0:b.y0, x1:b.x1, y1:b.y1}, pins:pinsOf(c).map(p => [p.x, p.y])};
      }),
      wires: S.wires.map(w => [w.x1, w.y1, w.x2, w.y2])
    };
  }

  function pcbSrc(){
    let A = null;
    try{ A = analyze(); }catch(_){}
    return {
      comps: S.comps.map(c => {
        const d = DEFS[c.t];
        return {id:c.id, t:c.t, r:c.r, ref:c.ref || '', val:c.val || '', on:!!c.on, st:(A && A.status.get(c.id)) || '', power:!!(d.power || d.offboard), link:d.link || null,
          lpins:d.pins.map(p => [p[0], p[1], p[2]]), sx:c.x, sy:c.y, spins:pinsOf(c).map(p => [p.x, p.y])};
      }),
      wires: S.wires.map(w => [w.x1, w.y1, w.x2, w.y2])
    };
  }
  let pcb = null;
  const getPcb = () => pcb || (window.CircuitPCB ? (pcb = CircuitPCB.create(root.querySelector('.cv-main'), {src:pcbSrc, key:opts.storageKey || ''})) : null);
  function setView(v){
    const p = v === 'pcb' ? getPcb() : pcb;
    if(v === 'pcb' && !p) return;
    if(v === 'pcb') setCodeMode(false);
    realOn = v === 'real';
    wrap.classList.toggle('real-on', realOn);
    buildPalette();
    wrap.classList.toggle('pcb-on', v === 'pcb');
    root.querySelectorAll('[data-vw]').forEach(b => b.classList.toggle('on', b.dataset.vw === v));
    if(v === 'pcb') p.show(); else if(p) p.hide();
    if(!stopped && v !== 'pcb') render();
  }

  function labelsOf(c){
    const d = DEFS[c.t], b = realOn && /^LED/.test(c.t) ? bboxOf(c, [-40,-34,40,14]) : bboxOf(c), cx = (b.x0+b.x1)/2, cy = (b.y0+b.y1)/2;   // در نمای واقعی گنبد LED بیرون از جعبهٔ شماتیک می‌زند
    const t = (x,y,anchor,cls,s) => s ? `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>` : '';
    if(d.lab === 'none') return '';
    if(d.lab === 'top') return t(cx, b.y0-5, 'middle', 'cv-val', c.val);
    const vert = (b.y1-b.y0) > (b.x1-b.x0) * 1.3;
    if(d.side || vert) return t(b.x1+8, cy-2, 'start', 'cv-ref', c.ref) + t(b.x1+8, cy+14, 'start', 'cv-val', c.val);
    if(/^LED/.test(c.t)) return t(cx-4, b.y0-6, 'end', 'cv-ref', c.ref) + t(cx+4, b.y0-6, 'start', 'cv-val', c.val);
    return t(cx, b.y0-6, 'middle', 'cv-ref', c.ref) + t(cx, b.y1+14, 'middle', 'cv-val', c.val);
  }
  function compG(c, cls, st){
    const d = DEFS[c.t];
    const lit = st === 'on' && d.lit ? d.lit : '';
    const isLed = /^LED/.test(c.t);
    const x = st === 'burnt' && !isLed ? '<path class="cv-x" d="M-9 -9L9 9M9 -9L-9 9"/>' : '';
    const bc = rot(...(realOn ? [8, -18] : [0, 0]), c.r);   // مرکز بدنهٔ LED بعد از چرخش
    const boom = st === 'burnt' && isLed ? `<text x="${c.x + bc[0]}" y="${c.y + bc[1]}" font-size="26" text-anchor="middle" dominant-baseline="central" pointer-events="none">💥</text>` : '';
    const glow = st === 'on' && d.glow ? `<circle cx="${c.x}" cy="${c.y}" r="34" fill="url(#${uid}-gl${GLOWS[d.glow]})" pointer-events="none"/>` : '';
    if(realOn && REAL[c.t]) return glow + `<g class="${cls}${st ? ' ' + st : ''}" transform="translate(${c.x} ${c.y}) rotate(${(c.r&3)*90})">${REAL[c.t](c, st, uid)}${x}</g>` + boom;
    return glow + `<g class="${cls}${st ? ' ' + st : ''}" transform="translate(${c.x} ${c.y}) rotate(${(c.r&3)*90})">${lit}${drawOf(c,d)}${x}</g>` + boom;
  }
  function endCounts(){
    const ends = new Map();
    const add = (k,t) => { const o = ends.get(k) || {w:0,p:0}; o[t]++; ends.set(k,o); };
    S.wires.forEach(w => { add(key(w.x1,w.y1),'w'); add(key(w.x2,w.y2),'w'); });
    S.comps.forEach(c => pinsOf(c).forEach(p => add(key(p.x,p.y),'p')));
    return ends;
  }

  function updateFeedback(A){
    let msg = '', cls = '';
    if(A.shorted){ msg = A.hasUno ? '⚠️ اتصال کوتاه! یکی از پایه‌های آردوینو بدون هیچ بار مستقیم به GND وصل شده است.' : '⚠️ اتصال کوتاه! باتری بدون هیچ بار (مقاومت، لامپ…) بسته شده و سیم‌ها داغ می‌شوند.'; cls = 'bad'; }
    else if(A.burnt){ msg = '💥 LED بدون مقاومتِ محدودکننده منفجر شد! یک مقاومت پشت‌سرِ LED بگذار.'; cls = 'bad'; }
    let done = false;
    if(mission){
      const results = opts.tasks.map(t => { let ok = false; try{ ok = !!t.test(A); }catch(e){} return ok; });
      done = results.every(Boolean);
      const sig = results.join();
      if(sig !== lastTaskSig){
        lastTaskSig = sig;
        tasksEl.innerHTML = '<div class="cv-props-title">هدف‌ها</div><ul>' +
          opts.tasks.map((t,i) => `<li class="${results[i] ? 'ok' : ''}"><span>${results[i] ? '✓' : '○'}</span>${esc(t.label)}</li>`).join('') + '</ul>';
      }
      if(done && !msg){ msg = '✅ مدار درست است!'; cls = 'ok'; }
    }
    msgEl.textContent = msg; msgEl.className = 'cv-msgbar' + (msg ? ' show ' + cls : '');
    if(mission && done && !succeeded && !A.shorted && !A.burnt){
      succeeded = true;
      if(opts.onSuccess) setTimeout(() => { if(!stopped) opts.onSuccess(); }, 600);
    }
  }

  function render(){
    const z = view.z;
    gridPat.setAttribute('width', G*z); gridPat.setAttribute('height', G*z);
    gridPat.setAttribute('x', view.x); gridPat.setAttribute('y', view.y);
    bg.style.opacity = z < 0.45 ? 0 : 1;
    const hot = netHighlight();
    const A = analyze();
    unoHiNow = A.hasUno && ext ? A.hi : null;
    unoChipNow = codePanel ? (codeRunning ? 'run' : 'idle') : null;
    setUnoMaps();
    let h = '', outH = '', inH = '';
    S.wires.forEach(w => {
      const cls = 'cv-wire' + (sel.has('w'+w.id) ? ' sel' : '') + (hot.wires.has(w.id) ? ' hot' : '');
      if(realOn){        // سیم واقعی: لولهٔ خاکستری با لبهٔ تیره (روشن‌تر وقتی انتخاب/هم‌پتانسیل است)
        const hl = sel.has('w'+w.id) || hot.wires.has(w.id);
        outH += `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" style="stroke:#22262d;stroke-width:8;stroke-linecap:round;fill:none"/>`;
        inH += `<line class="${cls}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" style="stroke:${hl ? '#ffd166' : '#9aa1ad'};stroke-width:4.4;stroke-linecap:round;fill:none"/>`;
        return;
      }
      h += `<line class="${cls}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}"/>`;
    });
    h = outH + inH + h;
    S.comps.forEach(c => {
      const on = sel.has('c'+c.id);
      h += compG(c, 'cv-comp' + (on ? ' sel' : ''), A.status.get(c.id)) + labelsOf(c);
      if(on){
        const b = bboxOf(c);
        h += `<rect class="cv-selbox" x="${b.x0-6}" y="${b.y0-6}" width="${b.x1-b.x0+12}" height="${b.y1-b.y0+12}" rx="4"/>`;
      }
    });
    endCounts().forEach((o,k) => {
      const [x,y] = k.split(',');
      if(o.w + o.p >= 3 && o.w >= 1) h += realOn
        ? `<circle class="cv-junc" cx="${x}" cy="${y}" r="5" style="fill:#cfd4dc;stroke:#22262d;stroke-width:1.5"/>`
        : `<circle class="cv-junc${hot.keys.has(k) ? ' hot' : ''}" cx="${x}" cy="${y}" r="4"/>`;
      else if(o.w === 0 && o.p === 1) h += `<circle class="cv-pin" cx="${x}" cy="${y}" r="3"/>`;
    });
    if(tool === 'place' && placeType){
      h += compG({t:placeType, x:cursor.x, y:cursor.y, r:placeRot}, 'cv-comp ghost');
    }
    if(tool === 'wire'){
      if(wireStart){
        const p = wirePath(wireStart, cursor);
        h += `<polyline class="cv-wire prev" points="${p.map(q => q.x+','+q.y).join(' ')}"/>`;
        h += `<circle class="cv-junc" cx="${wireStart.x}" cy="${wireStart.y}" r="3"/>`;
      }
      h += `<path class="cv-cross" d="M${cursor.x-8} ${cursor.y}H${cursor.x+8}M${cursor.x} ${cursor.y-8}V${cursor.y+8}"/>`;
    }
    if(drag && drag.kind === 'box' && drag.cur){
      const x = Math.min(drag.start.x,drag.cur.x), y = Math.min(drag.start.y,drag.cur.y);
      h += `<rect class="cv-box" x="${x}" y="${y}" width="${Math.abs(drag.cur.x-drag.start.x)}" height="${Math.abs(drag.cur.y-drag.start.y)}"/>`;
    }
    world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${z})`);
    world.innerHTML = h;
    zoomEl.textContent = Math.round(z*100) + '%';
    undoBtn.disabled = !undoStack.length; redoBtn.disabled = !redoStack.length;
    updateFeedback(A);
  }

  function renderProps(){
    const comps = S.comps.filter(c => sel.has('c'+c.id));
    const wires = S.wires.filter(w => sel.has('w'+w.id));
    const total = comps.length + wires.length;
    if(!total){
      propsEl.innerHTML = '<div class="cv-props-title">مشخصات</div><div class="cv-props-empty">یک قطعه را از فهرست انتخاب کن و روی صفحه بگذار. برای سیم‌کشی ابزار «سیم‌کشی» را بزن.</div>';
      return;
    }
    if(total === 1 && comps.length === 1){
      const c = comps[0], d = DEFS[c.t];
      propsEl.innerHTML = `<div class="cv-props-title">${esc(d.fa)}</div>` +
        (d.power ? '' : `<label>نام<input id="cvRef" value="${esc(c.ref)}" maxlength="12"></label>`) +
        (d.lab === 'none' ? '' : `<label>مقدار<input id="cvVal" value="${esc(c.val)}" maxlength="24"></label>`) +
        (eachCfg && isMcu(c.t) ? '<div class="cv-uno-switch cv-uno-switch-props"><button type="button" class="on" tabindex="-1">⚡ مدار</button><button type="button" id="cvCode">&lt;/&gt; کد</button></div>'
          : codePanel && isMcu(c.t) ? '<button class="cv-btn" id="cvCode">&lt;/&gt; ویرایش کد آردوینو</button>' : '') +
        (d.push ? '<button class="cv-btn" id="cvPush">نگه دار تا کلید فشرده شود</button>' : '') +
        (d.sw && !d.push ? `<button class="cv-btn" id="cvSw">${c.on ? 'کلید بسته است — باز کن' : 'کلید باز است — ببند'}</button>` : '') +
        `<div class="cv-pins">پایه‌ها: ${d.pins.map(p => esc(p[2])).join(' • ')}</div>`;
      const bind = (id,prop) => {
        const el = propsEl.querySelector('#'+id); if(!el) return;
        el.addEventListener('focus', () => { el._prev = JSON.stringify(S); });
        el.addEventListener('input', () => {
          if(el._prev){ pushUndo(el._prev); el._prev = null; }
          c[prop] = el.value; save(); render();
        });
      };
      bind('cvRef','ref'); bind('cvVal','val');
      const sw = propsEl.querySelector('#cvSw');
      if(sw) sw.addEventListener('click', () => toggleSw(c));
      const cb = propsEl.querySelector('#cvCode');
      if(cb) cb.addEventListener('click', () => openCode(c));
      const pb = propsEl.querySelector('#cvPush');
      if(pb){
        const rel = () => { window.removeEventListener('pointerup', rel); window.removeEventListener('pointercancel', rel); if(c.on){ c.on = false; render(); } };
        pb.addEventListener('pointerdown', e => { e.preventDefault(); if(c.on) return; c.on = true; render(); window.addEventListener('pointerup', rel); window.addEventListener('pointercancel', rel); });
      }
      return;
    }
    if(total === 1){
      propsEl.innerHTML = '<div class="cv-props-title">سیم</div><div class="cv-props-empty">همهٔ سیم‌های هم‌پتانسیل (یک گره) با رنگ زرد روشن شده‌اند.</div>';
      return;
    }
    propsEl.innerHTML = `<div class="cv-props-title">${total.toLocaleString('fa')} مورد انتخاب شده</div><div class="cv-props-empty">می‌توانی همه را با هم بکشی، بچرخانی یا حذف کنی.</div>`;
  }
  function sync(){ render(); renderProps(); }
  function toggleSw(c){ pushUndo(); c.on = !c.on; save(); sync(); }

  function setTool(t, type){
    if(wireStart && t !== 'wire') wireStart = null;
    tool = t; placeType = t === 'place' ? type : null;
    root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    root.querySelectorAll('.cv-pal-item').forEach(b => b.classList.toggle('on', t === 'place' && b.dataset.type === type));
    stage.className = 'cv-stage t-' + t;
    hintEl.textContent = HINTS[t];
    render();
  }

  function placeAt(sp){
    pushUndo();
    S.comps.push(newComp(placeType, sp.x, sp.y, placeRot));
    save(); render();
  }
  function deleteSel(){
    if(!sel.size) return;
    pushUndo();
    S.comps = S.comps.filter(c => !sel.has('c'+c.id));
    S.wires = S.wires.filter(w => !sel.has('w'+w.id));
    sel.clear(); save(); sync();
  }
  function rotateSel(){
    if(tool === 'place'){ placeRot = (placeRot+1)&3; render(); return; }
    const comps = S.comps.filter(c => sel.has('c'+c.id));
    if(!comps.length) return;
    pushUndo();
    const moves = new Map();
    comps.forEach(c => {
      const o = pinsOf(c); c.r = (c.r+1)&3; const n = pinsOf(c);
      o.forEach((p,i) => moves.set(key(p.x,p.y), n[i]));
    });
    S.wires.forEach(w => {
      const a = moves.get(key(w.x1,w.y1)), b = moves.get(key(w.x2,w.y2));
      if(a){ w.x1 = a.x; w.y1 = a.y; }
      if(b){ w.x2 = b.x; w.y2 = b.y; }
    });
    save(); render();
  }

  function startMove(w){
    const M = new Set();
    S.comps.forEach(c => { if(sel.has('c'+c.id)) pinsOf(c).forEach(p => M.add(key(p.x,p.y))); });
    S.wires.forEach(x => { if(sel.has('w'+x.id)){ M.add(key(x.x1,x.y1)); M.add(key(x.x2,x.y2)); } });
    drag = {kind:'move', start:{x:snap(w.x), y:snap(w.y)}, orig:JSON.stringify(S), M, moved:false};
  }
  function applyMove(dx,dy){
    const d = drag;
    if(!d.moved){ pushUndo(d.orig); d.moved = true; }
    S = JSON.parse(d.orig);
    S.comps.forEach(c => { if(sel.has('c'+c.id)){ c.x += dx; c.y += dy; } });
    S.wires.forEach(w => {
      const s = sel.has('w'+w.id);
      if(s || d.M.has(key(w.x1,w.y1))){ w.x1 += dx; w.y1 += dy; }
      if(s || d.M.has(key(w.x2,w.y2))){ w.x2 += dx; w.y2 += dy; }
    });
  }
  function boxSelect(a,b,add){
    const x0 = Math.min(a.x,b.x), x1 = Math.max(a.x,b.x), y0 = Math.min(a.y,b.y), y1 = Math.max(a.y,b.y);
    const hit = (bx0,by0,bx1,by1) => bx1 >= x0 && bx0 <= x1 && by1 >= y0 && by0 <= y1;
    if(!add) sel.clear();
    S.comps.forEach(c => { const q = bboxOf(c); if(hit(q.x0,q.y0,q.x1,q.y1)) sel.add('c'+c.id); });
    S.wires.forEach(w => { if(hit(Math.min(w.x1,w.x2),Math.min(w.y1,w.y2),Math.max(w.x1,w.x2),Math.max(w.y1,w.y2))) sel.add('w'+w.id); });
  }

  function onDown(e){
    try{ svg.setPointerCapture(e.pointerId); }catch(_){}
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(pointers.size === 2){ beginPinch(); return; }
    if(pointers.size > 2) return;
    const w = toWorld(e), sp = {x:snap(w.x), y:snap(w.y)};
    cursor = sp;
    if(e.button === 2) return;
    if((codePanel || eachCfg) && e.button !== 1 && !spaceDown && tool !== 'wire' && tool !== 'place'){
      const cu = chipAt(w);
      if(cu){ drag = null; sel.clear(); sel.add('c' + cu.id); renderProps(); render(); openCode(cu); return; }
    }
    if(e.button === 1 || tool === 'pan' || spaceDown){
      drag = {kind:'pan', sx:e.clientX, sy:e.clientY, vx:view.x, vy:view.y};
      stage.classList.add('panning'); return;
    }
    if(tool === 'place'){ placeAt(sp); return; }
    if(tool === 'wire'){
      if(!wireStart){ wireStart = sp; drag = {kind:'wire'}; render(); }
      else commitWire(sp, false);
      return;
    }
    const hit = hitTest(w);
    if(hit){
      const k = hit.k + hit.id;
      if(e.shiftKey){ if(sel.has(k)) sel.delete(k); else sel.add(k); }
      else if(!sel.has(k)){ sel.clear(); sel.add(k); }
      renderProps();
      if(sel.has(k)) startMove(w);
      render();
    } else {
      if(!e.shiftKey) sel.clear();
      drag = {kind:'box', start:w, cur:w, add:e.shiftKey};
      renderProps(); render();
    }
  }
  function onMove(e){
    if(pointers.has(e.pointerId)) pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(pinch){ movePinch(); return; }
    const w = toWorld(e), sp = {x:snap(w.x), y:snap(w.y)};
    coordEl.textContent = `X ${sp.x}  Y ${sp.y}`;
    const moved = sp.x !== cursor.x || sp.y !== cursor.y;
    cursor = sp;
    if(drag){
      if(drag.kind === 'pan'){ view.x = drag.vx + e.clientX - drag.sx; view.y = drag.vy + e.clientY - drag.sy; render(); return; }
      if(drag.kind === 'move'){
        const dx = sp.x - drag.start.x, dy = sp.y - drag.start.y;
        if(dx || dy || drag.moved){ applyMove(dx,dy); render(); }
        return;
      }
      if(drag.kind === 'box'){ drag.cur = w; render(); return; }
    }
    if(moved && (tool === 'wire' || tool === 'place')) render();
  }
  function onUp(e){
    pointers.delete(e.pointerId);
    if(pinch){ if(pointers.size < 2) pinch = null; drag = null; return; }
    const w = toWorld(e), sp = {x:snap(w.x), y:snap(w.y)};
    const d = drag; drag = null;
    stage.classList.remove('panning');
    if(!d) return;
    if(d.kind === 'move'){ if(d.moved) save(); sync(); return; }
    if(d.kind === 'box'){ boxSelect(d.start, w, d.add); sync(); return; }
    if(d.kind === 'wire' && wireStart && (Math.abs(sp.x-wireStart.x) >= G || Math.abs(sp.y-wireStart.y) >= G)) commitWire(sp, true);
  }
  function onCancel(e){
    pointers.delete(e.pointerId);
    if(drag && drag.kind === 'move' && drag.moved){ S = JSON.parse(drag.orig); undoStack.pop(); }
    drag = null; pinch = null; stage.classList.remove('panning'); sync();
  }

  function beginPinch(){
    if(drag && drag.kind === 'move' && drag.moved){ S = JSON.parse(drag.orig); undoStack.pop(); }
    drag = null;
    const [a,b] = [...pointers.values()];
    const r = svg.getBoundingClientRect();
    pinch = {d0:Math.hypot(a.x-b.x,a.y-b.y) || 1, z0:view.z, m0:{x:(a.x+b.x)/2 - r.left, y:(a.y+b.y)/2 - r.top}, v0:{x:view.x, y:view.y}};
  }
  function movePinch(){
    const pts = [...pointers.values()]; if(pts.length < 2) return;
    const [a,b] = pts, r = svg.getBoundingClientRect();
    const m = {x:(a.x+b.x)/2 - r.left, y:(a.y+b.y)/2 - r.top};
    const nz = clamp(pinch.z0 * Math.hypot(a.x-b.x,a.y-b.y) / pinch.d0, 0.25, 4);
    const wx = (pinch.m0.x - pinch.v0.x) / pinch.z0, wy = (pinch.m0.y - pinch.v0.y) / pinch.z0;
    view.z = nz; view.x = m.x - wx*nz; view.y = m.y - wy*nz;
    render();
  }
  function zoomAt(cx,cy,f){
    const nz = clamp(view.z*f, 0.25, 4);
    view.x = cx - (cx - view.x) * (nz / view.z);
    view.y = cy - (cy - view.y) * (nz / view.z);
    view.z = nz; render();
  }
  function contentBox(pad){
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    S.comps.forEach(c => { const b = bboxOf(c); x0 = Math.min(x0,b.x0-pad); y0 = Math.min(y0,b.y0-pad-4); x1 = Math.max(x1,b.x1+pad+30); y1 = Math.max(y1,b.y1+pad+4); });
    S.wires.forEach(w => { x0 = Math.min(x0,w.x1-pad,w.x2-pad); y0 = Math.min(y0,w.y1-pad,w.y2-pad); x1 = Math.max(x1,w.x1+pad,w.x2+pad); y1 = Math.max(y1,w.y1+pad,w.y2+pad); });
    return x0 === Infinity ? null : {x0,y0,x1,y1};
  }
  function fitView(){
    const r = svg.getBoundingClientRect();
    if(!r.width) return;
    const H = r.height;
    const b = contentBox(20);
    if(!b){ view = {x:r.width/2, y:H/2, z:mission ? 0.8 : 1}; render(); return; }
    const w = b.x1-b.x0, h = b.y1-b.y0;
    const z = clamp(Math.min((r.width-40)/w, (H-40)/h), 0.25, 2);
    view = {z, x:(r.width - w*z)/2 - b.x0*z, y:(H - h*z)/2 - b.y0*z};
    render();
  }
  /* ---- طراحی آزاد: هر Uno ادیتور کد و پایه‌های خودش را دارد (کلید = c.cid؛ با حذف Uno ادیتورش هم از بین می‌رود) ---- */
  const pinName = p => /^A\d$/.test(String(p)) ? String(p) : (p >= 14 && p <= 19 ? 'A' + (p - 14) : 'D' + p);
  const hiList = u => { const m = u && pinsBy.get(u.cid); return m ? Object.keys(m).filter(k => m[k]) : []; };
  const repaint = () => { if(!eachRaf) eachRaf = requestAnimationFrame(() => { eachRaf = 0; if(!stopped) render(); }); };
  function makeDock(c){
    const cid = c.cid;
    return createUnoDock(wrap, eachCfg, {
      onPin(p, v){ const m = pinsBy.get(cid) || {}; m[pinName(p)] = v ? 1 : 0; pinsBy.set(cid, m); repaint(); },
      onPinsReset(){ pinsBy.set(cid, {}); repaint(); },
      onRunState(r){ runBy.set(cid, !!r); repaint(); },
      onSuccess(){},
      closed(){ setCodeMode(false); }      // «⚡ مدار» = برگشت به حالت مدار
    }, c.ref, c, root.querySelector('.cv-side'));
  }
  let codeMode = false;      // حالت کدنویسی: ستون سمت راست جای ابزار/قطعات، ادیتورِ کدِ آردوینو را نشان می‌دهد و عریض‌تر می‌شود
  function setCodeMode(on){
    if(!eachCfg || codeMode === on) return;
    codeMode = on;
    wrap.classList.toggle('code-on', on);
    if(!on) docks.forEach(d => d.close());
  }
  function syncDocks(){
    const live = new Set();
    S.comps.forEach(c => { if(isMcu(c.t) && c.cid && !live.has(c.cid)){ live.add(c.cid); if(!docks.has(c.cid)) docks.set(c.cid, makeDock(c)); } });
    [...docks.keys()].forEach(k => { if(!live.has(k)){ docks.get(k).destroy(); docks.delete(k); pinsBy.delete(k); runBy.delete(k); } });
    if(codeMode && ![...docks.values()].some(d => d.isOpen())) setCodeMode(false);      // Unoی در حال ویرایش حذف شد
  }
  function setUnoMaps(forExport){      // نقشهٔ «پایه‌های HIGH» و «نشان کد» برای هر Uno؛ بیرون از حالت طراحی آزاد باید null باشد (متغیرها بین ادیتورها مشترک‌اند)
    if(!eachCfg){ unoHiBy = null; unoChipBy = null; return; }
    if(!forExport) syncDocks();
    unoHiBy = new Map(); unoChipBy = new Map();
    S.comps.forEach(c => {
      if(!isMcu(c.t)) return;
      unoHiBy.set(c.id, hiList(c));
      if(!forExport) unoChipBy.set(c.id, runBy.get(c.cid) ? 'run' : 'idle');
    });
  }
  if(eachCfg) cleanup.push(() => { if(eachRaf) cancelAnimationFrame(eachRaf); docks.forEach(d => d.destroy()); docks.clear(); });
  function openCode(cu){
    if(codePanel){ codePanel.open(); return; }
    if(!eachCfg || !cu || !cu.cid) return;
    syncDocks();
    docks.forEach((d, k) => { if(k !== cu.cid) d.close(); });
    const d = docks.get(cu.cid); if(d){ d.open(); setCodeMode(true); }
  }
  // نشان «</> code» روی آردوینو (با چرخش قطعه هم درست کار می‌کند)
  function chipAt(w){
    if(!codePanel && !eachCfg) return null;
    return S.comps.find(c => {
      if(!isMcu(c.t)) return false;
      const cb = realOn ? MCU[c.t].chipReal : MCU[c.t].chip, a = rot(cb[0], cb[1], c.r), b = rot(cb[2], cb[3], c.r);
      return w.x >= c.x + Math.min(a[0], b[0]) && w.x <= c.x + Math.max(a[0], b[0]) && w.y >= c.y + Math.min(a[1], b[1]) && w.y <= c.y + Math.max(a[1], b[1]);
    }) || null;
  }

  function download(name, blob){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function buildSvg(){
    const b = contentBox(30);
    if(!b) return null;
    const A = analyze();
    unoHiNow = A.hasUno && ext ? A.hi : null;
    unoChipNow = null;     // نشان کد فقط روی صفحه است، نه در خروجی
    setUnoMaps(true);
    let body = '';
    S.wires.forEach(w => { body += `<line class="w" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}"/>`; });
    S.comps.forEach(c => {
      const d = DEFS[c.t], st = A.status.get(c.id);
      body += `<g transform="translate(${c.x} ${c.y}) rotate(${(c.r&3)*90})">${st === 'on' && d.lit ? d.lit : ''}${drawOf(c,d)}</g>` +
        labelsOf(c).replace(/cv-ref/g,'r').replace(/cv-val/g,'v');
    });
    endCounts().forEach((o,k) => { const [x,y] = k.split(','); if(o.w+o.p >= 3 && o.w >= 1) body += `<circle class="j" cx="${x}" cy="${y}" r="4"/>`; });
    const W = b.x1-b.x0, H = b.y1-b.y0;
    return {W, H, text:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x0} ${b.y0} ${W} ${H}" width="${W}" height="${H}"><style>${EXPORT_CSS}</style><rect x="${b.x0}" y="${b.y0}" width="${W}" height="${H}" fill="#0c1018"/>${body}</svg>`};
  }
  function exportSvg(){
    const o = buildSvg(); if(!o) return;
    download('circuit.svg', new Blob([o.text], {type:'image/svg+xml'}));
  }
  function exportPng(){
    const o = buildSvg(); if(!o) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = o.W*2; cv.height = o.H*2;
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      cv.toBlob(b => { if(b) download('circuit.png', b); });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(o.text);
  }

  function menuAct(a){
    if(a === 'example'){
      if(S.comps.length && !confirm('مدار فعلی با مدار نمونه جایگزین شود؟')) return;
      pushUndo(); build(EXAMPLE); sel.clear(); save(); sync(); fitView();
    }
    else if(a === 'solution'){
      if(!opts.solution) return;
      if(S.comps.length && !confirm('مدار فعلی با پاسخ جایگزین شود؟')) return;
      pushUndo(); build(opts.solution); sel.clear(); save(); sync(); fitView();
    }
    else if(a === 'json') download('circuit.json', new Blob([JSON.stringify({v:2, comps:S.comps, wires:S.wires}, null, 1)], {type:'application/json'}));
    else if(a === 'import') $('cvFile').click();
    else if(a === 'svg') exportSvg();
    else if(a === 'png') exportPng();
    else if(a === 'clear'){
      if(!S.comps.length && !S.wires.length) return;
      if(!confirm('همهٔ مدار پاک شود؟')) return;
      pushUndo(); S = {comps:[], wires:[], seq:1}; sel.clear(); save(); sync();
    }
  }

  function realThumb(t, d){      // آیکن واقعی قطعه برای نوار قطعات (بدون نشان «</> code» روی Uno)
    const keep = unoChipNow; unoChipNow = null;
    try{ return REAL[t]({t, r:0, val:d.val, on:false}, '', uid); } finally { unoChipNow = keep; }
  }
  function buildPalette(){
    let h = '';
    GROUPS.forEach(g => {
      const types = g[1].filter(t => !allowed || allowed.has(t));
      if(!types.length) return;
      h += `<div class="cv-pal-title">${g[0]}</div><div class="cv-pal-grid">`;
      types.forEach(t => {
        const d = DEFS[t];
        h += `<button class="cv-pal-item" data-type="${t}" title="${esc(d.fa)}"><svg viewBox="-48 -48 96 96" class="cv-sym">${realOn && REAL[t] ? realThumb(t, d) : (d.pv || '') + (d.pal || drawOf({on:false}, d))}</svg><span>${esc(d.fa)}</span></button>`;
      });
      h += '</div>';
    });
    $('cvPalette').innerHTML = h;
    if(realOn) root.querySelectorAll('#cvPalette .cv-sym').forEach(s => {
      try{ const b = s.getBBox(), m = Math.max(b.width, b.height) + 8; if(m > 8) s.setAttribute('viewBox', `${b.x + b.width/2 - m/2} ${b.y + b.height/2 - m/2} ${m} ${m}`); }catch(_){}
    });
    root.querySelectorAll('.cv-pal-item').forEach(b => b.classList.toggle('on', tool === 'place' && b.dataset.type === placeType));
  }

  on(svg, 'pointerdown', onDown);
  on(svg, 'pointermove', onMove);
  on(svg, 'pointerup', onUp);
  on(svg, 'pointercancel', onCancel);
  on(svg, 'contextmenu', e => {
    e.preventDefault();
    if(wireStart){ wireStart = null; render(); }
    else if(tool === 'place') setTool('pan');
  });
  on(svg, 'wheel', e => {
    e.preventDefault();
    const p = toLocal(e);
    zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
  }, {passive:false});
  on(svg, 'dblclick', e => {
    if((codePanel || eachCfg) && tool !== 'wire' && tool !== 'place'){      // دوبار کلیک روی آردوینو = باز شدن ویرایشگر کد
      const h0 = hitTest(toWorld(e)), c0 = h0 && h0.k === 'c' && S.comps.find(x => x.id === h0.id);
      if(c0 && isMcu(c0.t)){ sel.clear(); sel.add('c' + c0.id); renderProps(); render(); openCode(c0); return; }
    }
    if(tool !== 'select') return;
    const h = hitTest(toWorld(e));
    if(!h || h.k !== 'c') return;
    const c = S.comps.find(x => x.id === h.id);
    if(c && DEFS[c.t].push){ c.on = true; render(); setTimeout(() => { c.on = false; if(!stopped) render(); }, 350); return; }
    if(c && DEFS[c.t].sw){ toggleSw(c); return; }
    const el = propsEl.querySelector('#cvVal') || propsEl.querySelector('#cvRef');
    if(el){ el.focus(); el.select(); }
  });

  root.querySelectorAll('[data-tool]').forEach(b => on(b, 'click', () => { if(typeof SFX !== 'undefined') SFX.click(); setTool(b.dataset.tool); }));
  on($('cvRotate'), 'click', rotateSel);
  on($('cvDelete'), 'click', deleteSel);
  on(undoBtn, 'click', undo);
  on(redoBtn, 'click', redo);
  on($('cvZoomIn'), 'click', () => { const r = svg.getBoundingClientRect(); zoomAt(r.width/2, r.height/2, 1.25); });
  on($('cvZoomOut'), 'click', () => { const r = svg.getBoundingClientRect(); zoomAt(r.width/2, r.height/2, 0.8); });
  on($('cvFit'), 'click', fitView);
  ['pointerenter', 'focus', 'touchstart'].forEach(ev => on($('cv3d'), ev, () => { if(window.Circuit3D && Circuit3D.preload) Circuit3D.preload(); }, {passive:true}));
  on($('cv3d'), 'click', () => {
    if(typeof SFX !== 'undefined') SFX.click();
    if(!window.Circuit3D) return;
    const p = getPcb();
    Circuit3D.open(p ? p.get3D() : get3DData());
  });
  root.querySelectorAll('[data-vw]').forEach(b => on(b, 'click', () => setView(b.dataset.vw)));
  on($('cvMenuBtn'), 'click', e => { e.stopPropagation(); $('cvMenu').classList.toggle('open'); });
  on($('cvMenu'), 'click', e => {
    const b = e.target.closest('button'); if(!b) return;
    $('cvMenu').classList.remove('open'); menuAct(b.dataset.act);
  });
  on(document, 'click', () => $('cvMenu').classList.remove('open'));
  on($('cvFile'), 'change', e => {
    const f = e.target.files[0]; e.target.value = '';
    if(!f || f.size > 2e6) return;
    const rd = new FileReader();
    rd.onload = () => {
      try{
        const d = sanitize(JSON.parse(rd.result));
        if(!d) throw 0;
        pushUndo(); S = d; sel.clear(); save(); sync(); fitView();
      }catch(_){ alert('فایل JSON معتبر نیست.'); }
    };
    rd.readAsText(f);
  });
  on($('cvPalette'), 'click', e => {
    const b = e.target.closest('.cv-pal-item'); if(!b) return;
    if(typeof SFX !== 'undefined') SFX.click();
    sel.clear(); placeRot = 0; setTool('place', b.dataset.type); renderProps();
  });

  on(document, 'pointerdown', e => { focusIn = root.contains(e.target); }, true);
  on(document, 'keydown', e => {
    if(!isActive() || !focusIn || wrap.classList.contains('pcb-on')) return;
    const tg = e.target && e.target.tagName;
    if(tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT'){ if(e.code === 'Escape') e.target.blur(); return; }
    const ctrl = e.ctrlKey || e.metaKey;
    if(e.code === 'Space'){ spaceDown = true; e.preventDefault(); return; }
    if(ctrl && e.code === 'KeyZ'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if(ctrl && e.code === 'KeyY'){ e.preventDefault(); redo(); return; }
    if(ctrl && e.code === 'KeyA'){ e.preventDefault(); S.comps.forEach(c => sel.add('c'+c.id)); S.wires.forEach(w => sel.add('w'+w.id)); sync(); return; }
    if(ctrl) return;
    if(e.code === 'KeyV') setTool('select');
    else if(e.code === 'KeyX') setTool('wire');
    else if(e.code === 'KeyH') setTool('pan');
    else if(e.code === 'KeyR'){ e.preventDefault(); rotateSel(); }
    else if(e.code === 'Delete' || e.code === 'Backspace'){ e.preventDefault(); deleteSel(); }
    else if(e.code === 'Enter' && wireStart){ wireStart = null; render(); }
    else if(e.code === 'Escape'){
      if(wireStart){ wireStart = null; render(); }
      else if(tool === 'place' || tool === 'wire') setTool('pan');
      else if(sel.size){ sel.clear(); sync(); }
    }
  });
  on(document, 'keyup', e => { if(e.code === 'Space') spaceDown = false; });

  if(window.ResizeObserver){
    const ro = new ResizeObserver(() => {
      wrap.classList.toggle('narrow', wrap.clientWidth < 720);
      if(isActive()) render();
    });
    ro.observe(wrap); ro.observe(stage);
    cleanup.push(() => ro.disconnect());
  }

  let lastPh = -1;
  const phTimer = setInterval(() => {
    if(stopped || drag || ext || !isActive() || !S.comps.some(c => isMcu(c.t))) return;
    const ph = unoPhase();
    if(ph !== lastPh){ lastPh = ph; render(); }
  }, 150);
  cleanup.push(() => clearInterval(phTimer));

  if(codeCfg){
    const pushPins = () => { if(!pinsRaf) pinsRaf = requestAnimationFrame(() => { pinsRaf = 0; ext = Object.assign({}, pinsState); if(!stopped) render(); }); };
    codePanel = createUnoDock(wrap, codeCfg, {
      onPin(p, v){ pinsState['D' + p] = v ? 1 : 0; pushPins(); },     // کدِ ادیتور پایه‌های آردوینوی داخل مدار را می‌راند
      onPinsReset(){ pinsState = {}; pushPins(); },
      onRunState(r){ codeRunning = !!r; if(!stopped) render(); },
      onSuccess(){ codeOk = true; if(!stopped) render(); }
    });
    cleanup.push(() => { if(pinsRaf) cancelAnimationFrame(pinsRaf); codePanel.destroy(); });
  }

  buildPalette();
  load();
  setTool('pan');
  renderProps();

  return {
    onShow(){ if(!fitted){ fitted = true; fitView(); } else render(); },
    stop(){ stopped = true; if(pcb) pcb.destroy(); if(saveTimer) saveNow(); cleanup.forEach(f => f()); },
    _state(){ return S; },
    _view(){ return view; },
    _3d(){ return get3DData(); },
    setUnoPins(m){ ext = Object.assign({}, m || {}); if(!stopped) render(); }   // کدِ دانش‌آموز: { D12:1, D11:0, … }
  };
}

const mainRoot = document.getElementById('circuitTab');
const main = mainRoot ? create(mainRoot, {storageKey:MAIN_KEY}) : null;
if(mainRoot){
  mainRoot.insertAdjacentHTML('afterbegin', '<div class="cdz-bar"><b>طراحی آزاد مدار</b><span class="cdz-sub">همهٔ قطعه‌ها در دسترس است · طرح شما خودکار ذخیره می‌شود</span><button type="button" class="cv-btn" data-new>طرح جدید (صفحهٔ خالی)</button></div>');
  mainRoot.querySelector('[data-new]').addEventListener('click', () => { const c = mainRoot.querySelector('[data-act="clear"]'); if(c) c.click(); });
}
window.CircuitEditor = {
  create,
  onShow(){ if(main) main.onShow(); },
  _state(){ return main && main._state(); },
  _view(){ return main && main._view(); },
  _3d(){ return main && main._3d(); }
};
})();
