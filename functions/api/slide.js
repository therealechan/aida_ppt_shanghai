import { getFile } from "../lib/github.js";
import { loadDeck } from "../lib/slide-parse.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const label = new URL(request.url).searchParams.get("label");
  if (!label) return json({ error: "label_required" }, 400);

  try {
    const [{ content: html }, stateRes] = await Promise.all([
      getFile(env, "index.html"),
      getFile(env, ".image-slots.state.json").catch(() => null),
    ]);

    const deck = loadDeck(html);
    const section = deck.findByLabel(label);
    if (!section) return json({ error: "not_found" }, 404);

    const sectionHtml = section.outerHTML;
    const slotIds = deck.imageSlotIdsIn(section);

    let slotState = {};
    if (stateRes) {
      try {
        const parsed = JSON.parse(stateRes.content);
        for (const id of slotIds) if (parsed[id]) slotState[id] = parsed[id];
      } catch {
        // ignore
      }
    }

    const all = deck.slideLabels();
    const idx = all.indexOf(label);
    const neighborLabels = [];
    if (idx > 0) neighborLabels.push(all[idx - 1]);
    if (idx < all.length - 1) neighborLabels.push(all[idx + 1]);
    const neighbors = neighborLabels.map((nl) => {
      const n = deck.findByLabel(nl);
      // excerpt: strip image-slot inner data URIs to keep small
      let excerpt = n.outerHTML;
      if (excerpt.length > 4000) excerpt = excerpt.slice(0, 4000) + "<!-- truncated -->";
      return { label: nl, html_excerpt: excerpt };
    });

    return json({
      label,
      section_html: sectionHtml,
      slot_ids: slotIds,
      slot_state: slotState,
      neighbors,
      all_labels: all,
    });
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
