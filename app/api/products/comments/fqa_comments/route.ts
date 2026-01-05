import { NextRequest, NextResponse } from "next/server";

import { ReportError } from "utils/errorReported";
import { LogError } from "utils/functions";
import { GetFQACommentsForProduct } from "utils/pagesDataRequests/ProductPageData";

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
    const user_id = req.nextUrl.searchParams.get("user_id");
    let data = await GetFQACommentsForProduct({
      product_id: product_id,
      searchAfter: offset,
      pageSize: 10,
      filter,
      user_id: user_id,
      language: req.headers.get("language") || "en",
    });

    return NextResponse.json(
      {
        data: {
          fqa_comments: data.fqa_comments,
          offset: data.searchAfter,
          total: data.total,
          searchAfter: data.searchAfter,
          filters_key: data.filters_key,
        },
        code: 200,
      },
      { status: 200, headers }
    );
  } catch (error: any) {
    ReportError(error, {
      source: "get faq comments for prooduct server api",
      product_id,
      page: referer,
      url: "/public_comment/comments/fqa_comments",
      method: "get",
    });
    LogError({
      source: "get faq comments for prooduct server api",
      product_id,
      page: referer,
      url: "/public_comment/comments/fqa_comments",
      method: "get",
    });
    return NextResponse.json(
      {
        message: `${
          error.message ||
          error ||
          "error getting product faq data from elastic"
        }`,
        data: null,
        code: 500,
      },
      { status: 500, headers }
    );
  }
}
