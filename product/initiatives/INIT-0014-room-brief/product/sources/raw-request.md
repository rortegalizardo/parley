# Room Brief — product brief for the PM (session local_6d… room-brief)

Project: Parley, `/Users/ortega/Desktop/Projects/parley` (main branch, ahead of origin; no product/ tree yet; not in the Factory registry).
Requester: Ricardo. Decisions below are ALREADY MADE by the requester via the room "Parlay Product Evolution" (step 3 of its agreed decision). Do not re-ask them. No approval stops: plan, edit, commit, merge without asking. Only a genuinely new product question that blocks the work may be escalated, as one plain-English question.

## Problem
Room direction and room instructions (room note) overlap and clash. A goal in Direction was not known to agents, but the same text in the room note was. Today: room note sent in full only when short, else a reminder line; direction sent in full once per session then a one-line reminder (`parley.mjs` ~3195-3240: `noteBlock`, `roomNoteBlock`, `directionBlock`). See `CHECKPOINT.md` top entry and `docs/ROOM-BEHAVIOR.md`.

## Decision to build
Room Settings becomes one Room Brief. Every agent gets the whole brief, in full, on every turn.
- One Room Brief in Room Settings, three parts:
  - Goal — what the room should achieve; short; asked for at room creation / brief save.
  - Rules — how agents behave and work together.
  - Decisions — added by pinning a converged message (as pinning works today); can be archived; archived ones stay saved but are not sent to agents.
- Per-agent instructions stay separate in each agent's settings.
- One saved copy per part; no duplicate fields; no hint text telling users to repeat the goal.
- Delivery: whole brief in full every turn; edits apply on each agent's next turn, no restart.
- Length: guide ~2,000 chars (~500 tokens), not a hard limit; past it Room Settings warns and suggests archiving decisions or trimming rules. Never cut or delete automatically.
- One wording for the brief: it is the user's standing direction and rules; if a rule conflicts with the goal or a decision, agents must flag it, not quietly pick one.
- "What agents see" preview showing the exact text sent; a timeline note per edit, e.g. "Brief updated: Goal".
- Migration: old direction goal → Goal, pinned items → Decisions, old room note → Rules; keep all content as is; if the same text is in several places, suggest a merge (never require it). Never reject a migrated room for lacking a Goal.
- Out of scope: agent-suggested decisions (deferred). Only the user edits the brief.

## Done means
A new and an existing agent can each repeat the current goal, decisions and rules, also after an edit and after compaction/session restart; the goal never has to be copied into Rules.
Testing: one quick prompt check that the full brief is in the prompt after a session restart, plus one manual repeat of the user's test room. Nothing more (no new unit/smoke suites).

## Constraints
- Read `CHECKPOINT.md` first. Never restart or touch the live server on port 4142; never use 4141. Test on an isolated port.
- Dependency: separate engineering session "brief-delivery" (local_5fb163ad-9778-47b9-bf0e-62dda273994f) is changing `parley.mjs` delivery so direction/note go in full every turn (removing reminder lines near `parley.mjs:3209`/`:3225`). Product definition/design first; engineering must rebase on that work after it lands on main before touching delivery code.
- Parley's UI is plain `ui/index.html`, `ui/app.js`, `ui/styles.css` (no React/Storybook). Design at 1440, light only. Keep design proportionate: one settings surface change, not a multi-page redesign.
