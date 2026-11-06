# Run instructions — verbatim, as given to the product manager session (2026-11-06)

Source: the launching session's prompt for this product run (requester Ricardo, relayed by his side session). Copied verbatim; not edited.

> Raw product request for project Parley at /Users/ortega/Desktop/Projects/parley. Full brief (requester decisions already made, constraints, done criteria): /Users/ortega/Library/Application Support/Claude/side-session-notes/local_6612077f-8cd8-4ce0-ab4f-0870d2383ad1/room-brief-pm-brief.md — read it first, then the repo's CHECKPOINT.md.
>
> Run the product track end to end: BOOTSTRAP (Parley has no product/ memory and is not in the Factory registry — bootstrap it), then INTAKE through HANDOFF, ending with engineering-ready stories, a delivery manifest and Ariadne tickets.
>
> Rules for this run:
> - The requester pre-authorized everything: plan, edit, commit and merge without asking. No approval stops. The decisions in the brief are final; record them as PD- records, do not re-ask. Escalate only a genuinely new product question that blocks progress, as one plain-English question.
> - Keep it proportionate: this is one Room Settings surface change in a plain HTML/JS app (ui/index.html, ui/app.js, ui/styles.css). Design at 1440, light only; one hero frame for the Room Brief panel (Goal/Rules/Decisions, archived decisions, length warning, "What agents see" preview) is enough.
> - Do NOT implement product code and do NOT touch parley.mjs delivery code; a separate session (brief-delivery) is changing it. Stop at HANDOFF.
> - Never touch or restart the server on port 4142; never use 4141.
> - Commit product/ and design work on a branch and merge it to main locally (main is ahead of origin; do not push unless the repo's rules say so).
>
> Return: one line — phase reached, Ariadne ticket codes created, branch/merge state, and any blocker.
