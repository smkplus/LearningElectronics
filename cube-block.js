/* ================= CUBEMX: پروژه‌ی مشترک + چیپ تعاملی =================
   برگرفته از «کارگاه Blue Pill و CubeMX»: نقشه‌ی پایه‌های STM32F103C8Tx (LQFP48)
   که روی هر پایه می‌زنی و کارش را (مثل منوی CubeMX) انتخاب می‌کنی، فهرست کارها با
   راهنمایی قاب‌طلایی، پیش‌نمایشِ کدِ مناسبِ پایه‌های تنظیم‌شده، و آزمایشگاه ساعت.
   حالتِ پایه‌ها و ساعت در یک «پروژه‌ی مشترک» (CUBE) نگه داشته می‌شود و مثل فایلِ
   .ioc واقعی بین مأموریت‌های STM32 و رباتیک می‌ماند. */
const CX_KEY = 'shovalie-madar-cube-v1';
const CX_SIDES = [
  ['VDD','VSS','PB9','PB8','BOOT0','PB7','PB6','PB5','PB4','PB3','PA15','PA14'],
  ['VBAT','PC13','PC14','PC15','PD0','PD1','NRST','VSSA','VDDA','PA0','PA1','PA2'],
  ['PA3','PA4','PA5','PA6','PA7','PB0','PB1','PB2','PB10','PB11','VSS','VDD'],
  ['VDD','VSS','PA13','PA12','PA11','PA10','PA9','PA8','PB15','PB14','PB13','PB12']
];
const CX_F = {};
'PC14:RCC_OSC32_IN|PC15:RCC_OSC32_OUT|PD0:RCC_OSC_IN|PD1:RCC_OSC_OUT|PA0:ADC1_IN0 ADC2_IN0 SYS_WKUP TIM2_CH1 TIM2_ETR USART2_CTS|PA1:ADC1_IN1 ADC2_IN1 TIM2_CH2 USART2_RTS|PA2:ADC1_IN2 ADC2_IN2 TIM2_CH3 USART2_TX|PA3:ADC1_IN3 ADC2_IN3 TIM2_CH4 USART2_RX|PA4:ADC1_IN4 ADC2_IN4 SPI1_NSS USART2_CK|PA5:ADC1_IN5 ADC2_IN5 SPI1_SCK|PA6:ADC1_IN6 ADC2_IN6 SPI1_MISO TIM1_BKIN TIM3_CH1|PA7:ADC1_IN7 ADC2_IN7 SPI1_MOSI TIM1_CH1N TIM3_CH2|PA8:RCC_MCO TIM1_CH1 USART1_CK|PA9:TIM1_CH2 USART1_TX|PA10:TIM1_CH3 USART1_RX|PA11:CAN_RX TIM1_CH4 USART1_CTS USB_DM|PA12:CAN_TX TIM1_ETR USART1_RTS USB_DP|PA13:SYS_JTMS-SWDIO|PA14:SYS_JTCK-SWCLK|PA15:SPI1_NSS SYS_JTDI TIM2_CH1 TIM2_ETR|PB0:ADC1_IN8 ADC2_IN8 TIM1_CH2N TIM3_CH3|PB1:ADC1_IN9 ADC2_IN9 TIM1_CH3N TIM3_CH4|PB3:SPI1_SCK SYS_JTDO-TRACESWO TIM2_CH2|PB4:SPI1_MISO SYS_JTRST TIM3_CH1|PB5:I2C1_SMBA SPI1_MOSI TIM3_CH2|PB6:I2C1_SCL TIM4_CH1 USART1_TX|PB7:I2C1_SDA TIM4_CH2 USART1_RX|PB8:CAN_RX I2C1_SCL TIM4_CH3|PB9:CAN_TX I2C1_SDA TIM4_CH4|PB10:I2C2_SCL TIM2_CH3 USART3_TX|PB11:I2C2_SDA TIM2_CH4 USART3_RX|PB12:I2C2_SMBA SPI2_NSS TIM1_BKIN USART3_CK|PB13:SPI2_SCK TIM1_CH1N USART3_CTS|PB14:SPI2_MISO TIM1_CH2N USART3_RTS|PB15:SPI2_MOSI TIM1_CH3N'
  .split('|').forEach(x => { const [a, b] = x.split(':'); CX_F[a] = b; });
const CX_D = {
  PC13: 'چراغ LED روی برد؛ با صفر روشن می‌شود', PD0: 'ورودی کریستال ۸ مگاهرتز', PD1: 'خروجی کریستال',
  PA13: 'SWDIO: سیم داده‌ی ST-Link', PA14: 'SWCLK: سیم کلاک ST-Link', PA9: 'ارسال سریال و آپلود با USB-سریال', PA10: 'دریافت سریال',
  PB6: 'کلاک I2C', PB7: 'داده‌ی I2C', PA11: 'USB منفی', PA12: 'USB مثبت',
  PA8: 'خروجی تایمر ۱ (کانال ۱) — برای PWM', PA9_: '', BOOT0: 'صفر: اجرای عادی؛ یک: حالت آپلود سریال', NRST: 'ریست چیپ'
};
const CX_SYS = { PA13: 'SYS_JTMS-SWDIO', PA14: 'SYS_JTCK-SWCLK', PD0: 'RCC_OSC_IN', PD1: 'RCC_OSC_OUT' };
const CX_CLK0 = { hse: 8, src: 'hse', mul: 2, ahb: 1, a1: 1, a2: 1, adc: 2 };
const CUBE = { cfg: Object.assign({}, CX_SYS), clk: Object.assign({}, CX_CLK0) };
(function cxLoad(){
  try{
    const s = JSON.parse(localStorage.getItem(CX_KEY) || 'null');
    if(s && s.cfg) Object.assign(CUBE.cfg, s.cfg);
    if(s && s.clk) Object.assign(CUBE.clk, s.clk);
  }catch(e){ /* localStorage در دسترس نیست */ }
})();
function cxSave(){ try{ localStorage.setItem(CX_KEY, JSON.stringify({ cfg: CUBE.cfg, clk: CUBE.clk })); }catch(e){} }

const cxIsGpio = n => /^P[A-D]\d+$/.test(n);
const cxFns = n => cxIsGpio(n)
  ? [...(CX_F[n] || '').split(' ').filter(Boolean).sort(), 'GPIO_Input', 'GPIO_Output', 'GPIO_Analog', 'EVENTOUT', 'GPIO_EXTI' + n.slice(2)]
  : [];
const cxKind = n => /^(VDD|VSS|VBAT|VDDA|VSSA)$/.test(n) ? 'pwr' : /^(BOOT0|NRST)$/.test(n) ? 'spc' : 'free';
function cxClock(c){
  const pin = c.src === 'hse' ? +c.hse : 4, sys = pin * c.mul, h = sys / c.ahb, p1 = h / c.a1, p2 = h / c.a2, ad = p2 / c.adc;
  const rows = [['SYSCLK', sys, 72], ['HCLK', h, 72], ['APB1', p1, 36], ['APB2', p2, 72], ['ADC', ad, 14]];
  const ok = rows.every(r => r[1] <= r[2]);
  return { sys, h, p1, p2, ad, rows, ok, ready: ok && sys === 72 };
}
/* کدِ مناسبِ هر پایه‌ی تنظیم‌شده (فقط برای نشان‌دادنِ «بعدش چی بنویسم؟») */
function cxCode(n, f){
  const p = n[1], k = n.slice(2), m = f.match(/\d/), t = f.match(/^TIM(\d)_CH(\d)(N?)/);
  if(f === 'GPIO_Output') return `HAL_GPIO_WritePin(GPIO${p}, GPIO_PIN_${k}, GPIO_PIN_SET);`;
  if(f === 'GPIO_Input') return `uint8_t v = HAL_GPIO_ReadPin(GPIO${p}, GPIO_PIN_${k});`;
  if(f.startsWith('GPIO_EXTI')) return '// وقفه: تابع HAL_GPIO_EXTI_Callback را پر کن';
  if(f.startsWith('USART')) return /_TX$/.test(f) ? `HAL_UART_Transmit(&huart${m[0]}, (uint8_t*)"hi", 2, 100);` : /_RX$/.test(f) ? `HAL_UART_Receive(&huart${m[0]}, buf, 1, 100);` : '// سیگنال کنترلی USART';
  if(f.startsWith('I2C')) return f.endsWith('SMBA') ? '// سیگنال هشدار SMBus' : `HAL_I2C_Master_Transmit(&hi2c${m[0]}, 0x3C<<1, buf, 2, 100);`;
  if(f.startsWith('SPI')) return `HAL_SPI_Transmit(&hspi${m[0]}, buf, 4, 100);`;
  if(f.startsWith('ADC')) return `HAL_ADC_Start(&hadc${m[0]}); v = HAL_ADC_GetValue(&hadc${m[0]});`;
  if(t) return t[3] ? `HAL_TIMEx_PWMN_Start(&htim${t[1]}, TIM_CHANNEL_${t[2]});` : `__HAL_TIM_SET_COMPARE(&htim${t[1]}, TIM_CHANNEL_${t[2]}, 500);`;
  if(f.startsWith('CAN')) return 'HAL_CAN_Start(&hcan);';
  return '// ' + (f.startsWith('USB') ? 'USB_DEVICE را در Middleware روشن کن' : f.startsWith('TIM') ? 'سیگنال کنترلی تایمر' : 'نیاز به کد دستی ندارد یا خودکار تولید می‌شود');
}
function halHighlight(s){
  if(typeof ArduinoSim !== 'undefined' && ArduinoSim.highlightArduino) return ArduinoSim.highlightArduino(s);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* opts: { goal, required:[{pin, fn, label}], showClock, clockRequired (پیش‌فرض = showClock), status, successMsg,
           onChange(state), onGoClock() }
   قسمت‌ها: «pins» (نقشه‌ی چیپ) و «clock» (آزمایشگاه ساعت). showPart('pins'|'clock'|'all') یکی را نشان می‌دهد؛
   تب‌های ادیتور (cxTabs) از همین استفاده می‌کنند.
   خروجی: { isPinsOk(), isClockOk(), isOk(), refresh(), showPart(p), focus(pin, fn), stop() } */
function mountCubeMx(container, opts = {}){
  const required = opts.required || [], showClock = !!opts.showClock, clockReq = showClock && opts.clockRequired !== false;
  let sel = null, hint = null, interacted = false, part = 'all';
  const clockHtml = showClock ? `
    <div class="hs-box cx-clock">
      <div class="hs-box-t">⏱️ آزمایشگاه ساعت (Clock)</div>
      <div class="hs-p">خط سفید روی هر نوار سقفِ مجاز است. نوارِ قرمز یعنی چیپ در آن سرعت کار نمی‌کند.</div>
      <div class="cx-presets">
        <button type="button" class="sim-btn sim-btn-ghost" data-p="8,hse,9,1,2,1,6" id="cxP72">استاندارد ۷۲ مگاهرتز</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-p="8,hse,6,1,2,1,4">حالت ۴۸ مگاهرتز</button>
        <button type="button" class="sim-btn sim-btn-ghost" data-p="8,hse,16,1,1,1,2">خرابش کن</button>
      </div>
      <div class="cx-ctl">
        <label class="ls-field">کریستال HSE: <b class="mono cx-v-hse"></b><input type="range" dir="ltr" data-k="hse" min="4" max="16"></label>
        <label class="ls-field">منبع PLL<select dir="ltr" data-k="src"><option value="hse">HSE</option><option value="hsi">HSI÷2 (4 MHz)</option></select></label>
        <label class="ls-field">ضریب PLL: <b class="mono cx-v-mul"></b><input type="range" dir="ltr" data-k="mul" min="2" max="16"></label>
        <label class="ls-field">AHB<select dir="ltr" data-k="ahb"><option>1</option><option>2</option><option>4</option></select></label>
        <label class="ls-field">APB1<select dir="ltr" data-k="a1"><option>1</option><option>2</option><option>4</option><option>8</option></select></label>
        <label class="ls-field">APB2<select dir="ltr" data-k="a2"><option>1</option><option>2</option><option>4</option></select></label>
        <label class="ls-field">ADC<select dir="ltr" data-k="adc"><option>2</option><option>4</option><option>6</option><option>8</option></select></label>
      </div>
      <div class="cx-rows"></div>
      <div class="hs-p cx-ext"></div>
    </div>` : '';
  container.innerHTML = `
    <div class="cx-wrap" data-part="all">
      ${opts.goal ? `<div class="sim-hw-note">${opts.goal}</div>` : ''}
      ${opts.guide ? '<div class="cx-guide" aria-live="polite" hidden></div>' : ''}
      <div class="cx-part" data-part="pins">
      <svg class="cx-chip" viewBox="0 0 760 760" direction="ltr" role="img" aria-label="نقشه‌ی پایه‌های STM32F103C8Tx"></svg>
      <div class="hs-box"><label class="ls-field">پایه را از فهرست هم می‌توانی انتخاب کنی<select class="cx-pinsel" dir="ltr"></select></label></div>
      <div class="hs-box cx-info"></div>
      ${(required.length || showClock) && opts.showList !== false ? `<div class="hs-box"><div class="hs-box-t">✅ فهرستِ کارها — روی هرکدام بزن تا پایه را برایت انتخاب کنم و دکمه‌ی درست را با قابِ طلایی نشان بدهم</div><ul class="cx-m"></ul></div>` : ''}
      ${opts.showCode === false ? '' : `<div class="hs-box cx-gen"><div class="hs-box-t"><span class="cx-led"></span> کدِ مناسبِ پایه‌های تنظیم‌شده (بعد از CubeMX این‌ها را می‌نویسی)</div><div class="hal-ed"><div class="hal-gut cx-gut" aria-hidden="true"></div><pre class="hs-pre cx-code"></pre></div></div>`}
      </div>
      <div class="cx-part" data-part="clock">${clockHtml}</div>
      ${opts.status ? '<div class="sim-status cx-status" data-state="idle"></div>' : ''}
    </div>`;
  const q = s => container.querySelector(s);
  const qa = s => Array.from(container.querySelectorAll(s));
  const chip = q('.cx-chip'), info = q('.cx-info'), pinsel = q('.cx-pinsel'), mis = q('.cx-m');

  /* ---------- نقشه‌ی چیپ ---------- */
  function draw(){
    let h = '<rect x="140" y="140" width="480" height="480" rx="22" class="cx-board"/><g class="cx-chiptxt"><text x="380" y="372" text-anchor="middle" style="font-size:30px;font-weight:700">STM32F103C8Tx</text><text x="380" y="410" text-anchor="middle" style="font-size:22px">LQFP48</text></g>';
    CX_SIDES.forEach((s, si) => s.forEach((n, i) => {
      const c = 160 + 40 * i; let r, t;
      if(si === 0){ r = `x="${c - 11}" y="108" width="22" height="32"`; t = `<text transform="translate(${c + 5} 98) rotate(-90)">${n}</text>`; }
      if(si === 2){ r = `x="${c - 11}" y="620" width="22" height="32"`; t = `<text transform="translate(${c - 5} 664) rotate(90)">${n}</text>`; }
      if(si === 1){ r = `x="108" y="${c - 11}" width="32" height="22"`; t = `<text x="100" y="${c + 5}" text-anchor="end">${n}</text>`; }
      if(si === 3){ r = `x="620" y="${c - 11}" width="32" height="22"`; t = `<text x="662" y="${c + 5}">${n}</text>`; }
      const cl = CUBE.cfg[n] ? 'ok' : cxKind(n);
      const want = hint && hint.pin === n && CUBE.cfg[n] !== hint.fn;
      h += `<g class="cx-pin ${cl}${sel === n ? ' sel' : ''}${want ? ' want' : ''}" data-n="${n}" data-s="${si}" data-i="${i}" tabindex="0" role="button" aria-label="${n}"><rect ${r} rx="3"/>${t}</g>`;
    }));
    let spot = null;
    CX_SIDES.forEach((s, si) => s.forEach((n, i) => {
      if(hint && hint.pin === n && CUBE.cfg[n] !== hint.fn){ const c = 160 + 40 * i; spot = si % 2 ? [si === 1 ? 124 : 636, c] : [c, si === 0 ? 124 : 636]; }
    }));
    if(spot) h += `<g class="cx-spot" pointer-events="none"><circle cx="${spot[0]}" cy="${spot[1]}" r="38" class="cx-halo"/><circle cx="${spot[0]}" cy="${spot[1]}" r="30" class="cx-ring"/></g>`;
    chip.classList.toggle('has-want', !!spot);
    chip.innerHTML = h;
  }
  function panel(){
    if(!sel){
      info.innerHTML = '<div class="hs-box-t">یک پایه انتخاب کن</div><div class="hs-p">روی یکی از پایه‌های نقشه بزن. رنگ‌ها: سبز تنظیم‌شده، خاکستری آزاد، زرد تغذیه، زیتونی ویژه.</div>';
      return;
    }
    const n = sel, f = cxFns(n);
    let h = `<div class="hs-box-t" dir="ltr" style="text-align:start">${n}</div><div class="hs-p">${CX_D[n] || (cxKind(n) === 'pwr' ? 'تغذیه؛ قابل تنظیم نیست' : 'پایه‌ی عمومی؛ هر کاری که بخواهی')}</div>`;
    if(f.length){
      h += `<div class="hs-p">${f.length + 1} گزینه، مثل منوی CubeMX:</div><div class="cx-fns"><button type="button" class="sim-btn ${CUBE.cfg[n] ? 'sim-btn-ghost' : 'sim-btn-run'}" data-f="">Reset_State</button>`
        + f.map(x => `<button type="button" class="sim-btn ${CUBE.cfg[n] === x ? 'sim-btn-run' : 'sim-btn-ghost'}${hint && hint.pin === n && hint.fn === x && CUBE.cfg[n] !== x ? ' cx-want' : ''}" data-f="${x}">${x}</button>`).join('')
        + '</div><div class="hs-p cx-small">فهرست بر اساس دیتاشیت STM32F103C8 است؛ CubeMX ممکن است چند گزینه‌ی ریمپ بیشتر هم نشان بدهد.</div>';
    } else h += '<div class="hs-p">برای این پایه گزینه‌ای در CubeMX نیست.</div>';
    info.innerHTML = h;
  }
  const done = r => CUBE.cfg[r.pin] === r.fn;
  function missions(){
    if(mis){
      const items = required.map((r, i) => `<li tabindex="0" data-i="${i}" class="${done(r) ? 'd' : ''}">${r.label}</li>`);
      if(showClock) items.push(`<li tabindex="0" data-i="clock" class="${cxClock(CUBE.clk).ready ? 'd' : ''}">${clockReq ? 'در آزمایشگاه ساعت' : 'در تبِ «ساعت» (اختیاری)'}: SYSCLK برابر ۷۲ و هیچ نواری قرمز نباشد</li>`);
      mis.innerHTML = items.join('');
    }
    if(!q('.cx-gen')) return;
    const L2 = Object.entries(CUBE.cfg).filter(([n, f]) => !/^(SYS|RCC)_/.test(f)).map(([n, f]) => `// ${n}: ${f}\n${cxCode(n, f)}`);
    const c = '// SWD و کریستال خودکار تنظیم شده‌اند' + (L2.length ? '\n' + L2.join('\n') : '\n// هنوز پایه‌ای تنظیم نشده');
    q('.cx-code').innerHTML = halHighlight(c);
    q('.cx-gut').textContent = c.split('\n').map((_, i) => i + 1).join('\n');
    q('.cx-gen').classList.toggle('done', required.length ? required.every(done) : true);
  }
  /* ---------- راهنمای قدم‌به‌قدم (فقط وقتی opts.guide روشن باشد) ---------- */
  const guideEl = q('.cx-guide');
  function guideStep(){
    const r = required.find(x => !done(x));
    if(part === 'pins' && r) return { kind: 'pin', r };
    if(clockReq && !cxClock(CUBE.clk).ready) return { kind: 'clock' };
    return r ? { kind: 'pin', r } : null;
  }
  function guideRender(){
    if(!guideEl) return;
    const g = guideStep();
    if(!g){ guideEl.hidden = true; return; }
    const total = (clockReq ? 1 : 0) + required.length;
    const n = g.kind === 'clock' ? 1 : (clockReq ? 1 : 0) + required.indexOf(g.r) + 1;
    let title, body;
    if(g.kind === 'clock'){
      const c = cxClock(CUBE.clk);
      title = `⏱️ مرحله ${toFa(n)} از ${toFa(total)} — ساعتِ چیپ`;
      body = c.sys === 72 && !c.ok
        ? 'SYSCLK درست است ولی یکی از نوارها قرمز است. دکمه‌ی «استاندارد ۷۲ مگاهرتز» را بزن تا همه‌چیز درست شود.'
        : 'روی دکمه‌ی «استاندارد ۷۲ مگاهرتز» بزن. دستی هم می‌شود: منبع PLL روی HSE و ضریب PLL روی ۹ (۸ × ۹ = ۷۲).';
    } else {
      const r = g.r, d = CX_D[r.pin];
      title = `🧩 مرحله ${toFa(n)} از ${toFa(total)} — پایه‌ی ${r.pin}`;
      body = sel === r.pin
        ? `پایه‌ی <b dir="ltr">${r.pin}</b> انتخاب شد. حالا از دکمه‌های پایین، <b dir="ltr">${r.fn}</b> را بزن (قابِ طلایی دارد).`
        : `اول روی پایه‌ی <b dir="ltr">${r.pin}</b> در نقشه‌ی چیپ بزن (طلایی است)${d ? `؛ ${d}` : ''}. بعد کارش را انتخاب می‌کنیم.`;
    }
    const need = g.kind === 'clock' ? 'clock' : 'pins';
    const off = part !== 'all' && part !== need;
    guideEl.hidden = false;
    guideEl.innerHTML = `<div class="cx-guide-t">${title}</div><div class="cx-guide-b">${body}</div>`
      + (off ? `<button type="button" class="sim-btn sim-btn-run" data-go="${need}">برو به تبِ ${need === 'clock' ? 'ساعت' : 'پایه‌ها (Cube)'} ←</button>` : '');
  }
  if(guideEl) guideEl.addEventListener('click', e => {
    const b = e.target.closest('button[data-go]'); if(!b) return;
    if(b.dataset.go === 'clock'){ if(opts.onGoClock) opts.onGoClock(); }
    else if(opts.onGoPins) opts.onGoPins();
  });
  function applyGuide(){
    if(!opts.guide) return;
    const g = guideStep();
    hint = !g ? null : g.kind === 'clock' ? { clock: 1 } : { pin: g.r.pin, fn: g.r.fn };
    guideRender();
  }
  function upd(){ pinsel.value = sel || ''; applyGuide(); draw(); panel(); missions(); }

  /* ---------- ساعت ---------- */
  const fm = x => (+x.toFixed(1)) + ' MHz';
  function reflectClock(){
    qa('.cx-clock [data-k]').forEach(el => { el.value = CUBE.clk[el.dataset.k]; });
  }
  function calc(){
    if(!showClock) return;
    const c = cxClock(CUBE.clk);
    q('.cx-v-hse').textContent = CUBE.clk.hse + ' MHz'; q('.cx-v-mul').textContent = '×' + CUBE.clk.mul;
    q('.cx-rows').innerHTML = c.rows.map(([n, v, m]) => { const bad = v > m; return `<div class="cx-row ${bad ? 'bad' : ''}"><span>${n}</span><div class="cx-bar"><i style="width:${Math.min(v / m * 66.6, 100)}%"></i><b></b></div><span class="cx-v">${fm(v)} / ${m}${bad ? ' ✖' : ''}</span></div>`; }).join('');
    const usb = c.sys === 72 ? 'USB: ۷۲ ÷ ۱٫۵ = ۴۸ مگاهرتز، مناسب' : c.sys === 48 ? 'USB: ۴۸ ÷ ۱ = ۴۸ مگاهرتز، مناسب' : 'USB: با این SYSCLK به ۴۸ مگاهرتز نمی‌رسد';
    q('.cx-ext').innerHTML = `تایمرهای APB1: ${fm(c.p1 * (CUBE.clk.a1 > 1 ? 2 : 1))}<br>${usb}<br>تأخیر فلش: ${c.sys <= 24 ? 0 : c.sys <= 48 ? 1 : 2} (برای سرعت بالا خودکار تنظیم می‌شود)`;
    const p72 = q('#cxP72'); if(p72) p72.classList.toggle('cx-want', !!(hint && hint.clock) && !c.ready);
  }

  /* ---------- وضعیت ---------- */
  const state = () => ({ pinsOk: required.every(done), clockOk: !clockReq || cxClock(CUBE.clk).ready, clockReady: showClock && cxClock(CUBE.clk).ready, clockBad: showClock && !cxClock(CUBE.clk).ok });
  function statusText(){
    const bad = required.find(r => !done(r));
    if(bad) return ['idle', `🔌 ${bad.pin} هنوز ${bad.fn} نشده؛ روی همان پایه بزن و ${bad.fn} را انتخاب کن.`];
    if(clockReq){
      const c = cxClock(CUBE.clk), badRow = c.rows.find(r => r[1] > r[2]);
      if(badRow) return ['error', `⚠️ ${badRow[0]} از ${badRow[2]} مگاهرتز بیشتر شد و قرمز است${badRow[0] === 'APB1' ? '؛ APB1 Prescaler را روی /2 بگذار' : badRow[0] === 'ADC' ? '؛ ضریب ADC را بیشتر کن' : '؛ ضریب PLL را کم کن'}.`];
      if(c.sys < 72) return ['idle', `⏱️ ساعت روی ${toFa(Math.round(c.sys))} مگاهرتز است؛ برای ۷۲ مگاهرتز ضریب PLL را ۹ بگذار (۸ × ۹).`];
      if(c.sys > 72) return ['error', '⚠️ SYSCLK از ۷۲ مگاهرتز بیشتر است. ضریب PLL را کم کن.'];
    }
    return ['success', opts.successMsg || '✅ درست شد.'];
  }
  function notify(){
    const st = state();
    const el = q('.cx-status');
    if(el){ const [s, t] = statusText(); el.dataset.state = s; el.textContent = t; }
    if(opts.onChange) opts.onChange(Object.assign({ interacted }, st));
  }
  function changed(){ interacted = true; cxSave(); upd(); calc(); notify(); }

  /* ---------- رویدادها ---------- */
  chip.addEventListener('click', e => {
    const g = e.target.closest('.cx-pin');
    if(g){ sel = g.dataset.n; hint = hint && hint.pin === sel ? hint : null; upd(); if(opts.guide) info.scrollIntoView({ block: 'nearest' }); }
  });
  chip.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){
      const g = e.target.closest('.cx-pin');
      if(g){ e.preventDefault(); sel = g.dataset.n; upd(); const k = chip.querySelector(`.cx-pin[data-n="${sel}"][data-s="${g.dataset.s}"]`); k && k.focus(); }
    }
  });
  info.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b || !sel) return;
    if(b.dataset.f) CUBE.cfg[sel] = b.dataset.f; else delete CUBE.cfg[sel];
    changed();
  });
  pinsel.innerHTML = '<option value="">انتخاب پایه…</option>' + [...new Set(CX_SIDES.flat().filter(cxIsGpio))].map(n => `<option>${n}</option>`).join('');
  pinsel.addEventListener('change', e => { sel = e.target.value || null; upd(); });
  function goMission(li){
    if(!li) return;
    if(li.dataset.i === 'clock'){ hint = { clock: 1 }; if(opts.onGoClock) opts.onGoClock(); upd(); calc(); const c = q('.cx-clock'); c && c.scrollIntoView({ block: 'nearest' }); return; }
    const r = required[+li.dataset.i]; if(!r) return;
    hint = { pin: r.pin, fn: r.fn }; sel = r.pin; upd(); info.scrollIntoView({ block: 'nearest' });
  }
  if(mis){
    if(mis){
      mis.addEventListener('click', e => goMission(e.target.closest('li')));
      mis.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); goMission(e.target.closest('li')); } });
    }
  }
  if(showClock){
    qa('.cx-clock [data-k]').forEach(el => el.addEventListener('input', () => {
      CUBE.clk[el.dataset.k] = el.dataset.k === 'src' ? el.value : +el.value;
      changed();
    }));
    qa('.cx-clock [data-p]').forEach(b => b.addEventListener('click', () => {
      const v = b.dataset.p.split(',');
      ['hse', 'src', 'mul', 'ahb', 'a1', 'a2', 'adc'].forEach((k, i) => { CUBE.clk[k] = k === 'src' ? v[i] : +v[i]; });
      reflectClock(); changed();
    }));
    reflectClock();
  }
  upd(); calc();
  if(opts.status || opts.onChange) notify();
  return {
    isPinsOk: () => state().pinsOk,
    isClockOk: () => state().clockOk,
    isOk: () => { const s = state(); return s.pinsOk && s.clockOk; },
    refresh(){ reflectClock(); upd(); calc(); notify(); },
    showPart(p){ part = p || 'all'; q('.cx-wrap').dataset.part = part; if(opts.guide){ applyGuide(); draw(); panel(); } },
    /* پایه را انتخاب و دکمه‌ی درست را با قابِ طلایی نشان می‌دهد (مثلاً از هشدارِ بلوک‌ها) */
    focus(pin, fn){
      hint = { pin, fn }; sel = pin; upd();
      const g = chip.querySelector(`.cx-pin[data-n="${pin}"]`); g && g.scrollIntoView && g.scrollIntoView({ block: 'nearest' });
    },
    stop(){}
  };
}

/* نوارِ تب‌های ادیتورِ STM32 (ساعت / Cube / کد). items: [{id, icon, label}]
   خروجی: { set(id), get(), mark(id, 'ok'|'todo'|''), nudge(id) } */
function cxTabs(host, items, onSwitch){
  host.innerHTML = `<div class="hs-tabs" role="tablist">${items.map(t => `<button type="button" class="hs-tab" role="tab" data-t="${t.id}" aria-selected="false"><span class="hs-tab-ic" aria-hidden="true">${t.icon}</span><span class="hs-tab-l">${t.label}</span><i class="hs-tab-b" aria-hidden="true"></i></button>`).join('')}</div>`;
  const bar = host.firstChild;
  let cur = null;
  const btn = id => bar.querySelector(`.hs-tab[data-t="${id}"]`);
  function set(id, silent){
    if(!btn(id)) return;
    cur = id;
    bar.querySelectorAll('.hs-tab').forEach(b => {
      const on = b.dataset.t === id;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      if(on) b.classList.remove('nudge');
    });
    if(!silent && onSwitch) onSwitch(id);
  }
  bar.addEventListener('click', e => { const b = e.target.closest('.hs-tab'); if(b) set(b.dataset.t); });
  bar.addEventListener('keydown', e => {
    const rtl = getComputedStyle(bar).direction === 'rtl';
    const step = e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : e.key === 'ArrowRight' ? (rtl ? -1 : 1) : 0;
    if(!step) return;
    const ids = items.map(t => t.id), n = ids[(ids.indexOf(cur) + step + ids.length) % ids.length];
    e.preventDefault(); set(n); const b = btn(n); b && b.focus();
  });
  return {
    set, get: () => cur,
    mark(id, st){ const b = btn(id); if(b) b.dataset.s = st || ''; },
    nudge(id){ const b = btn(id); if(b && !b.classList.contains('on')) b.classList.add('nudge'); }
  };
}

/* مأموریت «STM32 — تنظیم پایه‌ها و ساعت در CubeMX»: همان چیپ و آزمایشگاهِ ساعتِ کارگاه */
function mountStm32CubeSim(container, { onSuccess, alreadyDone } = {}){
  if(alreadyDone){
    CUBE.cfg.PC13 = 'GPIO_Output';
    Object.assign(CUBE.clk, { hse: 8, src: 'hse', mul: 9, ahb: 1, a1: 2, a2: 1, adc: 6 });
    cxSave();
  }
  let succeeded = !!alreadyDone, cx = null;
  container.innerHTML = `
    <div class="sim-wrap hs-wrap">
      <div class="sim-hw-note">هدف: اول در تبِ <b>ساعت</b>، ساعت را روی <b>۷۲ مگاهرتز</b> بدون هیچ نوار قرمزی بگذار؛ بعد در تبِ <b>Cube</b> پایه‌ی <b>PC13</b> (LED روی برد) را <b>GPIO_Output</b> کن. کادرِ طلاییِ زیر قدم‌به‌قدم می‌گوید کجا بزنی. پایه‌های سبزِ SWD و کریستال را CubeMX خودش تنظیم کرده است.</div>
      <div class="hs-bench"><div class="hs-tabsHost"></div><div class="hs-pane hs-cxhost"></div></div>
    </div>`;
  const tabs = cxTabs(container.querySelector('.hs-tabsHost'), [
    { id: 'clock', icon: '⏱️', label: 'ساعت' },
    { id: 'cube', icon: '🧩', label: 'پایه‌ها (Cube)' }
  ], id => cx && cx.showPart(id === 'clock' ? 'clock' : 'pins'));
  cx = mountCubeMx(container.querySelector('.hs-cxhost'), {
    required: [{ pin: 'PC13', fn: 'GPIO_Output', label: 'PC13 را GPIO_Output کن (LED روی برد)' }],
    showClock: true,
    showCode: false,
    showList: false,
    guide: true,
    status: true,
    successMsg: '✅ درسته! PC13 خروجی شد و ساعت روی ۷۲ مگاهرتز بدون خطاست. CubeMX الان کدِ راه‌اندازی را می‌نویسد.',
    onGoClock: () => tabs.set('clock'),
    onGoPins: () => tabs.set('cube'),
    onChange(st){
      tabs.mark('cube', st.pinsOk ? 'ok' : 'todo'); tabs.mark('clock', st.clockOk ? 'ok' : 'todo');
      if(st.clockOk && !st.pinsOk && tabs.get() === 'clock') tabs.nudge('cube');
      if(!succeeded && st.interacted && st.pinsOk && st.clockOk){ succeeded = true; onSuccess && onSuccess(); }
    }
  });
  tabs.set('clock');
  if(alreadyDone){
    const el = container.querySelector('.cx-status');
    if(el){ el.dataset.state = 'success'; el.textContent = '✅ قبلاً این مأموریت را انجام داده‌ای. می‌توانی دوباره با نقشه و ساعت کار کنی.'; }
  }
  return cx;
}

