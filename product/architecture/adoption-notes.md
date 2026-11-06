---
id: ARCH-adoption
type: architecture
title: Adoption notes — provenance of this Product Memory tree
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Adoption notes

Repository-specific record of how this Product Memory tree was installed here.
The generic specification lives in the sibling documents; this file holds only
the local facts.

## Provenance

Scaffolded on 2026-11-06 by `SKILL-bootstrap-product-memory` from the Core
product-memory template, version `1.0.0`. Nothing was copied from
another project: the template holds structure only (architecture, schemas,
blank templates, empty indexes, and a manifest with every identifier counter at
its starting value, `0`).

`ROLE-product-bootstrapper` is only the provenance label for this one-time
scaffold. No agent backs it: the product manager, loading the bootstrap skill,
performed it. It holds no authority from now on and is deliberately absent from
`manifest.yaml` `roles:`. Structural change to this tree later is
`ROLE-product-architect`'s; product content belongs to the phase machine.

## Inputs recorded at bootstrap

| Input | Value |
| --- | --- |
| Product name | Parley |
| Product key | `PRL` |
| Scaling profile | `S` |
| Issue tracker | Ariadne, project `PRL` |
| Up-front constraints | "Never restart or touch the live Parley server on port 4142, and never use port 4141 (the upstream install). Test on an isolated port."; "Parley's UI is plain ui/index.html, ui/app.js and ui/styles.css: no React, no Storybook, no build step."; "Design at 1440 wide, light theme only; dark mode and other widths follow from the existing CSS and are never designed or reviewed separately." |
| Product description | given; transcribed into `project/mission.md` |

## Workspace and session-local folders

Other architecture documents cite this section (`HY1` in `lifecycle-hooks.md`,
the per-ticket working folder in `engineering-handoff.md`, where an HLD lives in
`repository-layout.md`).

**The workspace is not a repository.** The folder that holds this repository
may hold other repositories, some with their own `product/` tree, and
unversioned working folders. Authoritative product memory is version-controlled
with the code it describes, so for this product it lives only in this
repository's `product/`. A session resolves its canonical root from the
declared repository root, never from proximity to its working directory.

**Ticket working folders are session-local.** The per-ticket folder
(`~/Factory/Artifacts/projects/<PROJECT>/tickets/<ticket_code>/`) and batch files
(`~/Factory/Artifacts/projects/<PROJECT>/batches/`) sit outside any repository and are session
working memory, not authoritative product state. Anything in them that must
survive as product memory is promoted into `product/`:

| Working-folder content | Promoted to |
| --- | --- |
| Design drafts and captures | `product/initiatives/INIT-nnnn-*/design/` as a `DES-` record + committed export |
| Execution plan, HLD | Stays session-local; the durable part (scope, requirements, ticket graph) is the initiative's `requirements/` and `delivery/tickets.md` |
| Run logs, worktree state | Session-local. Never promoted. |
| Batch files, notes | Session-local; anything with lasting product meaning becomes a `PD-` or `Q-` record |

**One product per repository.** Where a product spans several repositories, one
repository carries `product/` and the others reference it by name. Splitting
`product/` across repositories is not permitted.

## What the bootstrap generated

- `manifest.yaml` from the template, with the inputs above.
- `project/mission.md` (`draft`), `project/constraints.md` (`authoritative`),
  `project/principles.md` (`draft` skeleton), `project/glossary.md`
  (`authoritative`, empty).
- `design/design-system.md` and `design/north-star.md` as draft stubs.
- Every collection index empty, with its header row only.
- No `PD-`, `INIT-`, `REQ-`, `Q-`, `CAP-` or `DES-` record. The first record of
  each type allocates `nnnn = 0001`.

## Known gaps

Open at bootstrap, by design or because they need a later decision:

- **Draft foundation.** `project/mission.md` and `project/principles.md` are
  drafts. `context-assembly.md` §9 expects an open `Q-` asking for a draft
  mission; the bootstrap allocates no identifiers, so the first
  product-manager session raises it (or hardens the mission in DISCOVERY).
- **No supported display matrix.** The story schema's `composition:` criterion
  names the widths a user-facing surface must render at. No decision of this
  product sets them yet; the first initiative with a user-facing surface needs
  a `PD-` that does before its stories can pass readiness.
- **Design reference docs carry no frontmatter.** `design/north-star.md` and
  `design/design-system.md` are reference docs, not `DES-` records, so they are
  read as drafts that bind nothing.
