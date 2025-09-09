import { ProductInterface } from "models/Genaral/Product";
export interface ProductDetailsTextProps {
  details: string;
  product: ProductInterface["sync_color_images"];
  language: string;
}
