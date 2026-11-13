/* Pulse — extras: flashcards para o Anki (.txt de importação) e lembrete diário por notificação (Android) */
(function (MQ) {
  'use strict';

  /* ---------- Anki ---------- */
  /* Campo do arquivo de importação: entre aspas, aspas dobradas, sem tabulação nem quebra de linha crua */
  const field = s => '"' + String(s == null ? '' : s).replace(/\t/g, ' ').replace(/\r\n|\r|\n/g, '<br>').replace(/"/g, '""') + '"';
  const clean = s => String(s || '').replace(/::/g, ':').replace(/[\t\r\n]+/g, ' ').trim();

  /* Um cartão por questão: frente = enunciado e alternativas; verso = gabarito, comentário e a sua anotação.
     shortcut: imagens da questão não vão no cartão (seriam dados enormes no .txt); acrescentar pelo Anki se precisar. */
  MQ.ankiNote = function (q) {
    const esc = MQ.esc;
    const alts = (q.alternativas || []).map(a => '<li><b>' + esc(a.l) + ')</b> ' + esc(a.t) + '</li>').join('');
    const right = (q.alternativas || []).find(a => a.l === q.gabarito);
    const note = MQ.noteOf ? MQ.noteOf(q.id) : '';
    const path = MQ.qPath(q).map(clean).filter(Boolean);
    return {
      front: MQ.para(q.enunciado) + (alts ? '<ul style="list-style:none;padding-left:0">' + alts + '</ul>' : ''),
      back: '<p><b>Gabarito: ' + esc(q.gabarito) + (right ? ') ' + esc(right.t) : '') + '</b></p>' + (q.comentario ? MQ.para(q.comentario) : '') + (note ? '<hr><p><i>Minha anotação:</i> ' + esc(note) + '</p>' : ''),
      deck: ['Pulse'].concat(path.length ? path : ['Sem assunto']).join('::'),
      tags: [q.codigo, q.instituicao, q.ano].filter(Boolean).map(t => clean(t).replace(/\s+/g, '_')).join(' ')
    };
  };

  /* Texto de importação do Anki: o guid é o id da questão, então importar de novo atualiza em vez de duplicar */
  MQ.ankiText = function (qids) {
    const qs = qids.map(id => MQ.get('questions', id)).filter(Boolean);
    const head = ['#separator:tab', '#html:true', '#notetype:Basic', '#deck column:3', '#tags column:4', '#guid column:5'].join('\n');
    return { count: qs.length, text: head + '\n' + qs.map(q => { const n = MQ.ankiNote(q); return [n.front, n.back, n.deck, n.tags, q.id].map(field).join('\t'); }).join('\n') + '\n' };
  };

  MQ.ankiExport = function (qids, name) {
    const r = MQ.ankiText(qids);
    if (!r.count) { MQ.toast('Nenhuma questão para exportar.'); return; }
    const slug = String(name || 'questoes').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'questoes';
    MQ.saveFile('pulse-anki-' + slug + '-' + new Date().toISOString().slice(0, 10) + '.txt', r.text, 'text/plain;charset=utf-8');
    MQ.toast(r.count + (r.count === 1 ? ' flashcard' : ' flashcards') + '. No Anki: Arquivo > Importar.');
  };

  /* ---------- Lembrete diário (só no app Android; o Windows portátil não roda em segundo plano) ---------- */
  const ln = () => { const c = window.Capacitor; return !!(c && c.isNativePlatform && c.isNativePlatform() && c.Plugins && c.Plugins.LocalNotifications) && c.Plugins.LocalNotifications; };
  MQ.reminderAvailable = () => !!ln();

  /* Agenda (ou cancela) conforme MQ.local.reminder; o texto usa a meta atual, então roda também ao abrir o app */
  MQ.reminderApply = async function () {
    const p = ln();
    if (!p) return;
    try {
      await p.cancel({ notifications: [{ id: 1 }] });
      const r = MQ.local.reminder;
      if (!r || !r.on) return;
      const [hour, minute] = String(r.time || '20:00').split(':').map(Number);
      await p.schedule({ notifications: [{ id: 1, title: 'Hora de estudar', body: 'Sua meta de hoje: ' + MQ.dailyGoal() + ' questões.', schedule: { on: { hour, minute }, allowWhileIdle: true } }] });
    } catch (e) { console.error(e); }
  };

  MQ.reminderSet = async function (on, time) {
    const p = ln();
    if (!p) return false;
    if (on) {
      try {
        const perm = await p.requestPermissions();
        if (perm.display !== 'granted') { MQ.toast('Permita as notificações do Pulse nas configurações do Android.', 'err'); return false; }
      } catch (e) { MQ.toast('Não foi possível pedir a permissão de notificações.', 'err'); return false; }
    }
    MQ.local.reminder = { on: !!on, time: time || '20:00' };
    await MQ.saveLocal();
    await MQ.reminderApply();
    return true;
  };
})(window.MQ);
