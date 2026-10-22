#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { createBridgeAdapter, readBridgeCredential } from '../lib/bridge-adapter.mjs';

if (process.argv.includes('--help')) {
  console.error('Usage: parley-bridge --credential /absolute/path/to/client.json\nShared MCP stdio adapter for Codex, Claude, and compatible clients. Never pass a token on the command line.');
  process.exit(0);
}
try {
  if (process.env.PARLEY_ROOM_AGENT === '1') throw new Error('Bridge disabled in room-launched agents to prevent reflection loops.');
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--credential' || !path.isAbsolute(args[1])) throw new Error('Usage: parley-bridge --credential /absolute/path/to/client.json');
  const credential = await readBridgeCredential(args[1]);
  const server = createBridgeAdapter(credential);
  await server.connect(new StdioServerTransport());
} catch (error) {
  // Startup diagnostics use stderr only; credentials are never printed.
  console.error(`Parley bridge: ${error.code === 'ENOENT' ? 'Credential file not found.' : error.code === 'ELOOP' ? 'Credential symlinks are forbidden.' : error.message}`);
  process.exitCode = 1;
}
