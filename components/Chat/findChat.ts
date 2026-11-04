// Find one chat by id: in the store, or else on the chat backend's pages.
//
// The chat list loads its chats a page at a time, so a chat named by a
// reminder or by a URL (`/chat/conversation?id=12`) is often not in the
// store yet. The chat backend has no call for one chat by id, so its pages
// are walked until the chat turns up. Moved here from openMessageInChat.ts
// so the new chat screens can use it without the old chat list.
import { nextCursor } from "components/Chat/components/GetMoreChats";
import { GetMyChannelsPage } from "store/chat/actions";
import { useAppStore } from "store";

/** Chats per page, and how many pages to walk before giving up: 500 chats. */
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

const sameId = (a: any, b: any) =>
  a != null && b != null && String(a) === String(b);

/** The chat in the store, or else from the chat backend's pages. */
export async function findChat(channelId: string | number) {
  const { data, archivedChats } = useAppStore.getState();
  const loaded = [...data, ...archivedChats].find((c: any) =>
    sameId(c.id, channelId),
  );
  if (loaded) return loaded;

  let timestamp: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await GetMyChannelsPage(timestamp, PAGE_SIZE);
    if (!result) return null;
    const found: any = [...result.pinned, ...result.channels].find((c: any) =>
      sameId(c.id, channelId),
    );
    // The backend sends the newest message first; the store keeps them
    // oldest first (see `setChats`).
    if (found) {
      return { ...found, messages: [...(found.messages || [])].reverse() };
    }
    if (result.channels.length < PAGE_SIZE) return null;
    const next = nextCursor(result.channels);
    if (!next || next === timestamp) return null;
    timestamp = next;
  }
  return null;
}
