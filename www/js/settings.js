/* Pulse — tela Configurações: conta e sincronização, aparência, estudo, backup, atalhos, administrador e sobre */
(function (MQ) {
  'use strict';
  const { $, $$, esc, icon } = MQ;
  MQ.VERSION = '1.6.0'; // tests/versao.test.js confere com o package.json

  const SECTIONS = [['conta', 'Conta e sincronização'], ['aparencia', 'Aparência'], ['estudo', 'Estudo'], ['dados', 'Dados e backup'], ['atalhos', 'Atalhos'], ['admin', 'Administrador'], ['sobre', 'Sobre']];
  const KEYS = [
    ['Em qualquer tela', [['Ctrl K', 'Buscar questão por texto ou código'], ['Ctrl 1–6', 'Início, Questões, Listas, Anotações, Desempenho, Configurações'], ['?', 'Mostrar os atalhos'], ['Esc', 'Fechar janela ou menu']]],
    ['Ao resolver', [['A–E', 'Escolher alternativa'], ['Shift A–E', 'Descartar alternativa'], ['Enter', 'Confirmar, depois próxima'], ['← →', 'Questão anterior ou próxima'], ['N', 'Anotação'], ['L', 'Adicionar à lista'], ['F', 'Modo foco (Esc sai)']]],
    ['No simulado', [['A–E', 'Marcar alternativa'], ['M', 'Marcar para revisar'], ['Shift C', 'Abrir o cartão-resposta'], ['Ctrl Enter', 'Finalizar (pede confirmação)']]]
  ];

  /* Respostas em CSV: uma linha por resposta, com o assunto e o tempo */
  function answersCSV() {
    const rows = [['Data', 'Código', 'Instituição', 'Ano', 'Assunto', 'Marcou', 'Gabarito', 'Resultado', 'Tempo (s)', 'Origem']];
    MQ.alive('attempts').sort((a, b) => a.ts - b.ts).forEach(a => {
      const q = MQ.get('questions', a.qid);
      rows.push([new Date(a.ts).toLocaleString('pt-BR'), q ? q.codigo : '', q ? q.instituicao : '', q ? q.ano : '', q ? MQ.qPath(q).join(' > ') : '', a.choice, q ? q.gabarito : '', a.correct ? 'certa' : 'errada', a.timeSec ? Math.round(a.timeSec) : '', MQ.ctxLabel ? MQ.ctxLabel(a.ctx) : a.ctx]);
    });
    return rows;
  }

  MQ.views.configuracoes = function (root) {
    const theme = MQ.local.theme || 'auto';
    const scale = Math.round((MQ.local.fontScale || 1) * 100);
    const st = MQ.syncStatus || { state: 'off', msg: 'Sem sincronização' };
    const secs = SECTIONS.filter(([k]) => k !== 'admin' || MQ.isAdmin());
    const nq = MQ.alive('questions').length, na = MQ.alive('attempts').length, nn = MQ.alive('notes').length;

    root.innerHTML = '<div class="page-head"><div><h1>Configurações</h1></div></div><div class="set-wrap">' +
      '<nav class="set-index" aria-label="Seções">' + secs.map(([k, l]) => '<a href="#/configuracoes" data-go="' + k + '">' + l + '</a>').join('') + '</nav>' +
      '<div class="settings">' +
      '<section class="set-sec" id="s-conta"><h2>Conta e sincronização</h2>' +
      '<div class="sync-pill set-pill"><span class="sync-dot ' + ({ idle: 'on', busy: 'busy', error: 'err' }[st.state] || '') + '"></span><span class="sync-label">' + esc(st.msg) + '</span></div>' +
      '<div id="set-sync"></div>' +
      '<h3 class="set-sub">Banco de questões</h3><p id="bank-info">' + (MQ.local.bank ? 'Banco: versão ' + Number(MQ.local.bank.version) + ', ' + Number(MQ.local.bank.count) + ' questões, atualizado em ' + MQ.fmtDate(MQ.local.bank.updatedAt) : 'Banco: ainda sem versão baixada') + '</p>' +
      (MQ.isAdmin() ? '<button class="btn" id="bank-pub">Publicar banco para todos</button>' : '') + '</section>' +

      '<section class="set-sec" id="s-aparencia"><h2>Aparência</h2>' +
      '<div class="set-row"><span>Tema</span><div class="seg" role="group" aria-label="Tema">' +
      [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, l]) => '<button data-theme-set="' + v + '" aria-pressed="' + (theme === v) + '">' + l + '</button>').join('') + '</div></div>' +
      '<div class="set-row"><label for="fs-range">Tamanho do enunciado</label><output id="fs-val" aria-live="polite">' + scale + '%</output></div>' +
      '<input type="range" id="fs-range" min="80" max="160" step="4" value="' + scale + '" aria-label="Tamanho do enunciado">' +
      '<div class="set-preview stem" id="fs-prev">Homem de 64 anos com insuficiência cardíaca de fração de ejeção reduzida chega ao pronto-socorro com dispneia. Qual conduta reduz a mortalidade nesse cenário?</div>' +
      '<p class="muted small">Vale só neste aparelho. O tamanho nunca fica abaixo de 80%.</p></section>' +

      '<section class="set-sec" id="s-estudo"><h2>Estudo</h2>' +
      '<div class="set-row"><label for="g-n">Meta diária (questões por dia)</label><input type="number" id="g-n" min="1" max="500" value="' + MQ.dailyGoal() + '" inputmode="numeric" style="width:96px"></div>' +
      '<p class="muted small" style="margin-top:-4px">A meta vale em todos os seus aparelhos e aparece no Início.</p>' +
      (MQ.reminderAvailable() ? '<div class="set-row"><label for="rm-on">Lembrete diário</label><span class="set-inline"><input type="time" id="rm-t" value="' + ((MQ.local.reminder || {}).time || '20:00') + '" aria-label="Horário do lembrete"><input type="checkbox" class="sw" id="rm-on"' + ((MQ.local.reminder || {}).on ? ' checked' : '') + '></span></div>' : '<p class="muted small">O lembrete diário por notificação está disponível no app para Android.</p>') +
      '<div class="set-row"><span>Filtro padrão em Questões</span><div class="seg" role="group" aria-label="Filtro padrão">' +
      [['nao', 'Que não resolvi'], ['todas', 'Todas']].map(([v, l]) => '<button data-fp="' + v + '" aria-pressed="' + ((MQ.local.filtroPadrao || 'nao') === v) + '">' + l + '</button>').join('') + '</div></div></section>' +

      '<section class="set-sec" id="s-dados"><h2>Dados e backup</h2>' +
      '<p class="muted small">' + nq + ' questões · ' + na + ' respostas · ' + nn + ' anotações neste aparelho.</p>' +
      '<div class="set-actions"><button class="btn" id="d-export">' + icon('download') + ' Exportar backup completo</button><button class="btn" id="d-restore">' + icon('upload') + ' Restaurar de um arquivo</button><button class="btn" id="d-csv">' + icon('download') + ' Exportar respostas (CSV)</button></div>' +
      '<p class="muted small">Restaurar junta o arquivo com o que você já tem e não apaga o que é mais novo que o arquivo. O backup inclui questões, listas, respostas, anotações, revisões e imagens.</p></section>' +

      '<section class="set-sec" id="s-atalhos"><h2>Atalhos de teclado</h2>' + KEYS.map(([t, rows]) => '<h3 class="set-sub">' + t + '</h3><dl class="kbd-list">' + rows.map(r => '<dt><kbd>' + esc(r[0]) + '</kbd></dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>').join('') +
      '<p class="muted small">Atalhos de letra não funcionam enquanto você digita num campo.</p></section>' +

      (MQ.isAdmin() ? '<section class="set-sec" id="s-admin"><h2>Administrador</h2><a class="set-link" href="#/cadastrar"><span>Cadastrar questões</span>' + icon('right') + '</a><button class="btn" id="bank-dedupe" style="margin-top:10px">Remover questões repetidas</button></section>' : '') +

      '<section class="set-sec" id="s-sobre"><h2>Sobre</h2><p><b>Pulse</b> · versão ' + MQ.VERSION + '</p><p class="muted small">Banco de questões para residência médica. Seus dados ficam neste aparelho e sincronizam pela sua conta Google.</p></section>' +
      '</div></div>';

    if ($('#bank-dedupe', root)) $('#bank-dedupe', root).onclick = MQ.dedupeDialog;
    if ($('#bank-pub', root)) $('#bank-pub', root).onclick = MQ.publishDialog;
    MQ.syncSection($('#set-sync', root));

    $$('[data-go]', root).forEach(a => a.onclick = e => { e.preventDefault(); const t = $('#s-' + a.dataset.go, root); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); t.tabIndex = -1; t.focus({ preventScroll: true }); } });
    $$('[data-theme-set]', root).forEach(b => b.onclick = () => {
      MQ.local.theme = b.dataset.themeSet; MQ.saveLocal(); MQ.applyTheme();
      $$('[data-theme-set]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
    $('#fs-range', root).oninput = e => { MQ.setFontScale(+e.target.value / 100); $('#fs-val', root).textContent = e.target.value + '%'; };
    $('#g-n', root).onchange = e => {
      const n = Math.round(Number(e.target.value));
      if (!(n >= 1 && n <= 500)) { MQ.toast('Use um número entre 1 e 500.'); e.target.value = MQ.dailyGoal(); return; }
      MQ.put('prefs', Object.assign(MQ.get('prefs', 'meta') || { id: 'meta' }, { daily: n }));
      MQ.toast('Meta diária: ' + n + ' questões.');
      if (MQ.reminderApply) MQ.reminderApply(); // o texto do lembrete usa a meta
    };
    if ($('#rm-on', root)) {
      const apply = async () => { const ok = await MQ.reminderSet($('#rm-on', root).checked, $('#rm-t', root).value || '20:00'); if (!ok) $('#rm-on', root).checked = !!(MQ.local.reminder || {}).on; else MQ.toast($('#rm-on', root).checked ? 'Lembrete diário ligado.' : 'Lembrete diário desligado.'); };
      $('#rm-on', root).onchange = apply;
      $('#rm-t', root).onchange = () => { if ($('#rm-on', root).checked) apply(); };
    }
    $$('[data-fp]', root).forEach(b => b.onclick = () => {
      const wasDefault = JSON.stringify(MQ.bankFilter) === JSON.stringify(MQ.newFilter()); // não descarta um filtro que você está montando
      MQ.local.filtroPadrao = b.dataset.fp; MQ.saveLocal(); if (wasDefault) MQ.bankFilter = MQ.newFilter();
      $$('[data-fp]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
    $('#d-export', root).onclick = MQ.backupExport;
    $('#d-restore', root).onclick = MQ.backupRestore;
    $('#d-csv', root).onclick = () => MQ.saveFile('pulse-respostas-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + MQ.toCSV(answersCSV()), 'text/csv;charset=utf-8');
  };
})(window.MQ);
