/**
 * The `showed_price` value the cart contract accepts: a finite number, 0 or
 * more. Anything else answers null, and the caller leaves the field out.
 *
 * The core backend answers 403 for a bad value ("must be a number" / "must be
 * at least 0"), and that 403 stops the add or the quantity change. So a value
 * we cannot trust is never sent. An empty string is not 0: `Number("")` is 0,
 * and sending it would claim the shopper was shown a free item.
 */
export function toShowedPrice(value: unknown): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

/**
 * Resolves the actual price of ONE piece the user sees in the Add to Cart
 * sheet, before rounding and currency conversion (the same unit as the cart
 * line's `price` and `offer_price`).
 *
 * `cartItem` is the bag line of the selected variant, when there is one. For a
 * luck line the sheet shows that line's own `offer_price`
 * (AddToCartComponent > PricesRow), so it stands in for the variant's.
 *
 * Answers null when the sheet shows no price at all, so no `showed_price` is
 * sent.
 */
export function resolveShowedPrice({
  product,
  selectedVariant,
  cartItem,
  isLuck,
}: {
  product?: any;
  selectedVariant?: any;
  cartItem?: any;
  isLuck?: boolean;
}): number | null {
  if (selectedVariant && cartItem?.is_luck) {
    selectedVariant = { ...selectedVariant, offer_price: cartItem.offer_price };
  }
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

  return null;
}
