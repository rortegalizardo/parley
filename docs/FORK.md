# Your Parley fork

Based on upstream `parley-room@1.2.1` (`c4cd237`). The original MIT license and attribution are retained. The existing chat, Work, Lurk, Pair, attachments, queues, and recovery workflows remain available.

## Run it

From this checkout, run `npm start`. No install or build step is needed to use the app. The CLI accounts you already use supply authentication and model access.

To try it with a separate room library:

```sh
node parley.mjs --root ~/.parley-personal --port 0
```

The default library remains `~/.parley`, and existing rooms keep their names, agent identities, transcripts, and sessions. Stop an older Parley server before running this fork against the same library. `npx parley-room@1.2.1` still launches the original upstream version.

## Build your four-agent table

Choose **New room**, give the room a name, and add agents. A room accepts **1–8 agents**, with any mixture of the installed providers. Each agent needs a unique name; that name becomes its `@mention` and stays fixed for the room's life.

| Name | Provider | Model | Suggested standing instructions |
| --- | --- | --- | --- |
| `fable` | Claude | `fable` | Drive the work with Astra. Propose concrete steps and check conclusions against evidence. |
| `astra` | Codex | `gpt-6-astra` | Drive the work with Fable. Check feasibility and implementation details. |
| `critic` | Your choice | An available model | Challenge this proposal from the viewpoint of a skeptical customer. Find counterexamples, test assumptions, and accept conclusions when the evidence resolves them. |
| `privacy` | Your choice | An available model | Review data collection, retention, access, and disclosure. Propose ways to achieve the goal with less sensitive data. |

Models and effort values are passed to the selected CLI. Use values available in your account; free text also accepts newer model names. Gemini's CLI has no effort field, so that control is omitted. Provider permissions still apply independently of the model or instructions.

Use `@fable` or `@privacy` to address one agent. Use `@all` to ask every agent; `@both` remains an alias for compatibility. Multiple specific mentions select the leading mentioned agent, so use separate messages when asking a subset. Agents can request a follow-up from one named peer per reply. Automatic turns share the existing per-message allowance across the room.

For two drivers and two observers, turn on the ear icon for `critic` and `privacy`. Their standing instructions guide both ordinary replies and listening turns. Adjust Lurk style to control when they speak. A larger roster can consume more provider calls; the existing automatic-turn limit still governs follow-ups.

## Change an agent's role

Room Settings has a separate card for every agent, including model, effort where supported, and standing instructions. Instructions are saved with the room and delivered on every invocation, including resumed conversations, retries, listening turns, and reviews. Editing or clearing instructions starts a fresh native session for that agent, while retaining the room transcript. Other agents keep their sessions.

The instructions describe a role, not an access boundary. Everyone participates in a shared transcript and workspace; a privacy-focused agent does not receive a private channel or stronger sandbox automatically.

Agent names, providers, and roster membership are fixed after creation. Create another room for a different roster. Model, effort, and instructions remain editable.

## Pair mode

Pair mode still has two roles: one worker and one reviewer. `/pair start @astra <task>` selects Astra as worker and the first other agent in roster order as reviewer. Other agents remain individually addressable; they do not become extra Pair reviewers. A one-agent room cannot start Pair mode.

## Verification

`npm ci` installs development-only test tools. `npm run test:all` runs unit, integration, fake-provider, browser, and package checks. The new roster coverage is also available as `npm run test:multi-agent`; browser cases live in `test/browser-roster.mjs`. Tests use isolated room libraries and fake provider CLIs.

For the original release's capabilities, read [What Parley could do in 1.2.1](CURRENT-FEATURES.md).
