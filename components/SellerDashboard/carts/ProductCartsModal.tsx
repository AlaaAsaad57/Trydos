"use client";
import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, getConfiguredImage, LogError } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { convertTextToXFormat } from "utils/server/helpers";
import {
  DashIcon,
  EmptyState,
  ErrorState,
  InlineAlert,
  Segmented,
  Pagination,
} from "components/SellerDashboard/ui";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";
import CartLineItem from "./CartLineItem";
import {
  CartLine,
  OldCartSummary,
  PaginationMeta,
  formatCartTimestamp,
} from "./types";

interface ProductCartsModalProps {
  productId: number | string;
  productName?: string;
  productImage?: string;
  sellerId: string;
  language?: string;
  shopCurrency?: string;
  onClose: () => void;
}

export default function ProductCartsModal({
  productId,
  productName,
  productImage,
  sellerId,
  language = "en",
  shopCurrency = "",
  onClose,
}: ProductCartsModalProps) {
  const isRtl = language === "ar" || language === "ku";
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"active" | "old">("active");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active carts holding this product
  const [activeItems, setActiveItems] = useState<CartLine[]>([]);
  const [activeMeta, setActiveMeta] = useState<PaginationMeta | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Old carts holding this product — always fetched on mount to display accurate totals
  const [oldCarts, setOldCarts] = useState<OldCartSummary[]>([]);
  const [oldMeta, setOldMeta] = useState<PaginationMeta | null>(null);
  const [oldPage, setOldPage] = useState(1);
  const [oldLoading, setOldLoading] = useState(true);
  const [oldError, setOldError] = useState<string | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load active carts for product
  const loadActive = useCallback(
    async (page = 1) => {
      setActiveLoading(true);
      setActiveError(null);
      try {
        const res = await SellerDashboardService.getSellerProductCarts(
          sellerId,
          productId,
          page,
        );
        if (!res?.success || res.isSuccessful === false) {
          throw new Error(
            res.message ||
              translateFunction("Failed to load product carts", language),
          );
        }
        const data = res?.data;
        setActiveItems(Array.isArray(data?.items) ? data.items : []);
        setActiveMeta(data?.meta || null);
        setActivePage(page);
      } catch (err: any) {
        const msg = err?.message || String(err);
        LogError({ scenario: "ProductCartsModal.loadActive", error: msg });
        setActiveError(msg);
      } finally {
        setActiveLoading(false);
      }
    },
    [sellerId, productId, language],
  );

  // Load old carts for product
  const loadOld = useCallback(
    async (page = 1) => {
      setOldLoading(true);
      setOldError(null);
      try {
        const res = await SellerDashboardService.getSellerOldCarts(
          sellerId,
          {
            search: productId,
            page,
          },
        );
        if (!res?.success || res.isSuccessful === false) {
          throw new Error(
            res.message ||
              translateFunction("Failed to load product old carts", language),
          );
        }
        const data = res?.data;
        setOldCarts(Array.isArray(data?.old_carts) ? data.old_carts : []);
        setOldMeta(data?.meta || null);
        setOldPage(page);
      } catch (err: any) {
        const msg = err?.message || String(err);
        LogError({ scenario: "ProductCartsModal.loadOld", error: msg });
        setOldError(msg);
      } finally {
        setOldLoading(false);
      }
    },
    [sellerId, productId, language],
  );

  // Initial load: fetch BOTH active and old carts so totals are accurate immediately
  useEffect(() => {
    loadActive(1);
    loadOld(1);
  }, [loadActive, loadOld]);

  const activeCount = activeMeta?.total ?? activeItems.length;
  const oldCount = oldMeta?.total ?? oldCarts.length;

  const currentActivePage = activeMeta?.current_page ?? activePage;
  const activeLastPage = activeMeta?.last_page ?? 1;

  const currentOldPage = oldMeta?.current_page ?? oldPage;
  const oldLastPage = oldMeta?.last_page ?? 1;

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
                {productName || translateFunction("Product Carts", language)}
              </h3>
              <p className="text-[12px] text-[#8e8e8e]">
                {translateFunction("Product ID:", language)} {productId}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-pw="close-product-carts-modal"
            aria-label={translateFunction("Close", language)}
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8e8e8e] hover:text-[#1d1d1d] hover:bg-[#ededed] transition-colors shrink-0"
          >
            <DashIcon name="close" size={20} />
          </button>
        </div>

        {/* Sub-tab switcher */}
        <div className="px-5 pt-4 pb-2 border-b border-[#f4f4f4] flex justify-center">
          <Segmented
            value={activeSubTab}
            options={[
              {
                value: "active",
                label: `${translateFunction("Active Carts", language)} (${activeCount})`,
              },
              {
                value: "old",
                label: `${translateFunction("Old Carts", language)} (${oldCount})`,
              },
            ]}
            onChange={(val) => setActiveSubTab(val)}
          />
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 min-h-[260px]">
          {activeSubTab === "active" ? (
            activeLoading && activeItems.length === 0 ? (
              <ListRowsSkeleton />
            ) : activeError && activeItems.length === 0 ? (
              <ErrorState
                message={activeError}
                onRetry={() => loadActive(activePage)}
              />
            ) : activeItems.length === 0 ? (
              <EmptyState
                icon="carts"
                title={translateFunction("No active carts found", language)}
                subtitle={translateFunction(
                  "No customer currently has this product in their active cart.",
                  language,
                )}
              />
            ) : (
              <div className="space-y-3">
                {activeError && (
                  <InlineAlert tone="error">
                    {activeError}
                  </InlineAlert>
                )}

                {activeItems.map((line) => (
                  <CartLineItem
                    key={line.id}
                    item={line}
                    language={language}
                    shopCurrency={shopCurrency}
                    showCustomer={true}
                  />
                ))}
                {activeMeta && activeMeta.last_page > 1 && (
                  <Pagination
                    current={currentActivePage}
                    last={activeLastPage}
                    disabled={activeLoading}
                    isRtl={isRtl}
                    onPrev={() => {
                      if (currentActivePage > 1 && !activeLoading) {
                        loadActive(currentActivePage - 1);
                      }
                    }}
                    onNext={() => {
                      if (currentActivePage < activeLastPage && !activeLoading) {
                        loadActive(currentActivePage + 1);
                      }
                    }}
                  />
                )}
              </div>
            )
          ) : oldLoading && oldCarts.length === 0 ? (
            <ListRowsSkeleton />
          ) : oldError && oldCarts.length === 0 ? (
            <ErrorState
              message={oldError}
              onRetry={() => loadOld(oldPage)}
            />
          ) : oldCarts.length === 0 ? (
            <EmptyState
              icon="carts"
              title={translateFunction("No old carts found", language)}
              subtitle={translateFunction(
                "No expired customer carts found for this product.",
                language,
              )}
            />
          ) : (
            <div className="space-y-3">
              {oldError && (
                <InlineAlert tone="error">
                  {oldError}
                </InlineAlert>
              )}

              {oldCarts.map((oc) => {
                const maskedName = oc.customer?.name
                  ? convertTextToXFormat(oc.customer.name)
                  : translateFunction("Customer", language);
                const formattedLastAdded = formatCartTimestamp(
                  oc.last_added_at,
                  language,
                );
                return (
                  <div
                    key={oc.customer_id}
                    className="p-4 rounded-2xl border border-[#ededed] bg-[#fdfdfd] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-[#f4f4f4] text-[#5d5d5d] flex items-center justify-center font-bold text-[14px]">
                        {maskedName.charAt(0)}
                      </span>
                      <div>
                        <p className="text-[13px] semibold text-[#3c3c3c]">
                          {maskedName}
                        </p>
                        <p className="text-[11px] text-[#8e8e8e]">
                          {translateFunction("Last added:", language)}{" "}
                          {formattedLastAdded}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#5d5d5d]/10 text-[#5d5d5d] text-[11px] semibold">
                      {oc.items_count}{" "}
                      {translateFunction("Items", language)}
                    </span>
                  </div>
                );
              })}
              {oldMeta && oldMeta.last_page > 1 && (
                <Pagination
                  current={currentOldPage}
                  last={oldLastPage}
                  disabled={oldLoading}
                  isRtl={isRtl}
                  onPrev={() => {
                    if (currentOldPage > 1 && !oldLoading) {
                      loadOld(currentOldPage - 1);
                    }
                  }}
                  onNext={() => {
                    if (currentOldPage < oldLastPage && !oldLoading) {
                      loadOld(currentOldPage + 1);
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
