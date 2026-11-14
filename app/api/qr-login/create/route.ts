import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import {
  callInventory,
  errorReply,
  isRequestId,
  makeSecret,
  readClientContext,
  saveSecret,
  toEpochMs,
} from "utils/server/qrLogin";

// Direction A, step 1: the signed-out browser asks for a QR.
// See docs/qr-login-tasks.md, section 3.
export async function POST(request: NextRequest) {
  const { secret, secretHash } = makeSecret();
  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.webCreate,
    method: "POST",
    body: { secret_hash: secretHash, ...readClientContext(request) },
    request,
  });
  if (result.status !== 200 && result.status !== 201) {
    return errorReply(result.status);
  }

  const { request_id, qr_payload, expires_at } = result.data || {};
  if (!isRequestId(request_id) || typeof qr_payload !== "string") {
    return errorReply(502);
  }
  // Only the hash went to the backend. The secret itself is sent once, at
  // collect, and page scripts never see it.
  await saveSecret(request_id, secret);
  return NextResponse.json({
    requestId: request_id,
    qrPayload: qr_payload,
    expiresAt: toEpochMs(expires_at),
  });
}
