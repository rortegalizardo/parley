# Global ticket manifest

synced_on: 2026-11-08
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
| PRL-1 | Every agent gets the whole Room Brief in full on every turn, migrated from each room's existing direction, pins and note | INIT-0001 | REQ-0001 |  |  |  | Backlog |
| PRL-2 | The user edits one Room Brief in Room Settings and sees exactly what agents receive | INIT-0001 | REQ-0002 | PRL-1 |  |  | Backlog |
| PRL-3 | Pinning a message adds it to the Room Brief's Decisions | INIT-0001 | REQ-0003 | PRL-1, PRL-2 |  |  | Backlog |
| PRL-4 | The user clones a room's setup into a new room with an empty chat, from the room's menu | INIT-0002 | REQ-0004 |  |  |  | Backlog |
| PRL-14 | The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type | INIT-0003 | REQ-0005 |  |  |  | Backlog |
| PRL-15 | The user types Markdown in the chat bar and sees it format as they type | INIT-0003 | REQ-0006 | PRL-14 |  |  | Backlog |

Empty `Depends on` = on the executable frontier. Tracker keys verbatim.
Status is advisory once older than `freshness_window`.
