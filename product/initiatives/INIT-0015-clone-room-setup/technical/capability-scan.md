---
mode: PRODUCT-DISCOVERY
initiative: INIT-0015
type: technical-assessment
title: Platform capability scan — Clone a room's setup into a new room with an empty chat
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
Initiative: INIT-0015
Scanned: 2026-11-06
Systems scanned: Parley server `parley.mjs`, browser UI `ui/index.html`, `ui/app.js`, `ui/styles.css`, `lib/bridge-backend.mjs`, `lib/claude-auth.mjs`, `bin/parley-link.mjs`, `desktop/main.cjs`, `test/server-fixture.mjs`, `docs/ROOM-BEHAVIOR.md`, at `main` `704039f` (the product branch differs from it only under `product/`; checked with `git diff 704039f -- . ':!product'`, empty). The live room store `~/.parley-fork` was read only: file names, JSON keys, lengths and setting values. No content was read out, nothing was written, and no server was started.

Current state only. This file holds no verdict, no option and no proposal;
those are in [assessment.md](assessment.md). Line numbers are `704039f`.

## Relevant platform capabilities

| Area | Verdict (exists/partial/absent) | Where it lives (source) | Gap, if partial |
| --- | --- | --- | --- |
| Create a room from a name, agents, Goal, Rules, folder and mode | exists | `POST /api/rooms` (`parley.mjs:7790-7842`) → `loadRoom(name, seats, true, {projectDir, mode}, initialBrief)` (`:7840`). UI caller: Create room submit (`ui/app.js:4377-4409`). | Per agent it accepts only id, provider, model, effort, Fast mode and instructions (`parley.mjs:7826-7829`). It does not accept permissions, command, extra args, listening settings or sleep. Of the room settings it accepts only mode and folder. |
| Defaults a new room gets | exists | `defaultConfig` (`parley.mjs:528-552`): hop budget 4, accounting `automatic`, pair rounds 0, timeout 900 s, default agent = first seat. Provider defaults: `:204`, `:257`, `:305`. A new room's config is defaults overlaid shallowly with what the caller gave (`:1859`). | — |
| Input checks at creation | exists | Name: at most 40 characters, starts with a letter or digit, no trailing space (`:1791-1800`). Duplicate: name already loaded or folder exists under the root (`:7794-7796`). Folder must exist (`:7799-7805`). At most four agents, `Rooms support at most four agents.` (`:7809-7810`, `MAX_ROOM_SEATS` `:521`). | Model, effort and instructions are **trimmed**, and instructions are capped at 8,000 (`agentText` `:513-519`, `:352`). That is not "as is" for a hand-edited value. |
| Room Brief at creation | partial | The brief is built by `prepareBrief(emptyBrief(), …)` (`:7798`). It then becomes the new room's brief through the new-room branch of `contextLedger` (`:2111-2131`): no import time, no legacy sessions, no timeline note. | The limits are checked against an **empty** previous brief: "cannot grow beyond max(limit, old length)" (`:2148-2154`). So a Goal over 2,000 or Rules over 8,000 is refused at creation (400). |
| Read a room's full setup without running anything | exists | `GET /api/room/summary` (`:7912-7915`) returns the room's settings minus `roomNote` (`:2809`), each agent's sleep state (`:2827`) and the Room Brief (`contextSummary`, `:2222`). It schedules nothing. | `GET /api/room` returns the same and also **schedules lurk catch-ups** (`:7882-7889`), which can launch an agent in that room. |
| Change permissions, command, extra args, listening and room settings | exists, on an existing room | `POST /api/config` (`:8212` onward). It checks extra args (`:8360`, blocked `--dangerously-*` flags `:812-826`), enums (`:8364-8369`) and accounting (`:8322`), and sets a timeout floor (`:8352`). | Saving can write conversation notes. Examples: the "lurking with Full access" note (`:8598`), pair, mode and permission notes (`:8530-8598`), `Brief updated` (`commitBrief` `:2199-2205`). |
| Sleep an agent | exists, on an existing room | `sleepSeat` (`:6722-6740`) sets `state.agents[id].asleep = {since, reason}` and always appends `😴 {agent} is asleep…` to the conversation. | There is no way to make an agent asleep without a conversation note. |
| Room actions menu | exists | `.rmore` button plus a `.racts` strip with Archive, Rename and Delete (Delete is absent on `default`) (`ui/app.js:3596-3601`). The handler is at `:3603-3618`. Escape or a click elsewhere closes it (`:3622-3628`). In the 264 px sidebar (`ui/styles.css:91-92`) the strip wraps its buttons (`:1773-1775`). | No clone item. |
| Create room dialog (the look to reuse) | exists | `<dialog id="newRoomDialog">` (`ui/index.html:163-195`): title bar with `×`, Agents and Room tabs, Room name (`maxlength=40`), Goal (`maxlength=2000`, required), Rules (`maxlength=8000`), Project folder with `Browse…`, Work-mode checkbox, Cancel and Create room. It opens with `openModalDialog` (`ui/app.js:89-95`). Escape closes it (`:4360`). | **No dialog in Parley closes on a click outside.** There is no backdrop handler in `ui/app.js`. The Goal field's fixed `maxlength=2000` blocks a longer pre-filled Goal once it is edited. Room settings handles a longer saved Goal or Rules with `maxlength = max(limit, saved length)` and the PD-0006 note (`ui/app.js:5036`, `:5072-5073`). |
| Page and server staying on the same build | exists | The server reads the UI files once at startup (`UI_SNAPSHOT` `parley.mjs:36`). Page and API must carry the same `RUNTIME_PROTOCOL`, "16" (`:73`, `:7646`; `ui/app.js:110`, `:129`). Precedent: PRL-1 added the new route `POST /api/context/brief` without changing the protocol (`d2df6fe`). | The new UI reaches 4142 only when the requester restarts it. The desktop app also needs repackaging (`desktop/main.cjs:7-8`, `:46`). |
| Isolated test servers | exists | `test/server-fixture.mjs:14-31`: port 0, its own `--root`, its own HOME, CODEX_HOME and CLAUDE_CONFIG_DIR, a PATH without real CLIs, and the fake provider CLI `test/fake-cli.mjs`. | A bare `node parley.mjs` uses **port 4141 and `~/.parley`** (`parley.mjs:136`, `:139-145`). The desktop app uses **port 4142 and `~/.parley-fork`** (`desktop/main.cjs:7-8`). |
| Copy a room's setup | absent | Nothing in the server, UI, bridge or scripts copies a room. | This is the gap the initiative fills. |

## Check 1 — the real setup values

Per agent (`room.json` → `agents.{id}`; provider defaults at `parley.mjs:204`, `:257`, `:305`):

| PD-0008 item 2 name | Exists? | Where / note |
| --- | --- | --- |
| name | yes | The agent's key (id). Order in the file is the roster order. |
| provider | yes | `provider`. It cannot change after creation (`:8245`, `:8311`). |
| model | yes | Free text, at most 200 characters (`:513-519`). |
| effort | Claude and Codex only | Gemini has no effort (`fields` `:306`). |
| Fast mode (`serviceTier`) | Codex only | `fast` or `default` (`:522-526`). Older Codex agents may lack the key; it loads as `default` (live: `Factory M1` codex). |
| permissions | yes, **per provider** | Claude `permissionMode` (`:204`, enum `:245-251`). Codex `sandbox` (`:257`). **Gemini `approvalMode`** (`:305`, enum `:341-345`) is not in PD-0008's named list. |
| command | yes | `command`. Editable in Room settings (`fields` `:205`, `:258`, `:306`). |
| extraArgs | yes | A list. Blocked flags are refused when saving and again when launching (`:812-830`). |
| instructions | yes | At most 8,000 when entered (`:352`). There is no separate "description" field. |
| lurk, lurkStyle, lurkPrompt | yes | All three in `room.json`. |
| sleep | yes, but **not in `room.json`** | `state.json` → `agents.{id}.asleep` = `null` or `{since, reason}` (`:597-603`, the code says it is a temporary condition, not configuration). Live: both agents of `Factory M1` are asleep with a reason. |

Room-level (`room.json`): `mode`, `hopBudget`, `defaultAgent`, `accounting`, `pairRounds`, `timeoutMs`, `projectDir`. All of PD-0008 item 3's list exists. `projectDir` is the dialog's folder. No other room setting is saved. Two notes:
- `accounting: "exchanges"` is a legacy value. Room settings shows it as "not offered for new selection" (`ui/app.js:4762-4769`), and a new room always gets `automatic`. Live: all four rooms are `automatic`.
- `hopBudget` may be `-1` ("until settled") in older rooms. A new room gets 4. Live: 16, 4, 4 and 4.

Not setup, and where it lives:
- **Discussion mode (Converge/Parallel) and convergence review rounds** are per browser tab (`sessionStorage`, `ui/app.js:56-69`). They are not saved with the room.
- **Retired agent names** are `state.json` → `retiredAgents` (`parley.mjs:568`). This is run state.
- **Last-addressed agent** is `state.json` → `lastAddressed` / `lastAddressedGroup`. This is run state.

## Check 2 — what must not be copied, and where it lives

| Item | Location |
| --- | --- |
| Native sessions and delivery bookkeeping | `state.json` → `agents.{id}`: `sessionRef`, `cursor`, `promptSessionRef`, `staticBlocks`, `briefingFingerprint`, `briefingVersion`, `permissionScope`, `permissionConfigScope`, `roomNoteRevision`, `pendingCatchUp` (live keys; `catchUpState` `:5748`) |
| Pending deliveries, held and cancelled work | `state.json` → `lastUser`, `cancelledDeliveries`, `interruptedResponses`, `resolvedErrors`, `lurkOutcomes`, `relayUsage`. The queue itself is in memory (`room.pending`, `:2069`) |
| Converge and pair state, including approvals | `state.json` → `convergence`, `convergenceHistory` (reviews and approvals, `:5286`), `pair` |
| Bridge identity | `state.json` → `bridgeConversationId`, created lazily when a bridge client asks (`lib/bridge-backend.mjs:23`). Bridge credentials are in `<root>/.bridge/` |
| Handoffs | Agreed handoff entries in `transcript.md` / `events.jsonl`, and the delivered files in `~/.parley-links/<room slug>/<handle>/` |
| `@desktop:` link registrations | Outside the room store: `~/.parley-links/<room slug>/<handle>/`, held by a running `parley-link` process bound to an exact room name (`bin/parley-link.mjs:33-45`, `:69-72`). The server keeps no link registry |
| Conversation and activity | `transcript.md`, `events.jsonl` (including receipts), archived transcripts from `/clear`, `attachments/` |
| Room workspace | `<room>/workspace/` |
| Decisions, active and archived | `context.json` → `roomBrief.decisions` |
| Brief revision and migration markers | `context.json` → `roomBrief.revision`, `updatedAt`, `briefMigration` (`importedAt`, `sessions` = sessions owed the one-time transition line) |
| Context timeline | `context.json` → `events` |
| Legacy recovery copies (PD-0006 item 3) | `room.json` → `roomNote`. `context.json` → `direction`, `decisions` (the old saved brief), `activeBrief`, `briefHistory`, `directionHistory`, `contextHistory`, `editor`, `legacyImportPolicy`, `initializedAt` (live keys) |

## Check 3 — does creating a room start anything?

- `POST /api/rooms` → `loadRoom(create)` creates `<room>/workspace/` (`:1813-1814`) and writes `room.json` (`:1859-1860`), `state.json` with every session empty and every agent awake (`:1884`) and `context.json` (`:2131`). It writes no transcript or events, appends no entry, launches no process and schedules nothing. Session-reset notes (`:2090`) fire only for a saved `sessionRef`, and a new room has none.
- After creation the UI opens the room (`ui/app.js:4408`):
  - `GET /api/room` calls `scheduleCatchUps` (`parley.mjs:7888`). A new room has no `pendingCatchUp`, so nothing launches (`:6096-6099`).
  - `GET /api/doctor` (`ui/app.js:3425`) checks each agent's CLI and **may spawn `claude auth status --json`** (`parley.mjs:2780-2795`, `lib/claude-auth.mjs:8-16`). That is a local CLI check, not an agent turn, and it sends no prompt. It runs on every room open today.
- Creation does not touch the bridge, the runner or `parley-link`.

## Check 4 — Room Brief for the new room

- Limits: Goal 2,000, Rules 8,000, Decision 200. They apply to *growth* over the previous text (`:2148-2154`; PD-0006 item 2). Against an empty previous brief, a copied Goal over 2,000 or Rules over 8,000 is refused. Against the original's saved brief it is accepted unchanged.
- Through the new-room path (`contextLedger` with `newRoom` and an initial brief, `:2116`, `:2128`), the brief gets `briefMigration = {importedAt: null, sessions: []}`. No transition line is ever owed and no timeline note is written.
- `newRoom` is true only if `room.json` did not exist when the room first loads (`:1817`, `:1887`). If a room folder is written before its first load, it takes the **legacy import path** instead (`:2116-2127`). That path sets `importedAt` and takes Rules from `room.json` → `roomNote` if present.
- The live data has no over-limit text today: the largest Goal is 776 characters and the largest Rules 1,425. Rules may mention `@desktop:` handles; that is text only.

## Check 5 — UI reuse

Covered in the capability table above (Room actions menu, Create room dialog,
build pairing). The protocol pairing obliges an additive change to leave old
tabs working; it does not by itself force a protocol bump.

## Check 6 — the test recipe

- The server must be started with an explicit port and `--root`. The defaults hit 4141 and `~/.parley` (`parley.mjs:136-145`). The desktop app and `parley-mine` default to 4142 and `~/.parley-fork` (`desktop/main.cjs:7-8`).
- A copied store keeps each room's real `command` (`claude`, `codex`) and real `projectDir`. Live examples: two rooms are linked to real folders under `/Users/ortega/Desktop/Parlay/`, and two rooms are in Work mode. Sending a message to a clone made from the copy runs the real CLI, with the real login, in that real folder.
- The copy contains `.bridge/` credentials. `~/.parley-links` is shared by room-name slug across every server.
- The repo fixture isolates HOME, PATH and the provider CLI (`test/server-fixture.mjs:14-31`).

## Existing constraints that bind

| Constraint | Source | Applies because |
| --- | --- | --- |
| Never touch or restart 4142; never use 4141; test on an isolated port | `project/constraints.md` #1 | Verification, and the requester restarts 4142 to pick up the change |
| Plain `ui/index.html`, `ui/app.js`, `ui/styles.css`; no build step | `project/constraints.md` #2 | The menu item and dialog |
| 1440 wide, light theme only | `project/constraints.md` #3 | Dialog composition criterion |
| Limits apply to new text from every path, HTTP API included; stored over-limit text is kept | PD-0006 item 2, PD-0003 item 9 | Copied Goal and Rules (PD-0008 items 5, 6) |
| Only the Create room dialog requires a Goal | PD-0003 item 1 | The clone dialog allows an empty Goal (PD-0008 item 5) |
| The old note and direction stay on disk as recovery data, never read again | PD-0006 item 3 | They are in every migrated original and must not reach the clone |
| At most four agents in a new room | `MAX_ROOM_SEATS`, `docs/ROOM-BEHAVIOR.md` "Rosters" | PD-0008 item 14 |

## Product-record notes for the PM

- **CAP-0001** still describes the room note and direction. `main` has the Room Brief (Goal, Rules, Decisions) in `context.json`.
- **CAP-0002** says the setup in `room.json` includes listening settings. That is right, but **sleep is in `state.json`**. CAP-0002 also omits Gemini's approval mode among the permissions.
