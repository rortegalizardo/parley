---
initiative: INIT-0015
type: solution-contract
title: Solution contract — Clone a room's setup into a new room with an empty chat
status: accepted
revision: 1
owner_role: ROLE-product-manager
drafted_by: ROLE-product-manager (inline, size rule §9d.2)
validated_by: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
chosen_decision: PD-0009
design_refs: []
---

# Solution contract — INIT-0015

Cites [PD-0009](../../../decisions/PD-0009-clone-room-setup-chosen-option-server-side.md)
(chosen option and design depth),
[PD-0010](../../../decisions/PD-0010-clone-room-setup-behaviour-rulings.md)
(behaviour) and [PD-0007](../../../decisions/PD-0007-clone-room-setup-requester-decisions.md)
(the requester's decisions). Where this contract and they differ, they win.

## Chosen concept

Option A, a server-side clone (PD-0009 item 1). The room list's Room actions
menu gains `Clone room setup…`; it opens one short dialog in Create room's
look. On `Create room`, Parley's server reads the original's saved setup at
that moment and makes a new room from a fixed list of setup values, with the
dialog's name, Goal and folder, an empty conversation and no agent sessions.

## Key journeys

- Clone a room: Room actions → `Clone room setup…` → check or change name,
  Goal and folder → `Create room` → the new room opens, empty
  ([REQ-0004](../requirements/REQ-0004-clone-room-setup.md) Behavior 1–6).
- Back out: `Cancel`, `×` or Escape → nothing is created (Behavior 3).
- Refused: a duplicate name, a missing folder or more than four agents shows
  Create room's message and creates nothing (Behavior 2, 8).

## UX behavior

Defaults: name `{room} copy` (first free, ignoring case, fitted to 40
characters); Goal and folder pre-filled from the original; the one line of
PD-0010 item 10 under the fields. `Create room` is disabled while the name is
blank. A pre-filled Goal over 2,000 characters is kept, can only be
shortened, and shows the PD-0006 item 2 note. A click outside does nothing.
After Create the new room opens with nothing in its conversation and nothing
running (PD-0010 items 4, 5, 11, 13). Display matrix: 1440 wide, light theme
([PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md) item 3).

## Visual direction

`none — reuses existing patterns`: the Room actions menu's item style and the
Create room dialog's styling in `ui/styles.css`. No new pattern.

## Accepted trade-offs

Against option B: one new server action instead of widening Create room's
request, in exchange for an exact copy at the moment of Create, over-limit
Goal and Rules kept without a way around the limits, and one list of copied
fields (state.md `## Options`; PD-0009 "Options considered"). Design depth:
one static reference frame, no code-level design review (PD-0009 item 3).

## Unresolved risks

- R-01 — a whole-object or file copy would carry the original's session or
  pending catch-up; resolved by C-04 and checked by the one verification.
- R-03 — the original's files may be normalized on their first load; the
  verification takes its "before" copy after that load.

## DES- references

The reference frame of PD-0009 item 3 is drawn and recorded at
DECOMPOSITION; this table is filled then.

| DES- id | Local export | Requirements served |
| --- | --- | --- |
| pending (DECOMPOSITION) | — | REQ-0004 |

## Validation

Validated by the PM on 2026-11-06 against PD-0009, PD-0010, PD-0007 and
[technical/assessment.md](../technical/assessment.md): every journey and
behaviour above maps to a PD-0010 item or a REQ-0004 Behavior line; nothing
added beyond them.
