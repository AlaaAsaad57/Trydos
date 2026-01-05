import Spinner from "components/global/Spinner";
import ChatIcon from "public/svg/ChatIcon";

import { translateFunction } from "utils/functions";
import { ShowNotificationSign } from "utils/tinyUtils";

function OrderChatIcon({
  id,
  order_group_id,
  isGettingChat,
  getChatWithShipping,
}: any) {
  return (
    <>
      {id && (
        <button
          type="button"
          className="relative flex items-center gap-2 mx-[10px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => {
            if (!isGettingChat) {
              getChatWithShipping();
            }
          }}
        >
          {isGettingChat ? (
            <span className="w-[20px] h-[20px] flex justify-center items-center mx-[10px]">
              <Spinner />
            </span>
          ) : (
            <>
              <ChatIcon className="w-5 h-5" />
              {ShowNotificationSign({
                order_id: id,
              }) && (
                <span className="absolute w-[10px] h-[10px] bg-[#f64f64] rounded-full top-[-2px] right-[-2px] animate-pulse left-[initial] z-20"></span>
              )}
              <span className="regular text-[12px]   font-medium">
                {translateFunction("Chat with delivery worker")}
              </span>
            </>
          )}
        </button>
      )}
    </>
  );
}

export default OrderChatIcon;
