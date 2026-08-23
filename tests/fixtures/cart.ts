// Builders for a cart item and a whole cart.
//
// Where the shapes come from (C-5): the `CartItemInterface` and
// `CartApiInterface` interfaces in utils/types/cart.tsx. Both come in through
// `import type`, which the compiler removes, so no production module is loaded
// here. Every value is an obviously fake constant.
import type { CartApiInterface, CartItemInterface } from "utils/types/cart";

/** One line in the cart. */
export function buildCartItem(
  overrides: Partial<CartItemInterface> = {},
): CartItemInterface {
  return {
    id: 1,
    customer_id: 1,
    cart_group_id: "test-cart-group",
    product_id: 1001,
    is_luck: false,
    variations: {
      size_options: "Size",
      Size: "M",
      color_options: "color",
      color: "black",
      color_code: "#000000",
    },
    category_name: "Test Category",
    product_variation_id: "1001-m-black",
    max_allowed_qty: "10",
    vendor_name: "Test Vendor",
    quantity: 1,
    discount_price: 0,
    price: 100,
    offer_price: 80,
    tax: 0,
    slug: "test-product",
    name: "Test Product",
    count_of_pieces: 1,
    shop: {
      image: "/shop/test-shop.png",
      name: "Test Shop",
    },
    check_availability: true,
    brand: {
      id: 1,
      slug: "test-brand",
      name: "Test Brand",
      is_verified: 1,
      icon: {
        file_path: "/brand/test-brand.png",
        original_width: "100",
        original_height: "100",
      },
    },
    boutique: {
      id: 2001,
      icon: {
        file_path: "/boutique/test-boutique.png",
        original_width: "100",
        original_height: "100",
      },
    },
    image: "/product/test-product-1.jpg",
    shipping_days: 3,
    have_hurry_up_notify_time_left: false,
    have_hurry_up_notify_qty: false,
    qty_left: 10,
    time_left_in_minutes: 0,
    flash_deal_details: null,
    flash_deal_max_allowed_quantity: null,
    created_at: "2030-01-01T00:00:00.000Z",
    is_country_restricted: false,
    is_active: true,
    packed_after_ordering: null,
    available_quantity: 10,
    ...overrides,
  };
}

/**
 * A whole cart reply. By default it holds one item, and the totals agree with
 * that item so a test does not have to keep them in step by hand.
 */
export function buildCart(
  overrides: Partial<CartApiInterface> = {},
): CartApiInterface {
  return {
    sub_total: 80,
    total_tax: 0,
    total_shipping_cost: 0,
    products_discount: 20,
    coupon_discount: 0,
    coupon_code: null,
    total_discount: 20,
    cod_cost: 0,
    limitFree: 0,
    estimated_tax: 0,
    total: 80,
    rest_for_free_shipping: 0,
    total_cash: 80,
    has_cod: false,
    show_message_reset_for_shipping_free: false,
    available_payment_method: ["card"],
    cart: [buildCartItem()],
    ...overrides,
  };
}
