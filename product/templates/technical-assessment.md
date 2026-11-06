---
initiative: <INIT-nnnn>
type: technical-assessment
title: <Technical assessment — initiative title>
status: authoritative
revision: 1
owner_role: ROLE-planner
mode: PRODUCT-DISCOVERY
phase_at_assessment: <DISCOVERY|PRODUCT_DEFINITION|SOLUTION_EXPLORATION|DECOMPOSITION>
round: <n>
assessed_on: <YYYY-MM-DD>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
verdicts: []
constraints: []
questions: []
updated_by_role: ROLE-planner
---

# Technical assessment — <INIT-nnnn>

Shape of `initiatives/INIT-nnnn-<slug>/technical/assessment.md`. Its siblings —
`capability-scan.md`, `impact.md`, `coherence.md` — carry the same frontmatter
with their own body sections, given in the skill contracts
(`../architecture/skill-library.md` §3.23–§3.26).

Written **only** by `ROLE-planner` in PRODUCT-DISCOVERY mode. Append a new
dated round rather than rewriting an earlier one; mark superseded rows, never
delete them. The engineering HLD mode writes nothing here.

## Verdicts

| Option | Requirements served | Verdict | Complexity band | One-line basis |
| --- | --- | --- | --- | --- |

`feasible | feasible-with-constraints | infeasible` ·
`contained | multi-component | cross-system | structural`. Never a duration.

## Constraints

| # | Option | Constraint | permanent / initiative-local | Source | PD- candidate? |
| --- | --- | --- | --- | --- | --- |

## Architectural risks

| # | Option | Risk | What it threatens | What would resolve it |
| --- | --- | --- | --- | --- |

## Security / data / compliance implications

| Option | Data class | Implication | Source row in impact.md |
| --- | --- | --- | --- |

## Product assumptions that conflict with the platform

| # | Assumption (and where stated) | Platform fact | blocking / narrowing / costly | Raised as |
| --- | --- | --- | --- | --- |

State "none found" explicitly rather than leaving this section empty.

## Open questions raised

| Q- id | What it blocks |
| --- | --- |
