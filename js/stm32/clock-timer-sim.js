/* ========================================================================
   CLOCK-TIMER-SIM.JS — مأموریت «کلاک و تایمر» (بخش STM32)
   mountClockTimerSim: کلاکِ STM32F103 با چرخ‌دنده + تایمر (صفحه‌ی شمارنده) + PWM
   به dialogue.js (showKnightLine) نیاز دارد.
   ======================================================================== */

const CT_HSE = 8;
const CT_W = .6;
const CT_BATT = 3.7;
const CT_PLL_OPTS = [2, 3, 4, 5, 6, 7, 8, 9];
const CT_DIV_OPTS = [1, 2, 4];
const CT_INIT = { pll: 2, a1: 1, a2: 1, psc: 0, arr: 15, pulse: 8 };
const CT_FINISH = '🏆 تمام شد! کلاکِ چیپ ۷۲ مگاهرتز است، کلاکِ تایمر هم با قانونِ ×۲ دوباره ۷۲ می‌شود، و تایمر با Prescaler و Period و Pulse یک PWM ساخت که سرعتِ موتور را تنظیم می‌کند.';

const CT_TALK = {
  hse:   'چرخ‌دنده‌ی کریستال: آرام و ثابت با ۸ مگاهرتز می‌چرخد. همه‌ی ضربان‌های چیپ از همین‌جا شروع می‌شوند.',
  pll:   'PLL یک چرخ‌دنده‌ی ضرب‌کننده است: عددِ داخلش را در ورودی ضرب می‌کند. ۸ × ۹ = ۷۲ مگاهرتز. مثل یک چرخ‌دنده‌ی ۷۲ دنده‌ای که یک چرخ‌دنده‌ی ۸ دنده‌ای را می‌چرخاند.',
  sys:   'SYSCLK کلاکِ خودِ چیپ است و خروجیِ PLL. هسته‌ی CPU با همین می‌چرخد. با PLL ×۹ می‌شود ۷۲ مگاهرتز.',
  ahb:   'AHB یک چرخ‌دنده‌ی تقسیم‌کننده است که معمولاً ÷۱ می‌ماند، پس HCLK هم ۷۲ مگاهرتز است. از اینجا مسیر دو شاخه می‌شود: APB1 و APB2.',
  hclk:  'HCLK کلاکِ باسِ اصلی (AHB) است: همان ۷۲ مگاهرتز. هر دو باسِ APB1 و APB2 از همین‌جا کلاک می‌گیرند.',
  apb1:  'APB1 یک چرخ‌دنده‌ی تقسیم‌کننده است: عددِ داخلش را از ورودی تقسیم می‌کند. ۷۲ ÷ ۲ = ۳۶. قطعاتِ حساسِ این باس (UART2، I2C) بیش از ۳۶ مگاهرتز تحمل ندارند.',
  apb2:  'APB2 هم یک چرخ‌دنده‌ی تقسیم‌کننده است ولی تا ۷۲ مگاهرتز تحمل دارد؛ پس معمولاً ÷۱ می‌ماند. تایمر TIM1 روی همین باس نشسته است.',
  pclk1: 'PCLK1 کلاکِ باسِ APB1 است: ۷۲ ÷ ۲ = ۳۶. همان عددِ ۳۶ که در متن‌ها هست؛ کلاکِ تایمر نیست! قطعاتی مثل I2C، UART2، CAN و SPI2 از همین کلاک می‌گیرند.',
  pclk2: 'PCLK2 کلاکِ باسِ APB2 است؛ با ÷۱ همان ۷۲ مگاهرتز می‌ماند. UART1، SPI1 و ADC از همین کلاک می‌گیرند.',
  tmul:  'ضریبِ تایمر یک چرخ‌دنده‌ی ضرب‌کننده است. اگر تقسیم‌کننده‌ی APB برابر ۱ نباشد، کلاکِ تایمر ×۲ می‌شود (۳۶ × ۲ = ۷۲)؛ با ÷۱ هیچ ضربی نیست (×۱).',
  t1:    'این کلاکِ تایمرهای APB1 (TIM2/3/4) است و جوابِ این مسیر. با ÷۲ دوباره ×۲ می‌شود و ۷۲ می‌گیرد.',
  t2:    'TIM1 روی APB2 است. با ÷۱ هم‌اندازه است و ۷۲ می‌چرخد؛ با ÷۲ هم دوباره ×۲ می‌شود و ۷۲. برای PWMِ موتور کلاکش ۷۲ مگاهرتز است.',
  psc:   'Prescaler یک چرخ‌دنده‌ی تقسیم‌کننده است: کلاکِ تایمر را بر (PSC+۱) تقسیم می‌کند تا عقربه‌ی شمارنده آهسته‌تر بشمرد. در CubeMX عدد PSC = ۸ یعنی تقسیم بر ۹؛ همیشه یکی بیشتر.',
  busq:  'خط‌چینِ خاکستری موجِ ایده‌آلِ کلاکِ باسِ APB1 است و خطِ رنگی آن چیزی که سیمِ واقعیِ داخلِ چیپ می‌سازد: سیم مثل یک خازنِ کوچک است و هر نیم‌دوره باید پر یا خالی شود. اگر کلاک آن‌قدر تند باشد که فرصتِ پر شدن نباشد، موج به خطِ HIGH (۷۵٪) نمی‌رسد و گیرنده بیت را اشتباه می‌خواند. (مدلِ ساده‌شده برای فهمیدنِ ماجرا)',
  uart:  'UART2 روی APB1 است و برای فرستادنِ متن (مثلاً به کامپیوتر) به کار می‌رود. با کلاکِ بیش از حد، بیت‌ها خراب می‌شوند و به‌جای متنِ درست، علامت‌های بی‌معنی می‌رسد.',
  i2c:   'I2C هم روی APB1 است و برای حرف زدن با سنسورها و نمایشگرها به کار می‌رود. با کلاکِ بیش از حد، سنسور «ACK» نمی‌دهد و ارتباط قطع می‌شود.',
  can:   'CAN شبکه‌ی ارتباطیِ خودرو و صنعت است و روی APB1 نشسته. بیتِ خراب یعنی فریمِ خطادار (CRC Error) و دورریخته شدنِ پیام.',
  wave:  'این موجِ پینِ خروجی (PA8) است. هر دورِ عقربه یک دوره‌ی موج است: تا وقتی عقربه روی کمانِ سبز است موج بالاست (HIGH) و بعدش پایین (LOW). خطِ زردِ Pulse جایی است که موج می‌افتد؛ هرچه Pulse بزرگ‌تر، بخشِ بالا پهن‌تر و موتور تندتر.',
  tick:  'این سرعتِ شمارشِ عقربه‌ی تایمر است: کلاکِ تایمر ÷ (PSC+۱). با هر ضربه عقربه یک خانه جلو می‌رود.',
  arr:   'Period (یا ARR) تعدادِ خانه‌های صفحه است: ARR+۱ خانه. عقربه از ۰ می‌رود تا ARR و دوباره به ۰ برمی‌گردد. یک دورِ کامل = یک دوره‌ی PWM.',
  pulse: 'Pulse (یا CCR) اندازه‌ی کمانِ سبز است. تا وقتی عقربه روی کمانِ سبز است پین روشن (HIGH) می‌ماند و بعدش خاموش. کمانِ بزرگ‌تر یعنی موتور بیشتر برق می‌گیرد و تندتر می‌چرخد.',
  lamp:  'این چراغ همان پایه‌ی خروجیِ PWM است (PA8): وقتی عقربه روی کمانِ سبز است روشن می‌شود و بعدش خاموش.'
};

const ctFa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace('.', '٫');
const ctNum = n => ctFa(+n.toFixed(2));
const ctHz = hz => hz >= 1e6 ? `${ctNum(hz / 1e6)} مگاهرتز` : hz >= 1e3 ? `${ctNum(hz / 1e3)} کیلوهرتز` : `${ctNum(hz)} هرتز`;
const ctTime = s => s >= 1e-3 ? `${ctNum(s * 1e3)} میلی‌ثانیه` : s >= 1e-6 ? `${ctNum(s * 1e6)} میکروثانیه` : `${ctNum(s * 1e9)} نانوثانیه`;
const CT_COL = { hse: '#e79a54', sys: '#57d8a3', pclk: '#5db0ff', tim: '#d4af37', psc: '#b48cf0' };
const ctNode = (key, name, mhz, cls, o = {}) => ({ t: 'n', key, name, mhz, cls, ...o });
const ctOp = (key, name, sym, n, inM, outM, cls, o = {}) => ({ t: 'o', key, name, sym, n, inM, outM, cls, ...o });
// زاویه‌ی چرخ‌دنده‌ی B وقتی با A درگیر است؛ phi = جهتِ خطِ مرکزِ A به B (برای درگیریِ دندانه‌ها در شیارها)
const ctMeshAt = (ta, tb, th, phi) => -(ta / tb) * (th - phi) + phi + Math.PI + Math.PI / tb;

function ctTeeth(T, rp){
  const step = 6.2832 / T, p = 6.2832 * rp / T, ro = rp + p * .32, ri = rp - p * .4;
  let d = '';
  for(let k = 0; k < T; k++){
    const a = k * step, pt = (r, o) => `${(r * Math.cos(a + o * step)).toFixed(1)} ${(r * Math.sin(a + o * step)).toFixed(1)}`;
    d += `${k ? 'L' : 'M'}${pt(ri, -.3)}L${pt(ro, -.14)}L${pt(ro, .14)}L${pt(ri, .3)}`;
  }
  return { d: d + 'Z', ro, ri };
}

/* نمودارِ چرخ‌دنده‌ی درگیر: چرخ‌دنده‌ی بزرگ = یک کلاک و مقدارش، چرخ‌دنده‌ی کوچک = عملِ ضرب/تقسیم (ضریبش داخلش).
   همه با گامِ یکسان ساخته شده‌اند و مماس‌اند، پس دنده‌هایشان واقعاً در هم می‌روند.
   trunk = مسیرِ اصلی، branches = شاخه‌هایی که از آخرین چرخ‌دنده‌ی trunk جدا می‌شوند (APB1 بالا و APB2 پایین) */
function ctFlow(svg, trunk, branches = [], wide = false){
  /* چرخ‌دنده‌های کلاک همیشه هم‌اندازه‌اند؛ فقط چرخ‌دنده‌ی ضریب بزرگ و کوچک می‌شود:
     ×عددِ بزرگ‌تر = چرخ‌دنده‌ی کوچک‌تر (تندتر)، ÷عددِ بزرگ‌تر = چرخ‌دنده‌ی بزرگ‌تر (سخت‌تر و کُندتر). */
  const P = 11, TS = 22, HS = 29, PAD = 8, id = svg.id;
  const radOf = T => T * P / 6.2832;
  const teethOf = it => it.t === 'n' ? TS : Math.round(Math.max(11, Math.min(34, 15 * Math.pow(it.sym === '×' ? it.n : 1 / it.n, -.35))));
  [...trunk, ...branches.flat()].forEach(it => { it.T = teethOf(it); });
  const rOf = it => radOf(it.T);
  const useOf = it => (it.bad && it.badUses) || it.uses || [];
  const cache = {};
  const gearOf = T => cache[T] || (cache[T] = ctTeeth(T, radOf(T)));
  const nb = branches.length;
  let lane = 50;

  const nodes = [];
  let x = PAD + rOf(trunk[0]);
  trunk.forEach((it, i) => {
    if(i) x += rOf(trunk[i - 1]) + rOf(it);
    nodes.push({ it, cx: x, cy: 0, par: i - 1, phi: 0 });
  });
  const hi = nodes.length - 1, hub = nodes[hi];
  branches.forEach(b => { lane = Math.min(lane, rOf(hub.it) + rOf(b[0]) - 6); });
  branches.forEach((b, bi) => {
    const dy = (bi ? 1 : -1) * lane, d = rOf(hub.it) + rOf(b[0]);
    let bx = hub.cx + Math.sqrt(d * d - dy * dy);
    b.forEach((it, i) => {
      if(i) bx += rOf(b[i - 1]) + rOf(it);
      nodes.push({ it, cx: bx, cy: dy, par: i ? nodes.length - 1 : hi, phi: i ? 0 : Math.atan2(dy, bx - hub.cx), side: i ? '' : (bi ? 'down' : 'up') });
    });
  });
  const ext = nodes.map(({ it, cx, cy }) => {
    const ro = gearOf(it.T).ro, isN = it.t === 'n';
    return { top: cy - ro - (isN ? 2 : 28), bot: cy + ro + (isN ? (it.final ? 18 : 2) + useOf(it).length * 10 + (useOf(it).length ? 2 : 0) : 28), right: cx + ro };
  });
  const oy = 6 - Math.min(...ext.map(e => e.top));
  nodes.forEach(n => { n.cy += oy; });
  const VW = Math.ceil(Math.max(...ext.map(e => e.right)) + PAD);
  const H = Math.ceil(Math.max(...ext.map(e => e.bot)) + oy + 4);

  const f1 = n => n.toFixed(1);
  const tx = (px, py, str, fs, fill, extra = '') => `<text x="${f1(px)}" y="${f1(py)}" font-size="${fs}" fill="${fill}" ${extra}>${str}</text>`;
  const holes = (n, r, hr) => Array.from({ length: n }, (_, k) => {
    const a = k * 6.2832 / n + .3;
    return `<circle class="hole" cx="${f1(r * Math.cos(a))}" cy="${f1(r * Math.sin(a))}" r="${hr}"/>`;
  }).join('');
  const LTR = 'style="direction:ltr;unicode-bidi:bidi-override"';

  let out = '';
  nodes.forEach(({ it, cx, cy, side }) => {
    const g = gearOf(it.T), HO = Math.min(15, g.ri * .72);
    const at = `<g transform="translate(${f1(cx)} ${f1(cy)})">`;
    if(it.t === 'n'){
      const col = it.bad ? '#ff6b6b' : CT_COL[it.cls], [num, unit] = ctHz(it.mhz * 1e6).split(' ');
      out += `<g data-talk="${it.key}" text-anchor="middle">` + at
        + `<g class="ct-g ${it.cls}${it.bad ? ' bad' : ''}"><path d="${g.d}"/>${holes(6, (HS + g.ri) / 2, 1.7)}</g>`
        + `<circle class="ct-gh" r="${HS}"${it.final ? ` style="stroke:${col};stroke-width:3"` : ''}/>`
        + `<text y="-10" font-size="8.5" font-weight="700" style="fill:#e8e2d0">${it.name}</text>`
        + `<text y="5" font-size="${num.length > 5 ? 13 : 15}" font-weight="700" style="fill:${col}">${num}</text>`
        + `<text y="16" font-size="8.5" style="fill:#8b93a3">${unit}</text></g>`
        + (it.final ? tx(cx, cy + g.ro + 11, '✔ جواب', 9.5, col, 'font-weight="700"') : '')
        + useOf(it).map((u, j) => tx(cx, cy + g.ro + (it.final ? 22 : 11) + j * 10, u, 9, '', `style="font-size:9px;fill:${it.bad ? '#ff6b6b' : '#9aa3b5'};${/^[\x00-\x7F·✖ ]+$/.test(u) ? 'direction:ltr;unicode-bidi:bidi-override' : 'direction:rtl;unicode-bidi:embed'}"`)).join('') + '</g>';
    } else {
      const eq = `${ctNum(it.inM)} ${it.sym} ${ctFa(it.n)} = ${ctNum(it.outM)}`;
      out += `<g data-talk="${it.key}" text-anchor="middle">` + at
        + `<g class="ct-g ${it.cls}${it.bad ? ' bad' : ''}"><path d="${g.d}"/>${holes(5, (HO + g.ri) / 2, 1.6)}</g>`
        + `<circle class="ct-gh" r="${HO}"/><text class="ct-gtx" y="${f1(HO * .3)}" font-size="${Math.round(Math.min(13, HO * 1.05))}" ${LTR}>${it.sym}${ctFa(it.n)}</text></g>`
        + tx(cx, side === 'up' ? cy - g.ro - 17 : side === 'down' ? cy + g.ro + 24 : cy - g.ro - 5, it.name, 10, '#e8e2d0', 'font-weight="700"')
        + tx(cx, side === 'up' ? cy - g.ro - 5 : cy + g.ro + 12, eq, 9.5, it.bad ? '#ff6b6b' : '#e8e2d0', LTR) + '</g>';
    }
  });

  nodes.forEach(({ it, cx, cy }) => {
    if(!it.edit) return;
    const o = gearOf(it.T).ro * .72;
    out += `<g data-edit="${it.edit}" text-anchor="middle" transform="translate(${f1(cx + o)} ${f1(cy - o)})" style="cursor:pointer"><title>تغییرِ ضریب</title>`
      + `<circle r="9" fill="#d4af37" stroke="#14161c" stroke-width="1.5"/><path d="M-3.8 4.2L-3.2 1.2L2.6 -4.6L4.6 -2.6L-1.2 3.2Z" fill="#14161c"/></g>`;
  });
  svg.setAttribute('viewBox', `0 0 ${VW} ${H}`);
  if(wide) Object.assign(svg.style, { width: VW + 'px', height: H + 'px', minWidth: VW + 'px', maxWidth: 'none' });
  else Object.assign(svg.style, { maxWidth: Math.round(VW * 1.3) + 'px', display: 'block', margin: '0 auto' });
  svg.innerHTML = out;
  const els = svg.querySelectorAll('.ct-g');
  return { id, geo: nodes.map(n => ({ cx: n.cx, cy: n.cy, r: rOf(n.it) })), gears: nodes.map((n, i) => ({ el: els[i], T: n.it.T, par: n.par, phi: n.phi, ang: 0 })) };
}

function ctDial(svg, { steps, pulse, pwm }){
  const R = 76, cx = 160, cy = 114, n = Math.min(steps, 64), duty = Math.min(1, pulse / steps);
  const at = (r, a) => `${(cx + r * Math.sin(a)).toFixed(1)} ${(cy - r * Math.cos(a)).toFixed(1)}`;
  let ticks = '';
  for(let i = 0; i < n; i++){
    const a = i / n * 6.2832;
    ticks += `<line class="ct-tk${i ? '' : ' z'}" x1="${at(R + 9, a).split(' ')[0]}" y1="${at(R + 9, a).split(' ')[1]}" x2="${at(R + (i ? 15 : 22), a).split(' ')[0]}" y2="${at(R + (i ? 15 : 22), a).split(' ')[1]}"/>`;
  }
  let arc = '', flag = '';
  if(pwm && duty > 0){
    const ea = duty * 6.2832;
    arc = duty >= 1 ? `<circle class="ct-arc" cx="${cx}" cy="${cy}" r="${R}"/>`
      : `<path class="ct-arc" d="M${at(R, 0)} A${R} ${R} 0 ${duty > .5 ? 1 : 0} 1 ${at(R, ea)}"/>`;
    if(duty < 1){
      const f = at(R + 34, ea).split(' ');
      flag = `<line class="ct-flag" x1="${at(R - 10, ea).split(' ')[0]}" y1="${at(R - 10, ea).split(' ')[1]}" x2="${at(R + 12, ea).split(' ')[0]}" y2="${at(R + 12, ea).split(' ')[1]}"/><text class="ct-fl" x="${f[0]}" y="${f[1]}">Pulse = ${ctFa(pulse)}</text>`;
    }
  }
  const centre = pwm
    ? `<g data-talk="lamp"><circle class="ct-lamp" cx="${cx}" cy="${cy}" r="30"/></g>`
    : `<circle class="ct-gh" cx="${cx}" cy="${cy}" r="30"/>`;
  svg.setAttribute('viewBox', '0 0 320 232');
  svg.innerHTML = `<g data-talk="arr"><circle class="ct-track" cx="${cx}" cy="${cy}" r="${R}"/>${ticks}</g>`
    + `<g data-talk="pulse">${arc}${flag}</g>${centre}`
    + `<text class="ct-fl" x="${cx}" y="14">شروع: خانه‌ی ۰</text>`
    + `<g transform="translate(${cx} ${cy})"><g data-ptr><line class="ct-ptr" x1="0" y1="0" x2="0" y2="${-(R - 6)}"/><circle class="ct-pd" cy="${-(R - 6)}" r="5.5"/></g></g>`
    + `<text class="ct-cnt${pwm ? ' on' : ''}" x="${cx}" y="${cy + 8}" data-cnt></text>`;
  return { ptr: svg.querySelector('[data-ptr]'), cnt: svg.querySelector('[data-cnt]'), lamp: pwm ? svg.querySelector('.ct-lamp') : null };
}

function mountClockTimerSim(container, { onSuccess, alreadyDone } = {}){
  const sel = (k, opts, sign) => `<select class="ct-sel" data-k="${k}">${opts.map(o => `<option value="${o}">${sign}${ctFa(o)}</option>`).join('')}</select>`;
  const row = (k, title, min, max) => `<div class="ct-row"><div class="ct-rn" data-talk="${k}"><b>${title}</b><span data-h="${k}"></span></div><input type="range" data-k="${k}" min="${min}" max="${max}"><input type="number" class="ct-num" data-k="${k}" min="${min}" max="${max}" inputmode="numeric"></div>`;
  const pre = (list) => `<div class="ct-pre">${list.map(([l, v]) => `<button type="button" class="sim-btn sim-btn-ghost" data-preset="${v}">${l}</button>`).join('')}</div>`;
  const head = (talk, title, ctl) => `<div class="ct-sc-h"><b data-talk="${talk}">${title}</b>${ctl ? `<label class="ct-ctl">${ctl}</label>` : ''}</div>`;
  const block = (id, headHtml, ctrl = '', extra = '') => `<div class="ct-sc">${headHtml}${ctrl}${extra ? '<div class="ct-pair">' : ''}<svg class="ct-svg" id="${id}" viewBox="0 0 320 200"></svg>${extra}${extra ? '</div>' : ''}<div class="ct-rel" id="${id}R"></div></div>`;

  container.innerHTML = `
    <div class="sim-wrap ct-wrap">
      <div class="sim-hw-note">هدف: با چرخ‌دنده‌ها ببین ضریب‌های کلاک چطور ساخته می‌شوند، تایمر و PWM را قدم‌به‌قدم بفهم، و اگر دوست داشتی آخرش یک PWM ۳۱٫۲۵ کیلوهرتزیِ ۵۰٪ هم بساز. امتحان کردنِ شبیه‌ساز اختیاری است؛ اگر فقط مطالعه کردی، پایینِ صفحه «مطالعه کردم ✓» را بزن تا مأموریت کامل شود. روی هر چرخ‌دنده یا صفحه بزن تا شوالیه توضیحش بدهد.</div>
      <div class="ct-answer"><b>جوابِ کوتاه به سؤالِ همیشگی:</b> ۷۲ مگاهرتز کلاکِ خودِ چیپ است. ۳۶ مگاهرتز فقط کلاکِ «باس APB1» است (یک گیربکسِ کُندکننده داخل چیپ)، نه کلاکِ تایمر. تایمرهای روی APB1 دوباره ×۲ می‌شوند و ۷۲ می‌گیرند؛ TIM1 هم اصلاً روی APB1 نیست و بی‌هیچ ضربی ۷۲ می‌گیرد.</div>
      <details class="hs-det" open>
        <summary>⏱️ کلاک یعنی چی؟</summary>
        <div class="hs-p">کلاک یک ضربانِ ثابت است، مثل چرخیدنِ یک چرخ‌دنده. چیپ با هر ضربه فقط یک قدمِ خیلی کوچک برمی‌دارد. «۷۲ مگاهرتز» یعنی ۷۲ میلیون ضربه در هر ثانیه؛ هرچه چرخ‌دنده تندتر بچرخد، چیپ سریع‌تر است.</div>
        <div class="hs-p">Blue Pill از یک کریستالِ ۸ مگاهرتزی شروع می‌کند. این برای یک ARM کُند است، پس PLL آن را ×۹ می‌کند و می‌شود ۷۲ مگاهرتز. این «کلاکِ خودِ چیپ» (SYSCLK) است و CPU با همین کار می‌کند.</div>
      </details>
      <details class="hs-det">
        <summary>🔧 قانونِ چرخ‌دنده (همه‌ی ضریب‌ها همین است)</summary>
        <div class="hs-p">دو چرخ‌دنده‌ی درگیر با هم: <b>نسبتِ دنده‌ها = نسبتِ سرعت</b>. چرخ‌دنده‌ی کوچک‌تر تندتر می‌چرخد و بزرگ‌تر کُندتر.</div>
        <div class="hs-p">مثال: چرخ‌دنده‌ی ۷۲ دنده‌ای که یک دور بزند، چرخ‌دنده‌ی ۸ دنده‌ای را ۹ دور می‌چرخاند (×۹). چرخ‌دنده‌ی دو برابر بزرگ‌تر سرعت را نصف می‌کند (÷۲). هر ضریبی که در این صفحه می‌بینی فقط یک جفت چرخ‌دنده است. در شکل‌ها چرخ‌دنده‌ی بزرگ مقدارِ کلاک را نشان می‌دهد و چرخ‌دنده‌ی کوچکِ بینشان ضریبِ آن مرحله را: ×۹ یعنی «ورودی را ۹ برابر کن» و ÷۲ یعنی «نصفش کن».</div>
      </details>
      <details class="hs-det">
        <summary>🧮 جدولِ ضریب‌ها</summary>
        <table class="hs-table">
          <tr><th>ضریب</th><th>کارش</th><th>چرا؟</th></tr>
          <tr><td>PLL ×۹</td><td>۸ را می‌کند ۷۲</td><td>کریستالِ ارزان کُند است</td></tr>
          <tr><td>APB1 ÷۲</td><td>۷۲ را می‌کند ۳۶ (PCLK1)</td><td>قطعاتِ APB1 بیش از ۳۶ مگاهرتز تحمل ندارند</td></tr>
          <tr><td>قانونِ ×۲ تایمر</td><td>کلاکِ تایمر را از ۳۶ به ۷۲ برمی‌گرداند</td><td>اگر تقسیم‌کننده‌ی APB برابر ۱ نباشد ⇒ ×۲</td></tr>
          <tr><td>Prescaler (PSC)</td><td>ضربه‌های شمارنده را تقسیم بر (PSC+۱) کُند می‌کند</td><td>شمارنده آهسته‌تر بشمرد</td></tr>
          <tr><td>Period (ARR)</td><td>تعدادِ خانه‌های صفحه (ARR+۱)</td><td>طولِ هر دور = هر دوره‌ی PWM</td></tr>
          <tr><td>Pulse (CCR)</td><td>اندازه‌ی کمانِ سبز</td><td>سرعتِ موتور (دیوتی)</td></tr>
        </table>
      </details>
      <div class="st-steps" id="ctSteps">
        <span class="st-chip" data-s="pll">۱ PLL ×۹</span>
        <span class="st-chip" data-s="apb">۲ APB1 ÷۲</span>
        <span class="st-chip" data-s="quiz">۳ سؤالِ تایمر</span>
        <span class="st-chip" data-s="pwm">۴ PWM ۵۰٪</span>
        <button type="button" class="sim-btn sim-btn-ghost st-reset" id="ctReset">↺ از اول</button>
      </div>

      <div class="ct-stage-t">⚙️ بخش ۱ — کلاکِ چیپ با چرخ‌دنده</div>
      <div class="hs-p">هر چرخ‌دنده‌ی بزرگ یک کلاک را با مقدارش نشان می‌دهد و چرخ‌دنده‌ی کوچکِ بینِ دو کلاک عملِ ضرب (×) یا تقسیم (÷) را انجام می‌دهد؛ عددِ داخلِ چرخ‌دنده‌ی کوچک ضریب است و زیرش خودِ حساب نوشته شده. چرخ‌دنده‌ها به هم درگیرند و با هم می‌چرخند. منوها را عوض کن و ببین عددها چه می‌شوند.</div>
      <div class="ct-sc">
        <div class="ct-sc-h"><b>🧩 مسیرِ کاملِ کلاک: از کریستال تا تایمر</b></div>
        <div class="ct-sc-h"><label class="ct-ctl">PSC ${sel('psc', Array.from({ length: 12 }, (_, i) => i), '=')}</label><label class="ct-ctl">APB2 ${sel('a2', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">APB1 ${sel('a1', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">PLL ${sel('pll', CT_PLL_OPTS, '×')}</label></div>
        <div class="hs-p ct-cap">از چپ به راست بخوان: هر چرخ‌دنده‌ی بزرگ یک کلاک و مقدارش است و چرخ‌دنده‌ی کوچکِ بینِ دو کلاک ضرب یا تقسیمش را انجام می‌دهد؛ عددِ داخلِ چرخ‌دنده‌ی کوچک همان ضریب است. بعد از HCLK مسیر دو شاخه می‌شود: APB1 (بالا) و APB2 (پایین). چرخ‌دنده‌های «✔ جواب» نتیجه‌اند. روی علامتِ ✎ کنارِ چرخ‌دنده‌های PLL، APB و PSC بزن تا ضریبشان را عوض کنی. چرخ‌دنده‌ی ضریب هرچه کوچک‌تر باشد (×) تندتر می‌چرخد و هرچه بزرگ‌تر باشد (÷) سخت‌تر و کُندتر؛ با تغییرِ ضریب‌ها سرعتِ کلِ چرخ‌دنده‌ها هم عوض می‌شود. برای دیدنِ همه‌ی مسیر صفحه را به چپ و راست بکش.</div>
        <div class="ct-scroll" dir="ltr"><svg class="ct-svg ct-wide" id="ctGA" viewBox="0 0 720 300"></svg></div>
        <div class="ct-rel" id="ctGAR"></div>
      </div>
      ${block('ctG1', head('pll', '① PLL: ۸ مگاهرتز را تقویت کن', 'ضریب ' + sel('pll', CT_PLL_OPTS, '×')))}
      ${block('ctG2', head('apb1', '② باسِ APB1 و تایمرهای TIM2/3/4', 'تقسیم ' + sel('a1', CT_DIV_OPTS, '÷')))}
      ${block('ctG3', head('apb2', '③ باسِ APB2 و تایمرِ TIM1', 'تقسیم ' + sel('a2', CT_DIV_OPTS, '÷')))}
      <div class="sim-status" id="ctSt1" data-state="idle"></div>
      <div class="ct-quiz">
        <div class="hs-p"><b>🧠 سؤال:</b> فرض کن SYSCLK برابر ۷۲ باشد و APB1 را روی ÷۴ بگذاری. کلاکِ تایمرهای APB1 چند مگاهرتز می‌شود؟ اول حساب کن، بعد با منوی ② امتحانش کن.</div>
        <div class="ll-row">
          <button type="button" class="sim-btn sim-btn-ghost" data-q="18">۱۸ مگاهرتز</button>
          <button type="button" class="sim-btn sim-btn-ghost" data-q="36">۳۶ مگاهرتز</button>
          <button type="button" class="sim-btn sim-btn-ghost" data-q="72">۷۲ مگاهرتز</button>
        </div>
      </div>

      <div class="ct-stage-t">🔬 بخش ۱ب — چرا کلاکِ باس را نصف کردند؟ (دلیلِ طراحی)</div>
      <div class="ct-explain"><b>طراحانِ STM32 با یک تضاد روبه‌رو بودند:</b><br>
        ۱) <b>باسِ APB1 تحملِ سرعتِ زیاد را ندارد.</b> قطعاتی مثل I2C و UART و CAN بیش از ۳۶ مگاهرتز نمی‌توانند کار کنند؛ مصرفِ انرژی بالا می‌رود و سیگنالِ دیجیتال خطا پیدا می‌کند.<br>
        ۲) <b>تایمر به سرعتِ بالا نیاز دارد.</b> تایمرها قلبِ ساختنِ PWM و اندازه‌گیریِ زمان‌اند؛ اگر کلاکشان نصف شود، دقتشان (Resolution) هم نصف می‌شود.<br>
        <b>راه‌حل:</b> یک سوئیچِ خودکار در سخت‌افزار گذاشتند: «اگر تقسیم‌کننده‌ی APB برابر ۱ بود، کلاکِ تایمر همان کلاکِ باس است؛ اگر بزرگ‌تر از ۱ بود (مثلاً ۲)، کلاکِ تایمر را دو برابر کن.»</div>
      <div class="ct-sc">
        <div class="ct-sc-h"><b data-talk="busq">🧪 آزمایش ۱: اگر باسِ APB1 را تندتر از ۳۶ بچرخانیم</b></div>
        <div class="ct-sc-h"><label class="ct-ctl">APB1 ${sel('a1', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">PLL ${sel('pll', CT_PLL_OPTS, '×')}</label></div>
        <canvas class="ct-cv" id="ctBus"></canvas>
        <div class="ct-rel" id="ctBusR"></div>
        <div class="ct-devs" id="ctDevs"></div>
      </div>

      <div class="ct-stage-t">⏲️ بخش ۲ — تایمر یعنی چی؟</div>
      <div class="ct-explain"><b>تایمر یک عقربه روی یک صفحه‌ی گرد است.</b> هر ضربه‌ی کلاک، عقربه یک خانه جلو می‌رود؛ به آخرین خانه که رسید دوباره به ۰ برمی‌گردد. همین! خودِ سخت‌افزار می‌شمارد و CPU آزاد می‌ماند. دو تنظیم دارد: <b>Prescaler</b> (ضربه‌ها چقدر کُند شوند) و <b>Period</b> (صفحه چند خانه دارد).</div>
      <div class="hs-p" data-v="src"></div>
      ${block('ctG4', head('psc', '④ Prescaler: گیربکسِ ضربه‌ها'), row('psc', 'Prescaler (PSC)', 0, 11) + '<div class="ct-rel">❓ چرا PSC می‌تواند ۰ باشد؟ چون سخت‌افزار بر (PSC+۱) تقسیم می‌کند، پس هیچ‌وقت تقسیم بر صفر نمی‌شود: PSC=۰ یعنی ÷۱.</div>')}
      ${block('ctD1', head('arr', '⑤ شمارنده: صفحه‌ی گرد'), row('arr', 'Period (ARR)', 1, 1023) + '<div class="ct-rel">❓ چرا از ۱ شروع می‌شود؟ ARR=۰ یعنی فقط ۱ خانه؛ عقربه جایی برای حرکت ندارد و PWM فقط می‌تواند ۰٪ یا ۱۰۰٪ باشد.</div>' + pre([['۷', 'arr:7'], ['۱۵', 'arr:15'], ['۲۵۵', 'arr:255'], ['۱۰۲۳', 'arr:1023']]))}

      <div class="ct-stage-t">💡 بخش ۳ — PWM یعنی چی؟</div>
      <div class="ct-explain"><b>PWM یعنی یک پین را خیلی سریع روشن و خاموش کنیم.</b> موتور آن‌قدر کُند است که تک‌تک چشمک‌ها را حس نمی‌کند و فقط «میانگین» را می‌بیند. مثلاً نیمی از دور روشن = نصفِ ولتاژ = نصفِ سرعت. روشن‌ماندن را همان عقربه تعیین می‌کند: <b>روی کمانِ سبز (Pulse) پین روشن است و روی بقیه خاموش.</b></div>
      ${block('ctD2', head('pulse', '⑥ کمانِ سبز = بالا بودنِ موجِ PWM'), row('pulse', 'Pulse (CCR)', 0, 16) + pre([['۲۵٪', 'duty:25'], ['۵۰٪', 'duty:50'], ['۷۵٪', 'duty:75'], ['۱۰۰٪', 'duty:100']]), '<canvas class="ct-cv ct-pw" id="ctPw" data-talk="wave"></canvas>')}
      <div class="ct-sc">
        <div class="ct-sc-h"><b>موجِ خروجی (سه دور پشت‌سرهم)</b></div>
        <canvas class="ct-cv" id="ctCv"></canvas>
        <div class="ct-motor"><span class="ct-gear" id="ctGear"><svg viewBox="-15 -15 30 30" width="30" height="30" aria-hidden="true"><g fill="#c9ced8"><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(0)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(45)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(90)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(135)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(180)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(225)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(270)"/><rect x="-2.6" y="-14" width="5.2" height="6" rx="1" transform="rotate(315)"/><circle r="10.5"/></g><circle r="4.5" fill="#10151f"/></svg></span><div class="ct-bar"><i id="ctBar"></i></div><b data-o="d2"></b></div>
        <div class="ct-rel" data-o="avg"></div>
      </div>
      <div class="ct-sc ct-form">
        <div class="ct-sc-h"><b>رابطه‌ی همه‌ی پارامترها (زنده)</b></div>
        <div class="ct-fl2">فرکانسِ PWM = کلاکِ تایمر ÷ (PSC+۱) ÷ (ARR+۱)</div>
        <div class="ct-eq" id="ctEq1"></div>
        <div class="ct-fl2">دیوتی = Pulse ÷ (ARR+۱)</div>
        <div class="ct-eq" id="ctEq2"></div>
      </div>
      <div class="sim-status" id="ctSt2" data-state="idle"></div>
      <div class="ll-row"><button type="button" class="sim-btn sim-btn-ghost" id="ctHint">💡 راهنما</button></div>
    </div>`;

  const q = s => container.querySelector(s), qa = s => container.querySelectorAll(s);
  const ac = new AbortController(), sig = { signal: ac.signal };
  const listen = (t, f) => container.addEventListener(t, f, sig);
  const cv = q('#ctCv'), g = cv.getContext('2d');
  const st = { ...CT_INIT };
  const done = { pll: false, apb: false, quiz: false, pwm: false };
  let succeeded = !!alreadyDone, raf = 0, last = 0, tp = 0, revT = 3.2, scenes = [], dials = [];
  const angs = {};

  const say = (n, state, text) => { const el = q('#ctSt' + n); el.dataset.state = state; el.textContent = text; };
  const knight = k => { if(typeof showKnightLine === 'function') showKnightLine(CT_TALK[k], 'happy', 'knight'); };

  const clocks = () => {
    const sys = CT_HSE * st.pll, p1 = sys / st.a1, p2 = sys / st.a2;
    return { sys, p1, p2, t1: st.a1 === 1 ? p1 : p1 * 2, t2: st.a2 === 1 ? p2 : p2 * 2 };
  };
  const pwm = () => {
    const tclk = clocks().t2 * 1e6, tick = tclk / (st.psc + 1), steps = st.arr + 1;
    return { tclk, tick, steps, freq: tick / steps, duty: Math.min(1, st.pulse / steps) };
  };
  const pwmOk = () => { const m = pwm(); return m.freq >= 30000 && m.freq <= 32500 && m.duty >= .45 && m.duty <= .55; };

  function buildScenes(){
    const c = clocks(), m = pwm(), steps = m.steps, tick = m.tick / 1e6, fa = ctNum;
    const b1 = c.p1 > 36, b2 = c.p2 > 72;
    const hse = ctNode('hse', 'HSE', CT_HSE, 'hse');
    const sys = ctNode('sys', 'SYSCLK', c.sys, 'sys', { uses: ['هسته‌ی CPU'] });
    const hclk = ctNode('hclk', 'HCLK', c.sys, 'sys');
    const p1 = ctNode('pclk1', 'PCLK1', c.p1, 'pclk', { bad: b1, uses: ['I2C · UART2 · CAN'], badUses: ['✖ I2C · UART2 · CAN', 'ارتباط خراب می‌شود'] });
    const p2 = ctNode('pclk2', 'PCLK2', c.p2, 'pclk', { bad: b2, uses: ['UART1 · SPI1 · ADC'], badUses: ['✖ UART1 · SPI1 · ADC', 'ارتباط خراب می‌شود'] });
    const t1 = ctNode('t1', 'TIM2/3/4', c.t1, 'tim', { bad: c.t1 > 72, uses: ['PWM و زمان‌سنجی'] });
    const t2 = ctNode('t2', 'TIM1', c.t2, 'tim', { bad: c.t2 > 72, uses: ['PWM موتور'] });
    const cnt = ctNode('tick', 'شمارنده', tick, 'psc');
    const pll = ctOp('pll', 'PLL', '×', st.pll, CT_HSE, c.sys, 'sys', { edit: 'pll' });
    const ahb = ctOp('ahb', 'AHB', '÷', 1, c.sys, c.sys, 'sys');
    const apb1 = ctOp('apb1', 'APB1', '÷', st.a1, c.sys, c.p1, 'pclk', { bad: b1, edit: 'a1' });
    const apb2 = ctOp('apb2', 'APB2', '÷', st.a2, c.sys, c.p2, 'pclk', { bad: b2, edit: 'a2' });
    const mul1 = ctOp('tmul', 'ضریبِ تایمر', '×', st.a1 === 1 ? 1 : 2, c.p1, c.t1, 'tim');
    const mul2 = ctOp('tmul', 'ضریبِ تایمر', '×', st.a2 === 1 ? 1 : 2, c.p2, c.t2, 'tim');
    const psc = ctOp('psc', 'PSC', '÷', st.psc + 1, c.t2, tick, 'psc', { edit: 'psc' });
    const fin = n => ({ ...n, final: true });
    scenes = [
      ctFlow(q('#ctG1'), [hse, pll, fin(sys)]),
      ctFlow(q('#ctG2'), [sys, apb1, p1, mul1, fin(t1)]),
      ctFlow(q('#ctG3'), [sys, apb2, p2, mul2, fin(t2)]),
      ctFlow(q('#ctG4'), [t2, psc, fin(cnt)]),
      ctFlow(q('#ctGA'), [hse, pll, sys, ahb, hclk], [[apb1, p1, mul1, fin(t1)], [apb2, p2, mul2, fin(t2), psc, fin(cnt)]], true)
    ];
    [c.sys, c.p1, c.p2, tick, (c.p1 + c.p2 + tick) / 3].forEach((v, i) => { scenes[i].mhz = v; });
    q('#ctG1R').innerHTML = `<div>چرخ‌دنده‌ی PLL ورودی را ${ctFa(st.pll)} برابر می‌کند: ${fa(CT_HSE)} × ${ctFa(st.pll)} = <b>${ctHz(c.sys * 1e6)}</b></div>`;
    const laneTxt = (a, apb, pc, tm, tn) => `<div>چرخ‌دنده‌ی ${apb} تقسیم می‌کند: ${fa(c.sys)} ÷ ${ctFa(a)} = ${ctHz(pc * 1e6)}</div>`
      + `<div>${a === 1 ? 'چون تقسیم‌کننده ۱ است، ضریبِ تایمر ×۱ می‌ماند' : 'چون تقسیم‌کننده ۱ نیست، چرخ‌دنده‌ی «ضریبِ تایمر» آن را ×۲ می‌کند'}: ${fa(pc)} × ${a === 1 ? '۱' : '۲'} = <b>${ctHz(tm * 1e6)}</b> (${tn})</div>`;
    q('#ctG2R').innerHTML = laneTxt(st.a1, 'APB1', c.p1, c.t1, 'کلاکِ تایمرهای TIM2/3/4');
    q('#ctG3R').innerHTML = laneTxt(st.a2, 'APB2', c.p2, c.t2, 'کلاکِ تایمرِ TIM1');
    q('#ctG4R').innerHTML = `<div>چرخ‌دنده‌ی PSC کلاکِ تایمر را بر ${ctFa(st.psc + 1)} تقسیم می‌کند: ${ctHz(m.tclk)} ÷ ${ctFa(st.psc + 1)} = <b>${ctHz(m.tick)}</b></div>`
      + `<div>یعنی عقربه‌ی شمارنده هر <b>${ctTime(1 / m.tick)}</b> یک خانه جلو می‌رود (${ctFa(Math.round(m.tick))} خانه در ثانیه).</div>`;
    q('#ctGAR').innerHTML = `<div><b>جواب نهایی:</b> کلاکِ تایمرهای TIM2/3/4 = <b>${ctHz(c.t1 * 1e6)}</b> ، کلاکِ TIM1 = <b>${ctHz(c.t2 * 1e6)}</b> و شمارنده‌ی TIM1 بعد از Prescaler با <b>${ctHz(m.tick)}</b> می‌شمارد.</div>`
      + `<div>مسیرِ TIM1: ${fa(CT_HSE)} ×${ctFa(st.pll)} ⇒ ${fa(c.sys)} ÷${ctFa(st.a2)} ⇒ ${fa(c.p2)} ×${st.a2 === 1 ? '۱' : '۲'} ⇒ ${fa(c.t2)} ÷${ctFa(st.psc + 1)} ⇒ ${fa(tick)}</div>`;
    revT = steps <= 64 ? Math.min(5, Math.max(2.4, steps * .2)) : 4;
    dials = [
      ctDial(q('#ctD1'), { steps, pulse: st.pulse, pwm: false }),
      ctDial(q('#ctD2'), { steps, pulse: st.pulse, pwm: true })
    ];
    const per = steps / m.tick;
    q('#ctD1R').innerHTML = `<div>صفحه ${ctFa(steps)} خانه دارد (۰ تا ${ctFa(st.arr)})${steps > 64 ? ' ؛ فقط ۶۴ خط نشان داده شده' : ''}. یک دورِ کامل = ${ctFa(steps)} ضربه = <b>${ctTime(per)}</b>.</div>`
      + `<div>(سرعتِ عقربه اینجا نمایشی و کُند شده است؛ در واقعیت ${ctNum(1 / per)} دور در ثانیه می‌چرخد.)</div>`;
    q('#ctD2R').innerHTML = `<div>هر دور = یک دوره‌ی PWM = ${ctHz(m.freq)}.</div>`
      + `<div>روی کمانِ سبز ${ctFa(Math.min(st.pulse, steps))} از ${ctFa(steps)} خانه ⇒ پین <b>${ctNum(m.duty * 100)}٪</b> از دور روشن است.</div>`
      + '<div>موجِ کنارِ صفحه همان پینِ PA8 است: وقتی عقربه روی کمانِ سبز است موج بالاست و بعدش پایین؛ هر دورِ عقربه = یک دوره‌ی موج.</div>';
  }

  function spin(dt){
    tp += dt;
    scenes.forEach(sc => {
      angs[sc.id] = (angs[sc.id] || 0) + CT_W * 2 * Math.sqrt(sc.mhz / CT_HSE) * dt;
      sc.gears.forEach(gr => {
        const pr = sc.gears[gr.par];
        gr.ang = pr ? ctMeshAt(pr.T, gr.T, pr.ang, gr.phi) : angs[sc.id];
        gr.el.setAttribute('transform', `rotate(${(gr.ang * 57.2958).toFixed(1)})`);
      });
    });
    const steps = st.arr + 1, fr = (tp / revT) % 1, cnt = Math.min(steps - 1, Math.floor(fr * steps));
    const ang = (steps <= 64 ? (cnt + .5) / steps : fr) * 360;
    dials.forEach(d => {
      d.ptr.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
      d.cnt.textContent = ctFa(cnt);
      if(d.lamp) d.lamp.setAttribute('class', 'ct-lamp' + (cnt < st.pulse ? ' on' : ''));
    });
  }

  function paintChips(){
    const keys = ['pll', 'apb', 'quiz', 'pwm'], next = keys.find(k => !done[k]);
    qa('.st-chip').forEach(c => { c.classList.toggle('ok', done[c.dataset.s]); c.classList.toggle('next', c.dataset.s === next); });
    qa('[data-q]').forEach(b => { b.disabled = !done.apb; });
  }

  function paintTimer(){
    const m = pwm(), out = (k, t) => { q(`[data-o="${k}"]`).textContent = t; };
    q('[data-v="src"]').textContent = `ورودیِ این بخش: کلاکِ تایمرِ TIM1 = ${ctHz(m.tclk)} (از بخش ۱)`;
    q('[data-h="psc"]').textContent = `تقسیم بر ${ctFa(st.psc + 1)} ⇒ شمارش با ${ctHz(m.tick)}`;
    q('[data-h="arr"]').textContent = `${ctFa(m.steps)} خانه، از ۰ تا ${ctFa(st.arr)}`;
    q('[data-h="pulse"]').textContent = `روشن تا خانه‌ی ${ctFa(st.pulse)} از ${ctFa(m.steps)}`;
    qa('input[data-k="pulse"]').forEach(i => { i.max = m.steps; });
    out('d2', `${ctNum(m.duty * 100)}٪`);
    out('avg', `ولتاژِ میانگینِ موتور ≈ ${ctNum(CT_BATT * m.duty)} ولت از ${ctFa(CT_BATT)} ولتِ باتری ⇒ سرعتِ موتور ${ctNum(m.duty * 100)}٪`);
    q('#ctBar').style.width = (m.duty * 100) + '%';
    const gear = q('#ctGear');
    gear.style.animationPlayState = m.duty > 0 ? 'running' : 'paused';
    gear.style.animationDuration = (2.6 - 2.3 * m.duty).toFixed(2) + 's';
    const eq = list => list.map(t => `<span>${t}</span>`).join('');
    q('#ctEq1').innerHTML = eq([ctHz(m.tclk), '÷', ctFa(st.psc + 1), '÷', ctFa(m.steps), '=', `<b>${ctHz(m.freq)}</b>`]);
    q('#ctEq2').innerHTML = eq([ctFa(Math.min(st.pulse, m.steps)), '÷', ctFa(m.steps), '=', `<b>${ctNum(m.duty * 100)}٪</b>`]);
  }

  function say1(){
    const c = clocks(), std = c.sys === 72 && st.a1 === 2 && st.a2 === 1;
    if(c.p1 > 36) return say('1', 'error', `⚠️ PCLK1 شد ${ctHz(c.p1 * 1e6)} ولی باسِ APB1 فقط تا ۳۶ مگاهرتز تحمل دارد (چرخ‌دنده‌ی قرمز). برای همین باید تقسیم‌کننده‌ی APB1 را روی ÷۲ بگذاری تا چرخ‌دنده‌ی APB1 عدد را نصف کند.`);
    if(c.p2 > 72) return say('1', 'error', `⚠️ PCLK2 شد ${ctHz(c.p2 * 1e6)}؛ سقفِ APB2 هم ۷۲ مگاهرتز است.`);
    if(!done.pll) return say('1', 'running', `SYSCLK الان ${ctHz(c.sys * 1e6)} است. برای ۷۲ مگاهرتز ضریبِ PLL را روی ×۹ بگذار تا چرخ‌دنده‌ی PLL عددِ ۸ را ۹ برابر کند (۸ × ۹).`);
    if(!done.apb) return say('1', 'running', '👌 کلاکِ چیپ ۷۲ مگاهرتز شد. حالا APB1 را روی ÷۲ بگذار و به چرخ‌دنده‌ی «ضریبِ تایمر» نگاه کن: PCLK1 می‌شود ۳۶ ولی تایمر دوباره ۷۲!');
    if(!std) return say('1', 'running', `APB1 روی ÷${ctFa(st.a1)}: PCLK1 = ${ctHz(c.p1 * 1e6)} و کلاکِ تایمرهای APB1 = ${ctHz(c.t1 * 1e6)}.`);
    if(!done.quiz) return say('1', 'success', '✅ این همان تنظیمِ استانداردِ CubeMX است. حالا به سؤالِ پایین جواب بده.');
    say('1', 'success', '✅ کلاک درست است. با منوها بازی کن و ببین چرخ‌دنده‌ها چطور تغییر می‌کنند.');
  }

  function sayTimer(){
    const m = pwm(), f = m.freq;
    const note = m.tclk === 72e6 ? '' : ` (کلاکِ ورودیِ تایمر الان ${ctHz(m.tclk)} است؛ بخش ۱ را کامل کن.)`;
    if(pwmOk()){
      const exact = st.psc === 8 && st.arr === 255 ? ' دقیقاً همان تنظیمِ CubeMX: Prescaler = ۸ و Period = ۲۵۵.' : '';
      const rest = done.apb && done.quiz ? '' : ' بخش ۱ هم هنوز مانده است.';
      return say('2', 'success', `✅ PWM ${ctHz(f)} با دیوتیِ ${ctNum(m.duty * 100)}٪ ⇒ موتور با نصفِ سرعت می‌چرخد.${exact}${rest}`);
    }
    if(f > 32500) return say('2', 'running', `فرکانسِ PWM ${ctHz(f)} است و بالاتر از هدف (حدود ۳۱٫۲۵ کیلوهرتز). Prescaler یا Period را بزرگ‌تر کن؛ یعنی خانه‌های بیشتر یا ضربه‌های کُندتر.${note}`);
    if(f < 30000) return say('2', 'running', `فرکانسِ PWM ${ctHz(f)} است${f < 20000 ? ' و زیر ۲۰ کیلوهرتز؛ موتور در این محدوده سوت می‌کشد' : ''}. Prescaler یا Period را کوچک‌تر کن.${note}`);
    say('2', 'running', `فرکانس خوب است (${ctHz(f)}). حالا Pulse را نصفِ ${ctFa(m.steps)} بگذار تا کمانِ سبز نیمی از دایره شود و دیوتی ۵۰٪ بشود؛ الان ${ctNum(m.duty * 100)}٪ است.${note}`);
  }

  function checkDone(){
    const c = clocks(), safe = c.p1 <= 36 && c.p2 <= 72;
    if(safe && c.sys === 72) done.pll = true;
    if(safe && c.sys === 72 && st.a1 === 2 && st.a2 === 1) done.apb = true;
    if(pwmOk()) done.pwm = true;
    paintChips();
    if(succeeded || !(done.pll && done.apb && done.quiz && done.pwm)) return false;
    succeeded = true;
    if(onSuccess) onSuccess();
    return true;
  }

  function refresh(){
    qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; }); buildScenes(); const fin = checkDone(); paintTimer(); paintLab(); say1(); sayTimer();
    if(fin) say('2', 'success', CT_FINISH);
  }

  function answer(v){
    if(v !== 36){
      say('1', 'error', v === 18
        ? '۱۸ کلاکِ باس (PCLK1) است: ۷۲ ÷ ۴. ولی چرخ‌دنده‌ی «ضریبِ تایمر» آن را ×۲ می‌کند (چون تقسیم‌کننده ۱ نیست). دوباره حساب کن.'
        : '۷۲ فقط وقتی درست است که تقسیم‌کننده ۱ یا ۲ باشد. اینجا ۷۲ ÷ ۴ = ۱۸ و بعد ×۲. منوی ② را روی ÷۴ بگذار و به چرخ‌دنده‌ها نگاه کن.');
      return;
    }
    done.quiz = true;
    const fin = checkDone();
    say('1', 'success', '✅ درست! ۷۲ ÷ ۴ = ۱۸ مگاهرتز PCLK1 می‌شود و چون تقسیم‌کننده ۱ نیست، چرخ‌دنده‌ی «ضریبِ تایمر» آن را ×۲ می‌کند: ۱۸ × ۲ = ۳۶. منوی ② را روی ÷۴ بگذار و خودت ببین؛ بعد برگردان روی ÷۲.');
    if(fin) say('2', 'success', CT_FINISH);
  }

  function hint(){
    if(!done.pll) return say('1', 'running', 'راهنما: ضریبِ PLL را روی ×۹ بگذار (۸ × ۹ = ۷۲).');
    if(!done.apb) return say('1', 'running', 'راهنما: APB1 را روی ÷۲ و APB2 را روی ÷۱ بگذار.');
    if(!done.quiz) return say('1', 'running', 'راهنما: اول ۷۲ ÷ ۴ را حساب کن؛ بعد یادت باشد چون تقسیم‌کننده ۱ نیست، تایمر ×۲ می‌شود.');
    say('2', 'running', 'راهنما: Prescaler را ۸ (تقسیم بر ۹ ⇒ ۸ مگاهرتز)، Period را ۲۵۵ و Pulse را ۱۲۸ بگذار.');
  }

  function syncInputs(except){
    qa('input[data-k]').forEach(i => { if(i !== except) i.value = st[i.dataset.k]; });
  }

  function reset(){
    Object.assign(st, CT_INIT);
    Object.keys(done).forEach(k => { done[k] = false; });
    qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; });
    syncInputs(null);
    refresh();
  }

  const EDIT = {
    pll: { t: 'PLL', sym: '×', list: CT_PLL_OPTS.map(v => [v, v]) },
    a1:  { t: 'APB1', sym: '÷', list: CT_DIV_OPTS.map(v => [v, v]) },
    a2:  { t: 'APB2', sym: '÷', list: CT_DIV_OPTS.map(v => [v, v]) },
    psc: { t: 'Prescaler', sym: '÷', list: Array.from({ length: 12 }, (_, i) => [i, i + 1]) }
  };
  let pop = null;
  const closePop = () => { document.querySelectorAll('.ct-pop').forEach(n => n.remove()); pop = null; };
  function openPop(badge){
    closePop();
    const k = badge.dataset.edit, def = EDIT[k], r = badge.getBoundingClientRect();
    pop = document.createElement('div');
    pop.className = 'ct-pop';
    pop.dir = 'rtl';
    pop.style.cssText = 'position:fixed;z-index:9999;background:#1b1e26;border:1px solid #d4af37;border-radius:12px;padding:10px;box-shadow:0 8px 28px rgba(0,0,0,.55);color:#e8e2d0;max-width:260px;font-family:' + getComputedStyle(container).fontFamily;
    const btn = ([v, n]) => `<button type="button" data-v="${v}" style="cursor:pointer;direction:ltr;padding:7px 4px;border-radius:8px;font:inherit;font-weight:700;border:1px solid ${st[k] === v ? '#d4af37' : '#3a4050'};background:${st[k] === v ? '#d4af37' : '#262b36'};color:${st[k] === v ? '#14161c' : '#e8e2d0'}">${def.sym}${ctFa(n)}</button>`;
    pop.innerHTML = `<div style="font-size:12px;margin-bottom:8px"><b>${def.t}</b> — ضریب را انتخاب کن${k === 'psc' ? ' (عددِ PSC یکی کمتر از تقسیم است)' : ''}</div>`
      + `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${def.list.map(btn).join('')}</div>`;
    pop.addEventListener('click', ev => {
      const b = ev.target.closest('button[data-v]');
      if(!b) return;
      st[k] = +b.dataset.v;
      closePop(); syncInputs(null); refresh();
    });
    document.body.appendChild(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.bottom + 6)) + 'px';
  }
  const onDocClick = e => { if(pop && !e.target.closest('.ct-pop, [data-edit]')) closePop(); };
  const onKey = e => { if(e.key === 'Escape') closePop(); };
  document.addEventListener('click', onDocClick, sig);
  document.addEventListener('keydown', onKey, sig);

  listen('input', e => {
    const el = e.target.closest('input[data-k]');
    if(!el) return;
    const k = el.dataset.k, v = parseInt(el.value, 10);
    if(Number.isNaN(v)) return;
    const lim = { psc: [0, 11], arr: [1, 1023], pulse: [0, st.arr + 1] }[k];
    st[k] = Math.max(lim[0], Math.min(lim[1], v));
    if(k === 'arr') st.pulse = Math.min(st.pulse, st.arr + 1);
    syncInputs(el);
    refresh();
  });

  listen('change', e => {
    const s = e.target.closest('select.ct-sel');
    if(!s) return;
    st[s.dataset.k] = +s.value;
    refresh();
  });

  listen('click', e => {
    const ed = e.target.closest('[data-edit]');
    if(ed){ openPop(ed); return; }
    const pr = e.target.closest('[data-preset]');
    if(pr){
      const [k, v] = pr.dataset.preset.split(':');
      if(k === 'arr'){ st.arr = +v; st.pulse = Math.min(st.pulse, st.arr + 1); }
      else st.pulse = Math.round((st.arr + 1) * +v / 100);
      syncInputs(null); refresh(); return;
    }
    const qb = e.target.closest('[data-q]');
    if(qb){ answer(+qb.dataset.q); return; }
    if(e.target.closest('#ctHint')){ hint(); return; }
    if(e.target.closest('#ctReset')){ reset(); return; }
    const t = e.target.closest('[data-talk]');
    if(t && !e.target.closest('select, input')) knight(t.dataset.talk);
  });

  function drawWave(){
    const w = cv.clientWidth, h = 170;
    if(!w) return;
    const dpr = window.devicePixelRatio || 1;
    if(cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const n = 3, x0 = 42, pw = (w - x0 - 8) / n, top = 24, base = 82, yH = 114, yL = 154;
    const steps = st.arr + 1, duty = Math.min(1, st.pulse / steps), yP = base - duty * (base - top);
    const dot = (x, y) => { g.beginPath(); g.arc(x, y, 4.5, 0, 6.2832); g.fill(); };
    g.lineJoin = 'round'; g.font = '11px JetBrains Mono, monospace'; g.textAlign = 'left';
    g.fillStyle = '#6b7280'; g.fillText('CNT', 4, top + 4); g.fillText('PWM', 4, yH + 4);

    g.lineWidth = 2; g.strokeStyle = '#e79a54'; g.beginPath();
    for(let i = 0; i < n; i++){ const x = x0 + i * pw; g.moveTo(x, base); g.lineTo(x + pw, top); g.lineTo(x + pw, base); }
    g.stroke();
    g.fillStyle = '#e79a54'; g.fillText('ARR=' + st.arr, x0 + 4, top - 8);

    g.setLineDash([5, 4]); g.lineWidth = 1.5; g.strokeStyle = '#d4af37'; g.beginPath(); g.moveTo(x0, yP); g.lineTo(x0 + n * pw, yP); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#d4af37'; g.textAlign = 'right'; g.fillText('Pulse=' + st.pulse, w - 10, Math.max(yP - 5, top - 8)); g.textAlign = 'left';

    g.lineWidth = 2; g.strokeStyle = '#57d8a3'; g.beginPath();
    if(duty >= 1){ g.moveTo(x0, yH); g.lineTo(x0 + n * pw, yH); }
    else {
      g.moveTo(x0, yL);
      for(let i = 0; i < n; i++){
        const x = x0 + i * pw, xe = x + duty * pw;
        if(duty > 0){ g.lineTo(x, yH); g.lineTo(xe, yH); g.lineTo(xe, yL); }
        g.lineTo(x + pw, yL);
      }
    }
    g.stroke();

    const phase = (tp / revT) % n, fr = phase % 1, xc = x0 + phase * pw, hi = Math.floor(fr * steps) < st.pulse;
    g.lineWidth = 1; g.strokeStyle = 'rgba(232,226,208,.25)'; g.beginPath(); g.moveTo(xc, top - 4); g.lineTo(xc, yL + 6); g.stroke();
    g.fillStyle = '#e79a54'; dot(xc, base - fr * (base - top));
    g.fillStyle = hi ? '#57d8a3' : '#6b7280'; dot(xc, hi ? yH : yL);
  }

  const BUS_TAU = 8, BUS_HI = .75;
  const busQ = f => {
    const e = Math.exp(-500 / f / BUS_TAU), hi = .5 + (1 - e) / (1 + e) / 2;
    return { hi, ok: hi >= BUS_HI };
  };

  function paintLab(){
    const c = clocks(), f = c.p1, qv = busQ(f), ok = qv.ok, pc = ctNum(qv.hi * 100);
    q('#ctBusR').innerHTML = (ok
      ? `<div>باسِ APB1 با <b>${ctHz(f * 1e6)}</b> می‌چرخد؛ موجِ واقعی (سبز) به ${ctFa(pc)}٪ ولتاژ می‌رسد و از خطِ HIGH (۷۵٪) بالاتر است ⇒ همه‌ی قطعاتِ APB1 درست کار می‌کنند.</div>`
      : `<div>⚠️ باسِ APB1 با <b>${ctHz(f * 1e6)}</b> می‌چرخد؛ سیمِ داخلی فرصتِ پر شدن ندارد و موج فقط به ${ctFa(pc)}٪ ولتاژ می‌رسد، کمتر از خطِ HIGH (۷۵٪) ⇒ گیرنده بیت‌ها را اشتباه می‌خواند. برای همین باید APB1 را روی ÷۲ بگذاری.</div>`)
      + '<div style="color:#8b93a3;font-size:11.5px">مدلِ ساده‌شده برای فهمیدنِ ماجراست؛ عددهای واقعیِ دیتاشیت فرق دارند، ولی سقفِ ۳۶ مگاهرتزِ APB1 واقعی است.</div>';
    const junk = '#?@%&§¿▒', bad = (s, n) => [...s].map((ch, i) => junk[(i * 3 + n) % junk.length]).join('');
    const dev = (key, name, desc, good, fail) => `<div class="ct-dev${ok ? '' : ' bad'}" data-talk="${key}"><b>${name}</b><span>${desc}</span><code dir="ltr">${ok ? good : fail}</code><i>${ok ? '✔' : '✖'}</i></div>`;
    q('#ctDevs').innerHTML = dev('uart', 'UART2', 'ارسالِ متن به کامپیوتر', 'Hello', bad('Hello', Math.round(f)))
      + dev('i2c', 'I2C', 'خواندنِ سنسور', 'ACK · 24°C', 'NACK · ---')
      + dev('can', 'CAN', 'شبکه‌ی خودرو', 'Frame OK', 'CRC Error');
  }

  function drawBus(){
    const cb = q('#ctBus'), w = cb.clientWidth, h = 170;
    if(!w) return;
    const dpr = window.devicePixelRatio || 1, gx = cb.getContext('2d');
    if(cb.width !== Math.round(w * dpr) || cb.height !== Math.round(h * dpr)){ cb.width = Math.round(w * dpr); cb.height = Math.round(h * dpr); }
    gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, w, h);
    const f = clocks().p1, T = 1000 / f, ok = busQ(f).ok, x0 = 46, x1 = w - 10, top = 22, bot = 142;
    const X = u => x0 + u / (4 * T) * (x1 - x0), Y = v => bot - v * (bot - top);
    const tgt = t => (t % T) < T / 2 ? 1 : 0, off = ((tp * .25) % 1) * T, tw = 6 * T + off;
    const col = ok ? '#57d8a3' : '#ff6b6b';
    gx.font = '11px JetBrains Mono, monospace'; gx.textAlign = 'left';
    gx.fillStyle = '#6b7280'; gx.fillText('VDD', 6, top + 4); gx.fillText('0 V', 6, bot + 4);
    [[BUS_HI, 'HIGH 75%'], [1 - BUS_HI, 'LOW 25%']].forEach(([v, lab]) => {
      gx.setLineDash([4, 4]); gx.lineWidth = 1; gx.strokeStyle = '#d4af37'; gx.beginPath(); gx.moveTo(x0, Y(v)); gx.lineTo(x1, Y(v)); gx.stroke(); gx.setLineDash([]);
      gx.fillStyle = '#d4af37'; gx.fillText(lab, x0 + 4, Y(v) - 4);
    });
    gx.lineWidth = 1.5; gx.strokeStyle = '#6b7280'; gx.setLineDash([5, 4]); gx.beginPath();
    for(let t = tw; t <= tw + 4 * T + 1e-9; t += T / 2){ const u = t - tw, v = tgt(t + 1e-6); gx.lineTo(X(u), Y(v)); gx.lineTo(X(Math.min(u + T / 2, 4 * T)), Y(v)); }
    gx.stroke(); gx.setLineDash([]);
    const dt = T / 60, k = 1 - Math.exp(-dt / BUS_TAU);
    let v = .5; gx.lineWidth = 2.6; gx.strokeStyle = col; gx.beginPath();
    for(let t = 0; t <= tw + 4 * T; t += dt){
      v += (tgt(t) - v) * k;
      if(t >= tw){ const px = X(t - tw), py = Y(v); t - tw < dt ? gx.moveTo(px, py) : gx.lineTo(px, py); }
    }
    gx.stroke();
    gx.fillStyle = col; gx.textAlign = 'right'; gx.fillText(`${f.toFixed(0)} MHz ${ok ? 'OK' : 'ERROR'}`, w - 10, 14);
  }

  function drawPw(){
    const cp = q('#ctPw'), w = cp.clientWidth, h = 170;
    if(!w) return;
    const dpr = window.devicePixelRatio || 1, gx = cp.getContext('2d');
    if(cp.width !== Math.round(w * dpr) || cp.height !== Math.round(h * dpr)){ cp.width = Math.round(w * dpr); cp.height = Math.round(h * dpr); }
    gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, w, h);
    const steps = st.arr + 1, duty = Math.min(1, st.pulse / steps), x0 = 44, pw = (w - x0 - 10) / 2, yH = 46, yL = 110, xe = x0 + duty * pw;
    const fr = (tp / revT) % 1, cnt = Math.min(steps - 1, Math.floor(fr * steps)), ph = steps <= 64 ? (cnt + .5) / steps : fr, hi = cnt < st.pulse;
    gx.font = '11px JetBrains Mono, monospace'; gx.textAlign = 'left';
    gx.fillStyle = '#6b7280'; gx.fillText('HIGH', 4, yH + 4); gx.fillText('LOW', 4, yL + 4);
    gx.setLineDash([4, 4]); gx.lineWidth = 1; gx.strokeStyle = '#4a5163';
    [0, 1, 2].forEach(i => { gx.beginPath(); gx.moveTo(x0 + i * pw, yH - 16); gx.lineTo(x0 + i * pw, yL + 14); gx.stroke(); });
    if(duty > 0 && duty < 1){ gx.strokeStyle = '#d4af37'; gx.beginPath(); gx.moveTo(xe, yH - 16); gx.lineTo(xe, yL + 14); gx.stroke(); }
    gx.setLineDash([]);
    for(let i = 0; i < 2; i++){
      const xs = x0 + i * pw;
      if(duty > 0){ gx.fillStyle = 'rgba(87,216,163,.16)'; gx.fillRect(xs, yH, duty * pw, yL - yH); }
      gx.lineWidth = 3; gx.lineJoin = 'round'; gx.strokeStyle = '#57d8a3'; gx.beginPath();
      if(duty >= 1){ gx.moveTo(xs, yH); gx.lineTo(xs + pw, yH); }
      else { gx.moveTo(xs, yL); if(duty > 0){ gx.lineTo(xs, yH); gx.lineTo(xs + duty * pw, yH); gx.lineTo(xs + duty * pw, yL); } gx.lineTo(xs + pw, yL); }
      gx.stroke();
    }
    gx.textAlign = 'center';
    if(duty > 0 && duty < 1){ gx.fillStyle = '#d4af37'; gx.fillText('Pulse=' + st.pulse, xe, yH - 22); }
    gx.fillStyle = '#8b93a5'; gx.fillText('1 period', x0 + pw / 2, yL + 32);
    gx.fillStyle = '#57d8a3'; gx.fillText('Duty ' + Math.round(duty * 100) + '%', x0 + pw * 1.5, yL + 32);
    [[0, 1], [1, .35]].forEach(([i, a]) => {
      const xc = x0 + (i + ph) * pw;
      gx.globalAlpha = a; gx.lineWidth = 1.5; gx.strokeStyle = '#e8e2d0'; gx.beginPath(); gx.moveTo(xc, yH - 16); gx.lineTo(xc, yL + 14); gx.stroke();
      gx.fillStyle = hi ? '#57d8a3' : '#9aa3b5'; gx.beginPath(); gx.arc(xc, hi ? yH : yL, 5, 0, 6.2832); gx.fill();
      gx.globalAlpha = 1;
    });
  }

  /* هنگامِ اسکرول (صفحه یا نوارِ افقیِ چرخ‌دنده‌ها) انیمیشن‌ها می‌ایستند تا اسکرول روان بماند؛
     ۱۵۰ میلی‌ثانیه بعد از آخرین رویدادِ اسکرول دوباره ادامه می‌دهند. capture=true چون رویدادِ scroll حباب نمی‌کند. */
  let scrolling = false, scrollT = 0;
  const onScroll = () => {
    scrolling = true;
    clearTimeout(scrollT);
    scrollT = setTimeout(() => { scrolling = false; }, 150);
  };
  window.addEventListener('scroll', onScroll, { passive: true, capture: true, signal: ac.signal });
  container.addEventListener('wheel', onScroll, { passive: true, signal: ac.signal });
  container.addEventListener('touchmove', onScroll, { passive: true, signal: ac.signal });

  function frame(ts){
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(.05, (ts - last) / 1000) : 0;
    last = ts;
    if(scrolling) return;
    spin(dt);
    drawWave();
    drawBus();
    drawPw();
  }

  reset();
  if(alreadyDone) say('2', 'success', '✅ قبلاً این مأموریت را کامل کرده‌ای. اگر دوست داری دوباره با منوها و اسلایدرها بازی کن.');
  raf = requestAnimationFrame(frame);
  return { stop(){ ac.abort(); cancelAnimationFrame(raf); clearTimeout(scrollT); closePop(); } };
}
