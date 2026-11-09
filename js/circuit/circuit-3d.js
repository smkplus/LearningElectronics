/* نمای سه بعدی مدار — همان صحنه، مدل‌ها، دوربین و صفحه‌آرایی فایل «LED Board 3D View»
   واحد = میلی‌متر. LED، مقاومت، دیود و هدر با مدل‌های همان فایل ساخته می‌شوند.
   three.js فقط هنگام باز شدن بارگذاری می‌شود. API همان قبلی: Circuit3D.open(data) / Circuit3D.close() */
(function(){
'use strict';
const U = 20, MM = 2.54 / U;      // هر ۲۰ پیکسل ادیتور = ۲٫۵۴ میلی‌متر
const HALF = Math.PI / 2;
const SELF = (document.currentScript && document.currentScript.src) || '';
let loading = null, current = null, cssDone = false;

function loadThree(){
  if(window.THREE) return Promise.resolve();
  if(loading) return loading;
  const srcs = [SELF.replace(/circuit\/circuit-3d\.js.*$/, 'vendor/three.min.js'), 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
  loading = new Promise((res, rej) => {
    const next = i => {
      if(i >= srcs.length){ loading = null; rej(new Error('three.js')); return; }
      const s = document.createElement('script');
      s.src = srcs[i];
      s.onload = () => window.THREE ? res() : next(i + 1);
      s.onerror = () => next(i + 1);
      document.head.appendChild(s);
    };
    next(0);
  });
  return loading;
}

/* ---------- رنگ‌ها و دوربین: عیناً از فایل HTML ---------- */
const COL = {boardTop:0x17291c, boardSide:0x595033, trace:0x203214, pad:0x7c6e00, hole:0x2a2508, silk:0xc8c8c8,
  resBody:0xe1b57d, lead:0xd2d1c7, pin:0xdbbc7e, plastic:0x262626};
const CAM = {right:[0.9887, -0.0401, 0.1451], up:[0.1400, 0.5986, -0.7888]};
const LEDS = {LED:{c:0xb31a0d, on:'#ff4d4d'}, LEDY:{c:0xd9a400, on:'#ffd23f'}, LEDG:{c:0x1d8f45, on:'#3ddc84'}};

function cameraBasis(T){
  const r = new T.Vector3().fromArray(CAM.right).normalize();
  const u = new T.Vector3().fromArray(CAM.up);
  u.sub(r.clone().multiplyScalar(r.dot(u))).normalize();
  const b = new T.Vector3().crossVectors(r, u).normalize();
  return {right:r, up:u, back:b};
}

/* ---------- فوت‌پرینت‌ها ---------- */
const FAM = t => ({LEDY:'LED', LEDG:'LED', NPN:'BJT', PNP:'BJT'}[t] || t);
const DEF_FP = {R:'R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal', C:'C_Radial_D6.3mm_P5.00mm', CP:'CP_Radial_D8.0mm_P3.50mm',
  D:'D_DO-35_SOD27_P10.16mm_Horizontal',
  LED:'LED_D5.0mm', BJT:'TO-92_Inline', BC:'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', HDR4:'Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical', NANO:'Module:Arduino_Nano', ESP32:'Module:ESP32_DevKit_38Pin', BLUEPILL:'Module:BluePill_STM32F103C8T6',
  SW:'SW_Slide_SPST_P10.16mm', PB:'Button_Switch_THT:SW_PUSH_6mm', LAMP:'Lamp_E10_Holder'};
const fpOf = c => c.t === 'BC' ? DEF_FP.BC : (c.fp || DEF_FP[FAM(c.t)] || '');
const NAMES = {R:'مقاومت', D:'دیود', LED:'LED قرمز ۵ میلی‌متری', LEDY:'LED زرد ۵ میلی‌متری', LEDG:'LED سبز ۵ میلی‌متری', C:'خازن', CP:'خازن الکترولیتی',
  NPN:'ترانزیستور NPN', PNP:'ترانزیستور PNP', BC:'کانکتور باتری (هدر ۱×۲)', HDR4:'هدر ۴پین (۱×۴)', NANO:'آردوینو Nano (ATmega328P)', ESP32:'ESP32‑WROOM‑32 (۳۸ پین)', BLUEPILL:'STM32 Blue Pill (F103C8T6)', SW:'کلید', PB:'کلید فشاری ۶ میلی‌متری', LAMP:'لامپ'};
const SWATCH = {R:'#e1b57d', D:'#c9772e', LED:'#b31a0d', LEDY:'#d9a400', LEDG:'#1d8f45', C:'#1c1d21', CP:'#1f3a78',
  NPN:'#262626', PNP:'#262626', BC:'#262626', HDR4:'#262626', NANO:'#2450b8', ESP32:'#15161a', BLUEPILL:'#1a3f9e', SW:'#d0d4db', PB:'#d2d1c7', LAMP:'#ffe27a'};
const fa = n => Number(n).toLocaleString('fa-IR');

/* ---------- ابعاد برد (میلی‌متر) ---------- */
function extents(data){
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  const ext = (x, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); };
  data.comps.forEach(c => { ext(c.box.x0 * MM, c.box.y0 * MM); ext(c.box.x1 * MM, c.box.y1 * MM); c.pins.forEach(p => ext(p[0] * MM, p[1] * MM)); });
  data.wires.forEach(w => { ext(w[0] * MM, w[1] * MM); ext(w[2] * MM, w[3] * MM); });
  const mg = 4;
  x0 -= mg; z0 -= mg; x1 += mg; z1 += mg;
  return {x0, z0, x1, z1, W:Math.max(x1 - x0, 20), H:Math.max(z1 - z0, 20), cx:(x0 + x1) / 2, cz:(z0 + z1) / 2};
}

function build(T, data){
  const V3 = T.Vector3, V2 = T.Vector2;
  const lambert = c => new T.MeshLambertMaterial({color:c});
  const phong = (c, spec, shin, o) => new T.MeshPhongMaterial(Object.assign({color:c, specular:spec, shininess:shin}, o || {}));
  const mat = (color, o) => {           // برای مدل‌های ساده‌ترِ قدیمی
    o = Object.assign({roughness:.55, metalness:.1}, o || {});
    const rough = o.roughness, metal = o.metalness; delete o.roughness; delete o.metalness;
    return phong(color, new T.Color(metal > .5 ? 0x888888 : 0x333333), Math.round((1 - rough) * 70) + 10, o);
  };
  const M = {
    top:lambert(COL.boardTop), side:lambert(COL.boardSide), trace:lambert(COL.trace), pad:lambert(COL.pad), hole:lambert(COL.hole), silk:lambert(COL.silk),
    black:mat('#18181b', {roughness:.5}), dark:mat('#2b2e35', {roughness:.6}), metal:mat('#b8bec8', {roughness:.3, metalness:.8}),
    silver:phong(COL.lead, 0x888888, 60), plastic:phong(COL.plastic, 0x111111, 20), gold:phong(COL.pin, 0x666666, 40)
  };

  const scene = new T.Scene();
  const rig = new T.Group(), group = new T.Group();
  scene.add(rig); rig.add(group);
  const sprites = []; let lights = 0;

  const tube = (a, b, r, m) => {
    const v = new V3().subVectors(b, a), len = v.length();
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, len, 12), m || M.silver);
    mesh.position.copy(a).addScaledVector(v, .5);
    mesh.quaternion.setFromUnitVectors(new V3(0,1,0), v.normalize());
    return mesh;
  };
  const P3 = (x,y,z) => new V3(x,y,z);
  const cyl = (r, h, m, seg) => new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 20), m);
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const axisToZ = geo => { geo.rotateX(HALF); return geo; };   // محور Y ← محور Z مدل

  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0,0,128,128);
    return new T.CanvasTexture(cv);
  })();
  const glow = (g, color, y, size) => {
    const sp = new T.Sprite(new T.SpriteMaterial({map:glowTex, color, blending:T.AdditiveBlending, transparent:true, depthWrite:false}));
    sp.position.set(0, y, 0); sp.scale.set(size, size, 1); g.add(sp); sprites.push(sp);
    if(lights++ < 4){ const pl = new T.PointLight(color, 1.0, 30); pl.position.set(0, y, 0); g.add(pl); }
  };
  const label = (text, color, h) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = 'bold 38px monospace'; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 32);
    const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
    const m = new T.Mesh(new T.PlaneGeometry(h * 4, h), new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
    m.rotation.x = -Math.PI / 2; m.position.y = .04;
    return m;
  };

  /* ---------- لایه‌های تخت روی برد (مثل HTML) ---------- */
  const flat = (geo, y, m) => { geo.rotateX(-Math.PI / 2); const o = new T.Mesh(geo, m); o.position.y = y; return o; };
  function ribbon(parent, pts, w, y, m, round){        // pts = [[x,z],...]
    for(let i = 0; i < pts.length - 1; i++){
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      if(len < .001) continue;
      const s = flat(new T.PlaneGeometry(len, w), y, m);
      s.position.x = (a[0] + b[0]) / 2; s.position.z = (a[1] + b[1]) / 2; s.rotation.y = -Math.atan2(dz, dx);
      parent.add(s);
    }
    if(round) pts.forEach(p => { const d = flat(new T.CircleGeometry(w / 2, 14), y, m); d.position.x = p[0]; d.position.z = p[1]; parent.add(d); });
  }

  /* ---------- برد ---------- */
  const E = extents(data);
  group.position.set(-E.cx, 0, -E.cz);
  const board = new T.Mesh(new T.BoxGeometry(E.W, 1.6, E.H), [M.side, M.side, M.top, M.side, M.side, M.side]);
  board.position.set(E.cx, -.8, E.cz); group.add(board);

  // مس‌کشی‌ها: ۰٫۹ میلی‌متر با سر گرد
  const ends = new Set();
  data.wires.forEach(w => {
    const a = [w[0] * MM, w[1] * MM], b = [w[2] * MM, w[3] * MM];
    ribbon(group, [a, b], .9, .01, M.trace, false);
    [a, b].forEach(p => {
      const k = p[0].toFixed(2) + ',' + p[1].toFixed(2); if(ends.has(k)) return; ends.add(k);
      const d = flat(new T.CircleGeometry(.45, 16), .01, M.trace); d.position.x = p[0]; d.position.z = p[1]; group.add(d);
    });
  });

  // پدها: ۱٫۷ میلی‌متر با سوراخ ۱ میلی‌متر؛ پد اول چهارگوش (مثل نمای PCB خودت)
  const padSeen = new Set();
  function pad(x, z, square){
    const k = x.toFixed(2) + ',' + z.toFixed(2); if(padSeen.has(k)) return; padSeen.add(k);
    const s = new T.Shape(), h = new T.Path(), r = .85;
    if(square){ s.moveTo(-r, -r); s.lineTo(r, -r); s.lineTo(r, r); s.lineTo(-r, r); s.closePath(); }
    else s.absarc(0, 0, r, 0, Math.PI * 2, false);
    h.absarc(0, 0, .5, 0, Math.PI * 2, true); s.holes.push(h);
    const p = flat(new T.ShapeGeometry(s, 24), .02, M.pad); p.position.x = x; p.position.z = z; group.add(p);
    const d = flat(new T.CircleGeometry(.5, 20), .025, M.hole); d.position.x = x; d.position.z = z; group.add(d);
  }

  /* ---------- روکش ابریشمی (۰٫۱۲ میلی‌متر) ---------- */
  const silk = (g, pts) => ribbon(g, pts, .12, .03, M.silk, true);
  const rect = (x0, z0, x1, z1) => [[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0,z0]];
  const circle = (cx, cz, r) => { const p = []; for(let i = 0; i <= 64; i++){ const t = i / 64 * Math.PI * 2; p.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]); } return p; };
  const SILK = {
    C:[circle(0,0,3.15)], CP:[circle(0,0,4)], BJT:[circle(.5,0,3)],
    SW:[rect(-6.5,-3,6.5,3)], HDR4:[rect(-1.33,-5.1,1.33,5.1)], PB:[rect(-3,-3,3,3), circle(0,0,1.9)], LAMP:[circle(0,0,5.5)]
  };
  function silkFor(g, c, fp){
    const fam = FAM(c.t);
    if(fam === 'R'){          // خط‌های بالا و پایین بدنه با دو خار کوتاه، مثل HTML
      const x0 = -3.27, x1 = 3.27, y = 1.37, tk = .33;
      [-1, 1].forEach(s => silk(g, [[x0, s * (y - tk)], [x0, s * y], [x1, s * y], [x1, s * (y - tk)]]));
    } else if(fam === 'LED'){ // دایرهٔ داخلی + کمانِ بیرونی با گوشهٔ تخت سمت کاتد (+x)
      silk(g, circle(0, 0, 2.5));
      const R = Math.hypot(2.56, 1.545), a = Math.acos(2.56 / R), p = [];
      for(let i = 0; i <= 96; i++){ const t = a + i / 96 * (2 * Math.PI - 2 * a); p.push([R * Math.cos(t), R * Math.sin(t)]); }
      p.push(p[0]); silk(g, p);
    } else if(fam === 'D'){
      const big = /DO-41/.test(fp), hx = big ? 2.5 : 1.9, hy = big ? 1.3 : .95;
      silk(g, rect(-hx, -hy, hx, hy)); silk(g, [[hx - .8, -hy], [hx - .8, hy]]);
    } else if(fam === 'BC'){
      // سیلک هدر ۱×۲ دقیقاً مثل HTML (پین ۱ در z=‎−۱٫۲۷)
      const sk = pts => silk(g, pts.map(q => [q[0], q[1] - 1.27]));
      sk([[0, -1.33], [-1.33, -1.33], [-1.33, 0]]);
      sk([[-1.33, 1.27], [-1.33, 3.87], [1.33, 3.87], [1.33, 1.27], [-1.33, 1.27]]);
      sk([[0, -1.33], [1.33, -1.33], [1.33, 0]]);
    } else (SILK[fam] || []).forEach(p => silk(g, p));
  }

  /* ---------- مدل‌های سه‌بعدی، مختصات STEP: (x, y, z) مدل ← (x, z, −y) جهان ---------- */
  const modelGroup = parent => { const m = new T.Group(); m.rotation.x = -HALF; parent.add(m); return m; };
  const pitchOf = c => Math.hypot(c.pins[1][0] - c.pins[0][0], c.pins[1][1] - c.pins[0][1]) * MM || 10.16;

  // پایه‌های محوری با خم، برای مقاومت و دیود (فاصلهٔ پایه‌ها = Pp)
  function axialLeads(m, Pp, bodyHalf){
    [-1, 1].forEach(sg => {
      const lg = new T.Group(); lg.position.x = sg * Pp / 2; if(sg > 0) lg.scale.x = -1;
      const vert = new T.Mesh(axisToZ(new T.CylinderGeometry(.3, .3, 3.35, 24)), M.silver); vert.position.z = -1.325; lg.add(vert);
      const tg = new T.TorusGeometry(.9, .3, 20, 32, HALF); tg.rotateZ(HALF); tg.rotateX(HALF);
      const bend = new T.Mesh(tg, M.silver); bend.position.set(.9, 0, .35); lg.add(bend);
      const len = Pp / 2 - bodyHalf - .9 + .25;
      if(len > .05){
        const hg = new T.CylinderGeometry(.3, .3, len, 16); hg.rotateZ(HALF);
        const h = new T.Mesh(hg, M.silver); h.position.set(.9 + len / 2 - .02, 0, 1.25); lg.add(h);
      }
      m.add(lg);
    });
  }

  const REAL = {
    // مقاومت DIN0207 — همان لاتـِه‌ها و رنگ HTML
    R(g, c){
      const m = modelGroup(g), body = phong(COL.resBody, 0x1e1e1e, 20);
      const lathe = pts => {
        const geo = new T.LatheGeometry(pts, 56); geo.rotateZ(-HALF);
        const o = new T.Mesh(geo, body); o.position.set(-3.81, 0, 1.25); m.add(o);
      };
      let i, t;
      const a = [new V2(0, .66), new V2(.625, .66)];
      for(i = 1; i <= 16; i++){ t = i / 16 * HALF; a.push(new V2(.625 + .625 * Math.sin(t), 1.285 - .625 * Math.cos(t))); }
      a.push(new V2(1.25, 2.235)); lathe(a);
      lathe([new V2(1.25, 2.235), new V2(1.125, 2.235)]);
      lathe([new V2(1.125, 2.235), new V2(1.125, 5.385)]);
      lathe([new V2(1.125, 5.385), new V2(1.25, 5.385)]);
      const b = [new V2(1.25, 5.385), new V2(1.25, 6.335)];
      for(i = 1; i <= 16; i++){ t = i / 16 * HALF; b.push(new V2(.625 + .625 * Math.cos(t), 6.335 + .625 * Math.sin(t))); }
      b.push(new V2(0, 6.96)); lathe(b);
      axialLeads(m, pitchOf(c), 3.2);
    },
    // دیود شیشه‌ای DO-35 / DO-41 با نوار سمت کاتد
    D(g, c, fp){
      const m = modelGroup(g), big = /DO-41/.test(fp), len = big ? 5 : 3.8, r = big ? 1.3 : .95;
      const bg = new T.CylinderGeometry(r, r, len, 32); bg.rotateZ(HALF);
      const body = new T.Mesh(bg, phong(big ? 0x1b1b1d : 0xc9772e, 0x555555, 50)); body.position.z = 1.25; m.add(body);
      const sg = new T.CylinderGeometry(r + .03, r + .03, .8, 32); sg.rotateZ(HALF);
      const band = new T.Mesh(sg, phong(big ? 0xd8d8d8 : 0x151515, 0x222222, 20)); band.position.set(len / 2 - .7, 0, 1.25); m.add(band);
      axialLeads(m, pitchOf(c), len / 2);
    },
    // LED ۵ میلی‌متری — لنز لاتـِه، لبهٔ تخت سمت کاتد، پایه‌ها از پدها به زیر لنز جمع می‌شوند
    LED(g, c){
      const m = modelGroup(g), def = LEDS[c.t] || LEDS.LED, lit = c.st === 'on', burnt = c.st === 'burnt', lv = c.lv == null ? 1 : c.lv;
      const color = burnt ? 0x2a2a2a : def.c;
      const red = phong(color, 0x2a2a2a, 30, lit ? {emissive:new T.Color(def.on), emissiveIntensity:.75 * lv} : {});
      const prof = [new V2(2.45, 4), new V2(2.45, 9.15)];
      for(let i = 1; i <= 32; i++){ const t = i / 32 * HALF; prof.push(new V2(2.45 * Math.cos(t), 9.15 + 2.45 * Math.sin(t))); }
      m.add(new T.Mesh(axisToZ(new T.LatheGeometry(prof, 72)), red));
      if(lit) glow(g, def.on, 9, 13 * (.3 + .7 * lv));
      const a = Math.acos(2.5 / 2.9), sh = new T.Shape();
      sh.absarc(0, 0, 2.9, a, 2 * Math.PI - a, false); sh.closePath();   // لبهٔ تخت روی +x (کاتد)
      const fl = new T.Mesh(new T.ExtrudeGeometry(sh, {depth:1, bevelEnabled:false, curveSegments:72}), red);
      fl.position.z = 3; m.add(fl);
      const half = pitchOf(c) / 2;
      [-1, 1].forEach(s => {
        m.add(tube(P3(s * half, 0, -2.5), P3(s * half, 0, 1.4), .2));
        m.add(tube(P3(s * half, 0, 1.4), P3(s * 1.27, 0, 3.2), .2));
      });
    },
    // هدر ۱×۴ با گام ۲٫۵۴ میلی‌متر (برد چراغ راهنما)
    HDR4(g){
      const m = modelGroup(g), plastic = M.plastic, gold = M.gold;
      const body = box(2.54, 10.16, 2.54, plastic); body.position.set(0, 0, 1.27); m.add(body);
      [-3.81, -1.27, 1.27, 3.81].forEach(y => {
        const shaft = new T.Mesh(new T.BoxGeometry(.64, .64, 11.22), gold); shaft.position.set(0, y, 2.77); m.add(shaft);
        const tg = new T.CylinderGeometry(.2263, .4525, .16, 4, 1); tg.rotateY(Math.PI / 4); axisToZ(tg);
        const tip = new T.Mesh(tg, gold); tip.position.set(0, y, 8.46); m.add(tip);
        const bg = new T.CylinderGeometry(.4525, .2263, .16, 4, 1); bg.rotateY(Math.PI / 4); axisToZ(bg);
        const bot = new T.Mesh(bg, gold); bot.position.set(0, y, -2.92); m.add(bot);
      });
    },
    // کانکتور باتری: هدر ۱×۲ با گام ۲٫۵۴ میلی‌متر، عیناً مدل HTML
    BC(g){
      const m = modelGroup(g), plastic = M.plastic, gold = M.gold;
      const pts = [[-1.016, 1.27], [-1.27, 1.016], [-1.27, -1.016], [-1.016, -1.27], [-1.27, -1.524], [-1.27, -3.556],
        [-1.016, -3.81], [1.016, -3.81], [1.27, -3.556], [1.27, -1.524], [1.016, -1.27], [1.27, -1.016],
        [1.27, 1.016], [1.016, 1.27]];
      const sh = new T.Shape();
      pts.forEach((q, k) => { if(k) sh.lineTo(q[0], q[1] + 1.27); else sh.moveTo(q[0], q[1] + 1.27); });
      sh.closePath();
      m.add(new T.Mesh(new T.ExtrudeGeometry(sh, {depth:2.54, bevelEnabled:false}), plastic));
      [1.27, -1.27].forEach(y => {
        const shaft = new T.Mesh(new T.BoxGeometry(.64, .64, 11.22), gold); shaft.position.set(0, y, 2.77); m.add(shaft);
        const tg = new T.CylinderGeometry(.2263, .4525, .16, 4, 1); tg.rotateY(Math.PI / 4); axisToZ(tg);
        const tip = new T.Mesh(tg, gold); tip.position.set(0, y, 8.46); m.add(tip);
        const bg = new T.CylinderGeometry(.4525, .2263, .16, 4, 1); bg.rotateY(Math.PI / 4); axisToZ(bg);
        const bot = new T.Mesh(bg, gold); bot.position.set(0, y, -2.92); m.add(bot);
      });
    }
  };

  /* آردوینو Nano — همان مدل فایل «Arduino Nano 3D»: برد آبی ۴۵×۱۸×۱٫۶، USB‑C، ATmega328P، رزوناتور ۱۶ مگاهرتز، کلید ریست،
     چهار LED و دو ردیف پین ۱×۱۵. مبدأ = مرکز پدها (USB سمت چپ)؛ پایه‌ها از برد اصلی رد می‌شوند و بدنهٔ ماژول
     ۲٫۵ میلی‌متر بالاتر روی هدرهای پلاستیکی می‌نشیند. */
  REAL.NANO = g => {
    const BW = 45, BH = 18, BT = 1.6, X0 = -19.3, PITCH = 2.54, ROW = 7.62, LIFT = BT + 2.5;
    const m = new T.Group(); m.position.set(1.52, LIFT, 0); g.add(m);      // مرکز پدها در فایل Nano = (−۱٫۵۲، ۰)
    const put = (o, x, y, z, p) => { o.position.set(x, y, z); (p || m).add(o); return o; };
    const bx = (w, h, d, mt, x, y, z, p) => put(box(w, h, d, mt), x, y, z, p);
    const mBoard = phong(0x2450b8, 0x334477, 35), mEdge = phong(0x174a63, 0x111111, 10);
    const mGold = phong(0xd9b22a, 0x888888, 60), mSilver = phong(0xd2d2cf, 0x999999, 70), mBlack = phong(0x15161a, 0x222222, 25);
    const mHole = lambert(0x120d04), mHeader = M.plastic;

    // برد با چهار سوراخ نصب
    (function(){
      const hw = BW / 2, hh = BH / 2, r = .5, s = new T.Shape();
      s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r); s.lineTo(hw, hh - r);
      s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const hx = hw - 1.5, hy = hh - 1.4;
      [[-hx, -hy], [hx, -hy], [-hx, hy], [hx, hy]].forEach(p => { const h = new T.Path(); h.absarc(p[0], p[1], .8, 0, Math.PI * 2, true); s.holes.push(h); });
      const bg = new T.ExtrudeGeometry(s, {depth:BT, bevelEnabled:false, curveSegments:24});
      bg.rotateX(-HALF); bg.translate(0, -BT, 0);
      m.add(new T.Mesh(bg, [mBoard, mEdge]));
    })();

    // روکش ابریشمی: نام پایه‌ها، NANO، LEDها، ریست و ICSP روی یک صفحهٔ شفاف
    (function(){
      const S = 40, cv = document.createElement('canvas'); cv.width = BW * S; cv.height = BH * S;
      const c2 = cv.getContext('2d'), X = x => (x + BW / 2) * S, Z = z => (z + BH / 2) * S;
      c2.fillStyle = 'rgba(214,177,42,.95)';
      [[-9.6,-5.6],[-12.8,3.4],[-14.6,1.8],[-3.8,6.3],[-.6,5.2],[2.2,-5.6],[6,5.4],[11.4,6],[14.2,-5.8],[12.6,5.4],[16.6,-1],[15.2,3],[-16.4,5.6],[8.3,-5.9]]
        .forEach(p => { c2.beginPath(); c2.arc(X(p[0]), Z(p[1]), .26 * S, 0, Math.PI * 2); c2.fill(); });
      c2.fillStyle = 'rgba(190,196,210,.5)'; c2.fillRect(X(3.5 - 2.2), Z(-.5 - 4.3), 4.4 * S, 8.6 * S);
      const WH = 'rgba(248,250,255,.96)'; c2.fillStyle = WH; c2.strokeStyle = WH;
      const tx = (t, x, z, size, rot, align) => {
        c2.save(); c2.translate(X(x), Z(z)); if(rot) c2.rotate(rot);
        c2.font = '700 ' + (size * S) + 'px Arial, Helvetica, sans-serif'; c2.textAlign = align || 'center'; c2.textBaseline = 'middle';
        c2.fillText(t, 0, 0); c2.restore();
      };
      const TOP = ['D12','D11','D10','D9','D8','D7','D6','D5','D4','D3','D2','GND','RST','RX0','TX1'];
      const BOT = ['D13','3V3','REF','A0','A1','A2','A3','A4','A5','A6','A7','5V','RST','GND','VIN'];
      for(let i = 0; i < 15; i++){ tx(TOP[i], X0 + i * PITCH, -5.9, 1.2); tx(BOT[i], X0 + i * PITCH, 5.9, 1.2); }
      tx('NANO', .7, .3, 1.8, -HALF);
      c2.lineWidth = .14 * S; c2.lineCap = 'butt'; c2.lineJoin = 'miter';
      const LZ = [-3.9, -1.4, 1.1, 3.6], LN = ['RX', 'TX', 'POW', 'L'];
      for(let k = 0; k < 4; k++){
        c2.beginPath(); c2.moveTo(X(9.3), Z(LZ[k] - .95)); c2.lineTo(X(12.1), Z(LZ[k] - .95)); c2.lineTo(X(12.1), Z(LZ[k] + .95)); c2.lineTo(X(9.3), Z(LZ[k] + .95)); c2.stroke();
        tx(LN[k], 12.5, LZ[k], 1.4, 0, 'left');
      }
      c2.strokeRect(X(15.3), Z(-4.5), 6.2 * S, 9 * S); tx('1', 20.2, 4.9, 1.5);
      const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
      const pl = new T.Mesh(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
      pl.rotation.x = -HALF; pl.position.y = .02; m.add(pl);
    })();

    // پدها + پایه‌ها (بدنه و نوک هرمی) + بلوک پلاستیکی هدر زیر برد
    const padGeo = new T.CircleGeometry(1.05, 28).rotateX(-HALF), holeGeo = new T.CircleGeometry(.55, 20).rotateX(-HALF);
    const pinGeo = new T.BoxGeometry(.64, 12.7, .64), tipGeo = new T.ConeGeometry(.42, .5, 4).rotateY(Math.PI / 4);
    const addPad = (x, z, square) => {
      const p = square ? new T.Mesh(new T.BoxGeometry(2.1, .05, 2.1), mGold) : new T.Mesh(padGeo, mGold);
      put(p, x, square ? .06 : .05, z); put(new T.Mesh(holeGeo, mHole), x, .09, z);
    };
    for(let i = 0; i < 15; i++) [-ROW, ROW].forEach(z => {
      const x = X0 + i * PITCH;
      addPad(x, z, i === 14);
      put(new T.Mesh(pinGeo, M.gold), x, -3.75, z); put(new T.Mesh(tipGeo, M.gold), x, 2.85, z);
      bx(2.46, 2.5, 2.46, mHeader, x, -BT - 1.25, z);
    });
    [-2.54, 0, 2.54].forEach(z => { addPad(17.4, z, false); addPad(19.94, z, z > 2); });      // ICSP بدون پین

    // USB‑C
    (function(){
      const u = new T.Group(); put(u, -20.2, 0, 0);
      const L = 7.3, HH = 1.63, HW = 4.47, cy = .15 + HH, F = 1.8, xf = -L / 2;
      const stad = (hw, hh) => { const s = new T.Shape(); s.moveTo(-hw + hh, -hh); s.lineTo(hw - hh, -hh); s.absarc(hw - hh, 0, hh, -HALF, HALF, false); s.lineTo(-hw + hh, hh); s.absarc(-hw + hh, 0, hh, HALF, HALF * 3, false); return s; };
      const hollow = (hw, hh, iw, ih) => { const s = stad(hw, hh); s.holes.push(new T.Path(stad(iw, ih).getPoints(40))); return s; };
      const tubeX = (shape, depth, x0, mt) => { const geo = new T.ExtrudeGeometry(shape, {depth, bevelEnabled:false, curveSegments:32}); geo.rotateY(-HALF); put(new T.Mesh(geo, mt), x0, cy, 0, u); };
      const metal = phong(0xd6d7da, 0xaaaaaa, 80), dark = phong(0x0c0c0f, 0x111111, 10);
      tubeX(stad(HW, HH), L - F, L / 2, metal);
      tubeX(hollow(HW, HH, 4.17, 1.28), F - .35, xf + F, metal);
      tubeX(hollow(HW + .14, HH + .14, 4.17, 1.28), .35, xf + .35, metal);
      tubeX(hollow(4.16, 1.27, 4.05, 1.16), F, xf + F, dark);
      tubeX(stad(4.08, 1.19), .05, xf + F, phong(0x050507, 0x111111, 10));
      bx(1.5, .7, 6.7, phong(0x2c2c33, 0x222222, 20), xf + 1, cy, 0, u);
      for(let k = 0; k < 12; k++){ const zz = (k - 5.5) * .5; bx(.9, .04, .28, mGold, xf + .9, cy + .36, zz, u); bx(.9, .04, .28, mGold, xf + .9, cy - .36, zz, u); }
      for(let j = 0; j < 6; j++) bx(.9, .1, .3, mSilver, L / 2 + .4, .2, (j - 2.5) * .85, u);
      [[-1.4, -4.95], [-1.4, 4.95], [2.3, -4.95], [2.3, 4.95]].forEach(p => bx(1.3, .3, 1, mSilver, p[0], .2, p[1], u));
    })();

    // ATmega328P (TQFP‑32)
    (function(){
      const c = new T.Group(); put(c, -6.8, 0, 0); c.rotation.y = Math.PI / 4;
      bx(7, 1, 7, phong(0x17181c, 0x333333, 40), 0, .6, 0, c);
      put(new T.Mesh(new T.CylinderGeometry(.35, .35, .05, 18), phong(0xb9bbc2, 0x555555, 30)), 2.5, 1.12, 2.5, c);
      for(let k = 0; k < 8; k++){
        const o = (k - 3.5) * .8;
        bx(1.1, .18, .36, mSilver, 4, .2, o, c); bx(1.1, .18, .36, mSilver, -4, .2, o, c);
        bx(.36, .18, 1.1, mSilver, o, .2, 4, c); bx(.36, .18, 1.1, mSilver, o, .2, -4, c);
      }
    })();

    // رزوناتور ۱۶ مگاهرتز
    (function(){
      const r = new T.Group(); put(r, -.5, 0, -4.6); r.rotation.y = -Math.PI / 4;
      bx(2.6, .9, 1.5, phong(0x4c5059, 0x333333, 30), 0, .55, 0, r);
      bx(.55, .7, 1.45, mGold, -1.5, .45, 0, r); bx(.55, .7, 1.45, mGold, 1.5, .45, 0, r); bx(.4, .3, 1.4, mGold, 0, .25, 0, r);
    })();

    // کلید ریست
    (function(){
      const s = new T.Group(); put(s, 3.5, 0, -.5);
      bx(3.8, .6, 5.2, phong(0x1f1f22, 0x222222, 20), 0, .4, 0, s); bx(3.8, .7, 5.2, phong(0xe4e2dc, 0x444444, 25), 0, 1.05, 0, s);
      bx(3, .4, 3.8, phong(0xefede8, 0x444444, 25), 0, 1.6, 0, s); bx(1.9, .7, 2.6, phong(0xd1242a, 0x663333, 40), 0, 2.15, 0, s);
      bx(1.4, .25, 1.7, mSilver, 0, .2, 3.1, s); bx(1.4, .25, 1.7, mSilver, 0, .2, -3.1, s);
    })();

    // چهار مقاومت و LED کوچک SMD
    [-3.9, -1.4, 1.1, 3.6].forEach((z, k) => {
      const r = new T.Group(); put(r, 7.5, 0, z);
      bx(1, .45, .8, mBlack, 0, .33, 0, r); bx(.3, .5, .82, mSilver, -.65, .35, 0, r); bx(.3, .5, .82, mSilver, .65, .35, 0, r);
      const l = new T.Group(); put(l, 10.3, 0, z);
      bx(1, .5, .85, phong([0xf1e9d8, 0xf1e9d8, 0xcdeed8, 0xf1e0c8][k], 0x333333, 30), 0, .35, 0, l);
      bx(.3, .52, .87, mGold, -.65, .35, 0, l); bx(.3, .52, .87, mGold, .65, .35, 0, l);
    });
  };

  /* ESP32‑WROOM‑32 (۳۸ پین) — همان مدل فایل «ESP32‑WROOM‑32 38‑Pin»: برد مشکی ۵۲×۲۸×۱٫۶، USB‑C، ماژول با آنتن PCB،
     CP2102، رگولاتور، کلیدهای EN و BOOT، LEDها و دو ردیف پین ۱×۱۹. مبدأ = مرکز برد (USB سمت چپ)؛ پایه‌ها از برد اصلی
     رد می‌شوند و بدنهٔ ماژول ۲٫۵ میلی‌متر بالاتر روی هدرهای پلاستیکی می‌نشیند. */
  REAL.ESP32 = g => {
    const BW = 52, BH = 28, BT = 1.6, PITCH = 2.54, ROW = 12.7, LIFT = BT + 2.5;
    const m = new T.Group(); m.position.set(0, LIFT, 0); g.add(m);
    const put = (o, x, y, z, p) => { o.position.set(x, y, z); (p || m).add(o); return o; };
    const bx = (w, h, d, mt, x, y, z, p) => put(box(w, h, d, mt), x, y, z, p);
    const mBoard = phong(0x15161a, 0x2a2b30, 25), mEdge = phong(0x2b261a, 0x111111, 10);
    const mGold = phong(0xd9b22a, 0x888888, 60), mSilver = phong(0xd2d2cf, 0x999999, 70), mBlack = phong(0x15161a, 0x222222, 25);
    const mHole = lambert(0x120d04), mHeader = M.plastic;
    const px = i => (i - 9) * PITCH;
    const TOPN = ['5V','CMD','SD3','SD2','D13','GND','D12','D14','D27','D26','D25','D33','D32','D35','D34','VN','VP','EN','3V3'];
    const BOTN = ['CLK','SD0','SD1','D15','D2','D0','D4','RX2','TX2','D5','D18','D19','GND','D21','RX0','TX0','D22','D23','GND'];

    // برد با گوشه‌های گرد
    (function(){
      const hw = BW / 2, hh = BH / 2, r = 1.2, s = new T.Shape();
      s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r); s.lineTo(hw, hh - r);
      s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const bg = new T.ExtrudeGeometry(s, {depth:BT, bevelEnabled:false, curveSegments:24});
      bg.rotateX(-HALF); bg.translate(0, -BT, 0);
      m.add(new T.Mesh(bg, [mBoard, mEdge]));
    })();

    // روکش ابریشمی: نام پایه‌ها، ESP32، EN/BOOT و قاب ماژول
    (function(){
      const S = 40, cv = document.createElement('canvas'); cv.width = BW * S; cv.height = BH * S;
      const c2 = cv.getContext('2d'), X = x => (x + BW / 2) * S, Z = z => (z + BH / 2) * S;
      c2.fillStyle = 'rgba(214,177,42,.95)';
      [[-14.2,-7.6],[-14.2,7.7],[-20.4,0],[-4.8,3.4],[-3.4,-3.6],[-1.4,2.6],[.8,-10.6],[.8,10.6],[-24.6,-9.2],[-24.6,9.2],[24.4,-10.8],[24.4,10.8]]
        .forEach(p => { c2.beginPath(); c2.arc(X(p[0]), Z(p[1]), .26 * S, 0, Math.PI * 2); c2.fill(); });
      const WH = 'rgba(248,250,255,.96)'; c2.fillStyle = WH; c2.strokeStyle = WH;
      const tx = (t, x, z, size, rot, align) => {
        c2.save(); c2.translate(X(x), Z(z)); if(rot) c2.rotate(rot);
        c2.font = '700 ' + (size * S) + 'px Arial, Helvetica, sans-serif'; c2.textAlign = align || 'center'; c2.textBaseline = 'middle';
        c2.fillText(t, 0, 0); c2.restore();
      };
      for(let i = 0; i < 19; i++){ tx(TOPN[i], px(i), -(ROW - 1.35), .95, HALF, 'left'); tx(BOTN[i], px(i), ROW - 1.35, .95, -HALF, 'left'); }
      tx('ESP32', -18, 0, 1.9, -HALF); tx('EN', -17.5, -4.3, 1.1); tx('BOOT', -17.5, 4.3, 1.1);
      c2.lineWidth = .12 * S; c2.lineCap = 'butt'; c2.strokeStyle = 'rgba(248,250,255,.55)';
      c2.strokeRect(X(-.6), Z(-9.6), 26.4 * S, 19.2 * S);
      const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
      const pl = new T.Mesh(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
      pl.rotation.x = -HALF; pl.position.y = .02; m.add(pl);
    })();

    // پدها + پایه‌ها (بدنه و نوک هرمی) + بلوک پلاستیکی هدر زیر برد
    const padGeo = new T.CircleGeometry(1.05, 28).rotateX(-HALF), holeGeo = new T.CircleGeometry(.55, 20).rotateX(-HALF);
    const pinGeo = new T.BoxGeometry(.64, 12.7, .64), tipGeo = new T.ConeGeometry(.42, .5, 4).rotateY(Math.PI / 4);
    for(let i = 0; i < 19; i++) [-ROW, ROW].forEach(z => {
      const x = px(i);
      put(new T.Mesh(padGeo, mGold), x, .05, z); put(new T.Mesh(holeGeo, mHole), x, .09, z);
      put(new T.Mesh(pinGeo, M.gold), x, -3.75, z); put(new T.Mesh(tipGeo, M.gold), x, 2.85, z);
      bx(2.46, 2.5, 2.46, mHeader, x, -BT - 1.25, z);
    });

    // USB‑C
    (function(){
      const u = new T.Group(); put(u, -BW / 2 + 2.3, 0, 0);
      const L = 7.3, HH = 1.63, HW = 4.47, cy = .15 + HH, F = 1.8, xf = -L / 2;
      const stad = (hw, hh) => { const s = new T.Shape(); s.moveTo(-hw + hh, -hh); s.lineTo(hw - hh, -hh); s.absarc(hw - hh, 0, hh, -HALF, HALF, false); s.lineTo(-hw + hh, hh); s.absarc(-hw + hh, 0, hh, HALF, HALF * 3, false); return s; };
      const hollow = (hw, hh, iw, ih) => { const s = stad(hw, hh); s.holes.push(new T.Path(stad(iw, ih).getPoints(40))); return s; };
      const tubeX = (shape, depth, x0, mt) => { const geo = new T.ExtrudeGeometry(shape, {depth, bevelEnabled:false, curveSegments:32}); geo.rotateY(-HALF); put(new T.Mesh(geo, mt), x0, cy, 0, u); };
      const metal = phong(0xd6d7da, 0xaaaaaa, 80), dark = phong(0x0c0c0f, 0x111111, 10);
      tubeX(stad(HW, HH), L - F, L / 2, metal);
      tubeX(hollow(HW, HH, 4.17, 1.28), F - .35, xf + F, metal);
      tubeX(hollow(HW + .14, HH + .14, 4.17, 1.28), .35, xf + .35, metal);
      tubeX(hollow(4.16, 1.27, 4.05, 1.16), F, xf + F, dark);
      tubeX(stad(4.08, 1.19), .05, xf + F, phong(0x050507, 0x111111, 10));
      bx(1.5, .7, 6.7, phong(0x2c2c33, 0x222222, 20), xf + 1, cy, 0, u);
      for(let k = 0; k < 12; k++){ const zz = (k - 5.5) * .5; bx(.9, .04, .28, mGold, xf + .9, cy + .36, zz, u); bx(.9, .04, .28, mGold, xf + .9, cy - .36, zz, u); }
      for(let j = 0; j < 6; j++) bx(.9, .1, .3, mSilver, L / 2 + .4, .2, (j - 2.5) * .85, u);
      [[-1.4, -4.95], [-1.4, 4.95], [2.3, -4.95], [2.3, 4.95]].forEach(p => bx(1.3, .3, 1, mSilver, p[0], .2, p[1], u));
    })();

    // ماژول ESP32‑WROOM‑32: برد کوچک مشکی، آنتن PCB، قاب فلزی و لبه‌های پد‌دار
    (function(){
      const MX0 = -.2, MLEN = 25.5, MW = 18, PT = .8, PY = .12, pcbTop = PY + PT;
      bx(MLEN, PT, MW, phong(0x121317, 0x222222, 20), MX0 + MLEN / 2, PY + PT / 2, 0);
      const AX0 = 19.35, AW = MX0 + MLEN - AX0, k = 100;
      const ac = document.createElement('canvas'); ac.width = Math.round(AW * k); ac.height = MW * k;
      const ag = ac.getContext('2d'); ag.fillStyle = '#121317'; ag.fillRect(0, 0, ac.width, ac.height);
      ag.strokeStyle = '#d3ad4f'; ag.lineWidth = .34 * k; ag.lineCap = 'butt'; ag.lineJoin = 'miter';
      const path = [[0,9],[.7,9],[.7,3.2],[1.6,3.2],[1.6,15.2],[2.5,15.2],[2.5,3.2],[3.4,3.2],[3.4,15.2],[4.3,15.2],[4.3,5.6],[5.2,5.6],[5.2,1.6]];
      ag.beginPath(); path.forEach((p, n) => { if(n) ag.lineTo(p[0] * k, p[1] * k); else ag.moveTo(p[0] * k, p[1] * k); }); ag.stroke();
      ag.beginPath(); ag.moveTo(0, 16.8 * k); ag.lineTo(5.4 * k, 16.8 * k); ag.lineTo(5.4 * k, 13.6 * k); ag.stroke();
      const am = new T.MeshPhongMaterial({map:new T.CanvasTexture(ac), shininess:20});
      put(new T.Mesh(new T.PlaneGeometry(AW, MW), am), AX0 + AW / 2, pcbTop + .01, 0).rotation.x = -HALF;

      const SX0 = .15, SL = 19.2, SW = 17.2;
      const tc = document.createElement('canvas'); tc.width = Math.round(SL * 60); tc.height = Math.round(SW * 60);
      const tg = tc.getContext('2d'), gr = tg.createLinearGradient(0, 0, tc.width, tc.height);
      gr.addColorStop(0, '#d9dbdf'); gr.addColorStop(.5, '#c3c6cb'); gr.addColorStop(1, '#d2d4d8');
      tg.fillStyle = gr; tg.fillRect(0, 0, tc.width, tc.height);
      tg.strokeStyle = 'rgba(70,74,82,.45)'; tg.lineWidth = .12 * 60; tg.strokeRect(.7 * 60, .7 * 60, tc.width - 1.4 * 60, tc.height - 1.4 * 60);
      tg.fillStyle = '#31343a'; tg.font = '700 ' + (1.4 * 60) + 'px Arial, Helvetica, sans-serif'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
      tg.fillText('ESP32-WROOM-32', tc.width / 2, tc.height / 2);
      const shell = phong(0xc9ccd0, 0xbbbbbb, 90), top = phong(0xffffff, 0x777777, 60); top.map = new T.CanvasTexture(tc);
      bx(SL + .2, .25, SW + .2, phong(0xa9acb1, 0x888888, 60), SX0 + SL / 2, pcbTop + .125, 0);
      put(new T.Mesh(new T.BoxGeometry(SL, 2.05, SW), [shell, shell, top, shell, shell, shell]), SX0 + SL / 2, pcbTop + .25 + 1.025, 0);
      for(let n = 0; n < 14; n++){
        const cx = MX0 + 1.6 + n * 1.27;
        [-1, 1].forEach(sg => { bx(.8, .06, .9, mGold, cx, .07, sg * 9.25); bx(.7, PT - .1, .12, mGold, cx, PY + PT / 2, sg * 9); });
      }
    })();

    // قطعات SMD
    const sm = (x, z, rot, fn) => { const q = new T.Group(); put(q, x, 0, z); q.rotation.y = rot || 0; fn(q); };
    const resistor = (x, z, rot) => sm(x, z, rot, q => { bx(1, .4, .8, mBlack, 0, .3, 0, q); bx(.3, .48, .84, mSilver, -.65, .32, 0, q); bx(.3, .48, .84, mSilver, .65, .32, 0, q); });
    const capacitor = (x, z, rot) => sm(x, z, rot, q => { bx(1, .4, .8, phong(0xb08a5a, 0x333333, 20), 0, .3, 0, q); bx(.3, .48, .84, mSilver, -.65, .32, 0, q); bx(.3, .48, .84, mSilver, .65, .32, 0, q); });
    const smdLed = (x, z, col) => sm(x, z, 0, q => { bx(1, .4, .8, phong(col, 0x333333, 30), 0, .3, 0, q); bx(.3, .48, .84, mGold, -.65, .32, 0, q); bx(.3, .48, .84, mGold, .65, .32, 0, q); });
    const sot23 = (x, z) => sm(x, z, 0, q => { bx(2.9, .9, 1.3, mBlack, 0, .55, 0, q); [[-.95, -.9], [.95, -.9], [0, .9]].forEach(p => bx(.4, .15, .5, mSilver, p[0], .2, p[1], q)); });
    const tantalum = (x, z) => sm(x, z, 0, q => { bx(3.2, 1.5, 1.6, phong(0xe0a53a, 0x444444, 30), 0, .85, 0, q); bx(.4, 1.52, 1.62, phong(0x3a2f22, 0x222222, 20), -1.3, .86, 0, q); });
    const tact = (x, z) => sm(x, z, 0, q => { bx(6, .32, 3.4, mSilver, 0, .28, 0, q); bx(4.4, 1.5, 3, phong(0x1d1d21, 0x222222, 20), 0, 1.19, 0, q); bx(2, .55, 1.6, phong(0x7f8188, 0x555555, 30), 0, 2.2, 0, q); });

    sm(-12.8, 0, 0, q => {                       // CP2102 (QFN‑28)
      bx(5, .8, 5, phong(0x16171b, 0x333333, 30), 0, .5, 0, q);
      for(let k = 0; k < 7; k++){ const o = (k - 3) * .5; bx(.5, .1, .25, mSilver, 2.75, .15, o, q); bx(.5, .1, .25, mSilver, -2.75, .15, o, q); bx(.25, .1, .5, mSilver, o, .15, 2.75, q); bx(.25, .1, .5, mSilver, o, .15, -2.75, q); }
      put(new T.Mesh(new T.CylinderGeometry(.25, .25, .04, 16), phong(0xb9bbc2, 0x555555, 30)), -1.8, .92, -1.8, q);
    });
    sm(-8, 6, 0, q => {                          // رگولاتور AMS1117 (SOT‑223)
      bx(3.5, 1.6, 6.5, phong(0x1a1b1f, 0x333333, 30), 0, .95, 0, q); bx(1.5, .3, 3, mSilver, 2.5, .35, 0, q);
      [-2.3, 0, 2.3].forEach(o => bx(1, .2, .7, mSilver, -2.25, .25, o, q));
    });
    tact(-17.5, -7.2); tact(-17.5, 7.2);
    sot23(-12.8, -4.7); sot23(-12.8, 4.7);
    smdLed(-6, -6.8, 0xf0d8d4); smdLed(-6, -4.6, 0xdde8f4);
    resistor(-8.4, -6.8); resistor(-8.4, -4.6);
    tantalum(-2.6, 6); tantalum(-2.6, -7.2);
    [[-8.2, 0], [-8.2, -1.6], [-8.2, 1.6], [-5.6, 0], [-5.6, 1.6], [-5.6, -1.8], [-2.6, 0], [-2.6, -2.2]].forEach(p => capacitor(p[0], p[1], (p[0] === -5.6 || p[0] === -2.6) ? Math.PI / 2 : 0));
  };

  /* STM32F103C8T6 Blue Pill — همان مدل فایل «STM32F103C8T6 Blue Pill»: برد آبی ۵۳٫۳×۲۲٫۹×۱٫۶، USB‑C، STM32 (LQFP‑48)،
     کریستال ۸ مگاهرتز، رگولاتور، کلید RESET، دو جامپر BOOT، LEDها، هدر SWD و دو ردیف پین ۱×۲۰. مبدأ = مرکز برد (USB سمت چپ)؛
     پایه‌ها از برد اصلی رد می‌شوند و بدنهٔ ماژول ۲٫۵ میلی‌متر بالاتر روی هدرهای پلاستیکی می‌نشیند. */
  REAL.BLUEPILL = g => {
    const BW = 53.3, BH = 22.9, BT = 1.6, PITCH = 2.54, ROW = 8.89, LIFT = BT + 2.5;
    const m = new T.Group(); m.position.set(0, LIFT, 0); g.add(m);
    const put = (o, x, y, z, p) => { o.position.set(x, y, z); (p || m).add(o); return o; };
    const bx = (w, h, d, mt, x, y, z, p) => put(box(w, h, d, mt), x, y, z, p);
    const mBoard = phong(0x1a3f9e, 0x334477, 35), mEdge = phong(0x123a5a, 0x111111, 10);
    const mGold = phong(0xd9b22a, 0x888888, 60), mSilver = phong(0xd2d2cf, 0x999999, 70), mBlack = phong(0x15161a, 0x222222, 25);
    const mHole = lambert(0x120d04), mHeader = M.plastic, mCap = phong(0xb08a5a, 0x333333, 20), mJumper = phong(0xe8b81c, 0x555555, 30);
    const px = i => (i - 9.5) * PITCH;
    const TOPN = ['3.3','G','5V','B9','B8','B7','B6','B5','B4','B3','A15','A12','A11','A10','A9','A8','B15','B14','B13','B12'];
    const BOTN = ['VB','C13','C14','C15','A0','A1','A2','A3','A4','A5','A6','A7','B0','B1','B10','B11','R','3.3','G','G'];

    // برد با گوشه‌های گرد
    (function(){
      const hw = BW / 2, hh = BH / 2, r = 1, s = new T.Shape();
      s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r); s.lineTo(hw, hh - r);
      s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const bg = new T.ExtrudeGeometry(s, {depth:BT, bevelEnabled:false, curveSegments:24});
      bg.rotateX(-HALF); bg.translate(0, -BT, 0);
      m.add(new T.Mesh(bg, [mBoard, mEdge]));
    })();

    // روکش ابریشمی: نام پایه‌ها، RESET، BOOT0/1، SWD و قاب قطعات
    (function(){
      const S = 40, cv = document.createElement('canvas'); cv.width = Math.round(BW * S); cv.height = Math.round(BH * S);
      const c2 = cv.getContext('2d'), X = x => (x + BW / 2) * S, Z = z => (z + BH / 2) * S;
      c2.fillStyle = 'rgba(214,177,42,.95)';
      [[-9.6,-5],[-.6,5],[-.4,-5.1],[12,-5],[17.2,5],[22.4,5]].forEach(p => { c2.beginPath(); c2.arc(X(p[0]), Z(p[1]), .26 * S, 0, Math.PI * 2); c2.fill(); });
      const WH = 'rgba(248,250,255,.96)'; c2.fillStyle = WH; c2.strokeStyle = WH;
      const tx = (t, x, z, size, rot, align) => {
        c2.save(); c2.translate(X(x), Z(z)); if(rot) c2.rotate(rot);
        c2.font = '700 ' + (size * S) + 'px Arial, Helvetica, sans-serif'; c2.textAlign = align || 'center'; c2.textBaseline = 'middle';
        c2.fillText(t, 0, 0); c2.restore();
      };
      for(let i = 0; i < 20; i++){ tx(TOPN[i], px(i), -(ROW - 1.35), .95, HALF, 'left'); tx(BOTN[i], px(i), ROW - 1.35, .95, -HALF, 'left'); }
      tx('RESET', -17, 1.2, .9); tx('BOOT0', -8.8, -3, .9, 0, 'left'); tx('BOOT1', -8.8, -.46, .9, 0, 'left');
      tx('3V3', 23.15, -3.81, .85, 0, 'right'); tx('DIO', 23.15, -1.27, .85, 0, 'right'); tx('CLK', 23.15, 1.27, .85, 0, 'right'); tx('GND', 23.15, 3.81, .85, 0, 'right');
      c2.lineWidth = .12 * S; c2.lineCap = 'butt'; c2.strokeStyle = 'rgba(248,250,255,.55)';
      c2.strokeRect(X(3 - 4.95), Z(-4.95), 9.9 * S, 9.9 * S); c2.strokeRect(X(14.2 - 6.3), Z(-2.9), 12.6 * S, 5.8 * S);
      const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
      const pl = new T.Mesh(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
      pl.rotation.x = -HALF; pl.position.y = .02; m.add(pl);
    })();

    // پدها + پایه‌ها (بدنه و نوک هرمی) + بلوک پلاستیکی هدر زیر برد
    const padGeo = new T.CircleGeometry(1.05, 28).rotateX(-HALF), holeGeo = new T.CircleGeometry(.55, 20).rotateX(-HALF);
    const pinGeo = new T.BoxGeometry(.64, 12.7, .64), tipGeo = new T.ConeGeometry(.42, .5, 4).rotateY(Math.PI / 4);
    for(let i = 0; i < 20; i++) [-ROW, ROW].forEach(z => {
      const x = px(i);
      put(new T.Mesh(padGeo, mGold), x, .05, z); put(new T.Mesh(holeGeo, mHole), x, .09, z);
      put(new T.Mesh(pinGeo, M.gold), x, -3.75, z); put(new T.Mesh(tipGeo, M.gold), x, 2.85, z);
      bx(2.46, 2.5, 2.46, mHeader, x, -BT - 1.25, z);
    });

    // USB‑C
    (function(){
      const u = new T.Group(); put(u, -BW / 2 + 2.3, 0, 0);
      const L = 7.3, HH = 1.63, HW = 4.47, cy = .15 + HH, F = 1.8, xf = -L / 2;
      const stad = (hw, hh) => { const s = new T.Shape(); s.moveTo(-hw + hh, -hh); s.lineTo(hw - hh, -hh); s.absarc(hw - hh, 0, hh, -HALF, HALF, false); s.lineTo(-hw + hh, hh); s.absarc(-hw + hh, 0, hh, HALF, HALF * 3, false); return s; };
      const hollow = (hw, hh, iw, ih) => { const s = stad(hw, hh); s.holes.push(new T.Path(stad(iw, ih).getPoints(40))); return s; };
      const tubeX = (shape, depth, x0, mt) => { const geo = new T.ExtrudeGeometry(shape, {depth, bevelEnabled:false, curveSegments:32}); geo.rotateY(-HALF); put(new T.Mesh(geo, mt), x0, cy, 0, u); };
      const metal = phong(0xd6d7da, 0xaaaaaa, 80), dark = phong(0x0c0c0f, 0x111111, 10);
      tubeX(stad(HW, HH), L - F, L / 2, metal);
      tubeX(hollow(HW, HH, 4.17, 1.28), F - .35, xf + F, metal);
      tubeX(hollow(HW + .14, HH + .14, 4.17, 1.28), .35, xf + .35, metal);
      tubeX(hollow(4.16, 1.27, 4.05, 1.16), F, xf + F, dark);
      tubeX(stad(4.08, 1.19), .05, xf + F, phong(0x050507, 0x111111, 10));
      bx(1.5, .7, 6.7, phong(0x2c2c33, 0x222222, 20), xf + 1, cy, 0, u);
      for(let k = 0; k < 12; k++){ const zz = (k - 5.5) * .5; bx(.9, .04, .28, mGold, xf + .9, cy + .36, zz, u); bx(.9, .04, .28, mGold, xf + .9, cy - .36, zz, u); }
      for(let j = 0; j < 6; j++) bx(.9, .1, .3, mSilver, L / 2 + .4, .2, (j - 2.5) * .85, u);
      [[-1.4, -4.75], [-1.4, 4.75], [2.3, -4.75], [2.3, 4.75]].forEach(p => bx(1.3, .3, 1, mSilver, p[0], .2, p[1], u));
    })();

    // قطعات SMD
    const sm = (x, z, fn) => { const q = new T.Group(); put(q, x, 0, z); fn(q); };
    const smd2 = (x, z, mt) => sm(x, z, q => { bx(1.2, .5, 1.2, mt, 0, .35, 0, q); bx(.4, .56, 1.25, mSilver, -.8, .38, 0, q); bx(.4, .56, 1.25, mSilver, .8, .38, 0, q); });
    const smdLed = (x, z, col) => sm(x, z, q => { bx(1.2, .5, 1.2, phong(col, 0x333333, 30), 0, .35, 0, q); bx(.4, .56, 1.25, mGold, -.8, .38, 0, q); bx(.4, .56, 1.25, mGold, .8, .38, 0, q); });
    const tact = (x, z) => sm(x, z, q => { bx(6, .32, 3.4, mSilver, 0, .28, 0, q); bx(4.4, 1.5, 3, phong(0x1d1d21, 0x222222, 20), 0, 1.19, 0, q); bx(2, .55, 1.6, phong(0x7f8188, 0x555555, 30), 0, 2.2, 0, q); });
    const bootHeader = (x0, z) => {      // هدر ۳پین BOOT با جامپر زرد روی دو پین اول
      bx(7.62, 2.5, 2.54, mHeader, x0 + 2.54, 1.25, z);
      for(let k = 0; k < 3; k++) bx(.64, 5.8, .64, M.gold, x0 + k * 2.54, 2.9, z);
      bx(5, 2.6, 2.4, mJumper, x0 + 1.27, 3.8, z);
    };

    sm(3, 0, q => {                       // STM32F103C8T6 (LQFP‑48)
      const tc = document.createElement('canvas'); tc.width = tc.height = 700;
      const c = tc.getContext('2d'); c.fillStyle = '#17181c'; c.fillRect(0, 0, 700, 700);
      c.fillStyle = 'rgba(205,208,216,.92)'; c.font = '700 84px Arial, Helvetica, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('STM32', 120, 270); c.fillText('F103C8T6', 120, 370);
      c.fillStyle = 'rgba(70,73,82,1)'; c.beginPath(); c.arc(95, 95, 30, 0, Math.PI * 2); c.fill();
      const side = phong(0x17181c, 0x333333, 40), top = phong(0xffffff, 0x444444, 40); top.map = new T.CanvasTexture(tc);
      put(new T.Mesh(new T.BoxGeometry(7, 1.2, 7), [side, side, top, side, side, side]), 0, .7, 0, q);
      for(let k = 0; k < 12; k++){ const o = (k - 5.5) * .5; bx(1, .12, .22, mSilver, 4, .2, o, q); bx(1, .12, .22, mSilver, -4, .2, o, q); bx(.22, .12, 1, mSilver, o, .2, 4, q); bx(.22, .12, 1, mSilver, o, .2, -4, q); }
    });
    sm(14.2, 0, q => {                    // کریستال ۸ مگاهرتز
      const tc = document.createElement('canvas'); tc.width = 648; tc.height = 264;
      const c = tc.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 264); gr.addColorStop(0, '#dcdee2'); gr.addColorStop(1, '#bfc2c7');
      c.fillStyle = gr; c.fillRect(0, 0, 648, 264); c.fillStyle = '#2d3036'; c.font = '700 96px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('8.000', 324, 136);
      const shell = phong(0xc9ccd0, 0xbbbbbb, 90), top = phong(0xffffff, 0x777777, 60); top.map = new T.CanvasTexture(tc);
      bx(11.4, .5, 4.7, phong(0x1c1c20, 0x222222, 20), 0, .35, 0, q);
      put(new T.Mesh(new T.BoxGeometry(10.8, 2.8, 4.4), [shell, shell, top, shell, shell, shell]), 0, 2, 0, q);
      bx(1.4, .08, 3.8, mGold, -5.9, .06, 0, q); bx(1.4, .08, 3.8, mGold, 5.9, .06, 0, q);
    });
    bx(3.2, 1, 1.5, phong(0xcfd1d5, 0xbbbbbb, 90), 11.4, .65, 3.9);      // کریستال ۳۲٫۷۶۸ کیلوهرتز
    bx(.7, .08, 1.5, mGold, 9.5, .06, 3.9); bx(.7, .08, 1.5, mGold, 13.3, .06, 3.9);
    sm(-6.5, 3, q => {                    // رگولاتور ۳٫۳ ولت (SOT‑89)
      bx(4, 1.4, 2.4, phong(0x1a1b1f, 0x333333, 30), 0, .8, 0, q);
      [-1.5, 0, 1.5].forEach(o => bx(.5, .15, .9, mSilver, o, .2, 1.65, q)); bx(1.8, .15, .9, mSilver, 0, .2, -1.65, q);
    });
    tact(-17, 3.6); bootHeader(-16, -3); bootHeader(-16, -.46);
    bx(2.54, 2.5, 10.16, mHeader, 24.5, 1.25, 0);                        // هدر SWD
    for(let k = 0; k < 4; k++) bx(.64, 5.8, .64, M.gold, 24.5, 2.9, (k - 1.5) * 2.54);
    smdLed(-3.6, -4.6, 0xf0d8d4); smdLed(-3.6, -1.8, 0xd8f0dc);
    smd2(-6, -4.6, mBlack); smd2(-6, -1.8, mBlack);
    [[-10.3, 3], [-3.2, 2], [-3.2, 3.5], [9, -4], [11.3, -4], [8.9, 3.9], [13.9, 3.9]].forEach(p => smd2(p[0], p[1], mCap));
  };

  /* قطعاتی که در فایل HTML نبودند: همان مدل ساده‌ی قبلی، با مقیاس میلی‌متر و متریال Phong */
  // کلید فشاری 6mm (SW_PUSH_6mm) — از فایل STEP؛ مبدأ = مرکز چهار پایه
  REAL.PB = (g, c) => {
    const m = modelGroup(g), s = new T.Group(); s.position.set(-3.15, 2.25, 0); m.add(s);
    const shell = phong(0xd2d1c7, 0x888888, 60), dark = phong(0x252525, 0x111111, 20);
    const put = (o, x, y, z) => { o.position.set(x, y, z); s.add(o); };
    const zcyl = (r, h, mt) => new T.Mesh(axisToZ(new T.CylinderGeometry(r, r, h, 32)), mt);
    put(box(6, 6, 3.5, shell), 3.15, -2.25, 1.75);
    put(zcyl(1.75, .8, dark), 3.15, -2.25, 3.9 - (c.on ? .35 : 0));
    [[1.15, -4.25], [5.15, -4.25], [1.15, -.25], [5.15, -.25]].forEach(p => put(zcyl(.5, .5, dark), p[0], p[1], 3.85));
    [0, 6.3].forEach(x => [0, -4.5].forEach(y => put(box(.3, .7, 5, M.silver), x, y, -1)));
  };
  const legs2 = (g, pins, rest, y) => pins.forEach(p => g.add(tube(P3(p[0], 0, p[1]), P3(p[0] * rest, y, 0), .09)));
  const LEGACY = {
    C(g){
      const b = cyl(.9, 1.9, mat('#17181c', {roughness:.4})); b.position.y = .95; g.add(b);
      const top = cyl(.91, .03, mat('#3a3d44', {roughness:.5})); top.position.y = 1.91; g.add(top);
      const stripe = box(.05, 1.7, .5, mat('#9aa0aa', {roughness:.5})); stripe.position.set(.9, .95, 0); g.add(stripe);
      g.add(tube(P3(-2, 0, 0), P3(-.45, .1, 0), .09)); g.add(tube(P3(2, 0, 0), P3(.45, .1, 0), .09));
      g.add(tube(P3(-.45, 0, 0), P3(-.45, .3, 0), .09)); g.add(tube(P3(.45, 0, 0), P3(.45, .3, 0), .09));
    },
    CP(g){
      const b = cyl(1.05, 2.2, mat('#1f3a78', {roughness:.45})); b.position.y = 1.1; g.add(b);
      const top = cyl(1.0, .03, M.metal); top.position.y = 2.21; g.add(top);
      const stripe = box(.05, 2.0, .7, mat('#e9edf5')); stripe.position.set(1.04, 1.1, 0); g.add(stripe);
      g.add(tube(P3(-2, 0, 0), P3(-.5, .1, 0), .09)); g.add(tube(P3(2, 0, 0), P3(.5, .1, 0), .09));
      g.add(tube(P3(-.5, 0, 0), P3(-.5, .3, 0), .09)); g.add(tube(P3(.5, 0, 0), P3(.5, .3, 0), .09));
    },
    BJT(g){
      const half = new T.Mesh(new T.CylinderGeometry(.9, .9, 1.5, 24, 1, false, -Math.PI / 2, Math.PI), M.black);
      half.rotation.y = Math.PI / 2; half.position.set(.15, 1.0, 0); g.add(half);
      const fl = box(.02, 1.5, 1.8, M.black); fl.position.set(.15, 1.0, 0); g.add(fl);
      g.add(tube(P3(-2, 0, 0), P3(.2, .55, 0), .09)); g.add(tube(P3(1, 0, -2), P3(.3, .55, -.4), .09)); g.add(tube(P3(1, 0, 2), P3(.3, .55, .4), .09));
    },
    SW(g, c){
      const b = box(3.0, 1.0, 1.7, mat('#2a2d34')); b.position.y = .5; g.add(b);
      const slot = box(1.8, .05, .5, M.black); slot.position.y = 1.02; g.add(slot);
      const lever = box(.6, .8, .45, mat('#d0d4db', {metalness:.4})); lever.position.set(c.on ? .6 : -.6, 1.3, 0); g.add(lever);
      legs2(g, [[-2,0],[2,0]], .75, .3);
    },
    LAMP(g, c){
      const lit = c.st === 'on';
      const base = cyl(.85, .9, mat('#aeb4be', {metalness:.7, roughness:.35})); base.position.y = .45; g.add(base);
      const glass = new T.Mesh(new T.SphereGeometry(1.3, 24, 18), mat(lit ? '#ffe27a' : '#cfe6ff', {transparent:true, opacity:lit ? .85 : .3, roughness:.1, emissive:lit ? '#ffd95a' : '#000', emissiveIntensity:lit ? 1.3 : 0}));
      glass.position.y = 2.0; g.add(glass);
      const fil = new T.Mesh(new T.TorusGeometry(.35, .04, 6, 18), mat('#f59e0b', {emissive:lit ? '#fff1a8' : '#000', emissiveIntensity:lit ? 1.5 : 0}));
      fil.position.y = 2.0; g.add(fil);
      g.add(tube(P3(-2, 0, 0), P3(-.6, .4, 0), .09)); g.add(tube(P3(2, 0, 0), P3(.6, .4, 0), .09));
      if(lit) glow(g, '#ffd95a', 2.0, 6.5);
    },
    DEFAULT(g){ const b = box(2.4, 1, 2.4, M.dark); b.position.y = .5; g.add(b); }
  };
  const legacy = (g, c) => {
    const s = new T.Group(); s.scale.setScalar(2.54); g.add(s);
    const f = (c.t === 'NPN' || c.t === 'PNP') ? LEGACY.BJT : LEGACY[c.t] || LEGACY.DEFAULT;
    f(s, c);
  };

  data.comps.forEach(c => {
    if(c.power) return;
    const g = new T.Group();
    const pc = c.hc || [c.x, c.y];
    g.position.set(pc[0] * MM, 0, pc[1] * MM);
    g.rotation.y = -(c.r & 3) * HALF;
    const fp = fpOf(c), fam = FAM(c.t);
    (REAL[fam] ? REAL[fam] : legacy)(g, c, fp);
    silkFor(g, c, fp);
    group.add(g);
    c.pins.forEach((p, i) => pad(p[0] * MM, p[1] * MM, i === 0));
    const lb = label(c.ref, '#c8c8c8', 2.0);
    lb.position.x = (c.box.x0 + c.box.x1) / 2 * MM; lb.position.z = c.box.y0 * MM - 2.2; group.add(lb);
    if(c.val){ const vl = label(c.val, '#9fa6b2', 1.7); vl.position.x = (c.box.x0 + c.box.x1) / 2 * MM; vl.position.z = c.box.y1 * MM + 2.2; group.add(vl); }
  });

  /* ---------- نور: عیناً مثل HTML ---------- */
  scene.add(new T.AmbientLight(0xffffff, .65));
  const key = new T.DirectionalLight(0xffffff, .62); key.position.set(0, 10, 0); scene.add(key);

  return {scene, rig, sprites, W:E.W, H:E.H};
}

/* ---------- صفحه: همان چیدمان HTML (عنوان، صحنهٔ بنفش، فهرست قطعات) ---------- */
function injectCss(){
  if(cssDone) return; cssDone = true;
  const lk = document.createElement('link');
  lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap';
  document.head.appendChild(lk);
  const s = document.createElement('style');
  s.textContent = `
.c3d2{--bg:#14131b;--fg:#ecebf4;--muted:#a09db4;--line:#34324a;--accent:#ff6a55;--chip:#1e1c2a;color-scheme:dark;
 --fd:"Chakra Petch","Vazirmatn","Segoe UI",system-ui,sans-serif;--fb:"IBM Plex Sans","Vazirmatn","Segoe UI",system-ui,sans-serif;--fm:"IBM Plex Mono",ui-monospace,Menlo,monospace;
 position:fixed;inset:0;z-index:10000;overflow:auto;background:var(--bg);color:var(--fg);font:15px/1.5 var(--fb);
 padding:20px max(16px,env(safe-area-inset-left,0px)) 32px max(16px,env(safe-area-inset-right,0px));box-sizing:border-box}
.c3d2 *{box-sizing:border-box}
.c3d2-wrap{max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.c3d2 header{display:flex;align-items:baseline;justify-content:flex-start;align-items:center;gap:8px 16px;flex-wrap:wrap}
.c3d2 h1{margin:0;font:600 22px/1.2 var(--fd);letter-spacing:.01em;text-wrap:balance}
.c3d2 .sub{margin:0;margin-inline-start:auto;color:var(--muted);font:12px var(--fm);letter-spacing:.04em;direction:ltr}
.c3d2 button{font:500 13px/1 var(--fb);color:var(--fg);background:var(--chip);border:1px solid var(--line);padding:9px 12px;cursor:pointer}
.c3d2 button:hover{border-color:var(--accent)}
.c3d2 button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.c3d2-stage{position:relative;width:min(100%,calc(76vh*915/749));aspect-ratio:915/749;margin:0 auto;background:linear-gradient(180deg,#2b2a42,#15141f);border:1px solid var(--line);overflow:hidden;touch-action:none;cursor:grab}
.c3d2-stage.drag{cursor:grabbing}
.c3d2-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none}
.c3d2-stage canvas:focus-visible{outline:2px solid var(--accent);outline-offset:-3px}
.c3d2-load{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(180deg,rgba(43,42,66,.96),rgba(21,20,31,.96));color:#ecebf4;font:500 14px/1.4 var(--fb);transition:opacity .25s}
.c3d2-load.done{opacity:0;pointer-events:none}
.c3d2-spin{width:38px;height:38px;border:3px solid rgba(236,235,244,.2);border-top-color:var(--accent);border-radius:50%;animation:c3d2spin .8s linear infinite}
@keyframes c3d2spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.c3d2-spin{animation-duration:2.4s}}
.c3d2-tools{position:absolute;top:10px;right:10px;display:flex;gap:8px}
.c3d2-hint{position:absolute;left:12px;bottom:10px;margin:0;font:12px/1.3 var(--fm);color:#ecebf4;background:rgba(0,0,0,.45);padding:4px 8px;pointer-events:none;direction:ltr}
.c3d2-note{position:absolute;inset:auto 12px 12px 12px;margin:0;padding:8px 10px;background:var(--chip);color:var(--fg);font-size:13px}
.c3d2-note[hidden]{display:none}
.c3d2-parts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none}
.c3d2-parts li{min-width:0;padding:12px 14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px}
.c3d2-parts b{font:600 14px/1.3 var(--fd);letter-spacing:.02em}
.c3d2-parts span{color:var(--muted);font-size:13px;overflow-wrap:anywhere}
.c3d2-parts code{direction:ltr;text-align:right;font:12px/1.4 var(--fm);color:var(--fg);overflow-wrap:anywhere}
.c3d2-sw{display:inline-block;width:9px;height:9px;margin-inline-end:8px}
@media (max-width:640px){.c3d2-parts{grid-template-columns:1fr}.c3d2-hint{display:none}}`;
  document.head.appendChild(s);
}

/* کانکتور باتری فقط یک هدر ۱×۲ با گام ۲٫۵۴ میلی‌متر است: دو پایهٔ خروجی (قرمز/مشکی) نگه داشته می‌شوند
   و سیم‌های متصل به آن‌ها به پدهای جدید می‌رسند. */
function simplifyConnector(data){
  if(!data.comps.some(c => c.t === 'BC' && c.pins.length >= 4)) return data;
  const key = (x, y) => Math.round(x) + ',' + Math.round(y);
  const move = new Map();
  const comps = data.comps.map(c => {
    if(c.t !== 'BC' || c.pins.length < 4) return c;
    const a = c.pins[2], b = c.pins[3], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L, h = 10;   // ۱٫۲۷ میلی‌متر
    const a2 = [mx - dx * h, my - dy * h, a[2]], b2 = [mx + dx * h, my + dy * h, b[2]];
    move.set(key(a[0], a[1]), a2); move.set(key(b[0], b[1]), b2);
    return Object.assign({}, c, {pins:[a2, b2], hc:[mx, my], box:{x0:mx - 30, y0:my - 30, x1:mx + 30, y1:my + 30}});
  });
  const wires = data.wires.map(w => {
    const p = move.get(key(w[0], w[1])), q = move.get(key(w[2], w[3]));
    return (p || q) ? [p ? p[0] : w[0], p ? p[1] : w[1], q ? q[0] : w[2], q ? q[1] : w[3]] : w;
  });
  return Object.assign({}, data, {comps, wires});
}

function open(data){
  close();
  data = simplifyConnector(data);
  injectCss();
  const el = document.createElement('div');
  el.className = 'c3d2'; el.dir = 'rtl';
  el.innerHTML = '<div class="c3d2-wrap"><header><button type="button" data-a="close" aria-label="بستن">✕</button>' +
    '<h1>نمای سه بعدی مدار</h1><p class="sub"></p></header>' +
    '<div class="c3d2-stage"><canvas tabindex="0" aria-label="نمای سه بعدی مدار. برای چرخش بکش و برای زوم از چرخ ماوس استفاده کن."></canvas>' +
    '<div class="c3d2-load" role="status" aria-live="polite"><div class="c3d2-spin"></div><span class="c3d2-load-t">در حال بارگذاری…</span></div>' +
    '<div class="c3d2-tools"><button type="button" data-a="reset">بازنشانی نما</button></div>' +
    '<p class="c3d2-hint">Drag to rotate · scroll to zoom · Shift+drag to pan</p><p class="c3d2-note" hidden></p></div>' +
    '<ul class="c3d2-parts"></ul></div>';
  document.body.appendChild(el);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const st = {el, raf:0, renderer:null, off:[], prevOverflow};
  current = st;
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); st.off.push(() => t.removeEventListener(ev, fn, o)); };
  on(el.querySelector('[data-a="close"]'), 'click', close);
  on(document, 'keydown', e => { if(e.code === 'Escape') close(); });

  const comps = data.comps.filter(c => !c.power);
  if(comps.length){
    const E = extents(data);
    el.querySelector('.sub').textContent = 'PCB ' + Math.round(E.W) + ' × ' + Math.round(E.H) + ' mm · ' + comps.length + ' THT parts';
  }

  // فهرست قطعات (نام + فوت‌پرینت + توضیح)، مثل نوار پایین HTML
  const groups = new Map();
  comps.forEach(c => {
    const key = c.t + '|' + fpOf(c);
    const g = groups.get(key) || {t:c.t, fp:fpOf(c), items:[], pitch:null};
    g.items.push((c.ref || '') + (c.val ? ' ' + c.val : ''));
    if(c.pins.length === 2) g.pitch = Math.hypot(c.pins[1][0] - c.pins[0][0], c.pins[1][1] - c.pins[0][1]) * MM;
    groups.set(key, g);
  });
  const list = el.querySelector('.c3d2-parts');
  groups.forEach(g => {
    const li = document.createElement('li'), b = document.createElement('b'), sw = document.createElement('span'), code = document.createElement('code'), d = document.createElement('span');
    sw.className = 'c3d2-sw'; sw.style.background = SWATCH[g.t] || '#8a8f98';
    b.appendChild(sw); b.appendChild(document.createTextNode((NAMES[g.t] || g.t) + (g.items.length > 1 ? ' × ' + fa(g.items.length) : '')));
    code.textContent = g.fp;
    d.textContent = (g.pitch ? 'فاصلهٔ پایه‌ها ' + fa(g.pitch.toFixed(2)) + ' mm · ' : '') + g.items.filter(Boolean).join('، ');
    li.appendChild(b); if(g.fp) li.appendChild(code); li.appendChild(d);
    list.appendChild(li);
  });

  const stage = el.querySelector('.c3d2-stage'), canvas = el.querySelector('canvas'), note = el.querySelector('.c3d2-note');
  const say = t => { note.hidden = !t; note.textContent = t || ''; };
  const load = el.querySelector('.c3d2-load'), loadT = el.querySelector('.c3d2-load-t');
  const setLoad = t => { loadT.textContent = t; };
  const hideLoad = () => { load.classList.add('done'); setTimeout(() => { if(load.isConnected) load.hidden = true; }, 300); };
  if(!data.comps.length){ hideLoad(); say('اول چند قطعه روی صفحه بگذار تا نمای سه بعدی ساخته شود.'); return; }
  setLoad(window.THREE ? 'در حال ساخت مدل‌ها…' : 'در حال دریافت کتابخانهٔ سه بعدی…');
  loadThree().then(() => {
    if(current !== st) return;
    setLoad('در حال ساخت مدل‌ها…');
    // اول بگذار اسپینر نقاشی شود، بعد صحنهٔ سنگین (همگام) ساخته شود تا صفحه بدون نشانه هنگ نکند
    requestAnimationFrame(() => setTimeout(() => {
      if(current !== st) return;
      try{ start(st, stage, canvas, say, data, hideLoad); }
      catch(err){ hideLoad(); say('ساخت نمای سه بعدی ناموفق بود.'); }
    }, 30));
  }).catch(() => { if(current === st){ hideLoad(); say('بارگذاری three.js ممکن نشد (اینترنت یا فایل js/vendor/three.min.js را چک کن).'); } });
}

function start(st, stage, canvas, say, data, ready, live){
  const T = window.THREE;
  let renderer;
  try{ renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:true}); }
  catch(e){ say('این مرورگر WebGL را اجرا نکرد، پس نمای سه بعدی در دسترس نیست.'); ready(); return null; }
  renderer.setClearColor(0x000000, 0);
  st.renderer = renderer;
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); st.off.push(() => t.removeEventListener(ev, fn, o)); };

  let {scene, rig, sprites, W, H} = build(T, data);
  let dirty = true;
  const mark = () => { dirty = true; };
  const basis = cameraBasis(T);
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
  cam.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(basis.right, basis.up, basis.back));
  cam.position.copy(basis.back).multiplyScalar(300);
  cam.updateMatrixWorld(true);

  const qHome = new T.Quaternion();
  let zoom = 1;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fit(w, h){
    const asp = w / h;
    const halfW = .99 * W / 2 + .15 * H / 2 + 3;
    const halfV = .14 * W / 2 + .79 * H / 2 + 6;
    const halfH = Math.max(halfV, halfW / asp);
    cam.left = -halfH * asp; cam.right = halfH * asp; cam.top = halfH; cam.bottom = -halfH; mark();
    cam.zoom = zoom; cam.updateProjectionMatrix();
  }
  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    if(!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    fit(w, h);
  }
  if(window.ResizeObserver){ const ro = new ResizeObserver(resize); ro.observe(stage); st.off.push(() => ro.disconnect()); }
  else on(window, 'resize', resize);
  resize();

  const rotateBy = (dx, dy) => {
    const qy = new T.Quaternion().setFromAxisAngle(basis.up, dx);
    const qx = new T.Quaternion().setFromAxisAngle(basis.right, dy);
    rig.quaternion.premultiply(qy).premultiply(qx); mark();
  };
  const setZoom = z => { zoom = Math.min(4, Math.max(.6, z)); cam.zoom = zoom; cam.updateProjectionMatrix(); mark(); };
  const pan = (dx, dy) => {
    const k = (cam.top - cam.bottom) / cam.zoom / Math.max(canvas.clientHeight, 1);
    rig.position.addScaledVector(basis.right, dx * k).addScaledVector(basis.up, -dy * k); mark();
  };

  const pointers = new Map();
  let lastPinch = 0, panMode = false;
  on(canvas, 'contextmenu', e => e.preventDefault());
  on(canvas, 'pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    panMode = e.button === 2 || e.shiftKey;
    stage.classList.add('drag');
    if(pointers.size === 2){ const a = [...pointers.values()]; lastPinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
  });
  on(canvas, 'pointermove', e => {
    const p = pointers.get(e.pointerId);
    if(!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if(pointers.size === 1){ panMode ? pan(dx, dy) : rotateBy(dx * .008, dy * .008); }
    else if(pointers.size === 2){
      const a = [...pointers.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if(lastPinch) setZoom(zoom * d / lastPinch);
      lastPinch = d;
    }
  });
  const endPtr = e => { pointers.delete(e.pointerId); lastPinch = 0; if(!pointers.size) stage.classList.remove('drag'); };
  on(canvas, 'pointerup', endPtr); on(canvas, 'pointercancel', endPtr);
  on(canvas, 'wheel', e => { e.preventDefault(); setZoom(zoom * Math.exp(-e.deltaY * .0015)); }, {passive:false});

  let anim = 0;
  function resetView(){
    cancelAnimationFrame(anim);
    const q0 = rig.quaternion.clone(), p0 = rig.position.clone(), z0 = zoom, t0 = performance.now(), dur = reduce ? 0 : 420;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      rig.quaternion.copy(q0).slerp(qHome, e);
      rig.position.copy(p0).multiplyScalar(1 - e); mark();
      setZoom(z0 + (1 - z0) * e);
      if(k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  st.off.push(() => cancelAnimationFrame(anim));
  on(st.el.querySelector('[data-a="reset"]'), 'click', resetView);
  on(canvas, 'keydown', e => {
    const s = .12, k = e.key;
    if(k === 'ArrowLeft') rotateBy(-s, 0);
    else if(k === 'ArrowRight') rotateBy(s, 0);
    else if(k === 'ArrowUp') rotateBy(0, -s);
    else if(k === 'ArrowDown') rotateBy(0, s);
    else if(k === '+' || k === '=') setZoom(zoom * 1.15);
    else if(k === '-') setZoom(zoom / 1.15);
    else if(k === '0') resetView();
    else return;
    e.preventDefault();
  });

  let shown = false, lastT = 0;
  (function loop(now){
    st.raf = requestAnimationFrame(loop);
    if(live){
      if(!stage.offsetParent) return;
      if(!dirty && (!sprites.length || now - lastT < 66)) return;      // فقط تپش نور LED: حداکثر ~۱۵ فریم در ثانیه
    }
    lastT = now; dirty = false;
    const pulse = .88 + .12 * Math.sin(now / 260);
    sprites.forEach(sp => { sp.material.opacity = pulse; });
    renderer.render(scene, cam);
    if(!shown){ shown = true; requestAnimationFrame(ready); }   // لودینگ بعد از اولین فریم کنار می‌رود
  })(performance.now());

  // بازسازی صحنه با دادهٔ تازه؛ زاویه، جابه‌جایی و زوم کاربر حفظ می‌شود (برای پیش‌نمایش زنده)
  return {dispose(){ disposeScene(scene); }, update(nd){
    const b = build(T, simplifyConnector(nd)), old = {scene, rig};
    b.rig.quaternion.copy(old.rig.quaternion); b.rig.position.copy(old.rig.position);
    scene = b.scene; rig = b.rig; sprites = b.sprites; W = b.W; H = b.H;
    disposeScene(old.scene);
    resize(); mark();
  }};
}

function disposeScene(sc){
  sc.traverse(o => {
    if(o.geometry) o.geometry.dispose();
    const ms = !o.material ? [] : Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach(m => { if(m.map) m.map.dispose(); m.dispose(); });
  });
}

/* ---------- پیش‌نمایش زندهٔ توکار (کنار ادیتور): همان صحنه و مدل‌های نمای سه بعدی، بدون عکس ثابت ---------- */
let liveCssDone = false;
function injectLiveCss(){
  if(liveCssDone) return; liveCssDone = true;
  const s = document.createElement('style');
  s.textContent = `
.c3dp{position:relative;display:flex;flex-direction:column;height:100%;min-height:260px;background:var(--panel,#121826);border:1px solid var(--panel-border,#2a3345);border-radius:12px;overflow:hidden;direction:rtl}
.c3dp-head{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid var(--panel-border,#2a3345)}
.c3dp-head b{font:800 13px/1.3 Vazirmatn,system-ui,sans-serif;color:var(--gold,#d4af37);white-space:nowrap}
.c3dp-sub{margin-inline-start:auto;min-width:0;font:11px/1.3 ui-monospace,Consolas,monospace;color:var(--muted,#9aa3b2);direction:ltr;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c3dp-head button{flex:none;width:28px;height:28px;padding:0;font-size:15px;line-height:1;color:var(--parchment,#e8e2d0);background:transparent;border:1px solid var(--panel-border,#2a3345);border-radius:8px;cursor:pointer}
.c3dp-head button:hover{border-color:var(--copper,#c9772e)}
.c3dp-head button:focus-visible,.c3dp-stage canvas:focus-visible{outline:2px solid var(--trace-bright,#57d8a3);outline-offset:2px}
.c3dp-stage{position:relative;flex:1;min-height:0;background:linear-gradient(180deg,#2b2a42,#15141f);overflow:hidden;touch-action:none;cursor:grab;direction:ltr}
.c3dp-stage.drag{cursor:grabbing}
.c3dp-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none}
.c3dp.empty canvas{visibility:hidden}
.c3dp-load{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(180deg,rgba(43,42,66,.96),rgba(21,20,31,.96));color:#ecebf4;font:600 12.5px/1.4 Vazirmatn,system-ui,sans-serif}
.c3dp-load[hidden]{display:none}
.c3dp-spin{width:30px;height:30px;border:3px solid rgba(236,235,244,.2);border-top-color:var(--trace-bright,#57d8a3);border-radius:50%;animation:c3dpspin .8s linear infinite}
@keyframes c3dpspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.c3dp-spin{animation-duration:2.4s}}
.c3dp-note{position:absolute;inset:auto 8px 8px 8px;margin:0;padding:7px 9px;border-radius:8px;background:rgba(0,0,0,.55);color:#ecebf4;font:600 12px/1.8 Vazirmatn,system-ui,sans-serif;direction:rtl;pointer-events:none}
.c3dp-note[hidden]{display:none}
.c3dp.empty .c3dp-note{inset:0;display:flex;align-items:center;justify-content:center;padding:18px;text-align:center;background:transparent;color:#a09db4;border-radius:0}
.c3dp.empty .c3dp-note[hidden]{display:none}
.c3dp-hint{position:absolute;left:8px;bottom:6px;margin:0;font:600 10.5px/1.4 Vazirmatn,system-ui,sans-serif;color:rgba(236,235,244,.7);background:rgba(0,0,0,.4);padding:2px 7px;border-radius:6px;pointer-events:none;direction:rtl}
.c3dp.empty .c3dp-hint,.c3dp-note:not([hidden]) ~ .c3dp-hint{display:none}`;
  document.head.appendChild(s);
}

function mount(host, o){
  o = o || {};
  injectLiveCss();
  const el = document.createElement('div');
  el.className = 'c3dp empty';
  el.innerHTML = '<div class="c3dp-head"><b>پیش‌نمایش واقعی</b><span class="c3dp-sub"></span>' +
    '<button type="button" data-a="reset" title="بازنشانی نما" aria-label="بازنشانی نما">⟲</button>' +
    (o.onExpand ? '<button type="button" data-a="full" title="نمای بزرگ" aria-label="نمای بزرگ">⤢</button>' : '') + '</div>' +
    '<div class="c3dp-stage"><canvas tabindex="0" aria-label="پیش‌نمایش سه بعدی مدار. برای چرخش بکش و برای زوم از چرخ ماوس استفاده کن."></canvas>' +
    '<div class="c3dp-load" role="status" hidden><div class="c3dp-spin"></div><span>در حال ساخت مدل‌ها…</span></div>' +
    '<p class="c3dp-note"></p><p class="c3dp-hint">بکش: چرخش · چرخ ماوس: زوم</p></div>';
  host.appendChild(el);
  const stage = el.querySelector('.c3dp-stage'), canvas = el.querySelector('canvas'), note = el.querySelector('.c3dp-note'), load = el.querySelector('.c3dp-load'), sub = el.querySelector('.c3dp-sub');
  const st = {el, raf:0, renderer:null, off:[]};
  let ctl = null, starting = false, failed = false, dead = false, last = null;
  const say = t => { note.textContent = t || ''; note.hidden = !t; };
  const hideLoad = () => { load.hidden = true; };
  if(o.onExpand) el.querySelector('[data-a="full"]').addEventListener('click', o.onExpand);

  function update(d){
    if(dead) return;
    last = d;
    if(!d || !d.comps || !d.comps.length){
      el.classList.add('empty'); sub.textContent = '';
      say('قطعه‌ای روی صفحه نیست. با گذاشتن قطعه، نمای واقعی‌اش همین‌جا ساخته می‌شود.');
      return;
    }
    el.classList.remove('empty'); say('');
    if(failed) return;
    try{
      const sd = simplifyConnector(d), E = extents(sd);
      sub.textContent = fa(Math.round(E.W)) + '×' + fa(Math.round(E.H)) + ' mm · ' + fa(sd.comps.filter(c => !c.power).length) + ' قطعه';
    }catch(_){}
    if(ctl){
      try{ ctl.update(d); }catch(err){ say('به‌روزرسانی پیش‌نمایش ناموفق بود.'); }
      return;
    }
    if(starting) return;
    starting = true; load.hidden = false;
    loadThree().then(() => {
      if(dead) return;
      requestAnimationFrame(() => setTimeout(() => {
        starting = false;
        if(dead || !last || !last.comps.length){ hideLoad(); return; }
        try{
          ctl = start(st, stage, canvas, say, simplifyConnector(last), hideLoad, true);
          if(!ctl) failed = true;
        }catch(err){ failed = true; hideLoad(); say('ساخت پیش‌نمایش سه بعدی ناموفق بود.'); }
      }, 30));
    }).catch(() => { starting = false; failed = true; hideLoad(); say('بارگذاری three.js ممکن نشد (اینترنت یا فایل js/vendor/three.min.js را چک کن).'); });
  }

  function destroy(){
    if(dead) return; dead = true;
    cancelAnimationFrame(st.raf);
    st.off.forEach(f => f());
    if(ctl && ctl.dispose) ctl.dispose();
    if(st.renderer){ st.renderer.dispose(); if(st.renderer.forceContextLoss) st.renderer.forceContextLoss(); }
    el.remove();
  }
  return {update, destroy, el, visible:() => !!stage.offsetParent};
}

function close(){
  if(!current) return;
  const st = current; current = null;
  cancelAnimationFrame(st.raf);
  st.off.forEach(f => f());
  if(st.renderer){ st.renderer.dispose(); if(st.renderer.forceContextLoss) st.renderer.forceContextLoss(); }
  document.body.style.overflow = st.prevOverflow || '';
  st.el.remove();
}

// پیش‌بارگذاری کتابخانه (مثلاً وقتی ماوس روی دکمهٔ سه بعدی می‌رود) تا با کلیک آماده باشد
const preload = () => { loadThree().catch(() => {}); };
window.Circuit3D = {open, close, preload, mount};
})();
