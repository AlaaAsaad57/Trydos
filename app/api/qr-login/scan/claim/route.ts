import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import {
  callInventory,
  errorReply,
  makeSecret,
  QR_CLAIM_SECRET_COOKIE,
  readClientContext,
  readRequestId,
  saveSecret,
  toEpochMs,
} from "utils/server/qrLogin";

// The phone scanner does the app's part until the app ships its own scanner.
//
// Direction B, step 2: this signed-out phone scanned a signed-in device's QR,
// and claims the session with the guest token. The first claim wins; a second
// device gets 409.
export async function POST(request: NextRequest) {
  const requestId = await readRequestId(request);
  if (!requestId) return errorReply(400);

  const { secret, secretHash } = makeSecret();
  const context = readClientContext(request);
  const { browser, os } = context;
  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.appClaim(requestId),
    method: "POST",
    body: {
      secret_hash: secretHash,
      // The signed-in device shows this name on its approve sheet. Names only,
      // no words, so it needs no translation.
      device_name: [browser, os].filter(Boolean).join(", ") || null,
      platform: "web",
      // The same fields as web/create (Direction A), so the signed-in device
      // can show this phone's flag, city, browser and system. See
      // docs/qr-login-backend-guide.md, section 4.2.
      ...context,
    },
    request,
  });
  if (result.status !== 200 && result.status !== 201) {
    return errorReply(result.status);
  }
  // Only the hash went to the backend. The secret is sent once, at collect.
  await saveSecret(requestId, secret, QR_CLAIM_SECRET_COOKIE);
  return NextResponse.json({
    status: typeof result.data?.status === "string" ? result.data.status : "claimed",
    expiresAt: toEpochMs(result.data?.expires_at),
  });
}
