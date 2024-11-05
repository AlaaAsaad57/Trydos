export interface Offer {
  photos: number[];
}
export interface Boutique {
  id: number;
  name: string;
  icon: string;
  slug: string;
  position: number;
  description: string;
  banners: Array<string>;
  mainCategoriesForProductIds: Array<{
    category_id: number;
    category_slug: string;
    category_name: string;
    category_icon: string;
    slug: string;
  }>;
  childCategoriesForProductIds: Array<{
    category_id: string;
    category_slug: string;
    count_products: number;
    category_name: string;
    product_name: string;
    product_thumbnail: string;
    most_viewed_product_thumbnail: string;
    most_viewed_product_name: string;
    slug: string;
  }>;
}
