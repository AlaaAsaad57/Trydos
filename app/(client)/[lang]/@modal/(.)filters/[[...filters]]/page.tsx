import { lang as langParam } from "next/root-params";
import FiltersPageContent from "components/Listing/FiltersPageContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InterceptedFiltersPage({ params, searchParams }) {
  const Params = await params;
  const lang = await langParam();
  const sp = (await searchParams) ?? {};
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // `intercepted`: this is the @modal slot, where a server redirect() cannot
  // navigate the browser — a missing boutique is sent away client-side instead.
  return (
    // @ts-ignore
    <FiltersPageContent
      params={Params}
      sort={sort}
      search={search}
      intercepted
    />
  );
}
