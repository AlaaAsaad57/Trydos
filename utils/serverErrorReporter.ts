import { COOKIE_NAMES, deserialize } from "./cookies/cookie-manager";
import { readServerCookies } from "./cookies/server-cookie-fallback";
import { ReportError } from "./errorReported";
import { readStoredLastPaths } from "./history";

// This module cannot import the ordinary server cookie reader
// (utils/cookies/server-cookie-manager), statically OR dynamically: it sits in
// the client SSR graph — services/home.ts is "use client" and calls
// LogServerError, and services/auth.ts reaches here through utils/fetchData.
// See ./cookies/server-cookie-fallback for what it uses instead and why.

/** Turn a stored cookie back into the value it was written from. */
function decodeStored(raw: string | null) {
  if (!raw) return null;
  try {
    return deserialize(decodeURIComponent(raw));
  } catch {
    // One unreadable cookie must not cost us the other ten.
    return null;
  }
}

export const LogServerError = async (error?: unknown, pagePath?: string) => {
  try {
    const [stored, last_paths] = await Promise.all([
      readServerCookies([
        COOKIE_NAMES.USER_DATA,
        COOKIE_NAMES.USER_CHAT,
        COOKIE_NAMES.USER_STORIES,
        "language",
        "country",
        "userIP",
        COOKIE_NAMES.MARKET_TOKEN,
        COOKIE_NAMES.CHAT_TOKEN,
        COOKIE_NAMES.STORIES_TOKEN,
        COOKIE_NAMES.WALLET_TOKEN,
        COOKIE_NAMES.USER_ID_HASH,
      ]),
      readStoredLastPaths(),
    ]);

    const [
      userData,
      userChat,
      userStories,
      language,
      country,
      userIP,
      marketToken,
      chatToken,
      storiesToken,
      walletToken,
      userIdHash,
    ] = stored.map(decodeStored);
    const serializedError =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;

    const baseError: Record<string, any> =
      typeof serializedError === "object" && serializedError !== null
        ? (serializedError as Record<string, any>)
        : serializedError !== undefined
          ? { message: String(serializedError) }
          : {};

    const Error_Object = {
      ...baseError,
      userChat,
      userData,
      userStories,
      language,
      country,
      userIP,
      last_request: "server_error",
      current_url: pagePath,
      last_paths: last_paths,
      timestamp: new Date().toISOString(),
      marketToken,
      chatToken,
      storiesToken,
      walletToken,
      userIdHash,
    };

    ReportError(Error_Object);
    await storeErrorServer(Error_Object);
  } catch (error) {
    console.error("Failed to log server error:", error);
  }
};

// Server-side error-log POST, loaded lazily from a server-only module so the
// backend base-URL reference never enters the client bundle — this file is
// imported by client code (services/home.ts is "use client").
async function storeErrorServer(error: unknown) {
  if (typeof window !== "undefined") return;
  try {
    const { postServerErrorLog } = await import("./server/mobileErrorLog");
    await postServerErrorLog(error);
  } catch {
    // ignore - logging must be best-effort
  }
}
