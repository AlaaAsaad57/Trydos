import { NextRequest, NextResponse } from "next/server";
import { LogServerError } from "utils/serverErrorReporter";
import { finishLogin } from "utils/server/finishLogin";
import {
  callInventory,
  deleteSecret,
  errorReply,
  readRequestId,
  readSecret,
} from "utils/server/qrLogin";

type CollectInput = {
  request: NextRequest;
  /** The cookie that holds this browser's secret for the session. */
  cookieName: string;
  /** The core backend path: web/collect or app/collect. */
  collectPath: (requestId: string) => string;
  /** The route that runs this, for the error report. */
  route: string;
};

/**
 * The last step of a QR login on the side that waits: the other device
 * approved, so this browser collects its own new tokens and signs in, the same
 * way OTP login does.
 *
 * - /api/qr-login/complete: Direction A (web/collect).
 * - /api/qr-login/scan/complete: Direction B (app/collect).
 */
export async function collectAndSignIn({
  request,
  cookieName,
  collectPath,
  route,
}: CollectInput) {
  try {
    const requestId = await readRequestId(request);
    if (!requestId) return errorReply(400);

    const secret = await readSecret(requestId, cookieName);
    if (!secret) return errorReply(403);

    // The guest token goes with the call, so the backend merges the guest bag.
    const result = await callInventory({
      path: collectPath(requestId),
      method: "POST",
      body: { secret },
      request,
    });
    if (result.status !== 200) return errorReply(result.status);

    // Collect works only once, so the secret has no further use.
    await deleteSecret(cookieName);

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
        route,
      );
      return errorReply(502);
    }

    const body = await finishLogin({
      marketResponse: { isSuccessful: true, message: "ok", data },
      mode: "qr",
      route,
    });
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    await LogServerError({ scenario: "QR login complete route", error }, route);
    return errorReply(500);
  }
}
