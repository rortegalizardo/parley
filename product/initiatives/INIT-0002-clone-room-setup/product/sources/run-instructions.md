# Run instructions — verbatim, as given to the product manager session (2026-11-06)

Source: the launching session's prompt for this product run (requester Ricardo, relayed by his side session). Copied verbatim; not edited.

> Raw product request for project Parley at /Users/ortega/Desktop/Projects/parley (product memory exists under product/; previous initiative INIT-0001 Room Brief, tickets PRL-1..PRL-3, is merged on local main at 704039f and verified).
>
> Read the full brief first: "/Users/ortega/Library/Application Support/Claude/side-session-notes/local_6612077f-8cd8-4ce0-ab4f-0870d2383ad1/clone-room-pm-brief.md". Also read the repo's CHECKPOINT.md.
>
> Summary: build "Clone room setup…" in each room's menu — a one-time copy of a room's setup (agent seats incl. permissions, Room Brief Goal editable + Rules, room settings, project folder changeable) into a new room with an empty chat; NOT copied: chat/activity, agent sessions, Decisions, pending work, approvals, handoffs, @desktop: links. One short dialog; its one-line summary must say agent permissions are copied and must not promise separate project memory. Out of scope: templates, sync, copy-Decisions option (record as non-blocking open Q-, default no).
>
> Authority: the requester (Ricardo) already made this decision in the room "Parlay Product Evolution". No approval stops — plan, edit, commit, merge on local main without asking. Escalate only a genuinely new blocking product question, as one plain-English question. Keep it proportionate: one menu item + one small dialog in plain ui/index.html, ui/app.js, ui/styles.css plus the server endpoint; design at 1440, light only, reuse Create-room dialog styling, no canvas.
>
> Run the product track through HANDOFF (create the Ariadne ticket(s), likely a single ticket). Then, if your framework allows it, drive engineering for the ticket(s) through implement → review → merge to local main (no push unless the release step strictly requires it — Parley delivers by direct local main merge like PRL-1..3). If your role ends at HANDOFF, stop there and return the ticket codes.
>
> Hard constraints: never restart or touch the live server on port 4142; never use 4141. Any test on an isolated port with a copied data root. Testing = one check covering all four done criteria (clone's agents/Goal/Rules match; chat empty and sessions fresh; editing clone leaves original unchanged; creation starts no agents, commissions no work). No new unit/smoke suites.
>
> Return: one line — outcome, INIT id, ticket codes, commit/branch/merge state, plus path to any blocker.
