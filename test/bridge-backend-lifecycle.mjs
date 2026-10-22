import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isolatedServer } from './server-fixture.mjs';
import { provisionBridgeClient, privateWrite } from '../lib/bridge-store.mjs';

let server = await isolatedServer({ keepRoot: true, env: { FAKE_CONVERGENCE: 'approve', FAKE_CONVERGENCE_REVIEW_DELAY: '350', FAKE_DELAY_MS: '20' }, discussionMode: null });
const tempRoot = path.dirname(server.root);
const { manifest, manifestPath } = provisionBridgeClient({ root: server.root, baseUrl: server.url });
const call = async (action, body) => {
  const res = await fetch(server.url + '/api/bridge/' + action, { method: 'POST', headers: { Authorization: `Bearer ${manifest.token}`, 'X-Parley-Bridge-Protocol': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: manifest.serverId, ...body }) });
  const data = await res.json(); assert.equal(res.status, 200, JSON.stringify(data)); return data;
};
async function until(fn) { for (let i = 0; i < 120; i++) { const value = await fn(); if (value) return value; await new Promise((r) => setTimeout(r, 40)); } assert.fail('lifecycle condition timed out'); }
try {
  const b = (await call('rooms', {})).rooms[0];
  const ticket = await call('send', { ...b, text: 'A resumable exact handoff', target: '@all', intent: 'delegate', idempotencyKey: 'resume' });
  await until(async () => (await server.room('default')).room.convergence?.phase === 'reviewing');
  assert.equal((await server.api('POST', '/api/convergence', { room: 'default', action: 'stop' })).status, 200);
  assert.equal((await call('wait', { ticketId: ticket.ticketId, timeoutMs: 0 })).status, 'stopped');
  await until(async () => { const result = await server.api('POST', '/api/convergence', { room: 'default', action: 'resume' }); return result.status === 200; });
  const completed = await call('wait', { ticketId: ticket.ticketId, timeoutMs: 6000 });
  assert.equal(completed.status, 'agreed');
  // A second completed request is deliberately never polled before restart/reset.
  const unseen = await call('send', { ...b, text: 'An unpolled durable handoff', target: '@all', intent: 'delegate', idempotencyKey: 'unpolled' });
  await until(async () => { const s = await server.room('default'); return s.room.convergence?.phase === 'agreed' && s.room.convergence.runId !== completed.result.runId; });
  const exact = (await server.room('default')).entries.find((e) => e.meta?.convergence?.runId !== completed.result.runId && e.meta?.convergence?.status === 'agreed').text;
  await server.close();
  server = await isolatedServer({ root: tempRoot, keepRoot: true, env: { FAKE_CONVERGENCE: 'approve' } });
  manifest.baseUrl = server.url; privateWrite(manifestPath, manifest);
  // No bridge call has hydrated the fresh process before the UI resets it.
  assert.equal((await server.api('POST', '/api/new', { room: 'default' })).status, 200);
  const preserved = await call('wait', { ticketId: unseen.ticketId, timeoutMs: 0 });
  assert.equal(preserved.status, 'agreed'); assert.equal(preserved.result.text, exact);
  console.log('bridge backend lifecycle: stopped ticket resumes to agreement; unpolled final survives restart then UI reset');
} finally { await server.close(); fs.rmSync(tempRoot, { recursive: true, force: true }); }
