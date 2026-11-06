---
id: PROJECT-mission
type: project-context
title: Product mission
status: accepted
revision: 2
owner_role: ROLE-product-manager
created: 2026-11-06
updated: 2026-11-06
---

# Product mission

> **Status: accepted** at INIT-0014 DISCOVERY (2026-11-06) by `ROLE-product-manager`,
> [PD-0001](../decisions/PD-0001-accept-mission-and-first-principles.md). The
> description below is transcribed from the repository's `README.md`; nothing here
> is new product intent.

## What this product is

The requester's own words, transcribed at bootstrap (2026-11-06):

> Parley (personal fork of auspex0/parley, per README.md): your own table of Claude, Codex and Gemini agents, individually named and configured. Parley is a conversation, not a work queue: one local page, one shared thread, and a roster of agents who hear each other. It drives the official Claude Code and Codex CLIs through the user's existing CLI logins.

## What success looks like

The user can ask one agent, then another what it thinks of the answer, and the
agents agree, disagree and build on each other in one thread (`README.md`). Not
stated further yet.

## What this product is deliberately not

A work queue — worktrees, kanban boards, parallel terminals (`README.md`). It
never reads or stores provider credentials (`README.md`).
