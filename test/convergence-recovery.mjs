// Focused recovery fixture. All providers, rooms and credentials are isolated.
// Run with --serve to leave the representative incomplete room open for QA.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createConvergenceRun, draftHash, classifyReview, allApproved } from "../lib/convergence.mjs";
import { isolatedServer } from "./server-fixture.mjs";

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "parley-review-recovery-"));
const trace = path.join(fixtureRoot, "calls.jsonl");
const objection = {
  disputedClause: "Export every report as CSV only. JSON export is out of scope.",
  requiredChange: "Provide CSV for spreadsheet users and JSON for API clients, preserving the same report fields in both formats.",
};
const rationale = "CSV supports spreadsheet users, but the proposed restriction leaves API clients without the structured JSON export they require.";
const draft = `Design a report export workflow. ${objection.disputedClause}`;
const runId = "cv-saved-structured-review";
const envelope = { runId, version: 1, draftHash: draftHash(draft), decision: "object", rationale, objection };
const parsed = classifyReview(JSON.stringify(envelope), envelope);
assert.equal(parsed.status, "block");
assert.deepEqual(parsed.objection, objection);
assert.equal(parsed.rationale, rationale);
assert(parsed.reason.includes(rationale) && parsed.reason.includes(objection.disputedClause) && parsed.reason.includes(objection.requiredChange));
for (const wrong of [{ runId: "other" }, { version: 2 }, { draftHash: "wrong" }]) {
  assert.equal(classifyReview(JSON.stringify({ ...envelope, ...wrong }), envelope).status, "unresolved");
}
assert.equal(classifyReview(JSON.stringify({ ...envelope, objection: { disputedClause: "clause", requiredChange: "" } }), envelope).status, "unresolved");
assert.equal(classifyReview(JSON.stringify({ ...envelope, objection: "Legacy explicit blocking objection" }), envelope).status, "block");
let server;
const roomName = "saved-object-review";
const wait = async (check) => {
  for (let n = 0; n < 200; n++) { const x = await check(); if (x) return x; await new Promise((r) => setTimeout(r, 30)); }
  throw new Error("Timed out waiting for convergence recovery");
};
try {
  server = await isolatedServer({ root: fixtureRoot, keepRoot: true, discussionMode: null,
    env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10", FAKE_CONVERGENCE_TRACE: trace } });
  assert.equal((await server.api("POST", "/api/rooms", { name: roomName,
    seats: [{ id: "claude", provider: "claude" }, { id: "codex", provider: "codex" }, { id: "reviewer", provider: "claude" }] })).status, 200);
  await server.configure(roomName);
  const dir = path.join(server.root, roomName);
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, "room.json"), "utf8"));
  const state = JSON.parse(fs.readFileSync(path.join(dir, "state.json"), "utf8"));
  const participants = Object.keys(cfg.agents).map((id) => ({ id, provider: cfg.agents[id].provider, configHash: draftHash(JSON.stringify(cfg.agents[id])) }));
  const run = createConvergenceRun({ runId, rootN: 1, task: "Design a report export workflow", participants, maxRounds: 2, plannedCalls: 11 });
  Object.assign(run, { phase: "incomplete", round: 1, draftVersion: 1, draftHash: envelope.draftHash, draftText: draft,
    configHash: draftHash(JSON.stringify(cfg)), discussion: true,
    positions: Object.fromEntries(participants.map((p) => [p.id, { status: "complete", text: "Independent position" }])),
    reviews: {
      claude: { status: "approve", version: 1, draftHash: envelope.draftHash, reason: "Approved" },
      reviewer: { status: "approve", version: 1, draftHash: envelope.draftHash, reason: "Approved" },
      codex: { status: "unresolved", version: 1, draftHash: envelope.draftHash, reason: "Review decision was not recognized.", text: JSON.stringify(envelope) },
    }, calls: { used: 7, planned: 11 }, final: { status: "incomplete", reason: "A required review failed, was empty, or did not match this draft. Resume retries only those reviews." } });
  run.rounds = [{ version: 1, hash: envelope.draftHash, text: draft, reviews: run.reviews, complete: false }];
  state.convergence = run; state.nextTurn = 2; state.lastUser = { n: 1, text: run.task, target: "both", done: {}, discussion: true };
  fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify(state));
  fs.writeFileSync(path.join(dir, "events.jsonl"), JSON.stringify({ n: 1, kind: "user", author: "user", target: "both", ts: new Date().toISOString(), text: run.task }) + "\n");
  await server.close();
  server = await isolatedServer({ root: fixtureRoot, keepRoot: true, discussionMode: null,
    env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10", FAKE_CONVERGENCE_TRACE: trace } });
  const before = fs.readFileSync(path.join(dir, "state.json"), "utf8");
  let snapshot = await server.room(roomName);
  assert.equal(snapshot.room.convergence.phase, "incomplete");
  assert.equal(snapshot.room.convergence.reviews.codex.status, "block");
  assert.deepEqual(snapshot.room.convergence.reviews.codex.objection, objection);
  assert(snapshot.room.convergence.final.reason.includes("@codex returned a valid blocking objection"));
  assert.deepEqual(snapshot.room.convergence.recovery.reusedReviews, ["codex"]);
  assert(snapshot.room.convergence.actions.resume);
  assert.equal(allApproved(snapshot.room.convergence.reviews, participants, 1, envelope.draftHash), false);
  assert.equal(fs.readFileSync(path.join(dir, "state.json"), "utf8"), before, "read-only projection must not rewrite the saved run");
  assert(!fs.existsSync(trace), "reload and summary must never launch providers");
  const rejected = await server.api("POST", "/api/convergence", { room: roomName, action: "extend", rounds: 0 });
  assert.equal(rejected.status, 400);
  assert.equal(fs.readFileSync(path.join(dir, "state.json"), "utf8"), before, "rejected action must not persist recovery");

  if (process.argv.includes("--serve")) {
    console.log(`QA fixture ready: ${server.url} room=${roomName} root=${server.root}`);
    await new Promise((resolve) => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
  } else {
    assert.equal((await server.api("POST", "/api/convergence", { room: roomName, action: "resume" })).status, 200);
    snapshot = await wait(async () => { const x = await server.room(roomName); return x.room.convergence?.phase === "agreed" ? x : null; });
    const cv = snapshot.room.convergence;
    assert.equal(cv.calls.used, 11, "reuse all first-round reviews; spend only draft + three reviews in revision two");
    assert.equal(cv.rounds[0].reviews.codex.status, "block");
    assert.deepEqual(cv.rounds[0].reviews.claude, run.reviews.claude);
    assert.deepEqual(cv.rounds[0].reviews.reviewer, run.reviews.reviewer);
    assert.equal(cv.draftVersion, 2, "blocking objection requires a revision before agreement");
    assert.equal(fs.readFileSync(trace, "utf8").trim().split("\n").length, 4);
    const live = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "structured_once", FAKE_DELAY_MS: "10" } });
    try {
      assert.equal((await live.api("POST", "/api/message", { room: "default", target: "both", text: "Discuss and reach agreement after addressing an explicit objection" })).status, 200);
      const settled = await wait(async () => { const x = await live.room("default"); return x.room.convergence?.phase === "agreed" ? x : null; });
      assert.equal(settled.room.convergence.draftVersion, 2);
      assert.equal(settled.room.convergence.rounds[0].reviews.codex.status, "block");
      assert.equal(settled.room.convergence.calls.used, 8);
      assert(settled.entries.some((e) => e.meta?.convergence?.status === "agreed"));
    } finally { await live.close(); }
    console.log("PASS structured objection remains blocking, strict envelope checks, pure saved-review projection, no reload calls, rejected-action safety, explicit-resume reuse, and automatic live revision to consensus");
  }
} finally {
  await server?.close();
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
