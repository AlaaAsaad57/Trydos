import {
  Color,
  Currency,
  SyncColorImage,
} from "./productPagePropsType";
import { ProductInterface } from "models/Genaral/Product";
export interface ProductColorsPropsType {
  ProductColorsArray: Color[];
  colors: SyncColorImage[];
}

export interface CameraShotsPropsType {
  images: string[];
}

export interface ProductStoriesPropsType {
  id: number;
}

export interface ProductSizesPropsType {
  sizes: any;
}
export interface ProductShippingOptionPropsType {
  days: number;
}

export interface FreeShippingOptionPropsType {
  lang: string;
}
export interface ProductFooterSectionPropsType {
  product: ProductInterface;
  currency: Currency;
}
