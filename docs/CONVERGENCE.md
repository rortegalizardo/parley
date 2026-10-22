# One agreed handoff

Choose **@all** or type `@all <task>`. Every agent in the room supplies an independent position. One existing agent combines those positions into a candidate, then everyone—including the drafter—reviews exactly that version. Objections trigger a revised draft and a fresh vote from everyone. The approved text appears once as an **Agreed handoff**, with an inspectable approval record.

The composer uses **Auto · @all · Agents (N)**. Open Agents to search names, providers, or standing roles and select one person. There is no four- or eight-agent limit. Settings still controls membership, models, effort, and persistent instructions. A one-agent room produces an ordinary answer.

## Outcomes

- **Agreed:** every participant explicitly approved the same draft. Nonblocking reservations remain visible.
- **Unresolved:** review rounds ended with objections. The app does not claim agreement.
- **Incomplete:** a position or review failed, was silent, malformed, or could not fit the remaining call budget.
- **Stopped:** work was stopped; completed contributions remain saved.

Inspect contributions to read positions, candidate versions, votes, and reservations. A prose sentence containing “agree,” a `[pass]`, or another agent claiming someone approved cannot count as a vote. Reviews must identify the exact run, version, and SHA-256 of the candidate.

## Calls and recovery

The default is **2 review rounds**. For N agents and R rounds, planned capacity is `N + R × (N + 1)`: N initial positions, then one drafter and N reviews per round. Four agents with two rounds allow 14 calls; eight allow 26. A first-round agreement stops early. Provider recovery retries also consume this budget. The interface shows used/planned calls; this is not a dollar estimate.

**Resume** reuses completed positions, drafts, and reviews and retries only missing work. **Extend review** adds one round and `N + 1` calls, then continues. A process restart never automatically launches provider calls: reopen the room and use its recovery controls. Stop cancels the convergence providers and prevents late agreement.

A new task, roster, or configuration cannot join an active run. Stop or finish it first. After a changed task or configuration, start a new `@all` discussion so everyone evaluates the same scope. Saved transcripts and earlier handoffs remain available. A run supports 1–99 review rounds as an operating budget; this is unrelated to agent count.

## Other conversation modes

Choose **Parallel replies** in the Agents menu to use independent answers and the existing automatic-turn policy. Individual mentions, Lurk, and Pair retain their existing workflows. Review rounds and automatic turns are separate controls. In Work rooms, convergence retains the existing read-only discussion boundary; ask an individual agent to implement the result afterward.

The personal fork runs at **http://127.0.0.1:4142**, using `~/.parley-fork`. Launch it with `parley-mine`. Its server and data are separate from the original session on port 4141.
