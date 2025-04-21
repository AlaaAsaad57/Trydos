import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const slug = searchParams.get("slug") ?? "";

  const data = {
    slug,
  };
  return Response.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600", // Cache on the edge for 1hr
    },
  });
}

// Mock function for demo
