/* Pulse — casca do app: tela Início, atalhos globais, busca (Ctrl K) e ajuda de atalhos */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  /* ---------- Início (esqueleto; o painel completo entra no passo 6 do PLANO.md) ---------- */
  MQ.views.inicio = function (root) {
    const qs = MQ.alive('questions').length;
    const done = new Set(MQ.alive('attempts').map(a => a.qid)).size;
    root.innerHTML =
      '<div class="page-head"><div><h1>Início</h1><p>Seu resumo de estudo vai ficar aqui.</p></div></div>' +
      '<div class="home-grid">' +
      '<section class="home-card hi"><h2>Comece por aqui</h2><p>' + (done ? 'Você já respondeu ' + done + (done === 1 ? ' questão' : ' questões') + '. Continue de onde parou.' : 'Escolha os filtros e resolva suas primeiras questões.') + '</p>' +
      '<a class="btn primary big" href="#/questoes">' + icon('search') + 'Buscar questões</a></section>' +
      '<section class="home-card"><h2>Seu banco</h2><p class="muted">' + qs + ' questões disponíveis.</p>' +
      '<div class="home-links"><a class="btn" href="#/listas">' + icon('folder') + 'Minhas listas</a><a class="btn" href="#/desempenho">' + icon('chart') + 'Desempenho</a></div></section>' +
      '</div>';
  };

  /* ---------- Atalhos de teclado ---------- */
  const ROUTES = ['inicio', 'questoes', 'listas', 'desempenho', 'configuracoes'];
  const inSim = () => MQ.route().name === 'simulado'; // prova em andamento: nada de sair por atalho
  const typing = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && /^[1-5]$/.test(e.key)) {
      if (document.querySelector('.modal-back') || typing(e.target) || inSim()) return; // não perde texto digitado
      e.preventDefault(); location.hash = '#/' + ROUTES[+e.key - 1];
    } else if (mod && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault(); if (!inSim()) MQ.searchDialog();
    } else if (!mod && e.key === '?' && !typing(e.target) && !document.querySelector('.modal-back')) {
      e.preventDefault(); MQ.shortcutsDialog();
    }
  });

  MQ.shortcutsDialog = function () {
    const rows = [['Ctrl K', 'Buscar questão por texto ou código R1-…'], ['Ctrl 1–5', 'Início, Questões, Listas, Desempenho, Configurações'], ['?', 'Mostrar esta lista'], ['Esc', 'Fechar janela ou menu']];
    MQ.modal({
      title: 'Atalhos de teclado',
      body: '<dl class="kbd-list">' + rows.map(r => '<dt><kbd>' + esc(r[0]) + '</kbd></dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>' +
        '<p class="muted small">Atalhos de letra não funcionam enquanto você digita num campo. Outros atalhos aparecem em cada tela.</p>'
    });
  };

  /* ---------- Busca (Ctrl K) ---------- */
  const hay = new Map();
  const plain = MQ.plain;
  function haystack(q) {
    const c = hay.get(q.id);
    if (c && c.v === q.updatedAt) return c;
    const text = plain(q.enunciado);
    const h = { v: q.updatedAt, text, key: MQ.norm([q.codigo, q.instituicao, q.ano, text].join(' ')) };
    hay.set(q.id, h);
    return h;
  }
  const LIMIT = 40;
  MQ.searchQuestions = function (query) {
    const terms = MQ.norm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const out = [];
    for (const q of MQ.alive('questions')) {
      const h = haystack(q);
      if (terms.every(t => h.key.includes(t))) { out.push({ q, text: h.text }); if (out.length > LIMIT) break; }
    }
    return out;
  };

  MQ.searchDialog = function () {
    if (document.querySelector('.modal-back')) return;
    let found = [];
    MQ.modal({
      title: 'Buscar questão', wide: true,
      body: '<div class="pane-search">' + icon('search') + '<input type="search" id="gs-q" placeholder="Texto do enunciado, instituição, ano ou código R1-…" autocomplete="off" aria-label="Buscar questão"></div>' +
        '<div id="gs-res" class="gs-res" aria-live="polite"><p class="muted">Digite para buscar em todas as questões do banco.</p></div>',
      onOpen(box, close) {
        const input = $('#gs-q', box), res = $('#gs-res', box);
        function open(i) {
          const ids = found.slice(0, LIMIT).map(f => f.q.id);
          close();
          MQ.openSolve({ title: 'Busca', qids: ids, ctx: 'banco', startIndex: i });
        }
        function show() {
          const raw = input.value.trim();
          found = MQ.searchQuestions(raw);
          if (!raw) { res.innerHTML = '<p class="muted">Digite para buscar em todas as questões do banco.</p>'; return; }
          if (!found.length) { res.innerHTML = '<p class="muted">Nenhuma questão encontrada. Tente menos palavras.</p>'; return; }
          const shown = found.slice(0, LIMIT);
          res.innerHTML = shown.map((f, i) =>
            '<button class="gs-row" data-i="' + i + '"><span class="gs-meta"><b>' + esc(f.q.codigo || '') + '</b>' + [f.q.instituicao, f.q.ano].filter(Boolean).map(t => ' · ' + esc(t)).join('') + '</span>' +
            '<span class="gs-txt">' + esc(f.text.slice(0, 140)) + '</span></button>').join('') +
            (found.length > LIMIT ? '<p class="muted small">Mostrando as primeiras ' + LIMIT + '. Refine a busca para ver outras.</p>' : '');
        }
        let timer = 0;
        input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(show, 120); });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { clearTimeout(timer); show(); if (found.length) open(0); }
          else if (e.key === 'ArrowDown') { const b = $('.gs-row', res); if (b) { e.preventDefault(); b.focus(); } }
        });
        res.addEventListener('click', e => { const b = e.target.closest('.gs-row'); if (b) open(+b.dataset.i); });
        res.addEventListener('keydown', e => {
          const b = e.target.closest('.gs-row'); if (!b) return;
          const next = e.key === 'ArrowDown' ? b.nextElementSibling : e.key === 'ArrowUp' ? b.previousElementSibling : null;
          if (e.key === 'ArrowUp' && !b.previousElementSibling) { e.preventDefault(); input.focus(); }
          else if (next && next.classList.contains('gs-row')) { e.preventDefault(); next.focus(); }
        });
      }
    });
  };
})(window.MQ);
