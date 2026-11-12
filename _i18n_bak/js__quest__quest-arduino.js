/* ========================================================================
   QUEST-ARDUINO.JS — بخش آردوینو
   داده‌ی مأموریت‌ها (QUESTS_ARDUINO) + شبیه‌سازها
   QUESTS_ARDUINO + mountPwmScopeSim / mountPullResistorSim
   ======================================================================== */

const QUESTS_ARDUINO = [
  { id:'hello', icon:'📝', section:{ icon:'⚡', title:'بخش آردوینو', sub:'آردوینو یک برد الکترونیکیِ کوچک با یک میکروکنترلر است؛ مثلِ یک مغزِ ساده که با کد بهش می‌گویی LED را روشن کند، دکمه را بخواند یا موتور را بچرخاند. نوشتنش آسان است و برای شروعِ برنامه‌نویسیِ سخت‌افزار انتخابِ خوبی است.' }, title:'چاپ Hello World', sub:'گام صفر — اولین برنامه و سریال مانیتور',
    xp:30,
    quote:'«برد و کامپیوتر برای حرف زدن با هم به یک ارتباط سریال نیاز دارند که با تابع Serial.begin باز می‌شود. عددی که به آن می‌دهی، مثل ۹۶۰۰، سرعت رد و بدل شدن داده را مشخص می‌کند و باید در برد و در سریال مانیتور کامپیوتر یکسان باشد، وگرنه پیام‌ها به‌جای متن خوانا، علامت‌های نامفهوم نشان داده می‌شوند.»',
    desc:'ساده‌ترین شروع ممکن: هیچ سیم و قطعه‌ای لازم نیست. فقط یک پیام از برد به کامپیوتر بفرست و آن را در سریال مانیتور ببین.',
    steps:[
      'در `setup()` با `Serial.begin()` ارتباط سریال را باز کن (مثلاً ۹۶۰۰).',
      'با `Serial.println("Hello World")` پیام را چاپ کن.',
      'دکمه «اجرا کن» را بزن و خروجی را در کنسول سریال پایین ببین.'
    ]},
  { id:'led', icon:'💡', title:'روشن‌کردن یک LED', sub:'گام اول — خروجی دیجیتال و مقاومت',
    xp:40,
    quote:'«LED مثل یک دریچه‌ی یک‌طرفه است که فقط در یک جهت جریان را رد می‌کند و خودش تقریباً هیچ مقاومتی جلوی جریان نمی‌گذارد. برای همین اگر مستقیم به باتری وصل شود، جریان به‌شدت بالا می‌رود و در چند لحظه می‌سوزد. یک مقاومت ساده، جلوی این جریان اضافه را می‌گیرد و اجازه می‌دهد LED با شدت درست و ایمن روشن بماند.»',
    desc:'حالا فقط یک LED را روشن کن — بدون چشمک و بدون پیچیدگی. یاد می‌گیری جریان چطور از پین دیجیتال به LED می‌رسد و چرا مقاومت لازم است.',
    steps:[
      'مدار آماده است: پایه مثبت LED → مقاومت ۲۲۰ اهم → پین ۸، پایه منفی → GND.',
      'در `setup()` با `pinMode(ledPin, OUTPUT)` پین را خروجی کن.',
      'با `digitalWrite(ledPin, HIGH)` آن را روشن کن و ببین چطور می‌درخشد.'
    ]},
  { id:'blink', icon:'✨', title:'چشمک‌زن (Blink)', sub:'گام دوم — روشن و خاموش با delay',
    xp:50,
    quote:'«تابع delay برنامه را برای مدتی که به میلی‌ثانیه به آن می‌دهی، کاملاً متوقف می‌کند؛ یعنی در آن مدت هیچ کار دیگری انجام نمی‌شود. برای یک چشمک‌زن ساده همین کافی است، اما در پروژه‌های بزرگ‌تر که باید چند کار را همزمان انجام دهی، معمولاً به‌جای آن از تابع millis استفاده می‌شود که بدون متوقف‌کردن برنامه، زمان را اندازه می‌گیرد.»',
    desc:'همان مدار قبلی را با ()delay به یک چشمک‌زن تبدیل می‌کنی — اولین برنامه‌ی زمان‌بندی‌شده‌ات.',
    steps:[
      'مثل مأموریت قبل، پین را در `setup()` روی `OUTPUT` بگذار.',
      'در `loop()` اول `digitalWrite(ledPin, HIGH)` بنویس و بعد `delay(500)`.',
      'سپس `digitalWrite(ledPin, LOW)` و یک `delay(500)` دیگر اضافه کن.',
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
      'مقدار `analogRead` را بخوان (روی آردوینو، ADC ده‌بیتی است؛ بازه‌ی خروجی ۰ تا ۱۰۲۳).',
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
      'با `servo.write()` زاویه را بین ۰ تا ۱۸۰ درجه تغییر بده.',
      'با یک حلقه for ساده، زاویه را از ۰ تا ۱۸۰ درجه (فقط یک‌بار، یک طرف) افزایش بده و بین هر مرحله کمی delay بگذار — لازم نیست برگردی.'
    ]}
];


/* ----- شبیه‌سازهای بخش آردوینو ----- */
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

