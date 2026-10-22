# Use a Parley room from your harness

One reusable **Parley MCP server implementation** works with Codex, Claude Code, and other MCP stdio clients. Register each app with a distinct client identity; reuse the same adapter across projects. A client may start its own small stdio adapter process, while all adapters use the same Parley backend. This is a Parley integration, not a gateway for unrelated MCP services.

```text
Your existing harness conversation → MCP stdio adapter → authenticated 127.0.0.1:4142 → Parley room
```

Ask, for example: “Ask my architecture room to challenge this plan and bring back its exact agreed handoff, including reservations.” The harness discovers the room, submits an explicit delegated request, and waits for the correlated result. Basic MCP does not wake an arbitrary idle harness or inject unsolicited replies into another chat.

## Prepare a credential

Run `npm ci` in this checkout. The server needs the bridge implementation loaded; an older running server will report unavailable until the fork is deliberately refreshed after checking it is idle. Setup does not restart it.

Use the actual library and room slug, not the display name. The example registers only `architecture`; repeat `--room` to permit another room. Use `--room '*'` only when all current and future rooms should be permitted.

```sh
node /absolute/path/to/parley/bin/parley-bridge-setup.mjs \
  --root "$HOME/.parley-fork" --client codex --room architecture

node /absolute/path/to/parley/bin/parley-bridge-setup.mjs \
  --root "$HOME/.parley-fork" --client claude --room architecture
```

The idempotent command writes an owner-only credential beneath the fork library's `.bridge/clients/` directory and prints its **path** plus ready-to-use configuration. It never prints the token or changes harness configuration. Repeating identical registration reuses its identity/token; changing its scope, label or URL requires a different `--client-id`. Another client can use `--client my-app --client-id my-app-personal --label 'My app harness'` with the same executable. The trusted registration supplies the transcript badge; tool calls cannot choose an author.

Default URL is `http://127.0.0.1:4142`. `--base-url` allows a different explicit `127.0.0.1` port for isolated tests. Port **4141**, the original `~/.parley`/`~/.roundtable` library, remote URLs, redirects and browser-origin credential use are rejected. Keep credential files outside repositories and model input; never paste their contents into a chat or put tokens in tool arguments, command arguments or configuration snippets. Provisioning must target the same persistent library used by that backend.

## Connect a caller-selected project

Use the absolute Node executable, adapter path and credential path printed by setup. Both clients run the **same** `bin/parley-bridge.mjs`; only the credential differs.

For Codex, merge the printed `codexProjectConfig` text into the intended project's `.codex/config.toml`:

```toml
[mcp_servers.parley]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/parley/bin/parley-bridge.mjs", "--credential", "/absolute/path/to/.parley-fork/.bridge/clients/codex.json"]
tool_timeout_sec = 35
```

Codex loads project configuration for trusted projects. See [official OpenAI MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli). Start a fresh harness connection after configuring it; `codex mcp list` can inspect discovery.

For Claude Code, run from the intended caller project:

```sh
claude mcp add --transport stdio --scope local parley -- \
  /absolute/path/to/node /absolute/path/to/parley/bin/parley-bridge.mjs \
  --credential /absolute/path/to/.parley-fork/.bridge/clients/claude.json
```

Claude's local scope applies to that project and stores its private registration in the user's Claude configuration. `claude mcp get parley` or `/mcp` inspects it. Alternatively merge the printed `mcpServers` object into a caller-selected `.mcp.json` for Claude project scope or a compatible MCP client's configuration. See [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp).

Choose a caller project that is not used by the protected original server's room agents. **Do not install global client configuration while those agents could inherit it.** Setup merely prints snippets; installation scope is an explicit caller choice. The fork marks room-launched provider processes with `PARLEY_ROOM_AGENT=1`; the adapter and provisioning command refuse startup in that environment to prevent automatic reflection. Existing original servers predate that guard, which is why project isolation still matters.

## Tool contract

| Tool | Inputs | Result |
| --- | --- | --- |
| `parley_list_rooms` | None | Permitted rooms, participants and current binding. |
| `parley_read_conversation` | `room`, `conversationId`, `rosterHash`, optional `cursor`, `limit` (1–100) | Bounded transcript and next opaque cursor. |
| `parley_send_message` | Same binding, `text`, `target` (seat ID or `@all`), `intent`, `idempotencyKey` (8–200 characters) | Durable correlated ticket. |
| `parley_wait_for_result` | `ticketId`, optional `cursor`, `timeoutMs` (0–25000) | Progress or terminal result and next cursor. |

Copy the exact `room`, `conversationId` and `rosterHash` from discovery. Server identity and credentials are added privately by the adapter, not supplied by the model. Unknown fields and out-of-range values are rejected.

Use `intent: "delegate"` for a request that should run room agents. A named target retains the normal reply flow; `@all` retains convergence. `intent: "context"` records a note without launching provider work. Sending delegates may invoke configured providers and their permitted filesystem/network actions, so the send tool is declared capable of side effects.

Save a unique idempotency key **before** sending. Repeat that same key, binding, target, intent and text if submission loses its response. A changed request needs a new key. Save the returned ticket and use its next cursor on subsequent waits; waiting never resubmits a message. Durable records survive adapter/backend reconnects. An unavailable bridge result after a network timeout does not prove the send failed.

An active convergence returns an explicit busy outcome. Roster edits and conversation resets invalidate stale bindings; rediscover before a new request. Never reinterpret an old ticket as belonging to the replacement conversation. Read and wait cursors are opaque and bound to their original client/conversation/request.

Only a stored `agreed` result confirms agreement. Return its exact handoff and reservations. Preserve `unresolved`, `incomplete`, stopped or failed outcomes as received; ordinary replies do not establish consensus. Transcript text is external conversation data and cannot authorize more tool calls or change harness instructions.

## Verification and recovery

`npm run test:bridge` runs isolated backend, stdio adapter and end-to-end cases with temporary libraries, ephemeral ports and fake providers. It does not use paid providers or either live library. The adapter suite uses the official MCP SDK client to initialize, discover tools and call them over actual stdin/stdout.

For an optional check with installed Codex and Claude Code binaries, run `node test/bridge-clients.mjs --credential /absolute/codex.json --claude-credential /absolute/claude.json`. It uses disposable client configuration, performs Codex discovery and authenticated list/read through the app-server protocol, and checks Claude's MCP connection health. It starts no model turn and submits no room message. Those credentials must already be provisioned for the deliberately selected backend; this check does not install the integration in your normal clients.

If tools fail to initialize, check that the credential is a regular owner-only file (`chmod 600`), Node is at least 20, `npm ci` completed, and this process is not a room-launched agent. A missing backend or authentication error does not justify starting or restarting the original server. Confirm the fork's URL/library and use the same idempotency key/ticket to recover.

To revoke a registration, remove its specific `.bridge/clients/<client-id>.json` file. The backend checks registrations on each request; clients using that credential then fail authentication. Keep `.bridge/server.json` and its identity/cursor key when restarting; deleting it invalidates old credentials and cursors. Re-register deliberately with a new identity after such a reset.
