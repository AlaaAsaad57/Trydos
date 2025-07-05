import Spinner from "components/global/Spinner";
import React from "react";
import ChatIcon from "public/svg/ChatIcon.svg";

import { OrderChatIconPropsType } from "models/componentType/OrderChatIconPropsType";

function OrderChatIcon({
  id,
  isGettingChat,
  getChatWithShipping,
}: OrderChatIconPropsType) {
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
