import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { isolatedServer } from './server-fixture.mjs';
import { provisionBridgeClient, privateRead, privateWrite, validateBridgeLocation } from '../lib/bridge-store.mjs';

const server = await isolatedServer({ env: { FAKE_CONVERGENCE: 'reservation', FAKE_DELAY_MS: '30' }, discussionMode: null, keepRoot: true });
let restarted;
const tempRoot = path.dirname(server.root);
try {
  const { manifest, manifestPath } = provisionBridgeClient({ root: server.root, baseUrl: server.url, rooms: ['default'] });
  assert.equal(fs.statSync(manifestPath).mode & 0o077, 0);
  const call = async (action, body = {}, credential = manifest, extraHeaders = {}) => {
    const res = await fetch((restarted || server).url + '/api/bridge/' + action, { method: 'POST', headers: { Authorization: `Bearer ${credential.token}`, 'X-Parley-Bridge-Protocol': '1', 'Content-Type': 'application/json', ...extraHeaders }, body: JSON.stringify({ serverId: credential.serverId, ...body }) });
    return { status: res.status, data: await res.json() };
  };
  let rooms = await call('rooms'); assert.equal(rooms.status, 200, JSON.stringify(rooms));
  let b = rooms.data.rooms[0]; assert.equal(b.room, 'default');
  assert.equal((await call('rooms', {}, manifest, { Origin: server.url })).status, 403);
  assert.equal((await call('rooms', {}, manifest, { 'X-Parley-Bridge-Protocol': '0' })).status, 409);
  const badHost = await new Promise((resolve, reject) => { const req = http.request(server.url + '/api/bridge/rooms', { method: 'POST', headers: { Host: 'attacker.invalid' } }, (res) => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end('{}'); });
  assert.equal(badHost, 403);
  assert.equal((await call('rooms', { serverId: 'wrong' })).status, 409);
  assert.equal((await call('send', { ...b, author: 'user' })).status, 400);
  assert.equal((await call('read', { ...b, room: 'forbidden' })).status, 403);
  const note = { ...b, text: 'For context only: investigate later.', target: '@codex', intent: 'context', idempotencyKey: 'context-1' };
  const noteResult = await call('send', note); assert.equal(noteResult.data.status, 'recorded');
  const afterNote = await server.room('default');
  const source = afterNote.entries.find((e) => e.meta?.harness); assert.equal(source.author, 'harness:codex'); assert.equal(source.meta.harness.intent, 'context');
  assert(!afterNote.entries.some((e) => e.kind === 'agent'));
  const named = { ...b, text: '@all text is literal, target stays claude', target: 'claude', intent: 'delegate', idempotencyKey: 'named-1' };
  const sent = await call('send', named); assert.equal(sent.status, 200, JSON.stringify(sent));
  assert.equal((await call('send', named)).data.ticketId, sent.data.ticketId);
  assert.equal((await call('send', { ...named, text: 'changed' })).status, 409);
  assert.equal((await call('send', { ...named, idempotencyKey: 'busy' })).status, 409);
  const done = await call('wait', { ticketId: sent.data.ticketId, timeoutMs: 5000 });
  assert.equal(done.data.status, 'completed', JSON.stringify(done));
  assert.equal(done.data.result.replies.length, 1); assert.equal(done.data.result.replies[0].author, 'claude');
  const entries = (await server.room('default')).entries;
  assert.equal(entries.filter((e) => e.meta?.harness?.requestId === sent.data.ticketId).length, 1);
  const read = await call('read', { ...b, limit: 1 }); assert.equal(read.data.messages.length, 1);
  const nextRead = await call('read', { ...b, cursor: read.data.cursor, limit: 100 }); assert(nextRead.data.messages.every((e) => e.n > read.data.messages[0].n));
  assert.equal((await call('read', { ...b, cursor: read.data.cursor + 'x' })).status, 409);
  const other = provisionBridgeClient({ root: server.root, client: 'claude', baseUrl: server.url, rooms: ['default'] }).manifest;
  assert.equal((await call('wait', { ticketId: sent.data.ticketId, timeoutMs: 0 }, other)).status, 403);
  assert.equal((await call('read', { ...b, cursor: read.data.cursor }, other)).status, 409);
  // Wait until the ordinary coordinator has released its seat before convergence.
  for (let i = 0; i < 50 && (await server.room('default')).room.busy?.length; i++) await new Promise((r) => setTimeout(r, 30));
  let cv;
  for (let i = 0; i < 50; i++) { cv = await call('send', { ...b, text: 'Agree on an exact handoff with reservations', target: '@all', intent: 'delegate', idempotencyKey: 'consensus' }); if (cv.status !== 409) break; await new Promise((r) => setTimeout(r, 30)); }
  assert.equal(cv.status, 200, JSON.stringify(cv));
  const agreed = await call('wait', { ticketId: cv.data.ticketId, timeoutMs: 10000 });
  assert.equal(agreed.data.status, 'agreed', JSON.stringify(agreed)); assert(agreed.data.result.reservations.length);
  const snapshot = await server.room('default');
  const handoff = snapshot.entries.find((e) => e.meta?.convergence?.runId === agreed.data.result.runId);
  assert.equal(agreed.data.result.text, handoff.text);
  await server.api('POST', '/api/new', { room: 'default' });
  assert.equal((await call('read', b)).data.code, 'stale_conversation');
  assert.equal((await call('wait', { ticketId: cv.data.ticketId, timeoutMs: 0 })).data.status, 'agreed');
  assert.equal((await call('send', named)).data.status, 'completed', 'idempotency survives reset');
  b = (await call('rooms')).data.rooms[0];
  const cfg = (await server.room('default')).room.cfg;
  await server.api('POST', '/api/config', { room: 'default', config: { agents: { claude: { instructions: 'different role' } } } });
  assert.equal((await call('send', { ...b, text: 'stale roster', target: 'claude', intent: 'delegate', idempotencyKey: 'stale' })).data.code, 'stale_roster');
  b = (await call('rooms')).data.rooms[0];
  const pending = await call('send', { ...b, text: 'restart safe ordinary request', target: 'claude', intent: 'delegate', idempotencyKey: 'restart' });
  assert.equal(pending.status, 200);
  await server.close();
  restarted = await isolatedServer({ root: tempRoot, keepRoot: true, env: { FAKE_CONVERGENCE: 'reservation' } });
  // Test transport moved to another ephemeral port; only this fixture credential is rebound.
  manifest.baseUrl = restarted.url; privateWrite(manifestPath, manifest);
  const recovered = await call('wait', { ticketId: pending.data.ticketId, timeoutMs: 0 });
  assert(['completed', 'incomplete'].includes(recovered.data.status), JSON.stringify(recovered));
  const retried = await call('send', { ...b, text: 'restart safe ordinary request', target: 'claude', intent: 'delegate', idempotencyKey: 'restart' });
  assert.equal(retried.data.ticketId, pending.data.ticketId);
  assert.equal((await restarted.room('default')).entries.filter((e) => e.meta?.harness?.requestId === pending.data.ticketId).length, 1);
  assert.throws(() => validateBridgeLocation(path.join(os.homedir(), '.parley', 'default'), 'http://127.0.0.1:4142'));
  assert.throws(() => validateBridgeLocation(server.root, 'http://127.0.0.1:4141'));
  assert.equal(privateRead(manifestPath).serverId, manifest.serverId);
  console.log('bridge backend: authentication, scope, identity, context, named correlation, idempotency, convergence, cursors, reset, roster and restart passed');
} finally {
  await restarted?.close(); await server.close(); fs.rmSync(tempRoot, { recursive: true, force: true });
}
