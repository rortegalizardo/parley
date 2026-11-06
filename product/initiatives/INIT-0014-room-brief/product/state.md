---
id: PSTATE-INIT-0014
type: product-state
title: Product definition state for INIT-0014
status: authoritative
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0014
phase: DISCOVERY
phase_entered: 2026-11-06
requester: Ricardo (via the room "Parlay Product Evolution", step 3 of its agreed decision)
next_action: "ROLE-product-manager: SKILL-advance-product-phase (PRODUCT_DEFINITION)"
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

ROLE-product-manager: SKILL-advance-product-phase (PRODUCT_DEFINITION).

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

No interview round was run: the requester's decisions are final and
pre-authorized ([run instructions](sources/run-instructions.md)); every fact
below is cited.

**Target users.**
- The room owner (the requester, Ricardo): writes a room's standing goal,
  rules and decisions, and expects every agent to act on them
  ([raw request](sources/raw-request.md), "Problem", "Done means").
- The room's agents (Claude, Codex and Gemini seats): consume that context on
  every turn, across edits, compaction and session restarts (same source).

**Jobs and problems, with evidence.**
1. *Write the goal once and have every agent know it.* A goal in Direction was
   not known to agents while the same text in the room note was
   ([raw request](sources/raw-request.md), "Problem").
2. *One place for standing context.* Today there are two overlapping places:
   Room settings → Room tab "Shared room instructions" (Create room placeholder
   "Goals, shared context, or rules for every agent…") and Room settings →
   Direction tab Goal + Decisions (`ui/index.html` at `d07a67d`;
   [CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md)).
3. *Context must not depend on what a session still remembers.* The room note
   is sent in full only when short (< 340 characters), fresh or changed, and the
   direction once per session, then as a one-line reminder (`parley.mjs`
   `roomNoteBlock`, `directionBlock` at `d07a67d`), so compaction or a resumed
   session can lose it ([raw request](sources/raw-request.md), "Problem").
4. *Keep everything that was saved.* Migration keeps all content as is and
   never rejects a room ([raw request](sources/raw-request.md), "Migration").

**Current-state capability mapping.**
[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md) — room note,
room direction, Pin, Tidy, old saved brief. Per-agent standing instructions
are separate and stay so.

**Success signals** ([raw request](sources/raw-request.md), "Done means").
- A new and an existing agent can each repeat the current goal, decisions and
  rules — also after an edit, and after compaction or a session restart.
- The goal never has to be copied into Rules.
- Verified by one quick prompt check that the full brief is in the prompt after
  a session restart, plus one manual repeat of the user's test room. No new
  unit or smoke suites.

**Known non-goals** ([raw request](sources/raw-request.md)). Agent-suggested
decisions (deferred); only the user edits the brief; per-agent instructions
stay in each agent's settings.

**Observed in flight.** A separate engineering session, "brief-delivery", is
changing `parley.mjs` delivery so direction and note go in full every turn
(uncommitted `parley.mjs` edit in the main checkout on 2026-11-06;
[raw request](sources/raw-request.md), "Constraints"). `docs/ROOM-BEHAVIOR.md`
at `d07a67d` already describes full-every-turn delivery while the committed
code still sends reminders.

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
- 2026-11-06 — DISCOVERY: CAP-0001 recorded as current state; mission and
  principles accepted (PD-0001).
- Dispatch log: `phase | delegate | vendor | model | tokens-scale | ledger run | artifact produced`

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-06 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory bootstrapped, packet `degraded` only for the seeded draft mission/principles | Entered. Hooks: HOOK-canonical-root pass (one root), HOOK-hydrate pass | eb4558fc5acdc614 |
| 2026-11-06 | INTAKE | DISCOVERY | ROLE-product-manager | Exit criteria met: one initiative, one problem, one requester, every ambiguity classified (none escalation-class). size: small (≤3 stories expected) | Exited INTAKE, entered DISCOVERY. Hooks: HOOK-initiative-resolved pass, HOOK-phase-entry pass | eb4558fc5acdc614 |

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
