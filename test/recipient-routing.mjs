import assert from 'node:assert/strict';
import { isolatedServer } from './server-fixture.mjs';

async function exercise(env, run) {
  const server = await isolatedServer({ env: { FAKE_DELAY_MS: '20', ...env } });
  const post = async (route, body, status = 200) => {
    const response = await server.api('POST', route, body);
    assert.equal(response.status, status, JSON.stringify(response.data));
    return response.data;
  };
  const settled = async () => {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const data = await server.room('roles');
      if (!data.room.working && !data.room.busy.length && !data.room.queued) return data;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    throw Error('Room did not settle: ' + JSON.stringify(await server.room('roles')));
  };
  try {
  const html = await fetch(server.url).then((r) => r.text());
  const protocol = /name="parley-runtime-protocol" content="([^"]+)"/.exec(html)[1];
  const scriptPath = /<script src="([^"]*app.js[^"]*)"/.exec(html)[1];
  const script = await fetch(server.url + scriptPath).then((r) => r.text());
  assert(script.includes(`const REQUIRED_RUNTIME_PROTOCOL = "${protocol}";`), 'served UI and server runtime protocols match');
  const seats = [{ id: 'claude', provider: 'claude' }, { id: 'codex', provider: 'codex' }, { id: 'moderator', provider: 'claude', instructions: 'Only flag material scope or role violations. Never offer architectural opinions.' }];
    await post('/api/rooms', { name: 'roles', seats });
    await server.configure('roles', { agents: { moderator: { lurk: true } } });
    await run({ post, settled, server });
  } finally { await server.close(); }
}

await exercise({}, async ({ post, settled, server }) => {
  const send = (text, extra = {}) => post('/api/message', { room: 'roles', text, target: 'auto', ...extra });
  await send('@claude @codex SAWWHAT');
  let data = await settled();
  let root = data.entries.findLast((e) => e.kind === 'user');
  assert.equal(root.target, 'claude,codex');
  assert.equal(root.text, 'SAWWHAT');
  assert.deepEqual(root.meta.audience, { addressed: ['claude', 'codex'], lurking: [] });
  assert.deepEqual(root.meta.recipientScope, ['claude', 'codex']);
  assert.equal(data.entries.some((e) => e.author === 'moderator'), false);
  for (const seat of ['claude', 'codex']) assert(data.entries.some((e) => e.author === seat && e.meta.replyTo === root.n));

  await send('TAG:moderator');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert.equal(root.target, 'claude,codex', 'Auto inherits subset');
  assert.equal(data.entries.some((e) => e.author === 'moderator'), false, 'Peer mention cannot escape subset');

  await send('@all SAY:GROUP');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert.deepEqual(root.meta.audience, { addressed: ['claude', 'codex'], lurking: ['moderator'] });
  assert(!data.entries.some((e) => e.author === 'moderator' && e.meta.replyTo === root.n));
  assert(data.receipts.some((r) => r.agent === 'moderator' && r.turn === root.n && r.outcome === 'pass'));

  await post('/api/ask', { room: 'roles', sourceN: root.n, text: 'SAY:ASKGROUP', mode: 'now' });
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert.deepEqual(root.meta.audience.addressed, ['claude', 'codex']);
  assert.deepEqual(root.meta.audience.lurking, ['moderator']);

  await send('@all FAILONCESEAT:codex SAY:RETRYGROUP');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  await post('/api/retry', { room: 'roles', rootN: root.n, agents: ['moderator'] }, 400);
  assert(!data.entries.some((e) => e.author === 'moderator' && e.meta.replyTo === root.n && !e.meta.lurk));

  await send('@moderator SAY:DIRECT');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert(data.entries.some((e) => e.author === 'moderator' && e.meta.replyTo === root.n && e.text === 'DIRECT'));

  await send('@all LURKWHAT');
  data = await settled();
  const assessment = data.entries.findLast((e) => e.author === 'moderator' && e.text.startsWith('LURKJSON '));
  assert(assessment);
  assert.match(assessment.text, /standing instructions|Standing instructions/);
  assert.match(assessment.text, /role/);
  assert.match(assessment.text, /Default to \[pass\]/);

  await post('/api/config', { room: 'roles', config: { agents: { claude: { lurk: true }, codex: { lurk: true } } } });
  await post('/api/message', { room: 'roles', target: 'auto', text: '@all SAY:NOBODY' }, 400);
});

await exercise({ FAKE_CONVERGENCE: 'approve' }, async ({ post, settled }) => {
  await post('/api/message', { room: 'roles', target: 'auto', text: '@all Choose a design.', discussionMode: 'converge' });
  const data = await settled();
  const run = data.room.convergence;
  assert.equal(run.phase, 'agreed');
  assert.deepEqual(Object.keys(run.positions).sort(), ['claude', 'codex']);
  assert.equal(run.participants.find((p) => p.id === 'moderator').reviewOnly, true);
  assert.equal(run.calls.attempts.filter((a) => a.agent === 'moderator').length, 1);
  assert.equal(run.calls.attempts.find((a) => a.agent === 'moderator').stage, 'review');
  assert.equal(run.reviews.moderator.status, 'approve');
  assert.equal(run.positionTotal, 2);
});
await exercise({ FAKE_CONVERGENCE: 'pass' }, async ({ post, settled }) => {
  await post('/api/message', { room: 'roles', target: 'auto', text: '@all Choose a design.', discussionMode: 'converge' });
  const data = await settled();
  assert.equal(data.room.convergence.phase, 'incomplete');
  assert.equal(data.room.convergence.reviews.moderator.status, 'unresolved');
  assert(!data.entries.some((e) => e.meta?.convergence?.status === 'agreed'));
});
console.log('recipient routing: subset scope, listener role gates, group Ask, explicit listener, and convergence review-only passed');
