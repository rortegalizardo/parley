# UI review

**Status:** 37 browser checks and the package check passed. The strengthened Settings case also passed after the final new-card default correction. This review covers the 15 user-facing surface groups below; it does not claim every possible state combination or real provider behavior was tested.

The screenshots were captured with an isolated fixture and fake-provider content. The actual fork on port 4142 was refreshed while idle and verified to serve the exact tested UI assets (`0420c2ef13ee5bd074c9`); its `@all` composer and editable Settings panel were also checked in the in-app browser. The original session on 4141 was left untouched. Native OS folder-picker and browser permission UI are platform-owned and retain their platform appearance; their entry points were inventoried, and browser confirm/cancel flows were tested. Native OS pickers and permission prompts were not invoked.

## Editable roster follow-up

Settings now supports draft additions and removals without clearing the conversation. Browser coverage seeds a transcript, preserves typed instructions across card changes, cancels a draft, then saves a replacement roster and receives actual fake-provider replies from the new named agent and `@all`. One-, two- and ten-agent rooms are covered. No fixed roster cap remains.

The latest captures show the new card's themed fields and provider defaults, plus a composer with an updated roster. Earlier captures below document the broader interface audit.

![Add an agent in Settings, dark theme](ui-review/editable-roster-dark.png)

[Light theme](ui-review/editable-roster-light.png) · [Mobile composer with @all and updated agents](ui-review/editable-composer-mobile.png)

| Surface | Reviewed states and fixes | Evidence (test; capture) |
|---|---|---|
| App shell and header | Desktop/mobile header, compact viewport, dark/light theme, room actions. | `test/browser-roster.mjs`; [conversation dark, 1440](ui-review/conversation-dark-1440.png), [conversation light, 390](ui-review/conversation-light-390.png) |
| Sidebar and room list | Room list, switching, mobile drawer, settings entry. | `test/browser-roster.mjs`; [mobile sidebar](ui-review/mobile-sidebar-open.png), [settings from sidebar](ui-review/settings-from-mobile-sidebar-dark-390.png) |
| Empty room and welcome | Build-room calls to action and four-agent entry at desktop and phone sizes. | `test/browser-roster.mjs`; [four-agent setup, 390](ui-review/new-room-four-dark-390.png) |
| Transcript and reply states | Conversation, streaming, error recovery and retry presentation. | `test/browser.mjs`; [conversation dark, 1440](ui-review/conversation-dark-1440.png), [error recovery](ui-review/error-recovery-dark-1440.png) |
| Pair mode | Active Pair banner and compact viewport layout. | `test/browser.mjs`; [Pair active, 390](ui-review/pair-active-dark-390.png) |
| Composer recipients and routing | Composer sizing, mention picker, route feedback. | `test/browser-roster.mjs`, `test/browser-policy.mjs`; [mention picker](ui-review/mention-picker-mobile.png) |
| Continuation policy | Policy choices and mobile popover positioning. | `test/browser-policy.mjs`, `test/browser-roster.mjs`; [mobile continuation menu](ui-review/hop-menu-mobile.png) |
| Busy strip and stop controls | Active response, stop scopes and mobile stop menu. | `test/browser.mjs`, `test/browser-fixture.mjs`; [mobile stop menu](ui-review/stop-menu-mobile.png) |
| Queue popover | Queued Pair recovery and mobile popover. | `test/browser-panels.mjs`; [mobile queue](ui-review/queue-popover-mobile.png) |
| Ask and wake menus | Desktop ask/wake menu presentation and available actions. | `test/browser-panels.mjs`; [ask menu](ui-review/ask-menu-desktop.png), [wake menu](ui-review/wake-menu-desktop.png) |
| Attachments and draft state | Drafted and cleared attachment presentation. | `test/browser-panels.mjs`; [drafted attachments](ui-review/attachments-drafted.png), [cleared attachments](ui-review/attachments-cleared.png) |
| New-room dialog and roster | Two/four/eight-seat layouts, phone layout, focus, dismissal and creation. | `test/browser-roster.mjs`, `test/browser.mjs`; [four agents, light](ui-review/new-room-four-light-390.png), [eight agents](ui-review/new-room-eight-dark-390.png) |
| Settings modal and subcontrols | Desktop/phone, dark/light, open selectors, lower fields, instructions and persistence. | `test/browser-dialogs.mjs`, `test/browser-roster.mjs`; [settings dark, 1440](ui-review/settings-dark-1440.png), [settings light, 390](ui-review/settings-light-390.png) |
| Runtime, setup, Pair and Work banners | Warning banner visibility, wrapping and themed foregrounds. | `test/browser-visual.mjs`; [runtime warning](ui-review/runtime-warning-dark-390.png), [setup warning](ui-review/setup-warning-dark-390.png) |
| Confirm, prompt and native picker surfaces | Browser confirmation acceptance/cancellation; platform-owned picker and permission UI noted above. | `test/browser-dialogs.mjs`; no native picker capture |

The original full 36-check browser suite and package check passed; the editable-roster follow-up brings the suite to 37 checks. The conversation/banner suite passed again after the final Work contrast change, including long formatted code content at phone width. Captures disable transient animations so the reviewed images show settled states.

![Settings in dark mode](ui-review/settings-dark-1440.png)

![Conversation in dark mode](ui-review/conversation-dark-1440.png)

## Convergence composer follow-up — 22 October 2026

Verified on the actual fork at `http://127.0.0.1:4142`, protocol 14, asset version `2a7f893fcdde59cfa285`. The default room still has two agents; the picker count reflects that roster. Isolated browser tests verify nine agents and role search, narrow layouts, mode switching, single final handoff, and inspectable review records. Convergence hides automatic-turn controls; Parallel hides review rounds. Dark-mode inputs match the rest of the interface.

![Actual fork on port 4142 with the compact selector and convergence controls](convergence-live-4142.png)
