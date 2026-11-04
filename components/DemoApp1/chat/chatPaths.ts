/**
 * The chat's own URLs (S3-3; the chat id in the query, owner's choice on
 * 2026-11-04): `/[lang]/chat` for the list, and `/[lang]/chat/conversation`,
 * `/chat/contact` and `/chat/call` with `?id=<chat id>`, so a reload, a push
 * link and the order page open the right chat.
 */

/** The query key that carries the chat on screen. */
export const CHAT_ID_PARAM = "id";

/** The chat screens: the list and the three screens of one chat. */
export const CHAT_SCREENS = ["chat", "chat/conversation", "chat/contact", "chat/call"] as const;
export type ChatScreen = (typeof CHAT_SCREENS)[number];

/** True for a chat screen's key. */
export const isChatScreen = (screen: string | null | undefined): screen is ChatScreen =>
  !!screen && (CHAT_SCREENS as readonly string[]).includes(screen);

/** The screens that show one chat, so their URL carries its id. */
export const isOneChatScreen = (screen: string | null | undefined) => isChatScreen(screen) && screen !== "chat";

/** A chat URL under a locale segment such as `sy-en`, with the chat's id for the screens of one chat. */
export function chatHref(lang: string, screen: ChatScreen = "chat", id?: string | null): string {
  const path = `/${lang}/${screen}`;
  return id && screen !== "chat" ? `${path}?${CHAT_ID_PARAM}=${encodeURIComponent(id)}` : path;
}

/** The chat id in a query string ("?id=12"), or null. */
export function chatIdFrom(search: string): string | null {
  const id = new URLSearchParams(search).get(CHAT_ID_PARAM);
  return id ? id : null;
}
