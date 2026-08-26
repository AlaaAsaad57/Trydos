import Spinner from "components/global/Spinner";
import { useEffect, useRef, useState, useCallback } from "react";
import chat from "services/chat";
import { useAppStore } from "store";
import { LogError } from "utils/functions";

function GetMoreChats({ hasMore, setHasMore }) {
  const loaderRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // --- NEW: Instant locks to prevent race conditions ---
  const isFetching = useRef(false);
  const isDone = useRef(false);

  const { data } = useAppStore();

  const calculateLatestMessageOfOldestChat = (chats) => {
    if (!chats || chats.length === 0) return null;
    const oldestChat = chats.reduce((oldest, current) => {
      const currentStart = new Date(current.messages[0]?.created_at).getTime();
      const oldestStart = new Date(oldest.messages[0]?.created_at).getTime();
      return currentStart < oldestStart ? current : oldest;
    });
    return oldestChat?.updated_at;
  };

  const GetNextChats = useCallback(async () => {
    // Check the Ref instead of state for the most up-to-date "lock"
    if (isFetching.current || isDone.current) return;

    const timestamp = calculateLatestMessageOfOldestChat(data);

    try {
      isFetching.current = true; // Lock immediately
      setLoading(true);

      const chat_arrays = await chat.getChats(true, 10, 10, timestamp);

      // 1. Check if response is empty
      if (!chat_arrays || chat_arrays.length === 0) {
        isDone.current = true;
        setHasMore(false);
        return;
      }

      // 2. Check for duplicates (assuming ID comparison)
      const isDuplicate = data.some(
        (existingChat) => existingChat.id === chat_arrays[0].id,
      );

      if (isDuplicate) {
        isDone.current = true; // Permanent lock
        setHasMore(false);
        return;
      }

      // 3. If data is valid, you'd update your store here
      // updateStore(chat_arrays);
    } catch (error) {
      LogError({
        error: error,
        scenario: "get more chats (pagination) - chat widget",
      });
    } finally {
      isFetching.current = false; // Unlock
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          GetNextChats();
        }
      },
      { threshold: 0.1 }, // Lower threshold is often more reliable for loaders
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
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
