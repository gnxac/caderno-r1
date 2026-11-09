/* Caderno R1 — resolver questões (modo estudo, com correção na hora) */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  MQ.session = null;

  MQ.openSolve = function (opts) {
    if (!opts.qids || !opts.qids.length) { MQ.toast('Nenhuma questão para abrir.'); return; }
    MQ.session = {
      title: opts.title || 'Questões', qids: opts.qids.slice(), ctx: opts.ctx || 'banco', listId: opts.listId || null,
      idx: Math.min(opts.startIndex || 0, opts.qids.length - 1), sel: {}, revealed: {}, cut: {}, hideBanner: {}, showTopics: false, showHist: {},
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

    let body, banner = '';
    if (!q) {
      body = '<div class="qcard"><p class="muted">Esta questão foi excluída.</p></div>';
    } else {
      const meta = [q.instituicao, q.ano, q.finalidade].filter(Boolean).map(esc).join(' · ');
      const tags = (meta ? '<span class="qmeta">' + meta + '</span>' : '') +
        (q.anulada ? '<span class="tag pill warn">Anulada</span>' : '') + (q.desatualizada ? '<span class="tag pill warn">Desatualizada</span>' : '');
      const alts = (q.alternativas || []).map(a => {
        let cls = 'alt';
        if (revealed) {
          if (a.l === q.gabarito) cls += ' right';
          else if (a.l === chosen) cls += ' wrong';
        } else if (a.l === chosen) cls += ' sel';
        if (cut.includes(a.l)) cls += ' cut-on';
        return '<div class="' + cls + '" role="button" tabindex="0" data-alt="' + esc(a.l) + '"' + (revealed ? ' aria-disabled="true"' : '') + ' aria-pressed="' + (a.l === chosen) + '">' +
          '<span class="letter">' + esc(a.l) + '</span><span class="txt"><span data-mk="' + esc(a.l) + '">' + MQ.para(a.t) + '</span>' + (a.img ? MQ.imgHtml(a.img, 'Imagem da alternativa ' + a.l) : '') + '</span>' +
          (revealed ? '<span></span>' : '<button class="icon-btn cut" data-cut="' + esc(a.l) + '" aria-pressed="' + cut.includes(a.l) + '" aria-label="' + (cut.includes(a.l) ? 'Trazer de volta' : 'Descartar') + ' a alternativa ' + esc(a.l) + '" title="' + (cut.includes(a.l) ? 'Trazer de volta' : 'Descartar alternativa') + '">' + icon('scissors') + '</button>') +
          '</div>';
      }).join('');
      const histHtml = s.showHist[qid] ? '<div class="history">' + (hist.length ? hist.slice().reverse().map(a =>
        '<div><span>' + MQ.fmtDateTime(a.ts) + '</span><span>marcou ' + esc(a.choice) + '</span><b style="color:var(--' + (a.correct ? 'ok' : 'err') + ')">' + (a.correct ? 'certo' : 'errado') + '</b><span class="muted">' + esc(ctxLabel(a.ctx)) + '</span></div>').join('') : 'Você ainda não respondeu esta questão.') + '</div>' : '';

      const hasMk = MQ.hasMarks(qid);
      body = '<article class="qcard" aria-label="Questão ' + (s.idx + 1) + '">' +
        '<div class="qrow" role="toolbar" aria-label="Ferramentas da questão">' +
        '<button class="qb" id="q-add" title="Adicionar a uma lista" aria-label="Adicionar a uma lista">' + icon('plus') + '<span>Lista</span></button>' +
        '<button class="qb" id="q-topics" title="Mostrar assunto" aria-label="Mostrar assunto" aria-pressed="' + s.showTopics + '">' + icon('tag') + '<span>Assunto</span></button>' +
        '<button class="icon-btn" id="q-fminus" title="Diminuir letra" aria-label="Diminuir letra">' + icon('textdown') + '</button>' +
        '<button class="icon-btn" id="q-fplus" title="Aumentar letra" aria-label="Aumentar letra">' + icon('textup') + '</button>' +
        '<button class="qb" id="q-sol" title="Solução e comentário" aria-label="Ir para a solução">' + icon('bulb') + '<span>Solução</span></button>' +
        '<button class="qb" id="q-unmark" title="Apagar marcações desta questão" aria-label="Apagar marcações desta questão"' + (hasMk ? '' : ' disabled') + '>' + icon('eraser') + '<span>Limpar marcas</span></button>' +
        (MQ.isAdmin() ? '<button class="qb" id="q-edit" title="Editar questão" aria-label="Editar questão">' + icon('edit') + '<span>Editar</span></button>' : '') +
        '</div>' +
        '<div class="qchips">' + tags + '</div>' +
        '<div class="qcode"><span>' + esc(q.codigo || '') + '</span><button id="q-hist">' + icon('history') + (s.showHist[qid] ? 'Ocultar histórico' : 'Histórico de respostas (' + hist.length + ')') + '</button></div>' +
        histHtml +
        (s.showTopics ? '<div class="topics">' + esc(MQ.qPath(q).join(' › ') || 'Sem assunto definido') + '</div>' : '') +
        '<div class="stem"><div data-mk="stem">' + MQ.para(q.enunciado) + '</div>' + (q.imagens || []).map(id => MQ.imgHtml(id)).join('') + '</div>' +
        '<div class="alts" role="group" aria-label="Alternativas">' + alts + '</div>' +
        (revealed ? '<section class="comment" id="q-comment"><h3>Solução em texto</h3><div class="gab">GABARITO: ALTERNATIVA ' + esc(q.gabarito) + '</div><div class="body">' + (q.comentario ? MQ.para(q.comentario) : '<p class="muted">Sem comentário para esta questão.</p>') + '</div></section>' : '') +
        '</article>';
      if (revealed && chosen && !s.hideBanner[qid]) {
        const okk = chosen === q.gabarito;
        banner = '<div class="answer-banner ' + (okk ? 'ok' : 'err') + '" role="status">' + icon(okk ? 'check' : 'alert') +
          '<span>' + (okk ? 'Resposta correta!' : 'Resposta errada! Alternativa correta: ' + esc(q.gabarito)) + '</span>' +
          '<button class="icon-btn" id="q-banner-x" aria-label="Fechar aviso">' + icon('x') + '</button></div>';
      }
    }

    const idxHtml = s.showIndex ? '<aside class="qindex" aria-label="Índice de questões"><h3>' + n + ' questões</h3><div class="qindex-grid">' +
      s.qids.map((id, i) => {
        const a = latestCtx[id];
        let cls = i === s.idx ? 'cur' : '';
        if (a) cls += a.correct ? ' ok' : ' bad';
        return '<button class="' + cls + '" data-go="' + i + '" aria-label="Questão ' + (i + 1) + (a ? (a.correct ? ', acertou' : ', errou') : '') + '">' + (i + 1) + '</button>';
      }).join('') + '</div><div class="legend"><span><i style="background:var(--ok-soft);border-color:var(--ok)"></i>acertou</span><span><i style="background:var(--err-soft);border-color:var(--err)"></i>errou</span></div></aside>' : '';

    const last = s.idx >= n - 1;
    root.innerHTML =
      '<div class="solve-bar">' +
      '<div class="sb-left"><button class="icon-btn" id="q-back" aria-label="Voltar">' + icon('arrowleft') + '</button><span class="title">Questão ' + (s.idx + 1) + '<small>' + esc(s.title) + '</small></span></div>' +
      '<div class="toolbar">' +
      '<span class="pager"><input type="number" id="q-page" min="1" max="' + n + '" value="' + (s.idx + 1) + '" aria-label="Ir para a questão"><span class="muted">de ' + n + '</span></span>' +
      '<button class="icon-btn" id="q-index" title="Índice" aria-label="Mostrar índice" aria-pressed="' + s.showIndex + '">' + icon('grid') + '</button>' +
      (s.listId ? '<button class="icon-btn" id="q-print" title="Imprimir lista" aria-label="Imprimir lista">' + icon('printer') + '</button>' : '') +
      '</div></div>' + banner +
      '<div class="solve-wrap screen-only' + (s.showIndex ? ' with-index' : '') + '"><div>' + body +
      '<div class="solve-foot"><div class="sf-count">' + (s.idx + 1) + ' de ' + n + '<span class="hide-m"> · escolha com o toque ou as teclas A–E</span></div>' +
      '<div class="sf-row"><button class="round" id="q-prev" aria-label="Questão anterior"' + (s.idx === 0 ? ' disabled' : '') + '>' + icon('left') + '</button>' +
      (revealed || !q
        ? '<button class="btn primary big" id="q-next-main"' + (last ? ' disabled' : '') + '>' + (last ? 'Fim da lista' : 'Próxima') + '</button>'
        : '<button class="btn primary big" id="q-answer"' + (chosen ? '' : ' disabled') + '>Responder</button>') +
      '<button class="round" id="q-next" aria-label="Próxima questão"' + (last ? ' disabled' : '') + '>' + icon('right') + '</button></div></div></div>' + idxHtml + '</div>' +
      '<div class="print-only" id="print-area"></div>';

    function go(i) {
      if (i < 0 || i >= n) return;
      s.idx = i; s.shownAt = Date.now(); MQ.render(); window.scrollTo(0, 0);
    }
    $('#q-back', root).onclick = () => { history.length > 1 ? history.back() : (location.hash = '#/questoes'); };
    $('#q-prev', root).onclick = () => go(s.idx - 1);
    $('#q-next', root).onclick = () => go(s.idx + 1);
    if ($('#q-next-main', root)) $('#q-next-main', root).onclick = () => go(s.idx + 1);
    if ($('#q-banner-x', root)) $('#q-banner-x', root).onclick = () => { s.hideBanner[qid] = true; $('.answer-banner', root).remove(); };
    $('#q-page', root).onchange = e => go(Math.max(1, Math.min(n, parseInt(e.target.value, 10) || 1)) - 1);
    $('#q-index', root).onclick = () => { s.showIndex = !s.showIndex; MQ.render(); };
    if ($('#q-print', root)) $('#q-print', root).onclick = () => printList(s);
    $$('[data-go]', root).forEach(b => b.onclick = () => go(parseInt(b.dataset.go, 10)));
    if (!q) return;

    $('#q-fplus', root).onclick = () => MQ.setFontScale((MQ.local.fontScale || 1) + 0.08);
    $('#q-fminus', root).onclick = () => MQ.setFontScale((MQ.local.fontScale || 1) - 0.08);
    $('#q-sol', root).onclick = () => {
      const c = $('#q-comment', root);
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); else MQ.toast('Responda a questão para ver a solução.');
    };
    $('#q-add', root).onclick = e => addToListMenu(e.currentTarget, qid);
    $('#q-topics', root).onclick = () => { s.showTopics = !s.showTopics; MQ.render(); };
    MQ.enableMarker(root, qid);
    if ($('#q-edit', root)) $('#q-edit', root).onclick = () => { location.hash = '#/cadastrar/' + qid; };
    if ($('#q-unmark', root)) $('#q-unmark', root).onclick = () => { MQ.clearMarks(qid); MQ.toast('Marcações apagadas.'); MQ.render(); };
    $('#q-hist', root).onclick = () => { s.showHist[qid] = !s.showHist[qid]; MQ.render(); };

    $$('[data-alt]', root).forEach(el => {
      const pick = () => {
        if (revealed || MQ.selectingIn(el)) return;
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
      else if (e.key === 'Enter' && s.revealed[qid]) { e.preventDefault(); go(s.idx + 1); }
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
