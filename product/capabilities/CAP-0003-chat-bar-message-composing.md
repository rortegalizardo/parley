---
id: CAP-0003
type: capability
title: The user writes and sends messages to a room's agents from the chat bar
status: authoritative
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
surfaces: ["Room view → chat bar (the message box at the bottom of a room, with its agent chips, attachments and Send)"]
implemented_by: []
decisions: []
---

# CAP-0003 — The user writes and sends messages to a room's agents from the chat bar

Recorded at INIT-0003 DISCOVERY from the committed code on `main` at `a40af74`
(`ui/index.html` `#input`, `ui/app.js`) and the requester's list of what must
keep working ([raw request](../initiatives/INIT-0003-live-markdown-editor/product/sources/raw-request.md),
"Chat bar must keep working"), because the chat bar shipped before Product
Memory existed. The architect's capability scan corrects this record at
SOLUTION_EXPLORATION (precedent: CAP-0002 in INIT-0002).

## Behavior today

- **The message box** is a plain multi-line text box with the placeholder
  `Message the table…  type @ to choose an agent`. The user types plain text;
  Markdown in a sent message is rendered only after sending, in the
  conversation (`renderMD` in `ui/app.js`).
- **Enter** sends the message; **Shift+Enter** inserts a new line.
- **`@` mentions.** Typing `@` opens a picker of the room's agents; choosing
  one inserts the mention and routes the message to that agent.
- **Slash commands.** A message starting with `/` is a local or room command
  (for example `/note`, `/pair`) and is not sent to the agents as chat.
- **Paste and attachments.** Pasting text inserts it as typed; pasting an image
  adds it as an attachment, and files can be attached; drafts of both stay in
  the bar until sent or removed. Attachments can accompany messages or `/pair`
  tasks but not local slash commands.
- **Undo and redo** are the browser's own for the text box.

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
