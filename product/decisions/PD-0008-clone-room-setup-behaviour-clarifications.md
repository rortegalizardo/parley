---
id: PD-0008
type: decision
title: Clone room setup behaviour the requester left open — decided by the product manager
status: superseded
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0015, CAP-0002]
supersedes:
superseded_by: PD-0010
archived_on: 2026-11-06
---

# PD-0008 — Clone room setup behaviour the requester left open — decided by the product manager

Decided by `ROLE-product-manager` under §4.1 (clarifications that do not
change the user-visible outcome of
[PD-0007](PD-0007-clone-room-setup-requester-decisions.md) and contradict no
constraint, principle or accepted `PD-`). Each item answers one row of the
INIT-0015 Ambiguity log.

## Context

PD-0007 fixes what is copied, what is not, and the flow. These details were
left open, and engineering must not invent them (readiness `R17`).

## Decision

1. **Where.** "Clone room setup…" is an item of the room list's "Room
   actions" menu, on every room row, the default room included. It is not
   added to Room settings. Archived rooms have no clone action (restore
   first).
2. **Agent seats.** Every value of each agent's setup is copied as is:
   name, provider, model, effort, Codex Fast mode, permissions (Claude
   permission mode, Codex sandbox), the provider command and extra arguments,
   standing (role) instructions and listening settings — whether it listens,
   its listening style and prompt, and whether it is asleep. "Description" in
   PD-0007 means the agent's standing instructions and whatever describes
   the seat in its setup; nothing is left out. Nothing of an agent's running
   state is copied: no native session, no pending delivery, no usage or
   compaction record.
3. **Room settings.** Every room-level setting saved with the room is copied
   — today mode, hop budget, default agent, accounting, pair review rounds and
   reply timeout. Run state is not a setting and is not copied: a pair or
   Converge run, pending deliveries, the last-addressed agent.
4. **Name.** The dialog pre-fills `{room} copy`. If that room exists, it
   pre-fills `{room} copy 2`, then `copy 3`, the first free one. If the result
   is longer than 40 characters, the original name is shortened from its end
   (no trailing space) so the whole fits. The user can change it; the name
   follows Create room's rules and its duplicate-name message.
5. **Goal.** Pre-filled with the original's Goal and editable. An empty Goal
   is allowed ([PD-0003](PD-0003-room-brief-behaviour-clarifications.md)
   item 1: only the Create room dialog requires one). Typed text is limited to
   2,000 characters (PD-0003 item 9); a copied Goal that is already longer is
   kept as is and never cut (principle 2).
6. **Rules.** Copied exactly as saved, whatever their length, and not shown
   in the dialog. Rules text that mentions a `@desktop:` handle is copied
   verbatim: it is text, not a link (item 9).
7. **Decisions.** None — neither active nor archived
   ([Q-0001](../questions/Q-0001-copy-decisions-option.md) holds the option,
   default no).
8. **Project folder.** Pre-filled with the original's folder (blank if it has
   none) and changeable by typing or Browse…, as in Create room; blank means a
   new room workspace. A folder that does not exist is refused with Create
   room's message. The original room's own `workspace/` contents are never
   copied: a clone with a blank folder gets a new, empty workspace.
9. **Desktop links.** No `@desktop:` link registration of the original
   belongs to the clone; a `@desktop:` mention in the clone reaches no session
   until the user links one to the clone.
10. **The one line** (exact copy, under the fields):
    `Copies the agents with their permissions, the Goal, Rules and room
    settings — not the chat, agent sessions, Decisions, pending work,
    approvals, handoffs or Desktop links.`
    It says nothing about the project folder's files being separate.
11. **The dialog.** Title `Clone room setup`; under it `From {room}`. Fields
    in order: Room name, Goal, Project folder; then the one line; buttons
    `Cancel` and `Create room`. It reuses the Create room dialog's look.
    `Create room` is disabled while the name is blank. Cancel, ×, Escape or a
    click outside creates nothing.
12. **What is copied, when.** The setup as saved at the moment `Create room`
    is pressed, with the dialog's name, Goal and folder. Cloning works while
    the original's agents are busy and does not touch the original room.
13. **After Create.** The new room opens with an empty conversation (no
    message, note or card), its Room Brief holding the dialog's Goal, the
    copied Rules and no Decisions, and every agent with no session. Nothing
    runs until the user sends a message. The original room's files are
    unchanged.
14. **More than four agents.** New rooms hold at most four agents
    (`MAX_ROOM_SEATS`); a clone is a new room. Cloning a room with more than
    four agents shows the dialog, and `Create room` fails with today's message
    `Rooms support at most four agents.` No such room exists today (2, 3, 4
    and 4 agents in the user's rooms, read-only check on 2026-11-06).

## Options considered

| Option | Why not |
| --- | --- |
| Copy only mode, hop budget and default agent (the requester's list read as exhaustive) | Leaves pair rounds, accounting and timeout at defaults, so the clone would not behave like the original; the requester asked for "a room's setup". |
| Not copying sleep state | A sleeping agent was put to sleep by the user to stop its calls; waking it in the clone would spend calls the user had turned off. |
| Require a Goal in the dialog | Contradicts PD-0003 item 1 and blocks cloning rooms that have no Goal. |
| Show Rules in the dialog | The requester said Rules are copied "as is"; the dialog stays short. |
| Copy the first four agents of a larger room | Silently drops a stated need ("every agent seat"); refusing with the existing message is honest and has no case today. |
| A summary that says the rooms are fully independent | Would promise separate project memory, which PD-0007 item 5 forbids. |

## Consequences

Engineering has no copy, default or limit left to invent. The architect may
show that a listed setting does not exist or another one does; that changes
the list in item 3, not the rule.

## Provenance

Context digest at decision: `b9db171eb1a049ab` (PRODUCT_DEFINITION entry).
