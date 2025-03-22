import React from "react";
import { NotificationItem as NotificationItemType } from "../../types/notifications";

interface NotificationItemProps {
  notification: NotificationItemType;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => (
  <div
    style={{
      padding: "12px 16px",
      borderBottom: "1px solid #e4e6eb",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    }}
    className="hover:bg-gray-50"
  >
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "linear-gradient(45deg, #3da5b0, #4a90e2)",
          marginRight: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 500,
            fontSize: "14px",
            color: "#1c1e21",
            marginBottom: "4px",
          }}
        >
          {notification.title}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#65676b",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {notification.time}
        </div>
      </div>
    </div>
  </div>
);

export default NotificationItem;
