export type CartInterface = {
  sub_total: number;
  sub_total_formated: string;
  total_tax: number;
  total_tax_formated: string;
  total_discount_on_product: number;
  total_discount_on_product_formated: string;
  total_shipping_cost: number;
  total_shipping_cost_formated: string;
  coupon_discount: number;
  coupon_discount_formated: string;
  cod_cost: number;
  cod_cost_formated: string;
  has_cod: boolean;
  limitFree: number;
  limitFree_formated: string;
  estimated_tax: number;
  estimated_tax_formated: string;
  total: number;
  total_formated: string;
  rest_for_free_shipping: number;
  rest_for_free_shipping_formatted: string;
  show_message_reset_for_shipping_free: boolean;
  available_payment_method: Array<string>;
  total_cash: number;
  total_cash_formated: string;
  cart: Array<{
    id: number;
    customer_id: number;
    cart_group_id: string;
    product_id: number;
    choices: Array<{
      choice_1: string;
    }>;
    variations: Array<{
      Size: string;
    }>;
    variant: string;
    available_quantity: number;
    max_allowed_qty: string;
    vendor_name: string;
    quantity: number;
    discount: number;
    price: number;
    offer_price: number;
    tax: number;
    slug: string;
    name: string;
    shop: {
      image: string;
      name: string;
    };
    brand: {
      id: number;
      name: string;
      slug: string;
      image: string;
    };
    boutique: {
      id: number;
      icon: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
    };
    thumbnail: string;
    image: string;
    created_at: string;
    flash_deal_details: any;
    flash_deal_max_allowed_quantity: any;
  }>;
};
