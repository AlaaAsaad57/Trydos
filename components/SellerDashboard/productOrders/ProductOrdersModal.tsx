"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, getConfiguredImage, LogError } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import {
  DashIcon,
  EmptyState,
  ErrorState,
  InlineAlert,
  Segmented,
  Pagination,
} from "components/SellerDashboard/ui";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";
import OrderItemTime from "components/setting/orders/OrderItemTime";
import OrderItemId from "components/setting/orders/OrderItemId";
import OrderStatus from "components/setting/orders/OrderStatus";
import OrderInvoice from "components/setting/orders/OrderInvoice";
import OrderProductSlider from "components/setting/orders/OrderProductSlider";
import type { PaginationMeta } from "components/SellerDashboard/carts/types";
import { ProductOrderCard, ProductOrdersStatus, getOrderTotal } from "./types";

interface ProductOrdersModalProps {
  productId: number | string;
  productName?: string;
  productImage?: string;
  sellerId: string;
  language?: string;
  onClose: () => void;
}

// The backend sends "Today " / "Yesterday " (with a trailing space) or a date
// like "5 Oct 2026", plus the time as H:i:s.
function formatOrderTime(
  createdAt: ProductOrderCard["created_at"],
  language: string,
) {
  if (!createdAt) return "";
  const day = (createdAt.date || "").trim();
  const dayLabel =
    day === "Today"
      ? translateFunction("Today", language)
      : day === "Yesterday"
        ? translateFunction("Yesterday", language)
        : day;
  return `${dayLabel} | ${createdAt.time || ""}`;
}

// `order_status` is the backend's display label ("Waiting Confirm",
// "Confirmed", "Packed", else the raw status). The shopper card's status parts
// need a label and a status value for the icons.
function toCardStatus(status: string, language: string) {
  if (status === "Waiting Confirm")
    return {
      label: translateFunction("Waiting Confirm", language),
      value: "pending",
    };
  // Confirmed (processing) and Packed (packaged) are what the shopper sees as
  // "preparing".
  if (status === "Confirmed")
    return { label: translateFunction("Confirmed", language), value: "preparing" };
  if (status === "Packed")
    return { label: translateFunction("Packed", language), value: "preparing" };
  return { label: status, value: (status || "").toLowerCase() };
}

// Same shape as the shopper's order card (components/Orders/OrderItem.tsx):
// time and order id, then status and invoice, then the product images.
// `details` holds only this product's lines, so the images are its variations.
function OrderCard({
  order,
  language,
  isRtl,
}: {
  order: ProductOrderCard;
  language: string;
  isRtl: boolean;
}) {
  const total = getOrderTotal(order);

  return (
    <div
      dir="ltr"
      data-pw="seller-product-order-card"
      data-order-id={order.id}
      className="bg-[#f8f8f8] relative w-full pt-[7px] pb-[12px] pl-[12px] pr-[10px] rounded-[15px] h-[200px] flex-col"
    >
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } flex w-full justify-between items-start`}
      >
        <OrderItemTime
          isRtl={isRtl}
          label={formatOrderTime(order.created_at, language)}
        />
        <OrderItemId isRtl={isRtl} id={String(order.id)} />
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } flex w-full justify-between items-start mt-[11px]`}
      >
        <OrderStatus
          isRtl={isRtl}
          status={toCardStatus(order.order_status, language)}
        />
        <OrderInvoice
          isRtl={isRtl}
          invoice={{ items: order.items, total: total.amount }}
          totalLabel={`${total.amount.toFixed(2)} ${total.currencyCode}`}
        />
      </div>
      <OrderProductSlider
        isRtl={isRtl}
        products={order.details.map((line) => ({
          id: line.id,
          image: line.cart_image,
        }))}
      />
    </div>
  );
}

export default function ProductOrdersModal({
  productId,
  productName,
  productImage,
  sellerId,
  language = "en",
  onClose,
}: ProductOrdersModalProps) {
  const isRtl = language === "ar" || language === "ku";
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ProductOrdersStatus>("all");
  const [orders, setOrders] = useState<ProductOrderCard[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Only the newest request may write the list: switching the filter fast must
  // not let an older answer replace a newer one.
  const requestId = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const load = async (nextPage: number, nextStatus: ProductOrdersStatus) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await SellerDashboardService.getSellerProductOrders(
        sellerId,
        productId,
        nextPage,
        nextStatus,
      );
      if (id !== requestId.current) return;
      if (!res?.success || res.isSuccessful === false) {
        throw new Error(
          res.message ||
            translateFunction("Failed to load product orders", language),
        );
      }
      const data = res?.data;
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setMeta(data?.meta || null);
      setPage(nextPage);
    } catch (err: any) {
      if (id !== requestId.current) return;
      const msg = err?.message || String(err);
      LogError({ scenario: "ProductOrdersModal.load", error: msg });
      setError(msg);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    load(1, status);
    // `load` is rebuilt each render; the inputs that matter are listed here.
  }, [sellerId, productId, status]);

  const changeStatus = (next: ProductOrdersStatus) => {
    if (next === status) return;
    // Clear the old filter's rows so they never show under the new filter.
    setOrders([]);
    setMeta(null);
    setStatus(next);
  };

  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? 1;

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      dir={isRtl ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#ededed] flex items-center justify-between gap-3 bg-[#fafafa]">
          <div className="flex items-center gap-3 min-w-0">
            {productImage && (
              <img
                src={getConfiguredImage({
                  src: GetImageUrl(productImage),
                  width: 44,
                  height: 44,
                  q: 75,
                })}
                alt={productName || translateFunction("Product", language)}
                className="w-11 h-11 rounded-[10px] object-cover shrink-0 border border-[#ededed]"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-[15px] bold text-[#1d1d1d] truncate">
                {productName || translateFunction("Product Orders", language)}
              </h3>
              <p className="text-[12px] text-[#8e8e8e]">
                {translateFunction("Product ID:", language)} {productId}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-pw="close-product-orders-modal"
            aria-label={translateFunction("Close", language)}
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8e8e8e] hover:text-[#1d1d1d] hover:bg-[#ededed] transition-colors shrink-0"
          >
            <DashIcon name="close" size={20} />
          </button>
        </div>

        {/* Status filter — the same values as the Orders tab */}
        <div className="px-5 pt-4 pb-2 border-b border-[#f4f4f4] flex justify-center overflow-x-auto no-scrollbar">
          <Segmented
            value={status}
            className="shrink-0"
            options={[
              { value: "all", label: translateFunction("All", language) },
              {
                value: "in_progress",
                label: translateFunction("In Progress", language),
              },
              {
                value: "collected",
                label: translateFunction("Collected", language),
              },
              {
                value: "returned",
                label: translateFunction("Returned", language),
              },
              {
                value: "canceled",
                label: translateFunction("Canceled", language),
              },
            ]}
            onChange={changeStatus}
          />
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 min-h-[260px]">
          {loading && orders.length === 0 ? (
            <ListRowsSkeleton />
          ) : error && orders.length === 0 ? (
            <ErrorState message={error} onRetry={() => load(page, status)} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon="orders"
              title={translateFunction("No orders found", language)}
              subtitle={
                status === "all"
                  ? translateFunction(
                      "No customer has ordered this product yet.",
                      language,
                    )
                  : translateFunction(
                      "No orders of this product have this status.",
                      language,
                    )
              }
            />
          ) : (
            <div className="space-y-3">
              {error && <InlineAlert tone="error">{error}</InlineAlert>}

              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  language={language}
                  isRtl={isRtl}
                />
              ))}
              {meta && meta.last_page > 1 && (
                <Pagination
                  current={currentPage}
                  last={lastPage}
                  disabled={loading}
                  isRtl={isRtl}
                  onPrev={() => {
                    if (currentPage > 1 && !loading) {
                      load(currentPage - 1, status);
                    }
                  }}
                  onNext={() => {
                    if (currentPage < lastPage && !loading) {
                      load(currentPage + 1, status);
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#ededed] bg-[#fafafa] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-[36px] rounded-[10px] bg-[#ededed] hover:bg-[#e0e0e0] text-[#3c3c3c] text-[13px] medium transition-colors active:scale-95"
          >
            {translateFunction("Close", language)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
