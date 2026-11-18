import { cookies } from "next/headers";
import {
  LOG_IN_CHAT_ENDPOINT,
  LOG_IN_STORIES_ENDPOINT,
  LOG_IN_COMMENTS_ENDPOINT,
  LOG_IN_WALLET_ENDPOINT,
  QR_LOG_IN_CHAT_ENDPOINT,
  QR_LOG_IN_STORIES_ENDPOINT,
  QR_LOG_IN_COMMENTS_ENDPOINT,
} from "utils/fetch/Endpoints";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import { isGuestName } from "utils/tinyUtils";
import {
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  setSecureCookieJSON,
  sanitizeServiceUser,
  sanitizeWalletUser,
} from "utils/server/tokenManager";
import { logRequest, startTimer } from "reqLogger";

// The sign-in steps that come after the market backend has issued a token
// pair. OTP login (/api/auth/login) and QR login (/api/qr-login/complete) both
// use them, so the two logins store the same cookies in the same way.

// Hard cap on every backend call made here. A backend that never answers used
// to hold the serverless function open until the platform killed it; now the
// call is aborted and reported as a failure instead.
export const LOGIN_TIMEOUT_MS = 10_000;

// Helper to handle sub-service fetches safely
async function safeServiceLogin(
  url: string,
  body: any,
  /** Service role name for the log line: chat, stories, comments, wallet. */
  server: string = "unknown",
  /** The shopper is known here before the User-Data cookie is written. */
  who: { userId?: string; userName?: string } = {},
  /** The route that runs this login, for the error report. */
  route: string = "/api/auth/login",
) {
  const elapsed = startTimer();
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
      signal: AbortSignal.timeout(LOGIN_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorData = await response.json().catch((e) => {
        LogServerError(
          { error: e, type: "login api route", url, body },
          route,
        );
        return {};
      });
      await logRequest({
        server,
        url,
        method: "POST",
        status: response.status,
        durationMs: elapsed(),
        requestBody: body,
        responseBody: errorData,
        ...who,
      });
      return { success: false, status: response.status, data: errorData };
    }

    const data = await response.json();
    await logRequest({
      server,
      url,
      method: "POST",
      status: response.status,
      durationMs: elapsed(),
      requestBody: body,
      responseBody: data,
      ...who,
    });
    return { success: true, status: 200, data };
  } catch (err) {
    // AbortSignal.timeout rejects with a TimeoutError once the cap is reached.
    const timedOut = err?.name === "TimeoutError";
    LogServerError({ error: err, type: "login api route", url, body, timedOut });
    await logRequest({
      server,
      url,
      method: "POST",
      status: timedOut ? 504 : 0,
      durationMs: elapsed(),
      requestBody: body,
      error: err,
      ...who,
    });
    return {
      success: false,
      status: timedOut ? 504 : 503,
      error: timedOut
        ? `the service did not answer within ${LOGIN_TIMEOUT_MS / 1000}s`
        : err.message,
    };
  }
}

/** A result that did not run, for a service this login does not sign in to. */
const SKIPPED = { success: true, status: 200, data: null as any, skipped: true };

type FinishLoginInput = {
  /** The whole answer of the market backend: `{ isSuccessful, message, data }`. */
  marketResponse: any;
  /**
   * How the shopper proved who they are:
   * - `otp`: `data.id_token` from the OTP step. Signs in to the services'
   *   OTP endpoints and to the wallet.
   * - `qr`: `data.qr_id_token` from QR collect. Signs in to the services' QR
   *   endpoints. The wallet is not part of QR login.
   */
  mode: "otp" | "qr";
  /** The name the shopper typed at sign-up, if any. */
  name?: string | null;
  /** The route that runs this login, for the error report. */
  route: string;
};

/**
 * Signs in to chat, stories, comments (and wallet for OTP), stores every token
 * as an HttpOnly cookie, and returns the answer for the browser. The answer
 * holds no token.
 */
export async function finishLogin({
  marketResponse,
  mode,
  name,
  route,
}: FinishLoginInput) {
  const cookiesStore = await cookies();
  const {
    token: MainToken,
    id_token: idToken,
    qr_id_token: qrIdToken,
    user: InventoryUser,
  } = marketResponse.data;
  // Treat backend guest placeholder names ("guest"/"verified_guest") as "no name"
  // so the UI prompts the user to enter a real name. Don't surface them as-is.
  if (InventoryUser && isGuestName(InventoryUser.name)) {
    InventoryUser.name = "";
  }

  // 3. Sub-service Logins (Resilient Path)
  // The shopper for the log lines. The User-Data cookie is not written until
  // step 6, so reqLogger cannot find them on its own yet.
  const who = {
    userId: String(InventoryUser.id),
    userName: String(name || InventoryUser.name || ""),
  };
  const [chatRes, storiesRes, commentRes, walletRes] = await Promise.all(
    mode === "qr"
      ? [
          // QR login: each service checks qr_id_token with the market backend
          // and takes the user from that answer, so the body holds only the
          // token.
          safeServiceLogin(
            process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + QR_LOG_IN_CHAT_ENDPOINT,
            { qr_id_token: qrIdToken },
            "chat",
            who,
            route,
          ),
          safeServiceLogin(
            process.env.STORIES_BACKEND_URL + QR_LOG_IN_STORIES_ENDPOINT,
            { qr_id_token: qrIdToken },
            "stories",
            who,
            route,
          ),
          safeServiceLogin(
            process.env.COMMENT_BACKEND_URL + QR_LOG_IN_COMMENTS_ENDPOINT,
            { qr_id_token: qrIdToken },
            "comments",
            who,
            route,
          ),
          Promise.resolve(SKIPPED),
        ]
      : [
          safeServiceLogin(
            process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + LOG_IN_CHAT_ENDPOINT,
            {
              otp_id_token: String(idToken),
              mobile_phone: String(InventoryUser.phone).replace("+", ""),
              name: String(name || InventoryUser.name),
              original_user_id: String(InventoryUser.id),
            },
            "chat",
            who,
            route,
          ),
          safeServiceLogin(
            process.env.STORIES_BACKEND_URL + LOG_IN_STORIES_ENDPOINT,
            {
              otp_id_token: idToken,
              mobile_phone: InventoryUser.phone,
              original_user_id: String(InventoryUser.id),
            },
            "stories",
            who,
            route,
          ),
          safeServiceLogin(
            process.env.COMMENT_BACKEND_URL + LOG_IN_COMMENTS_ENDPOINT,
            {
              user_id: String(InventoryUser.id),
              phone: String(InventoryUser.phone).replace("+", ""),
              id_token: idToken,
            },
            "comments",
            who,
            route,
          ),
          safeServiceLogin(
            process.env.WALLET_BACKEND_URL + LOG_IN_WALLET_ENDPOINT,
            {
              otp_id_token: idToken,
              mobile_phone: InventoryUser.phone,
              firstName:
                String(name || InventoryUser.name)?.split(" ")?.[0] ?? "",
              lastName:
                String(name || InventoryUser.name)?.split(" ")?.[1] ?? "",
              email: String(InventoryUser.email) ?? "",
              platform: "web",
            },
            "wallet",
            who,
            route,
          ),
        ],
  );

  // The comments service answers with a wrapped envelope — an outer report of
  // how it went, and the credential pair inside `data`:
  //   { isSuccessful, code, message, data: { token, refresh_token, expires_at, user } }
  // It used to answer with a bare `comments_token` at the top level. Read the
  // current shape first and keep the old key as a fallback, so a backend that
  // has not been redeployed yet still signs the shopper in to comments.
  const commentsTokens = {
    token:
      commentRes.data?.data?.token ?? commentRes.data?.comments_token ?? "",
    refreshToken: commentRes.data?.data?.refresh_token ?? "",
  };
  // A 200 that says it failed — the same way the stories service refuses.
  const commentsRefused =
    commentRes.success && commentRes.data?.isSuccessful === false;

  // 4. Collect Failures and Extract Tokens
  const failures = [];
  if (!chatRes.success)
    failures.push({
      endpoint: "CHAT",
      ...chatRes,
      user_id: String(InventoryUser?.id),
      phone: String(InventoryUser.phone),
    });

  if (!storiesRes.success || !storiesRes.data.isSuccessful)
    failures.push({
      endpoint: "STORIES",
      ...storiesRes,
      user_id: String(InventoryUser?.id),
      phone: String(InventoryUser.phone),
    });
  if (!commentRes.success || commentsRefused)
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
        login_mode: mode,
      },
      route,
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
      name: COOKIE_NAMES.CHAT_REFRESH_TOKEN,
      value: chatRes.data?.data?.refresh_token,
    },
    {
      name: COOKIE_NAMES.STORIES_TOKEN,
      value: storiesRes.data?.data?.access_token,
    },
    {
      name: COOKIE_NAMES.STORIES_REFRESH_TOKEN,
      value: storiesRes.data?.data?.refresh_token,
    },
    {
      // The comments session credential — stored under a deliberately opaque
      // cookie name (see COOKIE_NAMES.USER_ID_HASH).
      name: COOKIE_NAMES.USER_ID_HASH,
      value: commentsRefused ? "" : commentsTokens.token,
    },
    {
      name: COOKIE_NAMES.COMMENTS_REFRESH_TOKEN,
      value: commentsRefused ? "" : commentsTokens.refreshToken,
    },
  ];

  // Refresh cookies must NOT get the 48h access-token TTL: the pair they
  // renew is valid ~30 days server-side and the cookie is re-set on every
  // rotation. With the 48h TTL the chat/stories refresh cookie died at the
  // same moment as the token it exists to replace, so the reactive
  // refresh-on-401 flow had nothing left to exchange. Same rule as
  // MARKET_REFRESH_TOKEN below and as the rotation path in authRefresh.ts.
  const REFRESH_COOKIES = new Set<string>([
    COOKIE_NAMES.CHAT_REFRESH_TOKEN,
    COOKIE_NAMES.STORIES_REFRESH_TOKEN,
    COOKIE_NAMES.COMMENTS_REFRESH_TOKEN,
  ]);

  tokensToSet.forEach((token) => {
    if (token.value) {
      cookiesStore.set({
        name: token.name,
        value: token.value,
        ...(REFRESH_COOKIES.has(token.name)
          ? REFRESH_COOKIE_OPTIONS
          : SECURE_COOKIE_OPTIONS),
      });
    }
  });

  // The market backend returns a NEW token pair — always replace BOTH stored
  // tokens; the refresh cookie gets its own 30d rotating TTL.
  if (marketResponse.data.refresh_token) {
    cookiesStore.set({
      name: COOKIE_NAMES.MARKET_REFRESH_TOKEN,
      value: marketResponse.data.refresh_token,
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
      already_exists: marketResponse.data.already_exists,
      is_verified: true,
      is_phone_verified: 1,
      expires_at: marketResponse.data.expires_at,
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
  return {
    ...marketResponse,
    data: {
      ...marketResponse.data,
      token: undefined, // Strip market token from response
      refresh_token: undefined, // Never expose the refresh token (NFR-3)
      // The one-time credentials that signed the shopper in to the
      // sub-services above. Their work is done here; no page script needs
      // them (readiness A1-9).
      id_token: undefined,
      qr_id_token: undefined,
    },
    ChatUser: sanitizeServiceUser(chatUserData),
    StoriesUser: sanitizeServiceUser(storiesUserData),
    is_failed: failures?.length > 0 ? failures : undefined,
    WalletUser: sanitizeWalletUser(walletUserData),
    original_user_id: String(InventoryUser.id),
  };
}
