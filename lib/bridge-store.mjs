import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export const BRIDGE_PROTOCOL = '1';
export function bridgeError(message, status = 400, code = 'invalid_request') { return Object.assign(new Error(message), { status, code }); }
function privateDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (fs.lstatSync(dir).isSymbolicLink()) throw bridgeError('Bridge paths cannot be symlinks');
  fs.chmodSync(dir, 0o700);
}
export function privateRead(file) {
  const st = fs.lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink() || (process.platform !== 'win32' && (st.mode & 0o077))) throw bridgeError('Bridge file must be a private regular file', 403);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
export function privateWrite(file, data) {
  privateDir(path.dirname(file));
  if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw bridgeError('Bridge paths cannot be symlinks');
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  fs.renameSync(tmp, file);
}
export function validateBridgeLocation(root, baseUrl) {
  const resolved = path.resolve(root);
  const original = path.join(os.homedir(), '.parley');
  const real = (p) => { try { return fs.realpathSync(p); } catch { const parent = path.dirname(p); return parent === p ? p : path.join(real(parent), path.basename(p)); } };
  const inside = (p, base) => p === base || p.startsWith(base + path.sep);
  if ([original, path.join(os.homedir(), '.roundtable')].some((base) => inside(real(resolved), real(base)))) throw bridgeError('The original Parley library is protected');
  const url = new URL(baseUrl);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.port === '4141' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw bridgeError('Bridge requires an explicit loopback port other than protected port 4141');
  return { root: resolved, baseUrl: url.origin };
}
export function loadBridgeStore(root) {
  const dir = path.join(path.resolve(root), '.bridge');
  privateDir(dir);
  const file = path.join(dir, 'server.json');
  if (!fs.existsSync(file)) privateWrite(file, { version: 1, serverId: crypto.randomUUID(), cursorKey: crypto.randomBytes(32).toString('hex') });
  const server = privateRead(file);
  return { ...server, dir };
}
export function provisionBridgeClient({ root, client = 'codex', clientId = client, label, baseUrl = 'http://127.0.0.1:4142', rooms = ['*'] }) {
  ({ root, baseUrl } = validateBridgeLocation(root, baseUrl));
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(clientId) || !/^[a-zA-Z0-9_-]{1,64}$/.test(client)) throw bridgeError('Invalid bridge client identifier');
  if (!Array.isArray(rooms) || !rooms.length || rooms.some((r) => typeof r !== 'string' || !/^(\*|[a-zA-Z0-9][a-zA-Z0-9_-]*)$/.test(r))) throw bridgeError('Invalid room scopes');
  label ||= client === 'codex' ? 'Codex harness' : client === 'claude' ? 'Claude harness' : `${client} harness`;
  if (typeof label !== 'string' || label.length > 100 || /[\r\n\x00-\x1f]/.test(label)) throw bridgeError('Invalid client label');
  const store = loadBridgeStore(root);
  const manifestPath = path.join(store.dir, 'clients', `${clientId}.json`);
  if (fs.existsSync(manifestPath)) {
    const manifest = privateRead(manifestPath);
    if (manifest.serverId !== store.serverId || manifest.client !== client || manifest.baseUrl !== baseUrl || JSON.stringify(manifest.rooms) !== JSON.stringify(rooms) || manifest.label !== label) throw bridgeError('Registration differs from existing credential; choose a new clientId', 409);
    return { manifestPath, manifest };
  }
  const manifest = { version: 1, serverId: store.serverId, clientId, client, label, token: crypto.randomBytes(32).toString('hex'), baseUrl, root, rooms };
  privateWrite(manifestPath, manifest);
  return { manifestPath, manifest };
}
export function authenticateBridge(store, req, actualPort) {
  if (req.headers['x-parley-bridge-protocol'] !== BRIDGE_PROTOCOL) throw bridgeError('Bridge protocol mismatch', 409, 'protocol_mismatch');
  // Native stdio clients have no Origin; reject browser callers entirely.
  if (req.headers.origin) throw bridgeError('Browser origins cannot use bridge credentials', 403, 'forbidden');
  const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
  if (!token) throw bridgeError('Bridge credential required', 403, 'forbidden');
  const dir = path.join(store.dir, 'clients');
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => /^[\w-]+\.json$/.test(n)) : []) {
    let client;
    try { client = privateRead(path.join(dir, name)); } catch { continue; }
    if (typeof client.token !== 'string' || client.token.length !== token.length) continue;
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(client.token)) && client.serverId === store.serverId && Number(new URL(client.baseUrl).port) === actualPort) return client;
  }
  throw bridgeError('Invalid or incorrectly bound bridge credential', 403, 'forbidden');
}
export function bridgeCursor(store, payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', store.cursorKey).update(body).digest('hex')}`;
}
export function parseBridgeCursor(store, cursor, binding) {
  try {
    const [body, mac] = cursor.split('.');
    const expected = crypto.createHmac('sha256', store.cursorKey).update(body).digest('hex');
    if (!mac || mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) throw Error();
    const value = JSON.parse(Buffer.from(body, 'base64url'));
    for (const [key, val] of Object.entries(binding)) if (value[key] !== val) throw Error();
    return value;
  } catch { throw bridgeError('Invalid or stale bridge cursor', 409, 'stale_cursor'); }
}
