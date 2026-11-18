import { NextRequest } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import { QR_CLAIM_SECRET_COOKIE } from "utils/server/qrLogin";
import { collectAndSignIn } from "../../collect";

// Direction B, last step: the signed-in device approved, so this phone
// collects its own new tokens and signs in, the same way OTP login does.
export async function POST(request: NextRequest) {
  return collectAndSignIn({
    request,
    cookieName: QR_CLAIM_SECRET_COOKIE,
    collectPath: QR_LOGIN_ENDPOINTS.appCollect,
    route: "/api/qr-login/scan/complete",
  });
}
