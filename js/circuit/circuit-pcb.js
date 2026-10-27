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
    M = {comps, paths, segs, rats, autoIds, padNet, padBy, pads:[...padBy.values()], board:{x0:snap(bx0 - m), y0:snap(by0 - m), x1:snap(bx1 + m), y1:snap(by1 + m)}};
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
    const tg = e.target && e.target.tagName;
    if(tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if(e.code === 'KeyR'){ e.preventDefault(); rotateSel(e.shiftKey ? -1 : 1); }
    else if(e.code === 'Delete' || e.code === 'Backspace'){ if(selT){ e.preventDefault(); deleteTrace(); } }
    else if(e.code === 'KeyW' || e.code === 'KeyX'){ e.preventDefault(); setTool('route'); }
    else if(e.code === 'KeyV'){ setTool('select'); }
    else if(e.code === 'Escape'){
      if(routing){ routing = null; draw(); }
      else if(tool === 'route') setTool('select');
      else if(selT){ selT = null; draw(); }
    }
  };

  function build(){
    el = document.createElement('div');
    el.className = 'pcb';
    el.innerHTML = '<aside class="pcb-side"><div class="pcb-h">تخصیص فوت‌پرینت <small>Assign Footprints</small></div><div class="pcb-tbl"></div><button class="pcb-auto" data-tool="select" title="انتخاب و جابه‌جایی (V)">انتخاب (V)</button><button class="pcb-auto" data-tool="route" title="سیم‌کشی ترک (W یا X)">سیم‌کشی (W / X)</button><button class="pcb-auto" data-a="rotate" title="چرخش فوت‌پرینت انتخاب‌شده (R)">چرخش (R)</button><button class="pcb-auto" data-a="del" title="حذف ترک انتخاب‌شده (Delete)">حذف ترک (Delete)</button><button class="pcb-auto" data-a="layout">چیدمان خودکار</button><button class="pcb-auto" data-a="routes">ترک‌کشی خودکار</button><div class="pcb-hint" style="font-size:12px;line-height:1.7;opacity:.7;margin-top:8px">قطعه را انتخاب کن و R بزن تا بچرخد (Shift+R برعکس). ترک را بگیر و بکش تا مسیرش عوض شود؛ Delete = حذف ترک (اتصال خط‌چین می‌ماند). دوبار کلیک روی نقطه = حذف نقطه، روی ترک = مسیر خودکار. سیم‌کشی (W یا X): روی یک پد بزن، نقطه بگذار و روی پدِ هم‌شبکه تمام کن؛ Esc = لغو.</div></aside>' +
      '<div class="pcb-stage"><svg class="pcb-svg" xmlns="http://www.w3.org/2000/svg"></svg><div class="pcb-fab"><button data-z="1.25">+</button><button data-z=".8">−</button><button data-z="0">⤢</button></div><div class="pcb-stat"></div></div>';
    host.appendChild(el);
    document.addEventListener('keydown', onKey);
    el.svg = el.querySelector('.pcb-svg'); el.tbl = el.querySelector('.pcb-tbl'); el.stat = el.querySelector('.pcb-stat');
    el.tbl.addEventListener('change', e => { const s = e.target.closest('select'); if(!s) return; st.fp[s.dataset.id] = +s.value; save(); rebuild(); table(); draw(); });
    el.tbl.addEventListener('click', e => { const r = e.target.closest('.pcb-row'); if(!r || e.target.closest('select')) return; sel = +r.dataset.id; selT = null; table(); draw(); });
    el.querySelector('[data-a="rotate"]').addEventListener('click', () => rotateSel(1));
    el.querySelector('[data-a="del"]').addEventListener('click', () => { if(!deleteTrace()) say('اول یک ترک را انتخاب کن.'); });
    el.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
    el.querySelector('[data-a="layout"]').addEventListener('click', () => { st.pos = {}; st.rot = {}; st.routes = {}; st.del = {}; st.extra = {}; selT = null; routing = null; save(); rebuild(); fit(); table(); draw(); });
    el.querySelector('[data-a="routes"]').addEventListener('click', () => { st.routes = {}; st.del = {}; st.extra = {}; selT = null; routing = null; save(); rebuild(); draw(); });
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
    show(){ if(!el) build(); el.style.display = ''; rebuild(); save(); table(); requestAnimationFrame(() => { fit(); draw(); }); },
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
