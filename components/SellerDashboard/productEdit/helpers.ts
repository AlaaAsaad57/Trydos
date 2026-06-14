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
 * See docs/product-edit.md for the contract this mirrors.
 */

export const UNITS = ["pc", "kg", "gms", "l"] as const;

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
  descriptor_groups: any[];
  units: string[];
}

export interface VariantRow {
  price: string;
  discount: string;
  extra: string;
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
  language_code: string;
  name: string;
  description: string;
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
  multiply_qty: boolean;
  packed_after_ordering: boolean;
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
  extra: "",
  luck: "",
  qty: "",
  sku: "",
  barcode: "",
});

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
  const colorById = new Map((lookups.colors || []).map((c) => [c.id, c]));
  const sizeById = new Map((lookups.sizes || []).map((s) => [s.id, s]));

  const colors: SelColor[] = (product.selected_colors || []).map(
    (code: string) => {
      const c = colorByCode.get(String(code).toUpperCase());
      return { code, name: c?.name || code, id: c?.id };
    },
  );
  const sizes: SelSize[] = (product.selected_size_ids || [])
    .map((id: number) => {
      const s = sizeById.get(id);
      return s ? { id: s.id, name: s.name } : null;
    })
    .filter(Boolean) as SelSize[];

  // Variations -> keyed map.
  const variations: Record<string, VariantRow> = {};
  for (const v of product.variations || []) {
    const cName = v.color_id != null ? colorById.get(v.color_id)?.name : undefined;
    const sName = v.size_id != null ? sizeById.get(v.size_id)?.name : undefined;
    const key = variantKey(cName, sName);
    if (!key) continue;
    variations[key] = {
      price: numStr(v.unit_price),
      discount: numStr(v.discount_price),
      extra: numStr(v.extra_price),
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

  const translations: Translation[] = (product.translations || []).map(
    (t: any) => ({
      language_code: t.language_code,
      name: t.name ?? "",
      description: t.details ?? t.description ?? "",
    }),
  );

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
    multiply_qty: !!product.multiply_qty,
    packed_after_ordering: !!product.packed_after_ordering,
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

const numStr = (v: any): string =>
  v === null || v === undefined || v === "" ? "" : String(v);
const idStr = (v: any): string =>
  v === null || v === undefined ? "" : String(v);

/* ------------------------------ validation ------------------------------- */

export function validate(form: ProductForm): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.name.trim()) e.name = "Product name is required";
  if (!UNITS.includes(form.unit as any)) e.unit = "Select a valid unit";
  if (!form.seller_product_id.trim())
    e.seller_product_id = "Seller product ID is required";

  const up = num(form.unit_price);
  const dp = num(form.discount_price);
  if (form.unit_price === "" || isNaN(up) || up < 0)
    e.unit_price = "Enter a valid unit price";
  if (form.discount_price !== "") {
    if (isNaN(dp) || dp < 0) e.discount_price = "Enter a valid discount price";
    else if (!isNaN(up) && dp > up)
      e.discount_price = "Discount must be ≤ unit price";
  }
  if (form.purchase_price !== "" && (isNaN(num(form.purchase_price)) || num(form.purchase_price) < 0))
    e.purchase_price = "Enter a valid purchase price";

  if (
    (form.unit === "pc" || form.unit === "l") &&
    (form.weight === "" || isNaN(num(form.weight)) || num(form.weight) <= 0)
  )
    e.weight = "Weight is required for pc / liter units";

  if (form.current_stock !== "" && (isNaN(num(form.current_stock)) || num(form.current_stock) < 0))
    e.current_stock = "Enter a valid stock";

  if (form.labels.length > 3) e.labels = "At most 3 labels allowed";

  if (!form.images.length) e.images = "At least one product image is required";

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
      e.colorImages = `Every color needs at least one image (missing: ${missingColor})`;
    else {
      const unassigned = form.images.filter((im) => !assigned.has(im.name));
      if (unassigned.length)
        e.colorImages = `Every image must be assigned to a color (${unassigned.length} unassigned)`;
    }
  }

  // Each active variant needs a qty + sku.
  for (const c of combos(form)) {
    const r = form.variations[c.key];
    if (!r || r.qty === "" || isNaN(num(r.qty))) {
      e.variations = "Every variant needs a quantity";
      break;
    }
    if (!r.sku.trim()) {
      e.variations = "Every variant needs an SKU";
      break;
    }
  }

  // An English translation is required to (later) enable the product.
  if (!form.translations.some((t) => t.language_code === "en" && t.name.trim()))
    e.translations = "An English (en) name is required";

  return e;
}

/* ---------------------------- update payload ----------------------------- */

export function buildUpdateFormData(form: ProductForm): FormData {
  const fd = new FormData();
  const set = (k: string, v: any) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  };

  set("name", form.name);
  set("unit", form.unit);
  set("barcode", form.barcode);
  set("seller_product_id", form.seller_product_id);
  set("description", form.description);
  set("brand_id", form.brand_id);
  set("boutique_id", form.boutique_id);
  if (form.label) set("label", form.label);
  if (form.model_number) set("model_number", form.model_number);
  if (form.report_ref_number) set("report_ref_number", form.report_ref_number);
  if (form.location_id) set("location_id", form.location_id);

  set("unit_price", form.unit_price);
  set("discount_price", form.discount_price === "" ? "0" : form.discount_price);
  set("purchase_price", form.purchase_price === "" ? "0" : form.purchase_price);
  if (form.luck_price !== "") set("luck_price", form.luck_price);
  set("current_stock", form.current_stock === "" ? "0" : form.current_stock);
  if (form.weight !== "") set("weight", form.weight);
  set("max_allowed_qty", form.max_allowed_qty === "" ? "0" : form.max_allowed_qty);
  set("count_of_pieces", form.count_of_pieces === "" ? "1" : form.count_of_pieces);
  set("shipping_cost", form.shipping_cost === "" ? "0" : form.shipping_cost);
  set("shipping_days", form.shipping_days === "" ? "0" : form.shipping_days);
  set("tax", form.tax === "" ? "0" : form.tax);
  set("tax_type", form.tax_type);
  if (form.multiply_qty) set("multiplyQTY", "on");
  if (form.packed_after_ordering) set("packed_after_ordering", "on");

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
    fd.append(`price_${c.key}_extra`, r.extra || "0");
    fd.append(`price_${c.key}_luck`, r.luck || "0");
    fd.append(`qty_${c.key}`, r.qty || "0");
    fd.append(`sku_${c.key}`, r.sku || "");
    fd.append(`barcode_${c.key}`, r.barcode || "");
  });

  form.translations.forEach((t, i) => {
    fd.append(`custom_data[${i}][language_code]`, t.language_code);
    fd.append(`custom_data[${i}][name]`, t.name || "");
    fd.append(`custom_data[${i}][description]`, t.description || "");
  });

  if (form.cloud_video) set("cloud_video", form.cloud_video);
  form.remove_videos.forEach((v) => fd.append("remove_videos[]", v));

  return fd;
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
    push(label, initial[key], current[key]);
  }

  const brandName = (id: string) =>
    lookups.brands.find((b) => String(b.id) === id)?.name || id || "—";
  const boutiqueName = (id: string) =>
    lookups.boutiques.find((b) => String(b.id) === id)?.name || id || "—";
  if (initial.brand_id !== current.brand_id)
    out.push({
      label: "Brand",
      from: brandName(initial.brand_id),
      to: brandName(current.brand_id),
    });
  if (initial.boutique_id !== current.boutique_id)
    out.push({
      label: "Boutique",
      from: boutiqueName(initial.boutique_id),
      to: boutiqueName(current.boutique_id),
    });

  push(
    "Multiply Shipping × Qty",
    initial.multiply_qty ? "On" : "Off",
    current.multiply_qty ? "On" : "Off",
  );
  push(
    "Packed After Ordering",
    initial.packed_after_ordering ? "On" : "Off",
    current.packed_after_ordering ? "On" : "Off",
  );

  const cnt = (label: string, a: any[], b: any[]) =>
    push(label, `${a.length} item(s)`, `${b.length} item(s)`);
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
  if (!eqArr(initial.countries_iso, current.countries_iso))
    cnt("Restricted Countries", initial.countries_iso, current.countries_iso);

  if (JSON.stringify(initial.extra_price_for_country) !== JSON.stringify(current.extra_price_for_country))
    cnt(
      "Per-country Extra Price",
      initial.extra_price_for_country,
      current.extra_price_for_country,
    );

  if (initial.images.map((i) => i.name).join() !== current.images.map((i) => i.name).join())
    push("Product Images", `${initial.images.length} image(s)`, `${current.images.length} image(s)`);

  if (initial.meta_image !== current.meta_image)
    push("Meta Image", initial.meta_image, current.meta_image);

  if (!eqArr(initial.colors.map((c) => c.code), current.colors.map((c) => c.code)))
    push(
      "Colors",
      initial.colors.map((c) => c.name).join(", ") || "—",
      current.colors.map((c) => c.name).join(", ") || "—",
    );
  if (!eqArr(initial.sizes.map((s) => s.id), current.sizes.map((s) => s.id)))
    push(
      "Sizes",
      initial.sizes.map((s) => s.name).join(", ") || "—",
      current.sizes.map((s) => s.name).join(", ") || "—",
    );

  if (JSON.stringify(initial.variations) !== JSON.stringify(current.variations))
    out.push({
      label: "Variant Pricing / Stock",
      from: "edited",
      to: `${combos(current).length} variant(s)`,
    });

  if (JSON.stringify(initial.colorImages) !== JSON.stringify(current.colorImages))
    out.push({ label: "Color → Image Assignment", from: "edited", to: "updated" });

  const trChanged = current.translations.filter((t) => {
    const o = initial.translations.find((x) => x.language_code === t.language_code);
    return !o || o.name !== t.name || o.description !== t.description;
  });
  if (trChanged.length || initial.translations.length !== current.translations.length)
    push(
      "Translations",
      `${initial.translations.length} language(s)`,
      `${current.translations.length} language(s)`,
    );

  if (current.cloud_video)
    out.push({ label: "Video", from: "—", to: "new upload" });
  if (current.remove_videos.length)
    out.push({
      label: "Video",
      from: `${current.remove_videos.length} removed`,
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
