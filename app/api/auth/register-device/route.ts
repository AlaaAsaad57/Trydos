import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  SECURE_COOKIE_OPTIONS,
  setSecureCookieJSON,
  getSecureCookie,
  getTokenForServer,
} from "utils/server/tokenManager";

const REGISTER_DEVICE_URL = "/auth/register-guest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const oldGuestUserId = body.old_guest_user_id ?? null;
    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";

    const token = await getTokenForServer("market");

    const requestBody = { old_guest_user_id: oldGuestUserId };

    let response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          country,
          language,
        },
        body: JSON.stringify(requestBody),
        credentials: "omit",
      },
    );

    let data = await response.json();

    // Retry without old_guest_user_id if user not found
    if (data.message === "The user does not exist." && oldGuestUserId) {
      response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            country,
            language,
          },
          body: JSON.stringify({ old_guest_user_id: null }),
          credentials: "omit",
        },
      );
      data = await response.json();
    }

    if (!response.ok) {
      LogServerError({
        error: data,
        type: "register-device route error",
      });
      return NextResponse.json(data, { status: response.status });
    }

    // Set device token as HttpOnly cookie
    const cookieStore = await cookies();
    if (data.data?.token) {
      console.log("Setting device token cookie for user:", data.data?.token);
      cookieStore.set({
        name: COOKIE_NAMES.DEVICE_TOKEN,
        value: data.data.token,
        ...SECURE_COOKIE_OPTIONS,
      });
    }

    // Store user data in HttpOnly cookie
    if (data.data?.user) {
      await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
        ...data.data.user,
        expired_at: data.data.expires_at,
      });
    }

    // Return user data without the token
    return NextResponse.json(
      {
        ...data,
        data: {
          ...data.data,
          token: undefined, // Strip token from response
        },
      },
      { status: 200 },
    );
  } catch (error) {
    LogServerError({ error, type: "register-device route error" });
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 },
    );
  }
}
