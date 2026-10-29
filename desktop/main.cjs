const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { spawn, execFileSync } = require('node:child_process');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const port = Number(process.env.PARLEY_DESKTOP_PORT || 4142);
const root = path.resolve(process.env.PARLEY_DESKTOP_ROOT || path.join(os.homedir(), '.parley-fork'));
const url = `http://127.0.0.1:${port}`;
const instance = crypto.randomUUID();
let backend;
let ready = false;
let quitting = false;
function probe() {
  return new Promise(resolve => {
    const req = http.get(url, { timeout: 1200 }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; if (body.length > 2_000_000) req.destroy(); });
      res.on('end', () => resolve({ occupied: true, compatible: res.statusCode === 200 && body.includes('class="fork-badge"') && body.includes('name="parley-token"') && body.includes('name="parley-runtime-protocol" content="16"'), own: body.includes(`name="parley-desktop-instance" content="${instance}"`) }));
      res.on('error', () => resolve({ occupied: true }));
    });
    req.on('error', error => resolve({ occupied: error.code !== 'ECONNREFUSED' }));
    req.on('timeout', () => req.destroy());
  });
}
function environment() {
  let cliPath = process.env.PATH || '';
  try {
    // Finder does not inherit the user's terminal PATH. Read only PATH from
    // their login shell; keep HOME and existing CLI authentication untouched.
    const output = execFileSync(process.env.SHELL || '/bin/zsh', ['-ilc', 'printf "\\n__PARLEY_PATH__%s\\n" "$PATH"'], { encoding: 'utf8', timeout: 5000 });
    cliPath = output.match(/__PARLEY_PATH__([^\r\n]*)/)?.[1] || cliPath;
  } catch { /* Standard install locations below remain available. */ }
  return { ...process.env, PATH: [...new Set([cliPath, path.join(os.homedir(), '.local/bin'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'].filter(Boolean))].join(path.delimiter), ELECTRON_RUN_AS_NODE: '1', PARLEY_EXACT_PORT: '1', PARLEY_DESKTOP_INSTANCE: instance };
}
async function startBackend() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PARLEY_DESKTOP_PORT must be a port between 1 and 65535.');
  const existing = await probe();
  if (existing.compatible) {
    if (process.env.PARLEY_DESKTOP_ROOT) throw new Error('A backend already uses this port. Choose a free port with PARLEY_DESKTOP_ROOT so an unrelated room store cannot be reused.');
    return;
  }
  if (existing.occupied) throw new Error(`Port ${port} belongs to another or incompatible service. It was left running.`);
  const source = app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : app.getAppPath();
  backend = spawn(process.execPath, [path.join(source, 'bin/parley-mine.mjs'), '--port', String(port), '--root', root, '--no-open'], { cwd: os.homedir(), env: environment(), stdio: ['ignore', 'pipe', 'pipe'] });
  let failure;
  let diagnostics = '';
  backend.on('error', error => { failure = error; });
  backend.stderr.on('data', chunk => { diagnostics = (diagnostics + chunk).slice(-4000); });
  backend.stdout.resume();
  backend.on('exit', () => {
    if (ready && !quitting) { dialog.showErrorBox('Parley backend stopped', 'The backend started by this app stopped. Quit and reopen Parley to reconnect.'); app.quit(); }
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (failure) throw failure;
    if (backend.exitCode !== null) throw new Error(`Backend could not start. ${diagnostics}`);
    const status = await probe();
    if (status.compatible && status.own) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Backend did not become ready at ${url}. ${diagnostics}`);
}
function local(target) {
  try { return new URL(target).origin === url; } catch { return false; }
}
function external(target) {
  if (/^https?:\/\//i.test(target)) shell.openExternal(target).catch(() => {});
}
function createWindow() {
  const win = new BrowserWindow({ width: 1440, height: 960, minWidth: 900, minHeight: 620, title: 'Parley', backgroundColor: '#111318', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: false } });
  win.webContents.setWindowOpenHandler(({ url: target }) => { external(target); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (event, target) => {
    if (!local(target)) { event.preventDefault(); external(target); }
  });
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.loadURL(`${url}/?home=1`).catch(error => dialog.showErrorBox('Could not open Parley', error.message));
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const win = BrowserWindow.getAllWindows()[0]; if (win) { if (win.isMinimized()) win.restore(); win.focus(); } else if (ready) createWindow(); });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
      { role: 'help', submenu: [{ label: 'Open Parley in Browser', click: () => external(`${url}/?home=1`) }] },
    ]));
    // Preserve Parley's optional notifications only for the local renderer.
    const { session } = require('electron');
    session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => callback(permission === 'notifications' && local(contents.getURL()) && local(details.requestingUrl || contents.getURL())));
    session.defaultSession.setPermissionCheckHandler((contents, permission, origin) => permission === 'notifications' && !!contents && local(contents.getURL()) && local(origin));
    try { await startBackend(); ready = true; if (!quitting) createWindow(); }
    catch (error) { dialog.showErrorBox('Parley could not start', error.message); app.quit(); }
  });
  app.on('before-quit', event => {
    quitting = true;
    if (!backend || backend.exitCode !== null || backend.killed) return;
    event.preventDefault();
    // ChildProcess identity is retained; never signal a reused service or PID.
    backend.once('exit', () => app.quit());
    backend.kill('SIGTERM');
    setTimeout(() => { if (backend.exitCode === null) backend.kill('SIGKILL'); app.quit(); }, 3000).unref();
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => { if (ready && !quitting && BrowserWindow.getAllWindows().length === 0) createWindow(); });
}
