import { NextRequest, NextResponse } from "next/server";
export async function OPTIONS(req: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  return NextResponse.json({}, { status: 204, headers: corsHeaders });
}
export async function GET(req: NextRequest, { params }) {
  const [country, language] = params.lang?.split("-");

  let newParams = new URLSearchParams();
  newParams.set("lang", language);
  let response = await fetch(
    process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
      `/api/home/mainCategories?${newParams.toString()}`,
    {
      method: "GET",
      headers: new Headers({
        lang: language,
        country: country,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE),
        tags: ["main-categories-Api", "home"],
      },
    }
  );
  if (response.status !== 200) {
    const errorBody = await response.json();
    throw new Error(
      `Main Categories Error: ${response.status} ${JSON.stringify(
        errorBody.message
      )}`
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
        "Cache-Control": `public, s-maxage=${process.env.NEXT_PUBLIC_REVALIDATE_LISTING}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// Mock function for demo
