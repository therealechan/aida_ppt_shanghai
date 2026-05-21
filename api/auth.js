import { onRequestPost, onRequestDelete } from "../functions/api/auth.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  const env = process.env;
  if (request.method === "POST") return onRequestPost({ request, env });
  if (request.method === "DELETE") return onRequestDelete({ request, env });
  return methodNotAllowed();
}

function methodNotAllowed() {
  return new Response(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
