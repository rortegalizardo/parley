---
id: DM-INIT-nnnn
type: delivery-manifest
title: Delivery manifest for INIT-nnnn
status: authoritative
revision: 1
owner_role: ROLE-orchestrator
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
updated_by_role: <ROLE-…>
initiative: INIT-nnnn
manifest_version: 1
band_owner: product
issued_on: <YYYY-MM-DD>
issued_from_verdict: READY@<YYYY-MM-DD>
story_set_digest: <digest recorded with the verdict>
accepted_on: none
dispatch_unit: ticket
max_parallelism: default
completion: pending
stories: [REQ-nnnn]
---

# Delivery manifest — INIT-nnnn

> Schema: `product/schemas/delivery-manifest.md`. Consumption:
> `product/architecture/delivery-fanout.md`.
> Product band (Identity → Ordering constraints) is written once by
> `ROLE-product-manager` and frozen at acceptance. Execution band (Dispatch
> units → Completion) is written only by `ROLE-orchestrator` at initiative scope.

## Identity

- Initiative: `INIT-nnnn`
- Outcome: _one sentence, copied from the handoff packet._
- Handoff packet: [`../product/state.md`](../product/state.md) `## Handoff packet`

## Shared references

- Design references: `DES-nnnn → <path>` | `none — no user-facing surface`
- Decisions in force: `PD-nnnn` | `none`
- Binding technical constraints: _one line each, citing `technical/<file>` round n_ | `none`
- Explicitly out of scope: [`../initiative.md`](../initiative.md) `## Out of scope`
- Open questions (non-blocking): `Q-nnnn` | `none`

## Stories

| REQ- | Title | Status | Readiness | Depends on | Blocked by | Wave (planned) |
| --- | --- | --- | --- | --- | --- | --- |

## Ordering constraints

_One line per constraint not expressible as a dependency, each citing
`REQ-nnnn §Sequencing`._ | `none — dependencies are the only ordering`

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
