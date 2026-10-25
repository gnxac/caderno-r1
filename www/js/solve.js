/* Caderno R1 — resolver questões (modo estudo, com correção na hora) */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  MQ.session = null;

  MQ.openSolve = function (opts) {
    if (!opts.qids || !opts.qids.length) { MQ.toast('Nenhuma questão para abrir.'); return; }
    MQ.session = {
      title: opts.title || 'Questões', qids: opts.qids.slice(), ctx: opts.ctx || 'banco', listId: opts.listId || null,
      idx: Math.min(opts.startIndex || 0, opts.qids.length - 1), sel: {}, revealed: {}, cut: {}, showTopics: false, showHist: {},
      showIndex: window.innerWidth > 1100, shownAt: Date.now()
    };
    if (location.hash === '#/resolver') MQ.render(); else location.hash = '#/resolver';
  };

  MQ.openList = function (listId) {
    const l = MQ.get('lists', listId);
    if (!l) { MQ.toast('Lista não encontrada.'); return; }
    const qids = l.qids.filter(id => MQ.get('questions', id));
    if (!qids.length) { MQ.toast('Esta lista está vazia. Adicione questões pelo banco.'); return; }
    const prog = (MQ.local.progress || {})[listId] || 0;
    MQ.openSolve({ title: l.name, qids, ctx: 'lista:' + listId, listId, startIndex: prog });
  };

  function addToListMenu(anchor, qid) {
    const lists = MQ.alive('lists').filter(l => l.kind === 'lista').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
    const items = lists.map(l => ({
      label: (l.qids.includes(qid) ? '✓ ' : '') + l.name,
      onClick: () => {
        if (l.qids.includes(qid)) { MQ.toast('A questão já está em "' + l.name + '".'); return; }
        l.qids.push(qid); MQ.put('lists', l); MQ.toast('Adicionada a "' + l.name + '".');
      }
    }));
    if (items.length) items.push('-');
    items.push({ label: 'Nova lista com esta questão…', onClick: () => MQ.createListModal([qid]) });
    MQ.menu(anchor, items);
  }

  function statusIn(ctx) {
    return MQ.latestByQ(ctx);
  }

  MQ.views.resolver = function (root) {
    const s = MQ.session;
    if (!s) { location.hash = '#/questoes'; return; }
    const qid = s.qids[s.idx];
    const q = MQ.get('questions', qid);
    const n = s.qids.length;
    const latestCtx = statusIn(s.ctx);
    const hist = (MQ.attemptsByQ()[qid] || []);
    const revealed = !!s.revealed[qid];
    const chosen = s.sel[qid];
    const cut = s.cut[qid] || (s.cut[qid] = []);
    if (s.listId) { MQ.local.progress = MQ.local.progress || {}; MQ.local.progress[s.listId] = s.idx; MQ.saveLocal(); }

    let body;
    if (!q) {
      body = '<div class="qcard"><p class="muted">Esta questão foi excluída.</p></div>';
    } else {
      const tags = [q.instituicao, q.ano, q.finalidade].filter(Boolean).map(t => '<span class="tag">' + esc(t) + '</span>').join('') +
        (q.anulada ? '<span class="tag warn">Anulada</span>' : '') + (q.desatualizada ? '<span class="tag warn">Desatualizada</span>' : '');
      const alts = (q.alternativas || []).map(a => {
        let cls = 'alt';
        if (revealed) {
          if (a.l === q.gabarito) cls += ' right';
          else if (a.l === chosen) cls += ' wrong';
        } else if (a.l === chosen) cls += ' sel';
        if (cut.includes(a.l)) cls += ' cut-on';
        return '<div class="' + cls + '" role="button" tabindex="0" data-alt="' + esc(a.l) + '"' + (revealed ? ' aria-disabled="true"' : '') + ' aria-pressed="' + (a.l === chosen) + '">' +
          '<span class="letter">' + esc(a.l) + '</span><span class="txt">' + MQ.para(a.t) + (a.img ? MQ.imgHtml(a.img, 'Imagem da alternativa ' + a.l) : '') + '</span>' +
          (revealed ? '<span></span>' : '<button class="icon-btn cut" data-cut="' + esc(a.l) + '" aria-label="Riscar alternativa ' + esc(a.l) + '" title="Riscar alternativa">' + icon('scissors') + '</button>') +
          '</div>';
      }).join('');
      let verdict = '';
      if (revealed && chosen) {
        verdict = chosen === q.gabarito
          ? '<span class="verdict ok">' + icon('check') + ' Você acertou</span>'
          : '<span class="verdict err">' + icon('x') + ' Você marcou ' + esc(chosen) + '. Gabarito: ' + esc(q.gabarito) + '</span>';
      } else if (revealed) verdict = '<span class="verdict">Gabarito: ' + esc(q.gabarito) + '</span>';

      const histHtml = s.showHist[qid] ? '<div class="history">' + (hist.length ? hist.slice().reverse().map(a =>
        '<div><span>' + MQ.fmtDateTime(a.ts) + '</span><span>marcou ' + esc(a.choice) + '</span><b style="color:var(--' + (a.correct ? 'ok' : 'err') + ')">' + (a.correct ? 'certo' : 'errado') + '</b><span class="muted">' + esc(ctxLabel(a.ctx)) + '</span></div>').join('') : 'Você ainda não respondeu esta questão.') + '</div>' : '';

      body = '<article class="qcard" aria-label="Questão ' + (s.idx + 1) + '">' +
        '<div class="qmeta"><span class="num">Questão ' + (s.idx + 1) + '</span>' + tags +
        '<div class="qtools">' +
        '<button class="icon-btn" id="q-add" title="Adicionar a uma lista" aria-label="Adicionar a uma lista">' + icon('plus') + '</button>' +
        '<button class="icon-btn" id="q-topics" title="Mostrar assunto" aria-label="Mostrar assunto" aria-pressed="' + s.showTopics + '">' + icon('tag') + '</button>' +
        '<button class="icon-btn" id="q-edit" title="Editar questão" aria-label="Editar questão">' + icon('edit') + '</button>' +
        '</div></div>' +
        '<div class="qcode"><span>' + esc(q.codigo || '') + '</span><button id="q-hist">' + icon('history') + (s.showHist[qid] ? 'Ocultar histórico' : 'Histórico de respostas (' + hist.length + ')') + '</button></div>' +
        histHtml +
        (s.showTopics ? '<div class="topics">' + esc(MQ.qPath(q).join(' › ') || 'Sem assunto definido') + '</div>' : '') +
        '<div class="stem">' + MQ.para(q.enunciado) + (q.imagens || []).map(id => MQ.imgHtml(id)).join('') + '</div>' +
        '<div class="alts" role="group" aria-label="Alternativas">' + alts + '</div>' +
        '<div class="answer-row">' +
        (revealed ? verdict : '<button class="btn primary" id="q-answer"' + (chosen ? '' : ' disabled') + '>Responder</button>' +
          '<button class="btn ghost" id="q-reveal">Ver gabarito sem responder</button>' +
          (chosen ? '' : '<span class="muted small">Escolha uma alternativa (teclas A–E)</span>')) +
        '</div>' +
        (revealed ? '<section class="comment"><h3>Comentário</h3><div class="body">' + (q.comentario ? MQ.para(q.comentario) : '<p class="muted">Sem comentário cadastrado. Você pode escrever um em Editar questão.</p>') + '</div></section>' : '') +
        '</article>';
    }

    const idxHtml = s.showIndex ? '<aside class="qindex" aria-label="Índice de questões"><h3>' + n + ' questões</h3><div class="qindex-grid">' +
      s.qids.map((id, i) => {
        const a = latestCtx[id];
        let cls = i === s.idx ? 'cur' : '';
        if (a) cls += a.correct ? ' ok' : ' bad';
        return '<button class="' + cls + '" data-go="' + i + '" aria-label="Questão ' + (i + 1) + (a ? (a.correct ? ', acertou' : ', errou') : '') + '">' + (i + 1) + '</button>';
      }).join('') + '</div><div class="legend"><span><i style="background:var(--ok-soft);border-color:var(--ok)"></i>acertou</span><span><i style="background:var(--err-soft);border-color:var(--err)"></i>errou</span></div></aside>' : '';

    root.innerHTML =
      '<div class="solve-bar">' +
      '<div style="display:flex;align-items:center;gap:8px;min-width:0"><button class="icon-btn" id="q-back" aria-label="Voltar">' + icon('left') + '</button><span class="title">' + esc(s.title) + '</span></div>' +
      '<div class="toolbar">' +
      '<span class="pager"><button class="icon-btn" id="q-prev" aria-label="Questão anterior"' + (s.idx === 0 ? ' disabled' : '') + '>' + icon('left') + '</button>' +
      '<input type="number" id="q-page" min="1" max="' + n + '" value="' + (s.idx + 1) + '" aria-label="Ir para a questão"><span class="muted">de ' + n + '</span>' +
      '<button class="icon-btn" id="q-next" aria-label="Próxima questão"' + (s.idx >= n - 1 ? ' disabled' : '') + '>' + icon('right') + '</button></span>' +
      '<button class="icon-btn" id="q-fminus" title="Diminuir letra" aria-label="Diminuir letra">' + icon('textdown') + '</button>' +
      '<button class="icon-btn" id="q-fplus" title="Aumentar letra" aria-label="Aumentar letra">' + icon('textup') + '</button>' +
      '<button class="icon-btn" id="q-index" title="Índice" aria-label="Mostrar índice" aria-pressed="' + s.showIndex + '">' + icon('grid') + '</button>' +
      (s.listId ? '<button class="icon-btn" id="q-print" title="Imprimir lista" aria-label="Imprimir lista">' + icon('printer') + '</button>' : '') +
      '</div></div>' +
      '<div class="solve-wrap screen-only' + (s.showIndex ? ' with-index' : '') + '"><div>' + body +
      '<div class="qnav"><button class="btn" id="q-prev2"' + (s.idx === 0 ? ' disabled' : '') + '>' + icon('left') + ' Anterior</button>' +
      '<button class="btn" id="q-next2"' + (s.idx >= n - 1 ? ' disabled' : '') + '>Próxima ' + icon('right') + '</button></div></div>' + idxHtml + '</div>' +
      '<div class="print-only" id="print-area"></div>';

    function go(i) {
      if (i < 0 || i >= n) return;
      s.idx = i; s.shownAt = Date.now(); MQ.render(); window.scrollTo(0, 0);
    }
    $('#q-back', root).onclick = () => { history.length > 1 ? history.back() : (location.hash = '#/questoes'); };
    $('#q-prev', root).onclick = () => go(s.idx - 1);
    $('#q-next', root).onclick = () => go(s.idx + 1);
    $('#q-prev2', root).onclick = () => go(s.idx - 1);
    $('#q-next2', root).onclick = () => go(s.idx + 1);
    $('#q-page', root).onchange = e => go(Math.max(1, Math.min(n, parseInt(e.target.value, 10) || 1)) - 1);
    $('#q-fplus', root).onclick = () => MQ.setFontScale((MQ.local.fontScale || 1) + 0.08);
    $('#q-fminus', root).onclick = () => MQ.setFontScale((MQ.local.fontScale || 1) - 0.08);
    $('#q-index', root).onclick = () => { s.showIndex = !s.showIndex; MQ.render(); };
    if ($('#q-print', root)) $('#q-print', root).onclick = () => printList(s);
    $$('[data-go]', root).forEach(b => b.onclick = () => go(parseInt(b.dataset.go, 10)));
    if (!q) return;

    $('#q-add', root).onclick = e => addToListMenu(e.currentTarget, qid);
    $('#q-topics', root).onclick = () => { s.showTopics = !s.showTopics; MQ.render(); };
    $('#q-edit', root).onclick = () => { location.hash = '#/cadastrar/' + qid; };
    $('#q-hist', root).onclick = () => { s.showHist[qid] = !s.showHist[qid]; MQ.render(); };

    $$('[data-alt]', root).forEach(el => {
      const pick = () => {
        if (revealed) return;
        const l = el.dataset.alt;
        if (cut.includes(l)) return;
        s.sel[qid] = s.sel[qid] === l ? undefined : l;
        MQ.render();
      };
      el.addEventListener('click', e => { if (e.target.closest('[data-cut]')) return; pick(); });
      el.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(); } });
    });
    $$('[data-cut]', root).forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const l = b.dataset.cut;
      const i = cut.indexOf(l);
      if (i >= 0) cut.splice(i, 1); else { cut.push(l); if (s.sel[qid] === l) s.sel[qid] = undefined; }
      MQ.render();
    }));
    const ans = $('#q-answer', root);
    if (ans) ans.onclick = answer;
    const rev = $('#q-reveal', root);
    if (rev) rev.onclick = () => { s.revealed[qid] = true; MQ.render(); };

    function answer() {
      const c = s.sel[qid];
      if (!c || s.revealed[qid]) return;
      MQ.recordAttempt(qid, c, s.ctx, (Date.now() - s.shownAt) / 1000);
      s.revealed[qid] = true;
      MQ.render();
    }
    MQ.keyHandler = function (e) {
      if (e.target.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('.modal-back, .popmenu')) return;
      const k = e.key.toUpperCase();
      if (/^[A-E]$/.test(k) && !s.revealed[qid] && (q.alternativas || []).some(a => a.l === k) && !cut.includes(k)) { s.sel[qid] = k; MQ.render(); }
      else if (e.key === 'Enter' && s.sel[qid] && !s.revealed[qid]) { e.preventDefault(); answer(); }
      else if (e.key === 'ArrowRight') go(s.idx + 1);
      else if (e.key === 'ArrowLeft') go(s.idx - 1);
    };
  };

  function ctxLabel(ctx) {
    if (!ctx || ctx === 'banco') return 'banco';
    const [t, id] = ctx.split(':');
    const l = MQ.data.lists[id];
    const name = l && !l.deleted ? l.name : 'excluída';
    return (t === 'sim' ? 'simulado ' : 'lista ') + name;
  }
  MQ.ctxLabel = ctxLabel;

  function printList(s) {
    const area = $('#print-area');
    const qs = s.qids.map(id => MQ.get('questions', id)).filter(Boolean);
    area.innerHTML = '<h1>' + esc(s.title) + '</h1><p>' + qs.length + ' questões</p>' +
      qs.map((q, i) => '<div class="pq"><h4>Questão ' + (i + 1) + ' — ' + esc([q.instituicao, q.ano].filter(Boolean).join(', ')) + '</h4>' +
        MQ.para(q.enunciado) + (q.imagens || []).map(id => MQ.imgHtml(id)).join('') + (q.alternativas || []).map(a => '<div>(' + esc(a.l) + ') ' + esc(a.t) + (a.img ? MQ.imgHtml(a.img) : '') + '</div>').join('') + '</div>').join('') +
      '<div style="break-before:page"><h2>Gabarito</h2><p>' + qs.map((q, i) => (i + 1) + '-' + esc(q.gabarito)).join('&nbsp;&nbsp; ') + '</p></div>';
    window.print();
  }

  MQ.setFontScale = function (v) {
    v = Math.max(0.8, Math.min(1.6, v));
    MQ.local.fontScale = v; MQ.saveLocal();
    document.documentElement.style.setProperty('--font-scale', v);
  };
})(window.MQ);
