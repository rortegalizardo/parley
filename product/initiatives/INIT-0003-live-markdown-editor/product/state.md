---
id: PSTATE-INIT-0003
type: product-state
title: Product definition state for INIT-0003
status: authoritative
revision: 6
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
updated_by_role: ROLE-product-manager
initiative: INIT-0003
phase: DECOMPOSITION
phase_entered: 2026-11-08
requester: Ricardo (decided in the room "Parlay Product Evolution"; relayed by his side session)
next_action: "ROLE-product-manager: dispatch the planner for coherence round 1 (story-set-technical-coherence, round 1 of 2), fix non-blocking findings, accept REQ-0005 and REQ-0006, declare convergence (DECOMPOSITION)"
blocked_by: []
converged: false
readiness_verdict: none
stories: [REQ-0005, REQ-0006]
design_refs: [DES-0003]
decisions: [PD-0011, PD-0012, PD-0013]
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

## Next action

ROLE-product-manager: dispatch design-lead for the two reference frames
(PD-0012 item 4) and des-recorder for DES-0003, then coherence round 1, accept
REQ-0005 and REQ-0006, declare convergence (DECOMPOSITION).

## Blocked by

nothing.

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

## Options

One option, decided by the requester, so the table has one row and the choice is
a decision already made, not a trade-off ([PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md),
Options considered). The alternatives are recorded there as ruled out by the
requester: a rich-text editor, a hand-built `contenteditable`, a toolbar, a
preview toggle. Feasibility, constraints C-01..C-20, risks R-01..R-08 and
conflicts PC-01..PC-09:
[technical/assessment.md](../technical/assessment.md) (evidence:
[capability-scan.md](../technical/capability-scan.md), [impact.md](../technical/impact.md)).

| Option | User-visible difference | Feasibility verdict | Cost / risk | Trade-off |
| --- | --- | --- | --- | --- |
| A — one shared textarea-like component on CodeMirror 6, one prebuilt file in `ui/vendor/` (PD-0011) | Markdown formats in place as the user types, in the chat bar and in every multi-line Markdown field of Room Settings, New Room, Clone and agent instructions; the Edit/Preview toggle goes | feasible-with-constraints (multi-component) | One-line static-file change on the server (C-01); the editor is not a native field, so every id lookup, `.value`, `form.reset()`, `label for` and test read must be made to work (C-09, C-15, C-16, C-17); 35 test lines in 9 files updated; editor re-created at the settings re-render sites (C-11); the CodeMirror behaviour is documented, not yet run (R-01) | The requester's choice; a vendored third-party file a maintainer regenerates, and a second Markdown renderer to keep aligned with chat (C-07) |

**Design.** One direction, no exploration (steps 1a–1b skipped): the look is the
existing chat Markdown style and the requester ruled out a canvas and a
multi-page design track ([raw request](sources/raw-request.md), "Constraints",
"Done means"). There is no direction to debate. The one static reference frame
that the user-facing stories need for `composition:` is planned at
DECOMPOSITION (precedent: PD-0004 item 1, PD-0009 item 3).

**Chosen: A** ([PD-0012](../../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md);
rulings in [PD-0013](../../../decisions/PD-0013-live-markdown-editor-behaviour-rulings.md)),
because the requester decided it. **PM recommendation: A.** The
architect found no reason it cannot work with the existing UI, and no stop
condition under PD-0011 item 5. Eleven small product rulings come with it, all
within the requester's decided behaviour; none is requester-owned.

## Consultation log

| Date | Delegate role | Question | Answer / verdict | Recorded as |
| --- | --- | --- | --- | --- |
| 2026-11-08 | ROLE-planner (technical architect, `product-feasibility-assessment`) — vendor claude, model opus | Feasibility of Option A (one shared CodeMirror 6 editor, one prebuilt vendor file) for REQ-0005 and REQ-0006, with capability scan and system impact (size rule §9d.1) | A: feasible-with-constraints (multi-component); C-01..C-20; R-01..R-08; PC-01..PC-09 (PC-02 blocking as written: no text draft exists today); PR-1..PR-11 all pm-resolvable; no requester question; no cooling-period exception needed; 6 corrections to CAP-0003 | Consultation log; [technical/assessment.md](../technical/assessment.md), [capability-scan.md](../technical/capability-scan.md), [impact.md](../technical/impact.md); CAP-0003 revision 2; rulings to PD-0012 at SOLUTION_CONVERGENCE |
| 2026-11-08 | ROLE-product-designer (design author, step 1b, one direction) — vendor claude, model fable | Draw the two reference frames PD-0012 item 4 names (Room settings Brief and Agents; chat bar) at 1440, light, from today's markup and `ui/styles.css` | Delivered both frames and renders (1440 scroll width, no console errors); no toolbar, toggle, preview or language header; fence lines as blank strips; marks on the edited line only; Agents tab without the Edit/Preview toggle; no Proposals that need scope; two pre-existing light-theme observations (image chip close mark, inline-code background) left unchanged | Design branch merged at `8a65ee2`; frames under `design/heroes/`; [DES-0003](../../../design/DES-0003-markdown-editor-reference-frames.md) |
| 2026-11-08 | ROLE-product-designer (DES recorder, step 11, hero-frame record) — vendor claude, model sonnet | Record DES-0003 and its index row | DONE, commit `8d04ea3`; `local_export` the five files; requirements REQ-0005, REQ-0006 | [DES-0003](../../../design/DES-0003-markdown-editor-reference-frames.md), `design/index.md` row |

## Escalation log

| Date | Question | `Q-` | Asked of | Answer | Recorded as |
| --- | --- | --- | --- | --- | --- |

## Stories

| `REQ-` | Title | Status | `CAP-` | `DES-` | Sequencing note |
| --- | --- | --- | --- | --- | --- |
| REQ-0005 | The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type | draft | CAP-0001, CAP-0002 | DES-0003 | `depends_on: [none]`; on the frontier; builds the shared editor and the vendor file; engineering starts only after PRL-6 is merged and green on `main` (PD-0011 item 10) |
| REQ-0006 | The user types Markdown in the chat bar and sees it format as they type | draft | CAP-0003 | DES-0003 | `depends_on: [REQ-0005]`; reuses the shared editor and the vendor file; same PRL-6 precondition |

## Design coverage

| `REQ-` | Coverage |
| --- | --- |
| REQ-0005 | needs-engineering (DES-0003 is a static reference frame; the shared editor, the vendor file and the replacement of the plain text boxes are built by engineering) |
| REQ-0006 | needs-engineering (DES-0003 is a static reference frame; the chat bar editor is built by engineering) |

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-08 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory present, packet `ready` | Entered. Hooks: HOOK-canonical-root pass (one root, `/Users/ortega/Desktop/Projects/parley/product`), HOOK-hydrate pass | n/a |
| 2026-11-08 | INTAKE | DISCOVERY | ROLE-product-manager | Exit criteria met: one initiative, one problem, one requester, every ambiguity classified (none escalation-class). size: small (≤3 stories expected) | Exited INTAKE, entered DISCOVERY. Hooks: HOOK-initiative-resolved pass, HOOK-phase-entry pass | n/a |
| 2026-11-08 | DISCOVERY | PRODUCT_DEFINITION | ROLE-product-manager | Exit criteria met: target users, jobs with sources, CAP-0001 and CAP-0002 mapped (chat bar has no record; CAP-0003 follows the scan), success signals, non-goals | Exited DISCOVERY, entered PRODUCT_DEFINITION. Hooks: HOOK-phase-entry pass (A9: Discovery section complete) | n/a |
| 2026-11-08 | PRODUCT_DEFINITION | SOLUTION_EXPLORATION | ROLE-product-manager | Exit criteria met: outcome O1 and O2, explicit out-of-scope, success measures, draft REQ-0005 and REQ-0006 covering both outcomes with no uncovered stated need, Product Definition Contract (accepted) citing both raw sources; PD-0011 accepted | Exited PRODUCT_DEFINITION, entered SOLUTION_EXPLORATION. Hooks: HOOK-phase-entry pass (F1: outcome and out-of-scope present; F2: draft-mode coverage run with no R1 defect: O1 maps to REQ-0005, O2 to REQ-0006; R3, R6, R7 and R12 also clean on the two drafts) | n/a |
| 2026-11-08 | SOLUTION_EXPLORATION | SOLUTION_CONVERGENCE | ROLE-product-manager | Exit criteria met: the one option is recorded with a feasibility verdict (feasible-with-constraints) and its user-visible trade-off; single option justified as the requester's decision (PD-0011), alternatives ruled out by him; PM recommendation A with reasoning; design 1a–1b skipped, justified | Exited SOLUTION_EXPLORATION, entered SOLUTION_CONVERGENCE. Hooks: HOOK-phase-entry pass (X1 justified single decided option; X2 verdict in the set; one Consultation log row for the one delegate response) | n/a |
| 2026-11-08 | SOLUTION_CONVERGENCE | DECOMPOSITION | ROLE-product-manager | Exit criteria met: one accepted chosen-option PD-0012 (A, feasible-with-constraints), indexed; REQ-0005 and REQ-0006 revision 2 consistent with PD-0012 and PD-0013 and carrying the technical constraints; no competing option under consideration; Solution Contract cites PD-0012 and its design concept (item 4) | Exited SOLUTION_CONVERGENCE, entered DECOMPOSITION. Hooks: HOOK-decision-capture pass (accepted PD-0012 and PD-0013, each with its index row in one commit; counter 13); HOOK-phase-entry pass (exactly one accepted chosen-option PD-, non-infeasible verdict) | n/a |

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
- 2026-11-08 — Dispatch log. SOLUTION_EXPLORATION | ROLE-planner (technical
  architect, `product-feasibility-assessment` with capability scan and system
  impact in one dispatch, §9d.1) | claude | opus | M | ledger run
  `a26103177f61fd752` | `technical/capability-scan.md`, `technical/impact.md`,
  `technical/assessment.md`. The architect wrote only those three files.
- 2026-11-08 — PM verification of the architect's report (§8 rule 7), against
  the code on `main` at `fa35e69`: the Enter handler (`ui/app.js:4167-4170`)
  has no composition check; no text draft exists (the only `draft` state at
  `ui/app.js:35-36` is attachments; no storage of composer text); sent text is
  trimmed (`ui/app.js:3987`, `parley.mjs:8130`); the Brief's Goal and Rules are
  stored untrimmed (`parley.mjs:2215-2224`); instructions are trimmed
  (`parley.mjs:513-519`). The REQ-0006 draft criterion on drafts and on
  Enter-during-composition read "as today" for behavior that does not exist, so
  the drafts criterion is corrected at SOLUTION_CONVERGENCE (PR-6, PR-7).
- 2026-11-08 — SOLUTION_CONVERGENCE: PD-0012 (chosen option A with its binding
  constraints and the two-frame design reference) and PD-0013 (fifteen rulings
  on the architect's PR-1..PR-11 and PC-01..PC-09, all pm-resolvable under §4.1,
  none requester-owned) accepted. REQ-0005 and REQ-0006 revised to revision 2:
  field list settled, backend wording, selection and fence rules, trimming,
  limits, Enter during composition, text left in the bar when switching rooms,
  Ctrl+click, and the technical constraints sections. The brief's "drafts ...
  as today" and "Enter exactly as today" are kept by describing what exists
  today; the one real change is Enter during an open composition, which sends
  nothing (PD-0013 item 11). Solution Contract accepted.
- 2026-11-08 — Dispatch log. DECOMPOSITION | ROLE-product-designer (design author, step 1b; one dispatch for both frames) | claude | fable | M | ledger run `ae666f070d55b9e2d` | `design/heroes/` (two frames, two renders, `approach.md`), commit `40aee93`, merged to main at `8a65ee2`.
- 2026-11-08 — Dispatch log. DECOMPOSITION | ROLE-product-designer (DES recorder, step 11) | claude | sonnet | S | ledger run `ad4bba8359e160a06` | DES-0003 and its index row, commit `8d04ea3`. The recorder was briefed for a hero-frame record (the code-DES steps do not apply to Parley); `manifest.yaml` design counter bumped to 3 by the PM.
- 2026-11-08 — PM validation of the frames against the raw request, PD-0013 and the stories (the PNGs and `approach.md` read, not the report): no toolbar, toggle, preview or extra button; Goal unfocused shows no marks; Rules focused shows the edited line's marks only and the fence lines as blank strips with no language header; closed bullets show a bullet and numbers as typed; the agent instructions have no Edit/Preview toggle and keep Expand editor; the chat bar frame has the chips, the sent message for comparison and the exact placeholder; 1440 scroll width on both. Nothing needs a new requirement; the two light-theme observations are existing behaviour, outside this initiative.

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
