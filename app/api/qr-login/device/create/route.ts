import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import {
  callInventory,
  errorReply,
  isRequestId,
  toEpochMs,
} from "utils/server/qrLogin";

// Direction B, step 1: the signed-in web shows a QR for a phone's app.
// The backend refuses a guest with 403.
export async function POST(request: NextRequest) {
  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.appCreate,
    method: "POST",
    request,
  });
  if (result.status !== 200 && result.status !== 201) {
    return errorReply(result.status);
  }

  const { request_id, qr_payload, expires_at } = result.data || {};
  if (!isRequestId(request_id) || typeof qr_payload !== "string") {
    return errorReply(502);
  }
  return NextResponse.json({
    requestId: request_id,
    qrPayload: qr_payload,
    expiresAt: toEpochMs(expires_at),
  });
}
