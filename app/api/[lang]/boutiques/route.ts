import { GetBoutiqueApi } from "models/Api";
import { cookies } from "next/headers";

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

  let boutiques_response: GetBoutiqueApi = await fetchWithRetry(
    process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + BOUTIQUE_URL,
    {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
        tags: [""],
      },

      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Cache-Control": "no-cache",
        lang:
          (language.length && language) ??
          cookies().get("language")?.value ??
          request.cookies.get("language")?.value,
        country:
          (country.length && country) ??
          cookies().get("country")?.value ??
          request.cookies.get("country")?.value,
      }),
    },
    "Next Boutique Request"
  );
  return NextResponse.json(boutiques_response, {
    headers: {
      "Cache-Control": `public, s-maxage=${process.env.NEXT_PUBLIC_REVALIDATE}`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
