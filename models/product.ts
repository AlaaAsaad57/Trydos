export interface ProductInterface {
  slug: string;
  name: string;
  thumbnail?: string;
  price: number;
  offer_price?: number;
  colors?: Array<{
    color: string;
    name: string;
  }>;
  choice_options?: Array<{
    title: string;
    options: Array<{
      name: string;
    }>;
  }>;
  details?:
    | string
    | Array<{
        title: string;
        value: string;
      }>;
}
