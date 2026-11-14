/* Caderno R1 — sincronização pela conta Google (pasta oculta do app no Google Drive).
   Login pelo fluxo de "código no google.com/device", que funciona igual no Windows e no Android. */
(function (MQ) {
  'use strict';
  const { esc, $, icon } = MQ;

  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file openid email';
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
  /* No site (navegador) o login é o do Google Identity Services, em auth.js; nos apps nativos, o fluxo de código abaixo */
  const web = () => !!(MQ.auth && MQ.auth.web);
  MQ.syncConfigured = () => (web() ? MQ.auth.configured() : !!(cfg().clientId && cfg().clientSecret));
  MQ.syncLoggedIn = () => (web() ? !!MQ.auth.user() : !!(MQ.local.sync && MQ.local.sync.refreshToken));

  /* state: off, idle, busy, offline (sem internet: neutro), auth (precisa reconectar), error. detail = explicação com a ação */
  MQ.syncDot = state => ({ idle: 'on', busy: 'busy', auth: 'busy', error: 'err' }[state] || '');
  function setStatus(state, msg, detail, kind) {
    MQ.syncStatus = { state, msg, detail: detail || '', kind: kind || '' };
    const cls = 'sync-dot ' + MQ.syncDot(state);
    document.querySelectorAll('.sync-dot').forEach(d => { d.className = cls; });
    document.querySelectorAll('.sync-label').forEach(l => { l.textContent = msg; });
    document.querySelectorAll('.sync-pill, .home-sync').forEach(p => { p.title = detail || msg; p.setAttribute('aria-label', 'Sincronização: ' + msg); });
    const short = { idle: 'Em dia', busy: 'Enviando', error: 'Falhou', offline: 'Sem rede', auth: 'Reconectar' }[state] || 'Local'; // texto curto para a barra lateral estreita
    document.querySelectorAll('.sync-short').forEach(l => { l.textContent = short; });
  }
  /* Qualquer falha vira um problema com texto em português; o detalhe técnico fica só no console */
  function report(e, opts) {
    const p = e && e.kind ? e : MQ.problem('other');
    if (p.kind !== 'offline') console.error(e);
    setStatus(p.kind === 'offline' ? 'offline' : /^(auth|denied)$/.test(p.kind) ? 'auth' : 'error', p.short, p.message, p.kind);
    if (opts && opts.manual) MQ.toast(p.message, 'err');
  }

  /* Requisição HTTP: no Windows passa pelo processo principal (sem CORS);
     no Android o Capacitor faz a requisição nativa; no navegador usa fetch. */
  async function http(url, opts) {
    opts = opts || {};
    if (window.mqNative && window.mqNative.request) {
      return window.mqNative.request({ url, method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body || null });
    }
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 60000); // sem resposta em 60 s: desiste em vez de ficar "Sincronizando…" para sempre
    try {
      const r = await fetch(url, { method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body || undefined, signal: ctl.signal });
      return { status: r.status, body: await r.text() };
    } catch (e) { throw MQ.problem(ctl.signal.aborted ? 'slow' : navigator.onLine ? 'net' : 'offline'); }
    finally { clearTimeout(t); }
  }
  /* Resposta de erro do Drive: 401 sessão, 403 acesso ou cota, 429 limite, 5xx instabilidade */
  function fail(res) {
    const reason = ((((json(res).error || {}).errors || [])[0]) || {}).reason || '';
    const kind = res.status === 401 ? 'auth' : /storageQuota/i.test(reason) ? 'quota' : res.status === 429 || /ratelimit/i.test(reason) ? 'rate' : res.status === 403 ? 'denied' : res.status >= 500 ? 'server' : 'other';
    if (kind === 'auth' && web()) MQ.auth.expire();
    console.error('Drive', res.status, reason);
    return MQ.problem(kind);
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
    if (web()) return MQ.auth.getToken();
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
        throw MQ.problem('auth');
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
    if (res.status !== 200) throw fail(res);
    const files = json(res).files || [];
    return files[0] || null;
  }
  async function driveDownload(tk, id) {
    const res = await http(DRIVE + '/files/' + id + '?alt=media', { headers: { Authorization: 'Bearer ' + tk } });
    if (res.status !== 200) throw fail(res);
    let d; try { d = JSON.parse(res.body); } catch (e) { throw MQ.problem('data'); }
    if (!d || typeof d !== 'object') throw MQ.problem('data');
    return d;
  }
  /* pub=true: arquivo comum no Drive do administrador, legível por qualquer pessoa com o link (banco publicado) */
  async function driveUpload(tk, id, content, name, pub) {
    if (id) {
      const res = await http(UPLOAD + '/files/' + id + '?uploadType=media&fields=id', {
        method: 'PATCH', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json; charset=UTF-8' }, body: content
      });
      if (res.status !== 200) throw fail(res);
      return id;
    }
    const boundary = 'cadernoR1' + Date.now();
    const meta = JSON.stringify({ name: name || FILE_NAME, parents: pub ? undefined : ['appDataFolder'], mimeType: 'application/json' });
    const body = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + boundary +
      '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + content + '\r\n--' + boundary + '--';
    const res = await http(UPLOAD + '/files?uploadType=multipart&fields=id', {
      method: 'POST', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'multipart/related; boundary=' + boundary }, body
    });
    if (res.status !== 200) throw fail(res);
    const newId = json(res).id;
    if (pub) {
      const pr = await http(DRIVE + '/files/' + newId + '/permissions', { method: 'POST', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }) });
      if (pr.status !== 200) throw fail(pr);
    }
    return newId;
  }

  /* ---------- Banco publicado (admin publica; os outros só baixam) ---------- */
  const PUBLIC_URL = 'https://drive.usercontent.google.com/download?export=download&confirm=t&id=';
  const bankManifestId = () => (MQ.local.sync && MQ.local.sync.bankManifestId) || (window.MQ_CONFIG || {}).bankManifestId || '';
  const bankErr = m => Object.assign(new Error(m), { kind: 'bank' });
  async function publicGet(id) {
    const res = await http(PUBLIC_URL + encodeURIComponent(id) + '&t=' + Date.now());
    if (res.status === 404) throw bankErr('O banco publicado não foi encontrado. Avise o administrador.');
    if (res.status === 403 || res.status === 429) throw bankErr('O Google limitou o download do banco por excesso de acessos. Tente de novo mais tarde.');
    if (res.status !== 200) throw bankErr('Não foi possível baixar o banco. Tente de novo mais tarde.');
    try { return JSON.parse(res.body); } catch (e) { throw bankErr('O Google devolveu uma página no lugar do banco. Tente de novo mais tarde.'); } // aviso de cota do Drive vem em HTML
  }
  MQ.bankConfigured = () => !!bankManifestId();

  /* Baixa o banco só quando a versão do manifesto difere da guardada neste aparelho */
  let bankRunning = false, bankTold = false;
  MQ.syncBank = async function (manual) {
    const id = bankManifestId();
    if (bankRunning || MQ.isAdmin()) return; // o administrador é a fonte do banco: aplicar as lápides publicadas apagaria questões dele
    const say = m => { if (manual) MQ.toast(m, 'err'); };
    if (!id) return say('O banco publicado ainda não foi configurado neste app. Avise o administrador.');
    if (!navigator.onLine) return say('Sem internet. Tente atualizar o banco de novo quando conectar.');
    bankRunning = true;
    try {
      const m = await publicGet(id);
      if (!m || !m.bankFileId || !Number.isFinite(m.version)) throw bankErr('As informações do banco publicado estão incompletas. Avise o administrador.');
      if (MQ.local.bank && MQ.local.bank.version === m.version) { if (manual) MQ.toast('O banco já está na versão mais recente.'); return; }
      const bank = await publicGet(m.bankFileId);
      if (!bank || !bank.questions || typeof bank.questions !== 'object' || Array.isArray(bank.questions)) throw bankErr('O arquivo do banco está incompleto. Tente de novo mais tarde.');
      const changed = MQ.mergeDeduped({ questions: bank.questions }).changed;
      MQ.local.bank = { version: m.version, count: m.count, updatedAt: m.updatedAt };
      await MQ.saveLocal();
      if (manual || changed) MQ.toast('Banco atualizado: versão ' + m.version + ', ' + m.count + ' questões.');
      if (['questoes', 'listas', 'desempenho', 'configuracoes'].includes(MQ.route().name)) MQ.render();
    } catch (e) {
      console.error(e);
      const kept = MQ.local.bank ? ' Você continua com a versão ' + MQ.local.bank.version + '.' : '';
      // automático: só avisa se o aparelho ainda não tem banco nenhum, e uma vez por sessão
      if (manual || (!MQ.local.bank && !bankTold)) { bankTold = true; MQ.toast((e.kind ? e.message : 'Não foi possível atualizar o banco. Tente de novo mais tarde.') + kept, 'err'); }
    } finally { bankRunning = false; }
  };

  /* sel: { insts: Set (instituição), lists: Set (ids de listas) }. IDs nunca mudam; o que sai do banco vira deleted:true. */
  async function publishBank(sel) {
    const tk = await token();
    const s = MQ.local.sync;
    if (!s.bankManifestId) s.bankManifestId = (window.MQ_CONFIG || {}).bankManifestId || ''; // outro aparelho do administrador: continua o mesmo banco
    let prevM = null, prev = { questions: {} };
    if (s.bankManifestId) { prevM = await driveDownload(tk, s.bankManifestId); prev = await driveDownload(tk, prevM.bankFileId); }
    const ids = new Set();
    sel.lists.forEach(l => (MQ.get('lists', l) || { qids: [] }).qids.forEach(q => ids.add(q)));
    const now = MQ.now(), out = {};
    MQ.alive('questions').forEach(q => {
      if (q.exemplo || !(sel.insts.has((q.instituicao || '').trim()) || ids.has(q.id))) return;
      const p = prev.questions[q.id];
      out[q.id] = p && p.deleted ? Object.assign({}, q, { updatedAt: now }) : q; // volta ao banco: precisa vencer a lápide
    });
    Object.keys(prev.questions).forEach(id => {
      if (out[id]) return;
      const p = prev.questions[id];
      const lo = MQ.data.questions[id];
      out[id] = p.deleted ? p : Object.assign({ id, deleted: true, createdAt: p.createdAt, updatedAt: now }, lo && lo.dupOf ? { dupOf: lo.dupOf, dupMap: lo.dupMap } : {});
    });
    const count = Object.values(out).filter(q => !q.deleted).length;
    const version = (prevM ? prevM.version : 0) + 1;
    // banco primeiro, manifesto depois: ninguém vê uma versão cujo arquivo ainda não existe
    const bankFileId = await driveUpload(tk, prevM && prevM.bankFileId, JSON.stringify({ version, questions: out }), 'caderno-r1-banco.json', true);
    const isNew = !s.bankManifestId;
    s.bankManifestId = await driveUpload(tk, s.bankManifestId, JSON.stringify({ version, count, updatedAt: now, bankFileId }), 'caderno-r1-banco-versao.json', true);
    MQ.local.bank = { version, count, updatedAt: now };
    await MQ.saveLocal();
    return { version, count, isNew, manifestId: s.bankManifestId };
  }

  MQ.publishDialog = function () {
    if (!MQ.syncLoggedIn()) { MQ.toast('Entre com o Google em Configurações antes de publicar.', 'err'); return; }
    const qs = MQ.alive('questions').filter(q => !q.exemplo);
    const cnt = {};
    qs.forEach(q => { const k = (q.instituicao || '').trim(); cnt[k] = (cnt[k] || 0) + 1; });
    const official = /\b(inep|ebserh|enare|enamed|revalida)\b/i; // provas oficiais marcadas por padrão
    const lists = MQ.alive('lists').sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    const folders = MQ.alive('folders').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const under = fid => lists.filter(l => l.folderId === fid).map(l => l.id).concat(...folders.filter(f => f.parentId === fid).map(f => under(f.id)));
    const row = (attrs, label, n) => '<label class="pub-row"><input type="checkbox" ' + attrs + '> <span>' + esc(label) + '</span> <span class="muted small">' + n + '</span></label>';
    const body = '<p class="muted small">Todos os aparelhos com o app baixam o que você publicar aqui. Questões de exemplo e as que você não marcar ficam só no seu Drive. Uma questão que sair da seleção é marcada como removida, sem apagar o histórico de ninguém.</p>' +
      '<h3>Por instituição</h3>' + Object.keys(cnt).sort().map(k => row('data-inst="' + esc(k) + '"' + (official.test(k) ? ' checked' : ''), k || '(sem instituição)', cnt[k])).join('') +
      (lists.length ? '<h3>Por pasta ou lista</h3>' + folders.map(f => row('data-fl="' + under(f.id).join(',') + '"', 'Pasta: ' + f.name, under(f.id).length + ' listas')).join('') +
        lists.map(l => row('data-list="' + l.id + '"', l.name || 'Lista', l.qids.length)).join('') : '') +
      '<p id="pub-n" class="small"></p>';
    const selection = box => ({
      insts: new Set(MQ.$$('[data-inst]:checked', box).map(x => x.dataset.inst)),
      lists: new Set(MQ.$$('[data-list]:checked', box).map(x => x.dataset.list))
    });
    MQ.modal({
      title: 'Publicar banco para todos', body, wide: true,
      onOpen: box => {
        const recount = () => {
          const x = selection(box), ids = new Set();
          x.lists.forEach(l => (MQ.get('lists', l) || { qids: [] }).qids.forEach(q => ids.add(q)));
          const n = qs.filter(q => x.insts.has((q.instituicao || '').trim()) || ids.has(q.id)).length;
          MQ.$('#pub-n', box).textContent = n ? n + ' questões selecionadas.' : 'Marque ao menos uma instituição ou lista. Publicar sem nada tiraria do banco todas as questões já publicadas.';
          MQ.$('.modal-foot .primary', box).disabled = !n; // 0 selecionadas viraria lápide para todos
        };
        box.addEventListener('change', e => {
          if (e.target.dataset.fl) e.target.dataset.fl.split(',').filter(Boolean).forEach(id => { const c = MQ.$('[data-list="' + id + '"]', box); if (c) c.checked = e.target.checked; });
          recount();
        });
        recount();
      },
      actions: [{ label: 'Cancelar' }, {
        label: 'Publicar', kind: 'primary',
        onClick: (close, box) => {
          MQ.toast('Publicando…');
          publishBank(selection(box)).then(r => {
            MQ.toast('Banco publicado: versão ' + r.version + ', ' + r.count + ' questões.');
            if (r.isNew) MQ.modal({ title: 'Primeira publicação', body: '<p>Para os outros aparelhos baixarem o banco, copie este código para <b>bankManifestId</b> em <code>www/js/config.js</code> e gere os instaladores de novo:</p><div class="code-box">' + esc(r.manifestId) + '</div>' });
            MQ.render();
          }).catch(e => { console.error(e); MQ.toast(e.kind ? e.message : 'Não foi possível publicar o banco. Tente de novo.', 'err'); });
        }
      }]
    });
  };

  let running = null;
  MQ.syncNow = function (opts) {
    opts = opts || {};
    if (!MQ.syncConfigured() || !MQ.syncLoggedIn()) {
      if (opts.manual) MQ.toast(MQ.syncConfigured() ? 'Entre com o Google em Configurações para sincronizar.' : 'Entrar com o Google ainda não está disponível neste endereço.', 'err');
      return Promise.resolve(false);
    }
    if (!navigator.onLine) { report(MQ.problem('offline'), opts); return Promise.resolve(false); }
    if (running) return running;
    running = (async () => {
      setStatus('busy', 'Sincronizando…');
      try {
        const tk = await token();
        const s = MQ.local.sync;
        let file = await driveFindFile(tk);
        let changed = 0;
        if (file) changed = MQ.mergeData(await driveDownload(tk, file.id));
        await MQ.saveNow();
        if (file) { // outro aparelho gravou entre o download e o envio: junta de novo antes de sobrescrever
          const now = await driveFindFile(tk);
          if (now && now.modifiedTime !== file.modifiedTime) { changed += MQ.mergeData(await driveDownload(tk, now.id)); await MQ.saveNow(); }
        }
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
        if (changed && ['inicio', 'questoes', 'listas', 'anotacoes', 'desempenho', 'configuracoes'].includes(MQ.route().name)) MQ.render();
        if (opts.manual) MQ.toast(changed ? 'Sincronizado: ' + changed + ' itens vieram de outro aparelho.' : 'Sincronizado. Tudo em dia.');
        return true;
      } catch (e) {
        report(e, opts);
        return false;
      } finally { running = null; }
    })();
    return running;
  };

  /* Sincroniza automaticamente: ao abrir, após mudanças e periodicamente */
  let debounce = null;
  MQ.initSync = function () {
    MQ.syncBank();
    if (MQ.syncLoggedIn()) { setStatus('idle', 'Conectado'); MQ.syncNow(); }
    else setStatus('off', MQ.syncConfigured() ? 'Não conectado' : 'Sem sincronização');
    MQ.onChange(() => {
      if (!MQ.syncLoggedIn()) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => MQ.syncNow(), 15000);
    });
    setInterval(() => { MQ.syncBank(); if (MQ.syncLoggedIn()) MQ.syncNow(); }, 5 * 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && MQ.syncLoggedIn()) { clearTimeout(debounce); MQ.syncNow(); } });
    window.addEventListener('online', () => { if (MQ.syncLoggedIn()) MQ.syncNow(); });
    window.addEventListener('offline', () => { if (MQ.syncLoggedIn()) report(MQ.problem('offline')); });
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
  /* Explica o problema atual (sem internet, sessão expirada, Drive cheio…) logo acima dos botões */
  function problemHtml() {
    const st = MQ.syncStatus;
    if (!st.detail || !['error', 'offline', 'auth'].includes(st.state)) return '';
    return '<p class="sync-problem' + (st.state === 'error' ? '' : ' soft') + '" role="status">' + esc(st.detail) + '</p>';
  }
  /* Botão em andamento: avisa o leitor de tela, troca o rótulo e não aceita segundo toque */
  async function working(btn, label, fn) {
    const was = btn.innerHTML;
    btn.setAttribute('aria-busy', 'true'); btn.textContent = label;
    try { await fn(); } finally { btn.removeAttribute('aria-busy'); if (btn.isConnected) btn.innerHTML = was; }
  }
  async function reconnect(btn) {
    await working(btn, 'Abrindo o Google…', async () => {
      try { if (await MQ.auth.signIn()) { await MQ.syncNow({ manual: true }); MQ.render(); } } catch (e) { console.error(e); MQ.toast(MQ.auth.explain(e), 'err'); }
    });
  }

  function webSection(root) {
    const s = MQ.local.sync || {};
    const st = MQ.syncStatus.state, quota = MQ.syncStatus.kind === 'quota';
    root.innerHTML =
      '<section class="sync-card"><h2>Conta Google</h2><dl class="kv"><dt>Conta</dt><dd>' + esc(s.email || 'sem conta neste navegador') + '</dd><dt>Última sincronização</dt><dd>' + (s.lastSync ? MQ.fmtDateTime(s.lastSync) : 'ainda não') + '</dd></dl>' +
      '<p class="muted small">' + (MQ.syncLoggedIn() ? 'Sincroniza sozinho com a pasta oculta do app no seu Drive. Se o mesmo item mudar em dois aparelhos, vale a edição mais recente.'
        : MQ.syncConfigured() ? 'Sem conta, seus dados ficam só neste navegador.' : 'Entrar com Google ainda não está disponível neste endereço. Seus dados ficam só neste navegador: exporte um backup de vez em quando.') + '</p>' +
      problemHtml() +
      '<div class="toolbar">' + (MQ.syncLoggedIn()
        ? '<button class="btn' + (st === 'auth' ? '' : st === 'error' ? ' primary' : '') + '" id="sy-now">' + icon('sync') + ' ' + (st === 'error' ? 'Tentar de novo' : 'Sincronizar agora') + '</button><button class="btn' + (st === 'auth' ? ' primary' : '') + '" id="sy-re">Reconectar</button>' + (quota ? '<button class="btn" id="sy-quota">Gerenciar espaço do Drive</button>' : '') + '<button class="btn ghost" id="sy-out">Sair</button>'
        : MQ.syncConfigured() ? '<button class="btn primary" id="sy-in">' + icon('cloud') + ' Entrar com o Google</button>' : '<button class="btn primary" id="sy-bkp">' + icon('download') + ' Exportar backup</button>') + '</div>' +
      (MQ.syncLoggedIn() ? '<details class="sync-danger"><summary>Computador compartilhado?</summary><p class="muted small">Sair e apagar remove questões, respostas e anotações deste navegador. Exporte um backup antes.</p><div class="toolbar"><button class="btn" id="sy-bkp2">' + icon('download') + ' Exportar backup antes</button><button class="btn danger" id="sy-wipe">Sair e apagar dados daqui</button></div></details>' : '') + '</section>';
    const on = (id, fn) => { if ($(id, root)) $(id, root).onclick = fn; };
    on('#sy-now', e => working(e.currentTarget, 'Sincronizando…', async () => { await MQ.syncNow({ manual: true }); MQ.render(); }));
    on('#sy-re', e => reconnect(e.currentTarget));
    on('#sy-in', e => reconnect(e.currentTarget));
    on('#sy-quota', () => MQ.openExternal('https://one.google.com/storage'));
    on('#sy-bkp', MQ.backupExport);
    on('#sy-bkp2', MQ.backupExport);
    on('#sy-out', () => MQ.auth.signOut(false));
    on('#sy-wipe', () => MQ.auth.signOut(true));
  }

  MQ.syncSection = function (root) {
    if (web()) return webSection(root);
    const s = MQ.local.sync || {};
    const c = cfg();
    const fromFile = !!(window.MQ_CONFIG && window.MQ_CONFIG.googleClientId);
    root.innerHTML =
      (MQ.syncLoggedIn()
        ? '<section class="sync-card"><h2>Conectado</h2><dl class="kv"><dt>Conta</dt><dd>' + esc(s.email || 'conta Google') + '</dd><dt>Última sincronização</dt><dd>' + (s.lastSync ? MQ.fmtDateTime(s.lastSync) : 'ainda não') + '</dd></dl>' +
          '<p class="muted small">Sincroniza sozinho. Se o mesmo item mudar em dois aparelhos, vale a edição mais recente.</p>' +
          problemHtml() +
          '<div class="toolbar"><button class="btn' + (MQ.syncStatus.state === 'error' ? ' primary' : '') + '" id="sy-now">' + icon('sync') + ' Sincronizar agora</button><button class="btn ghost" id="sy-out">Desconectar este aparelho</button></div></section>'
        : (MQ.syncConfigured()
          ? '<section class="sync-card"><h2>Entrar com o Google</h2><p>Enquanto você não entra, suas respostas, listas e simulados ficam só neste aparelho. Entre com a mesma conta no Windows e no Android para mantê-los iguais. O app só acessa a pasta oculta dele no seu Drive.</p><button class="btn primary" id="sy-in">' + icon('cloud') + ' Entrar com o Google</button></section>'
          : '<section class="sync-card"><h2>Entrar com o Google não está disponível</h2><p>Esta versão do app ainda não tem o acesso ao Google configurado. Seus dados continuam salvos neste aparelho.' + (MQ.isAdmin() ? '' : ' Peça ao administrador a versão atualizada do app.') + '</p></section>')) +
      '<details class="sync-card adv-cred"' + (MQ.syncConfigured() ? '' : ' open') + '><summary>Avançado: credencial do Google</summary>' +
      (fromFile ? '<p class="muted small">Esta versão do app já veio com a credencial configurada.</p>' : '<p class="muted small">Só para quem gera o app: crie o ID e a chave no Google Cloud (passo a passo no LEIA-ME) e use os mesmos valores no Windows e no Android.</p>') +
      '<label class="field"><span>ID do cliente OAuth</span><input type="text" id="sy-cid" value="' + esc(c.clientId) + '" placeholder="123456-abc.apps.googleusercontent.com" autocomplete="off"></label>' +
      '<label class="field"><span>Chave secreta do cliente</span><input type="password" id="sy-sec" value="' + esc(c.clientSecret) + '" placeholder="GOCSPX-…" autocomplete="off"><small>Tipo de cliente: "TVs e dispositivos de entrada limitada".</small></label>' +
      '<button class="btn" id="sy-save">Salvar credencial</button></details>';

    if ($('#sy-now', root)) $('#sy-now', root).onclick = e => working(e.currentTarget, 'Sincronizando…', async () => { await MQ.syncNow({ manual: true }); MQ.render(); });
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
