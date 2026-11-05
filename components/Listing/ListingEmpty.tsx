import NextLink from "components/global/NextLink";
import PageLoaderReset from "components/Listing/PageLoaderReset";
import { BagNoResults } from "components/Listing/illustrations/ListingBagIllustration";
import { translateFunction } from "utils/server";

/**
 * Whether a "Clear filters" link makes sense for an empty result. A lone
 * boutique does not count as a filter (clearing would keep the boutique and
 * change nothing); only real filter parts do. Returns where clearing goes
 * (a single boutique is kept), or null for no link.
 */
export function getClearFiltersHref({
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

/**
 * The old "no products" block (A-4, S7b-10): the bag drawing, "No products
 * found", and a "Clear filters" link when there is something to clear. The
 * store page shows it in place of its grid. Moved here from the old grid
 * (`ProductListServer`).
 */
export default function ListingEmpty({
  parsedFilters,
  lang,
  isFeatured,
  isFlashDeals,
}: {
  parsedFilters: any;
  lang: string;
  isFeatured: boolean;
  isFlashDeals: boolean;
}) {
  const language = lang.split("-")[1];
  const translate = (key: string) => translateFunction(key, language);
  const clearHref = getClearFiltersHref({
    parsedFilters,
    lang,
    isFeatured,
    isFlashDeals,
  });
  return (
    <div
      className="listing-empty mt-2 flex min-h-[48vh] w-full flex-col items-center justify-center bg-[#f4f4f4] px-6 py-16 text-center"
      data-pw="NoProductsFound"
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
          data-pw="ClearFiltersCta"
          data={{ is_filter: true }}
          className="f-14 medium mt-5 inline-flex items-center rounded-full bg-[#f85555] px-6 py-2.5 text-white"
        >
          {translate("Clear filters")}
        </NextLink>
      ) : null}
    </div>
  );
}
