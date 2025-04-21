// app/api/products/route.ts

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const noProducts = searchParams.get("noProducts") ?? "false";
  const noFilters = searchParams.get("noFilters") ?? "false";
  const country = searchParams.get("country") ?? "tr";
  const lang = searchParams.get("lang") ?? "en";
  const offset = searchParams.get("offset") ?? "false";
  const boutiqueId = searchParams.get("boutiqueId") ?? "listing";
  const searchParamsVar = JSON.parse(searchParams.get("searchParams")) ?? {};

  let params = configureSearchParams({
    searchParams: searchParamsVar,
    noProducts,
    noFilters,
    lang,
    offset,
    boutiqueId,
  });
  let configured_url = `/api/products/searchInCatalog?${params.toString()}`;
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
        "Cache-Control": `public, s-maxage=${process.env.NEXT_PUBLIC_REVALIDATE_LISTING}`, // Cache on the edge for 1hr
      },
    }
  );
}

// Mock function for demo

const configureSearchParams = ({
  searchParams,
  noFilters,
  noProducts,
  lang,
  offset,
  boutiqueId,
}): URLSearchParams => {
  let params = new URLSearchParams();
  params.set("lang", lang);
  params.set("limit", "8");
  if (offset && offset !== "false") {
    params.set("offset", `[${offset}]`);
  }
  if (noProducts && noProducts !== "false") {
    params.set("with_products", "false");
  }
  if (noFilters && noFilters !== "false") {
    params.set("with_filters", "false");
  }
  if (searchParams.search_text) {
    params.set("search_text", searchParams.search_text);
  }
  if (searchParams.categories) {
    params.set("category_slugs", decodeURIComponent(searchParams.categories));
  }
  if (searchParams.prices) {
    params.set("price", decodeURIComponent(searchParams.prices));
  }
  if (searchParams.sizes) {
    params.set(
      "attributes",
      JSON.stringify([
        {
          id: 1,
          options: JSON.parse(decodeURIComponent(searchParams.sizes)),
          name: "Size",
        },
      ])
    );
  }
  if (searchParams.colors) {
    params.set("colors", decodeURIComponent(searchParams.colors));
  }
  if (searchParams.brands) {
    params.set("brand_slugs", decodeURI(searchParams.brands));
  }
  if (searchParams.boutiques && searchParams.boutiques !== "null") {
    params.set("boutique_slugs", decodeURI(searchParams.boutiques));
  }
  if (boutiqueId && boutiqueId !== "listing" && boutiqueId !== "null") {
    params.set("boutique_slugs", `["${boutiqueId}"]`);
  }

  // console.log(
  //   `params: ${decodeURIComponent(params.toString())} ${JSON.stringify(
  //     searchParams
  //   )}`
  // );
  return params;
};
