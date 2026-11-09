---
initiative: INIT-0003
type: product-definition-contract
title: Product definition contract — Markdown text formats as you type in the chat bar and Room Settings
status: accepted
revision: 1
owner_role: ROLE-product-manager
drafted_by: ROLE-product-manager (inline, size rule §9d.2)
validated_by: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
requirements: [REQ-0005, REQ-0006]
open_questions: []
decisions: [PD-0011]
raw_sources: [sources/raw-request.md, sources/run-instructions.md]
---

# Product definition contract — INIT-0003

> A contract cites raw sources; it never supersedes them. A drift between
> this file and the raws is a defect in this file.

## Problem

Goal, Rules, agent instructions and chat messages are Markdown, but the user
types them as plain text and sees the formatting only after sending, or in a
separate Edit/Preview toggle for agent instructions
([raw request](sources/raw-request.md), "Decision to build"; `CHECKPOINT.md`,
2026-10-26).

## Actors

- The room owner (Ricardo), who types Goal, Rules, instructions and messages.
- The room's agents, which receive the saved or sent text unchanged.

## Current behavior

[CAP-0001](../../../capabilities/CAP-0001-room-shared-context.md),
[CAP-0002](../../../capabilities/CAP-0002-room-creation-and-setup.md) and
[CAP-0003](../../../capabilities/CAP-0003-chat-bar-message-composing.md): all
these fields are plain text boxes; agent instructions have an Edit/Preview
toggle.

## Desired outcomes

O1 — In the Room Brief's Goal and Rules, in agent instructions (Room settings
and Create room) and in the New Room and Clone dialogs, Markdown the user types
formats in place as they type, with no toggle and no separate preview, and the
text saved is exactly what was typed.

O2 — In the chat bar, Markdown the user types formats in place as they type, the
text sent is exactly what was typed, and the `@` agent picker, slash commands,
Enter and Shift+Enter, drafts, paste, attachments, undo and redo work as they
do today
([initiative](../initiative.md) `## Outcome`).

## Requirements

| REQ- id | Status | One-line statement |
| --- | --- | --- |
| REQ-0005 | draft | The user types Markdown in Room Settings and the New Room and Clone dialogs and sees it format as they type |
| REQ-0006 | draft | The user types Markdown in the chat bar and sees it format as they type |

## Constraints

- [constraints](../../../project/constraints.md) #1 — never touch port 4142, never use 4141; test on an isolated port.
- #2 — plain `ui/index.html`, `ui/app.js`, `ui/styles.css`, no React, Storybook or build step; amended for one prebuilt vendor file by [PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md) item 5.
- #3 — design at 1440 wide, light only.
- Principle 2 — never cut the user's saved text ([principles](../../../project/principles.md)); [PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 2 for text above a limit.
- Key rule — the saved text is exactly what was typed ([raw request](sources/raw-request.md), "Key rule").
- Precondition for engineering: PRL-6 merged and green on `main` ([raw request](sources/raw-request.md), "Constraints").

## Known facts

- What is decided, what is built on, where it applies, the order and the done check: [raw request](sources/raw-request.md), "Decision to build", "Behavior", "Where", "How to build", "Order", "Done means".
- The chat bar must keep working in the ways listed: [raw request](sources/raw-request.md), "Chat bar must keep working".
- Proportionate: no canvas, no multi-page design track, no new unit or smoke suites, look is the existing chat Markdown style: [raw request](sources/raw-request.md), "Constraints", "Done means"; [run instructions](sources/run-instructions.md).
- Agent instructions have an Edit/Preview toggle in Create room and Room settings today (`CHECKPOINT.md`, 2026-10-26).

## Rejected assumptions

- A formatting toolbar, a preview toggle, TipTap and a hand-built `contenteditable` — ruled out by the requester ([PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md), Options considered).

## Open questions

None.

## Decisions already made

[PD-0011](../../../decisions/PD-0011-live-markdown-editor-requester-decisions.md) (the requester's decisions);
[PD-0004](../../../decisions/PD-0004-room-brief-design-depth-and-display-matrix.md) item 3 (display matrix);
[PD-0006](../../../decisions/PD-0006-room-brief-platform-rulings.md) item 2 (limits stop new input only).

## Raw-source citations

- `product/initiatives/INIT-0003-live-markdown-editor/product/sources/raw-request.md`
- `product/initiatives/INIT-0003-live-markdown-editor/product/sources/run-instructions.md`

## Non-goals

A formatting toolbar; a preview toggle or separate preview; formatting of
tables and raw HTML; single-line fields and the 200-character Decision field;
any change to the backend, tokens sent, "What agents see" or character counts;
TipTap or a hand-built `contenteditable`; a design canvas or multi-page design
track; new unit or smoke suites; rebuilding or quitting Workbench.

## Validation

Validated by the PM on 2026-11-08 against both raw sources, item by item: every
line of "Decision to build", "Behavior", "Where", "Key rule", "How to build",
"Chat bar must keep working", "Order", "Done means" and "Constraints" maps to
PD-0011 items 1–10 and to REQ-0005 Behavior 1–12 or REQ-0006 Behavior 1–10, or
to Non-goals; nothing dropped, softened or added beyond the PM's recorded
clarifications (the meaning of "line", no inserted characters, limits behaving
as the text box did, the 20,000-character worst case).
