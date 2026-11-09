---
id: PSTATE-INIT-0003
type: product-state
title: Product definition state for INIT-0003
status: authoritative
revision: 9
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
updated_by_role: ROLE-product-manager
initiative: INIT-0003
phase: HANDOFF
phase_entered: 2026-11-08
requester: Ricardo (decided in the room "Parlay Product Evolution"; relayed by his side session)
next_action: "ROLE-orchestrator: deliver ticket_code PRL-14 (REQ-0005, Room settings and the dialogs, builds the shared editor), then PRL-15 (REQ-0006, chat bar) once PRL-14 is merged; each one ticket_code at a time, started by the requester or the launching session, and only after PRL-6 is merged and green on main. The product manager dispatches nothing further."
blocked_by: []
converged: true
readiness_verdict: READY
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

Two stories are accepted and the set is converged: REQ-0005 (Room settings and
the New Room and Clone dialogs, builds the shared editor and the vendor file)
and REQ-0006 (chat bar, after REQ-0005). Option A (PD-0012) was assessed
feasible-with-constraints; the reference frames are DES-0003; coherence ended
`coherent` at its terminal round. The independent readiness verdict is `READY`
(round 1, no finding). The packet and manifest are written; the tickets are
created: PRL-14 (REQ-0005) and PRL-15 (REQ-0006), in that order.

## Problem statement

Goal, Rules, agent instructions and chat messages are Markdown, but the user
types them as plain text and sees the formatting only after sending (chat) or
in a separate Edit/Preview toggle (agent instructions). The requester decided
one shared live Markdown editor for the chat bar and every multi-line field in
Room Settings: text formats in place as you type, with no toggle and no
separate preview, and the saved text is exactly what was typed
([raw request](sources/raw-request.md), "Decision to build", "Key rule").

## Next action

ROLE-orchestrator: deliver ticket_code PRL-14 (REQ-0005, Room settings and the
dialogs, builds the shared editor), then PRL-15 (REQ-0006, chat bar) once PRL-14
is merged. Each one `ticket_code` at a time, started by the requester or the
launching session, and only after PRL-6 is merged and green on `main`. The
product manager dispatches nothing further; engineering is not dispatched from
here.

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
| 2026-11-08 | ROLE-planner (technical architect, `story-set-technical-coherence`, full pass, round 1 of 2) — vendor claude, model opus | Is the draft set REQ-0005 then REQ-0006 (revision 2) technically coherent, sequenced possibly, free of an assumed missing capability and of verdict drift? | `defects-open`: 1 blocking (defect 1: the library's default writes a dropped file's text into the field, on top of the page's own file attach; resolvable in decomposition, no product question) and 6 non-blocking (2 suite criterion on REQ-0005, 3 test-line counts, 4 a tab can only be pasted, 5 and 6 two scope lines, 7 harness is Chromium only); no verdict drift, no regression; no `Q-` | [technical/coherence.md](../technical/coherence.md); repaired inline by the PM in the same session (both stories to revision 3: behaviour sentence, acceptance criterion and constraint C-21 for the drop, REQ-0005 suites criterion, per-story test counts, pasted tab, scope wording, Chromium note), commit `7a0ea41` |
| 2026-11-08 | ROLE-planner (technical architect, `story-set-technical-coherence`, delta re-check, round 2 of 2, terminal) — vendor claude, model sonnet | Did the repair close the seven round-1 defects, and did it add a blocking defect? | `coherent`: all seven `fixed`; 0 open blocking, 0 open non-blocking; terminal for this story set, no round 3 (rule 10) | [technical/coherence.md](../technical/coherence.md) (round-1 rows kept, dispositions updated by the checker); every blocking finding of the terminal round carries disposition `fixed` (R9) |
| 2026-11-08 | ROLE-product-readiness-reviewer (readiness, cycle 1 round 1) — vendor claude, model sonnet | Is INIT-0003 engineering-ready: R13–R18 plus the flag-only R8 and R9 clauses, against the validator report | `READY`, no conditions, 0 findings (0 blocking) | `## Readiness log` row (written by the reviewer); `## Readiness findings` (none) |
| 2026-11-08 | ticket-transcriber (`create-tickets-from-stories` §2, one dispatch for the story set) — vendor claude, model sonnet | Map REQ-0005 and REQ-0006 onto the ticket template, translating every product-identifier reference, with each story's Behavior inlined into Scope and the requester's done-means into Success metric | Two ticket bodies written; 18 and 16 criteria one for one, none carried an identifier; identifier lint 0 matches; a placeholder stood for the first ticket's key in the second; PM-side flags (no partial-delivery sentence exists in REQ-0005, only its stop-and-report rule; REQ-0006's Behavior opening was lossy, so the shared-editor rules were inlined in full; the settings-only server-file sentence was left out of the chat bar ticket) all accepted | Ticket bodies created as PRL-14 and PRL-15 (Ariadne); [delivery/tickets.md](../delivery/tickets.md) |

## Escalation log

| Date | Question | `Q-` | Asked of | Answer | Recorded as |
| --- | --- | --- | --- | --- | --- |

## Stories

| `REQ-` | Title | Status | `CAP-` | `DES-` | Sequencing note |
| --- | --- | --- | --- | --- | --- |
| REQ-0005 | The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type | accepted | CAP-0001, CAP-0002 | DES-0003 | `depends_on: [none]`; on the frontier; builds the shared editor and the vendor file; engineering starts only after PRL-6 is merged and green on `main` (PD-0011 item 10) |
| REQ-0006 | The user types Markdown in the chat bar and sees it format as they type | accepted | CAP-0003 | DES-0003 | `depends_on: [REQ-0005]`; reuses the shared editor and the vendor file; same PRL-6 precondition |

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
| 2026-11-08 | DECOMPOSITION | READINESS | ROLE-product-manager | Exit criteria met: O1 maps to accepted REQ-0005 and O2 to accepted REQ-0006; both meet §10.3 (accepted, one testable outcome, pass/fail acceptance criteria with a `composition:` criterion, CAP-, DES-0003 with five exports on disk, `depends_on` explicit, no blocker `Q-`, no PD- or constraint contradicted, indexed); coherence round 1 `defects-open` (one blocking, repaired) and round 2 (terminal) `coherent`; convergence declared | Exited DECOMPOSITION, entered READINESS. Hooks: HOOK-design-coverage pass (DES-0003 accepted, exports on disk, names REQ-0005 and REQ-0006); HOOK-dependency-graph pass (two nodes, one edge, acyclic); HOOK-phase-entry pass (`converged: true`; coverage full mode 0 defects; terminal coherence not regression-required; accepted DES-0003 for the user-facing stories) | n/a |
| 2026-11-08 | READINESS | ENGINEERING_READY | ROLE-product-manager | Exit criteria met: readiness cycle 1 round 1 `READY`, 0 findings, no conditions; terminal under §9d.4 (no blocking finding) | Exited READINESS, entered ENGINEERING_READY. Hooks: HOOK-readiness pass (verdict READY, not void; story-set digest (REQ-0005, 3; REQ-0006, 3, 2026-11-08), INIT-0003@4 matches disk); HOOK-phase-entry pass | n/a |
| 2026-11-08 | ENGINEERING_READY | HANDOFF | ROLE-product-manager | Exit criteria met: handoff packet complete (H0–H12), delivery manifest `DM-INIT-0003` issued against `READY@2026-11-08` and the same digest, initiative `active`, both stories `engineering-ready`, no blocker `Q-` | Exited ENGINEERING_READY, entered HANDOFF. Hooks: HOOK-handoff-conformance pass (H1–H12; H13: PRL-14 and PRL-15 created in Ariadne and mapped); HOOK-manifest-conformance pass (product band issued, execution band untouched); two tickets created, design captured to both ticket folders, ticket rows written | n/a |

## Readiness log

Written by `ROLE-product-readiness-reviewer` only. One row per review round,
appended — a prior row is never edited, withdrawn, or overwritten.

| Date | Round | Verdict | Conditions | Reviewer | Story-set digest | Findings | Finding ids |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-08 | 1 (cycle 1) | READY | none | ROLE-product-readiness-reviewer (claude, claude-sonnet-5-5) | (REQ-0005, 3, 2026-11-08; REQ-0006, 3, 2026-11-08); INIT-0003 revision 4 — matches the validator report and the files on disk | 0 (0 blocking). R13–R18 pass. R13: criteria carry observable triggers and baselines (chat's rendering today, the text box today, stated limits, 1440 light composition with worst-case data). R14: each story has one outcome and a boundary list; the shared editor, vendor file and surfaces are one outcome the requester ordered (settings, then chat bar). R15: DES-0003's two frames (read as PNGs) agree with Behavior 1–9 of REQ-0005 and 1–9 of REQ-0006 (closed marks hidden, edited line shows marks, fence strips, no toggle, Expand editor kept, placeholder, chips, no language header). R16: nothing shown in a frame lacks a story line. R17: defaults, limits, trimming, Enter during composition, drafts, drop, copy and cut with no selection, link schemes and Windows and Linux modifier are all ruled in PD-0013 or the stories. R18: an agent holding INIT-0003 can plan; PRL-6 is a stated precondition. R8 contradiction clause: none. PD-0013 item 11 (Enter during an open composition sends nothing) sits against PD-0011 item 6's "Enter exactly as today" but serves its "never interrupts accent or IME typing"; recorded openly as a PM ruling with its consequence, so not a contradiction. Amendment to constraint #2 is PD-0011's own. R9 verdict-correctness clause: PD-0012 cites `feasible-with-constraints`; coherence is `coherent` at terminal round 2 against revision 3 of both stories, every blocking finding `fixed`. B10: not applicable (DES-0003 is not `kind: code`). | none |

## Readiness findings

Written by `ROLE-product-readiness-reviewer` only.

| Finding | Criterion | Artifact | What is wrong | Route phase | Route role |
| --- | --- | --- | --- | --- | --- |
| none | — | — | Round 1 raised no finding. | — | — |

## Handoff packet

Assembled at ENGINEERING_READY on 2026-11-08 against readiness cycle 1 round 1
`READY` (story set REQ-0005@3 and REQ-0006@3, `updated` 2026-11-08; INIT-0003@4).
Drafted inline by the PM (size rule §9d.2).

- **Outcome:** the user sees Markdown formatted in place while writing it,
  everywhere they write it, and the saved or sent text is exactly what was typed.
  O1: in the Room Brief's Goal and Rules, in agent instructions (Room settings
  and Create room) and in the New Room and Clone dialogs. O2: in the chat bar,
  with the `@` picker, slash commands, Enter and Shift+Enter, drafts, paste,
  attachments, undo and redo working as they do today
  ([initiative](../initiative.md) `## Outcome`).
- **Stories, in suggested sequence:** REQ-0005 (`depends_on: none`; builds the
  shared editor and the one vendor file; Room settings, New Room, Clone,
  agent instructions), then REQ-0006 (`depends_on: [REQ-0005]`; the chat bar,
  reusing the shared editor). Precondition outside the set: PRL-6 merged and
  green on `main` (PD-0011 item 10); its merge `f7b6fd5` is already in `main`'s
  history, and engineering confirms it is green before starting.
- **Design references and export paths:** `DES-0003` (two static reference
  frames, PD-0012 item 4) →
  `initiatives/INIT-0003-live-markdown-editor/design/heroes/markdown-editor-settings.dc.html`,
  `markdown-editor-settings.png` (Room settings: Brief with Goal unfocused and
  Rules focused; Agents with the live instructions editor — REQ-0005),
  `markdown-editor-chat-bar.dc.html`, `markdown-editor-chat-bar.png` (the chat
  bar with a multi-line message, chips and the empty placeholder — REQ-0006),
  notes in `approach.md` (its two observations on existing light-theme styles
  are not work). Where a frame and a story differ, the story wins.
- **Decisions in force:** PD-0011 (the requester's decisions: build it, one
  shared editor, order, CodeMirror 6 and the one vendor file, the done check,
  PRL-6 first), PD-0012 (option A with its binding constraints and the design
  depth), PD-0013 (fifteen behaviour rulings), PD-0004 item 3 (display matrix 1440
  light), PD-0006 item 2 (limits); [constraints](../../../project/constraints.md)
  revision 2 (#2 amended for the one vendor file).
- **Binding technical constraints** ([technical/assessment.md](../technical/assessment.md),
  round 1, carried by PD-0012 item 3; each story lists the ones that apply):
  - C-01 — the server's fixed list of client files gains the one vendor file; no request, response or stored data changes.
  - C-02 — runs under the current page security policy unchanged.
  - C-03 — one prebuilt classic script, loaded before the code that uses it, no network at run time, no build step to run the app.
  - C-04 — every package at an exact version at least 20 days old; no requester exception needed.
  - C-05 — the license text of every package, each pinned version and the one regenerating command.
  - C-06 — nothing that inserts text: no list continuation, auto-indent, bracket or quote closing, smart typography or trimming.
  - C-07 — parsing narrowed to what `renderMD` formats.
  - C-08 — no hidden range over a line holding the cursor or an open composition.
  - C-09 — the component answers what today's code asks of a text box.
  - C-10 — the chat bar's key and paste handlers run before the editor's own.
  - C-11 — the old editor is released and a new one started at each re-render site.
  - C-12 — length limits; C-13 — code writes not undoable into replaced content; C-14 — Copy and Cut with nothing selected do nothing.
  - C-15 and C-16 — accessible name, Tab and Escape, and every textarea CSS rule apply.
  - C-17 — test lines that read the old fields are updated (REQ-0005: 17 lines in 4 files; REQ-0006: 18 lines in 8 files plus the smoke stub); no new suite.
  - C-18 — verification on an isolated port with a copied room store, never 4142 or 4141.
  - C-19 — links open only on Cmd+click (Ctrl+click elsewhere), `http` and `https`, new tab, no opener, no referrer.
  - C-20 — no new runtime network request and no new stored data.
  - C-21 — a file dropped on the editor inserts nothing (coherence round 1; in both stories).
  - R-01 — CodeMirror 6 behaviours are documented, not run: if one a story requires does not work, stop and report; never substitute another editor (PD-0011 item 5).
- **Explicitly out of scope:** a toolbar, a preview toggle or a separate preview;
  formatting of tables and raw HTML; single-line fields and the 200-character
  Decision fields; any change to a request, response, stored data or check of the
  backend, the tokens sent, "What agents see" or the character counts, and any
  rewriting of saved Markdown; TipTap or another rich-text editor and a
  hand-built `contenteditable`; a design canvas or multi-page design track; new
  unit or smoke suites; rebuilding or quitting Workbench
  ([initiative](../initiative.md) `## Scope`, "Out of scope").
- **Open questions (non-blocking):** none.
- **Verification (requester's):** one focused browser check on an isolated port
  with a copy of the room store, covering the chat bar and Goal (each Markdown
  element renders live, the saved or sent text matches what was typed, undo and
  paste work; Enter, Shift+Enter and an `@` mention work) and that settings text
  is unchanged after closing and reopening; no new unit or smoke suites
  (PD-0011 item 8). REQ-0005's check settles the library risk before REQ-0006
  starts.
- **Delivery manifest:** `initiatives/INIT-0003-live-markdown-editor/delivery/manifest.md`.
- **Tickets:** PRL-14 (REQ-0005) then PRL-15 (REQ-0006, blocked by PRL-14), Ariadne project PRL, initiative INIT-0003; mapping in `delivery/tickets.md`. PRL-6 stays an external precondition stated in both tickets, not a blocker edge.

## Handoff log

| Date | Receiving role | Packet digest | Note |
| --- | --- | --- | --- |
| 2026-11-08 | ROLE-orchestrator | REQ-0005@3@2026-11-08; REQ-0006@3@2026-11-08; INIT-0003@4 | Packet and `delivery/manifest.md` (product band) issued against `READY@2026-11-08`. Tickets created: PRL-14 (REQ-0005) and PRL-15 (REQ-0006, blocked by PRL-14) (2 created, 0 updated; initiative INIT-0003 created in Ariadne with the key INIT-0003 and set on both; identifier lint 0 matches on both titles and bodies; criteria 18/18 and 16/16 one for one, checked by script against the stories and against the tracker text; six `##` sections only). Translations (X14): no criterion carried an identifier, so none was stripped; load-bearing references: REQ-0006's "REQ-0005 Behavior 1–8 and 10" → the shared-editor rules inlined in full in PRL-15 and the first ticket named by its key; every "PD-" and constraints citation in the Behavior items, constraints and Notes deleted as attribution. Scope inlines each story's Behavior in full; Success metric carries the outcome element and the requester's done-means; Dependencies carry the binding constraints C-01..C-21 and PRL-6 as an external precondition. DES-0003's five files copied byte-for-byte (compared) to `PRL-14` and `PRL-15` under `~/Factory/Artifacts/projects/PRL/tickets/<ticket_code>/design/capture/`, each with `design/design.md`. Initiative `tickets` filled (a lifecycle field, no revision bump, digest unchanged) |

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
- 2026-11-08 — Dispatch log. DECOMPOSITION | ROLE-planner (technical architect, coherence full pass, round 1) | claude | opus | M | ledger run `a4ac516d0b1a9d676` | `technical/coherence.md`.
- 2026-11-08 — Dispatch log. DECOMPOSITION | ROLE-planner (technical architect, coherence delta re-check, round 2, terminal) | claude | sonnet | S | ledger run `acfc4a8e4c8c7c097` | `technical/coherence.md` (updated).
- 2026-11-08 — DECOMPOSITION: coherence round 1 found one blocking defect (a file dropped on the editor would be written into the text by the library default, and none of the stories or the assessment said so). The PM repaired it inline within §4.1 (conformance to REQ-0005 Behavior 6 and PD-0011 item 6, "the saved text is exactly what was typed"; no outcome, user or measure changes): each story gained the behaviour sentence, an acceptance criterion and constraint C-21 (not in PD-0012's C-01..C-20 list, which stays as accepted; the stories and the coherence file carry it). The six non-blocking defects were fixed in the same pass. Round 2 (terminal, §9d.3) returned `coherent`. REQ-0005 and REQ-0006 accepted at revision 3; INIT-0003 revision 4; `converged: true`.
- 2026-11-08 — Coverage, full mode (PM, inline, as INIT-0002): R1–R12 all pass, 0 defects. Map: O1 → REQ-0005 (accepted, rev 3) → CAP-0001, CAP-0002, DES-0003 (five exports on disk), PD-0011/0012/0013 (accepted); O2 → REQ-0006 (accepted, rev 3) → CAP-0003, DES-0003, PD-0011/0012/0013; DES-0003 names both REQ-; depends_on: REQ-0005 none, REQ-0006 [REQ-0005] (accepted, acyclic, sequencing notes in `Stories`); no `Q-` raised (Q-0001 belongs to INIT-0002, `important`); out-of-scope section non-empty and no REQ- names excluded behaviour; every escalation-class Ambiguity log row: none (all `pm-resolvable` or the requester's own decision); R9: PD-0012 cites feasible-with-constraints, coherence verdict `coherent` recorded in the Consultation log, terminal round 2, every blocking finding `fixed`; counters capability 3, decision 13, initiative 3, requirement 6, design 3, question 1 equal the highest files; 115 links in the changed records resolve (script, two literal-text false positives checked by hand). Story-set digest of this report: `(REQ-0005, 3; REQ-0006, 3, 2026-11-08)`; INIT-0003 revision 4.
- 2026-11-08 — Dispatch log. READINESS | ROLE-product-readiness-reviewer (cycle 1, round 1) | claude | sonnet | M | ledger run `aca49b1c139fbf737` | `## Readiness log` row and `## Readiness findings` (none) in this file.
- 2026-11-08 — READINESS: verdict `READY`, no conditions, no finding. Round 2 not run (no blocking finding, §9d.4). H1–H6 re-checked at ENGINEERING_READY: verdict recorded and not void; digest `(REQ-0005, 3, 2026-11-08; REQ-0006, 3, 2026-11-08); INIT-0003 revision 4` equals the files on disk; both stories `accepted`; no `blocker` `Q-`; every identifier resolves; the five DES-0003 exports exist. Coverage full mode re-run by script: 0 defects.
- 2026-11-08 — Dispatch log. HANDOFF | ticket-transcriber (create-tickets-from-stories, one dispatch) | claude | sonnet | M | ledger run `aab19481ffbe1e9b2` | scratch ticket bodies, consumed and not committed.
- 2026-11-08 — HANDOFF: Ariadne project PRL confirmed (`get_project`); initiative INIT-0003 was not in Ariadne, so it was created with key INIT-0003, the title and the Outcome section. PRL-14 (REQ-0005) created first, then PRL-15 (REQ-0006) with blockedBy PRL-14, as INIT-0001 did for its chain. Checked against the tracker: both titles equal the story titles, both bodies equal the transcribed text (script), lint 0 matches, project PRL, initiative INIT-0003, status Backlog. PRL-6 was `Done` in the tracker at this time; it stays an external precondition in the text of both tickets. No `Q-` raised at any phase. The engineering orchestrator was not dispatched.

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
