"use client";
import React, { useState } from "react";
import { GetImageUrl } from "utils/tinyUtils";
import { translateFunction } from "utils/functions";
import { DashIcon } from "components/SellerDashboard/ui/icons";

export interface ResolvedProductVariant {
  productName: string;
  imageUrl: string | null;
  colorName: string | null;
  colorCode: string | null;
  sizeName: string | null;
  displayVariant: string;
  hasVariant: boolean;
  productSlug: string | null;
}

/**
 * Resolves product information, variant color-size, and the matching color image
 * from the product data and comment variant string, using robust fallbacks.
 */
export function resolveProductVariantDetails({
  product,
  variantString,
  productId,
  language,
}: {
  product?: any;
  variantString?: string | null;
  productId?: string | number;
  language: string;
}): ResolvedProductVariant {
  const rawVariant = typeof variantString === "string" ? variantString.trim() : "";
  const hasVariant = rawVariant.length > 0;

  const defaultProductName = productId
    ? `${translateFunction("Product", language)} #${productId}`
    : translateFunction("Product", language);

  const productName = product?.name?.trim() || defaultProductName;
  const productSlug = product?.slug || null;

  let colorName: string | null = null;
  let colorCode: string | null = null;
  let sizeName: string | null = null;
  let displayVariant: string = "";

  const variations: any[] = Array.isArray(product?.variations) ? product.variations : [];
  const syncColorImages: any[] = Array.isArray(product?.sync_color_images)
    ? product.sync_color_images
    : [];
  const colors: any[] = Array.isArray(product?.colors) ? product.colors : [];
  const sizes: any[] = Array.isArray(product?.sizes) ? product.sizes : [];

  if (hasVariant) {
    // 1. Check direct variation match (by type, id, variation_id, sku)
    const normalizedRaw = rawVariant.toLowerCase();
    const directVariation = variations.find((v) => {
      const type = (v?.type || "").toLowerCase();
      const id = String(v?.id || "");
      const varId = String(v?.product_variation_id || v?.variation_id || "");
      const sku = (v?.sku || "").toLowerCase();
      return (
        type === normalizedRaw ||
        id === normalizedRaw ||
        varId === normalizedRaw ||
        (sku && sku === normalizedRaw)
      );
    });

    if (directVariation) {
      colorName = directVariation?.color?.name || null;
      colorCode = directVariation?.color?.code || null;
      sizeName = directVariation?.size || null;
    }

    // 2. Match color from sync_color_images or colors if not resolved
    if (!colorName) {
      for (const c of syncColorImages) {
        const cName = c?.color_name?.toLowerCase();
        const cOpt = c?.color_option?.toLowerCase();
        if (
          (cName && normalizedRaw.includes(cName)) ||
          (cOpt && normalizedRaw.includes(cOpt))
        ) {
          colorName = c?.color_name || c?.color_option || null;
          colorCode = c?.color_code || null;
          break;
        }
      }
    }

    if (!colorName) {
      for (const c of colors) {
        const cName = c?.name?.toLowerCase();
        const cOpt = c?.option?.toLowerCase();
        if (
          (cName && normalizedRaw.includes(cName)) ||
          (cOpt && normalizedRaw.includes(cOpt))
        ) {
          colorName = c?.name || c?.option || null;
          colorCode = c?.code || null;
          break;
        }
      }
    }

    // 3. Match size from sizes or variations if not resolved
    if (!sizeName) {
      for (const s of sizes) {
        const sVal = typeof s === "string" ? s : s?.name || s?.size;
        if (sVal) {
          const sLower = sVal.toLowerCase();
          // Match size as whole word/token in variant
          const tokens = normalizedRaw.split(/[-/,|•\s]+/);
          if (tokens.includes(sLower) || normalizedRaw === sLower) {
            sizeName = sVal;
            break;
          }
        }
      }
    }

    // 4. If color was found but size wasn't, try extracting leftover text as size
    if (colorName && !sizeName) {
      const cleaned = rawVariant
        .replace(new RegExp(colorName, "i"), "")
        .replace(/^[-/,|•\s]+|[-/,|•\s]+$/g, "")
        .trim();
      if (cleaned.length > 0 && cleaned.length <= 15) {
        sizeName = cleaned;
      }
    }

    // If neither parsed into discrete color/size, fallback displayVariant to rawVariant
    if (!colorName && !sizeName) {
      displayVariant = rawVariant;
    }
  } else {
    // Comment has NO variant: fallback display
    displayVariant = translateFunction("Standard", language) || "Standard";
  }

  // Resolve matching image:
  // 1. Color image matching the resolved color
  let selectedImage: any = null;
  if (colorName && syncColorImages.length > 0) {
    const cLower = colorName.toLowerCase();
    const matchedSync = syncColorImages.find((c) => {
      const nameMatch = c?.color_name?.toLowerCase() === cLower;
      const optMatch = c?.color_option?.toLowerCase() === cLower;
      return (nameMatch || optMatch) && c?.images?.length > 0;
    });
    if (matchedSync?.images?.[0]) {
      selectedImage = matchedSync.images[0];
    }
  }

  // 2. If no color match, but rawVariant contains any sync_color_images color
  if (!selectedImage && hasVariant && syncColorImages.length > 0) {
    const matchedSync = syncColorImages.find((c) => {
      const cName = c?.color_name?.toLowerCase();
      const cOpt = c?.color_option?.toLowerCase();
      return (
        ((cName && rawVariant.toLowerCase().includes(cName)) ||
          (cOpt && rawVariant.toLowerCase().includes(cOpt))) &&
        c?.images?.length > 0
      );
    });
    if (matchedSync?.images?.[0]) {
      selectedImage = matchedSync.images[0];
    }
  }

  // 3. Fallbacks: thumbnail -> first product image -> first sync color image
  if (!selectedImage && product?.thumbnail) {
    selectedImage = product.thumbnail;
  }
  if (!selectedImage && Array.isArray(product?.images) && product.images.length > 0) {
    selectedImage = product.images[0];
  }
  if (!selectedImage && syncColorImages.length > 0 && syncColorImages[0]?.images?.[0]) {
    selectedImage = syncColorImages[0].images[0];
  }

  const rawPath = typeof selectedImage === "string" ? selectedImage : selectedImage?.file_path;
  const imageUrl = rawPath ? GetImageUrl(rawPath) : null;

  return {
    productName,
    imageUrl,
    colorName,
    colorCode,
    sizeName,
    displayVariant,
    hasVariant,
    productSlug,
  };
}

export interface CommentProductInfoProps {
  productId?: string | number;
  variant?: string | null;
  product?: any;
  loading?: boolean;
  language: string;
  isRtl?: boolean;
}

export default function CommentProductInfo({
  productId,
  variant,
  product,
  loading = false,
  language,
  isRtl = false,
}: CommentProductInfoProps) {
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return (
      <div
        data-pw="comment-product-skeleton"
        className="w-full flex items-center gap-2.5 p-2 mb-2.5 bg-white/90 rounded-[10px] border border-[#EBEBEB] animate-pulse"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        <div className="w-[38px] h-[38px] rounded-[7px] bg-[#E8E8E8] shrink-0" />
        <div className="flex-1 space-y-1.5 py-0.5">
          <div className="h-3 bg-[#E8E8E8] rounded w-2/3" />
          <div className="h-2.5 bg-[#EFEFEF] rounded w-1/3" />
        </div>
      </div>
    );
  }

  const {
    productName,
    imageUrl,
    colorName,
    colorCode,
    sizeName,
    displayVariant,
    hasVariant,
    productSlug,
  } = resolveProductVariantDetails({
    product,
    variantString: variant,
    productId,
    language,
  });

  const productUrl = productSlug ? `/products/${productSlug}` : null;

  return (
    <div
      data-pw="comment-product-info"
      className="w-full flex items-center justify-between gap-2.5 p-2 mb-2.5 bg-white/95 rounded-[10px] border border-[#EAEAEA] shadow-2xs hover:border-[#D5D5D5] transition-colors"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Product Thumbnail / Color Image */}
        <div
          data-pw="comment-product-image-container"
          className="w-[38px] h-[38px] rounded-[7px] overflow-hidden bg-[#F2F2F2] border border-[#E5E5E5] shrink-0 flex items-center justify-center relative"
        >
          {imageUrl && !imageError ? (
            <img
              data-pw="comment-product-image"
              src={imageUrl}
              alt={productName}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              data-pw="comment-product-fallback-icon"
              className="text-[#999] flex items-center justify-center"
            >
              <DashIcon name="products" size={18} />
            </div>
          )}
        </div>

        {/* Product Title & Variant Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-pw="comment-product-name"
                title={productName}
                className="text-[11px] font-semibold text-[#1d1d1d] hover:text-[#388CFF] truncate transition-colors leading-tight"
              >
                {productName}
              </a>
            ) : (
              <span
                data-pw="comment-product-name"
                title={productName}
                className="text-[11px] font-semibold text-[#1d1d1d] truncate leading-tight"
              >
                {productName}
              </span>
            )}
          </div>

          {/* Color-Size Info / Fallback Pill */}
          <div
            data-pw="comment-product-variant"
            className="flex items-center gap-1.5 mt-0.5 flex-wrap"
          >
            {hasVariant ? (
              <>
                {colorName && (
                  <span
                    data-pw="comment-product-color"
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[#F2F4F7] text-[#475467] rounded-[4px] text-[9.5px] font-medium leading-none"
                  >
                    {colorCode && (
                      <span
                        className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: colorCode }}
                      />
                    )}
                    <span>{colorName}</span>
                  </span>
                )}

                {sizeName && (
                  <span
                    data-pw="comment-product-size"
                    className="inline-flex items-center px-1.5 py-0.2 bg-[#F2F4F7] text-[#475467] rounded-[4px] text-[9.5px] font-medium leading-none"
                  >
                    {sizeName}
                  </span>
                )}

                {!colorName && !sizeName && displayVariant && (
                  <span
                    data-pw="comment-product-raw-variant"
                    className="inline-flex items-center px-1.5 py-0.2 bg-[#F2F4F7] text-[#475467] rounded-[4px] text-[9.5px] font-medium leading-none"
                  >
                    {displayVariant}
                  </span>
                )}
              </>
            ) : (
              <span
                data-pw="comment-product-no-variant"
                className="inline-flex items-center px-1.5 py-0.2 bg-[#F8F9FA] text-[#8C95A0] rounded-[4px] text-[9.5px] font-normal italic leading-none"
              >
                {displayVariant}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* External Link button if slug is available */}
      {productUrl && (
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-pw="comment-product-link"
          title={translateFunction("View product", language)}
          className="shrink-0 text-[#A0A0A0] hover:text-[#388CFF] hover:bg-[#F0F6FF] p-1 rounded transition-colors"
        >
          <DashIcon name="link" size={13} />
        </a>
      )}
    </div>
  );
}
