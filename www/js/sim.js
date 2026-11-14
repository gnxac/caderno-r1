/* Caderno R1 — simulados cronometrados */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;
  const MAX_Q = 1000;

  MQ.activeRun = function (listId) {
    return MQ.alive('runs').filter(r => r.listId === listId && r.status === 'andamento').sort((a, b) => b.startedAt - a.startedAt)[0] || null;
  };
  MQ.lastRun = function (listId) {
    return MQ.alive('runs').filter(r => r.listId === listId && r.status === 'concluido').sort((a, b) => b.finishedAt - a.finishedAt)[0] || null;
  };
  MQ.runScore = function (run) {
    const out = { total: run.qids.length, resp: 0, ok: 0, byArea: {} };
    run.qids.forEach(id => {
      const q = MQ.get('questions', id);
      const area = (q && q.area) || 'Sem área';
      const b = out.byArea[area] || (out.byArea[area] = { total: 0, resp: 0, ok: 0 });
      b.total++;
      const c = run.answers[id];
      if (c) { out.resp++; b.resp++; if (q && c === q.gabarito) { out.ok++; b.ok++; } }
    });
    return out;
  };

  MQ.simCreateModal = function (qids, defaultName) {
    const pool = qids.map(id => MQ.get('questions', id)).filter(Boolean);
    const byArea = {};
    pool.forEach(q => { const a = q.area || 'Sem área'; (byArea[a] = byArea[a] || []).push(q.id); });
    const areas = Object.keys(byArea).sort((a, b) => {
      const ia = MQ.AREAS.indexOf(a), ib = MQ.AREAS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'pt-BR');
    });
    // cota inicial: tudo, limitado a 1000 proporcionalmente
    const quota = {};
    const scale = pool.length > MAX_Q ? MAX_Q / pool.length : 1;
    areas.forEach(a => { quota[a] = Math.floor(byArea[a].length * scale); });

    function total() { return areas.reduce((s, a) => s + (quota[a] || 0), 0); }
    function rowsHtml() {
      return areas.map(a =>
        '<div class="opt" style="cursor:default"><span>' + esc(a) + ' <span class="muted small">(' + byArea[a].length + ' disponíveis)</span></span>' +
        '<span style="margin-left:auto;display:inline-flex;gap:4px;align-items:center">' +
        '<button class="icon-btn" data-dec="' + esc(a) + '" aria-label="Menos questões de ' + esc(a) + '">−</button>' +
        '<input type="number" min="0" max="' + byArea[a].length + '" value="' + quota[a] + '" data-q="' + esc(a) + '" style="width:76px;text-align:center" aria-label="Questões de ' + esc(a) + '">' +
        '<button class="icon-btn" data-inc="' + esc(a) + '" aria-label="Mais questões de ' + esc(a) + '">+</button></span></div>').join('');
    }

    MQ.modal({
      title: 'Criar simulado',
      wide: true,
      body:
        '<label class="field"><span>Nome do simulado</span><input type="text" id="s-name" maxlength="100" value="' + esc(defaultName || ('Simulado ' + MQ.fmtDate(Date.now()))) + '"></label>' +
        '<div class="row"><label class="field"><span>Salvar em</span><select id="s-folder">' + MQ.folderOptions(MQ.currentFolder) + '</select></label>' +
        '<label class="field"><span>Minutos por questão</span><input type="number" id="s-mpq" min="0.5" max="10" step="0.5" value="3"><small>Provas de residência costumam dar de 2,5 a 3,5 min.</small></label>' +
        '<label class="field"><span>Tempo total (minutos)</span><input type="number" id="s-total-min" min="1" max="6000"></label></div>' +
        '<h3 class="small" style="margin:4px 0 6px">Questões por grande área</h3><div id="s-rows">' + rowsHtml() + '</div>' +
        '<p class="small" style="margin-top:10px"><b id="s-total">' + total() + '</b> questões no simulado (máximo ' + MAX_Q + '). As questões de cada área são sorteadas.</p>',
      onOpen: box => {
        const mpq = $('#s-mpq', box), tmin = $('#s-total-min', box);
        let manualTime = false;
        function sync() {
          const t = total();
          $('#s-total', box).textContent = t;
          if (!manualTime) tmin.value = Math.max(1, Math.round(t * (parseFloat(mpq.value) || 3)));
        }
        sync();
        mpq.addEventListener('input', () => { manualTime = false; sync(); });
        tmin.addEventListener('input', () => { manualTime = true; });
        box.addEventListener('click', e => {
          const d = e.target.closest('[data-dec]'), i = e.target.closest('[data-inc]');
          const a = d ? d.dataset.dec : i ? i.dataset.inc : null;
          if (!a) return;
          quota[a] = Math.max(0, Math.min(byArea[a].length, (quota[a] || 0) + (d ? -1 : 1)));
          box.querySelector('[data-q="' + CSS.escape(a) + '"]').value = quota[a];
          sync();
        });
        box.addEventListener('input', e => {
          const a = e.target.dataset.q;
          if (!a) return;
          quota[a] = Math.max(0, Math.min(byArea[a].length, parseInt(e.target.value, 10) || 0));
          sync();
        });
      },
      actions: [
        { label: 'Cancelar', kind: 'ghost' },
        { label: 'Criar simulado', kind: 'primary', onClick: (close, box) => {
          const name = $('#s-name', box).value.trim();
          const t = total();
          if (!name) { MQ.toast('Dê um nome ao simulado.'); return false; }
          if (!t) { MQ.toast('Escolha pelo menos uma questão.'); return false; }
          if (t > MAX_Q) { MQ.toast('O simulado pode ter no máximo ' + MAX_Q + ' questões.'); return false; }
          let chosen = [];
          areas.forEach(a => { chosen = chosen.concat(MQ.shuffle(byArea[a]).slice(0, quota[a] || 0)); });
          chosen = MQ.shuffle(chosen);
          const durationMin = Math.max(1, parseInt($('#s-total-min', box).value, 10) || t * 3);
          MQ.local.listTab = 'simulados'; MQ.saveLocal(); // o simulado novo precisa aparecer
          const l = MQ.put('lists', { id: MQ.uid(), kind: 'simulado', name, folderId: $('#s-folder', box).value || null, qids: chosen, durationMin });
          setTimeout(() => {
            MQ.confirm('Simulado criado', name + ': ' + chosen.length + ' questões, ' + durationMin + ' minutos. Começar agora? O cronômetro dispara assim que você começar.', 'Começar agora')
              .then(ok => { if (ok) MQ.startOrResume(l.id); else { MQ.currentFolder = l.folderId; location.hash = '#/listas'; } });
          }, 50);
        } }
      ]
    });
  };

  MQ.startOrResume = function (listId) {
    const l = MQ.get('lists', listId);
    if (!l) return;
    let run = MQ.activeRun(listId);
    if (!run) {
      const qids = l.qids.filter(id => MQ.get('questions', id));
      if (!qids.length) { MQ.toast('Este simulado não tem questões válidas.'); return; }
      run = MQ.put('runs', { id: MQ.uid(), listId, qids, startedAt: MQ.now(), durationMin: l.durationMin || qids.length * 3, answers: {}, flags: [], status: 'andamento', idx: 0 });
    }
    location.hash = '#/simulado/' + run.id;
  };

  function remainingMs(run) { return run.startedAt + run.durationMin * 60000 - Date.now(); }

  /* Tempo por questão: soma o tempo em que cada questão ficou na tela (run.times, em segundos) */
  let viewing = null;
  const MAX_CHUNK = 600; // shortcut: tela parada mais de 10 min (app em segundo plano) conta só 10 min; trocar por visibilitychange se incomodar
  function countTime(run, now) {
    if (!viewing || viewing.run !== run.id) return;
    const times = run.times || (run.times = {});
    times[viewing.qid] = (times[viewing.qid] || 0) + Math.min(Math.max(0, (now - viewing.at) / 1000), MAX_CHUNK);
  }
  /* Saiu do simulado sem terminar: guarda o tempo até aqui e para de contar */
  window.addEventListener('hashchange', () => {
    if (!viewing || location.hash.startsWith('#/simulado/' + viewing.run)) return;
    const run = MQ.get('runs', viewing.run);
    if (run && run.status === 'andamento') { countTime(run, Date.now()); MQ.put('runs', run); }
    viewing = null;
  });

  MQ.finishRun = function (run) {
    if (run.status !== 'andamento') return;
    run.status = 'concluido';
    run.finishedAt = Math.min(Date.now(), run.startedAt + run.durationMin * 60000);
    countTime(run, run.finishedAt);
    if (viewing && viewing.run === run.id) viewing = null;
    MQ.put('runs', run);
    const ctx = 'sim:' + run.listId;
    const times = run.times || {};
    Object.keys(run.answers).forEach(qid => {
      const q = MQ.get('questions', qid);
      if (!q || !run.answers[qid]) return;
      MQ.reviewUpdate(MQ.put('attempts', { id: MQ.uid(), qid, choice: run.answers[qid], correct: run.answers[qid] === q.gabarito, ctx, ts: run.finishedAt, timeSec: times[qid] ? Math.round(times[qid]) : null, runId: run.id, device: MQ.local.deviceId }));
    });
  };


  /* ---------- Provas por instituição/ano (a tela Listas chama estas duas) ---------- */
  MQ.provaPresets = function () {
    const g = {};
    MQ.alive('questions').forEach(q => {
      if (!q.instituicao || !q.ano) return;
      const k = q.instituicao + '|' + q.ano;
      (g[k] = g[k] || { key: k, instituicao: q.instituicao, ano: q.ano, qs: [] }).qs.push(q);
    });
    return Object.keys(g).map(k => g[k]).filter(x => x.qs.length >= 10).map(x => {
      const qids = MQ.sortQuestions(x.qs).map(q => q.id).slice(0, MAX_Q); // mesmo limite dos simulados comuns
      return { key: x.key, instituicao: x.instituicao, ano: x.ano, qids, count: qids.length, minutes: qids.length * 3 };
    }).sort((a, b) => (Number(b.ano) - Number(a.ano)) || String(a.instituicao).localeCompare(String(b.instituicao), 'pt-BR'));
  };
  MQ.provaDialog = function (preset) {
    MQ.modal({
      title: 'Modo prova',
      body: '<p><b>' + esc(preset.instituicao) + ' ' + esc(preset.ano) + '</b> · ' + preset.count + ' questões, na ordem do banco.</p>' +
        '<label class="field"><span>Minutos por questão</span><input type="number" id="p-mpq" min="0.5" max="10" step="0.5" value="3"></label>' +
        '<p class="small">Tempo total: <b id="p-total" style="font-variant-numeric:tabular-nums"></b></p>',
      onOpen: box => {
        const inp = $('#p-mpq', box);
        const sync = () => { $('#p-total', box).textContent = Math.max(1, Math.round(preset.count * (parseFloat(inp.value) || 3))) + ' min'; };
        sync(); inp.addEventListener('input', sync);
      },
      actions: [
        { label: 'Cancelar', kind: 'ghost' },
        { label: 'Começar prova', kind: 'primary', onClick: (close, box) => {
          const mpq = Math.min(10, Math.max(0.5, parseFloat($('#p-mpq', box).value) || 3));
          const durationMin = Math.max(1, Math.round(preset.count * mpq));
          let l = MQ.alive('lists').find(x => x.kind === 'simulado' && x.prova === preset.key);
          if (l) l = MQ.put('lists', Object.assign({}, l, { qids: preset.qids.slice(), durationMin }));
          else l = MQ.put('lists', { id: MQ.uid(), kind: 'simulado', name: preset.instituicao + ' ' + preset.ano + ' — prova', folderId: null, qids: preset.qids.slice(), durationMin, prova: preset.key });
          MQ.startOrResume(l.id);
        } }
      ]
    });
  };

  /* ---------- Cartão-resposta ---------- */
  function sheetCell(run, i, idx, mode) {
    const id = run.qids[i], a = run.answers[id], fl = run.flags.includes(id);
    let cls = 'sc', lab = 'Questão ' + (i + 1);
    if (mode === 'res') {
      const q = MQ.get('questions', id);
      const right = a && q && a === q.gabarito;
      cls += !a ? ' blank' : right ? ' ok' : ' bad';
      lab += !a ? ', em branco' : right ? ', certa, letra ' + a : ', errada, letra ' + a;
    } else {
      if (a) { cls += ' ans'; lab += ', respondida, letra ' + a; } else lab += ', em branco';
      if (fl) { cls += ' flag'; lab += ', marcada para revisar'; }
      if (i === idx) { cls += ' cur'; lab += ', questão atual'; }
    }
    return '<button class="' + cls + '" data-' + (mode === 'res' ? 'rev' : 'go') + '="' + i + '" aria-label="' + esc(lab) + '"' + (mode !== 'res' && i === idx ? ' aria-current="true"' : '') + '><span class="n">' + (i + 1) + '</span><span class="l">' + (a ? esc(a) : '') + (mode === 'res' && a ? icon(cls.includes(' ok') ? 'check' : 'x') : fl ? icon('flag') : '') + '</span></button>';
  }
  function sheetHtml(run, idx) {
    const blank = run.qids.filter(id => !run.answers[id]).length;
    return '<div class="sc-grid">' + run.qids.map((_, i) => sheetCell(run, i, idx, 'sim')).join('') + '</div>' +
      '<p class="sc-sum small">' + blank + ' em branco · ' + run.flags.filter(id => run.qids.includes(id)).length + ' marcadas</p>' +
      '<button class="btn sm sc-next" data-nextblank' + (blank ? '' : ' disabled') + '>Ir para a próxima em branco</button>';
  }

  MQ.views.simulado = function (root, runId) {
    const run = MQ.get('runs', runId);
    if (!run) { root.innerHTML = '<div class="empty"><h2>Simulado não encontrado</h2><a class="btn" href="#/listas">Voltar às listas</a></div>'; return; }
    if (run.status !== 'andamento') { location.replace('#/resultado/' + run.id); return; }
    if (remainingMs(run) <= 0) { MQ.finishRun(run); MQ.toast('O tempo do simulado acabou.'); location.replace('#/resultado/' + run.id); return; }
    const l = MQ.data.lists[run.listId] || {};
    const n = run.qids.length;
    const idx = Math.min(run.idx || 0, n - 1);
    const qid = run.qids[idx];
    const now = Date.now();
    countTime(run, now);
    viewing = { run: run.id, qid, at: now };
    const q = MQ.get('questions', qid);
    const chosen = run.answers[qid];
    const flagged = run.flags.includes(qid);
    const cuts = run.cut || (run.cut = {});
    const cut = cuts[qid] || [];
    const answered = Object.keys(run.answers).filter(k => run.answers[k]).length;

    root.innerHTML =
      '<div class="solve-bar sim-top"><div style="display:flex;align-items:center;gap:8px;min-width:0"><button class="icon-btn" id="sim-exit" aria-label="Sair da prova (o tempo continua correndo)" title="Sair da prova (o tempo continua correndo)">' + icon('arrowleft') + '</button><span class="title">' + esc(l.name || 'Simulado') + '</span></div>' +
      '<div class="toolbar"><span class="sr-only" id="sim-live" role="status" aria-live="polite"></span><span class="timer" id="sim-timer" role="timer" aria-live="off" aria-label="Tempo restante">' + icon('clock') + '<span>' + MQ.fmtDuration(remainingMs(run) / 1000) + '</span></span>' +
      '<span class="muted small sc-count">' + answered + '/' + n + ' respondidas</span>' +
      '<button class="icon-btn" id="q-fminus" aria-label="Diminuir letra">' + icon('textdown') + '</button><button class="icon-btn" id="q-fplus" aria-label="Aumentar letra">' + icon('textup') + '</button>' +
      '<button class="btn primary" id="sim-finish">Finalizar</button></div></div>' +
      '<div class="sim-wrap"><div class="sim-main">' +
      (q ? '<article class="qcard"><div class="qmeta"><span class="num">Questão ' + (idx + 1) + ' de ' + n + '</span>' +
        [q.instituicao, q.ano].filter(Boolean).map(t => '<span class="tag">' + esc(t) + '</span>').join('') +
        '<div class="qtools">' + (MQ.hasMarks(qid) ? '<button class="icon-btn" id="q-unmark" title="Apagar marcações desta questão" aria-label="Apagar marcações desta questão">' + icon('eraser') + '</button>' : '') + '<button class="icon-btn" id="sim-flag" aria-pressed="' + flagged + '" title="Marcar para revisar (M)" aria-label="Marcar para revisar">' + icon('flag') + '</button></div></div>' +
        '<div class="stem" style="margin-top:12px"><div data-mk="stem">' + MQ.para(q.enunciado) + '</div>' + (q.imagens || []).map(id => MQ.imgHtml(id)).join('') + '</div>' +
        '<div class="alts" role="radiogroup" aria-label="Alternativas">' + (q.alternativas || []).map(a =>
          '<div class="alt' + (a.l === chosen ? ' sel' : '') + (cut.includes(a.l) ? ' cut-on' : '') + '" role="radio" tabindex="0" aria-checked="' + (a.l === chosen) + '" data-alt="' + esc(a.l) + '"><span class="letter">' + esc(a.l) + '</span><span class="txt"><span data-mk="' + esc(a.l) + '">' + MQ.para(a.t) + '</span>' + (a.img ? MQ.imgHtml(a.img, 'Imagem da alternativa ' + a.l) : '') + '</span>' +
          '<button class="icon-btn cut" data-cut="' + esc(a.l) + '" aria-pressed="' + cut.includes(a.l) + '" aria-label="' + (cut.includes(a.l) ? 'Trazer de volta' : 'Descartar') + ' a alternativa ' + esc(a.l) + '" title="' + (cut.includes(a.l) ? 'Trazer de volta' : 'Descartar alternativa') + '">' + icon('scissors') + '</button></div>').join('') +
        '</div>' + (chosen ? '<button class="btn ghost sm" id="sim-clear">Limpar resposta</button>' : '<span class="muted small">Sem correção até finalizar. Teclas A–E para marcar, M para marcar a questão.</span>') + '</article>'
        : '<div class="qcard"><p class="muted">Questão excluída.</p></div>') +
      '<div class="qnav"><button class="btn" id="sim-prev"' + (idx === 0 ? ' disabled' : '') + '>' + icon('left') + ' Anterior</button><button class="btn" id="sim-next">' + (idx >= n - 1 ? 'Finalizar' : 'Próxima ' + icon('right')) + '</button></div></div>' +
      '<aside class="sim-sheet" aria-label="Cartão-resposta"><h3>Cartão-resposta</h3>' + sheetHtml(run, idx) + '</aside></div>' +
      '<div class="sim-bar"><button class="btn" id="sim-card">Cartão <span class="tnum">' + (idx + 1) + '/' + n + '</span></button><button class="btn primary" id="sim-next2">' + (idx >= n - 1 ? 'Finalizar' : 'Próxima ' + icon('right')) + '</button></div>';

    function save() { MQ.put('runs', run); MQ.saveNow(); } // prova: cada resposta vai direto ao disco
    function go(i) { if (i < 0 || i >= n) return; run.idx = i; save(); MQ.render(); window.scrollTo(0, 0); }
    function pick(l) { if (cut.includes(l)) return; run.answers[qid] = run.answers[qid] === l ? undefined : l; if (!run.answers[qid]) delete run.answers[qid]; save(); MQ.render(); }
    if (q) MQ.enableMarker(root, qid);
    if ($('#q-unmark', root)) $('#q-unmark', root).onclick = () => { MQ.clearMarks(qid); MQ.toast('Marcações apagadas.'); MQ.render(); };
    $$('[data-cut]', root).forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const l = b.dataset.cut;
      const list = cuts[qid] || (cuts[qid] = []);
      const i = list.indexOf(l);
      if (i >= 0) list.splice(i, 1); else { list.push(l); if (run.answers[qid] === l) delete run.answers[qid]; }
      save(); MQ.render();
    }));
    $$('[data-alt]', root).forEach(el => {
      el.onclick = e => { if (e.target.closest('[data-cut]') || MQ.selectingIn(el)) return; pick(el.dataset.alt); };
      el.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); pick(el.dataset.alt); } };
    });
    $$('[data-go]', root).forEach(b => b.onclick = () => go(parseInt(b.dataset.go, 10)));
    function nextBlank() {
      for (let k = 1; k < n; k++) { const i = (idx + k) % n; if (!run.answers[run.qids[i]]) return i; }
      return -1;
    }
    $('[data-nextblank]', root).onclick = () => { const i = nextBlank(); if (i >= 0) go(i); };
    function openCard() {
      const m = MQ.modal({
        title: 'Cartão-resposta',
        body: sheetHtml(run, idx),
        onOpen: box => {
          $$('[data-go]', box).forEach(b => b.onclick = () => { m.close(); go(parseInt(b.dataset.go, 10)); });
          $('[data-nextblank]', box).onclick = () => { const i = nextBlank(); if (i >= 0) { m.close(); go(i); } };
        }
      });
    }
    $('#sim-card', root).onclick = openCard;
    $('#sim-next2', root).onclick = () => idx >= n - 1 ? askFinish() : go(idx + 1);
    $('#sim-exit', root).onclick = async () => {
      if (await MQ.confirm('Sair da prova', 'O tempo continua correndo. Você pode voltar pela tela de simulados enquanto houver tempo.', 'Sair') && MQ.get('runs', run.id).status === 'andamento') location.hash = '#/listas';
    };
    $('#sim-prev', root).onclick = () => go(idx - 1);
    $('#sim-next', root).onclick = () => idx >= n - 1 ? askFinish() : go(idx + 1);
    $('#q-fplus', root).onclick = () => MQ.setFontScale((MQ.local.fontScale || 1) + 0.08);
    $('#q-fminus', root).onclick = () => MQ.setFontScale((MQ.local.fontScale || 1) - 0.08);
    if ($('#sim-flag', root)) $('#sim-flag', root).onclick = () => {
      const i = run.flags.indexOf(qid);
      if (i >= 0) run.flags.splice(i, 1); else run.flags.push(qid);
      save(); MQ.render();
    };
    if ($('#sim-clear', root)) $('#sim-clear', root).onclick = () => { delete run.answers[qid]; save(); MQ.render(); };
    async function askFinish() {
      const blank = n - Object.keys(run.answers).filter(k => run.answers[k]).length;
      const ok = await MQ.confirm('Finalizar simulado', blank ? 'Ainda há ' + blank + ' questões em branco. Finalizar mesmo assim?' : 'Todas as questões foram respondidas. Finalizar e ver o resultado?', 'Finalizar');
      if (!ok) return;
      MQ.finishRun(run);
      location.replace('#/resultado/' + run.id);
    }
    $('#sim-finish', root).onclick = askFinish;

    const tEl = $('#sim-timer span', root);
    const warned = new Set();
    MQ.tick = setInterval(() => {
      const ms = remainingMs(run);
      if (ms <= 0) {
        clearInterval(MQ.tick);
        $$('.modal-x').forEach(b => b.click()); $$('.popmenu').forEach(m => m.remove()); // fecha pelo close() do modal, que destrava o fundo
        MQ.finishRun(run);
        const nr = Object.keys(run.answers).filter(k => run.answers[k]).length;
        MQ.toast('Tempo esgotado. ' + (nr === 1 ? 'Sua 1 resposta foi salva.' : 'Suas ' + nr + ' respostas foram salvas.'));
        location.replace('#/resultado/' + run.id);
        return;
      }
      const min = Math.ceil(ms / 60000);
      if ([10, 5, 1].includes(min) && !warned.has(min) && Math.abs(ms - min * 60000) < 1500) {
        warned.add(min);
        $('#sim-live', root).textContent = 'Restam ' + min + (min === 1 ? ' minuto.' : ' minutos.');
      }
      tEl.textContent = MQ.fmtDuration(ms / 1000);
      $('#sim-timer', root).classList.toggle('low', ms < 5 * 60000);
    }, 1000);

    MQ.keyHandler = function (e) {
      if (e.target.matches('input, textarea, select') || document.querySelector('.modal-back, .popmenu')) return;
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); askFinish(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (e.shiftKey && k === 'C') openCard(); // C puro é a alternativa C
      else if (q && /^[A-E]$/.test(k) && (q.alternativas || []).some(a => a.l === k)) pick(k);
      else if (k === 'M' && q) $('#sim-flag', root).click();
      else if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
    };
  };

  MQ.views.resultado = function (root, runId) {
    const run = MQ.get('runs', runId);
    if (!run) { root.innerHTML = '<div class="empty"><h2>Resultado não encontrado</h2><a class="btn" href="#/listas">Voltar às listas</a></div>'; return; }
    const l = MQ.data.lists[run.listId] || {};
    const sc = MQ.runScore(run);
    const used = ((run.finishedAt || Date.now()) - run.startedAt) / 1000;
    const p = MQ.pct(sc.ok, sc.total);
    const areas = Object.keys(sc.byArea).sort((a, b) => {
      const ia = MQ.AREAS.indexOf(a), ib = MQ.AREAS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const runs = MQ.alive('runs').filter(r => r.listId === run.listId && r.status === 'concluido').sort((a, b) => a.finishedAt - b.finishedAt);
    const wrong = run.qids.filter(id => { const q = MQ.get('questions', id); return q && run.answers[id] && run.answers[id] !== q.gabarito; });
    function review(qids, startIndex) {
      MQ.openSolve({ title: (l.name || 'Simulado') + ' — revisão', qids, ctx: 'revisao', startIndex: startIndex || 0 });
      const s = MQ.session;
      qids.forEach(id => { s.sel[id] = run.answers[id]; s.revealed[id] = true; });
      MQ.render();
    }
    const times = run.times || {};
    const timed = Object.keys(times).filter(id => run.qids.includes(id) && times[id] > 0);
    let timeCard = '';
    if (timed.length) {
      const totalT = timed.reduce((s2, id) => s2 + times[id], 0);
      const respT = run.qids.filter(id => run.answers[id] && times[id]);
      const avg = respT.length ? respT.reduce((s2, id) => s2 + times[id], 0) / respT.length : 0;
      const top = timed.sort((x, y) => times[y] - times[x]).slice(0, 5);
      timeCard = '<section class="panel span-12"><h2>Tempo</h2><div class="sub">Quanto cada questão ficou na tela</div>' +
        '<dl class="sim-times"><dt>Tempo total nas questões</dt><dd>' + MQ.fmtDuration(totalT) + '</dd><dt>Média por questão respondida</dt><dd>' + (respT.length ? MQ.fmtDuration(avg) : '—') + '</dd></dl>' +
        '<h3 class="small" style="margin:12px 0 6px">As 5 que mais demoraram</h3><div class="sim-slow">' +
        top.map(id => {
          const i = run.qids.indexOf(id), q = MQ.get('questions', id), a = run.answers[id];
          const st = !a ? 'em branco' : (q && a === q.gabarito) ? 'certa' : 'errada';
          return '<button class="sim-slow-row" data-rev="' + i + '"><span>Questão ' + (i + 1) + '</span><span class="tnum">' + MQ.fmtDuration(times[id]) + '</span><span class="badge ' + (st === 'certa' ? 'ok' : st === 'errada' ? 'err' : '') + '">' + st + '</span></button>';
        }).join('') + '</div></section>';
    }
    const prev = runs.filter(r => r.finishedAt < run.finishedAt).pop();
    let verdict = p >= 70 ? 'Bom resultado.' : p >= 50 ? 'Dá para melhorar: revise as erradas.' : 'Vale rever as erradas com calma.';
    if (prev) { const ps = MQ.runScore(prev), pp = MQ.pct(ps.ok, ps.total), d = p - pp; verdict += d ? ' ' + Math.abs(d) + ' pontos ' + (d > 0 ? 'acima' : 'abaixo') + ' da tentativa anterior (' + pp + '%).' : ' Igual à tentativa anterior.'; }
    const mainLabel = wrong.length ? 'Revisar as erradas' : 'Revisar questões';
    root.innerHTML =
      '<div class="page-head"><div><h1>' + esc(l.name || 'Simulado') + '</h1><p>Finalizado em ' + MQ.fmtDateTime(run.finishedAt) + '</p></div>' +
      '<div class="toolbar"><a class="btn ghost" href="#/listas">' + icon('left') + ' Listas</a><button class="btn ghost" id="r-more" aria-haspopup="menu">Mais</button><button class="btn primary hide-m" id="r-main">' + mainLabel + '</button></div></div>' +
      '<div class="sim-bar res-bar"><button class="btn primary" id="r-main2">' + mainLabel + '</button></div>' +
      '<div class="perf-grid">' +
      '<section class="panel span-5"><h2>Resultado</h2><div class="sub">' + sc.total + ' questões</div><div class="totals"><div class="big-pct">' + p + '%</div><p class="verdict">' + esc(verdict) + '</p>' +
      '<dl><dt>Certas</dt><dd style="color:var(--ok)">' + icon('check') + ' ' + sc.ok + '</dd><dt>Erradas</dt><dd style="color:var(--err)">' + icon('x') + ' ' + (sc.resp - sc.ok) + '</dd><dt>Em branco</dt><dd>' + (sc.total - sc.resp) + '</dd><dt>Tempo usado</dt><dd>' + MQ.fmtDuration(used) + ' de ' + run.durationMin + ' min</dd></dl></div></section>' +
      '<section class="panel span-7"><h2>Por grande área</h2><div class="sub">Percentual de acerto sobre o total de questões da área</div><div class="bars">' +
      areas.map(a => {
        const b = sc.byArea[a]; const pp = MQ.pct(b.ok, b.total);
        return '<div class="bar-row"><span class="lbl">' + esc(a) + '</span><span class="bar-track"><span class="bar-fill" style="display:block;width:' + pp + '%"></span></span><span class="val">' + b.ok + '/' + b.total + ' · ' + pp + '%</span></div>';
      }).join('') + '</div></section>' +
      (runs.length > 1 ? '<section class="panel span-12"><h2>Tentativas deste simulado</h2><div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>Data</th><th class="num">Acertos</th><th class="num">%</th></tr></thead><tbody>' +
        runs.map(r => { const s = MQ.runScore(r); return '<tr class="clickable" data-run="' + r.id + '"><td>' + MQ.fmtDateTime(r.finishedAt) + (r.id === run.id ? ' <span class="badge">esta</span>' : '') + '</td><td class="num">' + s.ok + '/' + s.total + '</td><td class="num">' + MQ.pct(s.ok, s.total) + '%</td></tr>'; }).join('') +
        '</tbody></table></div></section>' : '') +
      (timeCard ? timeCard : '') +
      '<section class="panel span-12"><h2>Cartão-resposta</h2><div class="sub">Toque numa questão para revisar</div><div class="sc-grid sc-res">' + run.qids.map((_, i) => sheetCell(run, i, -1, 'res')).join('') + '</div></section>' +
      '</div>';
    $$('[data-rev]', root).forEach(b => b.onclick = () => review(run.qids, parseInt(b.dataset.rev, 10)));
    $$('[data-run]', root).forEach(tr => tr.onclick = () => { location.hash = '#/resultado/' + tr.dataset.run; });
    const main = () => review(wrong.length ? wrong : run.qids, 0);
    $('#r-main', root).onclick = main; $('#r-main2', root).onclick = main;
    function makeErrs() {
      const ids = run.qids.filter(id => { const q = MQ.get('questions', id); return q && run.answers[id] && run.answers[id] !== q.gabarito; });
      const blank = run.qids.filter(id => !run.answers[id]);
      if (!ids.length && !blank.length) { MQ.toast('Você não errou nenhuma questão.'); return; }
      MQ.createListModal(ids.concat(blank), (l.name || 'Simulado') + ' — erros e brancos');
    }
    async function redo() {
      const ok = await MQ.confirm('Refazer simulado', 'Começa uma nova tentativa com as mesmas questões e o mesmo tempo. O resultado atual fica guardado.', 'Começar');
      if (ok) MQ.startOrResume(run.listId);
    }
    $('#r-more', root).onclick = e => MQ.menu(e.currentTarget, [
      { label: 'Revisar todas as questões', onClick: () => review(run.qids, 0) },
      { label: 'Criar lista com os erros', onClick: makeErrs },
      { label: 'Refazer simulado', onClick: redo }
    ]);
  };
})(window.MQ);
