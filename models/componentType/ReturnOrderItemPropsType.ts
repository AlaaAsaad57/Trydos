import { Item } from "./OrderItemOptionsModalPropsType";

export interface ReturnOrderItemPropsType {
    close?: Function,
    item: Item,
    closeOptions?: Function,
    backToMain?: Function,
    setShouldConfirmReturn?: Function,
    setShouldConfirmCancel?: Function,
    setShouldConfirmChange?: Function,
    changeOrderItem?: Function,
    cancelOrderItem?: Function,
}
