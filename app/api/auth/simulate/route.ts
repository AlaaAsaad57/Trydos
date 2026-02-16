import { NextRequest, NextResponse } from "next/server";
import {
  setSecureCookie,
  setSecureCookieJSON,
  deleteSecureCookie,
  SECURE_COOKIE_OPTIONS,
} from "utils/server/tokenManager";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

// Debug-only route: sets auth cookies from simulated payload
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not available" }, { status: 403 });
  }

  const body = await request.json();
  const { userData, userChat, userStories, marketToken, deviceToken } = body;

  if (userData !== undefined)
    await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, userData);
  if (userChat !== undefined)
    await setSecureCookieJSON(COOKIE_NAMES.USER_CHAT, userChat);
  else await deleteSecureCookie(COOKIE_NAMES.USER_CHAT);

  if (userStories !== undefined)
    await setSecureCookieJSON(COOKIE_NAMES.USER_STORIES, userStories);
  else await deleteSecureCookie(COOKIE_NAMES.USER_STORIES);

  if (marketToken !== undefined)
    await setSecureCookie(COOKIE_NAMES.MARKET_TOKEN, marketToken);
  else await deleteSecureCookie(COOKIE_NAMES.MARKET_TOKEN);

  if (deviceToken !== undefined)
    await setSecureCookie(COOKIE_NAMES.DEVICE_TOKEN, deviceToken);

  return NextResponse.json({ success: true });
}
