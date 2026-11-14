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
 * `bagLine` is the full bag line of that variant (`findBagLine`). A line in
 * the bag keeps the price it was added at, so the sheet shows the bag line's
 * price, not the product's new one (`bagLinePrices`).
 *
 * Answers null when the sheet shows no price at all, so no `showed_price` is
 * sent.
 */
export function resolveShowedPrice({
  product,
  selectedVariant,
  cartItem,
  bagLine,
  isLuck,
}: {
  product?: any;
  selectedVariant?: any;
  cartItem?: any;
  bagLine?: any;
  isLuck?: boolean;
}): number | null {
  const kept = bagLinePrices(bagLine);
  if (kept) return kept.offer_price;

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

/**
 * The price of ONE piece a bag line costs now, as the cart row shows it
 * (components/Cart/index.tsx > QuantutyInput): the luck price on a luck line,
 * else the offer price when it differs from the normal price, else the normal
 * price.
 */
export function cartLineUnitPrice(line: any): number {
  const luckPrice = line?.luck_price;
  const effectiveOfferPrice =
    line?.is_luck && typeof luckPrice === "number"
      ? luckPrice
      : line?.offer_price;
  const hasDiscount =
    typeof effectiveOfferPrice === "number" &&
    effectiveOfferPrice >= 0 &&
    line?.price !== effectiveOfferPrice;
  return hasDiscount ? effectiveOfferPrice : line?.price;
}

/**
 * The full bag line of a `localCart` entry. The full lines are the store's
 * `cart` (the `/cart/cart_shipping` answer). `localCart` keeps only a few
 * fields of each line, and its `item_id` is the full line's `id`.
 *
 * Answers null when there is no entry or no full line with that id.
 */
export function findBagLine(bag: any, cartItem: any): any | null {
  const itemId = cartItem?.item_id;
  if (itemId === undefined || itemId === null || !Array.isArray(bag)) {
    return null;
  }
  return bag.find((line) => line?.id === itemId) ?? null;
}

/**
 * The prices the Add to Cart sheet shows for an item already in the bag.
 *
 * Business rule: a bag line keeps the price it was added at. When the product
 * price changes later, one more of the same line is still charged at the
 * line's price. So the sheet shows the line's own prices:
 * - `price`: the line's normal price.
 * - `offer_price`: the price of ONE piece the line costs now
 *   (`cartLineUnitPrice`): the luck price on a luck line, else the offer
 *   price, else the normal price.
 *
 * The rule holds for luck too:
 * - A luck line keeps its luck price for every piece added later.
 * - A plain line added before a luck deal keeps its own price, even when the
 *   shopper adds one more while the luck deal runs.
 *
 * Answers null, so the caller keeps the product's prices, when there is no bag
 * line, or its price is not a number of 0 or more.
 */
export function bagLinePrices(
  bagLine: any,
): { price: number; offer_price: number } | null {
  if (!bagLine) return null;
  const offer = toShowedPrice(cartLineUnitPrice(bagLine));
  if (offer === null) return null;
  return { price: toShowedPrice(bagLine.price) ?? offer, offer_price: offer };
}

/**
 * The change between the price the shopper was shown (`showed_price`) and the
 * price the bag line costs now. Answers null when the line has no
 * `showed_price` or the two prices are the same.
 */
export function showedPriceChange(
  line: any,
): { from: number; to: number } | null {
  const from = toShowedPrice(line?.showed_price);
  if (from === null) return null;
  const to = Number(cartLineUnitPrice(line));
  if (!Number.isFinite(to)) return null;
  return Math.abs(from - to) >= 0.001 ? { from, to } : null;
}
