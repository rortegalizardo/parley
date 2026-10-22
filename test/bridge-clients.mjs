#!/usr/bin/env node
// Optional compatibility validation against installed clients; no provider/model turn.
// Caller supplies already-provisioned credentials. All client configuration is temporary.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { readBridgeCredential } from '../lib/bridge-adapter.mjs';

const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== '--credential' || args[2] !== '--claude-credential') throw new Error('Usage: node test/bridge-clients.mjs --credential /absolute/codex.json --claude-credential /absolute/claude.json');
for (const filename of [args[1], args[3]]) { assert.ok(path.isAbsolute(filename)); await readBridgeCredential(filename); }
const adapter = fileURLToPath(new URL('../bin/parley-bridge.mjs', import.meta.url));
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'parley-real-clients-'));
const children = new Set();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const spawnChild = (command, argv, env) => {
  const child = spawn(command, argv, { cwd: temporary, env, stdio: ['pipe', 'pipe', 'pipe'] });
  children.add(child);
  child.once('close', () => children.delete(child));
  return child;
};
async function stop(child) {
  if (child.exitCode !== null || child.signalCode) return;
  child.stdin.end();
  const closed = new Promise(resolve => child.once('close', resolve));
  if (await Promise.race([closed.then(() => true), sleep(1500).then(() => false)])) return;
  child.kill('SIGTERM');
  if (await Promise.race([closed.then(() => true), sleep(1500).then(() => false)])) return;
  child.kill('SIGKILL');
  await closed;
}
async function run(command, argv, env) {
  const child = spawnChild(command, argv, env);
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.resume();
  const timer = setTimeout(() => child.kill('SIGTERM'), 30_000);
  try {
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    assert.equal(code, 0, `${command} compatibility command failed.`);
    return output;
  } finally { clearTimeout(timer); await stop(child); }
}

try {
  const codexConfig = path.join(temporary, 'codex-config');
  const claudeConfig = path.join(temporary, 'claude-config');
  await fs.mkdir(codexConfig); await fs.mkdir(claudeConfig);
  // Values apply only to children. No existing client files are read or modified.
  const codexEnv = { ...process.env, CODEX_HOME: codexConfig, PARLEY_ROOM_AGENT: '' };
  const claudeEnv = { ...process.env, CLAUDE_CONFIG_DIR: claudeConfig, PARLEY_ROOM_AGENT: '' };
  delete claudeEnv.CLAUDECODE;
  const child = spawnChild('codex', ['app-server', '--stdio',
    '-c', `mcp_servers.parley.command=${JSON.stringify(process.execPath)}`,
    '-c', `mcp_servers.parley.args=${JSON.stringify([adapter, '--credential', args[1]])}`,
    '-c', 'mcp_servers.parley.tool_timeout_sec=35',
    '-c', 'analytics.enabled=false',
  ], codexEnv);
  child.stderr.resume();
  const lines = readline.createInterface({ input: child.stdout });
  const pending = new Map();
  let nextId = 1;
  child.on('error', error => { for (const item of pending.values()) item.reject(error); });
  child.on('close', () => { for (const item of pending.values()) item.reject(new Error('Codex app-server exited during validation.')); });
  lines.on('line', line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.id !== undefined && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id); clearTimeout(item.timer);
      if (message.error) item.reject(new Error(`Codex ${item.method} failed: ${message.error.message}`));
      else item.resolve(message.result);
    }
  });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Codex ${method} timed out.`)); }, 40_000);
    pending.set(id, { resolve, reject, timer, method });
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
  });
  try {
    await rpc('initialize', { clientInfo: { name: 'parley-bridge-validation', version: '1' }, capabilities: { experimentalApi: true } });
    child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    const thread = await rpc('thread/start', { cwd: temporary, ephemeral: true, approvalPolicy: 'never', sandbox: 'read-only' });
    const threadId = thread.thread.id;
    let entry;
    const discoveryDeadline = Date.now() + 30_000;
    do {
      const inventory = await rpc('mcpServerStatus/list', { serverName: 'parley', threadId, detail: 'full', limit: 10 });
      entry = inventory.data.find(item => item.name === 'parley');
      if (entry?.runtimeStatus === 'connected' || ['failed', 'disabled', 'authenticationRequired'].includes(entry?.runtimeStatus)) break;
      await sleep(250);
    } while (Date.now() < discoveryDeadline);
    assert.ok(entry, 'Codex discovered Parley.');
    assert.equal(entry.runtimeStatus, 'connected', 'Codex completed the stdio handshake.');
    const listed = Object.keys(entry.tools || {});
    assert.equal(listed.length, 4, 'Codex discovered all four Parley tools.');
    assert.ok(listed.some(name => name.includes('parley_list_rooms')), 'Codex discovered the room tool.');
    const result = await rpc('mcpServer/tool/call', { threadId, server: 'parley', tool: 'parley_list_rooms', arguments: {} });
    assert.ok(!result.isError, 'Codex invoked the authenticated room-list tool.');
    const rooms = JSON.parse(result.content.find(item => item.type === 'text').text);
    assert.ok(Array.isArray(rooms.rooms));
    if (rooms.rooms.length) {
      const { room, conversationId, rosterHash } = rooms.rooms[0];
      const read = await rpc('mcpServer/tool/call', { threadId, server: 'parley', tool: 'parley_read_conversation', arguments: { room, conversationId, rosterHash, limit: 1 } });
      assert.ok(!read.isError, 'Codex read the bound conversation.');
    }
    console.log('Codex CLI: stdio connected, four tools discovered, authenticated list/read succeeded; no model turn.');
  } finally {
    for (const item of pending.values()) clearTimeout(item.timer);
    lines.close(); await stop(child);
  }
  await run('claude', ['mcp', 'add', '--transport', 'stdio', '--scope', 'local', 'parley', '--', process.execPath, adapter, '--credential', args[3]], claudeEnv);
  const health = await run('claude', ['mcp', 'get', 'parley'], claudeEnv);
  assert.match(health, /connected/i, 'Claude completed the stdio MCP health check.');
  console.log('Claude Code CLI: isolated local registration and connected MCP health check succeeded; no model turn.');
} finally {
  await Promise.all([...children].map(stop));
  await fs.rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
