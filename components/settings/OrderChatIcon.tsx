import Spinner from "components/global/Spinner";
import React, { useState } from "react";
import auth from "services/auth";
import { AxiosPost } from "utils/AxiosApi";
import ChatIcon from "public/svg/ChatIcon.svg";
import ChatWidget from "components/Chat/ChatWidget";
import { Channel } from "models/Genaral/Channel";
import { useAppStore } from "store";
import { getUserChat } from "utils/functions";
import { OrderChatIconPropsType } from "models/componentType/OrderChatIconPropsType";

function OrderChatIcon({
  id,
  setChatInfo,
  setIsChatOpen,
  isChatOpen,
}: OrderChatIconPropsType) {
  const { openChat } = useAppStore();

  const [isGettingChat, setIsGettingChat] = useState(false);

  const getChatWithShipping = async () => {
    setIsGettingChat(true);
    try {
      let res = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/order-chat-participants/get-recipient",
        body: {
          original_user_id: auth.UserID(),
          order_id: id,
        },
        token: JSON.parse(localStorage.getItem("USER-CHAT"))?.access_token,
        title: "Get Chat with Deleivery",
      });
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 0;
      document.querySelector("#OrderDetails").scrollTop = 0;
      document.querySelector("#OrderDetails").classList.add("overflow-hidden");
      document.querySelector("#OrderDetails").classList.remove("overflow-auto");
      if (res.channel) {
        setChatInfo({
          ...res.channel,
          channel_members: [
            {
              user: getUserChat(),
              ...res.channel.channel_members.find(
                (s) => s.user_id === getUserChat().id
              ),
            },
            {
              user: {
                id: res.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
              ...res.channel.channel_members.find(
                (s) => s.user_id !== getUserChat().id
              ),
            },
          ],
        });
        openChat({
          ...res.channel,
          channel_members: [
            {
              user: getUserChat(),
              ...res.channel.channel_members.find(
                (s) => s.user_id === getUserChat().id
              ),
            },
            {
              user: {
                id: res.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
              ...res.channel.channel_members.find(
                (s) => s.user_id !== getUserChat().id
              ),
            },
          ],
          messages:
            res.channel.messages?.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            ) || [],
        });
      } else {
        setChatInfo({
          channel_members: [
            {
              id: getUserChat()?.id,
              user: getUserChat(),
              user_id: getUserChat().id,
            },
            {
              id: res.recipient.id,
              user_id: res.recipient.id,
              user: {
                id: res.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
            },
          ],
          channel_name: "Deleivery Worker",
          photo_path: null,
          messages: [],
          id: "ch-" + res.recipient.id,
          mid: "ch-" + res.recipient.id,
        });
        openChat({
          channel_members: [
            {
              id: getUserChat()?.id,
              user: getUserChat(),
              user_id: getUserChat().id,
            },
            {
              id: res.recipient.id,
              user_id: res.recipient.id,
              user: {
                id: res.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
            },
          ],
          channel_name: "Deleivery Worker",
          photo_path: null,
          messages: [],
          id: "ch-" + res.recipient.id,
          mid: "ch-" + res.recipient.id,
        });
      }
      setIsChatOpen(true);
      setIsGettingChat(false);
    } catch (error) {
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 0;
      document.querySelector("#OrderDetails").scrollTop = 0;
      document.querySelector("#OrderDetails").classList.add("overflow-hidden");
      document.querySelector("#OrderDetails").classList.remove("overflow-auto");

      setIsChatOpen(true);
      setIsGettingChat(false);
      setIsGettingChat(false);
    }
  };
  return (
    <>
      {id && (
        <button
          type="button"
          className="flex items-center gap-2 mx-[10px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => {
            if (!isGettingChat) getChatWithShipping();
          }}
        >
          {isGettingChat ? (
            <span className="w-[20px] h-[20px] flex justify-center items-center mx-[10px]">
              <Spinner />
            </span>
          ) : (
            <>
              <ChatIcon className="w-5 h-5" />
              <span className="regular text-[12px]   font-medium">
                Chat with delivery worker
              </span>
            </>
          )}
        </button>
      )}
    </>
  );
}

export default OrderChatIcon;
