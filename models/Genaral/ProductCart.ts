export interface ProductCart {
  id: number;
  customer_id: number;
  cart_group_id: string;
  product_id: number;
  choices: Array<{
    choice_1: string;
  }>;
  variations: Array<{
    color: string;
    Size: string;
  }>;
  variant: string;
  max_allowed_qty: string;
  vendor_name: string;
  quantity: number;
  discount: number;
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
  thumbnail: string;
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
