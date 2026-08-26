"use client";
import VirtualTryOnWrapper from "components/products/VirtualTryOnWrapper";
import ProductFooterWrapper from "components/Server/product/ProductFooter.tsx/ProductFooterWrapper";
import ProductPricesWrapper from "components/Server/product/ProductPrices/ProductPricesWrapper";
import ProductVideosWrapper from "components/Server/product/ProductVideosWrapper";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "store";

const ProductFooterClient = ({
  GlobalData,
  language,
  QtyPricesData,
  currency,
  isRtl,
  Params,
  color,
  Size,
  socialData,
  redeemed_status,
  shippingDays
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const isNavigating = useAppStore((s) => s.isNavigating);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || typeof document === "undefined") {
    return null;
  }

  // The footer is portaled into document.body, so NavigationLoaderGate's
  // display:none on the page slots never reaches it — it floated above the
  // in-flow loader. Hide it under the gate's exact condition, keeping it
  // mounted so its state survives the swap.
  const hiddenForNavigation = !!isNavigating && !isNavigating.is_filter;

  return createPortal(
    <div
      className="product-details-footer alternate-product-details-footer z-999999999"
      style={hiddenForNavigation ? { display: "none" } : undefined}
    >
      <ProductVideosWrapper globalPromise={GlobalData} language={language} />

      <div className="product-info-container p-0 h-[40px] overflow-hidden">
        <ProductPricesWrapper
          isRtl={isRtl}
          language={language}
          // redeemed_status folds the redemed_ids cookie into is_luck (same
          // gate ProductFooterWrapper applies); the raw flag kept the orange
          // luck price alive after the window expired.
          qtyPricePromise={{
            ...QtyPricesData,
            is_luck: redeemed_status,
            country_shipping_days: shippingDays,
          }}
          currencyPromise={currency}
        />

        <VirtualTryOnWrapper language={language} />
      </div>

      <ProductFooterWrapper
        redeemed_status={redeemed_status}
        socialData={socialData}
        local={Params.lang}
        QtyPricePromise={QtyPricesData}
        globalPromise={GlobalData}
        isRtl={isRtl}
        color={color}
        size={Size}
        currencyPromise={currency}
      />
    </div>,
    document.body,
  );
};

export default ProductFooterClient;
