/* نمای ۳بعدی مدار — همان صحنه، مدل‌ها، دوربین و صفحه‌آرایی فایل «LED Board 3D View»
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
const DEF_FP = {R:'R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal', C:'C_Disc_D5.0mm_W2.5mm_P5.00mm', CP:'CP_Radial_D8.0mm_P3.50mm',
  D:'D_DO-35_SOD27_P10.16mm_Horizontal',
  LED:'LED_D5.0mm', BJT:'TO-92_Inline', BC:'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical',
  SW:'SW_Slide_SPST_P10.16mm', PB:'Button_Switch_THT:SW_PUSH_6mm', LAMP:'Lamp_E10_Holder'};
const fpOf = c => c.t === 'BC' ? DEF_FP.BC : (c.fp || DEF_FP[FAM(c.t)] || '');
const NAMES = {R:'مقاومت', D:'دیود', LED:'LED قرمز ۵ میلی‌متری', LEDY:'LED زرد ۵ میلی‌متری', LEDG:'LED سبز ۵ میلی‌متری', C:'خازن', CP:'خازن الکترولیتی',
  NPN:'ترانزیستور NPN', PNP:'ترانزیستور PNP', BC:'کانکتور باتری (هدر ۱×۲)', SW:'کلید', PB:'کلید فشاری ۶ میلی‌متری', LAMP:'لامپ'};
const SWATCH = {R:'#e1b57d', D:'#c9772e', LED:'#b31a0d', LEDY:'#d9a400', LEDG:'#1d8f45', C:'#e0a23c', CP:'#1f3a78',
  NPN:'#262626', PNP:'#262626', BC:'#262626', SW:'#d0d4db', PB:'#d2d1c7', LAMP:'#ffe27a'};
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
  const sprites = [];

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
    const pl = new T.PointLight(color, 1.0, 30); pl.position.set(0, y, 0); g.add(pl);
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
    C:[rect(-3.4,-2.5,3.4,2.5)], CP:[circle(0,0,4)], BJT:[circle(.5,0,3)],
    SW:[rect(-6.5,-3,6.5,3)], PB:[rect(-3,-3,3,3), circle(0,0,1.9)], LAMP:[circle(0,0,5.5)]
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
      const m = modelGroup(g), def = LEDS[c.t] || LEDS.LED, lit = c.st === 'on', burnt = c.st === 'burnt';
      const color = burnt ? 0x2a2a2a : def.c;
      const red = phong(color, 0x2a2a2a, 30, lit ? {emissive:new T.Color(def.on), emissiveIntensity:.85} : {});
      const prof = [new V2(2.45, 4), new V2(2.45, 9.15)];
      for(let i = 1; i <= 32; i++){ const t = i / 32 * HALF; prof.push(new V2(2.45 * Math.cos(t), 9.15 + 2.45 * Math.sin(t))); }
      m.add(new T.Mesh(axisToZ(new T.LatheGeometry(prof, 72)), red));
      const a = Math.acos(2.5 / 2.9), sh = new T.Shape();
      sh.absarc(0, 0, 2.9, a, 2 * Math.PI - a, false); sh.closePath();   // لبهٔ تخت روی +x (کاتد)
      const fl = new T.Mesh(new T.ExtrudeGeometry(sh, {depth:1, bevelEnabled:false, curveSegments:72}), red);
      fl.position.z = 3; m.add(fl);
      const half = pitchOf(c) / 2;
      [-1, 1].forEach(s => {
        m.add(tube(P3(s * half, 0, -2.5), P3(s * half, 0, 1.4), .2));
        m.add(tube(P3(s * half, 0, 1.4), P3(s * 1.27, 0, 3.2), .2));
      });
      if(lit) glow(g, def.on, 9, 16);
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
      const d = cyl(.85, .3, mat('#e0a23c', {roughness:.6})); d.rotation.x = Math.PI / 2; d.position.y = 1.35; g.add(d);
      legs2(g, [[-2,0],[2,0]], .22, .6);
      [-1, 1].forEach(s => g.add(tube(P3(s * .22, .6, 0), P3(s * .22, 1.0, 0), .09)));
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
.c3d2{--bg:#eceaf3;--fg:#23212e;--muted:#615e72;--line:#cfcbdd;--accent:#b31a0d;--chip:#ffffff;
 --fd:"Chakra Petch","Vazirmatn","Segoe UI",system-ui,sans-serif;--fb:"IBM Plex Sans","Vazirmatn","Segoe UI",system-ui,sans-serif;--fm:"IBM Plex Mono",ui-monospace,Menlo,monospace;
 position:fixed;inset:0;z-index:10000;overflow:auto;background:var(--bg);color:var(--fg);font:15px/1.5 var(--fb);
 padding:20px max(16px,env(safe-area-inset-left,0px)) 32px max(16px,env(safe-area-inset-right,0px));box-sizing:border-box}
@media (prefers-color-scheme:dark){.c3d2{--bg:#14131b;--fg:#ecebf4;--muted:#a09db4;--line:#34324a;--accent:#ff6a55;--chip:#1e1c2a;color-scheme:dark}}
.c3d2 *{box-sizing:border-box}
.c3d2-wrap{max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.c3d2 header{display:flex;align-items:baseline;justify-content:space-between;gap:8px 24px;flex-wrap:wrap}
.c3d2 h1{margin:0;font:600 22px/1.2 var(--fd);letter-spacing:.01em;text-wrap:balance}
.c3d2 .sub{margin:0;margin-inline-end:auto;color:var(--muted);font:12px var(--fm);letter-spacing:.04em;direction:ltr}
.c3d2 button{font:500 13px/1 var(--fb);color:var(--fg);background:var(--chip);border:1px solid var(--line);padding:9px 12px;cursor:pointer}
.c3d2 button:hover{border-color:var(--accent)}
.c3d2 button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.c3d2-stage{position:relative;width:min(100%,calc(76vh*915/749));aspect-ratio:915/749;margin:0 auto;background:linear-gradient(180deg,#c4c4df,#71718d);border:1px solid var(--line);overflow:hidden;touch-action:none;cursor:grab}
.c3d2-stage.drag{cursor:grabbing}
.c3d2-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none}
.c3d2-stage canvas:focus-visible{outline:2px solid var(--accent);outline-offset:-3px}
.c3d2-load{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(180deg,rgba(196,196,223,.94),rgba(113,113,141,.94));color:#1d1c2b;font:500 14px/1.4 var(--fb);transition:opacity .25s}
.c3d2-load.done{opacity:0;pointer-events:none}
.c3d2-spin{width:38px;height:38px;border:3px solid rgba(29,28,43,.2);border-top-color:var(--accent);border-radius:50%;animation:c3d2spin .8s linear infinite}
@keyframes c3d2spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.c3d2-spin{animation-duration:2.4s}}
.c3d2-tools{position:absolute;top:10px;right:10px;display:flex;gap:8px}
.c3d2-hint{position:absolute;left:12px;bottom:10px;margin:0;font:12px/1.3 var(--fm);color:#1d1c2b;background:rgba(255,255,255,.55);padding:4px 8px;pointer-events:none;direction:ltr}
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
  el.innerHTML = '<div class="c3d2-wrap"><header><h1>نمای ۳بعدی مدار</h1><p class="sub"></p>' +
    '<button type="button" data-a="close" aria-label="بستن">✕</button></header>' +
    '<div class="c3d2-stage"><canvas tabindex="0" aria-label="نمای ۳بعدی مدار. برای چرخش بکش و برای زوم از چرخ ماوس استفاده کن."></canvas>' +
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
  if(!data.comps.length){ hideLoad(); say('اول چند قطعه روی صفحه بگذار تا نمای ۳بعدی ساخته شود.'); return; }
  setLoad(window.THREE ? 'در حال ساخت مدل‌ها…' : 'در حال دریافت کتابخانهٔ ۳بعدی…');
  loadThree().then(() => {
    if(current !== st) return;
    setLoad('در حال ساخت مدل‌ها…');
    // اول بگذار اسپینر نقاشی شود، بعد صحنهٔ سنگین (همگام) ساخته شود تا صفحه بدون نشانه هنگ نکند
    requestAnimationFrame(() => setTimeout(() => {
      if(current !== st) return;
      try{ start(st, stage, canvas, say, data, hideLoad); }
      catch(err){ hideLoad(); say('ساخت نمای ۳بعدی ناموفق بود.'); }
    }, 30));
  }).catch(() => { if(current === st){ hideLoad(); say('بارگذاری three.js ممکن نشد (اینترنت یا فایل js/vendor/three.min.js را چک کن).'); } });
}

function start(st, stage, canvas, say, data, ready){
  const T = window.THREE;
  let renderer;
  try{ renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:true}); }
  catch(e){ say('این مرورگر WebGL را اجرا نکرد، پس نمای ۳بعدی در دسترس نیست.'); ready(); return; }
  renderer.setClearColor(0x000000, 0);
  st.renderer = renderer;
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); st.off.push(() => t.removeEventListener(ev, fn, o)); };

  const {scene, rig, sprites, W, H} = build(T, data);
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
    cam.left = -halfH * asp; cam.right = halfH * asp; cam.top = halfH; cam.bottom = -halfH;
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
    rig.quaternion.premultiply(qy).premultiply(qx);
  };
  const setZoom = z => { zoom = Math.min(4, Math.max(.6, z)); cam.zoom = zoom; cam.updateProjectionMatrix(); };
  const pan = (dx, dy) => {
    const k = (cam.top - cam.bottom) / cam.zoom / Math.max(canvas.clientHeight, 1);
    rig.position.addScaledVector(basis.right, dx * k).addScaledVector(basis.up, -dy * k);
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
      rig.position.copy(p0).multiplyScalar(1 - e);
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

  let shown = false;
  (function loop(now){
    st.raf = requestAnimationFrame(loop);
    const pulse = .88 + .12 * Math.sin(now / 260);
    sprites.forEach(sp => { sp.material.opacity = pulse; });
    renderer.render(scene, cam);
    if(!shown){ shown = true; requestAnimationFrame(ready); }   // لودینگ بعد از اولین فریم کنار می‌رود
  })(performance.now());
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

// پیش‌بارگذاری کتابخانه (مثلاً وقتی ماوس روی دکمهٔ ۳بعدی می‌رود) تا با کلیک آماده باشد
const preload = () => { loadThree().catch(() => {}); };
window.Circuit3D = {open, close, preload};
})();
