---
id: INIT-0015
type: initiative
title: Clone a room's setup into a new room with an empty chat
status: active
revision: 3
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
capabilities: [CAP-0002]
requirements: [REQ-0004]
tickets: [PRL-4]
decisions: [PD-0003, PD-0004, PD-0006, PD-0007, PD-0009, PD-0010]
---

# INIT-0015 — Clone a room's setup into a new room with an empty chat

## Outcome

When this is done, the user can start a fresh room set up like an existing
one without re-entering anything. One outcome element:

- **O1.** From any room's menu, in one short dialog, the user creates a new
  room with that room's agents (with their permissions), Room Brief Goal and
  Rules, room settings and project folder, an empty chat and fresh agent
  sessions, independent of the original from then on.

## Why now

The requester decided it in the room "Parlay Product Evolution"
([raw request](product/sources/raw-request.md), line 4).

## Scope

In scope:

- `Clone room setup…` in each room's Room actions menu, and its one short
  dialog: name, Goal, project folder, one line on what carries over
  ([PD-0007](../../decisions/PD-0007-clone-room-setup-requester-decisions.md)).
- Creating the new room from the original's saved setup, with an empty chat,
  fresh sessions, nothing started and nothing commissioned.
- The details of [PD-0010](../../decisions/PD-0010-clone-room-setup-behaviour-rulings.md)
  (which supersedes PD-0008), built as a server-side copy
  ([PD-0009](../../decisions/PD-0009-clone-room-setup-chosen-option-server-side.md)).

Out of scope:

- **Templates** and **syncing between rooms** ([raw request](product/sources/raw-request.md), "Out of scope").
- **Copying Decisions, or an option to** — open question
  [Q-0001](../../questions/Q-0001-copy-decisions-option.md), default no.
- **Copying the conversation, activity, agent sessions, pending work, past
  approvals, handoffs, Desktop links or the room's `workspace/` files.**
- **Separate project memory** — rooms on one folder share its files.
- **A clone action in Room settings or for archived rooms.**
- **Other widths and dark mode** as designed or reviewed surfaces
  ([constraints](../../project/constraints.md) #3).
- **New unit or smoke test suites** ([raw request](product/sources/raw-request.md), "Done means").

## Success measures

From [the raw request](product/sources/raw-request.md), "Done means", shown by
one check:

- The clone's agents, Goal and Rules match the original.
- Its chat is empty and its agent sessions are fresh.
- Editing the clone leaves the original unchanged.
- Creating it starts no agent and commissions no work.

## Product constraints

- Never touch or restart the live server on port 4142; never use 4141; test on
  an isolated port with a copy of the room store ([constraints](../../project/constraints.md) #1).
- Plain `ui/index.html`, `ui/app.js`, `ui/styles.css`; no React, Storybook or
  build step (#2).
- Designed at 1440 wide, light theme only (#3); reuse the Create room
  dialog's look; no canvas ([raw request](product/sources/raw-request.md), "Constraints").
- Nothing pushed; delivery by local `main` merge, like PRL-1..PRL-3
  ([run instructions](product/sources/run-instructions.md)).

## Requirements

| `REQ-` | Outcome element | Title |
| --- | --- | --- |
| [REQ-0004](requirements/REQ-0004-clone-room-setup.md) | O1 | The user clones a room's setup into a new room with an empty chat, from the room's menu |

## Capabilities affected

[CAP-0002](../../capabilities/CAP-0002-room-creation-and-setup.md) — room
creation gains a clone path. [CAP-0001](../../capabilities/CAP-0001-room-shared-context.md)
(Room Brief) is read, not changed.

## Open questions

[Q-0001](../../questions/Q-0001-copy-decisions-option.md) — option to copy
Decisions; `important`, non-blocking, default no.

## Scope log

| Date | Revision | Change | Reason |
| --- | --- | --- | --- |
| 2026-11-06 | 1 | Created at INTAKE (`new-initiative`) | Raw request from the requester |
| 2026-11-06 | 2 | Outcome, scope, out-of-scope, success measures and one draft requirement | PRODUCT_DEFINITION |
| 2026-11-06 | 3 | Chosen option A (PD-0009); behaviour rulings PD-0010 supersede PD-0008; scope unchanged | SOLUTION_CONVERGENCE |
