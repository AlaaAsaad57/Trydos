import { lang as langParam } from "next/root-params";
import { permanentRedirect } from "next/navigation";
import { LogServerError } from "utils/serverErrorReporter";
import { generateMetadataForListing } from "serverRequests/meta/listing";
import { buildSearchRedirectTarget } from "utils/listing/searchPathRedirect";
import FiltersPageContent from "components/Listing/FiltersPageContent";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({ params, searchParams }) {
  let Params = await params;
  const lang = await langParam();
  const sp = (await searchParams) ?? {};
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // Fetch your main product categories
  try {
    const metadata = await generateMetadataForListing({
      params,
      routeBase: "featured",
      searchText: search,
    });

    return metadata;
  } catch (error) {
    LogServerError(error, `/${lang}/featured`);
    return [];
  }
}

/**
 * The featured listing (Stage 7b, A-32): the store page design, with the featured
 * products (FiltersPageContent, kind "featured").
 */
export default async function Page({ params, searchParams }) {
  const Params = await params;
  const lang = await langParam();
  const sp = (await searchParams) ?? {};

  const legacy = buildSearchRedirectTarget(
    lang,
    "featured",
    Params.filters,
    sp,
  );
  if (legacy) permanentRedirect(legacy);

  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  return (
    <FiltersPageContent
      params={{ lang, filters: Params.filters }}
      sort={sort}
      search={search}
      kind="featured"
    />
  );
}
