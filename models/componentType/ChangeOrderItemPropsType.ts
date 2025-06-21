import { Item } from "./OrderItemOptionsModalPropsType";

export interface ChangeOrderItemPropsType {
    close?: Function,
    item: Item,
    setShouldConfirmChange: Function,
    changeOrderItem: Function,
    backToMain: Function,
}
