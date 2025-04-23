// app/api/products/route.ts

import { NextRequest } from "next/server";
import { configureSearchParams } from "utils/tinyUtils";

export async function GET(
  req: NextRequest,
  { params }: { params: { lang: string } }
) {
  const { searchParams } = req.nextUrl;
  const [country, lang] = params.lang.split("-");

  const noProducts = searchParams.get("noProducts") ?? "false";
  const noFilters = searchParams.get("noFilters") ?? "false";

  const offset = searchParams.get("offset") ?? "false";
  const boutiqueId = searchParams.get("boutiqueId") ?? "listing";
  const searchParamsVar = JSON.parse(searchParams.get("searchParams")) ?? {};

  let configuredparams = configureSearchParams({
    searchParams: searchParamsVar,
    noProducts,
    noFilters,
    lang,
    offset,
    boutiqueId,
  });
  let configured_url = `/api/products/searchInCatalog?${configuredparams.toString()}`;
  let response = await fetch(
    process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + configured_url,
    {
      method: "GET",
      headers: new Headers({
        lang: lang,
        country: country,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LISTING),
        tags: ["search-Api"],
      },
    }
  );
  if (response.status !== 200) {
    const errorBody = await response.json();
    throw new Error(
      `Listing Products and Filters Error: ${response.status} ${JSON.stringify(
        errorBody.message
      )}`
    );
  }
  let data = await response.json();

  return Response.json(
    {
      ...data,
      // url: decodeURIComponent(configured_url),
      // req_inputs: {
      //   boutiqueId,
      //   searchParams,
      //   offset,
      // },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${process.env.NEXT_PUBLIC_REVALIDATE_LISTING}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// Mock function for demo
