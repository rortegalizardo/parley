import { normalizeHopBudget, newCapEdges, consumesContinuation, isAutomaticPolicy } from "./budget-policy.mjs";

export function createCausalCoordinator(deps, room, {
  userTurn, scope, chain, gen, relayPolicy, hopRun, invoked = new Set(),
}) {
  const { HOP_SAFETY_HOPS, relayUsed, findHopTarget, persistLurkOutcome, isEntryResult,
    otherSeat, lurkReplyTarget, withdrawnFrom, chainHalted, isAsleep, noteSleepSkip, seatOccupied,
    waitForHopSeat, broadcast, roomSummary, runHopTurn, recordRelayLaunch, HOP_FAILED,
    STEP_STOPPED, STEP_CAPPED, SEAT_ASLEEP, deliverCausalAnswer, causalAnswerRange, appendEntry,
    CAUSAL_CONTINUATION_INSTRUCTION } = deps;
  const configuredBudget = normalizeHopBudget(relayPolicy && relayPolicy.hopBudget, -1);
  const automatic = isAutomaticPolicy(relayPolicy);
  const hopLimit = configuredBudget < 0 ? (relayPolicy.safetyLimit || HOP_SAFETY_HOPS) : configuredBudget;
  const recipientScope = Array.isArray(userTurn.meta?.recipientScope) ? new Set(userTurn.meta.recipientScope) : null;
  const fanout = userTurn.target === "both" || String(userTurn.target).includes(",");
  const allowPlain = fanout;
  let hops = Math.max(Number(hopRun && hopRun.used) || 0, relayUsed(room, userTurn.n));
  const handled = new Set();
  const cappedTargets = new Map();
  const requests = [];
  const answers = [];
  let finalized = false;
  let activeRequest = null;
  let activeAnswer = null;
  const requestTarget = (request) => request.target ||
    findHopTarget(room, request.entry, { allowPlain });
  // A single entry can need delivery to several peers. Track the edge, not
  // just the source entry, or one delivery erases another peer's cap/Stop.
  const edgeKey = (n, target) => `${n}:${target}`;
  const requestKey = (request) => edgeKey(request.entry.n, requestTarget(request));
  const answerKey = (answer) => edgeKey(answer.reply.n, answer.recipient);
  const requestOutcome = (request, target, reason) => persistLurkOutcome(room, target, {
    sinceN: request.entry.n, throughN: request.entry.n, triggerN: request.entry.n,
  }, `request-${reason}`);

  const enqueueInitial = (entries, eligibleAuthors = new Set()) => {
    if (finalized) return;
    for (const entry of [...entries].filter(isEntryResult).sort((a, b) => a.n - b.n)) {
      if (fanout) {
        const peers = Object.keys(room.state.agents).filter((id) => id !== entry.author);
        for (const target of peers.filter((id) => eligibleAuthors.has(id))) {
          requests.push({ entry, target, kind: "sibling" });
        }
        const requested = findHopTarget(room, entry, { allowPlain });
        if (requested && !eligibleAuthors.has(requested) && withdrawnFrom(room, requested, userTurn)) {
          // A surviving agent's explicit request after split cancellation is
          // distinct new causal work. Failure, Stop and sleep are not
          // withdrawals, so those dispositions never become an auto-retry.
          if (requested && requested !== entry.author) {
            requests.push({ entry, target: requested, kind: "explicit" });
          }
        }
      } else {
        // A single addressed reply wakes its peer only when it actually asks.
        requests.push({ entry, target: null, kind: "explicit" });
      }
    }
  };

  const enqueueLurks = (entries) => {
    if (finalized) return;
    for (const entry of [...entries].filter(isEntryResult).sort((a, b) => a.n - b.n)) {
      const target = findHopTarget(room, entry, { allowPlain }) ||
        (lurkReplyTarget ? lurkReplyTarget(room, entry, userTurn.n) : otherSeat(room, entry.author));
      requests.push({ entry, target, kind: "lurk" });
    }
  };

  const drainRequests = async () => {
    while (requests.length && !chainHalted(room, chain)) {
      if (gen !== room.generation) return;
      const request = activeRequest = requests.shift();
      const trigger = request.entry;
      const charged = consumesContinuation(request.kind, relayPolicy);
      const target = requestTarget(request);
      const key = edgeKey(trigger.n, target);
      if (!target || target === trigger.author || (recipientScope && !recipientScope.has(target))) continue;
      // Once causal routing selects a seat, outer lurk fanout must not invoke it
      // again as a different delivery class if this request caps, sleeps, fails
      // or times out. Its durable request disposition is the one truth.
      invoked.add(target);

      if (room.state.agents[target].cursor >= trigger.n) {
        handled.add(key);
        cappedTargets.delete(key);
        continue;
      }
      if (isAsleep(room, target)) {
        noteSleepSkip(room, target, "hop", { trigger, sourceN: trigger.n });
        requestOutcome(request, target, "asleep");
        handled.add(key);
        continue;
      }
      if (charged) hops = Math.max(hops, relayUsed(room, userTurn.n));
      if (charged && hops >= hopLimit) {
        cappedTargets.set(key, { n: trigger.n, target });
        continue;
      }
      if (seatOccupied(room, target)) {
        const ready = await waitForHopSeat(room, target, gen, chain);
        if (gen !== room.generation) return;
        if (!ready) {
          broadcast(room, { type: "lurk", agent: target, spoke: false, skipped: true });
          requestOutcome(request, target, chainHalted(room, chain) ? "stopped" : "wait-aborted");
          handled.add(key);
          continue;
        }
      }
      // User-lane work can carry this request while it waits for the seat.
      if (gen !== room.generation) return;
      if (chainHalted(room, chain)) {
        requestOutcome(request, target, "stopped");
        handled.add(key);
        continue;
      }
      if (room.state.agents[target].cursor >= trigger.n) {
        handled.add(key);
        cappedTargets.delete(key);
        continue;
      }
      if (isAsleep(room, target)) {
        noteSleepSkip(room, target, "hop", { trigger, sourceN: trigger.n });
        requestOutcome(request, target, "asleep");
        handled.add(key);
        continue;
      }

      // Charged legs carry the budget countdown alongside their ground rules;
      // the rules themselves are static per kind and deduplicated per session
      // inside runHopTurn. A continuation keeps its full composed text.
      const legOpts = request.kind === "continuation" ? { instruction: CAUSAL_CONTINUATION_INSTRUCTION }
        : { instructionKey: charged ? "hop" : request.kind === "sibling" ? "sibling" : "lurkReturn" };
      const reply = await runHopTurn(room, target, trigger, userTurn.n, scope, {
        chain,
        phase: charged ? "hop" : "attention",
        receiptMode: charged ? "hop" : "attention",
        causalDelivery: request.kind === "continuation",
        ...legOpts,
        signalFailure: true,
        allowEmpty: true,
        relayPolicy,
        deliveryKind: request.kind,
        meta: charged ? null : {
          hop: false,
          causalRequest: { sourceN: trigger.n, kind: request.kind },
        },
        onLaunch: charged && !automatic ? () => {
          hops = recordRelayLaunch(room, userTurn.n, hops);
          if (hopRun) hopRun.used = hops;
          broadcast(room, { type: "room", room: roomSummary(room) });
          return { rootN: userTurn.n, triggerEntryN: trigger.n, index: hops,
            budget: configuredBudget, limit: hopLimit, source: relayPolicy.source };
        } : null,
      });
      if (gen !== room.generation) return;
      handled.add(key);
      cappedTargets.delete(key);
      if (STEP_CAPPED && reply === STEP_CAPPED) continue;
      if (reply === HOP_FAILED) { requestOutcome(request, target, "failed"); continue; }
      if (reply === STEP_STOPPED) { requestOutcome(request, target, "stopped"); continue; }
      if (reply === SEAT_ASLEEP) { requestOutcome(request, target, "asleep"); continue; }
      if (!isEntryResult(reply) && room.state.agents[target].cursor < trigger.n) {
        requestOutcome(request, target, "failed");
        continue;
      }
      if (isEntryResult(reply)) answers.push({
        reply, recipient: trigger.author, kind: request.kind,
      });
    }
    activeRequest = null;
  };

  const drainAnswers = async () => {
    while (answers.length && !chainHalted(room, chain)) {
      if (gen !== room.generation) return;
      const answer = activeAnswer = answers.shift();
      if (handled.has(answerKey(answer))) continue;
      const result = await deliverCausalAnswer(room, {
        recipient: answer.recipient, reply: answer.reply, rootN: userTurn.n,
        chain, gen, kind: answer.kind, terminal: false, relayPolicy,
      });
      handled.add(answerKey(answer));
      if (result.seen) cappedTargets.delete(answerKey(answer));
      if (gen !== room.generation) return;
      if (isEntryResult(result.entry)) requests.push({
        entry: result.entry, target: answer.reply.author,
        kind: "continuation",
      });
    }
    activeAnswer = null;
  };

  const disposePending = (reason) => {
    if (gen !== room.generation) return;
    if (activeRequest && !handled.has(requestKey(activeRequest)) &&
        !cappedTargets.has(requestKey(activeRequest))) requests.unshift(activeRequest);
    if (activeAnswer && !handled.has(answerKey(activeAnswer))) answers.unshift(activeAnswer);
    activeRequest = activeAnswer = null;
    while (requests.length) {
      const request = requests.shift();
      const target = requestTarget(request);
      if (!target || target === request.entry.author) continue;
      invoked.add(target);
      if (room.state.agents[target].cursor < request.entry.n) {
        requestOutcome(request, target, reason);
      }
      handled.add(requestKey(request));
    }
    while (answers.length) {
      const answer = answers.shift();
      if (handled.has(answerKey(answer))) continue;
      persistLurkOutcome(room, answer.recipient, causalAnswerRange(answer.reply),
        room.state.agents[answer.recipient].cursor >= answer.reply.n
          ? "closed-by-delivery" : `closure-${reason}`);
      handled.add(answerKey(answer));
    }
  };

  const settle = async () => {
    if (finalized) return;
    while (requests.length || answers.length) {
      if (gen !== room.generation) return;
      if (chainHalted(room, chain)) {
        return;
      }
      await drainRequests();
      if (gen !== room.generation) return;
      if (chainHalted(room, chain)) {
        return;
      }
      await drainAnswers();
    }
  };

  const finishCaps = () => {
    if (gen !== room.generation) return false;
    hops = Math.max(hops, relayUsed(room, userTurn.n));
    for (const [key, { n, target }] of cappedTargets) {
      if (room.state.agents[target].cursor >= n) cappedTargets.delete(key);
    }
    const provenance = { rootN: userTurn.n, budget: configuredBudget, used: hops,
      limit: hopLimit, source: relayPolicy.source || "room", ...(automatic ? { accounting: "automatic" } : {}) };
    const dropped = newCapEdges(room.entries,
      [...cappedTargets.values()], provenance,
      (edge) => console.error(`parley: conflicting cap provenance for ${edge.target}:${edge.n}; retaining original`));
    cappedTargets.clear();
    if (!dropped.length) return false;
    if (hopRun) hopRun.phase = configuredBudget < 0 ? "safety" : "capped";
    appendEntry(room, {
      kind: "system", author: "system",
      text: `${automatic ? "Automatic-turn limit" : configuredBudget < 0 ? "🛑 Until-settled safety boundary" : "⛓ Continuation limit"} reached — ${hops}/${hopLimit} ${automatic ? "automatic turns" : "continuations"} used for this message. ` +
        `Parley did not launch ${dropped.map(({ n, target }) => `${target}'s turn to receive message #${n}`).join(" or ")}. ` +
        `This limit came from ${relayPolicy.source === "message" ? "your message override" : relayPolicy.source === "solo" ? "Solo" : "the room policy accepted with this message"}. ` +
        (automatic ? "No new automatic start is authorized by this message. This is not agreement or successful delivery. " : "Separately owed structural or catch-up delivery may still complete. ") +
        "Blocked replies remain in the transcript; later context depends on delivery and withholding rules. Send a new message to continue.",
      meta: {
        relayCap: {
          ...provenance, dropped,
        },
      },
    });
    broadcast(room, { type: "room", room: roomSummary(room) });
    return true;
  };

  // Terminal only: never re-enter scheduling, even when an unexpected exception
  // interrupted a partially drained queue. A replaced generation owns nothing.
  const finalize = () => {
    if (finalized) return;
    finalized = true;
    if (gen !== room.generation) return;
    disposePending(chainHalted(room, chain) ? "stopped" : "failed");
    finishCaps();
  };
  return { invoked, enqueueInitial, enqueueLurks, settle, finishCaps, finalize };
}
