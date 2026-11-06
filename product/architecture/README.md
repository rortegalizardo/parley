---
id: ARCH-readme
type: architecture
title: Architecture entrypoint — the canonical map of this system
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Architecture — canonical entrypoint

This is the map. It states where each part of the architecture is specified and
what shape the whole has; it **restates no contract**. Every rule in this system
is written in exactly one place, and this file's job is to say
which place. A number, a criterion, or a rule id you find here and nowhere else
is a defect in this file.

Reading order for a session that has never seen this system: `product/README.md`
(what the memory is and how to bootstrap) → this file (how the parts fit) → the
one or two specifications your task actually touches.

---

## 1. The eleven specifications

| File | What it is authority for |
| --- | --- |
| [`product-memory.md`](product-memory.md) | The memory model: five layers, the seventeen artifact types (§4.1–§4.17), and each type's mutability class. |
| [`repository-layout.md`](repository-layout.md) | Where every artifact lives on disk, and why declarations do not. |
| [`identifiers.md`](identifiers.md) | The identifier spaces, allocation, and what each identifier's artifact is. |
| [`authority-and-versioning.md`](authority-and-versioning.md) | Status vocabulary, revision rules, supersession, and who may write what. |
| [`scaling-profiles.md`](scaling-profiles.md) | Profiles S/M/L and how a project is promoted without renumbering. |
| [`context-assembly.md`](context-assembly.md) | How a stateless session reconstructs state: rungs, authority precedence, freshness, bands, budget, the Working Context Packet, `D1`–`D19`. |
| [`skill-library.md`](skill-library.md) | The single catalog of skill contracts (§3.1–§3.31) — **and, at §3.9.2, the readiness contract `R1`–`R18`**. |
| [`lifecycle-hooks.md`](lifecycle-hooks.md) | The sixteen hooks and five guardrails: which check runs at which moment, which are hard gates, which skill enforces each. |
| [`engineering-handoff.md`](engineering-handoff.md) | The product→engineering boundary: `H0`–`H12`, `C1`–`C11`, the assumption and not-licensed registers, the reverse contract. |
| [`delivery-fanout.md`](delivery-fanout.md) | The two orchestrator scopes, the manifest consumption contract, dispatch and failure rules, `P1`–`P5` / `F1`–`F8`. |
| [`adoption-notes.md`](adoption-notes.md) | What a project adopting this system does first, and what it may skip. |

Two schemas sit beside them and carry equal authority within their subject:
[`../schemas/frontmatter.md`](../schemas/frontmatter.md) (every artifact's
frontmatter, **and the canonical engineering-ready story schema**) and
[`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) (the one
artifact with two bands and two writers separated in time).

The machine-readable root is [`../manifest.yaml`](../manifest.yaml). Its
`roles:` block is **the authority table** for what each role may persist; its
`indexes:` block is the deterministic discovery entry point for everything else.

## 2. The shape of the system, in one pass

```
Persistent Product Memory (product/**, version-controlled)
        │
        ▼  SKILL-hydrate-product-context ─ Working Context Packet (session-local)
ROLE-product-manager  ── the product phase machine ──────────────────┐
  BOOTSTRAP → INTAKE → DISCOVERY → PRODUCT_DEFINITION                │
    → SOLUTION_EXPLORATION ⇄ ROLE-product-designer                   │ product/state.md
                           ⇄ ROLE-planner (product-discovery mode)   │ (PM is sole writer)
    → SOLUTION_CONVERGENCE → DECOMPOSITION → READINESS               │
        │                                                            │
        ▼  ROLE-product-readiness-reviewer → verdict {READY|NOT READY}
    → ENGINEERING_READY → HANDOFF                                    │
        │                                                            │
        ▼  Delivery Manifest, product band frozen at acceptance ─────┘
ROLE-orchestrator (initiative scope) ── SKILL-batch-fanout
        │
        ├──▶ ROLE-orchestrator (ticket scope) ── define → design → plan →
        ├──▶ ROLE-orchestrator (ticket scope)    implement → verify → ship
        └──▶ …                                                  delivery/state.md
                                                        (orchestrator is sole writer)
```

Three properties of that picture are the architecture, and everything else is
detail:

1. **One writer per state file.** `product/state.md` is the PM's; `delivery/state.md`
   is the orchestrator's. The delivery manifest is the single exception, and it
   is an exception *in time*, not in ownership: `band_owner` transfers exactly
   once, product → delivery (`../schemas/delivery-manifest.md` §2).
2. **The verdict is the boundary.** Nothing crosses into delivery except a story
   set that a reviewer — never the same executor instance as the PM — has judged
   `READY` against `skill-library.md` §3.9.2.
3. **Fanout exercises no judgement.** It reads flags a judging role already set;
   it never re-decides readiness (`delivery-fanout.md` §3).

## 3. The actors

Every actor is a `ROLE-` in the `roles:` registry, and every `ROLE-` resolves to
a declaration under `~/.claude/agents/`. The registry, not the
declaration, is the authority for `writes`; a declaration that disagrees is a
defect to repair, in the declaration.

| Role | Owns | Writes (registry) |
| --- | --- | --- |
| `ROLE-product-architect` | The memory system itself — never product content | `architecture, schema, role, skill, template, decision`¹`, question`³`, area`⁶ |
| `ROLE-product-manager` | Product intent, from ambiguous request to engineering-ready story set | `project-context, area`⁶`, capability, decision, initiative, requirement, product-state, question, delivery-manifest`² |
| `ROLE-product-designer` | The user experience of approved behaviour; `DES-` references | `design, question`³ |
| `ROLE-planner` | Technical feasibility (product-discovery mode) and HLD (engineering mode) | `tickets, technical-assessment, question`³ |
| `ROLE-product-readiness-reviewer` | The binary readiness verdict; fixes nothing | `product-state, question` |
| `ROLE-orchestrator` | Everything after the handoff; two scopes (`delivery-fanout.md` §4) | `delivery-state, tickets, requirement`⁴`, delivery-manifest`⁵ |
| `ROLE-tech-lead` | Execution planning, after handoff and after any HLD | `tickets` |
| `ROLE-implementer` / `ROLE-reviewer` / `ROLE-release` | Implementation, verification, ship | `tickets, requirement`⁴ (+ `delivery-state` for release) |

¹ architecture decisions only — a `PD-` whose subject is the memory system itself (its artifact catalog, identifier space, authority rules, scaling profile, or the contracts under `architecture/`); the decision's subject, not its author, fixes the class.
² product band only. ³ escalation only; neither role decides a product question.
⁴ lifecycle fields only (`../schemas/frontmatter.md` §"The immutability surface").
⁵ execution band, initiative scope only.
⁶ `area` is banded (the `area` grant in the `roles:` registry): the architect writes the structural band —
existence, `id`, `parent_area`, **Boundary** — and the product manager writes
**Vision**, **Strategy**, and **Area vocabulary**. The registry in
[`../manifest.yaml`](../manifest.yaml) is the authority; this table is a view of
it.

`~/.claude/agents/product-manager.md` is the **legacy engineering-flow intake
agent**, not a duplicate of `product-manager-orchestrator.md`. Its retirement is
planned and out of scope here; until then, the two flows are separate and both
declarations are live.

## 4. What is enforced deterministically

Judgement is expensive and non-reproducible, so this system spends it only where
comparison against files cannot decide the question. The deterministic surface:

| Rule set | Subject | Specified in |
| --- | --- | --- |
| `D1`–`D19` | Context assembly | `context-assembly.md` §11 |
| `R1`–`R12` det. / `R13`–`R18` judged | Readiness | `skill-library.md` §3.9.2 |
| `H0`–`H12`, `C1`–`C11` | Handoff and its conformance | `engineering-handoff.md` |
| `M1`–`M8`, `E1`–`E6` | Delivery manifest | `../schemas/delivery-manifest.md` §6 |
| `P1`–`P5`, `F1`–`F8` | Fanout preconditions and conformance | `delivery-fanout.md` §5, §8 |
| the sixteen hooks, `G1`–`G5` | When each of the above runs, and which refuse progression | `lifecycle-hooks.md` |

Per-skill rule namespaces (`T`, `S`, `F`, `X`, `K`, `W`, `A`, `E`, `G`, `B`,
`HY`, `CP`) are stated in their skill's contract in `skill-library.md` §3 and
bound to a moment in `lifecycle-hooks.md` §5.1.

**A hard gate refuses progression; it does not warn.** Which hooks are hard
gates, and which carry a judged band, is stated in `lifecycle-hooks.md` §2 —
and, per §1 above, in no other file including this one.

## 5. The review that produced this state

No architecture review record is bundled with this tree. A review, when a
project runs one, is a dated audit record, not a specification — it carries no
rule that any other file must obey. The rules live in `architecture/` and
[`../schemas/`](../schemas/); a project's later decisions about the memory
system itself are recorded as `PD-` records owned by `ROLE-product-architect`.
