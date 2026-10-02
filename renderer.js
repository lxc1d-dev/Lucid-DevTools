'use strict';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isMac = window.lucid.platform === 'darwin';
if (!isMac) $('#searchKey').textContent = 'Ctrl K';

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1400);
}
function copy(text) {
  if (!text) return toast('Nothing to copy');
  window.lucid.copy(text).then(() => toast('Copied to clipboard'));
}
function setStatus(el, msg, type) { el.textContent = msg; el.className = 'status ' + (type || ''); }
function head(title, desc) {
  return `<div class="tool-head"><div><h1>${title}</h1><p>${desc}</p></div>
  <button class="btn ghost" data-reset>Reset</button></div>`;
}
function row(label, id) {
  return `<div class="row"><span class="lbl">${label}</span><code id="${id}"></code>
  <button class="btn sm" data-copy="#${id}">Copy</button></div>`;
}

/* ---------------- Tools ---------------- */
const TOOLS = [
  {
    id: 'json', name: 'JSON Formatter', glyph: '{ }', keys: 'json format minify validate prettify',
    desc: 'Format, minify and validate JSON.',
    html: `<div class="grid2">
      <div class="panel"><div class="panel-title">Input</div>
        <textarea id="in" placeholder='{"hello":"world"}' spellcheck="false"></textarea></div>
      <div class="panel"><div class="panel-title">Output</div>
        <textarea id="out" readonly spellcheck="false"></textarea></div></div>
      <div class="panel" style="margin-top:16px">
        <div class="btns">
          <button class="btn primary" id="fmt" data-primary>Format</button>
          <button class="btn" id="min">Minify</button>
          <button class="btn" id="val">Validate</button>
          <button class="btn" data-copy="#out">Copy result</button>
          <button class="btn ghost" data-reset>Clear</button></div>
        <div class="status" id="st"></div></div>`,
    init(r) {
      const inp = $('#in', r), out = $('#out', r), st = $('#st', r);
      const run = (mode) => {
        if (!inp.value.trim()) return setStatus(st, 'Paste some JSON first.', 'err');
        try {
          const v = JSON.parse(inp.value);
          if (mode === 'fmt') out.value = JSON.stringify(v, null, 2);
          if (mode === 'min') out.value = JSON.stringify(v);
          const kind = Array.isArray(v) ? `array (${v.length} items)` : v === null ? 'null' : typeof v === 'object' ? `object (${Object.keys(v).length} keys)` : typeof v;
          setStatus(st, 'Valid JSON — ' + kind, 'ok');
        } catch (e) { out.value = ''; setStatus(st, 'Invalid JSON: ' + e.message, 'err'); }
      };
      $('#fmt', r).onclick = () => run('fmt');
      $('#min', r).onclick = () => run('min');
      $('#val', r).onclick = () => run('val');
    }
  },
  {
    id: 'base64', name: 'Base64', glyph: '64', keys: 'base64 encode decode',
    desc: 'Encode text to Base64 or decode it back (UTF-8 safe).',
    html: `<div class="grid2">
      <div class="panel"><div class="panel-title">Input</div><textarea id="in" spellcheck="false" placeholder="Text or Base64…"></textarea></div>
      <div class="panel"><div class="panel-title">Output</div><textarea id="out" readonly spellcheck="false"></textarea></div></div>
      <div class="panel" style="margin-top:16px"><div class="btns">
        <button class="btn primary" id="enc" data-primary>Encode</button>
        <button class="btn" id="dec">Decode</button>
        <button class="btn" data-copy="#out">Copy result</button>
        <button class="btn ghost" data-reset>Clear</button></div>
        <div class="status" id="st"></div></div>`,
    init(r) {
      const inp = $('#in', r), out = $('#out', r), st = $('#st', r);
      $('#enc', r).onclick = () => {
        const bytes = new TextEncoder().encode(inp.value);
        let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b)));
        out.value = btoa(bin); setStatus(st, 'Encoded.', 'ok');
      };
      $('#dec', r).onclick = () => {
        try {
          let s = inp.value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
          while (s.length % 4) s += '=';
          const bin = atob(s);
          const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
          out.value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          setStatus(st, 'Decoded.', 'ok');
        } catch (e) { out.value = ''; setStatus(st, 'Not valid Base64 (or not UTF-8 text).', 'err'); }
      };
    }
  },
  {
    id: 'uuid', name: 'UUID Generator', glyph: 'ID', keys: 'uuid guid generate v4',
    desc: 'Generate random UUID v4 values.',
    html: `<div class="panel"><div class="inline">
        <div class="field" style="width:120px"><label>How many (1–100)</label>
          <input type="number" id="n" min="1" max="100" value="5" /></div>
        <button class="btn primary" id="gen" data-primary style="margin-top:20px">Generate</button>
        <button class="btn" data-copy="#out" style="margin-top:20px">Copy all</button>
        <button class="btn ghost" data-reset style="margin-top:20px">Clear</button></div>
        <textarea id="out" readonly spellcheck="false" style="min-height:300px"></textarea></div>`,
    init(r) {
      const gen = () => {
        const n = Math.min(100, Math.max(1, parseInt($('#n', r).value, 10) || 1));
        $('#n', r).value = n;
        $('#out', r).value = Array.from({ length: n }, () => crypto.randomUUID()).join('\n');
      };
      $('#gen', r).onclick = gen; gen();
    }
  },
  {
    id: 'text', name: 'Text Tools', glyph: 'Aa', keys: 'text count words characters lines bytes',
    desc: 'Live character, word, line and UTF-8 byte counts.',
    html: `<div class="stack">
      <div class="stats">
        <div class="stat"><div class="n" id="c">0</div><div class="l">Characters</div></div>
        <div class="stat"><div class="n" id="cn">0</div><div class="l">No spaces</div></div>
        <div class="stat"><div class="n" id="w">0</div><div class="l">Words</div></div>
        <div class="stat"><div class="n" id="l">0</div><div class="l">Lines</div></div>
        <div class="stat"><div class="n" id="b">0</div><div class="l">UTF-8 bytes</div></div></div>
      <div class="panel"><textarea id="in" placeholder="Type or paste text…" style="min-height:280px"></textarea>
        <div class="btns"><button class="btn" data-copy="#in">Copy text</button>
        <button class="btn ghost" data-reset>Clear</button></div></div></div>`,
    init(r) {
      const inp = $('#in', r);
      const upd = () => {
        const s = inp.value;
        $('#c', r).textContent = [...s].length;
        $('#cn', r).textContent = [...s.replace(/\s/g, '')].length;
        $('#w', r).textContent = (s.trim().match(/\S+/g) || []).length;
        $('#l', r).textContent = s ? s.split(/\r\n|\r|\n/).length : 0;
        $('#b', r).textContent = new TextEncoder().encode(s).length;
      };
      inp.addEventListener('input', upd); upd();
    }
  },
  {
    id: 'time', name: 'Timestamp Converter', glyph: 'TS', keys: 'timestamp unix epoch date time',
    desc: 'Convert between Unix timestamps and readable dates.',
    html: `<div class="grid2">
      <div class="panel"><div class="panel-title">Unix → Date</div>
        <input type="text" id="ts" placeholder="e.g. 1700000000 (seconds or milliseconds)" />
        <div class="btns"><button class="btn primary" id="now" data-primary>Current timestamp</button></div>
        <div class="status" id="st"></div>
        ${row('Local', 'o1')}${row('UTC', 'o2')}${row('ISO', 'o3')}${row('Relative', 'o4')}</div>
      <div class="panel"><div class="panel-title">Date → Unix</div>
        <input type="datetime-local" id="dt" step="1" />
        ${row('Seconds', 's1')}${row('Millis', 's2')}</div></div>`,
    init(r) {
      const ts = $('#ts', r), dt = $('#dt', r), st = $('#st', r);
      const ids = ['o1', 'o2', 'o3', 'o4'];
      const fromUnix = () => {
        const v = ts.value.trim();
        if (!v) { ids.forEach((i) => ($('#' + i, r).textContent = '')); return setStatus(st, ''); }
        const n = Number(v);
        const d = new Date(Math.abs(n) >= 1e11 ? n : n * 1000);
        if (!isFinite(n) || isNaN(d)) return setStatus(st, 'Not a valid timestamp.', 'err');
        setStatus(st, Math.abs(n) >= 1e11 ? 'Interpreted as milliseconds.' : 'Interpreted as seconds.', 'ok');
        $('#o1', r).textContent = d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' });
        $('#o2', r).textContent = d.toUTCString();
        $('#o3', r).textContent = d.toISOString();
        const diff = Math.round((d - Date.now()) / 1000);
        const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
        const [u, sec] = units.find(([, s]) => Math.abs(diff) >= s) || units[5];
        $('#o4', r).textContent = rtf.format(Math.round(diff / sec), u);
      };
      const fromDate = () => {
        const t = new Date(dt.value).getTime();
        $('#s1', r).textContent = isNaN(t) ? '' : Math.floor(t / 1000);
        $('#s2', r).textContent = isNaN(t) ? '' : t;
      };
      ts.addEventListener('input', fromUnix);
      dt.addEventListener('input', fromDate);
      $('#now', r).onclick = () => {
        const now = new Date();
        ts.value = Math.floor(now.getTime() / 1000);
        dt.value = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
        fromUnix(); fromDate();
      };
    }
  },
  {
    id: 'color', name: 'Color Tools', glyph: '◐', keys: 'color hex rgb hsl swatch',
    desc: 'Convert HEX to RGB and HSL with a live preview.',
    html: `<div class="grid2">
      <div class="panel"><div class="panel-title">Input</div>
        <div class="inline"><input type="color" id="pick" value="#8b5cf6" />
          <input type="text" id="hex" value="#8b5cf6" style="flex:1" spellcheck="false" /></div>
        <div class="status" id="st"></div>
        <div class="preview" id="pv"></div>
        <div class="panel-title">Presets</div><div class="swatches" id="sws"></div></div>
      <div class="panel"><div class="panel-title">Values</div>
        ${row('HEX', 'oh')}${row('RGB', 'or')}${row('HSL', 'ol')}
        <div class="btns"><button class="btn ghost" data-reset>Reset</button></div></div></div>`,
    init(r) {
      const parse = (s) => {
        s = s.trim().replace(/^#/, '');
        if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
        if (!/^[0-9a-f]{6}$/i.test(s)) return null;
        return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
      };
      const toHsl = ([r0, g0, b0]) => {
        const r1 = r0 / 255, g1 = g0 / 255, b1 = b0 / 255;
        const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1), d = max - min;
        let h = 0, s = 0; const l = (max + min) / 2;
        if (d) {
          s = d / (1 - Math.abs(2 * l - 1));
          if (max === r1) h = ((g1 - b1) / d) % 6;
          else if (max === g1) h = (b1 - r1) / d + 2;
          else h = (r1 - g1) / d + 4;
          h *= 60; if (h < 0) h += 360;
        }
        return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
      };
      const hexIn = $('#hex', r), st = $('#st', r);
      const update = () => {
        const rgb = parse(hexIn.value);
        if (!rgb) return setStatus(st, 'Enter a valid HEX color (e.g. #8b5cf6).', 'err');
        setStatus(st, '');
        const hex = '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
        const [h, s, l] = toHsl(rgb);
        $('#pv', r).style.background = hex;
        $('#pick', r).value = hex;
        $('#oh', r).textContent = hex.toUpperCase();
        $('#or', r).textContent = `rgb(${rgb.join(', ')})`;
        $('#ol', r).textContent = `hsl(${h}, ${s}%, ${l}%)`;
      };
      hexIn.addEventListener('input', update);
      $('#pick', r).addEventListener('input', (e) => { hexIn.value = e.target.value; update(); });
      ['#8b5cf6', '#a78bfa', '#6d28d9', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#ffffff', '#111113'].forEach((c) => {
        const b = document.createElement('div');
        b.className = 'sw'; b.style.background = c; b.title = c;
        b.onclick = () => { hexIn.value = c; update(); };
        $('#sws', r).appendChild(b);
      });
      update();
    }
  },
  {
    id: 'gradient', name: 'CSS Gradient', glyph: '▦', keys: 'css gradient linear background',
    desc: 'Build a linear gradient and copy the CSS.',
    html: `<div class="grid2">
      <div class="panel"><div class="panel-title">Controls</div>
        <div class="inline"><div class="field"><label>Color 1</label><input type="color" id="c1" value="#8b5cf6" /></div>
          <div class="field"><label>Color 2</label><input type="color" id="c2" value="#0ea5e9" /></div></div>
        <div class="field"><label>Angle: <span id="av">135</span>°</label>
          <div class="inline"><input type="range" id="ang" min="0" max="360" value="135" /></div></div>
        <div class="btns"><button class="btn ghost" data-reset>Reset</button></div></div>
      <div class="panel"><div class="panel-title">Preview</div><div class="preview" id="pv" style="height:200px"></div>
        <div class="panel-title">CSS</div><pre class="out-box" id="css" style="min-height:0"></pre>
        <div class="btns"><button class="btn primary" data-copy="#css" data-primary>Copy CSS</button></div></div></div>`,
    init(r) {
      const upd = () => {
        const a = $('#ang', r).value, c1 = $('#c1', r).value, c2 = $('#c2', r).value;
        const g = `linear-gradient(${a}deg, ${c1} 0%, ${c2} 100%)`;
        $('#av', r).textContent = a;
        $('#pv', r).style.background = g;
        $('#css', r).textContent = `background: ${g};`;
      };
      ['#c1', '#c2', '#ang'].forEach((s) => $(s, r).addEventListener('input', upd)); upd();
    }
  },
  {
    id: 'password', name: 'Password Generator', glyph: '•••', keys: 'password generate secure random',
    desc: 'Generate cryptographically secure random passwords.',
    html: `<div class="panel">
        <div class="field"><label>Length: <span id="lv">20</span></label>
          <input type="range" id="len" min="4" max="64" value="20" /></div>
        <div class="inline">
          <label class="check"><input type="checkbox" id="up" checked /> Uppercase</label>
          <label class="check"><input type="checkbox" id="lo" checked /> Lowercase</label>
          <label class="check"><input type="checkbox" id="nu" checked /> Numbers</label>
          <label class="check"><input type="checkbox" id="sy" checked /> Symbols</label></div>
        <input type="text" id="out" readonly style="font-size:16px;padding:14px" />
        <div class="status" id="st"></div>
        <div class="btns"><button class="btn primary" id="gen" data-primary>Generate</button>
          <button class="btn" data-copy="#out">Copy</button>
          <button class="btn ghost" data-reset>Reset</button></div></div>`,
    init(r) {
      const sets = { up: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lo: 'abcdefghijklmnopqrstuvwxyz', nu: '0123456789', sy: '!@#$%^&*()-_=+[]{};:,.?/~' };
      const rnd = (n) => {
        const lim = Math.floor(2 ** 32 / n) * n; let x;
        do { x = crypto.getRandomValues(new Uint32Array(1))[0]; } while (x >= lim);
        return x % n;
      };
      const gen = () => {
        const len = +$('#len', r).value; $('#lv', r).textContent = len;
        const chosen = Object.keys(sets).filter((k) => $('#' + k, r).checked).map((k) => sets[k]);
        if (!chosen.length) { $('#out', r).value = ''; return setStatus($('#st', r), 'Select at least one character type.', 'err'); }
        const pool = chosen.join('');
        const pw = chosen.map((s) => s[rnd(s.length)]);
        while (pw.length < len) pw.push(pool[rnd(pool.length)]);
        for (let i = pw.length - 1; i > 0; i--) { const j = rnd(i + 1); [pw[i], pw[j]] = [pw[j], pw[i]]; }
        $('#out', r).value = pw.slice(0, len).join('');
        const bits = Math.round(len * Math.log2(pool.length));
        setStatus($('#st', r), `≈ ${bits} bits of entropy — ${bits >= 100 ? 'very strong' : bits >= 70 ? 'strong' : bits >= 50 ? 'fair' : 'weak'}`, bits >= 70 ? 'ok' : '');
      };
      $('#gen', r).onclick = gen;
      ['#len', '#up', '#lo', '#nu', '#sy'].forEach((s) => $(s, r).addEventListener('input', gen)); gen();
    }
  },
  {
    id: 'regex', name: 'Regex Tester', glyph: '.*', keys: 'regex regular expression match test',
    desc: 'Test regular expressions against sample text.',
    html: `<div class="stack">
      <div class="panel"><div class="inline">
        <div class="field" style="flex:1"><label>Pattern</label><input type="text" id="pat" placeholder="(\\w+)@(\\w+)\\.com" spellcheck="false" /></div>
        <div class="field" style="width:100px"><label>Flags</label><input type="text" id="fl" value="g" spellcheck="false" /></div></div>
        <div class="status" id="st"></div></div>
      <div class="grid2">
        <div class="panel"><div class="panel-title">Test text</div><textarea id="txt" spellcheck="false" placeholder="Paste text to test…"></textarea></div>
        <div class="panel"><div class="panel-title">Highlighted</div><div class="out-box" id="hl" style="min-height:260px;max-height:none"></div></div></div>
      <div class="panel"><div class="panel-title">Matches <span id="cnt"></span></div><div id="list"></div>
        <div class="btns"><button class="btn ghost" data-reset>Clear</button></div></div></div>`,
    init(r) {
      const run = () => {
        const pat = $('#pat', r).value, fl = $('#fl', r).value, txt = $('#txt', r).value, st = $('#st', r);
        $('#list', r).innerHTML = ''; $('#cnt', r).textContent = '';
        $('#hl', r).innerHTML = esc(txt);
        if (!pat) return setStatus(st, 'Enter a pattern.');
        let re;
        try { re = new RegExp(pat, fl); } catch (e) { return setStatus(st, 'Error: ' + e.message, 'err'); }
        const ms = [];
        if (re.global) { for (const m of txt.matchAll(re)) { ms.push(m); if (ms.length >= 500) break; } }
        else { const m = re.exec(txt); if (m) ms.push(m); }
        setStatus(st, ms.length ? 'Pattern is valid.' : 'Pattern is valid — no matches.', ms.length ? 'ok' : '');
        $('#cnt', r).textContent = `(${ms.length}${ms.length >= 500 ? '+' : ''})`;
        let html = '', last = 0;
        ms.forEach((m) => {
          if (!m[0].length) return;
          html += esc(txt.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
          last = m.index + m[0].length;
        });
        $('#hl', r).innerHTML = html + esc(txt.slice(last));
        $('#list', r).innerHTML = ms.map((m, i) =>
          `<div class="match">#${i + 1} @${m.index}: ${esc(m[0]) || '<span class="g">(empty)</span>'}` +
          m.slice(1).map((g, j) => `<div class="g">  group ${j + 1}: ${g === undefined ? 'undefined' : esc(g)}</div>`).join('') + '</div>').join('');
      };
      ['#pat', '#fl', '#txt'].forEach((s) => $(s, r).addEventListener('input', run)); run();
    }
  }
];

/* ---------------- App shell ---------------- */
const nav = $('#nav'), ws = $('#workspace'), search = $('#search');
let current = TOOLS[0].id;

function renderNav() {
  const q = search.value.trim().toLowerCase();
  const list = TOOLS.filter((t) => !q || (t.name + ' ' + t.keys).toLowerCase().includes(q));
  nav.innerHTML = list.length ? '' : '<div class="nav-empty">No tools found.</div>';
  list.forEach((t) => {
    const b = document.createElement('button');
    b.className = 'nav-item' + (t.id === current ? ' active' : '');
    b.innerHTML = `<span class="ico">${t.glyph}</span><span>${t.name}</span>`;
    b.onclick = () => openTool(t.id);
    nav.appendChild(b);
  });
  return list;
}

function openTool(id) {
  const t = TOOLS.find((x) => x.id === id) || TOOLS[0];
  current = t.id;
  try { localStorage.setItem('lucid.lastTool', t.id); } catch (e) {}
  $('#crumb').textContent = t.name;
  ws.innerHTML = head(t.name, t.desc) + t.html;
  ws.scrollTop = 0;
  t.init(ws);
  renderNav();
}

ws.addEventListener('click', (e) => {
  const c = e.target.closest('[data-copy]');
  if (c) { const el = $(c.dataset.copy, ws); return copy(el.value !== undefined ? el.value : el.textContent); }
  if (e.target.closest('[data-reset]')) openTool(current);
});

search.addEventListener('input', renderNav);
search.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const l = renderNav(); if (l[0]) openTool(l[0].id); }
  if (e.key === 'Escape') { search.value = ''; search.blur(); renderNav(); }
});

document.addEventListener('keydown', (e) => {
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if (!mod) return;
  if (e.key.toLowerCase() === 'k') { e.preventDefault(); search.focus(); search.select(); }
  else if (e.key === 'Enter') { const p = $('[data-primary]', ws); if (p) { e.preventDefault(); p.click(); } }
  else if (/^[1-9]$/.test(e.key) && TOOLS[+e.key - 1]) { e.preventDefault(); openTool(TOOLS[+e.key - 1].id); }
});

let saved = null;
try { saved = localStorage.getItem('lucid.lastTool'); } catch (e) {}
openTool(saved || TOOLS[0].id);
