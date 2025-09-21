export interface OrderItemsListPropsType {
  items: OrderItem[];
  isExpanded: boolean;
  setExpanded: (s: boolean) => void;
  order_group_status: {
    label: string;
    value: string;
  };
  shouldShowChat: () => boolean;
  showChats: Function;
  getOrderDetails: () => void;
  getProductUrl: (e: any) => string;
}
export interface OrderItem {
  collect_product_after_ordering: boolean;
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
  payment_status: string;
  price: number;
  price_after_discount: number;
  product_details: ProductDetails;
  product_id: number;
  product_slug: string;
  qty: number;
  refund_request: number;
  refund_request_status: any;
  shipping_method_id: any;
  tax: number;
  variant: string;
  variation: any;
  comments: any;
  is_returned: any;
}

export interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  share_link: string;
  details: string;
}

export interface OrderStatusIconPropsType {
  status: string;
}
