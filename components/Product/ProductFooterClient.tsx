"use client";
import VirtualTryOnWrapper from "components/products/VirtualTryOnWrapper";
import ProductFooterWrapper from "components/Server/product/ProductFooter.tsx/ProductFooterWrapper";
import ProductPricesWrapper from "components/Server/product/ProductPrices/ProductPricesWrapper";
import ProductVideosWrapper from "components/Server/product/ProductVideosWrapper";
import { createPortal } from "react-dom";
import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="product-details-footer alternate-product-details-footer z-999999999">
      <ProductVideosWrapper globalPromise={GlobalData} language={language} />

      <div className="product-info-container p-0 h-[40px] overflow-hidden">
        <ProductPricesWrapper
          isRtl={isRtl}
          language={language}
          qtyPricePromise={{ ...QtyPricesData, country_shipping_days: shippingDays }}
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
