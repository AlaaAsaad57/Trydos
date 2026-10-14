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
