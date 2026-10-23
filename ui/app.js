"use strict";
// ------------------------------------------------------------ state
const $ = (id) => document.getElementById(id);
const INITIAL_ROOM = new URLSearchParams(location.search).get("room") || "default";
const hopChoiceStorageKey = (room) => `parley.hopChoice:${room}`;
function storedHopChoice(room) {
  try {
    const choice = sessionStorage.getItem(hopChoiceStorageKey(room));
    if (choice === "default" || choice === "solo" || /^(?:-1|[0-8])$/.test(choice || "")) return choice;
  } catch { /* storage may be unavailable; keep the in-memory shortcut */ }
  return "default";
}
function rememberHopChoice(room, choice) {
  try { sessionStorage.setItem(hopChoiceStorageKey(room), choice); }
  catch { /* storage may be unavailable; the current page still stays sticky */ }
}
const state = {
  room: INITIAL_ROOM,
  entries: [],
  receipts: [],
  summary: null,
  providers: {},     // provider catalog (label/avatar/color/fields) from the server
  chip: "auto",
  chipRevision: 0,   // manual changes fence off older in-flight send responses
  sendVersion: 0,    // only the newest send may synchronize the selected chip
  hopChoice: storedHopChoice(INITIAL_ROOM), // per-room browser-session shortcut: default | solo | -1..8
  discussionMode: "converge", // @all default: converge | parallel
  convergenceRounds: 2,
  draftImages: [],   // native image attachments waiting for the next successful send
  draftFiles: [],    // other files waiting for the next successful send
  sending: false,
  attachmentUrls: new Map(), // room/id -> fetched blob URL
  attachmentRevision: 0,    // retires fetches that finish after a reset/room switch
  es: null,
  live: {},          // agent -> { el, mode:"think"|"stream", startedAt, text }
  streamTimer: {},   // agent -> throttle timer
  statusSeq: {},     // agent -> count of status events heard (resync staleness check)
  queue: [],         // queue snapshot rows: one per still-pending delivery
  // agent -> is its live bubble considered on screen. Undefined until the
  // observer has measured it; only an explicit false shows the composer strip.
  liveVisible: {},
  renderFromN: null, // first entry shown by the windowed transcript render
  expandedMessages: new Set(),
  expandedActivity: new Set(),
  doctor: {},        // seat -> first-run health, from /api/doctor
  eventVersion: 0,   // any newer SSE event makes a reconnect snapshot stale for live UI state
  resyncVersion: 0,
};

const discussionModeKey = (room) => `parley.discussionMode:${room}`;
const convergenceRoundsKey = (room) => `parley.convergenceRounds:${room}`;
function loadDiscussionPrefs(room) {
  try {
    const mode = sessionStorage.getItem(discussionModeKey(room));
    if (mode === "parallel" || mode === "converge") state.discussionMode = mode;
    const rounds = Number(sessionStorage.getItem(convergenceRoundsKey(room)));
    if (Number.isFinite(rounds) && rounds >= 1 && rounds <= 99) state.convergenceRounds = Math.round(rounds);
  } catch { /* session storage is optional */ }
}
function saveDiscussionPrefs() {
  try {
    sessionStorage.setItem(discussionModeKey(state.room), state.discussionMode);
    sessionStorage.setItem(convergenceRoundsKey(state.room), String(state.convergenceRounds));
  } catch { /* keep the current page state */ }
}
loadDiscussionPrefs(INITIAL_ROOM);

// ------------------------------------------------------------ helpers
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function toast(msg, isErr) {
  const t = $("toast");
  t.textContent = msg;
  t.className = isErr ? "err show" : "show";
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 3500);
}
// The server hands this page a session token and refuses API calls without it.
// This blocks blind/cross-origin requests; it is not a secret from local
// processes, which can fetch the public page and read the embedded token.
const TOKEN = (document.querySelector('meta[name="parley-token"]') || {}).content || "";
const REQUIRED_RUNTIME_PROTOCOL = "14";
const PAGE_RUNTIME_PROTOCOL = (document.querySelector('meta[name="parley-runtime-protocol"]') || {}).content || "";
const withToken = (url) => url + (url.includes("?") ? "&" : "?") +
  "token=" + encodeURIComponent(TOKEN) + "&protocol=" + encodeURIComponent(REQUIRED_RUNTIME_PROTOCOL);

let runtimeMismatch = false;
function showRuntimeMismatch() {
  if (runtimeMismatch) return;
  runtimeMismatch = true;
  const message = "Parley was updated while its old server was still running. Restart Parley, then reload this page.";
  const banner = $("runtimeBanner");
  banner.innerHTML = `⚠ <b>Restart Parley</b> — ${esc(message)}`;
  banner.style.display = "block";
  document.querySelectorAll("button,input,textarea,select").forEach((el) => { el.disabled = true; });
  document.querySelectorAll("a").forEach((el) => {
    el.style.pointerEvents = "none";
    el.setAttribute("aria-disabled", "true");
  });
}
if (PAGE_RUNTIME_PROTOCOL !== REQUIRED_RUNTIME_PROTOCOL) showRuntimeMismatch();

async function api(path, body) {
  if (runtimeMismatch) throw new Error("Restart Parley to finish applying the update.");
  const res = await fetch(path, body === undefined
    ? { headers: { "X-Parley-Token": TOKEN, "X-Parley-Runtime-Protocol": REQUIRED_RUNTIME_PROTOCOL } }
    : {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Parley-Token": TOKEN,
        "X-Parley-Runtime-Protocol": REQUIRED_RUNTIME_PROTOCOL,
      },
      body: JSON.stringify(body),
    });
  if (res.headers.get("x-parley-runtime-protocol") !== REQUIRED_RUNTIME_PROTOCOL) {
    showRuntimeMismatch();
    throw new Error("Restart Parley to finish applying the update.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function clearAttachmentUrls() {
  state.attachmentRevision++;
  for (const value of state.attachmentUrls.values()) {
    if (typeof value === "string") URL.revokeObjectURL(value);
  }
  state.attachmentUrls.clear();
}

async function attachmentBlobUrl(room, ref) {
  const key = room + ":" + ref.id;
  const revision = state.attachmentRevision;
  const cached = state.attachmentUrls.get(key);
  if (typeof cached === "string") return cached;
  if (cached) return cached;
  let pending;
  pending = fetch("/api/attachment?room=" + encodeURIComponent(room) + "&id=" + encodeURIComponent(ref.id), {
    headers: { "X-Parley-Token": TOKEN, "X-Parley-Runtime-Protocol": REQUIRED_RUNTIME_PROTOCOL },
  }).then(async (res) => {
    if (res.headers.get("x-parley-runtime-protocol") !== REQUIRED_RUNTIME_PROTOCOL) {
      showRuntimeMismatch();
      throw new Error("runtime mismatch");
    }
    if (!res.ok) throw new Error("attachment unavailable");
    const objectUrl = URL.createObjectURL(await res.blob());
    if (revision !== state.attachmentRevision) {
      URL.revokeObjectURL(objectUrl);
      throw new Error("stale attachment request");
    }
    state.attachmentUrls.set(key, objectUrl);
    return objectUrl;
  }).catch((e) => {
    if (state.attachmentUrls.get(key) === pending) state.attachmentUrls.delete(key);
    throw e;
  });
  state.attachmentUrls.set(key, pending);
  return pending;
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function imageAttachment(ref) {
  return ref && (ref.kind === "image" || (!ref.kind && /^image\//i.test(ref.mime || "")));
}

function renderEntryAttachments(entry, bubble) {
  const refs = entry && entry.meta && Array.isArray(entry.meta.attachments)
    ? entry.meta.attachments : [];
  if (!refs.length) return;
  const room = state.room;
  const gallery = document.createElement("div");
  gallery.className = "attachments";
  for (const ref of refs) {
    if (!imageAttachment(ref)) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "attachment attachment-file";
      card.title = `Download ${ref.name || "attached file"}`;
      const icon = document.createElement("span");
      icon.className = "attachment-file-icon";
      icon.textContent = "📄";
      const copy = document.createElement("span");
      copy.className = "attachment-file-copy";
      const name = document.createElement("span");
      name.className = "attachment-name";
      name.textContent = ref.name || "Attached file";
      const size = document.createElement("span");
      size.className = "attachment-file-size";
      size.textContent = `${formatBytes(ref.size)} · click to download`;
      copy.append(name, size);
      card.append(icon, copy);
      card.onclick = async () => {
        if (card.disabled) return;
        card.disabled = true;
        const old = size.textContent;
        size.textContent = "Preparing download…";
        try {
          const url = await attachmentBlobUrl(room, ref);
          if (state.room !== room || ("isConnected" in card && !card.isConnected)) return;
          const download = document.createElement("a");
          download.href = url;
          download.download = ref.name || "attachment";
          document.body.appendChild(download);
          download.click();
          download.remove();
          size.textContent = `${formatBytes(ref.size)} · downloaded`;
        } catch {
          size.textContent = `${formatBytes(ref.size)} · unavailable`;
          toast(`${ref.name || "Attachment"} is unavailable.`, true);
        } finally {
          card.disabled = false;
          if (size.textContent.endsWith("downloaded")) setTimeout(() => { size.textContent = old; }, 1500);
        }
      };
      gallery.appendChild(card);
      continue;
    }
    const link = document.createElement("a");
    link.className = "attachment";
    link.target = "_blank";
    link.rel = "noopener";
    link.title = ref.name || "Pasted image";
    const img = document.createElement("img");
    img.alt = ref.name || "Pasted image";
    img.loading = "lazy";
    const label = document.createElement("span");
    label.className = "attachment-name";
    label.textContent = ref.name || "Pasted image";
    link.append(img, label);
    gallery.appendChild(link);
    attachmentBlobUrl(room, ref).then((url) => {
      if (state.room !== room || ("isConnected" in img && !img.isConnected)) return;
      img.src = url;
      link.href = url;
    }).catch(() => { label.textContent = `${ref.name || "Pasted image"} (unavailable)`; });
  }
  bubble.appendChild(gallery);
}
$("dlTranscript").onclick = async (ev) => {
  ev.preventDefault();
  try {
    const res = await fetch("/api/transcript?room=" + encodeURIComponent(state.room), {
      headers: { "X-Parley-Token": TOKEN, "X-Parley-Runtime-Protocol": REQUIRED_RUNTIME_PROTOCOL },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || res.statusText);
    }
    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `parley-${state.room.replace(/[^a-zA-Z0-9._-]+/g, "-") || "room"}-transcript.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) { toast(e.message, true); }
};
function hhmm(ts) { return (ts || "").slice(11, 16); }
function dayOf(ts) { return (ts || "").slice(0, 10); }
// A room that spans days showed a column of indistinguishable "14:02"s, with
// nothing saying which day any of them belonged to.
function dayLabel(ts) {
  const day = dayOf(ts);
  if (!day) return "";
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const asDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (day === asDay(today)) return "Today";
  const yesterday = new Date(today.getTime() - 86400000);
  if (day === asDay(yesterday)) return "Yesterday";
  return day;
}
function secs(ms) { return (ms / 1000).toFixed(1) + "s"; }

// ---- syntax highlighting ----
// For an app whose whole point is watching two coding agents exchange code,
// monochrome blocks were the most visible gap. This is deliberately a small
// tokenizer rather than a vendored library: Parley ships two files and no
// dependencies, and a hundred kilobytes of highlighter inlined into the page
// would cost more than it is worth.
//
// SAFETY: this runs on text that esc() has ALREADY escaped, and it only ever
// wraps existing characters in <span class="tok-…">. It never unescapes, never
// interpolates, and never emits an attribute value — so it cannot reintroduce
// markup that escaping removed. Everything it matches is bounded by the entity
// forms &lt; &gt; &amp; &quot; that escaping produces, which is why the patterns
// below look for those rather than for raw angle brackets.
const HL_LANGS = {
  js: {
    keywords: /\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|yield)\b/g,
    literals: /\b(?:true|false|null|undefined|NaN|Infinity)\b/g,
    line: /\/\/[^\n]*/g,
    block: /\/\*[\s\S]*?\*\//g,
  },
  py: {
    keywords: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g,
    literals: /\b(?:True|False|None|self)\b/g,
    line: /#[^\n]*/g,
  },
  sh: {
    keywords: /\b(?:case|do|done|elif|else|esac|export|fi|for|function|if|in|local|return|set|then|until|while)\b/g,
    literals: /\b(?:true|false)\b/g,
    line: /#[^\n]*/g,
  },
  css: {
    keywords: /@[a-z-]+/g,
    literals: /#[0-9a-fA-F]{3,8}\b/g,
    line: null,
    block: /\/\*[\s\S]*?\*\//g,
  },
  json: { literals: /\b(?:true|false|null)\b/g },
  html: { block: /&lt;!--[\s\S]*?--&gt;/g, keywords: /&lt;\/?[a-zA-Z][\w:-]*|\/?&gt;/g },
};
const HL_ALIAS = {
  javascript: "js", jsx: "js", ts: "js", typescript: "js", tsx: "js", mjs: "js", cjs: "js",
  python: "py", py3: "py", bash: "sh", shell: "sh", zsh: "sh", console: "sh", sh: "sh",
  yaml: "json", yml: "json", jsonc: "json", scss: "css", less: "css",
  xml: "html", svg: "html", vue: "html", markup: "html",
};
// Strings and comments are matched first and set aside, so a keyword inside a
// string is never highlighted as one.
// Strings and comments are matched first in the alternation below, so a keyword
// inside a string is never highlighted as one.
const HL_STRINGS = /&quot;(?:[^&\\\n]|\\.|&(?!quot;))*&quot;|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/;
const HL_NUMBERS = /\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/;

// One left-to-right scan with a single alternation, rather than a sequence of
// passes over placeholders: a placeholder scheme has to survive every later
// pattern, and the number rule cheerfully matched the digits inside its own
// placeholders. First alternative that matches at a position wins, and anything
// unmatched is copied through untouched — so the output always reduces back to
// the input with the spans removed.
const hlCache = new Map();
function hlPattern(rules) {
  if (hlCache.has(rules)) return hlCache.get(rules);
  const parts = [];
  const order = [];
  const add = (cls, re) => { if (re) { parts.push(`(${re.source})`); order.push(cls); } };
  add("com", rules.block);
  add("com", rules.line);
  add("str", HL_STRINGS);
  add("kw", rules.keywords);
  add("lit", rules.literals);
  add("num", HL_NUMBERS);
  const compiled = { re: new RegExp(parts.join("|"), "g"), order };
  hlCache.set(rules, compiled);
  return compiled;
}

function highlightCode(escaped, lang) {
  const key = HL_ALIAS[String(lang || "").toLowerCase()] || String(lang || "").toLowerCase();
  const rules = HL_LANGS[key];
  if (!rules) return escaped; // an unknown language stays plain rather than guessed at
  const { re, order } = hlPattern(rules);
  re.lastIndex = 0;
  let out = "", at = 0, m;
  while ((m = re.exec(escaped)) !== null) {
    // Which alternative matched tells us what to call it.
    let cls = null;
    for (let g = 1; g < m.length; g++) if (m[g] !== undefined) { cls = order[g - 1]; break; }
    out += escaped.slice(at, m.index) + `<span class="tok-${cls}">${m[0]}</span>`;
    at = m.index + m[0].length;
    if (m[0] === "") re.lastIndex++; // a zero-width match would loop forever
  }
  return out + escaped.slice(at);
}

// ------------------------------------------------------------ markdown (safe: escape first, then transform)
// Code blocks are pulled out first and stashed behind private-use-area
// sentinels so no other rule can touch their contents.
const SENT_A = "", SENT_B = "";
const SENT_LINE = new RegExp("^" + SENT_A + "(\\d+)" + SENT_B + "$");
const SENT_ANY = new RegExp(SENT_A + "(\\d+)" + SENT_B, "g");
function splitTableRow(line) {
  let text = line.trim();
  if (!text.includes("|")) return null;
  let foundDivider = text.startsWith("|") || (text.endsWith("|") && !text.endsWith("\\|"));
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|") && !text.endsWith("\\|")) text = text.slice(0, -1);

  const cells = [];
  let cell = "", inCode = false;
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith("<code>", i)) {
      inCode = true; cell += "<code>"; i += 5; continue;
    }
    if (text.startsWith("</code>", i)) {
      inCode = false; cell += "</code>"; i += 6; continue;
    }
    if (text[i] === "\\" && text[i + 1] === "|") {
      cell += "|"; i++; continue;
    }
    if (text[i] === "|" && !inCode) {
      cells.push(cell.trim()); cell = ""; foundDivider = true; continue;
    }
    cell += text[i];
  }
  cells.push(cell.trim());
  return foundDivider ? cells : null;
}
function tableAlignments(line, columns) {
  const cells = splitTableRow(line);
  if (!cells || cells.length !== columns || !cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  return cells.map((cell) => cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left");
}
function renderMD(src) {
  const blocks = [];
  src = String(src).replace(/```([\w+-]*)\r?\n([\s\S]*?)```/g, (m, lang, code) => {
    blocks.push({ lang, code });
    return SENT_A + (blocks.length - 1) + SENT_B;
  });
  let t = esc(src);
  t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
  t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = t.split(/\r?\n/);
  let html = "", para = [], list = null, listGap = false; // list: {type, start, items}
  const flushPara = () => { if (para.length) { html += "<p>" + para.join("<br>") + "</p>"; para = []; } };
  const flushList = () => {
    if (list) {
      const open = list.type === "ol" && list.start !== 1 ? `<ol start="${list.start}">` : `<${list.type}>`;
      html += open + list.items.map((i) => "<li>" + i + "</li>").join("") + `</${list.type}>`;
      list = null;
    }
    listGap = false;
  };
  // A blank line inside a list is a loose list, not a new one — closing here is
  // what makes every item restart the numbering at 1.
  const addItem = (type, text, start) => {
    flushPara();
    if (!list || list.type !== type) { flushList(); list = { type, start: start || 1, items: [] }; }
    list.items.push(text); listGap = false;
  };
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const raw = lines[lineIndex];
    const line = raw.trimEnd();
    let m;
    if (SENT_LINE.test(line.trim())) { flushPara(); flushList(); html += line.trim(); continue; }
    if (!line.trim()) { flushPara(); if (list) listGap = true; else flushList(); continue; }
    const header = splitTableRow(line);
    const alignments = header && lineIndex + 1 < lines.length
      ? tableAlignments(lines[lineIndex + 1].trim(), header.length)
      : null;
    if (header && alignments) {
      flushPara(); flushList();
      const cellHTML = (tag, cells) => cells.map((cell, i) =>
        `<${tag} class="align-${alignments[i]}">${cell}</${tag}>`).join("");
      const rows = [];
      let next = lineIndex + 2;
      while (next < lines.length && lines[next].trim()) {
        const cells = splitTableRow(lines[next]);
        if (!cells) break;
        while (cells.length < header.length) cells.push("");
        rows.push(cells.slice(0, header.length));
        next++;
      }
      html += `<div class="md-table-wrap"><table><thead><tr>${cellHTML("th", header)}</tr></thead>` +
        `<tbody>${rows.map((cells) => `<tr>${cellHTML("td", cells)}</tr>`).join("")}</tbody></table></div>`;
      lineIndex = next - 1;
      continue;
    }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { flushPara(); flushList(); html += `<h${m[1].length}>${m[2]}</h${m[1].length}>`; continue; }
    if (/^(---|\*\*\*|___)$/.test(line.trim())) { flushPara(); flushList(); html += "<hr>"; continue; }
    if ((m = /^\s*[-*+]\s+(.*)$/.exec(line))) { addItem("ul", m[1]); continue; }
    if ((m = /^\s*(\d+)[.)]\s+(.*)$/.exec(line))) { addItem("ol", m[2], Number(m[1])); continue; }
    if ((m = /^&gt;\s?(.*)$/.exec(line))) { flushPara(); flushList(); html += "<blockquote>" + m[1] + "</blockquote>"; continue; }
    // Wrapped or indented text belongs to the item above it; only an
    // unindented line after a blank one starts something new.
    if (list && list.items.length && (!listGap || /^\s{2,}\S/.test(raw))) {
      list.items[list.items.length - 1] += (listGap ? "<br><br>" : "<br>") + line.trim();
      listGap = false; continue;
    }
    flushList(); para.push(line);
  }
  flushPara(); flushList();

  html = html.replace(SENT_ANY, (m, i) => {
    const b = blocks[+i];
    if (!b) return m;
    return `<div class="codeblock"><div class="cb-head"><span>${esc(b.lang || "code")}</span>` +
      `<button class="cb-copy">copy</button></div><pre><code>` +
      `${highlightCode(esc(b.code.replace(/\n$/, "")), b.lang)}</code></pre></div>`;
  });
  return html;
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".cb-copy");
  if (btn) {
    const code = btn.closest(".codeblock").querySelector("code");
    navigator.clipboard.writeText(code.innerText).then(() => {
      btn.textContent = "copied ✓"; setTimeout(() => (btn.textContent = "copy"), 1500);
    });
  }
  const cpy = e.target.closest(".cpy");
  if (cpy) {
    const bub = cpy.closest(".msg").querySelector(".bubble");
    navigator.clipboard.writeText(bub.innerText).then(() => {
      cpy.textContent = "✓"; setTimeout(() => (cpy.textContent = "📋"), 1200);
    });
  }
  // Delegated, not a per-node onclick: any arriving activity entry re-renders
  // the transcript and would take a bound handler with it.
  const ask = e.target.closest(".ask");
  if (ask) {
    const host = ask.closest("[data-n]");
    if (host) { e.stopPropagation(); openAskMenu(ask, Number(host.dataset.n)); }
  }
  if (!e.target.closest("#stopWrap")) closeStopMenu();
  if (!e.target.closest("#hopWrap")) closeHopMenu();
  if (!e.target.closest("#queueWrap")) closeQueuePop();
});
window.addEventListener("focus", () => { document.title = "Parley"; refreshGitId(); });

// ------------------------------------------------------------ chat rendering
const chatWrap = $("chatWrap"), chat = $("chat");
function nearBottom() { return chatWrap.scrollHeight - chatWrap.scrollTop - chatWrap.clientHeight < 120; }
function scrollBottom(force) {
  // An empty room is an onboarding screen, not a transcript. Scrolling it to
  // the bottom hides the room builder on short windows.
  if (!state.entries.length) { chatWrap.scrollTop = 0; $("jump").style.display = "none"; return; }
  if (force || nearBottom()) { chatWrap.scrollTop = chatWrap.scrollHeight; $("jump").style.display = "none"; }
  else $("jump").style.display = "block";
}
// One page per frame. Scroll fires far faster than a render, and a page of
// collapsed activity adds little height — so without this guard a single flick
// at the top stacks up several whole re-renders inside one frame.
let historyPaging = false;
chatWrap.addEventListener("scroll", () => {
  if (nearBottom()) $("jump").style.display = "none";
  // Scrolling to the top is the second path into "Show earlier ▸"; the button
  // stays as the discoverable one.
  if (chatWrap.scrollTop < 80 && !historyPaging && state.renderFromN !== null) {
    historyPaging = true;
    requestAnimationFrame(() => { expandHistory(); historyPaging = false; });
  }
});
$("jump").onclick = () => scrollBottom(true);

// Receipt dots: for each participant other than the author, show whether they
// heard this message live, lurked it, caught up later, or haven't seen it.
// Withheld beats every other signal. A later high-water receipt spans a
// withdrawn entry, and the seat's cursor moves past it too, so asking about
// receipts or cursors first would report that the agent caught up on a message
// it was never shown. Retry clears the record, and the dot goes back to normal.
function withheldFrom(a, n) {
  const map = (state.summary && state.summary.cancelledDeliveries) || {};
  const seats = map[String(n)];
  return Array.isArray(seats) && seats.includes(a);
}
// The amber sibling: the seat did receive this, and its answer was stopped.
function interruptedFrom(a, n) {
  const map = (state.summary && state.summary.interruptedResponses) || {};
  const seats = map[String(n)];
  return Array.isArray(seats) && seats.includes(a);
}
// ---- receipt & relay-cap indexes ----
// computeHeard used to scan all of state.receipts per dot and cappedFrom all of
// state.entries per unresolved dot, on every SSE room event, for every rendered
// row — a multi-second sweep in a fully revealed 10k room. Both lookups are now
// O(1) against indexes that rebuild lazily whenever the backing array is
// REPLACED (identity check covers loads, reconnect merges and resets in one
// rule) and extend incrementally when it is appended to in place.
//
// First-match-wins matters: overlapping receipt ranges must resolve to the
// receipt that arrived first, exactly as the old linear .find did. Filling
// only-still-uncovered slots in arrival order reproduces that, including for
// closure/attention receipts that span ranges live receipts already cover.
let receiptIndexSource = null;
const receiptCover = new Map(); // agent -> Map(n -> receipt)
function indexReceipt(r) {
  if (!r || !Number.isFinite(r.from) || !Number.isFinite(r.upTo)) return;
  let m = receiptCover.get(r.agent);
  if (!m) { m = new Map(); receiptCover.set(r.agent, m); }
  for (let n = r.from + 1; n <= r.upTo; n++) if (!m.has(n)) m.set(n, r);
}
function receiptFor(a, n) {
  if (receiptIndexSource !== state.receipts) {
    receiptCover.clear();
    for (const r of state.receipts) indexReceipt(r);
    receiptIndexSource = state.receipts;
  }
  const m = receiptCover.get(a);
  return (m && m.get(n)) || null;
}

let capIndexSource = null;
const capIndex = new Map(); // `${target}:${n}` -> the relayCap system entry
function indexCapEntry(entry) {
  if (!(entry && entry.kind === "system" && entry.meta && entry.meta.relayCap &&
      Array.isArray(entry.meta.relayCap.dropped))) return;
  for (const item of entry.meta.relayCap.dropped) {
    const key = `${item.target}:${Number(item.n)}`;
    if (!capIndex.has(key)) capIndex.set(key, entry);
  }
}
function cappedFrom(a, n) {
  if (capIndexSource !== state.entries) {
    capIndex.clear();
    for (const entry of state.entries) indexCapEntry(entry);
    capIndexSource = state.entries;
  }
  return capIndex.get(`${a}:${Number(n)}`) || null;
}
function computeHeard(a, e) {
  if (withheldFrom(a, e.n)) {
    return { cls: "withheld", title: `${a} · you cancelled this before it was delivered — never shown to ${a}` };
  }
  // Amber, and above receipts, cursor, busy state and terminal outcomes on
  // purpose: the seat received this and the user stopped its answer. Every
  // later turn carries the message in context, so anything that read a receipt
  // first would resolve amber on the next completed turn, whatever it was
  // about. Only the server supersedes it — by removing the record when that
  // seat completes a run rooted here.
  if (interruptedFrom(a, e.n)) {
    return { cls: "interrupted",
      title: `${a} · received this, but you stopped its response — nothing is retried automatically` };
  }
  const r = receiptFor(a, e.n);
  if (r) {
    const label = seatLabel(a);
    if (r.relayLaunch) {
      const launch = r.relayLaunch;
      const outcome = r.outcome === "empty" ? "returned no content"
        : r.outcome === "pass" ? "nothing to add ([pass])" : r.spoke ? "replied" : "delivered without a reply";
      return { cls: r.spoke ? "live" : "passed", title: `${label} · charged continuation ${launch.index}/${launch.limit ?? "?"} delivered — ${outcome}; ${policySourceLabel(launch.source)}` };
    }
    if (r.catchUp && Array.isArray(r.catchUp.rootNs)) {
      return { cls: r.spoke ? "late" : "passed", title: `${label} · ${catchUpLabel(r.catchUp)} — ${r.outcome === "empty" ? "returned no content" : r.spoke ? "replied" : "nothing to add"}; ${catchUpDetail(r.catchUp)}` };
    }
    if (r.outcome === "empty") return { cls: "passed", title: `${label} · delivered — returned no content` };
    if (r.mode === "closure") return r.spoke
      ? { cls: "late", title: `${a} · causal answer delivered — replied` }
      : { cls: "passed", title: `${a} · causal answer delivered — nothing to add` };
    if (r.mode === "attention") return r.spoke
      ? { cls: "late", title: `${a} · causal message delivered — replied` }
      : { cls: "passed", title: `${a} · causal message delivered — nothing to add` };
    if (r.mode === "lurk-catchup") return r.spoke
      ? { cls: "late", title: `${a} · caught up while lurking — chimed in` }
      : { cls: "passed", title: `${a} · caught up while lurking — nothing to add` };
    const live = e.n >= r.turn; // heard as part of the exchange that delivered it
    if (live && r.mode === "lurk") return r.spoke
      ? { cls: "live", title: `${a} · lurking — chimed in` }
      : { cls: "passed", title: `${a} · lurking — listened, nothing to add` };
    if (live && r.mode === "hop") return r.spoke
      ? { cls: "live", title: `${a} · pulled into the exchange — replied` }
      : { cls: "passed", title: `${a} · pulled into the exchange — nothing to add` };
    if (live) return { cls: "live", title: `${a} · addressed — heard live` };
    return { cls: "late", title: `${a} · caught up later (at turn ${r.turn})` };
  }
  const agent = state.summary && state.summary.agents && state.summary.agents[a];
  const cur = agent ? agent.cursor : 0;
  if (cur >= e.n) return { cls: "late", title: `${a} · has seen this` };
  const capped = cappedFrom(a, e.n);
  if (capped) {
    const cap = capped.meta.relayCap;
    const safety = cap.budget < 0 || (Number.isFinite(cap.limit) && cap.limit < cap.budget);
    return { cls: "unheard", title: `${seatLabel(a)} · new delivery did not launch at the ${safety ? "safety" : "continuation"} limit; separately owed delivery may still complete` };
  }
  const attention = e.meta && (e.meta.causalAttention || e.meta.lurkClosure);
  if (e.kind === "agent" && attention && attention.terminal) {
    return { cls: "unheard", title: `${a} · causal exchange deliberately closed here — this final reply remains later context` };
  }
  // Terminal delivery outcomes outrank a seat's unrelated current busy state.
  // Receipts/cursor above still supersede this history after a later turn heals
  // the gap, so the record remains truthful without destructive invalidation.
  const outcomes = ((state.summary && state.summary.lurkOutcomes) || [])
    .filter((x) => x.agent === a && x.fromN <= e.n && e.n <= x.throughN);
  const outcome = outcomes.length ? outcomes[outcomes.length - 1] : null;
  if (outcome) {
    if (outcome.reason === "closed-by-delivery") {
      return { cls: "late", title: `${a} · closure was already carried by another delivery` };
    }
    if (String(outcome.reason || "").startsWith("closure-")) {
      const why = outcome.reason === "closure-stopped" ? "was stopped"
        : outcome.reason === "closure-asleep" ? "was asleep"
          : outcome.reason === "closure-wait-aborted" ? "could not obtain the seat" : "failed";
      return { cls: "unheard", title: `${a} · causal closure ${why}; no automatic retry` };
    }
    if (String(outcome.reason || "").startsWith("request-")) {
      const why = outcome.reason === "request-stopped" ? "was stopped"
        : outcome.reason === "request-asleep" ? "found the seat asleep"
          : outcome.reason === "request-wait-aborted" ? "could not obtain the seat" : "failed";
      return { cls: "unheard", title: `${a} · causal request ${why}; no automatic retry` };
    }
    const why = outcome.reason === "stopped" ? "was stopped"
      : outcome.reason === "disabled" ? "was disabled"
        : outcome.reason === "asleep" ? "went to sleep"
          : outcome.reason === "cancelled" ? "was cancelled" : "failed";
    return { cls: "unheard", title: `${a} · lurk ${why} before this was heard` };
  }
  if (state.summary && (state.summary.busy || []).includes(a)) return { cls: "pending " + a, title: `${a} · receiving…` };
  // Still unheard, but for a reason the user chose — and one that will not
  // resolve on its own, unlike an ordinary seat that simply hasn't caught up.
  if (seatAsleep(a)) return { cls: "unheard", title: `${a} · asleep — hasn't seen this, and won't until you wake it` };
  const catchUp = agent && agent.catchUp;
  if (catchUp && catchUp.sinceN <= e.n && e.n <= catchUp.throughN) {
    return { cls: "pending " + a, title: `${a} · queued to catch up when its user work finishes` };
  }
  if (e.kind === "user" && e.meta && e.meta.relay && e.meta.relay.solo &&
      !(((e.meta.audience || {}).addressed || []).includes(a))) {
    return { cls: "unheard", title: `${a} · Solo — response intentionally suppressed; it can still see this as later context` };
  }
  return { cls: "unheard", title: `${a} · hasn't seen this yet` };
}
function heardHTML(e) {
  if (e.kind === "system" || e.kind === "activity") return "";
  const others = ((state.summary && state.summary.seats) || []).filter((a) => a !== e.author);
  if (!others.length) return "";
  return `<div class="heard">` + others.map((a) => {
    const h = computeHeard(a, e);
    return `<span class="hdot ${a} ${h.cls}" title="${esc(h.title)}"></span>`;
  }).join("") + `</div>`;
}

// The record model: the message is permanent, its delivery state is changeable.
// A cancelled or interrupted message keeps its bubble in chronological position
// — still the quote/jump target — and carries its own per-seat status, instead
// of vanishing behind a pill floating further down the timeline.
const STATUS_CHIP = {
  cancelled: { all: "Discarded before delivery", one: (s) => `Discarded for ${s}` },
  interrupted: { all: "Response stopped before it finished", one: (s) => `Response stopped for ${s}` },
};
function receivedBy(a, e) {
  if (receiptFor(a, e.n)) return true;
  const agent = state.summary && state.summary.agents && state.summary.agents[a];
  return !!agent && agent.cursor >= e.n;
}
// User messages only: an agent reply has no audience the user chose, so a
// per-seat delivery chip on one would be inventing an addressee. A stopped hop
// or answer return is carried by the amber dot alone.
function deliveryStatus(e) {
  if (e.kind !== "user") return [];
  const aud = (e.meta && e.meta.audience) || {};
  const pair = e.meta && e.meta.pair;
  const named = pair && typeof pair === "object" ? [...new Set([pair.worker, pair.reviewer].filter(Boolean))]
    : [...new Set([...(aud.addressed || []), ...(aud.asleep || [])])];
  const seats = named.length ? named
    : ((state.summary && state.summary.seats) || []).filter((a) => e.target === "both" || e.target === a);
  return seats.map((seat) => ({
    seat,
    kind: withheldFrom(seat, e.n) ? "cancelled"
      : interruptedFrom(seat, e.n) ? "interrupted"
        : receivedBy(seat, e) ? "delivered" : "pending",
  }));
}
function statusDimmed(e, parts = deliveryStatus(e)) {
  return parts.some((s) => s.kind === "cancelled" || s.kind === "interrupted");
}
function statusChipHTML(e, parts = deliveryStatus(e)) {
  if (!statusDimmed(e, parts)) return ""; // an ordinary message stays clean
  if (e.meta && e.meta.pair) {
    const cancelled = parts.some((s) => s.kind === "cancelled");
    return `<div class="dstatus"><span class="dchip ${cancelled ? "cancelled" : "interrupted"}">` +
      `${cancelled ? "Pair cycle discarded before delivery" : "Pair cycle stopped"} · ${parts.map((s) => esc(seatLabel(s.seat))).join(" + ")}</span>` +
      (cancelled ? `<button class="dretry" data-retry-pair="${esc(String(e.n))}" title="Retry this whole task under the current Pair configuration">Retry Pair cycle</button>` : "") + `</div>`;
  }
  const kinds = new Set(parts.map((s) => s.kind));
  // Every addressed seat shared one outcome: say it once, without naming them.
  const chips = kinds.size === 1 && STATUS_CHIP[parts[0].kind]
    ? [{ kind: parts[0].kind, text: STATUS_CHIP[parts[0].kind].all }]
    // A seat still waiting in the queue contributes nothing — the ⏳ badge and
    // its own dot already say that, and it is not part of what went wrong.
    : parts.filter((s) => s.kind !== "pending").map((s) => ({
      kind: s.kind,
      text: s.kind === "delivered"
        ? `Delivered to ${seatLabel(s.seat)}`
        : STATUS_CHIP[s.kind].one(seatLabel(s.seat)),
    }));
  // The undo lives with the fact it undoes. Per seat, because a split @both can
  // be discarded for one half and delivered to the other — and the retry joins
  // the tail of that seat's own lane, so it cannot overtake newer work.
  const discarded = parts.filter((s) => s.kind === "cancelled").map((s) => s.seat);
  const one = discarded.length === 1;
  const retry = discarded.map((a) =>
    `<button class="dretry" data-retry-discarded="${esc(String(e.n))}" data-retry-seats="${esc(a)}" ` +
    `title="Deliver this message to ${esc(seatLabel(a))} after everything already queued">` +
    `${one ? "Retry" : `Retry → ${esc(seatLabel(a))}`}</button>`).join("");
  return `<div class="dstatus">` +
    chips.map((c) => `<span class="dchip ${c.kind}">${esc(c.text)}</span>`).join("") + retry + `</div>`;
}
// The cancellation notice is a durable record for agents and for auditing — it
// stays in events.jsonl, in transcript.md and in the seat's delta — but it is no
// longer timeline furniture: the message it is about now says it itself, in
// chronological place. The sleep variant is NOT hidden; it is the only thing
// that explains why a seat went quiet with work still owed.
function hiddenEntry(e) {
  return e.kind === "system" && !!(e.meta && e.meta.cancelledQueue) && !(e.meta && e.meta.asleepSeat);
}
// Every status event asks for a full refresh, so this has to be cheap and it
// has to leave untouched rows alone: replacing one restarts the pulse on a
// pending dot, inside a message the reader may be part-way through.
const heardSig = new Map();
// n -> the entry's row element, maintained where rows are created and cleared
// where they are all destroyed. Purely a lookup cache for refreshHeard.
const rowByN = new Map();
function refreshHeard(fromN, upToN) {
  for (const e of state.entries) {
    if (e.n <= fromN || e.n > upToN) continue;
    if (state.renderFromN !== null && e.n < state.renderFromN) continue; // not rendered
    const html = heardHTML(e);
    // One fact read three ways — the chip, the dim and the retry footer all
    // derive from deliveryStatus, so it is computed once per row, not three
    // times. The chip and the dots share a signature so they can never
    // disagree on screen.
    const parts = deliveryStatus(e);
    const chip = statusChipHTML(e, parts);
    const sig = `${chip}${html}`;
    if (!html || heardSig.get(e.n) === sig) continue;
    // rowByN replaces a per-row querySelector that was O(children) — O(rows²)
    // across a cold sweep of a fully revealed window.
    const row = rowByN.get(e.n) || chat.querySelector(`[data-n="${e.n}"]`);
    const el = row && row.querySelector(".heard");
    if (!el) continue;
    const cur = row.querySelector(".dstatus"); // before el.outerHTML invalidates el
    if (chip) { if (cur) cur.outerHTML = chip; else el.insertAdjacentHTML("beforebegin", chip); }
    else if (cur) cur.remove();
    const bub = row.querySelector(".bubble");
    if (bub) bub.classList.toggle("dimmed", statusDimmed(e, parts));
    el.outerHTML = html;
    heardSig.set(e.n, sig);
  }
}

function policySourceLabel(source) {
  return ({ message: "your message override", room: "the room setting at acceptance", solo: "your Solo override",
    "catch-up": "coalesced catch-up rules", structural: "included delivery rules" })[source] || "a source not recorded in this history";
}
function catchUpLabel(catchUp) {
  const count = new Set((catchUp && catchUp.rootNs) || []).size;
  return `caught up${count > 1 ? ` · ${count} messages` : ""}`;
}
function catchUpDetail(catchUp) {
  const roots = [...new Set(catchUp.rootNs || [])];
  return `Covered user message${roots.length === 1 ? "" : "s"} ${roots.map((n) => `#${n}`).join(", ")}` +
    (Number.isFinite(catchUp.fromN) && Number.isFinite(catchUp.throughN) ? `, entries ${catchUp.fromN}–${catchUp.throughN}` : "") +
    (Number.isFinite(catchUp.ownerRootN) ? `. Scheduling owner: your message #${catchUp.ownerRootN}; other covered messages contribute context, not additional charges.` : ".");
}
function provenanceBadges(meta = {}) {
  let html = "";
  const launch = meta && meta.relayLaunch;
  if (launch) {
    const safety = launch.budget < 0 || (Number.isFinite(launch.limit) && launch.limit < launch.budget);
    const automatic = launch.accounting === "automatic";
    const detail = `${automatic ? "Automatic turn" : "Charged continuation"} ${launch.index} of ${launch.limit ?? "unknown limit"}. Source: ${policySourceLabel(launch.source)}.`;
    html += ` <span style="opacity:.7" title="${esc(detail)}">· ${automatic ? "Automatic · " : "⛓ "}${esc(String(launch.index))}/${esc(String(launch.limit ?? "?"))}${safety ? " · safety" : ""}</span>`;
  }
  if (meta && meta.catchUp) html += ` <span style="opacity:.7" title="${esc(catchUpDetail(meta.catchUp))}">· 👂 ${esc(catchUpLabel(meta.catchUp))}</span>`;
  else if (meta && (meta.lurkCatchUp || meta.catchUpReturn)) html += ' <span style="opacity:.7" title="Delayed catch-up; this older entry did not record all covered root IDs">· 👂 caught up</span>';
  return html;
}
const DELIVERY_LABEL = {
  root: "initial response to your message", start: "initial response to your message", explicit: "explicit peer call",
  continuation: "continuation after an answer", sibling: "included sibling delivery", lurk: "enabled listener",
  "lurk-return": "included response to a listener", "answer-return": "included answer return", closure: "included answer return",
  "catching-up": "delayed catch-up", "catch-up": "delayed catch-up", "lurk-catchup": "delayed catch-up",
  review: "Pair review", fix: "Pair fix", listening: "enabled listener", attention: "peer delivery", hop: "peer follow-up",
  retry: "automatic session retry", automatic: "automatic response",
};
function whyRunHTML(e) {
  const meta = e.meta || {};
  if (e.kind === "user") {
    const policy = meta.relay;
    if (!policy || meta.pair) return "";
    const text = policy.solo ? "Solo: one selected responder, no automatic peer response."
      : policy.accounting === "automatic" ? `${hopBudgetLabel(policy.hopBudget)} automatic turns${policy.hopBudget < 0 ? `; safety max ${policy.safetyLimit}` : ""}. Every additional automatic invocation counts; initial requested responses do not.`
      : `${hopBudgetLabel(policy.hopBudget)} extra exchanges (legacy accounting). Included sibling delivery and answer returns do not consume the allowance.`;
    return `<details class="why-run"><summary>Message policy</summary><p>${esc(text)} ${esc(policySourceLabel(policy.source))}. This accepted policy stays with this message.</p></details>`;
  }
  if (meta.relayCap) {
    const cap = meta.relayCap;
    const unit = cap.accounting === "automatic" ? "automatic turns" : "continuations";
    const blocked = (cap.dropped || []).map((edge) => `${seatLabel(edge.target)} receiving #${edge.n}`).join(", ");
    return `<details class="why-run"><summary>Why did this run?</summary><p>${esc(
      `No provider was launched. Blocked: ${blocked}. Policy: ${policySourceLabel(cap.source)}; ` +
      `${cap.used}/${cap.limit} ${unit} used for your message #${cap.rootN}. ` +
      "Outcome: not launched — limit reached. This notice consumes no unit and does not imply agreement or successful delivery."
    )}</p></details>`;
  }
  if (e.kind !== "agent" && !(meta.delivery || meta.relayLaunch)) return "";
  const delivery = meta.delivery || {};
  const sourceN = delivery.triggerEntryN ?? meta.replyTo ?? meta.relayLaunch?.triggerEntryN;
  const source = refFromN(sourceN);
  const rootN = delivery.rootN ?? meta.replyRoot ?? meta.rootN ?? meta.relayLaunch?.rootN ?? (source && source.kind === "user" ? source.n : null);
  const root = rootN == null ? null : entryByN(rootN);
  const policy = root && root.meta && root.meta.relay;
  const kind = delivery.kind || (typeof meta.pair === "string" ? meta.pair
    : meta.catchUp || meta.lurkCatchUp || meta.catchUpReturn ? "catch-up"
      : meta.causalAttention || meta.lurkClosure ? "answer-return" : meta.causalRequest ? meta.causalRequest.kind
        : meta.lurk ? "lurk" : meta.hop ? "hop" : source && source.kind === "user" ? "root" : "");
  const trigger = source ? `${source.kind === "user" ? (source.meta?.harness?.label || "your message") : seatLabel(source.author)} #${source.n}`
    : sourceN == null ? "not recorded" : `entry #${sourceN}`;
  const launch = meta.relayLaunch;
  const automatic = (launch?.accounting || delivery.accounting || policy?.accounting) === "automatic";
  const unit = automatic ? "automatic turn" : "continuation";
  const allowance = launch ? `Consumed ${unit} ${launch.index}/${launch.limit ?? "?"}; failure, Stop, pass or empty output does not refund it.`
    : delivery.counted === false || kind === "root" || meta.pair || meta.catchUp || meta.lurk
      ? `Did not consume ${automatic ? "an automatic turn" : "a continuation"}.` : delivery.counted ? "No counted launch was recorded for this attempt." : "Allowance use was not recorded on this historical entry.";
  const sourcePolicy = launch?.source || delivery.source || policy?.source;
  const receipt = (state.receipts || []).find((r) => r.outputEntryN === e.n && r.agent === e.author);
  const received = receipt ? (state.entries || []).filter((item) => item.n > receipt.from && item.n <= receipt.upTo &&
    item.n !== sourceN && item.author !== e.author && ["user", "agent"].includes(item.kind)).map((item) => `#${item.n}`) : [];
  const later = meta.error && sourceN != null ? (state.receipts || []).find((r) =>
    r.agent === meta.agent && r.from < sourceN && r.upTo >= sourceN &&
    Number.isSafeInteger(r.recordedAfterN) && r.recordedAfterN >= e.n) : null;
  const outcome = meta.outcome || (meta.error ? "failed" : meta.stopped ? "stopped" : meta.relayCap ? "capped" : "replied");
  const detail = [
    `Triggered by: ${trigger}. Reason: ${(DELIVERY_LABEL[kind] || kind || "not recorded").replace(automatic ? /^included / : /$^/, "")}.`,
    received.length ? `Also covered as context: ${received.join(", ")}. Withdrawn messages may be placeholders.` : "",
    `Policy: ${meta.pair ? "Pair rounds" : policySourceLabel(sourcePolicy)}. ${allowance}`,
    `Outcome: ${outcome === "text" ? "replied" : outcome === "capped" ? "not launched — limit reached" : outcome}.`,
    meta.catchUp ? catchUpDetail(meta.catchUp) : rootN != null && rootN !== sourceN ? `Started by your message #${rootN}.` : "",
    later ? (Number.isSafeInteger(later.outputEntryN)
      ? `The message was later included as context for reply #${later.outputEntryN}.`
      : "The message was included in a later successful delivery; no reply link was recorded.") : "",
  ].filter(Boolean).join(" ");
  const link = later?.outputEntryN && entryByN(later.outputEntryN)
    ? ` <button class="quote-ref" data-jump-n="${later.outputEntryN}">Go to reply #${later.outputEntryN}</button>` : "";
  return `<details class="why-run"><summary>Why did this run?</summary><p>${esc(detail)}${link}</p></details>` +
    (meta.technicalError ? `<details><summary>Technical details</summary><pre>${esc(meta.technicalError)}</pre></details>` : "");
}
function recoveryForEntry(e) {
  const recovery = e.meta && e.meta.recovery;
  if (!recovery || !Number.isSafeInteger(recovery.rootN) || recovery.rootN <= 0) return null;
  if (recovery.kind === "pair-retry") return recovery;
  if (recovery.kind === "retry" && typeof recovery.agent === "string" && recovery.agent) return recovery;
  return null;
}
function updateErrorRecovery(row, e) {
  const button = row.querySelector("[data-error-retry]");
  if (!button) return;
  const resolved = state.summary && state.summary.resolvedErrors && state.summary.resolvedErrors[String(e.n)];
  row.classList.toggle("resolved", !!resolved);
  button.disabled = !!resolved;
  const marker = row.querySelector(".recovery-state");
  if (marker) marker.textContent = resolved ? `Resolved${resolved.entryN ? ` by reply #${resolved.entryN}` : " by a succeeding attempt"}` : "";
}
function refreshErrorRecovery() {
  for (const e of state.entries) {
    if (!(e.meta && e.meta.error && e.meta.recovery)) continue;
    const row = rowByN.get(e.n);
    if (row) updateErrorRecovery(row, e);
  }
}
function entryEl(e) {
  const div = document.createElement("div");
  if (e.n !== undefined && e.n !== null) div.dataset.n = e.n;
  if (e.kind === "activity") {
    div.className = "activity " + e.author;
    div.innerHTML = `<span class="adot"></span><span>${esc(e.text)}</span>`;
    return div;
  }
  if (e.kind === "system") {
    div.className = "sysmsg" + (e.meta && e.meta.error ? " err" : "");
    const convergence = e.meta && e.meta.convergence;
    div.innerHTML = convergence && convergence.status === "agreed"
      ? `<div class="agreed-handoff-heading" role="heading" aria-level="3">✓ Agreed handoff</div><div class="agreed-handoff-body">${esc(e.text)}</div><details class="agreed-handoff-proof"><summary>Approval record</summary><p>All participating agents approved draft ${esc(convergence.version || "")} · ${esc(convergence.hash || "")}.</p></details>`
      : esc(e.text);
    const recovery = e.meta && e.meta.error && recoveryForEntry(e);
    if (recovery) {
      const b = document.createElement("button");
      b.className = "retry"; b.textContent = recovery.kind === "pair-retry" ? "Retry Pair cycle" : "Retry";
      b.dataset.errorRetry = String(e.n);
      b.title = recovery.kind === "pair-retry" ? `Retry the whole Pair task from message #${recovery.rootN}`
        : `Retry ${seatLabel(recovery.agent)} on the original message #${recovery.rootN}`;
      b.onclick = async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          await api("/api/retry", { room: state.room, rootN: recovery.rootN,
            ...(recovery.kind === "retry" ? { agents: [recovery.agent] } : {}) });
        } catch (err) { b.disabled = false; toast(err.message, true); }
      };
      div.appendChild(b);
      const marker = document.createElement("span");
      marker.className = "recovery-state";
      div.appendChild(marker);
      updateErrorRecovery(div, e);
    }
    if (e.meta && e.meta.pairContinue) {
      const b = document.createElement("button");
      b.className = "retry"; b.textContent = "Continue →";
      b.title = "Let the worker address that review and get checked again";
      b.onclick = () => {
        b.disabled = true; b.textContent = "Continuing…";
        api("/api/pair/continue", { room: state.room, capN: e.n })
          .catch((err) => { toast(err.message, true); b.disabled = false; b.textContent = "Continue →"; });
      };
      div.appendChild(b);
    }
    if (e.meta && (e.meta.delivery || e.meta.relayLaunch)) div.insertAdjacentHTML("beforeend", whyRunHTML(e));
    return div;
  }
  div.className = "msg " + (e.kind === "user" ? "user" : "agent " + e.author);
  const dur = e.meta && e.meta.durationMs ? ` · ${secs(e.meta.durationMs)}` : "";
  const t = e.meta && e.meta.tokens;
  const tok = t && t.out ? ` · <span title="output tokens${t.reasoning ? ` (${t.reasoning} reasoning)` : ""}">${t.out}t${t.reasoning ? ` <span style="opacity:.7">(${t.reasoning}r)</span>` : ""}</span>` : "";
  // a pair turn is a review or a fix, never a generic "follow-up"
  const pairTag = e.meta && e.meta.pair && typeof e.meta.pair === "string"
    ? ` <span style="opacity:.6">· 🔁 ${e.meta.pair} r${e.meta.round}</span>` : "";
  // Only what `deferred` actually records: this seat was busy when the message
  // arrived, so its half ran later. Whether it had read the other seat's answer
  // by then depends on which seat freed first, so the badge doesn't claim it.
  const deferTag = e.meta && e.meta.deferred
    ? ' <span style="opacity:.6" title="This agent was busy when you sent the message, so its half of it ran later">· ⏳ delayed</span>' : "";
  const attentionMeta = e.meta && (e.meta.causalAttention || e.meta.lurkClosure);
  const requestMeta = e.meta && e.meta.causalRequest;
  const lurkTag = pairTag || (e.meta?.delivery?.accounting === "automatic" ? "" : (attentionMeta && attentionMeta.terminal
    ? ' <span style="opacity:.6" title="Final causal delivery; this reply cannot schedule another automatic leg">· 🔒 closure</span>'
    : attentionMeta
      ? ' <span style="opacity:.6" title="Free causal answer return; further continuation uses the shared allowance">· ↩ answer</span>'
    : requestMeta
      ? ' <span style="opacity:.6" title="Included causal delivery; the message was delivered without spending a continuation">· ↪ attention</span>'
    : e.meta && e.meta.lurk ? ' <span style="opacity:.6">· 👂 chimed in</span>'
    : e.meta && e.meta.hop && !(e.meta && e.meta.pair) ? ' <span style="opacity:.6">· ⛓ follow-up</span>' : deferTag));
  const userPair = e.meta && e.meta.pair && typeof e.meta.pair === "object"
    ? ` · 🔁 pair ×${e.meta.pair.rounds} (${e.meta.pair.worker} works, ${e.meta.pair.reviewer} reviews)` : "";
  // An auto-composed "Continue responding to this message." must never read as
  // something the user typed; the quote header above says what it is about, and
  // this says how it got here.
  const askTag = e.kind === "user" && e.meta && e.meta.askFrom
    ? (e.meta.askFrom.redirect
      ? ' <span style="opacity:.6" title="Sent with Stop current &amp; ask now">· ↪ redirect</span>'
      : ' <span style="opacity:.6" title="Asked again about an earlier message">· ↪ ask again</span>')
    : "";
  const label = e.kind === "user"
    ? `${e.meta?.harness ? esc(e.meta.harness.label) + ' <span class="badge">external · ' + esc(e.meta.harness.intent === "context" ? "context only" : "delegated") + "</span>" : "You"} <span style="opacity:.65">→ @${esc(e.target === "both" ? "all" : e.target)}${e.meta && e.meta.discussion ? " · 💬 discussion" : ""}${userPair}</span>${askTag}`
    : esc(seatLabel(e.author)) + lurkTag + provenanceBadges(e.meta);
  const av = e.kind === "user" ? "" : `<span class="avatar">${esc(seatAvatar(e.author))}</span>`;
  div.innerHTML = `<div class="meta">${av}<span class="who">${label}</span><span title="${esc(String(e.ts || "").replace("T", " "))}">${hhmm(e.ts)}${dur}${tok}</span>` +
    `<button class="ask" title="Ask about this message">↪</button>` +
    `<button class="cpy" title="Copy message">📋</button></div>` +
    entryQuoteHTML(e) +
    `<div class="bubble${statusDimmed(e) ? " dimmed" : ""}">${renderMD(e.text)}</div>` +
    statusChipHTML(e) + heardHTML(e) + whyRunHTML(e);
  renderEntryAttachments(e, div.querySelector(".bubble"));
  if ((e.text || "").length > 2500) {
    const bub = div.querySelector(".bubble");
    const key = e.n === undefined || e.n === null ? null : String(e.n);
    const expanded = key !== null && state.expandedMessages.has(key);
    bub.classList.toggle("collapsed", !expanded);
    const btn = document.createElement("button");
    btn.className = "showmore";
    btn.textContent = expanded ? "Show less ▴" : "Show more ▾";
    btn.onclick = () => {
      const c = bub.classList.toggle("collapsed");
      if (key !== null) {
        if (c) state.expandedMessages.delete(key);
        else state.expandedMessages.add(key);
      }
      btn.textContent = c ? "Show more ▾" : "Show less ▴";
    };
    bub.insertAdjacentElement("afterend", btn);
  }
  return div;
}

const INITIAL_ENTRY_LIMIT = 150;
// Scrollback is revealed a page at a time. Revealing all of it at once tied the
// cost of every later renderAll — and one runs for every activity entry — to how
// long the room has run rather than to how much of it is on screen.
const HISTORY_PAGE = 150;
// Entries kept above a jump target, so it lands in context rather than flush
// against the "Show earlier" button.
const HISTORY_CONTEXT = 20;
const ACTIVITY_INLINE_LIMIT = 8;

// A run is identified by its first entry, and the identity survives the run
// growing. That is what lets an arriving action extend what is already rendered
// instead of forcing a rebuild — and the run's own nodes carry the same id, so
// the extension can find them without holding any of them in a closure.
function activityRunKey(author, startN) { return `${author}:${startN}`; }

function activityNode(e, startN, overflow) {
  const node = entryEl(e);
  node.dataset.runStart = startN;
  if (overflow) node.dataset.runOverflow = "1";
  return node;
}

function activityRunEntries(startN) {
  const i = entryIndexOf(startN);
  if (i < 0) return [];
  const author = state.entries[i].author;
  let end = i + 1;
  while (end < state.entries.length
    && state.entries[end].kind === "activity" && state.entries[end].author === author) end++;
  return state.entries.slice(i, end);
}

function overflowNodesOf(toggle) {
  const parent = toggle.parentNode;
  if (!parent || !parent.querySelectorAll) return [];
  return [...parent.querySelectorAll(
    `[data-run-start="${toggle.dataset.runStart}"][data-run-overflow="1"]`)];
}

function setToggleLabel(toggle, count, expanded) {
  // The label is the only part that changes as a run grows; rewriting the whole
  // button would restart the dot beside it.
  if (!toggle.firstElementChild) toggle.innerHTML = `<span class="adot"></span><span></span>`;
  toggle.lastElementChild.textContent = expanded
    ? `▾ Hide ${count} action${count === 1 ? "" : "s"}`
    : `▸ ${count} more action${count === 1 ? "" : "s"}`;
}

// Bring a rendered toggle back in step with state.entries: the count it shows,
// and — while expanded — the overflow nodes it hides.
function syncActivityToggle(toggle) {
  const startN = Number(toggle.dataset.runStart);
  const run = activityRunEntries(startN);
  const expanded = state.expandedActivity.has(toggle.dataset.activityRun);
  if (expanded) {
    const have = overflowNodesOf(toggle).length;
    for (const e of run.slice(ACTIVITY_INLINE_LIMIT + have)) toggle.before(activityNode(e, startN, true));
  }
  setToggleLabel(toggle, Math.max(0, run.length - ACTIVITY_INLINE_LIMIT), expanded);
}

function activityToggle(author, startN) {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "activity activity-more " + author;
  toggle.dataset.runStart = startN;
  toggle.dataset.activityRun = activityRunKey(author, startN);
  toggle.onclick = () => {
    const key = toggle.dataset.activityRun;
    if (state.expandedActivity.has(key)) {
      state.expandedActivity.delete(key);
      for (const node of overflowNodesOf(toggle)) node.remove();
    } else state.expandedActivity.add(key);
    syncActivityToggle(toggle);
  };
  return toggle;
}

function appendActivityRun(parent, run) {
  const startN = run[0].n;
  for (const e of run.slice(0, ACTIVITY_INLINE_LIMIT)) parent.appendChild(activityNode(e, startN, false));
  if (run.length <= ACTIVITY_INLINE_LIMIT) return;
  const key = activityRunKey(run[0].author, startN);
  if (state.expandedActivity.has(key)) {
    for (const e of run.slice(ACTIVITY_INLINE_LIMIT)) parent.appendChild(activityNode(e, startN, true));
  }
  const toggle = activityToggle(run[0].author, startN);
  parent.appendChild(toggle);
  setToggleLabel(toggle, run.length - ACTIVITY_INLINE_LIMIT, state.expandedActivity.has(key));
}

// The durable transcript sits above the live bubbles and any transient note.
// Appending past them and then moving them back would replay their entrance
// animation, which is the flicker this whole path exists to avoid.
function appendDurable(node) {
  const tail = [...chat.children].find((el) => el.dataset.liveAgent
    || (!el.dataset.n && (el.classList.contains("whisper") || el.classList.contains("sysmsg"))));
  if (tail) chat.insertBefore(node, tail); else chat.appendChild(node);
}

// Extend the run an arriving action belongs to, in place. Rebuilding the whole
// transcript for every tool line is what made a message being read flash and
// shift, and a working agent emits several of them a minute.
function appendActivityEntry(e) {
  const i = entryIndexOf(e.n);
  if (i < 0) return false;
  const start = renderedStartIndex();
  let s = i;
  while (s > start
    && state.entries[s - 1].kind === "activity" && state.entries[s - 1].author === e.author) s--;
  const startN = state.entries[s].n;
  if (s === i) { appendDurable(activityNode(e, startN, false)); return true; }

  const nodes = chat.querySelectorAll(`[data-run-start="${startN}"]`);
  const last = nodes[nodes.length - 1];
  if (!last) return false; // the run was never rendered; let the caller rebuild
  const toggle = last.dataset.activityRun ? last : null;
  if (i - s < ACTIVITY_INLINE_LIMIT) {
    const node = activityNode(e, startN, false);
    if (toggle) toggle.before(node); else last.after(node);
    return true;
  }
  if (toggle) { syncActivityToggle(toggle); return true; }
  const fresh = activityToggle(e.author, startN);
  last.after(fresh);
  syncActivityToggle(fresh);
  return true;
}

function appendEntryRange(parent, entries) {
  let lastDay = null;
  const dayDivider = (e) => {
    const day = dayOf(e.ts);
    if (!day || day === lastDay) return;
    // Not before the very first rendered entry when it opens the window: a
    // divider there is a label with nothing above it to separate from.
    if (lastDay !== null) {
      const sep = document.createElement("div");
      sep.className = "daysep";
      sep.setAttribute("role", "separator");
      sep.innerHTML = `<span>${esc(dayLabel(e.ts))}</span>`;
      parent.appendChild(sep);
    }
    lastDay = day;
  };
  for (let i = 0; i < entries.length;) {
    const e = entries[i];
    if (e.kind !== "activity") {
      // Filtered at render time only — never removed from state.entries, which
      // every index, jump and quote lookup walks.
      if (!hiddenEntry(e)) {
        dayDivider(e);
        const rowEl = entryEl(e);
        if (e.n !== undefined && e.n !== null) rowByN.set(e.n, rowEl);
        parent.appendChild(rowEl);
      }
      i++;
      continue;
    }
    let end = i + 1;
    while (end < entries.length && entries[end].kind === "activity" && entries[end].author === e.author) end++;
    appendActivityRun(parent, entries.slice(i, end));
    i = end;
  }
}

function renderedStartIndex() {
  if (state.renderFromN === null) return 0;
  const exact = state.entries.findIndex((e) => e.n === state.renderFromN);
  if (exact >= 0) return exact;
  const after = state.entries.findIndex((e) => e.n > state.renderFromN);
  return after >= 0 ? after : state.entries.length;
}

// Widen the rendered window, keeping the reader on the entry they were looking
// at. The anchor correction must be instant: #chatWrap scrolls smoothly, and
// animating it fights an in-flight scroll and reads as a lurch.
// Widening used to be a full renderAll: every rendered row rebuilt from
// scratch, so each successive "Show earlier" cost more than the last (322ms at
// a 600-row window, seconds for a quote-jump deep into a 10k room) — and the
// rebuild cleared heardSig, so the NEXT room event paid a cold full sweep too.
// Newly revealed history is now prepended; the rows already on screen stay put.
function renderPreservingAnchor(nextFromN) {
  const prevStart = renderedStartIndex();
  const kids = chat.children || [];
  const btn = chat.firstElementChild !== undefined ? chat.firstElementChild : kids[0];
  // The seam cases fall back to the full rebuild rather than being hand-stitched:
  // no button to anchor the prepend on, nothing actually revealed, or the old
  // window opening mid-activity-run (the prepended chunk would end with a run
  // that must merge into the run element already on screen).
  const seamRun = state.entries[prevStart] && state.entries[prevStart].kind === "activity" &&
    state.entries[prevStart - 1] && state.entries[prevStart - 1].kind === "activity" &&
    state.entries[prevStart - 1].author === state.entries[prevStart].author;
  const canPrepend = btn && btn.classList && btn.classList.contains &&
    btn.classList.contains("history-more") && prevStart > 0 && !seamRun &&
    typeof btn.after === "function";
  const beforeHeight = chatWrap.scrollHeight;
  const beforeTop = chatWrap.scrollTop;
  const behavior = chatWrap.style.scrollBehavior;
  chatWrap.style.scrollBehavior = "auto";
  state.renderFromN = nextFromN;
  const newStart = renderedStartIndex();
  if (!canPrepend || newStart >= prevStart) {
    renderAll({ stickToBottom: false });
    chatWrap.scrollTop = beforeTop + chatWrap.scrollHeight - beforeHeight;
    chatWrap.style.scrollBehavior = behavior;
    return;
  }
  const revealed = state.entries.slice(newStart, prevStart);
  const frag = document.createDocumentFragment();
  appendEntryRange(frag, revealed);
  // appendEntryRange suppresses a leading divider and knows nothing about what
  // follows the chunk, so the one divider it cannot place is the seam: when the
  // day changes between the chunk's last visible entry and the old first row.
  const lastNew = [...revealed].reverse().find((x) => !hiddenEntry(x));
  const firstOld = state.entries[prevStart];
  if (lastNew && firstOld && dayOf(lastNew.ts) && dayOf(firstOld.ts) &&
      dayOf(lastNew.ts) !== dayOf(firstOld.ts)) {
    const sep = document.createElement("div");
    sep.className = "daysep";
    sep.setAttribute("role", "separator");
    sep.innerHTML = `<span>${esc(dayLabel(firstOld.ts))}</span>`;
    frag.appendChild(sep);
  }
  // Nothing here is new to the reader in the animated sense — it is scrollback.
  for (const el of frag.children) el.classList.add("norise");
  btn.after(frag);
  if (newStart <= 0) btn.remove();
  else {
    btn.title = newStart > HISTORY_PAGE
      ? `${newStart} earlier entries — shows ${HISTORY_PAGE} more`
      : `${newStart} earlier entr${newStart === 1 ? "y" : "ies"}`;
  }
  chatWrap.scrollTop = beforeTop + chatWrap.scrollHeight - beforeHeight;
  chatWrap.style.scrollBehavior = behavior;
}

// Reveal one more page of scrollback. Reaching the first entry drops the window
// entirely, so renderedStartIndex stops paying for a lookup once there is
// nothing left to reveal.
function expandHistory(count = HISTORY_PAGE) {
  if (state.renderFromN === null) return;
  const start = renderedStartIndex();
  if (start <= 0) { state.renderFromN = null; return; }
  const next = Math.max(0, start - Math.max(1, count));
  renderPreservingAnchor(next === 0 ? null : state.entries[next].n);
}

// Widen just far enough to include one entry. A jump used to reveal everything
// above its target, which made a single quote click cost the whole transcript.
function revealEntry(n) {
  if (state.renderFromN === null || n >= state.renderFromN) return;
  const i = entryIndexOf(n);
  if (i < 0) return; // not in this conversation; jumpToEntry reports the miss
  const next = Math.max(0, i - HISTORY_CONTEXT);
  renderPreservingAnchor(next === 0 ? null : state.entries[next].n);
}

// ------------------------------------------------------- provenance + jumping
// state.entries is kept sorted by turn number, so the lookup a quote header
// needs on every render is a binary search rather than a scan.
function entryIndexOf(n) {
  let lo = 0, hi = state.entries.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = state.entries[mid].n;
    if (v === n) return mid;
    if (v < n) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
function entryByN(n) {
  const i = entryIndexOf(n);
  return i < 0 ? null : state.entries[i];
}
function snippet(text, max = 160) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
// The same shape the server sends in busyInfo, rebuilt from a local entry so
// live bubbles and finished ones render through one code path.
function refFromN(n) {
  const e = entryByN(n);
  if (!e) return null;
  return { n: e.n, kind: e.kind, author: e.author, target: e.target || null, ts: e.ts, text: snippet(e.text) };
}
function refWho(src) {
  return src.kind === "user" ? (entryByN(src.n)?.meta?.harness?.label || (src.author?.startsWith("harness:") ? src.author : "you")) : seatLabel(src.author);
}

function quoteRefHTML(src, label = "↩ replying to", title = "Jump to this message") {
  if (!src || src.n === undefined || src.n === null) return "";
  const heading = label === "invoked by your message" ? (refWho(src) === "you" ? label : `invoked by ${refWho(src)}`) : `${label} ${refWho(src)}`;
  return `<button class="quote-ref" data-jump-n="${esc(String(src.n))}" title="${esc(title)}">` +
    `<span class="qr-bar"></span><span class="qr-body">` +
    `<span class="qr-head"><span>${esc(heading)}</span><span>${esc(hhmm(src.ts))}</span></span>` +
    `<span class="qr-text">${esc(src.text || "")}</span>` +
    `</span></button>`;
}

// A finished reply keeps the reference its live bubble showed, always — that
// is the whole point of putting the quote in the bubble rather than in a
// transient strip, and it is what makes an old exchange readable months later.
function entryQuoteHTML(e) {
  // What makes an ask bubble auditable rather than looking like something the
  // user typed — especially "Continue responding to this message."
  if (e.kind === "user" && e.meta && e.meta.askFrom &&
      e.meta.askFrom.sourceN !== undefined && e.meta.askFrom.sourceN !== null) {
    return quoteRefHTML(refFromN(e.meta.askFrom.sourceN), "↪ asking about");
  }
  if (e.kind !== "agent" || !e.meta || e.meta.replyTo === undefined || e.meta.replyTo === null) return "";
  const src = refFromN(e.meta.replyTo);
  const root = src && src.kind === "user" && !(e.meta.hop || e.meta.lurk || e.meta.causalAttention || e.meta.causalRequest);
  if (e.meta.delivery?.accounting === "automatic") return quoteRefHTML(src, "Triggered by", "Jump to the scheduling trigger; other messages may also have been received");
  return quoteRefHTML(src, root ? "invoked by your message" : "↩ replying to",
    root ? "The prompt snapshot ended before later concurrent replies. Jump to the message that invoked this response." : "Jump to the immediate trigger of this response");
}

// Revealing the target first is not an optimisation. A target sitting in
// scrollback has no element to find, and that is exactly when someone clicks a
// quote — so without this the jump silently does nothing in the one case it
// was built for.
function jumpToEntry(n) {
  revealEntry(n);
  const el = chat.querySelector(`[data-n="${String(n).replace(/"/g, "")}"]`);
  if (!el) return toast("That message isn't part of this conversation any more.", true);
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.remove("jump-flash");
  void el.offsetWidth; // restart the highlight when the same entry is re-targeted
  el.classList.add("jump-flash");
  setTimeout(() => el.classList.remove("jump-flash"), 1800);
  setTimeout(() => { $("jump").style.display = !state.entries.length || nearBottom() ? "none" : "block"; }, 400);
}
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-jump-n]");
  if (!target) return;
  closeQueuePop();
  jumpToEntry(Number(target.dataset.jumpN));
});
// Re-deliver a message that was discarded before it reached a seat. Delegated,
// because the button lives on a message that any rebuild may replace.
document.addEventListener("click", async (e) => {
  const pairButton = e.target.closest("[data-retry-pair]");
  if (pairButton) {
    if (pairButton.disabled) return;
    pairButton.disabled = true;
    try {
      await api("/api/retry", { room: state.room, rootN: Number(pairButton.dataset.retryPair) });
      toast("Retrying the whole Pair cycle.");
    } catch (err) { pairButton.disabled = false; toast(err.message, true); }
    return;
  }
  const btn = e.target.closest("[data-retry-discarded]");
  if (!btn || btn.disabled) return;
  const n = Number(btn.dataset.retryDiscarded);
  const agents = (btn.dataset.retrySeats || "").split(",").filter(Boolean);
  btn.disabled = true; // the summary that follows removes the row entirely
  try {
    await api("/api/queue/retry", { room: state.room, n, ...(agents.length ? { agents } : {}) });
    toast(`Queued again for ${agents.map(seatLabel).join(" and ")}.`);
  } catch (err) {
    btn.disabled = false;
    toast(err.message, true);
  }
});

// The reader's place, as a message and an offset rather than a scroll position.
// Restoring scrollTop alone only works when nothing above the viewport changed
// height, which is exactly what a rebuild cannot promise.
function readAnchor() {
  const root = chatWrap.getBoundingClientRect();
  for (const el of chat.children) {
    if (!el.dataset.n) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > root.top + 1) return { n: el.dataset.n, offset: r.top - root.top };
  }
  return null;
}
function applyAnchor(a) {
  if (!a) return false;
  const el = chat.querySelector(`[data-n="${a.n.replace(/"/g, "")}"]`);
  if (!el) return false;
  // Instant: #chatWrap scrolls smoothly, and animating a correction reads as
  // the lurch it is meant to prevent.
  const behavior = chatWrap.style.scrollBehavior;
  chatWrap.style.scrollBehavior = "auto";
  chatWrap.scrollTop += el.getBoundingClientRect().top - chatWrap.getBoundingClientRect().top - a.offset;
  chatWrap.style.scrollBehavior = behavior;
  return true;
}

function renderAll({ stickToBottom = true, preserveTransient = true, anchor = false } = {}) {
  const oldTop = chatWrap.scrollTop;
  const keep = anchor && !stickToBottom ? readAnchor() : null;
  // Re-rendering the durable transcript must not erase a whisper or a local
  // slash-command note that arrived while a reconnect fetch was in flight.
  const transient = preserveTransient
    ? [...chat.children].filter((el) =>
      !el.dataset.n && (el.classList.contains("whisper") || el.classList.contains("sysmsg")))
    : [];
  chat.innerHTML = "";
  heardSig.clear(); // the rebuild below re-reads them, so nothing cached survives it
  rowByN.clear();
  const start = renderedStartIndex();
  const frag = document.createDocumentFragment();
  if (start > 0) {
    const earlier = document.createElement("button");
    earlier.type = "button";
    earlier.className = "history-more";
    earlier.textContent = "Show earlier ▸";
    earlier.title = start > HISTORY_PAGE
      ? `${start} earlier entries — shows ${HISTORY_PAGE} more`
      : `${start} earlier entr${start === 1 ? "y" : "ies"}`;
    // Wrapped, not passed directly: a handler receives the MouseEvent, which
    // would arrive as the page size.
    earlier.onclick = () => expandHistory();
    frag.appendChild(earlier);
  }
  appendEntryRange(frag, state.entries.slice(start));
  for (const live of Object.values(state.live)) frag.appendChild(live.el);
  for (const el of transient) frag.appendChild(el);
  // Nothing here is new to the reader — it was all on screen a moment ago.
  for (const el of frag.children) el.classList.add("norise");
  chat.appendChild(frag);
  $("empty").style.display = state.entries.length ? "none" : "";
  if (!state.entries.length || stickToBottom) scrollBottom(true);
  else {
    if (!applyAnchor(keep)) chatWrap.scrollTop = oldTop;
    $("jump").style.display = nearBottom() ? "none" : "block";
  }
}

function mergeEntries(snapshot, current) {
  const byN = new Map();
  for (const e of [...(snapshot || []), ...(current || [])]) {
    if (e && e.n !== undefined && e.n !== null) byN.set(String(e.n), e);
  }
  return [...byN.values()].sort((a, b) => a.n - b.n);
}

function receiptKey(r) {
  return [r.agent, r.from, r.upTo, r.turn, r.mode, r.spoke, r.ts, r.outputEntryN, r.relayLaunch?.index, r.outcome].join("\u0001");
}
function mergeReceipts(snapshot, current) {
  const byKey = new Map();
  for (const r of [...(snapshot || []), ...(current || [])]) byKey.set(receiptKey(r), r);
  return [...byKey.values()];
}
function addReceipt(receipt) {
  const key = receiptKey(receipt);
  if (state.receipts.some((r) => receiptKey(r) === key)) return;
  state.receipts.push(receipt);
  // In-place append: extend the coverage index rather than invalidating it.
  if (receiptIndexSource === state.receipts) indexReceipt(receipt);
  for (const e of state.entries) {
    if (!(e.meta?.error || e.n === receipt.outputEntryN)) continue;
    const row = rowByN.get(e.n);
    const panel = row?.querySelector(".why-run");
    if (panel) {
      const opened = panel.open;
      // Only replace this explanation, preserving the error and its controls.
      const holder = document.createElement("div");
      holder.innerHTML = whyRunHTML(e);
      const next = holder.querySelector(".why-run");
      if (next) { next.open = opened; panel.replaceWith(next); }
    }
  }
  refreshHeard(receipt.from, receipt.upTo);
}

function addEntry(e) {
  // The array is sorted by construction, so dedup is a binary search, and an
  // in-order arrival — the overwhelmingly common case — is a push rather than
  // the full Map-rebuild-and-sort mergeEntries does. That rebuild allocated a
  // 10k-element array plus a 10k-key Map per arriving entry in a long room,
  // several times a second during an active work turn.
  if (entryIndexOf(e.n) >= 0) return;
  const wasAtBottom = nearBottom();
  const last = state.entries[state.entries.length - 1];
  const inOrder = !last || e.n > last.n;
  if (inOrder) {
    state.entries.push(e);
    if (capIndexSource === state.entries) indexCapEntry(e);
  } else {
    state.entries = mergeEntries(state.entries, [e]);
  }
  // Kept in state (it is real history and the transcript replays it) but never
  // drawn: the message it is about now carries its own status, and the room
  // summary that follows this entry repaints that chip.
  if (hiddenEntry(e)) return;
  // an arriving entry replaces any live bubble for that agent
  if (e.kind === "agent" && state.live[e.author]) removeLive(e.author);
  if (e.kind === "system" && e.meta && e.meta.agent && state.live[e.meta.agent]) removeLive(e.meta.agent);
  $("empty").style.display = "none";

  // An entry that lands above the end changes heights the reader is sitting on,
  // so the rebuild has to put them back where they were.
  if (!inOrder) {
    renderAll({ stickToBottom: wasAtBottom, anchor: true });
    if (document.hidden && e.kind !== "activity") { document.title = "● Parley"; notifyForEntry(e); }
    return;
  }
  if (state.renderFromN !== null && e.n < state.renderFromN) return;
  // A new action extends the run it belongs to in place. It used to rebuild the
  // transcript, which meant every visible message replayed its entrance
  // animation while it was being read.
  if (e.kind === "activity") {
    if (appendActivityEntry(e)) scrollBottom(wasAtBottom);
    else renderAll({ stickToBottom: wasAtBottom, anchor: true });
    return;
  }
  const rowEl = entryEl(e);
  if (e.n !== undefined && e.n !== null) rowByN.set(e.n, rowEl);
  chat.appendChild(rowEl);
  // Keep any live bubbles after the durable transcript entry.
  for (const live of Object.values(state.live)) chat.appendChild(live.el);
  if (document.hidden && e.kind !== "activity") { document.title = "● Parley"; notifyForEntry(e); }
  scrollBottom(e.kind === "user" || wasAtBottom);
}

// ---- away-from-tab notifications ----
// A work-mode turn can run for fifteen minutes and a pair cycle can pause
// waiting for a decision, so the interesting moment usually arrives while the
// user is in their editor. A dot on the tab title was the only signal. This is
// opt-in, per browser, and never asks unprompted — the toggle lives in Settings.
const NOTIFY_KEY = "parley.notify";
function notifyEnabled() {
  try { return localStorage.getItem(NOTIFY_KEY) === "1"; } catch { return false; }
}
function setNotifyEnabled(on) {
  try { localStorage.setItem(NOTIFY_KEY, on ? "1" : "0"); } catch { /* private mode */ }
}
async function requestNotifyPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try { return (await Notification.requestPermission()) === "granted"; } catch { return false; }
}
// Only while the tab is hidden: a notification for something already on screen
// is noise, and this feature exists for the moments the user is elsewhere.
function notifyAway(title, body) {
  if (!document.hidden || !notifyEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body: String(body || "").slice(0, 180), tag: "parley-" + state.room });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* the browser refused; the tab title still carries the dot */ }
}
// The three moments worth interrupting someone for: an answer landed, the room
// is waiting on a decision it cannot make, or something failed.
function notifyForEntry(e) {
  if (e.kind === "agent") {
    notifyAway(`${seatLabel(e.author)} replied`, e.text);
  } else if (e.kind === "system" && e.meta) {
    if (e.meta.pairPause || /needs your decision|needs-user/i.test(e.text || "")) {
      notifyAway("Parley is waiting on you", e.text);
    } else if (e.meta.error) {
      notifyAway("A turn failed", e.text);
    }
  }
}

// live (thinking / streaming) bubbles
// What a run's phase reads as while it is live. Shared by the status stream
// and the summary path, so a tab that loads mid-run gets the same words a tab
// that watched the run start did.
function liveLabelFor(phase) {
  return ({
    listening: "is listening 👂",
    "catching-up": "is catching up 👂",
    review: "is reviewing 🔁",
    fix: "is fixing 🔁",
    attention: "is receiving an answer ↩",
    closure: "is closing the exchange 🔒",
    hop: "is following up ⛓",
    retrying: "is restoring its session",
  })[phase];
}
function elapsedLabel(l) {
  return "· " + Math.floor((Date.now() - l.startedAt) / 1000) + "s";
}
function ensureLive(agent, startedAt, label) {
  if (state.live[agent]) return state.live[agent];
  const div = document.createElement("div");
  div.className = "msg agent " + agent;
  div.dataset.liveAgent = agent;
  div.innerHTML = `<div class="meta"><span class="avatar">${esc(seatAvatar(agent))}</span>` +
    `<span class="who">${agent.charAt(0).toUpperCase() + agent.slice(1)}</span>` +
    `<span class="live-label">${label || "is thinking"} <span class="elapsed"></span></span></div>` +
    `<div class="quote-slot"></div>` +
    `<div class="bubble"><span class="thinking-dots"><i></i><i></i><i></i></span></div>`;
  chat.appendChild(div);
  state.live[agent] = { el: div, mode: "think", startedAt: startedAt || Date.now(), text: "" };
  liveObserver.observe(div);
  applyLiveRef(agent);
  scrollBottom();
  scheduleVisibility();
  return state.live[agent];
}
function removeLive(agent) {
  const l = state.live[agent];
  if (l) { liveObserver.unobserve(l.el); l.el.remove(); delete state.live[agent]; }
  delete state.liveVisible[agent];
  if (state.streamTimer[agent]) { clearTimeout(state.streamTimer[agent]); delete state.streamTimer[agent]; }
  renderBusyStrip();
}

// ---- provenance while busy ----
// One source of truth for both surfaces: the quote header inside the live
// bubble (primary, and it becomes scrollback once the reply lands) and the
// composer strip (fallback, only while that bubble is off-screen).
function busyInfoFor(agent) {
  const list = (state.summary && state.summary.busyInfo) || [];
  return list.find((b) => b.agent === agent) || null;
}
function applyLiveRef(agent) {
  const l = state.live[agent];
  if (!l) return;
  const slot = l.el.querySelector(".quote-slot");
  if (!slot) return;
  const info = busyInfoFor(agent);
  const src = info && info.source ? info.source : null;
  const root = info && (info.deliveryKind === "root" || info.deliveryKind === "start");
  const html = src ? quoteRefHTML(src, info?.delivery?.accounting === "automatic" ? "Triggered by" : root ? "invoked by your message" : "↩ replying to") +
    (info?.relayLaunch?.accounting === "automatic" ? `<div class="meta">${provenanceBadges(info)}</div>` : "") +
    liveWhyRunHTML(info) : "";
  if (slot.innerHTML !== html) slot.innerHTML = html;
}
function applyLiveRefs() {
  for (const agent of Object.keys(state.live)) applyLiveRef(agent);
}
function liveWhyRunHTML(info) {
  if (!info) return "";
  return whyRunHTML({ kind: "agent", author: info.agent, meta: { outcome: "running",
    delivery: { kind: info.deliveryKind, rootN: info.rootN, triggerEntryN: info.sourceN, ...info.delivery },
    relayLaunch: info.relayLaunch, catchUp: info.catchUp } });
}

const PHASE_VERB = {
  start: "invoked by", hop: "replying to", retrying: "restoring a session for",
  listening: "listening in on", "catching-up": "catching up on", review: "reviewing", fix: "fixing after",
};
const RUNNING_VERB = {
  start: "responding", hop: "responding", retrying: "responding",
  listening: "listening", "catching-up": "catching up", review: "reviewing", fix: "fixing",
};

// Hysteresis, not a boolean. Showing the strip the instant the bubble's last
// pixel leaves and hiding it the instant the first returns makes it blink
// while you scroll past the boundary; fully-gone to show, half-back to hide.
//
// "Half back" is measured against whichever is smaller, the bubble or the
// viewport. An observer threshold cannot express that: thresholds are ratios
// of the *target*, so a reply three viewports tall tops out around 0.33 and
// would never cross 0.5 — the strip would sit there covering a bubble that
// fills the screen. So the observer is only the nudge; the rects decide.
function measureLiveVisibility() {
  const root = chatWrap.getBoundingClientRect();
  for (const [agent, l] of Object.entries(state.live)) {
    const r = l.el.getBoundingClientRect();
    const shown = Math.max(0, Math.min(r.bottom, root.bottom) - Math.max(r.top, root.top));
    const half = Math.min(r.height, root.height) * 0.5;
    if (shown <= 0) state.liveVisible[agent] = false;
    else if (half > 0 && shown >= half) state.liveVisible[agent] = true;
    else if (state.liveVisible[agent] === undefined) state.liveVisible[agent] = true;
    // Anything between the two edges keeps whatever it already was — that gap
    // is the hysteresis.
  }
}
let visibilityFrame = 0;
function scheduleVisibility() {
  if (visibilityFrame) return;
  const run = () => {
    visibilityFrame = 0;
    measureLiveVisibility();
    renderBusyStrip();
  };
  visibilityFrame = typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(run) : setTimeout(run, 16);
}
// The observer catches what scrolling does not: the bubble growing as a reply
// streams in, the composer resizing, the window changing shape.
const liveObserver = typeof IntersectionObserver === "function"
  ? new IntersectionObserver(scheduleVisibility, { root: chatWrap, threshold: [0, 0.25, 0.5, 0.75, 1] })
  // Without it the scroll handler still measures; only layout changes that
  // move nothing would be missed. One optional surface must not be able to
  // take the whole page down.
  : { observe() {}, unobserve() {} };
chatWrap.addEventListener("scroll", scheduleVisibility);

function stripRowHTML(b) {
  const src = b.source;
  const direct = b.deliveryKind === "root" || b.deliveryKind === "start";
  const verb = direct ? (src && refWho(src) !== "you" ? `invoked by ${refWho(src)}` : "invoked by your message") : PHASE_VERB[b.phase] || "replying to";
  return `<span class="bs-dot" style="background:${esc(seatColor(b.agent))}"></span>` +
    `<span class="bs-agent">${esc(seatLabel(b.agent))}</span>` +
    `<span class="bs-verb">→ ${esc(verb)}${src && !direct ? ` ${esc(refWho(src))}` : ""}</span>` +
    (src ? `<span class="bs-time">· ${esc(hhmm(src.ts))}</span>` +
      `<span class="bs-snip">· “${esc(src.text || "")}”</span>` : "");
}

// Exactly one row, for the whole working period. A row that comes and goes —
// per seat, per scroll boundary, or per hop — resizes the composer and reflows
// the transcript under whoever is reading it, and a seat joining late is
// precisely when someone is scrolled up. So the strip summarises rather than
// grows: the first off-screen reply, plus a count of the others.
let stripRowEl = null;
function renderBusyStrip() {
  const strip = $("busyStrip");
  if (!strip) return;
  const s = state.summary || {};
  const info = s.busyInfo || [];
  if (!info.length && !s.working && !Object.keys(state.live).length) {
    strip.style.display = "none";
    strip.replaceChildren();
    stripRowEl = null;
    return;
  }
  strip.style.display = "flex";
  if (!stripRowEl) {
    stripRowEl = document.createElement("button");
    stripRowEl.type = "button";
    stripRowEl.className = "bs-row";
    strip.appendChild(stripRowEl);
  }
  const row = stripRowEl;
  // Fallback only: while a bubble is on screen its own quote header is already
  // saying this, and two copies of one line is worse than none.
  const off = info.filter((b) => state.liveVisible[b.agent] === false);
  row.classList.toggle("bs-hidden", !off.length);
  if (!off.length) return; // hidden, so its contents cannot be read or clicked
  const b = off[0];
  const rest = off.length - 1;
  const html = stripRowHTML(b) + (rest > 0
    ? `<span class="bs-other" data-scroll-live="1" title="Show the live replies">· +${rest} other</span>`
    : "");
  // Rewritten only when it actually changed: replacing the row's markup on
  // every status event restarted the pulse on its dot.
  if (row.dataset.sig !== html) { row.innerHTML = html; row.dataset.sig = html; }
  const src = b.source;
  if (src) { row.dataset.jumpN = String(src.n); row.title = "Jump to this message"; }
  else { delete row.dataset.jumpN; row.title = ""; }
}
$("busyStrip").addEventListener("click", (e) => {
  if (!e.target.closest("[data-scroll-live]")) return;
  e.stopPropagation(); // the row is a jump target; the count inside it is not
  const first = Object.values(state.live)[0];
  if (first) first.el.scrollIntoView({ block: "center", behavior: "smooth" });
});
function clearLive() {
  for (const agent of Object.keys(state.live)) removeLive(agent);
}
// The server sends increments, not the whole reply each time: `text` is a full
// keyframe, `{from, delta}` extends what we already hold. An increment that
// does not start exactly where our text ends means we missed one, so hold the
// bubble as-is and wait for the next keyframe (at most two seconds) rather than
// splicing text at the wrong offset. The finished entry is authoritative either
// way, so the worst case is a briefly stale bubble.
function liveStream(agent, msg) {
  const l = ensureLive(agent, (busyInfoFor(agent) || {}).startedAt);
  if (typeof msg.text === "string") l.text = msg.text;
  else if (msg.from === l.text.length) l.text += msg.delta;
  else return;
  if (state.streamTimer[agent]) return;
  // The repaint cost is not the markdown (0.26ms at 20KB) — it is the layout of
  // the destroyed-and-recreated bubble subtree, which grows with reply length:
  // ~20ms per flush at 20KB, every 90ms, ~22% of the main thread for the whole
  // tail of a long reply, felt as keystroke stalls while composing. Text
  // accumulation happens above, outside the timer, so coalescing more per
  // repaint loses nothing — the flush interval simply grows with the reply.
  const flushDelay = l.text.length < 4096 ? 90 : l.text.length < 16384 ? 250 : 500;
  state.streamTimer[agent] = setTimeout(() => {
    delete state.streamTimer[agent];
    const cur = state.live[agent];
    if (!cur) return;
    // The label is written once, on the think→stream transition. Rewriting it
    // every flush recreated an empty .elapsed span, so the "· 12s" counter was
    // blank ~90% of the time during streaming — exactly when it matters.
    if (cur.mode !== "stream") {
      cur.mode = "stream";
      cur.el.querySelector(".live-label").innerHTML = `is replying <span class="elapsed">${elapsedLabel(cur)}</span>`;
    }
    cur.el.querySelector(".bubble").innerHTML = renderMD(cur.text) + '<span class="caret"></span>';
    scrollBottom();
  }, flushDelay);
}
function whisper(agent, error, hop, skipped, asleep, held, queued, attention) {
  const d = document.createElement("div");
  d.className = "whisper";
  // A sleeping seat is not a busy one: there is no later turn to catch up on
  // until the user wakes it, which is why this skip also lands in the thread.
  // Held is the opposite case and must not read as a drop — the message was
  // accepted and is waiting for the seat, not lost.
  d.textContent = queued
    ? `👂 ${agent} was occupied — queued one catch-up after user work finishes`
    : held
    ? `📥 ${agent} is asleep — held until you wake it`
    : skipped
    ? (asleep
      ? `😴 ${agent} is asleep — nothing was delivered to it`
      : `⏭ ${agent} is busy in another exchange — it'll catch up on its next turn`)
    : error
      ? `👂 ${agent} was listening but hit an error: ${error}`
      : attention
        ? `↩ ${agent} received the causal message — nothing to add`
      : hop
        ? `⛓ ${agent} read the mention — nothing to add`
        : `👂 ${agent} listened — nothing to add`;
  chat.appendChild(d);
  scrollBottom();
  setTimeout(() => { d.style.opacity = "0"; setTimeout(() => d.remove(), 900); }, 4500);
}
setInterval(() => {
  for (const a of Object.keys(state.live)) {
    const l = state.live[a];
    const el = l.el.querySelector(".elapsed");
    if (el) el.textContent = elapsedLabel(l);
  }
}, 1000);

// ------------------------------------------------------------ header / pills / busy
// Seats are data: colors, avatars and controls all render from the summary's
// seat list + provider catalog, so any provider pair just works.
// A seat's look and settings come from its provider, which its id no longer has
// to match. `seatInfo` carries that per seat; a summary from before it existed
// (or a seat missing from it) falls back to the provider-keyed catalog, which
// is correct whenever the id is the provider name.
function seatMeta(a) {
  const info = state.summary && state.summary.seatInfo && state.summary.seatInfo[a];
  return info || (state.providers && state.providers[a]) || {};
}
const titleCaseSeat = (a) => String(a).charAt(0).toUpperCase() + String(a).slice(1);
function seatAvatar(a) {
  return seatMeta(a).avatar || String(a)[0].toUpperCase();
}
// What this room has actually spent, per seat. The numbers are already on every
// reply (ground truth from the CLI, not model self-reporting); nothing summed
// them, so the only cost signal was one bubble at a time — in an app whose Sleep
// feature exists because people hit rate limits.
function seatUsage(a) {
  let out = 0, reasoning = 0, replies = 0;
  for (const e of state.entries) {
    if (e.kind !== "agent" || e.author !== a) continue;
    const t = e.meta && e.meta.tokens;
    if (!t) continue;
    replies++;
    if (typeof t.out === "number") out += t.out;
    if (typeof t.reasoning === "number") reasoning += t.reasoning;
  }
  return { out, reasoning, replies };
}
function usageSummaryText(a) {
  const u = seatUsage(a);
  if (!u.replies) return "";
  const parts = [`${u.out.toLocaleString()} output tokens`];
  if (u.reasoning) parts.push(`${u.reasoning.toLocaleString()} reasoning`);
  return `${parts.join(" · ")} over ${u.replies} repl${u.replies === 1 ? "y" : "ies"} in this conversation`;
}

function seatColor(a) {
  return (seatMeta(a).color) || "#7aa2f7";
}
function seatLabel(a) {
  const meta = seatMeta(a);
  // A seat's own name wins over its provider's label whenever they differ:
  // that name is what you @mention, and in a room with two seats on one
  // provider "Claude" and "Claude" would be indistinguishable.
  if (meta.provider && meta.provider !== a) return titleCaseSeat(a);
  return meta.label || titleCaseSeat(a);
}
function injectSeatStyles() {
  let css = "";
  const catalog = { ...state.providers, ...(state.summary && state.summary.seatInfo || {}) };
  for (const [id, p] of Object.entries(catalog)) {
    const c = p.color || "#7aa2f7";
    const selectors = `.msg.${id},.activity.${id},.hdot.${id},.chip[data-t="${id}"]`;
    css += `${selectors}{--seat-color:${c}}\n` +
      `@media(prefers-color-scheme:light){${selectors}{--seat-color:color-mix(in srgb,${c} 72%,#172030)}}\n` +
      `.msg.${id} .who{color:var(--seat-color)} .msg.${id} .avatar{background:var(--seat-color)} ` +
      `.msg.${id} .bubble{border-left:2px solid color-mix(in srgb,var(--seat-color) 55%,transparent)} ` +
      `.activity.${id} .adot{background:var(--seat-color)} .hdot.${id}{--hc:var(--seat-color)} ` +
      `.chip.active[data-t="${id}"]{background:var(--seat-color);border-color:var(--seat-color)}\n`;
  }
  let el = $("seatStyles");
  if (!el) { el = document.createElement("style"); el.id = "seatStyles"; document.head.appendChild(el); }
  el.textContent = css;
}
function renderSeatsUI(s) {
  const seats = s.seats;
  $("empty").classList.toggle("room-selected", !!state.room);
  $("roomStartTitle").textContent = `Start ${s.name || state.room}`;
  $("roomStartCopy").textContent = `${seats.length} agent${seats.length === 1 ? "" : "s"} ready for your first message.`;
  $("pills").innerHTML = seats.map((a) =>
    `<div class="pill" tabindex="0" data-seat="${esc(a)}" id="pill_${esc(a)}" style="--seat-accent:${seatColor(a)}"><span class="st"></span>` +
    `<b>${esc(seatLabel(a))}</b><span class="pinfo"></span>` +
    `<button class="ear" data-seat="${esc(a)}">👂</button>` +
    `<button class="moon" data-seat="${esc(a)}">😴</button></div>`).join("");
  // Keep the composer compact for large rooms. Individual targets live in the
  // searchable picker, while the selected target remains visible as a single
  // chip (and @ autocomplete still offers every seat).
  $("seatChips").innerHTML = "";
  const picker = $("agentsBtn");
  if (picker) {
    $("agentsBtnCount").textContent = String(seats.length);
    picker.title = `Choose one of ${seats.length} agents`;
    $("agentsMenuHint").textContent = `${seats.length} in this room`;
    renderAgentOptions(s);
    renderDiscussionMode();
  }
  const allChip = document.querySelector('.chip[data-t="both"]');
  if (allChip) {
    allChip.textContent = "@all";
    allChip.title = `Send to all ${seats.length} agent${seats.length === 1 ? "" : "s"}`;
    allChip.setAttribute("aria-label", `Send to all ${seats.length} agent${seats.length === 1 ? "" : "s"}`);
  }
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.t === state.chip));
  $("tagline").textContent = `Your shared workspace · ${seats.length} agent${seats.length === 1 ? "" : "s"}`;
  input.placeholder = `Message the table…  type @ to choose an agent`;
  $("starters").innerHTML =
    `<button class="starter" data-fill="@${seats.length > 1 ? "all" : esc(seats[0])} Introduce yourselves in one sentence each."><b class="c3">@${seats.length > 1 ? "all" : seats[0]}</b> ${seats.length > 1 ? "Introduce yourselves in one sentence each." : "Start with a focused question."}</button>` +
    seats.map((a, i) => `<button class="starter" data-fill="@${esc(a)} "><b class="${i ? "c2" : "c1"}">@${esc(a)}</b> ask ${esc(seatLabel(a))} something…</button>`).join("") +
    (seats.length > 1 ? `<button class="starter" data-fill="/pair start @${esc(seats[0])} "><b class="c1">/pair start</b> one builds, the other reviews…</button>` : "");
}
function seatIdentity(a) {
  const meta = seatMeta(a);
  const cfg = state.summary?.cfg?.agents?.[a] || {};
  const providerId = meta.provider || cfg.provider || a;
  const providerLabel = state.providers?.[providerId]?.label || providerId;
  return `@${a} · ${providerLabel} · ${cfg.model || "model: provider default"} · ${cfg.effort || "effort: provider default"}${cfg.serviceTier === "fast" ? " · Fast mode" : ""}`;
}
function renderAgentOptions(s) {
  const box = $("agentsOptions");
  if (!box) return;
  const q = String($("agentsSearch")?.value || "").trim().toLowerCase();
  const rows = (s.seats || []).map((a) => {
    const runtime = (s.agents && s.agents[a]) || {};
    const cfg = (s.cfg && s.cfg.agents && s.cfg.agents[a]) || {};
    const info = (s.seatInfo && s.seatInfo[a]) || {};
    const role = cfg.instructions || info.role || info.description || "";
    const provider = info.provider || cfg.provider || "";
    const status = runtime.asleep ? "sleeping" : (s.busy || []).includes(a) ? "working" : "ready";
    return { a, label: seatLabel(a), provider, role, status, identity: seatIdentity(a) };
  }).filter((x) => !q || [x.a, x.label, x.provider, x.role, x.status, x.identity].join(" ").toLowerCase().includes(q));
  box.innerHTML = rows.length ? rows.map((x) => `<button type="button" role="option" class="agent-option${state.chip === x.a ? " selected" : ""}" aria-selected="${state.chip === x.a}" data-agent-target="${esc(x.a)}"><span class="agent-dot" style="--seat-accent:${seatColor(x.a)}"></span><span class="agent-option-copy"><b>@${esc(x.a)}</b><small>${esc([x.identity, x.role].filter(Boolean).join(" · "))}</small></span><span class="agent-status">${esc(x.status)}</span></button>`).join("") : `<div class="agent-empty">No agents match “${esc(q)}”.</div>`;
}
function renderDiscussionMode() {
  document.querySelectorAll("[data-discussion-mode]").forEach((el) => {
    const active = el.dataset.discussionMode === state.discussionMode;
    el.classList.toggle("active", active);
    el.setAttribute("aria-checked", String(active));
  });
  const rounds = $("convergenceRounds");
  if (rounds) rounds.value = String(state.convergenceRounds);
  $("convergenceRoundsWrap").hidden = state.discussionMode !== "converge" || (state.summary?.seats?.length || 0) < 2;
  const btn = $("agentsBtn");
  if (btn) {
    btn.classList.toggle("converging", state.discussionMode === "converge" && state.chip === "both");
    const label = $("agentsBtnLabel");
    if (label) label.textContent = state.chip !== "auto" && state.chip !== "both" ? `@${state.chip}` : "Agents";
    if ($("agentPickerWrap").classList.contains("open")) {
      const menu = $("agentsMenu");
      menu.style.top = `${Math.max(8, btn.getBoundingClientRect().top - menu.offsetHeight - 8)}px`;
    }
  }
}
function syncChipUI() {
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.t === state.chip));
}
function pairRoundsLabel(rounds) {
  const n = Math.max(0, Number(rounds) || 0);
  return n > 0 ? `up to ${n} round${n === 1 ? "" : "s"} per message` : "until approved";
}
function configArgValue(args, option) {
  const wanted = option.toLowerCase();
  let found = 0;
  let value = null;
  for (let i = 0; i < (args || []).length; i++) {
    const raw = String(args[i]);
    if (raw.split("=", 1)[0].toLowerCase() !== wanted) continue;
    found++;
    value = raw.includes("=") ? raw.slice(raw.indexOf("=") + 1) : String(args[i + 1] || "");
    if (!value.trim() || value.startsWith("-")) value = "invalid override";
  }
  return found > 1 ? "invalid override" : value;
}
function effectiveSeatPermission(a, cfg, roomMode) {
  if ("permissionMode" in cfg) {
    const override = configArgValue(cfg.extraArgs || [], "--permission-mode");
    if (override !== null) return override || "invalid override";
    const configured = cfg.permissionMode || "auto";
    return configured === "auto" ? (roomMode === "work" ? "acceptEdits" : "default") : configured;
  }
  if ("sandbox" in cfg) {
    const configured = cfg.sandbox || "read-only";
    return roomMode === "work" && configured === "read-only" ? "workspace-write" : configured;
  }
  return "provider default";
}
function permissionLabel(mode) {
  const labels = {
    default: "CLI default",
    manual: "manual",
    plan: "plan — read only",
    acceptEdits: "accept edits",
    bypassPermissions: "full access",
    "read-only": "read only",
    "workspace-write": "workspace write",
    "danger-full-access": "full access",
  };
  return labels[mode] || mode;
}
function isFullAccess(mode) {
  return String(mode).toLowerCase() === "bypasspermissions" || mode === "danger-full-access";
}
function isConservative(mode) {
  return ["default", "manual", "plan", "read-only"].includes(mode);
}
// Which branch/worktree the room's folder is actually in. The server reports
// null for anything it could not read with certainty, and then this shows
// nothing at all rather than a stale or guessed branch.
function renderGitId(git) {
  const el = $("gitId");
  const where = git && (git.detached ? (git.head ? `${git.head} (detached)` : "") : (git.branch || ""));
  // The worktree's name is only worth the space when it is a *linked* worktree.
  // For an ordinary checkout it just repeats the folder name the workspace
  // button above already shows.
  const label = where ? `⑂ ${where}${git.linked && git.worktree ? ` · ${git.worktree}` : ""}` : "";
  el.textContent = label;
  el.title = label
    ? (git.detached ? "Detached HEAD — this folder is on no branch" : `On branch ${git.branch}`) +
      (git.linked && git.worktree ? ` · linked worktree ${git.worktree}` : "")
    : "";
  el.style.display = label ? "" : "none";
}

// A checkout in another window changes this with no event to announce it, so
// re-read on focus. One fetch per focus, never a poll.
async function refreshGitId() {
  const room = state.room;
  if (!room) return;
  try {
    // The summary endpoint, not /api/room: this needs one field, and the full
    // snapshot grows with the room's whole history.
    const data = await api("/api/room/summary?name=" + encodeURIComponent(room));
    if (state.room !== room) return;
    if (state.summary) state.summary.git = data.room.git;
    renderGitId(data.room.git);
  } catch { /* keep the last line rather than blanking on a transport hiccup */ }
}

function convergenceSnapshot(s) {
  return s && (s.convergence || s.convergenceRun || s.deliberation || null);
}
function renderConvergencePanel(s) {
  const panel = $("convergencePanel");
  if (!panel) return;
  const c = convergenceSnapshot(s);
  if (!c) { panel.hidden = true; panel.innerHTML = ""; return; }
  const phase = String(c.phase || c.status || "").toLowerCase();
  const labels = { gathering: "Gathering", drafting: "Drafting", reviewing: "Reviewing", agreed: "Agreement", complete: "Agreement", unresolved: "Unresolved", incomplete: "Incomplete", stopped: "Stopped" };
  const phaseLabel = labels[phase] || (c.phase || c.status || "Convergence");
  const seats = s.seats || [];
  const count = (v) => Array.isArray(v) ? v.length : Number(v || 0);
  const received = c.received ?? c.responses ?? c.receipts ?? count(c.contributions);
  const approvals = c.approvals || c.approvedBy || [];
  const approvedCount = Array.isArray(approvals) ? approvals.length : count(approvals);
  const total = c.total || c.participantCount || seats.length;
  const round = c.round || c.reviewRound || 0;
  const maxRounds = c.maxRounds || c.convergenceRounds || state.convergenceRounds;
  // One position per participant, then each review round invokes every
  // participant plus one synthesis pass: N + R * (N + 1).
  const plannedCalls = c.plannedCalls || (c.calls && c.calls.planned) || (total + Number(maxRounds) * (total + 1));
  const usedCalls = c.calls?.used ?? c.usedCalls ?? 0;
  const detailsOpen = panel.querySelector(".convergence-contributions")?.open || false;
  const roundReviews = (c.rounds || []).flatMap((round) => Object.entries(round.reviews || {}).map(([agent, x]) => ({ agent, text: x.reason || x.rationale || x.text, stage: `review round ${round.version || "?"}`, decision: x.decision || x.status, version: x.version || round.version, hash: x.draftHash || x.hash || round.hash, reservation: x.reservation })));
  const contributions = Array.isArray(c.contributions) ? c.contributions : [
    ...Object.entries(c.positions || {}).map(([agent, x]) => ({ agent, text: x.text || x.content || x.summary, stage: "position" })),
    ...(roundReviews.length ? roundReviews : Object.entries(c.reviews || {}).map(([agent, x]) => ({ agent, text: x.reason || x.rationale || x.text, stage: "review", decision: x.decision || x.status, version: x.version, hash: x.draftHash || x.hash, reservation: x.reservation })))
  ].filter((x) => x.text);
  const finalValue = c.final || c.handoff || c.agreement || c.artifact || "";
  const finalText = typeof finalValue === "string" ? finalValue : finalValue.text || finalValue.content || finalValue.reason || "";
  const outcome = c.outcome || c.result || (finalValue.status === "agreed" ? "Agreed" : finalValue.status) || (phaseLabel === "Agreement" ? "Agreed" : "");
  panel.hidden = false;
  panel.classList.toggle("is-final", ["agreed", "complete", "unresolved", "incomplete", "stopped"].includes(phase));
  const finalMarkup = finalText && !["agreed", "complete"].includes(phase)
    ? `<div class="convergence-final"><div class="final-label">${esc(outcome || "Draft")}</div><p>${esc(finalText)}</p>${finalValue.reason ? `<p class="convergence-reason"><b>Why:</b> ${esc(finalValue.reason)}</p>` : ""}</div>`
    : ["agreed", "complete"].includes(phase) ? `<div class="convergence-final"><div class="final-label">Agreed handoff</div><p>Final handoff posted in the transcript above.</p></div>` : "";
  const terminal = ["agreed", "complete"].includes(phase);
  const canResume = c.actions?.resume !== false;
  const canExtend = c.actions?.extend !== false;
  const extendCalls = total + 1;
  const actionReason = c.actions?.reason ? `<p class="convergence-reason">${esc(c.actions.reason)}</p>` : "";
  const actions = terminal ? actionReason : `<div class="convergence-actions">${actionReason}${["incomplete", "unresolved", "stopped"].includes(phase) && canResume ? `<button type="button" data-convergence-action="resume">Resume</button>` : ""}${["incomplete", "unresolved", "stopped"].includes(phase) && canExtend ? `<button type="button" data-convergence-action="extend">Extend review <small>(+1 round · +${extendCalls} calls)</small></button>` : ""}${!["incomplete", "unresolved", "stopped"].includes(phase) ? `<button type="button" data-convergence-action="stop">Stop</button>` : ""}</div>`;
  panel.innerHTML = `<div class="convergence-head"><div><b>Shared handoff</b><span>${esc(phaseLabel)}${round ? ` · review ${esc(round)}/${esc(maxRounds)}` : ""} · ${esc(usedCalls)}/${esc(plannedCalls)} agent calls</span></div><span class="convergence-status ${esc(phase)}">${esc(outcome || "in progress")}</span></div><div class="convergence-steps" aria-label="Convergence phases"><span class="${received ? "done" : ""}">Gathering <b>${esc(received)}/${esc(total)}</b></span><span class="${["drafting","reviewing","agreed","complete","unresolved"].includes(phase) ? "done" : ""}">Drafting</span><span class="${["reviewing","agreed","complete","unresolved"].includes(phase) ? "done" : ""}">Reviewing <b>${esc(approvedCount)}/${esc(total)}</b></span><span class="${["agreed","complete"].includes(phase) ? "done" : ""}">Agreement</span></div>${contributions.length ? `<details class="convergence-contributions"><summary>Inspect contributions (${contributions.length})</summary>${contributions.map((x, i) => `<article><b>${esc(x.agent || x.seat || x.name || `Agent ${i + 1}`)}${x.stage ? ` · ${esc(x.stage)}` : ""}</b>${x.decision ? `<small class="review-meta">${esc(x.decision)}${x.version ? ` · v${esc(x.version)}` : ""}${x.hash ? ` · ${esc(x.hash)}` : ""}</small>` : ""}<p>${esc(x.text || x.content || x.summary || "No contribution text")}</p>${x.reservation ? `<p class="review-reservation"><b>Reservation:</b> ${esc(x.reservation)}</p>` : ""}</article>`).join("")}</details>` : ""}${finalMarkup}${actions}`;
  const details = panel.querySelector(".convergence-contributions");
  if (details && detailsOpen) details.open = true;
}
function applySummary(s) {
  s.busy = s.busy || [];
  s.busyInfo = s.busyInfo || [];
  for (const agent of Object.keys(state.live)) {
    if (!s.busy.includes(agent)) removeLive(agent);
  }
  state.summary = s;
  state.providers = s.providers || state.providers;
  injectSeatStyles();
  const rosterKey = JSON.stringify([s.name, s.seats, s.seatInfo]);
  if (state.renderedRosterKey !== rosterKey) {
    renderSeatsUI(s);
    state.renderedRosterKey = rosterKey;
  }
  renderAgentOptions(s);
  renderDiscussionMode();
  renderConvergencePanel(s);
  syncChipUI();
  $("roomTitle").textContent = s.name;
  for (const a of s.seats) {
    const pill = $("pill_" + a);
    if (!pill) continue;
    const ag = s.agents[a];
    const asleep = !!ag.asleep;
    pill.classList.toggle("linked", ag.linked);
    pill.classList.toggle("busy", s.busy.includes(a));
    pill.classList.toggle("bad", !ag.command.ok);
    pill.classList.toggle("asleep", asleep);
    // The pill's tooltip is where someone looks when they want to know what a
    // seat has cost them so far.
    const spent = usageSummaryText(a);
    const health = (state.doctor && state.doctor[a]) || null;
    pill.title = [
      ag.command.ok ? `${seatLabel(a)} · ${ag.command.detail}` : `${seatLabel(a)}: ${ag.command.detail}`,
      health && !health.ok && health.stage === "auth" ? `${health.detail} — ${health.how}` : "",
      spent,
    ].filter(Boolean).join("\n");
    let txt = "";
    if (!ag.command.ok) txt = "not found";
    else if (health && !health.ok && health.stage === "auth") txt = "not signed in";
    else {
      // A seat can be both: sleep stops the *next* launch, so a response
      // already running still says so.
      const bits = [];
      if (s.busy.includes(a)) bits.push("typing…");
      if (ag.catchUp && !s.busy.includes(a)) bits.push("catch-up queued");
      // Held is a subset of pending, never an addend — "3 held · 14 pending"
      // means 3 of those 14 are messages the user addressed to this seat.
      // It outlives sleep: after Wake only the seat is awake and they are still
      // undelivered, so the count stays until a turn moves the cursor.
      if (asleep) bits.push(ag.pending ? `asleep · ${ag.pending} pending` : "asleep");
      if (ag.held) bits.push(`${ag.held} held`);
      if (!bits.length && s.cfg.agents[a].model) bits.push(s.cfg.agents[a].model);
      txt = bits.join(" · ");
    }
    pill.querySelector(".pinfo").textContent = txt ? " · " + txt : "";
    pill.setAttribute("aria-label", seatIdentity(a));
    pill.title = `${seatIdentity(a)}\n` + (ag.command.ok
      ? (ag.linked ? `session linked (${ag.sessionRef}…) · seen through turn ${ag.cursor}` : "fresh session")
      : ag.command.detail);
    const moon = pill.querySelector(".moon");
    const reason = (ag.sleep && ag.sleep.reason) || "";
    moon.classList.toggle("on", asleep);
    moon.textContent = asleep ? "☀" : "😴";
    // The pending count is context, not a token estimate — but this is the one
    // moment the size of the next turn is knowable before it runs, and that
    // turn arrives right after whatever quota event caused the sleep.
    moon.title = asleep
      ? `Wake ${seatLabel(a)}${ag.pending ? ` — ${ag.pending} entr${ag.pending === 1 ? "y" : "ies"} pending` : ""}` +
        `${reason ? ` · asleep: ${reason}` : ""}. ` +
        (ag.held
          ? `${ag.held} of them ${ag.held === 1 ? "is a message" : "are messages"} you sent it — choose whether to answer ${ag.held === 1 ? "it" : "them"} on wake.`
          : "Nothing is replayed; its next turn carries them as ordinary context.")
      : `Put ${seatLabel(a)} to sleep — no message, @call or lurk launches it until you wake it. ` +
        `Use this when it is rate limited; a response already running still finishes.`;
    const ear = pill.querySelector(".ear");
    const lurking = !!s.cfg.agents[a].lurk;
    ear.classList.toggle("on", lurking);
    ear.title = lurking
      ? `${a} is lurking: it overhears every exchange and may chime in (one extra ${a} call per message). Click to turn off.`
      : `Let ${a} lurk: it will overhear every exchange and may chime in (one extra ${a} call per message). Click to turn on.`;
  }
  const mode = s.cfg.mode || "talk";
  document.querySelectorAll(".mbtn").forEach((b) => b.classList.toggle("active", b.dataset.m === mode));
  const access = s.seats.map((a) => ({
    agent: a,
    mode: effectiveSeatPermission(a, s.cfg.agents[a], mode),
  }));
  const how = access.map(({ agent, mode: permission }) =>
    `${esc(agent)}: ${esc(permissionLabel(permission))}`).join(" · ");
  const full = access.filter(({ mode: permission }) => isFullAccess(permission)).map(({ agent }) => agent);
  const talkOverride = mode === "talk" && access.some(({ mode: permission }) => !isConservative(permission));
  $("workBanner").style.display = mode === "work" || talkOverride ? "block" : "none";
  if (full.length) {
    $("workBanner").innerHTML = `⚠ <b>Full access enabled</b> — ${full.map(esc).join(" + ")} may act beyond ` +
      (s.cfg.projectDir ? `<b>${esc(s.cfg.projectDir)}</b>` : "the room workspace") +
      ` within the current OS account's access (${how}).`;
  } else if (mode === "work") {
    $("workBanner").innerHTML = `🔨 <b>Work room</b> — agents can write files and run commands in ` +
      (s.cfg.projectDir ? `<b>${esc(s.cfg.projectDir)}</b>` : "the shared workspace") +
      ` (${how}). Actions show as inline activity lines.`;
  } else if (talkOverride) {
    $("workBanner").innerHTML = `⚠ <b>Talk room with a permission override</b> — configured seats may still make changes (${how}).`;
  }
  const pair = s.pair;
  $("pairBanner").style.display = pair ? "block" : "none";
  if (pair) {
    $("pairBannerText").innerHTML = `🔁 <b>Pair mode</b> — <b>${esc(pair.worker)}</b> works, <b>${esc(pair.reviewer)}</b> reviews ` +
      `(${pairRoundsLabel(pair.rounds)}). Everything you send runs this way.`;
    const source = pair.roundsSource === "command" ? "command override" : "room setting";
    const limited = Number(pair.rounds) > 0;
    const sourceTitle = pair.roundsSource === "command"
      ? (limited
        ? "This active round limit came from /pair start and is independent of the room setting."
        : "This until-approved behavior came from /pair start and is independent of the room setting.")
      : (limited
        ? "This active round limit follows the room's Pair review rounds setting."
        : "This until-approved behavior follows the room's Pair review rounds setting.");
    $("pairBannerText").insertAdjacentHTML("beforeend",
      ` <span title="${esc(sourceTitle)}" style="opacity:.62">· ${source}</span>`);
  }
  // say what this room actually works in, rather than a vague "workspace"
  const wsBtn = $("openWs");
  $("openWsLabel").textContent = s.cfg.projectDir
    ? s.cfg.projectDir.split(/[\\/]/).filter(Boolean).pop()
    : "Sandbox workspace";
  wsBtn.title = s.cfg.projectDir
    ? `Linked project — open ${s.cfg.projectDir}`
    : `This room's own scratch folder — open ${s.workspace}`;
  renderGitId(s.git);
  // A tab that loads mid-run knows each run's phase and start time from
  // busyInfo; without them every bubble read "is thinking · 0s" — for a
  // four-minute work turn, or a lurker that had been deciding for a while.
  for (const b of s.busyInfo || []) ensureLive(b.agent, b.startedAt, liveLabelFor(b.phase));
  for (const a of s.busy) ensureLive(a);
  applyLiveRefs();
  renderBusyStrip();
  setQueue(s.queued || 0, s.queue, s.queuedDispatches, s.queuePaused);
  refreshHeard(0, Infinity); // busy/cursor changes can flip pending/unheard dots
  refreshErrorRecovery();
  updateBusyUI();
  renderHopControl();
  updateRouteHint();
}
// Waking a seat that is holding messages asks a question with three answers,
// so it gets a real menu; a plain toggle stays a plain toggle when there is
// nothing held to decide about.
function closeWakeMenu() {
  $("wakeMenu").classList.remove("open");
  $("wakeMenu").innerHTML = "";
}
function openWakeMenu(moon, agent, held) {
  const menu = $("wakeMenu");
  menu.innerHTML =
    `<button role="menuitem" data-wake="deliver" data-seat="${esc(agent)}">` +
    `☀ Wake &amp; deliver<span class="sm-sub">answers the ${held} held message${held === 1 ? "" : "s"} in one turn</span></button>` +
    `<button role="menuitem" data-wake="only" data-seat="${esc(agent)}">` +
    `☀ Wake only<span class="sm-sub">held message${held === 1 ? " becomes" : "s become"} ordinary context</span></button>`;
  menu.classList.add("open");
  // Fixed positioning against the button: the pill row it lives in is rebuilt
  // on every room update, so an anchored child would be thrown away mid-choice.
  const r = moon.getBoundingClientRect();
  const w = menu.offsetWidth;
  menu.style.left = `${Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))}px`;
  menu.style.top = `${r.bottom + 7}px`;
}
async function wakeSeatFromMenu(agent, deliver) {
  closeWakeMenu();
  try {
    const res = await api("/api/seat/sleep",
      { room: state.room, agent, asleep: false, ...(deliver ? { deliver: true } : {}) });
    toast(deliver && res.delivered
      ? `☀ ${agent} is awake — answering ${res.held} held message${res.held === 1 ? "" : "s"}`
      : `☀ ${agent} is awake — nothing was replayed`);
  } catch (err) { toast(err.message, true); }
}
$("wakeMenu").addEventListener("click", (e) => {
  const choice = e.target.closest("[data-wake]");
  if (choice) wakeSeatFromMenu(choice.dataset.seat, choice.dataset.wake === "deliver");
});
// Anywhere else, including Escape, means "not now" — which is why this cannot
// be a confirm(): its Cancel would have to double as one of the two wakes.
document.addEventListener("click", (e) => {
  if (!e.target.closest("#wakeMenu") && !e.target.closest(".moon")) closeWakeMenu();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeWakeMenu(); });

// ↪ Ask on any user or agent message. Idle target: one action. Busy target: the
// two that are genuinely different — queue behind the current response, or stop
// it and ask now. The stop-and-ask is ONE server request pinned to the runId the
// browser is showing; never a Stop click followed by a Send, which leaves a
// window for the old run to finish and the queue to start something else.
let askDraft = null; // { sourceN, target } while the menu is open
function closeAskMenu() {
  $("askMenu").classList.remove("open");
  $("askMenu").innerHTML = "";
  askDraft = null;
}
function askDefaultTarget(src) {
  if (!src) return null;
  return src.kind === "agent" ? src.author
    : (src.target === "both" ? "both" : src.target);
}
function askPins(seats) {
  const s = state.summary || {};
  const info = (s.busyInfo || []).filter((b) => b.runId);
  // A pair cycle is one unit: redirecting during one ends it, so its runs all
  // go. Otherwise pin only the seats this ask is aimed at — killing an unrelated
  // seat's response is not what "stop the current response" means.
  const wanted = s.workingPair ? info : info.filter((b) => seats.includes(b.agent));
  return wanted.map((b) => ({ agent: b.agent, runId: b.runId }));
}
function askSeatsFor(target) {
  return target === "both" ? ((state.summary && state.summary.seats) || []) : [target];
}
function renderAskMenu(btn) {
  if (!askDraft || !state.summary) return;
  const menu = $("askMenu");
  const seats = (state.summary.seats || []);
  const busy = state.summary.busy || [];
  const aimed = askSeatsFor(askDraft.target);
  const contested = state.summary.workingPair || aimed.some((a) => busy.includes(a));
  const chips = [...seats, ...(seats.length ? ["both"] : [])].map((t) =>
    `<button data-ask-seat="${esc(t)}" class="${t === askDraft.target ? "active" : ""}">` +
    `${esc(t === "both" ? "All agents" : seatLabel(t))}</button>`).join("");
  const draft = ($("askText") || {}).value || "";
  const actions = !contested
    ? `<button role="menuitem" data-ask-mode="now">↪ Ask now<span class="sm-sub">the seat is free</span></button>`
    : `<button role="menuitem" data-ask-mode="queue">⏳ Queue after current` +
      `<span class="sm-sub">everything already queued keeps its place</span></button>` +
      `<button role="menuitem" data-ask-mode="stop">■ Stop current &amp; ask now` +
      `<span class="sm-sub">stops the response on screen; queued work stays behind this</span></button>`;
  menu.innerHTML = `<div class="ask-seats">${chips}</div>` +
    `<input id="askText" placeholder="Add an instruction (optional)" value="${esc(draft)}">` + actions;
  menu.classList.add("open");
  // Only measure against the button on first open; a seat-chip re-render must
  // not make the menu jump out from under the cursor.
  if (btn) {
    const r = btn.getBoundingClientRect();
    const w = menu.offsetWidth;
    menu.style.left = `${Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))}px`;
    menu.style.top = `${r.bottom + 7}px`;
  }
}
function openAskMenu(btn, sourceN) {
  const src = entryByN(sourceN);
  if (!src || !state.summary) return;
  askDraft = { sourceN, target: askDefaultTarget(src) || (state.summary.seats || [])[0] };
  if (!askDraft.target) { askDraft = null; return; }
  renderAskMenu(btn);
}
async function askFromMenu(mode) {
  if (!askDraft) return;
  const seats = askSeatsFor(askDraft.target);
  const body = {
    room: state.room, sourceN: askDraft.sourceN, mode,
    target: askDraft.target, text: ($("askText") || {}).value || "",
    ...(mode === "stop" ? { runs: askPins(seats) } : {}),
  };
  // Nothing on screen to stop: asking for a pinned stop with no pins would be
  // refused, and downgrading is what the user meant anyway.
  if (mode === "stop" && !body.runs.length) { body.mode = "queue"; delete body.runs; }
  closeAskMenu();
  try {
    const r = await api("/api/ask", body);
    if (r.held && r.held.length) toast(`😴 held for ${r.held.join(" and ")} until wake`);
    else if (r.stop && r.stop.stale) toast("That response had already finished — your message is next in line.");
    else if (r.deferred && r.deferred.length) toast(`⏳ next in ${r.deferred.join(" and ")}'s lane`);
  } catch (err) { toast(err.message, true); }
}
$("askMenu").addEventListener("click", (e) => {
  const seat = e.target.closest("[data-ask-seat]");
  if (seat && askDraft) { askDraft.target = seat.dataset.askSeat; renderAskMenu(null); return; }
  const choice = e.target.closest("[data-ask-mode]");
  if (choice) askFromMenu(choice.dataset.askMode);
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#askMenu") && !e.target.closest(".ask")) closeAskMenu();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAskMenu(); });

// ---- narrow-width room navigation ----
// Below 760px the sidebar slides over the chat instead of vanishing. Without
// this, rooms, the workspace, the transcript and settings were all unreachable
// and the only way to another room was editing ?room= by hand.
function setNavOpen(open) {
  document.body.classList.toggle("nav-open", open);
  $("navToggle").setAttribute("aria-expanded", String(open));
  $("navScrim").hidden = !open;
}
$("navToggle").onclick = () => setNavOpen(!document.body.classList.contains("nav-open"));
$("navScrim").onclick = () => setNavOpen(false);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNavOpen(false); });

// ---- keyboard-navigable menus ----
// These surfaces declare role="menu" but had no arrow keys, no focus move on
// open and, for the stop menu, no Escape. Declaring the semantics without
// honouring them is worse than not declaring them.
function menuItems(menu) {
  return [...menu.querySelectorAll("button")].filter((b) => !b.disabled);
}
function focusMenuItem(menu, index) {
  const items = menuItems(menu);
  if (!items.length) return;
  const i = (index + items.length) % items.length;
  items[i].focus();
}
// Called after a menu's contents are written, so the first item takes focus and
// the arrow keys have somewhere to start.
function focusMenu(menu) {
  const items = menuItems(menu);
  if (items.length) items[0].focus();
}
function wireMenuKeys(id, close) {
  const menu = $(id);
  if (!menu) return;
  menu.addEventListener("keydown", (e) => {
    const items = menuItems(menu);
    if (!items.length) return;
    const at = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); focusMenuItem(menu, at + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusMenuItem(menu, at - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusMenuItem(menu, 0); }
    else if (e.key === "End") { e.preventDefault(); focusMenuItem(menu, items.length - 1); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });
}
wireMenuKeys("stopMenu", () => closeStopMenu());
wireMenuKeys("wakeMenu", () => closeWakeMenu());
wireMenuKeys("hopMenu", () => closeHopMenu());
wireMenuKeys("askMenu", () => closeAskMenu());

// ---- modal focus ----
// Tab used to walk straight out of the settings dialog and through the page
// behind it, and closing left focus on nothing.
let settingsOpener = null;
function trapSettingsTab(e) {
  if (e.key !== "Tab" || $("overlay").style.display === "none") return;
  const focusable = [...$("overlay").querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
document.addEventListener("keydown", trapSettingsTab);

$("pills").addEventListener("click", async (e) => {
  const moon = e.target.closest(".moon");
  if (moon && state.summary) {
    const a = moon.dataset.seat;
    const ag = state.summary.agents[a] || {};
    const asleep = !!ag.asleep;
    if (asleep && ag.held > 0) {
      if ($("wakeMenu").classList.contains("open")) closeWakeMenu();
      else openWakeMenu(moon, a, ag.held);
      return;
    }
    closeWakeMenu();
    // Sleeping cancels what the lanes still owe this seat, so say so before it
    // happens rather than in a note afterwards.
    const owed = ((state.summary.queue) || []).filter((it) => (it.agents || []).includes(a)).length;
    if (!asleep && owed && !confirm(
      `${a} has ${owed} queued deliver${owed === 1 ? "y" : "ies"}.\n\n` +
      `Sleeping it cancels ${owed === 1 ? "that" : "those"} now — nothing waits for a seat that won't take it. Continue?`)) return;
    try {
      await api("/api/seat/sleep", { room: state.room, agent: a, asleep: !asleep });
      toast(asleep
        ? `☀ ${a} is awake — nothing was replayed`
        : `😴 ${a} is asleep — nothing will be launched for it until you wake it`);
    } catch (err) { toast(err.message, true); }
    return;
  }
  const ear = e.target.closest(".ear");
  if (!ear || !state.summary) return;
  const a = ear.dataset.seat;
  const cur = !!state.summary.cfg.agents[a].lurk;
  try {
    await api("/api/config", { room: state.room, config: { agents: { [a]: { lurk: !cur } } } });
    toast(!cur ? `👂 ${a} is now lurking — it hears every exchange and may chime in` : `${a} stopped lurking`);
  } catch (err) { toast(err.message, true); }
});
document.querySelectorAll(".mbtn").forEach((b) => {
  b.onclick = async () => {
    const mode = b.dataset.m;
    if (!state.summary || (state.summary.cfg.mode || "talk") === mode) return;
    const pd = state.summary.cfg.projectDir;
    if (mode === "work" && pd &&
        !confirm(`⚠ This room is linked to a real project:\n${pd}\n\nWork mode may let configured agents EDIT files there and run commands. Continue?`)) return;
    const anyLinked = state.summary.seats.some((a) => state.summary.agents[a].linked);
    if (!(mode === "work" && pd) && anyLinked &&
        !confirm(`Switch to ${mode} mode? Affected agents start fresh sessions so the permission change applies (the transcript keeps the room history).`)) return;
    try { await api("/api/config", { room: state.room, config: { mode } }); refreshRooms(); }
    catch (e) { toast(e.message, true); }
  };
});
// Two different questions, and only one of them is about the button's blast
// radius. `working` — any chain mid-flight, including the gaps between its
// turns — decides whether Stop is offered at all, so the button doesn't blink
// out between an agent's reply and the follow-up it triggers. It is
// deliberately *absent* from the chooser test: `working` is true for every
// ordinary exchange, so ORing it in turned the commonest action in the room —
// one seat replying — into two clicks, and made the blast radius of a single
// click flip on sub-second timing the user cannot see. The chooser is for the
// questions a single click genuinely cannot answer: two seats running, work
// still queued, or a pair cycle larger than the turn on screen.
const stopIsChoice = (s) => (s.busy || []).length > 1 || (s.queued || 0) > 0 ||
  !!s.workingPair || !!s.queuePaused;

// The open menu is a snapshot of the moment it was opened. Status events land
// several times a second while agents work, and rebuilding the list under an
// aiming cursor moves the row out from under the click. So while it is open the
// row set and its order are frozen: work that ends goes disabled in place, work
// that starts waits for the next open.
let stopMenuShown = null;

// Five explicit intentions instead of one button and a guess: each seat on its
// own, the actives without the queue, the queue without the actives, and the
// blunt everything. Each entry says what survives it. The key is stable so an
// open menu can be reconciled instead of rebuilt.
function stopMenuRows(summary) {
  const active = summary.busy || [];
  const queued = summary.queued || 0;
  // Deliveries are what the lanes owe; messages are what the user sent. One
  // @both held for both seats is two deliveries and one message — so labels
  // count dispatches, never rows.
  const queuedMessages = summary.queuedDispatches === undefined ? queued : summary.queuedDispatches;
  const rows = active.map((a) => ({
    key: `seat:${a}`, cls: "stop-scope",
    attrs: `data-stop-scope="seat" data-stop-agent="${esc(a)}"`,
    html: `■ Stop ${esc(seatLabel(a))}'s current response`,
  }));
  if (active.length) rows.push({
    key: "active", cls: "stop-scope", attrs: `data-stop-scope="active"`,
    html: `■ Stop current responses<span class="sm-sub">keeps queued work</span>`,
  });
  const held = !!summary.queuePaused;
  // Not a stop scope: this row must never reach /api/stop.
  if (queued > 0 || held) rows.push({
    key: "hold", cls: "stop-scope", attrs: `data-queue-pause="${held ? "0" : "1"}"`,
    html: `${held ? "▶ Resume the queue" : "⏸ Pause the queue"}` +
      `<span class="sm-sub">${held
        ? "queued messages start again, in order"
        : "nothing new starts; running responses finish"}</span>`,
  });
  if (queued > 0) rows.push({
    key: "queue", cls: "stop-scope", attrs: `data-stop-scope="queue"`,
    html: `✕ Discard ${queuedMessages} queued message${queuedMessages === 1 ? "" : "s"}` +
      `<span class="sm-sub">keeps active responses</span>`,
  });
  rows.push({
    key: "all", cls: "stop-all", attrs: `data-stop-scope="all"`,
    html: `■ Stop everything<span class="sm-sub">responses, pair cycle, continuations, lurkers and queue</span>`,
  });
  return rows;
}

function stopMenuHTML(rows) {
  return rows.map((r) =>
    `<button role="menuitem" class="${r.cls}${r.gone ? " stop-gone" : ""}"` +
    `${r.gone ? " disabled" : ""} data-stop-key="${esc(r.key)}" ${r.attrs}>${r.html}</button>`).join("");
}

function renderStopMenu(s) {
  const live = stopMenuRows(s);
  if (stopMenuShown && $("stopWrap").classList.contains("open")) {
    const byKey = new Map(live.map((r) => [r.key, r]));
    // Order and membership are frozen. Only the label of a row already on
    // screen may change, and a row whose work ended is marked, never dropped.
    stopMenuShown = stopMenuShown.map((row) => {
      const next = byKey.get(row.key);
      return next ? { ...next, gone: false } : { ...row, gone: true };
    });
  } else {
    stopMenuShown = live;
  }
  const html = stopMenuHTML(stopMenuShown);
  const menu = $("stopMenu");
  // Most status events change nothing here. Writing innerHTML anyway restarted
  // hover and could interrupt a click already in flight.
  if (menu.dataset.sig === html) return;
  menu.dataset.sig = html;
  menu.innerHTML = html;
}

function closeStopMenu() {
  $("stopWrap").classList.remove("open");
  $("stopMore").setAttribute("aria-expanded", "false");
  stopMenuShown = null; // the snapshot dies with the menu
}
function openStopMenu() {
  stopMenuShown = null; // every open takes a fresh snapshot
  $("stopWrap").classList.add("open");
  $("stopMore").setAttribute("aria-expanded", "true");
  if (state.summary) renderStopMenu(state.summary);
  focusMenu($("stopMenu"));
}
function toggleStopMenu() {
  if ($("stopWrap").classList.contains("open")) closeStopMenu();
  else openStopMenu();
}

function updateBusyUI() {
  const summary = state.summary;
  const active = summary ? summary.busy : [];
  // Queued-but-idle counts: the queue is work the user asked for, and the menu
  // is where they cancel it without touching anything that is running.
  const visible = !!summary &&
    (active.length > 0 || summary.working || (summary.queued || 0) > 0 || !!summary.queuePaused);
  const wrap = $("stopWrap");
  wrap.style.display = visible ? "flex" : "none"; // sending stays allowed — messages queue
  if (!visible) { closeStopMenu(); return; }
  const choose = stopIsChoice(summary);
  // Say what the primary click will actually do. A run-pinned `active` stop
  // ends the chain the reply would have continued into, which is the part the
  // user cares about and the part a seat-scoped stop deliberately does not do.
  $("stopBtn").title = choose ? "Choose what to stop" :
    active.length === 1
      ? `Stop ${seatLabel(active[0])} and the follow-ups this reply would trigger`
      : "Stop the exchange";
  renderStopMenu(summary);
}

// ---- queued work ----
function setQueue(n, items, dispatches, paused) {
  if (items) state.queue = items;
  if (state.summary) {
    state.summary.queued = n;
    if (dispatches !== undefined) state.summary.queuedDispatches = dispatches;
    if (paused !== undefined) state.summary.queuePaused = !!paused;
  }
  const held = !!(state.summary && state.summary.queuePaused);
  const shown = dispatches === undefined ? n : dispatches;
  const b = $("queueBadge");
  // An armed pause is never invisible: it survives an empty queue on purpose,
  // so the badge has to stay and say so, or the next message the user sends
  // would be held with nothing on screen explaining why.
  b.style.display = (n > 0 || held) ? "inline-flex" : "none";
  b.textContent = held ? (n > 0 ? `⏸ ${shown} held` : "⏸ queue paused") : `⏳ ${shown} queued`;
  b.title = held
    ? "The queue is paused — nothing new starts until you resume it"
    : "See what's waiting";
  if (n <= 0 && !held) closeQueuePop();
  else if ($("queueWrap").classList.contains("open")) renderQueuePop();
  // The Stop menu offers "cancel the queue" and counts what it would drop, so
  // it goes stale the moment the queue moves — including when the queue drains
  // on its own, with no status or summary event behind it.
  updateBusyUI();
}
function closeQueuePop() {
  const wrap = $("queueWrap");
  if (!wrap.classList.contains("open")) return;
  wrap.classList.remove("open");
  $("queueBadge").setAttribute("aria-expanded", "false");
}
// One card per dispatch, never per source message: a message that produced a
// second batch owes two independent things, and a single ✕ over both would
// cancel more than the user pointed at. Repeat dispatches from one message
// therefore render as sibling cards with the same snippet.
function queueGroups() {
  const groups = [], byKey = new Map();
  for (const item of state.queue || []) {
    const key = item.queueGroupId || `seq:${item.seq}`;
    let g = byKey.get(key);
    if (!g) {
      g = {
        key, groupId: item.queueGroupId, sourceN: item.sourceN,
        text: item.text, ts: item.ts, target: item.target, head: false, rows: [],
      };
      byKey.set(key, g);
      groups.push(g);
    }
    // Otherwise a redirect appears above work the user sent earlier with
    // nothing on the card explaining why.
    g.head = g.head || !!item.head;
    for (const a of item.agents) {
      g.rows.push({ agent: a, pos: (item.positions || {})[a] || 0, kind: item.kind });
    }
  }
  return groups;
}
function queueCardHTML(g) {
  // Whatever this dispatch's source already has running belongs on the same
  // card — the point of the view is the whole life of one thing you sent.
  // Match on the dispatch, not the source message: two dispatches from one
  // message share a rootN, and matching on that would let both cards claim the
  // same running seat. Older runs without an id simply do not match.
  const running = ((state.summary && state.summary.busyInfo) || [])
    .filter((b) => !!g.groupId && b.queueGroupId === g.groupId);
  const runRows = running.map((b) =>
    `<span class="qp-row running"><i class="bs-dot" style="background:${esc(seatColor(b.agent))}"></i>` +
    `${esc(seatLabel(b.agent))} ${esc(RUNNING_VERB[b.phase] || "responding")}</span>`);
  // Position survives a hold — that is exactly what pause preserves — so the
  // "#3" suffix stays in both wordings.
  const held = !!(state.summary && state.summary.queuePaused);
  const waitRows = g.rows.map((r) =>
    `<span class="qp-row"><i class="bs-dot" style="background:${esc(seatColor(r.agent))}"></i>` +
    `${esc(seatLabel(r.agent))} ${r.kind === "cycle"
      ? (held ? "pair cycle held" : "pair cycle queued")
      : (held ? "held" : "queued")}` +
    `${r.pos ? ` #${r.pos}` : ""}</span>`);
  const meta = [g.head ? "↪ next" : "", hhmm(g.ts), g.target ? `@${g.target}` : ""]
    .filter(Boolean).join(" · ");
  return `<div class="qp-card${held ? " paused" : ""}">` +
    `<div class="qp-top">` +
    `<button class="qp-src"${g.sourceN === null || g.sourceN === undefined ? "" : ` data-jump-n="${esc(String(g.sourceN))}"`} title="Jump to this message">` +
    `<span class="qp-snip">${esc(g.text || "(no text)")}</span><span class="qp-meta">${esc(meta)}</span></button>` +
    (g.groupId ? `<button class="qp-x" data-cancel-group="${esc(g.groupId)}" ` +
      `title="Discard everything this message still has waiting — anything already running continues">✕</button>` : "") +
    `</div><div class="qp-rows">${runRows.join("")}${waitRows.join("")}</div></div>`;
}
function renderQueuePop() {
  const groups = queueGroups();
  const held = !!(state.summary && state.summary.queuePaused);
  const head = `<div class="qp-head"><span>${held ? "Held by you" : "Queued work"}</span>` +
    `<span class="qp-actions">` +
    `<button class="qp-pause" data-queue-pause="${held ? "0" : "1"}" title="${held
      ? "Start delivering queued work again, in order"
      : "Hold everything still waiting; running responses finish and nothing is lost"}">` +
    `${held ? "▶ Resume" : "⏸ Pause"}</button>` +
    (groups.length
      ? `<button data-cancel-group="" title="Discard everything still waiting; running responses continue">Discard all queued</button>`
      : "") +
    `</span></div>`;
  $("queuePop").innerHTML = head + (groups.length
    ? groups.map(queueCardHTML).join("")
    : `<div class="qp-empty">${held
      ? "Nothing is waiting — anything you send now is held."
      : "Nothing is waiting."}</div>`);
}
$("queueBadge").onclick = (e) => {
  e.stopPropagation();
  const wrap = $("queueWrap");
  const open = !wrap.classList.contains("open");
  wrap.classList.toggle("open", open);
  $("queueBadge").setAttribute("aria-expanded", String(open));
  if (open) renderQueuePop();
};
$("queuePop").addEventListener("click", async (e) => {
  const hold = e.target.closest("[data-queue-pause]");
  if (hold) return setQueuePaused(hold.dataset.queuePause === "1");
  const btn = e.target.closest("[data-cancel-group]");
  if (!btn) return;
  const groupId = btn.dataset.cancelGroup;
  try {
    const r = await api("/api/queue/cancel", { room: state.room, ...(groupId ? { groupId } : {}) });
    // Already drained is not a failure: what the user asked to be gone is gone.
    toast(r.cancelled ? `Discarded ${r.cancelled} queued deliver${r.cancelled === 1 ? "y" : "ies"}.`
      : "That was already out of the queue.");
  } catch (err) { toast(err.message, true); }
});
function guessTextTarget(raw) {
  const text = String(raw || "").trim();
  if (!text || !state.summary) return null;
  const seats = state.summary.seats;
  // Mirror server textTarget exactly. User text routing is intentionally
  // separate from the masked agent-mention grammar used for automatic calls.
  const alt = seats.map((s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const tags = new Set([...text.matchAll(new RegExp(`@(${alt}|both|all)(?![a-z0-9-])`, "gi"))].map((m) => m[1].toLowerCase()));
  if (tags.has("both") || tags.has("all") || seats.every((s) => tags.has(s))) return "both";
  const lead = new RegExp(`^[*_~]*@(${alt})(?![a-z0-9-])[*_~]*[\\s:,]*`, "i").exec(text);
  if (lead) return lead[1].toLowerCase();
  for (const s of seats) if (tags.has(s)) return s;
  return null;
}
function seatAsleep(a) {
  const s = state.summary;
  return !!(s && s.agents && s.agents[a] && s.agents[a].asleep);
}
// The send succeeds either way now — this says *when* the answer arrives, so
// the user is not left waiting on a seat that will not reply until it is woken.
function sleepHint(targets) {
  const dozing = targets.filter(seatAsleep);
  if (!dozing.length) return "";
  if (dozing.length === targets.length) return ` · 😴 ${dozing.join(" + ")} asleep — held until wake`;
  return ` · 😴 held for ${dozing.join(" + ")} until wake`;
}
function normalizedHopBudget(value, fallback = -1) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < -1) return fallback;
  return n;
}
function roomHopBudget() {
  return normalizedHopBudget(state.summary && state.summary.cfg && state.summary.cfg.hopBudget, -1);
}
function hopSafetyLimit() {
  const value = state.summary && state.summary.hopSafetyLimit;
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}
function automaticAccounting() { return state.summary?.cfg?.accounting === "automatic"; }
function accountingLabel() { return automaticAccounting() ? "Automatic turns" : "Extra exchanges"; }
function hopBudgetLabel(value) { return Number(value) === -1 ? "Until settled" : String(value); }
function effectiveHopLimit(budget, limit) {
  if (Number.isSafeInteger(limit) && limit >= 0) return limit;
  const safety = hopSafetyLimit();
  return budget < 0 ? safety : budget;
}
function hopBudgetDetail(value) {
  const budget = normalizedHopBudget(value, -1);
  if (automaticAccounting()) return budget < 0 ? `safety max ${hopSafetyLimit() ?? "unknown"} automatic turns per message`
    : `up to ${budget} additional automatic agent turns; initial requested responses do not count`;
  const safety = hopSafetyLimit();
  if (budget === -1) return safety === null ? "server safety limit unavailable" : `safety max ${safety} continuations per message`;
  if (budget === 0) return "no extra continuations; included sibling delivery and answer returns may still complete";
  const effective = effectiveHopLimit(budget);
  return `up to ${effective} extra continuation${effective === 1 ? "" : "s"}` +
    (effective < budget ? ` (configured ${budget}; server safety max ${effective})` : "");
}
function draftRoute() {
  const s = state.summary;
  if (!s) return null;
  const raw = $("input").value.trim();
  const explicit = guessTextTarget(raw);
  if (/^\/pair\b/i.test(raw)) return { pair: true, command: true };
  if (raw.startsWith("/")) return { command: true };
  if (s.pair && !explicit) return { pair: true, ...s.pair };
  let target = explicit || (state.chip !== "auto" ? state.chip : (s.lastAddressed || s.cfg.defaultAgent));
  if (target !== "both" && !s.cfg.agents[target]) target = s.seats[0];
  const targets = target === "both" ? s.seats : [target];
  const enabledListeners = s.seats.filter((a) => !targets.includes(a) && !seatAsleep(a) && s.cfg.agents[a].lurk);
  const listeners = enabledListeners.filter((a) => s.agents[a].liveLurkEligible === true);
  const listenerEligibilityKnown = enabledListeners.every((a) => typeof s.agents[a].liveLurkEligible === "boolean");
  return { target, targets, listeners, listenerEligibilityKnown };
}
function freshTurnEstimate(choice, route = draftRoute()) {
  if (!route || route.command || route.pair) return null;
  if (choice === "solo") return route.target === "both" ? null : 1;
  if (route.target !== "both" && route.listenerEligibilityKnown === false) return null;
  const budget = choice === "default" ? roomHopBudget() : normalizedHopBudget(choice);
  const limit = effectiveHopLimit(budget);
  if (limit === null) return null;
  if (automaticAccounting()) return (route.target === "both" ? 2 : 1) + limit;
  return (route.target === "both" ? 5 : route.listeners.length ? 4 : 1) + 2 * limit;
}
function renderHopProjections() {
  const route = draftRoute();
  document.querySelectorAll("#hopMenu [data-hop-choice]").forEach((option) => {
    const choice = option.dataset.hopChoice;
    const estimate = freshTurnEstimate(choice, route);
    const budget = choice === "default" ? roomHopBudget() : normalizedHopBudget(choice);
    const detail = choice === "solo" ? "One selected responder; no automatic peer response."
      : `${hopBudgetLabel(budget)}: ${hopBudgetDetail(budget)}.`;
    option.setAttribute("aria-label", choice === "solo" ? "Solo" : `${accountingLabel()}: ${detail}`);
    option.title = detail + (estimate === null ? " Pair rounds or command rules apply; no estimate."
      : ` Fresh isolated message estimate: up to ${estimate} agent turns. ` + (automaticAccounting()
        ? "Every automatic start counts, including failures and silence. No complete round is guaranteed."
        : "Included sibling delivery and answer returns are uncharged."));
    if (choice === "default") {
      $("hopRoomDefault").textContent = `Currently ${hopBudgetLabel(budget)} — ${hopBudgetDetail(budget)}` +
        (estimate === null ? " · no estimate" : ` · up to ${estimate} agent turn${estimate === 1 ? "" : "s"}`);
    } else if (choice === "solo") {
      const note = option.querySelector(".hm-sub");
      if (note) note.textContent = "One selected seat responds; the other cannot lurk or react. " +
        (estimate === null ? "Choose one ordinary addressee." : "Fresh isolated message: 1 agent turn.");
    } else {
      option.innerHTML = `<b>${esc(hopBudgetLabel(choice))}</b><span class="hm-sub">` +
        (Number(choice) < 0 ? `${hopSafetyLimit() === null ? "Safety max unavailable" : `Safety max ${hopSafetyLimit()}`} · ` : "") +
        `${estimate === null ? "No estimate" : `up to ${estimate} turn${estimate === 1 ? "" : "s"}`}</span>`;
    }
  });
  const estimate = freshTurnEstimate(state.hopChoice, route);
  $("hopProjection").textContent = route && route.pair ? "Pair uses review rounds; this continuation control does not govern its cycle."
    : estimate === null ? "An estimate is unavailable for this draft or until the server supplies its safety limit."
      : `Fresh isolated message estimate: up to ${estimate} agent turns. Shared or delayed catch-up can cover several messages, so this is not lifetime spend or a remaining-turn guarantee.`;
}
function pairControlOnly(raw, hasAttachments = false) {
  if (hasAttachments) return false;
  const text = String(raw || "").trim();
  if (!/^\/pair\b/i.test(text)) return false;
  if (/^\/pair\s+(?:end|stop|off)\b/i.test(text)) return true;
  let body = text.replace(/^\/pair\b\s*/i, "").replace(/^start\b\s*/i, "");
  // Match parsePair(): a rounds token must end at whitespace or end-of-input,
  // never at `@`; `start3` likewise remains task text.
  body = body.replace(/^\d{1,2}(?:\s+|$)/, "").trim();
  const target = guessTextTarget(body);
  if (target && target !== "both") {
    // Mirror textTarget's leading-tag grammar, including Markdown emphasis.
    body = body.replace(new RegExp(`^[*_~]*@${target}\\b[*_~]*[\\s:,]*`, "i"), "").trim();
  }
  return !body;
}
function soloTargetProblem(raw, hasAttachments = false) {
  if (state.hopChoice !== "solo" || !state.summary) return "";
  const text = String(raw || "").trim();
  if (/^\/pair\b/i.test(text) && !pairControlOnly(text, hasAttachments)) {
    return "Solo cannot start or run a pair cycle — choose Room or a continuation budget.";
  }
  const explicit = guessTextTarget(text);
  if (explicit === "both") return "Solo needs one target — tag only one seat, not @all or multiple agents.";
  if (state.summary.pair && !explicit && !text.startsWith("/")) {
    return "Solo needs one explicit @seat while pair mode is on.";
  }
  const target = explicit
    || (state.chip !== "auto" ? state.chip : (state.summary.lastAddressed || state.summary.cfg.defaultAgent));
  return target === "both" ? "Solo needs one target — choose a single seat." : "";
}
function closeHopMenu() {
  const wrap = $("hopWrap");
  if (!wrap) return;
  wrap.classList.remove("open");
  $("hopBtn").setAttribute("aria-expanded", "false");
}
function openHopMenu() {
  const wrap = $("hopWrap"), btn = $("hopBtn"), menu = $("hopMenu");
  wrap.classList.add("open");
  btn.setAttribute("aria-expanded", "true");
  const r = btn.getBoundingClientRect();
  const w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
  menu.style.top = `${Math.max(8, r.top - h - 7)}px`;
}
function renderHopControl() {
  const explicitTarget = guessTextTarget(input.value);
  const convergenceComposer = (explicitTarget === "both" || (!explicitTarget && !state.summary?.pair && state.chip === "both")) && (state.summary?.seats?.length || 0) > 1 && state.discussionMode === "converge";
  $("hopWrap").hidden = convergenceComposer;
  if (convergenceComposer) {
    $("hopProgress").hidden = true;
    return;
  }
  $("hopAccountingNote").textContent = "Remembered for this room and browser session. " +
    (automaticAccounting() ? "Every automatic start counts; initial requested responses do not. No answer return is free. "
      : "This room retains its previous accounting: a counted request can include a free answer return. Switch to Automatic turns in Settings for one unit per automatic start. ") +
    "This is not a token or cost limit.";
  const roomBudget = roomHopBudget();
  const choice = state.hopChoice;
  const btn = $("hopBtn");
  const shown = choice === "default"
    ? `Room (${hopBudgetLabel(roomBudget)})`
    : choice === "solo" ? "Solo" : hopBudgetLabel(choice);
  $("hopBtnLabel").textContent = choice === "solo" ? "◎ Solo · override" : `${accountingLabel()}: ${shown}${choice !== "default" ? " · override" : ""}`;
  btn.classList.toggle("override", choice !== "default");
  btn.title = choice === "solo"
    ? "Solo stays selected for this room and browser session: only one selected seat responds. The other seat cannot lurk or react, but can read the transcript on a later turn."
    : choice === "default"
      ? `Room default (${hopBudgetLabel(roomBudget)}): ${hopBudgetDetail(roomBudget)}.`
      : `Selected for this room and browser session (${hopBudgetLabel(choice)}): ${hopBudgetDetail(choice)}.`;
  $("hopRoomDefault").textContent = `Currently ${hopBudgetLabel(roomBudget)} — ${hopBudgetDetail(roomBudget)}`;
  $("hopOverrideNote").textContent = choice === "default" ? `Using room default: ${hopBudgetLabel(roomBudget)}`
    : `Message override: ${choice === "solo" ? "Solo" : hopBudgetLabel(choice)} · Room default: ${hopBudgetLabel(roomBudget)}`;
  document.querySelectorAll("#hopMenu [data-hop-choice]").forEach((option) => {
    option.setAttribute("aria-checked", String(option.dataset.hopChoice === choice));
  });

  const both = document.querySelector('.chip[data-t="both"]');
  if (both) {
    both.disabled = choice === "solo";
    both.title = choice === "solo"
      ? "Solo requires one selected agent. Other agents will not react, but can read the message in the transcript later."
      : `Send to all ${state.summary && state.summary.seats ? state.summary.seats.length : 2} agents`;
  }

  // Solo cannot inherit @both. Fall back to Auto—not a particular seat—so
  // Parley keeps its normal routing rule instead of quietly choosing the first
  // provider in the list. Explicit @both text remains intact and is blocked at
  // Send; only the selected routing chip changes here.
  if (choice === "solo" && state.chip === "both") {
    state.chipRevision++;
    selectChip("auto");
  }

  const runs = state.summary && Array.isArray(state.summary.hopRuns) ? state.summary.hopRuns : [];
  const run = runs.length ? runs[runs.length - 1] : null;
  const progress = $("hopProgress");
  if (!run) {
    progress.hidden = true;
    progress.classList.remove("capped");
    progress.textContent = "";
  } else {
    const used = Math.max(0, Number(run.used) || 0);
    const budget = normalizedHopBudget(run.budget, -1);
    const capped = run.phase === "capped" || run.phase === "safety";
    const capNote = capped ? (run.phase === "safety" || budget === -1 ? " · safety stop" : " · capped") : "";
    progress.hidden = false;
    progress.classList.toggle("capped", capped);
    const limit = effectiveHopLimit(budget, run.limit);
    const source = policySourceLabel(run.source);
    const safety = budget < 0 || (limit !== null && limit < budget);
    progress.textContent = `${run.accounting === "automatic" ? "Automatic turns" : "Extra exchanges"} ${used}/${limit === null ? "?" : limit}${safety ? " · safety" : ""}${capNote}`;
    progress.title = `This exchange${run.rootN == null ? "" : ` (message ${run.rootN})`} started with ` +
      `${budget === -1 ? "the until-settled policy (with a safety stop)" : `a limit of ${budget}`} ` +
      `from ${source} and has launched ${used} ${run.accounting === "automatic" ? "automatic turn" : "charged continuation"}${used === 1 ? "" : "s"}` +
      (capped ? (budget === -1 ? " and reached the safety stop" : " and reached its limit") : "") +
      ". Changing the composer shortcut affects later messages, not this running exchange.";
  }
  renderHopProjections();
}
function selectHopChoice(choice) {
  const normalized = choice === "default" || choice === "solo"
    ? choice : String(normalizedHopBudget(choice, -1));
  state.hopChoice = normalized;
  rememberHopChoice(state.room, normalized);
  closeHopMenu();
  renderHopControl();
  updateRouteHint();
}
$("hopBtn").onclick = () => {
  if ($("hopWrap").classList.contains("open")) closeHopMenu();
  else openHopMenu();
};
$("hopMenu").addEventListener("click", (e) => {
  const option = e.target.closest("[data-hop-choice]");
  if (!option) return;
  selectHopChoice(option.dataset.hopChoice);
  input.focus();
});
window.addEventListener("resize", closeHopMenu);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeHopMenu(); });
function updateRouteHint() {
  if (!state.summary) return;
  renderHopProjections();
  renderHopControl();
  const raw = $("input").value;
  const explicit = guessTextTarget(raw);
  const pair = state.summary.pair;
  const soloProblem = soloTargetProblem(raw, !!(state.draftImages.length || state.draftFiles.length));
  const soloPairCommand = !!soloProblem && /^\/pair\b/i.test(raw.trim()) &&
    !/^\/pair\s+(?:end|stop|off)\b/i.test(raw.trim());
  $("routeHint").classList.toggle("warn", !!soloProblem);
  if (explicit === "both" || (!pair && !explicit && state.chip === "both")) {
    const n = state.summary.seats.length;
    if (n === 1) { $("routeHint").textContent = `→ ${seatLabel(state.summary.seats[0])} · single-agent response`; return; }
    const mode = state.discussionMode === "parallel" ? "parallel replies" : `one agreed handoff · ${state.convergenceRounds} review round${state.convergenceRounds === 1 ? "" : "s"}`;
    $("routeHint").textContent = `→ all ${n} agents · ${mode}`;
    return;
  }
  if (pair && !explicit && !raw.trim().startsWith("/")) {
    const dozing = [pair.worker, pair.reviewer].filter(seatAsleep);
    $("routeHint").textContent = `→ ${seatLabel(pair.worker)} · 🔁 ${seatLabel(pair.reviewer)} reviews · ${pairRoundsLabel(pair.rounds)}` +
      (soloProblem ? " · ⚠ Solo needs one explicit @seat" :
        dozing.length ? ` · 😴 ${dozing.join(" + ")} asleep — pair needs both` : "");
    return;
  }
  const t = explicit
    || (state.chip !== "auto" ? state.chip : (state.summary.lastAddressed || state.summary.cfg.defaultAgent));
  const selectedBudget = state.hopChoice === "default" ? roomHopBudget() : normalizedHopBudget(state.hopChoice);
  const liveListeners = state.summary.seats.filter((a) => a !== t && t !== "both" && !seatAsleep(a) && state.summary.cfg.agents[a].lurk);
  const otherCount = t === "both" ? 0 : state.summary.seats.filter((a) => a !== t).length;
  const behavior = state.hopChoice === "solo" ? "Solo"
    : t === "both" ? ((state.summary.cfg.mode || "talk") === "work" ? "discussion (no edits)" : "discussion")
      : liveListeners.length ? `${liveListeners.map(seatLabel).join(" + ")} may listen and respond`
        : otherCount === 0 ? "no other agents"
          : effectiveHopLimit(selectedBudget) === 0 ? "no extra peer response"
            : `${otherCount} other agent${otherCount === 1 ? "" : "s"} may respond if called`;
  const disc = ` · ${behavior}` + (state.hopChoice === "solo" ? "" : ` · ${selectedBudget === -1 ? hopBudgetDetail(selectedBudget) : `${effectiveHopLimit(selectedBudget)} ${accountingLabel().toLowerCase()}`}`);
  const targets = t === "both" ? state.summary.seats : [t];
  $("routeHint").textContent = "→ " + (t === "both" ? state.summary.seats.map(seatLabel).join(" + ") : seatLabel(t)) +
    disc + (soloProblem
      ? (soloPairCommand ? " · ⚠ Solo can't run pair mode" : " · ⚠ Solo needs one seat")
      : sleepHint(targets));
}
function selectChip(target) {
  if (state.hopChoice === "solo" && String(target) === "both") return false;
  const chips = [...document.querySelectorAll(".chip")];
  const chip = chips.find((candidate) => candidate.dataset.t === String(target));
  // Large rosters keep individual targets in the picker instead of rendering
  // a chip for every seat. Selection still updates routing and the visible
  // picker label when the target has no standalone chip.
  if (!chip && !((state.summary?.seats || []).includes(String(target)))) return false;
  state.chip = String(target);
  chips.forEach((x) => x.classList.toggle("active", x === chip));
  renderAgentOptions(state.summary || { seats: [] });
  renderDiscussionMode();
  renderHopControl();
  updateRouteHint();
  return true;
}
$("pairEndBtn").onclick = async () => {
  try { await api("/api/message", { room: state.room, text: "/pair end", target: "auto" }); }
  catch (e) { toast(e.message, true); }
};

// ------------------------------------------------------------ SSE
function followRoomRename(from, to) {
  if (state.room !== from && state.room !== to) return false;
  const changed = state.room !== to;
  state.room = to;
  if (changed) state.eventVersion++;
  if (state.summary) state.summary.name = to;
  $("roomTitle").textContent = to;
  history.replaceState(null, "", to === "default" ? location.pathname : "?room=" + encodeURIComponent(to));

  let streamRoom = null;
  try { streamRoom = state.es ? new URL(state.es.url, location.href).searchParams.get("room") : null; }
  catch { /* an absent or malformed stream URL is simply reconnected below */ }
  if (streamRoom !== to) {
    state.resyncVersion++;
    connect(true);
  }
  return true;
}

function connect(resyncOnOpen = false) {
  if (state.es) {
    const old = state.es;
    state.es = null;
    old.close();
  }
  const es = new EventSource(withToken("/api/events?room=" + encodeURIComponent(state.room)));
  state.es = es;
  let wasDown = false;
  let needsResync = resyncOnOpen;
  es.onopen = () => {
    if (state.es !== es) return;
    $("connDot").classList.add("on");
    // Entries can land while the stream is down; re-pull rather than silently
    // showing a transcript with a hole in it.
    if (wasDown || needsResync) {
      wasDown = false;
      needsResync = false;
      refreshAfterGap();
    }
  };
  es.onerror = () => {
    if (state.es !== es) return;
    wasDown = true;
    $("connDot").classList.remove("on");
  };
  es.onmessage = (ev) => {
    if (state.es !== es) return;
    const msg = JSON.parse(ev.data);
    state.eventVersion++;
    if (msg.type === "entry") addEntry(msg.entry);
    else if (msg.type === "receipt") addReceipt(msg.receipt);
    else if (msg.type === "queue") {
      setQueue(msg.size, msg.items, msg.dispatches, msg.paused);
    }
    else if (msg.type === "lurk") whisper(msg.agent, msg.error, msg.hop, msg.skipped, msg.asleep, msg.held, msg.queued, msg.attention);
    else if (msg.type === "status") {
      state.statusSeq[msg.agent] = (state.statusSeq[msg.agent] || 0) + 1;
      if (state.summary) { // keep busy state truthful between room summaries
        const b = state.summary.busy || [];
        if (msg.phase === "done") state.summary.busy = b.filter((x) => x !== msg.agent);
        else if (!b.includes(msg.agent)) b.push(msg.agent);
        // busyInfo tracks the same set with the provenance attached, so it has
        // to move in step or the quote header outlives the run it describes.
        const info = (state.summary.busyInfo || []).filter((x) => x.agent !== msg.agent);
        if (msg.phase !== "done") {
          info.push({
            agent: msg.agent, runId: msg.runId || null, phase: msg.phase,
            startedAt: msg.startedAt,
            rootN: msg.rootN === undefined ? null : msg.rootN,
            sourceN: msg.sourceN === undefined ? null : msg.sourceN,
            // Without this a delayed delivery could not show as "responding"
            // on its own queue card until the next full room summary.
            queueGroupId: msg.queueGroupId || null,
            source: msg.source || null,
            deliveryKind: msg.deliveryKind || null,
            delivery: msg.delivery || null,
            relayLaunch: msg.relayLaunch || null,
            catchUp: msg.catchUp || null,
          });
        }
        state.summary.busyInfo = info;
        const pill = $("pill_" + msg.agent);
        if (pill) pill.classList.toggle("busy", state.summary.busy.includes(msg.agent));
        updateBusyUI();
      }
      if (msg.phase === "retrying") {
        const l = ensureLive(msg.agent, msg.startedAt);
        l.el.querySelector(".live-label").innerHTML = `is restoring its session <span class="elapsed">${elapsedLabel(l)}</span>`;
        // The stream flush only rewrites the label on the think→stream
        // transition now, so reset the mode or the retry label would stick
        // through the restored session's whole streamed reply.
        l.mode = "think";
      } else if (msg.phase === "done") removeLive(msg.agent);
      else ensureLive(msg.agent, msg.startedAt, liveLabelFor(msg.phase));
      applyLiveRef(msg.agent);
      renderBusyStrip();
      if ($("queueWrap").classList.contains("open")) renderQueuePop();
    }
    else if (msg.type === "stream") liveStream(msg.agent, msg);
    else if (msg.type === "room") {
      applySummary(msg.room);
    }
    else if (msg.type === "reset") {
      state.resyncVersion++;
      clearDraftAttachments();
      clearAttachmentUrls();
      clearLive();
      state.entries = [];
      state.receipts = [];
      state.queue = [];
      state.liveVisible = {};
      closeQueuePop();
      state.renderFromN = null;
      state.expandedMessages.clear();
      state.expandedActivity.clear();
      renderAll({ preserveTransient: false });
      toast("Fresh conversation — previous one archived.");
    }
    else if (msg.type === "renamed") {
      // The live stream survives the rename (it's held on the room object),
      // but its URL still carries the old name — so reconnect, or the next
      // dropout would reconnect to a name that no longer exists.
      followRoomRename(msg.from, msg.to);
      refreshRooms().catch((e) => toast(e.message, true));
    }
  };
}

// ------------------------------------------------------------ load room
// What a first run needs to know before anything is spent. An unauthenticated
// CLI used to surface as an opaque exit code on the first real message, which is
// the worst possible moment to find out.
async function refreshDoctor(roomName) {
  try {
    const d = await api("/api/doctor?room=" + encodeURIComponent(roomName));
    if (state.room !== roomName) return;
    state.doctor = d.seats || {};
    const bad = Object.entries(state.doctor).filter(([, h]) => !h.ok);
    const banner = $("setupBanner");
    if (!bad.length) { banner.style.display = "none"; return; }
    banner.innerHTML = bad.map(([seat, h]) =>
      `<div><b>${esc(seatLabel(seat))} isn't ready</b> — ${esc(h.detail)}. ${esc(h.how)}</div>`).join("");
    banner.style.display = "block";
    if (state.summary) applySummary(state.summary); // repaint the pills
  } catch { /* the room still works; the pills carry what they know */ }
}

async function loadRoom(name) {
  retireSettingsPick(); // a folder dialog open for the old room must not land here
  let data;
  try {
    data = await api("/api/room?name=" + encodeURIComponent(name));
  } catch (e) {
    const rooms = await api("/api/rooms");
    const fallback = (rooms.rooms || []).find((room) => (room.name || room) !== name);
    if (fallback) return loadRoom(fallback.name || fallback);
    showNoRoom(); await refreshRooms(); return;
  }
  if (state.es) {
    const old = state.es;
    state.es = null;
    old.close();
  }
  $("connDot").classList.remove("on");
  clearDraftAttachments();
  clearAttachmentUrls();
  state.resyncVersion++;
  state.eventVersion++;
  const roomName = data.room.name || name;
  if (roomName !== state.room) {
    closeHopMenu();
    state.hopChoice = storedHopChoice(roomName);
    state.discussionMode = "converge";
    state.convergenceRounds = 2;
    loadDiscussionPrefs(roomName);
  }
  state.room = roomName;
  for (const id of ["openWs", "openRoomDir", "dlTranscript", "gitId"]) $(id).hidden = false;
  $("composerWrap").hidden = false; $("modeToggle").hidden = false; $("settingsBtn").hidden = false; $("convergencePanel").style.display = "";
  refreshDoctor(roomName);
  history.replaceState(null, "", roomName === "default" ? location.pathname : "?room=" + encodeURIComponent(roomName));
  // Keep an explicit destination if it exists in the destination room. Only a
  // genuinely stale seat id falls back to automatic routing.
  const validChips = new Set(["auto", "both", ...(data.room.seats || [])]);
  if (!validChips.has(state.chip)) state.chip = "auto";
  clearLive();
  closeQueuePop();
  state.entries = data.entries;
  state.receipts = data.receipts || [];
  state.queue = data.room.queue || [];
  state.liveVisible = {};
  state.expandedMessages.clear();
  state.expandedActivity.clear();
  state.renderFromN = state.entries.length > INITIAL_ENTRY_LIMIT
    ? state.entries[state.entries.length - INITIAL_ENTRY_LIMIT].n
    : null;
  // Entry rendering (avatars and receipt dots) needs the destination room's
  // provider catalog and seats, not the room we just left.
  state.summary = data.room;
  state.providers = data.room.providers || state.providers;
  renderAll({ preserveTransient: false });
  applySummary(data.room);
  // Opening a room can itself resume a persisted lurk catch-up. Re-pull once
  // the event stream is attached so an unusually fast catch-up cannot finish
  // in the GET→SSE gap and leave this tab with a stale entry/receipt snapshot.
  connect(true);
  await refreshRooms();
}

// After the event stream was down, pull the room again so anything that
// happened during the gap appears without a manual refresh.
async function refreshAfterGap() {
  const room = state.room;
  const eventVersion = state.eventVersion;
  const resyncVersion = ++state.resyncVersion;
  const seqBefore = { ...state.statusSeq };
  try {
    const data = await api("/api/room?name=" + encodeURIComponent(room));
    if (state.room !== room || state.resyncVersion !== resyncVersion) return;
    // The stream is already live while this fetch is in flight. Merge by turn
    // number (live state wins on duplicates) so its arrivals cannot be lost.
    state.entries = mergeEntries(data.entries, state.entries);
    state.receipts = mergeReceipts(data.receipts, state.receipts);
    renderAll({ stickToBottom: nearBottom(), anchor: true });
    // A seat that finished during the outage: its reply is in the snapshot
    // but its "done" was never heard, so its live bubble would sit right
    // below its own finished reply — ticking "is replying · 4m32s" — until
    // the next room summary, which arrives when the OTHER seat finishes,
    // minutes later in a work turn. If no status event for that seat has
    // arrived since this fetch began, the snapshot is the freshest word on it.
    const busyNow = new Set(data.room.busy || []);
    let pruned = false;
    for (const a of Object.keys(state.live)) {
      if (busyNow.has(a) || (state.statusSeq[a] || 0) !== (seqBefore[a] || 0)) continue;
      removeLive(a);
      pruned = true;
      if (state.summary) {
        state.summary.busy = (state.summary.busy || []).filter((x) => x !== a);
        state.summary.busyInfo = (state.summary.busyInfo || []).filter((x) => x.agent !== a);
      }
      const pill = $("pill_" + a);
      if (pill) pill.classList.remove("busy");
    }
    if (pruned) updateBusyUI();
    // Any SSE message is newer live evidence: status, queue, stream, whisper,
    // entry, receipt, reset and rename alike. Never replace it with this fetch.
    if (state.eventVersion === eventVersion) applySummary(data.room);
  } catch { /* the room may have gone; loadRoom's own error path handles that */ }
}
async function refreshRooms() {
  const data = await api("/api/rooms");
  state.providers = data.providers || state.providers;
  fillSeatPickers();
  $("archivedCount").textContent = String((data.archivedRooms || []).length);
  $("archivedRoomList").replaceChildren();
  for (const room of data.archivedRooms || []) {
    const row = document.createElement("div"); row.className = "archived-room-row";
    const name = document.createElement("span"); name.textContent = room.name;
    const restore = document.createElement("button"); restore.className = "ract"; restore.textContent = "Restore";
    restore.onclick = async () => {
      try { const restored = await api("/api/room/restore", {archiveId: room.archiveId}); await loadRoom(restored.name); }
      catch (error) { toast(error.message, true); }
    };
    row.append(name, restore); $("archivedRoomList").append(row);
  }
  const list = $("roomList");
  list.innerHTML = "";
  for (const r of data.rooms) {
    const name = typeof r === "string" ? r : r.name;
    const mode = typeof r === "string" ? "talk" : r.mode;
    const linked = typeof r === "string" ? false : r.linked;
    const seats = (typeof r === "string" ? null : r.seats) || [];
    const nonDefault = seats.length && seats.join(",") !== "claude,codex";
    // The listing carries each seat's provider, because a room in the sidebar
    // is not the open room and seatMeta has no summary to resolve against.
    const rowProviders = (typeof r === "string" ? null : r.providers) || {};
    const rowAvatar = (a) => {
      const p = state.providers[rowProviders[a] || a];
      return (p && p.avatar) || String(a)[0].toUpperCase();
    };
    const seatTag = nonDefault
      ? `<span style="font-size:10px;opacity:.7">${seats.map(rowAvatar).join("+")}</span>`
      : "";
    // A row, not one big button: the rename and delete controls have to be real
    // buttons to be reachable by keyboard, and nesting a button inside a button
    // is invalid — which is why they used to be unfocusable spans revealed only
    // on hover, leaving no keyboard path to either action.
    const row = document.createElement("div");
    row.className = "room-item" + (name === state.room ? " active" : "");
    row.innerHTML =
      `<button type="button" class="ropen"><span class="dot"></span>` +
      `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;text-align:left">${esc(name)}</span>` +
      `<span class="rmeta">${seatTag}${linked ? "📁" : ""}${mode === "work" ? "🔨" : ""}</span></button>` +
      `<span class="racts"><button type="button" class="ract" data-act="archive" title="Archive room" aria-label="Archive ${esc(name)}">▤</button><button type="button" class="ract" data-act="rename" title="Rename room" aria-label="Rename ${esc(name)}">✎</button>` +
      // the default room is the app's fallback; it can be emptied, not removed
      (name === "default" ? "" : `<button type="button" class="ract del" data-act="delete" title="Delete room" aria-label="Delete ${esc(name)}">✕</button>`) +
      `</span>`;
    row.onclick = (e) => {
      const act = e.target.closest(".ract");
      if (!act) { setNavOpen(false); return loadRoom(name); }
      e.stopPropagation();
      if (act.dataset.act === "rename") renameFlow(name); else if (act.dataset.act === "archive") archiveRoom(name); else deleteFlow(name);
    };
    list.appendChild(row);
  }
}
// New-room seat pickers: pre-filled with the default pair, visible so the
// choice is discoverable, never a required step.
function fillSeatPickers() {
  const ids = Object.keys(state.providers);
  if (!ids.length) return;
  for (const sel of [$("seat1"), $("seat2")]) {
    if (sel && !sel.options.length) sel.innerHTML = ids.map((p) => `<option value="${esc(p)}">${esc(state.providers[p].label)}</option>`).join("");
  }
  if (!newRoster.length) newRoster = [{ id: "claude", provider: ids.includes("claude") ? "claude" : ids[0] }, { id: "codex", provider: ids.includes("codex") ? "codex" : ids[Math.min(1, ids.length - 1)] }];
  renderRoster();
}

let newRoster = [];
let newRoomPreset = null;
function updateRoomPresetState() {
  const pair = newRoomPreset === "pair" && newRoster.length === 2;
  const team = newRoomPreset === "team" && newRoster.length === 4;
  $("twoAgentTemplate").setAttribute("aria-pressed", String(pair));
  $("fourAgentTemplate").setAttribute("aria-pressed", String(team));
  document.querySelector(".room-template > span").textContent = pair || team ? "Start with" : "Custom agents";
}
function renderRoster() {
  const list = $("rosterList"); if (!list) return;
  const ids = Object.keys(state.providers || {});
  updateRoomPresetState();
  $("rosterCount").textContent = `Your agents · ${newRoster.length}`;
  $("addSeatBtn").disabled = newRoster.length >= 4;

  list.innerHTML = newRoster.map((agent, i) => {
    const options = ids.map((p) => `<option value="${esc(p)}" ${p === agent.provider ? "selected" : ""}>${esc(state.providers[p].label || p)}</option>`).join("");
    const catalog = state.providers[agent.provider] || {};
    const effort = (catalog.fields || []).includes("effort");
    if (!effort) agent.effort = "";
    const suggestions = (values) => (values || []).map((v) => `<option value="${esc(typeof v === "string" ? v : v.value)}">${esc(typeof v === "string" ? v : v.label || v.value)}</option>`).join("");
    return `<article class="roster-row" data-roster-index="${i}" aria-label="Agent ${i + 1}">
      <div class="roster-main">
        <label class="roster-field">Name / @mention<input class="roster-name" ${i < 2 ? `id="seat${i + 1}Name"` : ""} value="${esc(agent.id || "agent" + (i + 1))}" maxlength="20" placeholder="e.g. privacy" aria-label="Agent ${i + 1} name" spellcheck="false"></label>
        <label class="roster-field">Provider<select class="roster-provider" ${i < 2 ? `id="seat${i + 1}"` : ""} aria-label="Agent ${i + 1} provider">${options}</select></label>
        <button type="button" class="ract roster-remove" title="Remove agent" aria-label="Remove agent ${i + 1}" ${newRoster.length === 1 ? "disabled" : ""}>×</button>
      </div>
      <div class="roster-advanced">
        ${seatFieldHTML(`new${i}`, "model", catalog)}
        ${effort ? seatFieldHTML(`new${i}`, "effort", catalog) : ""}
        ${agent.provider === "codex" ? `<label class="roster-field">Fast mode<select class="roster-fast" aria-label="Fast mode for agent ${i + 1}"><option value="default" ${agent.serviceTier !== "fast" ? "selected" : ""}>Off — standard</option><option value="fast" ${agent.serviceTier === "fast" ? "selected" : ""}>On — faster processing</option></select></label>` : ""}
        <label class="roster-field roster-wide">Identity &amp; instructions<textarea class="roster-instructions" rows="5" aria-label="Standing instructions for agent ${i + 1}" maxlength="8000" placeholder="A role, point of view, or rules to keep throughout the conversation…">${esc(agent.instructions || "")}</textarea></label>
      </div>
    </article>`;
  }).join("");
  compactFieldNotes(list);
  list.querySelectorAll(".roster-row").forEach((row) => {
    const i = Number(row.dataset.rosterIndex);
    row.querySelector(".roster-provider").onchange = (e) => { newRoster[i].provider = e.target.value; renderRoster(); };
    row.querySelector(".roster-name").oninput = (e) => { newRoster[i].id = e.target.value.toLowerCase(); };
    for (const name of ["model", "effort"]) {
      const field = row.querySelector(`[data-f="${name}"]`);
      if (!field) continue;
      field.value = newRoster[i][name] || "";
      field.oninput = field.onchange = (e) => { newRoster[i][name] = e.target.value; };
    }
    const fast = row.querySelector(".roster-fast");
    if (fast) fast.onchange = (event) => { newRoster[i].serviceTier = event.target.value; };
    row.querySelector(".roster-instructions").oninput = (e) => { newRoster[i].instructions = e.target.value; };
    row.querySelector(".roster-remove").onclick = () => { if (newRoster.length <= 1) return toast("A room needs at least one agent.", true); newRoomPreset = null; newRoster.splice(i, 1); renderRoster(); };
  });
}
$("addSeatBtn").onclick = () => {
  if (newRoster.length >= 4) return toast("Rooms support up to four agents.", true);
  const providers = Object.keys(state.providers || {});
  let next = newRoster.length + 1;
  while (newRoster.some((agent) => agent.id === `agent${next}`)) next++;
  newRoomPreset = null;
  newRoster.push({ id: `agent${next}`, provider: providers[newRoster.length % Math.max(1, providers.length)] || "claude" });
  renderRoster();
};
// Mirrors the server's rule so the message names the problem instead of
// bouncing back a 400. The server still validates; this is only the wording.
const RESERVED_SEAT_NAMES = new Set(["both", "user", "system", "all", "none", "auto", "constructor", "prototype"]);
function seatNameIssue(id) {
  if (!/^[a-z][a-z0-9-]{0,19}$/.test(id)) {
    return `"${id}" — seat names are lowercase letters, numbers and dashes, starting with a letter.`;
  }
  if (RESERVED_SEAT_NAMES.has(id)) return `"${id}" is reserved — it would collide with routing.`;
  return null;
}

// ------------------------------------------------------------ composer
const input = $("input");
const PASTE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const PASTE_IMAGE_EXTENSIONS = new Map([
  ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"],
  ["gif", "image/gif"], ["webp", "image/webp"],
]);
const PASTE_IMAGE_MAX = 4;
const ATTACHMENT_MAX = 8;
const ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_TOTAL = 6 * 1024 * 1024;

function draftAttachmentCount() {
  return state.draftImages.length + state.draftFiles.length;
}

function draftAttachmentBytes() {
  return [...state.draftImages, ...state.draftFiles].reduce((n, draft) => n + draft.file.size, 0);
}

function nativeImageMime(file) {
  const type = String(file.type || "").toLowerCase();
  if (PASTE_IMAGE_TYPES.has(type)) return type;
  if (type) return null;
  const match = /\.([^.]+)$/.exec(String(file.name || "").toLowerCase());
  return match ? PASTE_IMAGE_EXTENSIONS.get(match[1]) || null : null;
}

function renderDraftAttachments() {
  const row = $("draftImages");
  row.innerHTML = "";
  row.classList.toggle("show", draftAttachmentCount() > 0);
  for (const draft of state.draftImages) {
    const item = document.createElement("div");
    item.className = "draft-image";
    item.title = draft.file.name || "Pasted image";
    const img = document.createElement("img");
    img.src = draft.url;
    img.alt = draft.file.name || "Pasted image";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.title = "Remove image";
    remove.textContent = "×";
    remove.onclick = () => clearDraftImages([draft.id]);
    item.append(img, remove);
    row.appendChild(item);
  }
  for (const draft of state.draftFiles) {
    const item = document.createElement("div");
    item.className = "draft-file";
    item.title = draft.file.name || "Attached file";
    const icon = document.createElement("span");
    icon.className = "draft-file-icon";
    icon.textContent = "📄";
    const copy = document.createElement("span");
    copy.className = "draft-file-copy";
    const name = document.createElement("span");
    name.className = "draft-file-name";
    name.textContent = draft.file.name || "Attached file";
    const size = document.createElement("span");
    size.className = "draft-file-size";
    size.textContent = formatBytes(draft.file.size);
    copy.append(name, size);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.title = "Remove file";
    remove.textContent = "×";
    remove.onclick = () => clearDraftFiles([draft.id]);
    item.append(icon, copy, remove);
    row.appendChild(item);
  }
}

function clearDraftImages(ids = null) {
  const remove = ids ? new Set(ids) : null;
  const keep = [];
  for (const draft of state.draftImages) {
    if (!remove || remove.has(draft.id)) URL.revokeObjectURL(draft.url);
    else keep.push(draft);
  }
  state.draftImages = keep;
  renderDraftAttachments();
}

function clearDraftFiles(ids = null) {
  const remove = ids ? new Set(ids) : null;
  state.draftFiles = remove ? state.draftFiles.filter((draft) => !remove.has(draft.id)) : [];
  renderDraftAttachments();
}

function clearDraftAttachments() {
  for (const draft of state.draftImages) URL.revokeObjectURL(draft.url);
  state.draftImages = [];
  state.draftFiles = [];
  renderDraftAttachments();
}

function addDraftImages(files) {
  for (const file of files) {
    const mime = nativeImageMime(file);
    if (!mime) {
      toast("Paste PNG, JPEG, GIF, or WebP images.", true);
      continue;
    }
    if (file.size > ATTACHMENT_BYTES) {
      toast("Each attachment must be 5 MB or smaller.", true);
      continue;
    }
    if (state.draftImages.length >= PASTE_IMAGE_MAX) {
      toast("Attach at most 4 images to one message.", true);
      break;
    }
    if (draftAttachmentCount() >= ATTACHMENT_MAX) {
      toast("Attach at most 8 files and images to one message.", true);
      break;
    }
    if (draftAttachmentBytes() + file.size > ATTACHMENT_TOTAL) {
      toast("Attachments must total 6 MB or less.", true);
      continue;
    }
    state.draftImages.push({ id: crypto.randomUUID(), file, mime, url: URL.createObjectURL(file) });
  }
  renderDraftAttachments();
}

function addDraftFiles(files) {
  for (const file of files) {
    if (nativeImageMime(file)) {
      addDraftImages([file]);
      continue;
    }
    if (file.size > ATTACHMENT_BYTES) {
      toast("Each attachment must be 5 MB or smaller.", true);
      continue;
    }
    if (draftAttachmentCount() >= ATTACHMENT_MAX) {
      toast("Attach at most 8 files and images to one message.", true);
      break;
    }
    if (draftAttachmentBytes() + file.size > ATTACHMENT_TOTAL) {
      toast("Attachments must total 6 MB or less.", true);
      continue;
    }
    state.draftFiles.push({ id: crypto.randomUUID(), file });
  }
  renderDraftAttachments();
}

function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name || "the attachment"}.`));
    reader.onload = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      if (comma < 0) return reject(new Error(`Could not read ${file.name || "the attachment"}.`));
      resolve(value.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; }
input.addEventListener("input", () => { autosize(); updateRouteHint(); mentionCheck(); });

// Local slash commands; /pair goes to the server, the rest resolve here.
function localSystemNote(html) {
  const d = document.createElement("div");
  d.className = "sysmsg";
  d.innerHTML = html;
  chat.appendChild(d);
  scrollBottom(true);
}
async function handleSlash(text) {
  const cmd = (text.split(/\s+/)[0] || "").toLowerCase();
  const rest = text.slice(cmd.length).trim();
  if (cmd === "/clear") { await newConversation(); return true; }
  if (cmd === "/archive") { await archiveRoom(state.room); return true; }
  if (cmd === "/pair") return false; // server handles
  if (cmd === "/note") {
    try {
      await api("/api/config", { room: state.room, config: { roomNote: rest || null } });
      toast(rest ? `📌 Room note set — all ${state.summary?.seats?.length || 0} agents will see it on every turn.` : "📌 Room note cleared.");
    } catch (e) { toast(e.message, true); }
    return true;
  }
  // The 😴 pill toggles with one click, which is what the motivating case (you
  // just saw a 429) wants. The command exists for the optional reason, which
  // is worth recording when it's a quota rather than a passing hiccup.
  if (cmd === "/sleep" || cmd === "/wake") {
    const seats = (state.summary && state.summary.seats) || [];
    const named = /^@?([a-z0-9_-]+)/i.exec(rest);
    const agent = named && seats.includes(named[1].toLowerCase()) ? named[1].toLowerCase() : null;
    if (!agent) {
      localSystemNote(`Which seat? Try <b>${esc(cmd)} @${esc(seats[0] || "claude")}</b>` +
        (cmd === "/sleep" ? " <i>optional reason</i>" : ""));
      return true;
    }
    const reason = rest.slice(named[0].length).trim();
    try {
      const res = await api("/api/seat/sleep", {
        room: state.room, agent, asleep: cmd === "/sleep",
        ...(cmd === "/sleep" && reason ? { reason } : {}),
      });
      // /wake stays wake-only: one command, one outcome, and no menu here to
      // pick the other. Say what that means for anything held rather than
      // letting the user assume it was answered — the ☀ menu on the pill is
      // where Wake & deliver lives.
      toast(cmd === "/sleep"
        ? `😴 ${agent} is asleep${reason ? ` — ${reason}` : ""}`
        : res.held
          ? `☀ ${agent} is awake — ${res.held} held message${res.held === 1 ? "" : "s"} ${res.held === 1 ? "is" : "are"} now ordinary context, not a request`
          : `☀ ${agent} is awake — nothing was replayed`);
    } catch (e) { toast(e.message, true); }
    return true;
  }
  if (cmd === "/summarize") {
    input.value = (rest ? rest + " " : "") + "Summarize this room's discussion so far: decisions made, open questions, and next steps. Be concise.";
    await send();
    return true;
  }
  if (cmd === "/help") {
    localSystemNote(
      "<b>Routing:</b> individual @agent tags route to one seat; @all reaches every agent · untagged goes to whoever you last addressed<br>" +
      "<b>Agent calls:</b> @name always hands off · a plain direct call ('Agent, …') hands off when that agent is lurking or your message addressed all agents<br>" +
      "<b>/pair start @agent [task]</b> — pair mode: that agent works, the other reviews every message you send<br>" +
      "<b>/pair end</b> — leave pair mode (also the End button in the banner)<br>" +
      "<b>/note [text]</b> — standing room note every agent sees every turn (empty clears)<br>" +
      "<b>/sleep @agent [reason]</b> — stop launching that seat (rate limited?); <b>/wake @agent</b> brings it back<br>" +
      "<b>/clear</b> — save the conversation in history and reset agent sessions (asks first)<br>" +
      "<b>/archive</b> — move this room to Archived rooms (asks first)<br>" +
      "<b>/summarize [@agent]</b> — ask for a recap of the room<br>" +
      "<b>👂</b> on a pill = lurk · <b>😴</b> = sleep/wake that seat · <b>💬/🔨</b> = talk/work mode · dots under messages = who heard what");
    return true;
  }
  localSystemNote(`Unknown command <b>${esc(cmd)}</b> — try <b>/help</b>`);
  return true;
}

async function send() {
  const text = input.value.trim();
  const imageDrafts = [...state.draftImages];
  const fileDrafts = [...state.draftFiles];
  if ((!text && !imageDrafts.length && !fileDrafts.length) || state.sending) return;
  if (text.startsWith("/") && (imageDrafts.length || fileDrafts.length) && !/^\/pair\b/i.test(text)) {
    toast("Attachments can accompany messages or /pair tasks, not local slash commands.", true);
    return;
  }
  const sentRoom = state.room;
  const sentTarget = state.chip;
  const sentResync = state.resyncVersion;
  const chipRevision = state.chipRevision;
  const sentHopChoice = state.hopChoice;
  const sendVersion = ++state.sendVersion;
  const relayControlOnly = pairControlOnly(text, !!(imageDrafts.length || fileDrafts.length));
  if (text.startsWith("/")) {
    const problem = /^\/pair\b/i.test(text)
      ? soloTargetProblem(text, !!(imageDrafts.length || fileDrafts.length)) : "";
    if (problem) { toast(problem, true); return; }
    input.value = ""; autosize(); hideMention();
    const handled = await handleSlash(text);
    if (handled) return;
  } else {
    const problem = soloTargetProblem(text);
    if (problem) { toast(problem, true); return; }
    input.value = ""; autosize(); hideMention();
  }
  state.sending = true;
  $("sendBtn").disabled = true;
  try {
    const images = await Promise.all(imageDrafts.map(async (draft) => ({
      name: draft.file.name || "pasted-image",
      mime: draft.mime || draft.file.type,
      data: await fileBase64(draft.file),
    })));
    const files = await Promise.all(fileDrafts.map(async (draft) => ({
      name: draft.file.name || "attachment",
      mime: draft.file.type || "application/octet-stream",
      data: await fileBase64(draft.file),
    })));
    const body = { room: sentRoom, text, target: sentTarget, images, files };
    const messageTarget = guessTextTarget(text) || sentTarget;
    if (!relayControlOnly && messageTarget === "both") {
      body.discussionMode = state.discussionMode;
      if (state.discussionMode === "converge") body.convergenceRounds = state.convergenceRounds;
    }
    // Pair controls append no user turn, so they do not transmit the sticky
    // relay shortcut. Every accepted user message snapshots the current choice.
    if (!relayControlOnly && sentHopChoice === "solo") body.solo = true;
    else if (!relayControlOnly && sentHopChoice !== "default") {
      body.hopBudget = normalizedHopBudget(sentHopChoice, -1);
    }
    const r = await api("/api/message", body);
    clearDraftImages(imageDrafts.map((draft) => draft.id));
    clearDraftFiles(fileDrafts.map((draft) => draft.id));
    if (state.room === sentRoom && state.resyncVersion === sentResync &&
        state.chipRevision === chipRevision && state.sendVersion === sendVersion) {
      // The server reports explicit routing on newer contracts. Older fake
      // providers omit it, so preserve the same visible selection from the
      // message's @mention as a compatibility fallback.
      const routed = r.explicit && r.target ? r.target : guessTextTarget(text);
      if (routed) selectChip(routed);
    }
    if (r.queued) toast(`⏳ Queued (#${r.position}) — sends when the target lane is free.`);
    // Partly delivered: the free seat is already answering, the busy one is next.
    else if (r.deferred && r.deferred.length) {
      toast(`⏳ ${r.deferred.join(" and ")} still working — reaches them as soon as they're free.`);
    }
  } catch (e) {
    toast(e.message, true);
    if (state.room === sentRoom && !input.value.trim()) { input.value = text; autosize(); }
  } finally {
    state.sending = false;
    $("sendBtn").disabled = false;
  }
}
$("sendBtn").onclick = send;
$("attachBtn").onclick = () => {
  if (state.sending) return toast("Wait for the current message to finish sending.", true);
  $("fileInput").click();
};
$("fileInput").addEventListener("change", (e) => {
  const files = [...(e.target.files || [])];
  e.target.value = ""; // allow choosing the same file again after removing it
  if (!files.length) return;
  if (state.sending) return toast("Wait for the current message to finish sending.", true);
  addDraftFiles(files);
});
function dragCarriesFiles(e) {
  const transfer = e && e.dataTransfer;
  return !!transfer && ((transfer.files && transfer.files.length > 0) ||
    Array.from(transfer.types || []).includes("Files"));
}
// Without cancelling the browser's default file-drop behaviour, Chrome
// navigates away from Parley and opens the dropped file. Keep the whole window
// safe as a target, then feed the exact same validation path as the paperclip.
window.addEventListener("dragover", (e) => {
  if (!dragCarriesFiles(e)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
});
window.addEventListener("drop", (e) => {
  if (!dragCarriesFiles(e)) return;
  e.preventDefault();
  const files = [...(e.dataTransfer.files || [])];
  if (!files.length) return;
  if (state.sending) return toast("Wait for the current message to finish sending.", true);
  addDraftFiles(files);
});
// Naming the run pins the click to the response the user was looking at, so a
// slow click can never land on the next one. If that response has already
// ended the server says so and this returns quietly — an error toast there is
// exactly what makes someone press Stop a second time.
async function stopResponses(scope, agent) {
  closeStopMenu();
  const info = agent ? busyInfoFor(agent) : null;
  // "Stop the current responses" means the ones on screen when it was clicked.
  // Between the click and the request landing, a run can finish and the queue
  // can start the next one in that seat; unpinned, that is what would die.
  const pinned = scope === "active"
    ? ((state.summary && state.summary.busyInfo) || [])
      .filter((b) => b.runId).map((b) => ({ agent: b.agent, runId: b.runId }))
    : null;
  try {
    const r = await api("/api/stop", {
      room: state.room, scope,
      ...(agent ? { agent } : {}),
      ...(info && info.runId ? { runId: info.runId } : {}),
      ...(pinned ? { runs: pinned } : {}),
    });
    if (r && r.stale) return; // already over; the user's intent already holds
    if (scope === "queue") {
      toast(r && r.cancelled
        ? `Discarded ${r.cancelled} queued deliver${r.cancelled === 1 ? "y" : "ies"} — running responses continue.`
        : "Nothing was left in the queue.");
    }
  } catch (e) { toast(e.message, true); }
}
// A hold, not a stop: nothing is dropped, reordered or abandoned, and running
// responses finish. Shared by the Stop menu row and the queue popover.
async function setQueuePaused(paused) {
  closeStopMenu();
  try {
    const r = await api("/api/queue/pause", { room: state.room, paused });
    setQueue(r.queued, undefined, r.dispatches, r.paused);
    toast(r.paused
      ? "Queue paused — running responses finish; anything you send is held."
      : "Queue resumed.");
  } catch (e) { toast(e.message, true); }
}
// One click, one meaning. With a single response running and nothing queued the
// primary stops exactly that run — pinned to its runId, `active` scope, so the
// chain it would have continued into stops with it rather than hopping on after
// the reply the user just killed. It never widens: a second seat, queued work or
// a pair cycle each raise a question one click cannot answer, and those open the
// chooser. In the gap between a reply and the hop it triggers there is no run to
// name, so the only honest meaning left is the room-wide line — and the queue is
// empty there by construction, because queued work would have opened the chooser
// instead of reaching this branch.
$("stopBtn").onclick = () => {
  if (!state.summary) return;
  if (stopIsChoice(state.summary)) return toggleStopMenu();
  const active = state.summary.busy || [];
  return active.length === 1 ? stopResponses("active", null) : stopResponses("all", null);
};
// The deliberate scopes stay one click away whatever the primary does —
// seat-only is otherwise unreachable now that one busy seat stops directly.
$("stopMore").onclick = () => { if (state.summary) toggleStopMenu(); };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStopMenu(); });
$("stopMenu").onclick = (e) => {
  const hold = e.target.closest("[data-queue-pause]");
  if (hold && !hold.disabled) return setQueuePaused(hold.dataset.queuePause === "1");
  const choice = e.target.closest("[data-stop-scope]");
  // A row whose run ended while the menu was open is disabled where it stands.
  if (!choice || choice.disabled) return;
  stopResponses(choice.dataset.stopScope, choice.dataset.stopAgent || null);
};
input.addEventListener("keydown", (e) => {
  if (mentionKeydown(e)) return;
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});
input.addEventListener("paste", (e) => {
  const items = [...(e.clipboardData && e.clipboardData.items || [])];
  const files = items.filter((item) => item.kind === "file" && /^image\//i.test(item.type || ""))
    .map((item) => item.getAsFile()).filter(Boolean);
  if (!files.length) return; // leave ordinary text paste to the browser
  e.preventDefault();
  if (state.sending) return toast("Wait for the current message to finish sending.", true);
  addDraftImages(files);
});

$("chipsRow").addEventListener("click", (e) => {
  const agent = e.target.closest("[data-agent-target]");
  if (agent) {
    state.chipRevision++;
    selectChip(agent.dataset.agentTarget);
    closeAgentsMenu();
    input.focus();
    return;
  }
  const mode = e.target.closest("[data-discussion-mode]");
  if (mode) {
    state.discussionMode = mode.dataset.discussionMode === "parallel" ? "parallel" : "converge";
    saveDiscussionPrefs(); renderDiscussionMode(); renderHopControl(); updateRouteHint();
    return;
  }
  const action = e.target.closest("[data-convergence-action]");
  if (action) {
    convergenceAction(action.dataset.convergenceAction);
    return;
  }
  const c = e.target.closest(".chip");
  if (!c) return;
  state.chipRevision++;
  selectChip(c.dataset.t);
  input.focus();
});
function closeAgentsMenu() {
  const wrap = $("agentPickerWrap");
  if (!wrap) return;
  wrap.classList.remove("open");
  $("agentsBtn").setAttribute("aria-expanded", "false");
}
function openAgentsMenu() {
  const wrap = $("agentPickerWrap");
  if (!wrap) return;
  wrap.classList.add("open");
  $("agentsBtn").setAttribute("aria-expanded", "true");
  const r = $("agentsBtn").getBoundingClientRect();
  const menu = $("agentsMenu");
  const w = menu.offsetWidth || 340;
  menu.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
  menu.style.top = `${Math.max(8, r.top - (menu.offsetHeight || 360) - 8)}px`;
  setTimeout(() => $("agentsSearch")?.focus(), 0);
}
$("agentsBtn")?.addEventListener("click", () => {
  if ($("agentPickerWrap").classList.contains("open")) closeAgentsMenu(); else openAgentsMenu();
});
$("agentsSearch")?.addEventListener("input", () => renderAgentOptions(state.summary || { seats: [] }));
$("convergenceRounds")?.addEventListener("change", (e) => {
  state.convergenceRounds = Math.max(1, Math.min(99, Math.round(Number(e.target.value) || 2)));
  saveDiscussionPrefs();
  renderDiscussionMode();
  updateRouteHint();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#agentPickerWrap")) closeAgentsMenu();
});
window.addEventListener("resize", closeAgentsMenu);
async function convergenceAction(action) {
  try {
    const runId = convergenceSnapshot(state.summary)?.runId;
    await api("/api/convergence", { room: state.room, action, runId, rounds: action === "extend" ? 1 : state.convergenceRounds });
  } catch (e) { toast(e.message, true); }
}
$("convergencePanel")?.addEventListener("click", (e) => {
  const action = e.target.closest("[data-convergence-action]");
  if (action) convergenceAction(action.dataset.convergenceAction);
});
$("starters").addEventListener("click", (e) => {
  const s = e.target.closest(".starter");
  if (!s) return;
  input.value = s.dataset.fill; autosize(); input.focus(); updateRouteHint();
});

// mention popover — options come from the room's seats
function mentionOptions() {
  const seats = state.summary ? state.summary.seats : [];
  return [
    ...seats.map((a) => ({ tag: "@" + a, color: seatColor(a) })),
    { tag: "@all", color: "var(--user)" },
  ];
}
let mItems = [], mSel = 0;
function mentionCheck() {
  const pos = input.selectionStart;
  const before = input.value.slice(0, pos);
  const commandMatch = /^\/([a-z]*)$/i.exec(before);
  if (commandMatch) {
    const commands = [
      ["/help", "Show all commands"], ["/clear", "Save conversation history and reset sessions…"],
      ["/archive", "Move room to Archived rooms…"], ["/note", "Set instructions shared by every agent"],
      ["/summarize", "Ask for decisions and next steps"], ["/sleep", "Pause an agent"],
      ["/wake", "Wake an agent"], ["/pair start", "Start a work and review cycle"], ["/pair end", "End pair mode"],
    ];
    mItems = commands.filter(([tag]) => tag.slice(1).startsWith(commandMatch[1].toLowerCase())).map(([tag, description]) => ({tag, description, color:"var(--accent)", command:true}));
    if (!mItems.length) return hideMention();
    mSel = 0;
    $("mention").innerHTML = mItems.map((x,i) => `<button data-i="${i}" class="${i === 0 ? "sel" : ""}"><b>${esc(x.tag)}</b><span>${esc(x.description)}</span></button>`).join("");
    $("mention").style.display = "block";
    $("mention").querySelectorAll("button").forEach((button) => button.onclick = () => pickMention(+button.dataset.i));
    return;
  }
  const m = /(^|\s)@([a-z0-9]*)$/i.exec(before);
  if (!m) return hideMention();
  const prefix = m[2].toLowerCase();
  mItems = mentionOptions().filter((x) => x.tag.slice(1).startsWith(prefix));
  if (!mItems.length) return hideMention();
  mSel = 0;
  const el = $("mention");
  el.innerHTML = mItems.map((x, i) =>
    `<button data-i="${i}" class="${i === 0 ? "sel" : ""}"><span class="mdot" style="background:${x.color}"></span>${x.tag}</button>`).join("");
  el.style.display = "block";
  el.querySelectorAll("button").forEach((b) => { b.onclick = () => pickMention(+b.dataset.i); });
}
function hideMention() { $("mention").style.display = "none"; mItems = []; }
function pickMention(i) {
  const pos = input.selectionStart;
  const before = input.value.slice(0, pos).replace(mItems[i].command ? /^\/[a-z]*$/i : /@[a-z0-9]*$/i, mItems[i].tag + " ");
  input.value = before + input.value.slice(pos);
  input.selectionStart = input.selectionEnd = before.length;
  hideMention(); updateRouteHint(); input.focus();
}
function mentionKeydown(e) {
  if (!mItems.length) return false;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    mSel = (mSel + (e.key === "ArrowDown" ? 1 : mItems.length - 1)) % mItems.length;
    $("mention").querySelectorAll("button").forEach((b, i) => b.classList.toggle("sel", i === mSel));
    e.preventDefault(); return true;
  }
  if (e.key === "Enter" || e.key === "Tab") { pickMention(mSel); e.preventDefault(); return true; }
  if (e.key === "Escape") { hideMention(); return true; }
  return false;
}

// ------------------------------------------------------------ rooms sidebar
function applyRoomTemplate(kind) {
  newRoomPreset = kind;
  const providers = Object.keys(state.providers || {});
  const claude = providers.includes("claude") ? "claude" : providers[0] || "claude";
  const codex = providers.includes("codex") ? "codex" : providers[1] || providers[0] || "codex";
  newRoster = kind === "team" ? [
    { id: "fable", provider: claude, model: "fable", instructions: "Drive the discussion with Astra. Build on useful ideas, state assumptions, and check conclusions against evidence." },
    { id: "astra", provider: codex, model: "gpt-6-astra", effort: "high", instructions: "Drive the work with Fable. Check feasibility, propose concrete implementation steps, and verify conclusions." },
    { id: "adversary", provider: claude, instructions: "Take the perspective of a skeptical customer. Challenge assumptions, find counterexamples and failure modes, and accept conclusions when evidence resolves your objections." },
    { id: "privacy", provider: codex, instructions: "Review data collection, retention, access, and disclosure. Flag exposure of secrets or personal data and propose ways to achieve the goal with less sensitive information." },
  ] : [{ id: "claude", provider: claude }, { id: "codex", provider: codex }];
  $("twoAgentTemplate").setAttribute("aria-pressed", String(kind !== "team"));
  $("fourAgentTemplate").setAttribute("aria-pressed", String(kind === "team"));
  renderRoster();
}
function openNewRoom(kind = "pair") {
  clearNewRoomProject(); // a fresh form never inherits the last one's folder
  $("newRoomInput").value = "";
  $("newRoomReviewChk").checked = false;
  applyRoomTemplate(kind);
  setNavOpen(false);
  $("newRoomDialog").showModal();
  $("newRoomInput").focus();
}
$("addRoomBtn").onclick = () => openNewRoom();
$("newRoomHeaderBtn").onclick = () => openNewRoom();
$("buildRoomBtn").onclick = () => openNewRoom();
$("fourAgentBtn").onclick = () => openNewRoom("team");
$("twoAgentTemplate").onclick = () => applyRoomTemplate("pair");
$("fourAgentTemplate").onclick = () => applyRoomTemplate("team");
function closeNewRoom() {
  newRoomPick++;
  $("newRoomDialog").close();
  $("newRoomInput").value = "";
  newRoster = [];
  clearNewRoomProject();
}
$("newRoomCancel").onclick = closeNewRoom;
$("newRoomCancelBottom").onclick = closeNewRoom;
$("newRoomDialog").addEventListener("cancel", (e) => { e.preventDefault(); closeNewRoom(); });
let newRoomProjectDir = null;
// The OS dialog isn't modal to this page, so the form can be submitted while it
// is still open. Each pick is stamped, and anything that ends the form's life
// moves the stamp on: a result that arrives after that belongs to a form the
// user already finished with, and must not seed the next room's folder.
let newRoomPick = 0;
function clearNewRoomProject() {
  newRoomPick++;
  newRoomProjectDir = null;
  $("newRoomProjVal").textContent = "";
  $("newRoomProj").style.color = "var(--text-faint)";
}
$("newRoomProj").onclick = async () => {
  const pick = ++newRoomPick;
  const r = await browseFolder(null, $("newRoomProj"));
  if (pick !== newRoomPick || !r) return; // superseded while the dialog was open
  newRoomProjectDir = r;
  $("newRoomProjVal").textContent = "— " + r.split(/[\\/]/).pop();
  $("newRoomProj").style.color = "var(--text-dim)";
};
$("newRoomForm").onsubmit = async (e) => {
  e.preventDefault();
  const name = $("newRoomInput").value.trim();
  if (!name) return;
  const seats = newRoster.map((a, i) => ({ id: (a.id || `agent${i + 1}`).trim().toLowerCase(), provider: a.provider, ...(a.model ? { model: a.model.trim() } : {}), ...(a.effort ? { effort: a.effort.trim() } : {}), ...(a.instructions ? { instructions: a.instructions.trim() } : {}), ...(a.provider === "codex" ? {serviceTier: a.serviceTier || "default"} : {}) }));
  if (!seats.length) return toast("Add at least one agent.", true);
  if (seats.length > 4) return toast("Rooms support up to four agents.", true);
  const names = new Set();
  for (const seat of seats) { if (names.has(seat.id)) return toast("Give each agent a different name.", true); names.add(seat.id); const issue = seatNameIssue(seat.id); if (issue) return toast(issue, true); }
  const body = { name };
  body.seats = seats;
  if (newRoomProjectDir) body.projectDir = newRoomProjectDir;
  // Retire this form's pick: a dialog still open belongs to the room being
  // created now, not to whatever is typed next. The chosen folder itself is
  // only cleared on success — a rejected name leaves the form up, and the user
  // shouldn't have to pick their project again to fix a typo.
  newRoomPick++;
  const asReview = $("newRoomReviewChk").checked;
  try {
    await api("/api/rooms", body);
    if (asReview) {
      try { await api("/api/config", { room: name, config: { mode: "work" } }); }
      catch (err) { toast(`Room created, but Work mode wasn't applied: ${err.message}`, true); }
    }
    $("newRoomInput").value = "";
    const s1n = $("seat1Name"), s2n = $("seat2Name");
    if (s1n) s1n.value = "";
    if (s2n) s2n.value = "";
    newRoster = [];
    $("newRoomReviewChk").checked = false;
    $("newRoomDialog").close();
    clearNewRoomProject();
    await loadRoom(name);
  } catch (err) { toast(err.message, true); }
};
// Ask the server to open the OS folder dialog; returns a path or null.
// The dialog is modal on the desktop but not in this page, so the button that
// opened it is held down until it closes — otherwise a second click stacks
// another dialog behind the first.
// The "Choosing…" swap touches a dedicated label span, never the button's own
// contents. One of these buttons also holds a live element (#newRoomProjVal)
// that other code writes to while the dialog is open — rewriting the button's
// text destroys it, and the next write to it throws.
async function browseFolder(start, btn) {
  const label = btn && btn.querySelector("[data-picker-label]");
  const original = label && label.textContent;
  if (btn) { btn.disabled = true; if (label) label.textContent = "Choosing…"; }
  toast("Opening the folder picker… If Windows keeps it behind, choose ‘Parley — Choose a project folder’ from the taskbar.");
  try {
    const r = await api("/api/pickfolder", { start: start || null });
    if (r.error) { toast(r.error, true); return null; }
    return r.cancelled ? null : r.path;
  } catch (e) { toast(e.message, true); return null; }
  finally { if (btn) { btn.disabled = false; if (label) label.textContent = original; } }
}
$("s_browse").onclick = async () => {
  const pick = ++settingsPick;
  const openedFor = state.room;
  const picked = await browseFolder($("s_projdir").value.trim() || null, $("s_browse"));
  if (pick !== settingsPick || state.room !== openedFor || !picked) return;
  $("s_projdir").value = picked;
};
$("openWs").onclick = () => api("/api/open", { room: state.room, what: "workspace" })
  .then(() => toast("📁 Workspace opened in Explorer — check the taskbar if it isn't in front."))
  .catch((e) => toast(e.message, true));
$("openRoomDir").onclick = () => api("/api/open", { room: state.room, what: "room" })
  .then(() => toast("🗂️ Room folder opened in Explorer — check the taskbar if it isn't in front."))
  .catch((e) => toast(e.message, true));

// ------------------------------------------------------------ settings modal
// Seat cards render from the provider catalog: each provider declares which
// fields it understands, so a new provider's settings appear automatically.
let fieldHelpSequence = 0;
function compactFieldNotes(root) {
  for (const field of root.querySelectorAll(".fld")) {
    const notes = [...field.children].filter((el) => el.classList.contains("note"));
    if (!notes.length) continue;
    const label = field.querySelector("label");
    if (!label) continue;
    const help = document.createElement("span"); help.className = "field-help";
    const button = document.createElement("button"); button.type = "button"; button.className = "field-help-button";
    button.textContent = "ⓘ"; button.setAttribute("aria-label", `About ${label.textContent.trim()}`);
    const content = document.createElement("span"); content.className = "field-tooltip";
    content.id = `field_help_${++fieldHelpSequence}`; content.setAttribute("role", "tooltip");
    button.setAttribute("aria-describedby", content.id); button.setAttribute("aria-expanded", "false");
    const positionHelp = () => {
      const rect = button.getBoundingClientRect();
      content.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - content.offsetWidth - 12))}px`;
      content.style.top = `${Math.max(12, Math.min(rect.bottom + 6, window.innerHeight - content.offsetHeight - 12))}px`;
    };
    help.onmouseenter = positionHelp; help.onfocusin = positionHelp;
    button.onclick = () => { const open = help.classList.toggle("help-open"); button.setAttribute("aria-expanded", String(open)); positionHelp(); };
    for (const note of notes) content.append(note);
    help.append(button, content); label.append(" ", help);
  }
}
function seatFieldHTML(a, field, p) {
  const d = (n, f) => `data-seat="${esc(a)}" data-f="${f}"`;
  if (field === "command") return `<div class="fld"><label>Command</label><input ${d(a, "command")} spellcheck="false" placeholder="${esc((p.defaults && p.defaults.command) || p.command || "provider")} (default)"></div>`;
  // Model and effort are comboboxes, not fixed lists: the suggestions are a
  // convenience, but anything you type is passed straight to the CLI — so
  // models and effort levels released after this build still work.
  // Suggestions show the provider's own wording ("Extra High"), while the
  // value written into the field is what the CLI takes ("xhigh"). A custom
  // popup is used instead of <datalist>: native datalists filter by the
  // selected value, so reopening one can hide every other choice.
  const combo = (fieldName, list, placeholder) => {
    const id = `combo_${a}_${fieldName}`;
    const choices = (list || []).map((item, i) => {
      const o = typeof item === "string" ? {value: item, label: item} : item;
      const detail = [o.label !== o.value ? o.label : "", o.hint || ""].filter(Boolean).join(" — ");
      return `<button type="button" class="freecombo-option" role="option" id="${esc(id)}_${i}" ` +
        `data-combo-value="${esc(o.value)}"><b>${esc(o.value)}</b>` +
        `${detail ? `<span>${esc(detail)}</span>` : ""}</button>`;
    }).join("");
    return `<div class="freecombo">` +
      `<input class="freecombo-input" ${d(a, fieldName)} spellcheck="false" autocomplete="off" ` +
      `role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" ` +
      `aria-controls="${esc(id)}" placeholder="${esc(placeholder)}">` +
      `<button type="button" class="freecombo-toggle" aria-label="Show all suggestions" title="Show all suggestions">▾</button>` +
      `<div class="freecombo-menu" id="${esc(id)}" role="listbox" hidden>${choices}` +
      `<div class="freecombo-empty" hidden>No matching suggestions — you can still use the value you typed.</div></div></div>`;
  };
  if (field === "model") return `<div class="fld"><label>Model</label>` +
    combo("model", p.models, "blank = the CLI's default") +
    `<div class="note">Any value the CLI accepts — aliases or full model names.</div></div>`;
  if (field === "effort") return `<div class="fld"><label>Reasoning effort</label>` +
    combo("effort", p.efforts, "blank = default") + `</div>`;
  if (field === "permissionMode") return `<div class="fld"><label>Permission mode</label><select ${d(a, "permissionMode")}>` +
    `<option value="auto">Room default</option>` +
    `<option value="plan">Plan — read only</option>` +
    `<option value="acceptEdits">Accept edits</option>` +
    `<option value="bypassPermissions">full access</option></select>` +
    `<div class="note">Room default uses Claude's default in Talk and accepts edits in Work. Plan reads and proposes only. Accept edits allows ordinary project edits; protected paths and commands may still prompt. Full access bypasses ordinary Claude checks. An effective mode change starts a fresh session; the transcript keeps the room history.</div>` +
    `<div class="note danger">With Claude Code 2.1.126+, Full access includes protected paths such as .git and can reach outside this project. Explicit policy and OS limits may still apply. Claude recommends an isolated container or VM; using it directly on a trusted host grants host-level access.</div></div>`;
  if (field === "approvalMode") return `<div class="fld"><label>Approval mode</label><select ${d(a, "approvalMode")}>` +
    `<option value="auto">Room default</option>` +
    `<option value="plan">Plan — read only</option>` +
    `<option value="auto_edit">Auto edit</option>` +
    `<option value="yolo">full access</option></select>` +
    `<div class="note">Room default uses Gemini's default in Talk and auto-approves edits in Work. Plan reads and proposes only. Auto edit approves edits while other tools prompt. Full access auto-approves every tool. An effective mode change starts a fresh session; the transcript keeps the room history.</div>` +
    `<div class="note danger">Full access auto-approves every tool call, including commands and writes outside this project. An isolated container or VM is the recommended place for it.</div></div>`;
  if (field === "sandbox") return `<div class="fld"><label>Sandbox</label><select ${d(a, "sandbox")}>` +
    `<option value="read-only">Read only (default)</option><option value="workspace-write">Workspace write</option>` +
    `<option value="danger-full-access">Full access</option></select>` +
    `<div class="note">Changing this restarts the seat's session.</div></div>`;
  if (field === "extraArgs") return `<div class="fld"><label>Extra CLI args</label><input ${d(a, "extraArgs")} spellcheck="false"></div>`;
  return "";
}
// Persistent per-agent identity/instructions are deliberately separate from the
// shared room note: they are included in that seat's briefing for every turn.
function seatInstructionsHTML(a) {
  return `<div class="fld instructions-field"><label>Standing instructions <button type="button" class="ract expand-instructions">Expand editor</button></label><textarea rows="7" data-seat="${esc(a)}" data-f="instructions" placeholder="Role, point of view, or review criteria…"></textarea><div class="note">This identity follows the agent through the whole room.</div></div>`;
}
function setFreeComboOpen(combo, open, query = "") {
  const input = combo.querySelector(".freecombo-input");
  const menu = combo.querySelector(".freecombo-menu");
  if (open) {
    document.querySelectorAll(".freecombo.open").forEach((other) => {
      if (other !== combo) setFreeComboOpen(other, false);
    });
  }
  const needle = String(query).trim().toLowerCase();
  let visible = 0;
  combo.querySelectorAll(".freecombo-option").forEach((option) => {
    const show = !needle || option.textContent.toLowerCase().includes(needle);
    option.hidden = !show;
    option.classList.remove("active");
    option.classList.toggle("selected", option.dataset.comboValue === input.value);
    if (show) visible++;
  });
  combo.querySelector(".freecombo-empty").hidden = visible > 0;
  combo.classList.toggle("open", open);
  menu.hidden = !open;
  if (open) menu.scrollTop = 0;
  input.setAttribute("aria-expanded", String(open));
  input.removeAttribute("aria-activedescendant");
}
function chooseFreeCombo(option) {
  const combo = option.closest(".freecombo");
  const input = combo.querySelector(".freecombo-input");
  input.value = option.dataset.comboValue;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  setFreeComboOpen(combo, false);
  input.focus();
}
$("seatCards").addEventListener("click", (e) => {
  const expand = e.target.closest(".expand-instructions");
  if (expand) { const field = expand.closest(".instructions-field"); field.classList.toggle("expanded"); expand.textContent = field.classList.contains("expanded") ? "Collapse editor" : "Expand editor"; return; }
});
document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".freecombo-toggle");
  if (toggle) {
    const combo = toggle.closest(".freecombo");
    const opening = !combo.classList.contains("open");
    setFreeComboOpen(combo, opening, ""); // the arrow always shows the full list
    if (opening) combo.querySelector(".freecombo-input").focus();
    return;
  }
  const option = e.target.closest(".freecombo-option");
  if (option) chooseFreeCombo(option);
});
document.addEventListener("input", (e) => {
  const input = e.target.closest(".freecombo-input");
  if (input) setFreeComboOpen(input.closest(".freecombo"), true, input.value);
});
document.addEventListener("keydown", (e) => {
  const input = e.target.closest(".freecombo-input");
  if (!input) return;
  const combo = input.closest(".freecombo");
  if (e.key === "Escape") {
    if (combo.classList.contains("open")) {
      e.preventDefault();
      e.stopPropagation();
      setFreeComboOpen(combo, false);
    }
    return;
  }
  if (e.key === "Enter") {
    const active = combo.querySelector(".freecombo-option.active:not([hidden])");
    if (active) { e.preventDefault(); chooseFreeCombo(active); }
    return;
  }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  if (!combo.classList.contains("open")) setFreeComboOpen(combo, true, "");
  const options = [...combo.querySelectorAll(".freecombo-option:not([hidden])")];
  if (!options.length) return;
  const current = options.findIndex((option) => option.classList.contains("active"));
  const next = current < 0
    ? (e.key === "ArrowDown" ? 0 : options.length - 1)
    : (current + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length;
  options.forEach((option, i) => option.classList.toggle("active", i === next));
  input.setAttribute("aria-activedescendant", options[next].id);
  options[next].scrollIntoView({ block: "nearest" });
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".freecombo")) {
    document.querySelectorAll(".freecombo.open").forEach((combo) => setFreeComboOpen(combo, false));
  }
});
let selectedSettingsAgent = 0;
function showSettingsPane(which) {
  for (const name of ["agents", "room"]) {
    $(name + "SettingsPane").hidden = name !== which;
    $(name + "SettingsTab").setAttribute("aria-selected", String(name === which));
  }
}
$("agentsSettingsTab").onclick = () => showSettingsPane("agents");
$("roomSettingsTab").onclick = () => showSettingsPane("room");
let settingsRosterDraft = null;
let settingsRosterVersion = null;
function rosterDraftFromSummary(s) {
  return s.seats.map((id) => {
    const p = (s.seatInfo && s.seatInfo[id]) || s.providers[id] || {};
    const cfg = (s.cfg.agents && s.cfg.agents[id]) || {};
    return { id, provider: p.provider || id, model: cfg.model || "", effort: cfg.effort || "", instructions: cfg.instructions || "", existing: true };
  });
}
function captureSettingsDraft() {
  if (!settingsRosterDraft) return;
  settingsRosterDraft.forEach((seat, index) => {
    document.querySelectorAll(`#seatCards .mgroup[data-roster-index="${index}"] [data-f]`).forEach((el) => {
      seat[el.dataset.f] = el.value;
    });
  });
}
function refreshSettingsDefaultOptions() {
  if (!settingsRosterDraft || !$("s_default")) return;
  const current = $("s_default").value;
  $("s_default").innerHTML = settingsRosterDraft.map((seat) => `<option>${esc(seat.id)}</option>`).join("");
  $("s_default").value = settingsRosterDraft.some((seat) => seat.id === current) ? current : (settingsRosterDraft[0] && settingsRosterDraft[0].id);
}
function renderSeatCards(s) {
  const roster = settingsRosterDraft || rosterDraftFromSummary(s);
  selectedSettingsAgent = Math.min(selectedSettingsAgent, Math.max(0, roster.length - 1));
  $("settingsAddSeat").disabled = roster.length >= 4;
  $("settingsRosterNote").textContent = roster.length > 4 ? "This existing roster is preserved. Remove agents to bring it within the four-agent limit." : `${roster.length} of 4 agents · edits stay in draft until you save.`;
  $("settingsAgentNav").innerHTML = roster.map((seat, i) => `<button type="button" data-edit-agent="${i}" aria-pressed="${i === selectedSettingsAgent}">@${esc(seat.id)}</button>`).join("");
  $("settingsAgentNav").onclick = (event) => {
    const button = event.target.closest("[data-edit-agent]");
    if (!button) return;
    captureSettingsDraft(); selectedSettingsAgent = Number(button.dataset.editAgent); renderSeatCards(s);
  };
  $("seatCards").innerHTML = roster.map((seat, index) => {
    const a = seat.id;
    const p = (s.seatInfo && s.seatInfo[a]) || s.providers[seat.provider] || state.providers[seat.provider] || {};
    const ag = s.agents[a] || { linked: false };
    let f = `<div class="agent-main-fields">${(p.fields || []).filter((field) => ["model", "effort"].includes(field)).map((field) => seatFieldHTML(a, field, p)).join("")}</div>`;
    if (seat.provider === "codex") f += `<div class="fld"><label for="fast_${esc(a)}">Fast mode <span class="info-tip" tabindex="0" role="note" aria-label="Requests faster Codex processing using the Fast service tier. Availability and cost depend on your account." data-tip="Requests faster Codex processing. Availability and cost depend on your account.">ⓘ</span></label><select id="fast_${esc(a)}" data-seat="${esc(a)}" data-f="serviceTier"><option value="default">Off — standard processing</option><option value="fast">On — faster processing</option></select></div>`;
    f += seatInstructionsHTML(a);
    f += `<details class="agent-advanced"><summary>Advanced agent settings <span class="info-tip" tabindex="0" role="note" aria-label="Controls how this agent runs commands, requests permissions, and joins conversations." data-tip="Controls commands, permissions, and how this agent joins conversations.">ⓘ</span></summary>${(p.fields || []).filter((field) => !["model", "effort", "serviceTier"].includes(field)).map((field) => seatFieldHTML(a, field, p)).join("")}`;
    f += `<div class="fld"><label>When listening: participation</label><select data-seat="${esc(a)}" data-f="lurkStyle">` +
      `<option value="quiet">Quiet</option>` +
      `<option value="balanced">Balanced</option>` +
      `<option value="vocal">Vocal</option></select>` +
      `<div class="note">Quiet: only uncorrected errors. Balanced: errors, disagreements, and critical caveats. Vocal: anything with real signal.</div></div>`;
    f += `<div class="fld"><label>When listening: custom criteria</label>` +
      `<input data-seat="${esc(a)}" data-f="lurkPrompt" placeholder="e.g. Interject whenever you disagree." spellcheck="false"><div class="note">Optional criteria override the participation preset. The agent can still return [pass] when it has nothing to add.</div></div>`;
    f += "</details>";
    const sess = ag.linked
      ? `Session linked (${ag.sessionRef}…), seen through turn ${ag.cursor}.`
      : "No session yet — next message starts one.";
    const identity = seat.existing
      ? `<strong class="agc" style="color:${seatColor(a)}">@${esc(a)}</strong>`
      : `<input class="settings-agent-name" data-roster-index="${index}" value="${esc(a)}" maxlength="20" aria-label="Agent ${index + 1} name" spellcheck="false">`;
    const provider = p.label || seat.provider || "provider";
    const providerSelect = seat.existing ? `<small>${esc(provider)} · existing seat</small>` : `<select class="settings-agent-provider" data-roster-index="${index}" aria-label="Provider for agent ${index + 1}">${Object.entries(state.providers || {}).map(([id, meta]) => `<option value="${esc(id)}" ${id === seat.provider ? "selected" : ""}>${esc(meta.label || id)}</option>`).join("")}</select>`;
    return `<div class="mgroup" data-roster-index="${index}" ${index !== selectedSettingsAgent ? "hidden" : ""}><div class="settings-agent-bar"><div class="agent-identity">${identity}${providerSelect}</div><button type="button" class="btn settings-remove-agent" data-remove-roster="${index}" aria-label="Remove agent ${index + 1}">Remove</button></div>${f}<div class="sess">${sess}</div></div>`;
  }).join("");
  for (const [rosterIndex, seat] of roster.entries()) {
    const a = seat.id;
    for (const el of document.querySelectorAll(`#seatCards .mgroup[data-roster-index="${rosterIndex}"] [data-f]`)) {
      const v = s.cfg.agents[a] && s.cfg.agents[a][el.dataset.f];
      const draftValue = seat[el.dataset.f];
      const hasDraft = Object.hasOwn(seat, el.dataset.f);
      el.value = el.dataset.f === "extraArgs" ? (hasDraft ? draftValue : (v || []).join(" ")) : (hasDraft ? draftValue : (v ?? ""));
      if (!hasDraft && !v && el.tagName === "SELECT" && el.options.length) el.value = el.options[0].value;
    }
  }
  compactFieldNotes($("seatCards"));
  $("seatCards").querySelectorAll("[data-remove-roster]").forEach((button) => {
    button.onclick = () => {
      const i = Number(button.dataset.removeRoster);
      if (settingsRosterDraft.length <= 1) return toast("A room needs at least one agent.", true);
      captureSettingsDraft();
      settingsRosterDraft.splice(i, 1);
      refreshSettingsDefaultOptions();
      renderSeatCards(s);
    };
  });
  $("seatCards").querySelectorAll(".settings-agent-name").forEach((input) => {
    input.oninput = () => { settingsRosterDraft[Number(input.dataset.rosterIndex)].id = input.value.toLowerCase().replace(/[^a-z0-9-]/g, ""); refreshSettingsDefaultOptions(); };
  });
  $("seatCards").querySelectorAll(".settings-agent-provider").forEach((select) => {
    select.onchange = () => { captureSettingsDraft(); settingsRosterDraft[Number(select.dataset.rosterIndex)].provider = select.value; renderSeatCards(s); };
  });
}
// The folder dialog is not modal to this page, so Settings can be closed,
// saved, or pointed at a different room while it is still open. Every one of
// those retires the stamp, and a result that comes back against a retired stamp
// is dropped rather than written into whatever room is on screen by then.
let settingsPick = 0;
function retireSettingsPick() { settingsPick++; }
function closeSettings() {
  retireSettingsPick();
  $("overlay").classList.remove("open");
  settingsRosterDraft = null;
  settingsRosterVersion = null;
  // Closing a dialog used to leave focus on nothing at all.
  if (settingsOpener && document.contains(settingsOpener)) settingsOpener.focus();
  settingsOpener = null;
}
function openSettings() {
  const s = state.summary; if (!s) return;
  // On narrow screens Settings can be opened from the slide-over sidebar.
  // Close that navigation layer before showing the settings overlay so the
  // sidebar cannot remain above the modal or intercept its controls.
  setNavOpen(false);
  settingsOpener = document.activeElement;
  retireSettingsPick();
  selectedSettingsAgent = 0;
  settingsRosterDraft = rosterDraftFromSummary(s);
  settingsRosterVersion = s.rosterVersion;
  $("roomPath").textContent = s.dir;
  $("mDelete").hidden = s.name === "default"; // the fallback room can't be removed
  renderSeatCards(s);
  $("s_notify").checked = notifyEnabled();
  $("s_projdir").value = s.cfg.projectDir || "";
  $("s_roomnote").value = s.cfg.roomNote || "";
  $("s_default").innerHTML = settingsRosterDraft.map((x) => `<option>${esc(x.id)}</option>`).join("");
  $("s_default").value = s.cfg.defaultAgent || settingsRosterDraft[0].id;
  $("s_timeout").value = Math.round((s.cfg.timeoutMs || 300000) / 1000);
  $("s_hopbudget").value = String(normalizedHopBudget(s.cfg.hopBudget, -1));
  const previousAccounting = s.cfg.accounting !== "automatic";
  $("s_accounting").innerHTML = (previousAccounting
    ? '<option value="exchanges" disabled>Previous accounting — current setting, not offered for new selection</option>' : "") +
    '<option value="automatic">Automatic turns — every automatic start counts</option>';
  $("s_accounting").value = previousAccounting ? "exchanges" : "automatic";
  $("hopSettingsNote").textContent = `-1 = Until settled (${hopSafetyLimit() === null ? "server safety maximum unavailable" : `server safety maximum ${hopSafetyLimit()}`}). ` +
    "Automatic turns: zero means only initial requested responses. Changes apply to messages you send after saving. Discussions already started keep their original rules, including later agent replies. Sticky composer overrides take precedence." +
    (previousAccounting ? " This room still uses previous accounting. Select Automatic turns and review the allowance to switch; saving other settings alone will not switch it." : "");
  $("s_pairrounds").value = s.cfg.pairRounds || 0;
  compactFieldNotes($("roomSettingsPane"));
  showSettingsPane("agents");
  $("overlay").classList.add("open");
}
$("settingsAddSeat").onclick = () => {
  if (!settingsRosterDraft) return;
  if (settingsRosterDraft.length >= 4) return toast("Rooms support up to four agents. Existing larger rosters are preserved.", true);
  captureSettingsDraft();
  const providers = Object.keys(state.providers || {});
  let n = settingsRosterDraft.length + 1;
  let id = `agent${n}`;
  while (settingsRosterDraft.some((seat) => seat.id === id)) id = `agent${++n}`;
  selectedSettingsAgent = settingsRosterDraft.length;
  settingsRosterDraft.push({ id, provider: providers[settingsRosterDraft.length % Math.max(1, providers.length)] || "claude", model: "", effort: "", instructions: "", existing: false });
  renderSeatCards(state.summary);
  refreshSettingsDefaultOptions();
};
$("settingsBtn").onclick = openSettings;
$("settingsBtn2").onclick = () => {
  setNavOpen(false);
  $("s_notify").checked = notifyEnabled();
  $("generalDialog").showModal();
};
$("generalClose").onclick = () => $("generalDialog").close();
$("generalSave").onclick = async () => {
  if ($("s_notify").checked && !notifyEnabled()) {
    if (await requestNotifyPermission()) setNotifyEnabled(true);
    else return toast("Your browser blocked notifications for this page.", true);
  } else if (!$("s_notify").checked) setNotifyEnabled(false);
  $("generalDialog").close();
};
$("mCancel").onclick = () => closeSettings();
$("overlay").addEventListener("click", (e) => { if (e.target === $("overlay")) closeSettings(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSettings(); });
$("mSave").onclick = async () => {
  const s = state.summary; if (!s) return;
  const roster = settingsRosterDraft || rosterDraftFromSummary(s);
  const rosterNames = roster.map((seat) => seat.id.trim().toLowerCase());
  if (roster.some((seat) => seat.id !== seat.id.trim().toLowerCase() || seatNameIssue(seat.id))) {
    const bad = roster.find((seat) => seat.id !== seat.id.trim().toLowerCase() || seatNameIssue(seat.id));
    toast(seatNameIssue(bad.id) || `"${bad.id}" is not a valid agent name.`, true);
    return;
  }
  if (new Set(rosterNames).size !== rosterNames.length) { toast("Each agent needs a unique @mention.", true); return; }
  const roomHopBudget = Number($("s_hopbudget").value);
  if (!Number.isSafeInteger(roomHopBudget) || roomHopBudget < -1) {
    toast("Hop budget must be -1 (until settled) or a non-negative whole number.", true);
    return;
  }
  const agents = {};
  for (const [rosterIndex, seat] of roster.entries()) {
    const a = seat.id;
    agents[a] = {};
    for (const el of document.querySelectorAll(`#seatCards .mgroup[data-roster-index="${rosterIndex}"] [data-f]`)) {
      const f = el.dataset.f;
      let v = el.value;
      if (f === "extraArgs") v = v.trim() ? v.trim().split(/\s+/) : [];
      else if (f === "command") v = v.trim() || undefined; // blank keeps the default
      else if (typeof v === "string" && v.trim() === "") v = null;
      if (v !== undefined) agents[a][f] = v;
    }
  }
  // Every seat, not the one that happens to be called "claude": a seat can be
  // named anything, and the warned escalation has to follow the seat actually
  // being elevated.
  for (const a of s.seats) {
    if (!agents[a] || !s.cfg.agents[a]) continue;
    const roomMode = s.cfg.mode || "talk";
    const before = effectiveSeatPermission(a, s.cfg.agents[a], roomMode);
    const after = effectiveSeatPermission(a, { ...s.cfg.agents[a], ...agents[a] }, roomMode);
    if (isFullAccess(before) || !isFullAccess(after)) continue;
    const who = seatLabel(a);
    const scope = $("s_projdir").value.trim() || "the room workspace";
    const accepted = confirm(
      `⚠ Give ${who} Full access in this room?\n\n` +
      `${who} will bypass its ordinary permission prompts and checks. It can modify protected paths such as .git; it can also run commands, use inherited credentials and network access, and change files outside:\n${scope}\n\n` +
      `Explicit ask/deny rules, managed policy, OS permissions, and the CLI's own hard safety limits may still restrict actions.\n\n` +
      `Parley requests separate read-only invocations for protected @all discussions, pair reviews, and lurk turns. They discard the seat's ordinary native session; the next ordinary turn is re-briefed from room history. Ordinary handoffs and pair-worker turns still receive Full access. Trusted external CLI settings or wrappers remain outside this boundary.\n\n` +
      `${who} will start a fresh session. Running an agent with full access directly on a trusted host grants host-level access; an isolated container or VM is the recommended place for it.`
    );
    if (!accepted) return;
  }
  // Build the request from what is on screen now, then retire the picker: a
  // dialog that resolves while the save is in flight would otherwise fill the
  // field with a folder this request did not carry.
  const config = {
    defaultAgent: roster.some((seat) => seat.id === $("s_default").value) ? $("s_default").value : roster[0].id,
    timeoutMs: Math.max(10, Number($("s_timeout").value) || 300) * 1000,
    hopBudget: roomHopBudget,
    accounting: $("s_accounting").value,
    pairRounds: Math.min(99, Math.max(0, Number($("s_pairrounds").value) || 0)),
    projectDir: $("s_projdir").value.trim() || null,
    roomNote: $("s_roomnote").value.trim() || null,
    agents,
  };
  retireSettingsPick();
  try {
    const seats = roster.map((seat) => {
      const values = agents[seat.id] || {};
      return { id: seat.id, provider: seat.provider, model: values.model || null, effort: values.effort || null, instructions: values.instructions || null };
    });
    const saved = await api("/api/config", { room: state.room, expectedRosterVersion: settingsRosterVersion, seats, config });
    closeSettings();
    // The panel above already shows the new permission, but a CLI process that
    // has launched cannot be changed. Say what the user is actually watching —
    // scoped to the run in flight, since a recovery retry would relaunch under
    // the new settings within that same reply.
    const late = (saved && saved.runningInvocations) || [];
    toast(late.length
      ? `Saved — ${late.join(" and ")} ${late.length > 1 ? "are" : "is"} mid-answer, and the ${late.length > 1 ? "runs" : "run"} already in progress ${late.length > 1 ? "keep" : "keeps"} the previous permissions.`
      : "Settings saved.");
  } catch (e) { toast(e.message, true); }
};
function showNoRoom() {
  if (state.es) { state.es.close(); state.es = null; }
  clearDraftAttachments(); clearAttachmentUrls();
  state.room = null; state.summary = null; state.entries = []; state.live = {}; state.queue = [];
  chat.replaceChildren(); $("pills").replaceChildren();
  $("roomTitle").textContent = "Your workspace";
  $("tagline").textContent = "Your shared workspace";
  $("empty").classList.remove("room-selected"); $("empty").style.display = "";
  for (const id of ["openWs", "openRoomDir", "dlTranscript", "gitId"]) $(id).hidden = true;
  $("composerWrap").hidden = true; $("modeToggle").hidden = true; $("settingsBtn").hidden = true;
  for (const id of ["workBanner", "pairBanner", "setupBanner", "convergencePanel", "busyStrip"]) $(id).style.display = "none";
  history.replaceState(null, "", location.pathname);
}
let pendingConfirmation = null;
function confirmRoomAction(title, body, acceptLabel) {
  if (pendingConfirmation) return Promise.resolve(false);
  const dialog = $("confirmDialog");
  const opener = document.activeElement;
  $("confirmTitle").textContent = title;
  $("confirmBody").textContent = body;
  $("confirmAccept").textContent = acceptLabel;
  dialog.returnValue = "cancel";
  return new Promise((resolve) => {
    pendingConfirmation = {resolve, opener};
    dialog.showModal();
  });
}
$("confirmDialog").addEventListener("keydown", (event) => event.stopPropagation());
$("confirmDialog").addEventListener("cancel", () => { $("confirmDialog").returnValue = "cancel"; });
$("confirmDialog").addEventListener("close", () => {
  const pending = pendingConfirmation;
  pendingConfirmation = null;
  if (!pending) return;
  if (pending.opener && document.contains(pending.opener)) pending.opener.focus();
  pending.resolve($("confirmDialog").returnValue === "confirm");
});
async function archiveRoom(name) {
  if (!name || !await confirmRoomAction(`Archive room "${name}"?`, "Its conversation, agents and workspace are kept in Archived rooms. You can restore it later.", "Archive room")) return;
  try {
    const result = await api("/api/room/archive", {room:name}); closeSettings();
    if (state.room === name) {
      if (result.rooms?.length) await loadRoom(result.rooms[0].name || result.rooms[0]);
      else showNoRoom();
    }
    await refreshRooms(); toast(`Room "${name}" archived.`);
  } catch (error) { toast(error.message, true); }
}
async function newConversation() {
  const roomName = state.room;
  if (!roomName || !await confirmRoomAction("Clear conversation?", `Save this conversation in history and reset ${state.summary?.seats?.length || 0} agent sessions in "${roomName}"? The room and its agents stay available.`, "Clear conversation")) return;
  if (state.room !== roomName) return;
  try { await api("/api/new", { room: roomName }); closeSettings(); }
  catch (e) { toast(e.message, true); }
}
// Rename/delete work on any room — the one you're viewing (Settings) or one
// you hover in the sidebar — so both flows fetch the target's own details
// before asking you to confirm.
async function renameFlow(name) {
  let info;
  try { info = await api("/api/room?name=" + encodeURIComponent(name)); }
  catch (e) { return toast(e.message, true); }
  const to = prompt(`Rename "${name}" to:`, name);
  if (to === null) return;
  const t = to.trim();
  if (!t || t === name) return;
  const warn = info.room.cfg.projectDir
    ? "" // linked rooms keep their working directory, so sessions survive
    : `\n\nNote: the workspace folder moves with the room, so each agent starts a fresh session (the conversation is replayed to them from the transcript).`;
  if (warn && !confirm(`Rename "${name}" → "${t}"?${warn}`)) return;
  try {
    const r = await api("/api/room/rename", { room: name, to: t });
    closeSettings();
    // Follow the successful response too: the SSE notification may have been
    // missed while disconnected. The shared helper is idempotent if it arrived.
    followRoomRename(name, r.name);
    toast(`Renamed to "${r.name}".`);
    await refreshRooms();
  } catch (e) { toast(e.message, true); }
}
async function deleteFlow(name) {
  let info;
  try { info = await api("/api/room?name=" + encodeURIComponent(name)); }
  catch (e) { return toast(e.message, true); }
  const msgs = info.entries.filter((e) => e.kind === "user" || e.kind === "agent").length;
  const where = info.room.cfg.projectDir
    ? `\n\nYour linked project (${info.room.cfg.projectDir}) is NOT touched — only Parley's own folder for this room.`
    : "\n\nThis includes the room's sandbox workspace and any files the agents made there.";
  if (!confirm(`Delete room "${name}"?\n\n${msgs} message${msgs === 1 ? "" : "s"} and its transcript will be moved to .parley/.trash — recoverable from your file manager until you clear it.${where}`)) return;
  try {
    const r = await api("/api/room/delete", { room: name });
    closeSettings();
    toast(`"${name}" moved to .trash — restore or clear it from your file manager.`);
    if (state.room === name) {
      if (state.es) { state.es.close(); state.es = null; }
      await loadRoom(r.rooms.length ? (r.rooms[0].name || r.rooms[0]) : "default");
    } else {
      await refreshRooms();
    }
  } catch (e) { toast(e.message, true); }
}
$("mRename").onclick = () => renameFlow(state.room);
$("mDelete").onclick = () => deleteFlow(state.room);
$("mDelete").hidden = false;
$("mArchive").onclick = () => archiveRoom(state.room);
$("mNewConv").onclick = newConversation;

// ------------------------------------------------------------ boot
loadRoom(state.room).catch((e) => toast(e.message, true));
input.focus();
