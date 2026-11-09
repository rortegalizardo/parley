---
id: REQ-0006
type: requirement
title: The user types Markdown in the chat bar and sees it format as they type
status: draft
revision: 3
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
initiative: INIT-0003
outcome_element: "O2 — In the chat bar, Markdown the user types formats in place as they type, the text sent is exactly what was typed, and the @ agent picker, slash commands, Enter and Shift+Enter, drafts, paste, attachments, undo and redo work as they do today."
acceptance:
  - "In the chat bar type **bold**, italic, inline code, a fenced code block, a heading, a bullet list, a numbered list and a link, one per line → each shows in the style a sent chat message shows for the same text today when the cursor is on another line, and the ** marks of a closed element are hidden and show again on the line being edited"
  - "Type a Markdown table, a > quote line, a --- line, _underscore_ text, a code fence with no closing fence, and raw HTML (including a script tag) in the chat bar → they stay plain text; nothing runs and no element is created"
  - "Click a link in the chat bar → the cursor is placed in the text and nothing opens; Cmd+click the link (Ctrl+click on Windows and Linux) → it opens in a new browser tab"
  - "Type a multi-line Markdown message and press Enter → it is sent once and the text sent equals the typed text character for character, after the leading and trailing whitespace that Parley trims today; the message then shows in the conversation as a sent message shows today"
  - "Press Shift+Enter → a new line is inserted and nothing is sent; press Enter while an accent or IME composition is open → the composition is confirmed and nothing is sent, in every browser"
  - "Type @ → the agent picker opens as today; choose an agent → the mention is inserted as today and the message goes to that agent; Arrow keys, Enter, Tab and Escape in the open picker work as today and Enter in the picker does not send; type / at the start and choose a command from the picker → it is inserted as today"
  - "Type a slash command such as /note or /pair → it runs exactly as today and the typed text is read as typed"
  - "Type text, switch to another room and back → the text is still in the bar, as today; reload the page → the bar is empty and attachments are cleared when a room loads, as today"
  - "Paste Markdown text → it formats at once and sending it sends the pasted text exactly; paste an image and attach a file → they become attachments as today and a message with attachments sends as today"
  - "Press Cmd+Z in the chat bar → the last typing or paste is undone; press Cmd+Shift+Z → it is redone; after sending, Cmd+Z in the empty bar does not bring the sent text back"
  - "Paste 20,000 characters of Markdown and then type 100 characters at the end and in the middle by keyboard → none of the 100 typed characters is lost or out of order, the cursor stays where it was typed, and the sent text equals the 20,120 characters"
  - "Type an accented letter by composition in the middle of **bold** and type the closing marks → the text is intact, the cursor is not moved and the composition is not interrupted"
  - "With the bar empty → the placeholder Message the table…  type @ to choose an agent shows; the bar grows with its text up to its present maximum height of 200 pixels and scrolls inside itself beyond it; it is disabled whenever it is disabled today"
  - "The existing smoke run (test/smoke.mjs, as repaired by PRL-6) and the existing browser suites pass after the change, updated only where they read the old text box"
  - "Drop a text file on the chat bar → it becomes an attachment as today and none of its text is written into the bar"
  - "composition: at 1440 wide, light theme, the chat bar holding 20,000 characters over many lines with an image attachment, a file attachment and the agent chips shows the send control, the attachment chips and the agent chips in full, with no truncation, clipping, ellipsis or horizontal scroll of the page; the text scrolls inside the bar"
capabilities: [CAP-0003]
design_refs: [DES-0003]
decisions: [PD-0011, PD-0012, PD-0013]
depends_on: [REQ-0005]
constraints: []
observability: []
rollout: none
readiness: not-assessed
tickets: []
supersedes:
superseded_by:
---

# REQ-0006 — The user types Markdown in the chat bar and sees it format as they type

## Requirement

In the chat bar, the user types Markdown and sees it format in place as they
type, with the shared editor REQ-0005 builds. The text sent is exactly what was
typed, and everything the chat bar does today keeps working: the `@` agent
picker, slash commands, Enter and Shift+Enter, drafts, paste, attachments, undo
and redo, long text and large pastes, accent and IME typing
([PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md)).

## Scope

- The chat bar's text box, replaced by the shared editor of REQ-0005, with the
  editor behavior of REQ-0005 Behavior 1–8 and 10 unchanged.
- Everything around it that reads or writes the text box: Enter and Shift+Enter,
  the `@` picker, slash commands, the draft, paste of text and of images, dropped
  files and the attach button, attachments, the placeholder, its height and its disabled state.
- Not in this story: building the editor and the vendor file (REQ-0005); this
  story adds to the shared editor only what the bar needs (C-10), and every
  field in Room settings and the dialogs stays as REQ-0005 left it.

## Non-goals

- A formatting toolbar, a preview toggle or a separate preview.
- Formatting of tables and raw HTML: plain text; raw HTML never runs.
- Any change to what agents receive, the tokens sent, routing, Converge and
  Parallel modes, or the way a sent message renders in the conversation.
- Partial delivery: the chat bar ships only if everything above works
  (PD-0011 item 7). If it does not, nothing of it is merged and engineering
  reports what failed.

## Behavior

The editor's rules are those of REQ-0005 Behavior 1–8 and 10, as ruled in
[PD-0013](../../../decisions/PD-0013-live-markdown-editor-behaviour-rulings.md):
live formatting with marks hidden on closed elements and shown on the line being
edited (and on every selected line); bold, italic, inline code, code blocks,
headings, lists and links in the style chat messages show; tables, quotes, rules
and raw HTML plain, raw HTML never runs; a normal click on a link places the
cursor and Cmd+click (Ctrl+click on Windows and Linux) opens it; pasted
Markdown formats at once and copying returns the Markdown; the saved or sent
text is exactly what was typed, with no inserted character of any kind. In the
chat bar:

1. **Enter and Shift+Enter** work exactly as today: Enter sends, Shift+Enter
   inserts a new line. Enter while an accent or IME composition is open
   confirms the composition and sends nothing, in every browser; today nothing
   checks for a composition, so this one case is fixed rather than kept
   (PD-0013 item 11).
2. **The `@` picker** opens when `@` is typed, as today; choosing an agent
   inserts the mention as today; the picker's own keys (arrows, Enter, Tab,
   Escape) work as today, and Enter in the picker does not send. When the text
   so far is `/word` at the start, the same picker lists the slash commands, as
   today.
3. **Slash commands** are read from the text as typed and run as today.
4. **The text in the bar** behaves as today (PD-0013 item 12): it stays when the
   user switches rooms and is gone when the page is reloaded. There are no
   per-room saved drafts. Attachment drafts are cleared when a room loads, as
   today. Parley trims the leading and trailing whitespace of a sent message, as
   today (PD-0013 item 7).
5. **Paste.** Text pastes as typed text and formats at once; pasting an image
   makes an attachment, as today. Attachments and sending with them work as
   today. A file dropped on the bar becomes an attachment as today and none
   of its text is written into the bar.
6. **Undo and redo** work across typing and paste. When Parley's own code writes
   the bar (send clears it, a mention is inserted, a starter chip fills it), undo
   cannot bring back the text sent or replaced (PD-0013 item 13).
7. **Long text.** A 20,000-character message, pasted or typed, can be edited
   and sent without losing, reordering or delaying any typed character.
8. **Typing is never disturbed.** Formatting never moves the cursor, drops a
   character or interrupts accent or IME composition.
9. **Placeholder, height and disabled state** are as today: the bar grows with
   its text up to 200 pixels and then scrolls inside itself.
10. **Not delivered partially.** If any of this fails, the story is not
    merged; engineering reports and does not fall back to a different editor
    (PD-0011 items 5 and 7).

## Acceptance criteria

- [ ] In the chat bar type `**bold**`, italic, inline code, a fenced code
      block, a heading, a bullet list, a numbered list and a link, one per
      line → each shows in the style a sent chat message shows for the same
      text today when the cursor is on another line, and the `**` marks of a
      closed element are hidden and show again on the line being edited
- [ ] Type a Markdown table, a `>` quote line, a `---` line, `_underscore_`
      text, a code fence with no closing fence, and raw HTML (including a
      script tag) in the chat bar → they stay plain text; nothing runs and no
      element is created
- [ ] Click a link in the chat bar → the cursor is placed in the text and
      nothing opens; Cmd+click the link (Ctrl+click on Windows and Linux) → it
      opens in a new browser tab
- [ ] Type a multi-line Markdown message and press Enter → it is sent once and
      the text sent equals the typed text character for character, after the
      leading and trailing whitespace that Parley trims today; the message
      then shows in the conversation as a sent message shows today
- [ ] Press Shift+Enter → a new line is inserted and nothing is sent; press
      Enter while an accent or IME composition is open → the composition is
      confirmed and nothing is sent, in every browser
- [ ] Type `@` → the agent picker opens as today; choose an agent → the
      mention is inserted as today and the message goes to that agent; Arrow
      keys, Enter, Tab and Escape in the open picker work as today and Enter
      in the picker does not send; type `/` at the start and choose a command
      from the picker → it is inserted as today
- [ ] Type a slash command such as `/note` or `/pair` → it runs exactly as
      today and the typed text is read as typed
- [ ] Type text, switch to another room and back → the text is still in the
      bar, as today; reload the page → the bar is empty and attachments are
      cleared when a room loads, as today
- [ ] Paste Markdown text → it formats at once and sending it sends the pasted
      text exactly; paste an image and attach a file → they become attachments
      as today and a message with attachments sends as today
- [ ] Press Cmd+Z in the chat bar → the last typing or paste is undone; press
      Cmd+Shift+Z → it is redone; after sending, Cmd+Z in the empty bar does
      not bring the sent text back
- [ ] Paste 20,000 characters of Markdown and then type 100 characters at the
      end and in the middle by keyboard → none of the 100 typed characters is
      lost or out of order, the cursor stays where it was typed, and the sent
      text equals the 20,120 characters
- [ ] Type an accented letter by composition in the middle of `**bold**` and
      type the closing marks → the text is intact, the cursor is not moved and
      the composition is not interrupted
- [ ] With the bar empty → the placeholder `Message the table…  type @ to
      choose an agent` shows; the bar grows with its text up to its present
      maximum height of 200 pixels and scrolls inside itself beyond it; it is
      disabled whenever it is disabled today
- [ ] The existing smoke run (`test/smoke.mjs`, as repaired by PRL-6) and the
      existing browser suites pass after the change, updated only where they
      read the old text box
- [ ] Drop a text file on the chat bar → it becomes an attachment as today and
      none of its text is written into the bar
- [ ] composition: at 1440 wide, light theme, the chat bar holding 20,000
      characters over many lines with an image attachment, a file attachment
      and the agent chips shows the send control, the attachment chips and the
      agent chips in full, with no truncation, clipping, ellipsis or
      horizontal scroll of the page; the text scrolls inside the bar

## Sequencing

`depends_on: [REQ-0005]`. REQ-0006 starts after REQ-0005 is merged: it reuses
the shared editor and the vendor file that story builds. Precondition outside
the story set: PRL-6 merged and green on `main` (PD-0011 item 10).

## Technical constraints

_Binding, from [technical/assessment.md](../technical/assessment.md) (verdict
`feasible-with-constraints`, band multi-component) as carried by
[PD-0012](../../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md)
item 3. The vendor file and the shared component (C-01 to C-05, C-11, C-12) are
built by [REQ-0005](REQ-0005-live-markdown-editor-in-room-settings.md) and
reused here; its full constraint table applies to the shared component. What
this story adds or must hold in the chat bar:_

| # | Constraint |
| --- | --- |
| C-06 | The editor inserts nothing: no list continuation, auto-indent, bracket or quote closing, smart typography or auto-trim. |
| C-07 | Formatting is narrowed to what `renderMD` formats; rare edge cases may differ. |
| C-08 | No hidden range over the line holding the cursor or an open composition. |
| C-09 | The bar answers everything the code asks of the `#input` text box: value read (`$("input").value`) and write (clear after send, rebuild on failure, `/summarize`, starter chips, mention insert), `selectionStart` read and `selectionStart`/`selectionEnd` written after a mention, the `input` listener that autosizes, updates the route hint and checks for `@`, focus calls, the runtime-mismatch disabled state, the placeholder set again by `renderSeatsUI`, and the `#input` id that CSS and 9 test files query. |
| C-10 | The existing key and paste handlers run before the editor's own: the picker takes arrows, Enter, Tab and Escape first; Enter sends unless Shift is held or a composition is open; the image-paste handler still gets the paste event. |
| C-13 | Text written by code must not be undoable back into sent or replaced content. |
| C-14 | Copy and Cut with nothing selected do nothing. |
| C-15 | The bar keeps its accessible name and spellcheck, autocorrect and capitalisation settings; Tab and Escape behave as today. |
| C-16 | The CSS on the bar (size, focus ring on the composer card, placeholder with its ellipsis, 200-pixel maximum height, `resize: none`, no horizontal overflow) applies to the editor. |
| C-17 | The test lines that read `#input` (18 lines in 8 files, counted on `main` at `31ec463`, and `test/smoke.mjs`'s stub of `$("input")`) are updated; the 17 lines that read the settings and dialog fields were REQ-0005's; no new suite; PRL-6 first. |
| C-18 | Verification on an isolated port with a copied room store, never ports 4142 or 4141. |
| C-19 | Links open only on Cmd+click (Ctrl+click elsewhere), `http` and `https`, new tab, no opener, no referrer. |
| C-20 | No new runtime network request and no new stored data. |
| C-21 | A file dropped on the bar inserts nothing; the library's default is switched off in the shared editor (REQ-0005 C-21) and the page's window-wide drop handling attaches the file as today. |

The picker uses only the text before the caret and a settable caret, never a
caret pixel position, so the editor need not supply one. Per-keystroke work on
the whole text (autosize, route hint, `@` check) is the cost to watch with
20,000 characters; a single 20,000-character unbroken line is the weak case
(assessment R-08). The repository's browser harness runs Chromium only (also the
engine Workbench uses), so the focused check records which browsers it covered;
the Enter guard applies in every browser regardless. If any behaviour above does
not work, the story is not merged and engineering reports (PD-0011 items 5 and 7).

## Observability

none — the editor is visible on screen; the done check reads the sent text.

## Rollout

none. The live server on port 4142 and Workbench pick the change up only when
the requester restarts or rebuilds them; engineering never does
([constraints](../../../project/constraints.md) #1; PD-0011 item 9).

## Notes

- Verification, as the requester set it: one focused browser check on an
  isolated port with a copy of the room store, covering the chat bar (each
  Markdown element renders live, the sent text matches what was typed, undo and
  paste work; Enter, Shift+Enter and an `@` mention work). No new unit or smoke
  suites (PD-0011 item 8).
- Current behavior: [CAP-0003](../../../capabilities/CAP-0003-chat-bar-message-composing.md).
- Design: the look is the existing chat Markdown style; the design reference is
  [DES-0003](../../../design/DES-0003-markdown-editor-reference-frames.md), the
  frame `markdown-editor-chat-bar` (its sample text is illustrative; where the frame and
  this story differ, the story wins).
