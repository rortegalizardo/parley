---
id: PD-0007
type: decision
title: Clone room setup — a one-time copy of a room's setup into a new room with an empty chat, from the room's menu
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

# PD-0007 — Clone room setup — a one-time copy of a room's setup into a new room with an empty chat, from the room's menu

Decided by the requester (Ricardo) in the room "Parlay Product Evolution";
recorded from
[the raw request](../initiatives/INIT-0002-clone-room-setup/product/sources/raw-request.md),
"Decision to build". Final: not re-asked
([run instructions](../initiatives/INIT-0002-clone-room-setup/product/sources/run-instructions.md)).

## Context

A second room set up like an existing one is entered again by hand in Create
room ([CAP-0002](../capabilities/CAP-0002-room-creation-and-setup.md)).

## Decision

1. Each room's menu gains **"Clone room setup…"**: a one-time copy of the
   room's setup into a new room with an empty chat.
2. **Copied:** every agent seat (name, description, provider, model, effort,
   permissions, role instructions, listening settings); the Room Brief Goal
   (editable in the dialog) and Rules (as is); room settings (mode, hop
   budget, default agent); the project folder (pre-filled, changeable in the
   dialog).
3. **Not copied:** chat history and activity; agent sessions (all agents start
   fresh); Decisions, pending work, past approvals, handoffs; Desktop session
   links (`@desktop:` links).
4. **Flow:** Room menu → "Clone room setup…" → one short dialog: name
   pre-filled "<room> copy", Goal ready to edit, project folder, and one line
   saying what carries over and what doesn't — that line states that agent
   permissions are copied. Create opens the new room: empty chat, no agent
   started, no work commissioned.
5. **Independent:** editing either room's settings or conversation never
   changes the other. Wording must not promise separate project memory —
   rooms on the same folder still share its files.
6. **Out of scope:** templates, syncing between rooms, an option to copy
   Decisions (open to the requester, default no —
   [Q-0001](../questions/Q-0001-copy-decisions-option.md)).
7. **Done means** one check covering all four: the clone's agents, Goal and
   Rules match the original; its chat is empty and agent sessions fresh;
   editing the clone leaves the original unchanged; creating it starts no
   agents and commissions no work. No new unit or smoke suites.

## Options considered

| Option | Why not |
| --- | --- |
| Templates (saved room setups to start from) | Out of scope by the requester. |
| Rooms that stay in sync | Out of scope by the requester; the copy is one-time. |
| Copying Decisions too | Out of scope; held as an open question, default no ([Q-0001](../questions/Q-0001-copy-decisions-option.md)). |

## Consequences

The user gets a fresh room with the same setup in one dialog. The clone shares
nothing with the original after creation, except the project folder's files
when both rooms point at the same folder.

## Provenance

Context digest at decision: `b9db171eb1a049ab` (PRODUCT_DEFINITION entry).
