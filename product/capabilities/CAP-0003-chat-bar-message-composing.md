---
id: CAP-0003
type: capability
title: The user writes and sends messages to a room's agents from the chat bar
status: authoritative
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
surfaces: ["Room view → chat bar (the message box at the bottom of a room, with its agent chips, attachments and Send)"]
implemented_by: []
decisions: []
---

# CAP-0003 — The user writes and sends messages to a room's agents from the chat bar

Recorded at INIT-0003 DISCOVERY from the requester's list of what must keep
working ([raw request](../initiatives/INIT-0003-live-markdown-editor/product/sources/raw-request.md),
"Chat bar must keep working"), because the chat bar shipped before Product
Memory existed. Revision 2 corrects it from the architect's capability scan of
the code on `main` at `fa35e69`
([capability-scan.md](../initiatives/INIT-0003-live-markdown-editor/technical/capability-scan.md),
Check 2a; [assessment.md](../initiatives/INIT-0003-live-markdown-editor/technical/assessment.md),
"Corrections to CAP-0003"). Precedent: CAP-0002 in INIT-0002.

## Behavior today

- **The message box** is a plain multi-line text box with the placeholder
  `Message the table…  type @ to choose an agent`. It grows with its text up to
  200 pixels and then scrolls inside itself. The user types plain text;
  Markdown in a sent message is rendered only after sending, in the
  conversation (`renderMD` in `ui/app.js`).
- **Enter** sends the message; **Shift+Enter** inserts a new line. Nothing
  checks for an open accent or IME composition: what Enter does during one
  depends on what the browser reports.
- **The picker.** Typing `@` opens a picker of the room's agents; choosing one
  inserts the mention and routes the message to that agent. When the text so far
  is `/word` at the start, the same picker lists the slash commands. Arrow keys,
  Enter and Tab choose; Escape closes; the picker takes the key before the
  message box does.
- **Slash commands.** A message starting with `/` is a local or room command
  (for example `/note`, `/pair`, `/summarize`) and is not sent to the agents as
  chat. `/pair` goes to the server; `/summarize` rewrites the box and sends a
  chat message. Starter chips also fill the box.
- **Sent text is trimmed** at both ends, in the browser and on the server.
- **Paste and attachments.** Pasting an image makes an attachment; all other
  paste is the browser's own. Files come from the paperclip and from dragging a
  file onto the window. Attachments can accompany messages or `/pair` tasks but
  not local slash commands.
- **Drafts.** The typed text is not saved anywhere: it stays in the one shared
  box when the user switches rooms and is lost when the page is reloaded.
  Attachment drafts exist only in memory and are cleared when a room loads.
- **Undo and redo** are the browser's own for the text box, lost whenever the
  code writes the box (send, mention insert, starter chip).
- **Disabled** only while the runtime-mismatch banner shows.

## Surfaces

See frontmatter `surfaces`.

## Boundaries

What agents receive for a sent message, the routing rules and the Converge and
Parallel modes are room behavior, not chat-bar behavior (CAP-0001, CAP-0002).

## Constraints

None recorded beyond `project/constraints.md`.

## Change log

| Date | Revision | Change | Initiative |
| --- | --- | --- | --- |
| 2026-11-08 | 1 | Recorded as current state | INIT-0003 (DISCOVERY) |
| 2026-11-08 | 2 | Corrected from the architect's scan: no text draft, no composition check on Enter, picker also lists slash commands, sent text trimmed, paste and files, `/pair` and `/summarize`, height | INIT-0003 (SOLUTION_EXPLORATION) |
