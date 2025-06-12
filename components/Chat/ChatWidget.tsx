import React, { useEffect } from "react";

import { Channel } from "models/Genaral/Channel";

import ConversationContainer from "./pages/ConversationContainer";
import { useAppStore } from "store";

export default function ChatWidget({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { activeChat, openChat, setMain, first } = useAppStore();
  useEffect(() => {
    setTimeout(() => {
      if (document?.querySelector("#scroled"))
        document
          ?.querySelector("#scroled")
          ?.scrollIntoView({ block: "end", inline: "end" });
    }, 1000);
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
        className={`lang-modalDisable ${"open"}`}
      ></div>
      <div className="fixed right-0 top-0 max-w-[430px] w-screen h-[calc(100vh-150px)] bg-white z-[999999999999]">
        <ConversationContainer
          isPrivate={true}
          closeWidget={onClose}
          ViewedScreen={"chat"}
          active={activeChat}
          setSearch={() => {}}
          loading={false}
          first={first}
        />
      </div>
    </>
  );
}
