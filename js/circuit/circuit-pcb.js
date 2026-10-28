/* نمای PCB / فوت‌پرینت (شبیه KiCad PCB Editor): تخصیص فوت‌پرینت، چیدمان، ترک‌کشی خودکار */
(function(){
'use strict';
const U = 20, MM = U / 2.54;
const COL = {bg:'#001023', dot:'#34455f', cu:'#c83434', silk:'#f2eda1', cuSel:'#ff7a7a', crt:'#ff26e2', edge:'#d83a3a', fab:'#b4b8c0', sel:'#4de0ff'};
const rc = (x0, y0, x1, y1) => `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/>`;
const ci = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const ln = (a, b, c, d) => `<path d="M${a} ${b}L${c} ${d}"/>`;
const FP = {
  R:[{n:'R_Axial_DIN0207_L6.3mm_D2.5mm_P7.62mm_Horizontal', b:[-3.27,-1.37,3.27,1.37], pads:[[-3.81,0],[3.81,0]], s:'<path d="M-3.27 -1.04V-1.37H3.27V-1.04M-3.27 1.04V1.37H3.27V1.04"/>'}],
  C:[{n:'C_Disc_D5.0mm_W2.5mm_P5.00mm', b:[-3.4,-2.5,3.4,2.5], s:rc(-3.4,-2.5,3.4,2.5) + ln(-.5,-1.6,-.5,1.6) + ln(.5,-1.6,.5,1.6)},
     {n:'C_Rect_L7.2mm_W2.5mm_P5.00mm', b:[-3.6,-1.25,3.6,1.25], s:rc(-3.6,-1.25,3.6,1.25)}],
  CP:[{n:'CP_Radial_D8.0mm_P3.50mm', b:[-4,-4,4,4], s:ci(0,0,4) + ln(-6.2,-1.2,-4.6,-1.2) + ln(-5.4,-2,-5.4,-.4)},
      {n:'CP_Radial_D5.0mm_P2.50mm', b:[-2.5,-2.5,2.5,2.5], s:ci(0,0,2.5) + ln(-6.2,-1.2,-4.6,-1.2) + ln(-5.4,-2,-5.4,-.4)}],
  D:[{n:'D_DO-35_SOD27_P10.16mm_Horizontal', b:[-1.9,-.95,1.9,.95], s:rc(-1.9,-.95,1.9,.95) + ln(1.1,-.95,1.1,.95)},
     {n:'D_DO-41_SOD81_P10.16mm_Horizontal', b:[-2.5,-1.3,2.5,1.3], s:rc(-2.5,-1.3,2.5,1.3) + ln(1.5,-1.3,1.5,1.3)}],
  LED:[{n:'LED_D5.0mm', b:[-2.9,-2.9,2.9,2.9], pads:[[-1.27,0],[1.27,0]], s:ci(0,0,2.5) + '<path d="M2.5 -1.6A2.9 2.9 0 1 0 2.5 1.6Z"/>'}],
  BJT:[{n:'TO-92_Inline', b:[-3,-3,4,3], s:'<path d="M-2.4 -1.8A3 3 0 1 1 -2.4 1.8Z" transform="translate(.5 0)"/>'},
       {n:'TO-92_Inline_Wide', b:[-3.4,-3.4,4.4,3.4], s:'<path d="M-2.8 -2A3.4 3.4 0 1 1 -2.8 2Z" transform="translate(.5 0)"/>'}],
  BC:[{n:'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', b:[-1.33,-2.6,1.33,2.6], pads:[[0,-1.27],[0,1.27]], use:[2,3], s:'<path d="M0 -2.6H-1.33V-1.27M0 -2.6H1.33V-1.27"/>' + rc(-1.33,0,1.33,2.6)}],
  SW:[{n:'SW_Slide_SPST_P10.16mm', b:[-6.5,-3,6.5,3], s:rc(-6.5,-3,6.5,3) + rc(-1.5,-1.6,1.5,1.6)},
      {n:'SW_Push_6mm_P10.16mm', b:[-3.5,-3.5,3.5,3.5], s:rc(-3.5,-3.5,3.5,3.5) + ci(0,0,2)}],
  PB:[{n:'Button_Switch_THT:SW_PUSH_6mm', b:[-3,-3,3,3], pads:[[-3.125,-2.25],[-3.125,2.25],[3.125,-2.25],[3.125,2.25]], use:[0,0,1,1], s:rc(-3,-3,3,3) + ci(0,0,1.75)}],
  LAMP:[{n:'Lamp_E10_Holder', b:[-5.5,-5.5,5.5,5.5], s:ci(0,0,5.5) + ci(0,0,2.5)},
        {n:'Lamp_T1_Wire_P10.16mm', b:[-4,-4,4,4], s:ci(0,0,4)}]
};
const FAM = t => ({LEDY:'LED', LEDG:'LED', NPN:'BJT', PNP:'BJT'}[t] || t);
const rot = (x, y, r) => { for(let i = 0; i < (r & 3); i++){ const t = x; x = -y; y = t; } return [x, y]; };
const snap = v => Math.round(v / 10) * 10;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[ch]));

const segDist = (w, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((w.x - a[0]) * dx + (w.y - a[1]) * dy) / l2)) : 0;
  return Math.hypot(w.x - (a[0] + t * dx), w.y - (a[1] + t * dy));
};
// مسیر ۴۵ درجه بین دو نقطه: یک خط افقی/عمودی + یک خط مورب
const dog = (a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], ax = Math.abs(dx), ay = Math.abs(dy);
  return ax >= ay ? [a[0] + Math.sign(dx) * (ax - ay), a[1]] : [a[0], a[1] + Math.sign(dy) * (ay - ax)];
};
// ctrl = [پد اول، نقطه‌های عبور…، پد دوم]؛ sub[i] = شمارهٔ بازه‌ای که پاره‌خط i به آن تعلق دارد
const route = ctrl => {
  const pts = [ctrl[0]], sub = [];
  for(let j = 1; j < ctrl.length; j++){
    [dog(ctrl[j - 1], ctrl[j]), ctrl[j]].forEach(q => {
      const l = pts[pts.length - 1];
      if(q[0] !== l[0] || q[1] !== l[1]){ pts.push(q); sub.push(j - 1); }
    });
  }
  return {pts, sub};
};
const pid = p => p.c.id + ':' + p.i;

/* آیکن‌های دکمه‌های نوار کناری (هم‌سبک آیکن‌های ادیتور شماتیک) */
const svgI = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const IC = {
  select:svgI('<path d="m5 3 14 8-6 2-3 6z"/>'),
  route:svgI('<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2"/>'),
  rotate:svgI('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  del:svgI('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'),
  layout:svgI('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
  pdf:svgI('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9.5 14.5 12 17l2.5-2.5"/>'),
  routes:svgI('<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5"/>')
};
let cssDone = false;
function injectCss(){
  if(cssDone) return; cssDone = true;
  const s = document.createElement('style');
  s.textContent = '.pcb-auto{display:inline-flex;align-items:center;justify-content:center;gap:8px}.pcb-auto svg{width:16px;height:16px;flex:none}' +
    '.pcb-exp{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(0,8,20,.62)}' +
    '.pcb-exp-card{width:min(380px,100%);max-height:100%;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:14px;background:#0a1426;border:1px solid #26354d;border-radius:12px;box-shadow:0 18px 50px -12px rgba(0,0,0,.8);direction:rtl;font-family:Vazirmatn,sans-serif;color:var(--parchment,#e8e2d0);outline:none}' +
    '.pcb-exp-card label{display:flex;align-items:center;gap:8px;font-size:13.5px;line-height:1.6;cursor:pointer}.pcb-exp-card label small{opacity:.6;font:11px monospace;direction:ltr}' +
    '.pcb-exp-card label.sub{margin-inline-start:26px;font-size:12.5px;opacity:.9}.pcb-exp-card input[type=checkbox]{width:17px;height:17px;accent-color:#57d8a3;flex:none}' +
    '.pcb-exp-card select{margin-inline-start:auto;font:12.5px Vazirmatn,sans-serif;color:#e8e8e8;background:#001023;border:1px solid #34455f;border-radius:7px;padding:5px 7px}' +
    '.pcb-exp-msg{min-height:20px;font-size:12px;line-height:1.7;color:#ffd98a}.pcb-exp-row{display:flex;gap:8px}' +
    '.pcb-exp-row button{flex:1;font:700 13.5px Vazirmatn,sans-serif;padding:9px;border-radius:9px;border:1px solid #34455f;background:#101c33;color:var(--parchment,#e8e2d0);cursor:pointer}' +
    '.pcb-exp-row button:hover{border-color:var(--copper,#e79a54)}.pcb-exp-row button.go{color:#08150f;background:linear-gradient(90deg,#2fbf8a,#57d8a3);border-color:#57d8a3}';
  document.head.appendChild(s);
}


/* ====================================================================
   چیدمان و ترک‌کشی خودکار — بدون برخورد
   • مسیریاب: A* روی شبکهٔ ۰٫۶۳۵ میلی‌متری با حرکت‌های ۰/۴۵/۹۰ درجه. پدها و ترک‌های
     شبکه‌های دیگر مانع‌اند (با فاصلهٔ ایمنی)، پس ترک دور می‌زند به‌جای اینکه از روی آن‌ها رد شود.
   • چیدمان: شبیه‌سازی تبرید (جابه‌جایی، چرخش، جابه‌جاییِ دو قطعه) با هزینهٔ طول سیم، هم‌پوشانی
     و تقاطع؛ بهترین چیدمان‌ها واقعاً ترک‌کشی می‌شوند و بهترین نتیجه نگه داشته می‌شود.
   ==================================================================== */
const TW = .9 * MM, CLR = .3 * MM, STEP = 5, TURN = .7, COURT_PEN = .9, EPS = .8;
const DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const prng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ptSeg = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
};
const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const segSeg = (a, b, c, d) => {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  if(o1 * o2 < 0 && o3 * o4 < 0) return 0;
  return Math.min(ptSeg(a[0], a[1], c[0], c[1], d[0], d[1]), ptSeg(b[0], b[1], c[0], c[1], d[0], d[1]),
    ptSeg(c[0], c[1], a[0], a[1], b[0], b[1]), ptSeg(d[0], d[1], a[0], a[1], b[0], b[1]));
};
const nearEq = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
const polyLen = p => { let s = 0; for(let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
// نقطه‌های تکراری و میانی‌های هم‌راستا را حذف می‌کند
const clean = pts => {
  const o = [];
  pts.forEach(p => { if(!o.length || !nearEq(o[o.length - 1], p)) o.push(p); });
  for(let i = o.length - 2; i > 0; i--){
    const a = o[i - 1], b = o[i], c = o[i + 1];
    if(Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-4 && (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]) > 0) o.splice(i, 1);
  }
  return o;
};
const dogPoly = (a, b) => clean([a, dog(a, b), b]);
const samePoly = (A, B) => { A = clean(A); B = clean(B); return A.length === B.length && A.every((p, i) => nearEq(p, B[i])); };
// چندخطیِ هشت‌جهته → کمترین نقاط عبور که route() دقیقاً همان مسیر را بازسازی کند
const toWps = P => {
  const n = P.length - 1, w = [];
  let i = 0;
  while(i < n){
    let j = n;
    for(; j > i + 1; j--) if(samePoly(route([P[i], P[j]]).pts, P.slice(i, j + 1))) break;
    if(j < n) w.push(P[j]);
    i = j;
  }
  return w;
};

const heap = () => {
  const F = [], S = [], G = [];
  return {
    get n(){ return F.length; },
    push(f, s, g){
      let i = F.length; F.push(f); S.push(s); G.push(g);
      while(i > 0){ const p = (i - 1) >> 1; if(F[p] <= f) break; F[i] = F[p]; S[i] = S[p]; G[i] = G[p]; i = p; }
      F[i] = f; S[i] = s; G[i] = g;
    },
    pop(){
      const rs = S[0], rg = G[0], lf = F.pop(), ls = S.pop(), lg = G.pop(), n = F.length;
      if(n){
        let i = 0;
        for(;;){
          let c = 2 * i + 1; if(c >= n) break;
          if(c + 1 < n && F[c + 1] < F[c]) c++;
          if(F[c] >= lf) break;
          F[i] = F[c]; S[i] = S[c]; G[i] = G[c]; i = c;
        }
        F[i] = lf; S[i] = ls; G[i] = lg;
      }
      return [rs, rg];
    }
  };
};

/* مسیریاب: pads = [{x,y,net,sq,cid}]، courts = [{cid,x0,y0,x1,y1}]، region = جعبهٔ مجازِ ترک (px) */
function makeRouter(pads, courts, region){
  const ox = Math.floor(region.x0 / STEP) * STEP, oy = Math.floor(region.y0 / STEP) * STEP;
  const W = Math.ceil((region.x1 - ox) / STEP) + 1, H = Math.ceil((region.y1 - oy) / STEP) + 1, N = W * H;
  const padOwn = new Int32Array(N), trOwn = new Int32Array(N), court = new Int16Array(N);
  const gS = new Float64Array(N * 9), stamp = new Uint32Array(N * 9), par = new Int32Array(N * 9);
  let gen = 0, traces = [];
  const nets = new Map();
  pads.forEach(p => { if(!nets.has(p.net)) nets.set(p.net, nets.size + 1); p.n = nets.get(p.net); p.R = (p.sq ? 1.1 : .9) * MM; });
  const cidx = new Map(courts.map((c, i) => [c.cid, i + 1]));

  const mark = (arr, n, R, ax, ay, bx, by) => {
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - R - ox) / STEP)), i1 = Math.min(W - 1, Math.ceil((Math.max(ax, bx) + R - ox) / STEP));
    const j0 = Math.max(0, Math.floor((Math.min(ay, by) - R - oy) / STEP)), j1 = Math.min(H - 1, Math.ceil((Math.max(ay, by) + R - oy) / STEP));
    for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++){
      if(ptSeg(ox + i * STEP, oy + j * STEP, ax, ay, bx, by) > R) continue;
      const k = j * W + i, v = arr[k]; arr[k] = (v === 0 || v === n) ? n : -1;
    }
  };
  pads.forEach(p => mark(padOwn, p.n, p.R + TW / 2 + CLR + EPS, p.x, p.y, p.x, p.y));
  courts.forEach((c, ci) => {
    const i0 = Math.max(0, Math.ceil((c.x0 - ox) / STEP)), i1 = Math.min(W - 1, Math.floor((c.x1 - ox) / STEP));
    const j0 = Math.max(0, Math.ceil((c.y0 - oy) / STEP)), j1 = Math.min(H - 1, Math.floor((c.y1 - oy) / STEP));
    for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++) court[j * W + i] = ci + 1;
  });
  const pass = (k, n) => { const a = padOwn[k], b = trOwn[k]; return !((a && a !== n) || (b && b !== n)); };

  // بررسی دقیق (نه روی شبکه): پاره‌خط‌های poly با پدها و ترک‌های شبکه‌های دیگر
  const clearPoly = (poly, n) => {
    const q = poly.length < 2 ? [poly[0], poly[0]] : poly;
    for(let s = 0; s < q.length - 1; s++){
      const a = q[s], b = q[s + 1];
      for(const p of pads) if(p.n !== n && ptSeg(p.x, p.y, a[0], a[1], b[0], b[1]) < p.R + TW / 2 + CLR - .01 * MM) return false;
      for(const t of traces) if(t.n !== n && segSeg(a, b, t.a, t.b) < TW + CLR - .01 * MM) return false;
    }
    return true;
  };
  // گره‌های شبکه که می‌شود از مرکز پد به آن‌ها رسید (پد روی شبکه نباشد، با یک خط راست + مورب)
  const access = (p, goal) => {
    const ci = Math.round((p.x - ox) / STEP), cj = Math.round((p.y - oy) / STEP), out = [];
    for(let dj = -4; dj <= 4; dj++) for(let di = -4; di <= 4; di++){
      const i = ci + di, j = cj + dj; if(i < 0 || j < 0 || i >= W || j >= H) continue;
      const k = j * W + i; if(!pass(k, p.n)) continue;
      const node = [ox + i * STEP, oy + j * STEP], c = [p.x, p.y];
      const poly = goal ? dogPoly(node, c) : dogPoly(c, node), len = polyLen(poly) / STEP;
      if(len <= 6) out.push({k, poly, cost:len});
    }
    out.sort((a, b) => a.cost - b.cost);
    const ok = [];
    for(const o of out){ if(clearPoly(o.poly, p.n)) ok.push(o); if(ok.length >= 8) break; }
    return ok;
  };

  function search(n, seeds, goals, own, tx, ty){
    gen++;
    const hp = heap();
    const hh = k => { const dx = Math.abs(ox + (k % W) * STEP - tx) / STEP, dy = Math.abs(oy + ((k / W) | 0) * STEP - ty) / STEP; const h = Math.max(dx, dy) + .4142 * Math.min(dx, dy) - 5; return h > 0 ? h : 0; };
    seeds.forEach(s => {
      const st = s.k * 9 + 8;
      if(stamp[st] === gen && gS[st] <= s.cost) return;
      stamp[st] = gen; gS[st] = s.cost; par[st] = -1; hp.push(s.cost + hh(s.k), st, s.cost);
    });
    let pops = 0;
    while(hp.n){
      const [st, g] = hp.pop();
      if(g > gS[st]) continue;
      const k = (st / 9) | 0, d = st - k * 9;
      if(goals.has(k)){
        const cells = [];
        for(let s = st; s !== -1; s = par[s]) cells.push((s / 9) | 0);
        return cells.reverse();
      }
      if(++pops > 700000) return null;
      const ci = k % W, cj = (k / W) | 0;
      for(let nd = 0; nd < 8; nd++){
        let turn = 0;
        if(d < 8){ turn = Math.abs(nd - d); if(turn > 4) turn = 8 - turn; if(turn > 2) continue; }
        const i = ci + DIRS[nd][0], j = cj + DIRS[nd][1];
        if(i < 0 || j < 0 || i >= W || j >= H) continue;
        const nk = j * W + i, a = padOwn[nk], b = trOwn[nk];
        if((a && a !== n) || (b && b !== n)) continue;
        let cst = (nd & 1 ? 1.4142 : 1) + turn * TURN;
        const cc = court[nk]; if(cc && !own.has(cc)) cst += COURT_PEN;
        const ns = nk * 9 + nd, ng = g + cst;
        if(stamp[ns] === gen && gS[ns] <= ng) continue;
        stamp[ns] = gen; gS[ns] = ng; par[ns] = st; hp.push(ng + hh(nk), ns, ng);
      }
    }
    return null;
  }

  function route1(e){
    const n = e.a.n, ps = access(e.a, false), qs = access(e.b, true);
    if(!ps.length || !qs.length) return null;
    const goals = new Map(), seeds = new Map();
    qs.forEach(g => { if(!goals.has(g.k)) goals.set(g.k, g); });
    ps.forEach(s => { if(!seeds.has(s.k)) seeds.set(s.k, s); });
    const own = new Set([cidx.get(e.a.cid), cidx.get(e.b.cid)]);
    const cells = search(n, [...seeds.values()], goals, own, e.b.x, e.b.y);
    if(!cells) return null;
    const mid = cells.map(k => [ox + (k % W) * STEP, oy + ((k / W) | 0) * STEP]);
    return clean(seeds.get(cells[0]).poly.concat(mid, goals.get(cells[cells.length - 1]).poly));
  }
  function addTrace(poly, n){
    for(let i = 1; i < poly.length; i++){
      mark(trOwn, n, TW + CLR + EPS, poly[i - 1][0], poly[i - 1][1], poly[i][0], poly[i][1]);
      traces.push({n, a:poly[i - 1], b:poly[i]});
    }
  }
  function routeAll(order){
    trOwn.fill(0); traces = [];
    const routes = {}, failed = []; let cost = 0;
    order.forEach(e => {
      const poly = route1(e);
      if(!poly){ failed.push(e.id); return; }
      routes[e.id] = poly; addTrace(poly, e.a.n);
      cost += polyLen(poly) / MM + .5 * Math.max(0, poly.length - 2);
    });
    return {routes, failed, cost};
  }
  return {routeAll};
}

/* چیدمان: شبیه‌سازی تبرید. P[i] = {sx,sy,base,g:[۴ هندسه]}، nets = [[ [قطعه، پد], … ], …] */
function anneal(P, nets, o){
  const n = P.length, rnd = prng(o.seed), gap = o.gap * MM;
  const X = [], Y = [], R = [];
  P.forEach((p, i) => {
    const sc = o.jitter ? .35 + rnd() * .5 : .5, jt = o.jitter ? 80 : 0;
    X[i] = snap(p.sx * sc + (rnd() - .5) * jt); Y[i] = snap(p.sy * sc + (rnd() - .5) * jt); R[i] = p.base;
  });
  const ap = P.map(p => p.g[0].pads.map(() => [0, 0])), rc = P.map(() => [0, 0, 0, 0]);
  const pn = P.map(p => p.g[0].pads.map(() => -2));
  nets.forEach((l, ni) => l.forEach(q => { pn[q[0]][q[1]] = ni; }));
  const near = P.map(() => []);
  nets.forEach(l => l.forEach(a => l.forEach(b => { if(a[0] !== b[0] && !near[a[0]].includes(b[0])) near[a[0]].push(b[0]); })));
  let overlap = false;

  const cost = () => {
    let c = 0, mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    overlap = false;
    for(let i = 0; i < n; i++){
      const g = P[i].g[R[i]];
      rc[i][0] = X[i] + g.x0; rc[i][1] = Y[i] + g.y0; rc[i][2] = X[i] + g.x1; rc[i][3] = Y[i] + g.y1;
      g.pads.forEach((q, k) => { ap[i][k][0] = X[i] + q[0]; ap[i][k][1] = Y[i] + q[1]; });
      mnx = Math.min(mnx, rc[i][0]); mny = Math.min(mny, rc[i][1]); mxx = Math.max(mxx, rc[i][2]); mxy = Math.max(mxy, rc[i][3]);
      if(R[i] !== P[i].base) c += .4;
    }
    for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++){
      const dx = Math.min(rc[i][2], rc[j][2]) - Math.max(rc[i][0], rc[j][0]) + gap, dy = Math.min(rc[i][3], rc[j][3]) - Math.max(rc[i][1], rc[j][1]) + gap;
      if(dx > 0 && dy > 0){ c += 300 + 40 * Math.min(dx, dy) / MM; overlap = true; }
    }
    const segs = [];
    nets.forEach((net, ni) => {                      // درخت پوشای کمینه (فاصلهٔ منهتن)
      const m = net.length, inT = new Array(m).fill(false), dist = new Array(m).fill(Infinity), from = new Array(m).fill(-1);
      dist[0] = 0;
      for(let it = 0; it < m; it++){
        let u = -1; for(let k = 0; k < m; k++) if(!inT[k] && (u < 0 || dist[k] < dist[u])) u = k;
        inT[u] = true;
        if(from[u] >= 0 && dist[u] < 1e5){
          const a = ap[net[from[u]][0]][net[from[u]][1]], b = ap[net[u][0]][net[u][1]];
          c += dist[u] / MM; segs.push([a, b, ni]);
        }
        const a = ap[net[u][0]][net[u][1]];
        for(let k = 0; k < m; k++) if(!inT[k]){
          const b = ap[net[k][0]][net[k][1]], d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + (net[u][0] === net[k][0] ? 1e5 : 0);
          if(d < dist[k]){ dist[k] = d; from[k] = u; }
        }
      }
    });
    for(let a = 0; a < segs.length; a++){
      const s = segs[a];
      for(let b = a + 1; b < segs.length; b++){ const t = segs[b]; if(t[2] !== s[2] && segSeg(s[0], s[1], t[0], t[1]) === 0) c += 25; }
      for(let i = 0; i < n; i++) for(let k = 0; k < pn[i].length; k++)
        if(pn[i][k] !== s[2] && ptSeg(ap[i][k][0], ap[i][k][1], s[0][0], s[0][1], s[1][0], s[1][1]) < 1.9 * MM) c += 10;
    }
    return c + .3 * ((mxx - mnx) + (mxy - mny)) / MM;
  };

  let cur = cost(), best = {c:cur, X:X.slice(), Y:Y.slice(), R:R.slice()};
  const T0 = 9, T1 = .12, iters = o.iters;
  for(let it = 0; it < iters; it++){
    const T = T0 * Math.pow(T1 / T0, it / iters), i = (rnd() * n) | 0, m = rnd();
    const sv = {x:X[i], y:Y[i], r:R[i], j:-1};
    if(m < .5){
      const rg = 1 + Math.floor(10 * T / T0);
      X[i] += (Math.floor(rnd() * (2 * rg + 1)) - rg) * 10; Y[i] += (Math.floor(rnd() * (2 * rg + 1)) - rg) * 10;
    } else if(m < .7){
      R[i] = (R[i] + 1 + Math.floor(rnd() * 3)) & 3;
    } else if(m < .85 && n > 1){
      let j = Math.floor(rnd() * (n - 1)); if(j >= i) j++;
      sv.j = j; sv.jx = X[j]; sv.jy = Y[j];
      [X[i], X[j]] = [X[j], X[i]]; [Y[i], Y[j]] = [Y[j], Y[i]];
    } else if(near[i].length){
      const j = near[i][Math.floor(rnd() * near[i].length)], gi = P[i].g[R[i]], gj = P[j].g[R[j]];
      if(rnd() < .5) { X[i] = snap(X[j] + (rnd() < .5 ? -1 : 1) * ((gi.x1 - gi.x0 + gj.x1 - gj.x0) / 2 + gap + rnd() * 30)); Y[i] = snap(Y[j] + (rnd() - .5) * 60); }
      else { Y[i] = snap(Y[j] + (rnd() < .5 ? -1 : 1) * ((gi.y1 - gi.y0 + gj.y1 - gj.y0) / 2 + gap + rnd() * 30)); X[i] = snap(X[j] + (rnd() - .5) * 60); }
    }
    const nc = cost(), d = nc - cur;
    if(d <= 0 || rnd() < Math.exp(-d / T)){
      cur = nc;
      if(cur < best.c) best = {c:cur, X:X.slice(), Y:Y.slice(), R:R.slice()};
    } else {
      X[i] = sv.x; Y[i] = sv.y; R[i] = sv.r;
      if(sv.j >= 0){ X[sv.j] = sv.jx; Y[sv.j] = sv.jy; }
    }
  }
  for(let i = 0; i < n; i++){ X[i] = best.X[i]; Y[i] = best.Y[i]; R[i] = best.R[i]; }
  const final = cost(), ok = !overlap;
  let mx = 1e9, my = 1e9;                              // مبدأ را به گوشهٔ چپ‌بالا ببر
  for(let i = 0; i < n; i++){ mx = Math.min(mx, rc[i][0]); my = Math.min(my, rc[i][1]); }
  mx = snap(mx); my = snap(my);
  return {X:X.map(v => v - mx), Y:Y.map(v => v - my), R:R.slice(), cost:final, ok};
}

/* ====================================================================
   خروجی PDF (مثل Plot در KiCad): لایه‌های مس (ترک + پد)، سیلک‌اسکرین و لبهٔ برد
   برداری، با مقیاس ۱:۱ روی A4 (یا هم‌اندازهٔ برد)، سیاه‌وسفید یا رنگی، و حالت آینه‌ای
   ==================================================================== */
const HW = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const pdfTxt = s => String(s).replace(/Ω/g, ' ohm').replace(/μ/g, '\xb5').replace(/[^\x20-\x7e\xb5]/g, '');
const pdfW = (s, fs) => { let w = 0; for(const ch of s){ const c = ch.charCodeAt(0); w += c >= 32 && c <= 126 ? HW[c - 32] : 556; } return w * fs / 1000; };
const pdfEsc = s => s.replace(/[\\()]/g, '\\$&').replace(/\xb5/g, '\\265');
const fx = n => String(+n.toFixed(3));

// کمان SVG → منحنی‌های بزیه
function arcToBez(x1, y1, rx, ry, phi, fa, fs, x2, y2){
  if(!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const cp = Math.cos(phi), sp = Math.sin(phi), dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy, l = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
  if(l > 1){ const s = Math.sqrt(l); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den)), cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if(!fs && dth > 0) dth -= 2 * Math.PI; else if(fs && dth < 0) dth += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dth) / (Math.PI / 2) - 1e-9)), d = dth / n, t = 4 / 3 * Math.tan(d / 4), out = [];
  let a = th1;
  const map = (u, v) => [cx + rx * u * cp - ry * v * sp, cy + rx * u * sp + ry * v * cp];
  for(let i = 0; i < n; i++, a += d){
    const c1 = Math.cos(a), s1 = Math.sin(a), c2 = Math.cos(a + d), s2 = Math.sin(a + d);
    out.push([].concat(map(c1 - t * s1, s1 + t * c1), map(c2 + t * s2, s2 - t * c2), map(c2, s2)));
  }
  return out;
}
const bez = b => ({t:'C', c1:[b[0], b[1]], c2:[b[2], b[3]], p:[b[4], b[5]]});
const circleCmds = (cx, cy, r) => [{t:'M', p:[cx + r, cy]}]
  .concat(arcToBez(cx + r, cy, r, r, 0, 0, 1, cx - r, cy).map(bez), arcToBez(cx - r, cy, r, r, 0, 0, 1, cx + r, cy).map(bez), [{t:'Z'}]);
const rectCmds = (x0, y0, x1, y1) => [{t:'M', p:[x0, y0]}, {t:'L', p:[x1, y0]}, {t:'L', p:[x1, y1]}, {t:'L', p:[x0, y1]}, {t:'Z'}];
// d مسیر SVG (M L H V C A Z، بزرگ و کوچک) → فرمان‌ها
function parseD(d){
  const tk = d.match(/[MmLlHhVvAaCcZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [], out = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  const num = () => parseFloat(tk[i++]);
  while(i < tk.length){
    if(/[A-Za-z]/.test(tk[i])) cmd = tk[i++];
    else if(cmd === 'M') cmd = 'L'; else if(cmd === 'm') cmd = 'l';
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if(C === 'Z'){ out.push({t:'Z'}); x = sx; y = sy; if(i < tk.length && !/[A-Za-z]/.test(tk[i])) break; continue; }
    if(C === 'M' || C === 'L'){ let nx = num(), ny = num(); if(rel){ nx += x; ny += y; } out.push({t:C, p:[nx, ny]}); x = nx; y = ny; if(C === 'M'){ sx = x; sy = y; } }
    else if(C === 'H'){ let nx = num(); if(rel) nx += x; out.push({t:'L', p:[nx, y]}); x = nx; }
    else if(C === 'V'){ let ny = num(); if(rel) ny += y; out.push({t:'L', p:[x, ny]}); y = ny; }
    else if(C === 'C'){ const v = [num(), num(), num(), num(), num(), num()]; if(rel) for(let j = 0; j < 6; j += 2){ v[j] += x; v[j + 1] += y; } out.push(bez(v)); x = v[4]; y = v[5]; }
    else if(C === 'A'){
      const rx = num(), ry = num(), ph = num() * Math.PI / 180, fa = num(), fs = num(); let nx = num(), ny = num();
      if(rel){ nx += x; ny += y; }
      arcToBez(x, y, rx, ry, ph, fa, fs, nx, ny).forEach(b => out.push(bez(b))); x = nx; y = ny;
    } else break;
  }
  return out;
}
const shapeCache = new Map();
// کد SVG سیلک یک فوت‌پرینت (مختصات میلی‌متر) → فهرست مسیرها
function silkShapes(s){
  if(shapeCache.has(s)) return shapeCache.get(s);
  const out = [];
  try{
    const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + s + '</svg>', 'image/svg+xml');
    doc.querySelectorAll('rect,circle,path').forEach(n => {
      const g = a => parseFloat(n.getAttribute(a)) || 0, tr = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(n.getAttribute('transform') || '');
      const tx = tr ? +tr[1] : 0, ty = tr ? +tr[2] : 0;
      let cm = n.tagName === 'rect' ? rectCmds(g('x'), g('y'), g('x') + g('width'), g('y') + g('height'))
        : n.tagName === 'circle' ? circleCmds(g('cx'), g('cy'), g('r')) : parseD(n.getAttribute('d') || '');
      if(tx || ty) cm = cm.map(c => c.t === 'Z' ? c : c.t === 'C' ? {t:'C', c1:[c.c1[0] + tx, c.c1[1] + ty], c2:[c.c2[0] + tx, c.c2[1] + ty], p:[c.p[0] + tx, c.p[1] + ty]} : {t:c.t, p:[c.p[0] + tx, c.p[1] + ty]});
      out.push(cm);
    });
  }catch(_){}
  shapeCache.set(s, out);
  return out;
}
const pathOps = (cmds, T) => cmds.map(c => {
  if(c.t === 'Z') return 'h';
  if(c.t === 'C'){ const a = T(c.c1[0], c.c1[1]), b = T(c.c2[0], c.c2[1]), p = T(c.p[0], c.p[1]); return [a[0], a[1], b[0], b[1], p[0], p[1]].map(fx).join(' ') + ' c'; }
  const p = T(c.p[0], c.p[1]); return fx(p[0]) + ' ' + fx(p[1]) + (c.t === 'M' ? ' m' : ' l');
}).join(' ');

/* o = {cu, silk, val, edge, mirror, bw, page:'a4'|'board'} → {blob, scale, w, h} (w و h به میلی‌متر) */
function pcbPdf(M, o){
  const b = M.board, bw = (b.x1 - b.x0) / MM, bh = (b.y1 - b.y0) / MM, pt = 72 / 25.4;
  let pw, ph, sc = 1;
  if(o.page === 'board'){ pw = bw + 10; ph = bh + 10; }
  else { const land = bw > bh; pw = land ? 297 : 210; ph = land ? 210 : 297; sc = Math.min(1, (pw - 20) / bw, (ph - 20) / bh); }
  const ox = (pw - bw * sc) / 2, oy = (ph - bh * sc) / 2, k = sc * pt / MM;
  const X = x => (o.mirror ? b.x1 - x : x - b.x0) * k + ox * pt, Y = y => (ph - oy) * pt - (y - b.y0) * k, T0 = (x, y) => [X(x), Y(y)];
  const CL = o.bw ? {cu:[0, 0, 0], silk:[0, 0, 0], edge:[0, 0, 0]} : {cu:[.78, .2, .2], silk:[0, .55, .72], edge:[.8, .6, 0]};
  const col = a => a.map(fx).join(' ') + ' RG ' + a.map(fx).join(' ') + ' rg';
  const q = ['1 J 1 j'];
  if(o.cu){
    q.push(col(CL.cu), fx(.9 * MM * k) + ' w');
    M.paths.forEach(p => q.push(p.pts.map((r, i) => fx(X(r[0])) + ' ' + fx(Y(r[1])) + (i ? ' l' : ' m')).join(' ') + ' S'));
    M.comps.forEach(c => c.abs.forEach((a, i) => {
      const r = .9 * MM, sq = !i && (c.t !== 'BC' || !!c.f.use);
      q.push(pathOps(sq ? rectCmds(a.x - r, a.y - r, a.x + r, a.y + r) : circleCmds(a.x, a.y, r), T0) + ' f');
    }));
    q.push('1 1 1 rg');
    M.comps.forEach(c => c.abs.forEach(a => q.push(pathOps(circleCmds(a.x, a.y, .5 * MM), T0) + ' f')));
  }
  if(o.silk){
    q.push(col(CL.silk), fx(.2 * MM * k) + ' w');
    const text = (str, cx, y, fs, bold) => {
      const s = pdfTxt(str); if(!s) return;
      const sz = fs * k, w = pdfW(s, sz);
      q.push('BT /F' + (bold ? 2 : 1) + ' ' + fx(sz) + ' Tf ' + (o.mirror ? -1 : 1) + ' 0 0 1 ' + fx(X(cx) + (o.mirror ? w / 2 : -w / 2)) + ' ' + fx(Y(y)) + ' Tm (' + pdfEsc(s) + ') Tj ET');
    };
    M.comps.forEach(c => {
      const T = (lx, ly) => { const r = rot(lx * MM, ly * MM, c.r); return [X(c.px + r[0]), Y(c.py + r[1])]; };
      silkShapes(c.f.s).forEach(cm => q.push(pathOps(cm, T) + ' S'));
      const mx = (c.bb.x0 + c.bb.x1) / 2;
      text(c.ref, mx, c.bb.y0 - 6, 14, true);
      if(o.val) text(c.val, mx, c.bb.y1 + 14, 12, false);
    });
  }
  if(o.edge) q.push(col(CL.edge), fx(.2 * MM * k) + ' w', pathOps(rectCmds(b.x0, b.y0, b.x1, b.y1), T0) + ' S');
  const content = q.join('\n'), W = fx(pw * pt), H = fx(ph * pt);
  const objs = [null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
  let pdf = '%PDF-1.4\n'; const off = [];
  for(let i = 1; i < objs.length; i++){ off[i] = pdf.length; pdf += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
  const xr = pdf.length;
  pdf += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n' + off.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
  return {blob:new Blob([pdf], {type:'application/pdf'}), scale:sc, w:bw, h:bh};
}
const EXP = {cu:true, silk:false, val:false, edge:true, mirror:false, bw:true, page:'a4'};   // انتخاب‌های آخرین خروجی

function create(host, api){
  const KEY = api.key ? 'cpcb:' + api.key : '';
  let st = {fp:{}, pos:{}, routes:{}, rot:{}, del:{}, extra:{}};
  try{ if(KEY){ const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d && d.fp && d.pos) st = d; } }catch(_){}
  ['routes', 'rot', 'del', 'extra'].forEach(n => { if(!st[n] || typeof st[n] !== 'object') st[n] = {}; });
  const save = () => { try{ if(KEY) localStorage.setItem(KEY, JSON.stringify(st)); }catch(_){} };
  let M = null, view = {x:0, y:0, z:1}, sel = null, selT = null, el = null, drag = null, tool = 'select', routing = null, cur = {x:0, y:0}, flash = '';

  function rebuild(){
    const src = api.src();
    const items = src.comps.filter(c => !c.power && FP[FAM(c.t)]);
    const ids = new Set(items.map(c => String(c.id)));
    Object.keys(st.pos).forEach(k => { if(!ids.has(k)) delete st.pos[k]; });
    Object.keys(st.rot).forEach(k => { if(!ids.has(k)) delete st.rot[k]; });
    ['routes', 'del', 'extra'].forEach(n => Object.keys(st[n]).forEach(k => { if(k.split('|').some(h => !ids.has(h.split(':')[0]))) delete st[n][k]; }));
    const comps = items.map(c => {
      const fam = FP[FAM(c.t)], fi = Math.min(st.fp[c.id] | 0, fam.length - 1), f = fam[fi];
      const pm = f.use || c.lpins.map((_, i) => i);
      const pads = f.pads ? f.pads.map((q, i) => ({lx:q[0], ly:q[1], name:(c.lpins[pm[i]] || [])[2], pi:pm[i]})) : c.lpins.map((p, i) => ({lx:p[0] / MM, ly:p[1] / MM, name:p[2], pi:i}));
      let x0 = f.b[0], y0 = f.b[1], x1 = f.b[2], y1 = f.b[3];
      pads.forEach(p => { x0 = Math.min(x0, p.lx - 1.15); x1 = Math.max(x1, p.lx + 1.15); y0 = Math.min(y0, p.ly - 1.15); y1 = Math.max(y1, p.ly + 1.15); });
      return Object.assign({}, c, {fam, fi, f, pads, r:((c.r | 0) + (st.rot[c.id] | 0)) & 3, cr:[x0 - .25, y0 - .25, x1 + .25, y1 + .25]});
    });
    const half = c => {
      const xs = [], ys = [];
      [[c.cr[0], c.cr[1]], [c.cr[2], c.cr[1]], [c.cr[0], c.cr[3]], [c.cr[2], c.cr[3]]].forEach(p => { const q = rot(p[0] * MM, p[1] * MM, c.r); xs.push(q[0]); ys.push(q[1]); });
      return {x0:Math.min(...xs), x1:Math.max(...xs), y0:Math.min(...ys), y1:Math.max(...ys)};
    };
    const placed = comps.filter(c => st.pos[c.id]);
    let cx = 0, cy = 0;
    if(placed.length){
      let mnx = Infinity, mxy = -Infinity;
      placed.forEach(c => { const h = half(c), p = st.pos[c.id]; mnx = Math.min(mnx, p[0] + h.x0); mxy = Math.max(mxy, p[1] + h.y1); });
      cx = mnx; cy = mxy + 60;
    }
    let rowH = 0; const started = cx;
    comps.filter(c => !st.pos[c.id]).sort((a, b) => a.sy - b.sy || a.sx - b.sx).forEach(c => {
      const h = half(c), w = h.x1 - h.x0;
      if(cx > started && cx + w > started + 330){ cx = started; cy += rowH + 60; rowH = 0; }
      st.pos[c.id] = [snap(cx - h.x0), snap(cy - h.y0)];
      cx += w + 60; rowH = Math.max(rowH, h.y1 - h.y0);
    });
    comps.forEach(c => {
      const p = st.pos[c.id]; c.px = p[0]; c.py = p[1];
      c.abs = c.pads.map(q => { const r = rot(q.lx * MM, q.ly * MM, c.r); return {x:c.px + r[0], y:c.py + r[1]}; });
      const h = half(c); c.bb = {x0:c.px + h.x0, y0:c.py + h.y0, x1:c.px + h.x1, y1:c.py + h.y1};
    });

    const par = new Map(), k = (x, y) => x + ',' + y;
    const find = a => { if(!par.has(a)) par.set(a, a); while(par.get(a) !== a){ par.set(a, par.get(par.get(a))); a = par.get(a); } return a; };
    const uni = (a, b) => { a = find(a); b = find(b); if(a !== b) par.set(a, b); };
    src.wires.forEach(w => uni(k(w[0], w[1]), k(w[2], w[3])));
    const pts = [];
    src.comps.forEach(c => c.spins.forEach(p => pts.push(p)));
    src.wires.forEach(w => pts.push([w[0], w[1]], [w[2], w[3]]));
    src.wires.forEach(w => pts.forEach(p => {
      const dx = w[2] - w[0], dy = w[3] - w[1], L2 = dx * dx + dy * dy;
      if(!L2) return;
      const t = ((p[0] - w[0]) * dx + (p[1] - w[1]) * dy) / L2;
      if(t > 0 && t < 1 && Math.abs(w[0] + t * dx - p[0]) < .5 && Math.abs(w[1] + t * dy - p[1]) < .5) uni(k(p[0], p[1]), k(w[0], w[1]));
    }));
    let g0 = null; const vcc = {};
    src.comps.forEach(c => {
      if(c.t === 'GND'){ const q = k(c.spins[0][0], c.spins[0][1]); if(g0) uni(q, g0); else g0 = q; }
      if(c.t === 'VCC'){ const q = k(c.spins[0][0], c.spins[0][1]); if(vcc[c.val]) uni(q, vcc[c.val]); else vcc[c.val] = q; }
      if(c.link) c.link.forEach(l => uni(k(c.spins[l[0]][0], c.spins[l[0]][1]), k(c.spins[l[1]][0], c.spins[l[1]][1])));
    });
    const byId = new Map(src.comps.map(c => [c.id, c]));
    const nets = new Map();
    comps.forEach(c => {
      const sp = byId.get(c.id).spins;
      c.abs.forEach((a, i) => { const sq = sp[c.pads[i].pi], r = find(k(sq[0], sq[1])); if(!nets.has(r)) nets.set(r, []); nets.get(r).push({c, i, x:a.x, y:a.y}); });
    });
    const segs = [], paths = [], rats = [], autoIds = new Set(), padNet = new Map(), padBy = new Map();
    nets.forEach((pl, nr) => pl.forEach(a => { padNet.set(pid(a), nr); padBy.set(pid(a), a); }));
    const addPath = (id, p, q) => {
      const wps = st.routes[id] || [], rt = route([[p.x, p.y]].concat(wps, [[q.x, q.y]]));
      paths.push({id, pts:rt.pts, sub:rt.sub, wps, a:p, b:q});
      for(let i = 1; i < rt.pts.length; i++) segs.push([rt.pts[i - 1][0], rt.pts[i - 1][1], rt.pts[i][0], rt.pts[i][1]]);
    };
    nets.forEach(pl => {
      if(pl.length < 2) return;
      const inT = [pl[0]], rest = pl.slice(1);
      while(rest.length){
        let best = null;
        inT.forEach(a => rest.forEach((b, j) => { const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + (a.c === b.c ? 1e6 : 0); if(!best || d < best.d) best = {a, b, j, d}; }));
        rest.splice(best.j, 1); inT.push(best.b);
        if(best.d >= 1e6) continue;
        const [p, q] = pid(best.a) <= pid(best.b) ? [best.a, best.b] : [best.b, best.a], id = pid(p) + '|' + pid(q);
        autoIds.add(id);
        if(st.del[id]) rats.push([p.x, p.y, q.x, q.y]); else addPath(id, p, q);
      }
    });
    Object.keys(st.extra).forEach(id => {      // ترک‌هایی که کاربر دستی کشیده (بین دو پدِ هم‌شبکه)
      const [ia, ib] = id.split('|'), p = padBy.get(ia), q = padBy.get(ib);
      if(!p || !q || padNet.get(ia) !== padNet.get(ib)){ delete st.extra[id]; delete st.routes[id]; return; }
      if(!autoIds.has(id)) addPath(id, p, q);
    });
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    comps.forEach(c => { bx0 = Math.min(bx0, c.bb.x0); by0 = Math.min(by0, c.bb.y0); bx1 = Math.max(bx1, c.bb.x1); by1 = Math.max(by1, c.bb.y1); });
    if(!comps.length){ bx0 = by0 = 0; bx1 = by1 = 160; }
    const m = 3 * MM;
    let ex0 = bx0 - m, ey0 = by0 - m, ex1 = bx1 + m, ey1 = by1 + m;
    paths.forEach(p => p.pts.forEach(q => { ex0 = Math.min(ex0, q[0] - 1.5 * MM); ey0 = Math.min(ey0, q[1] - 1.5 * MM); ex1 = Math.max(ex1, q[0] + 1.5 * MM); ey1 = Math.max(ey1, q[1] + 1.5 * MM); }));
    M = {comps, paths, segs, rats, autoIds, padNet, padBy, pads:[...padBy.values()], board:{x0:snap(ex0), y0:snap(ey0), x1:snap(ex1), y1:snap(ey1)}};
  }

  function draw(){
    if(!M || !el) return;
    const o = [`<g transform="translate(${view.x} ${view.y}) scale(${view.z})">`];
    const b = M.board, tp = M.paths.find(p => p.id === selT);
    o.push(`<rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" fill="none" stroke="${COL.edge}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`);
    M.rats.forEach(r => o.push(`<path d="M${r[0]} ${r[1]}L${r[2]} ${r[3]}" fill="none" stroke="#a8b4c8" stroke-opacity=".75" stroke-width="${1.2 / view.z}" stroke-dasharray="${5 / view.z} ${4 / view.z}"/>`));
    M.paths.forEach(p => o.push(`<polyline points="${p.pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="${p === tp ? COL.cuSel : COL.cu}" stroke-width="${.9 * MM}" stroke-linecap="round" stroke-linejoin="round"/>`));
    M.comps.forEach(c => {
      const on = sel === c.id;
      o.push(`<g transform="translate(${c.px} ${c.py}) rotate(${(c.r & 3) * 90}) scale(${MM})">` +
        `<g fill="none" stroke="${COL.silk}" stroke-width=".2" stroke-linejoin="round">${c.f.s}</g>` +
        `<rect x="${c.cr[0]}" y="${c.cr[1]}" width="${c.cr[2] - c.cr[0]}" height="${c.cr[3] - c.cr[1]}" fill="${on ? 'rgba(77,224,255,.08)' : 'none'}" stroke="${on ? COL.sel : COL.crt}" stroke-width="${on ? 2 : 1}" vector-effect="non-scaling-stroke"/></g>`);
      c.pads.forEach((p, i) => {
        const a = c.abs[i], sq = !i && (c.t !== 'BC' || !!c.f.use);
        o.push(sq ? `<rect x="${a.x - .9 * MM}" y="${a.y - .9 * MM}" width="${1.8 * MM}" height="${1.8 * MM}" fill="${COL.cu}"/>` : `<circle cx="${a.x}" cy="${a.y}" r="${.9 * MM}" fill="${COL.cu}"/>`);
        o.push(`<circle cx="${a.x}" cy="${a.y}" r="${.5 * MM}" fill="${COL.bg}" stroke="#d9d9d9" stroke-width=".6"/>`);
        o.push(`<text x="${a.x}" y="${a.y - 1.9 * MM}" fill="#fff" font-size="6.5" text-anchor="middle" font-family="Arial,sans-serif" opacity=".85">${i + 1}</text>`);
      });
      const mx = (c.bb.x0 + c.bb.x1) / 2;
      o.push(`<text x="${mx}" y="${c.bb.y0 - 6}" fill="${COL.silk}" font-size="14" font-weight="600" text-anchor="middle" font-family="Arial,sans-serif">${esc(c.ref)}</text>`);
      o.push(`<text x="${mx}" y="${c.bb.y1 + 14}" fill="${COL.fab}" font-size="12" text-anchor="middle" font-family="Arial,sans-serif">${esc(c.val)}</text>`);
    });
    if(tp) tp.wps.forEach(q => o.push(`<circle cx="${q[0]}" cy="${q[1]}" r="${5 / view.z}" fill="#fff" stroke="${COL.sel}" stroke-width="${1.5 / view.z}"/>`));
    const rp = routing && M.padBy.get(routing.id);
    if(routing && !rp) routing = null;
    if(rp){
      const nt = M.padNet.get(routing.id);
      M.pads.forEach(a => { if(a !== rp && a.c !== rp.c && M.padNet.get(pid(a)) === nt) o.push(`<circle cx="${a.x}" cy="${a.y}" r="${1.5 * MM}" fill="none" stroke="${COL.sel}" stroke-width="${1.5 / view.z}"/>`); });
      const pv = route([[rp.x, rp.y]].concat(routing.wps, [[cur.x, cur.y]])).pts;
      o.push(`<polyline points="${pv.map(q => q.join(',')).join(' ')}" fill="none" stroke="${COL.cuSel}" stroke-opacity=".8" stroke-width="${.9 * MM}" stroke-linecap="round" stroke-linejoin="round"/>`);
      routing.wps.forEach(q => o.push(`<circle cx="${q[0]}" cy="${q[1]}" r="${5 / view.z}" fill="#fff" stroke="${COL.sel}" stroke-width="${1.5 / view.z}"/>`));
    }
    o.push('</g>');
    el.svg.innerHTML = o.join('');
    el.svg.style.backgroundImage = `radial-gradient(${COL.dot} 1px, transparent 1.2px)`;
    el.svg.style.backgroundSize = `${U * view.z}px ${U * view.z}px`;
    el.svg.style.backgroundPosition = `${view.x}px ${view.y}px`;
    const w = ((b.x1 - b.x0) / MM).toFixed(1), h = ((b.y1 - b.y0) / MM).toFixed(1), s = M.comps.find(c => c.id === sel);
    el.stat.textContent = (flash ? flash + ' • ' : '') + (tool === 'route' ? (routing ? 'روی پد دیگرِ همین شبکه بزن تا ترک تمام شود، یا نقطه بگذار • Esc = لغو • ' : 'سیم‌کشی: روی یک پد بزن • ') : '') + (tp ? 'ترک ' + tp.a.c.ref + '.' + (tp.a.i + 1) + ' – ' + tp.b.c.ref + '.' + (tp.b.i + 1) + ' • ' + tp.wps.length + ' نقطهٔ عبور • ' : '') + (s ? s.ref + ' — ' + s.f.n + ' • ' : '') + 'برد ' + w + ' × ' + h + ' mm • ' + M.comps.length + ' فوت‌پرینت • ' + M.paths.length + ' ترک' + (M.rats.length ? ' • ' + M.rats.length + ' اتصال بدون ترک' : '');
  }
  function table(){
    el.tbl.innerHTML = M.comps.map(c => `<div class="pcb-row${sel === c.id ? ' on' : ''}" data-id="${c.id}"><b>${esc(c.ref)}</b><span>${esc(c.val)}</span><select data-id="${c.id}">${c.fam.map((f, i) => `<option value="${i}"${i === c.fi ? ' selected' : ''}>${esc(f.n)}</option>`).join('')}</select></div>`).join('') || '<div class="pcb-empty">اول در نمای شماتیک چند قطعه بگذار.</div>';
  }
  function fit(){
    const b = M.board, w = el.svg.clientWidth || 600, h = el.svg.clientHeight || 400, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    const z = Math.min((w - 60) / bw, (h - 80) / bh, 3);
    view = {z, x:(w - bw * z) / 2 - b.x0 * z, y:(h - bh * z) / 2 - b.y0 * z};
  }
  function zoom(f, mx, my){
    const nz = Math.max(.15, Math.min(8, view.z * f));
    view.x = mx - (mx - view.x) * nz / view.z; view.y = my - (my - view.y) * nz / view.z; view.z = nz; draw();
  }
  const toWorld = e => { const r = el.svg.getBoundingClientRect(); return {x:(e.clientX - r.left - view.x) / view.z, y:(e.clientY - r.top - view.y) / view.z}; };

  // چرخش فقط در نمای PCB اعمال می‌شود و شماتیک را تغییر نمی‌دهد
  function rotateSel(d){
    if(sel == null || !M) return;
    st.rot[sel] = ((st.rot[sel] | 0) + d) & 3;
    save(); rebuild(); table(); draw();
  }
  function setTool(t){
    tool = t; routing = null;
    if(!el) return;
    el.querySelectorAll('[data-tool]').forEach(b => { b.style.boxShadow = b.dataset.tool === t ? 'inset 0 0 0 2px ' + COL.sel : ''; });
    el.svg.style.cursor = t === 'route' ? 'crosshair' : '';
    draw();
  }
  function say(t){ flash = t; draw(); setTimeout(() => { if(flash === t){ flash = ''; if(el) draw(); } }, 3000); }
  // حذف ترک: ترکِ خودکار به‌صورت خط‌چین (اتصال بدون ترک) می‌ماند، ترکِ دستی کامل پاک می‌شود
  function deleteTrace(){
    const tp = M && M.paths.find(p => p.id === selT);
    if(!tp) return false;
    if(M.autoIds.has(tp.id)) st.del[tp.id] = true; else delete st.extra[tp.id];
    delete st.routes[tp.id]; selT = null; save(); rebuild(); draw();
    return true;
  }
  function finishRoute(end){
    const first = routing.id <= pid(end), id = first ? routing.id + '|' + pid(end) : pid(end) + '|' + routing.id;
    const wps = first ? routing.wps : routing.wps.slice().reverse();
    if(wps.length) st.routes[id] = wps; else delete st.routes[id];
    delete st.del[id];
    if(!M.autoIds.has(id)) st.extra[id] = true;
    routing = null; selT = id; save(); rebuild(); draw();
  }
  const onKey = e => {
    if(!el || !el.getClientRects().length || e.ctrlKey || e.metaKey || e.altKey) return;
    const modal = document.querySelector('.cdz, .c3d2');   // صفحهٔ طراحی آزاد یا نمای سه‌بعدی
    if(modal && !modal.contains(el)) return;                // PCB پشت آن است؛ کلیدها مالِ پنجرهٔ بالاست
    if(el.querySelector('.pcb-exp')) return;                // پنجرهٔ خروجی PDF باز است
    const tg = e.target && e.target.tagName;
    if(tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if(e.code === 'KeyR'){ e.preventDefault(); rotateSel(e.shiftKey ? -1 : 1); }
    else if(e.code === 'Delete' || e.code === 'Backspace'){ if(selT){ e.preventDefault(); deleteTrace(); } }
    else if(e.code === 'KeyX'){ e.preventDefault(); setTool('route'); }
    else if(e.code === 'KeyV'){ setTool('select'); }
    else if(e.code === 'Escape'){
      if(routing){ routing = null; draw(); }
      else if(tool === 'route') setTool('select');
      else if(selT){ selT = null; draw(); }
    }
  };


  /* ---------- ترک‌کشی و چیدمان خودکار (بدون برخورد) ---------- */
  // همهٔ اتصال‌های بدون ترکِ M را مسیریابی می‌کند؛ نتیجه را برنمی‌گرداند در st نمی‌نویسد.
  function routeModel(tries, deadline){
    const pads = M.pads.map(a => ({x:a.x, y:a.y, net:M.padNet.get(pid(a)), cid:a.c.id, sq:!a.i && (a.c.t !== 'BC' || !!a.c.f.use), key:pid(a)}));
    const by = new Map(pads.map(p => [p.key, p]));
    const edges = [...M.autoIds].map(id => { const h = id.split('|'); return {id, a:by.get(h[0]), b:by.get(h[1])}; }).filter(e => e.a && e.b);
    if(!edges.length) return {routes:{}, failed:[], score:0};
    edges.forEach(e => { e.d = Math.abs(e.a.x - e.b.x) + Math.abs(e.a.y - e.b.y); });
    const courts = M.comps.map(c => ({cid:c.id, x0:c.bb.x0, y0:c.bb.y0, x1:c.bb.x1, y1:c.bb.y1}));
    const bb = {x0:Math.min(...courts.map(c => c.x0)), y0:Math.min(...courts.map(c => c.y0)), x1:Math.max(...courts.map(c => c.x1)), y1:Math.max(...courts.map(c => c.y1))};
    let best = null;
    for(const ext of [2.4, 7]){                    // اول در همان برد؛ اگر جا نشد، دورِ برد را بازتر کن
      const rt = makeRouter(pads, courts, {x0:bb.x0 - ext * MM, y0:bb.y0 - ext * MM, x1:bb.x1 + ext * MM, y1:bb.y1 + ext * MM});
      const rnd = prng(7 + ext | 0);
      let order = edges.slice().sort((p, q) => p.d - q.d), cur = null;
      for(let t = 0; t < tries; t++){
        const r = rt.routeAll(order);
        r.score = r.failed.length * 1e5 + r.cost;
        if(!cur || r.score < cur.score) cur = r;
        if(!r.failed.length || performance.now() > deadline) break;
        const f = new Set(r.failed);                // اتصال‌های جانمانده را جلو بینداز و دوباره امتحان کن
        if(t >= 2) order = order.map(e => [rnd(), e]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
        order = order.filter(e => f.has(e.id)).concat(order.filter(e => !f.has(e.id)));
      }
      if(!best || cur.score < best.score) best = cur;
      if(!best.failed.length || performance.now() > deadline) break;
    }
    const routes = {};
    Object.keys(best.routes).forEach(id => { routes[id] = toWps(best.routes[id]); });
    return {routes, failed:best.failed, score:best.score};
  }
  function commitRoutes(res){
    st.routes = {}; st.del = {}; st.extra = {}; selT = null; routing = null;
    Object.keys(res.routes).forEach(id => { if(res.routes[id].length) st.routes[id] = res.routes[id]; });
    res.failed.forEach(id => { st.del[id] = true; });
  }
  const failMsg = n => n + ' اتصال جا نشد (خط‌چین مانده)؛ قطعه‌ها را کمی از هم دور کن یا دوباره امتحان کن.';

  // ترک‌کشی خودکار روی چیدمان فعلی. اگر اتصالی جا نشد، قطعه‌های درگیر را می‌چرخاند.
  function autoRoute(){
    st.routes = {}; st.del = {}; st.extra = {}; selT = null; routing = null;
    rebuild();
    const deadline = performance.now() + 2500, gap = .8 * MM;
    let res = routeModel(10, deadline), turned = 0;
    const collides = cid => {
      const a = M.comps.find(c => c.id === cid);
      return M.comps.some(c => c !== a && c.bb.x0 < a.bb.x1 + gap && c.bb.x1 > a.bb.x0 - gap && c.bb.y0 < a.bb.y1 + gap && c.bb.y1 > a.bb.y0 - gap);
    };
    if(res.failed.length){
      const ids = new Set();
      res.failed.forEach(id => id.split('|').forEach(h => ids.add(+h.split(':')[0])));
      for(let pass = 0; pass < 2 && res.failed.length && performance.now() < deadline; pass++){
        for(const cid of ids){
          const old = st.rot[cid] | 0; let keep = old;
          for(let d = 1; d < 4 && res.failed.length && performance.now() < deadline; d++){
            st.rot[cid] = (old + d) & 3; rebuild();
            if(collides(cid)) continue;
            const r = routeModel(5, deadline);
            if(r.score < res.score - 1e-6){ res = r; keep = st.rot[cid]; }
          }
          st.rot[cid] = keep; if(keep !== old) turned++;
          rebuild();
          if(!res.failed.length) break;
        }
      }
    }
    commitRoutes(res); save(); rebuild();
    return {failed:res.failed.length, turned};
  }

  // چیدمان خودکار: قطعه‌ها را جابه‌جا و در صورت نیاز می‌چرخاند، بعد ترک می‌کشد؛ بهترین نتیجه می‌ماند.
  function autoLayout(){
    rebuild();
    const cs = M.comps;
    if(!cs.length) return {failed:0};
    const deadline = performance.now() + 2800;
    const idxOf = new Map(cs.map((c, i) => [c.id, i]));
    const geoOf = (c, R) => {
      const xs = [], ys = [];
      [[c.cr[0], c.cr[1]], [c.cr[2], c.cr[1]], [c.cr[0], c.cr[3]], [c.cr[2], c.cr[3]]].forEach(p => { const q = rot(p[0] * MM, p[1] * MM, R); xs.push(q[0]); ys.push(q[1]); });
      return {pads:c.pads.map(q => rot(q.lx * MM, q.ly * MM, R)), x0:Math.min(...xs), x1:Math.max(...xs), y0:Math.min(...ys), y1:Math.max(...ys)};
    };
    const P = cs.map(c => ({id:c.id, base:(c.r - (st.rot[c.id] | 0)) & 3, sx:c.sx, sy:c.sy, g:[0, 1, 2, 3].map(R => geoOf(c, R))}));
    const nm = new Map();
    M.pads.forEach(a => { const k = M.padNet.get(pid(a)); if(!nm.has(k)) nm.set(k, []); nm.get(k).push([idxOf.get(a.c.id), a.i]); });
    const nets = [...nm.values()].filter(l => l.length > 1 && new Set(l.map(q => q[0])).size > 1);
    const apply = cand => {
      st.pos = {}; st.rot = {}; st.routes = {}; st.del = {}; st.extra = {};
      P.forEach((p, i) => { st.pos[p.id] = [cand.X[i], cand.Y[i]]; st.rot[p.id] = (cand.R[i] - p.base) & 3; });
      rebuild();
    };
    let best = null;
    outer: for(const gap of [2.4, 3.4, 4.8, 6.5]){
      const cands = [];
      for(let s = 0; s < 6 && performance.now() < deadline; s++){
        const c = anneal(P, nets, {seed:Math.round(gap * 10) * 31 + s + 1, gap, jitter:s, iters:1400 + 350 * P.length});
        if(c.ok) cands.push(c);
      }
      cands.sort((a, b) => a.cost - b.cost);
      for(const cand of cands.slice(0, 3)){
        apply(cand);
        const res = routeModel(6, deadline);
        if(!best || res.score < best.res.score) best = {cand, res};
        if(performance.now() > deadline) break outer;
      }
      if(best && !best.res.failed.length) break;
    }
    selT = null; routing = null;
    if(!best){ st.pos = {}; st.rot = {}; rebuild(); return autoRoute(); }   // جایی برای چیدن پیدا نشد: ردیفِ ساده
    apply(best.cand); commitRoutes(best.res); save(); rebuild();
    return {failed:best.res.failed.length};
  }

  // پنجرهٔ خروجی PDF: انتخاب لایه‌ها (مس / سیلک / لبهٔ برد) مثل Plot در KiCad
  function exportDialog(){
    if(!M || !el || el.querySelector('.pcb-exp')) return;
    const d = document.createElement('div'); d.className = 'pcb-exp';
    d.innerHTML = '<div class="pcb-exp-card" role="dialog" aria-label="خروجی PDF" tabindex="-1">' +
      '<div class="pcb-h">خروجی PDF <small>Plot — مثل KiCad</small></div>' +
      '<label><input type="checkbox" data-k="cu">ترک‌ها و پدها <small>مس · F.Cu</small></label>' +
      '<label><input type="checkbox" data-k="silk">سیلک‌اسکرین (طرح قطعه و نام) <small>F.Silkscreen</small></label>' +
      '<label class="sub"><input type="checkbox" data-k="val">مقدار قطعه هم چاپ شود</label>' +
      '<label><input type="checkbox" data-k="edge">لبهٔ برد <small>Edge.Cuts</small></label>' +
      '<label><input type="checkbox" data-k="mirror">آینه‌ای (برای انتقال حرارتی) <small>Mirror</small></label>' +
      '<label><input type="checkbox" data-k="bw">سیاه‌وسفید</label>' +
      '<label>صفحه <select data-k="page"><option value="a4">A4 — مقیاس ۱:۱</option><option value="board">هم‌اندازهٔ برد</option></select></label>' +
      '<div class="pcb-exp-msg" role="status"></div>' +
      '<div class="pcb-exp-row"><button type="button" class="go" data-x="go">ساخت PDF</button><button type="button" data-x="close">بستن</button></div></div>';
    el.appendChild(d);
    const card = d.firstChild, msg = d.querySelector('.pcb-exp-msg'), inp = k => d.querySelector('[data-k="' + k + '"]');
    const KS = ['cu', 'silk', 'val', 'edge', 'mirror', 'bw'];
    KS.forEach(k => { inp(k).checked = !!EXP[k]; });
    inp('page').value = EXP.page;
    const read = () => { KS.forEach(k => { EXP[k] = inp(k).checked; }); EXP.page = inp('page').value; };
    const hint = () => {
      read(); inp('val').disabled = !EXP.silk;
      msg.textContent = EXP.cu && EXP.silk && EXP.bw ? 'در سیاه‌وسفید، سیلک روی ترک دیده نمی‌شود؛ برای چاپ بهتر است هر لایه را جدا خروجی بگیری (یا «سیاه‌وسفید» را بردار).' : '';
    };
    d.addEventListener('change', hint);
    d.addEventListener('click', e => {
      const x = e.target.closest('[data-x]'), act = x ? x.dataset.x : '';
      if(e.target === d || act === 'close'){ d.remove(); return; }
      if(act !== 'go') return;
      read();
      if(!EXP.cu && !EXP.silk && !EXP.edge){ msg.textContent = 'حداقل یک لایه را انتخاب کن.'; return; }
      try{
        const r = pcbPdf(M, EXP), a = document.createElement('a');
        a.href = URL.createObjectURL(r.blob);
        a.download = 'pcb-' + [EXP.cu && 'copper', EXP.silk && 'silkscreen', EXP.edge && !EXP.cu && !EXP.silk && 'outline'].filter(Boolean).join('-') + (EXP.mirror ? '-mirror' : '') + '.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        msg.textContent = r.scale < 1 ? 'ساخته شد. برد از A4 بزرگ‌تر است و با مقیاس ' + Math.round(r.scale * 100) + '٪ چاپ می‌شود؛ برای ۱:۱ «هم‌اندازهٔ برد» را بزن.' : 'ساخته شد (' + r.w.toFixed(1) + ' × ' + r.h.toFixed(1) + ' mm) — هنگام چاپ «اندازهٔ واقعی / 100%» را بزن.';
      }catch(err){ msg.textContent = 'ساخت PDF نشد: ' + err.message; }
    });
    d.addEventListener('keydown', e => { if(e.key === 'Escape'){ e.stopPropagation(); d.remove(); } });
    hint(); card.focus();
  }

  function build(){
    el = document.createElement('div');
    el.className = 'pcb'; injectCss();
    el.innerHTML = '<aside class="pcb-side"><div class="pcb-h">تخصیص فوت‌پرینت <small>Assign Footprints</small></div><div class="pcb-tbl"></div><button class="pcb-auto" data-tool="select" title="انتخاب و جابه‌جایی (V)">' + IC.select + 'انتخاب (V)</button><button class="pcb-auto" data-tool="route" title="سیم‌کشی ترک (X)">' + IC.route + 'سیم‌کشی (X)</button><button class="pcb-auto" data-a="rotate" title="چرخش فوت‌پرینت انتخاب‌شده (R)">' + IC.rotate + 'چرخش (R)</button><button class="pcb-auto" data-a="del" title="حذف ترک انتخاب‌شده (Delete)">' + IC.del + 'حذف ترک (Delete)</button><button class="pcb-auto" data-a="layout">' + IC.layout + 'چیدمان خودکار</button><button class="pcb-auto" data-a="routes">' + IC.routes + 'ترک‌کشی خودکار</button><button class="pcb-auto" data-a="pdf" title="خروجی PDF برای چاپ (ترک‌ها / سیلک‌اسکرین)">' + IC.pdf + 'خروجی PDF (چاپ)</button><div class="pcb-hint" style="font-size:12px;line-height:1.7;opacity:.7;margin-top:8px">قطعه را انتخاب کن و R بزن تا بچرخد (Shift+R برعکس). ترک را بگیر و بکش تا مسیرش عوض شود؛ Delete = حذف ترک (اتصال خط‌چین می‌ماند). دوبار کلیک روی نقطه = حذف نقطه، روی ترک = مسیر خودکار. چیدمان و ترک‌کشی خودکار قطعه‌ها را جابه‌جا و در صورت نیاز می‌چرخاند و ترک‌ها را طوری می‌کشد که به پد و ترک شبکهٔ دیگر نخورند. سیم‌کشی (X): روی یک پد بزن، نقطه بگذار و روی پدِ هم‌شبکه تمام کن؛ Esc = لغو.</div></aside>' +
      '<div class="pcb-stage"><svg class="pcb-svg" xmlns="http://www.w3.org/2000/svg"></svg><div class="pcb-fab"><button data-z="1.25">+</button><button data-z=".8">−</button><button data-z="0">⤢</button></div><div class="pcb-stat"></div></div>';
    host.appendChild(el);
    document.addEventListener('keydown', onKey);
    el.svg = el.querySelector('.pcb-svg'); el.tbl = el.querySelector('.pcb-tbl'); el.stat = el.querySelector('.pcb-stat');
    el.tbl.addEventListener('change', e => { const s = e.target.closest('select'); if(!s) return; st.fp[s.dataset.id] = +s.value; save(); rebuild(); table(); draw(); });
    el.tbl.addEventListener('click', e => { const r = e.target.closest('.pcb-row'); if(!r || e.target.closest('select')) return; sel = +r.dataset.id; selT = null; table(); draw(); });
    el.querySelector('[data-a="rotate"]').addEventListener('click', () => rotateSel(1));
    el.querySelector('[data-a="pdf"]').addEventListener('click', exportDialog);
    el.querySelector('[data-a="del"]').addEventListener('click', () => { if(!deleteTrace()) say('اول یک ترک را انتخاب کن.'); });
    el.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
    el.querySelector('[data-a="layout"]').addEventListener('click', () => { const r = autoLayout(); fit(); table(); say(r.failed ? failMsg(r.failed) : 'چیدمان و ترک‌کشی بدون برخورد انجام شد'); });
    el.querySelector('[data-a="routes"]').addEventListener('click', () => { const r = autoRoute(); table(); say(r.failed ? failMsg(r.failed) : (r.turned ? 'ترک‌کشی انجام شد؛ ' + r.turned + ' قطعه برای جا شدن چرخید' : 'ترک‌کشی بدون برخورد انجام شد')); });
    el.querySelector('.pcb-fab').addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return;
      const z = +b.dataset.z;
      if(!z){ fit(); draw(); } else zoom(z, el.svg.clientWidth / 2, el.svg.clientHeight / 2);
    });
    el.svg.addEventListener('wheel', e => { e.preventDefault(); const r = el.svg.getBoundingClientRect(); zoom(Math.exp(-e.deltaY * .0015), e.clientX - r.left, e.clientY - r.top); }, {passive:false});
    // نقطهٔ عبور ترکِ انتخاب‌شده، یا نزدیک‌ترین پاره‌خطِ ترک (دور از پدها)
    const hitTrace = w => {
      const sp = M.paths.find(p => p.id === selT);
      if(sp){ const rr = 7 / view.z, wi = sp.wps.findIndex(q => Math.hypot(q[0] - w.x, q[1] - w.y) <= rr); if(wi >= 0) return {p:sp, wi}; }
      if(M.comps.some(c => c.abs.some(a => Math.hypot(a.x - w.x, a.y - w.y) < 1.3 * .9 * MM))) return null;
      const tol = .45 * MM + 4 / view.z; let best = null;
      M.paths.forEach(p => { for(let i = 1; i < p.pts.length; i++){ const d = segDist(w, p.pts[i - 1], p.pts[i]); if(d <= tol && (!best || d < best.d)) best = {p, d, j:p.sub[i - 1]}; } });
      return best;
    };
    const padAt = w => { const rr = 1.6 * .9 * MM + 3 / view.z; return M.pads.find(a => Math.hypot(a.x - w.x, a.y - w.y) <= rr); };
    el.svg.addEventListener('contextmenu', e => { e.preventDefault(); if(routing){ routing = null; draw(); } });
    el.svg.addEventListener('dblclick', e => {
      if(tool === 'route') return;
      const h = hitTrace(toWorld(e)); if(!h) return;
      const arr = st.routes[h.p.id];
      if(h.wi !== undefined && arr){ arr.splice(h.wi, 1); if(!arr.length) delete st.routes[h.p.id]; } else delete st.routes[h.p.id];
      save(); rebuild(); draw();
    });
    el.svg.addEventListener('pointerdown', e => {
      el.svg.setPointerCapture(e.pointerId);
      if(tool === 'route'){
        if(e.button === 2) return;
        const w = toWorld(e), pad = padAt(w);
        if(!routing){
          if(pad){ routing = {id:pid(pad), wps:[]}; cur = {x:pad.x, y:pad.y}; draw(); }
          else drag = {pan:true, sx:e.clientX - view.x, sy:e.clientY - view.y};
          return;
        }
        const start = M.padBy.get(routing.id);
        if(!start){ routing = null; draw(); return; }
        if(pad){
          if(pid(pad) === routing.id) return;
          if(pad.c === start.c){ say('این دو پد مالِ یک قطعه‌اند.'); return; }
          if(M.padNet.get(pid(pad)) !== M.padNet.get(routing.id)){ say('این دو پد در یک شبکه نیستند؛ اتصال را در شماتیک بکش.'); return; }
          finishRoute(pad); return;
        }
        const q = [snap(w.x), snap(w.y)], l = routing.wps[routing.wps.length - 1];
        if(!l || l[0] !== q[0] || l[1] !== q[1]) routing.wps.push(q);
        draw(); return;
      }
      const w = toWorld(e), th = hitTrace(w);
      if(th){
        sel = null; selT = th.p.id;
        let wi = th.wi, added = false;
        if(wi === undefined){
          (st.routes[selT] || (st.routes[selT] = [])).splice(th.j, 0, [snap(w.x), snap(w.y)]);
          wi = th.j; added = true; rebuild();
        }
        drag = {tr:selT, wi, added, moved:false};
        table(); draw(); return;
      }
      selT = null;
      const hit = [...M.comps].reverse().find(c => w.x >= c.bb.x0 && w.x <= c.bb.x1 && w.y >= c.bb.y0 && w.y <= c.bb.y1);
      if(hit){ sel = hit.id; drag = {id:hit.id, ox:w.x - hit.px, oy:w.y - hit.py, moved:false}; }
      else { sel = null; drag = {pan:true, sx:e.clientX - view.x, sy:e.clientY - view.y}; }
      table(); draw();
    });
    el.svg.addEventListener('pointermove', e => {
      if(!drag && tool === 'route'){ const w = toWorld(e); cur = {x:snap(w.x), y:snap(w.y)}; if(routing) draw(); return; }
      if(!drag){ el.svg.style.cursor = hitTrace(toWorld(e)) ? 'move' : ''; return; }
      if(drag.tr){
        const arr = st.routes[drag.tr], w = toWorld(e); if(!arr) return;
        const nq = [snap(w.x), snap(w.y)], oq = arr[drag.wi];
        if(!oq || nq[0] !== oq[0] || nq[1] !== oq[1]){ arr[drag.wi] = nq; drag.moved = true; rebuild(); draw(); }
        return;
      }
      if(drag.pan){ view.x = e.clientX - drag.sx; view.y = e.clientY - drag.sy; draw(); return; }
      const w = toWorld(e);
      st.pos[drag.id] = [snap(w.x - drag.ox), snap(w.y - drag.oy)]; drag.moved = true; rebuild(); draw();
    });
    const end = () => {
      if(drag && drag.tr){
        const arr = st.routes[drag.tr];
        if(drag.added && !drag.moved && arr){ arr.splice(drag.wi, 1); if(!arr.length) delete st.routes[drag.tr]; rebuild(); draw(); }
        else if(drag.moved) save();
      } else if(drag && drag.moved) save();
      drag = null;
    };
    el.svg.addEventListener('pointerup', end); el.svg.addEventListener('pointercancel', end);
    if(window.ResizeObserver){ el.ro = new ResizeObserver(() => { if(el && el.style.display !== 'none') draw(); }); el.ro.observe(el.svg); }
  }

  return {
    show(){ if(!el) build(); el.style.display = ''; const fresh = !Object.keys(st.pos).length; rebuild(); if(fresh && M.comps.length) autoLayout(); save(); table(); requestAnimationFrame(() => { fit(); draw(); }); },
    hide(){ if(el) el.style.display = 'none'; },
    destroy(){ document.removeEventListener('keydown', onKey); if(el){ if(el.ro) el.ro.disconnect(); el.remove(); el = null; } },
    get3D(){
      rebuild(); save();
      return {
        comps:M.comps.map(c => ({t:c.t, x:c.px, y:c.py, r:c.r, ref:c.ref, val:c.val, on:c.on, st:c.st, power:false, fp:c.f.n, box:c.bb, pins:c.abs.map(a => [a.x, a.y])})),
        wires:M.segs
      };
    }
  };
}
window.CircuitPCB = {create};
})();
