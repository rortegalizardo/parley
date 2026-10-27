# Routing and listening verification

Verified 2026-10-26. Tests used disposable rooms and isolated fake-provider servers; existing room transcripts and settings were preserved.

| Evidence | Result |
|---|---|
| Independent three-seat routing check | `@claude @codex` produced two direct replies, consumed both routing tags, and excluded the moderator. Auto retained the subset. A peer `@moderator` could not escape its scope. Sleep/wake recovery retained that audience. |
| Actual running UI on port 4142 | Prefix preview displayed Claude + Codex. Sending produced two direct replies and no moderator invocation. |
| Real Sonnet moderator, healthy discussion | Passed without adding a generic answer or architectural opinion. |
| Real Sonnet moderator, concrete deployment drift | Identified the specific scope violation and requested a narrow correction within its moderator role. |
| Real Sonnet moderator, corrected scope on resumed session | Passed, confirming the role gate also held after session resumption. |
| Isolated group routing fixture | `@all` Parallel addressed active speakers and assessed the listening moderator; explicit moderator addressing remained direct. Group Ask preserved listening and group Retry rejected a direct moderator retry. All-listening groups returned actionable refusal. |
| Isolated convergence fixture | Listening moderator had `reviewOnly` metadata, supplied no independent position or draft, and received only a review call. Explicit valid approval completed agreement; `[pass]` produced an unresolved review and incomplete outcome. |
| Served UI/server compatibility | Immutable served script and server both required runtime protocol 15. |

Reproduce the focused checks with `node test/recipient-routing.mjs`. They also cover subset metadata, pass receipts, role instructions, and explicit listener addressing. Existing `node --test test/convergence-integrity.mjs` passed all seven checks. Source syntax checks and `git diff --check` passed.

The existing `test/multi-agent.mjs` suite stops at an unrelated stale fixture expecting more than four seats; current room validation allows at most four. That fixture did not validate this change.

Listening remains model judgment. Mechanical tests establish audience boundaries and approval integrity; the real-model checks establish observed role behavior in the scenarios above. A pass advances context without becoming speech or approval.
