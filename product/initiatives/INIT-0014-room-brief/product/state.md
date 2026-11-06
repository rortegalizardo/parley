---
id: PSTATE-INIT-0014
type: product-state
title: Product definition state for INIT-0014
status: authoritative
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0014
phase: INTAKE
phase_entered: 2026-11-06
requester: Ricardo (via the room "Parlay Product Evolution", step 3 of its agreed decision)
next_action: "ROLE-product-manager: SKILL-advance-product-phase (DISCOVERY)"
blocked_by: []
converged: false
readiness_verdict: none
stories: []
design_refs: []
decisions: []
---

# Product definition state — INIT-0014

`phase` above is the authority for where this work stands on the product side.
Delivery stage lives in `delivery/state.md` and is owned by `ROLE-orchestrator`;
these two files never describe the same thing and never share a writer.

## Where this stands

New initiative from a raw request whose product decisions the requester already
made ([raw request](sources/raw-request.md)). The requester pre-authorized the
whole product run with no approval stops ([run instructions](sources/run-instructions.md)).

## Problem statement

Room direction and the room note (shared room instructions) overlap and clash.
A goal written in Direction was not known to agents, while the same text in the
room note was. Today the room note is sent in full only when short (otherwise a
reminder line), and the direction is sent in full once per session and then as
a one-line reminder ([raw request](sources/raw-request.md), "Problem"). The user
has two places that look like the room's standing context, and agents do not
reliably hold either.

## Next action

ROLE-product-manager: SKILL-advance-product-phase (DISCOVERY).

## Blocked by

Nothing.

## Ambiguity log

| Date | Ambiguity | Class (`pm-resolvable` / `escalation`) | Resolution or `Q-` |
| --- | --- | --- | --- |
| 2026-11-06 | "Goal … asked for at room creation / brief save": is a Goal required, or only prompted? | pm-resolvable (clarification consistent with "never reject a migrated room for lacking a Goal") | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | What Tidy (today's one-call shorter-direction suggestion) does once the direction becomes the Room Brief | pm-resolvable (keeps an existing user-triggered aid; conforms to "never cut or delete automatically") | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Can a user delete a decision, or only archive it? | pm-resolvable (the brief forbids automatic deletion only) | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Exact wording of the brief text agents receive | pm-resolvable (the requester fixed its meaning; the PM fixes the copy) | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | What the ~2,000-character guide counts | pm-resolvable | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | When migrated text counts as "the same text in several places" | pm-resolvable | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | What `/note` (today: sets the room note) does after the change | pm-resolvable (keep the shortcut, mapped to Rules) | Decided at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Where the Room Brief sits in Room Settings (Direction tab, Room tab note field) | pm-resolvable (internal shape; same user outcome) | Chosen at SOLUTION_CONVERGENCE, recorded as the chosen-option `PD-` |
| 2026-11-06 | Ordering against the separate engineering session "brief-delivery", which is changing `parley.mjs` delivery now | pm-resolvable (sequencing; the requester already set the order: product first, engineering rebases after it lands) | Recorded as a sequencing constraint on the stories |
| 2026-11-06 | Design depth for one settings-surface change in a plain HTML/JS app | pm-resolvable (the requester set it: one hero frame at 1440, light) | Recorded as a `PD-` at SOLUTION_EXPLORATION |

## Discovery

_Written at DISCOVERY._

## Options

| Option | User-visible difference | Feasibility verdict | Cost / risk | Trade-off |
| --- | --- | --- | --- | --- |

_Recommended option and why:_

## Consultation log

| Date | Delegate role | Question | Answer / verdict | Recorded as |
| --- | --- | --- | --- | --- |

## Escalation log

| Date | Question | `Q-` | Asked of | Answer | Recorded as |
| --- | --- | --- | --- | --- | --- |

## Stories

| `REQ-` | Title | Status | `CAP-` | `DES-` | Sequencing note |
| --- | --- | --- | --- | --- | --- |

## Readiness log

Written by `ROLE-product-readiness-reviewer` only. One row per review round,
appended — a prior row is never edited, withdrawn, or overwritten.

| Date | Round | Verdict | Conditions | Reviewer | Story-set digest | Findings | Finding ids |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Readiness findings

Written by `ROLE-product-readiness-reviewer` only.

| Finding | Criterion | Artifact | What is wrong | Route phase | Route role |
| --- | --- | --- | --- | --- | --- |

## Handoff packet

_Written at ENGINEERING_READY._

## Handoff log

| Date | Receiving role | Packet digest | Note |
| --- | --- | --- | --- |

## Session notes

- 2026-11-06 — Product Memory bootstrapped (`93a9fec`, merged to `main`
  locally); project key `PRL` registered; Ariadne project `PRL` created.
- 2026-11-06 — Triage verdict `new-initiative`: no capability, decision,
  constraint or initiative covers the ask (all indexes empty at bootstrap).
- Dispatch log: `phase | delegate | vendor | model | tokens-scale | ledger run | artifact produced`

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-06 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory bootstrapped, packet `degraded` only for the seeded draft mission/principles | Entered. Hooks: HOOK-canonical-root pass (one root), HOOK-hydrate pass | eb4558fc5acdc614 |

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
