export interface BuyButtonProductPropsType {
  product: ProductData[];
}
export interface ProductData {
  category: Category;
  colors: Color[];
  details: string;
  images: Image[];
  name: string;
  offer_price: number;
  price: number;
  slug: string;
  sync_color_images?: SyncColorImage[];
  brand?: {
    icon?: string;
  };
  choice_options: ChoiceOption[];
  variation: { type: string; qty: number }[];
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
  option: string;
}

export interface Image {
  file_path: string;
}

export interface SyncColorImage {
  color_name: string;
  color_option: string;
  images: Image2[];
  sync_color_images: SyncColorImage[];
}

export interface Image2 {
  file_path: string;
}
export interface ChoiceOption {
  title: string;
  options: string[];
}
