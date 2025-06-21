import { Item } from "./OrderItemOptionsModalPropsType";

export interface ReturnOrderItemPropsType {
    close: Function,
    item: Item,
    setShouldConfirmReturn: Function,
    setShouldConfirmCancel: Function,
    setShouldConfirmChange: Function,
    changeOrderItem: Function,
    cancelOrderItem: Function,
}
