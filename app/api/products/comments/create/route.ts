import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "utils/cookies/cookie-manager";
import { ReportError } from "utils/errorReported";
import { LogError } from "utils/functions";

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
  const {
    text,
    product_id,
    user_id,
    user_name,
    user_avatar,
    rating,
    order_detail_id,
    order_details_id,
    user_type,
    variant,
  } = body;
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

    if (!user_id || !product_id || !user_name || !text || text?.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    let response = await fetch(
      process.env.COMMENT_BACKEND_URL + "/public_comment/comments/create",
      {
        body: JSON.stringify({
          text,
          //   @ts-ignore
          product_id: String(product_id),
          user_id: String(user_id),
          user_name,
          user_avatar,
          rating,
          order_details_id: String(order_details_id ?? order_detail_id),
          variant,
          user_type: "customer",
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "omit",
      }
    );
    let data = await response.json();
    if (data.detail) {
      throw new Error(JSON.stringify(data));
    }
    data = data.data;
    return NextResponse.json(
      {
        data: {
          comment: {
            id: data.comment_id,
            customer: {
              id: data.user_id,
              name: data.user_name,
              image: data.user_avatar,
            },
            order_details_id: data?.order_details_id,
            star_rating: data?.rating,
            comment: data?.text,
            variant: data?.variant,
            created_at: data?.created_at,
            product_id: product_id,
          },
        },
        message: "added successfuly",
        code: 200,
      },
      { status: 200, headers }
    );
  } catch (error: any) {
    ReportError(error, {
      source: "add comment server api",
      userId: user_id,
      page: referer,
      url: "/public_comment/comments/create",
      method: "POST",
      body,
    });
    LogError({
      source: "add comment server api",
      userId: user_id,
      error: error,
      page: referer,
      url: "/public_comment/comments/create",
      method: "POST",
      body,
    });
    return NextResponse.json(
      {
        message: `${error?.message || "error in creating comment"}`,
        data: null,
        code: 500,
      },
      { status: 500, headers }
    );
  }
}
