/* ---------- Interactive Pinout Explorer ---------- */
/* Requires arduino-nano.js and esp32.js loaded first (ARDUINO_NANO_PINS, ESP32_PINS,
   buildNanoPinoutSVG, buildEsp32PinoutSVG, nanoPinColor, esp32PinColor). */

const PIN_TYPE_LABEL = { power:'تغذیه', ground:'زمین', analog:'آنالوگ', control:'کنترل', digital:'دیجیتال' };
const PIN_TYPE_ORDER = ['power','ground','digital','analog','control'];

/* opts.showSwitch: whether to show the "Arduino Nano / ESP32 DevKit" board-switch
   tabs + board-name label. Pass false when the explorer is embedded somewhere that
   already lets the user pick the board (e.g. the component encyclopedia, where
   "Arduino Nano" and "ESP32 DevKit" are already separate list entries) so the
   board name/tabs aren't shown twice. Defaults to true for standalone use. */
function renderPinoutExplorer(container, initialBoard = 'nano', opts = {}) {
  const showSwitch = opts.showSwitch !== false;
  const state = { board: initialBoard, side: null, idx: null, filter: null };

  const pinData  = () => state.board === 'nano' ? ARDUINO_NANO_PINS : ESP32_PINS;
  const pinColor = t   => state.board === 'nano' ? nanoPinColor(t) : esp32PinColor(t);
  const svgHTML  = ()  => state.board === 'nano' ? buildNanoPinoutSVG() : buildEsp32PinoutSVG();
  const boardLabel = () => state.board === 'nano' ? 'Arduino Nano' : 'ESP32 DevKit V1';
  const pinClass = () => state.board === 'nano' ? '.nano-pin' : '.esp32-pin';

  function selectedPin() {
    if (state.side === null) return null;
    return pinData()[state.side][state.idx];
  }

  function detailHTML() {
    const pin = selectedPin();
    if (!pin) return `<div class="detail-empty">روی یکی از پایه‌ها بزن تا توضیحش را اینجا ببینی 👆</div>`;
    return `
      <div class="detail-head">
        <span class="detail-name mono" dir="ltr">${pin.name}</span>
        ${pin.sub ? `<span class="detail-sub mono" dir="ltr">${pin.sub}</span>` : ''}
        <span class="detail-badge" style="--badge-color:${pinColor(pin.type)}">${PIN_TYPE_LABEL[pin.type]}</span>
        ${pin.pwm ? `<span class="detail-badge pwm">PWM ~</span>` : ''}
      </div>
      <div class="detail-desc">${pin.desc}</div>`;
  }

  // Full rebuild: only needed when the board itself changes (different SVG,
  // different legend colors). Re-running this on every pin click was what made
  // the board graphic appear to "resize" — the whole <svg> was torn down and
  // recreated on each tap. Pin selection and filtering now update in place instead.
  function render() {
    container.innerHTML = `
      <div class="pinout-explorer">
        ${showSwitch ? `
        <div class="pinout-switch" role="tablist">
          <button class="pinout-switch-btn ${state.board === 'nano' ? 'active' : ''}" data-board="nano">Arduino Nano</button>
          <button class="pinout-switch-btn ${state.board === 'esp32' ? 'active' : ''}" data-board="esp32">ESP32 DevKit</button>
        </div>
        <div class="pinout-board-name mono">${boardLabel()}</div>
        ` : ''}

        <div class="pinout-stage">${svgHTML()}</div>

        <div class="pinout-legend">
          ${PIN_TYPE_ORDER.map(t => `
            <button class="legend-chip ${state.filter === t ? 'active' : ''}" data-type="${t}" style="--chip-color:${pinColor(t)}">
              <span class="legend-dot"></span>${PIN_TYPE_LABEL[t]}
            </button>`).join('')}
        </div>

        <div class="pinout-detail">${detailHTML()}</div>
      </div>`;
    wire();
    applyFilter();
    updateDetail();
  }

  // Targeted update: just the detail panel's content + show/hide state.
  function updateDetail() {
    const detail = container.querySelector('.pinout-detail');
    if (!detail) return;
    detail.innerHTML = detailHTML();
    detail.classList.toggle('show', !!selectedPin());
  }

  function selectPin(side, idx) {
    if (state.side === side && state.idx === idx) { state.side = null; state.idx = null; }
    else { state.side = side; state.idx = idx; }
    applyFilter();
    updateDetail();
    if (state.side !== null) {
      requestAnimationFrame(() => {
        container.querySelector('.pinout-detail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function wire() {
    container.querySelectorAll('.pinout-switch-btn').forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.board === state.board) return;
        state.board = btn.dataset.board;
        state.side = null; state.idx = null; state.filter = null;
        render();
      };
    });
    container.querySelectorAll(`${pinClass()}`).forEach(g => {
      g.onclick = () => selectPin(g.dataset.side, +g.dataset.idx);
    });
    container.querySelectorAll('.legend-chip').forEach(chip => {
      chip.onclick = () => {
        state.filter = state.filter === chip.dataset.type ? null : chip.dataset.type;
        state.side = null; state.idx = null;
        container.querySelectorAll('.legend-chip').forEach(c => c.classList.toggle('active', c.dataset.type === state.filter));
        applyFilter();
        updateDetail();
      };
    });
  }

  function applyFilter() {
    const data = pinData();
    container.querySelectorAll(`${pinClass()}`).forEach(g => {
      const side = g.dataset.side, idx = +g.dataset.idx;
      const pin = data[side][idx];
      const selected = state.side === side && state.idx === idx;
      const dim = !!state.filter && pin.type !== state.filter && !selected;
      g.classList.toggle('selected', selected);
      g.classList.toggle('dim', dim);
    });
  }

  render();
}
