import { NextResponse } from "next/server";
import { getSecureCookie } from "utils/server/tokenManager";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

export const dynamic = "force-dynamic";

// Returns the wallet token for the RDB widget
// This is a controlled exception: the RDB component requires
// a raw token. Access is restricted to authenticated users.
export async function GET() {
  const token = await getSecureCookie<string>(COOKIE_NAMES.WALLET_TOKEN);
  if (!token) {
    return NextResponse.json({ token: null }, { status: 401 });
  }
  return NextResponse.json({ token });
}
