# What upstream Parley 1.2.1 can do

This guide describes the checked-in **1.2.1** release at baseline commit `c4cd237b7fe58c7df1f2692b6a62971be29e904b`. It focuses on what you can do in the app, rather than internal scheduling details. See the [README](../README.md), [conversation guide](conversation.md), [settings reference](reference.md), and [permissions guide](permissions.md) for deeper detail.

## Bring two agents into one conversation

Parley gives you one local chat room with two agent seats. The built-in providers are Claude Code, OpenAI Codex CLI, and Gemini CLI. You can send a message to one seat, or ask both at once:

- `@claude Review this plan.` sends it to Claude.
- `@codex What risks do you see?` sends it to Codex.
- `@both Compare these two approaches.` asks both in parallel.
- A message without a tag goes to the seat you last addressed.

Each seat has its own delivery lane, so a busy agent can finish its current work while later messages wait in order. Replies stream into the same transcript. An agent may address the other one by name to request a follow-up; the room's automatic-turn allowance limits how many extra agent calls that message can cause. New rooms allow four extra calls by default, after the replies you requested directly. Choose **Solo**, `0`, a number, or **Until settled** from the composer allowance control when you want a different limit for a message.

## Have one agent listen to the other

Turn on the ear icon for either seat to enable **Lurk**. The listening agent sees exchanges it was not addressed in and decides whether it has a useful correction, disagreement, risk, or addition. It may speak up, or quietly pass. There is no keyword that forces it to speak.

Choose a listening style per seat:

- **Quiet** speaks up for clear problems.
- **Balanced** also flags meaningful disagreement or important caveats.
- **Vocal** may add useful improvements and extra ideas.
- A custom listening prompt can replace those criteria.

If the listener is busy, Parley saves one catch-up and delivers the missed exchanges together after user-requested work finishes. A listener can also review code as the other agent edits it in a Work room. Lurk uses additional agent calls, which count against the message's automatic-turn limit.

## Ask an agent to make changes

Rooms start in **Talk** mode, where the agents have conservative permissions. Switch a room to **Work** when you want an agent to edit files or run commands. Its file and command actions appear as small activity lines in the chat, such as `Write server.js` or `npm test`; Parley does not provide a separate diff viewer or editor.

By default, Work gives Claude permission to accept ordinary edits and gives Codex workspace-write access. Gemini uses its approval setting. Each provider also has a **Full access** option for trusted local use; it can reach beyond the project folder and should be treated as permission to act with your computer account's access. Enabling Claude Full access requires deliberate confirmation. Check [permissions and trust boundaries](permissions.md) before enabling elevated access.

In a Work room, `@both` starts a discussion: both agents can read and respond, but Parley instructs them not to edit. Tag one agent when you want implementation. The other agent can lurk as a reviewer and inspect workspace files.

## Point a room at a project

A room can use its own scratch workspace, or you can link it to an existing project folder. Both seats then run from that folder and can read its `CLAUDE.md` or `AGENTS.md` project instructions. The sidebar shows the linked folder and, when available, its Git branch. Switching a linked room to Work asks you to confirm because agents may edit real project files.

The linked project belongs to you: deleting a Parley room does not delete or move that folder. The room's own workspace and conversation records live under Parley's data folder, normally `~/.parley`.

## Use a worker and a reviewer

**Pair mode** gives one seat the worker role and the other the reviewer role. The worker makes the requested change; the reviewer reads the work and either approves it or asks for a fix. A failed or incomplete review does not count as approval. Start it with `/pair start @claude Add input validation` (replace the seat and task as needed), or choose a round limit; end it with `/pair end`. Pair rounds have their own limit, separate from the ordinary follow-up allowance.

## Pause a seat or recover a reply

If a provider hits a usage limit, put its seat to sleep with the seat control or `/sleep @codex [reason]`. Messages addressed to that seat are held for later, and agent-initiated requests to it are skipped with a note. `/wake @codex` wakes it; if messages are held, choose **Wake & deliver** to answer them together or **Wake only** to leave them as context for a future request.

A failed reply has a **Retry** action. Stop can end one response, active responses, queued work, or all of them, depending on what is running. Cancelled and stopped messages remain in the transcript with a status explaining what happened.

## Configure rooms and seats

Room Settings can change the room's name, linked project folder, Talk/Work mode, default recipient, persistent room note, automatic-turn policy, and Pair round limit. Each seat can have its CLI command, model, reasoning effort where supported, permission or sandbox mode, extra CLI arguments, and Lurk settings. A room note is a standing instruction both seats receive.

The **+** room form creates a room with exactly two seats. The seats can use different providers, or the same provider with different seat names. For example, create `@opus` and `@sonnet` seats that both use Claude Code and select different models. Seat names are fixed for the lifetime of that room. Parley does not support adding a third seat to a room.

## Keep and export the conversation

Use **Download transcript** to save a room's conversation as Markdown, or open the shared workspace folder from the app. A room also keeps an event log and its settings and runtime state under `~/.parley/<room>/`. Attach images, patches, logs, and documents by pasting, dragging, or using the paperclip; images appear inline and other files appear as download cards. Attachments are stored with the room and can be included again when retrying a message.

Other conveniences include multiple rooms in a sidebar, streamed replies, retry on failures, copy buttons, a room summary (`/summarize`), and a persistent room note (`/note <text>`). **New conversation** archives the current transcript and starts fresh agent sessions. Deleting a room moves its data to Parley's `.trash` folder, where you can recover or remove it with your file manager.

## Local operation and limits

Parley runs on your computer and launches the official agent CLIs using their existing logins. It does not ask you to enter provider credentials. Its web page is served only on the local computer (`127.0.0.1`) and is intended for one trusted local user. A local server is not protection from another program already running as your user, and transcripts or attachments may contain private source code and paths.

A room always has two seats, even when both use the same provider. Same-provider seats need distinct names. If a CLI does not provide a stable session identifier, using that same CLI outside Parley at the same time can make it resume the wrong recent conversation; this is called out in the room when applicable. Multi-user hosting, shared credentials, and third-seat rooms are outside the current feature set.
