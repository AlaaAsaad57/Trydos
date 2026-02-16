import { COOKIE_NAMES, getCookieServer } from "./cookies/cookie-manager";
import { ReportError } from "./errorReported";
import { storeError } from "./functions";
import { readStoredLastPaths } from "./history";

export const LogServerError = async (error?: unknown, pagePath?: string) => {
  const [
    userData,
    userChat,
    userStories,
    language,
    country,
    userIP,
    last_paths,
  ] = await Promise.all([
    getCookieServer(COOKIE_NAMES.USER_DATA),
    getCookieServer(COOKIE_NAMES.USER_CHAT),
    getCookieServer(COOKIE_NAMES.USER_STORIES),
    getCookieServer("language"),
    getCookieServer("country"),
    getCookieServer("userIP"),
    readStoredLastPaths(),
  ]);
  const serializedError =
    error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
  // Build absolute URL from headers + provided path (server-safe)

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
  };

  ReportError(Error_Object);
  await storeError(Error_Object);
};
