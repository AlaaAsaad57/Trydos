// Builders for the two product shapes the app really has.
//
// Where the shapes come from (C-5 — every field is copied from a shape written
// down in this repository, never guessed):
//   - ListingProduct  -> types/listing.ts, and the object that
//                        utils/listing/normalizeListingProduct.ts actually
//                        builds. Note that the real normalizer writes `brand`
//                        as { id, icon, is_verified } with NO `name`, so this
//                        builder does the same. A builder that invented
//                        `brand.name` would let a test pass against a field
//                        production never sends.
//   - CustomProduct   -> services/elastic/helpers.ts — the raw search-engine
//                        row, as it looks after normalizeCustomProducts() has
//                        expanded `images` and `sync_color_images`.
//
// Both types come in through `import type`, which the compiler removes. No
// production module is loaded when a test uses these builders.
import type { CustomProduct } from "services/elastic/helpers";
import type { ListingProduct } from "types/listing";

/**
 * The tidied-up product shape every listing fetch returns.
 *
 * Call it with nothing for a complete, valid product. Pass a partial object to
 * change only the fields you name; everything else keeps its default.
 */
export function buildListingProduct(
  overrides: Partial<ListingProduct> = {},
): ListingProduct {
  return {
    name: "Test Product",
    slug: "test-product",
    label_names: [],
    category_tree: [],
    videos: [],
    colors: [{ name: "black", color: "#000000" }],
    sync_color_images: [],
    images: [{ file_path: "/product/test-product-1.jpg" }],
    price: 100,
    offer_price: 80,
    luck_price: 0,
    categories: [{ id: 1, name: "Test Category" }],
    // Matches normalizeListingProduct(): id + icon + is_verified only.
    brand: {
      id: 1,
      icon: { file_path: "/brand/test-brand.png" },
      is_verified: 1,
    },
    flash_deal_end_date: null,
    flash_deal_price: null,
    product_id: 1001,
    is_luck: false,
    ...overrides,
  };
}

/**
 * The raw search-engine row, before it is tidied up for a listing.
 *
 * `redeem_price` is included because services/elastic/elasticSearch.ts derives
 * `is_luck` and `luck_price` from it right after normalizeCustomProducts().
 */
export function buildSearchEngineProduct(
  overrides: Partial<CustomProduct> = {},
): CustomProduct {
  return {
    id: "1001",
    product_id: "1001",
    name: "Test Product",
    slug: "test-product",
    status: 1,
    language_code: "en",
    label_names: [],
    videos: [],
    thumbnail: "test-product-thumb.jpg",
    images: [{ file_path: "/product/test-product-1.jpg" }],
    colors: [{ name: "black", color: "#000000" }],
    sync_color_images: [],
    price: 100,
    offer_price: 80,
    boutique_id: "2001",
    in_stock: true,
    redeem_price: 0,
    ...overrides,
  };
}
