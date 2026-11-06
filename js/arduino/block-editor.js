/*!
 * block-editor.js — ادیتور بلوکی بدون وابستگی (جایگزین Blockly)
 *
 *   const ed = BlockEditor.create(container, {
 *     rtl: true,                       // چیدمان راست‌به‌چپ
 *     pins: ['0','1',...,'A0'],        // فهرست پایه‌ها (پیش‌فرض: Arduino Uno)
 *     allow: ['pinMode', ...],         // فقط این بلوک‌ها در جعبه‌ابزار (اختیاری)
 *     storageKey: 'draft-blocks',      // ذخیره‌ی خودکار پیش‌نویس (اختیاری)
 *     onChange: ({ code, state }) => {} // با هر تغییر
 *   });
 *   ed.getCode()  ed.getState()  ed.setState(obj)  ed.setCode(cpp)  ed.clear()  ed.undo()  ed.redo()  ed.destroy()
 */
(function (global) {
  'use strict';

  /* ───────────── ابزارهای کوچک ───────────── */
  const h = (tag, a, ...kids) => {
    const el = document.createElement(tag);
    if (a) for (const k in a) {
      const v = a[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null) el.append(c);
    return el;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const svg = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICON = {
    undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    redo: svg('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    fit: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    target: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>'),
    zplus: svg('<circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v9M7.5 12h9"/>'),
    zminus: svg('<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12h9"/>'),
    trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
    code: svg('<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>'),
    sort: svg('<path d="M4 6h16M4 12h10M4 18h6"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>')
  };
  const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  const normDigits = s => String(s).replace(/[۰-۹]/g, d => FA.indexOf(d)).replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/[٫,]/g, '.').replace(/[−–]/g, '-');
  const normNum = s => { const n = parseFloat(normDigits(s).replace(/\s+/g, '')); return isFinite(n) ? String(n) : null; };

  /* ───────────── دسته‌ها ───────────── */
  const CATS = [
    { id: 'start', name: 'شروع', cls: 'start' },
    { id: 'control', name: 'کنترل', cls: 'control' },
    { id: 'pins', name: 'پایه‌ها (پین‌ها)', cls: 'pins' },
    { id: 'vars', name: 'متغیرها', cls: 'vars' },
    { id: 'math', name: 'ریاضی', cls: 'math' },
    { id: 'logic', name: 'منطق', cls: 'logic' },
    { id: 'serial', name: 'متن و سریال', cls: 'serial' }
  ];
  const FLY = {
    start: ['setup', 'loop', 'comment', 'raw'],
    control: ['if', 'ifelse', 'repeat', 'while', 'break', 'delay', 'millis'],
    pins: ['pinMode', 'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead', 'tone', 'noTone', 'level'],
    math: ['number', 'arith', 'map', 'random', 'constrain'],
    logic: ['compare', 'logic', 'not', 'bool'],
    serial: ['sbegin', 'sprint', 'text']
  };

  /* ───────────── تعریف بلوک‌ها ───────────── */
  const DEF = {};
  const N = (n, d = 0) => ({ n, t: 'num', d });
  const B = n => ({ n, t: 'bool' });
  const S = (n, d = '') => ({ n, t: 'text', d });
  const PIN = (d = '8') => ({ f: 'PIN', t: 'pin', d });
  const DD = (f, o) => ({ f, t: 'drop', o });
  const VARF = { f: 'VAR', t: 'var' };
  const MODES = [['خروجی (OUTPUT)', 'OUTPUT'], ['ورودی (INPUT)', 'INPUT'], ['ورودی با مقاومتِ داخلی (INPUT_PULLUP)', 'INPUT_PULLUP']];
  const BAUDS = [9600, 19200, 38400, 57600, 115200].map(v => [String(v), String(v)]);

  function def(type, cat, kind, rows, gen, o) {
    const d = Object.assign({ type, cat, kind, rows, gen, out: null, ltr: false, sockets: {}, fields: {} }, o);
    for (const r of rows) {
      if (!Array.isArray(r)) continue;
      for (const it of r) {
        if (it && it.n) d.sockets[it.n] = it.t;
        if (it && it.f) d.fields[it.f] = it;
      }
    }
    DEF[type] = d;
  }

  def('setup', 'start', 'hat', [['🔌 هنگام شروع'], { stmt: 'DO' }]);
  def('loop', 'start', 'hat', [['🔁 همیشه تکرار کن'], { stmt: 'DO' }]);

  def('comment', 'start', 'stmt', [['💬 توضیح', { f: 'T', t: 'text', d: 'توضیح' }]],
    (b) => '// ' + String(b.f.T).replace(/[\r\n]+/g, ' '));
  def('raw', 'start', 'stmt', [['⌨️ کدِ خام'], [{ f: 'T', t: 'area', d: '' }]],
    (b) => String(b.f.T).replace(/\s+$/, '').split('\n'));
  def('gtop', 'start', 'hat', [['🌐 کدِ سراسری'], [{ f: 'T', t: 'area', d: '' }]]);

  def('pinMode', 'pins', 'stmt', [['⚙️ پینِ', PIN(), 'را', DD('M', MODES), 'کن']],
    (b, g) => `pinMode(${g.f(b, 'PIN')}, ${g.f(b, 'M')});`);
  def('digitalWrite', 'pins', 'stmt', [['💡 پینِ', PIN(), 'را', DD('V', [['روشن (HIGH)', 'HIGH'], ['خاموش (LOW)', 'LOW']]), 'کن']],
    (b, g) => `digitalWrite(${g.f(b, 'PIN')}, ${g.f(b, 'V')});`);
  def('digitalRead', 'pins', 'value', [['📥 مقدارِ دیجیتالِ پینِ', PIN('2')]],
    (b, g) => `digitalRead(${g.f(b, 'PIN')})`, { out: 'bool' });
  def('analogWrite', 'pins', 'stmt', [['🔆 پینِ', PIN('9'), 'را با شدتِ', N('A', 128), '(از ۰ تا ۲۵۵) روشن کن']],
    (b, g) => `analogWrite(${g.f(b, 'PIN')}, ${g.a(b, 'A')});`);
  def('analogRead', 'pins', 'value', [['📊 مقدارِ آنالوگِ پینِ', PIN('A0')]],
    (b, g) => `analogRead(${g.f(b, 'PIN')})`, { out: 'num' });
  def('tone', 'pins', 'stmt', [['🔔 روی پینِ', PIN(), 'صدا با فرکانسِ', N('F', 440), 'هرتز به مدتِ', N('D', 200), 'میلی‌ثانیه پخش کن']],
    (b, g) => `tone(${g.f(b, 'PIN')}, ${g.a(b, 'F')}, ${g.a(b, 'D')});`);
  def('level', 'pins', 'value', [[DD('V', [['روشن (HIGH)', 'HIGH'], ['خاموش (LOW)', 'LOW']])]],
    (b, g) => g.f(b, 'V'), { out: 'num' });
  def('noTone', 'pins', 'stmt', [['🔕 صدای پینِ', PIN(), 'را قطع کن']],
    (b, g) => `noTone(${g.f(b, 'PIN')});`);

  def('delay', 'control', 'stmt', [['⏱️ صبر کن', N('A', 500), 'میلی‌ثانیه']],
    (b, g) => `delay(${g.a(b, 'A')});`);
  def('millis', 'control', 'value', [['⏱️ زمانِ سپری‌شده از شروع (ms)']], () => 'millis()', { out: 'num' });

  def('if', 'control', 'stmt', [['اگر (if)', B('C'), 'آنگاه'], { stmt: 'DO' }],
    (b, g) => [`if (${g.a(b, 'C')}) {`, ...g.body(b, 'DO'), '}']);
  def('ifelse', 'control', 'stmt', [['اگر (if)', B('C'), 'آنگاه'], { stmt: 'DO' }, ['در غیر این صورت'], { stmt: 'ELSE' }],
    (b, g) => [`if (${g.a(b, 'C')}) {`, ...g.body(b, 'DO'), '} else {', ...g.body(b, 'ELSE'), '}']);
  def('repeat', 'control', 'stmt', [['🔁 تکرار (repeat)', N('N', 10), 'بار'], { stmt: 'DO' }],
    (b, g) => {
      const n = g.a(b, 'N'), v = g.loopVar(), body = g.body(b, 'DO');
      g.endLoop();
      return [`for (int ${v} = 0; ${v} < ${n}; ${v}++) {`, ...body, '}'];
    });
  def('while', 'control', 'stmt', [['🔁 تکرار (while) در حالی که', B('C')], { stmt: 'DO' }],
    (b, g) => [`while (${g.a(b, 'C')}) {`, ...g.body(b, 'DO'), '}']);
  def('break', 'control', 'cap', [['خروج از (break) حلقه']], () => 'break;');

  const CMP = [['<', '<'], ['>', '>'], ['≤', '<='], ['≥', '>='], ['=', '=='], ['≠', '!=']];
  def('compare', 'logic', 'value', [[N('A'), DD('OP', CMP), N('B')]],
    (b, g) => `(${g.v(b, 'A')} ${g.f(b, 'OP')} ${g.v(b, 'B')})`, { out: 'bool', ltr: true });
  def('logic', 'logic', 'value', [[B('A'), DD('OP', [['و', '&&'], ['یا', '||']]), B('B')]],
    (b, g) => `(${g.v(b, 'A')} ${g.f(b, 'OP')} ${g.v(b, 'B')})`, { out: 'bool' });
  def('not', 'logic', 'value', [['نقیضِ', B('A')]],
    (b, g) => `!(${g.a(b, 'A')})`, { out: 'bool' });
  def('bool', 'logic', 'value', [[DD('V', [['درست', 'true'], ['نادرست', 'false']])]],
    (b, g) => g.f(b, 'V'), { out: 'bool' });

  def('number', 'math', 'value', [[{ f: 'V', t: 'num', d: 0 }]],
    (b, g) => g.num(b.f.V), { out: 'num' });
  def('arith', 'math', 'value', [[N('A', 1), DD('OP', [['+', '+'], ['−', '-'], ['×', '*'], ['÷', '/'], ['%', '%']]), N('B', 1)]],
    (b, g) => `(${g.v(b, 'A')} ${g.f(b, 'OP')} ${g.v(b, 'B')})`, { out: 'num', ltr: true });
  def('map', 'math', 'value', [['🧮 نگاشتِ', N('V', 512), 'از بازه‌ی', N('A', 0), 'تا', N('B', 1023), 'به بازه‌ی', N('C', 0), 'تا', N('D', 255)]],
    (b, g) => `map(${['V', 'A', 'B', 'C', 'D'].map(k => g.a(b, k)).join(', ')})`, { out: 'num' });
  def('random', 'math', 'value', [['🎲 عددِ تصادفی بین', N('A', 1), 'و', N('B', 100)]],
    (b, g) => {
      const hi = g.a(b, 'B');
      return `random(${g.a(b, 'A')}, ${/^-?\d+$/.test(hi) ? String(+hi + 1) : hi + ' + 1'})`;
    }, { out: 'num' });
  def('constrain', 'math', 'value', [['محدود کن', N('V', 50), 'بین', N('A', 1), 'و', N('B', 100)]],
    (b, g) => `constrain(${g.a(b, 'V')}, ${g.a(b, 'A')}, ${g.a(b, 'B')})`, { out: 'num' });

  def('sbegin', 'serial', 'stmt', [['🖥️ مانیتورِ سریال را با سرعتِ', DD('B', BAUDS), 'شروع کن']],
    (b, g) => `Serial.begin(${g.f(b, 'B')});`);
  def('sprint', 'serial', 'stmt', [['🖨️ در مانیتورِ سریال چاپ کن', S('A', 'پیام من'), 'برو خطِ بعد', { f: 'NL', t: 'check', d: '1' }]],
    (b, g) => `Serial.${b.f.NL === '1' ? 'println' : 'print'}(${g.a(b, 'A')});`);
  def('text', 'serial', 'value', [['«', { f: 'T', t: 'text', d: 'سلام' }, '»']],
    (b) => JSON.stringify(String(b.f.T)), { out: 'str' });

  def('var_set', 'vars', 'stmt', [['مقداردهیِ متغیرِ', VARF, 'به', N('A', 0)]],
    (b, g) => `${g.f(b, 'VAR')} = ${g.a(b, 'A')};`);
  def('var_change', 'vars', 'stmt', [['تغییرِ متغیرِ', VARF, 'به اندازه‌ی', N('A', 1)]],
    (b, g) => `${g.f(b, 'VAR')} += ${g.a(b, 'A')};`);
  def('var_get', 'vars', 'value', [['مقدارِ متغیر', VARF]],
    (b, g) => g.f(b, 'VAR'), { out: 'num' });

  const VTYPES = /^(unsigned )?(int|float|long|byte|bool|boolean|double|short|String)$/;
  const ACCEPT = { num: ['num', 'bool'], bool: ['bool', 'num'], text: ['num', 'bool', 'str'] };
  const accepts = (sockT, out) => (ACCEPT[sockT] || []).includes(out);
  const RESERVED = new Set('int float double long char bool byte void if else for while do return break continue true false setup loop delay millis random map abs min max tone noTone Serial HIGH LOW INPUT OUTPUT INPUT_PULLUP pinMode digitalWrite digitalRead analogRead analogWrite String const static class new delete switch case default constrain'.split(' '));

  /* ───────────── مدل ───────────── */
  let UID = 0;
  function mk(type, f) {
    const d = DEF[type];
    const b = { id: 'b' + (++UID), type, f: {}, sv: {}, in: {}, st: {}, next: null };
    for (const row of d.rows) {
      if (!Array.isArray(row)) { b.st[row.stmt] = null; continue; }
      for (const it of row) {
        if (!it || typeof it === 'string' || it.x) continue;
        if (it.n) { b.in[it.n] = null; if (it.t !== 'bool') b.sv[it.n] = String(it.d != null ? it.d : (it.t === 'num' ? 0 : '')); }
        else if (it.f) b.f[it.f] = it.t === 'drop' ? it.o[0][1] : it.t === 'pin' ? it.d : it.t === 'var' ? '' : String(it.d != null ? it.d : '');
      }
    }
    return Object.assign(b, { f: Object.assign(b.f, f || {}) });
  }
  function ser(b) {
    const o = { t: b.type, f: b.f, sv: b.sv };
    const i = {}, s = {}; let hi = false, hs = false;
    for (const k in b.in) if (b.in[k]) { i[k] = ser(b.in[k]); hi = true; }
    for (const k in b.st) if (b.st[k]) { s[k] = ser(b.st[k]); hs = true; }
    if (hi) o.i = i;
    if (hs) o.s = s;
    if (b.next) o.n = ser(b.next);
    return o;
  }
  function des(o) {
    if (!o || !DEF[o.t]) return null;
    const b = mk(o.t);
    for (const k in (o.f || {})) if (k in b.f) b.f[k] = String(o.f[k]);
    for (const k in (o.sv || {})) if (k in b.sv) b.sv[k] = String(o.sv[k]);
    for (const k in (o.i || {})) if (k in b.in) b.in[k] = des(o.i[k]);
    for (const k in (o.s || {})) if (k in b.st) b.st[k] = des(o.s[k]);
    if (o.n) b.next = des(o.n);
    return b;
  }
  const cloneBlock = (b, withNext) => { const o = ser(b); if (!withNext) delete o.n; return des(o); };
  const lastOf = b => { while (b.next) b = b.next; return b; };
  function visit(b, cb) {
    for (let c = b; c; c = c.next) {
      cb(c);
      for (const k in c.in) if (c.in[k]) visit(c.in[k], cb);
      for (const k in c.st) if (c.st[k]) visit(c.st[k], cb);
    }
  }

  /* ───────────── تولید کد ───────────── */
  function strip(s) {
    if (s[0] !== '(' || s[s.length - 1] !== ')') return s;
    let d = 0, q = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '"' && s[i - 1] !== '\\') q = !q;
      if (q) continue;
      if (c === '(') d++;
      else if (c === ')') { d--; if (d === 0 && i < s.length - 1) return s; }
    }
    return s.slice(1, -1);
  }
  function generate(state) {
    const used = new Set(state.vars.filter(v => !v.ext).map(v => v.name));
    let depth = 0;
    const g = {
      f: (b, n) => String(b.f[n] == null ? '' : b.f[n]),
      num: s => { const n = normNum(s); return n == null ? '0' : n; },
      v(b, n) {
        const c = b.in[n];
        if (c) return DEF[c.type].gen(c, g);
        const t = DEF[b.type].sockets[n];
        if (t === 'bool') return 'false';
        if (t === 'num') return g.num(b.sv[n]);
        return JSON.stringify(String(b.sv[n]));
      },
      a: (b, n) => strip(g.v(b, n)),
      chain(b) {
        const out = [];
        for (let c = b; c; c = c.next) {
          const r = DEF[c.type].gen(c, g);
          out.push(...(Array.isArray(r) ? r : String(r).split('\n')));
        }
        return out;
      },
      body: (b, n) => g.chain(b.st[n]).map(l => '  ' + l),
      loopVar() {
        let n = ['i', 'j', 'k', 'm', 'n', 'p'][depth] || 'i' + depth;
        while (used.has(n)) n += '_';
        depth++;
        return n;
      },
      endLoop: () => { depth--; }
    };
    const setup = [], loop = [], pre = [], gl = [];
    [...state.tops].sort((a, b) => a.y - b.y || a.x - b.x).forEach(t => {
      if (t.b.type === 'setup') setup.push(...g.chain(t.b.st.DO));
      else if (t.b.type === 'loop') loop.push(...g.chain(t.b.st.DO));
      else if (t.b.type === 'gtop') String(t.b.f.T).replace(/\s+$/, '').split('\n').forEach(l => (/^\s*#/.test(l) ? pre : gl).push(l));
    });
    const L = [...pre, ...state.vars.filter(v => !v.ext).map(v => `${v.const ? 'const ' : ''}${v.type} ${v.name} = ${v.init == null || v.init === '' ? '0' : v.init};`), ...gl];
    if (L.length) L.push('');
    L.push('void setup() {', ...setup.map(l => '  ' + l), '}', '', 'void loop() {', ...loop.map(l => '  ' + l), '}');
    return L.join('\n') + '\n';
  }

  /* ───────────── کد ← بلوک ───────────── */
  function tokenize(src) {
    const T = [], n = src.length;
    let i = 0;
    const push = (t, s, v) => T.push({ t, v: v == null ? src.slice(s, i) : v, s, e: i });
    while (i < n) {
      const c = src[i], s = i;
      if (/\s/.test(c)) { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; push('cmt', s, src.slice(s + 2, i).trim()); continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; push('bcmt', s); continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; push('pp', s); continue; }
      if (c === '"' || c === "'") { i++; while (i < n && src[i] !== c) { if (src[i] === '\\') i++; i++; } i++; push(c === '"' ? 'str' : 'chr', s); continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) { while (i < n && /[\w.]/.test(src[i])) i++; push('num', s); continue; }
      if (/[A-Za-z_]/.test(c)) { while (i < n && /\w/.test(src[i])) i++; push('id', s); continue; }
      const o3 = src.substr(i, 3), o2 = src.substr(i, 2);
      i += (o3 === '<<=' || o3 === '>>=') ? 3 : ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '<<', '>>', '->', '::'].includes(o2) ? 2 : 1;
      push('op', s);
    }
    return T;
  }

  const PREC = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
  const LOOPV = ['i', 'j', 'k', 'm', 'n', 'p'];

  function importCode(src) {
    src = String(src == null ? '' : src).replace(/\r\n?/g, '\n');
    const T = tokenize(src);
    const vars = [], declared = new Set(), gl = [];
    let p = 0, scope = [], raws = 0;
    const fail = () => { throw new Error('unsupported'); };
    const isOp = (t, v) => !!t && t.t === 'op' && t.v === v;
    const isId = (t, v) => !!t && t.t === 'id' && (v == null || t.v === v);
    const addVar = (v) => { if (declared.has(v.name)) fail(); declared.add(v.name); vars.push(v); };
    const useVar = name => { if (!declared.has(name)) { declared.add(name); vars.push({ name, type: 'int', init: '0', ext: true }); } };
    const close = i => {
      const o = T[i].v, c = o === '(' ? ')' : o === '[' ? ']' : '}';
      let d = 0;
      for (let j = i; j < T.length; j++) { const t = T[j]; if (t.t !== 'op') continue; if (t.v === o) d++; else if (t.v === c && --d === 0) return j; }
      return fail();
    };
    const slice = (a, b) => src.slice(T[a].s, T[b].e);
    const dedent = s => {
      const L = s.split('\n');
      if (L.length < 2) return s;
      const ind = Math.min(...L.slice(1).filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
      return L.map((l, i) => i && isFinite(ind) ? l.slice(Math.min(ind, l.match(/^\s*/)[0].length)) : l).join('\n');
    };

    function primary() {
      const t = T[p];
      if (!t) fail();
      if (t.t === 'num') { if (!/^(\d+\.?\d*|\.\d+)$/.test(t.v)) fail(); p++; return { k: 'num', v: t.v }; }
      if (t.t === 'str') { p++; return { k: 'str', v: JSON.parse(t.v) }; }
      if (isOp(t, '(')) { p++; const e = expr(0); if (!isOp(T[p], ')')) fail(); p++; return e; }
      if (isOp(t, '!')) { p++; return { k: 'not', e: primary() }; }
      if (isOp(t, '-')) { p++; return { k: 'neg', e: primary() }; }
      if (t.t === 'id') {
        p++;
        if (isOp(T[p], '(')) { p++; return { k: 'call', n: t.v, a: args() }; }
        if (T[p] && T[p].t === 'op' && ['.', '[', '->', '::'].includes(T[p].v)) fail();
        return { k: 'id', v: t.v };
      }
      return fail();
    }
    function args() {
      const a = [];
      if (!isOp(T[p], ')')) for (;;) { a.push(expr(0)); if (isOp(T[p], ',')) { p++; continue; } break; }
      if (!isOp(T[p], ')')) fail();
      p++;
      return a;
    }
    function expr(min) {
      let l = primary();
      for (;;) {
        const t = T[p], pr = t && t.t === 'op' ? PREC[t.v] : 0;
        if (!pr || pr <= min) break;
        p++;
        l = { k: 'bin', op: t.v, l, r: expr(pr) };
      }
      return l;
    }

    function fillSock(b, name, n) {
      const t = DEF[b.type].sockets[name];
      if (t === 'num' && n.k === 'num') { b.sv[name] = String(parseFloat(n.v)); return; }
      if (t === 'num' && n.k === 'neg' && n.e.k === 'num') { b.sv[name] = String(-parseFloat(n.e.v)); return; }
      if (t === 'text' && n.k === 'str') { b.sv[name] = n.v; return; }
      b.in[name] = val(n, t);
    }
    const pinOf = n => {
      if (n.k === 'num' && /^\d+$/.test(n.v)) return n.v;
      if (n.k === 'id' && !['HIGH', 'LOW', 'true', 'false'].includes(n.v)) return n.v;
      return fail();
    };
    function val(n, t) {
      switch (n.k) {
        case 'num': return mk('number', { V: String(parseFloat(n.v)) });
        case 'str': if (t !== 'text') fail(); return mk('text', { T: n.v });
        case 'id':
          if (n.v === 'true' || n.v === 'false') return mk('bool', { V: n.v });
          if (n.v === 'HIGH' || n.v === 'LOW') return mk('level', { V: n.v });
          if (!scope.includes(n.v)) useVar(n.v);
          return mk('var_get', { VAR: n.v });
        case 'not': { const b = mk('not'); fillSock(b, 'A', n.e); return b; }
        case 'neg': { const b = mk('arith', { OP: '-' }); b.sv.A = '0'; fillSock(b, 'B', n.e); return b; }
        case 'bin': {
          const b = mk(n.op === '&&' || n.op === '||' ? 'logic' : ['+', '-', '*', '/', '%'].includes(n.op) ? 'arith' : 'compare', { OP: n.op });
          fillSock(b, 'A', n.l); fillSock(b, 'B', n.r);
          return b;
        }
        case 'call': {
          const a = n.a, N = a.length;
          if ((n.n === 'digitalRead' || n.n === 'analogRead') && N === 1) return mk(n.n, { PIN: pinOf(a[0]) });
          if (n.n === 'millis' && N === 0) return mk('millis');
          if (n.n === 'map' && N === 5) { const b = mk('map'); ['V', 'A', 'B', 'C', 'D'].forEach((k, i) => fillSock(b, k, a[i])); return b; }
          if (n.n === 'constrain' && N === 3) { const b = mk('constrain'); ['V', 'A', 'B'].forEach((k, i) => fillSock(b, k, a[i])); return b; }
          if (n.n === 'random' && N === 2) {
            const b = mk('random'), hi = a[1];
            fillSock(b, 'A', a[0]);
            if (hi.k === 'num') b.sv.B = String(parseFloat(hi.v) - 1);
            else if (hi.k === 'bin' && hi.op === '+' && hi.r.k === 'num' && hi.r.v === '1') fillSock(b, 'B', hi.l);
            else fail();
            return b;
          }
          return fail();
        }
      }
      return fail();
    }

    const chain = arr => { for (let i = 0; i < arr.length - 1; i++) arr[i].next = arr[i + 1]; return arr[0] || null; };
    function skip(i) {
      const t = T[i];
      if (!t) return i;
      if (t.t !== 'op' && t.t !== 'id') return i + 1;
      if (isOp(t, '{')) return close(i) + 1;
      if (isId(t, 'if')) { let j = close(i + 1) + 1; j = skip(j); if (isId(T[j], 'else')) j = skip(j + 1); return j; }
      if (isId(t, 'for') || isId(t, 'while') || isId(t, 'switch')) return skip(close(i + 1) + 1);
      if (isId(t, 'do')) { let j = close(skip(i + 1) + 1) + 1; if (isOp(T[j], ';')) j++; return j; }
      let d = 0;
      for (let j = i; j < T.length; j++) {
        const x = T[j];
        if (x.t !== 'op') continue;
        if ('([{'.includes(x.v)) d++;
        else if (')]}'.includes(x.v)) { if (--d < 0) return j; }
        else if (x.v === ';' && d === 0) return j + 1;
      }
      return T.length;
    }
    function one(depth) {
      const s = p;
      try { return stmt(depth); } catch (e) {
        if (importCode.debug) console.warn('raw:', e && e.message);
        p = skip(s);
        if (p <= s) p = s + 1;
        raws++;
        return mk('raw', { T: dedent(slice(s, p - 1)) });
      }
    }
    function list(depth, end) {
      const out = [];
      while (p < end) { if (isOp(T[p], ';')) { p++; continue; } out.push(one(depth)); }
      return out;
    }
    function bodyOf(depth) {
      if (isOp(T[p], '{')) { const end = close(p); p++; const r = list(depth, end); p = end + 1; return r; }
      return [one(depth)];
    }
    const need = c => { if (!c) fail(); };
    const semi = () => { need(isOp(T[p], ';')); p++; };
    function stmt(depth) {
      const t = T[p];
      if (t.t === 'cmt') { p++; return mk('comment', { T: t.v }); }
      if (t.t !== 'id') return fail();
      const v = t.v, nx = T[p + 1];
      if (v === 'if') {
        p++; need(isOp(T[p], '(')); p++;
        const c = expr(0); need(isOp(T[p], ')')); p++;
        const body = bodyOf(depth);
        let els = null;
        if (isId(T[p], 'else')) { p++; els = isId(T[p], 'if') ? [stmt(depth)] : bodyOf(depth); }
        const b = mk(els ? 'ifelse' : 'if');
        fillSock(b, 'C', c);
        b.st.DO = chain(body);
        if (els) b.st.ELSE = chain(els);
        return b;
      }
      if (v === 'while') {
        p++; need(isOp(T[p], '(')); p++;
        const c = expr(0); need(isOp(T[p], ')')); p++;
        const b = mk('while');
        fillSock(b, 'C', c);
        b.st.DO = chain(bodyOf(depth));
        return b;
      }
      if (v === 'for') {
        p++; need(isOp(T[p], '(')); p++;
        need(isId(T[p], 'int')); p++;
        const nm = T[p]; need(isId(nm, LOOPV[depth])); p++;
        need(isOp(T[p], '=')); p++;
        need(T[p].t === 'num' && T[p].v === '0'); p++;
        need(isOp(T[p], ';')); p++;
        need(isId(T[p], nm.v)); p++;
        need(isOp(T[p], '<')); p++;
        const lim = expr(0);
        need(isOp(T[p], ';')); p++;
        need(isId(T[p], nm.v)); p++;
        need(isOp(T[p], '++')); p++;
        need(isOp(T[p], ')')); p++;
        scope.push(nm.v);
        let body;
        try { body = bodyOf(depth + 1); } finally { scope.pop(); }
        const b = mk('repeat');
        fillSock(b, 'N', lim);
        b.st.DO = chain(body);
        return b;
      }
      if (v === 'break' && isOp(nx, ';')) { p += 2; return mk('break'); }
      if (isOp(nx, '=') || isOp(nx, '+=') || isOp(nx, '-=') || isOp(nx, '++') || isOp(nx, '--')) {
        p += 2;
        const b = mk(nx.v === '=' ? 'var_set' : 'var_change', { VAR: v });
        if (nx.v === '=' || nx.v === '+=') fillSock(b, 'A', expr(0));
        else if (nx.v === '-=') fillSock(b, 'A', { k: 'neg', e: expr(0) });
        else b.sv.A = nx.v === '++' ? '1' : '-1';
        semi();
        if (!scope.includes(v)) useVar(v);
        return b;
      }
      let name = v, q = p + 1;
      if (isOp(T[q], '.') && isId(T[q + 1])) { name = v + '.' + T[q + 1].v; q += 2; }
      need(isOp(T[q], '('));
      p = q + 1;
      const a = args(), N = a.length;
      let b;
      const lvl = n => (n.k === 'id' && (n.v === 'HIGH' || n.v === 'LOW')) ? n.v : fail();
      if (name === 'pinMode' && N === 2) {
        need(a[1].k === 'id' && ['OUTPUT', 'INPUT', 'INPUT_PULLUP'].includes(a[1].v));
        b = mk('pinMode', { PIN: pinOf(a[0]), M: a[1].v });
      } else if (name === 'digitalWrite' && N === 2) b = mk('digitalWrite', { PIN: pinOf(a[0]), V: lvl(a[1]) });
      else if (name === 'analogWrite' && N === 2) { b = mk('analogWrite', { PIN: pinOf(a[0]) }); fillSock(b, 'A', a[1]); }
      else if (name === 'tone' && N === 3) { b = mk('tone', { PIN: pinOf(a[0]) }); fillSock(b, 'F', a[1]); fillSock(b, 'D', a[2]); }
      else if (name === 'noTone' && N === 1) b = mk('noTone', { PIN: pinOf(a[0]) });
      else if (name === 'delay' && N === 1) { b = mk('delay'); fillSock(b, 'A', a[0]); }
      else if (name === 'Serial.begin' && N === 1) { need(a[0].k === 'num' && BAUDS.some(x => x[0] === a[0].v)); b = mk('sbegin', { B: a[0].v }); }
      else if ((name === 'Serial.print' || name === 'Serial.println') && N === 1) { b = mk('sprint', { NL: name === 'Serial.println' ? '1' : '0' }); fillSock(b, 'A', a[0]); }
      else return fail();
      semi();
      return b;
    }

    function varDecl(s, e) {
      let j = s;
      let isConst = false, type = '';
      if (isId(T[j], 'const')) { isConst = true; j++; }
      if (isId(T[j], 'unsigned')) { type = 'unsigned '; j++; }
      need(isId(T[j])); type += T[j].v; j++;
      need(VTYPES.test(type));
      need(isId(T[j])); const name = T[j].v; j++;
      let init = '0';
      if (isOp(T[j], '=')) {
        j++;
        need(j < e - 1);
        for (let k = j; k < e - 1; k++) need(!(T[k].t === 'op' && (T[k].v === ',' || T[k].v === '{')) && T[k].t !== 'cmt');
        init = src.slice(T[j].s, T[e - 2].e);
        j = e - 1;
      }
      need(j === e - 1 && isOp(T[j], ';'));
      addVar(Object.assign({ name, type, init }, isConst ? { const: true } : null));
    }

    const funcs = [];
    while (p < T.length) {
      const t = T[p], s = p;
      if (t.t === 'cmt' || t.t === 'bcmt' || t.t === 'pp') { gl.push(src.slice(t.s, t.e)); p++; continue; }
      let q = p;
      while (isId(T[q])) q++;
      if (q > p && isOp(T[q], '(')) {
        const rp = close(q);
        let r = rp + 1;
        while (isId(T[r])) r++;
        if (isOp(T[r], '{')) {
          const rb = close(r), name = T[q - 1].v;
          if (q - p === 2 && T[p].v === 'void' && (name === 'setup' || name === 'loop') && rp === q + 1) funcs.push({ name, from: r + 1, to: rb });
          else gl.push(dedent(slice(s, rb)));
          p = rb + 1;
          continue;
        }
      }
      let e = skip(p);
      if (e <= p) e = p + 1;
      try { varDecl(s, e); } catch (err) { gl.push(dedent(slice(s, e - 1))); }
      p = e;
    }

    const bodies = {};
    for (const f of funcs) {
      p = f.from; scope = [];
      bodies[f.name] = (bodies[f.name] || []).concat(list(0, f.to));
    }

    const x = 420, mkTop = (type, name, arr) => {
      const b = mk(type);
      if (name) b.st.DO = chain(arr);
      return b;
    };
    const tops = [];
    if (gl.length) tops.push(mk('gtop', { T: gl.join('\n') }));
    tops.push(mkTop('setup', 1, bodies.setup || []), mkTop('loop', 1, bodies.loop || []));
    return {
      ok: true,
      raw: raws + gl.length,
      state: { v: 1, vars, tops: tops.map((b, i) => ({ x, y: 40 + i * 150, b: ser(b) })) }
    };
  }

  /* ───────────── ادیتور ───────────── */
  function create(container, opts) {
    opts = Object.assign({ rtl: true, pins: null, codePreview: true, storageKey: null, onChange: null, state: null }, opts || {});
    const RTL = !!opts.rtl;
    const PINS = opts.pins || (() => { const a = []; for (let i = 0; i <= 13; i++) a.push(String(i)); for (let i = 0; i <= 5; i++) a.push('A' + i); return a; })();

    const ALWAYS = new Set(['setup', 'loop', 'comment', 'delay', 'number']);
    const okType = t => !opts.allow || ALWAYS.has(t) || opts.allow.includes(t);
    const flyList = id => (FLY[id] || []).filter(okType);
    const catOn = id => id === 'vars' ? ['var_set', 'var_change', 'var_get'].some(okType) : flyList(id).length > 0;
    let state = { vars: [], tops: [] };
    const view = { x: 0, y: 0, z: 1 };
    let selId = null, flyCat = 'pins', hist = [], hp = -1, drag = null, press = null, stagger = 0, needInit = true, narrow = false, destroyed = false;

    /* DOM */
    const root = h('div', { class: 'be-editor ' + (RTL ? 'be-rtl' : 'be-ltr'), tabindex: '0' });
    const bar = h('div', { class: 'be-bar' });
    const main = h('div', { class: 'be-main' });
    const rail = h('div', { class: 'be-rail' });
    const flyIn = h('div', { class: 'be-fly-in' });
    const fly = h('div', { class: 'be-fly' }, flyIn);
    const ws = h('div', { class: 'be-ws' });
    const world = h('div', { class: 'be-world' });
    const trash = h('div', { class: 'be-trash', title: 'برای حذف، بلوک را اینجا رها کنید', html: ICON.trash });
    const codeEl = h('pre', { class: 'be-code-pre' });
    const codeCopy = h('button', { class: 'be-ibtn', title: 'کپی کد', html: ICON.copy, onclick: () => { try { navigator.clipboard.writeText(codeEl.textContent); } catch (e) { /* ignore */ } } });
    const codePanel = h('div', { class: 'be-code', hidden: true },
      h('div', { class: 'be-code-head' }, h('span', { text: 'کد Arduino' }), h('span', { class: 'be-sp' }), codeCopy,
        h('button', { class: 'be-ibtn', title: 'بستن', html: ICON.close, onclick: () => toggleCode(false) })),
      codeEl);
    main.append(rail, fly, ws);
    root.append(main);
    container.append(root);

    /* نوار ابزار */
    const mkBtn = (ic, title, fn) => h('button', { class: 'be-ibtn', title, html: ICON[ic], onclick: fn });
    const bUndo = mkBtn('undo', 'واگرد (Ctrl+Z)', () => undo());
    const bRedo = mkBtn('redo', 'ازنو (Ctrl+Y)', () => redo());
    const zoomLbl = h('button', { class: 'be-zl', title: 'اندازه‌ی ۱۰۰٪', text: '100%', onclick: () => zoomAt(ws.clientWidth / 2, ws.clientHeight / 2, 1) });
    const bCode = mkBtn('code', 'نمایش کد', () => toggleCode());
    bar.className = 'be-float';
    bar.append(bUndo, bRedo, mkBtn('sort', 'مرتب‌سازی بلوک‌ها', () => cleanUp()), opts.codePreview ? bCode : null);
    const cx = () => ws.clientWidth / 2, cy = () => ws.clientHeight / 2;
    const zb = (ic, title, fn) => h('button', { class: 'be-zb', title, html: ICON[ic], onclick: fn });
    const zoomBox = h('div', { class: 'be-zoom' },
      zb('target', 'نمایش همه‌ی بلوک‌ها', () => fitView()),
      zb('zplus', 'بزرگ‌نمایی', () => zoomAt(cx(), cy(), view.z * 1.2)),
      zb('zminus', 'کوچک‌نمایی', () => zoomAt(cx(), cy(), view.z / 1.2)));
    const sbH = h('div', { class: 'be-sb be-sb-h' }), sbV = h('div', { class: 'be-sb be-sb-v' });
    ws.append(world, sbH, sbV, zoomBox, trash, codePanel, bar);

    /* رِیل دسته‌ها */
    const catBtns = {};
    CATS.forEach(c => {
      const b = h('button', { class: 'be-cat cat-' + c.cls, onclick: () => pickCat(c.id) }, h('i'), h('span', { text: c.name }));
      if (!catOn(c.id)) b.style.display = 'none';
      catBtns[c.id] = b; rail.append(b);
    });

    /* ─── helpers مدل/مکان‌یابی ─── */
    function locate(target) {
      for (let i = 0; i < state.tops.length; i++) {
        const t = state.tops[i];
        if (t.b === target) return { k: 'top', i };
        const r = findIn(t.b, target);
        if (r) return r;
      }
      return null;
    }
    function findIn(b, target) {
      for (let c = b; c; c = c.next) {
        for (const n in c.in) if (c.in[n]) { if (c.in[n] === target) return { k: 'in', p: c, n }; const r = findIn(c.in[n], target); if (r) return r; }
        for (const n in c.st) if (c.st[n]) { if (c.st[n] === target) return { k: 'st', p: c, n }; const r = findIn(c.st[n], target); if (r) return r; }
        if (c.next === target) return { k: 'next', p: c };
      }
      return null;
    }
    function detach(b) {
      const l = locate(b);
      if (!l) return;
      if (l.k === 'top') state.tops.splice(l.i, 1);
      else if (l.k === 'next') l.p.next = null;
      else if (l.k === 'st') l.p.st[l.n] = null;
      else l.p.in[l.n] = null;
    }
    function deleteBlock(b) {
      const l = locate(b);
      if (!l) return;
      if (l.k === 'top') { if (b.next) state.tops[l.i].b = b.next; else state.tops.splice(l.i, 1); }
      else if (l.k === 'next') l.p.next = b.next;
      else if (l.k === 'st') l.p.st[l.n] = b.next;
      else l.p.in[l.n] = null;
    }
    const byId = id => { let r = null; state.tops.forEach(t => visit(t.b, c => { if (c.id === id) r = c; })); return r; };
    const selected = () => (selId ? byId(selId) : null);
    function fixVars(b) {
      visit(b, c => { if ('VAR' in c.f && !c.f.VAR && state.vars.length) c.f.VAR = state.vars[0].name; });
      return b;
    }
    function ensureVars() {
      const seen = new Set();
      state.tops.forEach(t => visit(t.b, c => {
        if (!c.f.VAR) return;
        seen.add(c.f.VAR);
        if (!state.vars.some(v => v.name === c.f.VAR)) state.vars.push({ name: c.f.VAR, type: 'int', init: '0', ext: true });
      }));
      state.vars = state.vars.filter(v => !v.ext || seen.has(v.name));
    }

    /* ─── رندر ─── */
    function renderItem(b, it, ctx) {
      if (typeof it === 'string') return h('span', { class: 'be-lbl', text: it });
      if (it.x) return h('span', { class: 'be-hint', text: it.x });
      if (it.n) return renderSocket(b, it, ctx);
      return renderField(b, it, ctx);
    }
    function inputEl(get, set, kind) {
      const inp = h('input', { type: 'text', size: '1', class: 'be-in be-in-' + kind, value: get(), spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', inputmode: kind === 'num' ? 'decimal' : 'text', dir: kind === 'num' ? 'ltr' : 'auto' });
      const wrap = h('span', { class: 'be-inwrap' }, inp);
      wrap.dataset.v = get();
      inp.addEventListener('input', () => {
        if (kind === 'num') { const c = inp.value.replace(/[^0-9۰-۹٠-٩.,٫\-−]/g, ''); if (c !== inp.value) inp.value = c; }
        wrap.dataset.v = inp.value;
      });
      inp.addEventListener('change', () => {
        let v = inp.value;
        if (kind === 'num') { const n = normNum(v); v = n == null ? get() : n; inp.value = v; wrap.dataset.v = v; }
        if (v !== get()) { set(v); commit(); }
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); e.stopPropagation(); });
      return wrap;
    }
    function renderSocket(b, it, ctx) {
      const s = h('span', { class: 'be-socket be-s-' + it.t });
      s.__owner = b; s.__name = it.n; s.__t = it.t;
      const child = b.in[it.n];
      if (child) { s.classList.add('has'); s.append(renderBlock(child, ctx)); }
      else if (it.t !== 'bool') s.append(inputEl(() => b.sv[it.n], v => { b.sv[it.n] = v; }, it.t === 'num' ? 'num' : 'text'));
      return s;
    }
    function renderField(b, it) {
      if (it.t === 'check') {
        const c = h('span', { class: 'be-chk' + (b.f[it.f] === '1' ? ' on' : ''), role: 'checkbox' });
        c.addEventListener('click', () => { b.f[it.f] = b.f[it.f] === '1' ? '0' : '1'; c.classList.toggle('on'); commit(); });
        return c;
      }
      if (it.t === 'num' || it.t === 'text') return inputEl(() => b.f[it.f], v => { b.f[it.f] = v; }, it.t);
      if (it.t === 'area') {
        const ta = h('textarea', { class: 'be-area', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', dir: 'ltr', placeholder: 'کد C++ ...' });
        ta.value = b.f[it.f];
        const fit = () => { ta.rows = Math.max(2, Math.min(14, ta.value.split('\n').length)); };
        fit();
        ta.addEventListener('input', fit);
        ta.addEventListener('change', () => { if (ta.value !== b.f[it.f]) { b.f[it.f] = ta.value; commit(); } });
        ta.addEventListener('keydown', e => e.stopPropagation());
        return ta;
      }
      let opts2;
      if (it.t === 'drop') opts2 = it.o;
      else if (it.t === 'pin') opts2 = PINS.map(p => [p, p]).concat(state.vars.filter(v => !v.ext).map(v => [v.name, v.name]));
      else opts2 = state.vars.length ? state.vars.map(v => [v.name, v.name]) : [['—', '']];
      const sel = h('select', { class: 'be-sel' }, opts2.map(([l, v]) => h('option', { value: v, text: l })));
      if (!opts2.some(o => o[1] === b.f[it.f])) sel.append(h('option', { value: b.f[it.f], text: b.f[it.f] || '—' }));
      sel.value = b.f[it.f];
      if (DEF[b.type].ltr) sel.dir = 'ltr';
      const wrap = h('span', { class: 'be-selwrap' }, sel);
      const lab = () => { const o = sel.options[sel.selectedIndex]; wrap.dataset.v = o ? o.text : ''; };
      lab();
      sel.addEventListener('change', () => { b.f[it.f] = sel.value; lab(); commit(); });
      sel.addEventListener('keydown', e => e.stopPropagation());
      return wrap;
    }
    function renderSlot(b, name, ctx) {
      const s = h('div', { class: 'be-slot' });
      s.__owner = b; s.__name = name;
      if (b.st[name]) s.append(renderStack(b.st[name], ctx));
      return s;
    }
    function renderBlock(b, ctx) {
      const d = DEF[b.type];
      const el = h('div', { class: `be-block be-${d.kind} cat-${d.cat}${d.out === 'bool' ? ' be-bool' : ''}${d.ltr ? ' be-op' : ''}` });
      el.__b = b; el.dataset.id = b.id;
      d.rows.forEach((row, i) => {
        if (!Array.isArray(row)) {
          el.append(renderSlot(b, row.stmt, ctx));
          if (i === d.rows.length - 1) el.append(h('div', { class: 'be-foot' }));
          return;
        }
        const r = h('div', { class: 'be-row' + (i > 0 ? ' be-row-mid' : '') });
        row.forEach(it => r.append(renderItem(b, it, ctx)));
        el.append(r);
      });
      return el;
    }
    function renderStack(first, ctx) {
      const s = h('div', { class: 'be-stack' });
      if (first && DEF[first.type].kind === 'value') { s.append(renderBlock(first, ctx)); return s; }
      for (let b = first; b; b = b.next) s.append(renderBlock(b, ctx));
      return s;
    }
    function render() {
      const keep = ws.scrollTop;
      world.textContent = '';
      for (const t of state.tops) {
        const top = h('div', { class: 'be-top' + (DEF[t.b.type].kind === 'hat' ? '' : ' be-orphan') });
        top.style.left = t.x + 'px'; top.style.top = t.y + 'px';
        top.__top = t;
        if (DEF[t.b.type].kind !== 'hat') top.title = 'این بلوک به هیچ «شروع» یا «تکرار» وصل نیست و اجرا نمی‌شود';
        top.append(renderStack(t.b, {}));
        world.append(top);
      }
      ws.scrollTop = keep;
      markSel();
      updateBars();
    }
    function markSel() {
      world.querySelectorAll('.be-picked').forEach(e => e.classList.remove('be-picked'));
      if (selId) { const e = world.querySelector(`.be-block[data-id="${selId}"]`); if (e) e.classList.add('be-picked'); }
    }
    function select(b) { selId = b ? b.id : null; markSel(); }

    /* ─── فلای‌اوت ─── */
    function pickCat(id) {
      if (narrow && id === flyCat && !fly.classList.contains('closed')) { fly.classList.add('closed'); syncCatBtns(); return; }
      flyCat = id; fly.classList.remove('closed'); buildFly(); syncCatBtns();
    }
    function syncCatBtns() {
      CATS.forEach(c => catBtns[c.id].classList.toggle('on', c.id === flyCat && !(narrow && fly.classList.contains('closed'))));
    }
    function flyBlock(type, f) {
      const b = fixVars(mk(type, f));
      const el = renderBlock(b, { flyout: true });
      const w = h('div', { class: 'be-fly-item' }, el);
      w.addEventListener('pointerdown', e => { if (e.button > 0) return; beginPress(e, el, true); });
      return w;
    }
    function buildFly() {
      flyIn.textContent = '';
      if (flyCat === 'vars') {
        flyIn.append(h('button', { class: 'be-btn be-pri be-wide', text: '＋ ساخت متغیر', onclick: () => askVar({ title: 'متغیر جدید', ok: 'ساخت' }, (name, type) => { state.vars.push({ name, type, init: '0' }); commit(); }) }));
        if (!state.vars.length) flyIn.append(h('div', { class: 'be-empty', text: 'هنوز متغیری نساخته‌اید. با دکمه‌ی بالا یکی بسازید.' }));
        state.vars.forEach(v => {
          const ini = v.ext ? null : h('input', { class: 'be-vinit', type: 'text', size: '4', value: v.init, dir: 'ltr', title: 'مقدار اولیه', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off' });
          if (ini) {
            ini.addEventListener('change', () => { v.init = ini.value.trim() || '0'; commit(); });
            ini.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') ini.blur(); });
          }
          flyIn.append(h('div', { class: 'be-varrow' }, okType('var_get') ? flyBlock('var_get', { VAR: v.name }) : h('b', { text: v.name }),
            h('span', { class: 'be-vartype', text: v.ext ? 'محلی' : v.type }), ini,
            h('button', { class: 'be-ibtn be-sm', title: 'تغییر نام', html: ICON.edit, onclick: () => askVar({ title: 'تغییر نام متغیر', name: v.name, withType: false, ok: 'ذخیره' }, n => renameVar(v.name, n)) }),
            h('button', { class: 'be-ibtn be-sm', title: 'حذف متغیر', html: ICON.trash, onclick: () => deleteVar(v.name) })));
        });
        ['var_set', 'var_change'].forEach(t => { if (state.vars.length && okType(t)) flyIn.append(flyBlock(t)); });
        return;
      }
      flyList(flyCat).forEach(t => flyIn.append(flyBlock(t)));
    }
    function renameVar(old, n) {
      state.vars.forEach(v => { if (v.name === old) v.name = n; });
      state.tops.forEach(t => visit(t.b, c => { if (c.f.VAR === old) c.f.VAR = n; if (c.f.PIN === old) c.f.PIN = n; }));
      commit();
    }
    function deleteVar(name) {
      const users = [];
      state.tops.forEach(t => visit(t.b, c => { if (c.f.VAR === name) users.push(c); }));
      const go = () => { users.forEach(deleteBlock); state.vars = state.vars.filter(v => v.name !== name); commit(); };
      if (!users.length) go();
      else confirmBox(`متغیر «${name}» در ${users.length} بلوک استفاده شده. حذف شود؟`, go);
    }

    /* ─── پنجره‌ها و منو ─── */
    function validName(n, old) {
      if (!n) return 'نام را وارد کنید';
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n)) return 'فقط حروف انگلیسی، عدد و _ (بدون فاصله و شروع با حرف)';
      if (RESERVED.has(n)) return 'این نام در Arduino رزرو شده است';
      if (state.vars.some(v => v.name === n && n !== old)) return 'این نام قبلاً استفاده شده';
      return '';
    }
    function modal(card) {
      const m = h('div', { class: 'be-modal' }, card);
      m.addEventListener('pointerdown', e => { if (e.target === m) m.remove(); });
      root.append(m);
      return m;
    }
    function askVar(o, cb) {
      const old = o.name || '';
      const inp = h('input', { class: 'be-m-in', type: 'text', maxlength: '24', value: old, dir: 'ltr', placeholder: 'مثلاً counter', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
      const sel = h('select', { class: 'be-m-in' }, h('option', { value: 'int', text: 'عدد صحیح (int)' }), h('option', { value: 'float', text: 'عدد اعشاری (float)' }));
      const err = h('div', { class: 'be-m-err' });
      const submit = () => { const n = inp.value.trim(), e = validName(n, old); if (e) { err.textContent = e; return; } m.remove(); cb(n, sel.value); };
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') submit(); if (e.key === 'Escape') m.remove(); });
      const m = modal(h('div', { class: 'be-m-card' }, h('div', { class: 'be-m-title', text: o.title }), inp, o.withType === false ? null : sel, err,
        h('div', { class: 'be-m-btns' }, h('button', { class: 'be-btn be-pri', text: o.ok, onclick: submit }), h('button', { class: 'be-btn', text: 'انصراف', onclick: () => m.remove() }))));
      inp.focus();
    }
    function confirmBox(msg, yes) {
      const m = modal(h('div', { class: 'be-m-card' }, h('div', { class: 'be-m-title', text: msg }),
        h('div', { class: 'be-m-btns' }, h('button', { class: 'be-btn be-danger', text: 'حذف', onclick: () => { m.remove(); yes(); } }), h('button', { class: 'be-btn', text: 'انصراف', onclick: () => m.remove() }))));
    }
    let menuEl = null;
    function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
    function openMenu(x, y, items) {
      closeMenu();
      menuEl = h('div', { class: 'be-menu' }, items.map(it => h('button', { class: 'be-mi' + (it.danger ? ' be-danger' : ''), text: it.label, onclick: () => { closeMenu(); it.fn(); } })));
      root.append(menuEl);
      const r = menuEl.getBoundingClientRect();
      menuEl.style.left = clamp(x, 6, innerWidth - r.width - 6) + 'px';
      menuEl.style.top = clamp(y, 6, innerHeight - r.height - 6) + 'px';
      setTimeout(() => window.addEventListener('pointerdown', closeMenu, { once: true, capture: true }), 0);
    }
    function blockMenu(b, x, y) {
      select(b);
      openMenu(x, y, [
        { label: 'تکثیر', fn: () => duplicate(b) },
        { label: 'حذف این بلوک', danger: true, fn: () => { deleteBlock(b); selId = null; commit(); } }
      ]);
    }
    function wsMenu(x, y) {
      openMenu(x, y, [
        { label: 'مرتب‌سازی بلوک‌ها', fn: () => cleanUp() },
        { label: 'نمایش همه', fn: fitView },
        { label: 'پاک‌کردن همه‌ی بلوک‌ها', danger: true, fn: () => confirmBox('همه‌ی بلوک‌ها پاک شوند؟', () => { clear(); }) }
      ]);
    }
    function duplicate(b) {
      const el = world.querySelector(`.be-block[data-id="${b.id}"]`);
      const nb = cloneBlock(b, false), p = el ? worldOf(el.getBoundingClientRect()) : { x: 60, y: 60 };
      state.tops.push({ x: p.x + 24, y: p.y + 24, b: nb });
      selId = nb.id; commit();
    }

    /* ─── نما، زوم و پن ─── */
    const wsRect = () => ws.getBoundingClientRect();
    const startX = r => (RTL ? r.right : r.left);
    function worldOf(r) { const w = wsRect(); return { x: (startX(r) - w.left - view.x) / view.z, y: (r.top - w.top - view.y) / view.z }; }
    function setView(x, y, z) {
      view.x = x; view.y = y; view.z = clamp(z, 0.4, 1.8);
      world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.z})`;
      ws.style.backgroundPosition = `${view.x}px ${view.y}px`;
      ws.style.backgroundSize = `${24 * view.z}px ${24 * view.z}px`;
      zoomLbl.textContent = Math.round(view.z * 100) + '%';
      updateBars();
    }
    let sbRaf = 0;
    function updateBars() {
      if (sbRaf) return;
      sbRaf = requestAnimationFrame(() => {
        sbRaf = 0;
        if (destroyed) return;
        const w = wsRect();
        if (!w.width) return;
        let x0 = w.left, y0 = w.top, x1 = w.right, y1 = w.bottom;
        world.querySelectorAll('.be-block').forEach(el => {
          const r = el.getBoundingClientRect();
          x0 = Math.min(x0, r.left - 80); x1 = Math.max(x1, r.right + 80); y0 = Math.min(y0, r.top - 80); y1 = Math.max(y1, r.bottom + 80);
        });
        const tw = x1 - x0, th = y1 - y0, hOn = tw > w.width + 2, vOn = th > w.height + 2;
        sbH.style.display = hOn ? 'block' : 'none'; sbV.style.display = vOn ? 'block' : 'none';
        if (hOn) { sbH.style.width = (w.width / tw * 100) + '%'; sbH.style.left = ((w.left - x0) / tw * 100) + '%'; }
        if (vOn) { sbV.style.height = (w.height / th * 100) + '%'; sbV.style.top = ((w.top - y0) / th * 100) + '%'; }
      });
    }
    function zoomAt(cx, cy, nz) {
      nz = clamp(nz, 0.4, 1.8);
      const k = nz / view.z;
      setView(cx - (cx - view.x) * k, cy - (cy - view.y) * k, nz);
    }
    function fitView() {
      const tops = [...world.querySelectorAll('.be-block')];
      if (!tops.length) { initView(); return; }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const w = wsRect();
      tops.forEach(t => {
        const r = t.getBoundingClientRect();
        x0 = Math.min(x0, (r.left - w.left - view.x) / view.z); x1 = Math.max(x1, (r.right - w.left - view.x) / view.z);
        y0 = Math.min(y0, (r.top - w.top - view.y) / view.z); y1 = Math.max(y1, (r.bottom - w.top - view.y) / view.z);
      });
      const z = clamp(Math.min(1, (w.width - 60) / (x1 - x0), (w.height - 60) / (y1 - y0)), 0.4, 1);
      setView((w.width - (x1 - x0) * z) / 2 - x0 * z, 30 - y0 * z, z);
    }
    function initView() {
      const W = ws.clientWidth || 600;
      setView(RTL ? W - 40 - 420 : 0, 0, 1);
    }
    const hatPos = () => [{ x: RTL ? 420 : 40, y: 40 }, { x: RTL ? 420 : 40, y: 190 }];
    function defaultState() {
      const [a, b] = hatPos();
      return { vars: [], tops: [{ ...a, b: ser(mk('setup')) }, { ...b, b: ser(mk('loop')) }] };
    }
    function cleanUp(quiet) {
      const tops = [...state.tops].sort((a, b) => a.y - b.y || a.x - b.x);
      const els = new Map([...world.querySelectorAll('.be-top')].map(e => [e.__top, e]));
      const x = tops.length ? tops[0].x : 40;
      let y = 40;
      tops.forEach(t => { t.x = x; t.y = y; y += (els.get(t) ? els.get(t).offsetHeight : 80) + 28; });
      if (quiet) { hist[hp] = snap(); afterChange(false); } else commit();
      fitView();
    }
    ws.addEventListener('wheel', e => {
      e.preventDefault();
      const w = wsRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - w.left, e.clientY - w.top, view.z * Math.exp(-e.deltaY * 0.0015));
      else setView(view.x - e.deltaX, view.y - e.deltaY, view.z);
    }, { passive: false });

    const ptrs = new Map();
    function beginPan(e) {
      select(null); closeMenu();
      ws.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      ws.classList.add('be-panning');
    }
    ws.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      if (ptrs.size === 1) setView(view.x + e.clientX - p.x, view.y + e.clientY - p.y, view.z);
      else if (ptrs.size === 2) {
        const o = [...ptrs.entries()].find(([id]) => id !== e.pointerId)[1];
        const d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
        const m0 = { x: (p.x + o.x) / 2, y: (p.y + o.y) / 2 }, m1 = { x: (e.clientX + o.x) / 2, y: (e.clientY + o.y) / 2 };
        const w = wsRect();
        const nz = clamp(view.z * (d0 ? d1 / d0 : 1), 0.4, 1.8), k = nz / view.z;
        setView(m1.x - w.left - (m0.x - w.left - view.x) * k, m1.y - w.top - (m0.y - w.top - view.y) * k, nz);
      }
      p.x = e.clientX; p.y = e.clientY;
    });
    const endPan = e => { ptrs.delete(e.pointerId); if (!ptrs.size) ws.classList.remove('be-panning'); };
    ws.addEventListener('pointerup', endPan);
    ws.addEventListener('pointercancel', endPan);
    ws.addEventListener('contextmenu', e => {
      e.preventDefault();
      const be = e.target.closest('.be-block');
      if (be && world.contains(be)) blockMenu(be.__b, e.clientX, e.clientY); else wsMenu(e.clientX, e.clientY);
    });
    ws.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      if (e.target.closest('.be-trash,.be-code,.be-float,.be-zoom')) return;
      root.focus({ preventScroll: true });
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { const be = e.target.closest('.be-block'); if (be) select(be.__b); return; }
      const be = e.target.closest('.be-block');
      if (be && world.contains(be)) beginPress(e, be, false); else beginPan(e);
    });

    /* ─── درگ و اسنپ ─── */
    function beginPress(e, el, isFly) {
      closeMenu();
      press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, el, fly: isFly, type: e.pointerType, timer: null };
      if (!isFly) press.timer = setTimeout(() => {
        if (!press || drag) return;
        const p = press; endPress(); blockMenu(p.el.__b, p.x0, p.y0);
      }, 650);
      window.addEventListener('pointermove', onPressMove, { passive: false });
      window.addEventListener('pointerup', onPressUp);
      window.addEventListener('pointercancel', onPressCancel);
    }
    function endPress() {
      if (press && press.timer) clearTimeout(press.timer);
      press = null;
      window.removeEventListener('pointermove', onPressMove);
      window.removeEventListener('pointerup', onPressUp);
      window.removeEventListener('pointercancel', onPressCancel);
    }
    function onPressMove(e) {
      if (!press || e.pointerId !== press.id) return;
      if (!drag) {
        const dx = e.clientX - press.x0, dy = e.clientY - press.y0;
        if (Math.hypot(dx, dy) < 6) return;
        if (press.timer) { clearTimeout(press.timer); press.timer = null; }
        if (press.fly && press.type === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.2) { endPress(); return; }
        startDrag(e);
      }
      if (drag) { e.preventDefault(); moveDrag(e); }
    }
    function onPressUp(e) {
      if (!press || e.pointerId !== press.id) return;
      const p = press;
      if (drag) finishDrag(e); else if (p.fly) tapAdd(p.el.__b); else select(p.el.__b);
      endPress();
    }
    function onPressCancel(e) {
      if (!press || e.pointerId !== press.id) return;
      if (drag) cancelDrag();
      endPress();
    }
    function startDrag(e) {
      const r = press.el.getBoundingClientRect();
      let head;
      if (press.fly) {
        head = cloneBlock(press.el.__b, false);
        if (narrow) { fly.classList.add('closed'); syncCatBtns(); }
      } else {
        head = press.el.__b;
        detach(head);
        selId = head.id;
        render();
      }
      const d = DEF[head.type];
      const scale = press.fly ? 1 : view.z;
      const ghost = h('div', { class: 'be-ghost' }, renderStack(head, { ghost: true }));
      ghost.style.transform = `scale(${view.z})`;
      root.append(ghost);
      const marker = h('div', { class: 'be-marker' });
      root.append(marker);
      drag = {
        head, last: lastOf(head), kind: d.kind, out: d.out, ghost, marker,
        gx: (RTL ? r.right - e.clientX : e.clientX - r.left) / scale, gy: (e.clientY - r.top) / scale,
        targets: [], best: null, hot: null, fromFly: press.fly
      };
      drag.lastCap = DEF[drag.last.type].kind === 'cap';
      drag.targets = collectTargets();
      root.classList.add('be-dragging');
    }
    function collectTargets() {
      const T = [];
      const R = el => el.getBoundingClientRect();
      if (drag.kind === 'value') {
        world.querySelectorAll('.be-socket').forEach(s => {
          if (!accepts(s.__t, drag.out)) return;
          const r = R(s); T.push({ k: 'sock', el: s, owner: s.__owner, name: s.__name, x: startX(r), y: r.top + r.height / 2 });
        });
        return T;
      }
      if (drag.kind === 'hat') return T;
      world.querySelectorAll('.be-block.be-stmt').forEach(el => {
        const b = el.__b;
        if (drag.lastCap && b.next) return;
        const r = R(el); T.push({ k: 'after', b, x: startX(r), y: r.bottom });
      });
      world.querySelectorAll('.be-slot').forEach(s => {
        if (drag.lastCap && s.__owner.st[s.__name]) return;
        const r = R(s); T.push({ k: 'slot', owner: s.__owner, name: s.__name, x: startX(r), y: r.top });
      });
      if (!drag.lastCap) world.querySelectorAll('.be-top').forEach(el => {
        const t = el.__top, k = DEF[t.b.type].kind;
        if (k === 'stmt') { const r = R(el); T.push({ k: 'before', top: t, x: startX(r), y: r.top }); }
      });
      return T;
    }
    function moveDrag(e) {
      const gw = drag.ghost.offsetWidth * view.z;
      drag.ghost.style.left = (RTL ? e.clientX + drag.gx * view.z - gw : e.clientX - drag.gx * view.z) + 'px';
      drag.ghost.style.top = (e.clientY - drag.gy * view.z) + 'px';
      const w = wsRect(), t = trash.getBoundingClientRect();
      const inWs = e.clientX >= w.left && e.clientX <= w.right && e.clientY >= w.top && e.clientY <= w.bottom;
      const onTrash = e.clientX >= t.left && e.clientX <= t.right && e.clientY >= t.top && e.clientY <= t.bottom;
      drag.del = !inWs || onTrash;
      root.classList.toggle('be-delmode', drag.del);
      trash.classList.toggle('be-hot', drag.del);
      const gr = drag.ghost.getBoundingClientRect();
      let best = null, bd = 46;
      if (!drag.del) for (const t2 of drag.targets) {
        const py = drag.kind === 'value' ? gr.top + gr.height / 2 : t2.k === 'before' ? gr.bottom : gr.top;
        const d = Math.hypot(startX(gr) - t2.x, py - t2.y);
        if (d < bd) { bd = d; best = t2; }
      }
      if (best !== drag.best) {
        if (drag.hot) drag.hot.classList.remove('be-hot');
        drag.hot = null; drag.best = best;
        drag.marker.style.display = 'none';
        if (best) {
          if (best.k === 'sock') { best.el.classList.add('be-hot'); drag.hot = best.el; }
          else {
            const wd = 90 * view.z;
            drag.marker.style.display = 'block';
            drag.marker.style.width = wd + 'px';
            drag.marker.style.left = (RTL ? best.x - wd : best.x) + 'px';
            drag.marker.style.top = (best.y - 2) + 'px';
          }
        }
      }
    }
    function dropFinish() {
      if (drag.hot) drag.hot.classList.remove('be-hot');
      drag.ghost.remove(); drag.marker.remove();
      root.classList.remove('be-dragging', 'be-delmode'); trash.classList.remove('be-hot');
      drag = null;
    }
    function finishDrag() {
      const D = drag, gr = D.ghost.getBoundingClientRect(), best = D.best;
      const pos = worldOf(gr);
      dropFinish();
      if (D.del) { selId = null; commit(); return; }
      const head = D.head;
      if (best) {
        if (best.k === 'sock') {
          const old = best.owner.in[best.name];
          best.owner.in[best.name] = head;
          if (old) { const p = worldOf(best.el.getBoundingClientRect()); state.tops.push({ x: p.x + 20, y: p.y + 34, b: old }); }
        } else if (best.k === 'after') { D.last.next = best.b.next; best.b.next = head; }
        else if (best.k === 'slot') { D.last.next = best.owner.st[best.name]; best.owner.st[best.name] = head; }
        else if (best.k === 'before') { D.last.next = best.top.b; best.top.b = head; best.top.x = pos.x; best.top.y = pos.y; }
      } else state.tops.push({ x: pos.x, y: pos.y, b: head });
      selId = head.id;
      commit();
    }
    function cancelDrag() {
      dropFinish();
      restore(hist[hp]); afterChange(false);
    }
    function firstEmptySocket(b, out) {
      for (const row of DEF[b.type].rows) {
        if (!Array.isArray(row)) continue;
        for (const it of row) if (it && it.n && !b.in[it.n] && accepts(it.t, out)) return { owner: b, name: it.n };
      }
      return null;
    }
    function tapAdd(tpl) {
      const nb = cloneBlock(tpl, false), d = DEF[nb.type], sel = selected();
      let placed = false;
      if (sel) {
        const sd = DEF[sel.type];
        if (d.kind === 'value') {
          const s = firstEmptySocket(sel, d.out);
          if (s) { s.owner.in[s.name] = nb; placed = true; }
        } else if (d.kind === 'stmt' || d.kind === 'cap') {
          const slot = Object.keys(sel.st).find(k => !sel.st[k]);
          if (slot) { sel.st[slot] = nb; placed = true; }
          else if (sd.kind === 'stmt' && (d.kind !== 'cap' || !sel.next)) { nb.next = sel.next; sel.next = nb; placed = true; }
        }
      }
      if (!placed) {
        const w = wsRect(), n = (stagger++) % 6;
        state.tops.push({ x: ((RTL ? w.width - 60 - n * 18 : 40 + n * 18) - view.x) / view.z, y: (60 + n * 28 - view.y) / view.z, b: nb });
      }
      selId = nb.id;
      if (narrow) { fly.classList.add('closed'); syncCatBtns(); }
      commit();
    }

    /* ─── تاریخچه، ذخیره، خروجی ─── */
    const serState = () => ({ v: 1, vars: state.vars, tops: state.tops.map(t => ({ x: Math.round(t.x), y: Math.round(t.y), b: ser(t.b) })) });
    const snap = () => JSON.stringify(serState());
    function pushHist() {
      const s = snap();
      if (hist[hp] === s) return false;
      hist = hist.slice(0, hp + 1); hist.push(s);
      if (hist.length > 120) hist.shift();
      hp = hist.length - 1;
      return true;
    }
    function loadState(o, keepView) {
      state = { vars: [], tops: [] };
      (o.vars || []).forEach(v => { if (v && /^[A-Za-z_]\w*$/.test(v.name)) state.vars.push(Object.assign({ name: v.name, type: VTYPES.test(v.type) ? v.type : 'int', init: v.init == null || v.init === '' ? '0' : String(v.init) }, v.const ? { const: true } : null, v.ext ? { ext: true } : null)); });
      (o.tops || []).forEach(t => { const b = des(t.b); if (b) state.tops.push({ x: +t.x || 0, y: +t.y || 0, b }); });
      ensureVars();
      selId = null;
      if (!keepView && o.view) { setView(+o.view.x || 0, +o.view.y || 0, +o.view.z || 1); needInit = false; }
    }
    const restore = s => loadState(JSON.parse(s), true);
    function updateCode() {
      const code = generate(state);
      codeEl.textContent = code;
      return code;
    }
    function afterChange(emit = true) {
      render();
      if (flyCat === 'vars') buildFly();
      const code = updateCode();
      bUndo.disabled = hp <= 0; bRedo.disabled = hp >= hist.length - 1;
      if (opts.storageKey) { try { localStorage.setItem(opts.storageKey, JSON.stringify(getState())); } catch (e) { /* ignore */ } }
      if (emit && opts.onChange) { try { opts.onChange({ code, state: getState() }); } catch (e) { console.error(e); } }
    }
    function commit() { pushHist(); afterChange(); }
    function undo() { if (hp > 0) { hp--; restore(hist[hp]); afterChange(); } }
    function redo() { if (hp < hist.length - 1) { hp++; restore(hist[hp]); afterChange(); } }
    function clear() { loadState(defaultState(), true); commit(); initView(); }
    function getState() { const s = serState(); s.view = { x: Math.round(view.x), y: Math.round(view.y), z: +view.z.toFixed(2) }; return s; }
    function setState(o) { loadState(o || defaultState(), false); hist = []; hp = -1; pushHist(); afterChange(); }
    function toggleCode(on) {
      const show = on == null ? codePanel.hidden : on;
      codePanel.hidden = !show;
      bCode.classList.toggle('on', show);
    }

    root.addEventListener('keydown', e => {
      const t = e.target.tagName;
      if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (k === 'escape') { if (drag) cancelDrag(); closeMenu(); }
      else if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k === 'y') { e.preventDefault(); redo(); }
      else if (mod && k === 'd') { const s = selected(); if (s) { e.preventDefault(); duplicate(s); } }
      else if (k === 'delete' || k === 'backspace') { const s = selected(); if (s) { e.preventDefault(); deleteBlock(s); selId = null; commit(); } }
    });

    /* اندازه و ریسپانسیو */
    const ro = new ResizeObserver(() => {
      if (destroyed) return;
      const n = root.clientWidth < 640;
      if (n !== narrow) { narrow = n; root.classList.toggle('be-narrow', n); if (n) fly.classList.add('closed'); else fly.classList.remove('closed'); syncCatBtns(); }
      if (needInit && ws.clientWidth > 0) { needInit = false; initView(); }
    });
    ro.observe(root);

    /* شروع */
    let initial = opts.state;
    if (!initial && opts.storageKey) { try { initial = JSON.parse(localStorage.getItem(opts.storageKey)); } catch (e) { initial = null; } }
    narrow = root.clientWidth > 0 && root.clientWidth < 640;
    root.classList.toggle('be-narrow', narrow);
    if (narrow) fly.classList.add('closed');
    loadState(initial && initial.tops ? initial : defaultState(), false);
    if (initial && initial.view) needInit = false;
    pushHist();
    if (!catOn(flyCat)) flyCat = (CATS.find(c => catOn(c.id)) || CATS[0]).id;
    buildFly(); syncCatBtns();
    afterChange(false);
    if (needInit && ws.clientWidth > 0) { needInit = false; initView(); }

    return {
      getCode: () => generate(state),
      getState, setState, clear, undo, redo,
      setCode(code) {
        const r = importCode(code);
        if (r.ok) { setState(r.state); cleanUp(true); }
        return r;
      },
      resize: () => { if (needInit && ws.clientWidth > 0) { needInit = false; initView(); } },
      destroy() { destroyed = true; ro.disconnect(); endPress(); root.remove(); }
    };
  }

  global.BlockEditor = { create, generate, fromCode: importCode, definitions: DEF };
})(window);
