import { after, NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildProxyHeaders,
  deleteSecureCookie,
  getServerBaseUrl,
  SECURE_COOKIE_NAMES,
} from "utils/server/tokenManager";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { REMOVE_FCM_TOKEN_URL } from "utils/endpointConfig";
import { LogServerError } from "utils/serverErrorReporter";

// How long the logout guard stays armed if nothing clears it first. The normal
// path clears it on the immediate post-logout reload (see `proxy.ts`); this TTL
// is only a backstop so a missed reload can never strand the marker.
const LOGOUT_GUARD_TTL_SECONDS = 30;

// Upper bound on the deferred detach call. It runs after the response, but the
// serverless invocation must not be held open by a stalled backend.
const FCM_DETACH_TIMEOUT_MS = 5000;

/**
 * Prepare the call that detaches this device's FCM registration from the
 * account, to be run *after* the response is flushed.
 *
 * The device must be detached or the next person on it keeps receiving the
 * previous user's push notifications. This used to be a client request awaited
 * *before* the logout (the cookies it needs were still valid then), which put a
 * chat-backend round trip on the critical path and made every logout as slow as
 * the slowest network. Doing it here instead lets the response — and therefore
 * the logout — return immediately, and the call can no longer be killed by the
 * page reload or by `abortInFlightForLogout()`.
 *
 * MUST be called BEFORE the auth cookies are deleted: the chat Bearer token is
 * read from them here, so afterwards there is nothing left to authenticate
 * with. Returns `null` when there is nothing to detach.
 */
const prepareFcmDetach = async (
  request: NextRequest,
  fcmToken: string,
): Promise<(() => Promise<void>) | null> => {
  try {
    const baseUrl = await getServerBaseUrl("chat", REMOVE_FCM_TOKEN_URL);
    if (!baseUrl) return null;

    // Locale only decides the language of a response body nobody reads here, so
    // the defaults are harmless when the caller sends no locale headers.
    const headers = await buildProxyHeaders(
      "chat",
      request.headers.get("x-country") || "sy",
      request.headers.get("x-language") || "en",
    );
    // No chat session on this device — there is no registration to detach.
    if (!headers.Authorization) return null;

    return async () => {
      try {
        await fetch(baseUrl + REMOVE_FCM_TOKEN_URL, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
          credentials: "omit",
          cache: "no-store",
          signal: AbortSignal.timeout(FCM_DETACH_TIMEOUT_MS),
        });
      } catch (error) {
        // Best-effort: the session is already gone either way, and the client
        // has long since reloaded. Report it, never throw.
        LogServerError({ error, type: "auth/logout fcm detach failed" });
      }
    };
  } catch (error) {
    LogServerError({ error, type: "auth/logout fcm detach prepare failed" });
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Body is optional: `clearAllUserData` sends the device's FCM token when it
    // has one; older callers and other logout paths send nothing at all.
    const fcmToken = await request
      .json()
      .then((body) => (typeof body?.fcmToken === "string" ? body.fcmToken : ""))
      .catch(() => "");

    // Prepared while the cookies are still readable, run after the response.
    const detachFcm = fcmToken
      ? await prepareFcmDetach(request, fcmToken)
      : null;

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

    if (detachFcm) after(detachFcm);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    LogServerError({ error, type: "auth/logout route error" });
    return NextResponse.json({ message: "Failed to logout" }, { status: 500 });
  }
}
