import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import { LogServerError } from "utils/serverErrorReporter";
import { finishLogin } from "utils/server/finishLogin";
import {
  callInventory,
  deleteSecret,
  errorReply,
  readRequestId,
  readSecret,
} from "utils/server/qrLogin";

const ROUTE = "/api/qr-login/complete";

// Direction A, last step: the app approved, so this browser collects its own
// new tokens and signs in, the same way OTP login does.
export async function POST(request: NextRequest) {
  try {
    const requestId = await readRequestId(request);
    if (!requestId) return errorReply(400);

    const secret = await readSecret(requestId);
    if (!secret) return errorReply(403);

    // The guest token goes with the call, so the backend merges the guest bag.
    const result = await callInventory({
      path: QR_LOGIN_ENDPOINTS.webCollect(requestId),
      method: "POST",
      body: { secret },
      request,
    });
    if (result.status !== 200) return errorReply(result.status);

    // Collect works only once, so the secret has no further use.
    await deleteSecret();

    const data = result.data;
    // Without refresh_token, the guest's old refresh cookie would stay next to
    // the user's new access token, and the next refresh would sign the user out.
    if (!data?.token || !data?.refresh_token || !data?.user || !data?.qr_id_token) {
      await LogServerError(
        {
          scenario:
            "QR collect answer is missing the token, the refresh token, the user or qr_id_token",
          backend: "core",
          has_token: Boolean(data?.token),
          has_refresh_token: Boolean(data?.refresh_token),
          has_user: Boolean(data?.user),
          has_qr_id_token: Boolean(data?.qr_id_token),
        },
        ROUTE,
      );
      return errorReply(502);
    }

    const body = await finishLogin({
      marketResponse: { isSuccessful: true, message: "ok", data },
      mode: "qr",
      route: ROUTE,
    });
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    await LogServerError({ scenario: "QR login complete route", error }, ROUTE);
    return errorReply(500);
  }
}
