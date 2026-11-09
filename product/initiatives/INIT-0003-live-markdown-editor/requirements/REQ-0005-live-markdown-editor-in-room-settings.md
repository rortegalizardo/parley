---
id: REQ-0005
type: requirement
title: The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type
status: accepted
revision: 3
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
initiative: INIT-0003
outcome_element: "O1 — In the Room Brief's Goal and Rules, in agent instructions (Room settings and Create room) and in the New Room and Clone dialogs, Markdown the user types formats in place as they type, with no toggle and no separate preview, and the text saved is exactly what was typed."
acceptance:
  - "In Room settings → Brief, type **bold** in Goal → once the closing marks are typed and the cursor is on another line, the text shows bold with the ** marks hidden; put the cursor back on that line → the marks show again"
  - "In Goal and Rules type italic, inline code, a fenced code block, a heading, a bullet list, a numbered list and a link, one per line → each shows in the style a chat message shows for the same text today when the cursor is on another line (a numbered list shows the numbers as typed; a code block shows in monospace on the code background, with no language header and no copy button)"
  - "Type a Markdown table, a > quote line, a --- line, _underscore_ text, a code fence with no closing fence, and raw HTML (including a script tag) → they stay plain text; nothing runs and no element is created"
  - "Click a link → the cursor is placed in the text and nothing opens; Cmd+click the link (Ctrl+click on Windows and Linux) → it opens in a new browser tab"
  - "Select text across three formatted lines → every selected line shows its marks; put the cursor inside a fenced code block → both fence lines show, and move it out → they are hidden and the block keeps its height; click out of the field → the marks of every closed element are hidden, including on the line last edited"
  - "Paste Markdown → it formats at once; select all and copy → the clipboard holds the Markdown exactly as typed; press Cmd+C and Cmd+X with nothing selected → nothing is copied and nothing is cut"
  - "In Goal and Rules, type and save text with trailing spaces, a pasted tab character, lines indented four spaces, and press Enter on a list line and type ( [ and a quote → the saved text equals the typed text character for character and the editor inserted no list marker, no closing character and no indentation of its own"
  - "Close and reopen Room settings, and reload the page → Goal, Rules and agent instructions equal what was saved (agent instructions are trimmed at both ends when saved, as today); a room whose saved Rules has indented lines loads intact and saving without edits leaves the text unchanged"
  - "At the 2,000-character limit of Goal and the 8,000-character limit of Rules (and of the same fields in New Room and Create room's instructions), type more and paste more → no more characters, and a paste is cut at the limit, as the text box did; a part saved above its limit loads in full, can be shortened, can grow back only up to the length it was saved at, and keeps its note and counter; agent instructions in Room settings can be typed past 8,000 characters and Save shows the same refusal as today"
  - "Open agent instructions in Room settings → Agents and in Create room → the field is the live editor, there is no Edit/Preview toggle, and Expand editor opens and closes the expanded editor with the text unchanged"
  - "Type Goal and Rules in New Room and a Goal in Clone room setup, then press Create room → the new room's saved Goal and Rules equal what was typed"
  - "Room name, project folder and every other single-line field, the Decision fields in Brief and in the Pin dialog, and the read-only What agents see and archived decisions stay as they are, with no formatting"
  - "Save the Brief → the save request has the same fields as before, the What agents see preview shows the saved text exactly, and every character count equals the text length as before"
  - "Type in Goal, press Cmd+Z → the last typing is undone; press Cmd+Shift+Z → it is redone; type an accented letter by composition inside **bold** → the text and the cursor position are intact"
  - "ui/vendor/ holds one prebuilt editor file with its license text, each pinned version and the one command that regenerates it; the page loads it from the local server and, with the network blocked, loads and the editor works; the only server change is the entry that lets it serve the file; no other build step, bundler or install is added"
  - "Drop a text file on Goal, on Rules and on an agent's instructions → none of the file's text is written into the field and the file is handled as it is when dropped on a text box today"
  - "The existing smoke run (test/smoke.mjs) and the existing browser suites pass after the change, updated only where they read a field this story replaces"
  - "composition: at 1440 wide, light theme, the Brief tab with a 2,000-character Goal and an 8,000-character Rules, an agent's instructions at its length, and a 120-character unbroken link, shows every label, the Expand editor button and the character counts in full, with no truncation, clipping, ellipsis or horizontal scroll of the dialog or page; long text wraps inside its field and the field scrolls inside itself"
capabilities: [CAP-0001, CAP-0002]
design_refs: [DES-0003]
decisions: [PD-0011, PD-0012, PD-0013]
depends_on: [none]
constraints: []
observability: []
rollout: none
readiness: engineering-ready
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
  **Rules** in the New Room dialog; **Goal** in the Clone room setup dialog.
  The architect's scan found no other multi-line Markdown field: the Room tab
  has none, and the Decision fields stay plain
  ([capability-scan.md](../technical/capability-scan.md), Check 1;
  [PD-0012](../../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md)
  item 1).
- Not in this story: the chat bar (REQ-0006).

## Non-goals

- A formatting toolbar, a preview toggle or a separate preview: the requester
  ruled them out.
- Formatting of tables and raw HTML: they stay plain text and raw HTML never
  runs.
- The chat bar: REQ-0006.
- Single-line fields and the 200-character Decision fields: they stay plain.
- Any change to a request, a response, stored data, a check or message of the
  backend, to the tokens sent, to the What agents see preview or to the
  character counts, and any rewriting of saved text. The server's fixed list of
  client files gains the one vendor file ([PD-0012](../../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md)
  item 5).

## Behavior

The editor's rules, which REQ-0006 reuses unchanged:

1. **Live formatting.** Text formats in place as the user types. There is no
   toggle between editing and preview, no second pane and no toolbar.
2. **Marks.** A Markdown mark (`**`, `*`, backticks, `#`, list markers, link
   brackets, code fences) is hidden while its element is closed and the cursor
   is not on its line, and shown again on the line being edited. A line is a
   line of the saved text (up to a newline), not a wrapped display line.
   A selection across lines shows the marks of every line it touches. In a
   fenced code block, the cursor anywhere inside shows both fence lines; away
   from it the fence lines are hidden but keep their height, so nothing jumps.
   A field without focus shows no marks on any closed element
   ([PD-0013](../../../decisions/PD-0013-live-markdown-editor-behaviour-rulings.md)
   items 1–3).
3. **What formats.** What chat messages render today, in the same style: bold,
   italic, inline code, code blocks, headings, lists and links. `renderMD` in
   `ui/app.js` is the reference for the common cases; rare edge cases may
   differ while the user types. A code block has a monospace font and the code
   background, without chat's language header, copy button or language colours.
   A numbered list shows the numbers as typed. Tables, blockquotes, `---` rules,
   `_underscore_` text, indented code and raw HTML are plain text, as is a code
   fence with no closing fence, and raw HTML never runs (PD-0013 items 4, 5).
4. **Links.** A normal click on a link places the cursor in the text and opens
   nothing. Cmd+click (Ctrl+click on Windows and Linux) opens the link in a new
   browser tab. Only `http` and `https` links open (PD-0013 item 6).
5. **Paste and copy.** Pasted Markdown formats at once. Copying returns the
   Markdown as typed, as plain text. Copy and Cut with nothing selected do
   nothing, as in a text box.
6. **The saved text is exactly what was typed.** The editor never rewrites
   Markdown and inserts no character the user did not type: no list marker
   after Enter, no closing bracket or quote, no automatic indentation, no
   smart typography, no trimming. A file dropped on the editor inserts nothing; the page's drop
   handling treats it as it does on today's text box. Existing saved text loads
   and saves intact,
   including indentation and trailing spaces. Saving without an edit changes
   nothing. What Parley itself does with the text stays as today: it trims the
   leading and trailing whitespace of a sent message and of an agent's
   instructions, and does not trim the Brief's Goal and Rules (PD-0013 item 7).
7. **Behaves like the text box it replaces.** It reads and writes text, takes
   focus, shows its placeholder when empty, keeps its label and accessible
   name, keeps its field length limit and its character counter, keeps its
   visible height and internal scrolling, and is disabled when the text box
   was. Undo and redo work. Typing never moves the cursor, drops a character or
   interrupts accent or IME composition.
8. **Length limits.** The limits are unchanged: a field at its limit takes no
   more characters, and a paste is cut at the limit, as the text box does
   today. A part already saved above its limit loads in full and can be
   shortened; it can grow back only up to the length it was saved at, as today,
   and keeps its note
   ([PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 2;
   PD-0013 item 9). Agent instructions in Room settings have no typing limit
   today and get none: Save shows the server's refusal above 8,000 characters
   (PD-0013 item 10).
9. **Agent instructions.** In both places the instructions field is the live
   editor. The Edit/Preview toggle and the separate preview are gone. The
   Expand editor button opens and closes the expanded editor, which uses the
   same editor, with the text unchanged.
10. **Nothing else changes.** The Brief save request, the What agents see
    preview, the character counts, the New Room and Clone create requests and
    every request, response, stored value and check of the backend are
    unchanged; the server only serves the vendor file. Single-line fields and
    the 200-character Decision fields stay plain.
11. **The vendor file.** One prebuilt file under `ui/vendor/`, committed with
    its license text, the pinned version of every package it contains and the
    one command that regenerates it. The app loads it from the local server
    with no other network request and runs with no build step. Versions follow
    the Factory dependency policy (PD-0011 item 5).
12. **If CodeMirror 6 does not work with the existing UI, stop and report.**
    Engineering does not substitute another editor (PD-0011 item 5).

## Acceptance criteria

- [ ] In Room settings → Brief, type `**bold**` in Goal → once the closing
      marks are typed and the cursor is on another line, the text shows bold
      with the `**` marks hidden; put the cursor back on that line → the marks
      show again
- [ ] In Goal and Rules type italic, inline code, a fenced code block, a
      heading, a bullet list, a numbered list and a link, one per line → each
      shows in the style a chat message shows for the same text today when the
      cursor is on another line (a numbered list shows the numbers as typed; a
      code block shows in monospace on the code background, with no language
      header and no copy button)
- [ ] Type a Markdown table, a `>` quote line, a `---` line, `_underscore_`
      text, a code fence with no closing fence, and raw HTML (including a
      script tag) → they stay plain text; nothing runs and no element is
      created
- [ ] Click a link → the cursor is placed in the text and nothing opens;
      Cmd+click the link (Ctrl+click on Windows and Linux) → it opens in a new
      browser tab
- [ ] Select text across three formatted lines → every selected line shows its
      marks; put the cursor inside a fenced code block → both fence lines
      show, and move it out → they are hidden and the block keeps its height;
      click out of the field → the marks of every closed element are hidden,
      including on the line last edited
- [ ] Paste Markdown → it formats at once; select all and copy → the clipboard
      holds the Markdown exactly as typed; press Cmd+C and Cmd+X with nothing
      selected → nothing is copied and nothing is cut
- [ ] In Goal and Rules, type and save text with trailing spaces, a pasted tab character, lines
      indented four spaces, and press Enter on a list line and type `(`, `[`
      and a quote → the saved text equals the typed text character for
      character and the editor inserted no list marker, no closing character
      and no indentation of its own
- [ ] Close and reopen Room settings, and reload the page → Goal, Rules and
      agent instructions equal what was saved (agent instructions are trimmed
      at both ends when saved, as today); a room whose saved Rules has
      indented lines loads intact and saving without edits leaves the text
      unchanged
- [ ] At the 2,000-character limit of Goal and the 8,000-character limit of
      Rules (and of the same fields in New Room and Create room's
      instructions), type more and paste more → no more characters, and a
      paste is cut at the limit, as the text box did; a part saved above its
      limit loads in full, can be shortened, can grow back only up to the
      length it was saved at, and keeps its note and counter; agent
      instructions in Room settings can be typed past 8,000 characters and
      Save shows the same refusal as today
- [ ] Open agent instructions in Room settings → Agents and in Create room →
      the field is the live editor, there is no Edit/Preview toggle, and
      Expand editor opens and closes the expanded editor with the text
      unchanged
- [ ] Type Goal and Rules in New Room and a Goal in Clone room setup, then
      press Create room → the new room's saved Goal and Rules equal what was
      typed
- [ ] Room name, project folder and every other single-line field, the
      Decision fields in Brief and in the Pin dialog, and the read-only What
      agents see and archived decisions stay as they are, with no formatting
- [ ] Save the Brief → the save request has the same fields as before, the
      What agents see preview shows the saved text exactly, and every
      character count equals the text length as before
- [ ] Type in Goal, press Cmd+Z → the last typing is undone; press Cmd+Shift+Z
      → it is redone; type an accented letter by composition inside `**bold**`
      → the text and the cursor position are intact
- [ ] `ui/vendor/` holds one prebuilt editor file with its license text, each
      pinned version and the one command that regenerates it; the page loads
      it from the local server and, with the network blocked, loads and the
      editor works; the only server change is the entry that lets it serve the
      file; no other build step, bundler or install is added
- [ ] Drop a text file on Goal, on Rules and on an agent's instructions → none
      of the file's text is written into the field and the file is handled as
      it is when dropped on a text box today
- [ ] The existing smoke run (`test/smoke.mjs`) and the existing browser
      suites pass after the change, updated only where they read a field
      this story replaces
- [ ] composition: at 1440 wide, light theme, the Brief tab with a
      2,000-character Goal and an 8,000-character Rules, an agent's
      instructions at its length, and a 120-character unbroken link, shows
      every label, the Expand editor button and the character counts in full,
      with no truncation, clipping, ellipsis or horizontal scroll of the
      dialog or page; long text wraps inside its field and the field scrolls
      inside itself

## Sequencing

`depends_on: [none]`. On the frontier of the story set. Precondition outside
the story set: PRL-6 (the `test/smoke.mjs` repair) must be merged and green on
`main` before engineering starts (PD-0011 item 10). REQ-0006 depends on this
story, which builds the shared editor and the vendor file.

## Technical constraints

_Binding, from [technical/assessment.md](../technical/assessment.md) (verdict
`feasible-with-constraints`, band multi-component) as carried by
[PD-0012](../../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md)
item 3. Sources and line numbers are in the assessment._

| # | Constraint |
| --- | --- |
| C-01 | The server's fixed list of client files must include the vendor file, versioned like the other two; otherwise it is not served. This is the only server change: no request, response or stored data changes. |
| C-02 | The file runs under the current page security policy unchanged: no `eval`, no worker from elsewhere, no remote font. |
| C-03 | Exactly one prebuilt classic script, loaded before the code that uses it, no network at run time, no build step to run the app. |
| C-04 | Every package in the file, direct or indirect, at an exact version at least 20 days old (Factory dependency policy). Eligible versions exist for all, so no requester exception is needed; if a pin would be younger, stop and raise it as a requester question. |
| C-05 | The file carries the license text of every package it contains (all MIT), each pinned version and the one regenerating command. |
| C-06 | Only behaviours that insert nothing: no ready-made basic setup, no list continuation, no auto-indent, no bracket or quote closing, no smart typography, no auto-trim; editing keys limited to what a text box has. Line endings are `\n`, as a text box's value. |
| C-07 | Chat rendering and the editor are two renderers kept aligned by hand. The editor's parsing is narrowed to what `renderMD` formats (PD-0013 item 4): `_x_`, `__x__`, underlined headings, indented code, HTML, tables, quotes and rules are not formatted; an unclosed fence stays plain. |
| C-08 | No hidden range may cover a line holding the cursor or an open composition. A hidden list marker still shows a bullet or number. |
| C-09 | The component answers what today's code asks of a text box: value read and write; `input` events reaching the delegated listeners keyed on the target `id` or `data-*`; selection start and end; focus; disabled (including the runtime-mismatch banner); placeholder and `maxLength` set after mount; cleared by `form.reset()`. |
| C-11 | At each `innerHTML` re-render site (Brief card, settings agent cards, Create room roster) the old editor is released and a new one started with the current value; undo history is lost there, as a text box's is today. New Room and Clone fields are static and mounted once. |
| C-12 | Limits: no text past the limit, a paste cut at the limit, code writes exempt, nothing enforced during an open composition, an emoji never split, length counted as `.value.length`; the limit is the larger of the base limit and the saved length and can change after mount. |
| C-13 | Text written by code (a form reset, a replaced value) must not be undoable back into replaced content. |
| C-14 | Copy and Cut with nothing selected do nothing. |
| C-15 | Every field keeps its accessible name, required state and description; its label focuses it; spellcheck, autocorrect and capitalisation as today; Tab leaves the field; Escape still closes the dialog; the focus trap counts it. |
| C-16 | Every visible CSS rule on `textarea`, `:focus`, `::placeholder`, `.expanded textarea` and `resize` applies to the editor, including the drag handle where it exists today; the Markdown look reuses chat's values. |
| C-17 | The test lines that read the fields this story replaces (17 lines in 4 files, counted on `main` at `31ec463`) are updated; the 18 lines in 8 files that read `#input` are REQ-0006's; no new suite; the smoke sandbox has no vendor file and must not fail for that reason; PRL-6 is merged and green first. |
| C-18 | Verification runs on an isolated port with a copied room store, never ports 4142 or 4141. |
| C-19 | Links open only on Cmd+click (Ctrl+click elsewhere), only `http` and `https`, in a new tab, with no opener and no referrer. No anchor is built from typed text. |
| C-20 | No new runtime network request and no new stored data. |
| C-21 | A file dropped on the editor inserts nothing. The library's default writes a dropped file's text into the field, so it is switched off; the page's window-wide drop handling treats the file as it does on the text box today (coherence round 1, defect 1; no story or assessment constraint named it before). |

Watch-list for the focused browser check (assessment R-01 to R-04, R-08): the
CodeMirror behaviour is documented, not yet run, so real accent or IME
composition on a line holding hidden marks is the most fragile; a click on a
formatted line reveals its marks and shifts the text under the pointer; editors
mounted while hidden (closed dialogs, inactive Settings panes) can measure
wrong; every re-render site must release its old editor; a single very long
unbroken line is the weak case. The repository's browser harness runs Chromium
only (also the engine Workbench uses), so the focused check records which
browsers it covered; the composition rules apply in every browser regardless.
If one fails, PD-0011 item 5 applies: stop and report.

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
- Design: the look is the existing chat Markdown style; the design reference is
  [DES-0003](../../../design/DES-0003-markdown-editor-reference-frames.md), the
  frame `markdown-editor-settings` (its sample text is illustrative; where the frame and
  this story differ, the story wins).
