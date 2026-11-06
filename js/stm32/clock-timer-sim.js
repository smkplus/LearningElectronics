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
const CT_INIT = { src: 0, pll: 2, a1: 1, a2: 1, psc: 0, arr: 15, pulse: 8, dlD: 500 };
const ctPllIn = s => s.src ? CT_HSE / 2 : CT_HSE;
const CT_FINISH = '🏆 تمام شد! کلاکِ چیپ ۷۲ مگاهرتز است، کلاکِ تایمر هم با قانونِ ×۲ دوباره ۷۲ می‌شود، و تایمر با Prescaler و Period و Pulse یک PWM ساخت که سرعتِ موتور را تنظیم می‌کند.';

const CT_TALK = {
  hsi:   'HSI اسیلاتورِ RC داخلیِ خودِ چیپ است (۸ مگاهرتز): کریستالِ بیرونی نمی‌خواهد ولی کم‌دقت‌تر است، و چیپ بعد از ریست با همین بالا می‌آید. وقتی HSI وارد PLL می‌شود اول ÷۲ می‌شود (۴ مگاهرتز)؛ برای همین با HSI به ۷۲ مگاهرتز نمی‌رسی (سقفِ واقعی ۴ × ۱۶ = ۶۴). با ✎ می‌توانی دوباره HSE را انتخاب کنی.',
  hdiv:  'این چرخ‌دنده‌ی ÷۲ فقط برای HSI لازم است: در مسیرِ PLL، کلاکِ HSI همیشه نصف می‌شود (۸ ÷ ۲ = ۴ مگاهرتز) و بعد وارد PLL می‌شود. کریستالِ HSE این چرخ‌دنده را ندارد و مستقیم وارد PLL می‌شود؛ برای همین با HSE می‌شود به ۷۲ رسید.',
  warn_hsi: '❗ با HSI فقط ۴ مگاهرتز (۸ ÷ ۲) وارد PLL می‌شود و حتی با ×۹ فقط ۳۶ مگاهرتز می‌گیری. برای ۷۲ مگاهرتز با ✎ منبع را روی HSE بگذار.',
  hse:   'با ✎ می‌توانی منبعِ کلاک را بینِ HSE و HSI عوض کنی. چرخ‌دنده‌ی کریستال: آرام و ثابت با ۸ مگاهرتز می‌چرخد. همه‌ی ضربان‌های چیپ از همین‌جا شروع می‌شوند.',
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
  warn_pll: '❗ این را روی ×۹ بگذار تا SYSCLK بشود ۷۲ مگاهرتز (۸ × ۹)؛ کریستالِ ۸ مگاهرتزی برای یک ARM کُند است و PLL آن را تند می‌کند.',
  warn_a1:  '❗ این را روی ÷۲ بگذار، چون باسِ APB1 بیش از ۳۶ مگاهرتز تحمل ندارد. تایمرهای این باس هم با قانونِ ×۲ دوباره ۷۲ می‌گیرند.',
  warn_a2:  '❗ این را روی ÷۱ بگذار، چون APB2 تا ۷۲ مگاهرتز تحمل دارد و تایمرِ TIM1 باید با ۷۲ کار کند.',
  psc:   'Prescaler یک چرخ‌دنده‌ی تقسیم‌کننده است: کلاکِ تایمر را بر (PSC+۱) تقسیم می‌کند تا عقربه‌ی شمارنده آهسته‌تر بشمرد. در CubeMX عدد PSC = ۸ یعنی تقسیم بر ۹؛ همیشه یکی بیشتر.',
  busq:  'خط‌چینِ خاکستری موجِ ایده‌آلِ کلاکِ باسِ APB1 است و خطِ رنگی آن چیزی که سیمِ واقعیِ داخلِ چیپ می‌سازد: سیم مثل یک خازنِ کوچک است و هر نیم‌دوره باید پر یا خالی شود. اگر کلاک آن‌قدر تند باشد که فرصتِ پر شدن نباشد، موج به خطِ HIGH (۷۵٪) نمی‌رسد و گیرنده بیت را اشتباه می‌خواند. (مدلِ ساده‌شده برای فهمیدنِ ماجرا)',
  uart:  'UART2 روی APB1 است و برای فرستادنِ متن (مثلاً به کامپیوتر) به کار می‌رود. با کلاکِ بیش از حد، بیت‌ها خراب می‌شوند و به‌جای متنِ درست، علامت‌های بی‌معنی می‌رسد.',
  i2c:   'I2C هم روی APB1 است و برای حرف زدن با سنسورها و نمایشگرها به کار می‌رود. با کلاکِ بیش از حد، سنسور «ACK» نمی‌دهد و ارتباط قطع می‌شود.',
  can:   'CAN شبکه‌ی ارتباطیِ خودرو و صنعت است و روی APB1 نشسته. بیتِ خراب یعنی فریمِ خطادار (CRC Error) و دورریخته شدنِ پیام.',
  wave:  'این موجِ پینِ خروجی (PA8) است. هر دورِ عقربه یک دوره‌ی موج است: تا وقتی عقربه روی کمانِ سبز است موج بالاست (HIGH) و بعدش پایین (LOW). خطِ زردِ Pulse جایی است که موج می‌افتد؛ هرچه Pulse بزرگ‌تر، بخشِ بالا پهن‌تر و موتور تندتر.',
  tick:  'این سرعتِ شمارشِ عقربه‌ی تایمر است: کلاکِ تایمر ÷ (PSC+۱). با هر ضربه عقربه یک خانه جلو می‌رود.',
  arr:   'Period (یا ARR) تعدادِ خانه‌های صفحه است: ARR+۱ خانه. عقربه از ۰ می‌رود تا ARR و دوباره به ۰ برمی‌گردد. یک دورِ کامل = یک دوره‌ی PWM.',
  pulse: 'Pulse (یا CCR) اندازه‌ی کمانِ سبز است. تا وقتی عقربه روی کمانِ سبز است پین روشن (HIGH) می‌ماند و بعدش خاموش. کمانِ بزرگ‌تر یعنی موتور بیشتر برق می‌گیرد و تندتر می‌چرخد.',
  lamp:  'این چراغ همان پایه‌ی خروجیِ PWM است (PA8): وقتی عقربه روی کمانِ سبز است روشن می‌شود و بعدش خاموش.',
  dly:   'این ردیف برنامه‌ای است که با delay نوشته شده: LED را عوض می‌کند و بعد مدتِ طولانی «گیر» می‌کند (قرمز). فقط در یک لحظه‌ی خیلی کوتاه (سبز) سرکی به دکمه می‌کشد. هر دکمه‌ای که وسطِ قرمز بخورد گم می‌شود.',
  dlt:   'این ردیف با تایمر است: سخت‌افزارِ تایمر خودش زمان را می‌شمارد و CPU فقط یک نگاهِ کوتاه به عددِ شمارنده می‌اندازد. وقتی به ۵۰۰ رسید (خطِ طلایی) LED را عوض می‌کند. بقیه‌ی وقت CPU آزاد است و هر دکمه‌ای را همان لحظه می‌بیند.',
  car:   'این ماشین نمونه‌ی موتور است: چرخ‌هایش با دیوتیِ PWM تند و کُند می‌چرخند. برای چرخیدنِ موتور سه خط لازم است: MX_TIM1_Init (که CubeMX می‌نویسد)، HAL_TIM_PWM_Start و __HAL_TIM_SET_COMPARE. هر کدام را کامنت کنی موتور نمی‌چرخد.'
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
    nodes.push({ it, cx: x, cy: 0, par: i - 1, phi: 0, lane: 0 });
  });
  const hi = nodes.length - 1, hub = nodes[hi];
  branches.forEach(b => { lane = Math.min(lane, rOf(hub.it) + rOf(b[0]) - 6); });
  /* شاخه‌ها از گامِ ۲ به بعد کمی از هم دور می‌شوند (زاویه‌ی alpha) تا چرخ‌دنده‌های بزرگِ دو شاخه (مثلاً PSC) روی هم نیفتند */
  const placeBranches = alpha => {
    const out = [];
    branches.forEach((b, bi) => {
      const sg = bi ? 1 : -1, dy0 = sg * lane, d0 = rOf(hub.it) + rOf(b[0]);
      let bx = hub.cx + Math.sqrt(d0 * d0 - dy0 * dy0), by = dy0;
      b.forEach((it, i) => {
        let phi;
        if(i){
          phi = i >= 2 ? sg * alpha : 0;
          const d = rOf(b[i - 1]) + rOf(it);
          bx += d * Math.cos(phi); by += d * Math.sin(phi);
        } else phi = Math.atan2(dy0, bx - hub.cx);
        out.push({ it, cx: bx, cy: by, par: i ? nodes.length + out.length - 1 : hi, phi, side: i ? '' : (bi ? 'down' : 'up'), lane: sg });
      });
    });
    return out;
  };
  const clash = arr => {
    const up = arr.filter(n => n.lane < 0), dn = arr.filter(n => n.lane > 0);
    return up.some(a => dn.some(c => Math.hypot(a.cx - c.cx, a.cy - c.cy) < rOf(a.it) + rOf(c.it) + 6));
  };
  let alpha = 0, placed = placeBranches(0);
  while(nb > 1 && clash(placed) && alpha < .8){ alpha += .04; placed = placeBranches(alpha); }
  nodes.push(...placed);
  const UL = 11;
  const ext = nodes.map(({ it, cx, cy, lane }) => {
    const ro = gearOf(it.T).ro, isN = it.t === 'n', n = isN ? useOf(it).length : 0, extra = n ? n * UL + 8 : 0;
    return { top: cy - ro - (isN ? 2 + (lane < 0 ? extra + 6 : 0) : 28), bot: cy + ro + (isN ? (it.final ? 18 : 2) + (lane < 0 ? 0 : extra) : 28), right: cx + ro };
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
  const HALO = 'stroke:#141924;stroke-width:3px;paint-order:stroke;stroke-linejoin:round';
  const usesSvg = (it, cx, cy, ro, up) => {
    const L = useOf(it), n = L.length, col = it.bad ? '#ff8a80' : '#c9d0de';
    return L.map((u, j) => tx(cx, up ? cy - ro - 10 - (n - 1 - j) * UL : cy + ro + (it.final ? 23 : 18) + j * UL, u, 10, '',
      `style="fill:${col};font-size:10px;font-weight:600;${HALO};${it.usesLtr || /^[\x00-\x7F·✖ ]+$/.test(u) ? 'direction:ltr;unicode-bidi:bidi-override' : 'direction:rtl;unicode-bidi:embed'}"`)).join('');
  };
  nodes.forEach(({ it, cx, cy, side, lane }) => {
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
        + (it.final ? tx(cx, cy + g.ro + 11, '✔ فرکانس نهایی', 9.5, col, 'font-weight="700"') : '')
        + usesSvg(it, cx, cy, g.ro, lane < 0) + '</g>';
    } else {
      const eq = `${ctNum(it.inM)} ${it.sym} ${ctFa(it.n)} = ${ctNum(it.outM)}`, sd = side || (g.ro > 44 && lane ? (lane < 0 ? 'up' : 'down') : '');
      out += `<g data-talk="${it.key}" text-anchor="middle">` + at
        + `<g class="ct-g ${it.cls}${it.bad ? ' bad' : ''}"><path d="${g.d}"/>${holes(5, (HO + g.ri) / 2, 1.6)}</g>`
        + `<circle class="ct-gh" r="${HO}"/><text class="ct-gtx" y="${f1(HO * .3)}" font-size="${Math.round(Math.min(13, HO * 1.05))}" ${LTR}>${it.sym}${ctFa(it.n)}</text></g>`
        + tx(cx, sd === 'up' ? cy - g.ro - 17 : sd === 'down' ? cy + g.ro + 24 : cy - g.ro - 9, it.name, 10, '#e8e2d0', `font-weight="700" style="${HALO}"`)
        + tx(cx, sd === 'up' ? cy - g.ro - 5 : cy + g.ro + 12, eq, 9.5, it.bad ? '#ff6b6b' : '#e8e2d0', `style="direction:ltr;unicode-bidi:bidi-override;${HALO}"`) + '</g>';
    }
  });

  nodes.forEach(({ it, cx, cy }) => {
    if(!it.edit) return;
    const o = gearOf(it.T).ro * .72;
    out += `<g data-edit="${it.edit}"${it.warn ? ` data-warn="${it.warn}"` : ''} text-anchor="middle" transform="translate(${f1(cx + o)} ${f1(cy - o)})" style="cursor:pointer"><title>تغییرِ ضریب</title>`
      + `${it.warn
        ? `<circle r="9" fill="#ff6b6b" stroke="#14161c" stroke-width="1.5"><animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite"/></circle><path d="M-3.8 4.2L-3.2 1.2L2.6 -4.6L4.6 -2.6L-1.2 3.2Z" fill="#fff"/>`
        : `<circle r="9" fill="#d4af37" stroke="#14161c" stroke-width="1.5"/><path d="M-3.8 4.2L-3.2 1.2L2.6 -4.6L4.6 -2.6L-1.2 3.2Z" fill="#14161c"/>`}</g>`;
  });
  nodes.forEach(({ it, cx, cy }) => {
    if(!it.warn || it.edit) return;
    const o = gearOf(it.T).ro * .72;
    out += `<g data-talk="${it.warn}" text-anchor="middle" transform="translate(${f1(cx - o)} ${f1(cy - o)})" style="cursor:pointer"><title>نیاز به تنظیم: بزن تا بگویم چطور</title>`
      + `<circle r="9" fill="#ff6b6b" stroke="#14161c" stroke-width="1.5"><animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite"/></circle>`
      + `<text y="4.2" font-size="12" font-weight="800" style="fill:#fff">!</text></g>`;
  });
  svg.setAttribute('viewBox', `0 0 ${VW} ${H}`);
  if(wide) Object.assign(svg.style, { width: '100%', height: 'auto', minWidth: Math.round(VW * .72) + 'px', maxWidth: Math.round(VW * 1.3) + 'px', display: 'block', margin: '0 auto' });
  else Object.assign(svg.style, { maxWidth: Math.round(VW * 1.3) + 'px', display: 'block', margin: '0 auto' });
  svg.innerHTML = out;
  const els = svg.querySelectorAll('.ct-g');
  return { id, svg, geo: nodes.map(n => ({ cx: n.cx, cy: n.cy, r: rOf(n.it) })), gears: nodes.map((n, i) => ({ el: els[i], T: n.it.T, par: n.par, phi: n.phi, ang: 0 })) };
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
  return { svg, ptr: svg.querySelector('[data-ptr]'), cnt: svg.querySelector('[data-cnt]'), lamp: pwm ? svg.querySelector('.ct-lamp') : null };
}

/* انیمیشن‌های کوتاهِ بخش‌های توضیحی (کلاک / تایمر / PWM): SVG با SMIL، بدون نیاز به جاوااسکریپت یا CSS بیرونی */
const ctAnimSvg = (h, body) => `<svg class="ct-anim" viewBox="0 0 320 ${h}" style="display:block;width:100%;max-width:380px;margin:10px auto;background:#10151f;border:1px solid #2a3040;border-radius:12px" aria-hidden="true">${body}</svg>`;
const ctAnimTx = (x, y, s, fill = '#e8e2d0', fs = 10.5, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fs}" font-weight="700" style="fill:${fill};direction:rtl;unicode-bidi:embed">${s}</text>`;
const ctAnimLat = (x, y, s, anchor = 'start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="10" style="fill:#8b93a3;font-family:JetBrains Mono,monospace;direction:ltr;unicode-bidi:bidi-override">${s}</text>`;
const ctSeq = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join(';');
const ctSquare = (x0, pw, n, yH, yL, d = .5) => {
  let d_ = `M${x0} ${yL}`;
  for(let i = 0; i < n; i++){
    const x = x0 + i * pw;
    if(d >= 1) d_ += `L${x} ${yH}L${x + pw} ${yH}`;
    else if(d <= 0) d_ += `L${x + pw} ${yL}`;
    else d_ += `L${x} ${yH}L${x + pw * d} ${yH}L${x + pw * d} ${yL}L${x + pw} ${yL}`;
  }
  return d_;
};
const ctSweep = (x0, y1, y2, dist, dur) => `<g><line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y2}" stroke="#e8e2d0" stroke-opacity=".55"/><animateTransform attributeName="transform" type="translate" values="0 0;${dist} 0" dur="${dur}s" repeatCount="indefinite"/></g>`;

/* کلاک: هر لبه‌ی بالارونده‌ی موج = یک ضربه = چرخ‌دنده یک دندانه جلو می‌رود */
function ctAnimClock(){
  const g = ctTeeth(8, 20), x0 = 116, pw = 24, n = 8, yH = 28, yL = 60;
  return ctAnimSvg(118,
    `<g transform="translate(54 44)"><g><path d="${g.d}" fill="#2a2f3b" stroke="${CT_COL.hse}" stroke-width="2" stroke-linejoin="round"/><circle r="6" fill="#10151f" stroke="${CT_COL.hse}" stroke-width="1.5"/><circle cy="-12" r="2.6" fill="${CT_COL.hse}"/>`
    + `<animateTransform attributeName="transform" type="rotate" values="${ctSeq(n, i => i * 45)}" dur="2s" calcMode="discrete" repeatCount="indefinite"/></g></g>`
    + ctAnimLat(x0 - 8, yH + 4, 'CLK', 'end')
    + `<path d="${ctSquare(x0, pw, n, yH, yL)}" fill="none" stroke="${CT_COL.sys}" stroke-width="2.4" stroke-linejoin="round"/>`
    + ctSweep(x0, yH - 10, yL + 10, n * pw, 2)
    + ctAnimTx(160, 96, 'هر ضربه = یک قدمِ کوچکِ چیپ، مثل یک دندانه‌ی چرخ‌دنده')
    + ctAnimTx(160, 111, '۷۲ مگاهرتز یعنی ۷۲ میلیون ضربه در هر ثانیه', '#8b93a3', 10));
}

/* تایمر: عقربه با هر ضربه یک خانه جلو می‌رود و بعد از آخرین خانه به ۰ برمی‌گردد */
function ctAnimTimer(){
  const n = 8, R = 34, cx = 70, cy = 56, dur = n * .5;
  let tk = '';
  for(let i = 0; i < n; i++){
    const a = i / n * 6.2832, s = Math.sin(a), c = Math.cos(a);
    tk += `<line x1="${(cx + (R + 3) * s).toFixed(1)}" y1="${(cy - (R + 3) * c).toFixed(1)}" x2="${(cx + (R + 9) * s).toFixed(1)}" y2="${(cy - (R + 9) * c).toFixed(1)}" stroke="${i ? '#6b7280' : CT_COL.tim}" stroke-width="${i ? 2 : 3}" stroke-linecap="round"/>`;
  }
  const nums = Array.from({ length: n }, (_, i) => `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="20" font-weight="700" visibility="hidden" style="fill:#e8e2d0">${ctFa(i)}<animate attributeName="visibility" values="${ctSeq(n, j => j === i ? 'visible' : 'hidden')}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/></text>`).join('');
  return ctAnimSvg(112,
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#2a3040" stroke-width="2"/>${tk}`
    + `<g transform="translate(${cx} ${cy})"><g><line y1="-17" y2="${-(R - 4)}" stroke="${CT_COL.tim}" stroke-width="3" stroke-linecap="round"/><circle cy="${-(R - 4)}" r="4.5" fill="${CT_COL.tim}"/>`
    + `<animateTransform attributeName="transform" type="rotate" values="${ctSeq(n, i => i * 45)}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/></g></g>`
    + `<circle cx="${cx}" cy="${cy}" r="16" fill="#10151f" stroke="#2a3040" stroke-width="1.5"/>${nums}`
    + ctAnimTx(224, 40, 'هر ضربه ⇒ عقربه یک خانه جلو')
    + ctAnimTx(224, 62, 'به آخرین خانه رسید ⇒ برمی‌گردد به ۰')
    + ctAnimTx(224, 84, 'سخت‌افزار می‌شمارد و CPU آزاد است', '#8b93a3', 10));
}

/* PWM: پین بالا/پایین می‌شود، چراغ هم‌زمان روشن/خاموش، و میانگین = نصف */
function ctAnimPwm(d = .5){
  const x0 = 100, pw = 68, n = 3, yH = 26, yL = 62, dur = 6, pct = Math.round(d * 100);
  let vals, keys;
  if(d >= 1){ vals = '1;1'; keys = '0;1'; }
  else if(d <= 0){ vals = '.12;.12'; keys = '0;1'; }
  else {
    vals = Array.from({ length: n }, () => '1;.12').join(';');
    keys = Array.from({ length: n }, (_, i) => `${(i / n).toFixed(4)};${((i + d) / n).toFixed(4)}`).join(';');
  }
  return ctAnimSvg(128,
    `<circle cx="44" cy="44" r="16" fill="#1d2330" stroke="#3a4050" stroke-width="2"/>`
    + `<circle cx="44" cy="44" r="16" fill="${CT_COL.sys}" opacity="1"><animate attributeName="opacity" values="${vals}" keyTimes="${keys}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/></circle>`
    + ctAnimLat(44, 76, 'PA8', 'middle')
    + ctAnimLat(x0 - 8, yH + 4, 'HIGH', 'end') + ctAnimLat(x0 - 8, yL + 4, 'LOW', 'end')
    + `<path d="${ctSquare(x0, pw, n, yH, yL, d)}" fill="none" stroke="${CT_COL.sys}" stroke-width="2.4" stroke-linejoin="round"/>`
    + ctSweep(x0, yH - 10, yL + 10, n * pw, dur)
    + ctAnimTx(160, 100, `میانگین ${ctFa(pct)}٪`, '#e8e2d0', 11)
    + ctAnimTx(160, 120, 'روشن و خاموشِ خیلی سریع ⇒ موتور فقط «میانگین» را حس می‌کند', '#8b93a3', 10));
}
/* PWM با لغزنده: دیوتی را کم و زیاد کن */
function ctAnimPwmBox(){
  return `<div id="ctPwmA">${ctAnimPwm(.5)}</div>`
    + `<div class="ll-row" style="align-items:center;justify-content:center;gap:10px;margin:0 0 10px"><span style="font-size:12px;color:#8b93a3">زیاد</span>`
    + `<input type="range" dir="ltr" id="ctPwmS" min="0" max="100" step="5" value="50" style="width:200px"><span style="font-size:12px;color:#8b93a3">کم</span></div>`;
}

/* ===== UART و I2C و CAN: سه انیمیشنِ کوچکِ SMIL + کارتِ توضیح (برای قطعه‌های روی APB1) ===== */
/* نقطه‌ای که فقط در بازه‌ی [a,b] از چرخه روی مسیر حرکت می‌کند و بقیه‌ی وقت پنهان است */
const ctPulse = (path, col, dur, a, b, r = 3.6) => `<circle r="${r}" fill="${col}" opacity="0"><animateMotion dur="${dur}s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1" path="${path}"/>`
  + `<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;${a};${b};1" calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/></circle>`;
/* محتوا فقط وقتی دیده می‌شود که چرخه در یکی از بازه‌ها باشد؛ vals مثلِ «visible;hidden;hidden» و keys مثلِ «0;.5;1» */
const ctShowWhen = (body, vals, keys, dur) => `<g visibility="hidden">${body}<animate attributeName="visibility" values="${vals}" keyTimes="${keys}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/></g>`;
const ctGlow = (x, y, w, h, col, vals, keys, dur) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="none" stroke="${col}" stroke-width="3" opacity="0"><animate attributeName="opacity" values="${vals}" keyTimes="${keys}" calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/></rect>`;
const ctWire = (d, col, o = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${o}/>`;

/* UART: دو سیمِ جدا (TX و RX) بدونِ سیمِ کلاک؛ هر بایت = بیتِ شروع + ۸ بیتِ داده + بیتِ پایان */
function ctAnimUart(){
  const C = CT_COL, x0 = 14, bw = 28, yH = 96, yL = 124, seq = [0, 0, 0, 0, 1, 0, 0, 1, 0, 1];   // Start + حرفِ H (0x48، اول کم‌ارزش‌ترین بیت) + Stop
  let d = `M4 ${yH}H${x0}`, cur = 1;
  seq.forEach((b, i) => { const x = x0 + i * bw; if(b !== cur) d += `V${b ? yH : yL}`; d += `H${x + bw}`; cur = b; });
  d += `H${x0 + seq.length * bw + 14}`;
  const labels = seq.map((b, i) => ctLatTx(x0 + i * bw + bw / 2, 142, i === 0 ? 'Start' : i === 9 ? 'Stop' : String(b), i === 0 || i === 9 ? 8 : 10.5, i === 0 || i === 9 ? C.hse : '#8b93a3')).join('');
  return ctAnimSvg(180,
    ctClkChip(4, 8, 74, 48, ['STM32', 'UART2'], C.sys, 1) + ctClkChip(242, 8, 74, 48, ['PC', 'USB-Serial'], C.pclk, 1)
    + ctWire('M78 22H242', '#4a5163') + ctWire('M242 36H78', '#4a5163') + ctWire('M78 50H242', '#3a4050', 'stroke-dasharray="4 4"')
    + ctAnimLat(84, 19, 'TX') + ctAnimLat(236, 19, 'RX', 'end') + ctAnimLat(84, 33, 'RX') + ctAnimLat(236, 33, 'TX', 'end') + ctLatTx(160, 47, 'GND', 8, '#6b7280')
    + ctClkDots('M80 22H240', 3, 2.4, C.sys) + ctClkDots('M240 36H80', 2, 3.4, C.tim)
    + ctAnimLat(4, yH - 14, 'TX')
    + `<path d="${d}" fill="none" stroke="${C.sys}" stroke-width="2.4" stroke-linejoin="round"/>` + ctSweep(x0, yH - 10, yL + 10, seq.length * bw, 3.6)
    + labels
    + `<path d="M${x0 + bw + 2} 153H${x0 + 9 * bw - 2}" stroke="#4a5163" stroke-width="1.4"/>` + ctAnimTx(x0 + 5 * bw, 166, '۸ بیتِ داده (اینجا حرفِ H)', '#e8e2d0', 9.5)
    + ctAnimTx(160, 78, 'سیمِ کلاک ندارد؛ دو طرف از قبل روی یک سرعت (Baud) توافق کرده‌اند', '#8b93a3', 9));
}

/* I2C: دو سیمِ مشترکِ SDA و SCL برای همه؛ مستر آدرس می‌فرستد و فقط قطعه‌ی صاحبِ آدرس ACK می‌دهد */
function ctAnimI2c(){
  const C = CT_COL, T = 4, rev = 'M156 96V50H64';
  const stub = (x, y1, y2, col) => ctWire(`M${x} ${y1}V${y2}`, col) + `<circle cx="${x}" cy="${y1}" r="2.4" fill="${col}"/>`;
  return ctAnimSvg(184,
    `<path d="M64 34H296" fill="none" stroke="${C.hse}" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"><animate attributeName="stroke-dashoffset" values="12;0" dur=".7s" repeatCount="indefinite"/></path>`
    + ctWire('M64 50H308', C.pclk)
    + ctWire('M296 34V22', C.hse) + ctWire('M308 50V22', C.pclk)
    + `<rect x="292.5" y="13" width="7" height="11" rx="1.5" fill="#161c28" stroke="#8b93a3"/><rect x="304.5" y="13" width="7" height="11" rx="1.5" fill="#161c28" stroke="#8b93a3"/>`
    + `<path d="M288 9H316" stroke="#8b93a3" stroke-width="2"/>` + ctLatTx(274, 12, 'VCC', 8, '#8b93a3')
    + ctClkChip(4, 18, 60, 44, ['MCU', 'Master'], C.sys, 1)
    + ctAnimLat(70, 30, 'SCL') + ctAnimLat(70, 46, 'SDA')
    + stub(116, 34, 96, C.hse) + stub(156, 50, 96, C.pclk) + stub(224, 34, 96, C.hse) + stub(264, 50, 96, C.pclk)
    + ctClkChip(96, 96, 80, 34, ['Sensor', '0x48'], C.pclk, 1) + ctClkChip(204, 96, 80, 34, ['OLED', '0x3C'], '#3a4050')
    + ctGlow(96, 96, 80, 34, C.sys, '0;1;1', '0;.5;1', T)
    + ctPulse('M64 50H156V96', C.tim, T, .02, .46, 4) + ctPulse(rev, C.sys, T, .54, .98, 4)
    + ctShowWhen(ctAnimTx(160, 152, 'مستر: «چه کسی آدرس 0x48 دارد؟»', C.tim, 10.5), 'visible;hidden;hidden', '0;.5;1', T)
    + ctShowWhen(ctAnimTx(160, 152, 'سنسور: «منم!» (ACK) ← فقط همین قطعه جواب می‌دهد', C.sys, 10.5), 'hidden;visible;visible', '0;.5;1', T)
    + ctAnimTx(160, 172, 'همه روی همان دو سیم‌اند؛ هر قطعه یک آدرس دارد', '#8b93a3', 9.5));
}

/* CAN: جفت‌سیمِ پیچ‌خورده (CAN_H و CAN_L)؛ پیام شناسه دارد، آدرسِ مقصد ندارد و همه می‌شنوند */
function ctAnimCan(){
  const C = CT_COL, T = 3, sx = 160;
  const node = (cx, name) => ctClkChip(cx - 40, 92, 80, 38, [name, 'ECU'], '#3a4050');
  const stubs = cx => ctWire(`M${cx - 6} 92V46`, C.hse) + ctWire(`M${cx + 6} 92V58`, C.pclk) + `<circle cx="${cx - 6}" cy="46" r="2.4" fill="${C.hse}"/><circle cx="${cx + 6}" cy="58" r="2.4" fill="${C.pclk}"/>`;
  const term = x => `<rect x="${x - 4}" y="47" width="8" height="10" rx="1.5" fill="#161c28" stroke="#8b93a3"/>` + ctWire(`M${x} 46V47`, C.hse) + ctWire(`M${x} 57V58`, C.pclk) + ctLatTx(x, 78, '120Ω', 8.5, '#8b93a3');
  return ctAnimSvg(180,
    ctWire('M24 46H296', C.hse) + ctWire('M24 58H296', C.pclk) + term(24) + term(296)
    + ctLatTx(112, 41, 'CAN_H', 8.5, C.hse) + ctLatTx(112, 70, 'CAN_L', 8.5, C.pclk)
    + stubs(70) + stubs(sx) + stubs(250)
    + node(70, 'موتور') + node(sx, 'ترمز') + node(250, 'داشبورد')
    + ctGlow(sx - 40, 92, 80, 38, C.tim, '1;0;0', '0;.45;1', T) + ctGlow(30, 92, 80, 38, C.sys, '0;1;1', '0;.45;1', T) + ctGlow(210, 92, 80, 38, C.sys, '0;1;1', '0;.45;1', T)
    + ctPulse(`M${sx - 6} 92V46H24`, C.hse, T, .02, .46) + ctPulse(`M${sx - 6} 92V46H296`, C.hse, T, .02, .46)
    + ctPulse(`M${sx + 6} 92V58H24`, C.pclk, T, .02, .46) + ctPulse(`M${sx + 6} 92V58H296`, C.pclk, T, .02, .46)
    + ctLatTx(sx, 33, 'ID = 0x100', 9.5, C.tim)
    + ctAnimTx(160, 150, 'پیام «برای همه» پخش می‌شود؛ هر ECU خودش فیلتر می‌کند', '#e8e2d0', 10)
    + ctAnimTx(160, 168, 'دو نفر هم‌زمان؟ شناسه‌ی کوچک‌تر (اولویتِ بیشتر) برنده می‌شود', '#8b93a3', 9.5));
}

const ctTerm = (a, e, fa) => `<b>${a}</b> = <span dir="ltr" style="font-family:JetBrains Mono,monospace;font-size:12px;color:#d4af37">${e}</span> — ${fa}`;
function ctProtoView(){
  const blk = (title, svg, txt, terms, real) => `<div class="ct-explain"><b>${title}</b></div>${svg}<div class="hs-p">${txt}</div>`
    + `<div class="ct-explain"><b>📚 اسمِ کامل:</b><br>${terms.map(t => ctTerm(...t)).join('<br>')}</div><div class="ct-explain"><b>🌍 مثال در دنیای واقعی:</b> ${real}</div>`;
  return `<details class="hs-det"><summary>📡 UART و I2C و CAN چه هستند؟ (قطعه‌های روی APB1)</summary>`
    + `<div class="hs-p">این سه، «زبان‌های حرف زدنِ» چیپ با دنیای بیرون‌اند. هر سه روی باسِ APB1 نشسته‌اند و سرعتِ ارتباطشان را از کلاکِ همان باس می‌سازند؛ برای همین اگر PCLK1 را عوض کنی، سرعتِ ارتباط هم عوض می‌شود مگر اینکه دوباره تنظیمش کنی.</div>`
    + blk('① UART: دو نفر، دو سیم، بدونِ کلاک', ctAnimUart(),
      'UART ساده‌ترین راهِ فرستادنِ متن است: یک سیم برای فرستادن (TX) و یک سیم برای گرفتن (RX)، به‌علاوه‌ی زمینِ مشترک. سیمِ کلاک ندارد، پس هیچ‌کس ضربان را به دیگری نمی‌دهد؛ هر دو طرف از قبل روی یک سرعت (Baud rate، مثلاً ۱۱۵۲۰۰) توافق کرده‌اند. سیم در حالتِ استراحت بالاست. هر بایت با یک بیتِ شروع (پایین) شروع می‌شود، بعد ۸ بیتِ داده می‌آید و با یک بیتِ پایان (بالا) تمام می‌شود. اگر سرعت‌ها یکی نباشند، گیرنده بیت‌ها را جابه‌جا می‌خواند و علامت‌های بی‌معنی می‌بیند. UART فقط بینِ دو دستگاه کار می‌کند (نقطه به نقطه).',
      [['UART', 'Universal Asynchronous Receiver/Transmitter', 'فرستنده/گیرنده‌ی سریالِ ناهمگام (ناهمگام یعنی بدونِ سیمِ کلاک)'], ['TX / RX', 'Transmit / Receive', 'سیمِ فرستادن / سیمِ گرفتن؛ TX هر طرف به RXِ طرفِ دیگر می‌رود'], ['Baud rate', 'Baud rate', 'تعدادِ بیت در ثانیه؛ باید در دو طرف یکی باشد']],
      'مثل دو نفر که با واکی‌تاکی حرف می‌زنند و از قبل قرار گذاشته‌اند هر کلمه را با «سلام» شروع کنند و با «تمام» ببندند. در عمل: فرستادنِ متن به کامپیوتر (Serial Monitor)، ماژولِ GPS و بلوتوثِ HC-05.')
    + blk('② I2C: یک مستر، چند قطعه، فقط دو سیمِ مشترک', ctAnimI2c(),
      'در I2C همه‌ی قطعه‌ها روی همان دو سیم نشسته‌اند: SDA (داده) و SCL (کلاک). یک «مستر» (مثلِ STM32) کلاک را می‌دهد و هر قطعه یک آدرسِ ثابت دارد. مستر اول آدرس را می‌فرستد؛ همه می‌شنوند ولی فقط قطعه‌ی صاحبِ آدرس با یک بیتِ «ACK» جواب می‌دهد و بعد داده رد و بدل می‌شود. هر دو سیم با مقاومتِ Pull-up (حدود ۴٫۷ کیلواهم) به برق وصل‌اند و قطعه‌ها فقط آن‌ها را پایین می‌کشند؛ اگر Pull-up نباشد I2C کار نمی‌کند. سرعتِ معمول ۱۰۰ یا ۴۰۰ کیلوهرتز است. چون با دو سیم کلی قطعه را وصل می‌کند، برای سنسور و نمایشگر عالی است.',
      [['I2C', 'Inter-Integrated Circuit', 'ارتباطِ دوسیمه بینِ چیپ‌ها'], ['SDA / SCL', 'Serial Data / Serial Clock', 'سیمِ داده / سیمِ کلاک'], ['ACK', 'Acknowledge', 'تأیید؛ قطعه با آن می‌گوید «شنیدم و منم»'], ['Pull-up', 'Pull-up resistor', 'مقاومتی که سیم را وقتی کسی پایینش نکشیده بالا نگه می‌دارد']],
      'مثل یک خطِ تلفنِ مشترکِ محله: مستر می‌گوید «شماره‌ی ۴۸؟» همه‌ی خانه‌ها می‌شنوند، ولی فقط خانه‌ی ۴۸ گوشی را برمی‌دارد. در عمل: سنسورِ دما و رطوبت، نمایشگرِ OLED، ساعتِ RTC.')
    + blk('③ CAN: شبکه‌ی خودرو، پیام برای همه', ctAnimCan(),
      'CAN یک شبکه‌ی چند نفره روی یک جفت‌سیمِ پیچ‌خورده است: CAN_H و CAN_L. سیگنال «اختلافِ ولتاژِ» این دو سیم است، پس نویزِ موتور و جرقه روی هر دو یک‌جور می‌افتد و خنثی می‌شود؛ برای همین در خودرو و کارخانه محبوب است. پیام‌ها «آدرسِ مقصد» ندارند، «شناسه (ID)» دارند: فرستنده برای همه پخش می‌کند و هر دستگاه خودش تصمیم می‌گیرد این شناسه به کارش می‌آید یا نه. اگر دو دستگاه هم‌زمان بفرستند، شناسه‌ی کوچک‌تر برنده است و پیامِ مهم‌تر بدونِ از دست رفتن می‌رود. دو سرِ باس مقاومتِ ۱۲۰ اهم می‌گذارند تا موج برنگردد. پایه‌های چیپ فقط سطحِ منطقی دارند، پس بینِ چیپ و باس یک تراشه‌ی فرستنده/گیرنده (Transceiver) لازم است.',
      [['CAN', 'Controller Area Network', 'شبکه‌ی ارتباطیِ خودرو و صنعت'], ['ECU', 'Electronic Control Unit', 'واحدِ کنترلِ الکترونیکی؛ هر «مغزِ کوچک» روی باس'], ['ID', 'Identifier', 'شناسه‌ی پیام؛ هرچه کوچک‌تر اولویتش بیشتر'], ['CRC', 'Cyclic Redundancy Check', 'کدِ بررسیِ خطا؛ پیامِ خراب با آن شناسایی و دور ریخته می‌شود']],
      'مثل اتاقِ جلسه: هر کس که حرف می‌زند همه می‌شنوند و هر کس فقط به حرف‌های مربوط به خودش گوش می‌دهد؛ اگر دو نفر هم‌زمان شروع کنند، آن‌که مهم‌تر است ادامه می‌دهد. در عمل: ارتباطِ بینِ موتور، ترمز و داشبوردِ ماشین.')
    + `</details>`;
}

/* رنگ‌آمیزیِ کد: هم‌ایده با halHighlight در ادیتورِ HAL. کد را (مثل halTokenize) به توکن می‌شکند و هر توکن را بر اساسِ نوعش رنگ می‌کند:
   کامنت، عدد، کلمه‌ی کلیدی، نوعِ متغیر، تابع (هر اسمی که بعدش «(» بیاید)، ثابت‌های حروف‌بزرگ (GPIO_PIN_13 ...) و بقیه. */
const CT_HL = { kw: '#c792ea', ty: '#57d8a3', fn: '#5db0ff', cn: '#e79a54', num: '#d4af37', cm: '#6b7280' };
const CT_KW = new Set(['while', 'if', 'else', 'for', 'do', 'switch', 'break', 'continue', 'return', 'void']);
const CT_TY = new Set(['int', 'uint8_t', 'uint16_t', 'uint32_t', 'int32_t', 'GPIO_PinState', 'TIM_HandleTypeDef']);
function ctHighlight(src){
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const span = (c, t, extra = '') => `<span style="color:${c}${extra}">${esc(t)}</span>`;
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(\d+)|([A-Za-z_]\w*)|([\s\S])/gy;
  let out = '', m;
  while((m = re.exec(src))){
    if(m[1]) out += span(CT_HL.cm, m[1], ';font-style:italic');
    else if(m[2]) out += span(CT_HL.num, m[2]);
    else if(m[3]){
      const id = m[3], nx = src.slice(re.lastIndex).match(/^\s*(.)/);
      out += CT_KW.has(id) ? span(CT_HL.kw, id)
        : CT_TY.has(id) ? span(CT_HL.ty, id)
        : nx && nx[1] === '(' ? span(CT_HL.fn, id)
        : /^[A-Z][A-Z0-9_]*$/.test(id) || /^GPIO[A-E]$/.test(id) ? span(CT_HL.cn, id)
        : esc(id);
    } else out += esc(m[4]);
  }
  return out;
}
/* بلوکِ کد مثلِ ادیتورِ HAL: ستونِ شماره‌ی خط + کدِ رنگی (فقط‌خواندنی).
   toggles = { شماره‌ی خط: کلید } ⇒ آن خط‌ها طلایی و قابل‌کلیک‌اند (data-pm) تا کاربر کامنتشان کند. */
function ctCodeBlock(title, code, col, toggles){
  const lines = code.split('\n');
  const gut = lines.map((_, i) => i + 1).join('\n');
  const body = lines.map((l, i) => {
    const k = toggles && toggles[i], h = ctHighlight(l) || ' ';
    return k ? `<div data-pm="${k}" title="بزن تا این خط کامنت شود یا برگردد" style="cursor:pointer;background:rgba(212,175,55,.1);border-radius:4px;box-shadow:inset 3px 0 0 #d4af37">${h}</div>` : `<div>${h}</div>`;
  }).join('');
  return `<div dir="ltr" style="margin:8px 0;border:1px solid #2a3040;border-radius:10px;overflow:hidden;background:#10151f">`
    + `<div dir="rtl" style="padding:5px 10px;font-size:12px;font-weight:700;color:${col};background:#161c28;border-bottom:1px solid #2a3040">${title}</div>`
    + `<div style="display:flex;font:11.5px/1.65 JetBrains Mono,monospace">`
    + `<pre aria-hidden="true" style="margin:0;padding:8px 8px;text-align:right;color:#4a5163;background:#0d121b;border-right:1px solid #2a3040;user-select:none">${gut}</pre>`
    + `<pre style="margin:0;padding:8px 10px;color:#c9d0de;flex:1;min-width:0;overflow-x:auto;white-space:pre">${body}</pre></div></div>`;
}
/* کدِ کوتاهِ درون‌خطی (وسطِ جمله) با همان رنگ‌ها */
const ctInl = t => `<code dir="ltr" style="font-family:JetBrains Mono,monospace;font-size:12px;background:#10151f;border:1px solid #2a3040;border-radius:6px;padding:1px 6px">${ctHighlight(t)}</code>`;
const CT_CODE_DELAY = [
  'while (1)',
  '{',
  '  HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);',
  '  HAL_Delay(500);                          // CPU اینجا گیر است',
  '  if (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0))   // فقط اینجا به دکمه نگاه می‌کند',
  '  {',
  '    // ...',
  '  }',
  '}'
].join('\n');
const CT_CODE_TIMER = [
  'HAL_TIM_Base_Start(&htim2);   // تایمر شروع به شمردن می‌کند (هر خانه ۱ میلی‌ثانیه)',
  '',
  'while (1)',
  '{',
  '  if (__HAL_TIM_GET_COUNTER(&htim2) >= 500)   // ۵۰۰ خانه گذشت؟',
  '  {',
  '    __HAL_TIM_SET_COUNTER(&htim2, 0);',
  '    HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);',
  '  }',
  '  if (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0))   // CPU همیشه آزاد است',
  '  {',
  '    // ...',
  '  }',
  '}'
].join('\n');

const CT_CODE_CB = [
  'HAL_TIM_Base_Start_IT(&htim2);   // Period = 499 ⇒ هر ۵۰۰ میلی‌ثانیه یک وقفه',
  '',
  'while (1)',
  '{',
  '  if (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0))   // CPU کاملاً آزاد است',
  '  {',
  '    // ...',
  '  }',
  '}',
  '',
  'void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)',
  '{',
  '  HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);   // خودش صدا زده می‌شود',
  '}'
].join('\n');


/* کارتِ «هر کلاک چه کاری می‌کند؟»: برای هر کلاک یک صحنه‌ی متحرک (کریستال، کلید، ضربان، جاده‌ی کُند/تند) */
const CT_CLK = {
  hse: { mid: ['HSE'], col: 'hse',
    flow: { srcs: [['Crystal', 'کریستال روی بُرد']], mid: ['HSE', '۸ MHz', 'ورودی خام'], outs: [['PLL', '× ۹ ⇒ ۷۲'], ['SYSCLK', 'مستقیم']] },
    terms: [['HSE', 'High Speed External', 'کلاکِ پرسرعتِ بیرونی؛ «بیرونی» چون کریستال بیرونِ خودِ چیپ و روی بُرد است'], ['HSI', 'High Speed Internal', 'نسخه‌ی داخلیِ چیپ؛ ارزان‌تر ولی دقتش کمتر است'], ['PLL', 'Phase-Locked Loop', 'مدارِ ضرب‌کننده‌ی فرکانس؛ ۸ را می‌کند ۷۲']],
    txt: 'روی بُردِ Blue Pill یک کریستالِ فلزیِ کوچک با نوشته‌ی ۸ مگاهرتز هست. داخلش یک تکه‌ی کوارتز است که وقتی برق بگیرد با فرکانسِ بسیار دقیقی می‌لرزد؛ مدارِ چیپ این لرزش را به یک موجِ مربعی (ضربان) تبدیل می‌کند. HSE خودش فقط ۸ مگاهرتز است که برای یک ARM کند است، پس معمولاً به PLL می‌رود تا تند شود. دقتش از HSI (مدارِ داخلی) بیشتر است و برای کارهایی مثل UART و USB که زمان‌بندیِ دقیق می‌خواهند مهم است.',
    real: 'مثل ساعتِ مچیِ کوارتزی: داخلِ آن هم یک کریستالِ کوارتز مدام با فرکانسِ ثابت می‌لرزد و ساعت با شمردنِ همین لرزش‌ها وقت را نشان می‌دهد. یا مثل مترونومِ یک ارکستر: همه‌ی نوازنده‌ها (بخش‌های چیپ) با ضربِ او هماهنگ می‌شوند؛ اگر ضربش بی‌دقت باشد کلِ ارکستر به هم می‌ریزد.' },
  sysclk: { mid: ['SYSCLK'], col: 'sys',
    flow: { srcs: [['HSI', 'داخلی · ۸ MHz'], ['HSE', 'کریستال · ۸ MHz'], ['PLL', '۷۲ MHz']], pick: 2, mid: ['SYSCLK', '۷۲ MHz', 'انتخابگر (MUX)'], outs: [['AHB', '÷ ۱']] },
    terms: [['SYSCLK', 'System Clock', 'کلاکِ سیستم؛ کلاکِ اصلیِ کلِ چیپ'], ['MUX', 'Multiplexer', 'انتخابگر؛ از چند ورودی فقط یکی را به خروجی وصل می‌کند'], ['HSI / HSE / PLL', 'Internal / External / Phase-Locked Loop', 'سه منبعی که می‌شود از بینشان انتخاب کرد']],
    txt: 'SYSCLK کلاکِ اصلیِ کلِ چیپ است. پشتِ آن یک انتخابگر (Multiplexer) هست که سه منبع دارد: HSI (کریستالِ داخلی)، HSE (کریستالِ بیرونی) و PLL (خروجیِ ضرب‌شده). فقط یکی از آنها انتخاب می‌شود (در CubeMX اسمش System Clock Mux است). بیشترِ پروژه‌ها PLL را انتخاب می‌کنند تا چیپ با بیشینه‌ی سرعت (۷۲ مگاهرتز) کار کند. چیپ بعد از روشن شدن اول با HSI راه می‌افتد و بعد کلید روی PLL می‌رود.',
    real: 'مثل دنده‌ی ماشین: چند دنده داری (HSI، HSE، PLL) ولی در هر لحظه فقط یکی درگیر است. ماشین همیشه با دنده‌ی ۱ استارت می‌خورد و بعد دنده‌ی تند را می‌گذاری؛ چیپ هم با HSI بالا می‌آید و بعد روی PLL می‌رود.' },
  hclk: { mid: ['HCLK'], col: 'sys',
    flow: { srcs: [['SYSCLK', '۷۲ MHz']], mid: ['HCLK', '۷۲ MHz', '÷ AHB (۱)'], outs: [['CPU', 'هسته‌ی Cortex-M'], ['Flash · RAM', 'حافظه‌ها'], ['DMA', 'انتقال داده'], ['APB1 · APB2', 'باس‌ها']] },
    terms: [['HCLK', 'AHB Clock', 'کلاکِ باسِ AHB'], ['AHB', 'Advanced High-performance Bus', 'باسِ پیشرفته‌ی پرکارایی؛ شاهراهِ اصلیِ چیپ'], ['DMA', 'Direct Memory Access', 'دسترسیِ مستقیم به حافظه؛ جابه‌جاییِ داده بدونِ زحمتِ CPU'], ['APB', 'Advanced Peripheral Bus', 'باسِ پیشرفته‌ی قطعاتِ جانبی']],
    txt: 'HCLK کلاکِ باسِ AHB است؛ این باس شاهراهِ اصلیِ چیپ است که CPU، حافظه‌ی Flash (برنامه)، RAM (داده) و DMA را به هم وصل می‌کند. وقتی HCLK برابر ۷۲ مگاهرتز است، CPU می‌تواند تقریباً ۷۲ میلیون دستور در ثانیه اجرا کند. HCLK از SYSCLK و با تقسیم‌کننده‌ی AHB Prescaler (معمولاً ÷۱) ساخته می‌شود و از اینجا راه به دو باسِ دیگر یعنی APB1 و APB2 دو شاخه می‌شود.',
    real: 'مثل نوار نقاله‌ی اصلیِ یک کارخانه: همه‌ی کارگرانِ سالنِ اصلی (CPU، انبارِ Flash، قفسه‌ی RAM، پیکِ DMA) با همان آهنگِ نوار کار می‌کنند. نوار را کُند کنی کارخانه کندتر می‌شود ولی برق کمتری می‌خورد؛ برای همین در پروژه‌های باتری‌دار گاهی HCLK را عمداً کم می‌کنند.' },
  apb: { mid: ['APB'], col: 'pclk',
    flow: { hdr: ['باسِ اصلی', 'پل', 'باس‌های فرعی'], srcs: [['AHB', 'باسِ اصلی · سریع']], mid: ['APB', 'Bridge', 'پلِ AHB ⇒ APB'], outs: [['APB1', 'کُند · تا ۳۶ MHz'], ['APB2', 'تند · تا ۷۲ MHz']] },
    terms: [['Bus', 'Bus', 'گذرگاه؛ سیم‌های مشترکِ آدرس، داده و کنترل که چند قطعه برای حرف زدن با هم از آن استفاده می‌کنند'], ['APB', 'Advanced Peripheral Bus', 'باسِ ساده و کم‌مصرفِ قطعاتِ جانبی (پریفرال‌ها)'], ['AHB', 'Advanced High-performance Bus', 'باسِ اصلی و پرسرعتِ چیپ'], ['Bridge', 'AHB-to-APB Bridge', 'پلی که AHB را به APB وصل می‌کند و سرعت را با آن تطبیق می‌دهد'], ['Master / Slave', 'Master / Slave', 'آغازکننده (مثل CPU و DMA) / پاسخ‌دهنده (مثل حافظه و UART)'], ['Prescaler', 'Prescaler', 'تقسیم‌کننده‌ی کلاک']],
    txt: 'اول یک فرق مهم: <b>کلاک</b> «ضربان» است (سرعتِ کار)، ولی <b>باس</b> «جاده» است (مسیرِ رفت‌وآمدِ داده). هر جاده کلاکِ خودش را دارد: AHB کلاکش HCLK و APB1/APB2 کلاکشان PCLK1/PCLK2 است. باس (Bus) یعنی «گذرگاهِ مشترک»: چند سیمِ موازی (آدرس، داده و کنترل) که چند قطعه به آن وصل‌اند. هر وقت CPU (یا DMA) می‌خواهد با یک قطعه حرف بزند، اول روی باس آدرسِ آن قطعه را می‌گذارد («با کی کار دارم؟») و بعد داده رد و بدل می‌شود. در هر لحظه فقط یک آغازکننده (Master) روی باس صحبت می‌کند. در STM32 باسِ اصلی AHB است: سریع و پرمصرف، مخصوصِ CPU و حافظه‌ها. ولی UART، I2C، ADC و امثالِ آنها به آن سرعت نیاز ندارند و اگر همه را مستقیم به AHB می‌چسباندیم، مدار بزرگ و پرمصرف می‌شد. پس یک پل (Bridge) از AHB دو باسِ ساده‌تر می‌سازد: APB1 (تا ۳۶ مگاهرتز) و APB2 (تا ۷۲ مگاهرتز). کلاکِ هر کدام با یک Prescaler جدا از HCLK ساخته می‌شود؛ همان PCLK1 و PCLK2.',
    real: 'مثل حمل‌ونقلِ شهر: AHB بزرگراهِ اصلی است که ماشین‌های سنگین (CPU و حافظه‌ها) تندروی می‌کنند. APB خیابان‌های فرعیِ محله‌هاست که پیک‌موتوری‌ها (UART، I2C، ADC) در آن رفت‌وآمد می‌کنند؛ لازم نیست همه‌ی خانه‌ها کنارِ بزرگراه باشند. پل (Bridge) هم همان خروجیِ بزرگراه به خیابانِ محله است که سرعت را کم می‌کند. یا مثل سیم‌کشیِ برقِ ساختمان: یک سیمِ اصلیِ ضخیم و بعد شاخه‌های نازک‌تر برای هر اتاق.' },
  pclk1: { mid: ['PCLK1'], col: 'pclk',
    flow: { srcs: [['HCLK', '۷۲ MHz']], mid: ['PCLK1', '۳۶ MHz', '÷ ۲ (APB1)'], outs: [['UART2 · I2C', 'CAN · SPI2'], ['TIM2/3/4', '×۲ ⇒ ۷۲ MHz']] },
    terms: [['PCLK1', 'Peripheral Clock 1', 'کلاکِ پریفرال‌ها (قطعاتِ جانبی) روی باسِ شماره‌ی ۱'], ['APB1', 'Advanced Peripheral Bus 1', 'باسِ کُندترِ قطعاتِ جانبی'], ['UART', 'Universal Asynchronous Receiver/Transmitter', 'فرستنده/گیرنده‌ی سریالِ ناهمگام'], ['I2C', 'Inter-Integrated Circuit', 'ارتباطِ دوسیمه بینِ چیپ‌ها'], ['SPI', 'Serial Peripheral Interface', 'ارتباطِ سریالِ پرسرعت'], ['CAN', 'Controller Area Network', 'شبکه‌ی ارتباطیِ خودرو']],
    txt: 'PCLK1 کلاکِ باسِ APB1 است؛ باسی برای قطعاتِ جانبی که به سرعتِ بالا نیاز ندارند: UART2، I2C، CAN، SPI2 و تایمرهای TIM2/3/4. این باس حداکثر ۳۶ مگاهرتز تحمل دارد، برای همین APB1 Prescaler را ÷۲ می‌گذاریم (۷۲ ÷ ۲ = ۳۶). ولی تایمرها یک قانونِ ویژه دارند: اگر تقسیم‌کننده‌ی APB برابر ۱ نباشد، کلاکِ تایمر ×۲ می‌شود؛ پس TIM2/3/4 دوباره ۷۲ مگاهرتز می‌گیرند.',
    real: 'مثل جاده‌ی شهری با محدودیتِ سرعت: ماشین‌های معمولی (ارتباط‌های UART و I2C) فقط تا ۳۶ می‌توانند بروند. ولی تایمرها مثل آمبولانس یک خطِ ویژه‌ی توربویی (×۲) دارند و با سرعتِ کامل می‌روند.' },
  pclk2: { mid: ['PCLK2'], col: 'pclk',
    flow: { srcs: [['HCLK', '۷۲ MHz']], mid: ['PCLK2', '۷۲ MHz', '÷ ۱ (APB2)'], outs: [['UART1 · SPI1', 'GPIO'], ['ADC', '÷۶ ⇒ ۱۲ MHz'], ['TIM1', '×۱ ⇒ ۷۲ MHz']] },
    terms: [['PCLK2', 'Peripheral Clock 2', 'کلاکِ پریفرال‌ها روی باسِ شماره‌ی ۲'], ['APB2', 'Advanced Peripheral Bus 2', 'باسِ تندترِ قطعاتِ جانبی'], ['ADC', 'Analog-to-Digital Converter', 'مبدلِ آنالوگ به دیجیتال؛ ولتاژ سنسور را به عدد تبدیل می‌کند'], ['GPIO', 'General-Purpose Input/Output', 'پایه‌های ورودی/خروجیِ عمومی'], ['TIM', 'Timer', 'تایمر']],
    txt: 'PCLK2 کلاکِ باسِ APB2 است؛ باسِ تندتر برای UART1، SPI1، ADC، GPIOها و تایمرِ TIM1. تا ۷۲ مگاهرتز تحمل دارد، پس APB2 Prescaler را ÷۱ می‌گذاریم و PCLK2 همان ۷۲ می‌ماند. چون تقسیم‌کننده ۱ است، کلاکِ تایمرِ TIM1 هم ×۱ می‌ماند (۷۲). ADC یک تقسیم‌کننده‌ی جدا دارد (ADC Prescaler) چون بیشتر از ۱۴ مگاهرتز تحمل نمی‌کند: ۷۲ ÷ ۶ = ۱۲ مگاهرتز.',
    real: 'مثل بزرگراه: کارهای سریع، مثل نمونه‌گیریِ سنسورها با ADC و ساختنِ PWM برای موتور با TIM1، روی آن با سرعتِ کامل می‌روند. در یک ربات همین باس سنسورها را می‌خواند و موتورها را می‌راند.' }
};
const ctHasFa = t => /[\u0600-\u06FF]/.test(t);
const ctLatTx = (x, y, t, fs = 10.5, fill = '#e8e2d0') => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${fs}" font-weight="700" style="fill:${fill};direction:ltr;unicode-bidi:bidi-override">${t}</text>`;
const ctAnyTx = (x, y, t, fs, fill) => ctHasFa(t) ? ctAnimTx(x, y, t, fill, fs) : ctLatTx(x, y, t, fs, fill);
function ctClkChip(x, y, w, h, lines, col, hl){
  const cy = y + h / 2, one = lines.length === 1;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${hl ? col : '#161c28'}" fill-opacity="${hl ? .18 : 1}" stroke="${col}" stroke-width="${hl ? 2 : 1.3}"/>`
    + ctAnyTx(x + w / 2, one ? cy + 4 : cy - 1, lines[0], 10.5, hl ? col : '#e8e2d0')
    + (one ? '' : ctAnyTx(x + w / 2, cy + 11, lines[1], 8.5, '#8b93a3'));
}
function ctClkRoad(x1, x2, y){
  return `<rect x="${x1}" y="${y - 8}" width="${x2 - x1}" height="16" rx="8" fill="#1b212d" stroke="#2a3040"/>`
    + `<line x1="${x1 + 6}" x2="${x2 - 6}" y1="${y}" y2="${y}" stroke="#4a5163" stroke-width="1.5" stroke-dasharray="6 6"><animate attributeName="stroke-dashoffset" values="0;-12" dur=".7s" repeatCount="indefinite"/></line>`;
}
/* جاده‌ی مسیری (با پیچ): اول کنارِ همه‌ی جاده‌ها، بعد داخلشان، بعد خطِ‌چینِ وسط؛ پس گوشه‌ها و دوراهی‌ها یکپارچه می‌شوند و دایره‌ها دقیقاً روی خطِ وسط می‌روند */
function ctClkRoads(paths){
  const st = (w, c, extra = '') => paths.map(d => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`).join('');
  return st(19, '#2a3040') + st(15, '#1b212d')
    + paths.map(d => `<path d="${d}" fill="none" stroke="#4a5163" stroke-width="1.5" stroke-dasharray="6 6" stroke-linecap="butt" stroke-linejoin="round"><animate attributeName="stroke-dashoffset" values="0;-12" dur=".7s" repeatCount="indefinite"/></path>`).join('');
}
const ctClkDots = (path, n, dur, col, r = 3.2) => Array.from({ length: n }, (_, i) =>
  `<circle r="${r}" fill="${col}"><animateMotion dur="${dur}s" begin="${(-i * dur / n).toFixed(2)}s" repeatCount="indefinite" path="${path}"/></circle>`).join('');
function ctClkGear(cx, cy, T, rp, txt, col, dur, dir = 1){
  const g = ctTeeth(T, rp);
  return `<g transform="translate(${cx} ${cy})"><g><path d="${g.d}" fill="#2a2f3b" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>`
    + `<animateTransform attributeName="transform" type="rotate" values="0;${360 * dir}" dur="${dur}s" repeatCount="indefinite"/></g>`
    + `<circle r="${(rp * .62).toFixed(1)}" fill="#10151f" stroke="${col}" stroke-width="1.2"/>${ctLatTx(0, 3.5, txt, 9.5, col)}</g>`;
}
const ctClkSign = (cx, cy, txt) => `<circle cx="${cx}" cy="${cy}" r="11" fill="#10151f" stroke="#ff6b6b" stroke-width="2.4"/>${ctAnimTx(cx, cy + 3.5, txt, '#e8e2d0', 9.5)}`;

/* نمودارِ مسیر: ورودی(ها) ⇒ خودِ کلاک ⇒ مصرف‌کننده‌ها (با جریانِ متحرک) */
function ctClkFlow(k){
  const d = CT_CLK[k], f = d.flow, col = CT_COL[d.col], n = Math.max(f.srcs.length, f.outs.length), rowH = 42, top = 30, H = top + n * rowH + 8;
  const sx = 4, mx = 118, ox = 232, bw = 84, mw = 84, bh = 34, cy = top + n * rowH / 2;
  const ys = (cnt, i) => top + (n * rowH / cnt) * (i + .5);
  const flowPath = (x1, y1, x2, y2, c, on) => {
    const xm = (x1 + x2) / 2;
    return `<path d="M${x1} ${y1}C${xm} ${y1} ${xm} ${y2} ${x2 - 6} ${y2}" fill="none" stroke="${on ? c : '#4a5163'}" stroke-width="${on ? 2.4 : 1.3}" stroke-dasharray="${on ? '6 4' : '3 4'}" stroke-linecap="round">`
      + (on ? '<animate attributeName="stroke-dashoffset" values="10;0" dur=".7s" repeatCount="indefinite"/>' : '') + '</path>'
      + `<path d="M${x2} ${y2}l-7 -4v8z" fill="${on ? c : '#4a5163'}"/>`;
  };
  const card = (x, y, w, h, lines, c, on) => `<rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="9" fill="${c}" fill-opacity="${on ? .16 : .06}" stroke="${on ? c : '#2a3040'}" stroke-width="${on ? 1.8 : 1.2}"/>`
    + `<rect x="${x}" y="${y - h / 2 + 5}" width="3.5" height="${h - 10}" rx="1.75" fill="${on ? c : '#4a5163'}"/>`
    + ctAnyTx(x + w / 2 + 2, lines[1] ? y - 2 : y + 4, lines[0], 10.5, on ? '#f3eedd' : '#aab1c0')
    + (lines[1] ? ctAnyTx(x + w / 2 + 2, y + 11, lines[1], 8.5, '#8b93a3') : '');
  let o = `<defs><filter id="ctClkGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter></defs>`
    + [sx + bw / 2, mx + mw / 2, ox + bw / 2].map((x, i) => ctAnimTx(x, 15, (f.hdr || ['ورودی', 'خودِ کلاک', 'کجا می‌رود؟'])[i], '#6b7280', 9)).join('');
  f.srcs.forEach((s, i) => { const y = ys(f.srcs.length, i), on = f.pick === undefined || f.pick === i; o += flowPath(sx + bw, y, mx, cy, col, on) + card(sx, y, bw, bh, s, on ? col : '#6b7280', on); });
  o += `<rect x="${mx}" y="${cy - 32}" width="${mw}" height="64" rx="14" fill="${col}" opacity=".5" filter="url(#ctClkGlow)"/>`
    + `<rect x="${mx}" y="${cy - 32}" width="${mw}" height="64" rx="14" fill="#10151f" stroke="${col}" stroke-width="2.4"/>`
    + `<rect x="${mx}" y="${cy - 32}" width="${mw}" height="64" rx="14" fill="${col}" fill-opacity=".14"/>`
    + ctLatTx(mx + mw / 2, cy - 11, f.mid[0], 14, col) + ctLatTx(mx + mw / 2, cy + 7, f.mid[1], 12.5, '#f3eedd') + ctAnyTx(mx + mw / 2, cy + 23, f.mid[2], 9, '#8b93a3');
  f.outs.forEach((s, i) => { const y = ys(f.outs.length, i); o += flowPath(mx + mw, cy, ox, y, col, true) + card(ox, y, bw, bh, s, col, true); });
  return ctAnimSvg(H, o);
}
const ctClkView = k => {
  const d = CT_CLK[k];
  return ctClkSvg(k) + ctClkFlow(k)
    + `<div class="hs-p">${d.txt}</div>`
    + `<div class="ct-explain"><b>📚 اسمِ کاملِ هر کلمه:</b><br>${d.terms.map(([a, e, fa]) => `<b>${a}</b> = <span dir="ltr" style="font-family:JetBrains Mono,monospace;font-size:12px;color:#d4af37">${e}</span> — ${fa}`).join('<br>')}</div>`
    + `<div class="ct-explain"><b>🌍 مثال در دنیای واقعی:</b> ${d.real}</div>`;
};

function ctClkSvg(k){
  const C = CT_COL;
  if(k === 'hse'){
    const wave = ctSquare(128, 22, 8, 40, 72);
    return ctAnimSvg(150,
      `<rect x="6" y="14" width="86" height="92" rx="10" fill="#0f3a2a" fill-opacity=".45" stroke="#2a5a46"/>`
      + ctAnimLat(14, 27, 'PCB')
      + `<g transform="translate(46 56)"><g><rect x="-24" y="-16" width="48" height="30" rx="15" fill="#c9ced8" stroke="#8b93a5" stroke-width="1.5"/><text y="4" text-anchor="middle" font-size="9" font-weight="700" fill="#2a2f3b">8.000</text>`
      + `<animateTransform attributeName="transform" type="translate" values="0 0;1.6 0;0 0;-1.6 0;0 0" dur=".16s" repeatCount="indefinite"/></g>`
      + `<line x1="-9" y1="14" x2="-9" y2="34" stroke="#c9ced8" stroke-width="2.4"/><line x1="9" y1="14" x2="9" y2="34" stroke="#c9ced8" stroke-width="2.4"/></g>`
      + [0, 1, 2].map(i => `<path d="M${76 + i * 5} ${46 - i * 3}q${6 + i * 2} ${10 + i * 3} 0 ${20 + i * 6}" fill="none" stroke="${C.hse}" stroke-width="2" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="${(i * .25).toFixed(2)}s" repeatCount="indefinite"/></path>`).join('')
      + `<line x1="92" y1="56" x2="128" y2="56" stroke="${C.hse}" stroke-width="2.4"/>`
      + `<path d="${wave}" fill="none" stroke="${C.hse}" stroke-width="2.4" stroke-linejoin="round"/>` + ctSweep(128, 30, 82, 176, 2)
      + ctAnimTx(46, 124, 'کریستال روی بُرد', '#e8e2d0', 10.5)
      + ctAnimTx(216, 98, '۸ میلیون ضربه در ثانیه', C.hse, 10)
      + ctAnimTx(160, 142, 'می‌لرزد ⇒ ضربانِ دقیق و ثابت ⇒ مبدأ همه‌ی کلاک‌ها', '#8b93a3', 9.5));
  }
  if(k === 'sysclk'){
    const ys = [30, 70, 110];
    const ins = [['HSI', 'داخلی · ۸'], ['HSE', 'کریستال · ۸'], ['PLL', '۷۲ ✔']];
    return ctAnimSvg(152,
      ins.map((it, i) => {
        const on = i === 2, col = on ? C.sys : '#6b7280';
        return ctClkChip(6, ys[i] - 15, 70, 30, it, on ? C.sys : '#3a4050', on)
          + `<path d="M76 ${ys[i]}L140 ${ys[i]}" stroke="${col}" stroke-width="${on ? 2.6 : 1.4}" fill="none"${on ? '' : ' stroke-dasharray="4 4"'}/>`;
      }).join('')
      + `<path d="M140 14L188 46V94L140 126Z" fill="#161c28" stroke="${C.sys}" stroke-width="2"/>`
      + ctAnimTx(158, 74, 'MUX', C.sys, 9.5)
      + `<line x1="178" y1="70" x2="146" y2="110" stroke="${C.sys}" stroke-width="3.4" stroke-linecap="round"/><circle cx="178" cy="70" r="4.5" fill="${C.sys}"/>`
      + ctClkDots('M76 110L140 110', 3, 1.4, C.sys)
      + `<path d="M188 70L204 70" stroke="${C.sys}" stroke-width="2.6"/>`
      + `<path d="${ctSquare(204, 10, 9, 56, 84)}" fill="none" stroke="${C.sys}" stroke-width="2.4" stroke-linejoin="round"/>` + ctSweep(204, 46, 94, 90, 1)
      + ctLatTx(252, 38, 'SYSCLK', 11, C.sys) + ctAnimTx(252, 108, '۷۲ مگاهرتز', '#e8e2d0', 11)
      + ctAnimTx(160, 146, 'کلید فقط یکی را وصل می‌کند: اینجا PLL', '#8b93a3', 9.5));
  }
  if(k === 'hclk'){
    return ctAnimSvg(156,
      `<rect x="108" y="14" width="104" height="44" rx="10" fill="${C.sys}" fill-opacity=".16" stroke="${C.sys}" stroke-width="2.4"><animate attributeName="stroke-width" values="2;5.5;2" dur=".9s" repeatCount="indefinite"/><animate attributeName="fill-opacity" values=".12;.38;.12" dur=".9s" repeatCount="indefinite"/></rect>`
      + ctLatTx(160, 33, 'CPU', 12, C.sys) + ctAnimTx(160, 48, 'هسته‌ی Cortex-M', '#8b93a3', 8.5)
      + ctLatTx(228, 39, '♥', 13, '#ff6b6b')
      + `<line x1="160" y1="58" x2="160" y2="84" stroke="${C.sys}" stroke-width="2.4"/>`
      + `<rect x="16" y="78" width="288" height="12" rx="6" fill="#1b212d" stroke="#2a3040"/>` + ctLatTx(160, 100 - 1, 'AHB bus', 8.5, '#6b7280')
      + ctClkDots('M20 84L300 84', 6, 2.4, C.sys, 2.8)
      + [['Flash', 16, 0], ['RAM', 90, 0], ['DMA', 164, 0]].map(([n, x]) => `<line x1="${x + 32}" y1="90" x2="${x + 32}" y2="110" stroke="#4a5163" stroke-width="2"/>` + ctClkChip(x, 110, 64, 26, [n], '#3a4050')).join('')
      + `<line x1="268" y1="90" x2="268" y2="110" stroke="${C.pclk}" stroke-width="2"/>` + ctClkChip(238, 110, 74, 26, ['⇒ APB1/2'], C.pclk)
      + ctAnimTx(160, 150, 'همه با یک ضربان هماهنگ می‌شوند (۷۲ مگاهرتز)', '#8b93a3', 9.5));
  }
  if(k === 'apb'){
    const top = [['CPU', C.sys], ['Flash', '#3a4050'], ['RAM', '#3a4050'], ['DMA', C.sys]];
    return ctAnimSvg(204,
      top.map(([n, c], i) => `<line x1="${39 + i * 72}" y1="32" x2="${39 + i * 72}" y2="44" stroke="#4a5163" stroke-width="2"/>` + ctClkChip(6 + i * 72, 10, 66, 22, [n], c, c === C.sys)).join('')
      + ctClkRoad(6, 314, 52) + ctClkDots('M10 52L310 52', 6, 2.4, C.sys)
      + ctAnimTx(60, 78, 'AHB: جاده‌ی اصلیِ سریع', C.sys, 9.5)
      + `<line x1="160" y1="60" x2="160" y2="76" stroke="${C.psc}" stroke-width="3"/>` + ctClkDots('M160 60V76', 2, 1.2, C.psc, 2.6)
      + ctClkChip(116, 76, 88, 24, ['Bridge'], C.psc, 1)
      + `<path d="M132 100V108H78V116" fill="none" stroke="${C.pclk}" stroke-width="2.4"/><path d="M188 100V108H242V116" fill="none" stroke="${C.pclk}" stroke-width="2.4"/>`
      + ctClkDots('M132 100V108H78V116', 2, 3, C.pclk, 2.6) + ctClkDots('M188 100V108H242V116', 3, 1.3, C.pclk, 2.6)
      + ctClkRoad(6, 154, 126) + ctClkRoad(166, 314, 126)
      + ctClkDots('M10 126L150 126', 3, 3.6, C.pclk) + ctClkDots('M170 126L310 126', 5, 1.6, C.pclk)
      + ['UART2', 'I2C', 'CAN'].map((n, i) => `<line x1="${30 + i * 50}" y1="134" x2="${30 + i * 50}" y2="144" stroke="#4a5163" stroke-width="2"/>` + ctClkChip(8 + i * 50, 144, 44, 22, [n], C.pclk)).join('')
      + ['UART1', 'SPI1', 'ADC'].map((n, i) => `<line x1="${190 + i * 50}" y1="134" x2="${190 + i * 50}" y2="144" stroke="#4a5163" stroke-width="2"/>` + ctClkChip(168 + i * 50, 144, 44, 22, [n], C.pclk)).join('')
      + ctLatTx(80, 182, 'APB1 ≤ 36 MHz', 9.5, C.pclk) + ctLatTx(240, 182, 'APB2 ≤ 72 MHz', 9.5, C.pclk)
      + ctAnimTx(160, 198, 'یک جاده‌ی اصلی ⇒ پل ⇒ دو جاده‌ی فرعی', '#8b93a3', 9.5));
  }
  const one = k === 'pclk1';
  const h = one ? 168 : 148, yB = one ? 126 : 108, jx = 136, gx = 174;
  const branch = `M${jx} 50V${yB}H206`;
  return ctAnimSvg(h,
    ctClkRoads(['M58 50H206', branch])
    + ctClkChip(4, 34, 52, 32, ['HCLK', '۷۲'], C.sys)
    + ctClkDots('M60 50H84', 2, 1, C.sys) + ctClkGear(100, 50, 10, 14, one ? '÷۲' : '÷۱', C.pclk, 4)
    + ctClkDots('M116 50H204', one ? 3 : 5, one ? 3.4 : 1.3, C.pclk)
    + ctClkSign(168, 24, one ? '۳۶' : '۷۲')
    + ctClkChip(214, 30, 102, 40, one ? ['UART2 · I2C', 'CAN · SPI2'] : ['UART1 · SPI1', 'ADC'], C.pclk)
    + ctClkDots(`M${jx} 50V${yB}H${gx - 16}`, one ? 2 : 3, one ? 3.4 : 1.4, C.pclk, 2.8)
    + ctClkGear(gx, yB, 8, 12, one ? '×۲' : '×۱', C.tim, one ? 1.2 : 4, -1)
    + ctClkDots(`M${gx + 16} ${yB}H204`, 2, one ? .8 : 1.2, one ? C.tim : C.pclk, 2.8)
    + ctClkChip(214, yB - 18, 102, 36, one ? ['TIM2/3/4', '۷۲ MHz (×۲)'] : ['TIM1', '۷۲ MHz (×۱)'], C.tim, 1)
    + ctAnimTx(196, one ? 86 : 82, one ? 'جاده‌ی کُند: ÷۲ ⇒ ۳۶' : 'جاده‌ی تند: ÷۱ ⇒ ۷۲', one ? C.pclk : C.sys, 9.5)
    + ctAnimTx(160, h - 8, one ? 'تایمرها توربوی ×۲ دارند ⇒ دوباره ۷۲' : 'تایمر هم بدونِ ضرب ۷۲ می‌گیرد', '#8b93a3', 9.5));
}


/* نقشه‌ی کاملِ درخت کلاکِ STM32F103 (ایستا): مسیرِ اصلی پررنگ، بقیه‌ی شاخه‌ها کم‌رنگ */
function ctFullTree(){
  const W = 762, H = 372, f = n => (+n).toFixed(1);
  const rtl = 'style="direction:rtl;unicode-bidi:embed"';
  const box = (x, y, w, h, a, b, col, main) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${main ? col : '#161c28'}" fill-opacity="${main ? .16 : 1}" stroke="${main ? col : '#3a4050'}" stroke-width="${main ? 2.2 : 1.2}"/>`
    + `<text x="${x + w / 2}" y="${y + (b ? h / 2 - 2 : h / 2 + 4)}" font-size="11.5" font-weight="700" fill="${main ? col : '#c9d0de'}" text-anchor="middle">${a}</text>`
    + (b ? `<text x="${x + w / 2}" y="${y + h / 2 + 11}" font-size="9.5" fill="#8b93a5" text-anchor="middle" ${rtl}>${b}</text>` : '');
  const ar = (x1, y1, x2, y2, col = '#6b7280', dash) => {
    const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 6 * Math.cos(a), hy = y2 - 6 * Math.sin(a), nx = -Math.sin(a) * 3.4, ny = Math.cos(a) * 3.4;
    return `<path d="M${x1} ${y1}L${f(hx)} ${f(hy)}" stroke="${col}" stroke-width="1.6" fill="none"${dash ? ' stroke-dasharray="4 3"' : ''}/><path d="M${x2} ${y2}L${f(hx + nx)} ${f(hy + ny)}L${f(hx - nx)} ${f(hy - ny)}z" fill="${col}"/>`;
  };
  const lbl = (x, y, t) => `<text x="${x}" y="${y}" font-size="9" fill="#8b93a5" text-anchor="middle" ${rtl}>${t}</text>`;
  const C = CT_COL;
  let o = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:560px;display:block;margin:6px auto" role="img" aria-label="Clock tree">`;
  // خطوط
  o += ar(90, 47, 140, 88) + ar(90, 127, 140, 102) + lbl(108, 62, '÷۲') + lbl(104, 122, '÷۱ یا ÷۲');
  o += `<path d="M90 38H316" stroke="#6b7280" stroke-width="1.4" fill="none" stroke-dasharray="4 3"/>` + ar(316, 38, 316, 70, '#6b7280');
  o += `<path d="M90 139H316" stroke="#6b7280" stroke-width="1.4" fill="none" stroke-dasharray="4 3"/>` + ar(316, 139, 316, 120, '#6b7280');
  o += ar(236, 95, 290, 95, C.sys) + ar(386, 95, 430, 95, C.sys) + ar(500, 95, 540, 95, C.sys);
  o += ar(188, 120, 188, 200) + ar(360, 120, 360, 170);
  o += ar(624, 84, 650, 44, C.sys) + ar(624, 104, 650, 100, C.sys);
  o += `<path d="M582 120V150H410V308M410 196" stroke="${C.pclk}" stroke-width="1.8" fill="none"/>` + ar(410, 196, 430, 196, C.pclk) + ar(410, 308, 430, 308, C.pclk);
  o += ar(504, 196, 534, 196, C.pclk) + ar(618, 196, 648, 178, C.pclk) + ar(618, 196, 648, 214, C.tim);
  o += ar(504, 308, 534, 308, C.pclk) + ar(618, 308, 648, 270, C.pclk) + ar(618, 308, 648, 308, C.tim) + ar(618, 308, 648, 346, C.pclk);
  // جعبه‌ها
  o += box(6, 30, 84, 34, 'HSI', '۸ MHz · داخلی', C.hse) + box(6, 110, 84, 34, 'HSE', 'کریستال ۴–۱۶ MHz', C.hse, 1);
  o += box(140, 70, 96, 50, 'PLL', '× ۲ … × ۱۶', C.sys, 1) + box(290, 70, 96, 50, 'SYSCLK', 'انتخابگر · ≤ ۷۲ MHz', C.sys, 1);
  o += box(430, 70, 70, 50, 'AHB', '÷۱ … ÷۵۱۲', C.sys, 1) + box(540, 70, 84, 50, 'HCLK', '≤ ۷۲ MHz', C.sys, 1);
  o += box(650, 24, 104, 40, 'CPU · Flash', 'RAM · DMA', C.sys) + box(650, 82, 104, 36, 'SysTick', 'HCLK ÷ ۸', C.sys);
  o += box(140, 200, 96, 36, 'USB', 'PLL ÷۱٫۵ ⇒ ۴۸ MHz', C.psc) + box(290, 170, 96, 36, 'MCO', 'خروجیِ کلاک روی PA8', C.psc);
  o += box(430, 178, 74, 36, 'APB1', '÷۱ … ÷۱۶', C.pclk, 1) + box(534, 178, 84, 36, 'PCLK1', '≤ ۳۶ MHz', C.pclk, 1);
  o += box(648, 162, 106, 32, 'UART2 · I2C', 'SPI2 · CAN', C.pclk) + box(648, 198, 106, 32, 'TIM2/3/4', 'تایمر (÷۱ ⇒ ×۱ ، وگرنه ×۲)', C.tim, 1);
  o += box(430, 290, 74, 36, 'APB2', '÷۱ … ÷۱۶', C.pclk, 1) + box(534, 290, 84, 36, 'PCLK2', '≤ ۷۲ MHz', C.pclk, 1);
  o += box(648, 255, 106, 30, 'UART1 · SPI1', '', C.pclk) + box(648, 293, 106, 30, 'TIM1', 'تایمر (×۱ یا ×۲)', C.tim, 1) + box(648, 331, 106, 34, 'ADC', 'ADCCLK ÷۲/۴/۶/۸ ≤ ۱۴ MHz', C.pclk);
  o += box(6, 256, 150, 34, 'LSI ۴۰ kHz', '⇒ IWDG · RTC', '#6b7280') + box(6, 300, 150, 34, 'LSE ۳۲٫۷۶۸ kHz', '⇒ RTC', '#6b7280');
  o += `<rect x="182" y="256" width="206" height="78" rx="8" fill="#161c28" stroke="#d4af37" stroke-dasharray="4 3"/>`
    + `<text x="285" y="276" font-size="10.5" font-weight="700" fill="#d4af37" text-anchor="middle" ${rtl}>⚠ Flash Latency (Wait State)</text>`
    + `<text x="285" y="294" font-size="10" fill="#c9d0de" text-anchor="middle" ${rtl}>تا ۲۴ MHz ⇒ ۰ ؛ تا ۴۸ ⇒ ۱ ؛ تا ۷۲ ⇒ ۲</text>`
    + `<text x="285" y="312" font-size="9.5" fill="#8b93a5" text-anchor="middle" ${rtl}>CubeMX خودش تنظیمش می‌کند</text>`;
  return o + '</svg>';
}

function mountClockTimerSim(container, { onSuccess, alreadyDone } = {}){
  const sel = (k, opts, sign) => `<select class="ct-sel" data-k="${k}">${opts.map(o => `<option value="${o}">${sign}${ctFa(o)}</option>`).join('')}</select>`;
  const row = (k, title, min, max) => `<div class="ct-row"><div class="ct-rn" data-talk="${k}"><b>${title}</b><span data-h="${k}"></span></div><input type="range" dir="ltr" data-k="${k}" min="${min}" max="${max}"><input type="number" class="ct-num" data-k="${k}" min="${min}" max="${max}" inputmode="numeric"></div>`;
  const pre = (list) => `<div class="ct-pre">${list.map(([l, v]) => `<button type="button" class="sim-btn sim-btn-ghost" data-preset="${v}">${l}</button>`).join('')}</div>`;
  const head = (talk, title, ctl) => `<div class="ct-sc-h" data-talk="${talk}" style="cursor:pointer;padding:12px 4px"><b>${title}</b>${ctl ? `<label class="ct-ctl">${ctl}</label>` : ''}</div>`;
  const block = (id, headHtml, ctrl = '', extra = '') => `<div class="ct-sc">${headHtml}${ctrl}${extra ? '<div class="ct-pair">' : ''}<svg class="ct-svg" id="${id}" viewBox="0 0 320 200"></svg>${extra}${extra ? '</div>' : ''}<div class="ct-rel" id="${id}R"></div></div>`;

  container.innerHTML = `
    <div class="sim-wrap ct-wrap">
      <div class="sim-hw-note">هدف: اول ببین delay چرا مشکل دارد، بعد با چرخ‌دنده‌ها ببین ضریب‌های کلاک چطور ساخته می‌شوند، تایمر و PWM را قدم‌به‌قدم بفهم، و اگر دوست داشتی آخرش یک PWM ۳۱٫۲۵ کیلوهرتزیِ ۵۰٪ هم بساز. امتحان کردنِ شبیه‌ساز اختیاری است؛ اگر فقط مطالعه کردی، پایینِ صفحه «مطالعه کردم ✓» را بزن تا مأموریت کامل شود. روی هر چرخ‌دنده یا صفحه بزن تا شوالیه توضیحش بدهد.</div>
      <details class="hs-det" open>
        <summary>⏱️ کلاک یعنی چی؟</summary>
        <div class="hs-p">کلاک یک ضربانِ ثابت است، مثل چرخیدنِ یک چرخ‌دنده. چیپ با هر ضربه فقط یک قدمِ خیلی کوچک برمی‌دارد. «۷۲ مگاهرتز» یعنی ۷۲ میلیون ضربه در هر ثانیه؛ هرچه چرخ‌دنده تندتر بچرخد، چیپ سریع‌تر است.</div>
        <div class="hs-p">Blue Pill از یک کریستالِ ۸ مگاهرتزی شروع می‌کند. این برای یک ARM کُند است، پس PLL آن را ×۹ می‌کند و می‌شود ۷۲ مگاهرتز. این «کلاکِ خودِ چیپ» (SYSCLK) است و CPU با همین کار می‌کند.</div>
        ${ctAnimClock()}
      </details>
      <details class="hs-det" open>
        <summary>⏲️ تایمر یعنی چی؟</summary>
        <div class="hs-p">تایمر یک عقربه روی یک صفحه‌ی گرد است. هر ضربه‌ی کلاک، عقربه یک خانه جلو می‌رود؛ به آخرین خانه که رسید دوباره به ۰ برمی‌گردد. خودِ سخت‌افزار می‌شمارد و CPU آزاد می‌ماند.</div>
        <div class="hs-p">تایمر دو تنظیم دارد: <b>Prescaler</b> (ضربه‌ها چقدر کُند شوند) و <b>Period</b> (صفحه چند خانه دارد). کلاک ضربان می‌دهد، تایمر آن ضربان را می‌شمارد.</div>
        ${ctAnimTimer()}
      </details>
      <details class="hs-det">
        <summary>🧰 تایمر به چه کارهایی می‌آید؟ (همه‌ی کاربردها)</summary>
        <div class="hs-p">تایمر فقط «شمارنده» است؛ اما با تنظیم‌های مختلف کارهای زیادی می‌کند. این صفحه فقط دو کارِ اول را شبیه‌سازی می‌کند و بقیه را برای آشنایی اینجا آورده‌ایم.</div>
        <table class="hs-table">
          <tr><th>کاربرد</th><th>یعنی چی؟</th><th>مثال در ربات</th></tr>
          <tr><td>⏳ زمان‌سنج / وقفه‌ی تناوبی</td><td>هر مدتِ ثابت یک «زنگ» می‌زند (جایگزینِ delay)</td><td>اجرای حلقه‌ی PID هر ۵ میلی‌ثانیه</td></tr>
          <tr><td>💡 PWM (خروجی)</td><td>پین را با دیوتیِ دلخواه روشن و خاموش می‌کند</td><td>سرعتِ موتور، روشنایی LED، زاویه‌ی سروو</td></tr>
          <tr><td>📏 Input Capture</td><td>لحظه‌ی رسیدنِ لبه‌ی سیگنال را ثبت می‌کند و طولِ پالس یا فرکانس را می‌دهد</td><td>سنسور اولتراسونیک: طولِ پالسِ Echo = فاصله</td></tr>
          <tr><td>📥 PWM Input</td><td>فرکانس و دیوتیِ یک سیگنالِ ورودی را هم‌زمان می‌خواند</td><td>خواندنِ خروجیِ PWMِ گیرنده‌ی کنترل</td></tr>
          <tr><td>🎯 Output Compare</td><td>وقتی شمارنده به عددِ مشخصی رسید، پین را عوض می‌کند</td><td>ساختنِ پالسِ Trigger با طولِ دقیق</td></tr>
          <tr><td>🔁 حالتِ Encoder</td><td>پالس‌های دو کانالِ انکودر را بالا/پایین می‌شمارد و جهت را هم می‌فهمد</td><td>سرعت و مسافتِ چرخِ موتور</td></tr>
          <tr><td>1️⃣ One Pulse</td><td>بعد از یک ماشه فقط یک پالس با طولِ دقیق می‌سازد</td><td>یک پالسِ کوتاه برای درایور یا سنسور</td></tr>
          <tr><td>🔔 ماشه‌ی ADC / DMA</td><td>تایمر در فاصله‌های ثابت ADC یا DMA را راه می‌اندازد</td><td>نمونه‌برداریِ منظم از سنسورهای خط</td></tr>
          <tr><td>🔢 شمارشِ رویدادِ بیرونی</td><td>به‌جای کلاک، پالس‌های یک پین را می‌شمارد</td><td>شمردنِ تعدادِ خط‌هایی که ربات رد کرد</td></tr>
          <tr><td>🛡️ Dead-time و خروجیِ مکمل (TIM1)</td><td>دو خروجیِ مخالف می‌سازد و بینشان یک وقفه‌ی کوتاه می‌گذارد</td><td>پلِ H: جلوگیری از اتصال‌کوتاهِ درایور موتور</td></tr>
        </table>
      </details>
      <div class="ct-stage-t">⏳ بخش ۱ — delay یعنی چی؟</div>
      <div class="ct-explain"><b>delay یعنی «همین‌جا بایست و صبر کن».</b> مثلاً ${ctInl('HAL_Delay(500)')} یعنی ۵۰۰ میلی‌ثانیه صبر کن. ساده است و فقط یک خط کد؛ اما در این مدت CPU مثل کسی است که به ساعت زل زده: <b>هیچ کارِ دیگری نمی‌کند</b>. به این حالت <b>مسدودکننده (Blocking)</b> می‌گویند.<br><br>
        <b>معایبِ delay:</b><br>
        ۱) <b>CPU قفل می‌شود:</b> در حینِ delay، فشرده شدنِ دکمه یا رسیدنِ داده‌ی سنسور را نمی‌بینی.<br>
        ۲) <b>کارها پشت‌سرهم می‌شوند، نه هم‌زمان:</b> اگر یک LED را با delay چشمک بزنی، نمی‌توانی در همان لحظه چیزِ دیگری را هم کنترل کنی.<br>
        ۳) <b>دقتش کامل نیست:</b> delayِ نرم‌افزاری به وقفه‌ها وابسته است و اگر وقفه‌ی دیگری وسط بیاید، زمان کمی بیشتر می‌شود.<br>
        <b>ایده:</b> زمان‌شماری را به سخت‌افزار بسپاریم؛ یعنی <b>تایمر</b>. خودت امتحان کن!</div>
      <div class="ct-sc">
        <div class="ct-sc-h"><b data-talk="dly">🧪 آزمایش: LED چشمک‌زن + دکمه</b><label class="ct-ctl">delay (ms) ${sel('dlD', [200, 500, 1000, 1500, 2000], '')}</label></div>
        <div class="hs-p">برنامه دو کار دارد: <b>LED را چشمک بزند</b> و <b>به دکمه جواب بدهد</b>. دکمه را چندبار بزن و ببین کدام روش آن را می‌بیند. (هر کلیک یک فشارِ کوتاه است.)</div>
        <div class="ll-row" id="ctDlm" style="margin:8px 0"><button type="button" class="sim-btn" data-dlm="1" aria-pressed="true">⏳ روش ۱: delay</button><button type="button" class="sim-btn sim-btn-ghost" data-dlm="2" aria-pressed="false">⏱️ روش ۲: شمارنده</button><button type="button" class="sim-btn sim-btn-ghost" data-dlm="3" aria-pressed="false">🔔 روش ۳: callback</button></div>
        <div id="ctDlm1">
          ${ctCodeBlock('روش ۱: با delay', CT_CODE_DELAY, '#ff8a80')}
        </div>
        <div id="ctDlm2" hidden>
          ${ctCodeBlock('روش ۲: با تایمر (شمارنده را خودت نگاه می‌کنی)', CT_CODE_TIMER, '#57d8a3')}
        </div>
        <div id="ctDlm3" hidden>
        <div class="hs-p">در روش ۲ هنوز CPU باید مدام به شمارنده نگاه کند. <b>روش ۳ (callback)</b> این را هم برمی‌دارد: تایمر وقتی به Period رسید خودش یک «زنگ» (وقفه) می‌زند، CPU لحظه‌ای کارش را رها می‌کند، تابعِ ${ctInl('HAL_TIM_PeriodElapsedCallback')} را اجرا می‌کند و برمی‌گردد سرِ کارِ قبلی. برای ۵۰۰ میلی‌ثانیه: PSC = ۷۱۹۹۹ و Period = ۴۹۹ (چون Period+۱ خانه می‌شمارد). تابعِ callback را کوتاه نگه دار.</div>
          ${ctCodeBlock('روش ۳: تایمر با callback (وقفه)', CT_CODE_CB, '#5db0ff')}
        </div>
        <canvas class="ct-cv" id="ctDl" data-dl></canvas>
        <div class="hs-p" style="display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;margin:6px 0"><span><b style="color:#ff6b6b">■</b> CPU گیرِ delay است</span><span><b style="color:#57d8a3">■</b> سرک کشیدن به دکمه / CPU آزاد</span><span><b style="color:#d4af37">▮</b> شمارنده به ۵۰۰ رسید و LED عوض می‌شود</span></div>
        <div class="ll-row"><button type="button" class="sim-btn" id="ctPress">🔘 دکمه را بزن</button><button type="button" class="sim-btn sim-btn-ghost" id="ctDlReset">↺ شمارنده را صفر کن</button></div>
        <div class="ct-rel" id="ctDlR"></div>
      </div>
      <div class="ct-explain"><b>پس راه‌حل تایمر است.</b> ولی تایمر برای شمردن به یک ضربانِ ثابت نیاز دارد، و آن ضربان همان <b>کلاک</b> است. پس اول می‌بینیم کلاکِ چیپ چطور ساخته می‌شود (بخش ۲)، بعد سراغِ خودِ تایمر می‌رویم (بخش ۳).</div>

      <div class="ct-answer"><b>جوابِ کوتاه به سؤالِ همیشگی:</b> ۷۲ مگاهرتز کلاکِ خودِ چیپ است. ۳۶ مگاهرتز فقط کلاکِ «باس APB1» است (یک گیربکسِ کُندکننده داخل چیپ)، نه کلاکِ تایمر. تایمرهای روی APB1 دوباره ×۲ می‌شوند و ۷۲ می‌گیرند؛ TIM1 هم اصلاً روی APB1 نیست و بی‌هیچ ضربی ۷۲ می‌گیرد.</div>
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
      <div class="ct-stage-t">⚙️ بخش ۲ — کلاکِ چیپ با چرخ‌دنده</div>
      <div class="hs-p">⚙️ این چرخ‌دنده‌ها مفهوم فنی «درخت کلاک (Clock Tree)» را به زبان مکانیک نشان می‌دهند: در میکروکنترلر سرعت همه‌چیز یکسان نیست؛ بلکه فرکانس اصلی با کمک ضریب‌ها (ضرب و تقسیم)، به هر بخش با سرعت متناسب خودش می‌رسد.</div>
      <div class="hs-p">هر چرخ‌دنده‌ی بزرگ یک کلاک را با مقدارش نشان می‌دهد و چرخ‌دنده‌ی کوچکِ بینِ دو کلاک عملِ ضرب (×) یا تقسیم (÷) را انجام می‌دهد؛ عددِ داخلِ چرخ‌دنده‌ی کوچک ضریب است و زیرش خودِ حساب نوشته شده. چرخ‌دنده‌ها به هم درگیرند و با هم می‌چرخند. منوها را عوض کن و ببین عددها چه می‌شوند.</div>
      <details class="hs-det" open>
        <summary>📖 هر کلاک چه کاری می‌کند؟</summary>
        <div class="ll-row" id="ctClkTabs" style="margin:8px 0;flex-wrap:wrap">${Object.keys(CT_CLK).filter(k => k !== 'apb').map((k, i) => `<button type="button" class="sim-btn${i ? ' sim-btn-ghost' : ''}" data-clk="${k}" aria-pressed="${!i}">${CT_CLK[k].mid[0]}</button>`).join('')}</div>
        <div id="ctClkBox">${ctClkView('hse')}</div>
      </details>
      <details class="hs-det">
        <summary>🚌 باس (Bus) چیست؟ AHB و APB</summary>
        <div class="hs-p">⚠️ <b>APB کلاک نیست؛ یک «باس» (جاده) است.</b> کلاکِ این جاده‌ها همان <b>PCLK1</b> و <b>PCLK2</b> است که بالا دیدی.</div>
        ${ctClkView('apb')}
      </details>
      ${block('ctG1', head('pll', '① PLL: ۸ مگاهرتز را تقویت کن', 'ضریب ' + sel('pll', CT_PLL_OPTS, '×')))}
      ${block('ctG2', head('apb1', '② باسِ APB1 و تایمرهای TIM2/3/4', 'تقسیم ' + sel('a1', CT_DIV_OPTS, '÷')))}
      ${block('ctG3', head('apb2', '③ باسِ APB2 و تایمرِ TIM1', 'تقسیم ' + sel('a2', CT_DIV_OPTS, '÷')))}
      <div class="ct-sc">
        <div class="ct-sc-h"><b>🧩 مسیرِ کاملِ کلاک: از کریستال تا تایمر</b></div>
        <div class="ct-sc-h" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px"><button type="button" class="sim-btn sim-btn-ghost st-reset" id="ctReset" style="margin:0;flex:0 0 auto">↺ از اول</button><label class="ct-ctl">PSC ${sel('psc', Array.from({ length: 12 }, (_, i) => i), '=')}</label><label class="ct-ctl">APB2 ${sel('a2', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">APB1 ${sel('a1', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">PLL ${sel('pll', CT_PLL_OPTS, '×')}</label></div>
        <div class="hs-p ct-cap">این صفحه یک شبیه‌ساز مکانیکی از سیستم تقسیم و ضرب کلاک میکروکنترلر است. کلاک از چپ وارد می‌شود، از مسیرهای مختلف عبور می‌کند و شما با دستکاری چرخ‌دنده‌های ضریب (✎)، سرعت چرخش و فرکانس نهایی هر بخش را به شکل زنده و حرکتی تنظیم و مشاهده می‌کنید</div>
        <div class="ct-scroll" dir="ltr"><svg class="ct-svg ct-wide" id="ctGA" viewBox="0 0 720 300"></svg></div>
        <div class="ct-rel" id="ctGAR"></div>
      </div>
      <details class="hs-det">
        <summary>🗺️ نقشه‌ی کاملِ درخت کلاک (بقیه‌ی بخش‌ها هم هست!)</summary>
        <div class="hs-p">چرخ‌دنده‌های بالا فقط <b>مسیرِ اصلی</b> را نشان می‌دهند (جعبه‌های پررنگ). در چیپِ واقعی چند شاخه‌ی دیگر هم هست: <b>HSI</b> (کریستالِ داخلی)، <b>USB</b>، <b>ADC</b> (حداکثر ۱۴ مگاهرتز)، <b>SysTick</b> (مبنای HAL_Delay)، <b>MCO</b>، <b>RTC/IWDG</b> و <b>Flash Latency</b>. برای کارِ ما لازم نیست دستشان بزنی.</div>
        <div class="ct-scroll" dir="ltr">${ctFullTree()}</div>
      </details>
      <div class="sim-status" id="ctSt1" data-state="idle"></div>
      <div class="ct-stage-t">چرا کلاکِ باس را نصف کردند؟ (دلیلِ طراحی)</div>
      <div class="ct-explain"><b>طراحانِ STM32 با یک تضاد روبه‌رو بودند:</b><br>
        ۱) <b>باسِ APB1 تحملِ سرعتِ زیاد را ندارد.</b> قطعاتی مثل I2C و UART و CAN بیش از ۳۶ مگاهرتز نمی‌توانند کار کنند؛ مصرفِ انرژی بالا می‌رود و سیگنالِ دیجیتال خطا پیدا می‌کند.<br>
        ۲) <b>تایمر به سرعتِ بالا نیاز دارد.</b> تایمرها قلبِ ساختنِ PWM و اندازه‌گیریِ زمان‌اند؛ اگر کلاکشان نصف شود، دقتشان (Resolution) هم نصف می‌شود.<br>
        <b>راه‌حل:</b> یک سوئیچِ خودکار در سخت‌افزار گذاشتند: «اگر تقسیم‌کننده‌ی APB برابر ۱ بود، کلاکِ تایمر همان کلاکِ باس است؛ اگر بزرگ‌تر از ۱ بود (مثلاً ۲)، کلاکِ تایمر را دو برابر کن.»</div>
      <div class="ct-sc">
        <div class="ct-sc-h"><b data-talk="busq">🧪 آزمایش : اگر باسِ APB1 را تندتر از ۳۶ بچرخانیم</b></div>
        <div class="ct-sc-h"><label class="ct-ctl">APB1 ${sel('a1', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">PLL ${sel('pll', CT_PLL_OPTS, '×')}</label></div>
        <canvas class="ct-cv" id="ctBus"></canvas>
        <div class="ct-rel" id="ctBusR"></div>
        <div class="ct-devs" id="ctDevs"></div>
      </div>

      ${ctProtoView()}
      <div class="ct-stage-t">⏲️ بخش ۳ — تایمر را تنظیم کن</div>
      <div class="hs-p" data-v="src"></div>
      ${block('ctG4', head('psc', '④ Prescaler: گیربکسِ ضربه‌ها'), row('psc', 'Prescaler (PSC)', 0, 11) + '<div class="ct-rel">❓ چرا PSC می‌تواند ۰ باشد؟ چون سخت‌افزار بر (PSC+۱) تقسیم می‌کند، پس هیچ‌وقت تقسیم بر صفر نمی‌شود: PSC=۰ یعنی ÷۱.</div>')}
      ${block('ctD1', head('arr', '⑤ شمارنده: صفحه‌ی گرد'), row('arr', 'Period (ARR)', 1, 1023) + '<div class="ct-rel">❓ چرا از ۱ شروع می‌شود؟ ARR=۰ یعنی فقط ۱ خانه؛ عقربه جایی برای حرکت ندارد و PWM فقط می‌تواند ۰٪ یا ۱۰۰٪ باشد.</div>' + pre([['۷', 'arr:7'], ['۱۵', 'arr:15'], ['۲۵۵', 'arr:255'], ['۱۰۲۳', 'arr:1023']]))}

      <div class="ct-explain"><b>⚠️ معایب و نکته‌های تایمر (هیچ چیز رایگان نیست):</b><br>
        ۱) <b>راه‌اندازی پیچیده‌تر است:</b> به‌جای یک خط delay باید Prescaler، Period، کلاکِ تایمر و گاهی وقفه (NVIC) را درست تنظیم کنی. یک خطا، مثلاً فراموش کردنِ «+۱» در PSC یا غلط گرفتنِ کلاکِ تایمر، زمان یا فرکانس را اشتباه می‌کند.<br>
        ۲) <b>تعداد تایمرها محدود است:</b> STM32F103 فقط چند تایمرِ همه‌منظوره دارد (TIM1 تا TIM4). هر تایمر هم کانال‌های مشخصی دارد و هر پین فقط به بعضی کانال‌ها وصل می‌شود، پس همه‌چیز را نمی‌شود هر جا گذاشت.<br>
        ۳) <b>کانال‌های یک تایمر یک Period مشترک دارند:</b> چند خروجیِ PWM روی یک تایمر هم‌فرکانس‌اند و فقط Pulseشان می‌تواند فرق کند.<br>
        ۴) <b>شمارنده محدود است:</b> PSC و ARR هر دو ۱۶ بیتی‌اند (حداکثر ۶۵۵۳۶). با کلاکِ ۷۲ مگاهرتز بیشترین زمانِ یک دور حدود ۶۰ ثانیه است؛ برای زمان‌های بلندتر باید در وقفه شمرد.<br>
        ۵) <b>فرکانس و دقت با هم معامله دارند:</b> دیوتی فقط به اندازه‌ی (ARR+۱) مرحله تقسیم می‌شود. فرکانسِ بالا یعنی ARR کوچک و پله‌های درشت‌تر؛ مثلاً با ARR=۱۵ فقط ۱۶ سطحِ سرعت داری.<br>
        ۶) <b>کدِ وقفه باید کوتاه باشد:</b> اگر تایمر وقفه بدهد و داخلش کارِ سنگین بکنی، همان مشکلِ delay دوباره برمی‌گردد و بقیه‌ی برنامه گیر می‌کند.<br>
        <b>جمع‌بندی:</b> برای یک تأخیرِ کوتاه و ساده در برنامه‌ی کوچک، delay کافی است. برای کارِ دقیق، هم‌زمان یا تکرارشونده مثل PWM و اندازه‌گیریِ زمان، تایمر مناسب‌تر است.</div>

      <div class="ct-stage-t">💡 بخش ۴ — PWM یعنی چی؟</div>
      <div class="ct-explain"><b>PWM یعنی یک پین را خیلی سریع روشن و خاموش کنیم.</b> موتور آن‌قدر کُند است که تک‌تک چشمک‌ها را حس نمی‌کند و فقط «میانگین» را می‌بیند. مثلاً نیمی از دور روشن = نصفِ ولتاژ = نصفِ سرعت. روشن‌ماندن را همان عقربه تعیین می‌کند: <b>روی کمانِ سبز (Pulse) پین روشن است و روی بقیه خاموش.</b></div>
      ${ctAnimPwmBox()}
      ${block('ctD2', head('pulse', '⑥ ناحیه‌ی سبز = بالا بودنِ موجِ PWM'), row('pulse', 'Pulse (CCR)', 0, 16) + pre([['۲۵٪', 'duty:25'], ['۵۰٪', 'duty:50'], ['۷۵٪', 'duty:75'], ['۱۰۰٪', 'duty:100']]), '<canvas class="ct-cv ct-pw" id="ctPw" data-talk="wave"></canvas>')}
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
      <div class="ct-sc">
        <div class="ct-sc-h"><b data-talk="car">🚗 PWM را با کد بساز و موتور را بچرخان</b></div>
        <div class="ct-explain"><b>برای اینکه موتور بچرخد سه کار لازم است:</b><br>
          ۱) در CubeMX پایه‌ی PA8 را <b dir="ltr">TIM1_CH1</b> بگذار و Prescaler و Period را بنویس؛ خطِ ${ctInl('MX_TIM1_Init();')} را CubeMX خودش می‌سازد.<br>
          ۲) در کد یک‌بار ${ctInl('HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);')} را صدا بزن تا تایمر روی PA8 موج بفرستد.<br>
          ۳) با ${ctInl('__HAL_TIM_SET_COMPARE(...)')} عددِ Pulse را بنویس؛ هرچه بزرگ‌تر، موتور تندتر.<br>
          <b>نکته:</b> بعد از این‌ها حلقه‌ی while می‌تواند خالی بماند، چون PWM را سخت‌افزار می‌سازد و CPU آزاد است؛ همان فایده‌ی تایمر نسبت به delay.<br>
          <b>امتحان کن:</b> روی هر خطِ طلایی بزن تا کامنت شود و ببین ماشین چه می‌کند؛ Pulse را هم عوض کن و عددِ داخلِ کد را تماشا کن.</div>
        ${row('pulse', 'Pulse (CCR) = عددِ داخلِ کد', 0, 16)}
        ${pre([['۰٪', 'duty:0'], ['۲۵٪', 'duty:25'], ['۵۰٪', 'duty:50'], ['۷۵٪', 'duty:75'], ['۱۰۰٪', 'duty:100']])}
        <div id="ctPmCode"></div>
        <svg id="ctCar" data-talk="car" viewBox="0 0 360 138" role="img" aria-label="N20 motor" style="direction:ltr;display:block;width:100%;max-width:480px;margin:8px auto;background:#10151f;border:1px solid #2a3040;border-radius:12px"></svg>
        <div class="ct-rel" id="ctPmR"></div>
      </div>
      <div class="sim-status" id="ctSt2" data-state="idle"></div>
    </div>`;

  const q = s => container.querySelector(s), qa = s => container.querySelectorAll(s);
  const ac = new AbortController(), sig = { signal: ac.signal };
  const listen = (t, f) => container.addEventListener(t, f, sig);
  const cv = q('#ctCv'), g = cv.getContext('2d'), cvBus = q('#ctBus'), cvPw = q('#ctPw'), cvDl = q('#ctDl'), cvCar = q('#ctCar');
  const vis = new Map(), sizes = new Map();
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)), { rootMargin: '150px' }) : null;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(es => es.forEach(e => sizes.set(e.target, e.contentRect.width))) : null;
  const seen = el => !io || vis.get(el) !== false;
  const widthOf = el => sizes.get(el) || el.clientWidth;
  qa('svg.ct-svg').forEach(el => io && io.observe(el));
  [cv, cvBus, cvPw, cvDl, cvCar].forEach(el => { io && io.observe(el); ro && ro.observe(el); });
  const st = { ...CT_INIT };
  const done = { pll: false, apb: false, pwm: false };
  let succeeded = !!alreadyDone, raf = 0, last = 0, tp = 0, revT = 3.2, scenes = [], dials = [];
  const angs = {};
  const dl = { D: CT_INIT.dlD, C: 40, t: 0, press: 0, a: 0, evs: [] };
  const pm = { cube: true, start: true, cmp: true, v: 0, x: 0 };   // سه خطِ برنامه‌ی PWM + سرعت و جای ماشین

  const say = (n, state, text) => { const el = q('#ctSt' + n); el.dataset.state = state; el.textContent = text; };
  const knight = k => { if(typeof showKnightLine === 'function') showKnightLine(CT_TALK[k], 'happy', 'knight'); };

  const clocks = () => {
    const sys = ctPllIn(st) * st.pll, p1 = sys / st.a1, p2 = sys / st.a2;
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
    const hse = st.src
      ? ctNode('hsi', 'HSI', CT_HSE, 'hse', { edit: 'src', warn: 'warn_hsi' })
      : ctNode('hse', 'HSE', CT_HSE, 'hse', { edit: 'src' });
    const sys = ctNode('sys', 'SYSCLK', c.sys, 'sys', { uses: ['هسته‌ی CPU'] });
    const hclk = ctNode('hclk', 'HCLK', c.sys, 'sys');
    const p1 = ctNode('pclk1', 'PCLK1', c.p1, 'pclk', { bad: b1, uses: ['I2C · UART2 · CAN'], badUses: ['✖ I2C · UART2 · CAN', 'ارتباط خراب می‌شود'] });
    const p2 = ctNode('pclk2', 'PCLK2', c.p2, 'pclk', { bad: b2, uses: ['UART1 · SPI1 · ADC'], badUses: ['✖ UART1 · SPI1 · ADC', 'ارتباط خراب می‌شود'] });
    const t1 = ctNode('t1', 'TIM2/3/4', c.t1, 'tim', { bad: c.t1 > 72, uses: ['PWM و زمان‌سنجی'] });
    const t2 = ctNode('t2', 'TIM1', c.t2, 'tim', { bad: c.t2 > 72, uses: ['PWM موتور'] });
    const cnt = ctNode('tick', 'شمارنده', tick, 'psc');
    const pll = ctOp('pll', 'PLL', '×', st.pll, ctPllIn(st), c.sys, 'sys', { edit: 'pll', warn: st.pll !== 9 && !st.src && 'warn_pll' });
    const ahb = ctOp('ahb', 'AHB', '÷', 1, c.sys, c.sys, 'sys');
    const apb1 = ctOp('apb1', 'APB1', '÷', st.a1, c.sys, c.p1, 'pclk', { bad: b1, edit: 'a1', warn: st.a1 !== 2 && 'warn_a1' });
    const apb2 = ctOp('apb2', 'APB2', '÷', st.a2, c.sys, c.p2, 'pclk', { bad: b2, edit: 'a2', warn: st.a2 !== 1 && 'warn_a2' });
    const mul1 = ctOp('tmul', 'ضریبِ تایمر', '×', st.a1 === 1 ? 1 : 2, c.p1, c.t1, 'tim');
    const mul2 = ctOp('tmul', 'ضریبِ تایمر', '×', st.a2 === 1 ? 1 : 2, c.p2, c.t2, 'tim');
    const psc = ctOp('psc', 'PSC', '÷', st.psc + 1, c.t2, tick, 'psc', { edit: 'psc' });
    const fin = n => ({ ...n, final: true });
    const pre = st.src ? [ctOp('hdiv', 'HSI', '÷', 2, CT_HSE, CT_HSE / 2, 'sys')] : [];
    scenes = [
      ctFlow(q('#ctG1'), [hse, ...pre, pll, fin(sys)]),
      ctFlow(q('#ctG2'), [sys, apb1, p1, mul1, fin(t1)]),
      ctFlow(q('#ctG3'), [sys, apb2, p2, mul2, fin(t2)]),
      ctFlow(q('#ctG4'), [t2, psc, fin(cnt)]),
      ctFlow(q('#ctGA'), [hse, ...pre, pll, { ...sys, uses: [] }, ahb, { ...hclk, uses: ['CPU \xb7 Flash \xb7 RAM'] }], [[apb1, p1, mul1, fin(t1), { ...psc, inM: c.t1, outM: c.t1 / (st.psc + 1) }, fin({ ...cnt, mhz: c.t1 / (st.psc + 1) })], [apb2, p2, mul2, fin(t2), psc, fin(cnt)]], true)
    ];
    [c.sys, c.p1, c.p2, tick, (c.p1 + c.p2 + tick) / 3].forEach((v, i) => { scenes[i].mhz = v; });
    q('#ctG1R').innerHTML = `<div>چرخ‌دنده‌ی PLL ورودی را ${ctFa(st.pll)} برابر می‌کند: ${fa(ctPllIn(st))} × ${ctFa(st.pll)} = <b>${ctHz(c.sys * 1e6)}</b></div>`;
    const laneTxt = (a, apb, pc, tm, tn) => `<div>چرخ‌دنده‌ی ${apb} تقسیم می‌کند: ${fa(c.sys)} ÷ ${ctFa(a)} = ${ctHz(pc * 1e6)}</div>`
      + `<div>${a === 1 ? 'چون تقسیم‌کننده ۱ است، ضریبِ تایمر ×۱ می‌ماند' : 'چون تقسیم‌کننده ۱ نیست، چرخ‌دنده‌ی «ضریبِ تایمر» آن را ×۲ می‌کند'}: ${fa(pc)} × ${a === 1 ? '۱' : '۲'} = <b>${ctHz(tm * 1e6)}</b> (${tn})</div>`;
    q('#ctG2R').innerHTML = laneTxt(st.a1, 'APB1', c.p1, c.t1, 'کلاکِ تایمرهای TIM2/3/4');
    q('#ctG3R').innerHTML = laneTxt(st.a2, 'APB2', c.p2, c.t2, 'کلاکِ تایمرِ TIM1');
    q('#ctG4R').innerHTML = `<div>چرخ‌دنده‌ی PSC کلاکِ تایمر را بر ${ctFa(st.psc + 1)} تقسیم می‌کند: ${ctHz(m.tclk)} ÷ ${ctFa(st.psc + 1)} = <b>${ctHz(m.tick)}</b></div>`
      + `<div>یعنی عقربه‌ی شمارنده هر <b>${ctTime(1 / m.tick)}</b> یک خانه جلو می‌رود (${ctFa(Math.round(m.tick))} خانه در ثانیه).</div>`;
    q('#ctGAR').innerHTML = `<div><b>جواب نهایی:</b> کلاکِ تایمرهای TIM2/3/4 = <b>${ctHz(c.t1 * 1e6)}</b> ، کلاکِ TIM1 = <b>${ctHz(c.t2 * 1e6)}</b> و شمارنده‌ی TIM1 بعد از Prescaler با <b>${ctHz(m.tick)}</b> می‌شمارد.</div>`
      + `<div>مسیرِ TIM1: ${st.src ? fa(CT_HSE) + ' ÷۲ ⇒ ' + fa(ctPllIn(st)) : fa(CT_HSE)} ×${ctFa(st.pll)} ⇒ ${fa(c.sys)} ÷${ctFa(st.a2)} ⇒ ${fa(c.p2)} ×${st.a2 === 1 ? '۱' : '۲'} ⇒ ${fa(c.t2)} ÷${ctFa(st.psc + 1)} ⇒ ${fa(tick)}</div>`;
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
    dl.t += dt * 1000;
    pm.v += (pmDuty() - pm.v) * Math.min(1, dt * 4);   // موتور کم‌کم تند و کُند می‌شود
    pm.x += dt * pm.v * 180;
    scenes.forEach(sc => {
      angs[sc.id] = (angs[sc.id] || 0) + CT_W * 2 * Math.sqrt(sc.mhz / CT_HSE) * dt;
      if(!seen(sc.svg)) return;
      sc.gears.forEach(gr => {
        const pr = sc.gears[gr.par];
        gr.ang = pr ? ctMeshAt(pr.T, gr.T, pr.ang, gr.phi) : angs[sc.id];
        const t = `rotate(${(gr.ang * 57.2958).toFixed(1)})`;
        if(t !== gr.t){ gr.t = t; gr.el.setAttribute('transform', t); }
      });
    });
    const steps = st.arr + 1, fr = (tp / revT) % 1, cnt = Math.min(steps - 1, Math.floor(fr * steps));
    const ang = (steps <= 64 ? (cnt + .5) / steps : fr) * 360;
    dials.forEach(d => {
      if(!seen(d.svg)) return;
      const t = `rotate(${ang.toFixed(1)})`;
      if(t !== d.t){ d.t = t; d.ptr.setAttribute('transform', t); }
      if(cnt !== d.n){ d.n = cnt; d.cnt.textContent = ctFa(cnt); }
      if(d.lamp){ const on = cnt < st.pulse; if(on !== d.on){ d.on = on; d.lamp.setAttribute('class', 'ct-lamp' + (on ? ' on' : '')); } }
    });
  }

  function paintChips(){
    const keys = ['pll', 'apb', 'pwm'], next = keys.find(k => !done[k]);
    qa('.st-chip').forEach(c => { c.classList.toggle('ok', done[c.dataset.s]); c.classList.toggle('next', c.dataset.s === next); });
  }

  function paintTimer(){
    const m = pwm(), out = (k, t) => { q(`[data-o="${k}"]`).textContent = t; };
    q('[data-v="src"]').textContent = `ورودیِ این بخش: کلاکِ تایمرِ TIM1 = ${ctHz(m.tclk)} (از بخش ۲)`;
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
    if(st.src) return say('1', 'running', `منبعِ کلاک الان HSI است: ۸ ÷ ۲ = ۴ مگاهرتز وارد PLL می‌شود و SYSCLK می‌شود ${ctHz(c.sys * 1e6)}. حتی با ×۹ فقط ۳۶ می‌شود. برای ۷۲ مگاهرتز با ✎ روی چرخ‌دنده‌ی اول، منبع را به HSE برگردان.`);
    if(!done.pll) return say('1', 'running', `SYSCLK الان ${ctHz(c.sys * 1e6)} است. برای ۷۲ مگاهرتز ضریبِ PLL را روی ×۹ بگذار تا چرخ‌دنده‌ی PLL عددِ ۸ را ۹ برابر کند (۸ × ۹).`);
    if(!done.apb) return say('1', 'running', '👌 کلاکِ چیپ ۷۲ مگاهرتز شد. حالا APB1 را روی ÷۲ بگذار و به چرخ‌دنده‌ی «ضریبِ تایمر» نگاه کن: PCLK1 می‌شود ۳۶ ولی تایمر دوباره ۷۲!');
    if(!std) return say('1', 'running', `APB1 روی ÷${ctFa(st.a1)}: PCLK1 = ${ctHz(c.p1 * 1e6)} و کلاکِ تایمرهای APB1 = ${ctHz(c.t1 * 1e6)}.`);
    say('1', 'success', '✅ کلاک درست است. با منوها بازی کن و ببین چرخ‌دنده‌ها چطور تغییر می‌کنند.');
  }

  function sayTimer(){
    const m = pwm(), f = m.freq;
    const note = m.tclk === 72e6 ? '' : ` (کلاکِ ورودیِ تایمر الان ${ctHz(m.tclk)} است؛ بخش ۲ را کامل کن.)`;
    if(pwmOk()){
      const exact = st.psc === 8 && st.arr === 255 ? ' دقیقاً همان تنظیمِ CubeMX: Prescaler = ۸ و Period = ۲۵۵.' : '';
      const rest = done.apb ? '' : ' بخش ۲ هم هنوز مانده است.';
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
    if(succeeded || !(done.pll && done.apb && done.pwm)) return false;
    succeeded = true;
    if(onSuccess) onSuccess();
    return true;
  }

  function refresh(){
    qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; }); buildScenes(); const fin = checkDone(); paintTimer(); paintLab(); say1(); sayTimer();
    if(dl.D !== st.dlD){ dl.D = st.dlD; dlReset(); }
    paintDl(); paintPm();
    if(fin) say('2', 'success', CT_FINISH);
  }

  function syncInputs(except){
    qa('input[data-k]').forEach(i => { if(i !== except) i.value = st[i.dataset.k]; });
  }

  function reset(){
    Object.assign(st, CT_INIT);
    Object.assign(pm, { cube: true, start: true, cmp: true });
    Object.keys(done).forEach(k => { done[k] = false; });
    qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; });
    syncInputs(null);
    refresh();
  }

  const EDIT = {
    pll: { t: 'PLL', sym: '×', list: CT_PLL_OPTS.map(v => [v, v]) },
    a1:  { t: 'APB1', sym: '÷', list: CT_DIV_OPTS.map(v => [v, v]) },
    a2:  { t: 'APB2', sym: '÷', list: CT_DIV_OPTS.map(v => [v, v]) },
    psc: { t: 'Prescaler', sym: '÷', list: Array.from({ length: 12 }, (_, i) => [i, i + 1]) },
    src: { t: 'منبعِ کلاک', sym: '', cols: 2, msg: 'HSE کریستالِ بیرونی، HSI اسیلاتورِ داخلی', list: [[0, 'HSE'], [1, 'HSI']] }
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
    pop.innerHTML = `<div style="font-size:12px;margin-bottom:8px"><b>${def.t}</b> — ${def.msg || 'ضریب را انتخاب کن'}${k === 'psc' ? ' (عددِ PSC یکی کمتر از تقسیم است)' : ''}</div>`
      + `<div style="display:grid;direction:ltr;grid-template-columns:repeat(${def.cols || 4},1fr);gap:6px">${def.list.map(btn).join('')}</div>`;
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
    const ps = e.target.closest('#ctPwmS');
    if(ps){ q('#ctPwmA').innerHTML = ctAnimPwm(+ps.value / 100); return; }
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

  /* دکمه‌ی انتخاب‌شده همیشه پررنگ می‌ماند (مستقل از hover و focus) */
  const selBtn = (b, on) => {
    b.classList.toggle('sim-btn-ghost', !on); b.setAttribute('aria-pressed', on);
    b.style.background = on ? '#d4af37' : ''; b.style.color = on ? '#14161c' : '';
    b.style.borderColor = on ? '#d4af37' : ''; b.style.fontWeight = on ? '700' : '';
    b.blur();
  };
  container.querySelectorAll('[data-dlm], [data-clk]').forEach(b => selBtn(b, b.getAttribute('aria-pressed') === 'true'));

  listen('click', e => {
    const ed = e.target.closest('[data-edit]');
    if(ed){ if(ed.dataset.warn) knight(ed.dataset.warn); openPop(ed); return; }
    const pr = e.target.closest('[data-preset]');
    if(pr){
      const [k, v] = pr.dataset.preset.split(':');
      if(k === 'arr'){ st.arr = +v; st.pulse = Math.min(st.pulse, st.arr + 1); }
      else st.pulse = Math.round((st.arr + 1) * +v / 100);
      syncInputs(null); refresh(); return;
    }
    if(e.target.closest('#ctReset')){ reset(); return; }
    const pk = e.target.closest('[data-pm]');
    if(pk){ pm[pk.dataset.pm] = !pm[pk.dataset.pm]; paintPm(); return; }
    const ck = e.target.closest('[data-clk]');
    if(ck){
      container.querySelectorAll('[data-clk]').forEach(b => selBtn(b, b === ck));
      q('#ctClkBox').innerHTML = ctClkView(ck.dataset.clk);
      return;
    }
    const dm = e.target.closest('[data-dlm]');
    if(dm){
      container.querySelectorAll('[data-dlm]').forEach(b => selBtn(b, b === dm));
      q('#ctDlm1').hidden = dm.dataset.dlm !== '1';
      q('#ctDlm2').hidden = dm.dataset.dlm !== '2';
      q('#ctDlm3').hidden = dm.dataset.dlm !== '3';
      return;
    }
    if(e.target.closest('#ctPress')){ press(); return; }
    if(e.target.closest('#ctDlReset')){ dlReset(); paintDl(); return; }
    if(e.target.closest('#ctDl')){ knight(e.clientY - cvDl.getBoundingClientRect().top < 85 ? 'dly' : 'dlt'); return; }
    const t = e.target.closest('[data-talk]');
    if(t && !e.target.closest('select, input, label')) knight(t.dataset.talk);
  });

  function drawWave(){
    const w = widthOf(cv), h = 170;
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

    const phase = (tp / revT) % n, fr = phase % 1, xc = x0 + phase * pw, cnt = Math.min(steps - 1, Math.floor(fr * steps)), hi = cnt < st.pulse;
    const yc = base - fr * (base - top), yp = hi ? yH : yL;
    g.lineWidth = 1; g.strokeStyle = 'rgba(232,226,208,.25)'; g.beginPath(); g.moveTo(xc, top - 4); g.lineTo(xc, yL + 6); g.stroke();
    g.fillStyle = '#e79a54'; dot(xc, yc);
    g.fillStyle = hi ? '#57d8a3' : '#6b7280'; dot(xc, yp);

    /* برچسبِ نقطه‌ها: بالا «عدد» (مقدارِ شمارنده)، پایین «پایه» (وضعیتِ پینِ PA8: ۱ یا ۰) */
    const tag = (txt, color, x, y, flip) => {
      g.save();
      g.direction = 'rtl'; g.font = '700 12px JetBrains Mono, sans-serif';
      const tw = g.measureText(txt).width, padX = 5;
      let bx = flip ? x + 10 : x - 10 - tw - padX * 2;           // flip=true ⇒ سمتِ راستِ نقطه
      if(bx < 2) bx = x + 10;                                       // جا نبود ⇒ بیا سمتِ راست
      if(bx + tw + padX * 2 > w - 2) bx = x - 10 - tw - padX * 2;   // باز هم جا نبود ⇒ سمتِ چپ
      const by = y - 22, bw = tw + padX * 2, bh = 18;
      g.fillStyle = 'rgba(16,21,31,.92)'; g.strokeStyle = color; g.lineWidth = 1.2;
      g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, 6) : g.rect(bx, by, bw, bh); g.fill(); g.stroke();
      g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(txt, bx + bw / 2, by + bh / 2 + .5);
      g.restore();
    };
    tag(`عدد = ${ctFa(cnt)}`, '#e79a54', xc, yc, false);
    tag(`پایه = ${hi ? '۱ (HIGH)' : '۰ (LOW)'}`,hi ? '#57d8a3' : '#9aa3b5', xc, yp, false);
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
    const cb = cvBus, w = widthOf(cb), h = 170;
    if(!w) return;
    const dpr = window.devicePixelRatio || 1, gx = cb.getContext('2d');
    if(cb.width !== Math.round(w * dpr) || cb.height !== Math.round(h * dpr)){ cb.width = Math.round(w * dpr); cb.height = Math.round(h * dpr); }
    gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, w, h);
    const f = clocks().p1, T = 1000 / f, ok = busQ(f).ok, x0 = 46, x1 = w - 10, top = 22, bot = 142;
    const X = u => x0 + u / (4 * T) * (x1 - x0), Y = v => bot - v * (bot - top);
    const tgt = t => (t % T) < T / 2 ? 1 : 0, off = ((tp * .25) % 1) * T, tw = 2 * T + off;
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
    const cp = cvPw, w = widthOf(cp), h = 170;
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

  /* آزمایشِ delay در برابر تایمر: هر دور = D میلی‌ثانیه گیر کردن + C میلی‌ثانیه نگاه به دکمه؛ تایمر همان دوره را بدون گیر کردن اجرا می‌کند */
  function dlReset(){ dl.press = 0; dl.a = 0; dl.evs = []; }

  function press(){
    const T = dl.D + dl.C, ok = dl.t % T >= dl.D;
    dl.press++;
    if(ok) dl.a++;
    dl.evs = dl.evs.filter(ev => ev.t > dl.t - 60000);
    dl.evs.push({ t: dl.t, ok });
    paintDl();
  }

  function paintDl(){
    const T = dl.D + dl.C, N = dl.press, A = dl.a, el = q('#ctDlR');
    if(!el) return;
    el.innerHTML = N
      ? `<div>روش delay: <b style="color:${A === N ? '#57d8a3' : '#ff6b6b'}">${ctFa(A)} از ${ctFa(N)}</b> دکمه را دید${A === N ? '' : '؛ بقیه گم شدند ✖'}</div>`
        + `<div>روش تایمر: <b style="color:#57d8a3">${ctFa(N)} از ${ctFa(N)}</b> دکمه را دید ✔ (CPU آزاد بود)</div>`
        + `<div>delay فقط ${ctFa(dl.C)} میلی‌ثانیه از هر ${ctFa(T)} میلی‌ثانیه به دکمه نگاه می‌کند، یعنی ${ctNum(dl.C / T * 100)}٪ از وقت.</div>`
        + (dl.D > 200 ? '<div>نکته: delay را کوچک‌تر کنی شانس بیشتر می‌شود، ولی LED تندتر چشمک می‌زند و هنوز هم دکمه‌ها گم می‌شوند.</div>' : '')
      : `<div>هنوز دکمه نزده‌ای. چند بار «🔘 دکمه را بزن» را بزن، یک بار وسطِ نوارِ قرمز و یک بار هر وقت خواستی.</div><div>delay الان ${ctFa(dl.D)} میلی‌ثانیه گیر می‌کند و ${ctFa(dl.C)} میلی‌ثانیه به دکمه نگاه می‌کند.</div>`;
  }

  function drawDl(){
    const cb = cvDl, w = widthOf(cb), h = 170;
    if(!w) return;
    const dpr = window.devicePixelRatio || 1, gx = cb.getContext('2d');
    if(cb.width !== Math.round(w * dpr) || cb.height !== Math.round(h * dpr)){ cb.width = Math.round(w * dpr); cb.height = Math.round(h * dpr); }
    gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, w, h);
    const T = dl.D + dl.C, x0 = 50, x1 = w - 40, span = 3.2 * T, now = dl.t, t0 = now - span * .72;
    const X = t => x0 + (t - t0) / span * (x1 - x0), bh = 28, yA = 34, yB = 112;
    const box = (a, b, y, fill, stroke, minW) => {
      const l = Math.max(x0, a); let r = Math.min(x1, b);
      if(r <= l) return null;
      if(r - l < minW) r = Math.min(x1, l + minW);
      gx.fillStyle = fill; gx.fillRect(l, y, r - l, bh);
      gx.lineWidth = 1.2; gx.strokeStyle = stroke; gx.strokeRect(l + .5, y + .5, r - l - 1, bh - 1);
      return [l, r];
    };
    gx.font = '10px JetBrains Mono, monospace'; gx.textAlign = 'center';
    const k0 = Math.floor(t0 / T) - 1, k1 = Math.ceil((t0 + span) / T);
    for(let k = k0; k <= k1; k++){
      const s = k * T;
      const d = box(X(s), X(s + dl.D), yA, 'rgba(255,107,107,.28)', '#ff6b6b', 0);
      if(d && d[1] - d[0] > 54){ gx.fillStyle = '#ff8a80'; gx.fillText('blocked', (d[0] + d[1]) / 2, yA + 18); }
      box(X(s + dl.D), X(s + T), yA, 'rgba(87,216,163,.9)', '#57d8a3', 3);
      const f = box(X(s), X(s + T), yB, 'rgba(87,216,163,.16)', '#57d8a3', 0);
      if(f && f[1] - f[0] > 54){ gx.fillStyle = '#57d8a3'; gx.fillText('free', (f[0] + f[1]) / 2, yB + 18); }
      const tx = X(s);
      if(tx >= x0 && tx <= x1){ gx.fillStyle = '#d4af37'; gx.fillRect(tx - 1.5, yB - 3, 3, bh + 6); }
    }
    gx.font = '11px JetBrains Mono, monospace'; gx.textAlign = 'left'; gx.fillStyle = '#6b7280';
    gx.fillText('delay', 4, yA + 18); gx.fillText('Timer', 4, yB + 18);
    const on = Math.floor(now / T) % 2 === 0;
    [yA, yB].forEach(y => {
      gx.beginPath(); gx.arc(w - 20, y + bh / 2, 9, 0, 6.2832);
      gx.fillStyle = on ? '#57d8a3' : '#1d2330'; gx.fill();
      gx.lineWidth = 2; gx.strokeStyle = on ? '#9ff0cf' : '#3a4050'; gx.stroke();
    });
    gx.fillStyle = '#6b7280'; gx.textAlign = 'center'; gx.fillText('LED', w - 20, yA - 6); gx.fillText('LED', w - 20, yB - 6);
    const xn = X(now);
    gx.setLineDash([4, 4]); gx.lineWidth = 1; gx.strokeStyle = 'rgba(232,226,208,.45)';
    gx.beginPath(); gx.moveTo(xn, 14); gx.lineTo(xn, yB + bh + 10); gx.stroke(); gx.setLineDash([]);
    gx.fillStyle = '#8b93a5'; gx.fillText('now', xn, 10);
    dl.evs.forEach(ev => {
      const x = X(ev.t);
      if(x < x0 - 6) return;
      gx.globalAlpha = .5; gx.lineWidth = 1; gx.strokeStyle = '#e8e2d0';
      gx.beginPath(); gx.moveTo(x, yA - 4); gx.lineTo(x, yA); gx.moveTo(x, yB - 4); gx.lineTo(x, yB); gx.stroke(); gx.globalAlpha = 1;
      gx.font = '15px sans-serif'; gx.textAlign = 'center';
      gx.fillStyle = ev.ok ? '#57d8a3' : '#ff6b6b'; gx.fillText(ev.ok ? '✔' : '✖', x, yA - 8);
      gx.fillStyle = '#57d8a3'; gx.fillText('✔', x, yB - 8);
    });
  }

  /* ساختنِ PWM با کد: سه خطِ لازم (CubeMX، Start، SET_COMPARE)؛ هر کدام را کامنت کنی موتور نمی‌چرخد (مثلِ هشدارهای ادیتورِ HAL) */
  const pmDuty = () => (pm.cube && pm.start && pm.cmp) ? pwm().duty : 0;
  function pmLines(){
    const row = (k, t, c) => (pm[k] ? '  ' : '  // ') + t + (c ? '   // ' + c : '');
    return [
      'int main(void)', '{', '  HAL_Init();', '  SystemClock_Config();', '  MX_GPIO_Init();',
      row('cube', 'MX_TIM1_Init();', `CubeMX: PSC = ${st.psc}, Period = ${st.arr}`),
      '',
      row('start', 'HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);', 'شروع PWM روی PA8'),
      row('cmp', `__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, ${st.pulse});`, 'Pulse = سرعتِ موتور'),
      '', '  while (1)', '  {', '    // CPU آزاد است؛ PWM را سخت‌افزار می‌سازد', '  }', '}'
    ].join('\n');
  }

  function paintPm(){
    const el = q('#ctPmCode');
    if(!el) return;
    const m = pwm();
    el.innerHTML = ctCodeBlock('main.c — روی هر خطِ طلایی بزن تا کامنت شود', pmLines(), '#d4af37', { 5: 'cube', 7: 'start', 8: 'cmp' });
    const msg = !pm.cube ? `⚠️ ${ctInl('MX_TIM1_Init();')} صدا زده نمی‌شود؛ تایمر هیچ‌وقت تنظیم نشده و PA8 هنوز PWM نیست ⇒ خروجی ندارد و موتور نمی‌چرخد.`
      : !pm.start ? `⚠️ هنوز ${ctInl('HAL_TIM_PWM_Start')} صدا زده نشده؛ تا آن موقع خروجیِ PWM صفر است ⇒ موتور نمی‌چرخد.`
      : !pm.cmp ? `⚠️ بدونِ ${ctInl('__HAL_TIM_SET_COMPARE')} عددِ Pulse همان مقدارِ پیش‌فرضِ CubeMX (۰) می‌ماند ⇒ دیوتیِ ۰٪ و موتور نمی‌چرخد.`
      : `✅ PWM ${ctHz(m.freq)} با دیوتیِ <b>${ctNum(m.duty * 100)}٪</b> ⇒ ولتاژِ میانگین ≈ ${ctNum(CT_BATT * m.duty)} ولت ⇒ موتور با ${ctNum(m.duty * 100)}٪ سرعت می‌چرخد.`;
    q('#ctPmR').innerHTML = `<div>${msg}</div>` + (pmDuty() > 0 || (pm.cube && pm.start && pm.cmp) ? '<div>بعد از Start حلقه‌ی while خالی است: PWM را سخت‌افزار می‌سازد و CPU آزاد است.</div>' : '');
  }

  const ctRp = T => T * 5 / 6.2832;
  let mt = null;

  function buildMotor(){
    const f = n => n.toFixed(1);
    const rP = ctRp(8), r1 = ctRp(20), r2 = ctRp(16);
    const A1 = .5, A2 = 1.9, P0 = { x: 186, y: 58 };
    const G1 = { x: P0.x + (rP + r1) * Math.cos(A1), y: P0.y + (rP + r1) * Math.sin(A1) };
    const G2 = { x: G1.x + (rP + r2) * Math.cos(A2), y: G1.y + (rP + r2) * Math.sin(A2) };
    const WX = 300, WR = 32, sy = G2.y;
    const gear = (T, fill, stroke) => '<path d="' + ctTeeth(T, ctRp(T)).d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".9" stroke-linejoin="round"/>';
    const holes = (n, r, hr) => Array.from({ length: n }, (_, k) => { const a = k * 6.2832 / n; return '<circle cx="' + f(r * Math.cos(a)) + '" cy="' + f(r * Math.sin(a)) + '" r="' + hr + '" fill="#10151f"/>'; }).join('');
    const at = (p, key, inner) => '<g transform="translate(' + f(p.x) + ' ' + f(p.y) + ')"><g data-' + key + '>' + inner + '</g></g>';
    const screw = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="#c9ced8" stroke="#5a430f" stroke-width=".8"/><line x1="' + (x - 2.2) + '" y1="' + (y - 2.2) + '" x2="' + (x + 2.2) + '" y2="' + (y + 2.2) + '" stroke="#5a430f" stroke-width=".9"/>';
    const mono = 'style="font-family:JetBrains Mono,monospace;direction:ltr;unicode-bidi:bidi-override"';
    const polar = (n, r1_, r2_, extra) => Array.from({ length: n }, (_, k) => { const a = k * 6.2832 / n, c = Math.cos(a), sn = Math.sin(a); return '<line x1="' + f(c * r1_) + '" y1="' + f(sn * r1_) + '" x2="' + f(c * r2_) + '" y2="' + f(sn * r2_) + '" ' + extra + '/>'; }).join('');
    const wheel = '<circle r="' + WR + '" fill="#1b1e26" stroke="#0b0d11" stroke-width="1"/>'            /* بدنه‌ی تایر */
      + polar(18, WR - 5, WR - .6, 'stroke="#3d4352" stroke-width="3.2"')                                 /* آج تایر */
      + '<circle r="' + (WR - 5.5) + '" fill="none" stroke="#2c3140" stroke-width="1"/>'
      + '<circle r="22" fill="#9aa3b5" stroke="#5b6475" stroke-width="1.2"/>'                            /* رینگ */
      + holes(5, 14.5, 5.2)                                                                                /* پنجره‌های رینگ */
      + polar(5, 7, 10, 'stroke="#8d96a6" stroke-width="3.4" stroke-linecap="round" transform="rotate(36)"')
      + '<circle r="7.2" fill="#d4af37" stroke="#5a430f" stroke-width="1"/><circle r="2.6" fill="#3a4050"/>'  /* توپی */
      + '<circle cx="0" cy="-' + (WR - 2.6) + '" r="1.9" fill="#e79a54"/>';                              /* نشانه‌ی چرخش */
    cvCar.innerHTML = '<defs>'
      + '<linearGradient id="ctMtMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f6"/><stop offset=".3" stop-color="#c3cad6"/><stop offset=".7" stop-color="#8d96a6"/><stop offset="1" stop-color="#586071"/></linearGradient>'
      + '<linearGradient id="ctMtBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d27c"/><stop offset=".5" stop-color="#c39a38"/><stop offset="1" stop-color="#85651c"/></linearGradient>'
      + '<linearGradient id="ctMtShaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset=".5" stop-color="#b4bcc9"/><stop offset="1" stop-color="#6e7686"/></linearGradient>'
      + '<linearGradient id="ctMtGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
      + '</defs>'
      + '<g data-root transform="translate(12 12)">'
      + '<ellipse cx="170" cy="119" rx="140" ry="4" fill="#000" opacity=".28"/>'
      /* سیم‌های موتور */
      + '<path d="M16 45.5H4" stroke="#e0483e" stroke-width="3" stroke-linecap="round"/><path d="M16 67.5H4" stroke="#8b93a5" stroke-width="3" stroke-linecap="round"/>'
      + '<text x="3" y="40" font-size="10" font-weight="700" fill="#e0483e" ' + mono + '>+</text><text x="3" y="63" font-size="10" font-weight="700" fill="#8b93a5" ' + mono + '>−</text>'
      /* ترمینال‌ها، درپوش و بدنه */
      + '<rect x="14" y="43" width="18" height="5" rx="1.5" fill="#c9ced8" stroke="#3a4050" stroke-width=".8"/>'
      + '<rect x="14" y="65" width="18" height="5" rx="1.5" fill="#c9ced8" stroke="#3a4050" stroke-width=".8"/>'
      + '<rect x="28" y="31" width="16" height="54" rx="4" fill="#2b2f3a" stroke="#14161c"/>'
      + '<circle cx="36" cy="58" r="4.6" fill="#161922" stroke="#3a4050" stroke-width=".8"/><circle cx="36" cy="58" r="1.8" fill="#6b7280"/>'
      + '<rect x="42" y="28" width="130" height="60" rx="7" fill="url(#ctMtMetal)" stroke="#2a3040"/>'
      + '<rect x="46" y="32" width="122" height="5" rx="2.5" fill="#fff" fill-opacity=".35"/>'
      + '<rect x="46" y="80" width="122" height="3" rx="1.5" fill="#000" fill-opacity=".12"/>'
      + '<line x1="50" y1="30" x2="50" y2="86" stroke="#586071" stroke-opacity=".55"/><line x1="54" y1="30" x2="54" y2="86" stroke="#586071" stroke-opacity=".3"/>'
      + '<text x="108" y="62" text-anchor="middle" font-size="15" font-weight="800" fill="#3a4050" style="font-family:JetBrains Mono,monospace;letter-spacing:1px;direction:ltr;unicode-bidi:bidi-override">N20</text>'
      + '<text x="108" y="76" text-anchor="middle" font-size="8.5" fill="#586071" ' + mono + '>DC GEARMOTOR</text>'
      /* جعبه‌دنده */
      + '<rect x="168" y="22" width="72" height="94" rx="6" fill="url(#ctMtBrass)" stroke="#5a430f" stroke-width="1.2"/>'
      + '<rect x="176" y="42" width="56" height="62" rx="6" fill="#10151f" stroke="#5a430f"/>'
      + at(G2, 'g2', gear(16, '#d4af37', '#5a430f') + holes(3, r2 * .55, 2.2) + '<circle r="3.2" fill="#c9ced8" stroke="#3a4050" stroke-width=".8"/><line x1="-3" y1="0" x2="3" y2="0" stroke="#3a4050" stroke-width="1"/>')
      + at(G1, 'g1', gear(20, '#dcdfe6', '#6b7280') + holes(4, r1 * .55, 2.4) + '<circle r="2.4" fill="#10151f"/>')
      + at(G1, 'gq', gear(8, '#aab1c0', '#4a5163') + '<circle r="1.8" fill="#10151f"/>')
      + at(P0, 'gp', gear(8, '#e8e2d0', '#6b7280') + '<circle r="2.2" fill="#10151f"/><line x1="0" y1="0" x2="4.2" y2="0" stroke="#10151f" stroke-width="1"/>')
      + '<rect x="176" y="42" width="56" height="62" rx="6" fill="url(#ctMtGlass)" pointer-events="none"/>'
      + screw(181, 32) + screw(227, 32) + screw(181, 109) + screw(227, 109)
      /* محور خروجی، بلبرینگ و چرخ */
      + '<rect x="240" y="' + f(sy - 9) + '" width="8" height="18" rx="2" fill="#85651c" stroke="#5a430f"/>'
      + '<rect x="246" y="' + f(sy - 4) + '" width="' + (WX - 246) + '" height="8" rx="1.5" fill="url(#ctMtShaft)" stroke="#3a4050"/>'
      + '<rect x="248" y="' + f(sy - 8) + '" width="5" height="16" rx="1.5" fill="#aab1c0" stroke="#586071" stroke-width=".8"/>'
      + at({ x: WX, y: sy }, 'wh', wheel)
      + '</g>'
      + '<text data-t1 x="8" y="17" font-size="11" fill="#8b93a5" ' + mono + '></text>'
      + '<text data-t2 x="8" y="32" font-size="11" fill="#8b93a5" ' + mono + '></text>'
      + '<circle cx="338" cy="22" r="9" fill="#1d2330"/><circle data-led cx="338" cy="22" r="9" fill="#57d8a3" opacity=".12"/>'
      + '<text x="338" y="44" text-anchor="middle" font-size="10" fill="#6b7280" ' + mono + '>PA8</text>';
    const q1 = sel => cvCar.querySelector(sel);
    mt = { root: q1('[data-root]'), gp: q1('[data-gp]'), g1: q1('[data-g1]'), gq: q1('[data-gq]'), g2: q1('[data-g2]'), wh: q1('[data-wh]'), t1: q1('[data-t1]'), t2: q1('[data-t2]'), led: q1('[data-led]'), A1, A2, WR };
  }

  function drawCar(){
    if(!mt) buildMotor();
    const duty = pmDuty(), v = pm.v, powered = pm.cube && pm.start;
    const a0 = pm.x / 8, a1 = ctMeshAt(8, 20, a0, mt.A1), a2 = ctMeshAt(8, 16, a1, mt.A2);
    const rot = a => 'rotate(' + (a * 57.2958).toFixed(1) + ')';
    const put = (el, key, val) => { if(el['_' + key] !== val){ el['_' + key] = val; el.setAttribute(key, val); } };
    put(mt.gp, 'transform', rot(a0)); put(mt.g1, 'transform', rot(a1)); put(mt.gq, 'transform', rot(a1)); put(mt.g2, 'transform', rot(a2));
    put(mt.wh, 'transform', rot(a2));
    const j = v > .02 ? Math.sin(pm.x * 2.1) * .6 * v : 0;
    put(mt.root, 'transform', 'translate(12 ' + (12 + j).toFixed(2) + ')');
    put(mt.led, 'opacity', Math.max(.12, duty).toFixed(2));
    const t1 = 'PWM ' + (powered ? Math.round(duty * 100) + '%' : 'OFF'), t2 = 'speed ' + Math.round(v * 100) + '%';
    if(mt.t1.textContent !== t1) mt.t1.textContent = t1;
    if(mt.t2.textContent !== t2) mt.t2.textContent = t2;
  }

  function frame(ts){
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(.05, (ts - last) / 1000) : 0;
    last = ts;
    spin(dt);
    if(seen(cvDl)) drawDl();
    if(seen(cvCar)) drawCar();
    if(seen(cv)) drawWave();
    if(seen(cvBus)) drawBus();
    if(seen(cvPw)) drawPw();
  }

  reset();
  if(alreadyDone) say('2', 'success', '✅ قبلاً این مأموریت را کامل کرده‌ای. اگر دوست داری دوباره با منوها و اسلایدرها بازی کن.');
  raf = requestAnimationFrame(frame);
  return { stop(){ ac.abort(); cancelAnimationFrame(raf); io && io.disconnect(); ro && ro.disconnect(); closePop(); } };
}
