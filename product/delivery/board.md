# Delivery board

Cross-initiative execution view. Contains every initiative whose status is
`active` or `blocked`. Excludes `draft`, `shipped`, and `abandoned`.

This file is a **rollup**, not a source of truth: each initiative's own
`delivery/state.md` is authoritative for its stage. When the two disagree,
`state.md` wins and this board is repaired.

| Initiative | Title | Stage | Blocked by | Next action | Updated |
| --- | --- | --- | --- | --- | --- |
| _none active_ | | | | | |

Stages: `define → design → plan → implement → verify → ship → done`.
