/* مأموریت‌های مداربندی — ادیتور شماتیک داخل مأموریت، با بررسی خودکار مدار */

const CKT_POWER = {   // فقط کانکتور باتری؛ سیم قرمز (+) و مشکی (−) منبع مدارند
  comps:[{t:'BC',x:-100,y:0,ref:'J1'}],
  wires:[]
};
const cktSolution = (comps, wires) => ({comps:CKT_POWER.comps.concat(comps), wires:CKT_POWER.wires.concat(wires)});

const cktPartsTask = (label, types) => ({label, test:A => types.every(t => A.count(t) >= 1)});

const CIRCUIT_MISSIONS = {
  led_circuit:{
    note:'هدف: کانکتور باتری ۹ ولتی (سیم قرمز + و مشکی −)، مقاومت و یک LED قرمز را بردار و مدار را ببند. LED بدون مقاومت می‌سوزد؛ پس یک مقاومت پشت‌سرش بگذار.',
    palette:['BC','R','LED'],
    tasks:[
      cktPartsTask('کانکتور باتری، مقاومت و LED قرمز را روی صفحه بگذار', ['BC','R','LED']),
      {label:'LED را با مقاومت پشت‌سرش وصل کن تا روشن شود (آند به سمت +)', test:A => A.lit('LED') >= 1 && A.burnt === 0}
    ],
    solution:cktSolution(
      [{t:'R',x:20,y:-60,ref:'R1',val:'330Ω'},{t:'LED',x:140,y:0,r:1,ref:'D1'}],
      [[-60,-20,-60,-60],[-60,-60,-20,-60],[60,-60,140,-60],[140,-60,140,-40],[140,40,140,60],[140,60,-60,60],[-60,60,-60,20]])
  },
  switch_lamp:{
    note:'هدف: یک کلید را سری با مقاومت و LED ببند. کلید در ابتدا باز است؛ روی آن دوبار بزن (یا از پنل کنارش) تا ببندی و چراغ روشن شود.',
    palette:['BC','R','LED','SW'],
    tasks:[
      cktPartsTask('کانکتور باتری، مقاومت، LED و کلید را روی صفحه بگذار', ['BC','R','LED','SW']),
      {label:'کلید را در مسیر مدار وصل کن و ببند تا LED روشن شود', test:A => A.lit('SW') >= 1 && A.lit('LED') >= 1 && A.burnt === 0}
    ],
    solution:cktSolution(
      [{t:'R',x:20,y:-60,ref:'R1',val:'330Ω'},{t:'SW',x:140,y:-60,ref:'SW1',on:true},{t:'LED',x:240,y:0,r:1,ref:'D1'}],
      [[-60,-20,-60,-60],[-60,-60,-20,-60],[60,-60,100,-60],[180,-60,240,-60],[240,-60,240,-40],[240,40,240,60],[240,60,-60,60],[-60,60,-60,20]])
  },
  traffic_light:{
    note:'هدف: سه LED قرمز، زرد و سبز را هرکدام با مقاومت خودش به کانکتور باتری ۹ ولتی وصل کن تا هر سه روشن شوند. کلید (SW) اختیاری است: روی آن دوبار بزن تا باز/بسته شود.',
    palette:['BC','R','LED','LEDY','LEDG','SW'],
    tasks:[
      cktPartsTask('کانکتور باتری و سه LED (قرمز، زرد، سبز) را روی صفحه بگذار', ['BC','LED','LEDY','LEDG']),
      {label:'هر LED یک مقاومت پشت‌سرش داشته باشد (هیچ LED نسوزد)', test:A => A.count('R') >= 3 && A.burnt === 0 && !A.shorted},
      {label:'هر سه چراغ هم‌زمان روشن شوند', test:A => A.lit('LED') >= 1 && A.lit('LEDY') >= 1 && A.lit('LEDG') >= 1}
    ],
    solution:cktSolution(
      [-60,0,60].reduce((a,y) => a.concat([
        {t:'R',x:120,y,val:'330Ω'},
        {t:y === -60 ? 'LED' : y === 0 ? 'LEDY' : 'LEDG',x:220,y}
      ]), []),
      [[-60,-20,60,-20],[60,-60,60,-20],[60,-20,60,0],[60,0,60,60],
       [60,-60,80,-60],[60,0,80,0],[60,60,80,60],
       [160,-60,180,-60],[160,0,180,0],[160,60,180,60],
       [260,-60,300,-60],[260,0,300,0],[260,60,300,60],
       [300,-60,300,0],[300,0,300,60],[300,60,300,100],[300,100,-60,100],[-60,100,-60,20]])
  }
};

function mountCircuitMission(container, id, { onSuccess, alreadyDone } = {}){
  const cfg = CIRCUIT_MISSIONS[id];
  const ed = CircuitEditor.create(container, {
    storageKey:'circuit-mission-' + id + '-v2',
    note:cfg.note, palette:cfg.palette, tasks:cfg.tasks, solution:cfg.solution,
    alreadyDone, onSuccess,
    isActive:() => container.isConnected && container.offsetParent !== null
  });
  requestAnimationFrame(() => requestAnimationFrame(() => ed.onShow()));
  addDesignerButton(container);
  return { stop(){ ed.stop(); } };
}
const mountLedCircuitMission = (c, o) => mountCircuitMission(c, 'led_circuit', o);
const mountSwitchLampMission = (c, o) => mountCircuitMission(c, 'switch_lamp', o);
const mountTrafficLightMission = (c, o) => mountCircuitMission(c, 'traffic_light', o);

/* ---------- طراحی آزاد: صفحهٔ تمام‌صفحه با ادیتور کامل (همهٔ قطعه‌ها، بدون مأموریت) ---------- */
const CIRCUIT_FREE_KEY = 'circuit-free-design-v1';
let circuitDesigner = null;

function openCircuitDesigner(){
  if(circuitDesigner || typeof CircuitEditor === 'undefined') return;
  if(!document.getElementById('cdzCss')){
    const css = document.createElement('style');
    css.id = 'cdzCss';
    css.textContent = '.cdz{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:var(--bg,#0f1420);color:var(--fg,#e8eaf0);box-sizing:border-box}' +
      '.cdz *{box-sizing:border-box}' +
      '.cdz-bar{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;padding:8px max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));border-bottom:1px solid rgba(255,255,255,.12)}' +
      '.cdz-bar b{font-size:16px}.cdz-sub{opacity:.65;font-size:12px;margin-inline-end:auto}' +
      '.cdz-bar button{font:inherit;font-size:13px;color:inherit;background:transparent;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:6px 12px;cursor:pointer}' +
      '.cdz-bar button:hover{border-color:#ff6a55}.cdz-bar button:focus-visible{outline:2px solid #ff6a55;outline-offset:2px}' +
      '.cdz-body{flex:1;min-height:0;position:relative;overflow:auto}' +
      '.cdz-body .cv-wrap{max-width:none;max-height:none;margin:0;padding:0 12px 12px}' +
      '@media (min-width:761px){' +
        '.cdz-body{overflow:hidden}' +
        '.cdz-body .cv-wrap{height:100%;display:flex;flex-direction:column}' +
        '.cdz-body .cv-main{flex:1;min-height:0;margin-top:12px}' +
        '.cdz-body .cv-wrap .cv-stage{height:auto;min-height:0}' +
        '.cdz-body .cv-wrap .cv-side{width:340px;flex:0 0 340px;gap:12px;min-height:0;overflow-y:auto;overflow-x:hidden;color-scheme:dark;scrollbar-width:thin;scrollbar-color:#2c3548 transparent}' +
        '.cdz-body .cv-props,.cdz-body .cv-tasks{flex:none}' +
        '.cdz-body .cv-props-title{font-size:16px}.cdz-body .cv-props-empty{font-size:13.5px}' +
        '.cdz-body .cv-wrap .cv-palette{max-height:none;overflow:visible;flex:none}' +
        '.cdz-body .cv-side .cv-toolbar{gap:8px;flex:none}' +
        '.cdz-body .cv-side .cv-toolbar .cv-group{flex:1 1 100%;flex-wrap:wrap;gap:8px}' +
        '.cdz-body .cv-side .cv-toolbar .cv-group:nth-last-child(-n+2){flex-basis:calc(50% - 4px)}' +
        '.cdz-body .cv-side .cv-toolbar .cv-btn{flex:1 1 auto;min-height:42px;padding:9px 12px;font-size:14px}' +
        '.cdz-body .cv-side .cv-toolbar .cv-btn svg{width:18px;height:18px}' +
        '.cdz-body .cv-side .cv-menu{inset-inline-start:auto;inset-inline-end:0}' +
        '.cdz-body .cv-pal-title{font-size:13px}.cdz-body .cv-pal-grid{gap:8px}' +
        '.cdz-body .cv-pal-item{padding:9px 4px;font-size:12px}.cdz-body .cv-pal-item svg{width:48px;height:48px}' +
        '.cdz-body .cv-status{flex:none}' +
      '}' +
      '.cdz-body .cv-wrap.pcb-on .cv-stage,.cdz-body .cv-wrap.pcb-on .cv-props,.cdz-body .cv-wrap.pcb-on .cv-palette{display:none}' +
      '.cdz-body .cv-wrap.pcb-on .cv-main{flex-direction:column;gap:10px}' +
      '.cdz-body .cv-wrap.pcb-on .cv-side{width:auto;flex:none;overflow:visible}' +
      '.cdz-body .cv-wrap.pcb-on .cv-side .cv-toolbar .cv-group{flex:0 1 auto}' +
      '.cdz-body .cv-main > .pcb{position:relative;inset:auto;z-index:auto;flex:1;min-width:0;min-height:0}' +
      '@media (max-width:760px){.cdz-body .cv-main > .pcb{flex:none;height:70vh;min-height:360px}}';
    document.head.appendChild(css);
  }
  const el = document.createElement('div');
  el.className = 'cdz'; el.dir = 'rtl';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'طراحی آزاد مدار');
  el.innerHTML = '<div class="cdz-bar"><button type="button" data-a="close" aria-label="بستن">✕ بستن</button><b>طراحی آزاد مدار</b>' +
    '<span class="cdz-sub">همهٔ قطعه‌ها در دسترس است · طرح شما خودکار ذخیره می‌شود</span>' +
    '<button type="button" data-a="new">طرح جدید (صفحهٔ خالی)</button></div><div class="cdz-body"></div>';
  document.body.appendChild(el);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const body = el.querySelector('.cdz-body');
  const ed = CircuitEditor.create(body, { storageKey:CIRCUIT_FREE_KEY, isActive:() => el.isConnected });
  requestAnimationFrame(() => requestAnimationFrame(() => ed.onShow()));
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if(!b) return;
    if(b.dataset.a === 'close') closeCircuitDesigner();
    else if(b.dataset.a === 'new'){ const c = body.querySelector('[data-act="clear"]'); if(c) c.click(); }   // همان «پاک‌کردن همه» (با تأیید و قابل واگرد)
  });
  circuitDesigner = { el, ed, prevOverflow };
}
function closeCircuitDesigner(){
  if(!circuitDesigner) return;
  const d = circuitDesigner; circuitDesigner = null;
  d.ed.stop(); d.el.remove();
  document.body.style.overflow = d.prevOverflow || '';
}
// دکمهٔ «طراحی آزاد» کنار دکمه‌های نوار ابزارِ مأموریت
function addDesignerButton(container){
  const bar = container.querySelector('.cv-toolbar');
  if(!bar || bar.querySelector('[data-cdz]')) return;
  const g = document.createElement('div');
  g.className = 'cv-group';
  g.innerHTML = '<button type="button" class="cv-btn" data-cdz title="صفحهٔ جدید برای طراحی آزاد مدار با همهٔ قطعه‌ها"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 12v6M9 15h6"/></svg>طراحی آزاد</button>';
  g.firstChild.addEventListener('click', openCircuitDesigner);
  bar.insertBefore(g, bar.querySelector('.cv-menu-wrap'));
}

/* ---------- آشنایی با طراحی مدار: شماتیک و فوت‌پرینت (آموزشی) ---------- */
const CI_SYM = {
  battery:'<path class="b" d="M-40 0H-6M-6 -14V14M6 -7V7M6 0H40"/>',
  resistor:'<path class="b" d="M-40 0H-24M24 0H40"/><rect class="b" x="-24" y="-9" width="48" height="18"/>',
  led:'<path class="b" d="M-40 0H-12M12 0H40M-12 -12V12L12 0ZM12 -12V12M-2 -16L6 -26M6 -16L14 -26"/>',
  switch:'<path class="b" d="M-40 0H-20M20 0H40M-20 0L18 -14"/><circle class="b" cx="-20" cy="0" r="3"/><circle class="b" cx="20" cy="0" r="3"/>',
  push:'<path class="b" d="M-40 0H-24M24 0H40M-24 -14H24M0 -14V-28"/><circle class="b" cx="-20" cy="0" r="4"/><circle class="b" cx="20" cy="0" r="4"/>'
};
const ciFa = v => (typeof toFa === 'function' ? toFa(String(v)) : String(v)).replace('.', '٫');

function mountSchematicIntroSim(container){
  const PARTS = [
    ['battery', 'باتری', 'منبع انرژی مدار. خط بلند قطب مثبت (+) و خط کوتاه قطب منفی (−) است. جریان از قطب + بیرون می‌آید، از مدار می‌گذرد و به قطب − برمی‌گردد.'],
    ['resistor', 'مقاومت', 'جلوی جریان را می‌گیرد تا قطعه‌های حساس مثل LED نسوزند. واحدش اهم (Ω) است و در شماتیک به شکل یک مستطیل (یا زیگزاگ) کشیده می‌شود.'],
    ['led', 'LED', 'یک لامپ کوچک که فقط از یک جهت جریان را رد می‌کند. مثلث جهت جریان را نشان می‌دهد (از آند + به کاتد −) و دو فلش یعنی نور می‌دهد.'],
    ['switch', 'کلید', 'مسیر جریان را باز و بسته می‌کند. وقتی باز است جریان قطع می‌شود و وقتی بسته است جریان می‌گذرد.'],
    ['push', 'کلید فشاری', 'مثل کلید است، ولی فقط تا وقتی فشارش می‌دهی بسته می‌ماند. با رها کردنش مسیر دوباره باز می‌شود.']
  ];
  const CAP = {
    real:'این عکسِ واقعیِ یک مدار است: باتری ۹ ولتی، مقاومت و LED با سیم به هم وصل شده‌اند.',
    sch:'این دقیقاً همان مدار است، اما به‌صورت شماتیک: هر قطعه فقط یک نماد ساده دارد و نقشه فقط نشان می‌دهد چه چیزی به چه چیزی وصل است.'
  };
  container.innerHTML = `
    <div class="sim-wrap ci-wrap">
      <div class="sim-hw-note">یک مدار را در دو حالت ببین: <b>عکس واقعی</b> و <b>شماتیک</b>.</div>
      <div class="ci-tabs">
        <button class="sim-btn on" data-v="real">عکس واقعی</button>
        <button class="sim-btn" data-v="sch">شماتیک</button>
      </div>
      <svg class="ci-svg" viewBox="0 0 320 190">
        <g class="ci-v" data-v="real">
          <path d="M40 62V30H124M196 30H236V150H274" fill="none" stroke="#ff6b6b" stroke-width="3" stroke-linecap="round"/>
          <path d="M286 150V170H40V128" fill="none" stroke="#9aa3b2" stroke-width="3" stroke-linecap="round"/>
          <rect x="22" y="62" width="36" height="66" rx="5" fill="#2d3b4e" stroke="#5b6b82"/>
          <rect x="29" y="55" width="8" height="7" fill="#9aa3b2"/><rect x="43" y="55" width="8" height="7" fill="#9aa3b2"/>
          <text x="40" y="100" text-anchor="middle">9V</text>
          <path d="M124 30H136M184 30H196" stroke="#c9ced6" stroke-width="3"/>
          <rect x="136" y="21" width="48" height="18" rx="8" fill="#d9c9a0"/>
          <rect x="146" y="21" width="4" height="18" fill="#b33"/><rect x="156" y="21" width="4" height="18" fill="#b33"/><rect x="166" y="21" width="4" height="18" fill="#7a4a1a"/>
          <path d="M274 92V150M286 92V150" stroke="#c9ced6" stroke-width="2.5"/>
          <path d="M266 88V68a14 14 0 0 1 28 0V88Z" fill="#e5484d"/>
          <rect x="262" y="88" width="36" height="5" fill="#c43"/>
        </g>
        <g class="ci-v" data-v="sch" style="display:none">
          <path class="w" d="M40 55V30H120M200 30H280V55M280 135V160H40V135"/>
          <g transform="translate(40 95) rotate(90)">${CI_SYM.battery}</g>
          <g transform="translate(160 30)">${CI_SYM.resistor}</g>
          <g transform="translate(280 95) rotate(90)">${CI_SYM.led}</g>
          <text x="58" y="100">BT1</text><text x="160" y="14" text-anchor="middle">R1</text><text x="262" y="100" text-anchor="end">D1</text>
        </g>
      </svg>
      <div class="ci-cap" id="ciCap">${CAP.real}</div>
      <div class="ci-title">هر نماد چه قطعه‌ای است؟</div>
      <div class="ci-parts">
        ${PARTS.map(([k, n, t]) => `
          <div class="ci-part">
            <svg viewBox="-50 -32 100 64">${CI_SYM[k]}</svg>
            <b>${n}</b>
            <p>${t}</p>
          </div>`).join('')}
      </div>
    </div>`;

  const cap = container.querySelector('#ciCap');
  container.querySelectorAll('.ci-tabs button').forEach(b => b.addEventListener('click', () => {
    container.querySelectorAll('.ci-tabs button').forEach(x => x.classList.toggle('on', x === b));
    container.querySelectorAll('.ci-v').forEach(g => { g.style.display = g.dataset.v === b.dataset.v ? '' : 'none'; });
    cap.textContent = CAP[b.dataset.v];
  }));
  return { stop(){} };
}

function mountFootprintIntroSim(container){
  const SILK = 'fill="none" stroke="#e8e2d0" stroke-width="2"';
  const pad = (x, y, r, st = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d4af37" ${st}/><circle cx="${x}" cy="${y}" r="${r * .45}" fill="#0f1420"/>`;
  const dim = (x1, x2, y, t) => `<path d="M${x1} ${y}H${x2}M${x1} ${y - 5}V${y + 5}M${x2} ${y - 5}V${y + 5}" fill="none" stroke="#e8e2d0" stroke-width="1.5"/><text x="${(x1 + x2) / 2}" y="${y + 18}" text-anchor="middle">${t}</text>`;
  const PADS = [[97.5, 40, 1], [97.5, 130, 1], [222.5, 40, 2], [222.5, 130, 2]];
  const FP = {
    res:{ name:'مقاومت', sym:'resistor',
      cap:'مقاومت ¼ وات: دو پایه‌ی سیمی دارد که ۱۰٫۱۶ میلی‌متر (۴۰۰ میل) از هم فاصله دارند. فوت‌پرینتش دو پد با همین فاصله است و خط دورِ آن (سیلک) جای بدنه‌ی مقاومت را نشان می‌دهد. اگر فاصله‌ی پدها اشتباه باشد، قطعه جا نمی‌افتد.',
      draw:on => `
        <rect x="122" y="65" width="76" height="30" rx="6" ${SILK}/><path d="M111 80H122M198 80H209" ${SILK}/>
        ${pad(99, 80, 12)}${pad(221, 80, 12)}${dim(99, 221, 122, '10.16 mm')}
        ${on ? `<path d="M99 80H122M198 80H221" stroke="#c9ced6" stroke-width="3"/><rect x="122" y="65" width="76" height="30" rx="12" fill="#d9c9a0"/>
          <rect x="137" y="65" width="7" height="30" fill="#b33"/><rect x="151" y="65" width="7" height="30" fill="#b33"/><rect x="165" y="65" width="7" height="30" fill="#7a4a1a"/>` : ''}` },
    led:{ name:'LED', sym:'led',
      cap:'LED ۵ میلی‌متری: دو پایه با فاصله‌ی ۲٫۵۴ میلی‌متر (۱۰۰ میل) دارد. پایه‌ی بلندتر آند (+) است و باید به پدِ مثبت برود. دایره‌ی سیلک بدنه‌ی LED را نشان می‌دهد.',
      draw:on => `
        <circle cx="160" cy="80" r="35" ${SILK}/>
        ${pad(145, 80, 11)}${pad(175, 80, 11)}<text x="145" y="62" text-anchor="middle">+</text><text x="175" y="62" text-anchor="middle">−</text>
        ${dim(145, 175, 128, '2.54 mm')}
        ${on ? '<circle cx="160" cy="80" r="30" fill="#e5484d" opacity=".92"/><circle cx="150" cy="68" r="9" fill="#fff" opacity=".28"/>' : ''}` },
    sw:{ name:'کلید فشاری', sym:'push',
      cap:'کلید فشاری ۶ میلی‌متری (Button_Switch_THT:SW_PUSH_6mm): در شماتیک فقط دو پایه دارد، اما فوت‌پرینتش چهار پد است (۶٫۲۵ × ۴٫۵ میلی‌متر). دو پدِ هر طرف داخل کلید به هم وصلند و یک پایه‌ی شماتیک حساب می‌شوند. روی پدها بزن تا پدهای هم‌وصل را ببینی.',
      draw:(on, sel) => `
        <rect x="100" y="25" width="120" height="120" rx="6" ${SILK}/><circle cx="160" cy="85" r="35" ${SILK}/>
        ${PADS.map(([x, y, n]) => `<g class="ci-pad" data-net="${n}">${pad(x, y, 18, `stroke="${sel === n ? '#fff' : 'none'}" stroke-width="3"`)}</g>`).join('')}
        ${on ? `<rect x="100" y="25" width="120" height="120" rx="6" fill="#d2d1c7" pointer-events="none"/><circle cx="160" cy="85" r="35" fill="#252525" pointer-events="none"/>
          ${[[120, 45], [200, 45], [120, 125], [200, 125]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="10" fill="#252525" pointer-events="none"/>`).join('')}` : ''}` }
  };
  const KEYS = Object.keys(FP);
  container.innerHTML = `
    <div class="sim-wrap ci-wrap">
      <div class="sim-hw-note">یک قطعه را انتخاب کن تا <b>نماد شماتیک</b> و <b>فوت‌پرینتش</b> را کنار هم ببینی.</div>
      <div class="ci-tabs">${KEYS.map((k, i) => `<button class="sim-btn${i ? '' : ' on'}" data-k="${k}">${FP[k].name}</button>`).join('')}</div>
      <div class="ci-title">نماد در شماتیک</div>
      <svg class="ci-sym" viewBox="-50 -32 100 64"></svg>
      <div class="ci-title">فوت‌پرینت روی برد</div>
      <svg class="ci-svg" viewBox="0 0 320 170"></svg>
      <label class="ci-chk"><input type="checkbox"> نمایش خود قطعه روی فوت‌پرینت</label>
      <div class="ci-cap"></div>
      <div class="ci-cap ci-sel"></div>
    </div>`;

  const svg = container.querySelector('.ci-svg'), sym = container.querySelector('.ci-sym');
  const cap = container.querySelector('.ci-cap'), selEl = container.querySelector('.ci-sel');
  const chk = container.querySelector('.ci-chk input');
  let key = KEYS[0], sel = 0;

  const render = () => {
    const f = FP[key];
    sym.innerHTML = CI_SYM[f.sym];
    svg.innerHTML = '<rect x="20" y="6" width="280" height="158" rx="6" fill="#1c4a3a"/>' + f.draw(chk.checked, sel);
    cap.textContent = f.cap;
    selEl.textContent = key === 'sw' && sel ? 'پد انتخاب‌شده به «پایه‌ی ' + ciFa(sel) + '» شماتیک وصل است و پدِ هم‌ردیفش هم همین پایه است.' : '';
  };

  container.querySelectorAll('.ci-tabs button').forEach(b => b.addEventListener('click', () => {
    container.querySelectorAll('.ci-tabs button').forEach(x => x.classList.toggle('on', x === b));
    key = b.dataset.k; sel = 0; render();
  }));
  chk.addEventListener('change', render);
  svg.addEventListener('click', e => {
    const p = e.target.closest('[data-net]');
    if(key !== 'sw' || !p) return;
    sel = +p.dataset.net; render();
  });
  render();
  return { stop(){} };
}
