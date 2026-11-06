---
id: CAP-0001
type: capability
title: Agents in a room receive the user's shared room context — a room note and a room direction
status: authoritative
revision: 1
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
behaviour shipped (it was built before Product Memory existed).

## Behavior today

- **Room note ("Shared room instructions").** One free-text field per room,
  set in Create room (placeholder "Goals, shared context, or rules for every
  agent…", at most 8,000 characters) and in Room settings → Room tab, or with
  `/note`. Sent to an agent in full when it is shorter than 340 characters, on
  a fresh session, or when it changed; otherwise the agent gets the line
  "[The user's standing room note from your earlier briefing still applies —
  follow it.]" (`parley.mjs` `roomNoteBlock`).
- **Room direction.** Room settings → Direction tab: a Goal and a list of
  one-line Decisions (each at most 200 characters), 2,000 characters in all,
  enforced (Save is disabled and the server refuses a longer direction). Only
  the user changes it. Each agent session gets it in full once, then
  "[The room direction from your earlier briefing still applies.]" until it
  changes; a cleared direction is revoked once (`parley.mjs` `directionBlock`).
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
