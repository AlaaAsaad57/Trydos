import React, { useState } from "react";
import BackIcon from "public/svg/listing/backIcon.svg";
import OptionsIcon from "public/svg/OptionsIcon.svg";
import { translateFunction } from "utils/functions";
import ChatIcon from "public/svg/ChatIcon.svg";
import ChatWidget from "components/Chat/ChatWidget";
import Spinner from "components/global/Spinner";
import { AxiosPost } from "utils/AxiosApi";
import auth from "services/auth";

function SettingTopBar({
  Save,
  hasOptions,
  screenName,
  goBack,
  Icon,
  DataCy,
  hasChat = false,
}: {
  Save?: () => void;
  hasOptions?: boolean;
  screenName: string | React.ReactNode;
  goBack: () => void;
  Icon?: React.ReactNode;
  DataCy?: string;
  hasChat?: any;
}) {
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
          order_id: hasChat,
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
      <div className="flex-row w-full min-h-[50px] h-[50px] items-center px-[12px] justify-between">
        <span
          className="cursor-pointer"
          onClick={() => goBack()}
          data-cy={(DataCy && `${DataCy}-back-button`) || "back-button"}
        >
          <BackIcon />
        </span>
        <div className="flex-row">
          {Icon || <></>}
          <span
            className={`${
              Icon && "ml-[4px]"
            } text-[#1D1D1D] text-[14px] medium`}
          >
            {typeof screenName === "string"
              ? translateFunction(screenName)
              : screenName}
          </span>
        </div>
        <span
          className="cursor-pointer medium text-[#402CDD] text-[14px] flex-row"
          data-cy={DataCy || "save-button"}
          onClick={() => {
            if (Save) Save();
          }}
        >
          {Save && translateFunction("Save")}
          {hasChat &&
            (isGettingChat ? (
              <Spinner />
            ) : (
              <ChatIcon
                className="mx-[10px] cursor-pointer"
                onClick={() => {
                  getChatWithShipping();
                }}
              />
            ))}
          {hasOptions && <OptionsIcon />}
        </span>
      </div>
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
    </>
  );
}

export default SettingTopBar;
