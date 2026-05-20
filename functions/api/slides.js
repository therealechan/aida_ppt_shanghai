import { getFile } from "../lib/github.js";
import { loadDeck } from "../lib/slide-parse.js";

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { content } = await getFile(env, "index.html");
    const deck = loadDeck(content);
    const slides = deck.sections().map((s) => ({
      label: s.getAttribute("data-screen-label") || "(no label)",
      bg: s.getAttribute("data-bg") || null,
      slot_ids: deck.imageSlotIdsIn(s),
    }));
    return json({ slides });
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
