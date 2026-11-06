---
mode: PRODUCT-DISCOVERY
initiative: INIT-0015
type: technical-assessment
title: Technical assessment — Clone a room's setup into a new room with an empty chat
status: authoritative
revision: 1
owner_role: ROLE-planner
phase_at_assessment: SOLUTION_EXPLORATION
round: 1
assessed_on: 2026-11-06
created: 2026-11-06
updated: 2026-11-06
verdicts: ["A: feasible-with-constraints (multi-component)", "B: feasible-with-constraints (multi-component)"]
constraints: [C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13]
questions: []
updated_by_role: ROLE-planner
---

Mode: PRODUCT-DISCOVERY
Initiative: INIT-0015
Phase at assessment: SOLUTION_EXPLORATION
Assessed: 2026-11-06
Round: 1

Evidence: [capability-scan.md](capability-scan.md) (what exists, with sources)
and [impact.md](impact.md) (rows U1-U2, S1-S2, D1-D3, V1, and the per-option
rows). No `Q-` file was written, because this dispatch allowed only these three files.
Every conflict below is a clarification of PD-0008. None changes the
requester's outcome, so each is listed for a PM `PD-` amendment, not as a
requester question.

## Verdicts

| Option | Requirements served | Verdict | Complexity band | One-line basis |
| --- | --- | --- | --- | --- |
| A — Server-side clone | REQ-0004 (all PD-0008 items) | feasible-with-constraints | multi-component | One system: menu, dialog, one new server action, room store. One new contract, and its only consumer is this system's own UI. The server already holds the original's setup and saved brief, so it can (1) read the setup at the moment of Create (item 12) and (2) keep over-limit Goal and Rules by checking them against the original's saved text (items 5, 6; PD-0006 item 2). Create room is untouched. |
| B — Browser-assembled clone | REQ-0004 (all PD-0008 items) | feasible-with-constraints | multi-component | Same system and band. It works only if the widened `POST /api/rooms` also reads the source room to verify over-limit text (C-09). Otherwise it opens a path around the PD-0006 item 2 limits for every API caller (conflict PC-02). Item 12 is met only approximately (C-10). The list of setup fields lives in two places. Create room's contract and its 188 test references widen. |

Architect's recommendation: **A**. Under B the server must read the source room
anyway (C-09), and B still leaves a stale-snapshot window, two copies of the
field list, and a wider Create room contract. The choice is the PM's.

## Constraints

| # | Option | Constraint | permanent / initiative-local | Source | PD- candidate? |
| --- | --- | --- | --- | --- | --- |
| C-01 | A, B | Every copied value, sleep included, must be in place when the room is created. Today's paths for setting them on an existing room write conversation notes: the sleep note, the "lurking with Full access" note, pair, mode and permission notes, and `Brief updated`. "Create, then configure" therefore breaks PD-0008 item 13's empty conversation. | initiative-local | `parley.mjs:6722-6740`, `:8530-8598`, `:2199-2205` | No |
| C-02 | A, B | Sleep is **run state** (`state.json`), not setup (`room.json`). Copying it means carrying exactly one run-state field per agent while every other run-state field starts empty. Those fields are sessions, cursors, pending catch-ups, held, cancelled and interrupted work, Converge and pair state, bridge identity, retired names and last-addressed. | permanent | `parley.mjs:562-610` (comment at `:597-603`) | Yes — "run state is never copied between rooms; sleep is the one exception, by PD-0008 item 2" |
| C-03 | A, B | The clone's brief must be made through the **new-room** path: no import time, no owed transition lines, a fresh revision, no timeline note. A room folder written before its first load takes the legacy import path instead. That path stamps a migration and reads Rules from any `roomNote` present. | initiative-local | `parley.mjs:1817`, `:1887`, `:2111-2131` | No |
| C-04 | A, B | The copy must be a fixed list of setup values: per-agent provider fields, the six room settings, Goal and Rules. It must never be a copy of files or folders. Never copied: `room.json` `roomNote`; all of `state.json` except sleep; all of `context.json` except Goal and Rules; transcript, events, attachments, archived transcripts, `workspace/`; `~/.parley-links/…`; `.bridge/`. | initiative-local | capability-scan Check 2 | No |
| C-05 | A, B | Reading the original, for the dialog pre-fill or at Create, must not activate it or write to it. `GET /api/room` schedules the original's lurk catch-ups and can launch an agent there. The read-only summary exists. | initiative-local | `parley.mjs:7882-7889`, `:7912-7915` | No |
| C-06 | A, B | The clone path must apply Create room's checks with the same messages. Those are the name rules, duplicate name (by folder existence, so case-insensitive on macOS), folder exists, and at most four agents (`Rooms support at most four agents.`). | initiative-local | `parley.mjs:1791-1800`, `:7794-7810`, `:521` | No |
| C-07 | A, B | The change must leave an already open older tab working (same `RUNTIME_PROTOCOL`, additive only) or bump the protocol. The page and server are one build (UI read at startup). It reaches the requester only when he restarts 4142 and repackages the desktop app; engineering never restarts 4142. | initiative-local | `parley.mjs:36`, `:73`; `d2df6fe` precedent; `desktop/main.cjs:7-8`; constraints #1 | No |
| C-08 | A, B | The dialog's Goal field must keep a pre-filled Goal over 2,000 unchanged and must not block Create on it. Create room's Goal field has a fixed `maxlength=2000`. Room settings' Brief tab already handles this with `max(limit, saved length)` and the PD-0006 note. | initiative-local | `ui/index.html` (`newRoomGoal`); `ui/app.js:5036`, `:5072` | No |
| C-09 | B | Under B, a Goal over 2,000 or Rules over 8,000 posted by the browser can be accepted only if the server checks it against the **source room's saved text** at that moment. Otherwise `POST /api/rooms` becomes a way around the limits for any caller, against PD-0006 item 2. So B's server must read the source room too. | permanent | PD-0006 item 2; `parley.mjs:2148-2154`, `:7798` | Yes — "over-limit text enters a room only as a verified copy of text already stored; never from client input alone" |
| C-10 | B | PD-0008 item 12 ("as saved at the moment `Create room` is pressed") is met only approximately. The browser's snapshot is taken before its post, so a change saved to the original in between is missed. Only the server can read the setup at the moment it creates the room. | initiative-local | PD-0008 item 12; impact row U2b | No |
| C-11 | B | Values must be stored as is. Today `POST /api/rooms` trims model, effort and instructions and caps instructions at 8,000. The widened endpoint must skip that for copies and keep it for ordinary Create room calls. | initiative-local | `parley.mjs:513-519`, `:7826-7829`, `:352` | No |
| C-12 | A, B | Verification must start the server with an explicit free port and an explicit `--root` pointing at a **copy** of `~/.parley-fork`. A bare start uses 4141 and `~/.parley`, and the desktop app and `parley-mine` use 4142 and `~/.parley-fork`. Do not launch the desktop app or `parley-link` during the check. | permanent | `parley.mjs:136-145`; `desktop/main.cjs:7-8`; constraints #1 | No — already covered by constraints #1 |
| C-13 | A, B | REQ-0004's "send that agent a message" check, on a clone made from a copied store, runs the real `claude`/`codex` CLI with the real login, in the original's real project folder. Two live rooms point at folders under `/Users/ortega/Desktop/Parlay/`, and two rooms are in Work mode. The check must change the clone's folder to a scratch folder, or use the repo's fake provider with isolated HOME and PATH, or both. It must pick an agent that is awake: a message to a sleeping one is held, not run. | initiative-local | `test/server-fixture.mjs:14-31`; capability-scan Check 6 | No |

## Architectural risks

| # | Option | Risk | What it threatens | What would resolve it |
| --- | --- | --- | --- | --- |
| R-01 | A | A server-side copy that takes files or whole objects instead of the C-04 list would carry `sessionRef` (the clone would **resume the original's native session**), `pendingCatchUp` (the first open would launch a catch-up), `bridgeConversationId`, or `roomNote`. | PD-0007 items 3, 5; "starts no agents"; independence | C-04 as an obligation. The one check reads the clone's `state.json` and `context.json` and confirms every session is empty, nothing is pending, and no legacy field is present. |
| R-02 | B | The setup field list is duplicated in the browser (assembles) and the server (accepts). A provider field added later would be silently left out of clones. | PD-0008 item 2 "nothing is left out" | Keep the list in one server-side place (A), or share one definition. |
| R-03 | A, B | Opening the original for the first time since a server start can rewrite it during load (state normalization, `parley.mjs:1918-1983`, `:2035`). If the "before" copy of the original is taken before that first load, the byte-identical check fails even though cloning wrote nothing. | REQ-0004 AC "byte-identical" | Take the "before" copy after the dialog has read the original, or read without a load. |
| R-04 | A, B | The pre-filled "first free" name is computed from exact names. The server's duplicate check is case-insensitive on macOS (folder existence), so `R copy` can be refused when `r copy` exists. | PD-0008 item 4 pre-fill is always valid | Compare names case-insensitively when choosing the pre-fill; the duplicate message still covers the rest. |
| R-05 | A, B | The original is busy while cloning (PD-0008 item 12). The server is single-threaded, so one read of a loaded room's settings is consistent. Under B the browser's two calls are not. | PD-0008 item 12 | Under A, read once on the server; under B, accept C-10. |

## Security / data / compliance implications

| Option | Data class | Implication | Source row in impact.md |
| --- | --- | --- | --- |
| A, B | security-relevant configuration (permissions, mode, project folder) | A clone of a Work room on a real folder is, from its first message, a Work room on that folder with the same permissions, and no confirmation is asked. PD-0008 item 10's line discloses that permissions are copied. No new privilege: the same page token can already set every value through `POST /api/config`. | Data classes row 1 |
| A, B | security-relevant configuration (command, extra args) | A copied command picks the executable for the clone's next turn. Blocked flags are re-checked at launch, so a copy cannot get past the check. | Data classes row 2 |
| B | security-relevant configuration | B puts permissions, command and over-limit text onto the room-creation contract. Without C-09 that is a new way around the PD-0006 limits. | Per option B, Contract row |
| A, B | local user data (verification copy) | The copied store includes `.bridge/` credentials. It is used only by the isolated server and never written back. | Data classes row 4 |

No `personal`, `financial` or `regulated` row exists in impact.md.

## Product assumptions that conflict with the platform

| # | Assumption (and where it is stated) | Platform fact | Class (blocking/narrowing/costly) | Raised as |
| --- | --- | --- | --- | --- |
| PC-01 | "whether it is asleep" is copied as an agent setup value (PD-0008 item 2; REQ-0004 Behavior 4) | Sleep is run state with a reason and a since-time (`{since, reason}`), for example "Imported copy: wake this agent when ready to continue." in `Factory M1`. The only sleep path writes a conversation note. PD-0008 does not say whether the reason carries over or what since-time the clone shows. | narrowing | Recommended PD-0008 amendment (pm-resolvable). Recommendation: copy the reason as is, set the since-time to the clone's creation, write no note (C-01, C-02). |
| PC-02 | A copied Goal over 2,000 and Rules over 8,000 are kept as is (PD-0008 items 5, 6), under B "posted to the existing `POST /api/rooms`" | Room creation checks limits against an empty brief and refuses such text. PD-0006 item 2 applies the limits to new saves from every path, HTTP API included. Browser-posted text alone cannot prove it is a stored copy. | blocking (B as stated); none for A | Resolved by C-09 if B is chosen; no PM decision needed. |
| PC-03 | Permissions are "Claude permission mode, Codex sandbox" (PD-0008 item 2; REQ-0004 Behavior 4 and AC) | Gemini agents have a third permission, `approvalMode`. Gemini has no effort and no Fast mode. Codex has no permission mode. | narrowing | Recommended PD-0008 item 2 amendment, which PD-0008's Consequences expects: name Gemini approval mode; say effort and Fast mode apply only where the provider has them. |
| PC-04 | "No agent process starts" when the new room opens (PD-0007 item 7; PD-0008 item 13; REQ-0004 AC) | Opening any room runs the CLI health check, which may spawn `claude auth status --json`. It is a local check, not an agent turn, and sends nothing to a model. Every room open does this today. | narrowing | Recommended PD clarification: an "agent process" is a provider turn; the room-open CLI health check is not one. |
| PC-05 | The dialog "reuses the Create room dialog's look", and a click outside closes it (PD-0008 item 11; REQ-0004 Behavior 3) | No Parley dialog closes on a click outside. Create room closes only via Cancel, × or Escape. This is new behaviour, not reuse. | narrowing | PM note in the story. It does not change the outcome; it should not be read as "same as Create room". |
| PC-06 | Every room-level setting is copied (PD-0008 item 3) | (a) A legacy room's `accounting: "exchanges"` and `hopBudget: -1` would make a new room on settings Room settings no longer offers for new selection. No live room has `exchanges` today. (b) Converge/Parallel and review rounds are per browser tab, not saved with the room, so they are not copied and the clone opens on defaults. | narrowing | Recommended PD-0008 item 3 note: copy legacy values as is (consistent with the item); tab preferences are not room settings. |
| PC-07 | The new room's Room Brief holds the dialog's Goal, the copied Rules and no Decisions (PD-0008 item 13) | The original may hold an old saved brief (legacy, read-only view, PD-0003 item 10) and old note and direction recovery copies (PD-0006 item 3). The clone has none, so its Brief tab shows no old saved brief. | narrowing | Consistent with PD-0007 item 3 and PD-0008 item 7; record it in the PD-0008 amendment so the readiness reviewer does not read it as a gap. |

## Open questions raised

| Q- id | What it blocks |
| --- | --- |
| none | No requester question. PC-01 and PC-03 to PC-07 are PM clarifications (`PD-` amendment). PC-02 is resolved by choosing A, or by C-09 under B. Q-0001 (copy Decisions, default no) is unaffected: either option could add it later. |
