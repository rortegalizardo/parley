import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../desktop/main.cjs', import.meta.url), 'utf8');

// Exercise the actual main-process lifecycle with all OS/network boundaries
// mocked. This never starts a server, sends a real signal, or reads room data.
for (const mode of ['reuse', 'owned', 'foreign']) {
  const signals = [], spawns = [], windows = [], errors = [];
  const app = new EventEmitter();
  Object.assign(app, { isPackaged: true, requestSingleInstanceLock: () => true,
    whenReady: () => Promise.resolve(), getAppPath: () => '/fake/app',
    quit: () => app.emit('before-quit', { preventDefault() {} }) });
  const child = new EventEmitter();
  Object.assign(child, { exitCode: null, killed: false, stderr: new EventEmitter(), stdout: { resume() {} },
    kill(signal) { signals.push(signal); child.killed = true; child.exitCode = 0; queueMicrotask(() => child.emit('exit', 0)); } });
  class BrowserWindow {
    static getAllWindows() { return windows; }
    constructor(options) { this.options = options; this.webContents = new EventEmitter(); this.webContents.setWindowOpenHandler = () => {}; windows.push(this); }
    loadURL(url) { this.url = url; return Promise.resolve(); }
  }
  const electron = { app, BrowserWindow, Menu: { setApplicationMenu() {}, buildFromTemplate: x => x },
    dialog: { showErrorBox: (...args) => errors.push(args) }, shell: { openExternal: async () => {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {} } } };
  let requests = 0;
  const http = { get(_url, _options, callback) {
    const request = new EventEmitter();
    request.destroy = () => request.emit('error', new Error('destroyed'));
    queueMicrotask(() => {
      if (mode === 'owned' && requests++ === 0) return request.emit('error', { code: 'ECONNREFUSED' });
      const response = new EventEmitter(); response.statusCode = 200; response.setEncoding = () => {};
      callback(response);
      response.emit('data', mode === 'foreign' ? 'unrelated service' : 'class="fork-badge" name="parley-token" name="parley-runtime-protocol" content="16" name="parley-desktop-instance" content="test-instance"');
      response.emit('end');
    });
    return request;
  } };
  vm.runInNewContext(source, { URL, console, queueMicrotask,
    process: { env: {}, platform: 'darwin', execPath: '/fake/Parley.app/Contents/MacOS/Parley', resourcesPath: '/fake/Parley.app/Contents/Resources' },
    setTimeout: () => ({ unref() {} }),
    require(name) {
      if (name === 'electron') return electron;
      if (name === 'node:http') return http;
      if (name === 'node:crypto') return { randomUUID: () => 'test-instance' };
      if (name === 'node:child_process') return { execFileSync: () => '__PARLEY_PATH__/fake/bin\n', spawn: (...args) => { spawns.push(args); return child; } };
      return require(name);
    },
  }, { filename: 'desktop/main.cjs' });
  await new Promise(resolve => setImmediate(resolve));
  if (mode === 'foreign') {
    assert.equal(errors.length, 1); assert.equal(windows.length, 0);
  } else {
    assert.equal(errors.length, 0); assert.equal(windows.length, 1);
    assert.equal(windows[0].url, 'http://127.0.0.1:4142/?home=1');
    assert.equal(windows[0].options.webPreferences.nodeIntegration, false);
    assert.equal(windows[0].options.webPreferences.sandbox, true);
  }
  app.quit();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(spawns.length, mode === 'owned' ? 1 : 0);
  assert.deepEqual(signals, mode === 'owned' ? ['SIGTERM'] : []);
  if (mode === 'owned') {
    assert.equal(spawns[0][0], '/fake/Parley.app/Contents/MacOS/Parley');
    assert.equal(spawns[0][1][0], '/fake/Parley.app/Contents/Resources/app.asar.unpacked/bin/parley-mine.mjs');
    assert.equal(spawns[0][2].env.ELECTRON_RUN_AS_NODE, '1');
  }
  console.log(`PASS desktop lifecycle: ${mode}`);
}
