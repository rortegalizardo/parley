# Shared context editor and Markdown verification

Date: 2026-10-26. Implementation: Sol 6.1. Focused API and actual browser QA: primary agent. No unit-test suite was added or run.

## Delivered behavior

Agent standing instructions have Edit and Preview modes in Settings and Create room, including expanded editing. Preview and saved decision/context displays reuse the chat Markdown renderer, which escapes source HTML before applying supported formatting. Edit retains the original Markdown source.

The Context tab shows the current shared brief, its version and character budget, editor phase, participating agents and verdicts, changes, and full version/source history. Long review notes and source reasoning are collapsed; exact questions and surviving message/review provenance stay attached to sources. The modal keeps a fixed header/footer and scrolls internally. The complete active brief has its own bounded scrolling area, keeping update status and history within reach without truncating its text. A failed update leaves the prior approved brief visible; existing rooms expose Update context and Retry.

A temporary Claude Sonnet editor proposes a cohesive brief. The default run permits two review rounds, bounded to `2 × (1 + reviewer count)` calls. Every room agent must explicitly approve the same exact draft hash before activation. An objection leads to revision within the bounded run. Exhausting the rounds retains the previous approved context and records the rejected attempt.

Retry includes the prior unapproved draft and review feedback, including earlier reviewed rounds when a later attempt has incomplete reviews. It requires fresh approvals. A sleeping reviewer fails the update before any model call; the agent must be woken before retrying. Stop cancels the live child process. Source/settings/roster changes invalidate an in-flight update rather than permitting stale activation.

Incremental editing supplies the previous approved brief with additions/edits and explicit user source changes. Complete sources remain in each run's snapshot, with original questions, provenance, reasoning, and reservations where available. Change entries account for kept, combined, replaced, and explicitly removed sources; replacement claims require replacement source references. Earlier briefs and source edit/delete history remain available. Legacy sources without an exact surviving initiating-question link are labeled unavailable rather than assigned an invented question.

A pending additive source does not replace approved context. Editing or deleting a source underlying the active brief marks it stale and requires a successful regeneration before ordinary agent turns can continue. Oversized input/output or room context budgets fail explicitly; no source is silently truncated or activated.

## Focused isolated API verification

| Check | Result |
| --- | --- |
| Accepted context update | Passed; reviewed brief activated. |
| Rejected context update | Passed; previous active brief remained deeply equal. |
| Explicit Retry | Passed; activated version 2. |
| Attempt history | Passed; all three runs retained. |
| Automatic convergence handoff | Passed; convergence triggered the editor and unanimous activation, preserving the source question. |
| Stop | Passed; live child terminated in 58 ms. |
| Ordinary-turn prompt boundary | Passed; normal Claude turn received the approved brief, without full archived source bodies or the newly pending manual-source marker. An additive pending source did not block the ordinary turn. |

## Actual 4142 browser verification

The primary agent verified the running application on port 4142 using a disposable QA room.

| Check | Result |
| --- | --- |
| Settings instruction Preview | Headings, bold text, and lists rendered correctly. |
| Create room instruction Preview | Headings, bold text, and lists rendered correctly. |
| Unsafe source HTML | Script text escaped; zero injected script nodes. |
| Return to Edit | Exact original Markdown source preserved. |
| Expanded Create room editor | Modal measured 760 × 692; no overflow outside its scrolling area. |
| Settings layout | Screenshot shows an 820-pixel-wide Settings modal with internal scrolling. |
| Context Update | Reviewed active brief displayed. |
| Rejection and Retry | Previous brief remained; retry activated version 2. |
| Reload and history | Active context persisted; earlier attempts/versions remained inspectable. |
| QA cleanup | Disposable QA room archived. |

Local screenshot: [Agent Markdown preview on actual 4142](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/agent-markdown-preview-4142.png).

Original core room config, state, transcript, and event files remained byte-identical after refresh. Saved context was backed up before migration. Port 4141 was not accessed or changed. Last observed actual 4142 PID was **49606**; this observation does not authorize a later signal without a fresh ownership/activity check.

## Real Factory M1–M2 run

**Passed.** Brief version 1 is active at **12,161 / 24,000 characters**, approved by all three room agents—Claude, Codex, and moderator—against the exact same text hash.

Three live attempts consumed 20 calls: eight calls in each of two rejected attempts, followed by four calls to unanimous approval in the third attempt’s first review round. Earlier rejections identified concrete preservation issues; they did not activate their candidates. The successful retry retained feedback and obtained fresh approvals.

Both original decision IDs and exact text remain intact. Complete attempt history and source snapshots remain available. The primary agent visually verified source questions and provenance in the real room’s history.

Original core config/state/transcript/events remained byte-identical; only the context ledger changed to save the reviewed brief and complete history. An actual restart between attempts preserved the saved context byte-for-byte. An independent isolated actual-server restart also preserved its approved brief and full history.

Served CSS and JavaScript match the checkout. Browser error logs are empty. The real active brief has a 302-pixel scrolling viewport for 3,221 pixels of content, with zero horizontal overflow and no text truncation.

Local screenshot: [Reviewed shared context on actual 4142](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/reviewed-context-4142.png).

## Delivery status

JavaScript syntax and whitespace/diff checks passed for the UI changes. No unit suite was run. Implementation and primary-agent QA are complete. Direct main delivery; no new PR.
