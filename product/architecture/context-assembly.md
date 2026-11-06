---
id: ARCH-context-assembly
type: architecture
title: Context assembly rules
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Context assembly rules

The rules a stateless session uses to turn Product Memory into a bounded,
trustworthy working set — and to decide what may be believed when sources
disagree, when they are stale, or when they are simply absent.

This document holds the **rules**. The two procedures that apply them are
`SKILL-hydrate-product-context` and
`SKILL-checkpoint-product-state`.

Nothing here names a model, a vendor, or a tool-calling primitive. Every rule
is expressed over files, identifiers, and integers so that any environment
capable of reading a git repository can implement it identically.

---

## 1. The two invariants

**I1 — Durable state never comes from conversation.** No rule in this document
may be satisfied by "the prompt said so", "the previous session decided", or
"the user mentioned earlier". Every element of assembled context carries a
repository-relative source path and the identifier of the artifact it came
from. A claim with no such source is *input to be verified*, never context.

**I2 — Hierarchy is used, never manufactured.** Retrieval walks only the
scoping levels that actually exist in this repository, as declared by
`manifest.yaml:scaling_profile` and the presence of `product/areas/`. A profile-S
project has no area step — not an empty one. See
[`scaling-profiles.md`](scaling-profiles.md).

---

## 2. Scope resolution

### 2.1 The resolution ladder

Scope is resolved top-down, and **each rung is skipped when the structure it
needs does not exist**:

| Rung | Present when | Yields |
| --- | --- | --- |
| R0 Product | Always | `project/mission.md`, `principles.md`, `constraints.md`, `glossary.md` |
| R1 Area | `scaling_profile` is `M` or `L` **and** `manifest.yaml:areas` is non-empty | one or more `AREA-<slug>` |
| R2 Subsystem | `scaling_profile` is `L` **and** the resolved area declares subsystems | one or more subsystem slugs |
| R3 Initiative | An `INIT-` was supplied, or one is matched, or one is created | exactly one `INIT-nnnn` |
| R4 Current work | The initiative has `product/state.md`, `delivery/state.md`, or both | product phase, delivery stage, next action, ticket frontier |

For a profile-S project the ladder is exactly `R0 → R3 → R4`. That is not a
degraded path; it is the whole path.

**Rung existence is a deterministic test**, not a judgement:

```
R1 exists  ⇔  manifest.scaling_profile ∈ {M,L} ∧ len(manifest.areas) > 0
R2 exists  ⇔  manifest.scaling_profile = L ∧ areas/<slug>/subsystems/ is non-empty
R3 exists  ⇔  an INIT- id resolves to a directory under initiatives/
R4 exists  ⇔  that directory contains product/state.md ∨ delivery/state.md
```

### 2.2 Entity resolution from a raw request

When the input is prose rather than an identifier, candidates are generated
**deterministically** and selected **by judgement**, in that order. The
generator must never be the model's recollection.

1. **Literal identifier scan.** Regex the request for `INIT-\d{4}`, `REQ-\d{4}`,
   `CAP-\d{4}`, `PD-\d{4}`, `DES-\d{4}`, `Q-\d{4}`, and the tracker pattern in
   `manifest.yaml:external_systems.issue_tracker.ticket_key_pattern`. Any hit is
   resolved through its index — no ranking needed.
2. **Ticket key → initiative.** A tracker key resolves through
   `delivery/tickets.md` to its initiative in one lookup.
3. **Lexical candidate generation.** Tokenize the request; drop stopwords and
   terms defined as generic in `project/glossary.md`. Match remaining tokens
   against the `Title` and slug of every row in `initiatives/index.md`,
   `capabilities/index.md`, `areas/index.md` (when R1 exists), and
   `decisions/index.md`. Score each row by count of distinct matched tokens.
   Keep every row with score ≥ 1, capped at the top 20 per collection.
4. **Judged selection.** From that bounded candidate list, select at most one
   area (when R1 exists) and at most one initiative. The selection must cite the
   matched tokens.
5. **Ambiguity rule.** If two initiative candidates tie on score and both are
   `active`, do **not** pick one. Emit both in the packet's
   `ambiguities` and set `confidence: low`. The caller resolves it; a wrong
   initiative silently writes work into the wrong record.
6. **No match.** Zero candidates is a legitimate outcome — see §9.3.

### 2.3 Scope widening and narrowing

- An artifact with **no** `area` field is product-global and is in scope for
  every area. This is permanent and correct for cross-cutting work.
- An artifact carrying an `area` that is **not** the resolved area is out of
  scope unless it is referenced by identifier from something already in scope.
  Reference pulls a record in regardless of its scope.
- Widening beyond the resolved area happens only for that reference-following,
  and only to depth 1 (§5.3).

---

## 3. Authority precedence

When two in-scope sources say different things, this ordered ladder decides.
It is evaluated top-down; the first rung that distinguishes them wins.

| # | Rule |
| --- | --- |
| A1 | An artifact under `product/archive/`, or with `status` in {`superseded`, `historical`, `rejected`, `withdrawn`, `abandoned`}, loses to anything current. It is never context; it is at most rationale. |
| A2 | An artifact absent from its collection index loses to any indexed artifact. Indexes are the closed world. |
| A3 | `project/constraints.md` beats everything, except a decision that names it in `affects` and explicitly amends it. |
| A4 | An `accepted` decision beats narrative text in any capability, initiative, or area file. |
| A5 | A later `decided_on` decision beats an earlier one on the same subject. Equal dates → the one with the higher `PD-` number. |
| A6 | An `authoritative` capability beats an initiative's description of intended behavior. Capabilities describe what *is*; initiatives describe what is *wanted*. |
| A7 | An `accepted` requirement beats the initiative narrative that summarizes it. |
| A8 | A fresh mirror (§4) beats a stale mirror of the same external system. |
| A9 | A `draft` or `proposed` artifact never beats anything, and is carried only in the packet's `provisional` section. |

A5, A2, A1, and A8 are decidable by string and date comparison — they are
deterministic checks (§11). A3, A4, A6, A7 require reading the two artifacts to
establish that they are about the same subject; only the *subject-sameness* step
is judged, never the ordering.

**Nothing is ever resolved by preferring the more recently written file on
disk.** `mtime` is not authority.

---

## 4. Freshness

Freshness applies to artifacts that mirror an external system of record. Product
Memory's own artifacts do not go stale — they go `superseded`.

### 4.1 Windows

Declared in `manifest.yaml:context.freshness_windows`, defaulting to:

| Mirror | Default window | Beyond the window |
| --- | --- | --- |
| `delivery/tickets.md` (per-initiative and global) | 24 h | `advisory` |
| `design/index.md` external links | 30 d | `advisory` |
| `delivery/board.md` | 24 h | `advisory` |

### 4.2 Effect of staleness

A mirror past its window is downgraded to `advisory`:

- it **may** inform planning, ordering, and estimation;
- it **must not** be the basis of a destructive or outward-facing action
  (closing a ticket, shipping, declaring an initiative complete);
- the packet records it as `stale` with its `synced_on` and the age in hours,
  so the consuming role can decide to re-sync rather than discovering the
  staleness after acting.

A missing `synced_on` is treated as infinitely stale. It is not treated as
fresh, and it is not an error.

### 4.3 Re-sync is not automatic

Hydration never contacts an external system. It reads the committed mirror and
reports its age. Re-syncing is `SKILL-sync-tickets`, owned by the orchestrator,
and is a separate decision with side effects.

---

## 5. Supersession

### 5.1 Following pointers

On encountering `status: superseded`, follow `superseded_by` to the replacement
and use the replacement. Retain the superseded artifact's **identifier and
one-line reason** in the packet's `superseded_trail`, never its body.

### 5.2 Termination

Chains are followed to a maximum depth of 5. On exceeding the depth, or on
revisiting an already-visited identifier (a cycle), stop, use the last
non-repeating record, and emit a `defect` entry in the packet. Both conditions
are deterministic.

### 5.3 Reference expansion

Identifier references found in frontmatter (`decisions`, `requirements`,
`capabilities`, `supersedes`, `affects`, `blocked_by`) are expanded **to depth 1
only**. Depth-1 expansion is what makes an initiative self-contained; unbounded
expansion pulls in the whole repository and destroys the budget.

A referenced identifier that appears in no index is a **broken reference**:
record it in the packet's `defects` and, per the universal role obligations,
raise a `Q-` rather than inventing what it meant.

### 5.4 Why superseded content is never inlined

A future session must not re-litigate a settled question, which is why the
superseded record survives on disk. But a superseded record inside the working
context is a live source of contradiction. The trail carries the *fact* of the
supersession; the reasoning stays one read away.

---

## 6. Conflict resolution

1. Detect: two in-scope sources make incompatible claims about the same subject.
2. Apply §3 in order. If a rung separates them, the loser is dropped from the
   packet and recorded in `conflicts_resolved` with the rung that decided it.
3. If no rung separates them, the conflict is **unresolved**. Do not average the
   two, do not pick the longer one, and do not pick the one that better matches
   the request.
4. An unresolved conflict produces a `Q-` record (severity `blocker` when it
   touches the resolved initiative's requirements or constraints, `important`
   otherwise) and a `conflicts_open` entry in the packet.
5. A `blocker`-severity unresolved conflict sets the packet's
   `readiness: blocked`. The consuming role reads and reports; it does not
   advance the initiative.

Guessing between two authoritative-looking records is the single most expensive
failure available to this system: it produces work that is confidently wrong and
leaves no trace of the choice.

---

## 7. Relevance ranking

Relevance decides what is *included*; §8 decides what *survives the budget*.

### 7.1 Bands

Every candidate is assigned exactly one band. Bands are ordered; a lower band is
never included at the cost of a higher one.

| Band | Contents |
| --- | --- |
| B0 **Binding** | `project/constraints.md`; `principles.md`; every `accepted` decision in scope that names the resolved initiative, area, or a resolved capability in `affects`. |
| B1 **Task-critical** | The resolved initiative file; its `product/state.md` **and** its `delivery/state.md`, whichever exist; its `accepted` requirements; its ticket frontier; every `open` question with `severity: blocker` that either names the resolved initiative **or names no initiative at all**. |
| B2 **Directly referenced** | Depth-1 expansions (§5.3): capabilities the initiative changes, `DES-` records with a `local_export`, decisions referenced by its requirements, and the initiative's current-round `technical/assessment.md` and `technical/coherence.md` where they exist. |
| B3 **Scope context** | `mission.md`; the resolved `area.md` when R1 exists; `glossary.md` terms that appear in the request. |
| B4 **Neighbouring** | Other `active` initiatives touching the same capability or area; `important`-severity open questions in scope. |
| B5 **Advisory** | Stale mirrors; `draft`/`proposed` artifacts; superseded trail lines; historical context. |

Only the architect's two *verdict-bearing* files enter B2. Its evidence files —
`technical/capability-scan.md` and `technical/impact.md` — do not: they are
reached by path from the initiative identifier by the role that needs them, the
way the designer's `journeys.md`/`flows.md`/`states.md` are. The distinction is
between a finding that binds another role's decision and the working material
behind it.

### 7.2 Ordering within a band

Sort by, in order: (a) direct identifier match to the request, (b) count of
distinct request tokens matched, (c) `updated` descending, (d) identifier
ascending. All four are deterministic; the tie-break chain terminates.

### 7.2a Product-global blockers

A `blocker` question with no `initiative` binds the whole product, so it enters
B1 for **every** hydration, including one that resolved no initiative. It is not
subject to the B4 cap and is never demoted to advisory.

It does **not**, on its own, set `readiness: blocked`. Blocking is per
initiative and comes from `delivery/state.md:blocked_by`; a global blocker that
froze every session would make the cheapest way to unblock work the deletion of
a question. A global blocker is made *unmissable*, not *paralysing* — the
consuming role sees it in binding-adjacent context and decides whether its own
task actually depends on it.

### 7.3 Hard caps

Independent of budget: at most 10 B4 items and at most 10 B5 items. Beyond the
cap, items are listed as identifier + title only. A packet that is mostly B4/B5
has diluted the very context it exists to sharpen.

---

### 7.4 The two state files

An initiative may carry two state records, and hydration reads **both**:

| File | Authority for | Written by |
| --- | --- | --- |
| `initiatives/INIT-*/product/state.md` | `phase` — how far product definition has got | `ROLE-product-manager`, via `SKILL-advance-product-phase` |
| `initiatives/INIT-*/delivery/state.md` | `stage` — where delivery stands | `ROLE-orchestrator`, via `SKILL-resume-initiative` |

They describe different subjects and never share a writer. Retrieval must not
collapse them, prefer one over the other, or infer either from the other: an
initiative can be converged on the product side and untouched on the delivery
side, and the reverse is equally legitimate. Reading only one is how a session
concludes that work is further along, or further behind, than it is.

Either file may be absent. Absence means that side has not started — never that
the other side's value applies to it.

Hydration reads `product/state.md` only — never its sibling
`product/state-history.md`, which is `historical` and holds nothing current
(`product-memory.md` §4.15 item 11). A session opens the history file only when
a specific question needs a moved row or snapshot, and cites it as history.
When `product/state.md` exceeds **300 lines**, hydration records a `defects`
row of kind `state-oversize` (`kind | detail | path | raised as` =
`state-oversize | <n> lines > 300 | <path> | warning`) and still assembles
the packet: the warning asks the owner to trim, it never blocks.

## 8. Token and context budgeting

### 8.1 Budget expression

The budget is a **token count**, declared in
`manifest.yaml:context.budget_tokens`, defaulting to `24000`. It is expressed
absolutely rather than as a fraction of a model's window so that the same
repository yields the same packet under any provider. An environment with a
smaller window lowers the number; the assembly rules do not change.

Token counts are estimated deterministically as
`ceil(bytes_utf8 / 4)` unless the environment provides a real tokenizer, in
which case that is used and the packet records which was used in
`budget.method`. The estimator is intentionally crude and slightly
conservative; a budget that is only approximately right but *identically*
computed every run is worth more than an exact one that varies by provider.

### 8.2 Allocation

Bands draw from the budget in order, each with a ceiling:

| Band | Ceiling |
| --- | --- |
| B0 | no ceiling — always included in full |
| B1 | 45 % of budget |
| B2 | 25 % |
| B3 | 10 % |
| B4 | 10 % |
| B5 | 5 % |

Unused allocation flows **downward** to the next band, never upward. If B0
alone exceeds the budget, the packet is emitted over budget with
`budget.exceeded: true` and a `defect` entry: binding constraints are never
dropped to fit, and a product whose constraints do not fit in a working context
has a real problem that must surface rather than be silently truncated away.

### 8.3 Degradation ladder

When a band exceeds its ceiling, apply in order and stop as soon as it fits:

1. Drop B5 entirely (keep a one-line count).
2. Reduce B4 to identifier + title only.
3. Reduce B2 to identifier + title + one-line purpose.
4. Reduce B3 to `mission.md`'s outcome statement plus matched glossary terms.
5. Within B1, replace requirement bodies with `id + title + acceptance criteria`
   — acceptance criteria are the part that work is judged against and are the
   last thing to go.
6. Emit with `budget.exceeded: true` and a `defect` entry.

Every rung is a mechanical transformation of already-selected content. **No rung
is "summarize it".** A model-written summary inside the packet becomes a source
that no longer has a file behind it, breaking I1.

### 8.4 What is never inlined

Design assets, code, and full ticket histories are referenced by path, never
embedded. `local_export` paths are passed as paths so the consuming role reads
them if and only if it needs them.

---

## 9. Missing context

Missing context is a normal state, especially early in a product's life. It is
reported, never invented.

| Missing | Behavior |
| --- | --- |
| `manifest.yaml` | **Hard stop.** The canonical root is not present or not initialized. Emit `readiness: uninitialized`. Do not create artifacts in an unrecognized tree. |
| `project/mission.md` or `constraints.md` absent, or present but `draft` | Proceed. Mark `foundation: incomplete`. Draft context is not binding and must not be cited as a constraint. Ensure an open `Q-` exists asking for it; raise one if not. |
| Resolved area's `area.md` absent while the manifest registers the area | `defect` entry — the manifest and the tree disagree. Fall back to product-global scope. |
| Initiative directory exists but `delivery/state.md` absent | The initiative has never been through orchestration. `stage: unknown`, `readiness: needs-orchestration`. Do not assume `define`. |
| `delivery/state.md` present but its `stage` contradicts the artifacts | Report both. Hydration **reports**; it never rewrites. Correction is `SKILL-resume-initiative`, which owns that file. |
| Ticket manifest absent | Empty frontier, not an error. Common before planning. |
| A referenced identifier resolves to nothing | `defect` entry + a `Q-`. Never guess the referent. |
| An index row points at a nonexistent path | `defect` entry. The filesystem is the data and the index is the contract; the contract is broken and must be repaired, not routed around. |

Absence is never filled from the model's own knowledge of similar products. An
empty `capabilities/` means *unknown*, not *nothing*.

---

## 10. The Working Context Packet

### 10.1 What it is

The single, canonical output of hydration: the complete, bounded, sourced
context a role needs to do one task. It is the **only** thing a role should need
besides the request itself.

It is **session-local and non-authoritative by definition.** It is a derived
view of Product Memory, correct only at the instant it was assembled. It is
never written under `product/`, never committed, and never cited by a later
session as evidence of anything. What survives it is the `context_digest`
(§10.4), which checkpoint records.

### 10.2 Structure

```
packet:
  # --- provenance ---
  schema_version         int      matches manifest.schema_version
  assembled_on           date     YYYY-MM-DD
  assembled_for_role     ROLE-<slug>
  request_summary        string   verbatim-derived restatement of the ask
  inputs                 { raw_request?: string, initiative?: INIT-nnnn }
  repository             { root: path, head_commit: sha }

  # --- resolution ---
  scope:
    profile              S|M|L                    from manifest
    rungs_present        [R0,(R1),(R2),(R3),(R4)] deterministic, §2.1
    area                 AREA-<slug> | null
    subsystem            slug | null
    initiative           INIT-nnnn | null
    resolution_evidence  [ {rung, id, matched_on} ]
    confidence           high|medium|low
    ambiguities          [ {rung, candidates[], why_unresolved} ]

  # --- the context itself, banded ---
  binding                [ source ]   B0 — constraints, principles, accepted decisions
  task                   [ source ]   B1 — initiative, state, requirements, frontier, blockers
  referenced             [ source ]   B2 — depth-1 expansions
  scope_context          [ source ]   B3 — mission, area, glossary terms
  neighbouring           [ source ]   B4 — capped at 10
  advisory               [ source ]   B5 — capped at 10; stale, draft, proposed

  # --- current work ---
  current:
    phase                product phase | unknown | null    from product/state.md
    phase_entered        date
    converged            bool | null
    readiness_verdict    none|READY|NOT READY|void | null
    stage                define|design|plan|implement|verify|ship|done|unknown
    stage_entered        date
    next_action          string
    blocked_by           [ Q-nnnn ]
    ticket_frontier      [ ticket-key ]
    frontier_freshness   fresh|stale|absent

  # --- integrity ---
  superseded_trail       [ {from_id, to_id, reason} ]
  conflicts_resolved     [ {subject, kept, dropped, rule} ]      rule = A1..A9
  conflicts_open         [ {subject, sources[], raised_as: Q-nnnn} ]
  defects                [ {kind, detail, path?, raised_as?: Q-nnnn} ]
  omissions              [ {band, dropped_count, reason} ]

  # --- accounting ---
  budget:
    limit_tokens         int
    used_tokens          int
    method               estimate|tokenizer
    exceeded             bool
    per_band             { B0..B5: int }

  # --- verdict ---
  readiness              ready|degraded|blocked|needs-orchestration|uninitialized
  foundation             complete|incomplete
  context_digest         string     §10.4
```

Every entry in `binding`, `task`, `referenced`, `scope_context`,
`neighbouring`, and `advisory` is a **source record**:

```
source:
  id            artifact identifier, or PROJECT for singleton context files
  type          from schemas/frontmatter.md
  path          repository-relative
  status        copied verbatim from the artifact
  revision      copied verbatim
  updated       YYYY-MM-DD
  band          B0..B5
  inclusion     full|fields|reference-only
  why           which rule or matched token put it here
  content       present only when inclusion = full|fields
```

### 10.3 Invariants

- **P1** Every element has a `path` and an `id`. Nothing enters the packet
  without a file behind it.
- **P2** `status` and `revision` are copied, never inferred or normalized.
- **P3** No archived, `superseded`, `historical`, `rejected`, `withdrawn`, or
  `abandoned` artifact appears outside `superseded_trail`.
- **P4** No `draft` or `proposed` artifact appears outside `advisory`.
- **P5** The packet contains no content the assembler wrote — only content it
  copied, plus the structural fields defined above.
- **P6** `readiness: blocked` whenever `conflicts_open` contains a `blocker`, or
  `current.blocked_by` is non-empty.
- **P7** Given the same `head_commit` and the same inputs, two runs produce
  identical `scope`, `context_digest`, and band membership. Prose in `why` may
  differ; membership may not.

### 10.4 Context digest

```
context_digest = sha256( join("\n", sorted( "<id>@<revision>#<status>"
                                            for every source in the packet )) )
```

Truncated to 16 hex characters for recording. It is the audit link between a
session's output and the exact state of memory that produced it: two sessions
with the same digest saw the same product, and a decision recorded against a
digest can be re-examined later against precisely what was visible when it was
made.

---

## 11. Determinism

The split matters because the deterministic half is verifiable, cheap, and
identical across providers, while the judged half is where a model earns its
place. Anything that *can* be decided by comparison **must** be.

### 11.1 Deterministic — must never be delegated to judgement

| # | Check |
| --- | --- |
| D1 | Frontmatter is present and parses; required fields per `schemas/frontmatter.md` exist. |
| D2 | `id` matches the filename identifier, and both match the index row. |
| D3 | Every index row's `Path` resolves to an existing file. |
| D4 | Every artifact file in a collection has an index row. |
| D5 | `status` is a member of the vocabulary in `authority-and-versioning.md`. |
| D6 | `status: superseded` implies a non-empty `superseded_by` that resolves. |
| D7 | Supersession chains terminate: depth ≤ 5, no cycles. |
| D8 | Every identifier referenced in frontmatter appears in some index. |
| D9 | Rung existence (§2.1) from `manifest.yaml` and directory presence. |
| D10 | Mirror age = today − `synced_on`, compared against the freshness window. |
| D11 | Identifier allocation: new id = counter + 1; counter incremented; index row added — all present in one commit. |
| D12 | Dates are ISO `YYYY-MM-DD` and are not in the future. |
| D13 | Token accounting: per-band totals sum to `used_tokens`; ceilings respected or `exceeded: true`. |
| D14 | Packet invariants P1–P4 and P6. |
| D15 | `delivery/state.md` exists for every `active` or `blocked` initiative, and every such initiative has a board row. |
| D19 | The two state files never contradict each other on ownership: `product/state.md` carries `phase` and no `stage`; `delivery/state.md` carries `stage` and no `phase`. One subject, one file, one writer. |
| D16 | An initiative at `stage: implement` or later has a non-empty requirement set. |
| D17 | `blocked_by` entries resolve to `Q-` records that are still `open`. |
| D18 | Checkpoint completeness: every artifact written in the session has an index row and, where applicable, a counter bump. |

A run in which any of D1–D8 fails does not stop hydration; each failure becomes
a `defect` entry. A run in which D11 or D18 fails **does** stop a checkpoint —
those write a corrupt memory rather than an incomplete one.

### 11.2 Judged — genuinely requires a model or a human

| Check |
| --- |
| Whether a raw request refers to an existing initiative or a new one. |
| Whether two artifacts are *about the same subject* (the precondition for §6, though the resolution itself is mechanical). |
| Which of the deterministically generated candidates is the right area/initiative. |
| Whether a discovered fact is durable product knowledge or session detail (§ `SKILL-checkpoint-product-state`). |
| Whether an acceptance criterion is genuinely testable. |
| Whether an unresolved question is a `blocker` or merely `important`. |
| Writing the prose of a decision's context and consequences. |

### 11.3 Ordering rule

Deterministic checks run **first**, and their results are inputs to judgement.
A model that ranks candidates before the index has been verified is ranking
against a world that may not exist.

---

## 12. Related specifications

- [`lifecycle-hooks.md`](lifecycle-hooks.md) — binds the checks `D1`–`D19` in
  §11.1 to the lifecycle moments at which they must run, names which failures
  are hard gates, and adds `HY1`/`HY2` (canonical-root resolution) to hydration.

- [`product-memory.md`](product-memory.md) — artifact catalog, §4.14 covers the packet.
- [`authority-and-versioning.md`](authority-and-versioning.md) — status vocabulary and supersession mechanics.
- [`scaling-profiles.md`](scaling-profiles.md) — which rungs exist at which profile.
- [`identifiers.md`](identifiers.md) — identifier grammar and allocation.
- `SKILL-hydrate-product-context` — the read procedure.
- `SKILL-checkpoint-product-state` — the write procedure.
