# Raw request — verbatim, as given to the product manager session (2026-11-08)

Source: `/Users/ortega/Library/Application Support/Claude/side-session-notes/local_6612077f-8cd8-4ce0-ab4f-0870d2383ad1/live-markdown-editor-pm-brief.md`, written by the requester's (Ricardo's) side session from his decision in the room "Parlay Product Evolution". Copied verbatim below; not edited.

---

# Live Markdown editor — product brief for the PM

Project: Parley, `/Users/ortega/Desktop/Projects/parley` (product/ tree exists; next initiative is the next INIT- from `product/manifest.yaml`; ticket prefix PRL).
Requester: Ricardo. Decision ALREADY MADE in room "Parlay Product Evolution". Do not re-ask it. No approval stops: plan, edit, commit, merge and push `main` (never force) without asking. Only a genuinely new blocking product question may be escalated, as one plain-English question.

## Decision to build
One shared live Markdown editor for the chat bar and every multi-line field in Room Settings. No toggle, no separate preview. Text formats in place as you type, like an editor with live preview.

Goal, Rules and chat are Markdown but are typed as plain text today; that is the problem.

## Behavior
- `**bold**` turns bold when closed and the marks disappear; marks come back on the line being edited.
- Supports what chat messages render today, in the same style: bold, italic, inline code, code blocks, headings, lists, links. `renderMD` in `ui/app.js` is the reference for common cases; rare edge cases may differ while typing.
- Tables and raw HTML stay plain text; raw HTML never runs.
- Normal click on a link places the cursor; Cmd+click opens it.
- Pasted Markdown formats right away; copying returns the Markdown. No formatting toolbar.

## Where
Chat bar; Goal and Rules in the Room Brief; New Room and Clone dialogs; agent instructions in both places they appear. Single-line fields and the 200-character Decision field stay plain.

## Key rule
The saved text is exactly what was typed. The editor only changes appearance and never rewrites Markdown. Backend, tokens sent, the "What agents see" preview and character counts don't change. Existing saved text stays intact, including indentation.

## How to build (decided, not open)
CodeMirror 6 with decorations, wrapped in one small shared component that reads and writes text like a textarea. No hand-built `contenteditable`, no rich-text editor like TipTap. `ui/` has no bundler, so commit one prebuilt file under `ui/vendor/` with its license, pinned versions and the command that generates it; the app stays offline-capable with no build step to run. Follow the Factory dependency policy for the versions chosen. If CodeMirror doesn't work with the existing UI, stop and report before picking something else.

## Chat bar must keep working
`@` agent picker and slash commands; Enter and Shift+Enter exactly as today; drafts, paste, attachments, undo, redo; smooth typing on long text and large pastes; formatting never moves the cursor, loses text or interrupts accent/IME typing. In settings, field length limits and the expand button keep working.

## Order
Room Settings first, then the chat bar. The chat bar ships only if everything above works. Sequence the stories that way (settings story first; chat bar story depends on it).

## Done means (one focused browser check, nothing more)
In the chat bar and in Goal: each Markdown element renders live, saved/sent text matches what was typed, undo and paste work. In the chat bar: Enter, Shift+Enter and an `@` mention work. Settings text is unchanged after closing and reopening. No new unit or smoke suites.

## Constraints
- Read `CHECKPOINT.md` first. Never restart or touch the live server on port 4142; never use 4141. Test on an isolated port with a copied root (`room-brief-verification.md` in this folder has a working recipe).
- UI is plain `ui/index.html`, `ui/app.js`, `ui/styles.css`, no bundler. Design at 1440, light only. Proportionate: no canvas or multi-page design track; the look is the existing chat Markdown style.
- Do not rebuild or quit Workbench. Landed changes need a Workbench rebuild to go live; that is the requester's step.
- Precondition for engineering: ticket PRL-6 (the `test/smoke.mjs` repair) must be merged and green on `main` first. It is still in delivery review. Product definition may proceed now.

## Where the PM stops
End at HANDOFF with real PRL- ticket_codes on Ariadne and product memory committed on `main`. Do NOT dispatch the engineering orchestrator or start implementation: the session that dispatched you checks PRL-6 and then drives engineering.
