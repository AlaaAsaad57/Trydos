// Builders for an order and one order line.
//
// Where the shapes come from (C-5): the `OrderInterface` interface in
// utils/types/OrderInterface.ts. The line type is taken straight off that
// interface (`OrderInterface["details"][number]`) so the two can never drift
// apart. The types come in through `import type`, which the compiler removes,
// so no production module is loaded here.
import type { OrderInterface } from "utils/types/OrderInterface";

import { buildAddress } from "./address";

export type OrderLine = OrderInterface["details"][number];

/** One product line inside an order. */
export function buildOrderLine(overrides: Partial<OrderLine> = {}): OrderLine {
  return {
    id: 1,
    order_id: 1,
    product_id: 1001,
    product_variation_id: 1,
    product_details: {
      id: 1001,
      name: "Test Product",
      slug: "test-product",
      share_link: "https://example.com/test-product",
      details: "A test product.",
      count_of_pieces: 1,
      thumbnail: "/product/test-product-thumb.jpg",
      images: ["/product/test-product-1.jpg"],
      price: 100,
      offer_price: 80,
      is_favourite: false,
      shipping_days: 3,
      rating: {
        overall_rating: 0,
        total_rating: 0,
      },
    },
    product_slug: "test-product",
    qty: 1,
    price: 100,
    discount: 20,
    offer_price: 80,
    image: "/product/test-product-1.jpg",
    tax: 0,
    delivery_status: "pending",
    payment_status: "unpaid",
    shipping_method_id: null,
    shipping_days: 3,
    variant: "M-black",
    collect_product_after_ordering: false,
    variation: [],
    discount_type: "amount",
    is_stock_decreased: 0,
    refund_request: 0,
    refund_request_status: null,
    is_odoo_product: 0,
    odoo_id: 0,
    odoo_order_id: 0,
    comments: null,
    is_reported: false,
    allow_return_in_days: 1,
    is_hidden: false,
    ...overrides,
  };
}

/** A whole order. By default it holds one line. */
export function buildOrder(
  overrides: Partial<OrderInterface> = {},
): OrderInterface {
  return {
    id: 1,
    customer_id: 1,
    payment_status: "unpaid",
    order_status: { value: "pending", label: "Pending" },
    order_group_status: { value: "pending", label: "Pending" },
    payment_method: { value: "cash_on_delivery", label: "Cash on delivery" },
    transaction_ref: "test-transaction-ref",
    order_amount: 80,
    partial_payment_by_wallet: 0,
    discount_amount: 20,
    shipping_cost: 0,
    shipping_address: 1,
    shipping_address_data: buildAddress(),
    billing_address: null,
    billing_address_data: null,
    discount_type: "amount",
    coupon_code: null,
    shipping_method_id: 1,
    order_group_id: "test-order-group",
    verification_code: "000000",
    order_note: "",
    seller_id: "3001",
    owner_id: 3001,
    owner_type: "seller",
    created_at: "2030-01-01T00:00:00.000Z",
    order_has_return_request: false,
    show_return_request: false,
    edit_return_request: false,
    can_return_order: false,
    can_exchange_order: false,
    can_update_address: false,
    can_cancele_order: false,
    can_change_variant: false,
    is_hidden: false,
    details: [buildOrderLine()],
    checked_at: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}
