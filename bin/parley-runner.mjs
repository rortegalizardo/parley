#!/usr/bin/env node
// Start a fresh, context-free Claude Code run when a room asks for one.
// Watches every room the credential can see. A message (yours, an agent's, or
// an agreed handoff) with a line that starts with @desktop:new launches
// `claude -p` in auto permission mode in the folder the message names
// (a "Folder:" line). The room gets a context note when the run starts and
// another with the result when it ends. Context notes never start room agents.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { readBridgeCredential } from '../lib/bridge-adapter.mjs';
import { bridgeContextAllowed } from '../lib/bridge-context.mjs';

const usage = `Usage: parley-runner [--credential /abs/client.json] [--home DIR] [--server-pid N] [--interval-ms N] [--claude PATH] [--permission-mode MODE]

In a room, a message with a line starting "@desktop:new" and a "Folder: <path>"
line starts a fresh \`claude -p\` run in that folder. The message (minus the
@desktop:new line) is the prompt. Results come back to the room as a context note.`;

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) { console.log(usage); process.exit(0); }
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback; };
const credentialPath = opt('--credential', path.join(os.homedir(), '.parley-fork', '.bridge', 'clients', 'claude.json'));
const home = opt('--home', path.join(os.homedir(), '.parley-links', '_runner'));
const serverPid = Number(opt('--server-pid', 0)) || 0;
const interval = Math.max(500, Number(opt('--interval-ms', 3000)) || 3000);
const claudeBin = opt('--claude', 'claude');
const permissionMode = opt('--permission-mode', 'auto');
if (!path.isAbsolute(credentialPath)) { console.error('parley-runner: --credential must be an absolute path.'); process.exit(2); }
// Started by parley-mine itself (its direct child) is the normal case; anything
// else gets the bridge's full ancestry check, so room agents cannot start one.
const launchedByServer = serverPid && process.ppid === serverPid;
if (process.env.PARLEY_ROOM_AGENT === '1' || (!launchedByServer && !await bridgeContextAllowed())) { console.error('parley-runner: disabled inside room-launched agents.'); process.exit(1); }

fs.mkdirSync(path.join(home, 'runs'), { recursive: true, mode: 0o700 });
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; } };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One runner at a time. A restarted server starts a new runner before the old
// one has noticed its server is gone, so wait for the lock instead of quitting.
const lockFile = path.join(home, 'runner.pid');
for (let i = 0; ; i++) {
  const holder = Number(fs.existsSync(lockFile) && fs.readFileSync(lockFile, 'utf8'));
  if (!holder || holder === process.pid || !alive(holder)) break;
  if (i >= 60) { console.error(`parley-runner: already running (pid ${holder}).`); process.exit(1); }
  await pause(1000);
}
fs.writeFileSync(lockFile, String(process.pid));
const release = () => { try { if (Number(fs.readFileSync(lockFile, 'utf8')) === process.pid) fs.unlinkSync(lockFile); } catch {} };
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => { release(); process.exit(0); });
process.on('exit', release);

let credential;
try { credential = await readBridgeCredential(credentialPath); }
catch (error) { console.error(`parley-runner: no bridge credential (${error.message}); @desktop:new is off. Run parley-bridge-setup.`); process.exit(1); }
const call = async (endpoint, body) => {
  const response = await fetch(`${credential.baseUrl}/api/bridge/${endpoint}`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credential.token}`, 'X-Parley-Bridge-Protocol': '1' },
    body: JSON.stringify({ ...body, serverId: credential.serverId }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || data.error || `HTTP ${response.status}`), { code: data.code || data.error, status: response.status });
  return data;
};

const stateFile = path.join(home, 'state.json');
const loadState = () => { try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return { rooms: {}, runs: {} }; } };
const state = loadState(); // { rooms: { [room]: { conversationId, lastN } }, runs: { [id]: run }, outbox: [note] }
state.outbox ||= [];
const saveState = () => fs.writeFileSync(stateFile, JSON.stringify(state), { mode: 0o600 });

// The trigger must start a line (markdown emphasis or code ticks allowed), so a
// message that only mentions @desktop:new in passing does not launch anything.
const trigger = /^[\s>*_`]*@desktop:new(?![a-z0-9-])[*_`]*\s*$/im;
const ownNote = /^(?:▶ Fresh session|[✓✗] Fresh session|@desktop:new from .+ not started)/;
const field = (text, name) => {
  const line = String(text).split('\n').find((l) => new RegExp(`^[\\s>*_]*${name}[*_]*\\s*:`, 'i').test(l));
  if (!line) return '';
  const value = line.replace(new RegExp(`^[\\s>*_]*${name}[*_]*\\s*:[*_]*\\s*`, 'i'), '');
  return (value.match(/`([^`]+)`/)?.[1] || value).trim();
};
const resolveFolder = (raw) => {
  if (!raw) return { error: 'No "Folder:" line. Add one, for example: Folder: `~/Desktop/Projects/my-repo`' };
  const folder = path.resolve(raw.replace(/^~(?=$|\/)/, os.homedir()).split(/\s+\(/)[0].trim());
  if (!folder.startsWith(os.homedir() + path.sep)) return { error: `Folder must be inside your home folder: ${raw}` };
  try { if (!fs.statSync(folder).isDirectory()) throw new Error(); } catch { return { error: `Folder does not exist: ${raw}` }; }
  return { folder };
};

// A note the room must act on (a result, a run that could not start) wakes the
// room's agents; a plain status note is context only and wakes nobody. A busy
// room refuses both, so they wait in an outbox and go out, in order, once it is free.
function note(roomName, text, wake = false) {
  state.outbox.push({ room: roomName, text, wake, key: `runner-${crypto.randomUUID()}` });
  saveState();
}
async function flushOutbox(rooms) {
  const blocked = new Set();
  for (const item of [...state.outbox]) {
    const room = rooms.find((r) => r.room === item.room);
    if (blocked.has(item.room)) continue;
    if (!room) { state.outbox.splice(state.outbox.indexOf(item), 1); continue; }
    const send = (intent, key) => call('send', { room: room.room, conversationId: room.conversationId, rosterHash: room.rosterHash, text: item.text, target: '@all', intent, idempotencyKey: key });
    try {
      // An asleep seat cannot be woken, so the result is still recorded for the user.
      try { await send(item.wake ? 'delegate' : 'context', item.key); }
      catch (error) { if (!item.wake || error.code !== 'participant_asleep') throw error; await send('context', `${item.key}-context`); }
      state.outbox.splice(state.outbox.indexOf(item), 1);
    } catch { blocked.add(item.room); }
    saveState();
  }
}

// Nested Claude Code variables from whoever started the server would tie the
// run to that session; Parley variables would mark it as a room agent.
function cleanEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(CLAUDECODE|CLAUDE_|PARLEY_|ANTHROPIC_)/.test(key) && key !== 'CLAUDE_CONFIG_DIR') continue;
    env[key] = value;
  }
  return env;
}

async function launch(roomName, entry) {
  const id = `${roomName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${entry.n}`;
  if (state.runs[id]) return;
  const who = entry.kind === 'user' ? 'you' : entry.kind === 'agent' ? `@${entry.author}` : 'the agreed handoff';
  const { folder, error } = resolveFolder(field(entry.text, 'Folder'));
  if (error) { note(roomName, `@desktop:new from ${who} (#${entry.n}) not started. ${error}`, true); state.runs[id] = { done: true }; return; }
  const title = field(entry.text, 'Title') || `Parley ${roomName} #${entry.n}`;
  const prompt = [
    `You are a fresh Claude Code session started from the Parley room "${roomName}" (message #${entry.n}, from ${who}). You have no other context. Do the task below in this folder. Your final message is posted back to the room, so end with a short report: what you did, what is left, anything blocked.`,
    '', String(entry.text).replace(trigger, '').trim(),
  ].join('\n');
  const out = path.join(home, 'runs', `${id}.json`);
  const err = path.join(home, 'runs', `${id}.log`);
  const child = spawn(claudeBin, ['-p', '--permission-mode', permissionMode, '--output-format', 'json', '-n', title], {
    cwd: folder, env: cleanEnv(), detached: true,
    stdio: ['pipe', fs.openSync(out, 'w', 0o600), fs.openSync(err, 'w', 0o600)],
  });
  const started = await new Promise((resolve) => { child.once('spawn', () => resolve(true)); child.once('error', () => resolve(false)); });
  if (!started) { note(roomName, `@desktop:new from ${who} (#${entry.n}) not started: could not run \`${claudeBin}\`.`, true); state.runs[id] = { done: true }; return; }
  child.stdin.end(prompt);
  child.unref();
  state.runs[id] = { room: roomName, n: entry.n, pid: child.pid, folder, title, out, err, startedAt: Date.now() };
  saveState();
  note(roomName, `▶ Fresh session started for #${entry.n}: "${title}" in \`${folder.replace(os.homedir(), '~')}\` (auto mode). Its result will be posted here.`);
}

// Runs are detached, so they outlive a server restart; whichever runner is
// alive when one ends reports it.
async function reportFinished() {
  for (const [id, run] of Object.entries(state.runs)) {
    if (run.done || alive(run.pid)) continue;
    let result = null;
    try { result = JSON.parse(fs.readFileSync(run.out, 'utf8')); } catch {}
    const minutes = Math.max(1, Math.round((Date.now() - run.startedAt) / 60000));
    const text = result
      ? [`${result.is_error ? '✗ Fresh session failed' : '✓ Fresh session finished'} for #${run.n}: "${run.title}" (${minutes} min${result.total_cost_usd ? `, $${result.total_cost_usd.toFixed(2)}` : ''}).`,
        '', String(result.result || '(no final message)').slice(0, 6000), '',
        `Continue it: \`cd ${run.folder.replace(os.homedir(), '~')} && claude --resume ${result.session_id}\``].join('\n')
      : `✗ Fresh session for #${run.n} ("${run.title}") ended without a result. Log: \`${run.err}\``;
    note(run.room, text, true);
    state.runs[id] = { done: true };
    saveState();
  }
}

async function poll() {
  const { rooms } = await call('rooms', {});
  for (const room of rooms) {
    const prev = state.rooms[room.room];
    // A new room, or a reset conversation, starts from now: history never launches runs.
    let catchingUp = !prev || prev.conversationId !== room.conversationId;
    const seen = catchingUp ? { conversationId: room.conversationId, lastN: 0 } : prev;
    let cursor = null;
    for (;;) {
      const page = await call('read', { room: room.room, conversationId: room.conversationId, rosterHash: room.rosterHash, ...(cursor ? { cursor } : {}), limit: 100 });
      for (const entry of page.messages) {
        if (entry.n <= seen.lastN) continue;
        seen.lastN = entry.n;
        if (catchingUp || entry.harness?.intent === 'context' || ownNote.test(entry.text || '')) continue;
        const eligible = entry.kind === 'user' || entry.kind === 'agent' || (entry.kind === 'system' && entry.convergence?.status === 'agreed');
        if (eligible && trigger.test(entry.text || '')) await launch(room.room, entry);
      }
      cursor = page.cursor;
      if (page.messages.length < 100) break;
    }
    state.rooms[room.room] = seen;
  }
  await reportFinished();
  await flushOutbox(rooms);
  saveState();
}

console.log(`PARLEY_RUNNER pid=${process.pid} mode=${permissionMode} home=${home}`);
let lastError = null;
for (;;) {
  if (serverPid && !alive(serverPid)) break; // the server that started us is gone; its replacement starts a new runner
  try {
    await poll();
    if (lastError) { console.log('PARLEY_RUNNER_RESTORED'); lastError = null; }
  } catch (error) {
    const message = error.name === 'TimeoutError' || error.cause ? 'Parley server unreachable' : error.message;
    if (message !== lastError) console.log(`PARLEY_RUNNER_ERROR ${JSON.stringify(message)}`);
    lastError = message;
  }
  await pause(interval);
}
