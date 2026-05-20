import { parseHTML } from "linkedom";

// Parse the deck HTML and return a wrapper with utilities.
export function loadDeck(html) {
  const { document } = parseHTML(html);
  return new Deck(document, html);
}

export class Deck {
  constructor(document, originalHtml) {
    this.document = document;
    this.originalHtml = originalHtml;
  }

  sections() {
    return Array.from(this.document.querySelectorAll("body > section, deck-stage > section"));
  }

  // We treat data-screen-label as the stable identifier for ops.
  slideLabels() {
    return this.sections().map((s) => s.getAttribute("data-screen-label")).filter(Boolean);
  }

  findByLabel(label) {
    return this.sections().find(
      (s) => s.getAttribute("data-screen-label") === label
    );
  }

  imageSlotIds() {
    return Array.from(this.document.querySelectorAll("image-slot[id]")).map((n) =>
      n.getAttribute("id")
    );
  }

  imageSlotIdsIn(sectionEl) {
    return Array.from(sectionEl.querySelectorAll("image-slot[id]")).map((n) =>
      n.getAttribute("id")
    );
  }

  // Serialize back to a string. linkedom round-trips reasonably; for safety we
  // splice into the original HTML using the section's outerHTML positions if
  // available. For v1 we trust linkedom.
  serialize() {
    return "<!DOCTYPE html>\n" + this.document.documentElement.outerHTML;
  }
}

// Parse a section HTML string into a single <section> element node.
export function parseSection(sectionHtml) {
  const { document } = parseHTML(`<!doctype html><html><body>${sectionHtml}</body></html>`);
  const section = document.querySelector("body > section");
  if (!section) throw new Error("section_html does not contain a <section> root");
  return section;
}

// Apply ordered operations against a Deck. Returns { deck, orphanSlotIds }.
// Throws on validation failure.
export function applyOperations(deck, operations) {
  const orphanSlotIds = new Set();
  const existingLabels = new Set(deck.slideLabels());

  for (const op of operations) {
    switch (op.op) {
      case "replace": {
        const target = deck.findByLabel(op.target_label);
        if (!target) throw new Error(`replace: slide not found: ${op.target_label}`);
        const newSection = parseSection(op.section_html);

        const newLabel = newSection.getAttribute("data-screen-label");
        if (newLabel !== op.target_label) {
          throw new Error(
            `replace: data-screen-label must stay "${op.target_label}", got "${newLabel}"`
          );
        }

        const preservedAttrs = ["id", "data-bg"];
        for (const attr of preservedAttrs) {
          const orig = target.getAttribute(attr);
          const next = newSection.getAttribute(attr);
          if (orig && orig !== next) {
            throw new Error(
              `replace: must preserve attribute ${attr}="${orig}" (got "${next}")`
            );
          }
        }

        const originalSlots = new Set(deck.imageSlotIdsIn(target));
        const newSlots = new Set(deck.imageSlotIdsIn(newSection));
        for (const id of originalSlots) {
          if (!newSlots.has(id)) {
            throw new Error(`replace: image-slot id="${id}" was removed`);
          }
        }

        target.replaceWith(newSection);
        break;
      }

      case "insert_after":
      case "insert_before": {
        const ref = deck.findByLabel(op.ref_label);
        if (!ref) throw new Error(`${op.op}: ref slide not found: ${op.ref_label}`);
        const newSection = parseSection(op.section_html);
        const newLabel = newSection.getAttribute("data-screen-label");
        if (!newLabel) throw new Error(`${op.op}: new section must have data-screen-label`);
        if (existingLabels.has(newLabel)) {
          throw new Error(`${op.op}: data-screen-label "${newLabel}" already exists`);
        }
        existingLabels.add(newLabel);

        if (op.op === "insert_after") {
          ref.parentNode.insertBefore(newSection, ref.nextSibling);
        } else {
          ref.parentNode.insertBefore(newSection, ref);
        }
        break;
      }

      case "delete": {
        const target = deck.findByLabel(op.target_label);
        if (!target) throw new Error(`delete: slide not found: ${op.target_label}`);
        for (const id of deck.imageSlotIdsIn(target)) orphanSlotIds.add(id);
        target.remove();
        existingLabels.delete(op.target_label);
        break;
      }

      default:
        throw new Error(`unknown op: ${op.op}`);
    }
  }

  return { deck, orphanSlotIds: Array.from(orphanSlotIds) };
}
