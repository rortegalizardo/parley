---
id: INIT-0014
type: initiative
title: Every agent knows the room's goal, rules and decisions from one Room Brief
status: active
revision: 3
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
capabilities: [CAP-0001]
requirements: [REQ-0001, REQ-0002, REQ-0003]
tickets: []
decisions: [PD-0001, PD-0002, PD-0003, PD-0004, PD-0005, PD-0006]
---

# INIT-0014 — Every agent knows the room's goal, rules and decisions from one Room Brief

## Outcome

When this is done, a room has one Room Brief — Goal, Rules and Decisions —
written once by the user, and every agent in the room holds all of it on every
turn, whatever its session remembers. Three outcome elements:

- **O1.** Every agent receives the room's whole Room Brief — Goal, Rules and
  active Decisions, migrated from each room's existing direction, pins and room
  note with nothing lost — in full on every turn.
- **O2.** The user edits one Room Brief in Room Settings — Goal, Rules,
  Decisions with archive — and sees exactly what agents receive.
- **O3.** The user adds a Decision to the Room Brief by pinning a message, as
  pinning works today.

## Why now

The requester found that a goal written in the room Direction was not known to
agents, while the same text in the room note was
([raw request](product/sources/raw-request.md), "Problem").

## Scope

In scope:

- One Room Brief per room with three parts, replacing the room note and the
  room direction as separate things ([PD-0002](../../decisions/PD-0002-room-brief-requester-decisions.md)).
- Delivery of the whole brief, in full, on every agent turn, with edits taking
  effect on each agent's next turn and no restart.
- One-time migration of every existing room: direction goal → Goal, pins →
  Decisions, room note → Rules, content kept as is.
- Room Settings and Create room surfaces for the brief: archive and restore of
  Decisions, the length guide warning, the "What agents see" preview, the merge
  suggestion, Tidy, a timeline note per edit.
- Pinning a message into the brief's Decisions, and `/note` acting on Rules.
- The behaviour details of [PD-0003](../../decisions/PD-0003-room-brief-behaviour-clarifications.md)
  and [PD-0006](../../decisions/PD-0006-room-brief-platform-rulings.md), on the
  Brief tab chosen in [PD-0005](../../decisions/PD-0005-room-brief-chosen-option-brief-tab.md).

Out of scope:

- **Agent-suggested decisions** — deferred by the requester; only the user
  edits the brief ([raw request](product/sources/raw-request.md)).
- **Per-agent standing instructions** — they stay in each agent's settings,
  unchanged.
- **Any automatic cutting, shortening or deleting** of brief text
  ([principles](../../project/principles.md)).
- **A hard length limit** on the brief — 2,000 characters is a guide.
- **Other widths and dark mode** as designed or reviewed surfaces
  ([constraints](../../project/constraints.md) #3).
- **New unit or smoke test suites** ([raw request](product/sources/raw-request.md), "Done means").
- **The separate "brief-delivery" engineering work** on `parley.mjs` — landed
  first on its own (`b6591be` on local `main`); this initiative builds on it.

## Success measures

From [the raw request](product/sources/raw-request.md), "Done means":

- A new and an existing agent can each repeat the current goal, decisions and
  rules — also after an edit, and after compaction or a session restart.
- The goal never has to be copied into Rules.
- Checked by one quick prompt check that the full brief is in the prompt after
  a session restart, plus one manual repeat of the user's test room.

## Product constraints

- Never touch or restart the live server on port 4142; never use 4141; test on
  an isolated port ([constraints](../../project/constraints.md) #1).
- Plain `ui/index.html`, `ui/app.js`, `ui/styles.css`; no React, Storybook or
  build step (#2).
- Designed at 1440 wide, light theme only (#3).
- Engineering starts from `main` at or after `b6591be`, the landed
  "brief-delivery" work ([raw request](product/sources/raw-request.md), "Constraints";
  [assessment](technical/assessment.md) C-12).

## Requirements

| `REQ-` | Outcome element | Title |
| --- | --- | --- |
| [REQ-0001](requirements/REQ-0001-room-brief-delivered-every-turn.md) | O1 | Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note |
| [REQ-0002](requirements/REQ-0002-room-brief-in-room-settings.md) | O2 | The user edits one Room Brief in Room Settings and sees exactly what agents receive |
| [REQ-0003](requirements/REQ-0003-pin-to-room-brief.md) | O3 | Pinning a message adds it to the Room Brief's Decisions |

## Capabilities affected

[CAP-0001](../../capabilities/CAP-0001-room-shared-context.md) — room note,
room direction, Pin, Tidy and `/note` become the Room Brief.

## Open questions

None.

## Scope log

| Date | Revision | Change | Reason |
| --- | --- | --- | --- |
| 2026-11-06 | 1 | Created at INTAKE (`new-initiative`) | Raw request from the requester |
| 2026-11-06 | 2 | Outcome, scope, out-of-scope, success measures and three draft requirements | PRODUCT_DEFINITION |
| 2026-11-06 | 3 | Option B chosen (PD-0005); platform rulings (PD-0006); brief-delivery landed as `b6591be` | SOLUTION_CONVERGENCE |
