#!/usr/bin/env node
// Multi-agent integration coverage using isolated rooms and fake provider CLIs.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isolatedServer } from "./server-fixture.mjs";

const server = await isolatedServer({ env: { FAKE_DELAY_MS: "30", PARLEY_HOP_SAFETY: "8" } });
const here = path.dirname(fileURLToPath(import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const api = (method, route, body) => server.api(method, route, body);
const room = (name) => api("GET", `/api/room?name=${encodeURIComponent(name)}`).then((r) => r.data);
const post = async (route, body, status = 200) => {
  const result = await api("POST", route, body);
  assert.equal(result.status, status, JSON.stringify(result.data));
  return result.data;
};
const say = (name, text) => post("/api/message", { room: name, text, target: "auto" });
async function wait(read, condition, label, ms = 25000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const value = await read();
    if (condition(value)) return value;
    await delay(35);
  }
  throw new Error(`Timed out: ${label}\n${server.log()}`);
}
const settled = (name) => wait(() => room(name), (d) =>
  !d.room.busy.length && !d.room.working && !d.room.queued &&
  !Object.values(d.room.agents).some((a) => a.catchUp && !a.asleep), `${name} to settle`);
const sessionState = (name) => JSON.parse(fs.readFileSync(path.join(server.root, name, "state.json"), "utf8"));
const readyMarker = (name, id) => path.join(server.root, name, "workspace", `.fake-cli-ready-${id}`);

async function readAfterRestart() {
  // The fixture intentionally removes its own tree on close. Copy only this
  // test's isolated serialized room into a second isolated root, then start a
  // fresh server process to exercise the production room loader.
  const restartRoot = fs.mkdtempSync(path.join(os.tmpdir(), "parley-multi-restart-"));
  const restartRoomRoot = path.join(restartRoot, "rooms");
  fs.cpSync(server.root, restartRoomRoot, { recursive: true });
  const legacyDir = path.join(restartRoomRoot, "legacy");
  fs.cpSync(path.join(restartRoomRoot, "default"), legacyDir, { recursive: true });
  const legacyConfigPath = path.join(legacyDir, "room.json");
  const legacyConfig = JSON.parse(fs.readFileSync(legacyConfigPath, "utf8"));
  for (const agent of Object.values(legacyConfig.agents)) delete agent.provider;
  fs.writeFileSync(legacyConfigPath, JSON.stringify(legacyConfig));
  const home = path.join(restartRoot, "home");
  fs.mkdirSync(home);
  const env = {
    HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home,
    CODEX_HOME: path.join(home, ".codex"), CLAUDE_CONFIG_DIR: path.join(home, ".claude"),
    PATH: [path.dirname(process.execPath), "/usr/bin", "/bin"].join(path.delimiter),
    LANG: "C.UTF-8", PARLEY_PAIR_SAFETY: "4", PARLEY_HOP_SAFETY: "4",
  };
  const proc = spawn(process.execPath, [path.join(here, "..", "parley.mjs"), "--no-open", "--port", "0", "--root", restartRoomRoot], {
    cwd: restartRoot, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let log = "";
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Restarted server readiness timed out:\n${log}`)), 15000);
      const append = (chunk) => {
        log += chunk.toString();
        const match = /UI:\s+(http:\/\/127\.0\.0\.1:\d+)/.exec(log);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      };
      proc.stdout.on("data", append);
      proc.stderr.on("data", append);
      proc.once("error", (error) => { clearTimeout(timer); reject(error); });
      proc.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Restarted server exited (${code}):\n${log}`)); });
    });
    const html = await fetch(url).then((res) => res.text());
    const token = /name="parley-token" content="([^"]+)"/.exec(html)?.[1];
    const protocol = /name="parley-runtime-protocol" content="([^"]+)"/.exec(html)?.[1];
    assert.ok(token && protocol, "restarted server serves the runtime handshake");
    const response = await fetch(`${url}/api/room?name=multi`, {
      headers: { "X-Parley-Token": token, "X-Parley-Runtime-Protocol": protocol },
    });
    assert.equal(response.status, 200);
    const currentRoom = await response.json();
    const legacyResponse = await fetch(`${url}/api/room?name=legacy`, {
      headers: { "X-Parley-Token": token, "X-Parley-Runtime-Protocol": protocol },
    });
    assert.equal(legacyResponse.status, 200);
    const legacyRoom = await legacyResponse.json();
    const currentSessions = JSON.parse(fs.readFileSync(path.join(restartRoomRoot, "multi", "state.json"), "utf8")).agents;
    return { currentRoom, legacyRoom, currentSessions };
  } finally {
    if (proc.exitCode === null) {
      proc.kill("SIGTERM");
      await Promise.race([new Promise((resolve) => proc.once("close", resolve)), delay(2000)]);
    }
    fs.rmSync(restartRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

const seats = [
  { id: "fable", provider: "claude", model: "claude-test-model", effort: "high", instructions: "FABLE_RULE: keep private details out of summaries." },
  { id: "astra", provider: "codex", model: "codex-test-model", effort: "high", instructions: "ASTRA_RULE: cite the exact file." },
  { id: "critic", provider: "claude", model: "claude-review-model", effort: "low", instructions: "CRITIC_RULE: challenge assumptions." },
  { id: "privacy", provider: "codex", model: "codex-private-model", effort: "medium", instructions: "PRIVACY_RULE: never repeat secrets." },
];

try {
  // Validate the room's size and seat identity constraints before creating the
  // integration room, so failures cannot leave partially initialized state.
  for (const [name, invalidSeats] of [
    ["zero", []],
    ["nine", Array.from({ length: 9 }, (_, i) => ({ id: `seat${i}`, provider: "claude" }))],
    ["duplicate", [{ id: "same", provider: "claude" }, { id: "same", provider: "codex" }]],
    ["reserved", [{ id: "all", provider: "claude" }, "codex"]],
    ["bad-provider", [{ id: "x", provider: "unavailable-provider" }]],
  ]) {
    await post("/api/rooms", { name: `multi-${name}`, seats: invalidSeats }, 400);
  }
  await post("/api/rooms", { name: "single", seats: [{ id: "solo", provider: "claude" }] });
  await server.configure("single");
  await say("single", "@solo SAY:SINGLE_TARGET");
  let singleRoom = await settled("single");
  assert.ok(singleRoom.entries.some((e) => e.author === "solo" && e.text === "SINGLE_TARGET"));
  await post("/api/message", { room: "single", text: "/pair start @solo SAY:SINGLE_PAIR", target: "auto" }, 400);

  const created = await post("/api/rooms", { name: "multi", seats });
  assert.ok(created);
  let d = await room("multi");
  assert.deepEqual(d.room.seats, seats.map(({ id }) => id));
  for (const spec of seats) {
    const cfg = d.room.cfg.agents[spec.id];
    assert.equal(cfg.provider, spec.provider);
    assert.equal(cfg.model, spec.model);
    assert.equal(cfg.effort, spec.effort);
    assert.equal(cfg.instructions, spec.instructions);
  }
  await server.configure("multi", { hopBudget: 8 });

  async function stopSeatWhileSameProviderPeerRuns(stoppedSeat, continuingSeat, marker) {
    const stoppedText = `READY:${marker}-stopped SLEEP:1300 SAY:SHOULD_NOT_FINISH_${marker}`;
    const continuingText = `READY:${marker}-continues SLEEP:1700 SAY:CONTINUES_${marker}`;
    await say("multi", `@${stoppedSeat} ${stoppedText}`);
    await say("multi", `@${continuingSeat} ${continuingText}`);
    await wait(() => Promise.resolve(fs.existsSync(readyMarker("multi", `${marker}-stopped`))), Boolean,
      `${stoppedSeat} fake CLI ready`);
    await wait(() => Promise.resolve(fs.existsSync(readyMarker("multi", `${marker}-continues`))), Boolean,
      `${continuingSeat} fake CLI ready`);
    const busy = await room("multi");
    const stoppedRun = busy.room.busyInfo.find((run) => run.agent === stoppedSeat);
    const continuingRun = busy.room.busyInfo.find((run) => run.agent === continuingSeat);
    assert.ok(stoppedRun?.runId && continuingRun?.runId, JSON.stringify(busy.room.busyInfo));
    const stopResult = await post("/api/stop", {
      room: "multi", scope: "seat", agent: stoppedSeat, runId: stoppedRun.runId,
    });
    assert.equal(stopResult.stopped, true, JSON.stringify(stopResult));
    const completed = await settled("multi");
    assert.equal(completed.entries.some((entry) => entry.author === stoppedSeat && entry.text === `SHOULD_NOT_FINISH_${marker}`), false);
    assert.ok(completed.entries.some((entry) => entry.author === continuingSeat && entry.text === `CONTINUES_${marker}`),
      JSON.stringify(completed.entries.filter((entry) => [stoppedSeat, continuingSeat].includes(entry.author)).map((entry) => [entry.author, entry.text, entry.meta])));
  }

  // The two same-provider seats are independent lanes with independent native
  // session identities, and the configured model/effort reach the CLI.
  await say("multi", "@fable ARGJSON");
  d = await settled("multi");
  const fableArgEntry = d.entries.find((e) => e.author === "fable" && e.text.startsWith("ARGVJSON "));
  assert.ok(fableArgEntry, "fable returned its actual CLI arguments");
  const fableArgv = JSON.parse(fableArgEntry.text.slice("ARGVJSON ".length));
  assert.ok(fableArgv.includes("claude-test-model"), JSON.stringify(fableArgv));
  assert.ok(fableArgv.includes("high"), JSON.stringify(fableArgv));
  await say("multi", "@astra ARGJSON");
  d = await settled("multi");
  const astraArgEntry = d.entries.filter((e) => e.author === "astra" && e.text.startsWith("ARGVJSON ")).at(-1);
  assert.ok(astraArgEntry, "astra returned its actual CLI arguments");
  const astraArgv = JSON.parse(astraArgEntry.text.slice("ARGVJSON ".length));
  assert.ok(astraArgv.includes("codex-test-model"), JSON.stringify(astraArgv));
  assert.ok(astraArgv.some((arg) => arg.includes("high")), JSON.stringify(astraArgv));
  await say("multi", "@critic SAY:CRITIC_PRIVATE_SESSION");
  d = await settled("multi");
  assert.ok(d.entries.some((e) => e.author === "critic" && e.text === "CRITIC_PRIVATE_SESSION"));
  let state = sessionState("multi");
  assert.ok(state.agents.fable.sessionRef && state.agents.critic.sessionRef);
  assert.notEqual(state.agents.fable.sessionRef, state.agents.critic.sessionRef);

  // Stop reaches the requested named process even when a same-provider sibling
  // is live. Both CLI families are checked while their two seats overlap.
  await stopSeatWhileSameProviderPeerRuns("fable", "critic", "claude-stop");
  await stopSeatWhileSameProviderPeerRuns("privacy", "astra", "codex-stop");

  // Named targets address one seat. @all and @both each fan out to every seat.
  await say("multi", "@privacy SAY:ONLY_PRIVACY");
  d = await settled("multi");
  assert.deepEqual(d.entries.filter((e) => e.text === "ONLY_PRIVACY").map((e) => e.author), ["privacy"]);
  await say("multi", "@all SAY:ALL_FOUR");
  d = await settled("multi");
  assert.deepEqual(d.entries.filter((e) => e.text === "ALL_FOUR").map((e) => e.author).sort(), ["astra", "critic", "fable", "privacy"]);
  await say("multi", "@both SAY:BOTH_FOUR");
  d = await settled("multi");
  assert.deepEqual(d.entries.filter((e) => e.text === "BOTH_FOUR").map((e) => e.author).sort(), ["astra", "critic", "fable", "privacy"]);

  // A generated tag from one named agent routes the continuation to the
  // intended peer; assert the hop metadata keeps both seat IDs intact.
  await say("multi", "@fable TAG:astra");
  d = await settled("multi");
  const hop = d.entries.find((e) => e.author === "astra" && e.meta?.hop);
  assert.ok(hop, JSON.stringify(d.entries.filter((e) => e.kind === "agent").map((e) => [e.author, e.text, e.meta])));
  await say("multi", "@privacy TAG:critic");
  d = await settled("multi");
  assert.ok(d.entries.some((e) => e.author === "critic" && e.meta?.hop), "a fourth-seat tag routes to the named third-seat peer");

  // Standing instructions are passed to every invocation, and editing one
  // resets only that seat's native session while preserving the saved value.
  await say("multi", "@fable SAWWHAT");
  d = await settled("multi");
  const briefing = d.entries.find((e) => e.author === "fable" && e.text.startsWith("SAWJSON "));
  assert.ok(briefing);
  assert.match(briefing.text, /FABLE_RULE/);

  state = sessionState("multi");
  const oldFableSession = state.agents.fable.sessionRef;
  const oldAstraSession = state.agents.astra.sessionRef;
  await post("/api/config", { room: "multi", config: { agents: { fable: { instructions: "FABLE_UPDATED: redact identifiers." } } } });
  d = await room("multi");
  assert.equal(d.room.cfg.agents.fable.instructions, "FABLE_UPDATED: redact identifiers.");
  assert.equal(d.room.cfg.agents.astra.instructions, seats[1].instructions);
  await say("multi", "@fable SAWWHAT");
  d = await settled("multi");
  const updated = d.entries.filter((e) => e.author === "fable" && e.text.startsWith("SAWJSON ")).at(-1);
  assert.match(updated.text, /FABLE_UPDATED/);
  state = sessionState("multi");
  assert.notEqual(state.agents.fable.sessionRef, oldFableSession);
  assert.equal(state.agents.astra.sessionRef, oldAstraSession);

  await post("/api/config", { room: "multi", config: { agents: { fable: { instructions: "" } } } });
  d = await room("multi");
  assert.equal(d.room.cfg.agents.fable.instructions, null);
  await say("multi", "@fable SAWWHAT");
  d = await settled("multi");
  const cleared = d.entries.filter((e) => e.author === "fable" && e.text.startsWith("SAWJSON ")).at(-1);
  const clearedPrompt = JSON.parse(cleared.text.slice("SAWJSON ".length)).prompt;
  assert.match(clearedPrompt, /No agent-specific instructions are currently set\. Earlier agent-specific instructions are revoked\./);

  // The settings surface cannot change roster identity. Its attempted writes
  // are rejected without altering the four-seat room or any provider mapping.
  for (const agents of [
    { extra: { provider: "claude" } },
    { fable: { provider: "codex" } },
    { critic: null },
  ]) {
    await post("/api/config", { room: "multi", config: { agents } }, 400);
  }
  d = await room("multi");
  assert.deepEqual(d.room.seats, seats.map(({ id }) => id));
  for (const spec of seats) assert.equal(d.room.cfg.agents[spec.id].provider, spec.provider);

  // A listening fourth seat that comments on a message to critic gives critic
  // the one bounded right of reply. The default roster neighbor of privacy is
  // fable; this verifies the addressed recipient takes priority.
  await post("/api/config", { room: "multi", config: { agents: { privacy: { lurk: true } } } });
  const listenerRoot = (await say("multi", "@critic SAY:PRIMARY CHIME")).entry?.n;
  d = await settled("multi");
  const chime = d.entries.find((e) => e.author === "privacy" && e.text.includes("CHIMED"));
  assert.ok(chime, JSON.stringify(d.entries.filter((e) => e.author === "privacy" || e.author === "critic").map((e) => [e.author, e.text, e.meta])));
  assert.equal(chime.text, "One thing worth flagging: CHIMED.");
  const criticReturn = d.entries.find((e) => e.author === "critic" && e.n > chime.n && e.meta?.replyTo === chime.n);
  assert.ok(criticReturn, JSON.stringify(d.entries.filter((e) => e.n > chime.n).map((e) => [e.author, e.text, e.meta])));
  if (listenerRoot) assert.ok(chime.n > listenerRoot);

  // Pair mode reserves only the chosen worker and default reviewer. Third and
  // fourth seats can remain busy without blocking those two roles.
  await post("/api/config", { room: "multi", config: { agents: { privacy: { lurk: false } } } });
  await say("multi", "@critic SLEEP:1600 SAY:THIRD_BUSY");
  await wait(() => room("multi"), (x) => x.room.busy.includes("critic"), "critic to become busy");
  await say("multi", "@privacy SLEEP:1600 SAY:FOURTH_BUSY");
  await wait(() => room("multi"), (x) => x.room.busy.includes("privacy"), "privacy to become busy");
  await post("/api/message", { room: "multi", text: "/pair start @fable SAY:PAIR_WORK", target: "auto" });
  d = await room("multi");
  assert.equal(d.room.pair.worker, "fable");
  assert.equal(d.room.pair.reviewer, "astra");
  d = await settled("multi");
  assert.ok(d.entries.some((e) => e.author === "fable" && e.meta?.delivery?.kind === "pair-work"), JSON.stringify(d.entries.filter((e) => e.meta?.pair || e.author === "fable" || e.author === "astra").map((e) => [e.author, e.text, e.meta])));
  assert.ok(d.entries.some((e) => e.author === "astra" && e.meta?.pair === "review"), JSON.stringify(d.entries.filter((e) => e.meta?.pair || e.author === "fable" || e.author === "astra").map((e) => [e.author, e.text, e.meta])));

  // A Codex seat with no thread ID in a room that has another Codex seat must
  // discard the ambiguous `--last` sentinel; its next turn starts fresh.
  await post("/api/rooms", { name: "codextwins", seats: [
    { id: "alpha", provider: "codex" }, { id: "beta", provider: "codex" },
  ] });
  await server.configure("codextwins");
  await say("codextwins", "@alpha NOTHREAD SAY:NO_THREAD_ID");
  d = await settled("codextwins");
  assert.ok(d.entries.some((e) => e.author === "alpha" && e.text === "NO_THREAD_ID"));
  assert.equal(sessionState("codextwins").agents.alpha.sessionRef, null);
  await say("codextwins", "@alpha ARGJSON");
  d = await settled("codextwins");
  const alphaArgEntry = d.entries.filter((e) => e.author === "alpha" && e.text.startsWith("ARGVJSON ")).at(-1);
  const alphaArgv = JSON.parse(alphaArgEntry.text.slice("ARGVJSON ".length));
  assert.ok(alphaArgv.includes("exec"), JSON.stringify(alphaArgv));
  assert.ok(!alphaArgv.includes("resume") && !alphaArgv.includes("--last"), JSON.stringify(alphaArgv));

  // A unique Codex provider still uses its upstream --last fallback when the
  // CLI omits thread.started; that behavior is safe when no sibling shares it.
  await post("/api/rooms", { name: "codexunique", seats: [
    { id: "codexsolo", provider: "codex" }, { id: "claudesolo", provider: "claude" },
  ] });
  await server.configure("codexunique");
  await say("codexunique", "@codexsolo NOTHREAD SAY:UNIQUE_NO_THREAD");
  d = await settled("codexunique");
  assert.ok(d.entries.some((e) => e.author === "codexsolo" && e.text === "UNIQUE_NO_THREAD"));
  assert.equal(sessionState("codexunique").agents.codexsolo.sessionRef, "--last");
  await say("codexunique", "@codexsolo ARGJSON");
  d = await settled("codexunique");
  const uniqueArgEntry = d.entries.filter((e) => e.author === "codexsolo" && e.text.startsWith("ARGVJSON ")).at(-1);
  const uniqueArgv = JSON.parse(uniqueArgEntry.text.slice("ARGVJSON ".length));
  assert.ok(uniqueArgv.includes("resume") && uniqueArgv.includes("--last"), JSON.stringify(uniqueArgv));

  // Older installations may already have persisted the ambiguous sentinel.
  // Reload must clear it for both custom Codex seats in the same room.
  const seededState = sessionState("multi");
  seededState.agents.astra.sessionRef = "--last";
  seededState.agents.privacy.sessionRef = "--last";
  fs.writeFileSync(path.join(server.root, "multi", "state.json"), JSON.stringify(seededState));
  const restarted = await readAfterRestart();
  assert.deepEqual(restarted.currentRoom.room.seats, seats.map(({ id }) => id));
  assert.equal(restarted.currentRoom.room.cfg.agents.fable.instructions, null);
  for (const spec of seats) {
    assert.equal(restarted.currentRoom.room.cfg.agents[spec.id].provider, spec.provider);
    assert.equal(restarted.currentRoom.room.cfg.agents[spec.id].model, spec.model);
    assert.equal(restarted.currentRoom.room.cfg.agents[spec.id].effort, spec.effort);
  }
  assert.equal(restarted.currentSessions.astra.sessionRef, null);
  assert.equal(restarted.currentSessions.privacy.sessionRef, null);
  assert.deepEqual(restarted.legacyRoom.room.seats, ["claude", "codex"]);
  assert.equal(restarted.legacyRoom.room.cfg.agents.claude.provider, "claude");
  assert.equal(restarted.legacyRoom.room.cfg.agents.codex.provider, "codex");

  console.log("✓ four named agents validate, persist, route, keep independent sessions, and apply per-agent settings");
} finally {
  await server.close();
}
