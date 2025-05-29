import { GetBoutiqueApi } from "models/Api";
import { fetchWithRetry } from "utils/functions";
import { NextRequest, NextResponse } from "next/server";
export async function OPTIONS(req: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  return NextResponse.json({}, { status: 204, headers: corsHeaders });
}
export async function GET(
  request: NextRequest,
  { params }: { params: { lang: string } }
) {
  const { searchParams } = new URL(request.url);
  let str = searchParams.get("str") ?? "";
  let offset = searchParams.get("offset") ?? 0;
  let [country, language] = params.lang?.split("-");
  let BOUTIQUE_URL =
    "/api/home/boutiques" +
    (str?.length > 0
      ? `?category_slugs=["${str}"]&limit=10&offset=${offset}`
      : `?category_slugs=[]&limit=10&offset=${offset}`);

  let boutiques_response = await fetch(
    process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + BOUTIQUE_URL,
    {
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Cache-Control": "no-cache",
        lang: language ?? "en",
        country: country ?? "tr",
      }),
    }
  );
  let { data } = await boutiques_response.json();

  return NextResponse.json(
    {
      total: data.total,
      limit: data.limit,
      offset: data.offset,
      boutiques: data?.boutiques?.map((s) => ({
        name: s.name,
        icon: s.icon.file_path,
        slug: s.slug,
        description: s.description,
        banners: s?.banners?.map((banner) => ({
          file_path: banner?.file_path,
        })),
        mainCategoriesForProductIds: s?.mainCategoriesForProductIds?.map(
          (main) => ({
            icon: main.flat_photo_path.file_path,
            slug: main.slug,
          })
        ),
        childCategoriesForProductIds: s?.childCategoriesForProductIds?.map(
          (main) => ({
            photo: main.most_viewed_product_thumbnail.file_path,
            name: main.name,
            most_viewed_product_name: main.most_viewed_product_name,
            slug: main.slug,
          })
        ),
      })),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
