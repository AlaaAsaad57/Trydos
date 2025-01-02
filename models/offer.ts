export interface Offer {
  photos: number[];
}
export interface Boutique {
  id: number;
  name: string;
  icon: {
    file_path: string;
  };
  slug: string;
  position: number;
  description: string;
  banners: Array<{
    file_path: string;
  }>;
  mainCategoriesForProductIds: Array<{
    id: number;
    slug: string;
    name: string;
    flat_photo_path: {
      file_path: string;
    };
    most_viewed_product_thumbnail: {
      file_path: string;
    };
  }>;
  childCategoriesForProductIds: Array<{
    id: number;
    slug: string;
    name: string;
    most_viewed_product_name: string;
    most_viewed_product_thumbnail: string;
    num_available_product: number;
  }>;
}
