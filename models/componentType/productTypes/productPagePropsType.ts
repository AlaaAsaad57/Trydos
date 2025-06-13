

export interface ProductPagePropsType {
    params: {
        lang: string;
        productId: string;
      };
      searchParams: {
        color: string;
      };
}

export interface ProductDataType {
    id: number
    name: string
    slug: string
    share_link: string
    details: string
    thumbnail: string
    images: string[]
    categories: Category[]
    category: Category2
    brand: Brand
    colors: Color[]
    sync_color_images: SyncColorImage[]
    flash_deal_details: any
    flash_deal_max_allowed_quantity: any
    shipping_days: number
    description: any
    model: any
    variation: Variation[]
    choice_options: any[]
    has_discount: boolean
    has_tax: boolean
    shipping_cost_multiply_with_quantity: boolean
    shipping_cost: number
    price: number
    offer_price: number
    tax: number
    unit_price: number
    seller_id: number
    seller: Seller
    shop: Shop
    has_whole_sale: boolean
    whole_sale_link: any
    views_count: number
    descriptors: any[]
    is_country_restricted: boolean
    is_active: boolean
    collected_after_ordering: number
    available_quantity: number
    sku?: string
  }
  
  export interface Category {
    id: number
    name: string
    icon: string
  }
  
  export interface Category2 {
    id: number
    name: string
    icon: string
  }
  
  export interface Brand {
    id: number
    slug: string
    name: string
    icon: string
  }
  
  export interface Color {
    name: string
    color: string
  }
  
  export interface SyncColorImage {
    color_name: string
    images: string[]
    color_trend: boolean
  }
  
  export interface Variation {
    type: string
    price: number
    offer_price: number
    sku: string
    qty: number
  }
  
  export interface Seller {
    name: any
    f_name: string
    l_name: string
    email: string
    gender: any
    birthdate: string
    review: number
    image: string
  }
  
  export interface Shop {
    image: string
    name: string
  }
  
  export interface Currency {
    id: number
    name: string
    symbol: string
    code: string
    exchange_rate: number
    }