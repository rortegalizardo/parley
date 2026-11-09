# INIT-0003 · Live Markdown editor · step 1b reference frames

Two static reference frames at 1440 wide, light theme (PD-0012 item 4). They
show the one direction the requester fixed: today's chat Markdown look, typed
in place, in the three Room-settings text boxes and in the chat bar. They are
the `local_export` the DES- record points at (precedent PD-0004 item 1,
PD-0009 item 3, INIT-0002). Sample text is illustrative; where a frame and a
requirement differ, the requirement wins.

## Approach (set by the PM)

**Asked.** Typed Markdown formats in place, with the look chat already gives a
sent message, in the Goal, Rules and Standing instructions boxes and in the
chat bar. What is saved is exactly what was typed. No toolbar, no preview, no
toggle, no extra button; 1440 wide, light theme; no canvas; no multi-page
design track.

**Candidates.**

| Method | Cost | Fidelity to the request |
|---|---|---|
| Draw two static reference frames from today's markup and `ui/styles.css`; the editor's look restated as plain CSS in the page | Low: one dispatch, two pages, two renders | High: same classes and tokens the shipped page uses; a static page cannot show the marks appearing and disappearing, so that stays in REQ-0005's Behavior list |
| Build the editor as a working prototype on the design branch and screenshot it | High: real contenteditable logic, serialisation and cursor handling before any requirement is settled | Highest, but the prototype would decide behaviour the requirements already decide, and engineering rebuilds it anyway |
| Full design track (briefs, hero options, flows, plan, components, sign-off) | Highest | Wrong shape: the requester fixed the look; there is nothing to choose between |

**Choice.** Static reference frames. The look is fixed and the behaviour is
written down (REQ-0005, PD-0013); a frame only has to show how the written
rules look on today's surfaces.

**Steps.** Step 1b only, one direction, no exploration: steps 1a (briefs),
2a (flows), 2b (states), 3–4 (plan and critic), 5–7 (components, compose, local
run), 9 (sign-off) do not run. The frames are committed on the design branch;
the PM merges; the DES recorder completes the DES- record pointing at them.

## Frames

| Frame | Page | Render | What it shows |
|---|---|---|---|
| Room settings (Brief, Agents) | `markdown-editor-settings.dc.html` | `markdown-editor-settings.png` (1440 × 2095) | (a) Brief tab: Goal unfocused (closed elements formatted, no marks); Rules focused with every element the editor formats and one line being edited with its marks shown; Decisions, counter, What agents see, Tidy/Discard/Save as today. (b) Agents tab: @fable's Standing instructions as the same editor, no Edit/Preview toggle, Expand editor as today |
| Chat bar | `markdown-editor-chat-bar.dc.html` | `markdown-editor-chat-bar.png` (1440 × 900) | One sent message rendered by chat today, for comparison; the chat bar with a multi-line message being typed (heading, bold, bullets, fenced block, link; one line edited with marks shown), an image chip and a file chip, the agent chips and Send as today; below it the same bar empty with the placeholder `Message the table…  type @ to choose an agent` |

Both modals do not fit side by side at 1440 (two 820px dialogs), so the Brief
and Agents dialogs are staged one under the other on a taller page.

## Render

Headless Chromium (the repository's Playwright 1.62.1), viewport 1440 × 900,
`colorScheme: light`, full page, from a scratch directory outside any git
checkout with `ui/` linked beside a copy of the page. Both pages load
`../../../../../ui/styles.css` relative to this folder.

- Document scroll width: **1440** for both frames (no horizontal scroll).
- Settings frame: Goal editor 79 px tall (today's `rows=3`); Rules editor
  277 px, shown taller than its `rows=9` default so every element is visible
  without scrolling (the box is resizable today; the drag handle is kept);
  Standing instructions editor 190 px (today's `min-height`).
- Chat-bar frame: typing editor 185 px tall, under the 200 px maximum before
  it scrolls; empty editor 36 px (one line, as today).
- No console errors, no failed requests.

## Design choices (mine, not product rules)

- **The editor takes the text box's rules.** Background, border, radius,
  padding, type size, line height, min-height, focus ring and the resize
  handle are the values the cascade gives a textarea in that field today
  (`.fld textarea`, `#overlay .modal textarea`, `.instructions-field
  textarea`, `#composer #input`). REQ-0005 C-16.
- **The Markdown look is chat's values, line by line.** Heading sizes and
  weight, 22 px list indent, inline code, link colour and the fenced block
  surface come from the `.bubble` rules (`ui/styles.css` 319–343). An editor
  keeps one typed line as one visual line, so block margins are not copied:
  a blank typed line is the spacing. The closed elements therefore sit a
  little tighter than the same text once sent; the sent message in frame 2
  shows the difference.
- **Shown marks use today's muted token** (`--text-faint`), the text they
  wrap keeps its formatting. A bullet item being edited shows its `-` where
  the bullet was; closed bullet items show `•`; numbered items show the
  number as typed (PD-0013 item 4).
- **Fence lines are blank strips** of the block background with the block's
  border and corner radius, keeping their line height (PD-0013 item 2). They
  double as the block's top and bottom padding, so the block reads as one
  surface. No language header, no copy button, no language colours
  (PD-0013 item 5).
- **No active-line highlight, no gutter, no line numbers.** Nothing the
  requirements do not list.
- **Agents tab:** the `.instructions-modes` Edit/Preview toggle and the
  `.instructions-preview` element are gone (REQ-0005 Behavior 9); the field
  label, Expand editor button and note stay as today.
- **Chat bar chips:** "agent chips" is today's row (Auto, Agents 2, @all, To
  all Converge/Parallel, Rounds). `#seatChips` is empty in today's app, so no
  per-seat chip is drawn.

## Proposals

None. Nothing in the frames needs data, behaviour or scope the accepted
requirements do not cover. Two things seen while drawing, outside this
initiative, left for the PM:

- In the light theme the `×` on an image attachment chip is dark text on a
  dark disc (`.draft-image button`, `ui/styles.css` 584), so it is hard to
  see. Today's rule, not changed here.
- Inline code in chat uses `rgba(255,255,255,.08)` as its background, which
  is invisible on the light theme; code reads as monospace only. Today's
  rule, kept so the editor matches chat.
