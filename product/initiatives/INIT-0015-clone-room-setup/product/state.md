---
id: PSTATE-INIT-0015
type: product-state
title: Product definition state for INIT-0015
status: authoritative
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0015
phase: PRODUCT_DEFINITION
phase_entered: 2026-11-06
requester: Ricardo (decided in the room "Parlay Product Evolution"; relayed by his side session)
next_action: "ROLE-product-manager: populate the initiative, draft the requirement, record the decisions and the Product Definition Contract (PRODUCT_DEFINITION)"
blocked_by: []
converged: false
readiness_verdict: none
stories: []
design_refs: []
decisions: []
---

# Product definition state — INIT-0015

`phase` above is the authority for where this work stands on the product side.
Delivery stage lives in `delivery/state.md` and is owned by `ROLE-orchestrator`;
these two files never describe the same thing and never share a writer.

## Where this stands

New initiative from a raw request whose product decisions the requester already
made ([raw request](sources/raw-request.md)). The requester pre-authorized the
whole run with no approval stops ([run instructions](sources/run-instructions.md)).

## Problem statement

The user wants a second room set up like an existing one — the same agents
(with their permissions and instructions), the same Room Brief Goal and Rules,
the same room settings and project folder — but with a clean chat and fresh
agent sessions. Today the only way is Create room, re-entering every agent and
setting by hand. The requester decided a one-time copy from the room's menu,
through one short dialog, with nothing synced afterwards
([raw request](sources/raw-request.md), "Decision to build").

## Next action

ROLE-product-manager: populate the initiative, draft the requirement, record the decisions and the Product Definition Contract (PRODUCT_DEFINITION).

## Blocked by

Nothing.

## Ambiguity log

| Date | Ambiguity | Class (`pm-resolvable` / `escalation`) | Resolution or `Q-` |
| --- | --- | --- | --- |
| 2026-11-06 | "Room settings (mode, hop budget, default agent)": is the list exhaustive, or examples of the room-level settings? | pm-resolvable (clarification consistent with "a one-time copy of a room's setup") | To decide at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | The pre-filled name "<room> copy" may already exist or exceed the 40-character room-name limit | pm-resolvable (clarification; does not change the outcome) | To decide at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Copied Goal or Rules longer than today's new-text limits (Goal 2,000, Rules 8,000; existing over-limit text is preserved by PRL-1) | pm-resolvable (conforms to principle 2, never cut) | To decide at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | A source room with more than four agents (legacy rosters are preserved; new rooms allow four). No such room exists in the data root today (read-only check: 2, 3, 4, 4 seats) | pm-resolvable (conforms to the existing four-agent maximum for new rooms) | To decide at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Rules text that mentions a `@desktop:` handle (the live room's Rules do) versus "Desktop session links are not copied" | pm-resolvable (Rules are copied verbatim, principle 2; link registrations are not copied) | To decide at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Exact wording of the dialog's one-line summary | pm-resolvable (the requester fixed its meaning: says permissions are copied, promises no separate project memory; the PM fixes the copy) | To decide at PRODUCT_DEFINITION, recorded as a `PD-` |
| 2026-11-06 | Option to also copy Decisions | out of scope by the requester; held as a non-blocking open question, default no ([raw request](sources/raw-request.md), "Out of scope") | `Q-` at PRODUCT_DEFINITION, severity `important` |

## Discovery

No interview round was run: the requester's decisions are final and
pre-authorized ([run instructions](sources/run-instructions.md)); every fact
below is cited.

**Target users.**
- The room owner (the requester, Ricardo): runs several rooms with
  hand-configured agents, permissions, instructions and a Room Brief, and
  wants a fresh room with the same setup ([raw request](sources/raw-request.md),
  "Decision to build").
- The cloned room's agents: start in the new room with their copied setup and
  a fresh session, holding nothing of the original room's conversation (same
  source, "NOT copied").

**Jobs and problems, with evidence.**
1. *Start a clean room set up like an existing one.* Today the only way is
   Create room, re-entering up to four agents (provider, model, effort, Fast
   mode, permissions, listening, instructions), the Goal, Rules, folder and
   settings by hand ([CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md),
   "No way to copy a room's setup").
2. *Keep the two rooms independent.* Editing either room must never change
   the other ([raw request](sources/raw-request.md), "Independent").
3. *Know what carries over.* The dialog says in one line what is copied and
   what is not, including that agent permissions are copied, without promising
   separate project memory ([raw request](sources/raw-request.md), "Flow",
   "Independent").

**Current-state capability mapping.**
[CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md) — room
creation and setup (changed: gains a clone path).
[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md) — room
shared context; its record still describes the room note and direction, while
`main` at `704039f` has the Room Brief (INIT-0014, PRL-1..PRL-3 merged; the
initiative is not yet closed). This initiative reads the Room Brief as built,
it does not change it.

**Success signals** ([raw request](sources/raw-request.md), "Done means").
- The clone's agents, Goal and Rules match the original.
- Its chat is empty and its agent sessions are fresh.
- Editing the clone leaves the original unchanged.
- Creating it starts no agent and commissions no work.
- Shown by one check covering all four; no new unit or smoke suites.

**Known non-goals** ([raw request](sources/raw-request.md), "Out of scope").
Templates; syncing between rooms; an option to copy Decisions (open question
to the requester, default no).

## Options

_Written at SOLUTION_EXPLORATION._

## Consultation log

| Date | Delegate role | Question | Answer / verdict | Recorded as |
| --- | --- | --- | --- | --- |

## Escalation log

| Date | Question | `Q-` | Asked of | Answer | Recorded as |
| --- | --- | --- | --- | --- | --- |

## Stories

| `REQ-` | Title | Status | `CAP-` | `DES-` | Sequencing note |
| --- | --- | --- | --- | --- | --- |

## Design coverage

| `REQ-` | Coverage |
| --- | --- |

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

_Assembled at ENGINEERING_READY._

## Handoff log

| Date | Receiving role | Packet digest | Note |
| --- | --- | --- | --- |

## Session notes

- 2026-11-06 — Hydration: packet `ready`, no initiative resolved (new ask),
  profile S, head `704039f`. Neighbouring: CAP-0001, PD-0002/0003/0005/0006
  (Room Brief), INIT-0014 (`active`; PRL-1..PRL-3 merged on local `main` at
  `704039f`, not yet closed — CAP-0001 still describes the room note and
  direction; closing INIT-0014 is outside this run).
- 2026-11-06 — Triage verdict `new-initiative`: no capability does this, no
  decision settled or rejected it, no constraint forbids it, no initiative
  covers it, and the ask names one outcome.
- 2026-11-06 — Storage preflight `READY`: class product records; owner
  ROLE-product-manager; root `/Users/ortega/Desktop/Projects/parley/product`
  (key PRL); destination `initiatives/INIT-0015-clone-room-setup/` on branch
  `product/INIT-0015-clone-room-setup`; provenance the two raw sources.

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-06 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory present, packet `ready` | Entered. Hooks: HOOK-canonical-root pass (one root), HOOK-hydrate pass | 4c42601397d4b647 |
| 2026-11-06 | INTAKE | DISCOVERY | ROLE-product-manager | Exit criteria met: one initiative, one problem, one requester, every ambiguity classified (none escalation-class). size: small (≤3 stories expected) | Exited INTAKE, entered DISCOVERY. Hooks: HOOK-initiative-resolved pass, HOOK-phase-entry pass | 4c42601397d4b647 |
| 2026-11-06 | DISCOVERY | PRODUCT_DEFINITION | ROLE-product-manager | Exit criteria met: target users, jobs with sources, CAP-0002 recorded as current state and CAP-0001 mapped, success signals, non-goals | Exited DISCOVERY, entered PRODUCT_DEFINITION. Hooks: HOOK-phase-entry pass (A9: Discovery section complete) | b9db171eb1a049ab |

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
