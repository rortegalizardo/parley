---
id: DES-nnnn
type: design
title: <what is designed>
status: draft
revision: 1
owner_role: ROLE-product-designer
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
initiative: INIT-nnnn
external_system: <tool name, or "none">
external_url: <url, or omit>
local_export: <repo-relative path under design/assets/>
external_project_id: <durable project/file id in the design tool, or omit>
external_node_id: <durable page/node id, or omit>
external_revision: <revision marker the tool reports, or omit>
captured_on: <YYYY-MM-DD>
requirements: []          # every REQ- this design covers
supersedes: <DES-nnnn, or omit>
---

# DES-nnnn — <title>

## What this covers

## Local export

_Path to the committed markup/CSS/assets/screenshots. Implementation builds from
this, not from the external link — the execution environment may have no access
to the external tool._

## Deviations permitted

_Where an implementer may exercise judgement, and where they may not._

> A record with an `external_url` and no `local_export` is incomplete and stays
> `draft`. A transient reference — a preview URL, a tokened share link, a
> session-scoped export path — is never persisted here. Record durable identity
> (`external_project_id`, `external_node_id`, `external_revision`), not just a
> URL: a URL alone breaks the day someone renames a file.
