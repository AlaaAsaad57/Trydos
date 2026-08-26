// The flash-deal rule, moved out of ProductCard so it can be checked.
//
// DISPLAY ONLY (FA-10). This decides what a card *shows*. It must never become
// the source of a price sent to the cart, to checkout or to an order — the
// server stays the authority on what a shopper is charged.
//
// It is a straight move of the block that used to live in `index.tsx:91-121`,
// including the two things that look odd and are kept on purpose:
//
//   * the deal runs until the **end of the last day**, in local time
//     (`setHours(23, 59, 59, 999)`), not until midnight UTC;
//   * the fallbacks are `??`, so an `offer_price` of `0` is a real price and is
//     used as one.
//
// The current moment is an argument, never read from the clock in here. That is
// what lets a test state a case instead of waiting for one.

/** How long a running deal has left. The banner seeds its own state from this,
 *  so the shape is load-bearing: these four keys, or `null`. */
export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CardPriceInput {
  /** The day the deal ends, as the backend sends it. `null` when there is none. */
  endDate?: string | null;
  /** The deal price, when the product carries one. */
  flashDealPrice?: number | null;
  /** The everyday selling price. */
  offerPrice?: number | null;
  /** The price before any offer — what the card strikes through. */
  price?: number | null;
}

export interface CardPrice {
  /** The number the card shows. */
  flashPrice: number | null | undefined;
  /** The time left on a running deal, or `null` when no deal is running. */
  timeLeft: TimeLeft | null;
}

export function resolveCardPrice(
  { endDate, flashDealPrice, offerPrice, price }: CardPriceInput,
  now: Date,
): CardPrice {
  let timeLeft: TimeLeft | null = null;
  let flashPrice = offerPrice ?? price;

  if (endDate) {
    const dealEnd = new Date(endDate);
    dealEnd.setHours(23, 59, 59, 999);
    const difference = dealEnd.getTime() - now.getTime();

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }
  }

  if (timeLeft) {
    flashPrice = flashDealPrice ?? offerPrice ?? price;
  }

  return { flashPrice, timeLeft };
}
