import type { ImageItem, ProductForm } from "./helpers";

// One-shot hand-off from the "Add with AI" dialog to the create form.
//
// Module state on purpose: it survives the client navigation to
// …/products/new, it is gone on a reload, and nothing is left in storage for a
// later manual "Add Product". The editor peeks it once into its own state and
// clears it on mount, so React StrictMode's double effects cannot lose it.

/** The product languages the create form offers (`LANGS` in sections.tsx).
 *  The route keeps its own copy — this file is client code. */
const PRODUCT_LANGUAGES = ["en", "ar", "tr", "ku"];

/** The product language for a page locale (`sy-ar` → `ar`); English when the
 *  locale's language is not one the form offers. */
export function productLanguage(local: string | undefined): string {
  const raw = local || "";
  const code = (raw.includes("-") ? raw.split("-")[1] : raw).trim().toLowerCase();
  return PRODUCT_LANGUAGES.includes(code) ? code : "en";
}

/** What the AI route answers with (every text field may be null). */
export interface AiSuggestion {
  title: string | null;
  description: string | null;
  similar_words: string[];
  meta_title: string | null;
  meta_description: string | null;
  brand_id: number | null;
  category_id: number | null;
  sub_category_id: number | null;
  sub_sub_category_id: number | null;
}

export interface AiPrefill {
  suggestion: AiSuggestion;
  image: ImageItem;
  /** The language the text is written in — the seller's page language. */
  language: string;
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

/**
 * Lay the suggestion and the photo over a form. Empty AI fields stay empty.
 *
 * The text goes into the translation row of the seller's language, which
 * becomes the product's default language — the create form shows exactly that
 * row. The photo is also the meta image: a bare file name, as the gallery
 * picker sets it.
 */
export function applyAiSuggestion(form: ProductForm, prefill: AiPrefill): ProductForm {
  const s = prefill.suggestion;
  const one = (id: number | null) => (id === null || id === undefined ? [] : [id]);
  const language = productLanguage(prefill.language);
  const name = s.title ?? "";
  const description = descriptionToHtml(s.description);
  return {
    ...form,
    name,
    description,
    brand_id: s.brand_id === null || s.brand_id === undefined ? "" : String(s.brand_id),
    category_id: one(s.category_id),
    sub_category_id: one(s.sub_category_id),
    sub_sub_category_id: one(s.sub_sub_category_id),
    images: [{ ...prefill.image, isNew: true }, ...form.images],
    meta_title: s.meta_title ?? "",
    meta_description: s.meta_description ?? "",
    meta_image: prefill.image.name,
    meta_image_url: prefill.image.url,
    default_language_code: language,
    translations: [
      {
        language_code: language,
        name,
        description,
        similar_words: Array.isArray(s.similar_words) ? s.similar_words : [],
      },
    ],
  };
}
