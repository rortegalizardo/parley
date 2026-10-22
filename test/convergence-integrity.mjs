import test from "node:test";
import assert from "node:assert/strict";
import { allApproved, classifyReview, createConvergenceRun, draftHash } from "../lib/convergence.mjs";

const runId = "cv-test";
const version = 2;
const draft = "same immutable candidate";
const hash = draftHash(draft);
const expected = { runId, version, draftHash: hash };
const envelope = (decision, extra = {}) => JSON.stringify({ ...expected, decision, rationale: "checked", ...extra });

test("review parser rejects prose that tries to impersonate a vote", () => {
  assert.equal(classifyReview("I approve this only if the privacy objection is fixed", expected).status, "unresolved");
  assert.equal(classifyReview("{\"decision\":\"approve\",\"runId\":\"cv-other\",\"version\":2,\"draftHash\":\"" + hash + "\"}", expected).status, "unresolved");
  assert.equal(classifyReview(envelope("approve", { version: 1 }), expected).status, "unresolved");
  assert.equal(classifyReview(envelope("approve", { draftHash: draftHash("different") }), expected).status, "unresolved");
  assert.equal(classifyReview("", expected).status, "unresolved");
});

test("reservations require an explicit nonempty reservation and remain inspectable", () => {
  const vote = classifyReview(envelope("approve_with_reservation", { reservation: "Keep raw data out of logs." }), expected);
  assert.equal(vote.status, "approve_with_reservation");
  assert.equal(vote.reservation, "Keep raw data out of logs.");
  assert.equal(classifyReview(envelope("approve_with_reservation"), expected).status, "unresolved");
  assert.equal(classifyReview(envelope("approve_with_reservation", { reservation: "" }), expected).status, "unresolved");
});

test("agreement requires every named participant to approve the exact version and hash", () => {
  const participants = [{ id: "fable" }, { id: "astra" }, { id: "privacy" }];
  const reviews = {
    fable: { status: "approve", version, draftHash: hash },
    astra: { status: "approve_with_reservation", version, draftHash: hash, reservation: "No telemetry." },
    privacy: { status: "unresolved", version, draftHash: hash },
  };
  assert.equal(allApproved(reviews, participants, version, hash), false);
  reviews.privacy = { status: "approve", version, draftHash: draftHash("stale") };
  assert.equal(allApproved(reviews, participants, version, hash), false);
  reviews.privacy = { status: "approve", version, draftHash: hash };
  assert.equal(allApproved(reviews, participants, version, hash), true);
  assert.equal(allApproved({}, [], version, hash), false, "empty rosters cannot manufacture consensus");
});

test("run persistence starts with a finite roster and real call budget metadata", () => {
  const run = createConvergenceRun({
    runId,
    rootN: 1,
    task: "task",
    participants: [{ id: "fable", provider: "claude", configHash: "cfg" }, { id: "astra", provider: "codex", configHash: "cfg2" }],
    maxRounds: 2,
    plannedCalls: 8,
  });
  assert.deepEqual(run.participants.map((p) => p.id), ["fable", "astra"]);
  assert.equal(run.calls.used, 0);
  assert.equal(run.calls.planned, 8);
  assert.equal(run.draftHash, null);
});

import { isolatedServer } from "./server-fixture.mjs";
const settle = async (server, predicate) => {
  for (let n = 0; n < 150; n++) {
    const snapshot = await server.room("default");
    if (predicate(snapshot)) return snapshot;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  assert.fail("convergence did not reach the expected state");
};

test("ordinary recovery routes cannot enter an active convergence; New fences all late results", async () => {
  const server = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10", FAKE_CONVERGENCE_REVIEW_DELAY: "700" } });
  try {
    assert.equal((await server.api("POST", "/api/message", { room: "default", target: "both", text: "converge" })).status, 200);
    const active = await settle(server, ({ room }) => room.convergence?.phase === "reviewing");
    const rootN = active.room.convergence.rootN;
    for (const [route, body] of [["/api/retry", { rootN }], ["/api/ask", { sourceN: rootN, target: "claude", text: "other task", mode: "now" }], ["/api/seat/sleep", { agent: "claude", asleep: true }]]) {
      assert.equal((await server.api("POST", route, { room: "default", ...body })).status, 409, route);
    }
    assert.equal((await server.api("POST", "/api/new", { room: "default" })).status, 200);
    await new Promise((resolve) => setTimeout(resolve, 850));
    const fresh = await server.room("default");
    assert.equal(fresh.room.convergence, null);
    assert(!fresh.entries.some((e) => e.meta?.convergence));
    assert.equal((await server.api("POST", "/api/message", { room: "default", target: "claude", text: "fresh task" })).status, 200);
    await settle(server, ({ room }) => !room.working && !room.busy.length);
  } finally { await server.close(); }
});

test("native-session recovery attempts consume the convergence budget", async () => {
  const server = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10" } });
  try {
    assert.equal((await server.api("POST", "/api/message", { room: "default", target: "both", text: "MISSINGSESSION", convergenceRounds: 2 })).status, 200);
    const done = await settle(server, ({ room }) => room.convergence?.phase === "agreed");
    // Two initial positions; drafter and both reviewers each recover a missing
    // native session, so three extra provider starts consume all eight calls.
    assert.equal(done.room.convergence.calls.used, 8);
    assert.equal(done.room.convergence.calls.attempts.length, 8);
    assert.equal(done.room.convergence.calls.planned, 8);
    assert.equal(done.entries.filter((e) => e.meta?.convergence?.status === "agreed").length, 1);
  } finally { await server.close(); }
});

test("a recovery retry cannot overrun a full-round budget or manufacture approval", async () => {
  const server = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10" } });
  try {
    assert.equal((await server.api("POST", "/api/message", { room: "default", target: "both", text: "MISSINGSESSION", convergenceRounds: 1 })).status, 200);
    const done = await settle(server, ({ room }) => room.convergence?.phase === "incomplete" && !room.working);
    assert(done.room.convergence.calls.used <= 5);
    assert(!done.entries.some((e) => e.meta?.convergence?.status === "agreed"));
    assert.equal(done.room.convergence.actions.resume, false);
    assert.equal((await server.api("POST", "/api/convergence", { room: "default", action: "resume" })).status, 409);
  } finally { await server.close(); }
});
