---
id: ARCH-product-skill-library
type: architecture
title: Product skill library — catalog and contracts
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Product skill library — catalog and contracts

This is the **single catalog** of the reusable procedures the product manager
orchestrator and its delegates execute. It lives under `product/architecture/` because it is a **contract
specification**, not a declaration: skill declarations live in the global agent
home (`~/.claude/skills/<slug>/SKILL.md`) while
the contracts they must satisfy stay version-controlled with the product.
The `roles:` registry in [`../manifest.yaml`](../manifest.yaml) binds each id to
its declaration. No second catalog exists anywhere, and none may be created.

A **skill** here is a reusable, repeatable procedure with a testable completion
condition. It is a logical specification: nothing in it names a model, vendor,
or agent framework. An environment that calls the same thing a command, a tool,
a routine, or a prompt template implements these contracts under its own name;
the contract does not change.

The library exists to make product manager behaviour **consistent, repeatable,
and deterministic**: the same request, against the same repository state, should
produce the same artifacts and the same escalations regardless of who or what
executes the role.

## 1. Classification

Every skill is exactly one of three classes. The class is a contract about where
judgement is permitted, not a description of difficulty.

| Class | Meaning | Rule |
| --- | --- | --- |
| **[R] Reasoning-heavy** | The outcome depends on reading a product situation — framing a problem, splitting scope, weighing options, writing rationale. | Judgement is permitted only where the skill marks it. Every judged output carries a recorded rationale and a source. |
| **[V] Deterministic validation** | The outcome is decided by comparison against files. Two correct implementations return the same verdict. | Contains **no** judged step that changes the verdict. A model may write prose about a defect; it may not decide whether the defect exists. |
| **[C] Orchestration / control** | Moves the lifecycle, dispatches actors, or routes state. Produces little content of its own. | Never authors a delegate's artifact and never changes an artifact it does not own. |

The ordering rule from
[`../architecture/context-assembly.md`](context-assembly.md)
§11.3 applies across the library: **deterministic checks run first, and their
results are inputs to judgement.** A [R] skill that reasons before its [V]
precondition has run is reasoning against a world that may not exist.

## 2. The library at a glance

Phase names are the product phase machine in
`~/.claude/agents/product-manager-orchestrator.md` §12.

| # | Skill | Class | Phase / moment | Invoking actor | Blocks lifecycle? |
| --- | --- | --- | --- | --- | --- |
| 1 | `SKILL-hydrate-product-context` | C | BOOTSTRAP — opens every session | every role | **Yes** |
| 2 | SKILL-triage-product-request | R | INTAKE | product manager | **Yes** |
| 3 | SKILL-discover-product-problem | R | DISCOVERY | product manager | **Yes** |
| 4 | SKILL-define-product-requirements | R | PRODUCT_DEFINITION | product manager | **Yes** |
| 5 | SKILL-coordinate-solution-exploration | C | SOLUTION_EXPLORATION | product manager | **Yes** |
| 6 | `SKILL-record-decision` | R | SOLUTION_CONVERGENCE, and any settled §4.2 question | product manager | No (its absence blocks) |
| 7 | SKILL-decompose-product-stories | R | DECOMPOSITION | product manager | **Yes** |
| 8 | `SKILL-validate-requirement-coverage` | V | Pre-convergence, inside review, pre-handoff, post-regression | product manager; readiness reviewer | **Yes** |
| 9 | `SKILL-review-product-readiness` | V (judged criteria band + verdict step) | READINESS | readiness reviewer | **Yes** |
| 10 | SKILL-prepare-engineering-handoff | V/C | ENGINEERING_READY → HANDOFF | product manager | **Yes** |
| 11 | SKILL-escalate-product-question | C | Any phase, at classification time | product manager; any role raising a `Q-` | **Yes** |
| 12 | SKILL-delegate-and-record-consultation | C | Any phase with a delegation | product manager | No (its `Q-` does) |
| 13 | `SKILL-advance-product-phase` | C | Every phase boundary | product manager | **Yes** |
| 14 | `SKILL-checkpoint-product-state` | V | Closes every session | every role | **Yes** |
| 15 | `SKILL-allocate-identifier` | V | Any artifact creation | any writing role | No (its failure stops checkpoint) |
| 16 | `SKILL-supersede-artifact` | V | Any regression or post-handoff defect | product manager, design | No |
| 17 | `SKILL-close-initiative` | R | After delivery completes | product manager | No |
| 18 | `SKILL-ux-flow-modeling` | R | Design, after requirements are designable | product designer | No |
| 19 | `SKILL-experience-state-enumeration` | R | Design, after flows exist | product designer | No |
| 20 | `SKILL-design-requirement-audit` | V | Design, before any `DES-` leaves `draft` | product designer | **Yes** |
| 21 | `SKILL-design-decision-escalation` | C | Design, the moment a material product ambiguity appears | product designer | **Yes** |
| 22 | `SKILL-capture-design` | V | Design, after a `clean` audit | product designer | **Yes** |
| 23 | `SKILL-platform-capability-scan` | R | DISCOVERY / PRODUCT_DEFINITION, on architect consultation | technical architect | No |
| 24 | `SKILL-system-impact-mapping` | R | Before any feasibility verdict; re-run at DECOMPOSITION; reused by HLD | technical architect | No |
| 25 | `SKILL-product-feasibility-assessment` | R (closed-set verdict) | SOLUTION_EXPLORATION, and PRODUCT_DEFINITION for a scope-boundary signal | technical architect | **Yes** |
| 26 | `SKILL-story-set-technical-coherence` | V | DECOMPOSITION, before READINESS | technical architect | **Yes** |
| 27 | `SKILL-compile-delivery-manifest` | V | ENGINEERING_READY, immediately after the handoff packet is written | product manager | **Yes** |
| 28 | `SKILL-batch-fanout` | C | After the orchestrator accepts the handoff, at initiative scope | orchestrator (initiative scope) | No |
| 29 | `SKILL-resume-initiative` | C | Delivery-side cold start, any stage | orchestrator | **Yes** |
| 30 | `SKILL-sync-tickets` | V/C | Execution band, whenever ticket state is read | orchestrator; planner; release | No (its `Q-` does) |

Skills 29 and 30 are declared outside this repository, at
`~/.claude/skills/resume-initiative/SKILL.md` and
`~/.claude/skills/sync-tickets/SKILL.md` respectively — both `ROLE-orchestrator`
execution-band skills, out of this catalog's authorship. Their contract rows
(§3.29, §3.30) close a gap — both are load-bearing for the delivery contracts yet
had no row in this catalog; they record what these skills already contract to do and do not
alter either declaration.

Skills 2, 3, 4, 5, 7, 10, 11, and 12 are declared at
`~/.claude/skills/<slug>/SKILL.md`, one directory per skill name in this table.
Skills 1, 6, 9, 13–17 exist today and keep their current contracts, except
where §4 records a repair. Skill 8 is declared at
`~/.claude/skills/validate-requirement-coverage/SKILL.md`; it and skill 9 use the
binary readiness verdict vocabulary `READY` / `NOT READY`.

Skills 23–26 belong to `ROLE-planner` in its PRODUCT-DISCOVERY mode and are
dispatched by the product manager under §11.3 of its declaration, never executed
by it. The architect's ENGINEERING HLD mode keeps `SKILL-hld-authoring`, which is
specified in its own file and writes no `product/` artifact.

Skills 18–21 belong to `ROLE-product-designer` and are invoked by it, not by the
product manager. They are specified here because this is the single catalog of
skill contracts; their declarations live in `~/.claude/skills/`.

`SKILL-capture-design` (skill 22, `ROLE-product-designer`) is invoked by the
product manager through delegation but never executed by it; its contract is
§3.22. `SKILL-sync-tickets` and `SKILL-resume-initiative` belong to
`ROLE-orchestrator` and are specified in their own files —
`SKILL-sync-tickets` additionally repairs the delivery manifest's dispatch-unit
projection **from** `delivery/tickets.md`, never the reverse
([`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) §7).
Skill 28, `SKILL-batch-fanout`, is the one `ROLE-orchestrator` skill contracted
here rather than in its own file, because what constrains it is a product
boundary: it consumes the delivery manifest and must never re-decide readiness
([`delivery-fanout.md`](delivery-fanout.md) §3). `SKILL-resume-initiative`
is the receiving half of [`engineering-handoff.md`](engineering-handoff.md): it
is what refuses to begin delivery on an initiative whose `product/state.md` is
not at `phase: HANDOFF`.

**There is deliberately no separate handoff skill.** The handoff is
`SKILL-prepare-engineering-handoff` on one side and `SKILL-resume-initiative` on
the other, over the artifacts they already own. A third procedure between them
would own no artifact and could only duplicate one of the two — the same reason
SOLUTION_CONVERGENCE has no skill of its own.

**There is deliberately no SOLUTION_CONVERGENCE skill.** Convergence is
`SKILL-record-decision` (the chosen-option `PD-`) followed by
`SKILL-advance-product-phase`. A third procedure between them would own no
artifact and could only duplicate one of the two.

---

## 3. Skill specifications

Each specification states, and only states: purpose, trigger, invoking actor,
required inputs, required outputs, deterministic rules and checks, artifacts
read, artifacts written, and whether it may block lifecycle progression.
Procedure bodies are deliberately absent — they belong in the individual skill
files, which are not written yet.

---

### 3.1 SKILL-hydrate-product-context — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Assemble the bounded, sourced Working Context Packet that is the only context a session acts on, and return a readiness verdict for the tree. |
| **Trigger** | The first act of every session, without exception. Re-run rather than trusting a delegate's summary of the tree. |
| **Invoking actor** | Every role. |
| **Required inputs** | Repository root; the raw request text and/or an `INIT-nnnn`; the invoking role. |
| **Required outputs** | One Working Context Packet per `context-assembly.md` §10.2, with resolved scope, banded sources, `context_digest`, and `readiness ∈ {ready, degraded, blocked, needs-orchestration, uninitialized}`; a `Q-` per structural defect found. |
| **Deterministic rules / checks** | D1–D14 of `context-assembly.md` §11.1. Packet invariants P1–P7 — in particular P5 (no content the assembler wrote) and P7 (same `head_commit` + same inputs ⇒ same scope, digest, and band membership). Only rungs that exist are read (I2). HY1 exactly one canonical root is resolved: `<declared-root>/product/manifest.yaml` exists and parses; a workspace containing several `product/` trees is resolved by the **declared** repository root, never by proximity to the working directory, and an unresolvable or ambiguous root is `uninitialized` plus a `Q-`, never a guess. HY2 the resolved root is recorded in the packet as `repository.root` and is what every write this session is checked against (CP1). `readiness: uninitialized` stops the session. `readiness: degraded` permits reading and analysis but forbids advancing a phase. The packet is never written under `product/`. |
| **Artifacts read** | `manifest.yaml`; every collection index; `project/mission.md`, `principles.md`, `constraints.md`, `glossary.md`; `initiative`; `product/state.md` (never `product/state-history.md`; a `state-oversize` warning past 300 lines, `context-assembly.md` §7.4); `delivery/state.md`; `tickets`; `capability`, `decision`, `requirement`, `design`, `question` as banded. |
| **Artifacts written** | Nothing durable except a `question` per defect. |
| **May block lifecycle progression** | **Yes** — `uninitialized` stops the session; `blocked` and `degraded` forbid phase advance. |

---

### 3.2 SKILL-triage-product-request — **[R]**, deterministic pre-checks

| Field | Contract |
| --- | --- |
| **Purpose** | Decide what an incoming raw ask actually *is* before any product artifact is written — new work, a duplicate, something the product already does, something already decided or rejected, something a constraint forbids, or a portfolio question too broad to be one initiative — and produce the INTAKE result for that verdict. |
| **Trigger** | A raw request with no resolved initiative, once hydration returned `readiness ∈ {ready, degraded}`. Also on re-triage when a requester materially restates the problem (regression to INTAKE). |
| **Invoking actor** | `ROLE-product-manager`. Not delegable — this is where the PM's own understanding is formed. |
| **Required inputs** | The Working Context Packet, with its `neighbouring` band read **in full**; the raw request text; the requester's identity. |
| **Required outputs** | One verdict from the closed set `{new-initiative, duplicate-of INIT-nnnn, satisfied-by CAP-nnnn, settled-by PD-nnnn, forbidden-by <constraint>, portfolio-scale}`, with the evidence that produced it. For `new-initiative`: a `status: draft` initiative, `product/state.md` at `phase: INTAKE` carrying requester, problem statement, and an `Ambiguity log` in which every ambiguity is classified `pm-resolvable` or `escalation`. For every other verdict: no initiative, and a recorded pointer to the artifact that settles the ask. |
| **Deterministic rules / checks** | T1 The verdict is a member of the closed set; no free-text verdict. T2 A verdict other than `new-initiative` writes no requirement and no decision. T3 A request contradicting an accepted or `rejected` `PD-` is never actioned quietly — `~/.claude/agents/product-manager-orchestrator.md` §7.3 applies: surface the prior decision, ask the requester, then abandon or record a new `PD-` with `supersedes:`. T4 No identifiable requester ⇒ `blocker` `Q-`, and INTAKE does not exit. T5 An ask that names no outcome is `portfolio-scale`: escalated, never silently narrowed into an initiative. T6 Every ambiguity is classified in the same write that records it; an unclassifiable ambiguity is escalation-class. T7 A session that consumed user input may not end without a durable `INIT-` and `product/state.md` (§12.2.8). T8 Identifier allocation obeys D11. |
| **Artifacts read** | Packet; `capabilities/index.md`; `decisions/index.md`; `initiatives/index.md`; `questions/index.md`; `project/constraints.md`; `project/principles.md`. |
| **Artifacts written** | `initiative` (draft), `product-state`, `question`; index rows and counter bumps for each. |
| **May block lifecycle progression** | **Yes** — every verdict except `new-initiative` stops the product lifecycle for this ask, and T4/T7 stop INTAKE from exiting. |

---

### 3.3 SKILL-discover-product-problem — **[R]**

| Field | Contract |
| --- | --- |
| **Purpose** | Replace assumption with evidence: who this is for, what they do today, what the product already does about it, and what success would actually signal. |
| **Trigger** | Phase DISCOVERY — a draft initiative exists and INTAKE's exit criteria hold. |
| **Invoking actor** | `ROLE-product-manager`. Delegates may be consulted read-only. |
| **Required inputs** | Draft initiative; `product/state.md`; `capabilities/index.md`; decisions touching the same subject; the requester's answers to INTAKE escalations. |
| **Required outputs** | The `## Discovery` section of `product/state.md`: target users; jobs and problems with the evidence for each; current-state capability mapping as `CAP-` ids **or the literal `none`**; success signals; known non-goals. Plus an appended `Ambiguity log` and any `Q-` raised. |
| **Deterministic rules / checks** | S1 Every discovery claim carries a source — a repository path, a `CAP-`/`PD-` id, or `requester, YYYY-MM-DD`. An unsourced claim is not discovery. S2 The current-state mapping is never blank; `none` is an assertion and must be written. S3 Success stated only as an output ("ship X") fails the phase — a signal is required. S4 At most one batched question round, ≤5 questions, routed through `SKILL-escalate-product-question`. S5 Delegations are read-only here and go through `SKILL-delegate-and-record-consultation`; neither delegate is asked to propose a solution. S6 Any open `blocker` `Q-` forbids exit. |
| **Artifacts read** | Packet; `initiative`; `product-state`; `capability`; `decision`; `question`; `design` (surface inventory, read-only). |
| **Artifacts written** | `product-state` (Discovery, Ambiguity log, Consultation log); `question`; `decision` where a recurring question is settled. |
| **May block lifecycle progression** | **Yes** — S3 and S6 hold the phase. |

---

### 3.4 SKILL-define-product-requirements — **[R]**

> Supersedes `SKILL-define-initiative`; see §4.

| Field | Contract |
| --- | --- |
| **Purpose** | State what will be true when this is done and what deliberately will not be done — solution-independently — and express it as a draft requirement set that covers the outcome. |
| **Trigger** | Phase PRODUCT_DEFINITION, once the Discovery section satisfies §3.3. |
| **Invoking actor** | `ROLE-product-manager`. |
| **Required inputs** | The Discovery section; `project/constraints.md` and `principles.md`; the decisions in force; answers to any escalation the outcome depends on. |
| **Required outputs** | A populated `initiative.md` — outcome statement, scope, **explicit out-of-scope**, success measures, product constraints — and a `status: draft` `REQ-` set that covers the outcome, each with index rows and counter bumps; a `PD-` for any scope choice a later session would otherwise re-litigate. |
| **Deterministic rules / checks** | F1 The out-of-scope section is non-empty; an empty one fails the phase. F2 Every stated need in Discovery maps to ≥1 draft `REQ-` — checked by `SKILL-validate-requirement-coverage` in draft mode, not by impression. F3 Requirements stay `draft` here; acceptance happens only in DECOMPOSITION. F4 An outcome that cannot be stated without naming a solution is a discovery failure — regress, do not proceed. F5 Every unknown becomes a `Q-` with a recommended default, never an assumption baked into a requirement. F6 Identifier allocation obeys D11. F7 This skill **never** writes `delivery/state.md`; delivery state is created by `ROLE-orchestrator` after handoff. |
| **Artifacts read** | Packet; `initiative`; `product-state`; `capability`; `decision`; `project-context`; `question`. |
| **Artifacts written** | `initiative`; `requirement` (draft); `decision`; `question`; `product-state`. |
| **May block lifecycle progression** | **Yes** — F1, F2, and F4 hold the phase. |

---

### 3.5 SKILL-coordinate-solution-exploration — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Get genuinely different ways to meet the outcome onto the table, with what each costs, before anything is chosen — without the product manager authoring the design or the architecture itself. |
| **Trigger** | Phase SOLUTION_EXPLORATION, once the initiative is populated and draft requirements exist. |
| **Invoking actor** | `ROLE-product-manager`, dispatching `ROLE-product-designer` and the technical architect named in the `roles:` registry in `product/manifest.yaml`. |
| **Required inputs** | Populated initiative; draft requirements; binding constraints; the framed option space. |
| **Required outputs** | The `## Options` table in `product/state.md` — option, user-visible difference, feasibility verdict, cost/risk, trade-off — one `Consultation log` row per delegate response, `DES-` concept records for concept artifacts worth keeping, and a recorded PM recommendation with its reasoning. |
| **Deterministic rules / checks** | X1 ≥2 distinguishable options, or a recorded justification that the single option is a decision already made. X2 Every option carries a feasibility verdict from the closed set `{feasible, feasible-with-constraints, infeasible}`; a missing verdict is a blocking defect, not a blank cell. X3 All options `infeasible` ⇒ escalate; the ask must change. X4 Every dispatch goes through `SKILL-delegate-and-record-consultation` — one question per dispatch. X5 An unavailable delegate becomes a `Q-`; the PM never authors the delegate's artifact. X6 Options differing only in internal shape, cost, or sequencing are PM-decidable; any option differing in user-visible outcome triggers §4.2 escalation before the choice. X7 No option is marked chosen here — choosing is SOLUTION_CONVERGENCE. |
| **Artifacts read** | Packet; `initiative`; `requirement`; `decision`; `design`; `project-context`. |
| **Artifacts written** | `product-state` (Options, Consultation log); `question`. `DES-` records are written by `ROLE-product-designer`, registered in `design/index.md`. |
| **May block lifecycle progression** | **Yes** — X1, X2, and X3 hold the phase. |

---

### 3.6 SKILL-record-decision — **[R]**

> Absorbs the `manage-product-decisions` candidate; see §4.

| Field | Contract |
| --- | --- |
| **Purpose** | Make a choice durable, defensible, and hard to re-litigate — and be the only mechanism by which a prior decision is overturned or an escalation-class ambiguity is legitimately worked around. |
| **Trigger** | SOLUTION_CONVERGENCE (the chosen-option decision, mandatory), and any point where a §4.2 question is settled, a scope boundary is fixed, or a constraint permanently narrows the product's options. |
| **Invoking actor** | `ROLE-product-manager` — the only role that may accept a `PD-`. |
| **Required inputs** | The choice; the pressure that forced it; the options considered with the reason each was rejected; the consequences accepted; the predecessor decision, if any. |
| **Required outputs** | A `PD-nnnn` with context first, options with rejection reasons, consequences costs-first, `affects`, `decided_on`, `status: accepted`, an index row, and a counter bump; `supersedes`/`superseded_by` wired both ways when it overturns a predecessor. |
| **Deterministic rules / checks** | R1 `status: accepted` and an index row in the same commit as the file. R2 A superseding decision sets `supersedes`; the predecessor gets `status: superseded` + `superseded_by` and **stays in `decisions/`** — decisions are never archived. R3 The rejected-options section is non-empty whenever more than one option existed. R4 An accepted `PD-` body is never rewritten; a change of mind is a new decision. R5 Supersession chains terminate at depth ≤5 (D7). R6 A `PD-` used to work around an escalation-class ambiguity names the question, the answer, and who supplied it. |
| **Artifacts read** | Packet; `decision`; `decisions/index.md`; `initiative`; `product-state`; `project-context`. |
| **Artifacts written** | `decision`; `decisions/index.md`; `manifest.yaml` counter; `product-state` (Escalation/Consultation log cross-reference). |
| **May block lifecycle progression** | **No** — but SOLUTION_CONVERGENCE cannot exit without exactly one accepted chosen-option `PD-`. |

---

### 3.7 SKILL-decompose-product-stories — **[R]**

> Absorbs the `write-acceptance-criteria` candidate; see §4.

| Field | Contract |
| --- | --- |
| **Purpose** | Turn the definition plus the chosen shape into the collection of engineering-ready product stories that is the role's deliverable, each carrying the acceptance criteria that make it testable. |
| **Trigger** | Phase DECOMPOSITION, once exactly one chosen-option `PD-` is accepted. |
| **Invoking actor** | `ROLE-product-manager`, delegating surface design per user-facing story. |
| **Required inputs** | Initiative; chosen-solution `PD-`; draft requirements; design concepts; recorded technical constraints; open questions with severities. |
| **Required outputs** | The accepted `REQ-` set, each satisfying all nine points of `~/.claude/agents/product-manager-orchestrator.md` §10.3; ≥1 pass/fail acceptance criterion per story; `CAP-` and `DES-` mapping per story; sequencing notes; the `Stories` table in `product/state.md`; and — only after §3.8 returns zero defects — `converged: true` with its phase-log row. |
| **Deterministic rules / checks** | K1 Every story has ≥1 acceptance criterion evaluable pass/fail without asking the author what was meant (the criterion's *shape* is deterministic; whether it is genuinely testable is the judged step). K2 No story is accepted while a `blocker` `Q-` names it. K3 A user-facing story requires a `DES-` whose `local_export` path exists on disk — a link is not a deliverable. K4 An accepted `REQ-` is immutable from the freeze point (`product-memory.md` §4.6.6): before it, a content change is a plain in-place edit paying the pre-freeze edit contract (revision bump, `updated`, verdict-voiding effects); from it onward, a later change is `SKILL-supersede-artifact`, never an edit. Holding the set in `draft` until a review returns clean remains the default path; pre-freeze editability is not a licence to accept early. K5 File, index row, and counter bump in one commit (D11). K6 `converged: true` may not be written while §3.8 reports any defect. K7 Sequencing constraints are written as notes; a hidden ordering assumption is a defect. K8 Convergence is declared here or not at all — no other skill may write it. |
| **Artifacts read** | Packet; `initiative`; `requirement`; `decision`; `design`; `capability`; `question`; `product-state`. |
| **Artifacts written** | `requirement` (accepted); `requirements/index.md`; `product-state` (Stories, phase log, `converged`); `question`; `manifest.yaml` counters. |
| **May block lifecycle progression** | **Yes** — K2, K3, and K6 hold the phase. |

---

### 3.8 SKILL-validate-requirement-coverage — **[V]**

> Absorbs the `build-traceability-map` candidate; see §4. Rule set is `R1`–`R12`.
> Declared at `~/.claude/skills/validate-requirement-coverage/SKILL.md`.

| Field | Contract |
| --- | --- |
| **Purpose** | Compute the traceability map for an initiative and return a defect list. It decides nothing about the product; it decides only whether the artifacts on disk are complete, connected, and internally consistent. |
| **Trigger** | Four moments, all `ROLE-product-manager`, all **full mode**: before `converged: true` is written; before every dispatch of `SKILL-review-product-readiness` (run to a zero-defect result — this is the dispatch precondition, an uncapped loop outside the review's own budget); before `SKILL-prepare-engineering-handoff`; and after any regression or pre-freeze edit touching an accepted story. Also runnable in *draft mode* during PRODUCT_DEFINITION, where R5 and the all-`accepted` condition are relaxed. |
| **Invoking actor** | `ROLE-product-manager` only. `ROLE-product-readiness-reviewer` never invokes this skill — it consumes the PM's zero-defect report as a required input and never re-derives `R1`–`R12`. |
| **Required inputs** | `INIT-nnnn`; the initiative's outcome elements; the story set with statuses; the collection indexes; the open-question list with severities. |
| **Required outputs** | A traceability map — outcome element ↔ `REQ-` ↔ `CAP-` ↔ `DES-` ↔ `PD-` ↔ `Q-` (and tickets where they exist) — plus a defect list in which every entry names one artifact identifier and one failed rule. Session-local; its summary refreshes the `Stories` table. |
| **Deterministic rules / checks** | The rule set is the readiness criteria `R1`–`R12`, stated once in §3.9.2 of this document and referenced — never restated — here. This skill is what *decides* them and is their **sole executor**; §3.9.2 is what *states* them. **Mode:** *draft* relaxes `R5` and the all-`accepted` condition. Every rule records a result, including passes. One defect entry names exactly one rule and exactly one artifact. **Migration:** the former `V1`–`V11` map as V1→R1, V2→R3, V3→R4 (forward half), V4→R12, V5→R5, V6→R8, V7→R8, V8→`accepted` mode condition, V9→R2 and R12, V10→R10, V11→R11; `R6`, `R7`, `R9`, and the reverse half of `R4` are new. |
| **Artifacts read** | `initiative`; `requirement`; `design`; `decision`; `capability`; `question`; `product-state`; `requirements/index.md`; `design/index.md`; `capabilities/index.md`; `decisions/index.md`; `questions/index.md`; `project/constraints.md`. |
| **Artifacts written** | `product-state` (Stories refresh) on every full-mode run. |
| **May block lifecycle progression** | **Yes** — a non-empty defect list blocks the convergence declaration, blocks the reviewer's dispatch, and blocks handoff. This is a deterministic computation loop, not an LLM review: it does not consume the §9a dispatch budget and has no round cap. |

---

### 3.9 SKILL-review-product-readiness — **[V]** with one judged criteria band and one judged verdict step

> Absorbs the `assess-product-readiness` candidate; see §4. Verdict vocabulary,
> criteria set, findings block, routing table, and re-review rules are defined
> here.
> Declared at `~/.claude/skills/review-product-readiness/SKILL.md`.

| Field | Contract |
| --- | --- |
| **Purpose** | Test the product manager's declaration of convergence against the artifacts — never against the PM's account of them — and return the binding verdict that authorises engineering handoff. The bar is autonomous orchestration: a finding matters if an implementing agent with no access to the PM would stop, or guess. |
| **Trigger** | Phase READINESS, after `converged: true`. Never before the declaration. Re-run after any story edit, which voids the prior verdict by digest. |
| **Invoking actor** | `ROLE-product-readiness-reviewer`, dispatched by the PM. Never the same executor instance as the PM in the same session. |
| **Required inputs** | `INIT-nnnn`; the declared-converged story set; the initiative record with its out-of-scope section; `DES-` records and their `local_export` paths; decisions in force; open questions with severities; the architect's `technical-assessment` files; `project/constraints.md`; the `CAP-` records the stories claim. **Artifacts only.** A missing required input is a finding, not a reason to review on less. |
| **Dispatch precondition** | Dispatched only once `ROLE-product-manager` has run `SKILL-validate-requirement-coverage` in **full mode** to a **zero-defect result** for `R1`–`R12` — an uncapped deterministic computation loop that is not this review and does not consume the §9a dispatch budget. That report, with its story-set digest, is a required input; a missing, non-zero, or digest-mismatched report is a refused dispatch, returned **unreviewed**. |
| **Required outputs** | Exactly one verdict ∈ `{READY, READY-with-known-issues, NOT READY}` — `READY` and `READY-with-known-issues` open the handoff gate, `NOT READY` shuts it — recorded as one `Readiness log` row carrying `Date \| Round \| Verdict \| Conditions \| Reviewer \| Story-set digest \| Findings \| Finding ids`, with `readiness_verdict` frontmatter set to match; a `## Readiness findings` block for every round producing ≥1 finding, one row per finding carrying `Finding \| Criterion \| Artifact \| What is wrong \| Route phase \| Route role`; and one `Q-` per finding needing a human or product answer. Finding ids are `RF-<INIT-nnnn>-<round>-<n>`, scoped to the state file: they bump no counter and appear in no index. |
| **Verdict vocabulary** | `READY` and `READY-with-known-issues` — handoff may proceed; `NOT READY` — the gate stays shut. `READY-with-known-issues` is the terminal round's (round 2's) legal close with remaining non-blocking judged findings; it is not a fourth, independent value. Conditions and known issues are a **separate column**, not a verdict: a `READY` carrying non-`blocker` `Q-`/`PD-` follow-ups is still `READY`. A follow-up that cannot be carried that way is a finding. Retired vocabulary maps `approved → READY`, `approved-with-conditions → READY` + conditions, `rejected → NOT READY` (extended by `product-manager-orchestrator.md` §9a). |
| **Criteria** | The eighteen readiness criteria `R1`–`R18`, stated once in §3.9.2 of this document. `R1`–`R12` are the **deterministic band**, executed only by `SKILL-validate-requirement-coverage` (§3.8) — the dispatch precondition above, never re-derived by the reviewer. `R13`–`R18` are the **judged band**, executed only by the reviewer, alongside the two flag-only clauses (`R8` contradiction, `R9` verdict correctness). The five former set-level criteria are subsumed, not retired — coverage→`R1`, boundary→`R11`, traceability→`R3`/`R4`/`R12`, ambiguity→`R8`/`R10`, self-containment→`R18`. The nine points of `~/.claude/agents/product-manager-orchestrator.md` §10.3 map onto `R2`/`R5`/`R3`/`R4`/`R7`/`R8`/`R11`/`R12`/`R13` — mostly deterministic-band, already covered by the dispatch precondition; the reviewer does not re-walk §10.3. |
| **Deterministic rules / checks** | W1 The story set is unchanged since `converged: true`, tested by the **story-set digest** — the ordered list of `(REQ- id, revision, updated)` triples plus the initiative `revision` — against the convergence phase-log row and against the dispatch precondition's validator-report digest; a set that changed mid-review, or since the validator report, is returned **unreviewed**, not `NOT READY`. W2 `R1`–`R12` are never decided by the reviewer — see Dispatch precondition. W3 A result is recorded for **every** criterion `R13`–`R18`; an unevaluated criterion is not a pass. W4 Every judged finding quotes the artifact text it concerns; a judged finding with no quotation is an opinion and is not recorded. W5 The reviewer writes nothing outside `product-state` (`Readiness log`, `Readiness findings`) and `question` — it never fixes what it finds, and never changes the phase. W6 `NOT READY` always carries a findings block; an unexplained rejection is itself a defect. W7 Every finding is routed by the §3.9.1 table — class determines phase and role, and is not chosen per finding. W8 No blocking judged finding may be carried as a condition or known issue while it still fails; conditions attach to `READY`, known issues to the terminal round's `READY-with-known-issues`. W9 Rounds are appended with an incrementing `Round`; a prior row is never edited, withdrawn, or overwritten. W10 The absolute two-round cap (§"Re-review") is what ends a review, not a same-class streak — the old three-strike rule is retired. |
| **Re-review** | Absolute two-round cap (`product-manager-orchestrator.md` §9a); round 2 is declared terminal in its own dispatch and there is no round 3. Round 2 exists **only as fix-verification**, scoped strictly to round 1's blocking findings — never a fresh pass over the story set, and never a re-derivation of `R1`–`R12` (those stay at zero via the PM's uncapped validator loop before every dispatch, including this one). The reviewer verifies each round-1 blocking finding was fixed or dispositioned, and is forbidden to open a new finding except as a `late-discovery` known issue (§9a.4). Unrepaired prior findings carry forward by id, not by restatement. A finding is withdrawn only on a demonstration that it was wrong, recorded with its reason; a finding the PM merely disputes stays open and the PM escalates to the human. |
| **Void conditions** | The verdict is void if any story's digest entry changes, if the initiative regresses to an earlier phase (`SKILL-advance-product-phase` writes `readiness_verdict: void`), or if a `blocker` `Q-` naming the set is raised after the verdict date. A void verdict is **not** a `NOT READY` — it is the absence of a verdict, and READINESS runs again. |
| **Artifacts read** | `initiative`; `requirement`; `design`; `decision`; `capability`; `question`; `product-state`; `technical-assessment`; `project-context`; every relevant index. |
| **Artifacts written** | `product-state` (`Readiness log` and `Readiness findings` only); `question`. |
| **May block lifecycle progression** | **Yes** — this is the gate. `NOT READY` forces the regression in `~/.claude/agents/product-manager-orchestrator.md` §13, to the earliest phase its findings route to; an unavailable reviewer leaves the gate shut and the initiative `blocked`, never waved through. |

#### 3.9.1 Finding routing table

Deterministic. The finding's class determines the destination; the reviewer does
not choose one per finding. This table is the source for the readiness rows of
`~/.claude/agents/product-manager-orchestrator.md` §13, and the two must agree.

| Finding class | Failed criteria | Route to phase | Owning role |
| --- | --- | --- | --- |
| Story quality — untestable criteria, unbounded scope | `R13`, `R14` | DECOMPOSITION | `ROLE-product-manager` |
| Definition gap — behaviour implicit only in design, product decision left to engineering | `R16`, `R17` | PRODUCT_DEFINITION | `ROLE-product-manager` |
| Design gap — requirement/design disagreement | `R15` | DECOMPOSITION, design sub-task | `ROLE-product-designer` |
| Technical gap — `infeasible` chosen option, stale or absent coherence verdict | `R9` (flag-only) | DECOMPOSITION, architect consultation | `ROLE-planner` (PRODUCT-DISCOVERY) |
| Unresolved material decision — contradiction with an accepted `PD-` or `constraints.md`, an escalation-class ambiguity with no record | `R8` (flag-only) | current phase, `blocked_by` set | the named human, via `Q-` |
| Problem-level — the set does not describe the stated problem, or is not self-contained | `R18` | DISCOVERY | `ROLE-product-manager` |

`R1`–`R7` and `R10`–`R12` never appear in this table: they are the
deterministic band, caught and blocked by `SKILL-validate-requirement-coverage`
before the reviewer is ever dispatched (§3.9's Dispatch precondition) — a set
carrying one of those defects is never handed to the reviewer, so it is never
the source of a routed finding. When a finding routes to more than one phase,
`next_action` names the **earliest** phase in the machine order and the
findings block carries the rest.

#### 3.9.2 The eighteen readiness criteria — `R1`–`R18`

**This subsection is the canonical statement of the readiness contract.** It is
stated here, in the repository, and nowhere else: `~/.claude/agents/product-readiness-reviewer.md`,
[`../schemas/frontmatter.md`](../schemas/frontmatter.md),
[`engineering-handoff.md`](engineering-handoff.md),
[`lifecycle-hooks.md`](lifecycle-hooks.md), and
[`../templates/product-state.md`](../templates/product-state.md) all reference
this table rather than restating it. A declaration may be absent, stale, or from
another machine; the bar an initiative is judged against may not be.

`R1`–`R12` are the **deterministic band, executed only by
`SKILL-validate-requirement-coverage`, gate on reviewer dispatch**: decided by
comparison against files, two correct implementations returning the same
result. A model may write prose about one of these findings; it may not decide
whether the finding exists. They are run by `SKILL-validate-requirement-coverage`
in full mode (§3.8), by `ROLE-product-manager`, to a zero-defect result,
**before** `ROLE-product-readiness-reviewer` is ever dispatched — the reviewer
never executes them and never re-derives them.

| # | Criterion | Passes when |
| --- | --- | --- |
| `R1` | **Requirement coverage and disposition** | Every in-scope element of the initiative's outcome maps to ≥1 `accepted` `REQ-`, **or** to an explicit disposition row naming the element, a disposition ∈ `{deferred, out-of-scope, superseded, covered-by-existing-CAP}`, and a reason. Silence is a finding; an explicit "not this time, because…" is not. |
| `R2` | **Stable identifiers** | Every `REQ-` has an `id` matching its filename and its `requirements/index.md` row; the identifier is ≤ the allocated counter in `manifest.yaml`; no identifier in the set was renumbered after it first reached `accepted` (a renumber shows as an index row pointing at a path that does not exist, or two rows resolving to one file). A **post-freeze** content edit of a `REQ-`/`DES-` in place (rather than a supersession) is a defect here. A **pre-freeze** supersession of a `REQ-`/`DES-` used to repair its content — rather than a plain in-place edit — is also a defect here: before the freeze point (`product-memory.md` §4.6.6) the correct move is always a plain edit. |
| `R3` | **Upward traceability** | Every `REQ-` names the outcome element it serves and the `CAP-` it creates or changes, and both resolve. Every `REQ-` in the set belongs to this initiative. |
| `R4` | **Design traceability, both directions** | Forward: every `REQ-` with a user-facing surface names a `DES-` whose `local_export` path exists on disk. Reverse: every `DES-` attached to this initiative names ≥1 `REQ-`. The reverse direction is how an invented product surface is caught. |
| `R5` | **Acceptance criteria present** | Every `REQ-` carries ≥1 `acceptance` entry, and each entry states an observable trigger and an observable result. Every `REQ-` with a **non-empty `design_refs`** additionally carries ≥1 entry beginning with the literal prefix `composition:` (`schemas/frontmatter.md` §"The composition criterion"); a story with `design_refs: []` is exempt by construction. *Whether it is genuinely testable, and whether it covers both composition clauses, is `R13`.* |
| `R6` | **Explicit dependencies** | Every `REQ-` carries a `depends_on` list written explicitly — `none` when there are none, never blank — and every named dependency resolves to a `REQ-`, `PD-`, `DES-`, `CAP-`, or an external system named in `manifest.yaml`. |
| `R7` | **Sequencing represented** | Every dependency from `R6` appears as a sequencing note in the `Stories` table of `product/state.md`, and the dependency graph over the story set is acyclic. A cycle means no story can start first. |
| `R8` | **No unresolved material product decision** | No `blocker`-severity `Q-` names the initiative or any `REQ-` in the set; every `escalation`-class row in the `Ambiguity log` carries a `Q-` or a `PD-`; no `REQ-` contradicts an accepted `PD-` or a line of `project/constraints.md`. *A flagged contradiction is escalated, never decided here.* |
| `R9` | **Technical feasibility reviewed** | *Deterministic half, executed by `SKILL-validate-requirement-coverage`:* the chosen-option `PD-` cites a feasibility verdict from `ROLE-planner` in PRODUCT-DISCOVERY mode; that verdict is not `infeasible`; a `story-set-technical-coherence` verdict is recorded in the `Consultation log`; and that verdict is not `regression-required`, is the terminal round for this story set (`~/.claude/agents/product-manager-orchestrator.md` §9a.1), and carries a recorded disposition — `fixed`, `carried-accepted`, or an open `Q-` — for **every** blocking finding it raised (§9a.2). All four are decided by comparison against the file. *Judged half, flag-only, executed by `ROLE-product-readiness-reviewer`:* whether that verdict still describes the story set on disk. **A coherence verdict dated earlier than the latest story `updated` is an ordinary, expected state and is never by itself a finding** — §9a.2's one repair pass, a `DECOMPOSITION` design pass, and a question disposition all land after the terminal round by construction, and §9a.1 forbids the round that would refresh the date. The date gap is reported as a flag; only a substantive mismatch between what the verdict certified and the current story text is a finding, and it is quoted per `W4`. (This is the same routing the pre-freeze edit contract prescribes for a pre-freeze in-place edit.) |
| `R10` | **No story ready on an unresolved upstream** | No `accepted` `REQ-` depends on a `REQ-` that is not `accepted`, on an open `Q-`, or on a `PD-` that is not `accepted`. This is the check that stops a story set from looking complete while its foundation is still a question. **Post-freeze supersession exemption:** where the *depending* story is past its freeze point (`product-memory.md` §4.6.6) — so `depends_on` and `decisions` are frozen content that cannot be re-pointed without superseding a story that has no defect — a dependency on a `superseded` `REQ-` or `PD-` is **not** a defect, **provided** its `superseded_by` chain terminates at a record whose `status` is `accepted`, within `manifest.yaml:context.supersession_chain_max_depth`. The chain is walked, never assumed: one that exceeds that depth, revisits an identifier, ends at a record with an empty `superseded_by` that is not `accepted`, or ends at a `withdrawn`, `draft`, or `proposed` record **still fails** — that is a frozen story standing on an upstream that genuinely is unresolved. The exemption never covers an open `Q-`, which is unresolved by definition; and it does **not** apply pre-freeze, where the depending story is editable in place, so re-pointing to the successor is a plain edit and remains the required repair. Whether the successor's *content* still supports the frozen story is not this rule's question — that is the supersession's `story-set-technical-coherence` delta check and `R9`'s judged currency clause. |
| `R11` | **Boundary** | The initiative's out-of-scope section is non-empty and explicit, and no `REQ-` in the set names behaviour it excludes. |
| `R12` | **Referential integrity** | Every `CAP-`, `DES-`, `PD-`, `Q-`, and `REQ-` identifier referenced anywhere in the set resolves through its index, and file, `id`, frontmatter, and index row agree. An identifier appearing in no index is a traceability finding, not a typo to overlook. A reference to a *superseded* identifier is **not** a finding: it resolves through its index to a record announcing its own replacement, which is the designed behaviour (`SKILL-supersede-artifact` step 6). |

Two rules in that band carry a **flag-only judged clause** the validator cannot
decide and the reviewer executes instead: `R8`'s contradiction clause and `R9`'s
verdict-correctness clause. The validator reports that the texts disagree, or
that the coherence verdict's disposition record is incomplete, and stops there.

`R13`–`R18` are the **judged band, executed only by
`ROLE-product-readiness-reviewer`**, alongside those two flag-only clauses:
decided by reading. Each finding **must
quote the artifact text it is about** (`W4`). "Feels underspecified" is not a
finding; "`REQ-nnnn` acceptance criterion 2 says *'the balance updates
promptly'* — no threshold is stated, so pass and fail are the same
observation" is.

| # | Criterion | A finding looks like |
| --- | --- | --- |
| `R13` | **Acceptance criteria are testable** | A criterion someone who did not write it cannot evaluate as pass or fail: a missing threshold, an undefined term, a comparison with no baseline, or an evaluative adverb standing in for a rule — *appropriately*, *correctly*, *reasonably*, *as expected*, *gracefully*. Also: a `composition:` entry that names no width from its area's supported display matrix, or states no realistic worst-case data condition for label integrity, fails here — it satisfies `R5`'s presence check while remaining unevaluable. |
| `R14` | **Bounded product scope** | A story bundling several independently-shippable outcomes, or one whose scope is stated by example rather than by boundary ("…and similar cases"), so that where it ends is a matter of opinion. |
| `R15` | **Requirements and designs agree** | A `DES-` state that contradicts the behaviour its `REQ-` states — a different default, a different error path, a field the requirement calls optional shown as required. Report the disagreement and both sides; do not decide which is right. |
| `R16` | **No product behaviour implicit only in design** | Behaviour a `DES-` shows that no `REQ-` states — a validation rule visible only in an error mockup, an ordering visible only in a populated state, a permission difference visible only in a disabled control. The finding is against the requirement set, not the design: the design is doing product definition's job. |
| `R17` | **No product decision delegated to engineering** | A story leaving a user-visible choice for an implementing agent to invent: undefined default values, unstated thresholds or limits, unspecified error and empty-state behaviour, undefined ordering the user can see, copy whose wording changes what the user understands, or an unstated permission consequence. This is the criterion that most directly protects autonomous orchestration, and the one most often failed by a story that reads fluently. |
| `R18` | **Self-containment** | An agent holding only `INIT-nnnn` and this repository could not begin planning without asking a question — including a question it would ask the PM, and including one it would answer for itself. |

The five set-level criteria the reviewer role previously carried are not retired;
they are subsumed and made checkable. Coverage → `R1`. Boundary → `R11`.
Traceability → `R3`, `R4`, `R12`. Ambiguity → `R8`, `R10`. Self-containment →
`R18`. The nine points of `~/.claude/agents/product-manager-orchestrator.md`
§10.3 remain the per-story checklist and map onto
`R2`/`R5`/`R3`/`R4`/`R7`/`R8`/`R11`/`R12`/`R13`.

---

### 3.10 SKILL-prepare-engineering-handoff — **[V/C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Freeze the product definition, assemble a handoff packet a stateless downstream agent can execute from the initiative identifier alone, and transfer ownership to the delivery track without leaving two owners of the same state. This skill is the **product-side half** of [`engineering-handoff.md`](engineering-handoff.md); `SKILL-resume-initiative` is the delivery-side half. |
| **Trigger** | Phase ENGINEERING_READY, on a recorded `READY` or `READY-with-known-issues` readiness verdict that is not `void`; carries through HANDOFF in the same session. |
| **Invoking actor** | `ROLE-product-manager`. Not delegable. |
| **Required inputs** | The readiness verdict; the accepted story set; design exports; decisions in force; binding technical constraints; the open-question list. |
| **Required outputs** | The `## Handoff packet` section of `product/state.md` — outcome, story ids in suggested sequence, `DES-` ids with export paths, `PD-` ids in force, binding technical constraints, non-blocking open questions, explicit out-of-scope; the initiative at `status: active`; a `Handoff log` row naming the receiving role and date; `phase: HANDOFF`; via §3.27, the initiative's `delivery/manifest.md` at `band_owner: product`; and, via §3.31, one Ariadne ticket per accepted story with the `REQ- → ticket` mapping in `delivery/tickets.md` and `next_action` naming the created `ticket_code`s. |
| **Deterministic rules / checks** | H0 Every story named in the packet satisfies the canonical story schema — the sixteen elements of `schemas/frontmatter.md` §"Engineering-ready product story" — with every empty form written explicitly rather than omitted. H1 `readiness_verdict` is recorded, is `READY` or `READY-with-known-issues`, and is not `void`. H2 `SKILL-validate-requirement-coverage` returns zero defects. H3 Every story is `accepted`. H4 The story-set digest recorded with the verdict still matches the set on disk; if it does not, regress to READINESS — the verdict is void. H5 No `blocker` `Q-` is open. H6 Every referenced identifier resolves through its index, and every `local_export` path exists on disk. H7 Every bullet of the handoff packet is populated; an empty bullet is written as an explicit `none`, never left blank. H8 Every condition on a `READY` verdict, and every known issue on a `READY-with-known-issues` verdict, is recorded as a `Q-` or a `PD-`, none of them `blocker`-severity, and copied into the packet's known-issues list. Either kind that cannot be carried that way was a finding, and the verdict should have been `NOT READY`. H9 This skill never writes `delivery/state.md` and never waits for it — a `ticket_code` needs no acknowledgement, and initiative-scope delivery state belongs to the fan-out session. H10 Each story in the digest has `readiness` set to `engineering-ready`; this is the one lifecycle field the product side advances at handoff, and any later regression sets it to `void`. H11 No product-side artifact carries an HLD, an execution plan, a task breakdown, or an estimate (`engineering-handoff.md` §5, `C10`). H12 The handoff is not complete until `SKILL-compile-delivery-manifest` (§3.27) has written `delivery/manifest.md` against this same verdict and digest, at `band_owner: product` (`engineering-handoff.md` `C11`). A packet with no manifest is a handoff nothing can schedule. H13 Nor is it complete until `SKILL-create-tickets-from-stories` (§3.31) has created a real Ariadne ticket for every accepted story (`engineering-handoff.md` `C12`). Delivery accepts a `ticket_code` or a raw engineering ask and nothing else; an initiative handed over without tickets is a handoff no orchestrator will take. |
| **Artifacts read** | `product-state`; `initiative`; `requirement`; `design`; `decision`; `question`; all relevant indexes. |
| **Artifacts written** | `product-state` (Handoff packet, Handoff log, phase, `next_action`); `initiative` (`status: active`); `requirement` (`readiness` only, per H10); `delivery-manifest` (product band only, via §3.27); `tickets` (initial mapping only, via §3.31). |
| **May block lifecycle progression** | **Yes** — H0–H6 each stop the handoff, and H4 forces a regression. The conformance checks `C1`–`C11` in `engineering-handoff.md` §7 are these rules seen from the contract's side; the two must agree. |

---

### 3.11 SKILL-escalate-product-question — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Give material product ambiguity exactly one legitimate destination — a durable `Q-` against a named human — and make the silence rule (`~/.claude/agents/product-manager-orchestrator.md` §4.3) mechanically enforceable rather than a matter of conscience. |
| **Trigger** | The moment an ambiguity is classified escalation-class, in any phase, **before** any artifact that depends on its answer is written. Also on receipt of an answer, to close the loop. |
| **Invoking actor** | `ROLE-product-manager` primarily; any role that must raise a `Q-` rather than guess. |
| **Required inputs** | The ambiguity as stated; the phase; its classification; the named human who owns the answer; the work that does and does not depend on it. |
| **Required outputs** | A `Q-nnnn` carrying `severity`, `raised_by_role`, `raised_on`, the question text frozen, 2–4 concrete options with consequences, the PM's recommendation, and a default-if-unanswered that says explicitly whether the PM may act on it; an `Escalation log` row; `blocked_by` updated on the initiative and in `product/state.md`; on answer, the answer appended with `answered_on`, the question closed, and a `PD-` written when the question will be asked again. |
| **Artifacts read** | `question`; `questions/index.md`; `product-state`; `initiative`; `decision`; `project-context`. |
| **Artifacts written** | `question`; `product-state` (Ambiguity log, Escalation log, `blocked_by`, `next_action`); `initiative` (`blocked_by`); `decision` on promotion. |
| **Deterministic rules / checks** | E1 `severity ∈ {blocker, important, minor}`. E2 For an escalation-class question the default-if-unanswered is always *"work stops here"* — no other default is legal. E3 A `blocker` question appears in `blocked_by` and forbids the phase from exiting; independent work continues. E4 Questions are batched per phase, ≤5 per batch. E5 No answer is inferred from silence, and no answer is fabricated. E6 Every question carries options **and** a recommendation **and** a default. E7 Asking a question already answered in a prior session is a defect: write the missing `PD-` instead. E8 The `Q-` is durable, indexed, and referenced from `product/state.md` before the session ends — an escalation that exists only in a transcript did not happen. E9 An escalation-class ambiguity may be worked around only by an accepted `PD-` naming the question, the answer, and its source. |
| **May block lifecycle progression** | **Yes** — a `blocker` question holds the phase by design. |

---

### 3.12 SKILL-delegate-and-record-consultation — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Make every dispatch to a delegate identical in shape, and make every delegate response durable, so that advisory input becomes recorded product memory instead of conversation. |
| **Trigger** | Whenever the product manager needs an artifact, a verdict, or an opinion it does not own — design, feasibility, readiness — in any phase. |
| **Invoking actor** | `ROLE-product-manager`. |
| **Required inputs** | The phase; `INIT-nnnn`; the identifiers the delegate needs (`REQ-`, `PD-`, `DES-`, `CAP-`); exactly one question; the artifact type expected back; the scope boundaries that bound the answer. |
| **Required outputs** | One `Consultation log` row per response — date, delegate role, question, answer or verdict, and what it was recorded as — plus the delegate's own durable artifact, registered by its owning role; or a `Q-` where the delegate was unavailable or failed the return contract twice. |
| **Deterministic rules / checks** | G1 Exactly one question per dispatch. G2 The dispatch cites identifiers, never conversation — a delegate needing more hydrates for itself. G3 The delegate is named by its row in the `roles:` registry in `product/manifest.yaml`, never by a vendor or model name. G4 A response that does not meet the return contract is re-requested **once**, then becomes a `Q-`. G5 A delegate's output is advisory until recorded as a `Consultation log` row, a `PD-`, or an accepted `REQ-`. G6 An unavailable delegate is a `Q-`, never a licence for the PM to author its artifact. G7 A feasibility verdict and its stated technical constraints are binding; a delegate's opinion about what the product should do is not. G8 A design that requires behaviour no accepted requirement covers is rejected or matched with a new requirement — never both silently. |
| **Artifacts read** | `product-state`; `initiative`; `requirement`; `design`; `decision`; the `roles:` registry in `product/manifest.yaml`. |
| **Artifacts written** | `product-state` (Consultation log); `question`. |
| **May block lifecycle progression** | **No** directly — the `Q-` it raises for an unavailable or non-conforming delegate does. |

---

### 3.13 SKILL-advance-product-phase — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Move the initiative between product phases — forward or in regression — on evidence from disk, and be the only procedure permitted to change `product/state.md:phase`. |
| **Trigger** | Every phase boundary, between hydration and checkpoint, in every product-side session. |
| **Invoking actor** | `ROLE-product-manager`. |
| **Required inputs** | The packet; `product/state.md`; the initiative; the exit criteria of the current phase; the regression trigger where one applies. |
| **Required outputs** | Updated `phase` and `phase_entered`; a phase-log row per transition carrying date, from, to, role, trigger, outcome, `context_digest`, and the A10 hook results; `next_action` naming exactly one action and one role; `readiness_verdict: void` on any regression. |
| **Deterministic rules / checks** | A1 The phase is read from `product/state.md`, never from conversation. A2 An open `blocker` question forbids exit. A3 Exit criteria are evaluated against artifacts on disk. A4 No phase is skipped; a phase already satisfied is entered, recorded as satisfied with its evidence, and exited — two log rows, never zero. A5 A regression sets the phase from the §13 trigger table, names what it invalidates, and handles the invalidated artifact per the same freeze-point split as any other change (`product-memory.md` §4.6.6): pre-freeze, edited in place under the pre-freeze edit contract; post-freeze, superseded. A6 Any regression voids a recorded readiness verdict in the same write. A7 A failed or interrupted session does not transition; it writes what stopped it into `next_action`. A8 This skill never touches `delivery/state.md`. A9 The target phase's entry preconditions in `lifecycle-hooks.md` §3.4.1 hold on disk before `phase` is written — entry is checked from the arriving side, not only exit from the leaving side. A10 The phase-log row records which hooks were evaluated for the transition and what each returned. |
| **Artifacts read** | `product-state`; `initiative`; `requirement`; `question`; the packet. |
| **Artifacts written** | `product-state` (phase, phase log, `next_action`, `blocked_by`, `readiness_verdict`). |
| **May block lifecycle progression** | **Yes** — it is the mechanism by which progression is refused. |

---

### 3.14 SKILL-checkpoint-product-state — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Make everything the session learned durable, indexed, and resumable — including when the session failed and including when nothing changed. |
| **Trigger** | The last act of every session, without exception. |
| **Invoking actor** | Every role. |
| **Required inputs** | The artifacts written or intended during the session; the `context_digest` from hydration; the session outcome; the canonical root recorded by HY2. |
| **Required outputs** | Every durable change written, indexed, and counter-bumped; the owning state file updated — `product/state.md` for product-side roles, `delivery/state.md` for delivery-side — with one `next_action` and its `blocked_by`; log rows carrying the `context_digest`. |
| **Deterministic rules / checks** | D18 checkpoint completeness: every artifact written has an index row and, where applicable, a counter bump. D11 identifier allocation integrity. A failure of D11 or D18 **stops** the checkpoint — those write a corrupt memory rather than an incomplete one. Nothing authoritative may be left in a scratch directory, a session workspace, or a transcript. CP1 canonical location: every artifact written resolves under the `product/` root recorded by HY2 — the `agent_home` prefix (`~/.claude/`) is **exempt**, since agent and skill declarations are canonical there and must never be flagged. CP2 single canonical record: no two non-`superseded` artifacts of the same type claim the same subject. CP3 no session-only state: every fact `next_action` depends on is on disk. CP4 every `Ambiguity log` row classified `escalation` resolves to a `Q-` or an accepted `PD-`. CP5 no initiative-scoped artifact is written in a session whose packet resolved no initiative. A role writes only the artifact types listed against it in the `roles:` registry in `product/manifest.yaml`. |
| **Artifacts read** | Everything the session touched; the relevant indexes; `manifest.yaml`. |
| **Artifacts written** | Any artifact type the invoking role owns; the matching index rows; `manifest.yaml` counters; the owning state file. |
| **May block lifecycle progression** | **Yes** — a failed checkpoint stops the session from being recorded as progress at all. |

---

### 3.15 SKILL-allocate-identifier — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Produce a stable, never-reused identifier and the index row that makes the artifact visible to a stateless agent. |
| **Trigger** | Any artifact creation in any phase. |
| **Invoking actor** | Any writing role. |
| **Required inputs** | The artifact type; the slug. |
| **Required outputs** | The identifier; the artifact from its template; the incremented counter; the index row — all in one commit. |
| **Deterministic rules / checks** | D11. New id = counter + 1, zero-padded to four digits. `id` matches the filename and the index row (D2). Identifiers are never reused or renumbered; a concurrent-allocation conflict renumbers the later-merged artifact. |
| **Artifacts read** | `manifest.yaml`; the collection index; the template. |
| **Artifacts written** | The new artifact; `manifest.yaml`; the collection index. |
| **May block lifecycle progression** | **No** — but its failure stops the checkpoint. |

---

### 3.16 SKILL-supersede-artifact — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Replace an immutable artifact without destroying the reasoning trail that stops a settled argument from being re-run. |
| **Trigger** | A `PD-` change, always; a regression or defect invalidating a **post-freeze** `REQ-` or `DES-`; a downstream role reporting a requirement defect after handoff. **Not** a defect in a **pre-freeze** `REQ-`/`DES-` (freeze point: `product-memory.md` §4.6.6) — that artifact is repaired in place, and superseding it instead is itself a post-acceptance renumber, which `R2` forbids. |
| **Invoking actor** | `ROLE-product-manager`; `ROLE-product-designer` for `DES-`. |
| **Required inputs** | The artifact id; the reason. |
| **Required outputs** | A new artifact with `supersedes`; the old one at `status: superseded` with `superseded_by` and `archived_on`, body untouched; both indexes and `archive/index.md` in agreement. |
| **Deterministic rules / checks** | D6, D7. Mutable types (capability, initiative, area, project context, role, skill) are revised in place, not superseded. A pre-freeze `REQ-`/`DES-` is also repaired in place, whatever its `status`. A `PD-` is always supersede-only, except that an arithmetic or reference error *about* an accepted `PD-`'s own register (a count, a cited identifier) is corrected in place — not a reversal of the decision, and superseding would falsely record that the architecture changed. The in-place correction bumps `revision`, sets `updated` to the correction date, and appends an `## Errata` section with a was / is / authority row per correction; the correction must be verifiable against a named canonical artifact, and anything requiring judgement about what the decision *should* have said is a supersession, not errata. Decisions stay in `decisions/`; other superseded artifacts move to `archive/<collection>/`. Inbound references to the old identifier are left alone. Never delete, never reuse the identifier, never rewrite the old body. |
| **Artifacts read** | The artifact; its index; `archive/index.md`. |
| **Artifacts written** | New artifact; old artifact frontmatter; collection index; `archive/index.md`; `manifest.yaml`. |
| **May block lifecycle progression** | **No.** |

---

### 3.17 SKILL-close-initiative — **[R]**

| Field | Contract |
| --- | --- |
| **Purpose** | Keep the capability registry true after delivery, which is the only thing that keeps "what does this product do today" worth reading. |
| **Trigger** | Delivery reports the initiative complete. Post-handoff; the PM re-enters only for this or for a regression. |
| **Invoking actor** | `ROLE-product-manager`. |
| **Required inputs** | `INIT-nnnn`; the requirement statuses; the affected capabilities. |
| **Required outputs** | Each affected `CAP-` describing present-tense reality with a bumped revision and a change-log row naming this initiative; new `CAP-` records for new behaviour; removed behaviour marked `historical` and archived; the initiative at `status: shipped`, left in place; the board row removed; questions that shipping answered closed. |
| **Deterministic rules / checks** | Every requirement is `verified` or explicitly `withdrawn` before closing. Shipped initiatives are never archived. New capability records obey D11. Capability status changes and archive rows agree (D3, D4). `delivery/state.md` is set to `stage: done` by `ROLE-orchestrator`, not by this skill. |
| **Artifacts read** | `initiative`; `requirement`; `capability`; `question`; `delivery-state`. |
| **Artifacts written** | `capability`; `capabilities/index.md`; `archive/index.md`; `initiative`; `question`; `manifest.yaml`. |
| **May block lifecycle progression** | **No** — it runs after delivery. |

---

### 3.18 SKILL-ux-flow-modeling — **[R]**

| Field | Contract |
| --- | --- |
| **Purpose** | Turn an initiative's accepted requirements into user journeys, interaction flows, and a ranked information hierarchy — the structural model the visual design and the state matrix are both built on. |
| **Trigger** | The designer has been dispatched, hydration returned a usable packet, and every requirement in play is designable (has acceptance criteria concrete enough to design against). |
| **Invoking actor** | `ROLE-product-designer`. |
| **Required inputs** | `INIT-nnnn`; the `REQ-` ids in play; the initiative's out-of-scope section; existing `CAP-` records for adjacent surfaces; the design system in force. |
| **Required outputs** | `journeys.md` and `flows.md` under the initiative's `design/`. Every journey step and flow decision carries a stable local step id and cites the `REQ-` it serves. |
| **Deterministic rules / checks** | Every step cites ≥1 `REQ-`. Step ids are stable and never renumbered. Every decision point enumerates all branches — an unenumerated branch is a defect, not an omission. Hierarchy is *ranked*, not described in prose. Reuse of an existing pattern is checked before a new one is introduced. No step introduces behavior no `REQ-` covers — that is `SKILL-design-decision-escalation`, not a design choice. |
| **Artifacts read** | `initiative`, `requirement`, `capability`, `decision`, `project-context`. |
| **Artifacts written** | `design` (the initiative's `journeys.md`, `flows.md`). |
| **May block lifecycle progression** | No — but its absence blocks §3.19 and §3.20. |

---

### 3.19 SKILL-experience-state-enumeration — **[R]**

| Field | Contract |
| --- | --- |
| **Purpose** | Enumerate every state each surface can actually be in, against a fixed matrix, and record the accessibility implications of each — so loading, empty, error, and permission states are designed rather than discovered in production. |
| **Trigger** | Flows exist. Runs for **every** initiative with user-facing surface, including ones that look trivial. |
| **Invoking actor** | `ROLE-product-designer`. |
| **Required inputs** | `flows.md`; the `REQ-` ids; the permission model in force. |
| **Required outputs** | `states.md` under the initiative's `design/`: one row per surface × state, each answered or marked `n/a` **with a stated reason**. |
| **Deterministic rules / checks** | The matrix is fixed, not per-designer: loading, empty-never, empty-cleared, partial/streaming, populated, error-recoverable, error-terminal, permission-denied, unauthenticated/expired, offline/degraded, success/confirmation, destructive-confirm, validation. An unanswered row fails the check; `n/a` without a reason fails the check. Each answered row carries announcement, focus, and non-color-conveyance notes where the surface makes them relevant. **Permission-denied is a product decision by default** — what a denied user sees is escalated unless a `REQ-` already states it. |
| **Artifacts read** | `design` (`flows.md`), `requirement`, `decision`. |
| **Artifacts written** | `design` (the initiative's `states.md`). |
| **May block lifecycle progression** | No — but an incomplete matrix fails §3.20. |

---

### 3.20 SKILL-design-requirement-audit — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Decide, by comparison against files, whether a design actually satisfies the initiative's requirements — and return one verdict that gates whether any `DES-` may leave `draft`. |
| **Trigger** | Before packaging any design. Re-run after every design change; a design is never packaged on a stale audit. |
| **Invoking actor** | `ROLE-product-designer`. |
| **Required inputs** | `journeys.md`, `flows.md`, `states.md`; the `REQ-` records; the initiative's out-of-scope section; the design export. |
| **Required outputs** | `audit.md` under the initiative's `design/`, whose **first line** is `Verdict: clean \| findings-open \| blocked-on-product`. Every finding names an artifact and the specific check it failed. |
| **Deterministic rules / checks** | **Forward coverage** — every user-facing `REQ-` reaches ≥1 designed surface, or carries a recorded reason it has none. **Reverse coverage** — every designed surface traces to ≥1 `REQ-`; an untraceable surface is either undocumented product behavior (escalate) or scope creep (delete). This is the check that catches an invented product rule. **Exclusion coverage** — nothing in the design contradicts the out-of-scope section. **State completeness** — every matrix row answered per §3.19. **Consistency** — new patterns are recorded, not assumed. A model may write prose about a finding; it may not decide whether the finding exists. |
| **Artifacts read** | `design`, `requirement`, `initiative`, `decision`, `capability`. |
| **Artifacts written** | `design` (the initiative's `audit.md`). |
| **May block lifecycle progression** | **Yes** — no `DES-` leaves `draft` on any verdict but `clean`. |

---

### 3.21 SKILL-design-decision-escalation — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Convert a material unresolved product decision exposed by design into a durable, decidable `Q-` owned by the product manager — instead of letting the designer invent a rule that then ships silently. This is the procedure that enforces the designer's one inviolable rule. |
| **Trigger** | The moment design work requires an answer no `REQ-` or `PD-` gives. Not deferred to the end of the design pass. |
| **Invoking actor** | `ROLE-product-designer` (any role may raise a `Q-`; this is the designer's materiality-tested form). |
| **Required inputs** | The blocking question in the designer's own words; the affected `REQ-` ids; the journey step, flow decision, or state row that exposed it; whatever `project-context` bears on it. |
| **Required outputs** | One `Q-` per decision in `product/questions/`, indexed, counter bumped, `owner_role: ROLE-product-manager`, `raised_by_role: ROLE-product-designer`, carrying ≥2 concrete options with their design consequences and a recommendation. |
| **Deterministic rules / checks** | **Materiality test:** escalate only when (1) a reasonable person could decide it more than one way *and* (2) the resulting **products** differ observably — behavior, data, what a user may do or learn — not the pixels. Borderline calls resolve **toward escalating** when the decision touches permissions, money, data loss, or irreversibility. One `Q-` per decision, never bundled. Every record names what it blocks. ≥2 options and a recommendation — recommending is permitted, **deciding is not**. Never edits a `REQ-`, the outcome, or the out-of-scope section. Never designs a placeholder answer. Batch before blocking: finish everything independent of the open decision first. Resolution is appended, never deleted. |
| **Artifacts read** | `design`, `requirement`, `initiative`, `decision`, `project-context`. |
| **Artifacts written** | `question` — the sole artifact type this role writes outside `design`, and only as an escalation. |
| **May block lifecycle progression** | **Yes** — an open `Q-` raised by the designer holds every affected `DES-` at `draft`. |

---

### 3.22 SKILL-capture-design — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Package a completed, audited design as durable repository artifacts — one `DES-` per designed surface, each carrying a committed local export, stable external identity, and its `REQ-` mapping — so an implementer with no access to the external design tool can still build from it. This is the design handoff; there is no separate packaging skill. |
| **Trigger** | `SKILL-design-requirement-audit` returned `clean` and no designer-raised `Q-` is open. Never before. |
| **Invoking actor** | `ROLE-product-designer` (delegated by `ROLE-product-manager`). |
| **Required inputs** | `INIT-nnnn`; `journeys.md`, `flows.md`, `states.md`, `audit.md`; the external design source and its identifiers; the `REQ-` ids each surface serves. |
| **Required outputs** | One `DES-nnnn-<slug>.md` per designed surface under the initiative's `design/`, from [`../templates/design-reference.md`](../templates/design-reference.md); the exported assets under that initiative's `design/assets/`; a row per record in [`../design/index.md`](../design/index.md); the `design` counter bumped in `manifest.yaml`. |
| **Deterministic rules / checks** | **A local export is mandatory** — a `DES-` whose `local_export` path does not exist in the repository stays `draft` and does not satisfy the design stage. An external link alone is never the deliverable. **Durable identity** — where an external system holds the editable source, the record stores `external_system`, `external_url`, `external_project_id`, `external_node_id`, and `external_revision`; a reference that cannot be resolved back to the exact revision that was exported is transient and is rejected. **Requirement mapping** — every record lists ≥1 `REQ-`, and every user-facing `REQ-` is covered by ≥1 record (the audit's forward check, re-asserted at write time). **No unaudited packaging** — a stale or non-`clean` audit blocks. **Supersession, not editing** — a changed design is a new `DES-` with `supersedes:` set and the old one moved to `superseded` with `superseded_by:`; the body of a handed-off `DES-` is never edited in place. Each record states where an implementer may exercise judgement and where they may not. |
| **Artifacts read** | `design` (`journeys.md`, `flows.md`, `states.md`, `audit.md`), `requirement`, `initiative`, `manifest.yaml`. |
| **Artifacts written** | `design` (`DES-` records and `assets/`); `design/index.md`; the `design` counter in `manifest.yaml`. |
| **May block lifecycle progression** | **Yes** — DECOMPOSITION does not complete while a user-facing `REQ-` has no `accepted` `DES-`. |

---

### 3.23 SKILL-platform-capability-scan — **[R]**

| Field | Contract |
| --- | --- |
| **Purpose** | Report what the platform already does that bears on the ask — services, components, integrations, data already held, and extension points — so feasibility and scope are argued against the real system rather than an assumed one. |
| **Trigger** | The PM dispatches the architect at DISCOVERY or PRODUCT_DEFINITION for current-state constraints (`product-manager-orchestrator` §12.3.4, §12.4.4). Runs before §3.25, whose evidence it is. |
| **Invoking actor** | `ROLE-planner`, PRODUCT-DISCOVERY mode only. |
| **Required inputs** | `INIT-nnnn`; the Working Context Packet; the problem statement and any draft `REQ-` ids; `capabilities/index.md` and the adjacent `CAP-` records; the repositories involved. |
| **Required outputs** | `initiatives/INIT-nnnn-<slug>/technical/capability-scan.md`, first line `Mode: PRODUCT-DISCOVERY`. |
| **Deterministic rules / checks** | Every capability row cites a repository, service, or path — an uncited row is deleted. Verdict per area from the closed set `exists \| partial \| absent`; `partial` states the gap. `CAP-` reconciliation is mandatory for every adjacent record, and a `CAP-` the system contradicts is reported, never corrected here (the registry is `ROLE-product-manager`'s). Extension points are recorded, not extended. Absence is recorded explicitly, not left blank. Contains no feasibility verdict, no option, no recommendation. Read-only with respect to code. |
| **Artifacts read** | `initiative`, `requirement`, `capability`, `project-context`; the codebase. |
| **Artifacts written** | `technical-assessment` (`capability-scan.md`). |
| **May block lifecycle progression** | No — but §3.25 is unsourced without it, and §3.26's assumed-capability check has nothing to check against. |

---

### 3.24 SKILL-system-impact-mapping — **[R]**

| Field | Contract |
| --- | --- |
| **Purpose** | Enumerate the systems, components, integrations, data, and dependencies a candidate behavior would touch, and what depends on them — the impact surface a feasibility verdict rests on, and the inventory the later HLD is built from. |
| **Trigger** | PRODUCT-DISCOVERY: before any feasibility verdict, per option; re-run at DECOMPOSITION when the story set changed the ask. ENGINEERING HLD: as the first step of `SKILL-hld-authoring` §Step 2, reusing the discovery map rather than rebuilding it. |
| **Invoking actor** | `ROLE-planner`, either mode. The mode governs the permitted altitude and is the file's first line. |
| **Required inputs** | `INIT-nnnn` or `<ticket_code>`; the packet; `capability-scan.md` where it exists; the options or accepted stories by identifier. |
| **Required outputs** | Discovery: `initiatives/INIT-nnnn-<slug>/technical/impact.md`. Engineering: the HLD's system inventory; no separate file. |
| **Deterministic rules / checks** | One map per option — a merged map hides the difference the option set exists to expose. Every impacted system carries a sourced one-line current responsibility plus the **obligation** the option places on it, never a design. Dependencies are directional and named, classed `internal \| third-party \| human/operational`; "various consumers" is a defect. Boundary-crossing data is classed `none \| personal \| financial \| regulated`, and any non-`none` class carries its regime note. **Discovery altitude ceiling:** no endpoint or event names, payload or request/response shapes, schema definitions, file/class/function names, library choices, or migration steps — a `PRODUCT-DISCOVERY` file containing them fails. An explicit "not impacted, and why" list is required. |
| **Artifacts read** | `initiative`, `requirement`, `decision`, `technical-assessment`, `tickets`; the codebase. |
| **Artifacts written** | `technical-assessment` (`impact.md`) in discovery mode; nothing under `product/` in HLD mode. |
| **May block lifecycle progression** | No — but §3.25 may not issue a verdict without it. |

---

### 3.25 SKILL-product-feasibility-assessment — **[R]**, closed-set verdict

| Field | Contract |
| --- | --- |
| **Purpose** | Answer, per candidate option, *can and should this product behavior reasonably exist and what constrains it* — with the constraints, architectural risks, complexity band, security/data/compliance implications, and the product assumptions the platform contradicts. This is the architect's binding product-discovery deliverable. |
| **Trigger** | The PM dispatches at SOLUTION_EXPLORATION for a verdict per option (§12.5.4), or at PRODUCT_DEFINITION for a cost-of-change signal on a scope boundary (§12.4.4). |
| **Invoking actor** | `ROLE-planner`, PRODUCT-DISCOVERY mode. |
| **Required inputs** | `INIT-nnnn`; the packet; the options by identifier and the `REQ-` ids each serves; `capability-scan.md` and `impact.md`, current for the option set; `project/constraints.md` and the accepted `PD-` records in force. |
| **Required outputs** | `initiatives/INIT-nnnn-<slug>/technical/assessment.md`; a `question` per material product assumption the architect must not settle. |
| **Deterministic rules / checks** | **Mode gate first:** `INIT-` + product phase and no `ticket_code` ⇒ discovery; `ticket_code` or an HLD request ⇒ run `SKILL-hld-authoring` instead; both or neither ⇒ do not execute, return one clarifying line, and a second ambiguous dispatch becomes a `Q-`. A verdict per option from the closed set `feasible \| feasible-with-constraints \| infeasible`, fixed by `product-manager-orchestrator` §11.3 and not extensible here. `feasible-with-constraints` names ≥1 constraint; `infeasible` cites the specific platform invariant, `PD-`, `constraints.md` line, or third-party limit. Every constraint is classed `permanent` or `initiative-local`; a `permanent` one is flagged as a `PD-` candidate and **the architect does not write the `PD-`**. Complexity is a band from `contained \| multi-component \| cross-system \| structural`, decided from `impact.md`; **durations and points are prohibited**. Every `personal \| financial \| regulated` row from `impact.md` is carried forward with its consequence. The platform-conflict section is mandatory even when empty, each row classed `blocking \| narrowing \| costly`. A conflict whose resolution changes what the product does is a `Q-` with ≥2 options and a recommendation — recommending is permitted, deciding is not. **Prohibited detail:** interface or contract specifications, payload shapes, schema definitions, sequence diagrams of new calls, file/class/function names, library selection, migration procedures, task breakdowns, test plans, effort in time or points, and rollout sequencing beyond stating a constraint exists. Append-oriented by round; a superseded round is marked, never rewritten. |
| **Artifacts read** | `technical-assessment` (`capability-scan.md`, `impact.md`), `initiative`, `requirement`, `decision`, `project-context`, `capability`. |
| **Artifacts written** | `technical-assessment` (`assessment.md`); `question` as escalation only. |
| **May block lifecycle progression** | **Yes** — SOLUTION_EXPLORATION does not exit without a verdict per option (§12.5.7), and an `infeasible` chosen option blocks SOLUTION_CONVERGENCE (§12.6.6). |

---

### 3.26 SKILL-story-set-technical-coherence — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Decide whether an accepted story set is technically coherent — independently deliverable, possibly sequenced, assuming no capability that does not exist, and still matching the feasibility verdict its authorising decision was accepted on. |
| **Trigger** | The PM dispatches at DECOMPOSITION for a sequencing and feasibility sanity check (§12.7.4). Re-runs after any story-set change. |
| **Invoking actor** | `ROLE-planner`, PRODUCT-DISCOVERY mode. |
| **Required inputs** | `INIT-nnnn`; the packet; the accepted `REQ-` set with acceptance criteria and sequencing notes; `assessment.md` (the authorising round) and `impact.md`; the chosen-option `PD-`. |
| **Required outputs** | `initiatives/INIT-nnnn-<slug>/technical/coherence.md`, whose **first line** is `Verdict: coherent \| defects-open \| regression-required`; a `question` per defect needing a product answer. |
| **Deterministic rules / checks** | The verdict is mechanical: `coherent` = zero open defects; `defects-open` = defects the PM can resolve by rewriting or resequencing stories; `regression-required` = a defect invalidating the chosen option's feasibility verdict, which returns the initiative to SOLUTION_EXPLORATION rather than being noted. Independence: a hidden prerequisite is a defect, a stated sequencing note is not. Sequencing: an implied order contradicting `impact.md` dependency direction is a defect. Assumed capability: a story whose criteria need a capability scanned `absent` or `partial`, with no story creating it, is a defect. Verdict drift: a set implying work the assessment never assessed is `regression-required`. Defects name the `REQ-` and the check, never a person. **The architect never edits a `REQ-`, an acceptance criterion, or the out-of-scope section.** The §3.25 prohibited-detail list applies unchanged — this is not an execution plan and not a ticket dependency graph. |
| **Artifacts read** | `requirement`, `initiative`, `decision`, `technical-assessment`. |
| **Artifacts written** | `technical-assessment` (`coherence.md`); `question` as escalation only. |
| **May block lifecycle progression** | **Yes** — `regression-required` forces a regression to SOLUTION_EXPLORATION, and DECOMPOSITION does not exit on an unaddressed `defects-open`. |

---

### 3.27 SKILL-compile-delivery-manifest — **[V]**

| Field | Contract |
| --- | --- |
| **Purpose** | Compile the approved story set into the initiative's canonical **delivery manifest** — the packet's machine-readable twin, and the only artifact from which an initiative's execution can be scheduled. It carries no fact the packet and the stories do not already state; it makes that set *schedulable* rather than adding to it. |
| **Trigger** | Phase ENGINEERING_READY, immediately after `SKILL-prepare-engineering-handoff` writes the packet, on the same non-void `READY` verdict. |
| **Invoking actor** | `ROLE-product-manager`. Not delegable. |
| **Required inputs** | `INIT-nnnn`; the `## Handoff packet` section; the accepted `REQ-` records with `depends_on`, `readiness`, and `## Sequencing`; the readiness verdict and its story-set digest; the `CAP-`/`DES-`/`PD-` references the packet lists. |
| **Required outputs** | `initiatives/INIT-nnnn-<slug>/delivery/manifest.md` conforming to [`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md): frontmatter at `band_owner: product`, `accepted_on: none`, `completion: pending`, `dispatch_unit: ticket`; §5.1 identity, §5.2 shared references, §5.3 story table, §5.4 ordering constraints; §5.5–§5.8 present as empty headings. |
| **Deterministic rules / checks** | D1 Preconditions: `phase` is ENGINEERING_READY or HANDOFF, the verdict is `READY` and not `void`, every named story is `accepted` and `engineering-ready`. D2 `story_set_digest` equals the digest the verdict was issued against; a mismatch stops the skill and regresses to READINESS rather than being reconciled here. D3 `Depends on` copies `depends_on` verbatim; only its `REQ-` entries are ordering edges. D4 Every edge is restated in §5.4 as the ordering it implies — a graph nobody rendered is a graph nobody checked. D5 The story graph is acyclic. D6 `Wave (planned)` is the longest path from any root, derived and never authored. D7 The execution band (§5.5–§5.8) is left empty; writing one row there is out of authority. D8 This skill writes no ticket row and no `delivery/state.md`. Ticket creation is a separate, later step of the same phase — `SKILL-create-tickets-from-stories` (§3.31), which writes `tickets.md` and never this file; `delivery/state.md` belongs to the fan-out session. D9 No readiness judgement: `readiness` is copied, never derived. D10 `id: DM-INIT-nnnn` allocates no counter and does not touch `manifest.yaml`. D11 Invariants `M1`–`M8` of the schema hold, including `M7` (no HLD, plan, breakdown, or estimate). D12 A manifest already at `band_owner: delivery` is not rewritten — the schema's §8 re-issue procedure applies instead. |
| **Artifacts read** | `product-state`; `requirement`; `initiative`; `design`; `decision`; `question`; the requirement and design indexes. |
| **Artifacts written** | `delivery-manifest` — **product band only** (`../manifest.yaml` `roles:`). |
| **May block lifecycle progression** | **Yes** — D1, D2, and D5 each stop the handoff, and D2 forces a regression. |

---

### 3.28 SKILL-batch-fanout — **[C]**

| Field | Contract |
| --- | --- |
| **Purpose** | Turn an accepted delivery manifest into concurrent execution: compute which dispatch units the dependency graph currently permits, dispatch one independent ticket-scope `ROLE-orchestrator` per unit up to a concurrency cap, and record what was dispatched and what came back. It is a **mechanism**, not a gate — it schedules a decision that was already made upstream. |
| **Trigger** | After `ROLE-orchestrator` accepts the handoff (`delivery/state.md` exists and the manifest is at `band_owner: delivery`) and whenever a unit reaches `complete`, freeing a slot. Its unchanged **list mode** — a set of ticket_codes the user named, with no manifest — has no product-memory contract and is out of scope here. |
| **Invoking actor** | `ROLE-orchestrator` at **initiative scope** only. A ticket-scope orchestrator never runs it ([`delivery-fanout.md`](delivery-fanout.md) §4). |
| **Required inputs** | `delivery/manifest.md` at `band_owner: delivery`; the initiative's `delivery/tickets.md`; `max_parallelism`. |
| **Required outputs** | Updated §5.5 dispatch-unit rows (state, `Attempts`, `Last outcome`, `Dispatch ref`, `Updated`); one append-only §5.7 ledger row per event; §5.8 `completion` set when the run terminates; a compact report naming what shipped and what is blocked. |
| **Deterministic rules / checks** | B1 Preconditions `P1`–`P5` of `delivery-fanout.md` §5 all hold, or nothing is dispatched. B2 Eligibility is exactly `E1`–`E7` (§6.1): dependencies `complete`, no `blocked`/`void` story, no open `blocker` `Q-`, `completion: pending`, free capacity, and no in-flight unit sharing a §5.4 mutual-exclusion group. B3 Dependency-freedom is read from the graph only, never from story prose. B4 Waves are a derived grouping, never a barrier — a unit whose dependencies are complete dispatches regardless of its wave-mates. B5 Completion requires the dispatched orchestrator's terminal success line **and** the unit's PR(s) merged to the default branch (schema §6.5: merged at SHIP by `release-coordinator` on green checks; verified by a GitHub read, backstop-merged by the fan-out session) — never recorded from memory or narration. B6 A failure blocks nothing but its own dependents, which become `unreachable`; siblings continue. B7 **No automatic retry, ever** — `failed`/`blocked` → `eligible` is human-authorised only. B8 No product judgement: no readiness assessment, no product discovery, no reading of acceptance criteria; `engineering-ready` is a flag it checks, never a conclusion it reaches. B9 Writes the execution band only — never the product band, `delivery/state.md`, `delivery/tickets.md`, or any story's product content. B10 The manifest is authoritative for dispatch state; `~/Factory/Artifacts/projects/<PROJECT>/batches/<slug>.md` is a convenience mirror, rewritten from it on disagreement. B11 It never closes an initiative. |
| **Artifacts read** | `delivery-manifest`; `tickets`. |
| **Artifacts written** | `delivery-manifest` — **execution band only**. |
| **May block lifecycle progression** | No. It stops dispatching and reports; every judgement that could block belongs to a role upstream of it. |

---

### 3.29 SKILL-resume-initiative — **[C]**

> Declared at `~/.claude/skills/resume-initiative/SKILL.md`. Contract row
> added here to close an asymmetry: this skill was declared
> and load-bearing for `P1`, `P3`, `F2`, `F7` of
> [`delivery-fanout.md`](delivery-fanout.md), but carried no entry in this
> catalog.

| Field | Contract |
| --- | --- |
| **Purpose** | Be the receiving half of the product/engineering handoff: determine, from an initiative's files alone and with no session context, whether it is still product-side, ready for delivery to begin, or already mid-delivery, and dispatch or resume exactly one role. This is the delivery-side complement to `SKILL-prepare-engineering-handoff` (§3.10) — together they are the whole handoff; no third procedure exists between them. |
| **Trigger** | `ROLE-orchestrator` picking up an initiative with no session context — the cold-start read for delivery, at initiative scope. |
| **Invoking actor** | `ROLE-orchestrator`. |
| **Required inputs** | `INIT-nnnn`; `product/state.md`; `delivery/state.md`, if it exists; the initiative's accepted requirements, tickets, and design exports as the stage requires. |
| **Required outputs** | Either: a dispatch to `ROLE-product-manager` with the session stopped, when `product/state.md:phase` is not `HANDOFF`; or a corrected `stage` (with a stage-log row explaining the correction) and exactly one role dispatched for that stage; or, when an `open` `blocker` question touches the initiative, `blocked` with `blocked_by` populated and nothing dispatched. In every case, `state.md` names one `next_action` and one role before the session ends. |
| **Deterministic rules / checks** | Refuses to begin delivery on an initiative whose `product/state.md:phase` is not `HANDOFF` — this is the enforcement point of `HOOK-handoff-conformance` (§3.13 of [`lifecycle-hooks.md`](lifecycle-hooks.md)) on the receiving side. A missing `product/state.md` on an initiative with no accepted requirements is pre-INTAKE, still product-side, never defaulted to `stage: define`. `stage` is verified against artifacts, not trusted from the file alone — an initiative with accepted requirements and no state file is mid-flight, not new. `F2` `band_owner` transfers from `product` to `delivery` exactly once, in the same write that creates `delivery/state.md`. Dispatches exactly one role per invocation; never two roles at once on one initiative. |
| **Artifacts read** | `product-state`; `delivery-state`; `requirement`; `tickets`; `design`; `question`. |
| **Artifacts written** | `delivery-state` (created on first acceptance; `stage`, stage-log rows, `next_action`, `blocked_by` thereafter); `delivery-manifest` (`band_owner` transfer only, per `F2`). |
| **May block lifecycle progression** | **Yes** — refuses to begin delivery on an initiative not at `phase: HANDOFF`, and stops rather than dispatches while a `blocker` question is open. |

---

### 3.30 SKILL-sync-tickets — **[V/C]**

> Declared at `~/.claude/skills/sync-tickets/SKILL.md`, an execution-band
> `ROLE-orchestrator` skill implemented outside this repository. Contract row
> added here for the same reason as §3.29 — load-bearing for `P1`, `P3`,
> `F2`, `F7` of [`delivery-fanout.md`](delivery-fanout.md) with no prior entry
> in this catalog. This row states the contract; it does not change the
> declaration.

| Field | Contract |
| --- | --- |
| **Purpose** | Refresh the committed ticket manifest against the external issue tracker, confirm every ticket maps to at least one requirement, and repair the delivery manifest's dispatch-unit projection **from** `delivery/tickets.md` — never the reverse ([`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) §7). |
| **Trigger** | Whenever `ROLE-orchestrator`, `ROLE-planner`, or `ROLE-release` needs current ticket state; the mirror is advisory once past its freshness window (`manifest.yaml:context.freshness_windows.tickets`). |
| **Invoking actor** | `ROLE-orchestrator`; `ROLE-planner`; `ROLE-release`. |
| **Required inputs** | The initiative's `delivery/tickets.md` and its `synced_on`; current tracker state; the initiative's `delivery/manifest.md`, if it exists. |
| **Required outputs** | Rewritten ticket rows (key, title, requirements, `depends_on`, branch, PR, status); `synced_on` set to today; the global `product/delivery/tickets.md` union and board updated; the computed frontier (tickets with no unmet `depends_on`) — an empty frontier on unfinished work is a graph defect, raised as a `Q-`, not silently accepted. |
| **Deterministic rules / checks** | `M6` the manifest's dispatch-unit projection (§5.5) is reconciled against the ticket rows just written — every unit resolves to a ticket, and its `Depends on` equals this file's ticket edges unioned with the transitive `REQ-` edges the manifest's story table implies. Repair runs **from this file into the manifest, never the reverse**: this skill owns tracker keys, the ticket↔story mapping, branches, PRs, and status; the manifest owns the approved story set, its waves, and dispatch state. Units for new tickets are added `not-eligible`; units whose ticket disappeared are marked `void` with a ledger row. Never touches the manifest's product band. A manifest still at `band_owner: product` is not yet accepted and is left alone. If the tracker is unreachable: `synced_on` stays untouched, the manifest becomes **advisory** (still usable for planning — the dependency graph does not go stale the way status does), and nothing is fabricated. |
| **Artifacts read** | `tickets`; the external issue tracker; `delivery-manifest`. |
| **Artifacts written** | `tickets` (initiative-local and global union); `delivery/board.md`; `delivery-manifest` (execution band's dispatch-unit projection only, per `M6`). |
| **May block lifecycle progression** | **No** directly — an empty frontier on unfinished work raises a `Q-`, which does. |

---

### 3.31 SKILL-create-tickets-from-stories — **[C]**

> Declared at `~/.claude/skills/create-tickets-from-stories/SKILL.md`. The last
> act of the product track: it is what makes the deliverable a set of
> `ticket_code`s rather than an initiative a delivery role must first convert.

| Field | Contract |
| --- | --- |
| **Purpose** | Turn every accepted, engineering-ready `REQ-` story into a real Ariadne ticket and write the `REQ- → ticket` mapping into `delivery/tickets.md`, so what leaves HANDOFF is a set of tracker keys. It is a **transcription**, not a judgement: story content is frozen and is copied, never authored. |
| **Trigger** | Phase HANDOFF, from `SKILL-prepare-engineering-handoff` step 14b, after §3.27 has written the manifest. |
| **Invoking actor** | `ROLE-product-manager`. The project resolution and the `X1`–`X14` verification are not delegable; the transcription itself runs on a **Sonnet** subagent (`X9`) — translating a story's product-identifier-laden prose into a self-contained ticket body is sentence-level judgement, not typing. |
| **Required inputs** | `INIT-nnnn`; the `## Handoff packet`; the manifest's §5.3 story table; the accepted `REQ-` records; a resolvable Ariadne project; reachable Ariadne MCP tools. |
| **Required outputs** | One Ariadne ticket per accepted story, created or updated; `delivery/tickets.md` rows (`Ticket`, `Title`, `Initiative`, `Requirements`, `Depends on`) per `../schemas/index-formats.md`; the global `product/delivery/tickets.md` union; `next_action` naming the created `ticket_code`s. |
| **Deterministic rules / checks** | `X1`–`X14` of the declaration. In particular: `X2` every tracker key comes from an Ariadne response — no key is constructed, guessed, or derived from a `REQ-`, which is the tracker-owns-identity rule (`identifiers.md` §5) discharged by calling the real tracker rather than deferring it. `X5` acceptance criteria are transcribed one for one with their **testable content** unchanged — trigger, subject, expected result — and a story whose criteria cannot be transcribed leaves a `Q-` and stays ticketless rather than being repaired here; deleting an inline product-identifier citation is not a reword, and `X12`'s zero-identifier lint on title and body is absolute with no section exemption. `X14` every cited criterion goes through the declaration's §3 citation-stripping procedure — attributive citations deleted, load-bearing references translated to this run's tracker keys or a neutral phrase — with each translation named in the transcription report. `X7` no issue field, label, or description text marks a ticket as pre-verified or exempt from any downstream stage — a ticket created here is an ordinary ticket and runs the same ticket-scope DESIGN/PLAN verification as any other. `X6` re-running creates no duplicate. `X8` writes `tickets` only. |
| **Artifacts read** | `product-state`; `requirement`; `delivery-manifest` (product band); `initiative`; `tickets`; the external tracker. |
| **Artifacts written** | `tickets` — the initial mapping columns only; `Branch`, `PR`, and `Status` belong to the delivery roles thereafter. |
| **May block lifecycle progression** | **Yes** — an unreachable tracker or an unresolvable project stops HANDOFF with nothing written, and a story that cannot be transcribed does not become a ticket. |

---

## 4. Candidate disposition — merged, removed, and repaired

Fourteen candidates were evaluated. Nine survive as specified, two were absorbed
into existing skills, three were merged into siblings, one was removed
outright, and two skills were added.

| Candidate | Disposition | Why |
| --- | --- | --- |
| `hydrate-product-context` | **Kept** (exists, unchanged) | Already the single entry procedure; §3.1 restates its contract. |
| `triage-product-request` | **Kept** (new) | The INTAKE classification step had no owner: `SKILL-define-initiative` mixed it with definition work, so "this is already built / already rejected / too broad to be an initiative" was decided in the same breath as writing the initiative. Splitting it makes the non-`new-initiative` outcomes first-class. |
| `discover-product-problem` | **Kept** (new) | DISCOVERY had a phase but no procedure. Its sourcing rules (S1, S2) are what stop discovery from being assertion. |
| `define-product-requirements` | **Kept** (new), **supersedes `SKILL-define-initiative`** | The existing skill spans INTAKE and PRODUCT_DEFINITION at once, and its step 7 creates `delivery/state.md` — a direct contradiction of `~/.claude/agents/product-manager-orchestrator.md` §3, which forbids the PM from ever writing that file. The split repairs both: triage owns INTAKE, this owns definition, and neither touches delivery state. |
| `manage-product-decisions` | **Merged → `SKILL-record-decision`** | "Managing" decisions is three things that already have homes: *finding* the decisions in force is hydration and triage; *recording and superseding* is `SKILL-record-decision`; *obeying* them is the precedence order in §7.1. A separate manager would own no artifact. |
| `coordinate-solution-exploration` | **Kept** (new) | The phase most likely to collapse into the PM writing its own options. X1/X2/X5 are the checks that prevent it. |
| `validate-requirement-coverage` | **Kept** (new), absorbing `build-traceability-map` | The map is the intermediate the coverage check computes, not a deliverable in its own right; producing one without checking it against V1–V11 is a report nobody reads. One skill, one defect list. |
| `decompose-product-stories` | **Kept** (new), absorbing `write-acceptance-criteria` | A story without acceptance criteria is never a valid resting state — §10.3.3 makes criteria constitutive of the story. A separate skill would create exactly the intermediate state the definition of done forbids. The deterministic *shape* check for criteria lives in K1 and V5. |
| `write-acceptance-criteria` | **Merged → `SKILL-decompose-product-stories`** | See above. |
| `build-delivery-graph` | **Removed** | Execution sequencing and ticket dependency graphs belong to `ROLE-planner` and `ROLE-orchestrator` via `SKILL-sync-tickets`; `~/.claude/agents/product-manager-orchestrator.md` §3 explicitly excludes them. The PM's legitimate sequencing output is per-story sequencing notes (K7) and the suggested sequence in the handoff packet. A PM-owned delivery graph would put two roles on the ticket manifest. |
| `build-traceability-map` | **Merged → `SKILL-validate-requirement-coverage`** | See above. |
| `assess-product-readiness` | **Merged → `SKILL-review-product-readiness`** | The readiness verdict is deliberately not the PM's (§9, two-key gate). A PM-side assessment skill would create a second readiness authority and let the gated actor grade itself. The PM's legitimate pre-check is §3.8, which produces defects, not a verdict. |
| `checkpoint-product-state` | **Kept** (exists, unchanged) | Already the single exit procedure. |
| `prepare-engineering-handoff` | **Kept** (new), covering ENGINEERING_READY **and** HANDOFF | The two phases share one artifact — the handoff packet — and one failure mode: transferring a definition that is not self-contained. Splitting them would put H1–H7 in one skill and the single log row they authorise in another. |

### Designer candidates (Prompt 5)

| Candidate | Disposition | Reason |
| --- | --- | --- |
| loading relevant design context | **Merged → `SKILL-hydrate-product-context`** | The designer needs the same authoritative working set every other role needs, resolved by the same rules. `REQ-` identifiers are already stable and globally indexed, so there is nothing left for a design-specific loader to derive; a second loader would be a second set of freshness and supersession rules that could disagree with the first. |
| modeling user journeys | **Kept → `SKILL-ux-flow-modeling`** | §3.18. |
| interaction-flow design | **Merged → `SKILL-ux-flow-modeling`** | Journeys and flows are one model at two zoom levels, produced in one pass from the same inputs, and a flow whose journey is written by a different procedure drifts from it. |
| enumerating experience states | **Kept → `SKILL-experience-state-enumeration`** | §3.19. Its value is the fixed matrix, which only works if one procedure owns it. |
| auditing designs against requirements | **Kept → `SKILL-design-requirement-audit`** | §3.20. The only `[V]` skill on the design side and the gate on `draft`. |
| surfacing unresolved product decisions | **Kept → `SKILL-design-decision-escalation`** | §3.21. This is the procedure that enforces the designer's one inviolable rule; it needs its own deterministic materiality test and its own artifact type. |
| preparing design handoff | **Merged → `SKILL-capture-design`** | `SKILL-capture-design` already produced the `DES-` records, the local export, and the index rows — which *is* the handoff. A separate packaging skill would write the same artifacts, giving two writers to `design/index.md`. Its durable-reference identity fields and supersession rules were absorbed into §3.22 instead. |

Six designer skills were designed; four survive as designer-owned skills, plus
`SKILL-capture-design`, which the designer already owned.

### Architect candidates (Prompt 6)

Six candidates were evaluated against the existing technical architect
(`ROLE-planner`). Four survive; two are merged.

| Candidate | Disposition | Reason |
| --- | --- | --- |
| product feasibility assessment | **Kept → `SKILL-product-feasibility-assessment`** | §3.25. The only architect output that is *binding* on the product manager, so it needs its own closed verdict set, its own artifact, and its own prohibited-detail list. |
| relevant capability discovery | **Kept → `SKILL-platform-capability-scan`** | §3.23. Different phase (DISCOVERY), different question (what exists, not what is possible), and read-only. Folding it into the assessment would let "what we could build" be written in the same pass as "what is there", which is exactly how an assumed capability becomes evidence. |
| system impact mapping | **Kept → `SKILL-system-impact-mapping`** | §3.24. The one procedure both architect modes run: discovery bounds an option with it, and `SKILL-hld-authoring` builds its system inventory from it instead of rebuilding a map that could then disagree. |
| technical constraint identification | **Merged → `SKILL-product-feasibility-assessment`** | A constraint that is not attached to a verdict binds nothing. Separating them produces a constraint list the PM may read as advisory and a verdict that does not name what qualifies it — the two failures the binding rule in `product-manager-orchestrator` §7.2 exists to prevent. |
| risk / complexity characterization | **Merged → `SKILL-product-feasibility-assessment`** | Same artifact, same pass, same inputs. Separated, it becomes the "feasible, but actually structural" gap: a clean verdict recorded in one place and its real cost in another the PM need not read. The complexity band is therefore a mandatory column of the verdict table, not a document. |
| decomposed-ticket technical-coherence review | **Kept → `SKILL-story-set-technical-coherence`** | §3.26. Different phase, different input (accepted stories, not options), and the only `[V]` skill on the architect side. Its verdict can force a regression, which no `[R]` skill may do. |

**No separate Product Architect role was created.** The
reasoning is that a second technical authority would have to
re-derive the same system knowledge and could then disagree with the first, and
every isolation requirement the discovery mode has is a *prohibition on output*,
which a mode gate enforces and a separate agent does not.

### Added beyond the candidate list

| Added skill | Why it materially improves the library |
| --- | --- |
| `SKILL-escalate-product-question` | The silence rule (§4.3) is the role's single most consequential invariant, and it was spread across ten phase descriptions with no procedure enforcing it. Making escalation a skill gives it deterministic rules (E1–E9), one artifact type, and one place to fix when it fails. **Determinism and validation.** |
| `SKILL-delegate-and-record-consultation` | Three delegation contracts (§11.2, §11.3, §11.4) share one shape: one question, identifiers not conversation, advisory until recorded, unavailable ⇒ `Q-`. Factoring it out removes the same eight rules from three skills and gives the `Consultation log` a single writer. **Reuse and separation of responsibility.** |

### Not added, deliberately

- **A convergence skill.** SOLUTION_CONVERGENCE is `SKILL-record-decision` plus
  `SKILL-advance-product-phase`; a third procedure would own nothing.
- **A regression skill.** Regression is already a branch of
  `SKILL-advance-product-phase` (A5, A6). Separating it would create two writers
  of `phase`.
- **An artifact-integrity skill.** D1–D18 already run inside hydration and
  checkpoint. A third caller would duplicate them and could disagree.

## 5. Lifecycle hook bindings

[`lifecycle-hooks.md`](lifecycle-hooks.md) names sixteen lifecycle gates
`HOOK-<slug>` and binds each to the skills below. A hook is a *moment plus a
verdict*; the checks themselves stay in the contract rows of §3 and in the
`D`/`R`/`C`/`M`/`E`/`P` rule sets they cite. Where a hook's stated checks and a
skill's contract row disagree, that is a defect to repair, not a variant to
tolerate.

Nine rule ids in this catalog were added by that document and exist nowhere
else: `HY1`–`HY2` (§3.1), `A9`–`A10` (§3.13), and `CP1`–`CP5` (§3.14). No skill,
role, artifact type, or identifier space was created for the hooks — a register
that needed its own skills would be the second lifecycle framework
`lifecycle-hooks.md` §1 forbids.

| Hook | Primary skill | Supporting skills |
| --- | --- | --- |
| `HOOK-canonical-root` | §3.1 `SKILL-hydrate-product-context` | — |
| `HOOK-hydrate` | §3.1 `SKILL-hydrate-product-context` | — |
| `HOOK-initiative-resolved` | §3.2 `SKILL-triage-product-request` | §3.1, §3.14 |
| `HOOK-phase-entry` | §3.13 `SKILL-advance-product-phase` | — |
| `HOOK-stale-context` | §3.1 `SKILL-hydrate-product-context` | §3.16 `SKILL-supersede-artifact`, `SKILL-sync-tickets` |
| `HOOK-assumption-capture` | §3.11 `SKILL-escalate-product-question` | §3.21 `SKILL-design-decision-escalation`, §3.2, §3.14 |
| `HOOK-decision-capture` | §3.6 `SKILL-record-decision` | §3.13 |
| `HOOK-identifier-integrity` | §3.15 `SKILL-allocate-identifier` | §3.14, §3.8 |
| `HOOK-traceability` | §3.8 `SKILL-validate-requirement-coverage` | §3.7 `SKILL-decompose-product-stories` |
| `HOOK-design-coverage` | §3.20 `SKILL-design-requirement-audit` | §3.22 `SKILL-capture-design`, §3.19 `SKILL-experience-state-enumeration`, §3.8 |
| `HOOK-dependency-graph` | §3.26 `SKILL-story-set-technical-coherence` | §3.8, §3.27, §3.28 |
| `HOOK-readiness` | §3.9 `SKILL-review-product-readiness` | §3.8 |
| `HOOK-handoff-conformance` | §3.10 `SKILL-prepare-engineering-handoff` | `SKILL-resume-initiative` |
| `HOOK-manifest-conformance` | §3.27 `SKILL-compile-delivery-manifest` | `SKILL-resume-initiative`, `SKILL-sync-tickets` |
| `HOOK-fanout-eligibility` | §3.28 `SKILL-batch-fanout` | `SKILL-sync-tickets` |
| `HOOK-checkpoint` | §3.14 `SKILL-checkpoint-product-state` | §3.15 |

## 6. Implementation notes

These are consequences of adopting this catalog, recorded so the next session
does not rediscover them. **No runtime code and no individual skill files are
written yet.**

1. The eight skill files named in §3.2–§3.5, §3.7, §3.10, §3.11, §3.12 are
   written and declared at `~/.claude/skills/<slug>/SKILL.md`. §3.8 was already
   declared at `~/.claude/skills/validate-requirement-coverage/SKILL.md`. The
   designer skills §3.18–§3.21 **are** declared, in `~/.claude/skills/`; what
   this catalog holds is their contract. Each follows
   [`../templates/skill.md`](../templates/skill.md) and marks its steps `[D]`
   or `[J]` as `~/.claude/skills/advance-product-phase/SKILL.md` does.
2. `SKILL-define-initiative` is retired, superseded by
   `SKILL-define-product-requirements` and `SKILL-triage-product-request`; it
   has no declaration in `~/.claude/skills/`. Any reference to it that names a
   phase or a `§` section belongs to whichever of the two successors owns that
   section.
3. The skill lists in the `~/.claude/agents/product-manager-orchestrator.md` and
   `~/.claude/agents/product-readiness-reviewer.md` declarations are updated in the
   same commit as the skill files they name — never earlier. Those declarations
   live outside this repository, so the update is manual and this note
   is the reminder.
4. The `used_by_roles` of each new skill must be a role that exists in
   the `roles:` registry in `product/manifest.yaml`, and each skill must write only artifact types listed in
   that role's `Writes` column.
5. The architect skills §3.23–§3.26 **are** declared, in `~/.claude/skills/`,
   in the same change that added `technical-assessment` to `ROLE-planner`'s
   `writes` list. `SKILL-hld-authoring` gained one section (reuse the discovery
   record, never re-litigate a recorded verdict) and is otherwise unchanged; it
   remains specified in its own file because it writes no `product/` artifact.
6. This catalog is authoritative for skill **contracts**. Where a written skill
   file and this catalog disagree, the disagreement is a defect to repair, not a
   variant to tolerate — as with any index in this repository.
