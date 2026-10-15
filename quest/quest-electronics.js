/* ========================================================================
   QUEST-ELECTRONICS.JS — بخش الکترونیک
   داده‌ی مأموریت‌ها (QUESTS_ELECTRONICS) + شبیه‌سازها
   QUESTS_ELECTRONICS + mountVoltCurrentSim / Resistor / LED / Capacitor / Transistor
   ======================================================================== */

const QUESTS_ELECTRONICS = [
  { id:'volt_current', icon:'🔋', section:{ icon:'🔋', title:'بخش الکترونیک', sub:'هر مدارِ الکترونیکی با سه مفهوم شروع می‌شود: ولتاژ (فشارِ الکترون‌ها)، جریان (مقدارِ عبورِ آن‌ها) و مقاومت (چیزی که جلوی جریان را می‌گیرد). قبل از سراغ بردها رفتن، این‌ها را با هم می‌فهمیم و یاد می‌گیریم مقاومت‌ها را از روی رنگ‌هایشان بخوانیم.' }, title:'ولتاژ - جریان - مقاومت', sub:'مفاهیم اولیه — الکترون‌ها به کجا می‌روند؟',
    xp:20,
    quote:'«ولتاژ همان فشاری است که باتری به الکترون‌ها وارد می‌کند تا در سیم حرکت کنند، و جریان یعنی چه‌قدر الکترون در هر ثانیه از یک نقطه عبور می‌کند. مقاومت هم جلوی این حرکت را می‌گیرد؛ هرچه ولتاژ بیشتر یا مقاومت کمتر باشد، جریان بزرگ‌تر می‌شود. این سه کمیت را قانون اهم به هم وصل می‌کند.»',
    desc: "تصور کن می‌خواهی به یک چراغ کوچک انرژی برسانی. اولین چیزی که نیاز داری یک باتری است؛ باتری مثل یک پمپ آب عمل می‌کند که انرژی شیمیایی را به فشار الکتریکی تبدیل می‌کند.\n\nاین فشار، همان «ولتاژ» است که الکترون‌ها را در سیم به حرکت درمی‌آورد. اما مراقب باش! اگر جریانِ حاصل از این فشار بیش از حد زیاد شود، چراغ می‌سوزد.\n\nاینجاست که «مقاومت» به کمکت می‌آید؛ درست مثل تنگیِ یک لوله، مقاومت عبور الکترون‌ها را سخت‌تر می‌کند و جریان را کنترل می‌کند.\n\nحالا نوبت توست! با تنظیم دقیق جریان، جریان را به اندازه‌ای برسان که چراغ بدون سوختن، پرنور روشن شود.",
    steps:[
      'مسیر زیر، اول کاملاً بسته است — مقاومت در بیشترین مقدار و جریان صفر.',
      'با اسلایدر، مسیر را کم‌کم باز کن و ببین الکترون‌ها چطور شروع به حرکت می‌کنند.',
      'به‌اندازه‌ی کافی باز کن تا جریان کافی برسد و LED روشن شود.',
      'مراقب باش زیادش نکنی — مقاومت خیلی کم یعنی جریان خیلی زیاد و سوختن LED!'
    ]},
  { id:'resistor_calc', icon:'🎨', title:'محاسبه مقاومت رنگی', sub:'بین‌راه — رمزگشایی نوارهای رنگی مقاومت',
    xp:25,
    quote:'دهه بیست میلادی مهندسان رادیو کلافه بودند. قطعات الکترونیکی آنقدر ریز شده بودند که اعداد رویشان مثل نقطه‌های محو بود. بدتر اینکه وقتی قطعه را روی برد لحیم می‌کردند، عدد می‌چرخید سمت پشتِ کار و ناپدید می‌شد! تعمیرکارها مجبور بودند مثل شکارچی‌ها با چراغ‌قوه دنبال عدد بگردند. تا اینکه فکری به ذهنشان رسید: «چرا به جای عدد، از رنگ استفاده نکنیم؟»',
    desc:'هر مقاومت چهار نوار رنگی دارد که مقدارش را رمزگذاری می‌کنند: نوار اول و دوم دو رقم عدد را می‌سازند، نوار سوم آن عدد را در یک ضریب (توان ده) ضرب می‌کند، و نوار چهارم میزان خطای مجاز (تلورانس) را نشان می‌دهد. حالا نوبت توست که این رمز را با دست خودت بخوانی و بسازی — همان مقاومت ۲۲۰ اهمی‌ای که در مأموریت روشن‌کردن LED جلوی پایش می‌گذاریم.',
    steps:[
      'همین‌جا در همین مأموریت، نوارهای رنگی مقاومت را با منوی کشویی زیر تنظیم کن.',
      'داخل هر دراپ‌داون، رقم یا ضریب هر رنگ کنار اسمش نوشته شده — لازم نیست جدول جداگانه‌ای نگاه کنی.',
      'نوار اول و دوم را قرمز بگذار (رقم ۲ و ۲) تا عدد پایه‌ی ۲۲ به دست بیاید.',
      'نوار سوم را قهوه‌ای بگذار (ضریب ×۱۰)، یعنی ۲۲ × ۱۰ = ۲۲۰ اهم.',
      'نوار چهارم (تلورانس) را هرچه دوست داری بگذار — روی خودِ مقدار اهم اثری ندارد.',
      'به‌محض اینکه عدد روی صفحه دقیقاً ۲۲۰ Ω را نشان داد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'led_diode', icon:'💡', title:'دیود نوری (LED)', sub:'دریچه‌ی یک‌طرفه‌ی جریان — آند و کاتد',
    xp:30,
    quote:'«دیود مثل یک در یک‌طرفه است: جریان فقط از یک جهت از آن رد می‌شود. LED یک دیود است که وقتی جریان از آن می‌گذرد نور هم می‌دهد. پایه‌ی بلندترش مثبت (آند) و پایه‌ی کوتاه‌ترش منفی (کاتد) است؛ اگر برعکس وصلش کنی، جریان نمی‌گذرد و روشن نمی‌شود.»',
    desc:'LED مخفف «دیود نوری» است. دو پایه دارد: آند (+) که پایه‌ی بلندتر است و کاتد (−) که کوتاه‌تر است و لبه‌ی تخت بدنه‌اش هم کنار همین پایه است. آند باید سمتِ مثبت باتری باشد. مقاومت هم سر راه گذاشته می‌شود تا جریان زیاد نشود و LED نسوزد.\n\nدر مدار زیر LED برعکس وصل شده و روشن نمی‌شود. جهتش را درست کن.',
    steps:[
      'مدار زیر را ببین: باتری، مقاومت و LED پشت‌سرهم وصل‌اند، ولی LED خاموش است.',
      'برچسب کنار پایه‌های LED را بخوان: پایه‌ی بلند آند (+) و پایه‌ی کوتاه (سمتِ لبه‌ی تخت بدنه) کاتد (−) است. کدام‌یک به سمت مثبت باتری وصل است؟',
      'دکمه‌ی «LED را برگردان» را بزن تا آند به سمت مثبت برود.',
      'وقتی LED روشن شد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'capacitor', icon:'🔋', title:'خازن', sub:'باتری کوچک و سریع — شارژ و تخلیه',
    xp:40,
    quote:'«خازن مثل یک باتری کوچک و بسیار سریع است: وقتی به باتری وصل شود، بار الکتریکی روی دو صفحه‌اش جمع می‌شود (شارژ)، و وقتی به مصرف‌کننده وصل شود، همه‌ی آن را یک‌جا پس می‌دهد (تخلیه). خازن بزرگ‌تر بار بیشتری نگه می‌دارد.»',
    desc:'خازن دو صفحه‌ی فلزی نزدیک به هم دارد که بینشان عایق است. باتری بار را روی صفحه‌ها می‌ریزد تا خازن پر شود. بعد اگر آن را از باتری جدا کنی و به یک LED وصل کنی، LED تا وقتی بار تمام نشده روشن می‌ماند و کم‌کم خاموش می‌شود.\n\nبه همین دلیل در مدارها از خازن برای نگه‌داشتن برق در لحظه‌های کوتاه و صاف‌کردن ولتاژ استفاده می‌کنند.',
    steps:[
      'دکمه‌ی «شارژ» را بزن و ببین خازن کم‌کم پر می‌شود (اولش سریع‌تر، آخرش کندتر).',
      'صبر کن تا خازن کاملاً پر شود.',
      'حالا «تخلیه» را بزن تا خازن به LED وصل شود.',
      'ببین LED روشن می‌شود و با خالی‌شدن خازن کم‌نور و خاموش می‌شود؛ بعدش مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'transistor', icon:'🎛️', title:'ترانزیستور', sub:'کلید الکترونیکی — ۵ LED را با یک پین روشن کن',
    xp:50,
    quote:'«ترانزیستور مثل یک کلید برقی است: یک جریان خیلی کوچک روی پایه‌ی کنترل (Base) می‌گذاری و یک جریان بسیار بزرگ‌تر از کلکتور به امیتر رد می‌شود. پین‌های میکروکنترلر فقط حدود ۲۰ میلی‌آمپر می‌دهند، پس ترانزیستور کمک می‌کند چند LED یا حتی موتور را همزمان کنترل کنند.»',
    desc:'هر LED معمولی حدود ۲۰ میلی‌آمپر می‌کشد (هر کدام با مقاومت ۲۲۰Ω خودش). پین میکروکنترلر هم فقط حدود ۲۰ میلی‌آمپر می‌دهد، یعنی مستقیم فقط یک LED. ترانزیستور ساده‌ی BC547 تا حدود ۱۰۰ میلی‌آمپر، یعنی همین ۵ تا LED را رد می‌کند.\n\nروی بردبورد زیر ۵ تا LED از اول سر جایشان است (روی هم ۱۰۰ میلی‌آمپر). در حالت ترانزیستور: پایه‌ی Collector (C) به LEDها، Emitter (E) به منفی باتری و Base (B) از طریق مقاومت ۱kΩ به پین وصل می‌شود. اول مستقیم از پین امتحان کن، بعد با ترانزیستور.',
    steps:[
      'اول حالت «مستقیم از پین» را نگه دار و سیگنال را روشن کن؛ ببین هر ۵ LED خیلی کم‌نور می‌شوند و پین داغ می‌شود.',
      'حالا «با ترانزیستور» را بزن؛ BC547 روی بردبورد می‌نشیند: C به LEDها، E به منفی و B از طریق مقاومت به پین.',
      'ببین هر ۵ LED با تمام نور روشن می‌شود، چون جریان اصلی از باتری می‌آید نه از پین؛ پین فقط چند میلی‌آمپر به Base می‌دهد.',
      'وقتی با ترانزیستور هر ۵ LED روشن شد، مأموریت خودکار تکمیل می‌شود.'
    ]}
];


/* ----- شبیه‌سازهای بخش الکترونیک ----- */
/* ================= RESISTOR COLOR-CODE MISSION =================
   Interactive right inside the modal now — no more "go to the Lab tab"
   detour. Reuses the exact same widget as the Lab tab's own card via
   ResistorDecoder.mount() (resistor-decoder.js), so the picking/formatting
   logic isn't duplicated between the two places. */
function mountResistorCalcSim(container, { onSuccess, alreadyDone } = {}){
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-controls">
        <div class="sim-hw-note">هدف: مقاومتی با کد رنگی <b>قرمز – قرمز – قهوه‌ای</b> بساز تا مقدارش <b>۲۲۰ Ω</b> شود.</div>
      </div>
      <div class="resistor-decoder-mount" id="questResistorMount"></div>
      <div class="sim-status" id="resistorMissionStatus" data-state="${alreadyDone ? 'success' : 'idle'}">
        ${alreadyDone
          ? '✅ قبلاً این مأموریت را با موفقیت انجام داده‌ای. دوست داری دوباره تمرین کنی؟'
          : '🎨 نوارهای رنگی زیر را طبق راهنما تنظیم کن تا عدد روی صفحه دقیقاً ۲۲۰ Ω شود.'}
      </div>
    </div>
  `;

  const statusEl = container.querySelector('#resistorMissionStatus');
  const mountEl = container.querySelector('#questResistorMount');
  let succeeded = !!alreadyDone;

  // راهنماییِ گفتگویی روی هر دراپ‌داون: با کلیک روی هر کدام از چهار
  // دراپ‌داونِ رنگ (فرض بر این‌که ResistorDecoder هرکدام را با یک تگِ
  // <select> می‌سازد — دقیقاً همان چیزی که خودِ مأموریت هم می‌گوید:
  // «با دراپ‌داون‌های زیر تنظیم کن»)، شوالیه/استادِ اهم بگوید رویِ همان
  // نوار چه رنگی باید بگذاری تا نتیجه ۲۲۰ اهم شود. با delegation روی
  // خودِ ظرفِ mount گوش می‌دهیم، نه روی هر select جداگانه، چون DOM
  // داخلی‌اش را خودِ resistor-decoder.js می‌سازد و ممکن است بعداً دوباره
  // رندر شود؛ index بر اساسِ ترتیبِ ظاهرشدنِ خودِ select ها در DOM است
  // (۰=رقمِ اول، ۱=رقمِ دوم، ۲=ضریب، ۳=تلورانس).
  const BAND_HINTS = [
    'این اولین رقمِ مقاومت رو مشخص می‌کنه — برای ۲۲۰ اهم، رنگِ قرمز (رقمِ ۲) رو انتخاب کن.',
    'این دومین رقمه — این‌م رو قرمز بگذار (رقمِ ۲) تا عددِ پایه بشه ۲۲.',
    'این ضریب (توانِ ده) رو مشخص می‌کنه — قهوه‌ای یعنی ×۱۰، یعنی ۲۲ × ۱۰ = ۲۲۰ اهم.',
    'این فقط تلورانس (خطایِ مجاز) رو نشون می‌ده و روی خودِ عددِ اهم اثری نداره — هر رنگی دوست داری بگذار.'
  ];
  if(mountEl){
    mountEl.addEventListener('mousedown', (e) => {
      if(succeeded) return; // بعدِ از حل‌شدنِ مأموریت، دیگه نیازی به یادآوری نیست
      const sel = e.target.closest ? e.target.closest('select') : null;
      if(!sel) return;
      const allSelects = Array.from(mountEl.querySelectorAll('select'));
      const idx = allSelects.indexOf(sel);
      const hint = BAND_HINTS[idx];
      if(hint) showKnightLine(hint, 'happy', 'knight');
    });
  }

  const widget = ResistorDecoder.mount(mountEl, {
    // Start from the solved combo if it's already done (so re-opening shows
    // the answer), otherwise start somewhere clearly not-yet-220.
    initial: alreadyDone ? { 0:'red', 1:'red', 2:'brown', 3:'gold' } : { 0:'black', 1:'black', 2:'black', 3:'gold' },
    onChange(value){
      if(value === 220){
        statusEl.dataset.state = 'success';
        statusEl.textContent = '✅ درسته! ۲۲۰ اهم دقیقاً همینه — مأموریت تکمیل شد.';
        if(!succeeded){
          succeeded = true;
          onSuccess && onSuccess();
        }
      } else if(!succeeded){
        statusEl.dataset.state = 'idle';
        statusEl.textContent = '🎨 نوارهای رنگی زیر را طبق راهنما تنظیم کن تا عدد روی صفحه دقیقاً ۲۲۰ Ω شود.';
      }
    }
  });

  return { stop(){ widget.destroy(); } };
}

// Backward-compat: resistor-decoder.js's Lab-tab auto-mount calls
// window.onResistorValueChange(ohms) on every band change, so dialing in
// 220 Ω on the Lab tab directly also finishes this mission — even though
// the mission modal above no longer requires a trip there.
window.onResistorValueChange = function(ohms){
  const q = QUESTS.find(x => x.id === 'resistor_calc');
  if(!q || progress[q.id]) return;
  if(ohms === 220){
    completeMission(q, { closeOverlayAfter: null });
  }
};

/* ================= LED واقعی (SVG مشترک بین شبیه‌سازهای الکترونیک) =================
   مختصات محلی: مرکز بدنه (۰،۰)، گنبد به سمت +x، پایه‌ها به سمت −x.
   پایه‌ی بلند (آند) در y=−۱۰ و پایه‌ی کوتاه (کاتد: سمت لبه‌ی تخت و سندانِ بزرگ‌تر) در y=+۱۰.
   p = پیشوندِ یکتا برای id گرادیان‌ها در هر SVG. */
function ledRealDefs(p){
  const g = (id, a, b, c) => `<radialGradient id="${p}${id}" cx="62%" cy="38%" r="75%"><stop offset="0%" stop-color="${a}"/><stop offset="55%" stop-color="${b}"/><stop offset="100%" stop-color="${c}"/></radialGradient>`;
  return g('Off', '#e3b9b3', '#a65a53', '#63302b') + g('On', '#fff3ef', '#ff5a4a', '#b3261e');
}
function ledRealSvg(p){
  const body = 'M-9,-20 H6 A20,20 0 0 1 6,20 H-9 Z';
  return `<circle class="lr-glow" cx="6" cy="0" r="34" fill="#ff4d3d" opacity="0"/>
    <g stroke="#b9bfc9" stroke-width="3" stroke-linecap="round"><line x1="-14" y1="-10" x2="-64" y2="-10"/><line x1="-14" y1="10" x2="-44" y2="10"/></g>
    <path d="${body}" fill="url(#${p}Off)" stroke="#7a403a" stroke-width="1"/>
    <g stroke="#8c93a0" stroke-width="3"><line x1="-9" y1="-10" x2="-1" y2="-10"/><line x1="-9" y1="10" x2="0" y2="10"/></g>
    <polygon points="-1,3 6,6 6,14 -1,17" fill="#9aa1ad" stroke="#6b7280" stroke-width=".6"/>
    <rect x="1" y="8" width="3" height="4" fill="#d9b94a"/>
    <path d="M2.5,8 Q9,-6 -1,-10" fill="none" stroke="#d9b94a" stroke-width=".9"/>
    <path class="lr-on" d="${body}" fill="url(#${p}On)" opacity="0"/>
    <path d="M-14,-24 H-9 V20 H-12 L-14,17 Z" fill="#d8dce3" stroke="#8a929e" stroke-width=".8"/>
    <path d="M3.4,-14.8 A15,15 0 0 1 16.6,-10.6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
}
function ledRealSet(g, level){
  g.querySelector('.lr-on').setAttribute('opacity', level.toFixed(2));
  g.querySelector('.lr-glow').setAttribute('opacity', (level * 0.5).toFixed(2));
}

/* ================= ELECTRONICS: LED (دیود نوری) =================
   LED برعکس وصل شده؛ با برگرداندنش آند به سمت مثبت می‌رود و روشن می‌شود. */
function mountLedDiodeSim(container, { onSuccess, alreadyDone } = {}){
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note">هدف: LED الان برعکس وصل شده و روشن نمی‌شود. جهتش را درست کن تا جریان از آند (+، پایه‌ی بلند) به کاتد (−، پایه‌ی کوتاه) برود.</div>
      <svg class="ls-svg" viewBox="0 0 320 130" direction="ltr" role="img" aria-label="مدار باتری، مقاومت و LED">
        <defs>${ledRealDefs('ld')}</defs>
        <g id="ldWires" fill="none" stroke="#667" stroke-width="3"><path d="M48 66 H80"/><path d="M130 66 H200"/><path d="M48 86 H200"/></g>
        <rect x="14" y="56" width="34" height="40" rx="5" fill="#2a2f3a" stroke="#667"/>
        <text x="31" y="71" font-size="14" fill="#cfc8b6" text-anchor="middle">+</text><text x="31" y="90" font-size="14" fill="#cfc8b6" text-anchor="middle">−</text>
        <text x="31" y="112" font-size="11" fill="#cfc8b6" text-anchor="middle">باتری</text>
        <rect x="80" y="58" width="50" height="16" rx="3" fill="#c9b48a" stroke="#8a7550"/>
        <rect x="92" y="58" width="5" height="16" fill="#c0392b"/><rect x="102" y="58" width="5" height="16" fill="#c0392b"/><rect x="112" y="58" width="5" height="16" fill="#6b4226"/>
        <text x="105" y="52" font-size="11" fill="#cfc8b6" text-anchor="middle">۲۲۰Ω</text>
        <g id="ldLed" transform="translate(250 76)">${ledRealSvg('ld')}</g>
        <text id="ldTop" x="175" y="57" font-size="10" fill="#cfc8b6" text-anchor="middle"></text>
        <text id="ldBot" x="175" y="104" font-size="10" fill="#cfc8b6" text-anchor="middle"></text>
      </svg>
      <div class="ll-row"><button type="button" class="sim-btn sim-btn-run" id="ldFlip">🔄 LED را برگردان</button></div>
      <div class="sim-status" id="ldStatus" data-state="idle"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const led = q('#ldLed'), wires = q('#ldWires'), st = q('#ldStatus');
  let flipped = !alreadyDone, succeeded = !!alreadyDone;
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };
  function refresh(){
    const on = !flipped;
    led.setAttribute('transform', `translate(250 76) scale(1 ${flipped ? -1 : 1})`);
    ledRealSet(led, on ? 1 : 0);
    wires.setAttribute('stroke', on ? '#e8b64a' : '#667');
    q('#ldTop').textContent = flipped ? 'کاتد (−) — پایه‌ی کوتاه' : 'آند (+) — پایه‌ی بلند';
    q('#ldBot').textContent = flipped ? 'آند (+) — پایه‌ی بلند' : 'کاتد (−) — پایه‌ی کوتاه';
    if(on){
      say('success', '✅ روشن شد! حالا آند (پایه‌ی بلند) سمتِ مثبت باتری است و جریان از LED رد می‌شود.');
      if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
    } else {
      say('error', '⚠️ LED خاموش است: پایه‌ی کاتد (−، کوتاه) سمتِ مثبت باتری است و دیود جلوی جریان را می‌گیرد. جهتش را برگردان.');
    }
  }
  q('#ldFlip').addEventListener('click', () => { flipped = !flipped; refresh(); });
  refresh();
  return { stop(){} };
}

/* ================= ELECTRONICS: خازن =================
   شارژ تا ته، بعد تخلیه روی LED؛ LED کم‌کم خاموش می‌شود. */
function mountCapacitorSim(container, { onSuccess, alreadyDone } = {}){
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note">هدف: خازن را تا ته شارژ کن، بعد به LED وصلش کن و ببین انرژیِ ذخیره‌شده LED را روشن می‌کند و کم‌کم تمام می‌شود.</div>
      <svg class="ls-svg" viewBox="0 0 320 185" direction="ltr" role="img" aria-label="باتری، خازن و LED">
        <defs>${ledRealDefs('cp')}</defs>
        <rect x="14" y="52" width="34" height="56" rx="5" fill="#2a2f3a" stroke="#667"/>
        <text x="31" y="72" font-size="15" fill="#cfc8b6" text-anchor="middle">+</text><text x="31" y="100" font-size="15" fill="#cfc8b6" text-anchor="middle">−</text>
        <text x="31" y="124" font-size="11" fill="#cfc8b6" text-anchor="middle">باتری</text>
        <path id="cpIn" d="M48 80 H130" fill="none" stroke="#667" stroke-width="3"/>
        <path id="cpOut" d="M190 80 H203 V70 H216" fill="none" stroke="#667" stroke-width="3"/>
        <path id="cpRet" d="M240 90 V172 H134 V124" fill="none" stroke="#667" stroke-width="3"/>
        <rect x="130" y="36" width="8" height="88" fill="#c0c6d0"/><rect x="182" y="36" width="8" height="88" fill="#c0c6d0"/>
        <rect id="cpFill" x="138" y="124" width="44" height="0" fill="#57d8a3"/>
        <text x="160" y="140" font-size="11" fill="#cfc8b6" text-anchor="middle">خازن</text>
        <text id="cpPct" x="160" y="156" font-size="12" fill="#57d8a3" text-anchor="middle"></text>
        <g id="cpLed" transform="translate(280 80)">${ledRealSvg('cp')}</g>
        <text x="292" y="126" font-size="11" fill="#cfc8b6" text-anchor="middle">LED</text>
      </svg>
      <div class="ll-row">
        <button type="button" class="sim-btn sim-btn-run" data-a="charge">🔋 شارژ کن</button>
        <button type="button" class="sim-btn sim-btn-run" data-a="discharge">💡 تخلیه کن (وصل به LED)</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-a="reset">↺ از اول</button>
      </div>
      <div class="sim-status" id="cpStatus" data-state="idle"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const fill = q('#cpFill'), pct = q('#cpPct'), wIn = q('#cpIn'), wOut = q('#cpOut'), wRet = q('#cpRet'), led = q('#cpLed'), st = q('#cpStatus');
  let v = 0, mode = 'idle', fullSeen = false, succeeded = !!alreadyDone, raf = 0, last = null;
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };

  function paint(){
    const h = 88 * v;
    fill.setAttribute('y', (124 - h).toFixed(1)); fill.setAttribute('height', h.toFixed(1));
    pct.textContent = toFa(Math.round(v * 100)) + '٪';
    wIn.setAttribute('stroke', mode === 'charge' ? '#57d8a3' : '#667');
    const dis = mode === 'discharge' && v > 0.03;
    wOut.setAttribute('stroke', dis ? '#ffd25a' : '#667');
    wRet.setAttribute('stroke', dis ? '#ffd25a' : '#667');
    ledRealSet(led, dis ? Math.sqrt(v) : 0);
    if(mode === 'charge') say('running', `🔋 در حال شارژ… ${toFa(Math.round(v * 100))}٪`);
    else if(mode === 'discharge') say('running', '💡 خازن دارد انرژی‌اش را به LED می‌دهد و کم‌کم خالی می‌شود…');
    else if(succeeded && v <= 0) say('success', '✅ دیدی؟ خازن بار را نگه داشت و یک‌جا پس داد؛ LED با خالی‌شدنش کم‌کم خاموش شد. دوباره امتحان کنی «شارژ» را بزن.');
    else if(v >= 1) say('idle', '🔋 خازن پر است. حالا «تخلیه» را بزن تا به LED وصل شود.');
    else if(v <= 0) say('idle', '⚪ خازن خالی است. «شارژ» را بزن.');
    else say('idle', `خازن ${toFa(Math.round(v * 100))}٪ پر است. شارژ را ادامه بده یا تخلیه کن.`);
  }
  function frame(ts){
    const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts;
    if(mode === 'charge'){
      v += (1 - v) * Math.min(1, dt * 1.8);
      if(v >= 0.985){ v = 1; mode = 'idle'; fullSeen = true; }
    } else if(mode === 'discharge'){
      v -= (v * 0.9 + 0.04) * dt;
      if(fullSeen && v < 0.5 && !succeeded){ succeeded = true; onSuccess && onSuccess(); }
      if(v <= 0.01){ v = 0; mode = 'idle'; }
    }
    paint();
    raf = requestAnimationFrame(frame);
  }
  container.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button[data-a]') : null;
    if(!b) return;
    if(b.dataset.a === 'charge' && v < 1) mode = 'charge';
    else if(b.dataset.a === 'discharge' && v > 0.01) mode = 'discharge';
    else if(b.dataset.a === 'reset'){ v = 0; mode = 'idle'; fullSeen = false; }
    paint();
  });
  paint();
  raf = requestAnimationFrame(frame);
  return { stop(){ cancelAnimationFrame(raf); } };
}

/* ================= ELECTRONICS: ترانزیستور (بردبورد) =================
   ۵ تا LED (هرکدام با مقاومت ۲۲۰Ω) روی بردبورد، کاتدها از طریق یک باس به Collector.
   BC547 (از روبه‌رو، سمت تخت): C – B – E → C به LEDها، E به منفی، B از طریق ۱kΩ به پین.
   حالت «مستقیم از پین»: ترانزیستور برداشته می‌شود و جریان LEDها از خود پین می‌گذرد. */
function mountTransistorSim(container, { onSuccess, alreadyDone } = {}){
  const N = 5, LED_MA = 20, PIN_MA = 20, need = N * LED_MA, BASE_TXT = '۲٫۶';
  const X = i => 20 + 12 * i;
  const TOP = [92, 102, 112, 122, 132], BOT = [158, 168, 178, 188, 198];
  const dots = (cols, ys) => cols.flatMap(i => ys.map(y => `<circle cx="${X(i)}" cy="${y}" r="1.8"/>`)).join('');
  const cols = Array.from({ length: 24 }, (_, i) => i);
  const rail = cols.filter(i => i % 6 !== 5);
  const wire = (g, c, d, w = 2.2) => `<path class="trW" data-g="${g}" data-c="${c}" d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const res = (x, bands) => `<line x1="${x}" y1="122" x2="${x}" y2="158" stroke="#b9bfc9" stroke-width="2" stroke-linecap="round"/>
    <rect x="${x - 4}" y="133" width="8" height="16" rx="2" fill="#c9b48a" stroke="#8a7550"/>
    ${bands.map((c, k) => `<rect x="${x - 4}" y="${135 + k * 4}" width="8" height="2" fill="${c}"/>`).join('')}`;

  let branches = '';
  for(let i = 0; i < N; i++){
    const a = 1 + 3 * i, xa = X(a), xk = X(a + 1), xr = X(a - 1);
    branches += wire('m', '#c0392b', `M${xr} 17 Q${xr} 112 ${xa} 112`)
      + res(xk, ['#c0392b', '#c0392b', '#6b4226', '#d4af37'])
      + `<line x1="${xk}" y1="80" x2="${xk}" y2="92" stroke="#b9bfc9" stroke-width="1.8" stroke-linecap="round"/>`
      + `<g class="trLed" transform="translate(${xa + 6} 53.6) rotate(-90) scale(.6)">${ledRealSvg('tr')}</g>`;
    if(i < N - 1) branches += wire('m', '#d9812b', `M${xk} 168 Q${xk + 18} 150 ${X(a + 4)} 168`);
  }
  const xc = X(18), xb = X(19), xe = X(20);
  branches += wire('m', '#d9812b', `M${X(5 * 3 - 1)} 168 Q${(X(14) + xc) / 2} 150 ${xc} 168`);

  /* برد Arduino Uno R3 از بالا. مختصات داخلی بر حسب mil است (برد ۲٫۷″×۲٫۱″، جهت استاندارد: USB سمت چپ)؛
     کل برد ۱۸۰° چرخیده تا سوکت‌های دیجیتال (D0–D13) رو به بردبورد باشد. S = پیکسل به ازای هر mil. */
  const S = 0.045, UL = 180, UT = -53;
  const UNO_FILL = '#0b7f8a', UNO_LINE = '#075760', UNO_HOT = '#8a2e22', UNO_HOT_LINE = '#ff5a4f';
  const r2 = v => +v.toFixed(2);
  const uX = m => r2(UL + (2700 - m) * S), uY = m => r2(UT + (2100 - m) * S);
  const d2x = uX(2400), gndx = uX(1100), pinY = uY(100);
  const sock = (x0, n, y) => `<rect x="${x0 - 50}" y="${y - 65}" width="${n * 100}" height="130" rx="12" fill="#171a1f" stroke="#000" stroke-width="10"/>`
    + Array.from({ length: n }, (_, k) => `<rect x="${x0 + 100 * k - 26}" y="${y - 26}" width="52" height="52" fill="#4b525c"/>`).join('');
  const silk = (x, y, t, px, o = {}) => `<text ${o.id ? `id="${o.id}" ` : ''}transform="translate(${x} ${y}) rotate(180)" font-size="${r2(px / S)}" text-anchor="${o.anchor || 'middle'}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="${o.fill || '#f4fbfb'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${t}</text>`;
  const logo = (cx, cy) => `<g fill="none" stroke="#f4fbfb" stroke-linecap="round"><circle cx="${cx - 105}" cy="${cy}" r="92" stroke-width="30"/><circle cx="${cx + 105}" cy="${cy}" r="92" stroke-width="30"/><path d="M${cx - 150} ${cy}h90M${cx + 60} ${cy}h90M${cx + 105} ${cy - 45}v90" stroke-width="22"/></g>`;
  const uno = `<g transform="translate(${r2(UL + 2700 * S)} ${r2(UT + 2100 * S)}) rotate(180) scale(${S})">
          <rect id="trPin" x="0" y="0" width="2700" height="2100" rx="70" fill="${UNO_FILL}" stroke="${UNO_LINE}" stroke-width="30"/>
          ${[[550, 100], [600, 2000], [2600, 300], [2600, 1400]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="88" fill="#c9a640"/><circle cx="${x}" cy="${y}" r="55" fill="#0a1418"/>`).join('')}
          <rect x="2440" y="750" width="200" height="300" rx="14" fill="#171a1f"/>
          <g fill="#d4af37">${[2490, 2590].flatMap(x => [800, 900, 1000].map(y => `<rect x="${x - 28}" y="${y - 28}" width="56" height="56"/>`)).join('')}</g>
          <rect x="630" y="780" width="340" height="340" fill="none" stroke="#bfc6cd" stroke-width="42" stroke-dasharray="26 22"/>
          <rect x="650" y="800" width="300" height="300" rx="14" fill="#15171b"/><circle cx="700" cy="850" r="24" fill="#7d858e"/>
          <rect x="700" y="1290" width="260" height="150" rx="75" fill="#d3d9df" stroke="#8b949e" stroke-width="20"/>
          ${[820, 1100].map(x => `<circle cx="${x}" cy="1760" r="120" fill="#cfd5db" stroke="#8b949e" stroke-width="20"/><circle cx="${x}" cy="1760" r="62" fill="#aeb6bf"/>`).join('')}
          <g fill="#b9c0c8">${Array.from({ length: 14 }, (_, k) => `<rect x="${1069 + 93 * k}" y="1160" width="42" height="80"/><rect x="${1069 + 93 * k}" y="1540" width="42" height="80"/>`).join('')}</g>
          <rect x="1050" y="1230" width="1350" height="320" rx="24" fill="#16181d" stroke="#000" stroke-width="16"/>
          <path d="M1050 1335a55 55 0 0 1 0 110z" fill="#2c3037"/>
          ${silk(1725, 1415, 'ATMEGA328P', 5.5, { fill: '#aab3bd' })}
          ${[['#e9b949', 1000], ['#e9b949', 1110], ['#e9b949', 1220], ['#4ee08a', 1330]].map(([c, x]) => `<rect x="${x}" y="480" width="90" height="55" rx="8" fill="${c}"/>`).join('')}
          <rect x="640" y="235" width="220" height="220" rx="24" fill="#b7bec6" stroke="#6d757e" stroke-width="18"/>
          <circle cx="750" cy="345" r="72" fill="#c93030" stroke="#7a1616" stroke-width="14"/>
          ${sock(1900, 8, 100)}${sock(800, 10, 100)}${sock(1000, 8, 2000)}${sock(1900, 6, 2000)}
          <rect x="-270" y="180" width="690" height="480" rx="30" fill="#c9d0d7" stroke="#8b949e" stroke-width="22"/>
          <rect x="-270" y="260" width="140" height="320" rx="14" fill="#7d8791"/>
          <rect x="-80" y="1300" width="640" height="440" rx="36" fill="#1b1d22" stroke="#000" stroke-width="18"/>
          <rect x="-80" y="1400" width="190" height="240" rx="18" fill="#454b54"/>
          ${logo(1700, 620)}
          ${silk(1700, 850, 'ARDUINO', 5.8, { ls: 8 })}
          ${silk(1700, 1090, 'UNO', 10.4)}
          ${silk(2478, 300, 'D2', 6.5, { id: 'trPinT', anchor: 'start', fill: '#fff' })}
          ${silk(1100, 300, 'GND', 6.5, { fill: '#fff' })}
        </g>`;

  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note">هدف: روی بردبورد ۵ تا LED داریم که روی هم <b>۱۰۰ میلی‌آمپر</b> می‌کشند (هرکدام ۲۰). اول جریانشان را مستقیم از پین بگیر، بعد با ترانزیستور BC547 امتحان کن. پین فقط حدود ۲۰ میلی‌آمپر می‌دهد.</div>
      <svg class="ls-svg" viewBox="0 -58 316 340" direction="ltr" role="img" aria-label="آردوینو اونو و بردبورد با پنج LED، مقاومت و ترانزیستور BC547">
        <defs>${ledRealDefs('tr')}</defs>
        <g transform="translate(0 50)">
        <rect x="4" y="4" width="308" height="210" rx="8" fill="#e6e0d1" stroke="#b8b09c"/>
        <rect x="10" y="138" width="296" height="14" fill="#cfc8b6"/>
        <line x1="14" y1="10" x2="302" y2="10" stroke="#c0392b" stroke-width="1.5"/><line x1="14" y1="34" x2="302" y2="34" stroke="#2b5fa8" stroke-width="1.5"/>
        <text x="8" y="21" font-size="10" fill="#c0392b" font-weight="bold">+</text><text x="8" y="31" font-size="10" fill="#2b5fa8" font-weight="bold">−</text>
        <g fill="#7d7766">${dots(rail, [17, 27])}${dots(cols, TOP)}${dots(cols, BOT)}</g>
        ${branches}
        <g data-v="tr">
          ${wire('m', '#2b2b2b', `M${xe} 158 V27`)}
          ${res(xb, ['#6b4226', '#111', '#c0392b', '#d4af37'])}
          <g stroke="#b9bfc9" stroke-width="2" stroke-linecap="round"><line x1="${xc}" y1="190" x2="${xc}" y2="198"/><line x1="${xb}" y1="190" x2="${xb}" y2="198"/><line x1="${xe}" y1="190" x2="${xe}" y2="198"/></g>
          <path d="M${xc} 190 V182 Q${xc} 170 ${xb} 170 Q${xe} 170 ${xe} 182 V190 Z" fill="#1c1e24" stroke="#4a515e"/>
          <text x="${xb}" y="185" font-size="6" fill="#cfd4dc" text-anchor="middle">BC547</text>
          <g font-size="8" fill="#4a4538" text-anchor="middle" font-weight="bold"><text x="${xc}" y="209">C</text><text x="${xb}" y="209">B</text><text x="${xe}" y="209">E</text></g>
        </g>
        <text x="158" y="226" font-size="9" fill="#cfc8b6" text-anchor="middle">ریل بالا به باتری ۵ ولت وصل است — هر LED مقاومت ۲۲۰Ω خودش را دارد</text>
        </g>
        ${uno}
        <g data-v="tr">${wire('s', '#2f9e78', `M${d2x} ${pinY} C${d2x} 85 ${xb} 90 ${xb} 142`)}</g>
        <g data-v="pin">${wire('m', '#d9812b', `M${d2x} ${pinY} C${d2x} 130 ${xc} 100 ${xc} 208`)}</g>
        ${wire('n', '#2b2b2b', `M${gndx} ${pinY} C${gndx} 58 ${X(21)} 56 ${X(21)} 77`)}
      </svg>
      <div class="ir-tabs">
        <button type="button" class="sim-btn sim-btn-run" data-m="pin">📌 مستقیم از پین</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-m="tr">🎛️ با ترانزیستور</button>
      </div>
      <div class="ll-row"><button type="button" class="sim-btn sim-btn-run" id="trSig">⚡ سیگنال پین: خاموش</button></div>
      <div class="ls-read"><span>جریان لازم از پین: <b class="mono" id="trNeed"></b></span><span>حد پین: <b class="mono">${toFa(PIN_MA)} mA</b></span><span>جریان LEDها: <b class="mono" id="trLedI"></b></span></div>
      <div class="ir-meter"><div class="ir-meter-fill" id="trMeter"></div></div>
      <div class="sim-status" id="trStatus" data-state="idle"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const ledEls = Array.from(container.querySelectorAll('.trLed'));
  const st = q('#trStatus'), meter = q('#trMeter');
  let mode = 'pin', on = false, succeeded = !!alreadyDone, lastHint = '';
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };
  const hint = (key, text) => { if(key !== lastHint){ lastHint = key; showKnightLine(text, 'happy', 'knight'); } };

  function refresh(){
    const tr = mode === 'tr', hot = on && !tr;
    const pinNeed = tr ? 2.6 : need, ledI = !on ? 0 : tr ? need : PIN_MA;
    q('#trNeed').textContent = on ? (tr ? BASE_TXT : toFa(need)) + ' mA' : toFa(0) + ' mA';
    q('#trLedI').textContent = toFa(ledI) + ' mA';
    q('#trSig').textContent = on ? '⚡ سیگنال پین: روشن' : '⚡ سیگنال پین: خاموش';
    container.querySelectorAll('[data-v]').forEach(g => { g.style.display = g.dataset.v === mode ? '' : 'none'; });
    container.querySelectorAll('[data-m]').forEach(b => {
      const act = b.dataset.m === mode;
      b.classList.toggle('sim-btn-run', act); b.classList.toggle('sim-btn-ghost', !act);
    });
    container.querySelectorAll('.trW').forEach(w => {
      const lit = on && (w.dataset.g === 'm' || (w.dataset.g === 's' && tr));
      w.setAttribute('stroke', lit ? (w.dataset.g === 's' ? '#57d8a3' : hot ? '#ff7a4f' : '#ffd25a') : w.dataset.c);
    });
    ledEls.forEach(g => ledRealSet(g, !on ? 0 : tr ? 1 : Math.max(0.12, PIN_MA / need)));
    q('#trPin').setAttribute('fill', hot ? UNO_HOT : UNO_FILL);
    q('#trPin').setAttribute('stroke', hot ? UNO_HOT_LINE : UNO_LINE);
    q('#trPinT').textContent = hot ? 'D2 داغ!' : 'D2';
    meter.style.width = (on ? Math.min(100, pinNeed / PIN_MA * 100) : 0) + '%';
    meter.style.background = hot ? '#ff5a4f' : '';

    if(!on){ say('idle', '⚪ سیگنال خاموش است. دکمه‌ی سیگنال را روشن کن.'); return; }
    if(hot){
      say('error', `⚠️ هر ${toFa(N)} LED از خود پین تغذیه می‌شوند: ${toFa(need)} میلی‌آمپر لازم است ولی پین فقط ${toFa(PIN_MA)} می‌دهد؛ برای همین همه خیلی کم‌نورند و پین داغ می‌شود. حالا «با ترانزیستور» را امتحان کن.`);
      hint('overPin', 'پین مستقیم فقط یک LED را درست روشن می‌کند. ترانزیستور را بین بگذار: پین فقط کلید را می‌زند و جریان اصلی از باتری می‌آید.');
      return;
    }
    say('success', `✅ هر ${toFa(N)} LED با تمام نور روشن شد! پین فقط حدود ${BASE_TXT} میلی‌آمپر از طریق مقاومت به Base داد و ترانزیستور ${toFa(need)} میلی‌آمپر را از باتری، از Collector به Emitter، رد کرد.`);
    if(!succeeded){ succeeded = true; onSuccess && onSuccess(); }
  }
  q('#trSig').addEventListener('click', () => { on = !on; refresh(); });
  container.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button[data-m]') : null;
    if(!b) return;
    mode = b.dataset.m; refresh();
  });
  refresh();
  if(alreadyDone) say('success', '✅ قبلاً این مأموریت را انجام داده‌ای. دوست داری دوباره امتحان کنی؟ حالت و سیگنال را عوض کن.');
  return { stop(){} };
}

function mountVoltCurrentSim(container, { onSuccess, alreadyDone } = {}){
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-board-wrap">
        <svg class="ef-svg" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="efBattClip"><rect x="14" y="14" width="50" height="250" rx="10"/></clipPath>
          <path d="M64,244 H300 V34 H64" class="ef-wire" fill="none"/>
          <g clip-path="url(#efBattClip)">
            <rect x="14" y="14" width="50" height="125" class="ef-batt-plus"/>
            <rect x="14" y="139" width="50" height="125" class="ef-batt-minus"/>
            <rect x="14" y="135" width="50" height="8" class="ef-batt-divider"/>
          </g>
          <rect x="14" y="14" width="50" height="250" rx="10" class="ef-batt-outline" fill="none"/>
          <text x="39" y="88" text-anchor="middle" class="ef-batt-label ef-batt-label-plus">+</text>
          <text x="39" y="218" text-anchor="middle" class="ef-batt-label ef-batt-label-minus">−</text>

          <g transform="translate(160,34)">
            <rect x="-30" y="-14" width="60" height="28" rx="4" class="ef-valve-housing"/>
            <rect id="efFlapTop" x="-26" y="-13" width="52" height="14" class="ef-valve-flap"/>
            <rect id="efFlapBottom" x="-26" y="-1" width="52" height="14" class="ef-valve-flap"/>
          </g>

          <g id="efLedGroup" class="sim-led-group" transform="translate(300,140)">
            <line class="sim-led-ray" x1="-16" y1="-16" x2="-25" y2="-25"/>
            <line class="sim-led-ray" x1="16" y1="-16" x2="25" y2="-25"/>
            <line class="sim-led-ray" x1="0" y1="-22" x2="0" y2="-33"/>
            <circle r="15" class="sim-led-bulb"/>
          </g>
          <text id="efBurstMark" x="300" y="140" text-anchor="middle" dominant-baseline="middle" class="ef-burn-mark" opacity="0">💥</text>

          <circle class="ef-electron-dot" r="6"/>
          <circle class="ef-electron-dot" r="6"/>
          <circle class="ef-electron-dot" r="6"/>
          <circle class="ef-electron-dot" r="6"/>
        </svg>
      </div>
      <div class="sim-controls">
        <label class="sim-hw-note" for="efRange">میزان بازبودن مسیر (مقاومت متغیر) — اول کاملاً بسته است، کم‌کم بازش کن</label>
        <input id="efRange" class="sim-pot-range" type="range" min="0" max="100" value="0">
      </div>
      <div class="sim-status" id="efStatus" data-state="idle">🔒 مسیر کاملاً بسته است — هیچ الکترونی نمی‌تواند رد شود.</div>
      <button type="button" class="complete-btn" id="efReadBtn" ${alreadyDone ? 'disabled' : ''}>${alreadyDone ? 'قبلاً تکمیل شده ✓' : 'مطالعه کردم ✓'}</button>
    </div>
  `;

  const svgEl     = container.querySelector('.ef-svg');
  const flapTop   = container.querySelector('#efFlapTop');
  const flapBot   = container.querySelector('#efFlapBottom');
  const ledGroup  = container.querySelector('#efLedGroup');
  const burstMark = container.querySelector('#efBurstMark');
  const range     = container.querySelector('#efRange');
  const statusEl  = container.querySelector('#efStatus');
  const readBtn   = container.querySelector('#efReadBtn');
  const dots      = Array.from(container.querySelectorAll('.ef-electron-dot'));

  // Loop path: bottom-left → bottom-right → top-right → top-left (battery sits on the left edge).
  const P0 = {x:64,y:244}, P1 = {x:300,y:244}, P2 = {x:300,y:34}, P3 = {x:64,y:34};
  const segs = [
    {a:P0, b:P1, len:P1.x-P0.x},
    {a:P1, b:P2, len:P1.y-P2.y},
    {a:P2, b:P3, len:P2.x-P3.x}
  ];
  const totalLen = segs.reduce((s,x)=>s+x.len,0);
  function pointAt(t){
    let d = t*totalLen;
    for(const s of segs){
      if(d <= s.len){
        const r = s.len===0 ? 0 : d/s.len;
        return { x: s.a.x+(s.b.x-s.a.x)*r, y: s.a.y+(s.b.y-s.a.y)*r };
      }
      d -= s.len;
    }
    return P3;
  }
  const electronT = dots.map((_, i) => i/dots.length);

  const V = 5, R_MIN = 8, R_MAX = 4000; // stylised, not real-world-accurate values
  function currentFromOpenness(openness){
    if(openness <= 0) return 0; // fully closed → no path → zero current
    const r = R_MIN + (1-openness)*(R_MAX-R_MIN);
    return (V/r) * 1000; // mA
  }
  function opennessForCurrent(mA){
    const r = (V*1000)/mA;
    return (R_MAX-r)/(R_MAX-R_MIN);
  }
  // مقدار پایین (سمت چپ) = بسته، مقدار بالا (سمت راست) = کاملاً باز.
  function valueForCurrent(mA){
    return opennessForCurrent(mA) * 100;
  }
  function zoneColor(mA){
    if(mA > 20) return 'var(--danger)';
    if(mA >= 2) return 'var(--trace-bright)';
    return '#3f7cc4';
  }

  // رنگ‌بندی محدوده‌ی اسلایدر (بر حسب value، از چپ به راست): آبی (مسیر بسته) → سبز (بازه‌ی درست) → قرمز (سوختن LED)
  range.style.setProperty('--zone-green', valueForCurrent(2).toFixed(1) + '%');
  range.style.setProperty('--zone-red', valueForCurrent(20).toFixed(1) + '%');

  let succeeded = !!alreadyDone;
  let currentMA = 0;
  let burnFlashUntil = 0;

  function updateFromSlider(){
    const openness = Number(range.value)/100;
    const mA = currentFromOpenness(openness);

    const flapH = (1-openness) * 14;
    flapTop.setAttribute('height', flapH.toFixed(2));
    flapBot.setAttribute('y', (13-flapH).toFixed(2));
    flapBot.setAttribute('height', flapH.toFixed(2));

    ledGroup.classList.remove('is-on');
    burstMark.setAttribute('opacity', '0');
    range.style.setProperty('--knob-color', zoneColor(mA));

    if(mA <= 0){
      statusEl.dataset.state = 'idle';
      statusEl.textContent = '🔒 مسیر کاملاً بسته است — هیچ الکترونی نمی‌تواند رد شود.';
    } else if(mA < 2){
      statusEl.dataset.state = 'idle';
      statusEl.textContent = '🕯️ جریان خیلی کم است — کمی بیشتر باز کن تا LED روشن شود.';
    } else if(mA <= 20){
      ledGroup.classList.add('is-on');
      ledGroup.style.setProperty('--sim-led-ratio', Math.min(1, (mA-2)/18).toFixed(2));
      statusEl.dataset.state = 'success';
      statusEl.textContent = `✅ عالی! جریان ${mA.toFixed(1)} میلی‌آمپر — LED روشن شد.`;
      if(!succeeded){
        succeeded = true;
        readBtn.disabled = true;
        readBtn.textContent = 'قبلاً تکمیل شده ✓';
        onSuccess && onSuccess();
      }
    } else {
      statusEl.dataset.state = 'error';
      statusEl.textContent = `🔥 جریان ${mA.toFixed(0)} میلی‌آمپر — خیلی زیاد است! LED سوخت، کمی مسیر را ببند.`;
      burstMark.setAttribute('opacity', '1');
      burnFlashUntil = performance.now() + 260;
    }
    return mA;
  }

  // مأموریت اول برای خیلی از کاربران گیج‌کننده بود: اسلایدر پایین‌تر از دید
  // اولیه‌ی موبایل قرار دارد و معلوم نیست باید با آن کار کرد. تا اولین بار که
  // کاربر لمسش می‌کند یک هاله‌ی تپنده دورش می‌کشیم (رجوع به quest.css) تا
  // توجه را مستقیم به آن جلب کند؛ با اولین درگ خودش حذف می‌شود.
  if(!alreadyDone) range.classList.add('attn-highlight');

  function onInput(){
    currentMA = updateFromSlider();
    range.classList.remove('attn-highlight');
  }
  range.addEventListener('input', onInput);

  // برای خیلی از کاربران، همین مأموریت اول با اسلایدر گیج‌کننده بود و همان‌جا
  // متوقف می‌شدند. اسلایدر برای هرکسی که دوست دارد تجربه‌اش کند سر جایش می‌ماند،
  // اما دیگر اجباری نیست: با خواندن توضیح، همین دکمه هم مأموریت را تکمیل می‌کند.
  function onReadClick(){
    if(succeeded) return;
    succeeded = true;
    readBtn.disabled = true;
    readBtn.textContent = 'قبلاً تکمیل شده ✓';
    onSuccess && onSuccess();
  }
  readBtn.addEventListener('click', onReadClick);
  if(alreadyDone) range.value = 40; // openness 0.4 → land in the safe zone instead of showing "closed" again
  currentMA = updateFromSlider();

  let lastTime = performance.now();
  let raf = requestAnimationFrame(function tick(now){
    const dt = Math.min(0.05, (now-lastTime)/1000);
    lastTime = now;
    const speed = Math.min(260, currentMA * 7); // px/s — overcurrent moves electrons dangerously fast
    if(speed > 0 && totalLen > 0){
      const dFrac = (speed*dt)/totalLen;
      electronT.forEach((t, i) => { electronT[i] = (t+dFrac) % 1; });
    }
    dots.forEach((dot, i) => {
      const p = pointAt(electronT[i]);
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
    });
    svgEl.style.filter = now < burnFlashUntil ? 'brightness(1.35)' : '';
    raf = requestAnimationFrame(tick);
  });

  return {
    rangeEl: range,
    stop(){
      cancelAnimationFrame(raf);
      range.removeEventListener('input', onInput);
      readBtn.removeEventListener('click', onReadClick);
    }
  };
}


