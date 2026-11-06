---
initiative: INIT-nnnn
type: solution-contract
title: <Solution contract — initiative title>
status: draft
revision: 1
owner_role: ROLE-product-manager
drafted_by: sonnet-drafting-child
validated_by: ROLE-product-manager
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
chosen_decision: PD-nnnn
design_refs: []
---

# Solution contract — INIT-nnnn

> Shape of `initiatives/INIT-nnnn-<slug>/product/solution-contract.md`. A
> required exit artifact of SOLUTION_CONVERGENCE
> (`product-manager-orchestrator.md` §12.6). Drafted by a sonnet drafting
> child from the chosen `PD-` and the designer's concept output; validated by
> the PM against those raw sources, not only against the draft, before
> acceptance (§9b). **A contract cites raw sources; it never supersedes
> them.** Any validator may diff this contract against the `PD-` and `DES-`
> records it cites and treat a drift between them as a defect in the
> contract, never in the raws.

## Chosen concept

_The chosen solution shape, in one paragraph, citing the accepted `PD-nnnn`
that made this the committed option._

## Key journeys

_The user journeys the chosen concept commits to, each citing the `REQ-` it
serves. Not a re-derivation of the designer's flow — a pointer to it plus
the one-line shape._

## UX behavior

_The interaction behavior a reader needs to know without opening the design
tool: defaults, ordering, what changes across the state matrix._

## Visual direction

_The visual language this concept commits to — design-system alignment,
any new pattern this concept introduces (and the decision that records it),
or `none — reuses existing patterns` explicitly._

## Accepted trade-offs

_What this option gives up relative to the rejected ones, and why that cost
was accepted — mirrors the `Options` table row for the chosen option, cited
rather than restated in full._

## Unresolved risks

_Architectural or design risks carried forward into DECOMPOSITION rather
than resolved here, each with what would resolve it. `none` if the chosen
option carries none._

## DES- references

_Every `DES-` record this contract commits to, with its committed
`local_export` path._

| DES- id | Local export | Requirements served |
| --- | --- | --- |
