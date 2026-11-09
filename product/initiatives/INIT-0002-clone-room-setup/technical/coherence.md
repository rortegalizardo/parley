Verdict: coherent
Mode: PRODUCT-DISCOVERY
Initiative: INIT-0002
Story set reviewed: REQ-0004 (revision 2, draft) — the whole set
Authorising decision: PD-0009 (option A, server-side clone), with the rulings of PD-0010
Assessment round relied on: 1
Reviewed: 2026-11-06
Round: 1 of 2 — full pass

Evidence: [capability-scan.md](capability-scan.md), [impact.md](impact.md),
[assessment.md](assessment.md) (round 1). Code read on branch
`product/INIT-0002-clone-room-setup`, which equals `main` at `704039f` outside
`product/`. The live store `~/.parley-fork` was read only (keys and flags, no
content). No server was started. Source lines below are evidence only, not
design.

## Per-story checks

| REQ- id | Independently verifiable? | Sequencing note consistent? | Assumed capability | Result |
| --- | --- | --- | --- | --- |
| REQ-0004 | Yes. It is the only story. It holds every row of impact.md (U1, U2, S1, S2, D1-D3, V1, and A's S1a, U2a), so menu, dialog and server action ship and are checked together, as impact.md's one rule ("server and UI ship together") needs. Every AC can be checked on an isolated port with a copied store: the room files, the summary read, and the fake provider's prompt dump (`test/fake-cli.mjs:12`, `:217`). Some ACs need test rooms the live store does not have (defect 1). The prompt clause of AC 9 needs the fake provider (defect 2). | Yes. `depends_on: [none]`. `704039f` is on `main` (ancestor check) and is the PRL-3 merge, so the Room Brief the clone copies is there. impact.md forces no order between components. | None assumed. Each gap the scan marked `absent` or `partial` is made by this story: copy a room's setup (absent) → Scope "server side", Behavior 4-5; sleep without a note (absent: `sleepSeat` always writes one) → Behavior 4, C-01; Goal or Rules over the limit at creation (partial: checked against an empty brief) → Behavior 4, AC 6; a Goal field that keeps an over-2,000 pre-fill (partial) → Behavior 2, C-08; clone item in Room actions (partial) → Behavior 1. Reading the original without activating it uses `GET /api/room/summary` (exists; it loads the room but schedules nothing, `parley.mjs:7912-7915`), with R-03 covering the load-time rewrite. | coherent; defects 1-3, all non-blocking |

**Verdict-drift check.** The story is option A as assessed: one new server
action reads the original at the moment of Create and builds the room from a
fixed list (C-04), and Create room's request shape is untouched. Scope,
Behavior and ACs need no work outside A's rows in impact.md. Every PD-0010
item was an option the assessment recommended (PC-01, PC-03 to PC-07, R-04)
and costed in the `multi-component` band. B-only constraints C-09 to C-11 are
correctly absent. Every constraint PD-0009 carries (C-01 to C-08, C-12, C-13)
is listed, and so are the risks it carries (R-01 via C-04, R-03, R-04 in
AC 3). Not `regression-required`.

**Verification check (C-12, C-13, R-03).** One check on a free port with
`--root` on a copy of the store can cover every AC. Two conditions apply.
First, the copy is seeded with test rooms the live data lacks (defect 1).
Second, the message check uses the fake provider (defect 2). R-03 holds:
the summary read loads the original (`parley.mjs:7914`), so taking the
"before" copy after the dialog opens avoids the load-time rewrite. Read-only
look at the live store found no pending catch-up in any room, so opening an
original starts no agent there today.

## Defects

| # | REQ- id | Check failed | Blocking? | Disposition | Resolvable in decomposition? | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | REQ-0004 | AC checkability under C-12 — verification setup not stated | non-blocking | open | Yes | Several ACs need rooms the live store does not hold. The API cannot make three of them: a five-agent room (AC 10; `POST /api/rooms` refuses above four, `parley.mjs:7809`), Rules over 8,000 and a Goal over 2,000 (AC 6; refused at creation). They can only be made by editing the **copy's** files before the isolated server starts. Legacy larger rosters load intact (`parley.mjs:8258-8262`), and stored over-limit text is kept (PD-0006 item 2). Others the isolated server's API can make in the copy: a 40-character room name, an existing `R copy`, a Gemini agent and a Codex Fast-mode agent (none live). The Notes say "one check … covering the four done criteria of PD-0007 item 7", which leaves these ACs without a stated setup. A verifier could call them untestable or, worse, seed the live store. Suggested Notes sentence: the store copy may be seeded, by API or by editing its files before start, with the test rooms these ACs need; the original is idle when the "before" copy is taken. This does not change what gets built. |
| 2 | REQ-0004 | AC checkability under C-13 — which variant | non-blocking | open | Yes | AC 9's clause "its first turn … whose prompt carries the clone's Goal and Rules and no Decisions" can only be read with the fake provider: its `SAWWHAT` directive returns the briefing and prompt (`test/fake-cli.mjs:12`, `:217`). With C-13's other variant (scratch folder, real CLI) the prompt cannot be seen, and the check spends real provider calls. Under the fake provider, the clone's copied commands (`claude`, `codex`) do not resolve on the isolated PATH (`test/server-fixture.mjs:22-28`). So the check also points that agent's command at the fake CLI, a change to the clone that AC 9's own flow permits. Suggested Notes sentence: the message check uses the fake provider. This does not change what gets built. |
| 3 | REQ-0004 | Reference wording | non-blocking | open | Yes | The PD-0010 link in Scope ("Every detail of PD-0010") points to `PD-0010-clone-room-setup-behaviour-clarifications.md`, which does not exist. The file is `product/decisions/PD-0010-clone-room-setup-behaviour-rulings.md`. The Requirement section links PD-0007 and PD-0009 correctly. Clarifying only. |

Counts after round 1: 0 blocking open, 3 non-blocking open, 0 fixed,
0 carried-accepted.

## Questions raised

| Q- id | What it blocks |
| --- | --- |
| none | No defect needs a product answer. Defects 1-3 are wording repairs to REQ-0004's Notes and Scope. No `Q-` file was written. |

## Round declaration

Round 1 of 2, full pass over REQ-0004 (the whole set). There are 0 open
blocking defects, so the verdict is `coherent`. Under size rule §9d.3 this
round is terminal: no round 2 runs unless a blocking defect is repaired, and
there is none. Defects 1-3 do not hold the verdict open. The PM may repair
them in passing or mark them `carried-accepted`.
