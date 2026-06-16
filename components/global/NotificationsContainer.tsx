"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useNotificationStore } from "@/store/notifications/reducer";
import { GetImageUrl } from "utils/tinyUtils";
import Image from "next/image";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { getTwoLetters } from "components/Chat/chatsFunctions";
import { watchChannel } from "store/chat/actions";
import CallComponent from "components/Chat/components/CallComponent";
const NotificationsContainer = () => {
  const { notifications, removeNotification } = useNotificationStore();
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const {
    data: chatData,
    openChat,
    setChatOpen,
    setMain,
    setIsNavigating,

    setOrderLoading,

    isCallIncoming,
  } = useAppStore();

  const handleDismiss = (id: string) => {
    setDismissingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      removeNotification(id);
      setDismissingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300); // Match animation duration
  };

  const handleChatNotificationClick = (notification: any) => {
    handleDismiss(notification.id);
    if (notification?.chatData?.isPrivate) {
      setOrderLoading(true);
      setIsNavigating({ is_settings: true });
      window.location.href = notification.chatData.isPrivate;
      return;
    }
    if (notification.chatData?.channelId) {
      // Find the chat channel from the store
      const channel =
        chatData.find(
          (chat) =>
            parseInt(chat.id) === parseInt(notification.chatData.channelId),
        ) || notification.chatData.channel;

      if (channel) {
        // Open chat widget first
        setChatOpen(true);

        // Wait for chat-lists-class to exist, then open the specific chat
        let attempts = 0;
        const maxAttempts = 500; // Maximsum 5 seconds (50 * 100ms)

        const checkForChatList = () => {
          const chatListElement = document.querySelector(".chat-lists-class");
          if (chatListElement) {
            watchChannel(channel?.id);
            // Chat list is ready, now open the specific chat
            openChat(channel);
            setMain("chat");
          } else {
            attempts++;
            if (attempts < maxAttempts) {
              // Keep checking until the element exists
              setTimeout(checkForChatList, 100);
            } else {
              // Fallback: try to open chat anyway after timeout
              openChat(channel);
              setMain("chat");
            }
          }
        };

        // Start checking after a small delay to allow the chat widget to start rendering
        setTimeout(checkForChatList, 50);
      }
    }
  };

  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};

    notifications.forEach((notification) => {
      if (!timers[notification.id] && !dismissingIds.has(notification.id)) {
        timers[notification.id] = setTimeout(() => {
          handleDismiss(notification.id);
        }, notification.duration || 5000);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [notifications, dismissingIds]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes notificationSlideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes notificationSlideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          
          .notification-slide-in {
            animation: notificationSlideIn 0.3s ease-out forwards;
          }
          
          .notification-slide-out {
            animation: notificationSlideOut 0.3s ease-out forwards;
          }
        `,
        }}
      />

      {notifications.map((notification, index) => {
        const isChatNotification = notification.type === "chat";

        const notificationClasses = `
            relative w-full max-w-[1200px] px-4 py-3 rounded-[15px] shadow-lg
            transform transition-all duration-300 ease-out
            pointer-events-auto
            ${isChatNotification ? "min-h-[67px]" : "min-h-[67px]"}
            ${
              dismissingIds.has(notification.id)
                ? "notification-slide-out"
                : "notification-slide-in"
            }
            ${
              notification.type === "success"
                ? "bg-[#E2FFF1] border border-[#2CDD926f]"
                : notification.type === "chat"
                  ? "bg-white border-2 border-[#402CDD2f] shadow-2xl"
                  : "bg-[#FFEDE2] border border-[#402CDD6f]"
            }
            ${
              notification.href || isChatNotification
                ? " cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                : ""
            }
          `;

        // Chat notification content
        const chatNotificationContent = notification.chatData ? (
          <div className="flex items-start gap-3 relative w-full">
            {/* Sender Photo */}
            <div className="shrink-0 relative">
              {notification.chatData.senderPhoto ? (
                <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden ">
                  <Image
                    className="object-cover object-center w-full h-full"
                    alt={notification.chatData.senderName || "Sender"}
                    src={GetImageUrl(notification.chatData.senderPhoto)}
                    width={30}
                    height={30}
                  />
                </div>
              ) : (
                <div className="text-avatar">
                  {getTwoLetters(notification.chatData.senderName)}
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 flex flex-col items-start gap-1.5 min-w-0 pr-2 regular">
              {/* Sender Name */}
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold text-[#402CDD] truncate">
                  {notification.chatData.senderName || translateFunction("Unknown")}
                </p>
                <span className="text-[10px] text-[#676767] font-medium">
                  {translateFunction("now")}
                </span>
              </div>

              {/* Message Preview or Image */}
              <div className="flex items-center gap-2.5  rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#402CDD] font-medium truncate">
                    {notification.chatData.messagePreview}
                  </p>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
              className="shrink-0 p-1 absolute right-[-30px] top-[-23px] rounded-md transition-colors"
              tabIndex={0}
              aria-label="Close notification"
            >
              <svg
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(notification.id);
                }}
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="36"
                height="36"
                viewBox="0 0 36 36"
              >
                <defs>
                  <filter
                    id={`Ellipse_274_${notification.id}`}
                    x="0"
                    y="0"
                    width="36"
                    height="36"
                    filterUnits="userSpaceOnUse"
                  >
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodOpacity="0.102" />
                    <feComposite operator="in" in2="blur" />
                    <feComposite in="SourceGraphic" />
                  </filter>
                </defs>
                <g
                  id="Group_12369"
                  data-name="Group 12369"
                  transform="translate(9.239 6)"
                >
                  <g
                    transform="matrix(1, 0, 0, 1, -9.24, -6)"
                    filter={`url(#Ellipse_274_${notification.id})`}
                  >
                    <g
                      id="Ellipse_274-2"
                      data-name="Ellipse 274"
                      transform="translate(9 6)"
                      fill="#fff"
                      stroke="#402cdd"
                      strokeWidth="0.3"
                    >
                      <circle cx="9" cy="9" r="9" stroke="none" />
                      <circle cx="9" cy="9" r="8.85" fill="none" />
                    </g>
                  </g>
                  <g
                    id="Group_12328"
                    data-name="Group 12328"
                    transform="translate(4.184 4.264)"
                  >
                    <line
                      id="Line_888"
                      data-name="Line 888"
                      x2="12.851"
                      transform="matrix(0.695, -0.719, 0.719, 0.695, 0.158, 9.244)"
                      fill="none"
                      stroke="#402cdd"
                      strokeLinecap="round"
                      strokeWidth="1"
                    />
                    <line
                      id="Line_889"
                      data-name="Line 889"
                      x2="12.851"
                      transform="matrix(0.719, 0.695, -0.695, 0.719, 0, 0.158)"
                      fill="none"
                      stroke="#402cdd"
                      strokeLinecap="round"
                      strokeWidth="1"
                    />
                  </g>
                </g>
              </svg>
            </button>
          </div>
        ) : null;

        // Regular notification content
        const notificationContent = !isChatNotification ? (
          <div className="flex items-start gap-3 relative">
            {/* Icon */}
            <div className="shrink-0">
              {notification?.image ? (
                <Image
                  className="object-cover object-center max-w-[40px] max-h-[40px] w-full h-full"
                  alt={notification.message || "Image"}
                  src={GetImageUrl(notification.image)}
                  width={40}
                  height={40}
                />
              ) : (
                <Image
                  width={25}
                  height={25}
                  src={"/icons/NotificationIcon.svg"}
                  alt="notification-icon"
                />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 flex-col gap-[4px]">
              <p className="text-[12px] regular text-[#402CDD]">
                {/* {translateFunction("Info Message")} */}
                {notification?.error_code && (
                  <span className="text-[#676767] regular mx-[10px]">
                    {notification?.error_code}
                  </span>
                )}
              </p>
              <p
                className={`text-[12px] regular text-[#402CDD]`}
                data-cy="notification-text"
              >
                {typeof notification.message === "string"
                  ? notification.message
                  : JSON.stringify(notification.message)}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => handleDismiss(notification.id)}
              className={`
                  shrink-0 p-1 absolute right-[-30px] top-[-23px] rounded-md transition-colors
                  
                `}
              tabIndex={0}
              aria-label="Close notification"
            >
              <svg
                onClick={() => handleDismiss(notification.id)}
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="36"
                height="36"
                viewBox="0 0 36 36"
              >
                <defs>
                  <filter
                    id="Ellipse_274"
                    x="0"
                    y="0"
                    width="36"
                    height="36"
                    filterUnits="userSpaceOnUse"
                  >
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodOpacity="0.102" />
                    <feComposite operator="in" in2="blur" />
                    <feComposite in="SourceGraphic" />
                  </filter>
                </defs>
                <g
                  id="Group_12369"
                  data-name="Group 12369"
                  transform="translate(9.239 6)"
                >
                  <g
                    transform="matrix(1, 0, 0, 1, -9.24, -6)"
                    filter="url(#Ellipse_274)"
                  >
                    <g
                      id="Ellipse_274-2"
                      data-name="Ellipse 274"
                      transform="translate(9 6)"
                      fill="#fff"
                      stroke="#402cdd"
                      strokeWidth="0.3"
                    >
                      <circle cx="9" cy="9" r="9" stroke="none" />
                      <circle cx="9" cy="9" r="8.85" fill="none" />
                    </g>
                  </g>
                  <g
                    id="Group_12328"
                    data-name="Group 12328"
                    transform="translate(4.184 4.264)"
                  >
                    <line
                      id="Line_888"
                      data-name="Line 888"
                      x2="12.851"
                      transform="matrix(0.695, -0.719, 0.719, 0.695, 0.158, 9.244)"
                      fill="none"
                      stroke="#402cdd"
                      strokeLinecap="round"
                      strokeWidth="1"
                    />
                    <line
                      id="Line_889"
                      data-name="Line 889"
                      x2="12.851"
                      transform="matrix(0.719, 0.695, -0.695, 0.719, 0, 0.158)"
                      fill="none"
                      stroke="#402cdd"
                      strokeLinecap="round"
                      strokeWidth="1"
                    />
                  </g>
                </g>
              </svg>
            </button>
          </div>
        ) : null;

        if (notification.href) {
          return (
            <div
              key={notification?.id}
              className="fixed  right-4 flex flex-col gap-3 pointer-events-none w-[90%]"
              style={{
                zIndex: `${index + 9999999999}`,
                top: `16px`,
              }}
            >
              <Link
                key={notification.id}
                href={notification.href}
                className={notificationClasses}
                onClick={() => {
                  handleDismiss(notification.id);

                  const {
                    shouldUpdateOrders,
                    setShouldUpdateOrders,
                    setShouldUpdateOrdersChat,
                  } = useAppStore.getState();
                  setShouldUpdateOrders(shouldUpdateOrders + 2);
                  let order_id = notification.href_type;
                  setShouldUpdateOrdersChat(shouldUpdateOrders + 1);
                }}
              >
                {notificationContent}
              </Link>
            </div>
          );
        }

        // Handle chat notifications separately
        if (isChatNotification) {
          return (
            <div
              key={notification?.id}
              className="fixed  right-4 flex flex-col gap-3 pointer-events-none w-[90%]"
              style={{
                zIndex: `${index + 9999999999}`,
                top: `16px`,
              }}
            >
              <div
                key={notification.id}
                className={notificationClasses}
                onClick={() => handleChatNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleChatNotificationClick(notification);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open chat with ${
                  notification.chatData?.senderName || "user"
                }`}
              >
                {chatNotificationContent}
              </div>
            </div>
          );
        }

        return (
          <div
            key={notification?.id}
            onClick={() => handleDismiss(notification.id)}
            className="fixed  right-4 flex flex-col gap-3 pointer-events-none w-[90%]"
            style={{
              zIndex: `${index + 9999999999}`,
              top: `16px`,
            }}
          >
            <div key={notification.id} className={notificationClasses}>
              {notificationContent}
            </div>
          </div>
        );
      })}
      {isCallIncoming && (
        <CallComponent reply={() => {}} isCallIncoming={isCallIncoming} />
      )}
    </>
  );
};

export default NotificationsContainer;
