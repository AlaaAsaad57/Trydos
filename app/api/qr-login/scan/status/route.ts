import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import {
  callInventory,
  errorReply,
  hashSecret,
  isRequestId,
  QR_CLAIM_SECRET_COOKIE,
  readSecret,
} from "utils/server/qrLogin";

// Direction B: the phone that claimed asks every 2 seconds whether the
// signed-in device approved. The secret's hash proves it is the phone that
// claimed.
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("id");
  if (!isRequestId(requestId)) return errorReply(400);

  const secret = await readSecret(requestId, QR_CLAIM_SECRET_COOKIE);
  if (!secret) return errorReply(403);

  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.appStatus(requestId),
    method: "GET",
    headers: { "X-QR-Secret-Hash": hashSecret(secret) },
    request,
  });
  if (result.status !== 200) return errorReply(result.status);
  if (typeof result.data?.status !== "string") return errorReply(502);
  return NextResponse.json({ status: result.data.status });
}
