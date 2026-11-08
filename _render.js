const path = require('path'), fs = require('fs'), http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');
process.on('unhandledRejection', () => {});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const f = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); res.end(b); } });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + srv.address().port + '/', { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  const { window } = dom, { document } = window;
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  await sleep(800);
  const tab = document.getElementById('circuitTab'); if (tab) tab.remove();
  const ptr = (el, type, x, y) => el.dispatchEvent(new window.PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, button: 0 }));
  const types = ['UNO', 'NANO', 'BLUEPILL', 'ESP32'];
  const css = fs.readFileSync(path.join(__dirname, 'css/circuit.css'), 'utf8');
  let out = '<!doctype html><meta charset=utf-8><style>' + css + '</style>' + (document.getElementById('cvRealCss') ? '' : '') + '<body style="background:#10151c;margin:0;display:flex;gap:10px;flex-wrap:wrap;padding:10px">';
  let n = 0, realCss = '';
  for (const view of ['real', 'sch']) for (const t of types) {
    fs.appendFileSync(__dirname+'/_r.txt', '\n'); console.log(view, t); setTimeout(()=>{fs.appendFileSync(__dirname+'/_r.txt', '\n'); console.log('TIMEOUT'); process.exit(2)}, 90000).unref(); const root = document.createElement('div'); root.className = 'active'; document.body.appendChild(root);
    const skey = 'r' + (++n); window.localStorage.setItem(skey, JSON.stringify({ v: 2, comps: [], wires: [], seq: 1 }));
    const ed = window.CircuitEditor.create(root, { storageKey: skey }); ed.onShow();
    if (view === 'real') root.querySelector('[data-vw="real"]').click();
    const svg = root.querySelector('#cvSvg');
    const item = root.querySelector(`.cv-pal-item[data-type="${t}"]`);
    if (!item) { fs.appendFileSync(__dirname+'/_r.txt', '\n'); console.log('no palette item', t); continue; }
    item.click(); ptr(svg, 'pointerdown', 400, 300); ptr(svg, 'pointerup', 400, 300);
    await sleep(100);
    const g = svg.cloneNode(true); g.setAttribute('viewBox', '230 20 340 560'); g.setAttribute('width', 340); g.setAttribute('height', 560); g.removeAttribute('style');
    g.querySelectorAll('.cv-grid,pattern,#cvGrid').forEach(e => e.remove());
    out += '<div style="background:#1a2230">' + g.outerHTML + '</div>';
    const rc = document.getElementById('cvRealCss'); if (rc) realCss = rc.textContent;
  }
  out = out.replace('</style>', realCss + '</style>');
  fs.writeFileSync(path.join(__dirname, '_boards.html'), out);
  fs.appendFileSync(__dirname+'/_r.txt', '\n'); console.log('done', out.length);
  process.exit(0);
})();
