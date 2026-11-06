---
id: PSTATE-INIT-0014
type: product-state
title: Product definition state for INIT-0014
status: authoritative
revision: 4
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0014
phase: SOLUTION_EXPLORATION
phase_entered: 2026-11-06
requester: Ricardo (via the room "Parlay Product Evolution", step 3 of its agreed decision)
next_action: "ROLE-product-manager: dispatch the technical architect (product-feasibility-assessment) and the design author (hero), then record options and PD-0004"
blocked_by: []
converged: false
readiness_verdict: none
stories: [REQ-0001, REQ-0002, REQ-0003]
design_refs: []
decisions: [PD-0001, PD-0002, PD-0003, PD-0004]
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

ROLE-product-manager: dispatch the technical architect (product-feasibility-assessment) and the design author (hero), then record options and PD-0004.

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
| 2026-11-06 | Design depth for one settings-surface change in a plain HTML/JS app | pm-resolvable (the requester set it: one hero frame at 1440, light) | PD-0004 |
| 2026-11-06 | RQ-1 (technical/assessment.md): PD-0003 item 4 copy and a byte-for-byte preview vs Parley's per-line framing of user text | pm-resolvable (keeps "What agents see" exact; framing is a binding constraint, C-01) | Settled at SOLUTION_CONVERGENCE, recorded as a `PD-` |
| 2026-11-06 | RQ-2: the 8,000 Rules limit is enforced today only in Create room; stored text may exceed it | pm-resolvable (conforms to "never cut"; limits stop new input only) | Settled at SOLUTION_CONVERGENCE, recorded as a `PD-` |
| 2026-11-06 | RQ-3: keep the old note and direction on disk after migration as an unread recovery copy | pm-resolvable (conforms to "keep all content" and "never delete automatically"; PD-0002 item 3 is about fields, not a hidden copy) | Settled at SOLUTION_CONVERGENCE, recorded as a `PD-` |
| 2026-11-06 | RQ-4: a save built on an older brief can overwrite a newer change | pm-resolvable (conforms to "nothing lost") | Settled at SOLUTION_CONVERGENCE, recorded as a `PD-` |
| 2026-11-06 | RQ-5: every save sends the whole brief; Tidy saves look like hand edits | pm-resolvable (one rule: any save that leaves out an active Decision archives it) | Settled at SOLUTION_CONVERGENCE, recorded as a `PD-` |
| 2026-11-06 | RQ-6: does the migration add a timeline note | pm-resolvable (no note; agents get the transition line) | Settled at SOLUTION_CONVERGENCE, recorded as a `PD-` |

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
| A — Room Brief on the Room tab; Direction tab removed | Goal, Rules and Decisions sit on the Room tab and save with the dialog-wide Save, which closes the dialog and may reset sessions | feasible-with-constraints, multi-component ([assessment](../technical/assessment.md)) | C-01..C-15 incl. C-13 (footer Save must never write a stale brief or drop brief edits); R-6 two save models on one tab | One tab fewer; brief edits mixed with session-resetting settings |
| B — a Brief tab replaces the Direction tab; the Room tab loses its room-instructions field | Goal, Rules and Decisions sit on their own Brief tab with Save brief, Discard changes and Tidy; the hero frames draw it (design branch, `ee1629f`) | feasible-with-constraints, multi-component ([assessment](../technical/assessment.md)) | C-01..C-12, C-14, C-15; reuses the Direction tab's own save and protected draft | Keeps three tabs; brief saving stays separate from settings that reset sessions |

_Recommended option and why:_ **B.** Same delivery, migration and band as A,
fewer constraints and risks (no C-13, no R-6), and it reuses the Direction
tab's draft that already survives live pins. The architect recommends B too;
the choice is the PM's (§4.1: options differ in internal shape, not in the
user-visible outcome of PD-0002).

_Recommended option and why:_

## Consultation log

| Date | Delegate role | Question | Answer / verdict | Recorded as |
| --- | --- | --- | --- | --- |
| 2026-11-06 | ROLE-planner as technical architect (vendor claude, model opus) | INIT-0014 options A and B for REQ-0001..0003: feasibility, constraints, risks, band, platform conflicts (`product-feasibility-assessment`, size rule: one dispatch) | A and B both feasible-with-constraints, multi-component; recommends B; 15 constraints, 7 risks, 13 conflicts, RQ-1..RQ-6; brief-delivery already landed as `b6591be` — [technical/assessment.md](../technical/assessment.md), [impact.md](../technical/impact.md), [capability-scan.md](../technical/capability-scan.md) | Options table; CAP-0001 revision 2; chosen-option and RQ `PD-`s at SOLUTION_CONVERGENCE; constraints into REQs at DECOMPOSITION |
| 2026-11-06 | ROLE-product-designer, design author (vendor claude, model fable) | Step 1b hero frames for option B (REQ-0002, REQ-0003), approach set by PD-0004 | DONE — `ee1629f` on `design/INIT-0014-room-brief`: `design/heroes/room-brief-brief-panel` and `room-brief-dialogs` (.dc.html, .png), `approach.md` with two proposals | Options table; both proposals accepted into REQ-0002 and REQ-0003 (G8); `DES-0001` at DECOMPOSITION |

## Escalation log

| Date | Question | `Q-` | Asked of | Answer | Recorded as |
| --- | --- | --- | --- | --- | --- |

## Stories

| `REQ-` | Title | Status | `CAP-` | `DES-` | Sequencing note |
| --- | --- | --- | --- | --- | --- |
| REQ-0001 | Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note | draft | CAP-0001 | none (no user-facing surface) | none — on the frontier; starts after the external "brief-delivery" work lands on main and rebases on it |
| REQ-0002 | The user edits one Room Brief in Room Settings and sees exactly what agents receive | draft | CAP-0001 | pending (SOLUTION_EXPLORATION hero) | after REQ-0001 (edits the brief it creates) |
| REQ-0003 | Pinning a message adds it to the Room Brief's Decisions | draft | CAP-0001 | pending (SOLUTION_EXPLORATION hero) | after REQ-0001 (writes into the brief it creates) |

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
- 2026-11-06 — PRODUCT_DEFINITION: initiative populated (O1-O3, out of
  scope, success measures); REQ-0001..0003 drafted; PD-0002 (requester's
  decisions) and PD-0003 (ten behaviour details, all pm-resolvable under
  §4.1) recorded; Product Definition Contract written inline (size rule
  §9d.2) and validated against both raw sources item by item.
- 2026-11-06 — SOLUTION_EXPLORATION: design approach per PD-0004 — step 1a
  skipped (PD-0002 fixes the direction), step 1b drew option B only (the
  requester asked for one hero; option A has a text description and a
  feasibility verdict); production steps 2a-9 and the design PR do not run
  (constraints #2). No requester pick: the run is pre-authorized.
  Brief-delivery landed on local `main` as `b6591be` before this phase;
  CAP-0001 updated to it.
- Dispatch log: `phase | delegate | vendor | model | tokens-scale | ledger run | artifact produced`
  - `SOLUTION_EXPLORATION | ROLE-planner (architect) | claude | opus | L | af86d33a5fe245964 | technical/capability-scan.md, impact.md, assessment.md`
  - `SOLUTION_EXPLORATION (step 1b) | ROLE-product-designer (design-lead) | claude | fable | M | a41d9618e7db22c3c | design/heroes/* at ee1629f`

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-06 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory bootstrapped, packet `degraded` only for the seeded draft mission/principles | Entered. Hooks: HOOK-canonical-root pass (one root), HOOK-hydrate pass | eb4558fc5acdc614 |
| 2026-11-06 | INTAKE | DISCOVERY | ROLE-product-manager | Exit criteria met: one initiative, one problem, one requester, every ambiguity classified (none escalation-class). size: small (≤3 stories expected) | Exited INTAKE, entered DISCOVERY. Hooks: HOOK-initiative-resolved pass, HOOK-phase-entry pass | eb4558fc5acdc614 |
| 2026-11-06 | DISCOVERY | PRODUCT_DEFINITION | ROLE-product-manager | Exit criteria met: target users, jobs with sources, CAP-0001 mapping, success signals, non-goals (S1-S3) | Exited DISCOVERY, entered PRODUCT_DEFINITION. Hooks: HOOK-phase-entry pass (A9: Discovery section complete) | 5435e20a90e90919 |
| 2026-11-06 | PRODUCT_DEFINITION | SOLUTION_EXPLORATION | ROLE-product-manager | Exit criteria met: outcome O1-O3, non-empty out of scope, success measures, three draft REQs covering every outcome element, Product Definition Contract citing both raw sources | Exited PRODUCT_DEFINITION, entered SOLUTION_EXPLORATION. Hooks: HOOK-phase-entry pass (F1 out of scope non-empty; F2 draft coverage run, 0 defects, no R1) | bbbe87f58d18ce70 |

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
