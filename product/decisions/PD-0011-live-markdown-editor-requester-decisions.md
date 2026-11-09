---
id: PD-0011
type: decision
title: One shared live Markdown editor for the chat bar and every multi-line field in Room Settings, built on CodeMirror 6 with one prebuilt vendor file
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-08
updated: 2026-11-08
decided_on: 2026-11-08
affects: [INIT-0003]
supersedes:
superseded_by:
---

# PD-0011 — One shared live Markdown editor for the chat bar and every multi-line field in Room Settings, built on CodeMirror 6 with one prebuilt vendor file

## Context

The requester (Ricardo) decided this in the room "Parlay Product Evolution"
and his side session relayed it as the brief copied verbatim to
[raw-request.md](../initiatives/INIT-0003-live-markdown-editor/product/sources/raw-request.md)
("Do not re-ask it"). The run is pre-authorized with no approval stops
([run instructions](../initiatives/INIT-0003-live-markdown-editor/product/sources/run-instructions.md)).
This record keeps his decisions so a later session does not re-open them. The
raw request is the source; where this record and it differ, the raw request
wins.

## Decision

The requester's decisions, in his order:

1. **What.** One shared live Markdown editor for the chat bar and every
   multi-line field in Room Settings. No toggle and no separate preview: text
   formats in place as you type, like an editor with live preview. Goal, Rules
   and chat are Markdown but are typed as plain text today; that is the
   problem ("Decision to build").
2. **Behavior** ("Behavior").
   - `**bold**` turns bold when closed and the marks disappear; the marks come
     back on the line being edited.
   - It supports what chat messages render today, in the same style: bold,
     italic, inline code, code blocks, headings, lists, links. `renderMD` in
     `ui/app.js` is the reference for common cases; rare edge cases may differ
     while typing.
   - Tables and raw HTML stay plain text; raw HTML never runs.
   - A normal click on a link places the cursor; Cmd+click opens it.
   - Pasted Markdown formats right away; copying returns the Markdown. No
     formatting toolbar.
3. **Where** ("Where"). The chat bar; Goal and Rules in the Room Brief; the New
   Room and Clone dialogs; agent instructions in both places they appear.
   Single-line fields and the 200-character Decision field stay plain.
4. **Key rule** ("Key rule"). The saved text is exactly what was typed. The
   editor only changes appearance and never rewrites Markdown. Backend, tokens
   sent, the "What agents see" preview and character counts do not change.
   Existing saved text stays intact, including indentation.
5. **How to build** ("How to build"). CodeMirror 6 with decorations, wrapped
   in one small shared component that reads and writes text like a textarea.
   No hand-built `contenteditable` and no rich-text editor such as TipTap.
   `ui/` has no bundler, so one prebuilt file is committed under `ui/vendor/`
   with its license, pinned versions and the command that generates it; the app
   stays offline-capable with no build step to run. Versions follow the Factory
   dependency policy (a dependency version younger than its 20-day cooling
   period is a requester exception, `escalation-policy` §2). **If CodeMirror
   does not work with the existing UI, engineering stops and reports; it does
   not pick something else.**
   **This amends [constraint #2](../project/constraints.md) for exactly that
   one prebuilt vendor file**: "no build step" is read as "no build step to
   run the app". The command that generates the file is run by a maintainer
   when the pinned versions change, and its output is committed. Nothing else
   in `ui/` gains a build step, a bundler or a package install at run time.
6. **The chat bar must keep working** ("Chat bar must keep working"). The `@`
   agent picker and slash commands; Enter and Shift+Enter exactly as today;
   drafts, paste, attachments, undo, redo; smooth typing on long text and large
   pastes; formatting never moves the cursor, loses text or interrupts accent
   or IME typing. In settings, field length limits and the expand button keep
   working.
7. **Order** ("Order"). Room Settings first, then the chat bar. The chat bar
   ships only if everything above works. The stories are sequenced that way:
   the settings story first, the chat bar story depends on it.
8. **Done means** ("Done means"), one focused browser check and nothing more:
   in the chat bar and in Goal, each Markdown element renders live, the
   saved or sent text matches what was typed, and undo and paste work; in the
   chat bar, Enter, Shift+Enter and an `@` mention work; settings text is
   unchanged after closing and reopening. No new unit or smoke suites.
9. **Constraints** ("Constraints"). Never restart or touch the live server on
   port 4142, never use 4141; test on an isolated port with a copied root. The
   UI is plain `ui/index.html`, `ui/app.js` and `ui/styles.css`. Designed at
   1440 wide, light only. Proportionate: no canvas and no multi-page design
   track; the look is the existing chat Markdown style. Workbench is not
   rebuilt or quit by engineering; a landed change needs a Workbench rebuild
   to go live and that is the requester's step.
10. **Precondition for engineering** ("Constraints"). Ticket PRL-6, the
    `test/smoke.mjs` repair, must be merged and green on `main` first. It is
    still in delivery review. Product definition proceeds now.

## Options considered

| Option | Why not |
| --- | --- |
| A rich-text editor such as TipTap | Ruled out by the requester ("How to build"): it holds a document model and risks rewriting the Markdown, against the key rule. |
| A hand-built `contenteditable` | Ruled out by the requester: cursor, IME and paste handling are the failure modes the chat bar must not have. |
| A formatting toolbar | Ruled out by the requester ("Behavior": no formatting toolbar). |
| An Edit/Preview toggle or a separate preview pane | Ruled out by the requester ("Decision to build": no toggle, no separate preview). Agent instructions have such a toggle today. |
| Changing the text agents receive, or normalizing saved Markdown | Ruled out by the key rule: saved text is exactly what was typed. |

## Consequences

Costs: a vendored third-party bundle in `ui/vendor/` that a maintainer
regenerates when versions change; constraint #2 carries one stated exception;
the chat bar waits on the settings story and on PRL-6. Benefits: the user sees
formatted Markdown while writing everywhere he writes it, and saved text,
tokens sent and the backend are untouched.

> Once `status: accepted`, this body is never rewritten. A change of mind is a
> new decision with `supersedes: PD-nnnn`.
