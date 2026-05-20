// Main Cloudflare Worker entry. Routes /api/* to handler modules; everything
// else is served by the static assets binding (configured in wrangler.jsonc).

import { verifyCookie } from "./functions/lib/auth.js";

import * as authApi from "./functions/api/auth.js";
import * as slidesApi from "./functions/api/slides.js";
import * as slideApi from "./functions/api/slide.js";
import * as chatApi from "./functions/api/chat.js";
import * as uploadApi from "./functions/api/upload.js";
import * as saveApi from "./functions/api/save.js";

const ROUTES = {
  "/api/auth":   { POST: authApi.onRequestPost,   DELETE: authApi.onRequestDelete, public: true },
  "/api/slides": { GET:  slidesApi.onRequestGet },
  "/api/slide":  { GET:  slideApi.onRequestGet },
  "/api/chat":   { POST: chatApi.onRequestPost },
  "/api/upload": { POST: uploadApi.onRequestPost },
  "/api/save":   { POST: saveApi.onRequestPost },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (!pathname.startsWith("/api/")) {
      // Defer to static assets (configured via assets binding).
      return env.ASSETS.fetch(request);
    }

    const route = ROUTES[pathname];
    if (!route) return json({ error: "not_found", path: pathname }, 404);

    const handler = route[request.method];
    if (!handler) return json({ error: "method_not_allowed", method: request.method }, 405);

    if (!route.public) {
      const unauthorized = await checkAuth(request, env);
      if (unauthorized) return unauthorized;
    }

    try {
      return await handler({ request, env, params: {} });
    } catch (e) {
      return json({ error: "handler_crashed", detail: String(e.message || e) }, 500);
    }
  },
};

async function checkAuth(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const token = parseCookie(cookieHeader, "edit_session");
  if (!token) return json({ error: "unauthorized" }, 401);
  if (!env.AUTH_SECRET) return json({ error: "server_misconfigured" }, 500);
  const ok = await verifyCookie(token, env.AUTH_SECRET);
  if (!ok) return json({ error: "unauthorized" }, 401);
  return null;
}

function parseCookie(header, name) {
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
