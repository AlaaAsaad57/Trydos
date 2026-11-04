import { redirect } from "next/navigation";
import { lang as langParam } from "next/root-params";
import { COOKIE_NAMES, type UserData } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { loginHref } from "utils/loginPath";
import { CHAT_ID_PARAM } from "components/DemoApp1/chat/chatPaths";

/**
 * The chat pages' guest check, on the server (UI-MIGRATION-PLAN.md, "The screen
 * mount": the guest check is in each screen's page, not in the mount). A
 * guest — no `User-Data` cookie, or the guest phone "0" — goes to the login
 * page with this chat page as the way back, as the chat tab does
 * (openChatFromTab.ts). A shopper with a phone but no chat account gets
 * through: the client asks them to confirm the phone, which a server cannot.
 */
export async function sendGuestToLogin(path: string, chatId?: string | string[]) {
  const user = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
  if (user?.phone && user.phone !== "0") return;
  const lang = await langParam();
  const id = typeof chatId === "string" && chatId ? `?${CHAT_ID_PARAM}=${encodeURIComponent(chatId)}` : "";
  redirect(loginHref(lang, `/${lang}/${path}${id}`));
}
