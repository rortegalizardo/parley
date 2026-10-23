// Focused functional fixture: real Parley adapter + synthetic Codex rollouts,
// isolated HOME/CODEX_HOME, ephemeral ports, no provider credentials or model calls.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { isolatedServer } from "./server-fixture.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "parley-codex-context-"));
const command = path.join(root, "fake-codex.mjs");
fs.writeFileSync(command, String.raw`#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const args=process.argv.slice(2), index=args.indexOf('resume');
const mode=[...input.matchAll(/CASE:([a-z]+)/g)].at(-1)?.[1]||'normal';
const thread=index>=0?args[index+1]:crypto.randomUUID();
const dir=path.join(process.env.CODEX_HOME,'sessions','2026','10','23');fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'rollout-2026-10-23T01-02-03-'+thread+'.jsonl');
const line=(type,payload,timestamp=new Date().toISOString())=>JSON.stringify({timestamp,type,payload})+'\n';
if(mode!=='missing'&&!args.includes('--ephemeral')&&!fs.existsSync(file)){
 fs.writeFileSync(file,line('session_meta',{id:mode==='foreign'?crypto.randomUUID():thread}));
 fs.appendFileSync(file,line('compacted',{message:'historical summary',window_id:'old'},'2000-01-01T00:00:00Z'));
}
console.log(JSON.stringify({type:'thread.started',thread_id:thread}));
if(mode==='stale')await new Promise(r=>setTimeout(r,300));
if(mode!=='missing'&&!args.includes('--ephemeral')){
 fs.appendFileSync(file,line('event_msg',{type:'item_started',item:{type:'context_compaction'}}));
 fs.appendFileSync(file,line('event_msg',{type:'context_compacted'}));
 if(mode!=='quiet'){
  const record=line('compacted',{message:'finished summary',window_id:mode==='duplicate'?'normal':mode});
  fs.appendFileSync(file,record.slice(0,-1));await new Promise(r=>setTimeout(r,30));fs.appendFileSync(file,'\n'+record);
 }
}
const text='ACK:'+mode;fs.writeFileSync(args[args.indexOf('--output-last-message')+1],text);
console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text}}));
`, { mode: 0o755 });
let server;
const wait = async (check) => {
  for (let n = 0; n < 150; n++) { const result = await check(); if (result) return result; await new Promise((r) => setTimeout(r, 30)); }
  throw new Error("Timed out waiting for fake Codex context result");
};
const configure = (name, extraArgs = []) => server.api("POST", "/api/config", { room: name,
  config: { hopBudget: 0, agents: { codex: { command, lurk: false, extraArgs } } } });
const send = async (name, mode) => {
  const before = (await server.room(name)).entries.at(-1)?.n || 0;
  assert.equal((await server.api("POST", "/api/message", { room: name, target: "codex", text: `CASE:${mode}` })).status, 200);
  return wait(async () => { const snapshot = await server.room(name); return snapshot.entries.some((e) => e.n > before && e.author === "codex") ? snapshot : null; });
};
try {
  server = await isolatedServer({ root, keepRoot: true });
  await configure("default");
  let snapshot = await send("default", "normal");
  let events = snapshot.room.context.events.filter((e) => e.type === "compaction");
  assert.equal(events.length, 1, "one completed checkpoint; exclude historical, started and companion records");
  assert.equal(events[0].provenance, "codex_rollout");
  assert.equal(typeof events[0].checkpointOffset, "number");
  assert(events[0].threadId);
  assert(snapshot.entries.some((e) => e.meta?.contextEvent?.providerEventId === events[0].providerEventId));
  snapshot = await send("default", "quiet");
  assert.equal(snapshot.room.context.events.filter((e) => e.type === "compaction").length, 1, "resume baseline excludes historical records");
  snapshot = await send("default", "duplicate");
  assert.equal(snapshot.room.context.events.filter((e) => e.type === "compaction").length, 1, "same checkpoint is persistently deduplicated");
  snapshot = await send("default", "next");
  assert.equal(snapshot.room.context.events.filter((e) => e.type === "compaction").length, 2, "a later completed checkpoint is recorded");
  await server.close();
  server = await isolatedServer({ root, keepRoot: true });
  await configure("default");
  snapshot = await send("default", "quiet");
  assert.equal(snapshot.room.context.events.filter((e) => e.type === "compaction").length, 2, "restart never replays existing checkpoints");

  for (const mode of ["foreign", "missing", "ephemeral", "stale"]) {
    const name = `observe-${mode}`;
    assert.equal((await server.api("POST", "/api/rooms", { name, seats: [{ id: "codex", provider: "codex" }] })).status, 200);
    await configure(name, mode === "ephemeral" ? ["--ephemeral"] : []);
    if (mode === "stale") {
      await server.api("POST", "/api/message", { room: name, target: "codex", text: "CASE:stale" });
      await server.api("POST", "/api/config", { room: name, config: { agents: { codex: { instructions: "Changed while the turn was running" } } } });
      snapshot = await wait(async () => { const x = await server.room(name); return x.entries.some((e) => e.author === "codex") ? x : null; });
    } else snapshot = await send(name, mode);
    assert.equal(snapshot.room.context.events.filter((e) => e.type === "compaction").length, 0, `${mode} cannot report a confirmed compaction`);
    if (mode !== "stale") assert.equal(snapshot.room.context.observations.codex.status, "unavailable", `${mode} visibly reports missing observation`);
  }
  console.log("PASS Codex adapter checkpoint confirmation, partial-line handling, historical/started/foreign exclusion, persistent dedup, native resume/restart, missing/ephemeral visibility and stale-setting fence");
} finally {
  await server?.close();
  fs.rmSync(root, { recursive: true, force: true });
}
