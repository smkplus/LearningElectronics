/* ========================================================================
   QUEST-ESP32.JS — بخش ESP32
   داده‌ی مأموریت‌ها (QUESTS_ESP32) + بردِ ESP32 (esp32BoardSVG) + شبیه‌ساز آشنایی (mountEsp32IntroSim)
   مأموریت چشمک‌زن با ArduinoSim (task: esp32blink در arduino-sim.js) اجرا می‌شود.
   ======================================================================== */

const QUESTS_ESP32 = [
  { id:'esp32_intro', icon:'📡', section:{ icon:'📡', title:'بخش ESP32', sub:'ESP32 ساخته‌ی شرکت Espressif است؛ یک میکروکنترلرِ دو‌هسته‌ای تا ۲۴۰ مگاهرتز که Wi-Fi و بلوتوث را داخل خودش دارد. با همان کد و محیط آردوینو برنامه می‌گیرد، اما سریع‌تر است و می‌تواند به اینترنت وصل شود؛ برای همین در پروژه‌های IoT (خانه‌ی هوشمند، سنسورهای آنلاین) زیاد استفاده می‌شود. فقط یادت باشد منطقش ۳٫۳ ولت است.' },
    title:'ESP32 — آشنایی با برد', sub:'مغز، آنتن، USB، دکمه‌ها و پایه‌ها',
    xp:60,
    quote:'«آردوینو Uno فقط می‌تواند با پایه‌هایش کار کند؛ ESP32 علاوه بر آن خودش به Wi-Fi وصل می‌شود و با گوشی از راه بلوتوث حرف می‌زند، آن هم روی بردی به اندازه‌ی چند سکه. قبل از برنامه‌نویسی، بهتر است بدانی روی این برد چه چیزی کجاست.»',
    desc:'ESP32 یک میکروکنترلرِ ۳۲بیتی است که معمولاً روی بردهای آماده‌ای به اسم DevKit می‌فروشند. روی این برد چند بخش اصلی هست: ماژولِ ESP32 که مغزِ برد زیرِ یک سپرِ فلزی است، آنتنِ Wi-Fi و بلوتوث، پورتِ micro-USB با چیپِ مبدلِ USB به سریال، دکمه‌های EN و BOOT، یک LED داخلی و دو ردیف پایه (GPIO).\n\nبزرگ‌ترین تفاوت با آردوینو Uno: منطقِ ESP32 روی ۳٫۳ ولت است و ۵ ولت به پایه‌هایش آسیب می‌زند. تفاوتِ خوب‌اش این است که بدونِ برنامه‌ریزِ جدا (مثل ST-Link برای Blue Pill) و فقط با یک کابل USB برنامه می‌گیرد.\n\nدر شبیه‌ساز زیر روی هر بخشِ برد بزن و توضیحش را بخوان.',
    steps:[
      'اول بخش «ESP32 چیست؟» را بخوان و جدول مقایسه با Uno و Blue Pill را نگاه کن.',
      'روی هر بخشِ برد (ماژول، آنتن، USB، دکمه‌ی EN، دکمه‌ی BOOT، LED و ردیف پایه‌ها) بزن؛ توضیحش پایین برد می‌آید.',
      'می‌توانی به‌جای زدن روی خودِ برد، از دکمه‌های کوچکِ زیرِ توضیح هم استفاده کنی.',
      'وقتی هر ۷ بخش را دیدی، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'esp32_blink', icon:'💡', title:'ESP32 — اولین چشمک‌زن', sub:'همان کد آردوینو، فقط روی GPIO2',
    xp:70,
    quote:'«بهترین خبر ESP32 این است که کدِ آردوینو را بلد باشی، بلدِ آن هم هستی: pinMode و digitalWrite و delay همان‌اند. فقط باید بدانی LED داخلیِ برد روی کدام پایه نشسته: روی بیشترِ بردهای DevKit پایه‌ی ۲.»',
    desc:'روی بیشترِ بردهای ESP32 DevKit یک LED آبی داخلِ برد به پایه‌ی GPIO2 وصل است. برای چشمک‌زدنش همان کدِ آردوینو را می‌نویسی: پایه را با pinMode خروجی می‌کنی، با digitalWrite(2, HIGH) روشنش می‌کنی و با delay(500) نیم ثانیه صبر می‌کنی. برخلاف LED روی Blue Pill، این LED فعال‌بالاست: HIGH یعنی روشن.\n\nنکته: در شبیه‌ساز از خودِ عدد ۲ استفاده کن (همان متغیرِ ledPin در کدِ اولیه)؛ ثابتِ LED_BUILTIN روی بردهای مختلف عدد متفاوتی دارد.\n\nدر ادیتورِ زیر همین کار را بکن: کدی بنویس که LED روی GPIO2 چشمک بزند.',
    steps:[
      'در `loop()` با `digitalWrite(ledPin, HIGH);` LED را روشن کن.',
      'بعدش `delay(500);` بنویس تا نیم ثانیه صبر کند.',
      'با `digitalWrite(ledPin, LOW);` خاموشش کن و دوباره `delay(500);` بگذار.',
      'دکمه‌ی اجرا را بزن؛ LED باید روشن و خاموش شود.',
      'اگر خواستی حالت بلوکی را هم امتحان کن؛ همین کار را با بلوک‌ها انجام می‌دهد.'
    ]}
];

/* ----- بردِ ESP32 DevKit (برای مأموریت آشنایی و چشمک‌زن) ----- */
const ES_PARTS = [
  { id:'module',  name:'ماژول ESP32',   icon:'🧠', text:'مغزِ برد زیرِ این سپرِ فلزی است: ماژولِ ESP32-WROOM-32 با چیپِ دو‌هسته‌ای تا ۲۴۰ مگاهرتز، حدود ۵۲۰ کیلوبایت RAM و معمولاً ۴ مگابایت حافظه‌ی فلش برای برنامه‌ات. سپرِ فلزی چیپ را از نویز محافظت می‌کند و گرمایش را پخش می‌کند.' },
  { id:'antenna', name:'آنتن',          icon:'📶', text:'مسیرهای زیگزاگیِ طلایی همان آنتنِ روی بردند: Wi-Fi (۲٫۴ گیگاهرتز) و بلوتوث از همین‌جا ارسال و دریافت می‌شوند. زیرِ آنتن فلز و مس و سیم نگذار و با دست یا جعبه‌ی فلزی نپوشانش، وگرنه برد ضعیف می‌شود.' },
  { id:'usb',     name:'پورت USB',      icon:'🔌', text:'پورتِ micro-USB و چیپِ مبدلِ USB به سریال (معمولاً CP2102 یا CH340) کنارش. هم به برد برق می‌دهد، هم برنامه را از کامپیوتر می‌ریزد و هم خروجیِ Serial.println را برمی‌گرداند. برخلاف Blue Pill برنامه‌ریزِ جدا لازم نیست؛ فقط کابلی بزن که داده هم منتقل کند.' },
  { id:'en',      name:'دکمه‌ی EN',     icon:'🔁', text:'EN (Enable) دکمه‌ی ریستِ برد است: با زدنش برنامه از اول اجرا می‌شود. شبیه دکمه‌ی RESET روی آردوینو.' },
  { id:'boot',    name:'دکمه‌ی BOOT',   icon:'⬇️', text:'BOOT به پایه‌ی GPIO0 وصل است. اگر موقعِ آپلود برد وارد حالتِ دانلود نشد و پیامِ Connecting… ماند، BOOT را نگه دار و دوباره آپلود کن (بیشترِ بردها این کار را خودشان می‌کنند). بعد از اجرای برنامه هم می‌تواند یک دکمه‌ی معمولی باشد.' },
  { id:'led',     name:'LED داخلی',     icon:'💡', text:'LED آبیِ داخلیِ برد که روی بیشترِ بردهای DevKit به GPIO2 وصل است. با digitalWrite(2, HIGH) روشن و با LOW خاموش می‌شود. (بعضی بردها LED ندارند یا آن را روی پایه‌ی دیگری گذاشته‌اند.)' },
  { id:'pins',    name:'ردیف پایه‌ها',  icon:'📍', text:'دو ردیف پایه (GPIO) بالا و پایینِ برد: حدود ۳۰ پایه‌ی قابل‌استفاده با PWM، ADC، I2C، SPI و لمسی. منطقِ همه‌ی پایه‌ها ۳٫۳ ولت است و ۵ ولت مستقیم به آن‌ها نزن. بعضی پایه‌ها (۳۴ تا ۳۹) فقط ورودی‌اند و چند پایه (مثل ۰ و ۲) موقعِ روشن‌شدن حالتِ خاصی دارند.' }
];

function esp32BoardSVG({ led = false, parts = false } = {}){
  const P = (id, hits, inner) => {
    if(!parts) return `<g>${inner}</g>`;
    const info = ES_PARTS.find(p => p.id === id);
    return `<g class="es-part" data-part="${id}" tabindex="0" role="button" aria-label="${info.name}">${inner}${hits.map(h => `<rect class="es-hl" ${h}/>`).join('')}</g>`;
  };
  let pads = '';
  for(let i = 0; i < 19; i++){
    const x = (40 + i * 12.6).toFixed(1);
    [38, 142].forEach(y => { pads += `<circle cx="${x}" cy="${y}" r="2.6" fill="#d9b94a"/><circle cx="${x}" cy="${y}" r="1" fill="#0b0e14"/>`; });
  }
  const meander = 'M240,54 H266 V62 H240 V70 H266 V78 H240 V86 H266 V94 H240 V102 H266 V110 H240 V118 H266 V126';
  const ledSvg = led
    ? `<g id="simLedGroup" class="sim-led-group">
        <line x1="106" y1="82" x2="106" y2="76" class="sim-led-ray"/>
        <line x1="97" y1="86" x2="92" y2="81" class="sim-led-ray"/>
        <line x1="115" y1="86" x2="120" y2="81" class="sim-led-ray"/>
        <circle id="simLedBulb" cx="106" cy="94" r="8" class="sim-led-bulb"/>
      </g>`
    : `<circle cx="106" cy="94" r="8" fill="#2b6fe0" stroke="#9cc0ff" stroke-width="1" opacity=".9"/>`;
  const caption = led ? 'ESP32 DevKit — LED روی GPIO2 (یک = روشن)' : 'ESP32 DevKit — روی هر بخش بزن';
  return `
    <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="${parts ? 'false' : 'true'}">
      <defs>
        <filter id="simLedGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect x="16" y="30" width="268" height="120" rx="8" fill="#15181e" stroke="#2e3440"/>
      ${P('pins', ['x="34" y="30" width="240" height="16"', 'x="34" y="134" width="240" height="16"'], pads)}
      ${P('usb', ['x="2" y="72" width="66" height="46" rx="4"'],
        `<rect x="4" y="76" width="24" height="36" rx="2" fill="#c8d0dc" stroke="#8a93a6"/><rect x="7" y="84" width="14" height="20" rx="1.5" fill="#2a2f3a"/>
         <rect x="40" y="84" width="18" height="18" rx="2" fill="#0d0f13" stroke="#3a4250"/><text x="49" y="112" text-anchor="middle" class="sim-board-sub" style="font-size:5px;fill:#9aa6bd">USB-UART</text>`)}
      ${P('en', ['x="38" y="46" width="42" height="20" rx="4"'],
        `<rect x="44" y="48" width="14" height="14" rx="2" fill="#dfe4ec" stroke="#8a93a6"/><circle cx="51" cy="55" r="3.6" fill="#2a2f3a"/><text x="62" y="58" class="sim-board-sub" style="font-size:6px;fill:#9aa6bd">EN</text>`)}
      ${P('boot', ['x="38" y="118" width="48" height="20" rx="4"'],
        `<rect x="44" y="120" width="14" height="14" rx="2" fill="#dfe4ec" stroke="#8a93a6"/><circle cx="51" cy="127" r="3.6" fill="#2a2f3a"/><text x="62" y="130" class="sim-board-sub" style="font-size:6px;fill:#9aa6bd">BOOT</text>`)}
      ${P('led', ['x="88" y="72" width="36" height="52" rx="6"'],
        `${ledSvg}<text x="106" y="114" text-anchor="middle" class="sim-pin-label" style="font-size:6.5px;fill:#cfe0ff">GPIO2</text>`)}
      ${P('module', ['x="146" y="46" width="88" height="88" rx="3"'],
        `<rect x="146" y="46" width="88" height="88" rx="3" fill="#c9ced6" stroke="#8a93a0"/>
         <text x="190" y="84" text-anchor="middle" class="sim-board-label" style="font-size:11px;fill:#2b3038">ESP32</text>
         <text x="190" y="97" text-anchor="middle" class="sim-board-sub" style="font-size:6.5px;fill:#3a414c">WROOM-32</text>
         <text x="190" y="113" text-anchor="middle" class="sim-board-sub" style="font-size:6px;fill:#3a414c">Wi-Fi · Bluetooth</text>`)}
      ${P('antenna', ['x="234" y="46" width="38" height="88" rx="3"'],
        `<rect x="234" y="46" width="38" height="88" rx="3" fill="#20252d" stroke="#3a4250"/><path d="${meander}" fill="none" stroke="#c9a64b" stroke-width="2" stroke-linejoin="round"/>`)}
      <text x="150" y="172" text-anchor="middle" class="sim-caption">${caption}</text>
    </svg>`;
}

/* ----- شبیه‌ساز آشنایی با ESP32: دیدنِ هر ۷ بخش، مأموریت را کامل می‌کند ----- */
function mountEsp32IntroSim(container, { onSuccess, alreadyDone } = {}){
  const seen = new Set(alreadyDone ? ES_PARTS.map(p => p.id) : []);
  let finished = !!alreadyDone;

  container.innerHTML = `
    <div class="sim-wrap es-wrap">
      <div class="sim-hw-note">هدف: روی هر بخشِ برد بزن و توضیحش را بخوان. وقتی هر ${ES_PARTS.length} بخش را دیدی، مأموریت خودکار تکمیل می‌شود.</div>
      <details class="hs-det" open>
        <summary>ESP32 چیست و با آردوینو و STM32 چه فرقی دارد؟</summary>
        <div class="hs-p">ESP32 میکروکنترلری از شرکت Espressif است که Wi-Fi و بلوتوث را داخلِ خودِ چیپ دارد. برای همین بدونِ ماژولِ اضافه می‌تواند به اینترنت وصل شود، داده بفرستد یا با گوشی حرف بزند. با Arduino IDE و همان زبانِ C++ آردوینو برنامه‌ریزی می‌شود، پس هرچه از آردوینو یاد گرفته‌ای این‌جا هم کار می‌کند.</div>
        <table class="hs-table">
          <tr><th></th><th>آردوینو Uno</th><th>Blue Pill (STM32)</th><th>ESP32</th></tr>
          <tr><td>هسته و سرعت</td><td>۸بیتی، ۱۶ مگاهرتز</td><td>۳۲بیتی، ۷۲ مگاهرتز</td><td>۳۲بیتی، دو‌هسته‌ای، تا ۲۴۰ مگاهرتز</td></tr>
          <tr><td>RAM</td><td>۲ کیلوبایت</td><td>۲۰ کیلوبایت</td><td>حدود ۵۲۰ کیلوبایت</td></tr>
          <tr><td>ولتاژ منطق</td><td>۵ ولت</td><td>۳٫۳ ولت</td><td>۳٫۳ ولت</td></tr>
          <tr><td>Wi-Fi و بلوتوث</td><td>ندارد</td><td>ندارد</td><td>دارد (داخلی)</td></tr>
          <tr><td>ریختنِ برنامه</td><td>کابل USB</td><td>برنامه‌ریزِ جدا (ST-Link)</td><td>کابل USB</td></tr>
        </table>
      </details>
      <div class="sim-board-wrap">${esp32BoardSVG({ parts:true })}</div>
      <div class="es-info" aria-live="polite"><b>روی یکی از بخش‌های برد بزن</b>اینجا توضیحش را می‌بینی.</div>
      <div class="es-chips" role="group" aria-label="بخش‌های برد">
        ${ES_PARTS.map(p => `<button type="button" class="es-chip" data-part="${p.id}">${p.icon} ${p.name}</button>`).join('')}
      </div>
      <div class="es-prog"></div>
    </div>`;

  const info = container.querySelector('.es-info');
  const prog = container.querySelector('.es-prog');

  function paint(currentId){
    container.querySelectorAll('.es-part, .es-chip').forEach(el => {
      const id = el.dataset.part;
      el.classList.toggle('es-seen', seen.has(id));
      el.classList.toggle('seen', seen.has(id));
      el.classList.toggle('es-on', id === currentId);
      el.classList.toggle('on', id === currentId);
    });
    prog.textContent = finished
      ? `✓ همه‌ی ${toFa(ES_PARTS.length)} بخش را دیدی.`
      : `دیده‌شده: ${toFa(seen.size)} از ${toFa(ES_PARTS.length)}`;
  }

  function select(id){
    const p = ES_PARTS.find(x => x.id === id);
    if(!p) return;
    info.innerHTML = `<b>${p.icon} ${p.name}</b>${p.text}`;
    seen.add(id);
    const complete = !finished && seen.size === ES_PARTS.length;
    if(complete) finished = true;
    paint(id);
    if(complete && onSuccess) onSuccess();
  }

  container.addEventListener('click', e => {
    const el = e.target.closest('.es-part, .es-chip');
    if(el && container.contains(el)) select(el.dataset.part);
  });
  container.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('.es-part');
    if(el){ e.preventDefault(); select(el.dataset.part); }
  });

  paint(null);
  return { stop(){} };
}
