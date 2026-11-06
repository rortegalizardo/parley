---
mode: PRODUCT-DISCOVERY
initiative: INIT-0001
type: technical-assessment
title: Platform capability scan — Every agent knows the room's goal, rules and decisions from one Room Brief
status: authoritative
revision: 1
owner_role: ROLE-planner
phase_at_assessment: SOLUTION_EXPLORATION
round: 1
assessed_on: 2026-11-06
created: 2026-11-06
updated: 2026-11-06
verdicts: []
constraints: []
questions: []
updated_by_role: ROLE-planner
---

Mode: PRODUCT-DISCOVERY
Initiative: INIT-0001
Scanned: 2026-11-06
Systems scanned: Parley server `parley.mjs` and browser UI `ui/index.html`, `ui/app.js` at `d07a67d` (product worktree code); the landed delivery change `b6591be` on local `main` of `/Users/ortega/Desktop/Projects/parley`; `lib/bridge-adapter.mjs`, `lib/bridge-backend.mjs`, `bin/parley-runner.mjs`, `bin/parley-mine.mjs`, `desktop/main.cjs`; `docs/ROOM-BEHAVIOR.md`, `docs/conversation.md`; the live room store `~/.parley-fork` (read-only, counts and lengths only, no content read out).

Current state only. This file holds no verdict, no option and no proposal;
those are in [assessment.md](assessment.md). Line numbers are `d07a67d`
unless marked `b6591be`.

## Relevant platform capabilities

| Area | Verdict (exists/partial/absent) | Where it lives (source) | Gap, if partial |
| --- | --- | --- | --- |
| Standing room text in every agent prompt, in full every turn | partial | `b6591be`: room note and direction both sent in full on every turn (`parley.mjs` ~3202-3233 on `main`). One shared seam feeds all three turn kinds: direct turn `parley.mjs:3483-3484`, listener (lurk) turn `:3728`, hop turn `:4128`. Provider adapters are called only from those three (`:3503`, `:3523`, `:3745`, `:3761`, `:4156`, `:4173`). | Two separate blocks (note, direction), not one brief. One-time lines remain: cleared-direction revocation and the retired-brief notice (`:3223-3231`, kept by `b6591be`), and a "no room note is active" marker built outside the shared seam, in the per-turn prefix (`:1160-1162`). At `d07a67d` (the product worktree) the old send-once-then-reminder code is still present. |
| Independence from session memory (fresh, resumed, compacted, restarted) | exists (on `main`) | The block is composed from saved room data when each attempt's prompt is assembled (`parley.mjs:3468-3490`); a lost-session retry recomposes it (`:3518-3521`). Session refs and stamps persist in `state.json` across restarts. Compaction and resets are recorded (`:2203-2216`). Gemini's fresh briefing leads the prompt (`:1695-1698`). | None for delivery. The compaction system note still says "The room direction is sent in full on its next turn" (`:2213`). |
| Untrusted-content framing of user-authored text | exists | `relayMessage` prefixes every physical line with a label or `|` so text cannot fake a speaker or close a block (`parley.mjs:1193-1202`). Note framed at `:3164`, direction at `:2177-2178` ("Context only, not tool authorization"), agent instructions at `:1166-1168`. `docs/conversation.md:274`: the note stays "visibly framed as current user-authored instruction". | The bytes sent are the text plus a per-line prefix, not the bare text. |
| One-time notice per live session, stamped only on durable success | exists | Per-session block ledger (`parley.mjs:3187-3200`), stamped after a successful turn (`:780-805`). Precedent: the retired-brief notice is sent once to sessions that may hold it (`:3224-3231`). | Nothing marks "this session existed before a migration". Codex sentinel sessions (`--last`) and failed or stopped turns never stamp (`:785`), so a one-time line repeats on those turns. |
| Room note storage and edit paths | exists | `room.json` `roomNote` (`parley.mjs:543`), revision-tracked in `state.json` (`:1929-1948`, `:8487-8491`). Set by Create room → `POST /api/rooms` (`ui/app.js:4365`, `parley.mjs:7794-7843`), Room tab → `POST /api/config` (`ui/app.js:4841`), `/note` → `POST /api/config` from the browser (`ui/app.js:3908-3912`). | The 8,000-character cap applies only at room creation (`parley.mjs:7801`). The Room tab textarea has no `maxlength` (`ui/index.html:207`), `/note` has no cap, and `/api/config` does not check the note's length. |
| Direction storage and edit | exists | `context.json` ledger, outside `state.json` and the transcript and kept through `/clear` (`parley.mjs:2123-2147`). Goal plus pins with id, source message and creation time (`:2153-2168`). 200 characters per pin (`:2164`). 2,000-character cap on the whole body, headers included (`:2169-2171`). Last 20 directions kept (`:2131`, `:7981`). Saved by `POST /api/context/direction` (`:7976-7984`). | No archived state. A save replaces the whole direction with no check that it was built on the current one. |
| Archived (kept, not sent) decisions | absent | Removing a pin deletes it (`ui/app.js:5011` "Remove"; whole-direction replace at `parley.mjs:7980-7982`). | Nothing in the platform keeps a decision that is no longer active. |
| Old saved brief | exists | `activeBrief` and `decisions` stay in `context.json`, readable via `POST /api/context/legacy` (`parley.mjs:2181-2183`, `:7987-7992`), shown read-only on the Direction tab (`ui/app.js:5021`), never sent. | — |
| Pin suggestion | exists | `POST /api/context/suggest` with a message makes one tool-less Claude Sonnet call (`parley.mjs:2228-2235`, `:2255-2266`, `:7994-8020`). The pin dialog merges into an unsaved Direction draft when there is one (`ui/app.js:5124-5160`). | — |
| Tidy | partial | Same endpoint with `tidy`; the prompt covers Goal and pins only and asks for under 1,500 characters (`parley.mjs:2236-2241`); suggestion parsed into goal + pins capped at 200 (`:2247-2253`); loaded as an unsaved draft (`ui/app.js:5104-5116`). | Decisions it drops are deleted on save, not archived. |
| Length counter | partial | Client counter mirrors the server's body text; Save is disabled above the cap (`ui/app.js:4983-5002`). | Hard cap, and the count includes Parley's headings. |
| "What agents see" preview | absent | No surface shows the composed prompt text. | — |
| Merge suggestion for repeated text | absent | — | — |
| System notes in the conversation that start no agent turn | exists | System entries are appended without scheduling a turn (`parley.mjs:2643-2675`), as compaction notes do (`:2211-2214`) and bridge context-only notes (`lib/bridge-backend.mjs:118`, `:136`). Listener catch-ups key on user-message roots, not system entries (`parley.mjs:6085-6110`). System entries reach agents in their next activity delta, framed (`:3147-3153`). | No note is written when the note or direction is saved today. |
| Room creation paths | exists | Create room dialog → `POST /api/rooms` (`ui/app.js:4365`); the same endpoint serves any HTTP caller holding the session token (`parley.mjs:7630-7650`). Default room created at startup when absent, with `roomNote: null` (`:8722-8725`, `:543`). A room folder with no `room.json` gets defaults on load (`:1876-1879`). Restoring an archive is a folder move (`:7524-7534`). | — |
| MCP bridge and runner as room creators or note setters | absent | The bridge exposes four tools — list rooms, read, send, wait (`lib/bridge-adapter.mjs:8-13`); its "context" intent is a conversation entry, not the room note (`lib/bridge-backend.mjs:118-140`). The runner uses only the bridge API (`bin/parley-runner.mjs:59`). | Neither creates rooms or sets the room note. |
| Data migration of a room's saved files | partial | Rooms are migrated as they load, idempotently, with marker keys (`parley.mjs:1840-1876`). Rooms load lazily on access; only the default room loads at startup (`:8722-8725`). Archives sit in `.archives` (`:7488-7492`), deleted rooms in `.trash` (`:7470-7475`). Each file write is atomic on its own (`:638-647`). | No sweep over every room at startup. No write across several files at once. |
| Runtime state durability | exists | `state.json` is treated as rebuildable: reset to defaults when unreadable (`parley.mjs:1885-1899`). `/clear` replaces state and transcript but not `context.json` (`:7576-7604`). | Anything kept only in `state.json` can be lost by either. |
| Prompt transport and size | exists | Prompts go on stdin for Claude, Codex and Gemini (`parley.mjs:966-1000`; adapters `:1521`, `:1628`, `:1717`). No Parley cap on total prompt size found; recovery history is capped at 6,000 characters (`:1208`). | — |
| Room settings save models | exists | Agents and Room tabs share one footer Save → `POST /api/config`: it closes the dialog, may ask to confirm Full access, and resets sessions on project or mode change (`ui/index.html:236-240`; `ui/app.js` ~4790-4860; `parley.mjs:8494-8513`). The Room tab's fields are filled only when Settings opens (`ui/app.js:4733`). The Direction tab has its own Save, Discard and Tidy and a draft that survives live updates (`ui/app.js:4989-5116`). Tabs: Agents, Room, Direction (`ui/index.html:202`; `ui/app.js:4604-4612`). | — |
| Other builds reading the same room store | exists | `parley-mine` and the desktop app both default to port 4142 and `~/.parley-fork` (`bin/parley-mine.mjs:26-27`; `desktop/main.cjs:7-8`, `:46`). The packaged desktop app runs its own bundled copy of the code (`desktop/main.cjs:45`). The upstream install uses `~/.parley` and 4141 (`parley.mjs:136-145`). | — |

## CAP- reconciliation

| CAP- id | Registry says | System says | Agrees? | Note |
| --- | --- | --- | --- | --- |
| CAP-0001 | Room note "at most 8,000 characters" | The cap applies only in Create room (`parley.mjs:7801`); Room tab, `/note` and `/api/config` accept any length | No | For the PM: CAP-0001 and PD-0003 item 9 both rely on this limit |
| CAP-0001 | Note sent in full when < 340 characters, fresh or changed; otherwise a reminder line | True at `d07a67d`. On `main` since `b6591be` the note goes in full every turn | No (for `main`) | CAP-0001 records `d07a67d`; `main` moved the same day |
| CAP-0001 | Direction sent in full once per session, then a reminder; a cleared direction revoked once | Since `b6591be`: in full every turn; clearing still revoked once | Partly | As above |
| CAP-0001 | Direction: Goal + one-line Decisions ≤ 200 each, 2,000 in all, enforced | `parley.mjs:2164`, `:2169-2171`; client Save disabled above it (`ui/app.js:5001`) | Yes | The 2,000 count includes "Goal: " and "Decisions:" headings |
| CAP-0001 | Pin: one tool-less Sonnet call suggests one line; Pin appends it | `parley.mjs:2228-2266`; `ui/app.js:5124-5160` | Yes | — |
| CAP-0001 | Tidy: one Sonnet call suggests a shorter Goal and Decisions, loaded unsaved | `parley.mjs:2236-2253`; `ui/app.js:5104-5116` | Yes | Rules (the note) are not part of Tidy today either |
| CAP-0001 | Old saved brief kept, viewable from Direction tab, never sent; sessions told once it is retired | `parley.mjs:2181-2183`, `:3224-3231`; `ui/app.js:5021` | Yes | The notice says "the room direction, when set, replaces it" |
| CAP-0001 | Surfaces include `/api/context/{direction,legacy,suggest}` and the `/note` command | Present (`parley.mjs:7976-8020`; `ui/app.js:3908-3912`) | Yes | `/note` is handled in the browser and arrives at the server as a settings save |
| CAP-0001 | (not stated) Direction tab copy | On `main` the Direction tab still says "Each agent session gets it once, then a one-line reminder until it changes" (`ui/app.js:5009`); `b6591be` did not change the UI | — | Copy on `main` is now untrue; for the PM |

## Extension points

| Seam | What it accepts today | Source |
| --- | --- | --- |
| The shared standing-text seam used by every agent turn | Room note text and direction text, both composed from saved data per attempt | `parley.mjs:3206-3233` (`b6591be`); callers `:3484`, `:3728`, `:4128` |
| The per-turn delivery prefix | Per-seat one-time lines (contract update, no-note marker) and current agent instructions | `parley.mjs:1143-1185` |
| Per-session one-time block ledger | Fingerprints of blocks a live session durably received | `parley.mjs:780-805`, `:3187-3200` |
| On-load room migration | Idempotent field migrations of one room's files when it loads | `parley.mjs:1840-1876`, `:1929-1948` |
| Room context ledger (`context.json`) | Direction, direction history, old saved brief and decisions, context events; kept through `/clear` | `parley.mjs:2123-2147` |
| Context-only system notes | A system entry in the conversation that starts no turn | `parley.mjs:2643-2675`, `:2211-2214` |
| One-shot suggestion call | A prompt for a tool-less Claude Sonnet call; returns text | `parley.mjs:2255-2266`, `:7994-8020` |
| Room settings dialog tabs | Three tabs: Agents, Room, Direction; the Direction tab owns its own save | `ui/index.html:202-231`; `ui/app.js:4604-4612`, `:4989-5116` |

## Data already held

| Data class | Where | Sensitivity (none/personal/financial/regulated) |
| --- | --- | --- |
| Room note (user free text) | `room.json` per room; revision in `state.json` | personal (possible — free text the user writes; local only) |
| Direction goal, pins, last 20 directions | `context.json` per room | personal (possible; same) |
| Old saved brief and saved decisions | `context.json` per room | personal (possible; same) |
| Per-seat native session refs and delivery stamps | `state.json` per room | none |
| Conversation and system notes | `events.jsonl`, transcript per room | personal (possible; same) |

**Live store, as measured 2026-11-06 (read-only, counts only).**
`~/.parley-fork` holds 4 live, 10 archived and 3 deleted rooms. Live rooms'
Goal + note + pins come to 0, 960, 2,312 and 2,348 characters, so two are
already over the 2,000 guide. Longest note 1,425; longest goal 776; longest pin
158; at most 7 pins. Every live value is within PD-0003 item 9. One live room
("Parlay Product Evolution") already matches PD-0003 item 6's merge rule. 11
live agent sessions across 3 rooms, all with concrete session ids and all
stamped as holding the direction. One live room holds an old saved brief.
Archived rooms hold notes of at most 63 characters, no directions, and several
old saved briefs or decisions.
