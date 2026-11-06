---
id: PD-0006
type: decision
title: Room Brief rulings on the architect's six platform questions — framing, limits, recovery copy, stale saves, archiving, migration note
status: accepted
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
decided_on: 2026-11-06
affects: [INIT-0001, REQ-0001, REQ-0002, REQ-0003]
supersedes:
superseded_by:
---

# PD-0006 — Room Brief rulings on the architect's six platform questions

## Context

The technical architect raised six recommended questions, RQ-1 to RQ-6, where
[PD-0003](PD-0003-room-brief-behaviour-clarifications.md) meets the platform
([assessment](../initiatives/INIT-0001-room-brief/technical/assessment.md),
"Open questions raised"). Each was triaged (`escalation-policy` §3) as
pm-resolvable: every ruling picks the option that keeps
[PD-0002](PD-0002-room-brief-requester-decisions.md)'s outcome — the whole
brief sent, nothing lost, nothing cut — intact, and contradicts no constraint
or principle. None changes what the requester asked for.

## Decision

1. **Framing stays; the preview shows what is sent (RQ-1, option a).** The
   brief's user text stays inside Parley's per-line framing of user-authored
   text, as the note and direction are today (constraint C-01). The PD-0003
   item 4 wording is the content of the block. "What agents see" shows the
   block exactly as an agent receives it, Parley's line marks included.
2. **Limits stop new input only (RQ-2, option a).** The PD-0003 item 9 limits
   apply to typing and to new saves from every path (Room settings, Create
   room, `/note`, the HTTP API). A part already stored above its limit — from
   before this change, or a hand-edited room file — is kept and sent as is,
   and the brief still saves; only making that part longer is refused. Room
   settings shows under that part: `This is longer than the {limit}-character
   limit for new text. It is kept and sent as is; it can't grow further.`
3. **The old note and direction stay on disk as a recovery copy (RQ-3,
   option a).** Migration copies them into the brief and leaves the originals
   on disk, never read or sent again and never shown as fields — like the old
   saved brief today. PD-0002 item 3 ("one saved copy per part") is about the
   fields the user edits; this copy keeps migration reversible and deletes
   nothing automatically ([principles](../project/principles.md)).
4. **A save from an outdated view is not applied silently (RQ-4, option a).**
   If the saved brief changed after the user started editing (another window,
   `/note`, a pin not already in the edit, the API), `Save brief` does not
   overwrite it. The edit stays on screen with the message `The brief changed
   since you started editing. Your edits are still here — review them and press
   Save brief again.`, and the next `Save brief` saves the edit as shown (an
   active Decision the newer brief had and the edit lacks is archived, per
   item 5). A pin made from the same window while the Brief
   tab has unsaved edits joins those edits, as today, and does not trigger the
   message.
5. **Any save that leaves out an active Decision archives it (RQ-5, option
   a).** Whatever path a save comes from — Room settings, a Tidy suggestion,
   the HTTP API — an active Decision missing from it moves to Archived; it is
   never deleted. Editing a Decision's text changes that Decision in place
   (no archived copy). Only an explicit delete of an archived Decision removes
   one.
6. **The migration adds no conversation note (RQ-6, option a).** Agent
   sessions that existed before it get the one-time transition line
   ([REQ-0001](../initiatives/INIT-0001-room-brief/requirements/REQ-0001-room-brief-delivered-every-turn.md));
   the timeline note of PD-0003 item 8 starts with the first change the user
   saves.

## Options considered

| Option | Why not |
| --- | --- |
| RQ-1 b — preview shows bare wording with a note about Parley's line marks | Not the exact text sent, which the requester asked to see. Dropping the framing was not offered: it breaks C-01. |
| RQ-2 b — user must shorten an over-limit part before saving | Forces a cut the user did not ask for. |
| RQ-2 c — no limit on Rules | Removes today's 8,000 input bound with no ask behind it. |
| RQ-3 b — delete the old note and direction after migration | An automatic delete; makes migration irreversible (band `structural`); an older desktop build would see empty rooms. |
| RQ-4 b — last save wins, as today | Can silently revert a pin, `/note` or another window's edit — content lost without the user knowing. |
| RQ-5 b — only a save marked as Tidy archives; other saves leaving one out are refused | Two rules for one action; a stale or API save would fail instead of keeping the decision. |
| RQ-6 b — a note in every migrated room | A note nobody acted on, in every room. |

## Consequences

Costs: the server keeps the old fields and a saved-brief version to detect
outdated saves; the preview shows Parley's line marks, which look busier than
bare text. Benefits: nothing the user saved can be lost by migration, by a
stale window, by Tidy or by an API caller.
