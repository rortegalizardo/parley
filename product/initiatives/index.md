# Initiative index

Every initiative, in any status. `active` and `blocked` initiatives also appear
on [the delivery board](../delivery/board.md); `shipped` initiatives stay listed
here and remain in place on disk.

| ID | Title | Status | Path | Updated |
| --- | --- | --- | --- | --- |
| INIT-0001 | Every agent knows the room's goal, rules and decisions from one Room Brief | active | [INIT-0001-room-brief/initiative.md](INIT-0001-room-brief/initiative.md) | 2026-11-06 |

To create one: allocate `INIT-nnnn` from `../manifest.yaml`, copy
`../templates/initiative.md` into `INIT-nnnn-<slug>/initiative.md`, create
`delivery/state.md` from `../templates/delivery-state.md`, and add the row here
— all in one commit.
