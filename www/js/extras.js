/* Pulse — extras: lembrete diário por notificação (Android) */
(function (MQ) {
  'use strict';

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
