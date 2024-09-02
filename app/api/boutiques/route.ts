import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let str = searchParams.get("slug");
  let offset = searchParams.get("offset");
  let lang = searchParams.get("lang");
  let [language, country] = lang?.split("-") ?? ["", ""];
  let BOUTIQUE_URL =
    "/web/home/boutiques" +
    (str?.length
      ? `?slug=${str}&limit=10&offset=${offset}`
      : `?limit=10&offset=${offset}`);

  let res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + BOUTIQUE_URL, {
    next: {
      revalidate: 36000,
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
  });
  let r = await res.json();
  return NextResponse.json(r);
}
