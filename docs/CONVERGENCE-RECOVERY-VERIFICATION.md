# Foreground errors and convergence recovery

2026-10-26. Sol 6.1 implemented; primary agent reviewed and verified.

## Findings and fixes

Native modal dialogs render above ordinary document layers. Moving the existing toast into the foremost modal fixes both its visual stacking and live-region accessibility; raising z-index alone would not. Closing dialogs restores the toast to the previous modal or document body without moving focus or changing form values.

A provider returned an explicit blocking objection as an object with `disputedClause` and `requiredChange`. The parser accepted only a string and misclassified it as an invalid review. Both forms are now supported; structured fields must be nonempty strings, and the exact run/version/draft envelope is still required. Objections remain blocking, never approvals. The prompt describes the supported schema.

Saved invalid reviews are projected through the corrected parser for an accurate explanation without state writes or model calls. An accepted Resume action persists validated recovery and continues from saved progress. Specific budget/restart failure reasons remain intact. Current incomplete cards show their cause and Resume action before optional evidence and a safely rendered Markdown draft.

## Verification

- Focused isolated functional fixture: three seats with a saved 7/11 run, two approvals and one structured objection. Resume spent exactly four calls (revised draft plus three reviews), retained the original votes, and reached agreement only on draft 2 at 11/11.
- Fresh fake-provider run: structured Codex objection automatically triggered revision and unanimous approval at 8/8, without manual intervention.
- Wrong run/version/hash and incomplete objection objects rejected. Read-only recovery did not modify state or invoke providers; rejected Extend did not persist recovery.
- Primary independent check against the real saved review recovered the blocking objection, retained both other votes, rejected mismatched identities, and left the source bytes unchanged.
- Isolated browser check: duplicate room error stayed crisp above the native Create room dialog; `#toast` belonged to `#newRoomDialog` with assertive announcements. Closing restored body ownership. Settings → Context → Add decision moved the toast into the nested native dialog; closing restored settings, then body.
- Actual 4142: both rooms were idle before graceful refresh. Config, state, transcript and event hashes stayed identical through refresh. Served JS/CSS exactly match the checkout (`86a0454aff848d9c26d5`). Duplicate-name error visibly appeared above the modal with form values preserved and no room created.
- Actual stalled conversation: after the user requested continuation toward consensus, Resume reused the saved objection and completed draft 2. All three agents approved; two nonblocking reservations remain recorded. Four new calls were used; final total 13/15 includes earlier attempts made before this repair. No synthetic approval or manual content rewrite occurred.
- Syntax and whitespace checks passed. Temporary isolated servers were stopped. Port 4141 and its library were untouched during this repair.

## Local evidence

These screenshots stay local and are not uploaded into the fork:

- [Foreground error on actual 4142](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/foreground-toast-4142.png)
- [Actual revised handoff approval record](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/recovered-handoff-4142.png)

Incomplete remains a truthful state for failed or invalid provider responses. Unresolved remains truthful when review limits end with objections; the application does not invent consensus.

## Follow-up: readable agreed handoffs and Parallel routing (2026-10-26)

The agreed system-message branch still escaped Markdown and inherited centered system-message styling. It now uses the normal safe chat renderer and left-aligned bubble typography. Approval metadata is retained. The isolated browser fixture verified real headings, bold text, lists, code, links, reservation text and escaped script literals (zero script nodes). Actual existing handoffs on 4142 rendered left-aligned with paragraphs and lists.

The browser previously sent discussionMode only when its local recipient resolved to all agents. Auto could inherit the prior all-agent destination on the server, omitting Parallel and falling back to convergence. Every ordinary message now carries the mode captured at send time, before asynchronous attachments. Server defaults and historical message policies are unchanged.

Sol 6.1 ran the focused `test/discussion-mode.mjs` API scenarios. Its browser tools were unavailable/unapproved, so primary-agent CUA verification covered actual 4142: initial convergence, plain Auto inheriting all with Parallel, reload preserving the selection, typed @all, the all-agent chip, and switching back to Converge. Persisted roots 1 and 15 were converged; roots 3, 7 and 11 were parallel with separate replies. Exactly two handoffs existed. All QA calls used fake providers in a disposable room, later archived.

The actual served assets matched the checkout (`ff467a409fe527635961`), user-room file hashes stayed unchanged, and final browser error logs were empty. Port 4141 was untouched. Syntax and whitespace checks passed.

[Readable existing handoff on 4142](/Users/ortega/.codex/visualizations/2026/10/22/01a162db-d623-7650-af95-27d4e26e8a8b/readable-handoff-4142.png)
