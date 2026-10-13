/* ========================================================================
   COMMON.JS — مسیر شوالیه‌ی مدار
   موتور صدا (SFX)، موسیقی پس‌زمینه، و جابه‌جایی بین تب‌ها.
   این فایل باید قبل از quest.js و lab.js بارگذاری شود؛ هر دو بخش
   به توابع/آبجکت‌های همین فایل (SFX, switchTab) وابسته‌اند.
   ======================================================================== */

/* ================= SFX ENGINE (Web Audio, no assets) ================= */
let actx = null;
function getAudioCtx(){
  if(!actx){ actx = new (window.AudioContext || window.webkitAudioContext)(); }
  if(actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, start, dur, type='sine', gainPeak=.18, glideTo=null){
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if(glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + start + dur);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, ctx.currentTime + start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.02);
}
/* ================= ANALYTICS (Umami) ================= */
function track(event, props){
  try{ if (window.umami) umami.track(event, props||{}); }catch(e){}
}

const SFX = {
  hover(){ try{ tone(720, 0, .05, 'sine', .05); }catch(e){} },
  click(){ try{ tone(480, 0, .07, 'triangle', .12, 620); }catch(e){} },
  locked(){ try{ tone(180, 0, .12, 'square', .09, 110); tone(140, .09, .14, 'square', .08, 90); }catch(e){} },
  open(){ try{ tone(400, 0, .06, 'sine', .08, 700); }catch(e){} },
  complete(){
    try{
      tone(523.25, 0,    .12, 'triangle', .15); // C5
      tone(659.25, .09,  .12, 'triangle', .15); // E5
      tone(783.99, .18,  .16, 'triangle', .16); // G5
      tone(1046.5, .30,  .22, 'sine',     .14); // C6 sparkle
    }catch(e){}
  },
  boss(){
    try{
      tone(261.6, 0,   .18, 'sawtooth', .12);
      tone(329.6, .12, .18, 'sawtooth', .12);
      tone(392.0, .24, .18, 'sawtooth', .12);
      tone(523.3, .36, .30, 'triangle', .16);
      tone(659.3, .50, .40, 'sine',     .14);
    }catch(e){}
  },
  burn(){
    try{
      tone(220, 0,   .05, 'sawtooth', .2, 60);
      tone(90,  .04, .14, 'square',   .14, 35);
    }catch(e){}
  },
  spark(){
    try{
      tone(1500 + Math.random()*400, 0,   .035, 'sawtooth', .11, 550);
      tone(2400,                     .015,.02,  'square',   .05, 900);
    }catch(e){}
  },
  // Rising "click-open" arpeggio + shimmer, played when a locked lab card
  // opens up (see runPendingLabUnlocks in quest.js).
  unlock(){
    try{
      tone(392.0,  0,   .10, 'triangle', .12, 523.25); // G4 -> C5
      tone(659.25, .10, .12, 'triangle', .13);         // E5
      tone(987.77, .22, .18, 'sine',     .12);         // B5
      tone(1318.5, .34, .26, 'sine',     .10);         // E6 sparkle
    }catch(e){}
  }
};

/* ================= BACKGROUND MUSIC ================= */
const bgMusicEl = document.getElementById('bgMusic');
bgMusicEl.volume = 0.5;
bgMusicEl.muted = false;

const MUSIC = (() => {
  let unlocked = false;

  function attemptPlay(){
    if(unlocked) return;
    const p = bgMusicEl.play();
    if(p && p.catch){
      p.catch(() => {
        // still blocked (e.g. this particular gesture type wasn't accepted by
        // the phone's browser) — keep listening, the next tap will retry.
      });
    }
  }

  // Only stop retrying once playback has actually, truly started — never
  // assume a single attempt worked. On many mobile browsers the FIRST
  // interaction (e.g. pointerdown) can still be rejected even though it looks
  // like a valid user gesture; if we stopped listening right after that one
  // attempt (as before), the user would be stuck with silent music forever.
  bgMusicEl.addEventListener('playing', () => {
    unlocked = true;
    firstGestureEvents.forEach(ev => window.removeEventListener(ev, onFirstGesture));
  });

  // Try to autoplay immediately (works in some browsers/PWAs); most will block it silently.
  attemptPlay();
  // Every one of these counts as a real user gesture on phones — keep trying
  // on each of them (not just the first) until MUSIC is confirmed playing.
  const firstGestureEvents = ['pointerdown','touchstart','keydown','click'];
  function onFirstGesture(){
    attemptPlay();
  }
  firstGestureEvents.forEach(ev => window.addEventListener(ev, onFirstGesture, { passive:true }));
})();



/* ========================================================================
   TAB SWITCHING
   ======================================================================== */
const tabQuestBtn = document.getElementById('tabQuestBtn');
const tabLabBtn = document.getElementById('tabLabBtn');
const questTab = document.getElementById('questTab');
const labTab = document.getElementById('labTab');
questTab.classList.add('active');

// Whole Lab tab starts locked; quest.js flips this to false once the
// first mission is completed (see updateLabTabLock in quest.js).
let labTabLocked = true;

function switchTab(which){
  const toLab = which === 'lab';
  // Neither the knight's speech banner (#knightSection) nor the mission-detail
  // modal (#overlay, opened by onNodeClick in quest.js) know that a tab switch
  // just happened — each only closes via its own dedicated close button/tap.
  // Close both here first, so nothing from the Quest tab is left floating on
  // screen once we're on the Lab tab.
  if(typeof hideKnightLine === 'function') hideKnightLine();
  if(typeof closeOverlay === 'function') closeOverlay();
  tabQuestBtn.classList.toggle('active', !toLab);
  tabLabBtn.classList.toggle('active', toLab);
  questTab.classList.toggle('active', !toLab);
  labTab.classList.toggle('active', toLab);
  SFX.click();
  track('tab_switched', { tab: toLab ? 'lab' : 'quest' });
  if(toLab){
    requestAnimationFrame(() => { resizeOhmCanvas(); resizeCapCanvas(); resizeTeslaCanvas(); });
    // First-ever visit to the Lab tab gets a one-time intro dialog (see
    // maybeShowLabIntro in quest.js) — it no-ops on every visit after that.
    if(typeof maybeShowLabIntro === 'function') maybeShowLabIntro();
    // A lab card may have unlocked while the person was still on the Quest tab;
    // its scroll-to + fade-out-lock animation is played now that it's visible.
    if(typeof runPendingLabUnlocks === 'function') setTimeout(runPendingLabUnlocks, 450);
  } else {
    requestAnimationFrame(drawPath);
  }
}
tabQuestBtn.addEventListener('click', () => switchTab('quest'));
tabLabBtn.addEventListener('click', () => {
  if(labTabLocked){ SFX.locked(); return; }
  switchTab('lab');
});

/* ========================================================================
   CANVAS HELPERS
   ======================================================================== */
function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function sampleRectPath(x0,y0,x1,y1,n){
  const w = x1-x0, h = y1-y0;
  const perim = 2*(w+h);
  const pts = [];
  for(let i=0;i<n;i++){
    let d = (i/n)*perim;
    if(d < w) pts.push([x0+d, y0]);
    else if(d < w+h) pts.push([x1, y0+(d-w)]);
    else if(d < 2*w+h) pts.push([x1-(d-w-h), y1]);
    else pts.push([x0, y1-(d-2*w-h)]);
  }
  return pts;
}
