/* Pulse — aba Anotações: todas as anotações feitas nas questões, com filtro por assunto e busca */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;
  const st = { path: [], text: '', scroll: 0 }; // filtro em memória (assunto: grande área › especialidade › tema › subtema)

  function load() {
    return MQ.alive('notes').filter(n => n.text && n.text.trim()).map(n => {
      const qid = n.qid || n.id, q = MQ.get('questions', qid);
      return { n, q, qid, path: q ? MQ.qPath(q) : [] };
    }).sort((a, b) => (b.n.updatedAt || 0) - (a.n.updatedAt || 0));
  }

  function matches(x, term) {
    if (st.path.length && !st.path.every((p, i) => x.path[i] === p)) return false;
    if (!term) return true;
    return MQ.norm([x.n.text, x.q && x.q.codigo, x.q && MQ.plain(x.q.enunciado)].join(' ')).includes(term);
  }

  function editDialog(x, done) {
    MQ.modal({
      title: 'Anotação',
      body: '<p class="muted small">' + esc((x.q && x.q.codigo) || '') + (x.path.length ? ' · ' + esc(x.path.join(' › ')) : '') + '</p>' +
        '<textarea id="nt-edit" rows="7" maxlength="4000" aria-label="Texto da anotação">' + esc(x.n.text) + '</textarea>',
      actions: [{ label: 'Cancelar', kind: 'ghost' }, { label: 'Salvar', kind: 'primary', onClick(close, box) {
        const t = $('#nt-edit', box).value.trim();
        if (!t) { MQ.toast('Para apagar a anotação, use o botão de excluir.'); return false; }
        MQ.saveNote(x.qid, t); MQ.toast('Anotação salva.'); done();
      } }]
    });
  }

  MQ.views.anotacoes = function (root) {
    const all = load();
    if (!all.length) {
      st.path = []; st.text = '';
      root.innerHTML = '<div class="page-head"><div><h1>Anotações</h1></div></div>' +
        '<div class="empty"><h2>Nenhuma anotação ainda</h2><p>Escreva um lembrete no painel "Anotação" de qualquer questão (tecla N) e ele aparece aqui, agrupado por assunto.</p><a class="btn primary" href="#/questoes">Ir para as questões</a></div>';
      return;
    }
    root.innerHTML = '<div class="nt">' +
      '<header class="nt-head"><div><h1>Anotações</h1><p class="nt-sub" id="nt-sub"></p></div>' +
      '<div class="pane-search nt-search">' + icon('search') + '<input type="search" id="nt-q" placeholder="Buscar na anotação ou na questão" aria-label="Buscar nas anotações" autocomplete="off" value="' + esc(st.text) + '"></div></header>' +
      '<nav class="nt-filters" id="nt-filters" aria-label="Filtrar por assunto"></nav>' +
      '<div id="nt-list"></div>' +
      '<button type="button" class="btn nt-top" id="nt-top" aria-label="Voltar ao topo" hidden>' + icon('up') + '</button></div>';

    function paint() {
      if (!$('#nt-sub', root)) return; // saiu da tela com a busca pendente
      const term = MQ.norm(st.text);
      const list = all.filter(x => matches(x, term));
      const depth = st.path.length, kids = new Map();
      list.forEach(x => { const k = x.path[depth]; if (k) kids.set(k, (kids.get(k) || 0) + 1); });
      const kidList = Array.from(kids).sort((a, b) => {
        if (!depth) { const ia = MQ.AREAS.indexOf(a[0]), ib = MQ.AREAS.indexOf(b[0]); if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); }
        return a[0].localeCompare(b[0], 'pt-BR');
      });
      const questions = new Set(list.map(x => x.qid)).size;
      $('#nt-sub', root).textContent = list.length === all.length
        ? all.length + (all.length === 1 ? ' anotação' : ' anotações') + ' em ' + questions + (questions === 1 ? ' questão' : ' questões')
        : list.length + ' de ' + all.length + ' anotações';

      $('#nt-filters', root).innerHTML = '<div class="nt-row"><span class="nt-lab">Assunto</span>' +
        '<button class="qchip' + (depth ? '' : ' on') + '" data-crumb="0" ' + (depth ? '' : ' aria-current="true"') + '>' + (depth ? '' : icon('check')) + 'Todos</button>' +
        st.path.map((p, i) => '<button class="qchip' + (i === depth - 1 ? ' on' : '') + '" data-crumb="' + (i + 1) + '"' + (i === depth - 1 ? ' aria-current="true"' : '') + '>' + (i === depth - 1 ? icon('check') : '') + esc(p) + '</button>').join('') + '</div>' +
        (kidList.length ? '<div class="nt-row"><span class="nt-lab">' + (['Grande área', 'Especialidade', 'Tema', 'Subtema'][depth] || 'Mais') + '</span>' +
          kidList.map(([k, n]) => '<button class="qchip" data-add="' + esc(k) + '">' + esc(k) + ' <b class="qn">' + n + '</b></button>').join('') + '</div>' : '');

      $('#nt-list', root).innerHTML = list.length ? '<div class="nt-grid">' + list.map(x => {
        const q = x.q;
        return '<article class="nt-card"><header class="nt-meta">' + (q ? '<span><b>' + esc(q.codigo || '') + '</b>' + [q.instituicao, q.ano].filter(Boolean).map(t => ' · ' + esc(t)).join('') + '</span>' : '<span>Questão removida</span>') +
          '<span>' + MQ.fmtDate(x.n.updatedAt) + '</span></header>' +
          (x.path.length ? '<div class="nt-path">' + esc(x.path.join(' › ')) + '</div>' : '') +
          (q ? '<p class="nt-q">' + esc(MQ.plain(q.enunciado).slice(0, 160)) + '</p>' : '') +
          '<div class="nt-text">' + esc(x.n.text) + '</div>' +
          '<footer class="nt-foot">' + (q ? '<button class="btn sm" data-act="open" data-q="' + esc(x.qid) + '">' + icon('play') + 'Abrir questão</button>' : '') +
          '<button class="btn sm" data-act="edit" data-q="' + esc(x.qid) + '">' + icon('edit') + 'Editar</button>' +
          '<button class="icon-btn" data-act="del" data-q="' + esc(x.qid) + '" aria-label="Excluir anotação" title="Excluir anotação">' + icon('trash') + '</button></footer></article>';
      }).join('') + '</div>'
        : '<div class="empty"><h2>Nenhuma anotação neste filtro</h2><p>Tente outro assunto ou limpe a busca.</p><button class="btn" data-act="clear">Limpar filtros</button></div>';
    }

    root.onclick = async e => {
      const t = e.target;
      const cr = t.closest('[data-crumb]');
      if (cr) { st.path = st.path.slice(0, +cr.dataset.crumb); paint(); return; }
      const ad = t.closest('[data-add]');
      if (ad) { st.path = st.path.concat(ad.dataset.add); paint(); return; }
      const b = t.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'clear') { st.path = []; st.text = ''; $('#nt-q', root).value = ''; paint(); return; }
      const x = all.find(y => y.qid === b.dataset.q);
      if (!x) return;
      if (b.dataset.act === 'open') {
        st.scroll = window.scrollY;
        window.addEventListener('hashchange', function once() { // rolagem guardada só vale para a volta de "Abrir questão"
          if (/^#\/resolver/.test(location.hash)) return; // continua até sair do Resolver
          window.removeEventListener('hashchange', once);
          if (!/^#\/anotacoes/.test(location.hash)) st.scroll = 0;
        });
        const ids = all.filter(y => y.q && matches(y, MQ.norm(st.text))).map(y => y.qid);
        MQ.openSolve({ title: 'Anotações', qids: ids, ctx: 'banco', startIndex: Math.max(0, ids.indexOf(x.qid)) });
      } else if (b.dataset.act === 'edit') editDialog(x, () => MQ.render());
      else if (b.dataset.act === 'del') {
        const resumo = x.n.text.trim().replace(/\s+/g, ' ');
        const nome = ((x.q && x.q.codigo) || 'sem código') + ': “' + resumo.slice(0, 60) + (resumo.length > 60 ? '…' : '') + '”';
        if (await MQ.confirm('Excluir anotação', 'Excluir a anotação de ' + nome + '?', 'Excluir', true)) {
          const texto = x.n.text;
          MQ.saveNote(x.qid, ''); MQ.render();
          MQ.toast('Anotação excluída.', '', { label: 'Desfazer', fn: () => { MQ.saveNote(x.qid, texto); MQ.render(); } });
        }
      }
    };
    let timer = 0;
    $('#nt-q', root).addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { st.text = e.target.value.trim(); paint(); }, 200); });
    paint();
    const top = $('#nt-top', root);
    if (st.onScroll) window.removeEventListener('scroll', st.onScroll);
    st.onScroll = () => { if (!top.isConnected) { window.removeEventListener('scroll', st.onScroll); return; } top.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', st.onScroll, { passive: true });
    top.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    if (st.scroll) { const y = st.scroll; st.scroll = 0; setTimeout(() => window.scrollTo(0, y), 0); } // volta de "Abrir questão" ao mesmo ponto
  };
})(window.MQ);
