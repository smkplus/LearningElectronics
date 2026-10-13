/* Resistor color-decoder WIDGET (dropdown pickers + LCD-style result).
   A single reusable `ResistorDecoder.mount(container, opts)` used by both
   the Lab tab's "🎨 رمزگشای رنگ مقاومت" card AND the "محاسبه مقاومت رنگی"
   mission modal (quest.js) — so the picking/formatting logic lives in
   exactly one place and neither caller has to duplicate it.

   Depends on globals loaded earlier in index.html:
     - RESISTOR_COLORS, colorByName  → resistor-colors.js
     - toFa, fmtMult, faColorName    → lab.js
     - SFX                          → common.js
   These are only touched inside mount()/its callbacks, which run after a
   user interacts — so this file's own <script> tag can load anywhere
   after resistor-colors.js and lab.js (order relative to quest.js doesn't
   matter, since quest.js only calls ResistorDecoder.mount() later, when a
   learner opens the mission modal).

   Reading order matches a real resistor and the guide note on the Lab tab:
   band0/1 = first two digits, band2 = multiplier, band3 (gapped tolband) = tolerance. */
const ResistorDecoder = (function(){
  let mountCount = 0;
  const BAND_LABELS = ['نوار ۱ — رقم اول', 'نوار ۲ — رقم دوم', 'نوار ۳ — ضریب', 'نوار ۴ — تلورانس'];

  function bandOptions(bandIndex){
    if(bandIndex === 0 || bandIndex === 1) return RESISTOR_COLORS.filter(c => c.digit !== undefined);
    if(bandIndex === 2) return RESISTOR_COLORS.filter(c => c.mult !== undefined);
    return RESISTOR_COLORS.filter(c => c.tol !== undefined);
  }
  function optionLabel(c, bandIndex){
    if(bandIndex === 2) return `${fmtMult(c.mult)} ${faColorName(c.name)}`;
    if(bandIndex === 3) return `±${toFa(c.tol)}٪ ${faColorName(c.name)}`;
    return `${toFa(c.digit)} ${faColorName(c.name)}`;
  }
  function textColorFor(hex){
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    return lum > 0.55 ? '#12161f' : '#f5f0e2';
  }
  function computeValue(state){
    const c0 = colorByName(state[0]), c1 = colorByName(state[1]);
    const c2 = colorByName(state[2]), c3 = colorByName(state[3]);
    return { value: (c0.digit*10 + c1.digit) * c2.mult, tol: c3.tol };
  }
  function formatResistanceParts(v){
    if(v >= 1e6) return { num: toFa((v/1e6).toFixed(v % 1e6 === 0 ? 0 : 2)), unit: 'MΩ' };
    if(v >= 1e3) return { num: toFa((v/1e3).toFixed(v % 1e3 === 0 ? 0 : 2)), unit: 'kΩ' };
    return { num: toFa(v.toFixed(v % 1 === 0 ? 0 : 1)), unit: 'Ω' };
  }
  function fmtRawOhms(v){
    // Raw value in ohms, comma-grouped, Farsi digits — shown above the kΩ/MΩ
    // shorthand so it's easy to double check at a glance, e.g. "= 2,200 Ω".
    const rounded = Math.round(v * 100) / 100;
    const str = rounded % 1 === 0 ? rounded.toLocaleString('en-US') : String(rounded);
    return toFa(str).replace(/,/g, '٬');
  }

  /* Builds the whole widget (resistor body SVG + 4 dropdowns + LCD readout,
     optionally a 🎲 random button) inside `container`.
       opts.initial            – starting band colors, e.g. {0:'red',1:'red',2:'brown',3:'gold'}
       opts.onChange(value, tol, state) – called after every render (incl. the first)
       opts.onRandomize()      – called after the 🎲 button reshuffles the bands
       opts.showRandomButton   – default true
     Returns { getState(), destroy() }. Each mount gets its own uid-prefixed
     ids, so the Lab card and the mission modal can both be mounted at once
     without colliding. */
  function mount(container, opts = {}){
    const uid = 'rd' + (++mountCount);
    const state = Object.assign({ 0:'brown', 1:'black', 2:'red', 3:'green' }, opts.initial || {});
    const onChange = opts.onChange || function(){};
    const showRandom = opts.showRandomButton !== false;

    container.innerHTML = `
      <div class="resistor-stage">
        <svg class="resistor-svg" viewBox="0 0 320 90">
          <line x1="0" y1="45" x2="70" y2="45" stroke="#8a93a3" stroke-width="4"/>
          <line x1="250" y1="45" x2="320" y2="45" stroke="#8a93a3" stroke-width="4"/>
          <rect x="70" y="14" width="180" height="62" rx="18" fill="#d8c39a"/>
          <rect x="70" y="14" width="180" height="62" rx="18" fill="none" stroke="#00000022" stroke-width="1"/>
          <rect class="rband" data-band="0" x="102" y="14" width="16" height="62" fill="#000"/>
          <rect class="rband" data-band="1" x="138" y="14" width="16" height="62" fill="#000"/>
          <rect class="rband" data-band="2" x="174" y="14" width="16" height="62" fill="#000"/>
          <rect class="rband tolband" data-band="3" x="222" y="14" width="16" height="62" fill="#d4af37"/>
        </svg>
      </div>
      <div class="rband-row" dir="ltr">
        ${[0,1,2,3].map(i => `
          <div class="rband-field" dir="rtl">
            <label>${BAND_LABELS[i]}</label>
            <select class="rband-dropdown" id="${uid}-band${i}"></select>
            <div class="rband-readout" id="${uid}-readout${i}" dir="ltr">—</div>
          </div>
        `).join('')}
      </div>
      <div class="rlcd-flow" dir="ltr">
        <div class="rlcd-raw" id="${uid}-raw">— <span class="rlcd-unit-inline">Ω</span></div>
        <div class="rlcd-panel">
          <span class="rlcd-num" id="${uid}-num">—</span>
          <span class="rlcd-unit" id="${uid}-unit">Ω</span>
          <span class="rlcd-tol" id="${uid}-tol">±—٪</span>
        </div>
      </div>
      ${showRandom ? `<button type="button" class="lab-btn" id="${uid}-random">🎲 یک مقاومت تصادفی بساز</button>` : ''}
    `;

    const selects = {
      0: container.querySelector(`#${uid}-band0`),
      1: container.querySelector(`#${uid}-band1`),
      2: container.querySelector(`#${uid}-band2`),
      3: container.querySelector(`#${uid}-band3`),
    };

    function buildOptions(bandIndex){
      const select = selects[bandIndex];
      select.innerHTML = '';
      bandOptions(bandIndex).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = optionLabel(c, bandIndex);
        opt.style.backgroundColor = c.hex;
        opt.style.color = textColorFor(c.hex);
        if(state[bandIndex] === c.name) opt.selected = true;
        select.appendChild(opt);
      });
    }
    function styleSelect(bandIndex){
      const select = selects[bandIndex];
      const c = colorByName(state[bandIndex]);
      select.style.backgroundColor = c.hex;
      select.style.color = textColorFor(c.hex);
      select.style.borderColor = textColorFor(c.hex) === '#12161f' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.4)';
    }
    function render(){
      [0,1,2,3].forEach(i => {
        const el = container.querySelector(`.rband[data-band="${i}"]`);
        if(el) el.setAttribute('fill', colorByName(state[i]).hex);
        styleSelect(i);
      });
      const c0 = colorByName(state[0]), c1 = colorByName(state[1]);
      const c2 = colorByName(state[2]), c3 = colorByName(state[3]);
      const { value, tol } = computeValue(state);

      container.querySelector(`#${uid}-readout0`).textContent = toFa(c0.digit);
      container.querySelector(`#${uid}-readout1`).textContent = toFa(c1.digit);
      container.querySelector(`#${uid}-readout2`).textContent = fmtMult(c2.mult);
      container.querySelector(`#${uid}-readout3`).textContent = `±${toFa(c3.tol)}٪`;

      const parts = formatResistanceParts(value);
      container.querySelector(`#${uid}-num`).textContent = parts.num;
      container.querySelector(`#${uid}-unit`).textContent = parts.unit;
      container.querySelector(`#${uid}-raw`).innerHTML = `= ${fmtRawOhms(value)} <span class="rlcd-unit-inline">Ω</span>`;
      container.querySelector(`#${uid}-tol`).textContent = `± ${toFa(tol)}٪`;

      onChange(value, tol, { ...state });
    }

    [0,1,2,3].forEach(i => {
      buildOptions(i);
      selects[i].addEventListener('change', e => {
        state[i] = e.target.value;
        SFX.click();
        buildOptions(i);
        render();
      });
    });

    if(showRandom){
      container.querySelector(`#${uid}-random`).addEventListener('click', () => {
        const digits = RESISTOR_COLORS.filter(c => c.digit !== undefined);
        const mults  = RESISTOR_COLORS.filter(c => c.mult !== undefined);
        const tols   = RESISTOR_COLORS.filter(c => c.tol !== undefined);
        state[0] = digits[Math.floor(Math.random()*digits.length)].name;
        state[1] = digits[Math.floor(Math.random()*digits.length)].name;
        state[2] = mults[Math.floor(Math.random()*mults.length)].name;
        state[3] = tols[Math.floor(Math.random()*tols.length)].name;
        SFX.complete();
        [0,1,2,3].forEach(buildOptions);
        render();
        if(opts.onRandomize) opts.onRandomize();
      });
    }

    render();

    return {
      getState(){ return { ...state }; },
      destroy(){ container.innerHTML = ''; }
    };
  }

  return { mount, computeValue, formatResistanceParts, fmtRawOhms };
})();

/* Auto-mount the Lab tab's own instance. Wired to window.onResistorValueChange
   so the "محاسبه مقاومت رنگی" mission can still auto-complete from here too,
   in addition to its own inline widget inside the mission modal (quest.js). */
(function(){
  const labMount = document.getElementById('resistorDecoderMount');
  if(!labMount) return;
  ResistorDecoder.mount(labMount, {
    onChange(value){
      if(window.onResistorValueChange) window.onResistorValueChange(value);
    },
    onRandomize(){ track('resistor_randomized', {}); }
  });
})();
