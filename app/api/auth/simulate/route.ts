import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { deleteSecureCookie } from "utils/server/tokenManager";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

const SIMULATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 30 * 60, // 30 minutes
};

const setSimulateCookie = async (name: string, value: string) => {
  const cookieStore = await cookies();
  cookieStore.set({ name, value, ...SIMULATE_COOKIE_OPTIONS });
};

const setSimulateCookieJSON = async (name: string, value: unknown) => {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  await setSimulateCookie(name, encodeURIComponent(serialized));
};

// Debug-only route: sets auth cookies from simulated payload (30 min expiry)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    userData,
    userChat,
    userStories,
    marketToken,
    deviceToken,
    chatToken,
    storiesToken,
    walletToken,
    userIdHash,
  } = body;

  if (userData !== undefined)
    await setSimulateCookieJSON(COOKIE_NAMES.USER_DATA, userData);
  if (userChat !== undefined)
    await setSimulateCookieJSON(COOKIE_NAMES.USER_CHAT, userChat);
  else await deleteSecureCookie(COOKIE_NAMES.USER_CHAT);

  if (userStories !== undefined)
    await setSimulateCookieJSON(COOKIE_NAMES.USER_STORIES, userStories);
  else await deleteSecureCookie(COOKIE_NAMES.USER_STORIES);

  if (marketToken !== undefined)
    await setSimulateCookie(COOKIE_NAMES.MARKET_TOKEN, marketToken);
  else await deleteSecureCookie(COOKIE_NAMES.MARKET_TOKEN);

  if (deviceToken !== undefined)
    await setSimulateCookie(COOKIE_NAMES.DEVICE_TOKEN, deviceToken);

  if (chatToken !== undefined)
    await setSimulateCookie(COOKIE_NAMES.CHAT_TOKEN, chatToken);
  else await deleteSecureCookie(COOKIE_NAMES.CHAT_TOKEN);

  if (storiesToken !== undefined)
    await setSimulateCookie(COOKIE_NAMES.STORIES_TOKEN, storiesToken);
  else await deleteSecureCookie(COOKIE_NAMES.STORIES_TOKEN);

  if (walletToken !== undefined)
    await setSimulateCookie(COOKIE_NAMES.WALLET_TOKEN, walletToken);
  else await deleteSecureCookie(COOKIE_NAMES.WALLET_TOKEN);

  // The comments/OTP identity token. The /simulateUser page already sends this;
  // without it, comments/OTP-linked features won't work in a simulated session.
  if (userIdHash !== undefined)
    await setSimulateCookie(COOKIE_NAMES.USER_ID_HASH, userIdHash);
  else await deleteSecureCookie(COOKIE_NAMES.USER_ID_HASH);

  return NextResponse.json({ success: true });
}
