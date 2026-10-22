import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { provisionBridgeClient, validateBridgeLocation } from '../lib/bridge-store.mjs';

// Explicit opt-in only. This helper never launches, restarts, stops or changes
// the server and never modifies an existing room or installs harness config.
const args = process.argv.slice(2);
if (args.length !== 3 || args[0] !== '--live4142' || args[1] !== '--root' || !path.isAbsolute(args[2])) {
  console.error('Usage: node test/bridge-live4142.mjs --live4142 --root /absolute/fork-library');
  process.exit(2);
}
const url = 'http://127.0.0.1:4142';
const root = args[2];
validateBridgeLocation(root, url);
assert(fs.statSync(root).isDirectory(), 'The explicit fork library must already exist');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suffix = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const name = `bridge-qa-${suffix}`;
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'parley-live4142-qa-'));
const home = path.join(scratch, 'home');
fs.mkdirSync(home);
const wrapper = path.join(scratch, 'qa-only-fake-cli.mjs');
// Environment is set inside this QA provider only; the live server's global
// environment and other room providers are never changed.
const source = fs.readFileSync(path.join(repo, 'test/fake-cli.mjs'), 'utf8');
const lines = source.split('\n');
lines.splice(lines[0].startsWith('#!') ? 1 : 0, 0,
  "process.env.FAKE_CONVERGENCE = 'reservation';",
  "process.env.FAKE_DELAY_MS = '30';");
fs.writeFileSync(wrapper, lines.join('\n'), { mode: 0o700 });
const html = await fetch(url, { signal: AbortSignal.timeout(5000) }).then(response => {
  assert(response.ok, 'The existing 4142 fork server must be healthy');
  return response.text();
});
const token = /name="parley-token" content="([^"]+)"/.exec(html)?.[1];
const protocol = /name="parley-runtime-protocol" content="([^"]+)"/.exec(html)?.[1];
assert(token && protocol, 'Missing existing server runtime handshake');
async function ui(route, body) {
  const response = await fetch(url + route, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Parley-Token': token, 'X-Parley-Runtime-Protocol': protocol },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return data;
}
const connected = [];
async function call(sdk, tool, args = {}) {
  const response = await sdk.callTool({ name: tool, arguments: args });
  assert(!response.isError, JSON.stringify(response));
  return JSON.parse(response.content.find(item => item.type === 'text').text);
}
async function finish(sdk, ticketId) {
  for (let i = 0; i < 30; i++) {
    const result = await call(sdk, 'parley_wait_for_result', { ticketId, timeoutMs: 1000 });
    if (result.status !== 'pending') return result;
  }
  assert.fail('QA bridge request timed out');
}
try {
  // Unique name, creation before configuration, configuration before first
  // message: no inherited default command can run in this room.
  await ui('/api/rooms', { name, seats: [{ id: 'claude', provider: 'claude' }, { id: 'codex', provider: 'codex' }] });
  await ui('/api/config', { room: name, config: { accounting: 'exchanges', hopBudget: 0,
    agents: { claude: { command: wrapper, lurk: false }, codex: { command: wrapper, lurk: false } } } });
  const empty = await ui(`/api/room?name=${name}`);
  assert(!empty.entries.some(entry => entry.kind === 'user' || entry.kind === 'agent'));
  for (const client of ['codex', 'claude']) {
    const { manifestPath } = provisionBridgeClient({ root, baseUrl: url, client, clientId: `qa-${client}-${suffix}`, rooms: [name] });
    const sdk = new Client({ name: `${client}-4142-qa`, version: '1.0.0' });
    const transport = new StdioClientTransport({ command: process.execPath,
      args: [path.join(repo, 'bin/parley-bridge.mjs'), '--credential', manifestPath],
      env: { HOME: home, CODEX_HOME: path.join(home, '.codex'), CLAUDE_CONFIG_DIR: path.join(home, '.claude'), PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin` }, stderr: 'pipe' });
    await sdk.connect(transport); connected.push(sdk);
    const listed = await call(sdk, 'parley_list_rooms');
    assert.deepEqual(listed.rooms.map(room => room.room), [name]);
    const room = listed.rooms[0];
    const binding = { room: name, conversationId: room.conversationId, rosterHash: room.rosterHash };
    const sent = await call(sdk, 'parley_send_message', { ...binding, target: client === 'codex' ? '@claude' : '@codex', intent: 'delegate',
      text: `QA verification from ${client} harness. Use only the fake provider in this isolated QA room.`, idempotencyKey: `named-${client}-${suffix}` });
    const result = await finish(sdk, sent.ticketId);
    assert.equal(result.status, 'completed');
  }
  const sdk = connected[0];
  const listed = await call(sdk, 'parley_list_rooms');
  const room = listed.rooms[0];
  const request = { room: name, conversationId: room.conversationId, rosterHash: room.rosterHash,
    target: '@all', intent: 'delegate', text: 'QA: agree on the fake-provider handoff and preserve the reservation exactly.', idempotencyKey: `all-${suffix}` };
  const sent = await call(sdk, 'parley_send_message', request);
  const result = await finish(sdk, sent.ticketId);
  assert.equal(result.status, 'agreed', JSON.stringify(result));
  assert.equal((await call(sdk, 'parley_send_message', request)).ticketId, sent.ticketId);
  const snapshot = await ui(`/api/room?name=${name}`);
  assert.equal(result.result.text, snapshot.room.convergence.final.text);
  assert.deepEqual(result.result.reservations, snapshot.room.convergence.final.reservations);
  assert(result.result.reservations.length);
  assert.deepEqual(new Set(snapshot.entries.filter(entry => entry.meta?.harness).map(entry => entry.author)), new Set(['harness:codex', 'harness:claude']));
  console.log(JSON.stringify({ status: 'passed', url, room: name, ticketId: sent.ticketId, handoff: result.result.text,
    reservations: result.result.reservations, qaProviderDirectory: scratch,
    retained: 'QA room and its scoped QA credentials retained for parent browser verification; no harness user configuration installed.' }, null, 2));
} finally {
  await Promise.allSettled(connected.map(sdk => sdk.close()));
  // Keep the QA-only provider available until the parent finishes the browser
  // check. The parent owns any later QA room/credential/provider cleanup.
}
