---
id: WCP-<session-slug>
type: context-packet
title: Working context packet — <request or INIT-nnnn>
status: advisory
revision: 1
owner_role: <ROLE-… that hydrated it>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
schema_version: 1
assembled_on: <YYYY-MM-DD>
assembled_for_role: <ROLE-…>
head_commit: <sha>
context_digest: <16-hex>
readiness: <ready|degraded|blocked|needs-orchestration|uninitialized>
foundation: <complete|incomplete>
---

# Working context packet

> **Session-local. Never authoritative. Never written under `product/`.**
> This is a derived view of Product Memory, correct only at `head_commit`.
> A later session must re-hydrate rather than read this file. Only
> `context_digest` survives, recorded by `SKILL-checkpoint-product-state`.
> Spec: [`../architecture/context-assembly.md`](../architecture/context-assembly.md) §10.

## Request

`raw_request:` _verbatim-derived restatement_
`initiative:` _INIT-nnnn, or none_

## Scope

| Field | Value |
| --- | --- |
| Profile | `<S\|M\|L>` from `manifest.yaml` |
| Rungs present | `R0[, R1][, R2][, R3][, R4]` |
| Area | `AREA-<slug>` or `—` (omit the row entirely under profile S) |
| Subsystem | `<slug>` or `—` (profile L only) |
| Initiative | `INIT-nnnn` or `—` |
| Confidence | `high\|medium\|low` |

**Resolution evidence**

| Rung | Resolved to | Matched on |
| --- | --- | --- |

**Ambiguities** — _none, or one row per unresolved candidate set._

## Context

Every row below is copied from a file. Nothing here was written by the
assembler. `Inclusion` is `full`, `fields`, or `reference-only`.

### B0 — Binding

| ID | Type | Status | Rev | Path | Inclusion | Why |
| --- | --- | --- | --- | --- | --- | --- |

_Content of each `full` entry follows, verbatim, under its identifier._

### B1 — Task-critical
### B2 — Directly referenced
### B3 — Scope context
### B4 — Neighbouring _(cap 10)_
### B5 — Advisory _(cap 10)_

_Same table shape for each band._

## Current work

| Field | Value |
| --- | --- |
| Phase | `<…>`, `unknown`, or `—` (product side not started) |
| Phase entered | `<YYYY-MM-DD>` |
| Converged / readiness verdict | `<bool>` / `<verdict>` |
| Stage | `<…>` or `unknown` |
| Stage entered | `<YYYY-MM-DD>` |
| Next action | _one action, one role_ |
| Blocked by | `Q-nnnn`, or none |
| Ticket frontier | _tracker keys, or empty_ |
| Frontier freshness | `fresh\|stale\|absent` |

## Integrity

**Superseded trail** — `from_id → to_id` + one-line reason. Bodies never inlined.

**Conflicts resolved** — `subject | kept | dropped | rule (A1–A9)`.

**Conflicts open** — `subject | sources | raised as Q-nnnn`.

**Defects** — `kind | detail | path | raised as`.

**Omissions** — `band | dropped count | reason`.

## Budget

| Limit | Used | Method | Exceeded | B0 | B1 | B2 | B3 | B4 | B5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Invariants

P1 every element has `id` + `path` · P2 `status`/`revision` copied ·
P3 no archived or superseded content outside the trail · P4 no `draft`/`proposed`
outside B5 · P5 no assembler-authored content · P6 `blocked` when a blocker is
open · P7 same commit + same inputs ⇒ same digest and band membership.
