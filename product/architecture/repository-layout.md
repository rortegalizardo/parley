---
id: ARCH-repository-layout
type: architecture
title: Canonical repository layout
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Canonical repository layout

## 1. The canonical root

```
<repository-root>/product/
```

One root, in the repository, version-controlled. All product-orchestration
artifacts live under it. Nothing authoritative lives outside it.

Prohibited locations for authoritative state, without exception:

- temporary directories (`/tmp`, scratchpads, OS temp),
- provider or session workspaces (agent working folders, transcript stores),
- directories outside the repository (including sibling workspace folders),
- ad-hoc paths scattered through the codebase.

## 2. Full structure

`(optional)` marks a path created only when the project needs it. A small
project's `product/` tree is legitimately just `manifest.yaml`, `README.md`,
`architecture/`, `project/`, `capabilities/`, `decisions/`, `initiatives/` and
the indexes.

```
product/
├── README.md                       # stateless-agent entry point
├── manifest.yaml                   # schema version, profile, areas, id counters, indexes
│
├── architecture/                   # the specification of this system
│   ├── product-memory.md
│   ├── repository-layout.md
│   ├── context-assembly.md
│   ├── lifecycle-hooks.md
│   ├── skill-library.md
│   ├── engineering-handoff.md
│   ├── delivery-fanout.md
│   ├── identifiers.md
│   ├── authority-and-versioning.md
│   ├── scaling-profiles.md
│   └── adoption-notes.md
│
├── project/                        # L0 — global context
│   ├── mission.md
│   ├── principles.md
│   ├── constraints.md
│   └── glossary.md
│
├── areas/                          # (optional) profile M/L only
│   ├── index.md
│   └── <area-slug>/
│       ├── area.md
│       ├── vision.md               # (optional)
│       ├── strategy.md             # (optional)
│       └── subsystems/             # (optional) profile L only
│           └── <subsystem-slug>/subsystem.md
│
├── capabilities/                   # L1 — what the product does today
│   ├── index.md
│   └── CAP-nnnn-<slug>.md
│
├── decisions/                      # L2 — why things are the way they are
│   ├── index.md
│   └── PD-nnnn-<slug>.md
│
├── initiatives/                    # L3 — what is being built
│   ├── index.md
│   └── INIT-nnnn-<slug>/
│       ├── initiative.md
│       ├── requirements/
│       │   └── REQ-nnnn-<slug>.md
│       ├── design/                 # (optional)
│       │   ├── DES-nnnn-<slug>.md
│       │   └── assets/
│       ├── technical/             # (optional) architect's discovery findings
│       │   ├── capability-scan.md
│       │   ├── impact.md
│       │   ├── assessment.md
│       │   └── coherence.md
│       ├── product/
│       │   ├── state.md            # current product-definition phase (PM-owned)
│       │   └── state-history.md    # (optional) moved history of state.md; never read at hydrate
│       └── delivery/
│           ├── state.md            # current delivery stage (orchestrator-owned)
│           ├── tickets.md          # ticket + dependency manifest
│           └── manifest.md         # delivery manifest — two bands, see §3
│
├── requirements/
│   └── index.md                    # global REQ id → path (files live in initiatives)
│
├── design/
│   └── index.md                    # global DES id → path + external references
│
├── delivery/                       # L4 — cross-initiative execution view
│   ├── board.md                    # every non-done initiative and its stage
│   └── tickets.md                  # global ticket manifest
│
├── questions/
│   ├── index.md
│   └── Q-nnnn-<slug>.md
│
├── schemas/
│   ├── frontmatter.md              # required metadata per artifact type
│   ├── index-formats.md            # required columns per index
│   └── delivery-manifest.md        # the canonical delivery manifest schema
│
├── templates/
│   ├── capability.md  decision.md  initiative.md  requirement.md
│   ├── design-reference.md  delivery-state.md  delivery-manifest.md
│   ├── product-state.md  tickets.md
│   ├── technical-assessment.md
│   ├── question.md  area.md  agent-role.md  skill.md   # contract shapes for
│   │                                # declarations that live in ~/.claude/
│   └── working-context-packet.md   # session-local output; never stored here
│
└── archive/
    ├── index.md
    ├── capabilities/  decisions/  initiatives/  requirements/
    ├── design/  areas/
```

## 3. Placement rules

**Requirements and design live inside their initiative, not in a global pile.**
Everything an agent needs to execute one initiative is under one directory, so
`INIT-nnnn` is a sufficient handle. The global `requirements/index.md` and
`design/index.md` exist purely so a bare `REQ-`/`DES-` identifier still
resolves.

**Areas scope by metadata, not by path.** A capability belonging to
`AREA-payments` stays at `product/capabilities/CAP-nnnn-*.md` with
`area: AREA-payments` in its frontmatter. Introducing areas therefore never
moves a file or renumbers an identifier. Under profile L, area directories may
additionally hold *area-local* context (`vision.md`, `strategy.md`) — context
only, never capability, decision, or initiative records.

**No empty hierarchy.** Do not create `areas/` "for later". Do not create an
`initiatives/INIT-*/design/` directory with no design in it. A directory that
exists implies content that exists.

**One state file per owner.** An initiative carries two state files:
`product/state.md`, owned by `ROLE-product-manager` and covering everything from
an ambiguous request to engineering-ready stories, and `delivery/state.md`,
owned by `ROLE-orchestrator` and covering everything after handoff. They are
separate files because they have separate writers; merging them would put two
roles on one file, which is how state files start lying.

**One writer per initiative subdirectory — with one named exception.** `design/` is written by
`ROLE-product-designer`, `technical/` by `ROLE-planner` in PRODUCT-DISCOVERY
mode, `product/state.md` by `ROLE-product-manager`, `delivery/` by
`ROLE-orchestrator`. A delegate's findings live in the delegate's own files and
are *cited* by the coordinating role, never transcribed into its file — a
transcription is a second copy that drifts, and it puts the party a verdict
binds in charge of recording it.

The exception is `delivery/manifest.md`, and it is an exception in *time*, not in
concurrency: its product band is written once by `ROLE-product-manager` at phase
ENGINEERING_READY and is frozen the moment `ROLE-orchestrator` accepts, after
which only `ROLE-orchestrator` writes. `band_owner` in its frontmatter names who
may write now, so there is still exactly one writer at any moment. See
[`../schemas/delivery-manifest.md`](../schemas/delivery-manifest.md) §2. The
product manager still never writes `delivery/state.md`, `delivery/tickets.md`, or
any ticket graph.

**The architect writes nothing here in HLD mode.** An HLD is addressed by ticket
and lives in the session workspace (`~/Factory/Artifacts/projects/<PROJECT>/tickets/<ticket_code>/plan/`), which
`adoption-notes.md` classifies as session-local. Only the pre-handoff discovery
findings are product memory, because only they are what a product decision was
made on.

**Shipped work stays in place.** Shipped initiatives remain under
`initiatives/` with `status: shipped`; only abandoned ones are archived. The
delivery board excludes them; the index does not.

## 4. Relationship to non-authoritative locations

| Location | Role | Authoritative? |
| --- | --- | --- |
| `product/**` | Product memory | **Yes** |
| Issue tracker (Ariadne) | System of record for ticket status/assignment | For ticket state only; mirrored into `delivery/tickets.md` |
| External design tool | System of record for editable design files | For the design source only; mirrored as `DES-` record + local export |
| Working Context Packet | The assembled working set for one session | **No.** Derived, instantaneous, and never read by a later session — only its `context_digest` persists. |
| Session-local batch file (`~/Factory/Artifacts/projects/<PROJECT>/batches/<slug>.md`) | Convenience mirror of a fanout run | **No.** `delivery/manifest.md` is authoritative for an initiative's dispatch state; on disagreement the mirror is rewritten. |
| Agent session transcripts, scratchpads, temp dirs | Working memory for one session | **No.** Discardable at any moment. |
| Workspace folders outside the repository | Convenience only | **No.** Not version-controlled with the code. |
| Global agent home (`~/.claude/agents/`, `~/.claude/skills/`) | Canonical location for agent and skill **declarations** | **Yes, for declarations only** — and for nothing else. It holds no product artifact, and it is **not** a temporary location: guardrail `G2` exempts it explicitly and must never flag it. Each declaration's *contract* is version-controlled here, in `architecture/skill-library.md` and the `roles:` registry. |

Anything an agent will need in a later session must be promoted out of the
transcript, scratchpad, and outside-workspace rows and into `product/` before the
session ends. That promotion is checked at `HOOK-checkpoint` by `CP1`–`CP3`
([`lifecycle-hooks.md`](lifecycle-hooks.md) §3.16, §4.1–§4.2).

## 5. Discovery contract

An agent holding only the repository root can reach any artifact in at most four
reads:

```
product/manifest.yaml  →  indexes[<collection>]  →  <index file>  →  <artifact path>
```

An agent additionally holding an initiative identifier reaches live work in two:

```
product/initiatives/<INIT-nnnn>-*/initiative.md
product/initiatives/<INIT-nnnn>-*/product/state.md     # where definition stands
product/initiatives/<INIT-nnnn>-*/delivery/state.md    # where delivery stands
```

The glob on `<slug>` is the only non-exact step, and it is unambiguous because
`INIT-nnnn` is unique.

## 6. Assembling, not just reaching

The contract above is about *reachability*. Deciding which of the reachable
artifacts belong in a session's working set — and what to do when they are
stale, superseded, or contradictory — is
[`context-assembly.md`](context-assembly.md), executed by
`SKILL-hydrate-product-context`.

The two are deliberately separate. Layout answers *where things are*; assembly
answers *which of them may be believed right now*. A change to one should not
force a change to the other.
