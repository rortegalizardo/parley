# Parley fork checkpoint — 2026-10-22

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
- Draft PR in the user's fork: https://github.com/rortegalizardo/parley/pull/1
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

The previous full smoke run completed **838 passed, 1 failed**. The sole failure was an old test expecting standing prompt version 4; the application correctly uses version 5. That assertion was corrected and committed. A final full smoke rerun is still running at checkpoint:

- Shell session: `29541` (started by the `roster_tests` agent).
- Full output: `/private/tmp/parley-smoke-verified.log`.
- Latest inspected output passed causal/retry checks; no final result yet.
- The agent was instructed to stop monitoring and leave this isolated test process to finish. Do not start another full run just to recover its result; read the log first.

## Next action after resuming

Read the final smoke log and confirm the exit result. If all 839 checks pass, update the draft PR's validation paragraph (currently says final smoke rerun is pending), inspect available CI status, and mark the PR ready if appropriate. If a real failure remains, repair it within the current scope and rerun only justified checks. The implementation is already committed and pushed; this checkpoint is a separate documentation commit.

Do not merge or publish merely to complete the checkpoint. Keep the active user session on port 4141 untouched throughout.
