const { app, BrowserWindow, Menu, protocol, net, session, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveAsset } = require('./protocol.cjs');

const testing = process.argv.includes('--smoke-test');
if (testing) {
  const outputArg = process.argv.find(arg => arg.startsWith('--smoke-output='));
  if (outputArg) app.setPath('userData', path.join(path.resolve(outputArg.slice('--smoke-output='.length)), 'profile'));
}
protocol.registerSchemesAsPrivileged([
  { scheme: 'bean', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.setAppUserModelId('com.bujue53.eldenbean');
let mainWindow;

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  protocol.handle('bean', async request => {
    const file = resolveAsset(app.getAppPath(), request.url, testing);
    if (!file || request.method !== 'GET') return new Response('Not found', { status: 404 });
    try {
      const response = await net.fetch(pathToFileURL(file).href);
      const headers = new Headers(response.headers);
      headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'none'");
      return new Response(response.body, { status: response.status, headers });
    } catch { return new Response('Not found', { status: 404 }); }
  });
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === 'pointerLock');
  });
  session.defaultSession.setPermissionCheckHandler((_contents, permission) => permission === 'pointerLock');
  mainWindow = new BrowserWindow({
    title: `${app.getName()} ${app.getVersion()}`,
    width: 1280, height: 720, useContentSize: true,
    minWidth: 960, minHeight: 540,
    backgroundColor: '#080b16', show: false,
    icon: path.join(app.getAppPath(), 'desktop', 'game.ico'),
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, devTools: !app.isPackaged },
  });
  mainWindow.webContents.on('page-title-updated', event => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('bean://game/')) event.preventDefault();
  });
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && !input.isAutoRepeat
      && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  const failed = [];
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (!testing) dialog.showErrorBox('游戏画面已停止', `请重新启动游戏。原因：${details.reason}`);
  });
  if (testing) {
    mainWindow.webContents.on('console-message', details => {
      if (details.level === 'error') failed.push(details.message);
    });
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      if (/^https?:/.test(details.url)) failed.push(`Unexpected network request: ${details.url}`);
      callback({ cancel: /^https?:/.test(details.url) });
    });
  }
  mainWindow.once('ready-to-show', () => mainWindow.show());
  await mainWindow.loadURL(`bean://game/index.html${testing ? '?debug' : ''}`);
  mainWindow.setTitle(`ELDEN BEAN: BEANREIGN ${app.getVersion()}`);
  if (testing) await require('./smoke.cjs').run(mainWindow, failed);
}).catch(error => {
  if (!testing) dialog.showErrorBox('游戏启动失败', error.message);
  console.error(error);
  app.exit(1);
});
app.on('window-all-closed', () => app.quit());
