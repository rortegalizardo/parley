---
mode: PRODUCT-DISCOVERY
initiative: INIT-0003
type: technical-assessment
title: Feasibility assessment — one shared live Markdown editor on CodeMirror 6 (Option A, PD-0011)
status: authoritative
revision: 1
owner_role: ROLE-planner
phase_at_assessment: SOLUTION_EXPLORATION
round: 1
assessed_on: 2026-11-08
created: 2026-11-08
updated: 2026-11-08
verdicts: ["A: feasible-with-constraints (multi-component)"]
constraints: [C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13, C-14, C-15, C-16, C-17, C-18, C-19, C-20]
questions: []
updated_by_role: ROLE-planner
---

Mode: PRODUCT-DISCOVERY
Initiative: INIT-0003
Phase at assessment: SOLUTION_EXPLORATION
Assessed: 2026-11-08
Round: 1

Evidence: [capability-scan.md](capability-scan.md) and [impact.md](impact.md).
Line numbers are `main` at `fa35e69`.

## Verdicts

| Option | Requirements served | Verdict | Complexity band | One-line basis |
| --- | --- | --- | --- | --- |
| A — one shared textarea-like component on CodeMirror 6, one prebuilt file in `ui/vendor/` (PD-0011) | REQ-0005, REQ-0006 | **feasible-with-constraints** | multi-component | Works with the existing UI. Nothing in it blocks CodeMirror 6, but the editor is not a native field and must be made to answer everything the UI asks of a text box. No contract, data or schema change. |

## Does CodeMirror 6 work with the existing UI?

**Yes.** Nothing found prevents it: the page security policy already permits it, a
single classic script fits the page, no code depends on caret pixel position, and
versions that meet the 20-day policy exist for every package.

**Where it would not work unaided** (each is a constraint below, none is a stop):

| Place | Why | Constraint |
| --- | --- | --- |
| Loading the file | A file in `ui/vendor/` is 404 until the fixed asset list includes it | C-01 |
| Every native-field assumption | Id lookups, `.value`, `form.reset()`, `<label for>`, `:focus` CSS, `toHaveValue` do not apply by themselves to an editable `div` | C-09, C-15, C-16, C-17 |
| Every `innerHTML` re-render of Goal, Rules and instructions | Destroys a mounted editor and its undo, as it does a textarea's today, and leaks the old editor unless released | C-11 |
| Chat bar Enter during IME, and text drafts | The behaviour the stories call "as today" does not exist today | PC-02, PC-03 |
| Exact `renderMD` parity | Two different parsers; the requester already accepted that rare edge cases differ | C-07 |

**Limit of this evidence.** Everything about the existing UI was read from the
code. Statements about CodeMirror 6 behaviour come from its documented design
and known defaults; nothing was installed or run (dispatch rule). The focused
browser check on REQ-0005 settles them first, and PD-0011 item 5 applies if one
fails: stop and report. See R-01.

## Per behaviour: achievable on CodeMirror 6 with a minimal extension set

| Behaviour | Answer | Constraint on the answer |
| --- | --- | --- |
| Marks hidden when closed, shown on the line being edited | yes with a constraint | Works by saved line, not wrapped line. No hidden range on a line holding the cursor. A selection across lines and a multi-line code block need PR-1 and PR-2. A "hidden" list marker must still show a bullet or number. |
| Exactly what `renderMD` formats; tables and raw HTML plain | yes with a constraint | Standard Markdown parsing formats more than `renderMD` does: `_x_`, `__x__`, underlined headings, indented code, HTML. These must be switched off. An unclosed fence differs: `renderMD` leaves it plain, a standard parser runs it to the end. C-07. |
| Saved text exactly as typed | yes with a constraint | The library's default Enter copies the previous line's indentation, and its Markdown package continues lists by default. Both must be off, with no bracket closing or indent on input. The ready-made "basic setup" is unusable for this reason. Line endings normalise to `\n`, as a textarea's value does. C-06. |
| Limits like `maxlength` | yes with a constraint | The library has no `maxlength`. An editor-level rule must refuse text at the limit, cut a paste at the limit, let code load over-limit text, not act during an open composition, and not split an emoji. Length must count as `.value.length` does. C-12. |
| Undo and redo | yes with a constraint | Keyboard and Edit menu both work. Code writes (send clears the box) must not let undo bring sent text back. History is lost at re-renders, as today. C-11, C-13. |
| Plain click places cursor; Cmd+click opens | yes with a constraint | No real link element is created from typed text. Only `http` and `https`. A click reveals marks on that line, so text shifts under the pointer. C-19, R-02. |
| Copy returns Markdown | yes with a constraint | Copy returns the source text. But with nothing selected the library copies the whole line, and Cmd+X cuts the whole line; a textarea does neither. C-14. |
| Accent and IME not interrupted | yes with a constraint | The library protects text being composed. No hidden range may change on the composing line, limits must wait for the composition to end, and the chat bar's Enter must respect it. Needs a real check. C-08, C-10, R-01. |
| Typing and 20,000-character paste without lag or lost characters | yes with a constraint | The library draws only what is visible. The cost moves to the existing per-keystroke work on the whole text (`ui/app.js:3898`) and to the decoration pass, which must stay limited to the visible part. A single 20,000-character line is the weak case. R-08. |
| Accessible name and label | yes with a constraint | `<label for>` does not bind to an editable `div`. Name, required state, description and click-to-focus must be set up per field. The library defaults spellcheck off, textarea defaults on; must match today. C-15. |
| Wrapper reads and writes like a textarea | yes with a constraint | Value, input events, selection, focus, disabled and placeholder are all achievable. Full list in C-09. |
| Existing tests pass unmodified | **no** | `toHaveValue`, `toBeDisabled` and CSS checks on the old field do not apply. They must be updated. C-17. |

## Constraints

| # | Option | Constraint | permanent / initiative-local | Source | PD- candidate? |
| --- | --- | --- | --- | --- | --- |
| C-01 | A | The vendor file must be added to the server's fixed client asset list, or it is not served. This is a one-line server change with no contract effect. | permanent | `lib/client-assets.mjs:10`, `parley.mjs:7837` | yes (narrow exception to "no backend change", PC-01) |
| C-02 | A | The vendor file must run under the current page security policy unchanged: no `eval`, no worker from elsewhere, no remote font. | permanent | `parley.mjs:7829` | no |
| C-03 | A | Exactly one prebuilt classic script, loaded before the code that uses it, with no network at run time and no build step to run the app. | permanent | PD-0011 item 5; constraints #2 as amended | already PD-0011 item 5 |
| C-04 | A | Every package in the file, including indirect ones, at an exact version at least 20 days old. Newest `@lezer/common` and `@lezer/lr` are too young, older eligible ones exist. Three packages reach exactly 20 days on 2026-11-08 (`@codemirror/view`, `@lezer/markdown`, `@codemirror/autocomplete`). Unrelated language packages should stay out of the file. No requester exception is needed. | permanent (the policy) | Scan Check 7; `escalation-policy` §2 B item 2 | already PD-0011 item 5 |
| C-05 | A | The file must carry the license text of every package it contains (all MIT), with the versions and the one regenerating command. | permanent, while vendored | PD-0011 item 5; scan Check 7 | already PD-0011 item 5 |
| C-06 | A | Only behaviours that insert nothing may be used. No basic setup, no list continuation, no auto-indent, no bracket or quote closing, no smart typography, no auto-trim. The editing keys must be limited to what a text box has. | permanent | PD-0011 item 4; REQ-0005 Behavior 6 | already PD-0011 item 4 |
| C-07 | A | Chat rendering and editor formatting are two separate renderers that must be kept aligned by hand. The editor's parsing must be narrowed to `renderMD`'s set; rare edge cases may differ. | permanent | `ui/app.js:456-537`; PD-0011 item 2 | yes |
| C-08 | A | Hidden ranges must never cover a line holding the cursor or an open composition. | permanent | REQ-0005 Behavior 2, 7 | no |
| C-09 | A | The shared component must answer everything today's code asks of a text box: value read and write, `input` events to direct, `on-` and document-level listeners with the same target `id` or `data-*`, selection start and end, focus, disabled (including the code at `ui/app.js:123, 5160, 5309`), placeholder set later (`2061`), `maxLength` set later (`4363`), and clearing on `form.reset()` (`4340, 4349`). | initiative-local | Scan Check 2 | no |
| C-10 | A | In the chat bar the existing key and paste handlers must run before the editor's own, and Enter must not send during an open composition. | initiative-local | `ui/app.js:4167-4180` | no |
| C-11 | A | At each `innerHTML` re-render site the editor must be released and restarted with the current value. There is no central hook today: the sites are spread over three render functions and about 20 call sites. | initiative-local | Scan Check 2c | no |
| C-12 | A | Limits: no text past the limit, paste cut at the limit, code writes exempt, not during composition, never splitting an emoji, counted as `.value.length`, limit equal to the larger of base and saved length. | initiative-local | `ui/app.js:5101`, `parley.mjs:2219-2222`; PD-0006 item 2 | no |
| C-13 | A | Text written by code must not be undoable into sent or replaced content. | initiative-local | `ui/app.js:4014, 4060, 4299` | no |
| C-14 | A | With nothing selected, Copy and Cut must match a text box: nothing happens. | initiative-local | Textarea behaviour; PD-0011 item 6 | no |
| C-15 | A | Every field keeps its accessible name, required state and description, its label focuses it, and spellcheck, autocorrect and capitalise settings match today. Tab leaves the field as today and Escape still closes dialogs. | initiative-local | Scan Check 2b; `ui/app.js:2644-2654, 4878` | no |
| C-16 | A | Each visible CSS rule on `textarea`, `:focus`, `::placeholder`, `.expanded textarea` and `resize` must apply to the editor, including the drag handle where it exists today. The Markdown look must reuse chat's values. | initiative-local | `ui/styles.css`, listed in impact.md | no |
| C-17 | A | 35 test lines in 9 files must be updated; no new suite. The smoke sandbox has no vendor file and must not fail for that reason. PRL-6 must be merged and green before engineering starts. | initiative-local | Scan Check 5; PD-0011 items 8, 10 | no |
| C-18 | A | Verification runs on an isolated port with a copied root, never ports 4142 or 4141. | permanent | Constraints #1; PD-0011 item 9 | already constraints #1 |
| C-19 | A | Links open only on Cmd+click, only `http` and `https`, new tab, no opener, no referrer. No anchor is built from typed text. | permanent | `ui/app.js:466`; PD-0011 item 2 | already PD-0011 item 2 |
| C-20 | A | No new runtime network request and no new stored data. | permanent | PD-0011 item 5; impact.md | already PD-0011 item 5 |

A sequencing constraint exists: REQ-0005 before REQ-0006, and PRL-6 before both.

## Architectural risks

| # | Option | Risk | What it threatens | What would resolve it |
| --- | --- | --- | --- | --- |
| R-01 | A | The CodeMirror 6 statements here are unexecuted; IME on hidden-mark lines is the most fragile | The whole initiative, by PD-0011 item 5 stop-and-report | The focused browser check on REQ-0005, with real composition, before the chat bar starts |
| R-02 | A | Clicking a formatted line reveals marks and shifts the text under the pointer, so a click or drag can land elsewhere than aimed | "Typing never moves the cursor"; selection by mouse | A real check with click and drag on a formatted line |
| R-03 | A | Editors mounted while hidden (closed dialogs, inactive Settings panes) can measure wrong | Height, wrapping and first paint | Checking the field on first open of each dialog and tab; the app already guards the same case (`ui/app.js:5170`) |
| R-04 | A | Old editors are not released at one of the many re-render sites | Memory growth, and stray listeners in a long session | Covering every site in Check 2c |
| R-05 | A | The editor and `renderMD` drift apart as either changes | The look in the editor stops matching chat | C-07 accepted as ongoing cost |
| R-06 | A | PRL-6 and this work both touch `test/smoke.mjs`, and the sandbox runs `app.js` with no vendor file | Green smoke run; REQ-0006's acceptance | Sequencing in C-17 |
| R-07 | A | The vendor file drifts from what its command would produce | Trust in the committed file, license correctness | Exact versions and a single command, as PD-0011 item 5 requires |
| R-08 | A | A single very long unbroken line, and per-keystroke work on the full 20,000 characters | "Without delaying any typed character" | Including the worst case in the REQ-0006 check |

## Security / data / compliance implications

| Option | Data class | Implication | Source row in impact.md |
| --- | --- | --- | --- |
| A | Goal, Rules, instructions, messages (none) | No new data, store or destination | Data table, rows 1-2 |
| A | Typed raw HTML | Must stay text; no element created from it, nothing runs | Security, row 1 |
| A | Links | Opened only on Cmd+click, `http`/`https`, safe attributes | Security, row 2; Data row 3 |
| A | Vendor code | Runs under the existing policy; no third-party host at run time; no new network | Security, rows 3-4; Data row 4 |
| A | Personal, financial, regulated | None new | Data table |

## Product assumptions that conflict with the platform

| # | Assumption (and where it is stated) | Platform fact | Class | Raised as |
| --- | --- | --- | --- | --- |
| PC-01 | "Any change to the backend" is a non-goal (REQ-0005 Non-goals, Behavior 10) | The server must list the vendor file or it is not served (`lib/client-assets.mjs:10`) | narrowing | C-01; PM to reword as "no change to any request, response or stored data" |
| PC-02 | "The draft is kept and restored exactly as today"; "switch rooms and come back, and reload the page → the draft returns as it was saved today" (REQ-0006 Behavior 4, AC) | No text draft exists. Text stays in the one shared box across a room switch and is lost on reload. Only attachments are drafts, and they are cleared on room load (`ui/app.js:3395, 3460`) | blocking as written | PR-6 |
| PC-03 | "Enter while an accent or IME composition is open → the composition is confirmed and nothing is sent, as today" (REQ-0006 AC) | No composition check exists (`ui/app.js:4167-4170`). What Enter does today depends on what the browser reports | narrowing | PR-7 |
| PC-04 | "No trimming"; "the text sent equals the typed text character for character" (REQ-0005 Behavior 6, REQ-0006 AC) | Sent text is trimmed in the browser and server (`ui/app.js:3987`, `parley.mjs:8130`). Instructions are trimmed (`ui/app.js:4455`, `parley.mjs:513-519`) | narrowing | PR-8 |
| PC-05 | "Keeps its field length limit" (REQ-0005 Behavior 7, AC) | Settings instructions have no client limit; the server refuses above 8000 on Save (`ui/app.js:4600`, `parley.mjs:352`) | narrowing | PR-9 |
| PC-06 | "Can be shortened and cannot grow" (REQ-0005 AC, Behavior 8) | Today a shortened over-limit part may grow back up to its saved length, in browser and server (`ui/app.js:5101`, `parley.mjs:2220`) | narrowing | PR-10 |
| PC-07 | "Exactly" what chat renders (raw request; dispatch) | Two different parsers. `renderMD` is regular expressions over lines (`ui/app.js:456-537`) | narrowing | C-07; covered by PD-0011 item 2, "rare edge cases may differ" |
| PC-08 | Numbered lists show "in the style a chat message shows" (REQ-0005 AC) | Chat renumbers consecutively from the first number (`ui/app.js:473`); the editor shows what was typed | narrowing | Covered by PD-0011 item 2; no ruling needed |
| PC-09 | Existing suites "updated only where they read the old text box" (REQ-0006 AC) | That is 35 lines in 9 files, plus the smoke sandbox (scan Check 5) | costly | C-17 |

## Product rulings the PM must make

None is requester-owned under `escalation-policy`: each settles a detail inside
the requester's decided behaviour, or says how an AC should read given what the
code does. No `Q-` file was written; the dispatch allowed only these three files.

| # | Question | Options, by what the user sees | Recommendation | Owner |
| --- | --- | --- | --- | --- |
| PR-1 | When a selection spans several lines, which lines count as "being edited"? | (a) Every line the selection touches shows its marks: text shifts as you drag. (b) Only the line with the cursor end: other lines stay formatted while selected. | (a), so that what is selected is what is seen | pm-resolvable |
| PR-2 | In a multi-line code block, what counts as the line being edited, and what happens to the fence lines when not editing? | (a) Cursor anywhere in the block shows both fences; when away, fence lines stay as blank strips: no jump. (b) Same, but fence lines collapse: looks like chat, text jumps when entering the block. (c) Each fence shows only when the cursor is on it: stray marks mid-block. | (a) | pm-resolvable |
| PR-3 | When the field has no focus, are marks on the last-edited line hidden? | (a) Hidden, so a saved Brief reads clean. (b) Still shown on that line. | (a) | pm-resolvable |
| PR-4 | Blockquotes and `---` rules render in chat but are not on the requester's list. In the editor? | (a) Plain text, as listed. (b) Formatted, like chat. | (a) | pm-resolvable |
| PR-5 | Does a code block in the editor need chat's header, copy button and code colours? | (a) Mono font and background only: simple, and no extra language code in the file. (b) All of it, as chat: heavier file, and a button inside the text. | (a) | pm-resolvable |
| PR-6 | What should the chat-bar draft AC say, given no text draft exists? | (a) Today's behaviour: text stays in the bar across a room switch and is gone on reload. (b) Build per-room saved drafts: new behaviour the requester did not ask for. | (a), and amend the AC | pm-resolvable |
| PR-7 | Enter during an open accent or IME composition? | (a) Confirms the composition, sends nothing, on every browser: better than today, and a small change. (b) Whatever today's code does: varies by browser. | (a), and drop "as today" | pm-resolvable |
| PR-8 | Sent text and instructions are trimmed at both ends today. Does "exactly as typed" change that? | (a) Keep the trim: nothing in the backend changes, and the ACs apply after it. (b) Stop trimming: messages and instructions change, against "backend unchanged". | (a) | pm-resolvable |
| PR-9 | Settings agent instructions have no typing limit; the server refuses above 8000 on Save. Add one? | (a) Keep as today: you can type past 8000 and Save shows the error. (b) Stop at 8000, like Create room: a new behaviour, kinder, and affects any instructions already longer. | (a) | pm-resolvable |
| PR-10 | A part saved above its limit: after shortening it, may it grow back up to the saved length? | (a) Yes, as today in browser and server: undoing a deletion always works. (b) No growth at all: undo of a deletion could be refused. | (a), and reword the AC to "cannot grow beyond its saved length" | pm-resolvable |
| PR-11 | Cmd+click on Windows and Linux, where there is no Cmd? | (a) Ctrl+click there. (b) Only Cmd, so links cannot be opened there. | (a) | pm-resolvable |

## Open questions raised

None as `Q-` records; see the rulings above.

## Corrections to CAP-0003

From the code on `main` at `fa35e69`; the PM applies them.

1. **"Drafts of both stay in the bar until sent or removed" is wrong.** Attachment drafts are cleared on room load and reset (`ui/app.js:3395, 3460`). Text has no saved draft at all: it stays in the one shared box across a room switch and is lost on reload.
2. **Paste and files.** Paste makes an attachment only for images; files come from the paperclip and from window-level drag and drop (`ui/index.html:145`, `ui/app.js:4071-4097, 4171-4180`).
3. **Enter has no IME handling.** Nothing checks for an open composition (`ui/app.js:4167-4170`).
4. **The picker also lists slash commands** when the text so far is `/word` at the start, and Tab also chooses (`ui/app.js:4264-4311`).
5. **Sent text is trimmed** at both ends, in the browser and the server (`ui/app.js:3987`, `parley.mjs:8130`).
6. **Omitted or imprecise.** `/pair` goes to the server and `/summarize` rewrites the box and sends a chat message (`ui/app.js:3908-3984`). Starter chips fill the box (`4252`). Height grows to 200px and then scrolls (`3897`). The bar is disabled only on runtime mismatch (`123`). The route hint is recomputed on every keystroke (`3898`).
