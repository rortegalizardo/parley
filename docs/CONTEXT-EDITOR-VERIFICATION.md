# Shared context editor and Markdown verification

Date: 2026-10-26. Implementation: Sol 6.1. Focused API and actual browser QA: primary agent. No unit-test suite was added or run.

## Delivered behavior

Agent standing instructions have Edit and Preview modes in Settings and Create room, including expanded editing. Preview and saved decision/context displays reuse the chat Markdown renderer, which escapes source HTML before applying supported formatting. Edit retains the original Markdown source.

The Context tab shows the current shared brief, its version and character budget, editor phase, participating agents and verdicts, changes, and full version/source history. Long review notes and source reasoning are collapsed; exact questions and surviving message/review provenance stay attached to sources. The modal keeps a fixed header/footer and scrolls internally. The complete active brief has its own bounded scrolling area, keeping update status and history within reach without truncating its text. A failed update leaves the prior approved brief visible; existing rooms expose Update context and Retry.

A temporary Claude Sonnet editor proposes a cohesive brief. Context revision rounds default to **No limit**, including existing rooms without an explicit setting. In Room settings → Context, `contextRevisionRounds: 0` means unlimited; integers 1–999 limit review rounds per update or continuation batch. Unlimited updates continue until unanimous approval, Stop, a provider/input/size failure, or stale sources/settings. There is no hidden two-round or provider-call ceiling. Every room agent must explicitly approve the same exact draft hash before activation. Finite exhaustion reports **Revision limit reached**, retaining the previous approved brief and all draft/review history. Three automatic size repairs per batch remain a separate bound.

Every revision uses the immediately preceding unapproved draft and its feedback. **Continue update** starts another batch with the configured limit and the latest same-source rejected/stopped/interrupted draft; all reviewers must approve afresh. When review was stopped partway through a candidate, the preceding full round’s feedback remains available too. Only the latest candidate and bounded feedback enter model input; the full attempt history remains on disk. Changed source snapshots start from the approved brief and current canonical sources, without reusing a stale rejected proposal. A sleeping reviewer fails the update before any model call; the agent must be woken before retrying. **Stop update** cancels only the context editor’s live child process and retains the latest draft/feedback; ordinary room work is unaffected. Source/settings/roster changes invalidate an in-flight update rather than permitting stale activation. Changing only the revision limit applies to the next batch; it does not alter the running update. Update/Continue and the normal Settings Save both save the displayed limit; a separate Save limit action is also available. Server restart never automatically replays interrupted or rejected updates.

Incremental editing supplies the previous approved brief with additions/edits and explicit user source changes. Complete sources remain in each run's snapshot, with original questions, provenance, reasoning, and reservations where available. Change entries account for kept, combined, replaced, and explicitly removed sources; replacement claims require replacement source references. Earlier briefs and source edit/delete history remain available. Legacy sources without an exact surviving initiating-question link are labeled unavailable rather than assigned an invented question.

A pending additive source does not replace approved context. Editing or deleting a source underlying the active brief marks it stale and requires a successful regeneration before ordinary agent turns can continue. Oversized editor output or rendered context automatically requests a shorter draft within the three-repair budget. Input/transport limit failures and exhausted repairs fail explicitly; no source is silently truncated or activated.

## Automatic brief shortening — isolated verification (2026-10-26)

Deployment status: **actual 4142 refresh and live QA passed** after the user's work became idle. Refreshed process PID: **57614**; recheck process ownership/activity before any later signal. Direct main delivery; no PR.

Oversized proposals now trigger at most three automatic repairs per run before room review. Repairs preserve canonical source inputs and reviewer feedback, with complete source coverage checked again before review. History records size reasons, hashes, lengths and repair outcomes. Proposals within the 60,000-character JSON parsing bound remain available in history; larger responses retain metadata and trigger a fresh shorter draft from intact sources. If an oversized proposal cannot fit alongside canonical input within the 180,000-character prompt ceiling, only that unsafe proposal is replaced with explicit metadata. Activation still requires every room agent's approval of the exact fitting candidate hash.

12,000 characters is a soft upper bound, never a fill target. The editor must produce the shortest faithful brief proportional to the material without padding shorter content.

Primary-agent isolated API fixture: `/private/tmp/parley-auto-shortening-validation.mjs`.

Actual 4142 verification used the disposable **QA Automatic Shortening** room with fake provider CLIs for fault injection; no paid model calls were needed. The first fake Sonnet draft exceeded the text ceiling. Parley automatically repaired it, then both room agents (writer via the Claude adapter and reviewer via the Codex adapter) approved the exact repaired hash. The 86-character brief activated after two editor calls (one repair) and two review calls, without a Retry click or manual intervention. The oversized original remained in history. The QA room was archived. Existing context ledgers stayed byte-identical across refresh, and original room config/state/transcript/events remained unchanged.

| Check | Result |
| --- | --- |
| Text exceeds 22,000 characters | Passed; two editor calls, then two room reviews and activation. |
| Full rendered context exceeds 24,000 characters | Passed; two editor calls, then two room reviews and activation. |
| Response exceeds 60,000-character parsing bound | Passed; bounded metadata/source re-draft, two editor calls, two room reviews and activation. |
| Small valid brief | Passed; 86-character brief stayed unchanged, one editor call. |
| Valid brief above soft guidance | Passed; 14,026-character brief needed no repair, one editor call. |
| Persistent oversize | Passed; four editor calls total (initial plus three repairs), zero reviewer calls; previous approved brief remained deeply equal. |

Implementation fixture `/tmp/parley-compression-check.mjs` also passed source-coverage rejection, reviewer-objection revision after compression, and the safe proposal-metadata fallback alongside a 130,000-character canonical input. Syntax checks and `git diff --check` passed. No broad unit suite was added or run.

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


## Configurable revision rounds — focused verification (2026-10-27)

`node test/context-revision-rounds.mjs` passed: an absent limit reached unanimous approval at round five after 20 calls; finite two-round exhaustion preserved the old attempt and continued from its latest draft/feedback; stopped partial reviews retained prior full-round objections; restart projection made no mutations; changed sources discarded stale retry proposals; unlimited review preserved the independent three-repair size bound. New calls expose `unlimited: true` and `planned: null` rather than serializing Infinity. UI shows actual calls and unlimited rounds, or a finite per-batch count including reserved size-repair capacity.

Independent isolated HTTP verification also passed finite two-round exhaustion, a five-round unlimited continuation exceeding the former call cap, latest-draft/feedback input on every revision, preserved history, fresh unanimous reviews, and scoped Stop retaining the approved brief. No live user-room regeneration or provider calls were used for these checks.

Actual port-4142 Context UI verification passed with a disposable two-provider fake-CLI fixture and no paid model calls. The normal bottom Settings Save persisted a two-round limit across server refresh; Update stopped at **Revision limit reached** after round two. Changing the displayed limit to `0` and clicking Continue without Save persisted `0`, carried the latest draft and feedback through five additional rounds and 15 calls, and activated only after both agents approved the exact candidate. The previous finite attempt remained intact. On a separate unlimited update, UI Stop at round two/call four produced **Update stopped**, kept Continue available, and left the approved brief unchanged. Existing user context files remained unchanged across refresh. The revision field and Save limit button share a compact row above the brief.
