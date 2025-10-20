import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "utils/cookies/cookie-manager";
import { ReportError } from "utils/errorReported";
import { LogError } from "utils/functions";
import { GetRatingCommentsFromElastic } from "utils/pagesDataRequests/ProductPageData";

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
    let userToken = req.headers.get("authorization");
    userToken = userToken?.split("Bearer ")[1];
    let secret = process.env.SECRET_KEY;
    let isUserAuthincticated = verifyToken(userToken, secret);
    if (
      !isUserAuthincticated ||
      Number(isUserAuthincticated.userId) !== Number(user_id)
    ) {
      return NextResponse.json(
        {
          message: "unAuthincticated",
          code: 401,
          data: null,
        },
        { status: 401, headers }
      );
    }

    if (!order_detail_ids || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
      { status: 200, headers }
    );
  } catch (error: any) {
    ReportError(error, {
      source: "get rating comment for order server api",
      userId: user_id,
      page: referer,
      url: "/public_comment/comments/order_rating",
      method: "POST",
      body,
    });
    LogError({
      source: "get rating comment for order server api",
      userId: user_id,
      error: error,
      page: referer,
      url: "/public_comment/comments/order_rating",
      method: "POST",
      body,
    });
    return NextResponse.json(
      {
        message:
          `${error.message || error || "Unknown error"}` || "Unknown error",
        data: null,
        code: 500,
      },
      { status: 500, headers }
    );
  }
}
