/* Caderno R1 — banco de questões: filtros (uma página por filtro) e busca */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  /* Filtros de valor simples: f[key] é uma lista de valores escolhidos */
  const FIELDS = [
    { key: 'instituicao', label: 'Instituição' },
    { key: 'ano', label: 'Ano' },
    { key: 'uf', label: 'Região' },
    { key: 'finalidade', label: 'Finalidade' },
    { key: 'banca', label: 'Banca' }
  ];
  const FILTER_LIST = [['assunto', 'Assunto'], ['instituicao', 'Instituição'], ['ano', 'Ano'], ['uf', 'Região'], ['finalidade', 'Finalidade'], ['banca', 'Banca']];
  const UF_NAMES = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
  const SIT_LABEL = { nao: 'Que não resolvi', resolvi: 'Que já resolvi', acertei: 'Que acertei', errei: 'Que errei' };

  MQ.newFilter = function () {
    const f = { paths: [], situacao: ['nao'], tipos: ['multipla', 'certoerrado'], comCom: true, semCom: true, anuladas: false, desatualizadas: false, texto: '' };
    FIELDS.forEach(x => { f[x.key] = []; });
    return f;
  };
  MQ.bankFilter = MQ.newFilter();

  function pathKey(q) { return MQ.qPath(q).join('>'); }
  function isNational(q) {
    return String(q.uf || '').toUpperCase() === 'BR' || /\b(enare|enamed|revalida)\b/i.test(q.instituicao || '');
  }

  MQ.matchQuestion = function (q, f, latest) {
    if (f.paths.length) {
      const p = pathKey(q);
      if (!f.paths.some(s => p === s || p.startsWith(s + '>'))) return false;
    }
    for (const x of FIELDS) {
      const sel = f[x.key];
      if (!sel || !sel.length) continue;
      const ok = x.key === 'uf'
        ? sel.some(t => t === 'BR' ? isNational(q) : String(q.uf || '').toUpperCase() === t)
        : sel.includes(String(q[x.key] == null ? '' : q[x.key]));
      if (!ok) return false;
    }
    if (!f.anuladas && q.anulada) return false;
    if (!f.desatualizadas && q.desatualizada) return false;
    if (f.tipos.length && !f.tipos.includes(q.tipo || 'multipla')) return false;
    if ((q.comentario || '').trim() ? f.comCom === false : f.semCom === false) return false;
    if (f.situacao.length) {
      const a = latest[q.id];
      const st = !a ? 'nao' : (a.correct ? 'acertei' : 'errei');
      const ok = f.situacao.some(s => s === st || (s === 'resolvi' && a));
      if (!ok) return false;
    }
    if (f.texto) {
      const t = MQ.norm(f.texto);
      const hay = MQ.norm([q.codigo, q.enunciado, q.comentario, (q.alternativas || []).map(a => a.t).join(' ')].join(' '));
      if (!hay.includes(t)) return false;
    }
    return true;
  };

  MQ.filterQuestions = function (f) {
    const latest = MQ.latestByQ();
    return MQ.alive('questions').filter(q => MQ.matchQuestion(q, f, latest));
  };

  MQ.sortQuestions = function (qs) {
    const order = MQ.AREAS;
    return qs.slice().sort((a, b) => {
      const ia = order.indexOf(a.area), ib = order.indexOf(b.area);
      if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return pathKey(a).localeCompare(pathKey(b), 'pt-BR') || (a.createdAt - b.createdAt);
    });
  };

  /* ---------- Árvores de opções de cada filtro ---------- */
  function buildTree(qs) {
    const root = { children: new Map(), count: 0 };
    qs.forEach(q => {
      let node = root, key = '';
      MQ.qPath(q).forEach(p => {
        key = key ? key + '>' + p : p;
        if (!node.children.has(p)) node.children.set(p, { name: p, key, children: new Map(), count: 0 });
        node = node.children.get(p);
        node.count++;
      });
    });
    return root;
  }
  function findNode(root, key) {
    let node = root;
    for (const p of key.split('>')) { node = node.children.get(p); if (!node) return null; }
    return node;
  }
  /* Marca/desmarca um assunto; marcar um filho de um pai marcado desmarca o pai e marca os irmãos */
  function togglePath(paths, key, root) {
    paths = paths.slice();
    const i = paths.indexOf(key);
    if (i >= 0) { paths.splice(i, 1); return paths; }
    const anc = paths.find(s => key.startsWith(s + '>'));
    if (anc) {
      paths.splice(paths.indexOf(anc), 1);
      const parts = key.split('>');
      for (let d = anc.split('>').length; d < parts.length; d++) {
        const parent = findNode(root, parts.slice(0, d).join('>'));
        if (!parent) continue;
        parent.children.forEach(ch => { if (ch.name !== parts[d]) paths.push(ch.key); });
      }
      return paths;
    }
    paths = paths.filter(s => !s.startsWith(key + '>'));
    paths.push(key);
    return paths;
  }
  function treeNodes(node, top) {
    const arr = Array.from(node.children.values()).sort((a, b) => {
      if (top) {
        const ia = MQ.AREAS.indexOf(a.name), ib = MQ.AREAS.indexOf(b.name);
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
    return arr.map(ch => ({ label: ch.name, key: ch.key, count: ch.count, children: ch.children.size ? treeNodes(ch, false) : null }));
  }

  function counts(qs, get) {
    const m = new Map();
    qs.forEach(q => { const v = String(get(q) == null ? '' : get(q)).trim(); if (v) m.set(v, (m.get(v) || 0) + 1); });
    return m;
  }
  const byLabel = (a, b) => a.label.localeCompare(b.label, 'pt-BR');

  /* Lista de nós { label, value, count, children } para cada filtro; só valores que existem nas questões */
  function buildNodes(key, qs) {
    if (key === 'ano') return Array.from(counts(qs, q => q.ano)).sort((a, b) => Number(b[0]) - Number(a[0])).map(([v, n]) => ({ label: v, value: v, count: n }));
    if (key === 'finalidade' || key === 'banca') return Array.from(counts(qs, q => q[key])).map(([v, n]) => ({ label: v, value: v, count: n })).sort(byLabel);
    if (key === 'instituicao') {
      const info = new Map();
      qs.forEach(q => {
        const v = (q.instituicao || '').trim(); if (!v) return;
        const o = info.get(v) || { n: 0, uf: '', nat: false };
        o.n++; if (!o.uf && q.uf && String(q.uf).toUpperCase() !== 'BR') o.uf = String(q.uf).toUpperCase();
        if (isNational(q)) o.nat = true;
        info.set(v, o);
      });
      const nat = [], rest = [];
      info.forEach((o, v) => (o.nat ? nat : rest).push({ label: o.uf ? o.uf + ' - ' + v : v, value: v, count: o.n }));
      const out = rest.sort(byLabel);
      if (nat.length) out.unshift({ label: 'Nacionais', count: nat.reduce((s, x) => s + x.count, 0), children: nat.sort(byLabel) });
      return out;
    }
    if (key === 'uf') {
      const fed = qs.filter(isNational).length;
      const st = Array.from(counts(qs.filter(q => !isNational(q)), q => String(q.uf || '').toUpperCase())).map(([v, n]) => ({ label: (UF_NAMES[v] || v) + ' (' + v + ')', value: v, count: n })).sort(byLabel);
      const out = [];
      if (fed) out.push({ label: 'Federal', value: 'BR', count: fed });
      if (st.length) out.push({ label: 'Estadual', count: st.reduce((s, x) => s + x.count, 0), children: st });
      return out; // Municipal: não há esse dado nas questões
    }
    return [];
  }
  function leavesOf(n) { return n.children ? n.children.reduce((a, c) => a.concat(leavesOf(c)), []) : (n.value != null ? [n.value] : []); }

  /* ---------- Camadas: página de filtro e menu de baixo ---------- */
  function layer(cls, html, onClose) {
    const back = document.createElement('div');
    back.className = cls;
    back.innerHTML = html;
    document.body.appendChild(back);
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    function close() { document.removeEventListener('keydown', onKey, true); back.remove(); if (onClose) onClose(); }
    back._close = close;
    document.addEventListener('keydown', onKey, true);
    return { back, close };
  }

  function openFilterPage(key, title, onDone) {
    const f = MQ.bankFilter;
    const all = MQ.alive('questions');
    const treeRoot = key === 'assunto' ? buildTree(all) : null;
    const rootNodes = key === 'assunto' ? treeNodes(treeRoot, true) : buildNodes(key, all);
    let sel = (key === 'assunto' ? f.paths : f[key]).slice();
    let stack = [], query = '';
    const nested = rootNodes.some(n => n.children);

    const isOn = n => key === 'assunto'
      ? sel.includes(n.key) || sel.some(s => n.key.startsWith(s + '>'))
      : (leavesOf(n).length > 0 && leavesOf(n).every(v => sel.includes(v)));
    const isPartial = n => !isOn(n) && (key === 'assunto' ? sel.some(s => s.startsWith(n.key + '>')) : leavesOf(n).some(v => sel.includes(v)));
    function toggle(n) {
      if (key === 'assunto') { sel = togglePath(sel, n.key, treeRoot); return; }
      const l = leavesOf(n);
      if (isOn(n)) sel = sel.filter(v => !l.includes(v)); else l.forEach(v => { if (!sel.includes(v)) sel.push(v); });
    }

    const L = layer('fpage', '<div class="fpage-panel" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<header class="fp-head"><button class="icon-btn" id="fp-back" aria-label="Voltar">' + icon('arrowleft') + '</button><h2>' + esc(title) + '</h2></header>' +
      (nested ? '<nav class="fp-trail" id="fp-trail" aria-label="Caminho"></nav>' : '') +
      '<div class="fp-list" id="fp-list"></div>' +
      '<div class="fp-foot"><input type="search" id="fp-q" placeholder="Digite sua busca" aria-label="Buscar em ' + esc(title) + '" autocomplete="off"><button class="btn primary big" id="fp-ok">Confirmar</button></div></div>');
    const root = L.back;
    L.back.addEventListener('mousedown', e => { if (e.target === L.back) L.close(); });
    let shown = [];

    function level() { return stack.length ? stack[stack.length - 1].children : rootNodes; }
    function collect(nodes, trail, out) {
      nodes.forEach(n => {
        if (MQ.norm(n.label).includes(MQ.norm(query))) out.push({ n, trail });
        if (n.children) collect(n.children, trail.concat(n.label), out);
      });
      return out;
    }
    function draw() {
      const list = $('#fp-list', root);
      const st = list.scrollTop;
      const q = MQ.norm(query);
      shown = q ? collect(level(), [], []) : level().map(n => ({ n, trail: [] }));
      if (nested) {
        $('#fp-trail', root).innerHTML = '<button class="chip-trail' + (stack.length ? '' : ' cur') + '" data-lv="0">Início</button>' +
          stack.map((n, i) => '<button class="chip-trail' + (i === stack.length - 1 ? ' cur' : '') + '" data-lv="' + (i + 1) + '">' + esc(n.label) + '</button>').join('');
      }
      list.innerHTML = shown.length ? shown.map(({ n, trail }, i) => {
        const cnt = '<span class="fp-n">' + n.count.toLocaleString('pt-BR') + '</span>';
        const sub = trail.length ? '<small class="fp-path">' + esc(trail.join(' › ')) + '</small>' : '';
        if (n.children && !q) {
          return '<div class="fp-row"><input type="checkbox" class="fp-cb" data-i="' + i + '" aria-label="Marcar tudo em ' + esc(n.label) + '"' + (isOn(n) ? ' checked' : '') + (isPartial(n) ? ' data-partial="1"' : '') + '>' +
            '<button class="fp-open" data-open="' + i + '"><span class="t">' + esc(n.label) + '</span>' + cnt + icon('right') + '</button></div>';
        }
        return '<label class="fp-row"><input type="checkbox" class="fp-cb" data-i="' + i + '"' + (isOn(n) ? ' checked' : '') + (isPartial(n) ? ' data-partial="1"' : '') + '>' +
          '<span class="fp-txt"><span class="t">' + esc(n.label) + '</span>' + sub + '</span>' + cnt + '</label>';
      }).join('') : '<p class="muted fp-empty">' + (q ? 'Nada encontrado para essa busca.' : 'Nenhum valor cadastrado nas suas questões.') + '</p>';
      $$('input[data-partial]', list).forEach(i => { i.indeterminate = true; });
      list.scrollTop = st;
    }
    root.addEventListener('click', e => {
      const lv = e.target.closest('[data-lv]');
      if (lv) { stack = stack.slice(0, +lv.dataset.lv); query = ''; $('#fp-q', root).value = ''; draw(); return; }
      const op = e.target.closest('[data-open]');
      if (op) { stack.push(shown[+op.dataset.open].n); query = ''; $('#fp-q', root).value = ''; draw(); $('#fp-list', root).scrollTop = 0; }
    });
    root.addEventListener('change', e => {
      const cb = e.target.closest('.fp-cb');
      if (!cb) return;
      toggle(shown[+cb.dataset.i].n);
      draw();
    });
    $('#fp-q', root).addEventListener('input', e => { query = e.target.value; draw(); });
    $('#fp-back', root).onclick = () => { if (stack.length && !query) { stack.pop(); draw(); } else L.close(); };
    $('#fp-ok', root).onclick = () => {
      if (key === 'assunto') f.paths = sel; else f[key] = sel;
      L.close(); onDone();
    };
    draw();
    $('#fp-back', root).focus();
  }

  function openAdvanced(onDone) {
    const f = MQ.bankFilter;
    const t = { situacao: f.situacao.slice(), tipos: f.tipos.slice(), comCom: f.comCom !== false, semCom: f.semCom !== false, anuladas: !!f.anuladas, desatualizadas: !!f.desatualizadas, texto: f.texto || '' };
    const sw = (g, v, label) => '<label class="sw-row"><span>' + label + '</span><input type="checkbox" class="sw" data-g="' + g + '" data-v="' + v + '"' + (Array.isArray(t[g]) ? (t[g].includes(v) ? ' checked' : '') : (t[g] ? ' checked' : '')) + '></label>';
    const sec = (title, req, rows) => '<div class="sw-sec"><h3>' + title + '</h3>' + (req ? '<span class="req">Obrigatório</span>' : '') + '</div>' + rows;
    function body() {
      return '<div class="adv-search"><label class="field"><span>Buscar no texto ou pelo código</span><input type="search" id="adv-q" placeholder="Ex.: pré-eclâmpsia ou R1-00012" value="' + esc(t.texto) + '"></label></div>' +
        sec('Tipo de questão', true, sw('tipos', 'certoerrado', 'Questões Certo/Errado') + sw('tipos', 'multipla', 'Questões de múltipla escolha')) +
        sec('Situação da questão', true, sw('situacao', 'resolvi', 'Questões que já resolvi') + sw('situacao', 'nao', 'Questões que não resolvi') + sw('situacao', 'acertei', 'Questões que acertei') + sw('situacao', 'errei', 'Questões que errei')) +
        sec('Solução', false, sw('comCom', '', 'Questões com comentário') + sw('semCom', '', 'Questões sem comentário')) +
        sec('Vigência', false, sw('desatualizadas', '', 'Questões desatualizadas') + sw('anuladas', '', 'Questões anuladas'));
    }
    const L = layer('fpage', '<div class="fpage-panel" role="dialog" aria-modal="true" aria-label="Filtros avançados">' +
      '<header class="fp-head"><button class="icon-btn" id="fp-back" aria-label="Fechar">' + icon('x') + '</button><h2>Filtros avançados</h2><button class="icon-btn" id="adv-reset" title="Restaurar o padrão" aria-label="Restaurar o padrão">' + icon('trash') + '</button></header>' +
      '<div class="fp-list" id="fp-list"></div><div class="fp-foot"><button class="btn primary big" id="fp-ok">Confirmar</button></div></div>');
    const root = L.back;
    L.back.addEventListener('mousedown', e => { if (e.target === L.back) L.close(); });
    function draw() { $('#fp-list', root).innerHTML = body(); }
    root.addEventListener('input', e => { if (e.target.id === 'adv-q') t.texto = e.target.value.trim(); });
    root.addEventListener('change', e => {
      const c = e.target.closest('.sw');
      if (!c) return;
      const g = c.dataset.g, v = c.dataset.v;
      if (Array.isArray(t[g])) {
        const next = c.checked ? t[g].concat(v) : t[g].filter(x => x !== v);
        if (!next.length) { c.checked = true; MQ.toast('Deixe pelo menos uma opção ligada.'); return; }
        t[g] = next;
      } else t[g] = c.checked;
    });
    $('#adv-reset', root).onclick = () => {
      const d = MQ.newFilter();
      Object.assign(t, { situacao: d.situacao, tipos: d.tipos, comCom: true, semCom: true, anuladas: false, desatualizadas: false, texto: '' });
      draw(); MQ.toast('Padrão restaurado. Toque em Confirmar para aplicar.');
    };
    $('#fp-back', root).onclick = () => L.close();
    $('#fp-ok', root).onclick = () => { Object.assign(f, t); L.close(); onDone(); };
    draw();
    $('#fp-back', root).focus();
  }

  /* ---------- Resumo dos filtros ativos ---------- */
  function chipList() {
    const f = MQ.bankFilter;
    const chips = [];
    f.paths.forEach(p => chips.push({ label: p.split('>').join(' › '), kind: 'path', val: p }));
    FIELDS.forEach(x => f[x.key].forEach(v => chips.push({ label: x.label + ': ' + (x.key === 'uf' ? (v === 'BR' ? 'Federal' : (UF_NAMES[v] || v)) : v), kind: x.key, val: v })));
    f.situacao.forEach(v => chips.push({ label: SIT_LABEL[v], kind: 'situacao', val: v }));
    if (f.tipos.length < 2) f.tipos.forEach(v => chips.push({ label: v === 'multipla' ? 'Só múltipla escolha' : 'Só certo/errado', kind: 'tipos', val: v }));
    if (f.comCom === false) chips.push({ label: 'Sem comentário', kind: 'com', val: '' });
    if (f.semCom === false) chips.push({ label: 'Com comentário', kind: 'com', val: '' });
    if (f.texto) chips.push({ label: 'Texto: "' + f.texto + '"', kind: 'texto', val: '' });
    if (f.anuladas) chips.push({ label: 'Inclui anuladas', kind: 'anuladas', val: '' });
    if (f.desatualizadas) chips.push({ label: 'Inclui desatualizadas', kind: 'desatualizadas', val: '' });
    return chips;
  }
  function removeChip(kind, val) {
    const f = MQ.bankFilter;
    if (kind === 'path') f.paths = f.paths.filter(p => p !== val);
    else if (kind === 'situacao') { f.situacao = f.situacao.filter(x => x !== val); if (!f.situacao.length) f.situacao = ['nao', 'resolvi']; }
    else if (kind === 'tipos') f.tipos = ['multipla', 'certoerrado'];
    else if (kind === 'com') { f.comCom = true; f.semCom = true; }
    else if (kind === 'texto') f.texto = '';
    else if (kind === 'anuladas' || kind === 'desatualizadas') f[kind] = false;
    else f[kind] = f[kind].filter(x => x !== val);
  }
  function badgeCount(k) {
    const f = MQ.bankFilter;
    if (k === 'assunto') return f.paths.length;
    if (k === 'avancados') {
      return (f.situacao.length === 1 && f.situacao[0] === 'nao' ? 0 : 1) + (f.tipos.length < 2 ? 1 : 0) + (f.comCom === false || f.semCom === false ? 1 : 0) +
        (f.texto ? 1 : 0) + (f.anuladas ? 1 : 0) + (f.desatualizadas ? 1 : 0);
    }
    return f[k].length;
  }

  function openContinue(refresh) {
    const items = [['sim', 'Criar simulado', 'timer'], ['list', 'Criar lista', 'book'], ['see', 'Ver questões', 'clipboard']];
    const L = layer('sheet-back', '<div class="sheet" role="dialog" aria-modal="true" aria-label="Continuar"><div class="sheet-handle"></div>' +
      items.map(([a, l, ic]) => '<button class="sheet-item" data-a="' + a + '"><span>' + l + '</span>' + icon(ic) + '</button>').join('') +
      '<button class="sheet-item" data-a="applied" aria-expanded="false"><span>Filtros aplicados</span><span class="badge-n" id="sh-n"></span></button>' +
      '<div class="sheet-applied" id="sh-applied" hidden></div></div>');
    const root = L.back;
    L.back.addEventListener('mousedown', e => { if (e.target === L.back) L.close(); });
    function drawApplied() {
      const chips = chipList();
      $('#sh-n', root).textContent = chips.length;
      $('#sh-applied', root).innerHTML = chips.length
        ? '<div class="chips">' + chips.map((c, i) => '<button class="chip" data-chip="' + i + '" aria-label="Remover filtro ' + esc(c.label) + '">' + esc(c.label) + icon('x') + '</button>').join('') + '</div>'
        : '<p class="muted small">Nenhum filtro: todas as questões ativas entram.</p>';
    }
    drawApplied();
    root.addEventListener('click', e => {
      const chip = e.target.closest('[data-chip]');
      if (chip) { const c = chipList()[+chip.dataset.chip]; removeChip(c.kind, c.val); drawApplied(); refresh(); return; }
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'applied') {
        const box = $('#sh-applied', root);
        box.hidden = !box.hidden; b.setAttribute('aria-expanded', String(!box.hidden));
        return;
      }
      const qs = MQ.sortQuestions(MQ.filterQuestions(MQ.bankFilter));
      if (!qs.length) { MQ.toast('Nenhuma questão com esses filtros.'); return; }
      const ids = qs.map(q => q.id);
      L.close();
      if (a === 'sim') MQ.simCreateModal(ids);
      else if (a === 'list') MQ.createListModal(ids);
      else MQ.openSolve({ title: 'Banco de questões', qids: ids, ctx: 'banco' });
    });
  }

  /* ---------- Tela Questões ---------- */
  MQ.views.questoes = function (root) {
    const all = MQ.alive('questions');
    if (!all.length) {
      root.innerHTML = '<div class="page-head"><div><h1>Questões</h1></div></div>' +
        (MQ.isAdmin() ? '<div class="empty"><h2>Seu banco está vazio</h2><p>Cadastre questões uma a uma ou importe uma planilha para começar a filtrar, montar listas e simulados.</p><a class="btn primary" href="#/cadastrar">Cadastrar questões</a></div>'
          : '<div class="empty"><h2>Ainda não há questões</h2><p>As questões aparecem aqui quando forem adicionadas ao banco.</p></div>');
      return;
    }
    root.innerHTML = '<div class="qhome">' +
      '<h1 class="qh-count" id="qh-n" aria-live="polite"></h1>' +
      '<p class="qh-sub">Combine filtros e comece a resolver questões ou crie uma nova lista</p>' +
      '<div class="fbtns" id="fbtns"></div>' +
      '<div class="fbar"><button class="btn ghost" id="f-reset">Limpar filtros</button><button class="btn primary big" id="f-cont">Continuar</button></div></div>';

    function refresh() {
      const n = MQ.filterQuestions(MQ.bankFilter).length;
      $('#qh-n', root).textContent = n.toLocaleString('pt-BR') + (n === 1 ? ' questão' : ' questões');
      const btn = (k, label, ic, adv) => {
        const c = badgeCount(k);
        return '<button class="fbtn' + (adv ? ' adv' : '') + '" data-f="' + k + '"><span class="fplus">' + icon(ic) + '</span><span class="lb">' + label + '</span>' + (c ? '<span class="badge-n">+' + c + '</span>' : '') + '</button>';
      };
      $('#fbtns', root).innerHTML = FILTER_LIST.map(([k, l]) => btn(k, l, 'plus')).join('') + btn('avancados', 'Filtros avançados', 'settings', true);
      const def = MQ.newFilter();
      $('#f-reset', root).disabled = JSON.stringify(MQ.bankFilter) === JSON.stringify(def);
      $('#f-cont', root).disabled = !n;
    }
    $('#fbtns', root).addEventListener('click', e => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      const k = b.dataset.f;
      if (k === 'avancados') openAdvanced(refresh);
      else openFilterPage(k, FILTER_LIST.find(x => x[0] === k)[1], refresh);
    });
    $('#f-reset', root).onclick = () => { MQ.bankFilter = MQ.newFilter(); refresh(); };
    $('#f-cont', root).onclick = () => openContinue(refresh);
    refresh();
  };

  MQ.bankFieldList = FIELDS;
})(window.MQ);
