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
      'این مأموریت فقط مطالعه است؛ وقتی خواندی، «مطالعه کردم ✓» را بزن.'
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
    ]},
  { id:'esp32_wifi_led', icon:'🌐', title:'ESP32 — روشن‌کردن چراغ با Wi-Fi', sub:'وب‌سرورِ کوچک روی برد؛ فرمان از گوشی',
    xp:90,
    quote:'«تا اینجا برد فقط دستورهای خودش را اجرا می‌کرد. حالا برد به Wi-Fi خانه وصل می‌شود، یک وب‌سرورِ کوچک روی خودش راه می‌اندازد و تو از گوشی چراغ را روشن و خاموش می‌کنی؛ همان چیزی که به آن IoT می‌گویند.»',
    desc:'ESP32 می‌تواند مثل یک سایتِ کوچک رفتار کند: اول با WiFi.begin(ssid, password) به مودم وصل می‌شود و یک آدرس IP می‌گیرد (مثلاً 192.168.1.50). بعد با کتابخانه‌ی WebServer یک سرور روشن می‌کند و برای هر آدرس یک کار تعریف می‌کنیم: وقتی گوشی (که به همان Wi-Fi وصل است) آدرسِ /on را باز کند، برد LED را روشن می‌کند و وقتی /off را باز کند، خاموش.\n\nدو چیز را فراموش نکن: در loop() باید مدام server.handleClient() صدا زده شود وگرنه برد به درخواست‌ها گوش نمی‌دهد، و ESP32 فقط به Wi-Fi دو‌و‌نیم گیگاهرتزی وصل می‌شود.\n\nدر شبیه‌ساز زیر یک مودمِ مجازی داریم. چهار جای خالیِ کد را درست انتخاب کن، آپلود کن و بعد از «گوشیِ مجازی» چراغ را روشن کن.',
    steps:[
      'هر چهار جای خالی را از منوی کشویی انتخاب کن (اگر اشتباه باشد، دلیلش را می‌گوید).',
      'دکمه‌ی «آپلود روی ESP32» را بزن و صبر کن تا برد به Wi-Fi وصل شود و IP را در Serial چاپ کند.',
      'در گوشیِ مجازی دکمه‌ی «/on روشن» را بزن؛ LED روی GPIO2 باید روشن شود.',
      'با «/off خاموش» چراغ را خاموش کن؛ با روشن‌شدنِ چراغ از گوشی مأموریت تکمیل می‌شود.'
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

/* ----- شبیه‌ساز آشنایی با ESP32: فقط مطالعه (در quest.js زیرِ READ_ONLY_SIMS ثبت است و با دکمه‌ی «مطالعه کردم ✓» تکمیل می‌شود) ----- */
function mountEsp32IntroSim(container, { onSuccess, alreadyDone } = {}){
  const seen = new Set(alreadyDone ? ES_PARTS.map(p => p.id) : []);
  let finished = !!alreadyDone;

  container.innerHTML = `
    <div class="sim-wrap es-wrap">
      <div class="sim-hw-note">روی بخش‌های برد بزن و توضیحشان را بخوان. این مأموریت فقط مطالعه است؛ هر وقت خواندی «مطالعه کردم ✓» را بزن.</div>
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

/* ----- شبیه‌ساز Wi-Fi: چهار جای خالیِ کدِ وب‌سرور ← آپلود ← روشن‌کردن LED از «گوشیِ مجازی» -----
   خودکفاست (به arduino-sim.js نیاز ندارد). با روشن‌شدنِ LED از گوشی، onSuccess صدا زده می‌شود. */
const EW_BLANKS = {
  a: { right:'begin',        opts:['begin','connect','join'],
       why:{ connect:'برای اتصال به مودم تابعی به اسم WiFi.connect وجود ندارد؛ اتصال با WiFi.begin(ssid, password) شروع می‌شود.',
             join:'WiFi.join وجود ندارد؛ اتصال با WiFi.begin(ssid, password) شروع می‌شود.' } },
  b: { right:'HIGH',         opts:['HIGH','LOW','ON'],
       why:{ LOW:'روی ESP32 مقدارِ LOW یعنی LED خاموش؛ مسیرِ /on باید چراغ را روشن کند.',
             ON:'ON در آردوینو تعریف نشده است؛ برای روشن‌کردن از HIGH استفاده کن.' } },
  c: { right:'begin',        opts:['begin','listen','run'],
       why:{ listen:'server.listen وجود ندارد؛ سرور را با server.begin() راه می‌اندازیم.',
             run:'server.run وجود ندارد؛ سرور را با server.begin() راه می‌اندازیم.' } },
  d: { right:'handleClient', opts:['handleClient','send','begin'],
       why:{ send:'send فقط جواب می‌فرستد. برای گوش‌دادن به درخواست‌های گوشی، در loop باید مدام handleClient() صدا زده شود.',
             begin:'begin را یک بار در setup می‌زنیم. در loop باید مدام handleClient() صدا زده شود تا درخواست‌ها پردازش شوند.' } }
};

function mountEsp32WifiSim(container, { onSuccess, alreadyDone } = {}){
  const IP = '192.168.1.50';
  const timers = [];
  let running = !!alreadyDone, finished = !!alreadyDone, ledOn = false, uploading = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  const sel = (k) => `<select class="ew-sel" data-k="${k}" aria-label="جای خالیِ ${k}"><option value="">؟</option>${EW_BLANKS[k].opts.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`;

  container.innerHTML = `
    <style>
      .ew-code{direction:ltr;text-align:left;background:#0b0e14;color:#d6deeb;border:1px solid #2e3440;border-radius:10px;padding:12px;margin:10px 0;font:12.5px/1.75 ui-monospace,Menlo,Consolas,monospace;overflow-x:auto;white-space:pre}
      .ew-code .c{color:#7f8aa3}
      .ew-sel{font:inherit;background:#18202e;color:#ffd479;border:1px dashed #d4af37;border-radius:6px;padding:1px 4px;cursor:pointer}
      .ew-sel.ok{border:1px solid #57d8a3;color:#57d8a3}
      .ew-sel.bad{border:1px solid #ff6b6b;color:#ff9a9a}
      .ew-sel:disabled{opacity:1;cursor:default}
      .ew-msgs{display:grid;gap:6px;margin:6px 0;font-size:13px}
      .ew-msg{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.45);border-radius:8px;padding:6px 10px}
      .ew-row{display:flex;gap:12px;flex-wrap:wrap;align-items:stretch;margin-top:10px}
      .ew-col{flex:1 1 240px;min-width:0}
      .ew-serial{direction:ltr;text-align:left;background:#05070b;color:#7ee787;border-radius:10px;border:1px solid #2e3440;padding:8px 10px;min-height:92px;font:12px/1.6 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}
      .ew-phone{border:2px solid #3a4250;border-radius:22px;padding:10px;background:#10141b;max-width:300px;margin:0 auto}
      .ew-url{direction:ltr;text-align:left;background:#1b2230;color:#9aa6bd;border-radius:14px;padding:4px 10px;font:12px ui-monospace,Menlo,Consolas,monospace;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ew-screen{direction:ltr;min-height:56px;background:#fff;color:#111;border-radius:10px;padding:10px;font:13px ui-monospace,Menlo,Consolas,monospace;margin-bottom:8px;display:flex;align-items:center;justify-content:center;text-align:center}
      .ew-screen.off{background:#1b2230;color:#7f8aa3;font-family:inherit;font-size:12px}
      .ew-btns{display:flex;gap:8px}
      .ew-btn{flex:1;font:inherit;font-size:13px;padding:8px 6px;border-radius:10px;border:1px solid #3a4250;background:#1b2230;color:#e8e2d0;cursor:pointer}
      .ew-btn:disabled{opacity:.45;cursor:not-allowed}
      .ew-btn.go{background:#d4af37;color:#1a1405;border-color:#d4af37;font-weight:700}
      .ew-prog{margin-top:8px;font-size:13px}
    </style>
    <div class="sim-wrap es-wrap">
      <div class="sim-hw-note">هدف: چهار جای خالیِ کد را درست کن، آپلود کن و بعد از گوشیِ مجازی چراغ را روشن کن. (در شبیه‌ساز یک مودمِ مجازی داریم که نام و رمزش همان است که در کد آمده.)</div>
      <details class="hs-det" open>
        <summary>این چراغ چطور با Wi-Fi روشن می‌شود؟</summary>
        <div class="hs-p">برد به مودم وصل می‌شود و یک آدرس IP می‌گیرد. گوشی هم که به همان مودم وصل است، آدرسی مثل <b dir="ltr">http://${IP}/on</b> را باز می‌کند. این درخواست به ESP32 می‌رسد؛ برد در تابعی که برای /on نوشته‌ای، LED را روشن می‌کند و یک جواب کوتاه برمی‌گرداند. پس سه بازیگر داریم: <b>گوشی ← مودم ← ESP32</b>.</div>
      </details>
      <pre class="ew-code" dir="ltr"><span class="c">// کتابخانه‌ها</span>
#include &lt;WiFi.h&gt;
#include &lt;WebServer.h&gt;

const char* ssid     = "MyHome";
const char* password = "12345678";
const int ledPin = 2;
WebServer server(80);

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  WiFi.${sel('a')}(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println(WiFi.localIP());

  server.on("/on", []() {
    digitalWrite(ledPin, ${sel('b')});
    server.send(200, "text/plain", "LED ON");
  });
  server.on("/off", []() {
    digitalWrite(ledPin, LOW);
    server.send(200, "text/plain", "LED OFF");
  });
  server.${sel('c')}();
}

void loop() {
  server.${sel('d')}();
}</pre>
      <div class="ew-msgs" aria-live="polite"></div>
      <button type="button" class="ew-btn go ew-upload">⬆️ آپلود روی ESP32</button>
      <div class="ew-row">
        <div class="ew-col">
          <div class="sim-board-wrap">${esp32BoardSVG({ led:true })}</div>
          <div class="ew-serial" aria-live="polite"><span style="color:#7f8aa3">// خروجی Serial Monitor</span></div>
        </div>
        <div class="ew-col">
          <div class="ew-phone">
            <div class="ew-url ew-urlbar">http://${IP}/</div>
            <div class="ew-screen off">اول کد را آپلود کن تا برد به Wi-Fi وصل شود.</div>
            <div class="ew-btns">
              <button type="button" class="ew-btn" data-path="/on" disabled>/on روشن</button>
              <button type="button" class="ew-btn" data-path="/off" disabled>/off خاموش</button>
            </div>
          </div>
        </div>
      </div>
      <div class="ew-prog" aria-live="polite"></div>
    </div>`;

  const selects = Array.from(container.querySelectorAll('.ew-sel'));
  const msgs = container.querySelector('.ew-msgs');
  const upBtn = container.querySelector('.ew-upload');
  const serial = container.querySelector('.ew-serial');
  const screen = container.querySelector('.ew-screen');
  const urlbar = container.querySelector('.ew-urlbar');
  const phoneBtns = Array.from(container.querySelectorAll('.ew-btn[data-path]'));
  const prog = container.querySelector('.ew-prog');
  const bulb = container.querySelector('#simLedBulb');
  const rays = container.querySelectorAll('.sim-led-ray');

  function setLed(on){
    ledOn = on;
    if(bulb){
      bulb.style.fill = on ? '#5aa9ff' : '#1b2a44';
      bulb.style.stroke = on ? '#cfe4ff' : '#3a4a6a';
      bulb.style.filter = on ? 'url(#simLedGlow)' : 'none';
    }
    rays.forEach(r => { r.style.opacity = on ? '1' : '0'; r.style.stroke = '#9cc8ff'; });
  }
  setLed(false);

  function logLine(t){ serial.textContent += '\n' + t; serial.scrollTop = serial.scrollHeight; }

  function enablePhone(){
    phoneBtns.forEach(b => { b.disabled = false; });
    screen.classList.remove('off');
    screen.textContent = 'صفحه آماده است؛ یکی از دکمه‌ها را بزن.';
    screen.style.direction = 'rtl';
  }

  function solved(){
    selects.forEach(s => { s.value = EW_BLANKS[s.dataset.k].right; s.classList.add('ok'); s.disabled = true; });
  }

  if(alreadyDone){
    solved();
    upBtn.disabled = true; upBtn.textContent = '✓ آپلود شد';
    serial.textContent = '// خروجی Serial Monitor\nConnecting to MyHome....\nIP: ' + IP;
    enablePhone();
    prog.textContent = '✓ قبلاً چراغ را با Wi-Fi روشن کرده‌ای.';
  }

  selects.forEach(s => s.addEventListener('change', () => { s.classList.remove('bad'); msgs.innerHTML = ''; }));

  upBtn.addEventListener('click', () => {
    if(running || uploading) return;
    msgs.innerHTML = '';
    const wrong = [];
    selects.forEach(s => {
      const k = s.dataset.k, def = EW_BLANKS[k];
      s.classList.remove('bad');
      if(s.value === def.right) return;
      s.classList.add('bad');
      wrong.push(s.value
        ? (def.why[s.value] || 'این گزینه درست نیست.')
        : 'یکی از جای‌خالی‌ها هنوز انتخاب نشده است.');
    });
    if(wrong.length){
      const uniq = Array.from(new Set(wrong));
      msgs.innerHTML = uniq.map(w => `<div class="ew-msg">⚠️ ${w}</div>`).join('');
      return;
    }
    uploading = true;
    solved();
    upBtn.disabled = true; upBtn.textContent = '⏳ در حال آپلود…';
    serial.textContent = '// خروجی Serial Monitor';
    later(() => logLine('Uploading… done. Rebooting.'), 500);
    later(() => logLine('Connecting to MyHome'), 1100);
    later(() => logLine('....'), 1700);
    later(() => logLine('WiFi connected!'), 2300);
    later(() => logLine('IP: ' + IP), 2700);
    later(() => {
      logLine('HTTP server started');
      running = true; uploading = false;
      upBtn.textContent = '✓ آپلود شد';
      enablePhone();
      prog.textContent = 'برد آنلاین شد. حالا از گوشی چراغ را روشن کن.';
    }, 3200);
  });

  phoneBtns.forEach(b => b.addEventListener('click', () => {
    if(!running) return;
    const on = b.dataset.path === '/on';
    urlbar.textContent = 'http://' + IP + b.dataset.path;
    screen.style.direction = 'ltr';
    screen.textContent = on ? 'LED ON' : 'LED OFF';
    logLine('GET ' + b.dataset.path + ' → 200');
    setLed(on);
    if(on && !finished){
      finished = true;
      prog.textContent = '✓ آفرین! چراغ را از راه دور و با Wi-Fi روشن کردی.';
      if(onSuccess) onSuccess();
    }
  }));

  return { stop(){ timers.forEach(clearTimeout); } };
}
