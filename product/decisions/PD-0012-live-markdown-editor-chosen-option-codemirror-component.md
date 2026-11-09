---
id: PD-0012
type: decision
title: The live Markdown editor is one shared CodeMirror 6 component (option A, feasible with constraints); its design reference is two static frames at 1440 light
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
decided_on: 2026-11-08
affects: [INIT-0003, CAP-0001, CAP-0002, CAP-0003]
supersedes:
superseded_by:
---

# PD-0012 — The live Markdown editor is one shared CodeMirror 6 component (option A, feasible with constraints); its design reference is two static frames at 1440 light

Decided by `ROLE-product-manager` at SOLUTION_CONVERGENCE. The option is the
requester's own ([PD-0011](PD-0011-live-markdown-editor-requester-decisions.md)
items 1 and 5); this record confirms it against the architect's verdict, carries
the binding constraints, and sets the design depth. The behaviour rulings are in
[PD-0013](PD-0013-live-markdown-editor-behaviour-rulings.md).

## Context

The architect assessed the one option and found it
**feasible-with-constraints**, complexity band **multi-component**, with no
stop condition under PD-0011 item 5: CodeMirror 6 works with the existing UI
([assessment](../initiatives/INIT-0003-live-markdown-editor/technical/assessment.md),
"Does CodeMirror 6 work with the existing UI?"; evidence in
[capability-scan.md](../initiatives/INIT-0003-live-markdown-editor/technical/capability-scan.md)
and [impact.md](../initiatives/INIT-0003-live-markdown-editor/technical/impact.md)).
The only option is the requester's decision; the alternatives are recorded in
PD-0011 as ruled out by him, so none is left under consideration. The look is
fixed by the requester: the existing chat Markdown style, 1440 wide, light, no
canvas and no multi-page design track
([raw request](../initiatives/INIT-0003-live-markdown-editor/product/sources/raw-request.md),
"Constraints").

## Decision

1. **Option A.** One small shared textarea-like component built on CodeMirror 6
   with decorations, shipped as one prebuilt file under `ui/vendor/`, replaces
   the plain text box in the chat bar and in every multi-line Markdown field the
   scan lists: Goal and Rules in Room settings → Brief; agent instructions in
   Room settings → Agents and in Create room; Goal and Rules in New Room; Goal in
   Clone. "Every multi-line field in Room Settings" is those three Settings
   fields; the Room tab has none. The 200-character Decision fields (Brief and
   Pin dialog), every single-line input and the read-only panes (What agents see,
   archived decisions) stay as they are.
2. **The stop condition stays live.** The architect's statements about
   CodeMirror 6 behaviour come from its documented design; nothing was run
   (assessment R-01). The focused browser check on REQ-0005 settles them first.
   If a behaviour a story requires does not work, engineering stops and reports,
   and does not substitute another editor or ship the chat bar (PD-0011 items 5
   and 7). REQ-0006 does not start until REQ-0005 is merged.
3. **Binding constraints carried to engineering**, from the assessment
   `## Constraints`; each story's `Technical constraints` section lists the ones
   that apply to it:
   - Vendor file: C-01 (the server's fixed client-file list gains the one file;
     see item 5), C-02 (runs under the current page security policy unchanged),
     C-03 (one classic script, loaded before the code that uses it, no network
     at run time), C-04 (every package at an exact version at least 20 days
     old; no requester exception is needed), C-05 (the license text of every
     package it contains), C-20 (no new runtime network request, no new stored
     data).
   - What the editor may do: C-06 (nothing that inserts text: no list
     continuation, auto-indent, bracket or quote closing, smart typography or
     trimming; no ready-made basic setup), C-07 (parsing narrowed to what
     `renderMD` formats), C-08 (no hidden range over a line holding the cursor
     or an open composition), C-12 (length limits), C-14 (Copy and Cut with
     nothing selected do nothing, as a text box), C-19 (links open only on
     Cmd+click, `http` and `https`, new tab, no opener, no referrer; no anchor
     is built from typed text).
   - What the editor must answer like a text box: C-09, C-10, C-11, C-13, C-15,
     C-16.
   - Tests and verification: C-17 (35 test lines in 9 files updated, no new
     suite, the smoke sandbox must not fail for lack of the vendor file),
     C-18 (isolated port with a copied root, never 4142 or 4141).
4. **Design reference.** Two static frames at 1440 wide, light theme, linking
   Parley's own `ui/styles.css`, recorded as one `DES-` with the frames' HTML and
   PNG as its `local_export`:
   - `markdown-editor-settings`: Room settings → Brief with a Goal and Rules that
     hold every element the editor formats (a heading, bold, italic, inline
     code, a fenced code block, a bullet list, a numbered list, a link), closed
     elements with their marks hidden and one line being edited with its marks
     shown; and, beside it, one agent's standing instructions in the live editor
     with no Edit/Preview toggle and its Expand editor button.
   - `markdown-editor-chat-bar`: the chat bar holding a multi-line Markdown
     message, with an agent chip and an attachment chip, and the empty bar with
     its placeholder.
   Steps 1a–1b do not run (one direction, fixed by the requester). Production
   steps 2a–10 and the design PR do not run, for the reasons
   [PD-0004](PD-0004-room-brief-design-depth-and-display-matrix.md) item 1 gives
   ([constraints](../project/constraints.md) #2: plain `ui/` files, no React, no
   Storybook; design as code in `ui/` would be product code) and because the
   requester ruled out a canvas and a multi-page track. Engineering builds from
   the `DES-` and the acceptance criteria; where they differ, the requirement
   wins and the frame's sample text is illustrative only. Display matrix: 1440
   wide, light theme (PD-0004 item 3).
5. **"The backend is unchanged" means no change to any request, response, stored
   data, check or message.** The server's fixed list of client files gains the one
   vendor file (C-01), because a file in `ui/vendor/` is not served otherwise and
   PD-0011 item 5 puts it there. This reads PD-0011 item 4 and item 5 together;
   it changes neither.

## Options considered

| Option | Why not |
| --- | --- |
| A rich-text editor such as TipTap, a hand-built `contenteditable`, a toolbar, an Edit/Preview toggle or a separate preview | Ruled out by the requester ([PD-0011](PD-0011-live-markdown-editor-requester-decisions.md), Options considered). Not assessed. |
| Full design-dispatch production path (plan, components, compose, sign-off, code `DES-`) | Needs React and Storybook, which Parley must not have (constraints #2); the requester ruled out a canvas and a multi-page design track. |
| One frame only (the Brief tab) | The chat bar is the other surface and has the long-text and attachment composition criterion; without its own frame it has no design reference (readiness `R4`). |
| No design reference (`design_refs: []`) | Both stories are user-facing and carry a `composition:` criterion; `R4` requires a `DES-` with its export on disk. |

## Consequences

Costs: a vendored third-party file a maintainer regenerates; a second Markdown
renderer to keep aligned with chat by hand (C-07); 35 test lines updated; the
editor re-created at the settings re-render sites (C-11); no code-level design
review before engineering, with fidelity checked against the two PNGs.
Benefits: the user sees formatted Markdown while writing everywhere it is
written, the saved and sent text is untouched, and the design effort matches a
look that already exists in chat.

> Once `status: accepted`, this body is never rewritten. A change of mind is a
> new decision with `supersedes: PD-nnnn`.
