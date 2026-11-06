---
initiative: INIT-0001
type: product-definition-contract
title: Product definition contract — Every agent knows the room's goal, rules and decisions from one Room Brief
status: accepted
revision: 1
owner_role: ROLE-product-manager
drafted_by: ROLE-product-manager (inline, size rule §9d.2)
validated_by: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
requirements: [REQ-0001, REQ-0002, REQ-0003]
open_questions: []
decisions: [PD-0001, PD-0002, PD-0003]
raw_sources: [sources/raw-request.md, sources/run-instructions.md]
---

# Product definition contract — INIT-0001

A contract cites raw sources; it never supersedes them. Where this contract and
[the raw request](sources/raw-request.md) differ, the raw request wins and this
contract is the defect.

## Problem

"Room direction and room instructions (room note) overlap and clash. A goal in
Direction was not known to agents, but the same text in the room note was."
([raw request](sources/raw-request.md), "Problem").

## Actors

- The room owner (the requester): writes the room's goal, rules and decisions.
- The room's agents (Claude, Codex, Gemini seats): read them on every turn.

## Current behavior

[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md): a room note
sent in full only when short, fresh or changed, else a reminder line; a room
direction (Goal + Decisions, 2,000-character hard cap) sent in full once per
session, then a reminder; Pin and Tidy feed the direction.

## Desired outcomes

The three outcome elements of [the initiative](../initiative.md), "Outcome":
O1 (whole brief delivered in full every turn, migrated with nothing lost), O2
(one Room Brief edited in Room Settings, with archive and the exact-text
preview), O3 (pinning adds a Decision).

## Requirements

| REQ- id | Status | One-line statement |
| --- | --- | --- |
| [REQ-0001](../requirements/REQ-0001-room-brief-delivered-every-turn.md) | draft | Every agent gets the whole Room Brief in full on every turn, migrated from each room's direction, pins and note |
| [REQ-0002](../requirements/REQ-0002-room-brief-in-room-settings.md) | draft | The user edits one Room Brief in Room Settings and sees exactly what agents receive |
| [REQ-0003](../requirements/REQ-0003-pin-to-room-brief.md) | draft | Pinning a message adds it to the Room Brief's Decisions |

## Constraints

- [constraints](../../../project/constraints.md) #1 — never touch 4142, never
  use 4141, test on an isolated port.
- #2 — plain `ui/` HTML, JS and CSS; no React, Storybook or build step.
- #3 — design at 1440, light only.
- [PD-0001](../../../decisions/PD-0001-accept-mission-and-first-principles.md)
  — only the user changes the brief; nothing is cut automatically.
- Engineering rebases on "brief-delivery" after it lands on `main`
  ([raw request](sources/raw-request.md), "Constraints").

## Known facts

- The goal-in-Direction failure is the requester's observation
  ([raw request](sources/raw-request.md), "Problem").
- Note and direction delivery today: `parley.mjs` `roomNoteBlock`,
  `directionBlock` at `d07a67d` (CAP-0001).
- A separate session is changing that delivery now (uncommitted `parley.mjs`
  in the main checkout, 2026-11-06; [state](state.md), "Discovery").

## Rejected assumptions

- "A goal is required everywhere" — rejected by "never reject a migrated room
  for lacking a Goal" ([raw request](sources/raw-request.md); PD-0003).
- "2,000 characters is a cap" — the requester made it a guide.

## Open questions

none.

## Decisions already made

[PD-0002](../../../decisions/PD-0002-room-brief-requester-decisions.md)
(requester's decisions), [PD-0003](../../../decisions/PD-0003-room-brief-behaviour-clarifications.md)
(behaviour the requester left open).

## Raw-source citations

- [sources/raw-request.md](sources/raw-request.md) — the requester's brief, verbatim.
- [sources/run-instructions.md](sources/run-instructions.md) — the launching instructions, verbatim.

## Non-goals

Agent-suggested decisions; per-agent instructions; automatic cutting; a hard
length limit; other widths and dark mode as designed surfaces; new unit or
smoke suites; the "brief-delivery" work itself
([initiative](../initiative.md), "Out of scope").
