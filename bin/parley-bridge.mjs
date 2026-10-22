#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { createBridgeAdapter, createDisabledBridgeAdapter, readBridgeCredential } from '../lib/bridge-adapter.mjs';
import { bridgeContextAllowed } from '../lib/bridge-context.mjs';

if (process.argv.includes('--help')) {
  console.error('Usage: parley-bridge --credential /absolute/path/to/client.json\nShared MCP stdio adapter for Codex, Claude, and compatible clients. Never pass a token on the command line.');
  process.exit(0);
}
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--credential' || !path.isAbsolute(args[1])) throw new Error('Usage: parley-bridge --credential /absolute/path/to/client.json');
  // Disabled contexts initialize with no tools, without opening the credential.
  const server = await bridgeContextAllowed()
    ? createBridgeAdapter(await readBridgeCredential(args[1]))
    : createDisabledBridgeAdapter();
  await server.connect(new StdioServerTransport());
} catch (error) {
  // Startup diagnostics use stderr only; credentials are never printed.
  console.error(`Parley bridge: ${error.code === 'ENOENT' ? 'Credential file not found.' : error.code === 'ELOOP' ? 'Credential symlinks are forbidden.' : error.message}`);
  process.exitCode = 1;
}
