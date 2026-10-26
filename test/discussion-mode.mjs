// Public API regression: choosing Parallel applies to the next message even
// after a completed convergence run, for chips and typed @all alike.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { isolatedServer } from "./server-fixture.mjs";

const traceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "parley-discussion-mode-"));
const traceFile = path.join(traceRoot, "calls.jsonl");
const server = await isolatedServer({ discussionMode: null,
  env: { FAKE_CONVERGENCE: "approve", FAKE_DELAY_MS: "10", FAKE_CONVERGENCE_TRACE: traceFile } });
const wait = async (check) => {
  for (let n = 0; n < 200; n++) { const result = await check(); if (result) return result; await new Promise((resolve) => setTimeout(resolve, 30)); }
  throw new Error("Discussion mode did not reach the expected result");
};
const calls = () => fs.existsSync(traceFile) ? fs.readFileSync(traceFile, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
try {
  assert.equal((await server.api("POST", "/api/message", { room: "default", target: "both",
    discussionMode: "converge", text: "Agree on a report export format." })).status, 200);
  const agreed = await wait(async () => { const x = await server.room("default"); return x.room.convergence?.phase === "agreed" ? x : null; });
  const originalRun = agreed.room.convergence.runId;
  for (const request of [
    { target: "auto", text: "Give independent suggestions for export filenames." },
    { target: null, text: "Give separate suggestions for column labels." },
    { target: "both", text: "Give separate views on CSV and JSON." },
    { target: "auto", text: "@all Give independent thoughts on validation." },
    { target: "both", text: "@all Compare the export formats independently." },
  ]) {
    const before = await server.room("default");
    const lastN = before.entries.at(-1)?.n || 0;
    const count = calls().length;
    assert.equal((await server.api("POST", "/api/message", { room: "default", discussionMode: "parallel", ...request })).status, 200);
    const delivered = await wait(async () => {
      const x = await server.room("default");
      return x.entries.filter((e) => e.n > lastN && e.kind === "agent").length >= 2 && !Object.keys(x.room.busy || {}).length ? x : null;
    });
    const root = delivered.entries.find((e) => e.n > lastN && e.kind === "user");
    assert.equal(root.target, "both");
    assert(!root.meta?.convergence, "Parallel must never create convergence metadata");
    assert.equal(delivered.room.convergence.runId, originalRun, "the previous agreement remains history; no new convergence run starts");
    assert(!delivered.entries.some((e) => e.n > lastN && e.meta?.convergence), "Parallel must not generate a new agreed handoff");
    const launched = calls().slice(count);
    assert(launched.length >= 2);
    assert(launched.every((call) => call.stage === "position"), "Parallel must not launch convergence drafting or review stages");
  }
  // Explicit Converge remains independently selectable after Parallel.
  assert.equal((await server.api("POST", "/api/message", { room: "default", target: "auto",
    discussionMode: "converge", text: "@all Reach agreement on required report fields." })).status, 200);
  await wait(async () => { const x = await server.room("default"); return x.room.convergence?.phase === "agreed" && x.room.convergence.runId !== originalRun ? x : null; });
  console.log("PASS next-message Parallel after convergence for plain Auto/null inheriting both, target chips, typed @all and both together; no drafting/review stages; explicit Converge still starts a new run");
} finally {
  await server.close();
  fs.rmSync(traceRoot, { recursive: true, force: true });
}
