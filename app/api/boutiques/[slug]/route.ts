// app/api/products/[slug]/route.ts

import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = req.nextUrl;
  const lang = searchParams.get("lang") ?? "en";
  const country = searchParams.get("country") ?? "tr";

  // You can use the slug to fetch or filter data
  const boutique = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/boutique/simpleDetails/${slug}?lang=${lang}&country=${country}`,
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
        tags: ["boutique-Api", `${slug}`],
      },
    }
  );

  if (!boutique) {
    return Response.json({ error: "Boutique not found" }, { status: 404 });
  }
  let data = await boutique.json();
  return Response.json(
    { ...data },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${process.env.NEXT_PUBLIC_REVALIDATE_LISTING}`,
      },
    }
  );
}

// 🔧 Mocked helper function (replace with DB call or external API)
