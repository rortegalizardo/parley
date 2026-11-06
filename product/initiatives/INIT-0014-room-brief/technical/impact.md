---
mode: PRODUCT-DISCOVERY
initiative: INIT-0014
type: technical-assessment
title: System impact map — Every agent knows the room's goal, rules and decisions from one Room Brief
status: authoritative
revision: 1
owner_role: ROLE-planner
phase_at_assessment: SOLUTION_EXPLORATION
round: 1
assessed_on: 2026-11-06
created: 2026-11-06
updated: 2026-11-06
verdicts: []
constraints: []
questions: []
updated_by_role: ROLE-planner
---

Mode: PRODUCT-DISCOVERY
Initiative: INIT-0014
Mapped: 2026-11-06
Options mapped: A (Room Brief on the Room tab, Direction tab removed), B (Brief tab replaces the Direction tab, Room tab loses its note field)

Altitude: systems, components, obligations, data classes and dependency
direction only. Sources are in [capability-scan.md](capability-scan.md). The
options differ only in the settings surface (rows U1 and U1a). Every other row
is the same in both maps, and is repeated so each map stands alone.

Everything below is one deployable system: the Parley server process, the
browser UI it serves, and its on-disk room store. The model provider CLIs are
the only third-party systems in the path.

## Per option

### Option A — Room Brief on the Room tab

| System / component | Current responsibility (source) | What this option requires of it |
| --- | --- | --- |
| S1 Prompt delivery (Parley server) | Sends the room note and the direction in full on every direct, listener and hop turn, plus one-time cleared, no-note and retired-brief lines (`b6591be`; `parley.mjs:1160-1162`, `:3206-3233`) | Must carry exactly one Room Brief block, composed from the brief saved when the attempt is assembled, in full on every turn of every seat and session state. Must send none of the note or direction blocks, or their cleared or no-note lines. Must send the transition line once to each session that existed before its room was migrated |
| S2 Room store (`room.json`, `context.json`, `state.json`) | Note in `room.json`, direction and old saved brief in `context.json`, session stamps in `state.json` (`parley.mjs:543`, `:2123-2147`, `:1929-1948`) | Must hold one brief per room — Goal, Rules, ordered active Decisions, archived Decisions with archive order — and keep it through `/clear` and `state.json` recovery. Must keep the old saved brief as is |
| S3 Room migration (on load) | Migrates a room's files idempotently when the room loads; rooms load lazily (`parley.mjs:1840-1876`, `:8722-8725`) | Must turn each room's direction goal, pins and note into its brief once, character for character, for live, archived (on restore) and default rooms. Must never reject a room or trim it for an empty Goal or any length. Must leave the old data recoverable (see assessment C-04). Running it again must change nothing |
| S4 Save paths (`/api/context/direction`, `/api/config`, `/api/rooms`) | Direction tab, Pin and Tidy save the whole direction; Room tab and `/note` save the note through the settings save; Create room sets the first note (`parley.mjs:7976-7984`, `:8269-8513`, `:7794-7843`) | Every change to any part must land in the one brief. Per-field limits (PD-0003 item 9) apply to new input only. A Goal must never be required here. Each save that changes something must add one timeline note naming the parts changed |
| S5 Suggestion calls (Pin, Tidy) | One tool-less Claude Sonnet call each over Goal and pins (`parley.mjs:2228-2266`) | Tidy must leave Rules and archived Decisions alone. Active Decisions it drops must be archived when the suggestion is saved. Pin must append one active Decision |
| S6 Conversation system notes | Appends context-only system entries that start no turn (`parley.mjs:2643-2675`, `:2211-2214`) | Must append "Brief updated: …" without starting a turn, from every save path |
| U1 Room settings → Room tab (browser UI) | Holds the note field and six other room settings under one dialog-wide Save that writes `room.json`, closes the dialog, may ask to confirm Full access, and may reset sessions; filled only when Settings opens (`ui/index.html:205-240`; `ui/app.js:4733`, ~4790-4860) | Must host Goal, Rules, Decisions with archive, length guide, merge suggestion, Tidy, "What agents see" and the old saved brief. It must also keep brief edits from being lost or written back stale by the tab's footer Save or Cancel. Today that save model has no live-update protection |
| U1a Room settings → Direction tab | Own Save, Discard and Tidy; draft protected from live updates; pin merges into it (`ui/app.js:4989-5160`) | Removed. Its draft protection has no home unless it moves to the Room tab |
| U2 Create room dialog | "Shared room instructions" field, 8,000 max, sent to `/api/rooms` (`ui/index.html:181`; `ui/app.js:4365`) | Goal (required, in the dialog only) and Rules (optional); the endpoint behind it still accepts an empty Goal |
| U3 Pin dialog | "Pin to room direction", one suggested line, appends to the direction (`ui/index.html:259-261`; `ui/app.js:5124-5160`) | New copy; appends to the brief's active Decisions; merges into unsaved brief edits wherever they live |
| U4 `/note` command | Browser-side command that saves the note through the settings save (`ui/app.js:3908-3912`) | Replaces or clears Rules; the timeline note comes from S4/S6 |

| Dependency | Direction (upstream/downstream) | Kind (internal/third-party/human) | Note |
| --- | --- | --- | --- |
| Delivery change `b6591be` on local `main` | upstream | internal | Landed 2026-11-06, not pushed. All delivery work starts from it |
| Claude, Codex and Gemini CLIs | downstream of S1 | third-party | Receive the brief on stdin every turn; no new flags or capabilities needed |
| Claude CLI running Sonnet for Pin and Tidy | downstream of S5 | third-party | Unchanged dependency; its prompt carries more text as the brief grows |
| Native provider sessions (resumed) | downstream of S1 | third-party | Each resumed turn adds the full brief to the session's history, so the session fills up sooner |
| Live 4142 server and the desktop app on `~/.parley-fork` | downstream of S3 | human/operational | The first real migration runs when the requester restarts 4142. An older packaged desktop build can still open the same store |
| Open browser tabs loaded before a restart | downstream of S4 | human/operational | Keep running the old UI script and send the old save shapes until reloaded |
| MCP bridge, linked sessions and runner | downstream of S6 | internal | Read the conversation, so they see timeline notes (part names only, no brief text) |
| Existing test suites | downstream of S1, S4, U1 | internal | `test/smoke.mjs` (~35 note/direction references) and `test/browser-dialogs.mjs` assert current behaviour |

| Data crossing a boundary | Class | Regime note |
| --- | --- | --- |
| D1 Brief text → provider CLIs → model providers, every turn | personal (possible) | User free text in a local, single-user tool. Same destinations as today's note and direction; only how often and how much changes. No regulated data expected |
| D2 Brief text and one message → Claude Sonnet (Pin, Tidy) | personal (possible) | Unchanged from today |
| D3 Timeline note → conversation → bridge readers | none | Names parts only, never brief text |

### Option B — Brief tab replaces the Direction tab

| System / component | Current responsibility (source) | What this option requires of it |
| --- | --- | --- |
| S1 Prompt delivery (Parley server) | As in Option A | As in Option A: one Room Brief block in full every turn, every seat and state; no note or direction blocks, cleared or no-note lines; transition line once to each pre-migration session |
| S2 Room store | As in Option A | As in Option A |
| S3 Room migration (on load) | As in Option A | As in Option A |
| S4 Save paths | As in Option A | As in Option A. Also, the Room tab's footer Save stops carrying the note. A save without the note must leave Rules unchanged, and a save from an old tab that still carries it must be handled (see assessment R-4) |
| S5 Suggestion calls (Pin, Tidy) | As in Option A | As in Option A |
| S6 Conversation system notes | As in Option A | As in Option A |
| U1 Room settings → Brief tab (was Direction) | Direction tab: own Save, Discard and Tidy, a draft protected from live updates, pin merging into it, old saved brief viewer (`ui/app.js:4989-5160`) | Must host Goal, Rules, Decisions with archive, length guide, merge suggestion, "What agents see" and the old saved brief, keeping the tab's existing own-save and draft-protection model |
| U1a Room settings → Room tab | Note field plus six other room settings under the footer Save (`ui/index.html:205-240`) | Loses the note field and its note text; the other fields are unchanged |
| U2 Create room dialog | As in Option A | As in Option A |
| U3 Pin dialog | As in Option A | As in Option A; merges into the Brief tab's unsaved edits, as it does into the Direction tab today |
| U4 `/note` command | As in Option A | As in Option A |

| Dependency | Direction (upstream/downstream) | Kind (internal/third-party/human) | Note |
| --- | --- | --- | --- |
| Delivery change `b6591be` on local `main` | upstream | internal | As in Option A |
| Claude, Codex and Gemini CLIs | downstream of S1 | third-party | As in Option A |
| Claude CLI running Sonnet for Pin and Tidy | downstream of S5 | third-party | As in Option A |
| Native provider sessions (resumed) | downstream of S1 | third-party | As in Option A |
| Live 4142 server and the desktop app on `~/.parley-fork` | downstream of S3 | human/operational | As in Option A |
| Open browser tabs loaded before a restart | downstream of S4 | human/operational | As in Option A; an old tab's Room tab Save still sends the note |
| MCP bridge, linked sessions and runner | downstream of S6 | internal | As in Option A |
| Existing test suites | downstream of S1, S4, U1 | internal | As in Option A |

| Data crossing a boundary | Class | Regime note |
| --- | --- | --- |
| D1 Brief text → provider CLIs → model providers, every turn | personal (possible) | As in Option A |
| D2 Brief text and one message → Claude Sonnet (Pin, Tidy) | personal (possible) | As in Option A |
| D3 Timeline note → conversation → bridge readers | none | As in Option A |

## Not impacted

| System | Why a reader might expect it | Why it is not impacted |
| --- | --- | --- |
| Per-agent standing instructions | Also standing text in every prompt | Delivered separately in the per-turn prefix (`parley.mjs:1164-1168`); PD-0002 item 2 keeps them separate |
| MCP bridge tools and the runner, as writers | REQ-0001 Behavior 7 and PD-0003 item 1 list them as room-creation paths | They cannot create rooms or set the note (`lib/bridge-adapter.mjs:8-13`; `bin/parley-runner.mjs:59`); they only read the timeline notes (row D3) |
| Convergence | It produces agreed decisions | It never writes the direction or brief (CAP-0001 boundary). Its turns run through the same direct-turn path, so they get the brief with no change of their own (`parley.mjs:5367`, `:3483-3484`) |
| Standing-contract template | Fresh sessions get a briefing | The template mentions neither the note nor the direction (`parley.mjs:1079-1110`) |
| Upstream install (port 4141, `~/.parley`) | Same product | Separate root and port (`parley.mjs:136-145`); never touched |
| Provider adapters' flags and transport | Larger prompts | Prompts already go on stdin (`parley.mjs:966-1000`); nothing in the adapters changes |
| Attachments, accounting, hop budget, sleep | Run on every turn | They do not read or write the note or direction |
| Old saved brief | Part of the same ledger | Kept as is and still never sent (PD-0003 item 10); only its copy changes |
