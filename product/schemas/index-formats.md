---
id: SCHEMA-index-formats
type: schema
title: Index and manifest formats
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Index and manifest formats

Indexes are the closed world: an artifact that is not indexed is not part of the
authoritative set. Every index is a markdown table, one row per artifact, sorted
by identifier ascending.

## Collection index (areas, capabilities, decisions, initiatives, questions, design)

Required columns, in order:

| Column | Contents |
| --- | --- |
| `ID` | The stable identifier. |
| `Title` | Short human title. |
| `Status` | The artifact's `status`, copied. |
| `Path` | Repository-relative path, as a markdown link. |
| `Updated` | `YYYY-MM-DD`. |

Optional columns, appended in this order when applicable: `Area` (profile M/L),
`Initiative` (requirements, design), `Severity` (questions).

## Area index (`areas/index.md`, profile M/L only)

A collection index in the standard shape above, with `Path` pointing at
`<slug>/area.md` and **no** `Area` column — an area does not scope itself.
Sorted by `AREA-<slug>` ascending, which is alphabetical rather than numeric,
because `AREA-` is a slug identifier and allocates no counter
([`../architecture/identifiers.md`](../architecture/identifiers.md) §1).

Present only when `manifest.yaml:areas` is non-empty; under profile S the
`areas/` directory does not exist at all, per the no-empty-hierarchy rule.
`manifest.yaml:areas` and this index must agree — a registered area with no
record, or a record with no registration, is a `D3`/`D4` defect.

**An empty `Area` cell in any other index means *product-global or not yet
scoped*, and the two are not distinguishable.** A promotion may legitimately
leave the entire pre-promotion set untagged
([`../architecture/scaling-profiles.md`](../architecture/scaling-profiles.md),
promotion step 3), so absence of an area is never evidence that someone decided
the artifact was cross-cutting. An index that adds the column says which case
its blanks are in.

## Requirement index

`ID | Title | Status | Initiative | Path | Updated`.
The `Initiative` column is what makes a bare `REQ-` identifier resolvable after
a requirement moves between initiatives.

Requirements are also product stories: their per-artifact schema is
[`frontmatter.md`](frontmatter.md) §"Engineering-ready product story". This index
deliberately does **not** carry a readiness column — readiness is a property of
the story and of its initiative's verdict, and a copy here would be a third place
for it to disagree.

## Story table (`initiatives/INIT-nnnn-*/product/state.md`, `## Stories`)

Not an index — a per-initiative manifest of the decomposed story set, owned by
`ROLE-product-manager`. Required columns, in order:

`REQ- | Title | Status | CAP- | DES- | Sequencing note`.

The `Sequencing note` cell restates, in words, the ordering each of the story's
`depends_on` entries implies; `none` when the story is on the frontier. This is
the column readiness criterion `R7` is evaluated against, and the reason a
dependency cannot be carried only in frontmatter — a graph nobody rendered is a
graph nobody checked. The graph over this table must be acyclic.

## Ticket manifest (`delivery/tickets.md`)

`Ticket | Title | Initiative | Requirements | Depends on | Branch | PR | Status`.

Plus a `synced_on: YYYY-MM-DD` line and a `freshness_window` above the table.
`Depends on` holds tracker keys and defines execution order; an empty cell means
the ticket is on the executable frontier.

The `Requirements` column is the **only authoritative story↔ticket mapping**
(`../architecture/engineering-handoff.md` §2.3). Every ticket names ≥1 `REQ-`;
one story may appear on several tickets; a ticket never names stories from two
initiatives.

The initial mapping — `Ticket`, `Title`, `Initiative`, `Requirements`, `Depends
on` — is written by `ROLE-product-manager` as the last act of HANDOFF, via
`SKILL-create-tickets-from-stories`. `Branch`, `PR`, and `Status` are written by
the delivery roles from then on. Every tracker key comes from an Ariadne response:
the product side calls the real tracker and copies what it returns, and a `REQ-`
identifier is never re-encoded into a tracker key.

The ticket manifest is **not** the delivery manifest
([`delivery-manifest.md`](delivery-manifest.md)). This file owns tracker keys,
the ticket↔story mapping, branches, PRs, status, and ticket `Depends on`; the
delivery manifest owns the approved story set, its waves, and dispatch state, and
**projects** this file's columns rather than duplicating them. On disagreement the
repair runs from this file into the manifest, never the reverse.

## Delivery board (`delivery/board.md`)

`Initiative | Title | Stage | Blocked by | Next action | Updated`.
Contains every initiative whose status is `active` or `blocked`. Excludes
`draft`, `shipped`, and `abandoned`.

## Archive index

`ID | Title | Type | Superseded by | Archived on | Path`.

## Maintenance rule

An index row is written in the **same commit** as the artifact it describes.
An index that disagrees with the filesystem is a defect: the filesystem is the
data, the index is the contract, and the contract must be repaired immediately
rather than worked around.
