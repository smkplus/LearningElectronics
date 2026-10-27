/* ========================================================================
   QUEST.JS — مسیر شوالیه‌ی مدار (موتور اصلی)
   پیشرفت/XP، کانفتی، رسم مسیر، مودال و تکمیل مأموریت.
   داده‌ی مأموریت‌ها و شبیه‌سازها در فایل‌های جدا:
     quest-electronics.js
     quest-arduino.js
     quest-stm32.js
     quest-robotics.js
   به common.js (SFX) و dialogue.js نیاز دارد.
   ======================================================================== */

/* ================= حالت تست (فقط روی لوکال) =================
   صفحه را روی localhost / 127.0.0.1 / file:// با ‎?test=1‎ باز کن
   (مثلاً index.html?test=1) تا همه‌ی مأموریت‌ها، کارت‌ها و تبِ آزمایشگاه باز باشند.
   پیشرفتِ ذخیره‌شده دست نمی‌خورد، و روی سایتِ اصلی (دامنه‌ی واقعی) هیچ اثری ندارد. */
const TEST_MODE = (() => {
  try{
    const h = location.hostname;
    const isLocal = location.protocol === 'file:' || h === '' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    return isLocal && new URLSearchParams(location.search).get('test') === '1';
  }catch(e){ return false; }
})();

/* داده‌ی مأموریت‌ها از فایل‌های جدا لود می‌شود:
   quest-circuit.js     → QUESTS_CIRCUIT
   quest-electronics.js → QUESTS_ELECTRONICS
   quest-arduino.js     → QUESTS_ARDUINO
   quest-stm32.js       → QUESTS_STM32
   quest-robotics.js    → QUESTS_ROBOTICS
   ترتیب قفل‌شدن همان ترتیب این آرایه است. */
const QUESTS = [
  ...QUESTS_ELECTRONICS,
  ...QUESTS_ARDUINO,
  ...QUESTS_STM32,
  ...QUESTS_CIRCUIT,
  ...QUESTS_ROBOTICS
];

const QUEST_GROUPS = [
  { id: 'electronics', icon: '🔋', title: 'الکترونیک' },
  { id: 'arduino',  icon: '⚡', title: 'آردوینو' },
  { id: 'stm32',    icon: '🔵', title: 'STM32' },
  { id: 'circuit', icon: '🔌', title: 'طراحی مدار' },
  { id: 'robotics', icon: '🤖', title: 'رباتیک' }
];
(function assignQuestGroups(){
  let g = 'electronics';
  QUESTS.forEach(q => {
    if(q.id === 'schematic_intro') g = 'circuit';
    else if(q.id === 'hello') g = 'arduino';
    else if(q.id === 'stm32_cube') g = 'stm32';
    else if(q.id === 'line_intro') g = 'robotics';
    q.group = g;
  });
})();
const QUEST_GROUP_KEY = 'shovalie-madar-quest-group-v1';
let activeGroup = null;
function saveActiveGroup(){ try{ localStorage.setItem(QUEST_GROUP_KEY, activeGroup); }catch(e){} }

/* مأموریت‌های بیشتر با حمایت بیشتر باز می‌شوند */
const LOCKED_TEASER = {
  count: 6,
  title: 'مأموریت‌های بیشتر در راه است',
desc: 'با حمایت از سازنده، مراحل بعدیِ مسیر شامل پروژه‌های رباتیک بیشتر، ماژول ها و قطعات جدید، قسمت های جدید آزمایشگاه) باز می‌شوند.'
};


/* Runs fn at most once per animation frame, no matter how many times it's
   called in between — mobile browsers fire 'resize' repeatedly while the
   URL bar hides/shows during scroll, and without this, every one of those
   events was forcing a full re-measure of every quest node. */
function rafThrottle(fn){
  let scheduled = false;
  return function(...args){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; fn.apply(this, args); });
  };
}

/* ================= CONFETTI ENGINE ================= */
const confettiCanvas = document.getElementById('confettiCanvas');
const cctx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiRAF = null;
const CONFETTI_COLORS = ['#57d8a3','#d4af37','#c97c3d','#e79a54','#e8e2d0','#4FBF8B'];

function resizeConfettiCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', rafThrottle(resizeConfettiCanvas));
resizeConfettiCanvas();
// ادیتورِ تمام‌صفحه (arduino-sim.js) خودش فرزندِ مستقیمِ body است؛ برای این‌که
// پارتیکل و فلشِ جشن بالای آن دیده شوند، این دو هم باید فرزندِ مستقیمِ body
// باشند (z-indexشان در quest.css برایِ حالتِ تمام‌صفحه بالا می‌رود).
[confettiCanvas, document.getElementById('flashOverlay')].forEach((el) => {
  if(el && el.parentElement !== document.body) document.body.appendChild(el);
});

function confettiBurst(xRatio = .5, yRatio = .35, count = 90, big = false){
  const cx = xRatio * confettiCanvas.width;
  const cy = yRatio * confettiCanvas.height;
  for(let i=0;i<count;i++){
    const angle = Math.random() * Math.PI * 2;
    const speed = (big ? 6 : 4) + Math.random() * (big ? 8 : 6);
    confettiParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (big ? 3 : 1.5),
      size: (big ? 6 : 4) + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - .5) * .3,
      life: 1,
      decay: 0.006 + Math.random() * 0.008,
      shape: Math.random() > .5 ? 'rect' : 'circle'
    });
  }
  if(!confettiRAF) confettiRAF = requestAnimationFrame(confettiLoop);
}

function confettiLoop(){
  cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach(p => {
    p.vy += 0.13; // gravity
    p.vx *= 0.992;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vrot;
    p.life -= p.decay;
  });
  confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < confettiCanvas.height + 40);
  confettiParticles.forEach(p => {
    cctx.save();
    cctx.globalAlpha = Math.max(p.life, 0);
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillStyle = p.color;
    if(p.shape === 'rect'){
      cctx.fillRect(-p.size/2, -p.size/2.5, p.size, p.size/1.6);
    } else {
      cctx.beginPath();
      cctx.arc(0,0, p.size/2, 0, Math.PI*2);
      cctx.fill();
    }
    cctx.restore();
  });
  if(confettiParticles.length > 0){
    confettiRAF = requestAnimationFrame(confettiLoop);
  } else {
    confettiRAF = null;
    cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  }
}

function screenFlash(){
  const el = document.getElementById('flashOverlay');
  el.classList.remove('active');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('active');
}

function ripple(btn, evt){
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.2;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = size + 'px';
  const x = (evt && evt.clientX ? evt.clientX - rect.left : rect.width/2) - size/2;
  const y = (evt && evt.clientY ? evt.clientY - rect.top : rect.height/2) - size/2;
  r.style.left = x + 'px'; r.style.top = y + 'px';
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

function animateCount(el, from, to, dur = 550, suffix = ''){
  const start = performance.now();
  function step(now){
    const t = Math.min((now - start)/dur, 1);
    const eased = 1 - Math.pow(1-t, 3);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = toFa(val) + suffix;
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

let progress = {}; // id -> true/false
QUESTS.forEach(q => progress[q.id] = false);

/* ================= PROGRESS PERSISTENCE (local + cloud) ================= */
const PROGRESS_STORAGE_KEY = 'shovalie-madar-progress-v1';

function loadLocalProgress(){
  try{
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if(!raw) return;
    const saved = JSON.parse(raw);
    QUESTS.forEach(q => { if(saved[q.id]) progress[q.id] = true; });
  }catch(e){ /* localStorage unavailable (private mode etc.) — silently ignore */ }
}
loadLocalProgress();

function saveProgress(){
  try{ localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); }catch(e){}
  // If sync.js loaded and a Google account is signed in, this pushes the
  // same progress up to the cloud (Firestore). No-op if not signed in.
  if(window.cloudSaveProgress) window.cloudSaveProgress(progress);
}

// Exposed so sync.js can read/merge without knowing quest.js internals.
window.getQuestProgress = () => progress;
window.applyCloudProgress = (cloudProgress) => {
  if(!cloudProgress) return false;
  let changed = false;
  QUESTS.forEach(q => {
    if(cloudProgress[q.id] && !progress[q.id]){ progress[q.id] = true; changed = true; }
  });
  if(changed){
    try{ localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); }catch(e){}
    render();
  }
  return changed;
};

function isLocked(index){
  if(TEST_MODE || index === 0 || progress[QUESTS[index].id]) return false;
  // اولین مأموریتِ هر بخش (طراحی مدار / الکترونیک / آردوینو / STM32 / رباتیک) از اول باز است
  if(QUESTS[index].group !== QUESTS[index-1].group) return false;
  return !progress[QUESTS[index-1].id];
}
function totalXP(){ return QUESTS.reduce((s,q)=>s+q.xp,0); }
function earnedXP(){ return QUESTS.reduce((s,q)=>s+(progress[q.id]?q.xp:0),0); }
function completedCount(){ return QUESTS.filter(q=>progress[q.id]).length; }

const container = document.getElementById('nodesContainer');
// موتور باننر گفتگو (شوالیه/ولتاژ) به dialogue.js منتقل شد —
// knightLine / knightSection / knightImg / CHARACTERS / setKnightMood /
// showKnightLine / hideKnightLine همگی از آنجا در دسترس‌اند (dialogue.js
// قبل از این فایل لود می‌شود).

// The intro line already sitting in the HTML is shown once the welcome
// popup has been dismissed (see closeWelcome() below), not immediately on
// page load, so it doesn't compete with the welcome modal for attention.
const knightIntroText = knightLine.textContent.trim();

const KNIGHT_LOCKED = [
  '🔒 این راه هنوز برایت بسته است. اول مأموریت پیش از آن را کامل کن.',
  '🔒 این ماموریت قفله. برای ادامه، ابتدا مأموریت قبلی را تکمیل کن.',
  '🚧 مسیر مسدوده. ابتدا باید ماموریت قبل را با موفقیت پشت سر بگذاری.'
];
const KNIGHT_AVAILABLE_TOASTS = [
  '✅ خوب بود، شاگرد. راه بعدی روشن شد.',
  '📈 مهارتت رشد کرد. آماده‌ی چالش بعدی هستی؟',
  '⚡ مدار درونت قوی‌تر شد. ادامه بده!'
];

/* ================= LAB UNLOCKS (based on mission progress) ================= */
const labCards = Array.from(document.querySelectorAll('.lab-card[data-unlock]'));
labCards.forEach(card => {
  const overlay = document.createElement('div');
  overlay.className = 'lab-lock-overlay';
  overlay.innerHTML = `
    <div class="lab-lock-badge">🔒</div>
    <div class="lab-lock-title">این بخش هنوز قفل است</div>
    <div class="lab-lock-sub"></div>
    <button class="lab-lock-cta">رفتن به مسیر مأموریت</button>
  `;
  card.appendChild(overlay);
  overlay.querySelector('.lab-lock-cta').addEventListener('click', () => {
    SFX.click();
    switchTab('quest');
  });
});

function updateLabLocks(){
  const done = completedCount();
  labCards.forEach(card => {
    const need = parseInt(card.dataset.unlock, 10) || 0;
    const locked = TEST_MODE ? false : done < need;
    // A card that was locked a moment ago and isn't anymore just got unlocked
    // by the mission the person completed — queue it up for the celebration
    // animation (see runPendingLabUnlocks). Skipped on the very first render,
    // where "was locked" simply means "we hadn't drawn the locks yet".
    if(labLocksInitialized && card.classList.contains('locked') && !locked
       && pendingLabUnlocks.indexOf(card) === -1){
      pendingLabUnlocks.push(card);
    }
    // Queued cards deliberately KEEP their .locked state (still blurred, lock
    // overlay still up) until the animation actually plays — otherwise the
    // person would see the card already open before the lock breaks.
    const stillShowLocked = locked || pendingLabUnlocks.indexOf(card) !== -1;
    card.classList.toggle('locked', stillShowLocked);
    if(locked){
      const remaining = need - done;
      card.querySelector('.lab-lock-sub').textContent =
        `با تکمیل ${toFa(remaining)} مأموریت دیگر باز می‌شود (${toFa(done)} از ${toFa(need)})`;
    }
  });
  labLocksInitialized = true;
  // If the person happens to be standing in the Lab already, play it right away;
  // otherwise it waits until they switch to the Lab tab (see switchTab).
  runPendingLabUnlocks();
}

/* ---- unlock animation: scroll to the freshly opened card, fade its lock away ----
   Cards can unlock while the person is on the Quest tab (right after finishing a
   mission), so the animation is queued and only played once the Lab tab is
   actually visible — otherwise they'd never see it. */
let labLocksInitialized = false;
const pendingLabUnlocks = [];
let labUnlockPlaying = false;

function runPendingLabUnlocks(){
  if(labUnlockPlaying || labTabLocked) return;
  if(!pendingLabUnlocks.length) return;
  if(!labTab.classList.contains('active')) return; // wait for the Lab tab

  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const card = pendingLabUnlocks.shift();
  labUnlockPlaying = true;

  try{
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }catch(e){ card.scrollIntoView(); }

  // Long enough for the smooth scroll to land AND for the still-locked card to
  // register visually, so the lock is clearly seen breaking open afterwards.
  const scrollMs = reduceMotion ? 60 : 900;
  setTimeout(() => {
    card.classList.add('unlocking');
    card.classList.remove('locked'); // the .unlocking rules keep the lock on screen while it fades
    SFX.unlock();
    track('lab_card_unlock_animated', { unlock: card.dataset.unlock });
    setTimeout(() => {
      card.classList.remove('unlocking');
      labUnlockPlaying = false;
      runPendingLabUnlocks(); // chain, in case several cards opened at once
    }, reduceMotion ? 120 : 1100);
  }, scrollMs);
}
window.runPendingLabUnlocks = runPendingLabUnlocks;

/* ================= LAB TAB LOCK (whole section, not just one card) =================
   The entire "آزمایشگاه" tab stays locked until the very first mission is
   completed. Two separate one-time dialogs exist here:
     1) labUnlockOverlay — shown right after finishing the unlocking mission,
        celebrating that the tab just opened, with a "go to lab" button.
     2) labIntroOverlay — shown the first time the person actually opens the
        Lab tab (whether they clicked the button above or the tab itself),
        explaining what's inside.
   Both reuse the .overlay/.modal styling from the mission modal, so no HTML
   changes are needed. */
const LAB_TAB_UNLOCK_MISSIONS = 1;
const LAB_UNLOCK_SEEN_KEY = 'shovalie-madar-lab-unlock-seen';
const LAB_INTRO_SEEN_KEY = 'shovalie-madar-lab-intro-seen';

/* ---- 1) unlock celebration popup, shown right after the unlocking mission ---- */
let labUnlockOverlay = null;
function buildLabUnlockOverlay(){
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'labUnlockOverlay';
  ov.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" aria-label="بستن">✕</button>
      <div class="modal-eyebrow">🔓 قابلیت جدید باز شد</div>
      <div class="modal-title">آزمایشگاه الکترونیک باز شد!</div>
      <div class="modal-desc">
        آفرین! حالا بخش «آزمایشگاه» برایت باز شده. اینجا می‌تونی با شبیه‌سازهای
        تعاملی — قانون اهم، خازن، اسیلوسکوپ، سیم‌پیچ و آهنربا — دست به دستگاه
        ببری و مفاهیم مدار رو با چشم خودت زنده ببینی.
      </div>
      <button type="button" class="complete-btn" id="labUnlockGoBtn">🔬 برو به آزمایشگاه</button>
    </div>
  `;
  document.body.appendChild(ov);
  ov.querySelector('.modal-close').addEventListener('click', () => { SFX.hover(); closeLabUnlockOverlay(); });
  ov.addEventListener('click', (e) => { if(e.target === ov) closeLabUnlockOverlay(); });
  ov.querySelector('#labUnlockGoBtn').addEventListener('click', () => {
    SFX.click();
    closeLabUnlockOverlay();
    switchTab('lab'); // this in turn triggers maybeShowLabIntro() below, first time only
  });
  return ov;
}
function openLabUnlockOverlay(){
  if(!labUnlockOverlay) labUnlockOverlay = buildLabUnlockOverlay();
  labUnlockOverlay.classList.add('open');
  labUnlockOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  track('lab_unlock_shown', {});
}
function closeLabUnlockOverlay(){
  if(!labUnlockOverlay) return;
  labUnlockOverlay.classList.remove('open');
  labUnlockOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

/* ---- 2) explanatory dialogue box, shown the first time the tab is actually opened ----
   Uses the same knight speech-banner (#knightSection, showKnightLine) as the
   rest of the game — not a popup — since knight-section was moved out of
   #questTab in the HTML so it can be reused on the Lab tab too. */
const LAB_INTRO_TEXT = 'به آزمایشگاه الکترونیک خوش اومدی! 🔬 با شبیه‌سازها تمرین کن و با تکمیل مأموریت‌ها، قفل بخش‌های جدید رو باز کن! ⚡';
// Shown right after the knight's line above finishes typing — Voltage
// introduces itself as the lab's own guide (see maybeShowLabIntro below).
const VOLTAGE_INTRO_TEXT = 'سلام! من ولتاژ هستم ⚡ از این به بعد تو آزمایشگاه کنارتم و کمکت می‌کنم مفهوم‌ها رو با چشم خودت حس کنی.';

function updateLabTabLock(){
  const done = completedCount();
  const unlocked = TEST_MODE || done >= LAB_TAB_UNLOCK_MISSIONS;
  tabLabBtn.classList.toggle('locked', !unlocked);
  labTabLocked = !unlocked; // global flag from common.js, read by tabLabBtn's click handler

  if(unlocked && !TEST_MODE){
    let alreadySeen = false;
    try{ alreadySeen = localStorage.getItem(LAB_UNLOCK_SEEN_KEY) === '1'; }catch(e){}
    if(!alreadySeen){
      try{ localStorage.setItem(LAB_UNLOCK_SEEN_KEY, '1'); }catch(e){}
      // Wait for the mission-complete celebration (confetti/flash/modal-close)
      // to settle down first, so this doesn't compete for attention.
      setTimeout(openLabUnlockOverlay, 2000);
    }
  }
}

// Called from switchTab() in common.js, every time the person actually
// switches into the Lab tab. Shows the intro dialog only the very first
// time that happens (guarded by its own localStorage key) — independent of
// the unlock popup above, so it fires whether they got there via that
// popup's button or by tapping the tab directly.
function maybeShowLabIntro(){
  if(labTabLocked) return;
  let alreadySeen = false;
  try{ alreadySeen = localStorage.getItem(LAB_INTRO_SEEN_KEY) === '1'; }catch(e){}
  if(alreadySeen) return;
  try{ localStorage.setItem(LAB_INTRO_SEEN_KEY, '1'); }catch(e){}
  track('lab_intro_shown', {});
  showKnightLine(LAB_INTRO_TEXT, 'happy'); // unchanged knight line, unchanged character
  // Once the knight's line is done typing (16ms/char, see showKnightLine)
  // plus a moment to read it, Voltage introduces itself right after.
  const typingMs = LAB_INTRO_TEXT.length * 16;
  setTimeout(() => showKnightLine(VOLTAGE_INTRO_TEXT, 'happy', 'voltage'), typingMs + 1800);
}
window.maybeShowLabIntro = maybeShowLabIntro;

/* ================= VOLTAGE PRAISE / WARNING (Ohm's-law voltage slider) =================
   Called from lab.js whenever the person drags the voltage slider up.
   Kept here so it reuses the same speech banner / typewriter as everything
   else, and so lab.js doesn't need to know about CHARACTERS/showKnightLine
   internals. */
const VOLTAGE_PRAISE_LINES = [
  '⚡ آفرین! ولتاژ رو زیاد کردی — جریان هم باهاش بیشتر میشه.',
  '🔋 همینه! هرچی ولتاژ بیشتر بشه، الکترون‌ها تندتر می‌دوند.',
  '🎓 آفرین، شاگرد برق! داری قانون اهم رو با دست خودت حس می‌کنی.'
];
function voltagePraise(){
  const line = VOLTAGE_PRAISE_LINES[Math.floor(Math.random() * VOLTAGE_PRAISE_LINES.length)];
  showKnightLine(line, 'approve', 'voltage');
}
window.voltagePraise = voltagePraise;

// Warning line when the voltage climbs very high — even a resistor can't
// always save the LED at that point. Takes priority over the praise line
// above (see lab.js), since it's the more important thing to notice.
const VOLTAGE_WARN_TEXT = '⚠️ مواظب باش! اگه ولتاژ خیلی زیاد بشه، حتی مقاومت هم نمی‌تونه جلوی سوختن LED رو بگیره.';
function voltageWarnHigh(){
  showKnightLine(VOLTAGE_WARN_TEXT, 'stern', 'voltage');
}
window.voltageWarnHigh = voltageWarnHigh;

// Apology line when the person fiddles with the voltage while the LED for
// the current mode is already burned out — nudges them to fix the voltage
// and actually replace the LED before it'll do anything.
const VOLTAGE_BURNED_TEXT = '🔥 متأسفم! من وقتی قوی بشم ممکنه LED رو بسوزونم. دوباره تلاش کن: مقدار ولتاژ رو درست تنظیم کن و LED سوخته رو عوض کن.';
let lastBurnApologyAt = 0;
function voltageApologizeBurned(){
  const now = performance.now();
  if(now - lastBurnApologyAt < 1500) return; // avoid back-to-back duplicate (burn-moment call + slider "change" call)
  lastBurnApologyAt = now;
  showKnightLine(VOLTAGE_BURNED_TEXT, 'stern', 'voltage');
}
window.voltageApologizeBurned = voltageApologizeBurned;

// Praise line for when the person replaces the burned LED and gets back to
// work — the recovery moment after the apology above.
const VOLTAGE_REPLACE_PRAISE_LINES = [
  '💡 آفرین! LED رو عوض کردی — این‌بار با احتیاط بیشتر ولتاژ و مقاومت رو تنظیم کن.',
  '✨ همینه! یه LED نو گذاشتی. یادت باشه: ولتاژ بالا با مقاومت کم، دوباره می‌سوزوندش.',
  '🙌 دمت گرم! دوباره سرِ کار برگشتیم. این‌بار قبل از زیاد کردن ولتاژ، به مقاومت هم فکر کن.'
];
function voltageReplacePraise(){
  const line = VOLTAGE_REPLACE_PRAISE_LINES[Math.floor(Math.random() * VOLTAGE_REPLACE_PRAISE_LINES.length)];
  showKnightLine(line, 'approve', 'voltage');
}
window.voltageReplacePraise = voltageReplacePraise;

// Master Ohm's own explanation for when the LED burns specifically because
// the person removed the resistors or turned them down too far — a
// different cause than "voltage got too high" (Voltage's line above), so
// the knight character explains this one, since resistance is his domain.
const RESISTOR_BURNED_TEXT = '🧯 متأسفم! کار مقاومت اینه که جلوی جریان زیاد رو بگیره، ولی وقتی برش داشتی یا خیلی کمش کردی، دیگه نتونست جلوی سوختن LED رو بگیره. دوباره تلاش کن: یه مقاومت مناسب انتخاب کن و LED سوخته رو عوض کن.';
let lastResistorApologyAt = 0;
function resistorApologizeBurned(){
  const now = performance.now();
  if(now - lastResistorApologyAt < 1500) return;
  lastResistorApologyAt = now;
  showKnightLine(RESISTOR_BURNED_TEXT, 'powered', 'knight');
}
window.resistorApologizeBurned = resistorApologizeBurned;

const questTabEl = document.getElementById('questTab');
const groupBar = document.createElement('div');
groupBar.id = 'questGroups';
groupBar.className = 'qg-bar';
groupBar.setAttribute('role', 'tablist');
questTabEl.insertBefore(groupBar, document.getElementById('pathWrap'));
groupBar.addEventListener('click', (e) => {
  const b = e.target.closest('.qg-tab'); if(!b || b.dataset.g === activeGroup) return;
  SFX.click();
  activeGroup = b.dataset.g; saveActiveGroup(); render();
});
function pickInitialGroup(){
  let g = null;
  try{ g = localStorage.getItem(QUEST_GROUP_KEY); }catch(e){}
  if(QUEST_GROUPS.some(x => x.id === g)) return g;
  const firstOpen = QUESTS.find(q => !progress[q.id]);
  return firstOpen ? firstOpen.group : QUEST_GROUPS[0].id;
}
function paintGroupBar(){
  groupBar.innerHTML = QUEST_GROUPS.map(gr => {
    const all = QUESTS.filter(q => q.group === gr.id), done = all.filter(q => progress[q.id]).length;
    const on = gr.id === activeGroup;
    return `<button type="button" class="qg-tab${on ? ' on' : ''}${done === all.length ? ' full' : ''}" role="tab" aria-selected="${on}" data-g="${gr.id}"><span class="qg-ic" aria-hidden="true">${gr.icon}</span><span class="qg-t">${gr.title}</span><small class="qg-n">${toFa(done)}/${toFa(all.length)}</small></button>`;
  }).join('');
}

function render(){
  if(!activeGroup) activeGroup = pickInitialGroup();
  paintGroupBar();
  container.innerHTML = '';
  const visible = QUESTS.map((q, i) => ({ q, i })).filter(x => x.q.group === activeGroup);
  visible.forEach(({ q, i }, pos) => {
    const locked = isLocked(i);
    const done = progress[q.id];
    if(q.section){
      const sec = document.createElement('div');
      sec.className = 'section-divider' + (locked ? ' locked' : '');
      sec.innerHTML = `<span class="sd-icon">${q.section.icon}</span><div><div class="sd-title">${q.section.title}</div><div class="sd-sub">${q.section.sub}</div></div>`;
      container.appendChild(sec);
    }
    const row = document.createElement('div');
    row.className = 'node-row ' + (pos % 2 === 0 ? 'right' : 'left');

    const node = document.createElement('div');
    node.className = 'node ' + (done ? 'done' : locked ? 'locked' : 'available') + (q.boss ? ' boss-node' : '');
    node.innerHTML = `
      <div class="node-icon">${locked ? '🔒' : q.icon}</div>
      <div class="node-info">
        <div class="node-title">${q.title}</div>
        <div class="node-sub">${q.sub}</div>
      </div>
      <div class="node-status">
        <span class="status-pill">${done ? 'انجام شد' : locked ? 'قفل' : 'آماده'}</span>
      </div>
    `;
    node.addEventListener('click', (evt) => onNodeClick(i, locked, evt));
    if(!locked){
      node.addEventListener('mouseenter', () => SFX.hover());
    }
    row.appendChild(node);
    container.appendChild(row);
  });

  if(activeGroup === QUEST_GROUPS[QUEST_GROUPS.length - 1].id){
  const teaserRow = document.createElement('div');
  teaserRow.className = 'node-row ' + (visible.length % 2 === 0 ? 'right' : 'left');
  const teaserNode = document.createElement('div');
  teaserNode.className = 'node locked teaser-node';
  teaserNode.innerHTML = `
    <div class="node-icon">🔒</div>
    <div class="node-info">
      <div class="node-title">${LOCKED_TEASER.title}</div>
      <div class="node-sub">${LOCKED_TEASER.desc}</div>
    </div>
    <div class="node-status">
      <span class="status-pill">+${toFa(LOCKED_TEASER.count)} مأموریت</span>
    </div>
  `;
  teaserRow.appendChild(teaserNode);
  container.appendChild(teaserRow);
  }

  updateHUD();
  drawPath();
  updateLabLocks();
  updateLabTabLock();
}

let lastEarned = 0, lastLevel = 0;
function updateHUD(){
  const earned = earnedXP(), total = totalXP();
  const pct = Math.round((earned/total)*100);
  const xpFill = document.getElementById('xpFill');
  document.getElementById('xpText').textContent = `${toFa(earned)} / ${toFa(total)} XP`;
  document.getElementById('pctText').textContent = toFa(pct) + '%';
  xpFill.style.width = pct + '%';
  if(earned > lastEarned){
    xpFill.classList.remove('filling'); void xpFill.offsetWidth; xpFill.classList.add('filling');
  }
  const level = Math.min(completedCount(), QUESTS.length);
  const levelEl = document.getElementById('levelNum');
  if(level !== lastLevel){
    animateCount(levelEl, lastLevel, level, 400);
    const badge = document.querySelector('.level-badge');
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
  } else {
    levelEl.textContent = toFa(level);
  }
  lastEarned = earned; lastLevel = level;
}

function toFa(n){
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function drawPath(){
  const svg = document.getElementById('pathSvg');
  const wrap = document.getElementById('pathWrap');
  const nodes = Array.from(container.querySelectorAll('.node'));
  if(nodes.length < 2){ document.getElementById('traceBg').setAttribute('d', ''); document.getElementById('traceFg').setAttribute('d', ''); return; }
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('width', wrapRect.width);
  svg.setAttribute('height', wrapRect.height);
  svg.setAttribute('viewBox', `0 0 ${wrapRect.width} ${wrapRect.height}`);

  let d = '';
  const pts = nodes.map(n => {
    const r = n.getBoundingClientRect();
    const x = (r.left + r.right)/2 - wrapRect.left;
    const y = (r.top + r.bottom)/2 - wrapRect.top;
    return {x,y};
  });
  d = `M ${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length;i++){
    const prev = pts[i-1], cur = pts[i];
    const midY = (prev.y + cur.y)/2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }
  const bg = document.getElementById('traceBg');
  const fg = document.getElementById('traceFg');
  bg.setAttribute('d', d);
  fg.setAttribute('d', d);
  const len = fg.getTotalLength();
  fg.style.strokeDasharray = len;
  const groupQs = QUESTS.filter(q => q.group === activeGroup);
  const doneRatio = groupQs.filter(q => progress[q.id]).length / (groupQs.length - 1 || 1);
  fg.style.strokeDashoffset = len * (1 - Math.min(doneRatio, 1));
}

let currentIndex = null;
const overlay = document.getElementById('overlay');


/* ================= MISSION SIM REGISTRY =================
   هر مأموریتی که این‌جا لیست شود، به‌جای دکمه‌ی دستی «تکمیل کردم»،
   با نوشتن/اجرای درست کد یا شرط شبیه‌ساز کامل می‌شود.
   توابع mount* از quest-sims-*.js و cube-block.js / hal-code-editor.js می‌آیند. */
const SIM_MISSIONS = {
  hello:  { task: 'serial', pin: 8 },
  led:    { task: 'ledOn',  pin: 8 },
  blink:  { task: 'blink',  pin: 8 },
  button: { task: 'button', pin: 8, buttonPin: 2 },
  pot:    { task: 'pot',    pin: 9, potPin: 'A0' },
  servo:  { task: 'servo',  pin: 9 },
  stm32_blink: { task: 'stm32blink', pin: 'PC13' }
};
const modalSim = document.getElementById('modalSim');
const nextMissionBtn = document.getElementById('nextMissionBtn');
let activeSim = null;

const READ_ONLY_SIMS = { schematic_intro: mountSchematicIntroSim, footprint_intro: mountFootprintIntroSim };
const READ_ONLY_MISSIONS = new Set(Object.keys(READ_ONLY_SIMS));

const CONCEPT_SIMS = {
  // الکترونیک — quest-sims-electronics.js
  led_circuit: mountLedCircuitMission,
  switch_lamp: mountSwitchLampMission,
  traffic_light: mountTrafficLightMission,
  volt_current: mountVoltCurrentSim,
  resistor_calc: mountResistorCalcSim,
  led_diode: mountLedDiodeSim,
  capacitor: mountCapacitorSim,
  transistor: mountTransistorSim,
  voltage_regulator: mountVoltageRegulatorSim,
  shift_register: mountShiftRegisterSim,
  // رباتیک — quest-sims-robotics.js
  line_intro: mountLineIntroSim,
  robot_assemble: mountRobotAssembleSim,
  line_sensor: mountLineSensorMission,
  line_logic: mountLineLogicMission,
  line_follow: mountLineFollowSim,
  // STM32 — quest-sims-stm32.js + cube-block.js / hal-code-editor.js
  stm32_cube: mountStm32CubeSim,
  stm32_stlink: mountStlinkSim,
  line_read: mountHalReadSim,
  line_motors: mountHalMotorSim,
  motor_pwm: mountHalPwmSim
};

const FIRST_MISSION_INTRO_TEXT = '📖 این مأموریت اختیاریه! می‌تونی توضیحات بالا رو مطالعه کنی و با اسلایدر امتحانش کنی، یا اگه دوست نداری همین‌جوری همون دکمه‌ی «مطالعه کردم ✓» رو بزن تا مأموریت تکمیل بشه و بری سراغ مأموریت بعدی.';
const RESISTOR_CALC_INTRO_TEXT = '🎨 نوارهای رنگی مقاومت رو با منوی کشویی پایین عوض کن تا عدد روی صفحه دقیقاً ۲۲۰ Ω رو نشون بده — همین‌که بهش رسیدی، مأموریت خودکار تکمیل می‌شه!';
const HELLO_MISSION_INTRO_TEXT = '📝 تو این ماموریت باید متن Hello World رو با کد چاپ کنی. اگه برنامه‌نویسی بلد نیستی نگران نباش  از حالت بلوکی استفاده کن و بلوک های متن و سریال رو کنار هم بچین.';

/* راهنمای داخل ادیتور: کدها بین {{ }} نوشته می‌شوند. متن با همان افکت تایپِ بنر می‌آید و هر بار که بنر
   یک حرف اضافه می‌کند، همان لحظه نسخه‌ی رنگیِ همان مقدار متن جایگزین می‌شود. */
const LINE_INTRO_TEXT = '🤖 به بخش رباتیک خوش اومدی! اول بخون ربات تعقیب خط چیه و چطور کار می‌کنه، بعد ببین یه ربات کامل چطور روی چند مسیر خط رو می‌ره. دو مسیر رو تا 🏁 برسون تا مأموریت تکمیل بشه.';
const ROBOT_ASSEMBLE_INTRO_TEXT = '🛠️ حالا که چشم ربات رو شناختی، وقت ساختنه! قبل از اینکه ربات راه بیفته، باید خودت بدنه‌ش رو سر هم کنی. هر قطعه رو بگیر و بنداز روی جایگاه خط‌چینِ خودش؛ آخرش هم روشنش کن!';
const STLINK_INTRO_TEXT = '🔌 برد Blue Pill برخلاف آردوینو خودش مبدل USB به سریال و بوت‌لودر نداره، واسه همین برای ریختن برنامه یه «برنامه‌ریز» به اسم ST-Link لازمه. چهار تا سیم رو وصل کن: 3.3V، GND، SWDIO و SWCLK. مواظب ۵ ولت هم باش، چیپ رو می‌سوزونه!';
const LINE_SENSOR_INTRO_TEXT = '🤖 ربات تعقیب خط اول از همه یه «چشم» می‌خواد: سنسور مادون‌قرمز. اول بخش توضیحی رو ببین تا بفهمی IR چیه و چرا با چشم فرق داره؛ بعد سنسور رو روی مسیر بکش و آستانه رو جوری تنظیم کن که روی سفید LED خاموش و روی خط مشکی روشن بشه.';

const LINE_LOGIC_INTRO_TEXT = '🧠 مغزِ ربات یه فهرست قانونه! اول با ربات متحرک ببین هر قانون چی کار می‌کنه: «شروع» رو بزن و قانون‌های چپ و راست رو روشن کن. بعدش پایین‌تر مثل STM32CubeIDE اول پایه‌ها رو تو CubeMX تنظیم کن و بعد همین قانون‌ها رو با if و else if کد بزن؛ ربات دقیقاً کدِ تو رو اجرا می‌کنه.';

const CIRCUIT_INTRO_TEXT = {
  schematic_intro: '📐 قبل از بستن مدار باید زبان نقشه‌ی مدار را بدانی! مدار را در دو حالت «عکس واقعی» و «شماتیک» ببین و بخوان هر نماد چه قطعه‌ای است. بعد «مطالعه کردم ✓» را بزن.',
  footprint_intro: '🧩 شماتیک فقط اتصال‌ها را می‌گوید؛ فوت‌پرینت جای پایه‌های قطعه روی برد است. هر قطعه را انتخاب کن و فوت‌پرینتش را ببین. بعد «مطالعه کردم ✓» را بزن.',
  led_circuit: '🔌 اولین مدارت رو خودت می‌بندی! از فهرست کنار صفحه کانکتور باتری، مقاومت و LED قرمز رو بردار، روی صفحه بذار و با ابزار «سیم‌کشی» بهم وصل‌شون کن. حواست باشه: LED بدون مقاومت می‌سوزه و آندش باید سمت مثبت باشه! گیر کردی؟ «گزینه‌ها ← نمایش پاسخ».',
  switch_lamp: '💡 یک کلید بین مقاومت و LED بگذار و مدار را ببند. کلید اول باز است؛ روی آن دوبار بزن تا ببندد و چراغ روشن شود. گیر کردی؟ «گزینه‌ها ← نمایش پاسخ».',
  traffic_light: '🚦 سه تا LED، سه تا مقاومت، یک کانکتور باتری! هر سه مدار از همون دو سیم کانکتور تغذیه می‌شن.'
};
const HAL_INTRO_TEXT = {
  line_read: '📟 حالا خودِ STM32 باید سنسور را بخواند! اول در مرحله‌ی ۱ روی نقشه‌ی چیپ بگو PA0 ورودی است و PC13 خروجی؛ بعد در مرحله‌ی ۲ با HAL_GPIO_ReadPin بخوان و LED را کنترل کن.',
  line_motors: '⚙️ موتورها با دو پایه‌ی جهت کنترل می‌شوند. اول چهار پایه‌ی PB0 و PB1 و PB10 و PB11 را خروجی کن، بعد حرکت‌ها را با WritePin و HAL_Delay بنویس.',
  motor_pwm: '🎚️ جهت را داری؛ حالا سرعت. پایه‌های PA8 و PA9 را تایمر کن، PWM را قبل از حلقه روشن کن و با __HAL_TIM_SET_COMPARE سرعت بده.'
};

const EDITOR_GUIDE = {
  hello:  (c) => 'اینجا باید دو کار بکنی: ۱) در {{setup()}} با {{Serial.begin(9600)}} ارتباط سریال را باز کن. ۲) با {{Serial.println("Hello World")}} پیام را چاپ کن. بعدش «اجرا کن» را بزن. در حالت بلوکی هم همین دو کار را با بلوک‌های سریال انجام بده.',
  led:    (c) => `برای روشن‌شدن LED در {{setup()}} پین ${c.pin} را با {{pinMode(${c.pin}, OUTPUT)}} خروجی کن و بعد با {{digitalWrite(${c.pin}, HIGH)}} روشنش کن. بعدش «اجرا کن» را بزن.`,
  blink:  (c) => `پین ${c.pin} را در {{setup()}} خروجی کن. در {{loop()}} این چهار خط را پشت‌سرهم بنویس: {{digitalWrite(${c.pin}, HIGH)}} ← {{delay(500)}} ← {{digitalWrite(${c.pin}, LOW)}} ← {{delay(500)}}. بعد اجرا کن.`,
  button: (c) => `در {{setup()}} پین ${c.buttonPin} را {{INPUT_PULLUP}} و پین ${c.pin} را {{OUTPUT}} کن. در {{loop()}} اگر {{digitalRead(${c.buttonPin}) == LOW}} بود (دکمه فشرده است) پین ${c.pin} را {{HIGH}} کن، وگرنه {{LOW}}. بعد اجرا کن و دکمه را فشار بده.`,
  pot:    (c) => `در {{loop()}} مقدار ولوم را با {{analogRead(${c.potPin})}} بخوان، با {{map(v, 0, 1023, 0, 255)}} به بازه‌ی PWM ببر و با {{analogWrite(${c.pin}, ...)}} به LED بده. اجرا کن و ولوم را بچرخان.`,
  stm32_blink: () => 'داخل {{main()}} بعد از راه‌اندازی‌ها، در حلقه‌ی {{while (1)}} این دو خط را بنویس: {{HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13)}} و بعد {{HAL_Delay(500)}}. روی Blue Pill مقدار صفر یعنی LED روشن. بعد «اجرا کن» را بزن.',
  servo:  (c) => `اول {{#include <Servo.h>}} و یک شیء {{Servo}} بساز، بعد در {{setup()}} با {{attach(${c.pin})}} وصلش کن. با یک حلقه‌ی {{for}} زاویه را از ۰ تا ۱۸۰ ببر و در هر مرحله {{servo.write(angle)}} و {{delay(15)}} بگذار. بعد اجرا کن.`
};

function cutHtml(h, k){
  let out = '', open = 0, i = 0;
  while(i < h.length && k > 0){
    if(h[i] === '<'){
      const j = h.indexOf('>', i);
      open += h[i+1] === '/' ? -1 : 1;
      out += h.slice(i, j+1); i = j + 1;
    } else if(h[i] === '&'){
      const j = h.indexOf(';', i);
      out += h.slice(i, j+1); i = j + 1; k--;
    } else { out += h[i++]; k--; }
  }
  return out + '</span>'.repeat(Math.max(open, 0));
}

/* کدِ داخل بک‌تیک در مرحله‌ها: ایزوله، LTR و با رنگ‌بندیِ ادیتور */
function stepHtml(s){
  if(typeof ArduinoSim === 'undefined' || !ArduinoSim.highlightArduino) return s.replace(/`/g, '');
  return s.split('`').map((p, i) => i % 2 ? `<code class="step-code">${ArduinoSim.highlightArduino(p)}</code>` : p).join('');
}

function showEditorGuide(tpl){
  const parts = tpl.split(/\{\{(.+?)\}\}/g);
  const colored = parts.map((p, i) => i % 2 ? ArduinoSim.highlightArduino(p) : p);
  const plain = parts.map((p, i) => i % 2 ? '\u2066' + p + '\u2069' : p).join('');
  const bare = parts.join('');
  const strip = (s) => s.replace(/[\u2066\u2069]/g, '');
  const htmlFor = (k) => {
    let out = '';
    for(let i = 0; i < parts.length && k > 0; i++){
      const take = Math.min(k, parts[i].length);
      k -= take;
      out += i % 2 ? `<code class="knight-code">${cutHtml(colored[i], take)}</code>` : parts[i].slice(0, take);
    }
    return out;
  };
  // Reopening the editor (or tapping the bubble mid-typing) must not leave the previous
  // guide's observer alive: two live observers rewrite each other's output forever and freeze the page.
  if(showEditorGuide.stop) showEditorGuide.stop();
  const opts = { childList: true, characterData: true, subtree: true };
  const stop = setTimeout(() => obs.disconnect(), 60000);
  const obs = new MutationObserver(() => {
    const cur = strip(knightLine.textContent);
    if(!cur || !bare.startsWith(cur)) return;
    obs.disconnect();
    knightLine.innerHTML = htmlFor(cur.length);
    if(cur.length < bare.length) obs.observe(knightLine, opts); else clearTimeout(stop);
  });
  obs.observe(knightLine, opts);
  showEditorGuide.stop = () => { clearTimeout(stop); obs.disconnect(); };
  showKnightLine(plain, 'happy', 'knight');
}

// Show the guide only when the editor goes from closed to open, not on every unrelated body class change.
let editorWasOpen = false, editorGuideTimer = null;
new MutationObserver(() => {
  const open = document.body.classList.contains('sim-fullscreen-lock');
  const justOpened = open && !editorWasOpen;
  editorWasOpen = open;
  if(!justOpened || currentIndex === null) return;
  const q = QUESTS[currentIndex];
  const guide = q && !progress[q.id] && EDITOR_GUIDE[q.id];
  if(!guide) return;
  clearTimeout(editorGuideTimer);
  editorGuideTimer = setTimeout(() => {
    if(document.body.classList.contains('sim-fullscreen-lock')) showEditorGuide(guide(SIM_MISSIONS[q.id]));
  }, 350);
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

function onNodeClick(i, locked, evt){
  const nodeEl = evt && evt.currentTarget;
  if(!locked && QUESTS[i].group !== activeGroup){ activeGroup = QUESTS[i].group; saveActiveGroup(); render(); }
  hideKnightLine();
  if(locked){
    SFX.locked();
    track('mission_locked_attempt', { id: QUESTS[i].id });
    if(nodeEl){
      nodeEl.classList.remove('shake'); void nodeEl.offsetWidth; nodeEl.classList.add('shake');
    }
    showKnightLine(KNIGHT_LOCKED[Math.floor(Math.random()*KNIGHT_LOCKED.length)], 'stern');
    return;
  }
  SFX.open();
  currentIndex = i;
  const q = QUESTS[i];
  track('mission_opened', { id: q.id, title: q.title, already_done: !!progress[q.id] });
  document.getElementById('modalEyebrow').textContent = (q.boss ? '🏆 نبرد آخر' : '🎯 مأموریت') ;
  document.getElementById('modalTitle').textContent = q.title;
  document.getElementById('modalQuote').textContent = q.quote;
  document.getElementById('modalDesc').textContent = q.desc;
  const stepsEl = document.getElementById('modalSteps');
  stepsEl.innerHTML = '';
  q.steps.forEach((s, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="num mono">${idx+1}</span><span>${stepHtml(s)}</span>`;
    stepsEl.appendChild(li);
  });
  document.getElementById('modalReward').textContent = `✨ +${toFa(q.xp)} XP`;
  const btn = document.getElementById('completeBtn');
  const done = progress[q.id];

  if(activeSim){ activeSim.stop(); activeSim = null; }
  nextMissionBtn.style.display = 'none';

  // مأموریت اول (ولتاژ-جریان-مقاومت) اختیاریه؛ هر بار که باز می‌شود و هنوز
  // تکمیل نشده، یادآوری می‌کنیم که می‌شود آن را با «مطالعه کردم ✓» هم رد کرد.
  if(q.id === 'volt_current' && !done){
    setTimeout(() => showKnightLine(FIRST_MISSION_INTRO_TEXT, 'happy'), 400);
  }

  // مأموریت محاسبه‌ی مقاومت: هر بار که باز می‌شود و هنوز تکمیل نشده،
  // یادآوری می‌کنیم که هدف رسیدن به دقیقاً ۲۲۰ اهم با تغییر نوارهای رنگی است.
  if(q.id === 'resistor_calc' && !done){
    setTimeout(() => showKnightLine(RESISTOR_CALC_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  // مأموریت چاپ Hello World: هر بار که باز می‌شود و هنوز تکمیل نشده،
  // یادآوری می‌کنیم که باید متن را چاپ کند و اگر کدنویسی بلد نیست از حالت بلوکی استفاده کند.
  if(q.id === 'hello' && !done){
    setTimeout(() => showKnightLine(HELLO_MISSION_INTRO_TEXT, 'happy'), 400);
  }

  if(q.id === 'line_intro' && !done){
    setTimeout(() => showKnightLine(LINE_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(q.id === 'robot_assemble' && !done){
    setTimeout(() => showKnightLine(ROBOT_ASSEMBLE_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(q.id === 'stm32_stlink' && !done){
    setTimeout(() => showKnightLine(STLINK_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(q.id === 'line_sensor' && !done){
    setTimeout(() => showKnightLine(LINE_SENSOR_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(q.id === 'line_logic' && !done){
    setTimeout(() => showKnightLine(LINE_LOGIC_INTRO_TEXT, 'happy', 'knight'), 400);
  }

  if(CIRCUIT_INTRO_TEXT[q.id] && !done){
    setTimeout(() => showKnightLine(CIRCUIT_INTRO_TEXT[q.id], 'happy', 'knight'), 400);
  }

  if(HAL_INTRO_TEXT[q.id] && !done){
    setTimeout(() => showKnightLine(HAL_INTRO_TEXT[q.id], 'happy', 'knight'), 400);
  }

  const simCfg = SIM_MISSIONS[q.id];
  const conceptMount = CONCEPT_SIMS[q.id];
  if(simCfg){
    // این مأموریت‌ها به‌صورت خودکار توسط شبیه‌ساز (با نوشتن کد درست) تکمیل می‌شوند، نه با کلیک دستی.
    btn.style.display = 'none';
    modalSim.style.display = '';
    modalSim.closest('.modal').classList.add('has-sim');

    let pwmDemo = null;
    let pullDemo = null;
    let arduinoMountEl = modalSim;
    if(q.id === 'pot'){
      // مأموریت پتانسیومتر یک بخش توضیحی/تعاملی اضافه دارد: شبیه‌ساز PWM
      // که duty cycle را روی یک اسیلوسکوپ نشان می‌دهد، پیش از شبیه‌ساز کد آردوینو.
      modalSim.innerHTML = `
        <div id="pwmConceptMount"></div>
        <div id="arduinoSimMount" style="margin-top:14px;"></div>
      `;
      pwmDemo = mountPwmScopeSim(modalSim.querySelector('#pwmConceptMount'));
      arduinoMountEl = modalSim.querySelector('#arduinoSimMount');
    } else if(q.id === 'button'){
      // مأموریت دکمه یک بخش توضیحی/تعاملی اضافه دارد: شبیه‌ساز pull-up/pull-down
      // که نشان می‌دهد پین ورودی در هر حالت به‌طور پیش‌فرض چه مقداری می‌خواند،
      // پیش از شبیه‌ساز کد آردوینو.
      modalSim.innerHTML = `
        <div id="pullConceptMount"></div>
        <div id="arduinoSimMount" style="margin-top:14px;"></div>
      `;
      pullDemo = mountPullResistorSim(modalSim.querySelector('#pullConceptMount'));
      arduinoMountEl = modalSim.querySelector('#arduinoSimMount');
    }

    const arduinoSim = ArduinoSim.mount(arduinoMountEl, {
      missionId: q.id,
      task: simCfg.task,
      pin: simCfg.pin,
      buttonPin: simCfg.buttonPin,
      potPin: simCfg.potPin,
      alreadyDone: done,
      onSuccess: () => {
        completeMission(q, { closeOverlayAfter: null });
        nextMissionBtn.style.display = '';
        nextMissionBtn.textContent = (i + 1 < QUESTS.length) ? 'مأموریت بعدی ⟶' : 'دیدن مسیر';
      }
    });
    activeSim = {
      stop(){ pwmDemo && pwmDemo.stop(); pullDemo && pullDemo.stop(); arduinoSim.stop(); }
    };

    if(done && i + 1 < QUESTS.length){
      nextMissionBtn.style.display = '';
      nextMissionBtn.textContent = 'مأموریت بعدی ⟶';
    }
  } else if(conceptMount){
    // مأموریت‌های مفهومی (فیزیک) هم مثل شبیه‌ساز آردوینو با رسیدن به شرط موفقیت خودکار کامل می‌شوند.
    btn.style.display = 'none';
    modalSim.style.display = '';
    modalSim.closest('.modal').classList.add('has-sim');
    activeSim = conceptMount(modalSim, {
      alreadyDone: done,
      onSuccess: () => {
        completeMission(q, { closeOverlayAfter: null });
        nextMissionBtn.style.display = '';
        nextMissionBtn.textContent = (i + 1 < QUESTS.length) ? 'مأموریت بعدی ⟶' : 'دیدن مسیر';
      }
    });
    if(done && i + 1 < QUESTS.length){
      nextMissionBtn.style.display = '';
      nextMissionBtn.textContent = 'مأموریت بعدی ⟶';
    }
  } else if(READ_ONLY_MISSIONS.has(q.id)){
    modalSim.style.display = '';
    modalSim.closest('.modal').classList.add('has-sim');
    document.querySelector('.modal .reward-row').style.display = '';
    activeSim = READ_ONLY_SIMS[q.id](modalSim, { alreadyDone: done });
    btn.style.display = '';
    btn.textContent = done ? 'قبلاً تکمیل شده ✓' : 'مطالعه کردم ✓';
    btn.disabled = done;
  } else {
    modalSim.style.display = 'none';
    modalSim.closest('.modal').classList.remove('has-sim');
    document.querySelector('.modal .reward-row').style.display = '';
    btn.style.display = '';
    btn.textContent = done ? 'قبلاً تکمیل شده ✓' : (READ_ONLY_MISSIONS.has(q.id) ? 'مطالعه کردم ✓' : 'مأموریت را تکمیل کردم');
    btn.disabled = done;
  }
  openOverlay();
}

function openOverlay(){
  overlay.classList.add('open');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // The modal keeps whatever scroll position the previously-opened mission was
  // left at, so a long mission followed by a short one would open mid-content.
  // Always start every mission panel from its very top.
  const modalEl = overlay.querySelector('.modal');
  overlay.scrollTop = 0;
  if(modalEl) modalEl.scrollTop = 0;
  requestAnimationFrame(() => {
    overlay.scrollTop = 0;
    if(modalEl) modalEl.scrollTop = 0;
  });
}
function closeOverlay(){
  overlay.classList.remove('open');
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  if(activeSim){ activeSim.stop(); }
}

// Shared by the manual "مأموریت را تکمیل کردم" button AND the mission-1
// simulator's auto-success callback. `closeOverlayAfter` lets the caller
// keep the modal open (e.g. so the learner can see the LED blinking and
// the success message before choosing to move on).
function completeMission(q, { closeOverlayAfter = 420 } = {}){
  if(progress[q.id]) return;

  progress[q.id] = true;
  saveProgress();

  track('mission_completed', { id: q.id, title: q.title, xp: q.xp, boss: !!q.boss });
  if (completedCount() === QUESTS.length){
    track('game_completed', { total_xp: totalXP() });
  }

  if(q.boss){
    SFX.boss();
    screenFlash();
    confettiBurst(.5, .3, 160, true);
    setTimeout(() => confettiBurst(.2, .4, 90, true), 150);
    setTimeout(() => confettiBurst(.8, .4, 90, true), 300);
  } else {
    SFX.complete();
    screenFlash();
    confettiBurst(.5, .25, 90, false);
  }

  showKnightLine(
    q.boss
      ? 'باورنکردنی است... تو دیگر شاگرد نیستی. تو خودت اکنون یک شوالیه‌ی مدار هستی. 🏆'
      : KNIGHT_AVAILABLE_TOASTS[Math.floor(Math.random()*KNIGHT_AVAILABLE_TOASTS.length)],
    q.boss ? 'powered' : 'wink'
  );

  render();
  // celebrate the freshly completed node in the path
  requestAnimationFrame(() => {
    const doneNode = Array.from(container.querySelectorAll('.node')).find(n =>
      n.querySelector('.node-title').textContent === q.title
    );
    if(doneNode){
      doneNode.classList.add('completing');
      const icon = doneNode.querySelector('.node-icon');
      icon.classList.add('burst');
      setTimeout(() => { doneNode.classList.remove('completing'); icon.classList.remove('burst'); }, 550);
    }
  });

  if(closeOverlayAfter !== null){
    setTimeout(() => closeOverlay(), closeOverlayAfter);
  }
}

document.getElementById('completeBtn').addEventListener('click', (evt) => {
  const q = QUESTS[currentIndex];
  if(progress[q.id]) return;
  ripple(evt.currentTarget, evt);
  completeMission(q);
});

nextMissionBtn.addEventListener('click', (evt) => {
  SFX.click();
  ripple(evt.currentTarget, evt);
  const nextIndex = currentIndex + 1;
  closeOverlay();
  if(nextIndex < QUESTS.length && !isLocked(nextIndex)){
    setTimeout(() => onNodeClick(nextIndex, false), 260);
  }
});

document.getElementById('closeModal').addEventListener('click', () => { SFX.hover(); closeOverlay(); });
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeOverlay(); });

// ResizeObserver catches every layout change that can move the nodes —
// window resize, orientation change, mobile address-bar collapse/expand,
// and font/webfont reflow — not just explicit window resizes.
window.addEventListener('resize', rafThrottle(drawPath));
if(window.ResizeObserver){
  const drawPathRaf = rafThrottle(drawPath);
  new ResizeObserver(drawPathRaf).observe(document.getElementById('pathWrap'));
}
render();

if(TEST_MODE){
  const badge = document.createElement('div');
  badge.className = 'test-badge';
  badge.textContent = '🧪 حالت تست — همه‌ی مراحل باز است';
  document.body.appendChild(badge);
  console.info('[quest] TEST_MODE: all missions and lab cards are unlocked');
}

/* ================= WELCOME POPUP ================= */
const welcomeOverlay = document.getElementById('welcomeOverlay');
function openWelcome(){
  welcomeOverlay.classList.add('open');
  welcomeOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  track('welcome_shown', {});
}
function closeWelcome(){
  welcomeOverlay.classList.remove('open');
  welcomeOverlay.style.display = 'none';
  document.body.style.overflow = '';
  // Bring in the knight's intro line right after the welcome popup goes
  // away, so it doesn't fight the modal for attention. Only the first time.
  if(!closeWelcome.introShown){
    closeWelcome.introShown = true;
    setTimeout(() => showKnightLine(knightIntroText, 'happy'), 350);
  }
}
document.getElementById('welcomeClose').addEventListener('click', () => { SFX.hover(); closeWelcome(); });
document.getElementById('welcomeStartBtn').addEventListener('click', (evt) => {
  ripple(evt.currentTarget, evt);
  SFX.click();
  closeWelcome();
});
welcomeOverlay.addEventListener('click', (e) => { if(e.target === welcomeOverlay) closeWelcome(); });
setTimeout(openWelcome, 300);
