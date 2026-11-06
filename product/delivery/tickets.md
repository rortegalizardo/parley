# Global ticket manifest

synced_on: 2026-11-06
freshness_window: 24h

Committed mirror of external tracker tickets across all initiatives, plus the
dependency graph that determines execution order. Per-initiative manifests live
at `product/initiatives/INIT-nnnn-*/delivery/tickets.md`; this file is the
union.

**Authority.** The tracker is the system of record for ticket status. This
mirror is authoritative for the *dependency graph* and for
ticket ↔ requirement ↔ initiative mapping. Once older than
`freshness_window`, the status column is **advisory**: it may inform planning,
but re-sync before acting on it destructively (branching, closing, shipping).

| Ticket | Title | Initiative | Requirements | Depends on | Branch | PR | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

Empty `Depends on` = on the executable frontier. Tracker keys verbatim.
Status is advisory once older than `freshness_window`.
