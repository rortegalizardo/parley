---
id: REQ-0001
type: requirement
title: Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note
status: accepted
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0014
outcome_element: "Every agent receives the room's whole Room Brief — Goal, Rules and active Decisions, migrated from each room's existing direction, pins and room note with nothing lost — in full on every turn."
acceptance:
  - "A room opened for the first time on the new build that had a direction goal, pins and a room note → its Room Brief holds that goal as Goal, those pins in the same order as active Decisions and that note as Rules, each character for character, and the old note and direction are still on disk"
  - "Any agent turn in any room (Claude, Codex or Gemini seat; fresh, resumed or compacted session) → the prompt contains the Room Brief block, PD-0003 item 4 wording inside Parley's per-line framing, with the Goal, Rules and active Decisions saved when that turn's prompt was built"
  - "After a session restart, one prompt check → the full Room Brief block is in the agent's prompt"
  - "A brief edit saved while no turn is running → the next turn of every agent carries the new text, with no restart"
  - "Any agent turn after migration → the prompt contains no room-note block, no room-direction block, none of their reminder, cleared or no-note lines, and no retired-brief notice"
  - "A save through the HTTP API that leaves out an active Decision → that Decision is in Archived, not deleted"
capabilities: [CAP-0001]
design_refs: []
decisions: [PD-0002, PD-0003, PD-0006]
depends_on: [none]
constraints: [C-01, C-03, C-04, C-05, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-14, C-15]
observability: []
rollout: migration
readiness: engineering-ready
tickets: [PRL-1]
supersedes:
superseded_by:
---

# REQ-0001 — Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note

## Requirement

Every agent in a room receives the room's whole Room Brief — Goal, Rules and
active Decisions — in full on every turn, and every existing room's direction
goal, pins and room note become its Room Brief with nothing lost
([PD-0002](../../../decisions/PD-0002-room-brief-requester-decisions.md) items 1, 4, 8).

## Scope

The saved Room Brief of a room and the rules every save follows, the one-time
migration into it, its delivery in every agent prompt, the timeline note on
every saved change, room creation outside the Create room dialog, and the
`/note` command. Ends at the server and `/note`: the Room Settings and Create
room surfaces, including removing the browser's 2,000-character Save gate
(the client half of C-10), are
[REQ-0002](REQ-0002-room-brief-in-room-settings.md); the pin dialog is
[REQ-0003](REQ-0003-pin-to-room-brief.md).

## Non-goals

- Per-agent standing instructions — unchanged, still sent as today.
- Agent-suggested decisions — deferred by the requester.
- Shortening, summarising or cutting any brief text for delivery — the whole
  brief is sent, however long ([principles](../../../project/principles.md)).

## Behavior

1. **The brief.** Each room has one saved Room Brief: a Goal (text, may be
   empty), Rules (text, may be empty), active Decisions (ordered, in the order
   added) and archived Decisions (kept, never sent). There is no limit on the
   whole brief.
2. **Delivery.** Every agent turn — direct, listener and hop turns and their
   retries, in every seat (Claude, Codex, Gemini) and every session state
   (fresh, resumed, after compaction, after a restart) — carries the brief
   block built from the brief saved when that turn's prompt is built. The
   block is the PD-0003 item 4 wording, with the user's text inside Parley's
   per-line framing of user-authored text
   ([PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 1);
   empty parts read `Goal: none set`, `Rules: none`, `Decisions: none`.
   Archived Decisions never appear.
3. **What stops.** The brief block replaces the room-note block and the
   room-direction block. None of these is sent again: the room-note and
   direction blocks, their reminder lines, the cleared-direction line, the
   "no room note is active" line, and the retired-brief notice. The
   compaction note in the conversation names the room brief instead of the
   room direction.
4. **Edits apply on the next turn.** A turn whose prompt is built after a
   save carries the new brief. A turn already running is not interrupted. No
   restart.
5. **Transition line.** Every agent session that existed when its room
   migrated gets this line just before the brief block, until it completes
   one turn successfully (a failed or stopped turn gets it again), exact
   copy: `[The separate room direction and room note from your earlier
   briefing are replaced by the room brief below. Follow the room brief.]`
6. **Migration.** Each room migrates once, the first time it is opened on the
   new build (an archived room when it is restored). Goal ← the direction
   goal; active Decisions ← the direction's pins, in order; Rules ← the room
   note. Text is copied exactly: nothing trimmed, reordered, merged or
   dropped, even above a PD-0003 item 9 limit (PD-0006 item 2). A room with
   none of these gets an empty brief. No room is rejected or left unloaded for
   an empty Goal or for any length. The old note and direction stay on disk as
   a recovery copy, never read or sent again (PD-0006 item 3); the old saved
   brief stays as it is (PD-0003 item 10). Opening a migrated room again
   changes nothing, also after `/clear` or a lost runtime state file. The
   migration adds no conversation note (PD-0006 item 6).
7. **Rules every save follows**, from every path (Room settings, Pin, Tidy,
   `/note`, the HTTP API):
   - Limits of PD-0003 item 9 apply to new text only: a part already stored
     above its limit is kept and saved as is; only making it longer is
     refused (PD-0006 item 2).
   - An active Decision a save leaves out moves to Archived, never deleted;
     editing a Decision's text changes it in place (PD-0006 item 5). Only an
     explicit delete of an archived Decision removes one.
   - A save built on an older brief than the one saved is refused and says
     so; the caller keeps its edit (PD-0006 item 4; the Room settings message
     is [REQ-0002](REQ-0002-room-brief-in-room-settings.md)).
8. **Timeline note.** Every saved change to the brief, from any path, adds one
   system note to the room conversation naming the changed parts in the order
   Goal, Rules, Decisions (PD-0003 item 8), for example `Brief updated: Goal,
   Rules`. A save that changes nothing adds no note. The note starts no agent
   turn.
9. **Rooms created outside the Create room dialog** — HTTP API callers of the
   room-creation endpoint, the default room made at startup, a room folder
   with no settings file — start with the instructions they pass today as
   Rules, an optional Goal, and no Decisions; none is rejected for an empty
   Goal (PD-0003 item 1).
10. **`/note`** keeps today's behaviour on Rules: `/note <text>` replaces Rules
    with the text, `/note` with no text clears Rules (PD-0003 item 7). It adds
    the timeline note `Brief updated: Rules`.

## Acceptance criteria

- [ ] A room opened for the first time on the new build that had a direction
      goal, pins and a room note → its Room Brief holds that goal as Goal,
      those pins in the same order as active Decisions and that note as Rules,
      each character for character, and the old note and direction are still
      on disk.
- [ ] A room that had no direction and no room note → opens with an empty
      Room Brief, no error.
- [ ] A room whose stored note is longer than 8,000 characters → opens with
      that whole note as Rules.
- [ ] Any agent turn in any room (Claude, Codex or Gemini seat; fresh,
      resumed or compacted session) → the prompt contains the Room Brief
      block, PD-0003 item 4 wording inside Parley's per-line framing, with the
      Goal, Rules and active Decisions saved when that turn's prompt was
      built.
- [ ] A brief with an empty Goal, empty Rules and no active Decisions → the
      block reads `Goal: none set`, `Rules: none`, `Decisions: none`.
- [ ] A brief with one archived Decision → that Decision's text is not in any
      agent prompt.
- [ ] After a session restart, one prompt check → the full Room Brief block is
      in the agent's prompt.
- [ ] A brief edit saved while no turn is running → the next turn of every
      agent carries the new text, with no restart.
- [ ] Any agent turn after migration → the prompt contains no room-note block,
      no room-direction block, none of their reminder, cleared or no-note
      lines, and no retired-brief notice.
- [ ] An agent session that existed before its room migrated → its first
      successful turn after migration carries the transition line of
      Behavior 5; its next turn does not.
- [ ] A save through the HTTP API that leaves out an active Decision → that
      Decision is in Archived, not deleted.
- [ ] A save built on a brief older than the saved one → refused; the saved
      brief is unchanged.
- [ ] `/note Keep replies short` in a room → Rules reads `Keep replies short`,
      the conversation gains the note `Brief updated: Rules`, and no agent
      turn starts from it.
- [ ] A room created through the HTTP API with instructions and no goal → is
      created, with those instructions as Rules and an empty Goal.
- [ ] Manual repeat of the requester's test room, on a copy of the room store
      and an isolated port: a new agent and an existing agent each asked to
      repeat the room's goal, decisions and rules → each repeats all three,
      also after an edit and after a session restart.

## Sequencing

`depends_on: [none]` within Product Memory — this story is on the frontier.
The external "brief-delivery" work it builds on has landed on local `main` as
`b6591be`; this story starts from `main` at or after it (C-12).
[REQ-0002](REQ-0002-room-brief-in-room-settings.md) and
[REQ-0003](REQ-0003-pin-to-room-brief.md) build on this story's saved brief
and come after it.

**Released together.** This story is never released on its own: it is
released with REQ-0002 and REQ-0003, after all three are on `main` — one
restart of the live server, one desktop repackage. Released alone, the old
Direction tab, Tidy, pin dialog and Room tab note field would save to the old
direction and note, which this story stops reading, so edits would be lost
(coherence round 1, defect 1). It is built and verified on its own, on an
isolated port with a copy of the room store.

## Technical constraints

From [technical/assessment.md](../technical/assessment.md), round 1:

- C-01 — the brief's user text stays inside Parley's per-line relay framing.
- C-03 — the brief replaces note and direction in direct, listener and hop turns and their retries; the "no room note is active" marker goes too.
- C-04 — the old note and direction stay on disk after migration, unread.
- C-05 — migration runs per room on first load; the migrated mark survives `/clear` and runtime-state recovery.
- C-06 — stored content is never rejected, trimmed or left unloaded for its length; limits apply to new input only.
- C-07 — the room-creation endpoint shared by the dialog and API callers accepts an empty Goal.
- C-08 — the timeline note comes from the server, by comparing parts, for every save path.
- C-09 — every save that leaves out an active Decision archives it.
- C-10 — the 2,000 whole-direction cap is removed on server and client; the guide count follows PD-0003 item 5.
- C-11 — test servers on an isolated port use a copy of the room store, never `~/.parley-fork`.
- C-12 — start from `main` at or after `b6591be`.
- C-14 — existing suites that assert note and direction behaviour are updated with the code; that is not a new suite.
- C-15 — the desktop app is repackaged with this change.

## Observability

none — the timeline note (Behavior 8) is the user-visible record of every
change; no new events, metrics or logs are needed.

## Rollout

`migration`, released together with REQ-0002 and REQ-0003 (see Sequencing):
the live server is restarted and the desktop app repackaged once, only after
all three stories are on `main`. Each room migrates the first time it is
opened on the new build (Behavior 6), safe to repeat, with the old note and direction kept on disk as
a recovery copy. Reload open browser tabs after the restart (risk R-4).
Repackage the desktop app (C-15). Test on an isolated port with a copy of the
room store only; never on the live server on port 4142, never on 4141
([constraints](../../../project/constraints.md) #1, C-11). The live server is
restarted by the requester, not by engineering.

## Notes

Current behaviour is [CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md)
(revision 2, `main` at `b6591be`). Accepted risks: per-turn cost at a long
brief (R-1) and "Follow it on every turn" turning pinned lines into standing
instructions (R-5) — both follow from PD-0002. Testing is the prompt check and
the manual repeat above; no new unit or smoke suites
([raw request](../product/sources/raw-request.md), "Done means").
