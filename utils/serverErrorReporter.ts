import { COOKIE_NAMES, deserialize } from "./cookies/cookie-manager";
import { ReportError } from "./errorReported";
import { readStoredLastPaths } from "./history";

// Cookie reads need the framework's request store, which exists only on the
// server — but this module cannot import the server reader
// (utils/cookies/server-cookie-manager), statically OR dynamically.
//
// It sits in the client SSR graph: services/home.ts is "use client" and calls
// LogServerError, and services/auth.ts reaches here through utils/fetchData.
// Any import of a next/headers module from that graph fails the build, and a
// dynamic import does not help — the bundler follows it just the same (proved
// by a build, import trace #4).
//
// So the request store is reached through a bare `require`, which the bundler
// does not follow, exactly as utils/history.ts does for the same reason. The
// cost is real and accepted here: if the require fails, every value below is
// null and the report loses its context. That is fine for best-effort error
// reporting, and nowhere else — every other caller in the app uses the real
// module and its tests.
//
// The proper fix is to stop calling LogServerError from client code. That is a
// bigger change than this one, and its own ticket.
async function readServerCookies(names: string[]): Promise<any[]> {
  const nothing = names.map(() => null);
  if (typeof window !== "undefined") return nothing;

  try {
    const { cookies } = require("next/headers");
    const store = await cookies();
    return names.map((name) => {
      try {
        const raw = store.get(name)?.value;
        return raw ? deserialize(decodeURIComponent(raw)) : null;
      } catch {
        // One unreadable cookie must not cost us the other ten.
        return null;
      }
    });
  } catch {
    return nothing;
  }
}

export const LogServerError = async (error?: unknown, pagePath?: string) => {
  try {
    const [
      [
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
      ],
      last_paths,
    ] = await Promise.all([
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
