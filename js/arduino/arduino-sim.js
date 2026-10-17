/* ========================================================================
   ARDUINO-SIM.JS — شبیه‌ساز آردوینو (سریال، LED، چشمک‌زن، دکمه)
   تم و رنگ‌بندی دقیق استخراج‌شده از تصویر ارسالی (void/تایپ‌ها: فیروزه‌ای کله‌غازی، متغیرها: سفید)
   ======================================================================== */

const ArduinoSim = (() => {
  const CODE_STORAGE_PREFIX = 'shovalie-madar-arduino-code-v2:';
  const BLOCK_LAYOUT_STORAGE_PREFIX = 'shovalie-madar-arduino-blocklayout-v1:';
  // چیدمانِ بالا (BLOCK_LAYOUT_STORAGE_PREFIX) فقط یک راهنمای موقعیتی است که
  // موقعِ ناچار-بودن به بازسازیِ بلوک‌ها از رویِ متنِ C++ استفاده می‌شود (پایین
  // را ببین). منبعِ اصلیِ ذخیره/بازیابیِ خودِ بلوک‌ها این کلید است: کاملِ
  // فضایِ‌کارِ Blockly (JSONِ استانداردِ خودش، با serialization.workspaces)،
  // به‌همراهِ همان متنِ C++ ای که این بلوک‌ها دقیقاً از رویش تولید/تأیید شده‌اند
  // — تا بعداً بتوانیم بفهمیم آیا این عکسِ فوری هنوز با متنِ فعلی هم‌خوان است
  // یا نه (یعنی از وقتی بلوک‌ها آخرین‌بار ذخیره شدند، کسی مستقیم متن را دستی
  // عوض کرده یا نه).
  const BLOCK_SNAPSHOT_STORAGE_PREFIX = 'shovalie-madar-arduino-blocksnapshot-v1:';
  // حالتِ ادیتور (متنی/بلوکی) بر خلافِ کد و چیدمانِ بلوک‌ها، per-mission ذخیره
  // نمی‌شود — یک ترجیحِ سراسری است: هر مأموریتی که کاربر بعداً باز کند، باید
  // با همان حالتی شروع شود که آخرین‌بار انتخاب کرده. با هر تغییرِ آگاهانه‌ی
  // کاربر (نه بازگشت‌های اجباریِ داخلی به‌خاطرِ خطا) این کلید به‌روز می‌شود و
  // یک رویداد هم پخش می‌شود تا هر نمونه‌ی دیگرِ همین شبیه‌ساز که همین الان
  // روی صفحه باز است هم بلافاصله با آن هماهنگ شود.
  // آدرسِ iframe ادیتورِ بلوکی. هر وقت blockly-editor.html (یا فایل‌هایی که
  // خودش لود می‌کند) عوض شد، عددِ v را بالا ببر تا مرورگرِ کاربرانِ قبلی نسخه‌ی
  // کش‌شده را استفاده نکند.
  const BLOCKLY_EDITOR_URL = 'blockly-editor.html?v=3';
  const MODE_STORAGE_KEY = 'shovalie-madar-arduino-mode-v1';
  const MODE_CHANGE_EVENT = 'shovalie-madar-arduino-mode-change';
  const RUN_SPEED = 2.2;
  const MIN_STEP_MS = 12;
  const MAX_STEP_MS = 900;
  const MAX_RUN_MS = 11000;
  const IDLE_LOOP_MS = 6;

  /* ------------------------------ Syntax Highlight ------------------------------ */
  const HL_TYPES = new Set([
    'int', 'char', 'boolean', 'bool', 'float', 'double', 'long', 'short', 'byte',
    'const', 'static', 'unsigned', 'signed', 'uint8_t', 'uint16_t', 'uint32_t',
    'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'size_t', 'word', 'auto'
  ]);

  const HL_STRUCTURES = new Set([
    'void', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
    'break', 'continue', 'return', 'goto', 'new', 'delete'
  ]);

  const HL_CLASSES = new Set([
    'Serial', 'Serial1', 'Serial2', 'Serial3', 'Keyboard', 'Mouse',
    'Wire', 'SPI', 'EEPROM', 'TFT_eSPI', 'TFT_eSprite', 'File', 'HardwareSerial', 'String', 'tft',
    'Servo'
  ]);

  const HL_CONSTANTS = new Set([
    'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'true', 'false',
    'LED_BUILTIN', 'DEC', 'BIN', 'HEX', 'OCT', 'NULL', 'TFT_BLACK', 'TFT_WHITE',
    'A0', 'A1', 'A2', 'A3', 'A4', 'A5',
    'GPIOA', 'GPIOB', 'GPIOC', 'GPIO_PIN_SET', 'GPIO_PIN_RESET',
    ...Array.from({ length: 16 }, (_, i) => 'GPIO_PIN_' + i)
  ]);

  const HL_FUNCTIONS = new Set([
    'setup', 'loop', 'pinMode', 'digitalWrite', 'digitalRead',
    'analogWrite', 'analogRead', 'delay', 'delayMicroseconds',
    'millis', 'micros', 'pulseIn', 'shiftIn', 'shiftOut',
    'tone', 'noTone', 'attachInterrupt', 'detachInterrupt',
    'min', 'max', 'abs', 'constrain', 'map', 'pow', 'sqrt',
    'random', 'randomSeed', 'begin', 'print', 'println', 'available', 'read', 'write', 'attach', 'detach', 'attached', 'writeMicroseconds',
    'init', 'setRotation', 'fillScreen', 'setTextSize', 'setCursor', 'Log', 'log',
    'createSprite', 'pushSprite', 'setSwapBytes',
    'HAL_Init', 'SystemClock_Config', 'MX_GPIO_Init',
    'HAL_GPIO_WritePin', 'HAL_GPIO_TogglePin', 'HAL_GPIO_ReadPin', 'HAL_Delay'
  ]);

  // فهرست واحدِ کلمات کلیدی/توابع/ثابت‌های شناخته‌شده — همان‌هایی که رنگی می‌شوند —
  // که برای پیشنهاد اتوکامپلیت (متن کم‌رنگ + Tab) استفاده می‌شود. کوتاه‌ترین
  // تکمیل‌کننده‌ی ممکن اول امتحان می‌شود تا پیشنهاد منطقی‌تری نشان داده شود.
  const AUTOCOMPLETE_WORDS = Array.from(new Set([
    ...HL_STRUCTURES, ...HL_TYPES, ...HL_CLASSES, ...HL_FUNCTIONS, ...HL_CONSTANTS
  ])).sort((a, b) => a.length - b.length);

  // مکان‌نما باید دقیقاً انتهای یک شناسه‌ی نیمه‌کاره باشد، و چیزی غیر از فاصله
  // بعد از آن تا انتهای همان خط نباشد (وگرنه متن کم‌رنگ روی کدِ بعدی می‌افتد).
  function computeGhostSuggestion(value, caret) {
    const lineEndIdx = value.indexOf('\n', caret);
    const restOfLine = value.slice(caret, lineEndIdx === -1 ? value.length : lineEndIdx);
    if (restOfLine.trim() !== '') return null;

    let start = caret;
    while (start > 0 && /[A-Za-z0-9_]/.test(value[start - 1])) start--;
    const prefix = value.slice(start, caret);
    if (!prefix || !/^[A-Za-z_]/.test(prefix)) return null;

    for (const w of AUTOCOMPLETE_WORDS) {
      if (w.length > prefix.length && w.startsWith(prefix)) {
        return { start: caret, text: w.slice(prefix.length) };
      }
    }
    return null;
  }

  const HL_TOKEN_RE = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"?)|('(?:\\.|[^'\\])*'?)|(#\s*\w+)|(&lt;[^\n]*?&gt;)|(&(?:lt|gt|amp);)|(\b0[xX][0-9a-fA-F]+\b|\b\d+\.?\d*(?:[eE][+-]?\d+)?[fFlLuU]*\b)|([A-Za-z_]\w*)/g;

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // شبیه‌سازی به‌هم‌ریختگی متن روی سریال مانیتور وقتی نرخ باد انتخاب‌شده در
  // مانیتور با Serial.begin() کد یکی نیست — فاصله‌ها حفظ می‌شوند، بقیه‌ی
  // کاراکترها با یک نگاشت ثابت (نه تصادفی) به علامت‌های نامفهوم تبدیل می‌شوند.
  const GARBLE_GLYPHS = '¤§¶ØÙÚÛÜÝÞßãäåæçèéêëìíîïðñòóôõö÷øùúû';
  function garbleText(text) {
    return text.replace(/\S/g, (c) => GARBLE_GLYPHS[c.charCodeAt(0) % GARBLE_GLYPHS.length]);
  }

  function highlightArduino(code) {
    const escaped = escapeHtml(code);
    return escaped.replace(HL_TOKEN_RE, function (m, cmLine, cmBlock, dq, sq, directive, headerAngle, entity, num, ident, offset, str) {
      if (cmLine !== undefined || cmBlock !== undefined) return '<span class="hl-cm">' + m + '</span>';
      if (dq !== undefined || sq !== undefined) return '<span class="hl-str">' + m + '</span>';
      if (headerAngle !== undefined) return '<span class="hl-header">' + m + '</span>';
      if (directive !== undefined) return '<span class="hl-dir">' + m + '</span>';
      if (entity !== undefined) return m;
      if (num !== undefined) return '<span class="hl-num">' + m + '</span>';
      if (ident !== undefined) {
        if (HL_STRUCTURES.has(ident)) return '<span class="hl-struct">' + m + '</span>';
        if (HL_TYPES.has(ident)) return '<span class="hl-type">' + m + '</span>';
        if (HL_CLASSES.has(ident)) return '<span class="hl-class">' + m + '</span>';
        if (HL_FUNCTIONS.has(ident)) return '<span class="hl-fn">' + m + '</span>';
        if (HL_CONSTANTS.has(ident)) return '<span class="hl-const">' + m + '</span>';

        let j = offset + m.length;
        while (j < str.length && /\s/.test(str[j])) j++;
        if (str[j] === '(') return '<span class="hl-fn">' + m + '</span>';

        return '<span class="hl-ident">' + m + '</span>';
      }
      return m;
    });
  }

  let hlStyleInjected = false;
  function ensureHighlightStyle() {
    if (hlStyleInjected || document.getElementById('sim-hl-style')) { hlStyleInjected = true; return; }
    const style = document.createElement('style');
    style.id = 'sim-hl-style';
    style.textContent = `
      .sim-editor-wrap {
        position: relative;
        background-color: #1a2228;
        border-radius: 6px;
        overflow: hidden;
        --sim-gutter-w: 40px;
      }
      .sim-editor-gutter {
        position: absolute; top: 0; bottom: 0; left: 0; width: var(--sim-gutter-w); z-index: 1;
        overflow: hidden; pointer-events: none; box-sizing: border-box;
        background: #161d24; border-right: 1px solid #2d3840;
        padding: 10px 6px 10px 0; text-align: right;
        font-family: 'Consolas', 'Courier New', monospace; font-size: 16px; line-height: 1.5;
        color: #4b5661; user-select: none;
        direction: ltr; unicode-bidi: isolate;
      }
      .sim-editor-gutter div { white-space: pre; direction: ltr; unicode-bidi: isolate; }
      .sim-editor-gutter div.is-error-line { color: #ff6b5e; font-weight: 700; }
      .sim-editor-errline {
        position: absolute; left: var(--sim-gutter-w); right: 0; height: 24px; z-index: 0;
        background: rgba(255, 76, 66, .16); border-top: 1px solid rgba(255, 76, 66, .4);
        border-bottom: 1px solid rgba(255, 76, 66, .4); pointer-events: none; display: none;
      }
      .sim-editor-ghost {
        position: absolute; top: 0; left: 0; z-index: 3; display: none; pointer-events: none;
        white-space: pre; direction: ltr;
        font-family: 'Consolas', 'Courier New', monospace; font-size: 16px; line-height: 1.5;
        letter-spacing: normal; font-variant-ligatures: none; font-kerning: none;
        color: rgba(171, 178, 191, .4);
      }
      .sim-editor-ghost .sim-ghost-tab {
        margin-inline-start: 2px; padding: 1px 6px; border-radius: 3px; font-size: 10px;
        font-family: 'Vazirmatn', sans-serif; vertical-align: 1px; white-space: nowrap;
        background: rgba(46, 160, 157, .18); color: #6fd6d2; border: 1px solid rgba(46, 160, 157, .35);
        pointer-events: auto; cursor: pointer; touch-action: manipulation; user-select: none;
      }
      .sim-editor-ghost .sim-ghost-tab:active { background: rgba(46, 160, 157, .38); }
      pre.sim-editor.sim-editor-hl {
        display: block; position: absolute; top: 0; right: 0; bottom: 0; left: var(--sim-gutter-w); width: auto; margin: 0; z-index: 1; pointer-events: none;
        overflow: auto; white-space: pre; word-wrap: normal; word-break: normal;
        direction: ltr; text-align: left; unicode-bidi: plaintext; background: transparent; color: #abb2bf;
        font-family: 'Consolas', 'Courier New', monospace; font-size: 16px; line-height: 1.5;
        letter-spacing: normal; font-variant-ligatures: none; font-kerning: none;
        padding: 10px; box-sizing: border-box; border: 1px solid transparent;
        min-height: 0; max-height: none; resize: none; vertical-align: top;
        scrollbar-width: none;
      }
      pre.sim-editor.sim-editor-hl::-webkit-scrollbar { display: none; }
      pre.sim-editor.sim-editor-hl code { color: inherit; font-family: inherit; white-space: inherit; }
      textarea.sim-editor {
        display: block; position: relative; margin: 0; z-index: 2; background: transparent; color: transparent;
        caret-color: #2ea09d; font-family: 'Consolas', 'Courier New', monospace; font-size: 16px; line-height: 1.5;
        letter-spacing: normal; font-variant-ligatures: none; font-kerning: none;
        padding: 10px 10px 10px calc(var(--sim-gutter-w) + 10px); box-sizing: border-box; resize: vertical; direction: ltr; text-align: left;
        unicode-bidi: plaintext;
        white-space: pre; overflow: auto; vertical-align: top;
        border: 1px solid #2d3840; border-radius: 6px;
        min-height: 230px;
        scrollbar-width: thin; scrollbar-color: #2ea09d #10161d;
      }
      textarea.sim-editor::-webkit-scrollbar { height: 30px; width: 30px; }
      textarea.sim-editor::-webkit-scrollbar-track { background: #10161d; }
      textarea.sim-editor::-webkit-scrollbar-thumb { background: #2ea09d; border-radius: 10px; border: 3px solid #10161d; }
      textarea.sim-editor::-webkit-scrollbar-thumb:hover { background: #3fc2be; }
      textarea.sim-editor::-webkit-scrollbar-corner { background: #10161d; }

      /* دکمه‌ی بزرگ‌نمایی کد */
      .sim-btn-expand { font-size: 15px; line-height: 1; padding: 7px 10px; }

      /* حالت تمام‌صفحه برای ادیتور کد.
         نکته‌ی مهم: خودِ .sim-editor-block موقع ورود به این حالت با جاوااسکریپت
         مستقیم زیر document.body منتقل می‌شود (نه این‌که همان‌جا داخل مودال
         بماند) — چون مودال overflow-y:auto و max-height محدود دارد و overlay
         هم backdrop-filter دارد که containing-block عناصر position:fixed را
         عوض می‌کند؛ اگر همان‌جا می‌ماند، «تمام‌صفحه» فقط به اندازه‌ی همان
         مودال بریده می‌شد نه کل صفحه.
         چیدمان: روی گوشی (پیش‌فرض) ستونی — بورد بالا، ادیتور پایین.
         روی صفحه‌ی بزرگ (کامپیوتر) — بورد سمت چپ، ادیتور سمت راست. */
      .sim-editor-block.is-sim-fullscreen {
        position: fixed; inset: 0; z-index: 999;
        width: 100vw; height: 100vh; height: 100dvh; max-width: none; max-height: none; margin: 0;
        background: #11161c; display: flex; flex-direction: column;
        padding: 10px; padding-top: 12px; box-sizing: border-box; gap: 8px;
      }
      .sim-editor-block.is-sim-fullscreen .sim-board-wrap { flex: 0 0 auto; padding: 4px; margin: 0; }
      .sim-editor-block.is-sim-fullscreen .sim-board-wrap .sim-board-svg { max-width: 195px; }
      .sim-editor-block.is-sim-fullscreen .sim-editor-head { flex: 0 0 auto; }
      .sim-editor-block.is-sim-fullscreen .sim-editor-wrap,
      .sim-editor-block.is-sim-fullscreen .sim-blockly-wrap { flex: 1 1 auto; min-height: 0; height: auto; }
      .sim-editor-block.is-sim-fullscreen textarea.sim-editor,
      .sim-editor-block.is-sim-fullscreen pre.sim-editor.sim-editor-hl {
        height: 100%; font-size: 16px; resize: none;
      }
      .sim-editor-block.is-sim-fullscreen .sim-editor-gutter { height: 100%; font-size: 16px; }
      .sim-editor-block.is-sim-fullscreen .sim-status,
      .sim-editor-block.is-sim-fullscreen .sim-console-wrap { flex: 0 0 auto; }
      .sim-editor-block.is-sim-fullscreen .sim-console { max-height: 70px; }
      body.sim-fullscreen-lock { overflow: hidden; }

      /* صفحه‌ی بزرگ: بورد سمت چپ (ستون باریک، هم‌قدِ کل ارتفاع)، ادیتور کد
         سمت راست (ستون پهن، شامل نوار ابزار/وضعیت/کد/کنسول روی هم).
         صفحه rtl است، برای همین ستونِ اول grid فیزیکاً سمت راست می‌افتد —
         به همین خاطر ستونِ پهن اول و ستونِ بورد دوم تعریف شده. */
      @media (min-width: 860px) {
        .sim-editor-block.is-sim-fullscreen {
          display: grid;
          grid-template-columns: 1fr minmax(230px, 320px);
          grid-template-rows: auto auto 1fr auto;
          column-gap: 16px; row-gap: 8px;
        }
        .sim-editor-block.is-sim-fullscreen .sim-board-wrap {
          grid-column: 2; grid-row: 1 / -1;
          display: flex; align-items: center; justify-content: center;
          height: 100%; overflow: auto; padding: 16px;
        }
        .sim-editor-block.is-sim-fullscreen .sim-board-wrap .sim-board-svg { max-width: 100%; width: 260px; }
        .sim-editor-block.is-sim-fullscreen .sim-editor-head { grid-column: 1; grid-row: 1; }
        .sim-editor-block.is-sim-fullscreen .sim-status { grid-column: 1; grid-row: 2; }
        .sim-editor-block.is-sim-fullscreen .sim-editor-wrap,
        .sim-editor-block.is-sim-fullscreen .sim-blockly-wrap { grid-column: 1; grid-row: 3; }
        .sim-editor-block.is-sim-fullscreen .sim-console-wrap { grid-column: 1; grid-row: 4; }
      }

      /* نمایش حالت «در حال اجرا» روی ادیتور */
      .sim-editor-block.is-sim-running .sim-editor-wrap { opacity: .55; filter: grayscale(.25); pointer-events: none; }
      .sim-editor-block.is-sim-running textarea.sim-editor { cursor: not-allowed; }
      .sim-editor-block.is-sim-running .sim-editor-wrap::after {
        content: '▶ در حال اجرا…'; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
        z-index: 3; background: rgba(46,160,157,.92); color: #08150f; font-family: 'Vazirmatn', sans-serif;
        font-weight: 700; font-size: 12.5px; padding: 5px 12px; border-radius: 999px;
        box-shadow: 0 2px 8px rgba(0,0,0,.35); pointer-events: none; white-space: nowrap;
      }

      /* پالت رنگی استخراج شده از تصویر */
      .hl-dir    { color: #c792ea; font-weight: normal; } /* بنفش / یاسی برای include# */
      .hl-struct { color: #2ea09d; }                      /* فیروزه‌ای کله‌غازی برای void, if, while */
      .hl-type   { color: #2ea09d; }                      /* فیروزه‌ای کله‌غازی برای const, char, uint16_t, int */
      .hl-fn     { color: #e5a467; }                      /* خردلی / نارنجی برای Log, setup, println, begin */
      .hl-class  { color: #e5a467; }                      /* خردلی / نارنجی برای Serial, TFT_eSPI */
      .hl-ident  { color: #e6edf3; }                      /* سفید / خاکستری روشن برای متغیرها مثل msg و color */
      .hl-header { color: #2ea09d; }                      /* فیروزه‌ای برای هدرها */
      .hl-str    { color: #80cbc4; unicode-bidi: plaintext; }  /* سبز / فیروزه‌ای روشن برای متون استرینگ — plaintext تا رشته‌ی فارسی داخل گیومه درست نمایش داده شود */
      .hl-num    { color: #67c2ff; }                      /* آبی آسمانی برای اعداد */
      .hl-const  { color: #e6edf3; }                      /* سفید برای ثابت‌ها */
      .hl-cm     { color: #5c6370; unicode-bidi: plaintext; }  /* خاکستری برای کامنت‌ها — plaintext تا کامنت فارسی/انگلیسی به‌هم‌ریخته نشود */
    `;
    document.head.appendChild(style);
    hlStyleInjected = true;
  }

  /* ------------------------------ دیالوگِ راهنما ------------------------------ */
  // به document.body اضافه می‌شود (نه داخلِ ادیتور) و z-index اش از ادیتورِ
  // تمام‌صفحه (999) بالاتر است، تا در هر حالتی دیده شود.
  let dlgStyleInjected = false;
  function ensureDialogStyle() {
    if (dlgStyleInjected || document.getElementById('sim-dlg-style')) { dlgStyleInjected = true; return; }
    const style = document.createElement('style');
    style.id = 'sim-dlg-style';
    style.textContent = `
      .sim-dlg-overlay {
        position: fixed; inset: 0; z-index: 1300; display: flex; align-items: center; justify-content: center;
        padding: 18px; background: rgba(6,9,14,.72); direction: rtl; font-family: 'Vazirmatn', sans-serif;
      }
      .sim-dlg {
        width: 100%; max-width: 460px; max-height: 90vh; max-height: 90dvh; overflow: auto;
        background: #161c28; border: 1px solid var(--copper, #c97c3d); border-radius: 16px;
        padding: 22px 20px 18px; color: #e9edf5; box-shadow: 0 20px 60px -20px rgba(0,0,0,.85);
      }
      .sim-dlg-title { margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #ffb86b; }
      .sim-dlg-body { font-size: 14.5px; line-height: 2; color: #cfd6e4; }
      .sim-dlg-body p { margin: 0 0 8px; }
      .sim-dlg-body ul { margin: 4px 0 10px; padding-inline-start: 20px; }
      .sim-dlg-body code {
        display: inline-block; direction: ltr; unicode-bidi: isolate; padding: 1px 7px; border-radius: 6px;
        background: #0d1117; border: 1px solid #2a3344; color: #80cbc4;
        font-family: ui-monospace, Consolas, monospace; font-size: 13px;
      }
      .sim-dlg-actions { margin-top: 14px; display: flex; }
    `;
    document.head.appendChild(style);
    dlgStyleInjected = true;
  }
  function showSimDialog({ title, bodyHtml, okText }) {
    ensureDialogStyle();
    const ov = document.createElement('div');
    ov.className = 'sim-dlg-overlay';
    ov.innerHTML = '<div class="sim-dlg" role="dialog" aria-modal="true"><h3 class="sim-dlg-title"></h3>' +
      '<div class="sim-dlg-body"></div><div class="sim-dlg-actions"><button type="button" class="sim-btn sim-btn-run"></button></div></div>';
    ov.querySelector('.sim-dlg-title').textContent = title;
    ov.querySelector('.sim-dlg-body').innerHTML = bodyHtml;
    const btn = ov.querySelector('button');
    btn.textContent = okText || 'فهمیدم';
    function close() {
      document.removeEventListener('keydown', onKey, true);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }
    // Escape فقط دیالوگ را ببندد، نه تمام‌صفحه را
    function onKey(e) {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      close();
    }
    btn.addEventListener('click', close);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(ov);
    btn.focus();
    return close;
  }

  /* ------------------------------ Starter & Storage ------------------------------ */
  function starterCode(taskId, pins) {
    const task = TASKS[taskId] || TASKS.blink;
    return task.starter(pins);
  }

  function loadSavedCode(id, taskId, pins) {
    try {
      const raw = localStorage.getItem(CODE_STORAGE_PREFIX + id);
      if (raw) return raw;
    } catch (e) { /* ignore */ }
    return starterCode(taskId, pins);
  }

  function saveCode(id, code) {
    try { localStorage.setItem(CODE_STORAGE_PREFIX + id, code); } catch (e) { /* ignore */ }
  }

  // چیدمانِ بلوک‌ها (این‌که هر بلوک روی بومِ کار کجا نشسته) جدا از خودِ کد
  // ذخیره می‌شود — چون این چیزی نیست که ArduinoLang یا خودِ کدِ متنی نگهش
  // دارد. بدونِ این، با هر بستن و بازکردنِ صفحه، بلوک‌ها به چیدمانِ پیش‌فرض
  // برمی‌گشتند.
  function loadSavedLayout(id) {
    try {
      const raw = localStorage.getItem(BLOCK_LAYOUT_STORAGE_PREFIX + id);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveLayout(id, layoutObj) {
    try { localStorage.setItem(BLOCK_LAYOUT_STORAGE_PREFIX + id, JSON.stringify(layoutObj)); } catch (e) { /* ignore */ }
  }

  // { code, snapshot } — snapshot خودش { ws, viewport } است (خروجیِ
  // ArduinoBlocks.saveWorkspaceSnapshot). نگه‌داشتنِ code کنارِ آن، تنها
  // راهِ فهمیدنِ این است که آیا این عکسِ فوری هنوز معتبر است یا کاربر از
  // آن‌موقع مستقیم متن را دستی عوض کرده.
  function loadStoredBlockSnapshot(id) {
    try {
      const raw = localStorage.getItem(BLOCK_SNAPSHOT_STORAGE_PREFIX + id);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function storeBlockSnapshot(id, obj) {
    try { localStorage.setItem(BLOCK_SNAPSHOT_STORAGE_PREFIX + id, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }

  // بعد از «کد اولیه»، چیدمان و عکسِ فوریِ قدیمیِ بلوک‌ها دیگر به کدِ جدید
  // نمی‌خورند؛ پاکشان می‌کنیم تا بلوک‌ها از رویِ خودِ کد و با چیدمانِ پیش‌فرض ساخته شوند.
  function clearStoredBlockState(id) {
    try { localStorage.removeItem(BLOCK_SNAPSHOT_STORAGE_PREFIX + id); } catch (e) { /* ignore */ }
    try { localStorage.removeItem(BLOCK_LAYOUT_STORAGE_PREFIX + id); } catch (e) { /* ignore */ }
  }

  function loadSavedMode() {
    try {
      const raw = localStorage.getItem(MODE_STORAGE_KEY);
      if (raw === 'blocks' || raw === 'text') return raw;
    } catch (e) { /* ignore */ }
    return 'text';
  }

  function saveMode(mode) {
    try { localStorage.setItem(MODE_STORAGE_KEY, mode); } catch (e) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent(MODE_CHANGE_EVENT, { detail: { mode } }));
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------ SVG Circuits ------------------------------ */
  /* برد Arduino Uno R3 مثل بخش الکترونیک (آبی، USB، جک برق، سوکت‌ها، ATmega، لوگو). مختصات داخلی mil است
     (برد ۲٫۷″×۲٫۱″)؛ ۹۰ درجه چرخیده تا USB بالا و سوکت‌های دیجیتال (D0–D13) سمت راست باشند.
     پایه‌های شبیه‌ساز (دایره‌های x=148) روی همین سوکت‌های راست می‌نشینند. */
  function boardBaseSVG() {
    const S = 0.055, X0 = 150, Y0 = 22;
    const sock = (x0, n, y) => `<rect x="${x0 - 50}" y="${y - 65}" width="${n * 100}" height="130" rx="12" fill="#171a1f" stroke="#000" stroke-width="10"/>`
      + Array.from({ length: n }, (_, k) => `<rect x="${x0 + 100 * k - 26}" y="${y - 26}" width="52" height="52" fill="#4b525c"/>`).join('');
    const logo = (cx, cy) => `<g fill="none" stroke="#f4fbfb" stroke-linecap="round"><circle cx="${cx - 105}" cy="${cy}" r="92" stroke-width="30"/><circle cx="${cx + 105}" cy="${cy}" r="92" stroke-width="30"/><path d="M${cx - 150} ${cy}h90M${cx + 60} ${cy}h90M${cx + 105} ${cy - 45}v90" stroke-width="22"/></g>`;
    return `
      <g transform="translate(${X0} ${Y0}) rotate(90) scale(${S})">
        <rect x="0" y="0" width="2700" height="2100" rx="70" fill="#1a6fb5" stroke="#0e4a7d" stroke-width="30"/>
        <g fill="#b9c0c8">${Array.from({ length: 14 }, (_, k) => `<rect x="${1069 + 93 * k}" y="1160" width="42" height="80"/><rect x="${1069 + 93 * k}" y="1540" width="42" height="80"/>`).join('')}</g>
        <rect x="1050" y="1230" width="1350" height="320" rx="24" fill="#16181d"/>
        <path d="M1050 1335a55 55 0 0 1 0 110z" fill="#2c3037"/>
        <rect x="640" y="235" width="220" height="220" rx="24" fill="#b7bec6" stroke="#6d757e" stroke-width="18"/>
        <circle cx="750" cy="345" r="72" fill="#c93030"/>
        ${sock(1900, 8, 100)}${sock(800, 10, 100)}${sock(1000, 8, 2000)}${sock(1900, 6, 2000)}
        <rect x="-270" y="180" width="690" height="480" rx="30" fill="#c9d0d7" stroke="#8b949e" stroke-width="22"/>
        <rect x="-80" y="1300" width="640" height="440" rx="36" fill="#1b1d22"/>
        ${logo(1700, 620)}
        <text x="1700" y="1060" font-size="190" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="#f4fbfb">UNO</text>
      </g>`;
  }

  /* LED واقعی (همان LED بخش الکترونیک): گنبد به راست، پایه‌ها به چپ؛ پایه‌ی بلند (آند) بالا و کوتاه (کاتد) پایین.
     (ax, ay) سرِ پایه‌ی آند است که سیمِ مقاومت به آن می‌رسد؛ کاتد در (ax+9.6, ay+16). id=simLedBulb لایه‌ی روشنِ LED است. */
  function realLedSVG(ax, ay) {
    const k = 0.8, cx = ax + 32, cy = ay + 8;
    const body = 'M-9,-20 H6 A20,20 0 0 1 6,20 H-9 Z';
    return `
      <g id="simLedGroup" class="sim-led-group" transform="translate(${cx} ${cy}) scale(${k})">
        <circle class="lr-glow" cx="6" cy="0" r="26" fill="#ff4d3d" opacity="0"/>
        <g stroke="#b9bfc9" stroke-width="3" stroke-linecap="round"><line x1="-14" y1="-10" x2="-40" y2="-10"/><line x1="-14" y1="10" x2="-28" y2="10"/></g>
        <path d="${body}" fill="url(#simLrOff)" stroke="#7a403a" stroke-width="1"/>
        <g stroke="#8c93a0" stroke-width="3"><line x1="-9" y1="-10" x2="-1" y2="-10"/><line x1="-9" y1="10" x2="0" y2="10"/></g>
        <polygon points="-1,3 6,6 6,14 -1,17" fill="#9aa1ad" stroke="#6b7280" stroke-width=".6"/>
        <rect x="1" y="8" width="3" height="4" fill="#d9b94a"/>
        <path d="M2.5,8 Q9,-6 -1,-10" fill="none" stroke="#d9b94a" stroke-width=".9"/>
        <path id="simLedBulb" d="${body}" fill="url(#simLrOn)" opacity="0"/>
        <path d="M-14,-24 H-9 V20 H-12 L-14,17 Z" fill="#d8dce3" stroke="#8a929e" stroke-width=".8"/>
        <path d="M3.4,-14.8 A15,15 0 0 1 16.6,-10.6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
      </g>`;
  }
  const LED_DEFS = `
        <radialGradient id="simLrOff" cx="62%" cy="38%" r="75%"><stop offset="0%" stop-color="#e3b9b3"/><stop offset="55%" stop-color="#a65a53"/><stop offset="100%" stop-color="#63302b"/></radialGradient>
        <radialGradient id="simLrOn" cx="62%" cy="38%" r="75%"><stop offset="0%" stop-color="#fff3ef"/><stop offset="55%" stop-color="#ff5a4a"/><stop offset="100%" stop-color="#b3261e"/></radialGradient>`;

function serialSVG() {
  return `
  <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="true">
    ${boardBaseSVG()}

    <line x1="150" y1="60" x2="176" y2="60" class="sim-wire sim-wire-live"/>

    <rect x="176" y="34" width="106" height="80" rx="6" class="sim-monitor-body"/>
    <rect x="182" y="40" width="94" height="60" rx="3" class="sim-monitor-screen"/>

    <clipPath id="simSerialScreenClip">
      <rect x="184" y="42" width="90" height="56"/>
    </clipPath>

    <text
      x="186"
      y="66"
      class="sim-monitor-text sim-monitor-text-sm"
      text-anchor="start"
      direction="ltr"
      unicode-bidi="isolate"
      id="simSerialGlyph"
      clip-path="url(#simSerialScreenClip)">
    </text>

    <rect x="216" y="114" width="26" height="8" rx="2" class="sim-monitor-body"/>
    <rect x="204" y="122" width="50" height="5" rx="2" class="sim-monitor-body"/>

    <text x="229" y="150" text-anchor="middle" class="sim-caption">سریال مانیتور</text>
  </svg>`;
}

  function ledSVG(pin) {
    return `
    <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="true">
      <defs>${LED_DEFS}
        <filter id="simLedGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect x="170" y="46" width="112" height="112" rx="8" class="sim-bb-outline"/>
      ${boardBaseSVG()}

      <circle cx="148" cy="70" r="3.2" class="sim-pin-dot sim-pin-live"/>
      <text x="137" y="73.5" text-anchor="end" class="sim-pin-label">${pin}</text>
      <circle cx="148" cy="140" r="3.2" class="sim-pin-dot sim-pin-gnd"/>
      <text x="137" y="143.5" text-anchor="end" class="sim-pin-label sim-pin-label-muted">GND</text>

      <line x1="148" y1="70" x2="176" y2="70" class="sim-wire sim-wire-live"/>
      <rect x="176" y="64" width="38" height="12" rx="2" class="sim-resistor-body"/>
      <rect x="184" y="64" width="3" height="12" class="sim-band sim-band-1"/>
      <rect x="192" y="64" width="3" height="12" class="sim-band sim-band-2"/>
      <rect x="200" y="64" width="3" height="12" class="sim-band sim-band-3"/>
      <line x1="214" y1="70" x2="238" y2="70" class="sim-wire sim-wire-live"/>

      ${realLedSVG(238, 70)}
      <line x1="247.6" y1="86" x2="247.6" y2="140" class="sim-wire sim-wire-gnd"/>
      <line x1="247.6" y1="140" x2="148" y2="140" class="sim-wire sim-wire-gnd"/>

      <text x="262" y="178" text-anchor="middle" class="sim-caption">LED + مقاومت ۲۲۰Ω</text>
    </svg>`;
  }

  function ledButtonSVG(pin, buttonPin) {
    return `
    <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="true">
      <defs>${LED_DEFS}
        <filter id="simLedGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect x="170" y="26" width="112" height="132" rx="8" class="sim-bb-outline"/>
      ${boardBaseSVG()}

      <circle cx="148" cy="62" r="3.2" class="sim-pin-dot sim-pin-live"/>
      <text x="137" y="65.5" text-anchor="end" class="sim-pin-label">${pin}</text>
      <circle cx="148" cy="104" r="3.2" class="sim-pin-dot sim-pin-in"/>
      <text x="137" y="107.5" text-anchor="end" class="sim-pin-label">${buttonPin}</text>
      <circle cx="148" cy="150" r="3.2" class="sim-pin-dot sim-pin-gnd"/>
      <text x="137" y="153.5" text-anchor="end" class="sim-pin-label sim-pin-label-muted">GND</text>

      <line x1="148" y1="62" x2="176" y2="62" class="sim-wire sim-wire-live"/>
      <rect x="176" y="56" width="34" height="12" rx="2" class="sim-resistor-body"/>
      <rect x="183" y="56" width="3" height="12" class="sim-band sim-band-1"/>
      <rect x="190" y="56" width="3" height="12" class="sim-band sim-band-2"/>
      <rect x="197" y="56" width="3" height="12" class="sim-band sim-band-3"/>
      <line x1="210" y1="62" x2="241" y2="62" class="sim-wire sim-wire-live"/>

      ${realLedSVG(241, 62)}
      <line x1="250.6" y1="78" x2="250.6" y2="150" class="sim-wire sim-wire-gnd"/>
      <line x1="250.6" y1="150" x2="148" y2="150" class="sim-wire sim-wire-gnd"/>

      <line x1="148" y1="104" x2="196" y2="104" class="sim-wire sim-wire-in"/>
      <g id="simButtonGroup" class="sim-push-group">
        <rect x="196" y="91" width="30" height="26" rx="5" class="sim-push-base"/>
        <circle id="simButtonCap" cx="211" cy="104" r="9" class="sim-push-btn"/>
        <line x1="226" y1="104" x2="240" y2="104" class="sim-wire sim-wire-gnd"/>
        <line x1="240" y1="104" x2="240" y2="150" class="sim-wire sim-wire-gnd"/>
        <rect id="simButtonHit" x="188" y="83" width="46" height="42" rx="10" class="sim-push-hit"/>
      </g>

      <text x="222" y="178" text-anchor="middle" class="sim-caption">LED + دکمه (INPUT_PULLUP)</text>
    </svg>`;
  }

  function potSVG(pin, potPin) {
    return `
    <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="true">
      <defs>${LED_DEFS}
        <filter id="simLedGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect x="170" y="26" width="112" height="132" rx="8" class="sim-bb-outline"/>
      ${boardBaseSVG()}

      <circle cx="148" cy="62" r="3.2" class="sim-pin-dot sim-pin-live"/>
      <text x="137" y="65.5" text-anchor="end" class="sim-pin-label">${pin}</text>
      <circle cx="148" cy="104" r="3.2" class="sim-pin-dot sim-pin-in"/>
      <text x="137" y="107.5" text-anchor="end" class="sim-pin-label">${potPin}</text>
      <circle cx="148" cy="150" r="3.2" class="sim-pin-dot sim-pin-gnd"/>
      <text x="137" y="153.5" text-anchor="end" class="sim-pin-label sim-pin-label-muted">GND</text>

      <line x1="148" y1="62" x2="176" y2="62" class="sim-wire sim-wire-live"/>
      <rect x="176" y="56" width="34" height="12" rx="2" class="sim-resistor-body"/>
      <rect x="183" y="56" width="3" height="12" class="sim-band sim-band-1"/>
      <rect x="190" y="56" width="3" height="12" class="sim-band sim-band-2"/>
      <rect x="197" y="56" width="3" height="12" class="sim-band sim-band-3"/>
      <line x1="210" y1="62" x2="241" y2="62" class="sim-wire sim-wire-live"/>

      ${realLedSVG(241, 62)}
      <line x1="250.6" y1="78" x2="250.6" y2="150" class="sim-wire sim-wire-gnd"/>
      <line x1="250.6" y1="150" x2="148" y2="150" class="sim-wire sim-wire-gnd"/>

      <line x1="148" y1="104" x2="199" y2="104" class="sim-wire sim-wire-in"/>
      <g id="simPotGroup" class="sim-pot-group">
        <circle cx="215" cy="104" r="17" class="sim-pot-ring"/>
        <circle cx="215" cy="104" r="14.5" class="sim-pot-body"/>
        <line x1="215" y1="91" x2="215" y2="86" class="sim-pot-tick sim-pot-tick-min" transform="rotate(-90 215 104)"/>
        <line x1="215" y1="91" x2="215" y2="86" class="sim-pot-tick sim-pot-tick-max" transform="rotate(90 215 104)"/>
        <g id="simPotNeedleGroup">
          <line x1="215" y1="104" x2="215" y2="90" class="sim-pot-needle"/>
          <circle cx="215" cy="90" r="2" class="sim-pot-tip"/>
        </g>
        <circle cx="215" cy="104" r="3" class="sim-pot-hub"/>
        <circle id="simPotHit" cx="215" cy="104" r="22" class="sim-pot-hit"/>
      </g>
      <line x1="232" y1="104" x2="240" y2="104" class="sim-wire sim-wire-gnd"/>
      <line x1="240" y1="104" x2="240" y2="150" class="sim-wire sim-wire-gnd"/>

      <text x="222" y="178" text-anchor="middle" class="sim-caption">LED + پتانسیومتر (Analog/PWM)</text>
    </svg>`;
  }

  function stm32BlinkSVG() {
    /* برد Blue Pill (مثل ماموریت ST-Link): بدنه‌ی آبی، هدرِ پایه‌ها، micro-USB، RESET، جامپرهای BOOT،
       چیپ STM32F103C8T6، کریستال و LED سبزِ PC13. شناسه‌های simLedGroup / simLedBulb را شبیه‌ساز روشن و خاموش می‌کند. */
    let pads = '';
    for (let i = 0; i < 20; i++) {
      const x = (40 + i * 11.8).toFixed(1);
      [42, 138].forEach(y => { pads += `<circle cx="${x}" cy="${y}" r="2.6" fill="#d9b94a"/><circle cx="${x}" cy="${y}" r="1" fill="#0b1a3a"/>`; });
    }
    let swd = '';
    for (let i = 0; i < 4; i++) swd += `<circle cx="272" cy="${80 + i * 8}" r="2.2" fill="#d9b94a"/><circle cx="272" cy="${80 + i * 8}" r="0.9" fill="#0b1a3a"/>`;
    let ticks = '';
    for (let i = 0; i < 6; i++) {
      const o = 122 + i * 7.4;
      ticks += `<rect x="${o}" y="65" width="2.4" height="3" fill="#8a93a6"/><rect x="${o}" y="116" width="2.4" height="3" fill="#8a93a6"/>`
             + `<rect x="115" y="${72 + i * 7.4}" width="3" height="2.4" fill="#8a93a6"/><rect x="166" y="${72 + i * 7.4}" width="3" height="2.4" fill="#8a93a6"/>`;
    }
    const boot = (y, label) => `<rect x="42" y="${y}" width="22" height="7" rx="1.5" fill="#101216"/><circle cx="47" cy="${y + 3.5}" r="1.6" fill="#d9b94a"/><circle cx="53" cy="${y + 3.5}" r="1.6" fill="#d9b94a"/><circle cx="59" cy="${y + 3.5}" r="1.6" fill="#d9b94a"/><text x="68" y="${y + 6}" class="sim-board-sub" style="font-size:5.5px;letter-spacing:.3px;fill:#bcd0f5">${label}</text>`;
    return `
    <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="true">
      <defs>
        <filter id="simLedGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="16" y="34" width="268" height="112" rx="8" fill="#1b4fb0" stroke="#4a7fd8"/>
      ${pads}
      <rect x="6" y="78" width="22" height="34" rx="2" fill="#c8d0dc" stroke="#8a93a6"/><rect x="9" y="86" width="14" height="18" rx="1.5" fill="#2a2f3a"/>
      <rect x="42" y="68" width="14" height="14" rx="2" fill="#dfe4ec" stroke="#8a93a6"/>
      <text x="49" y="92" text-anchor="middle" class="sim-board-sub" style="font-size:5.5px;letter-spacing:.3px;fill:#bcd0f5">RESET</text>
      ${boot(102, 'BOOT0')}${boot(116, 'BOOT1')}
      <rect x="118" y="68" width="48" height="48" rx="2" fill="#101216"/>${ticks}<circle cx="123" cy="73" r="1.4" fill="#8a93a6"/>
      <text x="142" y="90" text-anchor="middle" class="sim-board-label" style="font-size:8px">STM32</text>
      <text x="142" y="101" text-anchor="middle" class="sim-board-sub" style="font-size:6px">F103C8T6</text>
      <ellipse cx="192" cy="92" rx="4.5" ry="9" fill="#cfd4dc" stroke="#7c8594"/>
      ${swd}
      <text x="272" y="72" text-anchor="middle" class="sim-board-sub" style="font-size:5.5px;fill:#bcd0f5">SWD</text>
      <g id="simLedGroup" class="sim-led-group">
        <line x1="236" y1="70" x2="242" y2="64" class="sim-led-ray"/>
        <line x1="236" y1="70" x2="230" y2="64" class="sim-led-ray"/>
        <line x1="247" y1="82" x2="254" y2="82" class="sim-led-ray"/>
        <circle id="simLedBulb" cx="236" cy="82" r="9" class="sim-led-bulb"/>
      </g>
      <text x="236" y="102" text-anchor="middle" class="sim-pin-label" style="font-size:7px;fill:#e6eefc">PC13</text>
      <text x="150" y="132" text-anchor="middle" class="sim-board-sub" style="font-size:7px;fill:#bcd0f5">BLUE PILL</text>
      <text x="150" y="172" text-anchor="middle" class="sim-caption">Blue Pill — LED روی PC13 (صفر = روشن، یک = خاموش)</text>
    </svg>`;
  }

  function servoSVG(pin) {
    return `
    <svg viewBox="0 0 300 190" class="sim-board-svg" aria-hidden="true">
      <rect x="170" y="26" width="112" height="132" rx="8" class="sim-bb-outline"/>
      ${boardBaseSVG()}

      <circle cx="148" cy="92" r="3.2" class="sim-pin-dot sim-pin-live"/>
      <text x="137" y="95.5" text-anchor="end" class="sim-pin-label">${pin}</text>
      <circle cx="148" cy="150" r="3.2" class="sim-pin-dot sim-pin-gnd"/>
      <text x="137" y="153.5" text-anchor="end" class="sim-pin-label sim-pin-label-muted">GND</text>

      <line x1="148" y1="92" x2="196" y2="92" class="sim-wire sim-wire-in"/>
      <g id="simServoGroup">
        <rect x="184" y="83" width="12" height="18" rx="2" class="sim-servo-flange"/>
        <rect x="268" y="83" width="12" height="18" rx="2" class="sim-servo-flange"/>
        <rect x="196" y="76" width="72" height="32" rx="6" class="sim-servo-body"/>
        <rect x="222" y="56" width="20" height="20" rx="4" class="sim-servo-drum"/>
        <g id="simServoHornGroup">
          <line x1="232" y1="56" x2="232" y2="26" class="sim-servo-horn"/>
          <circle cx="232" cy="26" r="3.4" class="sim-servo-horn-tip"/>
        </g>
        <circle cx="232" cy="56" r="3.4" class="sim-servo-shaft"/>
      </g>
      <line x1="232" y1="108" x2="232" y2="150" class="sim-wire sim-wire-gnd"/>
      <line x1="232" y1="150" x2="148" y2="150" class="sim-wire sim-wire-gnd"/>

      <text x="226" y="176" text-anchor="middle" class="sim-caption">سروو موتور (Servo)</text>
    </svg>`;
  }

  /* --------------------------- Tasks (per mission) --------------------------- */
  // شماره‌ی معادل پین‌های آنالوگ A0..A5 روی آردوینو Uno (برای مقایسه‌ی امن، چون
  // کد نوشته‌شده توسط کاربر ممکن است A0 را به‌صورت رشته یا عدد معادلش برگرداند).
  const ANALOG_PIN_ALIASES = { A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19 };
  function pinsMatch(a, b) {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;
    const na = Object.prototype.hasOwnProperty.call(ANALOG_PIN_ALIASES, a) ? ANALOG_PIN_ALIASES[a] : a;
    const nb = Object.prototype.hasOwnProperty.call(ANALOG_PIN_ALIASES, b) ? ANALOG_PIN_ALIASES[b] : b;
    return na === nb || String(na) === String(nb);
  }
  function ledEventsOf(state) {
    return state.events.filter(e => e.pin === state.pins.led);
  }

  const TASKS = {
    serial: {
      board: () => serialSVG(),
      hint: 'کد را بنویس و «اجرا کن» را بزن تا پیام در کنسول سریال ظاهر شود.',
      successText: '🎉 آفرین! برد حرف زد — مأموریت تکمیل شد.',
      successLog: '✓ پیام Hello World روی سریال دریافت شد.',
      starter: () => `void setup() {

}

void loop() {

}
`,
      check(state) {
        const lines = state.serial.filter(s => s.trim());
        if (!lines.length) {
          return { ok: false, reason: 'هنوز چیزی چاپ نشده — از ()Serial.begin و ()Serial.println استفاده کن.' };
        }
        if (!lines.some(s => /hello\s*,?\s*world/i.test(s))) {
          return { ok: false, reason: 'پیام چاپ شد، اما متن آن باید «Hello World» باشد.' };
        }
        return { ok: true };
      }
    },

    ledOn: {
      board: pins => ledSVG(pins.led),
      hint: 'پین را خروجی کن، LED را روشن کن و «اجرا کن» را بزن.',
      successText: '🎉 عالی بود! LED روشن شد — مأموریت تکمیل شد.',
      successLog: '✓ روشن‌شدن LED با موفقیت تشخیص داده شد.',
      starter: pins => `int ledPin = ${pins.led};

void setup() {

}

void loop() {

}
`,
      check(state) {
        if (state.pinModes[state.pins.led] !== 'OUTPUT') {
          return { ok: false, reason: `پایه ${state.pins.led} هنوز با ()pinMode روی OUTPUT تنظیم نشده.` };
        }
        const pinEvents = ledEventsOf(state);
        if (!pinEvents.length) {
          return { ok: false, reason: 'هنوز به LED فرمانی نرسیده — از ()digitalWrite استفاده کن.' };
        }
        if (pinEvents[pinEvents.length - 1].val <= 0) {
          return { ok: false, reason: 'LED خاموش است — با HIGH آن را روشن کن.' };
        }
        return { ok: true };
      }
    },

    blink: {
      board: pins => ledSVG(pins.led),
      hint: 'کد چشمک‌زن را بنویس و «اجرا کن» را بزن.',
      successText: '🎉 عالی بود! LED درست چشمک زد — مأموریت تکمیل شد.',
      successLog: '✓ چشمک‌زدن با موفقیت تشخیص داده شد.',
      starter: pins => `int ledPin = ${pins.led};

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {

}
`,
      check(state) {
        if (state.pinModes[state.pins.led] !== 'OUTPUT') {
          return { ok: false, reason: `پایه ${state.pins.led} هنوز با ()pinMode روی OUTPUT تنظیم نشده.` };
        }
        const pinEvents = ledEventsOf(state);
        if (pinEvents.length < 2) {
          return { ok: false, reason: 'هنوز LED روشن و خاموش (چشمک) نشده — از ()digitalWrite با HIGH و LOW استفاده کن.' };
        }
        let toggles = 0;
        for (let i = 1; i < pinEvents.length; i++) {
          if (pinEvents[i].val !== pinEvents[i - 1].val && pinEvents[i].ms > pinEvents[i - 1].ms) toggles++;
        }
        if (toggles < 2) {
          return { ok: false, reason: 'LED باید حداقل یک‌بار کامل روشن ← خاموش ← روشن شود (با delay() بین هرکدام).' };
        }
        return { ok: true };
      }
    },

    button: {
      board: pins => ledButtonSVG(pins.led, pins.button),
      hasButton: true,
      maxRunMs: 60000,
      hint: 'کد را بنویس، «اجرا کن» را بزن و بعد دکمه‌ی مدار را نگه دار.',
      successText: '🎉 آفرین! دکمه LED را کنترل کرد — مأموریت تکمیل شد.',
      successLog: '✓ روشن‌شدن با فشار دکمه و خاموش‌شدن با رها کردن تشخیص داده شد.',
      starter: pins => `int ledPin = ${pins.led};
int buttonPin = ${pins.button};

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {

}
`,
      check(state) {
        if (state.pinModes[state.pins.led] !== 'OUTPUT') {
          return { ok: false, reason: `پایه ${state.pins.led} هنوز با ()pinMode روی OUTPUT تنظیم نشده.` };
        }
        const btnMode = state.pinModes[state.pins.button];
        if (btnMode !== 'INPUT' && btnMode !== 'INPUT_PULLUP') {
          return { ok: false, reason: `پایه ${state.pins.button} باید با ()pinMode روی INPUT_PULLUP تنظیم شود.` };
        }
        if (!state.buttonSeen) {
          return { ok: false, reason: 'حالا دکمه‌ی مدار را نگه دار تا نتیجه را ببینیم.' };
        }
        if (!state.ledOnWhilePressed) {
          return { ok: false, reason: 'با فشار دکمه، LED باید روشن شود — یادت باشد با INPUT_PULLUP دکمه‌ی فشرده LOW می‌خواند، نه HIGH.' };
        }
        if (!state.ledOffWhenReleased) {
          return { ok: false, reason: 'دکمه را رها کن؛ LED باید خاموش شود.' };
        }
        return { ok: true };
      }
    },

    pot: {
      board: pins => potSVG(pins.led, pins.pot),
      hasPot: true,
      maxRunMs: 60000,
      hint: 'کد را بنویس، «اجرا کن» را بزن و بعد دسته‌ی ولوم را از کم به زیاد بکش.',
      successText: '🎉 آفرین! روشنایی LED با ولوم کنترل شد — مأموریت تکمیل شد.',
      successLog: '✓ کنترل روشنایی با پتانسیومتر (analogRead + PWM) تشخیص داده شد.',
      starter: pins => `int ledPin = ${pins.led};
int potPin = ${pins.pot};

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {

}
`,
      check(state) {
        if (state.pinModes[state.pins.led] !== 'OUTPUT') {
          return { ok: false, reason: `پایه ${state.pins.led} هنوز با ()pinMode روی OUTPUT تنظیم نشده.` };
        }
        if (!state.potSeen) {
          return { ok: false, reason: 'هنوز از ()analogRead روی پین ولوم استفاده نشده.' };
        }
        const pinEvents = ledEventsOf(state);
        if (!pinEvents.length) {
          return { ok: false, reason: 'هنوز به LED فرمانی نرسیده — از ()analogWrite استفاده کن.' };
        }
        if (!state.lowBrightnessSeen || !state.highBrightnessSeen) {
          return { ok: false, reason: 'دسته‌ی ولوم را کامل از کم به زیاد بچرخان تا روشنایی LED واقعاً کم و زیاد شود.' };
        }
        return { ok: true };
      }
    },

    stm32blink: {
      board: () => stm32BlinkSVG(),
      blocksTask: 'hal',
      halMain: true,
      activeLow: true,
      maxRunMs: 60000,
      hint: 'کد داخل while(1) را بنویس و «اجرا کن» را بزن — LED روی PC13 باید چشمک بزند.',
      successText: '🎉 آفرین! LED روی PC13 روشن و خاموش شد — اولین چشمک‌زن STM32 تو آماده است.',
      successLog: '✓ چشمک‌زدن LED روی PC13 با HAL تشخیص داده شد.',
      starter: () => `int main(void)
{
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();

  while (1)
  {

  }
}
`,
      check(state) {
        const pinEvents = ledEventsOf(state);
        if (!pinEvents.length) {
          return { ok: false, reason: 'هنوز به LED روی PC13 فرمانی نرسیده — از HAL_GPIO_WritePin یا HAL_GPIO_TogglePin با GPIOC و GPIO_PIN_13 استفاده کن.' };
        }
        let toggles = 0;
        for (let i = 1; i < pinEvents.length; i++) {
          if (pinEvents[i].val !== pinEvents[i - 1].val && pinEvents[i].ms > pinEvents[i - 1].ms) toggles++;
        }
        if (toggles < 2) {
          return { ok: false, reason: 'LED باید حداقل یک‌بار کامل روشن ← خاموش ← روشن شود (با HAL_Delay() بین هرکدام).' };
        }
        return { ok: true };
      }
    },

    servo: {
      board: pins => servoSVG(pins.led),
      maxRunMs: 60000,
      hint: 'کد را بنویس و «اجرا کن» را بزن — بازوی سروو باید بین ۰ تا ۱۸۰ درجه رفت‌وبرگشت کند.',
      successText: '🎉 آفرین! سروو بین ۰ تا ۱۸۰ درجه حرکت کرد — مأموریت تکمیل شد.',
      successLog: '✓ چرخش کامل سروو (Servo.write) بین کم و زیاد تشخیص داده شد.',
      starter: pins => `#include <Servo.h>
Servo myServo;
int servoPin = ${pins.led};

void setup() {
  myServo.attach(servoPin);

}

void loop() {

}
`,
      check(state) {
        if (!state.servoAttached) {
          return { ok: false, reason: 'هنوز سروو با ()attach به پین سیگنال وصل نشده.' };
        }
        if (state.servoPin !== undefined && state.servoPin !== state.pins.led) {
          return { ok: false, reason: `سروو باید به پایه‌ی ${state.pins.led} وصل شود.` };
        }
        if (!state.servoSeen) {
          return { ok: false, reason: 'هنوز زاویه‌ای با ()myServo.write به سروو فرستاده نشده.' };
        }
        if (!state.lowAngleSeen || !state.highAngleSeen) {
          return { ok: false, reason: 'زاویه را کامل از نزدیک ۰ تا نزدیک ۱۸۰ درجه تغییر بده تا حرکت کامل دیده شود.' };
        }
        return { ok: true };
      }
    }
  };

  /* ------------------------ STM32: int main() ⇄ setup()/loop() ------------------------
     متنِ مأموریت‌های STM32 مثل CubeIDE یک int main() با while(1) است؛ ادیتورِ بلوکی دو ناحیه‌ی
     «هنگام شروع» و «همیشه تکرار کن» (همان setup/loop) دارد. این دو تابع بینِ این دو شکل ترجمه می‌کنند.
     خطوطِ راه‌اندازیِ CubeMX (HAL_Init و …) در بلوک‌ها دیده نمی‌شوند و موقعِ بازگشت به متن دوباره اضافه می‌شوند. */
  const HAL_DEFAULT_INIT = ['HAL_Init();', 'SystemClock_Config();', 'MX_GPIO_Init();'];
  const HAL_INIT_LINE_RE = /^\s*(HAL_Init|SystemClock_Config|MX_[A-Za-z0-9_]+_Init)\s*\(\s*\)\s*;\s*$/;
  // نقطه‌ی بعد از «{»ی باز شده در idx را می‌گیرد و جای «}»ی متناظر را برمی‌گرداند (کامنت‌ها را رد می‌کند).
  function halMatchBrace(src, idx) {
    let d = 1, i = idx;
    while (i < src.length && d > 0) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      if (c === '{') d++; else if (c === '}') { d--; if (d === 0) return i; }
      i++;
    }
    return -1;
  }
  function halDedent(body) {
    const lines = body.replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
    const ind = Math.min(99, ...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(ind === 99 ? 0 : ind)).join('\n');
  }
  const halIndent = (t, n) => (t.trim() ? t.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n') + '\n' : '');
  function halMainToBlockCode(text) {
    const m = /int\s+main\s*\(\s*(?:void)?\s*\)\s*\{/.exec(text);
    if (!m) return text;
    const open = m.index + m[0].length, close = halMatchBrace(text, open);
    if (close < 0) return text;
    const body = text.slice(open, close);
    const w = /while\s*\(\s*(?:1|true)\s*\)\s*\{/.exec(body);
    if (!w) return text;
    const wOpen = w.index + w[0].length, wClose = halMatchBrace(body, wOpen);
    if (wClose < 0) return text;
    const pre = body.slice(0, w.index).split('\n').filter((l) => !HAL_INIT_LINE_RE.test(l)).join('\n');
    return 'void setup() {\n' + halIndent(halDedent(pre), 2) + '}\n\nvoid loop() {\n' + halIndent(halDedent(body.slice(wOpen, wClose)), 2) + '}\n';
  }
  function halBodyOf(code, fn) {
    const m = new RegExp('void\\s+' + fn + '\\s*\\(\\s*\\)\\s*\\{').exec(code);
    if (!m) return '';
    const open = m.index + m[0].length, close = halMatchBrace(code, open);
    return close < 0 ? '' : halDedent(code.slice(open, close));
  }
  function halBlockCodeToMain(code, initLines) {
    const init = (initLines || HAL_DEFAULT_INIT).map((l) => '  ' + l).join('\n');
    const setup = halBodyOf(code, 'setup'), loop = halBodyOf(code, 'loop');
    return 'int main(void)\n{\n' + init + '\n' + (setup.trim() ? halIndent(setup, 2) : '') + '\n  while (1)\n  {\n' + halIndent(loop, 4) + '  }\n}\n';
  }
  // مأموریتِ رباتیکِ STM32: سخت‌افزار (حسگرها، موتورها، …) را hal-code-editor.js می‌سازد و این‌جا فقط ادیتور/اجرا مالِ ArduinoSim است.
  function makeHalTask(h) {
    return {
      board: () => '<div class="sim-hal-hw"></div>',
      blocksTask: h.blocksTask || 'hal',
      halMain: true,
      halInit: h.initLines,
      maxRunMs: 10 * 60 * 1000,
      hint: h.hint,
      successText: h.successText,
      successLog: h.successLog || '✓ مأموریت با HAL انجام شد.',
      starter: () => h.starter,
      check: () => ({ ok: false })
    };
  }

  /* --------------------------------- Mount --------------------------------- */
  function mount(container, opts) {
    const { missionId, alreadyDone, onSuccess } = opts;
    const halOpts = opts.hal || null;
    const task = halOpts ? makeHalTask(halOpts) : (TASKS[opts.task] || TASKS.blink);
    const isStm = !!task.halMain;
    const blocksTask = task.blocksTask || opts.task;
    const toBlockCode = (t) => (isStm ? halMainToBlockCode(t) : t);
    const fromBlockCode = (c) => (isStm ? halBlockCodeToMain(c, task.halInit) : c);
    const startText = () => (halOpts ? halOpts.starter : starterCode(opts.task, pins));
    const pins = {
      led: opts.pin,
      button: opts.buttonPin,
      pot: opts.potPin
    };
    const runLimitMs = task.maxRunMs || MAX_RUN_MS;

    container.innerHTML = `
      <div class="sim-wrap${isStm ? ' sim-stm' : ''}">
        <div class="sim-board-wrap">
          ${task.board(pins)}
        </div>
        <div class="sim-status" data-state="idle">${task.hint}</div>
        ${task.hasButton ? `
        <div class="sim-hw-row">
          <button type="button" class="sim-push-key" data-act="press">🔘 دکمه را نگه دار</button>
          <span class="sim-hw-note">با ماوس یا انگشت نگه دار — رها کنی، دکمه آزاد می‌شود.</span>
        </div>` : ''}
        ${task.hasPot ? `
        <div class="sim-hw-row sim-hw-row-pot">
          <span class="sim-pot-icon" aria-hidden="true">🎚️</span>
          <input type="range" class="sim-pot-range" min="0" max="1023" value="512" step="1" data-act="pot" aria-label="ولوم"/>
          <span class="sim-hw-note">دسته‌ی ولوم را بکش — چپ = تاریک، راست = کاملاً روشن.</span>
        </div>` : ''}
        <div class="sim-editor-block">
          <div class="sim-editor-head">
            <span class="sim-editor-title">${isStm ? 'کد STM32' : 'کد آردوینو'} <span dir="ltr" style="unicode-bidi: isolate;">(${isStm ? 'C / HAL' : 'Arduino C++'})</span></span>
            <div class="sim-actions">
              <div class="sim-mode-toggle" role="group" aria-label="حالت ادیتور">
                <button type="button" class="is-active" data-act="mode-text">🔤 متنی</button>
                <button type="button" data-act="mode-blocks">🧩 بلوکی</button>
              </div>
              <button type="button" class="sim-btn sim-btn-ghost sim-btn-expand" data-act="expand" title="بزرگ‌نمایی کد">⛶</button>
              <button type="button" class="sim-btn sim-btn-ghost" data-act="reset">↺ کد اولیه</button>
              <button type="button" class="sim-btn sim-btn-stop" data-act="stop" disabled>■ توقف</button>
              <button type="button" class="sim-btn sim-btn-run" data-act="run">▶ اجرا کن</button>
            </div>
          </div>
          <div class="sim-editor-wrap">
            <div class="sim-editor-gutter" aria-hidden="true"></div>
            <div class="sim-editor-errline" aria-hidden="true"></div>
            <pre class="sim-editor sim-editor-hl mono" aria-hidden="true"><code></code></pre>
            <div class="sim-editor-ghost" aria-hidden="true"></div>
            <textarea class="sim-editor mono" wrap="off" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>
          </div>
          <div class="sim-blockly-wrap" style="display:none">
            <div class="sim-blockly-div"></div>
          </div>
        </div>
        <div class="sim-console-wrap" data-role="console-wrap">
          <div class="sim-console-head">
            <span class="sim-console-head-label">${isStm ? 'کنسول' : 'مانیتور سریال'}</span>
            <select class="sim-baud-select" data-act="baud" aria-label="نرخ باد کنسول"${isStm ? ' style="display:none"' : ''}>
              <option value="9600" selected>9600</option>
              <option value="19200">19200</option>
              <option value="38400">38400</option>
              <option value="57600">57600</option>
              <option value="115200">115200</option>
            </select>
          </div>
          <div class="sim-console mono" data-role="console"></div>
        </div>
      </div>`;

    ensureHighlightStyle();

    const el = {
      status: container.querySelector('.sim-status'),
      editorBlock: container.querySelector('.sim-editor-block'),
      editorWrap: container.querySelector('.sim-editor-wrap'),
      boardWrap: container.querySelector('.sim-board-wrap'),
      expandBtn: container.querySelector('[data-act="expand"]'),
      editor: container.querySelector('textarea.sim-editor'),
      modeTextBtn: container.querySelector('[data-act="mode-text"]'),
      modeBlocksBtn: container.querySelector('[data-act="mode-blocks"]'),
      blocklyWrap: container.querySelector('.sim-blockly-wrap'),
      blocklyDiv: container.querySelector('.sim-blockly-div'),
      hlCode: container.querySelector('pre.sim-editor-hl code'),
      hlPre: container.querySelector('pre.sim-editor-hl'),
      ghostEl: container.querySelector('.sim-editor-ghost'),
      gutter: container.querySelector('.sim-editor-gutter'),
      errLine: container.querySelector('.sim-editor-errline'),
      consoleWrap: container.querySelector('[data-role="console-wrap"]'),
      console: container.querySelector('[data-role="console"]'),
      baudSelect: container.querySelector('[data-act="baud"]'),
      runBtn: container.querySelector('[data-act="run"]'),
      stopBtn: container.querySelector('[data-act="stop"]'),
      resetBtn: container.querySelector('[data-act="reset"]'),
      pressBtn: container.querySelector('[data-act="press"]'),
      buttonGroup: container.querySelector('#simButtonGroup'),
      buttonHit: container.querySelector('#simButtonHit'),
      buttonCap: container.querySelector('#simButtonCap'),
      potRange: container.querySelector('[data-act="pot"]'),
      potNeedle: container.querySelector('#simPotNeedleGroup'),
      potHit: container.querySelector('#simPotHit'),
      servoHorn: container.querySelector('#simServoHornGroup'),
      boardSvg: container.querySelector('.sim-board-svg'),
      serialGlyph: container.querySelector('#simSerialGlyph'),
      ledBulb: container.querySelector('#simLedBulb'),
      ledGroup: container.querySelector('#simLedGroup')
    };

    if (task.noBlocks) {
      const modeToggle = container.querySelector('.sim-mode-toggle');
      if (modeToggle) modeToggle.style.display = 'none';
    }

    // پایه‌ی وضعیتِ هر اجرا — check() هر مأموریت روی همین شیء کار می‌کند.
    function freshState() {
      return {
        pins,
        events: [],
        serial: [],
        serialBaud: undefined,
        serialNotBegunWarned: false,
        serialBaudMismatchWarned: false,
        pinModes: {},
        buttonSeen: false,
        lastButtonRead: undefined,
        ledOnWhileReleased: false,
        pullupHintShown: false,
        ledOnWhilePressed: false,
        ledOffWhenReleased: false,
        potSeen: false,
        lowBrightnessSeen: false,
        highBrightnessSeen: false,
        servoAttached: false,
        servoPin: undefined,
        servoSeen: false,
        lowAngleSeen: false,
        highAngleSeen: false
      };
    }

    // Support highlighting several error lines at once (one compile pass can
    // now surface multiple independent problems — see ArduinoLang.compile's
    // `.errors` list). `errLineNodes` is a pool of `.sim-editor-errline` bar
    // elements: the one already in the template, plus clones created on
    // demand and reused across renders instead of recreated every time.
    let errorLineNos = [];
    const errLineNodes = [el.errLine];

    function ensureErrLineNodes(count) {
      while (errLineNodes.length < count) {
        const clone = el.errLine.cloneNode(false);
        el.errLine.parentElement.appendChild(clone);
        errLineNodes.push(clone);
      }
    }

    function renderGutter() {
      const count = el.editor.value.split('\n').length;
      const errSet = new Set(errorLineNos);
      let html = '';
      for (let n = 1; n <= count; n++) {
        html += `<div class="${errSet.has(n) ? 'is-error-line' : ''}">${n}</div>`;
      }
      el.gutter.innerHTML = html;
      el.gutter.scrollTop = el.editor.scrollTop;
    }

    function lineHeightPx() {
      return parseFloat(getComputedStyle(el.editor).lineHeight) || 24;
    }

    function positionErrorLine() {
      ensureErrLineNodes(errorLineNos.length);
      const lh = lineHeightPx();
      const paddingTop = parseFloat(getComputedStyle(el.editor).paddingTop) || 10;
      errLineNodes.forEach((node, i) => {
        if (i >= errorLineNos.length) { node.style.display = 'none'; return; }
        const lineNo = errorLineNos[i];
        node.style.height = lh + 'px';
        node.style.top = (paddingTop + (lineNo - 1) * lh - el.editor.scrollTop) + 'px';
        node.style.display = 'block';
      });
    }

    function setErrorLines(lineNos) {
      const seen = new Set();
      errorLineNos = (lineNos || []).filter((n) => {
        if (!n || seen.has(n)) return false;
        seen.add(n);
        return true;
      });
      renderGutter();
      positionErrorLine();
    }

    // Kept for the single-line call sites (e.g. clearing with 0).
    function setErrorLine(lineNo) {
      setErrorLines(lineNo ? [lineNo] : []);
    }

    function renderHighlight() {
      el.hlCode.innerHTML = highlightArduino(el.editor.value) + ' ';
      el.hlPre.scrollTop = el.editor.scrollTop;
      el.hlPre.scrollLeft = el.editor.scrollLeft;
      renderGutter();
      positionErrorLine();
    }

    el.editor.addEventListener('scroll', () => {
      el.hlPre.scrollTop = el.editor.scrollTop;
      el.hlPre.scrollLeft = el.editor.scrollLeft;
      el.gutter.scrollTop = el.editor.scrollTop;
      positionErrorLine();
      positionGhost();
    });

    /* --------------------------- Tab-autocomplete (ghost) ---------------------------
       متن کم‌رنگِ تکمیل‌کننده که هنگام تایپِ یک کلمه‌ی کلیدی/تابعِ شناخته‌شده
       نشان داده می‌شود؛ Tab آن را می‌پذیرد، هر کلید دیگری آن را کنار می‌گذارد.
       چون فونت مونواسپیس است، به‌جای اندازه‌گیریِ DOM با یک div آینه، عرضِ هر
       حرف را یک‌بار با canvas اندازه می‌گیریم و موقعیت را با ریاضیِ ساده
       (ردیف/ستون × ارتفاعِ خط/عرضِ حرف) حساب می‌کنیم — همان چیزی که Consolas
       روی ویندوز واقعاً رندر می‌کند.
       ---------------------------------------------------------------------------- */
    let ghostSuggestion = null;
    let monoCharWidthCache = null;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    function monoCharWidth() {
      if (monoCharWidthCache != null) return monoCharWidthCache;
      const cs = getComputedStyle(el.editor);
      const canvas = monoCharWidth._canvas || (monoCharWidth._canvas = document.createElement('canvas'));
      const ctx = canvas.getContext('2d');
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      monoCharWidthCache = ctx.measureText('M').width || 9.6;
      return monoCharWidthCache;
    }

    function positionGhost() {
      if (!ghostSuggestion) return;
      const before = el.editor.value.slice(0, ghostSuggestion.start);
      const lastNl = before.lastIndexOf('\n');
      const row = (before.match(/\n/g) || []).length;
      const col = ghostSuggestion.start - (lastNl + 1);
      const cs = getComputedStyle(el.editor);
      const lh = parseFloat(cs.lineHeight) || 24;
      const padTop = parseFloat(cs.paddingTop) || 10;
      const padLeft = parseFloat(cs.paddingLeft) || 10;
      const top = padTop + row * lh - el.editor.scrollTop;
      const left = padLeft + col * monoCharWidth() - el.editor.scrollLeft;
      el.ghostEl.style.top = top + 'px';
      el.ghostEl.style.left = left + 'px';
    }

    function renderGhost() {
      if (!ghostSuggestion) { el.ghostEl.style.display = 'none'; el.ghostEl.innerHTML = ''; return; }
      const textSpan = document.createElement('span');
      textSpan.textContent = ghostSuggestion.text;
      const tabBadge = document.createElement('span');
      tabBadge.className = 'sim-ghost-tab';
      tabBadge.textContent = isTouchDevice ? 'بزن ✓' : 'Tab ⇥';
      // pointerdown (نه click) با preventDefault تا لمسِ نشان روی گوشی باعثِ از-فوکوس-افتادنِ
      // textarea و بسته‌شدنِ صفحه‌کلید نشه — همون‌جا، بدون فاصله، پیشنهاد پذیرفته می‌شه.
      tabBadge.addEventListener('pointerdown', (e) => { e.preventDefault(); acceptGhost(); });
      el.ghostEl.innerHTML = '';
      el.ghostEl.appendChild(textSpan);
      el.ghostEl.appendChild(tabBadge);
      el.ghostEl.style.display = 'block';
      positionGhost();
    }

    function updateGhost() {
      if (el.editor.readOnly || el.editor.selectionStart !== el.editor.selectionEnd) {
        ghostSuggestion = null;
      } else {
        ghostSuggestion = computeGhostSuggestion(el.editor.value, el.editor.selectionStart);
      }
      renderGhost();
    }

    // درج متن در ادیتور طوری که، در صورتِ پشتیبانیِ مرورگر، تاریخچه‌ی Undo/Redo
    // بومیِ textarea حفظ شود (execCommand هنوز روی Chrome/Firefox/Edge کار می‌کند).
    function insertTextAtCaret(text, selStart, selEnd) {
      el.editor.focus();
      el.editor.setSelectionRange(selStart, selEnd);
      let handled = false;
      try { handled = document.execCommand && document.execCommand('insertText', false, text); } catch (e) { handled = false; }
      if (!handled) {
        const val = el.editor.value;
        el.editor.value = val.slice(0, selStart) + text + val.slice(selEnd);
        el.editor.selectionStart = el.editor.selectionEnd = selStart + text.length;
        el.editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    function acceptGhost() {
      if (!ghostSuggestion) return;
      insertTextAtCaret(ghostSuggestion.text, ghostSuggestion.start, ghostSuggestion.start);
      ghostSuggestion = null;
      renderGhost();
    }

    function insertIndent() {
      const s = el.editor.selectionStart, eIdx = el.editor.selectionEnd;
      insertTextAtCaret('  ', s, eIdx);
    }

    el.editor.addEventListener('keydown', (e) => {
      if (el.editor.readOnly) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        if (ghostSuggestion && el.editor.selectionStart === el.editor.selectionEnd && el.editor.selectionStart === ghostSuggestion.start) {
          acceptGhost();
        } else {
          insertIndent();
        }
        return;
      }
      if (e.key === 'Escape' && ghostSuggestion) {
        ghostSuggestion = null;
        renderGhost();
      }
    });

    ['click', 'mouseup'].forEach((evt) => el.editor.addEventListener(evt, updateGhost));
    el.editor.addEventListener('keyup', (e) => {
      if (e.key === 'Tab' || e.key === 'Escape') return;
      updateGhost();
    });
    el.editor.addEventListener('blur', () => { ghostSuggestion = null; renderGhost(); });

    let isFullscreen = false;
    const statusHome = { parent: el.status.parentElement, next: el.status.nextSibling };
    const consoleHome = { parent: el.consoleWrap.parentElement, next: el.consoleWrap.nextSibling };
    const boardHome = el.boardWrap ? { parent: el.boardWrap.parentElement, next: el.boardWrap.nextSibling } : null;
    // خودِ .sim-editor-block هم باید موقتاً از داخل مودال بیرون بیاید (به
    // document.body برود) — وگرنه position:fixed داخلش به جای کل صفحه فقط به
    // اندازه‌ی همان مودال (که overflow-y:auto و max-height محدود دارد) دیده
    // می‌شود. خانه‌ی اصلی‌اش این‌جا نگه داشته می‌شود تا موقع خروج دقیقاً همان‌جا
    // برگردد.
    const editorBlockHome = { parent: el.editorBlock.parentElement, next: el.editorBlock.nextSibling };
    function setFullscreen(on) {
      isFullscreen = on;
      el.editorBlock.classList.toggle('is-sim-fullscreen', on);
      document.body.classList.toggle('sim-fullscreen-lock', on);
      el.expandBtn.textContent = on ? '✕ بستن' : '⛶';
      el.expandBtn.title = on ? 'بستن حالت تمام‌صفحه' : 'بزرگ‌نمایی کد';
      if (on) {
        document.body.appendChild(el.editorBlock);
        if (boardHome) el.editorBlock.insertBefore(el.boardWrap, el.editorBlock.firstChild);
        el.editorBlock.insertBefore(el.status, el.editorBlock.querySelector('.sim-editor-wrap'));
        el.editorBlock.appendChild(el.consoleWrap);
        if (!blockMode) el.editor.focus();
      } else {
        if (boardHome) boardHome.parent.insertBefore(el.boardWrap, boardHome.next);
        statusHome.parent.insertBefore(el.status, statusHome.next);
        consoleHome.parent.insertBefore(el.consoleWrap, consoleHome.next);
        editorBlockHome.parent.insertBefore(el.editorBlock, editorBlockHome.next);
      }
      positionErrorLine();
      positionGhost();
      resizeBlockly();
    }
    el.expandBtn.addEventListener('click', () => {
      if (isFullscreen && blocklyFrame) { returnToBlockLauncher(); return; }
      setFullscreen(!isFullscreen);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !isFullscreen) return;
      if (blocklyFrame) { returnToBlockLauncher(); return; }
      setFullscreen(false);
    });

    el.editor.value = halOpts ? (function () { try { return localStorage.getItem(CODE_STORAGE_PREFIX + missionId) || startText(); } catch (e) { return startText(); } })() : loadSavedCode(missionId, opts.task, pins);
    renderHighlight();

    let saveTimer = null;
    el.editor.addEventListener('input', () => {
      if (errorLineNos.length) setErrorLine(0);
      renderHighlight();
      updateGhost();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveCode(missionId, el.editor.value), 300);
      blocksMatchText = false; // کاربر مستقیم متن را دستی عوض کرد؛ دفعه‌ی بعد که رفت بلوکی، باید از نو بسازیم
    });

    let successFired = !!alreadyDone;
    let running = false;
    let stopRequested = false;
    let runToken = 0;
    let buttonHeld = false;
    let potValue = 512; // 0..1023، وسط بازه
    let currentIO = null;
    let state = freshState();
    let selectedBaud = 9600;

    // سخت‌افزارِ مأموریت‌های رباتیکِ STM32 (حسگر/LED/موتور) — از hal-code-editor.js می‌آید
    let halHw = null, halIO = null, halRaf = 0;
    if (halOpts) {
      const halApi = { say: (st, tx) => setStatus(tx, st), log: (m) => { logLine(m, ''); while (el.console.childNodes.length > 14) el.console.removeChild(el.console.firstChild); }, running: () => running };
      halHw = halOpts.hw(container.querySelector('.sim-hal-hw'), halApi);
      halIO = halOpts.io(halHw, halApi);
      let last = null;
      const frame = (ts) => {
        const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts;
        halHw.tick(dt);
        if (running && !successFired && halHw.isDone()) fireSuccess();
        halRaf = requestAnimationFrame(frame);
      };
      halRaf = requestAnimationFrame(frame);
    }

    if (el.baudSelect) {
      el.baudSelect.addEventListener('change', () => {
        selectedBaud = parseInt(el.baudSelect.value, 10) || 9600;
      });
    }

    function setPotVisual(v) {
      if (!el.potNeedle) return;
      const angle = -90 + (Math.max(0, Math.min(1023, v)) / 1023) * 180;
      el.potNeedle.setAttribute('transform', `rotate(${angle} 215 104)`);
    }

    function setServoVisual(angle0to180) {
      if (!el.servoHorn) return;
      const clamped = Math.max(0, Math.min(180, angle0to180));
      const rot = clamped - 90;
      el.servoHorn.setAttribute('transform', `rotate(${rot} 232 56)`);
    }

    function setStatus(text, st) {
      el.status.textContent = text;
      el.status.setAttribute('data-state', st || 'idle');
    }

    // Console lines are Persian sentences with embedded Latin/English tokens
    // (variable names, "void", "int", numbers, error identifiers, or whole
    // phrases like a user's Serial.println("Hello World")). Without
    // isolation, the Unicode bidi algorithm mixes those tokens with the
    // surrounding RTL text and neutral punctuation («», (), :, ؛) in
    // unpredictable visual order. Wrapping each Latin/digit run in a <bdi>
    // (bidirectional isolate) fixes this the same way dir="ltr" +
    // unicode-bidi: isolate is already used elsewhere in this file for
    // similar mixed-direction UI text. The run must include internal single
    // spaces ("Hello World" as ONE isolate) — wrapping each word separately
    // would isolate "Hello" and "World" on their own, and an RTL paragraph
    // then reorders those two isolates relative to each other, flipping the
    // visible word order.
    function appendBidiSafeText(container, text) {
      const re = /[A-Za-z0-9_]+(?:[ \t]+[A-Za-z0-9_]+)*/g;
      let last = 0, m;
      while ((m = re.exec(text))) {
        if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
        const bdi = document.createElement('bdi');
        bdi.dir = 'ltr';
        bdi.textContent = m[0];
        container.appendChild(bdi);
        last = re.lastIndex;
      }
      if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
    }

    function logLine(text, cls) {
      const line = document.createElement('div');
      if (cls) line.className = cls;
      appendBidiSafeText(line, text);
      el.console.appendChild(line);
      el.console.scrollTop = el.console.scrollHeight;
      while (el.console.childNodes.length > 200) el.console.removeChild(el.console.firstChild);
    }

    function clearConsole() { el.console.innerHTML = ''; }

const SERIAL_SCREEN_MAX_WIDTH = 88;
function setSerialScreenText(text) {
  if (!el.serialGlyph) return;

  let t = text;

  el.serialGlyph.textContent = t;

  while (
    t.length > 0 &&
    el.serialGlyph.getComputedTextLength() > SERIAL_SCREEN_MAX_WIDTH
  ) {
    t = t.slice(0, -1);
    el.serialGlyph.textContent = t + '…';
  }
}

    function setLed(ratio) {
      if (!el.ledGroup || !el.ledBulb) return;
      const r = Math.max(0, Math.min(1, ratio));
      el.ledGroup.classList.toggle('is-on', r > 0.02);
      el.ledBulb.style.setProperty('--sim-led-ratio', r.toFixed(3));
      /* LED واقعی: لایه‌ی روشن و هاله با شدتِ نور محو و پررنگ می‌شوند */
      if (el.ledBulb.id === 'simLedBulb' && !el.ledBulb.classList.contains('sim-led-bulb')) {
        el.ledBulb.setAttribute('opacity', r.toFixed(2));
        const gl = el.ledGroup.querySelector('.lr-glow');
        if (gl) gl.setAttribute('opacity', (r * 0.5).toFixed(2));
      }
    }

    function setRunning(isRunning) {
      running = isRunning;
      el.runBtn.disabled = isRunning;
      el.stopBtn.disabled = !isRunning;
      el.resetBtn.disabled = isRunning;
      el.editor.readOnly = isRunning;
      el.editorBlock.classList.toggle('is-sim-running', isRunning);
      if (el.modeTextBtn) el.modeTextBtn.disabled = isRunning;
      if (el.modeBlocksBtn) el.modeBlocksBtn.disabled = isRunning;
      if (isRunning) { ghostSuggestion = null; renderGhost(); }
    }

    // بعد از شروعِ هر اجرا، اگر مأموریت دکمه دارد، یک‌بار خودش را به‌جای
    // کاربر «فشار و رها» می‌کند — فقط برای همان اجرای مشخص (myToken)، تا اگر
    // کاربر زودتر «توقف» بزند یا اجرای تازه‌ای شروع شود، این تایمرِ قدیمی
    // چیزی را بی‌جا عوض نکند.
    function autoPressButtonOnce(token) {
      if (pins.button === undefined) return;
      setTimeout(() => {
        if (token !== runToken) return;
        setButtonHeld(true);
        setTimeout(() => {
          if (token !== runToken) return;
          setButtonHeld(false);
        }, 350);
      }, 400);
    }

    // با هر تغییر لحظه‌ای در ورودی دکمه، وضعیت پین را در io فعلی به‌روز می‌کند
    // (فعال-پایین: فشرده = LOW، رها = HIGH — چون از INPUT_PULLUP استفاده می‌شود).
    function setButtonHeld(held) {
      buttonHeld = held;
      if (el.buttonGroup) el.buttonGroup.classList.toggle('is-pressed', held);
      if (el.pressBtn) {
        el.pressBtn.classList.toggle('is-pressed', held);
        el.pressBtn.textContent = held ? '🔘 در حال فشردن...' : '🔘 دکمه را نگه دار';
        // :active در CSS فقط با فشارِ واقعیِ ماوس/انگشت فعال می‌شود، نه با
        // فراخوانیِ برنامه‌ایِ setButtonHeld (مثلاً فشارِ خودکار بعد از اجرا)؛
        // پس این افکت را مستقیم این‌جا ست می‌کنیم تا در هر دو حالت یکسان باشد.
        el.pressBtn.style.outline = held ? '2px solid #22c55e' : '';
        el.pressBtn.style.outlineOffset = held ? '2px' : '';
      }
      if (currentIO && pins.button !== undefined) {
        currentIO.pins[pins.button] = held ? 0 : 1;
      }
    }

    if (el.pressBtn) {
      const press = (e) => { e.preventDefault(); setButtonHeld(true); };
      const release = () => setButtonHeld(false);
      el.pressBtn.addEventListener('pointerdown', press);
      el.pressBtn.addEventListener('pointerup', release);
      el.pressBtn.addEventListener('pointerleave', release);
      el.pressBtn.addEventListener('pointercancel', release);
    }

    // همان دکمه، این‌بار مستقیم روی خودِ تصویر مدار — تا لازم نباشد
    // برای فشردن دکمه حتماً به کنترل زیر برد نگاه کرد.
    if (el.buttonHit) {
      const pressOnBoard = (e) => {
        e.preventDefault();
        setButtonHeld(true);
        try { el.buttonHit.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      };
      const releaseOnBoard = (e) => {
        setButtonHeld(false);
        try { el.buttonHit.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      };
      el.buttonHit.addEventListener('pointerdown', pressOnBoard);
      el.buttonHit.addEventListener('pointerup', releaseOnBoard);
      el.buttonHit.addEventListener('pointerleave', releaseOnBoard);
      el.buttonHit.addEventListener('pointercancel', releaseOnBoard);
    }

    if (el.potRange) {
      setPotVisual(potValue);
      el.potRange.addEventListener('input', (e) => {
        potValue = parseInt(e.target.value, 10) || 0;
        setPotVisual(potValue);
      });
    }
    if (el.servoHorn) setServoVisual(90);

    // چرخاندن مستقیم دسته‌ی پتانسیومتر روی خودِ تصویر مدار با درگ ماوس/انگشت.
    const POT_CENTER = { x: 215, y: 104 };
    function svgPointFromClient(clientX, clientY) {
      const svg = el.boardSvg;
      if (!svg || typeof svg.createSVGPoint !== 'function') return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    }
    function setPotFromClient(clientX, clientY) {
      const p = svgPointFromClient(clientX, clientY);
      if (!p) return;
      const dx = p.x - POT_CENTER.x;
      const dy = p.y - POT_CENTER.y;
      let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
      angleDeg = Math.max(-90, Math.min(90, angleDeg));
      const v = Math.round(((angleDeg + 90) / 180) * 1023);
      potValue = v;
      if (el.potRange) el.potRange.value = String(v);
      setPotVisual(v);
    }
    if (el.potHit) {
      let potDragging = false;
      const potDown = (e) => {
        e.preventDefault();
        potDragging = true;
        try { el.potHit.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        setPotFromClient(e.clientX, e.clientY);
      };
      const potMove = (e) => { if (potDragging) setPotFromClient(e.clientX, e.clientY); };
      const potUp = (e) => {
        potDragging = false;
        try { el.potHit.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      };
      el.potHit.addEventListener('pointerdown', potDown);
      el.potHit.addEventListener('pointermove', potMove);
      el.potHit.addEventListener('pointerup', potUp);
      el.potHit.addEventListener('pointercancel', potUp);
    }

    function makeIO() {
      const io = {
        _ms: 0,
        pins: {},
        pinModes: {},
        pinMode(p, mode) {
          io.pinModes[p] = mode;
          state.pinModes[p] = mode;
          if (mode === 'INPUT_PULLUP' && io.pins[p] === undefined) {
            io.pins[p] = p === pins.button && buttonHeld ? 0 : 1;
          }
        },
        digitalWrite(p, val) {
          const numVal = (val === 1 || val === 'HIGH' || val === true) ? 1 : 0;
          io.pins[p] = numVal;
          state.events.push({ pin: p, val: numVal, ms: io._ms });
          if (halIO) { halIO.write(p, numVal); return; }
          if (p === pins.led) {
            setLed(task.activeLow ? 1 - numVal : numVal);
            if (pins.button !== undefined) {
              if (buttonHeld) {
                if (numVal === 1) state.ledOnWhilePressed = true;
              } else if (numVal === 0 && state.ledOnWhilePressed) {
                state.ledOffWhenReleased = true;
              } else if (numVal === 1 && state.lastButtonRead === 1) {
                // برنامه دکمه را «رها» (HIGH) دیده و با همین LED را روشن کرده
                state.ledOnWhileReleased = true;
              }
            }
          }
        },
        digitalRead(p) {
          if (halIO) return halIO.read(p);
          const v = io.pins[p] !== undefined ? io.pins[p] : 0;
          if (p === pins.button) { state.buttonSeen = true; state.lastButtonRead = v; }
          return v;
        },
        halOut(p) { return halIO ? halIO.out(p) : (io.pins[p] !== undefined ? io.pins[p] : 1); },
        pwmStart(t, ch) { if (halIO) halIO.pwmStart(t, ch); },
        pwmCompare(t, ch, v) { if (halIO) halIO.pwmCompare(t, ch, v); },
        analogWrite(p, val) {
          const clamped = Math.max(0, Math.min(255, Number(val) || 0));
          const ratio = clamped / 255;
          io.pins[p] = clamped;
          state.events.push({ pin: p, val: clamped, ms: io._ms, analog: true });
          if (p === pins.led) {
            setLed(ratio);
            if (pins.pot !== undefined) {
              if (potValue < 300 && clamped < 100) state.lowBrightnessSeen = true;
              if (potValue > 700 && clamped > 150) state.highBrightnessSeen = true;
            }
          }
        },
        analogRead(p) {
          if (pinsMatch(p, pins.pot)) {
            state.potSeen = true;
            return potValue;
          }
          return 512;
        },
        servoAttach(pin) {
          state.servoAttached = true;
          state.servoPin = pin;
        },
        servoDetach() {
          state.servoAttached = false;
        },
        servoWrite(pin, angle) {
          const a = Math.max(0, Math.min(180, Number(angle) || 0));
          state.servoSeen = true;
          setServoVisual(a);
          if (a <= 15) state.lowAngleSeen = true;
          if (a >= 165) state.highAngleSeen = true;
        },
        millis() { return Math.round(io._ms); },
        serialBegin(baud) {
          state.serialBaud = Number(baud) || undefined;
        },
        serialNotBegun() {
          if (state.serialNotBegunWarned) return;
          state.serialNotBegunWarned = true;
          logLine('✗ قبل از Serial.print/println باید Serial.begin() فراخوانی شود.', 'sim-error');
        },
        serialPrint(text) {
          if (state.serialBaud !== undefined && state.serialBaud !== selectedBaud) {
            if (!state.serialBaudMismatchWarned) {
              state.serialBaudMismatchWarned = true;
              logLine(`✗ نرخ باد مانیتور سریال (${selectedBaud}) با ()Serial.begin در کد (${state.serialBaud}) یکی نیست — مانیتور را روی نرخ درست تنظیم کن.`, 'sim-error');
            }
            text.split('\n').forEach((seg, idx, arr) => {
              if (idx < arr.length - 1 || seg) { logLine(garbleText(seg), 'sim-serial-garbled'); setSerialScreenText(garbleText(seg)); }
            });
            return;
          }
          text.split('\n').forEach((seg, idx, arr) => {
            if (idx < arr.length - 1 || seg) {
              logLine(seg, 'sim-serial');
              state.serial.push(seg);
              setSerialScreenText(seg);
            }
          });
        }
      };
      return io;
    }

    // مأموریت‌های رباتیک: «تمام‌شدن» را خودِ سخت‌افزارِ شبیه‌سازی‌شده (hal-code-editor.js) می‌گوید
    function runCheck() {
      if (halOpts) return { ok: !!(halHw && halHw.isDone()), reason: halOpts.pending || 'هنوز کامل نیست — شرطِ مأموریت را در شبیه‌ساز ببین.' };
      return task.check(state);
    }

    function fireSuccess() {
      successFired = true;
      runToken++; // هر step() در حال انتظار را متوقف می‌کند
      setRunning(false);
      setStatus(task.successText, 'success');
      logLine(task.successLog, 'sim-ok');
      if (onSuccess) onSuccess();
    }

    // مأموریتِ دکمه: برنامه دکمه‌ی رهاشده (HIGH) را دیده و LED را روشن کرده —
    // یعنی شرط با INPUT_PULLUP وارونه نوشته شده. اجرا را متوقف می‌کنیم و دلیلش را می‌گوییم.
    function showPullupHint() {
      state.pullupHintShown = true;
      runToken++; // هر step() در حال انتظار را متوقف می‌کند
      setRunning(false);
      setStatus('LED بدونِ فشردنِ دکمه روشن شد — شرطِ دکمه را وارونه نوشته‌ای.', 'error');
      logLine('✗ دکمه فشرده نشده ولی LED روشن است. با INPUT_PULLUP دکمه‌ی فشرده LOW می‌خواند.', 'sim-error');
      showSimDialog({
        title: '⚠️ دکمه را نفشرده‌ای، ولی LED روشن است!',
        bodyHtml:
          '<p>الان دکمه فشرده نشده، اما برنامه‌ی تو LED را روشن کرده است.</p>' +
          '<p>چون دکمه را با <code>INPUT_PULLUP</code> وصل کرده‌ایم، منطقش برعکس است:</p>' +
          '<ul><li>دکمه <b>رها</b> است ← <code>digitalRead</code> برابر <code>HIGH</code></li>' +
          '<li>دکمه <b>فشرده</b> است ← <code>digitalRead</code> برابر <code>LOW</code></li></ul>' +
          '<p>پس باید بررسی کنی اگر مقدارِ دکمه <code>LOW</code> بود، چراغ روشن شود:</p>' +
          '<p><code>if (digitalRead(' + pins.button + ') == LOW)</code></p>',
        okText: 'فهمیدم، درستش می‌کنم'
      });
    }

    function pinAliasPrelude() {
      // مفسر کد (ArduinoLang) شماره‌ی پین‌های A0..A5 را از پیش نمی‌شناسد؛
      // چون به آن فایل دسترسی نداریم، همین متغیرها را قبل از کد کاربر
      // به‌صورت نامرئی تعریف می‌کنیم تا نوشتن A0 در کد کاربر خطا ندهد.
      const aliases = { A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19 };
      let src = '';
      [pins.led, pins.button, pins.pot].forEach((v) => {
        if (typeof v === 'string' && Object.prototype.hasOwnProperty.call(aliases, v) && src.indexOf(v + ' ') === -1) {
          src += `#define ${v} ${aliases[v]}\n`;
        }
      });
      return src;
    }

    function runProgram() {
      if (running) return;
      if (blockMode) syncBlocksToText();
      const myToken = ++runToken;
      state = freshState();
      clearConsole();
      setSerialScreenText('');
      setLed(0);
      setStatus('در حال اجرا…', 'running');

      setErrorLine(0);
      if (halOpts && halOpts.preRun) {
        const bad = halOpts.preRun();
        if (bad) { setStatus(bad, 'error'); logLine('✗ ' + bad, 'sim-error'); return; }
      }
      const prelude = pinAliasPrelude();
      let ast;
      try {
        ast = ArduinoLang.compile(prelude + el.editor.value);
      } catch (e) {
        setStatus('خطا در کد — کنسول را ببین.', 'error');
        // compile() may attach `.errors` (an array) when it found more than
        // one independent problem — log each on its own console line AND
        // highlight every one of their lines in the editor, not just the
        // first.
        const items = (e.errors && e.errors.length) ? e.errors : [e];
        const preludeLines = prelude ? prelude.split('\n').length - 1 : 0;
        const lines = [];
        for (const item of items) {
          logLine('✗ ' + item.message, 'sim-error');
          const m = /نزدیک خط (\d+)/.exec(item.message);
          if (m) lines.push(Math.max(1, parseInt(m[1], 10) - preludeLines));
        }
        setErrorLines(lines);
        return;
      }

      if (halHw) { halHw.reset(); halIO.reset(); }
      const io = makeIO();
      currentIO = io;
      if (pins.button !== undefined) io.pins[pins.button] = buttonHeld ? 0 : 1;
      const interp = new ArduinoLang.Interpreter(ast, io);
      let gen;
      try { gen = interp.run(); }
      catch (e) { setStatus('خطا در اجرا.', 'error'); logLine('✗ ' + e.message, 'sim-error'); return; }

      setRunning(true);
      stopRequested = false;
      autoPressButtonOnce(myToken);
      const startedAt = performance.now();

      function finish(reason) {
        if (myToken !== runToken) return;
        setRunning(false);
        if (reason === 'stopped') {
          setStatus('اجرا متوقف شد.', 'idle');
        } else if (reason === 'timeout') {
          const check = runCheck();
          setStatus(check.ok ? 'خیلی خوبه — می‌تونی اجرا را ادامه بدی یا مأموریت را تمام‌شده علامت بزنی.' : ('هنوز کامل نیست: ' + check.reason), check.ok ? 'success' : 'idle');
        }
      }

      function step() {
        if (myToken !== runToken) return;
        if (stopRequested) { finish('stopped'); return; }
        let res;
        try {
          res = gen.next();
        } catch (e) {
          setRunning(false);
          setStatus('خطا هنگام اجرا — کنسول را ببین.', 'error');
          logLine('✗ ' + e.message, 'sim-error');
          return;
        }

        if (task.hasButton && state.ledOnWhileReleased && !state.pullupHintShown && !runCheck().ok) {
          showPullupHint();
          return;
        }

        if (res.done) {
          const check = runCheck();
          if (check.ok && !successFired) { fireSuccess(); return; }
          setRunning(false);
          setStatus('برنامه به پایان رسید.', 'idle');
          return;
        }

        const elapsedReal = performance.now() - startedAt;
        if (elapsedReal > runLimitMs) { finish('timeout'); return; }

        // بعد از هر گام (چه delay، چه پایان یک دور loop) بررسی می‌کنیم؛ این باعث
        // می‌شود مأموریت‌هایی مثل «Hello World» یا «روشن‌کردن LED» که به delay
        // نیازی ندارند هم بلافاصله بعد از setup() تشخیص داده شوند.
        const check = runCheck();
        if (check.ok && !successFired) { fireSuccess(); return; }

        const val = res.value;
        if (val && val.type === 'delay') {
          io._ms += val.ms;
          const wait = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, val.ms / RUN_SPEED));
          setTimeout(step, wait);
          return;
        }
        setTimeout(step, 0);
      }
      step();
    }

    function stopProgram() {
      stopRequested = true;
      runToken++;
      setRunning(false);
      if (halHw) halHw.reset();
      setStatus('اجرا متوقف شد.', 'idle');
    }

    function resetCode() {
      if (running) stopProgram();
      el.editor.value = startText();
      saveCode(missionId, el.editor.value);
      if (halHw) { halHw.reset(); halIO.reset(); }
      clearStoredBlockState(missionId);
      blocksMatchText = false; // متن عوض شد؛ اگر رفتیم بلوکی باید از نو بسازیم
      setErrorLine(0);
      renderHighlight();
      ghostSuggestion = null;
      renderGhost();
      setLed(0);
      clearConsole();
      setSerialScreenText('');
      state = freshState();
      if (el.potRange) {
        potValue = 512;
        el.potRange.value = '512';
        setPotVisual(potValue);
      }
      if (el.servoHorn) setServoVisual(90);
      setStatus('کد به حالت اولیه بازگشت.', 'idle');
      if (blockMode && blockWorkspace) { if (!loadCurrentCodeIntoBlocks()) setMode('text', { skipSync: true, skipPersist: true }); }
      else if (blockMode && blocklyFrame) reloadBlockEditor();
    }

    /* ------------------------- حالتِ بلوکی (اسکرچ‌مانند) ------------------------- */
    // کد متنی (el.editor.value) همیشه منبعِ اصلیِ حقیقت است. بلوک‌ها فقط یک
    // نمایشِ زنده‌اش هستند: با هر تغییرِ بلوک، کد متنی بازتولید و ذخیره می‌شود؛
    // هر بار که وارد حالتِ بلوکی می‌شویم، بلوک‌ها از روی کدِ متنیِ فعلی ساخته
    // می‌شوند. اگر کد چیزی داشته باشد که هنوز بلوکی برایش نداریم، پیام روشنی
    // نشان می‌دهیم و در حالتِ متنی می‌مانیم — نه تبدیلِ نصفه‌ونیمه.
    let blockMode = false;
    let blockWorkspace = null;
    let blockSyncing = false;
    let blocksMatchText = false; // آیا بلوک‌های روی بومِ کار همین الان دقیقاً معادلِ کدِ متنی هستند؟

    function ensureBlockMsgEl() {
      let msgEl = el.blocklyWrap.querySelector('.sim-blockly-msg');
      if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.className = 'sim-blockly-msg';
        el.blocklyWrap.appendChild(msgEl);
      }
      return msgEl;
    }
    function showBlockSpinner(text) {
      const msgEl = ensureBlockMsgEl();
      msgEl.className = 'sim-blockly-msg';
      msgEl.innerHTML = '';
      const spin = document.createElement('div');
      spin.className = 'sim-blockly-spinner';
      const p = document.createElement('div');
      p.textContent = text || 'در حال آماده‌سازی…';
      msgEl.appendChild(spin);
      msgEl.appendChild(p);
      msgEl.style.display = 'flex';
    }
    function showBlockError(text) {
      const msgEl = ensureBlockMsgEl();
      msgEl.className = 'sim-blockly-msg is-error';
      msgEl.innerHTML = '';
      const p = document.createElement('div');
      p.textContent = text;
      msgEl.appendChild(p);
      msgEl.style.display = 'flex';
    }
    function hideBlockMsg() {
      const msgEl = el.blocklyWrap.querySelector('.sim-blockly-msg');
      if (msgEl) msgEl.style.display = 'none';
    }
    // عرضِ کمینه‌ای که بلوک‌ها/فلای‌اوت واقعاً جا می‌شوند؛ کمتر از این همان
    // چیزی است که باعثِ رفتنِ بخشی از بلوک‌ها زیرِ اسکرول‌بار می‌شود — به‌جای
    // تلاش برای «درست کردنِ» رندرِ خرابِ Blockly در آن عرض، همان‌جا با یک
    // پیامِ روشن جلویِ استفاده را می‌گیریم.
    const BLOCKLY_MIN_WIDTH = 480;
    function checkBlocklyWidth() {
      if (!blockMode || !blockWorkspace) return;
      const w = el.editorBlock.clientWidth;
      if (w > 0 && w < BLOCKLY_MIN_WIDTH) {
        const msgEl = ensureBlockMsgEl();
        msgEl.className = 'sim-blockly-msg';
        msgEl.innerHTML = '';
        const p = document.createElement('div');
        p.textContent = 'صفحه برای نمایشِ درستِ بلوک‌ها خیلی باریک است — گوشی را افقی بگیر یا پنجره را عریض‌تر کن.';
        msgEl.appendChild(p);
        msgEl.style.display = 'flex';
      } else {
        hideBlockMsg();
      }
    }
    function resizeBlockly() {
      if (!blockWorkspace || typeof window.Blockly === 'undefined') return;
      requestAnimationFrame(() => {
        try { window.Blockly.svgResize(blockWorkspace); blockWorkspace.resizeContents(); } catch (e) { /* noop */ }
      });
      checkBlocklyWidth();
    }
    function forceCommitBlocklyFields() {
      // اگر کاربر تازه داخلِ یک فیلد (مثلاً شماره‌ی پین) چیزی تایپ کرده و بدونِ
      // کلیک بیرون از آن مستقیم روی «متنی» زده، آن ویرایش هنوز در بلوک ثبت
      // نشده. با بستنِ اجباریِ ویجت/دراپ‌داونِ باز، Blockly مقدار را کامیت
      // می‌کند تا تبدیل به کد، آخرین چیزی که تایپ شده را از دست ندهد.
      try { if (window.Blockly && window.Blockly.WidgetDiv) window.Blockly.WidgetDiv.hide(); } catch (e) { /* noop */ }
      try { if (window.Blockly && window.Blockly.DropDownDiv) window.Blockly.DropDownDiv.hideWithoutAnimation(); } catch (e) { /* noop */ }
    }
    function saveCurrentLayout() {
      if (!blockWorkspace || typeof ArduinoBlocks === 'undefined') return;
      try { saveLayout(missionId, ArduinoBlocks.getLayout(blockWorkspace)); } catch (e) { /* noop */ }
    }
    // منبعِ اصلیِ ذخیره‌سازیِ خودِ بلوک‌ها: کاملِ فضایِ‌کار را (JSONِ استانداردِ
    // Blockly) کنارِ همان متنِ C++ ای که همین الان از رویش تولید شده، ذخیره
    // می‌کند. دفعه‌ی بعد که وارد حالتِ بلوکی می‌شویم، اگر متن هنوز همان باشد،
    // خودِ همین بلوک‌ها را عیناً برمی‌گردانیم — نه بازسازی از رویِ متن.
    function saveBlockSnapshot(code) {
      if (!blockWorkspace || typeof ArduinoBlocks === 'undefined') return;
      try {
        const snapshot = ArduinoBlocks.saveWorkspaceSnapshot(blockWorkspace);
        if (snapshot) storeBlockSnapshot(missionId, { code, snapshot });
      } catch (e) { /* noop */ }
    }
    function syncBlocksToText() {
      if (!blockWorkspace || blockSyncing) return false;
      try {
        const code = fromBlockCode(ArduinoBlocks.workspaceToCode(blockWorkspace));
        el.editor.value = code;
        renderHighlight();
        clearTimeout(saveTimer);
        saveCode(missionId, el.editor.value);
        blocksMatchText = true;
        saveCurrentLayout();
        // کدِ C++ این‌جا فقط خروجیِ نهاییِ قابلِ‌کامپایل است (Read-Only)؛ منبعِ
        // اصلیِ حقیقت، خودِ همین بلوک‌هایی هستند که همین الان به‌همراهِ متنِ
        // تولیدشده‌شان ذخیره می‌شوند.
        saveBlockSnapshot(code);
        return true;
      } catch (e) {
        return false; // یک وضعیتِ میانیِ ناقصِ بلوک (مثلاً یک ورودیِ خالی) — نادیده می‌گیریم
      }
    }
    function onBlockChange(evt) {
      if (blockSyncing) return;
      // موقعیت/زوومِ بوم را برای هر رویدادی ذخیره کن — حتی رویدادهای «فقط
      // نمایشی» مثلِ اسکرول یا زوم‌کردنِ صرف (بدون تغییردادنِ خودِ بلوک‌ها)،
      // وگرنه اگه کاربر فقط بومِ کار را جابه‌جا کند و صفحه را ببندد، دوباره
      // با دیدِ پیش‌فرض روبه‌رو می‌شود. اما بازتولیدِ خودِ کد (که سنگین‌تره)
      // فقط لازم است وقتی چیزی واقعاً در بلوک‌ها عوض شده باشد.
      saveCurrentLayout();
      if (evt && evt.isUiEvent) return;
      syncBlocksToText();
    }
    function loadCurrentCodeIntoBlocks() {
      if (typeof ArduinoBlocks === 'undefined') {
        showBlockError('حالتِ بلوکی روی این صفحه در دسترس نیست.');
        return false;
      }
      const currentCode = el.editor.value;

      // ===== مسیرِ اصلی: اگر عکسِ فوریِ ذخیره‌شده‌ی بلوک‌ها دقیقاً از رویِ
      // همین متنِ فعلی تولید/تأیید شده (یعنی از آن‌موقع کسی مستقیم متن را
      // دستی عوض نکرده)، خودِ همان بلوک‌ها را عیناً از رویِ JSONِ استانداردِ
      // Blockly برمی‌گردانیم — نه بازسازیِ از رویِ C++. کدِ C++ فقط خروجیِ
      // نهاییِ قابلِ‌کامپایل است؛ بازخوانیِ آن نمی‌تواند چیزهایی مثلِ کامنتِ
      // رویِ یک بلوک یا یک بلوکِ جدا‌افتاده‌ی هنوز‌وصل‌نشده را برگرداند —
      // برای همین اصلاً به آن مسیر نمی‌رویم مگر واقعاً چاره‌ای نباشد.
      const storedSnap = loadStoredBlockSnapshot(missionId);
      if (storedSnap && storedSnap.code === currentCode &&
          ArduinoBlocks.loadWorkspaceSnapshot(blockWorkspace, storedSnap.snapshot)) {
        hideBlockMsg();
        resizeBlockly();
        blocksMatchText = true;
        return true;
      }

      // ===== مسیرِ کمکی: فقط وقتی به این‌جا می‌رسیم که هنوز هیچ عکسِ فوری‌ای
      // نداریم (اولین‌بار)، یا آن عکسِ فوری دیگر معتبر نیست (کاربر بین‌راه
      // مستقیم متنِ C++ را دستی عوض کرده) — این‌جا تنها منبعِ موجود برای
      // ساختنِ بلوک‌ها، همین متن است، پس چاره‌ای جز پارس‌کردنش نیست.
      blockSyncing = true;
      let res;
      try {
        res = ArduinoBlocks.codeToWorkspace(toBlockCode(currentCode), blockWorkspace, loadSavedLayout(missionId));
      } catch (e) {
        // دفاعِ اضافه: حتی اگر یک باگِ واقعی و پیش‌بینی‌نشده در خودِ
        // codeToWorkspace رخ بدهد (نه یک «هنوز پشتیبانی نمی‌شود»ی عادی)،
        // کاربر هرگز نباید با یک صفحه‌ی ساکت و بدون هیچ پیامی روبه‌رو
        // شود — پیامِ خودِ خطا را هم نشان می‌دهیم تا قابلِ گزارش باشد.
        blockSyncing = false;
        showBlockError('خطای غیرمنتظره در تبدیلِ کد به بلوک: ' + (e && e.message ? e.message : e));
        return false;
      }
      blockSyncing = false;
      if (!res.ok) { showBlockError(res.message); return false; }
      hideBlockMsg();
      // اگر بخشی از کد قابلِ تبدیل به بلوک نبود، تبدیل همچنان انجام شده
      // (بقیه‌ی کد بلوک شده) ولی باید واضح به کاربر گفته شود که دقیقاً
      // کدام تکه قابلِ تبدیل نبوده و چرا — هم رویِ خودِ بلوکِ نارنجی (به‌صورتِ
      // حبابِ هشدار، توی codeToWorkspace ست شده) و هم این‌جا در وضعیت/کنسول.
      if (res.warnings && res.warnings.length) {
        const n = res.warnings.length;
        setStatus(n + (n === 1 ? ' بخش از کد قابلِ تبدیل به بلوک نبود' : ' بخش از کد قابلِ تبدیل به بلوک نبودند') + ' — به‌صورتِ «کدِ خام» (بلوکِ نارنجی) نگه داشته شد؛ رویش کلیک کن تا دلیلش را ببینی.', 'error');
        res.warnings.forEach((w) => logLine('⚠ این کد قابلِ تبدیل به بلوکی نیست: ' + w.reason + ' → ' + w.code, 'sim-error'));
      }
      resizeBlockly();
      blocksMatchText = true;
      saveCurrentLayout();
      // از همین لحظه، خودِ همین بلوک‌های تازه‌ساخته‌شده منبعِ اصلی می‌شوند —
      // دفعه‌ی بعد که وارد حالتِ بلوکی می‌شویم (تا وقتی کسی دستی متن را عوض
      // نکرده)، دیگر لازم نیست دوباره از رویِ C++ بازسازی شوند.
      saveBlockSnapshot(currentCode);
      return true;
    }
    function enterBlockMode() {
      if (typeof ArduinoBlocks === 'undefined') { showBlockError('حالتِ بلوکی روی این صفحه در دسترس نیست.'); return; }
      // اگر بلوک‌ها همین الان دقیقاً معادلِ کدِ متنی‌اند، نیازی به بازسازی
      // (و نه حتی نمایشِ اسپینر) نیست — چیدمانِ دستیِ کاربر دست‌نخورده می‌ماند.
      if (blockWorkspace && blocksMatchText) { hideBlockMsg(); resizeBlockly(); return; }
      showBlockSpinner('در حال آماده‌سازیِ بلوک‌ها…');
      ArduinoBlocks.ensureReady().then(() => {
        if (blockMode === false) return; // کاربر قبل از آماده‌شدن به حالتِ متنی برگشته
        if (!blockWorkspace) {
          if (halOpts && ArduinoBlocks.setHalContext) ArduinoBlocks.setHalContext(halOpts.ctx());
          blockWorkspace = ArduinoBlocks.createWorkspace(el.blocklyDiv, blocksTask);
          blockWorkspace.addChangeListener(onBlockChange);
        }
        if (blocksMatchText) { hideBlockMsg(); resizeBlockly(); return; }
        if (!loadCurrentCodeIntoBlocks()) setMode('text', { skipSync: true, skipPersist: true });
      }).catch((e) => {
        // متنِ خودِ خطا را نشان می‌دهیم (نه فقط یک پیامِ کلی) — چون این‌جا
        // می‌تواند چند دلیلِ خیلی متفاوت داشته باشد (شبکه، بارگذاریِ خودِ
        // Blockly، یا یک باگِ واقعی)، و کاربر بدونِ دیدنِ متنِ دقیق نمی‌تواند
        // بگوید کدام‌یک بوده.
        const reason = (e && e.message) ? e.message : 'بارگذاریِ ادیتورِ بلوکی ناموفق بود.';
        showBlockError(reason);
        setMode('text', { skipSync: true, skipPersist: true });
      });
    }
    // دقیقاً همان چیزی که دکمه‌ی «اجرا کن» موقعِ کامپایل انجام می‌دهد — با
    // همان prelude (نام‌مستعارهای پین و…) — تا قبل از رفتن به حالتِ بلوکی
    // مطمئن شویم کد اصلاً درست است (مثلاً یک تابعِ ناموجود/غلط‌تایپ‌شده صدا
    // زده نشده). این با «هنوز به بلوک تبدیل نمی‌شود» فرق دارد: این یعنی خودِ
    // کد یک باگِ واقعی دارد و اصلاً نباید اجرا هم بشود.
    function checkCodeCompiles() {
      const prelude = pinAliasPrelude();
      try {
        ArduinoLang.compile(prelude + el.editor.value);
        return { ok: true };
      } catch (e) {
        const items = (e.errors && e.errors.length) ? e.errors : [e];
        const preludeLines = prelude ? prelude.split('\n').length - 1 : 0;
        const lines = [];
        const messages = [];
        for (const item of items) {
          messages.push(item.message);
          const m = /نزدیک خط (\d+)/.exec(item.message);
          if (m) lines.push(Math.max(1, parseInt(m[1], 10) - preludeLines));
        }
        return { ok: false, lines, messages };
      }
    }
    /* ===== ادیتورِ بلوکی (iframe) =====
       iframe (blockly-editor.html) فقط خودِ بومِ Blockly است. بورد، دکمه‌های
       sim-actions و کنسول همان‌هایی‌اند که همین صفحه دارد؛ برای همین iframe را
       تمام‌صفحه‌ی مستقل نمی‌کنیم و می‌گذاریمش جایِ ناحیه‌ی ادیتور در چیدمانِ
       تمام‌صفحه‌ی موجود (بورد چپ، دکمه‌ها بالا، کنسول پایین).
       ذخیره خودکار است: iframe با هر تغییر پیامِ «change» می‌فرستد. */
    let blocklyFrame = null;
    let blocklyFrameReady = false; // تا iframe «ready» نفرستاده، پیام‌های change/layoutِ باقی‌مانده از نسخه‌ی قبلی را نادیده می‌گیریم
    let autoFullscreen = false; // ادیتورِ بلوکی خودش تمام‌صفحه را روشن کرده؛ موقعِ بازگشت باید خاموشش کند
    function showBlockLauncher() {
      el.blocklyDiv.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'ab-launcher';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ab-launcher-btn';
      btn.textContent = '🧩 باز کردنِ ادیتورِ بلوکی';
      btn.addEventListener('click', openBlockEditor);
      const sub = document.createElement('div');
      sub.className = 'ab-launcher-sub';
      sub.textContent = 'ادیتورِ بلوکی کنارِ بورد و کنسول، تمام‌صفحه باز می‌شود.';
      wrap.appendChild(btn);
      wrap.appendChild(sub);
      el.blocklyDiv.appendChild(wrap);
    }
    function sendBlocklyInit() {
      if (!blocklyFrame || !blocklyFrame.contentWindow) return;
      const currentCode = el.editor.value;
      // اگر عکسِ فوریِ ذخیره‌شده دقیقاً از رویِ همین متن ساخته شده، خودِ همان
      // بلوک‌ها عیناً برمی‌گردند؛ وگرنه iframe از رویِ متن (و چیدمانِ ذخیره‌شده)
      // بلوک می‌سازد.
      const stored = loadStoredBlockSnapshot(missionId);
      const snapshot = (stored && stored.code === currentCode) ? stored.snapshot : null;
      blocklyFrame.contentWindow.postMessage({
        __ardBlocks: true, type: 'init', task: blocksTask,
        code: toBlockCode(currentCode), snapshot, layout: loadSavedLayout(missionId),
        hal: halOpts ? halOpts.ctx() : undefined
      }, '*');
    }
    function onBlocklyFrameMessage(e) {
      if (!blocklyFrame || e.source !== blocklyFrame.contentWindow) return;
      const d = e.data;
      if (!d || d.__ardBlocks !== true) return;
      if (d.type === 'ready') {
        blocklyFrameReady = true;
        sendBlocklyInit();
      } else if (!blocklyFrameReady) {
        return;
      } else if (d.type === 'change') {
        if (typeof d.code !== 'string') return;
        const textCode = fromBlockCode(d.code);
        if (textCode !== el.editor.value) { el.editor.value = textCode; renderHighlight(); }
        setErrorLine(0);
        clearTimeout(saveTimer);
        saveCode(missionId, el.editor.value);
        blocksMatchText = true;
        if (d.layout) saveLayout(missionId, d.layout);
        if (d.snapshot) storeBlockSnapshot(missionId, { code: textCode, snapshot: d.snapshot });
      } else if (d.type === 'layout') {
        if (d.layout) saveLayout(missionId, d.layout);
      } else if (d.type === 'back') {
        returnToBlockLauncher();
      }
    }
    function openBlockEditor() {
      if (blocklyFrame) return;
      blocklyFrameReady = false;
      // iframe را «بعد» از تمام‌صفحه‌شدن می‌سازیم: جابه‌جاشدنِ یک iframe در DOM
      // (که setFullscreen انجام می‌دهد) آن را از نو بارگذاری می‌کند.
      if (!isFullscreen) { autoFullscreen = true; setFullscreen(true); }
      el.blocklyDiv.innerHTML = '';
      window.addEventListener('message', onBlocklyFrameMessage);
      blocklyFrame = document.createElement('iframe');
      blocklyFrame.title = 'ادیتورِ بلوکی';
      blocklyFrame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#0d1117;';
      blocklyFrame.src = BLOCKLY_EDITOR_URL;
      el.blocklyDiv.appendChild(blocklyFrame);
    }
    // iframe را از نو بارگذاری می‌کند تا دوباره «ready» بفرستد و با کدِ متنیِ
    // فعلی (مثلاً بعد از «کد اولیه») بلوک‌ها از نو ساخته شوند.
    function reloadBlockEditor() {
      if (!blocklyFrame) return;
      blocklyFrameReady = false;
      blocklyFrame.src = BLOCKLY_EDITOR_URL;
    }
    function closeBlockEditor() {
      window.removeEventListener('message', onBlocklyFrameMessage);
      if (blocklyFrame && blocklyFrame.parentNode) blocklyFrame.parentNode.removeChild(blocklyFrame);
      blocklyFrame = null;
      el.blocklyDiv.innerHTML = '';
    }
    // «بازگشت» (از داخلِ iframe) و «✕ بستن» (خروجِ دستی از تمام‌صفحه وقتی
    // ادیتورِ بلوکی باز است) هر دو باید دقیقاً به همان حالتِ قبل از بازکردنِ
    // ادیتور برگردند: خودِ حالتِ «بلوکی» را ترک نمی‌کنیم (نه حالتِ متنی)،
    // فقط iframe بسته می‌شود و دوباره دکمه‌ی 🧩 «باز کردنِ ادیتورِ بلوکی»
    // نشان داده می‌شود؛ اگر تمام‌صفحه‌شدن را خودِ بازکردنِ ادیتور راه انداخته
    // بود (autoFullscreen)، همان‌جا هم خاموشش می‌کنیم.
    function returnToBlockLauncher() {
      closeBlockEditor();
      showBlockLauncher();
      if (isFullscreen) setFullscreen(false);
      autoFullscreen = false;
    }
    function setMode(mode, opts) {
      const wantBlocks = mode === 'blocks';
      if (wantBlocks && task.noBlocks) return;
      if (blockMode === wantBlocks) return;
      if (wantBlocks) {
        const check = checkCodeCompiles();
        if (!check.ok) {
          // silent برای دو حالت است: بازیابیِ اجباریِ داخلی، و اعمالِ خودکارِ
          // ترجیحِ سراسری روی یک نمونه‌ی دیگر — هیچ‌کدام «تلاشِ مستقیمِ کاربر»
          // روی همین نمونه نیستند، پس نباید با یک پیامِ خطا سراغش برویم.
          if (!(opts && opts.silent)) {
            setStatus('کدت خطا دارد؛ اول در حالتِ متنی درستش کن.', 'error');
            check.messages.forEach((m) => logLine('✗ ' + m, 'sim-error'));
            setErrorLines(check.lines);
          }
          return; // همون‌جا متنی می‌مونیم؛ نه دکمه‌ها عوض می‌شن نه بلوکی باز می‌شه
        }
      }
      blockMode = wantBlocks;
      if (el.modeBlocksBtn) el.modeBlocksBtn.classList.toggle('is-active', wantBlocks);
      if (el.modeTextBtn) el.modeTextBtn.classList.toggle('is-active', !wantBlocks);
      if (wantBlocks) {
        el.editorWrap.style.display = 'none';
        el.blocklyWrap.style.display = 'block';
        // انتخابِ مستقیمِ کاربر (کلیک روی «بلوکی») → همان لحظه باز شود؛ اعمالِ
        // خودکارِ ترجیحِ سراسری (silent) → فقط دکمه‌ی بازکردن، تا با باز‌شدنِ صفحه
        // (یا هماهنگ‌شدنِ چند نمونه) چند ادیتورِ تمام‌صفحه روی هم نیاید.
        if (opts && opts.silent) showBlockLauncher(); else openBlockEditor();
      } else {
        closeBlockEditor();
        // skipSync وقتی استفاده می‌شود که خودمان به‌خاطرِ شکست‌خوردنِ تبدیلِ
        // متن‌به‌بلوک داریم برمی‌گردیم به حالتِ متنی — آن‌جا بومِ بلوکی ممکن
        // است خالی یا ناقص باشد، و اگر از رویش کد بسازیم، کدِ درستِ فعلی را
        // با یک خروجیِ خالی/ناقص جایگزین می‌کنیم. فقط وقتی خودِ کاربر دستی
        // روی «متنی» می‌زند (skipSync نیامده)، واقعاً باید از بلوک‌ها سینک شود.
        if (blockWorkspace && !(opts && opts.skipSync)) {
          forceCommitBlocklyFields();
          const ok = syncBlocksToText();
          if (!ok) setStatus('یکی از بلوک‌ها ناقص است؛ کدِ متنی هنوز آخرین نسخه نیست.', 'error');
        }
        el.blocklyWrap.style.display = 'none';
        el.editorWrap.style.display = '';
        autoFullscreen = false;
        if (isFullscreen) { positionErrorLine(); positionGhost(); }
      }
      // این انتخاب را به‌عنوان پیش‌فرضِ سراسریِ همه‌جا ذخیره می‌کنیم — هم برای
      // این‌که با رفرشِ صفحه یا بازکردنِ یک مأموریتِ دیگر همین حالت باز بماند،
      // و هم این‌که هر نمونه‌ی دیگرِ همین شبیه‌ساز که همین الان روی صفحه باز
      // است بلافاصله با آن هماهنگ شود (رویِ onGlobalModeChange در پایین).
      // برای بازگشت‌های اجباریِ داخلی و اعمالِ خودِ همین رویداد (skipPersist)،
      // ذخیره نمی‌کنیم — چون آن‌ها انتخابِ آگاهانه‌ی کاربر روی این نمونه نبودند.
      if (!(opts && opts.skipPersist)) saveMode(mode);
    }
    if (el.modeTextBtn) el.modeTextBtn.addEventListener('click', () => setMode('text'));
    if (el.modeBlocksBtn) el.modeBlocksBtn.addEventListener('click', () => setMode('blocks'));

    // هماهنگ‌کردنِ زنده با هر تغییرِ حالتی که در یک نمونه‌ی دیگرِ همین شبیه‌ساز
    // (مثلاً مأموریتِ دیگری در همین صفحه) رخ داده — طوری که واقعاً «همه‌جا»
    // (نه فقط بعدِ رفرش) همان حالت اعمال شود. silent است چون این تصمیمِ
    // مستقیمِ کاربر روی همین نمونه نبوده؛ اگر کدِ همین نمونه هنوز خطا دارد یا
    // درحالِ اجراست، به‌سادگی نادیده گرفته می‌شود و همان حالتِ فعلی می‌ماند.
    function onGlobalModeChange(e) {
      const m = e && e.detail && e.detail.mode;
      if (m !== 'text' && m !== 'blocks') return;
      if (running) return;
      setMode(m, { skipPersist: true, silent: true });
    }
    window.addEventListener(MODE_CHANGE_EVENT, onGlobalModeChange);

    if (window.ResizeObserver) {
      new ResizeObserver(checkBlocklyWidth).observe(el.editorBlock);
    } else {
      window.addEventListener('resize', checkBlocklyWidth);
    }

    // اعمالِ ترجیحِ سراسریِ ذخیره‌شده (اگر کاربر قبلاً «بلوکی» را انتخاب کرده)
    // همین ابتدا، قبل از این‌که کاربر با این نمونه‌ی تازه‌باز‌شده کاری کند.
    // skipPersist چون این فقط خوانْدنِ همان ترجیح است، نه یک انتخابِ جدید؛
    // silent چون اگر کدِ اولیه‌ی همین مأموریت (به‌ندرت) قابلِ تبدیل نبود، نباید
    // همان لحظه‌ی بازشدنِ صفحه یک پیامِ خطا به کاربر نشان دهیم — فقط در حالتِ
    // متنی می‌ماند.
    if (loadSavedMode() === 'blocks') setMode('blocks', { skipPersist: true, silent: true });

    el.runBtn.addEventListener('click', runProgram);
    el.stopBtn.addEventListener('click', stopProgram);
    el.resetBtn.addEventListener('click', resetCode);

    return {
      // quest.js موقع بستن مودالِ مأموریت فقط همین stop() را صدا می‌زند (نه
      // destroy را) — پس اگر کاربر مودال را در حالِ تمام‌صفحه بسته باشد، اول
      // باید از تمام‌صفحه خارج شویم تا .sim-editor-block از document.body به
      // خانه‌ی اصلی‌اش برگردد، وگرنه یک ادیتورِ تمام‌صفحه‌ی یتیم روی صفحه
      // باقی می‌ماند.
      stop() {
        if (isFullscreen) setFullscreen(false);
        stopProgram();
        if (halRaf) { cancelAnimationFrame(halRaf); halRaf = 0; }
      },
      // وضعیتِ Cube عوض شد (فقط مأموریت‌های رباتیک): هشدارِ روی بلوک‌ها تازه شود
      pushHalContext() {
        if (!halOpts) return;
        try {
          if (blocklyFrame && blocklyFrameReady && blocklyFrame.contentWindow) blocklyFrame.contentWindow.postMessage({ __ardBlocks: true, type: 'hal-context', hal: halOpts.ctx() }, '*');
          if (blockWorkspace && ArduinoBlocks.updateHalContext) ArduinoBlocks.updateHalContext(blockWorkspace, halOpts.ctx());
        } catch (e) { /* noop */ }
      },
      destroy() {
        if (isFullscreen) setFullscreen(false);
        stopProgram();
        if (halRaf) { cancelAnimationFrame(halRaf); halRaf = 0; }
        window.removeEventListener(MODE_CHANGE_EVENT, onGlobalModeChange);
        closeBlockEditor();
        if (blockWorkspace) ArduinoBlocks.disposeWorkspace(blockWorkspace);
      }
    };
  }

  return { mount, starterCode, highlightArduino };
})();