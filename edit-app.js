// /edit frontend.
// Single-file ES module, no framework. Handles auth gate, slide list,
// iframe srcdoc preview, OpenAI chat (SSE), image upload (client-side hash,
// remembered for next save), save (single git commit), and standalone export
// (via web worker).

const $ = (sel) => document.querySelector(sel);

const state = {
  slides: [],                  // [{ label, slot_ids, deleted?, inserted? }]
  activeLabel: null,
  fullHtml: null,              // current deployed index.html (string) — base for diff/preview
  workingHtml: null,           // fullHtml + locally-applied ops, fed to iframe
  chatHistory: [],             // { role, content, attachments? }
  pendingOps: [],              // ops not yet saved
  pendingUploads: new Map(),   // hash -> { hash, mime, base64, dataUrl, size, path }
  attachmentsForNextSend: [],  // [{ hash, mime, dataUrl, size, path }]
};

// ─── Auth gate ────────────────────────────────────────────────────────────

async function init() {
  try {
    const probe = await fetch("/api/slides", { credentials: "same-origin" });
    if (probe.status === 401) return showGate();
    if (!probe.ok) throw new Error(`probe failed: ${probe.status}`);
    const data = await probe.json();
    state.slides = data.slides;
    await bootEditor();
  } catch (e) {
    showGate(String(e.message || e));
  }
}

function showGate(prefill) {
  $("#gate").hidden = false;
  $("#app").hidden = true;
  if (prefill) showErr(prefill);
  $("#gate-form").addEventListener("submit", onGateSubmit);
}

async function onGateSubmit(e) {
  e.preventDefault();
  const pw = $("#gate-pw").value;
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password: pw }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    showErr(body.error || `error ${res.status}`);
    return;
  }
  location.reload();
}

function showErr(msg) {
  const el = $("#gate-err");
  el.textContent = msg;
  el.hidden = false;
}

// ─── Boot editor (after auth) ──────────────────────────────────────────────

async function bootEditor() {
  $("#gate").hidden = true;
  $("#app").hidden = false;

  const htmlRes = await fetch("/index.html?_t=" + Date.now(), { cache: "no-store" });
  state.fullHtml = await htmlRes.text();
  state.workingHtml = state.fullHtml;

  renderSlideList();
  $("#chat-form").addEventListener("submit", onChatSubmit);
  $("#image-input").addEventListener("change", onImagePicked);
  $("#save-btn").addEventListener("click", onSave);
  $("#export-btn").addEventListener("click", onExport);
  $("#logout-btn").addEventListener("click", onLogout);

  // pick first slide
  if (state.slides.length) selectSlide(state.slides[0].label);
}

function renderSlideList() {
  const ul = $("#slides");
  ul.innerHTML = "";
  for (const s of state.slides) {
    const li = document.createElement("li");
    li.textContent = s.label;
    if (s.label === state.activeLabel) li.classList.add("active");
    if (s.deleted) li.classList.add("deleted");
    if (s.inserted) li.classList.add("new");
    li.addEventListener("click", () => selectSlide(s.label));
    ul.appendChild(li);
  }
}

function selectSlide(label) {
  state.activeLabel = label;
  $("#preview-label").textContent = label;
  renderSlideList();
  refreshPreview();
}

// Render working HTML in iframe via srcdoc, scroll to the active slide.
function refreshPreview() {
  const iframe = $("#preview-frame");
  const html = state.workingHtml || state.fullHtml;
  // The deck uses location.hash for slide navigation; we can inject a small
  // post-load nav script. For simplicity we just write the HTML and let the
  // user scroll / use the deck's own navigation.
  iframe.srcdoc = html;
  // After load, ask the deck to jump to the active slide if possible.
  iframe.onload = () => {
    try {
      const stage = iframe.contentDocument.querySelector("deck-stage");
      const sections = iframe.contentDocument.querySelectorAll("body > section, deck-stage > section");
      const idx = Array.from(sections).findIndex(
        (s) => s.getAttribute("data-screen-label") === state.activeLabel
      );
      if (idx >= 0 && stage && typeof stage.gotoSlide === "function") {
        stage.gotoSlide(idx);
      } else if (idx >= 0) {
        sections[idx].scrollIntoView({ behavior: "instant", block: "start" });
      }
    } catch {
      // cross-origin sandboxing — ignore
    }
  };
}

// ─── Chat ──────────────────────────────────────────────────────────────────

async function onChatSubmit(e) {
  e.preventDefault();
  const input = $("#chat-input");
  const text = input.value.trim();
  const attachments = state.attachmentsForNextSend.slice();
  if (!text && attachments.length === 0) return;
  input.value = "";
  state.attachmentsForNextSend = [];
  renderAttachments();

  const userMsg = { role: "user", content: text, attachments };
  state.chatHistory.push(userMsg);
  appendChatMessage(userMsg);

  const assistantBubble = appendChatMessage({ role: "assistant", content: "" });
  setStatus("AI 思考中…");

  const focus = await fetchSlideContext(state.activeLabel);

  const body = {
    model: $("#model-select").value,
    focus_slide_label: state.activeLabel,
    focus_slide_html: focus.section_html,
    neighbor_slides: focus.neighbors,
    all_slide_labels: focus.all_labels,
    messages: state.chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: (m.attachments || []).map((a) => ({ dataUrl: a.dataUrl })),
    })),
    attached_images: attachments.map((a) => ({
      hash: a.hash, mime: a.mime, size: a.size,
    })),
  };

  let fullText;
  try {
    fullText = await streamChat(body, (chunk) => {
      // We don't pretty-stream JSON; show "..." dots while waiting.
      assistantBubble.querySelector(".bubble-text").textContent = chunk;
    });
  } catch (e) {
    assistantBubble.querySelector(".bubble-text").textContent = `error: ${e.message}`;
    setStatus("");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(fullText);
  } catch (e) {
    assistantBubble.querySelector(".bubble-text").textContent =
      `(AI 返回了无法解析的 JSON)\n\n${fullText.slice(0, 400)}`;
    setStatus("");
    return;
  }

  state.chatHistory.push({ role: "assistant", content: fullText });
  renderAssistantTurn(assistantBubble, parsed);

  // Stage ops + uploads
  state.pendingOps.push(...parsed.operations);
  for (const a of attachments) {
    state.pendingUploads.set(a.hash, a);
  }
  applyPendingToWorking();
  $("#save-btn").disabled = state.pendingOps.length === 0 && state.pendingUploads.size === 0;
  $("#dirty-indicator").hidden = $("#save-btn").disabled;
  refreshPreview();
  setStatus(`${parsed.operations.length} op(s) staged — click Save to deploy`);
}

async function fetchSlideContext(label) {
  const res = await fetch(`/api/slide?label=${encodeURIComponent(label)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`slide fetch failed: ${res.status}`);
  return res.json();
}

async function streamChat(body, onProgress) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`chat ${res.status}: ${t.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        const delta = ev.choices?.[0]?.delta?.content;
        if (delta) {
          accumulated += delta;
          onProgress(accumulated);
        }
      } catch {
        // ignore stream chunks that aren't JSON
      }
    }
  }
  return accumulated;
}

function appendChatMessage(msg) {
  const log = $("#chat-log");
  const el = document.createElement("div");
  el.className = `msg ${msg.role}`;
  const text = document.createElement("div");
  text.className = "bubble-text";
  text.textContent = msg.content || "…";
  el.appendChild(text);
  if (msg.attachments && msg.attachments.length) {
    for (const a of msg.attachments) {
      const img = document.createElement("img");
      img.className = "thumb";
      img.src = a.dataUrl;
      el.appendChild(img);
    }
  }
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function renderAssistantTurn(bubble, parsed) {
  bubble.querySelector(".bubble-text").textContent = parsed.explanation || "(done)";
  if (parsed.operations.length) {
    const ops = document.createElement("div");
    ops.className = "ops-summary";
    for (const op of parsed.operations) {
      const row = document.createElement("div");
      row.textContent = describeOp(op);
      ops.appendChild(row);
    }
    bubble.appendChild(ops);
  }
}

function describeOp(op) {
  if (op.op === "replace") return `✏️  replace ${op.target_label}`;
  if (op.op === "insert_after") return `➕  insert after ${op.ref_label}`;
  if (op.op === "insert_before") return `➕  insert before ${op.ref_label}`;
  if (op.op === "delete") return `🗑  delete ${op.target_label}`;
  return JSON.stringify(op);
}

// ─── Apply pending ops to working HTML for preview ────────────────────────

function applyPendingToWorking() {
  let html = state.fullHtml;
  // Use DOMParser for client-side splice.
  const doc = new DOMParser().parseFromString(html, "text/html");
  const findByLabel = (label) =>
    doc.querySelector(`section[data-screen-label="${cssEscape(label)}"]`);

  // also reset state.slides annotations
  state.slides.forEach((s) => { s.deleted = false; s.inserted = false; });

  for (const op of state.pendingOps) {
    if (op.op === "replace") {
      const t = findByLabel(op.target_label);
      if (!t) continue;
      const tmp = doc.createElement("div");
      tmp.innerHTML = op.section_html;
      const next = tmp.firstElementChild;
      t.replaceWith(next);
    } else if (op.op === "insert_after" || op.op === "insert_before") {
      const ref = findByLabel(op.ref_label);
      if (!ref) continue;
      const tmp = doc.createElement("div");
      tmp.innerHTML = op.section_html;
      const next = tmp.firstElementChild;
      if (op.op === "insert_after") {
        ref.parentNode.insertBefore(next, ref.nextSibling);
      } else {
        ref.parentNode.insertBefore(next, ref);
      }
      const newLabel = next.getAttribute("data-screen-label");
      if (newLabel && !state.slides.find((s) => s.label === newLabel)) {
        state.slides.push({ label: newLabel, slot_ids: [], inserted: true });
      }
    } else if (op.op === "delete") {
      const t = findByLabel(op.target_label);
      if (t) t.remove();
      const s = state.slides.find((x) => x.label === op.target_label);
      if (s) s.deleted = true;
    }
  }

  state.workingHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  renderSlideList();
}

function cssEscape(s) {
  return s.replace(/"/g, '\\"');
}

// ─── Image upload (client-side: validate + hash, save in next commit) ─────

async function onImagePicked(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";
  for (const f of files) await stageFile(f);
  renderAttachments();
}

async function stageFile(file) {
  if (file.size > 4 * 1024 * 1024) {
    // compress oversized
    file = await compressImage(file);
  }
  const buf = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buf);
  const dataUrl = `data:${file.type};base64,${base64}`;

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ mime: file.type, base64 }),
  });
  if (!res.ok) {
    toast("upload failed: " + (await res.text()).slice(0, 200), "err");
    return;
  }
  const meta = await res.json();
  const entry = {
    hash: meta.hash,
    mime: meta.mime,
    size: meta.size,
    path: meta.path,
    base64,
    dataUrl,
  };
  state.attachmentsForNextSend.push(entry);
}

function renderAttachments() {
  const root = $("#attachments");
  root.innerHTML = "";
  for (const a of state.attachmentsForNextSend) {
    const chip = document.createElement("div");
    chip.className = "att-chip";
    const img = document.createElement("img");
    img.src = a.dataUrl;
    chip.appendChild(img);
    chip.appendChild(document.createTextNode(`${a.path} (${(a.size / 1024).toFixed(0)} KB)`));
    const x = document.createElement("button");
    x.type = "button";
    x.textContent = "×";
    x.addEventListener("click", () => {
      state.attachmentsForNextSend = state.attachmentsForNextSend.filter((y) => y !== a);
      renderAttachments();
    });
    chip.appendChild(x);
    root.appendChild(chip);
  }
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 1600;
      let { width, height } = img;
      const ratio = Math.min(1, max / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("compress failed"));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
        },
        "image/webp",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function arrayBufferToBase64(buf) {
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// ─── Save ──────────────────────────────────────────────────────────────────

async function onSave() {
  if (state.pendingOps.length === 0 && state.pendingUploads.size === 0) return;
  $("#save-btn").disabled = true;
  setStatus("Saving to GitHub…");

  const body = {
    operations: state.pendingOps,
    pending_uploads: Array.from(state.pendingUploads.values()).map((u) => ({
      hash: u.hash, mime: u.mime, path: u.path, base64: u.base64,
    })),
    explanation: lastAssistantExplanation() || "edit via /edit",
  };

  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(`save failed: ${data.error || res.status}`, "err");
      $("#save-btn").disabled = false;
      setStatus("");
      return;
    }
    toast(`✅ Committed ${data.commit_sha.slice(0, 7)} — live in ~60s`, "ok");

    // Clear pending state
    state.pendingOps = [];
    state.pendingUploads.clear();
    state.fullHtml = state.workingHtml;
    $("#dirty-indicator").hidden = true;
    setStatus("");

    // Refresh slide list from server after a delay so CF Pages catches up.
    setTimeout(refreshSlideListFromServer, 1500);
  } catch (e) {
    toast(`save error: ${e.message}`, "err");
    $("#save-btn").disabled = false;
    setStatus("");
  }
}

function lastAssistantExplanation() {
  for (let i = state.chatHistory.length - 1; i >= 0; i--) {
    const m = state.chatHistory[i];
    if (m.role !== "assistant") continue;
    try {
      const p = JSON.parse(m.content);
      if (p.explanation) return p.explanation;
    } catch {}
  }
  return null;
}

async function refreshSlideListFromServer() {
  try {
    const res = await fetch("/api/slides", { credentials: "same-origin" });
    if (!res.ok) return;
    const data = await res.json();
    state.slides = data.slides;
    renderSlideList();
  } catch {}
}

// ─── Export (Web Worker) ──────────────────────────────────────────────────

function onExport() {
  toast("📦 Exporting standalone… (may take 20–60s)", "");
  const worker = new Worker("/export-worker.js", { type: "module" });
  worker.onmessage = (e) => {
    if (e.data.error) {
      toast(`export failed: ${e.data.error}`, "err");
      worker.terminate();
      return;
    }
    if (e.data.progress) {
      setStatus(`exporting: ${e.data.progress}`);
      return;
    }
    if (e.data.html) {
      const blob = new Blob([e.data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aida-geo-deck-standalone-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`✅ Exported (${(blob.size / 1024 / 1024).toFixed(1)} MB)`, "ok");
      setStatus("");
      worker.terminate();
    }
  };
  worker.onerror = (e) => {
    toast(`export crashed: ${e.message}`, "err");
    worker.terminate();
  };
  worker.postMessage({ baseUrl: location.origin });
}

// ─── Misc ──────────────────────────────────────────────────────────────────

async function onLogout() {
  await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" });
  location.reload();
}

function setStatus(s) {
  $("#chat-status").textContent = s || "";
}

function toast(msg, kind) {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast " + (kind || "");
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 5000);
}

init();
