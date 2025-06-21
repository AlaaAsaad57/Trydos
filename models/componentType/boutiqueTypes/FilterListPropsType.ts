import { Currency , BoutiqueData } from "./boutiquePagePropsType";

export interface FilterListPropsType {
    searchParams: {
        [key: string]: string | string[] | undefined;
      };
      params: {
        lang: string;
        boutiqueId?: string;
      };
    filters: FilterData;
    currency: Currency;
    boutique?: BoutiqueData;
    isFeatured?: boolean;
}

export interface FilterData {
  flat_photo_path?: {
    file_path: string
  }
  
  icon?: {
    file_path: string
    replace?: (searchValue: string | RegExp, replaceValue: string) => string;
  }
    most_viewed_product_thumbnail?: string;
    name?: string;
    childes?: Childe[]
    id?: number;
    boutiques: any
    brands?: Brand[]
    categories: Category[]
    colors: string[]
    prices: Price[]
    search_text: any
    sizes: string[]
    slug?: string
    min_price?: number
    max_price?: number
  }
  
  export interface Brand {
    icon: string
    name: string
    slug: string
  }
  
  export interface Category {
    childes: Childe[]
    icon: {
      file_path: string
    }
    most_viewed_product_thumbnail: string
    name: string
    slug: string
  }
  
  export interface Childe {
    childes: Childe2[]
    icon: {
      file_path: string
    }
    most_viewed_product_thumbnail: string
    name: string
    slug: string
    flat_photo_path:{
      file_path: string
    }
  }
  
  export interface Childe2 {
    most_viewed_product_thumbnail: string
    name: string
    slug: string
  }
  
  export interface Price {
    min_price: number
    max_price: number
    products_count: number
  }
  