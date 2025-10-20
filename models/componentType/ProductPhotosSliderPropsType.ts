export interface ProductPhotosSliderPropsType {
  product: {
    name?: string;
    sync_color_images: SyncColorImage[];
    images: Image[];
    videos?: string[]; // Optional array of video filenames
    flash_deal_end_date?: string;
    offer_price?: number;
    price?: number;
    slug: string;
    is_redeem?: boolean;
  };
  shouldshowRedem?: boolean;
  images?: any[];
  Sliders?: boolean;
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
