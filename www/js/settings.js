/* Caderno R1 — tela Configurações: conta e sincronização, aparência e (só administrador) cadastro de questões */
(function (MQ) {
  'use strict';
  const { $, $$, icon } = MQ;

  MQ.views.configuracoes = function (root) {
    const theme = MQ.local.theme || 'auto';
    const pct = () => Math.round((MQ.local.fontScale || 1) * 100) + '%';
    const st = MQ.syncStatus || { state: 'off', msg: 'Sem sincronização' };
    root.innerHTML = '<div class="page-head"><div><h1>Configurações</h1></div></div><div class="settings">' +
      '<section class="set-sec"><h2>Conta e sincronização</h2>' +
      '<div class="sync-pill set-pill"><span class="sync-dot ' + ({ idle: 'on', busy: 'busy', error: 'err' }[st.state] || '') + '"></span><span class="sync-label">' + MQ.esc(st.msg) + '</span></div>' +
      '<div id="set-sync"></div></section>' +
      '<section class="set-sec"><h2>Banco de questões</h2><p id="bank-info">' + (MQ.local.bank ? 'Banco: versão ' + Number(MQ.local.bank.version) + ', ' + Number(MQ.local.bank.count) + ' questões, atualizado em ' + MQ.fmtDate(MQ.local.bank.updatedAt) : 'Banco: ainda sem versão baixada') + '</p>' +
      (MQ.isAdmin() ? '<button class="btn" id="bank-pub">Publicar banco para todos</button>' : '') + '</section>' +
      '<section class="set-sec"><h2>Aparência</h2>' +
      '<div class="set-row"><span>Tema</span><div class="seg" role="group" aria-label="Tema">' +
      [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, l]) => '<button data-theme-set="' + v + '" aria-pressed="' + (theme === v) + '">' + l + '</button>').join('') + '</div></div>' +
      '<div class="set-row"><span>Tamanho da letra</span><div class="fs-ctl"><button class="icon-btn" id="fs-minus" aria-label="Diminuir letra">' + icon('textdown') + '</button><output id="fs-val" aria-live="polite">' + pct() + '</output><button class="icon-btn" id="fs-plus" aria-label="Aumentar letra">' + icon('textup') + '</button></div></div>' +
      '</section>' +
      (MQ.isAdmin() ? '<section class="set-sec"><h2>Administrador</h2><a class="set-link" href="#/cadastrar"><span>Cadastrar questões</span>' + icon('right') + '</a><button class="btn" id="bank-dedupe" style="margin-top:10px">Remover questões repetidas</button></section>' : '') +
      '</div>';

    if ($('#bank-dedupe', root)) $('#bank-dedupe', root).onclick = MQ.dedupeDialog;
    if ($('#bank-pub', root)) $('#bank-pub', root).onclick = MQ.publishDialog;
    MQ.syncSection($('#set-sync', root));
    $$('[data-theme-set]', root).forEach(b => b.onclick = () => {
      MQ.local.theme = b.dataset.themeSet; MQ.saveLocal(); MQ.applyTheme();
      $$('[data-theme-set]', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
    const bump = d => { MQ.setFontScale((MQ.local.fontScale || 1) + d); $('#fs-val', root).textContent = pct(); };
    $('#fs-minus', root).onclick = () => bump(-0.08);
    $('#fs-plus', root).onclick = () => bump(0.08);
  };
})(window.MQ);
