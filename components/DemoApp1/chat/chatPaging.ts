import { isPinned, nextCursor } from "components/Chat/components/GetMoreChats";
import chatService, { CALLS_PAGE_SIZE } from "services/chat";
import { useAppStore } from "store";
import { getPage } from "store/chat/actions";
import { sortMessages } from "store/chat/messageOrder";
import { findChannel } from "./chatActions";

/**
 * Loading the chats, the calls and the messages a page at a time. Stage 6,
 * step 4.
 *
 * All use the old chat's calls and its rules for "there is no more":
 *  - chats: GetMoreChats.tsx (`getChats` from the cursor `nextCursor`, the
 *    pinned chats left out of it; the end is a page with no new chat);
 *  - messages: ConversationContainer.tsx (`getPage` before the oldest
 *    loaded message; the end is an empty page, which `setPageData` marks by
 *    setting `mid` to null).
 *
 * Each answers "more", "done" (the end is reached) or "again" (nothing was
 * loaded, for example a failed call: the next try may work).
 */
export type PageResult = "more" | "done" | "again";

const sameId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b);

/** Loads the chat list's next page of chats. */
export async function loadMoreChats(): Promise<PageResult> {
  const { data, userChat } = useAppStore.getState();
  const me = parseInt(String(userChat?.id));
  const cursor = nextCursor((data ?? []).filter((c) => !isPinned(c, me)));
  // Nothing usable is loaded yet: asking with no cursor gives page one again.
  if (!cursor) return "again";
  // `getChats` puts the page in the store, and answers nothing when it failed.
  const page: { id: unknown }[] | undefined = await chatService.getChats(true, 10, 10, cursor);
  if (!page) return "again";
  // The backend repeats the pinned chats on every page, and may repeat one
  // row at the page edge: only a chat not held before means there is more.
  return page.some((c) => !(data ?? []).some((d) => sameId(d.id, c.id))) ? "more" : "done";
}

/**
 * Loads the page of calls before the oldest loaded one (the old CallList's
 * rule). A short page is the last one, and so is a page with no call we do not
 * hold: without that, the end of the log would ask again on every scroll.
 */
export async function loadOlderCalls(): Promise<PageResult> {
  const calls: { id: unknown; created_at: string }[] = useAppStore.getState().calls ?? [];
  const oldest = calls.reduce<(typeof calls)[number] | null>(
    (first, call) => (!first || new Date(call.created_at) < new Date(first.created_at) ? call : first),
    null,
  );
  if (!oldest) return "done";
  const page: { id: unknown }[] | null = await chatService.getCalls(oldest.id as string);
  if (!Array.isArray(page)) return "again";
  const fresh = page.some((c) => !calls.some((held) => sameId(held.id, c.id)));
  return page.length < CALLS_PAGE_SIZE || !fresh ? "done" : "more";
}

/** Loads the page of messages before the oldest loaded one of this chat. */
export async function loadOlderMessages(chatId: string): Promise<PageResult> {
  // A new chat (`ch-<user id>`) has nothing on the chat backend yet.
  if (chatId.startsWith("ch-")) return "done";
  const oldest = sortMessages(findChannel(chatId)?.messages ?? [])[0];
  if (!oldest?.id) return "done";
  const { setMessagesPage } = useAppStore.getState();
  setMessagesPage(oldest.id);
  await getPage(chatId, oldest.id);
  // `setPageData` sets `mid` to null for an empty page. A failed call leaves
  // it as it was.
  return useAppStore.getState().mid === null ? "done" : "more";
}
