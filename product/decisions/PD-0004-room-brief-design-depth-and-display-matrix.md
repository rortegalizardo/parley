---
id: PD-0004
type: decision
title: Room Brief design is two hero frames at 1440 light, used as the engineering reference; Parley's display matrix is 1440 light
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0001]
supersedes:
superseded_by:
---

# PD-0004 — Room Brief design is two hero frames at 1440 light, used as the engineering reference; Parley's display matrix is 1440 light

## Context

The default product design path (`design-dispatch` §8) builds the chosen
direction as code on a design branch — plan, components with stories,
composed screens, a render script, visual sign-off, a code `DES-` — and
assumes a React design-system package with Storybook and committed render
scripts. Parley has none of these and must not get them
([constraints](../project/constraints.md) #2: plain `ui/` files, no React, no
Storybook, no build step). Design as code in `ui/` would be the product code
this run must not write ([run instructions](../initiatives/INIT-0001-room-brief/product/sources/run-instructions.md)).
The requester set the depth: "Design at 1440, light only; one hero frame for
the Room Brief panel (Goal/Rules/Decisions, archived decisions, length
warning, "What agents see" preview) is enough"
([run instructions](../initiatives/INIT-0001-room-brief/product/sources/run-instructions.md);
[raw request](../initiatives/INIT-0001-room-brief/product/sources/raw-request.md), "Constraints").

## Decision

1. **Design depth for INIT-0001.** Step 1a (direction briefs) is skipped: the
   requester's decisions ([PD-0002](PD-0002-room-brief-requester-decisions.md))
   fix the direction. Step 1b produces two static hero frames that link
   Parley's own `ui/styles.css`: `room-brief-brief-panel` (Room settings →
   Brief tab, every part visible) and `room-brief-dialogs` (Create room brief
   fields beside the Pin to room brief dialog — the two other surfaces the
   stories change). Production steps 2a–9 and the design PR do not run; the
   hero frames, recorded as `DES-0001` with their HTML and PNG as its
   `local_export`, are the engineering reference.
2. **Engineering builds from `DES-0001` and the acceptance criteria.** Where a
   hero and a requirement differ, the requirement wins; the hero's sample text
   is illustrative only.
3. **Display matrix.** Parley's supported display matrix is **1440 wide, light
   theme** ([constraints](../project/constraints.md) #3). `composition:`
   acceptance criteria name 1440 light; other widths and dark mode follow from
   the existing CSS and are never designed or reviewed separately.
4. **The requester is not asked to pick a direction**: the run is
   pre-authorized with no approval stops; the PM chooses at
   SOLUTION_CONVERGENCE.

## Options considered

| Option | Why not |
| --- | --- |
| Full design-dispatch production path (plan, components, compose, sign-off, code `DES-`) | Needs React/Storybook and render scripts Parley must not have (constraints #2); building screens in `ui/` is product code; the requester asked for one hero frame. |
| One frame only (the Brief panel) | Create room and the pin dialog also change; without a frame they have no design reference (readiness `R4`). The second frame is small. |
| Several directions with briefs | The placement and parts are already decided (PD-0002). |

## Consequences

Costs: no code-level design review before engineering; visual fidelity is
checked by the engineer and reviewer against the hero PNGs. Benefits: design
effort matches a one-surface change in a plain HTML/JS app, and engineering
gets a concrete reference for every changed surface.
