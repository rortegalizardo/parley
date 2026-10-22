import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isolatedServer } from "./server-fixture.mjs";

const server = await isolatedServer();
const fake = path.join(path.dirname(new URL(import.meta.url).pathname), "fake-cli.mjs");
const api = (method, route, body) => server.api(method, route, body);
const eventually = async (check, label) => {
  for (let i = 0; i < 80; i++) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(`timed out waiting for ${label}`);
};

try {
  const many = Array.from({ length: 10 }, (_, i) => ({
    id: `agent${i}`, provider: i % 2 ? "codex" : "claude",
  }));
  assert.equal((await api("POST", "/api/rooms", { name: "many", seats: many })).status, 200);
  const before = await server.room("many");
  assert.equal(before.room.seats.length, 10, "room creation has no fixed eight-seat cap");

  const configured = Object.fromEntries(before.room.seats.map((id) => [id, { command: fake, lurk: false }]));
  configured.agent0 = { command: fake, lurk: false, model: "preserved-model", effort: "high", instructions: "preserved identity" };
  assert.equal((await api("POST", "/api/config", {
    room: "many", config: { accounting: "exchanges", hopBudget: 0, agents: configured },
  })).status, 200);
  // Establish durable conversation state before changing the roster.
  assert.equal((await api("POST", "/api/message", { room: "many", target: "agent0", text: "first review" })).status, 200);
  await eventually(async () => (await server.room("many")).entries.some((entry) => entry.author === "agent0"), "agent0 response");
  assert.equal((await api("POST", "/api/message", { room: "many", target: "agent1", text: "second review" })).status, 200);
  const historyBefore = await eventually(async () => {
    const snapshot = await server.room("many");
    return snapshot.entries.some((entry) => entry.author === "agent1") ? snapshot : null;
  }, "agent1 response");
  const retainedRuntime = historyBefore.room.agents.agent0;
  const edited = await api("POST", "/api/config", {
    room: "many", expectedRosterVersion: before.room.rosterVersion,
    seats: [{ id: "agent0", provider: "claude" }, { id: "newone", provider: "codex" }],
    // Mirrors the Settings form: roster metadata and per-agent fields arrive
    // together, including fields for a newly added seat.
    config: { agents: { agent0: { command: fake }, newone: { command: fake, instructions: "privacy reviewer" } } },
  });
  assert.equal(edited.status, 200, JSON.stringify(edited.data));
  const after = await server.room("many");
  assert.deepEqual(after.room.seats, ["agent0", "newone"]);
  assert.equal(after.room.cfg.agents.agent0.command, fake, "retained settings survive roster edit");
  assert.equal(after.room.cfg.agents.agent0.model, "preserved-model");
  assert.equal(after.room.cfg.agents.agent0.effort, "high");
  assert.equal(after.room.cfg.agents.agent0.instructions, "preserved identity");
  assert.equal(after.room.cfg.agents.newone.provider, "codex");
  assert.equal(after.room.cfg.agents.newone.instructions, "privacy reviewer");
  assert.equal(after.room.agents.agent0.cursor, retainedRuntime.cursor, "retained cursor survives roster edit");
  assert.equal(after.room.agents.agent0.sessionRef, retainedRuntime.sessionRef, "retained native session survives roster edit");
  assert(after.entries.some((entry) => entry.author === "agent1"), "removed authors remain visible in transcript history");
  const persistedCfg = JSON.parse(fs.readFileSync(`${server.root}/many/room.json`, "utf8"));
  const persistedState = JSON.parse(fs.readFileSync(`${server.root}/many/state.json`, "utf8"));
  assert.deepEqual(Object.keys(persistedCfg.agents), ["agent0", "newone"], "persisted config excludes removed seats");
  assert(persistedState.retiredAgents.agent1, "removed seat tombstone persists for restart safety");
  assert.equal(persistedState.agents.agent0.cursor, retainedRuntime.cursor, "persisted retained cursor survives restart");

  // Seed a persisted listener obligation, then exercise removal after a fresh
  // load so cancellation happens while the old roster is still live.
  assert.equal((await api("POST", "/api/rooms", {
    name: "catchup", seats: [{ id: "owner", provider: "claude" }, { id: "listener", provider: "codex" }],
  })).status, 200);
  await server.configure("catchup", { agents: { owner: { command: fake, lurk: false }, listener: { command: fake, lurk: true } } });
  const catchupStatePath = `${server.root}/catchup/state.json`;
  const seeded = JSON.parse(fs.readFileSync(catchupStatePath, "utf8"));
  seeded.agents.listener.pendingCatchUp = { sinceN: 1, throughN: 1, triggerN: 1, revision: 1, at: new Date().toISOString() };
  fs.writeFileSync(catchupStatePath, JSON.stringify(seeded));

  // A fresh process load must reconstruct the same room from disk, including
  // transcript, runtime cursor, and the retired-id guard.
  const restarted = await isolatedServer();
  try {
    fs.cpSync(`${server.root}/many`, `${restarted.root}/many`, { recursive: true });
    fs.cpSync(`${server.root}/catchup`, `${restarted.root}/catchup`, { recursive: true });
    const reloaded = await restarted.room("many");
    assert.deepEqual(reloaded.room.seats, ["agent0", "newone"], "reload keeps the edited roster");
    assert.equal(reloaded.room.agents.agent0.cursor, retainedRuntime.cursor, "reload keeps retained cursor");
    assert(reloaded.entries.some((entry) => entry.author === "agent1"), "reload keeps removed authors in history");
    assert(reloaded.room.seats.length < 10, "reload excludes removed seats");
    const readdAfterReload = await restarted.api("POST", "/api/config", {
      room: "many", seats: [{ id: "agent0", provider: "claude" }, { id: "agent1", provider: "codex" }],
    });
    assert.equal(readdAfterReload.status, 409, "reload preserves retired-id safety");
    const cancel = await restarted.api("POST", "/api/config", {
      room: "catchup", seats: [{ id: "owner", provider: "claude" }],
    });
    assert.equal(cancel.status, 200, "pending catch-up can be cancelled during removal");
    const catchupAfter = await restarted.room("catchup");
    assert.equal(catchupAfter.room.seats.includes("listener"), false);
    const catchupPersisted = JSON.parse(fs.readFileSync(`${restarted.root}/catchup/state.json`, "utf8"));
    assert(catchupPersisted.lurkOutcomes.some((outcome) => outcome.agent === "listener" && outcome.reason === "removed"), "catch-up cancellation records removed outcome");
  } finally {
    await restarted.close();
  }

  const stale = await api("POST", "/api/config", {
    room: "many", expectedRosterVersion: before.room.rosterVersion,
    seats: [{ id: "agent0", provider: "claude" }],
  });
  assert.equal(stale.status, 409, "stale roster edits are rejected");
  assert.deepEqual((await server.room("many")).room.seats, ["agent0", "newone"], "stale edit is atomic");
  const beforeInvalid = Object.fromEntries(["room.json", "state.json", "events.jsonl"].map((file) => [
    file, fs.existsSync(`${server.root}/many/${file}`) ? fs.readFileSync(`${server.root}/many/${file}`, "utf8") : "",
  ]));

  const empty = await api("POST", "/api/config", { room: "many", seats: [] });
  assert.equal(empty.status, 400);
  const providerChange = await api("POST", "/api/config", {
    room: "many", seats: [{ id: "agent0", provider: "codex" }],
  });
  assert.equal(providerChange.status, 409, "retained provider identity is immutable");
  for (const [file, content] of Object.entries(beforeInvalid)) {
    assert.equal(fs.existsSync(`${server.root}/many/${file}`) ? fs.readFileSync(`${server.root}/many/${file}`, "utf8") : "", content, `${file} unchanged after rejected edit`);
  }
  const reuse = await api("POST", "/api/config", {
    room: "many", seats: [{ id: "agent0", provider: "claude" }, { id: "agent1", provider: "codex" }],
  });
  assert.equal(reuse.status, 409, "removed seat ids are retired rather than inheriting old history");

  // A running or queued delivery keeps its seat until the exchange settles.
  assert.equal((await api("POST", "/api/rooms", {
    name: "busy", seats: [{ id: "worker", provider: "claude" }, { id: "reviewer", provider: "codex" }],
  })).status, 200);
  await server.configure("busy", { agents: { worker: { command: fake, lurk: false }, reviewer: { command: fake, lurk: false } } });
  assert.equal((await api("POST", "/api/message", { room: "busy", target: "worker", text: "SLEEP:1200 long review" })).status, 200);
  // The second message is accepted behind the same seat, exercising the
  // queued path as well as the currently running invocation.
  assert.equal((await api("POST", "/api/message", { room: "busy", target: "worker", text: "queued review" })).status, 200);
  const busyRemoval = await api("POST", "/api/config", {
    room: "busy", seats: [{ id: "reviewer", provider: "codex" }],
  });
  assert.equal(busyRemoval.status, 409, "busy and queued seats cannot be removed");
  await eventually(async () => {
    const snapshot = await server.room("busy");
    return snapshot.entries.filter((entry) => entry.author === "worker").length >= 2;
  }, "busy room to settle");
  const idleRemoval = await eventually(async () => {
    const result = await api("POST", "/api/config", {
      room: "busy", seats: [{ id: "reviewer", provider: "codex" }],
    });
    return result.status === 200 ? result : null;
  }, "busy room to become idle");
  assert.equal(idleRemoval.status, 200, "removal succeeds after queued work settles");
} finally {
  await server.close();
}

console.log("roster edit checks passed");
