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
  const seats = [{ id: 'claude', provider: 'claude' }, { id: 'codex', provider: 'codex' }, { id: 'watcher', provider: 'claude', instructions: 'Review arithmetic only. Flag material arithmetic errors; otherwise pass. Do not solve unrelated tasks.' }];
    await post('/api/rooms', { name: 'roles', seats });
    await server.configure('roles', { mode: 'work', agents: { watcher: { lurk: true } } });
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
  assert.equal(data.entries.some((e) => e.author === 'watcher'), false);
  for (const seat of ['claude', 'codex']) assert(data.entries.some((e) => e.author === seat && e.meta.replyTo === root.n));

  await send('TAG:watcher');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert.equal(root.target, 'claude,codex', 'Auto inherits subset');
  assert.equal(data.entries.some((e) => e.author === 'watcher'), false, 'Peer mention cannot escape subset');

  await send('@all SAY:GROUP');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert.deepEqual(root.meta.audience, { addressed: ['claude', 'codex'], lurking: ['watcher'] });
  assert(!data.entries.some((e) => e.author === 'watcher' && e.meta.replyTo === root.n));
  assert(data.receipts.some((r) => r.agent === 'watcher' && r.turn === root.n && r.outcome === 'pass'));

  await post('/api/ask', { room: 'roles', sourceN: root.n, text: 'SAY:ASKGROUP', mode: 'now' });
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert.deepEqual(root.meta.audience.addressed, ['claude', 'codex']);
  assert.deepEqual(root.meta.audience.lurking, ['watcher']);

  await send('@all FAILONCESEAT:codex SAY:RETRYGROUP');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  await post('/api/retry', { room: 'roles', rootN: root.n, agents: ['watcher'] }, 400);
  assert(!data.entries.some((e) => e.author === 'watcher' && e.meta.replyTo === root.n && !e.meta.lurk));

  await send('@all LURKWHAT');
  data = await settled();
  const assessment = data.entries.findLast((e) => e.author === 'watcher' && e.text.startsWith('LURKJSON '));
  assert(assessment);
  assert.match(assessment.text, /standing instructions|Standing instructions/);
  assert.match(assessment.text, /role/);
  assert.match(assessment.text, /you are listening, not directly addressed/);
  assert.doesNotMatch(assessment.text, /to all agents|A moderator|For a moderator|both agents —/);
  assert.match(assessment.text, /Default to \[pass\]/);

  await send('@watcher SAY:DIRECT');
  data = await settled();
  root = data.entries.findLast((e) => e.kind === 'user');
  assert(data.entries.some((e) => e.author === 'watcher' && e.meta.replyTo === root.n && e.text === 'DIRECT'));

  await post('/api/config', { room: 'roles', config: { agents: { claude: { lurk: true }, codex: { lurk: true } } } });
  await post('/api/message', { room: 'roles', target: 'auto', text: '@all SAY:NOBODY' }, 400);
});

await exercise({ FAKE_CONVERGENCE: 'approve' }, async ({ post, settled }) => {
  await post('/api/message', { room: 'roles', target: 'auto', text: '@all Choose a design.', discussionMode: 'converge' });
  const data = await settled();
  const run = data.room.convergence;
  assert.equal(run.phase, 'agreed', JSON.stringify(run.final));
  assert.deepEqual(Object.keys(run.positions).sort(), ['claude', 'codex']);
  assert.equal(run.participants.find((p) => p.id === 'watcher').reviewOnly, true);
  assert.equal(run.calls.attempts.filter((a) => a.agent === 'watcher').length, 1);
  assert.equal(run.calls.attempts.find((a) => a.agent === 'watcher').stage, 'review');
  assert.equal(run.reviews.watcher.status, 'approve');
  assert.equal(run.positionTotal, 2);
});
await exercise({ FAKE_CONVERGENCE: 'pass' }, async ({ post, settled }) => {
  await post('/api/message', { room: 'roles', target: 'auto', text: '@all Choose a design.', discussionMode: 'converge' });
  const data = await settled();
  assert.equal(data.room.convergence.phase, 'incomplete');
  assert.equal(data.room.convergence.reviews.watcher.status, 'unresolved');
  assert(!data.entries.some((e) => e.meta?.convergence?.status === 'agreed'));
});
console.log('recipient routing: subset scope, listener role gates, group Ask, explicit listener, and convergence review-only passed');
