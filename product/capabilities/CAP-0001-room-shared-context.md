---
id: CAP-0001
type: capability
title: Agents in a room receive the user's shared room context — a room note and a room direction
status: authoritative
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
surfaces: ["Room settings → Room tab → Shared room instructions", "Create room → Shared room instructions", "Room settings → Direction tab", "Pin on a message / agreed decision card → Pin to room direction dialog", "/note command", "Agent prompt delivery"]
implemented_by: []
decisions: []
---

# CAP-0001 — Agents in a room receive the user's shared room context — a room note and a room direction

Recorded at INIT-0014 DISCOVERY from the committed code at `d07a67d` and
`docs/ROOM-BEHAVIOR.md`, because Product Memory was bootstrapped after this
behaviour shipped (it was built before Product Memory existed). Revision 2
follows `main` at `b6591be` ("Send room direction and room note in full every
turn", the brief-delivery change), per the architect's capability scan
([INIT-0014 technical/capability-scan.md](../initiatives/INIT-0014-room-brief/technical/capability-scan.md)).

## Behavior today

- **Room note ("Shared room instructions").** One free-text field per room,
  set in Create room (placeholder "Goals, shared context, or rules for every
  agent…", at most 8,000 characters — the only place that limit is enforced),
  in Room settings → Room tab, or with `/note` (no length limit on either).
  Sent to every agent in full on every turn (`parley.mjs` `roomNoteBlock`,
  since `b6591be`).
- **Room direction.** Room settings → Direction tab: a Goal and a list of
  one-line Decisions (each at most 200 characters), 2,000 characters in all,
  enforced (Save is disabled and the server refuses a longer direction). Only
  the user changes it. Sent to every agent in full on every turn since
  `b6591be`; a cleared direction is revoked once (`parley.mjs`
  `directionBlock`). The Direction tab's note still says "Each agent session
  gets it once, then a one-line reminder until it changes", which `b6591be`
  made untrue. Removing a decision deletes it; there is no archive.
- **Pin.** A pin on any message or on the agreed decision card opens "Pin to
  room direction": one tool-less Claude Sonnet call suggests a single line,
  which the user accepts or edits; Pin appends it to the Decisions.
- **Tidy.** One Claude Sonnet call suggests a shorter Goal and Decisions list,
  loaded as an unsaved edit the user saves or discards.
- **Old saved brief.** The retired reviewed brief and saved decisions stay in
  `context.json`, viewable from the Direction tab, never sent; sessions that
  may hold the old block are told once that it is retired.
- Per-agent standing instructions live in each agent's settings and are
  separate from both.

## Surfaces

Room settings (Room tab, Direction tab), Create room, the message and decision
card pin action, `/note`, the agent prompt (`noteBlock`, `roomNoteBlock`,
`directionBlock` in `parley.mjs`), `/api/context/{direction,legacy,suggest}`.

## Boundaries

Does not change per-agent standing instructions. Converge never writes to the
direction. Nothing is compressed or rewritten automatically.

## Constraints

None recorded beyond `project/constraints.md`.

## Change log

| Date | Revision | Change | Initiative |
| --- | --- | --- | --- |
| 2026-11-06 | 1 | Recorded as current state | INIT-0014 (DISCOVERY) |
| 2026-11-06 | 2 | Follows `main` at `b6591be`: note and direction sent in full every turn; the 8,000 note limit applies only in Create room; Direction tab copy now untrue | INIT-0014 (SOLUTION_EXPLORATION, architect's capability scan) |
