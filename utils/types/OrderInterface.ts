export interface OrderInterface {
  id: number;
  customer_id: number;
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
    alternative_phone: string;
    created_at: string;
    updated_at: string;
    latitude: any;
    longitude: any;
    is_billing: number;
    is_default: number;
    email: any;
    cost: number;
    duration: any;
  };
  billing_address: any;
  billing_address_data: any;
  discount_type: any;
  coupon_code: any;
  shipping_method_id: number;
  order_group_id: string;
  verification_code: string;
  order_note: string;
  seller_id: string;
  owner_id: number;
  owner_type: string;
  created_at: string;
  order_has_return_request: boolean;
  return_request_id?: number;
  show_return_request: boolean;
  edit_return_request: boolean;
  can_return_order: boolean;
  can_exchange_order: boolean;
  can_update_address: boolean;
  can_cancele_order: boolean;
  can_change_variant: boolean;
  details: Array<{
    id: number;
    order_id: number;
    product_id: number;
    product_details: {
      id: number;
      name: string;
      slug: string;
      share_link: string;
      details: string;
      count_of_pieces: number;
      thumbnail: string;
      images: Array<string>;
      price: number;
      offer_price: number;
      is_favourite: boolean;
      rating: {
        overall_rating: number;
        total_rating: number;
      };
    };
    product_slug: string;
    qty: number;
    price: number;
    discount: number;
    price_after_discount: number;
    image: string;
    tax: number;
    delivery_status: string;
    payment_status: string;
    shipping_method_id: any;
    variant: string;
    collect_product_after_ordering: boolean;
    variation: Array<any>;
    discount_type: string;
    is_stock_decreased: number;
    refund_request: number;
    refund_request_status: any;
    is_odoo_product: number;
    odoo_id: number;
    odoo_order_id: number;
    comments: any;
  }>;
  checked_at: string;
}
type OriginalOrderDetail = OrderInterface["details"][number];

// 2. Define the new structure for the details items
// Your code adds 'order_status', 'order_id', and 'original_order_id' to every detail object
interface ModifiedOrderDetail extends OriginalOrderDetail {
  order_status: string; // From: baseOrder.order_status?.value
  order_id: number; // From: baseOrder.id
  original_order_id: number; // From: detail.order_id (renamed)
}

// 3. Define the final ModifiedOrderInterface
// It keeps all original fields but overrides the 'details' array
export interface ModifiedOrderInterface
  extends Omit<OrderInterface, "details"> {
  details: ModifiedOrderDetail[];
}

export interface OrderRatingData {
  id: string;
  customer: {
    id: string;
    name: string;
    image: string;
  };
  comments_images_customer: Array<any>;
  product_id: string;
  comment: string;
  created_at: string;
  good_quality_comment: boolean;
  star_rating: number;
  order_details_id: string;
}

export interface returnDetails {
  order_group_id: string;
  total_return_requests: number;
  return_requests_data: Array<{
    order_id: number;
    return_request_id: number;
    total_returnable_amount: number;
    description_returnable_amount_less_than_0: string;
    return_request_destination_id: number;
    status: {
      name: string;
      value: string;
    };
    order_details: Array<{
      detail_id: number;
      product_id: number;
      return_request_id: number;
      quantity: number;
      image: string;
      name: string;
      variant: string;
      product_price: number;
      subtotal: number;
      already_return: boolean;
      return_request_product_id: number;
      return_request_product_quantity: string;
      return_request_product_reason_id: number;
      return_request_product_details: any;
      return_request_product_status: {
        name: string;
        value: string;
      };
      images_url: Array<string>;
      img: Array<string>;
    }>;
  }>;
}

export interface orderChatDetails {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: any;
  detailed_error: any;
  data: {
    recipient: {
      id: string;
    };
    chat_participant: {
      id: string;
      delivery_user_id: string;
      original_user_id: string;
      order_id: string;
      parent_order_id: any;
      order_group_id: string;
      channel_id: any;
      created_at: string;
      updated_at: string;
    };
    channel: any | Channel;
  };
  success: boolean;
}
interface Channel {}
