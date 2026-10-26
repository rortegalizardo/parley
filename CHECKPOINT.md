## Current checkpoint — foreground errors and convergence recovery (2026-10-26)

Implemented by Sol 6.1; primary-agent QA passed on actual **4142**. **4141 was not accessed, restarted or modified during this repair.**

- Toasts now render in the foremost modal's accessible layer, including restoration through nested settings dialogs. Duplicate-room errors were visually verified in the live UI without creating a room.
- Valid structured objections now remain blocking votes and automatically trigger revision. The review prompt specifies the supported shape. Exact run, version and draft identity checks remain enforced.
- Previously rejected saved reviews can be recovered without repeating provider calls. Read-only display never resumes a run; explicit Resume reuses validated reviews. Incomplete cards show the cause and recovery action before a collapsible Markdown draft.
- The user's actual stalled three-agent run was continued under their explicit instruction. It reached agreement on revised draft 2 with three approvals (two nonblocking reservations), using four new calls. Previous attempts had consumed nine calls; final total was 13 of the existing 15-call allowance.
- Only idle 4142 was gracefully refreshed; original room files remained byte-identical through refresh. Served assets match the checkout, version `86a0454aff848d9c26d5`. Last observed live PID: 40230; fresh ownership/activity checks are mandatory before any later signal.
- Focused isolated recovery and fresh-run checks passed; temporary QA servers stopped. [Verification](docs/CONVERGENCE-RECOVERY-VERIFICATION.md). Direct main delivery, no new PR.

Next action: continue in the live room on 4142; the agreed handoff is already posted.

---

## Historical checkpoint — Codex compaction and stable workspace controls (2026-10-23)

Implemented by Sol 6.1; primary-agent QA passed on actual **4142**. **4141 and its original library were never accessed or changed.**

- Codex compaction now uses confirmed checkpoints from the exact linked native session, with identity validation, resume baselines, deduplication and stale-session guards. Claude's explicit compaction reporting remains supported. Unavailable observation is shown honestly; no inferred usage percentage.
- Room settings now separates Agents, Room and Context. Compact top navigation keeps the settings gear at the right; agent widgets expose model/effort and listening/sleep controls. Create and Settings dialogs keep stable dimensions with internal scrolling. Work help and composer icons are proportionate.
- A real Codex turn on 4142 compacted at 08:06:44 UTC. The subsequent answer retained the saved decision: “CSV; local.” The disposable QA room is archived and recoverable. Original default/Test 4 config, state, transcript and event files remained byte-identical.
- Desktop and narrow UI checked, no browser errors. Served assets exactly match the checkout (asset version ef2b80c555e6e84735d7). Isolated QA server was stopped. Last observed 4142 PID: 68782; never signal it without new ownership/activity checks.
- Validation: [record](docs/CODEX-CONTEXT-UI-VERIFICATION.md). Provider behavior: [guide](docs/ROOM-BEHAVIOR.md). Direct main delivery under the user's standing instruction; no new PR.

Next action: use the updated fork on 4142. Continue Sol 6.1 implementation and primary-agent QA for future requests.

---

## Historical checkpoint — context retention and complete Create room repair (2026-10-23)

Delivered on `main`, implemented by Sol 6.1 and verified by the primary agent on actual **4142**. **4141 and its library were never accessed or changed.**

- Independent saved decisions survive native resets, `/clear`, restart and archive/restore. Pin any message; add/edit/remove in Room settings. New agreed handoffs retain reservations automatically; the latest pre-existing agreed handoff is imported once. Every provider attempt receives the complete current ledger, with explicit overflow handling instead of silent truncation.
- Confirmed session resets and Claude-reported compactions appear in the transcript and context history. Codex/Gemini internal compaction is explicitly unavailable; no fabricated context percentage.
- Home logo exits rooms; one New room control per viewport. Handoffs remain beside their original exchange, collapsed after completion. New messages follow, reading older posts is preserved, and Jump to latest shows unread count. Individual recipients have no misleading roster count; automatic follow-up limits live in Room settings with clearer permission explanations.
- Create room now has Agents/Room tabs, a single agent editor with up to four seats, room instructions at creation, a folder field/Browse control, and an always-visible footer. Room settings persist atomically before any provider launch. Drafts survive tab/preset navigation; missing names reveal/focus Room.
- Actual 4142 verified at desktop 1280×720 and narrow 630×576. Served JS/CSS exactly match the checkout. Original default/Test 4 config, state, transcript and event files remained byte-identical. Disposable QA rooms were archived, not deleted. Fake providers used; no paid model calls.
- Last observed 4142 PID: **67612**. This is an observation, not authority to signal later without fresh ownership/activity checks.

[Verification record](docs/CONTEXT-UX-VERIFICATION.md) · [Session/context behavior](docs/ROOM-BEHAVIOR.md). Local screenshots are linked in the verification record. No new PR; publish directly to the fork main branch under the user's standing instruction.

---

Parley fork checkpoint — 2026-10-23

## Current checkpoint — room UX repairs live

User-requested UX fixes implemented by Sol 6.1; primary agent performed browser and focused runtime QA. Four-agent maximum now explicitly replaces the earlier unlimited-roster requirement; existing larger rosters are preserved. Create presets/selects, room empty states, settings separation, instructions editor, Fast mode, slash clear/archive/restore, and transcript handoff placement are delivered. [Verification](docs/UX-REPAIR-VERIFICATION.md); [session and routing behavior](docs/ROOM-BEHAVIOR.md).

The idle fork was refreshed only on 4142 (last observed PID 62963), with served UI bytes verified against the checkout. Original default and Test 4 config/transcript/event hashes match. Native MCP still lists both rooms. Port 4141 and its library were untouched. All destructive-flow QA used disposable isolated rooms with fake providers; no unit-test suite was added/run.

Next action: use the updated fork on 4142. Existing browser tabs may need reload. Continue to use Sol 6.1 for implementation and the primary agent for QA, and deliver verified work directly to main without new PRs.

---

## Historical checkpoint — harnesses installed

User explicitly requested installation, not a setup guide. Both harnesses now have an enabled user-scope MCP named `parley`, reusable across projects, bound to `http://127.0.0.1:4142`. Each has a distinct private credential allowing all current and future rooms on 4142 (`rooms: ["*"]`), explicitly authorized by the user after the initial default-only installation.

- Codex registration: `~/.codex/config.toml`. Claude registration: `~/.claude.json`. Both run the shared `bin/parley-bridge.mjs` from this checkout. Credential contents stay in owner-only files under `~/.parley-fork/.bridge/clients/` and were never printed. No private harness settings were copied into the fork.
- Architecture decision: one focused, reusable Parley MCP, not a central gateway for unrelated services. Therefore no separate central MCP project was created; the implementation remains in `/Users/ortega/Desktop/Projects/parley`.
- Sol 6.1 added a startup ancestry check before credential access. Both the original npm `parley` entrypoint and the fork's `parley-mine` suppress the MCP's tools for their own provider descendants, even without the newer environment marker. Suppressed/unknown contexts initialize with zero tools and deny direct calls. Ordinary harnesses retain all four tools.
- Primary-agent validation: bridge suite passed (8 checks plus independent end-to-end cases); packed startup passed (22 files). Codex's installed registration is enabled, its app-server discovered four tools and executed authenticated list/read with the installed credential. Claude's actual user-scope registration reports Connected. Credentials are mode 600 and scoped to all rooms on 4142. Metadata-only checks confirmed both actual Parley ancestor contexts are blocked and a normal harness is allowed.
- Neither server was restarted or signaled. No requests were sent to 4141 and its library was untouched. No test messages were added to the existing conversation. A fresh harness session loads the new MCP registration; the already-running chat's tool inventory may predate installation.

- All-room follow-up verification: both installed credentials discovered every existing room, then discovered and read a newly created empty QA room on the same MCP connections. Only that QA room was archived afterward. Tokens and harness registrations were preserved; no server restart, provider calls, messages, or access to 4141 occurred. Future rooms require no configuration changes.

Next action: ask Codex or Claude to list Parley rooms and use the desired room, targeting a named agent or `@all`. No setup commands remain for the user.

---

## Historical checkpoint — shared harness MCP bridge

Implemented the approved [bridge proposal](docs/HARNESS-BRIDGE-PROPOSAL.md). One reusable stdio MCP adapter supports Codex, Claude Code and other compatible clients across projects. Distinct registered identities share the same Parley backend. User chose implementation by Sol 6.1 with primary-agent validation; continue that division for future coding. Deliver verified changes directly to the fork, without leaving new PRs awaiting the user.

- Four tools discover rooms, read bounded conversation pages, send named-agent or `@all` requests, and wait on durable correlated tickets. `@all` preserves convergence and returns the exact agreed handoff plus reservations. Context-only notes launch no providers. Busy, stale, unresolved and incomplete outcomes remain explicit.
- Credentials are private, room-scoped and bound to the fork instance. Idempotency prevents repeated submissions; signed cursors isolate clients. Completed results survive restart/reset; resumed convergence can update nonfinal tickets. External sender badges, prompts and quotes do not impersonate the human. Room-launched providers cannot start the bridge. Protected original libraries and port 4141 are rejected.
- Verified: 16 unit checks; all existing integration suites; 839 smoke checks; 42 browser tests after final UI corrections; adapter/backend/lifecycle and independent SDK end-to-end suites; installed-package startup. Early smoke captured an intermediate Ask regression; corrected code passed all 839 and the primary agent independently retested Ask/Stop-and-Ask.
- **Actual 4142**: SDK clients exchanged named requests and an agreed handoff with fake providers in an isolated QA room. Installed Codex app-server connected, discovered all four tools and executed authenticated list/read without a model turn. Installed Claude Code completed its MCP health check with temporary configuration. Actual UI inspection confirmed harness attribution, `@all`, approval record and reservations. No paid provider calls.
- Fork refreshed only after exact ownership and idle checks. Last observed PID **54615**, protocol **14**, UI version **ed9452f70611a6987d97**. QA room moved into recoverable trash; its two credentials were revoked and temporary fake provider removed. Existing default transcript and config match the pre-validation snapshot. **4141 and its library remained untouched.**
- No normal/global harness configuration was installed. Setup is explicit and scoped to a caller-selected project, so the protected original's agents do not inherit new MCP tools. [Setup guide](docs/HARNESS-BRIDGE.md); [verification record](docs/HARNESS-BRIDGE-VERIFICATION.md); [actual UI capture](docs/bridge-live-4142.png).

Next action: connect the desired caller project using the setup guide. The bridge backend is already loaded on 4142. Process IDs above are observations, never instructions to signal without freshly checking ownership/activity.

---

## Historical checkpoint — convergence and compact recipients

This section supersedes the historical checkpoints below. Branch: `main`. User approved `@all` convergence by default and explicitly authorized implementation, delegation, and live fork verification. PR #5 merged on 2026-10-22 as `40ca75d2ca1c34afa44309c48c43e35306269e65`.

- Compact **Auto · Agents (N) · @all** composer replaces per-agent chips. Search includes name, provider, and standing role. The room has no fixed roster cap; browser coverage includes nine agents. Selected individuals remain visible, typed mentions route consistently, and single-agent rooms show a normal response.
- `@all` gathers independent positions behind a barrier, asks an existing participant to draft, and requires every participant to explicitly approve the same full SHA-256/version. Draft revisions invalidate all votes. Nonblocking reservations stay visible. Only the exact agreed text is posted as a handoff, with its approval record. Parallel replies is explicit and retains ordinary automatic-turn controls; convergence shows review rounds and actual/planned calls instead.
- Durable stage results survive Stop/restart. Resume skips completed positions/drafts/reviews; Extend adds one round and N+1 calls and actually continues. Malformed/silent/failed reviews are incomplete, objections at the limit unresolved. Native-session retries count against N+R*(N+1); no speculative agreement. New tasks, availability changes, ordinary recovery routes, and config changes cannot race an active run. Work retains the existing discussion boundary.
- Verified: 839 smoke checks, 16 unit checks, all integration suites, 7 consensus-integrity tests, lifecycle cases for N1/N2/N4/N8/N9, stop/resume/extend and an in-flight restart without completed-call replay. Full browser suite: 42 passed; final convergence and policy controls reran (8 passed), then final picker positioning (5 passed). Package startup passed. Provider execution used isolated fake providers, not paid model calls.
- **Actual fork on 4142** refreshed only after exact process/launcher ownership and empty-idle checks. Observed PID **72134**, protocol **14**, UI version **2a7f893fcdde59cfa285**. Served script/style bytes exactly match the checkout. CUA verified the actual picker, Converge/Parallel behavior, dark rounds input, and correct automatic-turn visibility. Evidence: `docs/convergence-live-4142.png`.
- **4141 remains untouched**, original PID **29360**. No HTTP requests, signals, config edits, or library writes were made against it. Fork library remains `~/.parley-fork`; original library remains separate. Process IDs are observations, never instructions to signal without freshly checking ownership/activity.

User guide: [docs/CONVERGENCE.md](docs/CONVERGENCE.md). Design contract: [docs/CONVERGENCE-PROPOSAL.md](docs/CONVERGENCE-PROPOSAL.md). Delivery: https://github.com/rortegalizardo/parley/pull/5 (merged; implementation is already running locally on 4142). The merge and subsequent proposal documentation required no server actions on either port.

Latest user direction: delegate future coding to **gpt-6.1-sol** and have the primary agent validate. Merge completed authorized changes into the fork; do not leave new PRs for the user to merge. Never touch the active session on 4141.

New requirement explored: let an existing Codex or Claude harness message a Parley conversation directly. [docs/HARNESS-BRIDGE-PROPOSAL.md](docs/HARNESS-BRIDGE-PROPOSAL.md) recommends a shared local MCP bridge with named targeting, correlated replies and `@all` convergence. Status: design only; no bridge/client configuration installed. Next action: implement the bridge when the user requests implementation.

---

## Current checkpoint — editable rosters and @all

This section supersedes the historical checkpoints below. Active branch: `feat/editable-room-rosters`.

- Settings now stages additions and removals until Save; Cancel discards the draft. Each new agent has its own name, provider, model, supported effort and standing instructions. Typed fields survive adding/removing other cards.
- Rooms have no fixed roster-size cap. Four agents is only an optional template. The composer always displays `@all`, one button per current agent, and roster-aware hints and mention choices. `@both` stays a compatibility alias.
- Retained agents keep their sessions/cursors and all messages remain in the transcript. New agents start fresh. Removed names stay reserved in `state.retiredAgents` so historical receipts cannot attach to a different agent. Removal waits for active exchanges, queued deliveries and active Pair roles; pending catch-up is cancelled with durable provenance. Stale roster drafts return 409.
- Focused backend coverage includes real fake-provider conversation state, fresh-process reload, retained model/effort/instructions, rejected-edit atomicity, busy/queued removal and pending-catch-up cancellation. Full browser suite passed 37 checks; the strengthened Settings case reran after the final default-field correction. Smoke: 839 passed, unit: 16 passed, and package startup passed. All integration suites passed: retry, provenance, scheduler sequences, automatic turns, Claude sessions, multi-agent, roster edits and launcher isolation. The legacy nine-seat rejection assertion was replaced with successful creation and persistence coverage.
- **Port 4141 remains protected and untouched**, original PID 29360. The empty, idle fork was refreshed on port 4142 only: current PID 72262, UI version `0420c2ef13ee5bd074c9`, data `~/.parley-fork`, launcher `parley-mine`. Served script/style bytes match the checkout exactly. The actual browser tab now visibly shows `@all` and Settings Add/Remove controls. No room configuration or messages were changed. Process IDs are observations, never instructions to signal a PID without freshly verifying ownership and activity.

Next action: use the updated fork on 4142; reload any older tab to receive its new assets. Settings → Agents in this room manages membership. Port 4141 requires no action. Delivery: https://github.com/rortegalizardo/parley/pull/4. GitHub has no check runs for this fork; the local validation results above are the release evidence.

---

## Historical checkpoint — full interface audit

This section supersedes the checkpoints below. User clarified that polishing only the landing screen is insufficient and explicitly requested a delegated review of every screen.

- Branch: `fix/full-interface-polish`. The audit and evidence are in `docs/UI-REVIEW.md` and `docs/ui-review/` (15 surface groups). CSS changes cover Settings, room forms, the conversation, menus, header/sidebar, composer and theme-aware status banners. Settings closes mobile navigation before opening; option values and provider behavior are unchanged.
- Verification: all **36 browser tests** and packed runtime startup passed. Final conversation/banner checks reran successfully after the last contrast correction. Screenshots cover desktop/mobile and light/dark; tests use temporary libraries and fake providers. Native OS picker and notification prompts were not invoked.
- The actual fork at **http://127.0.0.1:4142** was idle with an empty default room and was refreshed to serve the corrected UI. Current observed PID **79098**. Served UI version **c26c0efb58c00b61f693** matches the checked-out assets exactly. Actual Settings was visually verified in a new in-app browser tab. Older tabs need a reload.
- **Port 4141 was never signaled, restarted, or reconfigured.** Original PID **29360** remained listening. Do not touch its room library or running agents.
- Launcher remains `parley-mine`; fork data remains `~/.parley-fork`; original data stays separate. Never use process IDs here without freshly verifying ownership and activity.

Delivery record: https://github.com/rortegalizardo/parley/pull/3. Next action: use the refreshed fork on 4142; reload older tabs to receive its new asset version. No user-model calls were made.

---

## Historical checkpoint — visible setup and short launcher

This section supersedes the historical checkpoint below.

- PR #1 was merged into the user's fork (`5389f97a9b9e00b77ace54dc61f60beb12da05b5`). The first pass did not make the new features visible enough; this follow-up fixes discovery and launch friction.
- Current branch: `fix/room-discovery-and-launch`. The corrected UI is running separately at **http://127.0.0.1:4142**, PID **11446**, with data at `/Users/ortega/.parley-fork`. Log: `/private/tmp/parley-mine.log`. Process identifiers are observations, not instructions to signal processes.
- **The original session on port 4141 remains untouched**, PID 29360 when last checked. Never restart it or modify its room library. The old preview on 56882 is no longer running.
- The installed command is **`parley-mine`**, symlinked from `/Users/ortega/.local/bin/parley-mine` to this checkout's `bin/parley-mine.mjs`. `npm start` now uses this same launcher. Defaults are port 4142 and `~/.parley-fork`; repeated launch reopens the existing fork. An unrelated occupied port is an error; exact-port mode prevents silent fallback races.
- The opening screen and header now expose room creation. The four-agent template sets up Fable, Astra, adversary and privacy with editable provider, model, effort and persistent instructions. Empty rooms stay at the top so these controls remain visible in small windows.
- Verified the actual 4142 page in the in-app browser. Browser regression suite: 21 passed; focused first-screen and four-agent checks reran successfully after screenshot updates. Launcher isolation/duplicate/occupied-port/equal-flags tests and packed launcher startup passed. All automated tests use temporary libraries and ephemeral ports, with fake providers.
- Screenshots: `docs/fork-home.png`, `docs/fork-room-setup.png`. Feature guide: `docs/CURRENT-FEATURES.md`. Setup guide: `docs/FORK.md`.
- No npm publication or real model invocation was performed. The user's original session needs no migration or restart.

Follow-up delivery: https://github.com/rortegalizardo/parley/pull/2. The implementation is committed and pushed; this PR records the correction to the initial delivery.

Next action: use the running fork at 4142, or run `parley-mine` to reopen it. Keep the original server on 4141 untouched.

---

## Historical checkpoint — first implementation

## Protect the user's active session

**The user has important ongoing work at http://127.0.0.1:4141. Do not stop, restart, replace, reconfigure, or otherwise disturb that server, its agents, or its room library.** Do not use broad process-kill commands. The user emphasized this requirement immediately before requesting this checkpoint because usage was at 3%.

The original server was not modified or stopped during this work. All test servers use isolated temporary room libraries and ephemeral ports. Our separate preview is http://127.0.0.1:56882, running from this checkout with `--root /Users/ortega/.parley-personal --port 0 --no-open` (shell session 32625). Do not run plain `npm start` while the original server is active; always choose an isolated library and port. The preview loaded before the final small fix for automatically generated seat names; restarting it is unnecessary for checkpointing. Never target port 4141 during follow-up work.

## Repository and review

- Checkout: `/Users/ortega/Desktop/Projects/parley`
- Fork: https://github.com/rortegalizardo/parley
- Upstream: https://github.com/auspex0/parley
- Baseline: upstream `v1.2.1`, commit `c4cd237b7fe58c7df1f2692b6a62971be29e904b`
- Branch: `feat/agent-roster-and-ui`
- Implementation commit: `0240cfaa17f1aaddd61cd73ad9a096def75eebb2` (pushed)
- PR in the user's fork: https://github.com/rortegalizardo/parley/pull/1
- Nothing was merged or published to npm. Package version is `1.3.0-personal.0`, with `private: true` and upstream MIT attribution retained.

## Implemented

The requested facelift includes a modernized sidebar and participant header, readable menu wrapping, native room-creation dialog, responsive layouts, and light/dark colors for custom agent names.

Rooms support 1–8 named agents across Claude, Codex, and Gemini. Each agent has its own provider, model, supported effort, and persistent identity/instructions. `@name` addresses one agent; user-authored `@all` addresses everyone (`@both` remains compatible). Instructions are delivered before the latest message on every provider invocation; editing them resets only that agent's native session while preserving the room transcript. Agent names/providers/membership remain fixed after creation. Pair keeps one worker and one reviewer. Agent-authored follow-up requests intentionally address one named peer per reply.

Backend changes also fix provider-vs-seat process tracking for targeted Stop, protect duplicate-provider seats from ambiguous latest-session fallback, preserve separate causal delivery edges, and route listener replies back to the addressed driver. Existing room identities and history are retained. Runtime protocol is 13; standing prompt version is 5.

## User-facing artifacts

- `docs/CURRENT-FEATURES.md`: a separately delegated, plain-language audit of upstream 1.2.1 features. Its two-seat descriptions intentionally describe the upstream baseline.
- `docs/FORK.md`: setup, four-agent example, role settings, routing behavior, and Pair limitations.
- `docs/fork-room-setup.png`: verified screenshot of the four-agent room form.
- README, reference, design, contributing guide, and changelog updated.

## Verification at checkpoint

Passed on macOS / Node v26.11.1, using fake provider CLIs and isolated libraries (no paid provider calls):

- Unit tests: 16.
- Multi-agent integration: creation/validation, routing, individual model/effort/instructions, persistence/restart/migration, same-provider sessions and targeted Stop, single-agent behavior, Lurk, and Pair with other agents busy.
- Retry, provenance, 18 seeded scheduler sequences, automatic-turn, and Claude-session suites.
- Chromium browser tests: 19, including mobile dialog/menu layout, 1/4/8-agent rosters, room switching, settings, existing Stop/Retry/Pair flows. Log: `/private/tmp/parley-browser-final.log`.
- Package startup/runtime verification. Log: `/private/tmp/parley-package-final.log`.
- Syntax and `git diff --check`.

The final full smoke rerun completed **839 passed, 0 failed**. It confirms the corrected version-5 expectation as well as all existing workflow regressions.

- Full output: `/private/tmp/parley-smoke-verified.log`.
- Completed shell session: `29541` (started by the `roster_tests` agent).
- GitHub reported no CI check runs for this fork's PR when inspected; validation above was run locally.

## Completion and next action

Implementation and local validation are complete. The PR's validation paragraph is being updated with the final passing totals and the PR marked ready for review. Next action: review the PR in the user's fork. No implementation work or local test failures remain.

Do not merge or publish merely to complete the checkpoint. Keep the active user session on port 4141 untouched throughout.
