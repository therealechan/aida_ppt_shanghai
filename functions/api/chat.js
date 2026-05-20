const OPS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    explanation: { type: "string" },
    operations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          op: { type: "string", enum: ["replace", "insert_after", "insert_before", "delete"] },
          target_label: { type: ["string", "null"] },
          ref_label: { type: ["string", "null"] },
          section_html: { type: ["string", "null"] },
        },
        required: ["op", "target_label", "ref_label", "section_html"],
      },
    },
  },
  required: ["explanation", "operations"],
};

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const model = body.model || env.DEFAULT_MODEL || "gpt-4o";
  const systemPrompt = buildSystemPrompt(body);
  const userMessages = (body.messages || []).map(toOpenAIMessage);

  const messages = [{ role: "system", content: systemPrompt }, ...userMessages];

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "deck_operations",
          strict: true,
          schema: OPS_SCHEMA,
        },
      },
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(JSON.stringify({ error: "openai_error", detail: text }), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function buildSystemPrompt(body) {
  const focusLabel = body.focus_slide_label || "(none)";
  const focusHtml = body.focus_slide_html || "";
  const neighbors = (body.neighbor_slides || [])
    .map((n) => `--- neighbor "${n.label}" ---\n${n.html_excerpt}`)
    .join("\n\n");
  const allLabels = (body.all_slide_labels || []).join(", ");
  const uploads = (body.attached_images || [])
    .map((u) => `- uploads/${u.hash}.${extFromMime(u.mime)}  (${u.mime}, ${u.size} bytes)`)
    .join("\n");

  return `You are editing slides in an HTML presentation deck. Each slide is a
top-level <section data-screen-label="..." data-bg="..."> with custom Web
Components like <image-slot id="..." shape="..." style="...">.

You may return one or more of these operations:
- replace:        modify an existing slide. The new <section> MUST keep the same
                  data-screen-label and the same id/data-bg, and MUST keep every
                  existing <image-slot id="..."> tag (you may move them inside
                  the section, but never drop one).
- insert_after:   add a new slide after the slide with ref_label. Pick a new
                  data-screen-label that does NOT collide with any existing one
                  (numbering convention is "NN 标题", continue it).
- insert_before:  same, before ref_label.
- delete:         remove the slide identified by target_label.

Return JSON exactly matching the provided schema. Set unused fields to null.
If you propose multiple operations they will all be applied in one git commit.

Focused slide (the slide the user is currently viewing) is "${focusLabel}":
\`\`\`html
${focusHtml}
\`\`\`

Adjacent slides (for style reference when inserting/composing new ones):
${neighbors || "(none)"}

All existing slide labels (use these as target_label / ref_label):
${allLabels}

Uploaded images available this turn (reference in HTML as the indicated path):
${uploads || "(none)"}

Keep edits scoped to what the user asked for. Do not invent new image-slot ids
unless they are clearly needed. Prefer plain <img src="uploads/<hash>.<ext>">
when inserting user-uploaded images.`;
}

function toOpenAIMessage(m) {
  if (m.role === "user" && Array.isArray(m.attachments) && m.attachments.length) {
    const parts = [{ type: "text", text: m.content || "" }];
    for (const a of m.attachments) {
      if (a.dataUrl && a.dataUrl.startsWith("data:image/")) {
        parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
      }
    }
    return { role: "user", content: parts };
  }
  return { role: m.role, content: m.content };
}

function extFromMime(mime) {
  if (!mime) return "bin";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
}
