import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteSecureCookie,
  SECURE_COOKIE_NAMES,
} from "utils/server/tokenManager";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

// How long the logout guard stays armed if nothing clears it first. The normal
// path clears it on the immediate post-logout reload (see `proxy.ts`); this TTL
// is only a backstop so a missed reload can never strand the marker.
const LOGOUT_GUARD_TTL_SECONDS = 30;

export async function POST() {
  try {
    // Delete every secure cookie
    await Promise.all(
      SECURE_COOKIE_NAMES.map((name) => deleteSecureCookie(name)),
    );

    // Arm the logout guard AFTER the deletes (so it isn't wiped) and only here.
    // While set, every server-side 401 → guest re-register path refuses to mint
    // a token or write an identity cookie, so a pending authed request that
    // 401s during/after this logout can't resurrect the just-cleared session.
    const cookieStore = await cookies();
    cookieStore.set({
      name: COOKIE_NAMES.LOGOUT_GUARD,
      value: "1",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: LOGOUT_GUARD_TTL_SECONDS,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    LogServerError({ error, type: "auth/logout route error" });
    return NextResponse.json({ message: "Failed to logout" }, { status: 500 });
  }
}
