import { COOKIE_NAMES, getCookieServer } from "./cookies/cookie-manager";
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

  // Build absolute URL from headers + provided path (server-safe)

  const baseError: Record<string, any> =
    typeof error === "object" && error !== null
      ? (error as Record<string, any>)
      : error !== undefined
      ? { message: String(error) }
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

  await storeError(Error_Object);
};
