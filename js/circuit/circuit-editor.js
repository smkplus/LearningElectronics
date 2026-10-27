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
  '<path class="b t" d="M-4 -16L6 -28M4 -12L14 -24"/>' + arrow(6,-28,10,-12,6,3) + arrow(14,-24,10,-12,6,3);
const LED_LIT = col => `<path d="M-10 -12L10 0L-10 12Z" fill="${col}" opacity=".95"/>`;
const ledDef = (fa,val,col) => ({fa,pre:'D',val,lab:'two',pins:[[-40,0,'A'],[40,0,'K']],box:[-40,-32,40,14],
  draw:LED_DRAW, lit:LED_LIT(col), glow:col, pv:LED_LIT(col), edge:'led'});

const DEFS = {
  R:{fa:'مقاومت',pre:'R',val:'1kΩ',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-10,40,10],edge:'load',
    draw:'<path class="b" d="M-40 0H-20M20 0H40"/><rect class="b" x="-20" y="-8" width="40" height="16"/>'},
  C:{fa:'خازن',pre:'C',val:'100nF',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-16,40,16],
    draw:'<path class="b" d="M-40 0H-4M4 0H40M-4 -14V14M4 -14V14"/>'},
  CP:{fa:'خازن الکترولیتی',pre:'C',val:'100µF',lab:'two',pins:[[-40,0,'+'],[40,0,'−']],box:[-40,-16,40,16],
    draw:'<path class="b" d="M-40 0H-4M7 0H40M-4 -14V14"/><path class="b" d="M11 -14Q4 0 11 14"/><path class="b t" d="M-20 -10h8M-16 -14v8"/>'},
  L:{fa:'سلف',pre:'L',val:'10mH',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-10,40,4],edge:'wire',
    draw:'<path class="b" d="M-40 0H-24a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0H40"/>'},
  POT:{fa:'پتانسیومتر',pre:'RV',val:'10kΩ',lab:'two',pins:[[-40,0,'1'],[40,0,'3'],[0,-40,'2']],box:[-40,-40,40,10],edge:'load',
    draw:'<path class="b" d="M-40 0H-20M20 0H40"/><rect class="b" x="-20" y="-8" width="40" height="16"/><path class="b" d="M0 -40V-16"/>' + arrow(0,-8,0,1)},
  D:{fa:'دیود',pre:'D',val:'1N4148',lab:'two',pins:[[-40,0,'A'],[40,0,'K']],box:[-40,-14,40,14],edge:'diode',
    draw:'<path class="b" d="M-40 0H-10M10 0H40M10 -12V12"/><path class="b" d="M-10 -12L10 0L-10 12Z"/>'},
  LED:ledDef('LED قرمز','RED','#ff5b5b'),
  LEDY:ledDef('LED زرد','YELLOW','#ffd23f'),
  LEDG:ledDef('LED سبز','GREEN','#3ddc84'),
  NPN:{fa:'ترانزیستور NPN',pre:'Q',val:'2N3904',lab:'two',side:true,pins:[[-40,0,'B'],[20,-40,'C'],[20,40,'E']],box:[-40,-40,34,40],draw:bjt(false)},
  PNP:{fa:'ترانزیستور PNP',pre:'Q',val:'2N3906',lab:'two',side:true,pins:[[-40,0,'B'],[20,-40,'C'],[20,40,'E']],box:[-40,-40,34,40],draw:bjt(true)},
  OPAMP:{fa:'آپ‌امپ',pre:'U',val:'LM358',lab:'two',side:true,pins:[[-40,-20,'−'],[-40,20,'+'],[40,0,'OUT']],box:[-40,-40,40,40],
    draw:'<path class="b" d="M-40 -20H-30M-40 20H-30M30 0H40"/><path class="b" d="M-30 -40L30 0L-30 40Z"/><path class="b t" d="M-26 -20h8M-26 20h8M-22 16v8"/>'},
  BT:{fa:'باتری ۹ ولت',pre:'BT',val:'9V',lab:'two',pins:[[-40,0,'+'],[40,0,'−']],box:[-40,-18,40,18],
    draw:'<path class="b" d="M-40 0H-6M6 0H40M-6 -16V16M6 -8V8"/><path class="b t" d="M-22 -10h8M-18 -14v8"/>'},
  BC:{fa:'کانکتور باتری ۹ ولت',pre:'J',val:'9V',lab:'two',side:true,link:[[0,2],[1,3]],
    pins:[[-40,-20,'باتری +'],[-40,20,'باتری −'],[40,-20,'سیم قرمز +'],[40,20,'سیم مشکی −']],box:[-40,-34,40,34],
    draw:'<path class="b" d="M-40 -20H-14M-40 20H-14"/><path class="b red" d="M14 -20H40"/><path class="b gry" d="M14 20H40"/>' +
      '<rect class="b" x="-14" y="-32" width="28" height="64" rx="4"/><path class="b t" d="M-14 -20H14M-14 20H14"/>' +
      '<circle class="f" cx="-8" cy="-20" r="2.5"/><circle class="f" cx="-8" cy="20" r="2.5"/><path class="b t" d="M-34 -28h6M-31 -31v6M-34 28h6"/>'},
  SW:{fa:'کلید',pre:'SW',val:'SW',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-18,40,6],edge:'wire',sw:true,
    draw:c => '<path class="b" d="M-40 0H-20M20 0H40"/>' + (c && c.on ? '<path class="b" d="M-20 0H20"/>' : '<path class="b" d="M-20 0L18 -14"/>') +
      '<circle class="b" cx="-20" cy="0" r="2.5"/><circle class="b" cx="20" cy="0" r="2.5"/>'},
  LAMP:{fa:'لامپ',pre:'LA',val:'6V',lab:'two',pins:[[-40,0,'1'],[40,0,'2']],box:[-40,-16,40,16],edge:'load',
    draw:'<path class="b" d="M-40 0H-16M16 0H40"/><circle class="b" r="16"/><path class="b" d="M-11.3 -11.3L11.3 11.3M-11.3 11.3L11.3 -11.3"/>',
    lit:'<circle r="15" fill="#ffd95a" opacity=".92"/>', glow:'#ffd95a'},
  VCC:{fa:'تغذیه (VCC)',pre:'',val:'VCC',lab:'top',power:true,pins:[[0,0,'VCC']],box:[-10,-30,10,0],
    draw:'<path class="b" d="M0 0V-28M-9 -14L0 -28L9 -14"/>'},

  GND:{fa:'زمین (GND)',pre:'',val:'GND',lab:'top',power:true,pins:[[0,0,'GND']],box:[-14,-30,14,0],
    draw:'<path class="b" d="M0 0V-14M-12 -14H12L0 -28Z"/>'}
};
const drawOf = (c,d) => typeof d.draw === 'function' ? d.draw(c) : d.draw;
const GROUPS = [
  ['قطعات پایه', ['R','C','CP','L','POT']],
  ['نیمه‌هادی', ['D','LED','LEDY','LEDG','NPN','PNP','OPAMP']],
  ['منبع و کلید', ['BT','BC','SW','LAMP','VCC','GND']]
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

function create(root, opts){
  opts = opts || {};
  const uid = 'cv' + (++uidSeq);
  const allowed = opts.palette ? new Set(opts.palette) : null;
  const mission = !!opts.tasks;
  const isActive = opts.isActive || (() => root.classList.contains('active'));

  let S = {comps:[], wires:[], seq:1};
  let sel = new Set();
  let tool = 'pan', placeType = null, placeRot = 0;
  let view = {x:0, y:0, z:1};
  let cursor = {x:0, y:0};
  let wireStart = null, drag = null, spaceDown = false, pinch = null, fitted = false, focusIn = false, succeeded = !!opts.alreadyDone;
  let undoStack = [], redoStack = [], lastTaskSig = '', saveTimer = null, stopped = false;
  const pointers = new Map();
  const cleanup = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanup.push(() => t.removeEventListener(ev, fn, o)); };

  const glowDefs = Object.keys(GLOWS).map(c => `<radialGradient id="${uid}-gl${GLOWS[c]}"><stop offset="0" stop-color="${c}" stop-opacity=".65"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
  const menu = mission
    ? '<button data-act="solution">نمایش پاسخ</button><button data-act="clear" class="danger">پاک‌کردن همه</button>'
    : '<button data-act="example">مدار نمونه (LED)</button><button data-act="json">ذخیره به‌صورت JSON</button><button data-act="import">بارگذاری JSON</button><button data-act="svg">خروجی SVG</button><button data-act="png">خروجی PNG</button><button data-act="clear" class="danger">پاک‌کردن همه</button>';

  root.innerHTML = `
<div class="cv-wrap${mission ? ' cv-mission' : ''}">
  ${opts.note ? `<div class="sim-hw-note">${opts.note}</div>` : ''}
  <div class="cv-toolbar">
    ${'<div class="cv-group cv-seg"><button class="cv-btn on" data-vw="sch">شماتیک</button><button class="cv-btn" data-vw="pcb">PCB / فوت‌پرینت</button></div>'}
    <div class="cv-group cv-sch-only">
      <button class="cv-btn" data-tool="select" title="انتخاب (V)">انتخاب</button>
      <button class="cv-btn" data-tool="wire" title="سیم‌کشی (W)">سیم‌کشی</button>
      <button class="cv-btn" data-tool="pan" title="جابه‌جایی صفحه (H)">دست</button>
    </div>
    <div class="cv-group cv-sch-only">
      <button class="cv-btn" id="cvRotate" title="چرخش (R)">چرخش</button>
      <button class="cv-btn" id="cvDelete" title="حذف (Delete)">حذف</button>
      <button class="cv-btn cv-ico" id="cvUndo" title="واگرد (Ctrl+Z)" aria-label="واگرد"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5 4 9l4 4"/><path d="M4 9h10a6 6 0 0 1 0 12h-4"/></svg></button>
      <button class="cv-btn cv-ico" id="cvRedo" title="ازنو (Ctrl+Y)" aria-label="ازنو"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 5 4 4-4 4"/><path d="M20 9H10a6 6 0 0 0 0 12h4"/></svg></button>
    </div>
    <div class="cv-group">
      <button class="cv-btn cv-3d" id="cv3d" title="نمای ۳بعدی مدار (مثل KiCad)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg><span>۳بعدی</span></button>
    </div>
    <div class="cv-group cv-menu-wrap">
      <button class="cv-btn" id="cvMenuBtn">${mission ? 'گزینه‌ها ▾' : 'فایل ▾'}</button>
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
        <defs><pattern id="${uid}-grid" patternUnits="userSpaceOnUse" width="20" height="20"><circle cx="0" cy="0" r="1" class="cv-dot"/></pattern>${glowDefs}</defs>
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
  const wrap = root.querySelector('.cv-wrap');
  const svg = $('cvSvg'), world = $('cvWorld'), stage = $('cvStage'), gridPat = root.querySelector(`#${uid}-grid`), bg = $('cvBg');
  const propsEl = $('cvProps'), hintEl = $('cvHint'), coordEl = $('cvCoord'), zoomEl = $('cvZoomTxt'), savedEl = $('cvSaved');
  const msgEl = $('cvMsg'), tasksEl = $('cvTasks'), undoBtn = $('cvUndo'), redoBtn = $('cvRedo');

  function rot(x,y,r){ for(let i=0;i<(r&3);i++){ const t = x; x = -y; y = t; } return [x,y]; }
  function pinsOf(c){
    return DEFS[c.t].pins.map(p => { const q = rot(p[0],p[1],c.r); return {x:c.x+q[0], y:c.y+q[1], name:p[2]}; });
  }
  function bboxOf(c){
    const b = DEFS[c.t].box, xs = [], ys = [];
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
    return {id:S.seq++, t, x, y, r:r&3, ref:d.pre ? nextRef(d.pre) : '', val:d.val, on:false};
  }

  function toLocal(e){ const r = svg.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; }
  function toWorld(e){ const p = toLocal(e); return {x:(p.x - view.x) / view.z, y:(p.y - view.y) / view.z}; }

  function pushUndo(prev){
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
      localStorage.setItem(opts.storageKey, JSON.stringify({v:1, comps:S.comps, wires:S.wires, seq:S.seq}));
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
      out.comps.push({id:out.seq++, t:c.t, x, y, r:(Number(c.r)|0)&3, ref:String(c.ref||'').slice(0,12), val:String(c.val||'').slice(0,24), on:!!c.on});
    });
    d.wires.slice(0,5000).forEach(w => {
      if(!w) return;
      const a = [num(w.x1),num(w.y1),num(w.x2),num(w.y2)];
      if(a.some(v => v === null) || (a[0]===a[2] && a[1]===a[3])) return;
      out.wires.push({id:out.seq++, x1:a[0], y1:a[1], x2:a[2], y2:a[3]});
    });
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
    comps:[{t:'BT',x:-160,y:0,r:1,ref:'BT1'},{t:'R',x:-40,y:-40,ref:'R1',val:'330Ω'},{t:'LED',x:80,y:-40,ref:'D1'},{t:'GND',x:-20,y:40}],
    wires:[[-160,-40,-80,-40],[0,-40,40,-40],[120,-40,120,40],[120,40,-20,40],[-20,40,-160,40]]
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
    const hasBT = S.comps.some(c => c.t === 'BT');
    S.comps.forEach(c => {
      const d = DEFS[c.t];
      if(c.t === 'BT') sources.push({comp:c, pos:node(c,0), neg:node(c,1)});
      else if(c.t === 'BC' && !hasBT) sources.push({comp:c, pos:node(c,2), neg:node(c,3)});   // بدون باتری: خود کانکتور منبع است (قرمز +، مشکی −)
      else if(d.link) d.link.forEach(l => addE(node(c,l[0]), node(c,l[1]), c, 'wire', true));
      else if(d.edge === 'led' || d.edge === 'diode') addE(node(c,0), node(c,1), c, d.edge, false);
      else if(d.edge === 'load' || d.edge === 'wire'){
        if(d.sw && !c.on) return;
        addE(node(c,0), node(c,1), c, d.edge === 'load' ? 'load' : 'wire', true);
      }
    });
    if(gnd.length) Object.keys(vcc).forEach(v => sources.push({comp:null, pos:find(vcc[v]), neg:find(key(P.get(gnd[0].id)[0].x, P.get(gnd[0].id)[0].y))}));
    const rank = {on:1, burnt:2, short:3};
    const status = new Map();
    const mark = (c,s) => { if(!c) return; if(!status.get(c.id) || rank[s] > rank[status.get(c.id)]) status.set(c.id, s); };
    let shorted = false;
    sources.forEach(src => {
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
    const ofT = t => S.comps.filter(c => c.t === t);
    const A = {
      status, shorted,
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
        return {t:c.t, x:c.x, y:c.y, r:c.r, ref:c.ref || '', val:c.val || '', on:!!c.on, st:(A && A.status.get(c.id)) || '', power:!!d.power,
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
        return {id:c.id, t:c.t, r:c.r, ref:c.ref || '', val:c.val || '', on:!!c.on, st:(A && A.status.get(c.id)) || '', power:!!d.power, link:d.link || null,
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
    wrap.classList.toggle('pcb-on', v === 'pcb');
    root.querySelectorAll('[data-vw]').forEach(b => b.classList.toggle('on', b.dataset.vw === v));
    if(v === 'pcb') p.show(); else if(p) p.hide();
  }

  function labelsOf(c){
    const d = DEFS[c.t], b = bboxOf(c), cx = (b.x0+b.x1)/2, cy = (b.y0+b.y1)/2;
    const t = (x,y,anchor,cls,s) => s ? `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>` : '';
    if(d.lab === 'none') return '';
    if(d.lab === 'top') return t(cx, b.y0-5, 'middle', 'cv-val', c.val);
    const vert = (b.y1-b.y0) > (b.x1-b.x0) * 1.3;
    if(d.side || vert) return t(b.x1+8, cy-2, 'start', 'cv-ref', c.ref) + t(b.x1+8, cy+14, 'start', 'cv-val', c.val);
    return t(cx, b.y0-6, 'middle', 'cv-ref', c.ref) + t(cx, b.y1+14, 'middle', 'cv-val', c.val);
  }
  function compG(c, cls, st){
    const d = DEFS[c.t];
    const lit = st === 'on' && d.lit ? d.lit : '';
    const x = st === 'burnt' ? '<path class="cv-x" d="M-9 -9L9 9M9 -9L-9 9"/>' : '';
    const glow = st === 'on' && d.glow ? `<circle cx="${c.x}" cy="${c.y}" r="34" fill="url(#${uid}-gl${GLOWS[d.glow]})" pointer-events="none"/>` : '';
    return glow + `<g class="${cls}${st ? ' ' + st : ''}" transform="translate(${c.x} ${c.y}) rotate(${(c.r&3)*90})">${lit}${drawOf(c,d)}${x}</g>`;
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
    if(A.shorted){ msg = '⚠️ اتصال کوتاه! باتری بدون هیچ بار (مقاومت، لامپ…) بسته شده و سیم‌ها داغ می‌شوند.'; cls = 'bad'; }
    else if(A.burnt){ msg = '🔥 LED بدون مقاومتِ محدودکننده سوخت! یک مقاومت پشت‌سرِ LED بگذار.'; cls = 'bad'; }
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
      if(!msg && A.wired('BT','BC',true) && !A.wired('BT','BC')){ msg = '🔄 قطب‌های باتری برعکس به کانکتور وصل شده‌اند (+ باید به + برود).'; cls = 'bad'; }
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
    let h = '';
    S.wires.forEach(w => {
      const cls = 'cv-wire' + (sel.has('w'+w.id) ? ' sel' : '') + (hot.wires.has(w.id) ? ' hot' : '');
      h += `<line class="${cls}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}"/>`;
    });
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
      if(o.w + o.p >= 3 && o.w >= 1) h += `<circle class="cv-junc${hot.keys.has(k) ? ' hot' : ''}" cx="${x}" cy="${y}" r="4"/>`;
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
        (d.sw ? `<button class="cv-btn" id="cvSw">${c.on ? 'کلید بسته است — باز کن' : 'کلید باز است — ببند'}</button>` : '') +
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
    const b = contentBox(20);
    if(!b){ view = {x:r.width/2, y:r.height/2, z:mission ? 0.8 : 1}; render(); return; }
    const w = b.x1-b.x0, h = b.y1-b.y0;
    const z = clamp(Math.min((r.width-40)/w, (r.height-40)/h), 0.25, 2);
    view = {z, x:(r.width - w*z)/2 - b.x0*z, y:(r.height - h*z)/2 - b.y0*z};
    render();
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
    else if(a === 'json') download('circuit.json', new Blob([JSON.stringify({v:1, comps:S.comps, wires:S.wires}, null, 1)], {type:'application/json'}));
    else if(a === 'import') $('cvFile').click();
    else if(a === 'svg') exportSvg();
    else if(a === 'png') exportPng();
    else if(a === 'clear'){
      if(!S.comps.length && !S.wires.length) return;
      if(!confirm('همهٔ مدار پاک شود؟')) return;
      pushUndo(); S = {comps:[], wires:[], seq:1}; sel.clear(); save(); sync();
    }
  }

  function buildPalette(){
    let h = '';
    GROUPS.forEach(g => {
      const types = g[1].filter(t => !allowed || allowed.has(t));
      if(!types.length) return;
      h += `<div class="cv-pal-title">${g[0]}</div><div class="cv-pal-grid">`;
      types.forEach(t => {
        const d = DEFS[t];
        h += `<button class="cv-pal-item" data-type="${t}" title="${esc(d.fa)}"><svg viewBox="-48 -48 96 96" class="cv-sym">${d.pv || ''}${drawOf({on:false}, d)}</svg><span>${esc(d.fa)}</span></button>`;
      });
      h += '</div>';
    });
    $('cvPalette').innerHTML = h;
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
    if(tool !== 'select') return;
    const h = hitTest(toWorld(e));
    if(!h || h.k !== 'c') return;
    const c = S.comps.find(x => x.id === h.id);
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
    else if(e.code === 'KeyW') setTool('wire');
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

  buildPalette();
  load();
  setTool('pan');
  renderProps();

  return {
    onShow(){ if(!fitted){ fitted = true; fitView(); } else render(); },
    stop(){ stopped = true; if(pcb) pcb.destroy(); if(saveTimer) saveNow(); cleanup.forEach(f => f()); },
    _state(){ return S; },
    _view(){ return view; },
    _3d(){ return get3DData(); }
  };
}

const mainRoot = document.getElementById('circuitTab');
const main = mainRoot ? create(mainRoot, {storageKey:MAIN_KEY}) : null;
window.CircuitEditor = {
  create,
  onShow(){ if(main) main.onShow(); },
  _state(){ return main && main._state(); },
  _view(){ return main && main._view(); },
  _3d(){ return main && main._3d(); }
};
})();
