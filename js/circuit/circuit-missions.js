/* مأموریت‌های مداربندی — ادیتور شماتیک داخل مأموریت، با بررسی خودکار مدار */

const CKT_POWER = {
  comps:[{t:'BT',x:-200,y:0,r:1,ref:'BT1'},{t:'BC',x:-100,y:0,ref:'J1'}],
  wires:[[-200,-40,-140,-40],[-140,-40,-140,-20],[-200,40,-140,40],[-140,40,-140,20]]
};
const cktSolution = (comps, wires) => ({comps:CKT_POWER.comps.concat(comps), wires:CKT_POWER.wires.concat(wires)});

const cktPartsTask = (label, types) => ({label, test:A => types.every(t => A.count(t) >= 1)});
const CKT_WIRED_TASK = {label:'باتری را به کانکتور وصل کن (+ به +، − به −)', test:A => A.wired('BT','BC')};

const CIRCUIT_MISSIONS = {
  lamp_circuit:{
    note:'هدف: این بار به‌جای LED یک لامپ بگذار. لامپ خودش جلوی جریان را می‌گیرد، پس مقاومت لازم ندارد؛ فقط مسیر را ببند.',
    palette:['BT','BC','LAMP'],
    tasks:[
      cktPartsTask('باتری، کانکتور و لامپ را روی صفحه بگذار', ['BT','BC','LAMP']),
      CKT_WIRED_TASK,
      {label:'لامپ را به دو سیم کانکتور وصل کن تا روشن شود', test:A => A.lit('LAMP') >= 1 && A.lit('BC') >= 1}
    ],
    solution:cktSolution(
      [{t:'LAMP',x:40,y:0,r:1,ref:'LA1'}],
      [[-60,-20,-60,-60],[-60,-60,40,-60],[40,-60,40,-40],[-60,20,-60,60],[-60,60,40,60],[40,60,40,40]])
  },
  led_circuit:{
    note:'هدف: باتری ۹ ولتی، کانکتور، مقاومت و یک LED قرمز را بردار و مدار را ببند. LED بدون مقاومت می‌سوزد؛ پس یک مقاومت پشت‌سرش بگذار.',
    palette:['BT','BC','R','LED'],
    tasks:[
      cktPartsTask('باتری، کانکتور، مقاومت و LED قرمز را روی صفحه بگذار', ['BT','BC','R','LED']),
      CKT_WIRED_TASK,
      {label:'LED را با مقاومت پشت‌سرش وصل کن تا روشن شود (آند به سمت +)', test:A => A.lit('LED') >= 1 && A.burnt === 0}
    ],
    solution:cktSolution(
      [{t:'R',x:20,y:-60,ref:'R1',val:'330Ω'},{t:'LED',x:140,y:0,r:1,ref:'D1'}],
      [[-60,-20,-60,-60],[-60,-60,-20,-60],[60,-60,140,-60],[140,-60,140,-40],[140,40,140,60],[140,60,-60,60],[-60,60,-60,20]])
  },
  traffic_light:{
    note:'هدف: سه LED قرمز، زرد و سبز را هرکدام با مقاومت خودش به باتری ۹ ولتی وصل کن تا هر سه روشن شوند. کلید (SW) اختیاری است: روی آن دوبار بزن تا باز/بسته شود.',
    palette:['BT','BC','R','LED','LEDY','LEDG','SW'],
    tasks:[
      cktPartsTask('باتری، کانکتور و سه LED (قرمز، زرد، سبز) را روی صفحه بگذار', ['BT','BC','LED','LEDY','LEDG']),
      CKT_WIRED_TASK,
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
    storageKey:'circuit-mission-' + id + '-v1',
    note:cfg.note, palette:cfg.palette, tasks:cfg.tasks, solution:cfg.solution,
    alreadyDone, onSuccess,
    isActive:() => container.isConnected && container.offsetParent !== null
  });
  requestAnimationFrame(() => requestAnimationFrame(() => ed.onShow()));
  return { stop(){ ed.stop(); } };
}
const mountLampMission = (c, o) => mountCircuitMission(c, 'lamp_circuit', o);
const mountLedCircuitMission = (c, o) => mountCircuitMission(c, 'led_circuit', o);
const mountTrafficLightMission = (c, o) => mountCircuitMission(c, 'traffic_light', o);
