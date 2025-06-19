import { Item } from "./OrderItemOptionsModalPropsType";
import { ProductData } from "./BuyButtonProductPropsType";

export interface ChangeSizeWidgetPropsType {
    size: string,
    setSize: Function,
    item: Item,
    productData: ProductData    ,
}