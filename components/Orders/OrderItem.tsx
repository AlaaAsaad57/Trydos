import React from "react";
import { OrderItem as OrderItemType } from "../../types/orders";
import { translateFunction } from "utils/functions";

interface OrderItemProps {
  order: OrderItemType;
}

const getStatusColor = (status: OrderItemType["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderItem: React.FC<OrderItemProps> = ({ order }) => (
  <div
    style={{
      padding: "12px 16px",
      borderBottom: "1px solid #e4e6eb",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    }}
    className="hover:bg-gray-50"
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontWeight: 500, fontSize: "14px", color: "#1c1e21" }}>
            {order.orderNumber}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              order.status
            )}`}
          >
            {translateFunction(order.status)}
          </span>
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#65676b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {order.date}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 500, fontSize: "14px", color: "#1c1e21" }}>
          ${order.total.toFixed(2)}
        </div>
        <div style={{ fontSize: "12px", color: "#65676b" }}>
          {order.items} {translateFunction("items")}
        </div>
      </div>
    </div>
  </div>
);

export default OrderItem;
