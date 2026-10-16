/* ================= STM32 HAL: شبیه‌ساز کدنویسی (رباتیک گام ۲ تا ۵) =================
   هر مأموریتِ کدنویسی دو مرحله دارد، دقیقاً مثل کار با STM32CubeIDE:
     مرحله ۱ — CubeMX: پایه‌های لازم را روی نقشه‌ی چیپ تنظیم کن (از cube-block.js).
              حالتِ پایه‌ها در «پروژه‌ی مشترک» (CUBE) می‌ماند، مثل فایل .ioc واقعی.
     مرحله ۲ — کد: داخل while(1) (و برای PWM، قبل از حلقه) بنویس و اجرا کن.
   اگر پایه‌ها تنظیم نشده باشند کد اجرا نمی‌شود، و اگر کد با پایه‌ای کار کند که در CubeMX
   ورودی/خروجی نشده، شبیه‌ساز مثل برد واقعی اثری نمی‌بیند و هشدار می‌دهد.

   مفسرِ کوچکی برای زیرمجموعه‌ای از C/HAL: متغیرهای عددی، if / else if / else، عبارت‌های
   شرطی (&& || ! == != < > <= >=)، محاسبات ساده و این توابع:
   HAL_GPIO_ReadPin / WritePin / TogglePin ، HAL_Delay ، HAL_TIM_PWM_Start ،
   __HAL_TIM_SET_COMPARE. هر مأموریت فقط یک «سخت‌افزارِ مجازی» (hsReadHw / hsBrainHw /
   hsMotorHw) و یک پیکربندی (HAL_CFG) دارد؛ ادیتور، اجرا، خطایابی و پیام‌ها مشترک است.
   وابسته به: cube-block.js (CUBE، cxSave، mountCubeMx، halHighlight)، toFa از quest.js و برای ربات متحرکِ گام ۴
   به quest-robotics.js (LL3_TRACKS، LL3_NEED، LL3_OFF، ll3New، ll3Sense، ll3Step). */
const HAL_STOP = { halStop: true };
const HAL_TYPES = ['int', 'uint8_t', 'uint16_t', 'uint32_t', 'int32_t', 'GPIO_PinState'];
function halErr(msg, line){ const e = new Error(msg); e.hal = true; e.line = line || 1; return e; }

function halTokenize(src){
  const code = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '');
  const re = /(\s+)|(\d+)|([A-Za-z_]\w*)|(&&|\|\||==|!=|<=|>=|\+=|-=|[-+*\/<>!=(),;{}&%])|([\s\S])/gy;
  const toks = []; let pos = 0, line = 1, m;
  while(pos < code.length){
    re.lastIndex = pos; m = re.exec(code); pos = re.lastIndex;
    if(m[1]){ line += (m[1].match(/\n/g) || []).length; continue; }
    if(m[2]) toks.push({ t: 'num', v: +m[2], line });
    else if(m[3]) toks.push({ t: 'id', v: m[3], line });
    else if(m[4]) toks.push({ t: 'op', v: m[4], line });
    else throw halErr(`نویسه‌ی «${m[5]}» در کد جایی ندارد`, line);
  }
  return toks;
}

function halParse(src){
  let toks = halTokenize(src);
  // اگر کاربر خودِ «while (1) { ... }» را هم نوشته بود (مثل main.c)، فقط بدنه‌اش را برمی‌داریم.
  if(toks.length >= 5 && toks[0].t === 'id' && toks[0].v === 'while' && toks[1].v === '(' && (toks[2].v === 1 || toks[2].v === 'true') && toks[3].v === ')' && toks[4].v === '{'){
    const lastT = toks[toks.length - 1];
    if(lastT.v !== '}') throw halErr('آکولادِ پایانیِ while را فراموش کرده‌ای', lastT.line);
    toks = toks.slice(5, -1);
  }
  let i = 0;
  const isOp = v => i < toks.length && toks[i].t === 'op' && toks[i].v === v;
  const lineNow = () => (toks[Math.min(i, toks.length - 1)] || { line: 1 }).line;
  const prevLine = () => (toks[i - 1] || toks[0] || { line: 1 }).line;
  const expectOp = (v, why) => { if(!isOp(v)) throw halErr(why, lineNow()); i++; };
  const endStmt = () => { if(!isOp(';')) throw halErr('آخر هر دستور باید «;» بگذاری', prevLine()); i++; };
  const level = (ops, sub) => () => {
    let l = sub();
    while(i < toks.length && toks[i].t === 'op' && ops.includes(toks[i].v)){
      const t = toks[i++]; const r = sub();
      l = { k: 'bin', op: t.v, l, r, line: t.line };
    }
    return l;
  };
  let parseUnary;
  const parseMul = level(['*', '/', '%'], () => parseUnary());
  const parseAdd = level(['+', '-'], parseMul);
  const parseRel = level(['<', '>', '<=', '>='], parseAdd);
  const parseEq = level(['==', '!='], parseRel);
  const parseAnd = level(['&&'], parseEq);
  const parseExpr = level(['||'], parseAnd);

  function parsePrimary(){
    const t = toks[i];
    if(!t) throw halErr('عبارت ناقص است', prevLine());
    if(t.t === 'num'){ i++; return { k: 'num', v: t.v, line: t.line }; }
    if(t.t === 'op' && t.v === '('){
      i++; const e = parseExpr();
      expectOp(')', 'پرانتز «)» را فراموش کرده‌ای');
      return e;
    }
    if(t.t === 'id'){
      i++;
      if(isOp('(')){
        i++; const args = [];
        if(!isOp(')')){
          for(;;){ args.push(parseExpr()); if(isOp(',')){ i++; continue; } break; }
        }
        expectOp(')', `پرانتز «)» بعد از ورودی‌های ${t.v} را فراموش کرده‌ای`);
        return { k: 'callx', name: t.v, args, line: t.line };
      }
      return { k: 'id', name: t.v, line: t.line };
    }
    throw halErr(`«${t.v}» اینجا جایی ندارد`, t.line);
  }
  parseUnary = () => {
    if(i < toks.length && toks[i].t === 'op' && (toks[i].v === '!' || toks[i].v === '-' || toks[i].v === '&')){
      const t = toks[i++];
      return { k: 'un', op: t.v, e: parseUnary(), line: t.line };
    }
    return parsePrimary();
  };

  function parseStmt(){
    const t = toks[i];
    if(!t) throw halErr('کد ناقص است', prevLine());
    if(t.t === 'op' && t.v === '{'){
      i++; const body = [];
      while(i < toks.length && !isOp('}')) body.push(parseStmt());
      expectOp('}', 'آکولادِ «}» را فراموش کرده‌ای');
      return { k: 'block', body, line: t.line };
    }
    if(t.t === 'op' && t.v === ';'){ i++; return { k: 'block', body: [], line: t.line }; }
    if(t.t === 'op') throw halErr(`«${t.v}» اینجا جایی ندارد`, t.line);
    if(t.t === 'num') throw halErr(`عدد ${t.v} اینجا جایی ندارد`, t.line);
    if(t.v === 'if'){
      i++;
      expectOp('(', 'بعد از if باید پرانتز «(» بیاید');
      const cond = parseExpr();
      expectOp(')', 'پرانتز «)» شرطِ if را ببند');
      const then = parseStmt();
      let els = null;
      if(i < toks.length && toks[i].t === 'id' && toks[i].v === 'else'){ i++; els = parseStmt(); }
      return { k: 'if', cond, then, els, line: t.line };
    }
    if(t.v === 'else') throw halErr('else باید درست بعد از یک if بیاید', t.line);
    if(['for', 'while', 'do', 'switch'].includes(t.v)) throw halErr(`دستور ${t.v} در این شبیه‌ساز پشتیبانی نمی‌شود؛ خودِ برنامه داخل while(1) مدام تکرار می‌شود`, t.line);
    if(HAL_TYPES.includes(t.v)){
      i++;
      const nm = toks[i];
      if(!nm || nm.t !== 'id') throw halErr('بعد از نوعِ متغیر یک اسم لازم است', t.line);
      i++;
      let init = null;
      if(isOp('=')){ i++; init = parseExpr(); }
      endStmt();
      return { k: 'decl', ty: t.v, name: nm.v, init, line: t.line };
    }
    const n2 = toks[i + 1];
    if(n2 && n2.t === 'op' && (n2.v === '=' || n2.v === '+=' || n2.v === '-=')){
      i += 2;
      const e = parseExpr();
      endStmt();
      return { k: 'assign', name: t.v, op: n2.v, e, line: t.line };
    }
    if(n2 && n2.t === 'op' && n2.v === '('){
      const e = parseExpr();
      endStmt();
      return { k: 'call', e, line: t.line };
    }
    throw halErr(`«${t.v}» اینجا معنی ندارد`, t.line);
  }

  const prog = [];
  while(i < toks.length){
    if(isOp('}')) throw halErr('یک آکولادِ «}» اضافه است', lineNow());
    prog.push(parseStmt());
  }
  return prog;
}

function halCompile(src){
  try{ return { prog: halParse(src) }; }
  catch(e){ if(e.hal) return { error: { msg: e.message, line: e.line } }; throw e; }
}

/* محیط متغیرها: زنجیره‌ی {v, up} تا متغیرهای قبل از حلقه (USER CODE 2) داخل حلقه هم دیده شوند */
function halScope(up){ return { v: Object.create(null), up: up || null }; }
function halFind(scope, name){
  for(let s = scope; s; s = s.up) if(Object.prototype.hasOwnProperty.call(s.v, name)) return s;
  return null;
}
function halNum(v, n){
  if(typeof v !== 'number') throw halErr('اینجا باید یک عدد (یا نتیجه‌ی خواندن پایه) بیاید', n.line);
  return v;
}
function halIdent(n, scope){
  const s = n.name, own = halFind(scope, s);
  if(own) return own.v[s];
  let m;
  if((m = s.match(/^GPIO([A-E])$/))) return { port: m[1] };
  if((m = s.match(/^GPIO_PIN_(\d+)$/)) && +m[1] <= 15) return { pin: +m[1] };
  if(s === 'GPIO_PIN_SET') return 1;
  if(s === 'GPIO_PIN_RESET') return 0;
  if((m = s.match(/^TIM_CHANNEL_([1-4])$/))) return { ch: +m[1] };
  if((m = s.match(/^htim([1-4])$/))) return { tim: +m[1] };
  if(s === 'HIGH' || s === 'LOW') throw halErr(`در STM32 به‌جای ${s} از ${s === 'HIGH' ? 'GPIO_PIN_SET' : 'GPIO_PIN_RESET'} استفاده می‌شود`, n.line);
  if(s === 'OUTPUT' || s === 'INPUT' || s === 'INPUT_PULLUP') throw halErr(`«${s}» مالِ آردوینو است؛ در STM32 حالتِ پایه را در CubeMX تنظیم می‌کنی`, n.line);
  throw halErr(`«${s}» تعریف نشده است. اگر متغیر است، اول با int یا uint8_t بسازش`, n.line);
}
function halCall(n, env, scope){
  const name = n.name;
  if(name === 'HAL_Delay') throw halErr('HAL_Delay باید یک دستورِ جدا باشد (جایی مثل داخل شرط یا محاسبه نمی‌آید)', n.line);
  const a = n.args.map(x => halEval(x, env, scope));
  const need = (c, msg) => { if(a.length !== c) throw halErr(`${name} ${msg}`, n.line); };
  const port = v => { if(!v || !v.port) throw halErr('ورودیِ اول باید پورت باشد، مثل GPIOA یا GPIOC', n.line); return v.port; };
  const pin = v => { if(!v || v.pin === undefined) throw halErr('ورودیِ دوم باید پایه باشد، مثل GPIO_PIN_13', n.line); return v.pin; };
  const tim = v => { if(!v || !v.tim) throw halErr('ورودیِ اول باید تایمر باشد، مثل &htim1', n.line); return v.tim; };
  const chan = v => { if(!v || !v.ch) throw halErr('ورودیِ دوم باید کانال باشد، مثل TIM_CHANNEL_1', n.line); return v.ch; };
  switch(name){
    case 'HAL_GPIO_ReadPin':
      need(2, 'دو ورودی می‌خواهد: پورت و پایه');
      return env.read(port(a[0]), pin(a[1]));
    case 'HAL_GPIO_WritePin': {
      need(3, 'سه ورودی می‌خواهد: پورت، پایه و مقدار');
      if(a[2] !== 0 && a[2] !== 1) throw halErr('ورودیِ سوم باید GPIO_PIN_SET یا GPIO_PIN_RESET باشد', n.line);
      env.write(port(a[0]), pin(a[1]), a[2]);
      return 0;
    }
    case 'HAL_GPIO_TogglePin':
      need(2, 'دو ورودی می‌خواهد: پورت و پایه');
      env.toggle(port(a[0]), pin(a[1]));
      return 0;
    case 'HAL_TIM_PWM_Start':
      need(2, 'دو ورودی می‌خواهد: تایمر (&htim1) و کانال (TIM_CHANNEL_1)');
      env.pwmStart(tim(a[0]), chan(a[1]));
      return 0;
    case '__HAL_TIM_SET_COMPARE':
      need(3, 'سه ورودی می‌خواهد: تایمر (&htim1)، کانال (TIM_CHANNEL_1) و عدد');
      env.compare(tim(a[0]), chan(a[1]), halNum(a[2], n));
      return 0;
    default:
      throw halErr(`تابع «${name}» در شبیه‌ساز پشتیبانی نمی‌شود`, n.line);
  }
}
function halEval(n, env, scope){
  switch(n.k){
    case 'num': return n.v;
    case 'id': return halIdent(n, scope);
    case 'callx': return halCall(n, env, scope);
    case 'un': {
      const v = halEval(n.e, env, scope);
      if(n.op === '&') return v;
      halNum(v, n);
      return n.op === '!' ? (v ? 0 : 1) : -v;
    }
    case 'bin': {
      if(n.op === '&&'){ return halNum(halEval(n.l, env, scope), n) && halNum(halEval(n.r, env, scope), n) ? 1 : 0; }
      if(n.op === '||'){ return halNum(halEval(n.l, env, scope), n) || halNum(halEval(n.r, env, scope), n) ? 1 : 0; }
      const a = halNum(halEval(n.l, env, scope), n), b = halNum(halEval(n.r, env, scope), n);
      switch(n.op){
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': if(b === 0) throw halErr('تقسیم بر صفر', n.line); return Math.trunc(a / b);
        case '%': if(b === 0) throw halErr('تقسیم بر صفر', n.line); return a % b;
        case '<': return a < b ? 1 : 0;
        case '>': return a > b ? 1 : 0;
        case '<=': return a <= b ? 1 : 0;
        case '>=': return a >= b ? 1 : 0;
        case '==': return a === b ? 1 : 0;
        case '!=': return a !== b ? 1 : 0;
      }
    }
  }
  throw halErr('عبارت نامعتبر', n.line);
}
async function halExec(n, env, scope, ctl){
  if(ctl.stopped()) throw HAL_STOP;
  if(ctl.step && n.k !== 'block') ctl.step(n);   // برای برجسته‌کردنِ بلوکِ در حال اجرا
  switch(n.k){
    case 'block': for(const s of n.body) await halExec(s, env, scope, ctl); return;
    case 'if': {
      const c = halEval(n.cond, env, scope);
      if(typeof c !== 'number') throw halErr('شرطِ if باید یک مقایسه یا عدد باشد', n.line);
      if(c) await halExec(n.then, env, scope, ctl); else if(n.els) await halExec(n.els, env, scope, ctl);
      return;
    }
    case 'decl': scope.v[n.name] = n.init ? halNum(halEval(n.init, env, scope), n) : 0; return;
    case 'assign': {
      const own = halFind(scope, n.name);
      if(!own) throw halErr(`«${n.name}» را اول باید با int یا uint8_t بسازی`, n.line);
      const v = halNum(halEval(n.e, env, scope), n);
      own.v[n.name] = n.op === '=' ? v : n.op === '+=' ? own.v[n.name] + v : own.v[n.name] - v;
      return;
    }
    case 'call': {
      const e = n.e;
      if(e.k === 'callx' && e.name === 'HAL_Delay'){
        if(e.args.length !== 1) throw halErr('HAL_Delay یک ورودی می‌خواهد: زمان به میلی‌ثانیه', n.line);
        const ms = halNum(halEval(e.args[0], env, scope), n);
        await env.delay(Math.max(0, ms));
        return;
      }
      halEval(e, env, scope);
      return;
    }
  }
}
/* همه‌ی گره‌های دستور را (با فرزندها) به fn می‌دهد */
function halWalk(list, fn){
  list.forEach(n => { fn(n); if(n.k === 'block') halWalk(n.body, fn); else if(n.k === 'if'){ halWalk([n.then], fn); if(n.els) halWalk([n.els], fn); } });
}
/* init یک‌بار اجرا می‌شود (USER CODE 2)، بعد prog مدام تکرار می‌شود (while(1)) */
async function halRun(init, prog, env, ctl){
  try{
    const mainScope = halScope();
    for(const s of init || []) await halExec(s, env, mainScope, ctl);
    while(!ctl.stopped()){
      const scope = halScope(mainScope);
      for(const s of prog) await halExec(s, env, scope, ctl);
      await env.cycle();
    }
  }catch(e){ if(e !== HAL_STOP) throw e; }
}

/* ---------- main.c: بخشی که CubeMX می‌نویسد، با توجه به پایه‌های تنظیم‌شده ---------- */
function hsMxCalls(){
  const set = new Set();
  Object.values(CUBE.cfg).forEach(f => {
    let m;
    if((m = f.match(/^TIM(\d)_CH/))) set.add(`MX_TIM${m[1]}_Init();`);
    else if((m = f.match(/^USART(\d)_/))) set.add(`MX_USART${m[1]}_UART_Init();`);
    else if((m = f.match(/^I2C(\d)_/))) set.add(`MX_I2C${m[1]}_Init();`);
    else if((m = f.match(/^SPI(\d)_/))) set.add(`MX_SPI${m[1]}_Init();`);
    else if((m = f.match(/^ADC(\d)_/))) set.add(`MX_ADC${m[1]}_Init();`);
  });
  return Array.from(set).map(l => '  ' + l + '\n').join('');
}
function halSkeleton(cfg){
  const init = '';
  return 'int main(void)\n{\n  HAL_Init();\n  SystemClock_Config();\n  MX_GPIO_Init();\n' + hsMxCalls() +
    '  /* USER CODE BEGIN 2 */\n' + init + '  /* USER CODE END 2 */\n\n' +
    '  /* USER CODE BEGIN WHILE */\n  while (1)\n  {\n    /* USER CODE END WHILE */\n\n    /* USER CODE BEGIN 3 */\n  }\n  /* USER CODE END 3 */\n}';
}
function halEditorHtml(small){
  return `<div class="hal-ed${small ? ' hs-small' : ''}"><div class="hal-gut" aria-hidden="true"></div><div class="hal-wrap"><pre class="hal-hl" aria-hidden="true"></pre><textarea class="hal-src" dir="ltr" spellcheck="false"></textarea></div></div>`;
}
function halEditorInit(root, label){
  const src = root.querySelector('.hal-src'), hl = root.querySelector('.hal-hl'), gut = root.querySelector('.hal-gut');
  src.setAttribute('aria-label', label);
  function paint(){
    hl.innerHTML = halHighlight(src.value) + '\n';
    gut.textContent = src.value.split('\n').map((_, k) => k + 1).join('\n');
  }
  src.addEventListener('input', paint);
  src.addEventListener('scroll', () => { hl.scrollTop = src.scrollTop; hl.scrollLeft = src.scrollLeft; gut.scrollTop = src.scrollTop; });
  src.addEventListener('keydown', e => {
    if(e.key === 'Tab'){
      e.preventDefault();
      const s = src.selectionStart, en = src.selectionEnd;
      src.value = src.value.slice(0, s) + '  ' + src.value.slice(en);
      src.selectionStart = src.selectionEnd = s + 2;
      paint();
    }
  });
  return { src, get value(){ return src.value; }, set(v){ src.value = v; paint(); } };
}

/* ---------- ورودی/خروجیِ HAL ← سخت‌افزارِ شبیه‌سازی‌شده ----------
   مفسرِ ArduinoSim (ArduinoLang) دستورهای HAL را اجرا می‌کند و این‌جا به حسگرها/LED/موتورها می‌رسند؛
   مثلِ برد واقعی، فقط پایه‌ای کار می‌کند که در CubeMX درست تنظیم شده باشد. */
function halIOFactory(hw, api){
  const warned = new Set(), started = {}, ccr = {};
  const warnOnce = (k, m) => { if(!warned.has(k)){ warned.add(k); api.log('⚠️ ' + m); } };
  const split = pin => [pin[1], +pin.slice(2)];
  const need = (pin, mode) => CUBE.cfg[pin] === mode || (warnOnce(pin + mode, `${pin} در CubeMX هنوز ${mode} نشده؛ این دستور اثری ندارد.`), false);
  const chPin = { '1.1': 'PA8', '1.2': 'PA9' };
  return {
    reset(){ warned.clear(); Object.keys(started).forEach(k => delete started[k]); Object.keys(ccr).forEach(k => delete ccr[k]); },
    write(pin, v){ if(need(pin, 'GPIO_Output')){ const [p, n] = split(pin); hw.write(p, n, v); } },
    read(pin){
      const [p, n] = split(pin);
      if(CUBE.cfg[pin] === 'GPIO_Output') return hw.out(p, n);
      return need(pin, 'GPIO_Input') ? hw.read(p, n) : 0;
    },
    out(pin){ const [p, n] = split(pin); return hw.out(p, n); },
    pwmStart(t, ch){
      const k = t + '.' + ch, p = chPin[k];
      if(!p){ warnOnce('pw' + k, 'فقط TIM1 با کانال ۱ (موتور چپ) و کانال ۲ (موتور راست) به موتورها وصل است'); return; }
      if(CUBE.cfg[p] !== `TIM1_CH${ch}`){ warnOnce('pm' + k, `${p} در CubeMX هنوز TIM1_CH${ch} نشده؛ PWM روی این پایه خروجی نمی‌دهد.`); return; }
      started[k] = true; api.log(`PWM روی ${p} شروع شد`); hw.compare(t, ch, ccr[k] || 0);
    },
    pwmCompare(t, ch, v){
      const k = t + '.' + ch;
      if(!chPin[k]){ warnOnce('pw' + k, 'فقط TIM1 با کانال ۱ (موتور چپ) و کانال ۲ (موتور راست) به موتورها وصل است'); return; }
      ccr[k] = v;
      if(!started[k]){ warnOnce('ps' + k, `برای کانال ${toFa(ch)} هنوز HAL_TIM_PWM_Start صدا زده نشده؛ تا آن موقع خروجی PWM صفر است.`); return; }
      hw.compare(t, ch, v);
    }
  };
}
/* متنِ اولیه‌ی ادیتور: یک int main() مثلِ CubeIDE؛ کدِ شروع داخلِ while(1) (و قبلِ آن برای PWM) */
function halMainText(cfg){
  const ind = (t, n) => (t || '').trim() ? t.replace(/\s+$/, '').split('\n').map(l => l ? ' '.repeat(n) + l : l).join('\n') + '\n' : '';
  return 'int main(void)\n{\n  HAL_Init();\n  SystemClock_Config();\n  MX_GPIO_Init();\n' + (cfg.pwm ? '  MX_TIM1_Init();\n' : '')
    + ind(cfg.initStarter, 2) + '\n  while (1)\n  {\n' + ind(cfg.starter, 4) + '  }\n}\n';
}

/* ---------- شبیه‌سازِ مشترکِ مأموریت‌های رباتیکِ STM32 ----------
   بالا: چیپ‌های خلاصه‌ی تنظیمات (همیشه دیده می‌شوند)؛ بعد دو تب: ⏱ ساعت / 🧩 پایه‌ها (Cube)؛ و زیرِ آن‌ها همیشه
   ادیتورِ مأموریت‌های آردوینو (ArduinoSim): سخت‌افزارِ ربات (sim-board-wrap)، دکمه‌ی «متنی / بلوکی»،
   تمام‌صفحه، اجرا و توقف؛ فقط سخت‌افزارش حسگرها/LED/موتورهای ربات است. */
function mountHalMission(container, cfg, { onSuccess, alreadyDone } = {}){
  const required = cfg.required || [];
  const id = Object.keys(HAL_CFG).find(k => HAL_CFG[k] === cfg) || 'robot';
  if(alreadyDone){ required.forEach(r => { CUBE.cfg[r.pin] = r.fn; }); cxSave(); }

  container.innerHTML = `
    <div class="sim-wrap hs-wrap">
      <div class="sim-hw-note">${cfg.goal}</div>
      ${cfg.preface || ''}
      <div class="hs-strip" aria-label="خلاصه‌ی تنظیمات Cube"></div>
      <div class="hs-bench">
        <div class="hs-tabsHost"></div>
        <div class="hs-pane"><div class="hs-cubemount"></div></div>
      </div>
      <div class="hs-box hs-pins"><div class="hs-box-t">📋 وضعیتِ پایه‌ها (همان‌طور که در CubeMX تنظیم کرده‌ای)</div><div class="hs-pins-body"></div></div>
      <div class="hs-simmount"></div>
    </div>`;
  const q = s => container.querySelector(s);
  const strip = q('.hs-strip');
  const pinsBody = q('.hs-pins-body');
  let tabs = null, cx = null, sim = null, curTab = 'cube', succeeded = !!alreadyDone;

  const pinProblem = () => {
    const bad = required.find(r => CUBE.cfg[r.pin] !== r.fn);
    return bad ? `⚠️ ${bad.pin} هنوز ${bad.fn} نشده — اول در تبِ «Cube» روی ${bad.pin} بزن و ${bad.fn} را انتخاب کن.` : '';
  };
  const FN = { GPIO_Input: 'ورودی', GPIO_Output: 'خروجی' };
  /* چیپ‌های بالای تب‌ها: چک‌لیستِ تنظیمات؛ ✓ انجام‌شده / ○ هنوز نه. */
  function paintStrip(){
    const c = cxClock(CUBE.clk);
    const label = (n, f) => `${n} · ${/^TIM/.test(f) ? 'PWM' : (FN[f] || f)}`;
    const items = [`<button type="button" class="hs-chipb ${c.ready ? 'ok' : 'todo'}" data-go="clock">⏱️ ${toFa(Math.round(c.sys))} MHz</button>`];
    required.forEach(r => {
      items.push(`<button type="button" class="hs-chipb ${CUBE.cfg[r.pin] === r.fn ? 'ok' : 'todo'}" data-go="${r.pin}" data-fn="${r.fn}" dir="ltr">${label(r.pin, r.fn)}</button>`);
    });
    strip.innerHTML = items.join('');
    paintPins();
  }
  /* جدول وضعیتِ پایه‌ها: هر پایه‌ی لازم، کارِ مورد نیاز، کارِ فعلی و درست/نادرست؛ روی هر ردیف بزنی در نقشه‌ی چیپ نشانش می‌دهد. */
  function paintPins(){
    const role = r => { const m = (r.label || '').match(/\(([^)]*)\)/); return m ? m[1].replace(/[؛;].*$/, '').trim() : ''; };
    const cell = 'padding:6px 8px;';
    const rowsReq = required.map(r => {
      const cur = CUBE.cfg[r.pin] || '', ok = cur === r.fn;
      const st = ok ? '<span style="color:#57d8a3">✅ درست</span>'
        : cur ? `<span style="color:#ff8a80">⚠️ اشتباه (الان ${cur})</span>`
        : '<span style="color:#d4af37">○ هنوز تنظیم نشده</span>';
      return `<tr data-go="${r.pin}" data-fn="${r.fn}" tabindex="0" style="cursor:pointer"><td dir="ltr" style="${cell}text-align:left"><b>${r.pin}</b></td><td style="${cell}">${role(r) || '—'}</td><td dir="ltr" style="${cell}text-align:left">${r.fn}</td><td dir="ltr" style="${cell}text-align:left">${cur || 'Reset_State'}</td><td style="${cell}">${st}${ok ? '' : ` <button type="button" class="sim-btn sim-btn-run" data-fix="${r.pin}" style="padding:2px 8px;font-size:12px">🔧 درست کن</button>`}</td></tr>`;
    });
    const left = required.filter(r => CUBE.cfg[r.pin] !== r.fn).length;
    const sum = !required.length ? '' : left
      ? `<div class="hs-p" style="margin-top:8px">⏳ ${toFa(left)} پایه از ${toFa(required.length)} پایه هنوز درست تنظیم نشده. روی هر ردیف بزنی همان پایه در نقشه‌ی بالا انتخاب می‌شود. <button type="button" class="sim-btn sim-btn-run" data-fix="all" style="padding:2px 10px;font-size:12px">🔧 همه را درست کن</button></div>`
      : `<div class="hs-p" style="margin-top:8px;color:#57d8a3">✅ هر ${toFa(required.length)} پایه درست تنظیم شده؛ حالا کد بنویس.</div>`;
    pinsBody.innerHTML = `<table class="hs-table" style="width:100%"><tr><th>پایه</th><th>کار در ربات</th><th>باید باشد</th><th>الان</th><th>وضعیت</th></tr>${rowsReq.join('')}</table>${sum}`;
  }
  const goPin = tr => { if(!tr || !tr.dataset.go) return; tabs.set('cube'); cx.focus(tr.dataset.go, tr.dataset.fn); };
  /* «درست کن»: پایه(ها) را همان‌جا مثل CubeMX تنظیم می‌کند و نقشه و چیپ‌ها و ادیتور را تازه می‌کند. */
  function fixPins(which){
    required.forEach(r => { if((which === 'all' || which === r.pin) && CUBE.cfg[r.pin] !== r.fn) CUBE.cfg[r.pin] = r.fn; });
    cxSave();
    buildCx();
    refreshAll();
  }
  pinsBody.addEventListener('click', e => {
    const fb = e.target.closest('[data-fix]');
    if(fb){ e.stopPropagation(); fixPins(fb.dataset.fix); return; }
    goPin(e.target.closest('tr[data-go]'));
  });
  pinsBody.addEventListener('keydown', e => { if(e.target.closest('[data-fix]')) return; if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); goPin(e.target.closest('tr[data-go]')); } });
  strip.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if(!b) return;
    if(b.dataset.go === 'clock') tabs.set('clock'); else { tabs.set('cube'); cx.focus(b.dataset.go, b.dataset.fn); }
  });

  function mountSim(){
    if(sim) return;
    sim = ArduinoSim.mount(q('.hs-simmount'), {
      missionId: 'hal-' + id, task: 'stm32robot', alreadyDone,
      onSuccess: () => { succeeded = true; onSuccess && onSuccess(); },
      hal: {
        hint: 'کد را بنویس (متنی یا بلوکی) و «اجرا کن» را بزن.',
        starter: halMainText(cfg),
        blocksTask: cfg.pwm ? 'hal_pwm' : 'hal',
        initLines: ['HAL_Init();', 'SystemClock_Config();', 'MX_GPIO_Init();'].concat(cfg.pwm ? ['MX_TIM1_Init();'] : []),
        successText: cfg.successMsg,
        successLog: '✓ شرطِ مأموریت در شبیه‌ساز برقرار شد.',
        pending: cfg.pending,
        hw: (root, api) => cfg.hw(root, api),
        io: (hw, api) => halIOFactory(hw, api),
        ctx: () => ({ cfg: Object.assign({}, CUBE.cfg) }),
        preRun: pinProblem
      }
    });
  }

  tabs = cxTabs(q('.hs-tabsHost'), [
    { id: 'clock', icon: '⏱️', label: 'ساعت' },
    { id: 'cube', icon: '🧩', label: 'پایه‌ها (Cube)' }
  ], id => { curTab = id; cx.showPart(id === 'clock' ? 'clock' : 'pins'); });
  const marks = s => {
    tabs.mark('cube', s.pinsOk ? 'ok' : 'todo');
    tabs.mark('clock', s.clockReady ? 'ok' : s.clockBad ? 'todo' : '');
  };
  function buildCx(){
    if(cx){ try{ cx.stop(); }catch(_){} }
    q('.hs-cubemount').innerHTML = '';
    cx = mountCubeMx(q('.hs-cubemount'), {
    goal: 'روی هر پایه‌ی نقشه بزن و کارش را (مثل منوی CubeMX) انتخاب کن. چک‌لیستِ پایه‌های لازم همان چیپ‌های بالای صفحه است؛ روی هر چیپ بزنی همین‌جا با قابِ طلایی نشانت می‌دهم.',
    required,
    showClock: true, clockRequired: false,
    showList: false, showCode: false,
    status: true,
    successMsg: '✅ همه‌ی پایه‌های این مأموریت درست تنظیم شد. حالا برنامه را در ادیتورِ پایین بساز.',
    onGoClock: () => tabs.set('clock'),
    onChange(s){
      marks(s); paintStrip(); if(sim) sim.pushHalContext();
    }
    });
    cx.showPart(curTab === 'clock' ? 'clock' : 'pins');
  }
  const refreshAll = () => {
    marks({ pinsOk: !pinProblem(), clockReady: cxClock(CUBE.clk).ready, clockBad: !cxClock(CUBE.clk).ok });
    paintStrip(); if(sim) sim.pushHalContext();
  };
  buildCx();
  paintStrip();
  marks({ pinsOk: !pinProblem(), clockReady: cxClock(CUBE.clk).ready, clockBad: !cxClock(CUBE.clk).ok });
  tabs.set('cube');
  mountSim(); sim.pushHalContext();
  return { stop(){ if(sim) sim.stop(); cx.stop(); } };
}

/* ---------- سخت‌افزار ۱: سنسور روی PA0 و LED روی PC13 ---------- */
function hsReadHw(root, api){
  root.innerHTML = `
    <svg class="hs-svg" viewBox="0 0 320 160" direction="ltr" role="img" aria-label="سنسور خط‌یاب روی خط مشکی و LED روی PC13">
      <rect x="20" y="104" width="190" height="42" rx="6" style="fill:#111111;stroke:#667"/>
      <polygon points="116,76 128,76 138,104 106,104" style="fill:rgba(255,110,110,.35)"/>
      <rect x="100" y="42" width="40" height="34" rx="5" style="fill:#2b6cb0"/>
      <text x="120" y="63" font-size="11" text-anchor="middle" style="fill:#fff">IR</text>
      <text x="120" y="32" font-size="10" text-anchor="middle">سنسور ← PA0</text>
      <circle id="hrLed" cx="262" cy="70" r="15" style="fill:#1f3a24;stroke:#667;stroke-width:2"/>
      <text x="262" y="104" font-size="10" text-anchor="middle">LED روی PC13</text>
    </svg>
    <div class="hs-chips"><span id="hrPin"></span><span id="hrP13"></span></div>`;
  const q = s => root.querySelector(s);
  let out = { C13: 1 }, seenB = false, holdB = 0, wrongT = 0;
  function paint(){
    const on = out.C13 === 0;
    const led = q('#hrLed');
    led.style.fill = on ? '#7dffa0' : '#1f3a24';
    led.style.filter = on ? 'drop-shadow(0 0 8px #7dffa0)' : 'none';
    q('#hrPin').textContent = `PA0 = ${toFa(1)} (خط مشکی)`;
    q('#hrP13').textContent = `PC13 = ${toFa(out.C13)} (LED ${on ? 'روشن' : 'خاموش'})`;
  }
  return {
    read: (p, n) => (p === 'A' && n === 0) ? 1 : 0,
    write(p, n, v){
      if(p === 'C' && n === 13){
        if(out.C13 !== v){ out.C13 = v; api.log(`PC13 = ${v}  (LED ${v ? 'خاموش' : 'روشن'})`); }
      } else api.log(`⚠️ P${p}${n} به چیزی در این مأموریت وصل نیست`);
    },
    out: (p, n) => (p === 'C' && n === 13) ? out.C13 : 0,
    compare(){},
    reset(){ out = { C13: 1 }; seenB = false; holdB = wrongT = 0; paint(); },
    tick(dt){
      paint();
      if(!api.running()) return;
      const on = out.C13 === 0;
      if(on){ holdB += dt; wrongT = 0; if(holdB >= 0.3) seenB = true; } else { holdB = 0; wrongT += dt; }
      if(seenB) return;
      if(wrongT > 1.2) api.say('error', '⚠️ زیر سنسور مشکی است (PA0 = ۱) ولی LED خاموش مانده. شرطِ if را بررسی کن؛ روی Blue Pill روشن‌شدنِ LED یعنی GPIO_PIN_RESET.');
      else api.say('running', '▶ در حال اجرا… اگر سنسور مشکی را دید، LED باید روشن شود.');
    },
    isDone: () => seenB
  };
}

/* ---------- سخت‌افزار ۲: سه سنسور (PA0/PA1/PA2) و سه چراغ تصمیم (PB12/PB13/PB14) ---------- */
const HS_SCN = [
  { name: 'خط وسط',  s: [0, 1, 0], exp: [0, 1, 0], lx: 145 },
  { name: 'خط چپ',   s: [1, 0, 0], exp: [1, 0, 0], lx: 95 },
  { name: 'خط راست', s: [0, 0, 1], exp: [0, 0, 1], lx: 195 },
  { name: 'خط گم شد', s: [0, 0, 0], exp: [0, 0, 0], lx: 255 }
];
const HS_LAMP = ['چپ', 'مستقیم', 'راست'];
function hsBrainHw(root, api){
  root.innerHTML = `
    <svg class="hs-svg" viewBox="0 0 320 180" direction="ltr" role="img" aria-label="سه سنسور روی مسیر و سه چراغ تصمیم">
      <rect x="10" y="8" width="300" height="100" rx="8" style="fill:#e9e6dc"/>
      <rect id="hbLine" x="145" y="8" width="30" height="100" style="fill:#111"/>
      <rect x="86" y="44" width="148" height="52" rx="10" style="fill:rgba(43,108,176,.28);stroke:#2b6cb0"/>
      <circle id="hbS0" cx="110" cy="70" r="10" style="fill:#555"/><circle id="hbS1" cx="160" cy="70" r="10" style="fill:#555"/><circle id="hbS2" cx="210" cy="70" r="10" style="fill:#555"/>
      <text x="110" y="92" font-size="9" text-anchor="middle" style="fill:#333">PA0 چپ</text><text x="160" y="92" font-size="9" text-anchor="middle" style="fill:#333">PA1 وسط</text><text x="210" y="92" font-size="9" text-anchor="middle" style="fill:#333">PA2 راست</text>
      <circle id="hbL0" cx="80" cy="136" r="12" style="fill:#3a3f4a;stroke:#667;stroke-width:2"/><circle id="hbL1" cx="160" cy="136" r="12" style="fill:#3a3f4a;stroke:#667;stroke-width:2"/><circle id="hbL2" cx="240" cy="136" r="12" style="fill:#3a3f4a;stroke:#667;stroke-width:2"/>
      <text x="80" y="165" font-size="9" text-anchor="middle">چپ · PB12</text><text x="160" y="165" font-size="9" text-anchor="middle">مستقیم · PB13</text><text x="240" y="165" font-size="9" text-anchor="middle">راست · PB14</text>
    </svg>
    <div class="ir-tabs">${HS_SCN.map((s, i) => `<button type="button" class="sim-btn ${i === 0 ? 'sim-btn-run' : 'sim-btn-ghost'}" data-c="${i}">${['⬆️', '⬅️', '➡️', '❌'][i]} ${s.name}</button>`).join('')}</div>
    <div class="hs-chips" id="hbChips"></div>`;
  const q = s => root.querySelector(s);
  let scn = 0, lamps = [0, 0, 0], seen = [false, false, false, false], hold = 0, wrongT = 0;
  const lampPins = { 12: 0, 13: 1, 14: 2 };
  const onNames = arr => { const n = arr.map((v, i) => v ? HS_LAMP[i] : null).filter(Boolean); return n.length ? 'چراغ ' + n.join(' و ') : 'هیچ چراغی'; };
  function paint(){
    const S = HS_SCN[scn];
    q('#hbLine').setAttribute('x', S.lx);
    S.s.forEach((v, i) => { q('#hbS' + i).style.fill = v ? '#ff5a4f' : '#555'; });
    lamps.forEach((v, i) => {
      const el = q('#hbL' + i);
      el.style.fill = v ? (i === 1 ? '#7dffa0' : '#ffd25a') : '#3a3f4a';
      el.style.filter = v ? 'drop-shadow(0 0 8px ' + (i === 1 ? '#7dffa0' : '#ffd25a') + ')' : 'none';
    });
    q('#hbChips').innerHTML = HS_SCN.map((s, i) => `<span>${seen[i] ? '✅' : '○'} ${s.name}</span>`).join('');
    root.querySelectorAll('[data-c]').forEach(b => {
      const a = +b.dataset.c === scn;
      b.classList.toggle('sim-btn-run', a); b.classList.toggle('sim-btn-ghost', !a);
    });
  }
  root.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button[data-c]') : null;
    if(!b) return;
    scn = +b.dataset.c; hold = wrongT = 0; paint();
  });
  return {
    read: (p, n) => (p === 'A' && n >= 0 && n <= 2) ? HS_SCN[scn].s[n] : 0,
    write(p, n, v){
      if(p === 'B' && lampPins[n] !== undefined){
        if(lamps[lampPins[n]] !== v){ lamps[lampPins[n]] = v; api.log(`PB${n} = ${v}  (چراغ ${HS_LAMP[lampPins[n]]} ${v ? 'روشن' : 'خاموش'})`); }
      } else api.log(`⚠️ P${p}${n} به چراغی در این مأموریت وصل نیست`);
    },
    out: (p, n) => (p === 'B' && lampPins[n] !== undefined) ? lamps[lampPins[n]] : 0,
    compare(){},
    reset(){ lamps = [0, 0, 0]; seen = [false, false, false, false]; hold = wrongT = 0; paint(); },
    tick(dt){
      paint();
      if(!api.running()) return;
      const S = HS_SCN[scn], ok = S.exp.every((v, i) => v === lamps[i]);
      if(ok){
        hold += dt; wrongT = 0;
        if(hold >= 0.35 && (scn !== 3 || seen[0] || seen[1] || seen[2])) seen[scn] = true;
      } else { hold = 0; wrongT += dt; }
      if(seen.every(Boolean)) return;
      if(wrongT > 1.2) api.say('error', `⚠️ برای «${S.name}» باید ${onNames(S.exp)} روشن باشد، ولی الان ${onNames(lamps)} روشن است.`);
      else if(wrongT === 0) api.say('running', `🧠 ${toFa(seen.filter(Boolean).length)} از ۴ حالت درست است — حالت‌های دیگر را هم با دکمه‌ها امتحان کن.`);
    },
    isDone: () => seen.every(Boolean)
  };
}

/* ---------- سخت‌افزار ۲ (ربات متحرک): سه سنسور روی مسیر + سه چراغ تصمیم (PB12/PB13/PB14) ----------
   خودِ برنامه‌ی کاربر ربات را می‌راند: چراغ PB13 روشن ← مستقیم، PB12 ← چپ، PB14 ← راست و اگر هیچ‌کدام
   روشن نبود ← ایست. سنسورها از روی جای ربات روی مسیر خوانده می‌شوند (PA0 چپ، PA1 وسط، PA2 راست).
   مأموریت وقتی کامل می‌شود که ربات با کدِ کاربر خط را تا 🏁 برود (یک مسیر کافی است). */
function hsBrainRobotHw(root, api){
  const TR = LL3_TRACKS, NEED = 1, BASE = 60;   // رسیدن به 🏁 در یک مسیر کافی است
  const lampPins = { 12: 0, 13: 1, 14: 2 };
  const DEC = { straight: '⬆️ مستقیم', left: '⬅️ به چپ', right: '➡️ به راست', stop: '⏹️ ایست (هیچ چراغی روشن نیست)' };
  const sensorDots = LL3_OFF.map(o => `<circle class="hbr-s" cx="15" cy="${o}" r="3.2" fill="#555"/>`).join('');
  root.innerHTML = `<div class="hbr-wrap" style="width:100%;min-width:0;flex:1 1 100%">
    <div class="ir-tabs">${TR.map((t, i) => `<button type="button" class="sim-btn ${i ? 'sim-btn-ghost' : 'sim-btn-run'}" data-t="${i}">${t.name}</button>`).join('')}<button type="button" class="sim-btn sim-btn-ghost" data-a="restart">↺ ربات از اول</button></div>
    <svg class="ls-svg" viewBox="0 0 320 190" direction="ltr" role="img" aria-label="ربات سه‌سنسوره که کدِ تو را روی مسیر اجرا می‌کند" style="cursor:default">
      <rect width="320" height="190" fill="#e9e6dc"/>
      <path class="hbr-track" fill="none" stroke="#111" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline class="hbr-trail" fill="none" stroke="#1fa37a" stroke-opacity=".75" stroke-width="2" stroke-linejoin="round"/>
      <text class="hbr-flag" font-size="16" text-anchor="middle">🏁</text>
      <g class="hbr-bot">
        <rect x="-8" y="-14" width="13" height="5" rx="1.5" fill="#15171c"/><rect x="-8" y="9" width="13" height="5" rx="1.5" fill="#15171c"/>
        <rect x="-12" y="-9" width="23" height="18" rx="4" fill="#2b6cb0" stroke="#8fc0f5"/>
        <rect x="-7" y="-5" width="10" height="10" rx="1.5" fill="#0e1117" stroke="#57d8a3" stroke-width=".8"/>
        <circle cx="-9.5" cy="0" r="2.2" fill="#cfd4dc"/>
        <rect x="10" y="-2.5" width="3" height="5" fill="#2a2f3a"/>
        <rect x="12" y="-18" width="6" height="36" rx="2" fill="#1a2130" stroke="#c97c3d" stroke-width="1"/>
        ${sensorDots}
      </g>
    </svg>
    </div>`;
  const q = x => root.querySelector(x);
  const trackEl = q('.hbr-track'), trailEl = q('.hbr-trail'), flagEl = q('.hbr-flag'), bot = q('.hbr-bot');
  const dots = Array.from(root.querySelectorAll('.hbr-s'));
  let ti = 0, s = null, lamps = [0, 0, 0], finished = new Set(), lastMsg = '', lastAct = '';
  const fresh = () => { const n = ll3New(TR[ti]); n.vals = ll3Sense(n, TR[ti]); return n; };
  const actOf = () => lamps[1] ? 'straight' : lamps[0] ? 'left' : lamps[2] ? 'right' : 'stop';
  const note = (st, t) => { const k = st + '|' + t; if(k !== lastMsg){ lastMsg = k; api.say(st, t); } };
  const decide = () => actOf();
  function loadTrack(i){
    ti = i; s = fresh(); lastMsg = '';
    const tr = TR[i], e = tr.pts[tr.pts.length - 1];
    trackEl.setAttribute('d', 'M' + tr.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L'));
    flagEl.setAttribute('x', e[0]); flagEl.setAttribute('y', e[1] - 8);
    root.querySelectorAll('[data-t]').forEach(b => { const on = +b.dataset.t === i; b.classList.toggle('sim-btn-run', on); b.classList.toggle('sim-btn-ghost', !on); });
  }
  function paint(){
    bot.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${(s.phi * 180 / Math.PI).toFixed(1)})`);
    dots.forEach((c, k) => c.setAttribute('fill', s.vals[k] ? '#ff5a4f' : '#555'));
    trailEl.setAttribute('points', s.trail.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
  }
  function failText(){
    if(s.fail === 'stuck'){
      const who = [s.vals[0] ? 'چپ' : '', s.vals[1] ? 'وسط' : '', s.vals[2] ? 'راست' : ''].filter(Boolean).join(' و ');
      return `⚠️ ربات ایستاد: سنسورِ ${who} خط را دید ولی کدت هیچ چراغی را روشن نکرد (PB13 مستقیم، PB12 چپ، PB14 راست). شرط‌ها را بررسی کن.`;
    }
    if(s.fail === 'lost') return '⚠️ ربات خط را گم کرد. شرط‌ها را بررسی کن: وسط ← PB13، چپ ← PB12، راست ← PB14؛ شرطِ وسط باید اول بیاید. برای دوباره امتحان‌کردن «ربات از اول» را بزن.';
    return '⚠️ ربات خیلی کند رفت و وقت تمام شد. برای دوباره امتحان‌کردن «ربات از اول» را بزن.';
  }
  root.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if(!b) return;
    if(b.dataset.t != null) loadTrack(+b.dataset.t);
    else if(b.dataset.a === 'restart') loadTrack(ti);
    paint();
  });
  loadTrack(0); paint();
  return {
    read: (p, n) => (p === 'A' && n >= 0 && n <= 2) ? s.vals[n] : 0,
    write(p, n, v){
      if(p === 'B' && lampPins[n] !== undefined) lamps[lampPins[n]] = v;
      else api.log(`⚠️ P${p}${n} به چراغی در این مأموریت وصل نیست (چراغ‌ها: PB12، PB13، PB14)`);
    },
    out: (p, n) => (p === 'B' && lampPins[n] !== undefined) ? lamps[lampPins[n]] : 0,
    compare(){},
    reset(){ lamps = [0, 0, 0]; finished = new Set(); lastMsg = ''; lastAct = ''; s = fresh(); paint(); },
    tick(dt){
      const running = api.running();
      if(running && !s.done && !s.fail){
        const total = Math.min(0.05, Math.max(0, dt || 0)), n = Math.max(1, Math.ceil(total * 120)), h = total / n;
        for(let i = 0; i < n && !s.done && !s.fail; i++) ll3Step(s, TR[ti], h, BASE, null, decide);
        if(s.done) finished.add(ti);
      }
      paint();
      if(!running) return;
      const act = actOf();
      if(act !== lastAct){ lastAct = act; api.log('تصمیمِ کد: ' + DEC[act].replace(/^\S+\s/, '')); }
      if(finished.size >= NEED) return;
      if(s.fail) note('error', failText());
      else note('running', '🤖 ربات کدِ تو را اجرا می‌کند… باید خط را تا 🏁 دنبال کند.');
    },
    isDone: () => finished.size >= NEED
  };
}

/* ---------- سخت‌افزار ۳ و ۴: دو موتور با درایور (جهت با GPIO، سرعت با PWM) ---------- */
function hsMotorHw(root, api, pwm){
  root.innerHTML = `
    <svg class="hs-svg" viewBox="0 0 320 190" direction="ltr" role="img" aria-label="ربات دو چرخ از بالا">
      <g id="hmBot"><rect x="-9" y="-14" width="18" height="28" rx="3" style="fill:#2b6cb0"/><rect x="-13" y="-12" width="4" height="12" style="fill:#ddd"/><rect x="9" y="-12" width="4" height="12" style="fill:#ddd"/><polygon points="-4,-14 4,-14 0,-22" style="fill:#ffd25a"/></g>
    </svg>
    <div class="hs-chips"><span id="hmL"></span><span id="hmR"></span></div>
    <div class="hs-chips" id="hmChips"></div>`;
  const q = s => root.querySelector(s);
  const KEYS = pwm
    ? [['slow', 'آهسته (مستقیم)'], ['fast', 'تند (مستقیم)'], ['curveL', 'خمِ چپ'], ['curveR', 'خمِ راست']]
    : [['fwd', 'مستقیم'], ['left', 'چپ'], ['right', 'راست'], ['stop', 'ایست']];
  const motorPins = ['B0', 'B1', 'B10', 'B11'];
  let pins = { B0: 0, B1: 0, B10: 0, B11: 0 }, cmp = { 1: 0, 2: 0 };
  let seen = {}, cur = null, hold = 0, runT = 0, written = false, badT = 0, warnedBig = false;
  let x = 160, y = 110, th = 0;
  const dirOf = (a, b) => (a && !b) ? 1 : (!a && b) ? -1 : 0;
  const fOf = c => pwm ? Math.min(1, Math.max(0, c) / 999) : 1;
  function state(){
    const dL = dirOf(pins.B0, pins.B1), dR = dirOf(pins.B10, pins.B11), fL = fOf(cmp[1]), fR = fOf(cmp[2]);
    if(!pwm){
      if(dL === 1 && dR === 1) return 'fwd';
      if(dR === 1 && dL <= 0) return 'left';
      if(dL === 1 && dR <= 0) return 'right';
      if(dL === 0 && dR === 0) return 'stop';
      return null;
    }
    if(dL !== 1 || dR !== 1) return null;
    if(Math.abs(fL - fR) <= 0.06 && fL >= 0.15 && fL <= 0.5) return 'slow';
    if(Math.abs(fL - fR) <= 0.06 && fL >= 0.7) return 'fast';
    if(fR - fL >= 0.25 && fL > 0.05) return 'curveL';
    if(fL - fR >= 0.25 && fR > 0.05) return 'curveR';
    return null;
  }
  const dTxt = d => d > 0 ? 'جلو' : d < 0 ? 'عقب' : 'ایستاده';
  function paint(){
    const dL = dirOf(pins.B0, pins.B1), dR = dirOf(pins.B10, pins.B11);
    q('#hmL').textContent = `موتور چپ: ${dTxt(dL)}${pwm ? ` — compare ${toFa(cmp[1])}` : ''}`;
    q('#hmR').textContent = `موتور راست: ${dTxt(dR)}${pwm ? ` — compare ${toFa(cmp[2])}` : ''}`;
    q('#hmChips').innerHTML = KEYS.map(([k, n]) => `<span>${seen[k] ? '✅' : '○'} ${n}</span>`).join('');
    q('#hmBot').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(th * 180 / Math.PI).toFixed(1)})`);
  }
  return {
    read: () => 0,
    write(p, n, v){
      const k = p + n;
      if(motorPins.includes(k)){
        written = true;
        if(pins[k] !== v){ pins[k] = v; api.log(`P${k} = ${v}`); }
      } else api.log(`⚠️ P${k} به موتورها وصل نیست (پایه‌ها: PB0، PB1، PB10، PB11)`);
    },
    out: (p, n) => pins[p + n] || 0,
    compare(t, ch, v){
      if(!pwm){ api.log('⚠️ در این مأموریت هنوز PWM وصل نیست؛ جهت را با WritePin بده'); return; }
      if(t !== 1 || (ch !== 1 && ch !== 2)){ api.log('⚠️ فقط TIM1 با کانال ۱ (موتور چپ) و کانال ۲ (موتور راست) وصل است'); return; }
      if(v > 999 && !warnedBig){ warnedBig = true; api.log('⚠️ compare بیشتر از ARR=999 است؛ همان ۹۹۹ حساب می‌شود'); }
      cmp[ch] = Math.max(0, Math.min(999, v));
    },
    reset(){
      pins = { B0: 0, B1: 0, B10: 0, B11: 0 }; cmp = { 1: 0, 2: 0 };
      seen = {}; cur = null; hold = 0; runT = 0; written = false; badT = 0; warnedBig = false;
      x = 160; y = 110; th = 0; paint();
    },
    tick(dt){
      const dL = dirOf(pins.B0, pins.B1), dR = dirOf(pins.B10, pins.B11);
      const sl = dL * fOf(cmp[1]) * 80, sr = dR * fOf(cmp[2]) * 80, v = (sl + sr) / 2, w = (sr - sl) / 40;
      th -= w * dt; x += v * Math.sin(th) * dt; y -= v * Math.cos(th) * dt;
      x = (x + 320) % 320; y = (y + 190) % 190;
      if(api.running()){
        runT += dt;
        const k = state();
        if(k === cur) hold += dt; else { cur = k; hold = 0; }
        if(k && hold >= 0.4 && (k !== 'stop' || Object.keys(seen).length)) seen[k] = true;
      }
      paint();
      if(!api.running()) return;
      const n = KEYS.filter(([k]) => seen[k]).length;
      if(n === KEYS.length) return;
      if(!written && runT > 2.5){ api.say('idle', '⚙️ هنوز روی پایه‌های موتور (PB0، PB1، PB10، PB11) چیزی ننوشته‌ای.'); return; }
      if(pwm){
        const anyCmp = cmp[1] > 0 || cmp[2] > 0, fwd = dL === 1 && dR === 1;
        badT = ((!anyCmp && fwd) || (anyCmp && !fwd)) ? badT + dt : 0;
        if(badT > 1.6){
          api.say('error', !anyCmp
            ? '⚠️ جهت درست است ولی ربات نمی‌رود؛ یا compare صفر است (با __HAL_TIM_SET_COMPARE سرعت بده) یا HAL_TIM_PWM_Start را قبل از حلقه صدا نزده‌ای.'
            : '⚠️ سرعت دادی ولی جهتِ هر دو موتور «جلو» نیست؛ PWM فقط سرعت می‌دهد و جهت با پایه‌های IN مشخص می‌شود.');
          return;
        }
      }
      api.say('running', `${pwm ? '🎚️' : '⚙️'} ${toFa(n)} از ${toFa(KEYS.length)} حالت دیده شد — بین حالت‌ها با HAL_Delay فاصله بینداز.`);
    },
    isDone: () => KEYS.every(([k]) => seen[k])
  };
}

/* ---------- پیکربندیِ چهار مأموریتِ کدنویسی ---------- */
const HS_FWD = `HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_RESET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_10, GPIO_PIN_SET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_11, GPIO_PIN_RESET);`;
const HS_FLOW_HTML = `<details class="hs-det" open><summary>🗺️ مسیرِ کار در STM32CubeIDE (همیشه همین است)</summary>
  <ol class="hs-ol">
    <li>پروژه‌ی جدید بساز و چیپ <code>STM32F103C8Tx</code> را انتخاب کن.</li>
    <li>در CubeMX کارِ هر پایه را (و ساعتِ چیپ را) تنظیم کن؛ در همین مأموریت‌ها این کار را روی نقشه‌ی چیپ انجام می‌دهی.</li>
    <li>ذخیره کن (Ctrl+S) تا CubeMX کدِ راه‌اندازی را در main.c بنویسد.</li>
    <li>کد خودت را فقط بین <code>USER CODE BEGIN</code> و <code>USER CODE END</code> بنویس؛ برنامه‌ی اصلی داخل <code>while(1)</code> است.</li>
    <li>دکمه‌ی Build (چکش) و بعد Run را بزن تا با ST-Link روی برد برود.</li>
  </ol></details>`;
const HS_TABLE_HTML = `<details class="hs-det"><summary>🔁 معادلِ آردوینو در STM32 (HAL)</summary>
  <table class="hs-table"><tr><th>Arduino</th><th>STM32 HAL</th></tr>
    <tr><td><code>pinMode(pin, INPUT)</code></td><td>در CubeMX: <code>GPIO_Input</code></td></tr>
    <tr><td><code>pinMode(pin, OUTPUT)</code></td><td>در CubeMX: <code>GPIO_Output</code></td></tr>
    <tr><td><code>digitalRead(pin)</code></td><td><code>HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0)</code></td></tr>
    <tr><td><code>digitalWrite(pin, HIGH)</code></td><td><code>HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12, GPIO_PIN_SET)</code></td></tr>
    <tr><td><code>digitalWrite(pin, LOW)</code></td><td><code>HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12, GPIO_PIN_RESET)</code></td></tr>
    <tr><td><code>HIGH</code> / <code>LOW</code></td><td><code>GPIO_PIN_SET</code> / <code>GPIO_PIN_RESET</code></td></tr>
    <tr><td><code>delay(500)</code></td><td><code>HAL_Delay(500)</code></td></tr>
    <tr><td><code>analogWrite(pin, v)</code></td><td><code>__HAL_TIM_SET_COMPARE(&amp;htim1, TIM_CHANNEL_1, v)</code></td></tr>
  </table></details>`;

const HAL_CFG = {
  line_read: {
    goal: 'هدف: سنسورِ روی <b>PA0</b> را بخوان؛ وقتی خط <b>مشکی</b> را دید LED روی <b>PC13</b> روشن شود. (در این شبیه‌ساز، ماژولِ سنسور روی مشکی <b>GPIO_PIN_SET</b> می‌دهد و روی Blue Pill روشن‌شدنِ LED یعنی <b>GPIO_PIN_RESET</b>.)',
    preface: HS_FLOW_HTML + HS_TABLE_HTML,
    skeletonOpen: true,
    required: [
      { pin: 'PA0', fn: 'GPIO_Input', label: 'PA0 را GPIO_Input کن (سنسور خط؛ برد باید آن را بخواند)' },
      { pin: 'PC13', fn: 'GPIO_Output', label: 'PC13 را GPIO_Output کن (LED روی برد؛ برد به آن فرمان می‌دهد)' }
    ],
    starter: '',
    sample: `if (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0) == GPIO_PIN_SET)
{
  HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET);
}`,
    successMsg: '✅ عالی! اولین برنامه‌ی «ورودی ← تصمیم ← خروجی» تو روی STM32 کار می‌کند؛ مغزِ هر رباتی از همین ساخته می‌شود.',
    idleMsg: '⚙️ اول در تبِ «Cube» پایه‌ها را روی نقشه‌ی CubeMX تنظیم کن، بعد کد را بنویس و «اجرا» را بزن.',
    hw: hsReadHw
  },
  line_logic: {
    goal: 'هدف: برنامه‌ای بنویس که ربات را با سه سنسور روی مسیر ببرد: وسط دید ← چراغِ «مستقیم» (PB13)، چپ دید ← «چپ» (PB12)، راست دید ← «راست» (PB14)، هیچ‌کدام ← همه خاموش (ربات می‌ایستد). ربات همان چراغی را اجرا می‌کند که تو روشن کنی؛ ربات را تا 🏁 برسان.',
    required: [
      { pin: 'PA0', fn: 'GPIO_Input', label: 'PA0 را GPIO_Input کن (سنسور چپ)' },
      { pin: 'PA1', fn: 'GPIO_Input', label: 'PA1 را GPIO_Input کن (سنسور وسط)' },
      { pin: 'PA2', fn: 'GPIO_Input', label: 'PA2 را GPIO_Input کن (سنسور راست)' },
      { pin: 'PB12', fn: 'GPIO_Output', label: 'PB12 را GPIO_Output کن (چراغ چپ)' },
      { pin: 'PB13', fn: 'GPIO_Output', label: 'PB13 را GPIO_Output کن (چراغ مستقیم)' },
      { pin: 'PB14', fn: 'GPIO_Output', label: 'PB14 را GPIO_Output کن (چراغ راست)' }
    ],
    starter: `uint8_t left   = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0);
uint8_t center = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_1);
uint8_t right  = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_2);
`,
    sample: `uint8_t left   = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0);
uint8_t center = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_1);
uint8_t right  = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_2);

HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12, GPIO_PIN_RESET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_13, GPIO_PIN_RESET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_14, GPIO_PIN_RESET);

if (center == 1)
{
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_13, GPIO_PIN_SET);
}
else if (left == 1)
{
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12, GPIO_PIN_SET);
}
else if (right == 1)
{
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_14, GPIO_PIN_SET);
}`,
    successMsg: '✅ عالی! ربات با کدِ خودت خط را دنبال کرد: با if و else if اولویت‌بندی کردی و برای هر حالتِ سنسورها تصمیمِ درست گرفتی. گام بعد تصمیم را به موتورها می‌رسانی.',
    idleMsg: '🧠 اول پایه‌ها را در تبِ «Cube» تنظیم کن، بعد کد را بنویس، «اجرا» را بزن و ربات را روی مسیر ببین؛ اگر خواستی مسیرِ دیگری هم امتحان کن.',
    hw: hsBrainRobotHw
  },
  line_motors: {
    goal: 'هدف: برنامه‌ای بنویس که ربات را چند لحظه <b>مستقیم</b>، بعد به <b>چپ</b>، بعد به <b>راست</b> ببرد و آخر <b>بایستاند</b> (بین هر حرکت HAL_Delay بگذار).',
    preface: `<details class="hs-det" open><summary>⚙️ درایور موتور: جهت با دو پایه</summary>
      <table class="hs-table"><tr><th>IN1</th><th>IN2</th><th>موتور</th></tr>
        <tr><td><code>GPIO_PIN_SET</code></td><td><code>GPIO_PIN_RESET</code></td><td>جلو</td></tr>
        <tr><td><code>GPIO_PIN_RESET</code></td><td><code>GPIO_PIN_SET</code></td><td>عقب</td></tr>
        <tr><td><code>GPIO_PIN_RESET</code></td><td><code>GPIO_PIN_RESET</code></td><td>ایست</td></tr>
      </table>
      <div class="hs-p">موتور چپ: IN1=PB0 و IN2=PB1 — موتور راست: IN1=PB10 و IN2=PB11. چرخش یعنی یک موتور بایستد (یا عقب برود) و دیگری جلو برود.</div></details>`,
    required: [
      { pin: 'PB0', fn: 'GPIO_Output', label: 'PB0 را GPIO_Output کن (موتور چپ IN1)' },
      { pin: 'PB1', fn: 'GPIO_Output', label: 'PB1 را GPIO_Output کن (موتور چپ IN2)' },
      { pin: 'PB10', fn: 'GPIO_Output', label: 'PB10 را GPIO_Output کن (موتور راست IN1)' },
      { pin: 'PB11', fn: 'GPIO_Output', label: 'PB11 را GPIO_Output کن (موتور راست IN2)' }
    ],
    starter: `${HS_FWD}
HAL_Delay(1000);
`,
    sample: `${HS_FWD}
HAL_Delay(1000);

HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_RESET);
HAL_Delay(600);

HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_10, GPIO_PIN_RESET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_11, GPIO_PIN_RESET);
HAL_Delay(600);

HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET);
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_RESET);
HAL_Delay(800);`,
    successMsg: '✅ عالی! جهتِ دو موتور به فرمانِ توست: ربات رفت، پیچید و ایستاد. گام بعد: سرعت.',
    idleMsg: '⚙️ اول پایه‌های موتور را در تبِ «Cube» تنظیم کن، بعد کد را بنویس و «اجرا» را بزن.',
    hw: (root, api) => hsMotorHw(root, api, false)
  },
  motor_pwm: {
    goal: 'هدف: سرعتِ دو موتور را با PWM کنترل کن: یک‌بار <b>آهسته</b>، یک‌بار <b>تند</b>، بعد <b>خمِ چپ</b> و <b>خمِ راست</b> (با تفاوتِ سرعتِ دو موتور). مقدارِ compare بین ۰ و ۹۹۹ است.',
    preface: `<details class="hs-det" open><summary>🎚️ PWM چطور سرعت می‌دهد؟</summary>
      <div class="hs-p">تایمر ۱ از صفر تا <b>۹۹۹</b> (ARR) می‌شمارد و تا عددِ <b>compare</b> پایه را روشن نگه می‌دارد. compare=۰ یعنی همیشه خاموش (موتور ایستاده)، ۵۰۰ یعنی نیمِ سرعت و ۹۹۹ یعنی سرعتِ کامل. موتور چپ از <b>TIM_CHANNEL_1</b> (پایه‌ی PA8) و موتور راست از <b>TIM_CHANNEL_2</b> (پایه‌ی PA9) سرعت می‌گیرد؛ جهت هنوز با پایه‌های IN است.</div>
      <div class="hs-p">دو قدم در CubeMX و دو قدم در کد: ۱) پایه را TIM1_CH1 / TIM1_CH2 کن. در CubeMXِ واقعی، در بخش Timers ← TIM1 هم کانال را روی «PWM Generation» و Counter Period را روی ۹۹۹ می‌گذاری؛ این‌جا فرض شده همین‌طور تنظیم شده. ۲) در کد، <b>قبل از حلقه</b> باید PWM را با <code>HAL_TIM_PWM_Start</code> روشن کنی و داخل حلقه با <code>__HAL_TIM_SET_COMPARE</code> عدد را عوض کنی.</div></details>`,
    initEditor: true, pwm: true,
    required: [
      { pin: 'PB0', fn: 'GPIO_Output', label: 'PB0 را GPIO_Output کن (موتور چپ IN1)' },
      { pin: 'PB1', fn: 'GPIO_Output', label: 'PB1 را GPIO_Output کن (موتور چپ IN2)' },
      { pin: 'PB10', fn: 'GPIO_Output', label: 'PB10 را GPIO_Output کن (موتور راست IN1)' },
      { pin: 'PB11', fn: 'GPIO_Output', label: 'PB11 را GPIO_Output کن (موتور راست IN2)' },
      { pin: 'PA8', fn: 'TIM1_CH1', label: 'PA8 را TIM1_CH1 کن (سرعت موتور چپ)' },
      { pin: 'PA9', fn: 'TIM1_CH2', label: 'PA9 را TIM1_CH2 کن (سرعت موتور راست)' }
    ],
    initStarter: '',
    initSample: `HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_2);`,
    starter: `${HS_FWD}
`,
    sample: `${HS_FWD}

__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, 300);
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_2, 300);
HAL_Delay(1200);

__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, 800);
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_2, 800);
HAL_Delay(1200);

__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, 300);
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_2, 800);
HAL_Delay(1200);

__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, 800);
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_2, 300);
HAL_Delay(1200);`,
    successMsg: '✅ عالی! حالا هم جهت و هم سرعتِ هر موتور دست توست؛ تفاوتِ سرعتِ دو موتور یعنی پیچیدن — همین فکر خط‌پیروِ واقعی است.',
    idleMsg: '🎚️ اول پایه‌ها را در تبِ «Cube» تنظیم کن، بعد PWM را راه بینداز، کد را بنویس و «اجرا» را بزن.',
    hw: (root, api) => hsMotorHw(root, api, true)
  }
};
function mountHalReadSim(c, o){ return mountHalMission(c, HAL_CFG.line_read, o); }
function mountHalBrainSim(c, o){ return mountHalMission(c, HAL_CFG.line_logic, o); }
function mountHalMotorSim(c, o){ return mountHalMission(c, HAL_CFG.line_motors, o); }
function mountHalPwmSim(c, o){ return mountHalMission(c, HAL_CFG.motor_pwm, o); }
