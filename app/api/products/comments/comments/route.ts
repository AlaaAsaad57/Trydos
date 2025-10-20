import { NextRequest, NextResponse } from "next/server";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { elasticSearchComment } from "services/elastic/elasticsearch.config";
import { verifyToken } from "utils/cookies/cookie-manager";
import { LogError } from "utils/functions";
import { GetCommentsFromElastic } from "utils/pagesDataRequests/ProductPageData";

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
  const searchParams = req.nextUrl.searchParams;
  const product_id = searchParams.get("product_id");
  const offset = searchParams.get("offset");
  let userToken = req.headers.get("authorization");
  userToken = userToken?.split("Bearer ")[1];
  let secret = process.env.SECRET_KEY;
  let isUserAuthincticated = verifyToken(userToken, secret);
  let user_id = isUserAuthincticated?.userId;
  try {
    if (!product_id) {
      return NextResponse.json(
        { error: "Missing required url search params : product_id" },
        { status: 400 }
      );
    }

    let data = await GetCommentsFromElastic({
      pageSize: 10,
      product_id: product_id,
      searchAfter: offset,
      user_id: user_id,
    });
    return NextResponse.json(
      { data: data, code: 200, offset: data.searchAfter },
      { headers }
    );
  } catch (error: any) {
    LogError({
      source: "get comment server api",
      userId: user_id,
      page: referer,
      error: error,
      url: "server/api/comments/comments",
      method: "GET",
    });
    return NextResponse.json(
      {
        error:
          `${error.message || error || "Unknown error"}` || "Unknown error",
      },
      { status: 500, headers }
    );
  }
}
