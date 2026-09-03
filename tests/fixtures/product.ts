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

// ---------------------------------------------------------------------------
// The two shapes the product page's server-side reader returns.
//
// Where the shapes come from (C-5): the `ProdutGlobalData` and `QtyProductData`
// interfaces declared in serverRequests/product.tsx (lines 25-118). Neither is
// exported, so the two types below repeat them here and name their source —
// the same thing tests/fixtures/elastic.ts does for `ElasticsearchHit`.
//
// NOTHING here imports serverRequests/product. A value import would drag a
// "use server" module, next/headers and the search client into every test file
// that uses this fixture — and four unrelated ones do.
//
// Every value is invented. `seller.email` and `seller.birthdate` exist in the
// real shape, so they are filled with obvious placeholders: a failure diff from
// this suite is copied into the CI report and sent to the team chat, and a real
// seller's address must never travel that way.
// ---------------------------------------------------------------------------

/** The product's main record — serverRequests/product.tsx `ProdutGlobalData`. */
export interface GlobalProduct {
  id: number;
  name: string;
  slug: string;
  share_link: string;
  details: string;
  images: string[];
  videos: any[];
  categories: Array<{ id: number; name: string; position: number; icon: string }>;
  brand: { id: number; slug: string; name: string; icon: string };
  label_names: any;
  flash_deal_end_date: any;
  colors: Array<{ name: string; code: string; option: string }>;
  sync_color_images: any[];
  flash_deal_max_allowed_quantity: any;
  shipping_days: number;
  is_featured: boolean;
  origin_country_iso: string;
}

/** Price, stock and variants — serverRequests/product.tsx `QtyProductData`. */
export interface QtyPriceProduct {
  id: number;
  description: any;
  model: any;
  variations: Array<{
    id: string;
    size: string;
    color: { name: string; code: string };
    type: string;
    price: number;
    offer_price: number;
    luck_price: number;
    sku: string;
    qty: number;
  }>;
  sizes: string[];
  max_allowed_qty: string;
  shipping_cost_multiply_with_quantity: boolean;
  shipping_cost: number;
  shipping_days: number;
  allow_return_in_days: number;
  price: number;
  is_luck: boolean;
  luck_price: number;
  offer_price: number;
  offer_type: string;
  unit_price: number;
  seller_id: number;
  seller: {
    name: any;
    f_name: string;
    l_name: string;
    email: string;
    gender: any;
    birthdate: string;
    review: number;
    image: string;
  };
  shop: { image: string; name: string };
  owner_type: string;
  owner_id: number;
  has_whole_sale: boolean;
  whole_sale_link: any;
  views_count: number;
  descriptors: any[];
  is_country_restricted: boolean;
  is_active: boolean;
  packed_after_ordering: number;
  available_quantity: number;
}

/**
 * The product record the main reader returns.
 *
 * Call it with nothing for a complete product. Pass a partial object to change
 * only the fields you name.
 */
export function buildGlobalProduct(
  overrides: Partial<GlobalProduct> = {},
): GlobalProduct {
  return {
    id: 1001,
    name: "Test Product",
    slug: "test-product",
    share_link: "https://site.invalid/products/test-product",
    details: "A test product used by the unit suite.",
    images: ["/product/test-product-1.jpg"],
    videos: [],
    categories: [{ id: 11, name: "Test Category", position: 1, icon: "cat.svg" }],
    brand: { id: 21, slug: "test-brand", name: "Test Brand", icon: "brand.svg" },
    label_names: [],
    flash_deal_end_date: null,
    colors: [{ name: "black", code: "#000000", option: "black" }],
    sync_color_images: [],
    flash_deal_max_allowed_quantity: null,
    shipping_days: 3,
    is_featured: false,
    origin_country_iso: "sy",
    ...overrides,
  };
}

/**
 * The price and stock payload the second reader returns. This is the money
 * shape: price, offer price, the variant list and the available quantity.
 */
export function buildQtyPriceProduct(
  overrides: Partial<QtyPriceProduct> = {},
): QtyPriceProduct {
  return {
    id: 1001,
    description: "A test product used by the unit suite.",
    model: "TP-1",
    variations: [
      {
        id: "v-1",
        size: "M",
        color: { name: "black", code: "#000000" },
        type: "simple",
        price: 100,
        offer_price: 80,
        luck_price: 0,
        sku: "TP-1-M-BLACK",
        qty: 5,
      },
    ],
    sizes: ["M"],
    max_allowed_qty: "10",
    shipping_cost_multiply_with_quantity: false,
    shipping_cost: 5,
    shipping_days: 3,
    allow_return_in_days: 14,
    price: 100,
    is_luck: false,
    luck_price: 0,
    offer_price: 80,
    offer_type: "percentage",
    unit_price: 100,
    seller_id: 31,
    seller: {
      name: "Test Seller",
      f_name: "Test",
      l_name: "Seller",
      email: "seller@example.com",
      gender: null,
      birthdate: "1990-01-01",
      review: 4,
      image: "seller.jpg",
    },
    shop: { image: "shop.jpg", name: "Test Shop" },
    owner_type: "shop",
    owner_id: 41,
    has_whole_sale: false,
    whole_sale_link: null,
    views_count: 0,
    descriptors: [],
    is_country_restricted: false,
    is_active: true,
    packed_after_ordering: 1,
    available_quantity: 5,
  ...overrides,
  };
}
