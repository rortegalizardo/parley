---
mode: PRODUCT-DISCOVERY
initiative: INIT-0003
type: technical-assessment
title: System impact map — Option A, one shared live Markdown editor on CodeMirror 6
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
Mapped: 2026-11-08
Basis: [capability-scan.md](capability-scan.md). Line numbers are `main` at `fa35e69`.

Obligations only: what each part of the system must be able to do, not what to
build. Verdict and constraints are in [assessment.md](assessment.md).

## Per option

### Option A — one small shared textarea-like component on CodeMirror 6, one prebuilt file under `ui/vendor/` (PD-0011)

The only option. Decided by the requester; not reopened here.

| System / component | Current responsibility (source) | What this option requires of it |
| --- | --- | --- |
| Client asset list | Serves exactly `styles.css` and `app.js`, versioned (`lib/client-assets.mjs:10`, `parley.mjs:7837-7845`) | Must also serve the vendor file with a script type and the same version check. This is the only server-side change, and it touches no request, response or stored data. |
| Page shell | One classic script at the end of body (`ui/index.html:284`) | Must load the vendor file before the code that uses it, with a versioned URL, and no network request beyond the local server. |
| Chat bar | `#input` textarea and everything in Check 2a (`ui/app.js:3736` and the lines listed there) | Every read, write, caret use, listener, focus call, disabled check and placeholder write must still work against the editor. Enter, picker keys and the paste handler must get the key or paste before the editor's own behaviour. Height growth up to 200px and internal scroll must remain. |
| Mention and slash picker | Regex on the text before the caret, popover anchored to the composer (`ui/app.js:4264-4311`, `styles.css:752`) | Needs only text before the caret and a settable caret. It uses no caret pixel position, so it does not need one from the editor. |
| Room Brief card | Goal and Rules inside `card.innerHTML`, delegated `input` listener on `target.id`, draft holds the value (`ui/app.js:5132-5158, 5226-5236, 5288`) | Input events from the editor must reach the delegated listener with the same target identity. Each of the nine re-render sites (Check 2c) must release the old editor and start a new one with the current draft value. Cursor and undo loss at those sites is the same as today. |
| Settings agent cards | Instructions inside `$("seatCards").innerHTML`, `[data-f]` read by loop (`ui/app.js:4733-4742, 4719-4725, 4898-4905`) | The element the `[data-f]` loop finds must answer `.value` and `.dataset.f`. Same release and restart on the re-render sites. The Edit/Preview toggle goes (REQ-0005); Expand editor stays, and is CSS on the parent. |
| Create room roster | Instructions inside `list.innerHTML`, `oninput` to `newRoster[i]` (`ui/app.js:3669-3711`) | As above, on its own re-render sites. |
| New Room and Clone dialogs | Static fields; `.value`, `.oninput`, `maxLength`, `form.reset()` (`ui/app.js:4340, 4349, 4361-4363, 4370, 4392, 4403-4410, 4426, 4453, 4477`) | Must answer value and `oninput` and be cleared when the form is reset, which does not reach a non-form control on its own. Goal's `maxLength` must be settable after mount. Mounting happens while the dialog is closed, so the editor must measure correctly when it first becomes visible. |
| Field limits | Native `maxlength` (Check 2b); note and counter logic reads the draft (`ui/app.js:5101-5112`) | The editor must be able to stop new text at a limit, cut a paste at the limit, and accept a loaded value over the limit. The limit must be changeable after load. |
| Styling | CSS on `textarea`, `:focus`, `::placeholder`, `.expanded textarea`, `resize` (`styles.css:83, 151-166, 596-602, 806-813, 1007-1008, 1024-1026, 1086, 1215, 1234, 1448-1449, 1478, 1591-1602, 1804-1814, 1834`) | Each visible rule must apply to the editor too: size, border, focus ring, placeholder, expanded height, drag-resize. The Markdown look must reuse the chat values (`styles.css:319-350`). |
| Accessibility | `<label for>`, `aria-label`, `aria-required`, `aria-describedby` (Check 2b) | A `<label for>` does not reach a `contenteditable`. The editor must still get its accessible name, the required and description state, and focus when its label is clicked. |
| Focus trap and dialog keys | Trap selector, `Escape` handling (`ui/app.js:2644-2654, 4878`) | The editor must count as a focusable stop if it can be the first or last in Settings; `Escape` must still close the dialog; Tab must still leave the field. |
| Browser tests | 35 lines across 9 files read the field natively; smoke sandbox has no vendor file (Check 5) | Those lines must be updated to read the new field. `test/smoke.mjs` must keep running when the vendor code is absent from its sandbox, or be updated to match. No new suite (PD-0011 item 8). |

| Dependency | Direction | Kind | Note |
| --- | --- | --- | --- |
| CodeMirror 6 and Lezer packages, compiled into one file | UI depends on them | third-party, vendored | MIT. Versions at least 20 days old exist for all of them (scan Check 7); no requester exception is needed. |
| A bundling tool | Maintainer depends on it to regenerate the file | third-party, not at run time | Not in the app or its run path. PD-0011 item 5. |
| PRL-6, `test/smoke.mjs` repair | Engineering start depends on it | internal | PD-0011 item 10. |
| REQ-0006 (chat bar) depends on REQ-0005 (settings) | Order | internal | PD-0011 item 7; the chat bar reuses the same component. |
| Requester rebuilds or restarts to go live | Release depends on him | human | PD-0011 item 9; constraint #1. |

| Data crossing a boundary | Class | Regime note |
| --- | --- | --- |
| Typed text moving from the editor to the existing Save or Send request | Goal, Rules, instructions, messages: none (user-authored working text) | No new data, field, store or destination. |
| Clipboard copy from the editor | Same text as typed | Same as a textarea today. |
| Link opened by Cmd+click | One `http`/`https` URL the user typed, to the OS browser | Same route chat links take (`desktop/main.cjs:68, 72`). No request by Parley. |
| Vendor file from server to browser | Program code | Local only. No third-party host at run time. |

**Personal, financial, regulated:** none new.

**Security obligations:**

| Obligation | Basis |
| --- | --- |
| Raw HTML the user types never runs and no element is created from it. The editor treats text as text; it must not parse typed HTML into nodes. Any added UI piece, such as a rendered bullet, is built from fixed values only. | PD-0011 item 2; `renderMD` escapes first (`ui/app.js:462`) |
| Links open only on Cmd+click (Ctrl on other systems, see assessment), only `http`/`https`, in a new tab, with no opener and no referrer. | PD-0011 item 2; `renderMD` allows only `https?:` (`ui/app.js:466`) |
| No new runtime network request; the app stays offline. No CDN, remote font or worker from another origin. | PD-0011 item 5; CSP `default-src 'self'` (`parley.mjs:7829`) |
| Runtime style injection is permitted by the current CSP; the CSP does not need to change. No `eval`. | `parley.mjs:7829` |

## Not impacted

| System | Why a reader might expect it | Why it is not impacted |
| --- | --- | --- |
| Brief, room and instructions validation in the server | The editor handles the same fields | The requests stay the same (`parley.mjs:2215-2224, 513-519`). |
| Tokens sent, What agents see preview | Formatting might alter text | Saved text is unchanged; these read the saved text. PD-0011 item 4. |
| Sent-message display, `renderMD` | The same Markdown is displayed | Untouched. It stays the reference. |
| Converge, Parallel, routing, hop limit | The chat bar computes the route hint | They read text through the same routes. |
| Attachments | Paste and drop share the bar | The window drop handler is independent of the field (`ui/app.js:4086-4097`). The paste handler needs only to keep receiving the event. |
| Decision fields | They are `textarea`s | Requester excluded them. They stay plain. |
| Desktop main process | Links open externally | Existing window-open handler covers the new-tab case (`desktop/main.cjs:72`). |
| Room store, transcript, events | Data shape | No change. |
