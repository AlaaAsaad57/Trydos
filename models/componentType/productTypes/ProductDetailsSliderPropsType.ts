import { Currency, ProductDataType } from "./productPagePropsType";

export interface ProductDetailsSliderPropsType {
  currency: Currency;
  images: string[] | { file_path }[];
  productGA: any;
}
