/* ========================================================================
   QUEST.JS — مسیر شوالیه‌ی مدار
   داده‌ی مأموریت‌ها (QUESTS)، موتور کانفتی، پیشرفت/XP، رسم مسیر و
   مودال جزئیات مأموریت. به common.js (SFX) نیاز دارد.
   ======================================================================== */

/* ================= حالت تست (فقط روی لوکال) =================
   صفحه را روی localhost / 127.0.0.1 / file:// با ‎?test=1‎ باز کن
   (مثلاً index.html?test=1) تا همه‌ی مأموریت‌ها، کارت‌ها و تبِ آزمایشگاه باز باشند.
   پیشرفتِ ذخیره‌شده دست نمی‌خورد، و روی سایتِ اصلی (دامنه‌ی واقعی) هیچ اثری ندارد. */
const TEST_MODE = (() => {
  try{
    const h = location.hostname;
    const isLocal = location.protocol === 'file:' || h === '' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    return isLocal && new URLSearchParams(location.search).get('test') === '1';
  }catch(e){ return false; }
})();

const QUESTS = [
  { id:'volt_current', icon:'🔋', section:{ icon:'⚡', title:'بخش آردوینو', sub:'آردوینو یک برد الکترونیکیِ کوچک با یک میکروکنترلر است؛ مثلِ یک مغزِ ساده که با کد بهش می‌گویی LED را روشن کند، دکمه را بخواند یا موتور را بچرخاند. نوشتنش آسان است و برای شروعِ برنامه‌نویسیِ سخت‌افزار انتخابِ خوبی است.' }, title:'ولتاژ - جریان - مقاومت', sub:'مفاهیم اولیه — الکترون‌ها به کجا می‌روند؟',
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
  { id:'hello', icon:'📝', title:'چاپ Hello World', sub:'گام صفر — اولین برنامه و سریال مانیتور',
    xp:30,
    quote:'«برد و کامپیوتر برای حرف زدن با هم به یک ارتباط سریال نیاز دارند که با تابع Serial.begin باز می‌شود. عددی که به آن می‌دهی، مثل ۹۶۰۰، سرعت رد و بدل شدن داده را مشخص می‌کند و باید در برد و در سریال مانیتور کامپیوتر یکسان باشد، وگرنه پیام‌ها به‌جای متن خوانا، علامت‌های نامفهوم نشان داده می‌شوند.»',
    desc:'ساده‌ترین شروع ممکن: هیچ سیم و قطعه‌ای لازم نیست. فقط یک پیام از برد به کامپیوتر بفرست و آن را در سریال مانیتور ببین.',
    steps:[
      'در setup() با ()Serial.begin ارتباط سریال را باز کن (مثلاً ۹۶۰۰).',
      'با ("Serial.println("Hello World پیام را چاپ کن.',
      'دکمه «اجرا کن» را بزن و خروجی را در کنسول سریال پایین ببین.'
    ]},
  { id:'led', icon:'💡', title:'روشن‌کردن یک LED', sub:'گام اول — خروجی دیجیتال و مقاومت',
    xp:40,
    quote:'«LED مثل یک دریچه‌ی یک‌طرفه است که فقط در یک جهت جریان را رد می‌کند و خودش تقریباً هیچ مقاومتی جلوی جریان نمی‌گذارد. برای همین اگر مستقیم به باتری وصل شود، جریان به‌شدت بالا می‌رود و در چند لحظه می‌سوزد. یک مقاومت ساده، جلوی این جریان اضافه را می‌گیرد و اجازه می‌دهد LED با شدت درست و ایمن روشن بماند.»',
    desc:'حالا فقط یک LED را روشن کن — بدون چشمک و بدون پیچیدگی. یاد می‌گیری جریان چطور از پین دیجیتال به LED می‌رسد و چرا مقاومت لازم است.',
    steps:[
      'مدار آماده است: پایه مثبت LED → مقاومت ۲۲۰ اهم → پین ۸، پایه منفی → GND.',
      'در setup() با (pinMode(ledPin, OUTPUT پین را خروجی کن.',
      'با (digitalWrite(ledPin, HIGH آن را روشن کن و ببین چطور می‌درخشد.'
    ]},
  { id:'blink', icon:'✨', title:'چشمک‌زن (Blink)', sub:'گام دوم — روشن و خاموش با delay',
    xp:50,
    quote:'«تابع delay برنامه را برای مدتی که به میلی‌ثانیه به آن می‌دهی، کاملاً متوقف می‌کند؛ یعنی در آن مدت هیچ کار دیگری انجام نمی‌شود. برای یک چشمک‌زن ساده همین کافی است، اما در پروژه‌های بزرگ‌تر که باید چند کار را همزمان انجام دهی، معمولاً به‌جای آن از تابع millis استفاده می‌شود که بدون متوقف‌کردن برنامه، زمان را اندازه می‌گیرد.»',
    desc:'همان مدار قبلی را با ()delay به یک چشمک‌زن تبدیل می‌کنی — اولین برنامه‌ی زمان‌بندی‌شده‌ات.',
    steps:[
      'مثل مأموریت قبل، پین را در setup() روی OUTPUT بگذار.',
      'در loop() اول (digitalWrite(ledPin, HIGH بنویس و بعد (delay(500.',
      'سپس (digitalWrite(ledPin, LOW و یک (delay(500 دیگر اضافه کن.',
      'اجرا کن؛ LED باید پشت‌سرهم روشن و خاموش شود.'
    ]},
  { id:'button', icon:'🔘', title:'کنترل LED با دکمه', sub:'ورودی دیجیتال و pull-down',
    xp:60,
    quote:'«اگر یک پین ورودی دیجیتال به هیچ‌جا وصل نباشد، در حالتی به‌نام شناور می‌ماند و مقداری کاملاً تصادفی و پرنویز می‌خواند. یک مقاومت pull-down پین را وقتی دکمه فشرده نشده به زمین وصل می‌کند تا مقدار صفر بخواند، یا برعکس یک pull-up آن را به مقدار بالا می‌چسباند؛ آردوینو یک نسخه‌ی داخلی از pull-up هم دارد که با INPUT_PULLUP فعال می‌شود.»',
    desc:'حالا نوبت خواندن ورودی است — یاد می‌گیری چطور یک فشار دکمه را تشخیص بدهی و به خروجی وصل کنی.',
steps: [
  'تنظیم پین دکمه روی INPUT_PULLUP و پین چراغ روی OUTPUT در تابع setup.',
  'خواندن مداوم وضعیت دکمه با digitalRead و چاپ مقدار آن در سریال مانیتور جهت بررسی صحت عملکرد.',
  'پیاده‌سازی منطق با if به‌طوری که با فشردن دکمه (مقدار LOW) چراغ روشن و با رها کردن آن (مقدار HIGH) چراغ خاموش شود.'
]
  },
  { id:'pot', icon:'🎚️', title:'کنترل روشنایی با ولوم', sub:'ورودی آنالوگ + PWM',
    xp:70,
    quote:'«پتانسیومتر یک مقاومت متغیر با سه پایه است که با چرخاندن دسته‌اش، نسبت مقاومت دو طرف عوض می‌شود و ولتاژ خروجی پایه‌ی وسط بین صفر تا ولتاژ تغذیه بالا و پایین می‌رود. مبدل آنالوگ‌به‌دیجیتال آردوینو این ولتاژ پیوسته را می‌خواند و به عددی صحیح بین صفر تا هزار و بیست‌وسه تبدیل می‌کند تا برنامه بتواند با آن کار کند.»',
    desc:'با پتانسیومتر مقدار آنالوگ می‌خوانی و با PWM آن را به روشنایی متغیر LED تبدیل می‌کنی.\n\nپایه‌ی دیجیتال میکروکنترلر همیشه فقط دو حالت دارد: یا ۵ ولت است یا ۰ ولت؛ یعنی هیچ‌وقت نمی‌تواند ولتاژی این‌بین (مثل ۲.۵ ولت) تولید کند. وقتی از PWM استفاده می‌کنیم، ولتاژ واقعی کم و زیاد نمی‌شود، بلکه پایه با سرعت خیلی بالا بین ۵ و ۰ ولت خاموش و روشن می‌شود — درست مثل کلید برقی که آن‌قدر سریع قطع و وصل می‌شود که چشم ما متوجه چشمک‌زدن آن نمی‌شود و فقط می‌بیند که نور LED کم شده است!',
    steps:[
      'پتانسیومتر را به یک پین آنالوگ (ADC) وصل کن.',
      'مقدار analogRead را بخوان (روی آردوینو، ADC ده‌بیتی است؛ بازه‌ی خروجی ۰ تا ۱۰۲۳).',
      'مقدار را map کن به بازه PWM (۰ تا ۲۵۵) و با analogWrite روشنایی LED را تغییر بده.',
      'نتیجه را در سریال پلاتر (Serial Plotter) مشاهده کن.'
    ]},
  { id:'servo', icon:'⚙️', title:'کنترل زاویه‌ی سروو', sub:'موتور و سیگنال PWM دقیق',
    xp:80,
    quote:'«موتور سروو با یک سیم سیگنال، یک تغذیه و یک زمین کار می‌کند. کنترل‌کننده‌ی داخلش هر بیستم ثانیه یک پالس کوتاه دریافت می‌کند و از روی طول همان پالس، که چیزی بین یک تا دو میلی‌ثانیه است، می‌فهمد باید محورش را روی چه زاویه‌ای، معمولاً بین صفر تا صد و هشتاد درجه، نگه دارد.»',
    desc:'یاد می‌گیری چطور با پالس‌های PWM دقیق، زاویه یک موتور سروو را کنترل کنی.',
    steps:[
      'سروو موتور را با منبع تغذیه مناسب (نه مستقیم از پین) وصل کن.',
      'با کتابخانه Servo، آن را attach کن.',
      'با servo.write() زاویه را بین ۰ تا ۱۸۰ درجه تغییر بده.',
      'با یک حلقه for ساده، زاویه را از ۰ تا ۱۸۰ درجه (فقط یک‌بار، یک طرف) افزایش بده و بین هر مرحله کمی delay بگذار — لازم نیست برگردی.'
    ]},
  { id:'stm32_cube', icon:'🧩', section:{ icon:'🔵', title:'بخش STM32', sub:'STM32F103C8T6 یک میکروکنترلرِ ۳۲بیتی ساخت STMicroelectronics است که روی برد ارزانِ Blue Pill نشسته؛ ساعتش ۷۲ مگاهرتز است (چهار پنج برابرِ آردوینو Uno)، ۲۰ کیلوبایت RAM دارد و با ۳٫۳ ولت کار می‌کند. چون سریع و ارزان است، در ربات‌ها، کنترلِ موتور و پروژه‌های جدی‌تر زیاد استفاده می‌شود. آن را با CubeMX تنظیم و با HAL برنامه‌ریزی می‌کنیم.' },
    title:'STM32 — تنظیم پایه‌ها و ساعت در CubeMX', sub:'گام اول STM32 — پایه‌ی PC13 و ساعت ۷۲ مگاهرتز',
    xp:100,
    quote:'«برد STM32 برخلاف آردوینو از همان لحظه‌ی اول همه‌چیز را به خودت می‌سپارد: هر پایه چه کاری بکند و ساعت چیپ چند مگاهرتز باشد. ابزار CubeMX این تنظیم‌ها را روی یک صفحه‌ی گرافیکی نشان می‌دهد و کدِ راه‌اندازی را خودش می‌نویسد.»',
    desc:'Blue Pill چیپ STM32F103C8T6 دارد: هسته‌ی ۳۲ بیتی Cortex-M3 تا ۷۲ مگاهرتز. در CubeMX دو کار اصلی داری: ۱) برای هر پایه یک کار انتخاب کنی (مثلاً GPIO_Output برای LED روی PC13). ۲) ساعت را بسازی: کریستال ۸ مگاهرتز ضربدر ضریب PLL برابر ۹ می‌شود ۷۲ مگاهرتز.\n\nپایه‌های SWD (PA13 و PA14) برای برنامه‌ریز ST-Link و پایه‌های کریستال (PD0 و PD1) را CubeMX خودش تنظیم می‌کند؛ لازم نیست دست بزنی.',
    steps:[
      'پروژه‌ی جدید بساز و چیپ STM32F103C8Tx را انتخاب کن.',
      'روی پایه‌ی PC13 کلیک کن و GPIO_Output را بزن؛ این همان LED روی برد است.',
      'در Clock Configuration ضریب PLL را روی ۹ بگذار تا SYSCLK برابر ۷۲ مگاهرتز شود.',
      'APB1 را روی تقسیم بر ۲ بگذار؛ سقف این باس ۳۶ مگاهرتز است و بیشتر از آن قرمز می‌شود.',
      'وقتی PC13 درست تنظیم شد و ساعت بدون خطا بود، مأموریت خودکار تکمیل می‌شود.'
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
    ]},
  { id:'robot_assemble', icon:'🛠️', section:{ icon:'🤖', title:'بخش رباتیک', sub:'در این بخش می‌خواهیم یک ربات تعقیب خط (Line Follower) بسازیم: رباتی که با سنسورهای مادون‌قرمز خط مشکی روی زمین را می‌بیند و خودش مسیرش را اصلاح می‌کند تا از خط بیرون نرود. قدم‌به‌قدم جلو می‌رویم: اول قطعه‌های ربات را سر هم می‌کنیم، بعد سنسورها، بعد تصمیم‌گیری با if، بعد جهت و سرعتِ موتورها و در آخر تعقیبِ خط.' },
    title:'ربات تعقیب خط — گام ۰: سرهم‌کردنِ قطعات', sub:'رباتیک — چشم، مغز، درایور، موتور و منبع تغذیه',
    xp:80,
    quote:'«هر ربات از چند بخشِ ساده ساخته می‌شود: چشم که دنیا را می‌بیند، مغز که تصمیم می‌گیرد، درایور که جریانِ موتورها را کنترل می‌کند، موتور که ربات را می‌برد و باتری که به همه انرژی می‌دهد. اگر یکی از این‌ها کم باشد، ربات کار نمی‌کند.»',
    desc:'قبل از اینکه ربات بتواند خط را تعقیب کند، باید بدنه‌اش را سر هم کنی. این‌جا ربات را از بالا می‌بینی؛ جلوی ربات بالای صفحه است.\n\nنُه قطعه‌ی واقعیِ ربات پایین صفحه منتظرند، همان‌هایی که در ساختِ این ربات استفاده می‌شوند. هر قطعه را بگیر و روی جایگاه خط‌چینِ خودش بینداز. وقتی همه سر جایشان نشستند، ربات را روشن کن و ببین جریان از باتری و کلید به همه‌ی بخش‌ها می‌رسد.',
    steps:[
      'هر قطعه را با انگشت یا موس بگیر و روی بدنه‌ی ربات ببر؛ جایگاهِ درستش سبز می‌شود.',
      'اگر قطعه را سرِ جای اشتباه بیندازی، به جای اولش برمی‌گردد و می‌گوید جای واقعی‌اش کجاست.',
      'اگر نمی‌دانی قطعه کجا می‌نشیند، یک بار رویش بزن تا جایگاهش چشمک بزند.',
      'چشم (آرایه‌ی سنسورها) جلوی ربات، مغز (Blue Pill) و درایور وسط، دو موتور دو طرفِ بدنه و چرخ هرزگرد پشتِ ربات می‌نشینند.',
      'منبع تغذیه سه قطعه است: باتری، کلید روشن/خاموش و رگولاتور؛ این سه کنار هم، پایینِ بدنه جا دارند.',
      'وقتی همه‌ی قطعه‌ها نشست، دکمه‌ی «روشنش کن» را بزن؛ مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_sensor', icon:'🤖',
    title:'ربات تعقیب خط — گام ۱: چشمِ ربات', sub:'رباتیک — سنسور مادون‌قرمز و تشخیص خط',
    xp:90,
    quote:'«سنسور خط‌یاب یک چراغ مادون‌قرمز دارد که نور می‌فرستد و یک گیرنده که نورِ برگشتی را اندازه می‌گیرد. سطح سفید بیشترِ نور را برمی‌گرداند و خط مشکی آن را می‌بلعد. پس ربات فقط از روی کم‌یا‌زیاد بودنِ نورِ برگشتی می‌فهمد روی خط هست یا نه.»',
    desc:'بعد از سرهم‌کردنِ بدنه (گام ۰)، ربات تعقیب خط شش قدم دارد: ۱) چشم: سنسور خط را می‌بیند. ۲) خواندنِ سنسور با کد روی STM32. ۳) مغز: کد تصمیم می‌گیرد. ۴) پا: جهتِ موتورها. ۵) پا: سرعتِ موتورها با PWM. ۶) راه‌افتادن و دنبال‌کردن خط.\n\nامروز فقط قدم اول است. اول با سه آزمایش کوچک می‌فهمی «مادون‌قرمز» دقیقاً چیست، چشم و سنسور چه فرقی دارند و چرا خط را مشکی روی زمینه‌ی سفید می‌کشند؛ بعد یاد می‌گیری سنسور چه عددی می‌خواند و چطور آن عدد را با یک «آستانه» به دو حالت سفید و مشکی تبدیل کنی. این کار با هر برد، چه آردوینو و چه STM32، یکی است.',
    steps:[
      'اول بخش «مادون‌قرمز (IR) چیست؟» را بخوان و با نشانگر طیف، دیدِ چشم و دیدِ سنسور و سطح سفید/مشکی بازی کن.',
      'سنسور (مثلاً TCRT5000) را به برد وصل می‌کنی: VCC به ۳.۳ ولت (روی STM32)، GND به GND و خروجی DO به یک پین مثل PA0.',
      'روی سفید نور زیادی برمی‌گردد و عدد بالاست؛ روی خط مشکی نور جذب می‌شود و عدد پایین می‌آید.',
      'در شبیه‌ساز زیر سنسور را روی مسیر بکش و عدد نورِ برگشتی را ببین.',
      'آستانه (Threshold) را طوری تنظیم کن که روی سفید LED خاموش و روی خط مشکی روشن شود.',
      'سنسور را یک‌بار روی سفید و یک‌بار روی مشکی ببر؛ وقتی هر دو درست خوانده شدند، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_read', icon:'📟', title:'ربات تعقیب خط — گام ۲: خواندنِ سنسور با کد', sub:'CubeMX، HAL_GPIO_ReadPin و if',
    xp:100,
    quote:'«تا حالا سنسور را در شبیه‌ساز دیدی؛ حالا وقتش است که خودِ برد STM32 آن را بخواند. هر برنامه‌ی میکروکنترلری سه قدم دارد: ورودی را بخوان، تصمیم بگیر، خروجی را بنویس. این‌جا ورودی سنسورِ خط است و خروجی LED روی برد.»',
    desc:'کار با STM32 همیشه دو مرحله دارد: اول در CubeMX به هر پایه می‌گویی چه کاری بکند (ورودی، خروجی، PWM و...) و CubeMX کدِ راه‌اندازی را در main.c می‌نویسد. بعد خودت داخل while(1)، بین USER CODE BEGIN و END، منطقِ برنامه را می‌نویسی.\n\nاین‌جا سنسور روی PA0 ورودی است و LED روی PC13 خروجی. اگر پایه‌ها را در CubeMX درست تنظیم نکنی، برد هم مثل واقعیت جواب نمی‌دهد.',
    steps:[
      'در مرحله‌ی ۱، روی نقشه‌ی چیپ PA0 را GPIO_Input و PC13 را GPIO_Output کن.',
      'در مرحله‌ی ۲ با HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0) مقدارِ سنسور را بخوان.',
      'با if / else بنویس: اگر مشکی (GPIO_PIN_SET) بود LED روشن شود، وگرنه خاموش.',
      'یادآوری: روی Blue Pill، GPIO_PIN_RESET روی PC13 یعنی LED روشن.',
      '«اجرا» را بزن و سطحِ زیر سنسور را یک‌بار مشکی و یک‌بار سفید کن؛ وقتی هر دو درست کار کرد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_logic', icon:'🧠', title:'ربات تعقیب خط — گام ۳: مغزِ ربات', sub:'سه سنسور و if / else if',
    xp:110,
    quote:'«یک سنسور فقط می‌گوید روی خط هستم یا نه. با سه سنسور کنار هم (چپ، وسط، راست) ربات می‌فهمد خط به کدام سمت رفته. قاعده ساده است: هر سمتی که خط را می‌بیند، ربات به همان سمت می‌چرخد تا خط دوباره زیر سنسور وسط بیاید.»',
    desc:'سه سنسور کنار هم هشت حالت می‌سازند؛ چهار حالتِ اصلی را حل می‌کنیم. در کد، هر حالت یک شرط است و ترتیبِ شرط‌ها اولویت را می‌سازد: اول وسط، بعد چپ، بعد راست. اگر هیچ‌کدام نبود، همه‌ی چراغ‌ها خاموش می‌ماند (ربات بایستد).\n\nبه‌جای موتور، سه LED (PB12، PB13 و PB14) تصمیمِ ربات را نشان می‌دهند. گام بعد همین تصمیم‌ها را به موتورها می‌رسانی.',
    steps:[
      'در مرحله‌ی ۱، PA0 و PA1 و PA2 را GPIO_Input و PB12 و PB13 و PB14 را GPIO_Output کن.',
      'سه سنسور را در سه متغیر بخوان: uint8_t left = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0); و همین‌طور center و right.',
      'اول همه‌ی چراغ‌ها را خاموش کن تا چراغِ حالتِ قبل روشن نماند.',
      'با if (center == 1) چراغِ مستقیم، با else if (left == 1) چراغِ چپ و با else if (right == 1) چراغِ راست را روشن کن.',
      'چهار حالت (وسط، چپ، راست، گم‌شدنِ خط) را با دکمه‌ها امتحان کن؛ وقتی هر چهار حالت درست بود، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_motors', icon:'⚙️', title:'ربات تعقیب خط — گام ۴: پاهای ربات (جهت)', sub:'درایور موتور و HAL_GPIO_WritePin',
    xp:110,
    quote:'«پایه‌های میکروکنترلر جریان کافی برای راندن موتور ندارند؛ پس بین برد و موتور یک درایور (مثل TB6612 یا L298N) می‌گذاریم. برد فقط یک سیگنال PWM برای سرعت و دو پایه برای جهت می‌دهد و درایور جریان اصلی را از باتری می‌گیرد. ربات با دو موتورِ مستقل می‌چرخد: موتورها که یک‌جور نباشند، پیچیدن اتفاق می‌افتد.»',
    desc:'هر موتور با دو پایه‌ی جهت (IN1 و IN2) به درایور وصل است: (SET، RESET) یعنی جلو، (RESET، SET) یعنی عقب و (RESET، RESET) یعنی ایست. موتور چپ: PB0 و PB1، موتور راست: PB10 و PB11.\n\nاین گام فقط جهت است و موتورها با سرعتِ کامل می‌چرخند. چهار حرکتِ پایه: مستقیم (هر دو جلو)، چپ (موتور چپ ایستاده و راست جلو)، راست (برعکس) و ایست.',
    steps:[
      'در مرحله‌ی ۱، چهار پایه‌ی PB0 و PB1 و PB10 و PB11 را GPIO_Output کن.',
      'برای «جلو» دو پایه‌ی هر موتور را (SET، RESET) کن و با HAL_Delay(1000) صبر کن.',
      'برای «چپ» موتور چپ را بایستان (هر دو پایه‌اش RESET) و موتور راست را جلو نگه دار.',
      'برای «راست» برعکس: موتور راست بایستد و موتور چپ جلو برود.',
      'آخر هر چهار پایه را RESET کن تا ربات بایستد؛ وقتی هر چهار حرکت دیده شد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'motor_pwm', icon:'🎚️', title:'ربات تعقیب خط — گام ۵: سرعتِ موتورها با PWM', sub:'تایمر، HAL_TIM_PWM_Start و __HAL_TIM_SET_COMPARE',
    xp:120,
    quote:'«PWM یعنی پایه را خیلی سریع روشن و خاموش کنیم: هرچه درصدِ روشن‌ماندن بیشتر باشد موتور تندتر می‌چرخد. تایمرِ چیپ این کار را خودش می‌کند؛ تو فقط یک عدد (compare) را عوض می‌کنی. دو موتور با سرعت‌های متفاوت یعنی پیچیدن، و پیچیدن یعنی تعقیب خط.»',
    desc:'تایمر ۱ از صفر تا ۹۹۹ می‌شمارد و تا عددِ compare پایه را روشن نگه می‌دارد: ۰ یعنی ایست، ۵۰۰ نیمِ سرعت، ۹۹۹ سرعتِ کامل. موتور چپ از TIM_CHANNEL_1 (پایه‌ی PA8) و موتور راست از TIM_CHANNEL_2 (پایه‌ی PA9) سرعت می‌گیرد؛ جهت هنوز با پایه‌های IN است.\n\nدو کار در CubeMX (پایه‌ها را TIM1_CH1 و TIM1_CH2 کن) و دو کار در کد دارد: PWM را قبل از حلقه با HAL_TIM_PWM_Start روشن کن و داخل حلقه با __HAL_TIM_SET_COMPARE سرعت را عوض کن.',
    steps:[
      'در مرحله‌ی ۱ علاوه بر چهار پایه‌ی جهت (خروجی)، PA8 را TIM1_CH1 و PA9 را TIM1_CH2 کن؛ در main.c خطِ MX_TIM1_Init() ظاهر می‌شود.',
      'در ادیتورِ «قبل از حلقه» با HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1); و همین‌طور کانال ۲، PWM را روشن کن.',
      'داخل حلقه جهتِ هر دو موتور را «جلو» بگذار و با __HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, 300); سرعت بده (۳۰۰ آهسته، ۸۰۰ تند).',
      'برای خمِ چپ موتور راست را تندتر از چپ و برای خمِ راست موتور چپ را تندتر از راست کن.',
      'بین حالت‌ها HAL_Delay بگذار؛ وقتی آهسته، تند، خمِ چپ و خمِ راست دیده شد، مأموریت خودکار تکمیل می‌شود.'
    ]},
  { id:'line_follow', icon:'🏁', title:'ربات تعقیب خط — گام ۶: تعقیب خط', sub:'چشم، مغز و پا کنار هم',
    xp:150,
    quote:'«تعقیب خط یک حلقه‌ی ساده است: سنسورها را بخوان، تصمیم بگیر، موتورها را تنظیم کن و دوباره از اول. دو عدد همه‌چیز را کنترل می‌کنند: سرعت پایه و شدت پیچیدن. اگر پیچیدن ضعیف باشد ربات از پیچ‌ها بیرون می‌رود و اگر سرعت زیاد باشد، فرصت واکنش ندارد.»',
    desc:'حالا چشم، مغز و پا را به هم وصل می‌کنی. ربات سه سنسور جلو دارد و مسیر موج‌دار است. با دو اسلایدر سرعت و شدت پیچیدن را تنظیم کن تا ربات خط را تا خط پایان دنبال کند.\n\nاین همان فکر اصلی کد واقعی است: خروجی تصمیم (چپ یا راست) در شدت پیچیدن ضرب می‌شود و به موتورها می‌رسد.',
    steps:[
      '«شروع» را بزن و ببین ربات با تنظیم‌های اولیه چه می‌کند.',
      'اگر از پیچ‌ها بیرون رفت، شدت پیچیدن را بیشتر کن یا سرعت را کم کن.',
      'هرچه سرعت بیشتر باشد، ربات به پیچیدن قوی‌تری نیاز دارد.',
      'ربات باید بدون گم‌شدن بیش از یک ثانیه به خط پایان برسد.',
      'وقتی رسید، مأموریت خودکار تکمیل می‌شود و ربات تعقیب خطِ تو کامل شده است.'
    ]}
];

/* ===== گروه‌بندیِ مسیر: آردوینو / STM32 / رباتیک — هر کدام یک تب =====
   ترتیبِ قفل‌شدنِ مأموریت‌ها همان قبلی است (پشتِ‌سرِ‌هم)؛ فقط نمایش در سه تب جدا شده. */
const QUEST_GROUPS = [
  { id: 'arduino',  icon: '⚡', title: 'آردوینو' },
  { id: 'stm32',    icon: '🔵', title: 'STM32' },
  { id: 'robotics', icon: '🤖', title: 'رباتیک' }
];
(function assignQuestGroups(){
  let g = 'arduino';
  QUESTS.forEach(q => {
    if(q.id === 'stm32_cube') g = 'stm32';
    else if(q.id === 'robot_assemble') g = 'robotics';
    q.group = g;
  });
})();
const QUEST_GROUP_KEY = 'shovalie-madar-quest-group-v1';
let activeGroup = null;
function saveActiveGroup(){ try{ localStorage.setItem(QUEST_GROUP_KEY, activeGroup); }catch(e){} }

/* مأموریت‌های بیشتر با حمایت بیشتر باز می‌شوند */
const LOCKED_TEASER = {
  count: 6,
  title: 'مأموریت‌های بیشتر در راه است',
desc: 'با حمایت از سازنده، مراحل بعدیِ مسیر شامل پروژه‌های رباتیک بیشتر، ماژول ها و قطعات جدید، قسمت های جدید آزمایشگاه) باز می‌شوند.'
};


/* Runs fn at most once per animation frame, no matter how many times it's
   called in between — mobile browsers fire 'resize' repeatedly while the
   URL bar hides/shows during scroll, and without this, every one of those
   events was forcing a full re-measure of every quest node. */
function rafThrottle(fn){
  let scheduled = false;
  return function(...args){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; fn.apply(this, args); });
  };
}

/* ================= CONFETTI ENGINE ================= */
const confettiCanvas = document.getElementById('confettiCanvas');
const cctx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiRAF = null;
const CONFETTI_COLORS = ['#57d8a3','#d4af37','#c97c3d','#e79a54','#e8e2d0','#4FBF8B'];

function resizeConfettiCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', rafThrottle(resizeConfettiCanvas));
resizeConfettiCanvas();
// ادیتورِ تمام‌صفحه (arduino-sim.js) خودش فرزندِ مستقیمِ body است؛ برای این‌که
// پارتیکل و فلشِ جشن بالای آن دیده شوند، این دو هم باید فرزندِ مستقیمِ body
// باشند (z-indexشان در quest.css برایِ حالتِ تمام‌صفحه بالا می‌رود).
[confettiCanvas, document.getElementById('flashOverlay')].forEach((el) => {
  if(el && el.parentElement !== document.body) document.body.appendChild(el);
});

function confettiBurst(xRatio = .5, yRatio = .35, count = 90, big = false){
  const cx = xRatio * confettiCanvas.width;
  const cy = yRatio * confettiCanvas.height;
  for(let i=0;i<count;i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (big ? 6 : 4) + Math.random() * (big ? 8 : 6);
    confettiParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (big ? 3 : 1.5),
      size: (big ? 6 : 4) + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - .5) * .3,
      life: 1,
      decay: 0.006 + Math.random() * 0.008,
      shape: Math.random() > .5 ? 'rect' : 'circle'
    });
  }
  if(!confettiRAF) confettiRAF = requestAnimationFrame(confettiLoop);
}

function confettiLoop(){
  cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach(p => {
    p.vy += 0.13; // gravity
    p.vx *= 0.992;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vrot;
    p.life -= p.decay;
  });
  confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < confettiCanvas.height + 40);
  confettiParticles.forEach(p => {
    cctx.save();
    cctx.globalAlpha = Math.max(p.life, 0);
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillStyle = p.color;
    if(p.shape === 'rect'){
      cctx.fillRect(-p.size/2, -p.size/2.5, p.size, p.size/1.6);
    } else {
      cctx.beginPath();
      cctx.arc(0,0, p.size/2, 0, Math.PI*2);
      cctx.fill();
    }
    cctx.restore();
  });
  if(confettiParticles.length > 0){
    confettiRAF = requestAnimationFrame(confettiLoop);
  } else {
    confettiRAF = null;
    cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  }
}

function screenFlash(){
  const el = document.getElementById('flashOverlay');
  el.classList.remove('active');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('active');
}

function ripple(btn, evt){
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.2;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = size + 'px';
  const x = (evt && evt.clientX ? evt.clientX - rect.left : rect.width/2) - size/2;
  const y = (evt && evt.clientY ? evt.clientY - rect.top : rect.height/2) - size/2;
  r.style.left = x + 'px'; r.style.top = y + 'px';
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

function animateCount(el, from, to, dur = 550, suffix = ''){
  const start = performance.now();
  function step(now){
    const t = Math.min((now - start)/dur, 1);
    const eased = 1 - Math.pow(1-t, 3);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = toFa(val) + suffix;
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

let progress = {}; // id -> true/false
QUESTS.forEach(q => progress[q.id] = false);

/* ================= PROGRESS PERSISTENCE (local + cloud) ================= */
const PROGRESS_STORAGE_KEY = 'shovalie-madar-progress-v1';

function loadLocalProgress(){
  try{
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if(!raw) return;
    const saved = JSON.parse(raw);
    QUESTS.forEach(q => { if(saved[q.id]) progress[q.id] = true; });
  }catch(e){ /* localStorage unavailable (private mode etc.) — silently ignore */ }
}
loadLocalProgress();

function saveProgress(){
  try{ localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); }catch(e){}
  // If sync.js loaded and a Google account is signed in, this pushes the
  // same progress up to the cloud (Firestore). No-op if not signed in.
  if(window.cloudSaveProgress) window.cloudSaveProgress(progress);
}

// Exposed so sync.js can read/merge without knowing quest.js internals.
window.getQuestProgress = () => progress;
window.applyCloudProgress = (cloudProgress) => {
  if(!cloudProgress) return false;
  let changed = false;
  QUESTS.forEach(q => {
    if(cloudProgress[q.id] && !progress[q.id]){ progress[q.id] = true; changed = true; }
  });
  if(changed){
    try{ localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); }catch(e){}
    render();
  }
  return changed;
};

function isLocked(index){
  if(TEST_MODE || index === 0) return false;
  return !progress[QUESTS[index-1].id];
}
function totalXP(){ return QUESTS.reduce((s,q)=>s+q.xp,0); }
function earnedXP(){ return QUESTS.reduce((s,q)=>s+(progress[q.id]?q.xp:0),0); }
function completedCount(){ return QUESTS.filter(q=>progress[q.id]).length; }

const container = document.getElementById('nodesContainer');
// موتور باننر گفتگو (شوالیه/ولتاژ) به dialogue.js منتقل شد —
// knightLine / knightSection / knightImg / CHARACTERS / setKnightMood /
// showKnightLine / hideKnightLine همگی از آنجا در دسترس‌اند (dialogue.js
// قبل از این فایل لود می‌شود).

// The intro line already sitting in the HTML is shown once the welcome
// popup has been dismissed (see closeWelcome() below), not immediately on
// page load, so it doesn't compete with the welcome modal for attention.
const knightIntroText = knightLine.textContent.trim();

const KNIGHT_LOCKED = [
  '🔒 این راه هنوز برایت بسته است. اول مأموریت پیش از آن را کامل کن.',
  '🔒 این ماموریت قفله. برای ادامه، ابتدا مأموریت قبلی را تکمیل کن.',
  '🚧 مسیر مسدوده. ابتدا باید ماموریت قبل را با موفقیت پشت سر بگذاری.'
];
const KNIGHT_AVAILABLE_TOASTS = [
  '✅ خوب بود، شاگرد. راه بعدی روشن شد.',
  '📈 مهارتت رشد کرد. آماده‌ی چالش بعدی هستی؟',
  '⚡ مدار درونت قوی‌تر شد. ادامه بده!'
];

/* ================= LAB UNLOCKS (based on mission progress) ================= */
const labCards = Array.from(document.querySelectorAll('.lab-card[data-unlock]'));
labCards.forEach(card => {
  const overlay = document.createElement('div');
  overlay.className = 'lab-lock-overlay';
  overlay.innerHTML = `
    <div class="lab-lock-badge">🔒</div>
    <div class="lab-lock-title">این بخش هنوز قفل است</div>
    <div class="lab-lock-sub"></div>
    <button class="lab-lock-cta">رفتن به مسیر مأموریت</button>
  `;
  card.appendChild(overlay);
  overlay.querySelector('.lab-lock-cta').addEventListener('click', () => {
    SFX.click();
    switchTab('quest');
  });
});

function updateLabLocks(){
  const done = completedCount();
  labCards.forEach(card => {
    const need = parseInt(card.dataset.unlock, 10) || 0;
    const locked = TEST_MODE ? false : done < need;
    // A card that was locked a moment ago and isn't anymore just got unlocked
    // by the mission the person completed — queue it up for the celebration
    // animation (see runPendingLabUnlocks). Skipped on the very first render,
    // where "was locked" simply means "we hadn't drawn the locks yet".
    if(labLocksInitialized && card.classList.contains('locked') && !locked
       && pendingLabUnlocks.indexOf(card) === -1){
      pendingLabUnlocks.push(card);
    }
    // Queued cards deliberately KEEP their .locked state (still blurred, lock
    // overlay still up) until the animation actually plays — otherwise the
    // person would see the card already open before the lock breaks.
    const stillShowLocked = locked || pendingLabUnlocks.indexOf(card) !== -1;
    card.classList.toggle('locked', stillShowLocked);
    if(locked){
      const remaining = need - done;
      card.querySelector('.lab-lock-sub').textContent =
        `با تکمیل ${toFa(remaining)} مأموریت دیگر باز می‌شود (${toFa(done)} از ${toFa(need)})`;
    }
  });
  labLocksInitialized = true;
  // If the person happens to be standing in the Lab already, play it right away;
  // otherwise it waits until they switch to the Lab tab (see switchTab).
  runPendingLabUnlocks();
}

/* ---- unlock animation: scroll to the freshly opened card, fade its lock away ----
   Cards can unlock while the person is on the Quest tab (right after finishing a
   mission), so the animation is queued and only played once the Lab tab is
   actually visible — otherwise they'd never see it. */
let labLocksInitialized = false;
const pendingLabUnlocks = [];
let labUnlockPlaying = false;

function runPendingLabUnlocks(){
  if(labUnlockPlaying || labTabLocked) return;
  if(!pendingLabUnlocks.length) return;
  if(!labTab.classList.contains('active')) return; // wait for the Lab tab

  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const card = pendingLabUnlocks.shift();
  labUnlockPlaying = true;

  try{
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }catch(e){ card.scrollIntoView(); }

  // Long enough for the smooth scroll to land AND for the still-locked card to
  // register visually, so the lock is clearly seen breaking open afterwards.
  const scrollMs = reduceMotion ? 60 : 900;
  setTimeout(() => {
    card.classList.add('unlocking');
    card.classList.remove('locked'); // the .unlocking rules keep the lock on screen while it fades
    SFX.unlock();
    track('lab_card_unlock_animated', { unlock: card.dataset.unlock });
    setTimeout(() => {
      card.classList.remove('unlocking');
      labUnlockPlaying = false;
      runPendingLabUnlocks(); // chain, in case several cards opened at once
    }, reduceMotion ? 120 : 1100);
  }, scrollMs);
}
window.runPendingLabUnlocks = runPendingLabUnlocks;

/* ================= LAB TAB LOCK (whole section, not just one card) =================
   The entire "آزمایشگاه" tab stays locked until the very first mission is
   completed. Two separate one-time dialogs exist here:
     1) labUnlockOverlay — shown right after finishing the unlocking mission,
        celebrating that the tab just opened, with a "go to lab" button.
     2) labIntroOverlay — shown the first time the person actually opens the
        Lab tab (whether they clicked the button above or the tab itself),
        explaining what's inside.
   Both reuse the .overlay/.modal styling from the mission modal, so no HTML
   changes are needed. */
const LAB_TAB_UNLOCK_MISSIONS = 1;
const LAB_UNLOCK_SEEN_KEY = 'shovalie-madar-lab-unlock-seen';
const LAB_INTRO_SEEN_KEY = 'shovalie-madar-lab-intro-seen';

/* ---- 1) unlock celebration popup, shown right after the unlocking mission ---- */
let labUnlockOverlay = null;
function buildLabUnlockOverlay(){
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'labUnlockOverlay';
  ov.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" aria-label="بستن">✕</button>
      <div class="modal-eyebrow">🔓 قابلیت جدید باز شد</div>
      <div class="modal-title">آزمایشگاه الکترونیک باز شد!</div>
      <div class="modal-desc">
        آفرین! حالا بخش «آزمایشگاه» برایت باز شده. اینجا می‌تونی با شبیه‌سازهای
        تعاملی — قانون اهم، خازن، اسیلوسکوپ، سیم‌پیچ و آهنربا — دست به دستگاه
        ببری و مفاهیم مدار رو با چشم خودت زنده ببینی.
      </div>
      <button type="button" class="complete-btn" id="labUnlockGoBtn">🔬 برو به آزمایشگاه</button>
    </div>
  `;
  document.body.appendChild(ov);
  ov.querySelector('.modal-close').addEventListener('click', () => { SFX.hover(); closeLabUnlockOverlay(); });
  ov.addEventListener('click', (e) => { if(e.target === ov) closeLabUnlockOverlay(); });
  ov.querySelector('#labUnlockGoBtn').addEventListener('click', () => {
    SFX.click();
    closeLabUnlockOverlay();
    switchTab('lab'); // this in turn triggers maybeShowLabIntro() below, first time only
  });
  return ov;
}
function openLabUnlockOverlay(){
  if(!labUnlockOverlay) labUnlockOverlay = buildLabUnlockOverlay();
  labUnlockOverlay.classList.add('open');
  labUnlockOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  track('lab_unlock_shown', {});
}
function closeLabUnlockOverlay(){
  if(!labUnlockOverlay) return;
  labUnlockOverlay.classList.remove('open');
  labUnlockOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

/* ---- 2) explanatory dialogue box, shown the first time the tab is actually opened ----
   Uses the same knight speech-banner (#knightSection, showKnightLine) as the
   rest of the game — not a popup — since knight-section was moved out of
   #questTab in the HTML so it can be reused on the Lab tab too. */
const LAB_INTRO_TEXT = 'به آزمایشگاه الکترونیک خوش اومدی! 🔬 با شبیه‌سازها تمرین کن و با تکمیل مأموریت‌ها، قفل بخش‌های جدید رو باز کن! ⚡';
// Shown right after the knight's line above finishes typing — Voltage
// introduces itself as the lab's own guide (see maybeShowLabIntro below).
const VOLTAGE_INTRO_TEXT = 'سلام! من ولتاژ هستم ⚡ از این به بعد تو آزمایشگاه کنارتم و کمکت می‌کنم مفهوم‌ها رو با چشم خودت حس کنی.';

function updateLabTabLock(){
  const done = completedCount();
  const unlocked = TEST_MODE || done >= LAB_TAB_UNLOCK_MISSIONS;
  tabLabBtn.classList.toggle('locked', !unlocked);
  labTabLocked = !unlocked; // global flag from common.js, read by tabLabBtn's click handler

  if(unlocked && !TEST_MODE){
    let alreadySeen = false;
    try{ alreadySeen = localStorage.getItem(LAB_UNLOCK_SEEN_KEY) === '1'; }catch(e){}
    if(!alreadySeen){
      try{ localStorage.setItem(LAB_UNLOCK_SEEN_KEY, '1'); }catch(e){}
      // Wait for the mission-complete celebration (confetti/flash/modal-close)
      // to settle down first, so this doesn't compete for attention.
      setTimeout(openLabUnlockOverlay, 2000);
    }
  }
}

// Called from switchTab() in common.js, every time the person actually
// switches into the Lab tab. Shows the intro dialog only the very first
// time that happens (guarded by its own localStorage key) — independent of
// the unlock popup above, so it fires whether they got there via that
// popup's button or by tapping the tab directly.
function maybeShowLabIntro(){
  if(labTabLocked) return;
  let alreadySeen = false;
  try{ alreadySeen = localStorage.getItem(LAB_INTRO_SEEN_KEY) === '1'; }catch(e){}
  if(alreadySeen) return;
  try{ localStorage.setItem(LAB_INTRO_SEEN_KEY, '1'); }catch(e){}
  track('lab_intro_shown', {});
  showKnightLine(LAB_INTRO_TEXT, 'happy'); // unchanged knight line, unchanged character
  // Once the knight's line is done typing (16ms/char, see showKnightLine)
  // plus a moment to read it, Voltage introduces itself right after.
  const typingMs = LAB_INTRO_TEXT.length * 16;
  setTimeout(() => showKnightLine(VOLTAGE_INTRO_TEXT, 'happy', 'voltage'), typingMs + 1800);
}
window.maybeShowLabIntro = maybeShowLabIntro;

/* ================= VOLTAGE PRAISE / WARNING (Ohm's-law voltage slider) =================
   Called from lab.js whenever the person drags the voltage slider up.
   Kept here so it reuses the same speech banner / typewriter as everything
   else, and so lab.js doesn't need to know about CHARACTERS/showKnightLine
   internals. */
const VOLTAGE_PRAISE_LINES = [
  '⚡ آفرین! ولتاژ رو زیاد کردی — جریان هم باهاش بیشتر میشه.',
  '🔋 همینه! هرچی ولتاژ بیشتر بشه، الکترون‌ها تندتر می‌دوند.',
  '🎓 آفرین، شاگرد برق! داری قانون اهم رو با دست خودت حس می‌کنی.'
];
function voltagePraise(){
  const line = VOLTAGE_PRAISE_LINES[Math.floor(Math.random() * VOLTAGE_PRAISE_LINES.length)];
  showKnightLine(line, 'approve', 'voltage');
}
window.voltagePraise = voltagePraise;

// Warning line when the voltage climbs very high — even a resistor can't
// always save the LED at that point. Takes priority over the praise line
// above (see lab.js), since it's the more important thing to notice.
const VOLTAGE_WARN_TEXT = '⚠️ مواظب باش! اگه ولتاژ خیلی زیاد بشه، حتی مقاومت هم نمی‌تونه جلوی سوختن LED رو بگیره.';
function voltageWarnHigh(){
  showKnightLine(VOLTAGE_WARN_TEXT, 'stern', 'voltage');
}
window.voltageWarnHigh = voltageWarnHigh;

// Apology line when the person fiddles with the voltage while the LED for
// the current mode is already burned out — nudges them to fix the voltage
// and actually replace the LED before it'll do anything.
const VOLTAGE_BURNED_TEXT = '🔥 متأسفم! من وقتی قوی بشم ممکنه LED رو بسوزونم. دوباره تلاش کن: مقدار ولتاژ رو درست تنظیم کن و LED سوخته رو عوض کن.';
let lastBurnApologyAt = 0;
function voltageApologizeBurned(){
  const now = performance.now();
  if(now - lastBurnApologyAt < 1500) return; // avoid back-to-back duplicate (burn-moment call + slider "change" call)
  lastBurnApologyAt = now;
  showKnightLine(VOLTAGE_BURNED_TEXT, 'stern', 'voltage');
}
window.voltageApologizeBurned = voltageApologizeBurned;

// Praise line for when the person replaces the burned LED and gets back to
// work — the recovery moment after the apology above.
const VOLTAGE_REPLACE_PRAISE_LINES = [
  '💡 آفرین! LED رو عوض کردی — این‌بار با احتیاط بیشتر ولتاژ و مقاومت رو تنظیم کن.',
  '✨ همینه! یه LED نو گذاشتی. یادت باشه: ولتاژ بالا با مقاومت کم، دوباره می‌سوزوندش.',
  '🙌 دمت گرم! دوباره سرِ کار برگشتیم. این‌بار قبل از زیاد کردن ولتاژ، به مقاومت هم فکر کن.'
];
function voltageReplacePraise(){
  const line = VOLTAGE_REPLACE_PRAISE_LINES[Math.floor(Math.random() * VOLTAGE_REPLACE_PRAISE_LINES.length)];
  showKnightLine(line, 'approve', 'voltage');
}
window.voltageReplacePraise = voltageReplacePraise;

// Master Ohm's own explanation for when the LED burns specifically because
// the person removed the resistors or turned them down too far — a
// different cause than "voltage got too high" (Voltage's line above), so
// the knight character explains this one, since resistance is his domain.
const RESISTOR_BURNED_TEXT = '🧯 متأسفم! کار مقاومت اینه که جلوی جریان زیاد رو بگیره، ولی وقتی برش داشتی یا خیلی کمش کردی، دیگه نتونست جلوی سوختن LED رو بگیره. دوباره تلاش کن: یه مقاومت مناسب انتخاب کن و LED سوخته رو عوض کن.';
let lastResistorApologyAt = 0;
function resistorApologizeBurned(){
  const now = performance.now();
  if(now - lastResistorApologyAt < 1500) return;
  lastResistorApologyAt = now;
  showKnightLine(RESISTOR_BURNED_TEXT, 'powered', 'knight');
}
window.resistorApologizeBurned = resistorApologizeBurned;

const questTabEl = document.getElementById('questTab');
const groupBar = document.createElement('div');
groupBar.id = 'questGroups';
groupBar.className = 'qg-bar';
groupBar.setAttribute('role', 'tablist');
questTabEl.insertBefore(groupBar, document.getElementById('pathWrap'));
groupBar.addEventListener('click', (e) => {
  const b = e.target.closest('.qg-tab'); if(!b || b.dataset.g === activeGroup) return;
  SFX.click();
  activeGroup = b.dataset.g; saveActiveGroup(); render();
});
function pickInitialGroup(){
  let g = null;
  try{ g = localStorage.getItem(QUEST_GROUP_KEY); }catch(e){}
  if(QUEST_GROUPS.some(x => x.id === g)) return g;
  const firstOpen = QUESTS.find(q => !progress[q.id]);
  return firstOpen ? firstOpen.group : QUEST_GROUPS[0].id;
}
function paintGroupBar(){
  groupBar.innerHTML = QUEST_GROUPS.map(gr => {
    const all = QUESTS.filter(q => q.group === gr.id), done = all.filter(q => progress[q.id]).length;
    const on = gr.id === activeGroup;
    return `<button type="button" class="qg-tab${on ? ' on' : ''}${done === all.length ? ' full' : ''}" role="tab" aria-selected="${on}" data-g="${gr.id}"><span class="qg-ic" aria-hidden="true">${gr.icon}</span><span class="qg-t">${gr.title}</span><small class="qg-n">${toFa(done)}/${toFa(all.length)}</small></button>`;
  }).join('');
}

function render(){
  if(!activeGroup) activeGroup = pickInitialGroup();
  paintGroupBar();
  container.innerHTML = '';
  const visible = QUESTS.map((q, i) => ({ q, i })).filter(x => x.q.group === activeGroup);
  visible.forEach(({ q, i }, pos) => {
    const locked = isLocked(i);
    const done = progress[q.id];
    if(q.section){
      const sec = document.createElement('div');
      sec.className = 'section-divider' + (locked ? ' locked' : '');
      sec.innerHTML = `<span class="sd-icon">${q.section.icon}</span><div><div class="sd-title">${q.section.title}</div><div class="sd-sub">${q.section.sub}</div></div>`;
      container.appendChild(sec);
    }
    const row = document.createElement('div');
    row.className = 'node-row ' + (pos % 2 === 0 ? 'right' : 'left');

    const node = document.createElement('div');
    node.className = 'node ' + (done ? 'done' : locked ? 'locked' : 'available') + (q.boss ? ' boss-node' : '');
    node.innerHTML = `
      <div class="node-icon">${locked ? '🔒' : q.icon}</div>
      <div class="node-info">
        <div class="node-title">${q.title}</div>
        <div class="node-sub">${q.sub}</div>
      </div>
      <div class="node-status">
        <span class="status-pill">${done ? 'انجام شد' : locked ? 'قفل' : 'آماده'}</span>
      </div>
    `;
    node.addEventListener('click', (evt) => onNodeClick(i, locked, evt));
    if(!locked){
      node.addEventListener('mouseenter', () => SFX.hover());
    }
    row.appendChild(node);
    container.appendChild(row);
  });

  if(activeGroup === QUEST_GROUPS[QUEST_GROUPS.length - 1].id){
  const teaserRow = document.createElement('div');
  teaserRow.className = 'node-row ' + (visible.length % 2 === 0 ? 'right' : 'left');
  const teaserNode = document.createElement('div');
  teaserNode.className = 'node locked teaser-node';
  teaserNode.innerHTML = `
    <div class="node-icon">🔒</div>
    <div class="node-info">
      <div class="node-title">${LOCKED_TEASER.title}</div>
      <div class="node-sub">${LOCKED_TEASER.desc}</div>
    </div>
    <div class="node-status">
      <span class="status-pill">+${toFa(LOCKED_TEASER.count)} مأموریت</span>
    </div>
  `;
  teaserRow.appendChild(teaserNode);
  container.appendChild(teaserRow);
  }

  updateHUD();
  drawPath();
  updateLabLocks();
  updateLabTabLock();
}

let lastEarned = 0, lastLevel = 0;
function updateHUD(){
  const earned = earnedXP(), total = totalXP();
  const pct = Math.round((earned/total)*100);
  const xpFill = document.getElementById('xpFill');
  document.getElementById('xpText').textContent = `${toFa(earned)} / ${toFa(total)} XP`;
  document.getElementById('pctText').textContent = toFa(pct) + '%';
  xpFill.style.width = pct + '%';
  if(earned > lastEarned){
    xpFill.classList.remove('filling'); void xpFill.offsetWidth; xpFill.classList.add('filling');
  }
  const level = Math.min(completedCount(), QUESTS.length);
  const levelEl = document.getElementById('levelNum');
  if(level !== lastLevel){
    animateCount(levelEl, lastLevel, level, 400);
    const badge = document.querySelector('.level-badge');
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
  } else {
    levelEl.textContent = toFa(level);
  }
  lastEarned = earned; lastLevel = level;
}

function toFa(n){
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function drawPath(){
  const svg = document.getElementById('pathSvg');
  const wrap = document.getElementById('pathWrap');
  const nodes = Array.from(container.querySelectorAll('.node'));
  if(nodes.length < 2){ document.getElementById('traceBg').setAttribute('d', ''); document.getElementById('traceFg').setAttribute('d', ''); return; }
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('width', wrapRect.width);
  svg.setAttribute('height', wrapRect.height);
  svg.setAttribute('viewBox', `0 0 ${wrapRect.width} ${wrapRect.height}`);

  let d = '';
  const pts = nodes.map(n => {
    const r = n.getBoundingClientRect();
    const x = (r.left + r.right)/2 - wrapRect.left;
    const y = (r.top + r.bottom)/2 - wrapRect.top;
    return {x,y};
  });
  d = `M ${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length;i++){
    const prev = pts[i-1], cur = pts[i];
    const midY = (prev.y + cur.y)/2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }
  const bg = document.getElementById('traceBg');
  const fg = document.getElementById('traceFg');
  bg.setAttribute('d', d);
  fg.setAttribute('d', d);
  const len = fg.getTotalLength();
  fg.style.strokeDasharray = len;
  const groupQs = QUESTS.filter(q => q.group === activeGroup);
  const doneRatio = groupQs.filter(q => progress[q.id]).length / (groupQs.length - 1 || 1);
  fg.style.strokeDashoffset = len * (1 - Math.min(doneRatio, 1));
}

let currentIndex = null;
const overlay = document.getElementById('overlay');

/* ================= MISSION 1 — LIVE ARDUINO SIMULATOR ================= */
// هر مأموریتی که این‌جا لیست شود، به‌جای دکمه‌ی دستی «تکمیل کردم»،
// با نوشتن و اجرای درست کد در شبیه‌ساز کامل می‌شود.
const SIM_MISSIONS = {
  hello:  { task: 'serial', pin: 8 },
  led:    { task: 'ledOn',  pin: 8 },
  blink:  { task: 'blink',  pin: 8 },
  button: { task: 'button', pin: 8, buttonPin: 2 },
  pot:    { task: 'pot',    pin: 9, potPin: 'A0' },
  servo:  { task: 'servo',  pin: 9 },
  stm32_blink: { task: 'stm32blink', pin: 'PC13' }
};
const modalSim = document.getElementById('modalSim');
const nextMissionBtn = document.getElementById('nextMissionBtn');
let activeSim = null;

/* ================= CONCEPT SIMULATIONS ================= */
// Like SIM_MISSIONS, but for physics concepts instead of Arduino code —
// mount(container, {onSuccess, alreadyDone}) draws its own UI and calls
// onSuccess once the underlying condition is met (mission then auto-completes,
// same as the Arduino sims).
const CONCEPT_SIMS = {
  volt_current: mountVoltCurrentSim,
  resistor_calc: mountResistorCalcSim,
  robot_assemble: mountRobotAssembleSim,
  line_sensor: mountLineSensorMission,
  stm32_cube: mountStm32CubeSim,      // cube-block.js: نقشه‌ی چیپ + آزمایشگاه ساعت
  stm32_stlink: mountStlinkSim,       // اتصال Blue Pill به ST-Link با سیم‌های SWD و آپلود برنامه
  line_read: mountHalReadSim,         // hal-block.js: CubeMX + کدنویسی HAL
  line_logic: mountHalBrainSim,
  line_motors: mountHalMotorSim,
  motor_pwm: mountHalPwmSim,
  line_follow: mountLineFollowSim
};

/* ================= ROBOT ASSEMBLY (robotics step 0) =================
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
      <div class="sim-hw-note">هدف: بدنه‌ی ربات خالی است. نامِ هر قطعه زیرش نوشته شده؛ آن را با انگشت یا موس بگیر و روی جایگاه خط‌چینِ همان نام بینداز. وقتی همه‌ی قطعه‌ها نشستند، ربات را روشن کن.</div>
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

  svg.addEventListener('pointerdown', e => {
    const el = e.target.closest ? e.target.closest('.ra-part') : null;
    if(!el || el.classList.contains('placed') || powered) return;
    const p = parts[el.dataset.id], pt = toPt(e);
    drag = { p, dx: pt.x - p.x, dy: pt.y - p.y, sx: pt.x, sy: pt.y, moved: false };
    el.classList.remove('back');
    svg.appendChild(el);
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
    clearMarks();
    say('running', `✋ «${p.name}» را روی جایگاه خط‌چینِ خودش ببر.`);
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
      say('idle', `💡 «${p.name}» روی جایگاه خط‌چینِ «${target ? target.label : ''}» می‌نشیند. آن را بگیر و ببر.`);
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
   در دو فایل جدا هستند: cube-block.js (نقشه‌ی چیپ و ساعت) و hal-block.js (ادیتور و اجرا).
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

/* ================= PWM CONCEPT DEMO (potentiometer duty-cycle) =================
   Purely explanatory add-on shown above the pot mission's Arduino code
   simulator — not gated to mission completion (no onSuccess call). Lets the
   learner physically feel *why* PWM makes an LED look dimmer: the pin is
   never at a "half" voltage, it just switches HIGH/LOW very fast and the
   fraction of time spent HIGH (duty cycle) is what the eye/LED averages out. */
function mountPwmScopeSim(container){
  container.innerHTML = `
    <div class="sim-wrap pwm-wrap">
      <div class="sim-hw-note">این بخش فقط برای درک بصری PWM است — روی تکمیل مأموریت اثری ندارد.</div>
      <div class="pwm-board">
        <svg class="pwm-svg" viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg">
          <!-- knob -->
          <g class="sim-pot-group" transform="translate(50,45)">
            <circle r="30" class="sim-pot-body"/>
            <circle r="30" class="sim-pot-ring"/>
            <line id="pwmNeedle" x1="0" y1="0" x2="0" y2="-22" class="sim-pot-needle"/>
            <circle cx="0" cy="-22" r="2.6" class="sim-pot-tip"/>
            <circle r="5" class="sim-pot-hub"/>
            <text x="0" y="46" text-anchor="middle" class="sim-caption">پتانسیومتر</text>
            <circle r="34" class="sim-pot-hit"/>
          </g>
          <!-- LED -->
          <g id="pwmLedGroup" class="sim-led-group" transform="translate(50,150)">
            <line class="sim-led-ray" x1="-16" y1="-16" x2="-25" y2="-25"/>
            <line class="sim-led-ray" x1="16" y1="-16" x2="25" y2="-25"/>
            <line class="sim-led-ray" x1="0" y1="-22" x2="0" y2="-33"/>
            <circle r="15" class="sim-led-bulb"/>
          </g>
          <text x="50" y="196" text-anchor="middle" class="sim-caption">LED روی پین PWM</text>
          <!-- oscilloscope -->
          <rect x="112" y="18" width="196" height="150" rx="6" class="pwm-scope-bg"/>
          <text x="120" y="34" class="pwm-scope-label">HIGH (۵V)</text>
          <line x1="112" y1="46" x2="308" y2="46" class="pwm-scope-gridline"/>
          <text x="120" y="150" class="pwm-scope-label">LOW (۰V)</text>
          <line x1="112" y1="140" x2="308" y2="140" class="pwm-scope-gridline"/>
          <path id="pwmWave" class="pwm-wave" fill="none"/>
          <text x="210" y="185" text-anchor="middle" class="pwm-scope-caption">پایه فقط ۵V یا ۰V می‌شود؛ سرعت چشمک آن‌قدر بالاست که چشم فقط افتِ نور را می‌بیند</text>
        </svg>
      </div>
      <div class="sim-controls">
        <label class="sim-hw-note" for="pwmRange">دسته‌ی پتانسیومتر را بچرخان تا duty cycle عوض شود</label>
        <input id="pwmRange" class="sim-pot-range" type="range" min="0" max="100" step="0.1" value="50">
      </div>
      <div class="sim-status" id="pwmStatus" data-state="idle"></div>
    </div>
  `;

  const needle   = container.querySelector('#pwmNeedle');
  const wave     = container.querySelector('#pwmWave');
  const ledGroup = container.querySelector('#pwmLedGroup');
  const range    = container.querySelector('#pwmRange');
  const statusEl = container.querySelector('#pwmStatus');
  const potSvg   = container.querySelector('.pwm-svg');
  const potHit   = container.querySelector('.sim-pot-hit');
  const POT_CX = 50, POT_CY = 45; // knob center in the SVG's own coordinate space (matches its transform)

  // Scope box geometry (matches the <rect> above).
  const X0 = 112, X1 = 308, Y_HIGH = 46, Y_LOW = 140, PERIOD_PX = 49; // ~4 periods across the box

  function waveform(dutyPct){
    const onFrac = dutyPct/100;
    let d = `M ${X0} ${Y_LOW}`;
    let x = X0;
    // draw whole periods left→right: LOW→HIGH→LOW per period
    while(x < X1){
      const onW = PERIOD_PX * onFrac;
      const offW = PERIOD_PX * (1-onFrac);
      const xUp = Math.min(x + 0.001, X1);
      d += ` L ${xUp} ${Y_HIGH}`;
      const xHighEnd = Math.min(x + onW, X1);
      d += ` L ${xHighEnd} ${Y_HIGH}`;
      if(xHighEnd >= X1) break;
      d += ` L ${xHighEnd} ${Y_LOW}`;
      const xLowEnd = Math.min(xHighEnd + offW, X1);
      d += ` L ${xLowEnd} ${Y_LOW}`;
      x = xLowEnd;
      if(onFrac <= 0 || onFrac >= 1) break; // flat line edge-cases, avoid infinite loop
    }
    if(onFrac <= 0) d = `M ${X0} ${Y_LOW} L ${X1} ${Y_LOW}`;
    if(onFrac >= 1) d = `M ${X0} ${Y_HIGH} L ${X1} ${Y_HIGH}`;
    return d;
  }

  function update(){
    const duty = Number(range.value); // 0..100, continuous (fine step) for smooth rotation
    const dutyShown = Math.round(duty); // rounded just for text/labels, not for the motion itself
    const angle = -90 + (duty/100)*180; // -90deg (fully left) .. +90deg (fully right)
    needle.setAttribute('transform', `rotate(${angle})`);
    wave.setAttribute('d', waveform(duty));

    const avgV = (duty/100*5).toFixed(2);
    ledGroup.classList.toggle('is-on', duty > 0);
    ledGroup.style.setProperty('--sim-led-ratio', (duty/100).toFixed(2));

    statusEl.dataset.state = dutyShown === 0 ? 'idle' : dutyShown === 100 ? 'running' : 'success';
    statusEl.textContent = dutyShown === 0
      ? `⚪ duty cycle ۰٪ — پین همیشه LOW می‌ماند، LED کاملاً خاموش.`
      : dutyShown === 100
      ? `🔆 duty cycle ۱۰۰٪ — پین همیشه HIGH می‌ماند، درست مثل digitalWrite(HIGH)، LED با تمام قدرت روشن.`
      : `📟 duty cycle ${toFa(dutyShown)}٪ — به‌طور میانگین گویی ${avgV.replace('.', '٫')}V به LED می‌رسد، پس روشنایی تقریباً ${toFa(dutyShown)}٪ به نظر می‌آید.`;
  }

  function setDutyFromAngle(deg){
    deg = Math.max(-90, Math.min(90, deg));
    range.value = ((deg + 90) / 180) * 100;
    update();
  }

  // Converts a pointer/touch event's screen position into the SVG's own
  // user-space coordinates, regardless of how the viewBox is scaled/fitted
  // on screen — the robust way to do drag math on an SVG element.
  function toSvgPoint(evt){
    const pt = potSvg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(potSvg.getScreenCTM().inverse());
  }

  let dragging = false;
  function angleFromEvent(evt){
    const p = toSvgPoint(evt);
    const dx = p.x - POT_CX, dy = p.y - POT_CY;
    return Math.atan2(dx, -dy) * (180/Math.PI); // 0° = up, +90° = right, -90° = left
  }
  function onPotPointerDown(evt){
    dragging = true;
    potHit.setPointerCapture && potHit.setPointerCapture(evt.pointerId);
    setDutyFromAngle(angleFromEvent(evt));
    evt.preventDefault();
  }
  function onPotPointerMove(evt){
    if(!dragging) return;
    setDutyFromAngle(angleFromEvent(evt));
  }
  function onPotPointerUp(){ dragging = false; }

  potHit.addEventListener('pointerdown', onPotPointerDown);
  potHit.addEventListener('pointermove', onPotPointerMove);
  window.addEventListener('pointerup', onPotPointerUp);

  range.addEventListener('input', update);
  update();

  return {
    stop(){
      range.removeEventListener('input', update);
      potHit.removeEventListener('pointerdown', onPotPointerDown);
      potHit.removeEventListener('pointermove', onPotPointerMove);
      window.removeEventListener('pointerup', onPotPointerUp);
    }
  };
}

/* ================= CONCEPT DEMO: PULL-UP vs PULL-DOWN RESISTOR =================
   Purely explanatory add-on shown above the button mission's Arduino code
   simulator — not gated to mission completion (no onSuccess call). Lets the
   learner flip between the two wiring styles and physically press a button
   to feel why a resting digital pin needs to be tied to a known level:
   in pull-up, the resistor rests the pin at HIGH and pressing the button
   drags it to LOW; in pull-down it's the mirror image. */
function mountPullResistorSim(container){
  // fixed schematic coordinates — shared by both modes, only the component
  // occupying each slot (resistor vs switch) changes
  const VCC_Y = 22, GND_Y = 218, PIN_Y = 120, PIN_X = 150;
  const TOP_TOP = 52, TOP_BOTTOM = 90;   // slot between VCC rail and pin
  const BOT_TOP = 150, BOT_BOTTOM = 188; // slot between pin and GND rail

  let mode = 'pullup';   // 'pullup' | 'pulldown'
  let pressed = false;
  let refs = {};

  function resistorSvg(slotTop, slotBottom){
    const h = slotBottom - slotTop;
    const bandY1 = slotTop + h*0.28, bandY2 = slotTop + h*0.62;
    return `
      <g class="pr-resistor-g">
        <rect x="${PIN_X-12}" y="${slotTop}" width="24" height="${h}" rx="4" class="sim-resistor-body"/>
        <rect x="${PIN_X-12}" y="${bandY1.toFixed(1)}" width="24" height="5" class="sim-band"/>
        <rect x="${PIN_X-12}" y="${bandY2.toFixed(1)}" width="24" height="5" class="sim-band-3"/>
      </g>`;
  }
  function switchSvg(slotTop, slotBottom){
    const cy = (slotTop + slotBottom) / 2;
    return `
      <g class="pr-switch-group" transform="translate(${PIN_X},${cy.toFixed(1)})">
        <rect x="-15" y="-13" width="30" height="26" rx="5" class="pr-switch-base"/>
        <rect x="-10" y="-9" width="20" height="18" rx="4" class="pr-switch-cap"/>
        <rect x="-19" y="-19" width="38" height="38" class="pr-switch-hit"/>
      </g>`;
  }

  function render(){
    const resistorOnTop = mode === 'pullup';
    container.innerHTML = `
      <div class="sim-wrap">
        <div class="sim-hw-note">این بخش فقط برای درک بصری pull-up/pull-down است — روی تکمیل مأموریت اثری ندارد.</div>
        <div class="sim-hw-note">اگر پین ورودی به هیچ‌جا وصل نباشد، شناور می‌ماند و مقداری نامعلوم می‌خواند. یک مقاومت آن را همیشه به یک سطح مشخص می‌چسباند تا فقط با فشردن دکمه تغییر کند — نوع اتصال مقاومت را انتخاب کن و دکمه را نگه‌دار.</div>
        <div class="pr-mode-row">
          <button type="button" class="sim-btn ${mode==='pullup' ? 'sim-btn-run' : 'sim-btn-ghost'}" data-mode="pullup">🔼 Pull-Up</button>
          <button type="button" class="sim-btn ${mode==='pulldown' ? 'sim-btn-run' : 'sim-btn-ghost'}" data-mode="pulldown">🔽 Pull-Down</button>
        </div>
        <div class="sim-board-wrap">
          <svg class="pr-svg" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
            <line x1="60" y1="${VCC_Y}" x2="230" y2="${VCC_Y}" class="pr-rail"/>
            <text x="64" y="${VCC_Y-9}" text-anchor="start" class="pr-rail-label pr-rail-label-vcc">+۵V</text>
            <line x1="60" y1="${GND_Y}" x2="230" y2="${GND_Y}" class="pr-rail"/>
            <text x="64" y="${GND_Y+15}" text-anchor="start" class="pr-rail-label pr-rail-label-gnd">GND</text>

            <line id="prTopWireUpper" x1="${PIN_X}" y1="${VCC_Y}" x2="${PIN_X}" y2="${TOP_TOP}" class="pr-wire"/>
            ${resistorOnTop ? resistorSvg(TOP_TOP, TOP_BOTTOM) : switchSvg(TOP_TOP, TOP_BOTTOM)}
            <line id="prTopWireLower" x1="${PIN_X}" y1="${TOP_BOTTOM}" x2="${PIN_X}" y2="${PIN_Y}" class="pr-wire"/>

            <circle id="prPinDot" cx="${PIN_X}" cy="${PIN_Y}" r="5" class="pr-pin-dot"/>
            <line id="prPinWire" x1="${PIN_X}" y1="${PIN_Y}" x2="234" y2="${PIN_Y}" class="pr-wire"/>
            <text x="${PIN_X}" y="${PIN_Y-12}" text-anchor="middle" class="sim-caption">PIN 2</text>

            <line id="prBotWireUpper" x1="${PIN_X}" y1="${PIN_Y}" x2="${PIN_X}" y2="${BOT_TOP}" class="pr-wire"/>
            ${resistorOnTop ? switchSvg(BOT_TOP, BOT_BOTTOM) : resistorSvg(BOT_TOP, BOT_BOTTOM)}
            <line id="prBotWireLower" x1="${PIN_X}" y1="${BOT_BOTTOM}" x2="${PIN_X}" y2="${GND_Y}" class="pr-wire"/>

            <rect x="234" y="${PIN_Y-20}" width="70" height="40" rx="6" class="sim-monitor-body"/>
            <rect x="240" y="${PIN_Y-14}" width="58" height="28" rx="4" class="sim-monitor-screen"/>
            <text x="269" y="${PIN_Y-24}" text-anchor="middle" class="pr-readout-caption">digitalRead</text>
            <text id="prReadoutText" x="269" y="${PIN_Y+5}" text-anchor="middle" class="sim-monitor-text pr-readout-text">LOW</text>
          </svg>
        </div>
        <button type="button" class="sim-push-key pr-hold-btn" id="prHoldBtn">🔘 دکمه را نگه‌دار</button>
        <div class="sim-status" id="prStatus" data-state="idle"></div>
        <div class="sim-hw-note">🔌 <b>نکته:</b> مدار واقعی که پایین‌تر می‌بینی با <b>INPUT_PULLUP</b> کار می‌کند — برای همین <b>هیچ مقاومتی بین پایه دکمه و VCC وصل نشده است</b>. آن مقاومت پول‌آپ همین‌جاست، فقط داخل خودِ تراشه‌ی آردوینو پنهان شده و با یک خط کد روشن می‌شود؛ نتیجه‌اش هم دقیقاً همین چیزی‌ست که بالا دیدی: دکمه رها → <b>HIGH</b>، دکمه فشرده → <b>LOW</b>.</div>
      </div>
    `;

    refs = {
      topWireUpper: container.querySelector('#prTopWireUpper'),
      topWireLower: container.querySelector('#prTopWireLower'),
      botWireUpper: container.querySelector('#prBotWireUpper'),
      botWireLower: container.querySelector('#prBotWireLower'),
      pinDot: container.querySelector('#prPinDot'),
      pinWire: container.querySelector('#prPinWire'),
      readoutText: container.querySelector('#prReadoutText'),
      switchGroup: container.querySelector('.pr-switch-group'),
      statusEl: container.querySelector('#prStatus'),
      holdBtn: container.querySelector('#prHoldBtn')
    };
    // the resistor <g> can be either the "top" or "bottom" component depending
    // on mode — grab whichever one is actually a resistor this render.
    refs.resistorG = container.querySelector('.pr-resistor-g');

    container.querySelectorAll('.pr-mode-row [data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        if(mode === btn.dataset.mode) return;
        mode = btn.dataset.mode;
        pressed = false;
        render();
      });
    });

    // Press handling is bound identically to two different elements — the
    // switch graphic inside the circuit AND the big hold button below it.
    // setPointerCapture must be called on whichever element actually
    // received the pointerdown (evt.currentTarget), never on a fixed
    // reference to the other one — capturing on the wrong element throws
    // and silently aborts the handler before the state/visual updates.
    function onDown(evt){
      pressed = true;
      const target = evt.currentTarget;
      if(target && target.setPointerCapture && evt.pointerId != null){
        try { target.setPointerCapture(evt.pointerId); } catch(e){ /* ignore */ }
      }
      updateVisual();
      evt.preventDefault();
    }
    function onUp(){ if(pressed){ pressed = false; updateVisual(); } }

    const hit = container.querySelector('.pr-switch-hit');
    if(hit){
      hit.addEventListener('pointerdown', onDown);
      hit.addEventListener('pointerup', onUp);
      hit.addEventListener('pointerleave', onUp);
      hit.addEventListener('pointercancel', onUp);
    }
    refs.holdBtn.addEventListener('pointerdown', onDown);
    refs.holdBtn.addEventListener('pointerup', onUp);
    refs.holdBtn.addEventListener('pointerleave', onUp);
    refs.holdBtn.addEventListener('pointercancel', onUp);

    updateVisual();
  }

  function updateVisual(){
    const high = mode === 'pullup' ? !pressed : pressed;
    const resistorOnTop = mode === 'pullup';
    const resistorLive = !pressed;
    const switchLive = pressed;

    refs.pinDot.classList.toggle('is-high', high);
    refs.pinDot.classList.toggle('is-low', !high);
    refs.readoutText.textContent = high ? 'HIGH' : 'LOW';
    refs.readoutText.classList.toggle('is-high', high);
    refs.readoutText.classList.toggle('is-low', !high);
    refs.pinWire.classList.toggle('is-live', high);

    const topLive = resistorOnTop ? resistorLive : switchLive;
    const botLive = resistorOnTop ? switchLive : resistorLive;
    refs.topWireUpper.classList.toggle('is-live', topLive);
    refs.topWireLower.classList.toggle('is-live', topLive);
    refs.botWireUpper.classList.toggle('is-live', botLive);
    refs.botWireLower.classList.toggle('is-live', botLive);
    if(refs.resistorG) refs.resistorG.classList.toggle('is-live', resistorLive);
    if(refs.switchGroup) refs.switchGroup.classList.toggle('is-pressed', pressed);
    refs.holdBtn.textContent = pressed ? '🔘 در حال فشردن...' : '🔘 دکمه را نگه‌دار';

    refs.statusEl.dataset.state = pressed ? 'running' : 'idle';
    if(mode === 'pullup'){
      refs.statusEl.textContent = pressed
        ? '🖱️ دکمه فشرده شد: پین مستقیم به GND وصل می‌شود و LOW می‌خواند.'
        : '🔼 حالت Pull-Up: مقاومت پین را به +۵V وصل کرده — چون دکمه رهاست، پین HIGH می‌خواند.';
    } else {
      refs.statusEl.textContent = pressed
        ? '🖱️ دکمه فشرده شد: پین مستقیم به +۵V وصل می‌شود و HIGH می‌خواند.'
        : '🔽 حالت Pull-Down: مقاومت پین را به GND وصل کرده — چون دکمه رهاست، پین LOW می‌خواند.';
    }
  }

  render();

  return {
    stop(){
      // render() rebinds fresh listeners on every mode switch and the whole
      // subtree is discarded by the caller on close, so nothing to detach here.
    }
  };
}

// وقتی مأموریت اول باز می‌شود، توضیح می‌دهیم که این مأموریت اختیاری/آزاده:
// می‌شود توضیحات را مطالعه کرد و با اسلایدر امتحانش کرد، یا اگر کسی حوصله‌ی
// خواندن را ندارد همان دکمه‌ی «مطالعه کردم ✓» داخل شبیه‌ساز مأموریت را برایش
// کامل می‌کند و مستقیم به مأموریت بعدی می‌رود.
const FIRST_MISSION_INTRO_TEXT = '📖 این اولین مأموریتته و اختیاریه! می‌تونی توضیحات بالا رو مطالعه کنی و با اسلایدر امتحانش کنی، یا اگه دوست نداری همین‌جوری همون دکمه‌ی «مطالعه کردم ✓» رو بزن تا مأموریت تکمیل بشه و بری سراغ مأموریت بعدی.';
const RESISTOR_CALC_INTRO_TEXT = '🎨 نوارهای رنگی مقاومت رو با منوی کشویی پایین عوض کن تا عدد روی صفحه دقیقاً ۲۲۰ Ω رو نشون بده — همین‌که بهش رسیدی، مأموریت خودکار تکمیل می‌شه!';
const HELLO_MISSION_INTRO_TEXT = '📝 تو این ماموریت باید متن Hello World رو با کد چاپ کنی. اگه برنامه‌نویسی بلد نیستی نگران نباش  از حالت بلوکی استفاده کن و بلوک های متن و سریال رو کنار هم بچین.';

/* راهنمای داخل ادیتور: کدها بین {{ }} نوشته می‌شوند. متن با همان افکت تایپِ بنر می‌آید و هر بار که بنر
   یک حرف اضافه می‌کند، همان لحظه نسخه‌ی رنگیِ همان مقدار متن جایگزین می‌شود. */
const ROBOT_ASSEMBLE_INTRO_TEXT = '🛠️ به بخش رباتیک خوش اومدی! قبل از اینکه ربات راه بیفته، باید خودت بدنه‌ش رو سر هم کنی. هر قطعه رو بگیر و بنداز روی جایگاه خط‌چینِ خودش؛ آخرش هم روشنش کن!';
const STLINK_INTRO_TEXT = '🔌 برد Blue Pill برخلاف آردوینو خودش مبدل USB به سریال و بوت‌لودر نداره، واسه همین برای ریختن برنامه یه «برنامه‌ریز» به اسم ST-Link لازمه. چهار تا سیم رو وصل کن: 3.3V، GND، SWDIO و SWCLK. مواظب ۵ ولت هم باش، چیپ رو می‌سوزونه!';
const LINE_SENSOR_INTRO_TEXT = '🤖 بدنه‌ی ربات آماده‌ست! حالا ربات تعقیب خط یه «چشم» می‌خواد: سنسور مادون‌قرمز. اول بخش توضیحی رو ببین تا بفهمی IR چیه و چرا با چشم فرق داره؛ بعد سنسور رو روی مسیر بکش و آستانه رو جوری تنظیم کن که روی سفید LED خاموش و روی خط مشکی روشن بشه.';

const HAL_INTRO_TEXT = {
  line_read: '📟 حالا خودِ STM32 باید سنسور را بخواند! اول در مرحله‌ی ۱ روی نقشه‌ی چیپ بگو PA0 ورودی است و PC13 خروجی؛ بعد در مرحله‌ی ۲ با HAL_GPIO_ReadPin بخوان و LED را کنترل کن.',
  line_logic: '🧠 سه سنسور، سه چراغ. اول پایه‌ها را در CubeMX تنظیم کن، بعد با if و else if بنویس هر حالت کدام چراغ را روشن کند.',
  line_motors: '⚙️ موتورها با دو پایه‌ی جهت کنترل می‌شوند. اول چهار پایه‌ی PB0 و PB1 و PB10 و PB11 را خروجی کن، بعد حرکت‌ها را با WritePin و HAL_Delay بنویس.',
  motor_pwm: '🎚️ جهت را داری؛ حالا سرعت. پایه‌های PA8 و PA9 را تایمر کن، PWM را قبل از حلقه روشن کن و با __HAL_TIM_SET_COMPARE سرعت بده.'
};

const EDITOR_GUIDE = {
  hello:  (c) => 'اینجا باید دو کار بکنی: ۱) در {{setup()}} با {{Serial.begin(9600)}} ارتباط سریال را باز کن. ۲) با {{Serial.println("Hello World")}} پیام را چاپ کن. بعدش «اجرا کن» را بزن. در حالت بلوکی هم همین دو کار را با بلوک‌های سریال انجام بده.',
  led:    (c) => `برای روشن‌شدن LED در {{setup()}} پین ${c.pin} را با {{pinMode(${c.pin}, OUTPUT)}} خروجی کن و بعد با {{digitalWrite(${c.pin}, HIGH)}} روشنش کن. بعدش «اجرا کن» را بزن.`,
  blink:  (c) => `پین ${c.pin} را در {{setup()}} خروجی کن. در {{loop()}} این چهار خط را پشت‌سرهم بنویس: {{digitalWrite(${c.pin}, HIGH)}} ← {{delay(500)}} ← {{digitalWrite(${c.pin}, LOW)}} ← {{delay(500)}}. بعد اجرا کن.`,
  button: (c) => `در {{setup()}} پین ${c.buttonPin} را {{INPUT_PULLUP}} و پین ${c.pin} را {{OUTPUT}} کن. در {{loop()}} اگر {{digitalRead(${c.buttonPin}) == LOW}} بود (دکمه فشرده است) پین ${c.pin} را {{HIGH}} کن، وگرنه {{LOW}}. بعد اجرا کن و دکمه را فشار بده.`,
  pot:    (c) => `در {{loop()}} مقدار ولوم را با {{analogRead(${c.potPin})}} بخوان، با {{map(v, 0, 1023, 0, 255)}} به بازه‌ی PWM ببر و با {{analogWrite(${c.pin}, ...)}} به LED بده. اجرا کن و ولوم را بچرخان.`,
  stm32_blink: () => 'داخل {{main()}} بعد از راه‌اندازی‌ها، در حلقه‌ی {{while (1)}} این دو خط را بنویس: {{HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13)}} و بعد {{HAL_Delay(500)}}. روی Blue Pill مقدار صفر یعنی LED روشن. بعد «اجرا کن» را بزن.',
  servo:  (c) => `اول {{#include <Servo.h>}} و یک شیء {{Servo}} بساز، بعد در {{setup()}} با {{attach(${c.pin})}} وصلش کن. با یک حلقه‌ی {{for}} زاویه را از ۰ تا ۱۸۰ ببر و در هر مرحله {{servo.write(angle)}} و {{delay(15)}} بگذار. بعد اجرا کن.`
};

function cutHtml(h, k){
  let out = '', open = 0, i = 0;
  while(i < h.length && k > 0){
    if(h[i] === '<'){
      const j = h.indexOf('>', i);
      open += h[i+1] === '/' ? -1 : 1;
      out += h.slice(i, j+1); i = j + 1;
    } else if(h[i] === '&'){
      const j = h.indexOf(';', i);
      out += h.slice(i, j+1); i = j + 1; k--;
    } else { out += h[i++]; k--; }
  }
  return out + '</span>'.repeat(Math.max(open, 0));
}

function showEditorGuide(tpl){
  const parts = tpl.split(/\{\{(.+?)\}\}/g);
  const colored = parts.map((p, i) => i % 2 ? ArduinoSim.highlightArduino(p) : p);
  const plain = parts.map((p, i) => i % 2 ? '\u2066' + p + '\u2069' : p).join('');
  const bare = parts.join('');
  const strip = (s) => s.replace(/[\u2066\u2069]/g, '');
  const htmlFor = (k) => {
    let out = '';
    for(let i = 0; i < parts.length && k > 0; i++){
      const take = Math.min(k, parts[i].length);
      k -= take;
      out += i % 2 ? `<code class="knight-code">${cutHtml(colored[i], take)}</code>` : parts[i].slice(0, take);
    }
    return out;
  };
  const opts = { childList: true, characterData: true, subtree: true };
  const stop = setTimeout(() => obs.disconnect(), 60000);
  const obs = new MutationObserver(() => {
    const cur = strip(knightLine.textContent);
    if(!cur || !bare.startsWith(cur)) return;
    obs.disconnect();
    knightLine.innerHTML = htmlFor(cur.length);
    if(cur.length < bare.length) obs.observe(knightLine, opts); else clearTimeout(stop);
  });
  obs.observe(knightLine, opts);
  showKnightLine(plain, 'happy', 'knight');
}

new MutationObserver(() => {
  if(!document.body.classList.contains('sim-fullscreen-lock') || currentIndex === null) return;
  const q = QUESTS[currentIndex];
  const guide = q && !progress[q.id] && EDITOR_GUIDE[q.id];
  if(!guide) return;
  setTimeout(() => {
    if(document.body.classList.contains('sim-fullscreen-lock')) showEditorGuide(guide(SIM_MISSIONS[q.id]));
  }, 350);
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

function onNodeClick(i, locked, evt){
  const nodeEl = evt && evt.currentTarget;
  if(!locked && QUESTS[i].group !== activeGroup){ activeGroup = QUESTS[i].group; saveActiveGroup(); render(); }
  hideKnightLine();
  if(locked){
    SFX.locked();
    track('mission_locked_attempt', { id: QUESTS[i].id });
    if(nodeEl){
      nodeEl.classList.remove('shake'); void nodeEl.offsetWidth; nodeEl.classList.add('shake');
    }
    showKnightLine(KNIGHT_LOCKED[Math.floor(Math.random()*KNIGHT_LOCKED.length)], 'stern');
    return;
  }
  SFX.open();
  currentIndex = i;
  const q = QUESTS[i];
  track('mission_opened', { id: q.id, title: q.title, already_done: !!progress[q.id] });
  document.getElementById('modalEyebrow').textContent = (q.boss ? '🏆 نبرد آخر' : '🎯 مأموریت') ;
  document.getElementById('modalTitle').textContent = q.title;
  document.getElementById('modalQuote').textContent = q.quote;
  document.getElementById('modalDesc').textContent = q.desc;
  const stepsEl = document.getElementById('modalSteps');
  stepsEl.innerHTML = '';
  q.steps.forEach((s, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="num mono">${idx+1}</span><span>${s}</span>`;
    stepsEl.appendChild(li);
  });
  document.getElementById('modalReward').textContent = `✨ +${toFa(q.xp)} XP`;
  const btn = document.getElementById('completeBtn');
  const done = progress[q.id];

  if(activeSim){ activeSim.stop(); activeSim = null; }
  nextMissionBtn.style.display = 'none';

  // مأموریت اول (ولتاژ-جریان-مقاومت) اختیاریه؛ هر بار که باز می‌شود و هنوز
  // تکمیل نشده، یادآوری می‌کنیم که می‌شود آن را با «مطالعه کردم ✓» هم رد کرد.
  if(q.id === 'volt_current' && !done){
    setTimeout(() => showKnightLine(FIRST_MISSION_INTRO_TEXT, 'happy'), 400);
  }

  // مأموریت محاسبه‌ی مقاومت: هر بار که باز می‌شود و هنوز تکمیل نشده،
  // یادآوری می‌کنیم که هدف رسیدن به دقیقاً ۲۲۰ اهم با تغییر نوارهای رنگی است.
  if(q.id === 'resistor_calc' && !done){
    setTimeout(() => showKnightLine(RESISTOR_CALC_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  // مأموریت چاپ Hello World: هر بار که باز می‌شود و هنوز تکمیل نشده،
  // یادآوری می‌کنیم که باید متن را چاپ کند و اگر کدنویسی بلد نیست از حالت بلوکی استفاده کند.
  if(q.id === 'hello' && !done){
    setTimeout(() => showKnightLine(HELLO_MISSION_INTRO_TEXT, 'happy'), 400);
  }

  if(q.id === 'robot_assemble' && !done){
    setTimeout(() => showKnightLine(ROBOT_ASSEMBLE_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(q.id === 'stm32_stlink' && !done){
    setTimeout(() => showKnightLine(STLINK_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(q.id === 'line_sensor' && !done){
    setTimeout(() => showKnightLine(LINE_SENSOR_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(HAL_INTRO_TEXT[q.id] && !done){
    setTimeout(() => showKnightLine(HAL_INTRO_TEXT[q.id], 'happy', 'knight'), 400);
  }

  const simCfg = SIM_MISSIONS[q.id];
  const conceptMount = CONCEPT_SIMS[q.id];
  if(simCfg){
    // این مأموریت‌ها به‌صورت خودکار توسط شبیه‌ساز (با نوشتن کد درست) تکمیل می‌شوند، نه با کلیک دستی.
    btn.style.display = 'none';
    modalSim.style.display = '';
    modalSim.closest('.modal').classList.add('has-sim');

    let pwmDemo = null;
    let pullDemo = null;
    let arduinoMountEl = modalSim;
    if(q.id === 'pot'){
      // مأموریت پتانسیومتر یک بخش توضیحی/تعاملی اضافه دارد: شبیه‌ساز PWM
      // که duty cycle را روی یک اسیلوسکوپ نشان می‌دهد، پیش از شبیه‌ساز کد آردوینو.
      modalSim.innerHTML = `
        <div id="pwmConceptMount"></div>
        <div id="arduinoSimMount" style="margin-top:14px;"></div>
      `;
      pwmDemo = mountPwmScopeSim(modalSim.querySelector('#pwmConceptMount'));
      arduinoMountEl = modalSim.querySelector('#arduinoSimMount');
    } else if(q.id === 'button'){
      // مأموریت دکمه یک بخش توضیحی/تعاملی اضافه دارد: شبیه‌ساز pull-up/pull-down
      // که نشان می‌دهد پین ورودی در هر حالت به‌طور پیش‌فرض چه مقداری می‌خواند،
      // پیش از شبیه‌ساز کد آردوینو.
      modalSim.innerHTML = `
        <div id="pullConceptMount"></div>
        <div id="arduinoSimMount" style="margin-top:14px;"></div>
      `;
      pullDemo = mountPullResistorSim(modalSim.querySelector('#pullConceptMount'));
      arduinoMountEl = modalSim.querySelector('#arduinoSimMount');
    }

    const arduinoSim = ArduinoSim.mount(arduinoMountEl, {
      missionId: q.id,
      task: simCfg.task,
      pin: simCfg.pin,
      buttonPin: simCfg.buttonPin,
      potPin: simCfg.potPin,
      alreadyDone: done,
      onSuccess: () => {
        completeMission(q, { closeOverlayAfter: null });
        nextMissionBtn.style.display = '';
        nextMissionBtn.textContent = (i + 1 < QUESTS.length) ? 'مأموریت بعدی ⟶' : 'دیدن مسیر';
      }
    });
    activeSim = {
      stop(){ pwmDemo && pwmDemo.stop(); pullDemo && pullDemo.stop(); arduinoSim.stop(); }
    };

    if(done && i + 1 < QUESTS.length){
      nextMissionBtn.style.display = '';
      nextMissionBtn.textContent = 'مأموریت بعدی ⟶';
    }
  } else if(conceptMount){
    // مأموریت‌های مفهومی (فیزیک) هم مثل شبیه‌ساز آردوینو با رسیدن به شرط موفقیت خودکار کامل می‌شوند.
    btn.style.display = 'none';
    modalSim.style.display = '';
    modalSim.closest('.modal').classList.add('has-sim');
    activeSim = conceptMount(modalSim, {
      alreadyDone: done,
      onSuccess: () => {
        completeMission(q, { closeOverlayAfter: null });
        nextMissionBtn.style.display = '';
        nextMissionBtn.textContent = (i + 1 < QUESTS.length) ? 'مأموریت بعدی ⟶' : 'دیدن مسیر';
      }
    });
    if(done && i + 1 < QUESTS.length){
      nextMissionBtn.style.display = '';
      nextMissionBtn.textContent = 'مأموریت بعدی ⟶';
    }
  } else {
    modalSim.style.display = 'none';
    modalSim.closest('.modal').classList.remove('has-sim');
    document.querySelector('.modal .reward-row').style.display = '';
    btn.style.display = '';
    btn.textContent = done ? 'قبلاً تکمیل شده ✓' : 'مأموریت را تکمیل کردم';
    btn.disabled = done;
  }
  openOverlay();
}

function openOverlay(){
  overlay.classList.add('open');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // The modal keeps whatever scroll position the previously-opened mission was
  // left at, so a long mission followed by a short one would open mid-content.
  // Always start every mission panel from its very top.
  const modalEl = overlay.querySelector('.modal');
  overlay.scrollTop = 0;
  if(modalEl) modalEl.scrollTop = 0;
  requestAnimationFrame(() => {
    overlay.scrollTop = 0;
    if(modalEl) modalEl.scrollTop = 0;
  });
}
function closeOverlay(){
  overlay.classList.remove('open');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  if(activeSim){ activeSim.stop(); }
}

// Shared by the manual "مأموریت را تکمیل کردم" button AND the mission-1
// simulator's auto-success callback. `closeOverlayAfter` lets the caller
// keep the modal open (e.g. so the learner can see the LED blinking and
// the success message before choosing to move on).
function completeMission(q, { closeOverlayAfter = 420 } = {}){
  if(progress[q.id]) return;

  progress[q.id] = true;
  saveProgress();

  track('mission_completed', { id: q.id, title: q.title, xp: q.xp, boss: !!q.boss });
  if (completedCount() === QUESTS.length){
    track('game_completed', { total_xp: totalXP() });
  }

  if(q.boss){
    SFX.boss();
    screenFlash();
    confettiBurst(.5, .3, 160, true);
    setTimeout(() => confettiBurst(.2, .4, 90, true), 150);
    setTimeout(() => confettiBurst(.8, .4, 90, true), 300);
  } else {
    SFX.complete();
    screenFlash();
    confettiBurst(.5, .25, 90, false);
  }

  showKnightLine(
    q.boss
      ? 'باورنکردنی است... تو دیگر شاگرد نیستی. تو خودت اکنون یک شوالیه‌ی مدار هستی. 🏆'
      : KNIGHT_AVAILABLE_TOASTS[Math.floor(Math.random()*KNIGHT_AVAILABLE_TOASTS.length)],
    q.boss ? 'powered' : 'wink'
  );

  render();
  // celebrate the freshly completed node in the path
  requestAnimationFrame(() => {
    const doneNode = Array.from(container.querySelectorAll('.node')).find(n =>
      n.querySelector('.node-title').textContent === q.title
    );
    if(doneNode){
      doneNode.classList.add('completing');
      const icon = doneNode.querySelector('.node-icon');
      icon.classList.add('burst');
      setTimeout(() => { doneNode.classList.remove('completing'); icon.classList.remove('burst'); }, 550);
    }
  });

  if(closeOverlayAfter !== null){
    setTimeout(() => closeOverlay(), closeOverlayAfter);
  }
}

document.getElementById('completeBtn').addEventListener('click', (evt) => {
  const q = QUESTS[currentIndex];
  if(progress[q.id]) return;
  ripple(evt.currentTarget, evt);
  completeMission(q);
});

nextMissionBtn.addEventListener('click', (evt) => {
  SFX.click();
  ripple(evt.currentTarget, evt);
  const nextIndex = currentIndex + 1;
  closeOverlay();
  if(nextIndex < QUESTS.length && !isLocked(nextIndex)){
    setTimeout(() => onNodeClick(nextIndex, false), 260);
  }
});

document.getElementById('closeModal').addEventListener('click', () => { SFX.hover(); closeOverlay(); });
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeOverlay(); });

// ResizeObserver catches every layout change that can move the nodes —
// window resize, orientation change, mobile address-bar collapse/expand,
// and font/webfont reflow — not just explicit window resizes.
window.addEventListener('resize', rafThrottle(drawPath));
if(window.ResizeObserver){
  const drawPathRaf = rafThrottle(drawPath);
  new ResizeObserver(drawPathRaf).observe(document.getElementById('pathWrap'));
}
render();

if(TEST_MODE){
  const badge = document.createElement('div');
  badge.className = 'test-badge';
  badge.textContent = '🧪 حالت تست — همه‌ی مراحل باز است';
  document.body.appendChild(badge);
  console.info('[quest] TEST_MODE: all missions and lab cards are unlocked');
}

/* ================= WELCOME POPUP ================= */
const welcomeOverlay = document.getElementById('welcomeOverlay');
function openWelcome(){
  welcomeOverlay.classList.add('open');
  welcomeOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  track('welcome_shown', {});
}
function closeWelcome(){
  welcomeOverlay.classList.remove('open');
  welcomeOverlay.style.display = 'none';
  document.body.style.overflow = '';
  // Bring in the knight's intro line right after the welcome popup goes
  // away, so it doesn't fight the modal for attention. Only the first time.
  if(!closeWelcome.introShown){
    closeWelcome.introShown = true;
    setTimeout(() => showKnightLine(knightIntroText, 'happy'), 350);
  }
}
document.getElementById('welcomeClose').addEventListener('click', () => { SFX.hover(); closeWelcome(); });
document.getElementById('welcomeStartBtn').addEventListener('click', (evt) => {
  ripple(evt.currentTarget, evt);
  SFX.click();
  closeWelcome();
});
welcomeOverlay.addEventListener('click', (e) => { if(e.target === welcomeOverlay) closeWelcome(); });
setTimeout(openWelcome, 300);
