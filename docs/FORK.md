# Your Parley fork

Based on upstream `parley-room@1.2.1` (`c4cd237`). The original MIT license and attribution are retained. The existing chat, Work, Lurk, Pair, attachments, queues, and recovery workflows remain available.

## Run it

Launch with `parley-mine`. Install that command once with `npm link` from the checkout; `npm start` from the checkout also uses the same launcher. No build step or runtime dependencies are needed. The CLI accounts you already use supply authentication and model access.

The fork uses its own port and room library by default:

```sh
parley-mine
# http://127.0.0.1:4142 · rooms in ~/.parley-fork
```

The original `~/.parley` library and its server on port 4141 remain separate. Existing upstream rooms retain their names, agent identities, transcripts, and sessions. `npx parley-room@1.2.1` still launches the original upstream version. Explicit `--root` and `--port` overrides are supported; do not point two running servers at the same room library.

## Build your four-agent table

Choose **New room** in the header or **Build your room** on the first screen. **Use the four-agent setup** opens an optional template with Fable, Astra, an adversary, and a privacy reviewer, including suggested standing instructions. A room needs at least one agent and has **no fixed roster limit**, with any mixture of the installed providers. Each agent needs a unique name; that name becomes its `@mention`.

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

## Add or remove agents in an existing room

Open **Settings → Agents in this room**. Choose **Add agent**, then set its name, provider, model, supported effort and instructions. Use **Remove** on a card to remove it. Changes are staged until **Save**; **Cancel** leaves the room unchanged. Keep at least one agent.

Saving preserves the conversation and the native sessions of retained agents. Removed agents' past messages remain in the transcript, and their names stay reserved to protect that history. New agents start fresh and receive room history when addressed. The composer updates its individual agent buttons and always offers **@all** for the current roster. Names and providers of existing agents stay fixed so historical messages remain attributable.

Removal waits until active exchanges and the affected agent's queued work or Pair role have finished. A roster changed in another tab is rejected with a request to reopen Settings, rather than silently overwriting it.

## Pair mode

Pair mode still has two roles: one worker and one reviewer. `/pair start @astra <task>` selects Astra as worker and the first other agent in roster order as reviewer. Other agents remain individually addressable; they do not become extra Pair reviewers. A one-agent room cannot start Pair mode.

## Verification

`npm ci` installs development-only test tools. `npm run test:all` runs unit, integration, fake-provider, browser, and package checks. Focused roster checks are available as `npm run test:multi-agent` and `npm run test:roster-edit`; browser cases live in `test/browser-roster.mjs`. Tests use isolated room libraries and fake provider CLIs.

For the original release's capabilities, read [What Parley could do in 1.2.1](CURRENT-FEATURES.md).
