import "styles/productDetails.css";
import "styles/product-body.css";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  GetGlobalProduct,
  GetProductGeneralData,
  GetProductPriceQtyDetails,
  GetSocialInfoForProduct,
} from "serverRequests/product";
import { getCurrency, GetStarttingSetting } from "serverRequests";
import ProductStructuredData from "serverRequests/meta/StructuredData/ProductStructuredData";
import { getColorImageGroups } from "components/Server/product/colorImageGroups";
import AppProduct from "components/DemoApp1/screens/AppProduct";
import { PRODUCT_DICTIONARY_KEYS } from "components/DemoApp/demoKeys";
import type { DemoDictionary } from "components/DemoApp/demoKeys";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import {
  GetFQACommentsForProduct,
  GetRatingCommentsForProduct,
} from "utils/pagesDataRequests/ProductPageData";
import {
  countryNameFromIso,
  formatTime,
  GetImageUrl,
  madeInText,
  ShowDayStr,
  translateFunction,
} from "utils/server";
import { LogServerError } from "utils/serverErrorReporter";
import { VALID_ISO } from "utils/tinyUtils";
import ProductPageSkeleton from "./ProductPageSkeleton";
import { toInfoRows, toProductView } from "./productView";

interface ProductPageContentProps {
  params: { lang: string; productId: string };
  searchParams: { color?: string; size?: string };
}

/**
 * An optional block. A search error here must not reach the page's error
 * boundary and take the whole product with it: the block is left out.
 */
async function optional<T>(
  read: Promise<T>,
  id: unknown,
  block: string,
): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    LogServerError({
      id,
      error,
      scenario: `Error In ProductPageContent: the ${block} block was left out`,
    });
    return null;
  }
}

/**
 * Every product's page and its `@modal` copy (Stage 7c): it reads the product
 * and the design draws it (`AppProduct`, XD `Home Page – 49`).
 *
 * The parts with no place in the design are not read and not drawn. Their code
 * stays (A-33): stories, related products, labels, the size chips, try-on,
 * compare and the old footer with the price and "add to cart" (S7c-1).
 */
export default function ProductPageContent({
  params,
  searchParams,
}: ProductPageContentProps) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductBody params={params} searchParams={searchParams || {}} />
    </Suspense>
  );
}

async function ProductBody({ params, searchParams }: ProductPageContentProps) {
  // The delivery date below reads the clock: this part renders per request.
  await connection();
  const [country, language] = params.lang.split("-");
  const slug = params.productId;
  const { color, size } = searchParams;

  const [global, qty, setting, currency, user] = await Promise.all([
    GetGlobalProduct({ slug, language, country }) as Promise<any>,
    GetProductPriceQtyDetails({ slug, language, country }) as Promise<any>,
    GetStarttingSetting({ language, country }) as Promise<any>,
    getCurrency(country, language),
    getCookieServer<{ id: string }>(COOKIE_NAMES.USER_DATA),
  ]);
  const id = global?.id;

  const [social, general, reviews, questions] = await Promise.all([
    GetSocialInfoForProduct({ productId: id, userId: user?.id }) as Promise<any>,
    GetProductGeneralData({ id }) as Promise<any>,
    optional(
      GetRatingCommentsForProduct({
        product_id: id,
        user_id: user?.id,
        language,
        pageSize: 5,
      }),
      id,
      "reviews",
    ),
    optional(
      GetFQACommentsForProduct({
        product_id: id,
        user_id: user?.id,
        language,
        pageSize: 5,
      }),
      id,
      "questions",
    ),
  ]);

  // The old banner's rule: the product's days plus the country's shipping days.
  const shippingDays = Number(global?.shipping_days) || 0;
  const days = Number(setting?.shipping_duration_days || 0) + shippingDays;
  const arrives = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const originIso = global?.origin_country_iso?.toUpperCase();
  const dictionary: DemoDictionary = Object.fromEntries(
    PRODUCT_DICTIONARY_KEYS.map((key) => [
      key,
      translateFunction(key, language),
    ]),
  );
  const price = qty?.offer_price ?? qty?.price;

  return (
    <>
      <ProductStructuredData
        color={color}
        currency={currency}
        local={params.lang}
        product={{ ...global, ...qty }}
        rating={general?.final_rating}
        reviewCount={general?.total_buyers}
        size={size}
      />
      <AppProduct
        key={id}
        lang={params.lang}
        view={toProductView({
          global,
          qty,
          general,
          reviews: reviews?.buyers_comments ?? [],
          questions: questions?.fqa_comments ?? [],
          language,
        })}
        reviewsOffset={reviews?.searchAfter}
        questionsOffset={questions?.searchAfter}
        info={toInfoRows(qty)}
        origin={
          originIso && VALID_ISO.includes(originIso)
            ? { iso: originIso, text: madeInText(originIso, language) }
            : null
        }
        days={{
          day: ShowDayStr(arrives.getDay(), language),
          date: formatTime(arrives.toISOString(), language),
          days,
          country: countryNameFromIso(country, language),
        }}
        dictionary={dictionary}
        videos={global?.videos ?? []}
        analytics={{
          item_id: id,
          item_name: global?.name,
          brand: global?.brand?.name,
          brand_id: global?.brand?.id,
          category: global?.categories?.[0]?.name,
          category_id: global?.categories?.[0]?.id,
          price,
          interaction_type: "view",
          likes_count: social?.total_likes,
          boutique_id: global?.boutique_id,
        }}
        light={{
          id,
          image: GetImageUrl(
            global?.sync_color_images?.[0]?.images?.[0] ?? global?.images?.[0],
          ),
          slug: global?.slug,
          name: global?.name,
          brand: global?.brand,
          category: global?.categories?.[0],
          price: qty?.price,
          offer_price: qty?.offer_price,
        }}
        imagesByColor={getColorImageGroups(global)}
        social={{
          likes: social?.total_likes || 0,
          liked: Boolean(social?.is_liked),
        }}
        serverColor={color}
        serverSize={size}
        ownerId={qty?.owner_id}
        ownerType={qty?.owner_type}
      />
    </>
  );
}
