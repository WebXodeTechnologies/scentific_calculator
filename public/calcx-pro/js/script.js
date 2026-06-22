/* =====================================================
   CalcX Pro — Vanilla JS
   Modules: parser, calculator, history, graph, converter,
            settings, particles, ui
   ===================================================== */

/* ---------- Storage ---------- */
const Store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove(k) { localStorage.removeItem(k); }
};

/* ---------- Toast ---------- */
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

/* ---------- Safe Expression Parser (Shunting-yard + RPN) ---------- */
const Parser = (() => {
  const CONST = { pi: Math.PI, e: Math.E };
  const FUNCS = {
    sin: x => Math.sin(toRad(x)),
    cos: x => Math.cos(toRad(x)),
    tan: x => Math.tan(toRad(x)),
    asin: x => fromRad(Math.asin(x)),
    acos: x => fromRad(Math.acos(x)),
    atan: x => fromRad(Math.atan(x)),
    log: x => Math.log10(x),
    ln: x => Math.log(x),
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    exp: Math.exp,
    random: () => Math.random()
  };
  const OPS = {
    '+': { p: 1, a: 'L', fn: (a,b)=>a+b },
    '-': { p: 1, a: 'L', fn: (a,b)=>a-b },
    '*': { p: 2, a: 'L', fn: (a,b)=>a*b },
    '/': { p: 2, a: 'L', fn: (a,b)=>a/b },
    '%': { p: 2, a: 'L', fn: (a,b)=>a%b },
    '^': { p: 4, a: 'R', fn: (a,b)=>Math.pow(a,b) },
    'u-':{ p: 3, a: 'R', unary: true, fn: a=>-a },
    '!': { p: 5, a: 'L', postfix: true, fn: a=>factorial(a) }
  };
  function factorial(n){
    if (n < 0 || !Number.isFinite(n)) return NaN;
    if (n > 170) return Infinity;
    if (Math.floor(n) !== n) { // gamma approx
      return gamma(n + 1);
    }
    let r = 1; for (let i=2;i<=n;i++) r*=i; return r;
  }
  function gamma(z){ // Lanczos
    const g = 7;
    const c = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI*z) * gamma(1-z));
    z -= 1; let x = c[0];
    for (let i=1;i<g+2;i++) x += c[i]/(z+i);
    const t = z + g + 0.5;
    return Math.sqrt(2*Math.PI) * Math.pow(t, z+0.5) * Math.exp(-t) * x;
  }
  let ANGLE = 'DEG';
  function setAngle(m){ ANGLE = m; }
  function toRad(x){ return ANGLE === 'DEG' ? x * Math.PI/180 : x; }
  function fromRad(x){ return ANGLE === 'DEG' ? x * 180/Math.PI : x; }

  function tokenize(input, vars = {}) {
    // normalize
    let s = input.replace(/\s+/g,'').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/√/g,'sqrt').replace(/∛/g,'cbrt');
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        let num = '';
        while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i++]; }
        tokens.push({ t:'num', v: parseFloat(num) });
      } else if (/[a-zA-Z_]/.test(ch)) {
        let id = '';
        while (i < s.length && /[a-zA-Z_0-9]/.test(s[i])) { id += s[i++]; }
        if (s[i] === '(') tokens.push({ t:'fn', v: id });
        else if (CONST[id] !== undefined) tokens.push({ t:'num', v: CONST[id] });
        else if (vars[id] !== undefined) tokens.push({ t:'num', v: vars[id] });
        else throw new Error('Unknown identifier: ' + id);
      } else if ('+-*/%^!()'.includes(ch)) {
        tokens.push({ t: ch === '(' ? 'lp' : ch === ')' ? 'rp' : 'op', v: ch });
        i++;
      } else if (ch === ',') { tokens.push({t:'comma'}); i++; }
      else throw new Error('Unexpected: ' + ch);
    }
    // implicit multiplication & unary
    const out = [];
    for (let j=0;j<tokens.length;j++){
      const tk = tokens[j], prev = tokens[j-1];
      if (tk.t==='op' && tk.v==='-' && (!prev || prev.t==='op' || prev.t==='lp' || prev.t==='comma')) {
        out.push({ t:'op', v:'u-' });
      } else {
        if (prev && (prev.t==='num' || prev.t==='rp') && (tk.t==='num' || tk.t==='fn' || tk.t==='lp')) {
          out.push({ t:'op', v:'*' });
        }
        out.push(tk);
      }
    }
    return out;
  }

  function toRPN(tokens){
    const out = [], stack = [];
    for (const tk of tokens){
      if (tk.t === 'num') out.push(tk);
      else if (tk.t === 'fn') stack.push(tk);
      else if (tk.t === 'op'){
        const o1 = OPS[tk.v];
        while (stack.length){
          const top = stack[stack.length-1];
          if (top.t === 'op') {
            const o2 = OPS[top.v];
            if ((o1.a==='L' && o1.p<=o2.p) || (o1.a==='R' && o1.p<o2.p)) { out.push(stack.pop()); continue; }
          } else if (top.t === 'fn') { out.push(stack.pop()); continue; }
          break;
        }
        stack.push(tk);
      } else if (tk.t === 'lp') stack.push(tk);
      else if (tk.t === 'rp') {
        while (stack.length && stack[stack.length-1].t !== 'lp') out.push(stack.pop());
        if (!stack.length) throw new Error('Mismatched parentheses');
        stack.pop();
        if (stack.length && stack[stack.length-1].t === 'fn') out.push(stack.pop());
      }
    }
    while (stack.length){
      const top = stack.pop();
      if (top.t === 'lp' || top.t === 'rp') throw new Error('Mismatched parentheses');
      out.push(top);
    }
    return out;
  }

  function evalRPN(rpn){
    const st = [];
    for (const tk of rpn){
      if (tk.t === 'num') st.push(tk.v);
      else if (tk.t === 'op'){
        const o = OPS[tk.v];
        if (o.unary || o.postfix) { const a = st.pop(); st.push(o.fn(a)); }
        else { const b = st.pop(), a = st.pop(); st.push(o.fn(a,b)); }
      } else if (tk.t === 'fn'){
        const a = st.pop();
        if (!FUNCS[tk.v]) throw new Error('Unknown function: ' + tk.v);
        st.push(FUNCS[tk.v](a));
      }
    }
    if (st.length !== 1) throw new Error('Invalid expression');
    return st[0];
  }

  function evaluate(expr, vars = {}) {
    if (!expr || !expr.trim()) return 0;
    const tokens = tokenize(expr, vars);
    const rpn = toRPN(tokens);
    const v = evalRPN(rpn);
    if (typeof v !== 'number' || Number.isNaN(v)) throw new Error('Math error');
    return v;
  }

  return { evaluate, setAngle, get angle(){ return ANGLE; } };
})();

/* ---------- Calculator ---------- */
const Calc = (() => {
  let expr = '';
  let memory = 0;
  const exprEl = document.getElementById('expr');
  const prevEl = document.getElementById('prevExpr');
  const resEl = document.getElementById('result');
  const memChip = document.getElementById('memChip');
  const angleEl = document.getElementById('angleMode');

  function render() {
    exprEl.textContent = expr || '0';
    try {
      if (expr) {
        const v = Parser.evaluate(expr);
        resEl.textContent = format(v);
      } else resEl.textContent = '0';
    } catch { resEl.textContent = '…'; }
  }
  function format(v){
    if (!Number.isFinite(v)) return v.toString();
    const abs = Math.abs(v);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return v.toExponential(6);
    return parseFloat(v.toPrecision(12)).toString();
  }
  function insert(s){ expr += s; render(); ping(); }
  function del(){ expr = expr.slice(0,-1); render(); }
  function clear(){ expr = ''; prevEl.textContent = ''; render(); }
  function equals(){
    if (!expr) return;
    try {
      const v = Parser.evaluate(expr);
      const out = format(v);
      prevEl.textContent = expr + ' =';
      History.add(expr, out);
      expr = out;
      render();
      resEl.classList.remove('pop'); void resEl.offsetWidth; resEl.classList.add('pop');
      ping(880);
    } catch (e) { toast('Error: ' + e.message); ping(220); }
  }
  function setAngle(m){ Parser.setAngle(m); angleEl.textContent = m; Store.set('angle', m); }
  function toggleAngle(){ setAngle(Parser.angle === 'DEG' ? 'RAD' : 'DEG'); }
  function memOp(op){
    let v = 0; try { v = expr ? Parser.evaluate(expr) : parseFloat(resEl.textContent) || 0; } catch {}
    if (op === 'mc') memory = 0;
    else if (op === 'mr') { insert(String(memory)); return; }
    else if (op === 'm+') memory += v;
    else if (op === 'm-') memory -= v;
    memChip.textContent = 'M: ' + Parser.evaluate ? format(memory) : memory;
    Store.set('memory', memory);
  }
  function setExpr(s){ expr = s; render(); }
  function getResult(){ return resEl.textContent; }

  // sounds
  let soundsOn = Store.get('sounds', false);
  let actx;
  function ping(freq=520){
    if (!soundsOn) return;
    try {
      actx = actx || new (window.AudioContext||window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq; o.type = 'sine';
      g.gain.value = 0.04;
      o.connect(g).connect(actx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.12);
      o.stop(actx.currentTime + 0.13);
    } catch {}
  }
  function setSounds(v){ soundsOn = v; Store.set('sounds', v); }

  // init
  memory = Store.get('memory', 0);
  memChip.textContent = 'M: ' + memory;
  setAngle(Store.get('angle', 'DEG'));
  const lastExpr = Store.get('lastExpr', '');
  if (lastExpr) { expr = lastExpr; render(); }

  // autosave
  setInterval(() => Store.set('lastExpr', expr), 1500);

  return { insert, del, clear, equals, setAngle, toggleAngle, memOp, setExpr, getResult, setSounds };
})();

/* ---------- History ---------- */
const History = (() => {
  let items = Store.get('calcx-history', []);
  const listEl = document.getElementById('historyList');
  const searchEl = document.getElementById('historySearch');

  function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hours}:${min} ${ampm}`;
  }

  function add(expression, result) {
    if (!expression || !result || expression === result) return;
    if (items.length > 0 && items[0].expression === expression && items[0].result === result) return;
    items.unshift({
      id: Date.now(),
      expression,
      result,
      timestamp: formatDate(new Date())
    });
    if (items.length > 200) items.pop();
    save(); render(searchEl.value);
  }
  function save(){ Store.set('calcx-history', items); }
  function clear(){ items = []; Store.remove('calcx-history'); render(searchEl.value); }
  function render(filter='') {
    listEl.innerHTML = '';
    const f = filter.toLowerCase();
    const filtered = items.filter(x => !f || (x.expression+x.result).toLowerCase().includes(f));
    
    if (filtered.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.style.textAlign = 'center';
      li.style.opacity = '0.5';
      li.style.padding = '1rem';
      li.textContent = 'No calculations yet';
      listEl.appendChild(li);
      return;
    }

    filtered.forEach((it) => {
      const li = document.createElement('li');
      li.innerHTML = `<div>
          <div class="h-expr">${escapeHtml(it.expression)}</div>
          <div class="h-res">= ${escapeHtml(it.result)}</div>
        </div>
        <button class="h-del" title="Delete">✕</button>`;
      li.addEventListener('click', e => {
        if (e.target.classList.contains('h-del')) {
          items.splice(items.indexOf(it), 1); save(); render(searchEl.value);
        } else {
          Calc.setExpr(it.expression);
        }
      });
      listEl.appendChild(li);
    });
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function all(){ return items; }

  searchEl.addEventListener('input', e => render(e.target.value));
  document.getElementById('clearHistory').addEventListener('click', () => { clear(); toast('History cleared'); });

  render();
  return { add, clear, all };
})();

/* ---------- Export ---------- */
document.getElementById('exportCsv').addEventListener('click', () => {
  const rows = [['Timestamp','Expression','Result'], ...History.all().map(h => [h.timestamp, h.expression, h.result])];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  download('calcx-history.csv', csv, 'text/csv');
});
document.getElementById('exportPdf').addEventListener('click', () => {
  // Minimal PDF (text) — no library
  const lines = History.all().slice(0, 60).map(h => `${h.timestamp}  |  ${h.expression} = ${h.result}`);
  const text = ['CalcX Pro — History', ''].concat(lines).join('\n');
  const pdf = buildSimplePdf(text);
  download('calcx-history.pdf', pdf, 'application/pdf');
});
function download(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function buildSimplePdf(text) {
  // very small single-page PDF
  const lines = text.split('\n').slice(0, 60);
  const content = `BT /F1 11 Tf 50 780 Td 14 TL (${lines.map(escapePdf).join(') Tj T* (')}) Tj ET`;
  const parts = [];
  parts.push('%PDF-1.3\n');
  const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const offsets = [];
  let out = '%PDF-1.3\n';
  objs.forEach((o,i) => { offsets.push(out.length); out += `${i+1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
  offsets.forEach(o => out += String(o).padStart(10,'0') + ' 00000 n \n');
  out += `trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}
function escapePdf(s){ return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }

/* ---------- Keypad wiring ---------- */
document.querySelectorAll('.keypad button').forEach(btn => {
  btn.addEventListener('click', e => {
    rippleAt(btn, e);
    const ins = btn.dataset.insert;
    const fn = btn.dataset.fn;
    const act = btn.dataset.action;
    if (ins != null) Calc.insert(ins);
    else if (fn) Calc.insert(fn);
    else if (act === 'clear') Calc.clear();
    else if (act === 'del') Calc.del();
    else if (act === 'equals') Calc.equals();
    else if (act === 'angle') Calc.toggleAngle();
    else if (act && act.startsWith('m')) Calc.memOp(act);
  });
});
function rippleAt(el, e){
  const rect = el.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  r.style.width = r.style.height = size + 'px';
  r.style.left = (e.clientX - rect.left - size/2) + 'px';
  r.style.top = (e.clientY - rect.top - size/2) + 'px';
  el.appendChild(r);
  setTimeout(() => r.remove(), 650);
}

/* ---------- Copy result ---------- */
document.getElementById('copyResult').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(Calc.getResult()); toast('Copied: ' + Calc.getResult()); }
  catch { toast('Copy failed'); }
});

/* ---------- Scientific toggle ---------- */
const sciToggle = document.getElementById('sciToggle');
const keypadWrap = document.querySelector('.keypad-wrap');
sciToggle.addEventListener('change', () => {
  keypadWrap.classList.toggle('basic', !sciToggle.checked);
  Store.set('sci', sciToggle.checked);
});
sciToggle.checked = Store.get('sci', true);
keypadWrap.classList.toggle('basic', !sciToggle.checked);

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input','textarea','select'].includes(tag)) return;
  const k = e.key;
  if (/^[0-9.]$/.test(k)) Calc.insert(k);
  else if ('+-*/%^()'.includes(k)) Calc.insert(k);
  else if (k === 'Enter' || k === '=') { e.preventDefault(); Calc.equals(); }
  else if (k === 'Backspace') Calc.del();
  else if (k === 'Escape') Calc.clear();
});

/* ---------- Sidebar / mode switching ---------- */
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.querySelectorAll('.mode-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const m = b.dataset.mode;
    ['calc','graph','convert'].forEach(name => {
      document.getElementById('panel-'+name).classList.toggle('hidden', name !== m);
    });
    if (m === 'graph') Graph.resize();
  });
});

/* ---------- Theme & Settings ---------- */
const themeBtn = document.getElementById('themeBtn');
const themes = ['cyber','glass','light','matrix'];
function setTheme(t){ document.documentElement.setAttribute('data-theme', t); Store.set('theme', t); }
themeBtn.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') || 'cyber';
  const i = (themes.indexOf(cur) + 1) % themes.length;
  setTheme(themes[i]); toast('Theme: ' + themes[i]);
});
setTheme(Store.get('theme', 'cyber'));

document.querySelectorAll('.theme-swatch').forEach(s => s.addEventListener('click', () => setTheme(s.dataset.theme)));

const settingsModal = document.getElementById('settingsModal');
document.getElementById('settingsBtn').addEventListener('click', () => settingsModal.classList.add('open'));
settingsModal.addEventListener('click', e => { if (e.target === settingsModal || e.target.hasAttribute('data-close-modal')) settingsModal.classList.remove('open'); });

const soundToggle = document.getElementById('soundToggle');
soundToggle.checked = Store.get('sounds', false);
soundToggle.addEventListener('change', () => Calc.setSounds(soundToggle.checked));

const angleSelect = document.getElementById('angleSelect');
angleSelect.value = Store.get('angle','DEG');
angleSelect.addEventListener('change', () => Calc.setAngle(angleSelect.value));

const animSpeed = document.getElementById('animSpeed');
animSpeed.value = Store.get('animSpeed', 1);
function applySpeed(v){ document.documentElement.style.setProperty('--speed', v); Store.set('animSpeed', v); }
applySpeed(animSpeed.value);
animSpeed.addEventListener('input', () => applySpeed(animSpeed.value));

document.getElementById('clearStorage').addEventListener('click', () => {
  if (confirm('Clear all CalcX Pro data?')) { localStorage.clear(); location.reload(); }
});

/* ---------- Fullscreen ---------- */
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

/* ---------- Particles ---------- */
(function particles(){
  const c = document.getElementById('particles');
  const ctx = c.getContext('2d');
  let w, h, parts = [];
  function resize(){ w = c.width = innerWidth; h = c.height = innerHeight;
    parts = Array.from({length: Math.min(60, Math.floor(w*h/24000))}, () => ({
      x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.8+0.4,
      vx: (Math.random()-.5)*0.25, vy: (Math.random()-.5)*0.25, a: Math.random()*0.6+0.2
    }));
  }
  function loop(){
    ctx.clearRect(0,0,w,h);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#00e0ff';
    for (const p of parts){
      p.x += p.vx; p.y += p.vy;
      if (p.x<0||p.x>w) p.vx*=-1;
      if (p.y<0||p.y>h) p.vy*=-1;
      ctx.beginPath();
      ctx.fillStyle = accent;
      ctx.globalAlpha = p.a;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  addEventListener('resize', resize); resize(); loop();
})();

/* ---------- Graph ---------- */
const Graph = (() => {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const colors = ['#00e0ff','#b14bff','#ff3cac','#4ade80','#facc15'];
  let fns = [];
  let scale = 40; // px per unit
  let offX = 0, offY = 0;

  function resize(){
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    draw();
  }
  function draw(){
    const W = canvas.width / devicePixelRatio, H = canvas.height / devicePixelRatio;
    ctx.clearRect(0,0,W,H);
    const cx = W/2 + offX, cy = H/2 + offY;
    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let x = cx % scale; x < W; x += scale) line(x,0,x,H);
    for (let y = cy % scale; y < H; y += scale) line(0,y,W,y);
    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
    line(0, cy, W, cy); line(cx, 0, cx, H);

    fns.forEach((expr, idx) => {
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 2; ctx.beginPath();
      let started = false;
      for (let px = 0; px < W; px += 1) {
        const x = (px - cx) / scale;
        let y;
        try { y = Parser.evaluate(expr, { x }); } catch { started = false; continue; }
        if (!Number.isFinite(y)) { started = false; continue; }
        const py = cy - y * scale;
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
  }
  function line(x1,y1,x2,y2){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }

  function add(expr){
    try { Parser.evaluate(expr, { x: 1 }); }
    catch (e) { toast('Invalid: ' + e.message); return; }
    fns.push(expr); renderChips(); draw();
  }
  function renderChips(){
    const wrap = document.getElementById('fnChips');
    wrap.innerHTML = '';
    fns.forEach((f, i) => {
      const c = document.createElement('span'); c.className = 'fn-chip';
      c.innerHTML = `<span class="swatch" style="background:${colors[i%colors.length]}"></span>y = ${f} <button title="Remove">✕</button>`;
      c.querySelector('button').addEventListener('click', () => { fns.splice(i,1); renderChips(); draw(); });
      wrap.appendChild(c);
    });
  }
  function reset(){ fns = []; scale = 40; offX = offY = 0; renderChips(); draw(); }
  function zoom(f){ scale = Math.max(10, Math.min(300, scale * f)); draw(); }

  document.getElementById('plotBtn').addEventListener('click', () => {
    const v = document.getElementById('fnInput').value.trim();
    if (!v) return;
    fns = []; add(v); document.getElementById('fnInput').value = '';
  });
  document.getElementById('addFn').addEventListener('click', () => {
    const v = document.getElementById('fnInput').value.trim();
    if (!v) return; add(v); document.getElementById('fnInput').value = '';
  });
  document.getElementById('zoomIn').addEventListener('click', () => zoom(1.25));
  document.getElementById('zoomOut').addEventListener('click', () => zoom(0.8));
  document.getElementById('resetGraph').addEventListener('click', reset);
  document.getElementById('fnInput').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('plotBtn').click(); });

  // drag
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ox: offX, oy: offY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; offX = drag.ox + e.clientX - drag.x; offY = drag.oy + e.clientY - drag.y; draw(); });
  canvas.addEventListener('pointerup', () => drag = null);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.1 : 0.9); }, { passive: false });

  addEventListener('resize', resize);
  setTimeout(resize, 50);
  // seed
  add('sin(x)');
  return { resize };
})();

/* ---------- Converter ---------- */
const Convert = (() => {
  const units = {
    length: { Meter:1, Kilometer:1000, Mile:1609.344, Foot:0.3048 },
    weight: { Gram:1, Kilogram:1000, Pound:453.59237 },
    temperature: { Celsius:'C', Fahrenheit:'F', Kelvin:'K' }
  };
  let cat = 'length';
  const fromVal = document.getElementById('convFromVal');
  const toVal = document.getElementById('convToVal');
  const fromU = document.getElementById('convFromUnit');
  const toU = document.getElementById('convToUnit');

  function renderUnits(){
    const u = Object.keys(units[cat]);
    [fromU, toU].forEach((sel, i) => {
      sel.innerHTML = u.map(x => `<option>${x}</option>`).join('');
      sel.value = u[i] || u[0];
    });
    compute();
  }
  function compute(){
    const v = parseFloat(fromVal.value); if (!Number.isFinite(v)) { toVal.value = ''; return; }
    if (cat === 'temperature') toVal.value = formatNum(convertTemp(v, fromU.value, toU.value));
    else toVal.value = formatNum(v * units[cat][fromU.value] / units[cat][toU.value]);
  }
  function formatNum(n){ return parseFloat(n.toPrecision(8)).toString(); }
  function convertTemp(v, from, to){
    let c;
    if (from==='Celsius') c=v; else if (from==='Fahrenheit') c=(v-32)*5/9; else c=v-273.15;
    if (to==='Celsius') return c; if (to==='Fahrenheit') return c*9/5+32; return c+273.15;
  }
  document.querySelectorAll('.conv-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.conv-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active'); cat = t.dataset.cat; renderUnits();
  }));
  [fromVal, fromU, toU].forEach(el => el.addEventListener('input', compute));
  renderUnits();
  return {};
})();
