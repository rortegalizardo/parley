---
id: REQ-0003
type: requirement
title: Pinning a message adds it to the Room Brief's Decisions
status: draft
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0014
outcome_element: "The user adds a Decision to the Room Brief by pinning a message, as pinning works today."
acceptance:
  - "Pin on a message → the dialog Pin to room brief opens with a suggested line, as today"
  - "Press Pin → the line is the last active Decision of the Room Brief and the conversation gains the note Brief updated: Decisions"
  - "composition: at 1440 wide, light theme, a 200-character line wraps in full in the dialog with no truncation"
capabilities: [CAP-0001]
design_refs: []
decisions: [PD-0002, PD-0003]
depends_on: [REQ-0001]
constraints: []
observability: []
rollout: none
readiness: not-assessed
tickets: []
supersedes:
superseded_by:
---

# REQ-0003 — Pinning a message adds it to the Room Brief's Decisions

## Requirement

The user adds a Decision to the Room Brief by pinning a message or the agreed
decision card, as pinning works today
([PD-0002](../../../decisions/PD-0002-room-brief-requester-decisions.md) item 1).

## Scope

The pin action on messages and on the agreed decision card, and its dialog.
Ends at adding one active Decision; editing the brief is
[REQ-0002](REQ-0002-room-brief-in-room-settings.md).

## Non-goals

- Agents suggesting or adding decisions themselves — deferred by the requester.
- Converge writing to the brief — it never does today, and still does not.

## Behavior

1. The pin action's tooltip and label read `Pin to room brief`.
2. It opens the dialog titled `Pin to room brief`, naming the room as today,
   with the field label `One decision for every agent` and today's one-line
   suggestion from one tool-less Claude Sonnet call, which the user accepts or
   edits. At most 200 characters (PD-0003 item 9). The no-lasting-decision
   message and the empty-line message stay as today.
3. `Pin` appends the line to the end of the active Decisions and saves it;
   the conversation gains the note `Brief updated: Decisions`
   ([REQ-0001](REQ-0001-room-brief-delivered-every-turn.md) Behavior 6). The
   toast reads `Pinned to the room brief in {room}.`
4. If the Brief tab has unsaved changes for that room, the pinned line joins
   them and is saved with them (as today).
5. Every agent's next turn carries the new Decision (REQ-0001).

## Acceptance criteria

- [ ] Pin on a message → the dialog `Pin to room brief` opens with a
      suggested line, as today.
- [ ] Press `Pin` → the line is the last active Decision of the Room Brief,
      the conversation gains the note `Brief updated: Decisions`, the toast
      reads `Pinned to the room brief in {room}.`, and no agent turn starts.
- [ ] The next agent turn after the pin → its prompt's Decisions list ends
      with the pinned line.
- [ ] composition: at 1440 wide, light theme (the supported display matrix,
      PD-0004), the dialog shows a 200-character line wrapped in full with no
      truncation, clipping or ellipsis, no horizontal scroll and no unbounded
      stretch.

## Sequencing

After [REQ-0001](REQ-0001-room-brief-delivered-every-turn.md): the pin writes
into the saved Room Brief that REQ-0001 creates. Independent of REQ-0002.

## Technical constraints

_Filled at DECOMPOSITION from the architect's assessment._

## Observability

none — the timeline note records the change.

## Notes

Current pin behaviour is
[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md), "Pin".
