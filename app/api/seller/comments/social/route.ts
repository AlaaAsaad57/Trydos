import { NextRequest } from "next/server";
import { getSellerProductsSocial } from "services/elastic/sellerComments";
import {
  readMarketToken,
  missingToken,
  readJson,
  toResponse,
  preflight,
} from "../_utils";

// POST /api/seller/comments/social
// Body (JSON): { seller_id, product_ids: [<id>, ...] }  (max 100 ids)
//
// Per-product social counters (reactions / FAQ questions / reviews / shares)
// for this shop's products. Gated by READ_COMMENTS (or SUPER_ADMIN). Returns
// { success, data: { "<product_id>": { total_reactions, total_fqa,
// total_reviews, total_shares }, ... } } — every requested id is present,
// zero-filled when it has no activity.
export async function POST(req: NextRequest) {
  const authToken = readMarketToken(req);
  if (!authToken) return missingToken();

  const body = await readJson(req);
  const productIds = Array.isArray(body?.product_ids) ? body.product_ids : [];

  const result = await getSellerProductsSocial({
    sellerId: String(body?.seller_id ?? "").trim(),
    productIds,
    authToken,
  });

  return toResponse(result);
}

export function OPTIONS() {
  return preflight();
}
