---
id: REQ-0006
type: requirement
title: The user types Markdown in the chat bar and sees it format as they type
status: draft
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
initiative: INIT-0003
outcome_element: "O2 — In the chat bar, Markdown the user types formats in place as they type, the text sent is exactly what was typed, and the @ agent picker, slash commands, Enter and Shift+Enter, drafts, paste, attachments, undo and redo work as they do today."
acceptance:
  - "In the chat bar type **bold**, italic, inline code, a fenced code block, a heading, a bullet list, a numbered list and a link, one per line → each shows in the style a sent chat message shows for the same text today when the cursor is on another line, and the ** marks of a closed element are hidden and show again on the line being edited"
  - "Type a Markdown table and raw HTML (including a script tag) in the chat bar → they stay plain text; nothing runs and no element is created"
  - "Click a link in the chat bar → the cursor is placed in the text and nothing opens; Cmd+click the link → it opens in a new browser tab"
  - "Type a multi-line Markdown message and press Enter → it is sent once and the text sent equals the typed text character for character; the message then shows in the conversation as a sent message shows today"
  - "Press Shift+Enter → a new line is inserted and nothing is sent; press Enter while an accent or IME composition is open → the composition is confirmed and nothing is sent, as today"
  - "Type @ → the agent picker opens as today; choose an agent → the mention is inserted as today and the message goes to that agent; Arrow keys, Enter and Escape in the open picker work as today and Enter in the picker does not send"
  - "Type a slash command such as /note or /pair → it runs exactly as today and the typed text is read as typed"
  - "Type text, switch rooms and come back, and reload the page → the draft returns as it was saved today, equal to what was typed"
  - "Paste Markdown text → it formats at once and sending it sends the pasted text exactly; paste an image and attach a file → they become attachments as today and a message with attachments sends as today"
  - "Press Cmd+Z in the chat bar → the last typing or paste is undone; press Cmd+Shift+Z → it is redone"
  - "Paste 20,000 characters of Markdown and then type 100 characters at the end and in the middle by keyboard → none of the 100 typed characters is lost or out of order, the cursor stays where it was typed, and the sent text equals the 20,120 characters"
  - "Type an accented letter by composition in the middle of **bold** and type the closing marks → the text is intact, the cursor is not moved and the composition is not interrupted"
  - "With the bar empty → the placeholder Message the table…  type @ to choose an agent shows; the bar grows with its text up to its present maximum height and scrolls inside itself beyond it; it is disabled whenever it is disabled today"
  - "The existing smoke run (test/smoke.mjs, as repaired by PRL-6) and the existing browser suites pass after the change, updated only where they read the old text box"
  - "composition: at 1440 wide, light theme, the chat bar holding 20,000 characters over many lines with an image attachment, a file attachment and the agent chips shows the send control, the attachment chips and the agent chips in full, with no truncation, clipping, ellipsis or horizontal scroll of the page; the text scrolls inside the bar"
capabilities: [CAP-0003]
design_refs: []
decisions: [PD-0011]
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
  the `@` picker, slash commands, the draft, paste of text, images and files,
  attachments, the placeholder, its height and its disabled state.
- Not in this story: the editor itself and the vendor file (REQ-0005), and every
  field in Room settings and the dialogs.

## Non-goals

- A formatting toolbar, a preview toggle or a separate preview.
- Formatting of tables and raw HTML: plain text; raw HTML never runs.
- Any change to what agents receive, the tokens sent, routing, Converge and
  Parallel modes, or the way a sent message renders in the conversation.
- Partial delivery: the chat bar ships only if everything above works
  (PD-0011 item 7). If it does not, nothing of it is merged and engineering
  reports what failed.

## Behavior

The editor's rules are those of REQ-0005 Behavior 1–8 and 10: live formatting
with marks hidden on closed elements and shown on the line being edited; bold,
italic, inline code, code blocks, headings, lists and links in the style chat
messages show; tables and raw HTML plain, raw HTML never runs; a normal click on
a link places the cursor and Cmd+click opens it; pasted Markdown formats at
once and copying returns the Markdown; the saved or sent text is exactly what
was typed, with no inserted character of any kind. In the chat bar:

1. **Enter and Shift+Enter** work exactly as today: Enter sends, Shift+Enter
   inserts a new line, and Enter while an accent or IME composition is open
   confirms the composition and sends nothing.
2. **The `@` picker** opens when `@` is typed, as today; choosing an agent
   inserts the mention as today; the picker's own keys (arrows, Enter, Escape)
   work as today, and Enter in the picker does not send.
3. **Slash commands** are read from the text as typed and run as today.
4. **The draft** is kept and restored exactly as today.
5. **Paste.** Text pastes as typed text and formats at once; pasting an image
   makes an attachment, as today. Attachments and sending with them work as
   today.
6. **Undo and redo** work across typing and paste.
7. **Long text.** A 20,000-character message, pasted or typed, can be edited
   and sent without losing, reordering or delaying any typed character.
8. **Typing is never disturbed.** Formatting never moves the cursor, drops a
   character or interrupts accent or IME composition.
9. **Placeholder, height and disabled state** are as today.
10. **Not delivered partially.** If any of this fails, the story is not
    merged; engineering reports and does not fall back to a different editor
    (PD-0011 items 5 and 7).

## Acceptance criteria

- [ ] In the chat bar type `**bold**`, italic, inline code, a fenced code
      block, a heading, a bullet list, a numbered list and a link, one per line
      → each shows in the style a sent chat message shows for the same text
      today when the cursor is on another line, and the `**` marks of a closed
      element are hidden and show again on the line being edited.
- [ ] Type a Markdown table and raw HTML (including a script tag) in the chat
      bar → they stay plain text; nothing runs and no element is created.
- [ ] Click a link in the chat bar → the cursor is placed in the text and
      nothing opens; Cmd+click the link → it opens in a new browser tab.
- [ ] Type a multi-line Markdown message and press Enter → it is sent once and
      the text sent equals the typed text character for character; the message
      then shows in the conversation as a sent message shows today.
- [ ] Press Shift+Enter → a new line is inserted and nothing is sent; press
      Enter while an accent or IME composition is open → the composition is
      confirmed and nothing is sent, as today.
- [ ] Type `@` → the agent picker opens as today; choose an agent → the mention
      is inserted as today and the message goes to that agent; Arrow keys,
      Enter and Escape in the open picker work as today and Enter in the picker
      does not send.
- [ ] Type a slash command such as `/note` or `/pair` → it runs exactly as today
      and the typed text is read as typed.
- [ ] Type text, switch rooms and come back, and reload the page → the draft
      returns as it was saved today, equal to what was typed.
- [ ] Paste Markdown text → it formats at once and sending it sends the pasted
      text exactly; paste an image and attach a file → they become attachments
      as today and a message with attachments sends as today.
- [ ] Press Cmd+Z in the chat bar → the last typing or paste is undone; press
      Cmd+Shift+Z → it is redone.
- [ ] Paste 20,000 characters of Markdown and then type 100 characters at the
      end and in the middle by keyboard → none of the 100 typed characters is
      lost or out of order, the cursor stays where it was typed, and the sent
      text equals the 20,120 characters.
- [ ] Type an accented letter by composition in the middle of `**bold**` and
      type the closing marks → the text is intact, the cursor is not moved and
      the composition is not interrupted.
- [ ] With the bar empty → the placeholder `Message the table…  type @ to
      choose an agent` shows; the bar grows with its text up to its present
      maximum height and scrolls inside itself beyond it; it is disabled
      whenever it is disabled today.
- [ ] The existing smoke run (`test/smoke.mjs`, as repaired by PRL-6) and the
      existing browser suites pass after the change, updated only where they
      read the old text box.
- [ ] composition: at 1440 wide, light theme (the display matrix of
      [PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md)
      item 3), the chat bar holding 20,000 characters over many lines with an
      image attachment, a file attachment and the agent chips shows the send
      control, the attachment chips and the agent chips in full, with no
      truncation, clipping, ellipsis or horizontal scroll of the page; the text
      scrolls inside the bar.

## Sequencing

`depends_on: [REQ-0005]`. REQ-0006 starts after REQ-0005 is merged: it reuses
the shared editor and the vendor file that story builds. Precondition outside
the story set: PRL-6 merged and green on `main` (PD-0011 item 10).

## Technical constraints

_To be filled from [technical/assessment.md](../technical/assessment.md) at
SOLUTION_CONVERGENCE._

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
- Design: the look is the existing chat Markdown style; the design reference
  is recorded at DECOMPOSITION.
