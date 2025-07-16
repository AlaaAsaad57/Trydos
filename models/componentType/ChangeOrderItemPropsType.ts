import { Item } from "./OrderItemOptionsModalPropsType";

export interface ChangeOrderItemPropsType {
  close?: Function;
  item: Item;
  setShouldConfirmChange: Function;
  backToMain: Function;
  shouldConfirmChange: any;
}
