import { Currency, ProductDataType } from "./productPagePropsType";

export interface ProductDetailsSliderPropsType {
  images: string[] | { file_path }[];
  productGA: any;
  resetLoader?: boolean;
}
