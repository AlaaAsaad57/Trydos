/**
 * Resolves the actual price the user sees in the Add to Cart sheet
 * before rounding and currency conversion.
 */
export function resolveShowedPrice({
  product,
  selectedVariant,
  isLuck,
}: {
  product?: any;
  selectedVariant?: any;
  isLuck?: boolean;
}): number {
  if (selectedVariant) {
    if (isLuck) {
      const rawLuck = selectedVariant?.luck_price ?? product?.luck_price;
      const luckPrice = Number(rawLuck);
      if (!isNaN(luckPrice) && luckPrice > 0) return luckPrice;
    }

    const rawOffer = selectedVariant?.offer_price;
    const offerPrice = Number(rawOffer);
    if (!isNaN(offerPrice) && offerPrice > 0) return offerPrice;

    const rawNormal = selectedVariant?.price;
    const normalPrice = Number(rawNormal);
    if (!isNaN(normalPrice) && normalPrice > 0) return normalPrice;
  }

  // Fallback for product without variants (or when selectedVariant is absent)
  if (isLuck) {
    const rawLuck = product?.luck_price;
    const luckPrice = Number(rawLuck);
    if (!isNaN(luckPrice) && luckPrice > 0) return luckPrice;
  }

  const rawOffer = product?.offer_price;
  const offerPrice = Number(rawOffer);
  if (!isNaN(offerPrice) && offerPrice > 0) return offerPrice;

  const rawNormal = product?.price;
  const normalPrice = Number(rawNormal);
  if (!isNaN(normalPrice) && normalPrice > 0) return normalPrice;

  return 0;
}
