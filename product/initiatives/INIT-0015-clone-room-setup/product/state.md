---
id: PSTATE-INIT-0015
type: product-state
title: Product definition state for INIT-0015
status: authoritative
revision: 8
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
updated_by_role: ROLE-product-manager
initiative: INIT-0015
phase: ENGINEERING_READY
phase_entered: 2026-11-06
requester: Ricardo (decided in the room "Parlay Product Evolution"; relayed by his side session)
next_action: "ROLE-product-manager: assemble the handoff packet, compile delivery/manifest.md, create the Ariadne ticket for REQ-0004 (ENGINEERING_READY → HANDOFF)"
blocked_by: []
converged: true
readiness_verdict: READY
stories: [REQ-0004]
design_refs: [DES-0002]
decisions: [PD-0003, PD-0004, PD-0006, PD-0007, PD-0009, PD-0010]
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

ROLE-product-manager: assemble the handoff packet, compile
`delivery/manifest.md`, and create the Ariadne ticket for REQ-0004
(ENGINEERING_READY → HANDOFF).

## Blocked by

Nothing.

## Ambiguity log

| Date | Ambiguity | Class (`pm-resolvable` / `escalation`) | Resolution or `Q-` |
| --- | --- | --- | --- |
| 2026-11-06 | "Room settings (mode, hop budget, default agent)": is the list exhaustive, or examples of the room-level settings? | pm-resolvable (clarification consistent with "a one-time copy of a room's setup") | PD-0008 item 3 |
| 2026-11-06 | The pre-filled name "<room> copy" may already exist or exceed the 40-character room-name limit | pm-resolvable (clarification; does not change the outcome) | PD-0008 item 4 |
| 2026-11-06 | Copied Goal or Rules longer than today's new-text limits (Goal 2,000, Rules 8,000; existing over-limit text is preserved by PRL-1) | pm-resolvable (conforms to principle 2, never cut) | PD-0008 items 5, 6 |
| 2026-11-06 | A source room with more than four agents (legacy rosters are preserved; new rooms allow four). No such room exists in the data root today (read-only check: 2, 3, 4, 4 seats) | pm-resolvable (conforms to the existing four-agent maximum for new rooms) | PD-0008 item 14 |
| 2026-11-06 | Rules text that mentions a `@desktop:` handle (the live room's Rules do) versus "Desktop session links are not copied" | pm-resolvable (Rules are copied verbatim, principle 2; link registrations are not copied) | PD-0008 items 6, 9 |
| 2026-11-06 | Exact wording of the dialog's one-line summary | pm-resolvable (the requester fixed its meaning: says permissions are copied, promises no separate project memory; the PM fixes the copy) | PD-0008 item 10 |
| 2026-11-06 | Option to also copy Decisions | out of scope by the requester; held as a non-blocking open question, default no ([raw request](sources/raw-request.md), "Out of scope") | Q-0001 (`important`, open, default no) |
| 2026-11-06 | "Listening settings": does it include an agent's sleep state? | pm-resolvable (clarification; keeps the user's choice to stop an agent's calls) | PD-0008 item 2 |
| 2026-11-06 | Is a Goal required in the clone dialog? | pm-resolvable (conforms to PD-0003 item 1: only Create room requires one) | PD-0008 item 5 |
| 2026-11-06 | Architect PC-01: sleep is run state with a reason and a time; setting it writes a note | pm-resolvable (keeps the user's choice; no note keeps the chat empty) | PD-0010 item 2 |
| 2026-11-06 | Architect PC-03: Gemini approval mode; effort and Fast mode not on every provider | pm-resolvable (the list PD-0008 expected the architect to correct) | PD-0010 item 2 |
| 2026-11-06 | Architect PC-04: opening any room runs a local CLI sign-in check | pm-resolvable (defines "agent process" as an agent turn) | PD-0010 item 13 |
| 2026-11-06 | Architect PC-05: no Parley dialog closes on a click outside | pm-resolvable (match Create room; same outcome, nothing created) | PD-0010 item 11 (supersedes PD-0008 item 11) |
| 2026-11-06 | Architect PC-06: legacy accounting and hop budget values; per-tab choices | pm-resolvable (copied as is; tab choices are not room settings) | PD-0010 item 3 |
| 2026-11-06 | Architect PC-07: the clone has no old saved brief or recovery copies | pm-resolvable (consistent with PD-0007 item 3) | PD-0010 item 13 |
| 2026-11-06 | Architect PC-02 and C-08: Goal over 2,000 in the dialog | pm-resolvable (option A; PD-0006 item 2 rule, can't grow) | PD-0009 item 1; PD-0010 item 5 |
| 2026-11-06 | Where the menu item sits; dialog title, fields, buttons; when the setup is read; what the new room shows | pm-resolvable (clarifications; same user outcome as PD-0007) | PD-0008 items 1, 11, 12, 13 |

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

Both options give the same menu item, the same dialog and the same new room;
they differ in where the copy is assembled. Feasibility, constraints C-01..C-13,
risks R-01..R-05 and conflicts PC-01..PC-07:
[technical/assessment.md](../technical/assessment.md) (evidence:
[capability-scan.md](../technical/capability-scan.md), [impact.md](../technical/impact.md)).

| Option | User-visible difference | Feasibility verdict | Cost / risk | Trade-off |
| --- | --- | --- | --- | --- |
| A — Server-side clone: the dialog sends the original's name plus the dialog's name, Goal and folder; the server copies the setup | Copies the setup exactly as saved at the moment `Create room` is pressed (PD-0008 item 12); a copied Goal over 2,000 or Rules over 8,000 is kept (items 5, 6) | feasible-with-constraints (multi-component) | One new server action; Create room untouched; R-01 (copy must be the C-04 field list, not files) | Meets every PD-0008 item as written; one place lists the copied fields |
| B — Browser-assembled clone: the dialog reads the original's setup and posts it to a widened `POST /api/rooms` | A change saved to the original between opening the dialog and `Create room` is missed (C-10); over-limit text only if the server re-reads the original anyway (C-09) | feasible-with-constraints (multi-component) | Widens Create room's contract (permissions, command, over-limit text); field list in two places (R-02); without C-09 a way around the PD-0006 limits (PC-02) | Item 12 met only approximately; more surface, no user gain |

**Design.** One direction, no exploration (steps 1a–1b skipped): this is
derivative work. The requester fixed the look — reuse the Create room
dialog's styling, 1440 light, no canvas
([raw request](sources/raw-request.md), "Constraints") — and the menu item
joins the existing Room actions menu. There is no direction to debate.

**Chosen: A** ([PD-0009](../../../decisions/PD-0009-clone-room-setup-chosen-option-server-side.md));
B rejected with its reasons there. **PM recommendation was A.** It meets PD-0008 items 5, 6 and 12 as written, B
does not without re-reading the original on the server anyway (C-09), and A
leaves Create room's contract unchanged. The two differ only in internal
shape except that B can miss a last-moment change, which A avoids: choosing
the option that keeps the accepted outcome intact is the PM's under §4.1.

## Consultation log

| Date | Delegate role | Question | Answer / verdict | Recorded as |
| --- | --- | --- | --- | --- |
| 2026-11-06 | ROLE-planner (technical architect, `product-feasibility-assessment`) — vendor claude, model opus | Feasibility of options A (server-side clone) and B (browser-assembled clone) for REQ-0004, with capability scan and system impact (size rule §9d.1) | A: feasible-with-constraints (multi-component); B: feasible-with-constraints (multi-component); C-01..C-13; R-01..R-05; PC-01..PC-07 all pm-resolvable; no requester question; recommends A | Consultation log; [technical/assessment.md](../technical/assessment.md), [capability-scan.md](../technical/capability-scan.md), [impact.md](../technical/impact.md); CAP-0002 revision 2; rulings to PD-0010 at SOLUTION_CONVERGENCE |
| 2026-11-06 | ROLE-product-designer, design author (`design-lead`) — vendor claude, model fable | Step 1b reference frame of PD-0009 item 3 for REQ-0004: Room actions menu with `Clone room setup…` and the `Clone room setup` dialog, 1440 light | DONE — `cba8cfe` on `design/INIT-0015-clone-room-setup`: `design/heroes/clone-room-setup` (.dc.html, .png), `approach.md` with two proposals (folder note, optional markers) | Merged into the product branch at `a5cc3ee`; both proposals dropped (not in REQ-0004; the requester asked for a short dialog); `DES-0002` |
| 2026-11-06 | ROLE-planner (technical architect, `story-set-technical-coherence`) — vendor claude, model opus | Coherence of the draft set (REQ-0004 rev 2) for option A; round 1 of 2, full pass, terminal unless blocking (§9d.3) | `coherent`; 0 blocking, 3 non-blocking (1: verification setup for test rooms; 2: message check needs the fake provider; 3: broken PD-0010 link) | [technical/coherence.md](../technical/coherence.md); all three fixed inline in REQ-0004 rev 3 (Notes, Scope link); terminal round, no round 2 |
| 2026-11-06 | ROLE-product-designer, DES recorder (`des-recorder`) — vendor claude, model sonnet | Step 11, adapted by PD-0009 item 3: record the reference frame | DONE — [DES-0002](../../../design/DES-0002-clone-room-setup-reference-frame.md), accepted, `local_export` the three hero files; index row; counter `design: 2` | `DES-0002` on REQ-0004 |
| 2026-11-06 | ROLE-product-readiness-reviewer — vendor claude, model sonnet | Readiness of REQ-0004 (rev 3) on R13–R18 plus R8/R9 flag-only clauses, cycle 1 round 1 | READY, 0 findings | Readiness log row (round 1, cycle 1); no Q- needed |

## Escalation log

| Date | Question | `Q-` | Asked of | Answer | Recorded as |
| --- | --- | --- | --- | --- | --- |

## Stories

| `REQ-` | Title | Status | `CAP-` | `DES-` | Sequencing note |
| --- | --- | --- | --- | --- | --- |
| REQ-0004 | The user clones a room's setup into a new room with an empty chat, from the room's menu | accepted | CAP-0002 | DES-0002 | `depends_on: [none]`; on the frontier; starts from `main` at or after `704039f` (Room Brief merged) |

## Design coverage

| `REQ-` | Coverage |
| --- | --- |
| REQ-0004 | needs-engineering (DES-0002 is a static reference frame; the menu item, dialog and server copy are built by engineering) |

## Readiness log

Written by `ROLE-product-readiness-reviewer` only. One row per review round,
appended — a prior row is never edited, withdrawn, or overwritten.

| Date | Round | Verdict | Conditions | Reviewer | Story-set digest | Findings | Finding ids |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-06 | 1 (cycle 1) | READY | none | ROLE-product-readiness-reviewer (claude, claude-sonnet-5-5) | (REQ-0004, 3, 2026-11-06); INIT-0015 revision 3 — matches the validator report | 0 (0 blocking). R13–R18 pass; R8 contradiction clause: none (PD-0010 vs REQ-0004 and constraints #1–#3 agree); R9 currency clause: coherence r1 certified REQ-0004 rev 2, the story is rev 3 same date, date gap flagged only, no substantive mismatch (its three non-blocking defects were fixed in rev 3); B10: not applicable (DES-0002 is not `kind: code`). Q-0001 stays a non-blocking open question | none |

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
- 2026-11-06 — PRODUCT_DEFINITION: initiative populated (O1, out of scope,
  success measures); REQ-0004 drafted; PD-0007 (requester's decisions) and
  PD-0008 (fourteen details, all pm-resolvable under §4.1); Q-0001 raised
  (`important`, non-blocking, default no, triage A); Product Definition
  Contract written inline (size rule §9d.2) and validated against both raw
  sources item by item. Draft coverage run: R4 (no `DES-` yet) and R9 (no
  chosen option yet) pending by phase; no other defect.
- 2026-11-06 — Dispatch log: `SOLUTION_EXPLORATION | ROLE-planner (architect) | claude | opus | L | ae406b6d244ae3f4f | technical/capability-scan.md, impact.md, assessment.md`.
- 2026-11-06 — SOLUTION_EXPLORATION: design steps 1a–1b skipped as derivative
  work (see `## Options`, Design); the reference frame and `DES-` come at
  DECOMPOSITION, at the depth PD-0004 set for INIT-0014. CAP-0002 corrected to
  revision 2 from the capability scan (current-state facts only, not the
  shipped change).
- 2026-11-06 — SOLUTION_CONVERGENCE: PD-0009 (option A; design depth one
  static frame, PD-0004 precedent) and PD-0010 (behaviour; supersedes PD-0008
  with PC-01, PC-03..PC-07 and R-04 applied; changes items 2, 3, 4, 5, 6, 11,
  13) accepted and indexed; PD-0008 superseded (decision and archive index
  rows); REQ-0004 revision 2 aligned (PD-0010 items, C-01..C-08, C-12, C-13,
  R-03); Solution Contract written inline (size rule §9d.2) and validated
  against PD-0009, PD-0010, PD-0007 and the assessment. No requester question.
- 2026-11-06 — Dispatch log: `DECOMPOSITION (step 1b) | ROLE-product-designer (design-lead) | claude | fable | M | a4805c6fd4fa638e0 | design/heroes/* at cba8cfe`; `DECOMPOSITION (coherence r1) | ROLE-planner (architect) | claude | opus | M | af601cbad2d260c31 | technical/coherence.md`; `DECOMPOSITION (step 11) | ROLE-product-designer (des-recorder) | claude | sonnet | S | a377e0bf6e11a5048 | design/DES-0002-clone-room-setup-reference-frame.md`. `READINESS (round 1) | ROLE-product-readiness-reviewer | claude | sonnet | M | a2d516b942a711b7e | Readiness log row`.
- 2026-11-06 — DECOMPOSITION: design worktree
  `~/Factory/Artifacts/projects/PRL/initiatives/INIT-0015/design-worktree` on
  `design/INIT-0015-clone-room-setup` (from `d520504`); design steps per
  PD-0009 item 3: 1a skipped (derivative), 1b one reference frame, 2a–10
  not run (no React/Storybook, constraints #2), design branch merged locally
  into the product branch at `a5cc3ee` (no PR: nothing is pushed), 11
  `DES-0002`. The author's commit trailer names the model that ran (fable).
  Coherence round 1 `coherent`, terminal; its three non-blocking defects fixed
  in REQ-0004 rev 3, with the composition criterion made explicit that long
  values scroll inside their own fields. REQ-0004 accepted with `DES-0002`;
  convergence declared. Publication push skipped: the run instructions allow
  a push only where the release step strictly requires it.
- 2026-11-06 — Coverage, full mode (PM, inline): R1–R12 all pass, 0 defects.
  Map: O1 → REQ-0004 (accepted) → CAP-0002, DES-0002 (3 exports on disk),
  PD-0003/0004/0006/0007/0009/0010 (accepted), Q-0001 (`important`, not a
  dependency); depends_on none; coherence r1 `coherent`, terminal; counters
  requirement 4, design 2, decision 10; every link in the changed records
  resolves. Story-set digest of this report: `(REQ-0004, 3,
  2026-11-06)`; INIT-0015 revision 3.
- 2026-11-06 — Step 12 usage (`node ~/Factory/Core/ledger/summary.mjs INIT-0015`):
  planner opus 2 runs, 76k out; author fable 1 run, 39k out; des-recorder
  sonnet 1 run, 2k out. No fix score: no design PR (PD-0009 item 3).

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-06 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory present, packet `ready` | Entered. Hooks: HOOK-canonical-root pass (one root), HOOK-hydrate pass | 4c42601397d4b647 |
| 2026-11-06 | INTAKE | DISCOVERY | ROLE-product-manager | Exit criteria met: one initiative, one problem, one requester, every ambiguity classified (none escalation-class). size: small (≤3 stories expected) | Exited INTAKE, entered DISCOVERY. Hooks: HOOK-initiative-resolved pass, HOOK-phase-entry pass | 4c42601397d4b647 |
| 2026-11-06 | DISCOVERY | PRODUCT_DEFINITION | ROLE-product-manager | Exit criteria met: target users, jobs with sources, CAP-0002 recorded as current state and CAP-0001 mapped, success signals, non-goals | Exited DISCOVERY, entered PRODUCT_DEFINITION. Hooks: HOOK-phase-entry pass (A9: Discovery section complete) | b9db171eb1a049ab |
| 2026-11-06 | PRODUCT_DEFINITION | SOLUTION_EXPLORATION | ROLE-product-manager | Exit criteria met: outcome O1, non-empty out of scope, success measures, draft REQ-0004 covering O1, Product Definition Contract citing both raw sources | Exited PRODUCT_DEFINITION, entered SOLUTION_EXPLORATION. Hooks: HOOK-phase-entry pass (F1 out of scope non-empty; F2 draft coverage run, R4/R9 pending by phase, no R1) | 07c051a6ed7f80aa |
| 2026-11-06 | SOLUTION_EXPLORATION | SOLUTION_CONVERGENCE | ROLE-product-manager | Exit criteria met: options A and B recorded, each with a feasibility verdict (both feasible-with-constraints) and a user-visible trade-off; PM recommendation A with reasoning; design 1a–1b skipped as derivative work, justified | Exited SOLUTION_EXPLORATION, entered SOLUTION_CONVERGENCE. Hooks: HOOK-phase-entry pass (X1 two options; X2 verdicts in set; one Consultation log row for the one delegate response) | e1586e7ff9742488 |
| 2026-11-06 | SOLUTION_CONVERGENCE | DECOMPOSITION | ROLE-product-manager | Exit criteria met: one accepted chosen-option PD-0009 (A, feasible-with-constraints), indexed; REQ-0004 revision 2 consistent with PD-0009 and PD-0010; B rejected, none left under consideration; Solution Contract cites PD-0009 and its design concept (PD-0009 item 3) | Exited SOLUTION_CONVERGENCE, entered DECOMPOSITION. Hooks: HOOK-decision-capture pass (R1 accepted + index row in one commit; R2 PD-0010 supersedes PD-0008, both ways, PD-0008 stays in decisions/; R3 rejected options non-empty; D11 counter 10); HOOK-phase-entry pass (exactly one accepted chosen-option PD-, non-infeasible verdict) | 5581573a0fbaafdd |
| 2026-11-06 | DECOMPOSITION | READINESS | ROLE-product-manager | Exit criteria met: O1 maps to accepted REQ-0004; REQ-0004 meets §10.3 (accepted, one testable outcome, pass/fail AC, CAP-0002, DES-0002 with exports on disk, depends_on none, no blocker Q-, no PD- or constraint contradicted, indexed); coherence round 1 of 2 (terminal, §9d.3) `coherent`, no open blocking defect; convergence declared | Exited DECOMPOSITION, entered READINESS. Hooks: HOOK-design-coverage pass (DES-0002 accepted, exports on disk, names REQ-0004); HOOK-dependency-graph pass (one node, acyclic); HOOK-phase-entry pass (`converged: true`; traceability full mode 0 defects; terminal coherence not regression-required; accepted DES-0002 for the user-facing story). Publication push skipped: the run instructions forbid pushing outside the release step | 94e15b3ace8ae733 |
| 2026-11-06 | READINESS | ENGINEERING_READY | ROLE-product-manager | Exit criteria met: readiness cycle 1 round 1 `READY`, 0 findings, no conditions; terminal under §9d.4 (no blocking finding) | Exited READINESS, entered ENGINEERING_READY. Hooks: HOOK-readiness pass (verdict READY, not void; story-set digest (REQ-0004, 3, 2026-11-06), INIT-0015@3 matches disk); HOOK-phase-entry pass | 1dba333bc580f2a0 |

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
