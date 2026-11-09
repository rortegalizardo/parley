---
id: PSTATE-INIT-0003
type: product-state
title: Product definition state for INIT-0003
status: authoritative
revision: 3
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
updated_by_role: ROLE-product-manager
initiative: INIT-0003
phase: SOLUTION_EXPLORATION
phase_entered: 2026-11-08
requester: Ricardo (decided in the room "Parlay Product Evolution"; relayed by his side session)
next_action: "ROLE-product-manager: dispatch the technical architect (planner, opus) for one product-feasibility-assessment writing capability-scan.md, impact.md and assessment.md; fill the Options table (SOLUTION_EXPLORATION)"
blocked_by: []
converged: false
readiness_verdict: none
stories: [REQ-0005, REQ-0006]
design_refs: []
decisions: [PD-0011]
---

# Product definition state — INIT-0003

`phase` above is the authority for where this work stands on the product side.
Delivery stage lives in `delivery/state.md` and is owned by `ROLE-orchestrator`;
these two files never describe the same thing and never share a writer.

## Where this stands

New initiative from a raw request whose product decision the requester already
made ([raw request](sources/raw-request.md)). The requester pre-authorized the
whole run with no approval stops ([run instructions](sources/run-instructions.md)).

## Problem statement

Goal, Rules, agent instructions and chat messages are Markdown, but the user
types them as plain text and sees the formatting only after sending (chat) or
in a separate Edit/Preview toggle (agent instructions). The requester decided
one shared live Markdown editor for the chat bar and every multi-line field in
Room Settings: text formats in place as you type, with no toggle and no
separate preview, and the saved text is exactly what was typed
([raw request](sources/raw-request.md), "Decision to build", "Key rule").

## Ambiguity log

| Date | Ambiguity | Class (`pm-resolvable` / `escalation`) | Resolution or `Q-` |
| --- | --- | --- | --- |
| 2026-11-08 | "Every multi-line field in Room Settings" versus the brief's "Where" list: which fields exactly | pm-resolvable (the requester's phrase plus his list is the boundary; the architect's scan lists the fields; single-line fields and the 200-character Decision field stay plain by his word) | recorded at PRODUCT_DEFINITION |
| 2026-11-08 | "The line being edited": a Markdown line, a block, or a wrapped display line | pm-resolvable (clarification; same outcome the requester described) | recorded at SOLUTION_CONVERGENCE |
| 2026-11-08 | Constraint #2 says "no build step"; the requester decided one prebuilt vendor file with a generating command | pm-resolvable only as recording the requester's own decision: he owns constraint #2 and decided the exception ([raw request](sources/raw-request.md), "How to build") | PD-0011 (amends constraint #2 for that one file) |
| 2026-11-08 | If CodeMirror 6 does not work with the existing UI | requester-decided contingency: stop and report, never pick something else ([raw request](sources/raw-request.md), "How to build") | architect verdict at SOLUTION_EXPLORATION; `infeasible` would raise a `Q-` |
| 2026-11-08 | How the field length limits behave in an editor that is not a textarea | pm-resolvable (conforms to PD-0006 item 2 and principle 2; the brief says limits "keep working") | recorded at SOLUTION_CONVERGENCE |
| 2026-11-08 | Cmd+click versus other platforms | pm-resolvable (clarification) | recorded at SOLUTION_CONVERGENCE |
| 2026-11-08 | Story boundaries: where the shared component and the vendor file ship | pm-resolvable (§4.1: story boundaries; the requester fixed the order, settings first) | recorded at DECOMPOSITION |

## Discovery

No interview round was run: the requester's decision is final and
pre-authorized ([run instructions](sources/run-instructions.md)); every fact
below is cited.

**Target users.**
- The room owner (the requester, Ricardo): types Goal, Rules, agent
  instructions and chat messages, all of them Markdown, and wants to see them
  formatted as he writes ([raw request](sources/raw-request.md), "Decision to
  build").
- The room's agents: receive the saved text exactly as typed; nothing about
  what they are sent changes ([raw request](sources/raw-request.md), "Key
  rule").

**Jobs and problems, with evidence.**
1. *Write Markdown and see it formatted while writing.* Goal, Rules and chat
   are Markdown but are typed as plain text today ([raw request](sources/raw-request.md),
   "Decision to build": "that is the problem"). Agent instructions have a
   separate Edit/Preview toggle in Create room and Room settings
   (`CHECKPOINT.md`, 2026-10-26 "Standing agent instructions now have
   Edit/Preview"; `ui/app.js` `instructionsModeHTML`).
2. *Keep the saved text exactly as typed.* The editor changes appearance and
   never rewrites Markdown; backend, tokens sent, the "What agents see"
   preview and character counts do not change; existing text, indentation
   included, stays intact ([raw request](sources/raw-request.md), "Key rule";
   [principle 2](../../../project/principles.md)).
3. *Keep the chat bar working.* `@` agent picker, slash commands, Enter and
   Shift+Enter, drafts, paste, attachments, undo and redo, long text, large
   pastes, accent and IME typing ([raw request](sources/raw-request.md), "Chat
   bar must keep working").

**Current-state capability mapping.**
[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md) — the Room
Brief (Goal, Rules, Decisions) is edited as plain text in Room settings
(changed: gains the live editor).
[CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md) — Create
room, the Room settings agent instructions and the Clone dialog (changed: the
same).
The chat bar has no capability record. CAP-0003, "The user writes and sends
messages in the chat bar", is recorded from the architect's capability scan at
SOLUTION_EXPLORATION (precedent: CAP-0002 in INIT-0002) and corrected there.

**Success signals** ([raw request](sources/raw-request.md), "Done means").
- In the chat bar and in Goal: each Markdown element renders live, the
  saved or sent text matches what was typed, undo and paste work.
- In the chat bar: Enter, Shift+Enter and an `@` mention work.
- Settings text is unchanged after closing and reopening.
- Shown by one focused browser check; no new unit or smoke suites.

**Known non-goals** ([raw request](sources/raw-request.md), "Behavior",
"How to build"). A formatting toolbar; a preview toggle or separate preview;
tables and raw HTML formatting (they stay plain text, raw HTML never runs);
single-line fields and the 200-character Decision field; any change to the
backend, tokens sent, "What agents see" or character counts; TipTap or any
rich-text editor; a hand-built `contenteditable`.

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-08 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory present, packet `ready` | Entered. Hooks: HOOK-canonical-root pass (one root, `/Users/ortega/Desktop/Projects/parley/product`), HOOK-hydrate pass | n/a |
| 2026-11-08 | INTAKE | DISCOVERY | ROLE-product-manager | Exit criteria met: one initiative, one problem, one requester, every ambiguity classified (none escalation-class). size: small (≤3 stories expected) | Exited INTAKE, entered DISCOVERY. Hooks: HOOK-initiative-resolved pass, HOOK-phase-entry pass | n/a |
| 2026-11-08 | DISCOVERY | PRODUCT_DEFINITION | ROLE-product-manager | Exit criteria met: target users, jobs with sources, CAP-0001 and CAP-0002 mapped (chat bar has no record; CAP-0003 follows the scan), success signals, non-goals | Exited DISCOVERY, entered PRODUCT_DEFINITION. Hooks: HOOK-phase-entry pass (A9: Discovery section complete) | n/a |
| 2026-11-08 | PRODUCT_DEFINITION | SOLUTION_EXPLORATION | ROLE-product-manager | Exit criteria met: outcome O1 and O2, explicit out-of-scope, success measures, draft REQ-0005 and REQ-0006 covering both outcomes with no uncovered stated need, Product Definition Contract (accepted) citing both raw sources; PD-0011 accepted | Exited PRODUCT_DEFINITION, entered SOLUTION_EXPLORATION. Hooks: HOOK-phase-entry pass (F1: outcome and out-of-scope present; F2: draft-mode coverage run with no R1 defect: O1 maps to REQ-0005, O2 to REQ-0006; R3, R6, R7 and R12 also clean on the two drafts) | n/a |

## Session notes

- 2026-11-08 — Hydration: packet `ready`, no initiative resolved (new ask),
  profile S, head `a40af74`. Neighbouring: CAP-0001 (room shared context, Room
  Brief), CAP-0002 (room creation and setup), PD-0002..PD-0006 (Room Brief),
  PD-0007..PD-0010 (clone setup); INIT-0001 and INIT-0002 `active`, both
  delivered on `main`. No rejected decision matches this ask.
- 2026-11-08 — Triage verdict `new-initiative`: no capability does this, no
  decision settled or rejected it, no constraint forbids it (constraint #2 is
  read with the requester's own decision, PD-0011), no initiative covers it,
  and the ask names one outcome.
- 2026-11-08 — Storage preflight `READY`: class product records; owner
  ROLE-product-manager; root `/Users/ortega/Desktop/Projects/parley/product`
  (key PRL); destination `initiatives/INIT-0003-live-markdown-editor/` on
  `main` (run instructions: commit product memory to `main`); provenance the
  two raw sources.
- 2026-11-08 — Size: small (≤3 stories expected). Two stories are expected
  (Room Settings, then the chat bar), so the size rule §9d applies.
- 2026-11-08 — PRODUCT_DEFINITION: PD-0011 records the requester's decisions
  (the decision to build, the shape, the order, the vendor-file exception to
  constraint #2, the done check, the PRL-6 precondition) and amends
  `constraints.md` #2 for that one file. REQ-0005 (Room Settings and the New
  Room and Clone dialogs, builds the shared editor and the vendor file) and
  REQ-0006 (chat bar, depends on REQ-0005) drafted inline (size rule §9d.2),
  neutral wording checked against the raw request. Product Definition Contract
  accepted. No escalation-class ambiguity; no `Q-` raised.

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
