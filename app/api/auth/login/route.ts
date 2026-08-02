import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  LOG_IN_CHAT_ENDPOINT,
  LOG_IN_STORIES_ENDPOINT,
  LOG_IN_COMMENTS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
  LOG_IN_WALLET_ENDPOINT,
} from "utils/fetch/Endpoints";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import { isGuestName } from "utils/tinyUtils";
import {
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  setSecureCookieJSON,
  sanitizeUserData,
  sanitizeServiceUser,
  sanitizeWalletUser,
} from "utils/server/tokenManager";

// Helper to handle sub-service fetches safely
async function safeServiceLogin(url: string, body: any) {
  try {
    // Wallet login: add signature and API key if endpoint matches
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (url.includes(LOG_IN_WALLET_ENDPOINT)) {
      headers["X-merchant-api-key"] = process.env.WALLET_PUBLIC_API_KEY;
    }
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "omit",
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch((e) => {
        LogServerError(
          { error: e, type: "login api route", url, body },
          "/api/auth/login",
        );
        return {};
      });
      return { success: false, status: response.status, data: errorData };
    }

    const data = await response.json();
    // console.log({
    //   url:url,
    //   method:"POST",
    //   body:JSON.stringify(body),
    //   response:data
    // })
    return { success: true, status: 200, data };
  } catch (err) {
    LogServerError({ error: err, type: "login api route", url, body });
    return { success: false, status: 503, error: err.message };
  }
}

export const dynamic = "force-dynamic";

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
      });

      otp_response = await otpRes.json();
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

    const {
      token: MainToken,
      id_token: idToken,
      user: InventoryUser,
    } = otp_response.data;
    // Treat backend guest placeholder names ("guest"/"verified_guest") as "no name"
    // so the UI prompts the user to enter a real name. Don't surface them as-is.
    if (InventoryUser && isGuestName(InventoryUser.name)) {
      InventoryUser.name = "";
    }

    // 3. Sub-service Logins (Resilient Path)
    const [chatRes, storiesRes, commentRes, walletRes] = await Promise.all([
      safeServiceLogin(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + LOG_IN_CHAT_ENDPOINT,
        {
          otp_id_token: String(idToken),
          mobile_phone: String(InventoryUser.phone),
          name: String(name || InventoryUser.name),
          original_user_id: String(InventoryUser.id),
        },
      ),
      safeServiceLogin(
        process.env.STORIES_BACKEND_URL + LOG_IN_STORIES_ENDPOINT,
        {
          otp_id_token: idToken,
          mobile_phone: InventoryUser.phone,
          original_user_id: String(InventoryUser.id)
        },
      ),
      safeServiceLogin(
        process.env.COMMENT_BACKEND_URL + LOG_IN_COMMENTS_ENDPOINT,
        {
          user_id: String(InventoryUser.id),
          phone: String(InventoryUser.phone),
          id_token: idToken,
        },
      ),
      safeServiceLogin(
        process.env.WALLET_BACKEND_URL + LOG_IN_WALLET_ENDPOINT,
        {
          otp_id_token: idToken,
          mobile_phone: InventoryUser.phone,
          firstName: String(name || InventoryUser.name)?.split(" ")?.[0] ?? "",
          lastName: String(name || InventoryUser.name)?.split(" ")?.[1] ?? "",
          email: String(InventoryUser.email) ?? "",
          platform:"web"
        },
      ),
    ]);

    // 4. Collect Failures and Extract Tokens
    const failures = [];
    if (!chatRes.success)
      failures.push({
        endpoint: "CHAT",
        ...chatRes,
        user_id: String(InventoryUser?.id),
        phone: String(InventoryUser.phone),
      });
    
    if (!storiesRes.success)
      failures.push({
        endpoint: "STORIES",
        ...storiesRes,
        user_id: String(InventoryUser?.id),
        phone: String(InventoryUser.phone),
      });
    if (!commentRes.success)
      failures.push({
        endpoint: "COMMENTS",
        ...commentRes,
        user_id: String(InventoryUser?.id),
        phone: String(InventoryUser.phone),
      });
    if (!walletRes.success) {
      failures.push({
        endpoint: "WALLET",
        ...walletRes,
      });
    }
    // Record any sub-service login failure so it reaches Sentry + mobile_error_log
    // (previously these were only surfaced via console.log / the response body).
    if (failures.length > 0) {
      await LogServerError(
        {
          scenario: "login sub-service failure",
          message: `Login sub-service(s) failed: ${failures
            .map((f) => f.endpoint)
            .join(", ")}`,
          failures,
          user_id: String(InventoryUser?.id),
        },
        "/api/auth/login",
      );
    }
    // 5. Set token cookies as HttpOnly (tokens NEVER reach client JS)
    const tokensToSet = [
      { name: COOKIE_NAMES.MARKET_TOKEN, value: MainToken },
      {
        name: COOKIE_NAMES.WALLET_TOKEN,
        value: walletRes.data?.accessToken?.token,
      },
      {
        name: COOKIE_NAMES.CHAT_TOKEN,
        value: chatRes.data?.data?.access_token,
      },
      {
        name: COOKIE_NAMES.STORIES_TOKEN,
        value: storiesRes.data?.data?.access_token,
      },
      {
        name: COOKIE_NAMES.USER_ID_HASH,
        value: commentRes.data?.comments_token,
      },
    ];

    tokensToSet.forEach((token) => {
      if (token.value) {
        cookiesStore.set({
          name: token.name,
          value: token.value,
          ...SECURE_COOKIE_OPTIONS,
        });
      }
    });

    // Verify returns a NEW token pair (promote or merge) — always replace
    // BOTH stored tokens; the refresh cookie gets its own 30d rotating TTL.
    if (otp_response.data.refresh_token) {
      cookiesStore.set({
        name: COOKIE_NAMES.MARKET_REFRESH_TOKEN,
        value: otp_response.data.refresh_token,
        ...REFRESH_COOKIE_OPTIONS,
      });
    }

    // 6. Store user metadata in HttpOnly cookies (for server-side access)
    const chatUserData = chatRes?.data?.data || null;
    const storiesUserData = storiesRes?.data?.data || null;
    const walletUserData = walletRes?.data?.user || null;

    await Promise.all([
      setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
        ...InventoryUser,
        already_exists: otp_response.data.already_exists,
        is_verified: true,
        is_phone_verified: 1,
        expires_at: otp_response.data.expires_at,
        story_user_id: storiesUserData?.id,
      }),
      chatUserData
        ? setSecureCookieJSON(COOKIE_NAMES.USER_CHAT, {
            ...chatUserData,
            need_auth: false,
          })
        : Promise.resolve(),
      storiesUserData
        ? setSecureCookieJSON(COOKIE_NAMES.USER_STORIES, {
            ...storiesUserData,
            need_auth: false,
          })
        : Promise.resolve(),
      walletUserData
        ? setSecureCookieJSON(
            COOKIE_NAMES.WALLET_USER,
            sanitizeWalletUser(walletUserData),
          )
        : Promise.resolve(),
        
    ]);

    // 7. Return sanitized response (NO tokens in response body)
    return NextResponse.json(
      {
        ...otp_response,
        data: {
          ...otp_response.data,
          token: undefined, // Strip market token from response
          refresh_token: undefined, // Never expose the refresh token (NFR-3)
        },
        ChatUser: sanitizeServiceUser(chatUserData),
        StoriesUser: sanitizeServiceUser(storiesUserData),
        is_failed: failures?.length > 0 ? failures : undefined,
        WalletUser: sanitizeWalletUser(walletUserData),
        original_user_id: String(InventoryUser.id),
      },
      { status: 200 },
    );
  } catch (error) {
    LogServerError({ error, type: "api route Login Handler Error" });
    console.error("Login Handler Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
