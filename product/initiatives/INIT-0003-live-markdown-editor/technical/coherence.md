Verdict: coherent
Mode: PRODUCT-DISCOVERY
Initiative: INIT-0003
Story set reviewed: REQ-0005 (revision 3, draft), REQ-0006 (revision 3, draft) — the whole set (round 1 read revision 2 of both)
Authorising decision: PD-0012 (option A, one shared CodeMirror 6 component), with the rulings of PD-0013 and the requester's decisions in PD-0011
Assessment round relied on: 1
Reviewed: 2026-11-08
Round: 2 of 2 - delta re-check (terminal)

Evidence: [capability-scan.md](capability-scan.md), [impact.md](impact.md),
[assessment.md](assessment.md) (round 1). Code and tests read on `main` at
`31ec463`, which includes PRL-6. PRL-6 changed nothing the scan relies on. One
library behaviour (defect 1) was read from the published source of the version
the scan names as eligible; nothing was installed or run.

Verdict drift: none. The set covers exactly the fields PD-0012 item 1 lists,
carries all of C-01 to C-20, and implies no work the assessment did not assess.
The one server change holds as assessed: the route serves whatever the fixed
list names, including a file in a subfolder. Defect 1 is one more library default
to switch off, the same kind as C-06 and C-14. It does not touch the
`feasible-with-constraints` verdict, so it is not a regression.

Round 2 (delta re-check, 2026-11-08): only REQ-0005 and REQ-0006 at revision 3
and the edge REQ-0005 to REQ-0006 were re-read, against impact.md and
capability-scan.md; every round-1 disposition not listed below is carried
unchanged. The one new read outside the stories is `ui/app.js` on `main`: the
window `dragover` and `drop` listeners (about lines 4078 to 4098) cancel the
browser's default for any drag carrying files and send the files to the same
attach path as the paperclip, whatever element the file lands on. So the stories'
statement that the page's existing window-wide drop handling attaches the file
is accurate. Result: all seven round-1 defects are fixed, no new defect found,
no blocking defect open. The edge REQ-0005 to REQ-0006 still points upstream
(vendor file and shared editor first), and the added C-21 and the REQ-0006
scope line (adds to the shared editor only what the bar needs, C-10) do not
change it. No verdict drift: C-21 is one more library default switched off, the
same kind as C-06 and C-14, and implies no work the assessment did not assess.

## Per-story checks

| REQ- id | Independently verifiable? | Sequencing note consistent? | Assumed capability | Result |
| --- | --- | --- | --- | --- |
| REQ-0005 | Yes. Nothing in it needs the chat bar. PRL-6 is a stated precondition. | Yes. It is the upstream story: the vendor file and shared editor come first, as impact.md's dependency direction requires. The app stays whole between the two stories, because the chat bar is still a text box. | Live editing (`absent`), serving the vendor file (`partial`), length limits (`partial`) and a way to generate the bundle (`absent`) are all created by this story. One gap: file drop on the editor (defect 1). | Round 2: defect 1 fixed (Behavior 6, a criterion and C-21). No open defect. |
| REQ-0006 | Yes, once REQ-0005 is merged, which is its stated dependency. No other hidden prerequisite. | Yes. It runs after REQ-0005, as PD-0011 item 7 and PD-0012 item 2 require, so the REQ-0005 browser check settles the library risk (R-01) before it starts. | The text draft (`absent`) is correctly read as today's behaviour. The Enter guard during composition (`absent`) is created here. The picker needs no caret pixel position. One gap: file drop on the editor (defect 1). | Round 2: defect 1 fixed (Behavior 5, a criterion and C-21). Edge from REQ-0005 unchanged and consistent. No open defect. |

## Defects

| # | REQ- id | Check failed | Blocking? | Disposition | Resolvable in decomposition? | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | REQ-0005, REQ-0006 | Assumed capability | Yes | fixed | Yes | **Dropping a file on the editor pastes the file's text into it.** By default the CodeMirror view package (6.43.15) reads a dropped file and inserts its text at the drop point. Parley's window-wide drop handling still attaches the file, so a text file dropped on any editor field is both attached and written into the text. A text box today only attaches it. Correction to round 1: impact.md lists Attachments as "Not impacted" because the drop handling is independent of the field, and that is wrong for this library. No story names it: C-06 lists other insertions, C-10 covers keys and paste only, and no acceptance criterion drops a file on the field. The story set should state the obligation and test it: a file dropped on the editor inserts nothing and is handled as today, in both stories. No product question: REQ-0005 Behavior 6 and PD-0011 item 6 already give the answer. **Round 2: fixed.** Both stories now state the obligation (REQ-0005 Behavior 6, REQ-0006 Behavior 5), carry a drop criterion (REQ-0005 on Goal, Rules and agent instructions; REQ-0006 on the chat bar) and a constraint row C-21. Checked `ui/app.js`: the window drop listener attaches files wherever they land, as the stories say. |
| 2 | REQ-0005 | Independence | No | fixed | Yes | Only REQ-0006 has a criterion that the existing suites still pass, yet REQ-0005 is the first story to break them: it replaces the New Room Goal that the shared browser test setup fills. C-17 binds this and CI runs those suites, so what gets built does not change. **Round 2: fixed.** REQ-0005 now has the criterion that the existing smoke run and browser suites pass, updated only where they read a field it replaces. |
| 3 | REQ-0005, REQ-0006 | Sequencing note | No | fixed | Yes | Both stories' C-17 claim the same "35 lines in 9 files". Counted on `main`, 17 lines in 4 files read the settings and dialog fields (REQ-0005) and 18 lines in 8 files read `#input` (REQ-0006). REQ-0006 also says all 35 read `#input` and that the count includes `test/smoke.mjs`; the scan counts that file separately. Each story updates only the lines for the fields it replaces. **Round 2: fixed.** REQ-0005 C-17 says 17 lines in 4 files; REQ-0006 C-17 says 18 lines in 8 files plus the smoke stub. Each states its own count and no longer claims 35. |
| 4 | REQ-0005 | Independence | No | fixed | Yes | The criterion "type … a tab" cannot be done with the Tab key: C-15 and today's text box move focus out of the field. A tab character can only be pasted, so the criterion should say so. **Round 2: fixed.** The criterion now says a pasted tab character. |
| 5 | REQ-0006 | Sequencing note | No | fixed | Yes | The scope line "Not in this story: the editor itself" sits beside C-10, which appears only in REQ-0006 and needs the shared editor to let the bar's key and paste handling go first. REQ-0006 therefore has to be able to add to the shared editor. Its constraint table already says it adds this. **Round 2: fixed.** REQ-0006's scope line now says it adds to the shared editor only what the bar needs (C-10). |
| 6 | REQ-0006 | Assumed capability | No | fixed | Yes | The scope line "paste of text, images and files" is stale: only images become attachments on paste (assessment, Corrections to CAP-0003, item 2). Behavior 5 and the criteria are correct. **Round 2: fixed.** The scope line now reads paste of text and of images, dropped files and the attach button; no file paste is claimed. |
| 7 | REQ-0005, REQ-0006 | Independence | No | fixed | Yes | The criterion "in every browser" and the composition criteria can be checked only in part: the repository's browser harness runs Chromium only, which is also the engine Workbench uses. The guard is still required everywhere; the focused check should record which browsers it covered. **Round 2: fixed.** Both watch-lists say the harness runs Chromium only and the focused check records which browsers it covered. |

## Questions raised

| Q- id | What it blocks |
| --- | --- |
| none | No defect needs a product answer. |
