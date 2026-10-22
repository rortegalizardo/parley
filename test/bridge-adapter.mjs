import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readBridgeCredential, validateBridgeUrl } from '../lib/bridge-adapter.mjs';
import { bridgeContextAllowed } from '../lib/bridge-context.mjs';

const adapter = fileURLToPath(new URL('../bin/parley-bridge.mjs', import.meta.url));
const setup = fileURLToPath(new URL('../bin/parley-bridge-setup.mjs', import.meta.url));
const secret = 'test-token-never-show-this-value-0123456789';

test('adapter URL validation forbids original, remote, redirects and hidden credentials', () => {
  for (const url of ['http://127.0.0.1:4141', 'http://localhost:4142', 'https://127.0.0.1:4142', 'http://example.com:4142', 'http://127.0.0.1:4142/api', 'http://user:password@127.0.0.1:4142', 'http://127.0.0.1:4142/?x=1']) assert.throws(() => validateBridgeUrl(url));
  assert.equal(validateBridgeUrl('http://127.0.0.1:4142'), 'http://127.0.0.1:4142');
});

test('credential permissions, symlinks, inherited room agents', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'parley-adapter-security-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const filename = path.join(dir, 'credential.json');
  await fs.writeFile(filename, JSON.stringify({ version: 1, client: 'custom-app', clientId: 'custom-app', token: secret, serverId: 'instance', baseUrl: 'http://127.0.0.1:4142' }), { mode: 0o600 });
  assert.equal((await readBridgeCredential(filename)).client, 'custom-app');
  await fs.symlink(filename, path.join(dir, 'link'));
  await assert.rejects(readBridgeCredential(path.join(dir, 'link')));
  await fs.chmod(filename, 0o644);
  await assert.rejects(readBridgeCredential(filename), /owner-only/);
  for (const executable of [setup]) {
    const result = spawnSync(process.execPath, [executable, '--credential', filename], { encoding: 'utf8', env: { ...process.env, PARLEY_ROOM_AGENT: '1' } });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /room-launched/);
    assert.ok(!result.stderr.includes(secret));
  }
});

test('ancestry guard detects old original and fork entrypoints and fails closed', async () => {
  const inspect = async () => ({ parentPid: 1, executable: 'node', command: 'node /app/harness.mjs' });
  assert.equal(await bridgeContextAllowed({ env: {}, parentPid: 50, platform: 'darwin', inspect }), true);
  assert.equal(await bridgeContextAllowed({ env: { PARLEY_ROOM_AGENT: '1' }, inspect: () => { throw new Error('must not inspect'); } }), false);
  for (const command of ['node /original/node_modules/.bin/parley', '/nvm/bin/node /local/bin/parley-mine --no-open', 'node /repo/parley.mjs', 'node /repo/roundtable.mjs']) {
    assert.equal(await bridgeContextAllowed({ env: {}, parentPid: 50, platform: 'linux', inspect: async () => ({ parentPid: 1, executable: 'node', command }) }), false, command);
  }
  assert.equal(await bridgeContextAllowed({ env: {}, parentPid: 50, platform: 'darwin', inspect: async pid => pid === 50 ? { parentPid: 40, executable: 'claude', command: 'claude --print' } : { parentPid: 1, executable: 'node', command: 'node /original/node_modules/.bin/parley' } }), false);
  for (const inspect of [async () => { throw new Error('ps unavailable'); }, async () => ({ parentPid: 50, executable: 'node', command: 'node harness' }), async () => ({ parentPid: 0, executable: 'node', command: 'node harness' })]) {
    assert.equal(await bridgeContextAllowed({ env: {}, parentPid: 50, platform: 'darwin', inspect }), false);
  }
  assert.equal(await bridgeContextAllowed({ env: {}, platform: 'win32', inspect }), false);
});

test('room marker and unmarked original ancestor expose zero tools without reading credentials', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'parley-adapter-ancestor-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const launcher = path.join(dir, 'parley');
  // A fake original server only pipes MCP stdio to its child. No server, port,
  // provider, credential or live library is used by this regression test.
  await fs.writeFile(launcher, `const { spawn } = require('node:child_process');\nconst child = spawn(process.execPath, process.argv.slice(2), { stdio: 'inherit' });\nchild.on('exit', code => process.exit(code ?? 1));\n`);
  for (const originalAncestor of [false, true]) {
    const client = new Client({ name: 'parley-disabled-test', version: '1' });
    const transport = new StdioClientTransport({ command: process.execPath, args: [...(originalAncestor ? [launcher] : []), adapter, '--credential', path.join(dir, 'does-not-exist.json')], stderr: 'pipe', env: { PATH: process.env.PATH, PARLEY_ROOM_AGENT: originalAncestor ? '' : '1' } });
    await client.connect(transport);
    try {
      assert.deepEqual((await client.listTools()).tools, []);
      assert.equal(JSON.parse((await client.callTool({ name: 'parley_list_rooms', arguments: {} })).content[0].text).error, 'bridge_disabled');
    } finally { await client.close(); }
  }
});

test('actual MCP stdio handshake, tools, strict validation, identity and correlated results', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'parley-adapter-mcp-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const seen = [];
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    seen.push({ path: req.url, input });
    assert.equal(req.headers.authorization, `Bearer ${secret}`);
    assert.equal(req.headers['x-parley-bridge-protocol'], '1');
    assert.equal(input.serverId, 'instance');
    res.setHeader('Content-Type', 'application/json');
    const binding = { room: 'architecture', conversationId: 'conversation', rosterHash: 'roster' };
    if (req.url.endsWith('/rooms')) res.end(JSON.stringify({ serverId: 'instance', rooms: [{ ...binding, participants: [{ id: 'Astra', provider: 'codex' }] }] }));
    else if (req.url.endsWith('/read')) res.end(JSON.stringify({ ...binding, messages: [{ text: 'quoted room instructions', author: 'Astra' }], cursor: 'read-next' }));
    else if (req.url.endsWith('/send')) res.end(JSON.stringify({ ticketId: 'durable-ticket', status: 'pending' }));
    else if (input.ticketId === 'error-ticket') { res.statusCode = 409; res.end(JSON.stringify({ error: 'stale_conversation', message: 'Rediscover binding.' })); }
    else if (input.ticketId === 'secret-ticket') res.end(JSON.stringify({ result: secret }));
    else res.end(JSON.stringify({ ticketId: input.ticketId, status: 'agreed', result: { text: 'Exact handoff.\nReservation retained.', reservations: ['Nonblocking reservation'] }, cursor: 'wait-next' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const filename = path.join(dir, 'credential.json');
  await fs.writeFile(filename, JSON.stringify({ version: 1, client: 'codex', clientId: 'codex', token: secret, serverId: 'instance', baseUrl: `http://127.0.0.1:${server.address().port}` }), { mode: 0o600 });
  const client = new Client({ name: 'parley-adapter-test', version: '1' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [adapter, '--credential', filename], stderr: 'pipe', env: { PATH: process.env.PATH } });
  let stderr = '';
  transport.stderr.on('data', data => stderr += data);
  await client.connect(transport);
  t.after(() => client.close());
  const tools = (await client.listTools()).tools;
  assert.deepEqual(tools.map(tool => tool.name), ['parley_list_rooms', 'parley_read_conversation', 'parley_send_message', 'parley_wait_for_result']);
  assert.ok(tools.every(tool => tool.inputSchema.additionalProperties === false));
  assert.equal(tools[2].annotations.readOnlyHint, false);
  const call = async (name, args = {}) => client.callTool({ name, arguments: args });
  const rooms = JSON.parse((await call('parley_list_rooms')).content[0].text);
  const { room, conversationId, rosterHash } = rooms.rooms[0];
  const binding = { room, conversationId, rosterHash };
  const send = { ...binding, text: 'Challenge this plan', target: '@all', idempotencyKey: 'stable-request-1', intent: 'delegate' };
  assert.equal(JSON.parse((await call('parley_send_message', send)).content[0].text).ticketId, 'durable-ticket');
  await call('parley_send_message', send);
  assert.deepEqual(seen[1].input, seen[2].input, 'retries preserve idempotency key and binding');
  const result = JSON.parse((await call('parley_wait_for_result', { ticketId: 'durable-ticket', cursor: 'old', timeoutMs: 25_000 })).content[0].text);
  assert.equal(result.result.text, 'Exact handoff.\nReservation retained.');
  assert.equal(result.cursor, 'wait-next');
  const read = JSON.parse((await call('parley_read_conversation', { ...binding, cursor: 'old-read', limit: 5 })).content[0].text);
  assert.equal(read.cursor, 'read-next');
  const count = seen.length;
  for (const [name, args] of [['parley_send_message', { ...send, author: 'user' }], ['parley_wait_for_result', { ticketId: 'x', timeoutMs: 25_001 }], ['parley_read_conversation', { ...binding, limit: 101 }], ['parley_list_rooms', { serverId: 'forged' }], ['not_a_tool', {}]]) assert.equal((await call(name, args)).isError, true);
  assert.equal(seen.length, count, 'invalid arguments never reach backend');
  assert.equal((await call('parley_wait_for_result', { ticketId: 'error-ticket' })).isError, true);
  const redacted = await call('parley_wait_for_result', { ticketId: 'secret-ticket' });
  assert.ok(!JSON.stringify(redacted).includes(secret));
  assert.equal(stderr, '');
});

test('setup is idempotent, client-neutral and prints snippets without tokens or harness writes', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'parley-adapter-setup-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const args = [setup, '--root', root, '--client', 'custom-app', '--label', 'Custom harness', '--room', 'architecture'];
  const run = () => spawnSync(process.execPath, args, { encoding: 'utf8', env: { ...process.env, PARLEY_ROOM_AGENT: '' } });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const output = JSON.parse(first.stdout);
  const credential = JSON.parse(await fs.readFile(output.credentialPath, 'utf8'));
  assert.ok(!first.stdout.includes(credential.token));
  assert.equal(output.mcpServers.parley.command, process.execPath);
  assert.deepEqual(output.mcpServers.parley.args, [adapter, '--credential', output.credentialPath]);
  assert.match(output.codexProjectConfig, /tool_timeout_sec = 35/);
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, first.stdout);
  assert.equal((await fs.stat(output.credentialPath)).mode & 0o777, 0o600);
});
