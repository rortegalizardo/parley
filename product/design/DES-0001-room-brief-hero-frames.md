---
id: DES-0001
type: design
title: Room Brief hero frames (Brief tab; Create room fields and Pin dialog)
status: accepted
revision: 1
owner_role: ROLE-product-designer
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0014
external_system: none
local_export:
  - initiatives/INIT-0014-room-brief/design/heroes/room-brief-brief-panel.dc.html
  - initiatives/INIT-0014-room-brief/design/heroes/room-brief-brief-panel.png
  - initiatives/INIT-0014-room-brief/design/heroes/room-brief-dialogs.dc.html
  - initiatives/INIT-0014-room-brief/design/heroes/room-brief-dialogs.png
  - initiatives/INIT-0014-room-brief/design/heroes/approach.md
captured_on: 2026-11-06
requirements: [REQ-0002, REQ-0003]
---

# DES-0001 — Room Brief hero frames (Brief tab; Create room fields and Pin dialog)

## What this covers

Two static hero frames at 1440 wide, light theme, authored at `ee1629f` on
`design/INIT-0014-room-brief` and merged into the product branch at `50c8042`.

- `room-brief-brief-panel` (1440x2555): Room settings, Brief tab, every part visible (Goal, Rules, Decisions, archived decisions, merge notice, length warning, "What agents see" preview) -> REQ-0002.
- `room-brief-dialogs` (1440x900), Create room brief fields (Goal required, Rules, brief note) -> REQ-0002.
- `room-brief-dialogs` (1440x900), Pin to room brief dialog with a 200-character suggested line -> REQ-0003.

Parley is plain HTML/JS with no React or Storybook, so PD-0004 replaces the
code-design path (production steps 2a-9 and the design PR) with these frames.
There is no fixture path, no stories and no screen render script.

## Local export

The files listed in `local_export` are the export. They live in
`initiatives/INIT-0014-room-brief/design/heroes/`, not `design/assets/`:
that is where step 1b commits them, and PD-0004 makes them the export and the
engineering reference. They are not moved. `approach.md` holds the author's
notes and the two accepted proposals. Engineering builds from these files, not
from any external tool.

## Deviations permitted

- Where a frame and a requirement differ, the requirement wins (PD-0004 item 2).
- Sample text in the frames is illustrative. Exact copy is in REQ-0002 and REQ-0003.
- The display matrix is 1440 wide, light theme only (PD-0004 item 3); other widths and dark mode follow from the existing CSS and are not designed or reviewed.
- The frames link Parley's own `ui/styles.css`: reuse the existing settings and dialog patterns and classes. No new visual system.
