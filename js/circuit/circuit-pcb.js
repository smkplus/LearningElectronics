/* نمای PCB / فوت‌پرینت (شبیه KiCad PCB Editor): تخصیص فوت‌پرینت، چیدمان، ترک‌کشی خودکار */
(function(){
'use strict';
const U = 20, MM = U / 2.54;
const COL = {bg:'#001023', dot:'#34455f', cu:'#c83434', silk:'#f2eda1', crt:'#ff26e2', edge:'#d83a3a', fab:'#b4b8c0', sel:'#4de0ff'};
const rc = (x0, y0, x1, y1) => `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/>`;
const ci = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const ln = (a, b, c, d) => `<path d="M${a} ${b}L${c} ${d}"/>`;
const FP = {
  R:[{n:'R_Axial_DIN0207_L6.3mm_D2.5mm_P7.62mm_Horizontal', b:[-3.27,-1.37,3.27,1.37], pads:[[-3.81,0],[3.81,0]], s:'<path d="M-3.27 -1.04V-1.37H3.27V-1.04M-3.27 1.04V1.37H3.27V1.04"/>'}],
  C:[{n:'C_Disc_D5.0mm_W2.5mm_P5.00mm', b:[-3.4,-2.5,3.4,2.5], s:rc(-3.4,-2.5,3.4,2.5) + ln(-.5,-1.6,-.5,1.6) + ln(.5,-1.6,.5,1.6)},
     {n:'C_Rect_L7.2mm_W2.5mm_P5.00mm', b:[-3.6,-1.25,3.6,1.25], s:rc(-3.6,-1.25,3.6,1.25)}],
  CP:[{n:'CP_Radial_D8.0mm_P3.50mm', b:[-4,-4,4,4], s:ci(0,0,4) + ln(-6.2,-1.2,-4.6,-1.2) + ln(-5.4,-2,-5.4,-.4)},
      {n:'CP_Radial_D5.0mm_P2.50mm', b:[-2.5,-2.5,2.5,2.5], s:ci(0,0,2.5) + ln(-6.2,-1.2,-4.6,-1.2) + ln(-5.4,-2,-5.4,-.4)}],
  L:[{n:'L_Axial_L9.5mm_D4.0mm_P12.70mm_Horizontal', b:[-4.75,-2,4.75,2], s:rc(-4.75,-2,4.75,2)},
     {n:'L_Axial_L5.3mm_D2.2mm_P10.16mm_Horizontal', b:[-2.65,-1.1,2.65,1.1], s:rc(-2.65,-1.1,2.65,1.1)}],
  POT:[{n:'Potentiometer_Bourns_3386P_Vertical', b:[-5,-7.5,5,2.5], s:rc(-5,-7.5,5,2.5) + ci(0,-3,1.6)},
       {n:'Potentiometer_Piher_PT-10_Vertical', b:[-6,-8,6,3], s:rc(-6,-8,6,3) + ci(0,-3,2.2)}],
  D:[{n:'D_DO-35_SOD27_P10.16mm_Horizontal', b:[-1.9,-.95,1.9,.95], s:rc(-1.9,-.95,1.9,.95) + ln(1.1,-.95,1.1,.95)},
     {n:'D_DO-41_SOD81_P10.16mm_Horizontal', b:[-2.5,-1.3,2.5,1.3], s:rc(-2.5,-1.3,2.5,1.3) + ln(1.5,-1.3,1.5,1.3)}],
  LED:[{n:'LED_D5.0mm', b:[-2.9,-2.9,2.9,2.9], pads:[[-1.27,0],[1.27,0]], s:ci(0,0,2.5) + '<path d="M2.5 -1.6A2.9 2.9 0 1 0 2.5 1.6Z"/>'}],
  BJT:[{n:'TO-92_Inline', b:[-3,-3,4,3], s:'<path d="M-2.4 -1.8A3 3 0 1 1 -2.4 1.8Z" transform="translate(.5 0)"/>'},
       {n:'TO-92_Inline_Wide', b:[-3.4,-3.4,4.4,3.4], s:'<path d="M-2.8 -2A3.4 3.4 0 1 1 -2.8 2Z" transform="translate(.5 0)"/>'}],
  OPAMP:[{n:'DIP-8_W7.62mm', b:[-3.5,-5,3.5,5], s:rc(-3.5,-5,3.5,5) + '<path d="M-1 -5A1 1 0 0 0 1 -5"/>'},
         {n:'DIP-8_W7.62mm_LongPads', b:[-3.8,-5.4,3.8,5.4], s:rc(-3.8,-5.4,3.8,5.4) + '<path d="M-1 -5.4A1 1 0 0 0 1 -5.4"/>'}],
  BT:[{n:'TerminalBlock_2P_P10.16mm', b:[-7,-3.8,7,3.8], s:rc(-7,-3.8,7,3.8) + ci(-5.08,0,2.3) + ci(5.08,0,2.3)},
      {n:'BatteryHolder_9V_Clip', b:[-7.5,-4.5,7.5,4.5], s:rc(-7.5,-4.5,7.5,4.5) + ln(-7.5,-2,-3.5,-2)}],
  BC:[{n:'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', b:[-1.33,-2.6,1.33,2.6], pads:[[0,-1.27],[0,1.27]], use:[2,3], s:'<path d="M0 -2.6H-1.33V-1.27M0 -2.6H1.33V-1.27"/>' + rc(-1.33,0,1.33,2.6)}],
  SW:[{n:'SW_Slide_SPST_P10.16mm', b:[-6.5,-3,6.5,3], s:rc(-6.5,-3,6.5,3) + rc(-1.5,-1.6,1.5,1.6)},
      {n:'SW_Push_6mm_P10.16mm', b:[-3.5,-3.5,3.5,3.5], s:rc(-3.5,-3.5,3.5,3.5) + ci(0,0,2)}],
  LAMP:[{n:'Lamp_E10_Holder', b:[-5.5,-5.5,5.5,5.5], s:ci(0,0,5.5) + ci(0,0,2.5)},
        {n:'Lamp_T1_Wire_P10.16mm', b:[-4,-4,4,4], s:ci(0,0,4)}]
};
const FAM = t => ({LEDY:'LED', LEDG:'LED', NPN:'BJT', PNP:'BJT'}[t] || t);
const rot = (x, y, r) => { for(let i = 0; i < (r & 3); i++){ const t = x; x = -y; y = t; } return [x, y]; };
const snap = v => Math.round(v / 10) * 10;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[ch]));

function create(host, api){
  const KEY = api.key ? 'cpcb:' + api.key : '';
  let st = {fp:{}, pos:{}};
  try{ if(KEY){ const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d && d.fp && d.pos) st = d; } }catch(_){}
  const save = () => { try{ if(KEY) localStorage.setItem(KEY, JSON.stringify(st)); }catch(_){} };
  let M = null, view = {x:0, y:0, z:1}, sel = null, el = null, drag = null;

  function rebuild(){
    const src = api.src();
    const items = src.comps.filter(c => !c.power && FP[FAM(c.t)]);
    const ids = new Set(items.map(c => String(c.id)));
    Object.keys(st.pos).forEach(k => { if(!ids.has(k)) delete st.pos[k]; });
    const comps = items.map(c => {
      const fam = FP[FAM(c.t)], fi = Math.min(st.fp[c.id] | 0, fam.length - 1), f = fam[fi];
      const pm = f.use || c.lpins.map((_, i) => i);
      const pads = f.pads ? f.pads.map((q, i) => ({lx:q[0], ly:q[1], name:(c.lpins[pm[i]] || [])[2], pi:pm[i]})) : c.lpins.map((p, i) => ({lx:p[0] / MM, ly:p[1] / MM, name:p[2], pi:i}));
      let x0 = f.b[0], y0 = f.b[1], x1 = f.b[2], y1 = f.b[3];
      pads.forEach(p => { x0 = Math.min(x0, p.lx - 1.15); x1 = Math.max(x1, p.lx + 1.15); y0 = Math.min(y0, p.ly - 1.15); y1 = Math.max(y1, p.ly + 1.15); });
      return Object.assign({}, c, {fam, fi, f, pads, cr:[x0 - .25, y0 - .25, x1 + .25, y1 + .25]});
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
    const segs = [], paths = [];
    nets.forEach(pl => {
      if(pl.length < 2) return;
      const inT = [pl[0]], rest = pl.slice(1);
      while(rest.length){
        let best = null;
        inT.forEach(a => rest.forEach((b, j) => { const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + (a.c === b.c ? 1e6 : 0); if(!best || d < best.d) best = {a, b, j, d}; }));
        rest.splice(best.j, 1); inT.push(best.b);
        if(best.d >= 1e6) continue;
        const {a, b} = best, dx = b.x - a.x, dy = b.y - a.y, sx = Math.sign(dx), sy = Math.sign(dy), ax = Math.abs(dx), ay = Math.abs(dy);
        const mid = ax >= ay ? [a.x + sx * (ax - ay), a.y] : [a.x, a.y + sy * (ay - ax)];
        const path = [[a.x, a.y], mid, [b.x, b.y]].filter((p, i, arr) => !i || p[0] !== arr[i - 1][0] || p[1] !== arr[i - 1][1]);
        paths.push(path);
        for(let i = 1; i < path.length; i++) segs.push([path[i - 1][0], path[i - 1][1], path[i][0], path[i][1]]);
      }
    });
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    comps.forEach(c => { bx0 = Math.min(bx0, c.bb.x0); by0 = Math.min(by0, c.bb.y0); bx1 = Math.max(bx1, c.bb.x1); by1 = Math.max(by1, c.bb.y1); });
    if(!comps.length){ bx0 = by0 = 0; bx1 = by1 = 160; }
    const m = 3 * MM;
    M = {comps, paths, segs, board:{x0:snap(bx0 - m), y0:snap(by0 - m), x1:snap(bx1 + m), y1:snap(by1 + m)}};
  }

  function draw(){
    if(!M || !el) return;
    const o = [`<g transform="translate(${view.x} ${view.y}) scale(${view.z})">`];
    const b = M.board;
    o.push(`<rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" fill="none" stroke="${COL.edge}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`);
    M.paths.forEach(p => o.push(`<polyline points="${p.map(q => q.join(',')).join(' ')}" fill="none" stroke="${COL.cu}" stroke-width="${.9 * MM}" stroke-linecap="round" stroke-linejoin="round"/>`));
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
    o.push('</g>');
    el.svg.innerHTML = o.join('');
    el.svg.style.backgroundImage = `radial-gradient(${COL.dot} 1px, transparent 1.2px)`;
    el.svg.style.backgroundSize = `${U * view.z}px ${U * view.z}px`;
    el.svg.style.backgroundPosition = `${view.x}px ${view.y}px`;
    const w = ((b.x1 - b.x0) / MM).toFixed(1), h = ((b.y1 - b.y0) / MM).toFixed(1), s = M.comps.find(c => c.id === sel);
    el.stat.textContent = (s ? s.ref + ' — ' + s.f.n + ' • ' : '') + 'برد ' + w + ' × ' + h + ' mm • ' + M.comps.length + ' فوت‌پرینت • ' + M.paths.length + ' ترک';
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

  function build(){
    el = document.createElement('div');
    el.className = 'pcb';
    el.innerHTML = '<aside class="pcb-side"><div class="pcb-h">تخصیص فوت‌پرینت <small>Assign Footprints</small></div><div class="pcb-tbl"></div><button class="pcb-auto">چیدمان خودکار</button></aside>' +
      '<div class="pcb-stage"><svg class="pcb-svg" xmlns="http://www.w3.org/2000/svg"></svg><div class="pcb-fab"><button data-z="1.25">+</button><button data-z=".8">−</button><button data-z="0">⤢</button></div><div class="pcb-stat"></div></div>';
    host.appendChild(el);
    el.svg = el.querySelector('.pcb-svg'); el.tbl = el.querySelector('.pcb-tbl'); el.stat = el.querySelector('.pcb-stat');
    el.tbl.addEventListener('change', e => { const s = e.target.closest('select'); if(!s) return; st.fp[s.dataset.id] = +s.value; save(); rebuild(); table(); draw(); });
    el.tbl.addEventListener('click', e => { const r = e.target.closest('.pcb-row'); if(!r || e.target.closest('select')) return; sel = +r.dataset.id; table(); draw(); });
    el.querySelector('.pcb-auto').addEventListener('click', () => { st.pos = {}; save(); rebuild(); fit(); table(); draw(); });
    el.querySelector('.pcb-fab').addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return;
      const z = +b.dataset.z;
      if(!z){ fit(); draw(); } else zoom(z, el.svg.clientWidth / 2, el.svg.clientHeight / 2);
    });
    el.svg.addEventListener('wheel', e => { e.preventDefault(); const r = el.svg.getBoundingClientRect(); zoom(Math.exp(-e.deltaY * .0015), e.clientX - r.left, e.clientY - r.top); }, {passive:false});
    el.svg.addEventListener('pointerdown', e => {
      el.svg.setPointerCapture(e.pointerId);
      const w = toWorld(e), hit = [...M.comps].reverse().find(c => w.x >= c.bb.x0 && w.x <= c.bb.x1 && w.y >= c.bb.y0 && w.y <= c.bb.y1);
      if(hit){ sel = hit.id; drag = {id:hit.id, ox:w.x - hit.px, oy:w.y - hit.py, moved:false}; }
      else { sel = null; drag = {pan:true, sx:e.clientX - view.x, sy:e.clientY - view.y}; }
      table(); draw();
    });
    el.svg.addEventListener('pointermove', e => {
      if(!drag) return;
      if(drag.pan){ view.x = e.clientX - drag.sx; view.y = e.clientY - drag.sy; draw(); return; }
      const w = toWorld(e);
      st.pos[drag.id] = [snap(w.x - drag.ox), snap(w.y - drag.oy)]; drag.moved = true; rebuild(); draw();
    });
    const end = () => { if(drag && drag.moved) save(); drag = null; };
    el.svg.addEventListener('pointerup', end); el.svg.addEventListener('pointercancel', end);
    if(window.ResizeObserver){ el.ro = new ResizeObserver(() => { if(el && el.style.display !== 'none') draw(); }); el.ro.observe(el.svg); }
  }

  return {
    show(){ if(!el) build(); el.style.display = ''; rebuild(); save(); table(); requestAnimationFrame(() => { fit(); draw(); }); },
    hide(){ if(el) el.style.display = 'none'; },
    destroy(){ if(el){ if(el.ro) el.ro.disconnect(); el.remove(); el = null; } },
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
