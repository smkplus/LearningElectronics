/* ========================================================================
   ARDUINO-LANG — a tiny interpreter for a subset of Arduino C++
   Tokenizer -> Recursive-descent parser -> Generator-based tree-walking
   evaluator. delay()/delayMicroseconds() yield control so the caller can
   drive execution over (simulated) time without freezing the browser.
   ======================================================================== */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArduinoLang = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------- Errors / signals ---------------------------- */
  class RuntimeErr extends Error {}
  class SyntaxErr extends Error {}
  class ReturnSignal { constructor(value) { this.value = value; } }
  class BreakSignal {}
  class ContinueSignal {}

  function truthy(v) { return !!v; }

  /* ------------------------------- Preprocess -------------------------------- */
  function stripComments(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
      if (c === '"' || c === "'") {
        const quote = c;
        out += c; i++;
        while (i < n && src[i] !== quote) {
          if (src[i] === '\\') { out += src[i]; i++; if (i < n) { out += src[i]; i++; } continue; }
          out += src[i]; i++;
        }
        if (i < n) { out += src[i]; i++; }
        continue;
      }
      out += c; i++;
    }
    return out;
  }

  function preprocess(src) {
    src = stripComments(src);
    const defines = {};
    const lines = src.split('\n');
    const kept = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#include')) { kept.push(''); continue; }
      const m = trimmed.match(/^#define\s+(\w+)\s+(.+)$/);
      if (m) { defines[m[1]] = m[2].trim(); kept.push(''); continue; }
      if (trimmed.startsWith('#')) { kept.push(''); continue; }
      kept.push(line);
    }
    let out = kept.join('\n');
    const names = Object.keys(defines).sort((a, b) => b.length - a.length);
    for (const name of names) {
      const re = new RegExp('\\b' + name + '\\b', 'g');
      out = out.replace(re, defines[name]);
    }
    return out;
  }

  /* -------------------------------- Tokenizer -------------------------------- */
  const TWO_OPS = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '<<', '>>'];

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    const n = src.length;
    let line = 1;
    const isDigit = c => c >= '0' && c <= '9';
    const isIdentStart = c => /[A-Za-z_]/.test(c);
    const isIdentPart = c => /[A-Za-z0-9_]/.test(c);

    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }

      // آفستِ (start) شروعِ همین توکن — روی src (همان رشته‌ی پیش‌پردازش‌شده که
      // parse() هم رویش کار می‌کند) — تا بعداً بشود بازه‌ی متنیِ دقیقِ یک
      // دستور را (برای بلوکِ «کدِ خام») از رویش برش زد.
      const tokStart = i;

      if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
        const start = i;
        if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
          i += 2;
          while (i < n && /[0-9a-fA-F]/.test(src[i])) i++;
          tokens.push({ type: 'num', value: parseInt(src.slice(start, i), 16), line, start: tokStart, end: i });
          continue;
        }
        while (i < n && isDigit(src[i])) i++;
        if (src[i] === '.' && isDigit(src[i + 1])) { i++; while (i < n && isDigit(src[i])) i++; }
        if (src[i] === 'e' || src[i] === 'E') {
          i++;
          if (src[i] === '+' || src[i] === '-') i++;
          while (i < n && isDigit(src[i])) i++;
        }
        while (i < n && /[fFlLuU]/.test(src[i])) i++;
        const text = src.slice(start, i).replace(/[fFlLuU]+$/, '');
        tokens.push({ type: 'num', value: parseFloat(text), line, start: tokStart, end: i });
        continue;
      }

      if (isIdentStart(c)) {
        const start = i; i++;
        while (i < n && isIdentPart(src[i])) i++;
        tokens.push({ type: 'id', value: src.slice(start, i), line, start: tokStart, end: i });
        continue;
      }

      if (c === '"') {
        i++;
        let s = '';
        while (i < n && src[i] !== '"') {
          if (src[i] === '\\') {
            const nc = src[i + 1];
            const map = { n: '\n', t: '\t', '"': '"', '\\': '\\', r: '\r', '0': '\0' };
            s += (map[nc] !== undefined ? map[nc] : nc); i += 2; continue;
          }
          s += src[i]; i++;
        }
        i++; // closing quote
        tokens.push({ type: 'str', value: s, line, start: tokStart, end: i });
        continue;
      }

      if (c === "'") {
        i++;
        let s = '';
        while (i < n && src[i] !== "'") {
          if (src[i] === '\\') {
            const nc = src[i + 1];
            const map = { n: '\n', t: '\t', "'": "'", '\\': '\\', '0': '\0' };
            s += (map[nc] !== undefined ? map[nc] : nc); i += 2; continue;
          }
          s += src[i]; i++;
        }
        i++;
        tokens.push({ type: 'num', value: s.length ? s.charCodeAt(0) : 0, line, start: tokStart, end: i });
        continue;
      }

      const two = src.slice(i, i + 2);
      if (TWO_OPS.includes(two)) { tokens.push({ type: 'op', value: two, line, start: tokStart, end: i + 2 }); i += 2; continue; }
      tokens.push({ type: 'op', value: c, line, start: tokStart, end: i + 1 }); i++;
    }
    tokens.push({ type: 'eof', value: null, line, start: n, end: n });
    return tokens;
  }

  /* --------------------------------- Parser ---------------------------------- */
  const TYPE_KEYWORDS = new Set([
    'void', 'int', 'float', 'double', 'long', 'short', 'byte', 'char', 'bool', 'boolean',
    'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t',
    'size_t', 'word', 'String', 'auto'
  ]);
  // Library object types that can be declared bare, e.g. "Servo myServo;" — kept in
  // sync with Interpreter.builtinObjectTypes. Only names in this list are treated as
  // valid "custom types"; anything else is rejected instead of silently accepted.
  const OBJECT_TYPE_KEYWORDS = new Set(['Servo']);

  function parse(tokens) {
    let pos = 0;
    const peek = (o = 0) => tokens[pos + o];
    const at = (type, value) => { const t = peek(); return t.type === type && (value === undefined || t.value === value); };
    const atOp = v => at('op', v);
    const atId = v => at('id', v);
    const advance = () => tokens[pos++];
    const err = msg => new SyntaxErr(`خطای نحوی نزدیک خط ${peek().line}: ${msg}`);
    const expectOp = v => { if (!atOp(v)) throw err(`انتظار «${v}» می‌رفت`); return advance(); };

    function isTypeStart() {
      const t = peek();
      if (t.type !== 'id') return false;
      if (t.value === 'const' || t.value === 'unsigned' || t.value === 'signed') return true;
      if (TYPE_KEYWORDS.has(t.value)) return true;
      // Only a known library object type counts as a "custom type" start
      // (e.g. "Servo myServo;"). Arbitrary identifiers are NOT types — that
      // used to let any garbage word masquerade as a type declaration.
      return OBJECT_TYPE_KEYWORDS.has(t.value);
    }

    function parseTypeSpec() {
      while (atId('const')) advance();
      if (atId('unsigned') || atId('signed')) advance();
      if (peek().type !== 'id') throw err('نوع داده منتظر بود');
      const t = peek();
      if (!TYPE_KEYWORDS.has(t.value) && !OBJECT_TYPE_KEYWORDS.has(t.value)) {
        throw err(`«${t.value}» یک نوع دادهٔ معتبر نیست`);
      }
      const typeName = advance().value;
      while (atOp('*')) advance();
      // allow "unsigned int" / "unsigned long" style two-word types
      if (peek().type === 'id' && TYPE_KEYWORDS.has(peek().value)) advance();
      return typeName;
    }

    function parseExpr() {
      let e = parseAssignment();
      while (atOp(',')) { advance(); const e2 = parseAssignment(); e = { type: 'Seq', left: e, right: e2 }; }
      return e;
    }

    const ASSIGN_OPS = ['=', '+=', '-=', '*=', '/=', '%='];
    function parseAssignment() {
      const left = parseBinary(1);
      if (peek().type === 'op' && ASSIGN_OPS.includes(peek().value)) {
        const op = advance().value;
        const right = parseAssignment();
        return { type: 'Assign', operator: op, target: left, value: right };
      }
      return left;
    }

    const PREC = {
      '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
      '==': 6, '!=': 6,
      '<': 7, '>': 7, '<=': 7, '>=': 7,
      '<<': 8, '>>': 8,
      '+': 9, '-': 9,
      '*': 10, '/': 10, '%': 10
    };
    function parseBinary(minPrec) {
      let left = parseUnary();
      for (;;) {
        const t = peek();
        if (t.type !== 'op') break;
        const prec = PREC[t.value];
        if (prec === undefined || prec < minPrec) break;
        const op = advance().value;
        const right = parseBinary(prec + 1);
        left = { type: 'Binary', operator: op, left, right };
      }
      return left;
    }
    function parseUnary() {
      if (atOp('&')) { advance(); return parseUnary(); } // «&htim1»: آدرسِ یک شیء — برای شبیه‌ساز همان خودِ شیء
    if (atOp('!') || atOp('-') || atOp('+')) { const op = advance().value; return { type: 'Unary', operator: op, argument: parseUnary() }; }
      if (atOp('++') || atOp('--')) { const op = advance().value; return { type: 'UpdateExpr', operator: op, argument: parseUnary(), prefix: true }; }
      return parsePostfix();
    }
    function parsePostfix() {
      let expr = parsePrimary();
      for (;;) {
        if (atOp('(')) {
          advance();
          const args = [];
          if (!atOp(')')) { do { args.push(parseAssignment()); } while (atOp(',') && advance()); }
          expectOp(')');
          expr = { type: 'Call', callee: expr, arguments: args };
        } else if (atOp('.')) {
          advance();
          if (peek().type !== 'id') throw err('نام ویژگی منتظر بود');
          const prop = advance().value;
          expr = { type: 'Member', object: expr, property: prop };
        } else if (atOp('[')) {
          advance();
          const idx = parseExpr();
          expectOp(']');
          expr = { type: 'Index', object: expr, index: idx };
        } else if (atOp('++') || atOp('--')) {
          const op = advance().value;
          expr = { type: 'UpdateExpr', operator: op, argument: expr, prefix: false };
        } else break;
      }
      return expr;
    }
    function parsePrimary() {
      const t = peek();
      if (t.type === 'num') { advance(); return { type: 'Num', value: t.value }; }
      if (t.type === 'str') { advance(); return { type: 'Str', value: t.value }; }
      if (t.type === 'id') { advance(); return { type: 'Ident', name: t.value, line: t.line }; }
      if (atOp('(')) { advance(); const e = parseExpr(); expectOp(')'); return e; }
      if (atOp('{')) {
        advance();
        const elements = [];
        if (!atOp('}')) { do { elements.push(parseAssignment()); } while (atOp(',') && advance()); }
        expectOp('}');
        return { type: 'ArrayLit', elements };
      }
      throw err('عبارت نامعتبر یا ناتمام');
    }

    function parseVarDeclStatement() {
      const varType = parseTypeSpec();
      const decls = [];
      do {
        if (peek().type !== 'id') throw err('نام متغیر منتظر بود');
        const name = advance().value;
        let arraySize = null;
        if (atOp('[')) { advance(); if (!atOp(']')) arraySize = parseExpr(); expectOp(']'); }
        let init = null;
        if (atOp('=')) { advance(); init = parseAssignment(); }
        decls.push({ name, arraySize, init, varType });
      } while (atOp(',') && advance());
      expectOp(';');
      return { type: 'VarDecl', decls };
    }

    const errors = [];

    function skipToBoundary(stopAtTypeStart) {
      // Panic-mode recovery: after a syntax error, skip forward instead of
      // giving up entirely, so later independent mistakes can still be
      // found in this same pass. Always advances at least one token (when
      // not already at EOF) so recovery can never get stuck in a loop.
      let depth = 0;
      if (!at('eof')) advance();
      while (!at('eof')) {
        if (atOp('{')) { depth++; advance(); continue; }
        if (atOp('}')) {
          if (depth === 0) { if (!stopAtTypeStart) advance(); return; }
          depth--; advance(); continue;
        }
        if (depth === 0 && atOp(';')) { advance(); return; }
        if (depth === 0 && stopAtTypeStart && isTypeStart()) return;
        advance();
      }
    }

    function parseBlock() {
      expectOp('{');
      const body = [];
      while (!atOp('}')) {
        if (at('eof')) throw err('«}» بسته‌نشده — یک آکولاد جا افتاده؟');
        try {
          body.push(parseStatement());
        } catch (e) {
          if (!(e instanceof SyntaxErr)) throw e;
          errors.push(e);
          skipToBoundary(false);
        }
      }
      expectOp('}');
      return { type: 'Block', body };
    }

    function parseIf() {
      advance(); expectOp('(');
      const test = parseExpr();
      expectOp(')');
      const consequent = parseStatement();
      let alternate = null;
      if (atId('else')) { advance(); alternate = parseStatement(); }
      return { type: 'If', test, consequent, alternate };
    }
    function parseFor() {
      advance(); expectOp('(');
      let init = null;
      if (!atOp(';')) {
        init = isTypeStart() ? parseVarDeclStatement() : (() => { const e = parseExpr(); expectOp(';'); return { type: 'ExprStmt', expression: e }; })();
      } else advance();
      let test = null;
      if (!atOp(';')) test = parseExpr();
      expectOp(';');
      let update = null;
      if (!atOp(')')) update = parseExpr();
      expectOp(')');
      const body = parseStatement();
      return { type: 'For', init, test, update, body };
    }
    function parseWhile() {
      advance(); expectOp('(');
      const test = parseExpr();
      expectOp(')');
      const body = parseStatement();
      return { type: 'While', test, body };
    }
    function parseDoWhile() {
      advance();
      const body = parseStatement();
      if (!atId('while')) throw err('«while» بعد از «do» منتظر بود');
      advance(); expectOp('(');
      const test = parseExpr();
      expectOp(')'); expectOp(';');
      return { type: 'DoWhile', test, body };
    }
    function parseStatementInner() {
      if (atOp('{')) return parseBlock();
      if (atOp(';')) { advance(); return { type: 'Empty' }; }
      if (atId('if')) return parseIf();
      if (atId('for')) return parseFor();
      if (atId('while')) return parseWhile();
      if (atId('do')) return parseDoWhile();
      if (atId('return')) { advance(); let arg = null; if (!atOp(';')) arg = parseExpr(); expectOp(';'); return { type: 'Return', argument: arg }; }
      if (atId('break')) { advance(); expectOp(';'); return { type: 'Break' }; }
      if (atId('continue')) { advance(); expectOp(';'); return { type: 'Continue' }; }
      if (isTypeStart()) return parseVarDeclStatement();
      const expr = parseExpr();
      expectOp(';');
      return { type: 'ExprStmt', expression: expr };
    }
    // برچسبِ «بازه‌ی متنی» را روی هر دستوری که parseStatement برمی‌گرداند
    // می‌گذارد — یعنی [آفستِ شروع، آفستِ پایان] رویِ همان رشته‌ای که
    // tokenize() رویش کار کرده. این جدا از منطقِ خودِ پارس است (parseStatementInner
    // دست‌نخورده می‌ماند) و فقط برای بازسازیِ متنِ خامِ یک دستور به‌کار می‌رود —
    // مثلاً وقتی arduino-blocks.js نتواند دستوری را به بلوک تبدیل کند و
    // بخواهد آن را عیناً در یک بلوکِ «کدِ خام» نشان دهد.
    function parseStatement() {
      const startTok = peek();
      const node = parseStatementInner();
      if (node) node.range = [startTok.start, tokens[pos - 1].end];
      return node;
    }

    const functions = {};
    const globals = [];
    while (!at('eof')) {
      if (atOp(';')) { advance(); continue; }
      if (!isTypeStart()) {
        // این خط اصلاً با چیزی که در سطح سراسری معتبر است شروع نمی‌شود (نه
        // یک نوع، نه چیز دیگری که skipToBoundary بتواند به‌عنوان لنگرِ
        // بازیابی بشناسد). اگر اینجا هم از skipToBoundary(true) استفاده
        // می‌شد، چون منتظر رسیدن به یک «شروعِ نوع» می‌ماند و چنین چیزی تا
        // پایان فایل پیدا نمی‌شود، کل بقیه‌ی برنامه را می‌بلعید و خطاهای
        // مستقلِ بعدی (مثلاً چند خط تک‌کلمه‌ای پشتِ‌سرِهم) هرگز گزارش
        // نمی‌شدند. پس فقط همین یک توکن را رد می‌کنیم و به تلاشِ بعدی
        // می‌رویم، تا هر خط خراب جدا گزارش شود.
        errors.push(err(`شناسهٔ «${peek().value}» ناشناخته است؛ انتظار نوع داده (مثل void یا int) یا تعریف تابع/متغیر می‌رفت`));
        if (!at('eof')) advance();
        continue;
      }
      try {
        const save = pos;
        parseTypeSpec();
        if (peek().type !== 'id') throw err('نام تابع یا متغیر سراسری منتظر بود');
        const name = advance().value;
        if (atOp('(')) {
          advance();
          const params = [];
          if (!atOp(')')) {
            do {
              if (atOp(')')) break;
              parseTypeSpec();
              let pname = null;
              if (peek().type === 'id') pname = advance().value;
              if (atOp('[')) { advance(); if (!atOp(']')) parseExpr(); expectOp(']'); }
              params.push({ name: pname });
            } while (atOp(',') && advance());
          }
          expectOp(')');
          if (atOp(';')) { advance(); continue; } // forward declaration only
          const body = parseBlock();
          functions[name] = { name, params, body, range: [tokens[save].start, tokens[pos - 1].end] };
        } else {
          pos = save;
          const gStartTok = tokens[pos];
          const g = parseVarDeclStatement();
          g.range = [gStartTok.start, tokens[pos - 1].end];
          globals.push(g);
        }
      } catch (e) {
        if (!(e instanceof SyntaxErr)) throw e;
        errors.push(e);
        skipToBoundary(true);
      }
    }
    return { functions, globals, errors };
  }

  /* -------------------------------- Scope ------------------------------------ */
  class Scope {
    constructor(parent) { this.vars = Object.create(null); this.parent = parent; }
    declare(name, val) { this.vars[name] = val; }
    get(name) {
      let s = this;
      while (s) { if (name in s.vars) return s.vars[name]; s = s.parent; }
      throw new RuntimeErr(`متغیر تعریف‌نشده: ${name}`);
    }
    set(name, val) {
      let s = this;
      while (s) { if (name in s.vars) { s.vars[name] = val; return; } s = s.parent; }
      // Permissive fallback: implicitly declare in the outermost (global) scope.
      let g = this; while (g.parent) g = g.parent;
      g.vars[name] = val;
    }
  }

  // شناسه‌ی پایه‌ی STM32 مثل 'PC13' از روی پورت ('C') و ماسک پایه (1 << 13)
  function halPin(port, mask) {
    if (typeof port !== 'string' || !(mask > 0) || (mask & (mask - 1)) !== 0) {
      throw new RuntimeErr('پورت یا پایه‌ی HAL نامعتبر است — مثل GPIOC و GPIO_PIN_13 بنویس.');
    }
    return 'P' + port + Math.round(Math.log2(mask));
  }

  /* ------------------------------ Interpreter --------------------------------- */
  class Interpreter {
    constructor(ast, io) {
      this.ast = ast;
      this.io = io;
      this.global = new Scope(null);
      this.sliceSteps = 0;
      this.MAX_SLICE_STEPS = 250000;
      this.setupBuiltins();
    }

    setupBuiltins() {
      const g = this.global;
      g.declare('HIGH', 1);
      g.declare('LOW', 0);
      g.declare('OUTPUT', 'OUTPUT');
      g.declare('INPUT', 'INPUT');
      g.declare('INPUT_PULLUP', 'INPUT_PULLUP');
      g.declare('LED_BUILTIN', 13);
      g.declare('true', true);
      g.declare('false', false);
      g.declare('PI', Math.PI);
      g.declare('HALF_PI', Math.PI / 2);
      g.declare('TWO_PI', Math.PI * 2);

      // ثابت‌های HAL برای بردهای STM32 (پورت‌ها و ماسک پایه‌ها مثل HAL واقعی: GPIO_PIN_n = 1 << n)
      g.declare('GPIOA', 'A');
      g.declare('GPIOB', 'B');
      g.declare('GPIOC', 'C');
      g.declare('GPIOD', 'D');
      // تایمرها و کانال‌ها برای PWM: htim1..4 و TIM_CHANNEL_1..4 (عددِ ساده؛ «&htim1» هم پذیرفته می‌شود)
      for (let i = 1; i <= 4; i++) { g.declare('htim' + i, i); g.declare('TIM_CHANNEL_' + i, i); }
      for (let i = 0; i < 16; i++) g.declare('GPIO_PIN_' + i, 1 << i);
      g.declare('GPIO_PIN_SET', 1);
      g.declare('GPIO_PIN_RESET', 0);

      const self = this;
      self.serialBegun = false;
      g.declare('Serial', {
        begin: (...a) => {
          self.serialBegun = true;
          if (self.io.serialBegin) self.io.serialBegin(a[0]);
        },
        print: (...a) => {
          if (!self.serialBegun) { if (self.io.serialNotBegun) self.io.serialNotBegun(); return; }
          self.io.serialPrint(a.map(x => self.stringify(x)).join(''));
        },
        println: (...a) => {
          if (!self.serialBegun) { if (self.io.serialNotBegun) self.io.serialNotBegun(); return; }
          self.io.serialPrint(a.map(x => self.stringify(x)).join('') + '\n');
        }
      });

      this.natives = {
        pinMode: ([pin, mode]) => { self.io.pinMode(pin, mode); },
        digitalWrite: ([pin, val]) => { self.io.digitalWrite(pin, val ? 1 : 0); },
        digitalRead: ([pin]) => self.io.digitalRead(pin),
        analogWrite: ([pin, val]) => { self.io.analogWrite(pin, val); },
        analogRead: ([pin]) => (self.io.analogRead ? self.io.analogRead(pin) : 0),
        millis: () => self.io.millis(),
        micros: () => self.io.millis() * 1000,
        random: (args) => {
          if (args.length >= 2) return Math.floor(args[0] + Math.random() * (args[1] - args[0]));
          if (args.length === 1) return Math.floor(Math.random() * args[0]);
          return Math.floor(Math.random() * 2147483647);
        },
        randomSeed: () => undefined,
        map: ([x, inMin, inMax, outMin, outMax]) => (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin,
        constrain: ([x, lo, hi]) => Math.min(Math.max(x, lo), hi),
        abs: ([x]) => Math.abs(x),
        min: ([a, b]) => Math.min(a, b),
        max: ([a, b]) => Math.max(a, b),
        pow: ([a, b]) => Math.pow(a, b),
        sqrt: ([a]) => Math.sqrt(a),
        sq: ([a]) => a * a,
        HAL_Init: () => undefined,
        SystemClock_Config: () => undefined,
        MX_GPIO_Init: () => undefined,
        MX_TIM1_Init: () => undefined,
        MX_TIM2_Init: () => undefined,
        MX_TIM3_Init: () => undefined,
        HAL_TIM_PWM_Start: ([tim, ch]) => { if (self.io.pwmStart) self.io.pwmStart(tim, ch); return 0; },
        __HAL_TIM_SET_COMPARE: ([tim, ch, v]) => { if (self.io.pwmCompare) self.io.pwmCompare(tim, ch, v); },
        HAL_GPIO_WritePin: ([port, mask, state]) => { self.io.digitalWrite(halPin(port, mask), state ? 1 : 0); },
        HAL_GPIO_TogglePin: ([port, mask]) => {
          const id = halPin(port, mask);
          const cur = self.io.halOut ? self.io.halOut(id) : (self.io.pins && self.io.pins[id] !== undefined ? self.io.pins[id] : 1);
          self.io.digitalWrite(id, cur ? 0 : 1);
        },
        HAL_GPIO_ReadPin: ([port, mask]) => self.io.digitalRead(halPin(port, mask)),
        tone: ([pin, freq]) => { if (self.io.tone) self.io.tone(pin, freq); },
        noTone: ([pin]) => { if (self.io.noTone) self.io.noTone(pin); }
      };

      // انواع شیءِ کتابخانه‌ای که با اعلان ساده (بدون مقداردهی اولیه) ساخته
      // می‌شوند، مثل "Servo myServo;" — شبیه رفتار کتابخانه‌ی واقعی آردوینو.
      this.builtinObjectTypes = {
        Servo: () => self.createServoObject()
      };
    }

    createServoObject() {
      const self = this;
      const obj = {
        _pin: undefined,
        _angle: 0,
        attach(pin) { obj._pin = pin; if (self.io.servoAttach) self.io.servoAttach(pin); return 0; },
        detach() { obj._pin = undefined; },
        write(angle) {
          obj._angle = Math.max(0, Math.min(180, Number(angle) || 0));
          if (self.io.servoWrite) self.io.servoWrite(obj._pin, obj._angle);
        },
        writeMicroseconds(us) {
          const angle = Math.max(0, Math.min(180, (Number(us) - 544) * 180 / (2400 - 544)));
          obj._angle = angle;
          if (self.io.servoWrite) self.io.servoWrite(obj._pin, obj._angle);
        },
        read() { return obj._angle; },
        attached() { return obj._pin !== undefined; }
      };
      return obj;
    }

    stringify(v) {
      if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
      if (v === undefined) return '';
      return String(v);
    }

    tick() {
      this.sliceSteps++;
      if (this.sliceSteps > this.MAX_SLICE_STEPS) {
        throw new RuntimeErr('کد بدون فراخوانی delay() در یک حلقه گیر کرده و شبیه‌ساز را قفل می‌کند. یک delay() (یا HAL_Delay()) داخل loop() اضافه کن.');
      }
    }

    * run() {
      for (const g of this.ast.globals) yield* this.execVarDecl(g, this.global);
      const setupFn = this.ast.functions['setup'];
      const loopFn = this.ast.functions['loop'];
      if (!setupFn) throw new RuntimeErr('تابع ()setup پیدا نشد.');
      if (!loopFn) throw new RuntimeErr('تابع ()loop پیدا نشد.');
      yield* this.callFunction(setupFn, []);
      yield { type: 'setupDone' };
      while (true) {
        yield* this.callFunction(loopFn, []);
        yield { type: 'loopEnd' };
      }
    }

    * callFunction(fn, args) {
      const scope = new Scope(this.global);
      fn.params.forEach((p, i) => { if (p.name) scope.declare(p.name, args[i] !== undefined ? args[i] : 0); });
      try {
        yield* this.execBlock(fn.body, scope);
      } catch (e) {
        if (e instanceof ReturnSignal) return e.value;
        throw e;
      }
      return undefined;
    }

    * execBlock(block, parentScope) {
      const scope = new Scope(parentScope);
      for (const stmt of block.body) yield* this.execStatement(stmt, scope);
    }

    * execVarDecl(node, scope) {
      for (const d of node.decls) {
        let val = 0;
        if (d.init) {
          val = yield* this.evalExpr(d.init, scope);
        } else if (d.arraySize) {
          const size = Math.max(0, Math.floor(yield* this.evalExpr(d.arraySize, scope)) || 0);
          val = new Array(size).fill(0);
        } else if (d.varType && this.builtinObjectTypes[d.varType]) {
          val = this.builtinObjectTypes[d.varType]();
        }
        scope.declare(d.name, val);
      }
    }

    * execStatement(node, scope) {
      this.tick();
      switch (node.type) {
        case 'Block': yield* this.execBlock(node, scope); return;
        case 'Empty': return;
        case 'VarDecl': yield* this.execVarDecl(node, scope); return;
        case 'ExprStmt': yield* this.evalExpr(node.expression, scope); return;
        case 'If': {
          const test = yield* this.evalExpr(node.test, scope);
          if (truthy(test)) yield* this.execStatement(node.consequent, scope);
          else if (node.alternate) yield* this.execStatement(node.alternate, scope);
          return;
        }
        case 'While': {
          while (truthy(yield* this.evalExpr(node.test, scope))) {
            this.tick();
            try { yield* this.execStatement(node.body, scope); }
            catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) continue; throw e; }
          }
          return;
        }
        case 'DoWhile': {
          do {
            this.tick();
            try { yield* this.execStatement(node.body, scope); }
            catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) continue; throw e; }
          } while (truthy(yield* this.evalExpr(node.test, scope)));
          return;
        }
        case 'For': {
          const forScope = new Scope(scope);
          if (node.init) yield* this.execStatement(node.init, forScope);
          while (node.test ? truthy(yield* this.evalExpr(node.test, forScope)) : true) {
            this.tick();
            try { yield* this.execStatement(node.body, forScope); }
            catch (e) {
              if (e instanceof BreakSignal) break;
              if (!(e instanceof ContinueSignal)) throw e;
            }
            if (node.update) yield* this.evalExpr(node.update, forScope);
          }
          return;
        }
        case 'Return': {
          const val = node.argument ? yield* this.evalExpr(node.argument, scope) : undefined;
          throw new ReturnSignal(val);
        }
        case 'Break': throw new BreakSignal();
        case 'Continue': throw new ContinueSignal();
        default: throw new RuntimeErr('نوع دستور ناشناخته: ' + node.type);
      }
    }

    * resolveRef(node, scope) {
      if (node.type === 'Ident') {
        return { current: scope.get(node.name), set: (v) => scope.set(node.name, v) };
      }
      if (node.type === 'Index') {
        const obj = yield* this.evalExpr(node.object, scope);
        const idx = yield* this.evalExpr(node.index, scope);
        return { current: obj ? obj[idx] : undefined, set: (v) => { if (obj) obj[idx] = v; } };
      }
      if (node.type === 'Member') {
        const obj = yield* this.evalExpr(node.object, scope);
        return { current: obj ? obj[node.property] : undefined, set: (v) => { if (obj) obj[node.property] = v; } };
      }
      throw new RuntimeErr('سمت چپ انتساب نامعتبر است');
    }

    * evalAssign(node, scope) {
      const ref = yield* this.resolveRef(node.target, scope);
      const rhs = yield* this.evalExpr(node.value, scope);
      let newV;
      switch (node.operator) {
        case '=': newV = rhs; break;
        case '+=': newV = ref.current + rhs; break;
        case '-=': newV = ref.current - rhs; break;
        case '*=': newV = ref.current * rhs; break;
        case '/=': newV = ref.current / rhs; break;
        case '%=': newV = ref.current % rhs; break;
        default: throw new RuntimeErr('عملگر انتساب ناشناخته');
      }
      ref.set(newV);
      return newV;
    }

    * evalBinary(node, scope) {
      if (node.operator === '&&') {
        const l = yield* this.evalExpr(node.left, scope);
        if (!truthy(l)) return false;
        return truthy(yield* this.evalExpr(node.right, scope));
      }
      if (node.operator === '||') {
        const l = yield* this.evalExpr(node.left, scope);
        if (truthy(l)) return true;
        return truthy(yield* this.evalExpr(node.right, scope));
      }
      const l = yield* this.evalExpr(node.left, scope);
      const r = yield* this.evalExpr(node.right, scope);
      switch (node.operator) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/':
          if (r === 0) throw new RuntimeErr('تقسیم بر صفر');
          return (Number.isInteger(l) && Number.isInteger(r)) ? Math.trunc(l / r) : l / r;
        case '%': return l % r;
        case '==': return l === r;
        case '!=': return l !== r;
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
        case '&': return l & r;
        case '|': return l | r;
        case '^': return l ^ r;
        case '<<': return l << r;
        case '>>': return l >> r;
        default: throw new RuntimeErr('عملگر ناشناخته: ' + node.operator);
      }
    }

    * evalCall(node, scope) {
      if (node.callee.type === 'Ident') {
        const name = node.callee.name;
        if (this.ast.functions[name]) {
          const args = [];
          for (const a of node.arguments) args.push(yield* this.evalExpr(a, scope));
          return yield* this.callFunction(this.ast.functions[name], args);
        }
        if (name === 'delay' || name === 'HAL_Delay') {
          const ms = yield* this.evalExpr(node.arguments[0], scope);
          yield { type: 'delay', ms: Math.max(0, ms) };
          this.sliceSteps = 0;
          return undefined;
        }
        if (name === 'delayMicroseconds') {
          const us = yield* this.evalExpr(node.arguments[0], scope);
          yield { type: 'delay', ms: Math.max(0, us / 1000) };
          this.sliceSteps = 0;
          return undefined;
        }
        if (this.natives[name]) {
          const args = [];
          for (const a of node.arguments) args.push(yield* this.evalExpr(a, scope));
          return this.natives[name](args);
        }
        throw new RuntimeErr(`تابع ناشناخته: ${name}()`);
      }
      if (node.callee.type === 'Member') {
        const obj = yield* this.evalExpr(node.callee.object, scope);
        const method = obj ? obj[node.callee.property] : undefined;
        if (typeof method !== 'function') throw new RuntimeErr(`متد ناشناخته: ${node.callee.property}()`);
        const args = [];
        for (const a of node.arguments) args.push(yield* this.evalExpr(a, scope));
        return method.apply(obj, args);
      }
      throw new RuntimeErr('فراخوانی نامعتبر');
    }

    * evalExpr(node, scope) {
      this.tick();
      switch (node.type) {
        case 'Num': return node.value;
        case 'Str': return node.value;
        case 'Ident':
          if (node.name === 'true') return true;
          if (node.name === 'false') return false;
          return scope.get(node.name);
        case 'ArrayLit': {
          const arr = [];
          for (const el of node.elements) arr.push(yield* this.evalExpr(el, scope));
          return arr;
        }
        case 'Seq': { yield* this.evalExpr(node.left, scope); return yield* this.evalExpr(node.right, scope); }
        case 'Assign': return yield* this.evalAssign(node, scope);
        case 'Unary': {
          const v = yield* this.evalExpr(node.argument, scope);
          if (node.operator === '-') return -v;
          if (node.operator === '+') return +v;
          if (node.operator === '!') return !truthy(v);
          throw new RuntimeErr('عملگر یکانی ناشناخته');
        }
        case 'UpdateExpr': {
          const ref = yield* this.resolveRef(node.argument, scope);
          const oldV = ref.current;
          const newV = node.operator === '++' ? oldV + 1 : oldV - 1;
          ref.set(newV);
          return node.prefix ? newV : oldV;
        }
        case 'Binary': return yield* this.evalBinary(node, scope);
        case 'Member': {
          const obj = yield* this.evalExpr(node.object, scope);
          if (obj == null) throw new RuntimeErr('دسترسی به ویژگی روی مقدار نامعتبر');
          return obj[node.property];
        }
        case 'Index': {
          const obj = yield* this.evalExpr(node.object, scope);
          const idx = yield* this.evalExpr(node.index, scope);
          return obj ? obj[idx] : undefined;
        }
        case 'Call': return yield* this.evalCall(node, scope);
        default: throw new RuntimeErr('عبارت ناشناخته: ' + node.type);
      }
    }
  }

  /* ---------------------------- Static name check ----------------------------
     A real compiler catches an undeclared identifier before running anything,
     even if that line would never execute (e.g. inside an untaken 'if'). This
     interpreter previously only found out at the moment a line actually ran
     (via Scope.get throwing at runtime), so typos in unreached code, or in
     code that just hadn't been reached *yet*, went unnoticed. This walks the
     whole program once after parsing and checks every identifier reference
     resolves to something: a local/param/global variable, a declared
     function, or a builtin — mirroring the Interpreter's own scoping rules
     (see execBlock/callFunction) without actually running any code. */
  class NameScope {
    constructor(parent) { this.names = new Set(); this.parent = parent; }
    declare(name) { this.names.add(name); }
    has(name) {
      let s = this;
      while (s) { if (s.names.has(name)) return true; s = s.parent; }
      return false;
    }
  }

  function collectBuiltinNames() {
    // Instantiate the Interpreter just to read off its declared builtin
    // names — keeps this check in sync with setupBuiltins() automatically
    // instead of maintaining a second hand-written list. Nothing in here
    // calls `io`, so a stub object is safe.
    const dummy = new Interpreter({ functions: {}, globals: [] }, {});
    return {
      globals: new Set(Object.keys(dummy.global.vars)),
      natives: new Set(Object.keys(dummy.natives))
    };
  }

  function checkUndeclared(ast) {
    const builtins = collectBuiltinNames();
    const functionNames = new Set(Object.keys(ast.functions));
    // delay()/delayMicroseconds() are special-cased inside evalCall rather
    // than living in `natives`, so they need to be listed explicitly here.
    const SPECIAL_CALLS = new Set(['delay', 'delayMicroseconds', 'HAL_Delay']);
    const isCallable = (name) => functionNames.has(name) || builtins.natives.has(name) || SPECIAL_CALLS.has(name);
    const errAt = (line, msg) => new SyntaxErr(`خطای نحوی${line ? ' نزدیک خط ' + line : ''}: ${msg}`);

    const errors = [];
    // Same missing name reported once (e.g. a typo used 5 times in a loop
    // would otherwise flood the console with the identical complaint).
    // Different missing names are still each reported.
    const reportedNames = new Set();
    function report(err) { errors.push(err); }

    const globalScope = new NameScope(null);
    for (const name of builtins.globals) globalScope.declare(name);

    function checkExpr(node, scope) {
      if (!node) return;
      switch (node.type) {
        case 'Ident':
          if (node.name === 'true' || node.name === 'false') return;
          if (!scope.has(node.name)) {
            if (!reportedNames.has(node.name)) {
              reportedNames.add(node.name);
              report(errAt(node.line, `شناسهٔ «${node.name}» تعریف نشده است`));
            }
            scope.declare(node.name); // avoid re-flagging the same name repeatedly in this scope
          }
          return;
        case 'Num': case 'Str': return;
        case 'Unary': checkExpr(node.argument, scope); return;
        case 'UpdateExpr': checkExpr(node.argument, scope); return;
        case 'Binary': checkExpr(node.left, scope); checkExpr(node.right, scope); return;
        case 'Seq': checkExpr(node.left, scope); checkExpr(node.right, scope); return;
        case 'Assign': checkExpr(node.target, scope); checkExpr(node.value, scope); return;
        case 'Call': {
          if (node.callee.type === 'Ident') {
            const name = node.callee.name;
            if (!isCallable(name) && !scope.has(name)) {
              if (!reportedNames.has(name)) {
                reportedNames.add(name);
                report(errAt(node.callee.line, `تابع «${name}» تعریف نشده است`));
              }
            }
          } else {
            checkExpr(node.callee, scope);
          }
          for (const a of node.arguments) checkExpr(a, scope);
          return;
        }
        case 'Index': checkExpr(node.object, scope); checkExpr(node.index, scope); return;
        case 'Member': checkExpr(node.object, scope); return;
        case 'ArrayLit': node.elements.forEach(e => checkExpr(e, scope)); return;
        default: return;
      }
    }

    function checkStatement(node, scope) {
      switch (node.type) {
        case 'Block': {
          const inner = new NameScope(scope);
          for (const s of node.body) checkStatement(s, inner);
          return;
        }
        case 'VarDecl':
          for (const d of node.decls) {
            if (d.init) checkExpr(d.init, scope);
            if (d.arraySize) checkExpr(d.arraySize, scope);
            scope.declare(d.name);
          }
          return;
        case 'ExprStmt': checkExpr(node.expression, scope); return;
        case 'If':
          checkExpr(node.test, scope);
          checkStatement(node.consequent, scope);
          if (node.alternate) checkStatement(node.alternate, scope);
          return;
        case 'While': checkExpr(node.test, scope); checkStatement(node.body, scope); return;
        case 'DoWhile': checkStatement(node.body, scope); checkExpr(node.test, scope); return;
        case 'For': {
          const forScope = new NameScope(scope);
          if (node.init) checkStatement(node.init, forScope);
          if (node.test) checkExpr(node.test, forScope);
          checkStatement(node.body, forScope);
          if (node.update) checkExpr(node.update, forScope);
          return;
        }
        case 'Return': if (node.argument) checkExpr(node.argument, scope); return;
        case 'Break': case 'Continue': case 'Empty': return;
        default: return;
      }
    }

    for (const g of ast.globals) {
      for (const d of g.decls) {
        if (d.init) checkExpr(d.init, globalScope);
        if (d.arraySize) checkExpr(d.arraySize, globalScope);
        globalScope.declare(d.name);
      }
    }

    for (const name of functionNames) {
      const fn = ast.functions[name];
      const fnScope = new NameScope(globalScope);
      fn.params.forEach(p => { if (p.name) fnScope.declare(p.name); });
      checkStatement(fn.body, fnScope);
    }

    return errors;
  }

  // برنامه‌ی سبک STM32: int main(){ ...راه‌اندازی... while(1){ ... } } را به همان
  // setup/loop تبدیل می‌کند. متغیرهای تعریف‌شده پیش از حلقه سراسری می‌شوند تا
  // داخل حلقه هم دیده شوند، درست مثل متغیرهای محلیِ main در C واقعی.
  function liftMain(ast) {
    const main = ast.functions.main;
    if (!main || ast.functions.setup || ast.functions.loop) return;
    const body = main.body.body;
    const i = body.findIndex(s => s.type === 'While' && s.test &&
      ((s.test.type === 'Num' && s.test.value) || (s.test.type === 'Ident' && s.test.name === 'true')));
    if (i < 0) throw new SyntaxErr('خطای نحوی: داخل ()main یک حلقه‌ی (while (1 لازم است.');
    const pre = body.slice(0, i);
    ast.globals.push(...pre.filter(s => s.type === 'VarDecl'));
    const loopBody = body[i].body;
    ast.functions.setup = { name: 'setup', params: [], body: { type: 'Block', body: pre.filter(s => s.type !== 'VarDecl') } };
    ast.functions.loop = { name: 'loop', params: [], body: loopBody.type === 'Block' ? loopBody : { type: 'Block', body: [loopBody] } };
    delete ast.functions.main;
  }

  function compile(source) {
    const pre = preprocess(source);
    const tokens = tokenize(pre);
    const ast = parse(tokens);
    if (!(ast.errors && ast.errors.length)) liftMain(ast);
    const semanticErrors = checkUndeclared(ast);
    const allErrors = [...(ast.errors || []), ...semanticErrors];
    if (allErrors.length) {
      const combined = new SyntaxErr(allErrors.map(e => e.message).join('\n'));
      combined.errors = allErrors;
      throw combined;
    }
    return ast;
  }

  return { preprocess, tokenize, parse, compile, Interpreter, RuntimeErr, SyntaxErr };
});
