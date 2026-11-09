---
id: PD-0009
type: decision
title: Clone room setup is a server-side copy (option A); its design reference is one static frame at 1440 light
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0002, CAP-0002]
supersedes:
superseded_by:
---

# PD-0009 — Clone room setup is a server-side copy (option A); its design reference is one static frame at 1440 light

Decided by `ROLE-product-manager` at SOLUTION_CONVERGENCE under §4.1: the
options differ in internal shape, and A is the one that keeps the accepted
outcome intact ([PD-0010](PD-0010-clone-room-setup-behaviour-rulings.md)
items 5, 6 and 12).

## Context

The architect found both options feasible-with-constraints, band
multi-component, and recommended A
([assessment](../initiatives/INIT-0002-clone-room-setup/technical/assessment.md);
INIT-0002 `## Options`). Both give the user the same menu item, dialog and new
room. The design look is fixed by the requester: reuse the Create room
dialog's styling, 1440 light, no canvas
([raw request](../initiatives/INIT-0002-clone-room-setup/product/sources/raw-request.md), "Constraints").

## Decision

1. **Option A, server-side clone.** The dialog sends the original room's name
   and the dialog's name, Goal and project folder. Parley's server reads the
   original's saved setup at the moment `Create room` is pressed and makes the
   new room from it. The original's Rules and agent setup never pass through
   the browser. Create room keeps its own behaviour and request shape.
2. **Binding constraints carried to engineering** (assessment `## Constraints`):
   C-01 (every copied value is in place when the room is created; no
   conversation note), C-02 (permanent: run state is never copied between
   rooms; sleep is the one exception, by PD-0010 item 2), C-03 (the brief is
   made through the new-room path), C-04 (a fixed list of setup values, never a
   copy of files or folders), C-05 (reading the original neither activates it
   nor writes to it), C-06 (Create room's checks and messages), C-07 (an open
   older tab keeps working, or the protocol is bumped), C-08 (the Goal field
   keeps an over-2,000 pre-fill), C-12 and C-13 (verification setup). C-09 to
   C-11 apply to B only and are not carried.
3. **Design reference.** One static frame at 1440 wide, light theme, linking
   Parley's own `ui/styles.css`: the room list with one row's Room actions
   menu open showing `Clone room setup…`, and the `Clone room setup` dialog
   filled with a long name, a long Goal and a long folder. Recorded as a
   `DES-` with the frame's HTML and PNG as its `local_export`. Steps 1a–1b do
   not run (derivative work, one direction); production steps 2a–10 do not
   run, for the reasons [PD-0004](PD-0004-room-brief-design-depth-and-display-matrix.md)
   item 1 gives (constraints #2). Engineering builds from that `DES-` and
   REQ-0004's acceptance criteria; where they differ, the requirement wins.

## Options considered

| Option | Why not |
| --- | --- |
| B — browser-assembled clone posted to a widened `POST /api/rooms` | Misses a change saved to the original between opening the dialog and `Create room` (C-10); keeps over-limit text only if the server re-reads the original anyway (C-09); otherwise opens a way around the PD-0006 item 2 limits for every API caller (PC-02); widens Create room's contract with permissions and command; lists the copied fields in two places, so a later field could be silently left out (R-02). No user gain over A. |
| Full design production path (plan, components, compose, sign-off, code `DES-`) | Needs React and Storybook Parley must not have (constraints #2); the requester asked for one menu item and one small dialog. |
| No design frame | REQ-0004 changes two surfaces; without a frame there is no reference for them (readiness `R4`). |

## Consequences

Costs: one new server action. Benefits: every PD-0010 item is met as written;
Create room is untouched; one place lists what a clone copies. Risks carried
into the story: R-01 (copy the C-04 list, not files: else the clone could
resume the original's session), R-03 (take the "before" copy of the original
after it has been loaded once), R-04 (choose the pre-filled name ignoring
case).

## Provenance

Context digest at decision: `e1586e7ff9742488` (SOLUTION_CONVERGENCE entry).
