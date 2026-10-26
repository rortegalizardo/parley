import crypto from "node:crypto";

export const CONVERGENCE_STAGES = Object.freeze({ GATHER: "gathering", DRAFT: "drafting", REVIEW: "reviewing", REVISE: "revising", AGREED: "agreed", UNRESOLVED: "unresolved", INCOMPLETE: "incomplete", STOPPED: "stopped" });

export function draftHash(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

export function createConvergenceRun({ runId, rootN, task, participants, maxRounds = 2, plannedCalls }) {
  return { runId, rootN, mode: "converge", task, participants: participants.map((p) => ({ id: p.id, provider: p.provider, configHash: p.configHash || null, config: p.config || null })), phase: CONVERGENCE_STAGES.GATHER, round: 0, maxRounds: Math.max(0, Number(maxRounds) || 0), draftVersion: 0, draftHash: null, draftText: null, positions: {}, reviews: {}, rounds: [], objections: [], calls: { used: 0, planned: plannedCalls || participants.length }, final: null, createdAt: Date.now(), updatedAt: Date.now() };
}

export function classifyReview(text, expected = {}) {
  const value = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed;
  try { parsed = JSON.parse(value); } catch { return { status: "unresolved", reason: "Review was not valid JSON." }; }
  if (!parsed || parsed.runId !== expected.runId || parsed.version !== expected.version || parsed.draftHash !== expected.draftHash) {
    return { status: "unresolved", reason: "Review envelope did not match the active immutable draft." };
  }
  if (parsed.decision === "approve") return { status: "approve", reason: parsed.rationale || "Approved." };
  if (parsed.decision === "approve_with_reservation" && typeof parsed.reservation === "string" && parsed.reservation.trim()) return { status: "approve_with_reservation", reason: parsed.rationale || "Approved with reservation.", reservation: parsed.reservation || null };
  if (parsed.decision === "object") {
    const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
    const objection = parsed.objection;
    if (typeof objection === "string" && objection.trim()) {
      return { status: "block", reason: [rationale, objection].filter(Boolean).join("\n"), rationale, objection };
    }
    if (objection && !Array.isArray(objection) && typeof objection === "object" &&
        typeof objection.disputedClause === "string" && objection.disputedClause.trim() &&
        typeof objection.requiredChange === "string" && objection.requiredChange.trim()) {
      return { status: "block", rationale, objection,
        reason: [rationale, `Disputed clause: ${objection.disputedClause}`, `Required change: ${objection.requiredChange}`].filter(Boolean).join("\n") };
    }
    return { status: "unresolved", reason: "Blocking objection must be nonempty text or an object with nonempty disputedClause and requiredChange text." };
  }
  if (parsed.decision === "approve_with_reservation") return { status: "unresolved", reason: "Approval with reservation requires nonempty reservation text." };
  return { status: "unresolved", reason: "Review decision must be approve, approve_with_reservation, or object." };
}

export function composeDraft(positions) {
  return Object.entries(positions).map(([id, p]) => `## ${id}\n${p.text || "(no position returned)"}`).join("\n\n");
}

export function allApproved(reviews, participants, version, hash) {
  return participants.length > 0 && participants.every((p) => reviews[p.id] && ["approve", "approve_with_reservation"].includes(reviews[p.id].status) && reviews[p.id].version === version && reviews[p.id].draftHash === hash);
}

// Pure recovery projection: opening a room can explain a previously rejected
// but valid saved vote without rewriting state or spending another provider call.
// An explicit Resume/Extend may persist this same projection before scheduling.
export function reparseStoredReviews(run) {
  const round = run.rounds?.at(-1);
  if (!round?.text || round.version !== run.draftVersion || round.hash !== run.draftHash ||
      round.text !== run.draftText || draftHash(round.text) !== round.hash) return run;
  const reviews = { ...round.reviews };
  const reusedReviews = [];
  for (const { id } of run.participants) {
    const review = reviews[id];
    if (review?.status !== "unresolved" || review.error || typeof review.text !== "string" ||
        review.version !== round.version || review.draftHash !== round.hash) continue;
    const vote = classifyReview(review.text, { runId: run.runId, version: round.version, draftHash: round.hash });
    if (vote.status === "unresolved") continue;
    reviews[id] = { ...review, ...vote, recoveredFromSavedText: true };
    reusedReviews.push(id);
  }
  if (!reusedReviews.length) return run;
  const pendingReviewAgents = run.participants.map((p) => p.id).filter((id) => !reviews[id] || reviews[id].status === "unresolved");
  const descriptions = reusedReviews.map((id) => `@${id} returned a valid ${reviews[id].status === "block" ? "blocking objection" : "approval"}`);
  const reason = descriptions.join("; ") + ". Resume continues from the saved reviews without repeating these reviews.";
  const nextRound = { ...round, reviews };
  return { ...run, rounds: [...run.rounds.slice(0, -1), nextRound], reviews,
    objections: Object.entries(reviews).filter(([, r]) => r.status === "block").map(([agent, r]) => ({ agent, version: round.version, text: r.reason })),
    recovery: { reusedReviews, pendingReviewAgents, reason } };
}
