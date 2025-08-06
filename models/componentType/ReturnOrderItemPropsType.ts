import { Item } from "./OrderItemOptionsModalPropsType";

export interface ReturnOrderItemPropsType {
  item: Item;
  backToMain?: Function;
  setShouldConfirmReturn?: Function;
}
