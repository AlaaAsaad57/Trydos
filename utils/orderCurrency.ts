// The currency a shopper paid an order with. The order APIs carry it as
// `currency` on every order (saved at checkout, never updated afterwards), so
// an old order keeps showing the amount the shopper really paid even after the
// shop currency or the rate changed.
//
// Every order amount from the backend is in USD. Multiply by `exchange_rate`
// and round to `decimal_digits` to get the paid amount.

export interface OrderCurrency {
  code: string;
  exchange_rate: number;
  // `null` when the currency is no longer in the system.
  symbol: string | null;
  decimal_digits: number | null;
}

export interface DisplayCurrency {
  rate: number | undefined;
  symbol: string | undefined;
  points: number | undefined;
}

// Picks the order's own currency when the API sent one, else the currency the
// caller already shows (the shop currency from the store). The hidden-orders
// API and older responses carry no `currency`, so the fallback stays needed.
export const getOrderCurrency = (
  order:
    | { currency?: OrderCurrency | null }
    | null
    | undefined,
  fallback?: {
    exchange_rate?: number;
    symbol?: string;
    decimal_digits?: number;
  } | null,
): DisplayCurrency => {
  const paid = order?.currency;
  if (paid?.code && Number.isFinite(Number(paid.exchange_rate))) {
    return {
      rate: Number(paid.exchange_rate),
      symbol: paid.symbol ?? paid.code,
      points: paid.decimal_digits ?? 2,
    };
  }
  return {
    rate: fallback?.exchange_rate,
    symbol: fallback?.symbol,
    points: fallback?.decimal_digits,
  };
};
