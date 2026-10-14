"use client";
import React, { useEffect, useState, useCallback } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import { convertTextToXFormat } from "utils/server/helpers";
import {
  DashCard,
  DashIcon,
  EmptyState,
  ErrorState,
} from "components/SellerDashboard/ui";
import { ListRowsSkeleton } from "components/skeleton/loaders/SellerDashboardLoader";
import CartLineItem from "./CartLineItem";
import { CartDetailsData } from "./types";

interface ActiveCartDetailsProps {
  cartGroupId: string;
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

export default function ActiveCartDetails({
  cartGroupId,
  sellerId,
  language = "en",
  shopCurrency = "",
  onBack,
  onViewProductCarts,
}: ActiveCartDetailsProps) {
  const isRtl = language === "ar" || language === "ku";
  const [cartDetails, setCartDetails] = useState<CartDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCartDetails = useCallback(
    async (groupId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await SellerDashboardService.getSellerCartDetails(
          sellerId,
          groupId,
        );
        if (res && res.isSuccessful === false) {
          throw new Error(res.message || "Failed to load cart details");
        }
        const data = res?.data;
        setCartDetails(data || null);
      } catch (err: any) {
        const msg = err?.message || String(err);
        LogError({ scenario: "ActiveCartDetails.loadCartDetails", error: msg });
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [sellerId],
  );

  useEffect(() => {
    if (cartGroupId) {
      loadCartDetails(cartGroupId);
    }
  }, [cartGroupId, loadCartDetails]);

  const maskedName = cartDetails?.customer?.name
    ? convertTextToXFormat(cartDetails.customer.name)
    : translateFunction("Customer", language);

  const totalValue = (cartDetails?.items || []).reduce((acc, item) => {
    const hasCurrency =
      item.unit_price_in_currency !== null &&
      item.unit_price_in_currency !== undefined;
    const unit = hasCurrency
      ? Number(item.unit_price_in_currency)
      : Number(item.unit_price || 0);
    const offer = hasCurrency
      ? Number(item.offer_price_in_currency || 0)
      : Number(item.offer_price || 0);
    const eff = offer > 0 && offer < unit ? offer : unit;
    return acc + eff * Number(item.quantity || 1);
  }, 0);

  const currencyCode =
    cartDetails?.items?.[0]?.currency?.code || shopCurrency || "USD";

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-pw="back-to-active-carts-btn"
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
          onRetry={() => loadCartDetails(cartGroupId)}
        />
      ) : !cartDetails ? (
        <EmptyState
          icon="carts"
          title={translateFunction("Cart not found", language)}
        />
      ) : (
        <div className="space-y-4">
          {/* Cart Header Card */}
          <DashCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-[#5d5d5d]/10 text-[#5d5d5d] flex items-center justify-center font-bold text-[18px]">
                  {maskedName.charAt(0)}
                </span>
                <div>
                  <h3 className="text-[16px] bold text-[#1d1d1d]">
                    {maskedName}
                  </h3>
                  <p className="text-[12px] text-[#8e8e8e] font-mono mt-0.5">
                    {translateFunction("Cart Group ID:", language)}{" "}
                    {cartDetails.cart_group_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-[#f4f4f4] text-[#505050] text-[12px] semibold">
                  {translateFunction("Orders with your shop:", language)}{" "}
                  <span className="bold text-[#1d1d1d] ms-1">
                    {cartDetails.customer_orders_count}
                  </span>
                </span>
              </div>
            </div>
          </DashCard>

          {/* Cart Items List */}
          <div className="space-y-3">
            {(cartDetails.items || []).map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                language={language}
                shopCurrency={shopCurrency}
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

          {/* Cart Summary Card */}
          <DashCard>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[13px] text-[#505050]">
                <span>
                  {translateFunction("Items Count:", language)}{" "}
                  <span className="semibold text-[#1d1d1d]">
                    {cartDetails.items.length}
                  </span>
                </span>
              </div>
              <div className="text-[15px] bold text-[#1d1d1d]">
                <span>{translateFunction("Cart Total:", language)} </span>
                <span className="text-[18px] text-[#3c3c3c]">
                  {totalValue.toFixed(2)} {currencyCode}
                </span>
              </div>
            </div>
          </DashCard>
        </div>
      )}
    </div>
  );
}
