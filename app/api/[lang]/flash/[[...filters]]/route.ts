// app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  configureSearchParams,
  parseFiltersFromParams,
  filtersToSearchParams,
} from "utils/tinyUtils";
export async function OPTIONS(req: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  return NextResponse.json({}, { status: 204, headers: corsHeaders });
}
export async function GET(
  req: NextRequest,
  { params }: { params: { lang: string; filters?: string[] } }
) {
  const { searchParams } = req.nextUrl;
  const [country, lang] = params.lang.split("-");
  const noProducts = searchParams.get("noProducts") ?? "false";
  const offset = searchParams.get("offset") ?? "false";
  const boutiqueId = searchParams.get("boutiqueId") ?? "listing";

  // Parse filters from URL path parameters
  const parsedFilters = parseFiltersFromParams(params.filters || []);

  // Convert parsed filters to the format expected by configureSearchParams
  const searchParamsVar = filtersToSearchParams(parsedFilters);

  const filters_offset = searchParams.get("filters_offset");
  const noFilters = "false";

  let configuredparams = configureSearchParams({
    searchParams: searchParamsVar,
    noProducts,
    noFilters,
    lang,
    offset,
    boutiqueId,
    filters_offset,
  });
  configuredparams.set("flash-deal", "true");
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
  console.log(data?.data?.products[0]);
  return NextResponse.json(
    {
      data: {
        offset: data.data.offset,
        limit: data.data.limit,
        total_size: data.data.total_size,
        // categories: data.data?.categories?.map((c) => ({
        //   name: c.name,
        //   icon: c?.flat_photo_path?.file_path,
        //   most_viewed_product_thumbnail:
        //     c?.most_viewed_product_thumbnail?.file_path,
        //   slug: c.slug,
        //   childes: c.childes.map((child) => ({
        //     name: child.name,
        //     slug: child.slug,
        //     most_viewed_product_thumbnail:
        //       child?.most_viewed_product_thumbnail?.file_path,
        //     childes: child?.childes?.map((c_child) => ({
        //       name: c_child.name,
        //       slug: c_child.slug,
        //       most_viewed_product_thumbnail:
        //         c_child?.most_viewed_product_thumbnail?.file_path,
        //     })),
        //   })),
        // })),
        // brands: data.data?.brands?.map((s) => ({
        //   name: s.name,
        //   icon: s.icon?.file_path,
        //   slug: s.slug,
        // })),
        // prices: data.data?.prices,
        // colors: data.data?.colors,
        // attributes: data.data?.attributes,
        // boutiques: data.data?.boutiques,

        products: data?.data?.products?.map((s) => ({
          name: s.name,
          slug: s.slug,
          details: s.details,
          end_date: s.end_date,
          colors: s.colors,
          images: s?.images?.map((im) => ({ file_path: im.file_path })),
          sync_color_images: s?.sync_color_images?.map((sync_im) => ({
            color_name: sync_im?.color_name,
            images: sync_im?.images?.map((im) => ({
              file_path: im.file_path,
            })),
          })),
          price: s?.price,
          offer_price: s?.offer_price,
          category: {
            name: s?.category?.name,
            icon: s?.category.flat_photo_path?.file_path,
          },
        })),
      },

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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// Mock function for demo
