# Use a Parley room from your harness

One reusable **Parley MCP server implementation** works with Codex, Claude Code, and other MCP stdio clients. Register each app with a distinct client identity; reuse the same adapter across projects. A client may start its own small stdio adapter process, while all adapters use the same Parley backend. This is a Parley integration, not a gateway for unrelated MCP services.

```text
Your existing harness conversation → MCP stdio adapter → authenticated 127.0.0.1:4142 → Parley room
```

Ask, for example: “Ask my architecture room to challenge this plan and bring back its exact agreed handoff, including reservations.” The harness discovers the room, submits an explicit delegated request, and waits for the correlated result. Basic MCP does not wake an arbitrary idle harness or inject unsolicited replies into another chat. For the room-to-session direction, see [Room → session links](#room--session-links).

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

## Connect a harness

Use the absolute Node executable, adapter path and credential path printed by setup. Both clients run the **same** `bin/parley-bridge.mjs`; only the credential differs.

For Codex, merge the printed `codexProjectConfig` text into the intended project's `.codex/config.toml`:

```toml
[mcp_servers.parley]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/parley/bin/parley-bridge.mjs", "--credential", "/absolute/path/to/.parley-fork/.bridge/clients/codex.json"]
tool_timeout_sec = 35
```

Codex loads project configuration for trusted projects. See [official OpenAI MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli). Start a fresh harness connection after configuring it; `codex mcp list` can inspect discovery.

For a reusable installation across projects, merge the same section into the user's `~/.codex/config.toml` instead. For Claude Code, use `--scope user` in the command below instead of `--scope local`.

For Claude Code, run from the intended caller project:

```sh
claude mcp add --transport stdio --scope local parley -- \
  /absolute/path/to/node /absolute/path/to/parley/bin/parley-bridge.mjs \
  --credential /absolute/path/to/.parley-fork/.bridge/clients/claude.json
```

Claude's local scope applies to that project and stores its private registration in the user's Claude configuration. `claude mcp get parley` or `/mcp` inspects it. Alternatively merge the printed `mcpServers` object into a caller-selected `.mcp.json` for Claude project scope or a compatible MCP client's configuration. See [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp).

Setup merely prints snippets; installation scope is an explicit caller choice. The adapter checks `PARLEY_ROOM_AGENT=1` and inspects local ancestor process metadata before opening its credential. Node ancestors running the original `parley`/`roundtable` entrypoint or the fork's `parley-mine` entrypoint suppress all tools, including for older original servers without the environment marker. Suppressed adapters initialize with an empty tool list and reject direct calls without reading credentials or contacting a backend. Failed or unsupported ancestry inspection also suppresses tools; this check currently supports macOS and Linux. It does not contact, signal or reconfigure the original server. Provisioning still refuses startup under the room marker. This guard covers normal provider subprocess inheritance; it is not a security boundary against a same-user process deliberately evading its ancestry.

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

## Room → session links

`bin/parley-link.mjs` lets a room hand results to a linked harness session, so the user does not relay them by hand. It is a client of the same bridge API (no server change, no restart) and reuses a Claude or Codex client credential.

```text
node bin/parley-link.mjs --room "<room>" --as <handle> [--accept-new] [--until-delivery]
```

- In the room, a request that mentions `@desktop:<handle>` is tracked. `@desktop:` never matches a seat, so routing ignores it.
- Delivered: the **agreed** Converge handoff for that request (or any agreed handoff whose text names the handle), and each agent reply to it (one named agent, or every reply of a Parallel `@all`). Unresolved or incomplete runs are not delivered.
- Each delivery is written to `~/.parley-links/<room>/<handle>/<n>.md` (owner-only) and announced as one line: `PARLEY_DELIVERY room="…" n=… to=@desktop:<handle> kind=handoff|reply file=…`. The session reads only that file, never the transcript, so it does not take on the room's context.
- `--until-delivery` exits after a delivery, so a background shell (Claude Code `run_in_background`) wakes the session once; relaunch it to keep listening. Saved state means nothing is missed or repeated between launches. Without the flag it prints one line per delivery forever (for a line watcher).
- A new link starts from now; history is never delivered. One link per room and handle (`link.pid` lock). It refuses to run inside room-launched agents.
- `--accept-new` also accepts `@desktop:new`, for a hub session that proposes a fresh session with the handoff as its brief. Not needed on 4142: the runner below starts fresh sessions itself. Do not run both, or each `@desktop:new` is handled twice.
- Errors print `PARLEY_LINK_ERROR "…"` once per distinct problem; credential, scope and server-identity errors end an `--until-delivery` run with exit code 1.

### Fresh sessions (`@desktop:new`)

`bin/parley-runner.mjs` starts a fresh, context-free Claude Code run for a room, with no click. `parley-mine` starts it with the server (`--no-runner` turns it off) and it stops with the server.

- Trigger: a message from the user, an agent or an agreed handoff with a line that is just `@desktop:new` (bold or backticks allowed). A mention mid-sentence does nothing. History before the runner started never triggers.
- The message must have a `Folder: <path>` line, a directory inside the home folder (`~` allowed). An optional `Title:` line names the run. A missing or bad folder gets a "not started" note instead.
- It runs `claude -p --permission-mode auto --output-format json -n <title>` in that folder, detached, with the message (minus the trigger line) as the prompt and no Claude Code or Parley variables from the server's environment.
- The room gets a context note when it starts and another with the final message, cost and a `claude --resume <id>` line when it ends. Notes never start room agents; a busy room gets them once it is free.
- Runs outlive a server restart and are reported by the next runner. State and outputs: `~/.parley-links/_runner/` (owner-only). It reads the root's `claude` bridge credential and refuses to run inside room agents.

The global Claude Code skill `parley-link` (`~/.claude/skills/parley-link/SKILL.md`) describes the session side: linking, acting within the user's permission, reporting back with an `intent: "context"` note, and stopping the link.

## Verification and recovery

`npm run test:bridge` runs isolated backend, stdio adapter and end-to-end cases with temporary libraries, ephemeral ports and fake providers. It does not use paid providers or either live library. The adapter suite uses the official MCP SDK client to initialize, discover tools and call them over actual stdin/stdout.

For an optional check with installed Codex and Claude Code binaries, run `node test/bridge-clients.mjs --credential /absolute/codex.json --claude-credential /absolute/claude.json`. It uses disposable client configuration, performs Codex discovery and authenticated list/read through the app-server protocol, and checks Claude's MCP connection health. It starts no model turn and submits no room message. Those credentials must already be provisioned for the deliberately selected backend; this check does not install the integration in your normal clients.

If tools fail to initialize, check that the credential is a regular owner-only file (`chmod 600`), Node is at least 20, `npm ci` completed, and this process is not a room-launched agent. A missing backend or authentication error does not justify starting or restarting the original server. Confirm the fork's URL/library and use the same idempotency key/ticket to recover.

To revoke a registration, remove its specific `.bridge/clients/<client-id>.json` file. The backend checks registrations on each request; clients using that credential then fail authentication. Keep `.bridge/server.json` and its identity/cursor key when restarting; deleting it invalidates old credentials and cursors. Re-register deliberately with a new identity after such a reset.
