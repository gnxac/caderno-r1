/* Caderno R1 — dados locais (IndexedDB) e regras de mesclagem para sincronizar */
(function (MQ) {
  'use strict';

  const DB_NAME = 'caderno-r1';
  const STORE = 'kv';
  const KEY_DATA = 'dados';
  const KEY_LOCAL = 'local';
  const KEY_MEDIA = 'midia';
  /* notes: anotação por questão · reviews: revisão espaçada por questão · prefs: meta e lembrete (sincronizam) */
  const COLLECTIONS = ['questions', 'attempts', 'folders', 'lists', 'runs', 'notes', 'reviews', 'prefs'];
  /* Coleção = objeto de itens por id; "version" e "counter" são números e ficam de fora */
  const isColl = v => !!v && typeof v === 'object' && !Array.isArray(v);
  /* Chaves que, vindas de um JSON, alterariam o protótipo dos objetos */
  const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

  function emptyData() {
    const d = { version: 1, counter: 0 };
    COLLECTIONS.forEach(c => { d[c] = {}; });
    return d;
  }

  MQ.data = emptyData();
  /* Configurações só deste aparelho (não sincronizam) */
  MQ.local = { fontScale: 1, theme: 'auto', sync: {}, deviceId: null, lastSync: 0, seeded: false };

  let idb = null;
  function openIDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function idbGet(key) {
    return new Promise((resolve, reject) => {
      if (!idb) return resolve(JSON.parse(localStorage.getItem('mq:' + key) || 'null'));
      const tx = idb.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }
  function idbSet(key, val) {
    return new Promise((resolve, reject) => {
      if (!idb) { localStorage.setItem('mq:' + key, JSON.stringify(val)); return resolve(); }
      const tx = idb.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  MQ.loadData = async function () {
    try { idb = await openIDB(); } catch (e) { idb = null; }
    const d = await idbGet(KEY_DATA);
    const l = await idbGet(KEY_LOCAL);
    if (d) {
      MQ.data = Object.assign(emptyData(), d);
      COLLECTIONS.forEach(c => { if (!MQ.data[c]) MQ.data[c] = {}; });
    }
    if (l) MQ.local = Object.assign(MQ.local, l);
    MQ.media = (await idbGet(KEY_MEDIA)) || {};
    if (!MQ.local.deviceId) { MQ.local.deviceId = MQ.uid(); await MQ.saveLocal(); }
  };

  /* ---------- Imagens (ficam separadas dos dados para a sincronização não pesar) ---------- */
  MQ.media = {};
  MQ.saveMedia = function () { return idbSet(KEY_MEDIA, MQ.media); };
  /* Junta imagens recebidas; devolve quantas eram novas */
  MQ.mergeMedia = function (incoming, markDirty) {
    let n = 0;
    Object.keys(incoming || {}).forEach(id => { if (!MQ.media[id]) { MQ.media[id] = incoming[id]; n++; } });
    if (n) {
      MQ.saveMedia();
      if (markDirty) { MQ.local.mediaDirty = true; MQ.saveLocal(); }
    }
    return n;
  };
  MQ.imgHtml = function (id, alt) {
    const src = MQ.media[id];
    if (!src) return '<div class="qimg missing">Imagem ainda não baixada. Sincronize para carregar.</div>';
    return '<figure class="qimg"><img src="' + src + '" alt="' + MQ.esc(alt || 'Imagem da questão') + '" loading="lazy" data-zoom="' + MQ.esc(id) + '"></figure>';
  };

  let saveTimer = null, dirty = false;
  const changeListeners = [];
  MQ.onChange = fn => changeListeners.push(fn);

  /* Marca alteração: salva em seguida e avisa a sincronização */
  /* Falha ao gravar (disco cheio, navegador em modo restrito): sem aviso o estudante acha que está salvo */
  const saveFailed = e => { console.error(e); MQ.toast('Não foi possível salvar neste navegador (talvez sem espaço). Exporte um backup em Configurações › Dados e backup.', 'err'); };
  MQ.touch = function () {
    clearTimeout(saveTimer);
    dirty = true;
    saveTimer = setTimeout(() => { dirty = false; idbSet(KEY_DATA, MQ.data).catch(saveFailed); }, 250);
    changeListeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  };
  MQ.saveNow = function () {
    clearTimeout(saveTimer);
    dirty = false;
    return idbSet(KEY_DATA, MQ.data);
  };
  /* Fechar ou recarregar a aba logo depois de responder não perde o dado do debounce de 250 ms */
  const flush = () => { if (dirty) MQ.saveNow().catch(saveFailed); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  MQ.saveLocal = function () { return idbSet(KEY_LOCAL, MQ.local); };
  /* Apaga tudo deste navegador (troca de conta ou "sair e apagar"); mantém só o id do aparelho */
  MQ.resetData = async function () {
    clearTimeout(saveTimer);
    MQ.data = emptyData(); MQ.media = {};
    MQ.local = { fontScale: 1, theme: 'auto', sync: {}, deviceId: MQ.local.deviceId, lastSync: 0, seeded: false };
    await idbSet(KEY_DATA, MQ.data); await idbSet(KEY_MEDIA, MQ.media); await idbSet(KEY_LOCAL, MQ.local);
  };

  /* Registra/atualiza um item numa coleção */
  MQ.put = function (coll, obj) {
    obj.updatedAt = MQ.now();
    if (!obj.createdAt) obj.createdAt = obj.updatedAt;
    MQ.data[coll][obj.id] = obj;
    MQ.touch();
    return obj;
  };
  /* Exclusão vira "lápide" para que a sincronização propague a remoção */
  MQ.remove = function (coll, id) {
    const o = MQ.data[coll][id];
    if (!o) return;
    MQ.data[coll][id] = { id, deleted: true, updatedAt: MQ.now(), createdAt: o.createdAt };
    MQ.touch();
  };
  MQ.alive = function (coll) {
    return Object.values(MQ.data[coll]).filter(o => o && !o.deleted);
  };
  MQ.get = function (coll, id) {
    const o = MQ.data[coll][id];
    return o && !o.deleted ? o : null;
  };

  MQ.nextCode = function () {
    let max = MQ.data.counter || 0;
    Object.values(MQ.data.questions).forEach(q => {
      const m = q && q.codigo && /^R1-(\d+)$/.exec(q.codigo);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    MQ.data.counter = max + 1;
    return 'R1-' + String(max + 1).padStart(5, '0');
  };

  /* Mescla dados remotos nos locais: em cada item vence a edição mais recente.
     Mescla toda coleção que vier, inclusive as que esta versão ainda não usa,
     para não apagar do Drive dados gravados por uma versão mais nova do app. */
  MQ.mergeData = function (remote) {
    let changed = 0;
    if (!remote) return 0;
    Object.keys(remote).forEach(c => {
      const r = remote[c];
      if (UNSAFE.has(c) || !isColl(r)) return;
      const has = Object.prototype.hasOwnProperty.call(MQ.data, c);
      if (has && !isColl(MQ.data[c])) return;
      const l = has ? MQ.data[c] : (MQ.data[c] = {});
      Object.keys(r).forEach(id => {
        const ro = r[id];
        if (UNSAFE.has(id) || !ro || typeof ro !== 'object') return;
        const lo = Object.prototype.hasOwnProperty.call(l, id) ? l[id] : null;
        if (!lo || (ro.updatedAt || 0) > (lo.updatedAt || 0)) { l[id] = ro; changed++; }
      });
    });
    MQ.data.counter = Math.max(MQ.data.counter || 0, remote.counter || 0);
    if (changed) { idbSet(KEY_DATA, MQ.data).catch(e => console.error(e)); }
    return changed;
  };

  /* ---------- Consultas sobre respostas ---------- */
  MQ.attemptsByQ = function (filterFn) {
    const map = {};
    MQ.alive('attempts').forEach(a => {
      if (filterFn && !filterFn(a)) return;
      (map[a.qid] = map[a.qid] || []).push(a);
    });
    Object.values(map).forEach(arr => arr.sort((x, y) => x.ts - y.ts));
    return map;
  };

  /* Última resposta de cada questão (opcionalmente só num contexto, ex.: 'lista:ID') */
  MQ.latestByQ = function (ctx) {
    const map = {};
    MQ.alive('attempts').forEach(a => {
      if (ctx && a.ctx !== ctx) return;
      const cur = map[a.qid];
      if (!cur || a.ts > cur.ts) map[a.qid] = a;
    });
    return map;
  };

  /* ---------- Revisão espaçada (caixas de Leitner) ----------
     Coleção "reviews", um item por questão (id = id da questão): { box, due, lastAt }.
     Errou: volta para a caixa 0 e reaparece em 1 dia. Acertou uma questão em revisão que já venceu: sobe uma caixa
     (1, 3, 7, 15, 30 dias) e, depois da última, sai da revisão. */
  const DAY = 86400000, REV_DAYS = [1, 3, 7, 15, 30];
  MQ.DAY = DAY;
  MQ.endOfDay = function (ts) { const d = new Date(ts); d.setHours(23, 59, 59, 999); return d.getTime(); };
  MQ.endOfToday = function () { return MQ.endOfDay(Date.now()); };
  MQ.reviewUpdate = function (a) {
    if (!a || !MQ.get('questions', a.qid)) return;
    const cur = MQ.get('reviews', a.qid);
    const at = a.ts || MQ.now();
    const set = (box, days) => MQ.put('reviews', Object.assign(cur || { id: a.qid, qid: a.qid }, { box, due: at + days * DAY, lastAt: at }));
    if (!a.correct) set(0, REV_DAYS[0]);
    else if (cur && cur.due > MQ.endOfDay(at)) return; // ainda não venceu: acertar de novo antes da hora não sobe a caixa
    else if (cur) {
      const box = cur.box + 1;
      if (box >= REV_DAYS.length) MQ.remove('reviews', a.qid); else set(box, REV_DAYS[box]);
    }
  };
  /* Revisões que vencem até o fim de hoje (inclui as atrasadas) */
  MQ.reviewsDue = function () {
    const lim = MQ.endOfToday();
    return MQ.alive('reviews').filter(r => r.due <= lim && MQ.get('questions', r.qid));
  };

  MQ.recordAttempt = function (qid, choice, ctx, timeSec) {
    const q = MQ.get('questions', qid);
    if (!q) return null;
    const a = {
      id: MQ.uid(), qid, choice, correct: choice === q.gabarito,
      ctx: ctx || 'banco', ts: MQ.now(), timeSec: timeSec || null,
      device: MQ.local.deviceId
    };
    MQ.put('attempts', a);
    MQ.reviewUpdate(a);
    MQ.saveNow(); // o pagehide não garante a gravação no IndexedDB; a resposta vai direto ao disco
    return a;
  };

  /* Caminho de assunto da questão: [área, especialidade, tema, subtema] sem vazios */
  MQ.qPath = function (q) {
    return [q.area, q.especialidade, q.tema, q.subtema].map(s => (s || '').trim()).filter(Boolean);
  };

  MQ.views = MQ.views || {};

  MQ.AREAS = ['Clínica Médica', 'Cirurgia', 'Pediatria', 'Ginecologia', 'Obstetrícia', 'Medicina Preventiva', 'Outros'];
})(window.MQ);
