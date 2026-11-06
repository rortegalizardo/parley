---
id: CAP-0002
type: capability
title: The user creates a room and sets up its agents, Room Brief, room settings and project folder
status: authoritative
revision: 1
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
surfaces: ["＋ New room → Create a room dialog (Agents and Room tabs)", "Room settings (Agents, Room and Brief tabs; footer Rename, Clear conversation, Archive, Delete)", "Room list row → Room actions menu (Archive, Rename, Delete)", "POST /api/rooms"]
implemented_by: []
decisions: []
---

# CAP-0002 — The user creates a room and sets up its agents, Room Brief, room settings and project folder

Recorded at INIT-0015 DISCOVERY from the committed code on `main` at
`704039f` (`ui/index.html`, `ui/app.js`, `parley.mjs`) and a read-only look at
the room files under `~/.parley-fork`, because room creation shipped before
Product Memory existed. The architect's capability scan for INIT-0015 may
refine it.

## Behavior today

- **Create a room** (＋ New room). One dialog with two tabs. *Agents*: up to
  four agents, each with a name, provider (Claude, Codex, Gemini), model,
  effort, Codex Fast mode and standing instructions, with presets. *Room*: a
  name (at most 40 characters: letters, numbers, spaces, dashes, underscores;
  must be unused), the Room Brief Goal (required in this dialog only) and
  Rules (optional), a project folder (optional, with Browse…; blank means a
  new room workspace) and "Start in Work mode". Create opens the new room.
  The server endpoint is `POST /api/rooms`; a duplicate name is refused.
- **Room settings** (gear in a room). *Agents*: per-agent model, effort,
  permissions (Claude permission mode, Codex sandbox), listening (lurk on/off,
  style, prompt) and sleep, instructions; add and remove agents. *Room*: Talk
  or Work mode, automatic follow-ups (hop budget), default agent, pair review
  rounds and the other room-level values. *Brief*: Goal, Rules, Decisions
  (INIT-0014). Footer: Rename…, Clear conversation…, Archive room…, Delete
  room.
- **Room actions menu.** Each row in the room list has one "Room actions"
  button that opens Archive, Rename and Delete (no Delete for the default
  room).
- **What a room holds on disk.** `room.json` — the setup: each agent's
  provider, command, model, effort, Fast mode, permission mode or sandbox,
  extra arguments, listening settings and instructions; the default agent,
  mode, hop budget, accounting, pair rounds, project folder and timeout.
  `context.json` — the Room Brief (Goal, Rules, Decisions). `state.json` — the
  agents' native sessions and the room's run state (convergence, pair, pending
  deliveries). `transcript.md` and `events.jsonl` — the conversation.
  `workspace/` — the room's own working folder.
- **No way to copy a room's setup.** A second room set up like an existing one
  is entered again by hand in Create room.

## Surfaces

See frontmatter `surfaces`.

## Boundaries

Rooms linked to the same project folder work on the same files: a room has
its own conversation, Room Brief and agent sessions, not its own copy of the
project. Per-agent standing instructions belong to each agent; the Room Brief
belongs to the room (CAP-0001, INIT-0014).

## Constraints

None recorded beyond `project/constraints.md`.

## Change log

| Date | Revision | Change | Initiative |
| --- | --- | --- | --- |
| 2026-11-06 | 1 | Recorded as current state | INIT-0015 (DISCOVERY) |
