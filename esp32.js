/* ---------- ESP32 (DevKit V1, 30-pin) pinout data + renderer ---------- */
const ESP32_PINS = {
  left: [
    { name:'3V3', type:'power', desc:'خروجی ۳٫۳ ولت تنظیم‌شده روی برد — تغذیه‌ی ماژول‌های حسگر؛ جریان خروجی محدود است، برای بارهای سنگین (مثل موتور) مناسب نیست.' },
    { name:'EN', type:'control', desc:'پایه‌ی Enable/Reset تراشه — با اتصال به GND، برد ریست می‌شود؛ دکمه‌ی EN روی خود برد همین کار را انجام می‌دهد.' },
    { name:'VP', sub:'GPIO36', type:'analog', io:'in', desc:'ورودی آنالوگ فقط‌ورودی — ADC یعنی مبدل آنالوگ‌به‌دیجیتال: ولتاژی بین ۰ تا ۳٫۳ ولت را می‌خواند و به عددی قابل‌فهم برای برنامه تبدیل می‌کند؛ کاربرد معمول: خواندن پتانسیومتر، حسگر نور یا دما. برخلاف بیشتر پایه‌ها، این پایه فقط می‌تواند بخواند و نمی‌تواند خروجی دیجیتال (روشن/خاموش) بدهد.' },
    { name:'VN', sub:'GPIO39', type:'analog', io:'in', desc:'ورودی آنالوگ فقط‌ورودی — درست مثل VP/GPIO36 کار می‌کند؛ ولتاژ را می‌خواند اما نمی‌تواند خروجی دیجیتال بدهد.' },
    { name:'GPIO34', type:'analog', io:'in', desc:'ورودی آنالوگ فقط‌ورودی — مثل VP و VN، فقط برای خواندن ولتاژ (مثلاً از یک حسگر) به‌کار می‌رود و نمی‌تواند به‌عنوان خروجی دیجیتال استفاده شود.' },
    { name:'GPIO35', type:'analog', io:'in', desc:'ورودی آنالوگ فقط‌ورودی — مشابه GPIO34، فقط خواندن ولتاژ را پشتیبانی می‌کند.' },
    { name:'GPIO32', type:'digital', pwm:true, sub:'ADC1/Touch9', desc:'پایه‌ی همه‌منظوره — هم می‌تواند دیجیتال (روشن/خاموش) باشد، هم ولتاژ آنالوگ بخواند، هم به‌عنوان حسگر لمسی خازنی (Touch) کار کند: یعنی بدون فشردن، فقط با نزدیک‌شدن انگشتت به یک سیم یا صفحه‌ی فلزی وصل به این پایه، تشخیص می‌دهد لمس شده‌ای یا نه — مثل دکمه‌های لمسی روی وسایل امروزی.' },
    { name:'GPIO33', type:'digital', pwm:true, sub:'ADC1/Touch8', desc:'پایه‌ی همه‌منظوره — مثل GPIO32؛ هم دیجیتال، هم آنالوگ، هم حسگر لمسی (Touch) را پشتیبانی می‌کند.' },
    { name:'GPIO25', type:'digital', pwm:true, sub:'ADC2/DAC1', desc:'پایه‌ی همه‌منظوره با یک قابلیت ویژه: DAC — برخلاف PWM که فقط با روشن/خاموش سریع وانمود می‌کند آنالوگ است، DAC می‌تواند یک ولتاژ آنالوگ واقعی و پیوسته تولید کند؛ کاربرد: پخش صدای ساده یا تولید یک موج دلخواه.' },
    { name:'GPIO26', type:'digital', pwm:true, sub:'ADC2/DAC2', desc:'مثل GPIO25، خروجی DAC واقعی دومین کانال (DAC2) دارد — برای تولید سیگنال آنالوگ یا صدای ساده.' },
    { name:'GPIO27', type:'digital', pwm:true, sub:'ADC2/Touch7', desc:'پایه‌ی همه‌منظوره — هم دیجیتال، هم آنالوگ (ADC2)، هم حسگر لمسی. نکته: پایه‌های ADC2 وقتی Wi-Fi فعال است می‌توانند غیرقابل‌اعتماد شوند؛ برای خواندن دقیق ولتاژ، ترجیحاً از پایه‌های ADC1 (مثل GPIO32 تا 39) استفاده کن.' },
    { name:'GPIO14', type:'digital', pwm:true, sub:'ADC2/Touch6', desc:'پایه‌ی همه‌منظوره — همچنین می‌تواند خط کلاک (CLK) یک ارتباط SPI دوم (به‌نام HSPI) باشد؛ SPI یک روش ارتباطی سریع و چهارسیمه برای وصل‌کردن ماژول‌هایی مثل کارت‌حافظه یا صفحه‌نمایش است.' },
    { name:'GPIO12', type:'digital', pwm:true, sub:'ADC2/Touch5', caution:true, desc:'پایه‌ی همه‌منظوره، اما پایه‌ی «استرپینگ» (Strapping) است — یعنی وضعیت HIGH/LOW آن دقیقاً لحظه‌ی روشن‌شدن برد، تنظیمات داخلی مهمی (مثل ولتاژ حافظه‌ی فلش) را تعیین می‌کند؛ برای جلوگیری از مشکل در بوت، بهتر است حین روشن‌شدن چیزی به آن وصل نباشد.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'GPIO13', type:'digital', pwm:true, sub:'ADC2/Touch4', desc:'پایه‌ی همه‌منظوره — هم دیجیتال، هم آنالوگ (ADC2)، هم حسگر لمسی؛ بدون کاربرد ویژه‌ی دیگر، برای استفاده‌ی آزاد در پروژه مناسب است.' },
  ],
  right: [
    { name:'VIN', type:'power', desc:'ورودی ولتاژ خام (معمولاً ۵ ولت، از طریق USB یا مستقیماً این پایه) — برای تغذیه‌ی برد از باتری یا آداپتور.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'GPIO23', type:'digital', pwm:true, sub:'VSPI MOSI', desc:'پایه‌ی همه‌منظوره دیجیتال — همچنین خط MOSI (Master Out, Slave In) در پروتکل SPI است. SPI یک روش ارتباطی سریع با چند سیم است؛ ESP32 معمولاً «رئیس» (Master) ارتباط است و MOSI مسیری است که ازش داده به‌سمت ماژول (مثل کارت‌حافظه SD یا صفحه‌نمایش TFT) می‌فرستد.' },
    { name:'GPIO22', type:'digital', pwm:true, sub:'I2C SCL', desc:'پایه‌ی همه‌منظوره دیجیتال — پیش‌فرض خط کلاک I2C (SCL = Serial Clock) روی اکثر بردهای ESP32. I2C با فقط دو سیم (SCL و SDA) اجازه می‌دهد چند ماژول هم‌زمان به ESP32 وصل شوند؛ SCL مثل یک متروموم، ضربان زمانی ارتباط را می‌زند.' },
    { name:'TX0', sub:'GPIO1', type:'digital', pwm:true, caution:true, desc:'فرستنده‌ی سریال اصلی (TXD = Transmit Data، پروتکل UART0) — UART یک روش ساده برای رد و بدل داده بین دو دستگاه است. این پایه هنگام آپلود کد و باز کردن مانیتور سریال، اطلاعات را به کامپیوتر می‌فرستد؛ بهتر است حین آپلود چیزی به آن وصل نباشد.' },
    { name:'RX0', sub:'GPIO3', type:'digital', pwm:true, caution:true, desc:'گیرنده‌ی سریال اصلی (RXD = Receive Data، پروتکل UART0) — جفتِ TX0؛ داده‌ی ورودی از کامپیوتر (مثل کد جدید در زمان آپلود) از همین‌جا وارد ESP32 می‌شود.' },
    { name:'GPIO21', type:'digital', pwm:true, sub:'I2C SDA', desc:'پایه‌ی همه‌منظوره دیجیتال — پیش‌فرض خط داده‌ی I2C (SDA = Serial Data) روی اکثر بردهای ESP32؛ داده‌ی واقعی بین ESP32 و ماژول‌هایی مثل صفحه‌نمایش OLED یا حسگر شتاب از همین سیم رد و بدل می‌شود (همراه با SCL روی GPIO22).' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'GPIO19', type:'digital', pwm:true, sub:'VSPI MISO', desc:'پایه‌ی همه‌منظوره دیجیتال — همچنین خط MISO (Master In, Slave Out) در پروتکل SPI؛ جفتِ MOSI، ولی برعکس آن، داده را از ماژول به‌سمت ESP32 برمی‌گرداند (مثلاً خواندن فایل از کارت‌حافظه SD).' },
    { name:'GPIO18', type:'digital', pwm:true, sub:'VSPI CLK', desc:'پایه‌ی همه‌منظوره دیجیتال — همچنین خط کلاک (CLK) پروتکل SPI؛ مثل SCL در I2C، سرعت و زمان‌بندی انتقال داده روی MOSI/MISO را هماهنگ می‌کند.' },
    { name:'GPIO5', type:'digital', pwm:true, sub:'VSPI CS0', caution:true, desc:'پایه‌ی همه‌منظوره دیجیتال، هم پایه‌ی استرپینگ — همچنین می‌تواند Chip Select (به‌اختصار CS، گاهی SS) پروتکل SPI باشد: وقتی چند ماژول روی یک باس SPI مشترک‌اند، با پایین‌آوردن این خط به ESP32 می‌گویی «الان فقط با همین ماژول کار کن». چون پایه‌ی استرپینگ هم هست، حین بوت بهتر است حالتش دستکاری نشود.' },
    { name:'GPIO17', type:'digital', pwm:true, sub:'UART2 TX', desc:'پایه‌ی همه‌منظوره دیجیتال — می‌تواند فرستنده‌ی یک پورت سریال دوم و مستقل (UART2) باشد؛ کاربرد: وقتی هم‌زمان با دو دستگاه سریال (مثلاً GPS و ماژول بلوتوث) کار داری، بدون تداخل با پورت اصلی (TX0/RX0).' },
    { name:'GPIO16', type:'digital', pwm:true, sub:'UART2 RX', desc:'پایه‌ی همه‌منظوره دیجیتال — گیرنده‌ی همان پورت سریال دوم (UART2)، جفتِ GPIO17.' },
    { name:'GPIO4', type:'digital', pwm:true, sub:'ADC2/Touch0', desc:'پایه‌ی همه‌منظوره — هم دیجیتال، هم آنالوگ (ADC2)، هم حسگر لمسی؛ بدون کاربرد ویژه‌ی دیگر.' },
    { name:'GPIO2', type:'digital', pwm:true, sub:'Touch2', caution:true, desc:'پایه‌ی همه‌منظوره، هم پایه‌ی استرپینگ — روی بیشتر بردهای ESP32 به LED آبی روی خود برد هم وصل است؛ برای تست سریع کد (چشمک‌زدن LED) عالی است، دقیقاً مثل D13 روی Arduino Nano.' },
  ],
};
function esp32PinColor(type){
  return type==='power' ? '#e8801e' : type==='ground' ? '#8a93a3' : type==='analog' ? '#4aa8ff' : type==='control' ? '#c1554a' : '#57d8a3';
}
function buildEsp32PinoutSVG(){
  const VBW=270, VBH=470;
  const boardX=85, boardY=44, boardW=100, boardH=382;
  const n=15, spacing=boardH/n, padLen=20, padT=6;
  function pinsHTML(side){
    return ESP32_PINS[side].map((pin,i) => {
      const yc = boardY + spacing*(i+0.5);
      const color = esp32PinColor(pin.type);
      let padX, textX, anchor, hitX;
      if(side==='left'){ padX=boardX-padLen; textX=boardX-padLen-4; anchor='end'; hitX=boardX-72; }
      else { padX=boardX+boardW; textX=boardX+boardW+padLen+4; anchor='start'; hitX=boardX+boardW; }
      const pwmBadge = pin.pwm ? `<tspan fill="#ffb454">~</tspan>` : '';
      const cautionBadge = pin.caution ? `<tspan fill="#ff5c5c">\u26A0\uFE0E</tspan>` : '';
      const badge = pwmBadge + cautionBadge;
      const labelContent = side==='left' ? (badge ? `${badge} ${pin.name}` : pin.name) : (badge ? `${pin.name} ${badge}` : pin.name);
      return `<g class="esp32-pin${pin.pwm?' has-pwm':''}${pin.caution?' has-caution':''}" data-side="${side}" data-idx="${i}">
        <rect class="pin-hit" x="${hitX}" y="${yc-12}" width="72" height="24" fill="transparent"></rect>
        <rect class="pin-pad" x="${padX}" y="${(yc-padT/2).toFixed(1)}" width="${padLen}" height="${padT}" rx="2" fill="${color}"></rect>
        <text class="pin-label" x="${textX}" y="${(yc+3).toFixed(1)}" text-anchor="${anchor}" font-size="9" font-family="JetBrains Mono" fill="${color}" direction="ltr">${labelContent}</text>
      </g>`;
    }).join('');
  }
  const chipCx = boardX+boardW/2, chipCy = boardY+boardH*0.34;
  const antCx = boardX+boardW/2, antY = boardY+18;
  return `<svg class="esp32-svg" viewBox="0 0 ${VBW} ${VBH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="7" fill="#0f2a3d" stroke="#08182a" stroke-width="2"></rect>
    <rect x="${chipCx-34}" y="${boardY+10}" width="68" height="60" rx="3" fill="#1a2632" stroke="#000" stroke-width="1"></rect>
    <text x="${chipCx}" y="${boardY+34}" text-anchor="middle" font-size="7.5" font-family="JetBrains Mono" fill="#9aa0aa" direction="ltr">ESP32-WROOM</text>
    <text x="${chipCx}" y="${boardY+46}" text-anchor="middle" font-size="7" font-family="Vazirmatn" fill="#6b8ba3" direction="ltr">Wi-Fi + BLE</text>
    <path d="M ${antCx-14} ${antY} q 14 -18 28 0" fill="none" stroke="#4aa8ff" stroke-width="1.4" opacity="0.7"></path>
    <path d="M ${antCx-9} ${antY+5} q 9 -11 18 0" fill="none" stroke="#4aa8ff" stroke-width="1.4" opacity="0.85"></path>
    <rect x="${boardX+boardW/2-13}" y="${boardY+boardH-26}" width="26" height="16" rx="2" fill="#b9bec7" stroke="#6b7280" stroke-width="1"></rect>
    <text x="${boardX+boardW/2}" y="${boardY+boardH-30}" text-anchor="middle" font-size="7.5" font-family="Vazirmatn" fill="#6b7280" direction="ltr">USB</text>
    <text x="${boardX+boardW/2}" y="${boardY+boardH+18}" text-anchor="middle" font-size="9.5" font-family="JetBrains Mono" fill="#d4af37" direction="ltr">ESP32 DevKit V1</text>
    ${pinsHTML('left')}
    ${pinsHTML('right')}
  </svg>`;
}
