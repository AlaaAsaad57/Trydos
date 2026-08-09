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
  translated_name?: string;
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
  translated_name?: string;
  parent_id?: number;
}
export interface LabelLookup {
  id: number;
  label: string;
  translated_label?: string;
}
export interface NamedLookup {
  id: number;
  name: string;
  translated_name?: string;
  translations?: Record<string, string>[];
}
export interface LocationLookup {
  id: number;
  name: string;
  address: string;
}

/** Display format for a location everywhere it is user-visible: "name - address". */
export const locationLabel = (l: LocationLookup): string =>
  [l.name, l.address].filter(Boolean).join(" - ");

/** Resolves a color entity from lookups by color code (case-insensitive).
 *  Never depends solely on product form data — falls back to provided fallback or code. */
export function getColorFromLookup(
  code: string,
  lookups: Lookups,
  fallback?: SelColor,
): { code: string; name: string; translated_name?: string } {
  const codeUpper = String(code || "").toUpperCase();
  const found = (lookups?.colors || []).find(
    (c) => String(c.code || "").toUpperCase() === codeUpper,
  );
  if (found) return found;
  if (fallback) return fallback;
  return { code, name: code };
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

/** Descriptor icons arrive as bare media filenames (e.g.
 *  "i1j2xltuht2paphse33h.svg"); the media server hosts them under a fixed
 *  per-kind folder. Returns "" when there is no icon (caller shows a
 *  placeholder), and passes through an already-absolute URL untouched. */
export function descriptorIconUrl(
  icon: string | undefined | null,
  kind: "group" | "descriptor",
): string {
  if (!icon || typeof icon !== "string") return "";
  if (icon.startsWith("http")) return icon;
  const folder =
    kind === "group" ? "descriptors/descriptor_groups" : "descriptors/descriptors";
  return `${process.env.NEXT_PUBLIC_BASE_MEDIA_URL}/${folder}/${icon}`;
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

/** Edit-response `descriptor_values[]` rows
 *  ({descriptor_group_id, descriptor_id, value}) -> the form's flat
 *  descriptor_id -> value map. Group ids are re-derived from lookups on save. */
export function flattenDescriptorValues(
  rows: any[] | undefined | null,
): Record<number, string> {
  const out: Record<number, string> = {};
  for (const r of rows || []) {
    const id = Number(r?.descriptor_id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const v = r?.value;
    // "null"/null mean "no value" on the wire (product-descriptors-edit.md).
    if (v === null || v === undefined || v === "" || v === "null") continue;
    out[id] = String(v);
  }
  return out;
}

/** Form state -> the sync endpoint's {descriptor_group_id: {descriptor_id:
 *  value}} map-of-maps (product-descriptors-edit.md). Full-replace semantics:
 *  the returned map IS the product's complete new set, so blank values are
 *  simply omitted — omission deletes them server-side. */
export function buildDescriptorSyncPayload(
  values: Record<number, string>,
  groups: DescriptorGroup[],
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const g of groups || []) {
    for (const d of g.descriptors || []) {
      const v = values?.[d.id];
      if (v === undefined || String(v).trim() === "") continue;
      (out[String(g.id)] ||= {})[String(d.id)] = String(v);
    }
  }
  return out;
}

/** Equality over the *effective* descriptor set (blank ≡ absent), so an
 *  untouched section never triggers a sync — and a save where nothing changed
 *  can never full-replace (i.e. wipe) the stored set by accident. */
export function sameDescriptorValues(
  a: Record<number, string>,
  b: Record<number, string>,
): boolean {
  const norm = (m: Record<number, string>) =>
    Object.entries(m || {}).filter(([, v]) => String(v ?? "").trim() !== "");
  const ea = norm(a);
  const mb = new Map(norm(b));
  return ea.length === mb.size && ea.every(([k, v]) => mb.get(k) === v);
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
  locations: LocationLookup[];
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
  /** Optional per-variant location id ("" = none), mirroring the product-level
   *  location_id semantics — sent only when set. */
  location_id: string;
}

export interface ImageItem {
  name: string; // filename sent to the backend
  url: string; // full URL / object URL for preview
  isNew?: boolean;
}

export interface SelColor {
  code: string;
  name: string;
  translated_name?: string;
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

export type DiffType =
  | "text"
  | "image"
  | "color"
  | "country"
  | "variants"
  | "translations"
  | "categories"
  | "descriptors"
  | "list";

export interface ColorDiffItem {
  code: string;
  name: string;
  translatedName?: string;
  status?: "added" | "removed" | "kept";
}

export interface CountryDiffItem {
  iso: string;
  name: string;
  extraPrice?: string;
  oldExtraPrice?: string;
  status?: "added" | "removed" | "changed" | "kept";
}

export interface ImageDiffItem {
  name: string;
  url: string;
  status?: "added" | "removed" | "kept";
}

export interface VariantFieldDiff {
  fieldLabel: string;
  from: string;
  to: string;
}

export interface VariantDiffItem {
  key: string;
  title: string;
  colorCode?: string;
  colorName?: string;
  sizeName?: string;
  status: "added" | "removed" | "modified";
  changes: VariantFieldDiff[];
}

export interface TranslationFieldDiff {
  fieldLabel: string;
  from: string;
  to: string;
}

export interface TranslationDiffItem {
  langCode: string;
  langName: string;
  status: "added" | "removed" | "modified";
  changes: TranslationFieldDiff[];
}

export interface CategoryDiffItem {
  groupLabel: string;
  added: string[];
  removed: string[];
}

export interface DescriptorDiffItem {
  descriptorId: number;
  name: string;
  from: string;
  to: string;
}

export interface ListDiffItem {
  added: string[];
  removed: string[];
}

export interface DiffEntry {
  key: string;
  label: string;
  from?: string;
  to?: string;
  type?: DiffType;
  imageDetails?: {
    oldList: ImageDiffItem[];
    newList: ImageDiffItem[];
    added: ImageDiffItem[];
    removed: ImageDiffItem[];
  };
  colorDetails?: {
    oldList: ColorDiffItem[];
    newList: ColorDiffItem[];
    added: ColorDiffItem[];
    removed: ColorDiffItem[];
  };
  countryDetails?: CountryDiffItem[];
  variantsDetails?: VariantDiffItem[];
  translationsDetails?: TranslationDiffItem[];
  categoryDetails?: CategoryDiffItem[];
  descriptorDetails?: DescriptorDiffItem[];
  listDetails?: ListDiffItem;
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
  location_id: "",
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
  isCreate = false,
): Record<string, VariantRow> {
  let changed = false;
  const next: Record<string, VariantRow> = { ...form.variations };
  for (const c of combos(form)) {
    const existing = next[c.key];
    const base = existing || emptyVariantRow();
    const price = base.price === "" ? form.unit_price : base.price;
    const discount = base.discount === "" ? form.discount_price : base.discount;
    const luck = base.luck === "" ? form.luck_price : base.luck;
    // An unfilled SKU defaults to the combo key itself — "AntiqueWhite-42EU" /
    // "AntiqueWhite" / "42EU" (see variantKey). This applies to every combo on
    // create, and on edit to combos that are NEW (a color/size just added, so
    // no row exists yet). A variant loaded from the product whose SKU is
    // genuinely empty is the seller's data, not ours to fill. A filled SKU is
    // never touched, and the key is unique per combo so this cannot duplicate.
    const sku = base.sku === "" && (isCreate || !existing) ? c.key : base.sku;
    if (
      price !== base.price ||
      discount !== base.discount ||
      luck !== base.luck ||
      sku !== base.sku
    ) {
      next[c.key] = { ...base, price, discount, luck, sku };
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
  descriptorRows?: any[],
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
  const addColor = (code?: string, name?: string, id?: number, translated_name?: string) => {
    if (!code) return;
    const k = String(code).toUpperCase();
    if (colorsByCode.has(k)) return;
    colorsByCode.set(k, { code, name: name || code, translated_name, id });
  };
  for (const m of product.color_image_mappings || []) {
    if (m?.color_code) addColor(m.color_code, m.color_name, m.color_id, (m as any)?.translated_color_name ?? (m as any)?.translated_name);
  }
  for (const code of product.selected_colors || []) {
    const c = colorByCode.get(String(code).toUpperCase());
    addColor(code, c?.name, c?.id, c?.translated_name);
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
      location_id: idStr(v.location_id),
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
    // Saved values arrive as a flat sibling list on the edit response
    // (data.descriptor_values[] — product-descriptors-edit.md), not on the
    // product object, so the caller passes them alongside.
    descriptor_values: flattenDescriptorValues(descriptorRows),
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
  // Prices can arrive already formatted ("1,000 SP"): the comma is a thousands
  // separator, never a decimal point, so it is stripped — not turned into "."
  // (which read 1,000 back as 1.000).
  const s = String(v).trim().replace(/,/g, "");
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
  /**
   * Creating or updating a product as a seller who is not approved: the only price
   * they may enter is purchase_price, so the unit/discount rules are skipped —
   * the backend drops them on this path too. Purchase price is still validated.
   * There is no product-level luck-price rule to skip.
   */
  pricesLocked = false,
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

  if (!form.location_id) e.location_id = tx("Location is required");
  // if( form.shipping_days === "" || isNaN(Number(form.shipping_days)) || Number(form.shipping_days) < 0){
  //   e.shipping_days = tx("Enter a valid shipping days");
  // }
  
  // Origin country is required on both create and update. The server checks that the value is valid and authorized for the seller, so the client only needs to check that a value was selected.
  if(form.origin_country_iso===""||!form.origin_country_iso){
    e.origin_country_iso=tx("Select a valid origin country");
  }
  // Count of pieces
  if(form.count_of_pieces===""||isNaN(Number(form.count_of_pieces))||Number(form.count_of_pieces)<0){
    e.count_of_pieces=tx("Enter a valid Count of pieces");
  }
  // Stock
  if(!form.current_stock || Number(form.current_stock)<=0 || isNaN(Number(form.current_stock))){
   if(Object.keys(form.variations).length) {
    e.current_stock=tx("Enter a Valid Value for Quantity In Variants Table");
   }
   else{
    e.current_stock=tx("Enter a Valid Value for Quantity");
   }
  }

  const up = num(form.unit_price);
  const dp = num(form.discount_price);
  const pp = num(form.purchase_price);
  if (!pricesLocked) {
    if (form.unit_price === "" || isNaN(up) || up < 0)
      e.unit_price = tx("Enter a valid unit price");

    if (form.discount_price !== "") {
      if (isNaN(dp) || dp < 0) {
        e.discount_price = tx("Enter a valid discount price");
      } else if (!isNaN(up) && up <= dp) {
        e.discount_price = tx("Unit price must be greater than discount price");
      }
    }

    if (form.purchase_price === ""||!form.purchase_price) {
      if (isNaN(pp) || pp < 0) {
        e.purchase_price = tx("Enter a valid purchase price");
      } else if (form.discount_price !== "" && !isNaN(dp) && dp <= pp) {
        e.discount_price = tx("Discount price must be greater than purchase price");
      } else if (form.discount_price === "" && !isNaN(up) && up <= pp) {
        e.purchase_price = tx("Unit price must be greater than purchase price");
      }
    }
  } else {
    if (form.purchase_price === "" || (isNaN(pp) || pp < 0))
      e.purchase_price = tx("Enter a valid purchase price");
  }

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
    if (!pricesLocked && r.price !== "" && r.discount !== "" && !isNaN(num(r.price)) && !isNaN(num(r.discount))) {
      if (num(r.price) <= num(r.discount)) {
        e.variations = tx("Unit price must be greater than discount price");
        break;
      }
    }
    if (r.luck !== "" && (isNaN(num(r.luck)) || num(r.luck) < 0)) {
      e.variations = tx("Variant luck price cannot be negative");
      break;
    }
    if (!r.location_id) {
      e.variations = tx("Every variant needs a location");
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

    // A language is either filled in or left alone: entering only one of
    // name/description leaves a half-written translation row. Both blank is
    // valid (untouched language); similar_words plays no part in the pairing.
    if (!e.translations) {
      for (const t of form.translations) {
        const hasName = !!(t.name || "").trim();
        const hasDesc = !!(t.description || "")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        const code = t.language_code.toUpperCase();
        if (hasName && !hasDesc) {
          e.translations = `${tx("Description is required for")} ${code}`;
          break;
        }
        if (!hasName && hasDesc) {
          e.translations = `${tx("Product name is required for")} ${code}`;
          break;
        }
      }
    }
  }

  if (!form.category_id.length)
    e.category_id = tx("Select at least one category");

  if (isCreate) {
    if (!form.boutique_id) e.boutique_id = tx("Boutique is required");
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

  // Coalesced like its three neighbours below: a restricted create leaves this
  // input locked and empty, and the key must still be sent (never stripped).
  set("unit_price", form.unit_price === "" ? "0" : form.unit_price);
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
  // tax / tax_type are both sent on every save. tax_type must be exactly 'flat'
  // or 'percent' — only 'flat' currency-converts the amount, anything else is
  // read as a percentage (contract §1b). An empty amount means "no tax" → 0.
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
  // descriptor_values is deliberately NOT sent here: the create/update endpoints
  // never read a `descriptors` key (contract §1i). Descriptors persist through
  // their own full-replace endpoint (POST /shop/products/{id}/descriptors —
  // product-descriptors-edit.md), which the edit save flow calls separately.

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
    // Optional, like the product-level location_id — key omitted when unset.
    if (r.location_id) fd.append(`location_id_${c.key}`, r.location_id);
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
  // location_id is NOT diffed here: it resolves through the locations lookup to
  // its "name - address" label in buildDiff, like brand/boutique.
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
  ["tax", "Tax"],
  // tax_type is skipped in the loop below and pushed with a translated label.
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
  const push = (key: string, label: string, from: any, to: any) => {
    const f = String(from ?? "");
    const t = String(to ?? "");
    if (f !== t) out.push({ key, label, from: trunc(f), to: trunc(t), type: "text" });
  };

  const brandName = (id: string) => {
    const b = (lookups.brands || []).find((b) => String(b.id) === id);
    return b ? (b.translated_name ?? b.name) : id || "—";
  };
  const boutiqueName = (id: string) => {
    const b = (lookups.boutiques || []).find((b) => String(b.id) === id);
    return b ? (b.translated_name ?? b.name) : id || "—";
  };
  const locationName = (id: string) => {
    const l = (lookups.locations || []).find((x) => String(x.id) === id);
    return l ? locationLabel(l) : id || "—";
  };
  const countryName = (iso: string) => {
    if (!iso) return "—";
    const c = (lookups.countries || []).find(
      (x) => x.iso.toLowerCase() === iso.toLowerCase()
    );
    return c ? c.nicename : iso.toUpperCase();
  };

  // 1. Scalar Text/Numeric Fields (excluding origin_country_iso which is handled
  // below with flag, and tax_type which shows its translated label)
  for (const [key, label] of SCALARS) {
    if (key === "origin_country_iso" || key === "tax_type") continue;
    push(String(key), tx(label), initial[key], current[key]);
  }
  const taxTypeLabel = (v: string) => (v === "flat" ? tx("Flat") : tx("Percent"));
  if (initial.tax_type !== current.tax_type) {
    out.push({
      key: "tax_type",
      label: tx("Tax Type"),
      from: taxTypeLabel(initial.tax_type),
      to: taxTypeLabel(current.tax_type),
      type: "text",
    });
  }

  // 2. Brand, Boutique, Location
  if (initial.brand_id !== current.brand_id) {
    out.push({
      key: "brand_id",
      label: tx("Brand"),
      from: brandName(initial.brand_id),
      to: brandName(current.brand_id),
      type: "text",
    });
  }
  if (initial.boutique_id !== current.boutique_id) {
    out.push({
      key: "boutique_id",
      label: tx("Boutique"),
      from: boutiqueName(initial.boutique_id),
      to: boutiqueName(current.boutique_id),
      type: "text",
    });
  }
  if (initial.location_id !== current.location_id) {
    out.push({
      key: "location_id",
      label: tx("Location"),
      from: locationName(initial.location_id),
      to: locationName(current.location_id),
      type: "text",
    });
  }

  // 3. Flags / Switches
  if (initial.multiply_qty !== current.multiply_qty) {
    out.push({
      key: "multiply_qty",
      label: tx("Multiply Shipping × Qty"),
      from: initial.multiply_qty ? tx("On") : tx("Off"),
      to: current.multiply_qty ? tx("On") : tx("Off"),
      type: "text",
    });
  }
  if (initial.packed_after_ordering !== current.packed_after_ordering) {
    out.push({
      key: "packed_after_ordering",
      label: tx("Packed After Ordering"),
      from: initial.packed_after_ordering ? tx("On") : tx("Off"),
      to: current.packed_after_ordering ? tx("On") : tx("Off"),
      type: "text",
    });
  }

  // 4. Origin Country (with Flag)
  if (initial.origin_country_iso !== current.origin_country_iso) {
    const oldIso = initial.origin_country_iso;
    const newIso = current.origin_country_iso;
    const countryDetails: CountryDiffItem[] = [];
    if (oldIso) {
      countryDetails.push({ iso: oldIso, name: countryName(oldIso), status: "removed" });
    }
    if (newIso) {
      countryDetails.push({ iso: newIso, name: countryName(newIso), status: "added" });
    }
    if (countryDetails.length > 0) {
      out.push({
        key: "origin_country_iso",
        label: tx("Origin Country"),
        type: "country",
        countryDetails,
      });
    }
  }

  // 5. Restricted Countries (with Flags)
  if (!eqArr(initial.countries_iso, current.countries_iso)) {
    const initialSet = new Set(initial.countries_iso);
    const currentSet = new Set(current.countries_iso);
    const countryDetails: CountryDiffItem[] = [];

    for (const iso of current.countries_iso) {
      if (!initialSet.has(iso)) {
        countryDetails.push({ iso, name: countryName(iso), status: "added" });
      }
    }
    for (const iso of initial.countries_iso) {
      if (!currentSet.has(iso)) {
        countryDetails.push({ iso, name: countryName(iso), status: "removed" });
      }
    }

    if (countryDetails.length > 0) {
      out.push({
        key: "countries_iso",
        label: tx("Restricted Countries"),
        type: "country",
        countryDetails,
      });
    }
  }

  // 6. Per-country Extra Price (with Flags)
  if (
    JSON.stringify(initial.extra_price_for_country) !==
    JSON.stringify(current.extra_price_for_country)
  ) {
    const oldMap = new Map(
      (initial.extra_price_for_country || []).map((x) => [
        x.country_iso.toUpperCase(),
        x.extra_price,
      ])
    );
    const newMap = new Map(
      (current.extra_price_for_country || []).map((x) => [
        x.country_iso.toUpperCase(),
        x.extra_price,
      ])
    );
    const allIsos = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]));
    const countryDetails: CountryDiffItem[] = [];

    for (const iso of allIsos) {
      const oldPrice = oldMap.get(iso);
      const newPrice = newMap.get(iso);
      if (oldPrice === undefined && newPrice !== undefined) {
        countryDetails.push({
          iso,
          name: countryName(iso),
          extraPrice: newPrice,
          status: "added",
        });
      } else if (oldPrice !== undefined && newPrice === undefined) {
        countryDetails.push({
          iso,
          name: countryName(iso),
          oldExtraPrice: oldPrice,
          status: "removed",
        });
      } else if (oldPrice !== newPrice) {
        countryDetails.push({
          iso,
          name: countryName(iso),
          oldExtraPrice: oldPrice,
          extraPrice: newPrice,
          status: "changed",
        });
      }
    }

    if (countryDetails.length > 0) {
      out.push({
        key: "extra_price_for_country",
        label: tx("Per-country Extra Price"),
        type: "country",
        countryDetails,
      });
    }
  }

  // 7. Product Images (Old vs New previews)
  const initialImageNames = initial.images.map((i) => i.name).join("|");
  const currentImageNames = current.images.map((i) => i.name).join("|");

  if (initialImageNames !== currentImageNames) {
    const oldMap = new Map(initial.images.map((i) => [i.name, i.url]));
    const newMap = new Map(current.images.map((i) => [i.name, i.url]));

    const oldList: ImageDiffItem[] = initial.images.map((i) => ({
      name: i.name,
      url: i.url,
    }));
    const newList: ImageDiffItem[] = current.images.map((i) => ({
      name: i.name,
      url: i.url,
    }));

    const added: ImageDiffItem[] = current.images
      .filter((i) => !oldMap.has(i.name))
      .map((i) => ({ name: i.name, url: i.url, status: "added" }));

    const removed: ImageDiffItem[] = initial.images
      .filter((i) => !newMap.has(i.name))
      .map((i) => ({ name: i.name, url: i.url, status: "removed" }));

    out.push({
      key: "images",
      label: tx("Product Images"),
      type: "image",
      from: `${initial.images.length} ${tx("image(s)")}`,
      to: `${current.images.length} ${tx("image(s)")}`,
      imageDetails: { oldList, newList, added, removed },
    });
  }

  if (initial.meta_image !== current.meta_image) {
    push("meta_image", tx("Meta Image"), initial.meta_image, current.meta_image);
  }

  // 8. Colors (with colored circle & translated_name label)
  const initialColorCodes = initial.colors.map((c) => c.code).sort().join("|");
  const currentColorCodes = current.colors.map((c) => c.code).sort().join("|");

  if (initialColorCodes !== currentColorCodes) {
    const oldMap = new Map(initial.colors.map((c) => [c.code, c]));
    const newMap = new Map(current.colors.map((c) => [c.code, c]));

    const oldList: ColorDiffItem[] = initial.colors.map((c) => ({
      code: c.code,
      name: c.name,
      translatedName: c.translated_name,
    }));
    const newList: ColorDiffItem[] = current.colors.map((c) => ({
      code: c.code,
      name: c.name,
      translatedName: c.translated_name,
    }));

    const added: ColorDiffItem[] = current.colors
      .filter((c) => !oldMap.has(c.code))
      .map((c) => ({
        code: c.code,
        name: c.name,
        translatedName: c.translated_name,
        status: "added",
      }));

    const removed: ColorDiffItem[] = initial.colors
      .filter((c) => !newMap.has(c.code))
      .map((c) => ({
        code: c.code,
        name: c.name,
        translatedName: c.translated_name,
        status: "removed",
      }));

    out.push({
      key: "colors",
      label: tx("Colors"),
      type: "color",
      from: initial.colors.map((c) => c.translated_name || c.name).join(", ") || "—",
      to: current.colors.map((c) => c.translated_name || c.name).join(", ") || "—",
      colorDetails: { oldList, newList, added, removed },
    });
  }

  // 9. Sizes
  if (!eqArr(initial.sizes.map((s) => s.id), current.sizes.map((s) => s.id))) {
    out.push({
      key: "sizes",
      label: tx("Sizes"),
      type: "text",
      from: initial.sizes.map((s) => s.name).join(", ") || "—",
      to: current.sizes.map((s) => s.name).join(", ") || "—",
    });
  }

  // 10. Categories (Granular Main, Sub, Sub-sub)
  const categoryLookupMap = (items: CategoryLookup[]) =>
    new Map(items.map((c) => [c.id, c.translated_name || c.name]));

  const mainCatMap = categoryLookupMap(lookups.parent_categories || []);
  const subCatMap = categoryLookupMap(lookups.sub_categories || []);
  const subSubCatMap = categoryLookupMap(lookups.sub_sub_categories || []);

  const buildCategoryDiffGroup = (
    groupName: string,
    initialIds: number[],
    currentIds: number[],
    lookupMap: Map<number, string>
  ): CategoryDiffItem | null => {
    if (eqArr(initialIds, currentIds)) return null;
    const initialSet = new Set(initialIds);
    const currentSet = new Set(currentIds);

    const added = currentIds
      .filter((id) => !initialSet.has(id))
      .map((id) => lookupMap.get(id) || `#${id}`);
    const removed = initialIds
      .filter((id) => !currentSet.has(id))
      .map((id) => lookupMap.get(id) || `#${id}`);

    return { groupLabel: groupName, added, removed };
  };

  const categoryDetails: CategoryDiffItem[] = [];
  const mainDiff = buildCategoryDiffGroup(tx("Main Categories"), initial.category_id, current.category_id, mainCatMap);
  if (mainDiff) categoryDetails.push(mainDiff);

  const subDiff = buildCategoryDiffGroup(tx("Sub Categories"), initial.sub_category_id, current.sub_category_id, subCatMap);
  if (subDiff) categoryDetails.push(subDiff);

  const subSubDiff = buildCategoryDiffGroup(tx("Sub-sub Categories"), initial.sub_sub_category_id, current.sub_sub_category_id, subSubCatMap);
  if (subSubDiff) categoryDetails.push(subSubDiff);

  if (categoryDetails.length > 0) {
    out.push({
      key: "categories",
      label: tx("Categories"),
      type: "categories",
      categoryDetails,
    });
  }

  // 11. Labels & Tags
  if (!eqArr(initial.labels, current.labels)) {
    const labelMap = new Map(
      (lookups.labels || []).map((l) => [l.id, l.translated_label || l.label])
    );
    const initialSet = new Set(initial.labels);
    const currentSet = new Set(current.labels);
    const added = current.labels.filter((id) => !initialSet.has(id)).map((id) => labelMap.get(id) || `#${id}`);
    const removed = initial.labels.filter((id) => !currentSet.has(id)).map((id) => labelMap.get(id) || `#${id}`);

    out.push({
      key: "labels",
      label: tx("Labels"),
      type: "list",
      listDetails: { added, removed },
    });
  }

  if (!eqArr(initial.tags_ids, current.tags_ids)) {
    const tagMap = new Map(
      (lookups.tags || []).map((t) => [t.id, t.translated_name || t.name])
    );
    const initialSet = new Set(initial.tags_ids);
    const currentSet = new Set(current.tags_ids);
    const added = current.tags_ids.filter((id) => !initialSet.has(id)).map((id) => tagMap.get(id) || `#${id}`);
    const removed = initial.tags_ids.filter((id) => !currentSet.has(id)).map((id) => tagMap.get(id) || `#${id}`);

    out.push({
      key: "tags_ids",
      label: tx("Tags"),
      type: "list",
      listDetails: { added, removed },
    });
  }

  // 12. Descriptors / Attributes
  const descName = new Map(
    (lookups.descriptor_groups || [])
      .flatMap((g) => g.descriptors || [])
      .map((d) => [d.id, d.name])
  );
  const descIds = new Set([
    ...Object.keys(initial.descriptor_values || {}).map(Number),
    ...Object.keys(current.descriptor_values || {}).map(Number),
  ]);
  const descriptorDetails: DescriptorDiffItem[] = [];

  for (const id of descIds) {
    const oldVal = String(initial.descriptor_values?.[id] ?? "");
    const newVal = String(current.descriptor_values?.[id] ?? "");
    if (oldVal !== newVal) {
      descriptorDetails.push({
        descriptorId: id,
        name: descName.get(id) || `#${id}`,
        from: oldVal || "—",
        to: newVal || "—",
      });
    }
  }

  if (descriptorDetails.length > 0) {
    out.push({
      key: "descriptors",
      label: tx("Attributes / Descriptors"),
      type: "descriptors",
      descriptorDetails,
    });
  }

  // 13. Variant Pricing & Stock (Granular Field Level)
  const initialCombos = combos(initial);
  const currentCombos = combos(current);
  const allComboKeys = Array.from(
    new Set([
      ...initialCombos.map((c) => c.key),
      ...currentCombos.map((c) => c.key),
      ...Object.keys(initial.variations || {}),
      ...Object.keys(current.variations || {}),
    ])
  );

  const comboMap = new Map<string, VariantCombo>();
  initialCombos.forEach((c) => comboMap.set(c.key, c));
  currentCombos.forEach((c) => comboMap.set(c.key, c));

  const variantsDetails: VariantDiffItem[] = [];

  for (const key of allComboKeys) {
    const oldRow = initial.variations?.[key];
    const newRow = current.variations?.[key];
    const cb = comboMap.get(key);

    const titleParts: string[] = [];
    if (cb?.colorName) titleParts.push(cb.colorName);
    if (cb?.sizeName) titleParts.push(cb.sizeName);
    const title = titleParts.join(" / ") || key;

    if (!oldRow && newRow) {
      variantsDetails.push({
        key,
        title,
        colorCode: cb?.colorCode,
        colorName: cb?.colorName,
        sizeName: cb?.sizeName,
        status: "added",
        changes: [
          { fieldLabel: tx("Price"), from: "—", to: newRow.price || "0" },
          { fieldLabel: tx("Stock"), from: "—", to: newRow.qty || "0" },
          ...(newRow.discount ? [{ fieldLabel: tx("Discount Price"), from: "—", to: newRow.discount }] : []),
          ...(newRow.luck ? [{ fieldLabel: tx("Luck Price"), from: "—", to: newRow.luck }] : []),
          ...(newRow.sku ? [{ fieldLabel: tx("SKU"), from: "—", to: newRow.sku }] : []),
          ...(newRow.barcode ? [{ fieldLabel: tx("Barcode"), from: "—", to: newRow.barcode }] : []),
        ],
      });
    } else if (oldRow && !newRow) {
      variantsDetails.push({
        key,
        title,
        colorCode: cb?.colorCode,
        colorName: cb?.colorName,
        sizeName: cb?.sizeName,
        status: "removed",
        changes: [
          { fieldLabel: tx("Price"), from: oldRow.price || "0", to: "—" },
          { fieldLabel: tx("Stock"), from: oldRow.qty || "0", to: "—" },
        ],
      });
    } else if (oldRow && newRow) {
      const changes: VariantFieldDiff[] = [];
      if (oldRow.price !== newRow.price) {
        changes.push({ fieldLabel: tx("Price"), from: oldRow.price || "—", to: newRow.price || "—" });
      }
      if (oldRow.discount !== newRow.discount) {
        changes.push({ fieldLabel: tx("Discount Price"), from: oldRow.discount || "—", to: newRow.discount || "—" });
      }
      if (oldRow.luck !== newRow.luck) {
        changes.push({ fieldLabel: tx("Luck Price"), from: oldRow.luck || "—", to: newRow.luck || "—" });
      }
      if (oldRow.qty !== newRow.qty) {
        changes.push({ fieldLabel: tx("Stock Qty"), from: oldRow.qty || "—", to: newRow.qty || "—" });
      }
      if (oldRow.sku !== newRow.sku) {
        changes.push({ fieldLabel: tx("SKU"), from: oldRow.sku || "—", to: newRow.sku || "—" });
      }
      if (oldRow.barcode !== newRow.barcode) {
        changes.push({ fieldLabel: tx("Barcode"), from: oldRow.barcode || "—", to: newRow.barcode || "—" });
      }
      if (oldRow.location_id !== newRow.location_id) {
        changes.push({
          fieldLabel: tx("Location"),
          from: locationName(oldRow.location_id),
          to: locationName(newRow.location_id),
        });
      }

      if (changes.length > 0) {
        variantsDetails.push({
          key,
          title,
          colorCode: cb?.colorCode,
          colorName: cb?.colorName,
          sizeName: cb?.sizeName,
          status: "modified",
          changes,
        });
      }
    }
  }

  if (variantsDetails.length > 0) {
    out.push({
      key: "variations",
      label: tx("Variant Pricing & Stock"),
      type: "variants",
      variantsDetails,
    });
  }

  // 14. Color → Image Assignment
  if (JSON.stringify(initial.colorImages) !== JSON.stringify(current.colorImages)) {
    out.push({
      key: "colorImages",
      label: tx("Color → Image Assignment"),
      from: tx("edited"),
      to: tx("updated"),
      type: "text",
    });
  }

  // 15. Translations (Granular Language & Field Level)
  const LANG_DISPLAY: Record<string, string> = {
    en: "English (en)",
    ar: "العربية (ar)",
    ku: "كوردی (ku)",
    tr: "Türkçe (tr)",
  };

  const allLangs = Array.from(
    new Set([
      ...initial.translations.map((t) => t.language_code),
      ...current.translations.map((t) => t.language_code),
    ])
  );

  const translationsDetails: TranslationDiffItem[] = [];

  for (const langCode of allLangs) {
    const oldTr = initial.translations.find((t) => t.language_code === langCode);
    const newTr = current.translations.find((t) => t.language_code === langCode);
    const langName = LANG_DISPLAY[langCode] || langCode.toUpperCase();

    if (!oldTr && newTr) {
      translationsDetails.push({
        langCode,
        langName,
        status: "added",
        changes: [
          { fieldLabel: tx("Product Name"), from: "—", to: newTr.name || "—" },
          ...(newTr.description ? [{ fieldLabel: tx("Description"), from: "—", to: newTr.description }] : []),
          ...(newTr.similar_words?.length ? [{ fieldLabel: tx("Keywords"), from: "—", to: newTr.similar_words.join(", ") }] : []),
        ],
      });
    } else if (oldTr && !newTr) {
      translationsDetails.push({
        langCode,
        langName,
        status: "removed",
        changes: [{ fieldLabel: tx("Product Name"), from: oldTr.name || "—", to: "—" }],
      });
    } else if (oldTr && newTr) {
      const changes: TranslationFieldDiff[] = [];
      if (oldTr.name !== newTr.name) {
        changes.push({ fieldLabel: tx("Product Name"), from: oldTr.name || "—", to: newTr.name || "—" });
      }
      if (oldTr.description !== newTr.description) {
        changes.push({ fieldLabel: tx("Description"), from: oldTr.description || "—", to: newTr.description || "—" });
      }
      const oldSim = (oldTr.similar_words || []).join(", ");
      const newSim = (newTr.similar_words || []).join(", ");
      if (oldSim !== newSim) {
        changes.push({ fieldLabel: tx("Keywords / Search Terms"), from: oldSim || "—", to: newSim || "—" });
      }

      if (changes.length > 0) {
        translationsDetails.push({
          langCode,
          langName,
          status: "modified",
          changes,
        });
      }
    }
  }

  if (initial.default_language_code !== current.default_language_code) {
    translationsDetails.push({
      langCode: current.default_language_code || "default",
      langName: tx("Default Language"),
      status: "modified",
      changes: [
        {
          fieldLabel: tx("Default Language Code"),
          from: initial.default_language_code || "—",
          to: current.default_language_code || "—",
        },
      ],
    });
  }

  if (translationsDetails.length > 0) {
    out.push({
      key: "translations",
      label: tx("Translations"),
      type: "translations",
      translationsDetails,
    });
  }

  // 16. Videos
  if (current.cloud_video) {
    out.push({
      key: "cloud_video",
      label: tx("Video"),
      from: "—",
      to: tx("New video file uploaded"),
      type: "text",
    });
  }
  if (current.remove_videos.length > 0) {
    out.push({
      key: "remove_videos",
      label: tx("Removed Videos"),
      from: `${current.remove_videos.length} ${tx("video(s)")}`,
      to: tx("Removed"),
      type: "text",
    });
  }

  return out;
}

function eqArr(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].map(String).sort();
  const sb = [...b].map(String).sort();
  return sa.every((v, i) => v === sb[i]);
}
