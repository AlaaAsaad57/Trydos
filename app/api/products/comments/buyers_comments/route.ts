import { NextRequest, NextResponse } from "next/server";
import { ReportError } from "utils/errorReported";
import { LogError } from "utils/functions";
import { GetRatingCommentsForProduct } from "utils/pagesDataRequests/ProductPageData";

export async function GET(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  const user_id = req.nextUrl.searchParams.get("user_id");
  const referer = req.headers.get("referer");
  const product_id = req.nextUrl.searchParams.get("product_id");
  const filter = req.nextUrl.searchParams.get("filter");
  let offset = req.nextUrl.searchParams.get("offset");
  if (offset) {
    offset = decodeURIComponent(offset);
  }
  try {
    if (!product_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    let data = await GetRatingCommentsForProduct({
      product_id: product_id,
      searchAfter: offset,
      pageSize: 10,
      user_id,
      filter,
    });

    return NextResponse.json(
      {
        data: {
          buyers_comments: data.buyers_comments,
          offset: data.searchAfter,
          total: data.total,
          searchAfter: data.searchAfter,
        },
        code: 200,
      },
      { status: 200, headers }
    );
  } catch (error: any) {
    ReportError(error, {
      source: "get rating comment for prooduct server api",
      product_id,
      page: referer,
      url: "/public_comment/comments/buers_comment",
      method: "get",
    });
    LogError({
      source: "get rating comment for prooduct server api",
      product_id,
      page: referer,
      url: "/public_comment/comments/buers_comment",
      method: "get",
    });
    return NextResponse.json(
      {
        message: `${error.message || error || "Unknown error"}`,
        data: null,
        code: 500,
      },
      { status: 500, headers }
    );
  }
}
