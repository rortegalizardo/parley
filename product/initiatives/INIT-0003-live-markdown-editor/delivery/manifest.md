---
id: DM-INIT-0003
type: delivery-manifest
title: Delivery manifest for INIT-0003
status: authoritative
revision: 1
owner_role: ROLE-orchestrator
created: 2026-11-08
updated: 2026-11-08
updated_by_role: ROLE-product-manager
initiative: INIT-0003
manifest_version: 1
band_owner: product
issued_on: 2026-11-08
issued_from_verdict: READY@2026-11-08
story_set_digest: "REQ-0005@3@2026-11-08; REQ-0006@3@2026-11-08; INIT-0003@4"
accepted_on: none
dispatch_unit: ticket
max_parallelism: default
completion: pending
stories: [REQ-0005, REQ-0006]
---

# Delivery manifest — INIT-0003

> Schema: `product/schemas/delivery-manifest.md`. Consumption:
> `product/architecture/delivery-fanout.md`.
> Product band (Identity → Ordering constraints) is written once by
> `ROLE-product-manager` and frozen at acceptance. Execution band (Dispatch
> units → Completion) is written only by `ROLE-orchestrator` at initiative scope.

## Identity

- Initiative: `INIT-0003`
- Outcome: the user sees Markdown formatted in place while writing it, everywhere they write it, and the saved or sent text is exactly what was typed. O1: in the Room Brief's Goal and Rules, in agent instructions (Room settings and Create room) and in the New Room and Clone dialogs. O2: in the chat bar, with the `@` picker, slash commands, Enter and Shift+Enter, drafts, paste, attachments, undo and redo working as they do today.
- Handoff packet: [`../product/state.md`](../product/state.md) `## Handoff packet`

## Shared references

- Design references: `DES-0003 → initiatives/INIT-0003-live-markdown-editor/design/heroes/` (`markdown-editor-settings.dc.html`, `markdown-editor-settings.png`, `markdown-editor-chat-bar.dc.html`, `markdown-editor-chat-bar.png`, `approach.md`)
- Decisions in force: `PD-0011`, `PD-0012`, `PD-0013`, with `PD-0004`, `PD-0006` (limits) and `constraints.md` revision 2 (#2 amended for one vendor file)
- Binding technical constraints:
  - `C-01` to `C-20` — `technical/assessment.md` round 1, carried by `PD-0012` item 3
  - `C-21` — `technical/coherence.md` round 1, defect 1 (a file dropped on the editor inserts nothing); stated in both stories
- Explicitly out of scope: [`../initiative.md`](../initiative.md) `## Scope` ("Out of scope")
- Open questions (non-blocking): none

## Stories

| REQ- | Title | Status | Readiness | Depends on | Blocked by | Wave (planned) |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-0005 | The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type | accepted | engineering-ready | none | none | 0 |
| REQ-0006 | The user types Markdown in the chat bar and sees it format as they type | accepted | engineering-ready | REQ-0005 | none | 1 |

## Ordering constraints

- REQ-0006 starts after REQ-0005 is merged: it reuses the shared editor and the vendor file that story builds (`REQ-0006 §Sequencing`, `depends_on: [REQ-0005]`).
- External precondition, not a ticket edge: PRL-6 (the `test/smoke.mjs` repair) merged and green on `main` before engineering starts (`REQ-0005 §Sequencing`, `REQ-0006 §Sequencing`, PD-0011 item 10).

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
