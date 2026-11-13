/* Caderno R1 — pastas, listas e simulados */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  /* Pasta aberta em Listas: '__all' (todas, padrão), '__smart' (inteligentes), null (sem pasta) ou o id de uma pasta */
  MQ.currentFolder = '__all';
  const realFolder = () => (MQ.currentFolder && MQ.get('folders', MQ.currentFolder) ? MQ.currentFolder : null);

  function folderPath(id) {
    const out = [];
    let f = id && MQ.get('folders', id);
    let guard = 0;
    while (f && guard++ < 50) { out.unshift(f); f = f.parentId && MQ.get('folders', f.parentId); }
    return out;
  }
  function folderOptions(selected, excludeId) {
    const all = MQ.alive('folders');
    const opts = ['<option value="">Raiz (Listas e simulados)</option>'];
    function walk(parentId, depth) {
      all.filter(f => (f.parentId || null) === parentId).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).forEach(f => {
        if (f.id === excludeId) return;
        opts.push('<option value="' + f.id + '"' + (f.id === selected ? ' selected' : '') + '>' + ' '.repeat(depth + 1) + esc(f.name) + '</option>');
        walk(f.id, depth + 1);
      });
    }
    walk(null, 0);
    return opts.join('');
  }
  MQ.folderOptions = folderOptions;

  /* Estatísticas de uma lista: respostas dadas dentro dela (desde o último "recomeçar") */
  MQ.listStats = function (l) {
    const latest = {};
    MQ.alive('attempts').forEach(a => {
      if (a.ctx !== 'lista:' + l.id) return;
      if (l.resetAt && a.ts <= l.resetAt) return;
      const c = latest[a.qid];
      if (!c || a.ts > c.ts) latest[a.qid] = a;
    });
    let resp = 0, ok = 0;
    const qids = l.qids.filter(id => MQ.get('questions', id));
    qids.forEach(id => { const a = latest[id]; if (a) { resp++; if (a.correct) ok++; } });
    return { total: qids.length, resp, ok, err: resp - ok, latest };
  };

  /* Lista inteligente: guarda o filtro e recalcula as questões ao abrir Listas ou a própria lista.
     shortcut: com filtro "Que não resolvi" a lista encolhe conforme você responde; o ponto de "continuar" é o índice e pode pular uma questão. */
  MQ.refreshSmart = function () {
    MQ.alive('lists').filter(l => l.filter).forEach(l => {
      if ('conf' in l.filter) { delete l.filter.conf; MQ.put('lists', l); } // filtro removido do app
      const ids = MQ.sortQuestions(MQ.filterQuestions(Object.assign(MQ.newFilter(), l.filter))).map(q => q.id);
      if (JSON.stringify(ids) !== JSON.stringify(l.qids)) { l.qids = ids; MQ.put('lists', l); }
    });
  };

  MQ.createListModal = function (qids, defaultName, filter) {
    MQ.modal({
      title: filter ? 'Criar lista inteligente' : 'Criar lista',
      body: '<label class="field"><span>Nome da lista</span><input type="text" id="l-name" maxlength="100" value="' + esc(defaultName || '') + '" placeholder="Ex.: Cardio — revisão"></label>' +
        '<label class="field"><span>Salvar em</span><select id="l-folder">' + folderOptions(realFolder()) + '</select></label>' +
        '<p class="muted small">' + qids.length + ' questões entram na lista' + (filter ? '. Ela guarda o filtro e se atualiza sozinha quando você abrir Listas.' : '.') + '</p>',
      actions: [
        { label: 'Cancelar', kind: 'ghost' },
        { label: filter ? 'Criar lista inteligente' : 'Criar lista', kind: 'primary', onClick: (close, box) => {
          const name = $('#l-name', box).value.trim();
          if (!name) { MQ.toast('Dê um nome para a lista.'); return false; }
          MQ.local.listTab = 'listas'; MQ.saveLocal(); // a lista nova precisa aparecer
          const l = MQ.put('lists', Object.assign({ id: MQ.uid(), kind: 'lista', name, folderId: $('#l-folder', box).value || null, qids: qids.slice() }, filter ? { filter } : {}));
          MQ.toast('Lista "' + name + '" criada.');
          MQ.currentFolder = l.folderId;
          setTimeout(() => {
            MQ.confirm('Lista criada', 'Quer começar a resolver agora?', 'Resolver agora').then(ok => { if (ok) MQ.openList(l.id); else location.hash = '#/listas'; });
          }, 50);
        } }
      ]
    });
  };

  function duplicate(l, mode) {
    const st = MQ.listStats(l);
    let ids = l.qids.filter(id => MQ.get('questions', id));
    const label = { all: '', erros: ' (erros)', acertos: ' (acertos)', nao: ' (não respondidas)', resp: ' (respondidas)' }[mode];
    if (mode === 'erros') ids = ids.filter(id => st.latest[id] && !st.latest[id].correct);
    if (mode === 'acertos') ids = ids.filter(id => st.latest[id] && st.latest[id].correct);
    if (mode === 'nao') ids = ids.filter(id => !st.latest[id]);
    if (mode === 'resp') ids = ids.filter(id => st.latest[id]);
    if (!ids.length) { MQ.toast('Nenhuma questão nessa condição.'); return; }
    MQ.put('lists', { id: MQ.uid(), kind: 'lista', name: l.name + label, folderId: l.folderId || null, qids: ids });
    MQ.toast('Lista duplicada com ' + ids.length + (ids.length === 1 ? ' questão.' : ' questões.'));
    MQ.render();
  }

  async function rename(coll, obj) {
    const v = await MQ.prompt('Renomear', 'Novo nome', obj.name, 'Renomear');
    if (!v) return;
    obj.name = v; MQ.put(coll, obj); MQ.render();
  }
  function move(coll, obj) {
    MQ.modal({
      title: 'Mover "' + obj.name + '"',
      body: '<label class="field"><span>Mover para</span><select id="mv">' + folderOptions(coll === 'folders' ? obj.parentId : obj.folderId, coll === 'folders' ? obj.id : null) + '</select></label>',
      actions: [{ label: 'Cancelar', kind: 'ghost' }, { label: 'Mover', kind: 'primary', onClick: (c, box) => {
        const to = $('#mv', box).value || null;
        if (coll === 'folders') {
          if (to && folderPath(to).some(f => f.id === obj.id)) { MQ.toast('Não dá para mover uma pasta para dentro dela mesma.'); return false; }
          obj.parentId = to;
        } else obj.folderId = to;
        MQ.put(coll, obj); MQ.render();
      } }]
    });
  }
  async function delFolder(f) {
    const ok = await MQ.confirm('Excluir pasta', 'A pasta "' + f.name + '" será excluída. O que estiver dentro dela vai para a pasta acima.', 'Excluir pasta', true);
    if (!ok) return;
    MQ.alive('folders').filter(x => x.parentId === f.id).forEach(x => { x.parentId = f.parentId || null; MQ.put('folders', x); });
    MQ.alive('lists').filter(x => x.folderId === f.id).forEach(x => { x.folderId = f.parentId || null; MQ.put('lists', x); });
    MQ.remove('folders', f.id); MQ.render();
  }
  async function delList(l) {
    const ok = await MQ.confirm('Excluir ' + (l.kind === 'simulado' ? 'simulado' : 'lista'), '"' + l.name + '" será excluído. Suas respostas continuam contando no desempenho.', 'Excluir', true);
    if (!ok) return;
    MQ.remove('lists', l.id); MQ.render();
  }

  function listMenu(anchor, l) {
    if (l.kind === 'simulado') {
      const run = MQ.activeRun(l.id), last = MQ.lastRun(l.id);
      MQ.menu(anchor, [
        { label: run ? 'Continuar simulado' : 'Iniciar simulado', onClick: () => MQ.startOrResume(l.id) },
        { label: 'Ver resultado', disabled: !last, onClick: () => { location.hash = '#/resultado/' + last.id; } },
        '-',
        { label: 'Duplicar como lista de estudo', onClick: () => { MQ.put('lists', { id: MQ.uid(), kind: 'lista', name: l.name + ' (lista)', folderId: l.folderId || null, qids: l.qids.slice() }); MQ.toast('Lista criada.'); MQ.render(); } },
        { label: 'Renomear', onClick: () => rename('lists', l) },
        { label: 'Mover para pasta', onClick: () => move('lists', l) },
        '-',
        { label: 'Excluir simulado', danger: true, onClick: () => delList(l) }
      ]);
      return;
    }
    MQ.menu(anchor, [
      { label: 'Resolver', onClick: () => MQ.openList(l.id) },
      { label: 'Criar simulado a partir desta lista', onClick: () => MQ.simCreateModal(l.qids.filter(id => MQ.get('questions', id)), l.name + ' — simulado') },
      '-',
      { label: 'Duplicar lista toda', onClick: () => duplicate(l, 'all') },
      { label: 'Duplicar apenas com os erros', onClick: () => duplicate(l, 'erros') },
      { label: 'Duplicar apenas com os acertos', onClick: () => duplicate(l, 'acertos') },
      { label: 'Duplicar apenas com não respondidas', onClick: () => duplicate(l, 'nao') },
      { label: 'Duplicar apenas com já respondidas', onClick: () => duplicate(l, 'resp') },
      '-',
      { label: 'Recomeçar (zerar contagem da lista)', onClick: async () => {
        const ok = await MQ.confirm('Recomeçar lista', 'A contagem de respondidas desta lista volta a zero. Seu histórico no desempenho é mantido.', 'Recomeçar');
        if (ok) { l.resetAt = MQ.now(); MQ.put('lists', l); if (MQ.local.progress) delete MQ.local.progress[l.id]; MQ.saveLocal(); MQ.render(); }
      } },
      { label: 'Renomear', onClick: () => rename('lists', l) },
      { label: 'Mover para pasta', onClick: () => move('lists', l) },
      '-',
      { label: 'Excluir lista', danger: true, onClick: () => delList(l) }
    ]);
  }

  /* ---------- Tela Listas: segmento Listas | Simulados, pastas, cartões com progresso, detalhe no PC ---------- */
  const ALL = '__all', SMART = '__smart';
  let selId = null, provasAll = false;
  const tabNow = () => (MQ.local.listTab === 'simulados' ? 'simulados' : 'listas');
  const sortNow = () => MQ.local.listSort || 'recentes';
  const scopeNow = () => (MQ.currentFolder === undefined ? ALL : MQ.currentFolder);
  const inTab = l => (tabNow() === 'simulados') === (l.kind === 'simulado');
  const inScope = l => { const sc = scopeNow(); return sc === ALL ? true : sc === SMART ? !!l.filter : sc === null ? !l.folderId : l.folderId === sc; };
  const wide = () => window.innerWidth >= 1200;

  /* Números de uma lista (ou do último resultado de um simulado) */
  function info(l) {
    const total = l.qids.filter(id => MQ.get('questions', id)).length;
    if (l.kind === 'simulado') {
      const run = MQ.activeRun(l.id), last = MQ.lastRun(l.id);
      const r = last ? MQ.runScore(last) : null;
      return { total, resp: r ? r.resp : 0, ok: r ? r.ok : 0, err: r ? r.resp - r.ok : 0, run, last, st: null };
    }
    const st = MQ.listStats(l);
    return { total, resp: st.resp, ok: st.ok, err: st.err, st };
  }
  const acc = n => (n.resp ? MQ.pct(n.ok, n.resp) : -1);
  const done = n => (n.total ? MQ.pct(n.resp, n.total) : 0);

  function sortLists(items) {
    const by = sortNow();
    const arr = items.map(l => ({ l, n: info(l) }));
    arr.sort((x, y) => by === 'nome' ? x.l.name.localeCompare(y.l.name, 'pt-BR')
      : by === 'progresso' ? done(y.n) - done(x.n)
      : by === 'acerto' ? acc(y.n) - acc(x.n)
      : (y.l.createdAt || 0) - (x.l.createdAt || 0));
    return arr;
  }

  function openItem(l) {
    if (l.kind === 'simulado') {
      const run = MQ.activeRun(l.id), last = MQ.lastRun(l.id);
      if (!run && last) location.hash = '#/resultado/' + last.id; else MQ.startOrResume(l.id);
    } else MQ.openList(l.id);
  }
  function actionLabel(l, n) {
    if (l.kind === 'simulado') return n.run ? 'Continuar' : n.last ? 'Ver resultado' : 'Iniciar';
    return !n.resp ? 'Resolver' : n.resp < n.total ? 'Continuar' : 'Revisar';
  }
  const bar = n => '<div class="lbar" role="img" aria-label="' + n.ok + ' certas, ' + n.err + ' erradas, de ' + n.total + ' questões"><i class="ok" style="width:' + MQ.pct(n.ok, n.total) + '%"></i><i class="err" style="width:' + MQ.pct(n.err, n.total) + '%"></i></div>';

  function card(l, n, sel) {
    const folder = l.folderId && MQ.get('folders', l.folderId);
    let badge = '';
    if (l.filter) badge = '<span class="badge">' + icon('bolt') + 'Inteligente</span>';
    if (l.kind === 'simulado') badge = n.run ? '<span class="badge live">Em andamento</span>' : n.last ? '<span class="badge done">Concluído</span>' : '<span class="badge">Não iniciado</span>';
    const a = acc(n);
    return '<article class="lcard' + (sel ? ' sel' : '') + '" data-list="' + esc(l.id) + '">' +
      '<div class="lc-top"><button class="lc-name" aria-label="' + esc(l.name) + (wide() ? ', ver detalhes' : ', abrir') + '">' + icon(l.kind === 'simulado' ? 'clock' : l.filter ? 'bolt' : 'list') + '<b>' + esc(l.name) + '</b></button>' +
      '<button class="icon-btn" data-lmenu="' + esc(l.id) + '" aria-label="Ações de ' + esc(l.name) + '">' + icon('more') + '</button></div>' +
      '<div class="st">' + n.total + (n.total === 1 ? ' questão' : ' questões') + (folder ? ' · ' + esc(folder.name) : '') + '</div>' + (badge ? '<div>' + badge + '</div>' : '') +
      bar(n) +
      '<div class="lc-foot"><span class="st">' + (l.kind === 'simulado' ? (n.last ? 'Nota ' + MQ.pct(n.ok, n.total) + '%' : 'Sem tentativa') : done(n) + '% feito') + '</span>' +
      (l.kind === 'simulado' ? '' : '<span class="pct' + (a >= 0 && a < 60 ? ' low' : '') + '">' + (a >= 0 ? a + '% acerto' : '–') + '</span>') + '</div>' +
      '<button class="btn sm primary" data-act="open" data-id="' + esc(l.id) + '">' + icon('play') + actionLabel(l, n) + '</button></article>';
  }

  /* Caderno de erros: filtro automático (não é uma lista salva) */
  function errosIds() {
    return MQ.sortQuestions(MQ.filterQuestions(Object.assign(MQ.newFilter(), { situacao: ['resolvi'], erros: true }))).map(q => q.id);
  }
  function errosCard(ids) {
    return '<article class="lcard lc-erros"><div class="lc-top"><span class="lc-name">' + icon('target') + '<b>Caderno de erros</b></span></div>' +
      '<div class="st">' + ids.length + (ids.length === 1 ? ' questão' : ' questões') + ' · automático</div><div><span class="badge err">Automática</span></div>' +
      '<div class="st">Questões cuja última resposta foi errada. Saem daqui quando você acerta.</div>' +
      '<button class="btn sm primary" data-act="erros"' + (ids.length ? '' : ' disabled') + '>' + icon('play') + 'Revisar</button></article>';
  }

  function detail(l, n) {
    if (!l) return '<div class="lc-detail"><div class="mk">Detalhe</div><div class="st">Escolha uma ' + (tabNow() === 'simulados' ? 'simulado' : 'lista') + ' para ver o progresso e as ações.</div></div>';
    const folder = l.folderId && MQ.get('folders', l.folderId);
    const a = acc(n), blank = Math.max(0, n.total - n.resp);
    let topics = '';
    if (n.st) {
      const g = new Map();
      l.qids.forEach(id => {
        const q = MQ.get('questions', id), at = n.st.latest[id];
        if (!q || !at) return;
        const p = MQ.qPath(q), k = p[2] || p[1] || p[0] || 'Sem assunto';
        const o = g.get(k) || { n: 0, ok: 0 };
        o.n++; if (at.correct) o.ok++;
        g.set(k, o);
      });
      const top = Array.from(g).sort((x, y) => y[1].n - x[1].n).slice(0, 4);
      if (top.length) topics = '<div class="mk" style="margin-top:4px">Acerto por tema</div><div class="hbars">' + top.map(([k, o]) => {
        const p = MQ.pct(o.ok, o.n);
        return '<div class="hbar"><span>' + esc(k) + ' <span class="muted">· ' + o.n + '</span></span><b>' + p + '%</b><div class="bar"><i class="' + (p < 55 ? 'err' : '') + '" style="width:' + p + '%"></i></div></div>';
      }).join('') + '</div>';
    }
    const prog = (MQ.local.progress || {})[l.id] || 0;
    return '<div class="lc-detail"><div class="mk">' + (l.kind === 'simulado' ? 'Simulado selecionado' : 'Lista selecionada') + '</div>' +
      '<div class="lc-dtitle">' + esc(l.name) + '</div><div class="st">' + (folder ? 'Pasta ' + esc(folder.name) + ' · ' : '') + 'criada em ' + MQ.fmtDate(l.createdAt) + '</div>' +
      '<div class="row sb"><span class="st">' + n.resp + ' de ' + n.total + (l.kind === 'simulado' ? ' respondidas na última prova' : ' respondidas') + '</span><b class="num">' + done(n) + '%</b></div>' + bar(n) +
      '<div class="row sb"><span class="st">' + n.ok + ' certas · ' + n.err + ' erradas · ' + blank + ' em branco</span><span class="pct' + (a >= 0 && a < 60 ? ' low' : '') + '">' + (a >= 0 ? a + '%' : '–') + '</span></div>' +
      '<button class="btn primary big" data-act="open" data-id="' + esc(l.id) + '">' + icon('play') + (l.kind === 'simulado' ? actionLabel(l, n) : (n.resp && n.resp < n.total ? 'Continuar da ' + Math.min(prog + 1, n.total) : actionLabel(l, n))) + '</button>' +
      (l.kind === 'simulado' ? '' : '<div class="row"><button class="btn sm" data-act="redo" data-id="' + esc(l.id) + '"' + (n.err ? '' : ' disabled') + '>Refazer erradas</button><button class="btn sm" data-act="sim" data-id="' + esc(l.id) + '">Criar simulado</button></div>') +
      topics + '</div>';
  }

  function folderNav() {
    const items = MQ.alive('lists').filter(inTab), sc = scopeNow();
    const cnt = f => items.filter(l => (l.folderId || null) === f).length;
    const rows = [[ALL, 'Todas', items.length, 'list', 0, true]];
    if (tabNow() === 'listas') rows.push([SMART, 'Inteligentes', items.filter(l => l.filter).length, 'bolt', 0, true]);
    rows.push(['root', 'Sem pasta', cnt(null), 'folder', 0, true]);
    (function walk(pid, d) {
      MQ.alive('folders').filter(f => (f.parentId || null) === pid).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).forEach(f => { rows.push([f.id, f.name, cnt(f.id), 'folder', d, false]); walk(f.id, d + 1); });
    })(null, 0);
    return rows.map(([id, label, n, ic, d, fixed]) => {
      const on = id === 'root' ? sc === null : sc === id;
      return '<div class="lst-f' + (on ? ' on' : '') + '" style="--d:' + d + '"><button class="lst-fb" data-folder="' + esc(id) + '" aria-pressed="' + on + '">' + icon(ic) + '<span>' + esc(label) + '</span><em>' + n + '</em></button>' +
        (fixed ? '' : '<button class="icon-btn" data-fmenu="' + esc(id) + '" aria-label="Ações da pasta ' + esc(label) + '">' + icon('more') + '</button>') + '</div>';
    }).join('');
  }

  function provasSection() {
    const ps = MQ.provaPresets ? MQ.provaPresets() : [];
    if (!ps.length) return '';
    const list = provasAll ? ps : ps.slice(0, 4);
    return '<section class="lst-provas" aria-label="Provas por instituição"><div class="mk">Provas por instituição</div><div class="lgrid2">' +
      list.map((p, i) => '<article class="lcard"><div class="lc-top"><span class="lc-name">' + icon('timer') + '<b>' + esc(p.instituicao) + ' ' + esc(p.ano) + '</b></span></div>' +
        '<div class="st">' + p.count + ' questões · ' + MQ.fmtDuration(p.minutes * 60) + ' de prova</div><button class="btn sm" data-prova="' + i + '">Fazer prova</button></article>').join('') +
      '</div>' + (ps.length > 4 ? '<button class="btn ghost sm" data-act="provas">' + (provasAll ? 'Mostrar menos' : 'Mostrar todas (' + ps.length + ')') + '</button>' : '') + '</section>';
  }

  MQ.views.listas = function (root) {
    MQ.refreshSmart();
    if (MQ.currentFolder !== undefined && MQ.currentFolder !== null && MQ.currentFolder !== ALL && MQ.currentFolder !== SMART && !MQ.get('folders', MQ.currentFolder)) MQ.currentFolder = ALL; // pasta que não existe mais
    const tab = tabNow();
    const visible = sortLists(MQ.alive('lists').filter(l => inTab(l) && inScope(l)));
    if (!selId || !visible.some(v => v.l.id === selId)) selId = visible.length ? visible[0].l.id : null;
    const selItem = visible.find(v => v.l.id === selId);
    const erros = tab === 'listas' && scopeNow() === ALL ? errosIds() : null;
    const sortLabel = { recentes: 'Recentes', nome: 'Nome', progresso: 'Progresso', acerto: 'Acerto' }[sortNow()];
    const cards = (erros ? errosCard(erros) : '') + visible.map(v => card(v.l, v.n, wide() && v.l.id === selId)).join('');

    root.innerHTML = '<div class="lst">' +
      '<header class="lst-head"><div class="lst-title"><h1>' + (tab === 'listas' ? 'Listas' : 'Simulados') + '</h1>' +
      '<div class="seg" role="group" aria-label="Tipo"><button data-tab="listas" aria-pressed="' + (tab === 'listas') + '">Listas</button><button data-tab="simulados" aria-pressed="' + (tab === 'simulados') + '">Simulados</button></div></div>' +
      '<div class="toolbar"><button class="btn" id="l-sort">' + icon('sort') + ' ' + sortLabel + '</button><button class="btn primary" id="l-create">' + icon('plus') + ' Criar</button></div></header>' +
      '<nav class="lst-folders" aria-label="Pastas">' + folderNav() + '</nav>' +
      '<div class="lst-main">' + (tab === 'simulados' ? provasSection() : '') +
      (cards ? '<div class="lgrid2">' + cards + '</div>' : '<div class="empty"><h2>' + (tab === 'simulados' ? 'Nenhum simulado aqui' : 'Nenhuma lista aqui') + '</h2><p>Filtre questões no banco e use "Criar lista" ou "Criar simulado". Para organizar, crie pastas.</p><a class="btn primary" href="#/questoes">Ir para o banco de questões</a></div>') + '</div>' +
      '<aside class="lst-detail" aria-label="Detalhe">' + detail(selItem && selItem.l, selItem && selItem.n) + '</aside></div>';

    const onChip = root.querySelector('.lst-f.on'); // no celular a faixa de pastas rola até a pasta aberta
    if (onChip && !wide()) onChip.scrollIntoView({ inline: 'center', block: 'nearest' });

    root.onclick = async e => {
      const t = e.target;
      const tabB = t.closest('[data-tab]');
      if (tabB) { MQ.local.listTab = tabB.dataset.tab; MQ.saveLocal(); selId = null; if (scopeNow() === SMART && tabB.dataset.tab === 'simulados') MQ.currentFolder = ALL; MQ.render(); return; }
      const fm = t.closest('[data-fmenu]');
      if (fm) { folderMenu(fm, MQ.get('folders', fm.dataset.fmenu)); return; }
      const fb = t.closest('[data-folder]');
      if (fb) { MQ.currentFolder = fb.dataset.folder === 'root' ? null : fb.dataset.folder; selId = null; MQ.render(); return; }
      const lm = t.closest('[data-lmenu]');
      if (lm) { listMenu(lm, MQ.get('lists', lm.dataset.lmenu)); return; }
      const act = t.closest('[data-act]');
      if (act) {
        const a = act.dataset.act, l = act.dataset.id && MQ.get('lists', act.dataset.id);
        if (a === 'open' && l) openItem(l);
        else if (a === 'erros') MQ.openSolve({ title: 'Caderno de erros', qids: errosIds(), ctx: 'banco' });
        else if (a === 'redo' && l) duplicate(l, 'erros');
        else if (a === 'sim' && l) MQ.simCreateModal(l.qids.filter(id => MQ.get('questions', id)), l.name + ' — simulado');
        else if (a === 'provas') { provasAll = !provasAll; MQ.render(); }
        return;
      }
      const pv = t.closest('[data-prova]');
      if (pv) { MQ.provaDialog(MQ.provaPresets()[+pv.dataset.prova]); return; }
      const c = t.closest('[data-list]');
      if (c) { const l = MQ.get('lists', c.dataset.list); if (!l) return; if (wide()) { selId = l.id; MQ.render(); } else openItem(l); }
    };
    $('#l-sort', root).onclick = e => MQ.menu(e.currentTarget, [['recentes', 'Recentes'], ['nome', 'Nome'], ['progresso', 'Progresso'], ['acerto', 'Acerto']].map(([k, label]) => ({ label: (sortNow() === k ? '✓ ' : '   ') + label, onClick: () => { MQ.local.listSort = k; MQ.saveLocal(); MQ.render(); } })));
    $('#l-create', root).onclick = e => MQ.menu(e.currentTarget, [
      { label: 'Nova pasta', onClick: async () => {
        const v = await MQ.prompt('Nova pasta', 'Nome da pasta', '', 'Criar pasta');
        if (v) { MQ.put('folders', { id: MQ.uid(), name: v, parentId: realFolder() }); MQ.render(); }
      } },
      { label: 'Nova lista (escolher questões no banco)', onClick: () => { location.hash = '#/questoes'; MQ.toast('Filtre as questões e clique em "Criar lista".'); } },
      { label: 'Novo simulado (escolher questões no banco)', onClick: () => { location.hash = '#/questoes'; MQ.toast('Filtre as questões e clique em "Criar simulado".'); } }
    ]);
  };

  function folderMenu(anchor, f) {
    if (!f) return;
    MQ.menu(anchor, [
      { label: 'Renomear', onClick: () => rename('folders', f) },
      { label: 'Mover para pasta', onClick: () => move('folders', f) },
      '-',
      { label: 'Excluir pasta', danger: true, onClick: () => delFolder(f) }
    ]);
  }
})(window.MQ);
