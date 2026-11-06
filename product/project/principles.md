---
id: PROJECT-principles
type: project-context
title: Product principles
status: accepted
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
---

# Product principles

> **Status: accepted** at INIT-0001 DISCOVERY (2026-11-06),
> [PD-0001](../decisions/PD-0001-accept-mission-and-first-principles.md). Each
> principle below is the requester's own rule, cited.

Principles are tie-breakers, not slogans. Each one must be capable of losing an
argument: if a principle would never cause a feature to be rejected, it is not
a principle.

| # | Principle | What it rules out |
| --- | --- | --- |
| 1 | Only the user changes a room's shared brief. Agents and Parley may suggest text; the user accepts it. (Requester: "Only the user edits the brief", INIT-0001 raw request; "changed only by the user", `CHECKPOINT.md` 2026-10-28.) | Agents or Converge writing to the room's shared context; automatic edits. |
| 2 | Never cut, shorten or delete the user's saved text automatically. (Requester: "Never cut or delete automatically", "keep all content as is", INIT-0001 raw request; `CHECKPOINT.md` 2026-10-28 "no automatic compression".) | Automatic truncation, compression or clean-up of rooms' saved context, including at migration. |

Changing this file requires an accompanying decision record (`PD-`).
