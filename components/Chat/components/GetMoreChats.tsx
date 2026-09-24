import Spinner from "components/global/Spinner";
import { useEffect, useRef, useState, useCallback } from "react";
import chat from "services/chat";
import { useAppStore } from "store";
import { getUserChat, LogError } from "utils/functions";

/**
 * A pinned chat is not part of the page sequence.
 *
 * The backend keeps pinned chats out of `channels` and repeats them in
 * `pinned_channels` on every page, so their `updated_at` says nothing about
 * where the next page starts. Pinning the oldest chat and then letting it into
 * the cursor drags it past every chat still waiting to load — measured on the
 * test account, that lost a chat in the middle of the list.
 */
const isPinned = (chat, userId) =>
  parseInt(
    chat?.channel_members?.find((m) => parseInt(m?.user_id) === userId)?.pin,
  ) === 1;

/**
 * Where the next page starts.
 *
 * The chat backend answers `/channels/my_channels` ordered by the channel's
 * `updated_at`, newest first. Its `timestamp` argument means
 * `updated_at < timestamp` — the row sitting at that exact time is left out.
 * So the next page begins at the smallest `updated_at` we already hold.
 *
 * Two earlier readings of this were wrong, and both were measured against the
 * real backend before this was written.
 *
 * The code here used to find the chat with the earliest `messages[0]
 * .created_at` and then send *that chat's* `updated_at` — two unrelated
 * values. `setChats` reverses the messages the server sent, so `messages[0]`
 * is the oldest message loaded, and the chat holding it is not the chat at the
 * end of the list. On a real account it picked the chat with the **newest**
 * `updated_at` of all five, so page two asked for "older than the newest row"
 * and the server replied with rows already on screen.
 *
 * The newest message time is not right either. A channel can carry messages
 * newer than its own `updated_at` — one on the test account is 8 days apart.
 * That cursor lands above the real page edge, so the server repeats rows and
 * the walk needs an extra request to reach the same place.
 */
const nextCursor = (chats) => {
  let oldestAt = null;
  let oldestTime = Infinity;
  for (const c of chats ?? []) {
    const at = c?.updated_at;
    if (!at) continue;
    const time = new Date(at).getTime();
    // A date the browser cannot read gives NaN, and every comparison with NaN
    // is false. Skipping it keeps one bad row from deciding the cursor.
    if (!Number.isFinite(time)) continue;
    if (time < oldestTime) {
      oldestTime = time;
      oldestAt = at;
    }
  }
  return oldestAt;
};

function GetMoreChats({ hasMore, setHasMore }) {
  const loaderRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // --- Instant locks to prevent race conditions ---
  const isFetching = useRef(false);
  const isDone = useRef(false);

  const { data } = useAppStore();

  const GetNextChats = useCallback(async () => {
    // Check the Ref instead of state for the most up-to-date "lock"
    if (isFetching.current || isDone.current) return;

    // Only the paged chats decide where the next page starts — see `isPinned`.
    // A user id that cannot be read leaves every chat in, which is how this
    // behaved before, rather than filtering the list down to nothing.
    const userId = parseInt(getUserChat()?.id);
    const timestamp = nextCursor(data.filter((c) => !isPinned(c, userId)));

    // Nothing usable is loaded yet. Asking without a cursor would just fetch
    // page one again.
    if (!timestamp) return;

    try {
      isFetching.current = true; // Lock immediately
      setLoading(true);

      const page = await chat.getChats(true, 10, 10, timestamp);

      // `getChats` returns nothing when the request failed — it logs the error
      // and swallows it — and also when the user is not loaded yet. Neither is
      // the end of the list. Leave the door open so the next scroll tries
      // again. Reading this as "no more chats" is how a single flaky request
      // used to stop paging for the rest of the session.
      if (!page) return;

      // The store already holds this page: `getChats` calls `setChats` before
      // it returns. `data` is still the list from before the fetch, so the
      // only honest question is whether anything new arrived.
      //
      // The old check asked whether row 0 was already known, which stops far
      // too early. The backend repeats every pinned channel on each page, and
      // it may repeat one ordinary row at the page edge. On a four-chat
      // account that check lost the last chat and never fetched it again.
      const broughtSomethingNew = page.some(
        (incoming) => !data.some((existing) => existing.id === incoming.id),
      );

      if (!broughtSomethingNew) {
        isDone.current = true; // Permanent lock
        setHasMore(false);
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "get more chats (pagination) - chat widget",
      });
    } finally {
      isFetching.current = false; // Unlock
      setLoading(false);
    }
  }, [data, setHasMore]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          GetNextChats();
        }
      },
      { threshold: 0.1 }, // Lower threshold is often more reliable for loaders
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [GetNextChats]);

  // If we know there's no more data, remove the spinner from DOM entirely
  if (data.length < 10 || !hasMore) return null;

  return (
    <div
      ref={loaderRef}
      className="w-full h-[50px] flex items-center justify-center"
    >
      <Spinner />
    </div>
  );
}

export default GetMoreChats;
