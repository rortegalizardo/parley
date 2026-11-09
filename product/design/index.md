# Design reference index

Every design reference, whether authored in-repository or captured from an
external design tool.

| ID | Title | Status | Path | Updated | Initiative | External system | Local export |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DES-0001 | Room Brief hero frames (Brief tab; Create room fields and Pin dialog) | accepted | DES-0001-room-brief-hero-frames.md | 2026-11-06 | INIT-0001 | none | initiatives/INIT-0001-room-brief/design/heroes/ |
| DES-0002 | Clone room setup reference frame (room menu item and dialog) | accepted | DES-0002-clone-room-setup-reference-frame.md | 2026-11-06 | INIT-0002 | none | initiatives/INIT-0002-clone-room-setup/design/heroes/ |

## Reference docs

[north-star.md](north-star.md) and [design-system.md](design-system.md) are
reference docs, not `DES-` rows. Both are draft stubs written at bootstrap: no
design foundation exists yet, and nothing in either file binds. Initiative work
creates the foundation.

## Rule for external designs

An external link is a pointer, never the deliverable. Every `DES-` record must
carry a **committed local export** (markup, CSS, assets, or at minimum
annotated screenshots) under its initiative's `design/assets/`. Implementation
roles build from the local export, because the execution environment may have
no access to the external tool. A `DES-` record with an `external_url` and no
`local_export` is incomplete and must be treated as `draft`.

## What a durable reference must carry

A URL is not an identity. Every `DES-` records the platform, the durable
project/file id, the durable page/node id, and the revision marker the platform
reports at capture time — so the reference still resolves after a rename, and a
later session can tell whether the external design has moved on from the export.

**Never persist a transient reference.** Preview URLs, tokened share links, and
session-scoped export paths expire; a reference that expires is not a reference.
Nothing in a scratch directory or session workspace is authoritative.

## Versioning

`DES-` records are supersede-only. Before handoff a design is `draft` and is
edited in place. After handoff it is never edited: a change is a new `DES-` via
`SKILL-supersede-artifact`, with `supersedes:`/`superseded_by:` pointing both
ways and both index rows updated in the same commit. The superseded record's
local export is **retained** — a superseded design whose export was deleted
cannot be audited against later, which defeats keeping it.

Owner: `ROLE-product-designer` (`SKILL-capture-design`).
