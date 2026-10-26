/* نمای ۳بعدی مدار (شبیه KiCad 3D Viewer) — three.js فقط هنگام باز شدن بارگذاری می‌شود */
(function(){
'use strict';
const U = 20;
const SELF = (document.currentScript && document.currentScript.src) || '';
let loading = null, current = null;

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

const BAND = ['#111', '#7a3d12', '#d12a22', '#f28a1b', '#f2d21b', '#2f9e44', '#2563c9', '#7c3aed', '#8a8f98', '#f4f4f4'];
function parseOhm(s){
  const t = String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/Ω|ohm|\s/gi, '');
  const m = t.match(/^(\d+(?:\.\d+)?)([kKmM]?)/);
  return m ? parseFloat(m[1]) * ({k:1e3, K:1e3, m:1e6, M:1e6}[m[2]] || 1) : null;
}
function bandColors(v){
  if(!v || v <= 0) v = 1000;
  let e = Math.floor(Math.log10(v)), d = Math.round(v / Math.pow(10, e - 1));
  if(d >= 100){ d = Math.round(d / 10); e++; }
  const mult = e - 1;
  return [BAND[Math.floor(d / 10)], BAND[d % 10], mult >= 0 && mult <= 9 ? BAND[mult] : mult === -1 ? '#cfa73a' : '#c0c0c0', '#cfa73a'];
}

function build(T, data, host){
  const V3 = T.Vector3;
  const mats = {};
  const mat = (color, o) => new T.MeshStandardMaterial(Object.assign({color, roughness:.55, metalness:.1}, o || {}));
  const M = {
    board: mat('#0e6b3a', {roughness:.7}), copper: mat('#d9a441', {roughness:.35, metalness:.7}),
    hole: new T.MeshBasicMaterial({color:'#0b0b0b'}), lead: mat('#c9ced6', {roughness:.3, metalness:.85}),
    black: mat('#18181b', {roughness:.5}), red: mat('#d33a2c'), dark: mat('#2b2e35', {roughness:.6}), metal: mat('#b8bec8', {roughness:.3, metalness:.8})
  };

  const scene = new T.Scene();
  const group = new T.Group();
  scene.add(group);
  const lights = [];

  const tube = (a, b, r, m) => {
    const v = new V3().subVectors(b, a), len = v.length();
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, len, 8), m || M.lead);
    mesh.position.copy(a).addScaledVector(v, .5);
    mesh.quaternion.setFromUnitVectors(new V3(0,1,0), v.normalize());
    return mesh;
  };
  const P = (x,y,z) => new V3(x,y,z);
  const cyl = (r, h, m, seg) => new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 20), m);
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0,0,128,128);
    return new T.CanvasTexture(cv);
  })();
  const glow = (g, color, y, size) => {
    const sp = new T.Sprite(new T.SpriteMaterial({map:glowTex, color, blending:T.AdditiveBlending, transparent:true, depthWrite:false}));
    sp.position.set(0, y, 0); sp.scale.set(size, size, 1); sp.userData.pulse = true;
    g.add(sp);
    const pl = new T.PointLight(color, 1.1, 9); pl.position.set(0, y, 0); g.add(pl); lights.push(pl);
  };
  const label = (text, color, h) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = 'bold 38px monospace'; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 32);
    const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
    const m = new T.Mesh(new T.PlaneGeometry(h * 4, h), new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
    m.rotation.x = -Math.PI / 2; m.position.y = .03;
    return m;
  };

  const legs2 = (g, pins, rest, y) => pins.forEach(p => g.add(tube(P(p[0], 0, p[1]), P(p[0] * rest, y, 0), .07)));
  const axialLegs = (g, y, bx) => [-1, 1].forEach(s => { g.add(tube(P(s * 2, 0, 0), P(s * 2, y, 0), .07)); g.add(tube(P(s * 2, y, 0), P(s * bx, y, 0), .07)); });

  const MODEL = {
    R(g, c){
      const body = mat('#d8c08c', {roughness:.7});
      const b = cyl(.4, 1.9, body); b.rotation.z = Math.PI / 2; b.position.y = .55; g.add(b);
      [-1, 1].forEach(s => { const e = cyl(.5, .5, body); e.rotation.z = Math.PI / 2; e.position.set(s * .95, .55, 0); g.add(e); });
      const cols = bandColors(parseOhm(c.val)), xs = [-.75, -.4, -.05, .65];
      cols.forEach((col, i) => { const r = cyl(.52, .13, mat(col, {roughness:.5})); r.rotation.z = Math.PI / 2; r.position.set(xs[i], .55, 0); g.add(r); });
      axialLegs(g, .55, 1.2);
    },
    D(g){
      const b = cyl(.33, 1.7, mat('#c9772e', {transparent:true, opacity:.9, roughness:.2})); b.rotation.z = Math.PI / 2; b.position.y = .45; g.add(b);
      const band = cyl(.35, .22, M.black); band.rotation.z = Math.PI / 2; band.position.set(.65, .45, 0); g.add(band);
      axialLegs(g, .45, .85);
    },
    LED(g, c, col){
      const lit = c.st === 'on', burnt = c.st === 'burnt';
      const color = burnt ? '#2a2a2a' : col;
      const m = mat(color, {transparent:true, opacity:burnt ? .95 : .82, roughness:.15, emissive:lit ? color : '#000', emissiveIntensity:lit ? 1.5 : 0});
      const flange = cyl(1.05, .15, m); flange.position.y = .4; g.add(flange);
      const body = cyl(.92, 1.1, m); body.position.y = .95; g.add(body);
      const dome = new T.Mesh(new T.SphereGeometry(.92, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.position.y = 1.5; g.add(dome);
      g.add(tube(P(-2, 0, 0), P(-.4, .45, 0), .07)); g.add(tube(P(2, 0, 0), P(.4, .45, 0), .07));
      const inner = box(.5, .5, .08, M.metal); inner.position.y = 1.05; g.add(inner);
      if(lit) glow(g, color, 1.5, 5);
    },
    C(g){
      const d = cyl(.85, .3, mat('#e0a23c', {roughness:.6})); d.rotation.x = Math.PI / 2; d.position.y = 1.35; g.add(d);
      legs2(g, [[-2,0],[2,0]], .22, .6);
      [-1, 1].forEach(s => g.add(tube(P(s * .22, .6, 0), P(s * .22, 1.0, 0), .07)));
    },
    CP(g){
      const b = cyl(1.05, 2.2, mat('#1f3a78', {roughness:.45})); b.position.y = 1.1; g.add(b);
      const top = cyl(1.0, .03, M.metal); top.position.y = 2.21; g.add(top);
      const stripe = box(.05, 2.0, .7, mat('#e9edf5')); stripe.position.set(1.04, 1.1, 0); g.add(stripe);
      g.add(tube(P(-2, 0, 0), P(-.5, .1, 0), .07)); g.add(tube(P(2, 0, 0), P(.5, .1, 0), .07));
      g.add(tube(P(-.5, 0, 0), P(-.5, .3, 0), .07)); g.add(tube(P(.5, 0, 0), P(.5, .3, 0), .07));
    },
    L(g){
      const core = cyl(.5, 2.3, mat('#3b2f29')); core.rotation.z = Math.PI / 2; core.position.y = .75; g.add(core);
      for(let i = 0; i < 8; i++){
        const ring = new T.Mesh(new T.TorusGeometry(.58, .08, 8, 18), mat('#c46a2b', {metalness:.6, roughness:.35}));
        ring.rotation.y = Math.PI / 2; ring.position.set(-.95 + i * .27, .75, 0); g.add(ring);
      }
      axialLegs(g, .75, 1.15);
    },
    POT(g){
      const b = box(2.8, 1.4, 2.6, mat('#1b4fa8')); b.position.set(0, .7, -.5); g.add(b);
      const s = cyl(.6, .15, M.metal); s.position.set(0, 1.47, -.5); g.add(s);
      const slot = box(.9, .06, .14, M.black); slot.position.set(0, 1.57, -.5); g.add(slot);
      [[-2,0],[2,0],[0,-2]].forEach(p => g.add(tube(P(p[0], 0, p[1]), P(p[0] * .55, .25, p[1] * .55 - .5 * (p[1] ? 0 : 1)), .07)));
    },
    BJT(g){
      const half = new T.Mesh(new T.CylinderGeometry(.9, .9, 1.5, 24, 1, false, -Math.PI / 2, Math.PI), M.black);
      half.rotation.y = Math.PI / 2; half.position.set(.15, 1.0, 0); g.add(half);
      const flat = box(.02, 1.5, 1.8, M.black); flat.position.set(.15, 1.0, 0); g.add(flat);
      g.add(tube(P(-2, 0, 0), P(.2, .55, 0), .07)); g.add(tube(P(1, 0, -2), P(.3, .55, -.4), .07)); g.add(tube(P(1, 0, 2), P(.3, .55, .4), .07));
    },
    OPAMP(g){
      const b = box(2.8, .8, 3.3, M.black); b.position.set(0, .55, 0); g.add(b);
      const dot = cyl(.15, .02, mat('#6b7280')); dot.position.set(-.9, .96, -1.2); g.add(dot);
      [-1, 1].forEach(s => [-1.2, -.4, .4, 1.2].forEach(z => { const l = box(.55, .08, .22, M.metal); l.position.set(s * 1.55, .25, z); g.add(l); }));
      [[-2,-1],[-2,1],[2,0]].forEach(p => g.add(tube(P(p[0], 0, p[1]), P(Math.sign(p[0]) * 1.6, .25, p[1]), .06)));
    },
    BT(g, c){
      const hot = c.st === 'short';
      const low = box(4.4, 1.5, 3.0, mat(hot ? '#7a1f1f' : '#2b2e35', {roughness:.45})); low.position.y = .75; g.add(low);
      const cap = box(4.4, .55, 3.0, mat('#c58a3b', {metalness:.5, roughness:.4})); cap.position.y = 1.78; g.add(cap);
      const plus = cyl(.5, .4, M.metal, 24); plus.position.set(-1.3, 2.25, 0); g.add(plus);
      const minus = cyl(.55, .4, M.metal, 6); minus.position.set(1.3, 2.25, 0); g.add(minus);
    },
    BC(g){
      const h = box(2.0, 1.0, 3.0, mat('#23262d')); h.position.set(0, .5, 0); g.add(h);
      const r = cyl(.45, .35, M.metal, 24); r.rotation.z = Math.PI / 2; r.position.set(-1.15, .5, -1); g.add(r);
      const s = cyl(.5, .35, M.metal, 6); s.rotation.z = Math.PI / 2; s.position.set(-1.15, .5, 1); g.add(s);
      g.add(tube(P(-2, 0, -1), P(-1.15, .5, -1), .07)); g.add(tube(P(-2, 0, 1), P(-1.15, .5, 1), .07));
      const red = mat('#d6322a'), blk = mat('#16161a');
      g.add(tube(P(1, .5, -1), P(2, .25, -1), .13, red)); g.add(tube(P(1, .5, 1), P(2, .25, 1), .13, blk));
      g.add(tube(P(2, .25, -1), P(2, 0, -1), .13, red)); g.add(tube(P(2, .25, 1), P(2, 0, 1), .13, blk));
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
      g.add(tube(P(-2, 0, 0), P(-.6, .4, 0), .07)); g.add(tube(P(2, 0, 0), P(.6, .4, 0), .07));
      if(lit) glow(g, '#ffd95a', 2.0, 6.5);
    },
    VCC(g){
      const p = cyl(.45, .8, mat('#d33a2c')); p.position.y = .4; g.add(p);
      const r = cyl(.62, .05, M.copper); r.position.y = .03; g.add(r);
    },
    GND(g){
      const p = cyl(.45, .8, mat('#15171c')); p.position.y = .4; g.add(p);
      const r = cyl(.62, .05, M.copper); r.position.y = .03; g.add(r);
    },
    DEFAULT(g){ const b = box(2.4, 1, 2.4, M.dark); b.position.y = .5; g.add(b); }
  };
  const LEDCOL = {LED:'#ff4d4d', LEDY:'#ffd23f', LEDG:'#3ddc84'};
  const pick = t => LEDCOL[t] ? (g, c) => MODEL.LED(g, c, LEDCOL[t]) : (t === 'NPN' || t === 'PNP') ? MODEL.BJT : MODEL[t] || MODEL.DEFAULT;

  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  const ext = (x, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); };
  data.comps.forEach(c => { ext(c.box.x0 / U, c.box.y0 / U); ext(c.box.x1 / U, c.box.y1 / U); c.pins.forEach(p => ext(p[0] / U, p[1] / U)); });
  data.wires.forEach(w => { ext(w[0] / U, w[1] / U); ext(w[2] / U, w[3] / U); });
  const mg = 3;
  x0 -= mg; z0 -= mg; x1 += mg; z1 += mg;
  const W = Math.max(x1 - x0, 8), H = Math.max(z1 - z0, 8), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  group.position.set(-cx, 0, -cz);

  const bd = box(W, .16, H, M.board); bd.position.set(cx, -.08, cz); group.add(bd);
  const rim = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(W, .16, H)), new T.LineBasicMaterial({color:'#2fbf71', transparent:true, opacity:.5}));
  rim.position.copy(bd.position); group.add(rim);

  data.wires.forEach(w => {
    const ax = w[0] / U, az = w[1] / U, bx = w[2] / U, bz = w[3] / U, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    const t = box(L + .22, .03, .24, M.copper);
    t.position.set((ax + bx) / 2, .02, (az + bz) / 2); t.rotation.y = -Math.atan2(dz, dx); group.add(t);
  });
  const dots = new Set();
  const pad = (x, z, r, hole) => {
    const k = x + ',' + z + ',' + r; if(dots.has(k)) return; dots.add(k);
    const p = cyl(r, .03, M.copper, 24); p.position.set(x, .025, z); group.add(p);
    if(hole){ const h = cyl(.15, .04, M.hole, 16); h.position.set(x, .03, z); group.add(h); }
  };
  data.wires.forEach(w => { pad(w[0] / U, w[1] / U, .13); pad(w[2] / U, w[3] / U, .13); });

  data.comps.forEach(c => {
    const g = new T.Group();
    g.position.set(c.x / U, 0, c.y / U);
    g.rotation.y = -(c.r & 3) * Math.PI / 2;
    pick(c.t)(g, c);
    group.add(g);
    c.pins.forEach(p => pad(p[0] / U, p[1] / U, .36, true));
    if(!c.power){
      const lb = label(c.ref, '#f4f4f4', .75);
      lb.position.set((c.box.x0 + c.box.x1) / 2 / U, .03, c.box.y0 / U - .8); group.add(lb);
      if(c.val){ const vl = label(c.val, '#b9c0cc', .6); vl.position.set((c.box.x0 + c.box.x1) / 2 / U, .03, c.box.y1 / U + .8); group.add(vl); }
    }
  });

  scene.add(new T.HemisphereLight('#dbe7ff', '#1a2230', .75));
  const sun = new T.DirectionalLight('#ffffff', .85);
  const R = Math.max(W, H);
  sun.position.set(R * .4, R * 1.2, R * .6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left:-R, right:R, top:R, bottom:-R, near:.5, far:R * 4});
  scene.add(sun);
  group.traverse(o => { if(o.isMesh && !(o.material && o.material.transparent && o.material.opacity < .5)){ o.castShadow = true; o.receiveShadow = true; } });
  bd.castShadow = false;

  return {scene, W, H};
}

function open(data){
  close();
  const wrap = document.createElement('div');
  wrap.className = 'c3d';
  wrap.innerHTML = '<div class="c3d-bar"><div class="c3d-title">نمای ۳بعدی مدار</div><div class="c3d-btns">' +
    '<button data-v="top">بالا</button><button data-v="iso">زاویه‌دار</button><button data-v="side">کنار</button>' +
    '<button data-a="rot">چرخش خودکار</button><button data-a="close" class="x" aria-label="بستن">✕</button></div></div>' +
    '<div class="c3d-view"></div><div class="c3d-hint">کشیدن = چرخش • چرخ ماوس یا دو انگشت = زوم • کلیک راست یا Shift+کشیدن = جابه‌جایی</div>';
  document.body.appendChild(wrap);
  const view = wrap.querySelector('.c3d-view');
  const st = {wrap, raf:0, renderer:null, off:[]};
  current = st;
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); st.off.push(() => t.removeEventListener(ev, fn, o)); };
  on(wrap.querySelector('[data-a="close"]'), 'click', close);
  on(document, 'keydown', e => { if(e.code === 'Escape') close(); });

  if(!data.comps.length){ view.innerHTML = '<div class="c3d-msg">اول چند قطعه روی صفحه بگذار تا نمای ۳بعدی ساخته شود.</div>'; return; }
  view.innerHTML = '<div class="c3d-msg">در حال بارگذاری…</div>';
  loadThree().then(() => {
    if(current !== st) return;
    view.innerHTML = '';
    start(st, view, data);
  }).catch(() => { if(current === st) view.innerHTML = '<div class="c3d-msg">بارگذاری three.js ممکن نشد (اینترنت یا فایل js/vendor/three.min.js را چک کن).</div>'; });
}

function start(st, view, data){
  const T = window.THREE;
  const {scene, W, H} = build(T, data, view);
  const renderer = new T.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  view.appendChild(renderer.domElement);
  st.renderer = renderer;
  const cam = new T.PerspectiveCamera(40, 1, .1, 1000);
  const target = new T.Vector3(0, 0, 0);
  const s = {th:.35, ph:.9, r:1}, goal = {th:.35, ph:.9, r:1};
  let auto = false;
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); st.off.push(() => t.removeEventListener(ev, fn, o)); };

  const fitR = () => {
    const asp = view.clientWidth / Math.max(view.clientHeight, 1);
    return Math.max(H / 2, W / 2 / asp) / Math.tan(T.MathUtils.degToRad(20)) * 1.2 + 2;
  };
  const resize = () => {
    const w = view.clientWidth, h = view.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  };
  resize();
  s.r = goal.r = fitR();
  const VIEWS = {top:{ph:.001, th:0}, iso:{ph:.9, th:.35}, side:{ph:1.38, th:0}};
  st.wrap.querySelectorAll('[data-v]').forEach(b => on(b, 'click', () => {
    Object.assign(goal, VIEWS[b.dataset.v]); goal.r = fitR(); target.set(0, 0, 0);
  }));
  const rotBtn = st.wrap.querySelector('[data-a="rot"]');
  on(rotBtn, 'click', () => { auto = !auto; rotBtn.classList.toggle('on', auto); });
  if(window.ResizeObserver){ const ro = new ResizeObserver(resize); ro.observe(view); st.off.push(() => ro.disconnect()); }

  const ptr = new Map();
  let pinch = null, panMode = false, last = null;
  const el = renderer.domElement;
  on(el, 'contextmenu', e => e.preventDefault());
  on(el, 'pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    ptr.set(e.pointerId, {x:e.clientX, y:e.clientY});
    panMode = e.button === 2 || e.shiftKey;
    auto = false; rotBtn.classList.remove('on');
    if(ptr.size === 2){ const [a, b] = [...ptr.values()]; pinch = {d:Math.hypot(a.x - b.x, a.y - b.y), r:goal.r, m:{x:(a.x + b.x) / 2, y:(a.y + b.y) / 2}}; }
    last = {x:e.clientX, y:e.clientY};
  });
  const pan = (dx, dy) => {
    const k = s.r * Math.tan(T.MathUtils.degToRad(20)) * 2 / Math.max(view.clientHeight, 1);
    const right = new T.Vector3().setFromMatrixColumn(cam.matrix, 0), up = new T.Vector3().setFromMatrixColumn(cam.matrix, 1);
    target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
  };
  on(el, 'pointermove', e => {
    if(!ptr.has(e.pointerId)) return;
    ptr.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(ptr.size === 2 && pinch){
      const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = {x:(a.x + b.x) / 2, y:(a.y + b.y) / 2};
      goal.r = s.r = clamp(pinch.r * pinch.d / Math.max(d, 1), 3, 400);
      pan(m.x - pinch.m.x, m.y - pinch.m.y); pinch.m = m;
      return;
    }
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    last = {x:e.clientX, y:e.clientY};
    if(panMode) pan(dx, dy);
    else { goal.th = s.th -= dx * .008; goal.ph = s.ph = clamp(s.ph - dy * .008, .001, 1.5); }
  });
  const up = e => { ptr.delete(e.pointerId); if(ptr.size < 2) pinch = null; };
  on(el, 'pointerup', up); on(el, 'pointercancel', up);
  on(el, 'wheel', e => { e.preventDefault(); goal.r = clamp(goal.r * Math.exp(e.deltaY * .0012), 3, 400); }, {passive:false});
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  let t0 = performance.now();
  const sprites = [];
  scene.traverse(o => { if(o.userData && o.userData.pulse) sprites.push(o); });
  (function loop(now){
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min((now - t0) / 1000, .1); t0 = now;
    if(auto) goal.th += dt * .5;
    const k = 1 - Math.pow(.0005, dt);
    s.th += (goal.th - s.th) * k; s.ph += (goal.ph - s.ph) * k; s.r += (goal.r - s.r) * k;
    cam.position.set(target.x + s.r * Math.sin(s.ph) * Math.sin(s.th), target.y + s.r * Math.cos(s.ph), target.z + s.r * Math.sin(s.ph) * Math.cos(s.th));
    cam.lookAt(target);
    cam.updateMatrixWorld();
    const pulse = .88 + .12 * Math.sin(now / 260);
    sprites.forEach(sp => { sp.material.opacity = pulse; });
    renderer.render(scene, cam);
  })(t0);
}

function close(){
  if(!current) return;
  const st = current; current = null;
  cancelAnimationFrame(st.raf);
  st.off.forEach(f => f());
  if(st.renderer){ st.renderer.dispose(); if(st.renderer.forceContextLoss) st.renderer.forceContextLoss(); }
  st.wrap.remove();
}

window.Circuit3D = {open, close};
})();
