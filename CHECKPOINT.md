# Parley fork checkpoint — 2026-10-22

## Current checkpoint — editable rosters and @all

This section supersedes the historical checkpoints below. Active branch: `feat/editable-room-rosters`.

- Settings now stages additions and removals until Save; Cancel discards the draft. Each new agent has its own name, provider, model, supported effort and standing instructions. Typed fields survive adding/removing other cards.
- Rooms have no fixed roster-size cap. Four agents is only an optional template. The composer always displays `@all`, one button per current agent, and roster-aware hints and mention choices. `@both` stays a compatibility alias.
- Retained agents keep their sessions/cursors and all messages remain in the transcript. New agents start fresh. Removed names stay reserved in `state.retiredAgents` so historical receipts cannot attach to a different agent. Removal waits for active exchanges, queued deliveries and active Pair roles; pending catch-up is cancelled with durable provenance. Stale roster drafts return 409.
- Focused backend coverage includes real fake-provider conversation state, fresh-process reload, retained model/effort/instructions, rejected-edit atomicity, busy/queued removal and pending-catch-up cancellation. Full browser suite passed 37 checks; the strengthened Settings case reran after the final default-field correction. Smoke: 839 passed, unit: 16 passed, and package startup passed. All integration suites passed: retry, provenance, scheduler sequences, automatic turns, Claude sessions, multi-agent, roster edits and launcher isolation. The legacy nine-seat rejection assertion was replaced with successful creation and persistence coverage.
- **Port 4141 remains protected and untouched**, original PID 29360. The empty, idle fork was refreshed on port 4142 only: current PID 72262, UI version `0420c2ef13ee5bd074c9`, data `~/.parley-fork`, launcher `parley-mine`. Served script/style bytes match the checkout exactly. The actual browser tab now visibly shows `@all` and Settings Add/Remove controls. No room configuration or messages were changed. Process IDs are observations, never instructions to signal a PID without freshly verifying ownership and activity.

Next action: use the updated fork on 4142; reload any older tab to receive its new assets. Settings → Agents in this room manages membership. Port 4141 requires no action. Delivery is recorded in the pull request for `feat/editable-room-rosters`.

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
