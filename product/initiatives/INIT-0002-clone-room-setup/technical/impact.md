---
mode: PRODUCT-DISCOVERY
initiative: INIT-0002
type: technical-assessment
title: System impact map — Clone a room's setup into a new room with an empty chat
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
Initiative: INIT-0002
Mapped: 2026-11-06
Options mapped:
- A — Server-side clone: a new server action builds the room from the original's saved setup.
- B — Browser-assembled clone: the browser reads the setup and posts it to an extended `POST /api/rooms`.

Altitude: systems, components, obligations, data classes and dependency
direction only. Sources are in [capability-scan.md](capability-scan.md).

Everything below is **one deployable system**: the Parley server process, the
browser UI it serves, and its on-disk room store. The UI is read once at server
startup, so page and server always ship together. No third-party system is in
the creation path. Provider CLIs run only on a later user message, as today.

## Rows shared by both options

| System / component | Current responsibility (source) | What both options require of it |
| --- | --- | --- |
| U1 Room actions menu (UI) | Archive, Rename, Delete per row (`ui/app.js:3596-3618`) | Must offer `Clone room setup…` on every active row, `default` included, and not on archived rows. The strip already wraps in the 264 px sidebar. |
| U2 Clone dialog (UI) | None. Create room is the look to reuse (`ui/index.html:163-195`) | Must pre-fill the name, Goal and folder from the original **without activating it**: no catch-up scheduling, as `GET /api/room` does. Must keep a pre-filled Goal over 2,000 unchanged, which the Create room Goal field cannot do and Room settings can. Must close on a click outside, which no Parley dialog does today. Must surface Create room's name, duplicate, folder and four-agent messages. |
| S1 Room creation (server) | `POST /api/rooms` → `loadRoom(create)` (`parley.mjs:7790-7842`, `:1805-2092`) | Must produce a room whose setup equals the original's. Its brief must be a *new-room* brief: no import marker, no owed transition lines, no timeline note. It must have no conversation entries, every session empty, and no runtime state other than each agent's sleep. Nothing may launch. |
| S2 Run state (server, `state.json`) | Sessions, cursors, pending work, Converge, pair, bridge identity, retired names, **sleep** (`:562-610`) | Exactly one field per agent, asleep or awake, carries over. Every other run-state field must start empty. Sleep must be set **without** the `😴 … is asleep` note that the only existing sleep path writes (`:6722-6740`). |
| D1 Original room files | `room.json`, `state.json`, `context.json`, `transcript.md`, `events.jsonl`, `workspace/`, `attachments/` | Read only. Byte-identical across Create. |
| D2 Legacy recovery data | `room.json` `roomNote`; `context.json` `direction`, `decisions`, `activeBrief`, histories (PD-0006 item 3) | Must not reach the clone, in whole or in part. |
| D3 Out-of-store link state | `~/.parley-links/<room slug>/…`, `<root>/.bridge/` | Untouched. The clone has no link and no bridge identity until one is made for it. |
| V1 Verification harness | Isolated fixture (`test/server-fixture.mjs`); default ports 4141 and 4142 (`parley.mjs:136-145`, `desktop/main.cjs:7-8`) | The one check runs on an explicit free port with an explicit copied root. It does not reach real project folders or spend real provider calls unintentionally. |

## Per option

### Option A — server-side clone

| System / component | Current responsibility (source) | What this option requires of it |
| --- | --- | --- |
| S1a New server action | None | A new authenticated action takes the source room, name, Goal and folder. It reads the original's setup **at that moment** and builds the room from a fixed list of setup values, never a file copy. It applies Create room's name, duplicate, folder and four-agent checks. It checks Goal and Rules length against the original's saved brief, so stored over-limit text is kept and only growth is refused (PD-0006 item 2). Additive: Create room, `POST /api/rooms` and their test callers are unchanged. |
| U2a Dialog data | — | Sends only the source room, name, Goal and folder. |
| Contract | — | One new contract with one consumer: this system's own UI. |

### Option B — browser-assembled clone

| System / component | Current responsibility (source) | What this option requires of it |
| --- | --- | --- |
| S1b `POST /api/rooms` extended | Accepts name, seats (id, provider, model, effort, Fast mode, instructions), Goal, Rules, folder, mode (`parley.mjs:7790-7829`) | Must also accept, per agent: permissions (Claude, Codex and Gemini), command, extra args, listening settings and sleep. At room level it must accept hop budget, default agent, accounting, pair rounds and timeout. Must store values **untrimmed** and above today's instruction cap when they are copies. Must accept a Goal or Rules over the limit **only** if it equals the source room's saved text; otherwise any API caller could skip the PD-0006 item 2 limits. That means the server must also read the source room. Today's Create room behaviour (trimming, limits, new-room defaults) must stay as is for non-clone calls. |
| U2b Dialog data | — | Reads the full setup through the existing read-only summary (`GET /api/room/summary`). It must re-read when Create is pressed to approximate PD-0008 item 12, then post every value. |
| Contract | `POST /api/rooms` consumers: Create room (`ui/app.js:4398`) and 188 references in 14 repo test files (for example `test/smoke.mjs`, `convergence.mjs`, `roster-edit.mjs`) | The existing contract widens. Every consumer is in this repo. The list of setup fields is kept in two places: the browser that assembles it and the server that validates it. |

## Data classes

| Data | Class | Systems | Note |
| --- | --- | --- | --- |
| Agent permissions (Claude permission mode, Codex sandbox, Gemini approval mode), room mode, project folder | security-relevant configuration (not personal, financial or regulated) | S1, S2, U2 | A clone of a Work room on a real folder is, from its first message, a Work room on that folder with the same permissions. No confirmation is asked, the same as Create room's "Start in Work mode" today. Every one of these can already be set on any room through `POST /api/config` with the same page token. Neither option adds a privilege. |
| Provider command and extra args | security-relevant configuration | S1, S2 | `command` chooses the executable that runs on the next turn. Blocked flags are re-checked at launch (`parley.mjs:827-830`), so a copied value cannot get past that check. |
| Room Brief Goal and Rules, agent instructions | user-authored text (may name local paths and `@desktop:` handles) | S1, U2 | Copied verbatim. A handle in Rules stays text. |
| Room store copy used for verification | local user data (no `personal`/`financial`/`regulated` row; single-user local tool) | V1 | Copied, never written in place. Contains `.bridge/` credentials. |

No row is `personal`, `financial` or `regulated`.

## Dependency direction

- UI → server, through the page-token API. Under A the UI depends on one new action. Under B it depends on the widened `POST /api/rooms` and on the summary read.
- Server → room store: it reads the original and writes only the new room's folder.
- Nothing calls the bridge, runner, `parley-link` or a provider CLI at creation. After creation, the UI's room-open health check may run `claude auth status` (`lib/claude-auth.mjs:8-16`), as it does for every room today.
- Sequencing: engineering starts from `main` ≥ `704039f`. The change reaches the requester when he restarts 4142 and repackages the desktop app. No order between components is forced beyond the usual rule that the server and UI ship together.
