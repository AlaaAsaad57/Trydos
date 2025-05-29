// app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { configureSearchParams } from "utils/tinyUtils";
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
  { params }: { params: { lang: string } }
) {
  const { searchParams } = req.nextUrl;
  const [country, lang] = params.lang.split("-");
  const noProducts = searchParams.get("noProducts") ?? "false";
  const offset = searchParams.get("offset") ?? "false";
  const boutiqueId = searchParams.get("boutiqueId") ?? "listing";
  const searchParamsVar = JSON.parse(searchParams.get("searchParams")) ?? {};
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
  let configured_url = `/api/products/featured?${configuredparams.toString()}`;

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
  let { data } = await response.json();
  return NextResponse.json(
    {
      ...data,
      products: data.products.map((s) => ({
        name: s.name,
        slug: s.slug,
        details: s.details,
        colors: s.colors,
        images: s?.images.map((im) => ({ file_path: im.file_path })),
        sync_color_images: s?.sync_color_images.map((sync_im) => ({
          color_name: sync_im?.color_name,
          images: sync_im?.images.map((im) => ({
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
