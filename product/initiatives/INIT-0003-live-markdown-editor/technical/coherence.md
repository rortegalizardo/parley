Verdict: defects-open
Mode: PRODUCT-DISCOVERY
Initiative: INIT-0003
Story set reviewed: REQ-0005 (revision 2, draft), REQ-0006 (revision 2, draft) — the whole set
Authorising decision: PD-0012 (option A, one shared CodeMirror 6 component), with the rulings of PD-0013 and the requester's decisions in PD-0011
Assessment round relied on: 1
Reviewed: 2026-11-08
Round: 1 of 2 — full pass

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

## Per-story checks

| REQ- id | Independently verifiable? | Sequencing note consistent? | Assumed capability | Result |
| --- | --- | --- | --- | --- |
| REQ-0005 | Yes. Nothing in it needs the chat bar. PRL-6 is a stated precondition. | Yes. It is the upstream story: the vendor file and shared editor come first, as impact.md's dependency direction requires. The app stays whole between the two stories, because the chat bar is still a text box. | Live editing (`absent`), serving the vendor file (`partial`), length limits (`partial`) and a way to generate the bundle (`absent`) are all created by this story. One gap: file drop on the editor (defect 1). | Defect 1 open |
| REQ-0006 | Yes, once REQ-0005 is merged, which is its stated dependency. No other hidden prerequisite. | Yes. It runs after REQ-0005, as PD-0011 item 7 and PD-0012 item 2 require, so the REQ-0005 browser check settles the library risk (R-01) before it starts. | The text draft (`absent`) is correctly read as today's behaviour. The Enter guard during composition (`absent`) is created here. The picker needs no caret pixel position. One gap: file drop on the editor (defect 1). | Defect 1 open |

## Defects

| # | REQ- id | Check failed | Blocking? | Disposition | Resolvable in decomposition? | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | REQ-0005, REQ-0006 | Assumed capability | Yes | open | Yes | **Dropping a file on the editor pastes the file's text into it.** By default the CodeMirror view package (6.43.15) reads a dropped file and inserts its text at the drop point. Parley's window-wide drop handling still attaches the file, so a text file dropped on any editor field is both attached and written into the text. A text box today only attaches it. Correction to round 1: impact.md lists Attachments as "Not impacted" because the drop handling is independent of the field, and that is wrong for this library. No story names it: C-06 lists other insertions, C-10 covers keys and paste only, and no acceptance criterion drops a file on the field. The story set should state the obligation and test it: a file dropped on the editor inserts nothing and is handled as today, in both stories. No product question: REQ-0005 Behavior 6 and PD-0011 item 6 already give the answer. |
| 2 | REQ-0005 | Independence | No | open | Yes | Only REQ-0006 has a criterion that the existing suites still pass, yet REQ-0005 is the first story to break them: it replaces the New Room Goal that the shared browser test setup fills. C-17 binds this and CI runs those suites, so what gets built does not change. |
| 3 | REQ-0005, REQ-0006 | Sequencing note | No | open | Yes | Both stories' C-17 claim the same "35 lines in 9 files". Counted on `main`, 17 lines in 4 files read the settings and dialog fields (REQ-0005) and 18 lines in 8 files read `#input` (REQ-0006). REQ-0006 also says all 35 read `#input` and that the count includes `test/smoke.mjs`; the scan counts that file separately. Each story updates only the lines for the fields it replaces. |
| 4 | REQ-0005 | Independence | No | open | Yes | The criterion "type … a tab" cannot be done with the Tab key: C-15 and today's text box move focus out of the field. A tab character can only be pasted, so the criterion should say so. |
| 5 | REQ-0006 | Sequencing note | No | open | Yes | The scope line "Not in this story: the editor itself" sits beside C-10, which appears only in REQ-0006 and needs the shared editor to let the bar's key and paste handling go first. REQ-0006 therefore has to be able to add to the shared editor. Its constraint table already says it adds this. |
| 6 | REQ-0006 | Assumed capability | No | open | Yes | The scope line "paste of text, images and files" is stale: only images become attachments on paste (assessment, Corrections to CAP-0003, item 2). Behavior 5 and the criteria are correct. |
| 7 | REQ-0005, REQ-0006 | Independence | No | open | Yes | The criterion "in every browser" and the composition criteria can be checked only in part: the repository's browser harness runs Chromium only, which is also the engine Workbench uses. The guard is still required everywhere; the focused check should record which browsers it covered. |

## Questions raised

| Q- id | What it blocks |
| --- | --- |
| none | No defect needs a product answer. |
