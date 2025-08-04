export interface OfferAvatarsPropsType {
  priority: boolean;
  boutique: BoutiqueData;
}
export interface BoutiqueData {
  id: number;
  icon: string;
  name: string;
  description: string;
  childCategoriesForProductIds: ChildCategoriesForProductIds[];
  mainCategoriesForProductIds: MainCategoriesForProductIds[];
  slug: string;
  banners: Banner[];
}
export interface MainCategoriesForProductIds {
  id: number;
  slug: string;
  name: string;
  flat_photo_path: string;
}
export interface ChildCategoriesForProductIds {
  id: number;
  name: string;
  slug: string;
  most_viewed_product_name: string;
  most_viewed_product_thumbnail: string;
}
export interface Banner {
  file_path: string;
}
