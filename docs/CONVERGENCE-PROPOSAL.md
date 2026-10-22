# Multiagent convergence proposal

Draft design, 22 October 2026. The user chose **make `@all` converge by default**. This proposal has not changed the running application. It combines three thinking pods: conversation experience, consensus integrity, and the current scheduler. It applies to the entire selected roster, with no fixed agent-count limit.

## The bar and what happens today

`@claude` and `@codex` are the names of the default room's two agents, not a list of allowed providers. The default room on 4142 was read-only checked and still contains exactly those two names. Adding eight agents gives eight named buttons plus `@all`; the existing chip row wraps. Agents using the same provider are distinguished by their own names. `@privacy` can therefore target a Claude agent independently of `@fable`, another Claude agent.

Today `@all` requests independent initial replies in parallel. Successful replies can then trigger peer deliveries, gated by cursors, sleep state and the message's automatic-turn budget. Four initial authors can create up to twelve directed sibling-attention edges; eight can create up to fifty-six. These are potential delivery relationships, not a promise that every edge launches a provider call. Limits and skipped/redundant deliveries constrain actual calls.

There is no common decision draft, record of each agent's approval, or test for unanimous agreement. A stopped or settled exchange is not evidence of consensus. Pair supplies a worker and reviewer workflow, but cannot represent approval by every member of an arbitrary roster.

Source map: [dynamic recipient buttons](../ui/app.js) (`renderSeatsUI`, `mentionOptions`); [wrapping composer](../ui/styles.css) (`.chips`); [peer scheduler](../lib/causal-coordinator.mjs); [turn accounting and Pair behavior](conversation.md).

## The proposed default experience

Sending `@all <question>` starts one discussion that aims to produce one agreed handoff. The existing agents retain their names, providers, models, effort and standing instructions. No subset is silently selected, and no extra provider agent is silently created. A run requires a nonempty, finite roster, with no hidden count cap. If available resources or the chosen budget cannot support that full roster, explain the shortfall before starting rather than shrinking it. With only one agent, return a normal single-agent answer and label it accordingly; do not imply independent multiagent agreement.

Show a compact progress card above the conversation:

**8 participants · Gathering views → Drafting → Reviewing 6/8 → Agreement**

The agent contributions remain inspectable under that card, but intermediate replies do not arrive as competing final answers. The final agreed result appears once, with an expandable approval record. Individual `@name` requests continue to work normally. A visible **Parallel replies** option preserves the current independent-answer behavior when that is what the user wants; Lurk remains useful outside convergence runs.

For larger rosters, use **Auto · @all · Agents (8)** with a searchable named-agent picker and `@` autocomplete. The picker shows name, provider and role summary. This is a proposed refinement; the current application renders all individual buttons and wraps them.

## How the agents reach agreement

1. **Gather independent positions.** Snapshot the question, participants and their settings for this run. Every participant receives the same task and authorized shared context. Each submits a short recommendation, supporting reasons and concerns. Enforce a barrier in the engine: no peer delivery, automatic hop, drafting or review starts until every participant has submitted its initial position. A missing submission makes the run incomplete. Stage submissions outside the context supplied to peers until that barrier closes, so the fastest answer does not anchor everyone else's initial response. This is context isolation for the round, not a claim that agents sharing a workspace have separate security boundaries.
2. **Draft one result.** Automatically assign an existing participant the procedural job of assembling a candidate from those positions. Keep that drafter stable within the run. It has no extra voting authority and cannot dismiss another participant's objection. The user need not appoint a lead or turn the other agents into lurkers.
3. **Review the exact draft.** All participants, including the drafter, review the same numbered version in parallel. Each explicitly approves it, approves with a recorded nonblocking reservation, or objects with the disputed clause and a concrete required change or missing evidence.
4. **Revise unresolved points.** The drafter responds to the objections in one new candidate. An objection remains open until its author accepts the resolution; the drafter cannot mark it resolved unilaterally. Any change to the candidate invalidates its previous approvals. Everyone reviews the revised version.
5. **Deliver the approved text once.** Finish only when every required participant has explicitly approved the same unchanged version and no blocking objections remain. Render that approved text directly with its approval record. Do not run a final creative rewrite after approval, which would produce a document nobody reviewed.

Approval is tied to the server-owned run, participant snapshot and immutable draft hash/version. A changed draft, changed participant snapshot or task-changing user message invalidates every prior approval. Another agent saying “Privacy agreed” cannot supply Privacy's vote. Silence, existing Lurk `[pass]` responses, malformed responses, failed calls and timeouts are not approvals. Existing Pair `[approve]` detection should not be reused as a global consensus signal without the run/version checks.

## Four agents discussing simultaneously

Fable proposes an approach. Astra examines implementation. The adversary looks for counterexamples. Privacy checks data handling. They begin concurrently, then meet at the same draft instead of generating uncontrolled cross-conversations.

Suppose Privacy objects to retaining raw personal data and the adversary objects to an unsupported reliability claim. The next draft removes unnecessary retention and adds a measurable verification step. All four review version two. If all approve, the user receives one agreed plan with the rationale and next action. If the adversary still identifies an unresolved failure, the system cannot truthfully claim four-person agreement.

The same process works with eight participants: eight initial positions, one candidate, eight reviews. No four-agent ceiling or special eight-agent ceiling is introduced.

## Honest stopping and resource controls

The goal is unanimous agreement, not a guaranteed agreement regardless of evidence. An adversarial role should challenge claims and accept adequate resolutions; instructions that demand endless opposition may make agreement impossible.

Use configurable review rounds and a visible provider-call budget. A proposed starting default is two review rounds; this is an editable operating budget, not a roster limit. For two or more participants, one initial round, one candidate and one review by each participant take **2N + 1 planned invocations**: nine with four agents, seventeen with eight. A second candidate and full review add **N + 1**: fourteen or twenty-six total. These counts exclude retries and provider-internal work; retries consume the overall call budget. Show calls and actual usage rather than inventing a dollar estimate or group confidence score.

The current default of four automatic turns cannot simply be relabeled “four review rounds.” Convergence needs its own persisted phase/round policy and call accounting. Check that the configured budget can cover a complete planned review before starting it.

| Outcome | What the user receives |
| --- | --- |
| Everyone approves the same draft | One **Agreed** handoff, with participant names and recorded reservations. |
| A material objection remains at the limit | One **Unresolved** handoff: common ground, exact disputed clause, competing positions, and the decision or evidence needed. |
| A participant is unavailable | **Incomplete** with the missing reviewer identified; offer retry or explicit rescoping. Never silently lower the approval threshold. |
| The user stops the run | A saved partial result labelled **Stopped**, with a deliberate resume or restart action. |

The user can extend the budget, answer the blocking question or explicitly change participants. Rescoping creates a new approval requirement and invalidates the old run's finalization; a three-of-four result is never labelled agreement by all four.

## Implementation boundaries

Add a dedicated convergence coordinator above the existing provider lanes. Reuse native sessions, per-agent instructions, cancellation, permission boundaries and durable event storage. Do not turn Pair into an N-agent workflow or allow ordinary peer-to-peer auto-hops to run alongside the same convergence root; either would create ambiguous completion and duplicate calls.

Persist the run ID, participant/configuration snapshot, phase, candidate versions, objections, approvals, consumed budget and final status. On recovery, reconcile in-flight deliveries and resume only unfinished work; do not automatically regenerate already approved content or repeat completed provider calls.

Adding an agent to the room does not quietly add it to an already-running review. Joining that run requires explicit rescoping and a new review. Removing a required participant requires stopping or rescoping the run first. Changes to participating agents' models, effort or instructions must either wait until the run finishes or explicitly stop and restart it; do not silently mix settings within a ratification cycle. New user instructions that change the task retire outstanding approvals. A completed agreement does not become invalid merely because the room's roster changes later.

Convergence retains today's read-only discussion boundary for `@all` in Work rooms. Executing the resulting plan is a separate action under the existing permissions and the user's instructions.

## Delivery slices and acceptance checks

1. Persist the convergence run and implement independent positions, candidate drafting, per-version approvals and bounded revision using isolated fake providers.
2. Make `@all` select convergence by default, retain an explicit Parallel replies option, and render one progress card and one final handoff.
3. Verify single-agent handling, two-, four-, eight- and larger-agent runs and insufficient-budget refusal; new draft invalidates all old votes; objections cannot be overruled by the drafter; failed/silent participants never approve; restart and Stop preserve correct state; budgets count real starts; in-flight roster changes cannot forge agreement.
4. Verify compact recipients and discussion progress at desktop and mobile widths. Review the actual served fork after delivery. Keep port 4141 and its room library untouched throughout.

No application behavior was changed during this design pass. The next engineering step is the persisted convergence coordinator and its fake-provider lifecycle tests.
