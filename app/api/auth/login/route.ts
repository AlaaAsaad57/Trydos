import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  LOG_IN_CHAT_ENDPOINT,
  LOG_IN_STORIES_ENDPOINT,
  LOG_IN_COMMENTS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
} from "utils/fetch/Endpoints";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

export async function GET(request: NextRequest) {
  try {
    // Get country and language from headers
    const country = request.headers.get("country")?.trim() || "sy";
    let language = request.headers.get("language")?.trim();
    const lang = request.headers.get("lang")?.trim();
    language = language ?? lang ?? "en";
    let cookiesStore = await cookies();
    let guest_token =
      cookiesStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value ||
      cookiesStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value ||
      "";

    let searchParams = request.nextUrl.searchParams;
    let verificationId = searchParams.get("verificationId");
    let otp = searchParams.get("otp");
    let name = searchParams.get("name");
    if (!verificationId || !otp) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required query parameters" },
        { status: 400 }
      );
    }
    let newSearchParams = new URLSearchParams();
    newSearchParams.append("verificationId", verificationId);
    newSearchParams.append("otp", otp);
    if (name && name?.length > 0) {
      newSearchParams.append("name", name);
    }
    let url =
      process.env.NEXT_PUBLIC_BACKEND_URL +
      VERIFY_OTP_ENDPOINT +
      `?${newSearchParams.toString()}`;
    let fetch_req = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guest_token}`,
        country: country,
        language: language,
      },
      credentials: "omit",
    });
    let otp_response = await fetch_req.json();

    if (fetch_req.status !== 200) {
      return NextResponse.json(
        { ...otp_response, request: VERIFY_OTP_ENDPOINT },
        {
          status: fetch_req.status,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "Surrogate-Control": "no-store",
          },
        }
      );
    }

    let MainToken = otp_response.data.token;
    let idToken = otp_response?.data?.id_token;
    let InventoryUser = {
      ...otp_response.data.user,
      already_exists: otp_response.data.already_exists,
    };

    const [chatLoginResponse, StoriesLoginResponse, CommentLoginResponse] =
      await Promise.all([
        fetch(process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + LOG_IN_CHAT_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({
            otp_id_token: idToken,
            mobile_phone: InventoryUser.phone,
            name: name || InventoryUser.name,
            original_user_id: InventoryUser.id,
          }),
          credentials: "omit",
        }),
        fetch(
          process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + LOG_IN_STORIES_ENDPOINT,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              otp_id_token: idToken,
              mobile_phone: InventoryUser.phone,
            }),
            credentials: "omit",
          }
        ),
        fetch(
          process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL +
            LOG_IN_COMMENTS_ENDPOINT,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: String(InventoryUser.id),
              phone: String(InventoryUser.phone),
              id_token: idToken,
            }),
            credentials: "omit",
          }
        ),
      ]);
    let is_failed = [];
    let [chat_response, stories_response, comment_response] = await Promise.all(
      [
        chatLoginResponse.json(),
        StoriesLoginResponse.json(),
        CommentLoginResponse.json(),
      ]
    );

    if (chatLoginResponse.status !== 200) {
      is_failed.push({
        ...(chat_response ?? {}),
        request: LOG_IN_CHAT_ENDPOINT,
        status: StoriesLoginResponse.status,
      });
    }
    if (StoriesLoginResponse.status !== 200) {
      is_failed.push({
        ...stories_response,
        request: LOG_IN_STORIES_ENDPOINT,
        status: chatLoginResponse.status,
      });
    }
    if (CommentLoginResponse.status !== 200) {
      is_failed.push({
        ...comment_response,
        request: LOG_IN_COMMENTS_ENDPOINT,
        status: CommentLoginResponse.status,
      });
    }

    let ChatUser = chat_response?.data ?? null;
    let StoriesUser = stories_response?.data ?? null;
    let ChatToken = chat_response?.data?.access_token ?? null;
    let StoriesToken = stories_response?.data?.access_token ?? null;
    let CommentToken = comment_response?.comments_token ?? null;
    let finalResponse = {
      ...otp_response,
      ChatUser,
      StoriesUser,
    };
    if (is_failed?.length) {
      finalResponse = { ...finalResponse, is_failed };
    }
    const tokenCookies = [
      { name: COOKIE_NAMES.MARKET_TOKEN, value: MainToken },
      { name: COOKIE_NAMES.CHAT_TOKEN, value: ChatToken },
      { name: COOKIE_NAMES.STORIES_TOKEN, value: StoriesToken },
      { name: COOKIE_NAMES.USER_ID_HASH, value: CommentToken },
    ];

    tokenCookies.forEach((token) => {
      cookiesStore.set({
        name: token.name,
        value: token.value,
        httpOnly: false,
        sameSite: "strict",
        secure:
          process.env.VERCEL_ENV === "production" ||
          process.env.VERCEL_ENV === "preview",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 1, // 1 year
      });
    });

    return NextResponse.json(finalResponse, {
      status: fetch_req.status ?? 500,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error Login", error);
    return NextResponse.json(
      {
        error: error,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
