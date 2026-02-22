export interface CartApiInterface {
  sub_total: number;
  total_tax: number;
  total_shipping_cost: number;
  products_discount: number;
  coupon_discount: number;
  coupon_code: any;
  total_discount: number;
  cod_cost: number;
  limitFree: number;
  estimated_tax: number;
  total: number;
  rest_for_free_shipping: number;
  total_cash: number;
  has_cod: boolean;
  show_message_reset_for_shipping_free: boolean;
  available_payment_method: Array<string>;
  cart: Array<CartItemInterface>;
}

export interface CartItemInterface {
  id: number;
  customer_id: number;
  cart_group_id: string;
  product_id: number;
  is_luck: boolean;
  variations: {
    size_options: string;
    Size: string;
    color_options: string;
    color: string;
    color_code: string;
  };
  category_name: string;
  product_variation_id: string;
  max_allowed_qty: string;
  vendor_name: string;
  quantity: number;
  discount_price: number;
  price: number;
  offer_price: number;
  tax: number;
  slug: string;
  name: string;
  count_of_pieces: number;
  shop: {
    image: string;
    name: string;
  };
  check_availability: boolean;
  brand: {
    id: number;
    slug: string;
    name: string;
    is_verified: any;
    icon: {
      file_path: string;
      original_width: string;
      original_height: string;
    };
  };
  boutique: {
    id: number;
    icon: {
      file_path: string;
      original_width: string;
      original_height: string;
    };
  };
  image: string;
  shipping_days: number;
  have_hurry_up_notify_time_left: boolean;
  have_hurry_up_notify_qty: boolean;
  qty_left: number;
  time_left_in_minutes: number;
  flash_deal_details: any;
  flash_deal_max_allowed_quantity: any;
  created_at: string;
  is_country_restricted: boolean;
  is_active: boolean;
  collected_after_ordering: any;
  available_quantity: number;
}
