"use client";
import React, { useEffect, useState, useCallback } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { convertTextToXFormat } from "utils/server/helpers";
import {
  DashIcon,
  EmptyState,
  ErrorState,
  InlineAlert,
  Pagination,
} from "components/SellerDashboard/ui";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";
import CartLineItem from "./CartLineItem";
import { OldCartDetailsData } from "./types";

interface OldCartDetailsProps {
  customerId: number;
  sellerId: string;
  language?: string;
  shopCurrency?: string;
  onBack: () => void;
  onViewProductCarts?: (target: {
    productId: number | string;
    productName?: string;
    productImage?: string;
  }) => void;
}

export default function OldCartDetails({
  customerId,
  sellerId,
  language = "en",
  shopCurrency = "",
  onBack,
  onViewProductCarts,
}: OldCartDetailsProps) {
  const isRtl = language === "ar" || language === "ku";
  const [oldCartDetails, setOldCartDetails] = useState<OldCartDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadOldCartDetails = useCallback(
    async (targetCustomerId: number, targetPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await SellerDashboardService.getSellerOldCartDetails(
          sellerId,
          targetCustomerId,
          targetPage,
        );
        if (res && res.isSuccessful === false) {
          throw new Error(res.message || "Failed to load old cart details");
        }
        const data = res?.data;
        setOldCartDetails(data || null);
        setPage(targetPage);
      } catch (err: any) {
        const msg = err?.message || String(err);
        LogError({ scenario: "OldCartDetails.loadOldCartDetails", error: msg });
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [sellerId],
  );

  useEffect(() => {
    if (customerId !== null && customerId !== undefined) {
      loadOldCartDetails(customerId, 1);
    }
  }, [customerId, loadOldCartDetails]);

  const maskedName = oldCartDetails?.customer?.name
    ? convertTextToXFormat(oldCartDetails.customer.name)
    : translateFunction("Customer", language);

  const meta = oldCartDetails?.meta;
  const currentDetailsPage = meta?.current_page ?? page;
  const detailsLastPage = meta?.last_page ?? 1;

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-pw="back-to-old-carts-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] semibold text-[#505050] hover:text-[#1d1d1d] transition-colors"
        >
          <DashIcon name={isRtl ? "chevronRight" : "chevronLeft"} size={16} />
          <span>{translateFunction("Back to Carts", language)}</span>
        </button>
      </div>

      {loading ? (
        <ListRowsSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => loadOldCartDetails(customerId, page)}
        />
      ) : !oldCartDetails ? (
        <EmptyState
          icon="carts"
          title={translateFunction("Old cart not found", language)}
        />
      ) : (
        <div className="space-y-4">
          {/* Out of Bag Header Banner */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f8f8f8] border border-[#ededed]">
            <img
              src="/icons/OldCartIcon.svg"
              alt="old-cart"
              width={24}
              height={24}
            />
            <div>
              <h3 className="text-[15px] bold text-[#1d1d1d]">
                {translateFunction("Out Of Bag!", language)}
              </h3>
              <p className="text-[12px] text-[#8e8e8e]">
                {translateFunction("Customer:", language)} {maskedName}
              </p>
            </div>
          </div>

          {/* Expired Cart Items List */}
          {error && oldCartDetails.items.length > 0 && (
            <InlineAlert tone="error">
              {error}
            </InlineAlert>
          )}

          <div className="space-y-3">
            {(oldCartDetails.items || []).map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                language={language}
                shopCurrency={shopCurrency}
                isOld={true}
                onViewProductCarts={
                  onViewProductCarts
                    ? (pid) =>
                        onViewProductCarts({
                          productId: pid,
                          productName: item.name || undefined,
                          productImage: item.cart_image,
                        })
                    : undefined
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <Pagination
              current={currentDetailsPage}
              last={detailsLastPage}
              disabled={loading}
              isRtl={isRtl}
              onPrev={() => {
                if (currentDetailsPage > 1 && !loading) {
                  loadOldCartDetails(customerId, currentDetailsPage - 1);
                }
              }}
              onNext={() => {
                if (currentDetailsPage < detailsLastPage && !loading) {
                  loadOldCartDetails(customerId, currentDetailsPage + 1);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
