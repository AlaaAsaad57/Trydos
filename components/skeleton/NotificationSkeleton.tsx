import Skeleton from "react-loading-skeleton";
import React from "react";
import { translateFunction } from "utils/functions";

function NotificationSkeleton() {
  return (
    <div
      data-pw="notification-container"
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
        data-pw="notification-header"
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
          data-pw="notification-left"
        >
          <svg
            data-pw="notification-svg"
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
            data-pw="notification-text"
          >
            {translateFunction("Notifications")}
          </span>
        </div>
      </div>
      <div
        data-pw="notification-body"
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
        <Skeleton width={"100%"} height={"80"} />

        {
          <div
            data-pw="notification-loading"
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
              data-pw="loading-svg"
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
        }
      </div>
    </div>
  );
}

export default NotificationSkeleton;
