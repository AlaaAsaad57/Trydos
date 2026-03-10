export function getSourceFields(): string[] {
  return [
    "id",
    "status",
    "seller_status",
    "added_by",
    "countries_iso",
    "images",
    "videos",
    "thumbnail",
    "flash_deal_status",
    // "flash_deal_discount",
    "flash_deal_price",
    "offered_price",
    "unit_price",
    "country_offer_prices",
    "extra_price_for_country",
    "colors",
    "text_colors",
    "sync_color_images",
    // "discount",
    // "discount_type",
    // "redeem_discount_rate",
    "redeem_price",
    "current_stock",
    "boutique_id",
    // "available_size",
    "category_ids",
    "end_date",
    "start_date",
    "boutique.status",
    "brand.status",
    "brand.is_verified",
    "categories.num_available_product",
    "categories.status",
    "categories.position",
    "categories.id",
    "categories.parent_id",
    "categories.gender",
    "categories.group_age",
    "custom_brands.id",
    "custom_brands.name",
    "custom_brands.slug",
    "custom_brands.icon",
    "custom_brands.language_code",
    "custom_boutiques.id",
    "custom_boutiques.name",
    "custom_boutiques.slug",
    "custom_boutiques.banners",
    "custom_boutiques.language_code",
    "custom_categories.id",
    "custom_categories.category_id",
    "custom_categories.name",
    "custom_categories.slug",
    // "custom_categories.description",
    // "custom_categories.bio",
    "custom_categories.language_code",
    "custom_categories.flat_photo_path",
    "custom_categories.outline_photo_path",
    "custom_categories.png_photo_path",
    "custom_categories.fill_photo_path",
    "custom_categories.banner_photo_path",
    "custom_products.id",
    "custom_products.product_id",
    "custom_products.name",
    "custom_products.slug",
    "custom_products.status",
    "custom_products.details",
    "custom_products.language_code",
    "custom_products.label_names",
  ];
}
export interface ExtractFiltersResult {
  custom_products: CustomProduct[];
  prices: any;
}

export interface CustomProduct {
  id: string;
  product_id?: string;
  name?: string;
  slug?: string;
  status?: number;
  details?: string;
  language_code?: string;
  label_names?: string[];
  videos?: any[];
  thumbnail?: string;
  images?: any[];
  colors?: any[];
  sync_color_images?: any[];
  price?: number;
  offer_price?: number;
  boutique_id?: string;
  in_stock?: boolean;
  [key: string]: any;
}
export interface ColorItem {
  name: string;
  color?: string;
  [key: string]: any;
}

export interface SyncColorImage {
  color_name: string;
  [key: string]: any;
}
interface PriceRange {
  min_price: number;
  max_price: number;
  products_count: number;
}

interface FinalPrices {
  min_price: number;
  max_price: number;
  priceRanges: PriceRange[];
}
interface SearchFilters {
  categories?: string[];
  related_categories?: string[];
  brands?: string[];
  boutiques?: string[];
  colors?: string[];
  sizes?: string[];
  search_text?: string;
  priceRange?: number[];
  tags_names?: string[];
  featured?: boolean;
  flashdeal?: boolean;
}

interface FilterResult {
  id: string | number;
  name?: string;
  slug?: string;
  icon?: string;
  banner?: any;
  doc_count?: number;
}

interface CategoryFilter extends FilterResult {
  category_id?: string | number;
  bio?: string;
  description?: string;
  flat_photo_path?: string;
  png_photo_path?: string;
  fill_photo_path?: string;
  banner_photo_path?: string;
  num_available_product?: number;
  parent_id?: string | number | null;
  most_viewed_product_thumbnail?: string;
  gender?: number | null;
  group_age?: number | null;
  childes: CategoryFilter[];
}

export function normalizeCustomProducts(
  productsWithFilters: ExtractFiltersResult,
): ExtractFiltersResult {
  if (
    !productsWithFilters.custom_products ||
    productsWithFilters.custom_products.length === 0
  ) {
    return productsWithFilters;
  }

  productsWithFilters.custom_products?.forEach((product) => {
    // Read the lists, whether they are arrays or objects
    const colorsList = Array.isArray(product.colors)
      ? product.colors
      : product.colors || [];
    const syncList = Array.isArray(product.sync_color_images)
      ? product.sync_color_images
      : JSON.parse(product.sync_color_images || "[]") || [];

    // Apply filtering
    const cleaned = filterColorSyncObj(colorsList, syncList);

    // Reassign the cleaned values
    product.colors = cleaned.colors;
    product.sync_color_images = cleaned.sync_color_images;
    product.sync_color_images = cleaned.sync_color_images?.map((s) => ({
      ...s,
      color_trend: Boolean(s.color_trend),
      images: s.images.map((d) => ({ file_path: `/product/${d}` })),
    }));
    product.images = product.images.map((s) => ({
      file_path: `/product/${s}`,
    }));
  });

  return productsWithFilters;
}

function filterColorSyncObj(
  colors: ColorItem[],
  syncColorImages: SyncColorImage[],
): {
  colors: ColorItem[];
  sync_color_images: SyncColorImage[];
} {
  // Extract valid color names from colors array
  const validNames = colors.map((color) => color.name).filter((name) => name);

  // Filter sync_color_images to only include valid color names
  const filteredSync = syncColorImages.filter((item) => {
    return validNames.includes(item.color_name);
  });

  return {
    colors: colors,
    sync_color_images: filteredSync,
  };
}
export function extractFilters(
  products: any[],
  languageCode: string,
  isFromBrowser: boolean,
  country: string = "",
): ExtractFiltersResult {
  const customProducts: CustomProduct[] = [];

  products?.forEach((product) => {
    if (Array.isArray(product.custom_products)) {
      product.custom_products.forEach((customProduct: any) => {
        if (customProduct.language_code === languageCode) {
          customProducts.push(
            processCustomProduct(
              product,
              customProduct,
              languageCode,
              isFromBrowser,
              country,
            ),
          );
        }
      });
    }
  });

  // Calculate price range
  const prices = calculatePriceRange(products, country);

  return {
    custom_products: Object.values(customProducts),
    prices: prices,
  };
}

export function processCustomProduct(
  product: any,
  customProduct: any,
  languageCode: string,
  isFromBrowser: boolean,
  country: string = "",
): CustomProduct {
  const result: CustomProduct = { ...customProduct };

  result.videos = product.videos || [];
  result.thumbnail = product.thumbnail;

  const flashDealEndDate = product.end_date || null;
  const flashDealStartDate = product.start_date || null;
  const flashDealStatus = product.flash_deal_status || null;
  const flash_deal_price = product.flash_deal_price || null;

  // Handle flash deal
  if (
    flashDealStartDate &&
    flashDealEndDate &&
    String(flashDealStatus) === "1"
  ) {
    result.flash_deal_start_date = flashDealStartDate;
    result.flash_deal_end_date = flashDealEndDate;
    result.flash_deal_status = flashDealStatus;
    result.flash_deal_price = flash_deal_price;
    result.is_flash_deal_active = false;

    try {
      const startDate = new Date(flashDealStartDate);
      const endDate = new Date(flashDealEndDate);
      const currentDate = new Date();

      if (currentDate >= startDate && currentDate <= endDate) {
        result.is_flash_deal_active = true;
      }
    } catch (error) {
      // Date parsing failed, keep is_flash_deal_active as false
    }
  }

  result.images = parseJsonField(product.images);
  result.colors = product.colors;
  result.sync_color_images = product.sync_color_images || [];
  result.price = resolveUnitPriceForCountry(product, country);
  result.offer_price = resolveOfferPriceForCountry(product, country);
  result.boutique_id = product.boutique_id;
  result.in_stock = parseFloat(product.current_stock || "0") > 0;

  // Handle redeem discount
  const luck_price = product.redeem_price;

  result.seller_status = product?.seller_status || null;
  if (luck_price > 0) {
    result.redeem_price = luck_price;
    result.luck_price = luck_price;
  }

  // Process categories and brands
  result.category = getCustomCategoryFromHighestPositionCategory(
    product,
    languageCode,
  );
  result.categories = getAllCustomCategories(product, languageCode);
  let categories_data = extractCategoryHierarchy(product, languageCode);
  result.category_hierarchy = {
    main_category: categories_data?.main_category || null,
    sub_category: categories_data?.sub_category || null,
    sub_sub_category: categories_data?.sub_sub_category || null,
  };
  result.categories_tree = categoryNamesString(categories_data.categories_tree);
  // Find appropriate brand
  if (product.custom_brands && Array.isArray(product.custom_brands)) {
    for (const brand of product.custom_brands) {
      if (brand.language_code === languageCode) {
        result.brand = brand;
        if (product.brand?.is_verified) {
          result.brand.is_verified = product.brand.is_verified;
        } else {
          result.brand.is_verified = 0;
        }
        break;
      }
    }
  }

  if (isFromBrowser) {
    if (result.category) {
      removeCategoryExtraFields(result.category);
    }
  }

  return result;
}
function categoryNamesString(tree) {
  const names = [];

  function walk(nodes) {
    nodes?.forEach((node) => {
      names?.push(node.name);
      if (node.children && node.children.length) {
        walk(node.children);
      }
    });
  }

  walk(tree);
  return names.join(" | ");
}
function getAllCustomCategories(productData: any, lang: string): any[] {
  const result: any[] = [];

  if (!productData.category_ids || !Array.isArray(productData.category_ids)) {
    return result;
  }

  productData.category_ids.forEach((catIdData: any) => {
    if (!catIdData.id) return;

    const currentCategoryId = catIdData.id;

    // Find matching category for status check
    let matchingCategory: any = null;
    if (productData.categories && Array.isArray(productData.categories)) {
      matchingCategory = productData.categories.find(
        (cat: any) => cat.id == currentCategoryId,
      );
    }

    if (!matchingCategory || matchingCategory.status !== 1) {
      return;
    }

    // Find custom category
    let customCategory: any = null;
    if (
      productData.custom_categories &&
      Array.isArray(productData.custom_categories)
    ) {
      customCategory = productData.custom_categories.find(
        (cat: any) =>
          cat.category_id == currentCategoryId && cat.language_code === lang,
      );
    }

    if (customCategory) {
      result.push({
        ...customCategory,
        num_available_product: matchingCategory.num_available_product || null,
        most_viewed_product_thumbnail: productData.thumbnail || null,
      });
    }
  });

  return result;
}
export function calculateDiscountedPrice(
  originalPrice: number,
  discount: number,
  discountType: string,
): number {
  if (discountType === "percent") {
    return originalPrice - (originalPrice * discount) / 100;
  }
  // For flat discount
  return Math.max(0, originalPrice - discount);
}

function normalizeCountryOfferPrices(
  value: any,
): Array<{ country_iso: string; offer_price: number; extra_price: number }> {
  if (value === null || value === undefined || value === "") return [];

  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const normalized: Record<
    string,
    { country_iso: string; offer_price: number; extra_price: number }
  > = {};
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const countryIso = String(item.country_iso || "")
      .trim()
      .toUpperCase();
    if (!countryIso) continue;

    const offerPrice =
      item.offer_price != null && !isNaN(Number(item.offer_price))
        ? Number(item.offer_price)
        : null;
    if (offerPrice === null) continue;

    normalized[countryIso] = {
      country_iso: countryIso,
      offer_price: offerPrice,
      extra_price:
        item.extra_price != null && !isNaN(Number(item.extra_price))
          ? Number(item.extra_price)
          : 0,
    };
  }

  return Object.values(normalized);
}

function normalizeExtraPriceForCountry(value: any): any[] | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  return Array.isArray(value) ? value : null;
}

export function resolveUnitPriceForCountry(
  product: any,
  countryIso: string,
): number {
  const baseUnitPrice = Number(product.unit_price || 0);
  const baseOfferPrice = Number(product.offered_price ?? baseUnitPrice);
  countryIso = String(countryIso || "")
    .trim()
    .toUpperCase();

  if (!countryIso) return baseUnitPrice;

  const countryOfferPrices = normalizeCountryOfferPrices(
    product.country_offer_prices,
  );
  for (const cop of countryOfferPrices) {
    if (cop.country_iso !== countryIso) continue;
    if (cop.extra_price != null && !isNaN(cop.extra_price)) {
      return Math.max(0, baseUnitPrice + cop.extra_price);
    }
    if (cop.offer_price != null && !isNaN(cop.offer_price)) {
      const derivedExtra = cop.offer_price - baseOfferPrice;
      return Math.max(0, baseUnitPrice + derivedExtra);
    }
  }

  const extraPrices =
    normalizeExtraPriceForCountry(product.extra_price_for_country) ?? [];
  for (const item of extraPrices) {
    if (!item || typeof item !== "object") continue;
    const itemIso = String(item.country_iso || "")
      .trim()
      .toUpperCase();
    if (itemIso !== countryIso) continue;
    const extra =
      item.extra_price != null && !isNaN(Number(item.extra_price))
        ? Number(item.extra_price)
        : 0;
    return Math.max(0, baseUnitPrice + extra);
  }

  return baseUnitPrice;
}

export function resolveOfferPriceForCountry(
  product: any,
  countryIso: string,
): number {
  const baseOfferPrice = Number(
    product.offered_price ?? product.unit_price ?? 0,
  );
  countryIso = String(countryIso || "")
    .trim()
    .toUpperCase();

  if (!countryIso) return baseOfferPrice;

  const countryOfferPrices = normalizeCountryOfferPrices(
    product.country_offer_prices,
  );
  for (const cop of countryOfferPrices) {
    if (cop.country_iso === countryIso) {
      return Number(cop.offer_price ?? baseOfferPrice);
    }
  }

  const extraPrices =
    normalizeExtraPriceForCountry(product.extra_price_for_country) ?? [];
  for (const item of extraPrices) {
    if (!item || typeof item !== "object") continue;
    const itemIso = String(item.country_iso || "")
      .trim()
      .toUpperCase();
    if (itemIso !== countryIso) continue;
    const extra =
      item.extra_price != null && !isNaN(Number(item.extra_price))
        ? Number(item.extra_price)
        : 0;
    return Math.max(0, baseOfferPrice + extra);
  }

  return baseOfferPrice;
}

export function buildCountryAwarePriceRangeCondition(
  priceRange: number[],
  countryIso: string,
): any {
  const minPrice = Number(priceRange[0] || 0);
  const maxPrice = Number(priceRange[1] || minPrice);

  const baseRangeCondition = {
    range: { offered_price: { gte: minPrice, lte: maxPrice } },
  };

  countryIso = String(countryIso || "")
    .trim()
    .toUpperCase();
  if (!countryIso) return baseRangeCondition;

  return {
    bool: {
      should: [
        {
          nested: {
            path: "country_offer_prices",
            ignore_unmapped: true,
            query: {
              bool: {
                must: [
                  {
                    term: {
                      "country_offer_prices.country_iso": countryIso,
                    },
                  },
                  {
                    range: {
                      "country_offer_prices.offer_price": {
                        gte: minPrice,
                        lte: maxPrice,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        {
          bool: {
            must: [
              {
                bool: {
                  must_not: [
                    {
                      nested: {
                        path: "country_offer_prices",
                        ignore_unmapped: true,
                        query: {
                          term: {
                            "country_offer_prices.country_iso": countryIso,
                          },
                        },
                      },
                    },
                  ],
                },
              },
              baseRangeCondition,
            ],
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

function parseJsonField(jsonData: any): any[] {
  if (!jsonData) return [];

  try {
    if (typeof jsonData === "string") {
      const data = JSON.parse(jsonData);
      return Array.isArray(data) ? data : [];
    }
    return Array.isArray(jsonData) ? jsonData : [];
  } catch {
    return [];
  }
}
function extractCategoryHierarchy(productData: any, lang: string): any {
  if (!productData.category_ids || !Array.isArray(productData.category_ids)) {
    return {};
  }

  const categoriesByPosition: Record<number, any> = {};
  let categories_data = [];
  productData.category_ids.forEach((catIdData: any) => {
    if (!catIdData.id || typeof catIdData.position !== "number") {
      return;
    }

    const categoryId = catIdData.id;
    const position = catIdData.position;

    // Find custom category
    let customCategory: any = null;
    if (
      productData.custom_categories &&
      Array.isArray(productData.custom_categories)
    ) {
      customCategory = productData.custom_categories.find(
        (cat: any) =>
          cat.category_id == categoryId && cat.language_code === lang,
      );
      categories_data.push({
        ...productData.custom_categories.find(
          (cat: any) =>
            cat.category_id == categoryId && cat.language_code === lang,
        ),
        parent_id: productData?.categories?.find(
          (s) => parseInt(s.id) === parseInt(categoryId),
        )?.parent_id,
      });
    }

    if (customCategory) {
      categoriesByPosition[position] = {
        id: customCategory.id,
        name: customCategory.name,
      };
    }
  });

  const sortedCategories = Object.keys(categoriesByPosition)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((key) => categoriesByPosition[parseInt(key)]);
  let arr = buildCategoryTree(categories_data);

  return {
    main_category: sortedCategories[0] || null,
    sub_category: sortedCategories[1] || null,
    sub_sub_category: sortedCategories[2] || null,
    categories_tree: arr,
  };
}
/**
 * Build a tree of categories from a flat array
 * where `parent_id` points to another item's `category_id`.
 */
function buildCategoryTree(categories) {
  const map = {}; // keyed by category_id
  const roots = [];

  // 1️⃣ Make a map from category_id → node
  categories.forEach((cat) => {
    map[cat.category_id] = {
      parent_id: cat.parent_id,
      name: cat.name,
      category_id: cat.category_id,
      children: [],
    };
  });

  // 2️⃣ Link nodes
  categories.forEach((cat) => {
    const node = map[cat.category_id];
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].children.push(node);
    } else if (cat.parent_id === 0) {
      roots.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function getCustomCategoryFromHighestPositionCategory(
  productData: any,
  lang: string,
): any {
  if (!productData.category_ids || !Array.isArray(productData.category_ids)) {
    return null;
  }

  // Find category with highest position
  let highestCategory: any = null;
  productData.category_ids.forEach((catIdData: any) => {
    if (typeof catIdData.position === "number") {
      if (!highestCategory || catIdData.position > highestCategory.position) {
        highestCategory = catIdData;
      }
    }
  });

  if (!highestCategory) return null;

  const highestCategoryId = highestCategory.id;

  // Find matching category to check status
  let matchingCategory: any = null;
  if (productData.categories && Array.isArray(productData.categories)) {
    matchingCategory = productData.categories.find(
      (cat: any) => cat.id == highestCategoryId,
    );
  }

  if (!matchingCategory || matchingCategory.status !== 1) {
    return null;
  }

  // Find corresponding custom category
  let customCategory: any = null;
  if (
    productData.custom_categories &&
    Array.isArray(productData.custom_categories)
  ) {
    customCategory = productData.custom_categories.find(
      (cat: any) =>
        cat.category_id == highestCategoryId && cat.language_code === lang,
    );
  }

  if (!customCategory) return null;

  return {
    ...customCategory,
    num_available_product: matchingCategory.num_available_product || null,
    most_viewed_product_thumbnail: productData.thumbnail || null,
  };
}
function removeCategoryExtraFields(category: any): void {
  const fieldsToRemove = [
    "description",
    "bio",
    "outline_photo_path",
    "png_photo_path",
    "fill_photo_path",
    "banner_photo_path",
  ];

  fieldsToRemove.forEach((field) => {
    if (category[field] !== undefined) {
      delete category[field];
    }
  });
}
export function calculatePriceRange(
  products: any[],
  country: string = "",
): {
  min_price: number;
  max_price: number;
  priceRanges: any[];
} {
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  products?.forEach((product) => {
    const price = resolveOfferPriceForCountry(product, country);
    if (price > 0) {
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }
  });
  let priceRanges = calculatePriceFilter(products, country);
  return {
    min_price: minPrice === Infinity ? 0 : minPrice,
    max_price: maxPrice === -Infinity ? 0 : maxPrice,
    priceRanges: priceRanges?.priceRanges ?? [],
  };
}
function calculatePriceFilter(
  products: any[],
  country: string = "",
): FinalPrices | null {
  if (products.length === 0) return null;

  const productPrices = products.map((product) =>
    resolveOfferPriceForCountry(product, country),
  );

  const minOfferPrice = Math.min(...productPrices);
  const maxOfferPrice = Math.max(...productPrices);

  if (minOfferPrice >= maxOfferPrice) return null;

  const diff = (maxOfferPrice - minOfferPrice) / 4;
  const boundaries = [
    minOfferPrice,
    minOfferPrice + diff,
    minOfferPrice + diff * 2,
    minOfferPrice + diff * 3,
    maxOfferPrice,
  ];

  const priceRanges: PriceRange[] = [];

  for (let i = 0; i < 4; i++) {
    const rangeMin = boundaries[i];
    const rangeMax = boundaries[i + 1];

    const productsCount = productPrices.filter(
      (price) => price >= rangeMin && price <= rangeMax,
    ).length;

    priceRanges.push({
      min_price: rangeMin,
      max_price: rangeMax,
      products_count: productsCount,
    });
  }

  return {
    min_price: minOfferPrice,
    max_price: maxOfferPrice,
    priceRanges,
  };
}
export function buildBaseConditions(filters: SearchFilters, country: string) {
  const categoriesFilterSlugs = [
    ...(filters.categories || []),
    ...(filters.related_categories || []),
  ];
  const uniqueCategorySlugs = Array.from(new Set(categoriesFilterSlugs));
  const fuzziness = calculateFuzziness(filters.search_text);
  const searchWords = filters.search_text
    ? filters.search_text
        .trim()
        .split(/\s+/)
        .filter((w) => w !== "")
    : [];
  const wordCount = searchWords.length;

  const mustConditions: any[] = [
    { term: { status: 1 } },
    { nested: { path: "boutique", query: { term: { "boutique.status": 1 } } } },
    { nested: { path: "brand", query: { term: { "brand.status": 1 } } } },
  ];

  // Add category filter
  if (uniqueCategorySlugs.length) {
    mustConditions.push({
      bool: {
        must: [
          {
            nested: {
              path: "categories",
              query: { term: { "categories.status": 1 } },
            },
          },
          {
            nested: {
              path: "custom_categories",
              query: {
                terms: {
                  "custom_categories.slug.keyword": uniqueCategorySlugs,
                },
              },
            },
          },
        ],
      },
    });
  }

  // Add brand filter
  if (filters.brands?.length) {
    mustConditions.push({
      bool: {
        must: [
          { nested: { path: "brand", query: { term: { "brand.status": 1 } } } },
          {
            nested: {
              path: "custom_brands",
              query: {
                terms: { "custom_brands.slug.keyword": filters.brands },
              },
            },
          },
        ],
      },
    });
  }

  // Add boutique filter
  if (filters.boutiques?.length) {
    mustConditions.push({
      nested: {
        path: "custom_boutiques",
        query: {
          terms: { "custom_boutiques.slug.keyword": filters.boutiques },
        },
      },
    });
  }

  // Add color filter
  if (filters.colors?.length) {
    mustConditions.push({
      bool: {
        should: filters.colors.map((color) => ({
          match_phrase: { text_colors: color },
        })),
      },
    });
  }

  // Add size filter
  if (filters.sizes?.length) {
    mustConditions.push({
      bool: {
        should: filters.sizes.map((size) => ({
          match_phrase: { available_size: size },
        })),
      },
    });
  }

  // Add price range filter (country-aware)
  if (
    filters.priceRange &&
    filters.priceRange?.filter((s) => !isNaN(s) && typeof s === "number").length
  ) {
    mustConditions.push(
      buildCountryAwarePriceRangeCondition(filters.priceRange, country),
    );
  }

  // Add search text conditions
  if (filters.search_text) {
    mustConditions.push(
      buildSearchTextConditions(
        filters.search_text,
        searchWords,
        wordCount,
        fuzziness,
      ),
    );
  }

  // Add seller conditions
  {
    mustConditions.push({
      bool: {
        should: [
          { term: { added_by: "admin" } },
          {
            bool: {
              must: [
                { term: { added_by: "seller" } },
                { term: { seller_status: "approved" } },
              ],
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  }

  // Add tags filter
  if (filters.tags_names?.length) {
    mustConditions.push({
      terms: { tags_names: filters.tags_names },
    });
  }

  // Add flash deal filter
  if (filters.flashdeal === true) {
    const currentDate = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    mustConditions.push({
      bool: {
        must: [
          { term: { flash_deal_status: 1 } },
          { exists: { field: "start_date" } },
          { exists: { field: "end_date" } },
          { range: { start_date: { lte: currentDate } } },
          { range: { end_date: { gte: currentDate } } },
        ],
      },
    });
  }

  const mustNotConditions: any[] = [{ exists: { field: "deleted_at" } }];

  // Add country restrictions
  if (country) {
    const upperCountry = country.toUpperCase();

    mustNotConditions.push(
      {
        nested: {
          path: "countries_iso",
          ignore_unmapped: true,
          query: { term: { "countries_iso.iso": upperCountry } },
        },
      },
      {
        nested: {
          path: "categories",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "categories.countries_iso",
              query: { term: { "categories.countries_iso.iso": upperCountry } },
            },
          },
        },
      },
      {
        nested: {
          path: "brand",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "brand.countries_iso",
              query: { term: { "brand.countries_iso.iso": upperCountry } },
            },
          },
        },
      },
      {
        nested: {
          path: "boutique",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "boutique.countries_iso",
              query: { term: { "boutique.countries_iso.iso": upperCountry } },
            },
          },
        },
      },
    );
  }

  // Add category status restriction
  mustNotConditions.push({
    nested: {
      path: "categories",
      query: {
        bool: {
          must: [{ term: { "categories.status": 0 } }],
        },
      },
    },
  });

  return {
    must: mustConditions,
    must_not: mustNotConditions,
  };
}

function buildSearchTextConditions(
  searchText: string,
  searchWords: string[],
  wordCount: number,
  fuzziness: string | number | null,
): any {
  const shouldClauses: any[] = [];

  // Nested product search
  shouldClauses.push({
    nested: {
      path: "custom_products",
      query: {
        bool: {
          should: [
            // Exact phrase matches
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.name.exact^4",
                  "custom_products.slug.english^3",
                  "custom_products.descriptors_names.english^2",
                  "custom_products.label_names.english^2.5",
                  "custom_products.label_names.exact^2",
                  "custom_products.similar_words.english^2",
                  "custom_products.similar_words.exact^2",
                ],
                type: "phrase",
                analyzer: "english_edge_ngram_analyzer",
                slop: 0,
                boost: 10,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.name.exact^4",
                  "custom_products.slug.english^3",
                  "custom_products.descriptors_names.english^2",
                  "custom_products.label_names.english^2.5",
                  "custom_products.similar_words.english^2",
                  "custom_products.label_names.exact^2",
                  "custom_products.similar_words.exact^2",
                ],
                type: "phrase",
                analyzer: "standard",
                slop: 0,
                boost: 10,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.name.arabic^4",
                  "custom_products.slug.arabic^3",
                  "custom_products.descriptors_names.arabic^2",
                  "custom_products.label_names.arabic^2.5",
                  "custom_products.label_names.exact^2",
                  "custom_products.similar_words.english^2",
                  "custom_products.similar_words.exact^2",
                ],
                type: "phrase",
                analyzer: "arabic",
                slop: 0,
                boost: 10,
              },
            },
            // Fuzzy matches
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.details^1",
                  "custom_products.name.english^2",
                  "custom_products.slug.english^1",
                  "custom_products.descriptors_names.english",
                  "custom_products.label_names.english^1.5",
                  "custom_products.similar_words.english^2",
                ],
                analyzer: "standard",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.details.arabic^1",
                  "custom_products.name.arabic^2",
                  "custom_products.slug.arabic^1",
                  "custom_products.descriptors_names.arabic",
                  "custom_products.label_names.arabic^1.5",
                  "custom_products.similar_words.arabic^2",
                ],
                analyzer: "arabic",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  // Nested categories search
  shouldClauses.push({
    nested: {
      path: "custom_categories",
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: searchText,
                fields: ["custom_categories.name.english^1"],
                analyzer: "standard",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: ["custom_categories.name.arabic^1"],
                analyzer: "arabic",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  // Nested brands search
  shouldClauses.push({
    nested: {
      path: "custom_brands",
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: searchText,
                fields: ["custom_brands.name.english^1"],
                analyzer: "standard",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 2,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: ["custom_brands.name.arabic^1"],
                analyzer: "arabic",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 2,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  // Colors search
  shouldClauses.push({
    multi_match: {
      query: searchText,
      fields: [
        "similar_words_colors^3",
        "similar_words_colors.arabic^2",
        "similar_words_colors.english^2",
      ],
      type: "best_fields",
      boost: 2,
    },
  });

  // Multi-word search logic
  if (wordCount > 1 && wordCount < 3) {
    shouldClauses.push(buildMultiWordSearch(searchWords, fuzziness));
  }

  if (wordCount > 2) {
    const atLeastTwoClause = buildAtLeastTwoClause(searchWords, fuzziness);
    if (atLeastTwoClause) {
      shouldClauses.push(atLeastTwoClause);
    }
  }

  return {
    bool: {
      should: shouldClauses,
      minimum_should_match: 1,
    },
  };
}
function buildMultiWordSearch(
  searchWords: string[],
  fuzziness: string | number | null,
): any {
  const mustClauses: any[] = [];

  searchWords.forEach((word) => {
    if (!word || word.trim() === "") return;

    const trimmedWord = word.trim();
    const wordShould: any[] = [];

    // Search in nested custom_products
    wordShould.push({
      nested: {
        path: "custom_products",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details^1",
                    "custom_products.name.english^2",
                    "custom_products.label_names.english^2",
                    "custom_products.label_names.exact^1.5",
                    "custom_products.similar_words.english^2",
                  ],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details.arabic^1",
                    "custom_products.name.arabic^2",
                    "custom_products.label_names.arabic^2",
                    "custom_products.label_names.exact^1.5",
                    "custom_products.similar_words.english^2",
                  ],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_categories
    wordShould.push({
      nested: {
        path: "custom_categories",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_brands
    wordShould.push({
      nested: {
        path: "custom_brands",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 4,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 4,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    mustClauses.push({
      bool: {
        should: wordShould,
        minimum_should_match: 1,
      },
    });
  });

  return {
    bool: {
      must: mustClauses,
    },
  };
}
function buildAtLeastTwoClause(
  searchWords: string[],
  fuzziness: string | number | null,
  boost: number = 1,
): any | null {
  if (searchWords.length < 2) {
    return null;
  }

  const shouldClausesForEachWord: any[] = [];

  searchWords.forEach((word) => {
    if (!word || word.trim() === "") return;

    const trimmedWord = word.trim();
    const subShould: any[] = [];

    // Search in nested custom_products
    subShould.push({
      nested: {
        path: "custom_products",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details^1",
                    "custom_products.name.english^2",
                    "custom_products.similar_words.english^2",
                  ],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details.arabic^1",
                    "custom_products.name.arabic^2",
                    "custom_products.similar_words.arabic^2",
                  ],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_categories
    subShould.push({
      nested: {
        path: "custom_categories",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_brands
    subShould.push({
      nested: {
        path: "custom_brands",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    shouldClausesForEachWord.push({
      bool: {
        should: subShould,
        minimum_should_match: 1,
      },
    });
  });

  if (shouldClausesForEachWord.length === 0) {
    return null;
  }

  const minimumMatch = searchWords.length < 4 ? 2 : 3;
  const finalBoost = searchWords.length >= 4 ? boost * 2 : boost;

  return {
    bool: {
      should: shouldClausesForEachWord,
      minimum_should_match: minimumMatch,
      boost: finalBoost,
    },
  };
}

function calculateFuzziness(searchText?: string): string | number | null {
  if (!searchText) return null;
  const length = searchText.length;
  return 1;
  return length >= 7 && length <= 12 ? 1 : null;
}

export function buildAggregations(
  mustConditions: any[],
  mustNotConditions: any[],
  languageCode: string,
  filtersSize: number,
): Record<string, any> {
  const filterCondition = {
    bool: {
      must: mustConditions,
      must_not: mustNotConditions,
    },
  };

  return {
    filtered_results: {
      filter: filterCondition,
      aggs: {
        top_brands: {
          nested: { path: "custom_brands" },
          aggs: {
            filtered_brands: {
              filter: { term: { "custom_brands.language_code": languageCode } },
              aggs: {
                brands_by_id: {
                  terms: { field: "custom_brands.id", size: filtersSize },
                  aggs: {
                    brand_details: {
                      top_hits: {
                        _source: {
                          includes: [
                            "custom_brands.name",
                            "custom_brands.slug",
                            "custom_brands.icon",
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        top_boutiques: {
          nested: { path: "custom_boutiques" },
          aggs: {
            filtered_boutiques: {
              filter: {
                term: { "custom_boutiques.language_code": languageCode },
              },
              aggs: {
                boutiques_by_id: {
                  terms: { field: "custom_boutiques.id", size: filtersSize },
                  aggs: {
                    boutique_details: {
                      top_hits: {
                        _source: {
                          includes: [
                            "custom_boutiques.name",
                            "custom_boutiques.slug",
                            "custom_boutiques.banners",
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        top_categories: {
          nested: { path: "custom_categories" },
          aggs: {
            filtered_categories: {
              filter: {
                bool: {
                  must: [
                    {
                      term: { "custom_categories.language_code": languageCode },
                    },
                    { term: { "custom_categories.position": 0 } }, // or "0" if it's a string
                  ],
                },
              },
              aggs: {
                categories_by_id: {
                  terms: {
                    field: "custom_categories.category_id",
                    size: filtersSize,
                  },
                  aggs: {
                    category_details: {
                      top_hits: {
                        size: 1,
                        _source: {
                          includes: [
                            "custom_categories.id",
                            "custom_categories.category_id",
                            "custom_categories.name",
                            "custom_categories.slug",
                            "custom_categories.bio",
                            "custom_categories.description",
                            "custom_categories.flat_photo_path",
                            "custom_categories.png_photo_path",
                            "custom_categories.fill_photo_path",
                            "custom_categories.banner_photo_path",
                          ],
                        },
                      },
                    },
                    to_product: {
                      reverse_nested: {},
                      aggs: {
                        product_thumbnail: {
                          top_hits: {
                            size: 1,
                            _source: { includes: ["thumbnail"] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        top_orig_categories: {
          nested: { path: "categories" },
          aggs: {
            orig_categories_by_id: {
              terms: { field: "categories.id", size: filtersSize },
              aggs: {
                orig_category_details: {
                  top_hits: {
                    size: 1,
                    _source: {
                      includes: [
                        "categories.id",
                        "categories.num_available_product",
                        "categories.parent_id",
                        "categories.most_viewed_product_thumbnail",
                        "categories.gender",
                        "categories.group_age",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        top_colors: {
          nested: { path: "colors" },
          aggs: {
            colors_by_color: {
              terms: { field: "colors.color.keyword", size: filtersSize },
            },
          },
        },
        top_sizes: {
          nested: { path: "available_size_as_json" },
          aggs: {
            available_size_as_json_by_size: {
              terms: {
                field: "available_size_as_json.size.keyword",
                size: filtersSize,
              },
            },
          },
        },
        related_categories: {
          nested: { path: "categories" },
          aggs: {
            categories_with_gender_age: {
              terms: { field: "categories.id", size: filtersSize },
              aggs: {
                category_details: {
                  top_hits: {
                    size: 1,
                    _source: {
                      includes: [
                        "categories.id",
                        "categories.num_available_product",
                        "categories.parent_id",
                        "categories.gender",
                        "categories.group_age",
                        "categories.most_viewed_product_thumbnail",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        related_custom_categories: {
          nested: { path: "custom_categories" },
          aggs: {
            filtered_categories: {
              filter: {
                term: { "custom_categories.language_code": languageCode },
              },
              aggs: {
                categories_by_id: {
                  terms: {
                    field: "custom_categories.category_id",
                    size: filtersSize,
                  },
                  aggs: {
                    category_details: {
                      top_hits: {
                        size: 1,
                        _source: {
                          includes: [
                            "custom_categories.id",
                            "custom_categories.category_id",
                            "custom_categories.name",
                            "custom_categories.slug",
                            "custom_categories.bio",
                            "custom_categories.description",
                            "custom_categories.flat_photo_path",
                            "custom_categories.png_photo_path",
                            "custom_categories.fill_photo_path",
                            "custom_categories.banner_photo_path",
                          ],
                        },
                      },
                    },
                    to_product: {
                      reverse_nested: {},
                      aggs: {
                        product_thumbnail: {
                          top_hits: {
                            size: 1,
                            _source: { includes: ["thumbnail"] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export async function getChildrenAndGrandchildren(
  client,
  index,
  parentCategoryIds,
  languageCode,
  country,
  filters,
) {
  const baseConditions = buildBaseConditions(filters, country);
  const { must, must_not } = baseConditions;
  const filterCondition = {
    bool: {
      must: must,
      must_not: must_not,
    },
  };
  // Step 1: get categories with position = 1 (children)
  const childrenRes = await client.search({
    index,
    size: 0,
    query: {
      bool: {
        must,
        must_not,
      },
    },
    aggs: {
      filtered_results: {
        filter: filterCondition,
        aggs: {
          top_categories: {
            nested: { path: "custom_categories" },
            aggs: {
              filtered_categories: {
                filter: {
                  bool: {
                    must: [
                      {
                        term: {
                          "custom_categories.language_code": languageCode,
                        },
                      },
                      // or "0" if it's a string
                    ],
                    must_not: [{ term: { "custom_categories.position": 0 } }],
                  },
                },
                aggs: {
                  categories_by_id: {
                    terms: {
                      field: "custom_categories.category_id",
                      size: 1000,
                    },
                    aggs: {
                      category_details: {
                        top_hits: {
                          size: 1,
                          _source: {
                            includes: [
                              "custom_categories.id",
                              "custom_categories.category_id",
                              "custom_categories.name",
                              "custom_categories.slug",
                              "custom_categories.bio",
                              "custom_categories.description",
                              "custom_categories.flat_photo_path",
                              "custom_categories.png_photo_path",
                              "custom_categories.fill_photo_path",
                              "custom_categories.banner_photo_path",
                            ],
                          },
                        },
                      },
                      to_product: {
                        reverse_nested: {},
                        aggs: {
                          product_thumbnail: {
                            top_hits: {
                              size: 1,
                              _source: { includes: ["thumbnail"] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          top_orig_categories: {
            nested: { path: "categories" },
            aggs: {
              orig_categories_by_id: {
                terms: { field: "categories.id", size: 1000 },
                aggs: {
                  orig_category_details: {
                    top_hits: {
                      size: 1,
                      _source: {
                        includes: [
                          "categories.id",
                          "categories.num_available_product",
                          "categories.parent_id",
                          "categories.most_viewed_product_thumbnail",
                          "categories.gender",
                          "categories.group_age",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return childrenRes.aggregations.filtered_results;
}

export function processBrandsAggregation(
  buckets: any[],
  filtersOffset: number,
): FilterResult[] {
  const brandsFilter: FilterResult[] = [];

  buckets.forEach((bucket) => {
    const brandHit = bucket.brand_details?.hits?.hits?.[0]?._source;

    if (brandHit) {
      brandsFilter.push({
        id: bucket.key,
        name: brandHit.name || "",
        slug: brandHit.slug || "",
        icon: brandHit.icon || "",
      });
    } else {
      brandsFilter.push({
        id: bucket.key,
        doc_count: bucket.doc_count,
      });
    }
  });

  return paginateFilters(brandsFilter, filtersOffset);
}

/**
 * Process boutiques aggregation
 */
export function processBoutiquesAggregation(
  buckets: any[],
  filtersOffset: number,
): FilterResult[] {
  const boutiquesFilter: FilterResult[] = [];

  buckets.forEach((bucket) => {
    const hit = bucket.boutique_details?.hits?.hits?.[0]?._source;

    if (hit) {
      // Filter first non-deleted banner
      let banner = null;
      if (hit.banners && Array.isArray(hit.banners)) {
        for (const b of hit.banners) {
          if (!b.deleted_at) {
            banner = { ...b };
            delete banner.deleted_at;
            break;
          }
        }
      }

      boutiquesFilter.push({
        id: bucket.key,
        name: hit.name || "",
        slug: hit.slug || "",
        banner: banner,
      });
    } else {
      boutiquesFilter.push({
        id: bucket.key,
        doc_count: bucket.doc_count,
      });
    }
  });

  return paginateFilters(boutiquesFilter, filtersOffset);
}

/**
 * Process categories aggregation
 */
export interface CategoriesAggregationResult {
  categories: CategoryFilter[];
  genderAgePairs: Record<string, { gender: number; group_age: number }>;
}

export function processCategoriesAggregation(
  transBuckets: any[],
  origBuckets: any[],
  filtersOffset: number,
): CategoriesAggregationResult {
  // Create original categories map
  const origMap: Record<string | number, any> = {};
  const genderAgePairs: Record<string, { gender: number; group_age: number }> =
    {};

  origBuckets.forEach((bucket) => {
    const hit = bucket.orig_category_details?.hits?.hits?.[0]?._source || {};
    if (hit.id) {
      origMap[hit.id] = {
        num_available_product: hit.num_available_product || 0,
        parent_id: hit.parent_id || null,
        most_viewed_product_thumbnail: hit?.most_viewed_product_thumbnail,
        gender: hit.gender ?? null,
        group_age: hit.group_age ?? null,
      };

      if (hit.gender != null && hit.group_age != null) {
        const pairKey = `${hit.gender}_${hit.group_age}`;
        genderAgePairs[pairKey] = {
          gender: hit.gender,
          group_age: hit.group_age,
        };
      }
    }
  });

  const categoriesFilter: CategoryFilter[] = [];

  transBuckets.forEach((bucket) => {
    const src = bucket.category_details?.hits?.hits?.[0]?._source || {};
    const thumbHit =
      bucket.to_product?.product_thumbnail?.hits?.hits?.[0]?._source || {};
    const thumbnail = thumbHit.thumbnail || null;

    const catId = bucket.key;
    const orig = origMap[catId] || {
      num_available_product: 0,
      parent_id: null,
    };

    categoriesFilter.push({
      id: src.id || catId,
      category_id: src.category_id || catId,
      name: src.name || "",
      slug: src.slug || "",
      bio: src.bio || "",
      description: src.description || "",
      flat_photo_path: src.flat_photo_path || "",
      png_photo_path: src.png_photo_path || "",
      fill_photo_path: src.fill_photo_path || "",
      banner_photo_path: src.banner_photo_path || "",
      num_available_product: orig.num_available_product,
      parent_id: orig.parent_id,
      most_viewed_product_thumbnail:
        orig.most_viewed_product_thumbnail ?? thumbnail,
      childes: [],
    });
  });

  // Index categories by category_id
  const indexed: Record<string | number, CategoryFilter> = {};
  categoriesFilter.forEach((cat) => {
    indexed[cat.category_id!] = cat;
  });

  // Link children to parents
  Object.values(indexed).forEach((cat) => {
    if (cat.parent_id && indexed[cat.parent_id]) {
      indexed[cat.parent_id].childes.push(cat);
    }
  });

  // Collect tree: only roots (parent_id = 0 or null)
  const categoriesTree = Object.values(indexed).filter(
    (cat) => !cat.parent_id || cat.parent_id === 0,
  );

  return {
    categories: paginateFilters(categoriesTree, filtersOffset),
    genderAgePairs,
  };
}

export function processRelatedCategories(
  aggregations: any,
  genderAgePairs: Record<string, { gender: number; group_age: number }>,
  filtersOffset: number,
): CategoryFilter[] {
  if (Object.keys(genderAgePairs).length === 0) return [];

  const relatedOrigBuckets =
    aggregations.related_categories?.categories_with_gender_age?.buckets || [];

  const relatedOrigMap: Record<string | number, any> = {};
  for (const bucket of relatedOrigBuckets) {
    const hit = bucket.category_details?.hits?.hits?.[0]?._source || {};
    const catId = hit.id ?? null;
    if (catId) {
      relatedOrigMap[catId] = {
        num_available_product: hit.num_available_product || 0,
        parent_id: hit.parent_id || null,
        gender: hit.gender ?? null,
        group_age: hit.group_age ?? null,
        most_viewed_product_thumbnail:
          hit.most_viewed_product_thumbnail ?? null,
      };
    }
  }

  const relatedCustomBuckets =
    aggregations.related_custom_categories?.filtered_categories
      ?.categories_by_id?.buckets || [];

  const relatedCategoriesFilter: CategoryFilter[] = [];

  for (const bucket of relatedCustomBuckets) {
    const customCat = bucket.category_details?.hits?.hits?.[0]?._source || {};
    const catId = bucket.key;

    if (!relatedOrigMap[catId]) continue;

    const relatedOrig = relatedOrigMap[catId];
    const relatedGender = relatedOrig.gender;
    const relatedGroupAge = relatedOrig.group_age;

    if (relatedGender != null && relatedGroupAge != null) {
      const pairKey = `${relatedGender}_${relatedGroupAge}`;

      if (genderAgePairs[pairKey]) {
        const thumbHit =
          bucket.to_product?.product_thumbnail?.hits?.hits?.[0]?._source || {};
        const thumbnail = thumbHit.thumbnail ?? null;

        relatedCategoriesFilter.push({
          id: customCat.id || catId,
          category_id: customCat.category_id || catId,
          name: customCat.name || "",
          slug: customCat.slug || "",
          bio: customCat.bio || "",
          description: customCat.description || "",
          flat_photo_path: customCat.flat_photo_path || "",
          png_photo_path: customCat.png_photo_path || "",
          fill_photo_path: customCat.fill_photo_path || "",
          banner_photo_path: customCat.banner_photo_path || "",
          num_available_product: relatedOrig.num_available_product,
          parent_id: relatedOrig.parent_id,
          most_viewed_product_thumbnail:
            relatedOrig.most_viewed_product_thumbnail ?? thumbnail,
          gender: relatedGender,
          group_age: relatedGroupAge,
          childes: [],
        });
      }
    }
  }

  // Build category hierarchy for related categories
  const indexedRelated: Record<string | number, CategoryFilter> = {};
  for (const cat of relatedCategoriesFilter) {
    indexedRelated[cat.category_id!] = cat;
  }

  for (const cat of Object.values(indexedRelated)) {
    if (cat.parent_id && indexedRelated[cat.parent_id]) {
      indexedRelated[cat.parent_id].childes.push(cat);
    }
  }

  const relatedTree = Object.values(indexedRelated).filter(
    (cat) => !cat.parent_id,
  );

  return paginateFilters(relatedTree, filtersOffset);
}

export function paginateFilters<T>(
  filters: T[],
  filtersSize: number,
  perPage: number = 10,
): T[] {
  const offset = Math.max(0, (filtersSize - 1) * perPage);
  return filters.slice(offset, offset + perPage);
}
export function sortSyncColorImagesByFilteredColor(
  products: CustomProduct[],
  filters: SearchFilters,
): CustomProduct[] | undefined {
  if (!filters.colors || filters.colors.length === 0) {
    return products;
  }

  // Convert filter colors to lowercase once for efficiency
  const filteredColorCodes = filters.colors.map((c) => c.toLowerCase());

  const productsArr = products?.map((product) => {
    if (!product.colors || !product.sync_color_images) {
      return product;
    }

    // Find all color names that match ANY of the filtered color codes
    const matchingColorNames = product.colors
      .filter(
        (c) => c.color && filteredColorCodes.includes(c.color.toLowerCase()),
      )
      .map((c) => c.name);

    if (matchingColorNames.length === 0) {
      return product;
    }

    let arr = Array.isArray(product.sync_color_images)
      ? [...product.sync_color_images] // Clone to avoid mutating original state
      : JSON.parse(product.sync_color_images || "[]");

    // Sort: If the image's color_name is in our "matching" list, move it to the front
    arr.sort((a: any, b: any) => {
      const aMatch = matchingColorNames.includes(a.color_name);
      const bMatch = matchingColorNames.includes(b.color_name);

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    return { ...product, sync_color_images: arr };
  });

  return productsArr;
}

/**
 * Sort colors by filtered color
 */
export function sortColorsByFilteredColor(
  products: CustomProduct[],
  filters: SearchFilters,
): void {
  if (!filters.colors || filters.colors.length === 0) {
    return;
  }

  const filteredColorCode = filters.colors[0];

  products?.forEach((product) => {
    if (!product.colors || !Array.isArray(product.colors)) {
      return;
    }

    product.colors.sort((a: any, b: any) => {
      const codeA = (a.color || "").toLowerCase();
      const codeB = (b.color || "").toLowerCase();
      const target = filteredColorCode?.toLowerCase();

      if (codeA === target && codeB !== target) return -1;
      if (codeB === target && codeA !== target) return 1;
      return 0;
    });
  });
}

export const GroupAgeEnum = {
  0: { label: "All Ages", shortLabel: "All Ages", ageRange: "All" },
  1: { label: "Infant (0-2 years)", shortLabel: "Infant", ageRange: "0-2" },
  2: { label: "Toddler (3-5 years)", shortLabel: "Toddler", ageRange: "3-5" },
  3: { label: "Child (6-12 years)", shortLabel: "Child", ageRange: "6-12" },
  4: { label: "Teen (13-17 years)", shortLabel: "Teen", ageRange: "13-17" },
  5: {
    label: "Young Adult (18-25 years)",
    shortLabel: "Young Adult",
    ageRange: "18-25",
  },
  6: { label: "Adult (26-40 years)", shortLabel: "Adult", ageRange: "26-40" },
  7: {
    label: "Middle Age (41-60 years)",
    shortLabel: "Middle Age",
    ageRange: "41-60",
  },
  8: { label: "Senior (61+ years)", shortLabel: "Senior", ageRange: "61+" },
  9: { label: "+3 years", shortLabel: "+3", ageRange: "+3" },
  10: { label: "-3 years", shortLabel: "-3", ageRange: "-3" },
  11: { label: "+5 years", shortLabel: "+5", ageRange: "+5" },
  12: { label: "-5 years", shortLabel: "-5", ageRange: "-5" },
  13: { label: "+18 years", shortLabel: "+18", ageRange: "+18" },
};

export const GenderEnum = {
  1: { label: "Male", shortLabel: "Male" },
  2: { label: "Female", shortLabel: "Female" },
  3: { label: "Other", shortLabel: "Other" },
  4: { label: "All Genders (Unisex)", shortLabel: "All" },
};
