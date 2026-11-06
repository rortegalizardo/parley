---
id: PD-0010
type: decision
title: Clone room setup behaviour — the product manager's rulings, with the architect's findings
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0015, CAP-0002]
supersedes: PD-0008
superseded_by:
---

# PD-0010 — Clone room setup behaviour — the product manager's rulings, with the architect's findings

Decided by `ROLE-product-manager` under §4.1 (clarifications that do not
change the user-visible outcome of
[PD-0007](PD-0007-clone-room-setup-requester-decisions.md) and contradict no
constraint, principle or accepted `PD-`). It supersedes
[PD-0008](PD-0008-clone-room-setup-behaviour-clarifications.md): the same
fourteen items, with the architect's findings PC-01 and PC-03 to PC-07 and
risk R-04 applied
([assessment](../initiatives/INIT-0015-clone-room-setup/technical/assessment.md)).
Items changed from PD-0008: 2, 3, 4, 5, 6, 11, 13.

## Context

PD-0007 fixes what is copied, what is not, and the flow. These details were
left open, and engineering must not invent them (readiness `R17`). The
architect showed where PD-0008 did not match the platform: sleep is run
state with a reason and a time, Gemini has a third kind of permission, no
Parley dialog closes on a click outside, and opening any room runs a local
CLI sign-in check.

## Decision

1. **Where.** "Clone room setup…" is an item of the room list's "Room
   actions" menu, on every room row, the default room included. It is not
   added to Room settings. Archived rooms have no clone action (restore
   first).
2. **Agent seats.** Every value of each agent's setup is copied as is:
   name, provider, model, effort and Codex Fast mode (where the provider has
   them), permissions (Claude permission mode, Codex sandbox, Gemini approval
   mode), the provider command and extra arguments, standing (role)
   instructions and listening settings — whether it listens, its listening
   style and prompt. "Description" in PD-0007 means the agent's standing
   instructions and whatever describes the seat in its setup; nothing is left
   out. **Asleep:** an agent asleep in the original is asleep in the clone,
   with the same reason, asleep since the clone was created; no "is asleep"
   note is written. Sleep is the one piece of running state copied. Nothing
   else of an agent's running state is copied: no native session, no pending
   delivery, no usage or compaction record.
3. **Room settings.** Every room-level setting saved with the room is copied
   — today mode, hop budget, default agent, accounting, pair review rounds and
   reply timeout. A value Room settings no longer offers for new rooms (the
   old `exchanges` accounting, a hop budget of "until settled") is copied as
   is. Run state is not a setting and is not copied: a pair or Converge run,
   pending deliveries, the last-addressed agent, retired agent names. Choices
   kept per browser tab (Converge or Parallel, convergence review rounds) are
   not room settings: the clone opens on the tab's own choices.
4. **Name.** The dialog pre-fills `{room} copy`. If that room exists, it
   pre-fills `{room} copy 2`, then `copy 3`, the first free one, comparing
   names without regard to case (as the duplicate check does). If the result
   is longer than 40 characters, the original name is shortened from its end
   (no trailing space) so the whole fits. The user can change it; the name
   follows Create room's rules and its duplicate-name message.
5. **Goal.** Pre-filled with the original's Goal and editable. An empty Goal
   is allowed ([PD-0003](PD-0003-room-brief-behaviour-clarifications.md)
   item 1: only the Create room dialog requires one). Typed text is limited to
   2,000 characters (PD-0003 item 9). A copied Goal that is already longer is
   kept as is and never cut (principle 2): as in Room settings' Brief tab, it
   can be shortened but not made longer, and the field shows the note of
   [PD-0006](PD-0006-room-brief-platform-rulings.md) item 2 under it. Parley
   accepts a Goal over 2,000 characters only up to the length of the
   original's Goal as saved at `Create room`.
6. **Rules.** Copied by Parley from the original exactly as saved at
   `Create room`, whatever their length, and not shown in the dialog. Rules text that mentions a `@desktop:` handle is copied
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
    `Create room` is disabled while the name is blank. Cancel, × or Escape
    closes it and creates nothing, as in Create room. A click outside does
    nothing: no Parley dialog closes on one, and a stray click must not lose
    the user's edits.
12. **What is copied, when.** The setup as saved at the moment `Create room`
    is pressed, with the dialog's name, Goal and folder. Cloning works while
    the original's agents are busy and does not touch the original room.
13. **After Create.** The new room opens with an empty conversation (no
    message, note or card), its Room Brief holding the dialog's Goal, the
    copied Rules and no Decisions, and every agent with no session. Nothing
    runs until the user sends a message: no agent turn runs and nothing is
    sent to any provider. The local check Parley makes on opening any room
    (whether each agent's CLI is installed and signed in) is not an agent turn
    and runs as for every room. The clone has no old saved brief and no
    recovery copy of an old room note or direction (those stay with the
    original, PD-0006 item 3). The original room's files are unchanged.
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
| Close the dialog on a click outside (PD-0008 item 11) | No Parley dialog does; a stray click would lose a typed name or Goal; the requester asked to reuse Create room's dialog. |
| Copy sleep with the original's since-time, or write an "asleep" note | The since-time would predate the room; a note breaks the empty conversation (C-01). |
| Wake every agent in the clone | Spends calls the user had turned off. |
| Accept any Goal over 2,000 from the dialog | Would bypass the PD-0006 item 2 limits for new text. |

## Consequences

Engineering has no copy, default or limit left to invent. A setting added to
Parley later is copied if it is saved with the room or the agent's setup
(items 2, 3), and not copied if it is running state.

## Provenance

Context digest at decision: `e1586e7ff9742488` (SOLUTION_CONVERGENCE entry).
PD-0008's own provenance: `b9db171eb1a049ab`.
