---
id: REQ-0005
type: requirement
title: The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type
status: draft
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
initiative: INIT-0003
outcome_element: "O1 — In the Room Brief's Goal and Rules, in agent instructions (Room settings and Create room) and in the New Room and Clone dialogs, Markdown the user types formats in place as they type, with no toggle and no separate preview, and the text saved is exactly what was typed."
acceptance:
  - "In Room settings → Brief, type **bold** in Goal → once the closing marks are typed and the cursor is on another line, the text shows bold with the ** marks hidden; put the cursor back on that line → the marks show again"
  - "In Goal and Rules type italic, inline code, a fenced code block, a heading, a bullet list, a numbered list and a link, one per line → each shows in the style a chat message shows for the same text today when the cursor is on another line"
  - "Type a Markdown table and raw HTML (including a script tag) → they stay plain text; nothing runs and no element is created"
  - "Click a link → the cursor is placed in the text and nothing opens; Cmd+click the link → it opens in a new browser tab"
  - "Paste Markdown → it formats at once; select all and copy → the clipboard holds the Markdown exactly as typed"
  - "Type and save text with trailing spaces, a tab, lines indented four spaces, and press Enter on a list line and type ( [ and a quote → the saved text equals the typed text character for character and the editor inserted no list marker, no closing character and no indentation of its own"
  - "Close and reopen Room settings, and reload the page → Goal, Rules and agent instructions equal what was saved; a room whose saved Rules has indented lines loads intact and saving without edits leaves the text unchanged"
  - "At a field's length limit, type more and paste more → the field behaves as the text box did before (no more characters; a paste is cut at the limit); a part saved above its limit loads in full, can be shortened and cannot grow, with its note and counter unchanged"
  - "Open agent instructions in Room settings → Agents and in Create room → the field is the live editor, there is no Edit/Preview toggle, and Expand editor opens and closes the expanded editor with the text unchanged"
  - "Type Goal and Rules in New Room and a Goal in Clone room setup, then press Create room → the new room's saved Goal and Rules equal what was typed"
  - "Room name, project folder and every other single-line field, and the 200-character Decision field, stay plain text with no formatting"
  - "Save the Brief → the save request has the same fields as before, the What agents see preview shows the saved text exactly, and every character count equals the text length as before"
  - "Type in Goal, press Cmd+Z → the last typing is undone; press Cmd+Shift+Z → it is redone; type an accented letter by composition inside **bold** → the text and the cursor position are intact"
  - "ui/vendor/ holds one prebuilt editor file with its license text, each pinned version and the one command that regenerates it; with the network blocked the page loads and the editor works; no other build step, bundler or install is added"
  - "composition: at 1440 wide, light theme, the Brief tab with a 2,000-character Goal and an 8,000-character Rules, an agent's instructions at its length, and a 120-character unbroken link, shows every label, the Expand editor button and the character counts in full, with no truncation, clipping, ellipsis or horizontal scroll of the dialog or page; long text wraps inside its field and the field scrolls inside itself"
capabilities: [CAP-0001, CAP-0002]
design_refs: []
decisions: [PD-0011]
depends_on: [none]
constraints: []
observability: []
rollout: none
readiness: not-assessed
tickets: []
supersedes:
superseded_by:
---

# REQ-0005 — The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type

## Requirement

In the Room Brief's Goal and Rules, in agent instructions (Room settings and
Create room) and in the New Room and Clone dialogs, the user types Markdown and
sees it format in place as they type — no toggle, no separate preview, no
toolbar. The text saved is exactly what was typed; the editor only changes
appearance
([PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md)).
This story builds the one shared editor and the prebuilt vendor file that the
chat bar story (REQ-0006) then reuses.

## Scope

- The shared live Markdown editor: a small component that reads and writes text
  like a textarea, built on CodeMirror 6 with decorations, and the one prebuilt
  file under `ui/vendor/` it needs (PD-0011 item 5).
- Where it replaces a plain text box: **Goal** and **Rules** in Room settings →
  Brief; **agent instructions** in Room settings → Agents and in Create room's
  agent editor (where today's Edit/Preview toggle goes away); **Goal** and
  **Rules** in the New Room dialog; **Goal** in the Clone room setup dialog; and
  any other multi-line Markdown field of Room settings the architect's scan
  finds ([technical/assessment.md](../technical/assessment.md)).
- Not in this story: the chat bar (REQ-0006).

## Non-goals

- A formatting toolbar, a preview toggle or a separate preview: the requester
  ruled them out.
- Formatting of tables and raw HTML: they stay plain text and raw HTML never
  runs.
- The chat bar: REQ-0006.
- Single-line fields and the 200-character Decision field: they stay plain.
- Any change to the backend, the tokens sent, the What agents see preview or
  the character counts, and any rewriting of saved text.

## Behavior

The editor's rules, which REQ-0006 reuses unchanged:

1. **Live formatting.** Text formats in place as the user types. There is no
   toggle between editing and preview, no second pane and no toolbar.
2. **Marks.** A Markdown mark (`**`, `*`, backticks, `#`, list markers, link
   brackets, code fences) is hidden while its element is closed and the cursor
   is not on its line, and shown again on the line being edited. A line is a
   line of the saved text (up to a newline), not a wrapped display line.
3. **What formats.** What chat messages render today, in the same style: bold,
   italic, inline code, code blocks, headings, lists and links. `renderMD` in
   `ui/app.js` is the reference for the common cases; rare edge cases may
   differ while the user types. Tables and raw HTML are plain text, and raw
   HTML never runs.
4. **Links.** A normal click on a link places the cursor in the text and opens
   nothing. Cmd+click opens the link in a new browser tab.
5. **Paste and copy.** Pasted Markdown formats at once. Copying returns the
   Markdown as typed, as plain text.
6. **The saved text is exactly what was typed.** The editor never rewrites
   Markdown and inserts no character the user did not type: no list marker
   after Enter, no closing bracket or quote, no automatic indentation, no
   smart typography, no trimming. Existing saved text loads and saves intact,
   including indentation and trailing spaces. Saving without an edit changes
   nothing.
7. **Behaves like the text box it replaces.** It reads and writes text, takes
   focus, shows its placeholder when empty, keeps its label and accessible
   name, keeps its field length limit and its character counter, keeps its
   visible height and internal scrolling, and is disabled when the text box
   was. Undo and redo work. Typing never moves the cursor, drops a character or
   interrupts accent or IME composition.
8. **Length limits.** The limits are unchanged: a field at its limit takes no
   more characters, and a paste is cut at the limit, as the text box does
   today. A part already saved above its limit loads in full, can be shortened
   but not made longer, and keeps its note
   ([PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 2).
9. **Agent instructions.** In both places the instructions field is the live
   editor. The Edit/Preview toggle and the separate preview are gone. The
   Expand editor button opens and closes the expanded editor, which uses the
   same editor, with the text unchanged.
10. **Nothing else changes.** The Brief save request, the What agents see
    preview, the character counts, the New Room and Clone create requests and
    the backend are unchanged. Single-line fields and the 200-character
    Decision field stay plain.
11. **The vendor file.** One prebuilt file under `ui/vendor/`, committed with
    its license text, the pinned version of every package it contains and the
    one command that regenerates it. The app loads it without a network
    request and runs with no build step. Versions follow the Factory
    dependency policy (PD-0011 item 5).
12. **If CodeMirror 6 does not work with the existing UI, stop and report.**
    Engineering does not substitute another editor (PD-0011 item 5).

## Acceptance criteria

- [ ] In Room settings → Brief, type `**bold**` in Goal → once the closing
      marks are typed and the cursor is on another line, the text shows bold
      with the `**` marks hidden; put the cursor back on that line → the marks
      show again.
- [ ] In Goal and Rules type italic, inline code, a fenced code block, a
      heading, a bullet list, a numbered list and a link, one per line → each
      shows in the style a chat message shows for the same text today when the
      cursor is on another line.
- [ ] Type a Markdown table and raw HTML (including a script tag) → they stay
      plain text; nothing runs and no element is created.
- [ ] Click a link → the cursor is placed in the text and nothing opens;
      Cmd+click the link → it opens in a new browser tab.
- [ ] Paste Markdown → it formats at once; select all and copy → the clipboard
      holds the Markdown exactly as typed.
- [ ] Type and save text with trailing spaces, a tab, lines indented four
      spaces, and press Enter on a list line and type `(`, `[` and a quote →
      the saved text equals the typed text character for character and the
      editor inserted no list marker, no closing character and no indentation
      of its own.
- [ ] Close and reopen Room settings, and reload the page → Goal, Rules and
      agent instructions equal what was saved; a room whose saved Rules has
      indented lines loads intact and saving without edits leaves the text
      unchanged.
- [ ] At a field's length limit, type more and paste more → the field behaves
      as the text box did before (no more characters; a paste is cut at the
      limit); a part saved above its limit loads in full, can be shortened and
      cannot grow, with its note and counter unchanged.
- [ ] Open agent instructions in Room settings → Agents and in Create room →
      the field is the live editor, there is no Edit/Preview toggle, and
      Expand editor opens and closes the expanded editor with the text
      unchanged.
- [ ] Type Goal and Rules in New Room and a Goal in Clone room setup, then
      press Create room → the new room's saved Goal and Rules equal what was
      typed.
- [ ] Room name, project folder and every other single-line field, and the
      200-character Decision field, stay plain text with no formatting.
- [ ] Save the Brief → the save request has the same fields as before, the
      What agents see preview shows the saved text exactly, and every
      character count equals the text length as before.
- [ ] Type in Goal, press Cmd+Z → the last typing is undone; press
      Cmd+Shift+Z → it is redone; type an accented letter by composition
      inside `**bold**` → the text and the cursor position are intact.
- [ ] `ui/vendor/` holds one prebuilt editor file with its license text, each
      pinned version and the one command that regenerates it; with the network
      blocked the page loads and the editor works; no other build step,
      bundler or install is added.
- [ ] composition: at 1440 wide, light theme (the display matrix of
      [PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md)
      item 3), the Brief tab with a 2,000-character Goal and an 8,000-character
      Rules, an agent's instructions at its length, and a 120-character
      unbroken link, shows every label, the Expand editor button and the
      character counts in full, with no truncation, clipping, ellipsis or
      horizontal scroll of the dialog or page; long text wraps inside its field
      and the field scrolls inside itself.

## Sequencing

`depends_on: [none]`. On the frontier of the story set. Precondition outside
the story set: PRL-6 (the `test/smoke.mjs` repair) must be merged and green on
`main` before engineering starts (PD-0011 item 10). REQ-0006 depends on this
story, which builds the shared editor and the vendor file.

## Technical constraints

_To be filled from [technical/assessment.md](../technical/assessment.md) at
SOLUTION_CONVERGENCE._

## Observability

none — the editor is visible on screen; the done check reads the saved text.

## Rollout

none. The live server on port 4142 and Workbench pick the change up only when
the requester restarts or rebuilds them; engineering never does
([constraints](../../../project/constraints.md) #1; PD-0011 item 9).

## Notes

- Verification, as the requester set it: one focused browser check on an
  isolated port with a copy of the room store, covering Goal (each Markdown
  element renders live, the saved text matches what was typed, undo and paste
  work) and that settings text is unchanged after closing and reopening. No new
  unit or smoke suites (PD-0011 item 8).
- Current behavior: [CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md),
  [CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md).
- Design: the look is the existing chat Markdown style; the design reference
  is recorded at DECOMPOSITION.
