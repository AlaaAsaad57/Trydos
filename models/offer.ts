export interface Offer {
  photos: number[];
}
export interface Boutique {
  id: number;
  name: string;
  icon: any;
  slug: string;
  position: number;
  description: string;
  banners: string[];
  mainCategoriesForProductIds: any[];
  childCategoriesForProductIds: any[];
}
