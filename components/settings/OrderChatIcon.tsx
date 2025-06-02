import Spinner from "components/global/Spinner";
import React, { useState } from "react";
import auth from "services/auth";
import { AxiosPost } from "utils/AxiosApi";
import ChatIcon from "public/svg/ChatIcon.svg";
import ChatWidget from "components/Chat/ChatWidget";
function OrderChatIcon(id) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGettingChat, setIsGettingChat] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const getChatWithShipping = async () => {
    setIsGettingChat(true);
    try {
      let res = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          "/api/v1/order-chat-participants/get-recipient",
        body: {
          original_user_id: auth.UserID(),
          order_id: id?.id,
        },
        title: "Get Chat with Deleivery",
      });
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 0;
      document.querySelector("#OrderDetails").scrollTop = 0;
      document.querySelector("#OrderDetails").classList.add("overflow-hidden");
      document.querySelector("#OrderDetails").classList.remove("overflow-auto");
      console.log(res);
      setChatInfo(res);
      setIsChatOpen(true);
      setIsGettingChat(false);
    } catch (error) {
      setIsGettingChat(false);
    }
  };
  return (
    <>
      {id &&
        (isGettingChat ? (
          <span className="w-[20px] h-[20px] flex justify-center items-center mx-[10px]">
            <Spinner />
          </span>
        ) : (
          <ChatIcon
            className="mx-[10px] cursor-pointer"
            onClick={() => {
              getChatWithShipping();
            }}
          />
        ))}
      {
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => {
            document.documentElement.style.overflow = "auto";

            document
              .querySelector("#OrderDetails")
              .classList.remove("overflow-hidden");
            document
              .querySelector("#OrderDetails")
              .classList.add("overflow-auto");
            setIsChatOpen(false);
          }}
        />
      }
    </>
  );
}

export default OrderChatIcon;
