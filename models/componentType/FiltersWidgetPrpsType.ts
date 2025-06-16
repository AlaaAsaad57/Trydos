import { ProductDataType } from "./productTypes/productPagePropsType";

export interface FiltersWidgetPropsType {
    filters: FilterData;
    configureActiveFilters: Function;
}
export interface FilterData {
    categories: string[]
    brands: string[]
    colors: string[]
    prices: Prices
    sizes: string[]
    boutiques: string[]
    search_text: string
    products: ProductDataType[]
    prices_ranges: PricesRange[]
  }
  
  export interface Prices {
    min_price: number
    max_price: number
  }
  
  export interface PricesRange {
    from: number
    to: number
  }
  