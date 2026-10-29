/* ========================================================================
   ARDUINO-BLOCKS.JS — ادیتور بلوکیِ کد آردوینو (مثل اسکرچ)، به فارسی.

   این فایل روی کتابخانه‌ی Blockly (گوگل) سوار می‌شود — همان موتوری که خودِ
   Scratch از آن الهام گرفته و ابزارهای بلوکیِ آردوینو (mBlock, Tinkercad ...)
   هم زیرش همین را دارند. Blockly فقط وقتی کسی واقعاً روی «حالت بلوکی» بزند
   از CDN بارگذاری می‌شود (lazy) تا سرعتِ اولیه‌ی صفحه پایین نیاید.

   نکته‌ی مهمِ معماری: کد متنی (همان چیزی که در textarea است) همیشه منبعِ
   اصلی حقیقت می‌ماند. بلوک‌ها فقط یک «نمایشِ» زنده از همان کد هستند:
     • تبدیل «کد ← بلوک» با استفاده از توکنایزر/پارسرِ خودِ ArduinoLang انجام
       می‌شود (arduino-lang.js) — یعنی دقیقاً همان چیزی را می‌فهمد که موتورِ
       اجرا می‌فهمد.
     • تبدیل «بلوک ← کد» با یک Generator سفارشی (ArduinoGenerator) انجام
       می‌شود که خروجی‌اش دقیقاً همان سینتکسی است که ArduinoLang می‌فهمد.
   اگر کدِ متنیِ فعلی چیزی داشته باشد که هنوز بلوکی برایش نساخته‌ایم (مثل
   یک do-while، یک سوییچ، یا یک عبارتِ خیلی پیچیده)، آن یک دستور را به‌جای
   بلوکِ نوعش، عیناً در یک بلوکِ «کدِ خام» (ard_raw_code) نگه می‌داریم —
   بقیه‌ی کد همچنان به بلوکِ واقعی تبدیل می‌شود. تبدیل فقط وقتی کاملاً
   متوقف می‌شود و یک پیامِ فارسیِ روشن برمی‌گرداند که خودِ کد خطای نحوی
   داشته باشد؛ آن‌جا کاربر باید اول در حالتِ متنی درستش کند.
   ======================================================================== */

const ArduinoBlocks = (() => {
  'use strict';

  /* ------------------------------ 0. بارگذاریِ تنبلِ Blockly ------------------------------ */

  /* آدرسِ خودِ همین فایل (arduino-blocks.js) — برایِ ساختنِ مسیرهایِ محلی
     نسبت‌به همین فایل، مستقل از این‌که سایت رویِ کدام دامنه/مسیر سرو می‌شود.
     باید قبل از CDN تعریف شود چون CDN از رویش ساخته می‌شود. */
  const SELF_SRC = (() => {
    try { return (document.currentScript && document.currentScript.src) || ''; } catch (e) { return ''; }
  })();
  const SELF_DIR = SELF_SRC ? SELF_SRC.replace(/[^\/?#]*([?#].*)?$/, '') : '';

  // فایل‌های خودِ Blockly (core, blocks, پیام‌های fa/en) دیگر از unpkg گرفته
  // نمی‌شوند — کاملاً محلی‌اند. باید این چهار فایل را از
  // node_modules/blockly (پس از npm install blockly) کپی کنی، دقیقاً با
  // همین چیدمان، توی یک پوشه به اسمِ «blockly-lib» کنارِ همین arduino-blocks.js
  // روی سرور:
  //   blockly-lib/blockly_compressed.js   ← از node_modules/blockly/blockly_compressed.js
  //   blockly-lib/blocks_compressed.js    ← از node_modules/blockly/blocks_compressed.js
  //   blockly-lib/msg/fa.js               ← از node_modules/blockly/msg/fa.js
  //   blockly-lib/msg/en.js               ← از node_modules/blockly/msg/en.js
  const CDN = {
    core: SELF_DIR + '../../blockly-lib/blockly_compressed.js',
    blocks: SELF_DIR + '../../blockly-lib/blocks_compressed.js',
    msgFa: SELF_DIR + '../../blockly-lib/msg/fa.js',
    msgEn: SELF_DIR + '../../blockly-lib/msg/en.js'
  };

  // ===== پیش‌واکشیِ موازیِ فایل‌های سنگین (سرعت) =====
  // قبلاً هر فایل با await جدا و پشتِ‌سرِهم گرفته می‌شد (core، بعد blocks،
  // بعد پیام‌ها) — یعنی زمانِ کلِ بارگذاری تقریباً برابرِ جمعِ زمانِ هر
  // درخواستِ شبکه بود. این چهار فایل هیچ وابستگیِ شبکه‌ای به هم ندارند
  // (فقط برایِ *اجرا*شان ترتیب مهم است، نه برایِ *دانلود*شان)، پس همه را
  // همین‌جا، همزمان و بدونِ صبر برایِ یکدیگر، fetch می‌کنیم. تابع‌های
  // loadBlocklyCore/loadBlocklyBuiltinBlocks/loadBlocklyMessages پایین‌تر
  // به‌جایِ fetchِ دوباره، همینِ promiseهای در حالِ پیشرفت را می‌گیرند.
  // این تابع همچنین از پایینِ همینِ فایل، همان لحظه‌ای که اسکریپت پارس
  // می‌شود صدا زده می‌شود (نه فقط وقتِ ensureReady) — یعنی دانلود می‌تواند
  // در پس‌زمینه، حتی قبل از این‌که کسی واقعاً درخواستِ حالتِ بلوکی بدهد،
  // شروع شده باشد.
  let corePromise = null, blocksPromise = null, msgFaPromise = null, msgEnPromise = null;
  function prefetchBlocklyAssets() {
    if (!corePromise) corePromise = fetchScriptText(CDN.core).catch((e) => { corePromise = null; throw e; });
    if (!blocksPromise) blocksPromise = fetchScriptText(CDN.blocks).catch((e) => { blocksPromise = null; throw e; });
    if (!msgFaPromise) msgFaPromise = fetchScriptText(CDN.msgFa).catch((e) => { msgFaPromise = null; throw e; });
    if (!msgEnPromise) msgEnPromise = fetchScriptText(CDN.msgEn).catch((e) => { msgEnPromise = null; throw e; });
  }
  // شروعِ همین حالا، همین لحظه‌ای که این فایل اجرا می‌شود — نه فقط وقتی
  // ensureReady() صدا زده شود. چیزی رندر/اجرا نمی‌شود، فقط دانلود در
  // پس‌زمینه زودتر آغاز می‌شود (مثلاً هم‌زمان با بالا‌آمدنِ باقیِ iframe).
  prefetchBlocklyAssets();

  // ===== چرا این‌جوری بارگذاری می‌کنیم (نه با تگِ <script> ساده) =====
  // این سه فایل (core، blocks، و هر فایلِ پیام مثلِ fa.js) هرسه با همین
  // الگوی UMD نوشته شده‌اند:
  //   if (typeof define === 'function' && define.amd) { AMD... }
  //   else if (typeof exports === 'object') { module.exports = factory(...); }
  //   else { root.Blockly = factory(); }  // فقط همین شاخه، window.Blockly را واقعاً پر می‌کند
  // اگر توی صفحه‌ی میزبان، به هر دلیلی (باندلرها، یک کتابخانه‌ی کاملاً
  // نامرتبطِ دیگر، polyfillهای CommonJS) یک «module» یا «exports»ِ گلوبال
  // از قبل وجود داشته باشد، این فایل به‌جای شاخه‌ی «مرورگر» می‌رود توی
  // شاخه‌ی «Node.js» — و بی‌سروصدا اجرا می‌شود (نه ۴۰۴ای، نه ارورِ
  // کنسولی) ولی هیچ‌وقت چیزی روی window.Blockly ست نمی‌کند! نتیجه: بعداً
  // اولین‌باری که یک بلوکِ متغیر (variables_get/set, field_variable) لود
  // می‌شود، بهم می‌ریزد چون Blockly.Msg ناقص است — دقیقاً همان چیزی که
  // این پروژه با آن دست‌وپنجه نرم می‌کرد.
  // راهِ حل: خودمان متنِ فایل را می‌گیریم (fetch) و با module/exports/require
  // ساختگیِ خودمان اجرایش می‌کنیم — طوری که همیشه دقیقاً همان شاخه‌ای که
  // می‌خواهیم اجرا شود، فارغ از این‌که صفحه‌ی میزبان چه globalهایی دارد.
  async function fetchScriptText(url) {
    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      throw new Error('اتصال به «' + url + '» ناموفق بود (اینترنت یا درست‌بودنِ مسیرِ فایل روی سرور را بررسی کن).');
    }
    if (!res.ok) throw new Error('بارگذاریِ «' + url + '» ناموفق بود (HTTP ' + res.status + ').');
    return res.text();
  }
  // کدِ UMD را با module/exports/require تحتِ کنترلِ خودمان اجرا می‌کند —
  // بدونِ توجه به این‌که global.module یا global.exports در صفحه چه هستند.
  function runUmdModule(code, requireImpl) {
    const fakeModule = { exports: {} };
    const runner = new Function('module', 'exports', 'define', 'require', code);
    runner(fakeModule, fakeModule.exports, undefined, requireImpl || (() => undefined));
    return fakeModule.exports;
  }
  async function loadBlocklyCore() {
    prefetchBlocklyAssets();
    const code = await corePromise;
    const core = runUmdModule(code);
    if (!core || typeof core.defineBlocksWithJsonArray !== 'function') {
      throw new Error('فایلِ اصلیِ Blockly درست اجرا نشد.');
    }
    window.Blockly = core;
  }
  async function loadBlocklyBuiltinBlocks() {
    // blocks_compressed.js فقط یک وابستگی دارد: خودِ core (که با
    // require("./blockly_compressed.js") صدا زده می‌شود) — همان چیزی که
    // همین الان در window.Blockly گذاشتیم را به‌جایش برمی‌گردانیم. متنِ
    // فایل از قبل (موازی با core) دانلود شده؛ فقط *اجرا*یش باید بعد از
    // core باشد، نه دانلودش.
    prefetchBlocklyAssets();
    const code = await blocksPromise;
    runUmdModule(code, () => window.Blockly);
  }
  async function loadBlocklyMessages(url) {
    prefetchBlocklyAssets();
    const promise = url === CDN.msgFa ? msgFaPromise : (url === CDN.msgEn ? msgEnPromise : fetchScriptText(url));
    const code = await promise;
    const messages = runUmdModule(code);
    if (messages && typeof messages === 'object') {
      Object.keys(messages).forEach((k) => { window.Blockly.Msg[k] = messages[k]; });
    }
  }

  /* ---- بارگذاریِ مفسرِ کد (arduino-lang.js) ----
     در صفحه‌ی اصلی ArduinoLang از قبل هست، ولی صفحه‌ی جدای ادیتورِ بلوکی
     (iframe) ممکن است تگِ <script>ِ آن را نداشته باشد؛ آن‌وقت تبدیلِ کد به
     بلوک همیشه شکست می‌خورد. پس اگر نبود، خودمان کنارِ همین فایل پیدایش
     می‌کنیم — با همان الگوی fetch + runUmdModule (مستقل از globalهای صفحه). */
  let langLoadError = null;
  async function loadArduinoLang() {
    const has = () => typeof window.ArduinoLang !== 'undefined' && window.ArduinoLang && typeof window.ArduinoLang.parse === 'function';
    if (has()) return;
    const candidates = [];
    if (SELF_DIR) candidates.push(SELF_DIR + 'arduino-lang.js');
    candidates.push('arduino-lang.js', '/arduino-lang.js');
    let lastErr = null;
    for (const url of candidates) {
      try {
        const code = await fetchScriptText(url);
        const lang = runUmdModule(code);
        if (lang && typeof lang.parse === 'function') { window.ArduinoLang = lang; return; }
        lastErr = new Error('فایلِ «' + url + '» درست اجرا نشد.');
      } catch (e) { lastErr = e; }
    }
    throw new Error('فایلِ arduino-lang.js پیدا نشد؛ مطمئن شو کنارِ arduino-blocks.js روی سرور هست.'
      + (lastErr && lastErr.message ? ' (' + lastErr.message + ')' : ''));
  }

  let readyPromise = null;
  let generatorBuilt = false;

  // آماده‌سازیِ کاملِ Blockly: بارگذاریِ فایل‌ها (فقط بارِ اول) + تعریفِ
  // بلوک‌های سفارشی + ساختِ ژنراتور. صداکردنِ دوباره‌اش هزینه‌ای ندارد.
  // عمداً هیچ‌وقت بر اساسِ «window.Blockly از قبل وجود دارد یا نه» تصمیم
  // نمی‌گیریم که بارگذاری را رد کنیم — چون ممکن است window.Blockly از یک
  // بارگذاریِ نصفه‌ونیمه یا نسخه‌ی دیگری مانده باشد. به‌جایش همیشه خودمان
  // نسخه‌ی کامل و تازه‌ای می‌سازیم که مطمئنیم همه‌چیزش (پیام‌ها، بلوک‌های
  // پایه) واقعاً جا افتاده.
  // اگر همین یک‌بار شکست بخورد (مثلاً یک قطعیِ موقتیِ شبکه)، readyPromise را
  // به null برمی‌گردانیم تا دفعه‌ی بعد که کاربر دوباره روی «بلوکی» بزند،
  // واقعاً از نو تلاش شود — نه این‌که همان شکستِ قبلی تا رفرشِ بعدیِ صفحه
  // برای همیشه کش بماند و هر تلاشِ بعدی را هم بی‌صدا با خودش پایین بکشد.
  function ensureReady() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      try {
        try { await loadArduinoLang(); langLoadError = null; }
        catch (e) { langLoadError = e; if (window.console && console.error) console.error('[ArduinoBlocks]', e); }
        await loadBlocklyCore();
        await loadBlocklyBuiltinBlocks();
        try { await loadBlocklyMessages(CDN.msgFa); }
        catch (e) { await loadBlocklyMessages(CDN.msgEn); }
        // مطمئن می‌شویم دستِ‌کم پیام‌هایی که خودِ Blockly برای فیلدهای
        // متغیر (rename/delete در منویِ کشویی) لازم دارد واقعاً نشسته‌اند؛
        // اگر نه، یعنی حتی این تلاشِ دستی هم کار نکرده و ادامه‌دادن فقط به
        // یک کرشِ بی‌پیام در جایی دیگر ختم می‌شود.
        if (!window.Blockly.Msg.RENAME_VARIABLE) {
          window.Blockly.Msg.RENAME_VARIABLE = window.Blockly.Msg.RENAME_VARIABLE || 'Rename variable...';
          window.Blockly.Msg.DELETE_VARIABLE = window.Blockly.Msg.DELETE_VARIABLE || 'Delete %1 variable';
          window.Blockly.Msg.NEW_VARIABLE = window.Blockly.Msg.NEW_VARIABLE || 'Create variable...';
        }
        // اضافه‌کردنِ کلیدواژه‌ی انگلیسیِ متناظر، کنارِ برچسبِ فارسیِ همان
        // بلوکِ داخلیِ Blockly — بدونِ دست‌زدن به ساختار یا موتاتورِ خودِ بلوک
        // (مثلاً موتاتورِ elseif/else در controls_if دست‌نخورده می‌ماند).
        window.Blockly.Msg.CONTROLS_IF_MSG_IF = 'اگر (if)';
        window.Blockly.Msg.CONTROLS_IF_MSG_ELSE = 'در غیر این صورت';
        window.Blockly.Msg.CONTROLS_WHILEUNTIL_OPERATOR_WHILE = 'تکرار (while) در حالی که';
        window.Blockly.Msg.CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK = 'خروج از (break) حلقه';
        window.Blockly.Msg.CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE = 'ادامه (continue) حلقه';
        // ترجمه‌ی پیش‌فرضِ فایلِ پیام برای بلوکِ داخلیِ «مقداردهیِ متغیر»
        // (variables_set) خراب/نامفهوم است (چیزی شبیهِ «مجموعه %1 به %2»)؛
        // این‌جا با یک برچسبِ روشنِ فارسی جایگزینش می‌کنیم — دقیقاً همان کاری
        // که برایِ CONTROLS_IF و بقیه‌ی کلیدهایِ بالا کردیم.
        window.Blockly.Msg.VARIABLES_SET = 'مقداردهیِ متغیرِ %1 به %2';
        // بلوکِ داخلیِ «تعریفِ تابع» (procedures_defnoreturn/defreturn) با
        // ترجمه‌ی پیش‌فرضِ فایلِ پیام، چیزی مثلِ «به [انجام چیزی] با:» نشان
        // می‌دهد — که هم نامِ پیش‌فرضِ تابع («انجام چیزی») گیج‌کننده است، هم
        // ترکیبِ «به ... با:» فارسیِ طبیعی نیست. این‌جا هم مثلِ کلیدهایِ
        // بالا، یک برچسبِ روشن‌ترِ فارسی جایگزینش می‌کنیم: عنوانِ بلوک
        // می‌شود «تابعی به نامِ»، نامِ پیش‌فرضِ ویرایش‌پذیرِ تابع می‌شود
        // «کارِ من»، و برچسبِ جلویِ لیستِ ورودی‌ها (هم در تعریف و هم در
        // فراخوانی) می‌شود «با ورودی‌های:».
        window.Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE = 'تابعی به نامِ';
        window.Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE = 'کارِ من';
        // فایلِ پیامِ فارسی، کلیدهایِ DEFRETURN (تابعِ با خروجی) را همان لحظه‌ی
        // بارگذاری، از رویِ DEFNORETURN کپی می‌کند؛ چون این اتفاق قبل از خطوطِ
        // بالا افتاده، خودمان باید DEFRETURN را هم جدا و صریح ست کنیم، وگرنه
        // فقط تابعِ بدونِ خروجی برچسبِ تازه را می‌گیرد.
        window.Blockly.Msg.PROCEDURES_DEFRETURN_TITLE = 'تابعی به نامِ';
        window.Blockly.Msg.PROCEDURES_DEFRETURN_PROCEDURE = 'کارِ من';
        window.Blockly.Msg.PROCEDURES_BEFORE_PARAMS = 'با ورودی‌های:';
        window.Blockly.Msg.PROCEDURES_CALL_BEFORE_PARAMS = 'با ورودی‌های:';
        defineCustomBlocks();
        if (!generatorBuilt) { buildGenerator(); generatorBuilt = true; }
      } catch (e) {
        readyPromise = null; // دفعه‌ی بعد دوباره امتحان شود، نه اینکه برای همیشه شکست‌خورده بماند
        throw e;
      }
    })();
    return readyPromise;
  }

  /* ------------------------------ 1. رنگ‌ها (فضایِ رنگیِ اسکرچی) ------------------------------ */

  const COLOR = {
    event: '#F2A93B',   // شروع/تکرارِ اصلی
    control: '#F2823B', // if / loop / صبرکن
    pin: '#3B9DF2',      // پایه‌ها (ورودی/خروجی)
    variable: '#F2597B', // متغیرها
    array: '#8C6FF2',    // آرایه‌ها
    math: '#59C15B',     // ریاضی
    logic: '#3BC1C1',    // منطق
    text: '#B073F2',     // متن/سریال
    servo: '#F25CA6',    // سروو موتور
    wifi: '#1FA89A',     // Wi-Fi و وب‌سرور (ESP32)
    wifi: '#1FA89A',     // Wi-Fi و وب‌سرور (ESP32)
    func: '#EA4C6B',     // توابعِ من
    raw: '#D9822B'       // کدِ خام (چیزی که هنوز بلوکی برایش نیست)
  };

  /* ------------------------------ ۱.۵ مقدارهای پیش‌فرضِ داخلِ بلوک‌ها (شادوها) ------------------------------
     نکته‌ی مهمی که قبلاً باعثِ سوکت‌های خالی می‌شد: کلیدِ `shadow` داخلِ
     args0 در defineBlocksWithJsonArray اصلاً خوانده نمی‌شود — Blockly فقط
     type/name/check/align را از آن‌جا می‌فهمد. شادو (همان بلوکِ کم‌رنگِ
     از-قبل-جاافتاده) باید در خودِ «جعبه‌ابزار» یا در JSONِ سریالایزیشن
     تعریف شود. برای همین همه‌ی مقدارهای پیش‌فرض این‌جا در یک جدولِ واحد
     جمع شده‌اند و از دو جا اعمال می‌شوند:
       • جعبه‌ابزار (blk) → بلوکی که از فلای‌اوت بیرون می‌کشی، از همان اول پر است
       • تبدیلِ کد ← بلوک → اگر مقداری را از داخلِ بلوک بیرون بکشی، باز هم
         شادو زیرش هست و سوکت خالی نمی‌ماند */

  const PIN_OPTIONS = (() => {
    const opts = [];
    for (let i = 0; i <= 13; i++) opts.push([String(i), String(i)]);
    ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].forEach((a) => opts.push([a, a]));
    return opts;
  })();
  const PIN_VALUES = new Set(PIN_OPTIONS.map((o) => o[1]));

  const numDef = (v) => ({ type: 'math_number', fields: { NUM: v } });
  const pinDef = (v) => ({ type: 'ard_pin_number', fields: { PIN: String(v) } });
  const txtDef = (v) => ({ type: 'text', fields: { TEXT: v } });
  const boolDef = (v) => ({ type: 'logic_boolean', fields: { BOOL: v ? 'TRUE' : 'FALSE' } });

  const INPUT_DEFAULTS = {
    /* کنترل */
    ard_wait: { MS: numDef(500) },
    ard_wait_micro: { US: numDef(500) },
    controls_repeat_ext: { TIMES: numDef(10) },
    controls_for: { FROM: numDef(1), TO: numDef(10), BY: numDef(1) },
    controls_whileUntil: { BOOL: boolDef(true) },
    /* پایه‌ها — همه‌ی PINها یک بازشوی آماده‌ی پین می‌گیرند، نه سوکتِ خالی */
    ard_pin_mode: { PIN: pinDef(8) },
    ard_digital_write: { PIN: pinDef(8) },
    ard_digital_read: { PIN: pinDef(2) },
    ard_if_pin: { PIN: pinDef(2) },
    ard_analog_write: { PIN: pinDef(9), VALUE: numDef(128) },
    ard_analog_read: { PIN: pinDef('A0') },
    ard_pot_led: { LED_PIN: pinDef(9), POT_PIN: pinDef('A0') },
    ard_servo_sweep: { MS: numDef(15) },
    /* متغیرها و آرایه‌ها */
    ard_var_declare: { VALUE: numDef(0) },
    variables_set: { VALUE: numDef(0) },
    math_change: { DELTA: numDef(1) },
    ard_array_declare: { SIZE: numDef(5) },
    ard_array_get: { INDEX: numDef(0) },
    ard_array_set: { INDEX: numDef(0), VALUE: numDef(0) },
    /* ریاضی */
    math_arithmetic: { A: numDef(1), B: numDef(1) },
    math_modulo: { DIVIDEND: numDef(64), DIVISOR: numDef(10) },
    math_constrain: { VALUE: numDef(50), LOW: numDef(1), HIGH: numDef(100) },
    math_random_int: { FROM: numDef(1), TO: numDef(100) },
    ard_math_single: { A: numDef(9) },
    ard_math_map: { X: numDef(512), IN_MIN: numDef(0), IN_MAX: numDef(1023), OUT_MIN: numDef(0), OUT_MAX: numDef(255) },
    /* منطق */
    logic_compare: { A: numDef(0), B: numDef(0) },
    /* متن و سریال */
    ard_serial_print: { VALUE: txtDef('پیام من') },
    /* سروو */
    ard_servo_attach: { PIN: pinDef(9) },
    ard_servo_write: { ANGLE: numDef(90) },
    /* Wi-Fi و وب‌سرور (ESP32) */
    ard_wifi_begin: { SSID: txtDef('MyHome'), PASS: txtDef('12345678') },
    ard_server_send: { TEXT: txtDef('LED ON') },
    /* STM32 / HAL */
    hal_delay: { MS: numDef(500) },
    hal_set_compare: { VAL: numDef(500) }
  };

  const cloneDef = (d) => ({ type: d.type, fields: Object.assign({}, d.fields) });

  // ورودی‌های شادودارِ یک نوع بلوک، به فرمتِ inputs در جعبه‌ابزار/سریالایزیشن.
  function defaultInputs(type) {
    const spec = INPUT_DEFAULTS[type];
    if (!spec) return null;
    const inputs = {};
    Object.keys(spec).forEach((k) => { inputs[k] = { shadow: cloneDef(spec[k]) }; });
    return inputs;
  }

  // روی یک درختِ JSONِ سریالایزیشن (خروجیِ تبدیلِ کد ← بلوک) راه می‌رود و هر
  // ورودی‌ای که شادو ندارد را با مقدارِ پیش‌فرضش پر می‌کند — چه خالی باشد،
  // چه بلوکِ واقعی داشته باشد (که آن‌وقت شادو زیرش پنهان می‌ماند و فقط
  // موقعِ بیرون‌کشیدنِ بلوک ظاهر می‌شود).
  function applyShadowDefaults(node) {
    if (!node || typeof node !== 'object') return node;
    const spec = INPUT_DEFAULTS[node.type];
    if (spec) {
      node.inputs = node.inputs || {};
      Object.keys(spec).forEach((k) => {
        const cur = node.inputs[k];
        if (cur && cur.shadow) return;
        node.inputs[k] = Object.assign({}, cur, { shadow: cloneDef(spec[k]) });
      });
    }
    if (node.inputs) {
      Object.keys(node.inputs).forEach((k) => {
        const inp = node.inputs[k];
        if (inp && inp.block) applyShadowDefaults(inp.block);
      });
    }
    if (node.next && node.next.block) applyShadowDefaults(node.next.block);
    return node;
  }

  /* ------------------------------ 2. تعریفِ بلوک‌های سفارشیِ آردوینو ------------------------------ */

  let blocksDefined = false;

  function defineCustomBlocks() {
    if (blocksDefined) return;
    const Blockly = window.Blockly;
    defineHalBlocks(Blockly);

    Blockly.defineBlocksWithJsonArray([
      /* ---------- رویدادها ---------- */
      {
        type: 'ard_setup',
        message0: '🔌 هنگام شروع %1 %2',
        args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
        colour: COLOR.event,
        tooltip: 'کدهای این‌جا فقط یک‌بار، درست در ابتدای اجرای برنامه، اجرا می‌شوند.',
        helpUrl: ''
      },
      {
        type: 'ard_loop',
        message0: '🔁 همیشه تکرار کن %1 %2',
        args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
        colour: COLOR.event,
        tooltip: 'کدهای این‌جا بارها و بارها، تا وقتی که برنامه روشن است، تکرار می‌شوند.',
        helpUrl: ''
      },
      {
        type: 'ard_global',
        message0: '🌐 سراسری (Global) %1 %2',
        args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
        colour: COLOR.event,
        tooltip: 'جایی برای متغیرها، آرایه‌ها، سرووها و یادداشت‌هایی که باید بیرونِ «هنگامِ شروع» و «همیشه تکرار کن» تعریف شوند — همه‌شان اینجا نگه داشته می‌شوند تا هیچ بلوکی تنها و رهاشده روی بومِ کار نماند.',
        helpUrl: ''
      },
      {
        type: 'ard_comment',
        message0: '📝 یادداشت: %1',
        args0: [{ type: 'field_input', name: 'TEXT', text: 'توضیح' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#5b6270',
        tooltip: 'یک یادداشت برای خودت — روی اجرای برنامه هیچ اثری ندارد.'
      },
      {
        type: 'ard_raw_code',
        message0: '🧩 کدِ خام %1',
        // توجه: از field_multilinetext استفاده نمی‌کنیم — آن یک فیلدِ
        // جداگانه‌ست (بستهٔ @blockly/field-multilineinput) که در بسته‌ی
        // پایه‌ی Blockly ثبت نشده؛ اگر همین‌جا استفاده می‌شد، این بلوک به‌طور
        // کاملاً بی‌صدا (نه ارور در کنسول، فقط یک هشدارِ کم‌اهمیت) فیلدش را
        // نمی‌ساخت و کاربر اصلاً نمی‌توانست چیزی در آن بنویسد یا حتی ببیندش.
        // field_input همیشه بخشی از هسته‌ی Blockly است و همین امروز کار می‌کند.
        args0: [{ type: 'field_input', name: 'CODE', text: '' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.raw,
        tooltip: 'این تکه‌کد هنوز به بلوک تبدیل نشده (یک ساختارِ پیچیده یا پشتیبانی‌نشده است) — عینِ همان متنی که در حالتِ متنی نوشته بودی، این‌جا نگه‌داشته شده تا چیزی گم نشود. می‌توانی مستقیماً همین‌جا ویرایشش کنی؛ موقعِ برگشتن به حالتِ متنی، دقیقاً همین متن در کد ظاهر می‌شود. برای دستورهای چندخطی، ویرایش در حالتِ متنی راحت‌تر است.',
        helpUrl: ''
      },

      /* ---------- کنترل ---------- */
      {
        type: 'ard_wait',
        message0: '⏱️ صبر کن %1 میلی‌ثانیه',
        args0: [{ type: 'input_value', name: 'MS', check: 'Number' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.control,
        tooltip: 'اجرای برنامه را برای این‌مقدار میلی‌ثانیه متوقف می‌کند (delay).'
      },
      {
        type: 'ard_wait_micro',
        message0: '⏱️ صبر کن %1 میکروثانیه',
        args0: [{ type: 'input_value', name: 'US', check: 'Number' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.control,
        tooltip: 'مثل «صبر کن»، اما خیلی خیلی کوتاه‌تر (delayMicroseconds).'
      },
      // این دو بلوک، بلوک‌های داخلیِ خودِ Blockly هستند (controls_repeat_ext و
      // controls_for) که این‌جا عمداً با همان نامِ نوع، دوباره تعریف می‌شوند تا
      // جایگزینِ نسخه‌ی پیش‌فرض شوند: نسخه‌ی پیش‌فرض برای تعدادِ تکرار/بازه از
      // یک سوکتِ ورودیِ خالی (تیره) استفاده می‌کند؛ این‌جا به‌جایش یک فیلدِ
      // عددیِ مستقیماً قابل‌ویرایش با مقدارِ پیش‌فرض گذاشته‌ایم. چون ژنراتورِ
      // کدِ این پروژه (ArduinoGenerator) و مبدلِ کد↔بلوک هردو کاملاً سفارشی‌اند
      // و روی همین نامِ نوع و همین نام‌های فیلد کار می‌کنند، بازنویسیِ ظاهرِ
      // بلوک هیچ‌کدام از آن دو را خراب نمی‌کند.
      {
        type: 'controls_repeat_ext',
        message0: '🔁 تکرار (repeat) %1 بار %2',
        args0: [
          { type: 'input_value', name: 'TIMES', check: 'Number' },
          { type: 'input_statement', name: 'DO' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.control,
        tooltip: 'کدهای داخلش را دقیقاً همین‌تعداد بار تکرار می‌کند.'
      },
      {
        type: 'controls_for',
        message0: '🔁 با تعداد (for) %1 از %2 به %3 با گام‌های %4 %5',
        args0: [
          { type: 'field_variable', name: 'VAR', variable: 'k' },
          { type: 'input_value', name: 'FROM', check: 'Number' },
          { type: 'input_value', name: 'TO', check: 'Number' },
          { type: 'input_value', name: 'BY', check: 'Number' },
          { type: 'input_statement', name: 'DO' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.control,
        tooltip: 'یک متغیرِ شمارنده را از یک عدد تا عددِ دیگر، با گام‌هایِ مشخص، پیش می‌برد و کدهای داخلش را هر بار تکرار می‌کند. هر سه‌ی این سه‌تا (از/به/گام) می‌توانند به‌جای عددِ ثابت، هر بلوکِ دیگری (متغیر، حاصلِ جمع و ...) باشند.'
      },

      /* ---------- پایه‌ها ---------- */
      {
        type: 'ard_pin_mode',
        message0: '⚙️ پینِ %1 را %2 کن',
        args0: [
          { type: 'input_value', name: 'PIN', check: 'Number' },
          { type: 'field_dropdown', name: 'MODE', options: [['خروجی (OUTPUT)', 'OUTPUT'], ['ورودی (INPUT)', 'INPUT'], ['ورودی با مقاومتِ داخلی (INPUT_PULLUP)', 'INPUT_PULLUP']] }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.pin,
        tooltip: 'مشخص می‌کند این پایه قرار است ورودی باشد یا خروجی (pinMode).'
      },
      {
        type: 'ard_digital_write',
        message0: '💡 پینِ %1 را %2 کن',
        args0: [
          { type: 'input_value', name: 'PIN', check: 'Number' },
          { type: 'field_dropdown', name: 'STATE', options: [['روشن (HIGH)', 'HIGH'], ['خاموش (LOW)', 'LOW']] }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.pin,
        tooltip: 'یک پایه‌ی دیجیتال را روشن یا خاموش می‌کند (digitalWrite).'
      },
      {
        type: 'ard_digital_read',
        message0: '📥 مقدارِ دیجیتالِ پینِ %1',
        args0: [{ type: 'input_value', name: 'PIN', check: 'Number' }],
        output: 'Number',
        colour: COLOR.pin,
        tooltip: 'مقدارِ فعلیِ یک پایه‌ی ورودی را می‌خواند (digitalRead) — ۰ یا ۱.'
      },
      {
        type: 'ard_if_pin',
        message0: '❓ اگر پینِ %1 %2 بود',
        args0: [
          { type: 'input_value', name: 'PIN', check: 'Number' },
          { type: 'field_dropdown', name: 'STATE', options: [['HIGH (روشن)', 'HIGH'], ['LOW (خاموش)', 'LOW']] }
        ],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        message2: 'در غیر این صورت %1',
        args2: [{ type: 'input_statement', name: 'ELSE' }],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.pin,
        tooltip: 'بررسی می‌کند مقدارِ فعلیِ یک پایه‌ی ورودی برابرِ HIGH است یا LOW، و بر اساسِ آن یکی از دو بخش را اجرا می‌کند — پینِ موردنظر می‌تواند یک عددِ ثابت یا یک متغیر (مثلِ نامِ پینِ ذخیره‌شده در یک متغیر) باشد.\n\n🛠️ برای دیدنِ اینکه این بلوک از چه بلوک‌های ساده‌تری ساخته شده، رویِ آیکونِ 🛠️ کنارِ بلوک کلیک کن.'
      },
      {
        type: 'ard_analog_write',
        message0: '🔆 پینِ %1 را با شدتِ %2 (از ۰ تا ۲۵۵) روشن کن',
        args0: [
          { type: 'input_value', name: 'PIN', check: 'Number' },
          { type: 'input_value', name: 'VALUE', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.pin,
        tooltip: 'روشناییِ یک پایه‌ی PWM را بین ۰ (خاموش) تا ۲۵۵ (تمام‌روشن) تنظیم می‌کند (analogWrite).'
      },
      {
        type: 'ard_analog_read',
        message0: '📊 مقدارِ آنالوگِ پینِ %1',
        args0: [{ type: 'input_value', name: 'PIN', check: 'Number' }],
        output: 'Number',
        colour: COLOR.pin,
        tooltip: 'مقدارِ یک پایه‌ی آنالوگ (مثلِ A0) را بین ۰ تا ۱۰۲۳ می‌خواند (analogRead).'
      },
      {
        // بلوکِ اختصاصیِ مأموریتِ «کنترلِ روشنایی با ولوم»: برای اینکه به این
        // نتیجه برسیم، معمولاً باید سه بلوک تودرتو بسازیم (analogRead ← داخلِ
        // map ← داخلِ analogWrite) که برایِ تازه‌کار گیج‌کننده است. این بلوک
        // همان زنجیره را در یک قطعه‌ی واحد بسته‌بندی می‌کند: فقط پینِ LED و
        // پینِ ولوم را می‌گیرد و خودش analogRead + map(۰..۱۰۲۳ → ۰..۲۵۵) +
        // analogWrite را پشتِ‌صحنه انجام می‌دهد — دقیقاً معادلِ:
        //   analogWrite(ledPin, map(analogRead(potPin), 0, 1023, 0, 255));
        type: 'ard_pot_led',
        message0: '🎚️ روشناییِ LEDِ پینِ %1 را با ولومِ پینِ %2 کنترل کن',
        args0: [
          { type: 'input_value', name: 'LED_PIN', check: 'Number' },
          { type: 'input_value', name: 'POT_PIN', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.pin,
        tooltip: 'مقدارِ آنالوگِ ولوم (پتانسیومتر) را می‌خواند، آن را از بازه‌ی ۰ تا ۱۰۲۳ به بازه‌ی PWM (۰ تا ۲۵۵) تبدیل می‌کند، و همان لحظه روشناییِ LED را با آن هماهنگ می‌کند — یعنی analogRead + map + analogWrite هر سه با هم، در یک بلوک. باید داخلِ loop() گذاشته شود تا هر بار دوباره اجرا شود.\n\n🛠️ برای دیدنِ اینکه این بلوک از چه بلوک‌های ساده‌تری ساخته شده، رویش راست‌کلیک کن و «نشان‌بده این بلوک از چی ساخته شده» را بزن.'
      },
      {
        type: 'ard_pin_state',
        message0: '%1',
        args0: [
          { type: 'field_dropdown', name: 'STATE', options: [['HIGH (روشن)', 'HIGH'], ['LOW (خاموش)', 'LOW']] }
        ],
        output: 'Number',
        colour: COLOR.pin,
        tooltip: 'مقدارِ ثابتِ HIGH یا LOW — برای مقایسه با نتیجه‌ی digitalRead یا متغیری که آن را در خودش ذخیره کرده (مثلاً «اگر دکمه برابرِ LOW بود»).'
      },
      {
        // شماره‌ی پین، به‌شکلِ یک بازشوی آماده (۰..۱۳ و A0..A5) به‌جای یک
        // سوکتِ خالی که کاربر مجبور باشد از دسته‌ی «ریاضی» عددی بکشد تویش.
        // این بلوک، به‌عنوانِ شادو، از قبل داخلِ همه‌ی ورودی‌های PIN نشسته
        // است؛ اگر کسی بخواهد پین را از یک متغیر بگیرد، کافی است بلوکِ
        // متغیر را روی همین بگذارد.
        type: 'ard_pin_number',
        message0: '%1',
        args0: [{ type: 'field_dropdown', name: 'PIN', options: PIN_OPTIONS }],
        output: 'Number',
        colour: COLOR.pin,
        tooltip: 'شماره‌ی پین — پین‌های دیجیتالِ ۰ تا ۱۳ و پین‌های آنالوگِ A0 تا A5.'
      },

      /* ---------- متغیرها ---------- */
      {
        type: 'ard_var_declare',
        message0: '📦 تعریفِ متغیرِ %1 به نامِ %2 با مقدارِ اولیه‌ی %3',
        args0: [
          { type: 'field_dropdown', name: 'TYPE', options: function () { return varTypeOptions(this, [['عدد صحیح (int)', 'int'], ['عدد اعشاری (float)', 'float'], ['درست/غلط (bool)', 'bool'], ['متن (String)', 'String'], ['عدد صحیحِ بزرگ (long)', 'long'], ['عددِ کوچک (byte)', 'byte']]); } },
          { type: 'field_variable', name: 'NAME', variable: 'متغیر' },
          { type: 'input_value', name: 'VALUE' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.variable,
        tooltip: 'یک متغیرِ جدید با یک نوع مشخص و یک مقدارِ اولیه می‌سازد (مثلاً int a = 2;).'
      },

      /* ---------- آرایه‌ها ---------- */
      {
        type: 'ard_array_declare',
        message0: '🧺 یک آرایه‌ی %1 بساز به نامِ %2 با اندازه‌ی %3',
        args0: [
          { type: 'field_dropdown', name: 'TYPE', options: [['عدد صحیح (int)', 'int'], ['عدد اعشاری (float)', 'float'], ['عددِ کوچک (byte)', 'byte']] },
          { type: 'field_variable', name: 'NAME', variable: 'آرایه' },
          { type: 'input_value', name: 'SIZE', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.array,
        tooltip: 'یک آرایه (لیستی از عددها) با اندازه‌ی مشخص می‌سازد؛ همه‌ی خانه‌ها اول صفر هستند.'
      },
      {
        type: 'ard_array_get',
        message0: '🧺 خانه‌یِ شماره‌ی %1 از آرایه‌ی %2',
        args0: [
          { type: 'input_value', name: 'INDEX', check: 'Number' },
          { type: 'field_variable', name: 'NAME', variable: 'آرایه' }
        ],
        output: null,
        colour: COLOR.array,
        tooltip: 'مقدارِ یک خانه‌ی مشخص از آرایه را برمی‌گرداند (شماره‌ها از ۰ شروع می‌شوند).'
      },
      {
        type: 'ard_array_set',
        message0: '🧺 خانه‌یِ شماره‌ی %1 از آرایه‌ی %2 را برابرِ %3 کن',
        args0: [
          { type: 'input_value', name: 'INDEX', check: 'Number' },
          { type: 'field_variable', name: 'NAME', variable: 'آرایه' },
          { type: 'input_value', name: 'VALUE' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.array,
        tooltip: 'مقدارِ یک خانه‌ی مشخص از آرایه را تغییر می‌دهد.'
      },
      {
        type: 'ard_array_length',
        message0: '🧺 تعدادِ خانه‌های آرایه‌ی %1',
        args0: [{ type: 'field_variable', name: 'NAME', variable: 'آرایه' }],
        output: 'Number',
        colour: COLOR.array,
        tooltip: 'تعدادِ خانه‌های آرایه را برمی‌گرداند.'
      },

      /* ---------- ریاضیِ سفارشی ---------- */
      {
        type: 'ard_math_single',
        message0: '%1 عددِ %2',
        args0: [
          { type: 'field_dropdown', name: 'FUNC', options: [['قدرِ مطلقِ', 'abs'], ['جذرِ', 'sqrt'], ['مربعِ', 'sq']] },
          { type: 'input_value', name: 'A', check: 'Number' }
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLOR.math,
        tooltip: 'قدرِ مطلق، جذر، یا مربعِ یک عدد را حساب می‌کند.'
      },
      {
        type: 'ard_math_map',
        message0: '🧮 نگاشتِ %1 از بازه‌ی [%2 .. %3] به بازه‌ی [%4 .. %5]',
        args0: [
          { type: 'input_value', name: 'X', check: 'Number' },
          { type: 'input_value', name: 'IN_MIN', check: 'Number' },
          { type: 'input_value', name: 'IN_MAX', check: 'Number' },
          { type: 'input_value', name: 'OUT_MIN', check: 'Number' },
          { type: 'input_value', name: 'OUT_MAX', check: 'Number' }
        ],
        output: 'Number',
        colour: COLOR.math,
        tooltip: 'یک عدد را از یک بازه به بازه‌ی دیگر تبدیل می‌کند — مثلاً مقدارِ ولوم (۰..۱۰۲۳) را به روشناییِ LED (۰..۲۵۵) (map).',
        inputsInline: true
      },

      /* ---------- متن/سریال ---------- */
      {
        type: 'ard_serial_begin',
        message0: '🖥️ مانیتورِ سریال را با سرعتِ %1 شروع کن',
        args0: [{ type: 'field_dropdown', name: 'BAUD', options: [['9600', '9600'], ['19200', '19200'], ['38400', '38400'], ['57600', '57600'], ['115200', '115200']] }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.text,
        tooltip: 'ارتباطِ سریال را فعال می‌کند (Serial.begin) — همیشه اولین کاری که در «هنگامِ شروع» انجام می‌دهی.'
      },
      {
        type: 'ard_serial_print',
        message0: '🖨️ در مانیتورِ سریال چاپ کن %1 برو خطِ بعد %2',
        args0: [
          { type: 'input_value', name: 'VALUE' },
          { type: 'field_checkbox', name: 'NEWLINE', checked: true }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.text,
        tooltip: 'مقدارِ وصل‌شده به این بازشو را در مانیتورِ سریال چاپ می‌کند. به‌طورِ پیش‌فرض یک بلوکِ متنِ ثابت این‌جا جا افتاده — می‌توانی همان را ویرایش کنی، یا بردارَیش و به‌جایش هر بلوکِ دیگری (متغیر، عدد، حاصلِ جمع، و…) بگذاری.',
        helpUrl: ''
      },
      /* ---------- سروو موتور ---------- */
      {
        type: 'ard_servo_declare',
        message0: '🦾 یک موتورِ سروو بساز به نامِ %1',
        args0: [{ type: 'field_variable', name: 'NAME', variable: 'سروو' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.servo,
        tooltip: 'یک موتورِ سروو تعریف می‌کند (Servo). این را بیرونِ «هنگامِ شروع» و «همیشه تکرار کن» بگذار.'
      },
      {
        type: 'ard_servo_attach',
        message0: '🦾 سرووی %1 را به پینِ %2 وصل کن',
        args0: [
          { type: 'field_variable', name: 'NAME', variable: 'سروو' },
          { type: 'input_value', name: 'PIN', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.servo,
        tooltip: 'سروو را به یک پینِ مشخص وصل می‌کند (attach) — قبل از استفاده لازم است.'
      },
      {
        type: 'ard_servo_write',
        message0: '🦾 سرووی %1 را به زاویه‌یِ %2 درجه ببر',
        args0: [
          { type: 'field_variable', name: 'NAME', variable: 'سروو' },
          { type: 'input_value', name: 'ANGLE', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.servo,
        tooltip: 'زاویه‌ی سروو را بین ۰ تا ۱۸۰ درجه تنظیم می‌کند (write).'
      },
      {
        // بلوکِ اختصاصیِ مأموریتِ «کنترلِ زاویه‌ی سروو»: طبقِ گام‌های همان
        // مأموریت، باید سروو attach شود و بعد با یک حلقه از ۰ تا ۱۸۰ و
        // برعکس (Sweep) بچرخد و بینِ هر مرحله کمی delay باشد — یعنی دو
        // حلقه‌ی for تودرتو با یک نوشتنِ سروو و یک تأخیر داخلِ هرکدام. این
        // بلوک همان دو حلقه را در یک قطعه‌ی واحد بسته‌بندی می‌کند: فقط
        // سروو (که باید قبلاً attach شده باشد) و مدتِ تأخیرِ هر گام را
        // می‌گیرد و خودش هر دو حلقه‌ی رفت‌وبرگشت را پشتِ‌صحنه می‌سازد.
        type: 'ard_servo_sweep',
        message0: '🔄 سرووی %1 را بینِ ۰ تا ۱۸۰ درجه نوسان بده (هر گام %2 میلی‌ثانیه)',
        args0: [
          { type: 'field_variable', name: 'NAME', variable: 'سروو' },
          { type: 'input_value', name: 'MS', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLOR.servo,
        tooltip: 'سرووِ موردنظر (که قبلاً attach شده) را یک‌بار کامل از ۰ تا ۱۸۰ درجه و برمی‌گردد به ۰ می‌چرخاند — دقیقاً معادلِ دو حلقه‌ی for با یک servo.write + delay داخلِ هرکدام. اگر می‌خواهی این چرخش همیشه تکرار شود، این بلوک را داخلِ «همیشه تکرار کن» بگذار.\n\n🛠️ برای دیدنِ اینکه این بلوک از چه بلوک‌های ساده‌تری ساخته شده، رویِ آیکونِ 🛠️ کنارِ بلوک کلیک کن.'
      },
      {
        type: 'ard_servo_read',
        message0: '🦾 زاویه‌ی فعلیِ سرووی %1',
        args0: [{ type: 'field_variable', name: 'NAME', variable: 'سروو' }],
        output: 'Number',
        colour: COLOR.servo,
        tooltip: 'آخرین زاویه‌ای که به این سروو داده شده را برمی‌گرداند (read).'
      },
      {
        type: 'ard_servo_detach',
        message0: '🦾 اتصالِ سرووی %1 را قطع کن',
        args0: [{ type: 'field_variable', name: 'NAME', variable: 'سروو' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.servo,
        tooltip: 'کنترلِ سروو را آزاد می‌کند (detach).'
      }
    ]);

    /* ---------- Wi-Fi و وب‌سرور (ESP32) ---------- */
    Blockly.defineBlocksWithJsonArray([
      {
        type: 'ard_server_declare',
        message0: '🌐 یک وب‌سرور بساز (نامش server) روی پورتِ %1',
        args0: [{ type: 'field_number', name: 'PORT', value: 80, min: 1, max: 65535, precision: 1 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'یک وب‌سرورِ کوچک روی برد تعریف می‌کند (WebServer server(80);). این را داخلِ بلوکِ «سراسری» بگذار؛ پورتِ ۸۰ همان پورتِ معمولیِ وب است.'
      },
      {
        type: 'ard_wifi_begin',
        message0: '📶 به Wi-Fi با نامِ %1 و رمزِ %2 وصل شو',
        args0: [
          { type: 'input_value', name: 'SSID' },
          { type: 'input_value', name: 'PASS' }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'برد را به مودم وصل می‌کند (WiFi.begin). اتصال چند لحظه طول می‌کشد؛ بعدش از بلوکِ «صبر کن تا وصل شود» استفاده کن.'
      },
      {
        type: 'ard_wifi_wait',
        message0: '⏳ تا وصل‌شدنِ Wi-Fi صبر کن (هر %1 میلی‌ثانیه دوباره بررسی کن)',
        args0: [{ type: 'field_number', name: 'MS', value: 500, min: 1, max: 5000, precision: 1 }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'تا وقتی برد به Wi-Fi وصل نشده، هر چند میلی‌ثانیه یک‌بار دوباره می‌پرسد — معادلِ while (WiFi.status() != WL_CONNECTED) delay(500);'
      },
      {
        type: 'ard_wifi_ip',
        message0: '🔢 آدرسِ IPِ برد',
        output: 'String',
        colour: COLOR.wifi,
        tooltip: 'آدرسی که مودم به برد داده (WiFi.localIP()). آن را در مانیتورِ سریال چاپ کن تا بدانی گوشی باید به کجا وصل شود.'
      },
      {
        type: 'ard_server_on',
        message0: '🌐 وقتی مرورگر آدرسِ %1 را باز کرد، تابعِ %2 را اجرا کن',
        args0: [
          { type: 'field_input', name: 'PATH', text: '/on' },
          { type: 'field_input', name: 'FUNC', text: 'handleOn' }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'یک آدرس را به یک تابع وصل می‌کند (server.on). نامِ تابع را دقیقاً مثلِ نامِ تابعی بنویس که در «توابعِ من» ساخته‌ای.'
      },
      {
        type: 'ard_server_begin',
        message0: '▶️ وب‌سرور را راه بینداز',
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'وب‌سرور را روشن می‌کند (server.begin()) — بعد از ثبتِ آدرس‌ها و یک‌بار در «هنگامِ شروع».'
      },
      {
        type: 'ard_server_handle',
        message0: '👂 به درخواست‌های مرورگر گوش بده',
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'اگر مرورگر یا گوشی درخواستی فرستاده باشد، تابعِ مربوط به آن اجرا می‌شود (server.handleClient()). این را داخلِ «همیشه تکرار کن» بگذار، وگرنه برد به درخواست‌ها گوش نمی‌دهد.'
      },
      {
        type: 'ard_server_send',
        message0: '📨 به مرورگر جواب بده: کدِ %1 ، متنِ %2',
        args0: [
          { type: 'field_dropdown', name: 'CODE', options: [['200 (موفق)', '200'], ['404 (پیدا نشد)', '404']] },
          { type: 'input_value', name: 'TEXT' }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLOR.wifi,
        tooltip: 'جوابی را که مرورگر/گوشی منتظرش است می‌فرستد (server.send). هر تابعِ آدرس باید در آخر یک جواب بدهد.'
      }
    ]);

    /* ---------- ۲.۰ برچسب‌گذاریِ فارسیِ بلوکِ آماده‌ی «گرفتنِ مقدارِ متغیر» ----------
       variables_get یک بلوکِ داخلیِ خودِ Blockly است (نه ساخته‌ی خودمان) و
       فقط از یک بازشوِ برهنه (همون فیلدِ VAR) تشکیل شده، بدونِ هیچ برچسبِ
       متنی‌ای کنارش. به‌جای این‌که یک بلوکِ کاملاً جدید بسازیم، همان
       init پیش‌فرضش را صدا می‌زنیم و فقط یک برچسبِ ثابتِ فارسی («مقدارِ
       متغیرِ») را جلوی همان بازشو اضافه می‌کنیم — نه این‌که یک متغیرِ
       جدید و عجیب به اسمِ «مقدارِ متغیر» پیش‌فرض بسازیم؛ بازشو همچنان
       طبقِ رفتارِ عادیِ خودش (فهرستِ متغیرهای واقعیِ موجود، یا اگر هیچ
       متغیری نبود، ساختِ یکیِ پیش‌فرض) عمل می‌کند. */
    if (Blockly.Blocks['variables_get']) {
      const originalVarGetInit = Blockly.Blocks['variables_get'].init;
      Blockly.Blocks['variables_get'].init = function () {
        originalVarGetInit.call(this);
        const input = this.inputList[0];
        if (input && typeof input.insertFieldAt === 'function') {
          input.insertFieldAt(0, 'مقدارِ متغیرِ');
        }
      };
    }

    /* ---------- ۲.۰۵ ابزارهای مشترکِ آیکون‌های 🛠️ (باز کردن) و ↪️ (بازگشت) ----------
       چند بلوکِ اختصاصی/میان‌بر در این فایل (مثلِ ard_pot_led و ard_if_pin)
       یک آیکونِ 🛠️ روی خودشان دارند که با کلیک، بلوک را به همان بلوک‌های
       سادهٔ معمولیِ جعبه‌ابزار باز می‌کند، و بلوکِ تازه‌بازشده هم یک آیکونِ
       ↪️ دارد که دقیقاً همان بلوکِ فشردهٔ اولیه را برمی‌گرداند. توابعِ زیر
       (سریالایز/دی‌سریالایزِ ایمنِ یک ورودی، و جابه‌جاییِ یک بلوک با بلوکِ
       دیگر) بینِ همهٔ این‌ها مشترک‌اند. */
    function stripBlockIds(node) {
      if (!node || typeof node !== 'object') return node;
      delete node.id;
      if (node.inputs) {
        Object.keys(node.inputs).forEach((k) => {
          const inp = node.inputs[k];
          if (inp && inp.block) stripBlockIds(inp.block);
          if (inp && inp.shadow) stripBlockIds(inp.shadow);
        });
      }
      if (node.next && node.next.block) stripBlockIds(node.next.block);
      return node;
    }
    // هرچه کاربر واقعاً در سوکتِ پین گذاشته (شادوی پیش‌فرض، یک عددِ دیگر، یا
    // حتی یک بلوکِ متغیر) را عیناً کپی می‌کند؛ اگر سوکت به هر دلیلی خالی
    // بود (نباید پیش بیاید، چون شادو همیشه هست)، به مقدارِ پیش‌فرضِ خودِ
    // بلوکِ اصلی برمی‌گردد.
    function pinInputState(block, inputName, fallback) {
      const target = block.getInputTargetBlock(inputName);
      if (target) return stripBlockIds(Blockly.serialization.blocks.save(target));
      return cloneDef(fallback);
    }
    // بدنه‌ی یک ورودیِ آماری (statement) مثلِ DO یا ELSE را — با همان زنجیره‌ی
    // بلوک‌های پشت‌سرهم که کاربر داخلش گذاشته — سریالایز می‌کند؛ اگر آن
    // ورودی خالی بود null برمی‌گرداند (نه یک شادو، چون این‌ها ورودیِ آماری‌اند
    // و شادوی پیش‌فرض ندارند).
    function statementInputState(block, inputName) {
      const target = block.getInputTargetBlock(inputName);
      if (!target) return null;
      return stripBlockIds(Blockly.serialization.blocks.save(target));
    }
    // هسته‌ی مشترکِ «این بلوک را بردار و یک بلوکِ/زنجیره‌ی دیگر را دقیقاً
    // جای آن بگذار» — هم برایِ بازکردنِ بلوکِ اختصاصی به بلوک‌های ساده
    // استفاده می‌شود (🛠️) و هم برایِ برگرداندنِ آن‌ها به حالتِ فشرده (↪️).
    // اول بلوکِ جدید ساخته می‌شود و فقط اگر واقعاً موفق شد، بلوکِ قدیمی حذف
    // می‌شود — تا اگر ساختنش (به هر دلیلِ غیرمنتظره‌ای) شکست خورد، چیزی از
    // دستِ کاربر نرود. مقدارِ خودِ بلوکِ تازه‌ساخته را برمی‌گرداند (یا null).
    function replaceBlockWithState(oldBlock, newState, errorLabel) {
      if (!oldBlock.workspace || oldBlock.isInFlyout) return null;
      const workspace = oldBlock.workspace;
      Blockly.Events.setGroup(true);
      try {
        let newBlock;
        try {
          newBlock = Blockly.serialization.blocks.append(newState, workspace, { recordUndo: true });
        } catch (e) {
          console.error(errorLabel, e);
          return null;
        }
        if (!newBlock) return null;
        const xy = oldBlock.getRelativeToSurfaceXY();
        const prevTarget = oldBlock.previousConnection && oldBlock.previousConnection.targetConnection;
        const nextTarget = oldBlock.nextConnection && oldBlock.nextConnection.targetConnection;
        oldBlock.dispose(false);
        if (prevTarget && newBlock.previousConnection) prevTarget.connect(newBlock.previousConnection);
        if (nextTarget && newBlock.nextConnection) newBlock.nextConnection.connect(nextTarget);
        if (!prevTarget && !nextTarget) {
          const pos = newBlock.getRelativeToSurfaceXY();
          newBlock.moveBy(xy.x - pos.x, xy.y - pos.y);
        }
        return newBlock;
      } finally {
        Blockly.Events.setGroup(false);
      }
    }
    // آیکون‌ها را به‌شکلِ یک SVGِ کوچک (که فقط همان ایموجی را رسم می‌کند)
    // به‌عنوانِ src به FieldImage می‌دهیم — چون خودِ FieldImage یک آدرسِ
    // تصویر می‌خواهد، نه متنِ خام.
    function emojiIconSrc(emoji) {
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><text x="1" y="15" font-size="14">' + emoji + '</text></svg>'
      );
    }
    const POT_LED_ICON_SRC = emojiIconSrc('🛠️');
    const COLLAPSE_ICON_SRC = emojiIconSrc('↪️');
    // بعدِ از باز شدنِ یک بلوکِ اختصاصی به بلوک‌های ساده‌ترش، رویِ همان
    // بلوکِ تازه‌ساخته یک آیکونِ ↪️ می‌گذاریم که با کلیک، همان کارِ برعکس را
    // می‌کند: بلوکِ تازه‌ساخته برداشته می‌شود و compactState (که پیش از
    // بازکردن، عیناً از خودِ بلوکِ اختصاصی گرفته شده) دوباره جایش می‌نشیند —
    // یعنی یک بازگشتِ دقیق و بدون افتادنِ هیچ اطلاعاتی.
    function attachCollapseIcon(newBlock, compactState, tooltipText) {
      if (!newBlock) return;
      const undoField = new Blockly.FieldImage(
        COLLAPSE_ICON_SRC, 18, 18, '↪️',
        () => setTimeout(() => replaceBlockWithState(newBlock, compactState, 'بازگرداندنِ بلوکِ فشرده شکست خورد:'), 0)
      );
      if (typeof undoField.setTooltip === 'function') undoField.setTooltip(tooltipText);
      newBlock.appendDummyInput('COLLAPSE_ICON').appendField(undoField);
    }

    /* ---------- ۲.۰۶ آیکونِ رویِ خودِ بلوکِ ard_pot_led: «نشان‌بده از چی ساخته شده» ----------
       ard_pot_led یک بلوکِ اختصاصی/میان‌بر است (توضیحش کنارِ خودِ تعریفش
       آمده). برای اینکه یادگیرنده هر وقت خواست بتواند ببیند پشتِ‌پرده‌ی این
       یک بلوک دقیقاً همان زنجیره‌ی «آنالوگ‌خوان ← نگاشت ← آنالوگ‌نویس»
       است، یک آیکونِ 🛠️ کلیک‌پذیر روی خودِ بلوک می‌گذاریم (نه توی منوی
       راست‌کلیک): با کلیک رویش، خودِ بلوک برداشته می‌شود و دقیقاً همان سه
       بلوکِ معمولیِ جعبه‌ابزار، به‌هم‌وصل و با همان پین‌هایی که کاربر رویش
       گذاشته بود، جای آن می‌نشینند؛ و رویِ همان بلوکِ تازه‌ساخته یک آیکونِ
       ↪️ می‌نشیند که دقیقاً همان بلوکِ فشرده‌ی اولیه را برمی‌گرداند.
       این آیکون‌ها با Blockly.FieldImage ساخته می‌شوند — خودِ این فیلد یک
       پارامترِ اختیاریِ «onClick» دارد (پارامترِ پنجم سازنده‌اش) که دقیقاً
       برای همین‌جور دکمه‌های رویِ بلوک ساخته شده؛ نیازی به هک یا override
       کردنِ چیزی نیست.
       عمداً از Mutator (همان دنده‌ای که مثلاً controls_if دارد) استفاده
       نمی‌کنیم — Mutator برای تغییرِ شکلِ برگشت‌پذیرِ یک بلوکِ واحد است، نه
       برای جایگزینیِ کاملِ آن با چند بلوکِ دیگر؛ این‌جا یک عملِ یک‌طرفه و
       صرفاً آموزشی می‌خواهیم. */
    function expandPotLedBlock(potLedBlock) {
      // توی فلای‌اوت (پیش‌نمایشِ جعبه‌ابزار) بلوک به هیچ بومِ کارِ واقعی‌ای
      // وصل نیست؛ کلیک رویِ آیکون آن‌جا نباید کاری بکند.
      if (!potLedBlock.workspace || potLedBlock.isInFlyout) return;
      const ledPinState = pinInputState(potLedBlock, 'LED_PIN', INPUT_DEFAULTS.ard_pot_led.LED_PIN);
      const potPinState = pinInputState(potLedBlock, 'POT_PIN', INPUT_DEFAULTS.ard_pot_led.POT_PIN);
      // برایِ آیکونِ بازگشت، خودِ بلوکِ فشرده را — پیش از حذف‌شدنش — عیناً
      // سریالایز می‌کنیم تا بعداً بشود دقیقاً همینش را دوباره ساخت.
      const compactState = stripBlockIds(Blockly.serialization.blocks.save(potLedBlock));
      const chainState = applyShadowDefaults({
        type: 'ard_analog_write',
        inputs: {
          PIN: { block: ledPinState },
          VALUE: { block: {
            type: 'ard_math_map',
            inputs: {
              X: { block: { type: 'ard_analog_read', inputs: { PIN: { block: potPinState } } } },
              IN_MIN: { block: numDef(0) },
              IN_MAX: { block: numDef(1023) },
              OUT_MIN: { block: numDef(0) },
              OUT_MAX: { block: numDef(255) }
            }
          } }
        }
      });
      const newBlock = replaceBlockWithState(potLedBlock, chainState, 'ساختِ بلوک‌های معادل برای ard_pot_led شکست خورد:');
      attachCollapseIcon(newBlock, compactState, 'بازگشت به بلوکِ فشرده‌ی «کنترلِ روشناییِ LED با ولوم»');
    }
    if (Blockly.Blocks['ard_pot_led']) {
      const originalPotLedInit = Blockly.Blocks['ard_pot_led'].init;
      Blockly.Blocks['ard_pot_led'].init = function () {
        originalPotLedInit.call(this);
        const potLedBlock = this;
        const wrenchField = new Blockly.FieldImage(
          POT_LED_ICON_SRC, 18, 18, '🛠️', () => setTimeout(() => expandPotLedBlock(potLedBlock), 0)
        );
        if (typeof wrenchField.setTooltip === 'function') {
          wrenchField.setTooltip('نشان‌بده این بلوک از چی ساخته شده (analogRead + map + analogWrite)');
        }
        potLedBlock.appendDummyInput('EXPAND_ICON').appendField(wrenchField);
        // بومِ کار RTL است: اولین ورودیِ لیستِ inputList سمتِ راستِ بلوک
        // رسم می‌شود. appendDummyInput آیکون را به انتهای لیست (سمتِ چپ)
        // می‌گذارد؛ با moveInputBefore آن را به جلوی LED_PIN می‌بریم تا
        // سمتِ راستِ بلوک بنشیند.
        if (typeof potLedBlock.moveInputBefore === 'function') {
          potLedBlock.moveInputBefore('EXPAND_ICON', 'LED_PIN');
        }
      };
    }

    /* ---------- ۲.۰۷ همان آیکونِ «نشان‌بده از چی ساخته شده» رویِ ard_if_pin ----------
       ard_if_pin هم یک بلوکِ اختصاصی/میان‌بر است: دقیقاً معادلِ یک controls_if
       است که شرطش logic_compare(digitalRead(PIN), STATE) باشد — یعنی همان
       چیزی که موقعِ تبدیلِ کدِ خام به بلوک (خطِ ۱۶۸۴) هم تشخیص داده می‌شود.
       با کلیک رویِ آیکون، خودِ بلوک برداشته می‌شود و همان زنجیره‌ی معمولیِ
       جعبه‌ابزار (logic_compare ← digitalRead + HIGH/LOW) با همان پین و
       همان بدنه‌ی DO/ELSه‌ای که کاربر رویش گذاشته بود، جای آن می‌نشیند —
       و همان‌جا، رویِ بلوکِ تازه‌ساخته، آیکونِ بازگشتِ ↪️ هم نشانده می‌شود. */
    function expandIfPinBlock(ifPinBlock) {
      // توی فلای‌اوت، بلوک به هیچ بومِ کارِ واقعی‌ای وصل نیست.
      if (!ifPinBlock.workspace || ifPinBlock.isInFlyout) return;
      const pinState = pinInputState(ifPinBlock, 'PIN', INPUT_DEFAULTS.ard_if_pin.PIN);
      const stateValue = ifPinBlock.getFieldValue('STATE');
      const doState = statementInputState(ifPinBlock, 'DO');
      const elseState = statementInputState(ifPinBlock, 'ELSE');
      // برایِ آیکونِ بازگشت، خودِ بلوکِ فشرده را — پیش از حذف‌شدنش — عیناً
      // سریالایز می‌کنیم تا بعداً بشود دقیقاً همینش را دوباره ساخت.
      const compactState = stripBlockIds(Blockly.serialization.blocks.save(ifPinBlock));
      const ifInputs = {
        IF0: { block: {
          type: 'logic_compare',
          fields: { OP: 'EQ' },
          inputs: {
            A: { block: { type: 'ard_digital_read', inputs: { PIN: { block: pinState } } } },
            B: { block: { type: 'ard_pin_state', fields: { STATE: stateValue } } }
          }
        } }
      };
      if (doState) ifInputs.DO0 = { block: doState };
      if (elseState) ifInputs.ELSE = { block: elseState };
      const chainState = applyShadowDefaults({
        type: 'controls_if',
        extraState: { elseIfCount: 0, hasElse: true },
        inputs: ifInputs
      });
      const newBlock = replaceBlockWithState(ifPinBlock, chainState, 'ساختِ بلوک‌های معادل برای ard_if_pin شکست خورد:');
      attachCollapseIcon(newBlock, compactState, 'بازگشت به بلوکِ فشرده‌ی «اگر پین ... بود»');
    }
    if (Blockly.Blocks['ard_if_pin']) {
      const originalIfPinInit = Blockly.Blocks['ard_if_pin'].init;
      Blockly.Blocks['ard_if_pin'].init = function () {
        originalIfPinInit.call(this);
        const ifPinBlock = this;
        const wrenchField = new Blockly.FieldImage(
          POT_LED_ICON_SRC, 18, 18, '🛠️', () => setTimeout(() => expandIfPinBlock(ifPinBlock), 0)
        );
        if (typeof wrenchField.setTooltip === 'function') {
          wrenchField.setTooltip('نشان‌بده این بلوک از چی ساخته شده (اگر + مقایسه‌ی منطقی + خواندنِ پین)');
        }
        ifPinBlock.appendDummyInput('EXPAND_ICON').appendField(wrenchField);
      };
    }

    /* ---------- ۲.۰۸ همان آیکونِ «نشان‌بده از چی ساخته شده» رویِ ard_servo_sweep ----------
       ard_servo_sweep هم یک بلوکِ اختصاصی/میان‌بر است: دقیقاً معادلِ دو
       حلقه‌ی for پشت‌سرهم است — یکی از ۰ تا ۱۸۰ و دیگری از ۱۸۰ تا ۰ — که
       هرکدام داخلِ خودش یک servo.write و یک delay دارد (همان چیزی که در
       مأموریتِ «کنترلِ زاویه‌ی سروو» با دست ساخته می‌شود). با کلیک رویِ
       آیکون، خودِ بلوک برداشته می‌شود و همین دو حلقه‌ی معمولیِ جعبه‌ابزار
       (controls_for ← ard_servo_write + ard_wait)، با همان سروو و همان
       مقدارِ تأخیری که کاربر رویش گذاشته بود، جای آن می‌نشینند — و رویِ
       بلوکِ تازه‌ساخته، آیکونِ بازگشتِ ↪️ هم نشانده می‌شود.
       برخلافِ ard_if_pin و ard_pot_led، این دو حلقه به یک متغیرِ شمارنده
       (نامِ «زاویه») نیاز دارند که رویِ خودِ بومِ کار ساخته/بازاستفاده
       می‌شود — نه یک بلوکِ ساده‌ی بی‌حالت. */
    // متغیرِ شمارنده‌ی حلقه را می‌سازد (یا اگر قبلاً با همین نام ساخته شده،
    // همان را برمی‌گرداند — createVariable خودِ Blockly این رفتار را دارد)
    // و آی‌دی‌اش را پس می‌دهد تا در فیلدِ VAR بلوکِ controls_for استفاده شود.
    function ensureLoopVar(workspace, name) {
      const varMap = workspace.getVariableMap();
      const existing = varMap.getVariable(name, '');
      if (existing) return existing.getId();
      return varMap.createVariable(name).getId();
    }
    function expandServoSweepBlock(sweepBlock) {
      // توی فلای‌اوت، بلوک به هیچ بومِ کارِ واقعی‌ای وصل نیست.
      if (!sweepBlock.workspace || sweepBlock.isInFlyout) return;
      const workspace = sweepBlock.workspace;
      const servoNameId = sweepBlock.getFieldValue('NAME');
      const msState = pinInputState(sweepBlock, 'MS', INPUT_DEFAULTS.ard_servo_sweep.MS);
      // برایِ آیکونِ بازگشت، خودِ بلوکِ فشرده را — پیش از حذف‌شدنش — عیناً
      // سریالایز می‌کنیم تا بعداً بشود دقیقاً همینش را دوباره ساخت.
      const compactState = stripBlockIds(Blockly.serialization.blocks.save(sweepBlock));
      const angleVarId = ensureLoopVar(workspace, 'زاویه');
      // بدنه‌ی هر حلقه: یک servo.write با مقدارِ همان متغیرِ شمارنده، و
      // بعدش یک delay با همان مقداری که کاربر روی خودِ بلوکِ فشرده گذاشته
      // بود (برایِ هر حلقه یک کپیِ جدا، چون نمی‌شود یک شیِ واحد را در دو
      // جای مختلفِ درختِ سریالایزیشن استفاده کرد).
      function loopBody() {
        return {
          type: 'ard_servo_write',
          fields: { NAME: servoNameId },
          inputs: { ANGLE: { block: { type: 'variables_get', fields: { VAR: angleVarId } } } },
          next: { block: { type: 'ard_wait', inputs: { MS: { block: JSON.parse(JSON.stringify(msState)) } } } }
        };
      }
      function forLoop(fromNum, toNum) {
        return {
          type: 'controls_for',
          fields: { VAR: angleVarId },
          inputs: {
            FROM: { block: numDef(fromNum) },
            TO: { block: numDef(toNum) },
            BY: { block: numDef(1) },
            DO: { block: loopBody() }
          }
        };
      }
      const chainState = applyShadowDefaults(Object.assign(forLoop(0, 180), {
        next: { block: forLoop(180, 0) }
      }));
      const newBlock = replaceBlockWithState(sweepBlock, chainState, 'ساختِ بلوک‌های معادل برای ard_servo_sweep شکست خورد:');
      attachCollapseIcon(newBlock, compactState, 'بازگشت به بلوکِ فشرده‌ی «نوسانِ سروو»');
    }
    if (Blockly.Blocks['ard_servo_sweep']) {
      const originalServoSweepInit = Blockly.Blocks['ard_servo_sweep'].init;
      Blockly.Blocks['ard_servo_sweep'].init = function () {
        originalServoSweepInit.call(this);
        const sweepBlock = this;
        const wrenchField = new Blockly.FieldImage(
          POT_LED_ICON_SRC, 18, 18, '🛠️', () => setTimeout(() => expandServoSweepBlock(sweepBlock), 0)
        );
        if (typeof wrenchField.setTooltip === 'function') {
          wrenchField.setTooltip('نشان‌بده این بلوک از چی ساخته شده (دو حلقه‌ی for + servo.write + delay)');
        }
        sweepBlock.appendDummyInput('EXPAND_ICON').appendField(wrenchField);
        // بومِ کار RTL است: آیکون را جلوی ورودیِ MS (تنها ورودیِ واقعیِ این
        // بلوک) می‌بریم تا سمتِ راستِ بلوک، کنارِ بقیه‌ی محتوا، دیده شود —
        // نه انتهایِ لیستِ فیلدها که عملاً از دید پنهان می‌ماند.
        if (typeof sweepBlock.moveInputBefore === 'function') {
          sweepBlock.moveInputBefore('EXPAND_ICON', 'MS');
        }
      };
    }

    /* ---------- ۲.۰۸.۵ اصلاحِ نمایشِ لیستِ ورودی‌ها روی بلوکِ «تابعی به نامِ» در RTL ----------
       procedures_defnoreturn/procedures_defreturn (خودِ Blockly، نه بلوکِ
       ما) لیستِ نامِ ورودی‌ها را با یک رشته‌ی متنیِ واحد در یک فیلد
       (PARAMS) نشان می‌دهند — چیزی مثلِ «با ورودی‌های: A, x» — که خودِ
       Blockly، با پیوستنِ this.arguments_ به‌هم، می‌سازد (updateParams_).
       چون این یک رشته‌ی متنیِ تنها است (نه چند فیلدِ جدا)، الگوریتمِ
       دوجهته‌ی مرورگر (Unicode Bidi) روی این رشته‌ی مخلوط (فارسی + چند
       نامِ لاتین جدا‌شده با ویرگول) اجرا می‌شود؛ و چون بومِ کار RTL است،
       مرورگر ترتیبِ همان تکه‌یِ لاتین (فهرستِ اسم‌ها) را برعکس نشان
       می‌دهد — دقیقاً همان چیزی که در تصویر دیده شد («x, A» به‌جایِ
       «A, x»). راه‌حلِ درست (و استانداردِ خودِ Unicode برایِ همین مسئله)
       این است که فهرستِ اسم‌ها را بینِ دو نویسه‌ی نامرئیِ «جداکننده‌ی
       یک‌طرفه‌ی چپ‌به‌راست» (LRI / U+2066) و «پایانِ جداکننده» (PDI /
       U+2069) بگذاریم — این‌طور مرورگر مجبور می‌شود همیشه همان تکه را،
       بدونِ توجه به جهتِ متنِ اطرافش، دقیقاً به همان ترتیبی که نوشته‌ایم
       (چپ‌به‌راست) نشان دهد. بعدِ از صدا زدنِ نسخه‌ی اصلیِ updateParams_
       (که خودِ Blockly برای بررسیِ ورودی‌های تکراری و هشدارها لازم دارد)
       فقط مقدارِ همان فیلد را با نسخه‌ی ایزوله‌شده جایگزین می‌کنیم. */
    function wrapParamsBidi(originalUpdateParams) {
      return function () {
        originalUpdateParams.call(this);
        if (this.arguments_ && this.arguments_.length && typeof this.setFieldValue === 'function') {
          const list = this.arguments_.join(', ');
          const wrapped = Blockly.Msg.PROCEDURES_BEFORE_PARAMS + ' \u2066' + list + '\u2069';
          Blockly.Events.disable();
          try { this.setFieldValue(wrapped, 'PARAMS'); }
          finally { Blockly.Events.enable(); }
        }
      };
    }
    ['procedures_defnoreturn', 'procedures_defreturn'].forEach((type) => {
      if (Blockly.Blocks[type] && typeof Blockly.Blocks[type].updateParams_ === 'function') {
        Blockly.Blocks[type].updateParams_ = wrapParamsBidi(Blockly.Blocks[type].updateParams_);
      }
    });

    /* ---------- ۲.۱ بلوکِ ترکیبیِ «چاپِ سریال» (متن ثابت + متغیر در یک بلوک) ----------
       این بلوک با defineBlocksWithJsonArray ساخته نشده (برخلافِ همه‌ی بلوک‌های
       بالا) چون به یک رفتارِ پویا نیاز دارد: یک بازشو («متنِ ثابت» / «متغیر»)
       که با انتخابِ هرکدام، فیلدِ ورودیِ متناظر (جعبه‌ی متن یا انتخاب‌گرِ
       متغیر) را نشان می‌دهد و آن‌یکی را پنهان می‌کند.
       نکته: هر دو فیلدِ VALUE و VAR در همان یک ردیفِ (appendDummyInput) قرار
       دارند — نه در ردیف‌های جداگانه — و فقط با field.setVisible() مخفی/آشکار
       می‌شوند، نه با input.setVisible(). این‌جوری بلوک همیشه یک‌ردیفه و جمع‌وجور
       می‌ماند، به‌جای این‌که برای هر حالت یک ردیفِ اضافه (و در نتیجه یک بلوکِ
       بلندتر) داشته باشیم.
       برای فعال/غیرفعال‌کردنِ ردیف، از یک اعتبارسنج (validator) روی خودِ
       فیلدِ بازشو استفاده می‌کنیم، نه از مکانیزمِ Mutator یا شنیدنِ رویدادِ
       BLOCK_CHANGE با onchange. دلیل: validator هر بار که مقدارِ فیلد عوض
       شود صدا زده می‌شود — چه با کلیکِ کاربر، چه وقتی کدِ خودمان موقعِ
       بازسازیِ بلوک از روی متن (codeToWorkspace) یا بارگذاریِ یک چیدمانِ
       ذخیره‌شده (loadWorkspaceSnapshot) مقدارِ فیلد را برنامه‌نویسی‌شده ست
       می‌کند — درحالی‌که در آن حالت‌ها رویدادهای بومِ کار معمولاً موقتاً
       خاموش‌اند و onchange اصلاً صدا زده نمی‌شود. با validator، ظاهرِ بلوک
       همیشه (چه با کلیکِ کاربر، چه با بارگذاریِ برنامه‌ای) با مقدارِ واقعیِ
       فیلد هماهنگ می‌ماند. */
    // پرچمِ «تعریف شد» را عمداً همین‌جا، بعد از موفقیتِ واقعیِ
    // defineBlocksWithJsonArray، ست می‌کنیم — نه در ابتدای تابع. اگر همان
    // تابع (مثلاً به‌خاطرِ یک تعریفِ بلوکِ نادرست) پرت کند، دفعه‌ی بعد که
    // ensureReady() دوباره صدا زده شود، این تابع هم واقعاً دوباره امتحان
    // می‌شود — نه اینکه برای همیشه فکر کند «قبلاً تعریف شده» درحالی‌که
    // نصفه‌ونیمه شکست خورده بوده.
    blocksDefined = true;
  }

  /* ------------------------------ 3. ژنراتورِ کد (بلوک ← متن) ------------------------------ */

  const Order = { ATOMIC: 0, NONE: 99 };

  // کلماتی که هرگز نباید به‌عنوانِ نامِ متغیر/تابعِ تولیدشده استفاده شوند —
  // چون یا کلیدواژه‌ی خودِ زبان‌اند یا نامِ یکی از توابعِ داخلی/سراسری‌اند.
  const RESERVED_WORDS = [
    'void', 'int', 'float', 'double', 'long', 'short', 'byte', 'char', 'bool', 'boolean',
    'unsigned', 'signed', 'const', 'static', 'auto', 'word', 'size_t',
    'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'goto', 'new', 'delete', 'true', 'false', 'setup', 'loop',
    'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN',
    'PI', 'HALF_PI', 'TWO_PI', 'String', 'Servo', 'Serial',
    'pinMode', 'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead',
    'millis', 'micros', 'random', 'randomSeed', 'map', 'constrain', 'abs', 'min', 'max',
    'pow', 'sqrt', 'sq', 'tone', 'noTone', 'delay', 'delayMicroseconds',
    'attach', 'detach', 'write', 'read', 'writeMicroseconds', 'attached',
    'begin', 'print', 'println', 'available',
    'A0', 'A1', 'A2', 'A3', 'A4', 'A5'
  ].join(',');

  let arduinoGenerator = null;

  function buildGenerator() {
    const Blockly = window.Blockly;
    const gen = new Blockly.Generator('Arduino');
    gen.INDENT = '  ';

    gen.init = function (workspace) {
      this.nameDB_ = new Blockly.Names(RESERVED_WORDS);
      this.nameDB_.setVariableMap(workspace.getVariableMap());
      this.nameDB_.populateVariables(workspace);
      if (typeof this.nameDB_.populateProcedures === 'function') this.nameDB_.populateProcedures(workspace);
      this._funcNames = new Map();
      this._funcCounter = 0;
    };
    gen.finish = function (code) { return code; };
    gen.scrubNakedValue = function (line) { return line + ';\n'; };
    gen.scrub_ = function (block, code, opt_thisOnly) {
      const next = block.nextConnection && block.nextConnection.targetBlock();
      const nextCode = (opt_thisOnly || !next) ? '' : gen.blockToCode(next);
      return code + nextCode;
    };

    gen.safeVar = function (idOrName) {
      return this.nameDB_.getName(idOrName, Blockly.Names.NameType.VARIABLE);
    };
    gen.safeFunc = function (rawName) {
      if (!this._funcNames.has(rawName)) {
        this._funcCounter++;
        this._funcNames.set(rawName, 'func' + this._funcCounter);
      }
      return this._funcNames.get(rawName);
    };

    function val(block, name, def) {
      const code = gen.valueToCode(block, name, Order.ATOMIC);
      return code || def;
    }
    function fieldVarName(block, fieldName) {
      const id = block.getFieldValue(fieldName);
      return gen.safeVar(id);
    }
    function displayName(block, fieldName) {
      const field = block.getField(fieldName);
      try { return field ? field.getText() : ''; } catch (e) { return ''; }
    }
    function escapeStr(s) {
      return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
    }

    const F = gen.forBlock;

    /* --- رویدادها --- */
    F['ard_setup'] = (b) => '';
    F['ard_loop'] = (b) => '';
    F['ard_global'] = (b) => gen.statementToCode(b, 'DO');
    F['ard_comment'] = (b) => '// ' + String(b.getFieldValue('TEXT')).replace(/\n/g, ' ') + '\n';
    F['ard_raw_code'] = (b) => {
      const code = String(b.getFieldValue('CODE') || '');
      return code.endsWith('\n') ? code : code + '\n';
    };

    /* --- کنترل --- */
    F['ard_wait'] = (b) => 'delay(' + val(b, 'MS', '500') + ');\n';
    F['ard_wait_micro'] = (b) => 'delayMicroseconds(' + val(b, 'US', '500') + ');\n';

    F['controls_if'] = (b) => {
      let code = '', n = 0;
      do {
        let cond = val(b, 'IF' + n, 'false');
        if (b.workspace && b.workspace.__halMode) cond = stripOuterParens(cond);
        const branch = gen.statementToCode(b, 'DO' + n);
        code += (n === 0 ? 'if (' : 'else if (') + cond + ') {\n' + branch + '}\n';
        n++;
      } while (b.getInput('IF' + n));
      if (b.getInput('ELSE')) code += 'else {\n' + gen.statementToCode(b, 'ELSE') + '}\n';
      return code;
    };
    F['controls_whileUntil'] = (b) => {
      const until = b.getFieldValue('MODE') === 'UNTIL';
      let cond = val(b, 'BOOL', 'false');
      if (until) cond = '!(' + cond + ')';
      return 'while (' + cond + ') {\n' + gen.statementToCode(b, 'DO') + '}\n';
    };
    F['controls_repeat_ext'] = (b) => {
      const times = val(b, 'TIMES', '10');
      const depth = gen._repeatDepth || 0;
      const names = ['i', 'j', 'k', 'l', 'm', 'n'];
      const v = names[depth] || ('i' + depth);
      gen._repeatDepth = depth + 1;
      const body = gen.statementToCode(b, 'DO');
      gen._repeatDepth = depth;
      return 'for (int ' + v + ' = 0; ' + v + ' < ' + times + '; ' + v + '++) {\n' + body + '}\n';
    };
    F['controls_for'] = (b) => {
      const varName = fieldVarName(b, 'VAR');
      const from = val(b, 'FROM', '0');
      const to = val(b, 'TO', '10');
      const body = gen.statementToCode(b, 'DO');
      // اگر هر سه‌یِ از/به/گام دقیقاً یک بلوکِ «عدد» (نه متغیر، نه عبارت) باشند،
      // جهتِ حلقه از همین الان (زمانِ ساختِ کد) معلوم است — کدِ تمیزِ همیشگی
      // تولید می‌کنیم. وگرنه (وقتی هرکدام از این سه از یک متغیر/عبارت می‌آید)
      // نمی‌شود جهت را از قبل فهمید، پس یک شرط/گامِ امن برای هر دو جهت
      // می‌سازیم که به مقدارِ واقعیِ «از» و «به» در لحظه‌ی اجرا روی برد نگاه می‌کند.
      const isNum = (blk) => blk && blk.type === 'math_number';
      const fromBlk = b.getInputTargetBlock('FROM');
      const toBlk = b.getInputTargetBlock('TO');
      const byBlk = b.getInputTargetBlock('BY');
      if (isNum(fromBlk) && isNum(toBlk) && isNum(byBlk)) {
        const fromNum = Number(fromBlk.getFieldValue('NUM'));
        const toNum = Number(toBlk.getFieldValue('NUM'));
        const stepAbs = Math.abs(Number(byBlk.getFieldValue('NUM'))) || 1;
        const op = fromNum <= toNum ? '<=' : '>=';
        const step2 = fromNum <= toNum ? '+=' : '-=';
        return 'for (int ' + varName + ' = ' + from + '; ' + varName + ' ' + op + ' ' + to + '; ' + varName + ' ' + step2 + ' ' + stepAbs + ') {\n' + body + '}\n';
      }
      const by = val(b, 'BY', '1');
      const up = '(' + to + ' >= ' + from + ')';
      return 'for (int ' + varName + ' = ' + from + '; ' + up + ' ? (' + varName + ' <= ' + to + ') : (' + varName + ' >= ' + to + '); ' + varName + ' += (' + up + ' ? abs(' + by + ') : -abs(' + by + '))) {\n' + body + '}\n';
    };
    F['controls_flow_statements'] = (b) => (b.getFieldValue('FLOW') === 'BREAK' ? 'break;\n' : 'continue;\n');

    /* --- منطق --- */
    F['logic_compare'] = (b) => {
      const map = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
      return ['(' + val(b, 'A', '0') + ' ' + map[b.getFieldValue('OP')] + ' ' + val(b, 'B', '0') + ')', Order.ATOMIC];
    };
    F['logic_operation'] = (b) => {
      const op = b.getFieldValue('OP') === 'AND' ? '&&' : '||';
      return ['(' + val(b, 'A', 'false') + ' ' + op + ' ' + val(b, 'B', 'false') + ')', Order.ATOMIC];
    };
    F['logic_negate'] = (b) => ['(!(' + val(b, 'BOOL', 'false') + '))', Order.ATOMIC];
    F['logic_boolean'] = (b) => [b.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', Order.ATOMIC];

    /* --- ریاضی --- */
    F['math_number'] = (b) => {
      const n = Number(b.getFieldValue('NUM'));
      return [String(n), Order.ATOMIC];
    };
    F['math_arithmetic'] = (b) => {
      const opField = b.getFieldValue('OP');
      if (opField === 'POWER') return ['pow(' + val(b, 'A', '0') + ', ' + val(b, 'B', '0') + ')', Order.ATOMIC];
      const map = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/' };
      return ['(' + val(b, 'A', '0') + ' ' + map[opField] + ' ' + val(b, 'B', '0') + ')', Order.ATOMIC];
    };
    F['math_modulo'] = (b) => ['(' + val(b, 'DIVIDEND', '0') + ' % ' + val(b, 'DIVISOR', '1') + ')', Order.ATOMIC];
    F['math_constrain'] = (b) => ['constrain(' + val(b, 'VALUE', '0') + ', ' + val(b, 'LOW', '0') + ', ' + val(b, 'HIGH', '0') + ')', Order.ATOMIC];
    F['math_random_int'] = (b) => ['random(' + val(b, 'FROM', '0') + ', (' + val(b, 'TO', '0') + ') + 1)', Order.ATOMIC];
    F['math_single'] = (b) => ['sqrt(' + val(b, 'NUM', '0') + ')', Order.ATOMIC]; // fallback نادر — معمولاً از ard_math_single استفاده می‌کنیم
    F['ard_math_single'] = (b) => [b.getFieldValue('FUNC') + '(' + val(b, 'A', '0') + ')', Order.ATOMIC];
    F['ard_math_map'] = (b) => ['map(' + val(b, 'X', '0') + ', ' + val(b, 'IN_MIN', '0') + ', ' + val(b, 'IN_MAX', '1023') + ', ' + val(b, 'OUT_MIN', '0') + ', ' + val(b, 'OUT_MAX', '255') + ')', Order.ATOMIC];

    /* --- متن --- */
    F['text'] = (b) => [escapeStr(b.getFieldValue('TEXT')), Order.ATOMIC];
    F['text_join'] = (b) => {
      const n = b.itemCount_ !== undefined ? b.itemCount_ : 2;
      const parts = [];
      for (let i = 0; i < n; i++) parts.push(val(b, 'ADD' + i, escapeStr('')));
      return ['(' + (parts.length ? parts.join(' + ') : escapeStr('')) + ')', Order.ATOMIC];
    };
    F['ard_serial_begin'] = (b) => 'Serial.begin(' + b.getFieldValue('BAUD') + ');\n';
    F['ard_serial_print'] = (b) => {
      const fn = b.getFieldValue('NEWLINE') === 'TRUE' ? 'println' : 'print';
      return 'Serial.' + fn + '(' + val(b, 'VALUE', escapeStr('')) + ');\n';
    };

    /* --- پایه‌ها --- */
    F['ard_pin_mode'] = (b) => 'pinMode(' + val(b, 'PIN', '8') + ', ' + b.getFieldValue('MODE') + ');\n';
    F['ard_digital_write'] = (b) => 'digitalWrite(' + val(b, 'PIN', '8') + ', ' + b.getFieldValue('STATE') + ');\n';
    F['ard_digital_read'] = (b) => ['digitalRead(' + val(b, 'PIN', '2') + ')', Order.ATOMIC];
    F['ard_if_pin'] = (b) => {
      const cond = 'digitalRead(' + val(b, 'PIN', '2') + ') == ' + b.getFieldValue('STATE');
      let code = 'if (' + cond + ') {\n' + gen.statementToCode(b, 'DO') + '}\n';
      const elseCode = gen.statementToCode(b, 'ELSE');
      if (elseCode.trim()) code += 'else {\n' + elseCode + '}\n';
      return code;
    };
    F['ard_analog_write'] = (b) => 'analogWrite(' + val(b, 'PIN', '9') + ', ' + val(b, 'VALUE', '0') + ');\n';
    F['ard_analog_read'] = (b) => ['analogRead(' + val(b, 'PIN', 'A0') + ')', Order.ATOMIC];
    F['ard_pot_led'] = (b) => 'analogWrite(' + val(b, 'LED_PIN', '9') + ', map(analogRead(' + val(b, 'POT_PIN', 'A0') + '), 0, 1023, 0, 255));\n';
    F['ard_pin_state'] = (b) => [b.getFieldValue('STATE'), Order.ATOMIC];
    // مقدارِ بازشو مستقیماً همان چیزی است که در کد می‌آید: «13» یا «A0»
    // (A0..A5 را خودِ شبیه‌ساز با #define به عددشان ترجمه می‌کند).
    F['ard_pin_number'] = (b) => [b.getFieldValue('PIN'), Order.ATOMIC];

    /* --- STM32 / HAL --- */
    const halPort = (pin) => 'GPIO' + pin[1];
    const halMask = (pin) => 'GPIO_PIN_' + pin.slice(2);
    F['hal_write'] = (b) => { const p = b.getFieldValue('PIN'); return 'HAL_GPIO_WritePin(' + halPort(p) + ', ' + halMask(p) + ', ' + b.getFieldValue('LEVEL') + ');\n'; };
    F['hal_toggle'] = (b) => { const p = b.getFieldValue('PIN'); return 'HAL_GPIO_TogglePin(' + halPort(p) + ', ' + halMask(p) + ');\n'; };
    F['hal_read'] = (b) => { const p = b.getFieldValue('PIN'); return ['HAL_GPIO_ReadPin(' + halPort(p) + ', ' + halMask(p) + ')', Order.ATOMIC]; };
    F['hal_level'] = (b) => [b.getFieldValue('LEVEL'), Order.ATOMIC];
    F['hal_delay'] = (b) => 'HAL_Delay(' + val(b, 'MS', '500') + ');\n';
    F['hal_pwm_start'] = (b) => 'HAL_TIM_PWM_Start(&htim' + b.getFieldValue('TIM') + ', TIM_CHANNEL_' + b.getFieldValue('CH') + ');\n';
    F['hal_set_compare'] = (b) => '__HAL_TIM_SET_COMPARE(&htim' + b.getFieldValue('TIM') + ', TIM_CHANNEL_' + b.getFieldValue('CH') + ', ' + val(b, 'VAL', '0') + ');\n';

    /* --- متغیرها --- */
    F['ard_var_declare'] = (b) => {
      const t = b.getFieldValue('TYPE');
      const name = fieldVarName(b, 'NAME');
      if (b.workspace && b.workspace.__halMode) return t + ' ' + name + ' = ' + val(b, 'VALUE', '0') + ';\n';
      return t + ' ' + name + ' = ' + val(b, 'VALUE', '0') + '; // ' + displayName(b, 'NAME') + '\n';
    };
    F['variables_get'] = (b) => [fieldVarName(b, 'VAR'), Order.ATOMIC];
    F['variables_set'] = (b) => fieldVarName(b, 'VAR') + ' = ' + val(b, 'VALUE', '0') + ';\n';
    F['math_change'] = (b) => {
      const name = fieldVarName(b, 'VAR');
      return name + ' = ' + name + ' + (' + val(b, 'DELTA', '1') + ');\n';
    };

    /* --- آرایه‌ها --- */
    F['ard_array_declare'] = (b) => {
      const t = b.getFieldValue('TYPE');
      const name = fieldVarName(b, 'NAME');
      return t + ' ' + name + '[' + val(b, 'SIZE', '1') + ']; // ' + displayName(b, 'NAME') + '\n';
    };
    F['ard_array_get'] = (b) => [fieldVarName(b, 'NAME') + '[' + val(b, 'INDEX', '0') + ']', Order.ATOMIC];
    F['ard_array_set'] = (b) => fieldVarName(b, 'NAME') + '[' + val(b, 'INDEX', '0') + '] = ' + val(b, 'VALUE', '0') + ';\n';
    F['ard_array_length'] = (b) => [fieldVarName(b, 'NAME') + '.length', Order.ATOMIC];

    /* --- سروو --- */
    F['ard_servo_declare'] = (b) => 'Servo ' + fieldVarName(b, 'NAME') + '; // ' + displayName(b, 'NAME') + '\n';
    F['ard_servo_attach'] = (b) => fieldVarName(b, 'NAME') + '.attach(' + val(b, 'PIN', '9') + ');\n';
    F['ard_servo_write'] = (b) => fieldVarName(b, 'NAME') + '.write(' + val(b, 'ANGLE', '90') + ');\n';
    F['ard_servo_sweep'] = (b) => {
      const name = fieldVarName(b, 'NAME');
      const ms = val(b, 'MS', '15');
      const v = 'servoAngle';
      return 'for (int ' + v + ' = 0; ' + v + ' <= 180; ' + v + '++) {\n' +
        '  ' + name + '.write(' + v + ');\n' +
        '  delay(' + ms + ');\n' +
        '}\n' +
        'for (int ' + v + ' = 180; ' + v + ' >= 0; ' + v + '--) {\n' +
        '  ' + name + '.write(' + v + ');\n' +
        '  delay(' + ms + ');\n' +
        '}\n';
    };
    F['ard_servo_read'] = (b) => [fieldVarName(b, 'NAME') + '.read()', Order.ATOMIC];
    F['ard_servo_detach'] = (b) => fieldVarName(b, 'NAME') + '.detach();\n';

    /* --- Wi-Fi و وب‌سرور (ESP32) --- */
    F['ard_server_declare'] = (b) => 'WebServer server(' + (Number(b.getFieldValue('PORT')) || 80) + ');\n';
    F['ard_wifi_begin'] = (b) => 'WiFi.begin(' + val(b, 'SSID', escapeStr('')) + ', ' + val(b, 'PASS', escapeStr('')) + ');\n';
    F['ard_wifi_wait'] = (b) => 'while (WiFi.status() != WL_CONNECTED) {\n  delay(' + (Number(b.getFieldValue('MS')) || 500) + ');\n}\n';
    F['ard_wifi_ip'] = (b) => ['WiFi.localIP()', Order.ATOMIC];
    F['ard_server_on'] = (b) => 'server.on(' + escapeStr(b.getFieldValue('PATH')) + ', ' + gen.safeFunc(String(b.getFieldValue('FUNC'))) + ');\n';
    F['ard_server_begin'] = (b) => 'server.begin();\n';
    F['ard_server_handle'] = (b) => 'server.handleClient();\n';
    F['ard_server_send'] = (b) => 'server.send(' + b.getFieldValue('CODE') + ', "text/plain", ' + val(b, 'TEXT', escapeStr('')) + ');\n';

    /* --- توابعِ من --- */
    function procParams(b) {
      if (typeof b.getVars === 'function') return b.getVars();
      if (Array.isArray(b.arguments_)) return b.arguments_;
      return [];
    }
    F['procedures_defnoreturn'] = (b) => {
      const name = gen.safeFunc(b.getFieldValue('NAME'));
      const params = procParams(b).map((p) => 'int ' + gen.safeVar(p));
      const body = gen.statementToCode(b, 'STACK');
      return 'void ' + name + '(' + params.join(', ') + ') {\n' + body + '} // ' + b.getFieldValue('NAME') + '\n';
    };
    F['procedures_defreturn'] = (b) => {
      const name = gen.safeFunc(b.getFieldValue('NAME'));
      const params = procParams(b).map((p) => 'int ' + gen.safeVar(p));
      const body = gen.statementToCode(b, 'STACK');
      const ret = val(b, 'RETURN', '0');
      return 'int ' + name + '(' + params.join(', ') + ') {\n' + body + '  return ' + ret + ';\n} // ' + b.getFieldValue('NAME') + '\n';
    };
    F['procedures_callnoreturn'] = (b) => {
      const name = gen.safeFunc(b.getFieldValue('NAME'));
      const params = procParams(b);
      const args = params.map((p, i) => val(b, 'ARG' + i, '0'));
      return name + '(' + args.join(', ') + ');\n';
    };
    F['procedures_callreturn'] = (b) => {
      const name = gen.safeFunc(b.getFieldValue('NAME'));
      const params = procParams(b);
      const args = params.map((p, i) => val(b, 'ARG' + i, '0'));
      return [name + '(' + args.join(', ') + ')', Order.ATOMIC];
    };

    arduinoGenerator = gen;
  }

  /* ------------------------------ 4. جعبه‌ابزار (Toolbox) ------------------------------ */

  const CORE_BLOCKS = ['ard_setup', 'ard_loop', 'ard_global', 'ard_comment', 'ard_wait', 'math_number'];

  // این‌که هر مأموریت دقیقاً به کدام بلوک‌ها نیاز دارد — تا بچه‌ها در جعبه‌ابزار
  // غرق نشوند. کلیدها همان کلیدهای TASKS در arduino-sim.js هستند.
  //
  // این پیکربندی حالا در فایلِ جدایِ arduino-mission-blocks.js نگه داشته
  // می‌شود (باید قبل از همین فایل در HTML لود شود) تا بشود بدونِ دست‌زدن به
  // این فایل، فقط همان‌جا لیستِ بلوک‌های هر مأموریت را ویرایش کرد. اگر آن
  // فایل لود نشده باشد (مثلاً فراموش شد اضافه‌اش کنیم)، همین نسخه‌ی پیش‌فرض
  // این‌جا به‌عنوانِ نگهبان استفاده می‌شود تا چیزی خراب نشود.
  const DEFAULT_MISSION_BLOCKS = {
    serial: ['ard_serial_begin', 'ard_serial_print', 'text'],
    ledOn: ['ard_pin_mode', 'ard_digital_write', 'ard_var_declare', 'variables_get'],
    blink: ['ard_pin_mode', 'ard_digital_write'],
    button: ['ard_pin_mode', 'ard_digital_write', 'ard_digital_read', 'ard_if_pin', 'controls_if', 'logic_compare', 'ard_pin_state'],
    pot: ['ard_pin_mode', 'ard_pot_led', 'ard_analog_read', 'ard_analog_write', 'ard_math_map', 'math_arithmetic'],
    servo: ['ard_servo_declare', 'ard_servo_attach', 'ard_servo_write', 'ard_servo_sweep', 'ard_servo_read', 'ard_servo_detach', 'controls_for', 'ard_wait', 'variables_get'],
    esp32wifi: ['ard_serial_begin', 'ard_serial_print', 'ard_pin_mode', 'ard_digital_write', 'ard_var_declare', 'variables_get',
      'ard_server_declare', 'ard_wifi_begin', 'ard_wifi_wait', 'ard_wifi_ip', 'ard_server_on', 'ard_server_begin', 'ard_server_handle', 'ard_server_send', '__PROCEDURES__']
  };

  // هر بار (نه فقط یک‌بار موقعِ لودشدنِ اسکریپت) خوانده می‌شود، تا اگر
  // arduino-mission-blocks.js بعداً لود/ویرایش شد هم بدونِ رفرشِ اضافه اثرش
  // دیده شود.
  function getMissionBlocksConfig() {
    if (typeof window !== 'undefined' && window.ARDUINO_MISSION_BLOCKS) return window.ARDUINO_MISSION_BLOCKS;
    return DEFAULT_MISSION_BLOCKS;
  }

  function fullToolboxDef() {
    const cat = (name, colour, contents) => ({ kind: 'category', name, colour, contents });
    // هر بلوکی که از جعبه‌ابزار بیرون کشیده شود، ورودی‌هایش از قبل با
    // مقدارهای پیش‌فرضِ INPUT_DEFAULTS پر است (پینِ آماده، عدد، متن) — دیگر
    // لازم نیست کاربر برای هر سوکت، یک بلوکِ عدد از دسته‌ی «ریاضی» بکشد.
    const blk = (type, fields) => {
      const b = { kind: 'block', type };
      if (fields) b.fields = fields;
      const inputs = defaultInputs(type);
      if (inputs) b.inputs = inputs;
      return b;
    };
    // یک نسخه‌ی جدا برای «اگر ... وگرنه» در جعبه‌ابزار: همان بلوکِ
    // controls_if است (چون از نظرِ بلاکلی یک بلوکِ واحد با موتاتور است، نه
    // دو بلوکِ متفاوت)، فقط با extraState از قبل روی hasElse:true تنظیم شده
    // تا بخشِ «وگرنه» از همان اول، بدونِ نیاز به باز کردنِ آیکونِ دنده‌ای،
    // روی بلوک دیده شود. تبدیلِ کد → بلوک هم (خطِ ~1412) دقیقاً همین
    // extraState را برای دستوراتِ if/else می‌سازد.
    const blkIfElse = () => ({ kind: 'block', type: 'controls_if', extraState: { hasElse: true } });
    return [
      cat('شروع', COLOR.event, [blk('ard_setup'), blk('ard_loop'), blk('ard_global'), blk('ard_comment')]),
      cat('کنترل', COLOR.control, [
        blk('controls_if'), blkIfElse(), blk('controls_repeat_ext'), blk('controls_whileUntil'),
        blk('controls_for'), blk('controls_flow_statements'), blk('ard_wait'), blk('ard_wait_micro')
      ]),
      cat('پایه‌ها (پین‌ها)', COLOR.pin, [
        blk('ard_pin_mode'), blk('ard_digital_write'), blk('ard_digital_read'), blk('ard_if_pin'),
        blk('ard_analog_write'), blk('ard_analog_read'), blk('ard_pot_led'), blk('ard_pin_state'), blk('ard_pin_number')
      ]),
      cat('متغیرها', COLOR.variable, [blk('ard_var_declare'), blk('variables_get'), blk('variables_set')]),
      cat('آرایه‌ها', COLOR.array, [blk('ard_array_declare'), blk('ard_array_get'), blk('ard_array_set'), blk('ard_array_length')]),
      cat('ریاضی', COLOR.math, [
        blk('math_number'), blk('math_arithmetic'), blk('ard_math_single'),
        blk('math_modulo'), blk('math_constrain'), blk('math_random_int'), blk('ard_math_map')
      ]),
      cat('منطق', COLOR.logic, [blk('logic_compare'), blk('logic_operation'), blk('logic_negate'), blk('logic_boolean')]),
      cat('متن و سریال', COLOR.text, [blk('ard_serial_begin'), blk('ard_serial_print')]),
      cat('سروو موتور', COLOR.servo, [blk('ard_servo_declare'), blk('ard_servo_attach'), blk('ard_servo_write'), blk('ard_servo_sweep'), blk('ard_servo_read'), blk('ard_servo_detach')]),
      cat('Wi-Fi و وب‌سرور', COLOR.wifi, [
        blk('ard_server_declare'), blk('ard_wifi_begin'), blk('ard_wifi_wait'), blk('ard_wifi_ip'),
        blk('ard_server_on'), blk('ard_server_begin'), blk('ard_server_handle'), blk('ard_server_send')
      ]),
      cat('کدِ خام', COLOR.raw, [blk('ard_raw_code')]),
      { kind: 'category', name: 'توابعِ من', colour: COLOR.func, custom: 'PROCEDURE' }
    ];
  }

  // اگر allowedTypes بدهیم، فقط همان بلوک‌ها را (در دسته‌ی خودشان) نگه می‌داریم
  // و دسته‌های خالی را کلاً حذف می‌کنیم؛ اگر ندهیم، جعبه‌ابزارِ کامل برمی‌گردد.
  function buildToolbox(allowedTypes) {
    const full = fullToolboxDef();
    if (!allowedTypes) return { kind: 'categoryToolbox', contents: full };
    const allowed = new Set(allowedTypes);
    const filtered = full
      .map((c) => {
        if (c.custom) return allowed.has('__PROCEDURES__') ? c : null;
        const contents = (c.contents || []).filter((b) => allowed.has(b.type));
        return contents.length ? Object.assign({}, c, { contents }) : null;
      })
      .filter(Boolean);
    return { kind: 'categoryToolbox', contents: filtered.length ? filtered : full };
  }

  function missionToolboxTypes(taskKey) {
    const extra = getMissionBlocksConfig()[taskKey];
    if (!extra) return null; // مأموریتِ ناشناخته → جعبه‌ابزارِ کامل، امن‌تر از خالی نشان‌دادن
    return CORE_BLOCKS.concat(extra);
  }

  /* ------------------------------ 5. ساختِ فضایِ‌کار ------------------------------ */

  // بلوک‌های «هت» که ذاتاً باید مستقل و بی‌والد روی بوم بمانند — نه فقط
  // اجازه دارند، بلکه اصلاً previousConnection ندارند تا بشود جایی
  // چسباندشان (ard_setup/ard_loop/ard_global خودشان، و تعریفِ توابع).
  const STANDALONE_TYPES = new Set(['ard_setup', 'ard_loop', 'ard_global', 'procedures_defnoreturn', 'procedures_defreturn']);

  // بلوکِ «سراسری» را روی بوم پیدا می‌کند؛ اگر نبود، خودش یکی می‌سازد —
  // یعنی همیشه یک مقصدِ آماده برای بلوک‌های رهاشده وجود دارد.
  // بلوکِ «سراسری» همیشه روی بوم هست و پاک‌شدنی نیست (فقط محتوایش پاک می‌شود).
  // ساختنش در undo ثبت نمی‌شود تا Ctrl+Z هم نتواند آن را بردارد.
  function findOrCreateGlobalBlock(workspace) {
    const top = workspace.getTopBlocks(false);
    for (const b of top) {
      if (b.type === 'ard_global') { b.setDeletable(false); return b; }
    }
    const Blockly = window.Blockly;
    let gBlock;
    Blockly.Events.disable();
    try {
      gBlock = workspace.newBlock('ard_global');
      gBlock.setDeletable(false);
      gBlock.initSvg();
      gBlock.render();
      gBlock.moveBy(30, 30);
    } finally {
      Blockly.Events.enable();
    }
    return gBlock;
  }

  // اگر بعدِ کشیدن‌ورهاکردن (یا بیرون‌آوردن از جعبه‌ابزار)، یک بلوکِ
  // استیتمنت بدونِ والد روی بوم بماند، به‌جای اینکه معلق («روی هوا») رها
  // شود، خودش را به انتهای بلوکِ «سراسری» می‌چسباند.
  function reattachIfFloating(workspace, block) {
    if (!block || block.isDisposed()) return;
    if (STANDALONE_TYPES.has(block.type)) return;
    if (!block.previousConnection) return; // یک بلوکِ مقداریِ تنها، اصلاً جایی برای چسباندن ندارد
    if (block.previousConnection.targetConnection) return; // از قبل به چیزی وصل است
    const Blockly = window.Blockly;
    Blockly.Events.setGroup(true);
    try {
      const g = (workspace.__halMode && workspace.getTopBlocks(false).find((x) => x.type === 'ard_loop')) || findOrCreateGlobalBlock(workspace);
      const doInput = g.getInput('DO');
      if (!doInput || !doInput.connection) return;
      let target = doInput.connection;
      if (target.targetConnection) {
        let last = target.targetBlock();
        while (last.getNextBlock()) last = last.getNextBlock();
        target = last.nextConnection;
      }
      target.connect(block.previousConnection);
    } finally {
      Blockly.Events.setGroup(false);
    }
  }

  function createWorkspace(divEl, taskKey) {
    const Blockly = window.Blockly;
    const theme = Blockly.Theme.defineTheme('arduinoQuestDark', {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: '#0d1117',
        toolboxBackgroundColour: '#161c28',
        toolboxForegroundColour: '#e9edf5',
        flyoutBackgroundColour: '#161c28',
        flyoutForegroundColour: '#e9edf5',
        flyoutOpacity: 1,
        scrollbarColour: '#3a4356',
        insertionMarkerColour: '#57d8a3',
        insertionMarkerOpacity: 0.4,
        cursorColour: '#57d8a3'
      },
      fontStyle: { family: "'Vazirmatn', sans-serif", weight: 'bold', size: 11 }
    });
    const halMode = isHalTask(taskKey);
    const missionTypes = halMode ? null : missionToolboxTypes(taskKey);
    const workspace = Blockly.inject(divEl, {
      toolbox: halMode ? halToolbox(taskKey) : buildToolbox(missionTypes),
      renderer: 'zelos',
      theme,
      rtl: true,
      trashcan: true,
      sounds: false,
      // پیش‌فرضِ خودِ Blockly برای media سرورِ دموی گوگل است
      // (blockly-demo.appspot.com) — نه یک CDN قابلِ‌اتکا؛ همین باعث می‌شود
      // آیکون‌های سطلِ‌آشغال/زوم گاهی لود نشوند. یک پوشه‌ی «blockly-media»
      // را عیناً از node_modules/blockly/media کپی کن و دقیقاً کنارِ همین
      // فایل (arduino-blocks.js) روی سرور بگذار. مسیرِ زیر را خودمان، از
      // رویِ آدرسِ واقعیِ خودِ همین فایل (SELF_SRC) می‌سازیم — نه یک رشته‌ی
      // نسبیِ ثابت — چون media همیشه نسبت‌به صفحه/iframeِ در حالِ اجرا
      // (یعنی blockly-editor.html) حل می‌شود، نه نسبت‌به arduino-blocks.js؛
      // با ساختنِ آدرسِ کامل و مطلق این‌جا، دیگر فرقی نمی‌کند iframe از کدام
      // مسیر/دامنه بارگذاری شده باشد.
      media: SELF_DIR ? (SELF_DIR + '../../blockly-media/') : 'blockly-media/',
      zoom: { controls: true, wheel: true, startScale: 1.2, maxScale: 1.2, minScale: 0.3 },
      grid: { spacing: 24, length: 2, colour: '#232b3a', snap: true },
      move: { scrollbars: true, drag: true, wheel: true }
    });
    workspace.__ardTaskKey = taskKey;
    workspace.__halMode = halMode;
    workspace.__ardShowAll = !missionTypes; // اگر مأموریت شناخته‌نشده بود، از اول روی «همه» است
    if (missionTypes) attachToolboxScopeToggle(workspace, divEl);
    if (halMode) {
      // هشدارِ «این پایه در Cube تنظیم نشده» با هر ساخت/تغییرِ بلوک تازه می‌شود
      workspace.addChangeListener((e) => {
        if (e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE) refreshHal(workspace);
      });
    }
    try {
      const flyoutFn = (Blockly.Procedures && Blockly.Procedures.flyoutCategory) ||
        (Blockly.procedures && Blockly.procedures.flyoutCategory);
      if (flyoutFn) workspace.registerToolboxCategoryCallback('PROCEDURE', flyoutFn);
    } catch (e) { /* اگر نامِ داخلی فرق داشت، دسته‌ی توابع فقط دو بلوکِ اصلی را کم می‌آورد؛ بقیه سالم است */ }
    // هر بار کشیدن‌ورهاکردنِ یک بلوک (چه از جعبه‌ابزار، چه جابه‌جاییِ یکی
    // از بلوک‌های خودِ بوم) که تمام شود، بررسی می‌کنیم که بلوک بدونِ والد
    // رها نشده باشد؛ اگر شده، خودکار به بلوکِ «سراسری» وصلش می‌کنیم.
    workspace.addChangeListener((e) => {
      if (e.type !== Blockly.Events.BLOCK_DRAG || e.isStart) return;
      const targets = (e.blocks && e.blocks.length) ? e.blocks : [workspace.getBlockById(e.blockId)];
      targets.forEach((b) => reattachIfFloating(workspace, b));
    });
    return workspace;
  }

  // یک سوییچِ کوچکِ شناور بالای بومِ کار: «دیدن همه‌ی بلوک‌ها». پیش‌فرض فقط
  // بلوک‌های لازمِ همین مأموریت را نشان می‌دهد؛ با زدنِ این سوییچ، کاملِ
  // جعبه‌ابزار (همه‌ی دسته‌ها) جایگزین می‌شود — بدون این‌که بلوک‌های روی بوم
  // پاک شوند (Blockly.updateToolbox فقط خودِ جعبه‌ابزار را عوض می‌کند).
  function attachToolboxScopeToggle(workspace, divEl) {
    const wrap = divEl.parentElement;
    if (!wrap) return;
    const label = document.createElement('label');
    label.className = 'ab-toggle-all';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = 'دیدنِ همه‌ی بلوک‌ها';
    label.appendChild(checkbox);
    label.appendChild(span);
    wrap.appendChild(label);
    checkbox.addEventListener('change', () => {
      workspace.__ardShowAll = checkbox.checked;
      const types = checkbox.checked ? null : missionToolboxTypes(workspace.__ardTaskKey);
      workspace.updateToolbox(buildToolbox(types));
    });
  }

  function disposeWorkspace(workspace) {
    try {
      if (workspace && workspace.injectionDiv) {
        const label = workspace.injectionDiv.parentElement && workspace.injectionDiv.parentElement.querySelector('.ab-toggle-all');
        if (label) label.remove();
      }
    } catch (e) { /* noop */ }
    try { if (workspace) workspace.dispose(); } catch (e) { /* noop */ }
  }

  function workspaceToCode(workspace) {
    const gen = arduinoGenerator;
    gen.init(workspace);
    const top = workspace.getTopBlocks(true);
    let setupBlock = null, loopBlock = null, globalBlock = null;
    const declBlocks = [], strayBlocks = [];
    const DECL_HEADS = new Set(['ard_var_declare', 'ard_array_declare', 'ard_servo_declare', 'ard_server_declare', 'procedures_defnoreturn', 'procedures_defreturn', 'ard_comment', 'ard_raw_code']);
    for (const b of top) {
      if (b.type === 'ard_setup' && !setupBlock) setupBlock = b;
      else if (b.type === 'ard_loop' && !loopBlock) loopBlock = b;
      else if (b.type === 'ard_global' && !globalBlock) globalBlock = b;
      else if (DECL_HEADS.has(b.type)) declBlocks.push(b);
      else strayBlocks.push(b);
    }
    const usesServo = workspace.getAllBlocks(false).some((b) => b.type && b.type.indexOf('ard_servo') === 0);
    let out = '';
    if (usesServo) out += '#include <Servo.h>\n\n';
    const usesWifi = workspace.getAllBlocks(false).some((b) => b.type && (b.type.indexOf('ard_wifi') === 0 || b.type.indexOf('ard_server') === 0));
    if (usesWifi) out += '#include <WiFi.h>\n#include <WebServer.h>\n\n';
    // متغیرها/آرایه‌ها/سرووها/یادداشت‌ها معمولاً حالا داخلِ بلوکِ «سراسری»
    // هستند؛ اما اگر یک بومِ کارِ قدیمی هنوز چندتایی از این‌ها را جداگانه
    // و بی‌والد روی بوم داشته باشد (declBlocks)، آن‌ها را هم بعدش می‌آوریم.
    // تعریف‌های سراسری باید بدونِ تورفتگی بیایند (statementToCode یک سطح تورفتگی اضافه می‌کند)
    let declCode = globalBlock ? gen.statementToCode(globalBlock, 'DO').replace(/^ {2}/gm, '') : '';
    for (const b of declBlocks) {
      const c = gen.blockToCode(b);
      declCode += Array.isArray(c) ? c[0] : c;
    }
    out += declCode;
    if (declCode) out += '\n';
    if (!workspace.__halMode) out += 'void setup() {\n' + (setupBlock ? gen.statementToCode(setupBlock, 'DO') : '') + '}\n\n';
    const loopCode = (loopBlock ? gen.statementToCode(loopBlock, 'DO') : '');
    if (workspace.__halMode) {
      // در STM32 فقط دو ناحیه داریم (قبل از حلقه / داخل while(1)) — تعریف‌های سراسری به ابتدای حلقه می‌روند
      out = out.replace(declCode + (declCode ? '\n' : ''), '');
      out += 'void setup() {\n' + (setupBlock ? gen.statementToCode(setupBlock, 'DO') : '') + '}\n\n';
      out += 'void loop() {\n' + declCode.split('\n').filter(Boolean).map((l) => '  ' + l + '\n').join('') + loopCode + '}\n';
      return out;
    }
    out += 'void loop() {\n' + loopCode + '}\n';
    if (strayBlocks.length) {
      out += '\n// ⚠️ این بلوک‌ها باید داخل «هنگام شروع» یا «همیشه تکرار کن» باشند:\n';
      for (const b of strayBlocks) {
        const c = gen.blockToCode(b);
        out += Array.isArray(c) ? c[0] : c;
      }
    }
    return out;
  }

  /* ------------------------------ 6. تبدیلِ کد ← بلوک (با AST خودِ ArduinoLang) ------------------------------ */

  class UnsupportedError extends Error {}

  // شماره‌ی معادلِ عددیِ پین‌های آنالوگِ A0..A5 روی آردوینو Uno — دقیقاً همان
  // نگاشتی که arduino-sim.js با pinAliasPrelude/#define پیش از کامپایل به
  // کدِ کاربر تزریق می‌کند. این‌جا هم از همان مقادیر استفاده می‌کنیم تا وقتی
  // متنِ کد به بلوک تبدیل می‌شود، A0 به‌جایِ خطا/کدِ خام، به بلوکِ عددیِ ۱۴ (و
  // به همین ترتیب A1..A5 به ۱۵..۱۹) تبدیل شود.
  const ANALOG_PIN_ALIASES = { A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19 };

  let idCounter = 0;
  function nid() { idCounter++; return 'gen' + idCounter; }

  // ===== چرا این تابع لازم است =====
  // حتی وقتی state ای که به Blockly.serialization.workspaces.load می‌دهیم
  // هم بلوک‌ها را دارد هم آرایه‌ی variables را (که خودش باید کافی باشد)،
  // Blockly (دستِ‌کم در نسخه‌ای که این پروژه استفاده می‌کند) موقعِ ساختِ
  // اولیه‌ی هر بلوکِ دارایِ field_variable، به‌جای اعمالِ مقدارِ id ای که در
  // fields.NAME دادیم، گاهی یک متغیرِ phantom با نامِ خودکار (i، j، ...)
  // می‌سازد و فیلد را به همان وصل می‌کند — یعنی مقدارِ id ای که ما دادیم
  // بی‌اثر می‌ماند. این تابع بعد از اتمامِ load، با پیمایشِ همان درختِ JSON
  // که خودمان ساختیم (topBlocks)، رویِ هر بلوکِ واقعیِ متناظر (با id)،
  // مقدارِ درستِ هر فیلدِ متغیر را دوباره و صریحاً ست می‌کند — این‌بار چون
  // متغیرِ هدف از قبل روی بومِ کار وجود دارد (از همان آرایه‌ی variables)،
  // این‌بار درست جا می‌افتد.
  function reapplyVariableFields(jsonNodes, workspace, knownVarIds) {
    const stack = jsonNodes.slice();
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      if (n.fields) {
        Object.keys(n.fields).forEach((fname) => {
          const val = n.fields[fname];
          if (typeof val === 'string' && knownVarIds.has(val)) {
            try {
              const b = workspace.getBlockById(n.id);
              const f = b && b.getField(fname);
              if (f && typeof f.setValue === 'function') f.setValue(val);
            } catch (e) { /* اگر این یکی درست نشد، بقیه را همچنان امتحان می‌کنیم */ }
          }
        });
      }
      if (n.inputs) {
        Object.keys(n.inputs).forEach((k) => {
          const inp = n.inputs[k];
          if (inp && inp.block) stack.push(inp.block);
          if (inp && inp.shadow) stack.push(inp.shadow);
        });
      }
      if (n.next && n.next.block) stack.push(n.next.block);
    }
    // متغیرهایی که هنگامِ ساختِ اولیه به‌اشتباه ساخته شدند (i، j، ...) و
    // بعد از تعمیرِ بالا دیگر هیچ فیلدی (طبقِ همان درختِ JSON که خودمان
    // نوشتیم) به آن‌ها اشاره ندارد، پاک می‌شوند تا در فهرستِ متغیرها
    // به‌صورتِ زایدِ بلااستفاده نمانند. چون همه‌ی ارجاع‌ها را بالا صریحاً
    // به id های خودمان برگرداندیم، هر متغیرِ خارج از knownVarIds قطعاً
    // زاید است — نیازی به بررسیِ جداگانه‌ی «هنوز استفاده می‌شود یا نه» نیست.
    try {
      workspace.getVariableMap().getAllVariables().slice().forEach((v) => {
        const id = v.getId();
        if (!knownVarIds.has(id)) {
          try { workspace.deleteVariableById(id); } catch (e2) { /* noop */ }
        }
      });
    } catch (e) { /* پاک‌سازیِ زاید اختیاری است؛ اگر نشد، مشکلِ کارکردی‌ای ایجاد نمی‌کند */ }
  }

  function makeConverter(workspace, globals, src) {
    const Blockly = window.Blockly;
    // نامِ متغیر (متنِ خام) → آی‌دیِ مصنوعیِ همین یک تبدیل. عمداً به‌جای
    // workspace.createVariable(name) از یک آی‌دیِ محلی استفاده می‌کنیم و
    // متغیرِ واقعی را روی بومِ کارِ زنده نمی‌سازیم — چون اگر بسازیم و بعداً
    // (طبقِ طراحیِ عمدیِ پایینِ فایل) workspace.clear() قبل از لود شدنِ
    // بلوک‌های جدید صدا زده شود، همان متغیرهایی که تازه ساختیم پاک می‌شوند و
    // Blockly موقعِ لودکردنِ بلوکِ field_variable که به آن آی‌دیِ دیگر
    // ناموجود اشاره می‌کند، به‌جای آن نامِ اصلی، یک نامِ پیش‌فرضِ خودکار
    // (مثلِ i، j، k، m) می‌سازد — یعنی هر ارجاع به همان متغیر، هر بار یک
    // اسمِ تصادفیِ متفاوت می‌گیرد. راهِ درست این است که هم بلوک‌ها هم
    // متغیرها با هم و در یک state واحد به Blockly.serialization.workspaces.load
    // داده شوند (دقیقاً طبقِ طراحیِ خودِ فرمتِ سریالایزیشنِ Blockly).
    const varIds = new Map();

    function ensureVar(name) {
      if (!varIds.has(name)) varIds.set(name, nid());
      return varIds.get(name);
    }
    // فهرستِ همه‌ی متغیرهایی که در همین یک تبدیل استفاده شده‌اند، به‌شکلِ
    // آماده برای بخشِ variables در state سریالایزیشن.
    function getVariables() {
      return Array.from(varIds.entries()).map(([name, id]) => ({ id, name, type: '' }));
    }
    // هر بار که یک دستور به‌جای بلوکِ واقعی، «کدِ خام» می‌شود، این‌جا ثبت
    // می‌شود — تا بعداً هم رویِ خودِ بلوک (setWarningText) و هم در کنسول/نوارِ
    // وضعیت به‌کاربر نشان داده شود که دقیقاً کدام تکه‌کد و به چه دلیل تبدیل نشد.
    const warnings = [];

    // اگر یک گرهِ AST بازه‌ی متنی (range — رویِ همان src که tokenize/parse
    // خوانده‌اند) داشته باشد، متنِ خامِ همان قسمت را برمی‌گرداند؛ در غیرِ
    // این‌صورت یک جای‌گزینِ خنثی، تا بلوکِ «کدِ خام» هیچ‌وقت خالی نماند.
    function sliceSrc(node) {
      if (node && Array.isArray(node.range) && src != null) {
        const text = src.slice(node.range[0], node.range[1]).trim();
        if (text) return text;
      }
      return '/* این بخش از کد بازیابی نشد */';
    }
    // یک بلوکِ «کدِ خام» می‌سازد که متنِ اصلیِ همان دستور را نگه می‌دارد —
    // برای دستورهایی که هنوز بلوکی برایشان نساخته‌ایم (به‌جای صرف‌نظر از
    // کلِ تبدیل، همین یک دستور را عیناً نگه می‌داریم و بقیه‌ی کد را همچنان
    // به بلوک تبدیل می‌کنیم). reason پیامِ فارسیِ همان UnsupportedError است.
    function rawCodeBlock(node, reason) {
      const id = nid();
      const code = sliceSrc(node);
      warnings.push({ id, code, reason: reason || 'این ساختار هنوز به بلوک تبدیل نمی‌شود.' });
      return { type: 'ard_raw_code', id, fields: { CODE: code } };
    }
    const servoNames = new Set();
    const constMap = new Map(); // متغیرهای سراسریِ عددیِ ثابت (مثلِ «int ledPin = 9;») → مقدارشان
    const NUMERIC_TYPES = new Set(['int', 'float', 'long', 'byte', 'double', 'short']);
    (globals || []).forEach((g) => g.decls.forEach((d) => {
      if (NUMERIC_TYPES.has(d.varType) && d.init && d.init.type === 'Num' && !d.arraySize) {
        constMap.set(d.name, d.init.value);
      }
    }));

    // خیلی از بلوک‌ها (پین، تأخیر، فرکانس و ...) دیگر ورودیِ اتصال‌پذیر
    // ندارند — یک فیلدِ ساده‌ی قابلِ‌تایپ‌اند. پس این‌جا باید یک عددِ خام
    // برگردانیم؛ اگر خودِ کد به‌جای عدد از یک متغیرِ سراسریِ ثابت (مثلِ
    // «int ledPin = 9;») استفاده کرده، همان مقدارِ ثابتش را جایگزین می‌کنیم.
    function numField(node) {
      if (node.type === 'Num') return node.value;
      if (node.type === 'Ident' && constMap.has(node.name)) return constMap.get(node.name);
      throw new UnsupportedError('این مقدار باید یک عددِ ساده باشد (یا یکی از متغیرهای ثابتی که در بالای کد تعریف کرده‌ای).');
    }
    function tailOf(node) {
      let n = node;
      while (n.next && n.next.block) n = n.next.block;
      return n;
    }
    function chain(list) {
      const items = list.filter(Boolean);
      if (!items.length) return null;
      for (let i = 0; i < items.length - 1; i++) {
        tailOf(items[i]).next = { block: items[i + 1] };
      }
      return items[0];
    }

    function numBlock(n) { return { type: 'math_number', id: nid(), fields: { NUM: n } }; }
    function strBlock(s) { return { type: 'text', id: nid(), fields: { TEXT: s } }; }
    function boolBlock(v) { return { type: 'logic_boolean', id: nid(), fields: { BOOL: v ? 'TRUE' : 'FALSE' } }; }
    function varGet(name) { return { type: 'variables_get', id: nid(), fields: { VAR: ensureVar(name) } }; }
    function pinBlock(v) { return { type: 'ard_pin_number', id: nid(), fields: { PIN: String(v) } }; }
    // ورودیِ «پین» را، اگر یک عددِ معتبرِ پین یا A0..A5 باشد، به بازشوی
    // آماده‌ی پین تبدیل می‌کند (نه یک بلوکِ عددِ ساده)؛ اگر پین از یک متغیر
    // می‌آید، همان بلوکِ متغیر سرِ جایش می‌ماند.
    function pinExpr(node) {
      if (node.type === 'Num' && PIN_VALUES.has(String(node.value))) return pinBlock(node.value);
      if (node.type === 'Ident' && PIN_VALUES.has(node.name)) return pinBlock(node.name);
      return expr(node);
    }

    function expr(node) {
      switch (node.type) {
        case 'Num': return numBlock(node.value);
        case 'Str': return strBlock(node.value);
        case 'Ident':
          if (node.name === 'true') return boolBlock(true);
          if (node.name === 'false') return boolBlock(false);
          if (node.name === 'GPIO_PIN_SET' || node.name === 'GPIO_PIN_RESET') return { type: 'hal_level', id: nid(), fields: { LEVEL: node.name } };
          if (node.name === 'HIGH' || node.name === 'LOW') {
            // اگر HIGH/LOW مستقیماً داخلِ «پین را ... کن» یا شرطِ «اگر پین
            // ... بود» بود، آن دو مسیر خودشان (بدون صدا زدنِ expr) این‌جا را
            // مدیریت می‌کنند. این‌جا فقط برای بقیه‌ی موارد است — مثلاً
            // مقایسه‌ی یک متغیر با HIGH/LOW: «if (button == LOW)» — که در
            // آن حالت یک بلوکِ مقدارِ HIGH/LOW برمی‌گردانیم تا بشود آن را به
            // ورودیِ logic_compare وصل کرد.
            return { type: 'ard_pin_state', id: nid(), fields: { STATE: node.name } };
          }
          // A0..A5 در فیلدِ PIN (که فقط عدد قبول می‌کند) باید به معادلِ
          // عددی‌شان تبدیل شوند، نه این‌که خطا بدهند و کدِ خام بمانند.
          if (Object.prototype.hasOwnProperty.call(ANALOG_PIN_ALIASES, node.name)) {
            return numBlock(ANALOG_PIN_ALIASES[node.name]);
          }
          return varGet(node.name);
        case 'Unary': {
          if (node.operator === '+') return expr(node.argument);
          if (node.operator === '!') return { type: 'logic_negate', id: nid(), inputs: { BOOL: { block: expr(node.argument) } } };
          if (node.operator === '-') {
            return { type: 'math_arithmetic', id: nid(), fields: { OP: 'MINUS' }, inputs: { A: { block: numBlock(0) }, B: { block: expr(node.argument) } } };
          }
          throw new UnsupportedError('این عملگرِ یکانی هنوز پشتیبانی نمی‌شود.');
        }
        case 'Binary': {
          const op = node.operator;
          if (op === '&&' || op === '||') {
            return { type: 'logic_operation', id: nid(), fields: { OP: op === '&&' ? 'AND' : 'OR' }, inputs: { A: { block: expr(node.left) }, B: { block: expr(node.right) } } };
          }
          const cmp = { '==': 'EQ', '!=': 'NEQ', '<': 'LT', '<=': 'LTE', '>': 'GT', '>=': 'GTE' };
          if (cmp[op]) {
            return { type: 'logic_compare', id: nid(), fields: { OP: cmp[op] }, inputs: { A: { block: expr(node.left) }, B: { block: expr(node.right) } } };
          }
          const ar = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };
          if (ar[op]) {
            return { type: 'math_arithmetic', id: nid(), fields: { OP: ar[op] }, inputs: { A: { block: expr(node.left) }, B: { block: expr(node.right) } } };
          }
          if (op === '%') return { type: 'math_modulo', id: nid(), inputs: { DIVIDEND: { block: expr(node.left) }, DIVISOR: { block: expr(node.right) } } };
          throw new UnsupportedError('عملگرِ «' + op + '» هنوز در حالتِ بلوکی پشتیبانی نمی‌شود.');
        }
        case 'Index':
          if (node.object.type !== 'Ident') throw new UnsupportedError('این آرایه خیلی پیچیده است.');
          return { type: 'ard_array_get', id: nid(), fields: { NAME: ensureVar(node.object.name) }, inputs: { INDEX: { block: expr(node.index) } } };
        case 'Member':
          if (node.object.type === 'Ident' && node.property === 'length') {
            return { type: 'ard_array_length', id: nid(), fields: { NAME: ensureVar(node.object.name) } };
          }
          throw new UnsupportedError('این ویژگی هنوز پشتیبانی نمی‌شود.');
        case 'Call':
          return callExpr(node);
        default:
          throw new UnsupportedError('این نوع عبارت هنوز به بلوک تبدیل نمی‌شود.');
      }
    }

    function argIsConstName(node, name) { return node.type === 'Ident' && node.name === name; }

    function callExpr(node) {
      const c = node.callee;
      if (c.type === 'Member' && c.object.type === 'Ident' && c.object.name === 'WiFi' && c.property === 'localIP' && !node.arguments.length) {
        return { type: 'ard_wifi_ip', id: nid() };
      }
      if (c.type === 'Ident') {
        const name = c.name, a = node.arguments;
        if (name === 'HAL_GPIO_ReadPin') return { type: 'hal_read', id: nid(), fields: { PIN: halPinFromArgs(a) } };
        if (name === 'digitalRead') return { type: 'ard_digital_read', id: nid(), inputs: { PIN: { block: pinExpr(a[0]) } } };
        if (name === 'analogRead') return { type: 'ard_analog_read', id: nid(), inputs: { PIN: { block: pinExpr(a[0]) } } };
        if (name === 'abs' || name === 'sqrt' || name === 'sq') {
          return { type: 'ard_math_single', id: nid(), fields: { FUNC: name }, inputs: { A: { block: expr(a[0]) } } };
        }
        if (name === 'constrain') return { type: 'math_constrain', id: nid(), inputs: { VALUE: { block: expr(a[0]) }, LOW: { block: expr(a[1]) }, HIGH: { block: expr(a[2]) } } };
        if (name === 'map' && a.length === 5) {
          return { type: 'ard_math_map', id: nid(), inputs: { X: { block: expr(a[0]) }, IN_MIN: { block: expr(a[1]) }, IN_MAX: { block: expr(a[2]) }, OUT_MIN: { block: expr(a[3]) }, OUT_MAX: { block: expr(a[4]) } } };
        }
        if (name === 'random' && a.length === 2) {
          return { type: 'math_random_int', id: nid(), inputs: { FROM: { block: expr(a[0]) }, TO: { block: { type: 'math_arithmetic', id: nid(), fields: { OP: 'MINUS' }, inputs: { A: { block: expr(a[1]) }, B: { block: numBlock(1) } } } } } };
        }
        if (funcDefs && funcDefs[name]) return callUser(name, a, true);
        throw new UnsupportedError('فراخوانیِ «' + name + '()» هنوز به بلوک تبدیل نمی‌شود.');
      }
      throw new UnsupportedError('این فراخوانی هنوز پشتیبانی نمی‌شود.');
    }

    // HAL_GPIO_*(GPIOx, GPIO_PIN_n, ...) → «PXn»؛ هر چیزِ دیگر (مثلاً پایه از متغیر) کدِ خام می‌ماند.
    function halPinFromArgs(a) {
      const port = a[0] && a[0].type === 'Ident' && /^GPIO([A-D])$/.exec(a[0].name);
      const pin = a[1] && a[1].type === 'Ident' && /^GPIO_PIN_(\d{1,2})$/.exec(a[1].name);
      if (!port || !pin || +pin[1] > 15) throw new UnsupportedError('پورت و پایه باید مثل GPIOC و GPIO_PIN_13 نوشته شده باشند.');
      return 'P' + port[1] + (+pin[1]);
    }
    function halTimArgs(a) {
      const t = a[0] && a[0].type === 'Ident' && /^htim([1-4])$/.exec(a[0].name);
      const c = a[1] && a[1].type === 'Ident' && /^TIM_CHANNEL_([1-4])$/.exec(a[1].name);
      if (!t || !c) throw new UnsupportedError('تایمر و کانال باید مثل htim1 و TIM_CHANNEL_1 باشند.');
      return [t[1], c[1]];
    }
    function callUser(name, args, expectsValue) {
      const type = expectsValue ? 'procedures_callreturn' : 'procedures_callnoreturn';
      const inputs = {};
      args.forEach((a, i) => { inputs['ARG' + i] = { block: expr(a) }; });
      return { type, id: nid(), fields: { NAME: name }, extraState: { params: args.map((_, i) => 'p' + i) }, inputs };
    }

    function memberCallStmt(node) {
      const c = node.expression.callee;
      const a = node.expression.arguments;
      const objName = c.object.type === 'Ident' ? c.object.name : null;
      if (objName === 'Serial') {
        if (c.property === 'begin') {
          const v = a[0];
          if (v.type !== 'Num') throw new UnsupportedError('سرعتِ Serial.begin باید یک عددِ ساده باشد.');
          return { type: 'ard_serial_begin', id: nid(), fields: { BAUD: String(v.value) } };
        }
        if (c.property === 'print' || c.property === 'println') {
          const arg = a[0];
          const newline = c.property === 'println' ? 'TRUE' : 'FALSE';
          if (!arg) throw new UnsupportedError('این ورودی به یک مقدار برای چاپ کردن نیاز دارد.');
          // هر عبارتی (متنِ ثابت، متغیر، عدد، حاصلِ جمع و…) می‌تواند به
          // بازشوی VALUE وصل شود — دیگر لازم نیست فقط متنِ ثابت یا نامِ
          // یک متغیرِ ساده باشد.
          return { type: 'ard_serial_print', id: nid(), fields: { NEWLINE: newline }, inputs: { VALUE: { block: expr(arg) } } };
        }
        throw new UnsupportedError('این متدِ Serial هنوز پشتیبانی نمی‌شود.');
      }
      if (objName === 'WiFi' && c.property === 'begin') {
        if (a.length !== 2) throw new UnsupportedError('WiFi.begin در حالتِ بلوکی باید هم نام و هم رمزِ Wi-Fi را بگیرد.');
        return { type: 'ard_wifi_begin', id: nid(), inputs: { SSID: { block: expr(a[0]) }, PASS: { block: expr(a[1]) } } };
      }
      if (objName === 'server') {
        if (c.property === 'begin' && !a.length) return { type: 'ard_server_begin', id: nid() };
        if (c.property === 'handleClient' && !a.length) return { type: 'ard_server_handle', id: nid() };
        if (c.property === 'on') {
          if (a.length !== 2 || a[0].type !== 'Str' || a[1].type !== 'Ident') {
            throw new UnsupportedError('server.on باید یک آدرسِ متنی و نامِ یک تابع بگیرد، مثل server.on("/on", handleOn).');
          }
          return { type: 'ard_server_on', id: nid(), fields: { PATH: a[0].value, FUNC: a[1].name } };
        }
        if (c.property === 'send') {
          const code = a[0] && a[0].type === 'Num' ? String(a[0].value) : '';
          if (a.length !== 3 || (code !== '200' && code !== '404') || a[1].type !== 'Str' || a[1].value !== 'text/plain') {
            throw new UnsupportedError('server.send در حالتِ بلوکی باید مثلِ server.send(200, "text/plain", "...") نوشته شود.');
          }
          return { type: 'ard_server_send', id: nid(), fields: { CODE: code }, inputs: { TEXT: { block: expr(a[2]) } } };
        }
      }
      if (objName && servoNames.has(objName)) {
        const nameId = ensureVar(objName);
        if (c.property === 'attach') return { type: 'ard_servo_attach', id: nid(), fields: { NAME: nameId }, inputs: { PIN: { block: pinExpr(a[0]) } } };
        if (c.property === 'write') return { type: 'ard_servo_write', id: nid(), fields: { NAME: nameId }, inputs: { ANGLE: { block: expr(a[0]) } } };
        if (c.property === 'detach') return { type: 'ard_servo_detach', id: nid(), fields: { NAME: nameId } };
        throw new UnsupportedError('این متدِ سروو هنوز پشتیبانی نمی‌شود.');
      }
      throw new UnsupportedError('این فراخوانی هنوز پشتیبانی نمی‌شود.');
    }

    // اگر خودِ شرطِ if دقیقاً «digitalRead(x) == HIGH/LOW» (یا برعکس) باشد،
    // فیلدهای لازم برای بلوکِ اختصاصیِ «اگر پین ... بود» را برمی‌گرداند؛
    // x می‌تواند یک عددِ ثابت یا نامِ یک متغیر باشد. وگرنه null، تا آن‌جا
    // از همان بلوکِ عمومیِ «اگر» استفاده شود.
    function pinCheckFields(node) {
      if (!(node.type === 'Binary' && node.operator === '==')) return null;
      const tryMatch = (a, b) => {
        if (a.type === 'Call' && a.callee.type === 'Ident' && a.callee.name === 'digitalRead' &&
            a.arguments.length === 1 && (a.arguments[0].type === 'Num' || a.arguments[0].type === 'Ident') &&
            b.type === 'Ident' && (b.name === 'HIGH' || b.name === 'LOW')) {
          return { pinNode: a.arguments[0], STATE: b.name };
        }
        return null;
      };
      return tryMatch(node.left, node.right) || tryMatch(node.right, node.left);
    }

    // «while (WiFi.status() != WL_CONNECTED) delay(N);» → مقدارِ N (یا null اگر حلقه از این الگو نبود)
    function wifiWaitDelay(node) {
      const t = node.test;
      const isStatus = (x) => x.type === 'Call' && x.callee.type === 'Member' && x.callee.object.type === 'Ident' &&
        x.callee.object.name === 'WiFi' && x.callee.property === 'status' && !x.arguments.length;
      const isConnected = (x) => x.type === 'Ident' && x.name === 'WL_CONNECTED';
      const waiting = t && t.type === 'Binary' && t.operator === '!=' &&
        ((isStatus(t.left) && isConnected(t.right)) || (isStatus(t.right) && isConnected(t.left)));
      if (!waiting) return null;
      let body = node.body;
      if (body.type === 'Block' && body.body.length === 1) body = body.body[0];
      if (body.type !== 'ExprStmt' || body.expression.type !== 'Call') return null;
      const call = body.expression;
      if (call.callee.type !== 'Ident' || call.callee.name !== 'delay' || call.arguments.length !== 1) return null;
      const ms = call.arguments[0];
      return ms.type === 'Num' && ms.value >= 1 && ms.value <= 5000 ? ms.value : null;
    }

    function stmtRaw(node) {
      switch (node.type) {
        case 'Empty': return null;
        case 'Block': return chain(node.body.map(stmt));
        case 'VarDecl': return chain(node.decls.map(declStmt));
        case 'ExprStmt': return exprStmt(node.expression);
        case 'If': {
          const branches = [];
          let cur = node;
          while (cur && cur.type === 'If') {
            branches.push({ test: cur.test, body: cur.consequent });
            cur = cur.alternate;
          }
          const elseBody = cur; // ممکن است یک Statement (else) یا null باشد
          // حالتِ ساده («اگر»ی بدون elseif): اگر شرط دقیقاً بررسیِ یک پین
          // باشد، به‌جای controls_if عمومی، بلوکِ اختصاصیِ خواناترِ
          // «اگر پینِ ... بود» را می‌سازیم.
          if (branches.length === 1) {
            const pinFields = pinCheckFields(branches[0].test);
            if (pinFields) {
              const inputs2 = { PIN: { block: pinExpr(pinFields.pinNode) } };
              const doS = stmt(branches[0].body);
              if (doS) inputs2.DO = { block: doS };
              if (elseBody) {
                const elseS = stmt(elseBody);
                if (elseS) inputs2.ELSE = { block: elseS };
              }
              return { type: 'ard_if_pin', id: nid(), fields: { STATE: pinFields.STATE }, inputs: inputs2 };
            }
          }
          const fields = {};
          const inputs = {};
          branches.forEach((br, i) => {
            inputs['IF' + i] = { block: expr(br.test) };
            const s = stmt(br.body);
            if (s) inputs['DO' + i] = { block: s };
          });
          if (elseBody) {
            const s = stmt(elseBody);
            if (s) inputs['ELSE'] = { block: s };
          }
          return { type: 'controls_if', id: nid(), extraState: { elseIfCount: branches.length - 1, hasElse: !!elseBody }, inputs };
        }
        case 'While': {
          const waitMs = wifiWaitDelay(node);
          if (waitMs !== null) return { type: 'ard_wifi_wait', id: nid(), fields: { MS: waitMs } };
          return { type: 'controls_whileUntil', id: nid(), fields: { MODE: 'WHILE' }, inputs: { BOOL: { block: expr(node.test) }, DO: { block: stmt(node.body) } } };
        }
        case 'For': return forStmt(node);
        case 'Break': return { type: 'controls_flow_statements', id: nid(), fields: { FLOW: 'BREAK' } };
        case 'Continue': return { type: 'controls_flow_statements', id: nid(), fields: { FLOW: 'CONTINUE' } };
        default:
          throw new UnsupportedError('این نوع دستور («' + node.type + '») هنوز به بلوک تبدیل نمی‌شود.');
      }
    }
    // نسخه‌ی «امن»ِ stmtRaw: اگر تبدیلِ همین یک دستور (هرچقدر هم که تو در
    // توش باشد — چون stmtRaw برای هر آیتمِ داخلِ Block/If/While دوباره همین
    // stmt را صدا می‌زند، نه خودش را) با یک ساختارِ پشتیبانی‌نشده روبه‌رو
    // شود، به‌جای بالا رفتنِ خطا و ناکام‌ماندنِ کلِ تبدیل، همان یک دستور را
    // عیناً در یک بلوکِ «کدِ خام» می‌گذاریم و بقیه‌ی کد سالم می‌ماند.
    function stmt(node) {
      try {
        return stmtRaw(node);
      } catch (e) {
        if (e instanceof UnsupportedError) return rawCodeBlock(node, e.message);
        throw e;
      }
    }

    function declStmt(d) {
      if (d.varType === 'WebServer') {
        const port = d.ctorArgs && d.ctorArgs.length === 1 ? d.ctorArgs[0] : null;
        if (d.name !== 'server' || !port || port.type !== 'Num') {
          throw new UnsupportedError('وب‌سرور در حالتِ بلوکی باید دقیقاً مثلِ WebServer server(80); نوشته شود.');
        }
        return { type: 'ard_server_declare', id: nid(), fields: { PORT: port.value } };
      }
      if (d.varType === 'Servo') {
        servoNames.add(d.name);
        return { type: 'ard_servo_declare', id: nid(), fields: { NAME: ensureVar(d.name) } };
      }
      if (d.arraySize) {
        const TYPES = new Set(['int', 'float', 'byte']);
        if (!TYPES.has(d.varType)) throw new UnsupportedError('نوعِ آرایه‌ی «' + d.varType + '» هنوز پشتیبانی نمی‌شود.');
        if (d.init) throw new UnsupportedError('مقداردهیِ اولیه‌ی آرایه با { } هنوز پشتیبانی نمی‌شود.');
        return { type: 'ard_array_declare', id: nid(), fields: { TYPE: d.varType, NAME: ensureVar(d.name) }, inputs: { SIZE: { block: expr(d.arraySize) } } };
      }
      const TYPES = new Set(['int', 'float', 'bool', 'boolean', 'String', 'long', 'byte', 'uint8_t', 'uint16_t', 'uint32_t', 'int32_t']);
      if (!TYPES.has(d.varType)) throw new UnsupportedError('نوعِ متغیرِ «' + d.varType + '» هنوز پشتیبانی نمی‌شود.');
      const type = d.varType === 'boolean' ? 'bool' : d.varType;
      if (!d.init) throw new UnsupportedError('این بلوک به یک مقدارِ اولیه نیاز دارد؛ برای متغیرِ بدونِ مقدارِ اولیه فعلاً بلوکی نداریم.');
      return { type: 'ard_var_declare', id: nid(), fields: { TYPE: type, NAME: ensureVar(d.name) }, inputs: { VALUE: { block: expr(d.init) } } };
    }

    function exprStmt(e) {
      if (e.type === 'Call') return callStmt(e);
      if (e.type === 'Assign') return assignStmt(e);
      if (e.type === 'UpdateExpr') {
        if (e.argument.type !== 'Ident') throw new UnsupportedError('این ++/-- هنوز پشتیبانی نمی‌شود.');
        const delta = e.operator === '++' ? 1 : -1;
        return { type: 'math_change', id: nid(), fields: { VAR: ensureVar(e.argument.name) }, inputs: { DELTA: { block: numBlock(delta) } } };
      }
      throw new UnsupportedError('این دستور هنوز به بلوک تبدیل نمی‌شود.');
    }

    function callStmt(node) {
      const c = node.callee, a = node.arguments;
      if (c.type === 'Member') return memberCallStmt({ expression: node });
      if (c.type !== 'Ident') throw new UnsupportedError('این فراخوانی هنوز پشتیبانی نمی‌شود.');
      const name = c.name;
      if (name === 'HAL_GPIO_WritePin') {
        const lv = a[2] && a[2].type === 'Ident' && (a[2].name === 'GPIO_PIN_SET' || a[2].name === 'GPIO_PIN_RESET') ? a[2].name : (a[2] && a[2].type === 'Num' ? (a[2].value ? 'GPIO_PIN_SET' : 'GPIO_PIN_RESET') : null);
        if (!lv) throw new UnsupportedError('مقدارِ سومِ HAL_GPIO_WritePin باید GPIO_PIN_SET یا GPIO_PIN_RESET باشد.');
        return { type: 'hal_write', id: nid(), fields: { PIN: halPinFromArgs(a), LEVEL: lv } };
      }
      if (name === 'HAL_GPIO_TogglePin') return { type: 'hal_toggle', id: nid(), fields: { PIN: halPinFromArgs(a) } };
      if (name === 'HAL_Delay') return { type: 'hal_delay', id: nid(), inputs: { MS: { block: expr(a[0]) } } };
      if (name === 'HAL_TIM_PWM_Start') { const tc = halTimArgs(a); return { type: 'hal_pwm_start', id: nid(), fields: { TIM: tc[0], CH: tc[1] } }; }
      if (name === '__HAL_TIM_SET_COMPARE') { const tc = halTimArgs(a); return { type: 'hal_set_compare', id: nid(), fields: { TIM: tc[0], CH: tc[1] }, inputs: { VAL: { block: expr(a[2]) } } }; }
      if (name === 'pinMode') {
        if (a[1].type !== 'Ident') throw new UnsupportedError('حالتِ pinMode باید OUTPUT/INPUT/INPUT_PULLUP باشد.');
        return { type: 'ard_pin_mode', id: nid(), fields: { MODE: a[1].name }, inputs: { PIN: { block: pinExpr(a[0]) } } };
      }
      if (name === 'digitalWrite') {
        if (a[1].type !== 'Ident' || (a[1].name !== 'HIGH' && a[1].name !== 'LOW')) {
          throw new UnsupportedError('مقدارِ دومِ digitalWrite باید HIGH یا LOW باشد.');
        }
        return { type: 'ard_digital_write', id: nid(), fields: { STATE: a[1].name }, inputs: { PIN: { block: pinExpr(a[0]) } } };
      }
      if (name === 'analogWrite') return { type: 'ard_analog_write', id: nid(), inputs: { PIN: { block: pinExpr(a[0]) }, VALUE: { block: expr(a[1]) } } };
      if (name === 'delay') return { type: 'ard_wait', id: nid(), inputs: { MS: { block: expr(a[0]) } } };
      if (name === 'delayMicroseconds') return { type: 'ard_wait_micro', id: nid(), inputs: { US: { block: expr(a[0]) } } };
      if (funcDefs && funcDefs[name]) return callUser(name, a, false);
      throw new UnsupportedError('فراخوانیِ «' + name + '()» هنوز به بلوک تبدیل نمی‌شود.');
    }

    function assignStmt(node) {
      const t = node.target;
      if (t.type === 'Ident') {
        if (node.operator === '=') return { type: 'variables_set', id: nid(), fields: { VAR: ensureVar(t.name) }, inputs: { VALUE: { block: expr(node.value) } } };
        if (node.operator === '+=') return { type: 'math_change', id: nid(), fields: { VAR: ensureVar(t.name) }, inputs: { DELTA: { block: expr(node.value) } } };
        if (node.operator === '-=') {
          const neg = { type: 'math_arithmetic', id: nid(), fields: { OP: 'MINUS' }, inputs: { A: { block: numBlock(0) }, B: { block: expr(node.value) } } };
          return { type: 'math_change', id: nid(), fields: { VAR: ensureVar(t.name) }, inputs: { DELTA: { block: neg } } };
        }
        throw new UnsupportedError('عملگرِ انتساب «' + node.operator + '» هنوز پشتیبانی نمی‌شود.');
      }
      if (t.type === 'Index' && t.object.type === 'Ident' && node.operator === '=') {
        return { type: 'ard_array_set', id: nid(), fields: { NAME: ensureVar(t.object.name) }, inputs: { INDEX: { block: expr(t.index) }, VALUE: { block: expr(node.value) } } };
      }
      throw new UnsupportedError('این انتساب هنوز پشتیبانی نمی‌شود.');
    }

    function hasTrailingReturnValue(bodyBlockNode) {
      const body = bodyBlockNode.body;
      for (let i = 0; i < body.length; i++) {
        const isLast = i === body.length - 1;
        const s = body[i];
        if (s.type === 'Return' && s.argument && !isLast) throw new UnsupportedError('برگرداندنِ مقدار فقط در آخرینِ خطِ تابع پشتیبانی می‌شود.');
        if (s.type === 'Return' && !s.argument && !isLast) throw new UnsupportedError('«return» زودهنگام هنوز پشتیبانی نمی‌شود.');
      }
      const last = body[body.length - 1];
      return last && last.type === 'Return' && last.argument ? last.argument : null;
    }

    function forStmt(node) {
      if (!node.init || node.init.type !== 'VarDecl' || node.init.decls.length !== 1) throw new UnsupportedError('این حلقه‌ی for خیلی پیچیده است.');
      const d = node.init.decls[0];
      if (!d.init) throw new UnsupportedError('این حلقه‌ی for خیلی پیچیده است.');
      if (!node.test || node.test.type !== 'Binary' || node.test.left.type !== 'Ident' || node.test.left.name !== d.name) {
        throw new UnsupportedError('این حلقه‌ی for خیلی پیچیده است.');
      }
      let by;
      if (node.update) {
        if (node.update.type === 'UpdateExpr' && node.update.argument.type === 'Ident' && node.update.argument.name === d.name) {
          by = node.update.operator === '++' ? 1 : -1;
        } else if (node.update.type === 'Assign' && node.update.operator === '+=' && node.update.target.type === 'Ident' && node.update.target.name === d.name) {
          by = numField(node.update.value);
        } else throw new UnsupportedError('این حلقه‌ی for خیلی پیچیده است.');
      } else by = 1;
      const varId = ensureVar(d.name);
      return {
        type: 'controls_for', id: nid(),
        fields: { VAR: varId },
        inputs: { FROM: { block: expr(d.init) }, TO: { block: expr(node.test.right) }, BY: { block: numBlock(by) } },
        __body: node.body
      };
    }

    let funcDefs = null;

    function functionDefBlock(name, fn) {
      const retArg = hasTrailingReturnValue(fn.body);
      const bodyStmts = retArg ? fn.body.body.slice(0, -1) : fn.body.body;
      const bodyHead = chain(bodyStmts.map(stmt));
      const params = fn.params.map((p) => p.name).filter(Boolean);
      const extraState = { params: params.map((p) => ({ name: p })) };
      const fields = { NAME: name };
      if (retArg) {
        return {
          type: 'procedures_defreturn', id: nid(), fields, extraState,
          inputs: Object.assign({}, bodyHead ? { STACK: { block: bodyHead } } : {}, { RETURN: { block: expr(retArg) } })
        };
      }
      return { type: 'procedures_defnoreturn', id: nid(), fields, extraState, inputs: bodyHead ? { STACK: { block: bodyHead } } : {} };
    }

    return { ensureVar, chain, stmt, declStmt, functionDefBlock, rawCodeBlock, getWarnings: () => warnings, getVariables, setFuncDefs: (fd) => { funcDefs = fd; } };
  }

  // یک پاس ساده روی «for» تا استفاده‌ی داخلی از __body به‌درستی به DO تبدیل شود
  function finalizeForBody(node, convertBody) {
    if (node && node.type === 'controls_for' && node.__body !== undefined) {
      const body = convertBody(node.__body);
      if (body) node.inputs.DO = { block: body };
      delete node.__body;
    }
    return node;
  }

  // موقعیتِ فعلیِ بلوک‌های سطحِ‌بالا را (قبل از پاک‌کردنِ بوم) با کلیدِ
  // «نوع#شماره‌یِ‌تکرار» ذخیره می‌کند تا بعد از بازسازی از روی متن، هر بلوک
  // دوباره سرِ جای قبلی‌اش بنشیند، نه یک‌جای پیش‌فرض.
  function captureTopBlockPositions(workspace) {
    const map = new Map();
    const counts = new Map();
    try {
      workspace.getTopBlocks(true).forEach((b) => {
        const n = counts.get(b.type) || 0;
        counts.set(b.type, n + 1);
        const xy = b.getRelativeToSurfaceXY();
        map.set(b.type + '#' + n, { x: xy.x, y: xy.y });
      });
    } catch (e) { /* اولین‌بار که هنوز بلوکی روی بوم نیست — نقشه خالی می‌ماند */ }
    return map;
  }

  // چیدمانِ فعلیِ بومِ کار را به یک آبجکتِ ساده (قابلِ JSON.stringify، برای
  // ذخیره در localStorage) تبدیل می‌کند — هم موقعیتِ بلوک‌ها، هم خودِ
  // اسکرول/زوومِ بوم (که وگرنه با هر بارگذاریِ تازه به حالتِ پیش‌فرض/وسط
  // برمی‌گردد، حتی اگه خودِ بلوک‌ها سرِ جایِ درستشان باشند).
  function getLayout(workspace) {
    const obj = {};
    captureTopBlockPositions(workspace).forEach((v, k) => { obj[k] = v; });
    try {
      obj.__viewport__ = { scrollX: workspace.scrollX, scrollY: workspace.scrollY, scale: workspace.scale };
    } catch (e) { /* noop */ }
    return obj;
  }

  /* ------------------------------ ذخیره/بازیابیِ کاملِ فضایِ‌کار (سریالایزیشنِ استانداردِ Blockly) ------------------------------ */
  // این دو تابع، برخلافِ codeToWorkspace/workspaceToCode (که از/به متنِ C++
  // می‌روند و فقط چیزی را که در خودِ سینتکسِ ArduinoLang قابلِ‌بیان است نگه
  // می‌دارند)، مستقیماً همان JSONِ استانداردِ خودِ Blockly را
  // می‌گیرند/برمی‌گردانند — دقیقاً همان فرمتی که پروژه‌های استاندارد
  // (Scratch, MakeCode, Ardublock) برای «ذخیره‌ی پروژه» استفاده می‌کنند.
  // این JSON، بر خلافِ کدِ C++، چیزهایی مثلِ کامنتِ روی یک بلوک، بلوکِ
  // غیرفعال‌شده، یا یک بلوکِ جدا‌افتاده‌ی هنوز‌به‌جایی‌وصل‌نشده را هم عیناً
  // نگه می‌دارد — پس وقتی خودِ کاربر دارد از رویِ بلوک‌ها کار می‌کند، این
  // باید منبعِ ذخیره/بازیابی باشد، نه بازسازیِ هربار از رویِ کدِ C++ (که فقط
  // خروجیِ نهاییِ قابلِ‌کامپایل است — یک‌طرفه، نه قابلِ‌برگشت‌ِ کامل).
  function saveWorkspaceSnapshot(workspace) {
    try {
      const ws = window.Blockly.serialization.workspaces.save(workspace);
      let viewport;
      try { viewport = { scrollX: workspace.scrollX, scrollY: workspace.scrollY, scale: workspace.scale }; } catch (e) { /* noop */ }
      return { ws, viewport };
    } catch (e) {
      return null;
    }
  }

  function loadWorkspaceSnapshot(workspace, snapshot) {
    if (!snapshot || !snapshot.ws) return false;
    try {
      workspace.clear();
      window.Blockly.serialization.workspaces.load(snapshot.ws, workspace, { recordUndo: false });
      try { findOrCreateGlobalBlock(workspace); } catch (e) { /* noop */ }
      if (snapshot.viewport) {
        try {
          if (typeof snapshot.viewport.scale === 'number') workspace.setScale(snapshot.viewport.scale);
          if (typeof snapshot.viewport.scrollX === 'number' && typeof snapshot.viewport.scrollY === 'number') {
            workspace.scroll(snapshot.viewport.scrollX, snapshot.viewport.scrollY);
          }
        } catch (e) { /* اگر تنظیم نشد، بومِ کار همان چیدمانِ پیش‌فرض را نشان می‌دهد — عیبِ کارکردی ندارد */ }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // چیدمانِ نهایی برای بازسازی: هر چه همین الان روی خودِ بوم هست (اگر بومی در
  // کار باشد) اولویت دارد؛ برای هر بلوکی که آن‌جا نبود (مثلاً بلافاصله بعد از
  // بازکردنِ صفحه که بوم هنوز خالی است)، از چیدمانِ ذخیره‌شده در حافظه
  // (storedLayout — که arduino-sim.js از localStorage خوانده) استفاده می‌شود.
  function mergedPositions(workspace, storedLayout) {
    const map = new Map();
    if (storedLayout) Object.keys(storedLayout).forEach((k) => { if (k !== '__viewport__') map.set(k, storedLayout[k]); });
    captureTopBlockPositions(workspace).forEach((v, k) => map.set(k, v));
    return map;
  }

  function applyTopBlockPositions(topBlocks, savedPositions) {
    const counts = new Map();
    let cascadeX = 30, cascadeY = 30;
    topBlocks.forEach((tb) => {
      const n = counts.get(tb.type) || 0;
      counts.set(tb.type, n + 1);
      const saved = savedPositions.get(tb.type + '#' + n);
      if (saved) {
        tb.x = saved.x;
        tb.y = saved.y;
      } else {
        // بلوکی که قبلاً روی بوم نبوده (تازه در متن اضافه شده) — یک جای
        // آزادِ منطقی برایش در نظر می‌گیریم، نه رویِ بلوک‌های بازیابی‌شده.
        tb.x = cascadeX;
        tb.y = cascadeY;
        cascadeY += 130;
      }
    });
  }

  // خطای واقعیِ «سینتکس» با خطای داخلی/محیطی (مثلاً ArduinoLang در همین صفحه
  // بارگذاری نشده یا code نرسیده) فرق دارد؛ قبلاً هر دو با یک پیامِ «خطای نحوی»
  // گزارش می‌شدند و علتِ واقعی گم می‌شد.
  function isInternalError(e) {
    return e instanceof ReferenceError || e instanceof TypeError || e instanceof RangeError;
  }

  function codeToWorkspace(code, workspace, storedLayout) {
    let pre, ast;
    if (typeof ArduinoLang === 'undefined' || !ArduinoLang) {
      return { ok: false, message: (langLoadError && langLoadError.message) ? langLoadError.message : 'مفسرِ کد (ArduinoLang) در این صفحه بارگذاری نشده؛ مشکل از کدِ تو نیست.' };
    }
    if (typeof code !== 'string') {
      return { ok: false, message: 'کدی به ادیتورِ بلوکی نرسید؛ مشکل از کدِ تو نیست.' };
    }
    try {
      // «&htim1» در متنِ HAL: مفسر عملگرِ یکانیِ & را نمی‌شناسد؛ قبل از خواندن نامِ تایمر را بدونِ & می‌کنیم
      if (workspace.__halMode) code = code.replace(/&\s*(htim[1-4])\b/g, '$1');
      pre = ArduinoLang.preprocess(code);
      ast = ArduinoLang.parse(ArduinoLang.tokenize(pre));
    } catch (e) {
      if (window.console && console.error) console.error('[ArduinoBlocks] تبدیلِ کد به AST شکست خورد:', e);
      const detail = (e && e.message) ? e.message : String(e);
      if (isInternalError(e)) {
        return { ok: false, message: 'خطای داخلی هنگامِ خواندنِ کد (مشکل از کدِ تو نیست): ' + detail };
      }
      return { ok: false, message: 'کد خطای نحوی دارد: ' + detail };
    }
    if (ast && ast.errors && ast.errors.length) {
      const first = ast.errors[0];
      const detail = (first && first.message) ? first.message : String(first);
      return { ok: false, message: 'کد خطای نحوی دارد: ' + detail };
    }

    const conv = makeConverter(workspace, ast.globals, pre);
    conv.setFuncDefs(ast.functions);

    // نکته‌ی مهم: بومِ کارِ فعلی را «هنوز» پاک نمی‌کنیم. تا وقتی که کل تبدیل
    // (که ممکن است هر لحظه به یک ساختارِ پشتیبانی‌نشده بربخورد و استثنا پرتاب
    // کند) با موفقیت تمام نشده، به بلوک‌های موجود روی بوم دست نمی‌زنیم — وگرنه
    // با هر «این ساختار هنوز پشتیبانی نمی‌شود» کاربر همه‌ی کدش را از دست می‌داد.
    try {
      const topBlocks = [];
      const flatDecls = [];
      // هر دستورِ سراسری را جدا امتحان می‌کنیم: اگر تبدیلش (هر جای آن)
      // شکست بخورد، فقط همان یک خط را به‌جای بلوکِ نوعش، به‌صورتِ «کدِ خام»
      // نگه می‌داریم — نه این‌که کلِ تبدیل را متوقف کنیم. نتیجه‌ی
      // declStmtهای این خط را اول در یک بافرِ موقت جمع می‌کنیم تا اگر یکی
      // از چند متغیرِ هم‌خط («int a=1, b=badExpr();») شکست خورد، نصفه‌ی
      // موفقش هم جداگانه اضافه نشود — کلِ آن خط با هم یا بلوک می‌شود یا کدِ خام.
      ast.globals.forEach((g) => {
        const tmp = [];
        try {
          g.decls.forEach((d) => tmp.push(conv.declStmt(d)));
          flatDecls.push(...tmp);
        } catch (e) {
          if (e instanceof UnsupportedError) flatDecls.push(conv.rawCodeBlock(g, e.message));
          else throw e;
        }
      });
      const globalHead = conv.chain(flatDecls);
      // به‌جایِ اینکه هر declِ سراسری یک بلوکِ جداگانه و شناور روی بومِ کار
      // باشد، همه‌شان را (به‌صورتِ یک زنجیره) داخلِ یک بلوکِ واحدِ «سراسری»
      // می‌گذاریم — تا چیزی بی‌والد و رهاشده روی بوم نماند.
      topBlocks.push({ type: 'ard_global', id: nid(), deletable: false, inputs: globalHead ? { DO: { block: globalHead } } : {} });

      Object.keys(ast.functions).forEach((name) => {
        if (name === 'setup' || name === 'loop') return;
        // بدنه‌ی تابع دستور به دستور خودش را در برابرِ خطا محافظت می‌کند
        // (چون بدنه از همان stmt ایمن استفاده می‌کند)، اما مقدارِ بازگشتی
        // (return) یک ورودیِ مقداری است، نه یک دستور، و نمی‌شود آن را با
        // یک بلوکِ «کدِ خام» جایگزین کرد — پس اگر خودِ تعریفِ تابع (نه یک
        // دستورِ داخلش) به‌خاطرِ یک return پیچیده شکست بخورد، کلِ تابع
        // به‌عنوانِ یک بلوکِ کدِ خام نگه داشته می‌شود.
        try {
          topBlocks.push(conv.functionDefBlock(name, ast.functions[name]));
        } catch (e) {
          if (e instanceof UnsupportedError) topBlocks.push(conv.rawCodeBlock(ast.functions[name], e.message));
          else throw e;
        }
      });

      function convertBody(blockNode) { return conv.stmt(blockNode); }
      function walkForFix(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'controls_for') finalizeForBody(node, convertBody);
        if (node.inputs) Object.keys(node.inputs).forEach((k) => walkForFix(node.inputs[k] && node.inputs[k].block));
        if (node.next) walkForFix(node.next.block);
      }

      if (ast.functions.setup) {
        const doBlock = conv.stmt(ast.functions.setup.body);
        walkForFix(doBlock);
        topBlocks.push({ type: 'ard_setup', id: nid(), inputs: doBlock ? { DO: { block: doBlock } } : {} });
      }
      if (ast.functions.loop) {
        const doBlock = conv.stmt(ast.functions.loop.body);
        walkForFix(doBlock);
        topBlocks.push({ type: 'ard_loop', id: nid(), inputs: doBlock ? { DO: { block: doBlock } } : {} });
      }
      topBlocks.forEach(walkForFix);
      // مقدارهای پیش‌فرض (شادو) را روی همه‌ی ورودی‌های درختِ ساخته‌شده هم
      // می‌گذاریم تا اگر کاربر بلوکی را از یک سوکت بیرون بکشد، سوکت خالی
      // و سیاه نماند و همان مقدارِ پیش‌فرض زیرش ظاهر شود.
      topBlocks.forEach(applyShadowDefaults);

      // از این‌جا به بعد، ساختنِ حالتِ جدید کامل و بدونِ خطا تمام شده — تازه
      // این‌جا مجازیم بومِ فعلی را دست بزنیم. یک عکسِ فوری از وضعِ فعلی هم
      // نگه می‌داریم تا اگر خودِ عملیاتِ load (که یک عملیاتِ داخلیِ Blockly
      // است و کنترلِ کامل رویش نداریم) به‌ندرت شکست خورد، بتوانیم برگردانیم.
      const savedPositions = mergedPositions(workspace, storedLayout);
      let previousSnapshot = null;
      try { previousSnapshot = window.Blockly.serialization.workspaces.save(workspace); } catch (e) { /* noop */ }
      applyTopBlockPositions(topBlocks, savedPositions);
      workspace.clear();
      try {
        window.Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: topBlocks }, variables: conv.getVariables() }, workspace, { recordUndo: false });
        reapplyVariableFields(topBlocks, workspace, new Set(conv.getVariables().map((v) => v.id)));
      } catch (loadErr) {
        try {
          workspace.clear();
          if (previousSnapshot) window.Blockly.serialization.workspaces.load(previousSnapshot, workspace, { recordUndo: false });
        } catch (rollbackErr) { /* اگر برگرداندن هم شکست خورد، کاری از دستمان برنمی‌آید */ }
        throw loadErr;
      }
      if (storedLayout && storedLayout.__viewport__) {
        try {
          const vp = storedLayout.__viewport__;
          if (typeof vp.scale === 'number') workspace.setScale(vp.scale);
          if (typeof vp.scrollX === 'number' && typeof vp.scrollY === 'number') workspace.scroll(vp.scrollX, vp.scrollY);
        } catch (e) { /* اگر تنظیم نشد، بومِ کار همان چیدمانِ پیش‌فرضِ خودش را نشان می‌دهد — عیبِ کارکردی ندارد */ }
      }
      const warnings = conv.getWarnings();
      // رویِ خودِ هر بلوکِ «کدِ خام»، یک حبابِ هشدارِ Blockly (آیکونِ ⚠️ روی
      // بلوک) می‌گذاریم که با کلیک باز می‌شود و می‌گوید دقیقاً همین تکه‌کد
      // چرا به بلوک تبدیل نشده — نه فقط یک پیامِ کلی یک‌جا برای کلِ فایل.
      warnings.forEach((w) => {
        try {
          const b = workspace.getBlockById(w.id);
          if (b && typeof b.setWarningText === 'function') b.setWarningText('این کد قابلِ تبدیل به بلوکی نیست: ' + w.reason);
        } catch (e) { /* noop */ }
      });
      return { ok: true, warnings };
    } catch (e) {
      if (!(e instanceof UnsupportedError) && window.console && console.error) console.error('[ArduinoBlocks] تبدیلِ کد به بلوک شکست خورد:', e);
      // خطای داخلیِ برنامه (مثلاً Blockly کامل بارگذاری نشده) را نباید به‌عنوانِ
      // «کدِ تو پیچیده است» گزارش کرد؛ علتِ واقعی را نشان می‌دهیم.
      if (!(e instanceof UnsupportedError) && isInternalError(e)) {
        return { ok: false, message: 'خطای داخلی هنگامِ ساختنِ بلوک‌ها (مشکل از کدِ تو نیست): ' + (e.message || e) };
      }
      const msg = (e instanceof UnsupportedError) ? e.message : 'این کد برای حالتِ بلوکی خیلی پیچیده است.';
      return { ok: false, message: msg + ' می‌تونی توی حالتِ متنی ادامه‌ش بدی.' };
    }
  }


  /* ------------------------------ STM32 / HAL ------------------------------
     همان ادیتورِ بلوکیِ آردوینو، ولی با بلوک‌های HAL: «پایه‌ی PC13 را روشن کن»، «صبر کن»،
     «مقدارِ پایه‌ی PA0» و PWM. کدی که بلوک‌ها می‌سازند همان کدِ HAL است که مفسرِ مأموریت‌های
     STM32 اجرا می‌کند. وضعیتِ Cube (کدام پایه ورودی/خروجی شده) از صفحه‌ی اصلی می‌رسد
     (setHalContext) تا بلوکِ یک پایه‌ی تنظیم‌نشده هشدار بدهد. */
  const HAL_TASKS = { hal: { init: true, pwm: false }, hal_init: { init: true, pwm: false }, hal_pwm: { init: true, pwm: true } };
  function isHalTask(k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(HAL_TASKS, k); }
  let halCtx = { cfg: {} };
  function setHalContext(ctx) { halCtx = { cfg: (ctx && ctx.cfg) || {} }; }
  const HAL_PINS = (() => {
    const o = [];
    ['A', 'B'].forEach((p) => { for (let i = 0; i < 16; i++) o.push('P' + p + i); });
    o.push('PC13', 'PC14', 'PC15', 'PD0', 'PD1');
    return o;
  })();
  // پایه‌هایی که در Cube برای همین کار تنظیم شده‌اند بالای فهرست می‌آیند.
  function halPinOptions(kind) {
    const want = kind === 'in' ? 'GPIO_Input' : 'GPIO_Output';
    const good = HAL_PINS.filter((p) => halCtx.cfg[p] === want);
    const rest = HAL_PINS.filter((p) => good.indexOf(p) < 0);
    return good.concat(rest).map((p) => [p, p]);
  }
  function varTypeOptions(field, arduinoOptions) {
    let b = null;
    try { b = field.getSourceBlock(); } catch (e) { /* noop */ }
    if (b && b.workspace && b.workspace.__halMode) {
      return [['عدد کوچک (uint8_t)', 'uint8_t'], ['عدد صحیح (int)', 'int'], ['عدد (uint16_t)', 'uint16_t'], ['عدد بزرگ (uint32_t)', 'uint32_t']];
    }
    return arduinoOptions;
  }
  function stripOuterParens(s) {
    s = String(s).trim();
    while (s[0] === '(' && s[s.length - 1] === ')') {
      let d = 0, ok = true;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') d++; else if (s[i] === ')') d--;
        if (d === 0 && i < s.length - 1) { ok = false; break; }
      }
      if (!ok) break;
      s = s.slice(1, -1).trim();
    }
    return s;
  }
  function defineHalBlocks(Blockly) {
    const pinField = (kind) => ({ type: 'field_dropdown', name: 'PIN', options: function () { return halPinOptions(kind); } });
    const tim = { type: 'field_dropdown', name: 'TIM', options: [['۱', '1'], ['۲', '2'], ['۳', '3'], ['۴', '4']] };
    const ch = { type: 'field_dropdown', name: 'CH', options: [['۱', '1'], ['۲', '2'], ['۳', '3'], ['۴', '4']] };
    const stmt = { previousStatement: null, nextStatement: null, inputsInline: true };
    Blockly.defineBlocksWithJsonArray([
      Object.assign({ type: 'hal_write', message0: '📍 پایه‌ی %1 را %2',
        args0: [pinField('out'), { type: 'field_dropdown', name: 'LEVEL', options: [['روشن کن (SET)', 'GPIO_PIN_SET'], ['خاموش کن (RESET)', 'GPIO_PIN_RESET']] }],
        colour: COLOR.pin, tooltip: 'مقدارِ یک پایه‌ی خروجی را می‌نویسد (HAL_GPIO_WritePin). روی Blue Pill، پایه‌ی PC13 وارونه است: RESET یعنی LED روشن.' }, stmt),
      Object.assign({ type: 'hal_toggle', message0: '🔄 حالتِ پایه‌ی %1 را برعکس کن',
        args0: [pinField('out')], colour: COLOR.pin, tooltip: 'اگر روشن بود خاموش و اگر خاموش بود روشن می‌کند (HAL_GPIO_TogglePin).' }, stmt),
      { type: 'hal_read', message0: '📥 مقدارِ پایه‌ی %1', args0: [pinField('in')], output: 'Number', colour: COLOR.pin,
        tooltip: 'مقدارِ یک پایه‌ی ورودی را می‌خواند: ۱ (SET) یا ۰ (RESET) — HAL_GPIO_ReadPin.' },
      { type: 'hal_level', message0: '%1', args0: [{ type: 'field_dropdown', name: 'LEVEL', options: [['SET (۱)', 'GPIO_PIN_SET'], ['RESET (۰)', 'GPIO_PIN_RESET']] }], output: 'Number', colour: COLOR.pin,
        tooltip: 'مقدارِ ثابتِ GPIO_PIN_SET (۱) یا GPIO_PIN_RESET (۰) — برای مقایسه با «مقدارِ پایه».' },
      Object.assign({ type: 'hal_delay', message0: '⏱️ صبر کن %1 میلی‌ثانیه', args0: [{ type: 'input_value', name: 'MS', check: 'Number' }],
        colour: COLOR.control, tooltip: 'برنامه را برای این‌مقدار میلی‌ثانیه نگه می‌دارد (HAL_Delay).' }, stmt),
      Object.assign({ type: 'hal_pwm_start', message0: '🎚️ PWM را روی تایمر %1 و کانال %2 شروع کن', args0: [tim, ch],
        colour: COLOR.servo, tooltip: 'خروجیِ PWMِ یک کانالِ تایمر را روشن می‌کند (HAL_TIM_PWM_Start). اول باید همین کانال در Cube روی پایه تنظیم شده باشد.' }, stmt),
      Object.assign({ type: 'hal_set_compare', message0: '⚡ در تایمر %1 و کانال %2، سرعت را روی %3 بگذار', args0: [tim, ch, { type: 'input_value', name: 'VAL', check: 'Number' }],
        colour: COLOR.servo, tooltip: 'عددِ compare را می‌گذارد: ۰ ایست، ۵۰۰ نیمِ سرعت، ۹۹۹ سرعتِ کامل (__HAL_TIM_SET_COMPARE).' }, stmt)
    ]);
  }
  // هشدارِ روی بلوک وقتی پایه در Cube درست تنظیم نشده (آیکونِ ⚠️ خودِ Blockly)
  function refreshHal(workspace) {
    if (!workspace || !workspace.__halMode) return;
    const need = { hal_write: ['GPIO_Output', 'خروجی'], hal_toggle: ['GPIO_Output', 'خروجی'], hal_read: ['GPIO_Input', 'ورودی'] };
    const hasCfg = halCtx && halCtx.cfg && Object.keys(halCtx.cfg).length >= 0;
    workspace.getAllBlocks(false).forEach((b) => {
      const n = need[b.type];
      if (!n || !hasCfg || typeof b.setWarningText !== 'function') return;
      const pin = b.getFieldValue('PIN');
      const text = halCtx.cfg[pin] === n[0] ? null : '«' + pin + '» در تبِ Cube هنوز ' + n[0] + ' (' + n[1] + ') نشده؛ اول همان‌جا تنظیمش کن.';
      if (b.__halWarn === text) return;
      b.__halWarn = text;
      try { b.setWarningText(text); } catch (e) { /* noop */ }
    });
  }
  function halToolbox(taskKey) {
    const t = HAL_TASKS[taskKey] || HAL_TASKS.hal;
    const firstPin = (kind, fb) => { const p = HAL_PINS.find((x) => halCtx.cfg[x] === (kind === 'in' ? 'GPIO_Input' : 'GPIO_Output')); return p || fb; };
    const outP = firstPin('out', 'PC13'), inP = firstPin('in', 'PA0');
    const cat = (name, colour, contents) => ({ kind: 'category', name, colour, contents });
    const blk = (type, fields, inputs) => {
      const b = { kind: 'block', type };
      if (fields) b.fields = fields;
      const inp = Object.assign({}, defaultInputs(type) || {}, inputs || {});
      if (Object.keys(inp).length) b.inputs = inp;
      return b;
    };
    const readSet = () => ({ block: { type: 'logic_compare', fields: { OP: 'EQ' }, inputs: {
      A: { block: { type: 'hal_read', fields: { PIN: inP } } }, B: { block: { type: 'hal_level', fields: { LEVEL: 'GPIO_PIN_SET' } } } } } });
    const ifB = (els) => ({ kind: 'block', type: 'controls_if', extraState: els ? { hasElse: true } : undefined, inputs: { IF0: readSet() } });
    const start = [t.init ? blk('ard_setup') : null, blk('ard_loop'), blk('ard_comment')].filter(Boolean);
    const cats = [
      cat('شروع', COLOR.event, start),
      cat('پایه‌ها (HAL)', COLOR.pin, [
        blk('hal_write', { PIN: outP, LEVEL: 'GPIO_PIN_SET' }), blk('hal_write', { PIN: outP, LEVEL: 'GPIO_PIN_RESET' }),
        blk('hal_toggle', { PIN: outP }), blk('hal_read', { PIN: inP }), blk('hal_level', { LEVEL: 'GPIO_PIN_SET' }), blk('hal_level', { LEVEL: 'GPIO_PIN_RESET' })
      ]),
      cat('کنترل', COLOR.control, [ifB(false), ifB(true), blk('hal_delay')]),
      cat('متغیرها', COLOR.variable, [
        blk('ard_var_declare', { TYPE: 'uint8_t' }, { VALUE: { block: { type: 'hal_read', fields: { PIN: inP } } } }),
        blk('variables_get'), blk('variables_set'), blk('math_change')
      ]),
      cat('ریاضی', COLOR.math, [blk('math_number'), blk('math_arithmetic')]),
      cat('منطق', COLOR.logic, [blk('logic_compare'), blk('logic_operation'), blk('logic_negate')])
    ];
    if (t.pwm) cats.splice(3, 0, cat('PWM (موتور)', COLOR.servo, [blk('hal_pwm_start'), blk('hal_set_compare')]));
    return { kind: 'categoryToolbox', contents: cats };
  }
  // وقتی Cube عوض شد: جعبه‌ابزار (پایه‌های پیش‌فرض) و هشدارها تازه می‌شوند.
  function updateHalContext(workspace, ctx) {
    setHalContext(ctx);
    if (!workspace || !workspace.__halMode) return;
    try { workspace.updateToolbox(halToolbox(workspace.__ardTaskKey)); } catch (e) { /* noop */ }
    refreshHal(workspace);
  }

  /* ------------------------------ خروجیِ ماژول ------------------------------ */

  return {
    ensureReady,
    createWorkspace,
    disposeWorkspace,
    workspaceToCode,
    codeToWorkspace,
    getLayout,
    saveWorkspaceSnapshot,
    loadWorkspaceSnapshot,
    setHalContext,
    updateHalContext,
    refreshHal
  };
})();