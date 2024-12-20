import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let str = searchParams.get("str");
  let offset = searchParams.get("offset");
  let lang = searchParams.get("lang");
  let [language, country] = lang?.split("-") ?? ["", ""];
  let BOUTIQUE_URL =
    "/api/home/boutiques" +
    (str?.length > 0
      ? `?category_slugs=["${str}"]&limit=10&offset=${offset}`
      : `?category_slugs=[]&limit=10&offset=${offset}`);

  let res = await fetch(
    process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + BOUTIQUE_URL,
    {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
      },

      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang:
          (language.length && language) ??
          cookies().get("language")?.value ??
          request.cookies.get("language")?.value,
        country:
          (country.length && country) ??
          cookies().get("country")?.value ??
          request.cookies.get("country")?.value,
      }),
    }
  );
  let r = await res.json();
  return NextResponse.json(r);
}
