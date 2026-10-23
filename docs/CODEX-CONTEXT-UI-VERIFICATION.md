# Codex context and workspace UI verification

Date: 2026-10-23. Implementation: Sol 6.1. Validation: primary agent.

## Scope and isolation

Verified the running fork at http://127.0.0.1:4142. No request, signal, configuration change or library access targeted 4141. The fork was refreshed only after ownership and idle-state checks. SHA-256 comparisons of all eight original default/Test 4 configuration, state, transcript and event files remained identical. Final served JS/CSS exactly match this checkout (asset version `ef2b80c555e6e84735d7`).

## Native Codex compaction: passed

The disposable room `QA Native Codex Context` used the installed Codex 0.162.1, one gpt-6-luna seat, low effort, read-only mode, no automatic follow-ups and a room-only compaction threshold of 8192. No global harness configuration changed.

Two bounded real provider calls used harmless synthetic input and no tools. The first answered `QA_READY`. The next request produced a confirmed compaction at `2026-10-23T08:06:44.820Z`, then correctly recalled the independent saved decision as `CSV; local.`

The primary agent independently matched the UI/API event to the exact disposable native session's persisted `compacted` checkpoint (ordinal 19), checking the session metadata identity and timestamp. No other session contents were read. The Context tab displayed the saved decision, observation status and confirmed event. The room was archived after becoming idle; its evidence remains recoverable through Archived rooms.

Observation reads only a matched native session. Missing, ephemeral or inaccessible logs show unavailable status. It does not guess context percentages or infer compaction from token usage. See [provider behavior](ROOM-BEHAVIOR.md) for implementation evidence and limitations.

## UI checks: passed

- Top header has room title at left and settings gear at right; a separate agent-widget row shows configuration and listening/sleep controls. Home hides room-only controls.
- Create dialog at 1280×720 stayed exactly 760×692, x260/y14, when switching Room, Claude and Codex/Fast mode. Narrow 630×576 stayed 594×548 with the footer visible. Overflow stays inside the body.
- Settings stayed 820×692 on desktop and 602×548 at narrow width across Agents, Room and Context. Saved decisions and context history are styled in their own tab.
- Work mode help is a small muted explanation within the toggle card.
- Composer controls measure 36×36 with 20px SVG icons; text uses 14px font/22px line height. Initial input height is 36px.
- New widget sleep/wake controls exercised against isolated fake providers. Actual Test 4 navigation and bottom-follow position checked without sending user-room messages or changing its settings.
- Browser error logs empty on final actual 4142 check. Syntax checks and git diff whitespace check passed.

The focused `test/codex-context.mjs` functional check passed with isolated temporary provider logs, covering explicit checkpoints, partial writes, replay exclusion, deduplication, resume/restart, missing/ephemeral logs and stale sessions. No broad unit-test suite was added or run for the CSS work.

## Local screenshot evidence

Screenshots are local to the user's workspace, not uploaded into the public fork:

- [Actual Codex compaction and saved decision](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/codex-compaction-4142.png)
- [Toolbar and agent widgets](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/toolbar-widgets-4142.png)
- [Stable Create room dialog](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/stable-create-room-4142.png)

The isolated QA server was stopped after verification. The live fork remains available on 4142.
