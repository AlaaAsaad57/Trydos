import FiltersPageContent from "components/Listing/FiltersPageContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InterceptedFiltersPage({ params, searchParams }) {
  const Params = await params;
  const sp = (await searchParams) ?? {};
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  // @ts-ignore
  return <FiltersPageContent params={Params} sort={sort} />;
}
