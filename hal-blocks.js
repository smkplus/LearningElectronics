/* ================= STM32 HAL: ادیتورِ بلوکی =================
   یک ادیتورِ بلوکیِ سبک و مستقل (بدونِ Blockly) برای زیرمجموعه‌ی C/HAL که مفسرِ hal-block.js می‌فهمد.
   همان کدِ متنی ← بلوک (با halParse) و بلوک ← کدِ متنی (HB.gen) دوطرفه است؛ پس کاربر هر لحظه
   می‌تواند بین «بلوک» و «متن» جابه‌جا شود و چیزی گم نمی‌شود.

   ویژگی‌ها: پالتِ دسته‌بندی‌شده، افزودن با لمس یا کشیدن، بلوک‌های تودرتو (if / else if / else)،
   عبارت‌های ساختنی با منوی کوچک، هشدارِ زنده وقتی پایه در Cube درست تنظیم نشده (با دکمه‌ی «برو به Cube»)،
   پیش‌نمایشِ زنده‌ی کدِ C، و برجسته‌شدنِ بلوکی که برنامه همین لحظه اجرا می‌کند.
   وابسته به: halParse از hal-block.js (در لحظه‌ی استفاده)، CUBE / CX_SIDES / cxIsGpio / halHighlight از cube-block.js. */
const HB = (function(){
  let uid = 0;
  const nid = () => 'n' + (++uid);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fa = n => (typeof toFa === 'function' ? toFa(n) : String(n));
  const CONSTS = ['GPIO_PIN_SET', 'GPIO_PIN_RESET'];
  const TYPES = ['uint8_t', 'int', 'uint16_t', 'uint32_t', 'int32_t', 'GPIO_PinState'];
  const CMP = ['==', '!=', '<', '>', '<=', '>='], ARI = ['+', '-', '*', '/', '%'], LOG = ['&&', '||'];
  const PREC = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
  const OPNAME = { '&&': 'و', '||': 'یا' };

  /* ---------- ساختنِ گره‌ها ---------- */
  const N = {
    num: v => ({ id: nid(), t: 'num', v }),
    vr: name => ({ id: nid(), t: 'var', name }),
    read: pin => ({ id: nid(), t: 'read', pin }),
    bin: (op, l, r) => ({ id: nid(), t: 'bin', op, l, r }),
    un: (op, e) => ({ id: nid(), t: 'un', op, e }),
    cx: (name, args) => ({ id: nid(), t: 'cx', name, args }),
    write: (pin, val) => ({ id: nid(), t: 'write', pin, val }),
    toggle: pin => ({ id: nid(), t: 'toggle', pin }),
    delay: ms => ({ id: nid(), t: 'delay', ms }),
    iff: (cond, then, els) => ({ id: nid(), t: 'if', cond, then: then || [], els: els || null }),
    decl: (ty, name, init) => ({ id: nid(), t: 'decl', ty, name, init }),
    set: (name, op, e) => ({ id: nid(), t: 'set', name, op, e }),
    pwm: (tim, ch) => ({ id: nid(), t: 'pwm', tim, ch }),
    cmp: (tim, ch, v) => ({ id: nid(), t: 'cmp', tim, ch, v }),
    call: (name, args) => ({ id: nid(), t: 'call', name, args }),
    note: text => ({ id: nid(), t: 'note', text })
  };

  /* ---------- پایه‌ها ---------- */
  function allPins(){
    const set = [];
    if(typeof CX_SIDES !== 'undefined' && typeof cxIsGpio === 'function'){
      CX_SIDES.flat().filter(cxIsGpio).forEach(p => { if(!set.includes(p)) set.push(p); });
      set.sort((a, b) => a[1] === b[1] ? (+a.slice(2)) - (+b.slice(2)) : a[1] < b[1] ? -1 : 1);
    } else {
      for(const p of 'AB') for(let i = 0; i < 16; i++) set.push('P' + p + i);
      set.push('PC13', 'PC14', 'PC15');
    }
    return set;
  }
  const cfgOf = pin => (typeof CUBE !== 'undefined' && CUBE.cfg) ? CUBE.cfg[pin] : undefined;
  const pinCode = pin => ({ port: 'GPIO' + pin[1], num: 'GPIO_PIN_' + pin.slice(2) });
  const pinOf = (portId, pinId) => {
    const a = /^GPIO([A-D])$/.exec(portId), b = /^GPIO_PIN_(\d{1,2})$/.exec(pinId);
    return (a && b && +b[1] <= 15) ? 'P' + a[1] + (+b[1]) : null;
  };

  /* ---------- بلوک ← متن (C) ---------- */
  function genExpr(e, pp, right){
    switch(e.t){
      case 'num': return String(e.v);
      case 'var': return e.name;
      case 'read': { const c = pinCode(e.pin); return `HAL_GPIO_ReadPin(${c.port}, ${c.num})`; }
      case 'un': { const s = e.op + genExpr(e.e, 7); return s; }
      case 'cx': return `${e.name}(${e.args.map(a => genExpr(a, 0)).join(', ')})`;
      case 'bin': {
        const p = PREC[e.op] || 1;
        const wrapKids = LOG.includes(e.op);
        const sub = (x) => (wrapKids && x.t === 'bin' && CMP.includes(x.op)) ? '(' + genExpr(x, 0) + ')' : genExpr(x, p, false);
        const l = sub(e.l);
        const r = (wrapKids && e.r.t === 'bin' && CMP.includes(e.r.op)) ? '(' + genExpr(e.r, 0) + ')' : genExpr(e.r, p, true);
        const s = `${l} ${e.op} ${r}`;
        return (p < pp || (p === pp && right)) ? '(' + s + ')' : s;
      }
    }
    return '0';
  }
  /* لیستِ بلوک‌ها ← { code, map } ؛ map: شماره‌ی خط (از ۱) ← شناسه‌ی بلوک (برای برجسته‌کردنِ اجرا) */
  function gen(list){
    const out = [], map = {};
    (function walk(list, ind){
      const sp = '  '.repeat(ind);
      list.forEach((s, i) => {
        const line = (txt, id) => { out.push(sp + txt); map[out.length] = id || s.id; };
        switch(s.t){
          case 'write': { const c = pinCode(s.pin); line(`HAL_GPIO_WritePin(${c.port}, ${c.num}, ${s.val ? 'GPIO_PIN_SET' : 'GPIO_PIN_RESET'});`); break; }
          case 'toggle': { const c = pinCode(s.pin); line(`HAL_GPIO_TogglePin(${c.port}, ${c.num});`); break; }
          case 'delay': line(`HAL_Delay(${genExpr(s.ms, 0)});`); break;
          case 'decl': line(`${s.ty} ${s.name}${s.init ? ' = ' + genExpr(s.init, 0) : ''};`); break;
          case 'set': line(`${s.name} ${s.op} ${genExpr(s.e, 0)};`); break;
          case 'pwm': line(`HAL_TIM_PWM_Start(&htim${s.tim}, TIM_CHANNEL_${s.ch});`); break;
          case 'cmp': line(`__HAL_TIM_SET_COMPARE(&htim${s.tim}, TIM_CHANNEL_${s.ch}, ${genExpr(s.v, 0)});`); break;
          case 'call': line(`${s.name}(${s.args.map(a => genExpr(a, 0)).join(', ')});`); break;
          case 'note':
            if(i > 0 && list[i - 1].t !== 'note') out.push('');
            line('// ' + s.text);
            break;
          case 'if': {
            let cur = s, head = 'if';
            for(;;){
              line(`${head} (${genExpr(cur.cond, 0)})`, cur.id);
              out.push(sp + '{'); walk(cur.then, ind + 1); out.push(sp + '}');
              if(!cur.els) break;
              if(cur.els.length === 1 && cur.els[0].t === 'if'){ cur = cur.els[0]; head = 'else if'; continue; }
              out.push(sp + 'else'); out.push(sp + '{'); walk(cur.els, ind + 1); out.push(sp + '}');
              break;
            }
            break;
          }
        }
      });
    })(list, 0);
    return { code: out.join('\n'), map };
  }

  /* ---------- متن (C) ← بلوک ---------- */
  function conv(a){            // عبارت: AST ← گره
    switch(a.k){
      case 'num': return N.num(a.v);
      case 'id': return N.vr(a.name);
      case 'un': return N.un(a.op, conv(a.e));
      case 'bin': return N.bin(a.op, conv(a.l), conv(a.r));
      case 'callx': {
        if(a.name === 'HAL_GPIO_ReadPin' && a.args.length === 2 && a.args[0].k === 'id' && a.args[1].k === 'id'){
          const p = pinOf(a.args[0].name, a.args[1].name); if(p) return N.read(p);
        }
        return N.cx(a.name, a.args.map(conv));
      }
    }
    return N.num(0);
  }
  const asList = s => !s ? [] : s.k === 'block' ? s.body.flatMap(asList) : [s];
  function stm(a, notes){
    switch(a.k){
      case 'decl': return [N.decl(a.ty || 'uint8_t', a.name, a.init ? conv(a.init) : null)];
      case 'assign': return [N.set(a.name, a.op, conv(a.e))];
      case 'if': {
        const then = asList(a.then).flatMap(x => stm(x, notes));
        let els = null;
        if(a.els) els = asList(a.els).flatMap(x => stm(x, notes));
        return [N.iff(conv(a.cond), then, els)];
      }
      case 'block': return a.body.flatMap(x => stm(x, notes));
      case 'call': {
        const e = a.e;
        if(e.k !== 'callx') return [N.call('?', [])];
        let m;
        if((m = /^__hbc(\d+)$/.exec(e.name))) return [N.note(notes[+m[1]] || '')];
        const A = e.args, id = i => (A[i] && A[i].k === 'id') ? A[i].name : null;
        if(e.name === 'HAL_GPIO_WritePin' && A.length === 3 && pinOf(id(0), id(1)) && (id(2) === 'GPIO_PIN_SET' || id(2) === 'GPIO_PIN_RESET'))
          return [N.write(pinOf(id(0), id(1)), id(2) === 'GPIO_PIN_SET' ? 1 : 0)];
        if(e.name === 'HAL_GPIO_TogglePin' && A.length === 2 && pinOf(id(0), id(1))) return [N.toggle(pinOf(id(0), id(1)))];
        if(e.name === 'HAL_Delay' && A.length === 1) return [N.delay(conv(A[0]))];
        const tim = i => (A[i] && A[i].k === 'un' && A[i].op === '&' && A[i].e.k === 'id' && (m = /^htim([1-4])$/.exec(A[i].e.name))) ? +m[1] : 0;
        const ch = i => (id(i) && (m = /^TIM_CHANNEL_([1-4])$/.exec(id(i)))) ? +m[1] : 0;
        if(e.name === 'HAL_TIM_PWM_Start' && A.length === 2 && tim(0) && ch(1)) return [N.pwm(tim(0), ch(1))];
        if(e.name === '__HAL_TIM_SET_COMPARE' && A.length === 3 && tim(0) && ch(1)) return [N.cmp(tim(0), ch(1), conv(A[2]))];
        return [N.call(e.name, A.map(conv))];
      }
    }
    return [];
  }
  /* نتیجه: { ok, tree } یا { ok:false, line, msg } ؛ lossy یعنی چیزی (کامنتِ وسطِ خط) در بلوک نگه داشته نمی‌شود */
  function parse(src){
    const notes = [];
    const pre = src.replace(/^[ \t]*\/\/(.*)$/gm, (m, t) => { notes.push(t.trim()); return `__hbc${notes.length - 1}();`; });
    const lossy = /\/\*|\/\//.test(pre);
    let ast;
    try{ ast = halParse(pre); }
    catch(e){ if(e && e.hal) return { ok: false, line: e.line, msg: e.message }; throw e; }
    return { ok: true, tree: ast.flatMap(x => stm(x, notes)), lossy };
  }

  /* ---------- پالت ---------- */
  function firstPin(kind, fallback){
    const want = kind === 'in' ? 'GPIO_Input' : 'GPIO_Output';
    const p = allPins().find(x => cfgOf(x) === want);
    return p || fallback;
  }
  const PALETTE = [
    { id: 'pins', icon: '📍', title: 'پایه‌ها', items: [
      { label: 'روشن / SET', hint: 'HAL_GPIO_WritePin(..., SET)', mk: () => N.write(firstPin('out', 'PC13'), 1) },
      { label: 'خاموش / RESET', hint: 'HAL_GPIO_WritePin(..., RESET)', mk: () => N.write(firstPin('out', 'PC13'), 0) },
      { label: 'برعکس‌کن', hint: 'HAL_GPIO_TogglePin', mk: () => N.toggle(firstPin('out', 'PC13')) }
    ] },
    { id: 'time', icon: '⏱️', title: 'زمان', items: [
      { label: 'صبر کن', hint: 'HAL_Delay', mk: () => N.delay(N.num(500)) }
    ] },
    { id: 'logic', icon: '🔀', title: 'شرط', items: [
      { label: 'اگر …', hint: 'if', mk: () => N.iff(N.bin('==', N.read(firstPin('in', 'PA0')), N.vr('GPIO_PIN_SET')), [], null), into: true },
      { label: 'اگر … وگرنه', hint: 'if / else', mk: () => N.iff(N.bin('==', N.read(firstPin('in', 'PA0')), N.vr('GPIO_PIN_SET')), [], []), into: true }
    ] },
    { id: 'vars', icon: '📦', title: 'متغیر', items: [
      { label: 'بساز', hint: 'uint8_t x = …', mk: () => N.decl('uint8_t', 'value', N.read(firstPin('in', 'PA0'))) },
      { label: 'مقدار بده', hint: 'x = …', mk: () => N.set('value', '=', N.num(0)) }
    ] },
    { id: 'pwm', icon: '🎚️', title: 'PWM', items: [
      { label: 'PWM را شروع کن', hint: 'HAL_TIM_PWM_Start', mk: () => N.pwm(1, 1) },
      { label: 'سرعت بده', hint: '__HAL_TIM_SET_COMPARE', mk: () => N.cmp(1, 1, N.num(500)) }
    ] },
    { id: 'note', icon: '💬', title: 'توضیح', items: [
      { label: 'یادداشت', hint: '// …', mk: () => N.note('توضیح') }
    ] }
  ];
  const COLOR = { write: 'pins', toggle: 'pins', delay: 'time', if: 'logic', decl: 'vars', set: 'vars', pwm: 'pwm', cmp: 'pwm', call: 'logic', note: 'note' };

  /* ---------- ساختنِ ادیتور ---------- */
  function mount(container, opts){
    opts = opts || {};
    const cats = PALETTE.filter(c => !opts.categories || opts.categories.includes(c.id));
    let tree = [], cursor = { arr: tree, idx: null }, curCat = cats[0] ? cats[0].id : 'pins';
    let reg = {}, dz = [], dragging = null, runId = null, errId = null, menu = null, errT = 0;
    let lastCode = '', lastMap = {};

    container.classList.add('hb');
    container.innerHTML = `
      <div class="hb-pal">
        <div class="hb-cats" role="tablist"></div>
        <div class="hb-items"></div>
      </div>
      <div class="hb-hint"></div>
      <div class="hb-canvas" tabindex="0" aria-label="${esc(opts.label || 'بلوک‌ها')}"></div>
      <div class="hb-trash" aria-hidden="true">🗑️ بلوک را این‌جا رها کن تا پاک شود</div>
      <div class="hb-preview"><div class="hb-ptitle">کدِ C که بلوک‌ها می‌سازند</div><div class="hal-ed"><div class="hal-gut hb-gut" aria-hidden="true"></div><pre class="hs-pre hb-code"></pre></div></div>`;
    const q = s => container.querySelector(s);
    const canvas = q('.hb-canvas'), itemsEl = q('.hb-items'), catsEl = q('.hb-cats'), hintEl = q('.hb-hint');

    /* --- ثبتِ گره‌ها (برای ویرایشِ عبارت‌ها) --- */
    function walkReg(){
      reg = {};
      const ex = (e, parent, key) => {
        reg[e.id] = { node: e, parent, key };
        if(e.t === 'bin'){ ex(e.l, e, 'l'); ex(e.r, e, 'r'); }
        else if(e.t === 'un') ex(e.e, e, 'e');
        else if(e.t === 'cx') e.args.forEach((a, i) => ex(a, e.args, i));
      };
      const st = (list) => list.forEach((s, i) => {
        reg[s.id] = { node: s, parent: list, key: i, stmt: true };
        if(s.t === 'if'){ ex(s.cond, s, 'cond'); st(s.then); if(s.els) st(s.els); }
        else if(s.t === 'delay') ex(s.ms, s, 'ms');
        else if(s.t === 'decl'){ if(s.init) ex(s.init, s, 'init'); }
        else if(s.t === 'set') ex(s.e, s, 'e');
        else if(s.t === 'cmp') ex(s.v, s, 'v');
        else if(s.t === 'call') s.args.forEach((a, k) => ex(a, s.args, k));
      });
      st(tree);
    }
    function declared(){
      const names = [];
      (function w(list){ list.forEach(s => { if(s.t === 'decl' && !names.includes(s.name)) names.push(s.name); if(s.t === 'if'){ w(s.then); if(s.els) w(s.els); } }); })(tree);
      return names;
    }

    /* --- HTML --- */
    function pinSel(value, kind, id, f){
      const want = kind === 'in' ? 'GPIO_Input' : kind === 'out' ? 'GPIO_Output' : null;
      const pins = allPins(); if(!pins.includes(value)) pins.unshift(value);
      const good = want ? pins.filter(p => cfgOf(p) === want) : [], rest = pins.filter(p => !good.includes(p));
      const opt = p => `<option value="${p}"${p === value ? ' selected' : ''}>${p}</option>`;
      return `<select class="hb-sel hb-pin" dir="ltr" data-id="${id}" data-f="${f}">`
        + (good.length ? `<optgroup label="${kind === 'in' ? 'ورودی‌های Cube' : 'خروجی‌های Cube'}">${good.map(opt).join('')}</optgroup><optgroup label="پایه‌های دیگر">${rest.map(opt).join('')}</optgroup>` : rest.map(opt).join(''))
        + '</select>';
    }
    const bad = (pin, kind) => { const want = kind === 'in' ? 'GPIO_Input' : 'GPIO_Output'; return cfgOf(pin) !== want ? want : ''; };
    const fixBtn = (pin, want) => want ? `<button type="button" class="hb-fix" data-hb="fix" data-pin="${pin}" data-fn="${want}" title="${pin} در Cube هنوز ${want} نشده؛ بزن تا همان‌جا تنظیمش کنی">⚠ ${pin} در Cube ${want === 'GPIO_Input' ? 'ورودی' : 'خروجی'} نیست</button>` : '';
    function exH(e){
      const m = `<button type="button" class="hb-exm" data-hb="exmenu" data-id="${e.id}" aria-label="تغییرِ نوعِ این بخش">▾</button>`;
      let inner = '';
      switch(e.t){
        case 'num': inner = `<input class="hb-n" type="number" inputmode="numeric" dir="ltr" value="${esc(e.v)}" data-id="${e.id}" data-f="v" aria-label="عدد">`; break;
        case 'var': {
          const names = [...CONSTS, ...declared()]; if(!names.includes(e.name)) names.push(e.name);
          inner = `<select class="hb-sel" dir="ltr" data-id="${e.id}" data-f="name">${names.map(n => `<option${n === e.name ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
          break;
        }
        case 'read': { const w = bad(e.pin, 'in'); inner = `<span class="hb-w">خواندنِ</span>${pinSel(e.pin, 'in', e.id, 'pin')}${fixBtn(e.pin, w)}`; break; }
        case 'un': inner = `<span class="hb-w">${e.op === '!' ? 'نه' : e.op === '-' ? 'منفی' : e.op}</span>${exH(e.e)}`; break;
        case 'cx': inner = `<span class="hb-w" dir="ltr">${esc(e.name)}(</span>${e.args.map(exH).join('')}<span class="hb-w">)</span>`; break;
        case 'bin': {
          const all = [...CMP, ...ARI, ...LOG];
          inner = `${exH(e.l)}<select class="hb-sel hb-op" dir="ltr" data-id="${e.id}" data-f="op">${all.map(o => `<option value="${o}"${o === e.op ? ' selected' : ''}>${OPNAME[o] ? o + ' (' + OPNAME[o] + ')' : o}</option>`).join('')}</select>${exH(e.r)}`;
          break;
        }
      }
      const kind = e.t === 'bin' ? (LOG.includes(e.op) ? 'log' : CMP.includes(e.op) ? 'cmp' : 'ari') : e.t;
      return `<span class="hb-ex hb-ex-${kind}" data-id="${e.id}">${m}${inner}</span>`;
    }
    const dzH = (arr, idx) => { dz.push({ arr, idx }); return `<div class="hb-dz${cursor.arr === arr && cursor.idx === idx ? ' hb-cur' : ''}" data-dz="${dz.length - 1}"><span>＋</span></div>`; };
    function listH(arr){
      let h = '';
      arr.forEach((s, i) => { h += dzH(arr, i) + blockH(s); });
      h += dzH(arr, arr.length);
      return `<div class="hb-list">${h}</div>`;
    }
    const grip = '<span class="hb-grip" data-grip title="بگیر و بکش">⠿</span>';
    const del = '<button type="button" class="hb-x" data-hb="del" aria-label="پاک کردن بلوک">✕</button>';
    function blockH(s){
      const cls = `hb-b hb-c-${COLOR[s.t] || 'logic'}${s.id === runId ? ' hb-run' : ''}${s.id === errId ? ' hb-err' : ''}`;
      const open = `<div class="${cls}" data-id="${s.id}">`;
      switch(s.t){
        case 'write': {
          const w = bad(s.pin, 'out');
          return `${open}<div class="hb-row">${grip}<span class="hb-w">پایه‌ی</span>${pinSel(s.pin, 'out', s.id, 'pin')}<span class="hb-w">را</span>
            <select class="hb-sel" dir="ltr" data-id="${s.id}" data-f="val"><option value="1"${s.val ? ' selected' : ''}>GPIO_PIN_SET (۱)</option><option value="0"${s.val ? '' : ' selected'}>GPIO_PIN_RESET (۰)</option></select><span class="hb-w">کن</span>${fixBtn(s.pin, w)}${del}</div></div>`;
        }
        case 'toggle': { const w = bad(s.pin, 'out'); return `${open}<div class="hb-row">${grip}<span class="hb-w">حالتِ پایه‌ی</span>${pinSel(s.pin, 'out', s.id, 'pin')}<span class="hb-w">را برعکس کن</span>${fixBtn(s.pin, w)}${del}</div></div>`; }
        case 'delay': return `${open}<div class="hb-row">${grip}<span class="hb-w">صبر کن</span>${exH(s.ms)}<span class="hb-w">میلی‌ثانیه</span>${del}</div></div>`;
        case 'decl': return `${open}<div class="hb-row">${grip}<span class="hb-w">متغیرِ</span><select class="hb-sel" dir="ltr" data-id="${s.id}" data-f="ty">${TYPES.map(t => `<option${t === s.ty ? ' selected' : ''}>${t}</option>`).join('')}</select><input class="hb-nm" dir="ltr" value="${esc(s.name)}" data-id="${s.id}" data-f="name" aria-label="اسمِ متغیر" size="${Math.max(4, s.name.length)}"><span class="hb-w">را بساز و بگذار</span>${s.init ? exH(s.init) : `<button type="button" class="hb-add" data-hb="initadd" data-id="${s.id}">＋ مقدار</button>`}${del}</div></div>`;
        case 'set': return `${open}<div class="hb-row">${grip}<span class="hb-w">متغیرِ</span><input class="hb-nm" dir="ltr" value="${esc(s.name)}" data-id="${s.id}" data-f="name" aria-label="اسمِ متغیر" size="${Math.max(4, s.name.length)}"><select class="hb-sel hb-op" dir="ltr" data-id="${s.id}" data-f="op"><option value="=" ${s.op === '=' ? 'selected' : ''}>= (بشود)</option><option value="+=" ${s.op === '+=' ? 'selected' : ''}>+= (اضافه کن)</option><option value="-=" ${s.op === '-=' ? 'selected' : ''}>-= (کم کن)</option></select>${exH(s.e)}${del}</div></div>`;
        case 'pwm': return `${open}<div class="hb-row">${grip}<span class="hb-w">PWM را روی تایمر</span><input class="hb-n" type="number" dir="ltr" min="1" max="4" value="${s.tim}" data-id="${s.id}" data-f="tim"><span class="hb-w">کانال</span><input class="hb-n" type="number" dir="ltr" min="1" max="4" value="${s.ch}" data-id="${s.id}" data-f="ch"><span class="hb-w">شروع کن</span>${del}</div></div>`;
        case 'cmp': return `${open}<div class="hb-row">${grip}<span class="hb-w">سرعتِ تایمر</span><input class="hb-n" type="number" dir="ltr" min="1" max="4" value="${s.tim}" data-id="${s.id}" data-f="tim"><span class="hb-w">کانال</span><input class="hb-n" type="number" dir="ltr" min="1" max="4" value="${s.ch}" data-id="${s.id}" data-f="ch"><span class="hb-w">را بگذار</span>${exH(s.v)}${del}</div></div>`;
        case 'call': return `${open}<div class="hb-row">${grip}<span class="hb-w" dir="ltr">${esc(s.name)}(</span>${s.args.map(exH).join('')}<span class="hb-w">)</span>${del}</div></div>`;
        case 'note': return `${open}<div class="hb-row">${grip}<span class="hb-w">💬</span><input class="hb-note" value="${esc(s.text)}" data-id="${s.id}" data-f="text" aria-label="توضیح">${del}</div></div>`;
        case 'if': {
          let h = `${open}<div class="hb-row">${grip}<span class="hb-w">اگر</span>${exH(s.cond)}<span class="hb-w">بود:</span>${del}</div><div class="hb-arm">${listH(s.then)}</div>`;
          let cur = s;
          while(cur.els && cur.els.length === 1 && cur.els[0].t === 'if'){
            const nx = cur.els[0];
            h += `<div class="hb-row hb-else" data-id="${nx.id}"><span class="hb-w">وگرنه اگر</span>${exH(nx.cond)}<span class="hb-w">بود:</span><button type="button" class="hb-x" data-hb="delelif" data-id="${nx.id}" aria-label="پاک کردن این شاخه">✕</button></div><div class="hb-arm">${listH(nx.then)}</div>`;
            cur = nx;
          }
          if(cur.els){
            h += `<div class="hb-row hb-else"><span class="hb-w">وگرنه:</span><button type="button" class="hb-x" data-hb="delelse" data-id="${cur.id}" aria-label="پاک کردن وگرنه">✕</button></div><div class="hb-arm">${listH(cur.els)}</div>`;
          } else {
            h += `<div class="hb-foot"><button type="button" class="hb-add" data-hb="addelif" data-id="${cur.id}">＋ وگرنه اگر</button><button type="button" class="hb-add" data-hb="addelse" data-id="${cur.id}">＋ وگرنه</button></div>`;
          }
          return h + '</div>';
        }
      }
      return '';
    }

    /* --- رسم --- */
    function paintPalette(){
      catsEl.innerHTML = cats.map(c => `<button type="button" class="hb-cat hb-c-${c.id}${c.id === curCat ? ' on' : ''}" data-cat="${c.id}" role="tab" aria-selected="${c.id === curCat}">${c.icon} ${c.title}</button>`).join('');
      const c = cats.find(x => x.id === curCat) || cats[0];
      itemsEl.innerHTML = c ? c.items.map((it, i) => `<button type="button" class="hb-chip hb-c-${c.id}" data-item="${c.id}:${i}" title="${esc(it.hint)}"><span class="hb-grip" aria-hidden="true">⠿</span>${esc(it.label)}<small dir="ltr">${esc(it.hint)}</small></button>`).join('') : '';
    }
    function paintHint(){
      hintEl.textContent = tree.length ? 'روی ＋ بزن تا جای بلوکِ بعدی را انتخاب کنی؛ بلوک‌ها را با ⠿ بگیر و جابه‌جا کن.' : 'یک بلوک از بالا بزن یا بگیر و این‌جا بینداز؛ برنامه‌ات از همین‌جا شروع می‌شود.';
    }
    function codeView(){
      const g = gen(tree); lastCode = g.code; lastMap = g.map;
      const lines = lastCode ? lastCode.split('\n') : [];
      const hl = (typeof halHighlight === 'function' ? halHighlight(lastCode) : esc(lastCode)).split('\n');
      q('.hb-code').innerHTML = lines.length ? lines.map((_, i) => `<div class="hb-ln" data-l="${i + 1}">${hl[i] || ' '}</div>`).join('') : '<span class="hb-empty">// هنوز بلوکی نیست</span>';
      q('.hb-gut').textContent = lines.length ? lines.map((_, i) => i + 1).join('\n') : '1';
    }
    function render(){
      const keepY = canvas.scrollTop;
      if(!validCursor()) cursor = { arr: tree, idx: null };
      walkReg(); dz = [];
      canvas.innerHTML = listH(tree);
      canvas.scrollTop = keepY;
      paintHint(); codeView();
    }
    function validCursor(){
      if(cursor.arr === tree) return true;
      let ok = false;
      (function w(list){ list.forEach(s => { if(s.t === 'if'){ if(s.then === cursor.arr || s.els === cursor.arr) ok = true; w(s.then); if(s.els) w(s.els); } }); })(tree);
      return ok;
    }
    let ntf = 0;
    function changed(structural){
      clearTimeout(ntf);
      if(structural) render(); else codeView();
      ntf = setTimeout(() => opts.onChange && opts.onChange(lastCode), 0);
    }

    /* --- افزودن / حذف / جابه‌جایی --- */
    function insertAt(arr, idx, node){
      if(idx == null || idx > arr.length) idx = arr.length;
      arr.splice(idx, 0, node);
    }
    function addFromPalette(catId, i){
      const it = (PALETTE.find(c => c.id === catId) || { items: [] }).items[i]; if(!it) return null;
      const node = it.mk();
      const arr = cursor.arr, idx = cursor.idx == null ? arr.length : cursor.idx;
      insertAt(arr, idx, node);
      cursor = it.into ? { arr: node.then, idx: 0 } : { arr, idx: idx + 1 };
      return node;
    }
    function removeNode(id){
      const r = reg[id]; if(!r || !r.stmt) return;
      const i = r.parent.indexOf(r.node); if(i >= 0) r.parent.splice(i, 1);
    }
    function containsList(node, arr){
      if(node.t !== 'if') return false;
      return node.then === arr || (node.els && node.els === arr) || node.then.some(s => containsList(s, arr)) || (node.els || []).some(s => containsList(s, arr));
    }

    /* --- منوی عبارت --- */
    function closeMenu(){ if(menu){ menu.remove(); menu = null; } }
    function openMenu(id, anchor){
      closeMenu();
      const r = reg[id]; if(!r) return;
      const e = r.node, inPin = firstPin('in', 'PA0'), vars = declared();
      const items = [];
      if(e.t !== 'num') items.push(['🔢 عدد', () => N.num(0)]);
      if(e.t !== 'var') items.push(['📦 متغیر / ثابت', () => N.vr(vars[0] || 'GPIO_PIN_SET')]);
      if(e.t !== 'read') items.push(['📥 خواندنِ پایه', () => N.read(inPin)]);
      items.push(['⚖️ مقایسه (مثلاً ==)', () => N.bin('==', e, N.num(1))]);
      items.push(['➕ محاسبه (مثلاً +)', () => N.bin('+', e, N.num(1))]);
      items.push(['🔗 و / یا', () => N.bin('&&', e, N.bin('==', N.read(inPin), N.vr('GPIO_PIN_SET')))]);
      items.push(['🚫 نه (برعکسِ شرط)', () => N.un('!', e)]);
      if(e.t === 'bin') items.push(['🧹 فقط سمتِ چپ را نگه دار', () => e.l]);
      if(e.t === 'un' && e.op !== '&') items.push(['🧹 «' + (e.op === '!' ? 'نه' : 'منفی') + '» را بردار', () => e.e]);
      menu = document.createElement('div');
      menu.className = 'hb-menu'; menu.setAttribute('role', 'menu');
      menu.innerHTML = items.map((it, i) => `<button type="button" role="menuitem" data-mi="${i}">${it[0]}</button>`).join('');
      document.body.appendChild(menu);
      const a = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
      let left = a.left + window.scrollX, top = a.bottom + window.scrollY + 4;
      if(left + mw > window.scrollX + window.innerWidth - 8) left = window.scrollX + window.innerWidth - mw - 8;
      if(left < window.scrollX + 8) left = window.scrollX + 8;
      if(a.bottom + mh + 8 > window.innerHeight) top = a.top + window.scrollY - mh - 4;
      menu.style.left = left + 'px'; menu.style.top = Math.max(window.scrollY + 4, top) + 'px';
      menu.addEventListener('click', ev => {
        const b = ev.target.closest('button[data-mi]'); if(!b) return;
        const nn = items[+b.dataset.mi][1](); closeMenu();
        const rr = reg[id]; if(!rr) return;
        rr.parent[rr.key] = nn; changed(true);
      });
      const first = menu.querySelector('button'); first && first.focus();
    }
    const onDocDown = ev => { if(menu && !menu.contains(ev.target) && !ev.target.closest('.hb-exm')) closeMenu(); };
    const onKey = ev => { if(ev.key === 'Escape') closeMenu(); };
    document.addEventListener('pointerdown', onDocDown, true);
    document.addEventListener('keydown', onKey);

    /* --- رویدادهای معمولی --- */
    container.addEventListener('click', ev => {
      const t = ev.target;
      const cat = t.closest('[data-cat]');
      if(cat){ curCat = cat.dataset.cat; paintPalette(); return; }
      const chip = t.closest('.hb-chip');
      if(chip){
        if(chip._dragged){ chip._dragged = false; return; }
        const [c, i] = chip.dataset.item.split(':'); const n = addFromPalette(c, +i);
        if(n){ changed(true); const el = canvas.querySelector(`[data-id="${n.id}"]`); el && el.scrollIntoView({ block: 'nearest' }); }
        return;
      }
      const d = t.closest('.hb-dz');
      if(d && canvas.contains(d)){ const z = dz[+d.dataset.dz]; if(z){ cursor = { arr: z.arr, idx: z.idx }; render(); } return; }
      const a = t.closest('[data-hb]'); if(!a) return;
      const id = a.dataset.id, r = reg[id];
      switch(a.dataset.hb){
        case 'del': removeNode(a.closest('.hb-b').dataset.id); changed(true); break;
        case 'delelif': { // شاخه‌ی «وگرنه اگر» را بردار: بقیه‌ی زنجیره به والدش می‌چسبد
          const hostIf = findParentIf(id); if(hostIf){ hostIf.els = r.node.els; changed(true); } break;
        }
        case 'delelse': { const n = (reg[id] || {}).node; if(n) n.els = null; changed(true); break; }
        case 'addelif': { const n = r.node; n.els = [N.iff(N.bin('==', N.read(firstPin('in', 'PA0')), N.vr('GPIO_PIN_SET')), [], null)]; cursor = { arr: n.els[0].then, idx: 0 }; changed(true); break; }
        case 'addelse': { const n = r.node; n.els = []; cursor = { arr: n.els, idx: 0 }; changed(true); break; }
        case 'initadd': { r.node.init = N.num(0); changed(true); break; }
        case 'exmenu': openMenu(id, a); break;
        case 'fix': opts.onFix && opts.onFix(a.dataset.pin, a.dataset.fn); break;
      }
    });
    function findParentIf(id){
      let hit = null;
      (function w(list){ list.forEach(s => { if(s.t === 'if'){ if(s.els && s.els.length === 1 && s.els[0].id === id) hit = s; w(s.then); if(s.els) w(s.els); } }); })(tree);
      return hit;
    }
    container.addEventListener('input', ev => {
      const el = ev.target; if(!el.dataset || !el.dataset.f || !canvas.contains(el)) return;
      const r = reg[el.dataset.id]; if(!r) return;
      const n = r.node, f = el.dataset.f;
      if(el.tagName === 'SELECT') return;                      // select ها در change
      if(f === 'v'){ const v = parseInt(el.value, 10); n.v = isNaN(v) ? 0 : v; }
      else if(f === 'tim' || f === 'ch'){ const v = Math.max(1, Math.min(4, parseInt(el.value, 10) || 1)); n[f] = v; }
      else if(f === 'name'){ n.name = el.value.replace(/[^A-Za-z0-9_]/g, '') || 'value'; }
      else n[f] = el.value;
      changed(false);
    });
    container.addEventListener('change', ev => {
      const el = ev.target; if(!el.dataset || !el.dataset.f || !canvas.contains(el)) return;
      const r = reg[el.dataset.id]; if(!r) return;
      const n = r.node, f = el.dataset.f;
      if(el.tagName === 'SELECT'){ n[f] = f === 'val' ? +el.value : el.value; changed(true); }
      else if(f === 'name'){ const old = n.name; n.name = el.value.replace(/[^A-Za-z0-9_]/g, '') || 'value'; renameVar(old, n.name, n); changed(true); }
      else changed(true);
    });
    function renameVar(old, neu, owner){ /* اسمِ متغیر در جاهای دیگر هم عوض شود، تا کد نشکند */
      if(old === neu || owner.t !== 'decl') return;
      const fix = e => { if(!e) return; if(e.t === 'var' && e.name === old) e.name = neu; else if(e.t === 'bin'){ fix(e.l); fix(e.r); } else if(e.t === 'un') fix(e.e); else if(e.t === 'cx') e.args.forEach(fix); };
      (function w(list){ list.forEach(s => { if(s.t === 'set' && s.name === old) s.name = neu; ['cond', 'ms', 'init', 'e', 'v'].forEach(k => s[k] && typeof s[k] === 'object' && fix(s[k])); if(s.args) s.args.forEach(fix); if(s.t === 'if'){ w(s.then); if(s.els) w(s.els); } }); })(tree);
    }
    /* --- کشیدن و رها کردن (pointer events؛ روی موبایل هم کار می‌کند) --- */
    let drag = null, rafScroll = 0;
    container.addEventListener('pointerdown', ev => {
      const g = ev.target.closest('.hb-grip'); if(!g || ev.button > 0) return;
      const chip = g.closest('.hb-chip'), blk = g.closest('.hb-b');
      if(!chip && !(blk && canvas.contains(blk))) return;
      drag = { chip, blk, id: blk ? blk.dataset.id : null, sx: ev.clientX, sy: ev.clientY, on: false, pid: ev.pointerId, target: null, ghost: null };
      try{ g.setPointerCapture(ev.pointerId); }catch(e){ /* noop */ }
      ev.preventDefault();
    });
    function startDrag(ev){
      drag.on = true;
      const g = document.createElement('div');
      g.className = 'hb-ghost';
      g.textContent = drag.chip ? drag.chip.firstChild.nextSibling.textContent : (drag.blk.querySelector('.hb-row').textContent.replace(/[⠿✕▾]/g, '').trim().slice(0, 40) || 'بلوک');
      document.body.appendChild(g); drag.ghost = g;
      container.classList.add('hb-dragging');
      if(drag.blk) drag.blk.classList.add('hb-lifted');
      const r = drag.blk ? reg[drag.id] : null;
      canvas.querySelectorAll('.hb-dz').forEach(d => {
        const z = dz[+d.dataset.dz]; if(!z) return;
        if(r && r.stmt && (containsList(r.node, z.arr) || (z.arr === r.parent && (z.idx === r.key || z.idx === r.key + 1)))) d.classList.add('hb-off');
      });
    }
    function moveDrag(ev){
      drag.ghost.style.left = ev.clientX + 'px'; drag.ghost.style.top = ev.clientY + 'px';
      let best = null, bd = 1e9;
      canvas.querySelectorAll('.hb-dz:not(.hb-off)').forEach(d => {
        const rc = d.getBoundingClientRect();
        if(ev.clientX < rc.left - 30 || ev.clientX > rc.right + 30) return;
        const dy = Math.abs(ev.clientY - (rc.top + rc.height / 2));
        if(dy < bd){ bd = dy; best = d; }
      });
      if(bd > 60) best = null;
      if(best !== drag.target){
        drag.target && drag.target.classList.remove('hb-hot');
        drag.target = best; best && best.classList.add('hb-hot');
      }
      const tr = q('.hb-trash').getBoundingClientRect(), pr = q('.hb-pal').getBoundingClientRect();
      const overTrash = !!drag.blk && ev.clientY > tr.top && ev.clientY < tr.bottom && ev.clientX > tr.left && ev.clientX < tr.right;
      q('.hb-trash').classList.toggle('hb-hot', overTrash); drag.trash = overTrash;
      // اسکرولِ خودکار نزدیکِ لبه‌ی بوم
      const cr = canvas.getBoundingClientRect();
      drag.sv = (ev.clientY < cr.top + 36 && ev.clientY > cr.top - 40) ? -1 : (ev.clientY > cr.bottom - 36 && ev.clientY < cr.bottom + 40) ? 1 : 0;
      if(drag.sv && !rafScroll){ const tick = () => { if(drag && drag.sv){ canvas.scrollTop += drag.sv * 9; rafScroll = requestAnimationFrame(tick); } else rafScroll = 0; }; rafScroll = requestAnimationFrame(tick); }
    }
    function endDrag(ev, cancel){
      const d = drag; drag = null; cancelAnimationFrame(rafScroll); rafScroll = 0;
      if(!d) return;
      if(d.ghost) d.ghost.remove();
      container.classList.remove('hb-dragging'); q('.hb-trash').classList.remove('hb-hot');
      canvas.querySelectorAll('.hb-hot,.hb-off,.hb-lifted').forEach(x => x.classList.remove('hb-hot', 'hb-off', 'hb-lifted'));
      if(!d.on){ return; }
      if(d.chip) d.chip._dragged = true;
      if(cancel) return;
      if(d.trash && d.id){ removeNode(d.id); changed(true); return; }
      if(!d.target) return;
      const z = dz[+d.target.dataset.dz]; if(!z) return;
      if(d.chip){
        const [c, i] = d.chip.dataset.item.split(':');
        const it = PALETTE.find(x => x.id === c).items[+i], node = it.mk();
        insertAt(z.arr, z.idx, node);
        cursor = it.into ? { arr: node.then, idx: 0 } : { arr: z.arr, idx: z.idx + 1 };
      } else {
        const r = reg[d.id]; if(!r) return;
        const node = r.node, from = r.parent, i = from.indexOf(node);
        let at = z.idx;
        if(from === z.arr && i < at) at--;
        from.splice(i, 1); z.arr.splice(at, 0, node);
        cursor = { arr: z.arr, idx: at + 1 };
      }
      changed(true);
    }
    container.addEventListener('pointermove', ev => {
      if(!drag || ev.pointerId !== drag.pid) return;
      if(!drag.on){ if(Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 6) return; startDrag(ev); }
      moveDrag(ev);
    });
    container.addEventListener('pointerup', ev => { if(drag && ev.pointerId === drag.pid) endDrag(ev, false); });
    container.addEventListener('pointercancel', ev => { if(drag && ev.pointerId === drag.pid) endDrag(ev, true); });

    /* --- API --- */
    function setTree(t){ tree = t; cursor = { arr: tree, idx: null }; runId = errId = null; render(); }
    paintPalette(); render();
    return {
      getCode(){ return lastCode; },
      /* متن ← بلوک؛ اگر کد خطا داشت، چیزی عوض نمی‌شود و {ok:false,msg,line} برمی‌گردد */
      setCode(src){
        const p = parse(src);
        if(!p.ok) return p;
        setTree(p.tree);
        return { ok: true, lossy: p.lossy };
      },
      isEmpty(){ return tree.length === 0; },
      refresh(){ render(); },             // وضعیتِ Cube عوض شده: هشدارها دوباره حساب شوند
      /* خطِ در حال اجرا (در کدِ تولیدشده) را روی بلوکِ مربوطه برجسته می‌کند؛ 0 یعنی هیچ */
      highlight(line){
        const id = line ? lastMap[line] : null;
        if(id === runId) return; runId = id || null;
        canvas.querySelectorAll('.hb-run').forEach(x => x.classList.remove('hb-run'));
        q('.hb-code').querySelectorAll('.hb-ln.on').forEach(x => x.classList.remove('on'));
        if(!runId) return;
        const el = canvas.querySelector(`[data-id="${runId}"]`); if(el){ el.classList.add('hb-run'); }
        const ln = q('.hb-code').querySelector(`.hb-ln[data-l="${line}"]`); if(ln) ln.classList.add('on');
      },
      markError(line){
        const id = lastMap[line]; if(!id) return;
        errId = id; render();
        const el = canvas.querySelector(`[data-id="${id}"]`); el && el.scrollIntoView({ block: 'nearest' });
        clearTimeout(errT); errT = setTimeout(() => { errId = null; render(); }, 2500);
      },
      destroy(){ document.removeEventListener('pointerdown', onDocDown, true); document.removeEventListener('keydown', onKey); closeMenu(); clearTimeout(errT); clearTimeout(ntf); }
    };
  }

  return { mount, parse, gen, N };
})();
