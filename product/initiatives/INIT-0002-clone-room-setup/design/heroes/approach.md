# INIT-0002 — hero frame: approach

Set by the PM (PD-0009 item 3, same depth as PD-0004 item 1); recorded here,
then followed.

- **Asked:** "Clone room setup…" in each room's menu and "one short dialog:
  name pre-filled, Goal ready to edit, project folder, and one line saying
  what carries over and what doesn't"; "reuse the Create room dialog
  styling"; "no canvas/multi-page design"; 1440 wide, light only.
- **Candidates:**
  - Several directions with briefs and heroes — more time, no gain: the
    requester fixed the look and the placement.
  - One static frame built from today's markup classes and `ui/styles.css` —
    cheapest, closest to what ships, what PD-0009 item 3 names.
  - Screens in a Claude Design project — needs a design-system bundle Parley
    does not have (constraints #2).
- **Choice:** one static frame, both parts side by side: the room list with
  one row's Room actions menu open, and the dialog. It links the repository's
  own `ui/styles.css` and reuses today's classes (`room-item`, `rmore`,
  `racts`, `ract`, `form-title`, `modal-close`, `fld`, `project-folder-field`,
  `form-actions`, `btn`); the new pieces are plain CSS inside the page.
- **Steps:** 1a briefs skipped (derivative work, one direction). 1b hero:
  this step. Production steps 2a–10 do not run; the frame is the engineering
  reference, recorded as a `DES-` by the DES recorder.

## Frame

| Frame | File | Shows |
| --- | --- | --- |
| clone-room-setup | `clone-room-setup.dc.html` / `.png` | Left: the sidebar's room list; the row `Parlay Product Evolution and Roadmap Q4A` (40 characters) with Room actions open, listing Archive · Rename, then `Clone room setup…` · Delete, the clone item in full (143px, no wrap). Right: the `Clone room setup` dialog, `From Parlay Product Evolution and Roadmap Q4A` under the title; Room name `Parlay Product Evolution and Roadma copy` (40 characters: the original shortened from its end to 35, no trailing space, plus ` copy`, PD-0010 item 4); Goal pre-filled with exactly 2,000 characters; Project folder pre-filled with a 200-character path and `Browse…`; the one line of PD-0010 item 10 verbatim; `Cancel` and `Create room` (enabled: the name is not blank). |

Copy is REQ-0004 Behavior 1–2 and PD-0010 items 1, 4, 5, 8, 10, 11 verbatim.
The frame holds nothing the requirement does not list: no extra field,
option or note.

Rendered from a scratch directory outside the repository with the
repository's own Playwright Chromium (1.62.1), 1440×900 viewport, light,
full page. Measured on the render: document scroll width 1440 (no horizontal
scroll); the one line 714px wide at two lines, in full; every label and both
buttons visible. Looked at, revised once (with four items the menu strip left
Delete alone on a third line), rendered and looked at again.

## Design choices (mine, not product rules)

- Menu order: Archive, Rename, `Clone room setup…`, Delete — the clone item
  beside Archive and Rename, Delete last as today. Icon: `controlIcon("copy")`.
- The open strip's inset goes 18px → 10px (right 6px → 4px) and the items'
  padding 8px → 7px, so four items sit two per line in the 264px sidebar.
- The dialog is its own element (`#cloneRoomDialog` / `#cloneRoomForm`). The
  page restates the Create room dialog's rules for it; engineering may extend
  the existing `#newRoomDialog` / `#newRoomForm` selectors instead.
- `From {room}` takes the title's subtitle slot, where Create room has its
  tagline.
- The Goal field grows with its text up to 38% of the viewport, then scrolls
  inside the field (Create room's two-row Goal would hide a copied Goal).
- Project folder is Create room's one-line input with `Browse…`; a 200-
  character path scrolls within the input, as in Create room. The dialog
  itself has no horizontal scroll.
- The one line is plain text under the fields, 13px, `--text-dim`, no box.
- No PD-0006 item 2 note under Goal: the sample Goal is exactly 2,000
  characters, not over it (the note shows only for a longer copied Goal).

## Proposals

Not drawn; no requirement states them. The PM accepts or drops each.

- Create room's note under Project folder, `Leave blank to use a new room
  workspace.` — PD-0010 item 8 says blank means a new workspace, and Create
  room shows that note, but REQ-0004 lists no note for the clone dialog.
- Create room's label markers (`Goal optional`, `Project folder optional`) —
  the clone's Goal may be empty (PD-0010 item 5); REQ-0004 names no marker.
