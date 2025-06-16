export interface SearchResultsPropsType {
    searchResults: SearchResultType[];
    closeSelect: () => void;
    shouldShowProvinces: boolean;
    searchAction: (e: string) => void;
}
export interface SearchResultType {
    boutiques: Boutique[]
    brands: Brand[]
    categories: Category[]
    colors: string[]
    prices: Prices
    prices_ranges: PricesRange[]
    products: any
    search_text: string
    sizes: string[]
  }
  
  export interface Boutique {
    banner?: Banner
    id: number
    name: string
    slug: string
  }
  
  export interface Banner {
    file_path?: string
    original_height?: string
    original_width?: string
  }
  
  export interface Brand {
    icon: string
    name: string
    slug: string
  }
  
  export interface Category {
    childes: Childe[]
    most_viewed_product_thumbnail: string
    name: string
    slug: string
    icon?: string
  }
  
  export interface Childe {
    childes: Childe2[]
  }
  
  export interface Childe2 {
    most_viewed_product_thumbnail: string
    name: string
    slug: string
  }
  
  export interface Prices {
    max_price: number
    min_price: number
  }
  
  export interface PricesRange {
    max_price: number
    min_price: number
    products_count: number
  }
  