export interface CartItem{
    id: number;
    check_availability: boolean;
    customer_id: number;
    is_active: boolean;
    collected_after_ordering?: boolean;
    is_country_restricted: boolean;
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
    count_of_pieces: number;
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
    shipping_days: number;
    have_hurry_up_notify_time_left: boolean;
    have_hurry_up_notify_qty: boolean;
    qty_left: number;
    time_left_in_minutes: number;
  }