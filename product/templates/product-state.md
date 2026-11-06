---
id: PSTATE-INIT-nnnn
type: product-state
title: Product definition state for INIT-nnnn
status: authoritative
revision: 2
owner_role: ROLE-product-manager
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
updated_by_role: <ROLE-…>
initiative: INIT-nnnn
phase: INTAKE
phase_entered: <YYYY-MM-DD>
requester: <who asked for this, by name or role>
next_action: <the single next thing to do, and by which role>
blocked_by: []
converged: false
readiness_verdict: none   # none | READY | READY-with-known-issues | NOT READY | void
stories: []
design_refs: []
decisions: []
---

# Product definition state — INIT-nnnn

`phase` above is the authority for where this work stands on the product side.
Delivery stage lives in `delivery/state.md` and is owned by `ROLE-orchestrator`;
these two files never describe the same thing and never share a writer.

_This file is the head, read at every hydrate. When it passes 300 lines,
move history — `### Superseded —` snapshots, closed log rows, readiness-round
narratives, non-template sections — verbatim to `state-history.md` beside it
and leave this pointer line (`architecture/product-memory.md` §4.15 item 11):_

> History is in [`state-history.md`](state-history.md); read it only when a question requires it.

## Where this stands

_Two or three sentences. Assume the reader has no memory of this work._

## Problem statement

_The request as understood, in product terms. Written at INTAKE, superseded by
the initiative's outcome statement once PRODUCT_DEFINITION populates it._

## Next action

_One action, one role._

## Blocked by

_`Q-` identifiers, or "nothing"._

## Ambiguity log

Every ambiguity encountered, classified. Escalation-class entries **must** carry
a `Q-` identifier — that requirement is what stops a material product question
from being answered quietly.

| Date | Ambiguity | Class (`pm-resolvable` / `escalation`) | Resolution or `Q-` |
| --- | --- | --- | --- |

## Discovery

_Target users, jobs and problems with their evidence, current-state `CAP-`
mapping (or an explicit "none"), success signals, known non-goals._

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
appended — a prior row is never edited, withdrawn, or overwritten. `Verdict` is
one of `READY`, `READY-with-known-issues`, or `NOT READY`; the first two open
the handoff gate, the third shuts it. Conditions and known issues live in their
own column and never in the verdict. `Story-set digest` is the ordered list of
`(REQ- id, revision, updated)` triples plus the initiative `revision`, and is
what makes the verdict void when the set moves.

| Date | Round | Verdict | Conditions | Reviewer | Story-set digest | Findings | Finding ids |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Readiness findings

Written by `ROLE-product-readiness-reviewer` only, one block per round producing
at least one finding. Finding ids are `RF-<INIT-nnnn>-<round>-<n>`, scoped to
this file: they bump no counter and appear in no index. A `NOT READY` verdict
with no findings rows is invalid output.

`Criterion` is one of `R1`–`R18` (`../architecture/skill-library.md` §3.9.2).
`Route phase` and `Route role` come from the routing table in
`architecture/skill-library.md` §3.9.1 and are not chosen per finding.

| Finding | Criterion | Artifact | What is wrong | Route phase | Route role |
| --- | --- | --- | --- | --- | --- |

## Handoff packet

_Written at ENGINEERING_READY. This section plus the accepted `REQ-` records it
names **is** the handoff object — there is no separate handoff file
(`architecture/engineering-handoff.md` §2.1). Must be self-contained: an agent
holding only `INIT-nnnn` and this repository can begin planning from it without
asking a question, including one it would answer for itself._

_Every bullet is populated. An element with nothing to say carries the explicit
empty form in the right-hand column below, never a blank (`H7`)._

- **Outcome:** _one sentence — never empty_
- **Stories, in suggested sequence:** _ordered `REQ-` ids; the order is a
  suggestion derived from `depends_on`, not an instruction — never empty_
- **Design references and export paths:** _`DES-` → repo-relative
  `local_export`, each existing on disk — or `none — no user-facing surface`_
- **Decisions in force:** _`PD-` ids, including the chosen-option decision — or
  `none`_
- **Binding technical constraints:** _one line each, citing the `technical/`
  file and round — or `none`_
- **Explicitly out of scope:** _copied from the initiative — never empty_
- **Open questions (non-blocking):** _`Q-` ids below `blocker` severity,
  including every condition carried on the `READY` verdict — or `none`_

## Handoff log

Written at HANDOFF. One row; a second row means a re-handoff after a regression.

| Date | Receiving role | Packet digest | Note |
| --- | --- | --- | --- |

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
