/* Pulse — rotas e inicialização */
(function (MQ) {
  'use strict';
  const { $$, icon } = MQ;

  MQ.route = function () {
    const h = (location.hash || '#/inicio').replace(/^#\/?/, '');
    const [name, arg] = h.split('/');
    return { name: name || 'inicio', arg: arg ? decodeURIComponent(arg) : null };
  };

  const NAV_FOR = { anotacoes: 'anotacoes', inicio: 'inicio', questoes: 'questoes', resolver: 'questoes', listas: 'listas', simulado: 'listas', resultado: 'listas', desempenho: 'desempenho', configuracoes: 'configuracoes', cadastrar: 'configuracoes', sincronizar: 'configuracoes' };

  MQ.isAdmin = function () {
    if (window.mqNative && window.mqNative.admin) return true; // versão Windows Admin
    const email = ((MQ.local.sync && MQ.local.sync.email) || '').trim().toLowerCase();
    const admins = ((window.MQ_CONFIG || {}).adminEmails || []).map(e => String(e).trim().toLowerCase());
    return !!email && admins.includes(email);
  };

  MQ.render = function () {
    clearInterval(MQ.tick);
    if (MQ.stopSearch) { MQ.stopSearch(); MQ.stopSearch = null; }
    MQ.hideMarkBar && MQ.hideMarkBar();
    MQ.keyHandler = null;
    MQ.hideTip && MQ.hideTip();
    $$('.popmenu').forEach(m => m.remove());
    const r = MQ.route();
    if (r.name === 'sincronizar') { location.replace('#/configuracoes'); return; } // rota antiga: agora fica em Configurações
    document.body.classList.toggle('in-solve', r.name === 'resolver');
    document.body.classList.toggle('in-sim', r.name === 'simulado');
    if (r.name !== 'resolver') document.body.classList.remove('in-focus');
    const view = MQ.views[r.name] || MQ.views.questoes;
    const root = document.getElementById('view');
    root.onclick = null; // cada tela define o seu; senão o da tela anterior continua ouvindo
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
    document.querySelectorAll('.fpage, .sheet-back').forEach(m => { if (m._close) m._close(); else m.remove(); }); // página de filtro/menu não sobrevive à troca de tela
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
        const m = document.querySelector('.modal-back, .popmenu, .fpage, .sheet-back');
        if (m) { if (m._close) m._close(); else m.remove(); return; }
        if (location.hash && location.hash !== '#/inicio') history.back();
        else cap.Plugins.App.exitApp();
      });
    }
  });

  async function init() {
    $$('[data-icon]').forEach(s => { s.outerHTML = icon(s.dataset.icon); });
    await MQ.loadData();
    if (MQ.reminderApply) MQ.reminderApply(); // reagenda o lembrete com a meta atual
    MQ.bankFilter = MQ.newFilter(); // depois de carregar os dados: o filtro padrão vem de MQ.local.filtroPadrao
    MQ.applyTheme();
    document.documentElement.style.setProperty('--font-scale', MQ.local.fontScale || 1);
    MQ.seedIfEmpty();
    if (!location.hash) location.hash = '#/inicio';
    MQ.render();
    MQ.initSync();
  }
  init().catch(e => {
    console.error(e);
    document.getElementById('view').innerHTML = '<div class="empty"><h2>Não foi possível abrir seus dados</h2><p>' + MQ.esc(e.message || String(e)) + '</p></div>';
  });
})(window.MQ);
