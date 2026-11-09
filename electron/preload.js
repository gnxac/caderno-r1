/* Caderno R1 — ponte segura entre a página e o Windows */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mqNative', {
  platform: 'windows',
  admin: process.argv.includes('--mq-admin'), // build "Caderno R1 Admin": painel de administrador sempre ligado
  request: (req) => ipcRenderer.invoke('mq:request', req),
  openExternal: (url) => ipcRenderer.invoke('mq:open', url)
});
