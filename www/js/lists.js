/* Caderno R1 — pastas, listas e simulados */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  MQ.currentFolder = null;

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

  MQ.createListModal = function (qids, defaultName) {
    MQ.modal({
      title: 'Criar lista',
      body: '<label class="field"><span>Nome da lista</span><input type="text" id="l-name" maxlength="100" value="' + esc(defaultName || '') + '" placeholder="Ex.: Cardio — revisão"></label>' +
        '<label class="field"><span>Salvar em</span><select id="l-folder">' + folderOptions(MQ.currentFolder) + '</select></label>' +
        '<p class="muted small">' + qids.length + ' questões entram na lista.</p>',
      actions: [
        { label: 'Cancelar', kind: 'ghost' },
        { label: 'Criar lista', kind: 'primary', onClick: (close, box) => {
          const name = $('#l-name', box).value.trim();
          if (!name) { MQ.toast('Dê um nome para a lista.'); return false; }
          const l = MQ.put('lists', { id: MQ.uid(), kind: 'lista', name, folderId: $('#l-folder', box).value || null, qids: qids.slice() });
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

  MQ.views.listas = function (root) {
    const fid = MQ.currentFolder && MQ.get('folders', MQ.currentFolder) ? MQ.currentFolder : null;
    MQ.currentFolder = fid;
    const show = MQ.local.listShow || (MQ.local.listShow = { pastas: true, listas: true, simulados: true });
    const folders = show.pastas ? MQ.alive('folders').filter(f => (f.parentId || null) === fid).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) : [];
    const lists = MQ.alive('lists').filter(l => (l.folderId || null) === fid)
      .filter(l => (l.kind === 'simulado' ? show.simulados : show.listas))
      .sort((a, b) => b.createdAt - a.createdAt);

    const crumbs = '<nav class="crumbs" aria-label="Pastas"><button data-crumb="">Listas e simulados</button>' +
      folderPath(fid).map(f => '<span class="sep">/</span><button data-crumb="' + f.id + '">' + esc(f.name) + '</button>').join('') + '</nav>';

    const rows = folders.map(f => {
      const nItems = MQ.alive('lists').filter(l => l.folderId === f.id).length + MQ.alive('folders').filter(x => x.parentId === f.id).length;
      return '<tr class="clickable" data-folder="' + f.id + '"><td><span class="name">' + icon('folder') + esc(f.name) + '</span></td>' +
        '<td class="hide-sm">' + MQ.fmtDate(f.createdAt) + '</td><td class="num muted" colspan="4">' + nItems + ' ' + (nItems === 1 ? 'item' : 'itens') + '</td>' +
        '<td class="num"><button class="icon-btn" data-fmenu="' + f.id + '" aria-label="Ações da pasta ' + esc(f.name) + '">' + icon('more') + '</button></td></tr>';
    }).concat(lists.map(l => {
      let status = '', resp = '—', ok = '—', er = '—', total = l.qids.filter(id => MQ.get('questions', id)).length;
      if (l.kind === 'simulado') {
        const run = MQ.activeRun(l.id), last = MQ.lastRun(l.id);
        status = run ? '<span class="badge live">Em andamento</span>' : last ? '<span class="badge done">Concluído</span>' : '<span class="badge">Não iniciado</span>';
        if (last) { const r = MQ.runScore(last); resp = r.resp; ok = r.ok; er = r.resp - r.ok; }
      } else {
        const st = MQ.listStats(l);
        resp = st.resp; ok = st.ok; er = st.err;
      }
      return '<tr class="clickable" data-list="' + l.id + '"><td><span class="name">' + icon(l.kind === 'simulado' ? 'clock' : 'list') + '<span>' + esc(l.name) + (status ? ' ' + status : '') + '</span></span></td>' +
        '<td class="hide-sm">' + MQ.fmtDate(l.createdAt) + '</td><td class="num">' + total + '</td><td class="num hide-sm">' + resp + '</td>' +
        '<td class="num ok">' + ok + '</td><td class="num err">' + er + '</td>' +
        '<td class="num"><button class="icon-btn" data-lmenu="' + l.id + '" aria-label="Ações de ' + esc(l.name) + '">' + icon('more') + '</button></td></tr>';
    }));

    root.innerHTML =
      '<div class="page-head"><div><h1>Listas e simulados</h1><p>Organize suas listas em pastas, refaça só os erros e acompanhe os simulados.</p></div>' +
      '<div class="toolbar"><button class="btn" id="l-show">Exibir ' + icon('down') + '</button><button class="btn primary" id="l-create">' + icon('plus') + ' Criar</button></div></div>' +
      crumbs +
      (rows.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Nome</th><th class="hide-sm">Criação</th><th class="num">Questões</th><th class="num hide-sm">Respondidas</th><th class="num">Certas</th><th class="num">Erradas</th><th><span class="sr">Ações</span></th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'
        : '<div class="empty"><h2>' + (fid ? 'Pasta vazia' : 'Nenhuma lista ainda') + '</h2><p>Filtre questões no banco e use "Criar lista" ou "Criar simulado". Para organizar, crie pastas aqui.</p><a class="btn primary" href="#/questoes">Ir para o banco de questões</a></div>');

    $$('[data-crumb]', root).forEach(b => b.onclick = () => { MQ.currentFolder = b.dataset.crumb || null; MQ.render(); });
    $$('tr[data-folder]', root).forEach(tr => tr.addEventListener('click', e => { if (e.target.closest('button')) return; MQ.currentFolder = tr.dataset.folder; MQ.render(); }));
    $$('tr[data-list]', root).forEach(tr => tr.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      const l = MQ.get('lists', tr.dataset.list);
      if (l.kind === 'simulado') {
        const run = MQ.activeRun(l.id), last = MQ.lastRun(l.id);
        if (!run && last) location.hash = '#/resultado/' + last.id; else MQ.startOrResume(l.id);
      } else MQ.openList(l.id);
    }));
    $$('[data-lmenu]', root).forEach(b => b.onclick = e => { e.stopPropagation(); listMenu(b, MQ.get('lists', b.dataset.lmenu)); });
    $$('[data-fmenu]', root).forEach(b => b.onclick = e => {
      e.stopPropagation();
      const f = MQ.get('folders', b.dataset.fmenu);
      MQ.menu(b, [
        { label: 'Abrir', onClick: () => { MQ.currentFolder = f.id; MQ.render(); } },
        { label: 'Renomear', onClick: () => rename('folders', f) },
        { label: 'Mover para pasta', onClick: () => move('folders', f) },
        '-',
        { label: 'Excluir pasta', danger: true, onClick: () => delFolder(f) }
      ]);
    });
    $('#l-show', root).onclick = e => {
      const lab = (k, t) => (show[k] ? '✓ ' : '  ') + t;
      const tog = k => () => { show[k] = !show[k]; MQ.saveLocal(); MQ.render(); };
      MQ.menu(e.currentTarget, [{ label: lab('pastas', 'Pastas'), onClick: tog('pastas') }, { label: lab('listas', 'Listas'), onClick: tog('listas') }, { label: lab('simulados', 'Simulados'), onClick: tog('simulados') }]);
    };
    $('#l-create', root).onclick = e => MQ.menu(e.currentTarget, [
      { label: 'Nova pasta', onClick: async () => {
        const v = await MQ.prompt('Nova pasta', 'Nome da pasta', '', 'Criar pasta');
        if (v) { MQ.put('folders', { id: MQ.uid(), name: v, parentId: MQ.currentFolder || null }); MQ.render(); }
      } },
      { label: 'Nova lista (escolher questões no banco)', onClick: () => { location.hash = '#/questoes'; MQ.toast('Filtre as questões e clique em "Criar lista".'); } },
      { label: 'Novo simulado (escolher questões no banco)', onClick: () => { location.hash = '#/questoes'; MQ.toast('Filtre as questões e clique em "Criar simulado".'); } }
    ]);
  };
})(window.MQ);
