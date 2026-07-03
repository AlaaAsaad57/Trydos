import "styles/listing.css";
import "styles/globals.css";

import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";
import ProductCard from "components/products/ProductCard";
import SortableGrid from "components/Server/SortableGrid";
import NextLink from "components/global/NextLink";
import PageLoaderReset from "components/Listing/PageLoaderReset";
import { BagNoResults } from "components/Listing/illustrations/ListingBagIllustration";
import { translateFunction } from "utils/server";

// Whether a "Clear filters" affordance makes sense for the current empty result.
// A lone boutique does NOT count as an applied filter (clearing would keep the
// boutique and change nothing) — only real filter dimensions do. Returns the
// href to clear to (single boutique preserved), or null to hide the CTA.
function getClearFiltersHref({
  parsedFilters,
  lang,
  isFeatured,
  isFlashDeals,
}: {
  parsedFilters: any;
  lang: string;
  isFeatured: boolean;
  isFlashDeals: boolean;
}): string | null {
  const dimensionKeys = [
    "categories",
    "related_categories",
    "brands",
    "colors",
    "sizes",
    "prices",
    "tags_names",
  ];
  const hasDimension = dimensionKeys.some((key) => {
    const value = parsedFilters?.[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
  const hasSearch = Boolean(parsedFilters?.search_text);
  const boutiques: string[] = Array.isArray(parsedFilters?.boutiques)
    ? parsedFilters.boutiques
    : [];
  const hasMultiBoutique = boutiques.length > 1;

  if (!hasDimension && !hasSearch && !hasMultiBoutique) return null;

  const base = isFeatured
    ? `/${lang}/featured`
    : isFlashDeals
      ? `/${lang}/flashDeals`
      : `/${lang}/filters`;
  const singleBoutique = boutiques.length === 1 ? boutiques[0] : null;
  return singleBoutique ? `${base}/boutiques/${singleBoutique}` : base;
}

function ProductListServer({
  params,
  parsedFilters,
  products,
  currency,
  offset,
  pit_id = null,
  isFeatured = false,
  isFlashDeals = false,
  boutique,
  target,
  title,
  recomended_offset = null,
  sort = undefined,
}) {
  let [country, language] = params.lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const translate = (key: string) => translateFunction(key, language);

  if (!products || products.length === 0) {
    const clearHref = getClearFiltersHref({
      parsedFilters,
      lang: params.lang,
      isFeatured,
      isFlashDeals,
    });
    return (
      <div
        className="listing-empty mt-2 flex min-h-[48vh] w-full flex-col items-center justify-center bg-[#f4f4f4] px-6 py-16 text-center"
        data-cy="NoProductsFound"
      >
        <PageLoaderReset />
        <BagNoResults />
        <h2 className="f-16 medium color-dark-gray mt-6">
          {translate("No products found")}
        </h2>
        <p className="f-14 mt-1 text-[#707070]">
          {translate("Try changing or clearing your filters.")}
        </p>
        {clearHref ? (
          <NextLink
            href={clearHref}
            data-cy="ClearFiltersCta"
            data={{ is_filter: true }}
            className="f-14 medium mt-5 inline-flex items-center rounded-full bg-[#f85555] px-6 py-2.5 text-white"
          >
            {translate("Clear filters")}
          </NextLink>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse flex" : "flex flex-row"
        } listing-container mt-2  bg-[#f4f4f4] gap-x-[10px] gap-y-[18px] justify-center  min-w-full min-h-[48vh] relative  pb-[390px] max-w-[1310px] flex-wrap`}
      >
        <SortableGrid
          serverSort={sort ?? ""}
          currency={currency}
          boutiqueName={boutique?.name}
          parsedFilters={{
            ...parsedFilters,
            featured: isFeatured,
            flashdeal: isFlashDeals,
          }}
          isFeatured={isFeatured}
          isFlashDeals={isFlashDeals}
          sizesFilters={
            parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
          }
        >
          {products.map((product, key) => (
            <ProductCard
              key={product.slug}
              product={product}
              currency={currency}
              country={country}
              language={language}
              sliders={true}
              priority={key < 4}
              sizesFilters={
                parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
              }
            />
          ))}
          <ProductsInfiniteScroll
            recomended_offset={recomended_offset}
            pit_id={pit_id}
            boutiqueName={boutique?.name}
            analyticsData={products?.map((s) => ({
              item_id: s?.product_id,
              item_name: s?.name,
              category: s?.category?.name,
              brand: s.brand?.name,
              category_id: s?.category?.id,
              brand_id: s?.brand?.id,
            }))}
            parsedFilters={{
              ...parsedFilters,
              featured: isFeatured,
              flashdeal: isFlashDeals,
            }}
            currency={currency}
            offset={offset}
            isFeatured={isFeatured}
            isFlashDeals={isFlashDeals}
            sort={sort}
            sizes_filters={
              parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null
            }
          />
        </SortableGrid>
      </div>
    </>
  );
}

export default ProductListServer;
