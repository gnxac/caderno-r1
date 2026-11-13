/* Pulse — login com Google no site (Google Identity Services). Sem servidor e sem chave secreta:
   o navegador recebe um token de acesso de curta duração para a pasta oculta do Drive de quem entrou.
   Nos apps nativos (Windows/Android) continua valendo o fluxo antigo de sync.js. */
(function (MQ) {
  'use strict';
  const { esc } = MQ;

  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file openid email profile';
  const native = () => !!(window.mqNative || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));
  const A = MQ.auth = { web: !native() };
  A.clientId = () => ((window.MQ_CONFIG || {}).googleWebClientId || '').trim();
  A.configured = () => !!A.clientId();
  /* Conta que entrou neste navegador (guardada no aparelho: o site abre mesmo sem internet) */
  A.user = () => { const s = MQ.local.sync || {}; return s.webLogin && s.email ? { email: s.email, name: s.name || '', picture: s.picture || '' } : null; };

  /* Token de acesso: dura cerca de 1 h; fica só na aba (sessionStorage), nunca no armazenamento permanente */
  let tok = null, tokExp = 0;
  try { const t = JSON.parse(sessionStorage.getItem('pulse-token') || 'null'); if (t && t.e > Date.now()) { tok = t.t; tokExp = t.e; } } catch (e) { /* sem sessionStorage */ }
  function keep(r) {
    tok = r.access_token; tokExp = Date.now() + (r.expires_in || 3600) * 1000;
    try { sessionStorage.setItem('pulse-token', JSON.stringify({ t: tok, e: tokExp })); } catch (e) { /* ok */ }
  }

  /* A biblioteca do Google carrega com async; espera até 10 s (sem internet ela nunca chega) */
  function gis() {
    return new Promise((resolve, reject) => {
      let n = 0;
      (function wait() {
        const g = window.google && window.google.accounts && window.google.accounts.oauth2;
        if (g) return resolve(g);
        if (++n > 100) return reject(new Error(navigator.onLine ? 'gis' : 'offline')); // online e nada: o script foi bloqueado
        setTimeout(wait, 100);
      })();
    });
  }
  function request(prompt, hint) {
    return gis().then(oauth2 => new Promise((resolve, reject) => {
      // popup que nunca responde não pode prender o botão; a renovação em silêncio é bloqueada logo ou não vem
      const t = setTimeout(() => reject(new Error('timeout')), prompt === '' ? 15000 : 120000);
      const end = (fn, v) => { clearTimeout(t); fn(v); };
      const c = oauth2.initTokenClient({
        client_id: A.clientId(), scope: SCOPE,
        callback: r => (r.error ? end(reject, new Error(r.error)) : end(resolve, r)),
        error_callback: e => end(reject, new Error((e && e.type) || 'erro'))
      });
      c.requestAccessToken({ prompt, hint: hint || undefined });
    }));
  }

  /* Mensagem em português, curta e com a ação, para cada jeito de o login falhar */
  A.explain = function (e) {
    const m = String((e && e.message) || e);
    if (/popup_closed|access_denied/.test(m)) return 'Login cancelado. Toque em "Entrar com Google" para tentar de novo.';
    if (/popup_failed/.test(m)) return 'O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.';
    if (m === 'scope') return 'Para guardar seus dados, permita o acesso à pasta do app no Drive e tente de novo.';
    if (m === 'gis') return 'O login do Google não carregou. Se você usa um bloqueador de anúncios, libere este site e recarregue a página.';
    if (m === 'timeout') return 'O Google não respondeu. Feche a janela do Google, se ela ainda estiver aberta, e tente de novo.';
    if (m === 'userinfo') return 'O Google não informou o seu e-mail. Tente de novo.';
    if (!navigator.onLine || m === 'offline' || /failed to fetch|networkerror|load failed/i.test(m)) return 'Sem conexão com o Google. Conecte-se à internet e tente de novo.';
    return 'Não foi possível entrar. Tente de novo; se continuar, recarregue a página.';
  };

  /* Token para a sincronização; renova em silêncio quando vence (se o navegador bloquear, pede para reconectar) */
  let renewing = null, needRelogin = false;
  /* O Google recusou o token (401): descarta e pede reconexão em vez de repetir o mesmo token até vencer */
  A.expire = function () { tok = null; tokExp = 0; needRelogin = true; try { sessionStorage.removeItem('pulse-token'); } catch (e) { /* ok */ } };
  A.getToken = async function () {
    if (tok && tokExp - 60000 > Date.now()) return tok;
    const u = A.user();
    if (!u) throw MQ.problem('auth');
    if (needRelogin) throw MQ.problem('auth'); // sem gesto do usuário o navegador bloqueia; não insiste
    renewing = renewing || request('', u.email).then(keep).finally(() => { renewing = null; });
    try { await renewing; return tok; } catch (e) {
      if (!navigator.onLine || /^(offline|gis)$/.test(e.message)) throw MQ.problem(navigator.onLine ? 'net' : 'offline'); // não é a sessão: não trava a renovação
      needRelogin = true; throw MQ.problem('auth');
    }
  };

  /* Apaga os dados deste navegador (usado quando outra conta entra ou ao sair e apagar) */
  async function wipe() {
    const keepSync = { owner: '' };
    await MQ.resetData();
    MQ.local.sync = keepSync;
    await MQ.saveLocal();
  }

  /* Abre a janela do Google; precisa vir de um toque/clique. Devolve true se entrou. */
  A.signIn = async function () {
    const r = await request('select_account');
    const g = window.google.accounts.oauth2;
    if (g.hasGrantedAllScopes && !g.hasGrantedAllScopes(r, 'https://www.googleapis.com/auth/drive.appdata')) throw new Error('scope');
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + r.access_token } });
    const u = res.ok ? await res.json() : {};
    if (!u.email) throw new Error('userinfo');
    const email = u.email.toLowerCase();
    const s = MQ.local.sync || (MQ.local.sync = {});
    if (s.owner && s.owner !== email) {
      const ok = await MQ.confirm('Outra conta neste navegador', 'Este navegador guarda dados de ' + s.owner + '. Para entrar como ' + email + ', os dados locais serão removidos daqui (continuam no Google Drive de ' + s.owner + ', se estiverem sincronizados). Continuar?', 'Remover e entrar', true);
      if (!ok) return false;
      await wipe();
    }
    const sy = MQ.local.sync || (MQ.local.sync = {});
    Object.assign(sy, { webLogin: true, localOnly: false, email: u.email, name: u.name || '', picture: u.picture || '', owner: email });
    keep(r); needRelogin = false;
    await MQ.saveLocal();
    return true;
  };

  /* Sai deste navegador. erase = também apaga os dados daqui (computador compartilhado). */
  A.signOut = async function (erase) {
    const ok = await MQ.confirm(erase ? 'Sair e apagar os dados daqui' : 'Sair deste navegador',
      erase ? 'Seus dados locais serão apagados deste navegador. Tentamos sincronizar antes; o que não chegar ao Google Drive (por exemplo, se estiver sem internet) será perdido.' : 'Você precisará entrar de novo. Seus dados continuam aqui e no seu Google Drive.', erase ? 'Sair e apagar' : 'Sair', !!erase);
    if (!ok) return;
    if (erase && A.user() && !(navigator.onLine && await MQ.syncNow())) { // envia o que falta antes de apagar; se não deu, avisa em vez de perder em silêncio
      const go = await MQ.confirm('Seus dados não foram enviados', 'Não foi possível enviar seus dados ao Google Drive agora. Se apagar, o que não foi sincronizado se perde. Cancele para exportar um backup em Configurações › Dados e backup.', 'Apagar mesmo assim', true);
      if (!go) return;
    }
    try { if (tok && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(tok); } catch (e) { /* ok */ }
    try { sessionStorage.removeItem('pulse-token'); } catch (e) { /* ok */ }
    tok = null; tokExp = 0;
    if (erase) await wipe();
    else { const s = MQ.local.sync; s.webLogin = false; s.email = ''; s.name = ''; s.picture = ''; await MQ.saveLocal(); }
    location.reload();
  };

  /* ---------- Tela de login ---------- */
  const G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
  const MARK = '<svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#4338A8"/><path d="M12 34h8l4-8 5 14 22-22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function showLogin(done) {
    document.body.classList.add('logged-out');
    const el = document.createElement('main');
    el.id = 'login';
    const configured = A.configured();
    el.innerHTML =
      '<section class="lg-brand" aria-hidden="true"><div class="lg-mark">' + MARK + '<b>Pulse</b></div>' +
      '<h2>Questões de residência no seu ritmo</h2>' +
      '<ul><li>Provas oficiais, filtros por assunto, banca e ano</li><li>Revisão espaçada dos seus erros e caderno de erros</li><li>Simulados cronometrados e desempenho por tema</li><li>Funciona no computador, no tablet e no celular, e até sem internet</li></ul></section>' +
      '<section class="lg-card"><div class="lg-mark sm">' + MARK + '<b>Pulse</b></div>' +
      '<h1>Entrar</h1><p class="lg-sub">Suas questões, respostas e listas ficam com você, sem outra senha.</p>' +
      '<ul class="lg-points"><li>Revisão dos seus erros no dia certo</li><li>Simulados cronometrados e desempenho por tema</li><li>Funciona até sem internet</li></ul>' +
      (configured
        ? '<p class="lg-fine">Pedimos acesso só à pasta oculta do app no seu Drive e ao seu e-mail, para guardar e sincronizar os seus dados.</p><button class="lg-google" id="lg-go">' + G + '<span>Entrar com Google</span></button>'
        : '<p class="lg-warn" role="status">Entrar com Google ainda não está disponível neste endereço. Você pode usar o Pulse só neste navegador, sem sincronizar.</p><button class="lg-google primary" id="lg-local">Continuar neste navegador</button><p class="lg-fine">Se você limpar os dados do navegador, perde o progresso. Guarde uma cópia em <b>Configurações › Dados e backup</b>.</p>') +
      '<p class="lg-err" id="lg-err" role="alert" hidden></p></section>';
    document.body.appendChild(el);
    const err = msg => { const e = el.querySelector('#lg-err'); e.textContent = msg; e.hidden = !msg; if (msg) e.scrollIntoView({ block: 'nearest' }); };
    const finish = () => { el.remove(); document.body.classList.remove('logged-out'); done(); };
    const go = el.querySelector('#lg-go');
    if (go) {
      go.onclick = async () => {
        if (go.getAttribute('aria-disabled')) return;
        err('');
        if (!navigator.onLine) { err(A.explain(new Error('offline'))); return; } // não espera 10 s para dizer o óbvio
        const label = go.querySelector('span'), was = label.textContent;
        go.setAttribute('aria-disabled', 'true'); go.setAttribute('aria-busy', 'true'); label.textContent = 'Abrindo o Google…'; // aria-disabled mantém o foco no botão
        try { if (await A.signIn()) return finish(); }
        catch (e) { console.error(e); err(A.explain(e)); }
        go.removeAttribute('aria-disabled'); go.removeAttribute('aria-busy'); label.textContent = was;
      };
    }
    const local = el.querySelector('#lg-local');
    if (local) { local.onclick = async () => { (MQ.local.sync || (MQ.local.sync = {})).localOnly = true; await MQ.saveLocal(); finish(); }; }
  }

  /* Resolve quando o app pode abrir: nos apps nativos sempre; no site, com conta lembrada neste navegador
     (funciona sem internet), ou, enquanto o login não está configurado, com "continuar sem conta". */
  A.gate = function () {
    if (!A.web) return Promise.resolve();
    const s = MQ.local.sync || {};
    if (A.user() || (!A.configured() && s.localOnly)) return Promise.resolve();
    return new Promise(resolve => showLogin(resolve));
  };
})(window.MQ);
