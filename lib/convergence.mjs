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
  if (parsed.decision === "object" && typeof parsed.objection === "string" && parsed.objection.trim()) return { status: "block", reason: parsed.objection || parsed.rationale || "Objection returned." };
  return { status: "unresolved", reason: "Review decision was not recognized." };
}

export function composeDraft(positions) {
  return Object.entries(positions).map(([id, p]) => `## ${id}\n${p.text || "(no position returned)"}`).join("\n\n");
}

export function allApproved(reviews, participants, version, hash) {
  return participants.length > 0 && participants.every((p) => reviews[p.id] && ["approve", "approve_with_reservation"].includes(reviews[p.id].status) && reviews[p.id].version === version && reviews[p.id].draftHash === hash);
}
