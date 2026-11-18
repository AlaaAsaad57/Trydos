import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import {
  callInventory,
  errorReply,
  hashSecret,
  isRequestId,
  readSecret,
} from "utils/server/qrLogin";

// Direction A: the browser asks every 2 seconds whether the app approved.
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("id");
  if (!isRequestId(requestId)) return errorReply(400);

  // Only the browser that made this QR may ask about it.
  const secret = await readSecret(requestId);
  if (!secret) return errorReply(403);

  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.webStatus(requestId),
    method: "GET",
    headers: { "X-QR-Secret-Hash": hashSecret(secret) },
    request,
  });
  if (result.status !== 200) return errorReply(result.status);
  if (typeof result.data?.status !== "string") return errorReply(502);
  return NextResponse.json({ status: result.data.status });
}
