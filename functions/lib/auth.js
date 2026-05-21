const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function issueCookie(secret) {
  const expiry = Date.now() + COOKIE_TTL_MS;
  const payload = String(expiry);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${bytesToHex(sig)}`;
}

export async function verifyCookie(token, secret) {
  if (!token || !secret) return false;
  const [payload, sigHex] = token.split(".");
  if (!payload || !sigHex) return false;

  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const key = await hmacKey(secret);
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(sigHex),
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

export function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns null if the request carries a valid edit_session cookie, otherwise a
// 401/500 Response that the caller should return directly.
export async function requireAuth(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  let token = null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === "edit_session") { token = rest.join("="); break; }
  }
  if (!token) return unauthorized();
  if (!env.AUTH_SECRET) return serverError();
  const ok = await verifyCookie(token, env.AUTH_SECRET);
  return ok ? null : unauthorized();
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function serverError() {
  return new Response(JSON.stringify({ error: "server_misconfigured" }), {
    status: 500,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
