export interface Customer {
  id: number;
  name: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface CurrencyInfo {
  code: string;
  name?: string;
  exchange_rate?: number;
}

export interface CartLine {
  id: number;
  cart_group_id: string | null;
  product_id: number;
  product_variation_id: string | null;
  name: string | null;
  cart_image: string;
  color: string | null;
  size: string | null;
  quantity: number;
  available_stock: number | null;
  unit_price: number;
  offer_price: number;
  offer_type?: string | null;
  tax?: number;
  unit_price_in_currency?: number | null;
  offer_price_in_currency?: number | null;
  currency?: CurrencyInfo | null;
  customer_currency?: CurrencyInfo | null;
  customer?: Customer | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  has_more_pages?: boolean;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

export interface ActiveCartSummary {
  cart_group_id: string;
  customer: Customer | null;
  items_count: number;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartDetailsData {
  cart_group_id: string;
  customer: Customer | null;
  customer_orders_count: number;
  items: CartLine[];
}

export interface OldCartSummary {
  customer_id: number;
  customer: Customer | null;
  items_count: number;
  last_added_at: string;
}

export interface OldCartDetailsData {
  customer: Customer | null;
  items: CartLine[];
  meta?: PaginationMeta | null;
}

export interface ApiResponse<T> {
  // `isSuccessful` is the backend's own flag. `success` is added by `fetchData`
  // and is false on a network failure, when no backend body exists at all.
  success?: boolean;
  httpStatus?: number;
  isSuccessful: boolean;
  message?: string;
  data: T;
}

export type CartsListResponse = ApiResponse<{
  carts: ActiveCartSummary[];
  meta: PaginationMeta;
}>;

export type CartDetailsResponse = ApiResponse<CartDetailsData>;

export type ProductCartsResponse = ApiResponse<{
  items: CartLine[];
  meta: PaginationMeta;
}>;

export type OldCartsListResponse = ApiResponse<{
  old_carts: OldCartSummary[];
  meta: PaginationMeta;
}>;

export type OldCartDetailsResponse = ApiResponse<OldCartDetailsData>;

/**
 * Price and currency of one cart line. The `*_in_currency` prices are in the
 * shop currency. When they are missing, the line uses `unit_price` /
 * `offer_price`, which the backend always sends in USD. CartLineItem and the
 * cart total both use this, so they never disagree about a line's currency.
 */
export function getCartLinePrice(item: CartLine, shopCurrency: string = "") {
  const hasCurrencyPrice =
    item.unit_price_in_currency !== null &&
    item.unit_price_in_currency !== undefined;

  const unitPrice = hasCurrencyPrice
    ? Number(item.unit_price_in_currency)
    : Number(item.unit_price || 0);

  const offerPrice = hasCurrencyPrice
    ? Number(item.offer_price_in_currency || 0)
    : Number(item.offer_price || 0);

  const currencyCode = hasCurrencyPrice
    ? item.currency?.code || shopCurrency
    : "USD";

  const hasDiscount = offerPrice > 0 && offerPrice < unitPrice;
  const effectivePrice = hasDiscount ? offerPrice : unitPrice;
  const lineTotal = effectivePrice * Number(item.quantity || 1);

  return { unitPrice, currencyCode, hasDiscount, effectivePrice, lineTotal };
}

export function formatCartTimestamp(
  dateStr?: string | null,
  language: string = "en",
): string {
  if (!dateStr) return "—";
  try {
    const iso = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
    const d = new Date(iso);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
