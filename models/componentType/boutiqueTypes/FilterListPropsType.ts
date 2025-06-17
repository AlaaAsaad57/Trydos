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
    boutiques: any
    brands: Brand[]
    categories: Category[]
    colors: string[]
    prices: Price[]
    search_text: any
    sizes: string[]
  }
  
  export interface Brand {
    icon: string
    name: string
    slug: string
  }
  
  export interface Category {
    childes: Childe[]
    icon: string
    most_viewed_product_thumbnail: string
    name: string
    slug: string
  }
  
  export interface Childe {
    childes: Childe2[]
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
  