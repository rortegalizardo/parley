---
id: PD-0005
type: decision
title: Chosen option — the Room Brief gets its own Brief tab in place of the Direction tab, and the Room tab loses its room-instructions field
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0001, REQ-0002, REQ-0003]
supersedes:
superseded_by:
---

# PD-0005 — Chosen option: the Room Brief gets its own Brief tab in place of the Direction tab

## Context

Two options deliver the same Room Brief of
[PD-0002](PD-0002-room-brief-requester-decisions.md) and
[PD-0003](PD-0003-room-brief-behaviour-clarifications.md); they differ only
in where it is edited (`product/state.md` of INIT-0001, "Options"). The
technical architect found both **feasible-with-constraints**, band
**multi-component**
([assessment](../initiatives/INIT-0001-room-brief/technical/assessment.md),
"Verdicts"). The choice changes no user-visible outcome of PD-0002, so it is
the PM's (`product-manager-orchestrator` §4.1).

## Decision

**Option B.** Room settings shows the tabs Agents, Room and Brief. The Brief
tab replaces the Direction tab and holds Goal, Rules and Decisions with their
own `Save brief`, `Discard changes` and `Tidy`. The Room tab loses its
"Shared room instructions" field; nothing else on it changes. The hero frames
on `design/INIT-0001-room-brief` (`ee1629f`), recorded as `DES-0001`, draw
this option ([PD-0004](PD-0004-room-brief-design-depth-and-display-matrix.md)).
Its feasibility verdict is feasible-with-constraints; its constraints C-01 to
C-12, C-14 and C-15 bind the stories.

## Options considered

| Option | Why not |
| --- | --- |
| A — the brief on the Room tab, Direction tab removed | Same verdict and band, but adds C-13 and R-6: the Room tab's dialog-wide Save closes the dialog, may reset sessions and writes a form filled when Settings opened, so brief edits could be saved stale or lost. |
| Keep the room note and the direction separate | Rejected by the requester (PD-0002). |

## Consequences

Costs: Room settings keeps three tabs, and the brief is saved apart from the
other room settings. Benefits: brief edits never ride on a save that resets
sessions, and the Direction tab's draft — which already survives a pin
arriving mid-edit — carries over to the Brief tab.
