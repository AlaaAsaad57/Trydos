import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_OTP_ENDPOINT } from "utils/fetch/Endpoints";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import { logRequest, startTimer } from "reqLogger";
import { finishLogin, LOGIN_TIMEOUT_MS } from "utils/server/finishLogin";

export async function GET(request: NextRequest) {
  try {
    // 1. Initial Headers and Params
    const country = request.headers.get("country")?.trim() || "sy";
    const language =
      request.headers.get("language")?.trim() ||
      request.headers.get("lang")?.trim() ||
      "en";
    const cookiesStore = await cookies();
    const guest_token = cookiesStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value || "";

    const { searchParams } = request.nextUrl;
    const verificationId = searchParams.get("verificationId");
    const otp = searchParams.get("otp");
    const name = searchParams.get("name");

    if (!verificationId || !otp) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing params" },
        { status: 400 },
      );
    }

    // 2. Primary OTP Verification (Critical Path)
    // Always served by the core backend — for first-time guest verification
    // AND re-verification alike (product decision; do NOT route this call by
    // user type). POST with a JSON body {verificationId, otp} + Bearer auth
    // (no query params); returns a fresh token pair on promote and on merge.
    const otpUrl = `${process.env.BACKEND_URL}${VERIFY_OTP_ENDPOINT}`;
    let otpRes: Response;
    let otp_response: any;
    const otpElapsed = startTimer();
    try {
      otpRes = await fetch(otpUrl, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${guest_token}`,
          country,
          language,
          Lang: language,
          Country: country,
        },
        method: "POST",
        body: JSON.stringify({
          verificationId,
          otp,
          ...(name ? { name } : {}),
        }),
        signal: AbortSignal.timeout(LOGIN_TIMEOUT_MS),
      });

      otp_response = await otpRes.json();
      await logRequest({
        server: "market",
        url: VERIFY_OTP_ENDPOINT,
        method: "POST",
        status: otpRes.status,
        durationMs: otpElapsed(),
        backend: "core",
        requestBody: { verificationId, ...(name ? { name } : {}) },
        responseBody: otp_response,
        userId: otp_response?.data?.user?.id,
        userName: otp_response?.data?.user?.name,
      });
    } catch (error) {
      // Transport/parse failure reaching the verify_otp_from_guest service.
      // This is server-side and otherwise very hard to trace, so capture it to
      // Sentry explicitly with the request context before falling through to the
      // outer handler (which returns the generic 500).
      await LogServerError(
        {
          scenario: "verify_otp_from_guest service request failed",
          backend: "core",
          error,
          verificationId,
          country,
          language,
        },
        "/api/auth/login",
      );
      await logRequest({
        server: "market",
        url: VERIFY_OTP_ENDPOINT,
        method: "POST",
        status: 0,
        durationMs: otpElapsed(),
        backend: "core",
        requestBody: { verificationId, ...(name ? { name } : {}) },
        error,
      });
      throw error;
    }

    if (!otpRes.ok) {
      LogServerError(
        {
          scenario: "verify_otp_from_guest service returned non-OK",
          backend: "core",
          error: otp_response,
          status: otpRes.status,
          verificationId,
        },
        "/api/auth/login",
      );
      return NextResponse.json(otp_response, { status: otpRes.status });
    }

    // Legacy branch tolerance (AC-8): when the OTP server is disabled the
    // response's `data` is the bare phone_verifications record — NO token
    // pair, no user. Return it untouched and leave the shopper's currently
    // stored tokens intact (no cookie writes, no sub-service logins).
    if (!otp_response?.data?.token || !otp_response?.data?.user) {
      return NextResponse.json(otp_response, { status: 200 });
    }

    // 3–7. Sign in to the sub-services, store every token as an HttpOnly
    // cookie and answer without tokens. QR login runs the same steps.
    const body = await finishLogin({
      marketResponse: otp_response,
      mode: "otp",
      name,
      route: "/api/auth/login",
    });
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    LogServerError({ error, type: "api route Login Handler Error" });
    await LogServerError({ scenario: "login route handler", error }, "/api/auth/login");
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
