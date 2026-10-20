"use client";
import React, { useEffect, useState, useCallback } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { convertTextToXFormat } from "utils/server/helpers";
import {
  AccessDenied,
  DashIcon,
  EmptyState,
  ErrorState,
  InlineAlert,
  Pagination,
  Segmented,
} from "components/SellerDashboard/ui";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";
import ActiveCartDetails from "./ActiveCartDetails";
import OldCartDetails from "./OldCartDetails";
import ProductCartsModal from "./ProductCartsModal";
import {
  ActiveCartSummary,
  OldCartSummary,
  PaginationMeta,
  formatCartTimestamp,
} from "./types";

interface CartsTabProps {
  sellerId: string;
  canRead: boolean;
  language?: string;
  shopCurrency?: string;
  onOpenProductCarts?: (target: {
    productId: number | string;
    productName?: string;
    productImage?: string;
  }) => void;
  onActiveCountChange?: (count: number) => void;
}

export default function CartsTab({
  sellerId,
  canRead,
  language = "en",
  shopCurrency = "",
  onOpenProductCarts,
  onActiveCountChange,
}: CartsTabProps) {
  const isRtl = language === "ar" || language === "ku";
  const [activeTab, setActiveTab] = useState<"active" | "old">("active");

  // Selection for drill-down views
  const [selectedCartGroupId, setSelectedCartGroupId] = useState<string | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );

  // Active Carts list state
  const [activeCarts, setActiveCarts] = useState<ActiveCartSummary[]>([]);
  const [activeMeta, setActiveMeta] = useState<PaginationMeta | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Old Carts list state — fetched on mount alongside active carts to guarantee accurate totals
  const [oldCarts, setOldCarts] = useState<OldCartSummary[]>([]);
  const [oldMeta, setOldMeta] = useState<PaginationMeta | null>(null);
  const [oldPage, setOldPage] = useState(1);
  const [oldLoading, setOldLoading] = useState(true);
  const [oldError, setOldError] = useState<string | null>(null);

  // Internal fallback modal state if parent didn't provide onOpenProductCarts
  const [internalProductCartsTarget, setInternalProductCartsTarget] = useState<{
    productId: number | string;
    productName?: string;
    productImage?: string;
  } | null>(null);

  const handleOpenProductCarts = (target: {
    productId: number | string;
    productName?: string;
    productImage?: string;
  }) => {
    if (onOpenProductCarts) {
      onOpenProductCarts(target);
    } else {
      setInternalProductCartsTarget(target);
    }
  };

  // Fetch active carts
  const loadActiveCarts = useCallback(
    async (page = 1) => {
      setActiveLoading(true);
      setActiveError(null);
      try {
        const res = await SellerDashboardService.getSellerCarts(
          sellerId,
          page,
        );
        if (!res?.success || res.isSuccessful === false) {
          throw new Error(
            res.message || translateFunction("Failed to load carts", language),
          );
        }
        const data = res?.data;
        const items = Array.isArray(data?.carts) ? data.carts : [];
        const meta = data?.meta || null;
        setActiveCarts(items);
        setActiveMeta(meta);
        setActivePage(page);
        onActiveCountChange?.(meta?.total ?? items.length);
      } catch (err: any) {
        const msg = err?.message || String(err);
        LogError({ scenario: "CartsTab.loadActiveCarts", error: msg });
        setActiveError(msg);
      } finally {
        setActiveLoading(false);
      }
    },
    [sellerId, onActiveCountChange, language],
  );

  // Fetch old carts
  const loadOldCarts = useCallback(
    async (page = 1) => {
      setOldLoading(true);
      setOldError(null);
      try {
        const res = await SellerDashboardService.getSellerOldCarts(
          sellerId,
          { page },
        );
        if (!res?.success || res.isSuccessful === false) {
          throw new Error(
            res.message ||
              translateFunction("Failed to load old carts", language),
          );
        }
        const data = res?.data;
        setOldCarts(Array.isArray(data?.old_carts) ? data.old_carts : []);
        setOldMeta(data?.meta || null);
        setOldPage(page);
      } catch (err: any) {
        const msg = err?.message || String(err);
        LogError({ scenario: "CartsTab.loadOldCarts", error: msg });
        setOldError(msg);
      } finally {
        setOldLoading(false);
      }
    },
    [sellerId, language],
  );

  // Initial load: always fetch BOTH active carts and old carts on mount so totals are accurate immediately
  useEffect(() => {
    if (canRead) {
      loadActiveCarts(1);
      loadOldCarts(1);
    }
  }, [canRead, loadActiveCarts, loadOldCarts]);

  // Permission Refusal
  if (!canRead) {
    return (
      <AccessDenied
        message={translateFunction(
          "You do not have permission to view carts.",
          language,
        )}
      />
    );
  }

  // --- Sub-View: Active Cart Details ---
  if (selectedCartGroupId) {
    return (
      <>
        <ActiveCartDetails
          cartGroupId={selectedCartGroupId}
          sellerId={sellerId}
          language={language}
          shopCurrency={shopCurrency}
          onBack={() => setSelectedCartGroupId(null)}
          onViewProductCarts={handleOpenProductCarts}
        />
        {!onOpenProductCarts && internalProductCartsTarget && (
          <ProductCartsModal
            productId={internalProductCartsTarget.productId}
            productName={internalProductCartsTarget.productName}
            productImage={internalProductCartsTarget.productImage}
            sellerId={sellerId}
            language={language}
            shopCurrency={shopCurrency}
            onClose={() => setInternalProductCartsTarget(null)}
          />
        )}
      </>
    );
  }

  // --- Sub-View: Old Cart Details ---
  if (selectedCustomerId !== null) {
    return (
      <>
        <OldCartDetails
          customerId={selectedCustomerId}
          sellerId={sellerId}
          language={language}
          shopCurrency={shopCurrency}
          onBack={() => setSelectedCustomerId(null)}
          onViewProductCarts={handleOpenProductCarts}
        />
        {!onOpenProductCarts && internalProductCartsTarget && (
          <ProductCartsModal
            productId={internalProductCartsTarget.productId}
            productName={internalProductCartsTarget.productName}
            productImage={internalProductCartsTarget.productImage}
            sellerId={sellerId}
            language={language}
            shopCurrency={shopCurrency}
            onClose={() => setInternalProductCartsTarget(null)}
          />
        )}
      </>
    );
  }

  // Counts reflect total across all pages from meta when available
  const activeCount = activeMeta?.total ?? activeCarts.length;
  const oldCount = oldMeta?.total ?? oldCarts.length;

  const currentActivePage = activeMeta?.current_page ?? activePage;
  const activeLastPage = activeMeta?.last_page ?? 1;

  const currentOldPage = oldMeta?.current_page ?? oldPage;
  const oldLastPage = oldMeta?.last_page ?? 1;

  return (
    <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header with Title and Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-3 mb-4 ">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[#5d5d5d] shrink-0">
              <DashIcon name="carts" size={20} />
            </span>
            <h2 className="text-[16px] semibold text-[#3c3c3c] truncate">
              {translateFunction("Carts", language)}
            </h2>
            <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-[#5d5d5d]/10 text-[#5d5d5d] text-[11px] semibold">
              {activeTab === "active" ? activeCount : oldCount}
            </span>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <Segmented
          value={activeTab}
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
          onChange={(val) => setActiveTab(val)}
        />
      </div>

      {/* Tab Content */}
      {activeTab === "active" ? (
        activeLoading && activeCarts.length === 0 ? (
          <ListRowsSkeleton />
        ) : activeError && activeCarts.length === 0 ? (
          <ErrorState
            message={activeError}
            onRetry={() => loadActiveCarts(activePage)}
          />
        ) : activeCarts.length === 0 ? (
          <EmptyState
            icon="carts"
            title={translateFunction("No active carts found", language)}
            subtitle={translateFunction(
              "Active customer carts for your shop will appear here.",
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

            {activeCarts.map((cart) => {
              const maskedName = cart.customer?.name
                ? convertTextToXFormat(cart.customer.name)
                : translateFunction("Customer", language);

              const formattedDate = cart.updated_at
                ? new Date(cart.updated_at).toLocaleDateString(language)
                : "—";

              return (
                <div
                  key={cart.cart_group_id}
                  data-pw="seller-active-cart-row"
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ededed] shadow-[0px_3px_10px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#388CFF]/30"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 shrink-0 rounded-2xl bg-[#5d5d5d]/10 text-[#5d5d5d] flex items-center justify-center font-bold text-[16px]">
                      {maskedName.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] semibold text-[#3c3c3c]">
                        {maskedName}
                      </p>
                      <p className="text-[11px] text-[#8e8e8e] font-mono mt-0.5 truncate">
                        {cart.cart_group_id}
                      </p>
                      <p className="text-[11px] text-[#8e8e8e] mt-0.5">
                        {translateFunction("Updated:", language)}{" "}
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f4f4f4]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#f4f4f4] text-[#505050] text-[11px] semibold">
                        {cart.items_count}{" "}
                        {translateFunction("Items", language)}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#f4f4f4] text-[#505050] text-[11px] semibold">
                        {cart.total_quantity}{" "}
                        {translateFunction("Pieces", language)}
                      </span>
                    </div>

                    <button
                      type="button"
                      data-pw="view-active-cart-details-btn"
                      onClick={() =>
                        setSelectedCartGroupId(cart.cart_group_id)
                      }
                      className="px-4 h-[34px] rounded-[10px] bg-[#5d5d5d] hover:bg-[#4a4a4a] text-white text-[12px] medium transition-all active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <span>{translateFunction("View Details", language)}</span>
                      <DashIcon
                        name={isRtl ? "chevronLeft" : "chevronRight"}
                        size={14}
                      />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {activeMeta && activeMeta.last_page > 1 && (
              <Pagination
                current={currentActivePage}
                last={activeLastPage}
                disabled={activeLoading}
                isRtl={isRtl}
                onPrev={() => {
                  if (currentActivePage > 1 && !activeLoading) {
                    loadActiveCarts(currentActivePage - 1);
                  }
                }}
                onNext={() => {
                  if (currentActivePage < activeLastPage && !activeLoading) {
                    loadActiveCarts(currentActivePage + 1);
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
          onRetry={() => loadOldCarts(oldPage)}
        />
      ) : oldCarts.length === 0 ? (
        <EmptyState
          icon="carts"
          title={translateFunction("No old carts found", language)}
          subtitle={translateFunction(
            "Expired customer carts will appear here.",
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
              : `${translateFunction("Customer", language)} #${oc.customer_id}`;

            const formattedLastAdded = formatCartTimestamp(
              oc.last_added_at,
              language,
            );

            return (
              <div
                key={oc.customer_id}
                data-pw="seller-old-cart-row"
                className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ededed] shadow-[0px_3px_10px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#388CFF]/30"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-11 h-11 shrink-0 rounded-2xl bg-[#8e8e8e]/10 text-[#8e8e8e] flex items-center justify-center font-bold text-[16px]">
                    <img
                      src="/icons/OldCartIcon.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] semibold text-[#3c3c3c]">
                      {maskedName}
                    </p>
                    <p className="text-[11px] text-[#8e8e8e] mt-0.5">
                      {translateFunction("Last added:", language)}{" "}
                      {formattedLastAdded}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f4f4f4]">
                  <span className="px-2.5 py-1 rounded-full bg-[#f4f4f4] text-[#505050] text-[11px] semibold">
                    {oc.items_count}{" "}
                    {translateFunction("Items", language)}
                  </span>

                  <button
                    type="button"
                    data-pw="view-old-cart-details-btn"
                    onClick={() => setSelectedCustomerId(oc.customer_id)}
                    className="px-4 h-[34px] rounded-[10px] bg-[#5d5d5d] hover:bg-[#4a4a4a] text-white text-[12px] medium transition-all active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <span>{translateFunction("View Details", language)}</span>
                    <DashIcon
                      name={isRtl ? "chevronLeft" : "chevronRight"}
                      size={14}
                    />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {oldMeta && oldMeta.last_page > 1 && (
            <Pagination
              current={currentOldPage}
              last={oldLastPage}
              disabled={oldLoading}
              isRtl={isRtl}
              onPrev={() => {
                if (currentOldPage > 1 && !oldLoading) {
                  loadOldCarts(currentOldPage - 1);
                }
              }}
              onNext={() => {
                if (currentOldPage < oldLastPage && !oldLoading) {
                  loadOldCarts(currentOldPage + 1);
                }
              }}
            />
          )}
        </div>
      )}

      {/* Fallback Product Carts Modal if not provided by parent */}
      {!onOpenProductCarts && internalProductCartsTarget && (
        <ProductCartsModal
          productId={internalProductCartsTarget.productId}
          productName={internalProductCartsTarget.productName}
          productImage={internalProductCartsTarget.productImage}
          sellerId={sellerId}
          language={language}
          shopCurrency={shopCurrency}
          onClose={() => setInternalProductCartsTarget(null)}
        />
      )}
    </div>
  );
}
