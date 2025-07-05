import { Currency } from "./boutiquePagePropsType";

export interface ProductListServerPropsType {
  isFlashDeals?: boolean;
  parsedFilters?: any;
  params: {
    lang: string;
    boutiqueId?: string;
  };
  searchParams?: URLSearchParams;
  products: ProductData[];
  currency: Currency;
  offset: number;
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
  };
  category: {
    name: string;
    icon?: string;
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
