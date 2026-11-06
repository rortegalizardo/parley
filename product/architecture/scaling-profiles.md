---
id: ARCH-scaling
type: architecture
title: Scaling profiles
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Scaling profiles

The same architecture serves a two-service application and a platform of many
independently evolving domains. Size is expressed by which *optional* pieces
are present — never by a different structure. The active profile is declared in
`manifest.yaml:scaling_profile`.

## Profile S — flat *(default)*

For a product small enough that one person can hold it in their head: one
frontend and one backend, a single deployable, a handful of capabilities.

- No `areas/` directory at all.
- No `area:` field on any artifact.
- `capabilities/`, `decisions/`, `initiatives/` are flat collections.
- Project context is the only strategic layer.

Nothing about profile S is a reduced or "starter" version of the model. Every
identifier, index, and authority rule is identical to profile L. A profile-S
project that never grows never pays for hierarchy it does not have.

## Profile M — areas

Adopted when the product has several components that evolve on their own
schedules and start to need distinct strategy — several services, a separate
mobile client, distinct customer-facing domains.

- `areas/index.md` plus one `areas/<slug>/area.md` per area.
- Capabilities, decisions, and initiatives may carry `area: AREA-<slug>`.
- Artifacts without an `area` are product-global. **This is a valid, permanent
  state** — cross-cutting work does not need a home area invented for it.

## Profile L — areas with subsystems

Adopted when a single area is itself large enough to need internal structure —
a platform domain with several services, or a client with several independently
released surfaces.

- `areas/<slug>/subsystems/<slug>/subsystem.md`.
- Artifacts may carry `subsystem: <slug>` alongside `area:`.
- Areas may declare `parent_area` for a two-level domain tree. Deeper nesting is
  not permitted; if it seems necessary, the product likely wants two products.

## Promotion: S → M → L

Promotion is additive and never rewrites identity. Because scope is carried in
a *metadata field* rather than in a path, no file moves and no identifier
changes.

1. Create `product/areas/index.md` and the `area.md` for each new area.
   `ROLE-product-architect` writes each record's **structural band** — its
   existence, `id`, `parent_area`, and **Boundary**. **Vision**, **Strategy**,
   and **Area vocabulary** are product content and are left for
   `ROLE-product-manager` (the `area` grant in the `roles:` registry is
   banded accordingly). An area record whose product band is
   unwritten is a valid, expected intermediate state — do not stall the
   promotion on it, and do not let the architect fill it in.
2. Register the areas in `manifest.yaml:areas` and set `scaling_profile`.
   `AREA-` is a slug identifier and allocates no counter: `id_counters.area`
   is not touched by a promotion.
3. Optionally add `area:` to the frontmatter of existing artifacts that clearly
   belong to one. Leave genuinely cross-cutting artifacts unscoped — **and
   leave the whole pre-promotion set unscoped if that is the honest state.**
   Scoping an existing `CAP-`/`PD-`/`INIT-` is a judgement about product
   content, so it is `ROLE-product-manager`'s and not the promoting architect's;
   it is legitimately deferred to whenever each artifact is next touched. The
   cost of deferring is that an empty `Area` cell then means *product-global or
   not yet scoped* and the two are indistinguishable; say so in the index, so a
   later reader does not mistake absence for a decision.
4. Add the `Area` column to `capabilities/index.md`, `decisions/index.md`, and
   `initiatives/index.md`, appended last per
   [`../schemas/index-formats.md`](../schemas/index-formats.md).
5. Record the promotion as a decision (`PD-`), because it changes how every
   future agent reads the tree.

Demotion (L → M → S) is the same in reverse: retire the areas to
`product/archive/areas/`, strip the `area:` fields, and record the decision.

## When to promote — and when not to

Promote when **finding things has become the bottleneck**: the index for a
collection no longer fits on a screen, or two groups of work regularly need
different strategy statements.

Do not promote because the project *feels* big, because a new service was
added, or because hierarchy looks more professional. Premature areas are pure
cost: every artifact then needs a scoping decision, and cross-cutting work
acquires an argument about where it lives. Profile S is the correct answer for
most products, permanently.
