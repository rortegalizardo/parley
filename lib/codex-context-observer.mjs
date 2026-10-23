import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SCAN_ENTRIES = 50000;
const CHUNK = 256 * 1024;
const MAX_LINE = 32 * 1024 * 1024;

// Only directory entries are searched. No other thread's file is opened.
function findRollout(home, threadId) {
  const root = fs.realpathSync(path.join(home, "sessions"));
  const matches = [];
  let remaining = MAX_SCAN_ENTRIES;
  const basename = new RegExp(`^rollout-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-${threadId}(?:_[0-9a-f-]{36})?\\.jsonl$`, "i");
  const visit = (dir, depth) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (--remaining < 0) throw new Error("Session folder is too large to locate this conversation safely.");
      if (entry.isFile() && basename.test(entry.name)) matches.push(path.join(dir, entry.name));
      else if (depth < 3 && entry.isDirectory() && /^\d{2,4}$/.test(entry.name)) visit(path.join(dir, entry.name), depth + 1);
    }
  };
  visit(root, 0);
  if (matches.length > 1) throw new Error("Multiple session logs match this conversation; compaction visibility is unavailable.");
  return matches[0] || null;
}

// A persisted `compacted` checkpoint is written only after Codex replaces its
// live history (rust-v0.162.1 core/src/session/mod.rs:3856-3952). Do not report
// item.started, warnings, token changes, or legacy companion notifications.
export function observeCodexContext({ home, sessionRef, startedAt = Date.now(), ephemeral = false,
  isCurrent = () => true, onCompaction, onStatus, intervalMs = 400 }) {
  let threadId = UUID.test(sessionRef || "") ? sessionRef.toLowerCase() : null;
  let file = null, identity = null, offset = 0, pending = Buffer.alloc(0), pendingOffset = 0;
  let discardPartial = false, verified = false, disabled = ephemeral, closed = false, observed = false;
  let lastStatus = "", lastDiscovery = 0;
  const seen = new Set();
  const status = (state, reason) => {
    if (!isCurrent()) return;
    const key = state + reason;
    if (key === lastStatus) return;
    lastStatus = key;
    onStatus?.({ provider: "codex", status: state, reason, at: new Date().toISOString(), ...(threadId ? { threadId } : {}) });
  };
  const unavailable = (reason) => { disabled = true; status("unavailable", reason); };
  const safeOpen = (candidate) => {
    if (!fs.lstatSync(candidate).isFile() || fs.lstatSync(candidate).isSymbolicLink()) throw new Error("Session log is not a regular file.");
    return fs.openSync(candidate, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  };
  const verify = (fd) => {
    const buffer = Buffer.alloc(1024 * 1024);
    const length = fs.readSync(fd, buffer, 0, buffer.length, 0);
    const end = buffer.subarray(0, length).indexOf(10);
    if (end < 0) return false;
    let meta;
    try { meta = JSON.parse(buffer.subarray(0, end).toString("utf8")); } catch { throw new Error("Session log metadata is invalid."); }
    if (meta.type !== "session_meta" || String(meta.payload?.id || "").toLowerCase() !== threadId) {
      throw new Error("Session log identity does not match this conversation.");
    }
    return true;
  };
  const discover = (baseline = false) => {
    if (!threadId || disabled) return;
    const candidate = findRollout(home, threadId);
    if (!candidate) return;
    const fd = safeOpen(candidate);
    try {
      const stat = fs.fstatSync(fd);
      if (!verify(fd)) return;
      file = candidate; identity = `${stat.dev}:${stat.ino}`; verified = true;
      if (baseline) {
        offset = stat.size; pendingOffset = offset;
        if (offset) { const last = Buffer.alloc(1); fs.readSync(fd, last, 0, 1, offset - 1); discardPartial = last[0] !== 10; }
      }
    } finally { fs.closeSync(fd); }
    status("watching", "Codex compaction reports are available for this conversation.");
  };
  const consume = (line, lineOffset) => {
    let record;
    try { record = JSON.parse(line.toString("utf8")); } catch { return; }
    if (record.type !== "compacted" || typeof record.payload?.message !== "string") return;
    const time = Date.parse(record.timestamp);
    // Fresh files may already contain records when stdout reveals the thread.
    // Exact record timestamps exclude history copied/forked before this attempt.
    if (!Number.isFinite(time) || time < startedAt || time > Date.now() + 5000) return;
    const payload = record.payload;
    const checkpoint = typeof payload.compaction_response_id === "string" ? payload.compaction_response_id
      : typeof payload.window_id === "string" ? payload.window_id
        : crypto.createHash("sha256").update(line).digest("hex");
    const eventId = `codex-rollout:${threadId}:${checkpoint}`;
    if (seen.has(eventId) || !isCurrent()) return;
    seen.add(eventId); observed = true;
    onCompaction?.({ at: new Date(time).toISOString(), providerEventId: eventId, provenance: "codex_rollout",
      threadId, checkpointOffset: lineOffset, ...(Number.isSafeInteger(record.ordinal) ? { ordinal: record.ordinal } : {}) });
  };
  const poll = (final = false) => {
    if (disabled || closed || !isCurrent()) return;
    try {
      if (!file && (final || Date.now() - lastDiscovery >= 1000)) { lastDiscovery = Date.now(); discover(false); }
      if (!file) return;
      const fd = safeOpen(file);
      try {
        const stat = fs.fstatSync(fd);
        if (`${stat.dev}:${stat.ino}` !== identity || stat.size < offset) throw new Error("Session log changed while observing it.");
        let chunks = 0;
        while (offset < stat.size && chunks++ < (final ? 256 : 8)) {
          const buffer = Buffer.alloc(Math.min(CHUNK, stat.size - offset));
          const bytes = fs.readSync(fd, buffer, 0, buffer.length, offset);
          if (!bytes) break;
          if (!pending.length) pendingOffset = offset;
          offset += bytes;
          pending = Buffer.concat([pending, buffer.subarray(0, bytes)]);
          let end;
          while ((end = pending.indexOf(10)) >= 0) {
            const line = pending.subarray(0, end);
            if (!discardPartial) consume(line, pendingOffset);
            discardPartial = false;
            pending = pending.subarray(end + 1); pendingOffset += end + 1;
          }
          if (pending.length > MAX_LINE) throw new Error("Session log record exceeds the observation limit.");
        }
        if (final && offset < stat.size) throw new Error("Session log grew beyond the observation limit.");
      } finally { fs.closeSync(fd); }
    } catch (error) {
      if (error.code === "ENOENT" && !file) return;
      unavailable(error.code === "EACCES" || error.code === "EPERM"
        ? "Codex session activity cannot be read; compaction visibility is unavailable."
        : error.message || "Codex session activity is unavailable.");
    }
  };
  if (ephemeral) status("unavailable", "Codex session saving is disabled; compaction visibility is unavailable.");
  else {
    status("checking", "Waiting for Codex session activity to confirm compaction visibility.");
    // Baseline a resumed conversation before its process is launched.
    if (threadId) { try { discover(true); } catch (error) { if (error.code !== "ENOENT") unavailable("Codex session activity cannot be read; compaction visibility is unavailable."); } }
  }
  const timer = setInterval(() => poll(), intervalMs);
  timer.unref?.();
  return {
    setThread(ref) {
      if (!UUID.test(ref || "")) return;
      const next = ref.toLowerCase();
      if (next === threadId) return; // stdout deltas must not bypass the polling interval
      if (threadId && next !== threadId) { unavailable("Codex reported a different conversation; compaction visibility is unavailable for this turn."); return; }
      threadId = next; poll();
    },
    finish() {
      if (closed) return;
      clearInterval(timer); poll(true); closed = true;
      if (!disabled && isCurrent()) status(verified ? "available" : "unavailable", verified
        ? observed ? "Codex confirmed compaction during this turn." : "Codex session activity was read; no compaction was reported during this turn."
        : "Codex session activity was not available; compaction visibility is unavailable for this turn.");
    },
  };
}
