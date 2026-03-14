import FiltersPageContent from "components/Listing/FiltersPageContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InterceptedFiltersPage({ params }) {
  const Params = await params;
  // @ts-ignore
  return <FiltersPageContent params={Params} />;
}
