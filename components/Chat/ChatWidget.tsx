import { useEffect } from "react";
import ConversationContainer from "./pages/ConversationContainer";
import { useAppStore } from "store";
import "styles/chatcomponent.css";
import "styles/chat.css";
import "styles/ChatWindow.css";
import "styles/chatstyles.css";
export default function ChatWidget({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    activeChat,
    openChat,
    setMain,
    first,
    fetch: loading,
  } = useAppStore();
  useEffect(() => {
    setTimeout(() => {
      if (document?.querySelector("#scroled"))
        document
          ?.querySelector("#scroled")
          ?.scrollIntoView({ block: "end", inline: "end" });
    }, 1000);
  }, []);
  useEffect(() => {
    return () => {
      setTimeout(() => {
        const { isNavigating } = useAppStore.getState();
        if (isNavigating) return;

        // Read the location at FIRE time, not at cleanup time — otherwise a
        // navigation during the 600ms delay would let this re-push the stale
        // (pre-navigation) URL and, via Next's patched history.pushState,
        // soft-navigate the user back. Only act if the param is still present.
        const cleanupUrl = new URL(window.location.href);
        if (!cleanupUrl.searchParams.has("chat_id")) return;

        cleanupUrl.searchParams.delete("chat_id");
        window.history.pushState({}, "", cleanupUrl.toString());
      }, 600);
    };
  }, []);
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={(e) => {
          {
            onClose();
            setMain("main");
            openChat(null);
          }
        }}
        className={`fixed inset-0 w-screen h-screen bg-black/30 z-9999999999998 ${"open"}`}
      ></div>
      <div className="fixed right-0 top-0 max-w-[430px] w-screen h-[calc(100vh-150px)] bg-white z-999999999999">
        <ConversationContainer
          isPrivate={activeChat?.order_chat_participant_id}
          closeWidget={onClose}
          ViewedScreen={"chat"}
          setSearch={() => {}}
          loading={loading}
          first={first}
        />
      </div>
    </>
  );
}
