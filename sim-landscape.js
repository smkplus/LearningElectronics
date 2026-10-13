/* ========================================================================
   SIM-LANDSCAPE.JS — وقتی روی گوشی دکمه‌ی «بزرگنمایی» (تمام‌صفحه‌ی ادیتور)
   زده می‌شود، صفحه را به حالتِ افقی (Landscape) می‌برد.

   این فایل به کدِ دکمه‌ی بزرگنمایی دست نمی‌زند؛ فقط کلاسِ
   `is-sim-fullscreen` روی `.sim-editor-block` را زیرِ نظر می‌گیرد:
     • کلاس اضافه شد  → تمام‌صفحه‌ی واقعیِ مرورگر + قفلِ جهت روی landscape
     • کلاس برداشته شد → آزادسازیِ قفل و خروج از تمام‌صفحه

   نکته: قفلِ جهتِ صفحه (screen.orientation.lock) در مرورگرها فقط در حالتِ
   تمام‌صفحه‌ی واقعی کار می‌کند؛ برای همین اول requestFullscreen را صدا
   می‌زنیم. روی iOS Safari قفلِ جهت اصلاً پشتیبانی نمی‌شود؛ آن‌جا فقط یک
   پیامِ «گوشی را بچرخانید» نشان می‌دهیم.
   ======================================================================== */
(function () {
  'use strict';

  var FS_CLASS = 'is-sim-fullscreen';
  var SELECTOR = '.sim-editor-block.' + FS_CLASS;
  var ROOT_CLASS = 'ab-landscape-fs';

  var active = false;        // الان در حالتِ تمام‌صفحه‌ی ادیتور هستیم؟
  var realFullscreen = false; // تمام‌صفحه‌ی واقعیِ مرورگر را ما گرفته‌ایم؟
  var hintEl = null;
  var hintTimer = 0;

  function noop() {}

  // فقط گوشی/تبلتِ کوچک (صفحه‌ی لمسی با ضلعِ کوتاهِ حداکثر ~۸۲۰px)
  function isPhone() {
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var shortSide = Math.min(window.screen.width, window.screen.height);
    return !!coarse && shortSide <= 820;
  }

  function isPortrait() {
    return window.matchMedia
      ? window.matchMedia('(orientation: portrait)').matches
      : window.innerHeight > window.innerWidth;
  }

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function requestFs(el) {
    var fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!fn) return Promise.reject(new Error('no-fullscreen-api'));
    try {
      var r = fn.call(el);
      return r && r.then ? r : Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function exitFs() {
    var fn = document.exitFullscreen || document.webkitExitFullscreen;
    if (!fn || !fsElement()) return;
    try {
      var r = fn.call(document);
      if (r && r.catch) r.catch(noop);
    } catch (e) { /* noop */ }
  }

  function lockLandscape() {
    var o = window.screen && window.screen.orientation;
    if (!o || !o.lock) return Promise.reject(new Error('no-orientation-lock'));
    try {
      return o.lock('landscape');
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function unlockOrientation() {
    try {
      var o = window.screen && window.screen.orientation;
      if (o && o.unlock) o.unlock();
    } catch (e) { /* noop */ }
  }

  // Blockly روی رویدادِ resize ی پنجره ابعادش را دوباره حساب می‌کند.
  function pokeResize() {
    [0, 120, 400].forEach(function (ms) {
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, ms);
    });
  }

  /* ---------- پیامِ «گوشی را بچرخانید» ---------- */
  function showHint() {
    if (hintEl) return;
    hintEl = document.createElement('div');
    hintEl.className = 'ab-rotate-hint';
    hintEl.setAttribute('role', 'status');
    hintEl.innerHTML = '<span class="ab-rotate-hint-icon">📱↻</span>' +
      '<span>برای دیدنِ بهتر، گوشی را افقی بگیرید</span>';
    hintEl.addEventListener('click', hideHint);
    document.body.appendChild(hintEl);
  }

  function hideHint() {
    clearTimeout(hintTimer);
    if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl);
    hintEl = null;
  }

  function updateHint() {
    clearTimeout(hintTimer);
    if (active && isPortrait()) {
      // کمی صبر می‌کنیم؛ اگر قفلِ جهت موفق باشد تا آن موقع صفحه افقی شده
      hintTimer = setTimeout(function () {
        if (active && isPortrait()) showHint();
      }, 700);
    } else {
      hideHint();
    }
  }

  /* ---------- ورود / خروج ---------- */
  function enter() {
    if (active) return;
    active = true;
    document.documentElement.classList.add(ROOT_CLASS);

    // کلِ صفحه را تمام‌صفحه می‌کنیم (نه فقط ادیتور)، تا منوهای شناورِ Blockly
    // که به body اضافه می‌شوند هم دیده شوند.
    requestFs(document.documentElement)
      .then(function () { realFullscreen = true; }, noop)
      .then(lockLandscape)
      .then(noop, noop)
      .then(function () {
        if (!active) {           // کاربر در همین فاصله بسته است
          unlockOrientation();
          exitFs();
          return;
        }
        pokeResize();
        updateHint();
      });
  }

  function leave() {
    if (!active) return;
    active = false;
    document.documentElement.classList.remove(ROOT_CLASS);
    hideHint();
    unlockOrientation();
    if (realFullscreen) exitFs();
    realFullscreen = false;
    pokeResize();
  }

  function sync() {
    var on = !!document.querySelector(SELECTOR);
    if (on && isPhone()) enter();
    else if (!on) leave();
  }

  /* ---------- شنودها ---------- */
  var scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    // microtask: هنوز داخلِ «اثرِ کلیکِ کاربر» هستیم و requestFullscreen مجاز است
    Promise.resolve().then(function () { scheduled = false; sync(); });
  }

  function start() {
    new MutationObserver(scheduleSync).observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      childList: true
    });

    function onLayoutChange() {
      if (active) { pokeResize(); updateHint(); }
    }
    window.addEventListener('orientationchange', onLayoutChange);
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener('change', onLayoutChange);
    }

    function onFsChange() {
      // کاربر با ژستِ «بازگشت»/Esc از تمام‌صفحه‌ی مرورگر بیرون آمد؛
      // قفلِ جهت را رها می‌کنیم. حالتِ تمام‌صفحه‌ی خودِ ادیتور را با دکمه‌ی
      // خودش می‌بندد.
      if (active && realFullscreen && !fsElement()) {
        realFullscreen = false;
        unlockOrientation();
      }
      onLayoutChange();
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    sync(); // اگر صفحه از قبل در حالتِ تمام‌صفحه باز شده باشد
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
