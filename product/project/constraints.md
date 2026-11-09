---
id: PROJECT-constraints
type: project-context
title: Hard constraints
status: authoritative
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-08
---

# Hard constraints

Non-negotiable limits on what may be built or how. These outrank initiative
intent and are overridden only by a decision that explicitly amends them.

| # | Constraint | Source | Applies to |
| --- | --- | --- | --- |
| 1 | "Never restart or touch the live Parley server on port 4142, and never use port 4141 (the upstream install). Test on an isolated port." (requester's words, verbatim). | Requester, at bootstrap (2026-11-06) | As stated; the requester gave no narrower scope |
| 2 | "Parley's UI is plain ui/index.html, ui/app.js and ui/styles.css: no React, no Storybook, no build step." (requester's words, verbatim). | Requester, at bootstrap (2026-11-06) | As stated; the requester gave no narrower scope |
| 3 | "Design at 1440 wide, light theme only; dark mode and other widths follow from the existing CSS and are never designed or reviewed separately." (requester's words, verbatim). | Requester, at bootstrap (2026-11-06) | As stated; the requester gave no narrower scope |

**Amendment (PD-0011, requester's decision, 2026-11-08).** Row 2 is read with [PD-0011](../decisions/PD-0011-live-markdown-editor-requester-decisions.md) item 5: exactly one prebuilt, committed vendor file under `ui/vendor/` (the live Markdown editor) is permitted. "No build step" still means no build step to run the app; no bundler, package install or other generated file is added to `ui/`.

No other constraints are recorded yet.
