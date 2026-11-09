/* Caderno R1 — banco de questões: filtros e busca */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  const FIELDS = [
    { key: 'instituicao', tab: 'Instituição', search: 'Buscar instituição' },
    { key: 'ano', tab: 'Ano', search: 'Buscar ano' },
    { key: 'uf', tab: 'Região (UF)', search: 'Buscar UF' },
    { key: 'finalidade', tab: 'Finalidade', search: 'Buscar finalidade' },
    { key: 'banca', tab: 'Banca', search: 'Buscar banca' },
    { key: 'professor', tab: 'Professor', search: 'Buscar professor' }
  ];

  MQ.newFilter = function () {
    const f = { paths: [], situacao: [], tipos: [], anuladas: false, desatualizadas: false, comentario: '', texto: '' };
    FIELDS.forEach(x => { f[x.key] = []; });
    return f;
  };
  MQ.bankFilter = MQ.newFilter();
  let tab = 'assunto';
  let paneSearch = '';
  const expanded = new Set();

  function pathKey(q) { return MQ.qPath(q).join('>'); }

  MQ.matchQuestion = function (q, f, latest) {
    if (f.paths.length) {
      const p = pathKey(q);
      if (!f.paths.some(s => p === s || p.startsWith(s + '>'))) return false;
    }
    for (const x of FIELDS) {
      const sel = f[x.key];
      if (sel && sel.length && !sel.includes(String(q[x.key] == null ? '' : q[x.key]))) return false;
    }
    if (!f.anuladas && q.anulada) return false;
    if (!f.desatualizadas && q.desatualizada) return false;
    if (f.tipos.length && !f.tipos.includes(q.tipo || 'multipla')) return false;
    if (f.comentario === 'com' && !(q.comentario || '').trim()) return false;
    if (f.comentario === 'sem' && (q.comentario || '').trim()) return false;
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

  /* ---------- Árvore de assuntos ---------- */
  function buildTree(qs) {
    const root = { children: new Map(), count: 0 };
    qs.forEach(q => {
      const parts = MQ.qPath(q);
      let node = root, key = '';
      parts.forEach(p => {
        key = key ? key + '>' + p : p;
        if (!node.children.has(p)) node.children.set(p, { name: p, key, children: new Map(), count: 0 });
        node = node.children.get(p);
        node.count++;
      });
    });
    return root;
  }
  function sortedChildren(node, top) {
    const arr = Array.from(node.children.values());
    return arr.sort((a, b) => {
      if (top) {
        const ia = MQ.AREAS.indexOf(a.name), ib = MQ.AREAS.indexOf(b.name);
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }
  function findNode(root, key) {
    let node = root;
    for (const p of key.split('>')) { node = node.children.get(p); if (!node) return null; }
    return node;
  }

  function togglePath(key, root) {
    const f = MQ.bankFilter;
    const i = f.paths.indexOf(key);
    if (i >= 0) { f.paths.splice(i, 1); return; }
    const anc = f.paths.find(s => key.startsWith(s + '>'));
    if (anc) {
      f.paths.splice(f.paths.indexOf(anc), 1);
      const parts = key.split('>');
      const ancDepth = anc.split('>').length;
      for (let d = ancDepth; d < parts.length; d++) {
        const parentKey = parts.slice(0, d).join('>');
        const parent = findNode(root, parentKey);
        if (!parent) continue;
        parent.children.forEach(ch => { if (ch.name !== parts[d]) f.paths.push(ch.key); });
      }
      return;
    }
    f.paths = f.paths.filter(s => !s.startsWith(key + '>'));
    f.paths.push(key);
  }

  function nodeMatchesSearch(node, t) {
    if (MQ.norm(node.name).includes(t)) return true;
    for (const ch of node.children.values()) if (nodeMatchesSearch(ch, t)) return true;
    return false;
  }

  function renderTree(root) {
    const f = MQ.bankFilter;
    const t = MQ.norm(paneSearch);
    let html = '';
    function walk(node, depth, inheritedOn) {
      sortedChildren(node, depth === 0).forEach(ch => {
        if (t && !nodeMatchesSearch(ch, t)) return;
        const on = inheritedOn || f.paths.includes(ch.key);
        const partial = !on && f.paths.some(s => s.startsWith(ch.key + '>'));
        const hasKids = ch.children.size > 0;
        const open = expanded.has(ch.key) || (t && hasKids);
        html += '<div class="tree-row" style="padding-left:' + (depth * 18) + 'px">' +
          '<button class="twist' + (hasKids ? '' : ' leaf') + '" data-twist="' + esc(ch.key) + '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-label="' + (open ? 'Recolher ' : 'Expandir ') + esc(ch.name) + '">' + icon('right') + '</button>' +
          '<label><input type="checkbox" data-path="' + esc(ch.key) + '"' + (on ? ' checked' : '') + (partial ? ' data-partial="1"' : '') + '><span class="t">' + esc(ch.name) + '</span><span class="n">' + ch.count + '</span></label></div>';
        if (hasKids && open) walk(ch, depth + 1, on);
      });
    }
    walk(root, 0, false);
    return html || '<p class="muted">Nenhum assunto encontrado.</p>';
  }

  function valueCounts(key, qs) {
    const m = new Map();
    qs.forEach(q => {
      const v = String(q[key] == null ? '' : q[key]).trim();
      if (!v) return;
      m.set(v, (m.get(v) || 0) + 1);
    });
    const arr = Array.from(m.entries());
    if (key === 'ano') arr.sort((a, b) => Number(b[0]) - Number(a[0]));
    else arr.sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
    return arr;
  }

  function renderOptions(key, qs) {
    const f = MQ.bankFilter;
    const t = MQ.norm(paneSearch);
    const arr = valueCounts(key, qs).filter(([v]) => !t || MQ.norm(v).includes(t));
    if (!arr.length) return '<p class="muted">Nenhum valor cadastrado nas suas questões. </p>';
    return arr.map(([v, n]) =>
      '<label class="opt"><input type="checkbox" data-field="' + key + '" value="' + esc(v) + '"' + (f[key].includes(v) ? ' checked' : '') + '><span>' + esc(v) + '</span><span class="n">' + n + '</span></label>'
    ).join('');
  }

  function renderAdvanced() {
    const f = MQ.bankFilter;
    const c = (group, val, label) => '<label class="check"><input type="checkbox" data-adv="' + group + '" value="' + val + '"' + (f[group].includes(val) ? ' checked' : '') + '><span>' + label + '</span></label>';
    return '<label class="field"><span>Buscar no texto ou pelo código</span><input type="search" id="f-texto" placeholder="Ex.: pré-eclâmpsia ou R1-00012" value="' + esc(f.texto) + '"></label>' +
      '<h3 class="small" style="margin:6px 0 2px">Situação da questão</h3>' +
      c('situacao', 'nao', 'Que não resolvi') + c('situacao', 'resolvi', 'Que já resolvi') + c('situacao', 'acertei', 'Que acertei na última vez') + c('situacao', 'errei', 'Que errei na última vez') +
      '<h3 class="small" style="margin:12px 0 2px">Tipo de questão</h3>' +
      c('tipos', 'multipla', 'Múltipla escolha') + c('tipos', 'certoerrado', 'Certo ou errado') +
      '<h3 class="small" style="margin:12px 0 2px">Comentário</h3>' +
      '<label class="check"><input type="radio" name="f-com" value=""' + (!f.comentario ? ' checked' : '') + '><span>Tanto faz</span></label>' +
      '<label class="check"><input type="radio" name="f-com" value="com"' + (f.comentario === 'com' ? ' checked' : '') + '><span>Só com comentário</span></label>' +
      '<label class="check"><input type="radio" name="f-com" value="sem"' + (f.comentario === 'sem' ? ' checked' : '') + '><span>Só sem comentário</span></label>' +
      '<h3 class="small" style="margin:12px 0 2px">Vigência</h3>' +
      '<label class="check"><input type="checkbox" id="f-anul"' + (f.anuladas ? ' checked' : '') + '><span>Incluir questões anuladas</span></label>' +
      '<label class="check"><input type="checkbox" id="f-desat"' + (f.desatualizadas ? ' checked' : '') + '><span>Incluir questões desatualizadas</span></label>';
  }

  function chipsHtml() {
    const f = MQ.bankFilter;
    const chips = [];
    f.paths.forEach(p => chips.push({ label: p.split('>').join(' › '), kind: 'path', val: p }));
    FIELDS.forEach(x => f[x.key].forEach(v => chips.push({ label: x.tab + ': ' + v, kind: x.key, val: v })));
    const sitLabel = { nao: 'Não resolvidas', resolvi: 'Já resolvidas', acertei: 'Acertei', errei: 'Errei' };
    f.situacao.forEach(v => chips.push({ label: sitLabel[v], kind: 'situacao', val: v }));
    f.tipos.forEach(v => chips.push({ label: v === 'multipla' ? 'Múltipla escolha' : 'Certo ou errado', kind: 'tipos', val: v }));
    if (f.comentario) chips.push({ label: f.comentario === 'com' ? 'Com comentário' : 'Sem comentário', kind: 'comentario', val: '' });
    if (f.texto) chips.push({ label: 'Texto: "' + f.texto + '"', kind: 'texto', val: '' });
    if (f.anuladas) chips.push({ label: 'Inclui anuladas', kind: 'anuladas', val: '' });
    if (f.desatualizadas) chips.push({ label: 'Inclui desatualizadas', kind: 'desatualizadas', val: '' });
    if (!chips.length) return '<p class="muted small">Nenhum filtro: todas as questões ativas entram.</p>';
    return '<div class="chips">' + chips.map(c =>
      '<button class="chip" data-chip="' + esc(c.kind) + '" data-val="' + esc(c.val) + '" aria-label="Remover filtro ' + esc(c.label) + '">' + esc(c.label) + icon('x') + '</button>').join('') + '</div>';
  }

  function tabCount(k) {
    const f = MQ.bankFilter;
    if (k === 'assunto') return f.paths.length;
    if (k === 'avancados') return f.situacao.length + f.tipos.length + (f.comentario ? 1 : 0) + (f.texto ? 1 : 0) + (f.anuladas ? 1 : 0) + (f.desatualizadas ? 1 : 0);
    return f[k].length;
  }

  MQ.views.questoes = function (root) {
    const all = MQ.alive('questions');
    if (!all.length) {
      root.innerHTML = '<div class="page-head"><div><h1>Banco de questões</h1></div></div>' +
        (MQ.isAdmin() ? '<div class="empty"><h2>Seu banco está vazio</h2><p>Cadastre questões uma a uma ou importe uma planilha para começar a filtrar, montar listas e simulados.</p><a class="btn primary" href="#/cadastrar">Cadastrar questões</a></div>'
          : '<div class="empty"><h2>Ainda não há questões</h2><p>As questões aparecem aqui quando forem adicionadas ao banco.</p></div>');
      return;
    }
    const tabs = [['assunto', 'Especialidade e assunto']].concat(FIELDS.map(x => [x.key, x.tab])).concat([['avancados', 'Filtros avançados']]);
    root.innerHTML =
      '<div class="page-head"><div><h1>Banco de questões</h1><p>Combine os filtros e escolha o que fazer com o resultado.</p></div></div>' +
      '<div class="filter-tabs" role="tablist">' + tabs.map(([k, l]) => {
        const n = tabCount(k);
        return '<button role="tab" data-tab="' + k + '" aria-selected="' + (tab === k) + '">' + esc(l) + (n ? '<span class="count">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="filter-grid"><div class="filter-pane" id="f-pane"></div><div class="filter-pane summary" id="f-sum"></div></div>';

    const pane = $('#f-pane', root);
    const sum = $('#f-sum', root);

    function drawPane() {
      const st = pane.scrollTop;
      let html = '';
      if (tab !== 'avancados') {
        const ph = tab === 'assunto' ? 'Buscar especialidade ou assunto' : FIELDS.find(x => x.key === tab).search;
        html += '<div class="pane-search">' + icon('search') + '<input type="search" id="pane-q" placeholder="' + esc(ph) + '" value="' + esc(paneSearch) + '"></div>';
      }
      if (tab === 'assunto') html += '<div id="tree">' + renderTree(buildTree(all)) + '</div>';
      else if (tab === 'avancados') html += renderAdvanced();
      else html += '<div id="opts">' + renderOptions(tab, all) + '</div>';
      pane.innerHTML = html;
      $$('input[data-partial]', pane).forEach(i => { i.indeterminate = true; });
      pane.scrollTop = st;
      const ps = $('#pane-q', pane);
      if (ps) ps.addEventListener('input', () => {
        paneSearch = ps.value;
        const target = tab === 'assunto' ? $('#tree', pane) : $('#opts', pane);
        target.innerHTML = tab === 'assunto' ? renderTree(buildTree(all)) : renderOptions(tab, all);
        $$('input[data-partial]', pane).forEach(i => { i.indeterminate = true; });
      });
      const ft = $('#f-texto', pane);
      if (ft) {
        let tm;
        ft.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { MQ.bankFilter.texto = ft.value.trim(); drawSummary(); refreshTabs(); }, 250); });
      }
    }

    function drawSummary() {
      const qs = MQ.filterQuestions(MQ.bankFilter);
      const n = qs.length;
      sum.innerHTML = '<h3>Questões encontradas</h3><div class="summary-count">' + n.toLocaleString('pt-BR') + '</div>' +
        '<p class="muted small">de ' + all.length.toLocaleString('pt-BR') + ' no seu banco</p>' +
        chipsHtml() +
        '<div class="filter-actions">' +
        '<button class="btn ghost" id="f-reset"' + (anyFilter() ? '' : ' disabled') + '>Limpar filtros</button>' +
        '<button class="btn" id="f-list"' + (n ? '' : ' disabled') + '>Criar lista</button>' +
        '<button class="btn" id="f-sim"' + (n ? '' : ' disabled') + '>Criar simulado</button>' +
        '<button class="btn primary" id="f-see"' + (n ? '' : ' disabled') + '>Ver questões</button></div>';
      $('#f-reset', sum).onclick = () => { MQ.bankFilter = MQ.newFilter(); paneSearch = ''; MQ.render(); };
      $('#f-see', sum).onclick = () => {
        const ids = MQ.sortQuestions(qs).map(q => q.id);
        MQ.openSolve({ title: 'Banco de questões', qids: ids, ctx: 'banco' });
      };
      $('#f-list', sum).onclick = () => MQ.createListModal(MQ.sortQuestions(qs).map(q => q.id));
      $('#f-sim', sum).onclick = () => MQ.simCreateModal(qs.map(q => q.id));
      $$('.chip', sum).forEach(b => b.onclick = () => {
        const f = MQ.bankFilter, k = b.dataset.chip, v = b.dataset.val;
        if (k === 'path') f.paths = f.paths.filter(p => p !== v);
        else if (['comentario', 'texto'].includes(k)) f[k] = '';
        else if (['anuladas', 'desatualizadas'].includes(k)) f[k] = false;
        else f[k] = f[k].filter(x => x !== v);
        drawPane(); drawSummary(); refreshTabs();
      });
    }
    function anyFilter() { return ['assunto', 'avancados'].concat(FIELDS.map(x => x.key)).some(k => tabCount(k) > 0); }
    function refreshTabs() {
      $$('[data-tab]', root).forEach(b => {
        const k = b.dataset.tab, n = tabCount(k);
        let c = b.querySelector('.count');
        if (n && !c) { c = document.createElement('span'); c.className = 'count'; b.appendChild(c); }
        if (c) { if (n) c.textContent = n; else c.remove(); }
      });
    }

    $$('[data-tab]', root).forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; paneSearch = '';
      $$('[data-tab]', root).forEach(x => x.setAttribute('aria-selected', String(x === b)));
      drawPane();
    }));

    pane.addEventListener('click', e => {
      const tw = e.target.closest('[data-twist]');
      if (tw) {
        const k = tw.dataset.twist;
        if (expanded.has(k)) expanded.delete(k); else expanded.add(k);
        drawPane();
      }
    });
    pane.addEventListener('change', e => {
      const t = e.target;
      const f = MQ.bankFilter;
      if (t.dataset.path) { togglePath(t.dataset.path, buildTree(all)); drawPane(); }
      else if (t.dataset.field) {
        const arr = f[t.dataset.field];
        if (t.checked) { if (!arr.includes(t.value)) arr.push(t.value); } else f[t.dataset.field] = arr.filter(v => v !== t.value);
      } else if (t.dataset.adv) {
        const g = t.dataset.adv;
        if (t.checked) f[g].push(t.value); else f[g] = f[g].filter(v => v !== t.value);
      } else if (t.name === 'f-com') f.comentario = t.value;
      else if (t.id === 'f-anul') f.anuladas = t.checked;
      else if (t.id === 'f-desat') f.desatualizadas = t.checked;
      else return;
      drawSummary(); refreshTabs();
    });

    drawPane();
    drawSummary();
  };

  MQ.bankFieldList = FIELDS;
})(window.MQ);
