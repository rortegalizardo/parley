---
id: DES-0003
type: design
title: Live Markdown editor reference frames (Room settings Brief and Agents, chat bar)
status: accepted
revision: 1
owner_role: ROLE-product-designer
created: 2026-11-08
updated: 2026-11-08
initiative: INIT-0003
external_system: none
local_export:
  - initiatives/INIT-0003-live-markdown-editor/design/heroes/markdown-editor-settings.dc.html
  - initiatives/INIT-0003-live-markdown-editor/design/heroes/markdown-editor-settings.png
  - initiatives/INIT-0003-live-markdown-editor/design/heroes/markdown-editor-chat-bar.dc.html
  - initiatives/INIT-0003-live-markdown-editor/design/heroes/markdown-editor-chat-bar.png
  - initiatives/INIT-0003-live-markdown-editor/design/heroes/approach.md
captured_on: 2026-11-08
requirements: [REQ-0005, REQ-0006]
---

# DES-0003 — Live Markdown editor reference frames (Room settings Brief and Agents, chat bar)

## What this covers

Two static frames at 1440 wide, light theme, authored at `40aee93` on
`design/INIT-0003-live-markdown-editor` and merged into main at `8a65ee2`.

- `markdown-editor-settings`, top dialog (Room settings, Brief tab): Goal unfocused with closed elements formatted and no marks; Rules focused with a heading, bold, italic, inline code, a fenced code block shown as blank fence strips, a bullet list, a numbered list and a link, and one line being edited with its marks shown -> REQ-0005 (Behavior lines on formatting, marks, fences and links; composition criterion).
- `markdown-editor-settings`, bottom dialog (Room settings, Agents tab): one agent's Standing instructions as the same editor, with no Edit/Preview toggle and the Expand editor button kept -> REQ-0005 (agent instructions behavior).
- `markdown-editor-chat-bar`: a multi-line Markdown message being typed in the chat bar with an image chip and a file chip, one line edited with its marks shown, a sent message above it for comparison, and below it the empty bar with the placeholder `Message the table…  type @ to choose an agent` -> REQ-0006 (chat bar behavior and composition criterion).

PD-0012 item 4 sets this as the design depth (static frames, no canvas, no
code-level design track), as PD-0004 item 1 and PD-0009 item 3 did for DES-0001
and DES-0002. There is no fixture, no stories and no render script.

## Local export

The files listed in `local_export` are the export. They live in
`initiatives/INIT-0003-live-markdown-editor/design/heroes/`, not
`design/assets/`, and are not moved. `approach.md` holds the author's notes and
design choices. Its two Proposals-section observations (the dark close mark on
the image attachment chip in the light theme, and the invisible inline-code
background in the light theme) are existing behavior, not changed by this
initiative, and are not accepted as work. Engineering builds from these files
and REQ-0005 and REQ-0006, not from any external tool.

## Deviations permitted

- Where a frame and a requirement differ, the requirement wins (PD-0012 item 4).
- Sample text in the frames is illustrative.
- The Rules box is drawn taller than its default so every element is visible.
- Closed elements sit slightly tighter than the same text once sent, because block margins are not copied (a blank typed line is the spacing).
- A static frame cannot show marks appearing and disappearing; the Behavior lists in the requirements settle that.
- The display matrix is 1440 wide, light theme only (PD-0004 item 3); other widths and dark mode follow from the existing CSS and are not designed or reviewed.
- The frames link Parley's own `ui/styles.css` and reuse existing classes. No new visual system.
