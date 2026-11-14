import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import {
  callInventory,
  errorReply,
  readRequestId,
  toEpochMs,
} from "utils/server/qrLogin";

// The phone scanner (app/api/qr-login/scan) does the app's part until the app
// ships its own scanner. Phone browsers only.
//
// Direction A, step 2: this signed-in phone scanned a browser's QR. The core
// backend makes this user the owner of the session (a guest gets 403, another
// user gets 409) and answers where the browser is, for the approve sheet.
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export async function POST(request: NextRequest) {
  const requestId = await readRequestId(request);
  if (!requestId) return errorReply(400);

  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.webScanned(requestId),
    method: "POST",
    request,
  });
  if (result.status !== 200) return errorReply(result.status);
  const data = result.data || {};
  return NextResponse.json({
    browser: text(data.browser),
    os: text(data.os),
    city: text(data.city),
    region: text(data.region),
    country: text(data.country),
    expiresAt: toEpochMs(data.expires_at),
  });
}
