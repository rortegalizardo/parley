---
id: ARCH-identifiers
type: architecture
title: Identifier and naming conventions
status: authoritative
revision: 1
owner_role: ROLE-product-architect
created: 2026-11-06
updated: 2026-11-06
---

# Identifier and naming conventions

## 1. Grammar

```
<PREFIX>-<NNNN>            numeric identifiers, 4-digit zero-padded
<PREFIX>-<slug>            slug identifiers
```

| Artifact | Identifier | Filename | Example |
| --- | --- | --- | --- |
| Area | `AREA-<slug>` | `areas/<slug>/area.md` | `AREA-payments` |
| Capability | `CAP-nnnn` | `CAP-nnnn-<slug>.md` | `CAP-nnnn` |
| Decision | `PD-nnnn` | `PD-nnnn-<slug>.md` | `PD-nnnn` |
| Initiative | `INIT-nnnn` | `INIT-nnnn-<slug>/` | `INIT-nnnn` |
| Requirement | `REQ-nnnn` | `REQ-nnnn-<slug>.md` | `REQ-nnnn` |
| Design reference | `DES-nnnn` | `DES-nnnn-<slug>.md` | `DES-nnnn` |
| Question / blocker | `Q-nnnn` | `Q-nnnn-<slug>.md` | `Q-nnnn` |
| Agent role | `ROLE-<slug>` | `~/.claude/agents/<slug>.md` | `ROLE-tech-lead` |
| Skill | `SKILL-<slug>` | `~/.claude/skills/<slug>/SKILL.md` | `SKILL-batch-fanout` |
| Ticket | *external key, verbatim* | — | `<PROJECT>-95` |

Slugs are lowercase kebab-case, ASCII, 2–6 words, describing the subject and not
the status (`recurring-transactions`, not `recurring-transactions-v2-final`).

`ROLE-` and `SKILL-` are the two identifier spaces whose artifact is a
**declaration in the global agent home**, not a file under `product/`.
What the repository holds for them is the binding: the `roles:` registry in
[`../manifest.yaml`](../manifest.yaml) for `ROLE-`, and the contract in
[`skill-library.md`](skill-library.md) §3 for `SKILL-`. They allocate no counter
in `id_counters`, exactly like `HOOK-` and `DM-`.

## 2. Allocation

1. Read the counter in `product/manifest.yaml` under `id_counters.<type>`.
2. The new identifier is `counter + 1`.
3. Write the artifact **and** the incremented counter **and** the index row in
   one commit.

If two branches allocate the same number concurrently, the merge conflicts in
`manifest.yaml` — which is the intended behaviour. Resolve by renumbering the
*later-merged* artifact (rename the file, update its `id`, and fix inbound
references found by grepping the old identifier) before merging.

## 3. Stability rules

- **Identifiers are permanent.** Once allocated, an identifier is never reused,
  never renumbered, and never recycled after archival.
- **Identity is independent of location.** A requirement keeps `REQ-nnnn` when
  it moves between initiatives; a capability keeps `CAP-nnnn` when an area is
  introduced. Only the index row changes.
- **Identity is independent of status.** Superseded artifacts keep their
  identifier so old references still resolve — to a record that announces its
  own supersession.
- **Slugs may be corrected; numbers may not.** Renaming
  `CAP-nnnn-recuring-txns.md` → `CAP-nnnn-recurring-transactions.md` is a
  legitimate typo fix. Update the index row in the same commit.

## 4. Cross-references

Reference other artifacts by **identifier**, in frontmatter and in prose:

```yaml
requirements: [REQ-nnnn, REQ-mmmm]
supersedes: PD-nnnn
```

Prose may link by relative path in addition to the identifier, but the
identifier is what makes the reference durable — paths change, identifiers do
not. A reference to an identifier that appears in no index is a broken
reference and should be raised as a `Q-` record rather than silently ignored.

## 5. External ticket identifiers

Tracker keys are never re-encoded into a local identifier space. `<PROJECT>-95` is
written as `<PROJECT>-95` everywhere. The mapping ticket ↔ requirement ↔ initiative
lives in the ticket manifests, so a bare tracker key resolves through
`product/delivery/tickets.md` in one lookup.
