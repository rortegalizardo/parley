---
id: ARCH-authority
type: architecture
title: Authority, versioning, and supersession rules
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Authority, versioning, and supersession

An agent must be able to tell, from the artifact alone, whether it may act on
what it is reading. That judgement is made from two things: the `status` field
and the file's location.

## 1. Status vocabulary

| `status` | Meaning | May an agent act on it? |
| --- | --- | --- |
| `authoritative` | Current truth for its subject. | **Yes.** |
| `accepted` | Decision/requirement in force. | **Yes.** |
| `active` | Initiative currently being worked. | **Yes.** |
| `draft` | Being written; not agreed. | No — may be edited, not relied on. |
| `proposed` | Awaiting acceptance. | No — not binding. |
| `blocked` | Active but stalled; see `blocked_by`. | Read yes, advance no. |
| `shipped` | Completed work, retained in place. | Historical reference only. |
| `superseded` | Replaced; see `superseded_by`. | **No.** Follow the pointer. |
| `historical` | No longer describes the product. | **No.** Context only. |
| `rejected` / `withdrawn` / `abandoned` | Deliberately not pursued. | **No** — and do not re-propose without reading why. |
| `advisory` | Informational input, never binding. | Consider, do not treat as decided. |

Every artifact carries exactly one `status`. A file with no `status` is treated
as `draft` — not as authoritative.

## 2. The four ways to spot non-authoritative content

1. **Status field** — anything other than `authoritative`/`accepted`/`active`.
2. **Location** — anything under `product/archive/` is non-authoritative by
   position, regardless of what its status says.
3. **Absence from the index** — an artifact not listed in its collection index
   is not part of the authoritative set. Indexes are the closed world.
4. **Staleness declaration** — mirrors of external systems carry `synced_on`.
   A mirror is *advisory* once it is older than its declared
   `freshness_window` (default: 24h for ticket manifests). Advisory mirrors may
   inform planning but must be re-synced before being acted on destructively.

## 3. One authoritative record per subject

For any given subject there is exactly one authoritative artifact. Where two
records describe the same capability, one of them is wrong and must be
superseded — never left as a parallel truth. Conflicts are resolved in this
order:

1. an `accepted` decision beats any narrative text;
2. a newer `authoritative` capability beats an older initiative's description
   of intended behavior;
3. `product/project/constraints.md` beats everything except a decision that
   explicitly amends it;
4. anything unresolved after that becomes a `Q-` blocker, not a guess.

## 4. Versioning models

**Revision-in-place (mutable artifacts).** Capabilities, initiatives, areas,
project context, roles, skills. Edit the file, bump `revision`, update
`updated`, append a *Change log* row naming what changed and why. Git holds the
prior text; no copies are kept.

**Supersession (immutable / append-oriented artifacts).** Decisions, always.
Requirements and design references, from the freeze point onward:
the moment `SKILL-prepare-engineering-handoff` sets `readiness:
engineering-ready` on the story, or earlier if it appears in a
`delivery/tickets.md` row or its initiative reaches `phase: HANDOFF`. Before
the freeze point, a `REQ-` or `DES-` — whatever its `status` — is repaired **in
place**, keeping its identifier, under the pre-freeze edit contract
(`product/schemas/frontmatter.md` §"The pre-freeze edit contract"): bump
`revision`, set `updated`, and pay any verdict-voiding effect once. Superseding
a pre-freeze `REQ-`/`DES-` instead would be a post-acceptance renumber, which
readiness criterion `R2` fails. Everything below applies to a decision at any
time, and to a `REQ-`/`DES-` once it is frozen:

1. create the new artifact; set its `supersedes: <old-id>`;
2. on the old artifact set `status: superseded`, `superseded_by: <new-id>`,
   `archived_on: <date>`;
3. move the old file to `product/archive/<collection>/` **unless** it is a
   decision — decisions stay in `product/decisions/` because their reasoning is
   read constantly, and their `status` alone is sufficient warning;
4. update both the collection index and `product/archive/index.md`;
5. leave inbound references pointing at the old identifier alone. They resolve
   to a record that names its replacement, which is the desired behaviour.

**No versioning (state artifacts).** `delivery/state.md`, board, ticket
manifests, indexes. These describe *now* and are overwritten. Their history is
git history plus their own appended stage logs.

## 5. Supersession is not deletion

Nothing is deleted. The reason a stateless agent does not re-open a settled
question is that the superseded record and its rationale are still readable.
Deleting an artifact destroys exactly the memory this system exists to keep.
The only removals permitted are of artifacts created in error and never
referenced — and even then the identifier is retired, not reused.
