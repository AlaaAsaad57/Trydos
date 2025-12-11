export interface OrderItemOptionsModalPropsType {
  close?: Function;
  setShouldConfirmChange?: Function;
  setShouldConfirmCancel?: Function;
  setShouldConfirmReturn?: Function;
  item: Item;
  shouldConfirmChange?: Function;
  cancelOrderItem?: Function;
  closeOptions?: Function;
  backToMain?: Function;
}
export interface Item {
  collect_product_after_ordering: boolean;
  return: any;
  delivery_status: string;
  discount: number;
  discount_type: string;
  id: number;
  image: string;
  is_odoo_product: number;
  is_stock_decreased: number;
  odoo_id: number;
  odoo_order_id: number;
  order_id: number;
  order_status: {
    label: string;
    value: string;
  };
  payment_status: string;
  price: number;
  price_after_discount: number;
  product_details: ProductDetails;
  is_favourite: boolean;
  name: string;
  offer_price: number;
  rating: Rating;
  share_link: string;
  slug: string;
  thumbnail: string;
  product_id: number;
  product_slug: string;
  qty: number;
  refund_request: number;
  refund_request_status: any;
  shipping_method_id: any;
  tax: number;
  variant: string;
  variation: Variation;
}

export interface ProductDetails {
  count_of_pieces: number;
  details: string;
  id: number;
  images: string[];
  price: number;
  offer_price: number;
}

export interface Rating {
  overall_rating: number;
  total_rating: number;
}

export interface Variation {
  color: string;
  Size: string;
}
