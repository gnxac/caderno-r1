/* Caderno R1 — gráficos em SVG (sem bibliotecas, funcionam offline) */
(function (MQ) {
  'use strict';
  const { esc } = MQ;
  const NS = 'http://www.w3.org/2000/svg';

  let tipEl = null;
  MQ.showTip = function (x, y, html) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'chart-tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
    tipEl.innerHTML = html;
    tipEl.style.display = 'block';
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let left = x + 14, top = y - h - 10;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tipEl.style.left = Math.max(8, left) + 'px';
    tipEl.style.top = top + 'px';
  };
  MQ.hideTip = function () { if (tipEl) tipEl.style.display = 'none'; };

  function niceMax(v) {
    if (v <= 5) return 5;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * p;
  }
  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    if (text != null) e.textContent = text;
    return e;
  }

  /* Bolhas: x = % de acerto, y = questões resolvidas, tamanho = incidência */
  MQ.bubbleChart = function (container, items, opts) {
    opts = opts || {};
    const W = Math.max(320, Math.min(640, container.clientWidth || 640)), H = W < 500 ? 300 : 360, m = { l: 48, r: 16, t: 14, b: 40 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxY = niceMax(Math.max(1, ...items.map(i => i.y)));
    const maxS = Math.max(1, ...items.map(i => i.size));
    const xSplit = opts.xSplit != null ? opts.xSplit : 60;
    const ySplit = opts.ySplit != null ? opts.ySplit : maxY / 2;
    const sx = v => m.l + (v / 100) * iw;
    const sy = v => m.t + ih - (v / maxY) * ih;
    const sr = v => 9 + Math.sqrt(v / maxS) * 24;

    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', role: 'img', 'aria-label': opts.label || 'Gráfico de bolhas' });
    for (let i = 0; i <= 5; i++) {
      const v = i * 20;
      svg.appendChild(el('line', { x1: sx(v), x2: sx(v), y1: m.t, y2: m.t + ih, class: 'grid' }));
      svg.appendChild(el('text', { x: sx(v), y: H - m.b + 16, 'text-anchor': 'middle' }, v + '%'));
    }
    for (let i = 0; i <= 4; i++) {
      const v = (maxY / 4) * i;
      svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: sy(v), y2: sy(v), class: 'grid' }));
      svg.appendChild(el('text', { x: m.l - 8, y: sy(v) + 4, 'text-anchor': 'end' }, Math.round(v).toLocaleString('pt-BR')));
    }
    svg.appendChild(el('line', { x1: sx(xSplit), x2: sx(xSplit), y1: m.t, y2: m.t + ih, class: 'axis' }));
    svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: sy(ySplit), y2: sy(ySplit), class: 'axis' }));
    const qx1 = (m.l + sx(xSplit)) / 2, qx2 = (sx(xSplit) + m.l + iw) / 2;
    const qy1 = (m.t + sy(ySplit)) / 2, qy2 = (sy(ySplit) + m.t + ih) / 2;
    [['Q2', qx1, qy1], ['Q3', qx2, qy1], ['Q1', qx1, qy2], ['Q4', qx2, qy2]].forEach(([t, x, y]) =>
      svg.appendChild(el('text', { x, y: y + 8, 'text-anchor': 'middle', class: 'quad' }, t)));
    svg.appendChild(el('text', { x: m.l + iw / 2, y: H - 4, 'text-anchor': 'middle' }, 'Percentual de acertos'));
    const yl = el('text', { x: 12, y: m.t + ih / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (m.t + ih / 2) + ')' }, 'Questões resolvidas');
    svg.appendChild(yl);

    items.slice().sort((a, b) => b.size - a.size).forEach(it => {
      const cx = sx(Math.max(0, Math.min(100, it.x))), cy = sy(Math.min(maxY, it.y)), r = sr(it.size);
      const g = el('g');
      const c = el('circle', { cx, cy, r, class: 'bubble', tabindex: '0', role: 'button', 'aria-label': it.aria || it.label });
      c.style.stroke = 'var(--accent)';
      const ring = el('circle', { cx, cy, r: r + 2, fill: 'none', stroke: 'var(--surface)', 'stroke-width': 2, 'pointer-events': 'none' });
      g.appendChild(ring); g.appendChild(c);
      g.appendChild(el('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'blabel' }, it.letter));
      const show = e => {
        const b = c.getBoundingClientRect();
        MQ.showTip(e && e.clientX != null ? e.clientX : b.left + b.width / 2, e && e.clientY != null ? e.clientY : b.top, it.tip);
      };
      c.addEventListener('mousemove', show);
      c.addEventListener('focus', () => show());
      c.addEventListener('mouseleave', MQ.hideTip);
      c.addEventListener('blur', MQ.hideTip);
      if (it.onClick) {
        c.addEventListener('click', () => { MQ.hideTip(); it.onClick(); });
        c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); MQ.hideTip(); it.onClick(); } });
      }
      svg.appendChild(g);
    });
    container.innerHTML = '';
    container.appendChild(svg);
  };

  /* Linhas: uma série por área, um ponto por dia.
     cfg: { labels, series: [{ name, color, values (número ou null), tips }], yMax (null = automático), unit, label } */
  MQ.multiLineChart = function (container, cfg) {
    const W = Math.max(320, Math.min(640, container.clientWidth || 640)), H = W < 500 ? 220 : 240, m = { l: 44, r: 16, t: 14, b: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const n = cfg.labels.length, unit = cfg.unit || '';
    const top = cfg.yMax || niceMax(Math.max(1, ...cfg.series.reduce((a, s) => a.concat(s.values.map(v => v == null ? 0 : v)), [])));
    const sx = i => m.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
    const sy = v => m.t + ih - (v / top) * ih;
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', role: 'img', 'aria-label': cfg.label || 'Evolução' });
    [0, 0.25, 0.5, 0.75, 1].forEach(f => {
      const v = top * f;
      svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: sy(v), y2: sy(v), class: 'grid' }));
      svg.appendChild(el('text', { x: m.l - 8, y: sy(v) + 4, 'text-anchor': 'end' }, (Math.round(v * 10) / 10) + unit));
    });
    cfg.labels.forEach((l, i) => svg.appendChild(el('text', { x: sx(i), y: H - 8, 'text-anchor': 'middle' }, l)));
    cfg.series.forEach(s => {
      const valid = s.values.map((v, i) => ({ v, i })).filter(o => o.v != null);
      if (!valid.length) return;
      const d = valid.map((o, k) => (k ? 'L' : 'M') + sx(o.i).toFixed(1) + ' ' + sy(o.v).toFixed(1)).join(' ');
      svg.appendChild(el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      valid.forEach(o => svg.appendChild(el('circle', { cx: sx(o.i), cy: sy(o.v), r: 4.5, fill: 'var(--surface)', stroke: s.color, 'stroke-width': 2 })));
    });
    const cross = el('line', { x1: 0, x2: 0, y1: m.t, y2: m.t + ih, class: 'axis', visibility: 'hidden' });
    svg.appendChild(cross);
    const hit = el('rect', { x: m.l - 10, y: m.t, width: iw + 20, height: ih, fill: 'transparent' });
    svg.appendChild(hit);
    function show(e) {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      let best = 0, bd = Infinity;
      for (let i = 0; i < n; i++) { const dd = Math.abs(sx(i) - x); if (dd < bd) { bd = dd; best = i; } }
      cross.setAttribute('x1', sx(best)); cross.setAttribute('x2', sx(best)); cross.setAttribute('visibility', 'visible');
      MQ.showTip(e.clientX, e.clientY, '<b>' + esc(cfg.labels[best]) + '</b>' + cfg.series.map(s =>
        '<br><span style="color:' + s.color + '">●</span> ' + esc(s.name) + ': ' + (s.values[best] == null ? 'sem questões' : s.values[best] + unit + (s.tips && s.tips[best] ? ' · ' + esc(s.tips[best]) : ''))).join(''));
    }
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); MQ.hideTip(); });
    container.innerHTML = '';
    container.appendChild(svg);
  };

  /* Linha: evolução do % de acerto por semana */
  MQ.lineChart = function (container, points, opts) {
    opts = opts || {};
    const W = 640, H = 220, m = { l: 40, r: 40, t: 14, b: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const n = points.length;
    const sx = i => m.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
    const sy = v => m.t + ih - (v / 100) * ih;
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg', role: 'img', 'aria-label': opts.label || 'Evolução' });
    [0, 25, 50, 75, 100].forEach(v => {
      svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: sy(v), y2: sy(v), class: 'grid' }));
      svg.appendChild(el('text', { x: m.l - 8, y: sy(v) + 4, 'text-anchor': 'end' }, v + '%'));
    });
    const step = Math.max(1, Math.ceil(n / 6));
    points.forEach((p, i) => {
      if (i % step === 0 || i === n - 1) svg.appendChild(el('text', { x: sx(i), y: H - 8, 'text-anchor': 'middle' }, p.label));
    });
    const valid = points.map((p, i) => ({ p, i })).filter(o => o.p.value != null);
    if (valid.length) {
      const d = valid.map((o, k) => (k ? 'L' : 'M') + sx(o.i).toFixed(1) + ' ' + sy(o.p.value).toFixed(1)).join(' ');
      svg.appendChild(el('path', { d, class: 'line', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      valid.forEach(o => svg.appendChild(el('circle', { cx: sx(o.i), cy: sy(o.p.value), r: 4.5, class: 'dot' })));
      const last = valid[valid.length - 1];
      svg.appendChild(el('text', { x: sx(last.i) + 8, y: sy(last.p.value) + 4, style: 'fill:var(--ink);font-weight:600' }, last.p.value + '%'));
    }
    const cross = el('line', { x1: 0, x2: 0, y1: m.t, y2: m.t + ih, class: 'axis', visibility: 'hidden' });
    svg.appendChild(cross);
    const hit = el('rect', { x: m.l - 10, y: m.t, width: iw + 20, height: ih, fill: 'transparent' });
    svg.appendChild(hit);
    hit.addEventListener('mousemove', e => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      let best = 0, bd = Infinity;
      points.forEach((p, i) => { const dd = Math.abs(sx(i) - x); if (dd < bd) { bd = dd; best = i; } });
      const p = points[best];
      cross.setAttribute('x1', sx(best)); cross.setAttribute('x2', sx(best)); cross.setAttribute('visibility', 'visible');
      MQ.showTip(e.clientX, e.clientY, '<b>' + esc(p.tipLabel || p.label) + '</b><br>' + (p.value == null ? 'Sem questões' : p.value + '% de acerto · ' + p.n + ' questões'));
    });
    hit.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); MQ.hideTip(); });
    container.innerHTML = '';
    container.appendChild(svg);
  };
})(window.MQ);
