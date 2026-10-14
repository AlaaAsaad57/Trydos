"use client";
import React from "react";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import { convertTextToXFormat } from "utils/server/helpers";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import { CartLine } from "./types";

interface CartLineItemProps {
  item: CartLine;
  language?: string;
  shopCurrency?: string;
  isOld?: boolean;
  showCustomer?: boolean;
  onViewProductCarts?: (productId: number) => void;
}

export default function CartLineItem({
  item,
  language = "en",
  shopCurrency = "",
  isOld = false,
  showCustomer = false,
  onViewProductCarts,
}: CartLineItemProps) {
  const isRtl = language === "ar" || language === "ku";

  // Currency & price calculation:
  // Prefer shop currency when available, fallback to default USD.
  const hasCurrencyPrice =
    item.unit_price_in_currency !== null &&
    item.unit_price_in_currency !== undefined;

  const unitPrice = hasCurrencyPrice
    ? Number(item.unit_price_in_currency)
    : Number(item.unit_price || 0);

  const offerPrice = hasCurrencyPrice
    ? Number(item.offer_price_in_currency || 0)
    : Number(item.offer_price || 0);

  const currencyCode =
    item.currency?.code || (hasCurrencyPrice ? shopCurrency : "USD");

  const hasDiscount = offerPrice > 0 && offerPrice < unitPrice;
  const effectivePrice = hasDiscount ? offerPrice : unitPrice;
  const lineTotal = effectivePrice * Number(item.quantity || 1);

  // Masked customer name (e.g. "Axxxx Sxxxx"), never raw name or phone
  const maskedCustomerName = item.customer?.name
    ? convertTextToXFormat(item.customer.name)
    : translateFunction("Customer", language);

  return (
    <div
      data-pw="seller-cart-line-item"
      data-item-id={item.id}
      className={`relative w-full bg-[#FEFEFE] rounded-2xl overflow-hidden border border-[#ededed] shadow-[0px_3px_10px_rgba(0,0,0,0.06)] p-3.5 flex flex-col sm:flex-row gap-4 ${
        isRtl ? "sm:flex-row-reverse text-right" : "text-left"
      }`}
    >
      {/* Product Image */}
      <div className="w-[110px] h-[150px] relative my-auto self-center sm:self-start shrink-0 rounded-2xl overflow-hidden bg-[#f0f0f0]">
        {item.cart_image ? (
          <img
            src={getConfiguredImage({
              height: 150,
              width: 110,
              src: GetImageUrl(item.cart_image),
            })}
            alt={item.name || "Product"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#c4c2c2] gap-1">
            <DashIcon name="gallery" size={24} />
            <span className="text-[10px]">
              {translateFunction("No Image", language)}
            </span>
          </div>
        )}
      </div>

      {/* Product & Cart Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Old Cart Out Of Bag Header Badge */}
          {isOld && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-[8px] bg-[#f8f8f8] text-[#8e8e8e] text-[11px] bold">
              <img
                src="/icons/OldCartIcon.svg"
                alt="old-cart"
                width={14}
                height={14}
              />
              <span>{translateFunction("Out Of Bag!", language)}</span>
            </div>
          )}

          {/* Masked Customer badge (when shown on product carts) */}
          {showCustomer && item.customer && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#5d5d5d] mb-1">
              <span className="font-semibold">{maskedCustomerName}</span>
            </div>
          )}

          {/* Product Name */}
          <h4 className="text-[13px] semibold text-[#3c3c3c] leading-snug line-clamp-2">
            {item.name || translateFunction("Unnamed Product", language)}
          </h4>

          {/* Variations: Color & Size */}
          <div
            className={`flex flex-wrap items-center gap-3 mt-2 text-[12px] text-[#505050] ${
              isRtl ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {item.color && (
              <div className="flex items-center gap-1.5">
                <img
                  src="/icons/CartColorIcon.svg"
                  alt="cart-color"
                  width={12}
                  height={12}
                  className="max-h-[12px] object-contain"
                />
                <span>
                  {translateFunction("Color:", language)}{" "}
                  <span className="semibold">{item.color}</span>
                </span>
              </div>
            )}
            {item.size && (
              <div className="flex items-center gap-1.5">
                <img
                  src="/icons/CartSizeIcon.svg"
                  alt="cart-size"
                  width={12}
                  height={12}
                  className="max-h-[12px] object-contain"
                />
                <span>
                  {translateFunction("Size:", language)}{" "}
                  <span className="semibold">{item.size}</span>
                </span>
              </div>
            )}
          </div>

          {/* Quantity & Stock Status */}
          <div
            className={`flex flex-wrap items-center gap-2.5 mt-2.5 text-[11px] ${
              isRtl ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Quantity pill */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#f4f4f4] text-[#1d1d1d] semibold border border-[#ededed]">
              {translateFunction("Quantity:", language)}{" "}
              <span className="ms-1">{item.quantity}</span>
            </span>

            {/* Available stock status */}
            {item.available_stock !== null &&
              item.available_stock !== undefined && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                    item.available_stock === 0
                      ? "bg-[#fff1f1] text-[#f85555]"
                      : item.available_stock < item.quantity
                        ? "bg-[#fff9eb] text-[#d97706]"
                        : "bg-[#f0fdf4] text-[#16a34a]"
                  }`}
                >
                  {item.available_stock === 0
                    ? translateFunction("Out of stock", language)
                    : item.available_stock < item.quantity
                      ? `${translateFunction("Only", language)} ${item.available_stock} ${translateFunction("in stock", language)}`
                      : `${item.available_stock} ${translateFunction("in stock", language)}`}
                </span>
              )}
          </div>
        </div>

        {/* Pricing block & Product Carts action */}
        <div
          className={`flex items-end justify-between gap-2 mt-3 pt-2.5 border-t border-[#f4f4f4] flex-wrap ${
            isRtl ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Prices */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && (
                <span className="text-[12px] text-[#8e8e8e] line-through">
                  {unitPrice.toFixed(2)}
                </span>
              )}
              <span className="text-[15px] bold text-[#1d1d1d]">
                {effectivePrice.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#8e8e8e] uppercase">
                {currencyCode}
              </span>
            </div>
            <span className="text-[11px] text-[#8e8e8e]">
              {translateFunction("Line Total", language)}:{" "}
              <span className="semibold text-[#3c3c3c]">
                {lineTotal.toFixed(2)} {currencyCode}
              </span>
            </span>
          </div>

          {/* Action to view all carts with this product */}
          {onViewProductCarts && item.product_id && (
            <button
              type="button"
              data-pw="view-product-carts-btn"
              onClick={() => onViewProductCarts(item.product_id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] medium bg-[#f4f4f4] hover:bg-[#ededed] text-[#505050] transition-colors active:scale-95"
            >
              <DashIcon name="carts" size={14} />
              <span>{translateFunction("View Carts", language)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
