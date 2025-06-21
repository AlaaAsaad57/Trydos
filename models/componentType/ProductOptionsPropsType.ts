
export interface ProductOptionsPropsType {
    activeOption: string;
    setOption: (e: string) => void;
    clearShare: () => void;
    loading: boolean;
    shareAction: () => void;
    productDetails: ProductDetails;
    product: any;
    share: boolean;
    selectedColor?: {
      color_name: string;
    images?: Array<string>;
    color_trend?: boolean;
    }
}
export interface Product {
    quantity?: number;
    available_quantity: number
    brand: Brand
    categories: Category[]
    category: Category2
    choice_options: ChoiceOption[]
    collected_after_ordering: number
    colors: Color[]
    description: string
    descriptors: string[]
    details: string
    flash_deal_details: string
    flash_deal_max_allowed_quantity: number
    has_discount: boolean
    has_tax: boolean
    has_whole_sale: boolean
    id: number
    images: string[]
    is_active: boolean
    is_country_restricted: boolean
    model: string
    name: string
    offer_price: number
    price: number
    seller: Seller
    seller_id: number
    share_link: string
    shipping_cost: number
    shipping_cost_multiply_with_quantity: boolean
    shipping_days: number
    shop: Shop
    slug: string
    sync_color_images: SyncColorImage[]
    tax: number
    thumbnail: string
    unit_price: number
    variation: Variation[]
    views_count: number
    whole_sale_link: string
  }
  
  export interface Brand {
    icon: string
    id: number
    name: string
    slug: string
  }
  
  export interface Category {
    icon: string
    id: number
    name: string
  }
  
  export interface Category2 {
    icon: string
    id: number
    name: string
  }
  
  export interface ChoiceOption {
    name: string
    options: string[]
    title: string
  }
  
  export interface Color {
    color: string
    name: string
  }
  
  export interface Seller {
    birthdate: string
    email: string
    f_name: string
    gender: string
    image: string
    l_name: string
    name: string
    review: string
  }
  
  export interface Shop {
    image: string
    name: string
  }
  
  export interface SyncColorImage {
    color_name: string
    color_trend: boolean
    images: string[]
  }
  
  export interface Variation {
    offer_price: number
    price: number
    qty: number
    sku: string
    type: string
  }
  
  export interface ProductDetails {
    comment_count: number
    comments: string[]
    likes: number
    shares: string
  }
  