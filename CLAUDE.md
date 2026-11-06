Repo rules start at `AGENTS.md`.

# Product Memory

`product/` is the canonical, version-controlled root for all product-orchestration
state: mission and constraints, the capability registry, product decisions,
initiatives with their requirements and design references, delivery state, and
ticket/dependency manifests.

Start at [`product/README.md`](product/README.md), which defines the bootstrap
procedure for a session that begins with no memory. Read
`product/architecture/authority-and-versioning.md` before writing any artifact
there.

Authoritative product state lives **only** under `product/`. Session scratch —
temporary directories, agent workspaces, and folders outside this repository —
is discardable and must never be cited as truth.
