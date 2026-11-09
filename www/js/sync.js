/* Caderno R1 — sincronização pela conta Google (pasta oculta do app no Google Drive).
   Login pelo fluxo de "código no google.com/device", que funciona igual no Windows e no Android. */
(function (MQ) {
  'use strict';
  const { esc, $, icon } = MQ;

  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata openid email';
  const FILE_NAME = 'caderno-r1-dados.json';
  const MEDIA_NAME = 'caderno-r1-imagens.json';
  const OAUTH = 'https://oauth2.googleapis.com';
  const DRIVE = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

  MQ.syncStatus = { state: 'off', msg: 'Sem sincronização' };

  function cfg() {
    const s = MQ.local.sync || (MQ.local.sync = {});
    const c = window.MQ_CONFIG || {};
    return {
      clientId: s.clientId || c.googleClientId || '',
      clientSecret: s.clientSecret || c.googleClientSecret || ''
    };
  }
  MQ.syncConfigured = () => !!(cfg().clientId && cfg().clientSecret);
  MQ.syncLoggedIn = () => !!(MQ.local.sync && MQ.local.sync.refreshToken);

  function setStatus(state, msg) {
    MQ.syncStatus = { state, msg };
    const cls = 'sync-dot ' + ({ idle: 'on', busy: 'busy', error: 'err' }[state] || '');
    document.querySelectorAll('.sync-dot').forEach(d => { d.className = cls; });
    document.querySelectorAll('.sync-label').forEach(l => { l.textContent = msg; });
  }

  /* Requisição HTTP: no Windows passa pelo processo principal (sem CORS);
     no Android o Capacitor faz a requisição nativa; no navegador usa fetch. */
  async function http(url, opts) {
    opts = opts || {};
    if (window.mqNative && window.mqNative.request) {
      return window.mqNative.request({ url, method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body || null });
    }
    const r = await fetch(url, { method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body || undefined });
    return { status: r.status, body: await r.text() };
  }
  function form(obj) {
    return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
  }
  function json(res) { try { return JSON.parse(res.body || '{}'); } catch (e) { return {}; } }
  function emailFromIdToken(t) {
    try {
      const p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(p)))).email || '';
    } catch (e) { return ''; }
  }

  async function token() {
    const s = MQ.local.sync;
    if (s.accessToken && s.expiresAt - 60000 > Date.now()) return s.accessToken;
    const c = cfg();
    const res = await http(OAUTH + '/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({ client_id: c.clientId, client_secret: c.clientSecret, refresh_token: s.refreshToken, grant_type: 'refresh_token' })
    });
    const j = json(res);
    if (res.status !== 200 || !j.access_token) {
      if (j.error === 'invalid_grant') {
        s.refreshToken = null; s.accessToken = null; MQ.saveLocal();
        throw new Error('A autorização do Google expirou ou foi revogada. Entre de novo em Configurações.');
      }
      throw new Error('Não foi possível renovar o acesso ao Google (' + (j.error_description || j.error || res.status) + ').');
    }
    s.accessToken = j.access_token;
    s.expiresAt = Date.now() + (j.expires_in || 3600) * 1000;
    MQ.saveLocal();
    return s.accessToken;
  }

  async function driveFindFile(tk, name) {
    const q = encodeURIComponent("name='" + (name || FILE_NAME) + "' and trashed=false");
    const res = await http(DRIVE + '/files?spaces=appDataFolder&q=' + q + '&fields=files(id,modifiedTime)&pageSize=10', { headers: { Authorization: 'Bearer ' + tk } });
    if (res.status !== 200) throw new Error('Google Drive respondeu ' + res.status + ' ao procurar seus dados.');
    const files = json(res).files || [];
    return files[0] || null;
  }
  async function driveDownload(tk, id) {
    const res = await http(DRIVE + '/files/' + id + '?alt=media', { headers: { Authorization: 'Bearer ' + tk } });
    if (res.status !== 200) throw new Error('Google Drive respondeu ' + res.status + ' ao baixar seus dados.');
    return JSON.parse(res.body);
  }
  async function driveUpload(tk, id, content, name) {
    if (id) {
      const res = await http(UPLOAD + '/files/' + id + '?uploadType=media&fields=id', {
        method: 'PATCH', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json; charset=UTF-8' }, body: content
      });
      if (res.status !== 200) throw new Error('Google Drive respondeu ' + res.status + ' ao enviar seus dados.');
      return id;
    }
    const boundary = 'cadernoR1' + Date.now();
    const meta = JSON.stringify({ name: name || FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' });
    const body = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + boundary +
      '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + content + '\r\n--' + boundary + '--';
    const res = await http(UPLOAD + '/files?uploadType=multipart&fields=id', {
      method: 'POST', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'multipart/related; boundary=' + boundary }, body
    });
    if (res.status !== 200) throw new Error('Google Drive respondeu ' + res.status + ' ao criar o arquivo de dados.');
    return json(res).id;
  }

  let running = null;
  MQ.syncNow = function (opts) {
    opts = opts || {};
    if (!MQ.syncConfigured() || !MQ.syncLoggedIn()) return Promise.resolve(false);
    if (!navigator.onLine) { setStatus('error', 'Sem internet. Sincroniza quando voltar.'); return Promise.resolve(false); }
    if (running) return running;
    running = (async () => {
      setStatus('busy', 'Sincronizando…');
      try {
        const tk = await token();
        const s = MQ.local.sync;
        let file = await driveFindFile(tk);
        let changed = 0;
        if (file) {
          const remote = await driveDownload(tk, file.id);
          changed = MQ.mergeData(remote);
        }
        await MQ.saveNow();
        s.fileId = await driveUpload(tk, file ? file.id : null, JSON.stringify(MQ.data));
        /* Imagens: arquivo separado, só baixado quando mudou e só enviado quando há imagem nova */
        const mf = await driveFindFile(tk, MEDIA_NAME);
        if (mf && mf.modifiedTime && mf.modifiedTime !== s.mediaRemoteTime) {
          const rm = await driveDownload(tk, mf.id);
          if (MQ.mergeMedia(rm, false)) changed++;
          if (Object.keys(MQ.media).length > Object.keys(rm || {}).length) MQ.local.mediaDirty = true;
          s.mediaRemoteTime = mf.modifiedTime;
        }
        if (MQ.local.mediaDirty || (!mf && Object.keys(MQ.media).length)) {
          await driveUpload(tk, mf ? mf.id : null, JSON.stringify(MQ.media), MEDIA_NAME);
          const after = await driveFindFile(tk, MEDIA_NAME);
          s.mediaRemoteTime = after && after.modifiedTime;
          MQ.local.mediaDirty = false;
        }
        s.lastSync = Date.now();
        MQ.saveLocal();
        setStatus('idle', 'Sincronizado ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        if (changed && ['questoes', 'listas', 'desempenho', 'configuracoes'].includes(MQ.route().name)) MQ.render();
        if (opts.manual) MQ.toast(changed ? 'Sincronizado: ' + changed + ' itens vieram de outro aparelho.' : 'Sincronizado. Tudo em dia.');
        return true;
      } catch (e) {
        console.error(e);
        setStatus('error', 'Falha ao sincronizar');
        if (opts.manual) MQ.toast(e.message || String(e), 'err');
        return false;
      } finally { running = null; }
    })();
    return running;
  };

  /* Sincroniza automaticamente: ao abrir, após mudanças e periodicamente */
  let debounce = null;
  MQ.initSync = function () {
    if (MQ.syncLoggedIn()) { setStatus('idle', 'Conectado'); MQ.syncNow(); }
    else setStatus('off', MQ.syncConfigured() ? 'Não conectado' : 'Sem sincronização');
    MQ.onChange(() => {
      if (!MQ.syncLoggedIn()) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => MQ.syncNow(), 15000);
    });
    setInterval(() => { if (MQ.syncLoggedIn()) MQ.syncNow(); }, 5 * 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && MQ.syncLoggedIn()) { clearTimeout(debounce); MQ.syncNow(); } });
    window.addEventListener('online', () => { if (MQ.syncLoggedIn()) MQ.syncNow(); });
  };

  /* Login: pede um código e o usuário confirma em google.com/device */
  async function login() {
    const c = cfg();
    let res;
    try {
      res = await http(OAUTH + '/device/code', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ client_id: c.clientId, scope: SCOPE }) });
    } catch (e) { MQ.toast('Sem conexão com o Google. Verifique a internet.', 'err'); return; }
    const d = json(res);
    if (res.status !== 200 || !d.device_code) { MQ.toast('O Google recusou o pedido (' + (d.error_description || d.error || res.status) + '). Confira o ID do cliente.', 'err'); return; }
    const url = d.verification_url || d.verification_uri || 'https://www.google.com/device';
    let cancelled = false, timer = null;
    const m = MQ.modal({
      title: 'Entrar com o Google',
      body: '<ol class="steps"><li>Abra <b>' + esc(url.replace(/^https?:\/\//, '')) + '</b> em qualquer aparelho (pode ser o celular).</li><li>Entre com a conta Google em que os dados vão ficar.</li><li>Digite este código:</li></ol>' +
        '<div class="code-box" id="dev-code">' + esc(d.user_code) + '</div>' +
        '<p class="muted small" id="dev-status">Aguardando a confirmação no Google…</p>',
      onClose: () => { cancelled = true; clearTimeout(timer); },
      actions: [
        { label: 'Copiar código', kind: 'ghost', onClick: () => { (navigator.clipboard ? navigator.clipboard.writeText(d.user_code) : Promise.reject()).then(() => MQ.toast('Código copiado.')).catch(() => MQ.toast('Copie o código manualmente.')); return false; } },
        { label: 'Abrir página do Google', kind: 'primary', onClick: () => { MQ.openExternal(url); return false; } }
      ]
    });
    let interval = (d.interval || 5) * 1000;
    const deadline = Date.now() + (d.expires_in || 1800) * 1000;
    async function poll() {
      if (cancelled) return;
      if (Date.now() > deadline) { $('#dev-status', m.root).textContent = 'O código expirou. Feche e tente de novo.'; return; }
      let r;
      try {
        r = await http(OAUTH + '/token', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form({ client_id: c.clientId, client_secret: c.clientSecret, device_code: d.device_code, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' })
        });
      } catch (e) { timer = setTimeout(poll, interval); return; }
      const j = json(r);
      if (j.access_token) {
        const s = MQ.local.sync;
        s.accessToken = j.access_token; s.refreshToken = j.refresh_token; s.expiresAt = Date.now() + (j.expires_in || 3600) * 1000;
        s.email = emailFromIdToken(j.id_token || '');
        await MQ.saveLocal();
        m.close();
        MQ.toast('Conectado' + (s.email ? ' como ' + s.email : '') + '. Sincronizando…');
        await MQ.syncNow({ manual: true });
        MQ.render();
        return;
      }
      if (j.error === 'authorization_pending') { timer = setTimeout(poll, interval); return; }
      if (j.error === 'slow_down') { interval += 5000; timer = setTimeout(poll, interval); return; }
      if (j.error === 'access_denied') { $('#dev-status', m.root).textContent = 'Acesso negado no Google. Feche e tente de novo se foi engano.'; return; }
      $('#dev-status', m.root).textContent = 'Erro do Google: ' + (j.error_description || j.error || r.status) + '.';
    }
    timer = setTimeout(poll, interval);
  }

  async function logout() {
    const ok = await MQ.confirm('Desconectar este aparelho', 'Este aparelho para de sincronizar. Seus dados continuam aqui e na sua conta Google.', 'Desconectar');
    if (!ok) return;
    const s = MQ.local.sync;
    const rt = s.refreshToken;
    s.accessToken = null; s.refreshToken = null; s.expiresAt = 0; s.email = '';
    await MQ.saveLocal();
    if (rt) http(OAUTH + '/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ token: rt }) }).catch(() => {});
    setStatus('off', 'Não conectado');
    MQ.render();
  }

  /* Seção "Conta e sincronização" da tela Configurações */
  MQ.syncSection = function (root) {
    const s = MQ.local.sync || {};
    const c = cfg();
    const fromFile = !!(window.MQ_CONFIG && window.MQ_CONFIG.googleClientId);
    const platform = window.mqNative ? 'Windows' : (window.Capacitor && window.Capacitor.getPlatform ? (window.Capacitor.getPlatform() === 'android' ? 'Android' : 'Navegador') : 'Navegador');
    root.innerHTML =
      (MQ.syncLoggedIn()
        ? '<section class="sync-card"><h2>Conectado</h2><dl class="kv"><dt>Conta</dt><dd>' + esc(s.email || 'conta Google') + '</dd><dt>Este aparelho</dt><dd>' + platform + '</dd><dt>Última sincronização</dt><dd>' + (s.lastSync ? MQ.fmtDateTime(s.lastSync) : 'ainda não') + '</dd><dt>Situação</dt><dd>' + esc(MQ.syncStatus.msg) + '</dd></dl>' +
          '<p class="muted small">Sincroniza sozinho ao abrir o app, alguns segundos depois de cada mudança e a cada 5 minutos. Quando o mesmo item é editado nos dois aparelhos, vale a edição mais recente.</p>' +
          '<div class="toolbar"><button class="btn primary" id="sy-now">' + icon('sync') + ' Sincronizar agora</button><button class="btn ghost" id="sy-out">Desconectar este aparelho</button></div></section>'
        : (MQ.syncConfigured()
          ? '<section class="sync-card"><h2>Conectar conta Google</h2><p>Você vai confirmar o acesso no site do Google digitando um código. O app só enxerga a própria pasta oculta no seu Drive, nada mais.</p><button class="btn primary" id="sy-in">' + icon('cloud') + ' Entrar com o Google</button></section>'
          : '<section class="sync-card"><h2>Falta configurar o acesso ao Google</h2><p>Para sincronizar, o app precisa de um <b>ID do cliente</b> e uma <b>chave secreta</b> criados por você no Google Cloud (é gratuito e leva uns 5 minutos — passo a passo no LEIA-ME que veio com o app). Use os mesmos valores no Windows e no Android.</p></section>')) +
      '<section class="sync-card"><h2>Credencial do Google</h2>' +
      (fromFile ? '<p class="muted small">Esta versão do app já veio com a credencial configurada.</p>' : '') +
      '<label class="field"><span>ID do cliente OAuth</span><input type="text" id="sy-cid" value="' + esc(c.clientId) + '" placeholder="123456-abc.apps.googleusercontent.com" autocomplete="off"></label>' +
      '<label class="field"><span>Chave secreta do cliente</span><input type="password" id="sy-sec" value="' + esc(c.clientSecret) + '" placeholder="GOCSPX-…" autocomplete="off"><small>Tipo de cliente: "TVs e dispositivos de entrada limitada".</small></label>' +
      '<button class="btn" id="sy-save">Salvar credencial</button></section>';

    if ($('#sy-now', root)) $('#sy-now', root).onclick = async () => { await MQ.syncNow({ manual: true }); MQ.render(); };
    if ($('#sy-out', root)) $('#sy-out', root).onclick = logout;
    if ($('#sy-in', root)) $('#sy-in', root).onclick = login;
    $('#sy-save', root).onclick = () => {
      const s2 = MQ.local.sync || (MQ.local.sync = {});
      s2.clientId = $('#sy-cid', root).value.trim();
      s2.clientSecret = $('#sy-sec', root).value.trim();
      MQ.saveLocal();
      setStatus('off', MQ.syncConfigured() ? 'Não conectado' : 'Sem sincronização');
      MQ.toast(MQ.syncConfigured() ? 'Credencial salva. Agora clique em "Entrar com o Google".' : 'Preencha o ID e a chave secreta.');
      MQ.render();
    };
  };
})(window.MQ);
