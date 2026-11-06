---
id: ARCH-lifecycle-hooks
type: architecture
title: Lifecycle hooks and deterministic guardrails
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Lifecycle hooks and deterministic guardrails

## 1. What this document is

The named checkpoints at which this architecture stops and verifies itself, and
the five prohibitions those checkpoints exist to enforce.

A **hook** here is a *lifecycle gate in this specification*: a named check that a
procedure must run at a defined moment, with defined inputs, a defined verdict,
and a defined consequence for failing. It is **not** a runtime hook mechanism, a
shell script, or an entry in any tool's settings file. Every hook in this
register is discharged by a skill that already exists in
[`skill-library.md`](skill-library.md); this document gives those checks a name,
a moment, an owner, and a blocking classification so that a stateless session can
be asked *"which gates did you pass, and what did they return?"* and answer from
disk.

**No hook introduces a lifecycle framework of its own.** The phase machine is
still `~/.claude/agents/product-manager-orchestrator.md` §12; the delivery stages
are still `ROLE-orchestrator`'s; the deterministic checks are still `D1`–`D19`
([`context-assembly.md`](context-assembly.md) §11.1), `R1`–`R18`
([`skill-library.md`](skill-library.md) §3.9.2), `C1`–`C11`
([`engineering-handoff.md`](engineering-handoff.md) §7), `M1`–`M8` and `E1`–`E7`
([`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md)), and
`P1`–`P5` and `F1`–`F8` ([`delivery-fanout.md`](delivery-fanout.md)). A hook that
restated any of them would be a second copy that could disagree with the first.
Hooks **bind** those checks to moments; they do not own them.

### 1.1 Why this exists

The system's single structural weakness is that every session starts with no
memory. Its rules are therefore only as good as the last session's willingness to
follow them, and a skipped check leaves no trace. Three failure modes follow, and
all three are silent:

1. a session acts on context it never assembled, or assembled from a transcript;
2. a session establishes something durable and lets it die with the session;
3. a session advances the lifecycle past a gate whose upstream artifact does not
   exist, and the gap is discovered by a role that cannot tell when it appeared.

A hook is the answer to *"where, exactly, would that have been caught?"* Naming
the gate is what makes its absence auditable.

### 1.2 Determinism preference

Every hook is specified so that as much of its verdict as possible is decided by
comparison against files. Where a hook has a judged band, that band is stated
separately and **runs after** the deterministic band, per
[`context-assembly.md`](context-assembly.md) §11.3. A judged check may never
overturn a deterministic failure, and a model may write prose about a defect but
may not decide whether the defect exists.

Eight of the sixteen hooks are **fully deterministic**. The eight carrying a
judged band are `HOOK-initiative-resolved` (entity resolution),
`HOOK-assumption-capture` (materiality), `HOOK-decision-capture` (rationale
prose), `HOOK-traceability` (subject-sameness for disposition),
`HOOK-design-coverage` (`R15`, `R16`), `HOOK-dependency-graph` (whether a
story's criteria require a capability the scan recorded `absent` or `partial`),
`HOOK-readiness` (`R13`–`R18`), and `HOOK-checkpoint` (durable product
knowledge versus session detail). In every one of the eight, the judged band
runs after the deterministic band and decides only what §3 states it decides.

### 1.3 Identity and status of a hook id

`HOOK-<slug>` is a **specification-local name**, like `D11`, `R5`, or an
`RF-` finding id. It allocates no counter, appears in no collection index, is not
an artifact, and does not touch [`../manifest.yaml`](../manifest.yaml)
`id_counters`. The register in §3 is its only authoritative list.

---

## 2. Hard gates versus advisory checks

| Class | Meaning | On failure |
| --- | --- | --- |
| **Hard gate** | Progression past this point is invalid. | Stop. Record the failure in `next_action` (product side) or the stage log (delivery side), raise the `Q-` where one is specified, and do **not** advance. |
| **Advisory** | The condition degrades confidence but does not invalidate the work. | Record it in the packet, the state file, or the manifest, and continue. Never convert an advisory failure into a hard stop by judgement, and never the reverse. |

Fourteen hooks are hard gates. The classification is a property of the hook, not of
the session: a role may not downgrade a hard gate because the work looks urgent,
and may not upgrade an advisory one because the work looks risky.

| Hook | Class | Blocks |
| --- | --- | --- |
| `HOOK-canonical-root` | **Hard gate** | The whole session |
| `HOOK-hydrate` | **Hard gate** | The whole session |
| `HOOK-initiative-resolved` | **Hard gate** | Any durable write |
| `HOOK-phase-entry` | **Hard gate** | The phase transition |
| `HOOK-stale-context` | Advisory (hard for *superseded*) | Destructive and outward-facing acts only |
| `HOOK-assumption-capture` | **Hard gate** | The artifact that depends on the answer |
| `HOOK-decision-capture` | **Hard gate** | Exit from SOLUTION_CONVERGENCE |
| `HOOK-identifier-integrity` | **Hard gate** | The checkpoint |
| `HOOK-traceability` | **Hard gate** | `converged: true`, and handoff |
| `HOOK-design-coverage` | **Hard gate** | A `DES-` leaving `draft`, and DECOMPOSITION exit |
| `HOOK-dependency-graph` | **Hard gate** | DECOMPOSITION exit, and manifest compilation |
| `HOOK-readiness` | **Hard gate** | ENGINEERING_READY entry |
| `HOOK-handoff-conformance` | **Hard gate** | HANDOFF |
| `HOOK-manifest-conformance` | **Hard gate** | Handoff completion |
| `HOOK-fanout-eligibility` | Advisory to the lifecycle; **hard for dispatch** | Dispatch of the ineligible unit only |
| `HOOK-checkpoint` | **Hard gate** | The session being recorded as progress |

`HOOK-stale-context` and `HOOK-fanout-eligibility` are the two deliberate
non-gates, and each is non-blocking for a reason worth stating:

- **Staleness is not falsity.** A mirror past its freshness window is still the
  best available account of an external system; refusing to read it would stop
  every session whose tracker sync is a day old. What it may not do is authorise
  a destructive or outward-facing act ([`context-assembly.md`](context-assembly.md)
  §4.2) — and *that* half is hard. Use of a `superseded` artifact as context is a
  different thing entirely and is always a hard failure.
- **Ineligibility is not a defect.** A unit whose dependency is unfinished is
  behaving correctly. `HOOK-fanout-eligibility` blocks that unit's dispatch and
  nothing else; its siblings continue ([`delivery-fanout.md`](delivery-fanout.md)
  §6.6).

---

## 3. The hook register

Each entry states the twelve required fields. Where a field would restate a rule
specified elsewhere, it cites the rule id instead — the citation is the contract.

---

### 3.1 `HOOK-canonical-root`

| Field | Contract |
| --- | --- |
| **When it executes** | Before any other read, as the first step of hydration. |
| **Triggering event** | Session start, for every role. |
| **Inputs** | The declared repository root; the invoking role. |
| **Deterministic checks** | `HY1` Exactly one canonical root is resolved: `<declared-root>/product/manifest.yaml` exists and parses. `HY2` The resolved root is recorded in the packet as `repository.root` and is the root every write in this session is checked against (`CP1`). A workspace containing several `product/` trees is resolved by the **declared root**, never by proximity to the working directory — the workspace directory itself is not a repository ([`adoption-notes.md`](adoption-notes.md)). Zero roots ⇒ `readiness: uninitialized`. More than one candidate with no declared root ⇒ `readiness: uninitialized` and a `Q-`; never pick one. `D9` rung existence is evaluated from this manifest and no other. |
| **LLM-judgement checks** | None. |
| **Pass behaviour** | Hydration proceeds from the resolved root. |
| **Failure behaviour** | `readiness: uninitialized`. The session stops before reading anything else. No artifact is created in an unrecognised tree ([`context-assembly.md`](context-assembly.md) §9). |
| **Blocks progression** | **Yes** — the whole session. |
| **Reads** | `manifest.yaml`. |
| **Updates** | Nothing durable. A `Q-` on an ambiguous root. |
| **Owner** | `ROLE-product-architect` owns the rule; every role executes it. |
| **Enforced by** | `SKILL-hydrate-product-context` (`HY1`, `HY2`). |

---

### 3.2 `HOOK-hydrate`

| Field | Contract |
| --- | --- |
| **When it executes** | Immediately after `HOOK-canonical-root`, as the first act of every session. |
| **Triggering event** | Session start — including, and especially, a session that appears to continue earlier work. |
| **Inputs** | Repository root; the raw request and/or an `INIT-nnnn`; the invoking role. |
| **Deterministic checks** | `D1`–`D14`; packet invariants `P1`–`P7`, in particular `P5` (no content the assembler wrote) and `P7` (same `head_commit` + same inputs ⇒ same scope, digest, and band membership). Only rungs that exist are read (`I2`). Every element carries a path and an id (`I1`). |
| **LLM-judgement checks** | None at this hook. Entity resolution is `HOOK-initiative-resolved`. |
| **Pass behaviour** | A Working Context Packet with `readiness ∈ {ready, degraded}` and a `context_digest`. The digest is what a later checkpoint records. |
| **Failure behaviour** | `uninitialized` stops the session. `blocked` and `degraded` permit reading and analysis and forbid any phase advance. Structural defects become `Q-` records rather than repairs. |
| **Blocks progression** | **Yes.** A session that skips this hook has, from the next session's perspective, hallucinated its context. Re-running it is always correct; trusting a delegate's summary of the tree never is. |
| **Reads** | `manifest.yaml`; every collection index; `project/*`; the initiative; both state files; banded artifacts. |
| **Updates** | Nothing durable except a `Q-` per defect. The packet is never written under `product/`. |
| **Owner** | Every role. |
| **Enforced by** | `SKILL-hydrate-product-context` ([`skill-library.md`](skill-library.md) §3.1). |

---

### 3.3 `HOOK-initiative-resolved`

| Field | Contract |
| --- | --- |
| **When it executes** | After hydration, before the session's **first durable write**. |
| **Triggering event** | A session that will write anything, or a raw request with no resolved initiative. |
| **Inputs** | The packet with its `neighbouring` band read **in full**; the raw request; the requester's identity. |
| **Deterministic checks** | `T1` The INTAKE verdict is a member of the closed set `{new-initiative, duplicate-of INIT-nnnn, satisfied-by CAP-nnnn, settled-by PD-nnnn, forbidden-by <constraint>, portfolio-scale}`. `T2` A verdict other than `new-initiative` writes no requirement and no decision. `T4` No identifiable requester ⇒ `blocker` `Q-`. `T5` An ask naming no outcome is `portfolio-scale`, escalated, never silently narrowed. `T7` A session that consumed user input may not end without a durable `INIT-` and `product/state.md`. `CP5` No initiative-scoped artifact is written in a session whose packet resolved no initiative. Candidate generation is the deterministic ladder of [`context-assembly.md`](context-assembly.md) §2.2 steps 1–3. |
| **LLM-judgement checks** | Selecting at most one initiative from the bounded candidate list (§2.2 step 4), citing the matched tokens. Two `active` candidates tied on score are **not** disambiguated by judgement — both go to `ambiguities` at `confidence: low` (§2.2 step 5). |
| **Pass behaviour** | Scope carries exactly one `INIT-nnnn`, or the explicit, recorded verdict that no initiative is warranted. |
| **Failure behaviour** | Unresolved ⇒ the session may read and report, and may not write an initiative-scoped artifact. An ambiguous resolution is escalated, never guessed: writing work into the wrong initiative is silent and expensive to find. |
| **Blocks progression** | **Yes** — for any durable write. |
| **Reads** | Packet; `initiatives/index.md`; `capabilities/index.md`; `decisions/index.md`; `questions/index.md`; `project/constraints.md`, `principles.md`. |
| **Updates** | `initiative` (draft), `product-state`, `question`, index rows, counters — on `new-initiative` only. |
| **Owner** | `ROLE-product-manager`. Not delegable. |
| **Enforced by** | `SKILL-triage-product-request` (`T1`–`T8`); `SKILL-hydrate-product-context` (scope resolution); `SKILL-checkpoint-product-state` (`CP5`). |

---

### 3.4 `HOOK-phase-entry`

| Field | Contract |
| --- | --- |
| **When it executes** | At every phase boundary, **before** `phase` is written — on the target phase's preconditions, not only the current phase's exit criteria. |
| **Triggering event** | Any forward transition or regression in the product phase machine. |
| **Inputs** | The packet; `product/state.md`; the initiative; the target phase; §3.4.1. |
| **Deterministic checks** | `A9` Every artifact in the §3.4.1 row for the target phase exists on disk, in the stated form. `A1` The current phase is read from `product/state.md`, never from conversation. `A2` An open `blocker` question forbids exit. `A3` Exit criteria are evaluated against artifacts, not impressions. `A4` No phase is skipped — a satisfied phase is entered, recorded as satisfied with its evidence, and exited: two log rows, never zero. `A5`/`A6` A regression names what it invalidates; a **pre-freeze** artifact it invalidates is edited in place (verdict voided in the same write, as already stated), a **post-freeze** artifact is superseded. `A10` The phase-log row records which hooks were evaluated for this transition and what each returned. |
| **LLM-judgement checks** | None. Whether an *artifact's content* is good enough is other hooks' business; this hook asks only whether it exists in the required form. |
| **Pass behaviour** | `phase`, `phase_entered`, a phase-log row with date, from, to, role, trigger, outcome, `context_digest`, and the `A10` hook results; `next_action` naming one action and one role. |
| **Failure behaviour** | No transition. The missing upstream artifact is written into `next_action` naming the role that owes it. A failed or interrupted session **never** transitions (`A7`). |
| **Blocks progression** | **Yes.** This is the mechanism by which progression is refused, and the enforcement point for guardrail `G5`. |
| **Reads** | `product-state`; `initiative`; `requirement`; `question`; `technical-assessment`; `design`; `decision`; the packet. |
| **Updates** | `product-state` (`phase`, phase log, `next_action`, `blocked_by`, `readiness_verdict`). Never `delivery/state.md` (`A8`). |
| **Owner** | `ROLE-product-manager`. |
| **Enforced by** | `SKILL-advance-product-phase` (`A1`–`A10`). |

#### 3.4.1 Phase-entry preconditions

Deterministic. Each row is the **entry** condition for its phase, expressed as
artifacts that must already exist. It is the same evidence the previous phase's
exit criteria produce, checked from the receiving side — which is what makes a
skipped or half-finished phase detectable by the session that inherits it rather
than only by the session that left it.

| Entering | Required on disk before entry |
| --- | --- |
| `BOOTSTRAP` | Nothing. It is the hydration phase. |
| `INTAKE` | A packet at `readiness ∈ {ready, degraded}` with its `neighbouring` band read in full. |
| `DISCOVERY` | `initiative.md` at `status: draft`; `product/state.md` at `phase: INTAKE` carrying requester, problem statement, and an `Ambiguity log` in which every row is classified `pm-resolvable` or `escalation`. |
| `PRODUCT_DEFINITION` | A `## Discovery` section carrying target users, jobs/problems with a source per claim (`S1`), a current-state `CAP-` mapping or the literal `none` (`S2`), success signals (`S3`), and known non-goals. |
| `SOLUTION_EXPLORATION` | A populated `initiative.md` with an outcome statement and a **non-empty** out-of-scope section (`F1`); ≥1 `status: draft` `REQ-`; a draft-mode coverage run with no `R1` defect (`F2`). |
| `SOLUTION_CONVERGENCE` | A `## Options` table with ≥2 distinguishable options — or a recorded justification that the single option is a decision already made (`X1`) — each carrying a feasibility verdict from `{feasible, feasible-with-constraints, infeasible}` (`X2`), and one `Consultation log` row per delegate response. |
| `DECOMPOSITION` | Exactly one `status: accepted` chosen-option `PD-`, citing a non-`infeasible` feasibility verdict. |
| `READINESS` | `converged: true`; `HOOK-traceability` returning zero defects; a `coherence.md` verdict that is not `regression-required`, whose round is the terminal round for that story set (`ROLE-product-manager` agent spec §9a.1) and every blocking finding of which carries a recorded disposition — `fixed`, `carried-accepted`, or an open `Q-` (§9a.2); a `DES-` at `accepted` for every user-facing story with its `local_export` on disk. |
| `ENGINEERING_READY` | `readiness_verdict: READY` or `READY-with-known-issues`, not `void`, whose story-set digest matches the set on disk. |
| `HANDOFF` | A `## Handoff packet` with every bullet populated or carrying its explicit empty form (`H7`); `delivery/manifest.md` at `band_owner: product` issued against the same verdict and digest (`H12`). |

A regression enters its target phase under the **same** row. A phase re-entered
without its preconditions is a phase whose upstream work was silently discarded.

**Coherence currency at `READINESS` entry is a disposition test, never a date
comparison**. A story edit dated after the coherence verdict does
**not** bar entry: §9a.2 prescribes exactly that — one repair pass on the
terminal round's blocking findings, with no re-review of the fix — and a
`DECOMPOSITION` design pass or question disposition landing after the terminal
round produces the same shape. Requiring the verdict to post-date the last story
edit would demand the round 3 that §9a.1 forbids absolutely, and would make the
only enterable set the one whose terminal round was clean, which §9a.3 says must
never be a phase-exit requirement.

Whether a verdict still *describes* the set on disk is the readiness reviewer's
`R9` verdict-correctness test — judged, quoted, and consequential as a readiness
finding, not as a blocked transition. This is the same routing a pre-freeze edit already
gets (any coherence verdict older than the edit is stale per `R9`), and it is why the check does not belong in this
hook: `HOOK-phase-entry` has no LLM-judgement checks, and "is this edit within
the scope of the repairs the verdict prescribed" is irreducibly one. What
protects a late-edited set mechanically is `HOOK-traceability`: the deterministic
coverage validator is not an LLM review, must reach zero defects against the
current set, and `SKILL-review-product-readiness` refuses any dispatch whose
validator digest does not match that set.

---

### 3.5 `HOOK-stale-context`

| Field | Contract |
| --- | --- |
| **When it executes** | During hydration, per source; and again immediately before any destructive or outward-facing act. |
| **Triggering event** | A mirror of an external system entering the packet; a `superseded` artifact encountered on any read; an act that closes a ticket, ships, or declares work complete. |
| **Inputs** | `synced_on` per mirror; `manifest.yaml:context.freshness_windows`; the `status` and `superseded_by` of every candidate artifact. |
| **Deterministic checks** | `D10` mirror age = today − `synced_on`, compared against the window; a missing `synced_on` is infinitely stale, not fresh, and not an error. `A8` a fresh mirror beats a stale mirror of the same system. `A1` (precedence) archived or `superseded`/`historical`/`rejected`/`withdrawn`/`abandoned` artifacts are never context. `D6` `status: superseded` implies a `superseded_by` that resolves. `D7` chains terminate at depth ≤5 with no cycles. `P3` no such artifact appears in the packet outside `superseded_trail`. |
| **LLM-judgement checks** | None. |
| **Pass behaviour** | Fresh mirrors are used normally. A superseded record is replaced by following `superseded_by`; its **identifier and one-line reason** are retained in `superseded_trail`, never its body. |
| **Failure behaviour** | **Staleness:** the mirror is marked `advisory` with its `synced_on` and age in hours; it may inform planning and may **not** be the basis of a destructive or outward-facing act. Re-sync is a separate, side-effecting decision (`SKILL-sync-tickets`), never automatic. **Supersession:** using a superseded artifact as authority is a hard failure of guardrail `G4`; a chain exceeding depth 5 or containing a cycle stops at the last non-repeating record and emits a packet `defect`. |
| **Blocks progression** | **Advisory for staleness; hard for `G4`.** The split is deliberate — see §2. |
| **Reads** | Every candidate artifact; `delivery/tickets.md`; `delivery/board.md`; `design/index.md`; `manifest.yaml`. |
| **Updates** | Packet `advisory` band, `superseded_trail`, `defects`. Nothing durable except a `Q-` on a broken chain. |
| **Owner** | Every role. `ROLE-orchestrator` owns re-sync. |
| **Enforced by** | `SKILL-hydrate-product-context` (`D6`, `D7`, `D10`, `A1`, `A8`, `P3`); `SKILL-supersede-artifact` (`D6`, `D7`) on the writing side; `SKILL-sync-tickets` for repair. |

---

### 3.6 `HOOK-assumption-capture`

| Field | Contract |
| --- | --- |
| **When it executes** | The moment an ambiguity is classified escalation-class — **before** any artifact that depends on its answer is written. Again at checkpoint, as a sweep. |
| **Triggering event** | A question a reasonable person could answer more than one way, whose answers produce observably different products. |
| **Inputs** | The ambiguity as stated; the phase; the named human who owns the answer; what does and does not depend on it. |
| **Deterministic checks** | `E1` `severity ∈ {blocker, important, minor}`. `E2` For an escalation-class question the default-if-unanswered is always *"work stops here"* — no other default is legal. `E3` A `blocker` appears in `blocked_by` and forbids the phase from exiting; independent work continues. `E4` ≤5 questions per batch per phase. `E5` No answer is inferred from silence or fabricated. `E6` Every question carries options **and** a recommendation **and** a default. `E7` Re-asking a settled question is a defect — write the missing `PD-` instead. `E8` The `Q-` is durable, indexed, and referenced from `product/state.md` before the session ends. `E9` An escalation-class ambiguity may be worked around only by an accepted `PD-` naming the question, the answer, and its source. `T6` Every ambiguity is classified in the same write that records it. `CP4` At checkpoint, every `Ambiguity log` row classified `escalation` resolves to a `Q-` or an accepted `PD-`. |
| **LLM-judgement checks** | The **materiality test** only: escalate when (1) a reasonable person could decide it more than one way *and* (2) the resulting products differ observably — behaviour, data, what a user may do or learn. Borderline calls resolve **toward escalating** when the decision touches permissions, money, data loss, or irreversibility. Whether an ambiguity is `blocker` or merely `important` is likewise judged. |
| **Pass behaviour** | One `Q-` per decision, never bundled, with `severity`, `raised_by_role`, `raised_on`, the frozen question text, 2–4 concrete options with consequences, a recommendation, and a default; an `Escalation log` row; `blocked_by` updated on the initiative and in `product/state.md`. |
| **Failure behaviour** | The artifact that depends on the answer is not written. The PM does not choose a plausible answer and move on — that is precisely the failure this hook exists to make impossible. `CP4` failing stops the checkpoint's completion claim and names the unrecorded ambiguity in `next_action`. |
| **Blocks progression** | **Yes** — a `blocker` question holds its phase by design; independent work continues. |
| **Reads** | `question`; `questions/index.md`; `product-state`; `initiative`; `decision`; `project-context`. |
| **Updates** | `question`; `product-state` (Ambiguity log, Escalation log, `blocked_by`, `next_action`); `initiative` (`blocked_by`); `decision` on promotion. |
| **Owner** | `ROLE-product-manager`; any role may raise a `Q-` rather than guess. `ROLE-product-designer` raises the materiality-tested form. |
| **Enforced by** | `SKILL-escalate-product-question` (`E1`–`E9`); `SKILL-design-decision-escalation` (designer form); `SKILL-triage-product-request` (`T6`); `SKILL-checkpoint-product-state` (`CP4`). |

---

### 3.7 `HOOK-decision-capture`

| Field | Contract |
| --- | --- |
| **When it executes** | At SOLUTION_CONVERGENCE, mandatorily; and at any point a §4.2-class question is settled, a scope boundary is fixed, or a constraint permanently narrows the product's options. |
| **Triggering event** | A choice being made that a future session could otherwise re-litigate. |
| **Inputs** | The choice; the pressure that forced it; the options considered with the reason each was rejected; the consequences accepted; the predecessor decision, if any. |
| **Deterministic checks** | `R1` `status: accepted` and an index row in the same commit as the file. `R2` A superseding decision sets `supersedes`; the predecessor gets `status: superseded` + `superseded_by` and **stays in `decisions/`**. `R3` The rejected-options section is non-empty whenever more than one option existed. `R4` An accepted `PD-` body is never rewritten. `R5` Supersession chains terminate at depth ≤5 (`D7`). `R6` A `PD-` working around an escalation-class ambiguity names the question, the answer, and who supplied it. `D11` allocation integrity. Exit from SOLUTION_CONVERGENCE requires **exactly one** accepted chosen-option `PD-` citing a non-`infeasible` verdict. |
| **LLM-judgement checks** | Writing the prose of the context and consequences. The *choice* may be judged; its **recording** may not be skipped. |
| **Pass behaviour** | A `PD-nnnn` with context first, options with rejection reasons, consequences costs-first, `affects`, `decided_on`, an index row, a counter bump, and `supersedes`/`superseded_by` wired both ways where it overturns a predecessor. |
| **Failure behaviour** | SOLUTION_CONVERGENCE does not exit. A decision taken but unrecorded is indistinguishable, to the next session, from a decision never taken — and the argument is re-run at the worst possible moment. |
| **Blocks progression** | **Yes** at convergence exit. The skill itself blocks nothing; **its absence does.** |
| **Reads** | Packet; `decision`; `decisions/index.md`; `initiative`; `product-state`; `project-context`. |
| **Updates** | `decision`; `decisions/index.md`; `manifest.yaml` counter; `product-state` cross-reference. |
| **Owner** | `ROLE-product-manager` — the only role that may accept a `PD-`. |
| **Enforced by** | `SKILL-record-decision` (`R1`–`R6`); `SKILL-advance-product-phase` (§3.4.1 DECOMPOSITION row). |

---

### 3.8 `HOOK-identifier-integrity`

| Field | Contract |
| --- | --- |
| **When it executes** | At every artifact creation, and again as a sweep at checkpoint. |
| **Triggering event** | Any allocation of an `AREA-`, `CAP-`, `PD-`, `INIT-`, `REQ-`, `DES-`, or `Q-` identifier; any session close. |
| **Inputs** | The artifact type; the slug; `manifest.yaml:id_counters`; the collection index. |
| **Deterministic checks** | `D11` new id = counter + 1, zero-padded to four digits, with the artifact, the counter bump, and the index row **in one commit**. `D2` `id` matches the filename identifier and the index row. `D3` every index row's path resolves. `D4` every artifact file in a collection has an index row. `D8` every identifier referenced in frontmatter appears in some index. `D18` checkpoint completeness. `R2` identifier stability — no post-acceptance renumbering. `R12` referential integrity — every referenced identifier resolves through its index, and file, `id`, frontmatter, and index row agree. Identifiers are never reused; a concurrent-allocation conflict renumbers the **later-merged** artifact. |
| **LLM-judgement checks** | None. |
| **Pass behaviour** | The identifier, the artifact from its template, the incremented counter, and the index row — all present together. |
| **Failure behaviour** | **The checkpoint stops.** `D11` and `D18` are the two checks whose failure writes a *corrupt* memory rather than an incomplete one: an unindexed artifact is invisible to every future session, which is the same as not having written it, except that it will later contradict something. A `D2`/`D3`/`D4`/`R12` failure found on a read is a structural finding routed to `ROLE-product-architect` for repair **before any phase advance**. |
| **Blocks progression** | **Yes** — it blocks the checkpoint, and a structural finding blocks every phase advance. |
| **Reads** | `manifest.yaml`; the collection index; the template; the artifact. |
| **Updates** | The new artifact; `manifest.yaml`; the collection index. |
| **Owner** | Any writing role. `ROLE-product-architect` owns repair. |
| **Enforced by** | `SKILL-allocate-identifier` (`D11`, `D2`); `SKILL-checkpoint-product-state` (`D18`); `SKILL-validate-requirement-coverage` (`R2`, `R12`). |

---

### 3.9 `HOOK-traceability`

| Field | Contract |
| --- | --- |
| **When it executes** | Four moments, run by the PM alone: before `converged: true` is written; before every dispatch of `HOOK-readiness`, to a zero-defect result, as its dispatch precondition; before the handoff; and after any regression or pre-freeze edit touching an accepted story. Runnable in *draft mode* during PRODUCT_DEFINITION, where `R5` and the all-`accepted` condition are relaxed. There is no review mode — `ROLE-product-readiness-reviewer` never invokes this hook itself; it consumes the PM's zero-defect full-mode report as a required input. |
| **Triggering event** | Any of those four; or any story-set edit. |
| **Inputs** | `INIT-nnnn`; the initiative's outcome elements; the story set with statuses; the collection indexes; the open-question list with severities. |
| **Deterministic checks** | `R1` coverage **or explicit disposition** (`deferred \| out-of-scope \| superseded \| covered-by-existing-CAP`, with a reason). `R3` upward traceability to an outcome element and a `CAP-`. `R5` ≥1 acceptance entry with an observable trigger and result, plus a `composition:` entry on any `REQ-` with non-empty `design_refs`. `R10` no `accepted` `REQ-` depending on a non-`accepted` `REQ-`, an open `Q-`, or a non-`accepted` `PD-`, subject to the bounded post-freeze supersession exemption stated in `skill-library.md` §3.9.2. `R11` out-of-scope section non-empty and uncontradicted. `R12` referential integrity. `R2` identifier stability. Every rule records a result, **including passes**; one defect entry names exactly one rule and exactly one artifact. |
| **LLM-judgement checks** | Only whether two artifacts are *about the same subject*, which is the precondition for a disposition — the disposition's validity is then mechanical. A model may write prose about a defect; it may not decide whether the defect exists. |
| **Pass behaviour** | A traceability map — outcome element ↔ `REQ-` ↔ `CAP-` ↔ `DES-` ↔ `PD-` ↔ `Q-` (and tickets where they exist) — with an empty defect list. Session-local; its summary refreshes the `Stories` table. |
| **Failure behaviour** | A non-empty defect list blocks `converged: true`, blocks dispatch of `HOOK-readiness`, and blocks handoff — the PM loops full mode until it reaches zero-defect, an uncapped, non-LLM loop that never counts against the readiness review's dispatch budget. |
| **Blocks progression** | **Yes.** |
| **Reads** | `initiative`; `requirement`; `design`; `decision`; `capability`; `question`; `product-state`; every relevant index; `project/constraints.md`. |
| **Updates** | `product-state` (`Stories` refresh) in full mode; nothing in draft mode. |
| **Owner** | `ROLE-product-manager`, sole executor — `ROLE-product-readiness-reviewer` never invokes it. |
| **Enforced by** | `SKILL-validate-requirement-coverage` (`R1`–`R12`). |

---

### 3.10 `HOOK-design-coverage`

| Field | Contract |
| --- | --- |
| **When it executes** | Before any `DES-` leaves `draft`; re-run after every design change; again at DECOMPOSITION exit and inside the readiness review. |
| **Triggering event** | A design being packaged; a design changing; a user-facing story being accepted. |
| **Inputs** | `journeys.md`, `flows.md`, `states.md`; the `REQ-` records; the initiative's out-of-scope section; the design export. |
| **Deterministic checks** | **Forward coverage** — every user-facing `REQ-` reaches ≥1 designed surface, or carries a recorded reason it has none. **Reverse coverage** — every designed surface traces to ≥1 `REQ-`; this is the check that catches an invented product rule. **Exclusion coverage** — nothing in the design contradicts the out-of-scope section. **State completeness** — every row of the fixed state matrix answered, or `n/a` **with a stated reason**. `R4` design traceability **in both directions**, every `DES-`'s `local_export` existing on disk. `K3` a user-facing story requires a `DES-` whose `local_export` path exists — a link is never a deliverable. **Durable identity** — a reference that cannot be resolved back to the exact revision that was exported is transient and is rejected. |
| **LLM-judgement checks** | `R15` (requirements and designs agree) and `R16` (no product behaviour existing only implicitly in a design) at readiness. The audit's own findings are deterministic; a model writes their prose. |
| **Pass behaviour** | `audit.md` whose first line is `Verdict: clean`, followed by `DES-` records with committed exports, index rows, and a counter bump. |
| **Failure behaviour** | On any verdict but `clean`, no `DES-` leaves `draft` and DECOMPOSITION does not complete. A design change re-opens the audit: a design is never packaged on a stale audit. An untraceable surface is either undocumented product behaviour — escalate via `HOOK-assumption-capture` — or scope creep, deleted. |
| **Blocks progression** | **Yes.** |
| **Reads** | `design`; `requirement`; `initiative`; `decision`; `capability`. |
| **Updates** | `design` (`audit.md`, `DES-` records, `assets/`); `design/index.md`; the `design` counter. |
| **Owner** | `ROLE-product-designer`. |
| **Enforced by** | `SKILL-design-requirement-audit`; `SKILL-capture-design`; `SKILL-experience-state-enumeration` (the matrix); `SKILL-validate-requirement-coverage` (`R4`). |

---

### 3.11 `HOOK-dependency-graph`

| Field | Contract |
| --- | --- |
| **When it executes** | At DECOMPOSITION, before READINESS; again at manifest compilation; again at every fanout frontier recompute. |
| **Triggering event** | A story set reaching acceptance; any story-set change; a manifest being compiled or re-issued. |
| **Inputs** | The accepted `REQ-` set with `depends_on` and `## Sequencing`; `assessment.md` (the authorising round) and `impact.md`; the chosen-option `PD-`; at manifest scope, the §5.3 story table and §6.2 unit projection. |
| **Deterministic checks** | `R6` explicit `depends_on` — the literal `[none]` when empty, **never blank** — every dependency resolving. `R7` every dependency restated as a sequencing note, graph **acyclic**. `R10` no accepted story depending on an unresolved upstream — a `superseded` upstream whose chain terminates `accepted` is not unresolved once the depending story is frozen. `K7` a hidden ordering assumption is a defect, not an omission. `D3` (manifest) `Depends on` copies `depends_on` verbatim; only `REQ-` entries are ordering edges. `D4` (manifest) every edge is restated in §5.4 — a graph nobody rendered is a graph nobody checked. `D5`/`M1` both the story graph and the unit graph are acyclic. `D6` (manifest) `Wave (planned)` is the longest path from any root, **derived and never authored**. |
| **LLM-judgement checks** | The architect's coherence verdict has one judged input — whether a story's criteria require a capability the scan recorded `absent` or `partial`. The verdict itself is mechanical: `coherent` = zero open defects; `defects-open` = resolvable by rewriting or resequencing; `regression-required` = the chosen option's feasibility verdict is invalidated. |
| **Pass behaviour** | `coherence.md` at `Verdict: coherent`; a manifest whose §5.4 ordering constraints are the rendered form of §5.3's edges. |
| **Failure behaviour** | A cycle is never broken by guessing an order — it is a `blocker` `Q-` (`P5`). `defects-open` holds DECOMPOSITION. `regression-required` forces a regression to SOLUTION_EXPLORATION. |
| **Blocks progression** | **Yes** — DECOMPOSITION exit, manifest compilation, and, at `P5`, all dispatch. |
| **Reads** | `requirement`; `initiative`; `decision`; `technical-assessment`; `delivery-manifest`. |
| **Updates** | `technical-assessment` (`coherence.md`); `product-state` (`## Sequencing` notes via the story set); the manifest's §5.4. |
| **Owner** | `ROLE-planner` (PRODUCT-DISCOVERY mode) for coherence; `ROLE-product-manager` for the stories and the product band; `ROLE-orchestrator` for the unit graph. |
| **Enforced by** | `SKILL-story-set-technical-coherence`; `SKILL-validate-requirement-coverage` (`R6`, `R7`, `R10`); `SKILL-compile-delivery-manifest` (`D3`–`D6`); `SKILL-batch-fanout` (`B1`/`P5`). |

---

### 3.12 `HOOK-readiness`

| Field | Contract |
| --- | --- |
| **When it executes** | At phase READINESS, after `converged: true` and never before it, and only once `HOOK-traceability` has reached a zero-defect result as its dispatch precondition. Re-run after any story edit, which voids the prior verdict by digest. |
| **Triggering event** | The product manager declaring convergence, and completing the `HOOK-traceability` precondition. |
| **Inputs** | `INIT-nnnn`; the declared-converged story set; the initiative with its out-of-scope section; `DES-` records and their `local_export` paths; decisions in force; open questions with severities; the architect's `technical-assessment` files; `project/constraints.md`; the claimed `CAP-` records; the zero-defect `HOOK-traceability` report (`R1`–`R12`), digest-matched, as a required input. **Artifacts only** — a missing required input is a finding, not a reason to review on less. |
| **Deterministic checks** | `W1` the story-set digest — the ordered `(REQ- id, revision, updated)` triples plus the initiative `revision` — is unchanged since `converged: true`; a set that changed mid-review is returned **unreviewed**, not `NOT READY`. `W2` `R1`–`R12` are already decided, by `HOOK-traceability` in full mode, before this hook is ever dispatched — this hook never executes them. `W3` a result is recorded for every criterion `R13`–`R18` plus the flag-only `R8`/`R9`; an unevaluated criterion is not a pass. `W4` every judged finding quotes the artifact text it concerns. `W5` the reviewer writes nothing outside `product-state` (`Readiness log`, `Readiness findings`) and `question`. `W6` `NOT READY` always carries a findings block. `W7` every finding is routed by the §3.9.1 table of [`skill-library.md`](skill-library.md) — class determines phase and role. `W8` no `R1`–`R12` defect can reach this hook at all — `HOOK-traceability` blocks its own dispatch precondition on zero-defect. `W9` rounds are appended with an incrementing `Round`; a prior row is never edited or withdrawn. `W10` the review-termination law's 2-round absolute cap (`product-manager-orchestrator.md` §9a): round 2 is fix-verification only, forbidden to open a new finding except a late-discovery known issue, and closes `READY`/`READY-with-known-issues` unless a round-1 blocking finding remains unfixed, in which case it closes `NOT READY` and raises a `Q-` to the named human. There is no round 3. |
| **LLM-judgement checks** | `R13` acceptance criteria genuinely testable; `R14` bounded product scope; `R15` requirements and designs agree; `R16` no product behaviour existing only implicitly in a design; `R17` no product decision delegated to an implementing agent; `R18` self-containment — plus the flag-only `R8` (contradiction) and `R9` (verdict correctness) clauses. Each must quote the artifact text it concerns (`W4`). |
| **Pass behaviour** | Exactly one verdict ∈ `{READY, READY-with-known-issues, NOT READY}` — three values, no other qualified form — as one `Readiness log` row with `Date \| Round \| Verdict \| Conditions \| Reviewer \| Story-set digest \| Findings \| Finding ids`, and `readiness_verdict` frontmatter set to match. Conditions and known issues are a **separate column**, not a verdict. |
| **Failure behaviour** | `NOT READY` forces the regression in `product-manager-orchestrator.md` §13, to the **earliest** phase its findings route to. An unavailable reviewer leaves the gate **shut** and the initiative `blocked` — never waved through. The verdict is **void** — not `NOT READY` — if any digest entry changes, the initiative regresses, or a `blocker` `Q-` is raised against the set after the verdict date; a void verdict is the absence of a verdict, and READINESS runs again. |
| **Blocks progression** | **Yes.** This is the gate. It is a two-key gate: the reviewer must never be the same executor instance as the product manager in the same session — a self-review is no review. |
| **Reads** | `initiative`; `requirement`; `design`; `decision`; `capability`; `question`; `product-state`; `technical-assessment`; `project-context`; every relevant index. |
| **Updates** | `product-state` (`Readiness log`, `Readiness findings` only); `question`. It never fixes what it finds and never changes the phase. |
| **Owner** | `ROLE-product-readiness-reviewer`. |
| **Enforced by** | `SKILL-review-product-readiness` (`W1`–`W10`, `R1`–`R18`). |

---

### 3.13 `HOOK-handoff-conformance`

| Field | Contract |
| --- | --- |
| **When it executes** | At phase ENGINEERING_READY, carrying through HANDOFF in the same session. |
| **Triggering event** | A recorded, non-void `READY` or `READY-with-known-issues` verdict. |
| **Inputs** | The verdict; the accepted story set; design exports; decisions in force; binding technical constraints; the open-question list. |
| **Deterministic checks** | `H0`/`C3` every named story satisfies the sixteen elements of the canonical story schema, with every empty form written explicitly rather than omitted. `H1`/`C1` `readiness_verdict` is `READY` or `READY-with-known-issues`, and not `void`. `H2`/`C2` `HOOK-traceability` returns zero defects. `H3` every story is `accepted`. `H4`/`C4` the digest still matches. `H5`/`C5` no `blocker` `Q-` is open. `H6`/`C6` every referenced identifier resolves and every `local_export` exists on disk. `H7`/`C7` every packet bullet is populated or carries its explicit empty form. `H8`/`C8` every condition on the verdict is a non-`blocker` `Q-` or `PD-`. `H9` the PM never writes `delivery/state.md` and never waits for it. `H13`/`C12` every accepted story resolves to a real tracker key created in Ariadne, so what leaves HANDOFF is `ticket_code`s. `H10` each story in the digest gets `readiness: engineering-ready`. `H11`/`C10` no product-side artifact carries an HLD, an execution plan, a task breakdown, or an estimate. `H12`/`C11` the delivery manifest exists against this same verdict and digest. |
| **LLM-judgement checks** | None. Every check is a comparison two independent implementations return the same result on. |
| **Pass behaviour** | The `## Handoff packet` section; the initiative at `status: active`; a `Handoff log` row naming the receiving role and date; `phase: HANDOFF` with `next_action: "ROLE-orchestrator: SKILL-resume-initiative"`. |
| **Failure behaviour** | **A non-conforming handoff is not a degraded handoff.** The gate stays shut and the initiative waits as `blocked`. `H4` specifically forces a regression to READINESS rather than a reconciliation. |
| **Blocks progression** | **Yes.** |
| **Reads** | `product-state`; `initiative`; `requirement`; `design`; `decision`; `question`; all relevant indexes. |
| **Updates** | `product-state` (Handoff packet, Handoff log, phase); `initiative` (`status: active`); `requirement` (`readiness` only); `delivery-manifest` (product band, via `HOOK-manifest-conformance`). |
| **Owner** | `ROLE-product-manager`. Not delegable. |
| **Enforced by** | `SKILL-prepare-engineering-handoff` (`H0`–`H12`); the receiving half is `SKILL-resume-initiative`, which refuses to begin delivery on an initiative not at `phase: HANDOFF`. |

---

### 3.14 `HOOK-manifest-conformance`

| Field | Contract |
| --- | --- |
| **When it executes** | At ENGINEERING_READY, immediately after the handoff packet is written; again on acceptance by the orchestrator; again on any re-issue. |
| **Triggering event** | A packet written against a non-void `READY` or `READY-with-known-issues` verdict; a story superseded after issue. |
| **Inputs** | `INIT-nnnn`; the `## Handoff packet`; the accepted `REQ-` records with `depends_on`, `readiness`, and `## Sequencing`; the verdict and its digest; the `CAP-`/`DES-`/`PD-` references the packet lists. |
| **Deterministic checks** | `D1` preconditions — `phase` is ENGINEERING_READY or HANDOFF, the verdict is `READY` or `READY-with-known-issues` and not `void`, every named story is `accepted` and `engineering-ready`. `D2` `story_set_digest` equals the digest the verdict was issued against. `D7` the execution band (§5.5–§5.8) is left empty at compilation — writing one row there is out of authority. `D8` no ticket key, no ticket row, no ticket dependency graph, and no `delivery/state.md`. `D9` `readiness` is **copied, never derived** — the manifest makes no readiness judgement. `D10` `id: DM-INIT-nnnn` allocates no counter. `D12` a manifest already at `band_owner: delivery` is not rewritten; the schema's §8 re-issue procedure applies. Invariants `M1`–`M8`, including `M7` (no HLD, plan, breakdown, or estimate) and `M8` (the product band byte-identical to its issued form while `band_owner: delivery`). `F2` `band_owner` transfers exactly once, in the same write that creates `delivery/state.md`. |
| **LLM-judgement checks** | None. The manifest carries no fact the packet and the stories do not already state. |
| **Pass behaviour** | `delivery/manifest.md` at `band_owner: product`, `accepted_on: none`, `completion: pending`, `dispatch_unit: ticket`, with §5.1–§5.4 populated and §5.5–§5.8 present as empty headings. |
| **Failure behaviour** | `D1`, `D2`, and `M1` each stop the handoff. `D2` forces a regression to READINESS rather than a reconciliation — a digest mismatch means the set changed under the verdict. `M5` failing after issue **voids** the manifest; dispatch stops and the manifest is re-issued per schema §8, product band replaced at `revision + 1`, execution band preserved, completed units still `complete`. |
| **Blocks progression** | **Yes** — a packet with no conforming manifest is a handoff nothing can schedule. |
| **Reads** | `product-state`; `requirement`; `initiative`; `design`; `decision`; `question`; the requirement and design indexes. |
| **Updates** | `delivery-manifest` — product band only at compilation; execution band only afterwards, and only by `ROLE-orchestrator`. |
| **Owner** | `ROLE-product-manager` at compilation; `ROLE-orchestrator` at initiative scope from acceptance onward. |
| **Enforced by** | `SKILL-compile-delivery-manifest` (`D1`–`D12`); `SKILL-resume-initiative` (`F2`); `SKILL-sync-tickets` (`M6`, repaired **from** `tickets.md`, never the reverse). |

---

### 3.15 `HOOK-fanout-eligibility`

| Field | Contract |
| --- | --- |
| **When it executes** | Before every dispatch, and at every frontier recompute — which is on acceptance and on each unit reaching `complete`. |
| **Triggering event** | An accepted manifest; a freed concurrency slot. |
| **Inputs** | `delivery/manifest.md` at `band_owner: delivery`; the initiative's `delivery/tickets.md`; `max_parallelism`. |
| **Deterministic checks** | Preconditions `P1` manifest exists at `band_owner: delivery`; `P2` `product/state.md` at `phase: HANDOFF`; `P3` §5.5 non-empty and its projection agrees with `tickets.md` (`M6`); `P4` `M5` holds — the digest still matches; `P5` `M1` holds — the unit graph is acyclic. Eligibility is exactly `E1` every story `engineering-ready`; `E2` accepted manifest; `E3` every dependency unit `complete`; `E4` no `blocker` `Q-` naming the unit or a story it carries; `E5` state not already `dispatched`/`complete`/`void`; `E6` in-flight `< max_parallelism`; `E7` no dispatched unit shares a §5.4 mutual-exclusion group. `B3` dependency-freedom is read from the graph only, never from story prose. `B4` waves are a derived grouping, **never a barrier**. `B5` completion requires the dispatched orchestrator's terminal success line **and** the unit's PR(s) merged to the default branch (schema §6.5: merged at SHIP by `release-coordinator` on green checks; verified by a GitHub read, backstop-merged by the fan-out session) — never recorded from memory or narration. `B7` **no automatic retry, ever**. `B9` the execution band only is written. `B10` the manifest is authoritative; a session-local batch file is a mirror, rewritten from it on disagreement. |
| **LLM-judgement checks** | **None, by contract.** `B8` forbids product judgement outright: no readiness assessment, no discovery, no reading of acceptance criteria. `engineering-ready` is a flag it checks, never a conclusion it reaches. A dispatcher forming its own readiness opinion would be a third key on a two-key gate. |
| **Pass behaviour** | One dispatch per eligible unit up to the cap; §5.5 rows updated; one append-only §5.7 ledger row per event. |
| **Failure behaviour** | A unit failing any gate is **never** dispatched "to see what happens"; its state is written down — `not-eligible`, `blocked`, `void`, or `unreachable` — so the next stateless session reaches the same conclusion without re-deriving it. A `P1`–`P5` failure dispatches **nothing at all**. A failure blocks only its own dependents; siblings continue. |
| **Blocks progression** | **Advisory to the lifecycle; hard for the dispatch itself.** It stops dispatching and reports; every judgement that could block the lifecycle belongs to a role upstream of it. |
| **Reads** | `delivery-manifest`; `tickets`. |
| **Updates** | `delivery-manifest` — execution band only. Never the product band, `delivery/state.md`, `delivery/tickets.md`, or any story's product content. |
| **Owner** | `ROLE-orchestrator` at **initiative scope** only. A ticket-scope orchestrator never runs it. |
| **Enforced by** | `SKILL-batch-fanout` (`B1`–`B11`, `P1`–`P5`, `E1`–`E7`). |

---

### 3.16 `HOOK-checkpoint`

| Field | Contract |
| --- | --- |
| **When it executes** | As the **last act of every session, without exception** — including sessions that failed, and including sessions that concluded nothing needed to change. |
| **Triggering event** | Any session boundary. |
| **Inputs** | The artifacts written or intended during the session; the `context_digest` from hydration; the session outcome; the resolved canonical root from `HOOK-canonical-root`. |
| **Deterministic checks** | `D18` checkpoint completeness — every artifact written has an index row and, where applicable, a counter bump. `D11` allocation integrity. `CP1` **canonical location**: every artifact written resolves under the `product/` root recorded by `HY2`. `CP2` **single canonical record**: no two non-`superseded` artifacts of the same type claim the same subject. `CP3` **no session-only state**: every fact `next_action` depends on is on disk. `CP4` every `escalation`-classified ambiguity resolves to a `Q-` or an accepted `PD-`. `CP5` no initiative-scoped artifact was written in a session that resolved no initiative. A role writes only the artifact types listed against it in the `roles:` registry of [`../manifest.yaml`](../manifest.yaml). |
| **LLM-judgement checks** | Whether a discovered fact is **durable product knowledge or session detail**. This is the one genuinely judged step, and it decides only *what* is promoted — never *whether* the promotion is written down. |
| **Pass behaviour** | Every durable change written, indexed, and counter-bumped; the owning state file updated — `product/state.md` for product-side roles, `delivery/state.md` for delivery-side — naming exactly one `next_action` and its `blocked_by`; log rows carrying the `context_digest`. |
| **Failure behaviour** | A `D11` or `D18` failure **stops** the checkpoint: those write a corrupt memory rather than an incomplete one. A `CP1`–`CP5` failure is repaired before the session ends; the session is not recorded as progress until it passes. A failed session still checkpoints — it records what stopped it in `next_action` and does **not** advance the phase. |
| **Blocks progression** | **Yes** — a failed checkpoint stops the session from being recorded as progress at all. This hook is the enforcement point for guardrails `G1`, `G2`, and `G3`. |
| **Reads** | Everything the session touched; the relevant indexes; `manifest.yaml`. |
| **Updates** | Any artifact type the invoking role owns; the matching index rows; `manifest.yaml` counters; the owning state file. |
| **Owner** | Every role. |
| **Enforced by** | `SKILL-checkpoint-product-state` (`D11`, `D18`, `CP1`–`CP5`). |

---

## 4. Guardrails

Five prohibitions. Each is a property of the system that no single hook can
establish on its own, so each names the hooks that enforce it and the check that
decides it.

### 4.1 `G1` — Authoritative product state never exists only in session memory

**The rule.** Nothing a future session needs may live only in a transcript, a
packet, a scratch file, or a working folder. The Working Context Packet is
explicitly non-authoritative and **no later session may read a prior session's
packet** — it is a snapshot of a commit that has moved on.

**Decided by.** `CP3` at `HOOK-checkpoint`, supported by `T7` (a session that
consumed user input may not end without a durable `INIT-` and
`product/state.md`), `E8` (an escalation that exists only in a transcript did not
happen), `G5` of `SKILL-delegate-and-record-consultation` (a delegate's output is
advisory until recorded), and `I1` of [`context-assembly.md`](context-assembly.md)
(a claim with no source path is input to be verified, never context).

**Why it is not merely good practice.** The system's whole premise is that the
next session reads files, not history. A fact held only in a session is not a
weak fact — it is, from every other session's position, a fact that does not
exist, and it will be silently re-derived differently.

### 4.2 `G2` — No authoritative write to a temporary location

**The rule.** Authoritative state is written under the canonical root resolved by
`HOOK-canonical-root` and nowhere else. Prohibited without exception: temporary
directories, scratchpads, session workspaces, transcript stores, directories
outside the repository, and ad-hoc paths in the codebase
([`repository-layout.md`](repository-layout.md) §1).

**The exemption, stated positively.** The **global agent home** —
`manifest.yaml:agent_home`, `~/.claude/` — is **not** a temporary location and
must never be flagged as one. Agent declarations (`~/.claude/agents/<name>.md`)
and skill declarations (`~/.claude/skills/<slug>/SKILL.md`) are executable
configuration for the agent runtime, are shared across projects, and are
canonical *there*.
`G2` governs **product artifacts** — the types in the `roles:` registry's
`writes` lists. A declaration is not one of them, and there is no
`product/agents/` or `product/skills/`; both were deliberately removed. What
*does* live under `product/` is the declaration's **contract**: its row in
[`skill-library.md`](skill-library.md) and its binding in the `roles:` registry.

**Decided by.** `CP1` at `HOOK-checkpoint` — every written path is tested against
the recorded canonical root, with the `agent_home` prefix exempt and the
`~/Factory/Artifacts/projects/<PROJECT>/tickets/` session workspace, `~/Factory/Artifacts/projects/<PROJECT>/batches/`, and packet locations explicitly not.

**The three-place rule for a new skill.** A skill is not finished until it exists
in all three: a declaration under `~/.claude/skills/`, a contract block in
[`skill-library.md`](skill-library.md) §3, and an artifact type its role is
permitted to write in the `roles:` registry. Two out of three is a skill that
either cannot run, cannot be checked, or writes out of authority.

### 4.3 `G3` — No competing canonical artifact

**The rule.** For any subject there is exactly **one** authoritative artifact.
Where two records describe the same capability, one of them is wrong and must be
superseded — never left as a parallel truth. This extends to catalogs: there is
one skill catalog, one story schema, one manifest schema, one readiness criteria
set, and one hook register, each stated once and **referenced, never restated**.

**Decided by.** `CP2` at `HOOK-checkpoint`; `D4` (every file has an index row —
indexes are the closed world); `A2` (an unindexed artifact loses to any indexed
one); the supersession mechanics `D6`/`D7` at `HOOK-stale-context`; and, at
authoring time, the disposition discipline of
[`skill-library.md`](skill-library.md) §4 — a candidate that would own no
artifact of its own is merged, not added.

**Why restatement is the common failure.** Two copies of a rule do not disagree
on the day they are written. They disagree on the day one of them is repaired.
Where a written skill file and its catalog contract diverge, the divergence is a
**defect to repair, not a variant to tolerate**.

### 4.4 `G4` — No use of superseded authoritative context

**The rule.** An artifact that is archived, or whose `status` is `superseded`,
`historical`, `rejected`, `withdrawn`, or `abandoned`, is **never context**. It
is at most rationale. On encountering `status: superseded`, follow
`superseded_by` and use the replacement; retain only the superseded record's
identifier and one-line reason.

**Decided by.** `A1` (precedence), `P3` (packet invariant), `D6` and `D7`
(pointer resolution and chain termination) at `HOOK-stale-context`; `R4` of
`SKILL-record-decision` (an accepted `PD-` body is never rewritten); `K4` (an
accepted `REQ-` is superseded, never edited); and `H4`/`M5`, which void a verdict
or a manifest the moment the set beneath it changes.

**Why superseded content is never inlined.** The record survives on disk so a
future session does not re-litigate a settled question. Inside a working context
that same record is a live source of contradiction. The trail carries the *fact*
of the supersession; the reasoning stays one read away.

### 4.5 `G5` — No lifecycle progression without required upstream artifacts

**The rule.** A phase is entered only when the artifacts §3.4.1 requires for it
exist on disk, in the stated form. A stage is entered only when its manifest and
state preconditions hold. No phase is skipped: a phase whose work is already
satisfied is **entered, recorded as satisfied with evidence, and exited** — two
log rows, never zero.

**Decided by.** `A9` and `A4` at `HOOK-phase-entry`; `P1`–`P5` at
`HOOK-fanout-eligibility`; `H1`–`H12` at `HOOK-handoff-conformance`; `D1`–`D2` at
`HOOK-manifest-conformance`; and the readiness gate itself.

**The asymmetry that makes it work.** Exit criteria are checked by the session
that is leaving; entry preconditions are checked by the session that is
arriving. Only the second survives a session dying mid-phase — which is the case
this architecture is built for.

---

## 5. Hook-to-skill binding

Every hook is discharged by skills that already exist. This table is the
authoritative binding; where a hook's checks and a skill's contract disagree,
that is a defect to repair.

| Hook | Primary skill | Supporting skills | Rule ids |
| --- | --- | --- | --- |
| `HOOK-canonical-root` | `SKILL-hydrate-product-context` | — | `HY1`, `HY2`, `D9` |
| `HOOK-hydrate` | `SKILL-hydrate-product-context` | — | `D1`–`D14`, `P1`–`P7` |
| `HOOK-initiative-resolved` | `SKILL-triage-product-request` | `SKILL-hydrate-product-context`, `SKILL-checkpoint-product-state` | `T1`–`T8`, `CP5` |
| `HOOK-phase-entry` | `SKILL-advance-product-phase` | — | `A1`–`A10`, §3.4.1 |
| `HOOK-stale-context` | `SKILL-hydrate-product-context` | `SKILL-supersede-artifact`, `SKILL-sync-tickets` | `A1`, `A8`, `D6`, `D7`, `D10`, `P3` |
| `HOOK-assumption-capture` | `SKILL-escalate-product-question` | `SKILL-design-decision-escalation`, `SKILL-triage-product-request`, `SKILL-checkpoint-product-state` | `E1`–`E9`, `T6`, `CP4` |
| `HOOK-decision-capture` | `SKILL-record-decision` | `SKILL-advance-product-phase` | `R1`–`R6` (decision) |
| `HOOK-identifier-integrity` | `SKILL-allocate-identifier` | `SKILL-checkpoint-product-state`, `SKILL-validate-requirement-coverage` | `D2`–`D4`, `D8`, `D11`, `D18`, `R2`, `R12` |
| `HOOK-traceability` | `SKILL-validate-requirement-coverage` | `SKILL-decompose-product-stories` | `R1`–`R12` |
| `HOOK-design-coverage` | `SKILL-design-requirement-audit` | `SKILL-capture-design`, `SKILL-experience-state-enumeration`, `SKILL-validate-requirement-coverage` | audit checks, `R4`, `K3` |
| `HOOK-dependency-graph` | `SKILL-story-set-technical-coherence` | `SKILL-validate-requirement-coverage`, `SKILL-compile-delivery-manifest`, `SKILL-batch-fanout` | `R6`, `R7`, `R10`, `K7`, `D3`–`D6` (manifest), `M1` |
| `HOOK-readiness` | `SKILL-review-product-readiness` | `SKILL-validate-requirement-coverage` | `W1`–`W10`, `R1`–`R18` |
| `HOOK-handoff-conformance` | `SKILL-prepare-engineering-handoff` | `SKILL-resume-initiative` | `H0`–`H12`, `C1`–`C11` |
| `HOOK-manifest-conformance` | `SKILL-compile-delivery-manifest` | `SKILL-resume-initiative`, `SKILL-sync-tickets` | `D1`–`D12` (manifest), `M1`–`M8`, `F1`, `F2` |
| `HOOK-fanout-eligibility` | `SKILL-batch-fanout` | `SKILL-sync-tickets` | `B1`–`B11`, `P1`–`P5`, `E1`–`E7` |
| `HOOK-checkpoint` | `SKILL-checkpoint-product-state` | `SKILL-allocate-identifier` | `D11`, `D18`, `CP1`–`CP5` |

### 5.1 Rules added by this document

Everything else above already existed. These nine rule ids are new, and each is
written into the contract row of its skill in
[`skill-library.md`](skill-library.md) §3 **and** into that skill's declaration
under `~/.claude/skills/`, in the same change as this document.

| Rule | Skill | Check |
| --- | --- | --- |
| `HY1` | `SKILL-hydrate-product-context` | Exactly one canonical root, resolved from the **declared** repository root. |
| `HY2` | `SKILL-hydrate-product-context` | The resolved root is recorded in the packet and is what every write this session is checked against. |
| `A9` | `SKILL-advance-product-phase` | The target phase's §3.4.1 entry preconditions hold on disk. |
| `A10` | `SKILL-advance-product-phase` | The phase-log row records which hooks were evaluated and what each returned. |
| `CP1` | `SKILL-checkpoint-product-state` | Every written artifact resolves under the recorded canonical root; `agent_home` is exempt. |
| `CP2` | `SKILL-checkpoint-product-state` | No two non-`superseded` artifacts of the same type claim the same subject. |
| `CP3` | `SKILL-checkpoint-product-state` | Every fact `next_action` depends on is on disk. |
| `CP4` | `SKILL-checkpoint-product-state` | Every `escalation`-classified ambiguity resolves to a `Q-` or an accepted `PD-`. |
| `CP5` | `SKILL-checkpoint-product-state` | No initiative-scoped artifact written in a session that resolved no initiative. |

No new skill, role, artifact type, or identifier space was created. Two skills
gained two rules each and one gained five; nothing else changed shape.

---

## 6. Runtime enforcement

Every hook in this register is enforced **by procedure** — the skill runs the
check because its contract says so. That is the same enforcement model as
`D1`–`D19`, and it has the same known weakness: a skipped check leaves no trace.

Whether any of the fourteen hard gates should additionally be enforced by the agent
runtime — rather than by the role following its written procedure — is an **open
question**, not decided here; if a project wants it answered, it raises a `Q-`. The narrower
version of the same question — whether `D1`–`D19` should run as a linter — is
likewise not decided here. Nothing in this document authorises writing
runtime code, a settings-level hook, or a shell script; doing so before those
questions are answered would produce exactly the second enforcement mechanism
`G3` forbids.

---

## 7. Related specifications

- [`context-assembly.md`](context-assembly.md) §11.1 — the deterministic checks
  `D1`–`D19` that most hooks bind.
- [`skill-library.md`](skill-library.md) — the single catalog of skill contracts;
  every hook's enforcement point.
- [`engineering-handoff.md`](engineering-handoff.md) §7 — conformance checks
  `C1`–`C11`.
- [`delivery-fanout.md`](delivery-fanout.md) §5, §8 — preconditions `P1`–`P5` and
  conformance `F1`–`F8`.
- [`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) §6.3, §6.7
  — eligibility `E1`–`E7` and invariants `M1`–`M8`.
- [`authority-and-versioning.md`](authority-and-versioning.md) — the status
  vocabulary `G4` is decided from.
- [`repository-layout.md`](repository-layout.md) §1, §4 — the locations `G2`
  permits and prohibits.
- `~/.claude/agents/product-manager-orchestrator.md` §12, §13 — the phase machine
  and the regression table `HOOK-phase-entry` operates over.
- [`skill-library.md`](skill-library.md) §3.9.2 — the readiness criteria
  `R1`–`R18`, stated once, in the repository.
