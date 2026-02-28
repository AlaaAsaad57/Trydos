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
import {
  SECURE_COOKIE_OPTIONS,
  setSecureCookieJSON,
  sanitizeUserData,
  sanitizeServiceUser,
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
    const guest_token =
      cookiesStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value ||
      cookiesStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value ||
      "";

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
    const otpUrl = `${
      process.env.NEXT_PUBLIC_BACKEND_URL
    }${VERIFY_OTP_ENDPOINT}?verificationId=${verificationId}&otp=${otp}${
      name ? `&name=${name}` : ""
    }`;
    const otpRes = await fetch(otpUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guest_token}`,
        country,
        language,
      },
      method: "POST",
      body: JSON.stringify({ verificationId, otp, name }), // Send data in body for better security and consistency
    });

    const otp_response = await otpRes.json();
    if (!otpRes.ok) {
      LogServerError({ error: otp_response, type: "verify login api route" });
      return NextResponse.json(otp_response, { status: otpRes.status });
    }

    const {
      token: MainToken,
      id_token: idToken,
      user: InventoryUser,
    } = otp_response.data;

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
        process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + LOG_IN_STORIES_ENDPOINT,
        {
          otp_id_token: idToken,
          mobile_phone: InventoryUser.phone,
        },
      ),
      safeServiceLogin(
        process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL + LOG_IN_COMMENTS_ENDPOINT,
        {
          user_id: String(InventoryUser.id),
          phone: String(InventoryUser.phone),
          id_token: idToken,
        },
      ),
      safeServiceLogin(
        process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + LOG_IN_WALLET_ENDPOINT,
        {
          otp_id_token: idToken,
          mobile_phone: InventoryUser.phone,
          firstName: String(name || InventoryUser.name)?.split(" ")?.[0] ?? "",
          lastName: String(name || InventoryUser.name)?.split(" ")?.[1] ?? "",
          email: String(InventoryUser.email) ?? "",
        },
      ),
    ]);
    console.log(walletRes, {
      url: process.env.NEXT_PUBLIC_WALLET_BACKEND_URL + LOG_IN_WALLET_ENDPOINT,
      body: {
        otp_id_token: idToken,
        mobile_phone: InventoryUser.phone,
        firstName: String(name || InventoryUser.name)?.split(" ")?.[0] ?? "",
        lastName: String(name || InventoryUser.name)?.split(" ")?.[1] ?? "",
        email: String(InventoryUser.email) ?? "",
      },
    });
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
        ? setSecureCookieJSON(COOKIE_NAMES.WALLET_USER, walletUserData)
        : Promise.resolve(),
    ]);

    // 7. Return sanitized response (NO tokens in response body)
    return NextResponse.json(
      {
        ...otp_response,
        data: {
          ...otp_response.data,
          token: undefined, // Strip market token from response
        },
        ChatUser: sanitizeServiceUser(chatUserData),
        StoriesUser: sanitizeServiceUser(storiesUserData),
        is_failed: failures?.length > 0 ? failures : undefined,
        WalletUser: walletUserData,
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
