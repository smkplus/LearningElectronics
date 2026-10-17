/* ========================================================================
   LAB.JS — مسیر نگهبان مدار
   آزمایشگاه الکترونیک: قانون اهم، دایره‌المعارف قطعات، رمزگشای رنگ
   مقاومت، راهنمای رنگ‌ها، شبیه‌ساز خازن و حلقه‌ی اصلی رندر آزمایشگاه.
   به common.js (SFX, tab elements) نیاز دارد.
   ======================================================================== */

/* ========================================================================
   OHM'S LAW LIVE CIRCUIT — تک مقاومت / سری / موازی
   ======================================================================== */
const ohmCanvas = document.getElementById('ohmCanvas');
const octx = ohmCanvas.getContext('2d');
const voltageRange = document.getElementById('voltageRange');
const resistanceRange = document.getElementById('resistanceRange');
const resistance2Range = document.getElementById('resistance2Range');
const voltageVal = document.getElementById('voltageVal');
const resistanceVal = document.getElementById('resistanceVal');
const resistance2Val = document.getElementById('resistance2Val');
const resistance1Label = document.getElementById('resistance1Label');
const resistance2Group = document.getElementById('resistance2Group');
const currentValEl = document.getElementById('currentVal');
const powerValEl = document.getElementById('powerVal');
const ohmReadoutRow2 = document.getElementById('ohmReadoutRow2');
const ohmNote = document.getElementById('ohmNote');
const ohmModeTabs = document.getElementById('ohmModeTabs');
const ohmSwitchBtn = document.getElementById('ohmSwitchBtn');
const ohmSwitchLabel = document.getElementById('ohmSwitchLabel');
const ohmNoResistorBtn = document.getElementById('ohmNoResistorBtn');
const ohmReplaceBtn = document.getElementById('ohmReplaceBtn');

let ohmMode = 'single'; // 'single' | 'series' | 'parallel'
let ohmW = 0, ohmH = 0, ohmPathPts = [], ohmPathPtsInner = [];
const ohmElectrons = Array.from({length: 26}, (_, i) => ({ t: i/26 }));      // outer loop (single/series, or branch R2 in parallel)
const ohmElectronsInner = Array.from({length: 16}, (_, i) => ({ t: i/16 })); // inner loop (branch R1 in parallel)

let ohmSwitchOn = true;      // main power switch — off cuts the current everywhere
let ohmNoResistor = false;   // all resistors physically bypassed (classic beginner mistake)
// each topology keeps its own burnt-LED memory: single/series each have one bulb,
// parallel has two independent bulbs (par1 = R1 branch, par2 = R2 branch)
const ohmBurned = { single:false, series:false, par1:false, par2:false };
const OHM_BURN_MA = 45; // a real small indicator LED (rated ~20mA) dies well past this

const OHM_NOTES = {
  single: 'هرچه ولتاژ بیشتر یا مقاومت کمتر باشد، جریان بزرگ‌تر می‌شود و الکترون‌ها تندتر حرکت می‌کنند — لامپ هم داغ‌تر می‌درخشد.',
  series: 'در مدار سری، جریان همه‌جا یکسان است (همان تعداد الکترون از هر دو مقاومت رد می‌شود)؛ ولی ولتاژ باتری بین R1 و R2 تقسیم می‌شود.',
  parallel: 'در مدار موازی، ولتاژ روی هر دو شاخه یکسان است؛ ولی هر شاخه به‌فراخور مقاومت خودش جریان جداگانه می‌کشد — شاخه‌ی کم‌مقاومت‌تر، الکترون‌های تندتر و لامپ داغ‌تر دارد.',
};
const OHM_NOTE_OPEN = 'کلید باز است — مدار قطع شده و جریانی برقرار نیست. کلید را بزن تا مدار دوباره بسته شود.';
const OHM_NOTE_BURN_ONE = 'LED سوخت! جریان بیش از حد مجاز از آن عبور کرد (مقاومت خیلی کم یا اصلاً وصل نبود) و مدار برای همیشه باز ماند. با دکمه‌ی «تعویض LED» یکی نو بگذار — این‌بار مقاومت مناسب انتخاب کن.';
const OHM_NOTE_BURN_ONE_UNSAFE = 'LED سوخت! جریان بیش از حد مجاز از آن عبور کرد و مدار برای همیشه باز ماند. اول مقاومت یا ولتاژ را به مقدار امن برگردان — همان‌جایی که رنگ قرمز نشانش می‌دهد — تا بشود LED را تعویض کرد.';
const OHM_NOTE_BURN_PAR = 'LED یکی از شاخه‌ها سوخت و آن شاخه قطع شد، اما چون مدار موازی است شاخه‌ی دیگر مستقل به کار خودش ادامه می‌دهد — برخلاف مدار سری که سوختن یک LED کل مدار را می‌خواباند.';
const OHM_NOTE_BURN_PAR_BOTH = 'هر دو LED شاخه‌ها سوختند! جریان هر دو شاخه از حد مجاز گذشت. با دکمه‌ی «تعویض LED» دوباره شروع کن.';
const OHM_NOTE_BURN_PAR_BOTH_UNSAFE = 'هر دو LED شاخه‌ها سوختند! اول مقاومت یا ولتاژ هر شاخه‌ی قرمزرنگ را به مقدار امن برگردان تا بشود LED‌ها را تعویض کرد.';

function resizeOhmCanvas(){
  const rect = ohmCanvas.getBoundingClientRect();
  if(rect.width === 0) return;
  const dpr = window.devicePixelRatio || 1;
  ohmCanvas.width = rect.width * dpr;
  ohmCanvas.height = rect.height * dpr;
  octx.setTransform(dpr,0,0,dpr,0,0);
  ohmW = rect.width; ohmH = rect.height;
  const m = 34;
  ohmPathPts = sampleRectPath(m, m, ohmW-m, ohmH-m, 220);
  if(ohmMode === 'parallel'){
    const ymid = m + (ohmH-m-m) * 0.42;
    ohmPathPtsInner = sampleRectPath(m, m, ohmW-m, ymid, 140);
  }
}

function ohmR1(){ return ohmNoResistor ? 0.5 : Math.max(parseFloat(resistanceRange.value), 0.5); }
function ohmR2(){ return ohmNoResistor ? 0.5 : Math.max(parseFloat(resistance2Range.value), 0.5); }
function ohmV(){ return parseFloat(voltageRange.value); }

function checkBurn(key, rawAmps){
  if(!ohmSwitchOn || ohmBurned[key]) return;
  if(rawAmps*1000 > OHM_BURN_MA){
    ohmBurned[key] = true;
    SFX.burn();
    updateOhmNote();
    updateReplaceBtnVisibility();
    if(ohmLastTouchedControl === 'resistance' && typeof resistorApologizeBurned === 'function'){
      resistorApologizeBurned();
    } else if(typeof voltageApologizeBurned === 'function'){
      voltageApologizeBurned();
    }
  }
}

function currentAmps(){
  if(!ohmSwitchOn) return 0;
  const V = ohmV(), R1 = ohmR1();
  const raw = ohmMode === 'series' ? V/(R1+ohmR2()) : V/R1; // single & parallel main-loop (R1) current
  const key = ohmMode === 'parallel' ? 'par1' : ohmMode;
  checkBurn(key, raw);
  return ohmBurned[key] ? 0 : raw;
}
function currentAmpsBranch2(){ // only meaningful in parallel mode
  if(!ohmSwitchOn) return 0;
  const raw = ohmV()/ohmR2();
  checkBurn('par2', raw);
  return ohmBurned.par2 ? 0 : raw;
}

function updateReplaceBtnVisibility(){
  const anyBurned = ohmMode === 'parallel' ? (ohmBurned.par1 || ohmBurned.par2) : ohmBurned[ohmMode];
  // Don't invite the person to replace the LED while the setting that
  // burned it is still unsafe — pressing "تعویض LED" right now would just
  // burn the new one immediately. Only surface the button once every
  // burned branch's cause has actually been fixed.
  const stillUnsafe = ohmMode === 'parallel'
    ? ((ohmBurned.par1 && isOhmSettingUnsafe('par1')) || (ohmBurned.par2 && isOhmSettingUnsafe('par2')))
    : (ohmBurned[ohmMode] && isOhmSettingUnsafe(ohmMode));
  ohmReplaceBtn.style.display = (anyBurned && !stillUnsafe) ? '' : 'none';
  refreshOhmDangerHighlights();
}

function clearOhmDangerHighlights(){
  voltageRange.closest('.slider-group')?.classList.remove('danger');
  resistanceRange.closest('.slider-group')?.classList.remove('danger');
  resistance2Range.closest('.slider-group')?.classList.remove('danger');
  ohmNoResistorBtn.classList.remove('danger-highlight');
}

// Raw current for a given key (or key's contribution), ignoring the "burned
// -> 0" clamp, so we can tell whether the CURRENT slider position is still
// dangerous even while that key's LED is dead and showing 0mA.
function ohmRawAmpsFor(key){
  const V = ohmV();
  if(key === 'par2') return V/ohmR2();
  if(key === 'series') return V/(ohmR1()+ohmR2());
  return V/ohmR1(); // 'single' or 'par1'
}
function isOhmSettingUnsafe(key){ return ohmRawAmpsFor(key)*1000 > OHM_BURN_MA; }
function currentOhmCause(){
  return ohmNoResistor ? 'no-resistor' : (ohmLastTouchedControl === 'resistance' ? 'resistance' : 'voltage');
}

// Points the person at the control that's ACTUALLY still dangerous right now,
// instead of a one-size-fits-all "replace it": resistance too low -> red glow
// on that resistor's own slider; resistors removed entirely -> red glow on
// the "بازگرداندن مقاومت‌ها" button (the sliders are disabled and irrelevant
// then); voltage too high -> red glow on the voltage slider. Since this is
// re-evaluated live off the current slider values (see isOhmSettingUnsafe),
// the warning clears itself the moment the person dials in a safe value —
// no need to wait for "تعویض LED".
function applyOhmDangerHighlight(cause, key){
  if(cause === 'no-resistor'){
    ohmNoResistorBtn.classList.add('danger-highlight');
  } else if(cause === 'resistance'){
    if(key === 'par2'){
      resistance2Range.closest('.slider-group')?.classList.add('danger');
    } else {
      resistanceRange.closest('.slider-group')?.classList.add('danger');
      // series: current is shared, so either resistor could be the culprit — flag both
      if(key === 'series') resistance2Range.closest('.slider-group')?.classList.add('danger');
    }
  } else if(cause === 'voltage'){
    voltageRange.closest('.slider-group')?.classList.add('danger');
  }
}

function refreshOhmDangerHighlights(){
  clearOhmDangerHighlights();
  const cause = currentOhmCause();
  if(ohmMode === 'parallel'){
    if(ohmBurned.par1 && isOhmSettingUnsafe('par1')) applyOhmDangerHighlight(cause, 'par1');
    if(ohmBurned.par2 && isOhmSettingUnsafe('par2')) applyOhmDangerHighlight(cause, 'par2');
    return;
  }
  if(ohmBurned[ohmMode] && isOhmSettingUnsafe(ohmMode)) applyOhmDangerHighlight(cause, ohmMode);
}

function updateOhmNote(){
  if(!ohmSwitchOn){ ohmNote.textContent = OHM_NOTE_OPEN; return; }
  if(ohmMode !== 'parallel'){
    if(ohmBurned[ohmMode]){
      ohmNote.textContent = isOhmSettingUnsafe(ohmMode) ? OHM_NOTE_BURN_ONE_UNSAFE : OHM_NOTE_BURN_ONE;
    } else {
      ohmNote.textContent = OHM_NOTES[ohmMode];
    }
    return;
  }
  if(ohmBurned.par1 && ohmBurned.par2){
    const stillUnsafe = isOhmSettingUnsafe('par1') || isOhmSettingUnsafe('par2');
    ohmNote.textContent = stillUnsafe ? OHM_NOTE_BURN_PAR_BOTH_UNSAFE : OHM_NOTE_BURN_PAR_BOTH;
  }
  else if(ohmBurned.par1 || ohmBurned.par2) ohmNote.textContent = OHM_NOTE_BURN_PAR;
  else ohmNote.textContent = OHM_NOTES.parallel;
}

ohmSwitchBtn.addEventListener('click', () => {
  ohmSwitchOn = !ohmSwitchOn;
  ohmSwitchBtn.classList.toggle('off', !ohmSwitchOn);
  ohmSwitchLabel.textContent = ohmSwitchOn ? 'وصل' : 'قطع';
  SFX.click();
  updateOhmReadouts();
});
ohmNoResistorBtn.addEventListener('click', () => {
  ohmNoResistor = !ohmNoResistor;
  if(ohmNoResistor) ohmLastTouchedControl = 'resistance'; // removing the resistors is a resistance-side cause too
  resistanceRange.disabled = ohmNoResistor;
  resistance2Range.disabled = ohmNoResistor;
  ohmNoResistorBtn.classList.toggle('active', ohmNoResistor);
  ohmNoResistorBtn.textContent = ohmNoResistor ? '↩️ مقاومت‌ها را برگردان' : '🚫 مقاومت‌ها را بردار';
  SFX.click();
  updateOhmReadouts();
});
ohmReplaceBtn.addEventListener('click', () => {
  ohmBurned.single = ohmBurned.series = ohmBurned.par1 = ohmBurned.par2 = false;
  ohmBurnedPrev.single = ohmBurnedPrev.series = ohmBurnedPrev.par1 = ohmBurnedPrev.par2 = false;
  ohmFireParticles = [];
  SFX.open();
  updateOhmReadouts(); // may immediately re-burn the new LED via checkBurn() if V/R is still too harsh
  // Only cheer if the replacement actually survived. If it burned again right away,
  // checkBurn() has already fired the correct apology line above — don't stack praise on top of it.
  if(!isCurrentLedBurned() && typeof voltageReplacePraise === 'function') voltageReplacePraise();
});

function stepOhm(dt){
  updateFireParticles(dt);
  if(ohmMode === 'parallel'){
    if(ohmPathPts.length){
      const I2 = currentAmpsBranch2();
      const speed2 = I2 <= 0 ? 0 : Math.min(0.9, 0.03 + Math.sqrt(I2) * 0.55);
      ohmElectrons.forEach(e => { e.t = (e.t - speed2 * dt + 1) % 1; });
    }
    if(ohmPathPtsInner.length){
      const I1 = currentAmps();
      const speed1 = I1 <= 0 ? 0 : Math.min(0.9, 0.03 + Math.sqrt(I1) * 0.55);
      ohmElectronsInner.forEach(e => { e.t = (e.t - speed1 * dt + 1) % 1; });
    }
  } else {
    if(ohmPathPts.length === 0) return;
    const I = currentAmps();
    const speedFrac = I <= 0 ? 0 : Math.min(0.9, 0.03 + Math.sqrt(I) * 0.55);
    ohmElectrons.forEach(e => { e.t = (e.t - speedFrac * dt + 1) % 1; });
  }
}

function fmtCurrent(I){
  const mA = I * 1000;
  if(mA < 1000) return toFa(mA < 10 ? mA.toFixed(2) : mA.toFixed(1)) + ' mA';
  return toFa((I).toFixed(2)) + ' A';
}
function fmtPower(P){
  const mW = P * 1000;
  if(mW < 1000) return toFa(mW < 10 ? mW.toFixed(2) : mW.toFixed(1)) + ' mW';
  return toFa(P.toFixed(2)) + ' W';
}

function setOhmMode(mode){
  ohmMode = mode;
  Array.from(ohmModeTabs.children).forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  resistance2Group.style.display = mode === 'single' ? 'none' : '';
  ohmReadoutRow2.style.display = mode === 'single' ? 'none' : '';
  resistance1Label.firstChild.textContent = mode === 'single' ? 'مقاومت مسیر ' : 'مقاومت ۱ (R1) ';
  resizeOhmCanvas();
  updateOhmReadouts();
}
ohmModeTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.ohm-mode-btn');
  if(!btn || btn.classList.contains('active')) return;
  SFX.click(); track('ohm_mode_changed', { mode: btn.dataset.mode }); setOhmMode(btn.dataset.mode);
});

function updateOhmReadouts(){
  const V = ohmV(), R1 = ohmR1(), R2 = ohmR2();
  voltageVal.textContent = toFa(V % 1 === 0 ? V : V.toFixed(1)) + ' V';
  resistanceVal.textContent = toFa(R1) + ' Ω';
  resistance2Val.textContent = toFa(R2) + ' Ω';

  if(ohmMode === 'single'){
    const I = currentAmps(), P = V*I;
    currentValEl.textContent = fmtCurrent(I);
    powerValEl.textContent = fmtPower(P);
  } else if(ohmMode === 'series'){
    const I = currentAmps(), Rt = R1+R2, P = V*I, V1 = I*R1, V2 = I*R2;
    currentValEl.textContent = fmtCurrent(I);
    powerValEl.textContent = fmtPower(P);
    ohmReadoutRow2.innerHTML = `
      <div class="readout-item"><span class="ro-label">مقاومت کل &nbsp;R = R1 + R2</span><span class="ro-val mono">${toFa(Rt)} Ω</span></div>
      <div class="readout-item"><span class="ro-label">افت ولتاژ روی R1</span><span class="ro-val mono">${toFa(V1.toFixed(2))} V</span></div>
      <div class="readout-item"><span class="ro-label">افت ولتاژ روی R2</span><span class="ro-val mono">${toFa(V2.toFixed(2))} V</span></div>`;
  } else if(ohmMode === 'parallel'){
    const I1 = currentAmps(), I2 = currentAmpsBranch2(), It = I1+I2, Req = 1/(1/R1+1/R2), P = V*It;
    currentValEl.textContent = fmtCurrent(It);
    powerValEl.textContent = fmtPower(P);
    ohmReadoutRow2.innerHTML = `
      <div class="readout-item"><span class="ro-label">مقاومت معادل &nbsp;1/R = 1/R1 + 1/R2</span><span class="ro-val mono">${toFa(Req.toFixed(1))} Ω</span></div>
      <div class="readout-item"><span class="ro-label">جریان شاخه ۱ (I1)</span><span class="ro-val mono">${fmtCurrent(I1)}</span></div>
      <div class="readout-item"><span class="ro-label">جریان شاخه ۲ (I2)</span><span class="ro-val mono">${fmtCurrent(I2)}</span></div>`;
  }
  updateOhmNote();
  updateReplaceBtnVisibility();
}
// Tracks whether voltage or resistance was the last thing the person
// touched, so that when the LED burns, checkBurn() can tell whether to
// blame it on Voltage (raised too high) or Resistance (removed/too low).
let ohmLastTouchedControl = null; // 'voltage' | 'resistance' | null
voltageRange.addEventListener('input', () => { ohmLastTouchedControl = 'voltage'; updateOhmReadouts(); });
resistanceRange.addEventListener('input', () => { ohmLastTouchedControl = 'resistance'; updateOhmReadouts(); });
resistance2Range.addEventListener('input', () => { ohmLastTouchedControl = 'resistance'; updateOhmReadouts(); });

// "آفرین" from the Voltage mascot whenever the person raises the voltage —
// except once it's very high (warning takes priority), or once the LED for
// the current mode is already burned (an apology takes priority over both).
// Uses 'change' (fires on release/commit) rather than 'input' so dragging
// the slider doesn't spam a line on every intermediate tick.
const OHM_VOLTAGE_WARN_THRESHOLD = 10; // out of the slider's 12V max — "خیلی زیاد"
function isCurrentLedBurned(){
  if(ohmMode === 'single') return ohmBurned.single;
  if(ohmMode === 'series') return ohmBurned.series;
  if(ohmMode === 'parallel') return ohmBurned.par1 || ohmBurned.par2;
  return false;
}
let ohmLastPraisedVoltage = parseFloat(voltageRange.value);
voltageRange.addEventListener('change', () => {
  const v = parseFloat(voltageRange.value);
  if(isCurrentLedBurned() && typeof voltageApologizeBurned === 'function'){
    voltageApologizeBurned();
  } else if(v > ohmLastPraisedVoltage){
    if(v >= OHM_VOLTAGE_WARN_THRESHOLD && typeof voltageWarnHigh === 'function') voltageWarnHigh();
    else if(typeof voltagePraise === 'function') voltagePraise();
  }
  ohmLastPraisedVoltage = v;
});

function drawZigzag(ctx, cx, cy, w, horizontal){
  const zigN = 6, zStep = w/zigN;
  ctx.beginPath();
  if(horizontal){
    ctx.moveTo(cx - w/2 - 10, cy);
    ctx.lineTo(cx - w/2, cy);
    for(let i=0;i<zigN;i++){
      const zx = cx - w/2 + zStep*(i+1);
      const zy = cy + (i % 2 === 0 ? -9 : 9);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(cx + w/2 + 10, cy);
  } else {
    ctx.moveTo(cx, cy - w/2 - 10);
    ctx.lineTo(cx, cy - w/2);
    for(let i=0;i<zigN;i++){
      const zy = cy - w/2 + zStep*(i+1);
      const zx = cx + (i % 2 === 0 ? -9 : 9);
      ctx.lineTo(zx, zy);
    }
    ctx.lineTo(cx, cy + w/2 + 10);
  }
  ctx.stroke();
}
function drawBulb(ctx, x, y, P, r, burned){
  if(burned){
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = '#241b14'; ctx.fill();
    ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = '#100c08'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x-r*0.55,y-r*0.55); ctx.lineTo(x+r*0.55,y+r*0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+r*0.55,y-r*0.55); ctx.lineTo(x-r*0.55,y+r*0.55); ctx.stroke();
    return 0;
  }
  const glow = Math.max(0, Math.min(1, Math.log10(P*1000+1)/4.2));
  const grad = ctx.createRadialGradient(x,y,1, x,y,r*2.4);
  grad.addColorStop(0, `rgba(255,225,140,${0.15+glow*0.85})`);
  grad.addColorStop(1, 'rgba(255,225,140,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x,y,r*2.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = `rgba(255,${210+Math.round(glow*30)},${120+Math.round(glow*90)},${0.35+glow*0.65})`;
  ctx.fill();
  ctx.strokeStyle = '#8a93a3'; ctx.lineWidth = 1.5; ctx.stroke();
  return glow;
}
function drawResistorSymbol(ctx, cx, cy, w, horizontal, shorted){
  if(shorted){
    ctx.save();
    ctx.strokeStyle = '#c1554a'; ctx.lineWidth = 4;
    ctx.beginPath();
    if(horizontal){ ctx.moveTo(cx-w/2-10, cy); ctx.lineTo(cx+w/2+10, cy); }
    else { ctx.moveTo(cx, cy-w/2-10); ctx.lineTo(cx, cy+w/2+10); }
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = '#c97c3d'; ctx.lineWidth = 3;
    drawZigzag(ctx, cx, cy, w, horizontal);
  }
}
function drawSwitchGlyph(ctx, x0, y0){
  const gx = x0 + 14, gy = y0, len = 26;
  ctx.save();
  ctx.strokeStyle = '#0b0e14'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(gx-2, gy); ctx.lineTo(gx+len+2, gy); ctx.stroke();
  const closed = ohmSwitchOn;
  ctx.strokeStyle = closed ? '#57d8a3' : '#c1554a';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(gx, gy, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(gx+len, gy, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  if(closed) ctx.lineTo(gx+len, gy);
  else ctx.lineTo(gx+len*0.5, gy-12);
  ctx.stroke();
  ctx.restore();
}
function drawBattery(ctx, x, midY, V){
  ctx.strokeStyle = '#e79a54'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x-15, midY-10); ctx.lineTo(x+15, midY-10); ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x-9, midY+10); ctx.lineTo(x+9, midY+10); ctx.stroke();
  ctx.fillStyle = '#e79a54'; ctx.font = '700 11px JetBrains Mono'; ctx.textAlign = 'center';
  ctx.fillText('+', x, midY-20);
  ctx.fillText('−', x, midY+30);
  if(V !== undefined){
    ctx.fillStyle = '#9fb0c9'; ctx.font = '700 10px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(toFa(V % 1 === 0 ? V : V.toFixed(1)) + ' V', x+20, midY+4);
  }
}
function fmtOhms(R){
  return toFa(R % 1 === 0 ? R : R.toFixed(1)) + ' Ω';
}
/* ---------- fire-particle burst when an LED burns out ---------- */
let ohmFireParticles = [];
const ohmBurnedPrev = { single:false, series:false, par1:false, par2:false };

function spawnFireBurst(x, y){
  const n = 18;
  for(let i=0;i<n;i++){
    const ang = Math.random()*Math.PI*2;
    const spd = 18 + Math.random()*55;
    ohmFireParticles.push({
      x, y,
      vx: Math.cos(ang)*spd*0.5,
      vy: -Math.abs(Math.sin(ang))*spd - 26,
      life: 0,
      maxLife: 0.45 + Math.random()*0.55,
      size: 2 + Math.random()*3.5,
    });
  }
}
function updateFireParticles(dt){
  if(ohmFireParticles.length === 0) return;
  ohmFireParticles.forEach(p => {
    p.life += dt;
    p.x += p.vx*dt;
    p.y += p.vy*dt;
    p.vy += 55*dt;       // gentle drag upward motion slowing down
    p.vx *= (1 - 1.8*dt);
  });
  ohmFireParticles = ohmFireParticles.filter(p => p.life < p.maxLife);
}
function drawFireParticles(ctx){
  ohmFireParticles.forEach(p => {
    const t = p.life / p.maxLife;
    const alpha = Math.max(0, 1 - t);
    const r = Math.max(0.4, p.size * (1 - t*0.35));
    const grad = ctx.createRadialGradient(p.x,p.y,0, p.x,p.y,r);
    if(t < 0.45){
      grad.addColorStop(0, `rgba(255,244,190,${alpha})`);
      grad.addColorStop(0.5, `rgba(255,150,55,${alpha*0.9})`);
      grad.addColorStop(1, 'rgba(255,80,30,0)');
    } else {
      grad.addColorStop(0, `rgba(130,130,130,${alpha*0.45})`);
      grad.addColorStop(1, 'rgba(90,90,90,0)');
    }
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, r, 0, Math.PI*2);
    ctx.fill();
  });
}

function drawElectrons(ctx, pts, electrons, glow){
  if(!ohmSwitchOn) return; // circuit open — no electrons flowing, none shown
  pts && electrons.forEach(e => {
    const idx = Math.floor(e.t * pts.length) % pts.length;
    const p = pts[idx];
    if(!p) return;
    ctx.beginPath();
    ctx.shadowColor = '#57d8a3';
    ctx.shadowBlur = 6 + glow*4;
    ctx.fillStyle = '#8ff0c4';
    ctx.arc(p[0], p[1], 3.3, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawOhmFrame(){
  if(ohmW === 0) return;
  octx.clearRect(0,0,ohmW,ohmH);
  const V = ohmV(), R1 = ohmR1(), R2 = ohmR2();
  const m = 34;
  const x0=m, y0=m, x1=ohmW-m, y1=ohmH-m;
  const midX = (x0+x1)/2, midY = (y0+y1)/2;

  octx.strokeStyle = '#333f52'; octx.lineWidth = 4; octx.lineJoin = 'round';

  if(ohmMode === 'single'){
    octx.strokeRect(x0,y0,x1-x0,y1-y0);
    drawSwitchGlyph(octx, x0, y0);
    drawBattery(octx, x0, midY, V);
    drawResistorSymbol(octx, midX, y1, 64, true, ohmNoResistor);
    octx.fillStyle = '#e8dcc0'; octx.font='700 10px JetBrains Mono'; octx.textAlign='center';
    octx.fillText(ohmNoResistor ? '—' : fmtOhms(R1), midX, y1+22);
    const I = currentAmps(), P = V*I;
    const glow = drawBulb(octx, midX, y0, P, 15, ohmBurned.single);
    if(ohmBurned.single && !ohmBurnedPrev.single) spawnFireBurst(midX, y0);
    ohmBurnedPrev.single = ohmBurned.single;
    drawElectrons(octx, ohmPathPts, ohmElectrons, glow);

  } else if(ohmMode === 'series'){
    octx.strokeRect(x0,y0,x1-x0,y1-y0);
    drawSwitchGlyph(octx, x0, y0);
    drawBattery(octx, x0, midY, V);
    const q = (x1-x0)/4;
    drawResistorSymbol(octx, x0+q, y1, 46, true, ohmNoResistor);
    drawResistorSymbol(octx, x0+3*q, y1, 46, true, ohmNoResistor);
    octx.fillStyle = '#e8dcc0'; octx.font='700 10px JetBrains Mono'; octx.textAlign='center';
    octx.fillText('R1 ' + (ohmNoResistor ? '—' : fmtOhms(R1)), x0+q, y1+22);
    octx.fillText('R2 ' + (ohmNoResistor ? '—' : fmtOhms(R2)), x0+3*q, y1+22);
    const I = currentAmps(), P = V*I;
    const glow = drawBulb(octx, midX, y0, P, 15, ohmBurned.series);
    if(ohmBurned.series && !ohmBurnedPrev.series) spawnFireBurst(midX, y0);
    ohmBurnedPrev.series = ohmBurned.series;
    drawElectrons(octx, ohmPathPts, ohmElectrons, glow);

  } else if(ohmMode === 'parallel'){
    const ymid = y0 + (y1-y0) * 0.42;
    // outer rectangle (battery, top rail, right edge, bottom edge w/ R2)
    octx.strokeRect(x0,y0,x1-x0,y1-y0);
    // middle rung (R1 branch)
    octx.beginPath(); octx.moveTo(x0,ymid); octx.lineTo(x1,ymid); octx.stroke();
    drawSwitchGlyph(octx, x0, y0);
    drawBattery(octx, x0, midY, V);
    drawResistorSymbol(octx, midX, ymid, 56, true, ohmNoResistor);
    drawResistorSymbol(octx, midX, y1, 56, true, ohmNoResistor);
    octx.fillStyle = '#e8dcc0'; octx.font='700 10px JetBrains Mono'; octx.textAlign='center';
    octx.fillText('R1 ' + (ohmNoResistor ? '—' : fmtOhms(R1)), midX, ymid-14);
    octx.fillText('R2 ' + (ohmNoResistor ? '—' : fmtOhms(R2)), midX, y1+22);
    const I1 = currentAmps(), I2 = currentAmpsBranch2();
    const bx = x0+(x1-x0)*0.22;
    const glow1 = drawBulb(octx, bx, ymid, V*I1, 11, ohmBurned.par1);
    const glow2 = drawBulb(octx, bx, y1, V*I2, 11, ohmBurned.par2);
    if(ohmBurned.par1 && !ohmBurnedPrev.par1) spawnFireBurst(bx, ymid);
    if(ohmBurned.par2 && !ohmBurnedPrev.par2) spawnFireBurst(bx, y1);
    ohmBurnedPrev.par1 = ohmBurned.par1;
    ohmBurnedPrev.par2 = ohmBurned.par2;
    drawElectrons(octx, ohmPathPtsInner, ohmElectronsInner, glow1);
    drawElectrons(octx, ohmPathPts, ohmElectrons, glow2);
  }
  drawFireParticles(octx);
}

/* COMPONENT_LIBRARY moved to component-library.js — load before lab.js. */

/* ARDUINO_NANO_PINS, nanoPinColor(), buildNanoPinoutSVG(), MCU_BLOCKS moved to arduino-nano.js — load before demo-kinds.js. */
/* ESP32_PINS, esp32PinColor(), buildEsp32PinoutSVG() are in esp32.js — load before demo-kinds.js (alongside arduino-nano.js). */

/* Helper functions (lightenHex, capBodyHTML, circuitLedHTML, setLedState) and DEMO_KINDS moved to demo-kinds.js — load after arduino-nano.js, before lab.js. */


/* ---------- browser state + rendering ---------- */
const compState = { cat:'passive', famIdx:0, typeIdx:0 };

function renderComponents(){
  const grid = document.getElementById('componentGrid');
  grid.innerHTML = `
    <div class="comp-cat-tabs" id="compCatTabs"></div>
    <div class="comp-chip-row" id="compFamChips"></div>
    <div class="comp-chip-row" id="compTypeChips"></div>
    <div class="comp-stage" id="compStage"></div>`;

  const catTabs = document.getElementById('compCatTabs');
  [['passive','قطعات غیرفعال'],['active','قطعات فعال'],['digital','میکروکنترلر و بردها']].forEach(([id,label]) => {
    const b = document.createElement('button');
    b.className = 'comp-cat-btn' + (compState.cat===id ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      if(compState.cat===id) return;
      SFX.click(); compState.cat=id; compState.famIdx=0; compState.typeIdx=0; renderComponents();
    });
    catTabs.appendChild(b);
  });

  const families = COMPONENT_LIBRARY[compState.cat];
  const famRow = document.getElementById('compFamChips');
  families.forEach((fam, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (i===compState.famIdx ? ' active' : '');
    chip.textContent = `${fam.icon} ${fam.name}`;
    chip.addEventListener('click', () => {
      if(compState.famIdx===i) return;
      SFX.hover(); compState.famIdx=i; compState.typeIdx=0; renderComponents();
    });
    famRow.appendChild(chip);
  });

  const fam = families[compState.famIdx];
  const typeRow = document.getElementById('compTypeChips');
  fam.types.forEach((t, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-sm' + (i===compState.typeIdx ? ' active' : '');
    chip.textContent = `${t.icon} ${t.name}`;
    chip.addEventListener('click', () => {
      if(compState.typeIdx===i) return;
      SFX.hover(); compState.typeIdx=i; renderStage();
      Array.from(typeRow.children).forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
    });
    typeRow.appendChild(chip);
  });

  renderStage();
}
function renderStage(){
  const fam = COMPONENT_LIBRARY[compState.cat][compState.famIdx];
  const t = fam.types[compState.typeIdx];
  const stage = document.getElementById('compStage');
  const oldRaf = stage._raf; if(oldRaf) cancelAnimationFrame(oldRaf);
  const specsHTML = t.specs.map(s => `<span class="spec-badge">${s}</span>`).join('');
  const kind = DEMO_KINDS[t.kind];
  track('component_viewed', { id: t.id, name: t.name });
  stage.innerHTML = `
    <div class="comp-head">
      <div class="comp-icon">${t.icon}</div>
      <div>
        <div class="comp-name">${t.name}</div>
        <div class="comp-tag">${t.tagEn}</div>
      </div>
    </div>
    <div class="comp-desc">${t.desc}</div>
    <div class="spec-row">${specsHTML}</div>
    ${kind.html(t.params||{})}`;
  kind.setup(stage, t.params||{});
}
renderComponents();

/* ---------- generic interaction tracking for EVERY component demo ----------
   Delegated on #componentGrid (a static container that only has its innerHTML
   swapped, never itself recreated) so this covers all current and future
   DEMO_KINDS without instrumenting each one individually.
   - 'change'     → slider/select/checkbox released (not noisy 'input')
   - 'click'      → buttons, toggles, canvas taps
   - 'pointerdown'→ drag-based controls (knobs, draggable canvases)
   Throttled per component so a burst of clicks doesn't flood analytics. */
(function(){
  const grid = document.getElementById('componentGrid');
  let lastKey = '', lastTime = 0;
  function handle(e){
    const stageEl = e.target.closest('.comp-stage');
    if(!stageEl) return;
    const fam = COMPONENT_LIBRARY[compState.cat][compState.famIdx];
    const t = fam.types[compState.typeIdx];
    const key = t.id + '|' + e.type;
    const now = Date.now();
    if(key === lastKey && now - lastTime < 300) return; // de-dupe rapid repeats
    lastKey = key; lastTime = now;
    track('component_interacted', { id: t.id, name: t.name, kind: t.kind, event: e.type });
  }
  ['click','change','pointerdown'].forEach(ev => grid.addEventListener(ev, handle));
})();

/* ---------- RESISTOR COLOR GUIDE TABLE ---------- */
function fmtMult(m){
  if(m >= 1) return '× ' + toFa(m.toLocaleString('en-US').replace(/,/g,'٬'));
  return '× ' + toFa(m);
}
function faColorName(n){
  const map = { black:'مشکی', brown:'قهوه‌ای', red:'قرمز', orange:'نارنجی', yellow:'زرد',
    green:'سبز', blue:'آبی', violet:'بنفش', gray:'خاکستری', white:'سفید', gold:'طلایی', silver:'نقره‌ای' };
  return map[n] || n;
}
function renderResistorGuide(){
  const table = document.getElementById('resistorGuideTable');
  if(!table) return;
  let html = `<div class="rg-row rg-head">
      <div></div><div>رنگ</div><div>رقم</div><div>ضریب</div><div>تلورانس</div>
    </div>`;
  RESISTOR_COLORS.forEach(c => {
    html += `<div class="rg-row">
        <div><span class="rg-swatch" style="background:${c.hex}"></span></div>
        <div class="rg-name">${faColorName(c.name)}</div>
        <div class="mono">${c.digit !== undefined ? toFa(c.digit) : '—'}</div>
        <div class="mono">${c.mult !== undefined ? fmtMult(c.mult) : '—'}</div>
        <div class="mono">${c.tol !== undefined ? '± '+toFa(c.tol)+'٪' : '—'}</div>
      </div>`;
  });
  table.innerHTML = html;
  const example = document.getElementById('resistorGuideExample');
  if(example){
    example.textContent = 'مثال: قرمز–بنفش–نارنجی–طلایی → رقم ۲۷ × ۱۰۰۰ = ۲۷٬۰۰۰ Ω (۲۷ kΩ) با خطای ± ۵٪. برای تمرین، نوارهای مقاومت بالا را با همین رنگ‌ها تنظیم کن و ببین همین عدد به دست می‌آید یا نه.';
  }
}
renderResistorGuide();

/* ========================================================================
   CAPACITOR CHARGE / DISCHARGE SIMULATOR
   ======================================================================== */
const capCanvas = document.getElementById('capCanvas');
const cctx2 = capCanvas.getContext('2d');
const capRRange = document.getElementById('capRRange');
const capCRange = document.getElementById('capCRange');
const capRVal = document.getElementById('capRVal');
const capCVal = document.getElementById('capCVal');
const capTauVal = document.getElementById('capTauVal');
const capStateVal = document.getElementById('capStateVal');

let capW = 0, capH = 0;
const capHistory = [];
const capState = { mode:'idle', ratio:0, startRatio:0, startTime:0 };

function resizeCapCanvas(){
  const rect = capCanvas.getBoundingClientRect();
  if(rect.width === 0) return;
  const dpr = window.devicePixelRatio || 1;
  capCanvas.width = rect.width * dpr;
  capCanvas.height = rect.height * dpr;
  cctx2.setTransform(dpr,0,0,dpr,0,0);
  capW = rect.width; capH = rect.height;
}
function capTau(){
  return parseFloat(capRRange.value) * (parseFloat(capCRange.value) * 1e-6); // seconds
}
function animDuration(){
  return Math.min(6, Math.max(0.6, capTau()*1.3));
}
function formatSeconds(t){
  if(t < 1) return toFa((t*1000).toFixed(0)) + ' ms';
  if(t < 60) return toFa(t.toFixed(t<10?2:1)) + ' s';
  return toFa((t/60).toFixed(1)) + ' min';
}
function updateCapReadouts(){
  capRVal.textContent = toFa(capRRange.value) + ' Ω';
  capCVal.textContent = toFa(capCRange.value) + ' µF';
  capTauVal.textContent = formatSeconds(capTau());
}
capRRange.addEventListener('input', updateCapReadouts);
capCRange.addEventListener('input', updateCapReadouts);

function startCharge(){ capState.mode='charging'; capState.startRatio=capState.ratio; capState.startTime=performance.now(); SFX.click(); track('capacitor_action', { action:'charge' }); }
function startDischarge(){ capState.mode='discharging'; capState.startRatio=capState.ratio; capState.startTime=performance.now(); SFX.click(); track('capacitor_action', { action:'discharge' }); }
document.getElementById('capChargeBtn').addEventListener('click', startCharge);
document.getElementById('capDischargeBtn').addEventListener('click', startDischarge);

function updateCapState(){
  if(capState.mode === 'idle') return;
  const elapsed = (performance.now() - capState.startTime)/1000;
  const p = Math.min(elapsed/animDuration(), 1);
  const target = capState.mode === 'charging' ? 1 : 0;
  const factor = 1 - Math.exp(-5*p);
  capState.ratio = capState.startRatio + (target - capState.startRatio)*factor;
  if(p >= 1){ capState.ratio = target; capState.mode = 'idle'; }
}
function capStatusText(){
  if(capState.mode === 'charging') return 'در حال شارژ…';
  if(capState.mode === 'discharging') return 'در حال دشارژ…';
  if(capState.ratio > 0.97) return 'پر ⚡';
  if(capState.ratio < 0.03) return 'خالی';
  return 'نیمه‌شارژ';
}

function drawCapFrame(){
  if(capW === 0) return;
  cctx2.clearRect(0,0,capW,capH);
  const ratio = capState.ratio;

  const tankX = 18, tankW = Math.min(80, capW*0.2), tankY = 16, tankH = capH-56;
  roundRectPath(cctx2, tankX, tankY, tankW, tankH, 10);
  cctx2.strokeStyle = '#3a4356'; cctx2.lineWidth = 2.5; cctx2.stroke();

  const fillH = tankH*ratio;
  cctx2.save();
  roundRectPath(cctx2, tankX, tankY, tankW, tankH, 10); cctx2.clip();
  const grad = cctx2.createLinearGradient(0, tankY+tankH-fillH, 0, tankY+tankH);
  grad.addColorStop(0, '#8ff0c4'); grad.addColorStop(1, '#3f9d78');
  cctx2.fillStyle = grad;
  cctx2.fillRect(tankX, tankY+tankH-fillH, tankW, fillH);
  cctx2.restore();

  cctx2.fillStyle = '#e8e2d0'; cctx2.font = '700 13px JetBrains Mono'; cctx2.textAlign = 'center';
  cctx2.fillText(toFa(Math.round(ratio*100)) + '%', tankX+tankW/2, tankY+tankH+22);
  cctx2.fillStyle = '#6b7280'; cctx2.font = '11px Vazirmatn';
  cctx2.fillText('خازن', tankX+tankW/2, tankY-4);

  const gx = tankX+tankW+34, gy = 16, gw = Math.max(20, capW-gx-16), gh = capH-56;
  cctx2.strokeStyle = '#232b3a'; cctx2.lineWidth = 1;
  cctx2.strokeRect(gx,gy,gw,gh);
  for(let i=1;i<4;i++){
    const y = gy + gh*i/4;
    cctx2.beginPath(); cctx2.moveTo(gx,y); cctx2.lineTo(gx+gw,y);
    cctx2.strokeStyle = '#1a2130'; cctx2.stroke();
  }
  capHistory.push(ratio);
  while(capHistory.length > gw) capHistory.shift();
  cctx2.beginPath();
  cctx2.strokeStyle = '#57d8a3'; cctx2.lineWidth = 2.5;
  capHistory.forEach((r,i) => {
    const x = gx + gw - capHistory.length + i;
    const y = gy + gh - r*gh;
    if(i===0) cctx2.moveTo(x,y); else cctx2.lineTo(x,y);
  });
  cctx2.stroke();
  cctx2.fillStyle = '#6b7280'; cctx2.font = '11px Vazirmatn'; cctx2.textAlign = 'right';
  cctx2.fillText('ولتاژ خازن', gx+gw, gy-4);
}

/* ========================================================================
   OSCILLOSCOPE — signal generator + scrolling scope trace
   ======================================================================== */
const scopeCanvas = document.getElementById('scopeCanvas');
const sctx = scopeCanvas.getContext('2d');
const scopeWaveTabs = document.getElementById('scopeWaveTabs');
const scopeNoiseBtn = document.getElementById('scopeNoiseBtn');
const scopeNoiseLabel = document.getElementById('scopeNoiseLabel');
const scopeRunBtn = document.getElementById('scopeRunBtn');
const scopeRunLabel = document.getElementById('scopeRunLabel');
const scopeFreqRange = document.getElementById('scopeFreqRange');
const scopeAmpRange = document.getElementById('scopeAmpRange');
const scopeOffsetRange = document.getElementById('scopeOffsetRange');
const scopeTimeDivRange = document.getElementById('scopeTimeDivRange');
const scopeFreqVal = document.getElementById('scopeFreqVal');
const scopeAmpVal = document.getElementById('scopeAmpVal');
const scopeOffsetVal = document.getElementById('scopeOffsetVal');
const scopeTimeDivVal = document.getElementById('scopeTimeDivVal');
const scopePeriodVal = document.getElementById('scopePeriodVal');
const scopeVppVal = document.getElementById('scopeVppVal');
const scopeRmsVal = document.getElementById('scopeRmsVal');

let scopeW = 0, scopeH = 0;
let scopeWave = 'sine';       // 'sine' | 'square' | 'triangle' | 'sawtooth'
let scopeNoise = false;
let scopeRunning = true;
let scopeSimTime = 0;         // seconds, only advances while running

const SCOPE_DIVS_Y = 8; // classic 8 vertical divisions, ±4 div full-scale
const SCOPE_VOLTS_PER_DIV = 1; // fixed 1 V/div, like a real scope's V/DIV knob

function resizeScopeCanvas(){
  const rect = scopeCanvas.getBoundingClientRect();
  if(rect.width === 0) return;
  const dpr = window.devicePixelRatio || 1;
  scopeCanvas.width = rect.width * dpr;
  scopeCanvas.height = rect.height * dpr;
  sctx.setTransform(dpr,0,0,dpr,0,0);
  scopeW = rect.width; scopeH = rect.height;
}

function scopeWaveValue(t, f){
  const ph = (t*f) % 1;
  switch(scopeWave){
    case 'square':   return ph < 0.5 ? 1 : -1;
    case 'triangle': return ph < 0.25 ? 4*ph : ph < 0.75 ? 2-4*ph : 4*ph-4;
    case 'sawtooth': return 2*ph - 1;
    default:         return Math.sin(2*Math.PI*ph); // sine
  }
}
function scopeRmsFactor(){
  switch(scopeWave){
    case 'square':   return 1;
    case 'triangle':
    case 'sawtooth': return 1/Math.sqrt(3);
    default:         return 1/Math.SQRT2; // sine
  }
}

function scopeFreq(){ return parseFloat(scopeFreqRange.value); }
function scopeAmp(){ return parseFloat(scopeAmpRange.value); }
function scopeOffset(){ return parseFloat(scopeOffsetRange.value); }
function scopeTimeDiv(){ return parseFloat(scopeTimeDivRange.value)/1000; } // seconds/div

function updateScopeReadouts(){
  const f = scopeFreq(), A = scopeAmp();
  scopeFreqVal.textContent = toFa(f % 1 === 0 ? f : f.toFixed(1)) + ' Hz';
  scopeAmpVal.textContent = toFa(A % 1 === 0 ? A : A.toFixed(1)) + ' V';
  const off = scopeOffset();
  scopeOffsetVal.textContent = (off > 0 ? '+' : '') + toFa(off % 1 === 0 ? off : off.toFixed(1)) + ' V';
  scopeTimeDivVal.textContent = toFa(scopeTimeDivRange.value) + ' ms';
  scopePeriodVal.textContent = formatSeconds(1/f);
  scopeVppVal.textContent = toFa((2*A).toFixed(1)) + ' V';
  scopeRmsVal.textContent = toFa((A*scopeRmsFactor()).toFixed(2)) + ' V';
}
[scopeFreqRange, scopeAmpRange, scopeOffsetRange, scopeTimeDivRange].forEach(el =>
  el.addEventListener('input', updateScopeReadouts));

scopeWaveTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.ohm-mode-btn');
  if(!btn || btn.classList.contains('active')) return;
  scopeWave = btn.dataset.wave;
  Array.from(scopeWaveTabs.children).forEach(b => b.classList.toggle('active', b === btn));
  SFX.click();
  updateScopeReadouts();
});
scopeNoiseBtn.addEventListener('click', () => {
  scopeNoise = !scopeNoise;
  scopeNoiseBtn.classList.toggle('off', scopeNoise);
  scopeNoiseLabel.textContent = scopeNoise ? 'روشن' : 'خاموش';
  SFX.click();
});
scopeRunBtn.addEventListener('click', () => {
  scopeRunning = !scopeRunning;
  scopeRunBtn.classList.toggle('off', !scopeRunning);
  scopeRunLabel.textContent = scopeRunning ? 'در حال اجرا' : 'متوقف (HOLD)';
  SFX.click();
});

function stepScope(dt){
  if(!scopeRunning) return;
  scopeSimTime += dt;
}

// Deterministic sample at absolute time t — no stored history needed, so the
// trace is always exactly time-accurate to the Time/Div setting, regardless
// of frame rate.
function scopeSampleAt(t, f, A, off){
  let v = A * scopeWaveValue(t, f) + off;
  if(scopeNoise) v += (Math.random()-0.5) * A * 0.35;
  return v;
}

function drawScopeFrame(){
  if(scopeW === 0) return;
  sctx.clearRect(0,0,scopeW,scopeH);
  const pad = 10;
  const gx = pad, gy = pad, gw = scopeW - pad*2, gh = scopeH - pad*2;
  const divH = gh / SCOPE_DIVS_Y;
  const divsX = Math.max(4, Math.round(gw / divH));
  const divW = gw / divsX;

  // grid
  sctx.strokeStyle = '#1c2432'; sctx.lineWidth = 1;
  for(let i=0;i<=divsX;i++){
    const x = gx + i*divW;
    sctx.beginPath(); sctx.moveTo(x,gy); sctx.lineTo(x,gy+gh); sctx.stroke();
  }
  for(let i=0;i<=SCOPE_DIVS_Y;i++){
    const y = gy + i*divH;
    sctx.beginPath(); sctx.moveTo(gx,y); sctx.lineTo(gx+gw,y); sctx.stroke();
  }
  // center (0V / trigger) line, brighter
  const zeroY = gy + gh/2;
  sctx.strokeStyle = 'rgba(212,175,55,.55)'; sctx.lineWidth = 1.3;
  sctx.beginPath(); sctx.moveTo(gx,zeroY); sctx.lineTo(gx+gw,zeroY); sctx.stroke();

  // trace — x maps linearly onto a window of (divsX * Time/Div) seconds
  // ending at the current sim time, so the slider's ms/Div value is exact.
  const f = scopeFreq(), A = scopeAmp(), off = scopeOffset();
  const windowSec = divsX * scopeTimeDiv();
  const pxPerVolt = divH / SCOPE_VOLTS_PER_DIV;
  sctx.save();
  sctx.beginPath(); sctx.rect(gx,gy,gw,gh); sctx.clip();
  sctx.beginPath();
  sctx.strokeStyle = '#57d8a3'; sctx.lineWidth = 2.2;
  sctx.shadowColor = '#57d8a3'; sctx.shadowBlur = 6;
  const steps = Math.max(2, Math.round(gw));
  for(let i=0;i<=steps;i++){
    const x = gx + gw*i/steps;
    const t = scopeSimTime - windowSec*(1 - i/steps);
    const v = scopeSampleAt(t, f, A, off);
    const y = zeroY - v*pxPerVolt;
    if(i===0) sctx.moveTo(x,y); else sctx.lineTo(x,y);
  }
  sctx.stroke();
  sctx.shadowBlur = 0;
  sctx.restore();

  // corner labels (V/div, Time/div) like a real scope readout
  sctx.fillStyle = '#6b7280'; sctx.font = '10px JetBrains Mono'; sctx.textAlign = 'left';
  sctx.fillText(toFa(SCOPE_VOLTS_PER_DIV) + ' V/Div', gx+4, gy+13);
  sctx.textAlign = 'right';
  sctx.fillText(toFa(scopeTimeDivRange.value) + ' ms/Div', gx+gw-4, gy+13);
}

/* ========================================================================
   TESLA TOWER — موس یا اجسام را نزدیک ببر: رسانا در برابر عایق
   به roundRectPath (common.js) و SFX.spark نیاز دارد.
   ======================================================================== */
const teslaCanvas = document.getElementById('teslaCanvas');
const tectx = teslaCanvas.getContext('2d');
const teslaSwitchBtn = document.getElementById('teslaSwitchBtn');
const teslaSwitchLabel = document.getElementById('teslaSwitchLabel');
const teslaNote = document.getElementById('teslaNote');
const teslaObjectsEl = document.getElementById('teslaObjects');

let teslaW = 0, teslaH = 0, teslaTowerX = 0, teslaTowerY = 0;
let TESLA_REACH = 150; // px — بیشترین فاصله‌ای که جرقه می‌تواند بپرد (با اندازه‌ی کانواس تنظیم می‌شود)
const TESLA_NOTE_DEFAULT = 'اجسام فلزی مثل کلید و گیره‌کاغذ «رسانا»ند — جرقه راحت به آن‌ها می‌رسد. بادکنک و خط‌کش «عایق»ند و جلوی جرقه را می‌گیرند. چراغ را هم نزدیک برج ببر تا با عبور جریان روشن شود! با موس هم نزدیک برج شو و ببین دستِ خودت هم رساناست! نکته: در دنیای واقعی هرگز به دستگاه ولتاژ بالا نزدیک نشو.';
const TESLA_NOTE_OFF = 'برج خاموش است — دکمه‌ی «برج» را بزن تا روشن شود.';

let teslaPowerOn = true;
const teslaHover = { active:false, x:0, y:0 };
const teslaDrag  = { active:false, x:0, y:0, conductive:true, label:'', light:false };
let teslaBoltTimer = 0;
let teslaMainBolt = [];
let teslaBranchBolts = [];
let teslaWasArcing = false;
let teslaArcKind = null; // 'spark' | 'blocked' | null
let teslaActiveGhost = null; // المان drag-ghost فعلی، برای روشن‌کردن چراغ وقتی جرقه بهش می‌رسد

function resizeTeslaCanvas(){
  const rect = teslaCanvas.getBoundingClientRect();
  if(rect.width === 0) return;
  const dpr = window.devicePixelRatio || 1;
  teslaCanvas.width = rect.width * dpr;
  teslaCanvas.height = rect.height * dpr;
  tectx.setTransform(dpr,0,0,dpr,0,0);
  teslaW = rect.width; teslaH = rect.height;
  teslaTowerX = teslaW/2;
  teslaTowerY = teslaH*0.28;
  // برد جرقه را متناسب با اندازه‌ی کانواس بزرگ‌تر می‌کنیم تا از فاصله‌ی بیشتری هم جواب بدهد
  TESLA_REACH = Math.max(200, Math.min(teslaW, teslaH) * 0.85);
}

// الگوریتم جابه‌جایی نقطه‌ی میانی برای رسم جرقه‌ی کج‌ومعوج و طبیعی
function midpointBolt(x0,y0,x1,y1,displace,depth,out){
  if(depth <= 0){ out.push([x1,y1]); return; }
  const mx = (x0+x1)/2 + (Math.random()-0.5)*displace;
  const my = (y0+y1)/2 + (Math.random()-0.5)*displace;
  midpointBolt(x0,y0,mx,my,displace*0.55,depth-1,out);
  midpointBolt(mx,my,x1,y1,displace*0.55,depth-1,out);
}
function buildBolt(x0,y0,x1,y1,displace,depth){
  const pts = [[x0,y0]];
  midpointBolt(x0,y0,x1,y1,displace,depth,pts);
  return pts;
}
function strokeBolt(ctx, pts, color, width, glow){
  if(pts.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = glow;
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

function currentTeslaTarget(){
  if(teslaDrag.active) return { x:teslaDrag.x, y:teslaDrag.y, conductive:teslaDrag.conductive, label:teslaDrag.label, light:teslaDrag.light, present:true };
  if(teslaHover.active) return { x:teslaHover.x, y:teslaHover.y, conductive:true, label:'دست تو', light:false, present:true };
  return { present:false };
}

function updateTeslaNote(target, kind){
  if(kind === 'spark'){
    if(target.light){
      teslaNote.textContent = `💡 چراغ روشن شد! چون چراغ هم رساناست، جریان از آن عبور کرد و آن را روشن نگه داشت — دقیقاً مثل یک لامپ در یک مدار واقعی.`;
    } else {
      const safetyTail = target.label === 'دست تو' ? ' به همین دلیل بدن انسان هم رساناست و نزدیک‌شدن به ولتاژ بالای واقعی خطرناک است — این‌جا فقط یک شبیه‌سازی امن است.' : '';
      teslaNote.textContent = `⚡ جرقه زد! ${target.label} رساناست — جریان راحت از آن عبور می‌کند.${safetyTail}`;
    }
  } else if(kind === 'blocked'){
    teslaNote.textContent = `🚫 جرقه به ${target.label} نمی‌رسد — این جسم عایق است و جلوی عبور جریان را می‌گیرد.`;
  } else {
    teslaNote.textContent = TESLA_NOTE_DEFAULT;
  }
}

function stepTesla(dt){
  if(!teslaPowerOn) return;
  teslaBoltTimer -= dt;
  const target = currentTeslaTarget();
  let arcing = false, kind = null;
  if(target.present){
    const dist = Math.hypot(target.x - teslaTowerX, target.y - teslaTowerY);
    if(dist <= TESLA_REACH){
      arcing = true;
      kind = target.conductive ? 'spark' : 'blocked';
    }
  }
  if(teslaBoltTimer <= 0){
    teslaBoltTimer = 0.02 + Math.random()*0.025; // فلیکر خیلی سریع‌تر — رعد و برق تندتر و پرانرژی‌تر
    if(kind === 'spark'){
      teslaMainBolt = buildBolt(teslaTowerX, teslaTowerY, target.x, target.y, 26, 6);
      teslaBranchBolts = [];
      const branchCount = 4 + Math.floor(Math.random()*4); // ۴ تا ۷ شاخه — رعدوبرق‌های بیشتر
      for(let bcount=0; bcount<branchCount; bcount++){
        if(Math.random() < 0.9){
          const bi = 1 + Math.floor(Math.random()*(teslaMainBolt.length-2));
          const [bx,by] = teslaMainBolt[bi];
          const ang = Math.random()*Math.PI*2;
          const blen = 22 + Math.random()*30;
          teslaBranchBolts.push(buildBolt(bx,by, bx+Math.cos(ang)*blen, by+Math.sin(ang)*blen, 12, 3));
        }
      }
      // چند جرقه‌ی کرونا هم مستقیم از نوک برج، برای حس پرقدرت‌تر
      const coronaCount = 2 + Math.floor(Math.random()*3);
      for(let c=0;c<coronaCount;c++){
        const ang = Math.random()*Math.PI*2;
        const len = 10 + Math.random()*18;
        teslaBranchBolts.push(buildBolt(teslaTowerX, teslaTowerY, teslaTowerX+Math.cos(ang)*len, teslaTowerY+Math.sin(ang)*len, 8, 2));
      }
    } else if(kind === 'blocked'){
      const frac = 0.35 + Math.random()*0.2; // جرقه تا نیمه می‌رسد و خاموش می‌شود
      const tx = teslaTowerX + (target.x-teslaTowerX)*frac;
      const ty = teslaTowerY + (target.y-teslaTowerY)*frac;
      teslaMainBolt = buildBolt(teslaTowerX, teslaTowerY, tx, ty, 18, 5);
      teslaBranchBolts = [];
      const blockedBranches = 1 + Math.floor(Math.random()*2);
      for(let bb=0; bb<blockedBranches; bb++){
        if(Math.random() < 0.7){
          const bi = 1 + Math.floor(Math.random()*(teslaMainBolt.length-2));
          const [bx,by] = teslaMainBolt[bi];
          const ang = Math.random()*Math.PI*2;
          const blen = 14 + Math.random()*16;
          teslaBranchBolts.push(buildBolt(bx,by, bx+Math.cos(ang)*blen, by+Math.sin(ang)*blen, 8, 2));
        }
      }
    } else {
      teslaMainBolt = [];
      teslaBranchBolts = [];
      const coronaCount = Math.random() < 0.9 ? (2 + Math.floor(Math.random()*4)) : 0; // کرونای پررنگ‌تر و بیشتر دور برج
      for(let c=0;c<coronaCount;c++){
        const ang = Math.random()*Math.PI*2;
        const len = 10 + Math.random()*20;
        teslaBranchBolts.push(buildBolt(teslaTowerX, teslaTowerY, teslaTowerX+Math.cos(ang)*len, teslaTowerY+Math.sin(ang)*len, 8, 3));
      }
    }
  }
  const sparking = kind === 'spark';
  if(sparking && (!teslaWasArcing || Math.random() < dt*3)) SFX.spark();
  teslaWasArcing = sparking;
  teslaArcKind = arcing ? kind : null;
  updateTeslaNote(target, teslaArcKind);
  // اگر چراغ در دستِ کشیدن است، وقتی جرقه بهش برسد روشن (درخشان) می‌شود
  if(teslaActiveGhost){
    teslaActiveGhost.classList.toggle('lit', sparking && !!target.light);
  }
}

function drawTeslaTowerBody(){
  const baseY = teslaH - 12;
  const topY = teslaTowerY;
  const baseW = 46, topW = 14;
  tectx.fillStyle = '#232b3a';
  roundRectPath(tectx, teslaTowerX-baseW/2, baseY-10, baseW, 10, 3);
  tectx.fill();
  const coilTopY = topY + 16;
  const turns = 9;
  for(let i=0;i<=turns;i++){
    const f = i/turns;
    const y = (baseY-10) - f*((baseY-10)-coilTopY);
    const w = baseW*0.64*(1-f) + topW*f;
    tectx.strokeStyle = teslaPowerOn ? 'rgba(231,154,84,.75)' : 'rgba(107,114,128,.5)';
    tectx.lineWidth = 2;
    tectx.beginPath();
    tectx.ellipse(teslaTowerX, y, w/2, 3.2, 0, 0, Math.PI*2);
    tectx.stroke();
  }
  const glow = teslaPowerOn ? (teslaArcKind ? 30 : 16) : 0;
  tectx.save();
  tectx.shadowColor = teslaArcKind === 'spark' ? '#c9a3ff' : '#d4af37';
  tectx.shadowBlur = glow;
  tectx.strokeStyle = teslaPowerOn ? (teslaArcKind ? '#f1e0ff' : '#d4af37') : '#4b5566';
  tectx.lineWidth = 8;
  tectx.beginPath();
  tectx.ellipse(teslaTowerX, topY, 20, 9, 0, 0, Math.PI*2);
  tectx.stroke();
  tectx.restore();
}

function drawTeslaFrame(){
  if(teslaW === 0) return;
  tectx.clearRect(0,0,teslaW,teslaH);
  drawTeslaTowerBody();
  if(teslaPowerOn){
    teslaBranchBolts.forEach(b => strokeBolt(tectx, b, 'rgba(201,163,255,.65)', 1.7, 11));
    if(teslaMainBolt.length){
      const blocked = teslaArcKind === 'blocked';
      strokeBolt(tectx, teslaMainBolt, blocked ? 'rgba(232,128,30,.85)' : '#f2ecff', blocked ? 1.9 : 2.8, blocked ? 12 : 20);
    }
  }
  if(teslaPowerOn && teslaDrag.active){
    tectx.save();
    tectx.globalAlpha = .55;
    tectx.fillStyle = teslaDrag.conductive ? '#57d8a3' : '#e08b82';
    tectx.beginPath();
    tectx.arc(teslaDrag.x, teslaDrag.y, 5, 0, Math.PI*2);
    tectx.fill();
    tectx.restore();
  }
}

teslaSwitchBtn.addEventListener('click', () => {
  teslaPowerOn = !teslaPowerOn;
  teslaSwitchBtn.classList.toggle('off', !teslaPowerOn);
  teslaSwitchLabel.textContent = teslaPowerOn ? 'روشن' : 'خاموش';
  track('tesla_power_toggled', { on: teslaPowerOn });
  if(!teslaPowerOn){
    teslaMainBolt = []; teslaBranchBolts = []; teslaArcKind = null; teslaWasArcing = false;
    teslaNote.textContent = TESLA_NOTE_OFF;
  } else {
    teslaNote.textContent = TESLA_NOTE_DEFAULT;
  }
  SFX.click();
});

teslaCanvas.addEventListener('pointermove', (e) => {
  if(teslaDrag.active) return;
  const rect = teslaCanvas.getBoundingClientRect();
  teslaHover.x = e.clientX - rect.left;
  teslaHover.y = e.clientY - rect.top;
  teslaHover.active = true;
});
teslaCanvas.addEventListener('pointerdown', (e) => {
  if(teslaDrag.active) return;
  const rect = teslaCanvas.getBoundingClientRect();
  teslaHover.x = e.clientX - rect.left;
  teslaHover.y = e.clientY - rect.top;
  teslaHover.active = true;
});
teslaCanvas.addEventListener('pointerleave', () => { teslaHover.active = false; });

function positionTeslaGhost(ghost, clientX, clientY){
  ghost.style.left = clientX + 'px';
  ghost.style.top = clientY + 'px';
}
Array.from(teslaObjectsEl.querySelectorAll('.tesla-obj')).forEach(el => {
  let ghost = null;
  function endDrag(){
    if(ghost){ ghost.remove(); ghost = null; }
    teslaDrag.active = false;
    teslaActiveGhost = null;
  }
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    ghost = document.createElement('div');
    ghost.className = 'tesla-drag-ghost';
    ghost.textContent = el.dataset.emoji;
    document.body.appendChild(ghost);
    positionTeslaGhost(ghost, e.clientX, e.clientY);
    teslaHover.active = false;
    teslaDrag.active = true;
    teslaDrag.conductive = el.dataset.conductive === 'true';
    teslaDrag.label = el.dataset.label;
    teslaDrag.light = el.dataset.light === 'true';
    teslaActiveGhost = ghost;
    const rect = teslaCanvas.getBoundingClientRect();
    teslaDrag.x = e.clientX - rect.left;
    teslaDrag.y = e.clientY - rect.top;
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
  });
  el.addEventListener('pointermove', (e) => {
    if(!ghost) return;
    positionTeslaGhost(ghost, e.clientX, e.clientY);
    const rect = teslaCanvas.getBoundingClientRect();
    teslaDrag.x = e.clientX - rect.left;
    teslaDrag.y = e.clientY - rect.top;
  });
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
});

/* ========================================================================
   ELECTROMAGNET — سیم‌پیچ، هسته‌ی آهنی، خط‌های میدان مغناطیسی،
   اجسام آهنی (جذب می‌شوند) و قطب‌نما (جهت میدان را نشان می‌دهد)
   به roundRectPath (common.js)، toFa و SFX نیاز دارد.
   ======================================================================== */
const magnetCanvas = document.getElementById('magnetCanvas');
const mgctx = magnetCanvas.getContext('2d');
const magnetSwitchBtn = document.getElementById('magnetSwitchBtn');
const magnetSwitchLabel = document.getElementById('magnetSwitchLabel');
const magnetPolarityBtn = document.getElementById('magnetPolarityBtn');
const magnetCurrentRange = document.getElementById('magnetCurrentRange');
const magnetCurrentVal = document.getElementById('magnetCurrentVal');
const magnetTurnsRange = document.getElementById('magnetTurnsRange');
const magnetTurnsVal = document.getElementById('magnetTurnsVal');
const magnetFieldVal = document.getElementById('magnetFieldVal');
const magnetPoleLeftVal = document.getElementById('magnetPoleLeftVal');
const magnetPoleRightVal = document.getElementById('magnetPoleRightVal');
const magnetNote = document.getElementById('magnetNote');
const magnetObjectsEl = document.getElementById('magnetObjects');

let magnetW = 0, magnetH = 0, magnetCX = 0, magnetCY = 0;
let magnetCoreHalf = 0;  // نصف طول هسته‌ی آهنی (تا نوک قطب‌ها)
let magnetCoilHalf = 0;  // نصف طول بخشی که سیم‌پیچ دور آن پیچیده شده
let magnetCoreR = 0;     // شعاع هسته

let magnetPowerOn = true;
let magnetPolarity = 1;  // 1 یا -1 — کدام سر «شمال» است را تعیین می‌کند
let magnetPulseT = 0;

const magnetDrag = { active:false, x:0, y:0, magnetic:false, compass:false, label:'', attracting:false, pullX:0, pullY:0, pullFrac:0 };
let magnetActiveGhost = null;

const MAGNET_NOTE_DEFAULT = 'سیم‌پیچ را روشن نگه‌دار و جریان یا تعداد دورها را زیاد کن تا میدان مغناطیسی قوی‌تر شود. گیره‌کاغذ و پیچ «آهنی»ند و به قطب‌ها جذب می‌شوند؛ بادکنک و سکه‌ی مسی بی‌اثرند. قطب‌نما را هم دور تا دور آهنربا بگردان و ببین عقربه‌اش همیشه هم‌جهت با خط‌های میدان می‌ایستد!';
const MAGNET_NOTE_OFF = 'سیم‌پیچ خاموش است — بدون عبور جریان، آهنربای الکتریکی هیچ میدانی تولید نمی‌کند. دکمه‌ی «سیم‌پیچ» را بزن تا روشن شود.';

function resizeMagnetCanvas(){
  const rect = magnetCanvas.getBoundingClientRect();
  if(rect.width === 0) return;
  const dpr = window.devicePixelRatio || 1;
  magnetCanvas.width = rect.width * dpr;
  magnetCanvas.height = rect.height * dpr;
  mgctx.setTransform(dpr,0,0,dpr,0,0);
  magnetW = rect.width; magnetH = rect.height;
  magnetCX = magnetW/2; magnetCY = magnetH/2;
  magnetCoreHalf = Math.min(magnetW*0.36, 150);
  magnetCoilHalf = magnetCoreHalf*0.62;
  magnetCoreR = Math.max(7, Math.min(magnetH*0.11, 16));
}

function magnetFieldStrength(){
  if(!magnetPowerOn) return 0;
  const I = parseFloat(magnetCurrentRange.value);
  const N = parseFloat(magnetTurnsRange.value);
  return (I * N) / 200; // مقیاس نمایشی برای شبیه‌سازی — واحد فیزیکی واقعی نیست
}

function updateMagnetReadouts(){
  magnetCurrentVal.textContent = toFa(parseFloat(magnetCurrentRange.value).toFixed(1)) + ' A';
  magnetTurnsVal.textContent = toFa(magnetTurnsRange.value) + ' دور';
  const B = magnetFieldStrength();
  magnetFieldVal.textContent = magnetPowerOn ? toFa(B.toFixed(1)) : (toFa('0.0') + ' (خاموش)');
  const leftIsNorth = magnetPolarity === 1;
  magnetPoleLeftVal.textContent = leftIsNorth ? 'N (شمال)' : 'S (جنوب)';
  magnetPoleRightVal.textContent = leftIsNorth ? 'S (جنوب)' : 'N (شمال)';
}
magnetCurrentRange.addEventListener('input', updateMagnetReadouts);
magnetTurnsRange.addEventListener('input', updateMagnetReadouts);

magnetSwitchBtn.addEventListener('click', () => {
  magnetPowerOn = !magnetPowerOn;
  magnetSwitchBtn.classList.toggle('off', !magnetPowerOn);
  magnetSwitchLabel.textContent = magnetPowerOn ? 'روشن' : 'خاموش';
  SFX.click();
  updateMagnetReadouts();
  if(!magnetDrag.active) magnetNote.textContent = magnetPowerOn ? MAGNET_NOTE_DEFAULT : MAGNET_NOTE_OFF;
});
magnetPolarityBtn.addEventListener('click', () => {
  magnetPolarity *= -1;
  SFX.click();
  updateMagnetReadouts();
});

// موقعیت نوک قطب‌ها بر اساس قطبیت فعلی
function magnetPoles(){
  const leftX = magnetCX - magnetCoreHalf, rightX = magnetCX + magnetCoreHalf;
  const northX = magnetPolarity === 1 ? leftX : rightX;
  const southX = magnetPolarity === 1 ? rightX : leftX;
  return { northX, southX, y: magnetCY };
}

// جهت میدان مغناطیسی (زاویه) در نقطه‌ی (px,py) — مدل ساده‌شده‌ی دوقطبی،
// فقط برای چرخاندن عقربه‌ی قطب‌نما به کار می‌رود (بزرگی میدان اهمیتی ندارد)
function magnetFieldAngleAt(px, py){
  const { northX, southX, y } = magnetPoles();
  const dx = northX - southX;
  const dlen = Math.abs(dx) || 1;
  const mux = dx/dlen; // بردار واحد از قطب جنوب به قطب شمال (گشتاور مغناطیسی)
  let rx = px - magnetCX, ry = py - y;
  let r = Math.hypot(rx, ry);
  if(r < 4) r = 4;
  const rux = rx/r, ruy = ry/r;
  const dot = mux*rux;
  const bx = 3*dot*rux - mux;
  const by = 3*dot*ruy;
  return Math.atan2(by, bx);
}

function stepMagnet(dt){
  magnetPulseT += dt;
  if(!magnetDrag.active) return;
  const B = magnetFieldStrength();
  let targetX = magnetDrag.x, targetY = magnetDrag.y; // پیش‌فرض: جسم دقیقاً زیر نشانگر بماند
  if(magnetDrag.magnetic){
    const { northX, southX, y } = magnetPoles();
    const dN = Math.hypot(magnetDrag.x-northX, magnetDrag.y-y);
    const dS = Math.hypot(magnetDrag.x-southX, magnetDrag.y-y);
    const nearestIsNorth = dN <= dS;
    const dist = nearestIsNorth ? dN : dS;
    const reach = magnetPowerOn ? Math.min(170, 55 + B*14) : 0;
    const attracting = magnetPowerOn && B > 0 && dist <= reach;
    if(attracting && !magnetDrag.attracting) SFX.click(); // لحظه‌ی «چسبیدن» یک صدای کوتاه بده
    magnetDrag.attracting = attracting;
    magnetDrag.pullX = nearestIsNorth ? northX : southX;
    magnetDrag.pullY = y;
    magnetDrag.pullFrac = attracting ? Math.min(1, 1 - dist/reach) : 0;
    if(attracting){
      // منحنیِ کشش تندتر: همین که وارد بردِ جذب شد، سریع به‌سمت قطب پرتاب می‌شود
      // و نزدیکِ قطب کاملاً به آن می‌چسبد — مثل یک آهنربای واقعی
      const pull = Math.pow(magnetDrag.pullFrac, 0.55);
      targetX = magnetDrag.x + (magnetDrag.pullX - magnetDrag.x)*pull;
      targetY = magnetDrag.y + (magnetDrag.pullY - magnetDrag.y)*pull;
    }
    if(attracting && Math.random() < dt*3) SFX.hover();
    magnetNote.textContent = !magnetPowerOn
      ? `سیم‌پیچ خاموش است — ${magnetDrag.label} جذب نمی‌شود.`
      : attracting
        ? `🧲 ${magnetDrag.label} جذب قطب ${nearestIsNorth ? 'شمال (N)' : 'جنوب (S)'} شد! میدان مغناطیسی روی فلزات آهنی نیرو وارد می‌کند.`
        : `${magnetDrag.label} را نزدیک‌تر ببر تا جذب قطب شود — هرچه جریان یا تعداد دور بیشتر باشد، برد جذب هم بیشتر می‌شود.`;
  } else if(magnetDrag.compass){
    magnetDrag.attracting = false;
    magnetNote.textContent = (!magnetPowerOn || B<=0)
      ? 'سیم‌پیچ خاموش است — بدون جریان میدانی نیست تا عقربه‌ی قطب‌نما را بچرخاند.'
      : 'عقربه‌ی قطب‌نما همیشه هم‌جهت با خط‌های میدان مغناطیسی می‌ایستد. آن را دور تا دور آهنربا بگردان و ببین جهتش عوض می‌شود!';
    if(magnetActiveGhost){
      const needle = magnetActiveGhost.querySelector('.ghost-needle');
      if(needle){
        const angleDeg = (magnetPowerOn && B > 0) ? magnetFieldAngleAt(magnetDrag.x, magnetDrag.y)*180/Math.PI : 0;
        needle.style.transform = `rotate(${angleDeg}deg)`;
      }
    }
  } else {
    magnetDrag.attracting = false;
    magnetNote.textContent = `${magnetDrag.label} مغناطیسی نیست — میدان مغناطیسی روی آن هیچ نیرویی وارد نمی‌کند.`;
  }
  // حرکتِ جسمِ روی‌صفحه به‌سمت هدف — وقتی جذب می‌شود تقریباً آنی و پرقدرت به قطب می‌چسبد،
  // در غیر این‌صورت دقیقاً دنبال نشانگر می‌رود
  if(magnetDrag.dispX === undefined){ magnetDrag.dispX = targetX; magnetDrag.dispY = targetY; }
  const ease = magnetDrag.attracting ? Math.min(1, dt*40) : 1;
  magnetDrag.dispX += (targetX - magnetDrag.dispX)*ease;
  magnetDrag.dispY += (targetY - magnetDrag.dispY)*ease;
  if(magnetActiveGhost){
    const rect = magnetCanvas.getBoundingClientRect();
    magnetActiveGhost.style.left = (rect.left + magnetDrag.dispX) + 'px';
    magnetActiveGhost.style.top = (rect.top + magnetDrag.dispY) + 'px';
  }
}


// نقطه‌ی روی منحنی درجه‌سه‌ی بزیه در پارامتر t (۰..۱)
function bezierPointAt(p0,p1,p2,p3,t){
  const mt = 1-t;
  return {
    x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
    y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y
  };
}
// بردار مماس (جهت حرکت) روی همان منحنی در پارامتر t
function bezierTangentAt(p0,p1,p2,p3,t){
  const mt = 1-t;
  return {
    x: 3*mt*mt*(p1.x-p0.x) + 6*mt*t*(p2.x-p1.x) + 3*t*t*(p3.x-p2.x),
    y: 3*mt*mt*(p1.y-p0.y) + 6*mt*t*(p2.y-p1.y) + 3*t*t*(p3.y-p2.y)
  };
}
// یک پیکان کوچک روی خط میدان، هم‌جهت با جریان مغناطیسی (از قطب N به سمت S)
function drawFieldArrow(ctx, x, y, angle, color){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-5, -3.5);
  ctx.lineTo(5, 0);
  ctx.lineTo(-5, 3.5);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawMagnetFrame(){
  if(magnetW === 0) return;
  mgctx.clearRect(0,0,magnetW,magnetH);
  const B = magnetFieldStrength();
  const { northX, southX, y:poleY } = magnetPoles();
  const flow = magnetPowerOn && B > 0;

  // --- خط‌های میدان بیرونی: مسیرهای دوقطبیِ واقعی که هم به بالا/پایین و هم به بیرونِ نوک قطب‌ها پهن می‌شوند ---
  // بهینه‌سازی کارایی: قبلاً هر خط با shadowBlur رسم می‌شد (هر stroke با سایه یعنی یک
  // پاس بلور جداگانه برای مرورگر — گران‌ترین بخش این کانواس). این‌جا به‌جای سایه‌ی واقعی
  // یک «هاله»ی ارزان با یک stroke پهن و کم‌رنگ زیر خط اصلی شبیه‌سازی می‌شود، و تعداد خط‌ها
  // هم کاهش پیدا کرده — نتیجه تقریباً همان ظاهر قبلی ولی چند برابر سبک‌تر برای رندر.
  if(flow){
    const nLoops = Math.min(4, 2 + Math.round(B/2.4));
    const dirOut = Math.sign(northX - southX) || 1;
    mgctx.lineJoin = 'round';
    for(let i=1;i<=nLoops;i++){
      const spread = i/nLoops;
      const apexUp   = magnetCoreR + 14 + spread*spread*(magnetCY - 18);
      const apexDown = magnetCoreR + 14 + spread*spread*(magnetH - magnetCY - 18);
      const bow = magnetCoreHalf*0.25 + spread*(magnetW*0.5 - magnetCoreHalf - 10)*0.95;
      const dash = 9; const offset = -(magnetPulseT*55) % (dash*2);
      mgctx.setLineDash([dash, dash*0.7]);
      mgctx.lineDashOffset = offset;
      [[-1,apexUp],[1,apexDown]].forEach(([sign,apex])=>{
        const p0 = {x:northX, y:poleY};
        const p1 = {x:northX + dirOut*bow, y:poleY + sign*apex*0.9};
        const p2 = {x:southX - dirOut*bow, y:poleY + sign*apex*0.9};
        const p3 = {x:southX, y:poleY};
        mgctx.beginPath();
        mgctx.moveTo(p0.x, p0.y);
        mgctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        // هاله‌ی ارزان به‌جای shadowBlur: همان مسیر با خط پهن‌تر و کم‌رنگ‌تر زیرِ خط اصلی
        mgctx.strokeStyle = 'rgba(201,163,255,.10)';
        mgctx.lineWidth = 4.5;
        mgctx.stroke();
        mgctx.strokeStyle = `rgba(201,163,255,${0.28 + 0.1*i})`;
        mgctx.lineWidth = 1.6;
        mgctx.stroke();
        // فلش جهت میدان (از قطب شمال به سمت قطب جنوب) روی هر خط
        mgctx.setLineDash([]);
        const t = 0.5;
        const pt = bezierPointAt(p0,p1,p2,p3,t);
        const tan = bezierTangentAt(p0,p1,p2,p3,t);
        const ang = Math.atan2(tan.y, tan.x);
        drawFieldArrow(mgctx, pt.x, pt.y, ang, `rgba(201,163,255,${0.6 + 0.08*i})`);
        mgctx.setLineDash([dash, dash*0.7]);
        mgctx.lineDashOffset = offset;
      });
    }
    mgctx.setLineDash([]);

    // --- خط‌های داخلی موازی و متراکم (میدان یکنواخت داخل سیم‌پیچ) ---
    const innerLines = 4;
    const dir = Math.sign(northX - southX) || 1;
    for(let i=0;i<innerLines;i++){
      const fy = magnetCY - magnetCoreR*0.8 + (i/(innerLines-1))*magnetCoreR*1.6;
      mgctx.beginPath();
      mgctx.moveTo(southX+8, fy);
      mgctx.lineTo(northX-8, fy);
      mgctx.strokeStyle = 'rgba(212,175,55,.28)';
      mgctx.lineWidth = 3.5;
      mgctx.stroke();
      mgctx.strokeStyle = 'rgba(212,175,55,.75)';
      mgctx.lineWidth = 1.3;
      mgctx.stroke();
      const ax = magnetCX, ay = fy;
      mgctx.beginPath();
      mgctx.moveTo(ax-6*dir, ay-4); mgctx.lineTo(ax+6*dir, ay); mgctx.lineTo(ax-6*dir, ay+4);
      mgctx.strokeStyle = 'rgba(212,175,55,.85)'; mgctx.lineWidth = 1.2; mgctx.stroke();
    }
  }

  // --- هسته‌ی آهنی ---
  const coreGrad = mgctx.createLinearGradient(0, magnetCY-magnetCoreR, 0, magnetCY+magnetCoreR);
  coreGrad.addColorStop(0, '#6b7280'); coreGrad.addColorStop(.5, '#9aa3b0'); coreGrad.addColorStop(1, '#565f6b');
  mgctx.fillStyle = coreGrad;
  roundRectPath(mgctx, magnetCX-magnetCoreHalf, magnetCY-magnetCoreR, magnetCoreHalf*2, magnetCoreR*2, magnetCoreR*0.6);
  mgctx.fill();

  // --- حلقه‌های سیم‌پیچ دور هسته ---
  const nCoils = Math.max(6, Math.min(10, Math.round(magnetTurnsRange.value/32)));
  const coilStep = nCoils > 1 ? (magnetCoilHalf*2)/(nCoils-1) : 0;
  mgctx.lineWidth = 2.4;
  mgctx.strokeStyle = flow ? '#e79a54' : '#8b6a4a';
  for(let i=0;i<nCoils;i++){
    const cx = magnetCX - magnetCoilHalf + i*coilStep;
    mgctx.beginPath();
    mgctx.ellipse(cx, magnetCY, magnetCoreR*0.5, magnetCoreR*1.5, 0, 0, Math.PI*2);
    mgctx.stroke();
  }

  // --- نوک قطب‌ها ---
  [[northX,'N','#e8574e'], [southX,'S','#3f7fe0']].forEach(([px,label,color])=>{
    mgctx.beginPath();
    mgctx.arc(px, poleY, magnetCoreR*0.95, 0, Math.PI*2);
    mgctx.fillStyle = flow ? color : '#4b5566';
    mgctx.shadowColor = color; mgctx.shadowBlur = flow ? 13 : 0;
    mgctx.fill();
    mgctx.shadowBlur = 0;
    mgctx.fillStyle = '#0b0e14';
    mgctx.font = '700 13px Vazirmatn, sans-serif';
    mgctx.textAlign = 'center'; mgctx.textBaseline = 'middle';
    mgctx.fillText(label, px, poleY+1);
  });

  // --- شیء در حال کشیدن‌شدن: جسم آهنیِ در حال جذب‌شدن ---
  if(magnetDrag.active){
    if(magnetDrag.magnetic && magnetDrag.attracting){
      const ox = magnetDrag.dispX !== undefined ? magnetDrag.dispX : magnetDrag.x;
      const oy = magnetDrag.dispY !== undefined ? magnetDrag.dispY : magnetDrag.y;
      mgctx.beginPath();
      mgctx.moveTo(ox, oy); mgctx.lineTo(magnetDrag.pullX, magnetDrag.pullY);
      mgctx.strokeStyle = 'rgba(231,154,84,.55)'; mgctx.lineWidth = 1.5;
      mgctx.setLineDash([4,4]); mgctx.stroke(); mgctx.setLineDash([]);
    }
  }
}

function positionMagnetGhost(ghost, clientX, clientY){
  ghost.style.left = clientX + 'px';
  ghost.style.top = clientY + 'px';
}
// یک قطب‌نمای واقعیِ دست‌ساز (نه ایموجی): محفظه‌ی تیره + خط‌های درجه‌بندی + عقربه‌ی
// قرمز(شمال)/آبی(جنوب) که بعداً با چرخاندن گروه .ghost-needle روی جهتِ واقعیِ میدان می‌نشیند
function compassSVGMarkup(){
  return `<svg viewBox="0 0 40 40" width="34" height="34" style="display:block;overflow:visible;">
    <circle cx="20" cy="20" r="17" fill="rgba(20,25,36,.92)" stroke="#3a4558" stroke-width="2"/>
    <g stroke="#3a4558" stroke-width="1.4">
      <line x1="20" y1="4" x2="20" y2="8"/>
      <line x1="20" y1="32" x2="20" y2="36"/>
      <line x1="4" y1="20" x2="8" y2="20"/>
      <line x1="32" y1="20" x2="36" y2="20"/>
    </g>
    <g class="ghost-needle" style="transform-origin:20px 20px;">
      <polygon points="20,20 15,20 20,6 25,20" fill="#e8574e"/>
      <polygon points="20,20 15,20 20,34 25,20" fill="#3f7fe0"/>
    </g>
    <circle cx="20" cy="20" r="2.6" fill="#0b0e14" stroke="#5b6472" stroke-width="1.2"/>
  </svg>`;
}
Array.from(magnetObjectsEl.querySelectorAll('.tesla-obj')).forEach(el => {
  let ghost = null;
  function endDrag(){
    if(ghost){ ghost.remove(); ghost = null; }
    magnetDrag.active = false;
    magnetDrag.attracting = false;
    magnetDrag.dispX = undefined;
    magnetDrag.dispY = undefined;
    magnetActiveGhost = null;
    magnetNote.textContent = magnetPowerOn ? MAGNET_NOTE_DEFAULT : MAGNET_NOTE_OFF;
  }
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    ghost = document.createElement('div');
    const isCompass = el.dataset.compass === 'true';
    ghost.className = 'tesla-drag-ghost' + (isCompass ? ' compass-ghost' : '');
    if(isCompass){ ghost.innerHTML = compassSVGMarkup(); }
    else { ghost.textContent = el.dataset.emoji; }
    document.body.appendChild(ghost);
    positionMagnetGhost(ghost, e.clientX, e.clientY);
    magnetDrag.active = true;
    magnetDrag.magnetic = el.dataset.magnetic === 'true';
    magnetDrag.compass = isCompass;
    magnetDrag.label = el.dataset.label;
    magnetActiveGhost = ghost;
    const rect = magnetCanvas.getBoundingClientRect();
    magnetDrag.x = e.clientX - rect.left;
    magnetDrag.y = e.clientY - rect.top;
    magnetDrag.dispX = magnetDrag.x;
    magnetDrag.dispY = magnetDrag.y;
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
  });
  el.addEventListener('pointermove', (e) => {
    if(!ghost) return;
    // موقعیت نهاییِ ghost را stepMagnet/drawMagnetFrame تعیین می‌کند (تا وقتی جذب می‌شود واقعاً به‌سمت قطب کشیده شود)
    const rect = magnetCanvas.getBoundingClientRect();
    magnetDrag.x = e.clientX - rect.left;
    magnetDrag.y = e.clientY - rect.top;
  });
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
});
/* ========================================================================
   VIEWPORT VISIBILITY
   Five heavy canvas simulations live in the lab tab. Previously all five
   ran their physics step + redraw every single frame as soon as the lab
   tab was open, even for cards scrolled far off-screen — that's the main
   reason the page felt unoptimized. Now each card only animates while it's
   actually visible in the viewport.
   ======================================================================== */
const labCardVisible = { ohm:false, cap:false, scope:false, tesla:false, magnet:false };
if(window.IntersectionObserver){
  const labVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      labCardVisible[entry.target.dataset.labKey] = entry.isIntersecting;
    });
  }, { root:null, rootMargin:'200px 0px', threshold:0 });
  [['ohm',ohmCanvas], ['cap',capCanvas], ['scope',scopeCanvas], ['tesla',teslaCanvas], ['magnet',magnetCanvas]]
    .forEach(([key, el]) => { el.dataset.labKey = key; labVisibilityObserver.observe(el); });
} else {
  // No IntersectionObserver support (very old browser) — fall back to
  // always-on so nothing breaks, just without the extra savings.
  Object.keys(labCardVisible).forEach(k => labCardVisible[k] = true);
}

/* ========================================================================
   LAB MASTER LOOP
   ======================================================================== */
let lastLabTs = 0;
function labLoop(ts){
  requestAnimationFrame(labLoop);
  if(!labTab.classList.contains('active')) { lastLabTs = ts; return; }
  const dt = lastLabTs ? Math.min((ts-lastLabTs)/1000, 0.05) : 0.016;
  lastLabTs = ts;
  if(labCardVisible.ohm){ stepOhm(dt); drawOhmFrame(); }
  if(labCardVisible.cap){ updateCapState(); drawCapFrame(); capStateVal.textContent = capStatusText(); }
  if(labCardVisible.scope){ stepScope(dt); drawScopeFrame(); }
  if(labCardVisible.tesla){ stepTesla(dt); drawTeslaFrame(); }
  if(labCardVisible.magnet){ stepMagnet(dt); drawMagnetFrame(); }
}
requestAnimationFrame(labLoop);

updateOhmReadouts();
updateCapReadouts();
updateScopeReadouts();
resizeTeslaCanvas();
updateMagnetReadouts();
resizeMagnetCanvas();
window.addEventListener('resize', () => {
  if(labTab.classList.contains('active')){ resizeOhmCanvas(); resizeCapCanvas(); resizeScopeCanvas(); resizeTeslaCanvas(); resizeMagnetCanvas(); }
});
// Also watch the canvases directly: on mobile, switching tabs, rotating the
// device, or the browser chrome resizing doesn't always fire 'resize'.
if(window.ResizeObserver){
  const labCanvasObserver = new ResizeObserver(() => {
    if(!labTab.classList.contains('active')) return;
    requestAnimationFrame(() => { resizeOhmCanvas(); resizeCapCanvas(); resizeScopeCanvas(); resizeTeslaCanvas(); resizeMagnetCanvas(); });
  });
  labCanvasObserver.observe(ohmCanvas);
  labCanvasObserver.observe(capCanvas);
  labCanvasObserver.observe(scopeCanvas);
  labCanvasObserver.observe(teslaCanvas);
  labCanvasObserver.observe(magnetCanvas);
}
