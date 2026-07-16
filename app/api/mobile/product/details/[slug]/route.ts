export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import {
  GetGlobalProduct,
  GetProductPriceQtyDetails,
} from "serverRequests/product";
import { getProductDataFromElastic } from "utils/pagesDataRequests/ProductPageData";
import { LogServerError } from "utils/serverErrorReporter";

// Apply CORS headers to any response
function withCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Surrogate-Control", "no-store");
  return res;
}

// Handle preflight (important for browsers)
export async function OPTIONS() {
  return withCORS(new NextResponse(null, { status: 204 }));
}

// ---------------------------------------------------------------------------
// Response reshaper: Go (globalDetails + qtyPriceDetails) → mobile /details shape
// ---------------------------------------------------------------------------

// Go returns image fields as bare URL strings; the mobile /product/details
// contract wraps every image as { file_path, original_width, original_height }.
function toImageObject(src: any) {
  if (!src) return null;
  if (typeof src === "object") {
    return src.file_path
      ? {
          file_path: src.file_path,
          original_width: src.original_width ?? "0",
          original_height: src.original_height ?? "0",
        }
      : null;
  }
  return { file_path: String(src), original_width: "0", original_height: "0" };
}

// Go ships `label_names` as a JSON string ("[]"); mobile expects a real array.
function toArraySafe(val: any) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Preformatted delivery label (e.g. "18 Jul") — mobile returns it ready to render.
// Month/day names come from Intl locale data, not app copy, so no translation key.
function formatDeliveryAt(shippingDays: any, language: string) {
  try {
    const date = new Date();
    date.setDate(date.getDate() + (Number(shippingDays) || 0));
    const locale =
      language === "ar" ? "ar-EG" : language === "tr" ? "tr-TR" : "en-GB"; // ku → en-GB (no reliable Intl data)
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return null;
  }
}

// Build the exact mobile `/mobile/product/details` `data` object from the merged
// Go payload. This is an allowlist — Go-only keys (variations, sizes,
// max_allowed_qty, luck_price, offer_type, descriptors, allow_return_in_days,
// views_count, origin_country_iso, brand.is_verified, the *_FromRedis/*_Time debug
// fields) and the elastic enrichment keys are intentionally dropped so nothing
// leaks that the mobile contract doesn't declare.
function toMobileProductShape(merged: any, elastic: any, language: string) {
  const images = (merged.images || []).map(toImageObject).filter(Boolean);
  const brand = merged.brand
    ? {
        id: merged.brand.id,
        slug: merged.brand.slug,
        name: merged.brand.name,
        is_verified: merged.brand.is_verified ?? null,
        icon: toImageObject(merged.brand.icon),
      }
    : null;

  const price = Number(merged.price);
  const offerPrice = Number(merged.offer_price);

  // Key order mirrors the Laravel /mobile/product/details payload for easy diffing.
  return {
    id: merged.id,
    name: merged.name,
    details: merged.details,
    description: merged.description ?? null,
    model: merged.model ?? null,
    features: null,
    slug: merged.slug,
    categories: merged.categories ?? null,
    brand,
    label_names: toArraySafe(merged.label_names),
    flash_deal_end_date: merged.flash_deal_end_date ?? null,
    colors: (merged.colors || []).map((c: any) => ({
      name: c.name,
      color: c.code ?? c.color ?? false,
      option: c.option,
    })),
    sync_color_images: (merged.sync_color_images || []).map((s: any) => ({
      color_name: s.color_name,
      color_option: s.color_option,
      color_code: s.color_code,
      images: (s.images || []).map(toImageObject).filter(Boolean),
      color_trend: s.color_trend ?? false,
    })),
    share_link: merged.share_link ?? null,
    thumbnail: toImageObject(merged.images?.[0]),
    images,
    videos: merged.videos ?? [],
    shipping_cost_multiply_with_quantity:
      merged.shipping_cost_multiply_with_quantity ?? false,
    shipping_cost: merged.shipping_cost ?? 0,
    shipping_days: merged.shipping_days ?? 0,
    tax: 0,
    unit_price: merged.unit_price,
    price: merged.price,
    is_luck: merged.is_luck ?? false,
    is_redeem: merged.is_luck ?? false,
    // Redeem price is strictly the luck price — never fall back to the base price.
    redeem_price: merged.luck_price ?? null,
    luck_price: merged.luck_price ?? null,
    offer_price: merged.offer_price,
    boutique_id: merged.boutique_id ?? null,
    rating: {
      overall_rating: Number(elastic?.total_rating) || 0,
      total_rating: elastic?.buyers_comment?.total ?? 0,
    },
    choice_options: merged.choice_options ?? [],
    has_discount:
      Number.isFinite(price) && Number.isFinite(offerPrice)
        ? offerPrice < price
        : false,
    has_tax: false,
    delivery_at: formatDeliveryAt(merged.shipping_days, language),
    reviews_count: elastic?.buyers_comment?.total ?? null,
    owner_type: merged.owner_type ?? null,
    owner_id: merged.owner_id ?? null,
    seller_id: merged.seller_id ?? null,
    seller: merged.seller ?? null,
    shop: merged.shop ?? null,
    is_fav_seller: false,
    reviews: [],
    flash_deal_max_allowed_quantity:
      merged.flash_deal_max_allowed_quantity ?? null,
    has_whole_sale: merged.has_whole_sale ?? false,
    whole_sale_link: merged.whole_sale_link ?? null,
    is_country_restricted: merged.is_country_restricted ?? false,
    is_active: merged.is_active ?? true,
    packed_after_ordering: merged.packed_after_ordering ?? 0,
    available_quantity: merged.available_quantity ?? 0,
    is_featured: merged.is_featured ?? false,
    count_of_pieces: merged.count_of_pieces ?? 1,
    origin_country: merged.origin_country_iso ,
  };
}

// GET handler
export async function GET(request: NextRequest, { params }) {
  let Params = await params;
  const country = request.headers.get("country")?.trim() || "sy";
  let language = request.headers.get("language")?.trim();
  const lang = request.headers.get("lang")?.trim();
  language = language ?? lang ?? "en";
  const noCache = request.nextUrl.searchParams.get("no_cache") === "true";
  let productDataVar;
  let GlobalData = GetGlobalProduct({
    slug: Params.slug,
    language: language,
    country: country,
  });
  let QtyPricesData = GetProductPriceQtyDetails({
    slug: Params.slug,
    language: language,
    country: country,
    noCache: noCache,
  });
  let [GlobalDataResponse, QtyPricesDataResponse] = await Promise.all([
    GlobalData,
    QtyPricesData,
  ]);
  try {
    productDataVar = {
      ...GlobalDataResponse,
      ...QtyPricesDataResponse,
    };

    const user_id = request.nextUrl.searchParams.get("user_id");
    let elasticData = await getProductDataFromElastic({
      productId: productDataVar.id,
      lang: language,
      slug: Params.slug,
      userId: user_id,
    });
    // Rearrange the merged Go payload into the Laravel /mobile/product/details
    // response shape the mobile app expects — most importantly the image fields,
    // which Go returns as bare URL strings but mobile expects as
    // { file_path, original_width, original_height } objects.
    const data = toMobileProductShape(productDataVar, elasticData, language);
    return withCORS(
      NextResponse.json(
        {
          data,
          isSuccessful: true,
          code: 200,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("Get Product Details with Cache api route", error);
    LogServerError(
      {
        error: error,
        type: "product details api route",
        url: request.url,
        headers: request.headers,
      },
      "/local/api/mobile/product/details/[slug]",
    );
    return withCORS(
      NextResponse.json(
        { isSuccessful: false, error, code: 500 },
        { status: 500 },
      ),
    );
  }
}
