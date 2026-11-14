import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import { callInventory, errorReply, readRequestId } from "utils/server/qrLogin";

/**
 * The signed-in user approves or denies a waiting device.
 * - `app`: Direction B. This web showed the QR, and a phone claimed it.
 * - `web`: Direction A. This phone scanned a browser's QR (app/api/qr-login/scan).
 */
export async function decide(
  request: NextRequest,
  answer: "approve" | "deny",
  side: "app" | "web" = "app",
) {
  const requestId = await readRequestId(request);
  if (!requestId) return errorReply(400);

  const paths =
    side === "web"
      ? { approve: QR_LOGIN_ENDPOINTS.webApprove, deny: QR_LOGIN_ENDPOINTS.webDeny }
      : { approve: QR_LOGIN_ENDPOINTS.appApprove, deny: QR_LOGIN_ENDPOINTS.appDeny };
  const result = await callInventory({
    path: paths[answer](requestId),
    method: "POST",
    request,
  });
  if (result.status !== 200) return errorReply(result.status);
  return NextResponse.json({
    status: result.data?.status || (answer === "approve" ? "approved" : "denied"),
  });
}
