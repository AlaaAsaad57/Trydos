import { Item } from "./OrderItemOptionsModalPropsType";

export interface CancelOrderItemPropsType {
    cancelOrderItem: Function,
    backToMain: Function,
    setShouldConfirmCancel: Function,
    item: Item,
}