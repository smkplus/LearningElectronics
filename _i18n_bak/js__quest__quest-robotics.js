/* ========================================================================
   QUEST-ROBOTICS.JS — بخش رباتیک
   داده‌ی مأموریت‌ها (QUESTS_ROBOTICS) + شبیه‌سازها
   QUESTS_ROBOTICS + mountRobotAssembleSim / LineSensor / LineFollow
   ======================================================================== */

const QUESTS_ROBOTICS = [
  { id:'line_intro', icon:'🤖', section:{ icon:'🤖', title:'بخش رباتیک', sub:'در این بخش می‌خواهیم یک ربات تعقیب خط (Line Follower) بسازیم: رباتی که با سنسورهای مادون‌قرمز خط مشکی روی زمین را می‌بیند و خودش مسیرش را اصلاح می‌کند تا از خط بیرون نرود. قدم‌به‌قدم جلو می‌رویم: اول می‌بینیم ربات تعقیب خط چیست و چطور کار می‌کند، بعد چشمِ ربات (سنسورها)، بعد قطعه‌های ربات را سر هم می‌کنیم، بعد خواندنِ سنسور با کد، بعد تصمیم‌گیری با if، بعد جهت و سرعتِ موتورها و در آخر تعقیبِ خط.' },
    title:'ربات تعقیب خط — معرفی: ربات چطور کار می‌کند؟', sub:'رباتیک — چشم، مغز، پا و حلقه‌ی تصمیم',
    xp:60,
    quote:'«ربات تعقیب خط هیچ جادویی ندارد: یک حلقه‌ی ساده است که مدام تکرار می‌شود؛ زمین را بخوان، تصمیم بگیر، موتورها را تنظیم کن و دوباره از اول. هرچه این حلقه سریع‌تر و تصمیم‌ها دقیق‌تر باشد، ربات نرم‌تر و تندتر می‌رود.»',
    desc:'قبل از اینکه دست به ساختِ ربات بزنیم، باید بدانیم ربات تعقیب خط دقیقاً چه کاری می‌کند و از چه بخش‌هایی ساخته می‌شود. این‌جا اول توضیحِ کوتاهِ ربات را می‌خوانی، بعد یک ربات کامل را روی چند مسیرِ مختلف می‌بینی که خط را تا پایان دنبال می‌کند.\n\nاین ربات همان رباتی است که تا آخرِ این بخش خودت می‌سازی و برنامه‌ریزی می‌کنی. مسیر را عوض کن و سرعت را تغییر بده تا ببینی ربات با پیچ‌های مختلف چطور کنار می‌آید.',
    steps:[
      'بخش‌های «ربات تعقیب خط چیست؟» و «هر ربات سه بخش دارد» را بخوان.',
      'یک مسیر انتخاب کن و «شروع» را بزن؛ ربات را ببین که خط را دنبال می‌کند.',
      'پایین صفحه، سنسورها و تصمیمِ ربات و سرعتِ دو موتور را زنده ببین؛ هر چه خط بیشتر به یک سمت برود، ربات تندتر به همان سمت می‌پیچد.',
      'سرعت را کم و زیاد کن و ببین ربات در پیچ‌ها خودش آهسته‌تر می‌شود و در مسیر راست تندتر می‌رود.',
      'ربات را روی دو مسیرِ مختلف تا خط پایان برسان؛ مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_sensor', icon:'🤖',
    title:'ربات تعقیب خط — گام ۱: چشمِ ربات', sub:'رباتیک — سنسور مادون‌قرمز و تشخیص خط',
    xp:90,
    quote:'«سنسور خط‌یاب یک چراغ مادون‌قرمز دارد که نور می‌فرستد و یک گیرنده که نورِ برگشتی را اندازه می‌گیرد. سطح سفید بیشترِ نور را برمی‌گرداند و خط مشکی آن را می‌بلعد. پس ربات فقط از روی کم‌یا‌زیاد بودنِ نورِ برگشتی می‌فهمد روی خط هست یا نه.»',
    desc:'بعد از معرفیِ ربات، ساختنش هفت گام دارد: ۱) چشم: سنسور خط را می‌بیند. ۲) سرهم‌کردنِ قطعاتِ ربات. ۳) خواندنِ سنسور با کد روی STM32. ۴) مغز: کد تصمیم می‌گیرد. ۵) پا: جهتِ موتورها. ۶) پا: سرعتِ موتورها با PWM. ۷) راه‌افتادن و دنبال‌کردن خط.\n\nامروز فقط گام اول است. اول با سه آزمایش کوچک می‌فهمی «مادون‌قرمز» دقیقاً چیست، چشم و سنسور چه فرقی دارند و چرا خط را مشکی روی زمینه‌ی سفید می‌کشند؛ بعد یاد می‌گیری سنسور چه عددی می‌خواند و چطور آن عدد را با یک «آستانه» به دو حالت سفید و مشکی تبدیل کنی. این کار با هر برد، چه آردوینو و چه STM32، یکی است.',
    steps:[
      'اول بخش «مادون‌قرمز (IR) چیست؟» را بخوان و با نشانگر طیف، دیدِ چشم و دیدِ سنسور و سطح سفید/مشکی بازی کن.',
      'سنسور (مثلاً TCRT5000) را به برد وصل می‌کنی: VCC به ۳.۳ ولت (روی STM32)، GND به GND و خروجی DO به یک پین مثل PA0.',
      'روی سفید نور زیادی برمی‌گردد و عدد بالاست؛ روی خط مشکی نور جذب می‌شود و عدد پایین می‌آید.',
      'در شبیه‌ساز زیر سنسور را روی مسیر بکش و عدد نورِ برگشتی را ببین.',
      'آستانه (Threshold) را طوری تنظیم کن که روی سفید LED خاموش و روی خط مشکی روشن شود.',
      'سنسور را یک‌بار روی سفید و یک‌بار روی مشکی ببر؛ وقتی هر دو درست خوانده شدند، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'robot_assemble', icon:'🛠️',
    title:'ربات تعقیب خط — گام ۲: سرهم‌کردنِ قطعات', sub:'رباتیک — چشم، مغز، درایور، موتور و منبع تغذیه',
    xp:80,
    quote:'«هر ربات از چند بخشِ ساده ساخته می‌شود: چشم که دنیا را می‌بیند، مغز که تصمیم می‌گیرد، درایور که جریانِ موتورها را کنترل می‌کند، موتور که ربات را می‌برد و باتری که به همه انرژی می‌دهد. اگر یکی از این‌ها کم باشد، ربات کار نمی‌کند.»',
    desc:'حالا که می‌دانی چشمِ ربات خط را چطور می‌بیند، وقتش است که بدنه‌ی ربات را سر هم کنی. این‌جا ربات را از بالا می‌بینی؛ جلوی ربات بالای صفحه است.\n\nنُه قطعه‌ی واقعیِ ربات پایین صفحه منتظرند، همان‌هایی که در ساختِ این ربات استفاده می‌شوند. هر قطعه را بگیر و روی جایگاه خط‌چینِ خودش بینداز. وقتی همه سر جایشان نشستند، ربات را روشن کن و ببین جریان از باتری و کلید به همه‌ی بخش‌ها می‌رسد.',
    steps:[
      'هر قطعه را با انگشت یا موس بگیر و روی بدنه‌ی ربات ببر؛ جایگاهِ درستش سبز می‌شود.',
      'اگر قطعه را سرِ جای اشتباه بیندازی، به جای اولش برمی‌گردد و می‌گوید جای واقعی‌اش کجاست.',
      'اگر نمی‌دانی قطعه کجا می‌نشیند، یک بار رویش بزن تا جایگاهش چشمک بزند.',
      'چشم (آرایه‌ی سنسورها) جلوی ربات، مغز (Blue Pill) و درایور وسط، دو موتور دو طرفِ بدنه و چرخ هرزگرد پشتِ ربات می‌نشینند.',
      'منبع تغذیه سه قطعه است: باتری، کلید روشن/خاموش و رگولاتور؛ این سه کنار هم، پایینِ بدنه جا دارند.',
      'وقتی همه‌ی قطعه‌ها نشست، دکمه‌ی «روشنش کن» را بزن؛ مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_read', icon:'📟', title:'ربات تعقیب خط — گام ۳: خواندنِ سنسور با کد', sub:'CubeMX، HAL_GPIO_ReadPin و if',
    xp:100,
    quote:'«تا حالا سنسور را در شبیه‌ساز دیدی؛ حالا وقتش است که خودِ برد STM32 آن را بخواند. هر برنامه‌ی میکروکنترلری سه قدم دارد: ورودی را بخوان، تصمیم بگیر، خروجی را بنویس. این‌جا ورودی سنسورِ خط است و خروجی LED روی برد.»',
    desc:'کار با STM32 همیشه دو مرحله دارد: اول در CubeMX به هر پایه می‌گویی چه کاری بکند (ورودی، خروجی، PWM و...) و CubeMX کدِ راه‌اندازی را در main.c می‌نویسد. بعد خودت داخل while(1)، بین USER CODE BEGIN و END، منطقِ برنامه را می‌نویسی.\n\nاین‌جا سنسور روی PA0 ورودی است و LED روی PC13 خروجی. اگر پایه‌ها را در CubeMX درست تنظیم نکنی، برد هم مثل واقعیت جواب نمی‌دهد.',
    steps:[
      'در مرحله‌ی ۱، روی نقشه‌ی چیپ `PA0` را `GPIO_Input` و `PC13` را `GPIO_Output` کن.',
      'در مرحله‌ی ۲ با `HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0)` مقدارِ سنسور را بخوان.',
      'با `if` بنویس: اگر مشکی (`GPIO_PIN_SET`) بود LED روشن شود.',
      'یادآوری: روی Blue Pill، `GPIO_PIN_RESET` روی `PC13` یعنی LED روشن.',
      '«اجرا» را بزن؛ وقتی سنسور مشکی را دید و LED روشن شد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_logic', icon:'🧠', title:'ربات تعقیب خط — گام ۴: مغزِ ربات', sub:'سه سنسور و if / else if',
    xp:110,
    quote:'«یک سنسور فقط می‌گوید روی خط هستم یا نه. با سه سنسور کنار هم (چپ، وسط، راست) ربات می‌فهمد خط به کدام سمت رفته. قاعده ساده است: هر سمتی که خط را می‌بیند، ربات به همان سمت می‌چرخد تا خط دوباره زیر سنسور وسط بیاید.»',
    desc:'اول مغزِ ربات را روی یک ربات متحرک می‌بینی: ربات سه سنسور جلو دارد (چپ، وسط، راست) و تصمیمش را با چند قانونِ if / else if می‌گیرد. هر قانون را که روشن کنی، ربات همان کار را بلد می‌شود و ردیفِ سبز نشان می‌دهد همان لحظه کدام قانون انجام می‌شود. این بخش برای فهمیدن است.\n\nبعد همین قانون‌ها را خودت با کد می‌نویسی و ربات کدِ تو را روی مسیر اجرا می‌کند. سه سنسور هشت حالت می‌سازند؛ چهار حالتِ اصلی را حل می‌کنیم و ترتیبِ شرط‌ها اولویت را می‌سازد: اول وسط، بعد چپ، بعد راست. اگر هیچ‌کدام نبود، همه‌ی چراغ‌ها خاموش می‌ماند (ربات بایستد). به‌جای موتور، سه LED تصمیمِ ربات را نشان می‌دهند: PB13 مستقیم، PB12 چپ و PB14 راست؛ گام بعد همین تصمیم‌ها را به موتورها می‌رسانی.',
    steps:[
      'اول در ربات متحرک «شروع» را بزن؛ فقط با قانونِ «مستقیم» ربات از پیچ بیرون می‌رود.',
      'قانونِ چپ و راست را روشن کن و ردیف سبز را هنگام حرکت ببین تا بفهمی هر قانون چه می‌کند.',
      'حالا کدش را بنویس. در مرحله‌ی ۱، `PA0` و `PA1` و `PA2` را `GPIO_Input` و `PB12` و `PB13` و `PB14` را `GPIO_Output` کن.',
      'سه سنسور را در سه متغیر بخوان: `uint8_t left = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0);` و همین‌طور `center` و `right`.',
      'اول همه‌ی چراغ‌ها را خاموش کن تا چراغِ حالتِ قبل روشن نماند.',
      'با `if (center == 1)` چراغِ مستقیم، با `else if (left == 1)` چراغِ چپ و با `else if (right == 1)` چراغِ راست را روشن کن.',
      '«اجرا» را بزن و ببین ربات با کدِ تو چه می‌کند؛ اگر خطا یا مشکلی بود، پیامِ زیرِ ربات می‌گوید چرا. وقتی ربات تا خط پایان رسید، مأموریت خودکار تکمیل می‌شود.'
    ]}
];


/* ----- شبیه‌سازهای بخش رباتیک ----- */
/* ================= LINE INTRO (robotics intro) =================
   توضیحِ ربات تعقیب خط + یک ربات ۵ سنسوره که چند مسیر را با کنترل تناسبی-مشتقی
   (PD) دنبال می‌کند. مأموریت وقتی کامل می‌شود که ربات دو مسیر را تا پایان برود. */
const LI_OFF = [-16, -8, 0, 8, 16], LI_NEED = 2;
const LI_TRACKS = (() => {
  const arc = (cx, cy, r, a0, a1, n) => { const o = []; for(let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
  const mk = (id, name, pts) => {
    const cum = [0];
    for(let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { id, name, pts, cum, total: cum[cum.length - 1] };
  };
  const wave = []; for(let x = 20; x <= 300; x += 4) wave.push([x, 95 + 52 * Math.sin((x - 20) / 36)]);
  const zig = [[20, 35], [80, 35], [80, 150], [140, 150], [140, 35], [200, 35], [200, 150], [300, 150]];
  const snake = [[20, 35], [250, 35]].concat(arc(250, 65, 30, -Math.PI / 2, Math.PI / 2, 14), [[70, 95]], arc(70, 125, 30, -Math.PI / 2, -3 * Math.PI / 2, 14), [[300, 155]]);
  const steps = [[20, 150], [75, 150], [115, 105], [165, 105], [205, 60], [255, 60], [295, 100]];
  return [mk('wave', 'موج‌دار', wave), mk('zig', 'زیگ‌زاگ (گوشه‌ی تیز)', zig), mk('snake', 'مارپیچ', snake), mk('steps', 'پله‌ای', steps)];
})();
function liSeg(tr, i, x, y){
  const a = tr.pts[i], b = tr.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
  return { d: Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy), t };
}
function liDist(tr, x, y){ let best = 1e9; for(let i = 0; i < tr.pts.length - 1; i++){ const d = liSeg(tr, i, x, y).d; if(d < best) best = d; } return best; }
function liNew(tr){
  const a = tr.pts[0], b = tr.pts[1];
  return { x: a[0], y: a[1], phi: Math.atan2(b[1] - a[1], b[0] - a[0]), w: 0, t: 0, lost: 0, lastErr: 0, dErr: 0, seg: 0, prog: 0, vals: [0, 0, 0, 0, 0], err: 0, seen: true, vl: 0, vr: 0, done: false, fail: '', trail: [[a[0], a[1]]] };
}
function liStep(s, tr, dt, base){
  if(dt <= 0) return;
  const c = Math.cos(s.phi), sn = Math.sin(s.phi), px = s.x + c * 15, py = s.y + sn * 15;
  let sum = 0, wsum = 0;
  s.vals = LI_OFF.map(o => { const v = Math.max(0, Math.min(1, (7 - liDist(tr, px - sn * o, py + c * o)) / 5)); sum += v; wsum += o * v; return v; });
  let err, v;
  s.seen = sum > 0.08;
  if(s.seen){ err = wsum / sum / 16; s.lost = 0; v = base * (1 - 0.5 * Math.min(1, Math.abs(err))); }
  else { s.lost += dt; err = (s.lastErr >= 0 ? 1 : -1) * 1.5; v = base * 0.3; }
  const dRaw = s.seen ? (err - s.lastErr) / dt : 0;
  s.dErr += (dRaw - s.dErr) * Math.min(1, dt / 0.04);
  if(s.seen) s.lastErr = err;
  s.err = err;
  const wT = 3.4 * (v / 40) * err + 0.25 * s.dErr;
  s.w += (wT - s.w) * Math.min(1, dt / 0.04);
  s.w = Math.max(-10, Math.min(10, s.w));
  s.phi += s.w * dt;
  s.x += Math.cos(s.phi) * v * dt; s.y += Math.sin(s.phi) * v * dt;
  s.vl = v + s.w * 11; s.vr = v - s.w * 11;
  s.t += dt;
  const lt = s.trail[s.trail.length - 1];
  if(Math.hypot(s.x - lt[0], s.y - lt[1]) > 3){ s.trail.push([s.x, s.y]); if(s.trail.length > 700) s.trail.shift(); }
  let bi = s.seg, bd = 1e9, ba = s.prog;
  for(let i = Math.max(0, s.seg - 2); i < Math.min(tr.pts.length - 1, s.seg + 10); i++){
    const q = liSeg(tr, i, s.x, s.y);
    if(q.d < bd){ bd = q.d; bi = i; ba = tr.cum[i] + q.t * (tr.cum[i + 1] - tr.cum[i]); }
  }
  s.seg = bi; if(ba > s.prog) s.prog = ba;
  if(s.prog >= tr.total - 10) s.done = true;
  else if(s.lost > 2.5 || s.x < -12 || s.x > 332 || s.y < -12 || s.y > 202) s.fail = 'lost';
  else if(s.t > 60) s.fail = 'time';
}

function mountLineIntroSim(container, { onSuccess, alreadyDone } = {}){
  const trackBtns = LI_TRACKS.map((t, i) => `<button type="button" class="sim-btn ${i ? 'sim-btn-ghost' : 'sim-btn-run'}" data-t="${i}">${t.name}</button>`).join('');
  const box = 'border:1px solid #2a3346;border-radius:10px;padding:6px 12px;background:#0d1119;';
  const sensorDots = LI_OFF.map(o => `<circle class="li-s" cx="15" cy="${o}" r="2.6" fill="#555"/>`).join('');
  container.innerHTML = `
    <div class="sim-wrap ir-wrap">
      <div class="sim-hw-note">این مأموریت معرفی است: اول ربات تعقیب خط را می‌شناسی، بعد یک ربات کامل را روی چند مسیر می‌بینی. تا آخرِ این بخش، خودت همین ربات را می‌سازی.</div>

      <div class="ir-h">۱) ربات تعقیب خط چیست؟</div>
      <div class="ir-p">ربات تعقیب خط (Line Follower) رباتی است که با سنسور مادون‌قرمز خطی را که روی زمین کشیده شده (معمولاً خط مشکی روی زمینه‌ی سفید) می‌بیند و بدون فرمانِ بیرونی، خودش مسیرش را اصلاح می‌کند تا از خط بیرون نرود. نمونه‌ی واقعی‌اش را در انبارها و کارخانه‌ها می‌بینی که ربات‌های حمل‌بار روی یک نوار رنگی رفت‌وآمد می‌کنند؛ مسابقه‌های رباتیکِ مدرسه‌ای و دانشگاهی هم یکی از محبوب‌ترین رشته‌هایشان همین است.</div>

      <div class="ir-h">۲) هر ربات سه بخش دارد</div>
      <div class="ir-p">👁️ <b>چشم:</b> سنسورهایی که زمین را می‌بینند. 🧠 <b>مغز:</b> برد (این‌جا STM32 Blue Pill) که کدِ تو روی آن اجرا می‌شود و تصمیم می‌گیرد. 🦿 <b>پا:</b> درایور و دو موتور که ربات را می‌برند. کارِ ربات یک حلقه‌ی تکرارشونده است:</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin:8px 0 12px">
        <span style="${box}">👁️ بخوان</span><span>←</span><span style="${box}">🧠 تصمیم بگیر</span><span>←</span><span style="${box}">🦿 حرکت کن</span><span>↺ و دوباره از اول</span>
      </div>

      <div class="ir-h">۳) نقشه‌ی راه این بخش</div>
      <div class="ir-p">در گام‌های بعد خودت ربات را می‌سازی: گام ۱ چشم (سنسور)، گام ۲ سرهم‌کردنِ قطعات، گام ۳ خواندنِ سنسور با کد و گام ۴ مغز (if).</div>

      <div class="ir-h">۴) ببین ربات کامل چطور خط را می‌رود</div>
      <div class="ir-p">این ربات ۵ سنسور دارد. از روی اینکه خط زیر کدام سنسورها است می‌فهمد چقدر و به کدام سمت منحرف شده؛ هرچه انحراف بیشتر باشد، تندتر به همان سمت می‌پیچد و در پیچ‌ها خودش آهسته‌تر می‌رود. مسیر را عوض کن و سرعت را تغییر بده. وقتی دو مسیر را تا 🏁 ببرد، مأموریت کامل می‌شود. (در گام ۷ خودت سرعت و شدت پیچیدنِ یک ربات را تنظیم می‌کنی.)</div>
      <div class="ir-tabs">${trackBtns}</div>
      <svg class="ls-svg" viewBox="0 0 320 190" direction="ltr" role="img" aria-label="ربات پنج‌سنسوره روی مسیر" style="cursor:default">
        <rect width="320" height="190" fill="#e9e6dc"/>
        <path id="liTrack" fill="none" stroke="#111" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
        <polyline id="liTrail" fill="none" stroke="#1fa37a" stroke-opacity=".75" stroke-width="2" stroke-linejoin="round"/>
        <text id="liFlag" font-size="16" text-anchor="middle">🏁</text>
        <g id="liBot">
          <rect x="-8" y="-14" width="13" height="5" rx="1.5" fill="#15171c"/><rect x="-8" y="9" width="13" height="5" rx="1.5" fill="#15171c"/>
          <rect x="-12" y="-9" width="23" height="18" rx="4" fill="#2b6cb0" stroke="#8fc0f5"/>
          <rect x="-7" y="-5" width="10" height="10" rx="1.5" fill="#0e1117" stroke="#57d8a3" stroke-width=".8"/>
          <circle cx="-9.5" cy="0" r="2.2" fill="#cfd4dc"/>
          <rect x="10" y="-2.5" width="3" height="5" fill="#2a2f3a"/>
          <rect x="12" y="-19" width="6" height="38" rx="2" fill="#1a2130" stroke="#c97c3d" stroke-width="1"/>
          ${sensorDots}
        </g>
      </svg>
      <div class="ls-read"><span>سنسورها: <b class="mono" dir="ltr" id="liSens"></b></span><span>تصمیم: <b id="liDec"></b></span></div>
      <div class="ls-read"><span>موتور چپ: <b class="mono" id="liL"></b></span><span>موتور راست: <b class="mono" id="liR"></b></span></div>
      <label class="ls-field">سرعت: <b class="mono" id="liSv"></b><input type="range" id="liSp" dir="ltr" min="40" max="130" step="5" value="80"></label>
      <div class="ll-row"><button type="button" class="sim-btn sim-btn-run" data-a="go">▶ شروع</button><button type="button" class="sim-btn sim-btn-ghost" data-a="reset">↺ از اول</button></div>
      <div class="sim-status" id="liStatus" data-state="${alreadyDone ? 'success' : 'idle'}"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const trackEl = q('#liTrack'), trailEl = q('#liTrail'), flagEl = q('#liFlag'), bot = q('#liBot'), sp = q('#liSp'), st = q('#liStatus');
  const dots = Array.from(container.querySelectorAll('.li-s'));
  const finished = new Set();
  let ti = 0, s = liNew(LI_TRACKS[0]), raf = 0, last = null, running = false, succeeded = !!alreadyDone;
  const say = (a, t) => { st.dataset.state = a; st.textContent = t; };
  const pathD = tr => 'M' + tr.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  function decision(){
    if(!s.seen) return 'خط گم شد، دنبالش می‌گردم';
    const e = s.err, a = Math.abs(e);
    if(a < 0.12) return 'مستقیم';
    return (a < 0.5 ? 'کمی ' : 'تند ') + 'به ' + (e < 0 ? 'چپ' : 'راست');
  }
  const pct = v => toFa(Math.max(-100, Math.min(100, Math.round(v / (+sp.value) * 100)))) + '٪';
  function draw(){
    bot.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${(s.phi * 180 / Math.PI).toFixed(1)})`);
    dots.forEach((c, i) => { const v = s.vals[i]; c.setAttribute('fill', `rgb(${Math.round(85 + 170 * v)},${Math.round(85 + 5 * v)},${Math.round(85 - 6 * v)})`); });
    trailEl.setAttribute('points', s.trail.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
    q('#liSens').textContent = s.vals.map(v => v > 0.5 ? '■' : '□').join(' ');
    q('#liDec').textContent = decision();
    q('#liL').textContent = pct(s.vl); q('#liR').textContent = pct(s.vr);
  }
  function loadTrack(i){
    ti = i;
    const tr = LI_TRACKS[i], e = tr.pts[tr.pts.length - 1];
    trackEl.setAttribute('d', pathD(tr));
    flagEl.setAttribute('x', e[0]); flagEl.setAttribute('y', e[1] - 8);
    container.querySelectorAll('[data-t]').forEach(b => { const on = +b.dataset.t === i; b.classList.toggle('sim-btn-run', on); b.classList.toggle('sim-btn-ghost', !on); });
  }
  function frame(ts){
    if(!running) return;
    const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts;
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for(let i = 0; i < n && !s.done && !s.fail; i++) liStep(s, LI_TRACKS[ti], h, +sp.value);
    draw();
    if(s.done){
      running = false; finished.add(ti);
      if(finished.size >= LI_NEED || succeeded){
        say('success', '✅ رسید! ربات خط را تا پایان دنبال کرد. حالا می‌دانی ربات تعقیب خط چطور کار می‌کند؛ بریم سراغ ساختنش!');
        if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
      } else say('success', `✅ ربات مسیر «${LI_TRACKS[ti].name}» را تا پایان رفت! ${toFa(LI_NEED - finished.size)} مسیر دیگر را هم امتحان کن.`);
      return;
    }
    if(s.fail){
      running = false;
      say('error', s.fail === 'lost' ? '⚠️ ربات خط را گم کرد. سرعت را کم کن و دوباره امتحان کن.' : '⚠️ ربات خیلی کند رفت و وقت تمام شد. سرعت را بیشتر کن.');
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function reset(){
    cancelAnimationFrame(raf); running = false; s = liNew(LI_TRACKS[ti]); last = null; draw();
    if(!succeeded) say('idle', '🏁 یک مسیر انتخاب کن و «شروع» را بزن.');
  }
  container.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if(!b) return;
    if(b.dataset.t != null){ loadTrack(+b.dataset.t); reset(); }
    else if(b.dataset.a === 'reset') reset();
    else if(b.dataset.a === 'go'){ reset(); running = true; say('running', '▶ ربات در حال رفتن است…'); raf = requestAnimationFrame(frame); }
  });
  sp.addEventListener('input', () => { q('#liSv').textContent = toFa(sp.value); });
  q('#liSv').textContent = toFa(sp.value);
  loadTrack(0); draw();
  say(alreadyDone ? 'success' : 'idle', alreadyDone ? '✅ قبلاً این مأموریت را انجام داده‌ای. دوست داری دوباره ربات را روی مسیرها ببینی؟' : '🏁 یک مسیر انتخاب کن و «شروع» را بزن.');
  return { stop(){ running = false; cancelAnimationFrame(raf); } };
}

/* ================= LINE LOGIC (robotics step 4) =================
   مغزِ ربات: ربات سه‌سنسوره روی مسیر حرکت می‌کند و تصمیمش را با قانون‌های
   if / else if می‌گیرد. هر قانون را که کاربر روشن کند، ربات همان کار را بلد می‌شود.
   مأموریت وقتی کامل می‌شود که ربات دو مسیر را تا پایان برود.
   از مسیرها و توابعِ کمکیِ مأموریتِ معرفی (LI_TRACKS, liNew, liDist, liSeg) استفاده می‌کند. */
const LL3_OFF = [-10, 0, 10], LL3_NEED = 2, LL3_R = 6.5;
const LL3_TRACKS = [LI_TRACKS[0], LI_TRACKS[2], LI_TRACKS[3]];
const LL3_RULES = [
  { id:'straight', code:'if (center == 1)',      act:'مستقیم برو',     icon:'⬆️' },
  { id:'left',     code:'else if (left == 1)',   act:'به چپ بپیچ',     icon:'⬅️' },
  { id:'right',    code:'else if (right == 1)',  act:'به راست بپیچ',   icon:'➡️' }
];
function ll3New(tr){ const s = liNew(tr); s.vals = [0, 0, 0]; s.act = 'stop'; s.stuck = 0; return s; }
function ll3Sense(s, tr){
  const c = Math.cos(s.phi), sn = Math.sin(s.phi), px = s.x + c * 15, py = s.y + sn * 15;
  return LL3_OFF.map(o => liDist(tr, px - sn * o, py + c * o) < LL3_R ? 1 : 0);
}
/* decide(vals) اختیاری است: اگر باشد، تصمیم را برنامه‌ی کاربر (چراغ‌های PB12/13/14 در hal-code-editor.js) می‌گیرد */
function ll3Step(s, tr, dt, base, rules, decide){
  if(dt <= 0) return;
  s.vals = ll3Sense(s, tr);
  const L = s.vals[0], C = s.vals[1], R = s.vals[2];
  /* دقیقاً همان if / else if ی که در کد می‌نویسی */
  let act = 'stop';
  if(decide) act = decide(s.vals);
  else if(C && rules.straight) act = 'straight';
  else if(L && rules.left) act = 'left';
  else if(R && rules.right) act = 'right';
  s.act = act;
  const any = L || C || R;
  s.lost = any ? 0 : s.lost + dt;
  s.stuck = (any && act === 'stop') ? s.stuck + dt : 0;
  const turn = 0.045 * base;
  const v = act === 'stop' ? 0 : act === 'straight' ? base : base * 0.55;
  const wT = act === 'left' ? -turn : act === 'right' ? turn : 0;
  s.w += (wT - s.w) * Math.min(1, dt / 0.05);
  s.phi += s.w * dt;
  s.x += Math.cos(s.phi) * v * dt; s.y += Math.sin(s.phi) * v * dt;
  s.vl = v + s.w * 11; s.vr = v - s.w * 11;
  s.t += dt;
  const lt = s.trail[s.trail.length - 1];
  if(Math.hypot(s.x - lt[0], s.y - lt[1]) > 3){ s.trail.push([s.x, s.y]); if(s.trail.length > 700) s.trail.shift(); }
  let bi = s.seg, bd = 1e9, ba = s.prog;
  for(let i = Math.max(0, s.seg - 2); i < Math.min(tr.pts.length - 1, s.seg + 10); i++){
    const q = liSeg(tr, i, s.x, s.y);
    if(q.d < bd){ bd = q.d; bi = i; ba = tr.cum[i] + q.t * (tr.cum[i + 1] - tr.cum[i]); }
  }
  s.seg = bi; if(ba > s.prog) s.prog = ba;
  if(s.prog >= tr.total - 16) s.done = true;
  else if(s.stuck > 1) s.fail = 'stuck';
  else if(s.lost > 1) s.fail = 'lost';
  else if(s.x < -12 || s.x > 332 || s.y < -12 || s.y > 202) s.fail = 'lost';
  else if(s.t > 60) s.fail = 'time';
}

function mountLineLogicSim(container, { onSuccess, alreadyDone, explain } = {}){
  const trackBtns = LL3_TRACKS.map((t, i) => `<button type="button" class="sim-btn ${i ? 'sim-btn-ghost' : 'sim-btn-run'}" data-t="${i}">${t.name}</button>`).join('');
  const rowCss = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 10px;border:1px solid #2a3346;border-radius:10px;background:#0d1119;margin-bottom:6px;';
  const ruleRows = LL3_RULES.map(r => `<label class="ll3-row" data-r="${r.id}" style="${rowCss}cursor:pointer"><input type="checkbox" data-c="${r.id}"${r.id === 'straight' ? ' checked' : ''}><code class="mono" dir="ltr" style="min-width:150px;text-align:left">${r.code}</code><span>${r.icon} ${r.act}</span></label>`).join('')
    + `<div class="ll3-row" data-r="stop" style="${rowCss}"><span style="display:inline-block;width:13px"></span><code class="mono" dir="ltr" style="min-width:150px;text-align:left">else</code><span>⏹️ بایست</span></div>`;
  const sensorDots = LL3_OFF.map((o, i) => `<circle class="ll3-s" cx="15" cy="${o}" r="3.2" fill="#555"/>`).join('');
  container.innerHTML = `
    <div class="sim-wrap ir-wrap">
      <div class="sim-hw-note">${explain ? 'اول با ربات می‌بینی مغز چطور تصمیم می‌گیرد؛ پایین‌تر همین قانون‌ها را با کد می‌نویسی. این بخش برای فهمیدن است و روی تکمیل مأموریت اثری ندارد. ' : ''}مغزِ ربات یک فهرست قانون است. هر قانون را که روشن کنی، ربات همان کار را بلد می‌شود. اول فقط «مستقیم» روشن است؛ ببین ربات چه می‌کند، بعد قانون‌های چپ و راست را اضافه کن تا خط را تا 🏁 برود.</div>

      <div class="ir-h">۱) قانون‌های مغز (ردیفِ سبز همان لحظه انجام می‌شود)</div>
      <div class="ir-p">ربات سه سنسور جلو دارد: <b>چپ، وسط و راست</b>. هر سنسور وقتی خط مشکی را ببیند، می‌شود <b>۱</b>. مغز از بالا به پایین قانون‌ها را نگاه می‌کند و <b>اولین قانونی که درست باشد</b> را انجام می‌دهد؛ بقیه نادیده گرفته می‌شوند. اگر هیچ‌کدام درست نبود، ربات می‌ایستد.</div>
      <div>${ruleRows}</div>

      <div class="ir-h">۲) ربات را ببین</div>
      <div class="ir-tabs">${trackBtns}</div>
      <svg class="ls-svg" viewBox="0 0 320 190" direction="ltr" role="img" aria-label="ربات سه‌سنسوره روی مسیر" style="cursor:default">
        <rect width="320" height="190" fill="#e9e6dc"/>
        <path id="ll3Track" fill="none" stroke="#111" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
        <polyline id="ll3Trail" fill="none" stroke="#1fa37a" stroke-opacity=".75" stroke-width="2" stroke-linejoin="round"/>
        <text id="ll3Flag" font-size="16" text-anchor="middle">🏁</text>
        <g id="ll3Bot">
          <rect x="-8" y="-14" width="13" height="5" rx="1.5" fill="#15171c"/><rect x="-8" y="9" width="13" height="5" rx="1.5" fill="#15171c"/>
          <rect x="-12" y="-9" width="23" height="18" rx="4" fill="#2b6cb0" stroke="#8fc0f5"/>
          <rect x="-7" y="-5" width="10" height="10" rx="1.5" fill="#0e1117" stroke="#57d8a3" stroke-width=".8"/>
          <circle cx="-9.5" cy="0" r="2.2" fill="#cfd4dc"/>
          <rect x="10" y="-2.5" width="3" height="5" fill="#2a2f3a"/>
          <rect x="12" y="-18" width="6" height="36" rx="2" fill="#1a2130" stroke="#c97c3d" stroke-width="1"/>
          ${sensorDots}
        </g>
      </svg>
      <div class="ls-read"><span>سنسورها: <b class="mono">چپ <span id="ll3L"></span> · وسط <span id="ll3C"></span> · راست <span id="ll3R"></span></b></span></div>
      <div class="ls-read"><span>تصمیم: <b id="ll3Dec"></b></span></div>
      <label class="ls-field">سرعت: <b class="mono" id="ll3Sv"></b><input type="range" id="ll3Sp" dir="ltr" min="40" max="100" step="5" value="60"></label>
      <div class="ll-row"><button type="button" class="sim-btn sim-btn-run" data-a="go">▶ شروع</button><button type="button" class="sim-btn sim-btn-ghost" data-a="reset">↺ از اول</button></div>
      <div class="sim-status" id="ll3Status" data-state="${alreadyDone ? 'success' : 'idle'}"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const trackEl = q('#ll3Track'), trailEl = q('#ll3Trail'), flagEl = q('#ll3Flag'), bot = q('#ll3Bot'), sp = q('#ll3Sp'), st = q('#ll3Status');
  const dots = Array.from(container.querySelectorAll('.ll3-s'));
  const rows = {}; container.querySelectorAll('.ll3-row').forEach(el => { rows[el.dataset.r] = el; });
  const rules = { straight: true, left: false, right: false };
  const finished = new Set();
  let ti = 0, s = ll3New(LL3_TRACKS[0]), raf = 0, last = null, running = false, succeeded = !!alreadyDone;
  const say = (a, t) => { st.dataset.state = a; st.textContent = t; };
  const pathD = tr => 'M' + tr.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  const DEC = { straight: '⬆️ وسط خط را می‌بیند: مستقیم', left: '⬅️ چپ خط را می‌بیند: به چپ بپیچ', right: '➡️ راست خط را می‌بیند: به راست بپیچ', stop: '⏹️ هیچ قانونی درست نیست: بایست' };
  const mark = v => v ? '■' : '□';
  function draw(){
    bot.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${(s.phi * 180 / Math.PI).toFixed(1)})`);
    dots.forEach((c, i) => c.setAttribute('fill', s.vals[i] ? '#ff5a4f' : '#555'));
    trailEl.setAttribute('points', s.trail.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
    q('#ll3L').textContent = mark(s.vals[0]); q('#ll3C').textContent = mark(s.vals[1]); q('#ll3R').textContent = mark(s.vals[2]);
    q('#ll3Dec').textContent = DEC[s.act];
    Object.keys(rows).forEach(k => {
      const on = k === s.act;
      rows[k].style.borderColor = on ? '#57d8a3' : '#2a3346';
      rows[k].style.background = on ? '#12301f' : '#0d1119';
    });
  }
  function loadTrack(i){
    ti = i;
    const tr = LL3_TRACKS[i], e = tr.pts[tr.pts.length - 1];
    trackEl.setAttribute('d', pathD(tr));
    flagEl.setAttribute('x', e[0]); flagEl.setAttribute('y', e[1] - 8);
    container.querySelectorAll('[data-t]').forEach(b => { const on = +b.dataset.t === i; b.classList.toggle('sim-btn-run', on); b.classList.toggle('sim-btn-ghost', !on); });
  }
  function failText(){
    if(s.fail === 'stuck'){
      const miss = [];
      if(s.vals[1] && !rules.straight) miss.push('«مستقیم برو»');
      if(s.vals[0] && !rules.left) miss.push('«به چپ بپیچ»');
      if(s.vals[2] && !rules.right) miss.push('«به راست بپیچ»');
      return `⚠️ ربات ایستاد: سنسور خط را دید ولی قانونِ ${miss.join(' و ') || 'مناسب'} خاموش است. آن را روشن کن و دوباره امتحان کن.`;
    }
    if(s.fail === 'lost') return '⚠️ ربات خط را گم کرد (هر سه سنسور سفید شدند). قانون‌های چپ و راست روشن باشند و سرعت را کم کن.';
    return '⚠️ ربات خیلی کند رفت و وقت تمام شد. سرعت را بیشتر کن.';
  }
  function frame(ts){
    if(!running) return;
    const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts;
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for(let i = 0; i < n && !s.done && !s.fail; i++) ll3Step(s, LL3_TRACKS[ti], h, +sp.value, rules);
    draw();
    if(s.done){
      running = false; finished.add(ti);
      if(explain){
        say('success', '✅ رسید! مغزِ ربات با چند if ساده خط را تا پایان دنبال کرد. حالا پایین‌تر همین قانون‌ها را با کد خودت بنویس.');
        return;
      }
      if(finished.size >= LL3_NEED || succeeded){
        say('success', '✅ رسید! مغزِ ربات با چند if ساده خط را تا پایان دنبال کرد. گام بعد این تصمیم‌ها را به موتورها می‌رسانی.');
        if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
      } else say('success', `✅ ربات مسیر «${LL3_TRACKS[ti].name}» را تا پایان رفت! ${toFa(LL3_NEED - finished.size)} مسیر دیگر را هم امتحان کن.`);
      return;
    }
    if(s.fail){ running = false; say('error', failText()); return; }
    raf = requestAnimationFrame(frame);
  }
  function reset(){
    cancelAnimationFrame(raf); running = false; s = ll3New(LL3_TRACKS[ti]); last = null; draw();
    if(!succeeded) say('idle', '🏁 یک مسیر انتخاب کن، قانون‌ها را تنظیم کن و «شروع» را بزن.');
  }
  container.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if(!b) return;
    if(b.dataset.t != null){ loadTrack(+b.dataset.t); reset(); }
    else if(b.dataset.a === 'reset') reset();
    else if(b.dataset.a === 'go'){ reset(); running = true; say('running', '▶ ربات در حال رفتن است…'); raf = requestAnimationFrame(frame); }
  });
  container.addEventListener('change', e => {
    const c = e.target && e.target.dataset ? e.target.dataset.c : null;
    if(c) rules[c] = !!e.target.checked;
  });
  sp.addEventListener('input', () => { q('#ll3Sv').textContent = toFa(sp.value); });
  q('#ll3Sv').textContent = toFa(sp.value);
  loadTrack(0); draw();
  say(alreadyDone && !explain ? 'success' : 'idle', alreadyDone && !explain ? '✅ قبلاً این مأموریت را انجام داده‌ای. دوست داری دوباره قانون‌ها را امتحان کنی؟' : '🏁 اول «شروع» را بزن و ببین فقط با قانونِ «مستقیم» چه می‌شود.');
  return { stop(){ running = false; cancelAnimationFrame(raf); } };
}

/* مأموریت «مغزِ ربات»: اول ربات متحرک (فقط برای فهمیدن)، بعد نوشتنِ کدِ همان قانون‌ها در
   ادیتورِ اصلیِ STM32 (CubeMX + ادیتور از hal-code-editor.js: mountHalBrainSim). در آن‌جا هم ربات متحرک
   با کدِ خودِ کاربر حرکت می‌کند (hsBrainRobotHw) و همان مأموریت را تکمیل می‌کند. */
function mountLineLogicMission(container, opts = {}){
  container.innerHTML = '<div id="llRobotMount"></div><div id="llCodeMount" style="margin-top:14px;"></div>';
  const robot = mountLineLogicSim(container.querySelector('#llRobotMount'), { explain: true });
  const code = mountHalBrainSim(container.querySelector('#llCodeMount'), opts);
  return { stop(){ robot.stop(); code && code.stop && code.stop(); } };
}

/* ================= ROBOT ASSEMBLY (robotics step 2) =================
   ربات را از بالا می‌بینی. شش قطعه پایینِ صفحه است؛ هر کدام را بکش و روی جایگاهِ
   خط‌چینِ خودش بینداز. وقتی همه نشستند «روشنش کن» مأموریت را تکمیل می‌کند.
   موتورها یک‌جورند؛ هر کدام در هر یک از دو جایگاهِ موتور می‌نشیند. */
const RA_DIM = { sensors:[180, 20], board:[64, 28], driver:[60, 40], motor:[22, 56], battery:[62, 32], power:[34, 24], reg:[44, 22], caster:[28, 28] };
const RA_PARTS = [
  { id:'sensors', kind:'sensors', tray:[14, 268], lbl:'چشم‌ها (۹ سنسور)',  name:'آرایه‌ی ۹ سنسور TCRT5000 (چشم)', info:'👁️ آرایه‌ی ۹ سنسور جلوی ربات نشست؛ هر سنسور یک نقطه‌ی زیرِ ربات را می‌بیند و با هم می‌فهمند خط کجاست.' },
  { id:'motorA',  kind:'motor',   tray:[222, 268], lbl:'موتور', name:'موتور N20 با چرخ',               info:'⚙️ اولین موتور با چرخ نشست؛ موتورِ انکودردار می‌تواند سرعتش را هم گزارش بدهد.' },
  { id:'motorB',  kind:'motor',   tray:[262, 268], lbl:'موتور', name:'موتور N20 با چرخ',               info:'⚙️ موتور دوم هم نشست؛ دو موتورِ مستقل یعنی ربات می‌تواند بپیچد.' },
  { id:'caster',  kind:'caster',  tray:[230, 372], lbl:'چرخ هرزگرد', name:'چرخ هرزگرد',                     info:'⚪ چرخ هرزگرد پشتِ ربات نشست؛ تعادل را نگه می‌دارد و راحت به هر سو می‌چرخد.' },
  { id:'reg',     kind:'reg',     tray:[14, 312], lbl:'رگولاتور',  name:'رگولاتور LM2596',                info:'🔧 رگولاتور نشست؛ ولتاژِ باتری را کم می‌کند تا برد و سنسورها سالم بمانند.' },
  { id:'power',   kind:'power',   tray:[80, 312], lbl:'کلید',  name:'کلید روشن/خاموش',                info:'🔘 کلید راکر نشست؛ مسیر برقِ ربات را وصل و قطع می‌کند.' },
  { id:'battery', kind:'battery', tray:[128, 312], lbl:'باتری', name:'باتری',                          info:'🔋 باتری نشست؛ انرژیِ همه‌ی بخش‌ها از همین‌جا می‌آید.' },
  { id:'board',   kind:'board',   tray:[14, 372], lbl:'مغز (Blue Pill)',  name:'برد STM32 Blue Pill (مغز)',      info:'🧠 برد Blue Pill مغزِ ربات شد؛ کدی که با ST-Link روی آن می‌ریزی همین‌جا اجرا می‌شود.' },
  { id:'driver',  kind:'driver',  tray:[100, 372], lbl:'درایور موتور',  name:'درایور موتور TB6612',            info:'🦿 درایور بین مغز و موتورها نشست؛ چون پایه‌های برد جریانِ کافی برای راندنِ موتور ندارند.' }
];
const RA_WHAT = {
  sensors: 'چشمِ ربات: ۹ سنسورِ مادون‌قرمز که زیرِ خود را «سفید» یا «مشکی» می‌بینند و خط را پیدا می‌کنند.',
  motor: 'موتورِ کوچک با گیربکس و چرخ؛ دو موتورِ مستقل یعنی ربات می‌تواند بپیچد.',
  caster: 'چرخِ بدونِ موتور که پشتِ ربات را نگه می‌دارد و آزادانه به هر سو می‌چرخد.',
  reg: 'ولتاژِ باتری (۷٫۴ ولت) را به ولتاژِ کمترِ مناسبِ برد و سنسورها کم می‌کند.',
  power: 'کلیدی که برقِ باتری را وصل و قطع می‌کند.',
  battery: 'باتری ۷٫۴ ولتی که انرژیِ همه‌ی بخش‌ها را می‌دهد.',
  board: 'مغزِ ربات (STM32): کدِ تو روی آن اجرا می‌شود و سنسورها و درایور را کنترل می‌کند.',
  driver: 'جریانِ قوی را از باتری به موتورها می‌رساند؛ پایه‌های برد به‌تنهایی برای موتور کافی نیستند.'
};
const RA_GUIDE = [['sensors', '👁️ چشم‌ها (۹ سنسور)'], ['board', '🧠 مغز (Blue Pill)'], ['driver', '🦿 درایور موتور'], ['motor', '⚙️ موتور با چرخ (دو تا)'], ['caster', '⚪ چرخ هرزگرد'], ['battery', '🔋 باتری'], ['power', '🔘 کلید'], ['reg', '🔧 رگولاتور']];
const raWhat = p => RA_WHAT[p.kind];
/* بخش‌های هر قطعه: vb = viewBox، m = نشانه‌ها (x,y نقطه‌ی روی قطعه، lx,ly جای شماره، t توضیح) */
const RA_ANAT = {
  sensors: { vb: [-6, -16, 192, 52], m: [
    { x: 9, y: 8.5, lx: 6, ly: -9, t: 'LED مادون‌قرمز: نور می‌فرستد.' },
    { x: 15.5, y: 8.5, lx: 20, ly: -9, t: 'گیرنده: نورِ برگشتی را می‌گیرد.' },
    { x: 12, y: 17.5, lx: 12, ly: 28, t: 'مقاومت: جریانِ LED را محدود می‌کند.' } ] },
  board: { vb: [-8, -16, 80, 60], m: [
    { x: 3.5, y: 11, lx: 4, ly: -9, t: 'پورت USB.' },
    { x: 13.75, y: 11, lx: 16, ly: -9, t: 'دکمه‌ی RESET.' },
    { x: 31, y: 10, lx: 30, ly: -9, t: 'چیپ STM32: مغزِ اصلی.' },
    { x: 46.5, y: 11.5, lx: 44, ly: -9, t: 'کریستال: ساعتِ چیپ.' },
    { x: 20.5, y: 21, lx: 20, ly: 37, t: 'LED روی PC13.' } ] },
  driver: { vb: [-8, -16, 76, 72], m: [
    { x: 30, y: 12, lx: 30, ly: -9, t: 'چیپ TB6612.' },
    { x: 44.6, y: 2.5, lx: 54, ly: -9, t: 'پایه‌های بالا: فرمان از مغز.' },
    { x: 30, y: 38, lx: 30, ly: 49, t: 'پایه‌های پایین: موتورها و باتری.' } ] },
  motor: { vb: [-16, -8, 58, 72], m: [
    { x: 2, y: 21, lx: -9, ly: 21, t: 'چرخ.' },
    { x: 21, y: 20, lx: 33, ly: 20, t: 'گیربکس: سرعت کم، نیرو زیاد.' },
    { x: 21, y: 41, lx: 33, ly: 41, t: 'موتور DC.' },
    { x: 21, y: 52, lx: 33, ly: 54, t: 'انکودر: چرخش را می‌شمارد.' } ] },
  caster: { vb: [-8, -16, 52, 56], m: [
    { x: 14, y: 8, lx: 14, ly: -9, t: 'ساچمه: آزادانه می‌چرخد.' } ] },
  battery: { vb: [-8, -16, 84, 62], m: [
    { x: 25, y: 5, lx: 25, ly: -9, t: 'بدنه: دو سلول، ۷٫۴ ولت.' },
    { x: 52, y: 12, lx: 52, ly: -9, t: 'سیم قرمز: مثبت (+).' },
    { x: 52, y: 19, lx: 52, ly: 40, t: 'سیم مشکی: منفی (−).' } ] },
  power: { vb: [-8, -16, 50, 56], m: [
    { x: 17, y: 9, lx: 17, ly: -9, t: 'راکر: ۱ روشن، ۰ خاموش.' },
    { x: 11.5, y: 22, lx: 11.5, ly: 33, t: 'ترمینال‌ها: سیمِ برق.' } ] },
  reg: { vb: [-8, -16, 60, 54], m: [
    { x: 2.5, y: 9, lx: 2, ly: -9, t: 'ورودی: ۷٫۴ ولتِ باتری.' },
    { x: 36.5, y: 5.5, lx: 38, ly: -9, t: 'ولوم: ولتاژِ خروجی را تنظیم می‌کند.' },
    { x: 41.5, y: 12, lx: 42, ly: 31, t: 'خروجی: ولتاژِ کم‌شده.' } ] }
};
function raGuideSvg(kind){
  const a = RA_ANAT[kind], W = kind === 'sensors' ? 300 : 200, k = a.vb[2] / W, gold = '#d4af37';
  const marks = a.m.map((m, i) =>
    `<line x1="${m.lx}" y1="${m.ly}" x2="${m.x}" y2="${m.y}" stroke="${gold}" stroke-width="${(0.9 * k).toFixed(2)}"/>` +
    `<circle cx="${m.x}" cy="${m.y}" r="${(1.5 * k).toFixed(2)}" fill="${gold}"/>` +
    `<circle cx="${m.lx}" cy="${m.ly}" r="${(6 * k).toFixed(2)}" fill="${gold}"/>` +
    `<text x="${m.lx}" y="${(m.ly + 2.6 * k).toFixed(2)}" text-anchor="middle" font-size="${(7.5 * k).toFixed(2)}" font-weight="700" fill="#10151f" style="font-family:'Vazirmatn',sans-serif">${toFa(i + 1)}</text>`).join('');
  return `<svg viewBox="${a.vb.join(' ')}" style="width:${W}px;max-width:100%;height:auto;display:block;background:#10151f;border-radius:10px" role="img" aria-label="شکلِ قطعه با بخش‌های شماره‌دار">${raVisual(kind)}${marks}</svg>`;
}
const raCard = ([k, t]) => `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:8px 0;border-top:1px solid #2a3346">${raGuideSvg(k)}<div class="hs-p" style="flex:1 1 200px"><b>${t}</b><br>${RA_WHAT[k]}${RA_ANAT[k].m.map((m, i) => `<div><b style="color:#d4af37">${toFa(i + 1)}.</b> ${m.t}</div>`).join('')}</div></div>`;
const RA_SLOTS = [
  { id:'s_sensors', kind:'sensors', pos:[70, 28],   label:'چشم‌ها' },
  { id:'s_board',   kind:'board',   pos:[128, 70],  label:'مغز' },
  { id:'s_driver',  kind:'driver',  pos:[130, 121], label:'درایور' },
  { id:'s_battery', kind:'battery', pos:[80, 174],  label:'باتری' },
  { id:'s_power',   kind:'power',   pos:[150, 178], label:'کلید' },
  { id:'s_reg',     kind:'reg',     pos:[196, 174], label:'رگولاتور' },
  { id:'s_motorL',  kind:'motor',   pos:[48, 113],  label:'موتور' },
  { id:'s_motorR',  kind:'motor',   pos:[250, 113], label:'موتور' },
  { id:'s_caster',  kind:'caster',  pos:[146, 212], label:'چرخ' }
];
const RA_WIRES = [
  { a:'s_sensors', b:'s_board',   d:'M160,48 V70' },
  { a:'s_board',   b:'s_driver',  d:'M160,98 V121' },
  { a:'s_driver',  b:'s_motorL',  d:'M130,141 H70' },
  { a:'s_driver',  b:'s_motorR',  d:'M190,141 H250' },
  { a:'s_battery', b:'s_driver',  d:'M138,174 V161' },
  { a:'s_battery', b:'s_power',   d:'M142,190 H150' },
  { a:'s_power',   b:'s_reg',     d:'M184,190 H196' }
];
function raVisual(kind){
  const [w, h] = RA_DIM[kind];
  const rc = (x, y, a, b, f, st, r) => `<rect x="${x}" y="${y}" width="${a}" height="${b}"${r ? ` rx="${r}"` : ''} fill="${f}"${st ? ` stroke="${st}"` : ''}/>`;
  const gold = '#d9b94a';
  if(kind === 'sensors'){
    let o = rc(0, 0, w, h, '#111418', '#3b4350', 2);
    for(let i = 0; i < 9; i++){
      const cx = 12 + i * 19.5;
      o += rc(cx - 1, 1.2, 2, 2, gold);                                   // پین هدر
      o += rc(cx - 7.5, 5, 15, 10, '#05070a', '#566070', 1.5);            // بدنه‌ی TCRT5000
      o += `<circle class="ra-eye" cx="${cx - 3}" cy="10" r="2.8" stroke-width="1"/>`; // LED مادون‌قرمز
      o += `<circle cx="${cx + 3.2}" cy="10" r="2.8" fill="#0b0d12" stroke="#7d8798" stroke-width=".9"/>`; // گیرنده
      o += rc(cx - 4, 16.2, 8, 1.6, '#8a7550', null, 0.5);                // مقاومت SMD
    }
    return o;
  }
  if(kind === 'board'){ // Blue Pill — STM32F103C8T6
    let o = rc(0, 0, w, h, '#1b4fa8', '#4a7fd8', 2);
    for(let i = 0; i < 20; i++){ const x = 4 + i * 2.9; o += rc(x, 0.8, 1.7, 3.2, gold) + rc(x, 24, 1.7, 3.2, gold); }
    o += rc(0, 9.5, 7, 9, '#c4cad3', '#7c8594', 1) + rc(0.8, 11.3, 3.2, 5.4, '#2a2f3a');          // پورت میکرو USB
    o += rc(11, 10.5, 5.5, 5.5, '#111', '#8a93a6', 0.8) + `<circle cx="13.75" cy="13.25" r="1.5" fill="#c4cad3"/>`; // دکمه‌ی ریست
    o += rc(25, 8, 12, 12, '#0e1117') + rc(24, 7, 14, 14, 'none', '#7c8594').replace('/>', ' stroke-dasharray="1.1 1.1" stroke-width="1.6"/>') + `<circle cx="27.4" cy="10.6" r="1" fill="#8a93a6"/>`; // چیپ STM32
    o += `<ellipse cx="46.5" cy="13.5" rx="4.2" ry="2.4" fill="#cfd4dc" stroke="#7c8594"/>`;          // کریستال ۸ مگاهرتز
    o += rc(55, 8, 2, 5, '#e6c200') + rc(58, 8, 2, 5, '#e6c200');                                    // جامپرهای BOOT
    o += `<circle cx="20.5" cy="21" r="1.4" fill="#ff5a4f"/>`;                                         // LED روی PC13
    return o;
  }
  if(kind === 'driver'){ // ماژول درایور TB6612
    let o = rc(0, 0, w, h, '#b3262e', '#e07a8c', 3);
    for(let i = 0; i < 8; i++){ const x = 6 + i * 6.6; o += rc(x, 1.2, 2.2, 2.6, gold) + rc(x, 36.2, 2.2, 2.6, gold); }
    o += rc(19, 12, 22, 16, '#0e1117') + rc(18, 11, 24, 18, 'none', '#b9bcc2').replace('/>', ' stroke-dasharray="1.2 1.2" stroke-width="1.8"/>');
    o += `<circle cx="22.5" cy="15.5" r="1.2" fill="#667"/>`;
    o += `<text class="ra-t" x="31" y="23.5" style="font-size:5px;fill:#cfd3da">TB6612</text>`;
    o += rc(4, 14, 7, 11, '#c9b48a', '#8a7550', 1) + rc(49, 14, 7, 11, '#c9b48a', '#8a7550', 1);        // خازن‌ها
    return o;
  }
  if(kind === 'reg'){ // رگولاتور LM2596
    let o = rc(0, 0, w, h, '#1e66c9', '#6aa0e8', 2);
    o += rc(0, 6, 5, 10, '#2b7be0', '#9cc3f0', 1) + rc(39, 6, 5, 10, '#2b7be0', '#9cc3f0', 1);          // ترمینال‌های پیچی
    o += rc(8, 3, 15, 15, '#101216', '#3a3f4a', 2) + `<circle cx="15.5" cy="10.5" r="5" fill="#2a2f3a" stroke="#8a93a6"/><circle cx="15.5" cy="10.5" r="2" fill="#4a5262"/>`; // سلف
    o += `<circle cx="29" cy="7" r="4.2" fill="#1b1e24" stroke="#8a93a6"/><circle cx="29" cy="7" r="1.8" fill="#c0c6d0"/>`; // خازن الکترولیت
    o += `<circle cx="29" cy="16" r="3.2" fill="#1b1e24" stroke="#8a93a6"/><circle cx="29" cy="16" r="1.4" fill="#c0c6d0"/>`;
    o += rc(33, 2, 7, 7, '#2b6cd0', '#9cc3f0', 1) + `<circle cx="36.5" cy="5.5" r="1.8" fill="${gold}"/><line x1="35.4" y1="5.5" x2="37.6" y2="5.5" stroke="#8a7550"/>`; // ولوم تنظیم ولتاژ
    o += `<circle cx="38" cy="16" r="1.1" fill="#ff5a4f"/>`;
    return o;
  }
  if(kind === 'power'){ // کلید راکر مینیِ مشکی (KCD1) از بالا؛ راکر افقی: نیمه‌ی چپ «۰» و نیمه‌ی راست «۱» — با روشن‌شدن ربات به سمت ۱ کج می‌شود
    let o = rc(2, 6, 3, 7, '#1a1c20', '#2a2d33', 1) + rc(29, 6, 3, 7, '#1a1c20', '#2a2d33', 1);       // گیره‌های کناری
    o += rc(4, 1, 26, 17, '#0c0d0f', '#2a2d33', 2.5);                                                    // بدنه
    o += rc(6, 3, 22, 13, '#16181c', null, 1.5);                                                         // قاب راکر
    o += `<path class="ra-sw-up" d="M7.5 4.5 H17 V14.5 H7.5 Z"/><path class="ra-sw-dn" d="M17 4.5 H26.5 V14.5 H17 Z"/>`;
    o += `<line x1="17" y1="4.5" x2="17" y2="14.5" stroke="#050506" stroke-width=".8"/>`;
    o += `<circle cx="12.2" cy="9.5" r="2.3" fill="none" stroke="#f1f1f1" stroke-width="1.2"/>`;                                          // ۰
    o += `<line class="ra-sw-mark" x1="21.8" y1="6.6" x2="21.8" y2="12.4" stroke="#f1f1f1" stroke-width="1.3" stroke-linecap="round"/>`;  // ۱
    o += [9, 20].map(x => rc(x, 18, 5, 6, 'url(#raMetal)', '#7c8594', 0.8) + rc(x + 1.7, 20, 1.6, 2.2, '#0d1119', null, 0.6)).join('');   // دو ترمینال
    return o;
  }
  if(kind === 'motor'){ // موتور N20 با گیربکس، انکودر و چرخ (چرخ سمت چپ؛ در جایگاه راست خودکار برعکس می‌شود)
    let o = rc(0, 3, 6, 36, '#15171c', '#4a515e', 2);
    [8, 13, 18, 23, 28, 33].forEach(y => { o += `<line x1="0.5" x2="5.5" y1="${y}" y2="${y}" stroke="#2f343d"/>`; });
    o += rc(1.5, 17, 3, 8, '#b8bcc6') + rc(6, 19, 3, 4, '#9aa3b0');
    o += rc(9, 8, 13, 26, '#c7ccd4', '#7a8290', 2) + `<circle cx="15.5" cy="12.5" r="1.3" fill="#7a8290"/><circle cx="15.5" cy="29.5" r="1.3" fill="#7a8290"/>`;
    o += rc(10, 34, 11, 14, '#b9bec8', '#7a8290', 3) + rc(13, 47, 5, 2, gold);
    o += rc(10, 48, 11, 8, '#1f7a3e', '#3da566', 1) + rc(13, 50, 5, 3, '#111');
    return o;
  }
  if(kind === 'caster'){ // چرخ هرزگردِ ساچمه‌ای
    return rc(0, 0, w, h, '#e6e3da', '#8a8f99', 5)
      + [[5, 5], [23, 5], [5, 23], [23, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#2a2f3a"/>`).join('')
      + `<circle cx="14" cy="14" r="8.8" fill="url(#raBall)" stroke="#6b7585"/>`;
  }
  // باتری لیپو ۲سل (۷٫۴ ولت): پوشش براق آبی، لبه‌ی فویلی، برچسب سفید، سیم قرمز/مشکی با کانکتور مشکی و سیم بالانس
  let o = rc(0, 3, 49, 26, 'url(#raLipo)', '#6f8fe0', 3);
  o += rc(0, 3, 5, 26, '#c9ced6', '#8a929e', 2) + `<line x1="2.5" x2="2.5" y1="6" y2="26" stroke="#9aa3b0" stroke-dasharray="1.5 1.5"/>`;
  o += rc(9, 6.5, 35, 19, '#f4f6fa', null, 2);
  o += `<text class="ra-t" x="26.5" y="15.5" textLength="26" lengthAdjust="spacingAndGlyphs" style="font-size:8px;fill:#16346f;font-weight:800">LiPo 2S</text>`;
  o += `<text class="ra-t" x="26.5" y="22.5" textLength="20" lengthAdjust="spacingAndGlyphs" style="font-size:6px;fill:#333;font-weight:700">7.4V</text>`;
  o += `<path d="M7 5 H44" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round"/>`;
  o += `<line x1="49" y1="12" x2="55" y2="12" stroke="#d6322b" stroke-width="2.6"/><line x1="49" y1="19" x2="55" y2="19" stroke="#15171c" stroke-width="2.6"/>`;
  o += rc(54, 8, 8, 15, '#23262b', '#4a515e', 1.5) + rc(57, 10, 3, 4, '#0a0b0d', null, 0.5) + rc(57, 17, 3, 4, '#0a0b0d', null, 0.5);   // کانکتور مشکی
  o += `<path d="M49 24 Q51 27 53 27" stroke="#f2f0ea" stroke-width="1" fill="none"/>` + rc(53, 25.5, 7, 4.5, '#f2f0ea', '#b5b2a8', 0.8);
  return o;
}

function mountRobotAssembleSim(container, { onSuccess, alreadyDone } = {}){
  const slotsHtml = RA_SLOTS.map(s => {
    const [w, h] = RA_DIM[s.kind];
    const t = s.kind === 'motor' ? `transform="translate(${w / 2 + 3} ${h / 2}) rotate(-90)"` : `x="${w / 2}" y="${h / 2 + 3}"`;
    return `<g class="ra-slotg" data-slot="${s.id}" transform="translate(${s.pos[0]} ${s.pos[1]})"><rect class="ra-slot" width="${w}" height="${h}" rx="5"/><text class="ra-slot-t" ${t}>${s.label}</text></g>`;
  }).join('');
  const wiresHtml = RA_WIRES.map(w => `<path class="ra-wire" d="${w.d}"/>`).join('');
  const partsHtml = RA_PARTS.map(p => {
    const [w, h] = RA_DIM[p.kind];
    return `<g class="ra-part" data-id="${p.id}" style="transform:translate(${p.tray[0]}px,${p.tray[1]}px)"><title>${p.name}</title><g class="ra-mv">${raVisual(p.kind)}</g><text class="ra-lbl" x="${w / 2}" y="${h + 11}">${p.lbl}</text><rect x="-4" y="-4" width="${w + 8}" height="${h + 22}" fill="transparent"/></g>`;
  }).join('');

  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note">هدف: بدنه‌ی ربات خالی است. نامِ هر قطعه زیرش نوشته شده؛ آن را با انگشت یا موس بگیر و روی جایگاه خط‌چینِ همان نام بینداز. وقتی همه‌ی قطعه‌ها نشستند، ربات را روشن کن. اگر نمی‌دانی یک قطعه چیست، یک بار رویش بزن تا توضیحش را ببینی.</div>
      <svg class="ra-svg" viewBox="0 0 320 446" role="img" aria-label="بدنه‌ی ربات تعقیب خط از بالا و قطعه‌های جداشده">
        <defs><linearGradient id="raMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f4f6f9"/><stop offset="55%" stop-color="#b3bac5"/><stop offset="100%" stop-color="#8a929e"/></linearGradient><linearGradient id="raLipo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a78ea"/><stop offset="100%" stop-color="#1b3f94"/></linearGradient><radialGradient id="raBall" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#ffffff"/><stop offset="55%" stop-color="#aeb4bf"/><stop offset="100%" stop-color="#5a6270"/></radialGradient></defs>
        <rect x="4" y="256" width="312" height="184" rx="10" fill="#0d1119" stroke="#2a3346"/>
        <g class="ra-bot" id="raBot">
          <path class="ra-chassis" d="M76,20 H244 L258,30 V54 L250,64 V105 H262 V177 H250 V208 L218,246 H102 L70,208 V177 H58 V105 H70 V64 L62,54 V30 Z"/>
          <path d="M76,20 H244 L258,30 V54 L250,64 V105 H262 V177 H250 V208 L218,246 H102 L70,208 V177 H58 V105 H70 V64 L62,54 V30 Z" fill="none" stroke="#c97c3d" stroke-opacity=".35" stroke-dasharray="2 3" transform="translate(160 135) scale(.95 .96) translate(-160 -135)"/>
          <g class="ra-pcb-deco">
            <circle cx="84" cy="76" r="3.2"/><circle cx="236" cy="76" r="3.2"/><circle cx="102" cy="222" r="3.2"/><circle cx="218" cy="222" r="3.2"/>
            <text x="160" y="63" class="ra-silk">LINE FOLLOWER</text>
            <path class="ra-trace" d="M78 80 V150 M242 80 V150 M86 100 H108 L116 108 V120 M234 100 H212 L204 108 V120"/>
          </g>
          <text class="ra-slot-t" x="160" y="16">▲ جلوی ربات</text>
          <g>${wiresHtml}</g>
          <g>${slotsHtml}</g>
        </g>
        ${partsHtml}
      </svg>
      <div class="ls-read"><span>قطعه‌های نشسته: <b class="mono" id="raCount"></b></span></div>
      <div class="ll-row">
        <button type="button" class="sim-btn sim-btn-run" id="raPower" disabled>⚡ روشنش کن</button>
        <button type="button" class="sim-btn sim-btn-ghost" id="raReset">↺ از اول</button>
      </div>
      <div class="sim-status" id="raStatus" data-state="idle"></div>
      <details class="hs-det">
        <summary>راهنمای قطعه‌ها: هر قطعه چیست؟</summary>
        ${RA_GUIDE.map(raCard).join('')}
      </details>
    </div>`;

  const q = s => container.querySelector(s);
  const svg = q('.ra-svg'), bot = q('#raBot'), powerBtn = q('#raPower'), countEl = q('#raCount'), st = q('#raStatus');
  const wireEls = Array.from(container.querySelectorAll('.ra-wire'));
  const slotEls = {};
  RA_SLOTS.forEach(s => { slotEls[s.id] = container.querySelector(`[data-slot="${s.id}"]`); });
  const parts = {};
  RA_PARTS.forEach(p => { parts[p.id] = { ...p, x: p.tray[0], y: p.tray[1], slot: null, el: container.querySelector(`.ra-part[data-id="${p.id}"]`) }; });
  const filled = {};
  let drag = null, powered = false, succeeded = !!alreadyDone, bounceTimer = 0;

  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };
  const placedCount = () => Object.keys(filled).length;
  const setPos = p => { p.el.style.transform = `translate(${p.x}px,${p.y}px)`; };
  const toPt = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  const center = (pos, kind) => [pos[0] + RA_DIM[kind][0] / 2, pos[1] + RA_DIM[kind][1] / 2];
  const slotRect = id => slotEls[id].querySelector('.ra-slot');
  function clearMarks(){ RA_SLOTS.forEach(s => slotRect(s.id).classList.remove('hot', 'hint')); }

  function nearest(p, sameKind){
    const pc = center([p.x, p.y], p.kind);
    let best = null;
    RA_SLOTS.forEach(s => {
      if(filled[s.id] || (sameKind && s.kind !== p.kind)) return;
      const sc = center(s.pos, s.kind), d = Math.hypot(pc[0] - sc[0], pc[1] - sc[1]);
      if(!best || d < best.d) best = { s, d };
    });
    return best;
  }
  function updateUi(){
    const n = placedCount();
    countEl.textContent = `${toFa(n)} از ${toFa(RA_PARTS.length)}`;
    powerBtn.disabled = powered || n < RA_PARTS.length;
    RA_WIRES.forEach((w, i) => wireEls[i].classList.toggle('on', !!(filled[w.a] && filled[w.b])));
  }
  function flipMotor(p, flip){
    if(p.kind !== 'motor') return;
    const mv = p.el.querySelector('.ra-mv');
    if(mv) mv.setAttribute('transform', flip ? `translate(${RA_DIM.motor[0]} 0) scale(-1 1)` : '');
  }
  function snap(p, slot){
    filled[slot.id] = p.id; p.slot = slot;
    p.x = slot.pos[0]; p.y = slot.pos[1];
    p.el.classList.remove('back'); p.el.classList.add('placed');
    setPos(p);
    flipMotor(p, slot.id === 's_motorR');
    bot.appendChild(p.el);
    slotEls[slot.id].classList.add('filled');
    updateUi();
  }
  function sendBack(p){
    flipMotor(p, false);
    p.x = p.tray[0]; p.y = p.tray[1];
    p.el.classList.add('back');
    setPos(p);
  }

  Object.values(parts).forEach(p => { p.el.style.touchAction = 'none'; });
  const grabbable = t => { const el = t.closest ? t.closest('.ra-part') : null; return !!el && !el.classList.contains('placed') && !powered; };
  svg.addEventListener('touchstart', e => { if(grabbable(e.target)) e.preventDefault(); }, { passive: false });
  svg.addEventListener('touchmove', e => { if(drag) e.preventDefault(); }, { passive: false });
  svg.addEventListener('pointerdown', e => {
    const el = e.target.closest ? e.target.closest('.ra-part') : null;
    if(el && el.classList.contains('placed')){ const pp = parts[el.dataset.id]; say('idle', `ℹ️ «${pp.name}»: ${raWhat(pp)}`); return; }
    if(!el || powered) return;
    const p = parts[el.dataset.id], pt = toPt(e);
    drag = { p, dx: pt.x - p.x, dy: pt.y - p.y, sx: pt.x, sy: pt.y, moved: false };
    el.classList.remove('back');
    svg.appendChild(el);
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
    clearMarks();
    say('running', `✋ «${p.name}»: ${raWhat(p)} 👉 آن را روی جایگاه خط‌چینِ خودش ببر.`);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if(!drag) return;
    const pt = toPt(e), p = drag.p;
    if(Math.hypot(pt.x - drag.sx, pt.y - drag.sy) > 6) drag.moved = true;
    p.x = pt.x - drag.dx; p.y = pt.y - drag.dy;
    setPos(p);
    clearMarks();
    const n = nearest(p, true);
    if(n && n.d < 38) slotRect(n.s.id).classList.add('hot');
  });
  function endDrag(){
    if(!drag) return;
    const { p, moved } = drag; drag = null;
    clearMarks();
    const same = nearest(p, true);
    if(same && same.d < 38){
      snap(p, same.s);
      const n = placedCount();
      say(n === RA_PARTS.length ? 'running' : 'success', n === RA_PARTS.length ? `${p.info} همه‌ی قطعه‌ها سر جایشان نشستند! حالا ربات را روشن کن.` : p.info);
      return;
    }
    const any = nearest(p, false);
    sendBack(p);
    if(!moved){
      RA_SLOTS.forEach(s => { if(!filled[s.id] && s.kind === p.kind) slotRect(s.id).classList.add('hint'); });
      const target = RA_SLOTS.find(s => !filled[s.id] && s.kind === p.kind);
      say('idle', `ℹ️ «${p.name}»: ${raWhat(p)} 💡 جایش: خط‌چینِ «${target ? target.label : ''}». آن را بگیر و ببر.`);
      return;
    }
    if(any && any.d < 38 && any.s.kind !== p.kind) say('error', `⚠️ این‌جا جای «${any.s.label}» است؛ «${p.name}» جای دیگری می‌نشیند. دوباره امتحان کن.`);
    else say('idle', '↩️ قطعه را درست روی جایگاه خط‌چین بینداز. اگر کمک خواستی، یک بار رویش بزن.');
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  powerBtn.addEventListener('click', () => {
    if(powered || placedCount() < RA_PARTS.length) return;
    powered = true; updateUi();
    wireEls.forEach(w => w.classList.add('live'));
    bot.classList.add('powered');
    bot.style.transform = 'translate(0px,-12px)';
    bounceTimer = setTimeout(() => { bot.style.transform = ''; }, 700);
    say('success', '✅ ربات روشن شد! چشم‌ها روشن شدند و جریان از باتری و کلید به رگولاتور، مغز، درایور و موتورها می‌رسد. بدنه آماده‌ی برنامه‌ریزی است.');
    if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
  });

  function reset(){
    clearTimeout(bounceTimer);
    powered = false;
    Object.keys(filled).forEach(k => delete filled[k]);
    Object.values(parts).forEach(p => {
      p.slot = null; p.el.classList.remove('placed'); sendBack(p); svg.appendChild(p.el);
    });
    RA_SLOTS.forEach(s => slotEls[s.id].classList.remove('filled'));
    wireEls.forEach(w => w.classList.remove('live'));
    bot.classList.remove('powered'); bot.style.transform = '';
    clearMarks(); updateUi();
    say('idle', '🛠️ بدنه‌ی ربات خالی است. یک قطعه را بگیر و روی جایگاه خط‌چینِ خودش بینداز.');
  }
  q('#raReset').addEventListener('click', reset);

  updateUi();
  if(alreadyDone){
    Object.values(parts).forEach(p => {
      const s = RA_SLOTS.find(x => !filled[x.id] && x.kind === p.kind);
      if(s) snap(p, s);
    });
    say('success', '✅ قبلاً این ربات را سر هم کرده‌ای. دوست داری دوباره بچینی؟ «از اول» را بزن.');
  } else {
    say('idle', '🛠️ بدنه‌ی ربات خالی است. یک قطعه را بگیر و روی جایگاه خط‌چینِ خودش بینداز.');
  }
  return { stop(){ drag = null; clearTimeout(bounceTimer); } };
}

/* ================= LINE SENSOR (robotics step 1) =================
   سنسور مادون‌قرمز خط‌یاب: سنسور را روی مسیر بکش، عدد نورِ برگشتی را ببین و
   آستانه را جوری تنظیم کن که روی سفید «سفید» و روی خط مشکی «مشکی» بخواند.
   وقتی هر دو حالت (با آستانه‌ی فعلی) درست خوانده شدند، مأموریت تکمیل می‌شود. */
const LS_LINE = { from: 130, to: 190 }, LS_SPOT = 10, LS_W = 320;
function lsBlackFrac(x){
  const overlap = Math.min(x + LS_SPOT, LS_LINE.to) - Math.max(x - LS_SPOT, LS_LINE.from);
  return Math.max(0, Math.min(1, overlap / (2 * LS_SPOT)));
}
function lsReading(x){ return Math.round(900 - 800 * lsBlackFrac(x)); }

function mountLineSensorSim(container, { onSuccess, alreadyDone } = {}){
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-controls">
        <div class="sim-hw-note">هدف: ربات را روی مسیر بکش (سنسور جلوی آن است) و آن را روی <b>سفید</b> و روی <b>خط مشکی</b> ببر و آستانه را جوری بگذار که LED فقط روی مشکی روشن شود. بعضی ماژول‌ها منطق را برعکس می‌دهند؛ مفهوم همان است.</div>
      </div>
      <svg class="ls-svg" viewBox="0 0 ${LS_W} 180" direction="ltr" role="img" aria-label="سنسور مادون‌قرمز روی مسیر سفید با خط مشکی">
        <rect x="0" y="100" width="${LS_W}" height="70" rx="6" fill="#e9e6dc"/>
        <rect x="${LS_LINE.from}" y="100" width="${LS_LINE.to - LS_LINE.from}" height="70" fill="#111"/>
        <g id="lsSens"><rect x="-24" y="8" width="48" height="40" rx="9" fill="#1a2130" stroke="#c97c3d" stroke-width="1.5"/><rect x="-31" y="14" width="7" height="26" rx="2" fill="#2a2f3a"/><rect x="24" y="14" width="7" height="26" rx="2" fill="#2a2f3a"/><polygon points="-6,66 6,66 ${LS_SPOT},100 -${LS_SPOT},100" fill="rgba(255,110,110,.45)"/><rect x="-16" y="42" width="32" height="24" rx="4" fill="#2b6cb0"/><text x="0" y="59" font-size="11" fill="#fff" text-anchor="middle">IR</text></g>
        <circle id="lsLed" cx="285" cy="30" r="12" fill="#3a3f4a" stroke="#666" stroke-width="2"/><text x="285" y="58" font-size="11" fill="#cfc8b6" text-anchor="middle">LED</text>
      </svg>
      <div class="ls-read"><span>نورِ برگشتی: <b class="mono" id="lsVal"></b></span><span>آستانه: <b class="mono" id="lsThr"></b></span><span id="lsTxt"></span></div>
      <label class="ls-field">موقعیت سنسور<input type="range" id="lsPos" dir="ltr" min="0" max="${LS_W}" value="40"></label>
      <label class="ls-field">آستانه (Threshold)<input type="range" id="lsTh" dir="ltr" min="20" max="980" step="10" value="60"></label>
      <div class="sim-status" id="lsStatus" data-state="${alreadyDone ? 'success' : 'idle'}"></div>
    </div>`;
  const $q = s => container.querySelector(s);
  const svg = $q('.ls-svg'), sens = $q('#lsSens'), led = $q('#lsLed'), pos = $q('#lsPos'), th = $q('#lsTh');
  const valEl = $q('#lsVal'), thrEl = $q('#lsThr'), txtEl = $q('#lsTxt'), st = $q('#lsStatus');
  let succeeded = !!alreadyDone, okW = false, okB = false, lastHint = '';
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };
  const hint = (key, text) => { if(key !== lastHint){ lastHint = key; showKnightLine(text, 'happy', 'knight'); } };

  function refresh(){
    const x = +pos.value, frac = lsBlackFrac(x), v = lsReading(x), thr = +th.value, black = v < thr;
    sens.setAttribute('transform', `translate(${x} 0)`);
    valEl.textContent = toFa(v); thrEl.textContent = toFa(thr);
    led.setAttribute('fill', black ? '#ffd25a' : '#3a3f4a');
    txtEl.textContent = black ? 'می‌گوید: مشکی (LED روشن)' : 'می‌گوید: سفید (LED خاموش)';
    if(frac === 0 && !black) okW = true;
    if(frac === 1 && black) okB = true;
    if(okW && okB){
      say('success', '✅ عالی! سنسورت سفید و مشکی را درست تشخیص می‌دهد. چشمِ ربات آماده است؛ قدم بعد: تصمیم‌گیری با کد.');
      if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
      return;
    }
    if(succeeded) return;
    if(frac === 1 && !black){ say('error', '⚠️ روی خط مشکی هستی ولی LED خاموش است: آستانه خیلی پایین است. آن را بالاتر ببر.'); hint('low', 'عدد روی مشکی حدود ۱۰۰ است. آستانه باید بالاتر از ۱۰۰ باشد تا سنسور «مشکی» بگوید.'); }
    else if(frac === 0 && black){ say('error', '⚠️ روی سفید هستی ولی LED روشن است: آستانه خیلی بالاست. آن را پایین بیاور.'); hint('high', 'عدد روی سفید حدود ۹۰۰ است. آستانه باید پایین‌تر از ۹۰۰ باشد.'); }
    else if(frac > 0 && frac < 1) say('running', '↔️ لبه‌ی خط است؛ عدد بین ۹۰۰ و ۱۰۰ است. سنسور را کامل روی سفید یا مشکی ببر.');
    else say('idle', okW ? '✅ روی سفید درست خواند. حالا سنسور را روی خط مشکی ببر.' : okB ? '✅ روی مشکی درست خواند. حالا سنسور را روی سفید ببر.' : '🤖 سنسور را روی مسیر بکش و عدد را ببین.');
  }
  let drag = false;
  const fromEvent = e => { const r = svg.getBoundingClientRect(); pos.value = Math.max(0, Math.min(LS_W, (e.clientX - r.left) / r.width * LS_W)); refresh(); };
  svg.addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); fromEvent(e); });
  svg.addEventListener('pointermove', e => { if(drag) fromEvent(e); });
  ['pointerup', 'pointercancel'].forEach(ev => svg.addEventListener(ev, () => { drag = false; }));
  pos.addEventListener('input', refresh);
  th.addEventListener('input', () => { okW = okB = false; refresh(); });
  if(alreadyDone){ okW = okB = true; }
  refresh();
  return { stop(){ drag = false; } };
}

/* ================= IR EXPLAINER (افزوده‌ی توضیحیِ مأموریت «چشمِ ربات») =================
   سه آزمایش کوچک پیش از شبیه‌ساز سنسور — روی تکمیل مأموریت اثری ندارند:
   ۱) طیف نور: IR دقیقاً کجاست و چشم/سنسور هرکدام کدام بازه را می‌بینند.
   ۲) چشم در برابر سنسور IR: همان رنگ‌ها با «دیدِ چشم» و «دیدِ سنسور».
   ۳) چرا خط مشکی روی زمینه‌ی سفید: نورِ بازتابیده به گیرنده روی سطح سفید و مشکی.
   عددهای بازتاب IR تقریبی‌اند (به جنس رنگ/جوهر بستگی دارند) و برای درک مفهوم‌اند. */
const IR_SWATCHES = [
  { name:'قرمز',  css:'#d6322b', ir:80 },
  { name:'آبی',   css:'#2b55d6', ir:70 },
  { name:'سبز',   css:'#2fa84a', ir:75 },
  { name:'زرد',   css:'#f0d02a', ir:88 },
  { name:'سفید',  css:'#f2f2f2', ir:90 },
  { name:'مشکی',  css:'#111111', ir:8 }
];
const IR_PAIRS = [
  { title:'آبی روی قرمز',  a:IR_SWATCHES[0], b:IR_SWATCHES[1] },
  { title:'مشکی روی سفید', a:IR_SWATCHES[4], b:IR_SWATCHES[5] }
];
function irGray(p){ const g = Math.round(255 * p / 100); return `rgb(${g},${g},${g})`; }
function irWlName(wl){
  if(wl < 380) return 'فرابنفش (نامرئی)';
  if(wl < 450) return 'بنفش';
  if(wl < 495) return 'آبی';
  if(wl < 570) return 'سبز';
  if(wl < 590) return 'زرد';
  if(wl < 620) return 'نارنجی';
  if(wl <= 750) return 'قرمز';
  return 'مادون‌قرمز (نامرئی)';
}

function mountIrExplainSim(container){
  const SX = wl => 10 + (wl - 350) * 0.4; // نگاشت طول موج (نانومتر) به x در SVG
  const EYE = [380, 750], SENS = [780, 1100], LED_WL = 940;
  const stops = [[380,'#5a0fb5'],[440,'#2f45ff'],[490,'#00c2ff'],[530,'#2bd44a'],[580,'#ffe600'],[620,'#ff8a00'],[700,'#ff1a1a'],[750,'#5a0000']]
    .map(([w, c]) => `<stop offset="${((w - 380) / 370 * 100).toFixed(1)}%" stop-color="${c}"/>`).join('');
  const swHtml = IR_SWATCHES.map((s, i) => `<div class="ir-sw" data-i="${i}"><div class="ir-sw-box"></div><div class="ir-sw-name">${s.name}</div><div class="ir-sw-val mono"></div></div>`).join('');
  const pairHtml = IR_PAIRS.map((p, i) => `<div class="ir-pair" data-i="${i}"><div class="ir-pair-title">${p.title}</div><div class="ir-pair-boxes"><div class="ir-pair-a"></div><div class="ir-pair-b"></div></div><div class="ir-pair-note"></div></div>`).join('');

  container.innerHTML = `
    <div class="sim-wrap ir-wrap">
      <div class="sim-hw-note">این بخش فقط برای فهمیدن مفهوم است — روی تکمیل مأموریت اثری ندارد. سه آزمایش کوتاه را امتحان کن، بعد برو سراغ سنسور.</div>

      <div class="ir-h">۱) مادون‌قرمز (IR) دقیقاً چیست؟</div>
      <div class="ir-p">نور یک موج است و «رنگش» به <b>طول موجش</b> (بر حسب نانومتر) بستگی دارد. چشم ما فقط بازه‌ی باریکی از این موج‌ها را می‌بیند: از بنفش تا قرمز. درست بعد از قرمز، موج‌هایی هستند که فرکانسشان از قرمز پایین‌تر است («مادون» یعنی پایین‌تر)؛ همین‌ها <b>مادون‌قرمزند</b>. چشم آن‌ها را نمی‌بیند، ولی سنسور IR می‌بیند. LED داخل سنسور خط‌یاب هم نوری حدود ۹۴۰ نانومتر می‌فرستد: برای ما تاریک، برای گیرنده‌ی سنسور روشن! نشانگر را روی طیف بکش.</div>
      <svg class="ir-svg" viewBox="0 0 320 120" direction="ltr" role="img" aria-label="طیف نور: فرابنفش، نور مرئی و مادون‌قرمز">
        <defs>
          <linearGradient id="irGrad" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>
          <pattern id="irHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#161b26"/><line x1="0" y1="0" x2="0" y2="6" stroke="#2c3446" stroke-width="2"/></pattern>
        </defs>
        <rect x="${SX(350)}" y="30" width="${SX(380) - SX(350)}" height="28" fill="#2a1747"/>
        <rect x="${SX(380)}" y="30" width="${SX(750) - SX(380)}" height="28" fill="url(#irGrad)"/>
        <rect x="${SX(750)}" y="30" width="${SX(1100) - SX(750)}" height="28" fill="url(#irHatch)"/>
        <text x="${SX(365)}" y="24" font-size="8" text-anchor="middle">UV</text>
        <text x="${(SX(380) + SX(750)) / 2}" y="24" font-size="9" text-anchor="middle">نور مرئی</text>
        <text x="${SX(925)}" y="24" font-size="9" text-anchor="middle">مادون‌قرمز (نامرئی)</text>
        <g stroke="#57d8a3" stroke-width="2"><line x1="${SX(EYE[0])}" y1="72" x2="${SX(EYE[1])}" y2="72"/><line x1="${SX(EYE[0])}" y1="68" x2="${SX(EYE[0])}" y2="76"/><line x1="${SX(EYE[1])}" y1="68" x2="${SX(EYE[1])}" y2="76"/></g>
        <text x="${(SX(EYE[0]) + SX(EYE[1])) / 2}" y="89" font-size="9" text-anchor="middle" style="fill:#57d8a3">👁️ چشم انسان</text>
        <g stroke="#d4af37" stroke-width="2"><line x1="${SX(SENS[0])}" y1="72" x2="${SX(SENS[1])}" y2="72"/><line x1="${SX(SENS[0])}" y1="68" x2="${SX(SENS[0])}" y2="76"/><line x1="${SX(SENS[1])}" y1="68" x2="${SX(SENS[1])}" y2="76"/></g>
        <text x="${(SX(SENS[0]) + SX(SENS[1])) / 2}" y="89" font-size="9" text-anchor="middle" style="fill:#d4af37">📡 سنسور IR</text>
        <polygon points="${SX(LED_WL) - 4},64 ${SX(LED_WL) + 4},64 ${SX(LED_WL)},58" style="fill:#ff5a4f"/>
        <text x="${SX(LED_WL)}" y="112" font-size="8" text-anchor="middle" style="fill:#ff9c92">نورِ LED سنسور: ۹۴۰ نانومتر</text>
        <line id="irCur" x1="${SX(LED_WL)}" y1="26" x2="${SX(LED_WL)}" y2="62" style="stroke:#fff" stroke-width="2"/>
        <circle id="irCurDot" cx="${SX(LED_WL)}" cy="26" r="3.5" style="fill:#fff"/>
      </svg>
      <label class="ls-field">طول موج: <b><span class="mono" id="irWl"></span> نانومتر — <span id="irName"></span></b><input type="range" id="irWlRange" dir="ltr" min="350" max="1100" step="5" value="${LED_WL}"></label>
      <div class="ir-presets">
        <button type="button" class="sim-btn sim-btn-ghost" data-wl="650">🔴 نور قرمز (۶۵۰)</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-wl="940">📡 LED سنسور (۹۴۰)</button>
      </div>
      <div class="ir-chips"><div class="ir-chip" id="irEye"></div><div class="ir-chip" id="irSens"></div></div>
      <div class="sim-hw-note">🔎 امتحانش کن: LED کنترل تلویزیون هم مادون‌قرمز است. دوربین جلوی گوشی را رویش بگیر و دکمه را بزن؛ با چشم هیچ نوری نیست ولی در صفحه‌ی گوشی می‌درخشد (معمولاً دوربین جلو این‌کار را می‌کند، نه عقب).</div>

      <div class="ir-h">۲) چشم و سنسور IR یک چیز را یک‌جور نمی‌بینند</div>
      <div class="ir-p">چشم رنگ‌ها را از روی نورِ مرئیِ بازتابیده تشخیص می‌دهد. سنسور IR فقط یک سؤال دارد: «چقدر نور <b>مادون‌قرمز</b> برگشت؟». برای همین دو رنگی که برای چشم کاملاً فرق دارند، ممکن است برای سنسور تقریباً یکی باشند. بین دو حالت جابه‌جا شو و مقایسه کن.</div>
      <div class="ir-tabs">
        <button type="button" class="sim-btn sim-btn-run" data-v="eye">👁️ دیدِ چشم</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-v="ir">📡 دیدِ سنسور IR</button>
      </div>
      <div class="ir-sw-grid">${swHtml}</div>
      <div class="ir-pairs">${pairHtml}</div>
      <div class="sim-hw-note">عددها تقریبی‌اند؛ مقدار واقعی به جنس جوهر یا رنگ بستگی دارد. برای همین بعداً سنسور را روی مسیر خودت امتحان و تنظیم می‌کنی.</div>

      <div class="ir-h">۳) چرا معمولاً خط مشکی و زمینه سفید است؟</div>
      <div class="ir-p">سنسور یک LED مادون‌قرمز دارد که نور می‌فرستد و یک گیرنده که نورِ برگشتی را اندازه می‌گیرد. سطح <b>سفید</b> بیشترِ نور را برمی‌گرداند و سطح <b>مشکی</b> بیشترش را جذب می‌کند. هرچه اختلافِ نورِ برگشتی بین خط و زمینه بیشتر باشد، تشخیص خط ساده‌تر است. سطح را عوض کن و ببین گیرنده چقدر نور می‌گیرد.</div>
      <div class="ir-tabs">
        <button type="button" class="sim-btn sim-btn-run" data-s="white">⬜ سطح سفید</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-s="black">⬛ سطح مشکی</button>
      </div>
      <svg class="ir-svg" viewBox="0 0 320 180" direction="ltr" role="img" aria-label="LED مادون‌قرمز نور می‌فرستد و گیرنده نورِ بازتابیده از سطح را می‌گیرد">
        <defs>
          <marker id="irArR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff5a4f"/></marker>
          <marker id="irArG" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#57d8a3"/></marker>
        </defs>
        <rect x="94" y="52" width="32" height="46" rx="6" style="fill:#2a2f3a;stroke:#667"/>
        <text x="110" y="44" font-size="9" text-anchor="middle">گیرنده</text>
        <rect x="194" y="52" width="32" height="46" rx="6" style="fill:#b3261e;stroke:#ff8a80"/>
        <text x="210" y="44" font-size="9" text-anchor="middle">LED IR</text>
        <rect id="irSurf" x="40" y="138" width="240" height="30" rx="4" style="fill:#e9e6dc;stroke:#667"/>
        <line x1="200" y1="100" x2="158" y2="134" stroke="#ff5a4f" stroke-width="2.4" marker-end="url(#irArR)"/>
        <line x1="214" y1="100" x2="178" y2="134" stroke="#ff5a4f" stroke-width="2.4" marker-end="url(#irArR)"/>
        <g id="irRefl" stroke="#57d8a3" marker-end="url(#irArG)">
          <line x1="150" y1="134" x2="104" y2="102"/>
          <line x1="162" y1="134" x2="112" y2="102"/>
          <line x1="174" y1="134" x2="120" y2="102"/>
        </g>
      </svg>
      <div class="ls-read"><span>نورِ برگشتی به گیرنده: <b id="irReflTxt"></b></span><span>خروجی سنسور: <b class="mono" id="irOut"></b></span></div>
      <div class="ir-meter"><div class="ir-meter-fill" id="irMeter"></div></div>
      <div class="sim-hw-note">خط سفید روی زمینه‌ی مشکی هم کار می‌کند، اما خط مشکی روی سفید رایج‌تر است و بیشتر کدها برای همین حالت نوشته شده‌اند. رنگ‌هایی مثل آبی روی قرمز را هم برای خط انتخاب نکن، چون برای سنسور تقریباً هم‌روشنایی‌اند.</div>
      <div class="sim-hw-note">⚠️ در دنیای واقعی فاصله و زاویه‌ی سنسور، نور محیط، براق‌بودن سطح و کثیفیِ سنسور هم روی عدد اثر می‌گذارند؛ برای همین در مرحله‌ی بعد «آستانه» را روی مسیر خودت تنظیم می‌کنی (کالیبراسیون).</div>
    </div>`;

  const q = s => container.querySelector(s);
  const qa = s => Array.from(container.querySelectorAll(s));

  /* ---- ۱) طیف ---- */
  const range = q('#irWlRange'), cur = q('#irCur'), curDot = q('#irCurDot');
  const wlEl = q('#irWl'), nameEl = q('#irName'), eyeEl = q('#irEye'), sensEl = q('#irSens');
  function updateWl(){
    const wl = +range.value, x = SX(wl);
    cur.setAttribute('x1', x); cur.setAttribute('x2', x); curDot.setAttribute('cx', x);
    wlEl.textContent = toFa(wl); nameEl.textContent = irWlName(wl);
    const eye = wl >= EYE[0] && wl <= EYE[1], sens = wl >= SENS[0] && wl <= SENS[1];
    eyeEl.textContent = `👁️ چشم: ${eye ? 'می‌بیند ✅' : 'نمی‌بیند ❌'}`;
    sensEl.textContent = `📡 سنسور IR: ${sens ? 'می‌بیند ✅' : 'نمی‌بیند ❌'}`;
    eyeEl.classList.toggle('on', eye); sensEl.classList.toggle('on', sens);
  }
  range.addEventListener('input', updateWl);

  /* ---- ۲) رنگ‌ها: چشم در برابر IR ---- */
  let view = 'eye';
  function paintColors(){
    const ir = view === 'ir';
    qa('.ir-sw').forEach(el => {
      const s = IR_SWATCHES[+el.dataset.i];
      el.querySelector('.ir-sw-box').style.background = ir ? irGray(s.ir) : s.css;
      el.querySelector('.ir-sw-val').textContent = ir ? `بازتاب IR ≈ ${toFa(s.ir)}٪` : '';
    });
    qa('.ir-pair').forEach(el => {
      const p = IR_PAIRS[+el.dataset.i], diff = Math.abs(p.a.ir - p.b.ir);
      el.querySelector('.ir-pair-a').style.background = ir ? irGray(p.a.ir) : p.a.css;
      el.querySelector('.ir-pair-b').style.background = ir ? irGray(p.b.ir) : p.b.css;
      el.querySelector('.ir-pair-note').textContent = ir
        ? (diff < 25 ? `اختلاف سیگنال ≈ ${toFa(diff)}٪ ⚠️ سنسور تقریباً فرقی نمی‌بیند` : `اختلاف سیگنال ≈ ${toFa(diff)}٪ ✅ سنسور راحت تشخیص می‌دهد`)
        : '👁️ برای چشم تفاوت کاملاً واضح است';
    });
    qa('[data-v]').forEach(b => {
      const on = b.dataset.v === view;
      b.classList.toggle('sim-btn-run', on); b.classList.toggle('sim-btn-ghost', !on);
    });
  }

  /* ---- ۳) بازتاب: سفید یا مشکی ---- */
  let surf = 'white';
  function paintSurface(){
    const white = surf === 'white', refl = white ? 0.9 : 0.08;
    q('#irSurf').style.fill = white ? '#e9e6dc' : '#111111';
    const g = q('#irRefl');
    g.setAttribute('stroke-opacity', (0.12 + 0.88 * refl).toFixed(2));
    g.setAttribute('stroke-width', (0.8 + 2.6 * refl).toFixed(1));
    q('#irReflTxt').textContent = white ? 'زیاد' : 'خیلی کم';
    q('#irOut').textContent = toFa(white ? 900 : 100);
    q('#irMeter').style.width = (white ? 90 : 10) + '%';
    qa('[data-s]').forEach(b => {
      const on = b.dataset.s === surf;
      b.classList.toggle('sim-btn-run', on); b.classList.toggle('sim-btn-ghost', !on);
    });
  }

  container.addEventListener('click', e => {
    const t = e.target.closest ? e.target.closest('button') : null;
    if(!t) return;
    if(t.dataset.wl){ range.value = t.dataset.wl; updateWl(); }
    else if(t.dataset.v){ view = t.dataset.v; paintColors(); }
    else if(t.dataset.s){ surf = t.dataset.s; paintSurface(); }
  });

  updateWl(); paintColors(); paintSurface();
  return { stop(){} };
}

/* مأموریت «چشمِ ربات»: اول توضیحِ IR، بعد شبیه‌ساز سنسور (که خودش مأموریت را تکمیل می‌کند). */
function mountLineSensorMission(container, opts = {}){
  container.innerHTML = '<div id="irExplainMount"></div><div id="lineSensorSimMount" style="margin-top:14px;"></div>';
  const explain = mountIrExplainSim(container.querySelector('#irExplainMount'));
  const sensor = mountLineSensorSim(container.querySelector('#lineSensorSimMount'), opts);
  return { stop(){ explain.stop(); sensor.stop(); } };
}

/* ================= STM32 + ROBOTICS SIMS ================= */
/* مأموریت‌های «STM32 — CubeMX» و کدنویسی HAL (خواندن سنسور، مغز، جهت و سرعت موتور)
   در دو فایل جدا هستند: cube-block.js (نقشه‌ی چیپ و ساعت) و hal-code-editor.js (ادیتور و اجرا).
   هر دو باید قبل از quest.js بارگذاری شوند. */

/* ---- رباتیک ۶: دنبال‌کردن خط (سنسور + تصمیم + موتور) ---- */
const LF_PTS = []; for(let px = 20; px <= 300; px += 5) LF_PTS.push([px, 95 + 50 * Math.sin((px - 20) / 40)]);
function lfDist(p){
  let best = 1e9;
  for(let i = 0; i < LF_PTS.length - 1; i++){
    const a = LF_PTS[i], b = LF_PTS[i + 1], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
  }
  return best;
}
function lfNew(){ return { x: 20, y: 95, phi: Math.atan2(50 / 40, 1), w: 0, t: 0, lost: 0, lastErr: 0, sens: [0, 0, 0], done: false, fail: '' }; }
function lfStep(s, dt, speed, K){
  const f = [Math.cos(s.phi), Math.sin(s.phi)], r = [-Math.sin(s.phi), Math.cos(s.phi)];
  const see = o => lfDist([s.x + f[0] * 16 + r[0] * o, s.y + f[1] * 16 + r[1] * o]) < 5.5;
  const Ls = see(-14), Cs = see(0), Rs = see(14);
  let err = (Rs ? 1 : 0) - (Ls ? 1 : 0);
  if(!Ls && !Cs && !Rs){ s.lost += dt; err = s.lastErr; } else { s.lost = 0; if(err !== 0) s.lastErr = err; }
  s.w += (K * err - s.w) * Math.min(1, dt / 0.12);
  s.phi += s.w * dt;
  s.x += Math.cos(s.phi) * speed * dt; s.y += Math.sin(s.phi) * speed * dt;
  s.t += dt; s.sens = [Ls ? 1 : 0, Cs ? 1 : 0, Rs ? 1 : 0];
  if(s.lost > 1.2) s.fail = 'lost';
  else if(s.x >= 295) s.done = true;
  else if(s.t > 40) s.fail = 'time';
}
function mountLineFollowSim(container, { onSuccess, alreadyDone } = {}){
  const d = 'M' + LF_PTS.map(p => p[0] + ',' + p[1].toFixed(1)).join(' L');
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note">هدف: سرعت و شدت پیچیدن را جوری تنظیم کن که ربات تا <b>خط پایان 🏁</b> خط را دنبال کند و بیش از یک ثانیه گم نشود.</div>
      <svg class="ls-svg" viewBox="0 0 320 190" direction="ltr" role="img" aria-label="مسیر موج‌دار با ربات سه‌سنسوره" style="cursor:default">
        <rect width="320" height="190" fill="#e9e6dc"/><path d="${d}" fill="none" stroke="#111" stroke-width="9" stroke-linejoin="round"/>
        <text x="300" y="70" font-size="18" text-anchor="middle">🏁</text>
        <g id="lfBot"><rect x="-8" y="-9" width="16" height="18" rx="3" fill="#2b6cb0"/><circle id="lfS0" cx="16" cy="-14" r="3.5" fill="#555"/><circle id="lfS1" cx="16" cy="0" r="3.5" fill="#555"/><circle id="lfS2" cx="16" cy="14" r="3.5" fill="#555"/></g>
      </svg>
      <label class="ls-field">سرعت: <b class="mono" id="lfSv"></b><input type="range" id="lfSp" dir="ltr" min="30" max="140" value="100"></label>
      <label class="ls-field">شدت پیچیدن: <b class="mono" id="lfKv"></b><input type="range" id="lfK" dir="ltr" min="0.5" max="8" step="0.5" value="1.5"></label>
      <div class="ll-row"><button class="sim-btn sim-btn-run" data-a="go">▶ شروع</button><button class="sim-btn sim-btn-ghost" data-a="reset">↺ از اول</button></div>
      <div class="sim-status" id="lfStatus" data-state="${alreadyDone ? 'success' : 'idle'}"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const bot = q('#lfBot'), sp = q('#lfSp'), kk = q('#lfK'), st = q('#lfStatus'), dots = [q('#lfS0'), q('#lfS1'), q('#lfS2')];
  let s = lfNew(), raf = 0, last = null, running = false, succeeded = !!alreadyDone;
  const say = (a, t) => { st.dataset.state = a; st.textContent = t; };
  const draw = () => {
    bot.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${(s.phi * 180 / Math.PI).toFixed(1)})`);
    dots.forEach((c, i) => c.setAttribute('fill', s.sens[i] ? '#ff5a4f' : '#555'));
  };
  const labels = () => { q('#lfSv').textContent = toFa(sp.value); q('#lfKv').textContent = toFa(kk.value); };
  function frame(ts){
    if(!running) return;
    const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts;
    lfStep(s, dt, +sp.value, +kk.value); draw();
    if(s.done){
      running = false;
      say('success', '✅ رسید! ربات خط را تا پایان دنبال کرد. چشم، مغز و پاهای ربات تعقیب خطِ تو کار می‌کنند.');
      if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
      return;
    }
    if(s.fail){
      running = false;
      say('error', s.fail === 'lost' ? '⚠️ ربات خط را گم کرد. شدت پیچیدن را بیشتر کن یا سرعت را کم کن.' : '⚠️ ربات خیلی کند رفت و وقت تمام شد. سرعت را بیشتر کن.');
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function reset(){ cancelAnimationFrame(raf); running = false; s = lfNew(); last = null; draw(); if(!succeeded) say('idle', '🏁 «شروع» را بزن.'); }
  container.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button[data-a]') : null;
    if(!b) return;
    if(b.dataset.a === 'reset') reset();
    else { reset(); running = true; if(!succeeded) say('running', '▶ ربات در حال رفتن است…'); raf = requestAnimationFrame(frame); }
  });
  [sp, kk].forEach(el => el.addEventListener('input', labels));
  labels(); draw();
  if(alreadyDone) say('success', '✅ قبلاً این مأموریت را انجام داده‌ای. دوست داری دوباره تمرین کنی؟'); else say('idle', '🏁 «شروع» را بزن.');
  return { stop(){ running = false; cancelAnimationFrame(raf); } };
}


