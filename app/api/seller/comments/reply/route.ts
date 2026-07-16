import { NextRequest } from "next/server";
import {
  replyToComment,
  editReply,
  deleteReply,
} from "services/elastic/sellerComments";
import {
  readMarketToken,
  missingToken,
  readJson,
  toResponse,
  preflight,
} from "../_utils";

// Seller reply on a comment/question. One route, three verbs:
//   POST   → create a reply   (permission REPLY_COMMENT)
//   PUT    → edit the reply    (permission EDIT_REPLY)
//   DELETE → remove the reply  (permission DELETE_REPLY)
// All three take the MARKET token in the Authorization header and re-verify
// shop ownership + permission server-side. reply_text is HTML-stripped and
// capped at 1000 chars server-side; a comment that isn't this shop's simply
// matches zero documents ("Comment not found or not permitted.").
//
// Body (JSON): { seller_id, comment_id, reply_text? }

export async function POST(req: NextRequest) {
  const authToken = readMarketToken(req);
  if (!authToken) return missingToken();

  const body = await readJson(req);
  const result = await replyToComment({
    sellerId: String(body?.seller_id ?? "").trim(),
    commentId: String(body?.comment_id ?? "").trim(),
    replyText: String(body?.reply_text ?? ""),
    authToken,
  });

  return toResponse(result, 201);
}

export async function PUT(req: NextRequest) {
  const authToken = readMarketToken(req);
  if (!authToken) return missingToken();

  const body = await readJson(req);
  const result = await editReply({
    sellerId: String(body?.seller_id ?? "").trim(),
    commentId: String(body?.comment_id ?? "").trim(),
    replyText: String(body?.reply_text ?? ""),
    authToken,
  });

  return toResponse(result);
}

export async function DELETE(req: NextRequest) {
  const authToken = readMarketToken(req);
  if (!authToken) return missingToken();

  const body = await readJson(req);
  const result = await deleteReply({
    sellerId: String(body?.seller_id ?? "").trim(),
    commentId: String(body?.comment_id ?? "").trim(),
    authToken,
  });

  return toResponse(result);
}

export function OPTIONS() {
  return preflight();
}
