// We do NOT write to GitHub here. We just validate and hash the image so the
// frontend can reference it during a chat turn. The actual git blob is created
// inside /api/save (so image + slide change land in a single commit).

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

export async function onRequestPost(context) {
  const { request } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { mime, base64 } = body || {};
  if (!ALLOWED.has(mime)) return json({ error: "unsupported_mime", mime }, 400);
  if (typeof base64 !== "string") return json({ error: "base64_required" }, 400);

  let bytes;
  try {
    bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch {
    return json({ error: "invalid_base64" }, 400);
  }
  if (bytes.length > MAX_BYTES) {
    return json({ error: "too_large", bytes: bytes.length, max: MAX_BYTES }, 413);
  }

  const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
  const hash = bytesToHex(hashBuf).slice(0, 16);

  return json({
    tempId: hash,
    hash,
    mime,
    size: bytes.length,
    path: `uploads/${hash}.${extFromMime(mime)}`,
  });
}

function bytesToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
