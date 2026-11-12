const {JSDOM, VirtualConsole} = require('./node_modules/jsdom');
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const read = f => fs.readFileSync(f, 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if(!c) fails++; };

function boot(lang){
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {runScripts:'outside-only', pretendToBeVisual:true, url:'http://localhost/', virtualConsole:vc});
  const w = dom.window;
  if(lang) w.localStorage.setItem('electroquest-lang', lang);
  w.eval(read('js/i18n/i18n.js')); w.eval(read('js/i18n/locales/fa.js')); w.eval(read('js/i18n/locales/en.js'));
  return {w, d: w.document};
}
const snapshot = d => [...d.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-attr]')].map(e => [e.getAttribute('data-i18n') || e.getAttribute('data-i18n-html') || e.getAttribute('data-i18n-attr'), e.innerHTML.replace(/\s+/g, ' ').trim(), e.alt || '']);

(async () => {
  {
    const {w, d} = boot('fa');
    const before = snapshot(d);
    w.I18n.init(); await sleep(80);
    const after = snapshot(d);
    const diff = before.filter((b, i) => b[1] !== after[i][1] || b[2] !== after[i][2]).map(b => b[0]);
    ok(before.length > 60 && diff.length === 0, 'fa: applying fa.js changes nothing in ' + before.length + ' translated elements (HTML and fa.js agree)' + (diff.length ? ' -> ' + diff.join(',') : ''));
    ok(d.documentElement.dir === 'rtl' && d.documentElement.lang === 'fa', 'fa: html dir=rtl lang=fa');
    ok(!d.documentElement.classList.contains('i18n-pending'), 'fa: no pending class');
    ok(d.querySelector('#langSwitch select').value === 'fa', 'fa: switcher shows فارسی');
  }
  {
    const {w, d} = boot('en');
    w.I18n.init();
    ok(d.documentElement.classList.contains('i18n-pending'), 'en: page hidden (pending) until strings are applied, so no Persian flash');
    await sleep(80);
    const txt = s => d.querySelector(s).textContent.trim();
    ok(!d.documentElement.classList.contains('i18n-pending'), 'en: pending class removed after apply');
    ok(d.documentElement.dir === 'ltr' && d.documentElement.lang === 'en', 'en: html dir=ltr lang=en');
    ok(d.title === 'Journey into the World of Electronics', 'en: <title> translated');
    ok(txt('.hud-title') === 'Journey into the World of Electronics', 'en: HUD title');
    ok(txt('#tabQuestBtn') === 'Mission Path' && txt('#tabLabBtn') === 'Electronics Lab' && txt('#tabCircuitBtn') === 'Circuit Design', 'en: tab buttons');
    ok(d.querySelectorAll('#tabQuestBtn svg').length === 1, 'en: tab svg icon survives');
    ok(d.querySelector('.resistor-guide-note b') && /bands 1 and 2/.test(d.querySelector('.resistor-guide-note b').textContent), 'en: strings with <b> render as HTML');
    ok(d.querySelector('[data-i18n-html="lab.ohm.current"]').textContent.includes('\u00a0'), 'en: &nbsp; preserved');
    ok(d.getElementById('knightImg').alt === 'Master Ohm', 'en: alt attribute translated');
    ok(txt('.welcome-modal .steps li:first-child .num') === '1', 'en: step numerals are Latin');
    ok(w.I18n.num(2026) === '2026', 'en: num() leaves digits');
    const sel = d.querySelector('#langSwitch select');
    ok(sel && sel.options.length === 2 && sel.value === 'en', 'switcher: lists both languages, current selected');
    ok(w.t('char.voltage') === 'Voltage', 't(): global helper works');
    ok(w.t('nope.nothing') === 'nope.nothing', 't(): unknown key returns the key');
    const left = [...d.querySelectorAll('[data-i18n],[data-i18n-html]')].filter(e => /[\u0600-\u06FF]/.test(e.textContent));
    ok(left.length === 0, 'en: no Persian left inside any translated element' + (left.length ? ' -> ' + left.map(e => e.getAttribute('data-i18n') || e.getAttribute('data-i18n-html')).join(',') : ''));
  }
  {
    const {w, d} = boot('fa');
    w.I18n.init(); await sleep(80);
    const keys = l => [...read('js/i18n/locales/' + l + '.js').matchAll(/^\s*['"]([\w.]+)['"]\s*:/gm)].map(m => m[1]);
    const fk = new Set(keys('fa')), ek = new Set(keys('en'));
    const missingEn = [...fk].filter(k => !ek.has(k)), extraEn = [...ek].filter(k => !fk.has(k));
    ok(missingEn.length === 0, 'parity: every fa key exists in en' + (missingEn.length ? ' -> ' + missingEn.join(',') : ''));
    ok(extraEn.length === 0, 'parity: no en-only keys' + (extraEn.length ? ' -> ' + extraEn.join(',') : ''));
    const used = [...html.matchAll(/data-i18n(?:-html)?="([\w.]+)"|data-i18n-attr="[\w-]+:([\w.]+)"/g)].map(m => m[1] || m[2]);
    const unknown = used.filter(k => !fk.has(k));
    ok(unknown.length === 0, 'html: every data-i18n key is defined (' + used.length + ' uses)' + (unknown.length ? ' -> ' + unknown.join(',') : ''));
    w.I18n.config.reloadOnChange = false;
    let fired = 0; w.I18n.onChange(() => fired++);
    w.I18n.setLang('en');
    ok(w.I18n.lang === 'en' && d.documentElement.dir === 'ltr' && d.querySelector('#tabLabBtn').textContent.trim() === 'Electronics Lab' && fired === 1, 'setLang(en) live: re-applies DOM, flips dir, fires onChange');
    ok(w.localStorage.getItem('electroquest-lang') === 'en', 'setLang persists the choice');
    w.I18n.setLang('fa');
    ok(d.documentElement.dir === 'rtl' && d.querySelector('#tabLabBtn').textContent.trim() === 'آزمایشگاه الکترونیک', 'setLang(fa) switches back');
  }
  {
    const {w, d} = boot('de');
    w.I18n.register({code: 'de', name: 'Deutsch', dir: 'ltr', strings: {'tab.lab': 'Labor'}});
    w.I18n.init(); await sleep(80);
    ok(w.I18n.lang === 'de' && d.querySelector('#tabLabBtn').textContent.trim() === 'Labor', 'new language: one register() call, picked up from storage');
    ok(d.querySelector('#tabQuestBtn').textContent.trim() === 'مسیر مأموریت', 'new language: untranslated keys fall back to Persian, nothing breaks');
    ok(d.querySelectorAll('#langSwitch option').length === 3, 'new language: appears in the switcher automatically');
  }
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
