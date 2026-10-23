# UX repair verification — 2026-10-23

Implementation: Sol 6.1 workers. Review and hands-on browser QA: primary agent. Direct delivery to the fork main branch; no new PR.

## Delivered

- Reusable two/four-agent presets, Custom indicator after membership changes, explicit four-agent cap in create/settings/API, preserved legacy larger rosters.
- Work-mode checkbox without automatically assigning the second agent as listener.
- Correct selected-room empty state; marketing welcome only when no room is selected.
- Separate General settings and room Agents/Room tabs; one selected agent editor, expandable instructions, advanced fields and accessible field guidance.
- Searchable model/effort menus reopen with all choices; custom values remain supported. Agent selector and pill descriptions show configured provider/model/effort.
- Removed header New conversation; slash discovery includes /clear and /archive. Both use in-app confirmations. Archived rooms can be restored, including default.
- Shared handoff progress is inside the scrolling conversation rather than the composer.
- Codex Fast mode persists per agent; explicit fast/default invocation overrides inherited settings on fresh and resumed turns.

## Checks actually performed

No unit-test suite was added or run. Syntax and whitespace checks passed. Focused isolated API checks covered four/five-agent acceptance/rejection, legacy roster preservation/reduction, archive listing/restoration, collisions, traversal rejection, busy-room rejection, default remaining archived across restart, and transcript/config/native-session preservation. Offline installed Codex accepted both service tier values. Fake-provider invocation output verified fast and default arguments with native resume retained; four fake agents completed convergence.

Hands-on in-app-browser checks used a disposable server and data: added a third agent then reapplied two-agent preset, applied four-agent preset, verified the disabled fifth-agent action, changed Opus to Sonnet from a reopened full menu, created a four-agent room, edited instructions and switched agents without losing drafts, saved Fast mode, switched Room/Agents tabs, viewed slash choices, canceled then confirmed /clear, archived rooms including the last default, saw the no-room welcome, and restored a room through the Archived rooms list. Native confirmation blocked the first browser attempt; it was replaced with the in-app dialog and the cancel/confirm flows passed afterward. Argument checks initially parsed the fake provider output incorrectly; corrected parsing verified the actual emitted arguments.

## Actual 4142

The idle fork listener was verified by exact command and launcher link before refresh. Updated listener observed PID 62963. Never signal this recorded PID without fresh ownership verification.

Both original rooms, default and Test 4, retained byte-identical room.json, transcript.md and events.jsonl files (six hashes). No QA messages, settings saves, clear or archive operations were performed in either original room. Browser inspection on 4142 confirmed the separate settings tabs, large editor, Fast choice, explicit agent identities, General settings and scrolling handoff. Browser error log was empty. Served app.js and styles.css matched the final checkout bytes. Native Parley MCP still listed both rooms after refresh.

Browser viewport checks covered the 1280-wide isolated view and the narrower actual desktop panel. Other device sizes were not exhaustively exercised. Screenshots of existing user rooms are retained locally, not committed to the fork.

Port 4141 and its library were not contacted, signaled, restarted or modified.

## Session questions

See [Room behavior](ROOM-BEHAVIOR.md) for persistent native sessions, recovery excerpt limits, provider-owned compaction, Talk/Work permission differences and Auto routing. This change explains existing context behavior; it does not add context usage or compaction telemetry.
