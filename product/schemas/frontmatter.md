---
id: SCHEMA-frontmatter
type: schema
title: Artifact frontmatter schema
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Artifact frontmatter schema

Every artifact file begins with a YAML frontmatter block delimited by `---`.
A file without frontmatter is treated as `draft` and is not authoritative.

## Common fields (all artifact types)

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `id` | yes | string | Per `architecture/identifiers.md`. Must match the filename's identifier. |
| `type` | yes | enum | `area \| capability \| decision \| initiative \| requirement \| design \| question \| role \| skill \| schema \| architecture \| project-context \| product-state \| product-state-history \| delivery-state \| delivery-manifest \| manifest \| context-packet \| technical-assessment` |
| `title` | yes | string | Human-readable, sentence case. |
| `status` | yes | enum | Per `architecture/authority-and-versioning.md`. |
| `owner_role` | yes | string | A `ROLE-` key from the `roles:` registry in `product/manifest.yaml`. |
| `created` | yes | date | `YYYY-MM-DD`, absolute. Never relative. |
| `updated` | yes | date | `YYYY-MM-DD`. |
| `revision` | yes | integer | Starts at 1; bumped on material change. |
| `area` | no | `AREA-<slug>` | Omit under profile S, and for cross-cutting artifacts under M/L. |
| `subsystem` | no | slug | Profile L only. |
| `supersedes` | no | id | |
| `superseded_by` | no | id | Required when `status: superseded`. |
| `archived_on` | no | date | Required for anything under `product/archive/`. |

## Type-specific required fields

| `type` | Additional required fields |
| --- | --- |
| `capability` | `surfaces` (list), `implemented_by` (INIT ids), `decisions` (PD ids, may be empty) |
| `decision` | `decided_on`, `affects` (ids, may be empty) |
| `initiative` | `capabilities`, `requirements`, `tickets` (lists, may be empty) |
| `requirement` | `initiative`, `outcome_element`, `acceptance` (list of testable criteria), `depends_on`, `readiness`, `tickets`, `capabilities`, `design_refs`, `decisions`, `constraints`, `observability`, `rollout` — see [Engineering-ready product story](#engineering-ready-product-story-type-requirement) |
| `design` | `initiative`, `external_system`, `local_export`, `captured_on`, `requirements` |
| `question` | `severity`, `raised_by_role`, `raised_on` |
| `role` | `reads`, `writes`, `skills`, `handoff_to` |
| `skill` | `used_by_roles`, `inputs`, `outputs`, `done_when` |
| `product-state` | `initiative`, `phase`, `phase_entered`, `requester`, `next_action`, `blocked_by`, `converged`, `readiness_verdict`, `stories`, `design_refs`, `decisions`, `updated_by_role` |
| `product-state-history` | `initiative`, `moved_from` (the `state.md` revision the latest move was cut from). `status` is always `historical`; `id` is `PSTATE-HIST-INIT-nnnn`. See `architecture/product-memory.md` §4.15 item 11. |
| `delivery-state` | `initiative`, `stage`, `stage_entered`, `next_action`, `blocked_by`, `tickets`, `updated_by_role` |
| `delivery-manifest` | `initiative`, `manifest_version`, `band_owner`, `issued_on`, `issued_from_verdict`, `story_set_digest`, `accepted_on`, `dispatch_unit`, `max_parallelism`, `completion`, `stories`, `updated_by_role` — see [`delivery-manifest.md`](delivery-manifest.md), **the canonical delivery manifest schema** |
| `technical-assessment` | `initiative`, `mode`, `phase_at_assessment`, `round`, `assessed_on`, `verdicts`, `constraints`, `questions`, `updated_by_role` |
| `context-packet` | `schema_version`, `assembled_on`, `assembled_for_role`, `head_commit`, `context_digest`, `readiness`, `foundation` |


## Engineering-ready product story (`type: requirement`)

**This section is the canonical engineering-ready story schema.** A product
story and a requirement are the same artifact: `REQ-nnnn`, specified in
`architecture/product-memory.md` §4.6, located under its initiative, indexed in
`requirements/index.md`. There is no second story format, no parallel ticket
format, and no export — the handoff contract
([`../architecture/engineering-handoff.md`](../architecture/engineering-handoff.md))
hands over these files and the packet that names them.

A story is **engineering-ready** when every field below is present in the form
stated and the initiative carries a `READY` readiness verdict. The readiness
criteria that judge it are `R1`–`R18` in
[`../architecture/skill-library.md`](../architecture/skill-library.md) §3.9.2;
this schema states the *shape*, those criteria state the *bar*.

### The sixteen required elements

| # | Element | Field or section | Form | Empty form |
| --- | --- | --- | --- | --- |
| 1 | Stable story identifier | `id` | `REQ-nnnn`, matching filename and index row | never empty |
| 2 | Parent initiative | `initiative` | one `INIT-nnnn` | never empty |
| 3 | User/product outcome | `outcome_element` + `## Requirement` | the initiative outcome element this story serves, verbatim as that element is written; body states the outcome in one sentence, in product terms | never empty |
| 4 | Bounded scope | `## Scope` | what this story covers, stated as a boundary and not by example | never empty |
| 5 | Explicit non-goals | `## Non-goals` | what a reasonable reader would expect here and will not get, with one clause of why | `none — the scope statement is the boundary` |
| 6 | Product behaviour | `## Behavior` | defaults, ordering the user can see, error/empty/permission states, and any copy whose wording changes what the user understands | never empty |
| 7 | Acceptance criteria | `acceptance` + `## Acceptance criteria` | ≥1 entry, each with an observable trigger and an observable result; **and, when the story has a user-facing surface, ≥1 entry of the composition class** — see [The composition criterion](#the-composition-criterion-element-7) | never empty |
| 8 | Requirement references | `depends_on` (`REQ-` entries), `supersedes` | identifiers only | `depends_on: [none]` |
| 9 | Design references | `design_refs` | `DES-` ids; each `local_export` must exist on disk | `[]` only when the story has no user-facing surface |
| 10 | Decision references | `decisions` | `PD-` ids in force over this story | `[]` |
| 11 | Dependencies | `depends_on` | typed list: `REQ-`, `PD-`, `DES-`, `CAP-`, or an external system named in `manifest.yaml` | `[none]` — never blank |
| 12 | Sequencing / blocking | `## Sequencing` + the `Stories` table note | every `depends_on` entry restated as the ordering it implies; hidden ordering assumptions are a defect | `none` |
| 13 | Known technical constraints | `constraints` + `## Technical constraints` | one line each, each citing the `technical/` file and round it came from | `[]` |
| 14 | Observability / analytics | `observability` + `## Observability` | the events, metrics, or logs this behaviour must emit to be operable | `[]` — written only when the story genuinely needs none |
| 15 | Rollout | `rollout` | `none \| flagged \| staged \| migration \| coordinated`, plus `## Rollout` when not `none` | `none` |
| 16 | Readiness status | `readiness` | `not-assessed \| engineering-ready \| blocked \| void` | `not-assessed` |

### The composition criterion (element 7)

A story has a **user-facing surface** when it maps to a `DES-` record or changes
anything rendered on a supported surface — the same test element 9 uses, where
`design_refs: []` is the assertion that there is none. Such a story's
`acceptance` block carries **at least one entry beginning with the literal
prefix `composition:`**, and that class covers both of the following in
pass/fail-evaluable terms:

- **(a) Composition across the supported display matrix.** The surface renders
  with no unbounded stretch and no interior chasm at every width in the matrix
  its area (or, with no areas, the product) declares in an accepted decision.
  The widths are named in the criterion, never implied.
- **(b) Data-bearing label integrity.** No amount, date, name or other
  data-bearing value is truncated, clipped or ellipsised at realistic
  worst-case data — the longest value this story's own data can produce, stated
  as that case and not as "long values".

One entry may satisfy both clauses, or the story may carry one entry per
clause; what the schema requires is that both are covered and that each is
evaluable by someone who did not write it. A criterion that says the page
"looks right" or "adapts appropriately" at wide widths is an `R13` finding like
any other evaluative adverb.

A story with `design_refs: []` — backend-only, contract-only, or data-model
work — is **exempt by construction**: it has no surface to compose, and the
prefix is not written for form's sake.

### Additional frontmatter fields

Beyond the common fields, a story carries:

```yaml
initiative: INIT-nnnn
outcome_element: "<the initiative outcome element this story serves>"
acceptance:
  - "<observable trigger → observable result>"
  - "composition: <required whenever design_refs is non-empty>"
capabilities: [CAP-nnnn]        # what this creates or changes
design_refs: [DES-nnnn]         # [] only when there is no user-facing surface
decisions: [PD-nnnn]
depends_on: [none]              # or REQ-/PD-/DES-/CAP-/<external system>
constraints: []                 # binding constraints, each cited in the body
observability: []
rollout: none                   # none | flagged | staged | migration | coordinated
readiness: not-assessed         # not-assessed | engineering-ready | blocked | void
tickets: []
```

`depends_on` is never blank: the literal `[none]` is the assertion that someone
looked. A blank list and an unconsidered list are indistinguishable, which is
what `R6` exists to stop.

### The immutability surface

`architecture/product-memory.md` §4.6 makes a requirement immutable **from the
freeze point** — the moment `SKILL-prepare-engineering-handoff` step `H10` sets
`readiness: engineering-ready` on the story (or, if earlier, the moment the
story appears in any `delivery/tickets.md` row or its initiative reaches
`phase: HANDOFF`).
That immutability covers the story's **product content**; it does not freeze its
lifecycle metadata, or delivery could never record progress against it.

| Content fields — frozen at the freeze point | Lifecycle fields — advanced, never rewritten |
| --- | --- |
| `title`, `outcome_element`, `acceptance`, `depends_on`, `design_refs`, `decisions`, `constraints`, `observability`, `rollout`, and every body section | `status`, `readiness`, `tickets`, `updated`, `revision`, `superseded_by`, `archived_on` |

After the freeze point, changing anything in the left column means a **new**
`REQ-` with `supersedes`, never an edit (`SKILL-supersede-artifact`). Before it,
a content change — including to an `accepted` story — is a plain in-place edit
under the pre-freeze edit contract below. Advancing a field in the right column
is permitted to the roles the `roles:` registry grants it to, and to no others:

- `status` advances only along `accepted → implemented → verified`, by
  `ROLE-orchestrator`, `ROLE-implementer`, `ROLE-reviewer`, or `ROLE-release`;
  it never moves backward, and `withdrawn`/`superseded` are product-side
  transitions written by `ROLE-product-manager`. One exception: before any
  ticket exists for the story, `ROLE-product-manager` may move it
  `accepted → verified` directly when the merged design already meets every
  acceptance criterion. The evidence is the story's row in its initiative's
  `product/state.md` `Design coverage` table, `met-by-design: DES-nnnn@<merge sha>`,
  confirmed by the readiness review (`R15`). Such a story gets no ticket.
- `tickets` is appended by the delivery roles as tickets are created.
- `readiness` is set to `engineering-ready` only by
  `SKILL-prepare-engineering-handoff`, only for a story in the digest of a
  `READY` verdict; any regression or supersession sets it to `void`, and a
  `blocker` `Q-` naming the story sets it to `blocked`.

A delivery role that wants to change a left-column field has found a defect, not
a task: `engineering-handoff.md` §4.2 is the only route.

#### The pre-freeze edit contract

The left column is frozen from the freeze point because an edit past that point
invalidates work verified against the story. Before the freeze point there is no
such work, so the freeze does not bind. A content change to any `REQ-` or `DES-`
— any status, including `accepted` — before the freeze point is a **plain
in-place edit** that must:

- bump `revision`;
- set `updated`; and
- pay, once per editing pass — `readiness_verdict` → `void` if one is recorded;
  any coherence verdict predating the edit goes to `R9`'s judged currency clause,
  where the date gap is a flag and only a substantive mismatch with the edited
  text is a finding (it neither bars `READINESS` entry nor is stale
  by date alone); and `converged` → `false` if it was declared.

Git commits (`~/.claude/agents/product-manager-orchestrator.md` §9a.6) are the
audit trail for a pre-freeze edit. There is no Repair log row, no recorded
finding id, and no window condition to satisfy.

Any story being withdrawn, split, merged, or moved between initiatives is
superseded as above regardless of freeze state — those change the identifier
set rather than a field.

**An inbound reference to a superseded identifier is not an `R12` defect.** It
resolves through its index to a record that announces its own replacement, which
is the designed behaviour (`SKILL-supersede-artifact` step 6). What `R2` forbids
is a post-freeze content edit in place, and a pre-freeze supersession used to
repair content instead of a plain edit.

**Nor, once the referring story is frozen, is it an `R10` defect.** A frozen
story's `depends_on` naming a `superseded` `REQ-`/`PD-` whose `superseded_by`
chain terminates at an `accepted` record passes `R10` —
re-pointing it would mean superseding a story that has no defect, and cascading
that renumber through every story downstream of it. Before the freeze point the
exemption does not apply: there the re-point is a plain in-place edit and is the
required repair. The exemption is bounded: the validator walks `superseded_by`
to at most `manifest.yaml:context.supersession_chain_max_depth` hops, and a chain
that exceeds that depth, revisits an identifier, or ends at a record that is not
`accepted` (`withdrawn`, `draft`, `proposed`, or unresolved) still fails `R10`.
There is no exemption for an open `Q-`, and whether the successor still says what
the frozen story relied on is a judged question (coherence delta check, `R9`),
not an `R10` one.

## The delivery manifest

The `delivery-manifest` type is specified in full in
[`delivery-manifest.md`](delivery-manifest.md), not here, because it is the only
artifact with **two bands and two writers separated in time**: a product band
written once by `ROLE-product-manager` and frozen at acceptance, and an execution
band written afterwards by `ROLE-orchestrator` at initiative scope. That split is
the same mechanism as this document's immutability surface — content frozen,
lifecycle advanced — applied to a whole story set rather than to one story.

## Rules

- Dates are absolute ISO dates. "Last week" is not a date.
- List fields are YAML lists of identifiers, never prose.
- Unknown extra fields are permitted but are advisory: no agent may rely on a
  field this schema does not define.
- `id` must agree with the filename, and both must agree with the index row.
  A disagreement is a defect to fix, not a variant to tolerate.
- A field's explicit empty form (`none`, `[none]`, `[]`) is written, never
  omitted, wherever this schema names one. Absence is not an answer.

## Session-local types

`context-packet` is the one type in this schema that is **never stored under
`product/`**. It is specified here so that every implementation emits the same
structure, and constrained here so that no one mistakes it for memory: its
`status` is always `advisory`, it is never indexed, and no session may read
another session's packet. See `../architecture/context-assembly.md` §10.
