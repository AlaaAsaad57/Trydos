import { NextRequest } from "next/server";
import { getSellerComments } from "services/elastic/sellerComments";
import {
  readMarketToken,
  missingToken,
  toResponse,
  preflight,
} from "./_utils";

// GET /api/seller/comments?seller_id=<id>&type=faq|review&page=<n>&page_size=<n>
//
// Lists a shop's own FAQ questions (type=faq, default) or purchase reviews
// (type=review). Gated by READ_COMMENTS (or SUPER_ADMIN) — enforced server-side
// against the market backend using the MARKET token the mobile app sends in the
// Authorization header. Response: { success, data: { comments, meta } }.
export async function GET(req: NextRequest) {
  const authToken = readMarketToken(req);
  if (!authToken) return missingToken();

  const sp = req.nextUrl.searchParams;
  const sellerId = (sp.get("seller_id") || "").trim();
  const type = (sp.get("type") || "faq").toLowerCase();
  const isReview = type === "review" || type === "reviews";
  const page = Number(sp.get("page") || 1);
  const pageSizeRaw = sp.get("page_size");
  const pageSize = pageSizeRaw ? Number(pageSizeRaw) : undefined;

  const result = await getSellerComments({
    sellerId,
    isReview,
    page,
    pageSize,
    authToken,
  });

  return toResponse(result);
}

export function OPTIONS() {
  return preflight();
}
