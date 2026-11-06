---
id: REQ-0001
type: requirement
title: Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note
status: draft
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0014
outcome_element: "Every agent receives the room's whole Room Brief — Goal, Rules and active Decisions, migrated from each room's existing direction, pins and room note with nothing lost — in full on every turn."
acceptance:
  - "After a server start on the new build, a room that had a direction goal, pins and a room note → its Room Brief holds that goal as Goal, those pins in the same order as active Decisions and that note as Rules, each character for character"
  - "Any agent turn in any room (Claude, Codex or Gemini seat; fresh, resumed or compacted session) → the prompt contains the Room Brief block in the exact wording of PD-0003 item 4, with the Goal, Rules and active Decisions saved when the turn started"
  - "After a session restart, one prompt check → the full Room Brief block is in the agent's prompt"
  - "A brief edit saved while no turn is running → the next turn of every agent carries the new text, with no restart"
  - "Any agent turn after the change → the prompt contains no room-note block, no room-direction block and none of their reminder or cleared lines"
capabilities: [CAP-0001]
design_refs: []
decisions: [PD-0002, PD-0003]
depends_on: [none]
constraints: []
observability: []
rollout: migration
readiness: not-assessed
tickets: []
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

The saved Room Brief of a room, the one-time migration into it, its delivery
in every agent prompt, the timeline note on every saved change, room creation
outside the Create room dialog, and `/note`. Ends at the server: the Room
Settings and Create room surfaces are [REQ-0002](REQ-0002-room-brief-in-room-settings.md),
the pin dialog is [REQ-0003](REQ-0003-pin-to-room-brief.md).

## Non-goals

- Per-agent standing instructions — unchanged, still sent as today.
- Agent-suggested decisions — deferred by the requester.
- Shortening, summarising or cutting any brief text for delivery — the whole
  brief is sent, however long ([principles](../../../project/principles.md)).

## Behavior

1. **The brief.** Each room has one saved Room Brief: a Goal (text, may be
   empty), Rules (text, may be empty), active Decisions (ordered, in the order
   added) and archived Decisions (kept, never sent). Limits are those of
   [PD-0003](../../../decisions/PD-0003-room-brief-behaviour-clarifications.md)
   item 9; there is no limit on the whole brief.
2. **Delivery.** Every agent turn, in every seat and in every session state
   (fresh, resumed, after compaction, after a restart), carries the brief block
   built from the brief saved when the turn starts, in the exact wording of
   PD-0003 item 4 (empty parts as `Goal: none set`, `Rules: none`,
   `Decisions: none`). Archived Decisions never appear. The block replaces the
   room-note block and the room-direction block and all their reminder,
   "no room note is active" and "cleared" lines; none of them is sent again.
3. **Edits apply on the next turn.** A turn that starts after a save carries
   the new brief. A turn already running is not interrupted. No restart.
4. **Transition line.** An agent session that existed before the migration
   gets this line once, on its first turn after the migration, just before the
   brief block (exact copy): `[The separate room direction and room note from
   your earlier briefing are replaced by the room brief below. Follow the room
   brief.]`
5. **Migration.** Runs once per room. Goal ← the direction goal; active
   Decisions ← the direction's pins, in order; Rules ← the room note. Text is
   copied exactly: nothing trimmed, reordered, merged or dropped. A room with
   none of these gets an empty brief. No room is ever rejected or left
   unloaded for an empty Goal or for any length. Running it again on a
   migrated room changes nothing. The old saved brief (retired, never sent)
   stays as it is (PD-0003 item 10).
6. **Timeline note.** Every saved change to the brief, from any path, adds one
   system note to the room conversation naming the changed parts in the order
   Goal, Rules, Decisions (PD-0003 item 8), for example `Brief updated: Goal,
   Rules`. A save that changes nothing adds no note. The note starts no agent
   turn.
7. **Rooms created outside the Create room dialog** (HTTP API, MCP bridge,
   runner, the default room) start with the instructions they pass today as
   Rules, an optional Goal, and no Decisions; none is rejected for an empty
   Goal (PD-0003 item 1).
8. **`/note`** keeps today's behaviour on Rules: `/note <text>` replaces Rules
   with the text, `/note` with no text clears Rules (PD-0003 item 7). It adds
   the timeline note `Brief updated: Rules`.

## Acceptance criteria

- [ ] After a server start on the new build, a room that had a direction goal,
      pins and a room note → its Room Brief holds that goal as Goal, those
      pins in the same order as active Decisions and that note as Rules, each
      character for character.
- [ ] A room that had no direction and no room note → loads with an empty
      Room Brief, no error.
- [ ] Any agent turn in any room (Claude, Codex or Gemini seat; fresh, resumed
      or compacted session) → the prompt contains the Room Brief block in the
      exact wording of PD-0003 item 4, with the Goal, Rules and active
      Decisions saved when the turn started.
- [ ] A brief with an empty Goal, empty Rules and no active Decisions → the
      block reads `Goal: none set`, `Rules: none`, `Decisions: none`.
- [ ] A brief with one archived Decision → that Decision's text is not in any
      agent prompt.
- [ ] After a session restart, one prompt check → the full Room Brief block is
      in the agent's prompt.
- [ ] A brief edit saved while no turn is running → the next turn of every
      agent carries the new text, with no restart.
- [ ] Any agent turn after the change → the prompt contains no room-note
      block, no room-direction block and none of their reminder or cleared
      lines.
- [ ] An agent session that existed before the migration → its first turn
      after it carries the transition line of Behavior 4 once; its second turn
      does not.
- [ ] `/note Keep replies short` in a room → Rules reads `Keep replies short`,
      the conversation gains the note `Brief updated: Rules`, and no agent
      turn starts from it.
- [ ] A room created through the HTTP API with instructions and no goal → is
      created, with those instructions as Rules and an empty Goal.
- [ ] Manual repeat of the requester's test room: a new agent and an existing
      agent each asked to repeat the room's goal, decisions and rules →
      each repeats all three, also after an edit and after a session restart.

## Sequencing

`depends_on: [none]` within Product Memory — this story is on the frontier.
One ordering outside it: the separate engineering session "brief-delivery" is
changing `parley.mjs` delivery so the direction and note go in full every
turn. This story's work starts only after that work has landed on `main`, and
rebases on it before touching delivery code
([raw request](../product/sources/raw-request.md), "Constraints").
[REQ-0002](REQ-0002-room-brief-in-room-settings.md) and
[REQ-0003](REQ-0003-pin-to-room-brief.md) build on this story's saved brief
and come after it.

## Technical constraints

_Filled at DECOMPOSITION from the architect's assessment._

## Observability

none — the timeline note (Behavior 6) is the user-visible record of every
change; no new events, metrics or logs are needed.

## Rollout

`migration`: the one-time migration of Behavior 5 runs on the first server
start of the new build, for every room on disk. It is safe to run again. Test
on an isolated port only; never on the live server on port 4142, never on
4141 ([constraints](../../../project/constraints.md) #1).

## Notes

Current behaviour is [CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md).
Testing is the prompt check and the manual repeat above; no new unit or smoke
suites ([raw request](../product/sources/raw-request.md), "Done means").
