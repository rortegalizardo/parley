---
id: INIT-0003
type: initiative
title: Markdown text formats as you type in the chat bar and Room Settings
status: active
revision: 4
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
capabilities: [CAP-0001, CAP-0002, CAP-0003]
requirements: [REQ-0005, REQ-0006]
tickets: [PRL-14, PRL-15]
decisions: [PD-0011, PD-0012, PD-0013]
---

# INIT-0003 — Markdown text formats as you type in the chat bar and Room Settings

## Outcome

When this is done, the user sees Markdown formatted in place while writing it,
everywhere they write it, and the saved or sent text is exactly what was typed.
Two outcome elements:

- **O1.** In the Room Brief's Goal and Rules, in agent instructions (Room
  settings and Create room) and in the New Room and Clone dialogs, Markdown the
  user types formats in place as they type, with no toggle and no separate
  preview, and the text saved is exactly what was typed.
- **O2.** In the chat bar, Markdown the user types formats in place as they
  type, the text sent is exactly what was typed, and the `@` agent picker,
  slash commands, Enter and Shift+Enter, drafts, paste, attachments, undo and
  redo work as they do today.

## Why now

The requester decided it in the room "Parlay Product Evolution"
([raw request](product/sources/raw-request.md), line 4): Goal, Rules and chat
are Markdown but are typed as plain text today.

## Scope

In scope:

- One shared live Markdown editor, built on CodeMirror 6 with decorations and
  committed as one prebuilt file under `ui/vendor/`
  ([PD-0011](../../decisions/PD-0011-live-markdown-editor-requester-decisions.md)).
- It replaces the plain text box in: the chat bar; Goal and Rules in the Room
  Brief (Room settings); agent instructions in Room settings and in Create
  room; Goal and Rules in the New Room dialog; Goal in the Clone dialog. The
  architect's scan found no other multi-line Markdown field: "every multi-line
  field in Room Settings" (the requester's phrase) is Goal, Rules and agent
  instructions ([PD-0012](../../decisions/PD-0012-live-markdown-editor-chosen-option-codemirror-component.md)
  item 1).
- Live formatting of what chat messages render today (bold, italic, inline
  code, code blocks, headings, lists, links), with marks hidden when an
  element is closed and shown again on the line being edited.
- Normal click on a link places the cursor, Cmd+click opens it; pasted Markdown
  formats at once; copying returns the Markdown.
- The chat bar keeps its `@` picker, slash commands, Enter and Shift+Enter,
  drafts, paste, attachments, undo and redo.
- Order: Room Settings first (REQ-0005), the chat bar second (REQ-0006).

Out of scope:

- **A formatting toolbar, a preview toggle or a separate preview.**
- **Tables and raw HTML** are not formatted: they stay plain text, and raw HTML
  never runs.
- **Single-line fields and the 200-character Decision fields**, which stay plain.
- **Any change to a request, response, stored data or check of the backend, the
  tokens sent, the "What agents see" preview or the character counts**, and any
  rewriting of saved Markdown. The server's fixed list of client files gains the
  one vendor file (PD-0012 item 5).
- **TipTap or another rich-text editor, and a hand-built `contenteditable`.**
- **A design canvas or a multi-page design track**; other widths and dark mode
  as designed or reviewed surfaces ([constraints](../../project/constraints.md) #3).
- **New unit or smoke test suites.**
- **Rebuilding or quitting Workbench**; the requester does that step.

## Success measures

From [the raw request](product/sources/raw-request.md), "Done means", shown by
one focused browser check:

- In the chat bar and in Goal: each Markdown element renders live, the saved
  or sent text matches what was typed, and undo and paste work.
- In the chat bar: Enter, Shift+Enter and an `@` mention work.
- Settings text is unchanged after closing and reopening.

## Product constraints

- Never touch or restart the live server on port 4142; never use 4141; test on
  an isolated port with a copy of the room store ([constraints](../../project/constraints.md) #1).
- Plain `ui/index.html`, `ui/app.js`, `ui/styles.css`; no React, Storybook or
  build step to run the app (#2), with the one prebuilt vendor file PD-0011
  item 5 permits.
- Designed at 1440 wide, light theme only (#3); the look is the existing chat
  Markdown style.
- The saved text is exactly what was typed (key rule; [principle 2](../../project/principles.md)).
- Precondition for engineering: PRL-6 (the `test/smoke.mjs` repair) merged and
  green on `main` (PD-0011 item 10).

## Requirements

| `REQ-` | Outcome element | Title |
| --- | --- | --- |
| [REQ-0005](requirements/REQ-0005-live-markdown-editor-in-room-settings.md) | O1 | The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type |
| [REQ-0006](requirements/REQ-0006-live-markdown-editor-in-chat-bar.md) | O2 | The user types Markdown in the chat bar and sees it format as they type |

## Capabilities affected

[CAP-0001](../../capabilities/CAP-0001-room-shared-context.md) (the Room Brief's
Goal and Rules are edited in the live editor),
[CAP-0002](../../capabilities/CAP-0002-room-creation-and-setup.md) (agent
instructions and the Create room and Clone dialogs), and
[CAP-0003](../../capabilities/CAP-0003-chat-bar-message-composing.md) (the chat
bar), recorded at DISCOVERY.

## Open questions

None.

## Scope log

| Date | Revision | Change | Reason |
| --- | --- | --- | --- |
| 2026-11-08 | 1 | Created at INTAKE (`new-initiative`) | Raw request from the requester |
| 2026-11-08 | 2 | Outcome O1 and O2, scope, out-of-scope, success measures and two draft requirements | PRODUCT_DEFINITION |
| 2026-11-08 | 3 | Field list settled from the architect's scan; backend wording; PD-0012 and PD-0013 | SOLUTION_CONVERGENCE |
| 2026-11-08 | 4 | Reference frames recorded as DES-0003; coherence repair (file drops, test counts, scope wording) to REQ-0005 and REQ-0006 revision 3, both accepted; scope unchanged | DECOMPOSITION |
