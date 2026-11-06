---
id: PD-0001
type: decision
title: Accept Parley's mission from its README and record the requester's two standing rules as principles
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0014]
supersedes:
superseded_by:
---

# PD-0001 — Accept Parley's mission from its README and record the requester's two standing rules as principles

## Context

Product Memory was bootstrapped on 2026-11-06 with a draft mission and an
empty draft principles file. A draft foundation degrades every context packet.
Parley already ships; its `README.md` states what it is, and the requester has
stated two rules about room context more than once (INIT-0014 raw request;
`CHECKPOINT.md` 2026-10-28).

## Decision

`project/mission.md` is accepted with its text transcribed from `README.md`.
`project/principles.md` is accepted with two principles, each the requester's
own rule, cited there: only the user changes a room's shared brief; never cut,
shorten or delete the user's saved text automatically.

## Options considered

| Option | Why not |
| --- | --- |
| Keep both files draft | Every packet stays `degraded`, which forbids advancing a phase. |
| Accept principles empty | Loses two rules the requester has stated repeatedly and that rule options out in this initiative. |

## Consequences

Costs: the mission says little about success; it will need growing as more
initiatives run. Benefits: the foundation is binding, and the two principles
rule out automatic brief editing and agent-written context in future work.

context_digest at decision: eb4558fc5acdc614
