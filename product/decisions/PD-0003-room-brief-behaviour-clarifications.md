---
id: PD-0003
type: decision
title: Room Brief behaviour the requester left open — decided by the product manager
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

# PD-0003 — Room Brief behaviour the requester left open — decided by the product manager

## Context

[PD-0002](PD-0002-room-brief-requester-decisions.md) fixes what the Room Brief
is. Ten details it leaves open would otherwise be invented by an
implementing agent. Each choice below keeps PD-0002's outcome intact and
contradicts nothing in `project/constraints.md` or `project/principles.md`
(`product-manager-orchestrator` §4.1), so none was escalated.

## Decision

1. **Goal "asked for".** In the Create room dialog the Goal is required:
   Create stays disabled until the Goal has non-blank text. Everywhere else an
   empty Goal is allowed: a migrated room, a room created without that dialog
   (API, MCP bridge, runner, the default room), and a brief saved in Room
   Settings with the Goal cleared. There the Goal field shows the ask
   "No goal yet. Add one so every agent knows what this room should achieve."
   Nothing is ever rejected for an empty Goal outside the Create room dialog.
2. **Tidy stays** as a user-triggered suggestion (one Claude Sonnet call, as
   today) that proposes a shorter Goal and a shorter list of active Decisions.
   It never changes Rules or archived Decisions. The suggestion loads as an
   unsaved edit. On Save, each active Decision whose exact text is not in the
   suggestion moves to Archived (kept, never deleted), and each suggested line
   that is not an existing active Decision becomes a new active Decision.
3. **Decisions.** The user can edit an active Decision's text, archive it,
   restore an archived one (it returns to the end of the active list), and
   delete an archived one after confirming. An active Decision cannot be
   deleted without archiving it first. Each Decision stays at most 200
   characters (today's limit). Active Decisions are listed in the order added;
   archived ones newest-archived first.
4. **The wording agents receive** (exact copy; `{goal}`, `{rules}` and
   `{decision n}` stand for the saved text):

   ```
   Room brief — the user's standing direction and rules for this room. Follow it on every turn. If a rule conflicts with the goal or a decision, say so and ask the user; do not quietly pick one.

   Goal: {goal}

   Rules:
   {rules}

   Decisions:
   - {decision 1}
   - {decision 2}
   ```

   An empty Goal is written `Goal: none set`, empty Rules `Rules: none`, no
   active Decisions `Decisions: none`. Archived Decisions never appear.
5. **The length guide** counts the characters of the Goal, the Rules and every
   active Decision, summed. Parley's fixed wording and the headings are not
   counted; archived Decisions are not counted.
6. **"The same text in several places"** means: after collapsing whitespace
   and ignoring case, the Goal or an active Decision of at least 20 characters
   appears inside the Rules, or the Goal equals an active Decision.
7. **`/note`** keeps its current behaviour and acts on Rules.
8. **Timeline note per edit.** Every saved change to the brief, from any
   path (Room Settings Save, Pin, Tidy save, archive, restore, delete,
   `/note`), adds one system note to the room conversation naming the changed
   parts in the order Goal, Rules, Decisions — "Brief updated: Goal",
   "Brief updated: Goal, Rules", "Brief updated: Decisions". The note starts no
   agent turn.
9. **Limits.** Only today's per-field limits stay, so every migrated room
   fits as is: each Decision at most 200 characters, Rules at most 8,000
   characters (today's room-note limit), the Goal at most 2,000 characters
   (the most today's whole direction could hold). The number of Decisions is
   not limited. Today's 2,000-character cap on the whole direction is removed:
   2,000 becomes the guide of item 5, never enforced.
10. **The old saved brief** (retired before this initiative, never sent) stays
    viewable, read-only, from the Room Brief, as it is today from the
    Direction tab. Its "copy anything still useful" note names the Room Brief.

## Options considered

| Option | Why not |
| --- | --- |
| Goal required everywhere | Contradicts "never reject a migrated room for lacking a Goal" and would break rooms created by the API, MCP bridge or runner. |
| Goal never required, only prompted | The requester's "never reject a migrated room" implies new rooms are asked firmly; the Create room dialog is the one place the user is always present. |
| Retire Tidy | Removes a user-triggered aid the requester has today, unasked. |
| Let Tidy delete Decisions it merges | Conflicts with "never cut or delete automatically" and "archived ones stay saved". |
| Delete active Decisions directly (today's ×) | An archive exists to keep decisions; deleting in one click loses them. |
| Count Parley's fixed wording toward the guide | The guide is about the user's text; the wording is the same in every room. |
| Keep the 2,000-character cap on the whole brief | The requester made 2,000 a guide, "not a hard limit". |
| A new, shorter Goal limit | Migration keeps content as is; a migrated goal could be cut. |

## Consequences

Costs: Tidy now has to archive what it drops, and Create room gains a
required field. Benefits: no empty-Goal rejection anywhere it would break
existing rooms; nothing the user saved disappears without an explicit delete
of an archived Decision.
