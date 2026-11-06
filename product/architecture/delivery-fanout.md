---
id: ARCH-delivery-fanout
type: architecture
title: Delivery manifest and batch fanout integration contract
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Delivery manifest and batch fanout integration contract

## 1. What this document is

[`engineering-handoff.md`](engineering-handoff.md) specifies the seam between one
product initiative and *one* engineering-ready story at a time. This document
specifies what happens when an initiative's whole approved story set is put into
execution **at once**: how the approved set becomes a schedulable graph, which
parts of it may launch, and what the mechanism that launches them is forbidden to
decide.

It specifies four things and nothing else:

1. the **pipeline boundary** — Product Readiness → Delivery Manifest → Batch
   Fanout → individual Engineering Orchestrators — and what each stage owns;
2. the **consumption contract**: exactly which manifest fields a fanout
   mechanism reads and which it writes;
3. the **dispatch rules** — eligibility, parallelism, blocking, release,
   failure, regression, completion;
4. the **scope split inside `ROLE-orchestrator`** between initiative scope and
   ticket scope.

The manifest's own shape is
[`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md), which this
document references and never restates. The mechanism's procedure is
`SKILL-batch-fanout` ([`skill-library.md`](skill-library.md) §3.28), declared at
`~/.claude/skills/batch-fanout/SKILL.md`.

## 2. The pipeline

```
  ROLE-product-readiness-reviewer
        │  verdict: READY  (binary; conditions carried separately)
        ▼
  ROLE-product-manager · phase ENGINEERING_READY → HANDOFF
        │  SKILL-prepare-engineering-handoff    → ## Handoff packet
        │  SKILL-compile-delivery-manifest      → delivery/manifest.md, band_owner: product
        │  SKILL-create-tickets-from-stories    → real Ariadne tickets + delivery/tickets.md
        ▼
  fan-out session · initiative scope
        │  SKILL-resume-initiative  → delivery/state.md, band_owner: delivery
        │  SKILL-sync-tickets       → refresh tickets.md → §5.5 projection
        ▼
  SKILL-batch-fanout                (execution mechanism — no product judgement)
        │  one dispatch per eligible dispatch unit, ≤ max_parallelism
        ▼
  orchestrator agent · ticket scope  × N, independent, concurrent
        │  each drives one ticket DEFINE → … → SHIP and returns one terminal line
        ▼
  ledger row → frontier recompute → next dispatches → completion
```

Each arrow is one-directional. The only path backwards is
[`engineering-handoff.md`](engineering-handoff.md) §4.2 — a `Q-` to the product
manager — and it never runs as an edit to a story or to the manifest's product
band.

### 2.1 What each stage owns

| Stage | Owns | Must not |
| --- | --- | --- |
| Product Readiness | The binary verdict and its conditions | Schedule anything |
| Ticket creation (HANDOFF, `ROLE-product-manager`) | The `REQ- → ticket` mapping and the tracker keys, obtained from Ariadne | Invent a key; write a branch, a PR, a status, a plan, or any downstream exemption |
| Delivery Manifest (product band) | Story set, readiness, story DAG, blocking, ordering constraints, shared references | Name a branch, a task, or an estimate |
| Delivery Manifest (execution band) | Dispatch units, waves, state, attempts, dispatch refs, completion | Restate or contradict a product-band fact |
| Batch Fanout | Which eligible units are in flight, and the ledger rows recording it | Read a story, judge readiness, re-order the graph, retry a failure |
| Engineering Orchestrator (ticket scope) | One ticket's full lifecycle | Know or care that it is part of a batch |

## 3. The readiness boundary — the rule that makes this safe

**Batch fanout must assume that any story marked `ENGINEERING_READY` has already
passed product readiness.** It re-runs no discovery, re-reads no requirement
body, and forms no opinion about whether a story is well-defined.

Concretely, a fanout mechanism:

| May read | May never read or do |
| --- | --- |
| The manifest's frontmatter, §5.5 dispatch units, §5.6 waves, §5.7 ledger | A `REQ-` body, an initiative, a `DES-`, a `PD-`, a discovery section |
| The `readiness` value in §5.3, as a **flag** (`E1`) | Any judgement about whether that value is correct |
| §5.4 ordering constraints, as **mutual-exclusion groups of units** only (`E7`) | The rationale prose behind a constraint, or any file it cites |
| `blocker` `Q-` ids named in §5.3 / §5.5, as a **flag** (`E4`) | The `Q-` body, or a decision about its severity |
| `delivery/tickets.md`, for the §6.2 projection | An execution plan, a review, a diff |

This is the same restraint the fanout mechanism already applies to lifecycle
routing — it dispatches an orchestrator rather than deciding what a ticket needs
— extended to product judgement. The reasons are the same two:

1. **Authority.** Readiness is a two-key gate held by
   `ROLE-product-readiness-reviewer`. A dispatcher that formed its
   own readiness opinion would be a third key nobody granted, and one with no
   access to the discovery evidence the criteria were judged against.
2. **Context.** The fanout coordinator's context is deliberately bounded to
   "which units are in flight". Reading story bodies for a whole initiative is
   precisely the context blow-up that motivated separating dispatch from
   orchestration in the first place.

The assumption register `A1`–`A9` and its complement `N1`–`N8`
([`engineering-handoff.md`](engineering-handoff.md) §4, §4.1) apply unchanged to
every dispatched orchestrator. Fanout adds no assumption and removes none.

## 4. Two scopes, and only one of them is the orchestrator agent

Initiative scope and ticket scope are different jobs. **The `orchestrator` agent
plays ticket scope only** — it accepts a `ticket_code` or a raw engineering ask,
refuses an `INIT-` identifier, accepts no handoff, and never runs fan-out.
Initiative scope is played by the **fan-out session**: a plain Claude Code
session running `SKILL-resume-initiative` and `SKILL-batch-fanout`, which is the
"not the orchestrator agent itself" rule those skills already state. An
initiative whose tickets a human dispatches one at a time has no initiative-scope
actor at all, and needs none.

| | Initiative scope (fan-out session) | Ticket scope (`orchestrator` agent) |
| --- | --- | --- |
| Count | Exactly one per initiative, at a time | One per dispatched unit |
| Reads | Manifest, `delivery/state.md`, `tickets.md` | Its own ticket's disk state |
| Writes | `delivery/state.md`, `tickets.md`, manifest execution band | Its ticket's session workspace; story lifecycle fields |
| Runs | `SKILL-resume-initiative`, `SKILL-sync-tickets`, `SKILL-batch-fanout` | `SKILL-lifecycle-orchestration` and the stage skills |
| Knows about the batch | Yes — it is the batch | **No.** A dispatch carries a ticket_code and nothing else |

The `orchestrator` agent never runs `SKILL-batch-fanout` and never reads a
manifest. Nesting fanout inside a dispatched orchestrator would put two writers
on the same manifest; letting the orchestrator accept an initiative would make
every engineering run start with a conversion step before any work began.

`§5.5 Dispatch ref` is the durable link between the two scopes — the parent
initiative's record of which child orchestrator was given which unit, and where
its work went.

## 5. Consumption contract

`SKILL-batch-fanout` in **manifest mode** reads and writes exactly this:

| Access | Fields |
| --- | --- |
| **Reads** | `initiative`, `band_owner`, `accepted_on`, `max_parallelism`, `completion`; §5.5 (`Unit`, `Stories`, `Depends on`, `State`, `Attempts`, `Wave`); §5.6; §5.3 `Readiness` and `Blocked by` as flags only; §5.4 as mutual-exclusion groups only (`E7`) |
| **Writes** | §5.5 `State`, `Attempts`, `Last outcome`, `Dispatch ref`, `Updated`; §5.7 ledger rows; frontmatter `completion` and `updated_by_role` |
| **Never writes** | Every product-band section; `story_set_digest`; `issued_from_verdict`; `revision`; `delivery/tickets.md` |

Preconditions, checked before any dispatch:

| # | Precondition | On failure |
| --- | --- | --- |
| `P1` | The manifest exists and `band_owner: delivery` | Not accepted yet — run `SKILL-resume-initiative` first. Do not dispatch. |
| `P2` | `product/state.md` is at `phase: HANDOFF` | Stop. Delivery has not been authorised. |
| `P3` | §5.5 is non-empty and its projection agrees with `tickets.md` (`M6`) | Run `SKILL-sync-tickets`, repair the projection from `tickets.md`, then re-check. The tickets themselves already exist — they were created at HANDOFF (`engineering-handoff.md` §2.3) — so this is always a projection repair, never a creation. |
| `P4` | `M5` holds — the digest still matches | The manifest is void. Re-issue per schema §8; dispatch nothing new. |
| `P5` | `M1` holds — the unit graph is acyclic | `Q-`, severity `blocker`. Never guess an order to break a deadlock. |

The mechanism keeps its existing **list mode** for an ad-hoc set of unrelated
ticket_codes with no initiative behind them. List mode has no manifest, writes
only its session-local batch file, and is unchanged by this contract. Manifest
mode is the mode that has an authoritative home in the repository, and it is the
mode any initiative-derived batch uses — a session-local batch file is never the
authority for an initiative's dispatch state
([`repository-layout.md`](repository-layout.md) §4).

## 6. Dispatch rules

### 6.1 Which stories are eligible for immediate fanout

The units satisfying all seven conditions of
[`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) §6.3
(`E1`–`E7`). At the moment of acceptance that is the **wave-0 frontier** capped
by `max_parallelism`, thinned by `E7` where wave-0 units share a §5.4
mutual-exclusion group.

### 6.2 How dependency-free work is identified

By the graph, never by reading stories. A unit is dependency-free when its §6.2
`Depends on` cell is empty — which happens when `tickets.md` names no blocker for
it **and** no story it carries depends on a story on another unit. Two sources,
one deterministic union; a dispatcher that inspected story text to guess
independence would be re-deriving something already computed.

### 6.3 How maximum parallelism is applied

`max_parallelism` is a ceiling on units in state `dispatched`, evaluated at each
frontier recompute. It bounds three real constraints: downstream API rate limits,
filesystem contention between concurrent checkouts, and a human's capacity to
review that many results landing at once. It is **not** a wave barrier — see the
schema's §5.6. Where the manifest says `default`, the mechanism's own default
applies; a value in the manifest always wins over the mechanism's default, and a
value the human gives for one run wins over both and is recorded in the ledger.

### 6.4 What prevents a blocked story from launching

Four independent gates, each a comparison and none a judgement:

| Gate | Blocks when |
| --- | --- |
| `E3` | A dependency unit is not `complete`. |
| `E4` | A `blocker` `Q-` names the unit or a story it carries. |
| `E1` | A story's `readiness` is `blocked` or `void` rather than `engineering-ready`. |
| `E5` | The unit is already `dispatched`, `complete`, or `void`. |

A unit failing any gate is never dispatched "to see what happens", and its state
is written down — `not-eligible`, `blocked`, `void`, or `unreachable` — so the
next stateless session reaches the same conclusion without re-deriving it.

### 6.5 What allows a dependent story to launch

Exactly one event: its last outstanding dependency reaching `complete`, which per
schema §6.5 requires both the unit's own engineering orchestrator returning a
terminal success line **and** the unit's PR(s) merged to the default branch —
merged at SHIP by `release-coordinator` on green checks (the local
`delivery_reviewer` verdict is the only review gate; no GitHub reviewers, no
human merge step), verified by the fan-out session with a GitHub read, and
merged by the fan-out session as a backstop when a green PR was left open. On
recording it, the mechanism appends a `completed` ledger row, recomputes the
frontier, and backfills the freed concurrency slot.

No other signal releases a dependent — not a PR merely opening, not a review
verdict, not a tracker status flip. A terminal line whose PR is unmerged
releases nothing: dependents branch from the default branch, so an unmerged
"complete" would launch dependent work on top of code that isn't there.

### 6.6 When one engineering orchestration fails

1. The unit goes to `failed` (a blocker it reported) or `blocked` (a `blocker`
   `Q-` exists against it), with the terminal line copied verbatim into `Last
   outcome` and a ledger row appended.
2. **Its siblings continue.** One failure never stalls, rolls back, or cancels
   independent units — the frontier is recomputed immediately and the freed slot
   is backfilled.
3. Units transitively depending on it become `unreachable`. They are not failures
   and are not retried; they become eligible again if and when the dependency
   resolves.
4. **No automatic retry, ever.** A failure is a human decision
   (schema §6.6). Blind re-dispatch is how a stuck unit becomes a silently
   repeated one, and how a `requirements`-category gap gets buried instead of
   surfaced.
5. The failure is surfaced in the run's status report and left in the manifest;
   the batch continues until nothing is `eligible` or `dispatched`.

A failure whose category is `requirements` is not retried and not re-dispatched
into DEFINE. It is §6.7.

### 6.7 When a dependency is rejected or sent back for product clarification

This is the reverse path of [`engineering-handoff.md`](engineering-handoff.md)
§4.2, seen from a batch:

1. The ticket-scope orchestrator raises a `Q-` naming `ROLE-product-manager`,
   `blocker` severity if it blocks the ticket, and reports `BLOCKED`.
2. The initiative-scope orchestrator records the `Q-` in `delivery/state.md`
   `blocked_by`, sets the unit `blocked`, and marks its dependents
   `unreachable`. Independent units keep running — the batch is not halted by a
   product question about one story.
3. `ROLE-product-manager` regresses, supersedes the story, and the successor
   re-enters READINESS. The superseded story's `readiness` becomes `void`, which
   trips `M5` and voids the manifest.
4. The manifest is re-issued per schema §8: product band replaced at
   `revision + 1`, execution band preserved, completed units still `complete`.
   Units carrying only unaffected stories are unaffected in flight.
5. Fanout resumes from the re-issued manifest. It never dispatches against a void
   manifest, and it never swaps a superseded story under a unit already running.

The mechanism performs none of steps 3 and 4 itself. Its whole responsibility
here is to stop dispatching the affected units, keep the rest moving, and record
what happened.

### 6.8 When all stories complete

1. Every unit reaches `complete` ⇒ `completion: complete` (schema §5.8).
2. The mechanism appends a final ledger row, reports a compact summary — what
   shipped with its pointers, what is blocked with its one-line reason — and
   stops. It points at the manifest rather than restating it.
3. The initiative-scope orchestrator sets `delivery/state.md` `stage: done`,
   refreshes the board row, and advances each story's `status` on the surface it
   is permitted (`frontmatter.md` §"The immutability surface").
4. `ROLE-product-manager` runs `SKILL-close-initiative`, updating the capability
   records to describe the product as it now is, and the initiative becomes
   `status: shipped`.

`completion: complete` is the authorisation for step 3 and no more. The fanout
mechanism never closes an initiative, never updates capabilities, and never
declares the outcome achieved — only that every unit it dispatched came back.

## 7. Resumption

A batch survives its driving session because the manifest, not the session, is
the state. A fresh initiative-scope session reads the manifest and reaches the
same next action:

| State on disk | Action |
| --- | --- |
| `complete`, `failed`, `blocked`, `void` | Trusted as-is. Never re-dispatched. `failed`/`blocked` still mean "needs a human". |
| `dispatched` with no terminal ledger row | Ambiguous — the session may have died before the report arrived, or the child may still be running. Re-dispatch is safe: a ticket-scope orchestrator does state detection from disk before touching anything, so a duplicate either finds nothing to do or closes the same gap. Append a `re-dispatched (human-authorised)` row only when a human authorised it; otherwise the row reads `dispatched`. |
| `eligible` / `not-eligible` | Recompute §6.3 and dispatch normally. |

The session-local batch file, where one exists, is a convenience mirror. Where it
disagrees with the manifest, the manifest wins and the mirror is rewritten.

## 8. Conformance

| # | Check | Enforced by |
| --- | --- | --- |
| `F0` | Every accepted story at `phase: HANDOFF` already resolves to a real tracker key in `tickets.md`. | `SKILL-create-tickets-from-stories`; `C12` in `engineering-handoff.md` §7 |
| `F1` | A manifest exists for every initiative at `phase: HANDOFF`, issued against the same verdict as its packet. | `SKILL-compile-delivery-manifest`; `C11` in `engineering-handoff.md` §7 |
| `F2` | `band_owner` transferred exactly once, in the same write that created `delivery/state.md`. | `SKILL-resume-initiative` |
| `F3` | No dispatch occurred while `P1`–`P5` failed. | `SKILL-batch-fanout` |
| `F4` | Every `dispatched` unit has a ledger row, and every ledger row names a unit in §5.5. | `SKILL-batch-fanout` |
| `F5` | No unit's `Attempts` exceeds its ledger's dispatch rows, and no increment lacks a human authorisation after a failure. | schema §6.6 |
| `F6` | The product band is byte-identical to its issued form while `band_owner: delivery` (`M8`). | schema §2 |
| `F7` | The §5.5 projection agrees with `delivery/tickets.md` as of the last sync (`M6`). | `SKILL-sync-tickets` |
| `F8` | No fanout-written section contains product judgement — no readiness opinion, no re-ordering not derivable from §6.2, no story content. | §3 |

A non-conforming batch is stopped, not degraded. The manifest records why.

## 9. Related specifications

- [`lifecycle-hooks.md`](lifecycle-hooks.md) §3.15 — `HOOK-fanout-eligibility`:
  advisory to the lifecycle, hard for the dispatch of an ineligible unit.

- [`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) — the
  canonical manifest schema.
- [`engineering-handoff.md`](engineering-handoff.md) — the one-story seam this
  document scales, the assumption register, and the reverse path.
- [`skill-library.md`](skill-library.md) §3.10, §3.27, §3.28 — the three skill
  contracts on this path.
- [`repository-layout.md`](repository-layout.md) §3 — one writer per initiative
  subdirectory, and the named exception this contract relies on.
