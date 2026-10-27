import assert from 'node:assert/strict';
import { updateContext, requireContextRevisionRounds, sourceHash, editorView, BRIEF_MAX } from '../lib/context-editor.mjs';

const reviewers = ['one', 'two', 'three'].map(id => ({ id, provider: 'claude', config: {} }));
const fresh = () => ({ decisions: [{ id: 'source', source: 'user', text: 'Preserve the agreed constraint.', contextStatus: 'pending' }], events: [] });
const reference = prompt => JSON.parse(prompt.split('REFERENCE DATA:\n')[1].split('\nREVIEW FEEDBACK:\n')[0]);
function harness(ledger, { approveAt = 4, stopAt = null, oversize = false } = {}) {
  let round = 0, stopped = false;
  const prompts = [], reviews = [];
  const invoke = async (reviewer, prompt) => {
    if (!reviewer) {
      round++; prompts.push(prompt);
      const input = reference(prompt);
      return JSON.stringify({ text: oversize ? 'x'.repeat(BRIEF_MAX + 1) : `candidate ${round}`,
        changes: input.currentSourceIds.map(id => ({ sourceIds: [id], disposition: 'carried_forward', summary: 'Retained faithfully.' })), sourceIds: input.currentSourceIds });
    }
    const hash = /"hash":"([a-f0-9]+)"/.exec(prompt)[1];
    reviews.push({ round, id: reviewer.id });
    if (stopAt?.round === round && stopAt?.reviewer === reviewer.id) stopped = true;
    return JSON.stringify({ hash, decision: round >= approveAt ? 'approve' : 'object', rationale: `Feedback for candidate ${round}, ${reviewer.id}` });
  };
  return { prompts, reviews, invoke, stopped: () => stopped, current: () => !stopped, count: () => round };
}
const run = (ledger, h, options = {}) => updateContext({ ledger, reviewers, invoke: h.invoke, current: h.current, stopped: h.stopped, publish() {}, ...options });

assert.equal(requireContextRevisionRounds(), 0);
for (const invalid of [-1, 1.5, 1000, '2', null, Infinity]) assert.throws(() => requireContextRevisionRounds(invalid));

// The absent setting really continues past the former two-round / eleven-call cap.
{
  const ledger = fresh(), canonical = structuredClone(ledger.decisions), h = harness(ledger, { approveAt: 5 });
  const result = await run(ledger, h);
  assert.equal(result.status, 'active'); assert.equal(result.round, 5); assert.equal(result.calls.used, 20);
  assert.equal(result.unlimited, true); assert.equal(result.calls.planned, null);
  for (let i = 1; i < h.prompts.length; i++) {
    const input = reference(h.prompts[i]);
    assert.equal(input.retryReference.candidate.text, `candidate ${i}`);
    assert.equal(Object.keys(input.retryReference.candidate.reviews).length, 3);
    assert.equal(input.retryReference.approved, false);
    assert(!('earlierReviewRounds' in input.retryReference));
  }
  assert.equal(sourceHash(ledger.decisions), sourceHash(canonical));
  assert.equal(Object.keys(ledger.activeBrief.reviews).length, 3);
}

// A finite batch pauses honestly; Continue receives the latest rejected text/feedback.
{
  const ledger = fresh(), h = harness(ledger, { approveAt: 4 });
  const first = await run(ledger, h, { maxRounds: 2 });
  assert.equal(first.status, 'limit_reached'); assert.match(first.reason, /Revision limit reached/);
  assert.equal(first.calls.used, 8); assert.equal(first.calls.planned, 11); assert(!ledger.activeBrief);
  const firstSnapshot = structuredClone(first);
  const second = await run(ledger, h, { maxRounds: 2 });
  assert.equal(second.status, 'active'); assert.equal(second.retryOf, first.id); assert.equal(second.round, 2);
  assert.equal(reference(h.prompts[2]).retryReference.candidate.text, 'candidate 2');
  assert.equal(ledger.contextHistory.length, 2); assert.deepEqual(ledger.contextHistory[0], firstSnapshot);
  assert.equal(h.reviews.filter(r => r.round === 4).length, 3, 'Every approval was requested afresh');
}

// Stop mid-review preserves partial latest feedback plus preceding full-round objections.
{
  const ledger = fresh(), h = harness(ledger, { stopAt: { round: 2, reviewer: 'one' } });
  const stopped = await run(ledger, h);
  assert.equal(stopped.status, 'stopped'); assert.equal(stopped.candidates.length, 2); assert(!ledger.activeBrief);
  assert.equal(Object.keys(stopped.candidates[1].reviews).length, 1);
  delete stopped.feedbackBasis; // Legacy interrupted attempts have only candidate history.
  const resumed = harness(ledger, { approveAt: 1 });
  const result = await run(ledger, resumed);
  const basis = reference(resumed.prompts[0]).retryReference;
  assert.equal(basis.candidate.text, 'candidate 2'); assert.equal(Object.keys(basis.earlierReviews.reviews).length, 3);
  assert.equal(result.status, 'active'); assert.equal(result.retryOf, stopped.id);
  assert.equal(resumed.reviews.length, 3);
}

// Restart reporting never runs work; changed canonical sources cannot reuse stale proposals.
{
  const ledger = fresh(), h = harness(ledger, { approveAt: 99 });
  await run(ledger, h, { maxRounds: 1 });
  ledger.editor.status = 'reviewing';
  const before = JSON.stringify(ledger);
  assert.equal(editorView(ledger).editor.status, 'interrupted'); assert.equal(JSON.stringify(ledger), before);
  ledger.decisions[0].text = 'User changed the canonical constraint.';
  const updated = harness(ledger, { approveAt: 1 }); await run(ledger, updated);
  assert(!reference(updated.prompts[0]).retryReference);
}

// Unlimited review does not remove the separate three-repair size bound.
{
  const ledger = fresh(), h = harness(ledger, { oversize: true });
  const result = await run(ledger, h);
  assert.equal(result.status, 'failed'); assert.equal(result.compressionAttempts.length, 3);
  assert.equal(result.calls.used, 4); assert.equal(h.reviews.length, 0); assert(!ledger.activeBrief);
}
console.log('context revision rounds: unlimited, finite continuation, latest feedback, Stop, restart, source integrity, compression bound passed');
