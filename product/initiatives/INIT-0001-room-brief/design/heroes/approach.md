# INIT-0001 — hero frames: approach

Set by the requester (PD-0002, run instructions); recorded here, then followed.

- **Asked:** "Room Settings becomes one Room Brief" — Goal, Rules, Decisions —
  that every agent gets in full on every turn; "one settings surface change,
  not a multi-page redesign"; plain `ui/index.html`, `ui/app.js`,
  `ui/styles.css` (constraints #2); 1440 wide, light only (#3).
- **Candidates:**
  - Several directions with briefs and heroes each — more time, no gain: the
    placement is already decided.
  - One direction, hero frames only, built from today's markup classes and
    `ui/styles.css` — cheapest, closest to what ships.
  - Full screens in a Claude Design project — needs a design-system bundle
    Parley does not have; off constraints #2.
- **Choice:** one direction, Option B as decided: a **Brief** tab replaces the
  Direction tab; the Room tab loses "Shared room instructions". Two static
  hero pages that link the repository's own `ui/styles.css` and reuse today's
  classes (`context-brief-card`, `direction-pins`, `direction-add`,
  `direction-foot`, `fld`, `note`, `btn`, the settings and dialog chrome); the
  new pieces are plain HTML and CSS inside each page.
- **Steps:** 1a briefs skipped (PD-0002 fixes the direction). 1b heroes: this
  step. Then 2a flows, 2b states, 3 plan, 4 review, 5 components (plain
  JS/CSS on the design branch), 6–7 compose and local render, 9 sign-off, the
  PM's merge, 11 `DES-`.

## Frames

| Frame | File | Shows |
| --- | --- | --- |
| brief-panel | `room-brief-brief-panel.dc.html` / `.png` | Room settings → Brief tab, room "Parlay Product Evolution", dialog body at full height: heading and note, Goal, Rules (8 lines), 5 active Decisions with Archive (one of exactly 200 characters, wrapped in full), Add, Archived decisions (3) open with Restore and Delete, the merge notice (Goal and Rules), `2,007 characters · guide about 2,000` with the length warning, What agents see open with the exact PD-0003 item 4 block built from the frame's own data (`Includes unsaved changes.`), the old saved brief row collapsed, Tidy / Discard changes / Save brief. |
| dialogs | `room-brief-dialogs.dc.html` / `.png` | Create room → Room tab with Goal (required) and Rules and the brief note, beside Pin to room brief with a 200-character suggested line. |

Copy is REQ-0002 Behavior and REQ-0003 Behavior verbatim; the preview block is
PD-0003 item 4. The character count is the PD-0003 item 5 sum of the sample
Goal, Rules and active Decisions (143 + 972 + 892).

Rendered from a scratch directory outside the repository with the repository's
own Playwright Chromium, 1440 wide, light, full page; looked at, revised once
(Rules field clipped two lines; the count past the guide read as an error in
red, now amber; the Create room footer overlapped "Start in Work mode"),
rendered and looked at again.

## Design choices (mine, not product rules)

- A Decision is a text field that grows with its text (`field-sizing:
  content`), so a 200-character line always wraps in full; today's one-line
  `<input>` would clip it.
- Past the guide the count turns amber, not red: it is a warning and Save
  stays enabled (REQ-0002 Behavior 2, Length).
- Archived decisions are read-only text in a dashed box with Restore and
  Delete; active ones are editable with Archive only.
- Goal and Rules in Create room carry `required` / `optional` markers in the
  label, as "Project folder optional" does today.

## Proposals

Drawn because the frames needed them; no requirement states them. The PM
accepts or drops each; drawing decides nothing.

- Pin dialog room line: `Room: {room}. Adds one decision to the room brief that every agent gets on every turn.` — REQ-0003 says "naming the room as today"; today's line says "room direction", so its copy must change and the new wording is not written anywhere.
- "Agent sessions and context events" stays below the brief card, collapsed, as it is on today's Direction tab — REQ-0002's top-to-bottom list does not mention it.
