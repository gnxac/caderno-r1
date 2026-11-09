/* Caderno R1 — meu desempenho: início com 3 análises (evolução diária, questões por área, frequência × desempenho) */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;
  const DAY = 86400000;
  const SERIES_COLORS = ['#2F8FBF', '#E08A00', '#2E9E6B', '#C0457A', '#7A55C9', '#8A6D3B'];

  MQ.perf = { period: 'all', from: '', to: '', origin: '', drill: [], evo: { offset: 0, metric: 'pct', areas: [] }, showTable: false };

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

  function originOk(x) {
    const o = MQ.perf.origin;
    return !o || (o === 'banco' ? (x.ctx === 'banco' || !x.ctx) : x.ctx === o);
  }
  /* Respostas (de questões que ainda existem) no período escolhido */
  function periodAttempts() {
    const [a, b] = range();
    return MQ.alive('attempts').filter(x => x.ts >= a && x.ts <= b && MQ.get('questions', x.qid) && originOk(x));
  }
  const areaOf = q => MQ.qPath(q)[0] || 'Sem classificação';

  function groupBy(atts, depth, prefix) {
    const g = {};
    atts.forEach(a => {
      const path = MQ.qPath(MQ.get('questions', a.qid));
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

  function filtersHtml(withPeriod) {
    const p = MQ.perf;
    const lists = MQ.alive('lists').sort((a, b) => b.createdAt - a.createdAt);
    const key = l => (l.kind === 'simulado' ? 'sim:' : 'lista:') + l.id;
    const originOpts = '<option value="">Todas as respostas</option><option value="banco"' + (p.origin === 'banco' ? ' selected' : '') + '>Só no banco de questões</option>' +
      lists.map(l => '<option value="' + key(l) + '"' + (p.origin === key(l) ? ' selected' : '') + '>' + (l.kind === 'simulado' ? 'Simulado: ' : 'Lista: ') + esc(l.name) + '</option>').join('');
    return '<div class="toolbar perf-filters">' +
      (withPeriod ? '<label class="sr" for="p-period">Período</label><select id="p-period" style="width:auto">' + PERIODS.map(([v, l]) => '<option value="' + v + '"' + (p.period === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
        (p.period === 'custom' ? '<label class="sr" for="p-from">De</label><input type="date" id="p-from" value="' + esc(p.from) + '" style="width:auto"><label class="sr" for="p-to">Até</label><input type="date" id="p-to" value="' + esc(p.to) + '" style="width:auto">' : '') : '') +
      '<label class="sr" for="p-origin">Origem</label><select id="p-origin" style="width:auto;max-width:320px">' + originOpts + '</select></div>';
  }
  function bindFilters(root) {
    const p = MQ.perf;
    if ($('#p-period', root)) $('#p-period', root).onchange = e => { p.period = e.target.value; p.drill = []; MQ.render(); };
    if ($('#p-from', root)) { $('#p-from', root).onchange = e => { p.from = e.target.value; MQ.render(); }; $('#p-to', root).onchange = e => { p.to = e.target.value; MQ.render(); }; }
    $('#p-origin', root).onchange = e => { p.origin = e.target.value; p.drill = []; MQ.render(); };
  }
  function subHead(title, sub) {
    return '<div class="sub-head"><a class="icon-btn" href="#/desempenho" aria-label="Voltar para Meu desempenho">' + icon('arrowleft') + '</a><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>';
  }
  const noData = '<div class="empty"><h2>Sem respostas neste período</h2><p>Responda questões no banco, nas listas ou em simulados. Se você já respondeu, tente um período maior.</p><a class="btn primary" href="#/questoes">Resolver questões</a></div>';

  /* ---------- Início ---------- */
  function home(root) {
    const atts = periodAttempts();
    const total = atts.length, ok = atts.filter(a => a.correct).length;
    root.innerHTML = '<div class="page-head"><div><h1>Meu desempenho</h1><p>Onde você está acertando, onde precisa voltar e como evolui.</p></div>' +
      '<div class="toolbar"><button class="btn ghost" id="p-more" aria-label="Mais opções">' + icon('more') + '</button></div></div>' +
      '<div class="perf-col">' + filtersHtml(true) +
      '<section class="panel perf-sum"><div class="ps-line">Questões resolvidas: <b>' + total.toLocaleString('pt-BR') + '</b> total · <b class="okc">' + ok.toLocaleString('pt-BR') + '</b> corretas · <b class="errc">' + (total - ok).toLocaleString('pt-BR') + '</b> erradas</div>' +
      '<button class="btn primary big" id="p-review">' + icon('timer') + ' Criar simulado de revisão</button>' +
      '<p class="muted small">O simulado de revisão reúne as questões que você errou na última vez em que respondeu.</p></section>' +
      '<a class="perf-card" href="#/desempenho/evolucao"><span class="pc-ic">' + icon('chart') + '</span><span class="pc-t"><b>Evolução diária</b><small>Acertos ou total de questões por dia, por área</small></span>' + icon('right') + '</a>' +
      '<a class="perf-card" href="#/desempenho/areas"><span class="pc-ic">' + icon('list') + '</span><span class="pc-t"><b>Questões respondidas por área</b><small>Quanto você resolveu e quanto acertou em cada área</small></span>' + icon('right') + '</a>' +
      '<a class="perf-card" href="#/desempenho/frequencia"><span class="pc-ic">' + icon('grid') + '</span><span class="pc-t"><b>Frequência e desempenho</b><small>Questões feitas × percentual de acerto, em 4 quadrantes</small></span>' + icon('right') + '</a></div>';
    bindFilters(root);
    $('#p-more', root).onclick = e => MQ.menu(e.currentTarget, [
      { label: 'Excluir todo o histórico de respostas', danger: true, onClick: async () => {
        const okk = await MQ.confirm('Excluir histórico', 'Todas as suas respostas, em todos os aparelhos sincronizados, serão apagadas. Questões, listas e pastas continuam. Não dá para desfazer.', 'Excluir histórico', true);
        if (!okk) return;
        MQ.alive('attempts').forEach(a => MQ.remove('attempts', a.id));
        MQ.toast('Histórico de respostas excluído.'); MQ.render();
      } }
    ]);
    $('#p-review', root).onclick = () => {
      const last = MQ.latestByQ();
      const ids = Object.keys(last).filter(id => !last[id].correct && MQ.get('questions', id));
      if (!ids.length) { MQ.toast('Você não tem questões erradas na última resposta.'); return; }
      MQ.simCreateModal(ids, 'Revisão — ' + MQ.fmtDate(Date.now()));
    };
  }

  /* ---------- Evolução diária ---------- */
  function evolucao(root) {
    const p = MQ.perf, e = p.evo;
    const all = MQ.alive('attempts').filter(x => MQ.get('questions', x.qid) && originOk(x));
    const areaSet = new Set(MQ.AREAS);
    all.forEach(a => areaSet.add(areaOf(MQ.get('questions', a.qid))));
    const areaList = Array.from(areaSet);
    e.areas = e.areas.filter(a => areaList.includes(a));

    const end = new Date(); end.setHours(0, 0, 0, 0);
    end.setTime(end.getTime() - e.offset * 7 * DAY);
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(end.getTime() - i * DAY);
    const series = (e.areas.length ? e.areas : [null]).map((area, i) => {
      const vals = days.map(t => {
        const at = all.filter(a => a.ts >= t && a.ts < t + DAY && (!area || areaOf(MQ.get('questions', a.qid)) === area));
        const ok = at.filter(a => a.correct).length;
        return { n: at.length, ok, v: e.metric === 'pct' ? (at.length ? MQ.pct(ok, at.length) : null) : at.length };
      });
      return { name: area || 'Todas as áreas', color: SERIES_COLORS[i % SERIES_COLORS.length], vals };
    });
    const monthName = new Date(end.getTime()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
    const fmt = t => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    root.innerHTML = subHead('Evolução diária') + '<div class="perf-col">' + filtersHtml(false) +
      '<section class="panel"><h2>Áreas</h2><div class="sub">Escolha as áreas para comparar. Sem nenhuma marcada, mostra todas juntas.</div>' +
      '<div class="chips area-pick">' + areaList.map(a => '<button class="pick' + (e.areas.includes(a) ? ' on' : '') + '" data-area="' + esc(a) + '" aria-pressed="' + e.areas.includes(a) + '">' + esc(a) + '</button>').join('') + '</div>' +
      '<div class="seg" role="group" aria-label="Medida" style="margin-top:12px"><button data-metric="pct" aria-pressed="' + (e.metric === 'pct') + '">Porcentagem de acertos</button><button data-metric="total" aria-pressed="' + (e.metric === 'total') + '">Total de questões</button></div></section>' +
      '<section class="panel"><div class="evo-nav"><button class="btn sm" id="evo-prev">‹ 7 dias anteriores</button><span class="evo-month">' + esc(monthName) + '</span><button class="btn sm" id="evo-next"' + (e.offset === 0 ? ' disabled' : '') + '>Próximos 7 dias ›</button></div>' +
      '<div id="p-line"></div>' +
      '<div class="legend-row">' + series.map(s => '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>').join('') + '</div>' +
      '<div class="table-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Dia</th>' + series.map(s => '<th class="num">' + esc(s.name) + '</th>').join('') + '</tr></thead><tbody>' +
      days.map((t, i) => '<tr><td>' + fmt(t) + '</td>' + series.map(s => '<td class="num">' + (s.vals[i].v == null ? '—' : s.vals[i].v + (e.metric === 'pct' ? '%' : '')) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section></div>';
    bindFilters(root);
    MQ.multiLineChart($('#p-line', root), {
      labels: days.map(fmt), unit: e.metric === 'pct' ? '%' : '', yMax: e.metric === 'pct' ? 100 : null,
      series: series.map(s => ({ name: s.name, color: s.color, values: s.vals.map(x => x.v), tips: s.vals.map(x => x.n ? x.ok + ' certas de ' + x.n + ' (' + MQ.pct(x.ok, x.n) + '%)' : 'Sem questões') })),
      label: 'Evolução diária, ' + (e.metric === 'pct' ? 'porcentagem de acertos' : 'total de questões')
    });
    $$('[data-area]', root).forEach(b => b.onclick = () => { e.areas = e.areas.includes(b.dataset.area) ? e.areas.filter(x => x !== b.dataset.area) : e.areas.concat(b.dataset.area); MQ.render(); });
    $$('[data-metric]', root).forEach(b => b.onclick = () => { e.metric = b.dataset.metric; MQ.render(); });
    $('#evo-prev', root).onclick = () => { e.offset++; MQ.render(); };
    $('#evo-next', root).onclick = () => { e.offset = Math.max(0, e.offset - 1); MQ.render(); };
  }

  /* ---------- Questões respondidas por área ---------- */
  function areas(root) {
    const p = MQ.perf;
    const atts = periodAttempts();
    const depth = p.drill.length;
    const groups = sortGroups(groupBy(atts, depth, p.drill), depth);
    root.innerHTML = subHead('Questões respondidas', depth ? esc(p.drill.join(' › ')) : 'Cada cartão mostra quanto você resolveu e acertou. Toque para detalhar.') + '<div class="perf-col">' + filtersHtml(true) +
      (depth ? '<button class="btn ghost sm" id="p-up" style="align-self:flex-start">' + icon('left') + ' Voltar um nível</button>' : '') +
      (groups.length ? groups.map((g, i) => {
        const pc = MQ.pct(g.ok, g.n);
        const tag = g.deeper ? 'button' : 'div';
        return '<' + tag + ' class="area-card" data-g="' + i + '"><span class="ac-head"><b>' + esc(g.name) + '</b>' + (g.deeper ? icon('right') : '') + '</span>' +
          '<span class="ac-sub">Seu desempenho: ' + g.n.toLocaleString('pt-BR') + (g.n === 1 ? ' questão' : ' questões') + '</span>' +
          '<span class="bar-track" role="img" aria-label="' + pc + '% de acerto"><span class="bar-fill" style="display:block;width:' + pc + '%"></span></span>' +
          '<span class="ac-foot">Acerto de ' + pc + '% das questões <small>(' + g.ok + ' de ' + g.n + ')</small></span></' + tag + '>';
      }).join('') : noData) +
      (atts.length ? '<section class="panel"><h2>Assuntos com mais erros</h2><div class="sub">Considera tema e subtema</div><ul class="weak-list" id="p-weak"></ul></section>' : '') + '</div>';
    bindFilters(root);
    if ($('#p-up', root)) $('#p-up', root).onclick = () => { p.drill.pop(); MQ.render(); };
    $$('button[data-g]', root).forEach(b => b.onclick = () => { p.drill.push(groups[+b.dataset.g].name); MQ.render(); });
    if (!atts.length) return;
    const weak = {};
    atts.forEach(a => {
      const path = MQ.qPath(MQ.get('questions', a.qid));
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
      MQ.bankFilter = MQ.newFilter();
      MQ.bankFilter.paths = [top[+b.dataset.train].key];
      MQ.bankFilter.situacao = ['nao', 'resolvi'];
      location.hash = '#/questoes';
    });
  }

  /* ---------- Frequência e desempenho (quadrantes) ---------- */
  const QUADS = [
    ['Q1', 'Poucas questões resolvidas e baixo desempenho', 'Faça mais questões e revise a teoria.'],
    ['Q2', 'Muitas questões resolvidas e baixo desempenho', 'Alerta: volte à teoria antes de fazer mais questões.'],
    ['Q3', 'Muitas questões resolvidas e bom desempenho', 'Mantenha o ritmo.'],
    ['Q4', 'Poucas questões resolvidas e bom desempenho', 'Aumente o volume de questões.']
  ];
  function frequencia(root) {
    const p = MQ.perf;
    const atts = periodAttempts();
    const depth = p.drill.length;
    const groups = sortGroups(groupBy(atts, depth, p.drill), depth);
    root.innerHTML = subHead('Frequência e desempenho', 'Incidência das matérias no seu banco versus o seu desempenho') + '<div class="perf-col">' + filtersHtml(true) +
      (depth ? '<button class="btn ghost sm" id="p-up" style="align-self:flex-start">' + icon('left') + ' Voltar um nível · ' + esc(p.drill.join(' › ')) + '</button>' : '') +
      (groups.length ? '<section class="panel"><div class="sub">Cada bolha é uma matéria. O tamanho mostra quantas questões dela existem no seu banco. Toque numa bolha para detalhar.</div><div id="p-bubble"></div></section>' +
        '<section class="panel" id="p-quads"></section>' +
        '<div class="toolbar"><button class="btn" id="p-detail">' + (p.showTable ? 'Ocultar detalhes' : 'Ver detalhes') + '</button></div>' +
        (p.showTable ? '<section class="panel"><div id="p-table"></div></section>' : '') : noData) + '</div>';
    bindFilters(root);
    if ($('#p-up', root)) $('#p-up', root).onclick = () => { p.drill.pop(); MQ.render(); };
    if (!groups.length) return;
    const inc = bankIncidence(depth, p.drill);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const items = groups.slice(0, 26).map((g, i) => ({
      label: g.name, letter: letters[i], x: MQ.pct(g.ok, g.n), y: g.n, size: inc[g.name] || 1,
      tip: '<b>' + letters[i] + ' · ' + esc(g.name) + '</b><br>' + MQ.pct(g.ok, g.n) + '% de acerto · ' + g.n + ' respostas<br>' + (inc[g.name] || 0) + ' questões no banco',
      aria: g.name + ': ' + MQ.pct(g.ok, g.n) + '% de acerto em ' + g.n + ' respostas',
      onClick: g.deeper ? () => { p.drill.push(g.name); MQ.render(); } : null
    }));
    const meanN = groups.reduce((s, g) => s + g.n, 0) / Math.max(1, groups.length);
    const quadOf = it => (it.y >= meanN ? (it.x >= 60 ? 'Q3' : 'Q2') : (it.x >= 60 ? 'Q4' : 'Q1'));
    MQ.bubbleChart($('#p-bubble', root), items, { xSplit: 60, ySplit: meanN, label: 'Percentual de acerto versus questões resolvidas por matéria' });
    $('#p-quads', root).innerHTML = QUADS.map(([q, t, d]) => {
      const inQ = items.filter(it => quadOf(it) === q);
      return '<details class="quad"><summary><b>Quadrante ' + q.slice(1) + '</b><span>' + t + '</span></summary><p>' + d + '</p>' +
        (inQ.length ? '<ul>' + inQ.map(it => '<li><b>' + it.letter + '</b> ' + esc(it.label) + ' · ' + it.x + '% de acerto · ' + it.y + ' respostas</li>').join('') + '</ul>' : '<p class="muted small">Nenhuma matéria aqui.</p>') + '</details>';
    }).join('');
    $('#p-detail', root).onclick = () => { p.showTable = !p.showTable; MQ.render(); };
    if (p.showTable) {
      $('#p-table', root).innerHTML = '<div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>Bolha</th><th>Matéria</th><th class="num">Respostas</th><th class="num">% de acerto</th><th class="num hide-sm">No banco</th><th>Quadrante</th></tr></thead><tbody>' +
        items.map(it => '<tr><td><b>' + it.letter + '</b></td><td>' + esc(it.label) + '</td><td class="num">' + it.y + '</td><td class="num">' + it.x + '%</td><td class="num hide-sm">' + (inc[it.label] || 0) + '</td><td>' + quadOf(it) + '</td></tr>').join('') + '</tbody></table></div>';
    }
  }

  MQ.views.desempenho = function (root, arg) {
    ({ evolucao, areas, frequencia }[arg] || home)(root);
  };
})(window.MQ);
