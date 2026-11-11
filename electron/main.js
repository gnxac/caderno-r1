/* Caderno R1 — processo principal do app para Windows (Electron) */
const { app, BrowserWindow, ipcMain, shell, net } = require('electron');
const path = require('path');

/* Só estes servidores do Google podem ser chamados pelo app */
const ALLOWED_HOSTS = new Set(['oauth2.googleapis.com', 'www.googleapis.com', 'openidconnect.googleapis.com', 'drive.usercontent.google.com']);

/* Build "Caderno R1 Admin" (npm run dist:win:admin): extraMetadata.mqAdmin no package.json empacotado */
let IS_ADMIN = false;
try { IS_ADMIN = !!require('../package.json').mqAdmin; } catch (e) { /* app comum */ }
// Pasta de dados fixa: o nome exibido vai mudar (Pulse), mas os dados salvos continuam nestas pastas.
// O admin usa pasta separada do app comum (outra instância permitida ao mesmo tempo).
app.setPath('userData', path.join(app.getPath('appData'), IS_ADMIN ? 'Caderno R1 Admin' : 'Caderno R1'));

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    backgroundColor: '#F5F6F8',
    title: IS_ADMIN ? 'Caderno R1 Admin' : 'Caderno R1',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: IS_ADMIN ? ['--mq-admin'] : [],
      spellcheck: true
    }
  });
  win.removeMenu();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));

  /* Links externos abrem no navegador padrão */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); }
  });
  /* Ctrl+P imprime; F12 abre ferramentas (útil para suporte) */
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools();
  });
}

/* Requisições ao Google feitas fora da página (sem bloqueio de CORS) */
ipcMain.handle('mq:request', async (_e, req) => {
  let u;
  try { u = new URL(req.url); } catch (err) { return { status: 0, body: 'URL inválida' }; }
  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.hostname)) return { status: 0, body: 'Destino não permitido' };
  try {
    const r = await net.fetch(req.url, { method: req.method || 'GET', headers: req.headers || {}, body: req.body == null ? undefined : req.body });
    return { status: r.status, body: await r.text() };
  } catch (err) {
    throw new Error('Sem conexão com o Google: ' + err.message);
  }
});

ipcMain.handle('mq:open', async (_e, url) => {
  if (typeof url === 'string' && /^https:\/\//.test(url)) await shell.openExternal(url);
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
