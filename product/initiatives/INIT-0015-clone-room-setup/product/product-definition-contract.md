---
initiative: INIT-0015
type: product-definition-contract
title: Product definition contract — Clone a room's setup into a new room with an empty chat
status: accepted
revision: 1
owner_role: ROLE-product-manager
drafted_by: ROLE-product-manager (inline, size rule §9d.2)
validated_by: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
requirements: [REQ-0004]
open_questions: [Q-0001]
decisions: [PD-0003, PD-0007, PD-0008]
raw_sources: [sources/raw-request.md, sources/run-instructions.md]
---

# Product definition contract — INIT-0015

> A contract cites raw sources; it never supersedes them. A drift between
> this file and the raws is a defect in this file.

## Problem

Starting a fresh room set up like an existing one means re-entering every
agent, permission, instruction, the Goal, Rules, folder and settings by hand
in Create room ([raw request](sources/raw-request.md), "Decision to build";
[CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md)).

## Actors

- The room owner (Ricardo), who clones the room.
- The clone's agents, which start with the copied setup and a fresh session.

## Current behavior

[CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md): rooms
are created only through Create room (or the API); there is no copy.

## Desired outcomes

O1 — From any room's menu, in one short dialog, the user creates a new room
with that room's agents, Goal, Rules, room settings and project folder, an
empty chat and fresh agent sessions, independent of the original from then on
([initiative](../initiative.md) `## Outcome`).

## Requirements

| REQ- id | Status | One-line statement |
| --- | --- | --- |
| REQ-0004 | draft | The user clones a room's setup into a new room with an empty chat, from the room's menu |

## Constraints

- [constraints](../../../project/constraints.md) #1 — never touch port 4142, never use 4141; test on an isolated port.
- #2 — plain `ui/index.html`, `ui/app.js`, `ui/styles.css`; no React, Storybook or build step.
- #3 — design at 1440 wide, light only.
- [PD-0003](../../../decisions/PD-0003-room-brief-behaviour-clarifications.md) items 1 and 9 — Goal required only in Create room; per-field limits for new text.
- Principle 2 — never cut the user's saved text ([principles](../../../project/principles.md)).

## Known facts

- Copied and not copied, the flow, independence and the wording rule: [raw request](sources/raw-request.md), "Decision to build".
- Done means one check covering four criteria; no new suites: [raw request](sources/raw-request.md), "Done means"; [run instructions](sources/run-instructions.md).
- Proportionate: one menu item and one small dialog, reusing Create room's look, at 1440 light, no canvas: [raw request](sources/raw-request.md), "Constraints".
- Rooms today hold 2, 3, 4 and 4 agents; the live room's Rules mention `@desktop:planner` (read-only look at `~/.parley-fork`, 2026-11-06).

## Rejected assumptions

- "Room settings" is only mode, hop budget and default agent — rejected in [PD-0008](../../../decisions/PD-0008-clone-room-setup-behaviour-clarifications.md) item 3 (the requester asked for the room's setup).
- The dialog must require a Goal — rejected, PD-0008 item 5 (PD-0003 item 1).

## Open questions

- [Q-0001](../../../questions/Q-0001-copy-decisions-option.md) — option to copy Decisions; `important`, non-blocking, default no.

## Decisions already made

[PD-0007](../../../decisions/PD-0007-clone-room-setup-requester-decisions.md) (the requester's decisions);
[PD-0008](../../../decisions/PD-0008-clone-room-setup-behaviour-clarifications.md) (fourteen details, PM under §4.1);
[PD-0003](../../../decisions/PD-0003-room-brief-behaviour-clarifications.md) items 1, 9;
[PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md) item 3 (display matrix).

## Raw-source citations

- `product/initiatives/INIT-0015-clone-room-setup/product/sources/raw-request.md`
- `product/initiatives/INIT-0015-clone-room-setup/product/sources/run-instructions.md`

## Non-goals

Templates; syncing between rooms; copying Decisions or an option to; copying
the conversation, activity, sessions, pending work, approvals, handoffs,
Desktop links or `workspace/` files; separate project memory; a clone action
in Room settings or for archived rooms; changes to Create room, Room settings
or the Room Brief.

## Validation

Validated by the PM on 2026-11-06 against both raw sources, item by item:
every "Copied", "NOT copied", "Flow", "Independent", "Out of scope", "Done
means" and "Constraints" line of the raw request maps to PD-0007 and to
REQ-0004 Behavior 1–8 or Non-goals; nothing dropped, softened or added beyond
PD-0008's recorded clarifications.
