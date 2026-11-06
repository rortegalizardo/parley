---
id: REQ-0003
type: requirement
title: Pinning a message adds it to the Room Brief's Decisions
status: accepted
revision: 2
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
design_refs: [DES-0001]
decisions: [PD-0002, PD-0003, PD-0004, PD-0006]
depends_on: [REQ-0001, REQ-0002]
constraints: [C-08, C-11, C-15]
observability: []
rollout: coordinated
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

The pin action on messages and on the agreed decision card, and its dialog,
as drawn in `DES-0001` frame `room-brief-dialogs`. Ends at adding one active
Decision; editing the brief is [REQ-0002](REQ-0002-room-brief-in-room-settings.md).

## Non-goals

- Agents suggesting or adding decisions themselves — deferred by the requester.
- Converge writing to the brief — it never does today, and still does not.

## Behavior

1. The pin action's tooltip and label read `Pin to room brief`.
2. It opens the dialog titled `Pin to room brief`, with the line `Room:
   {room}. Adds one decision to the room brief that every agent gets on every
   turn.`, the field label `One decision for every agent` and today's one-line
   suggestion from one tool-less Claude Sonnet call, which the user accepts or
   edits. At most 200 characters
   ([PD-0003](../../../decisions/PD-0003-room-brief-behaviour-clarifications.md) item 9).
   The no-lasting-decision message and the empty-line message stay as today.
3. `Pin` appends the line to the end of the active Decisions and saves it;
   the conversation gains the note `Brief updated: Decisions`
   ([REQ-0001](REQ-0001-room-brief-delivered-every-turn.md) Behavior 8). The
   toast reads `Pinned to the room brief in {room}.`
4. If the Brief tab of that room has unsaved changes in the same window, the
   pin is saved at once (Behavior 3) and the line is also added to the open
   edit, as today. The next `Save brief` in that window keeps it and shows no
   outdated-edit message; `Discard changes` keeps it too, because it is
   already saved ([PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 4).
5. Every agent's next turn carries the new Decision (REQ-0001).

## Acceptance criteria

- [ ] Pin on a message → the dialog `Pin to room brief` opens with the room
      line of Behavior 2 and a suggested line, as today.
- [ ] Press `Pin` → the line is the last active Decision of the Room Brief,
      the conversation gains the note `Brief updated: Decisions`, the toast
      reads `Pinned to the room brief in {room}.`, and no agent turn starts.
- [ ] With unsaved Brief tab edits open in the same window, pin a message →
      the line is saved at once and appears in the edit; `Save brief` saves
      the edits with the line kept, with no outdated-edit message.
- [ ] The next agent turn after the pin → its prompt's Decisions list ends
      with the pinned line.
- [ ] composition: at 1440 wide, light theme (the display matrix of PD-0004),
      the dialog shows a 200-character line wrapped in full with no
      truncation, clipping or ellipsis, no horizontal scroll and no unbounded
      stretch.

## Sequencing

After [REQ-0001](REQ-0001-room-brief-delivered-every-turn.md) and
[REQ-0002](REQ-0002-room-brief-in-room-settings.md): the pin writes into the
saved Room Brief that REQ-0001 creates, and Behavior 4 and its criterion need
REQ-0002's Brief tab and its outdated-edit check. Released together with
REQ-0001 and REQ-0002 (REQ-0001 Sequencing).

## Technical constraints

From [technical/assessment.md](../technical/assessment.md), round 1:

- C-08 — the `Brief updated: Decisions` note comes from the server's save, not from the browser.
- C-11 — test on an isolated port with a copy of the room store, never `~/.parley-fork`.
- C-15 — the desktop app is repackaged with this change, once, after all three stories are on `main`.

## Observability

none — the timeline note records the change.

## Rollout

`coordinated`: released together with REQ-0001 and REQ-0002, after all three
are on `main` — one restart of the live server (by the requester), one
desktop repackage (C-15).

## Notes

Current pin behaviour is
[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md), "Pin".
Design reference: `DES-0001`, frame `room-brief-dialogs`.
