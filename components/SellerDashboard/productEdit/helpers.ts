/**
 * Pure data layer for the seller-dashboard product editor.
 *
 * The `/shop/products/{id}/edit` response gives the product's editable columns
 * + precomputed selections + `lookups`. We map that into a single flat,
 * input-friendly `ProductForm` (all numbers held as strings so empty inputs
 * round-trip cleanly), and on save rebuild the exact field set the website
 * seller-edit form posts — multipart FormData with flat variant keys, indexed
 * `custom_data`, and JSON `sync_color_images` / `extra_price_for_country`.
 *
 * The contract this mirrors is the code-verified body contract, kept OUT of this
 * repository: it cites unpatched backend defects with backend file:line
 * references and this repo is public. Ask the seller-dashboard owner for
 * `shop-product-body-contract.md` + `shop-product-body-payloads.txt`.
 */

import { translateFunction } from "utils/functions";
import { sanitizeHtml } from "utils/sanitizeHtml";

// Aliased `tx` (not `t`) because `t` is used as a local param/var below.
const tx = (s: string) => translateFunction(s);

export const UNITS = ["pc", "kg", "gms", "l"] as const;

/**
 * Base language of a product's `custom_data` rows, sent as `default_language_code`.
 *
 * Deliberately typed as the literal `"en"` (not `string`) so it can never be
 * widened into caller-supplied data that would be echoed into a backend payload.
 *
 * This is a product-content contract value and is intentionally NOT derived from
 * the storefront i18n default in `proxy.ts`: that one is the request-scoped,
 * user-facing UI language and legitimately varies per visitor. Coupling them
 * would let a locale change silently alter stored product data.
 */
export const DEFAULT_LANGUAGE_CODE: "en" = "en";

/* --------------------------------- types --------------------------------- */

export interface ColorLookup {
  id: number;
  code: string;
  name: string;
}
export interface SizeLookup {
  id: number;
  name: string;
}
export interface CountryLookup {
  id: number;
  iso: string;
  nicename: string;
}
export interface CategoryLookup {
  id: number;
  name: string;
  parent_id?: number;
}
export interface LabelLookup {
  id: number;
  label: string;
}
export interface NamedLookup {
  id: number;
  name: string;
}
export type DescriptorType = "string_choice" | "numeric";
export interface DescriptorLookup {
  id: number;
  name: string;
  descriptor_group_id: number;
  icon?: string;
  type: DescriptorType | string;
  /** Backend sends a JSON-encoded string, e.g. '["Glossy","Matte"]'. Parse with
   *  parseDescriptorOptions. Only meaningful for string_choice descriptors. */
  options?: string | string[];
}
export interface DescriptorGroup {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  descriptors: DescriptorLookup[];
}

/** The backend `options` field is a JSON-encoded string ('["A","B"]'); tolerate
 *  an already-parsed array too. Returns [] for missing/blank/invalid input. */
export function parseDescriptorOptions(raw: string | string[] | undefined | null): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

/** A descriptor is renderable in the editor when the seller can supply a value:
 *  numeric always (free number input); string_choice only if it has options. */
export function descriptorHasInput(d: DescriptorLookup): boolean {
  return d.type === "numeric" || parseDescriptorOptions(d.options).length > 0;
}

/** Groups/descriptors the editor should actually render: drop descriptors with
 *  no input and groups left with none (design rule: never show an empty group,
 *  never show a descriptor without options). */
export function renderableDescriptorGroups(groups: DescriptorGroup[]): DescriptorGroup[] {
  return (groups || [])
    .map((g) => ({ ...g, descriptors: (g.descriptors || []).filter(descriptorHasInput) }))
    .filter((g) => g.descriptors.length > 0);
}

export interface Lookups {
  parent_categories: CategoryLookup[];
  sub_categories: CategoryLookup[];
  sub_sub_categories: CategoryLookup[];
  boutiques: NamedLookup[];
  brands: NamedLookup[];
  colors: ColorLookup[];
  sizes: SizeLookup[];
  countries: CountryLookup[];
  labels: LabelLookup[];
  tags: NamedLookup[];
  descriptor_groups: DescriptorGroup[];
  units: string[];
}

export interface VariantRow {
  price: string;
  discount: string;
  luck: string;
  qty: string;
  sku: string;
  barcode: string;
}

export interface ImageItem {
  name: string; // filename sent to the backend
  url: string; // full URL / object URL for preview
  isNew?: boolean;
}

export interface SelColor {
  code: string;
  name: string;
  id?: number;
}
export interface SelSize {
  id: number;
  name: string;
}
export interface ExtraPrice {
  country_iso: string;
  extra_price: string;
}
export interface Translation {
  /** Row id from the edit response. The backend matches translation rows with
   *  updateOrCreate(['id' => …]), so an entry sent without its id targets
   *  id = null and writes the wrong row (contract §1h/§4). Absent on create,
   *  where no row exists yet — never invent one. */
  id?: number | string;
  language_code: string;
  name: string;
  description: string;
  similar_words: string[];
}

export function parseSimilarWords(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export interface ProductForm {
  name: string;
  unit: string;
  barcode: string;
  seller_product_id: string;
  description: string;
  brand_id: string;
  boutique_id: string;
  label: string;
  model_number: string;
  report_ref_number: string;
  location_id: string;
  unit_price: string;
  discount_price: string;
  purchase_price: string;
  luck_price: string;
  current_stock: string;
  weight: string;
  max_allowed_qty: string;
  count_of_pieces: string;
  shipping_cost: string;
  shipping_days: string;
  tax: string;
  tax_type: string;
  multiply_qty: number;
  packed_after_ordering: number;
  meta_title: string;
  meta_description: string;
  meta_image: string; // filename for payload
  meta_image_url: string; // preview
  origin_country_iso: string;
  status: number; // display only — changed via change-status
  category_id: number[];
  sub_category_id: number[];
  sub_sub_category_id: number[];
  labels: number[];
  tags_ids: number[];
  /** descriptor id -> chosen value. string_choice holds the picked option
   *  string; numeric holds the entered number as a string (all form numbers are
   *  strings here). A descriptor with no value is simply absent from the map. */
  descriptor_values: Record<number, string>;
  countries_iso: string[];
  extra_price_for_country: ExtraPrice[];
  images: ImageItem[];
  cloud_video: string;
  remove_videos: string[];
  existing_videos: string[];
  colors: SelColor[];
  sizes: SelSize[];
  variations: Record<string, VariantRow>;
  colorImages: Record<string, string[]>; // color code -> ordered filenames
  translations: Translation[];
  default_language_code?: string;
}

export interface VariantCombo {
  key: string;
  colorCode?: string;
  colorName?: string;
  sizeId?: number;
  sizeName?: string;
}

export interface DiffEntry {
  label: string;
  from: string;
  to: string;
}

/* -------------------------------- helpers -------------------------------- */

const num = (v: string | number): number => {
  const n = parseFloat(String(v));
  return isNaN(n) ? NaN : n;
};

export const emptyVariantRow = (): VariantRow => ({
  price: "",
  discount: "",
  luck: "",
  qty: "",
  sku: "",
  barcode: "",
});

/** A blank ProductForm for the create flow. Defaults are chosen to satisfy the
 *  same shape validate()/buildUpdateFormData() expect (unit "pc", tax percent,
 *  status disabled, all number fields empty strings, empty collections). */
export function emptyProductForm(): ProductForm {
  return {
    name: "",
    unit: "pc",
    barcode: "",
    seller_product_id: "",
    description: "",
    brand_id: "",
    boutique_id: "",
    label: "",
    model_number: "",
    report_ref_number: "",
    location_id: "",
    unit_price: "",
    discount_price: "",
    purchase_price: "",
    luck_price: "",
    current_stock: "",
    weight: "",
    max_allowed_qty: "",
    count_of_pieces: "",
    shipping_cost: "",
    shipping_days: "",
    tax: "",
    tax_type: "percent",
    multiply_qty: 0,
    packed_after_ordering: 0,
    meta_title: "",
    meta_description: "",
    meta_image: "",
    meta_image_url: "",
    origin_country_iso: "",
    status: 0,
    category_id: [],
    sub_category_id: [],
    sub_sub_category_id: [],
    labels: [],
    tags_ids: [],
    descriptor_values: {},
    countries_iso: [],
    extra_price_for_country: [],
    images: [],
    cloud_video: "",
    remove_videos: [],
    existing_videos: [],
    colors: [],
    sizes: [],
    variations: {},
    colorImages: {},
    translations: [],
    default_language_code: "en",
  };
}

/**
 * Fill each current variant's empty price / discount / luck from the
 * product-level defaults, as real editable values. A field that already holds a
 * value — and `extra` / `qty` / `sku` / `barcode` — is left untouched. A combo
 * whose product-level defaults are also empty is not materialized into a row.
 * When a product-level default IS non-empty, though, filling it in is a real,
 * intended change and will show up in the confirm-diff — this only avoids
 * phantom (all-empty) rows, not diffs in general. Returns the SAME
 * `form.variations` reference when nothing changed, so callers can skip a
 * needless patch.
 */
export function seedVariantDefaults(
  form: ProductForm,
): Record<string, VariantRow> {
  let changed = false;
  const next: Record<string, VariantRow> = { ...form.variations };
  for (const c of combos(form)) {
    const base = next[c.key] || emptyVariantRow();
    const price = base.price === "" ? form.unit_price : base.price;
    const discount = base.discount === "" ? form.discount_price : base.discount;
    const luck = base.luck === "" ? form.luck_price : base.luck;
    if (price !== base.price || discount !== base.discount || luck !== base.luck) {
      next[c.key] = { ...base, price, discount, luck };
      changed = true;
    }
  }
  return changed ? next : form.variations;
}

/** Variant key suffix: "{Color}-{Size}", spaces removed, "." -> "_". */
export const cleanKey = (s?: string): string =>
  (s || "").replace(/\s+/g, "").replace(/\./g, "_");

export function variantKey(colorName?: string, sizeName?: string): string {
  const c = cleanKey(colorName);
  const s = cleanKey(sizeName);
  if (c && s) return `${c}-${s}`;
  return c || s;
}

/** Last path segment of a media URL — the filename the backend expects back. */
export function fileName(url: any): string {
  if (!url) return "";
  const raw = typeof url === "string" ? url : url?.file_path || url?.image || "";
  const clean = String(raw).split("?")[0].split("#")[0];
  return clean.substring(clean.lastIndexOf("/") + 1);
}

/** The color × size combinations that currently make up the variant matrix. */
export function combos(form: ProductForm): VariantCombo[] {
  const out: VariantCombo[] = [];
  const cs = form.colors;
  const ss = form.sizes;
  if (cs.length && ss.length) {
    for (const c of cs)
      for (const s of ss)
        out.push({
          key: variantKey(c.name, s.name),
          colorCode: c.code,
          colorName: c.name,
          sizeId: s.id,
          sizeName: s.name,
        });
  } else if (cs.length) {
    for (const c of cs)
      out.push({ key: variantKey(c.name), colorCode: c.code, colorName: c.name });
  } else if (ss.length) {
    for (const s of ss)
      out.push({ key: variantKey(undefined, s.name), sizeId: s.id, sizeName: s.name });
  }
  return out;
}

/** sync_color_images payload — every color → its ordered images, or (no colors)
 *  a single group holding all images ordered by priority. */
export function buildSyncColorImages(form: ProductForm) {
  if (form.colors.length) {
    return form.colors.map((c, i) => ({
      color_code: c.code,
      color_name: c.name,
      images: (form.colorImages[c.code] || []).map((img, p) => ({
        image: img,
        position: p,
      })),
      position: i,
    }));
  }
  return [
    {
      images: form.images.map((im, p) => ({ image: im.name, position: p })),
      position: 0,
    },
  ];
}

/* ----------------------- edit response -> form state --------------------- */

export function buildFormFromEdit(
  product: any,
  lookups: Lookups,
): ProductForm {
  const colorByCode = new Map(
    (lookups.colors || []).map((c) => [String(c.code).toUpperCase(), c]),
  );
  const sizeById = new Map((lookups.sizes || []).map((s) => [s.id, s]));

  // The Go backend sometimes returns an empty `selected_colors` even when the
  // product has colored variants (its colors still appear in
  // `color_image_mappings`). Rebuild the color axis from every explicit source
  // and dedupe by uppercased color code so the matrix isn't silently dropped.
  const colorsByCode = new Map<string, SelColor>();
  const addColor = (code?: string, name?: string, id?: number) => {
    if (!code) return;
    const k = String(code).toUpperCase();
    if (colorsByCode.has(k)) return;
    colorsByCode.set(k, { code, name: name || code, id });
  };
  for (const m of product.color_image_mappings || []) {
    if (m?.color_code) addColor(m.color_code, m.color_name, m.color_id);
  }
  for (const code of product.selected_colors || []) {
    const c = colorByCode.get(String(code).toUpperCase());
    addColor(code, c?.name, c?.id);
  }
  const colors: SelColor[] = [...colorsByCode.values()];

  // Rebuild sizes from the selection and from any size referenced by a
  // variation (union, resolved through the size lookup, unresolved ids dropped).
  const sizeIds = new Set<number>();
  for (const id of product.selected_size_ids || []) sizeIds.add(id);
  for (const v of product.variations || [])
    if (v?.size_id != null) sizeIds.add(v.size_id);
  const sizes: SelSize[] = [...sizeIds]
    .map((id) => {
      const s = sizeById.get(id);
      return s ? { id: s.id, name: s.name } : null;
    })
    .filter(Boolean) as SelSize[];

  // Key each variation from the SAME reconstructed colors/sizes arrays that
  // combos() iterates, so the variation-map keys are structurally identical to
  // the matrix keys and to buildUpdateFormData's `price_<key>` — independent of
  // how the backend formats `v.type`. Fall back to cleanKey(v.type) only when a
  // variation's color/size id doesn't resolve.
  const colorNameById = new Map<number, string>();
  for (const c of colors) if (c.id != null) colorNameById.set(c.id, c.name);
  const sizeNameById = new Map<number, string>();
  for (const s of sizes) sizeNameById.set(s.id, s.name);

  const variations: Record<string, VariantRow> = {};
  for (const v of product.variations || []) {
    const cName = v.color_id != null ? colorNameById.get(v.color_id) : undefined;
    const sName = v.size_id != null ? sizeNameById.get(v.size_id) : undefined;
    let key = variantKey(cName, sName);
    if (!key && v.type) key = cleanKey(v.type);
    if (!key) continue;
    variations[key] = {
      price: numStr(v.unit_price),
      discount: numStr(v.discount_price),
      luck: numStr(v.luck_price),
      qty: numStr(v.quantity),
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
    };
  }

  // Color -> ordered image filenames.
  const colorImages: Record<string, string[]> = {};
  for (const m of product.color_image_mappings || []) {
    if (!m?.color_code) continue;
    const ordered = [...(m.images || [])]
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((im: any) => fileName(im.image));
    colorImages[m.color_code] = ordered;
  }

  const images: ImageItem[] = (product.images || []).map((u: any) => ({
    name: fileName(u),
    url: typeof u === "string" ? u : u?.file_path || "",
  }));

  const rawTranslations: Translation[] = (product.translations || []).map(
    (t: any) => ({
      // Carried so the update can echo it back as custom_data[i][id]; without it
      // every save targets id = null (contract §1h/§4).
      id: t.id ?? undefined,
      language_code: t.language_code,
      name: t.name ?? "",
      description: t.details ?? t.description ?? "",
      similar_words: parseSimilarWords(t.similar_words),
    }),
  );
  const translations = dedupeTranslations(rawTranslations);

  const sel = product.selected_categories || {};

  return {
    name: product.name ?? "",
    unit: product.unit ?? "pc",
    barcode: product.barcode ?? "",
    seller_product_id: product.seller_product_id ?? "",
    description: product.description ?? "",
    brand_id: idStr(product.brand_id),
    boutique_id: idStr(product.boutique_id),
    label: product.label ?? "",
    model_number: product.model_number ?? "",
    report_ref_number: product.report_ref_number ?? "",
    location_id: idStr(product.location_id),
    unit_price: numStr(product.unit_price),
    discount_price: numStr(product.discount_price),
    purchase_price: numStr(product.purchase_price),
    luck_price: numStr(product.luck_price),
    current_stock: numStr(product.current_stock),
    weight: numStr(product.weight),
    max_allowed_qty: numStr(product.max_allowed_qty),
    count_of_pieces: numStr(product.count_of_pieces),
    shipping_cost: numStr(product.shipping_cost),
    shipping_days: numStr(product.shipping_days),
    tax: numStr(product.tax),
    tax_type: product.tax_type ?? "percent",
    multiply_qty: product.multiply_qty?1:0,
    packed_after_ordering: product.packed_after_ordering?1:0,
    meta_title: product.meta_title ?? "",
    meta_description: product.meta_description ?? "",
    meta_image: fileName(product.meta_image),
    meta_image_url: product.meta_image ?? "",
    origin_country_iso: product.origin_country_iso ?? "",
    status: Number(product.status ?? 0),
    category_id: [...(sel.main || [])],
    sub_category_id: [...(sel.sub || [])],
    sub_sub_category_id: [...(sel.sub_sub || [])],
    labels: [...(product.labels || [])],
    tags_ids: [...(product.tags_ids || [])],
    // The edit response returns no saved descriptor values, so edit mode starts
    // empty (see docs follow-up: backend needs a selected-descriptors field).
    descriptor_values: {},
    countries_iso: [...(product.restricted_countries_iso || [])],
    extra_price_for_country: (product.extra_price_for_country || []).map(
      (e: any) => ({
        country_iso: e.country_iso,
        extra_price: numStr(e.extra_price),
      }),
    ),
    images,
    cloud_video: "",
    remove_videos: [],
    existing_videos: [...(product.videos || product.cloud_videos || [])].map(
      (v: any) => (typeof v === "string" ? v : v?.file_path || v?.url || ""),
    ),
    colors,
    sizes,
    variations,
    colorImages,
    translations,
  };
}

export function dedupeTranslations(translations: Translation[]): Translation[] {
  const seen = new Set<string>();
  const out: Translation[] = [];
  for (const t of translations || []) {
    const lang = (t.language_code || "").trim().toLowerCase();
    if (!lang || seen.has(lang)) continue;
    seen.add(lang);
    out.push(t);
  }
  return out;
}

export function cleanNumberString(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v).trim().replace(/,/g, ".");
  const m = s.match(/\d+(?:\.\d+)?/);
  if (!m) return "";
  return m[0];
}

const numStr = (v: any): string => cleanNumberString(v);
const idStr = (v: any): string =>
  v === null || v === undefined ? "" : String(v);

/* ------------------------------ validation ------------------------------- */

export function validate(
  form: ProductForm,
  isCreate = false,
): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.name.trim()) e.name = tx("Product name is required");
  if (!UNITS.includes(form.unit as any)) e.unit = tx("Select a valid unit");
  // Required on BOTH create and update. Client-side this is UX only — it stops the
  // empty case before a request is made; it confers no security property, and the
  // server still owns brand validity/authorization (spec E-5).
  if (!form.brand_id) e.brand_id = tx("Brand is required");
  // seller_product_id is optional server-side on both create and update; it is only
  // checked for marketplace uniqueness when provided.

  const up = num(form.unit_price);
  const dp = num(form.discount_price);
  if (form.unit_price === "" || isNaN(up) || up < 0)
    e.unit_price = tx("Enter a valid unit price");
  if (form.discount_price !== "") {
    if (isNaN(dp) || dp < 0) e.discount_price = tx("Enter a valid discount price");
    else if (!isNaN(up) && dp > up)
      e.discount_price = tx("Discount must be ≤ unit price");
  }
  if (form.purchase_price !== "" && (isNaN(num(form.purchase_price)) || num(form.purchase_price) < 0))
    e.purchase_price = tx("Enter a valid purchase price");

  if (
    (form.unit === "pc" || form.unit === "l") &&
    (form.weight === "" || isNaN(num(form.weight)) || num(form.weight) <= 0)
  )
    e.weight = tx("Weight is required for pc / liter units");

  if (form.current_stock !== "" && (isNaN(num(form.current_stock)) || num(form.current_stock) < 0))
    e.current_stock = tx("Enter a valid stock");

  // Create enforces integer 1..100 server-side; update does not yet, so the client
  // check guards both. Empty is allowed — the payload defaults it to 1.
  if (form.count_of_pieces !== "") {
    const cop = num(form.count_of_pieces);
    if (!Number.isInteger(cop) || cop < 1 || cop > 100)
      e.count_of_pieces = tx("Must be a whole number between 1 and 100");
  }

  if (form.labels.length > 3) e.labels = tx("At most 3 labels allowed");

  if (!form.images.length) e.images = tx("At least one product image is required");

  // Color → image assignment completeness (server re-validates).
  if (form.colors.length && form.images.length) {
    const assigned = new Set<string>();
    let missingColor = "";
    for (const c of form.colors) {
      const imgs = form.colorImages[c.code] || [];
      if (!imgs.length && !missingColor) missingColor = c.name;
      imgs.forEach((i) => assigned.add(i));
    }
    if (missingColor)
      e.colorImages = `${tx("Every color needs at least one image")} (${tx("missing")}: ${missingColor})`;
    else {
      const unassigned = form.images.filter((im) => !assigned.has(im.name));
      if (unassigned.length)
        e.colorImages = `${tx("Every image must be assigned to a color")} (${unassigned.length} ${tx("unassigned")})`;
    }
  }

  // Validate variants for quantity, non-negative values, and SKU uniqueness.
  const activeCombos = combos(form);
  const skuMap = new Map<string, string[]>();

  for (const c of activeCombos) {
    const r = form.variations[c.key];
    if (!r || r.qty === "" || isNaN(num(r.qty))) {
      e.variations = tx("Every variant needs a quantity");
      break;
    }
    if (num(r.qty) < 0) {
      e.variations = tx("Variant quantity cannot be negative");
      break;
    }
    if (r.price !== "" && (isNaN(num(r.price)) || num(r.price) < 0)) {
      e.variations = tx("Variant price cannot be negative");
      break;
    }
    if (r.discount !== "" && (isNaN(num(r.discount)) || num(r.discount) < 0)) {
      e.variations = tx("Variant discount price cannot be negative");
      break;
    }
    if (r.luck !== "" && (isNaN(num(r.luck)) || num(r.luck) < 0)) {
      e.variations = tx("Variant luck price cannot be negative");
      break;
    }
    const cleanSku = (r.sku || "").trim();
    if (!cleanSku) {
      e.variations = tx("Every variant needs an SKU");
      break;
    }
    const keyLower = cleanSku.toLowerCase();
    if (!skuMap.has(keyLower)) {
      skuMap.set(keyLower, []);
    }
    skuMap.get(keyLower)!.push(c.key);
  }

  let hasDuplicateSku = false;
  skuMap.forEach((keys) => {
    if (keys.length > 1) {
      hasDuplicateSku = true;
      keys.forEach((key) => {
        e[`variation_sku_${key}`] = tx("SKU must be unique within the product");
      });
    }
  });
  if (hasDuplicateSku && !e.variations) {
    e.variations = tx("Variation SKUs must be unique within the product");
  }

  if (isCreate) {
    const defaultLang = form.default_language_code || DEFAULT_LANGUAGE_CODE;
    const defaultTr = form.translations.find((t) => t.language_code === defaultLang);
    const nameVal = (defaultTr?.name || form.name || "").trim();
    if (!nameVal) {
      e.translations = `${tx("Product name is required for")} ${defaultLang.toUpperCase()}`;
    }
  } else {
    if (
      !form.translations.some(
        (t) => t.language_code === DEFAULT_LANGUAGE_CODE && t.name.trim(),
      )
    )
      e.translations = tx("An English (en) name is required");
  }

  if (isCreate) {
    if (!form.boutique_id) e.boutique_id = tx("Boutique is required");
    if (!form.category_id.length)
      e.category_id = tx("Select at least one category");
    const descText = form.description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (!descText) e.description = tx("Description is required");
  }

  return e;
}

/* --------------------------- server error mapping ------------------------- */

const ASSERT_MESSAGE_FIELDS: [string, string][] = [
  ["at least one product image", "images"],
  ["every color must have at least one image", "colorImages"],
  ["must be assigned to colors", "colorImages"],
  ["ordered by priority", "images"],
];

const ERROR_CODE_FIELDS = new Set([
  "name",
  "unit",
  "brand_id",
  "boutique_id",
  "unit_price",
  "discount_price",
  "purchase_price",
  "luck_price",
  "weight",
  "count_of_pieces",
  "shipping_cost",
  "shipping_days",
  "tax",
  "tax_type",
  "category_id",
  "description",
  "images",
  "colorImages",
  "variations",
  "translations",
]);

/** Map a rejected save's response body onto the editor's `errors` shape.
 *
 *  Every VALUE is a translated constant of ours — no backend text is ever
 *  surfaced (contract §3.4 failures arrive as raw PHP "Undefined array key"
 *  strings, and the proxy passes backend bodies through unfiltered).
 *  Returns the complete record plus whether anything was attributed, so the
 *  caller can fall back to a general message and set state exactly once. */
export function mapServerErrors(res: any): {
  errors: Record<string, string>;
  attributed: boolean;
} {
  const errors: Record<string, string> = {};
  const details = Array.isArray(res?.detailed_error) ? res.detailed_error : [];

  for (const d of details) {
    // FormRequest failures: `code` is the field key, dotted for array items
    // (`category_id.0`, `labels.1`) — reduce to the base field (contract §3.1).
    const code = typeof d?.code === "string" ? d.code.split(".")[0] : "";
    if (code && ERROR_CODE_FIELDS.has(code)) {
      errors[code] = tx("Please check this field");
      continue;
    }
    // Service asserts arrive with no code at all (contract §3.2).
    const msg = typeof d?.message === "string" ? d.message.toLowerCase() : "";
    if (!msg) continue;
    for (const [needle, field] of ASSERT_MESSAGE_FIELDS) {
      if (msg.includes(needle)) {
        errors[field] =
          field === "images"
            ? tx("Check the product images and their order")
            : tx("Every color needs at least one image, and every image must be assigned");
        break;
      }
    }
  }

  return { errors, attributed: Object.keys(errors).length > 0 };
}

/* ---------------------------- update payload ----------------------------- */

export function buildUpdateFormData(form: ProductForm, isCreate = false): FormData {
  const fd = new FormData();
  const set = (k: string, v: any) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  };

  set("name", form.name);
  if (isCreate) {
    set("default_language_code", form.default_language_code || DEFAULT_LANGUAGE_CODE);
  }
  set("unit", form.unit);
  set("barcode", form.barcode);
  set("seller_product_id", form.seller_product_id);
  set("description", sanitizeHtml(form.description));
  set("brand_id", form.brand_id);
  set("boutique_id", form.boutique_id);
  // The seller-update DTO reads these three without a fallback, so the key must
  // always be present — omitting one (as happens when the seller clears the field)
  // errors the update. Empty string is the multipart stand-in for null.
  // location_id is NOT in that set, so it stays conditional.
  set("label", form.label);
  set("model_number", form.model_number);
  set("report_ref_number", form.report_ref_number);
  if (form.location_id) set("location_id", form.location_id);

  set("unit_price", form.unit_price);
  set("discount_price", form.discount_price === "" ? "0" : form.discount_price);
  set("purchase_price", form.purchase_price === "" ? "0" : form.purchase_price);
  // Key-required on update for approval-enabled sellers (contract §2.2): the DTO
  // reads it unconditionally, so omitting it — which is exactly what happens when
  // the seller clears the field — 422s with a raw "Undefined array key" message
  // and no field code. `0` is the server's own default and the value forced for
  // unapproved sellers (§1b), so it is the neutral "no luck price".
  set("luck_price", form.luck_price === "" ? "0" : form.luck_price);
  set("current_stock", form.current_stock === "" ? "0" : form.current_stock);
  if (form.weight !== "") set("weight", form.weight);
  set("max_allowed_qty", form.max_allowed_qty === "" ? "0" : form.max_allowed_qty);
  set("count_of_pieces", form.count_of_pieces === "" ? "1" : form.count_of_pieces);
  set("shipping_cost", form.shipping_cost === "" ? "0" : form.shipping_cost);
  set("shipping_days", form.shipping_days === "" ? "0" : form.shipping_days);
  // tax / tax_type ARE sent. An earlier comment here claimed a server
  // operator-precedence bug made any truthy tax_type currency-convert `tax` as a
  // flat amount; the code-verified contract §1b (DTO:225-228,599-602) disproves
  // it — only tax_type == 'flat' converts, anything else behaves as percent.
  // tax_type must therefore be exactly 'flat' or 'percent'.
  set("tax", form.tax === "" ? "0" : form.tax);
  set("tax_type", form.tax_type === "flat" ? "flat" : "percent");

  // Always present, always an explicit boolean — the create DTO rejects a missing
  // key ("must be true or false"), so the previous "send 'on' / omit to disable"
  // encoding is gone. `set` stringifies, so these go on the wire as "true"/"false".
  // Contract §1c confirms this is correct: the boolean rule accepts
  // 1/0/true/false/"1"/"0" and the value is parsed with FILTER_VALIDATE_BOOL,
  // which reads "true"/"false" correctly. Do NOT reinstate the omit pattern —
  // §2.2 makes key presence load-bearing on update.
  set("multiplyQTY", form.multiply_qty?1:0);

  // packed_after_ordering is NOT a boolean on the wire. The DTO enables the flag
  // only on the literal string 'on' (contract §1c, §4); any other value stores 0.
  // The key is always appended because update reads it with isset.
  // KNOWN LIMITATION — update only: on CREATE the rule is `nullable|boolean`,
  // which rejects 'on' while the DTO requires it, so the flag is impossible to
  // enable at create through this endpoint. That is a backend defect, not
  // something this builder can work around (spec AC-16).
  set("packed_after_ordering", form.packed_after_ordering ? "on" : "");

  set("meta_title", form.meta_title);
  set("meta_description", form.meta_description);
  if (form.meta_image) set("meta_image", form.meta_image);
  set("origin_country_iso", form.origin_country_iso);

  form.category_id.forEach((id) => fd.append("category_id[]", String(id)));
  form.sub_category_id.forEach((id) => fd.append("sub_category_id[]", String(id)));
  form.sub_sub_category_id.forEach((id) =>
    fd.append("sub_sub_category_id[]", String(id)),
  );

  form.labels.forEach((id) => fd.append("labels[]", String(id)));
  form.tags_ids.forEach((id) => fd.append("tags_ids[]", String(id)));
  // descriptor_values is deliberately NOT sent, and this is a product decision
  // rather than missing knowledge: the contract documents both the create/update
  // behaviour (`descriptors` is never read — §1i) and the dedicated endpoint
  // (POST /shop/products/{id}/descriptors). Descriptors are PARKED — the section
  // renders read-only and the endpoint stays unused until the feature is revived.
  // The edit response also returns no saved values, so there is no read path to
  // prefill from. Nothing about descriptors reaches the payload or the save diff.

  form.countries_iso.forEach((iso) => fd.append("countries_iso[]", iso));
  fd.append(
    "extra_price_for_country",
    JSON.stringify(
      form.extra_price_for_country
        .filter((e) => e.country_iso)
        .map((e) => ({
          country_iso: e.country_iso,
          extra_price: Number(e.extra_price) || 0,
        })),
    ),
  );

  form.images.forEach((im) => fd.append("images[]", im.name));
  fd.append("sync_color_images", JSON.stringify(buildSyncColorImages(form)));

  form.colors.forEach((c) => fd.append("colors[]", c.code));
  form.sizes.forEach((s) => fd.append("sizes[]", s.name));

  combos(form).forEach((c) => {
    const r = form.variations[c.key] || emptyVariantRow();
    fd.append(`price_${c.key}`, r.price || form.unit_price || "0");
    fd.append(`price_${c.key}_discount`, r.discount || "0");
    fd.append(`price_${c.key}_luck`, r.luck || "0");
    fd.append(`qty_${c.key}`, r.qty || "0");
    fd.append(`sku_${c.key}`, r.sku || "");
    fd.append(`barcode_${c.key}`, r.barcode || "");
  });

  if (isCreate) {
    const langCode = form.default_language_code || DEFAULT_LANGUAGE_CODE;
    const targetTr = form.translations.find((t) => t.language_code === langCode) || {
      language_code: langCode,
      name: form.name || "",
      description: form.description || "",
      similar_words: [],
    };
    fd.append(`custom_data[0][language_code]`, targetTr.language_code);
    fd.append(`custom_data[0][name]`, targetTr.name || form.name || "");
    fd.append(`custom_data[0][description]`, sanitizeHtml(targetTr.description || form.description || ""));
    (targetTr.similar_words || []).forEach((w) => {
      if (w && w.trim()) fd.append(`custom_data[0][similar_words][]`, w.trim());
    });
  } else {
    dedupeTranslations(form.translations).forEach((t, i) => {
      // The backend matches translation rows with updateOrCreate(['id' => …])
      // (contract §1h/§4), so an entry sent without its id targets id = null and
      // writes the wrong row. Sent only when the edit response supplied one —
      // on create there is no row yet and none must be invented.
      if (t.id !== undefined && t.id !== null && t.id !== "")
        fd.append(`custom_data[${i}][id]`, String(t.id));
      fd.append(`custom_data[${i}][language_code]`, t.language_code);
      fd.append(`custom_data[${i}][name]`, t.name || "");
      fd.append(`custom_data[${i}][description]`, sanitizeHtml(t.description || ""));
      (t.similar_words || []).forEach((w) => {
        if (w && w.trim()) fd.append(`custom_data[${i}][similar_words][]`, w.trim());
      });
    });
  }

  if (form.cloud_video) set("cloud_video", form.cloud_video);
  form.remove_videos.forEach((v) => fd.append("remove_videos[]", v));

  return fd;
}

/* -------------------------- smooth scroll error --------------------------- */

export function scrollToFirstError(errs: Record<string, string>) {
  if (typeof window === "undefined" || !errs) return;
  const keys = Object.keys(errs);
  if (!keys.length) return;

  const firstKey = keys[0];

  setTimeout(() => {
    let target =
      document.querySelector(`[data-field="${firstKey}"]`) ||
      document.getElementById(`field_${firstKey}`) ||
      document.getElementById(`section_${firstKey}`) ||
      document.getElementById(firstKey);

    if (!target) {
      target =
        document.querySelector(`.border-\\[\\#f85555\\]`) ||
        document.querySelector(`.text-\\[\\#f85555\\]`);
    }

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
}

/* ------------------------------ change diff ------------------------------ */

const SCALARS: [keyof ProductForm, string][] = [
  ["name", "Name"],
  ["unit", "Unit"],
  ["barcode", "Barcode"],
  ["seller_product_id", "Seller Product ID"],
  ["description", "Description"],
  ["label", "Label"],
  ["model_number", "Model Number"],
  ["report_ref_number", "Report Ref."],
  ["location_id", "Location"],
  ["unit_price", "Unit Price"],
  ["discount_price", "Discount Price"],
  ["purchase_price", "Purchase Price"],
  ["luck_price", "Luck Price"],
  ["current_stock", "Stock"],
  ["weight", "Weight"],
  ["max_allowed_qty", "Max Allowed Qty"],
  ["count_of_pieces", "Pieces / Unit"],
  ["shipping_cost", "Shipping Cost"],
  ["shipping_days", "Shipping Days"],
  // tax / tax_type are sent again (see buildUpdateFormData), so they belong in the
  // diff — payload and confirm dialog must stay in step.
  ["tax", "Tax"],
  ["tax_type", "Tax Type"],
  ["meta_title", "Meta Title"],
  ["meta_description", "Meta Description"],
  ["origin_country_iso", "Origin Country"],
];

const trunc = (s: string, n = 40) =>
  s.length > n ? `${s.slice(0, n)}…` : s || "—";

export function buildDiff(
  initial: ProductForm,
  current: ProductForm,
  lookups: Lookups,
): DiffEntry[] {
  const out: DiffEntry[] = [];
  const push = (label: string, from: any, to: any) => {
    const f = String(from ?? "");
    const t = String(to ?? "");
    if (f !== t) out.push({ label, from: trunc(f), to: trunc(t) });
  };

  for (const [key, label] of SCALARS) {
    push(tx(label), initial[key], current[key]);
  }

  const brandName = (id: string) =>
    lookups.brands.find((b) => String(b.id) === id)?.name || id || "—";
  const boutiqueName = (id: string) =>
    lookups.boutiques.find((b) => String(b.id) === id)?.name || id || "—";
  if (initial.brand_id !== current.brand_id)
    out.push({
      label: tx("Brand"),
      from: brandName(initial.brand_id),
      to: brandName(current.brand_id),
    });
  if (initial.boutique_id !== current.boutique_id)
    out.push({
      label: tx("Boutique"),
      from: boutiqueName(initial.boutique_id),
      to: boutiqueName(current.boutique_id),
    });

  push(
    tx("Multiply Shipping × Qty"),
    initial.multiply_qty ? tx("On") : tx("Off"),
    current.multiply_qty ? tx("On") : tx("Off"),
  );
  push(
    tx("Packed After Ordering"),
    initial.packed_after_ordering ? tx("On") : tx("Off"),
    current.packed_after_ordering ? tx("On") : tx("Off"),
  );

  const cnt = (label: string, a: any[], b: any[]) =>
    push(tx(label), `${a.length} ${tx("item(s)")}`, `${b.length} ${tx("item(s)")}`);
  if (!eqArr(initial.category_id, current.category_id))
    cnt("Main Categories", initial.category_id, current.category_id);
  if (!eqArr(initial.sub_category_id, current.sub_category_id))
    cnt("Sub Categories", initial.sub_category_id, current.sub_category_id);
  if (!eqArr(initial.sub_sub_category_id, current.sub_sub_category_id))
    cnt("Sub-sub Categories", initial.sub_sub_category_id, current.sub_sub_category_id);
  if (!eqArr(initial.labels, current.labels))
    cnt("Labels", initial.labels, current.labels);
  if (!eqArr(initial.tags_ids, current.tags_ids))
    cnt("Tags", initial.tags_ids, current.tags_ids);
  // Descriptors are intentionally absent from the diff: they are never sent
  // (see buildUpdateFormData) and the section is read-only, so showing them here
  // would tell the seller a change is about to be saved when none is.
  if (!eqArr(initial.countries_iso, current.countries_iso))
    cnt("Restricted Countries", initial.countries_iso, current.countries_iso);

  if (JSON.stringify(initial.extra_price_for_country) !== JSON.stringify(current.extra_price_for_country))
    cnt(
      "Per-country Extra Price",
      initial.extra_price_for_country,
      current.extra_price_for_country,
    );

  if (initial.images.map((i) => i.name).join() !== current.images.map((i) => i.name).join())
    push(tx("Product Images"), `${initial.images.length} ${tx("image(s)")}`, `${current.images.length} ${tx("image(s)")}`);

  if (initial.meta_image !== current.meta_image)
    push(tx("Meta Image"), initial.meta_image, current.meta_image);

  if (!eqArr(initial.colors.map((c) => c.code), current.colors.map((c) => c.code)))
    push(
      tx("Colors"),
      initial.colors.map((c) => c.name).join(", ") || "—",
      current.colors.map((c) => c.name).join(", ") || "—",
    );
  if (!eqArr(initial.sizes.map((s) => s.id), current.sizes.map((s) => s.id)))
    push(
      tx("Sizes"),
      initial.sizes.map((s) => s.name).join(", ") || "—",
      current.sizes.map((s) => s.name).join(", ") || "—",
    );

  if (JSON.stringify(initial.variations) !== JSON.stringify(current.variations))
    out.push({
      label: tx("Variant Pricing / Stock"),
      from: tx("edited"),
      to: `${combos(current).length} ${tx("variant(s)")}`,
    });

  if (JSON.stringify(initial.colorImages) !== JSON.stringify(current.colorImages))
    out.push({ label: tx("Color → Image Assignment"), from: tx("edited"), to: tx("updated") });

  const trChanged = current.translations.filter((t) => {
    const o = initial.translations.find((x) => x.language_code === t.language_code);
    return !o || o.name !== t.name || o.description !== t.description;
  });
  if (trChanged.length || initial.translations.length !== current.translations.length)
    push(
      tx("Translations"),
      `${initial.translations.length} ${tx("language(s)")}`,
      `${current.translations.length} ${tx("language(s)")}`,
    );

  if (current.cloud_video)
    out.push({ label: tx("Video"), from: "—", to: tx("new upload") });
  if (current.remove_videos.length)
    out.push({
      label: tx("Video"),
      from: `${current.remove_videos.length} ${tx("removed")}`,
      to: "—",
    });

  return out;
}

function eqArr(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].map(String).sort();
  const sb = [...b].map(String).sort();
  return sa.every((v, i) => v === sb[i]);
}
