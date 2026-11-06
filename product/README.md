# Product Memory — entry point

This directory is the **single canonical root** for all product-orchestration
state in this repository. Everything an agent needs to reason about *what this
product is, what has been decided, what is being built, and where delivery
stands* lives here, in version control.

A stateless agent needs exactly three things to use this system:

1. the repository root,
2. the conventions in [`architecture/`](architecture/), mapped by
   [`architecture/README.md`](architecture/README.md),
3. optionally an initiative identifier (`INIT-nnnn`).

Nothing else. No prior conversation, no session directory, no provider
workspace, no external service is required to *navigate* this structure.

---

## Bootstrap procedure for a stateless agent

Run `SKILL-hydrate-product-context`. It is
the single entry procedure, it is deterministic and provider-agnostic, and it
produces a Working Context Packet containing everything the session needs.

Its shape, for orientation — the skill is the specification:

| Step | Action |
| --- | --- |
| 1 | Read `product/manifest.yaml`: schema version, scaling profile, registered areas, identifier counters, index locations, context budget. |
| 2 | Determine which scoping rungs actually exist. Use only those. A flat project has no area step — not an empty one. |
| 3 | Resolve the request or identifier to at most one area and at most one initiative, from index rows rather than from recollection. |
| 4 | Read `product/project/mission.md`, `principles.md`, `constraints.md`. Anything `draft` is not binding. |
| 5 | Read the index of each collection the task concerns. Indexes are the closed world: an unindexed artifact is not part of the authoritative set. |
| 6 | With an initiative: read `initiative.md`, then `product/state.md` (product phase, PM-owned), then `delivery/state.md` (delivery stage, orchestrator-owned). Those two files alone give the current state. Never read `product/state-history.md` unless a specific question requires it; warn when `product/state.md` exceeds 300 lines. |
| 7 | Rank, bound to the token budget, adjudicate conflicts, and emit the packet with a readiness verdict. |

Close the session with
`SKILL-checkpoint-product-state` —
including when the session failed, and including when it concluded that nothing
needed to change.

The rules both procedures apply are in
[`architecture/context-assembly.md`](architecture/context-assembly.md).

## What is here

| Path | Contents |
| --- | --- |
| `architecture/` | The specification of this system itself: memory model, layout, identifiers, authority rules, scaling profiles. Start at [`architecture/README.md`](architecture/README.md), **the canonical architecture entrypoint** — it maps every specification to what it is authority for. |
| `project/` | Global product mission, principles, constraints, glossary. |
| `areas/` | *Optional; absent here.* Product areas / domains / subsystems. This project is at `scaling_profile: S` with no registered areas, so the `areas/` directory does not exist ([`schemas/index-formats.md`](schemas/index-formats.md) §"Area index"). Areas scope by the `area:` frontmatter field, never by path; a promotion to profile M creates `areas/index.md` per [`architecture/scaling-profiles.md`](architecture/scaling-profiles.md). |
| `capabilities/` | What the product does today — the behavioral registry. |
| `decisions/` | Product decisions and their rationale. Append-oriented. |
| `initiatives/` | Active and completed bodies of work, each with its requirements, design, technical assessment, product-definition state, delivery state, and ticket manifest. |
| `requirements/` | Global requirement index (files live under their owning initiative). |
| `design/` | Design reference registry, including external design-tool pointers. |
| `delivery/` | Cross-initiative delivery board and the global ticket manifest. |
| `questions/` | Open questions and blockers, globally indexed. |
| `schemas/` | Frontmatter and index-format schemas that all artifacts must satisfy, including the canonical story schema. |
| `templates/` | Copy-ready artifact templates. |
| `architecture/skill-library.md` | The single catalog of skill contracts. Declarations live in `~/.claude/skills/`. |
| `architecture/engineering-handoff.md` | The product-to-engineering handoff contract: what an engineering-ready story is, what a receiving role may assume, and where product definition stops. |
| `architecture/lifecycle-hooks.md` | The sixteen lifecycle gates and five guardrails that make this system reliable across stateless sessions — which checks run at which moment, which are hard gates, and which skill enforces each. |
| `schemas/frontmatter.md` | Frontmatter schema for every artifact type, and the **canonical engineering-ready story schema**. |
| `manifest.yaml` (`roles:`) | Role registry: the `writes` authority table, binding each `ROLE-` to its declaration in `~/.claude/agents/`. |
| `archive/` | Superseded and historical artifacts, retained but non-authoritative. |

## The one rule that matters most

**Authoritative state lives only here.** Never treat a temporary directory, a
session transcript, an agent scratch folder, a provider workspace, or an
external tool's database as the source of truth. External systems (issue
trackers, design tools) may be *systems of record for their own domain*; this
repository is the system of record for the product's memory, and it holds a
committed mirror of anything it needs from them.

See [`architecture/product-memory.md`](architecture/product-memory.md) for the
full specification.
