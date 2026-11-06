---
id: REQ-0002
type: requirement
title: The user edits one Room Brief in Room Settings and sees exactly what agents receive
status: accepted
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0014
outcome_element: "The user edits one Room Brief in Room Settings — Goal, Rules, Decisions with archive — and sees exactly what agents receive."
acceptance:
  - "Open Room settings → the tabs are Agents, Room and Brief; the Room tab has no room-instructions field"
  - "Edit the Goal, Rules and a Decision on the Brief tab and press Save brief → all three are saved and the conversation gains one note Brief updated: Goal, Rules, Decisions"
  - "Archive an active Decision and save → it moves to Archived decisions, stays saved, and is absent from What agents see"
  - "Brief over 2,000 counted characters → the length warning shows, Save brief stays enabled, and nothing is cut"
  - "Open What agents see → it shows, byte for byte, the block an agent receives"
  - "Save brief after the brief changed in another window → the outdated-edit message shows and the edits stay; Save brief again saves them"
  - "composition: at 1440 wide, light theme, with worst-case data, no horizontal scroll, no unbounded stretch and no Decision text truncated"
capabilities: [CAP-0001]
design_refs: [DES-0001]
decisions: [PD-0002, PD-0003, PD-0004, PD-0005, PD-0006]
depends_on: [REQ-0001]
constraints: [C-02, C-10, C-11, C-14, C-15]
observability: []
rollout: coordinated
readiness: engineering-ready
tickets: [PRL-2]
supersedes:
superseded_by:
---

# REQ-0002 — The user edits one Room Brief in Room Settings and sees exactly what agents receive

## Requirement

The user writes and edits a room's one Room Brief — Goal, Rules and Decisions,
with archive — in Room Settings and in the Create room dialog, and can see the
exact text every agent receives
([PD-0002](../../../decisions/PD-0002-room-brief-requester-decisions.md) items 1, 3, 5, 7).

## Scope

The Room settings Brief tab (replacing the Direction tab), the Room tab losing
its room-instructions field, and the Create room dialog's brief fields, as
drawn in `DES-0001` frames `room-brief-brief-panel` and `room-brief-dialogs`.
Ends at the surfaces, plus the server side of "What agents see": the
preview is built by the delivery composition run on the form's current,
unsaved contents (C-02), and that is this story's work. Storage, delivery,
the save rules, the timeline note and `/note` are
[REQ-0001](REQ-0001-room-brief-delivered-every-turn.md); the pin dialog is
[REQ-0003](REQ-0003-pin-to-room-brief.md).

## Non-goals

- Agent-suggested decisions — deferred by the requester.
- Per-agent instructions on the Agents tab — unchanged.
- Other widths and dark mode as designed surfaces — they follow from the
  existing CSS ([PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md) item 3).

## Behavior

1. **Tabs** ([PD-0005](../../../decisions/PD-0005-room-brief-chosen-option-brief-tab.md)).
   Room settings shows Agents, Room and Brief. The Brief tab replaces the
   Direction tab. The Room tab loses its "Shared room instructions" field and
   its note; everything else on it is unchanged. There is one field per part
   of the brief, anywhere in the app
   ([PD-0002](../../../decisions/PD-0002-room-brief-requester-decisions.md) item 3).
2. **Brief tab, top to bottom** (`DES-0001`, `room-brief-brief-panel`).
   - Heading `Room brief` and the note `Every agent gets this whole brief —
     goal, rules and active decisions — on every turn. Edits apply on each
     agent's next turn.`
   - **Goal** — a text field, placeholder `What should this room achieve?`.
     While the saved Goal is empty, the field shows the ask `No goal yet. Add
     one so every agent knows what this room should achieve.` Saving with an
     empty Goal is allowed ([PD-0003](../../../decisions/PD-0003-room-brief-behaviour-clarifications.md) item 1).
   - **Rules** — a text field, placeholder `How agents behave and work
     together…`.
   - **Decisions** — the active Decisions in the order added, each with its
     full text editable and wrapped (never cut off) and an `Archive` action;
     below them an input `Add a one-line decision…` with `Add`. With none:
     `No decisions yet. Pin a message, or add one here.`
   - **Archived decisions (n)** — collapsed by default, hidden when n is 0,
     with the note `Kept, not sent to agents.`; newest-archived first, each
     read-only with `Restore` (back to the end of the active list) and
     `Delete`. Delete asks `Delete this archived decision? It can't be
     restored.` with `Delete` and `Cancel` (PD-0003 item 3). An active
     Decision has no Delete.
   - **Merge suggestion** — while the rule of PD-0003 item 6 matches, a
     notice: `Some text appears in more than one part of the brief ({parts}).
     You may want to keep it in one place; agents get every part either way.`
     where `{parts}` is `Goal and Rules`, `a decision and Rules` or `Goal and a
     decision`, listing every matching pair. It never blocks Save and offers no
     automatic merge.
   - **Length** — a count always visible: `{n} characters · guide about
     2,000`, where n is the count of PD-0003 item 5 (Parley's wording and
     headings not counted). Above 2,000 the count turns to the warning colour
     and a warning shows: `This brief is longer than the 2,000-character guide
     (about 500 tokens), and every agent reads all of it on every turn.
     Consider archiving decisions you no longer need or trimming the rules.
     Nothing is cut automatically.` Save stays enabled; nothing is cut
     ([PD-0002](../../../decisions/PD-0002-room-brief-requester-decisions.md) item 5).
   - **Over a field limit** — under a part already stored above its PD-0003
     item 9 limit: `This is longer than the {limit}-character limit for new
     text. It is kept and sent as is; it can't grow further.`
     ([PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 2).
   - **What agents see** — collapsed by default; when opened, the block
     exactly as an agent receives it — PD-0003 item 4 wording with Parley's
     line marks (PD-0006 item 1) — built from the form's current contents by
     the same composition delivery uses, read-only, line breaks kept. With
     unsaved changes it adds `Includes unsaved changes.` above the block.
   - **Old saved brief** — shown as today when the room has one; its note ends
     `Copy anything still useful into the room brief.` (PD-0003 item 10).
   - **Actions** — `Tidy`, `Discard changes` (only with unsaved changes) and
     `Save brief` (primary; disabled with no unsaved changes). After a save:
     `Saved. Each agent gets the new brief on its next turn.`
   - **Agent sessions and context events** — stays below the brief, collapsed,
     as on today's Direction tab.
3. **One save.** Edits, adds, archive, restore and delete are unsaved changes
   until `Save brief`, which saves all three parts at once under the save
   rules of [REQ-0001](REQ-0001-room-brief-delivered-every-turn.md) Behavior 7;
   the timeline note follows from REQ-0001 Behavior 8. An unsaved edit is never
   overwritten by another change arriving (as today). If the saved brief
   changed after the user started editing, `Save brief` shows `The brief
   changed since you started editing. Your edits are still here — review them
   and press Save brief again.` and saves nothing; the next `Save brief` saves
   the edit as shown (PD-0006 item 4).
4. **Tidy** follows PD-0003 item 2. While it runs: `Asking Claude Sonnet for a
   shorter goal and decisions…`. When loaded: `Tidy suggestion loaded. Rules
   are unchanged; decisions it leaves out move to Archived when you save.
   Review it, then Save brief or Discard changes.` Tidy with unsaved changes
   shows `Save or discard your changes before Tidy.` (as today).
5. **Create room dialog** (`DES-0001`, `room-brief-dialogs`). The "Shared room
   instructions" field is replaced by **Goal** (marked required; placeholder
   `What should this room achieve?`) and **Rules** (marked optional;
   placeholder `How agents behave and work together…`), with the note `Every
   agent gets the room brief on every turn. You can add decisions later by
   pinning messages.` Create stays disabled until the Goal has non-blank text
   (PD-0003 item 1). The new room starts with that Goal, those Rules and no
   Decisions.
6. **Limits** are PD-0003 item 9 — Goal 2,000, Rules 8,000, each Decision 200
   characters — and stop typing past them; a part already stored above its
   limit follows the over-limit line above. No other limit.

## Acceptance criteria

- [ ] Open Room settings → the tabs are Agents, Room and Brief; the Room tab
      has no room-instructions field.
- [ ] Edit the Goal, Rules and a Decision on the Brief tab and press `Save
      brief` → all three are saved, the conversation gains one note `Brief
      updated: Goal, Rules, Decisions`, and no agent turn starts.
- [ ] Clear the Goal and save → the save succeeds and the field shows `No goal
      yet. Add one so every agent knows what this room should achieve.`
- [ ] Archive an active Decision and save → it moves to Archived decisions,
      stays saved, and is absent from What agents see.
- [ ] Restore an archived Decision and save → it is the last active Decision.
- [ ] Delete an archived Decision → the confirmation shows; Cancel keeps it;
      Delete then Save removes it.
- [ ] A Goal, Rules and active Decisions totalling 2,001 counted characters →
      the length warning shows with its exact copy, `Save brief` stays enabled,
      and after saving every character is kept.
- [ ] A Goal of at least 20 characters that also appears in Rules → the merge
      notice names `Goal and Rules`; Save still works with both copies kept.
- [ ] Open What agents see → it shows, byte for byte, the block an agent
      receives on its next turn (checked against one prompt after saving).
- [ ] Press Tidy on a brief with Rules and three active Decisions → Rules are
      unchanged in the loaded suggestion; on Save, each Decision left out is in
      Archived decisions.
- [ ] Open the Brief tab in two windows, save a change in one, then press
      `Save brief` in the other → the outdated-edit message shows and the
      edits stay on screen; press `Save brief` again → the edits are saved.
- [ ] A room whose stored Rules are longer than 8,000 characters → the
      over-limit line shows under Rules, and saving a Goal change keeps every
      character of Rules.
- [ ] Create room with an empty Goal → Create is disabled; type a Goal →
      Create is enabled and the new room's brief has that Goal and Rules.
- [ ] composition: at 1440 wide, light theme (the display matrix of PD-0004),
      the Room settings Brief tab and the Create room dialog render inside the
      settings dialog with no horizontal scroll, no unbounded stretch and no
      interior chasm, at worst-case data: a 2,000-character Goal,
      8,000-character Rules, 25 active Decisions and 10 archived Decisions of
      200 characters each. Every Decision's full text wraps and none is
      truncated, clipped or ellipsised; the count shows the whole number
      (`15,000 characters · guide about 2,000`).

## Sequencing

After [REQ-0001](REQ-0001-room-brief-delivered-every-turn.md): this story edits
the saved Room Brief that REQ-0001 creates, under its save rules, and its
preview shows the block REQ-0001 delivers. Released together with REQ-0001
and REQ-0003 (REQ-0001 Sequencing). [REQ-0003](REQ-0003-pin-to-room-brief.md)
comes after this story.

## Technical constraints

From [technical/assessment.md](../technical/assessment.md), round 1:

- C-02 — "What agents see" shows the block from the same composition delivery uses, framing included; no second copy of the text in the browser that can drift.
- C-10 — the client's 2,000 Save gate is removed; the count follows PD-0003 item 5.
- C-11 — test on an isolated port with a copy of the room store, never `~/.parley-fork`.
- C-14 — existing browser and smoke checks that assert the Direction tab and room note are updated with the code; that is not a new suite.
- C-15 — the desktop app is repackaged with this change, once, after all three stories are on `main`.

## Observability

none — the timeline note of REQ-0001 records every saved change.

## Rollout

`coordinated`: released together with REQ-0001 and REQ-0003, after all three
are on `main` — one restart of the live server (by the requester), one
desktop repackage (C-15). Reload open browser tabs after the restart (R-4).

## Notes

Current Direction tab, Room tab and Create room behaviour is
[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md). Design
reference: `DES-0001` (hero frames; where a frame and this story differ, this
story wins — PD-0004 item 2). Plain `ui/index.html`, `ui/app.js`,
`ui/styles.css` ([constraints](../../../project/constraints.md) #2). Testing
is a manual pass on an isolated port; no new unit or smoke suites.
