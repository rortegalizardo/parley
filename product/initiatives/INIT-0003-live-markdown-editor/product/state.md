---
id: PSTATE-INIT-0003
type: product-state
title: Product definition state for INIT-0003
status: authoritative
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
updated_by_role: ROLE-product-manager
initiative: INIT-0003
phase: INTAKE
phase_entered: 2026-11-08
requester: Ricardo (decided in the room "Parlay Product Evolution"; relayed by his side session)
next_action: "ROLE-product-manager: exit INTAKE, enter DISCOVERY"
blocked_by: []
converged: false
readiness_verdict: none
stories: []
design_refs: []
decisions: []
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

## Phase log

| Date | From | To | Role | Trigger | Outcome | `context_digest` |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-08 | BOOTSTRAP | INTAKE | ROLE-product-manager | Raw request; Product Memory present, packet `ready` | Entered. Hooks: HOOK-canonical-root pass (one root, `/Users/ortega/Desktop/Projects/parley/product`), HOOK-hydrate pass | n/a |

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

> Every product-side session updates this file before ending — **including
> sessions that failed**, which record the failure in `next_action` and do not
> advance `phase`.
