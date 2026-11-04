import { redirect } from "next/navigation";
import { lang as langParam } from "next/root-params";
import { COOKIE_NAMES, type UserData } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { isValidPhone } from "utils/phone";
import { loginHref } from "utils/loginPath";

/**
 * The page of a path that a new screen owns (components/DemoApp1/
 * appScreenPaths.ts). The screen mount draws the screen, so the page renders
 * nothing. It only sends a guest to the login first (S4-4 in
 * UI-MIGRATION-PLAN.md), with this path as the way back (A-20).
 *
 * The check is here, on the server, and not in the mount: the store may not
 * hold the profile yet on the first render, and the cookie is always here.
 * It runs in the page, not in generateMetadata, where Next 16 ignores a
 * redirect for browsers.
 *
 * `path` is the URL after the locale part, for example `settings/profile`.
 */
export async function signedInScreenPage(path: string): Promise<null> {
  const lang = await langParam();
  const user = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
  if (!isValidPhone(user?.phone)) redirect(loginHref(lang, `/${lang}/${path}`));
  return null;
}
