import { NextRequest, NextResponse } from "next/server";
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}
export async function GET(
  req: NextRequest,
  { params }: { params: { lang: string } }
) {
  const [country, lang] = params.lang.split("-");
  let response = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/mobile/home/currency?lang=${lang}&country=${country}`,
    {
      method: "GET",
      headers: new Headers({
        lang: lang,
        country: country,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CURRENCY),
        tags: ["currency-Api"],
      },
    }
  );
  if (response.status !== 200) {
    const errorBody = await response.json();
    throw new Error(
      `Currency Error: ${response.status} ${JSON.stringify(errorBody.message)}`
    );
  }
  let data = await response.json();

  return NextResponse.json(
    {
      ...data,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // Cache on the edge for 1hr
      },
    }
  );
}

// Mock function for demo
