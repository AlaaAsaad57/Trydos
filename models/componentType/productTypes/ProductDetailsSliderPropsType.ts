import { Currency, ProductDataType } from "./productPagePropsType";

export interface ProductDetailsSliderPropsType {
  product: any;
  currency: Currency;
  images: string[] | { file_path }[];
}
