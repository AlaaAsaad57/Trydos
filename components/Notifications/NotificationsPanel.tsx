import React, { useState, useRef, useEffect } from "react";
import { translateFunction } from "utils/functions";
import { NotificationItem as NotificationItemType } from "../../types/notifications";
import { fetchNotifications } from "../../services/notifications";
import NotificationItem from "./NotificationItem";
import auth from "services/auth";

import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";

interface NotificationsPanelProps {
  onClose: () => void;
  closeWindow: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  onClose,
  closeWindow,
}) => {
  const notificationsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItemType[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Handle document scroll lock
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPosition = window.getComputedStyle(document.body).position;
    const originalTop = window.getComputedStyle(document.body).top;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;

      window.scrollTo(0, parseInt(originalTop || "0") * -1);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const loadMoreNotifications = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchNotifications(page);

      if (response.isSuccessful && response.hasContent) {
        setNotifications((prev) => [...prev, ...response.data.data]);
        setHasMore(!!response.data.next_page_url);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMoreNotifications();
  }, []);

  // Scroll handler
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollThreshold = 50; // pixels from bottom to trigger load

      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        loadMoreNotifications();
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [notifications.length, loading, hasMore]);

  return (
    <div
      data-cy="notification-container"
      ref={notificationsRef}
      style={{
        position: "fixed",
        top: 10,
        right: 0,
        bottom: 0,
        maxWidth: "400px",
        width: "100%",
        maxHeight: "600px",
        background: "#fff",
        boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        data-cy="notification-header"
        style={{
          padding: "15px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          data-cy="notification-left"
        >
          <svg
            data-cy="notification-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            style={{ fontWeight: 600, fontSize: "16px", color: "#333" }}
            data-cy="notification-text"
          >
            {translateFunction("Notifications")}
          </span>
        </div>
        <button
          data-cy="button-close"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            data-cy="close-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div
        data-cy="notification-body"
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
          height: "calc(100% - 60px)",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-[400px]"
      >
        <NotificationInfo
          closeWindow={() => {
            closeWindow();
          }}
        />
        {notifications.map((notification, index) => (
          <NotificationItem
            key={index}
            notification={notification}
            onClose={onClose}
            closeWindow={closeWindow}
          />
        ))}
        {loading && (
          <div
            data-cy="notification-loading"
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#65676b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg
              data-cy="loading-svg"
              className="animate-spin"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            {translateFunction("Loading...")}
          </div>
        )}
        {!hasMore && notifications.length > 0 && (
          <div
            data-cy="no-more-notifications"
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#65676b",
              fontSize: "14px",
            }}
          >
            {translateFunction("No more notifications")}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
const NotificationInfo = ({ closeWindow }) => {
  const { lang } = useParams();
  const [supported, setSupported] = useState(false);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const supportedFunction = async () => {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied or dismissed.");
      return null;
    }
    const { requestFirebaseNotificationPermission } = await import(
      "utils/firebaseInitv1"
    );
    const { isSupported } = await import("firebase/messaging");
    isSupported().then((bool) => {
      console.log(bool);
      setSupported(bool);
    });
    requestFirebaseNotificationPermission()
      .then((Fbtoken) => {
        setToken(Fbtoken);
      })
      .catch((err) => {
        console.log(err);
        setError(err);
      });
  };
  useEffect(() => {
    supportedFunction();
  }, []);
  return (
    <>
      <div
        className="flex-col w-full p-2 text-[#5d5d5d] cursor-copy"
        onClick={() => {
          window.navigator.clipboard.writeText(`
        user_id:${auth.UserID()},
        fcm_token:${token},
        fcm_error:  ${error},
        notification_permission:${Notification.permission},
        firebase_supported:${supported},
        `);
        }}
      >
        <div className="flex-row w-full justify-between py-2">
          <span>Notification Premission:</span>
          <span>
            {Notification.permission === "granted" ? "Enabled" : "Not Enabled"}
          </span>
        </div>
        <div className="flex-row w-full justify-between py-2">
          <span>FireBase Supported</span>
          <span>{supported ? "Supported" : "Not Supported"}</span>
        </div>
        <div className="flex-row w-full justify-between">
          <span>User ID:</span>
          <span>{auth.UserID()}</span>
        </div>
        <div className="flex-row w-full justify-between">
          <span>FCM Token:</span>
          <span>
            {token && token?.substring(0, 30)}
            ...
          </span>
        </div>
        {error?.message && (
          <div className="flex-row w-full justify-between text-red-500">
            <span>FCM Error:</span>
            <span>{error?.message}</span>
          </div>
        )}
      </div>
      <NextLink
        onClick={() => {
          closeWindow();
        }}
        data-cy="notification-settings"
        data={{ is_setting: true, href: `/${lang}/settings` }}
        href={`/${lang}/settings`}
        className="flex-row w-full rounded-md shadow-md h-[50px] bg-[#f8f8f8] text-[#5d5d5d] medium text-[14px] justify-center items-center"
      >
        <span>Notification Settings</span>
      </NextLink>
    </>
  );
};
