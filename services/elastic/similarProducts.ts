// Photo search: the products whose photos are nearest to the shopper's photo.
//
// The backend writes one vector per product photo into the nested field
// `color_image_vectors` on the catalogue index. This file builds the kNN query
// and turns its hits into the same product shape the search overlay already
// shows. Every choice below was checked against the staging index on
// 2026-11-15 (Elasticsearch 8.19.19):
//
// - The shopper rules and the shopper's own filters (`buildBaseConditions`) go
//   inside `knn.filter`, nested rules too. Each was checked on 2026-11-16 in
//   SY, TR, IQ and LB: brand, boutique, category, color, size, price (the
//   country price too), and mixes of them. Every result matched the filter,
//   the text search listing found the same products, and the top 20 equalled
//   an exact ranking. Because the filters run during the search, we still get
//   `k` results; a `post_filter` would drop some after the top `k` were picked.
// - The index stores the vectors as `int8_hnsw` (8-bit). On its own that
//   ranked a different product above a photo's own product. `rescore_vector`
//   re-scores the best candidates with the full vectors, and then the order
//   matched an exact brute-force search.
// - `similarity` is the raw cosine (-1..1). The `_score` is (1 + cosine) / 2.
import { buildBaseConditions, extractFilters, normalizeCustomProducts } from "./helpers";
import { catalog_index } from "./INDEXES";

const VECTOR_FIELD = "color_image_vectors.vector";

/** How many products one photo search returns (same as text search). */
const SIMILAR_PRODUCTS_SIZE = 20;

/**
 * The lowest cosine a product may have and still be shown.
 *
 * Measured on staging: the same product, re-encoded, cropped or turned,
 * scored 0.89 or more. A garment the catalogue does not have scored
 * 0.72-0.75 at best. A picture with no product (a map, an icon) scored
 * 0.61-0.73. The last two ranges overlap, so no value splits "similar" from
 * "unrelated". 0.65 only drops what is clearly unrelated and keeps similar
 * items. Tune it with real shopper photos, through the env value.
 */
export const DEFAULT_MIN_SIMILARITY = 0.65;

export const minSimilarity = () => {
  const value = Number(process.env.IMAGE_SEARCH_MIN_SIMILARITY);
  return Number.isFinite(value) && value >= -1 && value <= 1 && process.env.IMAGE_SEARCH_MIN_SIMILARITY
    ? value
    : DEFAULT_MIN_SIMILARITY;
};

/** The fields a result card needs. Never the vectors: each product carries up
 *  to dozens of 768-number lists, and full `_source` would download them all. */
const SIMILAR_PRODUCT_FIELDS = [
  "id",
  "images",
  "thumbnail",
  "offered_price",
  "unit_price",
  "country_offer_prices",
  "extra_price_for_country",
  "colors",
  "sync_color_images",
  "current_stock",
  "boutique_id",
  "category_ids",
  "categories.position",
  "categories.id",
  "categories.parent_id",
  "categories.status",
  "brand.is_verified",
  "custom_brands.id",
  "custom_brands.name",
  "custom_brands.slug",
  "custom_brands.icon",
  "custom_brands.language_code",
  "custom_categories.id",
  "custom_categories.category_id",
  "custom_categories.name",
  "custom_categories.slug",
  "custom_categories.language_code",
  "custom_products.id",
  "custom_products.product_id",
  "custom_products.name",
  "custom_products.slug",
  "custom_products.language_code",
];

/** The shopper filters a photo search may use. Same names and meaning as the
 *  text search filters (`buildBaseConditions`). There is no search text. */
export type PhotoSearchFilters = {
  categories?: string[];
  brands?: string[];
  boutiques?: string[];
  colors?: string[];
  sizes?: string[];
  /** [lowest, highest] price in the shopper's country. */
  priceRange?: [number, number];
};

const MAX_FILTER_VALUES = 30;
const MAX_FILTER_TEXT = 100;

const textList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= MAX_FILTER_TEXT)
    .slice(0, MAX_FILTER_VALUES);
  return list.length ? list : undefined;
};

/** The filters from the request, with anything unexpected dropped.
 *
 *  The value comes from the browser, so it is read field by field: only the
 *  six known names, only lists of short strings, and a price range of two
 *  numbers from 0 up, lowest first. Any other shape becomes "no filter". */
export function readPhotoSearchFilters(raw: unknown): PhotoSearchFilters {
  let data: any = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const filters: PhotoSearchFilters = {};
  for (const name of ["categories", "brands", "boutiques", "colors", "sizes"] as const) {
    const list = textList(data[name]);
    if (list) filters[name] = list;
  }
  const price = data.priceRange;
  if (
    Array.isArray(price) &&
    price.length === 2 &&
    price.every((p) => typeof p === "number" && Number.isFinite(p) && p >= 0) &&
    price[0] <= price[1]
  ) {
    filters.priceRange = [price[0], price[1]];
  }
  return filters;
}

export function buildSimilarProductsQuery({
  vector,
  country,
  qaView = false,
  filters = {},
  size = SIMILAR_PRODUCTS_SIZE,
  similarity = minSimilarity(),
}: {
  vector: number[];
  country: string;
  qaView?: boolean;
  filters?: PhotoSearchFilters;
  size?: number;
  similarity?: number;
}) {
  // The "may a shopper in this country see this product" rules, plus the
  // shopper's own filters. No search text: the photo is the search.
  const { must, must_not } = buildBaseConditions(
    {
      categories: filters.categories,
      brands: filters.brands,
      boutiques: filters.boutiques,
      colors: filters.colors,
      sizes: filters.sizes,
      priceRange: filters.priceRange,
    },
    country,
    qaView,
  );
  return {
    index: catalog_index,
    size,
    _source: SIMILAR_PRODUCT_FIELDS,
    knn: {
      field: VECTOR_FIELD,
      query_vector: vector,
      k: size,
      num_candidates: size * 10,
      rescore_vector: { oversample: 2 },
      similarity,
      filter: { bool: { must, must_not } },
      // Which photo of the product matched best. A product appears once, at
      // the score of its best photo.
      inner_hits: { size: 1, _source: ["color_image_vectors.image"] },
    },
  };
}

const parseList = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** The color whose photo list holds this photo.
 *
 *  The match also carries a `color_id`, but no product field the storefront
 *  reads has color ids: `sync_color_images` has the color name and the photo
 *  names only. So the photo name is the link to the color. */
export function colorOfImage(syncColorImages: unknown, image?: string) {
  if (!image) return undefined;
  return parseList(syncColorImages).find((c) => parseList(c?.images).includes(image))
    ?.color_name as string | undefined;
}

type SimilarProduct = {
  product_id: number;
  name: string;
  slug: string;
  categroy?: any;
  images: { file_path: string }[];
  /** The color of the photo that matched; the product page opens on it. */
  color?: string;
  price?: any;
  offer_price?: any;
  brand?: any;
  /** Cosine similarity of the best photo, -1..1. */
  similarity: number;
};

/** Hits in, result cards out, best match first. */
export function toSimilarProducts(
  hits: any[],
  language: string,
  country: string,
): SimilarProduct[] {
  const matches = new Map<string, { image?: string; color?: string; similarity: number }>();
  for (const hit of hits || []) {
    const image = hit?.inner_hits?.color_image_vectors?.hits?.hits?.[0]?._source?.image;
    matches.set(String(hit._id), {
      image,
      // Read from the raw hit: normalising below drops colors that are not in
      // the product's `colors` list.
      color: colorOfImage(hit?._source?.sync_color_images, image),
      similarity: 2 * (hit?._score ?? 0) - 1,
    });
  }

  // The same language, price and brand rules as text search. Products with no
  // text in the shopper's language are dropped there, as in text search.
  const normalized = normalizeCustomProducts(
    extractFilters((hits || []).map((h) => h._source), language, false, country),
  );

  return (normalized.custom_products || []).map((s: any) => {
    const match = matches.get(String(s.product_id));
    const fallbackImage = s.sync_color_images?.[0]?.images?.[0] ?? s.images?.[0];
    return {
      product_id: Number(s.product_id),
      name: s.name,
      slug: s.slug,
      categroy: s.category,
      images: [match?.image ? { file_path: `/product/${match.image}` } : fallbackImage].filter(Boolean),
      color: match?.image ? match.color : s.sync_color_images?.[0]?.color_name,
      price: s.price,
      offer_price: s.offer_price,
      brand: s.brand,
      similarity: match?.similarity ?? 0,
    };
  });
}
