import { issueCookie, constantTimeEqual } from "../lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const password = body?.password;
  if (typeof password !== "string") return json({ error: "password_required" }, 400);

  if (!env.EDIT_PASSWORD || !env.AUTH_SECRET) {
    return json({ error: "server_misconfigured" }, 500);
  }

  if (!constantTimeEqual(password, env.EDIT_PASSWORD)) {
    return json({ error: "invalid_password" }, 401);
  }

  const token = await issueCookie(env.AUTH_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `edit_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${
        7 * 24 * 60 * 60
      }`,
    },
  });
}

export async function onRequestDelete() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `edit_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
