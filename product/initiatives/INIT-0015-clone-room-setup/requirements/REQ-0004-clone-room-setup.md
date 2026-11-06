---
id: REQ-0004
type: requirement
title: The user clones a room's setup into a new room with an empty chat, from the room's menu
status: draft
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0015
outcome_element: "O1 — From any room's menu, in one short dialog, the user creates a new room with that room's agents, Goal, Rules, room settings and project folder, an empty chat and fresh agent sessions, independent of the original from then on."
acceptance:
  - "Open Room actions on a room row → the menu lists Clone room setup… beside Archive and Rename"
  - "Choose Clone room setup… → the dialog Clone room setup opens with From {room}, the name {room} copy (or the first free copy N), the original's Goal, the original's project folder and the one line of PD-0008 item 10"
  - "Press Cancel, ×, Escape or click outside → no room is created and the room list is unchanged"
  - "Press Create room → the new room opens; every agent setup value, the Rules and every room setting equal the original's; the Goal and folder equal the dialog's; it has no Decisions"
  - "Press Create room → the new room's conversation is empty, no agent has a session, no agent process starts, nothing is sent, and the original room's files are byte-identical to before"
  - "Change the clone's Goal, an agent's model and send it a message → the original room's setup, Room Brief and conversation are unchanged"
  - "composition: at 1440 wide, light theme, the dialog with a 40-character name, a 2,000-character Goal and a 200-character folder path shows every field and the one line in full, with no truncation, clipping or horizontal scroll"
capabilities: [CAP-0002]
design_refs: []
decisions: [PD-0003, PD-0007, PD-0008]
depends_on: [none]
constraints: []
observability: []
rollout: none
readiness: not-assessed
tickets: []
supersedes:
superseded_by:
---

# REQ-0004 — The user clones a room's setup into a new room with an empty chat, from the room's menu

## Requirement

From any room's menu, the user copies that room's setup — its agents with
their permissions, its Room Brief Goal and Rules, its room settings and its
project folder — into a new room, through one short dialog. The new room
starts with an empty chat and fresh agent sessions and is independent of the
original from then on
([PD-0007](../../../decisions/PD-0007-clone-room-setup-requester-decisions.md)).

## Scope

- The `Clone room setup…` item in the room list's Room actions menu.
- The `Clone room setup` dialog (name, Goal, project folder, the one line,
  Cancel, Create room), in the Create room dialog's look.
- The server side that creates the new room from the original's saved setup.
- Every detail of [PD-0008](../../../decisions/PD-0008-clone-room-setup-behaviour-clarifications.md).

## Non-goals

- Templates; syncing between rooms; any later link between the two rooms
  (PD-0007 item 6).
- Copying Decisions, or an option to
  ([Q-0001](../../../questions/Q-0001-copy-decisions-option.md), default no).
- Copying the conversation, activity, agent sessions, pending work, past
  approvals, handoffs, Desktop links or the room's `workspace/` contents.
- Separate project memory: rooms on one folder share its files.
- A clone action in Room settings or for archived rooms.
- Changes to Create room, Room settings or the Room Brief themselves.

## Behavior

1. Room actions on every room row (the default room too) lists
   `Clone room setup…` beside `Archive` and `Rename` (PD-0008 item 1).
2. It opens the dialog titled `Clone room setup`, with `From {room}` under the
   title and, in order:
   - **Room name**, pre-filled `{room} copy`, or `{room} copy 2`, `copy 3`…
     the first free name; shortened from the end of `{room}` to fit 40
     characters (PD-0008 item 4). Create room's name rules and duplicate
     message apply.
   - **Goal**, pre-filled with the original's Goal, editable, may be empty;
     typed text up to 2,000 characters; a longer copied Goal is kept as is
     (item 5).
   - **Project folder**, pre-filled with the original's (blank if none),
     changeable by typing or `Browse…`; blank means a new room workspace; a
     missing folder is refused with Create room's message (item 8).
   - The line, exact: `Copies the agents with their permissions, the Goal,
     Rules and room settings — not the chat, agent sessions, Decisions,
     pending work, approvals, handoffs or Desktop links.` (item 10).
   - Buttons `Cancel` and `Create room`; `Create room` is disabled while the
     name is blank (item 11).
3. `Cancel`, `×`, Escape or a click outside closes the dialog and creates
   nothing.
4. `Create room` creates the room from the original's setup as saved at that
   moment, with the dialog's name, Goal and folder (item 12):
   - every agent, with every setup value copied as is: name, provider, model,
     effort, Codex Fast mode, permissions (Claude permission mode, Codex
     sandbox), command, extra arguments, standing instructions, listening on
     or off, listening style and prompt, and asleep or awake (item 2);
   - every room setting: mode, hop budget, default agent, accounting, pair
     review rounds, reply timeout (item 3);
   - the Room Brief: the dialog's Goal, the original's Rules exactly as saved
     whatever their length, no Decisions (items 6, 7).
5. Nothing else is copied: no message, activity, native session, pending
   delivery, Converge or pair run, approval, handoff, Desktop link
   registration or `workspace/` file (items 2, 3, 8, 9).
6. The new room opens with an empty conversation — no message, note or card.
   No agent process starts and nothing is sent; an agent's first turn happens
   only when the user sends a message, and starts a new session that receives
   the clone's Room Brief (item 13).
7. The original room is not changed by cloning, and from then on neither
   room's settings, agents, Room Brief or conversation change the other's.
   Two rooms on the same folder still work on the same files.
8. A room with more than four agents: `Create room` fails with
   `Rooms support at most four agents.` and nothing is created (item 14).

## Acceptance criteria

- [ ] Open Room actions on any room row, the default room included → the
      menu lists `Clone room setup…` beside `Archive` and `Rename`.
- [ ] Choose `Clone room setup…` on room `R` → the dialog `Clone room setup`
      opens with `From R`, the name `R copy`, the Goal of `R`, the project
      folder of `R` (blank if none) and the exact line of Behavior 2.
- [ ] With a room `R copy` already present → the name pre-fills `R copy 2`;
      for a 40-character `R` → the pre-filled name is at most 40 characters
      and ends in ` copy`.
- [ ] Enter the name of an existing room and press `Create room` → Create
      room's duplicate-name message shows and no room is created.
- [ ] Press `Cancel`, `×`, Escape or click outside → no room is created and
      the room list is unchanged.
- [ ] Press `Create room` → the new room opens; for every agent, every value
      listed in Behavior 4 equals the original's; mode, hop budget, default
      agent, accounting, pair review rounds and reply timeout equal the
      original's; the Rules equal the original's character for character
      (including Rules longer than 8,000 characters); the Goal equals the
      dialog's (including a copied Goal longer than 2,000 characters left
      unedited); the Decisions list is empty; the folder is the dialog's.
- [ ] Press `Create room` → the new room's conversation shows no message,
      note or card, no agent has a native session, no agent process starts,
      nothing is sent to any provider, and the original room's `room.json`,
      `context.json`, `state.json`, `transcript.md` and `events.jsonl` are
      byte-identical to before.
- [ ] Clear the folder field and press `Create room` → the clone uses a new,
      empty room workspace; enter a folder that does not exist → Create
      room's folder message shows and no room is created.
- [ ] In the clone, change the Goal, change an agent's model and send that
      agent a message → its first turn starts a new session whose prompt
      carries the clone's Goal and Rules and no Decisions; the original
      room's setup, Room Brief and conversation are unchanged.
- [ ] Clone a room with five agents → `Create room` shows
      `Rooms support at most four agents.` and no room is created.
- [ ] composition: at 1440 wide, light theme (the display matrix of
      [PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md)
      item 3), the dialog with a 40-character name, a 2,000-character Goal
      and a 200-character folder path shows every field label, the one line
      in full and both buttons, with no truncation, clipping, ellipsis or
      horizontal scroll; the Room actions menu of a room with a 40-character
      name shows `Clone room setup…` in full.

## Sequencing

`depends_on: [none]`. Starts from `main` at or after `704039f`, where the Room
Brief (INIT-0014, PRL-1..PRL-3) is merged; the clone copies its Goal and
Rules.

## Technical constraints

_From the architect's assessment at SOLUTION_EXPLORATION._

## Observability

none — the new room appears in the room list; the done check reads the room
files directly.

## Rollout

none. The live server on port 4142 picks the change up only when the
requester restarts it; engineering never restarts it
([constraints](../../../project/constraints.md) #1).

## Notes

- Verification, as the requester set it: one check, on an isolated port with
  a copy of the room store, covering the four done criteria of PD-0007
  item 7 — the clone's agents, Goal and Rules match; its chat is empty and
  sessions fresh; editing the clone leaves the original unchanged; creating
  it starts no agent and commissions no work. No new unit or smoke suites.
- Current room creation: [CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md).
