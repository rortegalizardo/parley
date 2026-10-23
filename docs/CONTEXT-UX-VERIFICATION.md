# Context retention and room UI verification

Date: 2026-10-23. Implementation delegated to Sol 6.1; primary agent performed browser QA. Port 4141 and its library are excluded from all actions.

## Checks completed during implementation

- Isolated browser: Parley logo exits the selected room; Home survives refresh; selecting a room restores the chat.
- One visible desktop New room control; selected recipient reads `@claude` without a roster count.
- Fourteen sequential fake-provider exchanges follow to the bottom. Scrolling up during a delayed reply preserves the reading position (scrollTop 4637 before/after), shows one unread message, and Jump to latest finishes at a zero bottom gap.
- Sol's focused isolated functional checks cover fresh/resumed Claude and Codex prompt delivery, decision CRUD, manual budget rejection, `/clear`, archive/restore, existing-agreement import, convergence reservations/deduplication, automatic overflow retention and launch blocking, historical run snapshots, malformed ledger errors, and synthetic documented Claude compaction events with duplicate/stale-event protection.
- Claude event schema checked against the published `@anthropic-ai/claude-agent-sdk` type declaration: `SDKCompactBoundaryMessage`, `type: system`, `subtype: compact_boundary`, metadata trigger/pre_tokens and optional post_tokens. Installed Claude 2.1.304 recognizes that event. Synthetic signal coverage does not claim a real paid session was compacted.
- Codex and Gemini internal compaction is explicitly reported as unavailable by these adapters; no inferred context-window percentage is shown.

## Additive Create room repair

Verified on actual 4142 at 1280×720 and 630×576:

- Separate Agents/Room views; normal New room opens Room, the four-agent CTA opens Agents.
- A single agent editor replaces mismatched four-card columns; all four seats remain individually selectable. Presets can be reapplied.
- Name, shared instructions and project settings belong to Room. Shared instructions persist through tab/preset changes and are available on the first provider turn.
- Name validation reveals/focuses Room rather than failing on a hidden input. Both two-agent and four-agent creation succeeded.
- Folder field/Browse replaces the old bare link. Header/footer remain visible and the configuration body scrolls; the narrow viewport Create button ends at y547 inside height576.

Local visual evidence (kept outside the public repository):

- [Four-agent editor](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/create-agents-4142.png)
- [Room configuration](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/create-room-4142.png)
- [Existing-room composer](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/chat-context-4142.png)

## Delivery status

4142 refreshed only after checking exact process ownership and every room idle. Final observed PID67612. Served script/style bytes match the checkout. Hashes of existing default/Test 4 room.json, state.json, transcript.md and events.jsonl stayed unchanged. The new independent context files are expected feature state.

Actual UI/API checks passed: pin/edit/add/remove; `/clear` preserves decisions and emits four reset notices; fresh Claude, fresh Codex and resumed Codex each receive the saved decision and shared instructions; documented synthetic Claude compaction emits a visible event. Four-agent convergence saves its agreement plus reservations; four subsequent parallel replies remain after the historical collapsed handoff. Reload/room navigation finishes at bottom gap0. No browser console errors observed. Temporary QA rooms are recoverable in Archived rooms; the isolated server was stopped.

Sol's create-room functional checks additionally passed atomic initial configuration, Work mode/project/provider settings, first-launch instruction delivery, invalid input rejection before directory creation and duplicate-room protection. Syntax checks and git diff whitespace checks passed. No new unit-test suite or paid provider calls were used.
