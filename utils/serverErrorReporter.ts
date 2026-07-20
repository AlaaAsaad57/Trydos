import { COOKIE_NAMES, getCookieServer } from "./cookies/cookie-manager";
import { ReportError } from "./errorReported";
import { readStoredLastPaths } from "./history";

export const LogServerError = async (error?: unknown, pagePath?: string) => {
  try {
    const [
      userData,
      userChat,
      userStories,
      language,
      country,
      userIP,
      last_paths,
      marketToken,
      deviceToken,
      chatToken,
      storiesToken,
      walletToken,
      userIdHash,
    ] = await Promise.all([
      getCookieServer(COOKIE_NAMES.USER_DATA),
      getCookieServer(COOKIE_NAMES.USER_CHAT),
      getCookieServer(COOKIE_NAMES.USER_STORIES),
      getCookieServer("language"),
      getCookieServer("country"),
      getCookieServer("userIP"),
      readStoredLastPaths(),
      getCookieServer(COOKIE_NAMES.MARKET_TOKEN),
      getCookieServer(COOKIE_NAMES.DEVICE_TOKEN),
      getCookieServer(COOKIE_NAMES.CHAT_TOKEN),
      getCookieServer(COOKIE_NAMES.STORIES_TOKEN),
      getCookieServer(COOKIE_NAMES.WALLET_TOKEN),
      getCookieServer(COOKIE_NAMES.USER_ID_HASH),
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
      deviceToken,
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
