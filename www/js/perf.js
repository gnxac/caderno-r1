/* Caderno R1 — meu desempenho */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;
  const DAY = 86400000, MIN_WEAK = 5, HEAT_WEEKS = 26;

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

  const dayKeyOf = ts => { const d = new Date(ts); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

  MQ.views.desempenho = function (root) {
    const p = MQ.perf;
    const atts = filteredAttempts();
    const total = atts.length, ok = atts.filter(a => a.correct).length;
    const lists = MQ.alive('lists').sort((a, b) => b.createdAt - a.createdAt);
    const originOpts = '<option value="">Todas as respostas</option><option value="banco"' + (p.origin === 'banco' ? ' selected' : '') + '>Só no banco de questões</option>' +
      lists.map(l => '<option value="' + (l.kind === 'simulado' ? 'sim:' : 'lista:') + l.id + '"' + (p.origin === (l.kind === 'simulado' ? 'sim:' : 'lista:') + l.id ? ' selected' : '') + '>' + (l.kind === 'simulado' ? 'Simulado: ' : 'Lista: ') + esc(l.name) + '</option>').join('');
    const [ra, rb] = range();

    /* números do topo */
    const timed = atts.filter(a => a.timeSec > 0 && a.timeSec <= 600);
    const avgT = timed.length ? timed.reduce((s, a) => s + a.timeSec, 0) / timed.length : 0;
    const days = new Set(atts.map(a => dayKeyOf(a.ts))).size;
    const day0 = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const spanDays = p.period === 'all' || (p.period === 'custom' && !p.from) ? 0 : Math.max(1, Math.round((day0(Math.min(rb, Date.now())) - day0(ra)) / DAY) + 1); // dias de calendário, inclusive hoje
    const kpi = (mk, num, sub) => '<div class="pk"><span class="mk">' + mk + '</span><div class="num">' + num + '</div><span class="st">' + sub + '</span></div>';

    root.innerHTML =
      '<div class="page-head"><div><h1>Desempenho</h1><p>Onde você está acertando, onde precisa voltar e como evolui.</p></div>' +
      '<div class="toolbar"><button class="btn ghost" id="p-more" aria-label="Mais opções">' + icon('more') + '</button></div></div>' +
      '<div class="pf-bar"><label class="pf-f"><span>Período</span><select id="p-period">' + PERIODS.map(([v, l]) => '<option value="' + v + '"' + (p.period === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      (p.period === 'custom' ? '<label class="pf-f"><span>De</span><input type="date" id="p-from" value="' + esc(p.from) + '"></label><label class="pf-f"><span>Até</span><input type="date" id="p-to" value="' + esc(p.to) + '"></label>' : '') +
      '<label class="pf-f"><span>Origem</span><select id="p-origin">' + originOpts + '</select></label></div>' +
      (total ? '' : '<div class="empty"><h2>Sem respostas neste período</h2><p>Responda questões no banco, nas listas ou em simulados. Se você já respondeu, tente um período maior.</p><a class="btn primary" href="#/questoes">Resolver questões</a></div>') +
      (total ? '<div class="pk-row">' +
        kpi('Questões', total.toLocaleString('pt-BR'), ok + ' certas · ' + (total - ok) + ' erradas') +
        kpi('Acerto', MQ.pct(ok, total) + '%', 'cada resposta conta, mesmo ao refazer') +
        kpi('Tempo médio', avgT ? MQ.fmtDuration(avgT) : '–', avgT ? 'por questão, em ' + timed.length + ' respostas' : 'ainda sem tempos gravados') +
        kpi('Dias estudados', days + (spanDays ? '<small>/' + spanDays + '</small>' : '<small> dias</small>'), 'com pelo menos 1 resposta') + '</div>' +
        '<div class="perf-grid">' +
        '<section class="panel span-7"><h2>Evolução</h2><div class="sub">Percentual de acerto por ' + ({ 1: 'dia', 2: 'período de 2 dias' }[bucketDays()] || 'semana') + '</div><div id="p-line"></div></section>' +
        '<section class="panel span-5"><h2>Pontos fracos</h2><div class="sub">Temas com pior acerto (mínimo de ' + MIN_WEAK + ' respostas)</div><ul class="weak-list" id="p-weak"></ul></section>' +
        '<section class="panel span-7"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2>Por grande área</h2><div class="sub" id="p-crumb"></div></div>' +
        '<div class="seg" role="group" aria-label="Visualização"><button data-view="pct" aria-pressed="' + (p.view === 'pct') + '">% de acerto</button><button data-view="total" aria-pressed="' + (p.view === 'total') + '">Total de respostas</button></div></div><div class="bars" id="p-bars"></div></section>' +
        '<section class="panel span-5"><h2>Por instituição</h2><div class="sub">Onde você mais resolve e como vai em cada uma</div><div class="hbars" id="p-inst"></div></section>' +
        '<section class="panel span-7"><h2>Dias estudados</h2><div class="sub">Últimas ' + HEAT_WEEKS + ' semanas, todas as suas respostas</div><div id="p-heat"></div></section>' +
        '<section class="panel span-5"><h2>Simulados</h2><div class="sub">Concluídos no período</div><div id="p-sims"></div></section>' +
        '<section class="panel span-12"><details id="p-focus"><summary><h2 style="display:inline">Onde focar</h2> <span class="sub">bolhas por matéria e tabela</span></summary><div class="sub" style="margin-top:8px">Cada bolha é uma matéria. Tamanho = quantas questões dela existem no seu banco. Clique para detalhar.</div><div id="p-bubble"></div>' +
        '<div class="quad-help"><span><b>Q1</b> poucas questões e acerto baixo: faça mais questões e revise a teoria.</span><span><b>Q2</b> muitas questões e acerto baixo: alerta, volte à teoria.</span><span><b>Q3</b> muitas questões e acerto bom: mantenha o ritmo.</span><span><b>Q4</b> poucas questões e acerto bom: aumente o volume.</span></div><div id="p-table" style="margin-top:12px"></div></details></section>' +
        '<section class="panel span-12 perf-actions"><button class="btn" id="p-wrong-list">Lista com as erradas</button><button class="btn" id="p-wrong-sim">Simulado com as erradas</button></section>' +
        '</div>' : '');

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
    const focus = $('#p-focus', root);
    if (p.focusOpen) focus.open = true;

    // Evolução
    const bd = bucketDays();
    const firstTs = p.period === 'all' ? atts.reduce((m, a) => Math.min(m, a.ts), Infinity) : ra;
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
      return { label: lab, tipLabel: bd === 1 ? lab : bd === 2 ? 'A partir de ' + lab : 'Semana de ' + lab, value: b.n ? MQ.pct(b.ok, b.n) : null, n: b.n };
    }), { label: 'Evolução do percentual de acerto' });

    // Pontos fracos: pior acerto por tema (até 3 níveis), com treino direto
    const wk = new Map();
    atts.forEach(a => {
      const path = MQ.qPath(MQ.get('questions', a.qid)).slice(0, 3);
      if (!path.length) return;
      const k = path.join('>');
      const w = wk.get(k) || { path, n: 0, ok: 0 };
      w.n++; if (a.correct) w.ok++;
      wk.set(k, w);
    });
    const weak = Array.from(wk.values()).filter(w => w.n >= MIN_WEAK && w.ok < w.n).sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n).slice(0, 6);
    $('#p-weak', root).innerHTML = weak.length ? weak.map((w, i) => {
      const pc = MQ.pct(w.ok, w.n);
      return '<li><div><div>' + esc(w.path[w.path.length - 1]) + '</div><div class="path">' + esc(w.path.slice(0, -1).join(' › ')) + ' · ' + w.n + ' respostas</div></div>' +
        '<span class="pct' + (pc < 60 ? ' low' : '') + '">' + pc + '%</span><button class="btn sm" data-train="' + i + '">Treinar 20</button></li>';
    }).join('') : '<li class="muted">Nenhum tema com ' + MIN_WEAK + ' respostas e erros neste período. Bom sinal, ou ainda é cedo.</li>';
    $$('[data-train]', root).forEach(b => b.onclick = () => {
      const w = weak[+b.dataset.train];
      MQ.openSolve({ title: 'Treino: ' + w.path[w.path.length - 1], qids: MQ.trainIds(w.path, 20, MQ.latestByQ()), ctx: 'banco' });
    });

    // Por instituição
    const inst = new Map();
    atts.forEach(a => {
      const q = MQ.get('questions', a.qid), k = (q.instituicao || '').trim() || 'Sem instituição';
      const o = inst.get(k) || { n: 0, ok: 0 };
      o.n++; if (a.correct) o.ok++;
      inst.set(k, o);
    });
    $('#p-inst', root).innerHTML = Array.from(inst).sort((a, b) => b[1].n - a[1].n).slice(0, 8).map(([k, o]) => {
      const pc = MQ.pct(o.ok, o.n);
      return '<div class="hbar"><span>' + esc(k) + ' <span class="muted">· ' + o.n + '</span></span><b>' + pc + '%</b><div class="bar"><i class="' + (pc < 55 ? 'err' : '') + '" style="width:' + pc + '%"></i></div></div>';
    }).join('');

    // Dias estudados e simulados
    $('#p-heat', root).innerHTML = MQ.studyHeat(MQ.attemptDays(), HEAT_WEEKS).html;
    const runs = MQ.alive('runs').filter(r => r.status === 'concluido' && r.finishedAt >= ra && r.finishedAt <= rb).sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 6);
    $('#p-sims', root).innerHTML = runs.length ? runs.map(r => {
      const s = MQ.runScore(r), l = MQ.get('lists', r.listId) || {};
      return '<button class="hm-run" data-run="' + esc(r.id) + '"><span class="hm-rt"><span class="tt">' + esc(l.name || 'Simulado') + '</span><span class="st">' + MQ.fmtDate(r.finishedAt) + ' · ' + s.ok + '/' + s.total + ' · ' + MQ.fmtDuration((r.finishedAt - r.startedAt) / 1000) + '</span></span><b class="pct">' + MQ.pct(s.ok, s.total) + '%</b></button>';
    }).join('') : '<p class="muted">Nenhum simulado concluído neste período.</p>';
    $$('[data-run]', root).forEach(b => b.onclick = () => { location.hash = '#/resultado/' + b.dataset.run; });

    // Por grande área, com detalhamento
    const depth = p.drill.length;
    const groups = sortGroups(groupBy(atts, depth, p.drill), depth);
    $('#p-crumb', root).innerHTML = (depth ? '<button class="btn ghost sm" id="p-up">' + icon('left') + ' Voltar</button> ' : '') +
      esc(depth ? p.drill.join(' › ') : 'Toque numa barra para detalhar') ;
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

    // Bolhas e tabela (seção "Onde focar")
    const inc = bankIncidence(depth, p.drill);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const items = groups.slice(0, 26).map((g, i) => ({
      label: g.name, letter: letters[i], x: MQ.pct(g.ok, g.n), y: g.n, size: inc[g.name] || 1,
      tip: '<b>' + letters[i] + ' · ' + esc(g.name) + '</b><br>' + MQ.pct(g.ok, g.n) + '% de acerto · ' + g.n + ' respostas<br>' + (inc[g.name] || 0) + ' questões no banco',
      aria: g.name + ': ' + MQ.pct(g.ok, g.n) + '% de acerto em ' + g.n + ' respostas',
      onClick: g.deeper ? () => { p.drill.push(g.name); MQ.render(); } : null
    }));
    const meanN = groups.reduce((s, g) => s + g.n, 0) / Math.max(1, groups.length);
    // desenhado só com a seção aberta: fechada, o container tem largura 0 e o SVG sairia no tamanho errado
    const drawBubble = () => MQ.bubbleChart($('#p-bubble', root), items, { xSplit: 60, ySplit: meanN, label: 'Percentual de acerto versus questões resolvidas por matéria' });
    if (p.focusOpen) drawBubble();
    focus.addEventListener('toggle', () => { p.focusOpen = focus.open; if (focus.open) drawBubble(); });
    $('#p-table', root).innerHTML = '<div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>Bolha</th><th>Matéria</th><th class="num">Respostas</th><th class="num">% de acerto</th><th class="num hide-sm">No banco</th><th>Quadrante</th></tr></thead><tbody>' +
      items.map(it => {
        const hi = it.y >= meanN, good = it.x >= 60;
        const qd = hi ? (good ? 'Q3' : 'Q2') : (good ? 'Q4' : 'Q1');
        return '<tr><td><b>' + it.letter + '</b></td><td>' + esc(it.label) + '</td><td class="num">' + it.y + '</td><td class="num">' + it.x + '%</td><td class="num hide-sm">' + (inc[it.label] || 0) + '</td><td>' + qd + '</td></tr>';
      }).join('') + '</tbody></table></div>';
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
