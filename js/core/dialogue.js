/* ========================================================================
   DIALOGUE.JS — موتور باننر گفتگوی مشترک (شوالیه/ولتاژ)
   بانک گفتگوی بالای صفحه را مدیریت می‌کند: تعویض چهره؛ نمایش/مخفی کردن، 
   تایپ تایپیست. همزمان توسط هر دو تب (Quest و Lab) استفاده می‌شود، 
   پس قبل از quest.js و lab.js لود شود. محتوای دیالوگ‌ها (متن، زمانی 
   نمایش هر خط) همچنان در quest.js می‌ماند و اینجا فقط صدازننده.
   ======================================================================== */

const knightLine = document.getElementById('knightLine');
const knightSection = document.getElementById('knightSection');
const knightImg = document.getElementById('knightImg');

/* ================= SPEECH BANNER (top banner) =================
   Shared by two characters: the knight ("استاد اهم" — also speaks for
   Resistance, since Ohm's Law ties them together — used on both the Quest
   tab and for resistance-related lines in the Lab) and Voltage ("ولتاژ",
   Lab tab). Same DOM/CSS, just swaps the avatar image set and the displayed
   name based on who's speaking. */
const knightNameEl = document.querySelector('#knightSection .name');
const CHARACTERS = {
  knight: {
    name: 'استاد اهم',
    moods: {
      happy:   'assets/images/knight-happy.png',
      stern:   'assets/images/knight-stern.png',
      wink:    'assets/images/knight-wink.png',
      powered: 'assets/images/knight-powered.png'
    }
  },
  voltage: {
    name: 'ولتاژ',
    moods: {
      happy:   'assets/images/voltage-happy.png',
      stern:   'assets/images/voltage-stern.png',
      wink:    'assets/images/voltage-wink.png',
      powered: 'assets/images/voltage-powered.png',
      speedy:  'assets/images/voltage-speedy.png',
      approve: 'assets/images/voltage-approve.png'
    }
  }
};
// همهی عکس‌های صورتکی را از همین اول در کش مرورگر گرم می‌کنیم (پیش‌بارگیری)
// تا تعویض چهره وسط setKnightMood فقط تعویض src باشد (از کش مرورگر)، نه یک 
// درخواست شبکه جدید؛ بدون این کار، روی گوشی‌ها و نت‌های ضعیف، اولین باری که یک
// چهره جدید لازم می‌شد (مثلا اولین خط عصبانی)، تعویض یک‌دو فریم طول می‌کشد.
(function preloadPortraits(){
  const seen = new Set();
  Object.values(CHARACTERS).forEach(ch => {
    Object.values(ch.moods).forEach(src => {
      if(seen.has(src)) return;
      seen.add(src);
      const img = new Image();
      img.src = src;
    });
  });
})();

/* ================= TYPING SOUND (Undertale-style voice blips) =================
   Each character gets its own synthesized "voice": a short blip of a given
   waveform/pitch played on (most) typed characters, à la Undertale/Deltarune.
   Reuses the shared AudioContext (getAudioCtx) already set up in common.js —
   common.js loads before this file, so its SFX engine's context is reused
   here instead of spinning up a second, separate AudioContext. */

// Tweak these per character to taste — wave shape and base pitch are what
// make each voice feel distinct (triangle = softer/rounder, square = buzzier,
// sawtooth = harsher/edgier). "detune" adds a second slightly-offset voice
// for a fatter, punchier retro-game sound instead of a thin single beep.
const VOICE_PROFILES = {
  knight: {
    wave: 'triangle',
    baseFreq: 300,      // grounded "teacher" voice
    freqJitter: 35,
    duration: 0.055,
    volume: 0.24,        // brought back up a bit — 0.16 ended up too quiet
    detune: 10,           // cents between the two stacked oscillators
    filterFreq: 3200
  },
  voltage: {
    wave: 'square',       // buzzier/electric edge, without sawtooth's full harshness
    baseFreq: 420,         // a bit brighter — more "zappy"
    freqJitter: 45,
    duration: 0.045,
    volume: 0.14,
    detune: 20,             // wider stack = more shimmer/crackle, electric feel
    filterFreq: 3600        // opened up a bit so it's not muffled
  }
};

// Skip blips on whitespace/punctuation pauses so it doesn't sound like a
// constant drone — only "voiced" characters trigger a tone. Also only every
// other voiced character actually blips, so the sound is less rapid-fire
// (matches the classic Undertale "blip every couple letters" feel).
const SILENT_CHARS = /[\s.,!?؟،؛:؛…]/;
let voicedCharCount = 0;

function playTypeBlip(character, ch){
  if(SILENT_CHARS.test(ch)) return;
  voicedCharCount++;
  if(voicedCharCount % 3 !== 0) return; // only blip every 3rd letter — less chatter
  const ctx = getAudioCtx();
  if(!ctx) return;
  const profile = VOICE_PROFILES[character] || VOICE_PROFILES.knight;
  const now = ctx.currentTime;

  // Shared punch: a lowpass filter + master gain so the two stacked
  // oscillators below sound like one fat blip instead of two thin ones.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = profile.filterFreq;
  filter.Q.value = 1.2;

  const master = ctx.createGain();
  // Punchy attack (snap in fast) then quick decay — the "cool arcade blip"
  // shape, rather than a soft fade.
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(profile.volume, now + 0.004);
  master.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);

  filter.connect(master).connect(ctx.destination);

  const freq = profile.baseFreq + (Math.random() * 2 - 1) * profile.freqJitter;
  // Two detuned oscillators stacked together = fatter, richer tone.
  [-profile.detune, profile.detune].forEach(det => {
    const osc = ctx.createOscillator();
    osc.type = profile.wave;
    osc.frequency.value = freq;
    osc.detune.value = det;
    osc.connect(filter);
    osc.start(now);
    osc.stop(now + profile.duration);
  });
}

let knightTypeTimer = null;

function setKnightMood(mood, character){
  const ch = CHARACTERS[character] || CHARACTERS.knight;
  const src = ch.moods[mood] || ch.moods.happy;
  if(knightImg.getAttribute('src') !== src) knightImg.setAttribute('src', src);
  if(knightNameEl && knightNameEl.textContent !== ch.name) knightNameEl.textContent = ch.name;
}

// Slides the dialogue box down from the very top of the screen (above the
// HUD, so it's the first thing visible) and types the given line onto it,
// character by character. `character` picks which mascot is "speaking"
// (defaults to the knight, so every existing call site keeps working as-is).
function showKnightLine(text, mood = 'happy', character = 'knight'){
  setKnightMood(mood, character);
  knightSection.classList.add('show');

  const avatar = document.querySelector('.knight-avatar');
  avatar.classList.remove('talk'); void avatar.offsetWidth; avatar.classList.add('talk');

  if(knightTypeTimer) clearInterval(knightTypeTimer);
  knightLine.classList.remove('done');
  knightLine.textContent = '';
  voicedCharCount = 0;
  let i = 0;
  knightTypeTimer = setInterval(() => {
    i++;
    knightLine.textContent = text.slice(0, i);
    playTypeBlip(character, text[i - 1]);
    if(i >= text.length){
      clearInterval(knightTypeTimer);
      knightTypeTimer = null;
      knightLine.classList.add('done');
    }
  }, 16);
}

function hideKnightLine(){
  knightSection.classList.remove('show');
  // اگر دیالوگ وسط تایپ‌شدن بسته شود، تایمر تایپ باید همین‌جا متوقف شود؛
  // وگرنه همچنان هر حرف صدای شخصیت (playTypeBlip) را پخش می‌کند، با اینکه
  // خودِ باکس دیگر روی صفحه دیده نمی‌شود.
  if(knightTypeTimer){
    clearInterval(knightTypeTimer);
    knightTypeTimer = null;
    knightLine.classList.add('done');
  }
}

// Tapping the box anywhere dismisses it.
knightSection.addEventListener('click', hideKnightLine);
