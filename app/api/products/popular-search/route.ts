import { NextRequest, NextResponse } from "next/server";
import { withApiProtection } from "serverRequests/apiMiddlware";
import { getPopularSearchTerms } from "services/elastic/helpers";
import { LogServerError } from "utils/serverErrorReporter";

const popularSearchHandler = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const limit = 10;
    const popularSearchTerms = await getPopularSearchTerms(limit);

    return NextResponse.json({
      popular_search_terms: popularSearchTerms,
    });
  } catch (error) {
    LogServerError({
      error,
      type: "popular search route error",
      source: "app/api/products/popular-search",
      method: "GET",
    });

    return NextResponse.json(
      {
        message: "Failed to fetch popular search terms",
        popular_search_terms: [],
      },
      { status: 500 },
    );
  }
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const protectedHandler = await withApiProtection(popularSearchHandler);
  return protectedHandler(req);
}
