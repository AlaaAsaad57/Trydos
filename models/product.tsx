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
    image: string;
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
  price: number;
  price_formatted: string;
  offer_price: number;
  offer_price_formatted: string;
  is_favourite: boolean;
  in_stock: boolean;
  rating: {
    overall_rating: number;
    total_rating: number;
  };
  flash_deal_details: any;
  flash_deal_max_allowed_quantity: any;
};
