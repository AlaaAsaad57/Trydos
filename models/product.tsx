export type ProductInterface = {
  id: number;
  name: string;
  slug: string;
  share_link: string;
  details: string;
  thumbnail: string;
  images: Array<string>;
  categories: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
  category: {
    id: number;
    name: string;
    icon: string;
  };
  brand: {
    id: number;
    name: string;
    icon: string;
  };
  colors: Array<{
    name: string;
    color: string;
  }>;
  sync_color_images: Array<{
    color_name: string;
    images: Array<string>;
    color_trend: boolean;
  }>;
  flash_deal_details: any;
  flash_deal_max_allowed_quantity: any;
  description: any;
  model: any;
  in_stock: boolean;
  variation: Array<{
    type: string;
    price: number;
    price_formated: string;
    offer_price: number;
    offer_price_formated: string;
    sku: string;
    qty: number;
  }>;
  choice_options: Array<any>;
  has_discount: boolean;
  has_tax: boolean;
  tax: string;
  unit_price: string;
  current_stock: number;
  Left_stock: number;
  price: number;
  price_formatted: string;
  offer_price: number;
  offer_price_formatted: string;
  seller_id: any;
  seller: {
    name: any;
    f_name: any;
    l_name: any;
    email: any;
    gender: any;
    birthdate: any;
    review: any;
    image: any;
  };
  shop: {
    image: string;
    name: string;
  };
  has_whole_sale: boolean;
  whole_sale_link: any;
  views_count: number;
  descriptors: Array<{
    descriptor_group: {
      name: string;
      icon: string;
      description: string;
    };
    descriptors: Array<{
      descriptor: {
        name: string;
        icon: string;
        description: string;
      };
      value: string;
    }>;
  }>;
};
