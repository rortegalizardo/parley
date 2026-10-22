# Harness → Parley bridge

Status: implemented and verified on 2026-10-22 following user approval. The original proposal below is retained as the design record. See [setup](HARNESS-BRIDGE.md) and [verification](HARNESS-BRIDGE-VERIFICATION.md) for delivered behavior and installation status.

## Outcome

From an existing Codex or Claude Code conversation, ask a named Parley room for input and receive its response in that same harness conversation. No copying messages between apps and no extra room agent required.

Example: “Ask my architecture room to challenge this plan, then bring back the agreed handoff.” The harness sends the plan to `@all`; Parley runs its normal convergence; the tool returns the exact agreed handoff, including reservations. If participants cannot agree, it returns the actual unresolved or incomplete status.

## Recommended approach

Build one local MCP server used by both clients:

```text
Codex or Claude Code → MCP over stdio → Parley bridge → authenticated localhost:4142
```

Both [Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) and [Claude Code](https://code.claude.com/docs/en/mcp) support local stdio MCP servers. This uses the existing CLI-backed room agents; it does not require replacing them with API integrations.

Parley already has room discovery, transcript reads, message submission and SSE events in `parley.mjs`. The bridge should expose a small supported contract over that machinery, rather than scrape the UI or drive the agents’ native sessions directly.

| Proposed tool | Behavior |
| --- | --- |
| `parley_list_rooms` | List permitted rooms and their named participants. |
| `parley_read_conversation` | Read bounded new messages using an opaque cursor. |
| `parley_send_message` | Send to a named seat or `@all`; return a durable request ticket. |
| `parley_wait_for_result` | Wait up to 25 seconds for progress or completion; return a cursor for the next wait. |

The bridge binds to a specific server instance, room and persisted conversation identity. A room name alone is insufficient because “New conversation” can replace the transcript. Target `@all` retains convergence by default; individual targets retain ordinary replies.

## Identity and safe delivery

- Display a distinct **Codex harness** or **Claude harness** sender in the transcript. Do not impersonate the human or an existing room participant. The credential identifies the client; the model cannot supply an arbitrary trusted author.
- Separate an explicitly delegated request from a context-only note. Room responses remain tool-result content, not higher-priority harness instructions.
- Add durable request IDs and idempotency keys. Retrying after a disconnect must not create duplicate messages or duplicate provider work. Correlate the result to its request, not simply the newest transcript entry.
- Preserve existing queue, permission and convergence rules. An active agreement run reports busy; it must not silently absorb a different request while retaining stale votes.
- Invalidate stale conversation bindings after a reset. Validate targets against the current roster. Historical replies keep their original identities after roster changes.
- Issue a narrowly scoped local bridge credential with user-only file permissions. Keep it outside model-visible arguments/results. Preserve Host, Origin and protocol protections; do not use HTML token scraping as a permanent integration API.
- Reconnect after a restart using durable tickets/cursors. Never claim agreement unless the stored convergence result confirms it.
- Bind this fork’s bridge explicitly to **4142** and its separate library. Reject **4141**. No public tunnel, original-library writes or original-session migration.
- Prevent reflection loops: carry request provenance and configure access so room-launched agents cannot automatically send a received message back into the same room through inherited harness tools.

## First release boundary

The harness initiates a send, waits, and receives the result in its current conversation. Basic MCP does not by itself wake an arbitrary idle harness or inject unsolicited messages into another chat. That would require a separate client-specific integration.

No bridge has been configured in either client yet. Implement a supported backend contract, stdio adapter, setup commands and tests together. Avoid a temporary shell recipe that depends on a rotating browser token.

## Acceptance criteria

1. Both clients can discover a permitted room, address one named agent, and receive the correlated response.
2. An `@all` request returns one exact agreed handoff, or truthful unresolved/incomplete status with reservations preserved.
3. Retry, disconnect and restart do not duplicate submission or completed provider calls.
4. Busy convergence, changed rosters and reset conversations produce explicit safe outcomes.
5. Transcript sender badges distinguish the external harness from the human and room seats; forged identities and unscoped access are rejected.
6. Tests use isolated libraries and fake providers; the actual fork UI is validated on 4142. Port 4141 and its library remain untouched.

Implementation ownership: delegate coding to **gpt-6.1-sol**; the primary agent validates the implementation, isolation and actual UI. Merge completed authorized changes into the fork rather than leaving a new PR awaiting the user.
