import React, { useRef, useEffect, useState } from "react";
import { translateFunction } from "utils/functions";
import { OrderItem as OrderItemType } from "../../types/orders";
import { fetchOrders } from "../../services/orders";
import OrderItem from "./OrderItem";

interface OrdersPanelProps {
  onClose: () => void;
}

const OrdersPanel: React.FC<OrdersPanelProps> = ({ onClose }) => {
  const ordersRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<OrderItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Handle document scroll lock
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPosition = window.getComputedStyle(document.body).position;
    const originalTop = window.getComputedStyle(document.body).top;
    const originalWidth = window.getComputedStyle(document.body).width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, parseInt(originalTop || "0") * -1);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ordersRef.current &&
        !ordersRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const loadMoreOrders = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchOrders(page);
      setOrders((prev) => [...prev, ...response.orders]);
      setHasMore(response.hasMore);
      setPage(response.nextPage);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMoreOrders();
  }, []);

  // Scroll handler
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollThreshold = 50; // pixels from bottom to trigger load

      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        loadMoreOrders();
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [orders.length, loading, hasMore]);

  return (
    <div
      ref={ordersRef}
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        maxHeight: "500px",
        width: "400px",
        background: "#fff",
        boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: "16px", color: "#333" }}>
            {translateFunction("Orders")}
          </span>
        </div>
        <button
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
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
          height: "calc(100% - 60px)",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {orders.map((order) => (
          <OrderItem key={order.id} order={order} />
        ))}
        {loading && (
          <div
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
        {!hasMore && orders.length > 0 && (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#65676b",
              fontSize: "14px",
            }}
          >
            {translateFunction("No more orders")}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPanel;
