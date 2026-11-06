# Raw request — verbatim, as given to the product manager session (2026-11-06)

Source: `/Users/ortega/Library/Application Support/Claude/side-session-notes/local_6612077f-8cd8-4ce0-ab4f-0870d2383ad1/clone-room-pm-brief.md`, written by the requester's (Ricardo's) side session from his decision in the room "Parlay Product Evolution". Copied verbatim below; not edited.

---

# Clone room setup — product brief for the PM

Project: Parley, `/Users/ortega/Desktop/Projects/parley` (product/ tree exists; INIT-0014 Room Brief delivered as PRL-1..PRL-3, merged on local main at 704039f, verified).
Requester: Ricardo. Decision ALREADY MADE in room "Parlay Product Evolution". Do not re-ask. No approval stops: plan, edit, commit, merge without asking. Only a genuinely new blocking product question may be escalated, as one plain-English question.

## Decision to build
Add "Clone room setup…" to each room's menu — a one-time copy of a room's setup into a new room with an empty chat.
- Copied: every agent seat (name, description, provider, model, effort, permissions, role instructions, listening settings); Room Brief Goal (editable in the dialog) and Rules (as is); room settings (mode, hop budget, default agent); project folder (pre-filled, changeable in the dialog).
- NOT copied: chat history and activity; agent sessions (all agents start fresh); Decisions, pending work, past approvals, handoffs; Desktop session links (`@desktop:` links).
- Flow: Room menu → "Clone room setup…" → one short dialog: name pre-filled "<room> copy", Goal ready to edit, project folder, and one line saying what carries over and what doesn't — that line must state that agent permissions are copied. Create opens the new room: empty chat, no agent started, no work commissioned.
- Independent: editing either room's settings or conversation never changes the other. Wording must not promise separate project memory — rooms on the same folder still share its files.
- Out of scope: templates, syncing between rooms, an option to copy Decisions (open question to the user; default is no — record as an open Q-, non-blocking).

## Done means (one check covering all four)
The clone's agents, Goal and Rules match the original; its chat is empty and agent sessions fresh; editing the clone leaves the original unchanged; creating it starts no agents and commissions no work. Nothing more: no new unit/smoke suites.

## Constraints
- Read `CHECKPOINT.md` first. Never restart or touch the live server on port 4142; never use 4141. Test on an isolated port with a copied root (see sibling note room-brief-verification.md for a working recipe; GET /api/room takes `name=`).
- UI is plain `ui/index.html`, `ui/app.js`, `ui/styles.css`. Design at 1440, light only. Proportionate: one menu item + one small dialog, reuse the Create room dialog styling. No canvas/multi-page design.
- Nothing pushed unless the Factory release step requires it. Local main delivery like PRL-1..3.
