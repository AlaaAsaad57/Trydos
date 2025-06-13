import { Currency } from "./boutiquePagePropsType";

export interface ProductListServerPropsType {
    params: {
        lang: string;
        boutiqueId?: string;
      };
      searchParams:any,
    products: ProductData[];
    currency: Currency;
    offset: number[];
    colors: string[];
    isFeatured?: boolean;
}

export interface ProductData {
    category: Category
    colors: Color[]
    details: string
    images: Image[]
    name: string
    offer_price: number
    price: number
    slug: string
    sync_color_images: SyncColorImage[]
    brand?: {
      icon?: string
    }
  }
  
  export interface Category {
    icon: string
    name: string
    flat_photo_path?: {
      file_path: string
    }
  }
  
  export interface Color {
    name: string
    color: string
  }
  
  export interface Image {
    file_path: string
  }
  
  export interface SyncColorImage {
    color_name: string
    images: Image2[]
  }
  
  export interface Image2 {
    file_path: string
  }
  