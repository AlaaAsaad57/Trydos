import { OrderItem } from "./ModifyOrderWidgetPropsType";
export interface ModifyOrderItemModalPropsType {
  orderItem: OrderItem;
  setConfirmationData: (e: any) => void;
  type: string;
  confirmationData: any;
  getOrderDetails: () => void;
  close: () => void;
}
