import { Currency } from "./boutiquePagePropsType";

export interface ProductListServerPropsType {
  isFlashDeals?: boolean;
  parsedFilters?: any;
  params: {
    lang: string;
    boutiqueId?: string;
  };
  searchParams?: URLSearchParams;
  products: {
    id: string;
    product_id?: string;
    name?: string;
    slug?: string;
    status?: number;
    details?: string;
    language_code?: string;
    label_names?: string[];
    videos?: any[];
    thumbnail?: string;
    images?: any[];
    colors?: any[];
    sync_color_images?: any[];
    price?: number;
    offer_price?: number;
    boutique_id?: string;
    in_stock?: boolean;
    [key: string]: any;
  }[];
  currency: any;
  offset: any[];
  colors: string[];
  isFeatured?: boolean;
}

export interface ProductData {
  name: string;
  id?: string;
  slug: string;
  flash_deal_end_date: string;
  details: string;
  colors: any[];
  images: Array<{ file_path: string }>;
  sync_color_images: Array<{
    color_name: string;
    images: Array<{ file_path: string }>;
  }>;
  price: number;
  offer_price?: number;
  brand: {
    name: string;
    icon?: string;
    id: string;
  };
  category: {
    name: string;
    icon?: string;
    id: string;
  };
}

export interface Category {
  icon: string;
  name: string;
  flat_photo_path?: {
    file_path: string;
  };
}

export interface Color {
  name: string;
  color: string;
}

export interface Image {
  file_path: string;
}

export interface SyncColorImage {
  color_name: string;
  images: Image2[];
}

export interface Image2 {
  file_path: string;
}
