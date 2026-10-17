/* ========================================================================
   QUEST-ELECTRONICS.JS — بخش الکترونیک
   داده‌ی مأموریت‌ها (QUESTS_ELECTRONICS) + شبیه‌سازها
   QUESTS_ELECTRONICS + mountVoltCurrentSim / Resistor / LED / Capacitor / Transistor / ShiftRegister
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
    ]},
  { id:'voltage_regulator', icon:'🔌', title:'رگولاتور ولتاژ (۷۸۰۵)', sub:'از باتری ۹ ولتی ۵ ولتِ ثابت بگیر — و ببین گرما از کجا می‌آید',
    xp:60,
    quote:'«باتری ۹ ولتی را مستقیم به برد ۵ ولتی بزنی می‌سوزد. رگولاتور قطعه‌ای است که هر ولتاژی را (تا حدی) می‌گیرد و یک ولتاژ ثابت و تمیز تحویل می‌دهد؛ مثل شیرِ فشارشکن که هر فشاری از ورودی بیاید، خروجی را روی یک عدد نگه می‌دارد.»',
    desc:'رگولاتور خطی ۷۸۰۵ سه پایه دارد: ورودی (IN)، زمین (GND) و خروجی (OUT). هر ولتاژی بین حدود ۷ تا ۳۵ ولت به ورودی بدهی، روی خروجی ۵ ولتِ ثابت می‌گیری. برای همین اغلب برد آردوینو و بسیاری از پروژه‌ها با باتری ۹ ولتی یا آداپتور ۱۲ ولتی روشن می‌شوند. برای ۳٫۳ ولتِ STM32 هم نمونه‌ی مشابه (مثل AMS1117-3.3) داریم.\n\nرگولاتور خطی ولتاژِ اضافه را «می‌سوزاند»، یعنی به گرما تبدیل می‌کند: توان تلف‌شده = (ولتاژ ورودی − ولتاژ خروجی) × جریان. هرچه اختلاف یا جریان بیشتر باشد، قطعه داغ‌تر می‌شود و اگر از حدی بگذرد، محافظ حرارتی خروجی را قطع می‌کند. دو خازن کوچک هم کنار آن می‌گذارند تا خروجی نویز نداشته باشد.',
    steps:[
      'اول ببین: باتری مستقیم به برد ۵ ولتی وصل است و برد سوخته. ولتاژ را کم و زیاد کن و ببین فقط یک بازه‌ی باریک امن است.',
      'دکمه‌ی «با رگولاتور ۷۸۰۵» را بزن؛ حالا هر ورودی بین ۷ تا ۱۵ ولت، خروجی را روی ۵ ولتِ ثابت نگه می‌دارد. به محض استفاده از رگولاتور، مأموریت تکمیل می‌شود.',
      '(اختیاری) ورودی را زیر ۷ ولت ببر: رگولاتور حدود ۲ ولت اختلاف لازم دارد (افت ولتاژ) و خروجی دیگر ۵ نیست.',
      '(اختیاری) ورودی و جریانِ مصرف را بالا ببر تا رگولاتور داغ شود و محافظ حرارتی خاموشش کند؛ توان تلف‌شده = (Vin − Vout) × I.',
      '(اختیاری) یک حالتِ سالم بساز: ورودی ۷ تا ۱۰ ولت، خروجی ۵ ولتِ ثابت و دمای کمتر از ۱۰۰ درجه.'
    ]},
  { id:'shift_register', icon:'🔢', title:'شیفت رجیستر (74HC595)', sub:'۸ خروجی با فقط ۳ پین — کلاک، لچ و چالش',
    xp:60,
    quote:'«شیفت رجیستر مثل یک صف است: با هر کلاک یک بیت تازه وارد صف می‌شود و بقیه یک قدم جلو می‌روند. وقتی صف آماده شد، با LATCH همه‌ی ۸ خروجی را یک‌جا روشن می‌کنی؛ یعنی ۸ LED با فقط ۳ پین آردوینو.»',
    desc:'۷۴HC595 یک «تبدیل‌کننده‌ی سریال به موازی» است: بیت‌ها را از یک سیم می‌گیرد و هم‌زمان روی ۸ خروجی می‌گذارد؛ برای نوار LED، نمایشگر هفت‌قسمتی، ماتریس LED و هر جا که پین کم آورده‌ای.\n\nآردوینو Uno پین‌های محدودی دارد، ولی تو ۸ تا LED می‌خواهی. تراشه‌ی 74HC595 با فقط سه سیم هشت خروجی (Q0 تا Q7) به تو می‌دهد: DATA (بیتی که می‌فرستی: ۰ یا ۱)، CLOCK (هر پالسش بیت‌ها را یک قدم جلو می‌برد) و LATCH (محتوای آماده را یک‌جا روی خروجی‌ها می‌گذارد).\n\nداخل تراشه دو ردیف هشت‌خانه‌ای هست: ردیف شیفت که بیت‌ها با CLOCK در آن قدم می‌زنند، و ردیف لچ که LEDها به آن وصل‌اند و فقط با LATCH از ردیف شیفت کپی می‌گیرد. به همین خاطر LEDها وسط جابه‌جایی بیت‌ها چشمک نمی‌زنند.\n\nاین مأموریت سه مرحله دارد: اول CLOCK و حرکت بیت‌ها، بعد LATCH، و آخر یک چالش: ساختن الگوی هدف.',
    steps:[
      'اول توضیحِ «این قطعه چیکار می‌کند؟» و مدار را بخوان: سه سیم از آردوینو به پایه‌های ۱۴، ۱۱ و ۱۲ و هر خروجی با مقاومت ۲۲۰Ω به یک LED.',
      'مرحله ۱ — CLOCK: DATA را ۱ کن و یک بار CLOCK بزن. بعد DATA را ۰ بگذار و CLOCK بزن تا همان ۱ قدم‌به‌قدم به Q7 برسد.',
      'مرحله ۲ — LATCH: چند بیتِ ۱ داخل رجیستر بفرست و ببین LEDها هنوز خاموش‌اند؛ بعد LATCH بزن تا یک‌جا روشن شوند.',
      'مرحله ۳ — چالش: ۸ بیت بفرست تا LEDها مثل نقطه‌های «هدف» شوند. اولین بیتی که می‌فرستی به Q7 می‌رسد، پس الگو را از Q7 شروع کن.',
      'نمودار زمانی پایین شکل را نگاه کن: DATA درست در لحظه‌ی بالا رفتن CLOCK خوانده می‌شود (نقطه‌ی زرد).',
      'بعد از موفقیت، کد آردوینو معادل را می‌بینی؛ shiftOut همین ۸ کلاک را برایت انجام می‌دهد.'
    ]}
];


/* باتری ۹ ولتی ایستاده: بدنه‌ی سبز با برچسب روشن؛ دو قطبِ − (شش‌ضلعی، نقره‌ای) و + (گرد، طلایی)
   روی بالای باتری. مرکزِ قطب‌ها: ‌(x+10, y-8) برای − و (x+w-10, y-8) برای +؛ سیم‌ها از همان نقطه‌ها شروع می‌شوند. */
function batterySvg(o){
  const { id, x, y, w, h, textId, text } = o, ty = y - 8, xm = x + 10, xp = x + w - 10, s1 = y + h * 0.3, sh = h * 0.4, cx = x + w / 2, cy = s1 + sh / 2;
  /* o.rot (درجه): کل باتری را حولِ مرکزش می‌چرخاند؛ علامت‌های −/+ و صاعقه/متن وسط خلافِ جهتِ چرخش برمی‌گردند تا همیشه صاف خوانده شوند. */
  const rot = o.rot || 0, un = (px, py) => rot ? ` transform="rotate(${-rot} ${px} ${py})"` : '';
  const mid0 = textId
    ? `<text id="${textId}" x="${cx}" y="${cy + 4}" font-size="13" font-weight="bold" fill="#052e18" text-anchor="middle">${text || ''}</text>`
    : `<path d="M${cx + 2} ${cy - 7} L${cx - 5} ${cy + 1} H${cx} L${cx - 2} ${cy + 7} L${cx + 5} ${cy - 1} H${cx} Z" fill="#052e18"/>`;
  const mid = rot ? `<g${un(cx, cy)}>${mid0}</g>` : mid0;
  return `<g${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}>
    <defs>
      <linearGradient id="${id}B" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3fcf85"/><stop offset=".5" stop-color="#27a560"/><stop offset="1" stop-color="#17703f"/></linearGradient>
      <linearGradient id="${id}S" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4ffe6"/><stop offset="1" stop-color="#8be8b4"/></linearGradient>
    </defs>
    <rect x="${xm - 2.5}" y="${ty}" width="5" height="${y - ty + 2}" fill="#aab2be"/>
    <rect x="${xp - 2}" y="${ty}" width="4" height="${y - ty + 2}" fill="#aab2be"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#${id}B)" stroke="#0b4a28" stroke-width="1.2"/>
    <rect x="${x + 1}" y="${s1}" width="${w - 2}" height="${sh}" fill="url(#${id}S)"/>
    <rect x="${x + 3}" y="${y + 3}" width="2" height="${h - 6}" rx="1" fill="#fff" opacity=".18"/>
    ${mid}
    <circle cx="${xm}" cy="${ty}" r="5.2" fill="#cfd5de" stroke="#6d757e" stroke-width="1"/>
    <text x="${xm}" y="${ty + 3.2}" font-size="9" font-weight="bold" fill="#3a4250" text-anchor="middle"${un(xm, ty)}>\u2212</text>
    <circle cx="${xp}" cy="${ty}" r="5.2" fill="#f2c94c" stroke="#8a6a12" stroke-width="1"/>
    <text x="${xp}" y="${ty + 3.2}" font-size="9" font-weight="bold" fill="#5a4200" text-anchor="middle"${un(xp, ty)}>+</text>
  </g>`;
}

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
      <svg class="ls-svg" style="cursor:default" viewBox="0 0 320 170" direction="ltr" role="img" aria-label="مدار باتری، مقاومت و LED">
        <defs>${ledRealDefs('ld')}</defs>
        <g id="ldWires" fill="none" stroke="#667" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M48 66 H80"/><path id="ldWTop" d="M130 66 H186"/><path id="ldWRet" d="M22 66 V52 H4 V158 H206 V86"/></g>
        ${batterySvg({ id: 'ldBat', x: 12, y: 74, w: 46, h: 58 })}
        <text x="35" y="147" font-size="11" fill="#cfc8b6" text-anchor="middle">باتری</text>
        <rect x="80" y="58" width="50" height="16" rx="3" fill="#c9b48a" stroke="#8a7550"/>
        <rect x="92" y="58" width="5" height="16" fill="#c0392b"/><rect x="102" y="58" width="5" height="16" fill="#c0392b"/><rect x="112" y="58" width="5" height="16" fill="#6b4226"/>
        <text x="105" y="52" font-size="11" fill="#cfc8b6" text-anchor="middle">۲۲۰Ω</text>
        <g id="ldLed" transform="translate(250 76)">${ledRealSvg('ld')}</g>
        <text id="ldTop" x="175" y="57" font-size="10" fill="#cfc8b6" text-anchor="middle"></text>
        <text id="ldBot" x="178" y="112" font-size="10" fill="#cfc8b6" text-anchor="end"></text>
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
    /* سیم‌ها دقیقاً به نوکِ پایه‌ها می‌رسند: پایه‌ی بلند (آند) نوکش x=۱۸۶ و پایه‌ی کوتاه (کاتد) نوکش x=۲۰۶ است.
       با برگرداندن LED جای دو پایه عوض می‌شود، پس طولِ سیم‌ها هم باید عوض شود. */
    const ANODE_X = 186, CATHODE_X = 206;
    const tipTop = flipped ? CATHODE_X : ANODE_X, tipBot = flipped ? ANODE_X : CATHODE_X;
    q('#ldWTop').setAttribute('d', `M130 66 H${tipTop}`);
    q('#ldWRet').setAttribute('d', `M22 66 V52 H4 V158 H${tipBot} V86`);
    q('#ldBot').setAttribute('x', tipBot - 8);
    q('#ldTop').textContent = flipped ? 'کاتد (−) پایه‌ی کوتاه' : 'آند (+) پایه‌ی بلند';
    q('#ldBot').textContent = flipped ? 'آند (+) پایه‌ی بلند' : 'کاتد (−) پایه‌ی کوتاه';
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
      <svg class="ls-svg" style="cursor:default" viewBox="0 0 320 196" direction="ltr" role="img" aria-label="باتری، خازن و LED">
        <defs>${ledRealDefs('cp')}</defs>
        <text x="34" y="146" font-size="11" fill="#cfc8b6" text-anchor="middle">باتری</text>
        <path id="cpIn" d="M46 64 H130" fill="none" stroke="#667" stroke-width="3"/>
        <path id="cpNeg" d="M22 64 V50 H4 V188 H186 V124" fill="none" stroke="#667" stroke-width="3"/>
        ${batterySvg({ id: 'cpBat', x: 12, y: 72, w: 44, h: 58 })}
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
  const fill = q('#cpFill'), pct = q('#cpPct'), wIn = q('#cpIn'), wOut = q('#cpOut'), wRet = q('#cpRet'), wNeg = q('#cpNeg'), led = q('#cpLed'), st = q('#cpStatus');
  let v = 0, mode = 'idle', fullSeen = false, succeeded = !!alreadyDone, raf = 0, last = null;
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };

  function paint(){
    const h = 88 * v;
    fill.setAttribute('y', (124 - h).toFixed(1)); fill.setAttribute('height', h.toFixed(1));
    pct.textContent = toFa(Math.round(v * 100)) + '٪';
    wIn.setAttribute('stroke', mode === 'charge' ? '#57d8a3' : '#667');
    wNeg.setAttribute('stroke', mode === 'charge' ? '#57d8a3' : '#667');
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
  const UNO_FILL = '#1a6fb5', UNO_LINE = '#0e4a7d', UNO_HOT = '#8a2e22', UNO_HOT_LINE = '#ff5a4f';
  const r2 = v => +v.toFixed(2);
  const uX = m => r2(UL + (2700 - m) * S), uY = m => r2(UT + (2100 - m) * S);
  const d2x = uX(2400), gndx = uX(1100), pinY = uY(100);
  const sock = (x0, n, y) => `<rect x="${x0 - 50}" y="${y - 65}" width="${n * 100}" height="130" rx="12" fill="#171a1f" stroke="#000" stroke-width="10"/>`
    + Array.from({ length: n }, (_, k) => `<rect x="${x0 + 100 * k - 26}" y="${y - 26}" width="52" height="52" fill="#4b525c"/>`).join('');
  const silk = (x, y, t, px, o = {}) => `<text ${o.id ? `id="${o.id}" ` : ''}transform="translate(${x} ${y}) rotate(180)" font-size="${r2(px / S)}" text-anchor="${o.anchor || 'middle'}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="${o.fill || '#f4fbfb'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${t}</text>`;
  const logo = (cx, cy) => `<g fill="none" stroke="#f4fbfb" stroke-linecap="round"><circle cx="${cx - 105}" cy="${cy}" r="92" stroke-width="30"/><circle cx="${cx + 105}" cy="${cy}" r="92" stroke-width="30"/><path d="M${cx - 150} ${cy}h90M${cx + 60} ${cy}h90M${cx + 105} ${cy - 45}v90" stroke-width="22"/></g>`;
  const uno = `<g transform="translate(${r2(UL + 2700 * S)} ${r2(UT + 2100 * S)}) rotate(180) scale(${S})">
          <rect id="trPin" x="0" y="0" width="2700" height="2100" rx="70" fill="${UNO_FILL}" stroke="${UNO_LINE}" stroke-width="30"/>
          <g fill="#b9c0c8">${Array.from({ length: 14 }, (_, k) => `<rect x="${1069 + 93 * k}" y="1160" width="42" height="80"/><rect x="${1069 + 93 * k}" y="1540" width="42" height="80"/>`).join('')}</g>
          <rect x="1050" y="1230" width="1350" height="320" rx="24" fill="#16181d"/>
          <path d="M1050 1335a55 55 0 0 1 0 110z" fill="#2c3037"/>
          <rect x="640" y="235" width="220" height="220" rx="24" fill="#b7bec6" stroke="#6d757e" stroke-width="18"/>
          <circle cx="750" cy="345" r="72" fill="#c93030"/>
          ${sock(1900, 8, 100)}${sock(800, 10, 100)}${sock(1000, 8, 2000)}${sock(1900, 6, 2000)}
          <rect x="-270" y="180" width="690" height="480" rx="30" fill="#c9d0d7" stroke="#8b949e" stroke-width="22"/>
          <rect x="-80" y="1300" width="640" height="440" rx="36" fill="#1b1d22"/>
          ${logo(1700, 620)}
          ${silk(1700, 1000, 'UNO', 11)}
          ${silk(2478, 300, 'D2', 6.5, { id: 'trPinT', anchor: 'start', fill: '#fff' })}
          ${silk(1100, 300, 'GND', 6.5, { fill: '#fff' })}
        </g>`;

  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note">هدف: روی بردبورد ۵ تا LED داریم که روی هم <b>۱۰۰ میلی‌آمپر</b> می‌کشند (هرکدام ۲۰). اول جریانشان را مستقیم از پین بگیر، بعد با ترانزیستور BC547 امتحان کن. پین فقط حدود ۲۰ میلی‌آمپر می‌دهد.</div>
      <svg class="ls-svg" viewBox="0 -58 316 340" style="cursor:default;display:block;width:100%;max-width:360px;height:auto;margin:0 auto" direction="ltr" role="img" aria-label="آردوینو اونو و بردبورد با پنج LED، مقاومت و ترانزیستور BC547">
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
      <div class="ir-tabs" style="max-width:360px;margin:8px auto 0;gap:6px">
        <button type="button" class="sim-btn sim-btn-run" data-m="pin" style="flex:1;padding:7px 10px;font-size:13px;min-height:0;border-radius:10px">📌 مستقیم از پین</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-m="tr" style="flex:1;padding:7px 10px;font-size:13px;min-height:0;border-radius:10px">🎛️ با ترانزیستور</button>
      </div>
      <div class="ll-row" style="max-width:360px;margin:6px auto 0"><button type="button" class="sim-btn sim-btn-ghost" id="trSig" style="width:100%;flex:1;padding:7px 10px;font-size:13px;min-height:0;border-radius:10px">⚡ سیگنال پین: خاموش</button></div>
      <div class="ls-read"><span>جریان لازم از پین: <b class="mono" id="trNeed"></b></span><span>حد پین: <b class="mono">${toFa(PIN_MA)} mA</b></span><span>جریان LEDها: <b class="mono" id="trLedI"></b></span></div>
      <div class="ir-meter"><div class="ir-meter-fill" id="trMeter"></div></div>
      <div class="sim-status" id="trStatus" data-state="idle"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const paintBtn = (el, act, bg, fg) => { el.style.backgroundImage = 'none'; el.style.background = act ? bg : '#1b2330'; el.style.color = act ? fg : '#9aa7b8'; el.style.border = '1px solid ' + (act ? bg : '#2c3748'); };
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
    paintBtn(q('#trSig'), on, '#f5b942', '#1b1b1b');
    container.querySelectorAll('[data-v]').forEach(g => { g.style.display = g.dataset.v === mode ? '' : 'none'; });
    container.querySelectorAll('[data-m]').forEach(b => {
      const act = b.dataset.m === mode;
      b.classList.toggle('sim-btn-run', act); b.classList.toggle('sim-btn-ghost', !act);
      paintBtn(b, act, '#3b82f6', '#fff');
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

/* ================= ELECTRONICS: رگولاتور ولتاژ (۷۸۰۵) =================
   باتری با ورودی متغیر → یا مستقیم به برد ۵ولتی، یا از راه ۷۸۰۵.
   مدل: Vout = ۵ اگر Vin ≥ ۷ وگرنه Vin−۲؛ توان = (Vin−Vout)×I؛ دما = ۲۵ + ۶۵×توان؛ از ۱۲۵° محافظ حرارتی قطع می‌کند. */
function mountVoltageRegulatorSim(container, { onSuccess, alreadyDone } = {}){
  const fa = n => (typeof toFa === 'function' ? toFa(n) : String(n));
  const f = (n, d = 1) => fa(n.toFixed(d).replace('.', '٫'));
  const knight = t => { try { if(typeof showKnightLine === 'function') showKnightLine(t, 'happy', 'knight'); } catch(e){} };
  const VOUT = 5, DROP = 2, THETA = 65, T_AMB = 25, T_SHUT = 125, T_SAFE = 100;
  const C = { ok:'#57d8a3', bad:'#ff6b5a', on:'#f5b942', line:'#667', red:'#c0392b' };
  const cardCss = 'background:#141b27;border-radius:10px;padding:7px 4px;text-align:center';
  const lblCss = 'font-size:11px;color:#9aa7b8';
  const valCss = "font:700 15px 'JetBrains Mono',monospace;direction:ltr";

  /* برد Arduino Uno R3 از بالا (همان برد مأموریت‌های ترانزیستور و شیفت رجیستر).
     مختصات داخلی بر حسب mil است (۲٫۷″×۲٫۱″، USB سمت چپ، هدر دیجیتال بالا، هدر تغذیه پایین).
     ۹۰° چرخانده شده تا هدر تغذیه (…، 5V، GND، GND، Vin) رو به مدار (سمت چپ) باشد.
     نگاشت: صفحه‌ی x = UTX − y_mil·S ، صفحه‌ی y = UTY + x_mil·S */
  const US = 0.042, UTX = 336, UTY = 52, r2 = v => +v.toFixed(2);
  const uPinX = UTX - 2000 * US;                       // ردیف پین‌های هدر تغذیه
  const uPinY = m => r2(UTY + m * US);                 // m = موقعیت پین روی هدر (mil)
  const Y5V = uPinY(1400), YGND = uPinY(1600);
  const usock = (x0, n, y) => `<rect x="${x0 - 50}" y="${y - 65}" width="${n * 100}" height="130" rx="12" fill="#171a1f" stroke="#000" stroke-width="10"/>`
    + Array.from({ length: n }, (_, k) => `<rect x="${x0 + 100 * k - 26}" y="${y - 26}" width="52" height="52" fill="#4b525c"/>`).join('');
  const unoSvg = `<g transform="translate(${UTX} ${UTY}) rotate(90) scale(${US})">
          <rect id="vrBoardRect" x="0" y="0" width="2700" height="2100" rx="70" fill="#1a6fb5" stroke="#0e4a7d" stroke-width="30"/>
          <g fill="#b9c0c8">${Array.from({ length: 14 }, (_, k) => `<rect x="${1069 + 93 * k}" y="1160" width="42" height="80"/><rect x="${1069 + 93 * k}" y="1540" width="42" height="80"/>`).join('')}</g>
          <rect x="1050" y="1230" width="1350" height="320" rx="24" fill="#16181d"/>
          <path d="M1050 1335a55 55 0 0 1 0 110z" fill="#2c3037"/>
          <rect x="640" y="235" width="220" height="220" rx="24" fill="#b7bec6" stroke="#6d757e" stroke-width="18"/>
          <circle cx="750" cy="345" r="72" fill="#c93030"/>
          ${usock(1900, 8, 100)}${usock(800, 10, 100)}${usock(1000, 8, 2000)}${usock(1900, 6, 2000)}
          <rect x="-270" y="180" width="690" height="480" rx="30" fill="#c9d0d7" stroke="#8b949e" stroke-width="22"/>
          <rect x="-80" y="1300" width="640" height="440" rx="36" fill="#1b1d22"/>
        </g>
        <g transform="translate(306 100) scale(${US})" fill="none" stroke="#f4fbfb" stroke-linecap="round"><circle cx="-105" cy="0" r="92" stroke-width="30"/><circle cx="105" cy="0" r="92" stroke-width="30"/><path d="M-150 0h90M60 0h90M105 -45v90" stroke-width="22"/></g>
        <text x="306" y="116" font-size="8" font-weight="bold" font-family="Arial, Helvetica, sans-serif" fill="#f4fbfb" text-anchor="middle">UNO</text>
        <text x="${uPinX + 5}" y="${(Y5V + 1.6).toFixed(1)}" font-size="4.6" font-weight="bold" font-family="Arial, Helvetica, sans-serif" fill="#fff">5V</text>
        <text x="${uPinX + 5}" y="${(YGND + 1.6).toFixed(1)}" font-size="4.6" font-weight="bold" font-family="Arial, Helvetica, sans-serif" fill="#fff">GND</text>`;

  /* آتشِ برد (وقتی ولتاژ زیاد مستقیم به برد می‌رسد): سبک نگه داشته شده —
     ۵ شعله‌ی دولایه با رنگ ساده (بدون گرادیان) و یک انیمیشن ساده برای هرکدام،
     درخششِ ثابت و بدون جرقه. فقط وقتی برد می‌سوزد نمایش داده می‌شود. */
  const fireDefs = `<radialGradient id="vrGlowG"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".5"/><stop offset=".6" stop-color="#ff4a12" stop-opacity=".18"/><stop offset="1" stop-color="#ff4a12" stop-opacity="0"/></radialGradient>`;
  const flameD = (w, h) => { const n = v => r2(v); return `M${n(-w)} 0 C${n(-w * 1.15)} ${n(-h * .35)} ${n(-w * .3)} ${n(-h * .55)} ${n(-w * .05)} ${n(-h)} C${n(w * .2)} ${n(-h * .62)} ${n(w * 1.2)} ${n(-h * .4)} ${n(w)} 0 Z`; };
  const flame = (x, y, w, h, dur) => `<g transform="translate(${x} ${y})"><g>
        <animateTransform attributeName="transform" type="scale" values="1 1;.88 1.16;1 1" dur="${dur}s" repeatCount="indefinite"/>
        <path d="${flameD(w, h)}" fill="#ff5a14"/><path d="${flameD(w * .55, h * .6)}" fill="#ffc83a"/></g></g>`;
  const fireSvg = '';  // آتش حذف شد؛ فقط برد قرمز می‌شود

  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-hw-note"><b>🔌 این قطعه چیکار می‌کند؟</b><br>رگولاتور ولتاژ هر ولتاژی را (تا حدی) می‌گیرد و یک ولتاژ <b>ثابت</b> تحویل می‌دهد. برد آردوینو ۵ ولت می‌خواهد ولی باتری ۹ ولت است؛ بین این دو یک ۷۸۰۵ می‌گذاریم. <b>هدف:</b> اول ببین بدون رگولاتور چه می‌شود، بعد رگولاتور را وصل کن و حدّ و مرزهایش (افت ولتاژ و گرما) را پیدا کن.</div>
      <svg class="ls-svg" style="cursor:default;display:block;width:100%;max-width:380px;height:auto;margin:0 auto" viewBox="0 20 340 170" direction="ltr" role="img" aria-label="باتری، رگولاتور ۷۸۰۵ با دو خازن، و برد آردوینو ۵ ولتی">
        
        <path id="vrBypass" d="M80 80 V44 H244 V${Y5V} H${uPinX - 1}" fill="none" stroke="${C.red}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <g fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path id="vrIn" d="M50 80 H100 V136 H136 V130"/>
          <path id="vrOut" d="M176 130 V136 H212 V80 H244 V${Y5V} H${uPinX - 1}"/>
          <path d="M24 80 V66 H5 V168 H240 V${YGND} H${uPinX - 1}"/>
          <path d="M156 130 V168"/>
          <path d="M80 80 V100 M80 106 V168"/>
          <path d="M226 80 V100 M226 106 V168"/>
        </g>
        <g stroke="#cfc8b6" stroke-width="3"><path d="M70 100 H90 M70 106 H90 M216 100 H236 M216 106 H236"/></g>
        <text x="86" y="146" font-size="8" fill="#9aa7b8">۰٫۳۳µF</text><text x="220" y="146" font-size="8" fill="#9aa7b8" text-anchor="end">۰٫۱µF</text>
        ${batterySvg({ id: 'vrBatt', x: 14, y: 88, w: 46, h: 58, textId: 'vrBat', text: '9 V' })}
        <text x="37" y="161" font-size="10" fill="#cfc8b6" text-anchor="middle">باتری</text>
        <g id="vrReg">
          <g fill="#c0c6d0" stroke="#6d757e" stroke-width=".8"><rect x="134.5" y="108" width="3" height="22"/><rect x="154.5" y="108" width="3" height="22"/><rect x="174.5" y="108" width="3" height="22"/></g>
          <path d="M126 76 V56 Q126 52 130 52 H182 Q186 52 186 56 V76 Z" fill="#b7bec6" stroke="#6d757e"/>
          <path d="M129 55 H183" stroke="#e3e7ee" stroke-width="1.2" stroke-linecap="round"/>
          <circle cx="156" cy="62" r="4.2" fill="#10151f" stroke="#6d757e" stroke-width=".8"/>
          <rect x="120" y="72" width="72" height="38" rx="3" fill="#1b1d22" stroke="#3b4a60"/>
          <rect x="120" y="72" width="72" height="5" rx="2" fill="#2b2f37"/>
          <rect id="vrHeat" x="120" y="72" width="72" height="38" rx="3" fill="#ff3b1f" opacity="0"/>
          <text x="156" y="94" font-size="14" font-weight="bold" fill="#f4fbfb" text-anchor="middle">7805</text>
          <g font-size="6.5" fill="#9aa7b8" text-anchor="middle"><text x="136" y="106">IN</text><text x="156" y="106">GND</text><text x="176" y="106">OUT</text></g>
        </g>
        ${unoSvg}
        ${fireSvg}
        <circle id="vrLedG" cx="306" cy="138" r="14" fill="${C.ok}" opacity="0"/><circle id="vrLed" cx="306" cy="138" r="5" fill="#3a2a2a" stroke="#6b4a4a"/>
        <text id="vrBoardT" x="306" y="157" font-size="8" font-weight="bold" fill="#f4fbfb" text-anchor="middle"></text>      </svg>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:380px;margin:8px auto 0">
        <div style="${cardCss}"><div style="${lblCss}">ورودی</div><div id="vrVin" style="${valCss}"></div></div>
        <div style="${cardCss}"><div style="${lblCss}">خروجی</div><div id="vrVout" style="${valCss}"></div></div>
        <div style="${cardCss}"><div style="${lblCss}">گرما</div><div id="vrP" style="${valCss}"></div></div>
        <div style="${cardCss}"><div style="${lblCss}">دما</div><div id="vrT" style="${valCss}"></div></div>
      </div>
      <div style="max-width:380px;margin:6px auto 0;height:8px;border-radius:6px;background:#1a2130;overflow:hidden"><div id="vrTBar" style="height:100%;width:0;background:${C.ok};transition:width .15s"></div></div>
      <div style="max-width:380px;margin:10px auto 0">
        <label style="display:block;font-size:13px;color:#cfc8b6">ولتاژ باتری: <b id="vrVinL" dir="ltr"></b></label>
        <input id="vrVinR" type="range" min="3" max="15" step="0.5" value="9" style="width:100%;accent-color:#f5b942">
        <label style="display:block;font-size:13px;color:#cfc8b6;margin-top:6px">جریانِ مصرفِ برد: <b id="vrIL" dir="ltr"></b></label>
        <input id="vrIR" type="range" min="50" max="1000" step="50" value="200" style="width:100%;accent-color:#f5b942">
      </div>
      <div style="display:flex;gap:8px;max-width:380px;margin:10px auto 0">
        <button type="button" class="sim-btn sim-btn-ghost" id="vrDirect" style="flex:1">🔋 بدون رگولاتور</button>
        <button type="button" class="sim-btn sim-btn-ghost" id="vrUse" style="flex:1">🔌 با رگولاتور ۷۸۰۵</button>
      </div>
      <div class="sim-status" id="vrStatus" data-state="idle" aria-live="polite"></div>
      <div class="sim-hw-note" id="vrLesson" style="display:none"></div>
    </div>`;

  const q = s => container.querySelector(s);
  const st = q('#vrStatus');
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };
  let reg = !!alreadyDone, vin = 9, load = 200, succeeded = !!alreadyDone;
  const seen = { burn: !!alreadyDone, stable: !!alreadyDone, drop: !!alreadyDone, shut: !!alreadyDone };
  const CHECKS = [
    ['burn', 'بدون رگولاتور، ولتاژِ زیاد برد را سوزاند'],
    ['stable', 'با رگولاتور، خروجی روی ۵ ولتِ ثابت ماند'],
    ['drop', 'ورودی زیر ۷ ولت رفت و خروجی افت کرد'],
    ['shut', 'رگولاتور داغ شد و محافظ حرارتی قطعش کرد']
  ];

  function model(){
    if(!reg) return { vout: vin, p: 0, t: T_AMB, shut: false };
    let vout = vin >= VOUT + DROP ? VOUT : Math.max(0, vin - DROP);
    const p = (vin - vout) * (load / 1000), t = T_AMB + p * THETA;
    if(t >= T_SHUT) return { vout: 0, p, t: T_SHUT, shut: true };
    return { vout, p, t, shut: false };
  }

  function paint(){
    const m = model(), burn = m.vout > 5.5, low = m.vout < 4.5, ok = !burn && !low;
    if(!reg && burn) seen.burn = true;
    if(reg && ok && !m.shut) seen.stable = true;
    if(reg && vin < VOUT + DROP && !m.shut) seen.drop = true;
    if(reg && m.shut) seen.shut = true;

    q('#vrBat').textContent = vin.toFixed(1) + ' V';
    q('#vrVin').textContent = vin.toFixed(1) + ' V';
    q('#vrVout').textContent = m.vout.toFixed(1) + ' V';
    q('#vrVout').style.color = burn ? C.bad : ok ? C.ok : C.on;
    q('#vrP').textContent = m.p.toFixed(2) + ' W';
    q('#vrT').textContent = Math.round(m.t) + '°C';
    q('#vrT').style.color = m.t >= T_SHUT ? C.bad : m.t > T_SAFE ? C.on : '#e9edf5';
    const bar = q('#vrTBar'); bar.style.width = Math.min(100, (m.t - T_AMB) / (T_SHUT - T_AMB) * 100) + '%';
    bar.style.background = m.t >= T_SHUT ? C.bad : m.t > T_SAFE ? C.on : C.ok;
    q('#vrVinL').textContent = vin.toFixed(1) + ' V'; q('#vrIL').textContent = load + ' mA';

    q('#vrReg').setAttribute('opacity', reg ? 1 : .25);
    q('#vrOut').style.display = reg ? '' : 'none';
    q('#vrBypass').style.display = reg ? 'none' : '';
    q('#vrHeat').setAttribute('opacity', reg ? Math.min(.75, Math.max(0, (m.t - 40) / 120)).toFixed(2) : 0);
    q('#vrBoardRect').setAttribute('fill', burn ? '#d32f2f' : '#1a6fb5');
    q('#vrBoardRect').setAttribute('stroke', burn ? '#ff8a80' : '#0e4a7d');
    const led = q('#vrLed'), glow = q('#vrLedG'), bt = q('#vrBoardT');
    if(burn){ led.setAttribute('fill', C.bad); led.setAttribute('stroke', '#ffb3aa'); glow.setAttribute('fill', C.bad); glow.setAttribute('opacity', .4); bt.textContent = 'سوخت! ✖'; bt.setAttribute('fill', C.bad); }
    else if(m.vout === 0){ led.setAttribute('fill', '#3a2a2a'); led.setAttribute('stroke', '#6b4a4a'); glow.setAttribute('opacity', 0); bt.textContent = 'خاموش'; bt.setAttribute('fill', '#cfc8b6'); }
    else if(low){ led.setAttribute('fill', C.on); led.setAttribute('stroke', '#ffe39a'); glow.setAttribute('fill', C.on); glow.setAttribute('opacity', .15); bt.textContent = 'ولتاژ کم'; bt.setAttribute('fill', C.on); }
    else { led.setAttribute('fill', '#ffd25a'); led.setAttribute('stroke', '#fff2b8'); glow.setAttribute('fill', C.ok); glow.setAttribute('opacity', .45); bt.textContent = 'روشن ✓'; bt.setAttribute('fill', C.ok); }

    q('#vrDirect').className = 'sim-btn ' + (reg ? 'sim-btn-ghost' : 'sim-btn-run');
    // «بدون رگولاتور» حالت خطرناک است: وقتی انتخاب شده قرمز نشان داده شود، نه سبز
    const dBtn = q('#vrDirect').style;
    dBtn.backgroundImage = reg ? '' : 'none';
    dBtn.background = reg ? '' : '#d9382b';
    dBtn.color = reg ? '' : '#fff';
    dBtn.borderColor = reg ? '' : '#d9382b';
    dBtn.boxShadow = reg ? '' : '0 0 12px rgba(217,56,43,.45)';
    q('#vrUse').className = 'sim-btn ' + (reg ? 'sim-btn-run' : 'sim-btn-ghost');

    if(!reg){
      if(burn) say('error', `💥 ${f(vin)} ولتِ باتری مستقیم به برد ۵ ولتی رسید و برد سوخت. دکمه‌ی «با رگولاتور ۷۸۰۵» را بزن.`);
      else if(low) say('idle', `ولتاژ ${f(vin)} ولت برای برد کم است و درست روشن نمی‌شود.`);
      else say('idle', 'این بازه‌ی باریکِ ۴٫۵ تا ۵٫۵ ولت امن است؛ ولی باتری‌ها با مصرف ولتاژشان پایین می‌آید. ولتاژ را بالا ببر و ببین چه می‌شود.');
    } else if(m.shut){
      say('error', `🔥 رگولاتور به ${fa(Math.round(m.t))} درجه رسید و محافظ حرارتی خروجی را قطع کرد. اختلاف ولتاژ × جریان = ${f(m.p, 2)} وات گرما. ورودی یا جریان را کم کن.`);
    } else if(vin < VOUT + DROP){
      say('idle', `⚠️ ورودی ${f(vin)} ولت است و ۷۸۰۵ دست‌کم ۷ ولت می‌خواهد (حدود ۲ ولت افت)؛ خروجی فقط ${f(m.vout)} ولت شد.`);
    } else if(m.t > T_SAFE){
      say('idle', `خروجی ۵ ولت است ولی رگولاتور ${fa(Math.round(m.t))} درجه داغ شده؛ این سلامت نیست. ورودی یا جریان را کم کن.`);
    } else {
      say('success', `✅ خروجی ثابت ۵ ولت است و دمای رگولاتور ${fa(Math.round(m.t))} درجه؛ ورودی را عوض کن، خروجی همان می‌ماند.`);
    }

    if(reg && !succeeded){
      succeeded = true;
      const l = q('#vrLesson'); l.style.display = '';
      l.innerHTML = '💡 <b>یاد گرفتی:</b> رگولاتور خطی ولتاژ اضافه را به گرما تبدیل می‌کند، پس هرچه ورودی به خروجی نزدیک‌تر باشد (ولی دست‌کم ۲ ولت بالاتر) گرمای کمتری دارد. برای ۳٫۳ ولتِ STM32 از رگولاتوری مثل AMS1117-3.3 استفاده می‌کنند. وقتی اختلاف ولتاژ یا جریان زیاد است، رگولاتور سوئیچینگ (Buck) بهتر است.';
      knight('آفرین! رگولاتور ولتاژِ ثابت می‌دهد، به شرطی که نه خیلی پایین باشی نه خیلی داغ.');
      onSuccess && onSuccess();
    }
  }
  q('#vrVinR').addEventListener('input', e => { vin = +e.target.value; paint(); });
  q('#vrIR').addEventListener('input', e => { load = +e.target.value; paint(); });
  q('#vrDirect').addEventListener('click', () => { reg = false; paint(); });
  q('#vrUse').addEventListener('click', () => { reg = true; paint(); });
  paint();
  return { stop(){} };
}

/* ================= ELECTRONICS: شیفت رجیستر (74HC595) =================
   سه مرحله‌ی تعاملی روی یک SVG:
   ۱) CLOCK: بیت‌ها با هر پالس یک خانه جلو می‌روند (انیمیشن + نمودار زمانی)
   ۲) LATCH: ردیف شیفت جدا از ردیف خروجی (لچ) است؛ LEDها فقط با LATCH عوض می‌شوند
   ۳) چالش: ساختن الگوی هدف (با راهنما، تشخیص خطای رایج، و کد shiftOut معادل) */
function mountShiftRegisterSim(container, { onSuccess, alreadyDone } = {}){
  const N = 8, SH_Y = 62, LA_Y = 106;
  const cx = i => 38 + 35 * i;
  const C = { on:'#f5b942', off:'#0f1724', line:'#3b4a60', dim:'#667', clk:'#3b82f6', latch:'#8b5cf6', ok:'#57d8a3', bad:'#ff6b5a' };
  const fa = n => (typeof toFa === 'function' ? toFa(n) : String(n));
  const sum = a => a.reduce((s, v) => s + v, 0);
  const same = (a, b) => a.every((v, i) => v === b[i]);
  const knight = t => { try { if(typeof showKnightLine === 'function') showKnightLine(t, 'happy', 'knight'); } catch(e){} };
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const DUR_CLK = reduce ? 0 : 330, DUR_LATCH = reduce ? 0 : 420;
  let TARGET = [1, 0, 1, 1, 0, 0, 1, 0];

  const STAGES = [
    { tab:'۱ · CLOCK',
      goal:'🚂 <b>مرحله ۱ — CLOCK (قطار بیت‌ها):</b> تراشه هشت خانه دارد. با هر پالس <b>CLOCK</b>، بیتِ روی سیم <b>DATA</b> از چپ (Q0) وارد می‌شود و بقیه یک خانه به راست می‌روند. <b>هدف:</b> DATA را ۱ کن و یک بار CLOCK بزن تا بیتِ ۱ وارد شود؛ هر بار CLOCK بزنی آن ۱ یک خانه جلوتر می‌رود. ردیف پایین (لچ) فعلاً کاری نمی‌کند.',
      start:'DATA را ۱ کن و CLOCK بزن؛ ببین بیت یک خانه وارد می‌شود. بعد دوباره CLOCK بزن تا جلوتر برود.',
      lesson:'💡 <b>یاد گرفتی:</b> بیت‌ها فقط با پالس CLOCK حرکت می‌کنند و DATA درست در لحظه‌ی بالا رفتن CLOCK خوانده می‌شود (نقطه‌ی زرد در نمودار زمانی). ۸ پالس = ۸ بیت؛ اولین بیت به Q7 می‌رسد و پالس نهم آن را از انتها بیرون می‌اندازد (در مدار واقعی به تراشه‌ی بعدی می‌رود، یعنی می‌شود چند تراشه را زنجیر کرد).' },
    { tab:'۲ · LATCH',
      goal:'📌 <b>مرحله ۲ — LATCH (ویترین):</b> داخل تراشه دو ردیف هست. ردیف بالا (شیفت) با هر CLOCK عوض می‌شود، ولی LEDها به ردیف پایین (لچ) وصل‌اند که فقط با پالس <b>LATCH</b> از ردیف بالا کپی می‌گیرد. <b>هدف:</b> چند بیتِ ۱ داخل رجیستر بفرست، ببین LEDها تکان نمی‌خورند، بعد LATCH بزن.',
      start:'چند بار با DATA = ۱ و CLOCK بیت بفرست. به LEDها نگاه کن: هنوز خاموش‌اند. بعد LATCH بزن.',
      lesson:'💡 <b>یاد گرفتی:</b> بدون لچ، LEDها وسط شیفت‌کردن هر بار یک الگوی نیمه‌کاره نشان می‌دادند و چشمک می‌زدند. لچ می‌گذارد اول هر ۸ بیت را کامل جمع کنی و بعد یک‌جا نشانشان بدهی. امتحان کن: چند CLOCK دیگر بزن؛ ردیف بالا عوض می‌شود ولی LEDها نه، تا LATCH بعدی.' },
    { tab:'۳ · چالش',
      goal:'🎯 <b>مرحله ۳ — چالش:</b> LEDها را مثل نقطه‌های «هدف» (زیر LEDها) روشن کن. فکر کن: اولین بیتی که می‌فرستی در آخر کار به کدام خانه می‌رسد؟ اگر گیر کردی دکمه‌ی «راهنما» ترتیب ارسال را نشان می‌دهد.',
      start:'۸ بیت بفرست (DATA + CLOCK)، بعد LATCH بزن. نقطه‌های هدف سبز می‌شوند اگر درست باشند.',
      lesson:'' }
  ];
  const KNIGHT = ['آفرین! با هر کلاک بیت‌ها یک قدم جلو می‌روند.', 'درسته! لچ یعنی «همه را یک‌جا نشان بده».', 'استادِ شیفت رجیستر شدی! ۸ خروجی فقط با ۳ پین!'];

  const tickCells = Array.from({ length: N }, (_, i) => `
    <line data-w="clk" x1="${cx(i)}" y1="38" x2="${cx(i)}" y2="47" stroke="${C.dim}" stroke-width="1.8"/>
    <rect x="${cx(i) - 13}" y="${SH_Y}" width="26" height="24" rx="4" fill="${C.off}" stroke="${C.line}"/>
    ${i < N - 1 ? `<text x="${cx(i) + 17.5}" y="78" font-size="11" fill="#5a6b82" text-anchor="middle">›</text>` : ''}`).join('');
  const ghostsSvg = Array.from({ length: N + 1 }, () => `<g class="srG" opacity="0"><rect x="-11" y="-10" width="22" height="20" rx="3"/><text y="5" font-size="13" font-weight="bold" text-anchor="middle">0</text></g>`).join('');
  const lowerSvg = Array.from({ length: N }, (_, i) => `
    <line x1="${cx(i)}" y1="86" x2="${cx(i)}" y2="106" stroke="${C.line}" stroke-width="1.2" stroke-dasharray="2 2"/>
    <rect class="srLCell" x="${cx(i) - 13}" y="${LA_Y}" width="26" height="24" rx="4" stroke="${C.line}"/>
    <text class="srLBit" x="${cx(i)}" y="${LA_Y + 17}" font-size="13" font-weight="bold" text-anchor="middle">0</text>
    <line x1="${cx(i) + 6}" y1="130" x2="${cx(i) + 6}" y2="150" stroke="${C.line}" stroke-width="1.5"/>
    <text x="${cx(i) + 11}" y="150" font-size="7" fill="#7d8da3">Q${i}</text>
    <g class="srLedG" transform="translate(${cx(i)} 188.4) rotate(90) scale(.6)">${ledRealSvg('sr')}</g>
    <circle class="srDrop" cx="${cx(i)}" cy="86" r="3.5" fill="${C.latch}" opacity="0"/>`).join('');
  const targetSvg = Array.from({ length: N }, (_, i) => `<circle class="srTg" cx="${cx(i)}" cy="210" r="5.5" stroke-width="1.8"/>`).join('');


  const QY = i => 112 + 30 * i, QPIN = [15, 1, 2, 3, 4, 5, 6, 7];
  const unoSvg = (() => {
    const S = 0.045, UL = 4, UT = 0, r2 = v => +v.toFixed(2);
    const sock = (x0, n, y) => `<rect x="${x0 - 50}" y="${y - 65}" width="${n * 100}" height="130" rx="12" fill="#171a1f" stroke="#000" stroke-width="10"/>` + Array.from({ length: n }, (_, k) => `<rect x="${x0 + 100 * k - 26}" y="${y - 26}" width="52" height="52" fill="#4b525c"/>`).join('');
    const logo = (cx, cy) => `<g fill="none" stroke="#f4fbfb" stroke-linecap="round"><circle cx="${cx - 105}" cy="${cy}" r="92" stroke-width="30"/><circle cx="${cx + 105}" cy="${cy}" r="92" stroke-width="30"/><path d="M${cx - 150} ${cy}h90M${cx + 60} ${cy}h90M${cx + 105} ${cy - 45}v90" stroke-width="22"/></g>`;
    return `<g transform="translate(${r2(UL + 2700 * S)} ${r2(UT + 2100 * S)}) rotate(180) scale(${S})">
      <rect width="2700" height="2100" rx="70" fill="#1a6fb5" stroke="#0e4a7d" stroke-width="30"/>
      <g fill="#b9c0c8">${Array.from({ length: 14 }, (_, k) => `<rect x="${1069 + 93 * k}" y="1160" width="42" height="80"/><rect x="${1069 + 93 * k}" y="1540" width="42" height="80"/>`).join('')}</g>
      <rect x="1050" y="1230" width="1350" height="320" rx="24" fill="#16181d"/>
      <path d="M1050 1335a55 55 0 0 1 0 110z" fill="#2c3037"/>
      <rect x="640" y="235" width="220" height="220" rx="24" fill="#b7bec6" stroke="#6d757e" stroke-width="18"/><circle cx="750" cy="345" r="72" fill="#c93030"/>
      ${sock(1900, 8, 100)}${sock(800, 10, 100)}${sock(1000, 8, 2000)}${sock(1900, 6, 2000)}
      <rect x="-270" y="180" width="690" height="480" rx="30" fill="#c9d0d7" stroke="#8b949e" stroke-width="22"/>
      <rect x="-80" y="1300" width="640" height="440" rx="36" fill="#1b1d22"/>
      ${logo(1700, 620)}
      <text transform="translate(1700 1000) rotate(180)" font-size="${r2(11 / S)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="#f4fbfb">UNO</text>
      ${[[1300, C.clk], [1400, C.on], [1700, C.latch]].map(([x, c]) => `<rect x="${x - 26}" y="74" width="52" height="52" fill="${c}"/>`).join('')}
    </g>`;
  })();
  const circuitSvg = (() => {
    const w = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const gnd = (x, y) => `<path d="M${x - 8} ${y} H${x + 8} M${x - 5} ${y + 4} H${x + 5} M${x - 2} ${y + 8} H${x + 2}" stroke="#9aa7b8" stroke-width="1.4" stroke-linecap="round"/>`;
    const CX0 = 200, CX1 = 296, TOP = 92, bot = QY(7) + 22, RAIL = 382, LS = 0.3;
    let g = unoSvg;
    [[67, 112, 'D12 · CLOCK', C.clk], [62.5, 142, 'D11 · DATA', C.on], [49, 172, 'D8 · LATCH', C.latch]].forEach(([x0, y1, nm, col]) => {
      g += w(`M${x0} 90 V${y1} H${CX0}`, col) + `<text x="${(x0 + CX0) / 2 + 10}" y="${y1 - 4}" font-size="7.5" fill="${col}" text-anchor="middle">${nm}</text>`;
    });
    g += `<rect x="${CX0}" y="${TOP}" width="${CX1 - CX0}" height="${bot - TOP}" rx="7" fill="#1b2330" stroke="${C.dim}" stroke-width="1.4"/>`;
    g += `<text x="${(CX0 + CX1) / 2}" y="${bot - 8}" font-size="11" font-weight="bold" fill="#cfe3ff" text-anchor="middle">74HC595</text>`;
    [[112, 'SRCLK', 11, C.clk], [142, 'SER', 14, C.on], [172, 'RCLK', 12, C.latch], [212, 'OE', 13, '#9aa7b8'], [240, 'SRCLR', 10, '#9aa7b8']].forEach(([y, nm, pn, col]) => {
      g += `<text x="${CX0 + 4}" y="${y + 3}" font-size="7.5" fill="${col}">${fa(pn)} ${nm}</text>`;
    });
    g += w(`M${CX0} 212 H178 V220`, '#6b7a90') + gnd(178, 220) + `<text x="172" y="215" font-size="7" fill="#9aa7b8" text-anchor="end">GND</text>`;
    g += w(`M${CX0} 240 H178`, C.bad) + `<text x="172" y="243" font-size="7" fill="${C.bad}" text-anchor="end">5V</text>`;
    const mx = (CX0 + CX1) / 2;
    g += w(`M${mx} ${TOP} V72`, C.bad) + `<text x="${mx + 6}" y="75" font-size="7.5" fill="${C.bad}">VCC ${fa(16)} → 5V</text>`;
    g += w(`M${mx} ${bot} V${bot + 10}`, '#6b7a90') + gnd(mx, bot + 10) + `<text x="${mx + 12}" y="${bot + 16}" font-size="7.5" fill="#9aa7b8">GND ${fa(8)}</text>`;
    for(let i = 0; i < N; i++){
      const y = QY(i), xA = 350, xL = xA + 10 * LS, yL = y - 64 * LS;
      g += `<text x="${CX1 - 4}" y="${y - 3}" font-size="7" fill="#9aa7b8" text-anchor="end">Q${i} · ${fa(QPIN[i])}</text>`;
      g += `<g class="scW">${w(`M${CX1} ${y} H314`, C.line)}</g><rect x="314" y="${y - 5}" width="28" height="10" rx="2" fill="#2a3547" stroke="${C.dim}"/><text x="328" y="${y + 3}" font-size="6.5" fill="#cfe3ff" text-anchor="middle">220Ω</text>`;
      g += `<g class="scW">${w(`M342 ${y} H${xA}`, C.line)}</g>`;
      g += `<g class="scLed" transform="translate(${xL} ${yL}) rotate(-90) scale(${LS})">${ledRealSvg('sc')}</g>`;
      g += `<g class="scW">${w(`M${xL + 10 * LS} ${yL + 44 * LS} H${RAIL}`, C.line)}</g>`;
    }
    g += `<g class="scW">${w(`M${RAIL} ${QY(0) - 6} V${QY(7) + 10}`, C.line)}</g>` + gnd(RAIL, QY(7) + 10) + `<text x="${RAIL}" y="${QY(7) + 30}" font-size="7" fill="#9aa7b8" text-anchor="middle">GND</text>`;
    return g;
  })();
  const introHtml = `
      <div class="sim-hw-note" id="srIntro">
        <b>🔢 این قطعه چیکار می‌کند؟</b><br>
        ۷۴HC595 یک «تبدیل‌کننده‌ی سریال به موازی» است: بیت‌ها را یکی‌یکی از <b>یک سیم</b> می‌گیرد و همه را هم‌زمان روی <b>۸ خروجی</b> می‌گذارد. یعنی وقتی پین‌های آردوینو تمام شد، با فقط ۳ پین (DATA، CLOCK، LATCH) ۸ خروجی تازه می‌گیری؛ اگر چند تراشه را پشت هم بزنی (کاسکید) ۱۶ و ۲۴ و … خروجی.<br>
        <b>کاربردها:</b> نوار LED و چراغ‌های چشمک‌زن · نمایشگر هفت‌قسمتی · ماتریس LED · کنترل چند رله یا موتورِ کوچک · ردیف‌های کیبورد. هر جا خروجی زیاد لازم باشد و پین کم.
      </div>
      <svg class="ls-svg" viewBox="0 0 400 372" style="cursor:default;display:block;width:100%;max-width:400px;height:auto;margin:8px auto" direction="ltr" role="img" aria-label="مدار: آردوینو با سه سیم به ۷۴HC595 وصل است و هر خروجی از راه مقاومت ۲۲۰ اهم یک LED را روشن می‌کند"><defs>${ledRealDefs('sc')}</defs>${circuitSvg}</svg>
      <button type="button" class="sim-btn sim-btn-ghost" id="scSig" aria-pressed="false" style="display:block;width:100%;max-width:400px;margin:0 auto 8px"></button>
      <div class="sim-hw-note" style="font-size:12.5px">
        <b>سیم‌کشی:</b>
        <div dir="ltr" style="display:grid;gap:6px;margin:8px 0">${[
          ['D11', 'pin 14 · SER', 'DATA', C.on], ['D12', 'pin 11 · SRCLK', 'CLOCK', C.clk], ['D8', 'pin 12 · RCLK', 'LATCH', C.latch],
          ['5V', 'pin 16 · VCC', 'تغذیه', C.bad], ['GND', 'pin 8 · GND', 'زمین', '#9aa7b8'], ['GND', 'pin 13 · OE', 'فعال‌ساز خروجی', '#9aa7b8'], ['5V', 'pin 10 · SRCLR', 'بدون پاک‌شدن', C.bad]
        ].map(([a, b, n, col]) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;background:#141b27;border-left:4px solid ${col};font:700 13.5px/1.4 'JetBrains Mono',monospace"><span style="color:${col};min-width:40px">${a}</span><span style="color:#6f7f96">→</span><span style="color:#e9edf5">${b}</span><span dir="rtl" style="margin-left:auto;color:${col};font:700 12.5px/1.4 inherit">${n}</span></div>`).join('')}</div>
        پایه‌ی OE را به GND می‌بندیم تا خروجی‌ها فعال باشند و SRCLR را به 5V تا رجیستر پاک نشود. هر LED یک مقاومت ۲۲۰Ω دارد تا نسوزد. حالا خودت امتحان کن 👇
      </div>`;
  container.innerHTML = `
    <div class="sim-wrap">
      ${introHtml}
      <div id="srTabs" style="display:flex;gap:6px;max-width:360px;margin:0 auto 8px"></div>
      <div class="sim-hw-note" id="srGoal"></div>
      <svg class="ls-svg" viewBox="0 0 320 296" style="cursor:default;display:block;width:100%;max-width:360px;height:auto;margin:0 auto" direction="ltr" role="img" aria-label="شیفت رجیستر ۷۴HC595: ردیف شیفت، ردیف لچ، هشت LED و نمودار زمانی">
        <defs>${ledRealDefs('sr')}</defs>
        <rect x="4" y="2" width="312" height="20" rx="5" fill="#1a6fb5" stroke="#0e4a7d"/>
        <g fill="#171a1f" stroke="#000"><rect x="4" y="14" width="12" height="8"/><rect x="154" y="14" width="12" height="8"/><rect x="304" y="14" width="12" height="8"/></g>
        <g fill="#4b525c"><rect x="8" y="16" width="4" height="4"/><rect x="158" y="16" width="4" height="4"/><rect x="308" y="16" width="4" height="4"/></g>
        <text x="100" y="12" font-size="9" font-weight="bold" fill="#f4fbfb" text-anchor="middle">ARDUINO UNO</text>
        <text x="20" y="12" font-size="7.5" font-weight="bold" fill="#ffe08a">D11 · DATA</text>
        <text x="172" y="12" font-size="7.5" font-weight="bold" fill="#bcd6ff">D12 · CLOCK</text>
        <text x="300" y="12" font-size="7.5" font-weight="bold" fill="#d9c7ff" text-anchor="end">D8 · LATCH</text>
        <rect x="14" y="30" width="290" height="118" rx="8" fill="#1b2330" stroke="${C.line}"/>
        <text x="298" y="143" font-size="8" fill="#5a6b82" text-anchor="end">74HC595</text>
        <g fill="none" stroke-linecap="round">
          <path data-w="data" d="M10 22 V74 H25" stroke="${C.dim}"/>
          <path data-w="clk" d="M160 22 V38" stroke="${C.dim}"/>
          <path data-w="clk" d="M${cx(0)} 38 H${cx(N - 1)}" stroke="${C.dim}"/>
          <path data-w="latch" d="M310 22 V96 H298" stroke="${C.dim}"/>
        </g>
        <text x="22" y="58" font-size="7.5" fill="#9aa7b8">ردیف شیفت (بیت‌ها با CLOCK قدم می‌زنند)</text>
        ${tickCells}
        <g id="srLower">
          ${lowerSvg}
          <rect id="srGate" x="20" y="93" width="278" height="6" rx="3" fill="#2a3547"/>
          <text x="22" y="141" font-size="7.5" fill="#9aa7b8">ردیف لچ (فقط با LATCH از ردیف شیفت کپی می‌گیرد)</text>
        </g>
        <g id="srTarget"><text x="4" y="213" font-size="8" fill="#9aa7b8">هدف</text>${targetSvg}</g>
        ${ghostsSvg}
        <g id="srTime"><text x="6" y="232" font-size="7.5" fill="#9aa7b8">نمودار زمانی (۸ رویداد آخر) — ● یعنی DATA در این لحظه خوانده شد</text>
          <text x="6" y="251" font-size="7" fill="${C.on}">DATA</text><text x="6" y="269" font-size="7" fill="${C.clk}">CLOCK</text><text x="6" y="287" font-size="7" fill="${C.latch}">LATCH</text>
          <g id="srTimeDyn"></g></g>
      </svg>
      <div style="display:flex;gap:6px;max-width:360px;margin:8px auto 0">
        <button type="button" class="sim-btn" id="srD0" dir="ltr">DATA = 0</button>
        <button type="button" class="sim-btn" id="srD1" dir="ltr">DATA = 1</button>
      </div>
      <div style="display:flex;gap:6px;max-width:360px;margin:6px auto 0">
        <button type="button" class="sim-btn" id="srClk">⏩ CLOCK</button>
        <button type="button" class="sim-btn" id="srLatch">📌 LATCH</button>
      </div>
      <div style="display:flex;gap:6px;max-width:360px;margin:6px auto 0">
        <button type="button" class="sim-btn sim-btn-ghost" id="srReset">↺ پاک‌کردن</button>
        <button type="button" class="sim-btn sim-btn-ghost" id="srHint">💡 راهنما</button>
        <button type="button" class="sim-btn sim-btn-ghost" id="srNew">🎲 الگوی تازه</button>
      </div>
      <div id="srSeq" style="display:none;max-width:360px;margin:8px auto 0;font-size:12px"></div>
      <div class="sim-status" id="srStatus" data-state="idle" aria-live="polite"></div>
      <div class="sim-hw-note" id="srLesson" style="display:none"></div>
      <button type="button" class="complete-btn" id="srNext" style="display:none">مرحله‌ی بعد ←</button>
      <pre id="srCode" style="display:none;direction:ltr;text-align:left;font-size:11px;background:#0f1724;color:#cfe3ff;padding:8px 10px;border-radius:8px;overflow:auto;max-width:360px;margin:8px auto 0"></pre>
    </div>`;

  const q = s => container.querySelector(s), qa = s => Array.from(container.querySelectorAll(s));
  const sigBtn = q('#scSig');
  let sigOn = false;
  const sigPaint = () => {
    qa('.scLed').forEach(g => ledRealSet(g, sigOn ? 1 : 0));
    qa('.scW path').forEach(pth => pth.setAttribute('stroke', sigOn ? '#ffd25a' : C.line));
    sigBtn.setAttribute('aria-pressed', sigOn);
    sigBtn.textContent = sigOn ? '⚡ سیگنال: روشن — بزن تا خاموش شود' : '⚡ سیگنال: خاموش — بزن تا LEDها روشن شوند';
    sigBtn.className = 'sim-btn ' + (sigOn ? 'sim-btn-run' : 'sim-btn-ghost');
  };
  sigBtn.addEventListener('click', () => { sigOn = !sigOn; sigPaint(); });
  sigPaint();
  const st = q('#srStatus'), d0Btn = q('#srD0'), d1Btn = q('#srD1'), clkBtn = q('#srClk'), latchBtn = q('#srLatch');
  const ghosts = qa('.srG'), wires = qa('[data-w]'), gate = q('#srGate');
  const BTN = 'flex:1;white-space:nowrap;padding:8px 6px;font-size:13px;min-height:0;border-radius:10px;border:0;color:#fff;font-weight:bold';
  d0Btn.style.cssText = BTN; d1Btn.style.cssText = BTN; clkBtn.style.cssText = BTN + ';background:' + C.clk; latchBtn.style.cssText = BTN + ';background:' + C.latch;
  ['srReset', 'srHint', 'srNew'].forEach(id => { q('#' + id).style.cssText = 'flex:1;padding:6px;font-size:12px;min-height:0;border-radius:10px'; });
  const say = (state, text) => { st.dataset.state = state; st.textContent = text; };

  let reg = Array(N).fill(0), out = Array(N).fill(0), prevReg = reg.slice(), data = 0;
  let stage = alreadyDone ? 2 : 0, unlocked = alreadyDone ? 2 : 0;
  const done = [!!alreadyDone, !!alreadyDone, !!alreadyDone];
  let succeeded = !!alreadyDone, events = [], sent = 0, hintOn = false, checked = false;
  let clkAnim = null, latchAnim = null, raf = 0;

  /* ---------- انیمیشن ---------- */
  function setGhost(g, x, v, op){
    g.setAttribute('transform', `translate(${x.toFixed(1)} 74)`); g.setAttribute('opacity', op.toFixed(2));
    const r = g.firstElementChild, t = g.lastElementChild;
    r.setAttribute('fill', v ? C.on : '#16202e'); r.setAttribute('stroke', v ? '#ffe39a' : '#2d3b50');
    t.textContent = v; t.setAttribute('fill', v ? '#1b1b1b' : '#6f8097');
  }
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  function renderBits(){
    if(clkAnim){
      const e = ease(Math.min(1, (performance.now() - clkAnim.t0) / Math.max(1, DUR_CLK)));
      for(let i = 0; i < N; i++) setGhost(ghosts[i], cx(i) + 35 * e, prevReg[i], i === N - 1 ? 1 - e : 1);
      setGhost(ghosts[N], cx(0) - 35 + 35 * e, reg[0], e);
    } else {
      for(let i = 0; i < N; i++) setGhost(ghosts[i], cx(i), reg[i], 1);
      ghosts[N].setAttribute('opacity', '0');
    }
  }
  function renderLatch(){
    const drops = qa('.srDrop');
    if(latchAnim){
      const e = ease(Math.min(1, (performance.now() - latchAnim.t0) / Math.max(1, DUR_LATCH)));
      drops.forEach((d, i) => { d.setAttribute('cy', (86 + 20 * e).toFixed(1)); d.setAttribute('opacity', latchAnim.snap[i] ? (1 - e * .4).toFixed(2) : 0); });
    } else drops.forEach(d => d.setAttribute('opacity', 0));
  }
  function paintWires(){
    wires.forEach(w => {
      const k = w.dataset.w, hot = (k === 'clk' && clkAnim) || (k === 'latch' && latchAnim);
      w.setAttribute('stroke', k === 'clk' ? (clkAnim ? C.clk : C.dim) : k === 'latch' ? (latchAnim ? C.latch : C.dim) : (data ? C.on : C.dim));
      w.setAttribute('stroke-width', hot ? 2.6 : 1.8);
    });
    gate.setAttribute('fill', latchAnim ? C.latch : '#2a3547');
  }
  function tick(){
    raf = 0;
    const now = performance.now();
    if(clkAnim && now - clkAnim.t0 >= DUR_CLK) clkAnim = null;
    if(latchAnim && now - latchAnim.t0 >= DUR_LATCH){ out = latchAnim.snap; latchAnim = null; refresh(); return; }
    renderBits(); renderLatch(); paintWires();
    if(clkAnim || latchAnim) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if(!raf) raf = requestAnimationFrame(tick); };
  function flush(){ clkAnim = null; if(latchAnim){ out = latchAnim.snap; latchAnim = null; } }

  /* ---------- نمودار زمانی ---------- */
  function renderTime(){
    const X0 = 52, W = 32, yD = 248, yC = 266, yL = 284, A = 5, n = events.length;
    const yv = (c, lv) => lv ? c - A : c + A;
    let dp = [], cp = [], lp = [], marks = '';
    for(let k = 0; k < 8; k++){
      const x0 = X0 + W * k, e = events[k];
      const lv = e ? e.d : data;
      dp.push(`${x0} ${yv(yD, lv)}`, `${x0 + W} ${yv(yD, lv)}`);
      const pulse = (arr, c, on) => on
        ? arr.push(`${x0} ${c + A}`, `${x0 + 8} ${c + A}`, `${x0 + 8} ${c - A}`, `${x0 + 22} ${c - A}`, `${x0 + 22} ${c + A}`, `${x0 + W} ${c + A}`)
        : arr.push(`${x0} ${c + A}`, `${x0 + W} ${c + A}`);
      pulse(cp, yC, e && e.t === 'c'); pulse(lp, yL, e && e.t === 'l');
      marks += `<line x1="${x0}" y1="238" x2="${x0}" y2="292" stroke="#fff" stroke-opacity=".06"/>`;
      if(e && e.t === 'c') marks += `<line x1="${x0 + 8}" y1="${yC}" x2="${x0 + 8}" y2="${yv(yD, e.d)}" stroke="#8fa0b5" stroke-dasharray="2 2" opacity=".7"/><circle cx="${x0 + 8}" cy="${yv(yD, e.d)}" r="2.6" fill="${C.on}"/>`;
    }
    const hl = n ? `<rect x="${X0 + W * (n - 1)}" y="238" width="${W}" height="54" fill="#fff" fill-opacity=".05"/>` : '';
    const path = (a, col) => `<path d="M${a.join(' L')}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>`;
    q('#srTimeDyn').innerHTML = hl + marks + path(dp, C.on) + path(cp, C.clk) + path(lp, C.latch);
  }

  /* ---------- رندر کلی ---------- */
  function refresh(){
    const target = stage === 2;
    qa('.srLCell').forEach((c, i) => c.setAttribute('fill', out[i] ? C.on : C.off));
    qa('.srLBit').forEach((t, i) => { t.textContent = out[i]; t.setAttribute('fill', out[i] ? '#1b1b1b' : '#8fa0b5'); });
    qa('.srLedG').forEach((g, i) => ledRealSet(g, out[i] ? 1 : 0));
    qa('.srTg').forEach((c, i) => {
      c.setAttribute('fill', TARGET[i] ? '#ffd25a' : '#2b3646');
      c.setAttribute('stroke', checked ? (out[i] === TARGET[i] ? C.ok : C.bad) : C.line);
    });
    q('#srTarget').style.display = target ? '' : 'none';
    q('#srLower').setAttribute('opacity', stage === 0 ? .25 : 1);
    latchBtn.style.display = stage === 0 ? 'none' : '';
    [[d0Btn, 0], [d1Btn, 1]].forEach(([b, v]) => {
      const on = data === v;
      b.style.background = on ? C.on : '#2a3547'; b.style.color = on ? '#1b1b1b' : '#9aa7b8';
      b.style.outline = on ? '2px solid #ffe39a' : 'none'; b.setAttribute('aria-pressed', on);
    });
    q('#srGoal').innerHTML = STAGES[stage].goal;
    q('#srHint').style.display = target ? '' : 'none';
    q('#srNew').style.display = target && done[2] ? '' : 'none';
    q('#srTabs').innerHTML = STAGES.map((s, i) => `<button type="button" class="sim-btn" data-tab="${i}" ${i > unlocked ? 'disabled' : ''} style="flex:1;padding:6px 4px;font-size:12px;min-height:0;border-radius:10px;border:1px solid ${i === stage ? '#6aa8ff' : C.line};background:${i === stage ? '#24406b' : '#1b2330'};color:#cfd7e3;opacity:${i > unlocked ? .5 : 1}">${done[i] ? '✓ ' : i > unlocked ? '🔒 ' : ''}${s.tab}</button>`).join('');
    const seqBox = q('#srSeq');
    if(target && hintOn){
      const seq = TARGET.slice().reverse();
      seqBox.style.display = '';
      seqBox.innerHTML = '<div style="margin-bottom:4px;color:#9aa7b8">ترتیب ارسال (اول Q7، آخر Q0):</div><div style="display:flex;gap:4px;direction:ltr">' + seq.map((b, k) => `<span style="flex:1;text-align:center;padding:4px 0;border-radius:6px;font-weight:bold;border:1px solid ${k === sent ? '#6aa8ff' : C.line};background:${k === sent ? '#24406b' : '#16202e'};color:${k < sent ? '#5a6b82' : '#fff'}">${fa(b)}</span>`).join('') + '</div>';
    } else seqBox.style.display = 'none';
    const les = q('#srLesson'), shown = done[stage] && STAGES[stage].lesson;
    les.style.display = shown ? '' : 'none'; if(shown) les.innerHTML = STAGES[stage].lesson;
    q('#srNext').style.display = done[stage] && stage < 2 ? '' : 'none';
    const code = q('#srCode');
    code.style.display = target && done[2] ? '' : 'none';
    code.textContent = `digitalWrite(latchPin, LOW);\nshiftOut(dataPin, clockPin, MSBFIRST, 0b${TARGET.slice().reverse().join('')});\n// MSBFIRST: the first bit sent ends up in Q7\ndigitalWrite(latchPin, HIGH);`;
    renderTime(); renderBits(); renderLatch(); paintWires();
  }

  function resetSim(){
    flush(); reg = Array(N).fill(0); out = Array(N).fill(0); prevReg = reg.slice();
    events = []; sent = 0; checked = false; refresh();
  }
  function goStage(i){
    if(i > unlocked) return;
    stage = i; hintOn = false; resetSim(); say('idle', STAGES[i].start);
  }
  function completeStage(i){
    const first = !done[i];
    done[i] = true; if(i < 2) unlocked = Math.max(unlocked, i + 1);
    if(first) knight(KNIGHT[i]);
    if(i === 2 && !succeeded){ succeeded = true; onSuccess && onSuccess(); }
    refresh();
  }

  /* ---------- رویدادها ---------- */
  d0Btn.addEventListener('click', () => { data = 0; refresh(); });
  d1Btn.addEventListener('click', () => { data = 1; refresh(); });
  clkBtn.addEventListener('click', () => {
    flush();
    prevReg = reg.slice();
    const fell = reg[N - 1];
    reg = [data, ...reg.slice(0, N - 1)]; sent++;
    events.push({ t:'c', d:data }); if(events.length > 8) events.shift();
    clkAnim = { t0: performance.now() }; kick(); refresh();
    let msg = `بیت ${fa(data)} وارد Q0 شد و بقیه یک خانه به راست رفتند.`;
    if(fell) msg += ' بیتِ ۱ که در Q7 بود از انتها بیرون افتاد (در مدار واقعی به تراشه‌ی بعدی می‌رود).';
    if(stage === 0){
      if(sum(reg) > 0){ say('success', '✅ دیدی؟ با هر CLOCK بیت‌ها یک خانه جلو می‌روند. هر چه بیشتر CLOCK بزنی، ۱ جلوتر می‌رود تا از انتها بیرون بیفتد.'); completeStage(0); return; }
      msg += ' همه‌ی خانه‌ها ۰ است؛ DATA را ۱ کن و دوباره CLOCK بزن.';
    } else if(!same(reg, out)) msg += ' ولی LEDها هنوز عوض نشده‌اند — برای نمایش باید LATCH بزنی.';
    say('idle', msg);
  });
  latchBtn.addEventListener('click', () => {
    flush();
    const snap = reg.slice(), before = sent;
    latchAnim = { t0: performance.now(), snap }; sent = 0;
    events.push({ t:'l', d:data }); if(events.length > 8) events.shift();
    kick(); refresh();
    if(stage === 1){
      if(!sum(snap)){ say('error', 'ردیف شیفت خالی بود (همه ۰)، پس LEDها همان خاموش ماندند. اول چند بیتِ ۱ بفرست.'); return; }
      say('success', '✅ با LATCH همه‌ی بیت‌ها یک‌جا از ردیف شیفت به LEDها کپی شدند!'); completeStage(1); return;
    }
    checked = true;
    if(same(snap, TARGET)){ say('success', '✅ LEDها دقیقاً مثل هدف شدند! ۸ بیت را فقط با ۳ سیم فرستادی. کد زیر همین کار را در یک خط انجام می‌دهد.'); completeStage(2); return; }
    let why;
    if(same(snap.slice().reverse(), TARGET)) why = 'الگو دقیقاً برعکس شده! اولین بیتی که می‌فرستی به Q7 می‌رسد نه Q0؛ پس باید از Q7 شروع کنی.';
    else if(before !== N) why = before < N ? `از آخرین LATCH فقط ${fa(before)} بار CLOCK زده‌ای؛ برای ۸ خانه ۸ بیت لازم است.` : `${fa(before)} بار CLOCK زده‌ای؛ فقط ۸ بیت آخر می‌مانند و قدیمی‌ترها از انتها بیرون می‌افتند.`;
    else why = 'خانه‌های ' + snap.map((v, i) => v !== TARGET[i] ? 'Q' + i : '').filter(Boolean).join('، ') + ' با هدف فرق دارند.';
    say('error', '⚠️ ' + why + ' «پاک‌کردن» را بزن و دوباره امتحان کن (یا «راهنما»).');
    refresh();
  });
  q('#srReset').addEventListener('click', () => { resetSim(); say('idle', 'رجیستر و LEDها پاک شدند. از اول شروع کن.'); });
  q('#srHint').addEventListener('click', () => { hintOn = !hintOn; refresh(); });
  q('#srNew').addEventListener('click', () => {
    let t;
    do { t = Array.from({ length: N }, () => Math.random() < .5 ? 1 : 0); }
    while(sum(t) < 2 || sum(t) > 6 || same(t, TARGET) || same(t.slice().reverse(), t));
    TARGET = t; resetSim(); say('idle', 'هدف تازه! ۸ بیت بفرست و LATCH بزن.');
  });
  q('#srNext').addEventListener('click', () => goStage(stage + 1));
  q('#srTabs').addEventListener('click', e => { const b = e.target.closest ? e.target.closest('button[data-tab]') : null; if(b && !b.disabled) goStage(Number(b.dataset.tab)); });

  refresh();
  say(alreadyDone ? 'success' : 'idle', alreadyDone ? '✅ قبلاً این مأموریت را انجام داده‌ای. دوست داری با «الگوی تازه» یا مراحل قبلی دوباره تمرین کنی؟' : STAGES[0].start);
  return { stop(){ if(raf) cancelAnimationFrame(raf); raf = 0; } };
}

function mountVoltCurrentSim(container, { onSuccess, alreadyDone } = {}){
  container.innerHTML = `
    <div class="sim-wrap">
      <div class="sim-board-wrap">
        <svg class="ef-svg" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg">
          <defs>${ledRealDefs('ef')}
            <linearGradient id="efFlapG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d2e0"/><stop offset="1" stop-color="#7d8aa0"/></linearGradient>
          </defs>
          <!-- سیم‌ها: غلاف تیره + رگِ رنگی + برق نازک؛ منفی خاکستری، مثبت قرمز -->
          <g fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M138,135 V52 Q138,40 150,40 H224 Q236,40 236,52 V140" stroke="#0b1018" stroke-width="7.5"/>
            <path id="efWNeg" d="M138,135 V52 Q138,40 150,40 H224 Q236,40 236,52 V140" stroke="#5d6678" stroke-width="4.5"/>
            <path d="M138,135 V52 Q138,40 150,40 H224 Q236,40 236,52 V140" stroke="#fff" stroke-opacity=".18" stroke-width="1.3" transform="translate(-1 -1)"/>
            <path d="M216,160 V248 Q216,260 204,260 H150 Q138,260 138,248 V165" stroke="#0b1018" stroke-width="7.5"/>
            <path id="efWPos" d="M216,160 V248 Q216,260 204,260 H150 Q138,260 138,248 V165" stroke="#b83b32" stroke-width="4.5"/>
            <path d="M216,160 V248 Q216,260 204,260 H150 Q138,260 138,248 V165" stroke="#fff" stroke-opacity=".18" stroke-width="1.3" transform="translate(-1 -1)"/>
          </g>
          ${batterySvg({ id: 'efBat', x: 50, y: 95, w: 50, h: 110, rot: 90 })}
          <text x="75" y="196" font-size="11" fill="#cfc8b6" text-anchor="middle">باتری ۵ ولت</text>

          <g transform="translate(187,40)">
            <rect x="-32" y="-16" width="64" height="32" rx="5" fill="#222b3b" stroke="#55627a" stroke-width="1.4"/>
            <rect x="-26" y="-13" width="52" height="26" rx="2" fill="#0a0f17"/>
            <rect id="efFlapTop" x="-26" y="-13" width="52" height="14" fill="url(#efFlapG)"/>
            <rect id="efFlapBottom" x="-26" y="-1" width="52" height="14" fill="url(#efFlapG)"/>
            <g fill="#8d99ab"><circle cx="-29" cy="-12.5" r="1.4"/><circle cx="29" cy="-12.5" r="1.4"/><circle cx="-29" cy="12.5" r="1.4"/><circle cx="29" cy="12.5" r="1.4"/></g>
          </g>
          <text x="187" y="70" font-size="10" fill="#cfc8b6" text-anchor="middle">مقاومت متغیر</text>

          <g id="efLedGroup" transform="translate(280 150) scale(1 -1)">${ledRealSvg('ef')}</g>
          <g fill="#c9ced8" stroke="#6d757e" stroke-width="1"><circle cx="236" cy="140" r="3"/><circle cx="216" cy="160" r="3"/></g>
          <text id="efBurstMark" x="292" y="150" text-anchor="middle" dominant-baseline="middle" class="ef-burn-mark" opacity="0">💥</text>

          <circle class="ef-electron-dot" r="6"/>
          <circle class="ef-electron-dot" r="6"/>
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
  const wireNeg   = container.querySelector('#efWNeg');
  const wirePos   = container.querySelector('#efWPos');

  // مسیرِ حرکتِ الکترون‌ها دقیقاً روی همان سیم‌های SVG: قطب منفی → بالا → شیر → پایه‌ی کاتد → درونِ LED → پایه‌ی آند → پایین → قطب مثبت.
  // گوشه‌هایی که r دارند مثل سیم‌ها گرد می‌شوند (شعاع ۱۲، همان Q‌های مسیرِ سیم).
  const LOOP = [
    {x:138,y:135}, {x:138,y:40,r:12}, {x:236,y:40,r:12}, {x:236,y:140},
    {x:266,y:140}, {x:266,y:160}, {x:216,y:160},
    {x:216,y:260,r:12}, {x:138,y:260,r:12}, {x:138,y:165}
  ];
  const pts = [LOOP[0]];
  for(let i = 1; i < LOOP.length - 1; i++){
    const a = LOOP[i-1], p = LOOP[i], b = LOOP[i+1], r = p.r || 0;
    if(!r){ pts.push(p); continue; }
    const la = Math.hypot(p.x-a.x, p.y-a.y), lb = Math.hypot(b.x-p.x, b.y-p.y);
    const e = { x: p.x + (a.x-p.x)/la*r, y: p.y + (a.y-p.y)/la*r };
    const o = { x: p.x + (b.x-p.x)/lb*r, y: p.y + (b.y-p.y)/lb*r };
    for(let k = 0; k <= 6; k++){
      const t = k/6, u = 1-t;
      pts.push({ x: u*u*e.x + 2*u*t*p.x + t*t*o.x, y: u*u*e.y + 2*u*t*p.y + t*t*o.y });
    }
  }
  pts.push(LOOP[LOOP.length - 1]);
  const cum = [0];
  for(let i = 1; i < pts.length; i++) cum.push(cum[i-1] + Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y));
  const totalLen = cum[cum.length - 1];
  function pointAt(t){
    const d = t*totalLen;
    let i = 1;
    while(i < cum.length - 1 && cum[i] < d) i++;
    const seg = cum[i]-cum[i-1], r = seg === 0 ? 0 : (d-cum[i-1])/seg;
    return { x: pts[i-1].x + (pts[i].x-pts[i-1].x)*r, y: pts[i-1].y + (pts[i].y-pts[i-1].y)*r };
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

    ledRealSet(ledGroup, 0);
    burstMark.setAttribute('opacity', '0');
    wireNeg.setAttribute('stroke', mA > 0 ? '#8a96ab' : '#5d6678');
    wirePos.setAttribute('stroke', mA > 0 ? '#ff6a55' : '#b83b32');
    range.style.setProperty('--knob-color', zoneColor(mA));

    if(mA <= 0){
      statusEl.dataset.state = 'idle';
      statusEl.textContent = '🔒 مسیر کاملاً بسته است — هیچ الکترونی نمی‌تواند رد شود.';
    } else if(mA < 2){
      statusEl.dataset.state = 'idle';
      statusEl.textContent = '🕯️ جریان خیلی کم است — کمی بیشتر باز کن تا LED روشن شود.';
    } else if(mA <= 20){
      ledRealSet(ledGroup, 0.35 + 0.65 * Math.min(1, (mA-2)/18));
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


