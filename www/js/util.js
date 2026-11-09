/* Caderno R1 — utilidades compartilhadas */
window.MQ = window.MQ || {};

(function (MQ) {
  'use strict';

  MQ.uid = function () {
    const r = Math.random().toString(36).slice(2, 8);
    return Date.now().toString(36) + r;
  };

  MQ.now = function () { return Date.now(); };

  MQ.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* Texto com quebras de linha preservadas, já escapado */
  MQ.para = function (s) {
    return MQ.esc(s).split(/\n{2,}/).map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
  };

  MQ.$ = (sel, root) => (root || document).querySelector(sel);
  MQ.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  MQ.fmtDate = function (ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR');
  };
  MQ.fmtDateTime = function (ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  MQ.pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
  MQ.fmtDuration = function (sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const pad = n => String(n).padStart(2, '0');
    return (h ? h + ':' + pad(m) : m) + ':' + pad(s);
  };

  MQ.norm = function (s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  };

  MQ.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Toast ---------- */
  let toastTimer = null;
  MQ.toast = function (msg, kind) {
    let el = MQ.$('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.className = 'toast show ' + (kind || '');
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
  };

  /* ---------- Modal ---------- */
  MQ.modal = function (opts) {
    // opts: { title, body (html), actions: [{label, kind, onClick(close, root) -> false keeps open}], wide, onOpen(root) }
    const back = document.createElement('div');
    back.className = 'modal-back';
    const box = document.createElement('div');
    box.className = 'modal' + (opts.wide ? ' wide' : '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', opts.title || 'Janela');
    box.innerHTML =
      '<header class="modal-head"><h2>' + MQ.esc(opts.title || '') + '</h2>' +
      '<button class="icon-btn modal-x" aria-label="Fechar">' + MQ.icon('x') + '</button></header>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.actions && opts.actions.length ? '<footer class="modal-foot"></footer>' : '');
    back.appendChild(box);
    document.body.appendChild(back);
    const prevFocus = document.activeElement;
    function close() {
      back.remove();
      document.removeEventListener('keydown', onKey, true);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    MQ.$('.modal-x', box).addEventListener('click', close);
    const foot = MQ.$('.modal-foot', box);
    (opts.actions || []).forEach(a => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.kind || '');
      b.textContent = a.label;
      b.addEventListener('click', () => {
        const r = a.onClick ? a.onClick(close, box) : undefined;
        if (r !== false) close();
      });
      foot.appendChild(b);
    });
    if (opts.onOpen) opts.onOpen(box, close);
    const first = MQ.$('input, select, textarea, button:not(.modal-x)', box);
    if (first) setTimeout(() => first.focus(), 30);
    return { close, root: box };
  };

  MQ.confirm = function (title, text, okLabel, danger) {
    return new Promise(resolve => {
      let done = false;
      MQ.modal({
        title,
        body: '<p>' + MQ.esc(text) + '</p>',
        onClose: () => { if (!done) resolve(false); },
        actions: [
          { label: 'Cancelar', kind: 'ghost', onClick: () => { done = true; resolve(false); } },
          { label: okLabel || 'Confirmar', kind: danger ? 'danger' : 'primary', onClick: () => { done = true; resolve(true); } }
        ]
      });
    });
  };

  MQ.prompt = function (title, label, value, okLabel) {
    return new Promise(resolve => {
      let done = false;
      MQ.modal({
        title,
        body: '<label class="field"><span>' + MQ.esc(label) + '</span><input type="text" id="mq-prompt" maxlength="100" value="' + MQ.esc(value || '') + '"></label>',
        onOpen: (root, close) => {
          MQ.$('#mq-prompt', root).addEventListener('keydown', e => {
            if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) { done = true; resolve(v); close(); } }
          });
        },
        onClose: () => { if (!done) resolve(null); },
        actions: [
          { label: 'Cancelar', kind: 'ghost' },
          { label: okLabel || 'Salvar', kind: 'primary', onClick: (close, root) => {
            const v = MQ.$('#mq-prompt', root).value.trim();
            if (!v) { MQ.toast('Digite um nome.'); return false; }
            done = true; resolve(v);
          } }
        ]
      });
    });
  };

  /* ---------- Menu suspenso simples ---------- */
  MQ.menu = function (anchor, items) {
    MQ.$$('.popmenu').forEach(m => m.remove());
    const m = document.createElement('div');
    m.className = 'popmenu';
    m.setAttribute('role', 'menu');
    items.forEach(it => {
      if (it === '-') { const hr = document.createElement('div'); hr.className = 'sep'; m.appendChild(hr); return; }
      const b = document.createElement('button');
      b.setAttribute('role', 'menuitem');
      b.className = it.danger ? 'danger' : '';
      b.textContent = it.label;
      if (it.disabled) b.disabled = true;
      b.addEventListener('click', () => { m.remove(); it.onClick(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let left = Math.min(r.right - mw, window.innerWidth - mw - 8);
    left = Math.max(8, left);
    let top = r.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    m.style.left = left + 'px';
    m.style.top = top + 'px';
    const first = m.querySelector('button:not([disabled])');
    if (first) first.focus();
    setTimeout(() => {
      function off(e) {
        if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); }
      }
      function esc(e) { if (e.key === 'Escape') { m.remove(); document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); anchor.focus(); } }
      document.addEventListener('mousedown', off);
      document.addEventListener('keydown', esc);
    }, 0);
  };

  /* ---------- Ícones (traço simples, 24px) ---------- */
  const ICONS = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19"/><path d="M8 8h7"/>',
    folder: '<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
    list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.5" cy="7" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17" r="1"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    cloud: '<path d="M7 18h10.5a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 9.6 4.2 4.2 0 0 0 7 18z"/>',
    sync: '<path d="M19.5 8A8 8 0 0 0 5 7.5M4.5 16A8 8 0 0 0 19 16.5"/><path d="M19.5 3.5V8H15M4.5 20.5V16H9"/>',
    more: '<circle cx="12" cy="5.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="18.5" r="1.3"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    flag: '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
    scissors: '<circle cx="6.5" cy="7" r="2.5"/><circle cx="6.5" cy="17" r="2.5"/><path d="M8.6 8.4L20 17M8.6 15.6L20 7"/>',
    printer: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3.5h16V16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3.5h16V16"/>',
    textup: '<path d="M4 18l5-12 5 12M5.8 14h6.4"/><path d="M18 6v6M15 9h6"/>',
    textdown: '<path d="M4 18l5-12 5 12M5.8 14h6.4"/><path d="M15 9h6"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l2.5 2"/>',
    tag: '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8" cy="8" r="1.3"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    eraser: '<path d="M8.5 19.5L3.8 14.8a1.5 1.5 0 0 1 0-2.1l8.9-8.9a1.5 1.5 0 0 1 2.1 0l5.4 5.4a1.5 1.5 0 0 1 0 2.1l-8.2 8.2"/><path d="M8.5 19.5H20M7 10.5l6.5 6.5"/>'
  };
  MQ.icon = function (name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  };

  /* ---------- CSV ---------- */
  MQ.parseCSV = function (text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/)[0] || '';
    const semi = (firstLine.match(/;/g) || []).length;
    const comma = (firstLine.match(/,/g) || []).length;
    const tab = (firstLine.match(/\t/g) || []).length;
    const d = tab > semi && tab > comma ? '\t' : (semi >= comma ? ';' : ',');
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += c;
      } else if (c === '"') q = true;
      else if (c === d) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  };

  MQ.toCSV = function (rows) {
    return rows.map(r => r.map(c => {
      const s = String(c == null ? '' : c);
      return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(';')).join('\r\n');
  };

  /* ---------- Salvar arquivo (Windows / Android / navegador) ---------- */
  MQ.saveFile = async function (filename, content, mime) {
    const cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.Filesystem) {
      try {
        const { Filesystem, Share } = cap.Plugins;
        const res = await Filesystem.writeFile({ path: filename, data: content, directory: 'CACHE', encoding: 'utf8' });
        if (Share) await Share.share({ title: filename, url: res.uri });
        else MQ.toast('Arquivo salvo em ' + res.uri);
        return;
      } catch (e) {
        MQ.toast('Não foi possível salvar o arquivo: ' + (e.message || e), 'err');
        return;
      }
    }
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  MQ.pickFile = function (accept) {
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = accept || '';
      inp.addEventListener('change', () => {
        const f = inp.files && inp.files[0];
        if (!f) return resolve(null);
        const rd = new FileReader();
        rd.onload = () => resolve({ name: f.name, text: rd.result });
        rd.onerror = () => resolve(null);
        rd.readAsText(f, 'utf-8');
      });
      inp.click();
    });
  };

  MQ.openExternal = function (url) {
    if (window.mqNative && window.mqNative.openExternal) return window.mqNative.openExternal(url);
    const cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.Browser) return cap.Plugins.Browser.open({ url });
    window.open(url, '_blank', 'noopener');
  };
})(window.MQ);
