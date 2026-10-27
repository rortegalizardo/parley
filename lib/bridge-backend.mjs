import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadBridgeStore, privateRead, privateWrite, authenticateBridge, bridgeError, bridgeCursor, parseBridgeCursor, validateBridgeLocation } from './bridge-store.mjs';

const fail = (message, status = 400, code) => { throw bridgeError(message, status, code); };
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function createBridgeBackend({ root, port, listRooms, loadRoom, saveState, busy, send, append }) {
  let store;
  const processId = crypto.randomUUID();
  const storage = () => {
    validateBridgeLocation(root, `http://127.0.0.1:${port()}`);
    return store ||= loadBridgeStore(root);
  };
  const ticketFile = (id) => path.join(storage().dir, 'tickets', `${id}.json`);
  const saveTicket = (ticket) => privateWrite(ticketFile(ticket.ticketId), ticket);
  const scoped = (client, name) => {
    if (!client.rooms.includes('*') && !client.rooms.includes(name)) fail('Room is outside this credential scope', 403, 'forbidden');
    if (!listRooms().includes(name)) fail('Room does not exist', 404, 'room_not_found');
    return loadRoom(name);
  };
  const binding = (room) => {
    if (!room.state.bridgeConversationId) { room.state.bridgeConversationId = crypto.randomUUID(); saveState(room); }
    return { serverId: storage().serverId, room: room.name, conversationId: room.state.bridgeConversationId,
      rosterHash: hash(Object.entries(room.cfg.agents).map(([id, cfg]) => ({ id, provider: cfg.provider, config: cfg }))) };
  };
  const checkBinding = (room, body) => {
    const b = binding(room);
    if (body.conversationId !== b.conversationId) fail('Conversation was reset; discover rooms again', 409, 'stale_conversation');
    if (body.rosterHash !== b.rosterHash) fail('Room settings or roster changed; discover rooms again', 409, 'stale_roster');
    return b;
  };
  const refresh = (ticket, room) => {
    const mutableConvergence = ticket.convergenceRunId && ['incomplete', 'unresolved', 'stopped'].includes(ticket.result?.status);
    if (ticket.result && !mutableConvergence) return ticket;
    const sameConversation = room.state.bridgeConversationId === ticket.conversationId;
    const entry = sameConversation && room.entries.find((e) => e.meta?.harness?.requestId === ticket.ticketId);
    if (entry) ticket.rootN = entry.n;
    const cv = sameConversation && [room.state.convergence, ...(room.state.convergenceHistory || [])].find((c) => c && c.rootN === ticket.rootN);
    if (mutableConvergence && sameConversation && cv && ['gathering', 'drafting', 'reviewing', 'revising'].includes(cv.phase)) { delete ticket.result; ticket.status = 'pending'; delete ticket.completedAt; saveTicket(ticket); }
    if (mutableConvergence && !sameConversation) return ticket;
    if (!sameConversation) ticket.result = { status: 'stale_conversation', reason: 'Conversation was reset before this request completed.' };
    else if (cv) {
      ticket.convergenceRunId = cv.runId;
      ticket.progress = { phase: cv.phase, round: cv.round || 0, completedPositions: Object.keys(cv.positions || {}).length, completedReviews: Object.keys(cv.reviews || {}).length, calls: cv.calls };
      if (cv.final && !['gathering', 'drafting', 'reviewing', 'revising'].includes(cv.phase)) ticket.result = {
        ...structuredClone(cv.final), status: cv.phase, runId: cv.runId, participants: cv.participants.map(({ id, provider, configHash, reviewOnly }) => ({ id, provider, configHash, ...(reviewOnly ? { reviewOnly: true } : {}) })),
        reviews: structuredClone(cv.reviews), finalEntryN: cv.finalEntryN || null,
      };
    } else if (ticket.intent === 'context' && entry) ticket.result = { status: 'recorded', messageN: entry.n };
    else if (entry) {
      const addressed = entry.meta?.audience?.addressed || ticket.participants;
      const replies = room.entries.filter((e) => e.kind === 'agent' && e.meta?.replyTo === ticket.rootN && addressed.includes(e.author));
      if (addressed.length && addressed.every((id) => replies.some((e) => e.author === id))) ticket.result = { status: 'completed', replies: structuredClone(replies) };
      else if (ticket.processId !== processId || (ticket.state === 'sent' && !busy(room))) ticket.result = {
        status: 'incomplete', reason: ticket.processId !== processId ? 'Server restarted during delivery; provider work was not replayed.' : 'Delivery ended without a complete response.',
        replies: structuredClone(replies),
      };
    } else if (ticket.processId !== processId) ticket.result = { status: 'incomplete', reason: 'Server restarted during submission; request was not replayed.' };
    if (ticket.result) { ticket.status = ticket.result.status; ticket.completedAt = Date.now(); saveTicket(ticket); }
    return ticket;
  };
  const publicTicket = (ticket) => ({ ticketId: ticket.ticketId, serverId: ticket.serverId, room: ticket.room, conversationId: ticket.conversationId, rosterHash: ticket.rosterHash,
    target: ticket.target, intent: ticket.intent, status: ticket.result?.status || 'pending', ...(ticket.progress ? { progress: ticket.progress } : {}), ...(ticket.rootN ? { messageN: ticket.rootN } : {}), ...(ticket.result ? { result: ticket.result } : {}) });
  const cursorFor = (client, value) => bridgeCursor(storage(), { clientId: client.clientId, ...value });
  const readTicket = (client, id) => {
    if (typeof id !== 'string' || !/^br-[a-f0-9]{64}$/.test(id) || !fs.existsSync(ticketFile(id))) fail('Unknown request ticket', 404, 'ticket_not_found');
    const ticket = privateRead(ticketFile(id));
    if (ticket.clientId !== client.clientId) fail('Ticket belongs to a different bridge client', 403, 'forbidden');
    return ticket;
  };
  const response = (ticket, client) => {
    const value = publicTicket(ticket);
    const revision = hash(value);
    return { ...value, cursor: cursorFor(client, { ticketId: ticket.ticketId, revision }) };
  };
  return {
    beforeReset(room) {
      if (!store) {
        if (!fs.existsSync(path.join(root, '.bridge', 'server.json'))) return;
        try { storage(); } catch { return; }
      }
      const dir = path.join(store.dir, 'tickets');
      for (const name of fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => /^br-[a-f0-9]{64}\.json$/.test(n)) : []) {
        const ticket = privateRead(path.join(dir, name));
        if (ticket.room !== room.name || (ticket.result && !ticket.convergenceRunId)) continue;
        refresh(ticket, room);
        if (!ticket.result) { ticket.result = { status: 'stale_conversation', reason: 'Conversation was reset before this request completed.' }; saveTicket(ticket); }
      }
    },
    async handle(req, body, action) {
      const client = authenticateBridge(storage(), req, port());
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Expected an object');
      if (body.serverId !== storage().serverId) fail('Bridge server binding changed', 409, 'stale_server');
      if (Object.keys(body).some((k) => ['author', 'sender', 'client', 'clientId', 'harness', 'meta', 'label', 'provenance'].includes(k))) fail('Sender identity comes from the bridge credential', 400, 'forged_identity');
      if (action === 'rooms') return { serverId: storage().serverId, rooms: listRooms().filter((n) => client.rooms.includes('*') || client.rooms.includes(n)).map((n) => {
        const room = loadRoom(n);
        return { ...binding(room), name: n, participants: Object.entries(room.cfg.agents).map(([id, cfg]) => ({ id, provider: cfg.provider })) };
      }) };
      if (action === 'wait') {
        const ticket = readTicket(client, body.ticketId);
        const room = scoped(client, ticket.room);
        const old = body.cursor ? parseBridgeCursor(storage(), body.cursor, { clientId: client.clientId, ticketId: ticket.ticketId }) : null;
        if (body.timeoutMs !== undefined && (!Number.isInteger(body.timeoutMs) || body.timeoutMs < 0 || body.timeoutMs > 25000)) fail('timeoutMs must be 0..25000');
        const deadline = Date.now() + (body.timeoutMs ?? 25000);
        while (true) {
          refresh(ticket, room);
          const value = response(ticket, client);
          const current = parseBridgeCursor(storage(), value.cursor, { clientId: client.clientId, ticketId: ticket.ticketId });
          if (ticket.result || (old && old.revision !== current.revision) || Date.now() >= deadline) return value;
          await new Promise((resolve) => setTimeout(resolve, Math.min(100, deadline - Date.now())));
        }
      }
      const room = scoped(client, body.room);
      if (action === 'send') {
        if (typeof body.idempotencyKey !== 'string' || !body.idempotencyKey.length || body.idempotencyKey.length > 200) fail('idempotencyKey must contain 1..200 characters');
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 100000) fail('text must contain 1..100000 characters');
        if (body.intent !== 'delegate' && body.intent !== 'context') fail('intent must be delegate or context');
        const ticketId = `br-${hash([client.clientId, body.idempotencyKey])}`;
        const fingerprint = hash({ room: body.room, conversationId: body.conversationId, rosterHash: body.rosterHash, text: body.text, target: body.target, intent: body.intent });
        if (fs.existsSync(ticketFile(ticketId))) {
          const ticket = readTicket(client, ticketId);
          if (ticket.fingerprint !== fingerprint) fail('Idempotency key was already used for a different request', 409, 'idempotency_conflict');
          return response(refresh(ticket, room), client);
        }
        const b = checkBinding(room, body);
        const target = body.target === '@all' ? 'both' : typeof body.target === 'string' ? [...new Set(body.target.split(',').map((id) => id.trim().replace(/^@/, '')))].join(',') : null;
        if (target !== 'both' && String(target || '').split(',').some((id) => !Object.hasOwn(room.cfg.agents, id))) fail('Target must be @all, a current named participant, or comma-separated current participants', 400, 'invalid_target');
        if (busy(room) || room.state.pair || room.queuePaused) fail('Room is busy; finish active work and resume its queue before sending', 409, 'room_busy');
        const participants = target === 'both' ? Object.keys(room.cfg.agents) : target.split(',');
        if (body.intent === 'delegate' && participants.some((id) => room.state.agents[id]?.asleep)) fail('An addressed participant is asleep', 409, 'participant_asleep');
        const ticket = { ...b, ticketId, clientId: client.clientId, processId, fingerprint, target: body.target, intent: body.intent, participants, createdAt: Date.now(), state: 'preparing' };
        saveTicket(ticket); // Commit the idempotency reservation before any append/provider call.
        const harness = { client: client.client, clientId: client.clientId, label: client.label, intent: body.intent, requestId: ticketId };
        try {
          if (body.intent === 'context') {
            const entry = append(room, { kind: 'user', author: `harness:${client.client}`, target, text: body.text, meta: { harness, audience: { addressed: [], lurking: [] } } });
            ticket.rootN = entry.n;
          } else send(room, body.text, target, harness);
          const entry = room.entries.find((e) => e.meta?.harness?.requestId === ticketId);
          if (!entry) throw Error('Bridge submission did not produce a durable transcript entry');
          ticket.rootN = entry.n; ticket.state = 'sent'; saveTicket(ticket);
          return response(refresh(ticket, room), client);
        } catch (error) {
          ticket.result = { status: 'incomplete', reason: `Submission failed: ${error.message}` }; saveTicket(ticket); throw error;
        }
      }
      const b = checkBinding(room, body);
      if (action === 'read') {
        if (body.limit !== undefined && (!Number.isInteger(body.limit) || body.limit < 1 || body.limit > 100)) fail('limit must be 1..100');
        const cursorBinding = { clientId: client.clientId, room: b.room, conversationId: b.conversationId };
        const after = body.cursor ? parseBridgeCursor(storage(), body.cursor, cursorBinding).after : 0;
        const messages = room.entries.filter((e) => e.n > after && ['user', 'agent', 'system'].includes(e.kind)).slice(0, body.limit ?? 50).map((e) => ({ n: e.n, kind: e.kind, author: e.author, target: e.target, ts: e.ts, text: e.text, ...(e.meta?.harness ? { harness: e.meta.harness } : {}), ...(e.meta?.replyTo ? { replyTo: e.meta.replyTo } : {}), ...(e.meta?.convergence ? { convergence: e.meta.convergence } : {}) }));
        return { ...b, messages, cursor: cursorFor(client, { ...cursorBinding, after: messages.at(-1)?.n ?? after }) };
      }
      fail('Unknown bridge operation', 404);
    },
  };
}
