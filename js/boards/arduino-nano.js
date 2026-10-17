/* ---------- Arduino Nano pinout data + renderer ---------- */
const ARDUINO_NANO_PINS = {
  left: [
    { name:'D13', type:'digital', desc:'پایه‌ی دیجیتال ۱۳ — روی خود برد Nano به یک LED کوچک هم وصل است؛ برای تست سریع کد (چشمک‌زدن LED) عالی است.' },
    { name:'3V3', type:'power', desc:'خروجی ۳٫۳ ولت تنظیم‌شده — برای تغذیه‌ی ماژول‌های حساس ۳٫۳ ولتی؛ جریان خروجی محدود است (حدود ۵۰ میلی‌آمپر).' },
    { name:'REF', type:'power', desc:'ولتاژ مرجع خارجی برای مبدل آنالوگ‌به‌دیجیتال (ADC) — معمولاً بدون اتصال رها می‌شود و پیش‌فرض ۵ ولت استفاده می‌شود.' },
    { name:'A0', type:'analog', desc:'ورودی آنالوگ ۰ — ولتاژی بین ۰ تا ۵ ولت را می‌خواند و به عددی بین ۰ تا ۱۰۲۳ تبدیل می‌کند؛ برای پتانسیومتر، حسگر دما و مانند آن.' },
    { name:'A1', type:'analog', desc:'ورودی آنالوگ ۱ — مثل A0، یک ورودی آنالوگ همه‌منظوره.' },
    { name:'A2', type:'analog', desc:'ورودی آنالوگ ۲ — مثل A0، یک ورودی آنالوگ همه‌منظوره.' },
    { name:'A3', type:'analog', desc:'ورودی آنالوگ ۳ — مثل A0، یک ورودی آنالوگ همه‌منظوره.' },
    { name:'A4', sub:'SDA', type:'analog', desc:'ورودی آنالوگ ۴ / خط داده‌ی I2C — I2C (به‌اختصار «آی‌دو‌سی») یک روش ارتباطی است که با فقط دو سیم می‌شود چند ماژول را هم‌زمان به آردوینو وصل کرد، مثل صفحه‌نمایش OLED یا حسگر شتاب؛ SDA (Serial Data) همان سیمی است که واقعاً داده رویش رد و بدل می‌شود.' },
    { name:'A5', sub:'SCL', type:'analog', desc:'ورودی آنالوگ ۵ / خط کلاک I2C — SCL (Serial Clock) سیم دوم پروتکل I2C است؛ مثل یک متروموم، ضربان زمانی می‌زند تا آردوینو و ماژول بدانند دقیقاً کِی باید داده روی سیم SDA (پایه‌ی A4) را بخوانند یا بنویسند.' },
    { name:'A6', type:'analog', io:'in', desc:'ورودی آنالوگ ۶ — فقط ورودی آنالوگ است؛ برخلاف A0 تا A5 نمی‌تواند به‌عنوان دیجیتال استفاده شود.' },
    { name:'A7', type:'analog', io:'in', desc:'ورودی آنالوگ ۷ — مثل A6، فقط ورودی آنالوگ است.' },
    { name:'5V', type:'power', desc:'خروجی ۵ ولت تنظیم‌شده‌ی روی برد — وقتی از USB یا VIN تغذیه شده باشد، می‌تواند به ماژول‌های ۵ ولتی برق بدهد.' },
    { name:'RST', type:'control', desc:'با اتصال این پایه به GND، برد ریست می‌شود و برنامه از ابتدا اجرا می‌شود — دکمه‌ی ریست روی برد هم همین کار را می‌کند.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'VIN', type:'power', desc:'ورودی ولتاژ خام (معمولاً ۷ تا ۱۲ ولت) — برای تغذیه‌ی برد از باتری یا آداپتور، بدون استفاده از USB.' },
  ],
  right: [
    { name:'D12', type:'digital', desc:'پایه‌ی دیجیتال ۱۲ — ورودی یا خروجی دیجیتال عمومی (HIGH یا LOW).' },
    { name:'D11', type:'digital', pwm:true, desc:'پایه‌ی دیجیتال ۱۱ (PWM ~) — می‌تواند به‌جای فقط روشن/خاموش، یک سیگنال شبه‌آنالوگ تولید کند؛ برای کنترل روشنایی LED یا سرعت موتور.' },
    { name:'D10', type:'digital', pwm:true, desc:'پایه‌ی دیجیتال ۱۰ (PWM ~) — مثل D11، خروجی PWM هم دارد.' },
    { name:'D9', type:'digital', pwm:true, desc:'پایه‌ی دیجیتال ۹ (PWM ~) — مثل D11، خروجی PWM هم دارد.' },
    { name:'D8', type:'digital', desc:'پایه‌ی دیجیتال ۸ — ورودی/خروجی دیجیتال عمومی.' },
    { name:'D7', type:'digital', desc:'پایه‌ی دیجیتال ۷ — ورودی/خروجی دیجیتال عمومی.' },
    { name:'D6', type:'digital', pwm:true, desc:'پایه‌ی دیجیتال ۶ (PWM ~) — خروجی PWM هم دارد.' },
    { name:'D5', type:'digital', pwm:true, desc:'پایه‌ی دیجیتال ۵ (PWM ~) — خروجی PWM هم دارد.' },
    { name:'D4', type:'digital', desc:'پایه‌ی دیجیتال ۴ — ورودی/خروجی دیجیتال عمومی.' },
    { name:'D3', type:'digital', pwm:true, desc:'پایه‌ی دیجیتال ۳ (PWM ~) — خروجی PWM هم دارد.' },
    { name:'D2', type:'digital', desc:'پایه‌ی دیجیتال ۲ — ورودی/خروجی دیجیتال عمومی؛ معمولاً برای وقفه‌های خارجی (interrupt) هم استفاده می‌شود.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'RST', type:'control', desc:'با اتصال این پایه به GND، برد ریست می‌شود و برنامه از ابتدا اجرا می‌شود — دکمه‌ی ریست روی برد هم همین کار را می‌کند.' },
    { name:'RX0', sub:'D0', type:'digital', caution:true, desc:'گیرنده‌ی سریال (RX = Receive) / همان D0 — UART یک روش ساده برای رد و بدل داده بین دو دستگاه است، شبیه یک مکالمه‌ی تلفنی دوطرفه؛ این پایه «گوش» آردوینو است و داده‌ی ورودی از دستگاهی مثل ماژول بلوتوث یا GPS را دریافت می‌کند. حین آپلود کد بهتر است چیزی به آن وصل نباشد.' },
    { name:'TX1', sub:'D1', type:'digital', caution:true, desc:'فرستنده‌ی سریال (TX = Transmit) / همان D1 — «دهانِ» آردوینو در ارتباط UART؛ داده را به دستگاه دیگر می‌فرستد. برای این‌که ارتباط کار کند، باید این پایه به پایه‌ی RX دستگاه مقابل وصل شود (و برعکس).' },
  ],
};
function nanoPinColor(type){
  return type==='power' ? '#e8801e' : type==='ground' ? '#8a93a3' : type==='analog' ? '#4aa8ff' : type==='control' ? '#c1554a' : '#57d8a3';
}
function buildNanoPinoutSVG(){
  const VBW=260, VBH=470;
  const boardX=80, boardY=40, boardW=100, boardH=390;
  const n=15, spacing=boardH/n, padLen=20, padT=6;
  function pinsHTML(side){
    return ARDUINO_NANO_PINS[side].map((pin,i) => {
      const yc = boardY + spacing*(i+0.5);
      const color = nanoPinColor(pin.type);
      let padX, textX, anchor, hitX;
      if(side==='left'){ padX=boardX-padLen; textX=boardX-padLen-4; anchor='end'; hitX=boardX-72; }
      else { padX=boardX+boardW; textX=boardX+boardW+padLen+4; anchor='start'; hitX=boardX+boardW; }
      const pwmBadge = pin.pwm ? `<tspan fill="#ffb454">~</tspan>` : '';
      const cautionBadge = pin.caution ? `<tspan fill="#ff5c5c">\u26A0\uFE0E</tspan>` : '';
      const badge = pwmBadge + cautionBadge;
      const labelContent = side==='left' ? (badge ? `${badge} ${pin.name}` : pin.name) : (badge ? `${pin.name} ${badge}` : pin.name);
      return `<g class="nano-pin${pin.pwm?' has-pwm':''}${pin.caution?' has-caution':''}" data-side="${side}" data-idx="${i}">
        <rect class="pin-hit" x="${hitX}" y="${yc-12}" width="72" height="24" fill="transparent"></rect>
        <rect class="pin-pad" x="${padX}" y="${(yc-padT/2).toFixed(1)}" width="${padLen}" height="${padT}" rx="2" fill="${color}"></rect>
        <text class="pin-label" x="${textX}" y="${(yc+3).toFixed(1)}" text-anchor="${anchor}" font-size="9" font-family="JetBrains Mono" fill="${color}" direction="ltr">${labelContent}</text>
      </g>`;
    }).join('');
  }
  const chipCx = boardX+boardW/2, chipCy = boardY+boardH/2;
  return `<svg class="nano-svg" viewBox="0 0 ${VBW} ${VBH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="7" fill="#0f3d2b" stroke="#08251a" stroke-width="2"></rect>
    <rect x="${chipCx-32}" y="${chipCy-38}" width="64" height="76" rx="3" fill="#161616" stroke="#000" stroke-width="1"></rect>
    <text x="${chipCx}" y="${chipCy}" transform="rotate(-90 ${chipCx} ${chipCy})" text-anchor="middle" font-size="9" font-family="JetBrains Mono" fill="#9aa0aa" direction="ltr">ATmega328P</text>
    <rect x="${boardX+boardW/2-14}" y="${boardY-16}" width="28" height="18" rx="2" fill="#b9bec7" stroke="#6b7280" stroke-width="1"></rect>
    <text x="${boardX+boardW/2}" y="${boardY-20}" text-anchor="middle" font-size="8" font-family="Vazirmatn" fill="#6b7280" direction="ltr">USB</text>
    <text x="${boardX+boardW/2}" y="${boardY+boardH+18}" text-anchor="middle" font-size="10" font-family="JetBrains Mono" fill="#d4af37" direction="ltr">Arduino Nano</text>
    ${pinsHTML('left')}
    ${pinsHTML('right')}
  </svg>`;
}

/* ---------- microcontroller concept blocks ---------- */
const MCU_BLOCKS = [
  { icon:'⚙️', name:'واحد پردازش (CPU)', desc:'مغز میکروکنترلر — دستورات برنامه را یکی‌یکی می‌خواند و اجرا می‌کند؛ سرعتش با مگاهرتز اندازه‌گیری می‌شود (روی Arduino Nano: ۱۶ MHz).' },
  { icon:'💾', name:'حافظه‌ی برنامه (Flash)', desc:'کدی که آپلود می‌کنی همین‌جا ذخیره می‌شود و حتی با قطع برق هم پاک نمی‌شود — روی Arduino Nano حدود ۳۲ کیلوبایت است.' },
  { icon:'🧮', name:'حافظه‌ی موقت (RAM)', desc:'متغیرها حین اجرای برنامه اینجا نگه داشته می‌شوند؛ خیلی کوچک‌تر از Flash است و با قطع برق کاملاً پاک می‌شود.' },
  { icon:'📌', name:'پایه‌های ورودی/خروجی (GPIO)', desc:'پل ارتباطی میکروکنترلر با دنیای بیرون — روشن/خاموش کردن LED، خواندن دکمه، کنترل موتور و مانند آن، همگی از همین پایه‌ها انجام می‌شود.' },
  { icon:'📈', name:'مبدل آنالوگ‌به‌دیجیتال (ADC)', desc:'ولتاژهای پیوسته (مثل خروجی یک حسگر یا پتانسیومتر) را به عددی قابل فهم برای برنامه تبدیل می‌کند.' },
  { icon:'⏱️', name:'کریستال / کلاک', desc:'مثل ضربان قلب — با فرکانس ثابتی تیک می‌زند تا همه‌ی بخش‌های تراشه هماهنگ و هم‌زمان کار کنند.' },
];

