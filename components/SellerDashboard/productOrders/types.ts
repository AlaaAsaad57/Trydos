import type {
  ApiResponse,
  CurrencyInfo,
  Customer,
  PaginationMeta,
} from "components/SellerDashboard/carts/types";

// Contract: shop-seller-orders-apis.md §4.1 (GET /shop/products/{id}/orders).

// The `status` filter values the endpoint accepts. "all" is the default.
export type ProductOrdersStatus =
  | "all"
  | "in_progress"
  | "collected"
  | "returned"
  | "canceled";

export interface OrderLine {
  id: number;
  order_id: number;
  cart_image: string | null;
  brand_icon?: string | null;
  qty: number;
  unit_price: number;
  offer_price: number;
  unit_price_in_currency?: number | null;
  offer_price_in_currency?: number | null;
  currency?: CurrencyInfo | null;
  offer_type?: string | null;
  is_confirm: boolean;
  is_packed: boolean;
  is_collected: boolean;
  product_name: string | null;
  color: string | null;
  size: string | null;
  is_reported?: boolean;
}

export interface ProductOrderCard {
  id: number;
  // Display label: "Waiting Confirm", "Confirmed", "Packed", else the raw status.
  order_status: string;
  available_order_status_change?: string[];
  // In the system default currency (USD).
  order_amount: number;
  // In the shop currency; null when the backend cannot resolve that currency.
  order_amount_in_currency: number | null;
  currency: CurrencyInfo | null;
  created_at: { date: string; time: string } | null;
  // Lines in the WHOLE order. `details` holds only this product's lines.
  items: number;
  remaining_in_minutes?: number;
  details: OrderLine[];
  customer: Customer | null;
}

export type ProductOrdersResponse = ApiResponse<{
  orders: ProductOrderCard[];
  user_abilities?: { change_order_status?: string[] };
  meta: PaginationMeta;
}>;

/**
 * Total of the whole order. Uses the shop-currency amount when the backend
 * resolved it; otherwise the USD amount, so the code never lies about the
 * currency.
 */
export function getOrderTotal(order: ProductOrderCard) {
  if (
    order.order_amount_in_currency !== null &&
    order.order_amount_in_currency !== undefined &&
    order.currency?.code
  ) {
    return {
      amount: Number(order.order_amount_in_currency),
      currencyCode: order.currency.code,
    };
  }
  return { amount: Number(order.order_amount || 0), currencyCode: "USD" };
}
