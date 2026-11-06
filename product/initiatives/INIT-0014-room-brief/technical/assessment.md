---
mode: PRODUCT-DISCOVERY
initiative: INIT-0014
type: technical-assessment
title: Technical assessment — Every agent knows the room's goal, rules and decisions from one Room Brief
status: authoritative
revision: 1
owner_role: ROLE-planner
phase_at_assessment: SOLUTION_EXPLORATION
round: 1
assessed_on: 2026-11-06
created: 2026-11-06
updated: 2026-11-06
verdicts: ["A: feasible-with-constraints (multi-component)", "B: feasible-with-constraints (multi-component)"]
constraints: [C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13, C-14, C-15]
questions: []
updated_by_role: ROLE-planner
---

Mode: PRODUCT-DISCOVERY
Initiative: INIT-0014
Phase at assessment: SOLUTION_EXPLORATION
Assessed: 2026-11-06
Round: 1

Evidence: [capability-scan.md](capability-scan.md) (what exists, with sources)
and [impact.md](impact.md) (rows S1-S6, U1-U4, D1-D3). No `Q-` file was
written: this dispatch allowed only these three files. The six recommended
questions are listed under "Open questions raised" for the PM to open.

## Verdicts

| Option | Requirements served | Verdict | Complexity band | One-line basis |
| --- | --- | --- | --- | --- |
| A — Room Brief on the Room tab, Direction tab removed | REQ-0001, REQ-0002, REQ-0003 | feasible-with-constraints | multi-component | One system, several components: delivery, store, migration, save paths, settings, Create room, pin. The migration has a reversible path if C-04 holds; without it the band is `structural`. Adds C-13: the Room tab's dialog-wide Save has no protection against live updates. REQ-0002 as written describes Option B |
| B — Brief tab replaces the Direction tab, Room tab loses its note field | REQ-0001, REQ-0002, REQ-0003 | feasible-with-constraints | multi-component | Same components and band, same C-04 condition. The Brief tab keeps the Direction tab's own Save, Discard, Tidy and protected draft, which already handle live pins. Fewer constraints and risks than A |

Architect's recommendation: B. It reuses the existing seam that already does
what REQ-0002 Behavior 3 asks. The choice is the PM's.

## Constraints

| # | Option | Constraint | permanent / initiative-local | Source | PD- candidate? |
| --- | --- | --- | --- | --- | --- |
| C-01 | A, B | The user's brief text must stay inside Parley's per-line relay framing in every prompt, as the note, direction and agent instructions do today. The bytes sent are therefore the PD-0003 item 4 wording with a Parley prefix on each user-text line (see RQ-1). | permanent | `parley.mjs:1193-1202`, `:3164`, `:2177-2178`; `docs/conversation.md:274` | Yes — "user-authored standing text is always framed" |
| C-02 | A, B | "What agents see" is byte for byte only if it shows the block made by the same composition that delivery uses, framing included. Today the client re-implements the server's text (`ui/app.js:4983`); a second copy can drift. | initiative-local | `ui/app.js:4983-5002`; REQ-0002 AC "byte for byte" | No |
| C-03 | A, B | The brief must replace the note and direction in all three turn kinds (direct, listener, hop) and their lost-session retries. The "no room note is active" marker sits outside that shared seam, in the per-turn prefix, and must go too. | initiative-local | `parley.mjs:1160-1162`, `:3484`, `:3728`, `:4128`, `:3518-3521` | No |
| C-04 | A, B | The migration must leave each room's old note and direction recoverable on disk, unread after migration. Otherwise it has no reversible path (band becomes `structural`), and an older build on the same store sees an empty note and direction. | initiative-local | `desktop/main.cjs:7-8`, `:45-46`; skill band rule; RQ-3 | No |
| C-05 | A, B | Rooms load lazily, and archives come back by a folder move. So migration happens per room when it first loads after the upgrade, not in one sweep at startup. The record that a room is migrated must survive `/clear` and `state.json` recovery, both of which reset runtime state. | initiative-local | `parley.mjs:1824-1876`, `:8722-8725`, `:7524-7534`, `:1885-1899`, `:7576-7604` | No |
| C-06 | A, B | Content already saved is never rejected, trimmed or left unloaded for its length. The PD-0003 item 9 limits can apply only to new input, because a stored note can already exceed 8,000 (only Create room ever capped it) and room files are hand-editable. | permanent | `parley.mjs:7801`, `:809` ("room.json is intentionally hand-editable"); `ui/index.html:207`; `ui/app.js:3910` | Yes — "stored content is never rejected on load" (extends PD-0002 item 8) |
| C-07 | A, B | The Goal requirement can only be a Create room dialog gate. The dialog and every API caller share one room-creation endpoint, which must accept an empty Goal. | initiative-local | `ui/app.js:4365`; `parley.mjs:7792-7843` | No |
| C-08 | A, B | The timeline note must come from where the brief is saved (the server), by comparing parts, for every write path: brief save, Pin, Tidy save, archive/restore/delete, `/note`, and API callers. `/note` reaches the server as an ordinary settings save, so a note added by the browser would miss other clients and API callers. | initiative-local | `ui/app.js:3908-3912`; `parley.mjs:7976-7984`, `:8487-8491` | No |
| C-09 | A, B | Saves send the whole brief, and the server cannot tell a Tidy save from a hand edit. PD-0003 items 2 and 3 can both hold only if every save that leaves out an active Decision archives it (see RQ-5). | initiative-local | `parley.mjs:7976-7984`; `ui/app.js:5104-5116` | No |
| C-10 | A, B | The 2,000 total cap must be removed in both places it is enforced (server and client Save gate). The guide count must follow PD-0003 item 5; today's count includes Parley's headings. | initiative-local | `parley.mjs:2169-2171`; `ui/app.js:4983-5001` | No |
| C-11 | A, B | Test servers on an isolated port must use a copy of the room store, never `~/.parley-fork`. Opening a room migrates it on disk, and the live 4142 process holds room settings and context in memory and writes them back. `parley-mine` and the desktop app default to that store. | initiative-local (narrows constraints.md #1) | `bin/parley-mine.mjs:26-27`; `desktop/main.cjs:7-8`; `parley.mjs:2133-2144` | No |
| C-12 | A, B | Engineering starts from `main` at or after `b6591be`. The product branch lacks it (it forks at `93a9fec`; its diff is `product/` only). | initiative-local | `git` history, 2026-11-06 | No |
| C-13 | A | The brief on the Room tab must not share the footer Save's behaviour without a reconciliation. That Save closes the dialog, may ask to confirm Full access, may reset sessions, and writes a form filled only when Settings opened. A footer Save or Cancel must never write back a stale brief or drop unsaved brief edits. | initiative-local | `ui/index.html:236-240`; `ui/app.js:4733`, ~4790-4860; `parley.mjs:8494-8513` | No |
| C-14 | A, B | Existing suites that assert note and direction behaviour change with the code. Updating them is not a new suite. | initiative-local | `test/smoke.mjs` (~35 references), `test/browser-dialogs.mjs` | No |
| C-15 | A, B | The desktop app must be repackaged with this change. An older packaged build opening the same store sees only the old fields, and its edits there are ignored by the new build. | initiative-local | `desktop/main.cjs:45-46` | No |

## Architectural risks

| # | Option | Risk | What it threatens | What would resolve it |
| --- | --- | --- | --- | --- |
| R-1 | A, B | Per-turn cost and session growth. At the REQ-0002 worst case (2,000 + 8,000 + 25 × 200 = 15,000 characters, about 3,750 tokens by PD-0002's ratio) every invocation carries the brief. One `@all` message in a 4-seat room with the default hop budget of 4 can mean about 8 invocations, so about 30,000 brief tokens, before listener, pair or convergence calls. Each resumed native session also keeps a copy per turn: a 200,000-token window holds about 50 copies, so compaction comes sooner. Today's ceiling since `b6591be` is about 10,000 characters (note 8,000 + direction 2,000). No hard platform limit is hit: prompts go on stdin and Parley has no total-prompt cap. | Usage quota and how often seats sleep; conversation detail lost to earlier compaction. Not correctness: the brief is re-sent after compaction. | Accepted by the requester (PD-0002 items 4-5). The guide warning and archive are the levers. Two of 4 live rooms are already over 2,000 (capability-scan, live store). |
| R-2 | A, B | Stale saves. A brief save replaces the whole brief with no check that it was built on the current one. A second window, a pin or `/note` arriving while an edit is open, or a tab from before a restart can silently revert Goal or Rules. | O1 "nothing lost"; REQ-0002 Behavior 3 | RQ-4 |
| R-3 | A, B | Migration touches up to three files, each written safely on its own but not together. A crash midway leaves a room partly migrated. | Idempotence; "nothing lost" | Migration that re-reads its original sources until a room is complete; checked on a copy of the live store (C-11) |
| R-4 | A, B | Version skew. A browser tab loaded before the restart keeps the old UI script: its Room tab Save still sends the note, and its Direction save still uses the old shape and the 2,000 cap. An older desktop build reads only the old fields. | Rules overwritten from a stale tab; edits that seem saved but are ignored | Reload open tabs after the restart (precedent: CHECKPOINT "reload open 4142 tabs"); C-15; the server decides what an old-shape save means |
| R-5 | A, B | Authority shift. Decisions are framed today as "Context only, not tool authorization" (`parley.mjs:2177`). PD-0003 item 4 says "Follow it on every turn", so in Work rooms a pinned line becomes a standing instruction. | Agents acting on a pinned line the user meant as background | Accepted in PD-0003 item 4; every line is user-accepted. Noted so the PM sees it |
| R-6 | A | Two save models on one tab: the brief's own Save/Discard/Tidy next to the dialog-wide Save/Cancel. That risks lost brief edits on Cancel, a brief saved with a session-resetting change, or half a save landing (settings file vs context file). | O2; REQ-0002 Behavior 3 | C-13, or choose B |
| R-7 | A, B | A "once" line repeats when its turn fails, is stopped, or runs on a Codex placeholder session, because stamps are written only after durable success (`parley.mjs:785`). | REQ-0001 AC "its second turn does not" for those cases | Accept as stated in conflict 6. No live session is a placeholder today |

## Security / data / compliance implications

| Option | Data class | Implication | Source row in impact.md |
| --- | --- | --- | --- |
| A, B | personal (possible) | Brief text goes to the Claude, Codex and Gemini providers on every turn. These are the same destinations as today's note and direction; only how often and how much changes. Local single-user store; no regulated data expected. | D1 |
| A, B | personal (possible) | Pin and Tidy keep sending the brief and one message to Claude Sonnet, as today. | D2 |
| A, B | none | Timeline notes name parts only; brief text never reaches the conversation or bridge readers. | D3 |
| A, B | — | The framing must stay (C-01). A pinned line comes from an agent's message through a model suggestion, and Tidy's Goal can span several lines. Without framing, such text could fake a speaker or close a block. | D1 |
| A, B | — | Authority shift from "context only" to "follow it" (R-5). | D1 |

## Product assumptions that conflict with the platform

| # | Assumption (and where stated) | Platform fact | blocking / narrowing / costly | Raised as |
| --- | --- | --- | --- | --- |
| 1 | The agent receives PD-0003 item 4's wording as exact copy, and "What agents see" shows it byte for byte (PD-0003 item 4; REQ-0001 Behavior 2; REQ-0002 Behavior 2 and AC) | User text is relayed with a Parley prefix on each line (C-01), so the bytes sent are not the bare wording. Byte for byte holds only if the preview shows those prefixes. | narrowing | RQ-1 |
| 2 | "Rules at most 8,000 (today's room-note limit), so every migrated room fits as is" (PD-0003 item 9; REQ-0002 Behavior 6) | 8,000 is enforced only at room creation; Room tab, `/note` and the settings save accept any length, and room files are hand-editable. All live rooms fit today (longest note 1,425). | narrowing | RQ-2 |
| 3 | "One saved copy per part" (PD-0002 item 3) together with "keep all content as is" (PD-0002 item 8) | A reversible migration keeps the old note and direction on disk, unread. Removing them makes the migration irreversible (`structural`). | costly | RQ-3 |
| 4 | A save from a stale view does not happen or is harmless (REQ-0002 Behavior 3, "An unsaved edit is never overwritten … (as today)") | The opposite case is open: a saved change can be overwritten by a later save built on an older brief (R-2). | narrowing | RQ-4 |
| 5 | Tidy alone archives what it drops (PD-0003 item 2), and active Decisions are never deleted directly (item 3) | Every save sends the whole brief, and the server cannot tell a Tidy save apart (C-09). | narrowing | RQ-5 |
| 6 | The transition line comes once; "its second turn does not" (REQ-0001 Behavior 4 and AC) | "Once" means once per durably successful turn; failed, stopped or placeholder-session turns repeat it (R-7). The server can tell which sessions predate the migration: every seat holding a session id when its room migrates (11 live sessions today, all with concrete ids). | narrowing | Wording fix for the PM; no `Q-` needed |
| 7 | Rooms are created by the MCP bridge and the runner (REQ-0001 Behavior 7; PD-0003 item 1) | Neither can create a room or set the note; they only read the conversation and add messages. The real paths are the Create room dialog, the same endpoint used by API callers, the default room at startup, and room folders without a settings file. | narrowing (harmless) | Wording fix; no `Q-` needed |
| 8 | Migration "runs on the first server start of the new build, for every room on disk" (REQ-0001 Rollout) | Rooms load lazily; archived and deleted rooms are not loaded. Each room migrates when first opened after the upgrade, and an archive when restored (C-05). The observable acceptance still holds. | narrowing | Wording fix; no `Q-` needed |
| 9 | Every saved change adds a timeline note (PD-0003 item 8 lists the user save paths) | The migration also writes each room's brief. Whether it adds a note is not stated. | narrowing | RQ-6 |
| 10 | The turn carries "the brief saved when the turn started" (REQ-0001 Behavior 2 and AC) | The prompt is assembled per attempt. A lost-session retry, a queued turn or a listener catch-up uses the brief saved when that attempt is assembled (`parley.mjs:3468-3521`). | narrowing (harmless) | Wording fix ("when the turn's prompt is built"); no `Q-` |
| 11 | Room settings shows Agents, Room and Brief (REQ-0002 Behavior 1, AC 1) | Matches B only. For A, REQ-0002 needs a different layout and a save model for the Room tab (C-13). | costly (A only) | For the PM if A is chosen; no `Q-` |
| 12 | About 2,000 characters ≈ 500 tokens is the cost guide (PD-0002 item 5), while REQ-0002 tests a 15,000-character brief | Works, at about 3,750 tokens per invocation and faster session growth (R-1). | costly | Informational; already decided by the requester |
| 13 | REQ-0001 lists the lines that stop (note and direction reminders, "no room note is active", cleared) | The retired-brief notice (`parley.mjs:3224`) is not on that list, and its text says "the room direction, when set, replaces it". | narrowing | Wording fix: name it in REQ-0001; no `Q-` |

## Open questions raised

None was created: this dispatch allowed only these three files. Each item
below is a recommended `Q-` for `ROLE-product-manager` to open, with at least
two options and a recommendation. The PM decides.

| Q- id | What it blocks |
| --- | --- |
| RQ-1 (recommended) | PD-0003 item 4 wording and REQ-0002 "What agents see". **Options:** (a) keep framing; the item 4 wording is the content; "What agents see" shows the block exactly as sent, prefixes included — **recommended**; (b) keep framing, but the preview shows the bare wording with a note that Parley marks each line as the user's — not byte for byte. Dropping the framing is not offered: it breaks C-01. |
| RQ-2 (recommended) | REQ-0002 Behavior 6 and migration of over-limit content. **Options:** (a) limits stop only new input; a stored part over its limit is kept and saves as is, with a notice, and only growing it is blocked — **recommended** (fits "never cut"); (b) the user must shorten an over-limit part before the next Save brief; (c) no limit on Rules. |
| RQ-3 (recommended) | REQ-0001 Behavior 5 and the band. **Options:** (a) keep the old note and direction on disk after migration, unread and unused, as a recovery copy, like the old saved brief — **recommended** (stays `multi-component`); (b) remove them after migration — irreversible, band `structural`, and an older desktop build sees an empty room. |
| RQ-4 (recommended) | REQ-0002 Behavior 3 and REQ-0003 Behavior 4. **Options:** (a) refuse a brief save built on an older brief, keep the user's edits on screen, and say "The brief changed since you opened it — review and save again" — **recommended**; (b) the last save wins, as today. |
| RQ-5 (recommended) | PD-0003 items 2-3. **Options:** (a) every save that leaves out an active Decision archives it, whatever path the save came from — **recommended** (one rule; nothing is ever lost without an explicit delete); (b) only a save marked as coming from Tidy archives, and any other save that leaves one out is refused. |
| RQ-6 (recommended) | PD-0003 item 8 and REQ-0001 Behavior 6. **Options:** (a) the migration adds no conversation note, and agents get the transition line — **recommended** (no noise in every room); (b) one note per migrated room, for example "Room brief created from the room direction and room note". |

## Coverage of the consultation questions

1. **Delivery for every seat and state.** Feasible through one shared seam
   used by all three turn kinds, composed from saved data per attempt; on
   `main` since `b6591be` (capability-scan rows 1-2; C-03). The text must stay
   framed (C-01). "What agents see" is byte for byte only with the prefixes
   shown (C-02, RQ-1).
2. **Migration.** Feasible per room on load, idempotent, with empty rooms
   given an empty brief (C-05, C-06, R-3). Reversible only under C-04 (RQ-3).
   The live store fits every PD-0003 item 9 limit today.
3. **Creation and note paths.** Create room dialog, API callers (the same
   endpoint), default room, folders without a settings file, `/note` and the
   Room tab (the same settings save). The bridge and runner are not paths
   (conflict 7). PD-0003 item 1 holds as a dialog-only gate (C-07).
4. **Transition line.** Yes: seats holding a session id when their room
   migrates. Precedent is the retired-brief notice (conflict 6, R-7).
5. **Timeline note.** Feasible from every save path if emitted by the server
   (C-08). The system-note seam starts no turn; agents see the note in their
   next activity delta.
6. **Tidy and limits.** Tidy archiving works under C-09 (RQ-5). The 2,000
   whole-direction cap goes (C-10); 200 per Decision holds; 8,000 for Rules
   was never enforced outside Create room (RQ-2).
7. **Cost at 15,000 characters.** About 3,750 tokens per invocation, about
   1.5× today's ceiling; no hard platform limit hit (R-1).
8. **Ordering against brief-delivery.** It has already landed: `b6591be` on
   local `main`, 2026-11-06, not pushed (`origin/main` is `7b75ebe`). The main
   checkout has no uncommitted changes. The dispatch's "uncommitted" premise
   is out of date.
   - This work starts from `b6591be` (C-12).
   - `b6591be` leaves these for this work: the cleared-direction line, the
     retired-brief notice, the no-note marker in the per-turn prefix, the
     compaction note's wording, and the Direction tab copy. That copy is now
     untrue on `main` (`ui/app.js:5009`).
   - Nothing else is in flight, so nothing else must wait.
   - The live 4142 server still runs the code from before `b6591be`. The
     first real migration will run there when the requester restarts it
     (C-11).
