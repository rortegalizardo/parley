# Engineering log

## NFR targets

| Area | Target | Baseline and evidence | Ticket | Status |
| --- | --- | --- | --- | --- |
| Smoke verification reliability | npm test exits 0 on merged main; all applicable checks execute through the final summary, no failed or silently skipped checks; origin/main contains the repair. Explain every expectation/count change. | Requester reports about 80 of 819 checks reached; a protocol-only throwaway change reached 77 passes before crashing. These counts were not independently reproduced at intake. Source drift confirmed below. | PRL-6 | Open |
| Verification isolation | Ephemeral ports and temporary roots only; no contact with 4142/4141, live room stores or Workbench. | smoke.mjs:24 creates a temporary root; :227 spawns the server with --port 0 and --root ROOT. product/project/constraints.md and requester prohibit live-port use. | PRL-6 | Required |

## Tech-debt register

| Debt | Evidence / impact | Decision | Ticket | Status |
| --- | --- | --- | --- | --- |
| Smoke fixtures and assertions lag current app behavior | Protocol 14 vs 16; incomplete fake DOM; assertions for removed datalist markup. Early crashes leave most checks unverified. | Repair the existing suite through its final check, retain meaningful assertions, independently review changed expectations, and fix/name real app defects exposed. No unrelated refactor or new suite. | PRL-6 | Open |

## 2026-11-08 — Restore complete smoke verification

**Measured/read:** npm test is node test/smoke.mjs (package.json). At intake HEAD, main and the local origin/main tracking ref all equal a40af74612e61e6b0655a551cafd8b9369384847; the working tree is clean. test/smoke.mjs:37 pins runtime protocol 14, while parley.mjs:73 and ui/app.js:110 use 16. The fake document querySelector at smoke.mjs:779–783 returns null outside the meta selectors, but ui/app.js:3667 writes textContent on .room-template > span. smoke.mjs:1761–1766 expects roster-models-${i}/roster-efforts-${i} datalists, absent throughout ui; roster rendering now calls seatFieldHTML for model/effort. The requester reported runtime compatibility failures, the cfg crash near :1937, folder-picker/native-modal crashes and only roughly 80 of 819 checks reached (77 passes in a protocol-only throwaway export). No npm test run was performed at intake; total runtime, full failure inventory and final check count remain unknown. No app bug is confirmed yet.

**Decided and why:** create one bounded reliability ticket, PRL-6, repairing all smoke failures, not just the first reported examples. Preserve current accepted behavior, including Room Brief semantics from product/decisions/PD-0002, PD-0003 and PD-0006, and current clone behavior. Update obsolete implementation assumptions without reducing coverage merely to pass. Removed checks require evidence that their covered behavior is retired; meaningful behavior gets equivalent checks. Expectation changes require a stated reason and independent review. Genuine app defects exposed are included and must be explicitly named. No product redesign or E3 work is requested.

**Delivery/verification:** normal Factory branch/review/gated PR merge, no force-push, followed by complete npm test on main and proof origin/main contains the repair. Report tested commit, exit code, totals, all expectation/removal reasons, app bugs (or none), and whether bin/, lib/, ui/, parley.mjs or package.json changed, with paths/reasons for any changes. Preserve smoke-failure/, browser-failure/, room data, transcripts, release/ and every unrelated branch, especially feat/convergence-handoff. Use isolated ports/temp roots only; never touch 4142/4141 or rebuild/restart Workbench.

**Context lookup:** AGENTS.md, CLAUDE.md, CHECKPOINT.md, README.md and project constraints/principles/mission/decision index were read. No prior engineering log or pending engineering-log entries existed. Focused project-scoped Pack lookup failed with ERR_SQLITE_ERROR (unable to open database file); no shared-memory result was used. Source inspection and the final requester acceptance bar were sufficient to define the ticket without further interview.

**Resulting ticket:** PRL-6 — Restore a complete passing smoke run on main.
