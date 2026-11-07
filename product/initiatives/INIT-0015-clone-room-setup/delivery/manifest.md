---
id: DM-INIT-0015
type: delivery-manifest
title: Delivery manifest for INIT-0015
status: authoritative
revision: 1
owner_role: ROLE-orchestrator
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0015
manifest_version: 1
band_owner: product
issued_on: 2026-11-06
issued_from_verdict: READY@2026-11-06
story_set_digest: "REQ-0004@3@2026-11-06; INIT-0015@3"
accepted_on: none
dispatch_unit: ticket
max_parallelism: default
completion: pending
stories: [REQ-0004]
---

# Delivery manifest — INIT-0015

> Schema: `product/schemas/delivery-manifest.md`. Consumption:
> `product/architecture/delivery-fanout.md`.
> Product band (Identity → Ordering constraints) is written once by
> `ROLE-product-manager` and frozen at acceptance. Execution band (Dispatch
> units → Completion) is written only by `ROLE-orchestrator` at initiative scope.

## Identity

- Initiative: `INIT-0015`
- Outcome: from any room's menu, in one short dialog, the user creates a new room with that room's agents (with their permissions), Room Brief Goal and Rules, room settings and project folder, an empty chat and fresh agent sessions, independent of the original from then on.
- Handoff packet: [`../product/state.md`](../product/state.md) `## Handoff packet`

## Shared references

- Design references: `DES-0002 → initiatives/INIT-0015-clone-room-setup/design/heroes/` (`clone-room-setup.dc.html`, `clone-room-setup.png`, `approach.md`)
- Decisions in force: `PD-0003`, `PD-0004`, `PD-0006`, `PD-0007`, `PD-0009`, `PD-0010`
- Binding technical constraints:
  - `C-01` — `technical/assessment.md` round 1
  - `C-02` — `technical/assessment.md` round 1
  - `C-03` — `technical/assessment.md` round 1
  - `C-04` — `technical/assessment.md` round 1
  - `C-05` — `technical/assessment.md` round 1
  - `C-06` — `technical/assessment.md` round 1
  - `C-07` — `technical/assessment.md` round 1
  - `C-08` — `technical/assessment.md` round 1
  - `C-12` — `technical/assessment.md` round 1
  - `C-13` — `technical/assessment.md` round 1
- Explicitly out of scope: [`../initiative.md`](../initiative.md) `## Scope` ("Out of scope")
- Open questions (non-blocking): `Q-0001`

## Stories

| REQ- | Title | Status | Readiness | Depends on | Blocked by | Wave (planned) |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-0004 | The user clones a room's setup into a new room with an empty chat, from the room's menu | accepted | engineering-ready | none | none | 0 |

## Ordering constraints

- External base: REQ-0004 starts from `main` at or after `704039f` (`REQ-0004 §Sequencing`).

---

## Dispatch units

| Unit | Stories | Depends on | State | Attempts | Last outcome | Dispatch ref | Wave | Updated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Waves

| Wave | Units | Eligible-now count |
| --- | --- | --- |

## Dispatch ledger

| Date | Unit | Event | Detail |
| --- | --- | --- | --- |

## Completion

_Computed per schema §5.8. `pending` until every unit is `complete`._
