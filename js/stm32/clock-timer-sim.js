/* ========================================================================
   CLOCK-TIMER-SIM.JS — مأموریت «کلاک و تایمر» (بخش STM32)
   mountClockTimerSim: کلاکِ STM32F103 با چرخ‌دنده + تایمر (صفحه‌ی شمارنده) + PWM
   به dialogue.js (showKnightLine) نیاز دارد.
   ======================================================================== */

const CT_HSE = 8;
const CT_W = .6;
const CT_BATT = 3.7;
const CT_PLL_OPTS = [2, 3, 4, 5, 6, 7, 8, 9];
const CT_DIV_OPTS = [1, 2, 4];
const CT_SHORT = { hse: 'HSE', sys: 'SYSCLK', pclk1: 'PCLK1', pclk2: 'PCLK2', t1: 'TIM2/3/4', t2: 'TIM1', psc: 'PSC' };
const CT_INIT = { pll: 2, a1: 1, a2: 1, psc: 0, arr: 15, pulse: 8 };
const CT_FINISH = '🏆 تمام شد! کلاکِ چیپ ۷۲ مگاهرتز است، کلاکِ تایمر هم با قانونِ ×۲ دوباره ۷۲ می‌شود، و تایمر با Prescaler و Period و Pulse یک PWM ساخت که سرعتِ موتور را تنظیم می‌کند.';

const CT_TALK = {
  hse:   'چرخ‌دنده‌ی بزرگِ کریستال: آرام و ثابت با ۸ مگاهرتز می‌چرخد. همه‌ی ضربان‌های چیپ از همین‌جا شروع می‌شوند.',
  pll:   'PLL یعنی یک چرخ‌دنده‌ی بزرگ که یک چرخ‌دنده‌ی کوچک را می‌چرخاند. نسبتِ دنده‌ها همان ضریب است: ۷۲ دنده ÷ ۸ دنده = ×۹، پس ۸ × ۹ = ۷۲ مگاهرتز.',
  sys:   'چرخ‌دنده‌ی کوچک و تند SYSCLK است: کلاکِ خودِ چیپ. هسته‌ی CPU با همین می‌چرخد. با PLL ×۹ می‌شود ۷۲ مگاهرتز.',
  apb1:  'APB1 یک گیربکسِ کُندکننده است: یک چرخ‌دنده‌ی بزرگ‌تر کنارِ SYSCLK می‌گذارند. قطعاتِ حساسِ این باس (UART2، I2C) بیش از ۳۶ مگاهرتز تحمل ندارند.',
  apb2:  'APB2 هم یک گیربکس است ولی تا ۷۲ مگاهرتز تحمل دارد؛ پس معمولاً ÷۱ می‌ماند. تایمر TIM1 روی همین باس نشسته است.',
  pclk1: 'چرخ‌دنده‌ی بزرگ و کُندِ PCLK1: ۷۲ ÷ ۲ = ۳۶. همان عددِ ۳۶ که در متن‌ها هست؛ کلاکِ تایمر نیست!',
  pclk2: 'PCLK2 کلاکِ باسِ APB2 است؛ با ÷۱ همان ۷۲ مگاهرتز می‌ماند.',
  t1:    'چرخ‌دنده‌ی تایمر نصفِ دنده‌های PCLK1 را دارد، پس دو برابر تندتر می‌چرخد: ۳۶ × ۲ = ۷۲. این همان قانونِ ×۲ است و فقط وقتی هست که تقسیم‌کننده ۱ نباشد.',
  t2:    'TIM1 روی APB2 است. با ÷۱ هم‌اندازه است و ۷۲ می‌چرخد؛ با ÷۲ هم دوباره ×۲ می‌شود و ۷۲. برای PWMِ موتور کلاکش ۷۲ مگاهرتز است.',
  psc:   'Prescaler یک گیربکسِ کُندکننده است. چرخ‌دنده‌ی کوچک کلاکِ تایمر است؛ هر وقت چرخ‌دنده‌ی بزرگ‌تر یک دور بزند، عقربه‌ی شمارنده فقط یک خانه جلو می‌رود. در CubeMX عدد PSC = ۸ یعنی ۹ برابر بزرگ‌تر (تقسیم بر ۹)؛ همیشه یکی بیشتر.',
  arr:   'Period (یا ARR) تعدادِ خانه‌های صفحه است: ARR+۱ خانه. عقربه از ۰ می‌رود تا ARR و دوباره به ۰ برمی‌گردد. یک دورِ کامل = یک دوره‌ی PWM.',
  pulse: 'Pulse (یا CCR) اندازه‌ی کمانِ سبز است. تا وقتی عقربه روی کمانِ سبز است پین روشن (HIGH) می‌ماند و بعدش خاموش. کمانِ بزرگ‌تر یعنی موتور بیشتر برق می‌گیرد و تندتر می‌چرخد.',
  lamp:  'این چراغ همان پایه‌ی خروجیِ PWM است (PA8): وقتی عقربه روی کمانِ سبز است روشن می‌شود و بعدش خاموش.'
};

const ctFa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace('.', '٫');
const ctNum = n => ctFa(+n.toFixed(2));
const ctHz = hz => hz >= 1e6 ? `${ctNum(hz / 1e6)} مگاهرتز` : hz >= 1e3 ? `${ctNum(hz / 1e3)} کیلوهرتز` : `${ctNum(hz)} هرتز`;
const ctTime = s => s >= 1e-3 ? `${ctNum(s * 1e3)} میلی‌ثانیه` : s >= 1e-6 ? `${ctNum(s * 1e6)} میکروثانیه` : `${ctNum(s * 1e9)} نانوثانیه`;
const ctMesh = (ta, tb, th) => -(ta / tb) * th + Math.PI + Math.PI / tb;

function ctGear(g, p, i){
  const step = 6.2832 / g.T, ro = g.rp + p * .32, ri = g.rp - p * .4;
  let d = '';
  for(let k = 0; k < g.T; k++){
    const a = k * step, pt = (r, o) => `${(r * Math.cos(a + o * step)).toFixed(1)} ${(r * Math.sin(a + o * step)).toFixed(1)}`;
    d += `${k ? 'L' : 'M'}${pt(ri, -.3)}L${pt(ro, -.14)}L${pt(ro, .14)}L${pt(ri, .3)}`;
  }
  const holes = g.rp > 34 ? [0, 1, 2, 3].map(k => { const a = k * 1.5708 + .785; return `<circle class="hole" cx="${(g.rp * .6 * Math.cos(a)).toFixed(1)}" cy="${(g.rp * .6 * Math.sin(a)).toFixed(1)}" r="${(g.rp * .12).toFixed(1)}"/>`; }).join('') : '';
  // روی چرخ‌دنده‌های بزرگ اسمش نوشته می‌شود؛ عددِ دنده فقط در برچسبِ زیرِ چرخ‌دنده می‌آید
  const big = g.rp >= 40, nm = g.sh || '';
  const rt = big ? Math.min(g.rp * .5, 26) : Math.max(4, g.rp * .35);
  const fs = Math.max(8.5, Math.min(12, 1.8 * rt / (.62 * Math.max(nm.length, 1))));
  const txt = big ? `<text class="ct-gtx" y="${(fs * .35).toFixed(1)}" font-size="${fs.toFixed(1)}">${nm}</text>` : '';
  return `<g transform="translate(${g.cx.toFixed(1)} ${g.cy.toFixed(1)})" data-talk="${g.key}"><g class="ct-g ${g.cls}${g.bad ? ' bad' : ''}"><path d="${d}Z"/>${holes}<line class="spoke" x1="0" y1="0" x2="${(g.rp * .82).toFixed(1)}" y2="0"/></g><circle class="ct-gh" r="${rt.toFixed(1)}"/>${txt}</g>`;
}

function ctScene(svg, specs, marks, W = 300){
  const sumT = specs.reduce((s, g) => s + g.T, 0);
  const p = Math.min(14, W * 6.2832 / (2 * sumT));
  specs.forEach(g => { g.rp = g.T * p / 6.2832; g.sh = CT_SHORT[g.key] || ''; });
  const maxRp = Math.max(...specs.map(g => g.rp));
  let x = (W + 20 - specs.reduce((s, g) => s + 2 * g.rp, 0)) / 2;
  const cy = 38 + maxRp;
  specs.forEach(g => { g.cx = x + g.rp; g.cy = cy; x += 2 * g.rp; });
  const VW = W + 20;
  // پخش‌کردنِ برچسب‌ها تا روی هم نیفتند (چرخ‌دنده‌های کوچکِ کنارِ هم نقطه‌ی تماسِ نزدیک دارند)
  const spread = (xs, gap, lo, hi) => {
    const o = xs.slice();
    for(let it = 0; it < 80; it++){
      let moved = false;
      for(let i = 1; i < o.length; i++){
        const d = o[i] - o[i - 1];
        if(d < gap - .5){ const s = (gap - d) / 2; o[i - 1] -= s; o[i] += s; moved = true; }
      }
      for(let i = 0; i < o.length; i++) o[i] = Math.max(lo, Math.min(hi, o[i]));
      if(!moved) break;
    }
    return o;
  };
  // بالا: برچسبِ ضریب‌ها (×۹، ÷۲ ...) با خطی به نقطه‌ی تماسِ دو چرخ‌دنده
  const mxs = marks.map((t, i) => specs[i].cx + specs[i].rp);
  const pxs = spread(mxs, 46, 24, VW - 24);
  const mk = marks.map((t, i) => {
    const mx = mxs[i].toFixed(1), px = pxs[i].toFixed(1);
    return `<line class="ct-mkl" x1="${px}" y1="26" x2="${mx}" y2="${cy}"/><rect class="ct-pill" x="${(pxs[i] - 22).toFixed(1)}" y="3" width="44" height="23" rx="11.5"/><text class="ct-mk" x="${px}" y="19">${t}</text>`;
  }).join('');
  // پایین: اسم، مگاهرتز و تعداد دنده‌ی هر چرخ‌دنده زیرِ خودش
  const lt = cy + maxRp + 14;
  const lxs = spread(specs.map(g => g.cx), 76, 38, VW - 38);
  const lb = specs.map((g, i) => {
    const lx = lxs[i].toFixed(1), col = g.bad ? '#ff6b6b' : '#57d8a3';
    return `<line class="ct-mkl" x1="${g.cx.toFixed(1)}" y1="${(cy + g.rp).toFixed(1)}" x2="${lx}" y2="${(lt - 2).toFixed(1)}"/>`
      + `<g data-talk="${g.key}" text-anchor="middle">`
      + `<text x="${lx}" y="${(lt + 11).toFixed(1)}" font-size="11.5" font-weight="700" fill="#e8e2d0">${g.sh}</text>`
      + `<text x="${lx}" y="${(lt + 27).toFixed(1)}" font-size="12.5" font-weight="700" fill="${col}">${g.bad ? '⚠ ' : ''}${ctHz(g.mhz * 1e6)}</text>`
      + `<text x="${lx}" y="${(lt + 41).toFixed(1)}" font-size="10" fill="#8b93a3">${ctFa(g.T)} دنده</text></g>`;
  }).join('');
  svg.setAttribute('viewBox', `0 0 ${VW} ${Math.round(lt + 48)}`);
  svg.innerHTML = mk + lb + specs.map((g, i) => ctGear(g, p, i)).join('');
  const els = svg.querySelectorAll('.ct-g');
  specs.forEach((g, i) => { g.el = els[i]; });
  return { gears: specs };
}

function ctDial(svg, { steps, pulse, pwm }){
  const R = 76, cx = 160, cy = 114, n = Math.min(steps, 64), duty = Math.min(1, pulse / steps);
  const at = (r, a) => `${(cx + r * Math.sin(a)).toFixed(1)} ${(cy - r * Math.cos(a)).toFixed(1)}`;
  let ticks = '';
  for(let i = 0; i < n; i++){
    const a = i / n * 6.2832;
    ticks += `<line class="ct-tk${i ? '' : ' z'}" x1="${at(R + 9, a).split(' ')[0]}" y1="${at(R + 9, a).split(' ')[1]}" x2="${at(R + (i ? 15 : 22), a).split(' ')[0]}" y2="${at(R + (i ? 15 : 22), a).split(' ')[1]}"/>`;
  }
  let arc = '', flag = '';
  if(pwm && duty > 0){
    const ea = duty * 6.2832;
    arc = duty >= 1 ? `<circle class="ct-arc" cx="${cx}" cy="${cy}" r="${R}"/>`
      : `<path class="ct-arc" d="M${at(R, 0)} A${R} ${R} 0 ${duty > .5 ? 1 : 0} 1 ${at(R, ea)}"/>`;
    if(duty < 1){
      const f = at(R + 34, ea).split(' ');
      flag = `<line class="ct-flag" x1="${at(R - 10, ea).split(' ')[0]}" y1="${at(R - 10, ea).split(' ')[1]}" x2="${at(R + 12, ea).split(' ')[0]}" y2="${at(R + 12, ea).split(' ')[1]}"/><text class="ct-fl" x="${f[0]}" y="${f[1]}">Pulse = ${ctFa(pulse)}</text>`;
    }
  }
  const centre = pwm
    ? `<g data-talk="lamp"><circle class="ct-lamp" cx="${cx}" cy="${cy}" r="30"/></g>`
    : `<circle class="ct-gh" cx="${cx}" cy="${cy}" r="30"/>`;
  svg.setAttribute('viewBox', '0 0 320 232');
  svg.innerHTML = `<g data-talk="arr"><circle class="ct-track" cx="${cx}" cy="${cy}" r="${R}"/>${ticks}</g>`
    + `<g data-talk="pulse">${arc}${flag}</g>${centre}`
    + `<text class="ct-fl" x="${cx}" y="14">شروع: خانه‌ی ۰</text>`
    + `<g transform="translate(${cx} ${cy})"><g data-ptr><line class="ct-ptr" x1="0" y1="0" x2="0" y2="${-(R - 6)}"/><circle class="ct-pd" cy="${-(R - 6)}" r="5.5"/></g></g>`
    + `<text class="ct-cnt${pwm ? ' on' : ''}" x="${cx}" y="${cy + 8}" data-cnt></text>`;
  return { ptr: svg.querySelector('[data-ptr]'), cnt: svg.querySelector('[data-cnt]'), lamp: pwm ? svg.querySelector('.ct-lamp') : null };
}

function mountClockTimerSim(container, { onSuccess, alreadyDone } = {}){
  const sel = (k, opts, sign) => `<select class="ct-sel" data-k="${k}">${opts.map(o => `<option value="${o}">${sign}${ctFa(o)}</option>`).join('')}</select>`;
  const row = (k, title, min, max) => `<div class="ct-row"><div class="ct-rn" data-talk="${k}"><b>${title}</b><span data-h="${k}"></span></div><input type="range" data-k="${k}" min="${min}" max="${max}"><input type="number" class="ct-num" data-k="${k}" min="${min}" max="${max}" inputmode="numeric"></div>`;
  const pre = (list) => `<div class="ct-pre">${list.map(([l, v]) => `<button type="button" class="sim-btn sim-btn-ghost" data-preset="${v}">${l}</button>`).join('')}</div>`;
  const head = (talk, title, ctl) => `<div class="ct-sc-h"><b data-talk="${talk}">${title}</b>${ctl ? `<label class="ct-ctl">${ctl}</label>` : ''}</div>`;
  const block = (id, headHtml, ctrl = '') => `<div class="ct-sc">${headHtml}${ctrl}<svg class="ct-svg" id="${id}" viewBox="0 0 320 200"></svg><div class="ct-leg" id="${id}L"></div><div class="ct-rel" id="${id}R"></div></div>`;

  container.innerHTML = `
    <div class="sim-wrap ct-wrap">
      <div class="sim-hw-note">هدف: با چرخ‌دنده‌ها ببین ضریب‌های کلاک چطور ساخته می‌شوند، تایمر و PWM را قدم‌به‌قدم بفهم، و آخرش یک PWM ۳۱٫۲۵ کیلوهرتزیِ ۵۰٪ برای موتور بساز. روی هر چرخ‌دنده یا صفحه بزن تا شوالیه توضیحش بدهد.</div>
      <div class="ct-answer"><b>جوابِ کوتاه به سؤالِ همیشگی:</b> ۷۲ مگاهرتز کلاکِ خودِ چیپ است. ۳۶ مگاهرتز فقط کلاکِ «باس APB1» است (یک گیربکسِ کُندکننده داخل چیپ)، نه کلاکِ تایمر. تایمرهای روی APB1 دوباره ×۲ می‌شوند و ۷۲ می‌گیرند؛ TIM1 هم اصلاً روی APB1 نیست و بی‌هیچ ضربی ۷۲ می‌گیرد.</div>
      <details class="hs-det" open>
        <summary>⏱️ کلاک یعنی چی؟</summary>
        <div class="hs-p">کلاک یک ضربانِ ثابت است، مثل چرخیدنِ یک چرخ‌دنده. چیپ با هر ضربه فقط یک قدمِ خیلی کوچک برمی‌دارد. «۷۲ مگاهرتز» یعنی ۷۲ میلیون ضربه در هر ثانیه؛ هرچه چرخ‌دنده تندتر بچرخد، چیپ سریع‌تر است.</div>
        <div class="hs-p">Blue Pill از یک کریستالِ ۸ مگاهرتزی شروع می‌کند. این برای یک ARM کُند است، پس PLL آن را ×۹ می‌کند و می‌شود ۷۲ مگاهرتز. این «کلاکِ خودِ چیپ» (SYSCLK) است و CPU با همین کار می‌کند.</div>
      </details>
      <details class="hs-det">
        <summary>🔧 قانونِ چرخ‌دنده (همه‌ی ضریب‌ها همین است)</summary>
        <div class="hs-p">دو چرخ‌دنده‌ی درگیر با هم: <b>نسبتِ دنده‌ها = نسبتِ سرعت</b>. چرخ‌دنده‌ی کوچک‌تر تندتر می‌چرخد و بزرگ‌تر کُندتر.</div>
        <div class="hs-p">مثال: چرخ‌دنده‌ی ۷۲ دنده‌ای که یک دور بزند، چرخ‌دنده‌ی ۸ دنده‌ای را ۹ دور می‌چرخاند (×۹). چرخ‌دنده‌ی دو برابر بزرگ‌تر سرعت را نصف می‌کند (÷۲). هر ضریبی که در این صفحه می‌بینی فقط یک جفت چرخ‌دنده است.</div>
      </details>
      <details class="hs-det">
        <summary>🧮 جدولِ ضریب‌ها</summary>
        <table class="hs-table">
          <tr><th>ضریب</th><th>کارش</th><th>چرا؟</th></tr>
          <tr><td>PLL ×۹</td><td>۸ را می‌کند ۷۲</td><td>کریستالِ ارزان کُند است</td></tr>
          <tr><td>APB1 ÷۲</td><td>۷۲ را می‌کند ۳۶ (PCLK1)</td><td>قطعاتِ APB1 بیش از ۳۶ مگاهرتز تحمل ندارند</td></tr>
          <tr><td>قانونِ ×۲ تایمر</td><td>کلاکِ تایمر را از ۳۶ به ۷۲ برمی‌گرداند</td><td>اگر تقسیم‌کننده‌ی APB برابر ۱ نباشد ⇒ ×۲</td></tr>
          <tr><td>Prescaler (PSC)</td><td>ضربه‌های شمارنده را تقسیم بر (PSC+۱) کُند می‌کند</td><td>شمارنده آهسته‌تر بشمرد</td></tr>
          <tr><td>Period (ARR)</td><td>تعدادِ خانه‌های صفحه (ARR+۱)</td><td>طولِ هر دور = هر دوره‌ی PWM</td></tr>
          <tr><td>Pulse (CCR)</td><td>اندازه‌ی کمانِ سبز</td><td>سرعتِ موتور (دیوتی)</td></tr>
        </table>
      </details>
      <div class="st-steps" id="ctSteps">
        <span class="st-chip" data-s="pll">۱ PLL ×۹</span>
        <span class="st-chip" data-s="apb">۲ APB1 ÷۲</span>
        <span class="st-chip" data-s="quiz">۳ سؤالِ تایمر</span>
        <span class="st-chip" data-s="pwm">۴ PWM ۵۰٪</span>
        <button type="button" class="sim-btn sim-btn-ghost st-reset" id="ctReset">↺ از اول</button>
      </div>

      <div class="ct-stage-t">⚙️ بخش ۱ — کلاکِ چیپ با چرخ‌دنده</div>
      <div class="hs-p">عددِ داخل هر چرخ‌دنده تعدادِ دنده‌هایش است. چرخ‌دنده‌ی کوچک‌تر تندتر می‌چرخد؛ نسبتِ دنده‌ها همان ضریب است. منوها را عوض کن و ببین چرخ‌دنده‌ها چه می‌شوند.</div>
      <div class="ct-sc">
        <div class="ct-sc-h"><b>🧩 همه‌ی چرخ‌دنده‌ها کنار هم</b></div>
        <div class="ct-sc-h"><label class="ct-ctl">PLL ${sel('pll', CT_PLL_OPTS, '×')}</label><label class="ct-ctl">APB1 ${sel('a1', CT_DIV_OPTS, '÷')}</label><label class="ct-ctl">PSC ${sel('psc', Array.from({ length: 12 }, (_, i) => i), '=')}</label></div>
        <div class="hs-p ct-cap">هر چرخ‌دنده با بعدی درگیر است و سرعتش = سرعتِ قبلی × (دنده‌های قبلی ÷ دنده‌های خودش). منوها را عوض کن و ببین کل قطار چه می‌شود. برای دیدنِ همه‌ی چرخ‌دنده‌ها صفحه را به چپ و راست بکش.</div>
        <div class="ct-scroll"><svg class="ct-svg ct-wide" id="ctGA" viewBox="0 0 720 300"></svg></div>
        <div class="ct-leg" id="ctGAL"></div>
        <div class="ct-rel" id="ctGAR"></div>
      </div>
      ${block('ctG1', head('pll', '① PLL: ۸ مگاهرتز را تقویت کن', 'ضریب ' + sel('pll', CT_PLL_OPTS, '×')))}
      ${block('ctG2', head('apb1', '② باسِ APB1 و تایمرهای TIM2/3/4', 'تقسیم ' + sel('a1', CT_DIV_OPTS, '÷')))}
      ${block('ctG3', head('apb2', '③ باسِ APB2 و تایمرِ TIM1', 'تقسیم ' + sel('a2', CT_DIV_OPTS, '÷')))}
      <div class="sim-status" id="ctSt1" data-state="idle"></div>
      <div class="ct-quiz">
        <div class="hs-p"><b>🧠 سؤال:</b> فرض کن SYSCLK برابر ۷۲ باشد و APB1 را روی ÷۴ بگذاری. کلاکِ تایمرهای APB1 چند مگاهرتز می‌شود؟ اول حساب کن، بعد با منوی ② امتحانش کن.</div>
        <div class="ll-row">
          <button type="button" class="sim-btn sim-btn-ghost" data-q="18">۱۸ مگاهرتز</button>
          <button type="button" class="sim-btn sim-btn-ghost" data-q="36">۳۶ مگاهرتز</button>
          <button type="button" class="sim-btn sim-btn-ghost" data-q="72">۷۲ مگاهرتز</button>
        </div>
      </div>

      <div class="ct-stage-t">⏲️ بخش ۲ — تایمر یعنی چی؟</div>
      <div class="ct-explain"><b>تایمر یک عقربه روی یک صفحه‌ی گرد است.</b> هر ضربه‌ی کلاک، عقربه یک خانه جلو می‌رود؛ به آخرین خانه که رسید دوباره به ۰ برمی‌گردد. همین! خودِ سخت‌افزار می‌شمارد و CPU آزاد می‌ماند. دو تنظیم دارد: <b>Prescaler</b> (ضربه‌ها چقدر کُند شوند) و <b>Period</b> (صفحه چند خانه دارد).</div>
      <div class="hs-p" data-v="src"></div>
      ${block('ctG4', head('psc', '④ Prescaler: گیربکسِ ضربه‌ها'), row('psc', 'Prescaler (PSC)', 0, 11))}
      ${block('ctD1', head('arr', '⑤ شمارنده: صفحه‌ی گرد'), row('arr', 'Period (ARR)', 1, 1023) + pre([['۷ (۸ خانه)', 'arr:7'], ['۱۵', 'arr:15'], ['۲۵۵', 'arr:255'], ['۹۹۹', 'arr:999']]))}

      <div class="ct-stage-t">💡 بخش ۳ — PWM یعنی چی؟</div>
      <div class="ct-explain"><b>PWM یعنی یک پین را خیلی سریع روشن و خاموش کنیم.</b> موتور آن‌قدر کُند است که تک‌تک چشمک‌ها را حس نمی‌کند و فقط «میانگین» را می‌بیند. مثلاً نیمی از دور روشن = نصفِ ولتاژ = نصفِ سرعت. روشن‌ماندن را همان عقربه تعیین می‌کند: <b>روی کمانِ سبز (Pulse) پین روشن است و روی بقیه خاموش.</b></div>
      ${block('ctD2', head('pulse', '⑥ کمانِ سبز = روشن ماندنِ پین'), row('pulse', 'Pulse (CCR)', 0, 16) + pre([['۲۵٪', 'duty:25'], ['۵۰٪', 'duty:50'], ['۷۵٪', 'duty:75'], ['۱۰۰٪', 'duty:100']]))}
      <div class="ct-sc">
        <div class="ct-sc-h"><b>موجِ خروجی (سه دور پشت‌سرهم)</b></div>
        <canvas class="ct-cv" id="ctCv"></canvas>
        <div class="ct-motor"><span class="ct-gear" id="ctGear">⚙️</span><div class="ct-bar"><i id="ctBar"></i></div><b data-o="d2"></b></div>
        <div class="ct-rel" data-o="avg"></div>
      </div>
      <div class="ct-sc ct-form">
        <div class="ct-sc-h"><b>رابطه‌ی همه‌ی پارامترها (زنده)</b></div>
        <div class="ct-fl2">فرکانسِ PWM = کلاکِ تایمر ÷ (PSC+۱) ÷ (ARR+۱)</div>
        <div class="ct-eq" id="ctEq1"></div>
        <div class="ct-fl2">دیوتی = Pulse ÷ (ARR+۱)</div>
        <div class="ct-eq" id="ctEq2"></div>
      </div>
      <div class="sim-status" id="ctSt2" data-state="idle"></div>
      <div class="ll-row"><button type="button" class="sim-btn sim-btn-ghost" id="ctHint">💡 راهنما</button></div>
    </div>`;

  const q = s => container.querySelector(s), qa = s => container.querySelectorAll(s);
  const cv = q('#ctCv'), g = cv.getContext('2d');
  const st = { ...CT_INIT };
  const done = { pll: false, apb: false, quiz: false, pwm: false };
  let succeeded = !!alreadyDone, raf = 0, last = 0, tp = 0, revT = 3.2, scenes = [], dials = [];
  const th = [0, 0, 0, 0, 0];

  const say = (n, state, text) => { const el = q('#ctSt' + n); el.dataset.state = state; el.textContent = text; };
  const knight = k => { if(typeof showKnightLine === 'function') showKnightLine(CT_TALK[k], 'happy', 'knight'); };

  const clocks = () => {
    const sys = CT_HSE * st.pll, p1 = sys / st.a1, p2 = sys / st.a2;
    return { sys, p1, p2, t1: st.a1 === 1 ? p1 : p1 * 2, t2: st.a2 === 1 ? p2 : p2 * 2 };
  };
  const pwm = () => {
    const tclk = clocks().t2 * 1e6, tick = tclk / (st.psc + 1), steps = st.arr + 1;
    return { tclk, tick, steps, freq: tick / steps, duty: Math.min(1, st.pulse / steps) };
  };
  const pwmOk = () => { const m = pwm(); return m.freq >= 30000 && m.freq <= 32500 && m.duty >= .45 && m.duty <= .55; };

  function legend(id, specs){
    q(id + 'L').innerHTML = specs.map(s => `<div class="ct-lg${s.bad ? ' bad' : ''}"><i class="${s.cls}"></i><span class="n">${s.name}</span><span class="v">${s.bad ? '⚠️ ' : ''}${ctHz(s.mhz * 1e6)}</span><span class="t">${ctFa(s.T)} دنده${s.lim ? ' · ' + s.lim : ''}</span></div>`).join('');
  }

  function lane(id, a, c, pKey, pName, pMhz, pLim, tKey, tName, tMhz){
    const T0 = 12, T2 = a === 1 ? 12 : 6 * a;
    const specs = [
      { T: T0, cls: 'sys', key: 'sys', name: 'SYSCLK (چیپ)', mhz: c.sys },
      { T: T0 * a, cls: 'pclk', key: pKey, name: pName, mhz: pMhz, bad: pMhz > pLim, lim: 'سقف ' + ctFa(pLim) },
      { T: T2, cls: 'tim', key: tKey, name: tName, mhz: tMhz, bad: tMhz > 72 }
    ];
    const s = ctScene(q(id), specs, ['÷' + ctFa(a), a === 1 ? '×۱' : '×۲']);
    legend(id, specs);
    q(id + 'R').innerHTML = `<div>چرخ‌دنده‌ی باس ${ctFa(T0 * a)} دنده دارد، ${a === 1 ? 'هم‌اندازه‌ی' : ctFa(a) + ' برابرِ'} SYSCLK ⇒ ÷${ctFa(a)} ⇒ ${ctHz(pMhz * 1e6)}</div>`
      + `<div>چرخ‌دنده‌ی تایمر ${ctFa(T2)} دنده دارد، ${a === 1 ? 'هم‌اندازه‌ی باس' : 'نصفِ باس'} ⇒ ${a === 1 ? '×۱' : '×۲'} ⇒ کلاکِ تایمر ${ctHz(tMhz * 1e6)}</div>`;
    return { s, w: CT_W * c.sys / CT_HSE };
  }

  function buildScenes(){
    const c = clocks(), m = pwm(), steps = m.steps;
    const s1 = [
      { T: 8 * st.pll, cls: 'hse', key: 'hse', name: 'HSE (کریستال)', mhz: CT_HSE },
      { T: 8, cls: 'sys', key: 'sys', name: 'SYSCLK (چیپ)', mhz: c.sys, bad: false }
    ];
    scenes = [
      { s: ctScene(q('#ctG1'), s1, ['×' + ctFa(st.pll)]), w: CT_W },
      lane('#ctG2', st.a1, c, 'pclk1', 'PCLK1 (باس)', c.p1, 36, 't1', 'تایمر TIM2/3/4', c.t1),
      lane('#ctG3', st.a2, c, 'pclk2', 'PCLK2 (باس)', c.p2, 72, 't2', 'تایمر TIM1', c.t2)
    ];
    legend('#ctG1', s1);
    q('#ctG1R').innerHTML = `<div>${ctFa(8 * st.pll)} دنده ÷ ${ctFa(8)} دنده = ×${ctFa(st.pll)} ⇒ ${ctFa(CT_HSE)} × ${ctFa(st.pll)} = ${ctHz(c.sys * 1e6)}</div>`;
    const s4 = [
      { T: 6, cls: 'tim', key: 't2', name: 'کلاکِ تایمر (TIM1)', mhz: c.t2 },
      { T: 6 * (st.psc + 1), cls: 'psc', key: 'psc', name: 'Prescaler', mhz: m.tick / 1e6 }
    ];
    scenes.push({ s: ctScene(q('#ctG4'), s4, ['÷' + ctFa(st.psc + 1)]), w: CT_W * c.t2 / CT_HSE });
    legend('#ctG4', s4);
    q('#ctG4R').innerHTML = `<div>${ctFa(6 * (st.psc + 1))} دنده ÷ ${ctFa(6)} دنده = ÷${ctFa(st.psc + 1)} ⇒ ${ctHz(m.tclk)} ÷ ${ctFa(st.psc + 1)} = ${ctHz(m.tick)}</div>`
      + `<div>یعنی عقربه‌ی شمارنده هر <b>${ctTime(1 / m.tick)}</b> یک خانه جلو می‌رود (${ctFa(Math.round(m.tick))} خانه در ثانیه).</div>`;
    const aa = st.a1, tT = aa === 1 ? 8 : 4 * aa;
    const sa = [
      { T: 8 * st.pll, cls: 'hse', key: 'hse', name: 'HSE (کریستال)', mhz: CT_HSE },
      { T: 8, cls: 'sys', key: 'sys', name: 'SYSCLK (چیپ)', mhz: c.sys },
      { T: 8 * aa, cls: 'pclk', key: 'pclk1', name: 'PCLK1 (باس)', mhz: c.p1, bad: c.p1 > 36, lim: 'سقف ۳۶' },
      { T: tT, cls: 'tim', key: 't1', name: 'کلاکِ تایمر', mhz: c.t1 },
      { T: tT * (st.psc + 1), cls: 'psc', key: 'psc', name: 'بعد از Prescaler', mhz: c.t1 / (st.psc + 1) }
    ];
    scenes.push({ s: ctScene(q('#ctGA'), sa, ['×' + ctFa(st.pll), '÷' + ctFa(aa), aa === 1 ? '×۱' : '×۲', '÷' + ctFa(st.psc + 1)], 700), w: CT_W });
    legend('#ctGA', sa);
    q('#ctGAR').innerHTML = `<div>${ctHz(CT_HSE * 1e6)} ⇐ ×${ctFa(st.pll)} ⇐ ${ctHz(c.sys * 1e6)} ⇐ ÷${ctFa(aa)} ⇐ ${ctHz(c.p1 * 1e6)} ⇐ ${aa === 1 ? '×۱' : '×۲'} ⇐ ${ctHz(c.t1 * 1e6)} ⇐ ÷${ctFa(st.psc + 1)} ⇐ ${ctHz(c.t1 / (st.psc + 1) * 1e6)}</div><div>(مسیرِ APB1 و تایمرهای TIM2/3/4؛ برای TIM1 همین است با APB2.)</div>`;
    revT = steps <= 64 ? Math.min(5, Math.max(2.4, steps * .2)) : 4;
    dials = [
      ctDial(q('#ctD1'), { steps, pulse: st.pulse, pwm: false }),
      ctDial(q('#ctD2'), { steps, pulse: st.pulse, pwm: true })
    ];
    const per = steps / m.tick;
    q('#ctD1R').innerHTML = `<div>صفحه ${ctFa(steps)} خانه دارد (۰ تا ${ctFa(st.arr)})${steps > 64 ? ' ؛ فقط ۶۴ خط نشان داده شده' : ''}. یک دورِ کامل = ${ctFa(steps)} ضربه = <b>${ctTime(per)}</b>.</div>`
      + `<div>(سرعتِ عقربه اینجا نمایشی و کُند شده است؛ در واقعیت ${ctNum(1 / per)} دور در ثانیه می‌چرخد.)</div>`;
    q('#ctD2R').innerHTML = `<div>هر دور = یک دوره‌ی PWM = ${ctHz(m.freq)}.</div>`
      + `<div>روی کمانِ سبز ${ctFa(Math.min(st.pulse, steps))} از ${ctFa(steps)} خانه ⇒ پین <b>${ctNum(m.duty * 100)}٪</b> از دور روشن است.</div>`;
  }

  function spin(dt){
    tp += dt;
    scenes.forEach((sc, k) => {
      th[k] += sc.w * dt;
      let a = th[k], prev = null;
      sc.s.gears.forEach(gr => {
        if(prev) a = ctMesh(prev.T, gr.T, a);
        gr.el.setAttribute('transform', `rotate(${(a * 57.2958).toFixed(1)})`);
        prev = gr;
      });
    });
    const steps = st.arr + 1, fr = (tp / revT) % 1, cnt = Math.min(steps - 1, Math.floor(fr * steps));
    const ang = (steps <= 64 ? (cnt + .5) / steps : fr) * 360;
    dials.forEach(d => {
      d.ptr.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
      d.cnt.textContent = ctFa(cnt);
      if(d.lamp) d.lamp.setAttribute('class', 'ct-lamp' + (cnt < st.pulse ? ' on' : ''));
    });
  }

  function paintChips(){
    const keys = ['pll', 'apb', 'quiz', 'pwm'], next = keys.find(k => !done[k]);
    qa('.st-chip').forEach(c => { c.classList.toggle('ok', done[c.dataset.s]); c.classList.toggle('next', c.dataset.s === next); });
    qa('[data-q]').forEach(b => { b.disabled = !done.apb; });
  }

  function paintTimer(){
    const m = pwm(), out = (k, t) => { q(`[data-o="${k}"]`).textContent = t; };
    q('[data-v="src"]').textContent = `ورودیِ این بخش: کلاکِ تایمرِ TIM1 = ${ctHz(m.tclk)} (از بخش ۱)`;
    q('[data-h="psc"]').textContent = `تقسیم بر ${ctFa(st.psc + 1)} ⇒ شمارش با ${ctHz(m.tick)}`;
    q('[data-h="arr"]').textContent = `${ctFa(m.steps)} خانه، از ۰ تا ${ctFa(st.arr)}`;
    q('[data-h="pulse"]').textContent = `روشن تا خانه‌ی ${ctFa(st.pulse)} از ${ctFa(m.steps)}`;
    qa('input[data-k="pulse"]').forEach(i => { i.max = m.steps; });
    out('d2', `${ctNum(m.duty * 100)}٪`);
    out('avg', `ولتاژِ میانگینِ موتور ≈ ${ctNum(CT_BATT * m.duty)} ولت از ${ctFa(CT_BATT)} ولتِ باتری ⇒ سرعتِ موتور ${ctNum(m.duty * 100)}٪`);
    q('#ctBar').style.width = (m.duty * 100) + '%';
    const gear = q('#ctGear');
    gear.style.animationPlayState = m.duty > 0 ? 'running' : 'paused';
    gear.style.animationDuration = (2.6 - 2.3 * m.duty).toFixed(2) + 's';
    const eq = list => list.map(t => `<span>${t}</span>`).join('');
    q('#ctEq1').innerHTML = eq([ctHz(m.tclk), '÷', ctFa(st.psc + 1), '÷', ctFa(m.steps), '=', `<b>${ctHz(m.freq)}</b>`]);
    q('#ctEq2').innerHTML = eq([ctFa(Math.min(st.pulse, m.steps)), '÷', ctFa(m.steps), '=', `<b>${ctNum(m.duty * 100)}٪</b>`]);
  }

  function say1(){
    const c = clocks(), std = c.sys === 72 && st.a1 === 2 && st.a2 === 1;
    if(c.p1 > 36) return say('1', 'error', `⚠️ PCLK1 شد ${ctHz(c.p1 * 1e6)} ولی باسِ APB1 فقط تا ۳۶ مگاهرتز تحمل دارد (چرخ‌دنده‌ی قرمز). برای همین باید تقسیم‌کننده‌ی APB1 را روی ÷۲ بگذاری تا چرخ‌دنده‌ی بزرگ‌تری آن را کُند کند.`);
    if(c.p2 > 72) return say('1', 'error', `⚠️ PCLK2 شد ${ctHz(c.p2 * 1e6)}؛ سقفِ APB2 هم ۷۲ مگاهرتز است.`);
    if(!done.pll) return say('1', 'running', `SYSCLK الان ${ctHz(c.sys * 1e6)} است. برای ۷۲ مگاهرتز ضریبِ PLL را روی ×۹ بگذار تا چرخ‌دنده‌ی کوچک ۹ برابر تندتر بچرخد (۸ × ۹).`);
    if(!done.apb) return say('1', 'running', '👌 کلاکِ چیپ ۷۲ مگاهرتز شد. حالا APB1 را روی ÷۲ بگذار و به چرخ‌دنده‌ی تایمر نگاه کن: PCLK1 می‌شود ۳۶ ولی تایمر دوباره ۷۲!');
    if(!std) return say('1', 'running', `APB1 روی ÷${ctFa(st.a1)}: PCLK1 = ${ctHz(c.p1 * 1e6)} و کلاکِ تایمرهای APB1 = ${ctHz(c.t1 * 1e6)}.`);
    if(!done.quiz) return say('1', 'success', '✅ این همان تنظیمِ استانداردِ CubeMX است. حالا به سؤالِ پایین جواب بده.');
    say('1', 'success', '✅ کلاک درست است. با منوها بازی کن و ببین چرخ‌دنده‌ها چطور تغییر می‌کنند.');
  }

  function sayTimer(){
    const m = pwm(), f = m.freq;
    const note = m.tclk === 72e6 ? '' : ` (کلاکِ ورودیِ تایمر الان ${ctHz(m.tclk)} است؛ بخش ۱ را کامل کن.)`;
    if(pwmOk()){
      const exact = st.psc === 8 && st.arr === 255 ? ' دقیقاً همان تنظیمِ CubeMX: Prescaler = ۸ و Period = ۲۵۵.' : '';
      const rest = done.apb && done.quiz ? '' : ' بخش ۱ هم هنوز مانده است.';
      return say('2', 'success', `✅ PWM ${ctHz(f)} با دیوتیِ ${ctNum(m.duty * 100)}٪ ⇒ موتور با نصفِ سرعت می‌چرخد.${exact}${rest}`);
    }
    if(f > 32500) return say('2', 'running', `فرکانسِ PWM ${ctHz(f)} است و بالاتر از هدف (حدود ۳۱٫۲۵ کیلوهرتز). Prescaler یا Period را بزرگ‌تر کن؛ یعنی خانه‌های بیشتر یا ضربه‌های کُندتر.${note}`);
    if(f < 30000) return say('2', 'running', `فرکانسِ PWM ${ctHz(f)} است${f < 20000 ? ' و زیر ۲۰ کیلوهرتز؛ موتور در این محدوده سوت می‌کشد' : ''}. Prescaler یا Period را کوچک‌تر کن.${note}`);
    say('2', 'running', `فرکانس خوب است (${ctHz(f)}). حالا Pulse را نصفِ ${ctFa(m.steps)} بگذار تا کمانِ سبز نیمی از دایره شود و دیوتی ۵۰٪ بشود؛ الان ${ctNum(m.duty * 100)}٪ است.${note}`);
  }

  function checkDone(){
    const c = clocks(), safe = c.p1 <= 36 && c.p2 <= 72;
    if(safe && c.sys === 72) done.pll = true;
    if(safe && c.sys === 72 && st.a1 === 2 && st.a2 === 1) done.apb = true;
    if(pwmOk()) done.pwm = true;
    paintChips();
    if(succeeded || !(done.pll && done.apb && done.quiz && done.pwm)) return false;
    succeeded = true;
    if(onSuccess) onSuccess();
    return true;
  }

  function refresh(){
    qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; }); buildScenes(); const fin = checkDone(); paintTimer(); say1(); sayTimer();
    if(fin) say('2', 'success', CT_FINISH);
  }

  function answer(v){
    if(v !== 36){
      say('1', 'error', v === 18
        ? '۱۸ کلاکِ باس (PCLK1) است: ۷۲ ÷ ۴. ولی چرخ‌دنده‌ی تایمر نصفِ دنده‌های PCLK1 را دارد و دو برابر تندتر می‌چرخد (×۲). دوباره حساب کن.'
        : '۷۲ فقط وقتی درست است که تقسیم‌کننده ۱ یا ۲ باشد. اینجا ۷۲ ÷ ۴ = ۱۸ و بعد ×۲. منوی ② را روی ÷۴ بگذار و به چرخ‌دنده‌ها نگاه کن.');
      return;
    }
    done.quiz = true;
    const fin = checkDone();
    say('1', 'success', '✅ درست! ۷۲ ÷ ۴ = ۱۸ مگاهرتز PCLK1 می‌شود و چون تقسیم‌کننده ۱ نیست، چرخ‌دنده‌ی تایمر دو برابر تندتر می‌چرخد: ۱۸ × ۲ = ۳۶. منوی ② را روی ÷۴ بگذار و خودت ببین؛ بعد برگردان روی ÷۲.');
    if(fin) say('2', 'success', CT_FINISH);
  }

  function hint(){
    if(!done.pll) return say('1', 'running', 'راهنما: ضریبِ PLL را روی ×۹ بگذار (۸ × ۹ = ۷۲).');
    if(!done.apb) return say('1', 'running', 'راهنما: APB1 را روی ÷۲ و APB2 را روی ÷۱ بگذار.');
    if(!done.quiz) return say('1', 'running', 'راهنما: اول ۷۲ ÷ ۴ را حساب کن؛ بعد یادت باشد چون تقسیم‌کننده ۱ نیست، تایمر ×۲ می‌شود.');
    say('2', 'running', 'راهنما: Prescaler را ۸ (تقسیم بر ۹ ⇒ ۸ مگاهرتز)، Period را ۲۵۵ و Pulse را ۱۲۸ بگذار.');
  }

  function syncInputs(except){
    qa('input[data-k]').forEach(i => { if(i !== except) i.value = st[i.dataset.k]; });
  }

  function reset(){
    Object.assign(st, CT_INIT);
    Object.keys(done).forEach(k => { done[k] = false; });
    qa('.ct-sel').forEach(s => { s.value = st[s.dataset.k]; });
    syncInputs(null);
    refresh();
  }

  container.addEventListener('input', e => {
    const el = e.target.closest('input[data-k]');
    if(!el) return;
    const k = el.dataset.k, v = parseInt(el.value, 10);
    if(Number.isNaN(v)) return;
    const lim = { psc: [0, 11], arr: [1, 1023], pulse: [0, st.arr + 1] }[k];
    st[k] = Math.max(lim[0], Math.min(lim[1], v));
    if(k === 'arr') st.pulse = Math.min(st.pulse, st.arr + 1);
    syncInputs(el);
    refresh();
  });

  container.addEventListener('change', e => {
    const s = e.target.closest('select.ct-sel');
    if(!s) return;
    st[s.dataset.k] = +s.value;
    refresh();
  });

  container.addEventListener('click', e => {
    const pr = e.target.closest('[data-preset]');
    if(pr){
      const [k, v] = pr.dataset.preset.split(':');
      if(k === 'arr'){ st.arr = +v; st.pulse = Math.min(st.pulse, st.arr + 1); }
      else st.pulse = Math.round((st.arr + 1) * +v / 100);
      syncInputs(null); refresh(); return;
    }
    const qb = e.target.closest('[data-q]');
    if(qb){ answer(+qb.dataset.q); return; }
    if(e.target.closest('#ctHint')){ hint(); return; }
    if(e.target.closest('#ctReset')){ reset(); return; }
    const t = e.target.closest('[data-talk]');
    if(t && !e.target.closest('select, input')) knight(t.dataset.talk);
  });

  function drawWave(){
    const w = cv.clientWidth, h = 170;
    if(!w) return;
    const dpr = window.devicePixelRatio || 1;
    if(cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const n = 3, x0 = 42, pw = (w - x0 - 8) / n, top = 24, base = 82, yH = 114, yL = 154;
    const steps = st.arr + 1, duty = Math.min(1, st.pulse / steps), yP = base - duty * (base - top);
    const dot = (x, y) => { g.beginPath(); g.arc(x, y, 4.5, 0, 6.2832); g.fill(); };
    g.lineJoin = 'round'; g.font = '11px JetBrains Mono, monospace'; g.textAlign = 'left';
    g.fillStyle = '#6b7280'; g.fillText('CNT', 4, top + 4); g.fillText('PWM', 4, yH + 4);

    g.lineWidth = 2; g.strokeStyle = '#e79a54'; g.beginPath();
    for(let i = 0; i < n; i++){ const x = x0 + i * pw; g.moveTo(x, base); g.lineTo(x + pw, top); g.lineTo(x + pw, base); }
    g.stroke();
    g.fillStyle = '#e79a54'; g.fillText('ARR=' + st.arr, x0 + 4, top - 8);

    g.setLineDash([5, 4]); g.lineWidth = 1.5; g.strokeStyle = '#d4af37'; g.beginPath(); g.moveTo(x0, yP); g.lineTo(x0 + n * pw, yP); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#d4af37'; g.textAlign = 'right'; g.fillText('Pulse=' + st.pulse, w - 10, Math.max(yP - 5, top - 8)); g.textAlign = 'left';

    g.lineWidth = 2; g.strokeStyle = '#57d8a3'; g.beginPath();
    if(duty >= 1){ g.moveTo(x0, yH); g.lineTo(x0 + n * pw, yH); }
    else {
      g.moveTo(x0, yL);
      for(let i = 0; i < n; i++){
        const x = x0 + i * pw, xe = x + duty * pw;
        if(duty > 0){ g.lineTo(x, yH); g.lineTo(xe, yH); g.lineTo(xe, yL); }
        g.lineTo(x + pw, yL);
      }
    }
    g.stroke();

    const phase = (tp / revT) % n, fr = phase % 1, xc = x0 + phase * pw, hi = Math.floor(fr * steps) < st.pulse;
    g.lineWidth = 1; g.strokeStyle = 'rgba(232,226,208,.25)'; g.beginPath(); g.moveTo(xc, top - 4); g.lineTo(xc, yL + 6); g.stroke();
    g.fillStyle = '#e79a54'; dot(xc, base - fr * (base - top));
    g.fillStyle = hi ? '#57d8a3' : '#6b7280'; dot(xc, hi ? yH : yL);
  }

  function frame(ts){
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(.05, (ts - last) / 1000) : 0;
    last = ts;
    spin(dt);
    drawWave();
  }

  reset();
  if(alreadyDone) say('2', 'success', '✅ قبلاً این مأموریت را کامل کرده‌ای. اگر دوست داری دوباره با منوها و اسلایدرها بازی کن.');
  raf = requestAnimationFrame(frame);
  return { stop(){ cancelAnimationFrame(raf); } };
}
