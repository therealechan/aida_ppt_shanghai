import { onRequestPost } from "../functions/api/chat.js";
import { requireAuth } from "../functions/lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  const env = process.env;
  if (request.method !== "POST") return methodNotAllowed();
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  return onRequestPost({ request, env });
}

function methodNotAllowed() {
  return new Response(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
