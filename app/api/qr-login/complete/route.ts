import { NextRequest } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import { QR_SECRET_COOKIE } from "utils/server/qrLogin";
import { collectAndSignIn } from "../collect";

// Direction A, last step: the app approved, so this browser collects its own
// new tokens and signs in, the same way OTP login does.
export async function POST(request: NextRequest) {
  return collectAndSignIn({
    request,
    cookieName: QR_SECRET_COOKIE,
    collectPath: QR_LOGIN_ENDPOINTS.webCollect,
    route: "/api/qr-login/complete",
  });
}
