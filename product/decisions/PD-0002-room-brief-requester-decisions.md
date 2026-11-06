---
id: PD-0002
type: decision
title: Room Settings becomes one Room Brief — Goal, Rules, Decisions — that every agent gets in full on every turn
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0014, CAP-0001]
supersedes:
superseded_by:
---

# PD-0002 — Room Settings becomes one Room Brief — Goal, Rules, Decisions — that every agent gets in full on every turn

Decided by the requester (Ricardo) in the room "Parlay Product Evolution",
step 3 of its agreed decision; recorded from
[the raw request](../initiatives/INIT-0014-room-brief/product/sources/raw-request.md),
"Decision to build". Final: not re-asked
([run instructions](../initiatives/INIT-0014-room-brief/product/sources/run-instructions.md)).

## Context

The room direction and the room note overlap and clash: a goal in Direction
was not known to agents while the same text in the room note was. The note is
sent in full only when short; the direction once per session, then as a
reminder ([CAP-0001](../capabilities/CAP-0001-room-shared-context.md)).

## Decision

1. One **Room Brief** in Room Settings, in three parts:
   - **Goal** — what the room should achieve; short; asked for at room
     creation / brief save.
   - **Rules** — how agents behave and work together.
   - **Decisions** — added by pinning a converged message (as pinning works
     today); can be archived; archived ones stay saved but are not sent to
     agents.
2. Per-agent instructions stay separate in each agent's settings.
3. One saved copy per part; no duplicate fields; no hint text telling users to
   repeat the goal.
4. Delivery: the whole brief in full every turn; edits apply on each agent's
   next turn, no restart.
5. Length: a guide of about 2,000 characters (about 500 tokens), not a hard
   limit; past it Room Settings warns and suggests archiving decisions or
   trimming rules. Never cut or delete automatically.
6. One wording for the brief: it is the user's standing direction and rules;
   if a rule conflicts with the goal or a decision, agents must flag it, not
   quietly pick one.
7. A "What agents see" preview showing the exact text sent; a timeline note
   per edit, e.g. "Brief updated: Goal".
8. Migration: old direction goal → Goal, pinned items → Decisions, old room
   note → Rules; keep all content as is; if the same text is in several
   places, suggest a merge (never require it). Never reject a migrated room
   for lacking a Goal.
9. Out of scope: agent-suggested decisions (deferred). Only the user edits the
   brief.

Done means: a new and an existing agent can each repeat the current goal,
decisions and rules, also after an edit and after compaction / session
restart; the goal never has to be copied into Rules. Testing: one quick prompt
check that the full brief is in the prompt after a session restart, plus one
manual repeat of the user's test room; no new unit or smoke suites.

## Options considered

| Option | Why not |
| --- | --- |
| Keep the room note and the room direction as two separate things | The overlap is the problem: the user cannot tell which one agents hold. |
| Send the direction once per session with reminders | Depends on what a session still remembers; fails after compaction or restart. |

## Consequences

Costs: every agent turn carries the whole brief, so a long brief costs tokens
on every turn — hence the 2,000-character guide and the archive. The room note
and direction stop being separate things, so their UI and delivery code change.
Benefits: one place to write standing context; agents hold it regardless of
session memory; nothing the user saved is lost.
