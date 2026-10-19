import type { ImageItem, ProductForm } from "./helpers";

// One-shot hand-off from the "Add with AI" dialog to the create form.
//
// Module state on purpose: it survives the client navigation to
// …/products/new, it is gone on a reload, and nothing is left in storage for a
// later manual "Add Product". The editor peeks it once into its own state and
// clears it on mount, so React StrictMode's double effects cannot lose it.

/** What the AI route answers with (every field may be null). */
export interface AiSuggestion {
  title: string | null;
  description: string | null;
  brand_id: number | null;
  category_id: number | null;
  sub_category_id: number | null;
  sub_sub_category_id: number | null;
}

export interface AiPrefill {
  suggestion: AiSuggestion;
  image: ImageItem;
}

let pending: { sellerId: string; value: AiPrefill } | null = null;

export function setAiPrefill(sellerId: string, value: AiPrefill): void {
  pending = { sellerId: String(sellerId), value };
}

/** The hand-off for THIS shop, without consuming it. */
export function peekAiPrefill(sellerId: string): AiPrefill | null {
  return pending && pending.sellerId === String(sellerId) ? pending.value : null;
}

export function clearAiPrefill(sellerId: string): void {
  if (pending && pending.sellerId === String(sellerId)) pending = null;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Plain AI text → the editor's HTML: escaped, one <p> per paragraph. */
export function descriptionToHtml(text: string | null): string {
  if (!text) return "";
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Lay the suggestion and the photo over a form. Empty AI fields stay empty. */
export function applyAiSuggestion(form: ProductForm, prefill: AiPrefill): ProductForm {
  const s = prefill.suggestion;
  const one = (id: number | null) => (id === null || id === undefined ? [] : [id]);
  return {
    ...form,
    name: s.title ?? "",
    description: descriptionToHtml(s.description),
    brand_id: s.brand_id === null || s.brand_id === undefined ? "" : String(s.brand_id),
    category_id: one(s.category_id),
    sub_category_id: one(s.sub_category_id),
    sub_sub_category_id: one(s.sub_sub_category_id),
    images: [{ ...prefill.image, isNew: true }, ...form.images],
  };
}
