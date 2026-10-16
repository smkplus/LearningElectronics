/* ========================================================================
   QUEST-STM32.JS — بخش STM32
   داده‌ی مأموریت‌ها (QUESTS_STM32) + شبیه‌سازها
   QUESTS_STM32 + mountStlinkSim (Cube/HAL از cube-block.js و hal-block.js)
   ======================================================================== */

const QUESTS_STM32 = [
  { id:'stm32_cube', icon:'🧩', section:{ icon:'🔵', title:'بخش STM32', sub:'STM32F103C8T6 یک میکروکنترلرِ ۳۲بیتی ساخت STMicroelectronics است که روی برد ارزانِ Blue Pill نشسته؛ ساعتش ۷۲ مگاهرتز است (چهار پنج برابرِ آردوینو Uno)، ۲۰ کیلوبایت RAM دارد و با ۳٫۳ ولت کار می‌کند. چون سریع و ارزان است، در ربات‌ها، کنترلِ موتور و پروژه‌های جدی‌تر زیاد استفاده می‌شود. آن را با CubeMX تنظیم و با HAL برنامه‌ریزی می‌کنیم.' },
    title:'STM32 — تنظیم پایه‌ها و ساعت در CubeMX', sub:'گام اول STM32 — پایه‌ی PC13 و ساعت ۷۲ مگاهرتز',
    xp:100,
    quote:'«برد STM32 برخلاف آردوینو از همان لحظه‌ی اول همه‌چیز را به خودت می‌سپارد: هر پایه چه کاری بکند و ساعت چیپ چند مگاهرتز باشد. ابزار CubeMX این تنظیم‌ها را روی یک صفحه‌ی گرافیکی نشان می‌دهد و کدِ راه‌اندازی را خودش می‌نویسد.»',
    desc:'Blue Pill چیپ STM32F103C8T6 دارد: هسته‌ی ۳۲ بیتی Cortex-M3 تا ۷۲ مگاهرتز. در CubeMX دو کار اصلی داری: ۱) برای هر پایه یک کار انتخاب کنی (مثلاً GPIO_Output برای LED روی PC13). ۲) ساعت را بسازی: کریستال ۸ مگاهرتز ضربدر ضریب PLL برابر ۹ می‌شود ۷۲ مگاهرتز.\n\nپایه‌های SWD (PA13 و PA14) برای برنامه‌ریز ST-Link و پایه‌های کریستال (PD0 و PD1) را CubeMX خودش تنظیم می‌کند؛ لازم نیست دست بزنی.',
    steps:[
      'اول تبِ «ساعت» باز است: دکمه‌ی «استاندارد ۷۲ مگاهرتز» را بزن (یا ضریب PLL را روی ۹ بگذار) تا SYSCLK برابر ۷۲ مگاهرتز شود.',
      'APB1 باید تقسیم بر ۲ باشد؛ سقف این باس ۳۶ مگاهرتز است و بیشتر از آن قرمز می‌شود (دکمه‌ی استاندارد خودش همین را می‌گذارد).',
      'بعد به تبِ «Cube» برو؛ کادرِ طلایی بالای صفحه قدم‌به‌قدم می‌گوید کدام پایه را بزنی.',
      'روی پایه‌ی PC13 (طلایی) کلیک کن و از دکمه‌های پایین GPIO_Output را بزن؛ این همان LED روی برد است.',
      'وقتی ساعت بدون خطا و PC13 درست تنظیم شد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'stm32_blink', icon:'💡', title:'STM32 — چشمک‌زن Blue Pill', sub:'HAL_GPIO_TogglePin و HAL_Delay',
    xp:110,
    quote:'«روی Blue Pill چراغ PC13 معکوس وصل شده: وقتی پایه صفر است LED روشن می‌شود و وقتی یک است خاموش. تابع HAL_GPIO_TogglePin حالت پایه را برعکس می‌کند و HAL_Delay به میلی‌ثانیه صبر می‌کند؛ این دو تا معادل digitalWrite و delay آردوینو هستند.»',
    desc:'کد خودت را بین USER CODE BEGIN و USER CODE END داخل while(1) فایل main.c می‌نویسی؛ بیرون از این بخش‌ها، CubeMX موقع تولید دوباره‌ی کد همه‌چیز را پاک می‌کند.\n\nدر شبیه‌ساز زیر همین کار را می‌کنی: کدی بنویس که LED روی PC13 چشمک بزند.',
    steps:[
      'در while(1) با HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13); حالت LED را برعکس کن.',
      'بعدش HAL_Delay(500); بنویس تا نیم ثانیه صبر کند.',
      'دکمه‌ی اجرا را بزن؛ LED باید روشن و خاموش شود.',
      'اگر خواستی همین کار را با HAL_GPIO_WritePin هم بکن: GPIO_PIN_RESET روشن می‌کند و GPIO_PIN_SET خاموش.'
    ]},
  { id:'stm32_stlink', icon:'🔌', title:'STM32 — اتصال برد به ST-Link', sub:'سیم‌کشی SWD، Connect و آپلود برنامه',
    xp:110,
    quote:'«آردوینو Uno از کارخانه یک بوت‌لودر و یک مبدل USB به سریال دارد، برای همین با یک کابل برنامه می‌گیرد. Blue Pill هیچ‌کدام را ندارد؛ چیپ‌اش خام است. برای ریختن برنامه یک برنامه‌ریز جدا لازم است و ارزان‌ترین و بهترینش ST-Link است: با دو سیم سیگنال (SWDIO و SWCLK) مستقیم به بخش دیباگِ چیپ وصل می‌شود.»',
    desc:'تا حالا برنامه را فقط در شبیه‌ساز اجرا کرده‌ای. برای اینکه کدت روی برد واقعی بنشیند باید آن را از کامپیوتر به چیپ برسانی، و این کارِ ST-Link است.\n\nچرا برنامه‌ریز جدا؟ چون Blue Pill بوت‌لودرِ USB ندارد و چیپ F103 هم در ROM اش فقط یک بوت‌لودرِ سریال (USART1) دارد. پورت micro-USB روی برد به‌تنهایی برنامه نمی‌گیرد. ST-Link از راه SWD حافظه‌ی فلش را می‌نویسد و علاوه بر آن دیباگ هم می‌دهد: برنامه را می‌شود وسط اجرا متوقف کرد و مقدار متغیرها را دید. دکمه‌ی Run در CubeIDE هم از همین راه کار می‌کند.\n\nدر شبیه‌ساز زیر مثل واقعیت چهار سیم را وصل می‌کنی: 3.3V، GND، SWDIO و SWCLK. ۵ ولت را به ۳٫۳ ولتِ برد نزن و اگر یکی از سیم‌ها را جا بیندازی یا SWDIO و SWCLK را جابه‌جا کنی، ST-Link همان خطاهای واقعی را می‌دهد.',
    steps:[
      'اول بخش «چرا برنامه‌ریز جدا؟» را بخوان؛ بعد با USB قطع، سیم‌کشی را شروع کن.',
      'یک پایه از ST-Link (مثلاً SWDIO) و بعد پایه‌ی هم‌نامش را روی برد بزن؛ همین‌طور 3.3V، GND و SWCLK. نوشته‌ی کنار هر پایه را بخوان؛ ترتیب پایه‌ها روی ST-Link و روی برد یکی نیست.',
      'ST-Link را به USB کامپیوتر بزن؛ LED اش و LED قرمز PWR روی برد باید روشن شوند.',
      'Connect را بزن؛ ST-Link شناسه‌ی چیپ را می‌خواند (Device ID 0x410).',
      'آپلود (Run) را بزن تا برنامه‌ی چشمک‌زن روی فلش نوشته شود. اگر LED چشمک نزد، جامپر BOOT0 را ببین: باید روی ۰ باشد و بعد RESET بزن.',
      'وقتی LED روی PC13 چشمک زد، مأموریت خودکار تکمیل می‌شود.'
    ]}
];


/* ----- شبیه‌سازهای بخش STM32 ----- */
/* ================= STM32 — اتصال به ST-Link (SWD) =================
   برد Blue Pill برنامه‌ریز داخلی ندارد. این‌جا واقعاً چهار سیم را وصل می‌کنی
   (3.3V، GND، SWDIO، SWCLK)، ST-Link را به USB می‌زنی، به چیپ Connect می‌شوی و برنامه را می‌ریزی.
   اشتباه‌های واقعی هم شبیه‌سازی شده: ۵ ولت روی ۳٫۳ ولت، جابه‌جایی SWDIO/SWCLK، نبودنِ GND و جامپر BOOT0 روی ۱. */
const SL_ST_SIGS = ['RST', 'SWCLK', 'SWIM', 'SWDIO', 'GND', 'GND', '3V3', '3V3', '5V', '5V'];
const SL_LBL = { RST:'RST', SWIM:'SWIM', SWCLK:'SWCLK', SWDIO:'SWDIO', GND:'GND', '3V3':'3.3V', '5V':'5.0V' };
const SL_NOTE = {
  RST:   'ریست؛ اختیاری است و برای این مأموریت لازم نیست.',
  SWIM:  'SWIM مخصوص چیپ‌های STM8 است؛ Blue Pill (STM32) آن را لازم ندارد.',
  SWCLK: 'سیم ساعت؛ ضرب‌آهنگِ انتقالِ داده است (در چیپ به PA14 می‌رسد).',
  SWDIO: 'سیم داده؛ برنامه و فرمان‌ها از این سیم می‌گذرند (در چیپ به PA13 می‌رسد).',
  GND:   'زمین؛ باید بین دو برد مشترک باشد تا ولتاژها یک مرجع داشته باشند. (پایه‌های ۵ و ۶ هر دو GND و یکی هستند.)',
  '3V3': 'تغذیه‌ی ۳٫۳ ولت؛ Blue Pill با همین برق می‌گیرد. (پایه‌های ۷ و ۸ هر دو 3.3V و یکی هستند.)',
  '5V':  '⚠️ ۵ ولت؛ برای Blue Pill این‌جا لازم نیست و روی پایه‌ی ۳٫۳ ولتِ برد به چیپ آسیب می‌زند. (پایه‌های ۹ و ۱۰)'
};
const SL_ST = SL_ST_SIGS.map((sig, k) => ({ id:'p' + (k + 1), n:k + 1, sig, lbl:SL_LBL[sig], note:SL_NOTE[sig], col:k % 2, row:k >> 1, key:[2, 4, 6, 8].includes(k + 1) }));
const SL_BP = [
  { id:'GND',   lbl:'GND',   note:'زمینِ برد.' },
  { id:'SWCLK', lbl:'SWCLK', note:'ورودیِ ساعتِ SWD (پایه‌ی PA14 چیپ).' },
  { id:'SWDIO', lbl:'SWDIO', note:'دیتای SWD (پایه‌ی PA13 چیپ).' },
  { id:'3V3',   lbl:'3.3V',  note:'ورودیِ ۳٫۳ ولت؛ حداکثر تحملِ چیپ حدود ۴ ولت است.' }
];
const SL_TALK_ST = {
  RST:   'این پایه‌ی ریست (RST) است؛ ریستِ چیپ را از طرف ST-Link کنترل می‌کند. برای این مأموریت لازمش نداری، پس جایی وصلش نکن.',
  SWIM:  'این SWIM است، پایه‌ی برنامه‌ریزیِ چیپ‌های STM8. Blue Pill یک STM32 است و این پایه را ندارد؛ وصلش نکن.',
  SWCLK: 'این SWCLK است، سیمِ ساعتِ SWD؛ ضرب‌آهنگِ انتقالِ داده روی همین سیم می‌آید. 👉 آن را به پایه‌ی SWCLK روی هدر چهارپایه‌ی بالای Blue Pill وصل کن (از چپ: GND، SWCLK، SWDIO، 3.3V؛ یعنی دومی).',
  SWDIO: 'این SWDIO است، سیمِ داده‌ی SWD؛ برنامه و فرمان‌ها از همین سیم رد می‌شوند. 👉 آن را به پایه‌ی SWDIO روی هدر چهارپایه‌ی بالای Blue Pill وصل کن (از چپ سومی).',
  GND:   'این GND است، یعنی زمین؛ دو برد باید زمینِ مشترک داشته باشند. پایه‌های ۵ و ۶ هر دو GND و یکی هستند. 👉 آن را به GND روی هدر چهارپایه‌ی بالای Blue Pill وصل کن (اولین پایه‌ی سمت چپ).',
  '3V3': 'این 3.3V است، تغذیه‌ی ۳٫۳ ولت؛ Blue Pill از همین برق می‌گیرد. پایه‌های ۷ و ۸ هر دو 3.3V و یکی هستند. 👉 آن را به 3.3V روی هدر چهارپایه‌ی بالای Blue Pill وصل کن (آخرین پایه‌ی سمت راست).',
  '5V':  '⚠️ این ۵ ولت است. Blue Pill این‌جا ۵ ولت نمی‌خواهد و روی پایه‌ی ۳٫۳ ولتِ برد چیپ را می‌سوزاند. هیچ‌جا وصلش نکن.'
};
const SL_TALK_BP = {
  GND:   'این پایه‌ی GND برد است. 👉 با یک سیم به GND ST-Link وصلش کن (پایه‌ی ۵ یا ۶ داخل سوکت مشکیِ ST-Link).',
  SWCLK: 'این SWCLK برد است، ورودیِ ساعتِ SWD (پایه‌ی PA14 چیپ). 👉 با یک سیم به SWCLK ST-Link وصلش کن (پایه‌ی ۲).',
  SWDIO: 'این SWDIO برد است، پایه‌ی داده‌ی SWD (پایه‌ی PA13 چیپ). 👉 با یک سیم به SWDIO ST-Link وصلش کن (پایه‌ی ۴).',
  '3V3': 'این پایه‌ی 3.3V برد است و برد از همین‌جا برق می‌گیرد. 👉 با یک سیم به 3.3V ST-Link وصلش کن (پایه‌ی ۷ یا ۸)، نه به ۵ ولت!'
};
const SL_ROW_Y = r => 38 + r * 14, SL_PR_X = [166, 184], SL_COL_X = [233, 251], SL_EXIT_X = 262;
const SL_BP_DX = -82, SL_BP_DY = 112, SL_BP_X = j => 212 + j * 24, SL_BP_Y = 72;
const SL_COL = { '3V3':'#e0483e', 'GND':'#15171c', 'SWDIO':'#2fb36a', 'SWCLK':'#e8c035' };

function mountStlinkSim(container, { onSuccess, alreadyDone } = {}){
  const padsSt = SL_ST.map(p => {
    const px = SL_PR_X[p.col], cx = SL_COL_X[p.col], cy = SL_ROW_Y(p.row);
    const label = p.col ? `<text class="sl-silk" x="194" y="${cy + 2.6}">${p.lbl}</text>` : `<text class="sl-silk" x="156" y="${cy + 2.6}" text-anchor="end">${p.lbl}</text>`;
    const hx = p.col ? 175 : 132, hw = p.col ? 47 : 43;
    return `<g class="sl-pin ${p.key ? 'sl-key' : 'sl-dim'}" data-side="st" data-id="${p.id}"><title>${p.n} — ${p.lbl}</title>${label}<circle class="sl-pcirc" cx="${px}" cy="${cy}" r="4.4"/><text class="sl-pnum" x="${px}" y="${cy + 1.9}" style="font-size:${p.n > 9 ? 4.6 : 5.4}px">${p.n}</text><circle class="sl-pin-ring" cx="${px}" cy="${cy}" r="7"/><rect class="sl-pin-hit" x="${hx}" y="${cy - 7}" width="${hw}" height="14"/>${p.key ? `<circle class="sl-key-ring" cx="${cx}" cy="${cy}" r="6.6"/>` : ''}<rect class="sl-pinbody" x="${cx - 3.5}" y="${cy - 3.5}" width="7" height="7" fill="#d9b94a" stroke="#8a7550" stroke-width=".6"/><rect class="sl-pinbody" x="${cx - 1.4}" y="${cy - 1.4}" width="2.8" height="2.8" fill="#15161a"/><circle class="sl-pin-ring" cx="${cx}" cy="${cy}" r="7"/><rect class="sl-pin-hit" x="${cx - 9}" y="${cy - 7}" width="18" height="14"/></g>`;
  }).join('');
  const padsBp = SL_BP.map((p, j) => { const x = SL_BP_X(j);
    return `<g class="sl-pin" data-side="bp" data-id="${p.id}"><rect x="${x - 4.5}" y="${SL_BP_Y - 4.5}" width="9" height="9" rx="1.5" fill="#d9b94a"/><circle cx="${x}" cy="${SL_BP_Y}" r="1.8" fill="#0b0e14"/><text class="sl-silk sl-pad-t" x="${x}" y="${SL_BP_Y + 20}" text-anchor="middle">${p.lbl}</text><circle class="sl-pin-ring" cx="${x}" cy="${SL_BP_Y}" r="8.5"/><circle class="sl-pin-hit" cx="${x}" cy="${SL_BP_Y}" r="12"/></g>`; }).join('');
  const holes = Array.from({ length: 20 }, (_, k) => { const y = 108 + k * 12.4; return `<circle cx="188" cy="${y}" r="3" class="sl-hole"/><circle cx="296" cy="${y}" r="3" class="sl-hole"/>`; }).join('');
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = 225.5 + i * 2.9; return `<rect x="${a}" y="192" width="1.2" height="4" fill="#c0c6d0"/><rect x="${a}" y="232" width="1.2" height="4" fill="#c0c6d0"/><rect x="220" y="${a - 28.5}" width="4" height="1.2" fill="#c0c6d0"/><rect x="260" y="${a - 28.5}" width="4" height="1.2" fill="#c0c6d0"/>`; }).join('');
  const bootStrip = (id, y, label, interactive) => `<g ${interactive ? 'data-boot="1" class="sl-boot"' : ''} id="${id}"><text class="sl-silk" x="221" y="${y + 3}" text-anchor="end">${label}</text>` +
    [232, 246, 260].map(x => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#d9b94a"/>`).join('') +
    `<text class="sl-silk sl-tiny" x="232" y="${y - 6}" text-anchor="middle">0</text><text class="sl-silk sl-tiny" x="260" y="${y - 6}" text-anchor="middle">1</text>` +
    `<rect class="sl-cap" x="227" y="${y - 5}" width="26" height="10" rx="2"/>` + (interactive ? `<rect class="sl-boot-hit" x="206" y="${y - 12}" width="64" height="24"/>` : '') + `</g>`;

  container.innerHTML = `
    <div class="sim-wrap sl-wrap">
      <div class="sim-hw-note">هدف: برد Blue Pill را با چهار سیم به ST-Link وصل کن، ST-Link را به کامپیوتر بزن، به چیپ Connect شو و برنامه‌ی چشمک‌زن را بریز. سیم را از یک پایه بکش و روی پایه‌ی هم‌نامش در سمتِ دیگر رها کن (یا ابتدا یک پایه و بعد پایه‌ی هم‌نامش را بزن)؛ زدنِ پایه‌ی سیم‌دار، سیم را برمی‌دارد. چهار پایه‌ی درخشانِ سوکت (۲، ۴، ۶ و ۸) همان‌هایی هستند که لازم داری؛ بقیه کم‌رنگ‌اند و لازم نیستند (پایه‌های ۵ و ۷ هم‌ارزِ ۶ و ۸ هستند).</div>
      <details class="hs-det" open>
        <summary>چرا Blue Pill به یک برنامه‌ریزِ جدا نیاز دارد؟</summary>
        <div class="hs-p">آردوینو Uno برای دریافتِ برنامه دو چیز دارد که از کارخانه روی بردش گذاشته‌اند: یک «بوت‌لودر» داخل چیپ (برنامه‌ی کوچکی که منتظرِ کدِ تازه می‌ماند) و یک چیپِ مبدلِ USB به سریال. برای همین فقط کابل USB کافی است. Blue Pill هیچ‌کدام را ندارد.</div>
        <table class="hs-table">
          <tr><th></th><th>آردوینو Uno</th><th>Blue Pill</th></tr>
          <tr><td>بوت‌لودر</td><td>از کارخانه داخل چیپ است</td><td>ندارد؛ فقط بوت‌لودرِ ROM خودِ ST را دارد که فقط از پایه‌های PA9 و PA10 (USART1) حرف می‌شنود</td></tr>
          <tr><td>USB به سریال</td><td>دارد (ATmega16U2 یا CH340)</td><td>ندارد؛ پورت micro-USB تنها برنامه نمی‌گیرد (چیپ F103 در ROM اش بوت‌لودرِ USB ندارد)</td></tr>
          <tr><td>دیباگ (توقف و گام‌به‌گام)</td><td>ندارد</td><td>با ST-Link و SWD دارد</td></tr>
        </table>
        <div class="hs-p">پس مرغ و تخم‌مرغ می‌شود: برای ریختنِ حتی یک بوت‌لودرِ USB روی Blue Pill هم اول باید یک برنامه‌ریز داشته باشی. ST-Link از روی SWD یعنی فقط دو سیمِ سیگنال (SWDIO و SWCLK)، مستقیم به بخشِ دیباگِ چیپ وصل می‌شود؛ با آن می‌توانی حافظه‌ی فلش را بنویسی، برنامه را روی خط‌به‌خط متوقف کنی و مقدار متغیرها را ببینی. دکمه‌ی Run در CubeIDE هم همین کار را می‌کند. حتی اگر برنامه‌ی خراب چیپ را قفل کرده باشد، ST-Link می‌تواند دوباره پاکش کند.</div>
        <div class="hs-p">راهِ ارزان‌تر هم هست: آداپتور USB به سریال روی PA9 و PA10 و جامپر BOOT0 روی ۱. اما فقط برنامه می‌ریزد (دیباگ ندارد) و هر بار باید جامپر را جابه‌جا کنی. ST-Link راحت‌تر است.</div>
      </details>
      <details class="hs-det">
        <summary>نکته‌هایِ سیم‌کشی و CubeMX</summary>
        <ol class="hs-ol">
          <li>همیشه اول سیم‌کشی کن و بعد USB را بزن. هیچ‌وقت ۵ ولت به پایه‌ی ۳٫۳ ولتِ برد نده؛ تحملِ ولتاژِ چیپ حدود ۴ ولت است.</li>
          <li>GND باید حتماً وصل باشد، وگرنه ST-Link چیزی نمی‌شنود.</li>
          <li>سیم‌ها به پایه‌های داخل سوکتِ مشکیِ ST-Link وصل می‌شوند؛ هر پایه‌ی سوکت هم‌ردیفِ شماره و نامِ چاپ‌شده‌ی روی بدنه است (پایه‌های فرد ۱ تا ۹ ستون چپ و زوج ۲ تا ۱۰ ستون راست). دو پایه‌ی GND یکی هستند و دو پایه‌ی 3.3V هم یکی هستند؛ هرکدام را بزنی فرقی ندارد. SWIM و RST برای این کار لازم نیستند. ترتیبِ پایه‌ها روی ST-Linkهای دیگر فرق می‌کند؛ همیشه نامِ چاپ‌شده را بخوان، نه جای پایه را.</li>
          <li>در CubeMX بخش System Core ‹ SYS ‹ Debug باید روی Serial Wire باشد (همان PA13 و PA14 که خودکار سبز بود). اگر No Debug بگذاری، بعد از اولین آپلود ST-Link دیگر به چیپ وصل نمی‌شود.</li>
          <li>هر دو جامپرِ BOOT0 و BOOT1 روی ۰ باشند تا چیپ برنامه‌ی تو را از فلش اجرا کند.</li>
        </ol>
      </details>
      <div class="st-steps" id="slSteps">
        <span class="st-chip" data-s="1">۱ سیم‌کشی</span>
        <button type="button" class="st-chip st-btn" data-s="2" id="slPlug">۲ USB را بزن</button>
        <button type="button" class="st-chip st-btn" data-s="3" id="slConn" disabled>۳ Connect</button>
        <button type="button" class="st-chip st-btn" data-s="4" id="slFlash" disabled>۴ آپلود و اجرا</button>
        <button type="button" class="sim-btn sim-btn-ghost st-reset" id="slReset">↺ از اول</button>
      </div>
      <div class="st-prog" id="slProgWrap" hidden><i id="slProg"></i></div>
      <div class="sim-console" id="slLog" aria-live="polite"></div>
      <svg class="sl-svg" viewBox="0 0 320 492" role="img" aria-label="ST-Link V2 به شکل فلش USB آبی با سوکت مشکیِ ده‌پایه، و برد Blue Pill با هدر چهارپایه‌ی SWD">
        <defs>
          <linearGradient id="slMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#eef0f4"/><stop offset="50%" stop-color="#b7bdc8"/><stop offset="100%" stop-color="#8f97a4"/></linearGradient>
          <linearGradient id="slBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3d82ea"/><stop offset="55%" stop-color="#2160cc"/><stop offset="100%" stop-color="#18489f"/></linearGradient>
        </defs>
        <!-- کامپیوتر -->
        <rect id="slPc" class="sl-pc" x="2" y="10" width="22" height="112" rx="5"/>
        <text id="slPcT" class="sl-pc-t" transform="translate(13 66) rotate(-90)" x="0" y="3.5">کامپیوتر</text>
        <!-- ST-Link V2: دوشاخه‌ی USB-A، بدنه‌ی آبی، سوکت مشکی ده‌پایه -->
        <rect x="22" y="31" width="44" height="70" rx="2" fill="url(#slMetal)" stroke="#6b7280"/>
        <rect x="26" y="35" width="36" height="62" rx="1.5" fill="none" stroke="#7b8391"/>
        <rect x="38" y="41" width="9" height="8" fill="#d9b94a"/><rect x="40" y="43" width="5" height="4" fill="#15161a"/>
        <rect x="38" y="79" width="9" height="8" fill="#d9b94a"/><rect x="40" y="81" width="5" height="4" fill="#15161a"/>
        <rect id="slBridge" class="sl-bridge" x="19" y="40" width="6" height="52" rx="1.5"/>
        <rect x="62" y="16" width="162" height="100" rx="3" fill="url(#slBlue)" stroke="#12356f"/>
        <rect x="62" y="16" width="5" height="100" rx="2" fill="#0b2a63" fill-opacity=".45"/>
        <path d="M68 18.5 H221" stroke="#9cc2ff" stroke-opacity=".5"/>
        <text class="sl-logo" x="72" y="56">ST</text>
        <text class="sl-silk sl-model" x="70" y="80">ST-LINK V2</text>
        <text class="sl-silk sl-tiny" x="70" y="92">STM8 &amp; STM32</text>
        <rect x="159.5" y="30" width="31" height="72" rx="2" fill="none" stroke="#cfe0ff" stroke-opacity=".3"/>
        <circle id="slStLed" class="sl-stled" cx="216" cy="66" r="2.6"/>
        <rect x="222" y="6" width="40" height="120" rx="3" fill="#15161a" stroke="#2a2c33"/>
        <rect x="226" y="10" width="32" height="112" rx="2" fill="#1c1d22"/>
        <path d="M231 13 L243 18.5 L231 24 Z" fill="#2c2e35"/>
        <rect x="228" y="30" width="30" height="72" rx="2" fill="#0a0b0d" stroke="#2a2c33"/>
        <rect x="256" y="60" width="6" height="12" fill="#07070a" stroke="#34363d"/>
        ${padsSt}
        <!-- Blue Pill -->
        <g transform="translate(${SL_BP_DX} ${SL_BP_DY})">
          <rect x="180" y="56" width="124" height="316" rx="8" fill="#1b4fb0" stroke="#4a7fd8"/>${holes}
          <rect x="203" y="64" width="90" height="14" rx="2" fill="#0a0c10"/>${padsBp}
          <rect x="198" y="252" width="14" height="14" rx="2" fill="#dfe4ec" stroke="#8a93a6" class="sl-rst"/><text class="sl-silk" x="216" y="262">RESET</text><rect x="192" y="246" width="44" height="26" fill="transparent" data-rst="1" style="cursor:pointer"/>
          <circle id="slPc13" class="sl-led sl-pc13" cx="282" cy="124" r="4.5"/><text class="sl-silk sl-tiny" x="282" y="136" text-anchor="middle">PC13</text>
          <circle id="slPwr" class="sl-led sl-pwr" cx="282" cy="154" r="4.5"/><text class="sl-silk sl-tiny" x="282" y="166" text-anchor="middle">PWR</text>
          <rect x="224" y="196" width="36" height="36" rx="2" fill="#101216"/>${ticks}<circle cx="229" cy="201" r="1.3" fill="#8a93a6"/>
          <text class="sl-silk" x="242" y="215" text-anchor="middle" style="font-size:6.5px">STM32</text><text class="sl-silk sl-tiny" x="242" y="224" text-anchor="middle">F103C8T6</text>
          <ellipse cx="268" cy="262" rx="9" ry="4.5" fill="#cfd4dc" stroke="#7c8594"/>
          ${bootStrip('slBoot0', 300, 'BOOT0', true)}${bootStrip('slBoot1', 324, 'BOOT1', false)}
          <rect x="218" y="358" width="48" height="18" rx="2" fill="#c8d0dc" stroke="#8a93a6"/><rect x="226" y="362" width="32" height="8" fill="#2a2f3a"/>
          <text class="sl-silk" x="242" y="348" text-anchor="middle">BLUE PILL</text>
        </g>
        <g id="slWires" style="pointer-events:none"></g>
        <path id="slDragO" class="sl-wire-o" d=""/><path id="slDrag" class="sl-wire" d=""/><circle id="slDragDot" r="3.6" cx="-9" cy="-9" stroke="#05070a"/>
      </svg>
      <div class="sim-status" id="slStatus" data-state="idle"></div>
    </div>`;

  const q = s => container.querySelector(s);
  const svg = q('.sl-svg'), stEl = q('#slStatus'), logEl = q('#slLog'), wiresG = q('#slWires');
  const btnPlug = q('#slPlug'), btnConn = q('#slConn'), btnFlash = q('#slFlash');
  let wires = [], sel = null, plugged = false, connected = false, flashed = false, flashing = false;
  let boot0 = 0, latched = 0, blinkTimer = 0, flashTimer = 0, okTimer = 0, succeeded = !!alreadyDone;

  const say = (state, text) => { stEl.dataset.state = state; stEl.textContent = text; };
  const log = (cls, text) => { const d = document.createElement('div'); d.className = cls; d.textContent = text; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; };
  const stIdx = id => SL_ST.findIndex(p => p.id === id), bpIdx = id => SL_BP.findIndex(p => p.id === id);
  const sigOf = w => SL_ST[stIdx(w.s)].sig;
  const pinOf = (side, id) => (side === 'st' ? SL_ST : SL_BP).find(x => x.id === id);
  const pinSig = (side, id) => side === 'st' ? pinOf('st', id).sig : id;
  const pinName = (side, id) => { const p = pinOf(side, id); return side === 'st' ? `${p.lbl} (پایه‌ی ${toFa(p.n)})` : p.lbl; };
  const has = (sig, b) => wires.some(w => sigOf(w) === sig && w.b === b);

  function wireInfo(w){
    const sg = sigOf(w), L = SL_LBL[sg], bl = SL_BP[bpIdx(w.b)].lbl;
    if(sg === '5V' && w.b === '3V3') return { lvl:'danger', text:'۵ ولت روی پایه‌ی ۳٫۳ ولتِ برد! تحملِ ولتاژِ چیپ حدود ۴ ولت است و در واقعیت چیپ همین‌جا می‌سوزد.' };
    if(sg === '5V' && w.b === 'GND') return { lvl:'danger', text:'۵ ولت به GND یعنی اتصال کوتاه؛ ST-Link یا USB کامپیوتر آسیب می‌بیند.' };
    if(sg === '5V') return { lvl:'danger', text:'۵ ولت را به پایه‌ی سیگنال نده؛ پایه‌های Blue Pill برای ۳٫۳ ولت ساخته شده‌اند.' };
    if((sg === '3V3' && w.b === 'GND') || (sg === 'GND' && w.b === '3V3')) return { lvl:'danger', text:'۳٫۳ ولت به GND یعنی اتصال کوتاه؛ همه‌ی جریان از همین سیم می‌گذرد.' };
    if(sg === w.b) return { lvl:'ok', text:`✅ «${L}» درست وصل شد. ${SL_NOTE[sg]}` };
    if(sg === 'RST') return { lvl:'bad', text:'هدر چهارپایه‌ی SWD روی Blue Pill پایه‌ی ریست ندارد؛ این سیم جایی نمی‌رود و لازم هم نیست.' };
    if(sg === 'SWIM') return { lvl:'bad', text:'SWIM مخصوص STM8 است؛ هدر SWD چیپ STM32 پایه‌ی SWIM ندارد و لازمش نداری.' };
    if((sg === 'SWDIO' && w.b === 'SWCLK') || (sg === 'SWCLK' && w.b === 'SWDIO')) return { lvl:'bad', text:'SWDIO را به SWCLK (یا برعکس) زده‌ای. سیم وصل است ولی داده و ساعت جابه‌جا شده‌اند و ST-Link چیزی نمی‌شنود.' };
    return { lvl:'bad', text:`«${L}» با «${bl}» همنام نیست؛ هر سیگنال فقط به هم‌نامِ خودش وصل می‌شود.` };
  }
  function diag(){
    const danger = wires.map(wireInfo).find(i => i.lvl === 'danger') || null;
    const powerOk = has('3V3', '3V3') && has('GND', 'GND');
    const swdOk = has('SWDIO', 'SWDIO') && has('SWCLK', 'SWCLK');
    return { danger, powerOk, swdOk, linkOk: powerOk && swdOk, bad: wires.filter(w => wireInfo(w).lvl === 'bad') };
  }
  const isPowered = () => plugged && diag().powerOk && !diag().danger;

  const stPos = i => ({ x: SL_COL_X[SL_ST[i].col], y: SL_ROW_Y(SL_ST[i].row) });
  function drawWires(){
    const order = wires.map(w => ({ w, y: stPos(stIdx(w.s)).y })).sort((a, b) => a.y - b.y);
    wiresG.innerHTML = order.map(({ w }, rank) => {
      const a = stPos(stIdx(w.s)), ys = a.y + 7, xl = 300 - rank * 9;
      const bx = SL_BP_X(bpIdx(w.b)) + SL_BP_DX, by = SL_BP_Y + SL_BP_DY;
      const d = `M${a.x} ${a.y} L${a.x + 5} ${ys} H${xl - 6} Q${xl} ${ys} ${xl} ${ys + 6} V136 C${xl} 160 ${bx} 160 ${bx} ${by}`;
      const lvl = wireInfo(w).lvl, col = lvl === 'ok' ? SL_COL[sigOf(w)] : '#ff8a40';
      return `<path class="sl-wire-o" d="${d}"/><path class="sl-wire${lvl === 'ok' ? '' : ' bad'}" d="${d}" stroke="${col}"/><circle cx="${a.x}" cy="${a.y}" r="3" fill="${col}" stroke="#05070a"/><circle cx="${bx}" cy="${by}" r="3.6" fill="${col}" stroke="#05070a"/>`;
    }).join('');
    container.querySelectorAll('.sl-pin').forEach(g => {
      const side = g.dataset.side, id = g.dataset.id;
      g.classList.toggle('sel', !!sel && sel.side === side && sel.id === id);
      g.classList.toggle('wired', wires.some(w => (side === 'st' ? w.s : w.b) === id));
      g.classList.toggle('hint', !!sel && sel.side !== side && pinSig(sel.side, sel.id) === pinSig(side, id));
      if(side === 'st'){ const sg = pinOf('st', id).sig; g.classList.toggle('sl-done', has(sg, sg)); }
    });
  }
  function stopBlink(){ clearInterval(blinkTimer); blinkTimer = 0; q('#slPc13').classList.remove('on'); }
  function refreshRun(){
    const run = isPowered() && flashed && latched === 0;
    if(run && !blinkTimer){
      let on = true; q('#slPc13').classList.add('on');
      blinkTimer = setInterval(() => { on = !on; q('#slPc13').classList.toggle('on', on); }, 500);
      if(!succeeded){
        clearTimeout(okTimer);
        okTimer = setTimeout(() => {
          if(!succeeded && blinkTimer){
            succeeded = true;
            say('success', '✅ LED روی PC13 چشمک می‌زند! برنامه‌ات با ST-Link روی چیپ نشست و چیپ آن را اجرا می‌کند. از حالا هر بار که کد را عوض کنی، همین‌طور دوباره می‌ریزی‌اش.');
            onSuccess && onSuccess();
          }
        }, 1500);
      }
    } else if(!run){ clearTimeout(okTimer); stopBlink(); }
  }
  function refreshUi(){
    const d = diag(), pw = isPowered();
    q('#slPc').classList.toggle('on', plugged);
    q('#slBridge').classList.toggle('on', plugged);
    q('#slPcT').textContent = plugged ? 'کامپیوتر ✓' : 'کامپیوتر';
    q('#slStLed').classList.toggle('on', plugged);
    q('#slPwr').classList.toggle('on', pw);
    btnPlug.textContent = plugged ? '۲ USB را بکش' : '۲ USB را بزن';
    btnPlug.disabled = flashing;
    btnConn.disabled = !plugged || flashing;
    btnFlash.disabled = !connected || flashing;
    const bootPins = boot0 ? 1 : 0;
    q('#slBoot0 .sl-cap').setAttribute('x', bootPins ? 241 : 227);
    q('#slBoot1 .sl-cap').setAttribute('x', 227);
    const chips = { 1: d.linkOk && !d.danger, 2: pw, 3: connected, 4: flashed && !!blinkTimer };
    const nextStep = [1, 2, 3, 4].find(s => !chips[s]);
    container.querySelectorAll('.st-chip').forEach(c => { c.classList.toggle('ok', !!chips[c.dataset.s]); c.classList.toggle('next', +c.dataset.s === nextStep); });
    drawWires();
  }
  function afterWireChange(){
    connected = false;
    const d = diag();
    if(plugged && d.danger){ plugged = false; stopBlink(); say('error', '⚠️ ' + d.danger.text + ' برای حفظِ بُرد، USB را کشیدم. اول این سیم را بردار.'); }
    refreshRun(); refreshUi();
  }

  function hintText(side, id){
    const sg = pinSig(side, id);
    const found = side === 'st' ? SL_BP.some(x => x.id === sg) : SL_ST.some(x => x.sig === sg);
    if(found) return `مقصدش روی ${side === 'st' ? 'برد' : 'ST-Link'} با حلقه‌ی سبز نشان داده شد؛ همان را بزن.`;
    return side === 'st' ? 'برای این پایه هیچ مقصدی روی هدر برد نیست؛ لازمش نداری.' : '';
  }
  const selectText = (side, id) => `«${pinName(side, id)}» انتخاب شد. ${pinOf(side, id).note} ${hintText(side, id)}`;

  function onPin(side, id){
    if(flashing) return;
    const sg = pinSig(side, id), warn = side === 'st' && sg === '5V';
    showKnightLine(`«${pinName(side, id)}»: ${(side === 'st' ? SL_TALK_ST : SL_TALK_BP)[sg]}`, warn ? 'stern' : 'happy', 'knight');
    const existing = wires.find(w => (side === 'st' ? w.s : w.b) === id);
    if(!sel){
      if(existing){ wires = wires.filter(w => w !== existing); say('idle', 'سیم برداشته شد.'); afterWireChange(); return; }
      sel = { side, id };
      say('running', selectText(side, id));
      refreshUi(); return;
    }
    if(sel.side === side){
      if(sel.id === id){ sel = null; say('idle', 'انتخاب برداشته شد.'); }
      else { sel = { side, id }; say('running', selectText(side, id)); }
      refreshUi(); return;
    }
    const s = side === 'st' ? id : sel.id, b = side === 'bp' ? id : sel.id;
    sel = null;
    wires = wires.filter(w => w.s !== s && w.b !== b);
    const w = { s, b }; wires.push(w);
    const info = wireInfo(w), wasPlugged = plugged;
    afterWireChange();
    if(info.lvl === 'danger'){ if(!wasPlugged) say('error', '⚠️ ' + info.text + ' این سیم را بردار (روی یکی از دو سرش بزن).'); }
    else if(info.lvl === 'bad') say('error', '❌ ' + info.text + ' این سیم را بردار (روی یکی از دو سرش بزن).');
    else if(diag().linkOk) say('success', '✅ هر چهار سیم (3.3V، GND، SWDIO، SWCLK) درست وصل است. ' + (plugged ? 'حالا Connect را بزن.' : 'حالا USB را به کامپیوتر بزن.'));
    else say('running', info.text);
  }

  let justDragged = false;
  svg.addEventListener('click', e => {
    if(justDragged) return;
    if(e.target.closest('[data-boot]') && !flashing){
      boot0 = boot0 ? 0 : 1; refreshUi();
      say(boot0 ? 'error' : 'idle', `جامپر BOOT0 روی ${boot0} رفت. ${boot0 ? 'با BOOT0=1 چیپ بعد از ریست بوت‌لودرِ ROM را اجرا می‌کند، نه برنامه‌ی تو. ' : ''}چیپ تنظیمِ جدید را فقط موقع ریست یا روشن‌شدن می‌خواند؛ دکمه‌ی RESET روی برد را بزن.`);
      return;
    }
    if(e.target.closest('[data-rst]')){
      if(!isPowered()){ say('idle', 'برد برق ندارد؛ ریست معنی ندارد.'); return; }
      latched = boot0; stopBlink(); refreshRun(); refreshUi();
      say(flashed ? (latched ? 'error' : 'running') : 'idle', flashed ? (latched ? 'RESET زده شد؛ BOOT0=1 است و چیپ بوت‌لودرِ ROM را اجرا می‌کند، پس LED چشمک نمی‌زند. جامپر را روی ۰ بگذار و دوباره RESET بزن.' : 'RESET زده شد؛ چیپ برنامه‌ی تو را از فلش اجرا می‌کند.') : 'RESET زده شد؛ هنوز برنامه‌ای روی چیپ نیست.');
      return;
    }
    const pin = e.target.closest('.sl-pin');
    if(pin) onPin(pin.dataset.side, pin.dataset.id);
  });

  const svgPt = e => { const m = svg.getScreenCTM(); if(!m) return { x:0, y:0 }; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return { x:p.x, y:p.y }; };
  const pinXY = (side, id) => side === 'st'
    ? stPos(stIdx(id))
    : { x:SL_BP_X(bpIdx(id)) + SL_BP_DX, y:SL_BP_Y + SL_BP_DY };
  const pinAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY); const g = el && el.closest && el.closest('.sl-pin'); return g && svg.contains(g) ? g : null; };
  const SNAP = 18;
  const snapAt = (e, fromSide) => {
    const b = svgPt(e), side = fromSide === 'st' ? 'bp' : 'st';
    let best = null, bd = SNAP;
    (side === 'st' ? SL_ST : SL_BP).forEach(p => { const c = pinXY(side, p.id), dd = Math.hypot(c.x - b.x, c.y - b.y); if(dd < bd){ bd = dd; best = { side, id:p.id, x:c.x, y:c.y }; } });
    if(!best){ const g = pinAt(e); if(g && g.dataset.side === side){ const c = pinXY(side, g.dataset.id); best = { side, id:g.dataset.id, x:c.x, y:c.y }; } }
    return best;
  };
  const dragEl = q('#slDrag'), dragO = q('#slDragO'), dragDot = q('#slDragDot');
  const dragColor = (side, id) => SL_COL[pinSig(side, id)] || (pinSig(side, id) === '5V' ? '#ff8a40' : '#9aa3b5');
  let drag = null, over = null;
  const setOver = g => { if(over === g) return; if(over) over.classList.remove('over'); over = g; if(over) over.classList.add('over'); };
  function endDrag(){
    dragEl.setAttribute('d', ''); dragO.setAttribute('d', ''); dragDot.setAttribute('cx', -9); dragDot.setAttribute('cy', -9); setOver(null);
    if(drag && drag.on){ justDragged = true; setTimeout(() => { justDragged = false; }, 0); }
    drag = null;
  }
  svg.addEventListener('pointerdown', e => {
    if(flashing || e.button > 0) return;
    const g = e.target.closest('.sl-pin');
    if(!g) return;
    drag = { side:g.dataset.side, id:g.dataset.id, x:e.clientX, y:e.clientY, on:false };
  });
  svg.addEventListener('pointermove', e => {
    if(!drag) return;
    if(!drag.on){
      if(Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.on = true; drag.col = dragColor(drag.side, drag.id);
      dragEl.setAttribute('stroke', drag.col); dragDot.setAttribute('fill', drag.col);
      try { svg.setPointerCapture(e.pointerId); } catch(_) {}
      sel = { side:drag.side, id:drag.id };
      showKnightLine(`«${pinName(drag.side, drag.id)}»: ${(drag.side === 'st' ? SL_TALK_ST : SL_TALK_BP)[pinSig(drag.side, drag.id)]}`, drag.side === 'st' && pinSig('st', drag.id) === '5V' ? 'stern' : 'happy', 'knight');
      say('running', selectText(drag.side, drag.id));
      refreshUi();
    }
    const a = pinXY(drag.side, drag.id), snap = snapAt(e, drag.side), b = snap || svgPt(e), dy = Math.max(40, Math.abs(b.y - a.y) * .5);
    drag.target = snap;
    const d = `M${a.x} ${a.y} C${a.x} ${a.y + dy} ${b.x} ${b.y - dy} ${b.x} ${b.y}`;
    dragEl.setAttribute('d', d); dragO.setAttribute('d', d); dragDot.setAttribute('cx', b.x); dragDot.setAttribute('cy', b.y);
    setOver(snap ? container.querySelector(`.sl-pin[data-side="${snap.side}"][data-id="${snap.id}"]`) : null);
  });
  svg.addEventListener('pointerup', e => {
    if(!drag) return;
    if(drag.on){
      const t = snapAt(e, drag.side) || drag.target, from = drag;
      endDrag();
      if(t) onPin(t.side, t.id);
      else { sel = null; say('idle', 'سیم رها شد؛ باید سرِ دیگرش را روی پایه‌ی هم‌نامِ آن سمت رها کنی.'); refreshUi(); }
    } else endDrag();
  });
  svg.addEventListener('touchmove', e => { if(drag) e.preventDefault(); }, { passive:false });
  svg.addEventListener('pointercancel', () => { if(drag && drag.on){ sel = null; refreshUi(); } endDrag(); });

  btnPlug.addEventListener('click', () => {
    if(flashing) return;
    if(plugged){ plugged = false; connected = false; stopBlink(); refreshUi(); say('idle', 'USB کشیده شد؛ برد برق ندارد.'); return; }
    const d = diag();
    if(d.danger){ say('error', '⚠️ ' + d.danger.text + ' تا این سیم هست USB را نزن.'); return; }
    plugged = true; latched = boot0; refreshRun(); refreshUi();
    if(d.powerOk) say('success', '🔌 ST-Link شناخته شد (LED اش روشن شد) و برد از پایه‌ی ۳٫۳ ولتِ آن برق گرفت؛ LED قرمزِ PWR روشن است. حالا Connect را بزن.');
    else say('running', '🔌 ST-Link شناخته شد، ولی برد برق نمی‌گیرد: ' + (!has('3V3', '3V3') ? 'سیمِ 3.3V وصل نیست. ' : '') + (!has('GND', 'GND') ? 'سیمِ GND وصل نیست. ' : '') + 'با این حال Connect را بزن تا ببینی ST-Link چه می‌گوید.');
  });

  btnConn.addEventListener('click', () => {
    if(!plugged) return;
    logEl.innerHTML = '';
    const d = diag();
    log('sim-serial', 'Opening ST-LINK ...');
    if(!d.powerOk){
      log('sim-serial', 'Voltage     : 0.00V');
      log('sim-error', 'Error: No STM32 target found!');
      connected = false; refreshUi();
      say('error', 'ST-Link ولتاژی روی برد نمی‌بیند (0.00V) و چیپی پیدا نمی‌کند. ' + (!has('3V3', '3V3') ? 'سیمِ 3.3V ' : '') + (!has('GND', 'GND') ? 'سیمِ GND ' : '') + 'درست وصل نیست. بدون زمینِ مشترک و برق، هیچ ارتباطی ممکن نیست.');
      return;
    }
    log('sim-serial', 'Voltage     : 3.27V');
    log('sim-serial', 'SWD freq    : 4000 KHz');
    if(!d.swdOk){
      log('sim-error', 'Error: Unable to get core ID');
      log('sim-error', 'Error: No STM32 target found!');
      connected = false; refreshUi();
      const sw = (has('SWDIO', 'SWCLK') && has('SWCLK', 'SWDIO'));
      say('error', sw ? 'ST-Link برد را برق‌دار می‌بیند ولی با چیپ حرف نمی‌زند: SWDIO و SWCLK جابه‌جا وصل شده‌اند. جایشان را عوض کن.' : 'برد برق دارد ولی ST-Link با چیپ حرف نمی‌زند: ' + (!has('SWDIO', 'SWDIO') ? 'سیمِ SWDIO ' : '') + (!has('SWCLK', 'SWCLK') ? 'سیمِ SWCLK ' : '') + 'درست وصل نیست.');
      return;
    }
    log('sim-serial', 'Connect mode: Normal');
    log('sim-serial', 'Reset mode  : Software reset');
    log('sim-ok', 'Device ID   : 0x410');
    log('sim-ok', 'Device name : STM32F101/F102/F103 Medium-density');
    log('sim-serial', 'Flash size  : 64 KBytes (default)');
    log('sim-serial', 'Device type : MCU');
    log('sim-serial', 'Device CPU  : Cortex-M3');
    connected = true; refreshUi();
    say('success', '🔎 وصل شد! ST-Link از راه SWD شناسه‌ی چیپ را خواند (0x410 یعنی خانواده‌ی F103) و حالا می‌تواند حافظه‌ی فلش را بنویسد. «آپلود» را بزن.');
  });

  btnFlash.addEventListener('click', () => {
    if(!connected || flashing) return;
    flashing = true; flashed = false; stopBlink(); refreshUi();
    const wrap = q('#slProgWrap'), bar = q('#slProg'); wrap.hidden = false; bar.style.width = '0%';
    log('sim-serial', ''); log('sim-serial', 'Opening and parsing file: Blink.elf');
    log('sim-serial', '  Size          : 5.13 KB');
    log('sim-serial', '  Address       : 0x08000000');
    log('sim-serial', 'Erasing internal memory sectors ...');
    log('sim-serial', 'Download in Progress:');
    say('running', '⬇️ ST-Link فلش را پاک می‌کند و برنامه را می‌نویسد...');
    let p = 0;
    flashTimer = setInterval(() => {
      p += 7; bar.style.width = Math.min(p, 100) + '%';
      if(p < 100) return;
      clearInterval(flashTimer);
      log('sim-ok', 'File download complete');
      log('sim-serial', 'Verifying ...');
      log('sim-ok', 'Download verified successfully');
      log('sim-serial', 'Software reset is performed');
      flashing = false; flashed = true; latched = boot0;
      setTimeout(() => { wrap.hidden = true; }, 600);
      refreshRun(); refreshUi();
      if(latched === 1) say('error', 'برنامه با موفقیت روی فلش نوشته شد، ولی LED چشمک نمی‌زند: جامپر BOOT0 روی ۱ است و چیپ بعد از ریست بوت‌لودرِ ROM را اجرا می‌کند. BOOT0 را روی ۰ بگذار و RESET بزن.');
      else say('running', 'برنامه‌ی تازه روی فلش نشست و چیپ ریست شد؛ به LED روی PC13 نگاه کن...');
    }, 90);
  });

  function resetAll(){
    clearInterval(flashTimer); clearTimeout(okTimer); stopBlink();
    wires = []; sel = null; plugged = false; connected = false; flashed = false; flashing = false; boot0 = 0; latched = 0;
    logEl.innerHTML = ''; q('#slProgWrap').hidden = true;
    refreshUi();
    say('idle', '🔌 برد و ST-Link از هم جدا هستند. یک پایه از ST-Link و بعد پایه‌ی هم‌نامش را روی برد بزن تا سیم وصل شود.');
  }
  q('#slReset').addEventListener('click', resetAll);

  resetAll();
  if(alreadyDone) say('success', '✅ قبلاً برد را به ST-Link وصل کرده و برنامه را ریخته‌ای. دوست داری دوباره امتحان کنی؟ پایه‌ها را وصل کن.');
  return { stop(){ clearInterval(flashTimer); clearInterval(blinkTimer); clearTimeout(okTimer); } };
}


