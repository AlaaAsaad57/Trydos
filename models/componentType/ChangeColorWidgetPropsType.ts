import { ProductData } from "./BuyButtonProductPropsType";
import { Item } from "./OrderItemOptionsModalPropsType";

export interface ChangeColorWidgetPropsType {
    color: string,
    setColor: Function,
    item: Item,
    productData: ProductData    ,
}
