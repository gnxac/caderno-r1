/* Caderno R1 — rotas e inicialização */
(function (MQ) {
  'use strict';
  const { $$, icon } = MQ;

  MQ.route = function () {
    const h = (location.hash || '#/questoes').replace(/^#\/?/, '');
    const [name, arg] = h.split('/');
    return { name: name || 'questoes', arg: arg ? decodeURIComponent(arg) : null };
  };

  const NAV_FOR = { questoes: 'questoes', resolver: 'questoes', listas: 'listas', simulado: 'listas', resultado: 'listas', desempenho: 'desempenho', cadastrar: 'cadastrar', sincronizar: 'sincronizar' };

  MQ.render = function () {
    clearInterval(MQ.tick);
    MQ.keyHandler = null;
    MQ.hideTip && MQ.hideTip();
    $$('.popmenu').forEach(m => m.remove());
    const r = MQ.route();
    const view = MQ.views[r.name] || MQ.views.questoes;
    const root = document.getElementById('view');
    const navKey = NAV_FOR[r.name] || 'questoes';
    $$('#nav a').forEach(a => { if (a.dataset.route === navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    try {
      view(root, r.arg);
    } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="empty"><h2>Algo deu errado nesta tela</h2><p>' + MQ.esc(e.message || String(e)) + '</p><a class="btn" href="#/questoes">Voltar ao banco</a></div>';
    }
  };

  MQ.applyTheme = function () {
    const t = MQ.local.theme || 'auto';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  };

  let lastRoute = '';
  window.addEventListener('hashchange', () => {
    const r = MQ.route();
    MQ.render();
    const key = r.name + '/' + (r.arg || '');
    if (key !== lastRoute) { lastRoute = key; document.getElementById('view').focus({ preventScroll: true }); window.scrollTo(0, 0); }
  });
  document.addEventListener('keydown', e => { if (MQ.keyHandler) MQ.keyHandler(e); });

  /* Toque/clique numa imagem abre ampliada */
  document.addEventListener('click', e => {
    const img = e.target.closest && e.target.closest('img[data-zoom]');
    if (!img || img.closest('.modal')) return;
    e.preventDefault(); e.stopPropagation();
    MQ.modal({ title: 'Imagem', wide: true, body: '<img class="zoom-img" src="' + img.getAttribute('src') + '" alt="' + MQ.esc(img.alt) + '">' });
  }, true);

  /* Botão "voltar" do Android: fecha janelas antes de sair */
  document.addEventListener('DOMContentLoaded', () => {
    const cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.App) {
      cap.Plugins.App.addListener('backButton', () => {
        const m = document.querySelector('.modal-back, .popmenu');
        if (m) { m.remove(); return; }
        if (location.hash && location.hash !== '#/questoes') history.back();
        else cap.Plugins.App.exitApp();
      });
    }
  });

  async function init() {
    $$('[data-icon]').forEach(s => { s.outerHTML = icon(s.dataset.icon); });
    await MQ.loadData();
    MQ.applyTheme();
    document.documentElement.style.setProperty('--font-scale', MQ.local.fontScale || 1);
    MQ.seedIfEmpty();
    if (!location.hash) location.hash = '#/questoes';
    MQ.render();
    MQ.initSync();
  }
  init().catch(e => {
    console.error(e);
    document.getElementById('view').innerHTML = '<div class="empty"><h2>Não foi possível abrir seus dados</h2><p>' + MQ.esc(e.message || String(e)) + '</p></div>';
  });
})(window.MQ);
