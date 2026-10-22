#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { provisionBridgeClient } from '../lib/bridge-store.mjs';
import { validateBridgeUrl } from '../lib/bridge-adapter.mjs';

const help = `Usage: parley-bridge-setup --root DIR --client NAME --room ROOM [--room ROOM] [--client-id ID] [--label LABEL] [--base-url http://127.0.0.1:4142]
Registers a durable client credential and prints configuration snippets, never the token.
Use --room '*' only to explicitly permit all rooms. Does not change harness configuration.
The original ~/.parley library and port 4141 are forbidden.`;
try {
  if (process.env.PARLEY_ROOM_AGENT === '1') throw new Error('Bridge setup disabled in room-launched agents.');
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log(help); process.exit(0); }
  const options = { rooms: [] };
  const names = { '--root': 'root', '--client': 'client', '--client-id': 'clientId', '--label': 'label', '--base-url': 'baseUrl' };
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i], value = args[i + 1];
    if (!value || value.startsWith('--') || (flag !== '--room' && !names[flag])) throw new Error(help);
    if (flag === '--room') options.rooms.push(value);
    else {
      if (options[names[flag]] !== undefined) throw new Error(`Duplicate option ${flag}`);
      options[names[flag]] = value;
    }
  }
  if (!options.root || !options.client || !options.rooms.length) throw new Error(help);
  options.root = path.resolve(options.root);
  options.baseUrl = validateBridgeUrl(options.baseUrl ?? 'http://127.0.0.1:4142');
  const { manifestPath } = provisionBridgeClient(options);
  const entrypoint = fileURLToPath(new URL('./parley-bridge.mjs', import.meta.url));
  const command = process.execPath;
  const adapterArgs = [entrypoint, '--credential', manifestPath];
  console.log(JSON.stringify({
    credentialPath: manifestPath,
    configurationOnly: true,
    mcpServers: { parley: { type: 'stdio', command, args: adapterArgs } },
    codexProjectConfig: `[mcp_servers.parley]\ncommand = ${JSON.stringify(command)}\nargs = ${JSON.stringify(adapterArgs)}\ntool_timeout_sec = 35\n`,
    scope: 'Install only in a caller-selected project or isolated client configuration. Do not add global configuration inherited by the protected original server.',
  }, null, 2));
} catch (error) {
  console.error(`Parley bridge setup: ${error.message}`);
  process.exitCode = 1;
}
