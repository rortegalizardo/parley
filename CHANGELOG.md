# Changelog

## Personal fork — convergence and compact recipients

- `@all` defaults to independent positions, a shared draft, and unanimous version-bound approval before one handoff. Parallel replies remains available.
- Compact searchable agent selector, role-aware entries, review-round controls, and call usage replace the expanding recipient strip.
- Persisted positions/drafts/votes, explicit Stop/Resume/Extend, restart recovery without automatic provider calls, and honest unresolved/incomplete outcomes.
- Protocol 14 keeps old pages from sending incompatible requests.


Notable changes per published version. Dates are release dates on npm.

## 1.3.0-personal.0 — personal fork, unpublished

- Add and remove agents in Room Settings without losing conversation history or retained agents' sessions. Stage edits until Save, reject stale rosters and unsafe removals during active work, and reserve removed names to protect historical identity.
- Remove the fixed roster-size limit. Always show `@all` in the composer and update individual targets from the current roster; retain `@both` as a compatibility alias.
- Review all 15 interface surface groups. Theme Settings textareas, expand responsive settings cards, shorten select labels with full explanations, keep mobile navigation clear of Settings, constrain Queue popovers, fit long room names in the header, and improve conversation/menu/status styling in both themes. Add a screenshot-backed UI inventory and 15 additional browser checks.
- Put room creation on the opening screen and header, with a one-click Fable, Astra, adversary, and privacy template. Fix empty-room scrolling and compact-window header wrapping.
- Add `parley-mine` (also `npm start`): defaults to port 4142 and `~/.parley-fork`, reopens an existing fork, and refuses an occupied port instead of silently starting a second server.
- Rooms support individually named Claude, Codex, or Gemini agents. Choose each agent's model, supported effort, and persistent role instructions at creation or in Settings.
- Address a named agent directly, or use `@all` (`@both` remains compatible). Pair keeps one worker and one reviewer; other agents retain independent delivery lanes.
- Refresh the sidebar, participant header, menus, and room creation dialog for desktop and mobile, with readable light/dark colors for custom agent names.
- Keep same-provider processes and sessions separate, including targeted Stop and recovery when a CLI does not return a stable session ID.
- Add the [fork setup guide](docs/FORK.md), a [plain-language guide to upstream features](docs/CURRENT-FEATURES.md), and multi-agent/browser regression coverage.

## 1.2.1 — 2026-10-11

Two Claude Code fixes.

- **No false "not logged in" on first run.** When Claude Code keeps its login somewhere other than the credentials file Parley looks for, the setup check now asks `claude` for its login status instead of reporting a signed-in seat as signed out. (#7)
- **Claude keeps its session across discussion and work.** A Claude seat with Full access used to throw away its session whenever a protected turn ran (an `@both` discussion in a work room, a pair review, lurking), so the next ordinary turn started blank and re-read the room from history. Protected turns now use a separate Plan session that consecutive protected turns resume, and only crossing between the two starts fresh. In every other permission mode, one session serves both. Fewer re-briefs, fewer tokens. (#8)

## 1.2.0 — 2026-09-18

Durability, the settled interaction fixes, a third provider, and the first pass
at cost visibility.

- **Automatic turns, counted plainly.** New rooms allow four automatic provider starts per message after the initial requested replies. Listening, sibling attention, answer returns, catch-up and internal recovery all spend that allowance, including silent or failed attempts. The policy and usage survive Retry, Wake and restart; existing rooms retain their previous accounting until explicitly switched. The composer shows the allowance, and each reply explains what triggered it.

- **Survives what it used to die from.** A CLI that exits while Parley is still writing its prompt, a torn `state.json`, or a disk error in a background exchange each used to take down the whole server and orphan every running agent. Prompt writes, room state, attachment downloads and the detached exchange chains are now individually fault-tolerant, and agent processes are killed on every exit path rather than only on Ctrl+C.
- **Stop stops.** With one seat replying and nothing queued, the ■ button stops that response on the first click instead of opening a chooser; the ▾ beside it keeps every deliberate scope. The menu no longer rearranges itself under the cursor while it is open.
- **A message says what happened to it.** Discarded and interrupted messages keep their place, dim, and carry a per-seat status line — including a Retry for a delivery that never arrived. A stopped response is now a distinct, durable fact rather than reading as "never seen".
- **The queue can be held.** ⏸ pauses delivery without dropping, reordering or abandoning anything; work sent while held joins the queue; ▶ releases it in order.
- **Ask again and Redirect.** Every message carries a ↪ that asks about *that* message. On a busy seat, "Stop current & ask now" is one atomic request pinned to the response you were looking at, so nothing can slip in between the stop and the ask.
- **A third seat: Gemini.** Seats and providers are now separate, so a seat can be named anything and two seats can share one provider (Claude vs Claude). Existing rooms migrate by gaining one field and renaming nothing.
- **Knows what it costs and what it needs.** New rooms start with a bounded hop budget; the seat pill carries this conversation's token total; and a first-run doctor reports a missing *or unauthenticated* CLI with the fix, instead of failing on your first message.
- **Streaming costs what it should.** Live replies are broadcast as increments rather than resending the whole reply on every token.
- **A token diet, measured.** A burst of messages sent while a seat is busy now merges into one provider turn instead of one call each; a lurking seat's ~900-byte instruction block, the hop ground rules and a long room note are sent once per session and reminded thereafter (control tokens preserved verbatim); per-tool activity lines coalesce in the peer's delta; a Full-access lurker's reactions coalesce into catch-ups instead of resetting its session per exchange; and stopping a response also stops the peer's lurk on that exchange.
- **The live reply survives a reload.** A tab that opens or reconnects mid-reply now shows the text so far immediately, with the run's real phase and elapsed time, instead of "is thinking · 0s" and dots until the provider's next token. A seat that finished while the connection was down no longer keeps a ticking "is replying" bubble under its own finished reply, and a reply killed by New conversation can no longer stream into the fresh one. Codex replies that replace rather than extend their text are re-sent whole instead of spliced.
- **Faster where it is felt.** A corrupted or restored state file recovers each seat's read position from its delivery receipts instead of re-sending the entire room history as one prompt; state.json is no longer rewritten for every tool action; contended agent handoffs wake on events instead of polling; streaming long replies no longer rebuilds the whole live bubble every 90 ms; paging through scrollback prepends instead of re-rendering everything; and receipt dots refresh through indexes rather than linear scans, so a long room stays smooth during activity.
- **Accessible, and no longer dark-only.** Screen readers hear the transcript, menus and room actions work from the keyboard, the settings dialog traps focus, narrow windows keep their room navigation, and there is a light theme. Code blocks are syntax-highlighted.
- `--version`, a troubleshooting section in the README, and this changelog.

## 1.1.0 — 2026-08-10

- Guaranteed lurk catch-up: a listener that was busy when an exchange finished gets one coalesced catch-up rather than silently missing it.
- Causal agent relay: charged vs structural requests, free answer returns, and hop budgets persisted per user-message root so Wake and Retry resume the same budget.
- Per-message hop control in the composer, including Solo, with sticky per-room shortcuts.
- Image paste, drag-and-drop and a draft gallery in the composer.

## 1.0.2 — 2026-08-08

- Published under `parley-room` after the `@auspex0` scope was retired.

## 1.0.1

- First public release.
