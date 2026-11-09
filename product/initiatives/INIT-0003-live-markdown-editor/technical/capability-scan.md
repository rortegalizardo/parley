---
mode: PRODUCT-DISCOVERY
initiative: INIT-0003
type: technical-assessment
title: Platform capability scan — Markdown text formats as you type in the chat bar and Room Settings
status: authoritative
revision: 1
owner_role: ROLE-planner
phase_at_assessment: SOLUTION_EXPLORATION
round: 1
assessed_on: 2026-11-08
created: 2026-11-08
updated: 2026-11-08
verdicts: []
constraints: []
questions: []
updated_by_role: ROLE-planner
---

Mode: PRODUCT-DISCOVERY
Initiative: INIT-0003
Scanned: 2026-11-08
Systems scanned: Parley server `parley.mjs`, `lib/client-assets.mjs`; browser UI `ui/index.html`, `ui/app.js`, `ui/styles.css`; `desktop/main.cjs`, `scripts/package-desktop.mjs`; `test/smoke.mjs` and `test/browser*.mjs`, `test/benchmark.mjs`, `test/package.mjs`; npm registry (read-only)

Current state only. This file holds no verdict, no option and no proposal; those
are in [assessment.md](assessment.md). Line numbers are `main` at `fa35e69`.

## Relevant platform capabilities

| Area | Verdict | Where it lives (source) | Gap, if partial |
| --- | --- | --- | --- |
| Live in-place Markdown formatting of editable text | absent | No `contenteditable` or editor library in `ui/`. All text fields are `<textarea>` or `<input>` (Check 1). | The one thing the ask builds. |
| Markdown rendering of finished messages | exists | `renderMD`, `ui/app.js:456-537`; style `ui/styles.css:319-350` | Renders after sending, as HTML built from escaped text. Not a live editing surface. |
| Serving browser files | partial | `lib/client-assets.mjs:10-14`, `parley.mjs:36-37`, `parley.mjs:7837-7845` | A fixed list of exactly two files. A file in `ui/vendor/` is **not served** today (404). Check 4. |
| Page security headers allow a runtime-injected style and a same-origin script | exists | `parley.mjs:7829` | CSP has `style-src 'self' 'unsafe-inline'`, `script-src 'self' 'unsafe-inline'`. No `unsafe-eval`, no workers needed. Check 4. |
| Package and desktop inclusion of `ui/` | exists | `package.json` `files` (`ui/`, line 60); `scripts/package-desktop.mjs:15` copies `ui` | A new file under `ui/vendor/` ships with both without change. |
| Bundler or package step for `ui/` | absent | `package.json` dev dependencies are only Playwright, Electron, Packager (lines 66-70) | Nothing in the repo produces a bundle today. Check 7. |
| Text draft saved per room | absent | No storage of composer text (`sessionStorage`/`localStorage` at `ui/app.js:13,19,60-69,1654-1657` hold hop and mode choices and notify only). `input.value` is written only at `3963, 4008, 4014, 4060, 4252, 4299` | Only attachment drafts exist, in memory, and they are cleared on room load (`3460`) and reset (`3395`). Text stays in the one shared box across a room switch and is lost on reload. |
| IME composition guard on Enter | absent | `grep` for `isComposing`/`compositionstart`/`keyCode` in `ui/app.js` finds nothing; `ui/app.js:4167-4170` | Today Enter sends regardless of composition state. |
| Length limits on Markdown text | partial | Native `maxlength` only, no JS cut; `ui/app.js:5101-5109`, `3694`, `ui/index.html:181-182`; JS sets `maxLength` on the clone Goal at `4363`; server caps `parley.mjs:2219-2224`, `352`, `513-519` | Room settings agent instructions (`ui/app.js:4600`) have **no** client limit. |

## Check 1 — every multi-line text field

Every `<textarea>` in the UI. There is no `contenteditable` anywhere.

| # | Field | Source | Rows / limit today | Covered by the requester's "where"? |
| --- | --- | --- | --- | --- |
| 1 | Chat bar `#input` | `ui/index.html:147` | rows 1, no maxlength, height capped at 200px | **Yes** ("Chat bar") |
| 2 | New Room Goal `#newRoomGoal` | `ui/index.html:181` | rows 2, maxlength 2000 | **Yes** ("New Room and Clone dialogs") |
| 3 | New Room Rules `#newRoomRules` | `ui/index.html:182` | rows 5, maxlength 8000 | **Yes** |
| 4 | Clone Goal `#cloneRoomGoal` | `ui/index.html:201` | rows 4, no static limit; `maxLength` set from the source's Goal at `ui/app.js:4363` | **Yes** |
| 5 | Room settings → Brief Goal `#briefGoal` | `ui/app.js:5144` | rows 3, maxlength `max(2000, saved)` | **Yes** ("Goal and Rules in the Room Brief") |
| 6 | Room settings → Brief Rules `#briefRules` | `ui/app.js:5145` | rows 9, maxlength `max(8000, saved)` | **Yes** |
| 7 | Room settings → Agents, per agent, Standing instructions `textarea[data-f="instructions"]` | `ui/app.js:4600` | rows 7, **no maxlength** | **Yes** ("agent instructions in both places") |
| 8 | Create room → Agents, per agent, Identity & instructions `.roster-instructions` | `ui/app.js:3694` | rows 5, maxlength 8000 | **Yes** |
| 9 | Brief → Decisions, one per active decision `textarea[data-decision-index]` | `ui/app.js:5146` | rows 1, maxlength `max(200, saved)`, auto-resized (`5167-5175`) | **No**, 200-character Decision field |
| 10 | Pin dialog Decision `#decisionText` | `ui/index.html:277` | rows 3, maxlength 200, required | **No**, 200-character Decision field |

Single-line inputs, all plain: `#newRoomInput` (`index.html:179`), `#cloneRoomInput` (200), `#newRoomProjectPath`, `#cloneRoomProjectPath`, `#s_projdir`, `#briefNewDecision` (`app.js:5147`), `#askText` (`app.js:2541`), `#agentsSearch`, `.roster-name`, `.settings-agent-name`, and the agent `data-f` single-line inputs (model, effort, command, extra args, `lurkPrompt` at `app.js:4758`). `prompt()` rename is a browser dialog.

**Not clearly one or the other: none.** The requester's phrase "every multi-line field in Room Settings" resolves to rows 5, 6 and 7. The Room tab has no multi-line field today (the CSS rule `#roomSettingsPane textarea` at `styles.css:1086` is unused). Read-only panes keep their own rendering: `#briefPreview`, What agents see (`app.js:5151, 5176-5184`), and the archived decisions list (`app.js:5148`).

## Check 2 — what depends on a native text box

### 2a. The chat bar `#input` (`const input = $("input")`, `ui/app.js:3736`)

| Dependency | Today | Source |
| --- | --- | --- |
| Value read | `input.value` / `$("input").value` | `3025, 3127, 3226, 3987, 4060, 4266, 4298` |
| Value written from code | `input.value = …` (cleared after send, rebuilt on failure, `/summarize`, starter click, mention insert) | `3963, 4008, 4014, 4060, 4252, 4299` |
| Caret and selection | `selectionStart` read; `selectionStart`/`selectionEnd` written after a mention | `4265, 4297, 4300` |
| `@` and `/` picker trigger | On every `input` event, a regex on the text before the caret; shared popover lists agents after `@` and slash commands when the text so far is `/…` | `3898, 4264-4295` |
| Picker keys | Arrow keys, Enter and Tab choose, Escape closes; runs first and swallows the key | `4303-4311` (called from `4168`) |
| Enter / Shift+Enter | `keydown` on the element: not picker, `Enter` and not `shiftKey` → `preventDefault`, `send()`. Shift+Enter is native newline | `4167-4170` |
| IME composition | **Not detected at all**: no `isComposing` check, no composition listeners | grep over `ui/app.js` |
| Slash-command parse | From trimmed text, `raw.startsWith("/")`; local commands run in `handleSlash`; `/pair` falls through to the server | `3028, 3987-4011, 3908-3984` |
| Draft | Text: no save or restore (see above). Attachments: `state.draftImages`/`draftFiles`, cleared on room load and reset | `35-36, 3395, 3460, 3825` |
| Paste | `paste` listener takes image files from the clipboard and `preventDefault`; all other paste is the browser's | `4171-4180` |
| Attachments | Paperclip `#fileInput`; window-level `dragover`/`drop` take files anywhere; text drops are left alone | `145, 4071-4097` |
| Height | `autosize()`: `height = min(scrollHeight, 200)`; CSS `max-height: 200px`, `resize: none`, `overflow-x: hidden` | `3897`, `styles.css:597-601, 1234, 1478` |
| Disabled | Only the runtime-mismatch banner, via `querySelectorAll("button,input,textarea,select")` | `123` |
| Placeholder | HTML attribute, re-set in `renderSeatsUI` | `index.html:147`, `app.js:2061`; ellipsis CSS `styles.css:1449` |
| Focus | `input.focus()` at boot and after chip, menu, hop and mention actions | `3218, 4187, 4205, 4252, 4301, 5073` |
| Focus styling | `.composer-card:has(#input:focus)`, `.box:focus-within` | `styles.css:596, 1448, 1477` |
| Reacts on each keystroke | `input` listener runs `autosize`, `updateRouteHint`, `mentionCheck` | `3898` |
| Queried by id or selector | `$("input")` in `app.js`; `#input` in CSS; `#input` in 9 test files (Check 5) | |

### 2b. Room settings, dialogs and agent instructions

| Field | How its value is read | How the limit is enforced | Re-render / lifetime |
| --- | --- | --- | --- |
| Brief Goal, Rules | Document-level `input` listener keyed on `event.target.id` copies to `draft.goal`/`draft.rules` (`5226-5236`); Save sends the draft (`5288`), not the element | Native `maxlength`; server allowance `max(limit, saved length)` (`parley.mjs:2219-2222`); note under the field `5105-5108`; counter `briefCount` from the draft (`5110-5112`) | `card.innerHTML` in `renderBriefCard` (see table below) |
| Standing instructions (Settings) | `[data-f]` loop reads `el.value` on Save (`4898-4905`) and in `captureSettingsDraft` (`4719-4725`) | None on the client. Server rejects above 8000 (`parley.mjs:352, 513-519, 8346`) | `$("seatCards").innerHTML` in `renderSeatCards` |
| Create room instructions | `.oninput` copies to `newRoster[i].instructions` (`3711`), read on submit | Native maxlength 8000; server same | `list.innerHTML` in `renderRoster` |
| New Room Goal, Rules | `$("newRoomGoal").value` on submit (`4453`); Goal also drives the Create button by `oninput` (`4403-4405`) | Native `maxlength` | Static HTML, mounted once; cleared by setting `.value` at `4410, 4426, 4477` |
| Clone Goal | `$("cloneRoomGoal").value` on submit (`4392`); `oninput` marks it touched (`4370`) | `maxLength` set when the setup loads (`4363`); server allows a Goal over 2000 only when it equals the source (`parley.mjs:7872-7873`) | Static HTML, mounted once; `cloneRoomForm.reset()` clears it (`4340, 4349`) |

Other dependencies: `<label for="briefGoal">`, `<label for="newRoomGoal">`, `<label for="newRoomRules">`, `<label for="cloneRoomGoal">` (native label wiring); `aria-required` on New Room Goal; `aria-describedby` on Clone Goal; `aria-label` on instructions. Instructions Edit/Preview toggle and Expand editor: `instructionsModeHTML` `4596-4598`, handler `4634-4646`, CSS `styles.css:1025-1026, 1280-1289, 1622-1624`. Expand is CSS on `.instructions-field.expanded`, no re-render. User drag-resize exists on the settings fields (`resize: vertical`, `styles.css:166, 810, 1008, 1810`). Focus trap selector `button, input, select, textarea, a[href], [tabindex]` (`2647`) does not list `contenteditable`.

### 2c. Where a mounted editor would be destroyed (innerHTML re-render)

| Region | Re-rendered when | Source |
| --- | --- | --- |
| Brief card (Goal, Rules) | Add/Archive/Restore/Delete decision (`5331`), Discard (`5282`), Save (`5286, 5295, 5302`), Tidy (`5308, 5327`), pin accepted (`5397`), first open or a changed brief when the draft is not dirty (`5193-5202`, called from `applySummary` at `2319`) | `ui/app.js` |
| Settings agent cards (instructions) | Open settings (`4827`), switch agent (`4742`), add (`4859`) or remove (`4788`) agent, provider change (`4795`). **Not** on `applySummary` | `ui/app.js` |
| Create room roster (instructions) | Select agent (`3660`), provider change (`3701`), remove (`3712`), add (`3722`), apply a template (`3640, 4329`) | `ui/app.js` |
| Chat bar | Static; `loadRoom` does not touch it | `index.html:147` |
| New Room / Clone fields | Static; cleared by value or form reset | `index.html:181-182, 201` |

A brief draft that is dirty is not replaced by a remote change (`5198-5202`), so an SSE update does not re-render it while the user types.

Undo in today's textareas: the history is the browser's. It is lost on every re-render above, and when code writes `.value` (send, mention insert).

## Check 3 — `renderMD`, the style reference (`ui/app.js:456-537`; CSS `ui/styles.css:319-350`)

| Element | What renderMD does | CSS |
| --- | --- | --- |
| Bold | `**text**`, single line, no `*` inside (`464`) | `<strong>` (browser default) |
| Italic | `*text*` only after start, whitespace or `(`, and before whitespace, punctuation or end (`465`). `_text_` and `__text__` are **not** formatted | `<em>` |
| Inline code | `` `code` `` (`463`) | `.bubble code`, `styles.css:328` |
| Fenced code | ` ```lang ` … ` ``` `, must be closed, else plain (`458`). Language colouring for known languages (`highlightCode`, `400`), header bar with language and copy button (`532-534`) | `.codeblock`, `.cb-head`, `.cb-copy`, `.tok-*`, `styles.css:338-350` |
| Headings | `#` to `####` at column 0 (`514`); five or more `#` are plain | `.bubble h1-h4`, `styles.css:320-321` |
| Lists | Bullets `- * +` and numbers `1.` `1)`, any leading spaces, flat (no nesting) (`516-517`). Continuation lines and loose lists join the item (`521-523`). `<ol>` numbers consecutively from the first number (`473`) | `.bubble ul, ol, li`, `styles.css:322-323` |
| Links | `[text](http…)` and `https` only (`466`), `target="_blank" rel="noopener"`. Bare URLs are not linked | `.bubble a`, `styles.css:326-327` |
| Blockquote, `---` rule | Rendered (`518, 515`). **Not on the requester's list** | `.bubble blockquote, hr`, `324-325` |
| Tables | Rendered (`492-513`). Requester: stay plain text in the editor | |
| Raw HTML | Escaped before any Markdown step (`462`, `esc` at `75`); never runs | |

## Check 4 — how `ui/` is served

| Fact | Source |
| --- | --- |
| Only `styles.css` and `app.js` are in the asset list, a hard-coded array | `lib/client-assets.mjs:10` |
| Added only if the HTML template references `/ui/<name>` | `lib/client-assets.mjs:11` |
| Snapshot read once at startup; a version hash covers template and every asset | `lib/client-assets.mjs:5-18`, `parley.mjs:36-37` |
| Route serves only names in that map, requires `?v=<version>` (409 otherwise), sets `Content-Type` from the list, `nosniff`, `no-store` | `parley.mjs:7837-7845` |
| So a file in `ui/vendor/` is 404 until it is added to that list; a served file gets a correct script type | same |
| The page has one `<script src="/ui/app.js?v=…">`, classic, at the end of body | `ui/index.html:284` |
| CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` | `parley.mjs:7829` |
| No other CSP (none in `ui/index.html` or `desktop/main.cjs`) | grep |
| Desktop window loads the same server URL | `desktop/main.cjs:9, 46` |
| Links in Workbench: `window.open`/navigation route to the OS browser for `http(s)` only | `desktop/main.cjs:68, 72-73` |

## Check 5 — tests and harnesses that read the old text box

Requester forbids new suites; this is the list of what exists and would need updating. Counts are matching lines on `main`.

| File | Lines | What it does with the field |
| --- | --- | --- |
| `test/browser-fixture.mjs` | 4 (`67, 86, 89, 93`) | Shared `send` and room-creation helpers; `fill`, `press("Enter")`, `toHaveValue` |
| `test/browser-roster.mjs` | 16 | `fill`, `toHaveValue`, `scrollWidth`/`clientWidth` overflow on `#input` and instructions, `toHaveCSS` |
| `test/browser-panels.mjs` | 4 (`27-33`) | `fill("@co")`, `press("ArrowDown")`, `press("Enter")`, `toHaveValue("@codex ")` |
| `test/browser-convergence.mjs` | 4 | `fill` |
| `test/browser-policy.mjs` | 3 | `fill` |
| `test/browser-dialogs.mjs` | 1 (`81`) | `fill` on `#briefRules` |
| `test/browser-visual.mjs` | 1 (`76`) | `toBeDisabled` on `#input` under runtime mismatch |
| `test/browser.mjs` | 1 (`25`) | `fill` |
| `test/benchmark.mjs` | 1 (`135`) | `fill` |
| `test/smoke.mjs` | sandbox | Runs `ui/app.js` up to the boot marker in a stub DOM (`671-673`, `792-793`); `$("input")` is a stub with `.value` and `.listeners` (`809, 822`); stubs for `send` (`1509-1536`); a text-drop check keeps "native textarea behaviour" (`1257`) |
| `test/package.mjs` | `16, 49` | Asserts the packed files and fetches the two versioned assets |

No test mentions the Edit/Preview toggle or Expand editor. PRL-6 (repair of `test/smoke.mjs`) is outside this scan; line numbers are `main`.

## Check 7 — vendor file: registry evidence (read-only, `npm view`, 2026-11-08)

The 20-day cutoff from today is 2026-10-19. The registry is reachable.

| Package expected in the bundle (or its build) | License | Latest (date) | Newest at least 20 days old (date) |
| --- | --- | --- | --- |
| `@codemirror/state` | MIT | 6.7.6 (2026-09-22) | 6.7.6 (2026-09-22) |
| `@codemirror/view` | MIT | 6.43.15 (2026-10-19) | 6.43.15 (2026-10-19, exactly at the cutoff) |
| `@codemirror/commands` | MIT | 6.11.1 (2026-09-15) | 6.11.1 (2026-09-15) |
| `@codemirror/language` | MIT | 6.13.1 (2026-10-07) | 6.13.1 (2026-10-07) |
| `@codemirror/streamparser` (dependency of `language`) | MIT | 6.0.0 (2026-10-07) | 6.0.0 (2026-10-07) |
| `@lezer/common` | MIT | 1.5.5 (2026-10-30) | 1.5.3 (2026-09-24) |
| `@lezer/lr` | MIT | 1.4.12 (2026-10-30) | 1.4.11 (2026-10-07) |
| `@lezer/highlight` | MIT | 1.2.5 (2026-09-28) | 1.2.5 (2026-09-28) |
| `@lezer/markdown` | MIT | 1.8.1 (2026-10-19) | 1.8.1 (2026-10-19, exactly at the cutoff) |
| `style-mod` | MIT | 4.1.4 (2026-09-18) | 4.1.4 (2026-09-18) |
| `w3c-keyname` | MIT | 2.2.8 (2023-06-07) | 2.2.8 (2023-06-07) |
| `crelt` | MIT | 1.0.7 (2026-06-27) | 1.0.7 (2026-06-27) |
| `@marijn/find-cluster-break` | MIT | 1.0.4 (2026-08-21) | 1.0.4 (2026-08-21) |
| `@codemirror/lang-markdown` (optional wrapper) | MIT | 6.5.2 (2026-08-04) | 6.5.2 (2026-08-04) |
| Its dependencies `@codemirror/autocomplete`, `@codemirror/lang-html`, `lang-css`, `lang-javascript`, `@codemirror/lint`, `@lezer/html`, `css`, `javascript` | MIT | | all available at least 20 days old: 6.20.4 (2026-10-19), 6.4.12, 6.3.1, 6.2.5, 6.9.7, 1.3.13, 1.3.9, 1.5.6 |
| Build tool `esbuild` (not in the bundle, maintainer-run) | MIT | 0.28.2 (2026-08-08) | 0.28.2 (2026-08-08) |

Every newest-eligible version above satisfies the ranges the other listed packages declare (`@codemirror/view` `^6.42` for `lint`, `@codemirror/state ^6.7.0` for `view`, `@lezer/common ^1.5.0` for `language` and `@lezer/markdown`). This table is evidence for the PM, not a pin list.

## CAP- reconciliation

| CAP- id | Registry says | System says | Agrees? | Note |
| --- | --- | --- | --- | --- |
| CAP-0001 | Room direction, room note, "Direction tab" | Room Brief: `Goal`, `Rules`, `Decisions` under Room settings → Brief (`ui/app.js:5132-5147`, `parley.mjs:2215-2224`) | **Stale** | Pre-dates INIT-0001's Brief; the wording of Goal and Rules used by this initiative comes from the code. PM to refresh when INIT-0001 closes it. |
| CAP-0002 | Create a room dialog; Settings Agents, Room, Brief; instructions | Same (`ui/app.js:3694, 4600, 5144-5145`) | Yes | Does not say that the instructions field has an Edit/Preview toggle (`instructionsModeHTML`). |
| CAP-0003 | See corrections in [assessment.md](assessment.md) "Corrections to CAP-0003" | Check 2a | Partly | Several behaviors are misstated or missing. |

## Extension points

| Seam | What it accepts today | Source |
| --- | --- | --- |
| Client asset list | Two fixed names, `styles.css` and `app.js`, with a type and a version hash | `lib/client-assets.mjs:10` |
| Static page markup | Any static element and script tag with a versioned URL | `ui/index.html:10, 284` |
| Field templates | HTML strings built in `renderSeatCards`, `renderRoster`, `renderBriefCard` | `ui/app.js:4600, 3694, 5144-5145` |
| Delegated `input` listener | Any bubbling `input` event whose target has the expected id or `data-*` attributes | `ui/app.js:5226-5236` |

## Data already held

| Data class | Where | Sensitivity |
| --- | --- | --- |
| Goal, Rules, Decisions | room `context.json` | none (user-authored working text) |
| Agent instructions | room `room.json` | none (user-authored working text) |
| Messages | `transcript.md`, `events.jsonl` | none new; existing content |
| Composer text before send | in the browser only, in the field | none; not stored |
