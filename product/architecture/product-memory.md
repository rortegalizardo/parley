---
id: ARCH-product-memory
type: architecture
title: Product Memory architecture
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Product Memory architecture

## 1. Problem

Agentic product orchestration runs in **stateless sessions**. No session may
assume it remembers anything. Every fact that must survive a session boundary
has to be written down, in the repository, in a location and format that a
future agent can find without being told where to look.

This document specifies that persistent memory: the artifact types, their
locations, their identifiers, their metadata, their mutability, and the rules
that separate authoritative information from stale, superseded, historical, or
advisory information.

## 2. Design constraints

**Provider agnostic.** Nothing here depends on a particular agent runtime,
model vendor, or tool-calling primitive. The system is defined as *files,
identifiers, contracts, and procedures*. Agent roles are described as logical
capabilities and procedures as written contracts (`product/manifest.yaml`
`roles:` and `product/architecture/skill-library.md`), whose declarations are
supplied by the execution environment. Any environment that can read and write files in a git
repository can implement this system.

**Project-size agnostic.** The same artifact types and identifier space serve a
one-frontend/one-backend application and a platform with dozens of independently
evolving domains. Scale is expressed by *optional scoping*, never by mandatory
hierarchy. See `scaling-profiles.md`.

**Repository resident.** Every authoritative artifact is a version-controlled
file under `product/`. History, attribution, review, and rollback come from git
rather than from a bespoke mechanism.

**Deterministically navigable.** Given the repository root and these
conventions — plus an initiative identifier when one exists — an agent reaches
any artifact by index lookup, never by search or guessing.

## 3. Memory layers

Product Memory is organised in five layers. Layers differ in *rate of change*,
which is what makes them worth separating.

| Layer | Question it answers | Changes | Location |
| --- | --- | --- | --- |
| L0 Foundation | Why does this product exist, and what will we never do? | Rarely | `product/project/`, optionally `product/areas/*/` |
| L1 State of the world | What does the product do today? | On every shipped change | `product/capabilities/` |
| L2 Judgement | What did we decide, and why? | Append-only | `product/decisions/` |
| L3 Intent | What are we building now, to what requirements, against which design? | Continuously, per initiative | `product/initiatives/` |
| L3.5 Definition progress | How far has product definition itself got, and what is still ambiguous? | Continuously, per initiative | `product/initiatives/*/product/state.md` |
| L4 Execution | Where does delivery actually stand right now? | Constantly | `product/*/delivery/`, `product/delivery/`, `product/questions/` |

A stateless agent reads downward (L0 → L4) to acquire context and writes upward
(L4 → L1) as work completes: delivery state advances during execution, and a
capability record is updated when an initiative ships.

## 4. Artifact catalog

Each artifact type is specified against the same ten properties.

Field 6, *mutability*, uses four values:

- **mutable** — edited in place; git history is the audit trail.
- **append-oriented** — new information is added as new entries or new files;
  existing content is not rewritten, only marked.
- **immutable-once-accepted** — content is frozen once a record reaches
  `status: accepted`, with no exemption for time between acceptance and any
  later event; change means a new artifact that supersedes the old one.
- **immutable from the freeze point** — content is edited freely, including
  once `accepted`, until the freeze point defined in §4.6.6;
  change before that point is a plain in-place edit, change after it means a
  new artifact that supersedes the old one. Used only by `REQ-` (§4.6) and
  `DES-` (§4.7), the two artifact types a delivery role or external system may
  come to hold.

---

### 4.1 Project Context

1. **Purpose.** Product-wide mission, principles, hard constraints, and shared
   vocabulary. The frame every other artifact is interpreted in.
2. **Location.** `product/project/mission.md`, `principles.md`,
   `constraints.md`, `glossary.md`.
3. **Naming.** Fixed filenames. No variants, no dated copies.
4. **Identifier.** `PROJECT` (implicit; these files are singletons).
5. **Metadata.** `type`, `status`, `revision`, `owner_role`, `updated`.
6. **Mutability.** Mutable, but changes to `principles.md` or `constraints.md`
   require an accompanying decision record.
7. **Versioning.** Bump `revision`; git holds prior text. No archive copies.
8. **Owner.** `ROLE-product-manager`.
9. **Readers/updaters.** All roles read. `ROLE-product-manager` updates; other
   roles propose via a decision record.
10. **Relationships.** Constrains every capability, decision, initiative, and
    requirement. Areas inherit and may narrow it, never contradict it.

---

### 4.2 Product Area *(optional)*

1. **Purpose.** Scope boundary for a domain, subsystem, client, or service that
   evolves independently enough to need its own vision and strategy.
2. **Location.** `product/areas/<area-slug>/area.md` (+ optional `vision.md`,
   `strategy.md`).
3. **Naming.** `<area-slug>` is lowercase kebab-case, stable for the life of the
   area.
4. **Identifier.** `AREA-<slug>` (e.g. `AREA-payments`). Slug-based rather than
   numeric because areas are few, long-lived, and referenced by humans.
5. **Metadata.** `id`, `type: area`, `title`, `status`, `owner_role`,
   `parent_area` (profile L only), `created`, `updated`.
6. **Mutability.** Mutable.
7. **Versioning.** Bump `revision`. A retired area is set to
   `status: historical` and moved to `product/archive/areas/`; its identifier is
   never reused.
8. **Owner.** Area owner role.
9. **Readers/updaters.** All roles read; area owner and product manager update.
10. **Relationships.** Optionally scopes capabilities, decisions, and
    initiatives via their `area:` field. **Scoping is a metadata field, not a
    path requirement** — this is what lets a project add areas later without
    moving or renumbering anything.

---

### 4.3 Capability

1. **Purpose.** Describes a behavior the product *actually has today* — the
   answer to "what does this system do right now". Not a plan and not a promise.
2. **Location.** `product/capabilities/CAP-nnnn-<slug>.md`.
3. **Naming.** `CAP-<4-digit zero-padded>-<kebab-slug>.md`.
4. **Identifier.** `CAP-nnnn`, globally unique, allocated from
   `manifest.yaml:id_counters.capability`, never reused.
5. **Metadata.** `id`, `type: capability`, `title`, `status`, `area` (optional),
   `revision`, `owner_role`, `created`, `updated`, `implemented_by` (initiative
   ids), `decisions` (decision ids), `surfaces` (user-facing entry points).
6. **Mutability.** Mutable — it tracks present behavior, so it is rewritten as
   behavior changes.
7. **Versioning.** Bump `revision` and add a line to the record's own
   *Change log* section naming the initiative that changed it. A removed
   capability becomes `status: historical` and moves to
   `product/archive/capabilities/`.
8. **Owner.** `ROLE-product-manager` (with the area owner, when areas exist).
9. **Readers/updaters.** All roles read. Updated at initiative close by the role
   that ran delivery; the update is part of "done".
10. **Relationships.** Realised by initiatives; constrained by decisions;
    referenced by requirements that modify it.

---

### 4.4 Product Decision

1. **Purpose.** Records a decision, its context, the options considered, and its
   consequences. This is the memory that prevents a future stateless session
   from re-litigating settled questions.
2. **Location.** `product/decisions/PD-nnnn-<slug>.md`.
3. **Naming.** `PD-<4-digit>-<kebab-slug>.md`.
4. **Identifier.** `PD-nnnn`, global, never reused.
5. **Metadata.** `id`, `type: decision`, `title`, `status`
   (`proposed|accepted|superseded|rejected`), `area` (optional), `decided_on`,
   `owner_role`, `supersedes`, `superseded_by`, `affects` (capability /
   initiative / requirement ids).
6. **Mutability.** **Append-oriented.** The body of an accepted decision is
   never rewritten. Only `status` and `superseded_by` may change afterwards.
7. **Versioning.** Change of mind = a *new* decision that names the old one in
   `supersedes`. The old record stays in place with `status: superseded` and a
   `superseded_by` pointer, so the reasoning trail survives.
8. **Owner.** The role that made the decision (recorded in `owner_role`).
9. **Readers/updaters.** All roles read and must respect accepted decisions. Any
   role may propose (`status: proposed`); only the product manager accepts.
10. **Relationships.** Constrains capabilities, initiatives, and requirements;
    resolves questions; may amend project or area context.

---

### 4.5 Initiative

1. **Purpose.** A bounded body of product work — the unit an orchestration run
   is about. Holds its own requirements, design, delivery state, and tickets.
2. **Location.** `product/initiatives/INIT-nnnn-<slug>/`.
3. **Naming.** Directory `INIT-<4-digit>-<kebab-slug>/` containing
   `initiative.md` plus the sub-structure in `repository-layout.md`.
4. **Identifier.** `INIT-nnnn`, global, never reused. **This is the identifier a
   stateless agent is handed to resume work.**
5. **Metadata.** `id`, `type: initiative`, `title`, `status`
   (`draft|active|blocked|shipped|abandoned`), `area` (optional), `owner_role`,
   `created`, `updated`, `capabilities` (affected `CAP-` ids), `decisions`,
   `requirements`, `tickets`.
6. **Mutability.** Mutable header and narrative; its requirement set is
   append-oriented.
7. **Versioning.** Bump `revision` on scope change and record the change in the
   initiative's *Scope log*. A shipped initiative is set to `status: shipped`
   and left in place (it is history that stays discoverable); an abandoned one
   moves to `product/archive/initiatives/`.
8. **Owner.** Initiative owner role.
9. **Readers/updaters.** All roles read. The owner updates the initiative file;
   delivery roles update only `delivery/`.
10. **Relationships.** Contains requirements and design; produces or changes
    capabilities; is governed by decisions; is executed through tickets.

---

### 4.6 Requirement

1. **Purpose.** A single testable statement of what must be true. The unit that
   acceptance is judged against.
2. **Location.** `product/initiatives/INIT-nnnn-<slug>/requirements/REQ-nnnn-<slug>.md`.
   Discovered globally through `product/requirements/index.md`.
3. **Naming.** `REQ-<4-digit>-<kebab-slug>.md`.
4. **Identifier.** `REQ-nnnn` — **globally unique and not scoped to its
   initiative**, so that moving a requirement between initiatives never breaks a
   reference. The index maps id → current path.
5. **Metadata.** `id`, `type: requirement`, `title`, `status`
   (`draft|accepted|implemented|verified|withdrawn|superseded`), `initiative`,
   `area` (optional), `revision`, `owner_role`, `outcome_element`, `acceptance`
   (criteria list), `capabilities`, `design_refs`, `decisions`, `depends_on`,
   `constraints`, `observability`, `rollout`, `readiness`, `tickets`,
   `supersedes`, `superseded_by`. The full form — the sixteen elements of an
   engineering-ready product story — is
   [`schemas/frontmatter.md`](../schemas/frontmatter.md) §"Engineering-ready
   product story", which is the canonical story schema.
6. **Mutability.** **Immutable from the freeze point** — in its *product
   content* — the point at which that content can have been read outside the
   product track. That point is when `SKILL-prepare-engineering-handoff` step
   `H10` sets `readiness: engineering-ready` on the story (or, if earlier, when
   the story appears in any `delivery/tickets.md` row or its initiative reaches
   `phase: HANDOFF`).
   Editing a requirement that engineering holds silently invalidates work
   already verified against it; editing one before the freeze point invalidates
   nothing, because nothing outside the product track has read it yet — a
   pre-freeze content edit (any status, including `accepted`) is a plain
   in-place edit under the pre-freeze edit contract in
   [`schemas/frontmatter.md`](../schemas/frontmatter.md). Its lifecycle fields
   (`status`, `readiness`, `tickets`) are advanced rather than frozen; the exact
   split is the immutability surface in
   [`schemas/frontmatter.md`](../schemas/frontmatter.md).
7. **Versioning.** A changed requirement **after the freeze point** becomes a
   new `REQ-` record with `supersedes`; the old one is set `status: superseded`
   with `superseded_by`. Requirements before the freeze point — draft or
   accepted — are edited freely: `revision` bumped, `updated` set, and the
   verdict-voiding effects of the pre-freeze edit contract paid. Holding a story
   set in `draft` until its review comes back clean remains the default
   authoring path.
8. **Owner.** Initiative owner.
9. **Readers/updaters.** All roles read. Product roles author; delivery roles
   hold the restricted `requirement` write granted in the `roles:` registry —
   advancing `status` along `accepted → implemented → verified`, appending
   `tickets`, and appending evidence, and nothing else. A delivery role that
   needs a content change raises a `Q-`
   ([`engineering-handoff.md`](engineering-handoff.md) §4.2).
10. **Relationships.** Belongs to one initiative; verified by tickets; realises
    or modifies capabilities; may be constrained by decisions. **It is the unit
    handed to engineering** — see [`engineering-handoff.md`](engineering-handoff.md).

---

### 4.7 Design Reference

1. **Purpose.** Points at the authoritative design for a piece of work —
   in-repository design notes, exported assets, or an external design-tool
   location — with enough committed detail to survive the external link rotting.
2. **Location.** Initiative-local design lives in
   `product/initiatives/INIT-nnnn-<slug>/design/`. Every design reference is
   registered in `product/design/index.md`.
3. **Naming.** `DES-<4-digit>-<kebab-slug>.md` for the reference record; exported
   assets sit beside it under `design/assets/`.
4. **Identifier.** `DES-nnnn`, global, never reused.
5. **Metadata.** `id`, `type: design`, `title`, `status`, `initiative`, `area`
   (optional), `external_url` (optional), `external_system`, `captured_on`,
   `local_export` (repo-relative path), `requirements`, `owner_role`.
6. **Mutability.** **Immutable from the freeze point** (§4.6.6), in
   the same sense as a `REQ-`. Before the freeze point the record is edited in
   place; captured exports are immutable once committed, so a pre-freeze content
   edit that changes what the export shows re-captures the export in the same
   pass rather than leaving the record and its export out of sync.
7. **Versioning.** After the freeze point, a new design revision is a new
   `DES-` record superseding the old — never overwrite a captured export,
   capture a new one. Before the freeze point, a content change is a plain
   in-place edit: bump the `DES-` `revision`, set `updated`, keep the local
   export in sync with a fresh capture.
8. **Owner.** Design role, or the initiative owner when no design role exists.
9. **Readers/updaters.** All roles read; implementation roles must implement
   from the **local export**, not the external link, because the external system
   may be unreachable from an execution environment.
10. **Relationships.** Serves requirements; consumed by delivery; belongs to an
    initiative.

---

### 4.8 Delivery State

1. **Purpose.** The current orchestration state of one initiative: which
   *delivery* stage it is in, what the last completed step was, and what the next
   action is. **This is the file that makes stateless resumption of delivery
   possible.** Product-side progress before handoff is §4.15's Product
   Definition State; the two files never describe the same thing and never share
   a writer.
2. **Location.** `product/initiatives/INIT-nnnn-<slug>/delivery/state.md`.
   Cross-initiative rollup in `product/delivery/board.md`.
3. **Naming.** Fixed filename `state.md`.
4. **Identifier.** None of its own; addressed by its initiative id.
5. **Metadata.** `initiative`, `stage`
   (`define|design|plan|implement|verify|ship|done`), `stage_entered`,
   `updated`, `updated_by_role`, `next_action`, `blocked_by` (question ids),
   `tickets`.
6. **Mutability.** Mutable — overwritten as state advances. It describes *now*,
   not history.
7. **Versioning.** No supersession. History is git history and the appended
   *Stage log* table at the bottom of the file.
8. **Owner.** The orchestration role.
9. **Readers/updaters.** All roles read; the orchestration role and the role
   currently holding the stage update it. **Every role must update it before
   ending a session**, or the next stateless session resumes from a false state.
10. **Relationships.** Points at the initiative, its tickets, and any blocking
    questions.

---

### 4.9 Ticket & Dependency Manifest

1. **Purpose.** The committed mirror of external tracker tickets and the
   dependency graph between them. Lets an agent understand execution order
   without querying the tracker, and survives tracker outages or access limits.
2. **Location.** Per initiative:
   `product/initiatives/INIT-nnnn-<slug>/delivery/tickets.md`.
   Global rollup: `product/delivery/tickets.md`.
3. **Naming.** Fixed filenames.
4. **Identifier.** The external tracker key verbatim (e.g. `<PROJECT>-95`), never
   re-encoded. The tracker owns ticket identity.
5. **Metadata (per row).** `ticket`, `title`, `initiative`, `requirements`,
   `depends_on`, `branch`, `pr`, `status`, `synced_on`.
6. **Mutability.** Mutable; regenerated from the tracker on each sync.
7. **Versioning.** None. `synced_on` declares freshness; a stale mirror is
   advisory, not authoritative — see `authority-and-versioning.md`.
8. **Owner.** Orchestration role.
9. **Readers/updaters.** All roles read; delivery and orchestration roles
   update.
10. **Relationships.** Tickets implement requirements and belong to an
    initiative; `depends_on` defines the executable frontier.

---

### 4.10 Open Question / Blocker

1. **Purpose.** Records something unresolved that is holding work back, so it
   surfaces to the next session instead of dying with the one that found it.
2. **Location.** `product/questions/Q-nnnn-<slug>.md`, indexed in
   `product/questions/index.md`.
3. **Naming.** `Q-<4-digit>-<kebab-slug>.md`.
4. **Identifier.** `Q-nnnn`, global, never reused.
5. **Metadata.** `id`, `type: question`, `title`, `status`
   (`open|answered|obsolete`), `severity` (`blocker|important|minor`),
   `raised_by_role`, `raised_on`, `initiative` (optional), `area` (optional),
   `answer`, `answered_on`, `resolved_by` (decision id, when the answer was a
   decision).
6. **Mutability.** Append-oriented: the question text is frozen; the answer is
   appended.
7. **Versioning.** No supersession; questions close, they do not get replaced.
8. **Owner.** The role that raised it, until answered.
9. **Readers/updaters.** All roles read and may raise; the product manager or the
   user answers blockers.
10. **Relationships.** Blocks initiatives and delivery state; is often resolved
    by a decision.

---

### 4.11 Agent Role Specification

1. **Purpose.** Defines a logical role — its responsibilities, inputs, outputs,
   and the artifacts it is permitted to write — independent of any vendor's
   agent format.
2. **Location.** The **declaration** lives in the global agent home
   (`~/.claude/agents/<role-slug>.md`), not in this repository.
   What is version-controlled here is the **registry row**: the `roles:` block
   in `product/manifest.yaml`, which binds `ROLE-<slug>` to its `writes`
   authority list and to the declaration that implements it.
3. **Naming.** Lowercase kebab-case role slug.
4. **Identifier.** `ROLE-<slug>`.
5. **Metadata.** `id`, `type: role`, `title`, `status`, `reads`, `writes`,
   `skills`, `handoff_to`.
6. **Mutability.** Mutable.
7. **Versioning.** Edit the declaration in place; retire a role by removing
   its registry row and recording the removal as a `PD-`.
8. **Owner.** System owner.
9. **Readers/updaters.** Every orchestration run reads the roles it dispatches;
   the system owner updates.
10. **Relationships.** Executes skills; writes the artifact types listed in
    `writes`. **The `writes` list in the `roles:` registry is the authority for
    who may update what** — field 9 of every artifact type above must agree
    with it, and `SKILL-checkpoint-product-state` reads it to decide whether a
    persist is in-authority. The registry is in the repository precisely
    because that check must not depend on a file outside it.

---

### 4.12 Skill / Procedure Specification

1. **Purpose.** A written, executable-by-a-human-or-agent procedure: the steps,
   the inputs, the output artifact, and the completion condition.
2. **Location.** The **declaration** lives in the global agent home
   (`~/.claude/skills/<skill-slug>/SKILL.md`), not in this repository.
   The **contract** it must satisfy is version-controlled here, in
   [`skill-library.md`](skill-library.md).
3. **Naming.** Lowercase kebab-case verb-phrase slug.
4. **Identifier.** `SKILL-<slug>`.
5. **Metadata.** `id`, `type: skill`, `title`, `status`, `used_by_roles`,
   `inputs`, `outputs`, `done_when`.
6. **Mutability.** Mutable.
7. **Versioning.** Edit the declaration in place; retire a skill by removing
   its row from `skill-library.md` and recording the removal as a `PD-`.
8. **Owner.** System owner.
9. **Readers/updaters.** Roles read; system owner updates.
10. **Relationships.** Produces or updates specific artifact types.

---

### 4.13 Archived Artifact

1. **Purpose.** Retains superseded and historical artifacts so reasoning trails
   remain readable, while removing them from the authoritative working set.
2. **Location.** `product/archive/<collection>/<original-filename>`, indexed in
   `product/archive/index.md`.
3. **Naming.** Original filename preserved unchanged.
4. **Identifier.** Original identifier preserved unchanged and still never
   reused.
5. **Metadata.** Original frontmatter plus `status: superseded|historical`,
   `superseded_by`, `archived_on`.
6. **Mutability.** Immutable.
7. **Versioning.** N/A — this *is* the versioning outcome.
8. **Owner.** Owner at time of archival.
9. **Readers/updaters.** Read-only for every role. Agents must not cite an
   archived artifact as current.
10. **Relationships.** `superseded_by` points to the artifact that replaced it;
    the replacement's `supersedes` points back.

---

### 4.14 Working Context Packet *(session-local, non-authoritative)*

1. **Purpose.** The bounded, sourced working set a role needs for one task —
   the output of `SKILL-hydrate-product-context` and the only thing a role
   should need besides the request itself.
2. **Location.** A session workspace outside `product/`. **Never committed and
   never written under `product/`.** It is listed here because it is a defined
   structure every role consumes, not because it is memory.
3. **Naming.** Environment's choice; nothing resolves it by name.
4. **Identifier.** `WCP-<session-slug>`, meaningful only within its session.
5. **Metadata.** `schema_version`, `assembled_on`, `assembled_for_role`,
   `head_commit`, `context_digest`, `readiness`, `foundation`. Full structure in
   `context-assembly.md` §10.2.
6. **Mutability.** Immutable within its session; discarded at the boundary.
7. **Versioning.** None. Superseding a packet means re-hydrating.
8. **Owner.** The role that hydrated it.
9. **Readers/updaters.** Its own session only. **No later session may read a
   prior session's packet** — it is a snapshot of a commit that has moved on,
   and trusting it reintroduces exactly the stale-context failure this
   architecture exists to prevent.
10. **Relationships.** Derived from every other artifact type. Its
    `context_digest` is the one part that persists: recorded by
    `SKILL-checkpoint-product-state` into decision provenance and stage-log
    rows, so a later session can ask what was visible when a call was made.

---

### 4.15 Product Definition State

1. **Purpose.** The current *product* phase of one initiative: how far the
   definition of the work itself has got, which ambiguities are open and how
   they were classified, which solution options were considered and rejected,
   what the delegates said, and whether the definition has converged. **This is
   the file that makes stateless resumption of product definition possible** —
   the pre-delivery counterpart of §4.8.
2. **Location.** `product/initiatives/INIT-nnnn-<slug>/product/state.md`.
3. **Naming.** Fixed filename `state.md` under a fixed `product/` subdirectory
   of the initiative.
4. **Identifier.** None of its own; addressed by its initiative id.
5. **Metadata.** `initiative`, `phase` (`BOOTSTRAP | INTAKE | DISCOVERY |
   PRODUCT_DEFINITION | SOLUTION_EXPLORATION | SOLUTION_CONVERGENCE |
   DECOMPOSITION | READINESS | ENGINEERING_READY | HANDOFF`), `phase_entered`,
   `requester`, `next_action`, `blocked_by`, `converged`, `readiness_verdict`
   (`none | READY | NOT READY | void`), `stories`,
   `design_refs`, `decisions`, `updated`, `updated_by_role`.
6. **Mutability.** Mutable — it describes *now*. Its logs (phase, ambiguity,
   consultation, escalation, readiness) are append-only within it and its
   history sibling (item 11): a row may move, never be edited or dropped.
7. **Versioning.** No supersession. History is git history plus the appended
   logs.
8. **Owner.** `ROLE-product-manager`.
9. **Readers/updaters.** All roles read. `ROLE-product-manager` updates;
   `ROLE-product-readiness-reviewer` writes the `Readiness log` and
   `Readiness findings` sections and nothing else. No other role writes this file, and the product manager never
   writes `delivery/state.md` in return.
10. **Relationships.** Belongs to one initiative; names its stories (`REQ-`),
    design references (`DES-`), decisions (`PD-`), and blocking questions
    (`Q-`); its `Handoff packet` section is what `ROLE-orchestrator` receives at
    HANDOFF.
11. **Head and history sibling.** `state.md` is read at every hydrate, so it
    holds only the head: the frontmatter; every section the template
    (`templates/product-state.md`) defines, in its current form; the open rows
    of the Ambiguity and Escalation logs (open = the row's `Q-` is `open` in
    `questions/index.md`); and, in full, the `Stories`, `Readiness log`,
    `Readiness findings` table, `Handoff packet`, `Handoff log` and `Phase
    log` — the sections gates read by name. History moves **verbatim, in
    order, headings preserved** to the sibling
    `product/initiatives/INIT-nnnn-<slug>/product/state-history.md`
    (`type: product-state-history`, `status: historical`): `### Superseded —`
    section snapshots, closed log rows, readiness-round narratives that are
    not finding rows, and sections the template does not define. `state.md`
    keeps every template heading and carries a one-line pointer to the
    sibling; a log whose rows moved carries a one-line stub under its table.
    The sibling is written only by this file's owner, only by such moves, and
    is never authority for current state. Hydration reads `state.md` only
    (`context-assembly.md` §7.4); a check that reads a log's full history
    (`A9` on a regression re-entry, `CP4`) reads the sibling's rows as that
    log's earlier rows. Trim when hydration warns that `state.md` exceeds
    300 lines.

---

### 4.16 Technical Assessment

1. **Purpose.** The technical architect's product-discovery findings for one
   initiative: what the platform already does, what a candidate behavior would
   impact, whether it is feasible and under what constraints, what it risks,
   how complex it is, and which product assumptions the platform contradicts.
   **This is what makes a feasibility verdict survive the session that produced
   it** — the verdict is binding on the product manager, and binding advice that
   exists only as a line someone else wrote down is not evidence.
2. **Location.** `product/initiatives/INIT-nnnn-<slug>/technical/`, in four
   fixed files: `capability-scan.md`, `impact.md`, `assessment.md`, and
   `coherence.md`. The directory is created only when the architect is actually
   consulted — no empty hierarchy.
3. **Naming.** Fixed filenames, as `design/` uses fixed `journeys.md`,
   `flows.md`, `states.md`, `audit.md`.
4. **Identifier.** None of its own; addressed by its initiative id, like §4.8
   and §4.15. Findings that need a global identifier are already `Q-` records or
   `PD-` records.
5. **Metadata.** `initiative`, `mode` (`PRODUCT-DISCOVERY`; the engineering HLD
   mode writes no artifact here), `phase_at_assessment`, `round`, `assessed_on`,
   `verdicts`, `constraints`, `questions`, `updated_by_role`. `assessment.md`
   additionally carries `complexity_bands`; `coherence.md` carries `verdict`
   (`coherent | defects-open | regression-required`) as its first line.
6. **Mutability.** Append-oriented. A new consultation is a new dated round
   appended to the file; a superseded round's rows are marked, never deleted.
   An assessment silently rewritten after a `PD-` was accepted on it makes that
   decision's stated basis false.
7. **Versioning.** By round, within the file. No supersession records — the
   decision that relied on a round names the round it relied on.
8. **Owner.** `ROLE-planner`, in PRODUCT-DISCOVERY mode.
9. **Readers/updaters.** All roles read. **Only `ROLE-planner` writes it**, and
   `ROLE-planner` in return never writes `product/state.md` — the product
   manager records the consultation there by citing this file's path, not by
   restating it. One file per owner, as §4.8/§4.15.
10. **Relationships.** Belongs to one initiative; assesses its candidate options
    and, at DECOMPOSITION, its accepted `REQ-` set; cites the `CAP-` records it
    reconciles against; raises `Q-` records for product questions it must not
    settle; supplies the constraints a `PD-` records as permanent; is read by
    `SKILL-hld-authoring` after handoff rather than being rebuilt there.

---

### 4.17 Delivery Manifest

1. **Purpose.** The schedulable form of one initiative's approved story set:
   which stories were handed over, what depends on what, what may run
   concurrently, and — after acceptance — what has been dispatched, what came
   back, and what remains. **This is the file that makes a multi-story initiative
   executable in parallel by sessions that share no memory.** It is not a second
   ticket manifest (§4.9) and not a readiness judgement.
2. **Location.** `product/initiatives/INIT-nnnn-<slug>/delivery/manifest.md`.
   No cross-initiative rollup; `product/delivery/board.md` remains the rollup of
   stage, not of dispatch.
3. **Naming.** Fixed filename `manifest.md`.
4. **Identifier.** `DM-INIT-nnnn`, derived from the initiative. Allocates no
   counter and occupies no identifier space of its own.
5. **Metadata.** `initiative`, `manifest_version`, `band_owner`, `issued_on`,
   `issued_from_verdict`, `story_set_digest`, `accepted_on`, `dispatch_unit`,
   `max_parallelism`, `completion`, `stories`, `updated_by_role`. Full schema:
   `../schemas/delivery-manifest.md`.
6. **Mutability.** Split. The **product band** is immutable-once-accepted; the
   **execution band** is mutable, with an append-only dispatch ledger.
7. **Versioning.** No supersession and no second file. A voided manifest is
   re-issued in place at `revision + 1`, preserving the execution band; the
   ledger is the history.
8. **Owner.** `ROLE-product-manager` until acceptance, `ROLE-orchestrator` at
   initiative scope thereafter. `band_owner` names the current writer, so there
   is one writer at any moment.
9. **Readers/updaters.** All delivery roles read; the fanout mechanism writes
   only the execution-band fields listed in
   `../architecture/delivery-fanout.md` §5.
10. **Relationships.** Compiled from the handoff packet (§4.15) and the accepted
    stories (§4.6); projects the ticket manifest (§4.9); authorises
    `delivery/state.md` (§4.8) to reach `stage: done`.

---

## 5. Write discipline

Three rules keep the memory trustworthy:

1. **Every write updates an index.** Creating `CAP-nnnn-x.md` without adding it
   to `capabilities/index.md` makes it invisible to a stateless agent, which is
   the same as not having written it.
2. **Every identifier allocation updates `manifest.yaml`.** In the same commit.
3. **Every session that touched an initiative updates its
   `delivery/state.md` before ending** — including sessions that failed, which
   record the failure in `next_action`.
4. **Every session opens with `SKILL-hydrate-product-context` and closes with
   `SKILL-checkpoint-product-state`.** The first guarantees that what the
   session believes came from files; the second guarantees that what it
   established survives them. A session that skips either has, from the next
   session's perspective, either hallucinated its context or not happened.

## 6. Related specifications

- [`lifecycle-hooks.md`](lifecycle-hooks.md) — the sixteen lifecycle gates that
  enforce this document's write discipline, and the guardrails `G1`–`G5`.

- `repository-layout.md` — the canonical directory structure.
- `identifiers.md` — identifier grammar and allocation.
- `authority-and-versioning.md` — authoritative vs stale, superseded,
  historical, advisory.
- `scaling-profiles.md` — S/M/L profiles and promotion procedure.
- `context-assembly.md` — scope resolution, authority precedence, freshness,
  conflict resolution, relevance ranking, budgeting, determinism, and the
  Working Context Packet.
- `delivery-fanout.md` — how an initiative's approved story set is scheduled,
  dispatched in parallel, and completed, and what the dispatch mechanism may not
  decide.
- `engineering-handoff.md` — the product-to-engineering handoff contract: the
  story schema's reference point, the engineering assumption register, and the
  boundary between definition, feasibility, HLD, and execution planning.
- `adoption-notes.md` — repository-specific adoption decisions.
