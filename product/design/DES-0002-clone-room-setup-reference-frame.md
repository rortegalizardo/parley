---
id: DES-0002
type: design
title: Clone room setup reference frame (room menu item and dialog)
status: accepted
revision: 1
owner_role: ROLE-product-designer
created: 2026-11-06
updated: 2026-11-06
initiative: INIT-0015
external_system: none
local_export:
  - initiatives/INIT-0015-clone-room-setup/design/heroes/clone-room-setup.dc.html
  - initiatives/INIT-0015-clone-room-setup/design/heroes/clone-room-setup.png
  - initiatives/INIT-0015-clone-room-setup/design/heroes/approach.md
captured_on: 2026-11-06
requirements: [REQ-0004]
---

# DES-0002 — Clone room setup reference frame (room menu item and dialog)

## What this covers

One static reference frame at 1440 wide, light theme, authored at `cba8cfe` on
`design/INIT-0015-clone-room-setup` and merged into the product branch at
`a5cc3ee`.

- `clone-room-setup`, left: the sidebar room list with one row's Room actions menu open, listing Archive, Rename, `Clone room setup…`, Delete -> REQ-0004 (menu entry beside Archive and Rename).
- `clone-room-setup`, right: the `Clone room setup` dialog with `From {room}`, a 40-character pre-filled name, a 2,000-character Goal, a 200-character project folder with `Browse…`, the one line of PD-0010 item 10, and `Cancel` / `Create room` -> REQ-0004 (dialog contents and composition criterion).

Parley is plain HTML/JS with no React or Storybook, so PD-0009 item 3 (the
adaptation PD-0004 item 1 made for INIT-0014) replaces the code-design path
(production steps 2a-10) with this one frame, as DES-0001 does. There is no
fixture path, no stories and no screen render script.

## Local export

The files listed in `local_export` are the export. They live in
`initiatives/INIT-0015-clone-room-setup/design/heroes/`, not `design/assets/`,
and are not moved. `approach.md` holds the author's notes and design choices.
Its two Proposals (the Project folder note and the optional markers) are not
accepted: the PM dropped them. Engineering builds from these files and
REQ-0004, not from any external tool.

## Deviations permitted

- Where the frame and REQ-0004 differ, the requirement wins (PD-0009 item 3).
- Sample text in the frame is illustrative. Exact copy is in REQ-0004 and PD-0010.
- The display matrix is 1440 wide, light theme only; other widths and dark mode follow from the existing CSS and are not designed or reviewed.
- The frame links Parley's own `ui/styles.css` and reuses existing dialog classes. No new visual system.
