---
id: ARCH-engineering-handoff
type: architecture
title: Product-to-engineering handoff contract
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Product-to-engineering handoff contract

## 1. What this document is

The product track produces **many approved stories** for one initiative. The
engineering track accepts **one engineering-ready story at a time** and drives it
through `DEFINE → DESIGN/HLD → EXECUTION PLAN → IMPLEMENT → VERIFY/REVIEW →
SHIP`. This document is the seam between them.

It specifies four things and nothing else:

1. the **canonical engineering-ready story schema** — normatively defined in
   [`../schemas/frontmatter.md`](../schemas/frontmatter.md) §"Engineering-ready
   product story", which this document references and never restates;
2. the **embed-versus-reference rule** that decides what a story carries and
   what it points at;
3. the **engineering assumption register** — what a receiving role may assume
   the moment a story is `ENGINEERING_READY`, and what it may not;
4. the **boundary** between product definition, product feasibility, engineering
   HLD, and execution planning.

It is a contract between roles, not a procedure. The procedures that execute it
are `SKILL-prepare-engineering-handoff` (product side) and
`SKILL-resume-initiative` (delivery side), contracted in
[`skill-library.md`](skill-library.md) §3.10 and §2.

## 2. The two sides

| | Product side | Delivery side |
| --- | --- | --- |
| Owning role | `ROLE-product-manager` | `ROLE-orchestrator` |
| State file | `initiatives/INIT-nnnn-*/product/state.md` | `initiatives/INIT-nnnn-*/delivery/state.md` |
| Unit of work | the initiative, decomposed into `REQ-` stories, then into tickets | one ticket at a time |
| Terminal state | `phase: HANDOFF` | `stage: done` |
| Gate | readiness verdict `READY` or `READY-with-known-issues` | none — the gate is upstream |

The handoff is **one-directional and one-time per initiative**. It does not
create a shared state file, a negotiation, or a synchronous acknowledgement.
`SKILL-prepare-engineering-handoff` `H9` is explicit: the product manager never
writes `delivery/state.md` and never waits for it.

### 2.1 The handoff object

**What is handed over is a set of `ticket_code`s.** The delivery side accepts a
ticket key or a raw engineering ask and nothing else; it has no initiative
scope, does not accept handoffs, and does not convert stories into tickets. The
product track therefore ends by creating them
(`SKILL-create-tickets-from-stories`, §2.3).

The handoff object's durable record on disk is the `## Handoff packet` section of
`product/state.md`, plus the `accepted` `REQ-` records it names, plus the
initiative's `delivery/manifest.md` — the packet's machine-readable form,
compiled from it in the same phase and carrying no fact the packet and the
stories do not already state ([`delivery-fanout.md`](delivery-fanout.md)). Nothing else is handed over. There is no separate handoff file, no export, no ticket description
that duplicates the story, and no message whose content is not also on disk — a
handoff that exists only in a transcript did not happen.

### 2.2 There is nothing to acknowledge

The product manager's obligations are discharged the moment the tickets exist.
It does not write `delivery/state.md`, does not wait for one, and hands nothing
to an agent that must first accept it. A `ticket_code` needs no acceptance
protocol: it is dispatched to a ticket-scope `ROLE-orchestrator` by a human or
by a fan-out session, and that orchestrator determines everything it needs from
disk.

Initiative-scope delivery state — `delivery/state.md`, and the manifest's
execution band at `band_owner: delivery` — is owned by the **fan-out session**
that runs `SKILL-resume-initiative` and `SKILL-batch-fanout`
([`delivery-fanout.md`](delivery-fanout.md) §4), not by any agent driving a
single ticket. An initiative whose tickets are dispatched one at a time by a
human needs none of it.

### 2.3 Stories, tickets, and the engineering lifecycle

A `REQ-` story is the **product** unit. A ticket is the **execution** unit.
They are related, never equated:

- one story becomes **one or more** tickets; a ticket names ≥1 story in the
  `Requirements` column of `delivery/tickets.md`;
- a ticket never spans two initiatives;
- the tracker owns ticket identity (`identifiers.md` §5); the product side never
  invents a ticket key, and the delivery side never re-encodes a `REQ-`
  identifier into one;
- the engineering orchestrator's per-ticket working directory
  (`~/Factory/Artifacts/projects/<PROJECT>/tickets/<ticket_code>/`) is session-local, per
  [`adoption-notes.md`](adoption-notes.md). It may be derived from a story; a
  story may never be derived from it.

The `REQ- → ticket` mapping is written into `delivery/tickets.md` by
`ROLE-product-manager`, as the **last act of HANDOFF**, and is the only place
that mapping is authoritative. The procedure is
`SKILL-create-tickets-from-stories`, declared at
`~/.claude/skills/create-tickets-from-stories/SKILL.md` and invoked from
`SKILL-prepare-engineering-handoff` step 14b. It calls Ariadne for every key —
the tracker-owns-identity rule above is unchanged and is exactly why the
creation must hit the real tracker rather than be deferred to someone who might
invent one. Because the tickets already exist, `delivery-fanout.md` §5 `P3` is
satisfied before any delivery role runs.

The product side owns **only** the initial mapping: `Ticket`, `Title`,
`Initiative`, `Requirements`, and `Depends on`. `Branch`, `PR`, and `Status`
are written by the delivery roles from that point on, and the product manager
never returns to them.

## 3. Embedded versus referenced

A story must be **locally executable and globally traceable**. It must not be a
retelling of the initiative.

**The test.** A story *embeds* what an implementing agent must **obey**. It
*references* what that agent may want to **understand**. If ignoring the
information would produce wrong software, embed it; if ignoring it would only
produce an uninformed implementer, reference it.

| Embedded in the story | Referenced by identifier |
| --- | --- |
| Its identifier, parent initiative, and status | The initiative's narrative, discovery evidence, and success measures |
| The user/product outcome it serves, stated in one sentence | The full outcome statement and the other stories serving it |
| Its scope boundary and its non-goals | The initiative-level out-of-scope section |
| The product behaviour: defaults, ordering, error and empty states, permissions, and any copy whose wording changes what the user understands | The options that were considered and rejected (`PD-`, `product/state.md` §Options) |
| Every acceptance criterion, in full | Prior superseded versions of this story |
| The **binding** technical constraints, one line each, each citing its source | The reasoning behind those constraints (`technical/assessment.md`, by round) |
| Its dependency list and readiness status | Design pixels and exports (`DES-`, resolved to a `local_export` path) |
| Its observability and rollout requirements, where applicable | Decision rationale (`PD-`), question threads (`Q-`), capability history (`CAP-`) |

Three rules make this stable:

1. **One authority per fact.** A fact embedded in a story is *stated* there and
   *not restated* anywhere else on the product side. A fact referenced by a
   story is not summarised in it beyond the one line that makes the reference
   legible.
2. **Never embed rationale.** A story says what must be true, not why the
   product manager believes it. Rationale belongs to `PD-` records, which is
   what stops a future session re-litigating a settled question.
3. **Never embed history.** Neither the initiative's history nor the story's
   own. Supersession chains carry that, and a story that narrates its past is
   a story whose current statement is no longer obvious.

A story that violates rule 1 fails `R18` (self-containment) in the direction of
duplication rather than omission; both are findings.

## 4. The engineering assumption register

This is the operative half of the contract. When a story is
`ENGINEERING_READY` — the initiative's `product/state.md` carries a `READY`
or `READY-with-known-issues` readiness verdict that is not `void`,
`phase: HANDOFF`, and the story is `status: accepted` and named in the
handoff packet — a receiving role **may assume the following without
re-verifying them**, and is entitled to treat a later contradiction as an
upstream defect rather than as its own problem.

| # | A receiving role may assume | Guaranteed by |
| --- | --- | --- |
| `A1` | **Product scope is resolved.** What is in and out of this story is decided; the boundary is written, not implied. | `R11`, `R14`; the story's Scope and Non-goals sections |
| `A2` | **Product behaviour is approved.** Defaults, ordering, error and empty states, and permission consequences are stated by the product manager, not left to be invented. | `R16`, `R17` |
| `A3` | **Acceptance criteria are authoritative and testable.** They are the definition of done for VERIFY, and can be evaluated pass/fail without asking their author. A story with a user-facing surface additionally carries a `composition:` criterion binding its supported display matrix and data-bearing label integrity, so VERIFY has a rendering bar and not only a semantic one. | `R5`, `R13` |
| `A4` | **Required product decisions are resolved.** Every escalation-class ambiguity carries a `PD-` or a closed `Q-`; no `blocker` `Q-` names the story. | `R8`, `R10` |
| `A5` | **Feasibility has been reviewed.** A non-`infeasible` feasibility verdict exists, the chosen option cites it, and a terminal-round story-set coherence verdict exists with every blocking finding dispositioned, which `R9` judged still describes the story set as handed off (currency is judged at review, not compared by date at a gate). | `R9` |
| `A6` | **Design exists for every user-facing surface**, as a committed `local_export` reachable without the external design tool. | `R4` |
| `A7` | **Traceability holds.** Every identifier the story names resolves through its index; the story maps upward to an outcome element and a `CAP-`. | `R3`, `R12` |
| `A8` | **Dependencies are explicit and acyclic**, and no accepted story depends on an unresolved upstream. | `R6`, `R7`, `R10` |
| `A9` | **Everything remaining is an implementation decision.** Any decision the story leaves open is one an engineering role is competent and authorised to make. | `R17`, `R18` |

`R1`–`R18` are the readiness criteria in
[`skill-library.md`](skill-library.md) §3.9.2. They are stated there once and
referenced, never restated, here.

### 4.1 What ENGINEERING_READY does not license

A receiving role may **not** assume any of the following, and must not act as
though the product side has already decided them:

| # | Not assumed | Owned by |
| --- | --- | --- |
| `N1` | That an HLD exists, or that the story's system impact has been designed | `ROLE-planner`, after handoff |
| `N2` | That the work fits one system, or that no cross-system contract is needed | `ROLE-planner` (`SKILL-hld-authoring`'s scope test) |
| `N3` | That an execution plan, task graph, or estimate exists | `ROLE-tech-lead` |
| `N4` | That the ticket graph beyond the story-derived `Depends on` edges has been drawn, or that any ticket has a branch, a PR, or a plan. Tickets themselves **do** exist — they are created at HANDOFF | `ROLE-orchestrator`; creation by `ROLE-product-manager` (§2.3) |
| `N5` | That the technical constraints listed are exhaustive — they are the ones **known at readiness**, and discovering another is normal | `ROLE-planner` |
| `N6` | That non-functional targets (latency, cost, capacity) are specified unless the story states them | engineering; absent a stated target, this is `N5`, not a product gap |
| `N7` | That the codebase currently supports the behaviour, or that the platform scan is still current | `ROLE-planner` |
| `N8` | That a `READY` verdict's conditions, or a `READY-with-known-issues` verdict's known issues, have been *answered* — only that they are recorded as non-`blocker` `Q-`/`PD-` records | `H8`; the named human |

`N5` is the one that most often gets mistaken for an upstream defect. A newly
discovered technical constraint is engineering's finding to record, and becomes
a product matter only when it changes what the user gets — at which point it is
§5's reverse path.

### 4.2 Reverse contract — a defect found after handoff

A downstream role that finds a story defective does **not** edit the story.
Accepted requirements are immutable (`product-memory.md` §4.6).

1. Raise a `Q-` naming `ROLE-product-manager`, with the story identifier and the
   failed criterion where one applies.
2. If the defect blocks the ticket, set the `Q-` to `blocker` severity and
   record it in `delivery/state.md` `blocked_by`. Independent tickets continue.
3. `ROLE-product-manager` regresses per `product-manager-orchestrator.md` §13
   (DECOMPOSITION for a story defect, PRODUCT_DEFINITION when the outcome
   itself moved) and **supersedes** the story via `SKILL-supersede-artifact`.
4. The successor story re-enters READINESS. The prior verdict is void; a
   superseded story is not silently swapped under a ticket already in flight.

The engineering orchestrator's existing rule — a mid-flight
`requirements`-category blocker is reported to the human rather than
re-dispatched into DEFINE — is the same rule seen from the delivery side, and
the `Q-` is what makes it durable rather than a line in a transcript.

## 5. Boundary protection

Four activities are routinely confused. They differ in the question they answer,
and confusing them is what causes the product track to write execution plans and
the engineering track to re-decide product behaviour.

| | Product definition | Product feasibility | Engineering HLD | Execution planning |
| --- | --- | --- | --- | --- |
| **Question** | What must be true for the user, and where does it stop? | Can this reasonably exist, and what constrains it? | How do the systems interact to make it true? | What changes, in what order, in which files? |
| **Owner** | `ROLE-product-manager` | `ROLE-planner`, PRODUCT-DISCOVERY mode | `ROLE-planner`, HLD mode | `ROLE-tech-lead` |
| **When** | Before handoff | Before handoff, on consultation | After handoff | After handoff, after any HLD |
| **Artifact** | `initiative.md`, `REQ-`, `PD-`, `DES-` | `technical/assessment.md` and siblings | `plan/hld.md` | `execution/execution-plan.md` |
| **Where it lives** | `product/**` — authoritative | `product/**` — authoritative | Session workspace — **not** product memory | Session workspace — **not** product memory |
| **Binding on** | everyone | the chosen option, and the constraints a story embeds | implementation | implementation |
| **Must not contain** | interfaces, schemas, file-level change, task breakdown, estimates | a solution design, or a product decision | product behaviour it was not given, or a task list | a re-interpretation of acceptance criteria |

Three consequences follow, and each is a rule:

1. **The product track never writes an HLD or an execution plan.** Not a draft,
   not an appendix, not "notes for engineering". `ROLE-product-manager` §14
   already forbids it; this contract is why. A product-side sketch of an
   implementation becomes a constraint nobody decided and the engineering track
   cannot refuse.
2. **Product feasibility is not an HLD.** The architect's PRODUCT-DISCOVERY
   output states *whether and at what cost*, at component altitude
   (`SKILL-system-impact-mapping`). It names no interfaces and no schemas. It is
   product memory precisely because a product decision was made on it; the HLD
   is not, because nothing product-side depends on it.
3. **The engineering track never re-decides product behaviour.** A gap in the
   behaviour is `N-`-classified or, if genuinely product, §4.2's reverse path.
   Filling it in an execution plan converts a product decision into an
   implementation detail nobody can find later.

## 6. The handoff packet

The packet is the `## Handoff packet` section of `product/state.md`. It is
assembled by `SKILL-prepare-engineering-handoff` and is subject to its rules
`H0`–`H12` ([`skill-library.md`](skill-library.md) §3.10).
Its required bullets:

| Bullet | Contents | Empty form |
| --- | --- | --- |
| **Outcome** | The initiative's outcome statement, one sentence. | never empty |
| **Stories, in suggested sequence** | Ordered `REQ-` ids. The order is a **suggestion derived from `depends_on`**, not an instruction; hard ordering lives in the stories. | never empty |
| **Design references and export paths** | `DES-` id → repository-relative `local_export` path, each existing on disk (`H6`). | `none — no user-facing surface` |
| **Decisions in force** | `PD-` ids binding on this initiative, including the chosen-option decision. | `none` |
| **Binding technical constraints** | One line each, each citing the `technical/` file and round it came from. | `none` |
| **Explicitly out of scope** | Copied from the initiative's out-of-scope section. | never empty (`R11`) |
| **Open questions (non-blocking)** | `Q-` ids of severity below `blocker`, including every condition or known issue carried on the verdict (`H8`). | `none` |
| **Delivery manifest** | The repository-relative path to `delivery/manifest.md`, issued against this same verdict. | never empty |
| **Tickets** | The `ticket_code` created for each story, per `delivery/tickets.md`. Written by §2.3's skill after the rest of the packet is complete. | never empty |

`H7` requires every bullet populated; an empty bullet is written as its explicit
empty form above, never left blank. A blank bullet and a `none` bullet are
indistinguishable to a reader but not to a checker, and the difference is
whether anyone actually looked.

**Self-containment test (`R18`, restated as the packet's exit criterion).** An
agent holding only `INIT-nnnn` and this repository can begin planning without
asking anyone a question — including a question it would answer for itself.

## 7. Conformance

A handoff conforms when all of the following hold. Each is checkable against
files by two independent implementations returning the same result.

| # | Check | Enforced by |
| --- | --- | --- |
| `C1` | `readiness_verdict` is `READY` or `READY-with-known-issues`, and not `void`. | `H1` |
| `C2` | `SKILL-validate-requirement-coverage` returns zero defects. | `H2` |
| `C3` | Every story named in the packet is `status: accepted`, carries `readiness: engineering-ready`, and satisfies the story schema. | `H0`, `H3`, `H10`; `schemas/frontmatter.md` |
| `C4` | The story-set digest recorded with the verdict matches the set on disk. | `H4` |
| `C5` | No `blocker` `Q-` is open against the initiative or any story in the set. | `H5` |
| `C6` | Every referenced identifier resolves through its index, and every `local_export` exists on disk. | `H6` |
| `C7` | Every packet bullet is populated or carries its explicit empty form. | `H7` |
| `C8` | Every condition on the verdict is a non-`blocker` `Q-` or `PD-`. | `H8` |
| `C9` | `product/state.md` is at `phase: HANDOFF` with `next_action` naming the created `ticket_code`s, and a `Handoff log` row names the receiving role and date. | `SKILL-prepare-engineering-handoff` outputs |
| `C10` | No product-side artifact contains an HLD, an execution plan, a task breakdown, or an estimate. | `H11`; §5 rule 1 |
| `C11` | A `delivery/manifest.md` exists, is issued against the same verdict and digest as the packet, is at `band_owner: product`, and satisfies `M1`–`M8` of the manifest schema. | `SKILL-compile-delivery-manifest`; `delivery-fanout.md` `F1` |
| `C12` | Every accepted, engineering-ready story resolves to ≥1 real tracker key in `delivery/tickets.md`, every key came from an Ariadne response, and no ticket carries a marker exempting it from any downstream stage. | `SKILL-create-tickets-from-stories` `X2`–`X7` |

A non-conforming handoff is not a degraded handoff. The gate stays shut and the
initiative waits as `blocked`.

## 8. Related specifications

- [`lifecycle-hooks.md`](lifecycle-hooks.md) §3.13 — `HOOK-handoff-conformance`,
  the hard gate that runs `C1`–`C11` at ENGINEERING_READY.

- [`../schemas/frontmatter.md`](../schemas/frontmatter.md) — **the canonical
  engineering-ready story schema**.
- [`../schemas/index-formats.md`](../schemas/index-formats.md) — the `Stories`
  table and the ticket manifest that carry the story↔ticket mapping.
- [`skill-library.md`](skill-library.md) §3.10 — `SKILL-prepare-engineering-handoff`;
  §3.27 — `SKILL-compile-delivery-manifest`; §3.28 — `SKILL-batch-fanout`.
- [`delivery-fanout.md`](delivery-fanout.md) — this contract at initiative scale:
  how many approved stories are scheduled and dispatched at once.
- [`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) — the
  canonical delivery manifest schema.
- [`product-memory.md`](product-memory.md) §4.6, §4.15 — the requirement and
  product-state artifact contracts.
