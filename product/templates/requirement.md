---
id: REQ-nnnn
type: requirement
title: <one testable statement>
status: draft
revision: 1
owner_role: ROLE-product-manager
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
initiative: INIT-nnnn
outcome_element: <the initiative outcome element this story serves>
acceptance: []
capabilities: []
design_refs: []
decisions: []
depends_on: [none]
constraints: []
observability: []
rollout: none              # none | flagged | staged | migration | coordinated
readiness: not-assessed    # not-assessed | engineering-ready | blocked | void
tickets: []
supersedes:
superseded_by:
---

# REQ-nnnn — <title>

> A requirement **is** the engineering-ready product story. The canonical schema
> is `schemas/frontmatter.md` §"Engineering-ready product story"; its sixteen
> elements are the sections below plus the frontmatter above. Every section is
> written — an element with nothing to say carries its explicit empty form, never
> a blank.

## Requirement

_One statement of what must be true for a user, in product terms. If it needs
"and", it is probably two requirements._

## Scope

_Where this story ends, stated as a boundary. "…and similar cases" is not a
boundary._

## Non-goals

_What a reasonable reader would expect here and will not get, with one clause of
why. Or: `none — the scope statement is the boundary`._

## Behavior

_Defaults, ordering the user can see, error / empty / permission states, and any
copy whose wording changes what the user understands. Anything left unsaid here
is a product decision an implementing agent will make instead (`R17`)._

## Acceptance criteria

- [ ] _Observable trigger → observable result. A reviewer decides pass/fail
      without asking the author what was meant._
- [ ] _`composition:` — required whenever `design_refs` is non-empty. Names the
      widths of the supported display matrix (set by an accepted decision for
      the area, or for the product when it has no areas) with no unbounded
      stretch and no interior chasm,
      and the realistic worst-case data at which no amount, date or name is
      truncated. Omit entirely when `design_refs: []`. See
      `schemas/frontmatter.md` §"The composition criterion"._

## Sequencing

_What each `depends_on` entry implies about ordering, in words. Mirrored in the
`Stories` table of `product/state.md`. Or: `none — on the frontier`._

## Technical constraints

_Binding constraints only, one line each, each citing the `technical/` file and
round it came from. Not the reasoning — that stays in the assessment._

## Observability

_Events, metrics, or logs this behaviour must emit to be operable. Or: `none`._

## Rollout

_Only when `rollout` is not `none`: the flag, the stages, the migration, or the
coordination this behaviour requires._

## Notes

_Context that helps an implementer; never new requirements smuggled in as prose._

> **Immutable once `status: accepted`** — in its product content. The lifecycle
> fields `status`, `readiness`, and `tickets` are advanced by the delivery roles
> under the restricted authority in `manifest.yaml`. Any content change is a new
> `REQ-` with `supersedes`.
