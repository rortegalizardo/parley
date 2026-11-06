---
id: SCHEMA-delivery-manifest
type: schema
title: Delivery manifest schema
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Delivery manifest schema

**This document is the canonical Delivery Manifest schema.** There is no second
manifest format, no export, and no per-batch variant. The integration that
consumes it is
[`../architecture/delivery-fanout.md`](../architecture/delivery-fanout.md).

## 1. What a delivery manifest is

One file per initiative, at

```
product/initiatives/INIT-nnnn-<slug>/delivery/manifest.md
```

It is the machine-readable form of a handoff that has already passed the
readiness gate: which stories were approved, what depends on what, what may run
at the same time, and — after acceptance — what has actually been dispatched,
what came back, and what is left.

It is **not** a ticket manifest. `delivery/tickets.md` remains the only
authoritative mirror of tracker keys, ticket↔story mapping, branches, PRs, and
tracker status (`index-formats.md` §"Ticket manifest",
`product-memory.md` §4.9). Everything this file says about tickets is a
**projection** of that file, repaired from it and never the reverse (§7). The
tickets exist before this file is ever accepted: they are created at HANDOFF by
`SKILL-create-tickets-from-stories` (`../architecture/engineering-handoff.md`
§2.3), which writes `tickets.md` and nothing here.

It is also **not** a readiness judgement. A manifest exists only because a
`READY` verdict already exists; nothing that reads it may re-open that question
(`delivery-fanout.md` §3).

## 2. Two bands, one writer at a time

The manifest has the same shape as the story artifact it carries: content frozen
at issue, lifecycle advanced afterwards (`frontmatter.md` §"The immutability
surface"). It is one file with **two disjoint bands and never two concurrent
writers**.

| Band | Sections | Written by | When |
| --- | --- | --- | --- |
| **Product band** | §5.1 Identity, §5.2 Shared references, §5.3 Stories, §5.4 Ordering constraints | `ROLE-product-manager`, via `SKILL-compile-delivery-manifest` | Once, at phase ENGINEERING_READY. Frozen at acceptance. |
| **Execution band** | §5.5 Dispatch units, §5.6 Waves, §5.7 Dispatch ledger, §5.8 Completion | `ROLE-orchestrator` at initiative scope — played by the fan-out session, never by the `orchestrator` agent driving a ticket (`../architecture/delivery-fanout.md` §4) | From acceptance onward |

`band_owner` in frontmatter names who may write **now**. Transfer is one-way and
recorded: `ROLE-orchestrator` sets `band_owner: delivery` and `accepted_on` in
the same write that creates `delivery/state.md`, and from that moment the product
band is immutable. The only way back is a re-issue (§8).

A product-band edit by a delivery role is the same class of defect as editing an
accepted story's acceptance criteria: the route is a `Q-` under
[`../architecture/engineering-handoff.md`](../architecture/engineering-handoff.md)
§4.2, never an edit.

## 3. Frontmatter

Common fields per [`frontmatter.md`](frontmatter.md) apply. `id` is
`DM-INIT-nnnn` — derived from the initiative, allocating no counter and reusing
no identifier space (`../architecture/identifiers.md` §3).

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `initiative` | yes | `INIT-nnnn` | The parent initiative. Exactly one. |
| `manifest_version` | yes | integer | Version of *this schema*. `1` today. |
| `band_owner` | yes | `product \| delivery` | Who may write now (§2). |
| `issued_on` | yes | date | When the product band was written. |
| `issued_from_verdict` | yes | string | `READY@YYYY-MM-DD` — the verdict this manifest was issued against. |
| `story_set_digest` | yes | string | The digest recorded with that verdict (`H4`). |
| `accepted_on` | yes | date \| `none` | When `ROLE-orchestrator` accepted. `none` until then. |
| `dispatch_unit` | yes | `ticket` | The addressable unit of fanout. `ticket` is the only value in `manifest_version: 1` (§5.5). |
| `max_parallelism` | yes | integer \| `default` | Ceiling on concurrent dispatches. `default` means the fanout mechanism's own default. |
| `completion` | yes | enum | `pending \| complete \| blocked \| abandoned` (§5.8). |
| `stories` | yes | list | The `REQ-` ids in the product band. Never empty. |
| `updated_by_role` | yes | `ROLE-` key | Last writer. |

`revision` bumps on any re-issue (§8). It is **not** bumped for execution-band
changes: ledger appends, state transitions, and dispatch-ref writes are lifecycle
advances, not revisions.

## 4. The twelve required elements

Every element below is present in every manifest, in the form stated. A field's
empty form is written, never omitted.

| # | Element | Where | Empty form |
| --- | --- | --- | --- |
| 1 | Initiative identity | `initiative`, §5.1 | never empty |
| 2 | Story identities | `stories`, §5.3 `REQ-` column | never empty |
| 3 | Readiness status | §5.3 `Readiness` column | never empty |
| 4 | Dependency DAG | §5.3 `Depends on` (stories) and §5.5 `Depends on` (units) | `none` per row |
| 5 | Blocking relationships | §5.3 `Blocked by` column | `none` per row |
| 6 | Parallelizable groups / waves | §5.6 | never empty once units exist |
| 7 | Ordering constraints | §5.4 | `none — dependencies are the only ordering` |
| 8 | Shared product/design references | §5.2 | each bullet's explicit empty form |
| 9 | Story status | §5.3 `Status` column | never empty |
| 10 | Retry / failure state | §5.5 `Attempts`, `Last outcome`; §5.7 | `0` / `none` |
| 11 | Completion state | `completion`, §5.8 | never empty |
| 12 | Initiative ↔ dispatched orchestrator relationship | §5.5 `Dispatch ref`, §5.7 | `none` until dispatched |

## 5. Sections

### 5.1 Identity

The initiative id, its outcome statement in one sentence copied from the handoff
packet, and a link to `../product/state.md` `## Handoff packet`. Nothing else —
the packet is the authority for its own contents.

### 5.2 Shared references

Pointers, one line each, never restatements:

| Bullet | Contents | Empty form |
| --- | --- | --- |
| Design references | `DES-nnnn → <repository-relative local_export>`, each existing on disk | `none — no user-facing surface` |
| Decisions in force | `PD-` ids | `none` |
| Binding technical constraints | one line each, each citing its `technical/` file and round | `none` |
| Explicitly out of scope | a link to the initiative's out-of-scope section | never empty |
| Non-blocking open questions | `Q-` ids below `blocker` severity | `none` |

These are five of the eight bullets the handoff packet carries
(`engineering-handoff.md` §6), by reference. The packet's other three — outcome,
story sequence, and the pointer to this file — are §5.1 and §5.3 here. A manifest that paraphrases the
packet has created a second authority for the same fact.

### 5.3 Stories — product band, frozen at acceptance

`REQ- | Title | Status | Readiness | Depends on | Blocked by | Wave (planned)`

- `Status` — the story's `status`, copied. `accepted` at issue; advanced to
  `implemented`/`verified` by the delivery roles that already hold that write.
- `Readiness` — the story's `readiness` field: `engineering-ready` at issue;
  `blocked` or `void` thereafter (`frontmatter.md` §"The immutability surface").
- `Depends on` — the `REQ-` entries of the story's `depends_on`, identifiers
  only, `none` when the story is on the frontier. Non-`REQ-` dependency entries
  (`PD-`, `DES-`, `CAP-`, external systems) are **not** ordering edges and do
  not appear here; they are §5.2 references.
- `Blocked by` — `Q-` ids of `blocker` severity naming this story, or `none`.
- `Wave (planned)` — the story-level wave computed by §6.1. Planned, because the
  executable wave is the unit-level one in §5.6.

The graph over `Depends on` must be acyclic; a cycle is a defect that stops the
manifest from being issued.

### 5.4 Ordering constraints — product band, frozen at acceptance

One line per ordering constraint that is **not** expressible as a `depends_on`
edge — a shared flag, a migration that must precede a read path, a coordinated
release. Each line cites the story section it comes from
(`REQ-nnnn §Sequencing`).

**A manifest never introduces an ordering constraint that is not already in a
story.** If one is discovered at compile time, the story is defective and the
route is §8, not a new line here.

### 5.5 Dispatch units — execution band

A **dispatch unit** is one addressable fanout target. In `manifest_version: 1` it
is always a **ticket**, because the engineering orchestrator's front door takes a
ticket_code and one story may become several tickets
(`engineering-handoff.md` §2.3). Stories are therefore what the product band
carries and tickets are what gets dispatched; §6.2 is the projection between
them.

`Unit | Stories | Depends on | State | Attempts | Last outcome | Dispatch ref | Wave | Updated`

- `Unit` — the tracker key verbatim, never re-encoded (`identifiers.md` §5).
- `Stories` — the `REQ-` ids this ticket serves, copied from `tickets.md`.
- `Depends on` — unit keys, computed by §6.2.
- `State` — one of the closed set:

  | State | Meaning |
  | --- | --- |
  | `not-eligible` | Dependencies unmet. Not launchable. |
  | `eligible` | Every §6.3 condition holds. Launchable now. |
  | `dispatched` | An engineering orchestrator is in flight for it. |
  | `complete` | That orchestrator reported terminal success. |
  | `failed` | It reported a blocker. Needs a human. Never auto-retried. |
  | `blocked` | A `blocker` `Q-` names it or one of its stories. |
  | `void` | A story it carries was superseded; the unit no longer describes real work. |
  | `unreachable` | A dependency is `failed`, `blocked`, or `void`. |

- `Attempts` — count of dispatches. `0` before the first. Incremented only on an
  actual dispatch, including a human-authorised re-dispatch (§6.6).
- `Last outcome` — the terminal line the last dispatch returned, verbatim and
  truncated to one line, or `none`.
- `Dispatch ref` — how the parent initiative reaches the child orchestrator: the
  batch slug and the agent/session identifier of the dispatch, plus the branch
  or PR pointer once one exists. `none` until dispatched. This column and §5.7
  are element 12: the manifest is where the relationship between the parent
  initiative and its dispatched orchestrators is durable, because an agent
  identifier that lives only in a transcript does not survive the session.
- `Wave` — the executable wave from §5.6.

### 5.6 Waves — execution band

Wave `n` is the set of units whose §6.2 dependencies all sit in waves `< n`.
Wave `0` is the dependency-free frontier. Waves are a **derived grouping, not a
barrier**: a unit becomes eligible the moment its own dependencies are
`complete`, not when its whole wave is. The wave numbers exist so a reader can
see the shape of the parallelism and so `max_parallelism` can be reasoned about;
nothing waits on a wave boundary.

`Wave | Units | Eligible-now count`

### 5.7 Dispatch ledger — execution band, append-only

`Date | Unit | Event | Detail`

Events are a closed set: `dispatched`, `completed`, `failed`, `blocked`,
`voided`, `unreachable`, `re-dispatched (human-authorised)`, `manifest
re-issued`. Rows are appended, never edited or deleted — this is the audit trail
that makes a batch resumable by a session with no memory of the one that started
it.

### 5.8 Completion — execution band

`completion` is computed, not asserted:

| Value | Condition |
| --- | --- |
| `complete` | Every unit is `complete`, and every story is `verified` or `implemented`. |
| `blocked` | No unit is `eligible` or `dispatched`, and at least one is `failed`, `blocked`, `void`, or `unreachable`. |
| `abandoned` | The initiative was abandoned upstream. |
| `pending` | Anything else. |

`complete` is what authorises `delivery/state.md` `stage: done` and, after it,
`SKILL-close-initiative`. The manifest never closes the initiative itself.

## 6. Deterministic rules

Two correct implementations reading the same repository at the same commit
return the same manifest. Every rule below is a comparison against files.

### 6.1 Story wave

`wave(s) = 0` when the story's `REQ-` `depends_on` is `none`; otherwise
`1 + max(wave(d))` over its `REQ-` dependencies. Longest path, not shortest.

### 6.2 Unit dependency projection

Unit `T` depends on unit `U` (`U ≠ T`) iff **either**:

- **(a)** `delivery/tickets.md` names `U` in `T`'s `Depends on` cell; **or**
- **(b)** some story on `T` has `U`'s story in its transitive `REQ-`
  `depends_on` closure.

(b) is what makes a **product** dependency binding on execution without the
product manager ever drawing a ticket graph — the thing
`skill-library.md` §4 removed `build-delivery-graph` to prevent. Unit waves are
then §6.1 over this relation.

### 6.3 Eligibility

A unit is `eligible` iff **all** of:

| # | Condition |
| --- | --- |
| `E1` | Every story it carries has `readiness: engineering-ready`. |
| `E2` | The manifest is accepted: `band_owner: delivery`, `accepted_on` set, and the initiative's `product/state.md` is at `phase: HANDOFF`. |
| `E3` | Every unit it depends on (§6.2) is `complete`. |
| `E4` | No `blocker` `Q-` names the unit or any story it carries. |
| `E5` | Its state is not already `dispatched`, `complete`, or `void`. |
| `E6` | In-flight dispatches `< max_parallelism`. |
| `E7` | No `dispatched` unit shares a §5.4 mutual-exclusion group with it — a §5.4 constraint naming a set of stories built "one at a time, never in parallel" is read, through the §5.5 `Stories` column, as a set of units never in flight together. |

`E1` is a **read**, not a re-derivation. Whatever reads this manifest takes
`engineering-ready` as settled; see `delivery-fanout.md` §3.

### 6.4 State transitions

Only these transitions are legal:

```
not-eligible → eligible → dispatched → complete
                       ↘             ↘ failed
not-eligible/eligible → blocked | void | unreachable
failed | blocked → eligible        (human-authorised only, §6.6)
void → (terminal; the unit is replaced by a re-issue, §8)
```

`complete` is terminal and never reversed. A unit that must be redone after
completion is a new ticket, not a reopened one.

### 6.5 Completion event

A unit moves to `complete` on two facts together, and nothing less:

1. The terminal success line of its dispatched engineering orchestrator.
2. The unit's PR(s) merged to the repository's default branch.

The merge itself happens **inside** the dispatched orchestration:
`release-coordinator` merges each PR at SHIP once its checks are green (or the
repo has none). The local `delivery_reviewer` verdict — `APPROVED` or
`APPROVED WITH COMMENTS`, required before SHIP ever runs — is the entire
review gate: there are no GitHub-side reviewers and no human merge step
anywhere in delivery. The initiative-scope fan-out session verifies merge
state by a GitHub read (never memory or narration) when recording completion,
and merges as a backstop if a green PR was left open. A PR that cannot merge
(red checks, conflicts) is never forced — the unit goes `failed` for a human.

Recording `complete` is what triggers a frontier recompute (§6.3 `E3`) and is
therefore the single event that lets a dependent unit launch — which is why
`complete` must mean "this unit's code is on the default branch": dependents
branch from it.

### 6.6 Retry

Retry is never automatic. A `failed` or `blocked` unit stays where it is until a
human authorises a re-dispatch; only then does `Attempts` increment and a
`re-dispatched (human-authorised)` row get appended. This is the existing
no-blind-retry rule of the fanout mechanism made durable rather than
session-local.

### 6.7 Invariants

| # | Invariant |
| --- | --- |
| `M1` | The story graph (§5.3) and the unit graph (§6.2) are both acyclic. |
| `M2` | Every story in `stories` appears in exactly one §5.3 row and is `status: accepted` at issue. |
| `M3` | Every unit's `Stories` cell is non-empty and every `REQ-` in it appears in §5.3. |
| `M4` | Every identifier resolves through its index; every `local_export` exists on disk. |
| `M5` | `story_set_digest` matches the digest on the `READY` verdict. A mismatch voids the manifest (§8). |
| `M6` | The §5.5 projection agrees with `delivery/tickets.md` as of its `synced_on`. Disagreement is repaired **from** `tickets.md` (§7). |
| `M7` | No section of this file contains an HLD, an execution plan, a task breakdown, or an estimate (`engineering-handoff.md` §5, `C10`). |
| `M8` | The product band is byte-identical to its issued form while `band_owner: delivery`. |

## 7. Reconciliation with `delivery/tickets.md`

There is exactly one ticket manifest, and this is not it.

| Fact | Authority |
| --- | --- |
| Tracker key, title, ticket↔story mapping, branch, PR, tracker status, ticket `Depends on` | `delivery/tickets.md`, refreshed by `SKILL-sync-tickets` |
| Story set, story readiness, story dependency DAG, ordering constraints, shared references | this manifest's product band |
| Unit state, attempts, dispatch refs, waves, completion | this manifest's execution band |

`SKILL-sync-tickets` runs first and this manifest is projected from its result:
after each sync, §5.5's `Unit`, `Stories`, and `Depends on` columns are
recomputed per §6.2 and any drift is repaired from `tickets.md`. The reverse
repair is never performed. Where a sync leaves `tickets.md` advisory (tracker
unreachable), the dependency graph is still usable — it is the part `tickets.md`
is authoritative for regardless of freshness — but no unit may be moved to
`complete` on an advisory status column; completion comes from §6.5.

A unit whose ticket disappears from `tickets.md` becomes `void` and the
disappearance is a `Q-`, not a silent deletion.

## 8. Re-issue

A manifest is void the moment `M5` fails — a story in its digest was superseded,
withdrawn, or set `readiness: void`. Then:

1. Units carrying the affected story become `void`; their dependents become
   `unreachable`; a `voided` ledger row is appended for each. Units carrying
   none of the affected stories keep running.
2. `completion` becomes `blocked` and `band_owner` returns to `product`.
3. `ROLE-product-manager` regresses per its declaration §13, supersedes the story
   (`SKILL-supersede-artifact`), and the successor re-enters READINESS. The prior
   verdict is void — a superseded story is never swapped under a unit in flight.
4. On the next `READY` verdict, the product band is re-issued in place with
   `revision + 1`, a new `story_set_digest`, a new `issued_from_verdict`, and a
   `manifest re-issued` ledger row. The execution band is **preserved**: units
   that completed under the prior revision stay `complete`.

There is no second manifest file and no versioned copy. The ledger is the
history.

## 9. Related specifications

- [`../architecture/delivery-fanout.md`](../architecture/delivery-fanout.md) —
  how this manifest is consumed, and the Readiness → Manifest → Fanout →
  Orchestrator boundary.
- [`../architecture/engineering-handoff.md`](../architecture/engineering-handoff.md)
  — the handoff packet this manifest is compiled from, and the assumption
  register that makes `engineering-ready` readable without re-verification.
- [`frontmatter.md`](frontmatter.md) — the canonical story schema and the
  immutability surface this file's two-band rule mirrors.
- [`index-formats.md`](index-formats.md) — the ticket manifest this file
  projects from.
- [`../architecture/product-memory.md`](../architecture/product-memory.md) §4.17
  — the artifact contract.
