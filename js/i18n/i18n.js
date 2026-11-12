/* ========================================================================
   I18N — core.  Load this (and the locale files) in <head>, before everything else.

   Add a language:  create js/i18n/locales/<code>.js that calls I18n.register({...})
                    and add one <script> tag for it in index.html. Nothing else.
   Use in HTML:     <span data-i18n="key"></span>
                    <p data-i18n-html="key"></p>              (string contains markup)
                    <img data-i18n-attr="alt:key; title:key2">
   Use in JS:       t('key')   t('key', {n: 3})   I18n.num(42)
   ======================================================================== */
(function(){
  'use strict';

  const STORAGE_KEY = 'electroquest-lang';   // deliberately not "shovalie-madar-*": version resets must not wipe it
  const DEFAULT_LANG = 'fa';                 // source language and last fallback
  const config = { reloadOnChange: true };   // switch to false once every module listens to I18n.onChange

  const langs = {};
  const listeners = [];
  const warned = new Set();
  let current = DEFAULT_LANG;

  function register(def){
    const l = langs[def.code] || (langs[def.code] = { code: def.code, name: def.code, dir: 'ltr', digits: null, strings: {} });
    if(def.name) l.name = def.name;
    if(def.dir) l.dir = def.dir;
    if(def.digits !== undefined) l.digits = def.digits;
    Object.assign(l.strings, def.strings || {});
  }

  const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);
  function warnOnce(msg){ if(!warned.has(msg)){ warned.add(msg); console.warn('[i18n] ' + msg); } }

  function t(key, params){
    let s;
    const cur = langs[current], def = langs[DEFAULT_LANG];
    if(cur && has(cur.strings, key)) s = cur.strings[key];
    else if(def && has(def.strings, key)){ s = def.strings[key]; if(current !== DEFAULT_LANG) warnOnce('missing "' + key + '" in ' + current); }
    else { warnOnce('unknown key "' + key + '"'); return key; }
    if(typeof s === 'function') return s(params || {});
    return params ? s.replace(/\{(\w+)\}/g, (m, k) => params[k] !== undefined ? params[k] : m) : s;
  }

  // For content that keeps its Persian inline (quest data etc.): returns the translation when the
  // current language has one, otherwise the inline fallback. Never warns, so partial translations are fine.
  function field(key, fallback){
    if(current === DEFAULT_LANG) return fallback;
    const l = langs[current];
    if(!l || !has(l.strings, key)) return fallback;
    const s = l.strings[key];
    return typeof s === 'function' ? s({}) : s;
  }

  // Walks a data object and swaps every Persian string leaf for its translation, keyed by path
  // (prefix + '.' + path, e.g. quest.led_circuit.steps.2). Strings with no translation stay as they are.
  const FA_RE = /[\u0600-\u06FF]/;
  function localizeTree(node, prefix, seen){
    if(current === DEFAULT_LANG || !node || typeof node !== 'object') return node;
    seen = seen || new WeakSet();
    if(seen.has(node)) return node;
    seen.add(node);
    Object.keys(node).forEach(k => {
      const v = node[k], key = prefix + '.' + k;
      if(typeof v === 'string'){ if(FA_RE.test(v)) node[k] = field(key, v); }
      else if(v && typeof v === 'object') localizeTree(v, key, seen);
    });
    return node;
  }

  // gettext style: the Persian text in the code IS the key. __('متن') returns its translation, or itself.
  // __f('سرعت {0} است', v) fills {0}, {1}… after translating (a translation may reorder them).
  function s(fa){
    if(current === DEFAULT_LANG) return fa;
    const l = langs[current];
    return l && has(l.strings, fa) ? l.strings[fa] : fa;
  }
  function f(fa){
    const args = Array.prototype.slice.call(arguments, 1);
    return s(fa).replace(/\{(\d+)\}/g, (m, i) => args[i] !== undefined ? args[i] : m);
  }

  function num(n){
    const d = langs[current] && langs[current].digits;
    const s = String(n);
    return d ? s.replace(/\d/g, x => d[x]) : s;
  }

  function apply(root){
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
        const i = pair.indexOf(':');
        if(i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
      });
    });
  }

  function applyMeta(){
    const l = langs[current];
    document.documentElement.lang = current;
    document.documentElement.dir = l ? l.dir : 'ltr';
    const title = t('meta.title');
    if(title !== 'meta.title') document.title = title;
  }

  function detect(){
    let want = null;
    try{
      const q = new URLSearchParams(location.search).get('lang');
      if(q && langs[q]){ want = q; localStorage.setItem(STORAGE_KEY, q); }
      if(!want){ const s = localStorage.getItem(STORAGE_KEY); if(s && langs[s]) want = s; }
    }catch(e){}
    if(!want){
      const nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
      for(const n of nav){ const c = String(n).toLowerCase().split('-')[0]; if(langs[c]){ want = c; break; } }
    }
    return want || DEFAULT_LANG;
  }

  function setLang(code, opts){
    if(!langs[code]) return false;
    try{ localStorage.setItem(STORAGE_KEY, code); }catch(e){}
    if(code === current) return true;
    if(config.reloadOnChange && !(opts && opts.reload === false)){
      try{ const u = new URL(location.href); u.searchParams.delete('lang'); history.replaceState(null, '', u); }catch(e){}
      location.reload();
      return true;
    }
    current = code;
    applyMeta(); apply(document);
    listeners.forEach(f => { try{ f(code); }catch(e){ console.error(e); } });
    return true;
  }

  function mountSwitcher(container){
    if(!container) return null;
    const sel = document.createElement('select');
    sel.className = 'lang-select';
    sel.setAttribute('aria-label', t('lang.switch'));
    Object.keys(langs).forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = langs[c].name; o.selected = c === current;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => setLang(sel.value));
    container.innerHTML = '';
    container.appendChild(sel);
    return sel;
  }

  const I18n = {
    register, t, field, localizeTree, s, f, num, apply, setLang, mountSwitcher, config,
    get lang(){ return current; },
    get dir(){ return langs[current] ? langs[current].dir : 'ltr'; },
    languages(){ return Object.keys(langs).map(c => ({ code: c, name: langs[c].name, dir: langs[c].dir })); },
    onChange(fn){ listeners.push(fn); },
    init(){
      current = detect();
      applyMeta();
      if(current !== DEFAULT_LANG) document.documentElement.classList.add('i18n-pending');
      const run = () => {
        apply(document);
        mountSwitcher(document.getElementById('langSwitch'));
        document.documentElement.classList.remove('i18n-pending');
      };
      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
      setTimeout(() => document.documentElement.classList.remove('i18n-pending'), 3000);
    }
  };

  window.I18n = I18n;
  window.t = t;
  window.__ = s;
  window.__f = f;
})();
