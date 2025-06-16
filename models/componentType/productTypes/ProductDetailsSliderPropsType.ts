import { Currency , ProductDataType } from "./productPagePropsType";


export interface ProductDetailsSliderPropsType {
    product: ProductDataType;
    currency: Currency;
    images: string[];
}