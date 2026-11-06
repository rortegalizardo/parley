---
id: DM-INIT-0014
type: delivery-manifest
title: Delivery manifest for INIT-0014
status: authoritative
revision: 1
owner_role: ROLE-orchestrator
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0014
manifest_version: 1
band_owner: product
issued_on: 2026-11-06
issued_from_verdict: READY@2026-11-06
story_set_digest: "REQ-0001@2@2026-11-06, REQ-0002@2@2026-11-06, REQ-0003@2@2026-11-06; INIT-0014@3"
accepted_on: none
dispatch_unit: ticket
max_parallelism: default
completion: pending
stories: [REQ-0001, REQ-0002, REQ-0003]
---

# Delivery manifest — INIT-0014

> Schema: `product/schemas/delivery-manifest.md`. Consumption:
> `product/architecture/delivery-fanout.md`.
> Product band (Identity → Ordering constraints) is written once by
> `ROLE-product-manager` and frozen at acceptance. Execution band (Dispatch
> units → Completion) is written only by `ROLE-orchestrator` at initiative scope.

## Identity

- Initiative: `INIT-0014`
- Outcome: a room has one Room Brief — Goal, Rules and Decisions — written once by the user, and every agent in the room holds all of it on every turn, whatever its session remembers.
- Handoff packet: [`../product/state.md`](../product/state.md) `## Handoff packet`

## Shared references

- Design references: `DES-0001 → initiatives/INIT-0014-room-brief/design/heroes/` (`room-brief-brief-panel.dc.html`, `room-brief-brief-panel.png`, `room-brief-dialogs.dc.html`, `room-brief-dialogs.png`, `approach.md`)
- Decisions in force: `PD-0001`, `PD-0002`, `PD-0003`, `PD-0004`, `PD-0005`, `PD-0006`
- Binding technical constraints:
  - `C-01` — `technical/assessment.md` round 1
  - `C-02` — `technical/assessment.md` round 1
  - `C-03` — `technical/assessment.md` round 1
  - `C-04` — `technical/assessment.md` round 1
  - `C-05` — `technical/assessment.md` round 1
  - `C-06` — `technical/assessment.md` round 1
  - `C-07` — `technical/assessment.md` round 1
  - `C-08` — `technical/assessment.md` round 1
  - `C-09` — `technical/assessment.md` round 1
  - `C-10` — `technical/assessment.md` round 1
  - `C-11` — `technical/assessment.md` round 1
  - `C-12` — `technical/assessment.md` round 1
  - `C-14` — `technical/assessment.md` round 1
  - `C-15` — `technical/assessment.md` round 1
- Explicitly out of scope: [`../initiative.md`](../initiative.md) `## Scope` ("Out of scope")
- Open questions (non-blocking): `none`

## Stories

| REQ- | Title | Status | Readiness | Depends on | Blocked by | Wave (planned) |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-0001 | Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note | accepted | engineering-ready | none | none | 0 |
| REQ-0002 | The user edits one Room Brief in Room Settings and sees exactly what agents receive | accepted | engineering-ready | REQ-0001 | none | 1 |
| REQ-0003 | Pinning a message adds it to the Room Brief's Decisions | accepted | engineering-ready | REQ-0001, REQ-0002 | none | 2 |

## Ordering constraints

- Coordinated release: REQ-0001, REQ-0002 and REQ-0003 are released together — one restart of the live server, one desktop repackage — only after all three are on `main` (`REQ-0001 §Sequencing`, `REQ-0002 §Rollout`, `REQ-0003 §Rollout`).
- External base: REQ-0001 starts from `main` at or after `b6591be` (`REQ-0001 §Sequencing`).

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
