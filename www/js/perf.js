/* Caderno R1 — meu desempenho */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;
  const DAY = 86400000;

  MQ.perf = { period: '30', from: '', to: '', origin: '', view: 'pct', drill: [] };

  const PERIODS = [['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['180', 'Últimos 180 dias'], ['365', 'Último ano'], ['730', 'Últimos 2 anos'], ['all', 'Todo o histórico'], ['custom', 'Datas específicas']];

  function range() {
    const p = MQ.perf;
    const end = Date.now();
    if (p.period === 'all') return [0, end];
    if (p.period === 'custom') {
      const a = p.from ? new Date(p.from + 'T00:00:00').getTime() : 0;
      const b = p.to ? new Date(p.to + 'T23:59:59').getTime() : end;
      return [a, b];
    }
    const d = parseInt(p.period, 10);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return [start.getTime() - (d - 1) * DAY, end];
  }

  function filteredAttempts() {
    const [a, b] = range();
    const o = MQ.perf.origin;
    return MQ.alive('attempts').filter(x => x.ts >= a && x.ts <= b && MQ.get('questions', x.qid) &&
      (!o || (o === 'banco' ? (x.ctx === 'banco' || !x.ctx) : x.ctx === o)));
  }

  function groupBy(atts, depth, prefix) {
    const g = {};
    atts.forEach(a => {
      const q = MQ.get('questions', a.qid);
      const path = MQ.qPath(q);
      if (prefix.length && prefix.some((p, i) => path[i] !== p)) return;
      const k = path[depth] || 'Sem classificação';
      const o = g[k] || (g[k] = { name: k, n: 0, ok: 0, deeper: false });
      o.n++; if (a.correct) o.ok++;
      if (path.length > depth + 1) o.deeper = true;
    });
    return Object.values(g);
  }

  function bankIncidence(depth, prefix) {
    const g = {};
    MQ.alive('questions').forEach(q => {
      const path = MQ.qPath(q);
      if (prefix.length && prefix.some((p, i) => path[i] !== p)) return;
      const k = path[depth] || 'Sem classificação';
      g[k] = (g[k] || 0) + 1;
    });
    return g;
  }

  function sortGroups(arr, depth) {
    return arr.sort((a, b) => {
      if (depth === 0) {
        const ia = MQ.AREAS.indexOf(a.name), ib = MQ.AREAS.indexOf(b.name);
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      }
      return b.n - a.n;
    });
  }

  MQ.views.desempenho = function (root) {
    const p = MQ.perf;
    const atts = filteredAttempts();
    const total = atts.length, ok = atts.filter(a => a.correct).length;
    const lists = MQ.alive('lists').sort((a, b) => b.createdAt - a.createdAt);
    const originOpts = '<option value="">Todas as respostas</option><option value="banco"' + (p.origin === 'banco' ? ' selected' : '') + '>Só no banco de questões</option>' +
      lists.map(l => '<option value="' + (l.kind === 'simulado' ? 'sim:' : 'lista:') + l.id + '"' + (p.origin === (l.kind === 'simulado' ? 'sim:' : 'lista:') + l.id ? ' selected' : '') + '>' + (l.kind === 'simulado' ? 'Simulado: ' : 'Lista: ') + esc(l.name) + '</option>').join('');

    root.innerHTML =
      '<div class="page-head"><div><h1>Meu desempenho</h1><p>Onde você está acertando, onde precisa voltar e como evolui.</p></div>' +
      '<div class="toolbar"><button class="btn ghost" id="p-more" aria-label="Mais opções">' + icon('more') + '</button></div></div>' +
      '<div class="perf-layout"><aside class="panel perf-side" aria-label="Filtros"><h2>Filtros</h2>' +
      '<label class="field"><span>Período</span><select id="p-period">' + PERIODS.map(([v, l]) => '<option value="' + v + '"' + (p.period === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      (p.period === 'custom' ? '<label class="field"><span>De</span><input type="date" id="p-from" value="' + esc(p.from) + '"></label><label class="field"><span>Até</span><input type="date" id="p-to" value="' + esc(p.to) + '"></label>' : '') +
      '<label class="field"><span>Origem</span><select id="p-origin">' + originOpts + '</select></label></aside><div class="perf-main">' +
      (total ? '' : '<div class="empty"><h2>Sem respostas neste período</h2><p>Responda questões no banco, nas listas ou em simulados. Se você já respondeu, tente um período maior.</p><a class="btn primary" href="#/questoes">Resolver questões</a></div>') +
      (total ? '<div class="perf-grid">' +
        '<section class="panel span-5"><h2>Respostas no período</h2><div class="sub">Cada resposta conta, inclusive quando você refaz uma questão.</div>' +
        '<div class="totals"><div class="big-pct">' + MQ.pct(ok, total) + '%</div><dl><dt>Total</dt><dd>' + total + '</dd><dt>Certas</dt><dd>' + ok + '</dd><dt>Erradas</dt><dd>' + (total - ok) + '</dd></dl></div>' +
        '<div class="toolbar" style="margin-top:14px"><button class="btn sm" id="p-wrong-list">Lista com as erradas</button><button class="btn sm" id="p-wrong-sim">Simulado com as erradas</button></div></section>' +
        '<section class="panel span-7"><h2>Evolução</h2><div class="sub">Percentual de acerto por ' + ({ 1: 'dia', 2: 'período de 2 dias' }[bucketDays()] || 'semana') + '</div><div id="p-line"></div></section>' +
        '<section class="panel span-12"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2>Por matéria</h2><div class="sub" id="p-crumb"></div></div>' +
        '<div class="seg" role="group" aria-label="Visualização"><button data-view="pct" aria-pressed="' + (p.view === 'pct') + '">% de acerto</button><button data-view="total" aria-pressed="' + (p.view === 'total') + '">Total de respostas</button></div></div><div class="bars" id="p-bars"></div></section>' +
        '<section class="panel span-7"><h2>Onde focar</h2><div class="sub">Cada bolha é uma matéria. Tamanho = quantas questões dela existem no seu banco (um indicador de quanto ela pesa). Clique para detalhar.</div><div id="p-bubble"></div>' +
        '<div class="quad-help"><span><b>Q1</b> poucas questões e acerto baixo: faça mais questões e revise a teoria.</span><span><b>Q2</b> muitas questões e acerto baixo: alerta — volte à teoria.</span><span><b>Q3</b> muitas questões e acerto bom: mantenha o ritmo.</span><span><b>Q4</b> poucas questões e acerto bom: aumente o volume.</span></div></section>' +
        '<section class="panel span-5"><h2>Assuntos com mais erros</h2><div class="sub">Considera tema e subtema</div><ul class="weak-list" id="p-weak"></ul></section>' +
        '<section class="panel span-12"><h2>Tabela</h2><div class="sub">Os mesmos números das bolhas</div><div id="p-table"></div></section>' +
        '</div>' : '') + '</div></div>';

    $('#p-period', root).onchange = e => { p.period = e.target.value; MQ.render(); };
    if ($('#p-from', root)) { $('#p-from', root).onchange = e => { p.from = e.target.value; MQ.render(); }; $('#p-to', root).onchange = e => { p.to = e.target.value; MQ.render(); }; }
    $('#p-origin', root).onchange = e => { p.origin = e.target.value; p.drill = []; MQ.render(); };
    $('#p-more', root).onclick = e => MQ.menu(e.currentTarget, [
      { label: 'Excluir todo o histórico de respostas', danger: true, onClick: async () => {
        const okk = await MQ.confirm('Excluir histórico', 'Todas as suas respostas, em todos os aparelhos sincronizados, serão apagadas. Questões, listas e pastas continuam. Não dá para desfazer.', 'Excluir histórico', true);
        if (!okk) return;
        MQ.alive('attempts').forEach(a => MQ.remove('attempts', a.id));
        MQ.toast('Histórico de respostas excluído.'); MQ.render();
      } }
    ]);
    if (!total) return;

    /* Lista/simulado com erradas: questões cuja última resposta no período foi errada */
    function wrongIds() {
      const last = {};
      atts.forEach(a => { if (!last[a.qid] || a.ts > last[a.qid].ts) last[a.qid] = a; });
      return Object.values(last).filter(a => !a.correct).map(a => a.qid);
    }
    $('#p-wrong-list', root).onclick = () => { const ids = wrongIds(); if (!ids.length) MQ.toast('Nenhuma questão errada no período.'); else MQ.createListModal(ids, 'Erradas — ' + MQ.fmtDate(Date.now())); };
    $('#p-wrong-sim', root).onclick = () => { const ids = wrongIds(); if (!ids.length) MQ.toast('Nenhuma questão errada no período.'); else MQ.simCreateModal(ids, 'Simulado de erradas — ' + MQ.fmtDate(Date.now())); };
    $$('[data-view]', root).forEach(b => b.onclick = () => { p.view = b.dataset.view; MQ.render(); });

    // Evolução
    const bd = bucketDays();
    const [ra, rb] = range();
    const firstTs = p.period === 'all' ? Math.min(...atts.map(a => a.ts)) : ra;
    const startDay = new Date(firstTs); startDay.setHours(0, 0, 0, 0);
    const buckets = [];
    for (let t = startDay.getTime(); t <= rb; t += bd * DAY) buckets.push({ t, n: 0, ok: 0 });
    const trimmed = buckets.slice(-26);
    atts.forEach(a => {
      const b = trimmed.find(x => a.ts >= x.t && a.ts < x.t + bd * DAY);
      if (b) { b.n++; if (a.correct) b.ok++; }
    });
    MQ.lineChart($('#p-line', root), trimmed.map(b => {
      const d = new Date(b.t);
      const lab = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { label: lab, tipLabel: bd === 1 ? lab : 'Semana de ' + lab, value: b.n ? MQ.pct(b.ok, b.n) : null, n: b.n };
    }), { label: 'Evolução do percentual de acerto' });

    // Barras com detalhamento
    const depth = p.drill.length;
    const groups = sortGroups(groupBy(atts, depth, p.drill), depth);
    $('#p-crumb', root).innerHTML = (depth ? '<button class="btn ghost sm" id="p-up">' + icon('left') + ' Voltar</button> ' : '') +
      esc(depth ? p.drill.join(' › ') : 'Grandes áreas') + (groups.some(g => g.deeper) ? ' · clique numa barra para detalhar' : '');
    if ($('#p-up', root)) $('#p-up', root).onclick = () => { p.drill.pop(); MQ.render(); };
    const maxN = Math.max(1, ...groups.map(g => g.n));
    $('#p-bars', root).innerHTML = groups.length ? groups.map((g, i) => {
      const val = p.view === 'pct' ? MQ.pct(g.ok, g.n) : g.n;
      const w = p.view === 'pct' ? val : Math.round((g.n / maxN) * 100);
      const txt = p.view === 'pct' ? val + '% (' + g.ok + '/' + g.n + ')' : g.n;
      const tag = g.deeper ? 'button' : 'div';
      return '<' + tag + ' class="bar-row" data-bar="' + i + '"' + (g.deeper ? ' aria-label="Detalhar ' + esc(g.name) + '"' : '') + '><span class="lbl">' + esc(g.name) + '</span><span class="bar-track"><span class="bar-fill" style="display:block;width:' + w + '%"></span></span><span class="val">' + txt + '</span></' + tag + '>';
    }).join('') : '<p class="muted">Sem respostas nesse nível.</p>';
    $$('button[data-bar]', root).forEach(b => b.onclick = () => { p.drill.push(groups[+b.dataset.bar].name); MQ.render(); });
    $$('[data-bar]', root).forEach(b => {
      const g = groups[+b.dataset.bar];
      b.addEventListener('mousemove', e => MQ.showTip(e.clientX, e.clientY, '<b>' + esc(g.name) + '</b><br>' + g.ok + ' certas de ' + g.n + ' (' + MQ.pct(g.ok, g.n) + '%)'));
      b.addEventListener('mouseleave', MQ.hideTip);
    });

    // Bolhas
    const inc = bankIncidence(depth, p.drill);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const items = groups.slice(0, 26).map((g, i) => ({
      label: g.name, letter: letters[i], x: MQ.pct(g.ok, g.n), y: g.n, size: inc[g.name] || 1,
      tip: '<b>' + letters[i] + ' · ' + esc(g.name) + '</b><br>' + MQ.pct(g.ok, g.n) + '% de acerto · ' + g.n + ' respostas<br>' + (inc[g.name] || 0) + ' questões no banco',
      aria: g.name + ': ' + MQ.pct(g.ok, g.n) + '% de acerto em ' + g.n + ' respostas',
      onClick: g.deeper ? () => { p.drill.push(g.name); MQ.render(); } : null
    }));
    const meanN = groups.reduce((s, g) => s + g.n, 0) / Math.max(1, groups.length);
    MQ.bubbleChart($('#p-bubble', root), items, { xSplit: 60, ySplit: meanN, label: 'Percentual de acerto versus questões resolvidas por matéria' });
    $('#p-table', root).innerHTML = '<div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>Bolha</th><th>Matéria</th><th class="num">Respostas</th><th class="num">% de acerto</th><th class="num hide-sm">No banco</th><th>Quadrante</th></tr></thead><tbody>' +
      items.map(it => {
        const hi = it.y >= meanN, good = it.x >= 60;
        const qd = hi ? (good ? 'Q3' : 'Q2') : (good ? 'Q4' : 'Q1');
        return '<tr><td><b>' + it.letter + '</b></td><td>' + esc(it.label) + '</td><td class="num">' + it.y + '</td><td class="num">' + it.x + '%</td><td class="num hide-sm">' + (inc[it.label] || 0) + '</td><td>' + qd + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    // Assuntos com mais erros
    const weak = {};
    atts.forEach(a => {
      const q = MQ.get('questions', a.qid);
      const path = MQ.qPath(q);
      const key = path.slice(0, Math.min(path.length, 4)).join('>');
      if (!key) return;
      const w = weak[key] || (weak[key] = { key, path, n: 0, err: 0 });
      w.n++; if (!a.correct) w.err++;
    });
    const top = Object.values(weak).filter(w => w.err).sort((a, b) => b.err - a.err || MQ.pct(a.err, a.n) - MQ.pct(b.err, b.n)).slice(0, 8);
    $('#p-weak', root).innerHTML = top.length ? top.map((w, i) =>
      '<li><div><div>' + esc(w.path[w.path.length - 1]) + '</div><div class="path">' + esc(w.path.slice(0, -1).join(' › ')) + '</div></div>' +
      '<span class="small" style="color:var(--err);font-variant-numeric:tabular-nums">' + w.err + ' de ' + w.n + (w.n === 1 ? ' errada' : ' erradas') + '</span>' +
      '<button class="btn sm" data-train="' + i + '">Treinar</button></li>').join('') : '<li class="muted">Nenhum erro no período. Bom sinal.</li>';
    $$('[data-train]', root).forEach(b => b.onclick = () => {
      const w = top[+b.dataset.train];
      MQ.bankFilter = MQ.newFilter();
      MQ.bankFilter.paths = [w.key];
      location.hash = '#/questoes';
    });
  };

  function bucketDays() {
    const p = MQ.perf;
    if (p.period === '7') return 1;
    if (p.period === '30') return 2;
    if (p.period === 'custom') {
      const [a, b] = range();
      return (b - a) / DAY <= 31 ? 1 : 7;
    }
    return 7;
  }
})(window.MQ);
