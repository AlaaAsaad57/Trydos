import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  LOG_IN_CHAT_ENDPOINT,
  LOG_IN_STORIES_ENDPOINT,
  LOG_IN_COMMENTS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
} from "utils/fetch/Endpoints";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

// Helper to handle sub-service fetches safely
async function safeServiceLogin(url: string, body: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      credentials: "omit",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, status: response.status, data: errorData };
    }

    const data = await response.json();
    return { success: true, status: 200, data };
  } catch (err) {
    return { success: false, status: 503, error: err.message };
  }
}

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
        { status: 400 }
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
    });

    const otp_response = await otpRes.json();
    if (!otpRes.ok)
      return NextResponse.json(otp_response, { status: otpRes.status });

    const {
      token: MainToken,
      id_token: idToken,
      user: InventoryUser,
    } = otp_response.data;

    // 3. Sub-service Logins (Resilient Path)
    const [chatRes, storiesRes, commentRes] = await Promise.all([
      safeServiceLogin(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + LOG_IN_CHAT_ENDPOINT,
        {
          otp_id_token: String(idToken),
          mobile_phone: String(InventoryUser.phone),
          name: String(name || InventoryUser.name),
          original_user_id: String(InventoryUser.id),
        }
      ),
      safeServiceLogin(
        process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + LOG_IN_STORIES_ENDPOINT,
        {
          otp_id_token: idToken,
          mobile_phone: InventoryUser.phone,
        }
      ),
      safeServiceLogin(
        process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL + LOG_IN_COMMENTS_ENDPOINT,
        {
          user_id: String(InventoryUser.id),
          phone: String(InventoryUser.phone),
          id_token: idToken,
        }
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

    const tokensToSet = [
      { name: COOKIE_NAMES.MARKET_TOKEN, value: MainToken },
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

    // 5. Set Cookies (Only if value exists)
    tokensToSet.forEach((token) => {
      if (token.value) {
        cookiesStore.set({
          name: token.name,
          value: token.value,
          httpOnly: false,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    });

    // 6. Final Response
    return NextResponse.json(
      {
        ...otp_response,
        ChatUser: chatRes.data?.data || null,
        StoriesUser: storiesRes.data?.data || null,
        is_failed: failures.length > 0 ? failures : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login Handler Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
