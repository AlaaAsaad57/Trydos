import { NextRequest, NextResponse } from "next/server";
import { GetRatingCommentsFromElastic } from "utils/pagesDataRequests/ProductPageData";
import { LogServerError } from "utils/serverErrorReporter";

export async function POST(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }
  const body = await req.json();
  const referer = req.headers.get("referer");
  const { order_detail_ids, user_id } = body;
  try {
    if (!order_detail_ids || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    let data = await GetRatingCommentsFromElastic({
      order_ids: order_detail_ids,
      user_id: user_id,
      pageSize: 10,
    });

    return NextResponse.json(
      {
        data: data,

        code: 200,
      },
      { status: 200, headers },
    );
  } catch (error: any) {
    LogServerError({
      error,
      source: "get rating comment for order server api",
      userId: user_id,
      page: referer,
      url: "/public_comment/comments/order_rating",
      method: "POST",
      body,
    });
    return NextResponse.json(
      {
        message: `${
          error.message ||
          error ||
          "error getting order rating data from elestic"
        }`,
        data: null,
        code: 500,
      },
      { status: 500, headers },
    );
  }
}
