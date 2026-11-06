---
initiative: INIT-0001
type: solution-contract
title: Solution contract — Every agent knows the room's goal, rules and decisions from one Room Brief
status: accepted
revision: 1
owner_role: ROLE-product-manager
drafted_by: ROLE-product-manager (inline, size rule §9d.2)
validated_by: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
chosen_decision: PD-0005
design_refs: [DES-0001]
---

# Solution contract — INIT-0001

Cites [PD-0005](../../../decisions/PD-0005-room-brief-chosen-option-brief-tab.md),
[PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) and the
hero frames recorded as `DES-0001`; where this contract and they differ, they
win.

## Chosen concept

Option B ([PD-0005](../../../decisions/PD-0005-room-brief-chosen-option-brief-tab.md)):
a Brief tab replaces the Direction tab in Room settings and holds the one Room
Brief — Goal, Rules, Decisions with archive — with its own Save brief, Discard
changes and Tidy; the Room tab loses its room-instructions field. The server
keeps one saved brief per room, migrates each room into it on first open, and
sends the whole brief, framed, on every agent turn.

## Key journeys

- Write the brief when creating a room: Goal (required) and Rules — [REQ-0002](../requirements/REQ-0002-room-brief-in-room-settings.md).
- Edit, archive, restore, delete, Tidy and preview on the Brief tab — REQ-0002.
- Pin a message into Decisions — [REQ-0003](../requirements/REQ-0003-pin-to-room-brief.md).
- Every agent turn carries the whole brief; existing rooms migrate with nothing lost — [REQ-0001](../requirements/REQ-0001-room-brief-delivered-every-turn.md).

## UX behavior

Defaults: Archived decisions and What agents see collapsed; Save brief disabled
until something changes. Ordering: active Decisions in the order added,
archived newest first. States: empty Goal (the ask), over the 2,000 guide
(warning, Save enabled), a part over its field limit (kept, can't grow),
repeated text (merge notice), unsaved changes (preview says so), outdated edit
(refused once, edits kept). Every saved change adds one timeline note. Exact
copy is in REQ-0002 and REQ-0003.

## Visual direction

none — reuses Parley's existing settings and dialog patterns and
`ui/styles.css`; Decision fields grow with their text so a 200-character line
wraps in full; the over-guide count uses a warning colour, not an error colour
(`DES-0001` hero approach notes).

## Accepted trade-offs

Against option A: one more tab, and the brief saves apart from the other room
settings, in exchange for never saving the brief with a session-resetting
settings save (A's C-13, R-6). Against the status quo: the whole brief costs
tokens on every turn (R-1), accepted by the requester in PD-0002.

## Unresolved risks

- R-1 per-turn cost at a long brief — the guide warning and archive are the
  levers; accepted.
- R-3 a crash midway through a room's migration — migration re-reads its
  original sources until a room is complete (REQ-0001 Behavior 6, C-04, C-05).
- R-4 browser tabs and desktop builds from before the change — reload tabs
  after the restart; repackage the desktop app (C-15).
- R-5 pinned lines become standing instructions — accepted (PD-0003 item 4).
- R-7 the transition line repeats after a failed turn — accepted in REQ-0001
  Behavior 5.

## DES- references

| DES- id | Local export | Requirements served |
| --- | --- | --- |
| DES-0001 | `design/heroes/room-brief-brief-panel.png`, `room-brief-dialogs.png` (+ `.dc.html`) under this initiative | REQ-0002, REQ-0003 |
