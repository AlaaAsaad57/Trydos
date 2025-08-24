export interface OrderItem {
  id: number;
  customer_id: number;
  return_details: any;
  payment_status: string;
  order_status: {
    value: string;
    label: string;
  };
  order_group_status: {
    value: string;
    label: string;
  };
  payment_method: {
    value: string;
    label: string;
  };

  transaction_ref: string;
  order_amount: number;
  partial_payment_by_wallet: number;
  discount_amount: number;
  shipping_cost: number;
  shipping_address: number;
  shipping_address_data: {
    id: number;
    country_iso: string;
    customer_id: number;
    contact_person_name: string;
    address_type: string;
    address: string;
    address_detail: string;
    country: string;
    province: string;
    city: string;
    town: string;
    street: string;
    building: string;
    zip: string;
    phone: string;
    alternative_phone: string | null;
    created_at: string;
    updated_at: string;
    latitude: string;
    longitude: string;
    is_billing: number;
    is_default: number;
    email: string | null;
    cost: string;
    duration: string | null;
  };
  billing_address: number | null;
  billing_address_data: any | null;
  discount_type: string | null;
  coupon_code: string | null;
  shipping_method_id: number;
  order_group_id: string;
  verification_code: string;
  order_note: string;
  seller_id: string;
  created_at: string;
  order_can_return: boolean;
  order_has_return_request: boolean;
  return_request_id: number | null;
  show_return_request: boolean;
  edit_return_request: boolean;
  order_can_exchange: boolean;
  can_cancele_order: boolean;
  details: OrderDetail[];
}

export interface OrderDetail {
  id: number;
  order_id: number;
  product_id: number;
  product_slug: string;
  return_status?: string;
  return: {
    [key: string]: any;
    subtotal: number;
  };
  is_returned?: boolean;
  is_canceled?: boolean;
  image: string;
  order_status: string;
  product_details: {
    id: number;
    count_of_pieces: any;
    name: string;
    slug: string;
    share_link: string;
    details: string | null;
    thumbnail: string;
    images: string[];
    price: number;
    offer_price: number;
    is_favourite: boolean;
    is_active: boolean;
    rating: {
      overall_rating: number;
      total_rating: number;
    };
  };
  qty: number;
  price: number;
  discount: number;
  price_after_discount: number;
  tax: number;
  delivery_status: string;
  payment_status: string;
  shipping_method_id: number | null;
  variant: string;
  collect_product_after_ordering: boolean;
  variation: {
    color?: string;
    Size?: string;
  } | null;
  discount_type: string;
  is_stock_decreased: number;
  refund_request: number;
  refund_request_status: string | null;
  is_odoo_product: number;
  odoo_id: number;
  odoo_order_id: number;
}

export interface OrdersResponse {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: string;
  detailed_error: string | null;
  data: {
    total: number;
    limit: number;
    orders: OrderItem[];
    offset: number;
  };
}
