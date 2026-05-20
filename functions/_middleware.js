import { verifyCookie } from "./lib/auth.js";

const PUBLIC_PREFIXES = ["/api/auth"];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/")) return next();
  if (PUBLIC_PREFIXES.some((p) => url.pathname === p)) return next();

  const cookieHeader = request.headers.get("Cookie") || "";
  const token = parseCookie(cookieHeader, "edit_session");
  if (!token) return unauthorized();

  const ok = await verifyCookie(token, env.AUTH_SECRET);
  if (!ok) return unauthorized();

  return next();
}

function parseCookie(header, name) {
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
