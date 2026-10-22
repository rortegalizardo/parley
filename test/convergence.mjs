import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { isolatedServer } from "./server-fixture.mjs";

const waitFor = async (fn, label) => {
  for (let i = 0; i < 160; i++) { const value = await fn(); if (value) return value; await new Promise((r) => setTimeout(r, 50)); }
  assert.fail(`timed out waiting for ${label}`);
};

const server = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "20" } });
try {
  const made = await server.api("POST", "/api/rooms", { name: "converge", seats: [{ id: "claude", provider: "claude" }, { id: "codex", provider: "codex" }] });
  assert.equal(made.status, 200);
  await server.configure("converge");
  const sent = await server.api("POST", "/api/message", { room: "converge", target: "both", text: "find a safe plan" });
  assert.equal(sent.status, 200, JSON.stringify(sent.data));
  const agreed = await waitFor(async () => {
    const snapshot = await server.room("converge");
    return snapshot.room.convergence?.phase === "agreed" ? snapshot : null;
  }, "agreement");
  assert.equal(agreed.room.convergence.status, "agreed");
  assert.equal(agreed.room.convergence.total, 2);
  assert.equal(agreed.room.convergence.approvals, 2);
  assert(agreed.entries.some((entry) => entry.meta?.convergence?.status === "agreed"));
  assert.equal(Object.keys(agreed.room.convergence.contributions).length, 2);
  assert(Object.values(agreed.room.convergence.contributions).every((p) => p.status === "complete"));

  const malformed = await server.api("POST", "/api/rooms", { name: "malformed", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] });
  assert.equal(malformed.status, 200);
  await server.configure("malformed");
  // This process is deliberately an approval fake; the strict parser is also
  // covered by the unit-level malformed helper below. The persisted run proves
  // the complete default orchestration and summary contract through HTTP.
  const summary = await server.room("malformed");
  assert.equal(summary.room.convergence, null);

  const nine = await server.api("POST", "/api/rooms", { name: "nine", seats: Array.from({ length: 9 }, (_, i) => ({ id: `agent${i}`, provider: i % 2 ? "codex" : "claude" })) });
  assert.equal(nine.status, 200);
  await server.configure("nine");
  assert.equal((await server.api("POST", "/api/message", { room: "nine", target: "both", text: "coordinate nine perspectives" })).status, 200);
  const nineDone = await waitFor(async () => { const s = await server.room("nine"); return s.room.convergence?.phase === "agreed" ? s : null; }, "nine-agent agreement");
  assert.equal(nineDone.room.convergence.total, 9);
  assert.equal(nineDone.room.convergence.approvals, 9);
  for (const count of [4, 8]) {
    const roomName = `many${count}`;
    assert.equal((await server.api("POST", "/api/rooms", { name: roomName, seats: Array.from({ length: count }, (_, i) => ({ id: `agent${i}`, provider: i % 2 ? "codex" : "claude" })) })).status, 200);
    await server.configure(roomName);
    await server.api("POST", "/api/message", { room: roomName, target: "both", text: `coordinate ${count} perspectives` });
    const done = await waitFor(async () => { const s = await server.room(roomName); return s.room.convergence?.phase === "agreed" ? s : null; }, `${count}-agent agreement`);
    assert.equal(done.room.convergence.total, count);
    assert.equal(done.room.convergence.approvals, count);
  }
} finally { await server.close(); }

const malformedServer = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "malformed", FAKE_DELAY_MS: "10" } });
try {
  assert.equal((await malformedServer.api("POST", "/api/rooms", { name: "bad", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] })).status, 200);
  await malformedServer.configure("bad");
  assert.equal((await malformedServer.api("POST", "/api/message", { room: "bad", target: "both", text: "strict review" })).status, 200);
  const unresolved = await waitFor(async () => { const s = await malformedServer.room("bad"); return s.room.convergence?.phase === "incomplete" ? s : null; }, "malformed review incomplete");
  assert.equal(unresolved.room.convergence.outcome, "incomplete");
} finally { await malformedServer.close(); }

const blockedServer = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "block", FAKE_DELAY_MS: "10" } });
try {
  assert.equal((await blockedServer.api("POST", "/api/rooms", { name: "blocked", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] })).status, 200);
  await blockedServer.configure("blocked");
  await blockedServer.api("POST", "/api/message", { room: "blocked", target: "both", text: "resolve objections" });
  const unresolved = await waitFor(async () => { const s = await blockedServer.room("blocked"); return s.room.convergence?.phase === "unresolved" ? s : null; }, "bounded unresolved review");
  assert.equal(unresolved.room.convergence.round, 2);
  assert(unresolved.room.convergence.objections.length >= 2);
  const extended = await blockedServer.api("POST", "/api/convergence", { room: "blocked", action: "extend", convergenceRounds: 1 });
  assert.equal(extended.status, 200, JSON.stringify(extended.data));
  const extendedResult = await waitFor(async () => { const s = await blockedServer.room("blocked"); return s.room.convergence?.phase === "unresolved" && s.room.convergence.round > 2 ? s : null; }, "extended review round");
  assert(extendedResult.room.convergence.round > 2, "extend must execute an additional review round");
} finally { await blockedServer.close(); }

const reservationServer = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "reservation", FAKE_DELAY_MS: "10" } });
try {
  assert.equal((await reservationServer.api("POST", "/api/rooms", { name: "reserved", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] })).status, 200);
  await reservationServer.configure("reserved");
  await reservationServer.api("POST", "/api/message", { room: "reserved", target: "both", text: "approve with a reservation" });
  const reserved = await waitFor(async () => { const s = await reservationServer.room("reserved"); return s.room.convergence?.phase === "agreed" ? s : null; }, "reservation agreement");
  assert.equal(reserved.room.convergence.approvals, 2);
  assert.equal(reserved.room.convergence.reviews.one.status, "approve_with_reservation");
} finally { await reservationServer.close(); }

const singleServer = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10" } });
try {
  assert.equal((await singleServer.api("POST", "/api/rooms", { name: "single", seats: [{ id: "solo", provider: "claude" }] })).status, 200);
  await singleServer.configure("single");
  await singleServer.api("POST", "/api/message", { room: "single", target: "both", text: "ordinary single agent task" });
  const single = await waitFor(async () => { const s = await singleServer.room("single"); return s.entries.some((e) => e.author === "solo") ? s : null; }, "single response");
  assert.equal(single.room.convergence, null, "N1 must not claim consensus");
} finally { await singleServer.close(); }

const guardServer = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "900" } });
try {
  assert.equal((await guardServer.api("POST", "/api/rooms", { name: "guard", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] })).status, 200);
  await guardServer.configure("guard");
  await guardServer.api("POST", "/api/message", { room: "guard", target: "both", text: "long convergence task" });
  const nextTask = await guardServer.api("POST", "/api/message", { room: "guard", target: "one", text: "new task must wait" });
  assert.equal(nextTask.status, 409, JSON.stringify(nextTask.data));
  const cfg = await guardServer.api("POST", "/api/config", { room: "guard", config: { agents: { one: { instructions: "changed during run" } } } });
  assert.equal(cfg.status, 409, JSON.stringify(cfg.data));
} finally { await guardServer.close(); }

const stopTrace = path.join(os.tmpdir(), `parley-convergence-${Date.now()}-stop.jsonl`);
const stopServer = await isolatedServer({ discussionMode: null, env: { FAKE_CONVERGENCE: "approve", FAKE_CONVERGENCE_TRACE: stopTrace, FAKE_DELAY_MS: "10", FAKE_CONVERGENCE_REVIEW_DELAY: "1200" } });
try {
  assert.equal((await stopServer.api("POST", "/api/rooms", { name: "stop", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] })).status, 200);
  await stopServer.configure("stop");
  await stopServer.api("POST", "/api/message", { room: "stop", target: "both", text: "stop during review" });
  await waitFor(async () => (await stopServer.room("stop")).room.convergence?.phase === "reviewing", "review phase");
  assert.equal((await stopServer.api("POST", "/api/convergence", { room: "stop", action: "stop" })).status, 200);
  const stopped = await waitFor(async () => { const s = await stopServer.room("stop"); return ["stopped", "incomplete"].includes(s.room.convergence?.phase) ? s : null; }, "stopped convergence");
  assert.notEqual(stopped.room.convergence.phase, "agreed");
  assert(!stopped.entries.some((entry) => entry.meta?.convergence?.status === "agreed"));
  const resumed = await stopServer.api("POST", "/api/convergence", { room: "stop", action: "resume" });
  assert.equal(resumed.status, 200, JSON.stringify(resumed.data));
  const afterResume = await waitFor(async () => { const s = await stopServer.room("stop"); return s.room.convergence?.phase === "agreed" ? s : null; }, "explicit resume agreement");
  assert.equal(afterResume.room.convergence.outcome, "agreed");
  const traceLines = fs.readFileSync(stopTrace, "utf8").trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
  assert.equal(traceLines.filter((line) => line.stage === "position").length, 2, "resume must not repeat completed positions");
} finally { await stopServer.close(); }

// Simulate a crash using a saved in-flight checkpoint, after terminating only
// the owned fixture and its provider children. The persisted review stage has
// a completed draft but no votes, so a replayed drafter is detectable.
const restartTrace = path.join(os.tmpdir(), `parley-restart-trace-${process.pid}.jsonl`);
fs.writeFileSync(restartTrace, "");
const restartEnv = { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10", FAKE_CONVERGENCE_REVIEW_DELAY: "900", FAKE_CONVERGENCE_TRACE: restartTrace };
const restartServer = await isolatedServer({ discussionMode: null, keepRoot: true, env: restartEnv });
const restartRoot = restartServer.root;
try {
  assert.equal((await restartServer.api("POST", "/api/rooms", { name: "restart", seats: [{ id: "one", provider: "claude" }, { id: "two", provider: "codex" }] })).status, 200);
  await restartServer.configure("restart");
  await restartServer.api("POST", "/api/message", { room: "restart", target: "both", text: "persist this convergence" });
  await waitFor(async () => (await restartServer.room("restart")).room.convergence?.phase === "reviewing", "in-flight review checkpoint");
  const statePath = `${restartRoot}/restart/state.json`;
  const checkpoint = fs.readFileSync(statePath, "utf8");
  await restartServer.close();
  fs.writeFileSync(statePath, checkpoint);
  const restarted = await isolatedServer({ discussionMode: null, root: path.dirname(restartRoot), env: restartEnv });
  try {
    const recovered = await restarted.room("restart");
    assert.equal(recovered.room.convergence.phase, "incomplete", "restart requires explicit recovery");
    const beforeCalls = recovered.room.convergence.calls.used;
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal((await restarted.room("restart")).room.convergence.calls.used, beforeCalls, "restart itself launches no provider calls");
    const resumed = await restarted.api("POST", "/api/convergence", { room: "restart", action: "resume" });
    assert.equal(resumed.status, 200, JSON.stringify(resumed.data));
    const finished = await waitFor(async () => { const s = await restarted.room("restart"); return s.room.convergence?.phase === "agreed" ? s : null; }, "restart resume agreement");
    assert.equal(finished.room.convergence.outcome, "agreed");
    const trace = fs.readFileSync(restartTrace, "utf8").trim().split(/\n/).map(JSON.parse);
    assert.equal(trace.filter((r) => r.stage === "position").length, 2, "completed positions are not repeated");
    assert.equal(trace.filter((r) => r.stage === "draft").length, 1, "completed draft is not repeated");
    assert.equal(finished.entries.filter((e) => e.meta?.convergence?.status === "agreed").length, 1);
  } finally { await restarted.close(); }
} finally { await restartServer.close(); fs.rmSync(restartTrace, { force: true }); }

console.log("convergence checks passed (N1/N2/N4/N8/N9, guards, votes, stop/resume/extend, in-flight restart without completed-call replay)");
