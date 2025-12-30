import Spinner from "components/global/Spinner";
import React, { useEffect, useRef, useState } from "react";
import chat from "services/chat";
import { useAppStore } from "store";

function GetMoreChats() {
  const loaderRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const calculateLatestMessageOfOldestChat = (chats) => {
    if (!chats || chats.length === 0) return null;

    // 1. Find the oldest chat (the one with the earliest message)
    const oldestChat = chats.reduce((oldest, current) => {
      // Get the first message's date for each (assuming first is oldest)
      const currentStart = new Date(current.messages[0]?.created_at).getTime();
      const oldestStart = new Date(oldest.messages[0]?.created_at).getTime();

      return currentStart < oldestStart ? current : oldest;
    });

    // 2. Find the newest message in that specific oldest chat
    const newestMessageDate = oldestChat.messages.reduce((newest, msg) => {
      return new Date(msg.created_at) > new Date(newest)
        ? msg.created_at
        : newest;
    }, oldestChat.messages[0].created_at);

    return newestMessageDate;
  };
  const { data } = useAppStore();

  const GetNextChats = async () => {
    let timestamp = calculateLatestMessageOfOldestChat(data);
    try {
      if (loading) return;
      setLoading(true);
      // await chat.getChats(true, 10, 10, timestamp);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          // --- DO SOMETHING MANUALLY HERE ---
          GetNextChats();

          console.log("Threshold reached: Fetching more chats...");
        }
      },
      {
        threshold: 0.5, // Trigger when 10% of the element is visible
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, []);

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
