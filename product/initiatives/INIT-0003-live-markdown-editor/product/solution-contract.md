---
initiative: INIT-0003
type: solution-contract
title: Solution contract — Markdown text formats as you type in the chat bar and Room Settings
status: accepted
revision: 1
owner_role: ROLE-product-manager
drafted_by: ROLE-product-manager (inline, size rule §9d.2)
validated_by: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
chosen_decision: PD-0012
design_refs: [DES-0003]
---

# Solution contract — INIT-0003

Cites [PD-0012](../../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md)
(chosen option and design depth),
[PD-0013](../../../decisions/PD-0013-live-markdown-editor-behaviour-rulings.md)
(behaviour) and [PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md)
(the requester's decisions). Where this contract and they differ, they win.

## Chosen concept

Option A (PD-0012 item 1): one small shared textarea-like component built on
CodeMirror 6 with decorations, shipped as one prebuilt file under `ui/vendor/`.
It replaces the plain text box in the chat bar and in Goal and Rules (Room
settings and New Room), Goal (Clone) and agent instructions (Room settings and
Create room). Text formats in place as it is typed, with no toggle, no preview
and no toolbar; the text saved or sent is exactly what was typed.

## Key journeys

- Write a Brief: Room settings → Brief → type Goal and Rules with Markdown →
  each closed element formats and hides its marks, the line being edited shows
  them → Save → reopen: the text is as typed
  ([REQ-0005](../requirements/REQ-0005-live-markdown-editor-in-room-settings.md)
  Behavior 1–8, 10).
- Write agent instructions: Room settings → Agents or Create room → the field is
  the same editor, with no Edit/Preview toggle, and Expand editor opens it larger
  (REQ-0005 Behavior 9).
- Create a room or clone a setup with Markdown in Goal and Rules (REQ-0005).
- Write a message: chat bar → type Markdown → it formats as typed → Enter sends
  the typed text; Shift+Enter adds a line; `@` and `/` open the picker
  ([REQ-0006](../requirements/REQ-0006-live-markdown-editor-in-chat-bar.md)
  Behavior 1–10).

## UX behavior

Marks of a closed element are hidden, and shown on the line being edited and on
every line a selection touches; a field without focus shows none. A fenced code
block shows both fences while the cursor is inside and keeps their height when
they are hidden. Formatted: bold, italic, inline code, code blocks, headings,
lists, links, in the look chat messages have (monospace and code background for a
code block, no language header or copy button). Plain: tables, blockquotes,
rules, `_underscore_` text, indented code, raw HTML, an unclosed fence. A normal
click on a link places the cursor; Cmd+click (Ctrl+click on Windows and Linux)
opens it in a new tab. Limits, trimming, Enter during an accent or IME
composition, and the text left in the chat bar when switching rooms are as
PD-0013 items 7 to 13 rule. Display matrix: 1440 wide, light theme
([PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md)
item 3).

## Visual direction

`none — reuses existing patterns`: the Markdown look of chat messages
(`ui/styles.css`, the `.bubble` rules), the existing field, focus ring,
placeholder and composer styles. No new visual system.

## Accepted trade-offs

The requester's choice, not a trade-off between options (state.md `## Options`,
PD-0012 "Options considered"): a vendored third-party file and a second
Markdown renderer to keep aligned with chat, 35 test lines updated, and the
editor re-created at the settings re-render sites. Design depth: two static
reference frames, no code-level design review (PD-0012 item 4).

## Unresolved risks

- R-01 — the CodeMirror 6 behaviours are documented, not yet run, and IME on a
  line holding hidden marks is the most fragile; resolved by the focused browser
  check on REQ-0005, before the chat bar starts. If one fails, engineering stops
  and reports (PD-0011 item 5).
- R-02 — a click on a formatted line reveals its marks and shifts the text under
  the pointer; checked with a real click and drag.
- R-03 and R-04 — an editor mounted while hidden can measure wrong, and an old
  editor must be released at every re-render site; checked on first open of each
  dialog and tab, and by the listed sites (assessment C-11).
- R-08 — a single very long unbroken line, and per-keystroke work on 20,000
  characters; included in the REQ-0006 check.

## DES- references

The two frames of PD-0012 item 4, drawn and recorded at DECOMPOSITION.

| DES- id | Local export | Requirements served |
| --- | --- | --- |
| DES-0003 (recorded at DECOMPOSITION) | `initiatives/INIT-0003-live-markdown-editor/design/heroes/markdown-editor-settings.dc.html`, `.png`, `markdown-editor-chat-bar.dc.html`, `.png`, `approach.md` | REQ-0005, REQ-0006 |

## Validation

Validated by the PM on 2026-11-08 against PD-0012, PD-0013, PD-0011 and
[technical/assessment.md](../technical/assessment.md): every journey and
behaviour above maps to a PD-0013 item or a REQ Behavior line; every risk is the
assessment's R- row; nothing added beyond them.
