# Room behavior

## Context and sessions

Each seat has an independent native CLI session and a persisted cursor in `state.json`. Claude uses `--resume`, Codex uses `exec resume <thread>`, and Gemini uses `--resume <uuid>`. Parley launches a CLI process per turn and resumes that native session; it does not keep one CLI process running forever. Stable session IDs and cursors survive a server restart. A provider that omits a stable ID can fall back to its latest session, with a warning.

Ordinary resumed turns receive room entries after that seat's cursor, filtered for delivery rules, plus current instructions and the new message. Parley has no token budget or truncation limit on this unseen delta. A seat absent for many messages can therefore receive a large next prompt. The provider still has its own context window and compaction behavior; Parley does not measure remaining context, control compaction, or guarantee that every earlier detail remains available to the model.

Fresh/recovered sessions receive a briefing and recent history excerpt: at most 6,000 characters across 40 eligible entries, with each entry capped at 1,600 characters. This is an excerpt, not a full-history replay. The room transcript remains on disk, and the briefing tells the agent to consult it when omitted decisions matter. Protected turns can deliberately use isolated fresh sessions. Receipts prevent a restored/older cursor from blindly replaying already delivered history.

Changing project folder, seat instructions, effective permission scope, Codex sandbox, or applicable Talk/Work mode starts a fresh session for affected seats. Renaming a scratch room also changes its working directory and resets native sessions. `/clear` starts a new conversation and resets every seat's session/cursor while retaining timestamped prior transcript/event files. Archive room instead preserves the whole room, including its current transcript, config, cursor and native session references; restoring puts it back at its original path. The CLI must still have the referenced session on disk.

Source: [provider capabilities, `loadRoom`, `historyTail`, `composePromptDelivery`, config route and lifecycle functions](../parley.mjs).

## Talk, Work and Auto

Talk uses conservative provider permissions. Work enables the workspace editing policy; provider settings and trusted external CLI configuration still matter. Addressing all agents in a Work room is framed as discussion rather than a shared work order. Protected reviewer/listener turns have provider-specific restrictions; resumed Codex discussion restrictions also depend on workflow instructions.

Auto selects the normal responder from the last-addressed seat and room default; it is a routing choice, not a reasoning level or unlimited autonomy. Explicit `@name` and `@all` choose recipients. Automatic turns are a separate follow-up allowance: new rooms allow four additional provider starts by default; 0 disables those follow-ups and Until settled remains bounded by an emergency ceiling. Existing rooms retain their saved allowance.

Source: [`handleUserMessage`, `defaultConfig`, relay scheduler and provider adapters](../parley.mjs).

## Rosters, archives and Fast mode

New rooms and additions support at most four seats. Existing larger rosters are not silently trimmed; settings can retain or reduce them. Transcript authors retain their original seat names after removal.

Archive room moves an idle room into `.archives`, removes it from active rooms and offers Restore. A busy/queued room must finish or stop first. Default can be archived and stays absent across restarts. Restoring a name already used by an active room fails until that room is renamed. Earlier deleted rooms remain in `.trash` and are not relabeled as archives. `/archive` archives the selected room; `/clear` clears its conversation.

Codex Fast mode is per seat: `serviceTier: "fast"` passes `-c service_tier="fast"`; off persists `"default"` and explicitly passes that value after Extra CLI args, overriding inherited Fast defaults. It applies on fresh and resumed turns without discarding the native session, because service tier is a new-turn setting and does not alter the prompt contract. Account/model availability still determines whether Fast is offered by the provider. Local Codex 0.162.1 accepts both config values; the [official config reference](https://learn.chatgpt.com/docs/config-file/config-reference) documents Fast mapping to the priority request tier.
