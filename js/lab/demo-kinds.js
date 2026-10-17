/* ---------- generic small helpers reused by several demo kinds ---------- */
function lightenHex(hex, amt){
  const c = hex.replace('#','');
  const full = c.length===3 ? c.split('').map(ch=>ch+ch).join('') : c;
  const num = parseInt(full,16);
  let r=(num>>16)&255, g=(num>>8)&255, b=num&255;
  r = Math.min(255, Math.round(r+(255-r)*amt));
  g = Math.min(255, Math.round(g+(255-g)*amt));
  b = Math.min(255, Math.round(b+(255-b)*amt));
  return `rgb(${r},${g},${b})`;
}
function capBodyHTML(id, shape, color){
  const light = lightenHex(color, 0.55);
  let extra = '';
  if(shape==='can' || shape==='bigcan') extra = '<div class="cap-stripe"></div>';
  else if(shape==='drop') extra = '<div class="cap-mark">+</div>';
  return `<div class="cap-body" id="${id}" data-shape="${shape}" style="--cap-color:${color};--cap-color-light:${light}">${extra}</div>`;
}
function circuitLedHTML(prefix){
  return `<div class="circuit-row">
      <div class="circuit-batt">🔋</div>
      <div class="circuit-wire" id="${prefix}-w1"></div>
      <div class="led-bulb" id="${prefix}-led"></div>
      <div class="circuit-wire" id="${prefix}-w2"></div>
    </div>`;
}
function setLedState(prefix, root, on, dangerColor){
  const led = root.querySelector('#'+prefix+'-led');
  const w1 = root.querySelector('#'+prefix+'-w1');
  const w2 = root.querySelector('#'+prefix+'-w2');
  led.classList.toggle('lit', on && !dangerColor);
  led.style.background = dangerColor ? '#3a1414' : '';
  led.style.borderColor = dangerColor ? '#7a2a2a' : '';
  [w1,w2].forEach(w => {
    w.classList.toggle('flowing', on && !dangerColor);
    w.classList.toggle('blocked', !!dangerColor);
  });
}

/* ---------- battery-sim helpers ---------- */
function battVoltageAt(ratio, fullV, cutoffV){
  // realistic Li-ion/LiPo discharge shape: fast knee near empty & near full, flat plateau in between
  let f;
  if(ratio <= 0.05) f = (ratio/0.05) * 0.2;
  else if(ratio >= 0.95) f = 0.8 + ((ratio-0.95)/0.05) * 0.2;
  else f = 0.2 + ((ratio-0.05)/0.9) * 0.6;
  return cutoffV + (fullV-cutoffV) * f;
}
function battFormatClock(totalSeconds){
  totalSeconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(totalSeconds/3600);
  const m = Math.floor((totalSeconds%3600)/60);
  const s = totalSeconds%60;
  const pad = n => String(n).padStart(2,'0');
  return toFa(`${pad(h)}:${pad(m)}:${pad(s)}`);
}
function battFormatHM(hours){
  if(hours <= 0.0084) return 'کمتر از ۱ دقیقه';
  if(hours < 1) return toFa(Math.round(hours*60)) + ' دقیقه';
  const h = Math.floor(hours), m = Math.round((hours-h)*60);
  return m>0 ? `${toFa(h)} ساعت و ${toFa(m)} دقیقه` : `${toFa(h)} ساعت`;
}
function battRoundStep(v, step){ return Math.max(step, Math.round(v/step)*step); }

/* ---------- demo kind registry ---------- */
const DEMO_KINDS = {

  'resistor-slider':{
    html(p){ return `
      <div class="comp-demo">${circuitLedHTML('rs')}</div>
      <div class="comp-controls"><input type="range" id="rs-slider" min="${p.min}" max="${p.max}" step="1" value="${p.def}" style="flex:1"></div>
      <div class="comp-readout"><span>مقاومت مسیر</span><span class="val" id="rs-rval">—</span></div>
      <div class="comp-readout"><span>جریان تقریبی (باتری ۵V)</span><span class="val" id="rs-ival">—</span></div>
      <div class="comp-readout" id="rs-warn" style="color:#e08b82;"></div>`; },
    setup(root,p){
      const slider=root.querySelector('#rs-slider'), rval=root.querySelector('#rs-rval'), ival=root.querySelector('#rs-ival'), warn=root.querySelector('#rs-warn');
      function update(){
        const R=parseInt(slider.value,10);
        rval.textContent=toFa(R)+' Ω';
        const mA=5000/Math.max(R,1);
        ival.textContent=(mA<10?toFa(mA.toFixed(2)):toFa(mA.toFixed(1)))+' mA';
        if(p.min===0 && R<30){
          setLedState('rs',root,false,true);
          warn.textContent='🔥 بدون مقاومت کافی، جریان زیاد از حد است و LED می‌سوزد!';
        } else {
          const lit = R<=(p.max*0.6);
          setLedState('rs',root,lit,false);
          warn.textContent = lit ? '' : 'جریان خیلی کم شده — LED کم‌نور یا خاموش به‌نظر می‌رسد.';
        }
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'pot-knob':{
    html(){ return `
      <div class="comp-demo">
        <div class="pot-knob-wrap">
          <div class="pot-knob" id="pk-knob"><div class="pot-pointer" id="pk-pointer"></div></div>
          <div class="pot-led" id="pk-led"></div>
        </div>
      </div>
      <div class="comp-readout"><span>مقاومت انتخابی</span><span class="val" id="pk-val">۵٬۰۰۰ Ω</span></div>`; },
    setup(root){
      const knob=root.querySelector('#pk-knob'), pointer=root.querySelector('#pk-pointer');
      const val=root.querySelector('#pk-val'), led=root.querySelector('#pk-led');
      let deg=150;
      function update(){
        pointer.style.transform=`rotate(${deg-150}deg)`;
        const R=Math.round((deg/300)*10000);
        val.textContent=toFa(R)+' Ω';
        const bright=1-deg/300;
        led.style.background = bright>0.08 ? `radial-gradient(circle at 40% 35%, #fff6d8, #ffce4d 55%, #d4af37)` : '#2a2018';
        led.style.boxShadow = bright>0.08 ? `0 0 ${6+16*bright}px ${2+5*bright}px rgba(255,206,77,${0.25+0.5*bright})` : 'none';
      }
      function angleFromEvent(e){
        const rect=knob.getBoundingClientRect();
        const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
        const ex=e.clientX ?? (e.touches&&e.touches[0].clientX);
        const ey=e.clientY ?? (e.touches&&e.touches[0].clientY);
        let a=Math.atan2(ex-cx, -(ey-cy))*180/Math.PI;
        let mapped=Math.max(0,Math.min(300, a+150));
        deg=mapped; update();
      }
      let dragging=false;
      knob.addEventListener('pointerdown',(e)=>{ dragging=true; SFX.click(); angleFromEvent(e); });
      window.addEventListener('pointermove',(e)=>{ if(dragging) angleFromEvent(e); });
      window.addEventListener('pointerup',()=>{ dragging=false; });
      update();
    }},

  'varistor':{
    html(p){ return `
      <div class="comp-demo">${circuitLedHTML('vr')}</div>
      <div class="comp-controls"><input type="range" id="vr-slider" min="0" max="300" step="5" value="0" style="flex:1"></div>
      <div class="comp-readout"><span>ولتاژ اعمالی</span><span class="val" id="vr-vval">۰ V</span></div>
      <div class="comp-readout"><span>وضعیت</span><span class="val" id="vr-state">عایق کامل</span></div>`; },
    setup(root,p){
      const slider=root.querySelector('#vr-slider'), vval=root.querySelector('#vr-vval'), state=root.querySelector('#vr-state');
      function update(){
        const V=parseInt(slider.value,10);
        vval.textContent=toFa(V)+' V';
        const clamp = V>=p.clampV;
        const led=root.querySelector('#vr-led'), w1=root.querySelector('#vr-w1'), w2=root.querySelector('#vr-w2');
        led.classList.toggle('lit', clamp);
        if(clamp){ led.style.background='radial-gradient(circle at 40% 35%,#fff0d8,#e8801e 55%,#c1554a)'; led.style.boxShadow='0 0 16px 5px rgba(232,128,30,.6)'; }
        else { led.style.background=''; led.style.boxShadow=''; }
        w1.classList.toggle('flowing', clamp); w2.classList.toggle('flowing', clamp);
        state.textContent = clamp ? 'در حال کلمپ‌کردن ⚡ — اضافه‌ولتاژ را جذب می‌کند' : 'عایق کامل — مانع عبور می‌شود';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'thermistor':{
    html(){ return `
      <div class="comp-demo">${circuitLedHTML('th')}</div>
      <div class="comp-controls" style="justify-content:center;">
        <button class="comp-toggle-btn on" id="th-mode">NTC (با گرما، مقاومت کم می‌شود)</button>
      </div>
      <div class="comp-controls"><input type="range" id="th-slider" min="-20" max="150" step="1" value="25" style="flex:1"></div>
      <div class="comp-readout"><span>دما</span><span class="val" id="th-tval">۲۵ °C</span></div>
      <div class="comp-readout"><span>مقاومت تقریبی</span><span class="val" id="th-rval">—</span></div>`; },
    setup(root){
      const mode=root.querySelector('#th-mode'), slider=root.querySelector('#th-slider');
      const tval=root.querySelector('#th-tval'), rval=root.querySelector('#th-rval');
      let ntc=true;
      function update(){
        const T=parseInt(slider.value,10);
        tval.textContent=toFa(T)+' °C';
        const R0=1000, k=(T+20)/60;
        const R = ntc ? Math.max(20, R0/(1+k)) : R0*(1+k);
        rval.textContent = toFa(Math.round(R))+' Ω';
        const lit = R < R0*0.9;
        setLedState('th', root, lit, false);
      }
      mode.addEventListener('click', ()=>{
        ntc=!ntc; SFX.click();
        mode.textContent = ntc ? 'NTC (با گرما، مقاومت کم می‌شود)' : 'PTC (با گرما، مقاومت زیاد می‌شود)';
        update();
      });
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'ldr':{
    html(){ return `
      <div class="comp-demo">
        <div style="display:flex;align-items:center;gap:14px;width:100%;justify-content:center;">
          <div id="ldr-sun" style="font-size:26px;transition:opacity .15s ease;">☀️</div>
          ${circuitLedHTML('ldr')}
        </div>
      </div>
      <div class="comp-controls"><input type="range" id="ldr-slider" min="0" max="100" step="1" value="50" style="flex:1"></div>
      <div class="comp-readout"><span>نور محیط</span><span class="val" id="ldr-lval">۵۰٪</span></div>
      <div class="comp-readout"><span>مقاومت تقریبی</span><span class="val" id="ldr-rval">—</span></div>`; },
    setup(root){
      const slider=root.querySelector('#ldr-slider'), lval=root.querySelector('#ldr-lval'), rval=root.querySelector('#ldr-rval'), sun=root.querySelector('#ldr-sun');
      function update(){
        const L=parseInt(slider.value,10);
        lval.textContent=toFa(L)+'٪';
        sun.style.opacity = 0.25+L/100*0.9;
        const R = Math.round(15 + (100-L)*95);
        rval.textContent = toFa(R)+' Ω';
        setLedState('ldr', root, L>25, false);
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'strain':{
    html(){ return `
      <div class="comp-demo">
        <div class="beam-wrap"><div class="beam" id="sg-beam"></div></div>
      </div>
      <div class="comp-controls"><input type="range" id="sg-slider" min="-100" max="100" step="1" value="0" style="flex:1"></div>
      <div class="comp-readout"><span>نیروی وارده</span><span class="val" id="sg-fval">۰</span></div>
      <div class="comp-readout"><span>مقاومت (تغییر بسیار ریز است)</span><span class="val" id="sg-rval">۱۲۰٫۰۰ Ω</span></div>`; },
    setup(root){
      const slider=root.querySelector('#sg-slider'), fval=root.querySelector('#sg-fval'), rval=root.querySelector('#sg-rval'), beam=root.querySelector('#sg-beam');
      function update(){
        const F=parseInt(slider.value,10);
        fval.textContent=toFa(F);
        beam.style.transform = `skewY(${F/12}deg)`;
        const R = 120 + F*0.03;
        rval.textContent = toFa(R.toFixed(2))+' Ω';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'cap-charge':{
    html(p){
      const polarized = !!p.polarized;
      const shape = p.shape || 'disc';
      const btnLabel = p.speed==='slow' ? 'نگه‌دار — سوپرخازن آرام شارژ می‌شود' : 'نگه‌دار تا شارژ شود';
      return `
      <div class="comp-demo">
        <div class="cap-demo-row">
          ${polarized ? '<div class="cap-badge pos" id="cc-badge-a">+</div>' : '<div class="cap-lead-stub"></div>'}
          <div class="circuit-wire" id="cc-w1"></div>
          ${capBodyHTML('cc-body', shape, p.color||'#8a93a3')}
          <div class="circuit-wire" id="cc-w2"></div>
          ${polarized ? '<div class="cap-badge neg" id="cc-badge-b">−</div>' : '<div class="cap-lead-stub"></div>'}
        </div>
        <div class="cap-mini-tank"><div class="cap-mini-fill" id="cc-fill"></div></div>
      </div>
      <div class="comp-controls" style="justify-content:center;">
        <button class="comp-toggle-btn" id="cc-btn">${btnLabel}</button>
        ${polarized ? '<button class="comp-toggle-btn" id="cc-rev">🔁 پایه‌ها را برعکس وصل کن</button><button class="comp-toggle-btn" id="cc-fix" style="display:none;">🔧 تعویض خازن</button>' : ''}
      </div>
      <div class="comp-readout"><span>ظرفیت معمول</span><span class="val">${p.capLabel||'—'}</span></div>
      <div class="comp-readout"><span>وضعیت</span><span class="val" id="cc-state">خالی</span></div>
      <div class="comp-readout" id="cc-polnote" style="color:${polarized?'#e08b82':'#8fdba8'};">${polarized ? 'این خازن قطبی است — پایه‌ی + باید به سمت مثبت مدار وصل شود وگرنه آسیب می‌بیند.' : 'بدون قطبیت — از هر دو جهت درست وصل می‌شود.'}</div>`; },
    setup(root,p){
      const btn=root.querySelector('#cc-btn'), fill=root.querySelector('#cc-fill'), state=root.querySelector('#cc-state');
      const body=root.querySelector('#cc-body'), demo=root.querySelector('.comp-demo');
      const w1=root.querySelector('#cc-w1'), w2=root.querySelector('#cc-w2');
      const polarized = !!p.polarized;
      const revBtn = polarized ? root.querySelector('#cc-rev') : null;
      const fixBtn = polarized ? root.querySelector('#cc-fix') : null;
      const badgeA = polarized ? root.querySelector('#cc-badge-a') : null;
      const badgeB = polarized ? root.querySelector('#cc-badge-b') : null;
      const step = p.speed==='slow' ? 0.004 : p.speed==='normal' ? 0.015 : 0.05;
      let ratio=0, mode='idle', reversed=false, damaged=false;

      function spawnSparks(){
        const brect=body.getBoundingClientRect(), drect=demo.getBoundingClientRect();
        const cx=brect.left-drect.left+brect.width/2, cy=brect.top-drect.top+brect.height/2;
        for(let i=0;i<12;i++){
          const s=document.createElement('div'); s.className='cap-spark';
          const ang=Math.random()*Math.PI*2, dist=18+Math.random()*32;
          s.style.left=cx+'px'; s.style.top=cy+'px';
          s.style.setProperty('--sx',(Math.cos(ang)*dist)+'px');
          s.style.setProperty('--sy',(Math.sin(ang)*dist-16)+'px');
          demo.appendChild(s);
          setTimeout(()=>s.remove(),650);
        }
      }
      function updateBadges(){
        if(!polarized) return;
        badgeA.textContent = reversed ? '−' : '+';
        badgeA.className = 'cap-badge ' + (reversed ? 'neg' : 'pos');
        badgeB.textContent = reversed ? '+' : '−';
        badgeB.className = 'cap-badge ' + (reversed ? 'pos' : 'neg');
      }
      function doDamage(){
        damaged=true; mode='idle'; ratio=0;
        body.classList.add('damaged');
        fill.style.height='0%';
        w1.classList.remove('flowing'); w2.classList.remove('flowing');
        w1.classList.add('blocked'); w2.classList.add('blocked');
        state.textContent='💥 آسیب دید! با قطب معکوس شارژ شد و ترکید.';
        SFX.burn();
        spawnSparks();
        btn.disabled=true; btn.style.opacity=.4;
        revBtn.disabled=true; revBtn.style.opacity=.4;
        fixBtn.style.display='';
      }
      function tick(){
        if(!damaged){
          if(mode==='charging'){ ratio=Math.min(1,ratio+step); if(ratio>=1) mode='idle'; }
          else if(mode==='discharging'){ ratio=Math.max(0,ratio-step); if(ratio<=0) mode='idle'; }
          fill.style.height=(ratio*100)+'%';
          w1.classList.toggle('flowing', mode!=='idle');
          w2.classList.toggle('flowing', mode!=='idle');
          state.textContent = mode==='charging'?'در حال شارژ…':mode==='discharging'?'در حال دشارژ…':(ratio>0.9?'پر ⚡':ratio<0.1?'خالی':'نیمه‌شارژ');
        }
        root._raf = requestAnimationFrame(tick);
      }
      root._raf = requestAnimationFrame(tick);

      btn.addEventListener('pointerdown',(e)=>{
        e.preventDefault();
        if(damaged) return;
        if(polarized && reversed){ doDamage(); return; }
        mode='charging'; SFX.click();
      });
      btn.addEventListener('pointerup',(e)=>{ e.preventDefault(); if(!damaged) mode='discharging'; SFX.click(); });
      btn.addEventListener('pointerleave',()=>{ if(!damaged) mode='discharging'; });

      if(polarized){
        updateBadges();
        revBtn.addEventListener('click', ()=>{
          if(damaged) return;
          reversed=!reversed; SFX.hover(); updateBadges();
        });
        fixBtn.addEventListener('click', ()=>{
          damaged=false; reversed=false; ratio=0;
          body.classList.remove('damaged');
          w1.classList.remove('blocked'); w2.classList.remove('blocked');
          btn.disabled=false; btn.style.opacity='';
          revBtn.disabled=false; revBtn.style.opacity='';
          fixBtn.style.display='none';
          updateBadges();
          state.textContent='خالی';
          SFX.open();
        });
      }
    }},

  'varcap':{
    html(p){ return `
      <div class="comp-demo">
        ${p.shape ? `<div class="cap-demo-row" style="margin-bottom:6px;">${capBodyHTML('vc-body', p.shape, p.color||'#c97c3d')}</div>` : ''}
        <div class="cap-mini-tank"><div class="cap-mini-fill" id="vc-fill" style="height:100%"></div></div>
      </div>
      <div class="comp-controls"><input type="range" id="vc-slider" min="0" max="20" step="0.5" value="0" style="flex:1"></div>
      <div class="comp-readout"><span>${p.label}</span><span class="val" id="vc-vval">۰ V</span></div>
      <div class="comp-readout"><span>ظرفیت تقریبی</span><span class="val" id="vc-cval">—</span></div>
      ${p.shape ? '<div class="comp-readout" style="color:#8fdba8;">بدون قطبیت — از هر دو جهت درست وصل می‌شود.</div>' : ''}`; },
    setup(root,p){
      const slider=root.querySelector('#vc-slider'), vval=root.querySelector('#vc-vval'), cval=root.querySelector('#vc-cval'), fill=root.querySelector('#vc-fill');
      function update(){
        const V=parseFloat(slider.value);
        vval.textContent=toFa(V%1===0?V:V.toFixed(1))+' V';
        const C = p.c0/(1+V/2);
        cval.textContent = toFa(C.toFixed(1))+' pF';
        fill.style.height = (C/p.c0*100)+'%';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'inductor':{
    html(){ return `
      <div class="comp-demo">${circuitLedHTML('in')}</div>
      <div class="comp-controls" style="justify-content:center;"><button class="comp-toggle-btn" id="in-power">🔌 وصل کن</button></div>
      <div class="comp-readout"><span>جریان (به‌آرامی تغییر می‌کند)</span><span class="val" id="in-ival">۰٪</span></div>
      <div class="comp-readout" id="in-note" style="color:#b9b2a0;">🌀 سلف با تغییر ناگهانی جریان مخالفت می‌کند</div>`; },
    setup(root,p){
      const btn=root.querySelector('#in-power'), ival=root.querySelector('#in-ival');
      let on=false, cur=0, target=0, last=performance.now();
      function frame(ts){
        const dt=Math.min(50, ts-last); last=ts;
        const rate = dt/p.rampMs;
        cur += (target-cur)*Math.min(1, rate*4);
        ival.textContent = toFa(Math.round(cur*100))+'٪';
        setLedState('in', root, cur>0.05, false);
        root._raf = requestAnimationFrame(frame);
      }
      root._raf = requestAnimationFrame(frame);
      btn.addEventListener('click', ()=>{
        on=!on; target=on?1:0; SFX.click();
        btn.classList.toggle('on', on);
        btn.textContent = on ? '🔌 قطع کن' : '🔌 وصل کن';
      });
    }},

  'transformer':{
    html(){ return `
      <div class="comp-demo">
        <div class="transformer-row">
          <div class="coil"><div class="coil-label">اولیه (Primary)</div><div class="coil-icon">🌀</div><div class="mono" id="tf-pval">۰ V</div></div>
          <div class="coil-arrow">←</div>
          <div class="coil"><div class="coil-label">ثانویه (Secondary)</div><div class="coil-icon">🌀</div><div class="mono" id="tf-sval">۰ V</div></div>
        </div>
      </div>
      <div class="comp-controls"><input type="range" id="tf-slider" min="0" max="24" step="1" value="12" style="flex:1"></div>
      <div class="comp-controls" style="justify-content:center;gap:8px;">
        <button class="comp-toggle-btn on" data-r="0.5" id="tf-down">کاهنده ×۰٫۵</button>
        <button class="comp-toggle-btn" data-r="1" id="tf-iso">ایزوله ×۱</button>
        <button class="comp-toggle-btn" data-r="2" id="tf-up">افزاینده ×۲</button>
      </div>`; },
    setup(root){
      const slider=root.querySelector('#tf-slider'), pval=root.querySelector('#tf-pval'), sval=root.querySelector('#tf-sval');
      const btns=[root.querySelector('#tf-down'),root.querySelector('#tf-iso'),root.querySelector('#tf-up')];
      let ratio=0.5;
      function update(){
        const V=parseInt(slider.value,10);
        pval.textContent=toFa(V)+' V';
        sval.textContent=toFa((V*ratio).toFixed(1))+' V';
      }
      btns.forEach(b=>b.addEventListener('click', ()=>{
        ratio=parseFloat(b.dataset.r); SFX.click();
        btns.forEach(x=>x.classList.toggle('on', x===b));
        update();
      }));
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'oscillator':{
    html(p){ return `
      <div class="comp-demo"><div class="wave-line flowing" id="osc-wave"></div></div>
      <div class="comp-controls" style="justify-content:center;"><button class="comp-toggle-btn on" id="osc-btn">⏸ توقف نوسان</button></div>
      <div class="comp-readout"><span>فرکانس نوسان</span><span class="val">${p.freqLabel}</span></div>`; },
    setup(root){
      const btn=root.querySelector('#osc-btn'), wave=root.querySelector('#osc-wave');
      let on=true;
      btn.addEventListener('click', ()=>{
        on=!on; SFX.click();
        wave.classList.toggle('flowing', on);
        btn.classList.toggle('on', on);
        btn.textContent = on ? '⏸ توقف نوسان' : '▶ ادامه نوسان';
      });
    }},

  'diode-flip':{
    html(){ return `
      <div class="comp-demo">
        <div class="circuit-row">
          <div class="circuit-batt" id="dd-batt">🔋</div>
          <div class="circuit-wire" id="dd-w1"></div>
          <div class="diode-shape"><div class="diode-tri" id="dd-tri"></div><div class="diode-bar" id="dd-bar"></div><span class="diode-x" id="dd-x">✕</span></div>
          <div class="circuit-wire" id="dd-w2"></div>
        </div>
      </div>
      <div class="comp-controls" style="justify-content:center;"><button class="comp-toggle-btn" id="dd-flip">🔁 برعکس کن جهت باتری</button></div>
      <div class="comp-readout"><span>جریان</span><span class="val" id="dd-status">عبور می‌کند ✅</span></div>`; },
    setup(root){
      const flip=root.querySelector('#dd-flip'), status=root.querySelector('#dd-status');
      const tri=root.querySelector('#dd-tri'), bar=root.querySelector('#dd-bar'), x=root.querySelector('#dd-x');
      const w1=root.querySelector('#dd-w1'), w2=root.querySelector('#dd-w2'), batt=root.querySelector('#dd-batt');
      let forward=true;
      function update(){
        tri.classList.toggle('on', forward); tri.classList.toggle('blocked', !forward);
        bar.classList.toggle('on', forward); bar.classList.toggle('blocked', !forward);
        w1.classList.toggle('flowing', forward); w2.classList.toggle('flowing', forward);
        w1.classList.toggle('blocked', !forward); w2.classList.toggle('blocked', !forward);
        x.classList.toggle('show', !forward);
        batt.style.transform = forward ? '' : 'scaleX(-1)';
        status.textContent = forward ? 'عبور می‌کند ✅' : 'مسدود شده 🚫';
      }
      flip.addEventListener('click', ()=>{ forward=!forward; SFX.click(); update(); });
      update();
    }},

  'led-polarity':{
    html(){ return `
      <div class="comp-demo">${circuitLedHTML('lp')}</div>
      <div class="comp-controls">
        <button class="comp-toggle-btn" id="lp-power">🔌 وصل کن</button>
        <button class="comp-toggle-btn" id="lp-pol">↔️ برعکس کن پایه‌ها</button>
      </div>
      <div class="comp-readout"><span>وضعیت پایه‌ها</span><span class="val" id="lp-status">درست (Forward)</span></div>`; },
    setup(root){
      const power=root.querySelector('#lp-power'), pol=root.querySelector('#lp-pol'), status=root.querySelector('#lp-status');
      let on=false, reversed=false;
      function update(){
        setLedState('lp', root, on && !reversed, false);
        const w1=root.querySelector('#lp-w1'), w2=root.querySelector('#lp-w2');
        w1.classList.toggle('blocked', on && reversed); w2.classList.toggle('blocked', on && reversed);
        power.classList.toggle('on', on);
        status.textContent = reversed ? 'برعکس (Reverse) — جریان رد نمی‌شود' : 'درست (Forward)';
      }
      power.addEventListener('click', ()=>{ on=!on; SFX.click(); update(); });
      pol.addEventListener('click', ()=>{ reversed=!reversed; SFX.hover(); update(); });
      update();
    }},

  'photodiode':{
    html(){ return `
      <div class="comp-demo">
        <div style="display:flex;align-items:center;gap:14px;">
          <div id="pd-sun" style="font-size:24px;opacity:.4;">☀️</div>
          <div>→</div>
          <div class="led-bulb" id="pd-dot"></div>
        </div>
      </div>
      <div class="comp-controls"><input type="range" id="pd-slider" min="0" max="100" step="1" value="30" style="flex:1"></div>
      <div class="comp-readout"><span>نور تابیده‌شده</span><span class="val" id="pd-lval">۳۰٪</span></div>
      <div class="comp-readout"><span>جریان تولیدشده</span><span class="val" id="pd-ival">—</span></div>`; },
    setup(root){
      const slider=root.querySelector('#pd-slider'), lval=root.querySelector('#pd-lval'), ival=root.querySelector('#pd-ival');
      const sun=root.querySelector('#pd-sun'), dot=root.querySelector('#pd-dot');
      function update(){
        const L=parseInt(slider.value,10);
        lval.textContent=toFa(L)+'٪';
        sun.style.opacity=0.25+L/100*0.9;
        const uA=0.2+L*0.8/100*20;
        ival.textContent=toFa(uA.toFixed(2))+' µA';
        dot.classList.toggle('lit', L>10);
        dot.style.opacity = 0.3+L/100*0.7;
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'zener':{
    html(p){ return `
      <div class="comp-demo">${circuitLedHTML('zn')}</div>
      <div class="comp-controls"><input type="range" id="zn-slider" min="0" max="15" step="0.5" value="0" style="flex:1"></div>
      <div class="comp-readout"><span>ولتاژ منبع</span><span class="val" id="zn-vval">۰ V</span></div>
      <div class="comp-readout"><span>ولتاژ خروجی (تثبیت‌شده روی ${toFa(p.zenerV)}V)</span><span class="val" id="zn-oval">۰ V</span></div>`; },
    setup(root,p){
      const slider=root.querySelector('#zn-slider'), vval=root.querySelector('#zn-vval'), oval=root.querySelector('#zn-oval');
      function update(){
        const V=parseFloat(slider.value);
        vval.textContent=toFa(V%1===0?V:V.toFixed(1))+' V';
        const on=V>=p.zenerV;
        setLedState('zn', root, on, false);
        oval.textContent = toFa((on?p.zenerV:V).toFixed(1))+' V';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'tvs':{
    html(){ return `
      <div class="comp-demo">${circuitLedHTML('tv')}</div>
      <div class="comp-controls" style="justify-content:center;"><button class="comp-toggle-btn" id="tv-btn">⚡ پالس ولتاژ گذرا (Surge)</button></div>
      <div class="comp-readout"><span>وضعیت</span><span class="val" id="tv-state">آماده — در انتظار surge</span></div>`; },
    setup(root){
      const btn=root.querySelector('#tv-btn'), state=root.querySelector('#tv-state');
      let busy=false;
      btn.addEventListener('click', ()=>{
        if(busy) return; busy=true; SFX.complete();
        setLedState('tv', root, true, false);
        const led=root.querySelector('#tv-led');
        led.style.background='radial-gradient(circle at 40% 35%,#e8ffe0,#8ff0c4 55%,#3ea86a)';
        led.style.boxShadow='0 0 18px 6px rgba(87,216,163,.6)';
        state.textContent='کلمپ شد! مدار محافظت شد ✅';
        setTimeout(()=>{
          setLedState('tv', root, false, false);
          led.style.background=''; led.style.boxShadow='';
          state.textContent='آماده — در انتظار surge';
          busy=false;
        }, 900);
      });
    }},

  'bridge':{
    html(){ return `
      <div class="comp-demo">${circuitLedHTML('br')}</div>
      <div class="comp-controls" style="justify-content:center;"><button class="comp-toggle-btn" id="br-flip">🔁 نیم‌سیکل AC را عوض کن</button></div>
      <div class="comp-readout"><span>ورودی</span><span class="val" id="br-in">نیم‌سیکل مثبت +</span></div>
      <div class="comp-readout"><span>خروجی</span><span class="val">DC یکسو‌شده ✅ (همیشه ثابت)</span></div>`; },
    setup(root){
      const flip=root.querySelector('#br-flip'), inEl=root.querySelector('#br-in');
      let pos=true;
      setLedState('br', root, true, false);
      flip.addEventListener('click', ()=>{
        pos=!pos; SFX.click();
        inEl.textContent = pos ? 'نیم‌سیکل مثبت +' : 'نیم‌سیکل منفی −';
        setLedState('br', root, true, false); // output stays lit either way
      });
    }},

  'transistor-bjt':{
    html(p){ return `
      <div class="comp-demo">
        <div class="transistor-wrap">
          <div style="font-size:11px;color:var(--muted);width:100%;text-align:center;">جریان کلکتور (خروجی)</div>
          <div class="transistor-gauge"><div class="transistor-gauge-fill" id="tb-fill"></div></div>
        </div>
      </div>
      <div class="comp-controls"><input type="range" id="tb-slider" min="0" max="100" step="1" value="20" style="flex:1"></div>
      <div class="comp-readout"><span>جریان پایه (Base)</span><span class="val" id="tb-base">—</span></div>
      <div class="comp-readout"><span>جریان کلکتور (β≈${toFa(p.beta)})</span><span class="val" id="tb-col">—</span></div>`; },
    setup(root,p){
      const slider=root.querySelector('#tb-slider'), fill=root.querySelector('#tb-fill');
      const baseEl=root.querySelector('#tb-base'), colEl=root.querySelector('#tb-col');
      function update(){
        const baseMA=parseInt(slider.value,10)/100;
        const colMA=Math.min(100, baseMA*p.beta);
        fill.style.width=colMA+'%';
        baseEl.textContent=toFa(baseMA.toFixed(2))+' mA';
        colEl.textContent=toFa(colMA.toFixed(0))+' mA'+(baseMA*p.beta>100?' (اشباع)':'');
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'mosfet-gate':{
    html(p){ return `
      <div class="comp-demo">${circuitLedHTML('mf')}</div>
      <div class="comp-controls"><input type="range" id="mf-slider" min="${p.minV}" max="${p.maxV}" step="0.1" value="${p.normallyOn?p.maxV:p.minV}" style="flex:1"></div>
      <div class="comp-readout"><span>ولتاژ گیت (Vgs)</span><span class="val" id="mf-vval">—</span></div>
      <div class="comp-readout"><span>وضعیت کانال (آستانه ${toFa(p.vth)}V)</span><span class="val" id="mf-state">—</span></div>`; },
    setup(root,p){
      const slider=root.querySelector('#mf-slider'), vval=root.querySelector('#mf-vval'), state=root.querySelector('#mf-state');
      function update(){
        const V=parseFloat(slider.value);
        vval.textContent=toFa(V.toFixed(1))+' V';
        const on = p.normallyOn ? (V>p.vth) : (V>=p.vth);
        setLedState('mf', root, on, false);
        state.textContent = on ? 'کانال کاملاً باز — روشن ✅' : 'کانال بسته — خاموش 🚫';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'scr-latch':{
    html(p){ return `
      <div class="comp-demo">${circuitLedHTML('sc')}</div>
      <div class="comp-controls">
        <button class="comp-toggle-btn" id="sc-gate">⚡ پالس گیت (Trigger)</button>
        <button class="comp-toggle-btn" id="sc-off">⏹ قطع جریان اصلی</button>
      </div>
      <div class="comp-readout"><span>وضعیت</span><span class="val" id="sc-state">خاموش</span></div>
      ${p.bidirectional? `<div class="comp-readout" style="color:#b9b2a0;">🔁 برخلاف SCR، در هر دو جهت AC هم کار می‌کند</div>`:''}`; },
    setup(root){
      const gate=root.querySelector('#sc-gate'), off=root.querySelector('#sc-off'), state=root.querySelector('#sc-state');
      let latched=false;
      function update(){
        setLedState('sc', root, latched, false);
        state.textContent = latched ? 'قفل‌شده — روشن (حتی بدون پالس گیت) 🔒' : 'خاموش';
      }
      gate.addEventListener('click', ()=>{ latched=true; SFX.complete(); update(); });
      off.addEventListener('click', ()=>{ latched=false; SFX.click(); update(); });
      update();
    }},

  'diac-breakover':{
    html(p){ return `
      <div class="comp-demo">${circuitLedHTML('dc')}</div>
      <div class="comp-controls"><input type="range" id="dc-slider" min="0" max="60" step="1" value="0" style="flex:1"></div>
      <div class="comp-readout"><span>ولتاژ اعمالی</span><span class="val" id="dc-vval">۰ V</span></div>
      <div class="comp-readout"><span>وضعیت (ولتاژ شکست ${toFa(p.breakoverV)}V)</span><span class="val" id="dc-state">مسدود</span></div>`; },
    setup(root,p){
      const slider=root.querySelector('#dc-slider'), vval=root.querySelector('#dc-vval'), state=root.querySelector('#dc-state');
      function update(){
        const V=parseInt(slider.value,10);
        vval.textContent=toFa(V)+' V';
        const on=V>=p.breakoverV;
        setLedState('dc', root, on, false);
        state.textContent = on ? 'شکست ناگهانی — عبور می‌کند ⚡' : 'مسدود';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'tunnel-iv':{
    html(){ return `
      <div class="comp-demo">
        <svg class="iv-svg" viewBox="0 0 220 110" preserveAspectRatio="none">
          <polyline id="iv-curve" fill="none" stroke="#3f9d78" stroke-width="2"/>
          <circle id="iv-dot" r="4.5" fill="#57d8a3"/>
        </svg>
      </div>
      <div class="comp-controls"><input type="range" id="iv-slider" min="0" max="100" step="1" value="10" style="flex:1"></div>
      <div class="comp-readout"><span>ولتاژ اعمالی</span><span class="val" id="iv-vval">—</span></div>
      <div class="comp-readout"><span>جریان (نسبی)</span><span class="val" id="iv-ival">—</span></div>
      <div class="comp-readout" id="iv-note" style="color:#b9b2a0;"></div>`; },
    setup(root){
      const slider=root.querySelector('#iv-slider'), curve=root.querySelector('#iv-curve'), dot=root.querySelector('#iv-dot');
      const vval=root.querySelector('#iv-vval'), ival=root.querySelector('#iv-ival'), note=root.querySelector('#iv-note');
      const W=220, H=110, pad=8;
      // simplified tunnel-diode model: tunneling term (rises then decays) + normal diode term (rises late)
      function f(x){ return 5*x*Math.exp(-8*x) + 0.012*(Math.exp(4*x)-1); }
      let pts=[], ys=[];
      for(let i=0;i<=60;i++){ const x=i/60; ys.push(f(x)); }
      const maxY = Math.max(...ys);
      for(let i=0;i<=60;i++){
        const x=i/60, y=ys[i];
        pts.push([pad+x*(W-2*pad), H-pad-(y/maxY)*(H-2*pad)]);
      }
      curve.setAttribute('points', pts.map(p=>p.join(',')).join(' '));
      function update(){
        const pct=parseInt(slider.value,10)/100;
        vval.textContent=toFa(Math.round(pct*100))+'٪';
        const y=f(pct);
        ival.textContent=toFa(y.toFixed(3));
        const px=pad+pct*(W-2*pad), py=H-pad-(y/maxY)*(H-2*pad);
        dot.setAttribute('cx',px); dot.setAttribute('cy',py);
        note.textContent = (pct>0.13 && pct<0.5) ? '👀 اینجا با زیادشدن ولتاژ، جریان کم می‌شود — «مقاومت منفی»!' : '';
      }
      slider.addEventListener('input', ()=>{ SFX.hover(); update(); });
      update();
    }},

  'speaker-drive':{
    html(p){ return `
      <div class="mcu-explain spk-explain">
        <b>چرا اهم و وات به هم مربوطن؟</b><br>
        وات (توان) به تنهایی یه عدد ثابت روی بدنه‌ی قطعه نیست؛ نتیجه‌ی ترکیب ولتاژ و مقاومت (یا امپدانس بلندگو، که با اهم اندازه می‌گیریم) است. وقتی آمپلی‌فایر یه ولتاژ ثابت به بلندگو می‌ده، هرچی مقاومت بلندگو (اهم) کمتر باشه، جریان بیشتری کشیده می‌شه و توان (وات) بالاتر می‌ره؛ یعنی صدا بلندتر و بلندگو داغ‌تر می‌شه.
      </div>
      <div class="spk-formula-grid">
        <div class="spk-formula-chip"><span class="f">P = V × I</span><span class="d">توان یعنی ولتاژ ضربدر جریان</span></div>
        <div class="spk-formula-chip"><span class="f">P = V² / R</span><span class="d">ولتاژ ثابت، اهم کمتر ← وات بیشتر</span></div>
        <div class="spk-formula-chip"><span class="f">P = I² × R</span><span class="d">جریان بیشتر، حتی با اهم بالا، وات رو بالا می‌بره</span></div>
        <div class="spk-formula-chip"><span class="f">V = I × R</span><span class="d">قانون اهم؛ پایه‌ی همه‌ی فرمول‌های بالا</span></div>
      </div>
      <div class="comp-demo">
        <svg class="speaker-cone-svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="92" fill="#141924" stroke="var(--panel-border)" stroke-width="2"/>
          <circle cx="100" cy="100" r="74" fill="#0e131c"/>
          <circle cx="100" cy="100" r="74" fill="none" stroke="var(--copper)" stroke-opacity=".3" stroke-width="1"/>
          <g id="spk-cone">
            <circle cx="100" cy="100" r="50" fill="#1a2130" stroke="var(--trace-bright)" stroke-opacity=".55" stroke-width="1.5"/>
            <circle cx="100" cy="100" r="20" fill="var(--copper)"/>
            <circle cx="100" cy="100" r="6" fill="#0e131c"/>
          </g>
        </svg>
        <canvas id="spk-wave" width="220" height="46" class="speaker-wave-canvas"></canvas>
      </div>
      <div class="comp-readout"><span>ولتاژ آمپلی‌فایر</span><span class="val" id="spk-vval">—</span></div>
      <div class="comp-controls"><input type="range" id="spk-v" min="${p.minV}" max="${p.maxV}" step="0.5" value="${p.defV}" style="flex:1"></div>
      <div class="comp-readout"><span>مقاومت بلندگو (اهم)</span><span class="val" id="spk-rval">—</span></div>
      <div class="comp-controls"><input type="range" id="spk-r" min="${p.minR}" max="${p.maxR}" step="0.5" value="${p.defR}" style="flex:1"></div>
      <div class="comp-readout"><span>توان مصرفی — P = V² ÷ R</span><span class="val" id="spk-pval">—</span></div>
      <div class="comp-readout"><span>جریان — I = V ÷ R</span><span class="val" id="spk-ival">—</span></div>
      <div class="comp-controls" style="justify-content:center;"><button class="comp-toggle-btn" id="spk-play">🔊 پخش صدا</button></div>
      <div class="comp-readout" id="spk-warn" style="color:#e08b82;"></div>`; },
    setup(root,p){
      const vSlider=root.querySelector('#spk-v'), rSlider=root.querySelector('#spk-r');
      const vval=root.querySelector('#spk-vval'), rval=root.querySelector('#spk-rval');
      const pval=root.querySelector('#spk-pval'), ival=root.querySelector('#spk-ival');
      const warn=root.querySelector('#spk-warn'), playBtn=root.querySelector('#spk-play');
      const cone=root.querySelector('#spk-cone'), demo=root.querySelector('.comp-demo');
      const waveCv=root.querySelector('#spk-wave'), wctx=waveCv.getContext('2d');
      let P=0, playing=false, osc=null, gainNode=null, analyser=null;
      const maxAmpP = p.dangerP*1.4;
      const rootVars=getComputedStyle(document.documentElement);
      const colorTrace=(rootVars.getPropertyValue('--trace-bright')||'#57d8a3').trim();
      const colorDanger=(rootVars.getPropertyValue('--danger')||'#c1554a').trim();

      function compute(){
        const V=parseFloat(vSlider.value), R=parseFloat(rSlider.value);
        P=(V*V)/R;
        const I=V/R;
        vval.textContent=toFa(V.toFixed(1))+' V';
        rval.textContent=toFa(R.toFixed(1))+' Ω';
        pval.textContent=toFa(P.toFixed(2))+' W';
        ival.textContent=toFa(I.toFixed(2))+' A';
        const overloaded=P>p.ratedP, critical=P>p.dangerP;
        demo.classList.toggle('danger', overloaded);
        warn.textContent = critical ? '🔥 خطر جدی — این توان می‌تواند سیم‌پیچ را بسوزاند!'
          : overloaded ? '⚠ از توان مجاز بلندگو رد شدی — صدا خش‌دار می‌شود'
          : '';
        if(playing && gainNode){
          const norm=Math.min(1, Math.sqrt(P)/Math.sqrt(maxAmpP));
          gainNode.gain.setTargetAtTime(norm*0.22, getAudioCtx().currentTime, 0.05);
          osc.frequency.setTargetAtTime(critical ? 220+(Math.random()-0.5)*40 : 220, getAudioCtx().currentTime, 0.03);
        }
      }
      vSlider.addEventListener('input', ()=>{ SFX.hover(); compute(); });
      rSlider.addEventListener('input', ()=>{ SFX.hover(); compute(); });

      playBtn.addEventListener('click', ()=>{
        SFX.click();
        playing=!playing;
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ توقف صدا' : '🔊 پخش صدا';
        const ctx=getAudioCtx();
        if(playing){
          track('speaker_played', { power_w: Number(P.toFixed(2)) });
          osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=220;
          gainNode=ctx.createGain(); gainNode.gain.value=0.0001;
          analyser=ctx.createAnalyser(); analyser.fftSize=512;
          osc.connect(gainNode).connect(analyser).connect(ctx.destination);
          osc.start();
        } else if(osc){
          gainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
          osc.stop(ctx.currentTime+0.25);
          osc=null; gainNode=null; analyser=null;
        }
        compute();
      });

      const waveBuf = new Uint8Array(256);
      let t=0, last=performance.now();
      function frame(ts){
        const dt=Math.min(50, ts-last); last=ts; t+=dt*0.006;
        const amp=Math.min(1, Math.sqrt(P)/Math.sqrt(maxAmpP));
        const disp=Math.sin(t)*(2+amp*7);
        const scale=1+amp*0.05;
        cone.setAttribute('transform', `translate(0 ${disp.toFixed(2)}) scale(${scale.toFixed(3)})`);

        wctx.clearRect(0,0,waveCv.width,waveCv.height);
        wctx.beginPath();
        wctx.strokeStyle = P>p.ratedP ? colorDanger : colorTrace;
        wctx.lineWidth=1.6;
        if(playing && analyser){
          analyser.getByteTimeDomainData(waveBuf);
          for(let i=0;i<waveBuf.length;i++){
            const x=(i/waveBuf.length)*waveCv.width, y=(waveBuf[i]/128)*(waveCv.height/2);
            i===0? wctx.moveTo(x,y) : wctx.lineTo(x,y);
          }
        } else {
          for(let x=0;x<waveCv.width;x++){
            const y=waveCv.height/2 + Math.sin((x/waveCv.width)*Math.PI*4+t)*amp*(waveCv.height/2-4);
            x===0? wctx.moveTo(x,y) : wctx.lineTo(x,y);
          }
        }
        wctx.stroke();
        root._raf=requestAnimationFrame(frame);
      }
      root._raf=requestAnimationFrame(frame);
      compute();
    }},

  'mcu-intro':{
    html(){
      const blocksHTML = MCU_BLOCKS.map((b,i) =>
        `<button class="mcu-block" data-idx="${i}"><span class="mcu-block-icon">${b.icon}</span><span class="mcu-block-name">${b.name}</span></button>`
      ).join('');
      return `
      <div class="comp-demo mcu-demo"><div class="mcu-block-grid">${blocksHTML}</div></div>
      <div class="mcu-explain" id="mcu-explain">روی هر بخش بزن تا ببینی چه‌کار می‌کند.</div>`; },
    setup(root){
      const explain = root.querySelector('#mcu-explain');
      root.querySelectorAll('.mcu-block').forEach(btn => {
        btn.addEventListener('click', () => {
          SFX.click();
          root.querySelectorAll('.mcu-block.active').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const b = MCU_BLOCKS[parseInt(btn.dataset.idx,10)];
          explain.innerHTML = `<b>${b.icon} ${b.name}</b><br>${b.desc}`;
        });
      });
    }},

  'nano-pinout':{
    html(){ return `
      <div class="comp-demo nano-demo">${buildNanoPinoutSVG()}</div>
      <div class="pin-badge-legend">
        <span class="lg-pwm">~ پایه‌ی PWM</span>
        <span class="lg-caution">&#9888; نیاز به احتیاط</span>
      </div>
      <div class="pin-filter-row" id="np-filter">
        <button class="pin-filter-chip active" data-type="all">همه</button>
        <button class="pin-filter-chip" data-type="digital" style="--fc:#57d8a3">دیجیتال</button>
        <button class="pin-filter-chip" data-type="analog" style="--fc:#4aa8ff">آنالوگ</button>
        <button class="pin-filter-chip" data-type="power" style="--fc:#e8801e">تغذیه</button>
        <button class="pin-filter-chip" data-type="ground" style="--fc:#8a93a3">زمین</button>
        <button class="pin-filter-chip" data-type="control" style="--fc:#c1554a">ریست</button>
      </div>
      <div class="pin-filter-row" id="np-io-filter">
        <button class="pin-filter-chip active" data-io="all">همه‌جهت</button>
        <button class="pin-filter-chip" data-io="in" style="--fc:#c99cff">ورودی</button>
        <button class="pin-filter-chip" data-io="out" style="--fc:#ffd166">خروجی</button>
      </div>
      <div class="nano-readout" id="np-readout">
        <div class="np-name" id="np-name">روی یکی از پایه‌ها بزن</div>
        <div class="np-type" id="np-type"></div>
        <div class="np-desc" id="np-desc">روی نقشه بزن، یا با دکمه‌ها فیلتر کن. نکته: چند پایه (مثل A6 و A7) فقط ورودی‌اند و نمی‌توانند خروجی بدهند — با فیلتر «خروجی» می‌بینی کدام‌ها نیستند.</div>
      </div>`; },
    setup(root){
      const svg = root.querySelector('.nano-svg');
      const filterRow = root.querySelector('#np-filter');
      const ioFilterRow = root.querySelector('#np-io-filter');
      const nameEl = root.querySelector('#np-name'), typeEl = root.querySelector('#np-type'), descEl = root.querySelector('#np-desc');
      const TYPE_FA = { digital:'دیجیتال', analog:'آنالوگ', power:'تغذیه', ground:'زمین (GND)', control:'کنترل / ریست' };
      const DEFAULT_DESC = 'روی نقشه بزن، یا با دکمه‌ها فیلتر کن. نکته: چند پایه (مثل A6 و A7) فقط ورودی‌اند و نمی‌توانند خروجی بدهند — با فیلتر «خروجی» می‌بینی کدام‌ها نیستند.';
      function pinIO(pin){
        if(pin.io) return pin.io; // 'in' explicitly marked on input-only pins
        if(pin.type==='digital' || pin.type==='analog') return 'both';
        return 'none'; // power/ground/control pins aren't I/O at all
      }
      let activeFilter = 'all', activeIO = 'all';
      function applyFilter(){
        svg.querySelectorAll('.nano-pin').forEach(g => {
          const pin = ARDUINO_NANO_PINS[g.dataset.side][parseInt(g.dataset.idx,10)];
          const io = pinIO(pin);
          const typeMatch = activeFilter==='all' || pin.type===activeFilter;
          const ioMatch = activeIO==='all' || (activeIO==='in' && (io==='in'||io==='both')) || (activeIO==='out' && io==='both');
          const match = typeMatch && ioMatch;
          g.classList.toggle('dimmed', !match);
          if(!match && g.classList.contains('selected')){
            g.classList.remove('selected');
            nameEl.textContent = 'روی یکی از پایه‌ها بزن';
            typeEl.textContent = '';
            descEl.textContent = DEFAULT_DESC;
          }
        });
      }
      filterRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.pin-filter-chip');
        if(!chip) return;
        SFX.click();
        activeFilter = chip.dataset.type;
        Array.from(filterRow.children).forEach(c => c.classList.toggle('active', c===chip));
        const showIO = activeFilter==='all';
        ioFilterRow.classList.toggle('hidden', !showIO);
        if(!showIO && activeIO!=='all'){
          activeIO = 'all';
          Array.from(ioFilterRow.children).forEach(c => c.classList.toggle('active', c.dataset.io==='all'));
        }
        applyFilter();
      });
      ioFilterRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.pin-filter-chip');
        if(!chip) return;
        SFX.click();
        activeIO = chip.dataset.io;
        Array.from(ioFilterRow.children).forEach(c => c.classList.toggle('active', c===chip));
        applyFilter();
      });
      svg.addEventListener('click', (e) => {
        const g = e.target.closest('.nano-pin');
        if(!g || g.classList.contains('dimmed')) return;
        SFX.click();
        svg.querySelectorAll('.nano-pin.selected').forEach(x => x.classList.remove('selected'));
        g.classList.add('selected');
        const pin = ARDUINO_NANO_PINS[g.dataset.side][parseInt(g.dataset.idx,10)];
        nameEl.textContent = pin.name + (pin.sub ? ` (${pin.sub})` : '');
        const tags = [TYPE_FA[pin.type] || ''];
        if(pin.pwm) tags.push('~ PWM');
        if(pin.caution) tags.push('⚠ نیاز به احتیاط');
        typeEl.innerHTML = tags.map((t,i) => i===0 ? t : `<span class="${t.startsWith('~')?'tag-pwm':'tag-caution'}">${t}</span>`).join(' &middot; ');
        descEl.textContent = pin.desc;
      });
    }},

  'esp32-pinout':{
    html(){ return `
      <div class="comp-demo esp32-demo">${buildEsp32PinoutSVG()}</div>
      <div class="pin-badge-legend">
        <span class="lg-pwm">~ PWM</span>
        <span class="lg-caution">&#9888; نیاز به احتیاط</span>
      </div>
      <div class="pin-filter-row" id="ep-filter">
        <button class="pin-filter-chip active" data-type="all">همه</button>
        <button class="pin-filter-chip" data-type="digital" style="--fc:#57d8a3">دیجیتال</button>
        <button class="pin-filter-chip" data-type="analog" style="--fc:#4aa8ff">آنالوگ</button>
        <button class="pin-filter-chip" data-type="power" style="--fc:#e8801e">تغذیه</button>
        <button class="pin-filter-chip" data-type="ground" style="--fc:#8a93a3">زمین</button>
        <button class="pin-filter-chip" data-type="control" style="--fc:#c1554a">کنترل/ریست</button>
      </div>
      <div class="pin-filter-row" id="ep-io-filter">
        <button class="pin-filter-chip active" data-io="all">همه‌جهت</button>
        <button class="pin-filter-chip" data-io="in" style="--fc:#c99cff">ورودی</button>
        <button class="pin-filter-chip" data-io="out" style="--fc:#ffd166">خروجی</button>
      </div>
      <div class="esp32-readout" id="ep-readout">
        <div class="ep-name" id="ep-name">روی یکی از پایه‌ها بزن</div>
        <div class="ep-type" id="ep-type"></div>
        <div class="ep-desc" id="ep-desc">روی نقشه بزن، یا با دکمه‌ها فیلتر کن. نکته: چند پایه (مثل VP، VN، GPIO34 و GPIO35) فقط ورودی‌اند و نمی‌توانند خروجی بدهند — با فیلتر «خروجی» می‌بینی کدام‌ها نیستند. علامت ~ یعنی این پایه می‌تواند PWM نرم‌افزاری (LEDC) هم بدهد.</div>
      </div>`; },
    setup(root){
      const svg = root.querySelector('.esp32-svg');
      const filterRow = root.querySelector('#ep-filter');
      const ioFilterRow = root.querySelector('#ep-io-filter');
      const nameEl = root.querySelector('#ep-name'), typeEl = root.querySelector('#ep-type'), descEl = root.querySelector('#ep-desc');
      const TYPE_FA = { digital:'دیجیتال', analog:'آنالوگ', power:'تغذیه', ground:'زمین (GND)', control:'کنترل / ریست' };
      const DEFAULT_DESC = 'روی نقشه بزن، یا با دکمه‌ها فیلتر کن. نکته: چند پایه (مثل VP، VN، GPIO34 و GPIO35) فقط ورودی‌اند و نمی‌توانند خروجی بدهند — با فیلتر «خروجی» می‌بینی کدام‌ها نیستند. علامت ~ یعنی این پایه می‌تواند PWM نرم‌افزاری (LEDC) هم بدهد.';
      function pinIO(pin){
        if(pin.io) return pin.io; // 'in' explicitly marked on input-only pins
        if(pin.type==='digital' || pin.type==='analog') return 'both';
        return 'none'; // power/ground/control pins aren't I/O at all
      }
      let activeFilter = 'all', activeIO = 'all';
      function applyFilter(){
        svg.querySelectorAll('.esp32-pin').forEach(g => {
          const pin = ESP32_PINS[g.dataset.side][parseInt(g.dataset.idx,10)];
          const io = pinIO(pin);
          const typeMatch = activeFilter==='all' || pin.type===activeFilter;
          const ioMatch = activeIO==='all' || (activeIO==='in' && (io==='in'||io==='both')) || (activeIO==='out' && io==='both');
          const match = typeMatch && ioMatch;
          g.classList.toggle('dimmed', !match);
          if(!match && g.classList.contains('selected')){
            g.classList.remove('selected');
            nameEl.textContent = 'روی یکی از پایه‌ها بزن';
            typeEl.textContent = '';
            descEl.textContent = DEFAULT_DESC;
          }
        });
      }
      filterRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.pin-filter-chip');
        if(!chip) return;
        SFX.click();
        activeFilter = chip.dataset.type;
        Array.from(filterRow.children).forEach(c => c.classList.toggle('active', c===chip));
        const showIO = activeFilter==='all';
        ioFilterRow.classList.toggle('hidden', !showIO);
        if(!showIO && activeIO!=='all'){
          activeIO = 'all';
          Array.from(ioFilterRow.children).forEach(c => c.classList.toggle('active', c.dataset.io==='all'));
        }
        applyFilter();
      });
      ioFilterRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.pin-filter-chip');
        if(!chip) return;
        SFX.click();
        activeIO = chip.dataset.io;
        Array.from(ioFilterRow.children).forEach(c => c.classList.toggle('active', c===chip));
        applyFilter();
      });
      svg.addEventListener('click', (e) => {
        const g = e.target.closest('.esp32-pin');
        if(!g || g.classList.contains('dimmed')) return;
        SFX.click();
        svg.querySelectorAll('.esp32-pin.selected').forEach(x => x.classList.remove('selected'));
        g.classList.add('selected');
        const pin = ESP32_PINS[g.dataset.side][parseInt(g.dataset.idx,10)];
        nameEl.textContent = pin.name + (pin.sub ? ` (${pin.sub})` : '');
        const tags = [TYPE_FA[pin.type] || ''];
        if(pin.pwm) tags.push('~ PWM');
        if(pin.caution) tags.push('⚠ نیاز به احتیاط');
        typeEl.innerHTML = tags.map((t,i) => i===0 ? t : `<span class="${t.startsWith('~')?'tag-pwm':'tag-caution'}">${t}</span>`).join(' &middot; ');
        descEl.textContent = pin.desc;
      });
    }},

  'stm32-pinout':{
    html(){ return `
      <div class="comp-demo stm32-demo">${buildStm32PinoutSVG()}</div>
      <div class="pin-badge-legend">
        <span class="lg-pwm">~ PWM</span>
        <span class="lg-caution">&#9888; نیاز به احتیاط</span>
      </div>
      <div class="pin-filter-row" id="sp-filter">
        <button class="pin-filter-chip active" data-type="all">همه</button>
        <button class="pin-filter-chip" data-type="digital" style="--fc:#57d8a3">دیجیتال</button>
        <button class="pin-filter-chip" data-type="analog" style="--fc:#4aa8ff">آنالوگ</button>
        <button class="pin-filter-chip" data-type="power" style="--fc:#e8801e">تغذیه</button>
        <button class="pin-filter-chip" data-type="ground" style="--fc:#8a93a3">زمین</button>
        <button class="pin-filter-chip" data-type="control" style="--fc:#c1554a">کنترل/ریست</button>
      </div>
      <div class="pin-filter-row" id="sp-io-filter">
        <button class="pin-filter-chip active" data-io="all">همه‌جهت</button>
        <button class="pin-filter-chip" data-io="in" style="--fc:#c99cff">ورودی</button>
        <button class="pin-filter-chip" data-io="out" style="--fc:#ffd166">خروجی</button>
      </div>
      <div class="stm32-readout" id="sp-readout">
        <div class="sp-name" id="sp-name">روی یکی از پایه‌ها بزن</div>
        <div class="sp-type" id="sp-type"></div>
        <div class="sp-desc" id="sp-desc">روی نقشه بزن، یا با دکمه‌ها فیلتر کن. نکته: چند پایه (مثل PA11/PA12 برای USB و PA13/PA14 برای دیباگ SWD) کاربرد ویژه دارند — با فیلتر «کنترل/ریست» و علامت ⚠ می‌شناسی‌شان.</div>
      </div>`; },
    setup(root){
      const svg = root.querySelector('.stm32-svg');
      const filterRow = root.querySelector('#sp-filter');
      const ioFilterRow = root.querySelector('#sp-io-filter');
      const nameEl = root.querySelector('#sp-name'), typeEl = root.querySelector('#sp-type'), descEl = root.querySelector('#sp-desc');
      const TYPE_FA = { digital:'دیجیتال', analog:'آنالوگ', power:'تغذیه', ground:'زمین (GND)', control:'کنترل / ریست' };
      const DEFAULT_DESC = 'روی نقشه بزن، یا با دکمه‌ها فیلتر کن. نکته: چند پایه (مثل PA11/PA12 برای USB و PA13/PA14 برای دیباگ SWD) کاربرد ویژه دارند — با فیلتر «کنترل/ریست» و علامت ⚠ می‌شناسی‌شان.';
      function pinIO(pin){
        if(pin.io) return pin.io;
        if(pin.type==='digital' || pin.type==='analog') return 'both';
        return 'none';
      }
      let activeFilter = 'all', activeIO = 'all';
      function applyFilter(){
        svg.querySelectorAll('.stm32-pin').forEach(g => {
          const pin = STM32_PINS[g.dataset.side][parseInt(g.dataset.idx,10)];
          const io = pinIO(pin);
          const typeMatch = activeFilter==='all' || pin.type===activeFilter;
          const ioMatch = activeIO==='all' || (activeIO==='in' && (io==='in'||io==='both')) || (activeIO==='out' && io==='both');
          const match = typeMatch && ioMatch;
          g.classList.toggle('dimmed', !match);
          if(!match && g.classList.contains('selected')){
            g.classList.remove('selected');
            nameEl.textContent = 'روی یکی از پایه‌ها بزن';
            typeEl.textContent = '';
            descEl.textContent = DEFAULT_DESC;
          }
        });
      }
      filterRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.pin-filter-chip');
        if(!chip) return;
        SFX.click();
        activeFilter = chip.dataset.type;
        Array.from(filterRow.children).forEach(c => c.classList.toggle('active', c===chip));
        const showIO = activeFilter==='all';
        ioFilterRow.classList.toggle('hidden', !showIO);
        if(!showIO && activeIO!=='all'){
          activeIO = 'all';
          Array.from(ioFilterRow.children).forEach(c => c.classList.toggle('active', c.dataset.io==='all'));
        }
        applyFilter();
      });
      ioFilterRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.pin-filter-chip');
        if(!chip) return;
        SFX.click();
        activeIO = chip.dataset.io;
        Array.from(ioFilterRow.children).forEach(c => c.classList.toggle('active', c===chip));
        applyFilter();
      });
      svg.addEventListener('click', (e) => {
        const g = e.target.closest('.stm32-pin');
        if(!g || g.classList.contains('dimmed')) return;
        SFX.click();
        svg.querySelectorAll('.stm32-pin.selected').forEach(x => x.classList.remove('selected'));
        g.classList.add('selected');
        const pin = STM32_PINS[g.dataset.side][parseInt(g.dataset.idx,10)];
        nameEl.textContent = pin.name + (pin.sub ? ` (${pin.sub})` : '');
        const tags = [TYPE_FA[pin.type] || ''];
        if(pin.pwm) tags.push('~ PWM');
        if(pin.caution) tags.push('⚠ نیاز به احتیاط');
        typeEl.innerHTML = tags.map((t,i) => i===0 ? t : `<span class="${t.startsWith('~')?'tag-pwm':'tag-caution'}">${t}</span>`).join(' &middot; ');
        descEl.textContent = pin.desc;
      });
    }},

  'battery-sim':{
    html(p){
      const cap = p.capacity;
      const shape = p.shape || 'cylinder';
      return `
      <div class="comp-demo">
        <div class="batt-visual-row">
          <div class="batt-body-wrap" data-shape="${shape}">
            <div class="batt-body" data-shape="${shape}" id="bs-body">
              <div class="batt-fill" id="bs-fill" style="height:50%;"></div>
              <div class="batt-pct" id="bs-pct">۵۰٪</div>
            </div>
          </div>
        </div>
        <div class="batt-voltage-row"><span>ولتاژ سلول</span><span class="val" id="bs-volt">— V</span></div>
        <div class="batt-voltage-row"><span>انرژی باقی‌مانده</span><span class="val" id="bs-mah">— / ${toFa(cap)} mAh</span></div>
      </div>
      <div class="batt-converter">
        <div class="batt-converter-title">🧮 مبدل: با این جریان چند ساعت دوام می‌آورد؟</div>
        <div class="batt-slider-label"><span>جریان فرضی مصرفی</span><span class="val" id="bs-conv-val">— mA</span></div>
        <input type="range" id="bs-conv-current" style="width:100%;">
        <div class="batt-converter-result" id="bs-conv-result">—</div>
      </div>
      <div class="comp-controls" style="justify-content:center;">
        <button class="comp-toggle-btn on" id="bs-mode-dis">🔻 دشارژ (مصرف)</button>
        <button class="comp-toggle-btn" id="bs-mode-chg">🔺 شارژ</button>
      </div>
      <div style="width:100%;">
        <div class="batt-slider-label"><span id="bs-current-label">جریان مصرفی</span><span class="val" id="bs-current-val">— mA</span></div>
        <input type="range" id="bs-current" style="width:100%;">
      </div>
      <div class="comp-controls" style="justify-content:center;">
        <button class="comp-toggle-btn" id="bs-run">▶️ اجرا</button>
        <button class="comp-toggle-btn" id="bs-reset">🔄 بازنشانی</button>
      </div>
      <div class="comp-readout"><span>ظرفیت کل باتری</span><span class="val">${toFa(cap)} mAh</span></div>
      <div class="comp-readout"><span>زمان تقریبی تا هدف</span><span class="val" id="bs-time">—</span></div>
      <div class="comp-readout"><span>ساعتِ شبیه‌سازی‌شده</span><span class="val" id="bs-clock">۰۰:۰۰:۰۰</span></div>
      <div class="batt-formula" id="bs-formula">زمان (ساعت) = ظرفیت (mAh) ÷ جریان (mA)</div>
      <div class="comp-readout" id="bs-warn" style="color:#e08b82;"></div>`; },
    setup(root,p){
      const cap = p.capacity, fullV = p.fullV, cutoffV = p.cutoffV, shape = p.shape || 'cylinder';
      const maxDischargeC = p.maxDischargeC || 1, maxChargeC = p.maxChargeC || 1;

      const body=root.querySelector('#bs-body'), fill=root.querySelector('#bs-fill'), pct=root.querySelector('#bs-pct');
      const volt=root.querySelector('#bs-volt'), mahEl=root.querySelector('#bs-mah');
      const modeDisBtn=root.querySelector('#bs-mode-dis'), modeChgBtn=root.querySelector('#bs-mode-chg');
      const curLabel=root.querySelector('#bs-current-label'), curVal=root.querySelector('#bs-current-val'), curSlider=root.querySelector('#bs-current');
      const runBtn=root.querySelector('#bs-run'), resetBtn=root.querySelector('#bs-reset');
      const timeEl=root.querySelector('#bs-time'), clockEl=root.querySelector('#bs-clock'), formulaEl=root.querySelector('#bs-formula');
      const warnEl=root.querySelector('#bs-warn');
      const convSlider=root.querySelector('#bs-conv-current'), convVal=root.querySelector('#bs-conv-val'), convResult=root.querySelector('#bs-conv-result');

      let ratio = 0.5, mode = 'discharge', running = false, damaged = false;
      let currentMA = battRoundStep(cap*0.2, 10);
      let simSecondsElapsed = 0, dangerMs = 0, lastTs = null;

      function dangerLimitMA(){ return mode==='discharge' ? cap*maxDischargeC : cap*maxChargeC; }

      function updateConverter(){
        const c = parseInt(convSlider.value,10);
        const hours = cap / c;
        convVal.textContent = toFa(c) + ' mA';
        convResult.textContent = `${toFa(cap)} mAh ÷ ${toFa(c)} mA = ${toFa(hours.toFixed(2))} ساعت  ≈  ${battFormatHM(hours)} دوام`;
      }
      convSlider.min = battRoundStep(cap*0.02, 5);
      convSlider.max = battRoundStep(cap*3, 10);
      convSlider.step = 5;
      convSlider.value = battRoundStep(cap*0.2, 10);
      convSlider.addEventListener('input', updateConverter);
      updateConverter();


      function configureSlider(){
        const step = 10;
        if(mode==='discharge'){
          const min = battRoundStep(cap*0.05, step), max = battRoundStep(cap*maxDischargeC*1.4, step);
          curSlider.min = min; curSlider.max = max; curSlider.step = step;
          currentMA = Math.min(Math.max(currentMA, min), max);
          curLabel.textContent = 'جریان مصرفی (بار متصل)';
        } else {
          const min = battRoundStep(cap*0.1, step), max = battRoundStep(cap*maxChargeC*1.4, step);
          curSlider.min = min; curSlider.max = max; curSlider.step = step;
          currentMA = Math.min(Math.max(currentMA, min), max);
          curLabel.textContent = 'جریان شارژر';
        }
        curSlider.value = currentMA;
      }

      function updateReadout(){
        const v = battVoltageAt(ratio, fullV, cutoffV);
        volt.textContent = v.toFixed(2) + ' V';
        mahEl.textContent = toFa(Math.round(ratio*cap)) + ' / ' + toFa(cap) + ' mAh';
        pct.textContent = toFa(Math.round(ratio*100)) + '٪';
        fill.style.height = (ratio*100) + '%';
        fill.classList.toggle('low', ratio < 0.2 && ratio >= 0.08);
        fill.classList.toggle('critical', ratio < 0.08);
        curVal.textContent = toFa(currentMA) + ' mA (' + toFa((currentMA/cap).toFixed(2)) + 'C)';

        const remainingRatio = mode==='charging' ? (1-ratio) : ratio;
        const remainingHours = remainingRatio * cap / currentMA;
        timeEl.textContent = battFormatHM(remainingHours);
        clockEl.textContent = battFormatClock(simSecondsElapsed);
        const fullHours = cap/currentMA;
        formulaEl.textContent = `${toFa(currentMA)} mA × ${toFa(fullHours.toFixed(1))} ساعت ≈ ${toFa(cap)} mAh (کل ظرفیت)`;

        const overLimit = currentMA > dangerLimitMA();
        body.classList.toggle('danger', overLimit && !damaged);
        if(overLimit && !damaged){
          warnEl.textContent = `⚠️ جریان از حد مجاز (${toFa(Math.round(dangerLimitMA()))} mA) بیشتر است — ادامه‌ی این وضعیت باتری را داغ و آسیب‌دیده می‌کند!`;
        } else if(!damaged){
          warnEl.textContent = '';
        }
      }

      function doDamage(){
        damaged = true; running = false;
        body.classList.remove('danger'); body.classList.add('damaged');
        runBtn.disabled = true; runBtn.style.opacity = .4;
        curSlider.disabled = true;
        modeDisBtn.disabled = true; modeChgBtn.disabled = true;
        modeDisBtn.style.opacity = .4; modeChgBtn.style.opacity = .4;
        warnEl.textContent = shape==='pouch'
          ? '🔥 پاکت باتری بر اثر جریان بیش‌ازحد داغ، متورم و پاره شد! باتری‌های LiPo هرگز نباید بیش از حد مجاز، دشارژ یا شارژ شوند.'
          : '🔥 دریچه‌ی اطمینان باز شد و باتری بر اثر جریان بیش‌ازحد بیش از حد داغ کرد و از کار افتاد!';
        SFX.burn();
        runBtn.textContent = '▶️ اجرا';
      }

      function tick(ts){
        if(lastTs===null) lastTs = ts;
        let dt = (ts - lastTs) / 1000; // seconds
        lastTs = ts;
        dt = Math.min(dt, 0.1);

        if(running && !damaged){
          const ANIM_SECONDS = 10; // real seconds for a full 0→1 traversal
          const dRatio = dt / ANIM_SECONDS;
          const dir = mode==='charging' ? 1 : -1;
          const prevRatio = ratio;
          ratio = Math.min(1, Math.max(0, ratio + dir*dRatio));
          const traveled = Math.abs(ratio - prevRatio);
          simSecondsElapsed += traveled * (cap/currentMA) * 3600;

          const overLimit = currentMA > dangerLimitMA();
          if(overLimit){ dangerMs += dt*1000; if(dangerMs > 1800){ doDamage(); } }
          else { dangerMs = Math.max(0, dangerMs - dt*2000); }

          if((mode==='charging' && ratio>=1) || (mode==='discharge' && ratio<=0)){
            running = false;
            runBtn.textContent = '▶️ اجرا';
            warnEl.textContent = mode==='charging' ? '✅ باتری کاملاً شارژ شد.' : '🪫 باتری خالی شد — مدار محافظ آن را قطع کرد.';
          }
        }
        updateReadout();
        root._raf = requestAnimationFrame(tick);
      }

      configureSlider();
      updateReadout();
      root._raf = requestAnimationFrame(tick);

      curSlider.addEventListener('input', () => { currentMA = parseInt(curSlider.value,10); updateReadout(); });

      modeDisBtn.addEventListener('click', () => {
        if(damaged || mode==='discharge') return;
        SFX.click(); mode='discharge'; running=false; simSecondsElapsed=0; dangerMs=0; warnEl.textContent='';
        runBtn.textContent='▶️ اجرا';
        modeDisBtn.classList.add('on'); modeChgBtn.classList.remove('on');
        configureSlider(); updateReadout();
      });
      modeChgBtn.addEventListener('click', () => {
        if(damaged || mode==='charging') return;
        SFX.click(); mode='charging'; running=false; simSecondsElapsed=0; dangerMs=0; warnEl.textContent='';
        runBtn.textContent='▶️ اجرا';
        modeChgBtn.classList.add('on'); modeDisBtn.classList.remove('on');
        configureSlider(); updateReadout();
      });

      runBtn.addEventListener('click', () => {
        if(damaged) return;
        if(!running && ((mode==='charging' && ratio>=1) || (mode==='discharge' && ratio<=0))){ return; }
        SFX.click();
        running = !running;
        lastTs = null;
        runBtn.textContent = running ? '⏸️ توقف' : '▶️ اجرا';
        if(running) warnEl.textContent='';
      });

      resetBtn.addEventListener('click', () => {
        SFX.open();
        ratio=0.5; mode='discharge'; running=false; damaged=false; simSecondsElapsed=0; dangerMs=0; lastTs=null;
        body.classList.remove('damaged','danger');
        runBtn.disabled=false; runBtn.style.opacity=1; runBtn.textContent='▶️ اجرا';
        curSlider.disabled=false;
        modeDisBtn.disabled=false; modeChgBtn.disabled=false;
        modeDisBtn.style.opacity=1; modeChgBtn.style.opacity=1;
        modeDisBtn.classList.add('on'); modeChgBtn.classList.remove('on');
        currentMA = battRoundStep(cap*0.2, 10);
        configureSlider(); updateReadout();
      });
    }},

  'static-info':{
    html(){ return `<div class="comp-demo static-info-demo">🔧 این قطعه بیشتر جنبه‌ی مرجع و فنی دارد؛ رفتارش را در ویژگی‌های بالا بخوان.</div>`; },
    setup(){} },
};

