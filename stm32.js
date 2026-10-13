/* ---------- STM32F103C8T6 "Blue Pill" pinout data + renderer ---------- */
const STM32_PINS = {
  left: [
    { name:'3V3', type:'power', desc:'خروجی ۳٫۳ ولت تنظیم‌شده روی برد — تغذیه‌ی ماژول‌های حسگر؛ جریان خروجی محدود است، برای بارهای سنگین مناسب نیست.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'NRST', type:'control', caution:true, desc:'پایه‌ی ریست (فعال در حالت پایین/LOW) — با اتصال لحظه‌ای این پایه به GND، برد ریست می‌شود؛ چون مستقیماً روی راه‌اندازی تراشه اثر می‌گذارد، بدون دلیل به آن چیزی وصل نکن.' },
    { name:'PA0', sub:'ADC0/WKUP', type:'analog', pwm:true, desc:'پایه‌ی همه‌منظوره — هم دیجیتال، هم ورودی آنالوگ (کانال ADC0)، هم می‌تواند برد را از حالت خواب بیدار کند (WKUP)؛ همچنین یکی از چهار کانال PWM تایمر TIM2 است.' },
    { name:'PA1', type:'analog', pwm:true, desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC1) و یکی از کانال‌های PWM تایمر TIM2.' },
    { name:'PA2', type:'analog', pwm:true, sub:'USART2 TX', desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC2)، PWM (TIM2) و فرستنده‌ی سریال (TX) یک پورت UART دوم؛ برای ارتباط با ماژول‌هایی مثل GPS یا بلوتوث بدون درگیر کردن پورت اصلی برنامه‌ریزی مفید است.' },
    { name:'PA3', type:'analog', pwm:true, sub:'USART2 RX', desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC3)، PWM (TIM2) و گیرنده‌ی سریال (RX) همان پورت UART دوم؛ جفتِ PA2.' },
    { name:'PA4', type:'analog', sub:'SPI1 NSS', desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC4) و Chip Select (NSS) پروتکل SPI؛ در ارتباط چندماژولی SPI مشخص می‌کند الان با کدام ماژول کار داری.' },
    { name:'PA5', type:'analog', sub:'SPI1 SCK', desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC5) و خط کلاک (SCK) پروتکل SPI؛ ضربان زمانی ارتباط SPI را می‌زند.' },
    { name:'PA6', type:'analog', pwm:true, sub:'SPI1 MISO', desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC6)، PWM (TIM3) و خط دریافت داده (MISO) پروتکل SPI؛ داده را از ماژول به STM32 برمی‌گرداند.' },
    { name:'PA7', type:'analog', pwm:true, sub:'SPI1 MOSI', desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC7)، PWM (TIM3) و خط ارسال داده (MOSI) پروتکل SPI؛ داده را از STM32 به‌سمت ماژول می‌فرستد.' },
    { name:'PB0', type:'analog', pwm:true, desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC8) و یکی از کانال‌های PWM تایمر TIM3.' },
    { name:'PB1', type:'analog', pwm:true, desc:'پایه‌ی همه‌منظوره — دیجیتال، آنالوگ (ADC9) و یکی از کانال‌های PWM تایمر TIM3.' },
    { name:'PB10', type:'digital', sub:'I2C2 SCL', desc:'پایه‌ی همه‌منظوره دیجیتال — پیش‌فرض خط کلاک I2C (SCL) روی گذرگاه دوم I2C این تراشه؛ برای وصل‌کردن چند ماژول هم‌زمان مثل OLED یا حسگر شتاب با فقط دو سیم.' },
    { name:'PB11', type:'digital', sub:'I2C2 SDA', desc:'پایه‌ی همه‌منظوره دیجیتال — پیش‌فرض خط داده‌ی I2C (SDA) همراه با PB10؛ داده‌ی واقعی پروتکل I2C از همین‌جا رد و بدل می‌شود.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
  ],
  right: [
    { name:'5V', type:'power', desc:'ورودی/خروجی ۵ ولت — برای تغذیه‌ی برد از طریق USB یا این پایه، و تغذیه‌ی ماژول‌های ۵ ولتی وقتی برد از USB برق می‌گیرد.' },
    { name:'GND', type:'ground', desc:'زمین (منفی) مدار — همه‌ی پایه‌های GND روی برد به هم وصل‌اند و باید با زمین مدار بیرونی مشترک باشند.' },
    { name:'PC13', type:'digital', desc:'پایه‌ی دیجیتال — روی خود برد Blue Pill به یک LED کوچک هم وصل است؛ دقیقاً مثل D13 روی Arduino Nano، برای تست سریع کد (چشمک‌زدن LED) عالی است.' },
    { name:'PB12', type:'digital', sub:'SPI2 NSS', desc:'پایه‌ی همه‌منظوره دیجیتال — Chip Select (NSS) گذرگاه دوم SPI این تراشه.' },
    { name:'PB13', type:'digital', sub:'SPI2 SCK', desc:'پایه‌ی همه‌منظوره دیجیتال — خط کلاک (SCK) گذرگاه دوم SPI.' },
    { name:'PB14', type:'digital', sub:'SPI2 MISO', desc:'پایه‌ی همه‌منظوره دیجیتال — خط دریافت داده (MISO) گذرگاه دوم SPI؛ داده را از ماژول به STM32 برمی‌گرداند.' },
    { name:'PB15', type:'digital', sub:'SPI2 MOSI', desc:'پایه‌ی همه‌منظوره دیجیتال — خط ارسال داده (MOSI) گذرگاه دوم SPI؛ داده را از STM32 به‌سمت ماژول می‌فرستد.' },
    { name:'PA8', type:'digital', pwm:true, desc:'پایه‌ی همه‌منظوره دیجیتال — یکی از کانال‌های PWM تایمر TIM1، پرکاربردترین تایمر برای کنترل موتور روی این تراشه.' },
    { name:'PA9', type:'digital', pwm:true, sub:'USART1 TX', desc:'پایه‌ی همه‌منظوره دیجیتال — فرستنده‌ی سریال اصلی (USART1 TX)؛ همان پورتی که معمولاً برای آپلود کد و مانیتور سریال استفاده می‌شود.' },
    { name:'PA10', type:'digital', sub:'USART1 RX', desc:'پایه‌ی همه‌منظوره دیجیتال — گیرنده‌ی سریال اصلی (USART1 RX)، جفتِ PA9؛ داده‌ی ورودی حین آپلود کد از همین‌جا وارد می‌شود.' },
    { name:'PA11', type:'digital', caution:true, sub:'USB D-', desc:'پایه‌ی همه‌منظوره دیجیتال، اما کاربرد اصلی‌اش خط منفی پورت USB داخلی تراشه است (USB D-)؛ اگر از قابلیت USB برد استفاده می‌کنی، این پایه را برای کار دیگری به‌کار نبر.' },
    { name:'PA12', type:'digital', caution:true, sub:'USB D+', desc:'پایه‌ی همه‌منظوره دیجیتال، اما کاربرد اصلی‌اش خط مثبت پورت USB داخلی تراشه است (USB D+)؛ جفتِ PA11، با همان احتیاط.' },
    { name:'PA13', type:'digital', caution:true, sub:'SWDIO', desc:'پایه‌ی دیباگ (SWDIO) — برای برنامه‌ریزی و دیباگ حرفه‌ای‌تر با پروگرمرهایی مثل ST-Link استفاده می‌شود؛ روی این پایه بازی نکن مگر بدانی داری چه‌کار می‌کنی.' },
    { name:'PA14', type:'digital', caution:true, sub:'SWCLK', desc:'پایه‌ی دیباگ (SWCLK) — خط کلاک همان ارتباط دیباگ SWD، همراه PA13.' },
    { name:'PA15', type:'digital', sub:'JTDI', desc:'پایه‌ی همه‌منظوره دیجیتال — در حالت JTAG کامل (به‌جای SWD) نقش JTDI را دارد؛ در استفاده‌ی معمولی هابی، مثل یک پایه‌ی دیجیتال عادی است.' },
    { name:'BOOT0', type:'control', caution:true, desc:'پایه‌ی انتخاب حالت بوت — وضعیت HIGH/LOW آن لحظه‌ی روشن‌شدن یا ریست تعیین می‌کند برد از حافظه‌ی فلش برنامه اجرا کند یا وارد حالت بوت‌لودر برای آپلود کد شود؛ شبیه پایه‌های استرپینگ روی ESP32.' },
  ],
};
function stm32PinColor(type){
  return type==='power' ? '#e8801e' : type==='ground' ? '#8a93a3' : type==='analog' ? '#4aa8ff' : type==='control' ? '#c1554a' : '#57d8a3';
}
function buildStm32PinoutSVG(){
  const VBW=270, VBH=500;
  const boardX=85, boardY=44, boardW=100, boardH=412;
  const n=16, spacing=boardH/n, padLen=20, padT=6;
  function pinsHTML(side){
    return STM32_PINS[side].map((pin,i) => {
      const yc = boardY + spacing*(i+0.5);
      const color = stm32PinColor(pin.type);
      let padX, textX, anchor, hitX;
      if(side==='left'){ padX=boardX-padLen; textX=boardX-padLen-4; anchor='end'; hitX=boardX-72; }
      else { padX=boardX+boardW; textX=boardX+boardW+padLen+4; anchor='start'; hitX=boardX+boardW; }
      const pwmBadge = pin.pwm ? `<tspan fill="#ffb454">~</tspan>` : '';
      const cautionBadge = pin.caution ? `<tspan fill="#ff5c5c">\u26A0\uFE0E</tspan>` : '';
      const badge = pwmBadge + cautionBadge;
      const labelContent = side==='left' ? (badge ? `${badge} ${pin.name}` : pin.name) : (badge ? `${pin.name} ${badge}` : pin.name);
      return `<g class="stm32-pin${pin.pwm?' has-pwm':''}${pin.caution?' has-caution':''}" data-side="${side}" data-idx="${i}">
        <rect class="pin-hit" x="${hitX}" y="${yc-11}" width="72" height="22" fill="transparent"></rect>
        <rect class="pin-pad" x="${padX}" y="${(yc-padT/2).toFixed(1)}" width="${padLen}" height="${padT}" rx="2" fill="${color}"></rect>
        <text class="pin-label" x="${textX}" y="${(yc+3).toFixed(1)}" text-anchor="${anchor}" font-size="8.5" font-family="JetBrains Mono" fill="${color}" direction="ltr">${labelContent}</text>
      </g>`;
    }).join('');
  }
  const chipCx = boardX+boardW/2, chipCy = boardY+boardH*0.32;
  return `<svg class="stm32-svg" viewBox="0 0 ${VBW} ${VBH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="7" fill="#0f1f3d" stroke="#081128" stroke-width="2"></rect>
    <rect x="${chipCx-30}" y="${boardY+10}" width="60" height="50" rx="3" fill="#161d2e" stroke="#000" stroke-width="1"></rect>
    <text x="${chipCx}" y="${boardY+32}" text-anchor="middle" font-size="7" font-family="JetBrains Mono" fill="#9aa0aa" direction="ltr">STM32F103</text>
    <text x="${chipCx}" y="${boardY+44}" text-anchor="middle" font-size="6.5" font-family="Vazirmatn" fill="#6b83a3" direction="ltr">C8T6</text>
    <circle cx="${boardX+boardW/2-2}" cy="${boardY+boardH-14}" r="3.5" fill="#ff5c5c"></circle>
    <text x="${boardX+boardW/2}" y="${boardY+boardH+18}" text-anchor="middle" font-size="9.5" font-family="JetBrains Mono" fill="#d4af37" direction="ltr">STM32 Blue Pill</text>
    ${pinsHTML('left')}
    ${pinsHTML('right')}
  </svg>`;
}
