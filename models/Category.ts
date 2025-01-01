export interface Category {
  id: number;
  slug: string;
  name: string;
  description?: string;
  bio: string;
  flat_photo_path: string;
  outline_photo_path: string;
  png_photo_path?: string;
  fill_photo_path: string;
  banner_photo_path?: string;
  num_available_product: number;
  most_viewed_product_thumbnail: string;
}
