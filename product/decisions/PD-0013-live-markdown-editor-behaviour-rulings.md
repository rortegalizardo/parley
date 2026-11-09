---
id: PD-0013
type: decision
title: Live Markdown editor behaviour — the product manager's rulings, with the architect's findings
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
decided_on: 2026-11-08
affects: [INIT-0003, CAP-0003]
supersedes:
superseded_by:
---

# PD-0013 — Live Markdown editor behaviour — the product manager's rulings, with the architect's findings

Decided by `ROLE-product-manager` at SOLUTION_CONVERGENCE under §4.1. Each ruling
settles a detail inside the behaviour the requester decided
([PD-0011](PD-0011-live-markdown-editor-requester-decisions.md)), or says how a
criterion reads given what the code does today. None changes the outcome, the
target user or the success measure, none drops or narrows a need the requester
stated, and none touches `constraints.md`, `principles.md` or another decision
(`escalation-policy` §2: a question reaches the requester only when it is the requester's to decide).
The architect's numbering (PR-1 to PR-11, PC-01 to PC-09) is kept in brackets.

## Context

The architect read the code on `main` at `fa35e69` against the draft stories
([assessment](../initiatives/INIT-0003-live-markdown-editor/technical/assessment.md),
"Product assumptions that conflict with the platform" and "Product rulings the PM
must make"). The PM re-checked the load-bearing facts on `main` (no text draft, no
composition check on Enter, the trims) before ruling; see INIT-0003 `## Session
notes`. The requester's words stay the source: "Enter and Shift+Enter exactly as
today", "drafts ... undo, redo", "formatting never moves the cursor, loses text or
interrupts accent or IME typing", "the saved text is exactly what was typed"
([raw request](../initiatives/INIT-0003-live-markdown-editor/product/sources/raw-request.md)).

## Decision

**What the editor shows**

1. **A selection across several lines [PR-1].** Every line the selection touches
   shows its marks, so what is selected is what is seen. A line is a line of the
   saved text (up to a newline), not a wrapped display line.
2. **A fenced code block [PR-2].** With the cursor anywhere inside the block, both
   fence lines show. With the cursor elsewhere, the fence lines are hidden but
   keep their height as blank strips of the block's background, so the text does
   not jump when the cursor enters or leaves.
3. **A field without focus [PR-3].** Marks are hidden on every closed element,
   including on the line last edited, so a saved Brief reads clean.
4. **What is and is not formatted [PR-4, PC-07, PC-08].** Only the requester's
   list is formatted: bold, italic, inline code, code blocks, headings, lists and
   links, narrowed to the cases `renderMD` formats (`*italic*` and `**bold**`;
   `_x_` and `__x__` stay plain; headings are `#` to `####` at the start of a
   line; no indented code). Blockquotes and horizontal rules, which chat renders
   but the requester did not list, stay plain text, as tables and raw HTML do.
   Where the editor and chat differ on a rare edge case, the editor may differ
   (PD-0011 item 2). A code fence with no closing fence stays plain text until it
   is closed, as in chat. A numbered list shows the numbers as typed; the editor
   never renumbers (chat renumbers from the first number, the editor never
   rewrites text).
5. **A code block's look [PR-5].** A monospace font and the code background of
   chat. The language header, the copy button and the language colours of a sent
   message are not part of the editor: a button inside text being typed is not
   wanted.
6. **A link on Windows and Linux [PR-11].** Cmd+click on macOS and Ctrl+click
   elsewhere open the link in a new tab; a normal click places the cursor.

**What the editor saves and sends**

7. **Trimming stays as it is today [PR-8, PC-04].** Parley trims the leading and
   trailing whitespace of a sent message and of an agent's instructions, in the
   browser and on the server; it does not trim the Brief's Goal and Rules. The
   editor trims nothing and inserts nothing. "Exactly what was typed" means the
   editor changes no character and that Parley's own handling is as today; the
   acceptance criteria apply after that existing trim. Changing what the backend
   does with the text is outside this initiative.
8. **Line endings.** Text read from the editor uses `\n`, as a text box's value
   does.

**Length limits**

9. **A part saved above its limit [PR-10, PC-06].** It loads in full and can be
   shortened. After shortening it may be made longer again, never beyond the
   length it was saved at, which is what the text box and the server do today. A
   deletion can always be undone.
10. **Settings agent instructions [PR-9, PC-05].** They have no typing limit today
    and none is added: the user can type past 8,000 characters and Save shows the
    server's refusal, as today. Create room's instructions stop at 8,000, as
    today.

**The chat bar**

11. **Enter while an accent or IME composition is open [PR-7, PC-03].** It
    confirms the composition and sends nothing, in every browser. Today nothing
    checks for a composition, and what Enter does then depends on what the browser
    reports; this fixes it. Everywhere else Enter sends and Shift+Enter inserts a
    new line, exactly as today.
12. **Drafts [PR-6, PC-02].** The criterion reads as today's behaviour, not a new
    one. The text in the bar stays when the user switches rooms and is gone when
    the page is reloaded; attachment drafts are cleared when a room loads. No
    per-room saved text drafts are built: that is a new behaviour the requester
    did not ask for. The brief's phrase "drafts work as they do today" is met by
    keeping that behaviour.
13. **Code writes are not undoable into old content.** When Parley's own code
    writes the bar (send clears it, a mention is inserted, a starter chip fills
    it), undo cannot bring back text already sent or replaced (C-13). The user's
    typing and pasting are undone and redone as normal.

**Scope wording**

14. **"No change to the backend" [PC-01].** Read as PD-0012 item 5 reads it: no
    change to any request, response, stored data or check; the server's fixed list
    of client files gains the one vendor file.
15. **Tests [PC-09].** Existing tests are updated only where they read the old
    text box (35 lines in 9 files, C-17). No new suites (PD-0011 item 8).

## Options considered

| Ruling | Option not taken | Why not |
| --- | --- | --- |
| 1 | Only the cursor's own line shows marks while a selection is dragged across lines | Other selected lines would stay formatted, so the selection does not show what it covers. |
| 2 | Fence lines collapse when away, or each fence shows only when the cursor is on it | Collapsing makes the text jump when the cursor enters the block; per-fence marks leave stray marks mid-block. |
| 3 | Keep the last-edited line's marks after focus leaves | A saved Goal would show marks on one line and not the others. |
| 4 | Format blockquotes and rules, or `_x_` | Not on the requester's list; more to keep aligned with chat (C-07). |
| 5 | Header bar, copy button and language colours in the editor | A button inside the text being typed, and extra language code in the vendor file. |
| 7 | Stop trimming sent text and instructions | Changes what messages and instructions are, against "backend unchanged" and tokens sent unchanged. |
| 9 | No growth at all above the limit | An undone deletion could be refused. |
| 10 | Add an 8,000-character typing limit to Settings instructions | A new behaviour the requester did not ask for; it affects instructions already longer. |
| 11 | Whatever today's code does during a composition | Varies by browser, and sends half-composed text, against "never interrupts accent or IME typing". |
| 12 | Build per-room saved text drafts | New behaviour the requester did not ask for; the brief says drafts work as they do today. |

## Consequences

Accepted: two small differences from today that the requester's own rules ask for
(Enter during a composition sends nothing; marks of closed elements are hidden),
and two places where the editor deliberately differs from chat (no language
header on code blocks, no blockquote or rule formatting). Anything that surprises
the requester can be reversed by a new decision.

> Once `status: accepted`, this body is never rewritten. A change of mind is a
> new decision with `supersedes: PD-nnnn`.
